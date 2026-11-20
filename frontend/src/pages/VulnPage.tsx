import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Household, VulnerabilityWeights } from '../types';
import { HouseholdDetailModal } from '../components/HouseholdDetailModal';
import {
  Users, Sliders, Search, Filter, ShieldAlert,
  Phone, UserCheck, AlertOctagon, Navigation, CheckCircle, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VulnPage: React.FC = () => {
  const { selectedCity } = useAuth();
  const navigate = useNavigate();

  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [neighbourhoodFilter, setNeighbourhoodFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Configurable Weights
  const [showWeightTuner, setShowWeightTuner] = useState(false);
  const [weights, setWeights] = useState<VulnerabilityWeights>({
    w_flood_exposure: 0.35,
    w_elderly: 0.15,
    w_children: 0.10,
    w_mobility: 0.15,
    w_ground_floor: 0.10,
    w_distance_shelter: 0.08,
    w_building_kutcha: 0.07,
  });
  const [recalculating, setRecalculating] = useState(false);

  const fetchHouseholds = async () => {
    try {
      setLoading(true);
      const data = await api.getHouseholds({
        city: selectedCity,
        limit: 150
      });
      setHouseholds(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseholds();
  }, [selectedCity]);

  const handleRecalculateWeights = async () => {
    try {
      setRecalculating(true);
      const res = await api.recalculateVulnerability(weights);
      await fetchHouseholds();
      alert(`Recalculation complete! ${res.critical_count} critical and ${res.high_count} high-risk households updated.`);
    } catch (err) {
      alert('Error recalculating weights: ' + err);
    } finally {
      setRecalculating(false);
    }
  };

  // Filter logic
  const filtered = households.filter(h => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = h.household_id.toLowerCase().includes(q) ||
                    h.contact_name.toLowerCase().includes(q) ||
                    h.address.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (neighbourhoodFilter !== 'all' && h.neighbourhood.toLowerCase() !== neighbourhoodFilter.toLowerCase()) {
      return false;
    }
    if (riskFilter !== 'all' && h.risk_category.toLowerCase() !== riskFilter.toLowerCase()) {
      return false;
    }
    if (statusFilter !== 'all' && h.evacuation_status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 border border-navy-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-teal-bright uppercase tracking-widest">ENGINE 2</span>
            <span className="bg-amber-warning/20 text-amber-warning text-[11px] font-bold px-2 py-0.5 rounded border border-amber-warning/30">
              HOUSEHOLD-LEVEL MICRO RISK
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            VULN – Vulnerability & Urgency Network Layer
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Identifies households that are most exposed and least capable of evacuating independently. Integrates mobility, elderly, ground floor status, and building structure.
          </p>
        </div>

        <button
          onClick={() => setShowWeightTuner(!showWeightTuner)}
          className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-teal-bright rounded-xl text-xs font-bold border border-navy-700 flex items-center gap-2 transition shadow-sm"
        >
          <Sliders className="w-4 h-4" />
          {showWeightTuner ? 'Hide Weight Tuner' : 'Configure Scoring Weights'}
        </button>
      </div>

      {/* Synthetic Data Disclaimer Banner */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold bg-blue-600 text-white px-2 py-0.5 rounded text-[10px]">
            SYNTHETIC DEMO DATA
          </span>
          <span>120 realistic simulated household profiles generated for Chennai flood basins. No real citizen PII is exposed.</span>
        </div>
        <span className="text-blue-700 font-mono font-bold text-[11px]">WorldPop & OSM Building Footprint Proxies</span>
      </div>

      {/* Configurable Weight Tuner Panel */}
      {showWeightTuner && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-navy-900 text-sm">Vulnerability Scoring Model Weights Tuner</h3>
              <p className="text-xs text-slate-500">Fine-tune the importance weights across environmental and demographic vulnerability factors.</p>
            </div>
            <button
              disabled={recalculating}
              onClick={handleRecalculateWeights}
              className="py-2 px-5 bg-teal hover:bg-teal-deep text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? 'Recalculating...' : 'Recalculate 120 Scores'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-slate-700">Flood Exposure Weight:</span>
                <span className="text-teal font-mono">{(weights.w_flood_exposure * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min="0.1" max="0.6" step="0.05"
                value={weights.w_flood_exposure}
                onChange={(e) => setWeights({ ...weights, w_flood_exposure: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-slate-700">Mobility Impairment:</span>
                <span className="text-teal font-mono">{(weights.w_mobility * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min="0.05" max="0.4" step="0.05"
                value={weights.w_mobility}
                onChange={(e) => setWeights({ ...weights, w_mobility: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-slate-700">Elderly Weight:</span>
                <span className="text-teal font-mono">{(weights.w_elderly * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min="0.05" max="0.3" step="0.05"
                value={weights.w_elderly}
                onChange={(e) => setWeights({ ...weights, w_elderly: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-slate-700">Ground Floor Threat:</span>
                <span className="text-teal font-mono">{(weights.w_ground_floor * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min="0.05" max="0.3" step="0.05"
                value={weights.w_ground_floor}
                onChange={(e) => setWeights({ ...weights, w_ground_floor: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Household ID or Resident..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={neighbourhoodFilter}
            onChange={(e) => setNeighbourhoodFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Neighbourhoods</option>
            <option value="velachery">Velachery</option>
            <option value="madipakkam">Madipakkam</option>
            <option value="mudichur">Mudichur</option>
            <option value="saidapet">Saidapet</option>
            <option value="pallikaranai">Pallikaranai</option>
            <option value="tambaram">Tambaram</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Risk Categories</option>
            <option value="critical">Critical (76-100)</option>
            <option value="high">High (51-75)</option>
            <option value="moderate">Moderate (26-50)</option>
            <option value="low">Low (0-25)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Evac Statuses</option>
            <option value="rescue_required">Rescue Required</option>
            <option value="evacuation_initiated">Evacuation Initiated</option>
            <option value="contacted">Contacted</option>
            <option value="safe">Safe</option>
            <option value="unreachable">Unreachable</option>
          </select>
        </div>
      </div>

      {/* Household Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Household</th>
                <th className="py-3.5 px-4">Contact Resident</th>
                <th className="py-3.5 px-4">Neighbourhood</th>
                <th className="py-3.5 px-4">Vulnerability Score</th>
                <th className="py-3.5 px-4">Demographics</th>
                <th className="py-3.5 px-4">Ground Floor</th>
                <th className="py-3.5 px-4">Evacuation Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((hh) => (
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
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-red-600">
                        {hh.vulnerability_score}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        hh.risk_category === 'Critical' ? 'bg-red-danger text-white' :
                        (hh.risk_category === 'High' ? 'bg-amber-warning text-navy-900' : 'bg-teal text-white')
                      }`}>
                        {hh.risk_category}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <span>{hh.household_size} people</span>
                    {hh.elderly_count > 0 && <span className="ml-1 text-amber-700 font-semibold">• {hh.elderly_count} elderly</span>}
                    {hh.mobility_status !== 'independent' && (
                      <div className="text-[10px] text-red-600 font-bold uppercase mt-0.5">
                        {hh.mobility_status.replace('_', ' ')}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {hh.ground_floor_status ? (
                      <span className="text-red-700 font-semibold">Yes (At-Risk)</span>
                    ) : (
                      <span className="text-slate-500">No (Upper Floor)</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                      {hh.evacuation_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedHousehold(hh)}
                        className="py-1 px-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition"
                      >
                        Breakdown
                      </button>
                      <button
                        onClick={() => navigate(`/dispatch?household_id=${hh.household_id}`)}
                        className="py-1 px-2.5 rounded-lg bg-teal hover:bg-teal-deep text-white font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        DISPATCH
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
        onRunDispatchAgent={(hh) => navigate(`/dispatch?household_id=${hh.household_id}`)}
        onStatusUpdated={(st) => {
          if (selectedHousehold) {
            setHouseholds(prev => prev.map(h => h.household_id === selectedHousehold.household_id ? { ...h, evacuation_status: st as any } : h));
          }
        }}
      />

    </div>
  );
};
