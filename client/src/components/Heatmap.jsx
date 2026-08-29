import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Shield, AlertTriangle, Eye, Layers } from 'lucide-react';

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

const MapController = ({ selectedCoords }) => {
  const map = useMap();
  React.useEffect(() => {
    if (selectedCoords && selectedCoords.latitude && selectedCoords.longitude) {
      map.flyTo([selectedCoords.latitude, selectedCoords.longitude], 14, { duration: 1.2 });
    }
  }, [selectedCoords, map]);
  return null;
};

const Heatmap = ({ areas = [], journeyResult = null, onSelectZone = null }) => {
  const [activeZone, setActiveZone] = useState(null);

  const followZoneNames = new Set(journeyResult?.recommendedAreas?.map((a) => a.name) || []);
  const avoidZoneNames = new Set(journeyResult?.avoidAreas?.map((a) => a.name) || []);
  const isSource = (name) => journeyResult?.sourceZone === name;
  const isDest = (name) => journeyResult?.destinationZone === name;

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* Map Container */}
      <MapContainer
        center={NAGPUR_CENTER}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          selectedCoords={
            activeZone?.center ||
            (journeyResult?.source?.coordinates)
          }
        />

        {/* Safety Zone Heatmap Overlay (CircleMarkers) */}
        {areas.map((area) => {
          const lat = area.center?.latitude;
          const lng = area.center?.longitude;
          if (!lat || !lng) return null;

          const color = getZoneColor(area.riskLevel, area.riskScore);
          const opacity = getZoneFillOpacity(area.riskScore);

          const isFollow = followZoneNames.has(area.name);
          const isAvoid = avoidZoneNames.has(area.name);
          const isSrc = isSource(area.name);
          const isDst = isDest(area.name);

          // Radius and border styling based on journey recommendation highlight
          let radius = 24;
          let strokeColor = color;
          let strokeWidth = 2;

          if (isFollow) {
            strokeColor = '#3B82F6'; // Highlighted Follow
            strokeWidth = 4;
            radius = 28;
          } else if (isAvoid) {
            strokeColor = '#DC2626'; // Highlighted Avoid
            strokeWidth = 4;
            radius = 28;
          } else if (isSrc || isDst) {
            strokeColor = '#8B5CF6'; // Source / Dest
            strokeWidth = 4;
            radius = 30;
          }

          return (
            <CircleMarker
              key={area._id || area.name}
              center={[lat, lng]}
              radius={radius}
              pathOptions={{
                color: strokeColor,
                weight: strokeWidth,
                fillColor: color,
                fillOpacity: opacity
              }}
              eventHandlers={{
                click: () => {
                  setActiveZone(area);
                  if (onSelectZone) onSelectZone(area);
                }
              }}
            >
              <Popup>
                <div className="p-1 space-y-2 text-slate-100 min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                    <span className="font-bold text-base text-white">{area.name}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-bold uppercase"
                      style={{ backgroundColor: `${color}30`, color: color, border: `1px solid ${color}` }}
                    >
                      {area.riskLevel} Risk
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className="font-extrabold text-sm" style={{ color }}>
                      {area.riskScore} / 100
                    </span>
                  </div>

                  {area.neighbors && (
                    <div className="text-[11px] text-slate-400">
                      <span className="text-slate-300 font-medium">Adjacent Zones: </span>
                      {area.neighbors.join(', ')}
                    </div>
                  )}

                  {onSelectZone && (
                    <button
                      onClick={() => onSelectZone(area)}
                      className="w-full mt-2 py-1 px-2 text-xs font-semibold bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded border border-blue-500/40 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Zone Details</span>
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Interactive Floating Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/80 shadow-2xl text-xs space-y-2 min-w-[180px]">
        <div className="flex items-center space-x-1.5 text-slate-200 font-bold border-b border-slate-700/60 pb-1">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Safety Heatmap Legend</span>
        </div>

        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
              <span className="text-slate-300">Low Risk</span>
            </div>
            <span className="text-slate-400 font-mono">0–25</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
              <span className="text-slate-300">Moderate</span>
            </div>
            <span className="text-slate-400 font-mono">26–50</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></span>
              <span className="text-slate-300">High Risk</span>
            </div>
            <span className="text-slate-400 font-mono">51–75</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
              <span className="text-slate-300">Critical</span>
            </div>
            <span className="text-slate-400 font-mono">76–100</span>
          </div>
        </div>

        {journeyResult && (
          <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px]">
            <div className="flex items-center space-x-1.5 text-blue-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-blue-500"></span>
              <span>Areas to Follow</span>
            </div>
            <div className="flex items-center space-x-1.5 text-red-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-red-500"></span>
              <span>Areas to Avoid</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Heatmap;
