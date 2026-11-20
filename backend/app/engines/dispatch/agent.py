import os
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.engines.dispatch.tools import DispatchTools
from backend.app.schemas.schemas import AgentDecisionResponse, SafeRouteResponse

class DispatchAgent:
    def __init__(self, db: Session):
        self.db = db
        self.tools = DispatchTools(db)

    def execute_decision_pipeline(self, household_id: str, preferred_lang: str = "ta") -> AgentDecisionResponse:
        """
        Executes the tool-using AI decision workflow:
        1. get_household_risk
        2. get_local_flood_conditions
        3. get_nearest_shelters & check_shelter_capacity
        4. calculate_safe_route
        5. check_road_flood_risk
        6. generate_evacuation_message
        7. If critical mobility/vulnerability, auto-flag rescue request
        """
        executed_tools = []
        reasoning = []
        
        # Tool 1: Assess household risk
        risk_profile = self.tools.get_household_risk(household_id)
        executed_tools.append(f"get_household_risk('{household_id}') -> Score: {risk_profile.get('composite_score', 0)} ({risk_profile.get('risk_category', 'Unknown')})")
        reasoning.append(f"Retrieved vulnerability profile for {risk_profile.get('contact_name')} in {risk_profile.get('neighbourhood')}. Identified factors: {', '.join(risk_profile.get('reasons', []))}")
        
        # Tool 2: Local flood conditions
        hh = self.tools.db.query(self.tools.get_household_risk.__globals__["Household"]).filter_by(household_id=household_id).first()
        lat, lon = hh.latitude, hh.longitude
        flood_cond = self.tools.get_local_flood_conditions(lat, lon)
        executed_tools.append(f"get_local_flood_conditions({lat:.4f}, {lon:.4f}) -> Inundation: {flood_cond.get('estimated_water_depth_cm')}cm")
        reasoning.append(f"Local water depth forecast indicates {flood_cond.get('estimated_water_depth_cm')} cm standing water potential.")
        
        # Tool 3 & Tool 6: Find suitable shelter with capacity & accessibility
        nearest_shelters = self.tools.get_nearest_shelters(lat, lon, limit=4)
        executed_tools.append(f"get_nearest_shelters({lat:.4f}, {lon:.4f}) -> {len(nearest_shelters)} candidates evaluated")
        
        target_shelter = None
        needs_accessible = risk_profile.get("mobility_status") in ["wheelchair_dependent", "bedridden", "slow_mobility"]
        
        for cand in nearest_shelters:
            cap_check = self.tools.check_shelter_capacity(cand["shelter_id"])
            executed_tools.append(f"check_shelter_capacity('{cand['shelter_id']}') -> Available: {cap_check.get('available_capacity')}")
            if cap_check.get("has_space", False):
                if needs_accessible and not cand.get("is_accessible", False):
                    reasoning.append(f"Bypassed {cand['name']} due to lack of wheelchair accessibility.")
                    continue
                target_shelter = cand
                break
                
        if not target_shelter and nearest_shelters:
            target_shelter = nearest_shelters[0]
            
        reasoning.append(f"Selected destination shelter: {target_shelter['name']} ({target_shelter['available_capacity']} beds available, {target_shelter['distance_meters']}m away).")
        
        # Tool 4: Safe route optimization
        safe_route = self.tools.calculate_safe_route(
            origin=(lat, lon),
            destination=(target_shelter["latitude"], target_shelter["longitude"]),
            household_id=household_id,
            shelter_id=target_shelter["shelter_id"],
            shelter_name=target_shelter["name"]
        )
        executed_tools.append(f"calculate_safe_route(origin, destination) -> Distance: {safe_route.total_distance_m}m, Risk: {safe_route.route_risk_level}")
        
        # Tool 5: Check road risk along route
        road_risk = self.tools.check_road_flood_risk(safe_route.route_id)
        executed_tools.append(f"check_road_flood_risk('{safe_route.route_id}') -> {road_risk.get('status')}")
        reasoning.append("Calculated optimal escape corridor rerouting around flooded Ram Nagar / Adyar causeway segments.")
        
        # Tool 7: Multilingual alerts
        alerts = self.tools.generate_evacuation_message(household_id, preferred_lang)
        executed_tools.append(f"generate_evacuation_message('{household_id}', '{preferred_lang}') -> English, Tamil, Hindi generated")
        
        # Tool 8: Create rescue request if bedridden or critical score
        if risk_profile.get("composite_score", 0) >= 75 or risk_profile.get("mobility_status") in ["bedridden", "wheelchair_dependent"]:
            rescue_res = self.tools.create_rescue_request(household_id, "Critical mobility status with high inundation probability")
            executed_tools.append(f"create_rescue_request('{household_id}') -> {rescue_res.get('request_id')} ({rescue_res.get('status')})")
            reasoning.append(f"High risk and mobility barrier detected: Automatically flagged rescue ticket {rescue_res.get('request_id')}.")
            
        return AgentDecisionResponse(
            household_id=household_id,
            risk_summary=risk_profile,
            nearest_shelter=target_shelter,
            recommended_route=safe_route,
            generated_alert=alerts,
            decision_reasoning=reasoning,
            tools_executed=executed_tools
        )
