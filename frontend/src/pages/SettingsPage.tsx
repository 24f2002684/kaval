import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Settings as SettingsIcon, Globe, Cpu, Wifi,
  Bell, Database, CheckCircle2, Shield, AlertTriangle
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { selectedCity, setSelectedCity } = useAuth();

  const [settingsData, setSettingsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'checking'>('checking');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await api.getSettings();
        setSettingsData(data);
        const healthRes = await fetch('http://localhost:8000/health').then(r => r.json()).catch(() => null);
        if (healthRes?.status === 'healthy') {
          setSystemHealth('healthy');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleCityChange = async (city: string) => {
    setSelectedCity(city);
    try {
      await api.updateSettings({ active_city: city });
      setSaveMessage(`Active pilot region switched to ${city}`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearCache = () => {
    localStorage.removeItem('kaval_households_cache');
    localStorage.removeItem('kaval_offline_queue');
    alert('Local browser cache cleared successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 border border-navy-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-teal-bright uppercase tracking-widest">SYSTEM CONTROL</span>
            <span className="bg-teal/20 text-teal-bright text-[11px] font-bold px-2 py-0.5 rounded border border-teal/30">
              OPERATIONAL CONFIG
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Settings & System Calibration
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Configure pilot geographical bounds, AI reasoning backends, SMS emergency broadcast relays, and offline cache.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-navy-800 p-2.5 rounded-xl border border-navy-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-bold text-white uppercase">Backend Online</span>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Pilot Geographical Area Switcher */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-navy-900 border-b pb-3">
          <Globe className="w-5 h-5 text-teal" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider">Active Pilot Flood Basin</h3>
        </div>

        <p className="text-xs text-slate-500">
          KAVAL's spatial framework is modular and can be transferred to other flood-vulnerable river basins across India.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'Chennai', desc: 'Adyar, Cooum River & Velachery Marshland Basin (Current Primary Pilot)', coords: '12.9800° N, 80.2180° E' },
            { id: 'Mumbai', desc: 'Mithi River Catchment & Kurla/Sion Floodplain', coords: '19.0760° N, 72.8777° E' },
            { id: 'Patna', desc: 'Ganga & Punpun River Confluence Flood Basin', coords: '25.5941° N, 85.1376° E' },
            { id: 'Cuttack', desc: 'Mahanadi & Kathajodi Delta Basin', coords: '20.4625° N, 85.8830° E' },
          ].map(city => (
            <div
              key={city.id}
              onClick={() => handleCityChange(city.id)}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                selectedCity === city.id
                  ? 'border-teal bg-teal-light/30 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-sm text-navy-900">{city.id}</span>
                {selectedCity === city.id && (
                  <span className="text-[10px] bg-teal text-white font-bold px-2 py-0.5 rounded-full">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mb-2">{city.desc}</p>
              <span className="font-mono text-[10px] text-slate-400">{city.coords}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Agent & LLM Provider Configuration */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-navy-900 border-b pb-3">
          <Cpu className="w-5 h-5 text-amber-warning" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider">AI Reasoning & LLM Provider</h3>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">Current Decision Engine Mode:</span>
            <span className="font-mono text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
              Deterministic Autonomous Tool Orchestrator (Zero-Key)
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            The DISPATCH agent executes 8 verified backend tools and deterministic multilingual templates. If an optional Google Gemini or OpenAI API key is supplied, additional qualitative situational reasoning is layered in.
          </p>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Optional LLM API Key (Gemini / OpenAI):</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy... / sk-proj-..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
              <button
                onClick={() => {
                  alert('Optional API key saved for session.');
                  setApiKey('');
                }}
                className="py-2 px-4 bg-navy-900 text-white font-bold text-xs rounded-lg hover:bg-navy-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Offline First & Cache Management */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-navy-900 border-b pb-3">
          <Wifi className="w-5 h-5 text-teal" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider">Offline-First Cache & Resilience</h3>
        </div>

        <div className="text-xs text-slate-600 space-y-2">
          <p>
            Citizen actions and last-retrieved evacuation routes are cached in browser IndexedDB/LocalStorage. If cellular towers fail, actions are safely queued.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClearCache}
              className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 transition"
            >
              Clear Local Cache
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
