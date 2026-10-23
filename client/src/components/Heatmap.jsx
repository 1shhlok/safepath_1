import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, ZoomControl, Pane } from 'react-leaflet';
import { Shield, AlertTriangle, Eye, Layers, Compass, Crosshair, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

const NAGPUR_CENTER = [21.1458, 79.0882];

const getZoneColor = (level, score) => {
  if (score >= 76 || level === 'Critical') return '#EF4444'; // Red
  if (score >= 51 || level === 'High') return '#F97316';     // Orange
  if (score >= 26 || level === 'Moderate') return '#F59E0B'; // Amber
  return '#10B981';                                         // Green
};

const getZoneFillOpacity = (score) => {
  const normalized = Math.max(10, Math.min(100, score || 10));
  return 0.35 + (normalized / 100) * 0.45; // 0.35 to 0.80
};

const MapController = ({ selectedCoords, resetTrigger }) => {
  const map = useMap();
  React.useEffect(() => {
    if (resetTrigger) {
      map.flyTo(NAGPUR_CENTER, 12, { duration: 1 });
      return;
    }
    if (selectedCoords && selectedCoords.latitude && selectedCoords.longitude) {
      map.flyTo([selectedCoords.latitude, selectedCoords.longitude], 14, { duration: 1.2 });
    }
  }, [selectedCoords, resetTrigger, map]);
  return null;
};

const Heatmap = ({ areas = [], journeyResult = null, onSelectZone = null }) => {
  const [activeZone, setActiveZone] = useState(null);
  const [resetCount, setResetCount] = useState(0);
  const [legendOpen, setLegendOpen] = useState(true);

  const followZoneNames = new Set(journeyResult?.recommendedAreas?.map((a) => a.name) || []);
  const avoidZoneNames = new Set(journeyResult?.avoidAreas?.map((a) => a.name) || []);
  const isSource = (name) => journeyResult?.sourceZone === name;
  const isDest = (name) => journeyResult?.destinationZone === name;

  const handleResetMap = () => {
    setActiveZone(null);
    setResetCount((prev) => prev + 1);
  };

  return (
    <div className="relative w-full h-[460px] sm:h-[540px] md:h-[580px] rounded-2xl overflow-hidden border border-slate-800/90 shadow-2xl bg-[#070b14]">
      {/* Tactical Top-Left Telemetry HUD Badge & Reset Button */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center space-x-2">
        <div className="bg-[#090d16]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/70 shadow-lg flex items-center space-x-2">
          <Crosshair className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-200">
            Nagpur Grid: {areas.length || 35} Sectors
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        <button
          onClick={handleResetMap}
          className="bg-[#090d16]/90 hover:bg-slate-800 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/70 shadow-lg text-slate-300 hover:text-white text-xs font-mono flex items-center space-x-1.5 transition-all"
          title="Reset map view to Nagpur center"
        >
          <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline text-[11px] font-semibold">Reset</span>
        </button>
      </div>

      {/* Map Container */}
      <MapContainer
        center={NAGPUR_CENTER}
        zoom={12}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <ZoomControl position="bottomleft" />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapController
          selectedCoords={
            activeZone?.center ||
            (journeyResult?.source?.coordinates)
          }
          resetTrigger={resetCount}
        />

        {/* Continuous Feathered Heatmap Layer (Zero Hard Borders) */}
        <Pane name="heatmap-pane" style={{ zIndex: 400 }}>
          {areas.map((area) => {
            const lat = area.center?.latitude;
            const lng = area.center?.longitude;
            if (!lat || !lng) return null;

            const color = getZoneColor(area.riskLevel, area.riskScore);
            const score = area.riskScore || 20;
            const wideRadius = 36 + (score / 100) * 26;
            const midRadius = 22 + (score / 100) * 16;
            const coreRadius = 12 + (score / 100) * 8;

            return (
              <React.Fragment key={`heat-${area._id || area.name}`}>
                {/* Wide soft feathered dispersion plume */}
                <CircleMarker
                  center={[lat, lng]}
                  radius={wideRadius}
                  pathOptions={{
                    stroke: false,
                    fillColor: color,
                    fillOpacity: 0.22,
                    interactive: false
                  }}
                />
                {/* Mid warm body */}
                <CircleMarker
                  center={[lat, lng]}
                  radius={midRadius}
                  pathOptions={{
                    stroke: false,
                    fillColor: color,
                    fillOpacity: 0.42,
                    interactive: false
                  }}
                />
                {/* Core risk intensity */}
                <CircleMarker
                  center={[lat, lng]}
                  radius={coreRadius}
                  pathOptions={{
                    stroke: false,
                    fillColor: color,
                    fillOpacity: 0.68,
                    interactive: false
                  }}
                />
              </React.Fragment>
            );
          })}
        </Pane>

        {/* Interactive Sector Stations & Highlighted Corridors */}
        {areas.map((area) => {
          const lat = area.center?.latitude;
          const lng = area.center?.longitude;
          if (!lat || !lng) return null;

          const color = getZoneColor(area.riskLevel, area.riskScore);
          const isFollow = followZoneNames.has(area.name);
          const isAvoid = avoidZoneNames.has(area.name);
          const isSrc = isSource(area.name);
          const isDst = isDest(area.name);

          let pinRadius = 7;
          let ringStroke = 'rgba(255, 255, 255, 0.4)';
          let ringWeight = 1.5;

          if (isFollow) {
            ringStroke = '#38bdf8'; // Cyan follow ring
            ringWeight = 3;
            pinRadius = 10;
          } else if (isAvoid) {
            ringStroke = '#ef4444'; // Red avoid ring
            ringWeight = 3;
            pinRadius = 10;
          } else if (isSrc || isDst) {
            ringStroke = '#c084fc'; // Purple origin/destination ring
            ringWeight = 3.5;
            pinRadius = 11;
          }

          return (
            <CircleMarker
              key={area._id || area.name}
              center={[lat, lng]}
              radius={pinRadius}
              pathOptions={{
                color: ringStroke,
                weight: ringWeight,
                fillColor: color,
                fillOpacity: 0.95
              }}
              eventHandlers={{
                click: () => {
                  setActiveZone(area);
                  if (onSelectZone) onSelectZone(area);
                }
              }}
            >
              <Popup>
                <div className="p-1 space-y-2.5 text-slate-100 min-w-[220px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <span className="font-extrabold text-sm text-white tracking-tight">{area.name}</span>
                      {area.stationMarathi && (
                        <span className="block text-[10px] text-slate-400">({area.stationMarathi})</span>
                      )}
                    </div>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase font-mono tracking-wider"
                      style={{ backgroundColor: `${color}25`, color: color, border: `1px solid ${color}60` }}
                    >
                      {area.riskLevel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-0.5 bg-slate-900/60 px-2 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Risk Score:</span>
                    <span className="font-black text-sm font-mono" style={{ color }}>
                      {area.riskScore} <span className="text-[10px] text-slate-500 font-normal">/ 100</span>
                    </span>
                  </div>

                  {area.policeZone && (
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span className="text-slate-500">Police Zone:</span>
                      <span className="text-slate-300 font-medium">{area.policeZone}</span>
                    </div>
                  )}

                  {area.neighbors && area.neighbors.length > 0 && (
                    <div className="text-[11px] text-slate-400 space-y-0.5">
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">Adjacent Corridors:</span>
                      <p className="line-clamp-2 text-slate-300">{area.neighbors.join(', ')}</p>
                    </div>
                  )}

                  {onSelectZone && (
                    <button
                      onClick={() => onSelectZone(area)}
                      className="w-full mt-2 py-1.5 px-2.5 text-xs font-bold bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg border border-blue-500/40 transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Sector Intelligence</span>
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Interactive Floating Tactical Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-[#090d16]/95 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-2xl text-xs overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => setLegendOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-3 text-slate-200 font-bold hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] tracking-wider uppercase font-mono">Risk Legend</span>
          </div>
          {legendOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {legendOpen && (
          <div className="px-3 pb-3 space-y-2 border-t border-slate-800/80 min-w-[190px]">
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                  <span className="text-slate-300 text-[11px]">Low Risk</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">0–25</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
                  <span className="text-slate-300 text-[11px]">Moderate</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">26–50</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></span>
                  <span className="text-slate-300 text-[11px]">High Risk</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">51–75</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50 animate-pulse"></span>
                  <span className="text-slate-300 text-[11px]">Critical</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">76–100</span>
              </div>
            </div>

            {journeyResult && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex items-center space-x-1.5 text-sky-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-sky-400 bg-sky-400/20"></span>
                  <span>Recommended Follow</span>
                </div>
                <div className="flex items-center space-x-1.5 text-red-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-red-500 bg-red-500/20"></span>
                  <span>Elevated Avoid</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Heatmap;
