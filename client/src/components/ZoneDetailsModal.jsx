import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, MapPin, Calendar, Activity, AlertCircle, BarChart3, Info, CheckCircle, Shield } from 'lucide-react';
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
        console.error('Failed to fetch catchment station details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [zone]);

  if (!zone) return null;

  const getRiskColor = (score) => {
    if (score >= 76) return 'text-red-400 bg-red-500/15 border-red-500/40';
    if (score >= 51) return 'text-orange-400 bg-orange-500/15 border-orange-500/40';
    if (score >= 26) return 'text-amber-400 bg-amber-500/15 border-amber-500/40';
    return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40';
  };

  const areaData = details?.area || zone;
  const baseline = areaData?.historicalBaseline;
  const isUnverifiedZone = areaData?.zoneMappingStatus === 'unverified' || (areaData?.policeZone && areaData.policeZone.includes('Unverified'));

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0b101f] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Dossier Bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#070b14]/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-500/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  {areaData.name}
                </h3>
                {areaData.stationMarathi && (
                  <span className="text-xs text-slate-400 font-normal">
                    ({areaData.stationMarathi})
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Nagpur Police Catchment Sector
              </p>
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
        <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Risk Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#070b14] p-3.5 rounded-xl border border-slate-800/90 shadow-inner">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Sector Risk Score</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-white font-mono">{areaData.riskScore}</span>
                <span className="text-xs text-slate-500 font-mono">/ 100</span>
              </div>
            </div>
            <div className="bg-[#070b14] p-3.5 rounded-xl border border-slate-800/90 shadow-inner flex flex-col justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Risk Level</span>
              <span className={`inline-block w-fit px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${getRiskColor(areaData.riskScore)}`}>
                {areaData.riskLevel} Risk
              </span>
            </div>
          </div>

          {/* Administrative Zone & Mapping Status */}
          <div className="bg-[#070b14]/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono text-[11px]">Police Administrative Zone:</span>
              <span className="text-white font-semibold font-mono">{areaData.policeZone || 'Zone 1–5 Unverified'}</span>
            </div>
            {isUnverifiedZone ? (
              <div className="flex items-start space-x-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-[11px]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                <span>
                  <strong>Unverified Zone Mapping:</strong> Official police mapping for this station is not in Zones 3–5 documentation. Preserved as unverified per Delta Harness v4.
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1.5 font-mono">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified from official Nagpur City Police document</span>
              </div>
            )}
          </div>

          {/* Historical Police Crime Data (2024 Baseline) */}
          {baseline && (
            <div className="bg-[#070b14]/70 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                <span className="flex items-center space-x-1.5 text-blue-400">
                  <BarChart3 className="w-4 h-4" />
                  <span>Historical Baseline ({baseline.year || 2024})</span>
                </span>
                <span className="text-[10px] text-slate-500 normal-case font-mono">Police Records</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-[#0f1628] p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Reported Cases</span>
                  <span className="text-base font-bold text-white font-mono">{baseline.reportedCrimes}</span>
                </div>
                <div className="bg-[#0f1628] p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Detection Rate</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-base font-bold text-sky-400 font-mono">{baseline.detectionRate}%</span>
                  </div>
                  {/* Visual Detection Progress Bar */}
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-sky-400 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, baseline.detectionRate || 0))}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-[#090d18] p-2.5 rounded-lg border border-slate-800/80 flex items-start space-x-1.5 leading-snug">
                <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  Baseline reflects recorded police case volume from extracted dashboard data, not individual probability of victimization. Detection rate is distinct from case volume.
                </span>
              </div>
            </div>
          )}

          {/* Coordinates & Adjacent Corridor Connections */}
          <div className="bg-[#070b14]/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-mono text-[11px]">Station Coordinates:</span>
              <span className="text-slate-300 font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {areaData.center?.latitude?.toFixed(4)}, {areaData.center?.longitude?.toFixed(4)}
              </span>
            </div>
            {areaData.neighbors && areaData.neighbors.length > 0 && (
              <div>
                <span className="text-slate-400 block mb-1 text-[11px] font-mono">Adjacent Corridors:</span>
                <div className="flex flex-wrap gap-1.5">
                  {areaData.neighbors.map((neighbor) => (
                    <span key={neighbor} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px]">
                      {neighbor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Accepted Community Reports List */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Accepted Community Reports ({details?.recentReports?.filter(r => r.status === 'accepted')?.length || 0})</span>
            </div>

            {loading ? (
              <div className="text-center py-6 text-xs text-slate-400 font-mono">Loading incident records...</div>
            ) : details?.recentReports && details.recentReports.filter(r => r.status === 'accepted').length > 0 ? (
              <div className="space-y-2">
                {details.recentReports
                  .filter(r => r.status === 'accepted')
                  .map((report) => (
                    <div key={report._id} className="p-3 bg-[#070b14] rounded-xl border border-slate-800/90 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 px-2 py-0.5 rounded bg-blue-950/50 text-blue-400 border border-blue-800/40 font-mono text-[11px]">
                          {report.incidentType}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center space-x-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(report.timestamp).toLocaleDateString()}</span>
                        </span>
                      </div>
                      <p className="text-slate-300 leading-snug">{report.description}</p>
                      <div className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
                        <span>✓ Verified &amp; Accepted by Administrator</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-[#070b14] rounded-xl border border-slate-800/80 text-xs text-slate-500 font-mono">
                No accepted citizen complaints on record for this catchment station.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#070b14]/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZoneDetailsModal;
