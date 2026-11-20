import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.app.engines.seer.flood_model import seer_flood_model
from backend.app.engines.vuln.scoring import vuln_engine, VulnerabilityWeights
from backend.app.engines.dispatch.routing_optimizer import routing_optimizer
from backend.app.engines.dispatch.multilingual import generate_multilingual_alert

client = TestClient(app)

def test_health_and_root():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
    
    root_res = client.get("/")
    assert root_res.status_code == 200
    assert "KAVAL" in root_res.json()["system"]

def test_seer_engine_prediction():
    features = {
        "elevation_m": 2.5,
        "slope_deg": 0.8,
        "distance_to_drain_m": 80.0,
        "soil_saturation": 0.90,
        "rainfall_accum_24h_mm": 210.0,
        "flow_accumulation": 5000.0
    }
    prob, cat, conf = seer_flood_model.predict_susceptibility(features)
    assert 0.0 <= prob <= 1.0
    assert cat in ["High", "Critical"]
    assert conf > 0.8
    
    depth = seer_flood_model.estimate_water_depth(prob, 2.5, 210.0)
    assert depth > 10.0

def test_vuln_engine_scoring():
    hh = {
        "household_id": "TEST-01",
        "flood_exposure": 0.85,
        "elderly_count": 2,
        "children_count": 1,
        "disabled_count": 1,
        "mobility_status": "bedridden",
        "ground_floor_status": True,
        "building_type": "kutcha",
        "distance_to_shelter": 1200.0
    }
    score, cat, breakdown = vuln_engine.calculate_household_vulnerability(hh)
    assert score >= 75.0
    assert cat == "Critical"
    assert len(breakdown.reasons) >= 3

def test_multilingual_alert_generation():
    alerts = generate_multilingual_alert(
        household_name="K. Raman",
        neighbourhood="Velachery",
        risk_level="Critical",
        shelter_name="Guru Nanak College Relief Center"
    )
    assert "en" in alerts and "ta" in alerts and "hi" in alerts
    assert "KAVAL ALERT" in alerts["en"]
    assert "காவல்" in alerts["ta"]
    assert "कावल" in alerts["hi"]
    assert "SAFE" in alerts["en"]

def test_api_auth_and_demo_switch():
    res = client.post("/api/auth/demo-switch", json={"role": "officer"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "officer"
    assert "access_token" in data

def test_api_dashboard_summary():
    res = client.get("/api/dashboard/summary?city=Chennai")
    assert res.status_code == 200
    data = res.json()
    assert data["city"] == "Chennai"
    assert data["total_grid_cells"] > 0
    assert data["affected_households"] > 0

def test_api_vuln_households():
    res = client.get("/api/vuln/households?city=Chennai&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert "household_id" in data[0]

def test_api_dispatch_recommend():
    res = client.post("/api/dispatch/recommend", json={"household_id": "HH-CHE-001", "language": "ta"})
    assert res.status_code == 200
    data = res.json()
    assert data["household_id"] == "HH-CHE-001"
    assert "nearest_shelter" in data
    assert "recommended_route" in data
    assert len(data["tools_executed"]) >= 5

def test_api_shelters():
    res = client.get("/api/shelters?city=Chennai")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5

def test_api_citizen_portal():
    res = client.get("/api/citizen/household?household_id=HH-CHE-001")
    assert res.status_code == 200
    data = res.json()
    assert data["household"]["household_id"] == "HH-CHE-001"
    assert len(data["nearest_shelters"]) > 0

def test_api_historical_replay():
    res = client.get("/api/replay/CHENNAI_2015_DELUGE")
    assert res.status_code == 200
    data = res.json()
    assert len(data["timesteps"]) == 5
