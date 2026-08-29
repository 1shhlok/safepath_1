import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="flex items-center space-x-2 text-slate-200 font-semibold text-sm mb-2">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              <span>SafePath Decision-Support Notice</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              SafePath is an AI-assisted urban safety decision-support tool for Nagpur. Risk scores and zone recommendations are estimated from available synthetic and community reports. SafePath does not provide turn-by-turn road navigation and does not guarantee personal safety. In emergencies, contact Nagpur Police emergency helpline (112).
            </p>
          </div>
          <div className="flex flex-col md:items-end justify-center space-y-2">
            <div className="flex items-center space-x-2 text-slate-400">
              <Info className="w-3.5 h-3.5" />
              <span>Nagpur Predefined Safety Zone Harness</span>
            </div>
            <p className="text-slate-500">
              © 2026 SafePath Nagpur. OpenStreetMap &amp; Leaflet contributors.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
