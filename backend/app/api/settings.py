from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from backend.app.core.config import settings
from backend.app.schemas.schemas import VulnerabilityWeights
from backend.app.engines.vuln.scoring import vuln_engine

router = APIRouter(prefix="/settings", tags=["Settings & Configuration"])

# In-memory settings state for pilot switcher
SYSTEM_STATE = {
    "active_city": "Chennai",
    "alert_threshold": "Moderate",
    "sms_relay_enabled": True,
    "llm_provider": settings.LLM_PROVIDER,
    "available_cities": ["Chennai", "Mumbai", "Patna", "Cuttack"]
}

class SettingsUpdate(BaseModel):
    active_city: str
    vulnerability_weights: VulnerabilityWeights = None

@router.get("")
def get_system_settings():
    return {
        "active_city": SYSTEM_STATE["active_city"],
        "available_cities": SYSTEM_STATE["available_cities"],
        "llm_provider": SYSTEM_STATE["llm_provider"],
        "sms_relay_enabled": SYSTEM_STATE["sms_relay_enabled"],
        "vulnerability_weights": vuln_engine.weights.dict(),
        "pilot_coordinates": {
            "Chennai": {"lat": 12.9780, "lon": 80.2180, "zoom": 12},
            "Mumbai": {"lat": 19.0760, "lon": 72.8777, "zoom": 12},
            "Patna": {"lat": 25.5941, "lon": 85.1376, "zoom": 12},
            "Cuttack": {"lat": 20.4625, "lon": 85.8830, "zoom": 12}
        }
    }

@router.post("")
def update_system_settings(update: SettingsUpdate):
    if update.active_city in SYSTEM_STATE["available_cities"]:
        SYSTEM_STATE["active_city"] = update.active_city
    if update.vulnerability_weights:
        vuln_engine.update_weights(update.vulnerability_weights)
    return {
        "status": "success",
        "active_city": SYSTEM_STATE["active_city"],
        "weights": vuln_engine.weights.dict()
    }
