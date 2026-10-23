import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle,
  MapPin,
  Send,
  CheckCircle2,
  ShieldAlert,
  Cpu,
  Sparkles,
  Upload,
  Image,
  X,
  Clock,
  Info,
  Radio,
  FileCheck
} from 'lucide-react';
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
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
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
        console.error('Failed to load police station catchment areas:', err);
      }
    };
    fetchAreas();
  }, []);

  const processFiles = (files) => {
    if (!files || !files.length) return;

    if (evidenceFiles.length + files.length > 3) {
      setError('Maximum of 3 evidence images permitted per report.');
      return;
    }

    // Check size and type
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`File '${file.name}' exceeds the 5MB size limit.`);
        return;
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError(`File '${file.name}' has invalid format. Only JPEG, PNG, and WebP are allowed.`);
        return;
      }
    }

    setError('');
    setEvidenceFiles((prev) => [...prev, ...files].slice(0, 3));
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    processFiles(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const removeFile = (index) => {
    setEvidenceFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 5) {
      setError('Please provide a detailed incident description (at least 5 characters).');
      return;
    }

    if (evidenceFiles.length === 0) {
      setError('At least one evidence image is required for incident review (maximum 3 images).');
      return;
    }

    setError('');
    setLoading(true);
    setSubmissionResult(null);

    try {
      const formData = new FormData();
      formData.append('description', description.trim());
      if (selectedAreaId) formData.append('areaId', selectedAreaId);
      if (customLocation.trim()) formData.append('location', customLocation.trim());

      evidenceFiles.forEach((file) => {
        formData.append('evidence', file);
      });

      const res = await reportAPI.createReport(formData);
      setSubmissionResult(res.data);
      setDescription('');
      setEvidenceFiles([]);
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-[#0b101f] border border-slate-800/90 rounded-2xl text-center space-y-4 shadow-2xl backdrop-blur-xl">
        <div className="inline-flex p-3.5 bg-blue-600/15 text-blue-400 rounded-2xl border border-blue-500/30">
          <ShieldAlert className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">Authentication Required</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          You must be signed in to submit safety incident reports to prevent malicious automated reports and maintain data integrity.
        </p>
        <div className="pt-2 flex justify-center space-x-3">
          <Link
            to="/login"
            state={{ from: { pathname: '/report' } }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-900/40 border border-blue-400/30"
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
      <div className="space-y-1.5">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold tracking-wider">
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>CITIZEN INCIDENT DISPATCH INTAKE</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center space-x-2.5">
          <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
          <span>Report Safety Incident</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Submit urban safety observations with photographic evidence. New reports are entered as <span className="text-amber-400 font-semibold font-mono">Pending Review</span> and require administrative verification before influencing public risk scores.
        </p>
      </div>

      {/* Submission Form Card */}
      <div className="bg-[#0b101f]/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-sky-400 to-blue-500 opacity-70" />
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Police Station Catchment Area Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                Police Station Sector
              </label>
              <div className="relative">
                <select
                  value={selectedAreaId}
                  onChange={(e) => {
                    setSelectedAreaId(e.target.value);
                    setCustomLocation('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
                >
                  {areas.map((area) => (
                    <option key={area._id} value={area._id}>
                      {area.name} {area.stationMarathi ? `(${area.stationMarathi})` : ''} — {area.riskLevel} Risk ({area.riskScore}/100)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
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
                  placeholder="e.g. Near Metro Station Gate 2"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#070b14] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                Incident Description (Plain Text)
              </label>
              <span className="text-[11px] text-blue-400 font-mono flex items-center space-x-1 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                <Cpu className="w-3 h-3" />
                <span>Text-Only ML Classifier</span>
              </span>
            </div>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred clearly (minimum 5 characters)..."
              className="w-full p-3.5 bg-[#070b14] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans transition-colors"
            />
          </div>

          {/* Sample Prompts */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-mono font-bold uppercase tracking-wider">Example Incident Prompts:</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((prompt, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setDescription(prompt)}
                  className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                >
                  "{prompt.slice(0, 36)}..."
                </button>
              ))}
            </div>
          </div>

          {/* Mandatory Evidence Image Upload */}
          <div className="space-y-2.5 border-t border-slate-800/80 pt-4">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <Image className="w-4 h-4 text-purple-400" />
                <span>Supporting Evidence Images (Required: 1 to 3)</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">JPEG, PNG, WebP (Max 5MB)</span>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700/80 hover:border-blue-500/60 bg-[#070b14]/50'
              }`}
            >
              <input
                type="file"
                id="evidence-upload"
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                disabled={evidenceFiles.length >= 3}
                className="hidden"
              />
              <label
                htmlFor="evidence-upload"
                className={`cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors shadow-sm ${
                  evidenceFiles.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Choose Evidence Image(s) or Drag &amp; Drop</span>
              </label>
              <p className="text-[11px] text-slate-500 mt-2 font-sans">
                Photographic evidence is required for administrative moderation to protect public safety data against unverified reports.
              </p>
            </div>

            {/* Selected Files Preview List */}
            {evidenceFiles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
                {evidenceFiles.map((file, idx) => {
                  const previewUrl = URL.createObjectURL(file);
                  return (
                    <div
                      key={idx}
                      className="relative group p-2 bg-[#070b14] rounded-xl border border-slate-800/90 text-xs text-slate-300 flex flex-col space-y-1.5 shadow-sm overflow-hidden"
                    >
                      <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                        <img
                          src={previewUrl}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-0.5">
                        <div className="truncate pr-1">
                          <span className="truncate block font-medium text-[11px] text-slate-200">{file.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
              className="w-full sm:w-auto px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center space-x-2 disabled:opacity-50 border border-blue-400/30"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Submitting & Classifying...' : 'Submit Incident Report'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Submission Result Card */}
      {submissionResult && (
        <div className="bg-[#0b101f] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2.5 text-amber-400 font-bold text-sm sm:text-base">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Report Submitted — Pending Administrative Review</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Pending Review
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* AI Incident Type */}
            <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800/90 shadow-inner">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">ML Predicted Category</span>
              <div className="text-sm sm:text-base font-black text-blue-400 mt-1 font-mono">
                {submissionResult.report.incidentType}
              </div>
            </div>

            {/* Confidence */}
            <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800/90 shadow-inner">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Classifier Confidence</span>
              <div className="text-sm sm:text-base font-black text-white mt-1 font-mono">
                {(submissionResult.report.confidence * 100).toFixed(1)}%
              </div>
            </div>

            {/* Target Area */}
            <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800/90 shadow-inner">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Catchment Sector</span>
              <div className="text-sm sm:text-base font-black text-white mt-1">
                {submissionResult.report.area?.name}
              </div>
            </div>
          </div>

          {/* Evidence Summary */}
          <div className="bg-[#070b14]/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
            <div className="font-semibold text-slate-300 flex items-center space-x-1.5 font-mono">
              <Image className="w-3.5 h-3.5 text-purple-400" />
              <span>Evidence Uploaded ({submissionResult.report.evidenceImages?.length || 0} image(s))</span>
            </div>
            <p className="text-slate-400">{submissionResult.notice}</p>
          </div>

          {/* AI & Review Disclaimer */}
          <div className="text-xs text-slate-400 bg-[#070b14]/50 p-3.5 rounded-xl border border-slate-800/60 space-y-1 font-sans">
            <div className="font-bold text-slate-300 flex items-center space-x-1.5 font-mono text-[11px]">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Verification Policy</span>
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
