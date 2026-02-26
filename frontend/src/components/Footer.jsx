import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-[#1a3322] bg-[#0d1b12] py-8 text-white">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-7 text-[#13ec5b]">
              <span className="material-symbols-outlined text-3xl leading-none">code_blocks</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Code<span className="text-[#13ec5b]">Prep</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed font-medium">
            Master data structures and algorithms with our curated problem sets and become a top-tier developer.
          </p>
        </div>

        {/* Platform links */}
        <div>
          <h3 className="text-white font-bold uppercase tracking-wider text-xs mb-4">Platform</h3>
          <ul className="space-y-2 text-sm font-medium text-slate-400">
            <li><Link to="/" className="hover:text-[#13ec5b] transition-colors">Problems</Link></li>
            <li><Link to="/dashboard" className="hover:text-[#13ec5b] transition-colors">Dashboard</Link></li>
            <li><a href="#" className="hover:text-[#13ec5b] transition-colors opacity-60 cursor-not-allowed">Contests</a></li>
            <li><a href="#" className="hover:text-[#13ec5b] transition-colors opacity-60 cursor-not-allowed">Leaderboard</a></li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="text-white font-bold uppercase tracking-wider text-xs mb-4">Resources</h3>
          <ul className="space-y-2 text-sm font-medium text-slate-400">
            <li><a href="#" className="hover:text-[#13ec5b] transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-[#13ec5b] transition-colors">API</a></li>
            <li><a href="#" className="hover:text-[#13ec5b] transition-colors">Community</a></li>
            <li><a href="#" className="hover:text-[#13ec5b] transition-colors">Blog</a></li>
          </ul>
        </div>

        {/* Legal + social */}
        <div>
          <h3 className="text-white font-bold uppercase tracking-wider text-xs mb-4">Legal</h3>
          <ul className="space-y-2 text-sm font-medium text-slate-400 mb-5">
            <li><a href="#" className="hover:text-[#13ec5b] transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-[#13ec5b] transition-colors">Terms of Service</a></li>
          </ul>
          <div className="flex gap-3">
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-[#13ec5b] hover:text-[#0d1b12] hover:border-[#13ec5b] transition-all shadow-sm">
              <span className="material-symbols-outlined text-[16px]">public</span>
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-[#13ec5b] hover:text-[#0d1b12] hover:border-[#13ec5b] transition-all shadow-sm">
              <span className="material-symbols-outlined text-[16px]">mail</span>
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-[#13ec5b] hover:text-[#0d1b12] hover:border-[#13ec5b] transition-all shadow-sm">
              <span className="material-symbols-outlined text-[16px]">code</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1400px] mx-auto px-6 pt-6 border-t border-[#1a3322] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
          <span>© {new Date().getFullYear()} CodePrep</span>
          <span className="w-1 h-1 bg-slate-600 rounded-full" />
          <a href="#" className="hover:text-[#13ec5b] transition-colors">Terms</a>
          <span className="w-1 h-1 bg-slate-600 rounded-full" />
          <a href="#" className="hover:text-[#13ec5b] transition-colors">Privacy</a>
        </div>
        <div className="flex items-center gap-2 bg-[#13ec5b]/10 px-3 py-1.5 rounded-full border border-[#13ec5b]/20">
          <span className="w-2 h-2 rounded-full bg-[#13ec5b] animate-pulse" />
          <span className="text-xs text-[#13ec5b] font-mono font-bold">Systems Operational</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
