from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    email: str
    household_id: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    household_id: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

# --- Household Schemas ---
class HouseholdResponse(BaseModel):
    id: int
    household_id: str
    address: str
    latitude: float
    longitude: float
    city: str
    neighbourhood: str
    household_size: int
    elderly_count: int
    children_count: int
    disabled_count: int
    mobility_status: str
    ground_floor_status: bool
    building_type: str
    flood_exposure: float
    distance_to_shelter: float
    phone_available: bool
    contact_number: str
    contact_name: str
    preferred_language: str
    evacuation_status: str
    vulnerability_score: float
    risk_category: str
    is_synthetic: bool
    notes: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class HouseholdStatusUpdate(BaseModel):
    evacuation_status: str
    notes: Optional[str] = None

# --- SEER Flood Engine Schemas ---
class FloodGridCellResponse(BaseModel):
    id: int
    cell_id: str
    city: str
    latitude: float
    longitude: float
    elevation_m: float
    slope_deg: float
    distance_to_drain_m: float
    soil_saturation: float
    rainfall_accum_24h_mm: float
    flow_accumulation: float
    flood_susceptibility: float
    risk_category: str
    estimated_water_depth_cm: float
    confidence: float
    model_version: str
    forecast_time: Optional[datetime] = None

    class Config:
        from_attributes = True

class WeatherResponse(BaseModel):
    city: str
    timestamp: datetime
    temperature_c: float
    precipitation_mm: float
    rainfall_accum_24h_mm: float
    humidity: float
    wind_speed_kmh: float
    source: str
    hourly_forecast: Optional[List[Dict[str, Any]]] = None

class SEERPredictRequest(BaseModel):
    city: str = "Chennai"
    rainfall_scenario_mm: Optional[float] = None
    use_live_weather: bool = True

class SEERPredictResponse(BaseModel):
    city: str
    model_version: str
    run_timestamp: datetime
    high_risk_cells_count: int
    critical_risk_cells_count: int
    estimated_affected_people: int
    average_flood_susceptibility: float
    cells: List[FloodGridCellResponse]

# --- VULN Engine Schemas ---
class VulnerabilityWeights(BaseModel):
    w_flood_exposure: float = 0.35
    w_elderly: float = 0.15
    w_children: float = 0.10
    w_mobility: float = 0.15
    w_ground_floor: float = 0.10
    w_distance_shelter: float = 0.08
    w_building_kutcha: float = 0.07

class VulnerabilityBreakdown(BaseModel):
    household_id: str
    flood_score: float
    elderly_score: float
    children_score: float
    mobility_score: float
    ground_floor_score: float
    shelter_distance_score: float
    building_score: float
    total_score: float
    risk_category: str
    reasons: List[str]

class VULNRecalculateResponse(BaseModel):
    total_evaluated: int
    critical_count: int
    high_count: int
    moderate_count: int
    low_count: int
    weights_used: VulnerabilityWeights
    top_vulnerable: List[HouseholdResponse]

# --- Shelters Schemas ---
class ShelterResponse(BaseModel):
    id: int
    shelter_id: str
    name: str
    city: str
    neighbourhood: str
    latitude: float
    longitude: float
    capacity: int
    current_occupancy: int
    available_capacity: int
    is_accessible: bool
    amenities: List[str]
    status: str
    contact_person: str
    contact_phone: str

    class Config:
        from_attributes = True

class ShelterUpdate(BaseModel):
    current_occupancy: Optional[int] = None
    status: Optional[str] = None

# --- Roads and Routing Schemas ---
class RoadSegmentResponse(BaseModel):
    road_id: str
    name: str
    start_node: str
    end_node: str
    length_meters: float
    elevation_m: float
    flood_risk_score: float
    water_depth_cm: float
    status: str
    coordinates: List[List[float]]

class RouteStep(BaseModel):
    instruction: str
    distance_m: float
    road_name: str
    road_status: str
    road_risk: float

class SafeRouteResponse(BaseModel):
    route_id: str
    household_id: str
    shelter_id: str
    shelter_name: str
    total_distance_m: float
    estimated_duration_min: float
    route_risk_level: str
    avoids_flooded_roads: bool
    path_coordinates: List[List[float]]
    steps: List[RouteStep]
    limitations: Optional[str] = None

# --- DISPATCH & Alert Schemas ---
class AgentDecisionRequest(BaseModel):
    household_id: str
    language: Optional[str] = "ta"

class AgentDecisionResponse(BaseModel):
    household_id: str
    risk_summary: Dict[str, Any]
    nearest_shelter: Dict[str, Any]
    recommended_route: SafeRouteResponse
    generated_alert: Dict[str, str]  # en, ta, hi
    decision_reasoning: List[str]
    tools_executed: List[str]

class AlertGenerateRequest(BaseModel):
    household_id: str
    language: str = "ta"
    custom_instructions: Optional[str] = None

class AlertResponse(BaseModel):
    id: int
    alert_id: str
    household_id: str
    recipient_phone: str
    language: str
    title: str
    message_body: str
    severity: str
    channels: Optional[List[str]] = Field(default_factory=lambda: ["SMS", "Citizen Portal"])
    status: str
    approved_by: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    dispatched_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class AlertApprovalRequest(BaseModel):
    approved: bool
    rejection_reason: Optional[str] = None

# --- Citizen Schemas ---
class CitizenStatusAction(BaseModel):
    household_id: str
    action: str  # 'SAFE' or 'NEED_HELP'
    additional_notes: Optional[str] = None
    contact_number: Optional[str] = None
    people_count: Optional[int] = None
    medical_urgency: Optional[bool] = False

class CitizenPortalData(BaseModel):
    household: HouseholdResponse
    local_flood_risk: Dict[str, Any]
    nearest_shelters: List[ShelterResponse]
    active_alert: Optional[AlertResponse] = None
    safe_route: Optional[SafeRouteResponse] = None

# --- Dashboard Schemas ---
class DashboardSummary(BaseModel):
    city: str
    alert_level: str  # Low, Moderate, High, Critical
    predicted_rainfall_24h_mm: float
    current_precipitation_rate_mm: float
    high_risk_grid_cells: int
    total_grid_cells: int
    affected_households: int
    vulnerable_households_requiring_assistance: int
    available_shelters_count: int
    shelter_total_capacity: int
    shelter_occupied_capacity: int
    active_evacuation_alerts: int
    pending_rescue_requests: int
    last_updated: datetime
