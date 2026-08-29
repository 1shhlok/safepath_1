import React from 'react';
import { ShieldCheck, ShieldAlert, AlertOctagon, CheckCircle2, ArrowRight, Info, Compass } from 'lucide-react';

const getRiskBadge = (level, score) => {
  if (score >= 76 || level === 'Critical') {
    return {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/40',
      label: 'Critical Risk'
    };
  }
  if (score >= 51 || level === 'High') {
    return {
      bg: 'bg-orange-500/20',
      text: 'text-orange-400',
      border: 'border-orange-500/40',
      label: 'High Risk'
    };
  }
  if (score >= 26 || level === 'Moderate') {
    return {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/40',
      label: 'Moderate Risk'
    };
  }
  return {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    label: 'Low Risk'
  };
};

const ResultsPanel = ({ result }) => {
  if (!result) return null;

  const badge = getRiskBadge(result.riskLevel, result.overallRisk);

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Zone Journey Decision Support</span>
          </div>
          <div className="flex items-center space-x-2 text-xl font-extrabold text-white">
            <span className="text-blue-400">{result.sourceZone}</span>
            <ArrowRight className="w-5 h-5 text-slate-500" />
            <span className="text-sky-400">{result.destinationZone}</span>
          </div>
        </div>

        {/* Overall Risk Score Pill */}
        <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Overall Corridor Risk</div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">{result.overallRisk}</span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
            {result.riskLevel}
          </span>
        </div>
      </div>

      {/* Areas to Follow & Avoid Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Areas to Follow */}
        <div className="bg-slate-950/70 border border-blue-950/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <span>Areas to Follow (Safer Corridors)</span>
          </div>

          {result.recommendedAreas && result.recommendedAreas.length > 0 ? (
            <div className="space-y-2">
              {result.recommendedAreas.map((area) => {
                const areaBadge = getRiskBadge(area.riskLevel, area.riskScore);
                return (
                  <div
                    key={area.name}
                    className="flex items-center justify-between p-2.5 bg-slate-900/90 rounded-lg border border-slate-800"
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-sm text-slate-200">{area.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-slate-400">Score: {area.riskScore}</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${areaBadge.bg} ${areaBadge.text}`}>
                        {area.riskLevel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No alternative low-risk transit zones identified.</p>
          )}
        </div>

        {/* Areas to Avoid */}
        <div className="bg-slate-950/70 border border-red-950/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span>Areas to Avoid (Elevated Risk)</span>
          </div>

          {result.avoidAreas && result.avoidAreas.length > 0 ? (
            <div className="space-y-2">
              {result.avoidAreas.map((area) => {
                const areaBadge = getRiskBadge(area.riskLevel, area.riskScore);
                return (
                  <div
                    key={area.name}
                    className="flex items-center justify-between p-2.5 bg-slate-900/90 rounded-lg border border-slate-800"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertOctagon className="w-4 h-4 text-red-400" />
                      <span className="font-semibold text-sm text-slate-200">{area.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-slate-400">Score: {area.riskScore}</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${areaBadge.bg} ${areaBadge.text}`}>
                        {area.riskLevel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No critically elevated risk zones along this corridor.</p>
          )}
        </div>
      </div>

      {/* Decision Support Reasoning */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center space-x-2 text-slate-300 font-semibold text-xs uppercase tracking-wider">
          <Info className="w-4 h-4 text-blue-400" />
          <span>Safety Analysis &amp; Reasoning</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{result.reasoning}</p>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="text-[11px] text-slate-500 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
        <span className="font-bold text-slate-400">Notice: </span>
        {result.disclaimer}
      </div>
    </div>
  );
};

export default ResultsPanel;
