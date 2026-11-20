export type UserRole = 'admin' | 'officer' | 'responder' | 'citizen';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  household_id?: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  full_name: string;
  email: string;
  household_id?: string;
}

export interface Household {
  id: number;
  household_id: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  neighbourhood: string;
  household_size: number;
  elderly_count: number;
  children_count: number;
  disabled_count: number;
  mobility_status: 'independent' | 'slow_mobility' | 'wheelchair_dependent' | 'bedridden';
  ground_floor_status: boolean;
  building_type: 'kutcha' | 'semi_pucca' | 'pucca_low_rise' | 'pucca_multi_storey';
  flood_exposure: number;
  distance_to_shelter: number;
  phone_available: boolean;
  contact_number: string;
  contact_name: string;
  preferred_language: 'ta' | 'en' | 'hi';
  evacuation_status: 'contacted' | 'evacuation_initiated' | 'safe' | 'rescue_required' | 'unreachable';
  vulnerability_score: number;
  risk_category: 'Low' | 'Moderate' | 'High' | 'Critical';
  is_synthetic: boolean;
  notes?: string;
  updated_at?: string;
}

export interface VulnerabilityBreakdown {
  household_id: string;
  flood_score: number;
  elderly_score: number;
  children_score: number;
  mobility_score: number;
  ground_floor_score: number;
  shelter_distance_score: number;
  building_score: number;
  total_score: number;
  risk_category: string;
  reasons: string[];
}

export interface VulnerabilityWeights {
  w_flood_exposure: number;
  w_elderly: number;
  w_children: number;
  w_mobility: number;
  w_ground_floor: number;
  w_distance_shelter: number;
  w_building_kutcha: number;
}

export interface FloodGridCell {
  id: number;
  cell_id: string;
  city: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  slope_deg: number;
  distance_to_drain_m: number;
  soil_saturation: number;
  rainfall_accum_24h_mm: number;
  flow_accumulation: number;
  flood_susceptibility: number;
  risk_category: 'Low' | 'Moderate' | 'High' | 'Critical';
  estimated_water_depth_cm: number;
  confidence: number;
  model_version: string;
}

export interface Shelter {
  id: number;
  shelter_id: string;
  name: string;
  city: string;
  neighbourhood: string;
  latitude: number;
  longitude: number;
  capacity: number;
  current_occupancy: number;
  available_capacity: number;
  is_accessible: boolean;
  amenities: string[];
  status: 'open' | 'approaching_capacity' | 'full' | 'closed';
  contact_person: string;
  contact_phone: string;
}

export interface RoadSegment {
  road_id: string;
  name: string;
  city: string;
  start_node: string;
  end_node: string;
  length_meters: number;
  elevation_m: number;
  flood_risk_score: number;
  water_depth_cm: number;
  status: 'passable' | 'waterlogged_slow' | 'flooded_closed' | 'emergency_vehicles_only';
  coordinates: [number, number][];
}

export interface RouteStep {
  instruction: string;
  distance_m: number;
  road_name: string;
  road_status: string;
  road_risk: number;
}

export interface SafeRoute {
  route_id: string;
  household_id: string;
  shelter_id: string;
  shelter_name: string;
  total_distance_m: number;
  estimated_duration_min: number;
  route_risk_level: string;
  avoids_flooded_roads: boolean;
  path_coordinates: [number, number][];
  steps: RouteStep[];
  limitations?: string;
}

export interface Alert {
  id: number;
  alert_id: string;
  household_id: string;
  recipient_phone: string;
  language: string;
  title: string;
  message_body: string;
  severity: string;
  channels: string[];
  status: 'draft' | 'pending_approval' | 'approved' | 'dispatched' | 'delivered' | 'rejected';
  approved_by?: string;
  rejection_reason?: string;
  created_at: string;
  dispatched_at?: string;
}

export interface AgentDecision {
  household_id: string;
  risk_summary: {
    household_id: string;
    contact_name: string;
    neighbourhood: string;
    composite_score: number;
    risk_category: string;
    mobility_status: string;
    ground_floor: boolean;
    reasons: string[];
  };
  nearest_shelter: Shelter;
  recommended_route: SafeRoute;
  generated_alert: {
    en: string;
    ta: string;
    hi: string;
  };
  decision_reasoning: string[];
  tools_executed: string[];
}

export interface DashboardSummaryData {
  city: string;
  alert_level: 'Low' | 'Moderate' | 'High' | 'Critical';
  predicted_rainfall_24h_mm: number;
  current_precipitation_rate_mm: number;
  high_risk_grid_cells: number;
  total_grid_cells: number;
  affected_households: number;
  vulnerable_households_requiring_assistance: number;
  available_shelters_count: number;
  shelter_total_capacity: number;
  shelter_occupied_capacity: number;
  active_evacuation_alerts: number;
  pending_rescue_requests: number;
  last_updated: string;
}

export interface ReplayTimestep {
  step_index: number;
  timestamp: string;
  label: string;
  rainfall_24h_mm: number;
  chembarambakkam_discharge_cusecs: number;
  flooded_zones_count: number;
  critical_households: number;
  summary: string;
  risk_distribution: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
}

export interface ReplayEvent {
  event_id: string;
  title: string;
  city: string;
  narrative: string;
  timesteps: ReplayTimestep[];
}

export interface ModelTransparencyData {
  model_name: string;
  version: string;
  trained_at?: string;
  accuracy: number;
  roc_auc: number;
  f1_score: number;
  precision: number;
  recall: number;
  confusion_matrix: number[][];
  feature_importance: Record<string, number>;
  limitations: string;
}

export interface DataSourceItem {
  id: number;
  source_name: string;
  dataset_type: string;
  update_frequency: string;
  status: string;
  record_count: number;
  attribution: string;
  url: string;
  last_fetched?: string;
}
