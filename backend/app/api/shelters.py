from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from backend.app.core.database import get_db
from backend.app.models.models import Shelter
from backend.app.schemas.schemas import ShelterResponse, ShelterUpdate

router = APIRouter(prefix="/shelters", tags=["Shelters"])

class ShelterCreate(BaseModel):
    shelter_id: str
    name: str
    city: str = "Chennai"
    neighbourhood: str
    latitude: float
    longitude: float
    capacity: int
    is_accessible: bool = True
    amenities: List[str] = ["drinking_water", "hot_meals", "power_backup"]
    contact_person: str
    contact_phone: str

@router.get("", response_model=List[ShelterResponse])
def get_shelters(city: str = "Chennai", db: Session = Depends(get_db)):
    shelters = db.query(Shelter).filter(Shelter.city == city).all()
    out = []
    for s in shelters:
        avail = max(0, s.capacity - s.current_occupancy)
        out.append(ShelterResponse(
            id=s.id,
            shelter_id=s.shelter_id,
            name=s.name,
            city=s.city,
            neighbourhood=s.neighbourhood,
            latitude=s.latitude,
            longitude=s.longitude,
            capacity=s.capacity,
            current_occupancy=s.current_occupancy,
            available_capacity=avail,
            is_accessible=s.is_accessible,
            amenities=s.amenities_json or [],
            status=s.status,
            contact_person=s.contact_person,
            contact_phone=s.contact_phone
        ))
    return out

@router.patch("/{shelter_id}", response_model=ShelterResponse)
def update_shelter(shelter_id: str, update: ShelterUpdate, db: Session = Depends(get_db)):
    shelter = db.query(Shelter).filter(Shelter.shelter_id == shelter_id).first()
    if not shelter:
        raise HTTPException(status_code=404, detail="Shelter not found")
        
    if update.current_occupancy is not None:
        shelter.current_occupancy = update.current_occupancy
        if shelter.current_occupancy >= shelter.capacity:
            shelter.status = "full"
        elif shelter.current_occupancy >= shelter.capacity * 0.85:
            shelter.status = "approaching_capacity"
        else:
            shelter.status = "open"
            
    if update.status is not None:
        shelter.status = update.status
        
    db.commit()
    db.refresh(shelter)
    avail = max(0, shelter.capacity - shelter.current_occupancy)
    return ShelterResponse(
        id=shelter.id,
        shelter_id=shelter.shelter_id,
        name=shelter.name,
        city=shelter.city,
        neighbourhood=shelter.neighbourhood,
        latitude=shelter.latitude,
        longitude=shelter.longitude,
        capacity=shelter.capacity,
        current_occupancy=shelter.current_occupancy,
        available_capacity=avail,
        is_accessible=shelter.is_accessible,
        amenities=shelter.amenities_json or [],
        status=shelter.status,
        contact_person=shelter.contact_person,
        contact_phone=shelter.contact_phone
    )
