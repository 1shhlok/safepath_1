import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertOctagon, Filter, Eye, Flag, Check, Archive, RefreshCw, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reportAPI, areaAPI } from '../services/api';

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [areas, setAreas] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (selectedAreaFilter) params.areaId = selectedAreaFilter;

      const [repRes, areaRes] = await Promise.all([
        reportAPI.getReports(params),
        areaAPI.getAreas()
      ]);

      setReports(repRes.data.reports || []);
      setTotalCount(repRes.data.total || 0);
      setAreas(areaRes.data.areas || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchReports();
    }
  }, [isAdmin, statusFilter, selectedAreaFilter]);

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await reportAPI.updateStatus(reportId, newStatus);
      fetchReports();
    } catch (err) {
      alert(`Failed to update report status: ${err.message}`);
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

  const lowConfidenceCount = reports.filter(r => r.status === 'low_confidence').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2.5">
            <ShieldCheck className="w-7 h-7 text-purple-400" />
            <span>SafePath Admin Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Monitor AI classification logs, inspect low-confidence records, and manage Nagpur urban incident data.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center space-x-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Total Incident Reports</span>
          <div className="text-3xl font-extrabold text-white mt-1">{totalCount}</div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Active Nagpur Zones</span>
          <div className="text-3xl font-extrabold text-blue-400 mt-1">{areas.length}</div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Low Confidence Flagged</span>
          <div className="text-3xl font-extrabold text-amber-400 mt-1">{lowConfidenceCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-400" />
          <span>Filters:</span>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="low_confidence">Low Confidence</option>
          <option value="flagged">Flagged</option>
          <option value="archived">Archived</option>
        </select>

        {/* Area Filter */}
        <select
          value={selectedAreaFilter}
          onChange={(e) => setSelectedAreaFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">All Zones</option>
          {areas.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Reports Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Zone</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">ML Classification</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-500">
                    Loading records...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-500">
                    No reports match the selected filters.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400 font-mono">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {r.areaId?.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-300" title={r.description}>
                      {r.description}
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-400">
                      {r.incidentType}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {(r.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : r.status === 'low_confidence'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : r.status === 'flagged'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {r.status !== 'active' && (
                          <button
                            onClick={() => handleStatusChange(r._id, 'active')}
                            className="p-1 rounded bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-800/40"
                            title="Approve as Active"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {r.status !== 'flagged' && (
                          <button
                            onClick={() => handleStatusChange(r._id, 'flagged')}
                            className="p-1 rounded bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-800/40"
                            title="Flag Inappropriate"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {r.status !== 'archived' && (
                          <button
                            onClick={() => handleStatusChange(r._id, 'archived')}
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                            title="Archive"
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
    </div>
  );
};

export default Admin;
