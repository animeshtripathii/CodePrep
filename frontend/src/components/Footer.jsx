import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="w-full border-t border-[#0dccf2]/10 bg-[#050a0b]/80 backdrop-blur-md py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Brand Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-8 h-8 bg-[#0dccf2] rounded-lg flex items-center justify-center text-[#050a0b] group-hover:scale-105 transition-transform">
                            <span className="material-icons text-xl font-bold">code</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white uppercase group-hover:text-[#0dccf2] transition-colors">
                            Code<span className="text-[#0dccf2] group-hover:text-white transition-colors">Prep</span>
                        </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Master data structures and algorithms with our curated problem sets and become a top-tier developer.
                    </p>
                </div>

                {/* Quick Links */}
                <div>
                    <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4">Platform</h3>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><Link to="/" className="hover:text-[#0dccf2] transition-colors">Problems</Link></li>
                        <li><Link to="#" className="hover:text-[#0dccf2] transition-colors">Contests</Link></li>
                        <li><Link to="#" className="hover:text-[#0dccf2] transition-colors">Leaderboard</Link></li>
                        <li><Link to="/dashboard" className="hover:text-[#0dccf2] transition-colors">Dashboard</Link></li>
                    </ul>
                </div>

                {/* Resources */}
                <div>
                    <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4">Resources</h3>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><a href="#" className="hover:text-[#0dccf2] transition-colors">Documentation</a></li>
                        <li><a href="#" className="hover:text-[#0dccf2] transition-colors">API</a></li>
                        <li><a href="#" className="hover:text-[#0dccf2] transition-colors">Community</a></li>
                        <li><a href="#" className="hover:text-[#0dccf2] transition-colors">Blog</a></li>
                    </ul>
                </div>

                {/* Legal & Social */}
                <div>
                    <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4">Legal</h3>
                    <ul className="space-y-2 text-sm text-slate-400 mb-6">
                        <li><a href="#" className="hover:text-[#0dccf2] transition-colors">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-[#0dccf2] transition-colors">Terms of Service</a></li>
                    </ul>
                    <div className="flex gap-4">
                        <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-[#0dccf2] hover:text-[#050a0b] transition-all">
                            <span className="material-icons text-sm">alternate_email</span>
                        </a>
                        <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-[#0dccf2] hover:text-[#050a0b] transition-all">
                            <span className="material-icons text-sm">code</span>
                        </a>
                        <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-[#0dccf2] hover:text-[#050a0b] transition-all">
                            <span className="material-icons text-sm">rss_feed</span>
                        </a>
                    </div>
                </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-slate-500">
                    &copy; {new Date().getFullYear()} CodePrep. All rights reserved.
                </p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                    <span className="text-xs text-[#10b981] font-mono">Systems Operational</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
