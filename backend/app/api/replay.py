from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from backend.app.data_ingestion.synthetic_generator import generate_historical_2015_replay

router = APIRouter(prefix="/replay", tags=["Historical Flood Replay"])

@router.get("/events")
def get_replay_events():
    return [
        {
            "event_id": "CHENNAI_2015_DELUGE",
            "title": "Chennai Deluge Reconstructed Demonstration (Dec 2015)",
            "city": "Chennai",
            "date": "2015-11-30 to 2015-12-02",
            "peak_rainfall_mm": 494.0,
            "disclaimer": "RECONSTRUCTED DEMONSTRATION FOR CIPHERCOP 2026. Based on historical IMD rainfall and Adyar river overflow records."
        }
    ]

@router.get("/{event_id}")
def get_replay_event_detail(event_id: str):
    if event_id.upper() in ["CHENNAI_2015_DELUGE", "CHENNAI_2015"]:
        return generate_historical_2015_replay()
    raise HTTPException(status_code=404, detail="Historical scenario not found")
