import React, { useState } from 'react';
import { Household, VulnerabilityBreakdown } from '../types';
import { api } from '../services/api';
import { X, ShieldAlert, Navigation, Phone, CheckCircle, AlertOctagon, User } from 'lucide-react';

interface HouseholdDetailModalProps {
  household: Household | null;
  onClose: () => void;
  onStatusUpdated?: (newStatus: string) => void;
  onRunDispatchAgent?: (hh: Household) => void;
}

export const HouseholdDetailModal: React.FC<HouseholdDetailModalProps> = ({
  household,
  onClose,
  onStatusUpdated,
  onRunDispatchAgent
}) => {
  if (!household) return null;

  const [loadingStatus, setLoadingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(household.evacuation_status);

  const handleStatusChange = async (status: string) => {
    try {
      setLoadingStatus(true);
      await api.updateHouseholdStatus(household.household_id, status);
      setCurrentStatus(status as any);
      if (onStatusUpdated) onStatusUpdated(status);
    } catch (err) {
      alert('Failed to update status: ' + err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const riskBadgeColors: Record<string, string> = {
    Critical: 'bg-red-danger text-white',
    High: 'bg-amber-warning text-navy-900 font-bold',
    Moderate: 'bg-teal text-white',
    Low: 'bg-teal-bright text-navy-900 font-bold'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-navy-900 text-white p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-teal-bright">{household.household_id}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${riskBadgeColors[household.risk_category]}`}>
                {household.risk_category.toUpperCase()} RISK
              </span>
            </div>
            <h2 className="text-xl font-bold">{household.contact_name}</h2>
            <p className="text-xs text-slate-300 mt-1">{household.address}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-navy-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Key Indicators Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Vulnerability</div>
              <div className="text-xl font-black text-red-danger mt-1">{household.vulnerability_score}/100</div>
              <div className="text-[10px] text-slate-400">Weighted Risk Index</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Flood Exposure</div>
              <div className="text-xl font-black text-navy-900 mt-1">{(household.flood_exposure * 100).toFixed(0)}%</div>
              <div className="text-[10px] text-slate-400">SEER Terrain Basin</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Mobility</div>
              <div className="text-sm font-bold text-navy-900 mt-1 capitalize">{household.mobility_status.replace('_', ' ')}</div>
              <div className="text-[10px] text-slate-400">{household.disabled_count > 0 ? 'Assistance required' : 'Standard'}</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Ground Floor</div>
              <div className="text-sm font-bold text-navy-900 mt-1">{household.ground_floor_status ? 'Yes (High Threat)' : 'No (Elevated)'}</div>
              <div className="text-[10px] text-slate-400">{household.building_type.replace('_', ' ')}</div>
            </div>
          </div>

          {/* Demographics Breakdown */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold uppercase text-navy-900 mb-3 tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal" /> Resident Demographics
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500">Total Size</div>
                <div className="text-lg font-bold text-navy-900">{household.household_size}</div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500">Elderly (60+)</div>
                <div className="text-lg font-bold text-amber-600">{household.elderly_count}</div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500">Children (&lt;10)</div>
                <div className="text-lg font-bold text-blue-600">{household.children_count}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-600 px-1">
              <span>Contact: <b>{household.contact_number}</b></span>
              <span>Pref. Language: <b className="uppercase">{household.preferred_language}</b></span>
              <span>Distance to Shelter: <b>{household.distance_to_shelter} m</b></span>
            </div>
          </div>

          {/* Real-time Evacuation Status Switcher */}
          <div>
            <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-2">
              Update Household Status (Responder Action)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'contacted', label: 'Contacted', color: 'hover:border-blue-500 text-blue-700' },
                { id: 'evacuation_initiated', label: 'Evac Initiated', color: 'hover:border-amber-500 text-amber-700' },
                { id: 'safe', label: 'Mark Safe', color: 'hover:border-emerald-500 text-emerald-700' },
                { id: 'rescue_required', label: 'Rescue Required', color: 'hover:border-red-500 text-red-700' },
                { id: 'unreachable', label: 'Unreachable', color: 'hover:border-slate-500 text-slate-700' },
              ].map(st => (
                <button
                  key={st.id}
                  disabled={loadingStatus}
                  onClick={() => handleStatusChange(st.id)}
                  className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition ${st.color} ${
                    currentStatus === st.id ? 'bg-navy-900 text-white border-navy-900 shadow' : 'bg-white border-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Coordinates: {household.latitude}, {household.longitude}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (onRunDispatchAgent) onRunDispatchAgent(household);
                onClose();
              }}
              className="py-2 px-4 rounded-xl bg-teal text-white font-bold text-xs hover:bg-teal-deep transition flex items-center gap-1.5 shadow"
            >
              <Navigation className="w-4 h-4" />
              Launch DISPATCH Agent
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
