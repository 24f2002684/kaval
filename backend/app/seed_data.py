import os
import json
from datetime import datetime, timezone
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.core.security import get_password_hash
from backend.app.models.models import (
    User, Household, Shelter, RoadSegment, FloodGridCell,
    WeatherObservation, DataSourceMetadata, ModelEvaluationRecord, Alert, RescueRequest
)
from backend.app.data_ingestion.synthetic_generator import (
    generate_synthetic_households,
    generate_shelters,
    generate_road_network,
    generate_flood_grid,
    generate_historical_2015_replay
)

def seed_database():
    print("[Seed] Creating database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Seed Users if not present
        if db.query(User).count() == 0:
            print("[Seed] Seeding demo users...")
            demo_users = [
                User(
                    email="admin@kaval.gov.in",
                    hashed_password=get_password_hash("admin123"),
                    full_name="Dr. S. Radhakrishnan (State Relief Commissioner)",
                    role="admin"
                ),
                User(
                    email="officer@kaval.gov.in",
                    hashed_password=get_password_hash("officer123"),
                    full_name="K. Anbarasan (Disaster Management Officer - Zone 13)",
                    role="officer"
                ),
                User(
                    email="responder@kaval.gov.in",
                    hashed_password=get_password_hash("responder123"),
                    full_name="T. Vetrivel (SDRF First Responder Team Leader)",
                    role="responder"
                ),
                User(
                    email="citizen@kaval.gov.in",
                    hashed_password=get_password_hash("citizen123"),
                    full_name="K. Ramanathan (Household Resident)",
                    role="citizen",
                    household_id="HH-CHE-001"
                ),
            ]
            db.add_all(demo_users)
            db.commit()
            print(f"[Seed] Added {len(demo_users)} demo users.")
            
        # 2. Seed Shelters
        if db.query(Shelter).count() == 0:
            print("[Seed] Seeding shelters...")
            shelters_data = generate_shelters()
            for s in shelters_data:
                shelter = Shelter(
                    shelter_id=s["shelter_id"],
                    name=s["name"],
                    city=s["city"],
                    neighbourhood=s["neighbourhood"],
                    latitude=s["latitude"],
                    longitude=s["longitude"],
                    capacity=s["capacity"],
                    current_occupancy=s["current_occupancy"],
                    is_accessible=s["is_accessible"],
                    amenities_json=s["amenities"],
                    status=s["status"],
                    contact_person=s["contact_person"],
                    contact_phone=s["contact_phone"]
                )
                db.add(shelter)
            db.commit()
            print(f"[Seed] Added {len(shelters_data)} shelters.")

        # 3. Seed Roads
        if db.query(RoadSegment).count() == 0:
            print("[Seed] Seeding road segments...")
            roads_data = generate_road_network()
            for r in roads_data:
                road = RoadSegment(
                    road_id=r["road_id"],
                    name=r["name"],
                    city=r["city"],
                    start_node=r["start_node"],
                    end_node=r["end_node"],
                    length_meters=r["length_meters"],
                    elevation_m=r["elevation_m"],
                    flood_risk_score=r["flood_risk_score"],
                    water_depth_cm=r["water_depth_cm"],
                    status=r["status"],
                    coordinates_json=r["coordinates"]
                )
                db.add(road)
            db.commit()
            print(f"[Seed] Added {len(roads_data)} road segments.")

        # 4. Seed Flood Grid Cells
        if db.query(FloodGridCell).count() == 0:
            print("[Seed] Seeding flood grid cells...")
            grid_data = generate_flood_grid()
            for g in grid_data:
                cell = FloodGridCell(
                    cell_id=g["cell_id"],
                    city=g["city"],
                    latitude=g["latitude"],
                    longitude=g["longitude"],
                    elevation_m=g["elevation_m"],
                    slope_deg=g["slope_deg"],
                    distance_to_drain_m=g["distance_to_drain_m"],
                    soil_saturation=g["soil_saturation"],
                    rainfall_accum_24h_mm=g["rainfall_accum_24h_mm"],
                    flow_accumulation=g["flow_accumulation"],
                    flood_susceptibility=g["flood_susceptibility"],
                    risk_category=g["risk_category"],
                    estimated_water_depth_cm=g["estimated_water_depth_cm"],
                    confidence=g["confidence"],
                    model_version=g["model_version"]
                )
                db.add(cell)
            db.commit()
            print(f"[Seed] Added {len(grid_data)} flood grid cells.")

        # 5. Seed Households
        if db.query(Household).count() == 0:
            print("[Seed] Seeding synthetic households...")
            households_data = generate_synthetic_households(120)
            for h in households_data:
                hh = Household(
                    household_id=h["household_id"],
                    address=h["address"],
                    latitude=h["latitude"],
                    longitude=h["longitude"],
                    city=h["city"],
                    neighbourhood=h["neighbourhood"],
                    household_size=h["household_size"],
                    elderly_count=h["elderly_count"],
                    children_count=h["children_count"],
                    disabled_count=h["disabled_count"],
                    mobility_status=h["mobility_status"],
                    ground_floor_status=h["ground_floor_status"],
                    building_type=h["building_type"],
                    flood_exposure=h["flood_exposure"],
                    distance_to_shelter=h["distance_to_shelter"],
                    phone_available=h["phone_available"],
                    contact_number=h["contact_number"],
                    contact_name=h["contact_name"],
                    preferred_language=h["preferred_language"],
                    evacuation_status=h["evacuation_status"],
                    vulnerability_score=h["vulnerability_score"],
                    risk_category=h["risk_category"],
                    is_synthetic=True,
                    notes=h["notes"]
                )
                db.add(hh)
            db.commit()
            print(f"[Seed] Added {len(households_data)} synthetic households.")

        # 6. Seed Weather
        if db.query(WeatherObservation).count() == 0:
            weather = WeatherObservation(
                city="Chennai",
                temperature_c=27.2,
                precipitation_mm=18.4,
                rainfall_accum_24h_mm=142.5,
                humidity=94.0,
                wind_speed_kmh=36.0,
                source="Open-Meteo Flood Live Ingestion Service"
            )
            db.add(weather)
            db.commit()

        # 7. Seed Data Sources Metadata
        if db.query(DataSourceMetadata).count() == 0:
            sources = [
                DataSourceMetadata(
                    source_name="Open-Meteo Weather API",
                    dataset_type="Numerical Weather Prediction & Precipitation",
                    update_frequency="Hourly",
                    status="Operational",
                    record_count=240,
                    attribution="Open-Meteo meteorological database (CC-BY 4.0)",
                    url="https://open-meteo.com"
                ),
                DataSourceMetadata(
                    source_name="Copernicus DEM GLO-30",
                    dataset_type="High-Resolution Digital Elevation Model",
                    update_frequency="Static / Regional Basemap",
                    status="Operational",
                    record_count=10000,
                    attribution="European Space Agency / Copernicus Programme",
                    url="https://spacedata.copernicus.eu"
                ),
                DataSourceMetadata(
                    source_name="OpenStreetMap Road Network",
                    dataset_type="Vector Roads & Critical Transportation Lines",
                    update_frequency="Continuous",
                    status="Operational",
                    record_count=4500,
                    attribution="OpenStreetMap contributors (ODbL)",
                    url="https://openstreetmap.org"
                ),
                DataSourceMetadata(
                    source_name="IMD Historical Rainfall Grid",
                    dataset_type="Gridded High-Resolution Precipitation",
                    update_frequency="Daily Archive",
                    status="Operational",
                    record_count=1200,
                    attribution="India Meteorological Department (Govt of India)",
                    url="https://mausam.imd.gov.in"
                ),
                DataSourceMetadata(
                    source_name="Sen1Floods11 Sentinel-1 Benchmark",
                    dataset_type="SAR Flood Segmentation Labels",
                    update_frequency="Training Dataset",
                    status="Trained",
                    record_count=4831,
                    attribution="Cloud to Street / ML4Floods",
                    url="https://github.com/cloudtostreet/Sen1Floods11"
                ),
                DataSourceMetadata(
                    source_name="GloFAS / Copernicus Emergency Management",
                    dataset_type="Global Flood Awareness River Discharge",
                    update_frequency="Daily 10-day forecast",
                    status="Operational",
                    record_count=150,
                    attribution="Copernicus Emergency Management Service",
                    url="https://globalfloods.eu"
                ),
            ]
            db.add_all(sources)
            db.commit()

        # 8. Seed Model Transparency Record
        if db.query(ModelEvaluationRecord).count() == 0:
            eval_record = ModelEvaluationRecord(
                model_name="SEER Hybrid Flood Susceptibility Classifier",
                model_version="1.2.0",
                accuracy=0.9390,
                roc_auc=0.9826,
                f1_score=0.8310,
                precision=0.8920,
                recall=0.7840,
                confusion_matrix_json=[[730, 22], [42, 206]],
                feature_importance_json={
                    "rainfall_accum_24h_mm": 0.384,
                    "elevation_m": 0.281,
                    "distance_to_drain_m": 0.162,
                    "soil_saturation": 0.098,
                    "flow_accumulation": 0.052,
                    "slope_deg": 0.023
                },
                limitations_text="Calibrated for coastal flat topography (Chennai river basins). Coarse meteorological forecasts are downscaled with high-resolution DEM; micro-drainage blockages may cause local localized pooling deviations."
            )
            db.add(eval_record)
            db.commit()

        # 9. Seed Sample Alerts
        if db.query(Alert).count() == 0:
            sample_alert = Alert(
                alert_id="ALT-2026-001",
                household_id="HH-CHE-001",
                recipient_phone="+91 98401 23456",
                language="ta",
                title="KAVAL வெள்ள எச்சரிக்கை – வேளச்சேரி",
                message_body="உங்கள் வீட்டின் அருகிலுள்ள வெள்ள அபாயம் மிக அதிகம். அருகிலுள்ள நிவாரண மையம்: Guru Nanak College Relief Center. பதில் அனுப்பவும்: 1 - SAFE, 2 - NEED HELP",
                severity="Critical",
                status="pending_approval"
            )
            db.add(sample_alert)
            db.commit()

        # 10. Seed Sample Rescue Request
        if db.query(RescueRequest).count() == 0:
            sample_req = RescueRequest(
                request_id="REQ-CHE-001",
                household_id="HH-CHE-001",
                status="pending",
                priority_level="Critical",
                people_count=4,
                medical_emergency=True,
                details="Ground floor inundation 45cm. Elderly bedridden resident requiring immediate boat stretcher transfer."
            )
            db.add(sample_req)
            db.commit()

        # Export JSON backups to datasets/synthetic/
        datasets_dir = os.path.join(os.path.dirname(__file__), "..", "..", "datasets", "synthetic")
        os.makedirs(datasets_dir, exist_ok=True)
        
        with open(os.path.join(datasets_dir, "households_chennai.json"), "w") as f:
            json.dump(generate_synthetic_households(120), f, indent=2)
        with open(os.path.join(datasets_dir, "shelters_chennai.json"), "w") as f:
            json.dump(generate_shelters(), f, indent=2)
        with open(os.path.join(datasets_dir, "roads_chennai.json"), "w") as f:
            json.dump(generate_road_network(), f, indent=2)
        with open(os.path.join(datasets_dir, "grid_chennai.json"), "w") as f:
            json.dump(generate_flood_grid(), f, indent=2)
        with open(os.path.join(datasets_dir, "replay_2015_chennai.json"), "w") as f:
            json.dump(generate_historical_2015_replay(), f, indent=2)
            
        print("[Seed] Database seeding and dataset JSON export completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
