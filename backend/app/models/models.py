from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(String(50), default="citizen", nullable=False)  # 'admin', 'officer', 'responder', 'citizen'
    household_id = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Household(Base):
    __tablename__ = "households"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(String(50), unique=True, index=True, nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    city = Column(String(50), default="Chennai", index=True)
    neighbourhood = Column(String(100), index=True)
    
    # Demographics
    household_size = Column(Integer, default=4)
    elderly_count = Column(Integer, default=0)
    children_count = Column(Integer, default=0)
    disabled_count = Column(Integer, default=0)
    mobility_status = Column(String(50), default="independent")  # independent, slow_mobility, wheelchair_dependent, bedridden
    
    # Structural & Location
    ground_floor_status = Column(Boolean, default=True)
    building_type = Column(String(50), default="pucca_low_rise")  # kutcha, semi_pucca, pucca_low_rise, pucca_multi_storey
    flood_exposure = Column(Float, default=0.0)  # 0.0 to 1.0 from SEER
    distance_to_shelter = Column(Float, default=500.0)  # meters
    
    # Communication & Emergency
    phone_available = Column(Boolean, default=True)
    contact_number = Column(String(50), default="+91 98400 00000")
    contact_name = Column(String(120), default="Resident")
    preferred_language = Column(String(10), default="ta")  # 'ta', 'en', 'hi'
    
    # Real-time state
    evacuation_status = Column(String(50), default="contacted")  # contacted, evacuation_initiated, safe, rescue_required, unreachable
    vulnerability_score = Column(Float, default=45.0)  # 0 to 100
    risk_category = Column(String(50), default="Moderate")  # Low, Moderate, High, Critical
    is_synthetic = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class VulnerabilityScore(Base):
    __tablename__ = "vulnerability_scores"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(String(50), ForeignKey("households.household_id"), index=True)
    flood_exposure_score = Column(Float, default=0.0)
    demographic_score = Column(Float, default=0.0)
    mobility_score = Column(Float, default=0.0)
    structural_score = Column(Float, default=0.0)
    isolation_score = Column(Float, default=0.0)
    composite_score = Column(Float, default=0.0)
    risk_category = Column(String(50), default="Moderate")
    factors_json = Column(JSON, nullable=True)
    calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class FloodGridCell(Base):
    __tablename__ = "flood_grid_cells"

    id = Column(Integer, primary_key=True, index=True)
    cell_id = Column(String(50), unique=True, index=True, nullable=False)
    city = Column(String(50), default="Chennai", index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Environmental & terrain features
    elevation_m = Column(Float, default=5.0)
    slope_deg = Column(Float, default=1.0)
    distance_to_drain_m = Column(Float, default=200.0)
    soil_saturation = Column(Float, default=0.7)
    rainfall_accum_24h_mm = Column(Float, default=120.0)
    flow_accumulation = Column(Float, default=1500.0)
    
    # Predictions
    flood_susceptibility = Column(Float, default=0.5)  # 0.0 to 1.0
    risk_category = Column(String(50), default="Moderate")  # Low, Moderate, High, Critical
    estimated_water_depth_cm = Column(Float, default=15.0)
    confidence = Column(Float, default=0.92)
    model_version = Column(String(50), default="SEER-LGBM-v1.2")
    forecast_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String(50), default="Chennai", index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    temperature_c = Column(Float, default=27.5)
    precipitation_mm = Column(Float, default=15.0)
    rainfall_accum_24h_mm = Column(Float, default=145.0)
    humidity = Column(Float, default=92.0)
    wind_speed_kmh = Column(Float, default=32.0)
    source = Column(String(100), default="Open-Meteo Flood Forecast API")
    forecast_hours_ahead = Column(Integer, default=0)

class FloodPrediction(Base):
    __tablename__ = "flood_predictions"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String(50), default="Chennai")
    run_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    model_name = Column(String(100), default="SEER Hybrid Flood Susceptibility Classifier")
    model_version = Column(String(50), default="1.2.0")
    high_risk_cells_count = Column(Integer, default=24)
    critical_risk_cells_count = Column(Integer, default=14)
    estimated_affected_people = Column(Integer, default=14200)
    raw_metrics_json = Column(JSON, nullable=True)

class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(Integer, primary_key=True, index=True)
    shelter_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    city = Column(String(50), default="Chennai")
    neighbourhood = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, default=400)
    current_occupancy = Column(Integer, default=120)
    is_accessible = Column(Boolean, default=True)
    amenities_json = Column(JSON, nullable=True)  # ['medical_aid', 'drinking_water', 'hot_meals', 'power_backup', 'baby_care']
    status = Column(String(50), default="open")  # open, approaching_capacity, full, closed
    contact_person = Column(String(100), default="Officer in charge")
    contact_phone = Column(String(50), default="+91 44 2434 0000")
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(Integer, primary_key=True, index=True)
    road_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    city = Column(String(50), default="Chennai")
    start_node = Column(String(50), nullable=False)
    end_node = Column(String(50), nullable=False)
    length_meters = Column(Float, default=500.0)
    elevation_m = Column(Float, default=4.0)
    flood_risk_score = Column(Float, default=0.2)  # 0 to 1
    water_depth_cm = Column(Float, default=5.0)
    status = Column(String(50), default="passable")  # passable, waterlogged_slow, flooded_closed, emergency_vehicles_only
    coordinates_json = Column(JSON, nullable=False)  # [[lat, lon], [lat, lon]]

class EvacuationRoute(Base):
    __tablename__ = "evacuation_routes"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(String(50), unique=True, index=True, nullable=False)
    household_id = Column(String(50), ForeignKey("households.household_id"), nullable=False)
    shelter_id = Column(String(50), ForeignKey("shelters.shelter_id"), nullable=False)
    total_distance_m = Column(Float, default=1200.0)
    estimated_duration_min = Column(Float, default=18.0)
    risk_factor = Column(Float, default=0.15)
    road_ids_json = Column(JSON, nullable=True)
    steps_json = Column(JSON, nullable=True)
    waypoints_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(50), unique=True, index=True, nullable=False)
    household_id = Column(String(50), ForeignKey("households.household_id"), nullable=False)
    recipient_phone = Column(String(50), nullable=False)
    language = Column(String(10), default="ta")
    title = Column(String(200), nullable=False)
    message_body = Column(Text, nullable=False)
    severity = Column(String(50), default="High")  # Low, Moderate, High, Critical
    channels_json = Column(JSON, default=lambda: ["SMS", "Citizen Portal"])
    status = Column(String(50), default="pending_approval")  # draft, pending_approval, approved, dispatched, delivered, rejected
    approved_by = Column(String(100), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    dispatched_at = Column(DateTime, nullable=True)

    @property
    def channels(self):
        return self.channels_json or ["SMS", "Citizen Portal"]

class RescueRequest(Base):
    __tablename__ = "rescue_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(50), unique=True, index=True, nullable=False)
    household_id = Column(String(50), ForeignKey("households.household_id"), nullable=False)
    status = Column(String(50), default="pending")  # pending, assigned, in_progress, completed, cancelled
    priority_level = Column(String(50), default="High")  # Low, Medium, High, Critical
    people_count = Column(Integer, default=3)
    medical_emergency = Column(Boolean, default=False)
    details = Column(Text, nullable=True)
    assigned_responder = Column(String(100), nullable=True)
    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

class ResponderActivity(Base):
    __tablename__ = "responder_activities"

    id = Column(Integer, primary_key=True, index=True)
    responder_id = Column(String(100), nullable=False)
    household_id = Column(String(50), nullable=False)
    action_type = Column(String(50), nullable=False)  # status_update, route_shared, contacted, rescue_dispatched, safe_verified
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DataSourceMetadata(Base):
    __tablename__ = "data_source_metadata"

    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(100), unique=True, nullable=False)
    dataset_type = Column(String(100), nullable=False)
    update_frequency = Column(String(50), default="Hourly")
    last_fetched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String(50), default="Live Active")
    record_count = Column(Integer, default=0)
    attribution = Column(Text, nullable=False)
    url = Column(String(255), nullable=True)

class ModelEvaluationRecord(Base):
    __tablename__ = "model_evaluation_records"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=False)
    trained_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    accuracy = Column(Float, default=0.912)
    roc_auc = Column(Float, default=0.948)
    f1_score = Column(Float, default=0.906)
    precision = Column(Float, default=0.895)
    recall = Column(Float, default=0.918)
    confusion_matrix_json = Column(JSON, nullable=True)
    feature_importance_json = Column(JSON, nullable=True)
    limitations_text = Column(Text, nullable=True)
