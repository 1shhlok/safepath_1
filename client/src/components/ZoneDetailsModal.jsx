import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, MapPin, Calendar, Activity, AlertCircle } from 'lucide-react';
import { areaAPI } from '../services/api';

const ZoneDetailsModal = ({ zone, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!zone?._id) {
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        const res = await areaAPI.getAreaById(zone._id);
        setDetails(res.data);
      } catch (err) {
        console.error('Failed to fetch zone details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [zone]);

  if (!zone) return null;

  const getRiskColor = (score) => {
    if (score >= 76) return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (score >= 51) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    if (score >= 26) return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{zone.name}</h3>
              <p className="text-xs text-slate-400">Nagpur Urban Safety Zone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Risk Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Risk Score</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-extrabold text-white">{zone.riskScore}</span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium">Risk Level</span>
              <span className={`inline-block w-fit px-2.5 py-1 rounded-lg text-xs font-bold border ${getRiskColor(zone.riskScore)}`}>
                {zone.riskLevel} Risk
              </span>
            </div>
          </div>

          {/* Coordinates & Adjacency */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Center GPS:</span>
              <span className="text-slate-200 font-mono">
                {zone.center?.latitude?.toFixed(4)}, {zone.center?.longitude?.toFixed(4)}
              </span>
            </div>
            {zone.neighbors && zone.neighbors.length > 0 && (
              <div>
                <span className="text-slate-400 block mb-1">Adjacent Connected Zones:</span>
                <div className="flex flex-wrap gap-1.5">
                  {zone.neighbors.map((neighbor) => (
                    <span key={neighbor} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                      {neighbor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Reports List */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Recent Incident History ({details?.recentReports?.length || 0})</span>
            </div>

            {loading ? (
              <div className="text-center py-6 text-xs text-slate-400">Loading incident records...</div>
            ) : details?.recentReports && details.recentReports.length > 0 ? (
              <div className="space-y-2">
                {details.recentReports.map((report) => (
                  <div key={report._id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 px-2 py-0.5 rounded bg-blue-950/50 text-blue-400 border border-blue-800/40">
                        {report.incidentType}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(report.timestamp).toLocaleDateString()}</span>
                      </span>
                    </div>
                    <p className="text-slate-300 leading-snug">{report.description}</p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      ML Confidence: {(report.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
                No recent incidents on record for this zone.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZoneDetailsModal;
