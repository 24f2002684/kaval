import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FloodGridCell, Household, Shelter, RoadSegment, SafeRoute } from '../../types';

interface ChennaiMapProps {
  gridCells?: FloodGridCell[];
  households?: Household[];
  shelters?: Shelter[];
  roads?: RoadSegment[];
  activeRoute?: SafeRoute | null;
  selectedHousehold?: Household | null;
  onSelectHousehold?: (hh: Household) => void;
  onSelectCell?: (cell: FloodGridCell) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  showLayers?: {
    grid?: boolean;
    households?: boolean;
    shelters?: boolean;
    roads?: boolean;
  };
}

export const ChennaiMap: React.FC<ChennaiMapProps> = ({
  gridCells = [],
  households = [],
  shelters = [],
  roads = [],
  activeRoute = null,
  selectedHousehold = null,
  onSelectHousehold,
  onSelectCell,
  center = [12.9800, 80.2180],
  zoom = 12,
  height = '520px',
  showLayers = { grid: true, households: true, shelters: true, roads: true }
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupsRef = useRef<{
    grid: L.LayerGroup;
    households: L.LayerGroup;
    shelters: L.LayerGroup;
    roads: L.LayerGroup;
    route: L.LayerGroup;
  } | null>(null);

  // Initialize Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | KAVAL SEER Ingestion',
      maxZoom: 18,
    }).addTo(map);

    const gridGroup = L.layerGroup().addTo(map);
    const householdsGroup = L.layerGroup().addTo(map);
    const sheltersGroup = L.layerGroup().addTo(map);
    const roadsGroup = L.layerGroup().addTo(map);
    const routeGroup = L.layerGroup().addTo(map);

    layerGroupsRef.current = {
      grid: gridGroup,
      households: householdsGroup,
      shelters: sheltersGroup,
      roads: roadsGroup,
      route: routeGroup,
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Center if changed
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Render Grid Cells
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    const { grid } = layerGroupsRef.current;
    grid.clearLayers();

    if (!showLayers.grid) return;

    const delta = 0.0035;
    gridCells.forEach(cell => {
      const bounds: L.LatLngBoundsExpression = [
        [cell.latitude - delta, cell.longitude - delta],
        [cell.latitude + delta, cell.longitude + delta]
      ];

      const colorMap: Record<string, string> = {
        Critical: '#E5484D',
        High: '#FFB020',
        Moderate: '#117C72',
        Low: '#16C7B1'
      };
      const fillColor = colorMap[cell.risk_category] || '#117C72';

      const rect = L.rectangle(bounds, {
        color: fillColor,
        weight: 1,
        fillColor: fillColor,
        fillOpacity: cell.risk_category === 'Critical' ? 0.45 : (cell.risk_category === 'High' ? 0.35 : 0.20)
      });

      rect.bindPopup(`
        <div class="text-xs p-1">
          <div class="font-bold text-slate-800 text-sm mb-1">${cell.cell_id} (Grid Zone)</div>
          <div class="mb-1"><span class="font-semibold">Risk:</span> <span class="px-1.5 py-0.5 rounded text-white text-[10px] font-bold" style="background:${fillColor}">${cell.risk_category.toUpperCase()}</span></div>
          <div><b>Susceptibility:</b> ${(cell.flood_susceptibility * 100).toFixed(0)}%</div>
          <div><b>Est. Water Depth:</b> ${cell.estimated_water_depth_cm} cm</div>
          <div><b>Elevation:</b> ${cell.elevation_m} m | <b>Slope:</b> ${cell.slope_deg}°</div>
          <div><b>Confidence:</b> ${(cell.confidence * 100).toFixed(0)}%</div>
        </div>
      `);

      rect.on('click', () => {
        if (onSelectCell) onSelectCell(cell);
      });

      grid.addLayer(rect);
    });
  }, [gridCells, showLayers.grid, onSelectCell]);

  // Render Road Segments
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    const { roads: roadsGroup } = layerGroupsRef.current;
    roadsGroup.clearLayers();

    if (!showLayers.roads) return;

    roads.forEach(r => {
      const isClosed = r.status === 'flooded_closed';
      const isSlow = r.status === 'waterlogged_slow';

      const roadColor = isClosed ? '#E5484D' : (isSlow ? '#FFB020' : '#475569');
      const roadWeight = isClosed ? 5 : 3;
      const dashArray = isClosed ? '6, 6' : undefined;

      const poly = L.polyline(r.coordinates as L.LatLngExpression[], {
        color: roadColor,
        weight: roadWeight,
        dashArray: dashArray,
        opacity: 0.85
      });

      poly.bindPopup(`
        <div class="text-xs">
          <div class="font-bold text-slate-900">${r.name}</div>
          <div>Status: <b>${r.status.replace('_', ' ').toUpperCase()}</b></div>
          <div>Water Depth: <b>${r.water_depth_cm} cm</b></div>
          <div>Elevation: <b>${r.elevation_m} m</b></div>
        </div>
      `);

      roadsGroup.addLayer(poly);
    });
  }, [roads, showLayers.roads]);

  // Render Shelters
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    const { shelters: sheltersGroup } = layerGroupsRef.current;
    sheltersGroup.clearLayers();

    if (!showLayers.shelters) return;

    shelters.forEach(s => {
      const avail = Math.max(0, s.capacity - s.current_occupancy);
      const isFull = avail <= 0;

      const shelterIcon = L.divIcon({
        className: 'shelter-marker-icon',
        html: `
          <div style="background-color: ${isFull ? '#E5484D' : '#117C72'}; color: white; width: 30px; height: 30px; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([s.latitude, s.longitude], { icon: shelterIcon });
      marker.bindPopup(`
        <div class="text-xs p-1">
          <div class="font-bold text-sm text-teal-800">${s.name}</div>
          <div class="text-slate-600 mb-1">${s.neighbourhood}</div>
          <div class="font-semibold text-slate-800">Capacity: ${s.current_occupancy} / ${s.capacity} occupied</div>
          <div class="text-emerald-700 font-bold mb-1">Available beds: ${avail}</div>
          <div>Wheelchair Access: <b>${s.is_accessible ? 'Yes (Ground Ramp)' : 'No'}</b></div>
          <div class="text-[11px] text-slate-500 mt-1">Contact: ${s.contact_person} (${s.contact_phone})</div>
        </div>
      `);
      sheltersGroup.addLayer(marker);
    });
  }, [shelters, showLayers.shelters]);

  // Render Households
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    const { households: hhGroup } = layerGroupsRef.current;
    hhGroup.clearLayers();

    if (!showLayers.households) return;

    households.forEach(hh => {
      const isSelected = selectedHousehold?.household_id === hh.household_id;
      const isCritical = hh.risk_category === 'Critical';
      const isHigh = hh.risk_category === 'High';

      const color = isCritical ? '#E5484D' : (isHigh ? '#FFB020' : (hh.risk_category === 'Moderate' ? '#117C72' : '#16C7B1'));

      const pulseClass = isCritical ? 'animate-pulse' : '';
      const borderStyle = isSelected ? 'border: 3px solid #0B1D2B; transform: scale(1.3); z-index: 999;' : 'border: 2px solid white;';

      const hhIcon = L.divIcon({
        className: 'household-marker-icon',
        html: `
          <div class="${pulseClass}" style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; ${borderStyle} box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      const marker = L.marker([hh.latitude, hh.longitude], { icon: hhIcon });

      const statusBadgeMap: Record<string, string> = {
        safe: 'bg-emerald-600',
        rescue_required: 'bg-red-600',
        evacuation_initiated: 'bg-amber-600',
        contacted: 'bg-blue-600',
        unreachable: 'bg-slate-600'
      };

      const popupContent = document.createElement('div');
      popupContent.className = 'text-xs p-1 max-w-[220px]';
      popupContent.innerHTML = `
        <div class="flex items-center justify-between gap-2 mb-1">
          <span class="font-bold text-slate-900">${hh.household_id}</span>
          <span class="text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${statusBadgeMap[hh.evacuation_status] || 'bg-slate-500'}">
            ${hh.evacuation_status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div class="font-semibold text-slate-800">${hh.contact_name}</div>
        <div class="text-[11px] text-slate-500 mb-1">${hh.address}</div>
        <div class="mb-1"><b>Score:</b> <span class="font-bold text-red-600">${hh.vulnerability_score}/100</span> (${hh.risk_category})</div>
        <div class="text-[11px] text-slate-600">
          Residents: ${hh.household_size} | Elderly: ${hh.elderly_count} | Children: ${hh.children_count}
        </div>
        <div class="text-[11px] text-slate-600 mb-2">
          Mobility: <b>${hh.mobility_status.replace('_', ' ')}</b> | Ground Floor: <b>${hh.ground_floor_status ? 'Yes' : 'No'}</b>
        </div>
      `;

      const routeBtn = document.createElement('button');
      routeBtn.className = 'w-full py-1 px-2 bg-teal text-white rounded text-xs font-semibold hover:bg-teal-700 transition flex items-center justify-center gap-1';
      routeBtn.innerText = 'Select & Inspect Route';
      routeBtn.onclick = () => {
        if (onSelectHousehold) onSelectHousehold(hh);
      };
      popupContent.appendChild(routeBtn);

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectHousehold) onSelectHousehold(hh);
      });

      hhGroup.addLayer(marker);
    });
  }, [households, showLayers.households, selectedHousehold, onSelectHousehold]);

  // Render Active Route
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    const { route: routeGroup } = layerGroupsRef.current;
    routeGroup.clearLayers();

    if (!activeRoute || !activeRoute.path_coordinates || activeRoute.path_coordinates.length < 2) return;

    // Draw prominent corridor line
    const corridor = L.polyline(activeRoute.path_coordinates as L.LatLngExpression[], {
      color: '#16C7B1',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    });

    // Outer glow effect
    const glow = L.polyline(activeRoute.path_coordinates as L.LatLngExpression[], {
      color: '#0B1D2B',
      weight: 10,
      opacity: 0.4
    });

    corridor.bindPopup(`
      <div class="text-xs">
        <div class="font-bold text-teal-800 text-sm">Verified Evacuation Route</div>
        <div>Destination: <b>${activeRoute.shelter_name}</b></div>
        <div>Distance: <b>${activeRoute.total_distance_m} m</b></div>
        <div>Estimated Walk: <b>${activeRoute.estimated_duration_min} min</b></div>
        <div class="text-emerald-700 font-semibold mt-1">✓ Bypasses submerged flood segments</div>
      </div>
    `);

    routeGroup.addLayer(glow);
    routeGroup.addLayer(corridor);

    // Zoom to route
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(corridor.getBounds(), { padding: [40, 40] });
    }
  }, [activeRoute]);

  return (
    <div className="relative rounded-xl overflow-hidden shadow-md border border-slate-200">
      <div ref={mapContainerRef} style={{ height: height, width: '100%' }} />

      {/* Floating Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-200 text-xs text-slate-800 space-y-1.5 max-w-[200px]">
        <div className="font-bold text-navy-900 border-b pb-1 text-[11px] uppercase tracking-wider">
          Flood & Risk Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#E5484D] inline-block"></span>
          <span>Critical Risk (76-100)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#FFB020] inline-block"></span>
          <span>High Risk (51-75)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#117C72] inline-block"></span>
          <span>Moderate Risk (26-50)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#16C7B1] inline-block"></span>
          <span>Low Risk (0-25)</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
          <span className="w-3 h-3 rounded bg-teal inline-block"></span>
          <span>Emergency Shelter</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 border-t-2 border-dashed border-red-600 inline-block"></span>
          <span>Flooded Road (Closed)</span>
        </div>
      </div>
    </div>
  );
};
