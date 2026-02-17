import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Line, Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    RadialLinearScale,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    Title, 
    Tooltip, 
    Legend,
    RadialLinearScale,
    Filler
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await axiosClient.get('/user/dashboard');
                setStats(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
                setError("Failed to load dashboard data");
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050f11] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#0dccf2] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="min-h-screen bg-[#050f11] flex items-center justify-center text-red-500">
                {error || "No data available"}
            </div>
        );
    }

    const { user, stats: userStats } = stats;
    
    // Prepare Chart Data
    // Heatmap data to Line chart (just for visualization as per design)
    // The design had a smooth curve. We can use the heatmap data keys/values.
    
    // Sort dates
    const sortedDates = Object.keys(userStats.heatmapData).sort();
    const chartLabels = sortedDates.slice(-30); // Last 30 active days or just last 30 entries
    const chartDataPoints = chartLabels.map(date => userStats.heatmapData[date]);

    const performanceData = {
        labels: chartLabels.length > 0 ? chartLabels : ['No Data'],
        datasets: [
            {
                label: 'Submissions',
                data: chartDataPoints.length > 0 ? chartDataPoints : [0],
                borderColor: '#0dccf2',
                backgroundColor: 'rgba(13, 204, 242, 0.2)',
                tension: 0.4,
                fill: true,
            }
        ]
    };

    const performanceOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: false }
        },
        scales: {
            x: { display: false },
            y: { display: false }
        },
        maintainAspectRatio: false
    };

    // Language Stats for Radar Chart
    const languages = Object.keys(userStats.languageStats);
    const languageCounts = Object.values(userStats.languageStats);
    
    const radarData = {
        labels: languages.length > 0 ? languages : ['Start Coding'],
        datasets: [
            {
                label: 'Submissions',
                data: languageCounts.length > 0 ? languageCounts : [0],
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: '#10b981',
                borderWidth: 2,
            },
        ],
    };

    const radarOptions = {
        scales: {
            r: {
                angleLines: { color: 'rgba(13, 204, 242, 0.1)' },
                grid: { color: 'rgba(13, 204, 242, 0.1)' },
                pointLabels: { color: '#94a3b8', font: { size: 10, weight: 'bold' } },
                ticks: { display: false }
            }
        },
        plugins: { legend: { display: false } },
        maintainAspectRatio: false
    };

    // Contribution Heatmap (Simplified visualization)
    // We'll create a 52-week grid (approx) or just show last N days
    const contributionLevels = (count) => {
        if (count === 0) return 'bg-white/5';
        if (count <= 2) return 'bg-emerald-500/20';
        if (count <= 5) return 'bg-emerald-500/40';
        if (count <= 8) return 'bg-emerald-500/70';
        return 'bg-emerald-500';
    };

    // Generate last 364 days (52 weeks * 7 days)
    const heatmapGrid = [];
    const today = new Date();
    for (let i = 0; i < 364; i++) {
        const d = new Date();
        d.setDate(today.getDate() - (363 - i)); // Shift so today is last
        const dateStr = d.toISOString().split('T')[0];
        const count = userStats.heatmapData[dateStr] || 0;
        heatmapGrid.push({ date: dateStr, count });
    }
    
    // Group into 52 weeks
    const weeks = [];
    for (let i = 0; i < heatmapGrid.length; i += 7) {
        weeks.push(heatmapGrid.slice(i, i + 7));
    }
    
    // Ensure we have exactly 52 weeks or close
    
    return (
        <div className="bg-[#050f11] font-mono text-slate-300 min-h-screen relative overflow-x-hidden selection:bg-[#0dccf2]/30">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(13,204,242,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(13,204,242,0.02)_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]"></div>
                <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-full h-[30%] bg-[#0dccf2]/5 blur-[120px] rounded-full"></div>
                <div className="absolute top-[20%] left-[10%] w-32 h-32 bg-[#0dccf2]/5 rounded-full blur-[60px]"></div>
                <div className="absolute top-[60%] right-[15%] w-48 h-48 bg-[#10b981]/5 rounded-full blur-[80px]"></div>
            </div>

            {/* Navigation */}
            <Navbar />

            <main className="pt-8 pb-12 px-6 max-w-7xl mx-auto grid grid-cols-12 gap-6 relative">
                {/* --- Sidebar Profile --- */}
                <aside className="col-span-12 lg:col-span-3 space-y-6">
                    <div className="bg-[#0a1a1d]/60 backdrop-blur-xl border border-[#0dccf2]/10 shadow-xl rounded-2xl p-6 flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0dccf2] to-[#10b981] p-[1px]">
                                <div className="w-full h-full rounded-2xl bg-[#0a1a1d] flex items-center justify-center overflow-hidden">
                                    <span className="material-symbols-outlined text-5xl text-[#0dccf2]/50">account_circle</span>
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-[#10b981] text-[#050f11] text-[10px] font-bold px-2 py-0.5 rounded shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                                {user.role === 'admin' ? 'ADMIN' : 'PRO'}
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight uppercase">{user.firstName} {user.lastName}</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{user.role === 'admin' ? 'System Administrator' : 'Developer'}</p>
                        
                        <div className="w-full h-px bg-white/5 my-6"></div>
                        
                        <div className="grid grid-cols-2 gap-4 w-full mb-6">
                            <div className="text-left">
                                <div className="text-[9px] uppercase tracking-widest text-slate-500">Global Rank</div>
                                <div className="text-lg font-bold text-[#0dccf2]">#{user.rank}</div>
                            </div>
                            <div className="text-left">
                                <div className="text-[9px] uppercase tracking-widest text-slate-500">Points</div>
                                <div className="text-lg font-bold text-white">{user.points}</div>
                            </div>
                        </div>

                        {user.role === 'admin' && (
                             <div className="w-full mb-4">
                                <Link to="/admin" className="block w-full py-2 bg-[#0dccf2]/10 border border-[#0dccf2]/30 text-[#0dccf2] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#0dccf2]/20 transition-all text-center">
                                    Access Admin Panel
                                </Link>
                             </div>
                        )}

                        <div className="flex flex-col w-full space-y-3">
                            <div className="flex items-center space-x-3 text-xs text-slate-400 bg-white/5 p-2 rounded-lg border border-white/5">
                                <span className="material-symbols-outlined text-sm">alternate_email</span>
                                <span className="truncate">{user.emailId}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* --- Main Content --- */}
                <div className="col-span-12 lg:col-span-9 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Solved Problems */}
                        <div className="bg-[#0a1a1d]/60 backdrop-blur-xl border border-[#0dccf2]/10 shadow-xl p-5 rounded-2xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Solved Problems</div>
                                    <div className="text-3xl font-bold text-white">{user.solvedCount}</div>
                                </div>
                                <div className="p-2 bg-[#0dccf2]/10 rounded-lg text-[#0dccf2]">
                                    <span className="material-symbols-outlined">task_alt</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center space-x-2">
                                <span className="text-[#10b981] text-[10px] font-bold">Total Attempts: {userStats.totalSubmissions}</span>
                                <div className="w-20 h-px bg-white/10"></div>
                            </div>
                        </div>

                        {/* Current Streak */}
                        <div className="bg-[#0a1a1d]/60 backdrop-blur-xl border border-[#0dccf2]/10 shadow-xl p-5 rounded-2xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Current Streak</div>
                                    <div className="text-3xl font-bold text-white">{userStats.currentStreak} <span className="text-sm font-normal text-slate-500 uppercase tracking-widest">Days</span></div>
                                </div>
                                <div className="p-2 bg-[#10b981]/10 rounded-lg text-[#10b981]">
                                    <span className="material-symbols-outlined">bolt</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center space-x-2">
                                <span className="text-[#0dccf2] text-[10px] font-bold">Keep it up!</span>
                                <div className="w-20 h-px bg-white/10"></div>
                            </div>
                        </div>

                        {/* Acceptance Rate */}
                        <div className="bg-[#0a1a1d]/60 backdrop-blur-xl border border-[#0dccf2]/10 shadow-xl p-5 rounded-2xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Acceptance Rate</div>
                                    <div className="text-3xl font-bold text-white">{userStats.acceptanceRate}<span className="text-sm font-normal text-slate-500">%</span></div>
                                </div>
                                <div className="p-2 bg-[#0dccf2]/10 rounded-lg text-[#0dccf2]">
                                    <span className="material-symbols-outlined">analytics</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center space-x-2">
                                <span className="text-[#10b981] text-[10px] font-bold">Strict Validation</span>
                                <div className="w-20 h-px bg-white/10"></div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Performance Chart */}
                        <div className="bg-[#0a1a1d]/60 backdrop-blur-xl border border-[#0dccf2]/10 shadow-xl rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Performance (Last 30 Days)</h3>
                            </div>
                            <div className="h-48 relative w-full">
                                <Line data={performanceData} options={performanceOptions} />
                            </div>
                        </div>

                        {/* Language Radar */}
                        <div className="bg-[#0a1a1d]/60 backdrop-blur-xl border border-[#0dccf2]/10 shadow-xl rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Language Proficiency</h3>
                            </div>
                            <div className="h-52 w-full flex items-center justify-center">
                                {languages.length > 0 ? (
                                    <Radar data={radarData} options={radarOptions} />
                                ) : (
                                    <div className="text-slate-500 text-xs">No language data yet</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Heatmap */}
                    <div className="bg-[#0a1a1d]/60 backdrop-blur-xl border border-[#0dccf2]/10 shadow-xl rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Yearly Contribution</h3>
                            <div className="flex items-center space-x-2">
                                <span className="text-[9px] text-slate-500 uppercase">Less</span>
                                <div className="flex space-x-1">
                                    <div className="w-3 h-3 rounded-sm bg-white/5"></div>
                                    <div className="w-3 h-3 rounded-sm bg-emerald-500/20"></div>
                                    <div className="w-3 h-3 rounded-sm bg-emerald-500/40"></div>
                                    <div className="w-3 h-3 rounded-sm bg-emerald-500/70"></div>
                                    <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                                </div>
                                <span className="text-[9px] text-slate-500 uppercase">More</span>
                            </div>
                        </div>
                        
                        <div className="flex overflow-x-auto pb-4 gap-1">
                            {weeks.map((week, wIdx) => (
                                <div key={wIdx} className="flex flex-col gap-1">
                                    {week.map((day, dIdx) => (
                                        <div 
                                            key={`${wIdx}-${dIdx}`}
                                            title={`${day.date}: ${day.count} submissions`}
                                            className={`w-3 h-3 rounded-sm ${contributionLevels(day.count)} transition-all hover:scale-110`}
                                        ></div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-[10px] text-slate-500 uppercase tracking-widest text-center">
                            Total of <span className="text-white">{userStats.totalSubmissions} attempts</span> in the last year
                        </div>
                    </div>

                    {/* Admin Only Section Example */}
                    {user.role === 'admin' && (
                        <div className="bg-red-900/10 border border-red-500/20 rounded-2xl p-6">
                             <h3 className="text-lg font-bold text-red-400 mb-2">SYSTEM ALERTS</h3>
                             <p className="text-sm text-red-200/60">System status is stable. 3 pending reports requiring attention.</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Dashboard;
