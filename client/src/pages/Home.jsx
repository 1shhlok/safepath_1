import React, { useState, useEffect } from 'react';
import { Search, Navigation, AlertCircle, Sparkles, MapPin, ArrowLeftRight, Shield, Activity, Radio } from 'lucide-react';
import { areaAPI, navigationAPI } from '../services/api';
import Heatmap from '../components/Heatmap';
import ResultsPanel from '../components/ResultsPanel';
import ZoneDetailsModal from '../components/ZoneDetailsModal';

const QUICK_ZONES = [
  'Sitabuldi',
  'Dharampeth',
  'Civil Lines',
  'Sadar',
  'Mahal',
  'Itwari',
  'Laxmi Nagar',
  'Gandhibagh'
];

const Home = () => {
  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [source, setSource] = useState('Dharampeth');
  const [destination, setDestination] = useState('Sadar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [journeyResult, setJourneyResult] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        setAreasLoading(true);
        const res = await areaAPI.getAreas();
        setAreas(res.data.areas || []);
      } catch (err) {
        console.error('Failed to load Nagpur zones:', err);
      } finally {
        setAreasLoading(false);
      }
    };
    fetchAreas();
  }, []);

  const handleSwapLocations = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    if (!source.trim() || !destination.trim()) {
      setError('Please provide both Source and Destination locations.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await navigationAPI.analyzeJourney(source.trim(), destination.trim());
      setJourneyResult(res.data);
    } catch (err) {
      setError(err.message || 'Failed to analyze zone journey. Please check locations.');
    } finally {
      setLoading(false);
    }
  };

  const lowRiskCount = areas.filter(a => a.riskLevel === 'Low').length;
  const criticalCount = areas.filter(a => a.riskLevel === 'Critical' || a.riskLevel === 'High').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header & Telemetry Status Bar */}
      <div className="space-y-4 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold tracking-wider">
          <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>NAGPUR URBAN INTELLIGENCE PLATFORM</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          SafePath <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">Geospatial Corridors</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
          Context-aware urban safety decision support. Evaluates risk corridors across Nagpur's predefined police station catchment sectors to highlight lower-risk pathways.
        </p>

        {/* Live System Metrics Bar */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-xl mx-auto pt-2">
          <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800 border-t-2 border-t-blue-500 shadow-lg shadow-black/40">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Sectors Monitored</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">{areas.length || 35}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800 border-t-2 border-t-emerald-500 shadow-lg shadow-black/40">
            <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 block tracking-wider">Low-Risk Safe</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 block">{lowRiskCount || 12}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800 border-t-2 border-t-amber-500 shadow-lg shadow-black/40">
            <span className="text-[10px] uppercase font-mono font-bold text-amber-400 block tracking-wider">Active Caution</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5 block">{criticalCount || 8}</span>
          </div>
        </div>
      </div>

      {/* Journey Query Command Card */}
      <div className="bg-[#0b1220]/95 border border-slate-700/80 rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden ring-1 ring-blue-500/20">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent" />
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3 items-end">
            {/* Source */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                Origin Catchment / Zone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Dharampeth, Nagpur"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#060a14] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 font-sans transition-colors"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="hidden md:flex justify-center pb-1">
              <button
                type="button"
                onClick={handleSwapLocations}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-sm"
                title="Swap origin and destination"
              >
                <ArrowLeftRight className="w-4 h-4 text-blue-400" />
              </button>
            </div>

            {/* Destination */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                Destination Catchment / Zone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-400">
                  <Navigation className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Sadar, Nagpur"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#060a14] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 font-sans transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Quick Zone Chips */}
          <div className="flex items-center flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 mr-1 font-mono uppercase font-semibold">Quick Select:</span>
            {QUICK_ZONES.map((zone) => (
              <button
                type="button"
                key={zone}
                onClick={() => {
                  if (!source || source === zone) setDestination(zone);
                  else setSource(zone);
                }}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-colors"
              >
                {zone}
              </button>
            ))}
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 hover:from-blue-500 hover:to-sky-400 text-white font-extrabold text-sm transition-all shadow-[0_0_24px_rgba(14,165,233,0.35)] flex items-center justify-center space-x-2 disabled:opacity-50 border border-sky-400/40"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Evaluating Corridor Risks...' : 'Assess Safe Corridor'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results Panel */}
      {journeyResult && <ResultsPanel result={journeyResult} />}

      {/* Interactive Safety Heatmap */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span>Nagpur Urban Geospatial Heatmap</span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive risk assessment across {areas.length || 35} police station catchment sectors. Click any zone marker for details.
            </p>
          </div>
        </div>

        <Heatmap
          areas={areas}
          journeyResult={journeyResult}
          onSelectZone={(zone) => setSelectedZone(zone)}
        />
      </div>

      {/* Zone Details Modal */}
      {selectedZone && (
        <ZoneDetailsModal
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </div>
  );
};

export default Home;
