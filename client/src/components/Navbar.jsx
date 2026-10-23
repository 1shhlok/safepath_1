import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, MapPin, AlertTriangle, User, LogOut, Lock, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#090d16]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative p-2.5 bg-blue-950/60 text-blue-400 rounded-xl group-hover:bg-blue-900/50 transition-all border border-blue-500/30 shadow-lg shadow-blue-950/50">
              <Shield className="w-5 h-5 text-blue-400 group-hover:scale-105 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#090d16] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-tight text-white flex items-center">
                  Safe<span className="text-blue-400">Path</span>
                  <span className="ml-1 text-[11px] font-mono font-bold tracking-widest text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                    AI
                  </span>
                </span>
                <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700/80 uppercase font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>Nagpur Ops</span>
                </span>
              </div>
              <p className="hidden md:block text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Geospatial Safety Intelligence
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 ${
                isActive('/')
                  ? 'bg-blue-600/15 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-900/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
              <span>Safety Map</span>
            </Link>

            <Link
              to="/report"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 ${
                isActive('/report')
                  ? 'bg-blue-600/15 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-900/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>Report Incident</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 ${
                  isActive('/admin')
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-900/30'
                    : 'text-purple-300/80 hover:text-purple-200 hover:bg-purple-950/40 border border-transparent'
                }`}
              >
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Auth Controls */}
          <div className="flex items-center space-x-2.5">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2.5">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-200">{user?.name}</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400">{user?.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-slate-900/90 text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors border border-slate-800"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-900/40 border border-blue-400/30"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
