import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FloodGridCell } from '../types';
import { ChennaiMap } from '../components/Map/ChennaiMap';
import {
  CloudRain, Sliders, Upload, Layers, Droplets,
  AlertOctagon, CheckCircle2, Info, Compass, ArrowUpRight
} from 'lucide-react';

export const SeerPage: React.FC = () => {
  const { selectedCity } = useAuth();

  const [weather, setWeather] = useState<any>(null);
  const [gridCells, setGridCells] = useState<FloodGridCell[]>([]);
  const [selectedCell, setSelectedCell] = useState<FloodGridCell | null>(null);
  const [loading, setLoading] = useState(true);

  // Scenario simulation
  const [rainfallScenario, setRainfallScenario] = useState<number>(180);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Experimental SCS-CN Runoff
  const [curveNumber, setCurveNumber] = useState<number>(85);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [w, g] = await Promise.all([
        api.getWeather(selectedCity),
        api.getFloodGrid(selectedCity)
      ]);
      setWeather(w);
      setGridCells(g);
      if (g.length > 0) setSelectedCell(g[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCity]);

  const handleSimulate = async () => {
    try {
      setSimulating(true);
      const res = await api.runSEERPrediction(selectedCity, rainfallScenario);
      setSimulationResult(res);
      setGridCells(res.cells);
      if (res.cells.length > 0) setSelectedCell(res.cells[0]);
    } catch (err) {
      alert('Simulation error: ' + err);
    } finally {
      setSimulating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setUploadStatus('Verifying schema and ingesting...');
      const res = await api.uploadSEERData(file);
      setUploadStatus(`Success: ${res.message}`);
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message || 'Upload failed'}`);
    }
  };

  // SCS-CN Runoff calculation
  const s = (25400 / curveNumber) - 254;
  const ia = 0.2 * s;
  const runoffQ = rainfallScenario > ia
    ? Math.pow(rainfallScenario - ia, 2) / (rainfallScenario - ia + s)
    : 0.0;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 border border-navy-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-teal-bright uppercase tracking-widest">ENGINE 1</span>
            <span className="bg-teal/20 text-teal-bright text-[11px] font-bold px-2 py-0.5 rounded border border-teal/30">
              PHYSICAL + ML HYBRID
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            SEER – Spatial Early-warning & Environmental Risk Engine
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Predicts flood susceptibility, soil saturation ponding, and estimated water accumulation scenarios across 30m terrain grid cells.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-navy-800 p-2 rounded-xl border border-navy-700">
          <Compass className="w-5 h-5 text-teal-bright" />
          <div className="text-xs">
            <div className="text-slate-400">Resolution</div>
            <div className="font-bold text-white">30m Copernicus GLO-30</div>
          </div>
        </div>
      </div>

      {/* Open-Meteo Live Weather & Simulation Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Open-Meteo Meteorological Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-teal" />
              <h3 className="font-bold text-navy-900 text-sm">Meteorological Ingestion</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Open-Meteo API
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500">Precipitation Rate</span>
              <div className="text-xl font-black text-navy-900 mt-1">{weather?.precipitation_mm || 18.4} mm/h</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500">24h Accumulation</span>
              <div className="text-xl font-black text-teal mt-1">{weather?.rainfall_accum_24h_mm || 142.5} mm</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500">Relative Humidity</span>
              <div className="text-base font-bold text-slate-800 mt-1">{weather?.humidity || 94}%</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500">Wind Velocity</span>
              <div className="text-base font-bold text-slate-800 mt-1">{weather?.wind_speed_kmh || 38} km/h</div>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="text-xs font-bold text-slate-700 uppercase mb-2">Hourly Precipitation Horizon</div>
            <div className="flex justify-between items-end gap-1 h-16 pt-2">
              {(weather?.hourly_forecast || [
                { hour: '+1h', precip_mm: 12 }, { hour: '+2h', precip_mm: 18 }, { hour: '+3h', precip_mm: 24 },
                { hour: '+4h', precip_mm: 31 }, { hour: '+6h', precip_mm: 28 }, { hour: '+12h', precip_mm: 14 }
              ]).map((hf: any, idx: number) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-teal/80 hover:bg-teal rounded-t transition"
                    style={{ height: `${Math.min(100, (hf.precip_mm / 35) * 100)}%` }}
                    title={`${hf.precip_mm} mm`}
                  ></div>
                  <span className="text-[10px] text-slate-500 font-mono">{hf.hour}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Scenario Simulator (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-warning" />
                <h3 className="font-bold text-navy-900 text-sm">Interactive Rainfall Scenario Simulator</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">SEER-LGBM-v1.2</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">Simulate 24-Hour Cumulative Rainfall:</span>
                  <span className="text-teal font-extrabold text-sm">{rainfallScenario} mm</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="450"
                  step="10"
                  value={rainfallScenario}
                  onChange={(e) => setRainfallScenario(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>50 mm (Moderate Rain)</span>
                  <span>180 mm (Monsoon Storm)</span>
                  <span>350+ mm (2015 Deluge Scenario)</span>
                </div>
              </div>

              {/* SCS-CN Experimental Runoff Settings */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy-900">SCS-CN Soil Runoff Coefficient (Urban Clay / Alluvium)</span>
                  <span className="text-xs font-mono font-bold text-slate-700">CN: {curveNumber}</span>
                </div>
                <input
                  type="range"
                  min="65"
                  max="98"
                  value={curveNumber}
                  onChange={(e) => setCurveNumber(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal"
                />
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Calculated Direct Runoff Depth (Q):</span>
                  <span className="font-extrabold text-red-danger">{runoffQ.toFixed(1)} mm</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-4">
            <div className="text-xs text-slate-500">
              {simulationResult ? (
                <span>Scenario executed: <b>{simulationResult.high_risk_cells_count + simulationResult.critical_risk_cells_count}</b> critical/high cells identified.</span>
              ) : (
                <span>Adjust rainfall accumulation to recalculate hydrodynamic inundation probability.</span>
              )}
            </div>
            <button
              disabled={simulating}
              onClick={handleSimulate}
              className="py-2.5 px-6 rounded-xl bg-teal hover:bg-teal-deep text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
            >
              <Droplets className="w-4 h-4" />
              {simulating ? 'Computing Hydro Model...' : 'Simulate Flood Scenario'}
            </button>
          </div>
        </div>

      </div>

      {/* Grid Map and Cell Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Interactive Grid Map (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b mb-4">
            <div>
              <h3 className="font-bold text-navy-900 text-sm">30m Spatial Susceptibility Grid Layers</h3>
              <p className="text-xs text-slate-500">Click any grid cell polygon to inspect terrain & hydrological variables</p>
            </div>
            <span className="text-xs font-bold text-teal bg-teal-light px-2.5 py-1 rounded-full border border-teal/20">
              {gridCells.length} Grid Points Active
            </span>
          </div>

          <ChennaiMap
            gridCells={gridCells}
            showLayers={{ grid: true, households: false, shelters: true, roads: true }}
            onSelectCell={(cell) => setSelectedCell(cell)}
            height="480px"
          />
        </div>

        {/* Right Column: Grid Cell Inspector & Upload */}
        <div className="space-y-6">
          
          {/* Selected Cell Inspector */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="border-b pb-3 mb-3 flex items-center justify-between">
              <div className="font-bold text-navy-900 text-sm">Cell Hydrological Inspector</div>
              {selectedCell && (
                <span className="font-mono text-xs font-bold text-teal bg-slate-100 px-2 py-0.5 rounded">
                  {selectedCell.cell_id}
                </span>
              )}
            </div>

            {selectedCell ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-500">Risk Classification</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-white ${
                    selectedCell.risk_category === 'Critical' ? 'bg-red-danger' :
                    (selectedCell.risk_category === 'High' ? 'bg-amber-warning text-navy-900' : 'bg-teal')
                  }`}>
                    {selectedCell.risk_category.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500">Susceptibility</span>
                    <div className="text-base font-extrabold text-navy-900 mt-0.5">
                      {(selectedCell.flood_susceptibility * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500">Est. Ponding Depth</span>
                    <div className="text-base font-extrabold text-red-danger mt-0.5">
                      {selectedCell.estimated_water_depth_cm} cm
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500">Elevation</span>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">{selectedCell.elevation_m} m</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500">Slope Gradient</span>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">{selectedCell.slope_deg}°</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500">Distance to Canal</span>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">{selectedCell.distance_to_drain_m} m</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500">Soil Saturation</span>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">{(selectedCell.soil_saturation * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50 text-blue-900 rounded-lg border border-blue-100 text-[11px] leading-relaxed">
                  <b>Hydrological Rule:</b> Low elevation (&lt;4m) coupled with soil saturation (&gt;80%) produces rapid standing water retention during precipitation above 100mm.
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                Click any cell on the map to inspect its features.
              </div>
            )}
          </div>

          {/* Dataset Ingestion Dropzone */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="font-bold text-navy-900 text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-teal" /> Environmental Dataset Ingestion
            </div>
            <p className="text-xs text-slate-500">
              Upload custom CSV precipitation logs or GeoJSON catchments for model validation.
            </p>

            <label className="border-2 border-dashed border-slate-300 hover:border-teal rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-slate-700">Choose CSV or GeoJSON</span>
              <span className="text-[10px] text-slate-400">Max size 25MB</span>
              <input type="file" onChange={handleFileUpload} accept=".csv,.json,.geojson" className="hidden" />
            </label>

            {uploadStatus && (
              <div className="text-xs p-2 rounded-lg bg-teal/10 text-teal-deep font-semibold">
                {uploadStatus}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
