from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone
from backend.app.core.database import get_db
from backend.app.models.models import Household, Shelter, Alert, RescueRequest
from backend.app.schemas.schemas import (
    CitizenPortalData, CitizenStatusAction, HouseholdResponse, ShelterResponse, AlertResponse
)
from backend.app.engines.dispatch.routing_optimizer import routing_optimizer

router = APIRouter(prefix="/citizen", tags=["Citizen Portal"])

@router.get("/household", response_model=CitizenPortalData)
def get_citizen_data(household_id: Optional[str] = "HH-CHE-001", db: Session = Depends(get_db)):
    hh = db.query(Household).filter(Household.household_id == household_id).first()
    if not hh:
        raise HTTPException(status_code=404, detail="Household profile not found")
        
    # Get closest shelter
    shelters = db.query(Shelter).filter(Shelter.status != "closed").all()
    shelter_responses = []
    for s in shelters[:3]:
        shelter_responses.append(ShelterResponse(
            id=s.id,
            shelter_id=s.shelter_id,
            name=s.name,
            city=s.city,
            neighbourhood=s.neighbourhood,
            latitude=s.latitude,
            longitude=s.longitude,
            capacity=s.capacity,
            current_occupancy=s.current_occupancy,
            available_capacity=max(0, s.capacity - s.current_occupancy),
            is_accessible=s.is_accessible,
            amenities=s.amenities_json or [],
            status=s.status,
            contact_person=s.contact_person,
            contact_phone=s.contact_phone
        ))
        
    # Active alert for this household
    active_alert = db.query(Alert).filter(
        Alert.household_id == household_id
    ).order_by(Alert.created_at.desc()).first()
    
    # Safe route
    target_shelter = shelters[0] if shelters else None
    safe_route = None
    if target_shelter:
        safe_route = routing_optimizer.find_safest_evacuation_route(
            household_id=hh.household_id,
            origin_coords=(hh.latitude, hh.longitude),
            shelter_id=target_shelter.shelter_id,
            shelter_name=target_shelter.name,
            dest_coords=(target_shelter.latitude, target_shelter.longitude)
        )
        
    local_flood_info = {
        "neighbourhood": hh.neighbourhood,
        "flood_exposure_percent": int(hh.flood_exposure * 100),
        "vulnerability_score": hh.vulnerability_score,
        "risk_category": hh.risk_category,
        "current_status": hh.evacuation_status,
        "ground_floor_alert": hh.ground_floor_status
    }
    
    return CitizenPortalData(
        household=HouseholdResponse.model_validate(hh),
        local_flood_risk=local_flood_info,
        nearest_shelters=shelter_responses,
        active_alert=AlertResponse.model_validate(active_alert) if active_alert else None,
        safe_route=safe_route
    )

@router.post("/safe")
def mark_citizen_safe(action: CitizenStatusAction, db: Session = Depends(get_db)):
    hh = db.query(Household).filter(Household.household_id == action.household_id).first()
    if not hh:
        raise HTTPException(status_code=404, detail="Household not found")
        
    hh.evacuation_status = "safe"
    hh.notes = f"Citizen confirmed SAFE at {datetime.now(timezone.utc).strftime('%H:%M:%S UTC')}."
    
    # If there's a pending rescue request, mark completed/cancelled
    pending_req = db.query(RescueRequest).filter(
        RescueRequest.household_id == action.household_id,
        RescueRequest.status.in_(["pending", "assigned", "in_progress"])
    ).first()
    if pending_req:
        pending_req.status = "completed"
        pending_req.resolved_at = datetime.now(timezone.utc)
        
    db.commit()
    return {
        "status": "success",
        "household_id": action.household_id,
        "evacuation_status": "safe",
        "message": "Status recorded. Thank you for notifying responders you are safe."
    }

@router.post("/request-help")
def citizen_request_help(action: CitizenStatusAction, db: Session = Depends(get_db)):
    hh = db.query(Household).filter(Household.household_id == action.household_id).first()
    if not hh:
        raise HTTPException(status_code=404, detail="Household not found")
        
    hh.evacuation_status = "rescue_required"
    
    req_id = f"SOS-{hh.household_id}-{int(datetime.now().timestamp())%10000}"
    rescue_req = RescueRequest(
        request_id=req_id,
        household_id=hh.household_id,
        status="pending",
        priority_level="Critical" if (action.medical_urgency or hh.mobility_status in ["bedridden", "wheelchair_dependent"]) else "High",
        people_count=action.people_count or hh.household_size,
        medical_emergency=action.medical_urgency or (hh.mobility_status in ["bedridden", "wheelchair_dependent"]),
        details=action.additional_notes or "Immediate distress signal submitted via Citizen Mobile Portal."
    )
    db.add(rescue_req)
    db.commit()
    
    return {
        "status": "success",
        "request_id": req_id,
        "evacuation_status": "rescue_required",
        "message": "Emergency SOS registered! Rescue dispatch team notified."
    }
