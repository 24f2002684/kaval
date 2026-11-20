import math
from typing import Dict, Any

class TerrainHydrology:
    """
    Experimental terrain-based water accumulation and HAND-style drainage approximation
    """
    @staticmethod
    def calculate_scs_curve_number_runoff(rainfall_mm: float, cn: float = 85.0) -> float:
        """
        SCS-CN Runoff approximation:
        P = precipitation in mm
        S = potential maximum retention = (25400 / CN) - 254
        Ia = 0.2 * S (initial abstraction)
        Q = (P - Ia)^2 / (P - Ia + S) for P > Ia, else 0
        """
        if rainfall_mm <= 0:
            return 0.0
            
        s = (25400.0 / cn) - 254.0
        ia = 0.2 * s
        
        if rainfall_mm <= ia:
            return 0.0
            
        runoff = ((rainfall_mm - ia) ** 2) / (rainfall_mm - ia + s)
        return round(float(runoff), 2)

    @staticmethod
    def calculate_hand_drainage_height(elevation_m: float, river_elev_m: float = 1.5) -> float:
        """
        Height Above Nearest Drainage (HAND) heuristic in meters
        """
        return max(0.0, round(elevation_m - river_elev_m, 2))
