from typing import Dict, Any, List, Tuple
from backend.app.schemas.schemas import VulnerabilityWeights, VulnerabilityBreakdown

DEFAULT_WEIGHTS = VulnerabilityWeights()

class VULNEngine:
    def __init__(self, weights: VulnerabilityWeights = DEFAULT_WEIGHTS):
        self.weights = weights

    def update_weights(self, new_weights: VulnerabilityWeights):
        self.weights = new_weights

    def calculate_household_vulnerability(
        self,
        household_data: Dict[str, Any],
        weights: VulnerabilityWeights = None
    ) -> Tuple[float, str, VulnerabilityBreakdown]:
        w = weights or self.weights
        
        # 1. Flood Exposure Score (0..100)
        flood_exp = float(household_data.get("flood_exposure", 0.0))
        flood_score = min(100.0, flood_exp * 100.0)
        
        # 2. Elderly Score (0..100)
        elderly = int(household_data.get("elderly_count", 0))
        elderly_score = min(100.0, (elderly / 2.0) * 100.0)
        
        # 3. Children Score (0..100)
        children = int(household_data.get("children_count", 0))
        children_score = min(100.0, (children / 3.0) * 100.0)
        
        # 4. Mobility Score (0..100)
        mobility = household_data.get("mobility_status", "independent")
        disabled_count = int(household_data.get("disabled_count", 0))
        if mobility == "bedridden":
            mob_score = 100.0
        elif mobility == "wheelchair_dependent":
            mob_score = 80.0
        elif mobility == "slow_mobility" or disabled_count > 0:
            mob_score = 50.0
        else:
            mob_score = 10.0
            
        # 5. Ground Floor Occupancy (0..100)
        ground_floor = bool(household_data.get("ground_floor_status", True))
        ground_floor_score = 100.0 if ground_floor else 25.0
        
        # 6. Distance to Shelter Score (0..100)
        # > 1500m is considered severely isolated during inundation
        dist_shelter = float(household_data.get("distance_to_shelter", 500.0))
        shelter_dist_score = min(100.0, (dist_shelter / 1500.0) * 100.0)
        
        # 7. Building Structure Vulnerability (0..100)
        b_type = household_data.get("building_type", "pucca_low_rise")
        if b_type == "kutcha":
            b_score = 100.0
        elif b_type == "semi_pucca":
            b_score = 65.0
        elif b_type == "pucca_low_rise":
            b_score = 35.0
        else:
            b_score = 15.0
            
        # Composite Weighted Sum
        composite = (
            flood_score * w.w_flood_exposure +
            elderly_score * w.w_elderly +
            children_score * w.w_children +
            mob_score * w.w_mobility +
            ground_floor_score * w.w_ground_floor +
            shelter_dist_score * w.w_distance_shelter +
            b_score * w.w_building_kutcha
        )
        
        # Normalize sum of weights if user customizes them
        weight_sum = (
            w.w_flood_exposure + w.w_elderly + w.w_children +
            w.w_mobility + w.w_ground_floor + w.w_distance_shelter + w.w_building_kutcha
        )
        if weight_sum > 0:
            composite = composite / weight_sum
            
        composite = round(min(100.0, max(0.0, composite)), 1)
        
        # Risk Categories
        if composite >= 76.0:
            cat = "Critical"
        elif composite >= 51.0:
            cat = "High"
        elif composite >= 26.0:
            cat = "Moderate"
        else:
            cat = "Low"
            
        # Explanatory breakdown
        reasons = []
        if flood_score >= 70:
            reasons.append(f"Severe local inundation susceptibility ({flood_exp*100:.0f}%)")
        if mobility in ["bedridden", "wheelchair_dependent"]:
            reasons.append(f"Critical mobility barrier ({mobility.replace('_', ' ')})")
        if elderly > 0:
            reasons.append(f"{elderly} elderly resident(s) requiring evacuation support")
        if children > 0:
            reasons.append(f"{children} young child(ren) present")
        if ground_floor:
            reasons.append("Ground-floor residential unit at immediate water entry risk")
        if b_type in ["kutcha", "semi_pucca"]:
            reasons.append(f"Vulnerable {b_type.replace('_', ' ')} building structure")
        if dist_shelter > 1000:
            reasons.append(f"Extended distance to safe shelter ({dist_shelter:.0f} m)")
        if not reasons:
            reasons.append("Moderate standard household exposure profile")
            
        breakdown = VulnerabilityBreakdown(
            household_id=str(household_data.get("household_id", "")),
            flood_score=round(flood_score, 1),
            elderly_score=round(elderly_score, 1),
            children_score=round(children_score, 1),
            mobility_score=round(mob_score, 1),
            ground_floor_score=round(ground_floor_score, 1),
            shelter_distance_score=round(shelter_dist_score, 1),
            building_score=round(b_score, 1),
            total_score=composite,
            risk_category=cat,
            reasons=reasons
        )
        
        return composite, cat, breakdown

vuln_engine = VULNEngine()
