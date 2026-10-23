import React from 'react';
import { ShieldCheck, ShieldAlert, AlertOctagon, CheckCircle2, ArrowRight, Info, Compass, Shield } from 'lucide-react';

const getRiskBadge = (level, score) => {
  if (score >= 76 || level === 'Critical') {
    return {
      bg: 'bg-red-500/15',
      text: 'text-red-400',
      border: 'border-red-500/40',
      dot: 'bg-red-500',
      label: 'Critical Risk'
    };
  }
  if (score >= 51 || level === 'High') {
    return {
      bg: 'bg-orange-500/15',
      text: 'text-orange-400',
      border: 'border-orange-500/40',
      dot: 'bg-orange-500',
      label: 'High Risk'
    };
  }
  if (score >= 26 || level === 'Moderate') {
    return {
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      border: 'border-amber-500/40',
      dot: 'bg-amber-500',
      label: 'Moderate Risk'
    };
  }
  return {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    dot: 'bg-emerald-400',
    label: 'Low Risk'
  };
};

const ResultsPanel = ({ result }) => {
  if (!result) return null;

  const badge = getRiskBadge(result.riskLevel, result.overallRisk);

  return (
    <div className="bg-[#0b1220]/95 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl ring-1 ring-blue-500/20">
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 opacity-90" />

      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Corridor Safety Assessment</span>
          </div>
          <div className="flex items-center space-x-3 text-lg sm:text-2xl font-black text-white">
            <span className="text-blue-400 font-mono tracking-tight">{result.sourceZone}</span>
            <ArrowRight className="w-5 h-5 text-slate-500" />
            <span className="text-sky-300 font-mono tracking-tight">{result.destinationZone}</span>
          </div>
        </div>

        {/* Overall Risk Score Pill */}
        <div className="flex items-center space-x-3.5 bg-[#060a14] p-3 rounded-xl border border-slate-700/80 shadow-inner">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Corridor Risk Index</div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">{result.overallRisk}</span>
              <span className="text-xs text-slate-500 font-mono">/ 100</span>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 font-mono ${badge.bg} ${badge.text} ${badge.border}`}>
            <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
            <span>{result.riskLevel}</span>
          </span>
        </div>
      </div>

      {/* Areas to Follow & Avoid Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Areas to Follow */}
        <div className="bg-[#07111e] border border-sky-500/30 rounded-xl p-4 space-y-3 shadow-lg shadow-sky-950/20">
          <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider font-mono">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Recommended Corridors (Lower Risk)</span>
          </div>

          {result.recommendedAreas && result.recommendedAreas.length > 0 ? (
            <div className="space-y-2">
              {result.recommendedAreas.map((area) => {
                const areaBadge = getRiskBadge(area.riskLevel, area.riskScore);
                return (
                  <div
                    key={area.name}
                    className="flex items-center justify-between p-2.5 bg-[#0e1526] rounded-lg border border-slate-800/90 hover:border-sky-500/40 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="font-bold text-sm text-slate-200">{area.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-xs text-slate-400">Score: {area.riskScore}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${areaBadge.bg} ${areaBadge.text} border ${areaBadge.border}`}>
                        {area.riskLevel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-2">No alternative low-risk transit zones identified.</p>
          )}
        </div>

        {/* Areas to Avoid */}
        <div className="bg-[#190d14] border border-red-500/30 rounded-xl p-4 space-y-3 shadow-lg shadow-red-950/20">
          <div className="flex items-center space-x-2 text-red-400 font-bold text-xs uppercase tracking-wider font-mono">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Elevated Risk Corridors (To Avoid)</span>
          </div>

          {result.avoidAreas && result.avoidAreas.length > 0 ? (
            <div className="space-y-2">
              {result.avoidAreas.map((area) => {
                const areaBadge = getRiskBadge(area.riskLevel, area.riskScore);
                return (
                  <div
                    key={area.name}
                    className="flex items-center justify-between p-2.5 bg-[#0e1526] rounded-lg border border-slate-800/90 hover:border-red-500/40 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <AlertOctagon className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="font-bold text-sm text-slate-200">{area.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-xs text-slate-400">Score: {area.riskScore}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${areaBadge.bg} ${areaBadge.text} border ${areaBadge.border}`}>
                        {area.riskLevel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-2">No critically elevated risk zones along this corridor.</p>
          )}
        </div>
      </div>

      {/* Decision Support Reasoning */}
      <div className="bg-[#070b14] p-4 rounded-xl border border-slate-800/90 space-y-2">
        <div className="flex items-center space-x-2 text-slate-300 font-bold text-xs uppercase tracking-wider font-mono">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>Automated Safety Corroboration &amp; Reasoning</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">{result.reasoning}</p>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="text-[11px] text-slate-500 bg-[#070b14]/60 p-3 rounded-lg border border-slate-800/60 font-mono">
        <span className="font-bold text-slate-400">Notice: </span>
        {result.disclaimer}
      </div>
    </div>
  );
};

export default ResultsPanel;
