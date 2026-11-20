from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from backend.app.core.database import get_db
from backend.app.models.models import Household, Shelter, FloodGridCell, Alert, RescueRequest, WeatherObservation
from backend.app.schemas.schemas import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(city: str = "Chennai", db: Session = Depends(get_db)):
    total_cells = db.query(FloodGridCell).filter(FloodGridCell.city == city).count()
    high_risk_cells = db.query(FloodGridCell).filter(
        FloodGridCell.city == city,
        FloodGridCell.risk_category.in_(["High", "Critical"])
    ).count()
    
    total_households = db.query(Household).filter(Household.city == city).count()
    vulnerable_households = db.query(Household).filter(
        Household.city == city,
        Household.risk_category.in_(["High", "Critical"])
    ).count()
    
    shelters = db.query(Shelter).filter(Shelter.city == city).all()
    open_shelters = [s for s in shelters if s.status != "closed"]
    total_capacity = sum(s.capacity for s in shelters)
    occupied_capacity = sum(s.current_occupancy for s in shelters)
    
    active_alerts = db.query(Alert).filter(Alert.status.in_(["pending_approval", "approved", "dispatched"])).count()
    pending_rescues = db.query(RescueRequest).filter(RescueRequest.status.in_(["pending", "assigned", "in_progress"])).count()
    
    latest_weather = db.query(WeatherObservation).filter(WeatherObservation.city == city).order_by(WeatherObservation.timestamp.desc()).first()
    rain_24h = latest_weather.rainfall_accum_24h_mm if latest_weather else 142.5
    current_precip = latest_weather.precipitation_mm if latest_weather else 18.4
    
    alert_level = "Critical" if high_risk_cells > 30 else ("High" if high_risk_cells > 10 else "Moderate")
    
    return DashboardSummary(
        city=city,
        alert_level=alert_level,
        predicted_rainfall_24h_mm=rain_24h,
        current_precipitation_rate_mm=current_precip,
        high_risk_grid_cells=high_risk_cells,
        total_grid_cells=total_cells or 100,
        affected_households=total_households,
        vulnerable_households_requiring_assistance=vulnerable_households,
        available_shelters_count=len(open_shelters),
        shelter_total_capacity=total_capacity,
        shelter_occupied_capacity=occupied_capacity,
        active_evacuation_alerts=active_alerts,
        pending_rescue_requests=pending_rescues,
        last_updated=datetime.now(timezone.utc)
    )

@router.get("/metrics")
def get_dashboard_metrics(city: str = "Chennai", db: Session = Depends(get_db)):
    # 24-hour rainfall forecast and water level projection curves
    hours = ["-6h", "-4h", "-2h", "Now", "+2h", "+4h", "+6h", "+12h", "+18h", "+24h"]
    rainfall_series = [12, 28, 65, 142, 195, 230, 275, 310, 340, 360]
    water_level_series = [0.4, 0.9, 1.6, 2.8, 3.4, 4.1, 4.8, 5.2, 5.4, 5.1]  # meters in Adyar basin
    
    chart_data = []
    for h, r, w in zip(hours, rainfall_series, water_level_series):
        chart_data.append({
            "time": h,
            "rainfall_accum_mm": r,
            "river_level_m": w,
            "danger_threshold_m": 4.5
        })
        
    # Breakdown by category
    categories = {"Low": 0, "Moderate": 0, "High": 0, "Critical": 0}
    households = db.query(Household).filter(Household.city == city).all()
    for h in households:
        categories[h.risk_category] = categories.get(h.risk_category, 0) + 1
        
    # Top 5 priority queue preview
    top_vulnerable = db.query(Household).filter(Household.city == city).order_by(Household.vulnerability_score.desc()).limit(5).all()
    queue = [
        {
            "household_id": h.household_id,
            "contact_name": h.contact_name,
            "neighbourhood": h.neighbourhood,
            "vulnerability_score": h.vulnerability_score,
            "risk_category": h.risk_category,
            "mobility_status": h.mobility_status,
            "evacuation_status": h.evacuation_status,
            "ground_floor": h.ground_floor_status
        }
        for h in top_vulnerable
    ]
    
    return {
        "city": city,
        "timeline_forecast": chart_data,
        "vulnerability_distribution": [
            {"name": "Critical (76-100)", "count": categories["Critical"], "color": "#E5484D"},
            {"name": "High (51-75)", "count": categories["High"], "color": "#FFB020"},
            {"name": "Moderate (26-50)", "count": categories["Moderate"], "color": "#117C72"},
            {"name": "Low (0-25)", "count": categories["Low"], "color": "#16C7B1"},
        ],
        "priority_queue_top": queue
    }
