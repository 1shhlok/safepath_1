import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  Filter,
  Eye,
  Check,
  X,
  Archive,
  RefreshCw,
  Lock,
  Image,
  FileText,
  Clock,
  History,
  AlertCircle,
  ExternalLink,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reportAPI, areaAPI, getStoredToken } from '../services/api';

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [areas, setAreas] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'audit'
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Evidence preview modal state
  const [previewImage, setPreviewImage] = useState(null);

  // Rejection modal state
  const [rejectingReportId, setRejectingReportId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * Ensure evidence links include current JWT bearer token so browser can stream media directly
   */
  const getEvidenceUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('/api/reports/evidence') || url.startsWith('/api/evidence')) {
      const token = getStoredToken();
      if (token) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}token=${encodeURIComponent(token)}`;
      }
    }
    return url;
  };

  const fetchReportsAndData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (selectedAreaFilter) params.areaId = selectedAreaFilter;

      const [repRes, areaRes, auditRes] = await Promise.all([
        reportAPI.getReports(params),
        areaAPI.getAreas(),
        reportAPI.getAuditLogs({ limit: 50 }).catch(() => ({ data: { logs: [] } }))
      ]);

      setReports(repRes.data.reports || []);
      setTotalCount(repRes.data.total || 0);
      setAreas(areaRes.data.areas || []);
      setAuditLogs(auditRes.data?.logs || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchReportsAndData();
    }
  }, [isAdmin, statusFilter, selectedAreaFilter]);

  const handleAcceptReport = async (reportId) => {
    setActionLoading(true);
    try {
      await reportAPI.reviewReport(reportId, {
        decision: 'accepted',
        reviewNotes: 'Verified and approved by administrator.'
      });
      fetchReportsAndData();
    } catch (err) {
      alert(`Failed to accept report: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('A specific rejection reason is mandatory.');
      return;
    }

    setActionLoading(true);
    try {
      await reportAPI.reviewReport(rejectingReportId, {
        decision: 'rejected',
        rejectionReason: rejectionReason.trim(),
        reviewNotes: reviewNotes.trim()
      });
      setRejectingReportId(null);
      setRejectionReason('');
      setReviewNotes('');
      fetchReportsAndData();
    } catch (err) {
      alert(`Failed to reject report: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to archive this report?')) return;
    try {
      await reportAPI.reviewReport(reportId, {
        decision: 'archived',
        reviewNotes: 'Archived by administrator.'
      });
      fetchReportsAndData();
    } catch (err) {
      alert(`Failed to archive report: ${err.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-2xl">
        <div className="inline-flex p-3 bg-purple-600/20 text-purple-400 rounded-2xl border border-purple-500/30">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
        <p className="text-xs text-slate-400">
          This portal is reserved for SafePath system administrators. Please sign in with an admin account.
        </p>
      </div>
    );
  }

  const pendingCount = reports.filter((r) => r.status === 'pending_review').length;
  const acceptedCount = reports.filter((r) => r.status === 'accepted').length;
  const rejectedCount = reports.filter((r) => r.status === 'rejected').length;

  const filteredReports = reports.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.description?.toLowerCase().includes(q) ||
      r.incidentType?.toLowerCase().includes(q) ||
      r.areaId?.name?.toLowerCase().includes(q) ||
      r._id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[11px] font-mono font-bold tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>CENTRAL MODERATION &amp; AUDIT CONSOLE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2.5">
            <span>SafePath Admin Portal</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Review submitted citizen complaints with evidence, enforce quality moderation, and audit decision records.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab(activeTab === 'reports' ? 'audit' : 'reports')}
            className="px-4 py-2 bg-[#0b101f] hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/80 transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            {activeTab === 'reports' ? (
              <>
                <History className="w-3.5 h-3.5 text-blue-400" />
                <span>View Audit Trail</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>View Reports Queue</span>
              </>
            )}
          </button>

          <button
            onClick={fetchReportsAndData}
            className="px-4 py-2 bg-[#0b101f] hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/80 transition-colors flex items-center space-x-2 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#0b101f] p-5 rounded-2xl border border-slate-800/90 shadow-md">
          <span className="text-[11px] uppercase font-mono font-bold text-slate-400">Pending Review</span>
          <div className="text-3xl font-black text-amber-400 mt-1 font-mono flex items-baseline justify-between">
            <span>{pendingCount}</span>
            {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
          </div>
        </div>

        <div className="bg-[#0b101f] p-5 rounded-2xl border border-slate-800/90 shadow-md">
          <span className="text-[11px] uppercase font-mono font-bold text-slate-400">Accepted (Live in Risk)</span>
          <div className="text-3xl font-black text-emerald-400 mt-1 font-mono">{acceptedCount}</div>
        </div>

        <div className="bg-[#0b101f] p-5 rounded-2xl border border-slate-800/90 shadow-md">
          <span className="text-[11px] uppercase font-mono font-bold text-slate-400">Rejected Complaints</span>
          <div className="text-3xl font-black text-red-400 mt-1 font-mono">{rejectedCount}</div>
        </div>

        <div className="bg-[#0b101f] p-5 rounded-2xl border border-slate-800/90 shadow-md">
          <span className="text-[11px] uppercase font-mono font-bold text-slate-400">Station Catchments</span>
          <div className="text-3xl font-black text-blue-400 mt-1 font-mono">{areas.length}</div>
        </div>
      </div>

      {activeTab === 'reports' ? (
        <>
          {/* Filters */}
          <div className="bg-[#0b101f]/90 border border-slate-800/90 rounded-2xl p-4 flex flex-wrap items-center gap-3 backdrop-blur-xl">
            <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              <Filter className="w-3.5 h-3.5 text-blue-400" />
              <span>Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#070b14] border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
            >
              <option value="">All Statuses</option>
              <option value="pending_review">Pending Review</option>
              <option value="accepted">Accepted (Affects Risk)</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>

            {/* Area Filter */}
            <select
              value={selectedAreaFilter}
              onChange={(e) => setSelectedAreaFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#070b14] border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
            >
              <option value="">All Catchment Stations</option>
              {areas.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description, category, or station..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#070b14] border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans transition-colors"
              />
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-[#0b101f] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#070b14] text-slate-400 uppercase font-mono font-bold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Timestamp</th>
                    <th className="px-4 py-3.5">Catchment Station</th>
                    <th className="px-4 py-3.5">Description</th>
                    <th className="px-4 py-3.5">ML Prediction</th>
                    <th className="px-4 py-3.5">Evidence</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Admin Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-slate-500 font-mono">
                        Loading complaints...
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-slate-500 font-mono">
                        No reports match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                          {new Date(r.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-white">
                          {r.areaId?.name || 'Unknown'}
                          {r.areaId?.policeZone && (
                            <span className="block text-[10px] text-slate-500 font-mono font-normal">
                              {r.areaId.policeZone}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 max-w-xs text-slate-300" title={r.description}>
                          <p className="truncate font-medium">{r.description}</p>
                          {r.status === 'rejected' && r.review?.rejectionReason && (
                            <span className="text-[10px] text-red-400 block mt-0.5 font-mono">
                              Reason: {r.review.rejectionReason}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono">
                          <span className="font-bold text-blue-400 text-[11px]">{r.incidentType}</span>
                          <span className="block text-[10px] text-slate-500">
                            {(r.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {r.evidenceImages && r.evidenceImages.length > 0 ? (
                            <div className="flex items-center space-x-1.5">
                              {r.evidenceImages.map((img, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setPreviewImage({
                                    url: getEvidenceUrl(img.url),
                                    rawUrl: img.url,
                                    fileName: img.fileName,
                                    report: r
                                  })}
                                  className="px-2 py-1 rounded-md bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 flex items-center space-x-1 transition-all hover:scale-105 shadow-sm"
                                  title={img.fileName || 'Click to view evidence image'}
                                >
                                  <Image className="w-3.5 h-3.5 text-purple-400" />
                                  <span className="text-[10px] font-mono">#{idx + 1}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">No image</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                              r.status === 'accepted'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : r.status === 'pending_review'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : r.status === 'rejected'
                                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {r.status === 'pending_review'
                              ? 'Pending'
                              : r.status === 'accepted'
                              ? 'Accepted'
                              : r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {r.status === 'pending_review' && (
                              <>
                                <button
                                  onClick={() => handleAcceptReport(r._id)}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-1 text-[11px] shadow-sm transition-colors"
                                  title="Approve and apply risk impact"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => setRejectingReportId(r._id)}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold flex items-center space-x-1 text-[11px] shadow-sm transition-colors"
                                  title="Reject with required reason"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}
                            {r.status !== 'archived' && (
                              <button
                                onClick={() => handleArchiveReport(r._id)}
                                className="p-1.5 rounded-lg bg-[#070b14] text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800 transition-colors"
                                title="Archive Report"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Audit Logs View */
        <div className="bg-[#0b101f] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-slate-800 bg-[#070b14]/70 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-blue-400" />
              <h2 className="font-bold text-white text-xs sm:text-sm font-mono tracking-wider uppercase">Administrative Audit Trail</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">{auditLogs.length} recent events logged</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#070b14] text-slate-400 uppercase font-mono font-bold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Actor</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-500 font-mono">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.action === 'REPORT_REVIEW_ACCEPTED'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : log.action === 'REPORT_REVIEW_REJECTED'
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-white">
                        {log.actorId?.name || log.actorId?.email || 'System'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">{log.actorRole}</td>
                      <td className="px-4 py-3.5 max-w-sm text-slate-300">
                        {log.details?.rejectionReason && (
                          <div className="text-red-400 font-mono text-[11px]">
                            Reason: {log.details.rejectionReason}
                          </div>
                        )}
                        {log.details?.newAreaRiskScore !== undefined && (
                          <div className="text-emerald-400 font-mono text-[11px]">
                            Area Risk Updated: {log.details.newAreaRiskScore}/100
                          </div>
                        )}
                        {log.details?.incidentType && (
                          <div className="text-slate-400 font-mono text-[11px]">
                            Incident: {log.details.incidentType}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mandatory Rejection Reason Modal */}
      {rejectingReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0b101f] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2.5 text-red-400 border-b border-slate-800 pb-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-base text-white">Reject Complaint Report</h3>
            </div>
            <p className="text-xs text-slate-400">
              Delta Harness requires a mandatory, documented rejection reason for administrative accountability.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Mandatory Rejection Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Photo evidence does not match described location; image is unreadable..."
                  className="w-full p-3 bg-[#070b14] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Internal Administrative Notes (Optional)
                </label>
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Notes for internal audit trail..."
                  className="w-full px-3 py-2 bg-[#070b14] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 font-sans"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingReportId(null);
                    setRejectionReason('');
                    setReviewNotes('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Evidence Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0b101f] border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#070b14]/80">
              <div className="flex items-center space-x-2 text-purple-400">
                <Image className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">
                  Incident Photographic Evidence {previewImage.fileName ? `(${previewImage.fileName})` : ''}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 text-xs flex items-center space-x-1 transition-colors border border-slate-700"
                  title="Open full size image in new browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">New Tab</span>
                </a>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-[#070b14]/70 min-h-[300px]">
              <img
                src={previewImage.url}
                alt="Complaint Evidence"
                className="max-h-[60vh] max-w-full rounded-xl object-contain border border-slate-800 shadow-lg"
              />
            </div>

            {previewImage.report && (
              <div className="p-3.5 border-t border-slate-800 bg-[#070b14]/90 text-xs flex items-center justify-between text-slate-400">
                <div>
                  <span className="font-bold text-blue-400 font-mono">{previewImage.report.incidentType}</span>
                  <span className="mx-2 text-slate-600">•</span>
                  <span className="text-white font-bold">{previewImage.report.areaId?.name || 'Catchment Area'}</span>
                </div>
                <span className="font-mono text-slate-500">
                  {new Date(previewImage.report.timestamp).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
