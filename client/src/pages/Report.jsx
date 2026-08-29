import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, MapPin, Send, CheckCircle2, ShieldAlert, Cpu, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { areaAPI, reportAPI } from '../services/api';

const SAMPLE_PROMPTS = [
  "Someone snatched my gold chain near the bus stop and fled.",
  "Masked individuals checking door handles and car locks around 2 AM.",
  "Deep pothole and broken street light creating severe accident hazard.",
  "Followed by aggressive individuals shouting vulgar remarks along the sidewalk."
];

const Report = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [areas, setAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submissionResult, setSubmissionResult] = useState(null);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await areaAPI.getAreas();
        setAreas(res.data.areas || []);
        if (res.data.areas?.length > 0) {
          setSelectedAreaId(res.data.areas[0]._id);
        }
      } catch (err) {
        console.error('Failed to load zones:', err);
      }
    };
    fetchAreas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 5) {
      setError('Please provide a detailed incident description (at least 5 characters).');
      return;
    }

    setError('');
    setLoading(true);
    setSubmissionResult(null);

    try {
      const payload = {
        description: description.trim(),
        areaId: selectedAreaId || undefined,
        location: customLocation.trim() || undefined
      };

      const res = await reportAPI.createReport(payload);
      setSubmissionResult(res.data);
      setDescription('');
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-2xl">
        <div className="inline-flex p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Authentication Required</h2>
        <p className="text-xs text-slate-400">
          You must be signed in to submit safety incident reports to prevent malicious automated reports and maintain data integrity.
        </p>
        <div className="pt-2 flex justify-center space-x-3">
          <Link
            to="/login"
            state={{ from: { pathname: '/report' } }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-900/30"
          >
            Sign In to Report
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2.5">
          <AlertTriangle className="w-7 h-7 text-amber-400" />
          <span>Report Safety Incident</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Describe what occurred in plain text. SafePath's Machine Learning classifier automatically categorizes the incident and updates Nagpur safety metrics.
        </p>
      </div>

      {/* Submission Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Location / Zone Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Nagpur Zone / Locality
              </label>
              <div className="relative">
                <select
                  value={selectedAreaId}
                  onChange={(e) => {
                    setSelectedAreaId(e.target.value);
                    setCustomLocation('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {areas.map((area) => (
                    <option key={area._id} value={area._id}>
                      {area.name} ({area.riskLevel} Risk - {area.riskScore}/100)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Specific Landmark / Spot (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="e.g. Near Metro Pillar 42"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Incident Description (Plain Text)
              </label>
              <span className="text-[11px] text-blue-400 flex items-center space-x-1">
                <Cpu className="w-3 h-3" />
                <span>AI Auto-Classified</span>
              </span>
            </div>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the incident clearly (e.g. 'Someone snatched my purse from behind and fled towards the alley...')"
              className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Sample Prompts */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-semibold">Try sample descriptions:</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((prompt, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setDescription(prompt)}
                  className="text-left text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
                >
                  "{prompt.slice(0, 35)}..."
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-2 text-red-400 text-xs">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Classifying with ML...' : 'Submit Incident Report'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Live AI Classification Result Card */}
      {submissionResult && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center space-x-2.5 text-emerald-400 font-bold text-base border-b border-slate-800 pb-3">
            <CheckCircle2 className="w-5 h-5" />
            <span>Incident Classified &amp; Recorded</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* AI Incident Type */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">ML Incident Type</span>
              <div className="text-base font-extrabold text-blue-400 mt-1">
                {submissionResult.report.incidentType}
              </div>
            </div>

            {/* Confidence */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Model Confidence</span>
              <div className="text-base font-extrabold text-white mt-1">
                {(submissionResult.report.confidence * 100).toFixed(1)}%
              </div>
            </div>

            {/* Affected Zone */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Affected Zone</span>
              <div className="text-base font-extrabold text-white mt-1">
                {submissionResult.report.area?.name}
              </div>
            </div>

            {/* Zone Risk Score */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Updated Zone Risk</span>
              <div className="text-base font-extrabold text-amber-400 mt-1">
                {submissionResult.report.area?.updatedRiskScore} / 100 ({submissionResult.report.area?.updatedRiskLevel})
              </div>
            </div>
          </div>

          {/* AI Disclaimer */}
          <div className="text-xs text-slate-400 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-slate-300 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>AI Classifier Disclaimer</span>
            </div>
            <p className="leading-relaxed">
              {submissionResult.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
