import {
  AuthResponse, DashboardSummaryData, FloodGridCell, Household,
  VulnerabilityBreakdown, VulnerabilityWeights, Shelter, SafeRoute,
  Alert, AgentDecision, ReplayEvent, ModelTransparencyData, DataSourceItem
} from '../types';

const API_BASE = 'http://localhost:8000/api';

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('kaval_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // --- Auth ---
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Invalid login credentials');
    const data = await res.json();
    localStorage.setItem('kaval_token', data.access_token);
    localStorage.setItem('kaval_user', JSON.stringify(data));
    return data;
  }

  async demoSwitch(role: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (!res.ok) throw new Error('Failed to switch demo role');
    const data = await res.json();
    localStorage.setItem('kaval_token', data.access_token);
    localStorage.setItem('kaval_user', JSON.stringify(data));
    return data;
  }

  // --- Dashboard ---
  async getDashboardSummary(city = 'Chennai'): Promise<DashboardSummaryData> {
    try {
      const res = await fetch(`${API_BASE}/dashboard/summary?city=${city}`, {
        headers: this.getHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch summary');
      const data = await res.json();
      localStorage.setItem(`kaval_summary_${city}`, JSON.stringify(data));
      return data;
    } catch (e) {
      const cached = localStorage.getItem(`kaval_summary_${city}`);
      if (cached) return JSON.parse(cached);
      throw e;
    }
  }

  async getDashboardMetrics(city = 'Chennai') {
    const res = await fetch(`${API_BASE}/dashboard/metrics?city=${city}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return await res.json();
  }

  // --- SEER ---
  async getWeather(city = 'Chennai') {
    const res = await fetch(`${API_BASE}/seer/weather?city=${city}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch weather');
    return await res.json();
  }

  async getFloodGrid(city = 'Chennai'): Promise<FloodGridCell[]> {
    try {
      const res = await fetch(`${API_BASE}/seer/flood-grid?city=${city}`, {
        headers: this.getHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch flood grid');
      const data = await res.json();
      localStorage.setItem(`kaval_grid_${city}`, JSON.stringify(data));
      return data;
    } catch (e) {
      const cached = localStorage.getItem(`kaval_grid_${city}`);
      if (cached) return JSON.parse(cached);
      throw e;
    }
  }

  async getFloodGridGeoJson(city = 'Chennai') {
    const res = await fetch(`${API_BASE}/seer/geojson?city=${city}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch GeoJSON');
    return await res.json();
  }

  async runSEERPrediction(city = 'Chennai', rainfall_scenario_mm?: number) {
    const res = await fetch(`${API_BASE}/seer/predict`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ city, rainfall_scenario_mm })
    });
    if (!res.ok) throw new Error('Prediction run failed');
    return await res.json();
  }

  async uploadSEERData(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/seer/upload-data`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Data upload failed');
    return await res.json();
  }

  // --- VULN ---
  async getHouseholds(params?: {
    city?: string;
    neighbourhood?: string;
    risk_category?: string;
    evacuation_status?: string;
    search?: string;
    limit?: number;
  }): Promise<Household[]> {
    const searchParams = new URLSearchParams();
    if (params?.city) searchParams.append('city', params.city);
    if (params?.neighbourhood) searchParams.append('neighbourhood', params.neighbourhood);
    if (params?.risk_category) searchParams.append('risk_category', params.risk_category);
    if (params?.evacuation_status) searchParams.append('evacuation_status', params.evacuation_status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.limit) searchParams.append('limit', String(params.limit));

    try {
      const res = await fetch(`${API_BASE}/vuln/households?${searchParams.toString()}`, {
        headers: this.getHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch households');
      const data = await res.json();
      localStorage.setItem('kaval_households_cache', JSON.stringify(data));
      return data;
    } catch (e) {
      const cached = localStorage.getItem('kaval_households_cache');
      if (cached) return JSON.parse(cached);
      throw e;
    }
  }

  async getHouseholdDetail(householdId: string): Promise<{ household: Household; breakdown: VulnerabilityBreakdown }> {
    const res = await fetch(`${API_BASE}/vuln/households/${householdId}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch household detail');
    return await res.json();
  }

  async getPriorityQueue(city = 'Chennai', limit = 50): Promise<Household[]> {
    const res = await fetch(`${API_BASE}/vuln/priority-queue?city=${city}&limit=${limit}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch priority queue');
    return await res.json();
  }

  async recalculateVulnerability(weights: VulnerabilityWeights) {
    const res = await fetch(`${API_BASE}/vuln/recalculate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(weights)
    });
    if (!res.ok) throw new Error('Recalculation failed');
    return await res.json();
  }

  async updateHouseholdStatus(householdId: string, evacuation_status: string, notes?: string) {
    const res = await fetch(`${API_BASE}/vuln/households/${householdId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ evacuation_status, notes })
    });
    if (!res.ok) throw new Error('Status update failed');
    return await res.json();
  }

  // --- DISPATCH ---
  async getAgentRecommendation(householdId: string, language = 'ta'): Promise<AgentDecision> {
    const res = await fetch(`${API_BASE}/dispatch/recommend`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ household_id: householdId, language })
    });
    if (!res.ok) throw new Error('Agent execution failed');
    return await res.json();
  }

  async getSafeRoute(householdId: string, shelterId?: string): Promise<SafeRoute> {
    const res = await fetch(`${API_BASE}/dispatch/route`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ household_id: householdId, shelter_id: shelterId })
    });
    if (!res.ok) throw new Error('Routing calculation failed');
    return await res.json();
  }

  async generateAlert(householdId: string, language = 'ta'): Promise<Alert> {
    const res = await fetch(`${API_BASE}/dispatch/generate-alert`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ household_id: householdId, language })
    });
    if (!res.ok) throw new Error('Alert generation failed');
    return await res.json();
  }

  async getAlerts(status?: string): Promise<Alert[]> {
    const url = status ? `${API_BASE}/dispatch/alerts?status=${status}` : `${API_BASE}/dispatch/alerts`;
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return await res.json();
  }

  async approveAlert(alertId: string): Promise<Alert> {
    const res = await fetch(`${API_BASE}/dispatch/alerts/${alertId}/approve`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Alert approval failed');
    return await res.json();
  }

  async rejectAlert(alertId: string, rejection_reason?: string): Promise<Alert> {
    const res = await fetch(`${API_BASE}/dispatch/alerts/${alertId}/reject`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ approved: false, rejection_reason })
    });
    if (!res.ok) throw new Error('Alert rejection failed');
    return await res.json();
  }

  // --- Shelters ---
  async getShelters(city = 'Chennai'): Promise<Shelter[]> {
    const res = await fetch(`${API_BASE}/shelters?city=${city}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch shelters');
    return await res.json();
  }

  async updateShelter(shelterId: string, data: { current_occupancy?: number; status?: string }): Promise<Shelter> {
    const res = await fetch(`${API_BASE}/shelters/${shelterId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Shelter update failed');
    return await res.json();
  }

  // --- Citizen Portal ---
  async getCitizenData(householdId = 'HH-CHE-001') {
    try {
      const res = await fetch(`${API_BASE}/citizen/household?household_id=${householdId}`, {
        headers: this.getHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch citizen info');
      const data = await res.json();
      localStorage.setItem(`kaval_citizen_${householdId}`, JSON.stringify(data));
      return data;
    } catch (e) {
      const cached = localStorage.getItem(`kaval_citizen_${householdId}`);
      if (cached) return JSON.parse(cached);
      throw e;
    }
  }

  async submitCitizenSafe(householdId: string) {
    try {
      const res = await fetch(`${API_BASE}/citizen/safe`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ household_id: householdId, action: 'SAFE' })
      });
      return await res.json();
    } catch {
      // Offline queue
      const queue = JSON.parse(localStorage.getItem('kaval_offline_queue') || '[]');
      queue.push({ type: 'SAFE', householdId, time: new Date().toISOString() });
      localStorage.setItem('kaval_offline_queue', JSON.stringify(queue));
      return { status: 'queued_offline', message: 'Offline: Response saved locally and will transmit once connection resumes.' };
    }
  }

  async submitCitizenHelp(householdId: string, options?: { people_count?: number; medical_urgency?: boolean; additional_notes?: string }) {
    try {
      const res = await fetch(`${API_BASE}/citizen/request-help`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ household_id: householdId, action: 'NEED_HELP', ...options })
      });
      return await res.json();
    } catch {
      // Offline queue
      const queue = JSON.parse(localStorage.getItem('kaval_offline_queue') || '[]');
      queue.push({ type: 'HELP', householdId, options, time: new Date().toISOString() });
      localStorage.setItem('kaval_offline_queue', JSON.stringify(queue));
      return { status: 'queued_offline', message: 'Offline: Emergency distress saved locally and will transmit once connection resumes.' };
    }
  }

  // --- Replay ---
  async getReplayEvents() {
    const res = await fetch(`${API_BASE}/replay/events`);
    return await res.json();
  }

  async getReplayEventDetail(eventId = 'CHENNAI_2015_DELUGE'): Promise<ReplayEvent> {
    const res = await fetch(`${API_BASE}/replay/${eventId}`);
    return await res.json();
  }

  // --- Transparency & Sources ---
  async getModelTransparency(): Promise<ModelTransparencyData> {
    const res = await fetch(`${API_BASE}/transparency/model`);
    return await res.json();
  }

  async getDataSources(): Promise<DataSourceItem[]> {
    const res = await fetch(`${API_BASE}/transparency/data-sources`);
    return await res.json();
  }

  // --- Settings ---
  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`);
    return await res.json();
  }

  async updateSettings(data: { active_city: string; vulnerability_weights?: VulnerabilityWeights }) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  }
}

export const api = new ApiService();
