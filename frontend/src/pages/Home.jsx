import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../app/features/auth/authSlice';
import '../styles/Home.css';

const Home = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector((state) => state.auth);

    return (
        <div className="home-theme-root text-slate-100 min-h-screen flex flex-col relative selection:bg-indigo-500/30 selection:text-white font-[Manrope] overflow-x-hidden">
            <div className="home-ambient-orb home-orb-left" />
            <div className="home-ambient-orb home-orb-right" />

            {/* Navigation */}
            <header className="nav-glass fixed top-0 w-full z-50 flex items-center justify-between px-8 py-4">
                <div className="flex items-center gap-3">
                    <div className="text-[#6366F1] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[28px]">code_blocks</span>
                    </div>
                    <span className="font-display font-bold text-xl tracking-tight text-white">CodePrep</span>
                </div>
                <nav className="hidden md:flex items-center gap-8">
                </nav>
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <button
                            onClick={() => dispatch(logoutUser())}
                            className="bg-rose-500/15 border border-rose-400/35 hover:bg-rose-500/25 text-rose-200 text-sm font-bold px-5 py-2.5 rounded-lg transition-all"
                        >
                            Logout
                        </button>
                    ) : (
                        <>
                            <button onClick={() => navigate('/login')} className="text-slate-300 hover:text-white text-sm font-medium px-4 py-2 transition-colors">Sign In</button>
                            <button onClick={() => navigate('/signup')} className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#6366F1] hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all">
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Main Hero Section */}
            <main className="flex-1 flex items-center justify-center relative z-10 px-4 min-h-screen pt-20">
                <div className="max-w-[1400px] w-full mx-auto grid lg:grid-cols-3 gap-12 items-center">
                    
                    {/* Left Card */}
                    <div className="hidden lg:flex justify-end items-center relative animate-[slideUp_1s_ease-out_both] opacity-0" style={{ animationDelay: '0.2s' }}>
                        <div className="glass-card glass-card-left flex flex-col p-6">
                            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#0EA5E9] text-sm">terminal</span>
                                    <span className="font-mono text-xs text-slate-300 uppercase tracking-wider">Solo.py</span>
                                </div>
                                <span className="bg-[#6366F1]/20 text-[#6366F1] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Hard</span>
                            </div>
                            <h3 className="font-display text-lg font-bold text-white mb-2">Merge k Sorted Lists</h3>
                            <p className="text-slate-400 text-sm mb-6 flex-1">You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.</p>
                            <div className="bg-black/50 rounded p-4 border border-white/10 font-mono text-[11px] text-[#0EA5E9] opacity-80">
                                <span className="text-[#8B5CF6]">class</span> <span className="text-white">Solution</span>:<br />
                                &nbsp;&nbsp;<span className="text-[#8B5CF6]">def</span> <span className="text-blue-400">mergeKLists</span>(self, lists):<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-slate-500"># Focus mode activated</span><br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#8B5CF6]">pass</span>
                            </div>
                        </div>
                    </div>

                    {/* Center Content */}
                    <div className="flex flex-col items-center text-center col-span-1 lg:col-span-1 z-20 animate-[slideUp_1s_ease-out_both] opacity-0" style={{ animationDelay: '0.1s' }}>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                            <span className="w-2 h-2 rounded-full bg-[#6366F1] animate-pulse"></span>
                            <span className="text-xs font-medium text-slate-300 tracking-wide uppercase">Deep Focus Environment</span>
                        </div>
                        <h1 className="font-display text-[48px] md:text-[64px] font-bold leading-[1.1] tracking-[-0.02em] text-white mb-6">
                            Master the<br />Technical Interview
                        </h1>
                        <p className="text-slate-400 text-base md:text-lg max-w-[480px] mb-10 leading-relaxed">
                            Immersive AI and peer-to-peer mock interviews in a hyper-modern, distraction-free environment. Stay locked in flow state.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <button
                                onClick={() => navigate(isAuthenticated ? '/explore' : '/login')}
                                className="w-full sm:w-auto bg-[#6366F1] hover:bg-[#6366F1]/90 text-white font-bold h-12 px-8 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] transition-all flex items-center justify-center gap-2"
                            >
                                Enter Workspace
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Card */}
                    <div className="hidden lg:flex justify-start items-center relative animate-[slideUp_1s_ease-out_both] opacity-0" style={{ animationDelay: '0.3s' }}>
                        <div className="glass-card glass-card-right flex flex-col p-6">
                            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#8B5CF6] text-sm">group</span>
                                    <span className="font-mono text-xs text-slate-300 uppercase tracking-wider">Live Interview</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">00:14:23</span>
                                </div>
                            </div>
                            <div className="flex gap-3 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-black/50 border border-white/10 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[#6366F1]/20 to-transparent"></div>
                                    <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400">person</span>
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-black/50 border border-[#6366F1]/50 shadow-[0_0_10px_rgba(99,102,241,0.2)] overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[#0EA5E9]/20 to-transparent"></div>
                                    <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white">smart_toy</span>
                                </div>
                            </div>
                            <h3 className="font-display text-lg font-bold text-white mb-2">System Design: Rate Limiter</h3>
                            <p className="text-slate-400 text-sm mb-6 flex-1">Design a scalable rate limiter for a distributed API gateway handling 10M requests/sec.</p>
                            <div className="h-20 w-full bg-black/50 border border-white/10 rounded flex items-center justify-center relative overflow-hidden">
                                {/* Abstract Waveform */}
                                <div className="flex items-center gap-1 opacity-70">
                                    <div className="w-1 h-4 bg-[#0EA5E9] rounded-full"></div>
                                    <div className="w-1 h-8 bg-[#0EA5E9] rounded-full"></div>
                                    <div className="w-1 h-3 bg-[#0EA5E9] rounded-full"></div>
                                    <div className="w-1 h-6 bg-[#0EA5E9] rounded-full"></div>
                                    <div className="w-1 h-2 bg-[#0EA5E9] rounded-full"></div>
                                    <div className="w-1 h-7 bg-[#0EA5E9] rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            

            {/* Footer Overlay */}
            <footer className="fixed bottom-0 w-full p-6 flex justify-between items-center z-40 pointer-events-none">
                <div className="text-slate-500 text-xs font-mono tracking-wider pointer-events-auto">
                    SYS.STATUS <span className="text-green-400 ml-2">● ONLINE</span>
                </div>
                <div className="flex gap-4 pointer-events-auto">
                    <a className="text-slate-500 hover:text-white transition-colors" href="#">
                        <span className="material-symbols-outlined text-xl">terminal</span>
                    </a>
                    <a className="text-slate-500 hover:text-white transition-colors" href="#">
                        <span className="material-symbols-outlined text-xl">data_object</span>
                    </a>
                </div>
            </footer>
        </div>
    );
};

export default Home;
