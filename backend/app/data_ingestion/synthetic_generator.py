import json
import random
import os
from typing import List, Dict, Any

# Ensure random reproducibility
random.seed(2026)

# Focus neighbourhoods in Chennai flood zones
NEIGHBOURHOODS = [
    {"name": "Velachery", "center_lat": 12.9780, "center_lon": 80.2180, "base_elev": 3.2, "drain_dist": 150},
    {"name": "Madipakkam", "center_lat": 12.9640, "center_lon": 80.1980, "base_elev": 4.1, "drain_dist": 220},
    {"name": "Mudichur", "center_lat": 12.9220, "center_lon": 80.0830, "base_elev": 2.8, "drain_dist": 90},
    {"name": "Saidapet", "center_lat": 13.0210, "center_lon": 80.2230, "base_elev": 5.4, "drain_dist": 110},
    {"name": "Pallikaranai", "center_lat": 12.9350, "center_lon": 80.2110, "base_elev": 2.1, "drain_dist": 60},
    {"name": "Tambaram", "center_lat": 12.9240, "center_lon": 80.1270, "base_elev": 8.5, "drain_dist": 450},
    {"name": "Adyar", "center_lat": 13.0060, "center_lon": 80.2570, "base_elev": 4.8, "drain_dist": 180},
]

TAMIL_NAMES = [
    "K. Ramanathan", "S. Meenakshi", "A. Subramanian", "V. Lakshmi", "M. Sundaram",
    "P. Balakrishnan", "R. Jayanthi", "S. Arumugam", "T. Vijayaraghavan", "K. Saravanan",
    "G. Rajendran", "D. Selvi", "N. Murugan", "C. Anbazhagan", "J. Priya",
    "E. Thangavel", "B. Vasantha", "L. Senthilkumar", "A. Malathi", "S. Govindarajan",
    "R. Karthikeyan", "M. Balamurugan", "V. Shanthi", "K. Natarajan", "P. Kannan",
    "T. Radhika", "S. Venkatesh", "N. Gomathi", "H. Chandrasekar", "M. Revathi"
]

STREETS = [
    "1st Cross Street, Ram Nagar", "2nd Main Road, AGS Colony", "Bypass Service Road",
    "Lake View Road", "Gandhi Nagar 3rd Street", "Kuberan Nagar Extension",
    "River Bank Colony", "Canal Bank Road", "Bharathiyar Street", "Pillayar Koil Street",
    "VOC Nagar 4th Lane", "Anna Street East", "Mettu Street", "Rajaji Nagar",
    "Kamarajar Salai", "Sundaram Colony", "Subramaniam Nagar", "Periyar Pathai"
]

BUILDING_TYPES = ["kutcha", "semi_pucca", "pucca_low_rise", "pucca_multi_storey"]
MOBILITY_STATUSES = ["independent", "slow_mobility", "wheelchair_dependent", "bedridden"]
LANGUAGES = ["ta", "en", "hi"]

def generate_synthetic_households(count: int = 120) -> List[Dict[str, Any]]:
    households = []
    
    for i in range(1, count + 1):
        nh = random.choice(NEIGHBOURHOODS)
        # Small offset around neighbourhood center (~1km spread)
        lat = nh["center_lat"] + random.uniform(-0.007, 0.007)
        lon = nh["center_lon"] + random.uniform(-0.007, 0.007)
        
        # Low-lying high risk locations gets higher flood exposure
        elev = nh["base_elev"] + random.uniform(-1.0, 1.5)
        flood_exposure = max(0.05, min(0.98, (10.0 - elev) / 10.0 + random.uniform(-0.1, 0.15)))
        
        household_size = random.randint(2, 7)
        has_elderly = random.random() < 0.45
        elderly_count = random.randint(1, 2) if has_elderly else 0
        
        has_children = random.random() < 0.50
        children_count = random.randint(1, 3) if has_children else 0
        
        has_disabled = random.random() < 0.20
        disabled_count = 1 if has_disabled else 0
        
        if disabled_count > 0:
            mobility = random.choice(["wheelchair_dependent", "bedridden"])
        elif elderly_count > 0 and random.random() < 0.4:
            mobility = "slow_mobility"
        else:
            mobility = "independent"
            
        ground_floor = random.random() < 0.65
        building = random.choices(BUILDING_TYPES, weights=[0.12, 0.28, 0.45, 0.15])[0]
        
        # Calculate initial heuristic vulnerability score (0 to 100)
        v_score = (
            flood_exposure * 35 +
            (min(elderly_count, 2) / 2.0) * 15 +
            (min(children_count, 3) / 3.0) * 10 +
            (1.0 if mobility == 'bedridden' else (0.8 if mobility == 'wheelchair_dependent' else (0.4 if mobility == 'slow_mobility' else 0.0))) * 15 +
            (1.0 if ground_floor else 0.2) * 10 +
            (1.0 if building == 'kutcha' else (0.6 if building == 'semi_pucca' else 0.2)) * 7 +
            random.uniform(0, 8)
        )
        v_score = round(min(100.0, max(5.0, v_score)), 1)
        
        if v_score >= 75:
            risk_cat = "Critical"
            status = random.choices(["rescue_required", "contacted", "evacuation_initiated"], weights=[0.55, 0.30, 0.15])[0]
        elif v_score >= 50:
            risk_cat = "High"
            status = random.choices(["contacted", "evacuation_initiated", "rescue_required", "safe"], weights=[0.40, 0.35, 0.15, 0.10])[0]
        elif v_score >= 25:
            risk_cat = "Moderate"
            status = random.choices(["contacted", "safe", "evacuation_initiated"], weights=[0.45, 0.40, 0.15])[0]
        else:
            risk_cat = "Low"
            status = random.choices(["safe", "contacted"], weights=[0.75, 0.25])[0]
            
        hh_id = f"HH-CHE-{i:03d}"
        contact_name = random.choice(TAMIL_NAMES)
        street = random.choice(STREETS)
        door_no = f"No. {random.randint(1, 140)}"
        
        households.append({
            "household_id": hh_id,
            "address": f"{door_no}, {street}, {nh['name']}, Chennai - 600042",
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "city": "Chennai",
            "neighbourhood": nh["name"],
            "household_size": household_size,
            "elderly_count": elderly_count,
            "children_count": children_count,
            "disabled_count": disabled_count,
            "mobility_status": mobility,
            "ground_floor_status": ground_floor,
            "building_type": building,
            "flood_exposure": round(flood_exposure, 3),
            "distance_to_shelter": round(random.uniform(250, 1800), 1),
            "phone_available": True,
            "contact_number": f"+91 9840{random.randint(10, 99)} {random.randint(10000, 99999)}",
            "contact_name": contact_name,
            "preferred_language": random.choices(LANGUAGES, weights=[0.75, 0.20, 0.05])[0],
            "evacuation_status": status,
            "vulnerability_score": v_score,
            "risk_category": risk_cat,
            "is_synthetic": True,
            "notes": "SIMULATED CITIZEN RECORD FOR CIPHERCOP 2026 DEMO"
        })
        
    return households

def generate_shelters() -> List[Dict[str, Any]]:
    return [
        {
            "shelter_id": "SH-CHE-01",
            "name": "Guru Nanak College Relief & Evacuation Center",
            "city": "Chennai",
            "neighbourhood": "Velachery",
            "latitude": 12.9912,
            "longitude": 80.2195,
            "capacity": 650,
            "current_occupancy": 180,
            "is_accessible": True,
            "amenities": ["medical_aid", "drinking_water", "hot_meals", "power_backup", "baby_care", "generator"],
            "status": "open",
            "contact_person": "Dr. R. Prabhakaran (Nodal Officer)",
            "contact_phone": "+91 94440 12345"
        },
        {
            "shelter_id": "SH-CHE-02",
            "name": "Velachery Community Welfare Hall",
            "city": "Chennai",
            "neighbourhood": "Velachery",
            "latitude": 12.9815,
            "longitude": 80.2240,
            "capacity": 350,
            "current_occupancy": 210,
            "is_accessible": True,
            "amenities": ["drinking_water", "hot_meals", "power_backup"],
            "status": "open",
            "contact_person": "Mrs. K. Banumathi",
            "contact_phone": "+91 94441 23456"
        },
        {
            "shelter_id": "SH-CHE-03",
            "name": "Saidapet Model Higher Secondary School",
            "city": "Chennai",
            "neighbourhood": "Saidapet",
            "latitude": 13.0245,
            "longitude": 80.2260,
            "capacity": 500,
            "current_occupancy": 320,
            "is_accessible": True,
            "amenities": ["medical_aid", "drinking_water", "hot_meals", "emergency_beds"],
            "status": "open",
            "contact_person": "Mr. S. Elangovan",
            "contact_phone": "+91 94442 34567"
        },
        {
            "shelter_id": "SH-CHE-04",
            "name": "Madipakkam Govt Higher Secondary School Relief Camp",
            "city": "Chennai",
            "neighbourhood": "Madipakkam",
            "latitude": 12.9690,
            "longitude": 80.1945,
            "capacity": 400,
            "current_occupancy": 140,
            "is_accessible": False,
            "amenities": ["drinking_water", "hot_meals", "first_aid"],
            "status": "open",
            "contact_person": "Mr. V. Sundaram",
            "contact_phone": "+91 94443 45678"
        },
        {
            "shelter_id": "SH-CHE-05",
            "name": "St. Thomas Mount Cantonment Relief Center",
            "city": "Chennai",
            "neighbourhood": "Saidapet",
            "latitude": 13.0035,
            "longitude": 80.1970,
            "capacity": 700,
            "current_occupancy": 290,
            "is_accessible": True,
            "amenities": ["medical_aid", "drinking_water", "hot_meals", "power_backup", "ambulances"],
            "status": "open",
            "contact_person": "Maj. D. Chandran (Retd)",
            "contact_phone": "+91 94444 56789"
        },
        {
            "shelter_id": "SH-CHE-06",
            "name": "Tambaram Municipality Community Hall",
            "city": "Chennai",
            "neighbourhood": "Tambaram",
            "latitude": 12.9290,
            "longitude": 80.1320,
            "capacity": 450,
            "current_occupancy": 95,
            "is_accessible": True,
            "amenities": ["drinking_water", "hot_meals", "power_backup"],
            "status": "open",
            "contact_person": "Mr. N. Jayakumar",
            "contact_phone": "+91 94445 67890"
        },
        {
            "shelter_id": "SH-CHE-07",
            "name": "Mudichur Primary Health & Disaster Relief Center",
            "city": "Chennai",
            "neighbourhood": "Mudichur",
            "latitude": 12.9265,
            "longitude": 80.0880,
            "capacity": 300,
            "current_occupancy": 285,
            "is_accessible": True,
            "amenities": ["medical_aid", "drinking_water", "hot_meals"],
            "status": "approaching_capacity",
            "contact_person": "Dr. S. Kavitha",
            "contact_phone": "+91 94446 78901"
        },
        {
            "shelter_id": "SH-CHE-08",
            "name": "Pallikaranai Panchayat Union High School",
            "city": "Chennai",
            "neighbourhood": "Pallikaranai",
            "latitude": 12.9395,
            "longitude": 80.2085,
            "capacity": 450,
            "current_occupancy": 160,
            "is_accessible": True,
            "amenities": ["drinking_water", "hot_meals", "power_backup", "first_aid"],
            "status": "open",
            "contact_person": "Mr. G. Ravichandran",
            "contact_phone": "+91 94447 89012"
        }
    ]

def generate_road_network() -> List[Dict[str, Any]]:
    # 25 core road segments connecting zones, shelters and intersections
    roads = [
        {
            "road_id": "RD-001", "name": "Velachery Main Road (North Section)", "city": "Chennai",
            "start_node": "N_VEL_JUNCTION", "end_node": "SH_VELACHERY_01",
            "length_meters": 1100, "elevation_m": 4.5, "flood_risk_score": 0.35, "water_depth_cm": 15,
            "status": "waterlogged_slow",
            "coordinates": [[12.9780, 80.2180], [12.9850, 80.2190], [12.9912, 80.2195]]
        },
        {
            "road_id": "RD-002", "name": "Ram Nagar 1st Main Road", "city": "Chennai",
            "start_node": "N_RAM_NAGAR", "end_node": "N_VEL_JUNCTION",
            "length_meters": 750, "elevation_m": 2.1, "flood_risk_score": 0.88, "water_depth_cm": 65,
            "status": "flooded_closed",
            "coordinates": [[12.9720, 80.2130], [12.9750, 80.2155], [12.9780, 80.2180]]
        },
        {
            "road_id": "RD-003", "name": "100 Feet Bypass Road (Velachery)", "city": "Chennai",
            "start_node": "N_VEL_JUNCTION", "end_node": "SH_VELACHERY_02",
            "length_meters": 950, "elevation_m": 5.2, "flood_risk_score": 0.18, "water_depth_cm": 5,
            "status": "passable",
            "coordinates": [[12.9780, 80.2180], [12.9800, 80.2210], [12.9815, 80.2240]]
        },
        {
            "road_id": "RD-004", "name": "Madipakkam - Velachery Link Road", "city": "Chennai",
            "start_node": "N_MADIPAKKAM_CTR", "end_node": "N_VEL_JUNCTION",
            "length_meters": 1800, "elevation_m": 3.8, "flood_risk_score": 0.45, "water_depth_cm": 25,
            "status": "waterlogged_slow",
            "coordinates": [[12.9640, 80.1980], [12.9710, 80.2080], [12.9780, 80.2180]]
        },
        {
            "road_id": "RD-005", "name": "Kubera Nagar Main Road", "city": "Chennai",
            "start_node": "N_KUBERA_NAGAR", "end_node": "SH_MADIPAKKAM_04",
            "length_meters": 820, "elevation_m": 4.8, "flood_risk_score": 0.20, "water_depth_cm": 8,
            "status": "passable",
            "coordinates": [[12.9610, 80.1910], [12.9650, 80.1930], [12.9690, 80.1945]]
        },
        {
            "road_id": "RD-006", "name": "Inner Ring Road (Saidapet Section)", "city": "Chennai",
            "start_node": "N_SAIDAPET_METRO", "end_node": "SH_SAIDAPET_03",
            "length_meters": 1200, "elevation_m": 6.2, "flood_risk_score": 0.15, "water_depth_cm": 0,
            "status": "passable",
            "coordinates": [[13.0150, 80.2200], [13.0200, 80.2230], [13.0245, 80.2260]]
        },
        {
            "road_id": "RD-007", "name": "Maraimalai Adigal Bridge / Anna Salai Causeway", "city": "Chennai",
            "start_node": "N_SAIDAPET_CAUSEWAY", "end_node": "N_SAIDAPET_METRO",
            "length_meters": 650, "elevation_m": 2.9, "flood_risk_score": 0.92, "water_depth_cm": 78,
            "status": "flooded_closed",
            "coordinates": [[13.0120, 80.2180], [13.0135, 80.2190], [13.0150, 80.2200]]
        },
        {
            "road_id": "RD-008", "name": "GST Road Flyover Corridor", "city": "Chennai",
            "start_node": "N_GUINDY_INTERSECTION", "end_node": "SH_ST_THOMAS_05",
            "length_meters": 1400, "elevation_m": 8.5, "flood_risk_score": 0.08, "water_depth_cm": 0,
            "status": "passable",
            "coordinates": [[13.0080, 80.2110], [13.0055, 80.2040], [13.0035, 80.1970]]
        },
        {
            "road_id": "RD-009", "name": "Mudichur Varadarajapuram Road", "city": "Chennai",
            "start_node": "N_VARADARAJAPURAM", "end_node": "SH_MUDICHUR_07",
            "length_meters": 1300, "elevation_m": 2.2, "flood_risk_score": 0.85, "water_depth_cm": 70,
            "status": "flooded_closed",
            "coordinates": [[12.9180, 80.0810], [12.9220, 80.0845], [12.9265, 80.0880]]
        },
        {
            "road_id": "RD-010", "name": "Outer Ring Service High Ridge Road", "city": "Chennai",
            "start_node": "N_VARADARAJAPURAM", "end_node": "SH_MUDICHUR_07",
            "length_meters": 1900, "elevation_m": 7.1, "flood_risk_score": 0.12, "water_depth_cm": 2,
            "status": "passable",
            "coordinates": [[12.9180, 80.0810], [12.9210, 80.0910], [12.9265, 80.0880]]
        },
        {
            "road_id": "RD-011", "name": "Pallikaranai Marsh Peripheral Road", "city": "Chennai",
            "start_node": "N_PALLIKARANAI_SOUTH", "end_node": "SH_PALLIKARANAI_08",
            "length_meters": 1150, "elevation_m": 3.1, "flood_risk_score": 0.72, "water_depth_cm": 45,
            "status": "waterlogged_slow",
            "coordinates": [[12.9300, 80.2070], [12.9350, 80.2080], [12.9395, 80.2085]]
        },
        {
            "road_id": "RD-012", "name": "Velachery - Tambaram Main Arterial", "city": "Chennai",
            "start_node": "N_VEL_JUNCTION", "end_node": "SH_TAMBARAM_06",
            "length_meters": 8200, "elevation_m": 7.4, "flood_risk_score": 0.22, "water_depth_cm": 8,
            "status": "passable",
            "coordinates": [[12.9780, 80.2180], [12.9500, 80.1700], [12.9290, 80.1320]]
        }
    ]
    return roads

def generate_flood_grid() -> List[Dict[str, Any]]:
    # Create a dense grid across South Chennai flood basin (100 cells)
    cells = []
    lat_start, lat_end = 12.9150, 13.0300
    lon_start, lon_end = 80.1200, 80.2600
    
    n_lat = 10
    n_lon = 10
    lat_step = (lat_end - lat_start) / n_lat
    lon_step = (lon_end - lon_start) / n_lon
    
    cell_idx = 1
    for i in range(n_lat):
        lat = lat_start + (i + 0.5) * lat_step
        for j in range(n_lon):
            lon = lon_start + (j + 0.5) * lon_step
            
            # Elevation decreases near marshlands and rivers
            dist_to_river = min(
                abs(lat - 13.0100) * 111000, # Adyar river
                abs(lat - 12.9350) * 111000  # Pallikaranai marsh
            )
            dist_to_drain = max(40.0, dist_to_river + random.uniform(-50, 100))
            
            elev = 2.0 + (dist_to_drain / 800.0) * 8.0 + random.uniform(-0.5, 1.2)
            elev = max(1.5, min(28.0, elev))
            slope = max(0.2, min(5.0, (elev / 8.0) * 1.5 + random.uniform(-0.2, 0.4)))
            
            # Rainfall baseline 140mm
            rainfall = 140.0 + random.uniform(-20, 45)
            soil_sat = min(0.98, max(0.50, 0.70 + (200.0 / dist_to_drain) * 0.15))
            flow_accum = max(100.0, (10000.0 / (elev + 0.5)) + random.uniform(-500, 1500))
            
            # Model susceptibility score computation
            susceptibility = (
                (1.0 - (min(elev, 12.0) / 12.0)) * 0.40 +
                (min(dist_to_drain, 1000.0) / 1000.0 * -0.25 + 0.25) +
                (soil_sat * 0.20) +
                ((rainfall / 200.0) * 0.15)
            )
            susceptibility = round(min(0.99, max(0.04, susceptibility)), 3)
            
            if susceptibility >= 0.75:
                cat = "Critical"
                water_depth = round((susceptibility - 0.70) * 120 + random.uniform(10, 30), 1)
            elif susceptibility >= 0.50:
                cat = "High"
                water_depth = round((susceptibility - 0.45) * 60 + random.uniform(5, 15), 1)
            elif susceptibility >= 0.25:
                cat = "Moderate"
                water_depth = round(random.uniform(5, 20), 1)
            else:
                cat = "Low"
                water_depth = 0.0
                
            cells.append({
                "cell_id": f"CELL-{cell_idx:03d}",
                "city": "Chennai",
                "latitude": round(lat, 5),
                "longitude": round(lon, 5),
                "elevation_m": round(elev, 2),
                "slope_deg": round(slope, 2),
                "distance_to_drain_m": round(dist_to_drain, 1),
                "soil_saturation": round(soil_sat, 2),
                "rainfall_accum_24h_mm": round(rainfall, 1),
                "flow_accumulation": round(flow_accum, 1),
                "flood_susceptibility": susceptibility,
                "risk_category": cat,
                "estimated_water_depth_cm": water_depth,
                "confidence": round(random.uniform(0.89, 0.96), 2),
                "model_version": "SEER-LGBM-v1.2"
            })
            cell_idx += 1
            
    return cells

def generate_historical_2015_replay() -> Dict[str, Any]:
    return {
        "event_id": "CHENNAI_2015_DELUGE",
        "title": "Chennai Deluge Reconstructed Demonstration (Dec 2015)",
        "city": "Chennai",
        "narrative": "A low-pressure depression over the Bay of Bengal dropped unprecedented precipitation exceeding 490 mm over 24 hours, causing Adyar and Chembarambakkam overflows.",
        "timesteps": [
            {
                "step_index": 1,
                "timestamp": "2015-11-30 08:00",
                "label": "Depression Onset",
                "rainfall_24h_mm": 85.0,
                "chembarambakkam_discharge_cusecs": 1200,
                "flooded_zones_count": 8,
                "critical_households": 12,
                "summary": "Initial rainfall intensification. Waterlogged roads in low-lying pockets of Velachery and Mudichur.",
                "risk_distribution": {"low": 65, "moderate": 25, "high": 8, "critical": 2}
            },
            {
                "step_index": 2,
                "timestamp": "2015-11-30 20:00",
                "label": "Continuous Heavy Downpour",
                "rainfall_24h_mm": 195.0,
                "chembarambakkam_discharge_cusecs": 5500,
                "flooded_zones_count": 22,
                "critical_households": 34,
                "summary": "Soil saturation reached 90%. Pallikaranai marshland expanded beyond normal bunds.",
                "risk_distribution": {"low": 35, "moderate": 38, "high": 20, "critical": 7}
            },
            {
                "step_index": 3,
                "timestamp": "2015-12-01 10:00",
                "label": "Reservoir Discharges & Canal Breach",
                "rainfall_24h_mm": 310.0,
                "chembarambakkam_discharge_cusecs": 18000,
                "flooded_zones_count": 48,
                "critical_households": 72,
                "summary": "Adyar river breached embankments near Saidapet bridge. Ground floor inundation in Velachery and Ram Nagar.",
                "risk_distribution": {"low": 15, "moderate": 30, "high": 35, "critical": 20}
            },
            {
                "step_index": 4,
                "timestamp": "2015-12-01 22:00",
                "label": "Peak Catastrophic Deluge",
                "rainfall_24h_mm": 435.0,
                "chembarambakkam_discharge_cusecs": 29000,
                "flooded_zones_count": 78,
                "critical_households": 105,
                "summary": "Peak deluge. Complete road cutoffs in Mudichur, Velachery, and Saidapet. Mass emergency rescue initiated.",
                "risk_distribution": {"low": 5, "moderate": 18, "high": 42, "critical": 35}
            },
            {
                "step_index": 5,
                "timestamp": "2015-12-02 12:00",
                "label": "Peak Rescue & Subsiding Phase",
                "rainfall_24h_mm": 460.0,
                "chembarambakkam_discharge_cusecs": 21000,
                "flooded_zones_count": 64,
                "critical_households": 88,
                "summary": "Rainfall eased slightly. Massive relief deployment, boat evacuations, and shelter distribution across South Chennai.",
                "risk_distribution": {"low": 12, "moderate": 28, "high": 36, "critical": 24}
            }
        ]
    }
