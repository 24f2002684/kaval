import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ReplayEvent, ReplayTimestep } from '../types';
import {
  History, Play, Pause, SkipBack, SkipForward,
  AlertTriangle, Droplets, ShieldAlert, Users, CloudRain, Clock
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const ReplayPage: React.FC = () => {
  const [replayEvent, setReplayEvent] = useState<ReplayEvent | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReplay = async () => {
      try {
        setLoading(true);
        const data = await api.getReplayEventDetail('CHENNAI_2015_DELUGE');
        setReplayEvent(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReplay();
  }, []);

  // Auto-play animation loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && replayEvent) {
      interval = setInterval(() => {
        setCurrentStepIdx(prev => {
          if (prev >= replayEvent.timesteps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, replayEvent]);

  const timesteps = replayEvent?.timesteps || [];
  const currentStep = timesteps[currentStepIdx] || null;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 border border-navy-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-teal-bright uppercase tracking-widest">HISTORICAL REPLAY</span>
            <span className="bg-amber-warning/20 text-amber-warning text-[11px] font-bold px-2 py-0.5 rounded border border-amber-warning/30">
              RECONSTRUCTED DEMO
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Chennai 2015 Deluge Scenario Simulation
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Explore the historical evolution of the December 2015 Chennai catastrophe. Observe how SEER rainfall ingestion and VULN household risk ranking would have alerted residents door-by-door hours before canal breaches.
          </p>
        </div>

        <div className="p-2.5 bg-navy-800 rounded-xl border border-navy-700 text-right">
          <div className="text-[10px] text-slate-400 uppercase font-mono">PEAK RECORDED RAINFALL</div>
          <div className="text-lg font-extrabold text-amber-warning">494.0 mm / 24h</div>
        </div>
      </div>

      {/* Reconstructed Demonstration Notice */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <b>Reconstructed Demonstration Notice:</b> Built from historical IMD gridded precipitation and Chembarambakkam reservoir release logs. Used for evaluating early-warning lead time.
          </span>
        </div>
        <span className="font-mono text-[11px] text-amber-800 font-bold hidden sm:inline">IMD & PWD Archive</span>
      </div>

      {/* Main Interactive Scrubber and Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        
        {/* Playback Controls & Timestamp Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Historical Timestep</div>
            <div className="text-2xl font-black text-navy-900 flex items-center gap-2 mt-0.5">
              <Clock className="w-6 h-6 text-teal" />
              <span>{currentStep?.timestamp || '2015-11-30'}</span>
              <span className="text-sm font-semibold text-slate-500">({currentStep?.label})</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))}
              disabled={currentStepIdx === 0}
              className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 shadow-xs transition"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="py-2 px-4 rounded-lg bg-teal hover:bg-teal-deep text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause Replay' : 'Play Timeline'}</span>
            </button>

            <button
              onClick={() => setCurrentStepIdx(Math.min(timesteps.length - 1, currentStepIdx + 1))}
              disabled={currentStepIdx === timesteps.length - 1}
              className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 shadow-xs transition"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timeline Slider with Milestones */}
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max={Math.max(0, timesteps.length - 1)}
            value={currentStepIdx}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentStepIdx(Number(e.target.value));
            }}
            className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal"
          />

          <div className="grid grid-cols-5 gap-1 text-[11px] pt-1">
            {timesteps.map((ts, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIdx(idx);
                }}
                className={`cursor-pointer p-1.5 rounded-lg text-center transition ${
                  idx === currentStepIdx
                    ? 'bg-navy-900 text-teal-bright font-bold shadow'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="font-mono text-[10px]">{ts.timestamp.split(' ')[0]}</div>
                <div className="truncate font-semibold">{ts.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics for Selected Timestep */}
        {currentStep && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">24h Cumulative Rain</span>
              <div className="text-2xl font-black text-teal mt-1">{currentStep.rainfall_24h_mm} mm</div>
              <span className="text-[10px] text-slate-400">Adyar Basin Rain Gauge</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Reservoir Discharge</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {currentStep.chembarambakkam_discharge_cusecs.toLocaleString()} cusecs
              </div>
              <span className="text-[10px] text-slate-400">Chembarambakkam Outflow</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Inundated Zones</span>
              <div className="text-2xl font-black text-red-600 mt-1">{currentStep.flooded_zones_count} / 100</div>
              <span className="text-[10px] text-slate-400">Submerged Spatial Grid Points</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Critical Doorsteps</span>
              <div className="text-2xl font-black text-navy-900 mt-1">{currentStep.critical_households}</div>
              <span className="text-[10px] text-slate-400">Immediate Rescue Target</span>
            </div>
          </div>
        )}

        {/* Narrative Box */}
        {currentStep && (
          <div className="p-4 bg-navy-900 text-white rounded-xl border border-navy-800 space-y-2">
            <div className="text-xs font-bold text-teal-bright uppercase tracking-wider">
              SITUATION REPORT (SITREP): {currentStep.timestamp}
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-mono">
              {currentStep.summary}
            </p>
          </div>
        )}

      </div>

      {/* Comparison: Standard Warning vs KAVAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-3 h-3 rounded-full bg-slate-400"></span>
            <h3 className="font-extrabold text-sm uppercase">2015 Conventional City Warning</h3>
          </div>
          <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
            <li>Generalized alerts issued to the entire 8-million metropolitan population.</li>
            <li>Lack of household-level elevation insight; residents assumed standard waterlogging.</li>
            <li>Evacuation decisions delayed until water breached residential ground floor thresholds.</li>
            <li>Zero door-to-door routing guidance; citizens navigated blindly through submerged canals.</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-teal/30 shadow-sm space-y-3 bg-teal-light/20">
          <div className="flex items-center gap-2 text-teal-deep">
            <span className="w-3 h-3 rounded-full bg-teal"></span>
            <h3 className="font-extrabold text-sm uppercase">KAVAL Personalized Resilience</h3>
          </div>
          <ul className="text-xs text-slate-800 space-y-2 list-disc pl-5">
            <li>SEER identified 30m low-lying basins 12 hours before reservoir gates opened.</li>
            <li>VULN prioritized ground-floor bedridden and elderly citizens for preemptive boat evacuation.</li>
            <li>DISPATCH generated verified bypass routes avoiding flooded arterial roads.</li>
            <li>Multilingual Tamil SMS alerted families to safe shelters with confirmed available beds.</li>
          </ul>
        </div>
      </div>

    </div>
  );
};
