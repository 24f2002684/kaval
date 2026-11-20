from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from backend.app.core.database import get_db
from backend.app.models.models import Household, VulnerabilityScore, ResponderActivity
from backend.app.schemas.schemas import (
    HouseholdResponse, HouseholdStatusUpdate, VulnerabilityWeights, VULNRecalculateResponse
)
from backend.app.engines.vuln.scoring import vuln_engine

router = APIRouter(prefix="/vuln", tags=["VULN Household Engine"])

@router.get("/households", response_model=List[HouseholdResponse])
def get_households(
    city: str = "Chennai",
    neighbourhood: Optional[str] = None,
    risk_category: Optional[str] = None,
    evacuation_status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 200,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Household).filter(Household.city == city)
    
    if neighbourhood:
        query = query.filter(Household.neighbourhood == neighbourhood)
    if risk_category:
        query = query.filter(Household.risk_category == risk_category)
    if evacuation_status:
        query = query.filter(Household.evacuation_status == evacuation_status)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Household.household_id.ilike(search_pattern)) |
            (Household.contact_name.ilike(search_pattern)) |
            (Household.address.ilike(search_pattern))
        )
        
    query = query.order_by(Household.vulnerability_score.desc())
    return query.offset(offset).limit(limit).all()

@router.get("/households/{household_id}")
def get_household_detail(household_id: str, db: Session = Depends(get_db)):
    hh = db.query(Household).filter(Household.household_id == household_id).first()
    if not hh:
        raise HTTPException(status_code=404, detail=f"Household {household_id} not found")
        
    hh_dict = {
        "household_id": hh.household_id,
        "flood_exposure": hh.flood_exposure,
        "elderly_count": hh.elderly_count,
        "children_count": hh.children_count,
        "disabled_count": hh.disabled_count,
        "mobility_status": hh.mobility_status,
        "ground_floor_status": hh.ground_floor_status,
        "building_type": hh.building_type,
        "distance_to_shelter": hh.distance_to_shelter
    }
    score, cat, breakdown = vuln_engine.calculate_household_vulnerability(hh_dict)
    
    return {
        "household": HouseholdResponse.from_orm(hh),
        "breakdown": breakdown
    }

@router.get("/priority-queue", response_model=List[HouseholdResponse])
def get_priority_queue(
    city: str = "Chennai",
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Returns prioritized emergency queue: Critical and High risk households first
    """
    households = db.query(Household).filter(
        Household.city == city,
        Household.evacuation_status.in_(["rescue_required", "contacted", "evacuation_initiated"])
    ).order_by(Household.vulnerability_score.desc()).limit(limit).all()
    return households

@router.post("/recalculate", response_model=VULNRecalculateResponse)
def recalculate_vulnerability_scores(weights: VulnerabilityWeights, db: Session = Depends(get_db)):
    """
    Dynamically recalculates all household vulnerability scores with customized weights.
    """
    vuln_engine.update_weights(weights)
    households = db.query(Household).all()
    
    counts = {"Critical": 0, "High": 0, "Moderate": 0, "Low": 0}
    
    for hh in households:
        hh_dict = {
            "household_id": hh.household_id,
            "flood_exposure": hh.flood_exposure,
            "elderly_count": hh.elderly_count,
            "children_count": hh.children_count,
            "disabled_count": hh.disabled_count,
            "mobility_status": hh.mobility_status,
            "ground_floor_status": hh.ground_floor_status,
            "building_type": hh.building_type,
            "distance_to_shelter": hh.distance_to_shelter
        }
        score, cat, _ = vuln_engine.calculate_household_vulnerability(hh_dict, weights)
        hh.vulnerability_score = score
        hh.risk_category = cat
        counts[cat] = counts.get(cat, 0) + 1
        
    db.commit()
    
    top_vulnerable = db.query(Household).order_by(Household.vulnerability_score.desc()).limit(15).all()
    
    return VULNRecalculateResponse(
        total_evaluated=len(households),
        critical_count=counts["Critical"],
        high_count=counts["High"],
        moderate_count=counts["Moderate"],
        low_count=counts["Low"],
        weights_used=weights,
        top_vulnerable=[HouseholdResponse.from_orm(h) for h in top_vulnerable]
    )

@router.patch("/households/{household_id}/status")
def update_household_status(
    household_id: str,
    status_update: HouseholdStatusUpdate,
    db: Session = Depends(get_db)
):
    valid_statuses = ["contacted", "evacuation_initiated", "safe", "rescue_required", "unreachable"]
    new_status = status_update.evacuation_status.lower()
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
    hh = db.query(Household).filter(Household.household_id == household_id).first()
    if not hh:
        raise HTTPException(status_code=404, detail="Household not found")
        
    hh.evacuation_status = new_status
    if status_update.notes:
        hh.notes = f"{hh.notes or ''} | {status_update.notes}".strip()
        
    activity = ResponderActivity(
        responder_id="Active Responder",
        household_id=household_id,
        action_type=f"status_updated_to_{new_status}",
        notes=status_update.notes
    )
    db.add(activity)
    db.commit()
    return {"status": "success", "household_id": household_id, "new_status": new_status}
