import React, { useState, useEffect } from 'react';
import { Search, Navigation, AlertCircle, Sparkles, MapPin } from 'lucide-react';
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
  const [source, setSource] = useState('Dharampeth');
  const [destination, setDestination] = useState('Sadar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [journeyResult, setJourneyResult] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await areaAPI.getAreas();
        setAreas(res.data.areas || []);
      } catch (err) {
        console.error('Failed to load Nagpur zones:', err);
      }
    };
    fetchAreas();
  }, []);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Context-Aware Urban Safety Decision Support</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
          Navigate Nagpur with <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">Safety Intelligence</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          SafePath evaluates safety corridors across Nagpur's predefined urban zones. Discover lower-risk areas to follow and elevated-risk zones to avoid.
        </p>
      </div>

      {/* Journey Query Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl backdrop-blur-sm">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Source Location / Zone
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Destination Location / Zone
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Quick Zone Chips */}
          <div className="flex items-center flex-wrap gap-1.5 pt-1">
            <span className="text-xs text-slate-400 mr-1">Quick Select:</span>
            {QUICK_ZONES.map((zone) => (
              <button
                type="button"
                key={zone}
                onClick={() => {
                  if (!source || source === zone) setDestination(zone);
                  else setSource(zone);
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
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
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Analyzing Safety Zones...' : 'Analyze Safe Journey'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results Panel */}
      {journeyResult && <ResultsPanel result={journeyResult} />}

      {/* Interactive Safety Heatmap */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Nagpur Urban Safety Heatmap</h2>
            <p className="text-xs text-slate-400">
              Interactive risk visualization across 24 predefined Nagpur safety zones. Click any zone to view details.
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
