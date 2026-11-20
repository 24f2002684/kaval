from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from backend.app.core.database import get_db
from backend.app.models.models import Alert, Household, Shelter, RoadSegment
from backend.app.schemas.schemas import (
    AgentDecisionRequest, AgentDecisionResponse, SafeRouteResponse,
    AlertGenerateRequest, AlertResponse, AlertApprovalRequest
)
from backend.app.engines.dispatch.agent import DispatchAgent
from backend.app.engines.dispatch.routing_optimizer import routing_optimizer
from backend.app.engines.dispatch.multilingual import generate_multilingual_alert

router = APIRouter(prefix="/dispatch", tags=["DISPATCH Engine"])

class DirectRouteRequest(BaseModel):
    household_id: str
    shelter_id: Optional[str] = None

@router.post("/recommend", response_model=AgentDecisionResponse)
def get_agent_recommendation(req: AgentDecisionRequest, db: Session = Depends(get_db)):
    """
    Executes the DISPATCH AI Agent decision loop across all 8 tools.
    """
    agent = DispatchAgent(db)
    decision = agent.execute_decision_pipeline(req.household_id, req.language or "ta")
    return decision

@router.post("/route", response_model=SafeRouteResponse)
def calculate_evacuation_route(req: DirectRouteRequest, db: Session = Depends(get_db)):
    """
    Calculates safe evacuation corridor avoiding flooded road segments.
    """
    hh = db.query(Household).filter(Household.household_id == req.household_id).first()
    if not hh:
        raise HTTPException(status_code=404, detail=f"Household {req.household_id} not found")
        
    if req.shelter_id:
        shelter = db.query(Shelter).filter(Shelter.shelter_id == req.shelter_id).first()
    else:
        # Find nearest open shelter
        shelters = db.query(Shelter).filter(Shelter.status != "closed").all()
        if not shelters:
            raise HTTPException(status_code=500, detail="No active emergency shelters registered")
        shelter = shelters[0]
        
    # Load current road network into optimizer
    roads = db.query(RoadSegment).all()
    roads_list = [
        {
            "road_id": r.road_id,
            "start_node": r.start_node,
            "end_node": r.end_node,
            "length_meters": r.length_meters,
            "elevation_m": r.elevation_m,
            "flood_risk_score": r.flood_risk_score,
            "water_depth_cm": r.water_depth_cm,
            "status": r.status,
            "coordinates": r.coordinates_json
        }
        for r in roads
    ]
    routing_optimizer.load_road_network(roads_list)
    
    route = routing_optimizer.find_safest_evacuation_route(
        household_id=hh.household_id,
        origin_coords=(hh.latitude, hh.longitude),
        shelter_id=shelter.shelter_id,
        shelter_name=shelter.name,
        dest_coords=(shelter.latitude, shelter.longitude)
    )
    return route

@router.post("/generate-alert", response_model=AlertResponse)
def generate_evacuation_alert(req: AlertGenerateRequest, db: Session = Depends(get_db)):
    hh = db.query(Household).filter(Household.household_id == req.household_id).first()
    if not hh:
        raise HTTPException(status_code=404, detail="Household not found")
        
    shelters = db.query(Shelter).all()
    shelter_name = shelters[0].name if shelters else "Designated Community Relief Center"
    
    alerts = generate_multilingual_alert(
        household_name=hh.contact_name,
        neighbourhood=hh.neighbourhood,
        risk_level=hh.risk_category,
        shelter_name=shelter_name,
        recommended_action="Follow the designated elevated corridor to avoid canal backflow."
    )
    
    chosen_text = alerts.get(req.language, alerts["ta"])
    title = f"KAVAL EMERGENCY ALERT – {hh.neighbourhood}" if req.language == "en" else f"காவல் அவசர எச்சரிக்கை – {hh.neighbourhood}"
    
    alert_record = Alert(
        alert_id=f"ALT-{hh.household_id}-{int(datetime.now().timestamp())%10000}",
        household_id=hh.household_id,
        recipient_phone=hh.contact_number,
        language=req.language,
        title=title,
        message_body=chosen_text,
        severity=hh.risk_category,
        status="pending_approval"
    )
    db.add(alert_record)
    db.commit()
    db.refresh(alert_record)
    return alert_record

@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)
    return query.order_by(Alert.created_at.desc()).all()

@router.post("/alerts/{alert_id}/approve", response_model=AlertResponse)
def approve_alert(alert_id: str, db: Session = Depends(get_db)):
    """
    Human-in-the-loop disaster officer authorization
    """
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.status = "dispatched"
    alert.approved_by = "Disaster Management Officer (Duty Control)"
    alert.dispatched_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return alert

@router.post("/alerts/{alert_id}/reject", response_model=AlertResponse)
def reject_alert(alert_id: str, req: AlertApprovalRequest, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.status = "rejected"
    alert.rejection_reason = req.rejection_reason or "Cancelled by Disaster Management Officer"
    db.commit()
    db.refresh(alert)
    return alert
