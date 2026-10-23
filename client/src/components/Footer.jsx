import React from 'react';
import { ShieldAlert, Info, PhoneCall, Activity } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#080c15] border-t border-slate-800/80 text-slate-400 text-xs py-8 mt-16 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-slate-200 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              <span>SafePath Urban Decision Support Notice</span>
            </div>
            <p className="leading-relaxed text-slate-400 text-[11px]">
              SafePath is an AI-assisted urban safety decision-support tool for Nagpur. Risk scores and zone recommendations are estimated from available synthetic and community reports. SafePath does not provide turn-by-turn road navigation and does not guarantee personal safety.
            </p>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-red-950/40 border border-red-500/30 text-red-300 font-mono text-[11px]">
              <PhoneCall className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Emergency Helpline: Nagpur Police 112</span>
            </div>
          </div>
          <div className="flex flex-col md:items-end justify-center space-y-2">
            <div className="flex items-center space-x-2 text-slate-300 font-mono text-[11px]">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nagpur Predefined Safety Zone Harness</span>
            </div>
            <p className="text-slate-500 text-[11px] font-mono">
              © 2026 SafePath Nagpur. OpenStreetMap &amp; Leaflet Cartography.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
