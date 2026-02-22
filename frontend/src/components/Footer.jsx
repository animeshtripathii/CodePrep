import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-[#0f172a] py-8">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-7 text-[#135bec]">
              <span className="material-symbols-outlined text-3xl leading-none">code_blocks</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Code<span className="text-[#135bec]">Prep</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Master data structures and algorithms with our curated problem sets and become a top-tier developer.
          </p>
        </div>

        {/* Platform links */}
        <div>
          <h3 className="text-white font-bold uppercase tracking-wider text-xs mb-4">Platform</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link to="/" className="hover:text-[#135bec] transition-colors">Problems</Link></li>
            <li><Link to="/dashboard" className="hover:text-[#135bec] transition-colors">Dashboard</Link></li>
            <li><a href="#" className="hover:text-[#135bec] transition-colors opacity-60 cursor-not-allowed">Contests</a></li>
            <li><a href="#" className="hover:text-[#135bec] transition-colors opacity-60 cursor-not-allowed">Leaderboard</a></li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="text-white font-bold uppercase tracking-wider text-xs mb-4">Resources</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="#" className="hover:text-[#135bec] transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-[#135bec] transition-colors">API</a></li>
            <li><a href="#" className="hover:text-[#135bec] transition-colors">Community</a></li>
            <li><a href="#" className="hover:text-[#135bec] transition-colors">Blog</a></li>
          </ul>
        </div>

        {/* Legal + social */}
        <div>
          <h3 className="text-white font-bold uppercase tracking-wider text-xs mb-4">Legal</h3>
          <ul className="space-y-2 text-sm text-slate-400 mb-5">
            <li><a href="#" className="hover:text-[#135bec] transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-[#135bec] transition-colors">Terms of Service</a></li>
          </ul>
          <div className="flex gap-3">
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#135bec] hover:text-white hover:border-[#135bec] transition-all">
              <span className="material-symbols-outlined text-[16px]">public</span>
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#135bec] hover:text-white hover:border-[#135bec] transition-all">
              <span className="material-symbols-outlined text-[16px]">mail</span>
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#135bec] hover:text-white hover:border-[#135bec] transition-all">
              <span className="material-symbols-outlined text-[16px]">code</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1400px] mx-auto px-6 pt-6 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <span>© {new Date().getFullYear()} CodePrep</span>
          <span className="w-1 h-1 bg-slate-600 rounded-full" />
          <a href="#" className="hover:text-[#135bec] transition-colors">Terms</a>
          <span className="w-1 h-1 bg-slate-600 rounded-full" />
          <a href="#" className="hover:text-[#135bec] transition-colors">Privacy</a>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-500 font-mono">Systems Operational</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
