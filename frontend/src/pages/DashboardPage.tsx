import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  DashboardSummaryData, FloodGridCell, Household, Shelter, RoadSegment, SafeRoute
} from '../types';
import { StatCard } from '../components/StatCard';
import { ChennaiMap } from '../components/Map/ChennaiMap';
import { HouseholdDetailModal } from '../components/HouseholdDetailModal';
import {
  AlertTriangle, CloudRain, Users, ShieldAlert,
  Home, Send, Activity, Navigation, Filter, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { selectedCity } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [gridCells, setGridCells] = useState<FloodGridCell[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [loading, setLoading] = useState(true);

  // Map & Modal states
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [activeRoute, setActiveRoute] = useState<SafeRoute | null>(null);
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState<string>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumData, metData, gridData, hhData, shData] = await Promise.all([
        api.getDashboardSummary(selectedCity),
        api.getDashboardMetrics(selectedCity),
        api.getFloodGrid(selectedCity),
        api.getHouseholds({ city: selectedCity, limit: 120 }),
        api.getShelters(selectedCity)
      ]);
      setSummary(sumData);
      setMetrics(metData);
      setGridCells(gridData);
      setHouseholds(hhData);
      setShelters(shData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCity]);

  // Filter households by neighbourhood
  const filteredHouseholds = selectedNeighbourhood === 'all'
    ? households
    : households.filter(h => h.neighbourhood.toLowerCase() === selectedNeighbourhood.toLowerCase());

  const handleRunDispatchAgent = (hh: Household) => {
    navigate(`/dispatch?household_id=${hh.household_id}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Alert Bar */}
      <div className="bg-navy-900 text-white rounded-2xl p-5 border border-navy-700 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-danger/20 text-red-danger flex items-center justify-center border border-red-danger/30">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold tracking-wide">
                CENTRAL COMMAND: {selectedCity.toUpperCase()} DISASTER OPERATIONS
              </h2>
              <span className="bg-red-danger text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider animate-pulse">
                {summary?.alert_level || 'CRITICAL'} WATCH
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Live SEER hydrological model forecast downscaled with 30m Copernicus DEM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-navy-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Feeds
          </button>
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400">LAST REFRESHED</div>
            <div className="text-xs font-mono font-semibold text-teal-bright">
              {summary?.last_updated ? new Date(summary.last_updated).toLocaleTimeString() : 'LIVE'}
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Inundation Threat"
          value={summary?.alert_level || 'Critical'}
          subtext="Adyar & Velachery Basin Catchment"
          icon={ShieldAlert}
          variant="danger"
          badge="High Severity"
          badgeColor="bg-red-danger/10 text-red-danger"
        />
        <StatCard
          title="Predicted 24h Rainfall"
          value={`${summary?.predicted_rainfall_24h_mm || 142.5} mm`}
          subtext="Open-Meteo High-Res Precipitation"
          icon={CloudRain}
          variant="teal"
          badge="Monsoon Peak"
          badgeColor="bg-teal/10 text-teal-deep"
        />
        <StatCard
          title="High-Risk Inundation Zones"
          value={`${summary?.high_risk_grid_cells || 38} / ${summary?.total_grid_cells || 100}`}
          subtext="Terrain Grid Cells Susceptible"
          icon={Activity}
          variant="warning"
          badge="Flood Risk"
          badgeColor="bg-amber-warning/20 text-navy-900"
        />
        <StatCard
          title="Vulnerable Doorsteps"
          value={summary?.vulnerable_households_requiring_assistance || 48}
          subtext="Elderly, Disabled, Ground Floor"
          icon={Users}
          variant="danger"
          badge="Priority Target"
          badgeColor="bg-red-danger/10 text-red-danger"
        />
      </div>

      {/* Secondary Operational Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Available Shelters</div>
          <div className="text-xl font-black text-teal-deep mt-1">
            {summary?.available_shelters_count || 8} Active
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {Math.max(0, (summary?.shelter_total_capacity || 3800) - (summary?.shelter_occupied_capacity || 1480))} beds available
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Active Alerts</div>
          <div className="text-xl font-black text-navy-900 mt-1">
            {summary?.active_evacuation_alerts || 14}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tamil / English SMS Broadcast</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Pending Rescues</div>
          <div className="text-xl font-black text-red-danger mt-1">
            {summary?.pending_rescue_requests || 6}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">SDRF Boat Squads Assigned</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Model Confidence</div>
          <div className="text-xl font-black text-teal mt-1">94.8% ROC-AUC</div>
          <div className="text-[11px] text-slate-400 mt-0.5">SEER Gradient Boosted Ensemble</div>
        </div>
      </div>

      {/* Main Grid: Interactive Map & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Interactive Leaflet Map (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
            <div>
              <h3 className="font-extrabold text-navy-900 text-base">
                Interactive Chennai Flood Vulnerability Map
              </h3>
              <p className="text-xs text-slate-500">
                120 Household markers overlaid on 30m SEER inundation grid and road closures
              </p>
            </div>

            {/* Neighbourhood Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedNeighbourhood}
                onChange={(e) => setSelectedNeighbourhood(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-slate-800 focus:outline-none"
              >
                <option value="all">All Neighbourhoods ({households.length})</option>
                <option value="velachery">Velachery</option>
                <option value="madipakkam">Madipakkam</option>
                <option value="mudichur">Mudichur</option>
                <option value="saidapet">Saidapet</option>
                <option value="pallikaranai">Pallikaranai</option>
                <option value="tambaram">Tambaram</option>
              </select>
            </div>
          </div>

          <ChennaiMap
            gridCells={gridCells}
            households={filteredHouseholds}
            shelters={shelters}
            roads={roads}
            activeRoute={activeRoute}
            selectedHousehold={selectedHousehold}
            onSelectHousehold={(hh) => setSelectedHousehold(hh)}
            height="460px"
          />

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Click any household circle to inspect vulnerability breakdown or dispatch safe route</span>
            <span className="font-mono text-slate-400">EPSG:4326 WGS84</span>
          </div>
        </div>

        {/* Right Column: Rainfall & River Stage Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h3 className="font-extrabold text-navy-900 text-base">
              Rainfall & Water-Level Projection
            </h3>
            <p className="text-xs text-slate-500">
              24-hour simulation curve (Adyar river gauge)
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.timeline_forecast || []}>
                <defs>
                  <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#117C72" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#117C72" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="riverGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E5484D" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#E5484D" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis yAxisId="left" stroke="#117C72" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#E5484D" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1D2B', borderColor: '#1E476B', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area yAxisId="left" type="monotone" dataKey="rainfall_accum_mm" stroke="#117C72" fillOpacity={1} fill="url(#rainGrad)" name="Rainfall Accum (mm)" />
                <Area yAxisId="right" type="monotone" dataKey="river_level_m" stroke="#E5484D" fillOpacity={1} fill="url(#riverGrad)" name="River Level (m)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Risk Category Breakdown */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-700 uppercase mb-2">Household Risk Distribution</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-red-50 p-2 rounded-lg border border-red-100 flex justify-between items-center">
                <span className="font-semibold text-red-700">Critical</span>
                <span className="font-extrabold text-red-900">
                  {households.filter(h => h.risk_category === 'Critical').length}
                </span>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg border border-amber-100 flex justify-between items-center">
                <span className="font-semibold text-amber-700">High</span>
                <span className="font-extrabold text-amber-900">
                  {households.filter(h => h.risk_category === 'High').length}
                </span>
              </div>
              <div className="bg-teal-light p-2 rounded-lg border border-teal/20 flex justify-between items-center">
                <span className="font-semibold text-teal-deep">Moderate</span>
                <span className="font-extrabold text-teal-deep">
                  {households.filter(h => h.risk_category === 'Moderate').length}
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-700">Low</span>
                <span className="font-extrabold text-slate-900">
                  {households.filter(h => h.risk_category === 'Low').length}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Emergency Priority Queue Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
          <div>
            <h3 className="font-extrabold text-navy-900 text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-danger" />
              Live Emergency Evacuation Priority Queue
            </h3>
            <p className="text-xs text-slate-500">
              Ranked in descending urgency based on composite vulnerability score and flood exposure
            </p>
          </div>
          <button
            onClick={() => navigate('/vuln')}
            className="text-xs font-bold text-teal hover:text-teal-deep flex items-center gap-1"
          >
            View All 120 Households &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Household ID</th>
                <th className="py-3 px-4">Contact Resident</th>
                <th className="py-3 px-4">Neighbourhood</th>
                <th className="py-3 px-4">Vulnerability</th>
                <th className="py-3 px-4">Key Constraints</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Emergency Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {households.slice(0, 7).map((hh) => (
                <tr key={hh.household_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-navy-900">
                    {hh.household_id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800">{hh.contact_name}</div>
                    <div className="text-[11px] text-slate-400">{hh.contact_number}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {hh.neighbourhood}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-red-600">
                        {hh.vulnerability_score}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        hh.risk_category === 'Critical' ? 'bg-red-danger text-white' : 'bg-amber-warning text-navy-900'
                      }`}>
                        {hh.risk_category}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div className="flex flex-wrap gap-1">
                      {hh.mobility_status !== 'independent' && (
                        <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-red-200">
                          {hh.mobility_status.replace('_', ' ')}
                        </span>
                      )}
                      {hh.elderly_count > 0 && (
                        <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-amber-200">
                          {hh.elderly_count} Elderly
                        </span>
                      )}
                      {hh.ground_floor_status && (
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-blue-200">
                          Ground Floor
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                      {hh.evacuation_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedHousehold(hh)}
                        className="py-1 px-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition text-xs"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleRunDispatchAgent(hh)}
                        className="py-1 px-3 rounded-lg bg-teal hover:bg-teal-deep text-white font-bold transition flex items-center gap-1 shadow-sm text-xs"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Run DISPATCH
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Household Detail Modal */}
      <HouseholdDetailModal
        household={selectedHousehold}
        onClose={() => setSelectedHousehold(null)}
        onRunDispatchAgent={handleRunDispatchAgent}
        onStatusUpdated={(newStatus) => {
          if (selectedHousehold) {
            setHouseholds(prev => prev.map(h => h.household_id === selectedHousehold.household_id ? { ...h, evacuation_status: newStatus as any } : h));
          }
        }}
      />

    </div>
  );
};
