import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Household, Shelter, Alert, AgentDecision, SafeRoute } from '../types';
import { ChennaiMap } from '../components/Map/ChennaiMap';
import { AlertApprovalModal } from '../components/AlertApprovalModal';
import {
  Send, Bot, Navigation, ShieldCheck, CheckCircle2,
  AlertTriangle, Phone, Building2, Check, X, Languages, ArrowRight
} from 'lucide-react';

export const DispatchPage: React.FC = () => {
  const { selectedCity, role } = useAuth();
  const [searchParams] = useSearchParams();
  const queryHhId = searchParams.get('household_id');

  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedHhId, setSelectedHhId] = useState<string>(queryHhId || 'HH-CHE-001');
  const [selectedLang, setSelectedLang] = useState<'ta' | 'en' | 'hi'>('ta');

  // Agent State
  const [executingAgent, setExecutingAgent] = useState(false);
  const [decision, setDecision] = useState<AgentDecision | null>(null);

  // Shelters
  const [shelters, setShelters] = useState<Shelter[]>([]);

  // Alerts
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [approvalModalAlert, setApprovalModalAlert] = useState<Alert | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [hList, sList, aList] = await Promise.all([
          api.getHouseholds({ city: selectedCity, limit: 120 }),
          api.getShelters(selectedCity),
          api.getAlerts()
        ]);
        setHouseholds(hList);
        setShelters(sList);
        setAlerts(aList);
        if (queryHhId) {
          setSelectedHhId(queryHhId);
        } else if (hList.length > 0) {
          setSelectedHhId(hList[0].household_id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, [selectedCity, queryHhId]);

  const handleRunAgent = async () => {
    try {
      setExecutingAgent(true);
      const res = await api.getAgentRecommendation(selectedHhId, selectedLang);
      setDecision(res);
      // Refresh alerts list
      const freshAlerts = await api.getAlerts();
      setAlerts(freshAlerts);
    } catch (err) {
      alert('Error running AI decision agent: ' + err);
    } finally {
      setExecutingAgent(false);
    }
  };

  const handleGenerateAlert = async () => {
    try {
      const newAlert = await api.generateAlert(selectedHhId, selectedLang);
      const freshAlerts = await api.getAlerts();
      setAlerts(freshAlerts);
      setApprovalModalAlert(newAlert);
    } catch (err) {
      alert('Failed to generate alert: ' + err);
    }
  };

  const handleShelterOccupancyChange = async (shelterId: string, newOcc: number) => {
    try {
      const updated = await api.updateShelter(shelterId, { current_occupancy: newOcc });
      setShelters(prev => prev.map(s => s.shelter_id === shelterId ? updated : s));
    } catch (err) {
      console.error(err);
    }
  };

  const activeHousehold = households.find(h => h.household_id === selectedHhId);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 border border-navy-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-teal-bright uppercase tracking-widest">ENGINE 3</span>
            <span className="bg-emerald-500/20 text-emerald-400 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
              TOOL-USING AI AGENT
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            DISPATCH – Emergency Decision & Action System
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Converts SEER flood predictions and VULN household priorities into verified safe evacuation routing, shelter assignments, and human-authorized multilingual alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300">Target Language:</span>
          <div className="flex rounded-lg bg-navy-800 p-1 border border-navy-700 text-xs font-bold">
            <button
              onClick={() => setSelectedLang('ta')}
              className={`px-2.5 py-1 rounded ${selectedLang === 'ta' ? 'bg-teal text-white' : 'text-slate-400 hover:text-white'}`}
            >
              தமிழ் (TA)
            </button>
            <button
              onClick={() => setSelectedLang('en')}
              className={`px-2.5 py-1 rounded ${selectedLang === 'en' ? 'bg-teal text-white' : 'text-slate-400 hover:text-white'}`}
            >
              English (EN)
            </button>
            <button
              onClick={() => setSelectedLang('hi')}
              className={`px-2.5 py-1 rounded ${selectedLang === 'hi' ? 'bg-teal text-white' : 'text-slate-400 hover:text-white'}`}
            >
              हिंदी (HI)
            </button>
          </div>
        </div>
      </div>

      {/* Target Household Selector & Agent Invoker */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
          <div className="space-y-1 w-full sm:w-auto">
            <label className="text-xs font-bold text-navy-900 uppercase tracking-wider">
              Select Household for AI Decision Pipeline:
            </label>
            <div className="flex items-center gap-3">
              <select
                value={selectedHhId}
                onChange={(e) => {
                  setSelectedHhId(e.target.value);
                  setDecision(null);
                }}
                className="bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal w-full sm:w-80"
              >
                {households.map(h => (
                  <option key={h.household_id} value={h.household_id}>
                    {h.household_id} – {h.contact_name} ({h.neighbourhood}) [{h.risk_category}]
                  </option>
                ))}
              </select>

              {activeHousehold && (
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                  activeHousehold.risk_category === 'Critical' ? 'bg-red-danger text-white' : 'bg-amber-warning text-navy-900'
                }`}>
                  Score: {activeHousehold.vulnerability_score}/100
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              disabled={executingAgent}
              onClick={handleRunAgent}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-teal hover:bg-teal-deep text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4 text-teal-bright" />
              {executingAgent ? 'Orchestrating 8 Tools...' : 'Run DISPATCH AI Agent'}
            </button>
            <button
              onClick={handleGenerateAlert}
              className="py-2.5 px-4 rounded-xl bg-navy-800 hover:bg-navy-700 text-white font-bold text-xs border border-navy-700 transition flex items-center gap-1.5 shadow-sm"
              title="Draft Custom Alert"
            >
              <Send className="w-3.5 h-3.5" />
              Draft Alert
            </button>
          </div>
        </div>

        {/* Live Execution Trace of the 8 Tools */}
        {executingAgent && (
          <div className="p-4 bg-navy-900 text-teal-bright rounded-xl font-mono text-xs space-y-2 animate-pulse">
            <div className="font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 animate-spin text-teal-bright" />
              DISPATCH Autonomous Agent Orchestration in progress...
            </div>
            <div className="text-slate-300 text-[11px] pl-6 space-y-1">
              <div>&gt; Invoking tool: get_household_risk({selectedHhId})...</div>
              <div>&gt; Invoking tool: get_local_flood_conditions(lat, lon)...</div>
              <div>&gt; Invoking tool: get_nearest_shelters(lat, lon) with accessibility check...</div>
              <div>&gt; Invoking tool: check_shelter_capacity(shelter_id)...</div>
              <div>&gt; Invoking tool: calculate_safe_route(origin, dest) avoiding flooded edges...</div>
              <div>&gt; Invoking tool: check_road_flood_risk(route_id)...</div>
              <div>&gt; Invoking tool: generate_evacuation_message('{selectedHhId}', '{selectedLang}')...</div>
            </div>
          </div>
        )}

        {/* Agent Synthesized Decision Card */}
        {decision && (
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="font-extrabold text-navy-900 text-sm">
                  AI Decision Recommendation for {decision.risk_summary.contact_name} ({decision.household_id})
                </h4>
              </div>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded font-bold">
                8 / 8 TOOLS EXECUTED
              </span>
            </div>

            {/* Tools Execution Log Pills */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase mb-2">Executed Tool Chain:</div>
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                {decision.tools_executed.map((t, idx) => (
                  <span key={idx} className="bg-white border border-slate-300 px-2 py-1 rounded text-slate-700 shadow-2xs">
                    ✓ {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Decision Reasoning Steps */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                Synthesized Decision Reasoning:
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5">
                {decision.decision_reasoning.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">{step}</li>
                ))}
              </ul>
            </div>

            {/* Destination Shelter & Safe Route Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase">Assigned Destination Shelter</div>
                <div className="text-base font-extrabold text-navy-900">{decision.nearest_shelter.name}</div>
                <div className="text-xs text-slate-600">
                  Capacity: <b>{decision.nearest_shelter.available_capacity}</b> beds free • Wheelchair Accessible: <b>{decision.nearest_shelter.is_accessible ? 'Yes' : 'No'}</b>
                </div>
                <div className="text-xs text-teal font-semibold">
                  Distance: {decision.recommended_route.total_distance_m} m • Walking Time: ~{decision.recommended_route.estimated_duration_min} min
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Generated Multilingual Evacuation Notice</div>
                  <div className="text-xs text-slate-800 font-mono mt-1 whitespace-pre-line line-clamp-3">
                    {decision.generated_alert[selectedLang] || decision.generated_alert.ta}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[10px] text-amber-700 font-bold">Awaiting Officer Sign-Off</span>
                  <button
                    onClick={handleGenerateAlert}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Review & Authorize
                  </button>
                </div>
              </div>
            </div>

            {/* Safe Evacuation Route Map Preview */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <ChennaiMap
                households={activeHousehold ? [activeHousehold] : []}
                shelters={decision.nearest_shelter ? [decision.nearest_shelter] : []}
                activeRoute={decision.recommended_route}
                height="320px"
              />
            </div>

          </div>
        )}
      </div>

      {/* Two Column Layout: Shelter Management & Human Alert Approval Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Shelter Capacity & Occupancy Control */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal" />
              <h3 className="font-extrabold text-navy-900 text-sm">Emergency Shelters Management</h3>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">
              {shelters.length} Relief Centers
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {shelters.map(s => {
              const avail = Math.max(0, s.capacity - s.current_occupancy);
              const occPercent = Math.min(100, Math.round((s.current_occupancy / s.capacity) * 100));

              return (
                <div key={s.shelter_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs text-navy-900">{s.name}</div>
                      <div className="text-[11px] text-slate-500">{s.neighbourhood} • {s.contact_phone}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      s.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {s.status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                      <span>Occupancy: {s.current_occupancy} / {s.capacity}</span>
                      <span className="text-emerald-700 font-bold">{avail} beds free</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          occPercent > 85 ? 'bg-red-danger' : (occPercent > 60 ? 'bg-amber-warning' : 'bg-teal')
                        }`}
                        style={{ width: `${occPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Quick occupancy adjust slider for officers */}
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                    <span>Officer Adjust:</span>
                    <input
                      type="range"
                      min="0"
                      max={s.capacity}
                      value={s.current_occupancy}
                      onChange={(e) => handleShelterOccupancyChange(s.shelter_id, Number(e.target.value))}
                      className="w-full h-1 bg-slate-300 rounded appearance-none cursor-pointer accent-teal"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Human Alert Approval Queue & Dispatched Alerts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-warning" />
              <h3 className="font-extrabold text-navy-900 text-sm">Human Approval & Alert Dispatch Log</h3>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">
              {alerts.length} Total Alerts
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No active alert tickets generated yet. Run the agent above to create an alert.
              </div>
            ) : (
              alerts.map(a => (
                <div key={a.alert_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-navy-900">{a.alert_id}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          a.status === 'dispatched' ? 'bg-emerald-100 text-emerald-800' :
                          (a.status === 'pending_approval' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-200 text-slate-700')
                        }`}>
                          {a.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Target: <b>{a.household_id}</b> ({a.recipient_phone})
                      </div>
                    </div>

                    {a.status === 'pending_approval' && (
                      <button
                        onClick={() => setApprovalModalAlert(a)}
                        className="py-1 px-3 bg-teal hover:bg-teal-deep text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Review Sign-Off
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 font-mono whitespace-pre-line line-clamp-2">
                    {a.message_body}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Severity: <b className="text-red-600 uppercase">{a.severity}</b></span>
                    <span>Created: {new Date(a.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Human Approval Gate Modal */}
      <AlertApprovalModal
        alert={approvalModalAlert}
        onClose={() => setApprovalModalAlert(null)}
        onApproved={(updated) => {
          setAlerts(prev => prev.map(a => a.alert_id === updated.alert_id ? updated : a));
        }}
        onRejected={(updated) => {
          setAlerts(prev => prev.map(a => a.alert_id === updated.alert_id ? updated : a));
        }}
      />

    </div>
  );
};
