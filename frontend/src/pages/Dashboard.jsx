import React, { useEffect, useState, useMemo } from 'react';
import axiosClient from '../utils/axiosClient';
<<<<<<< HEAD
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../app/features/auth/authSlice';
=======
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
    PieChart, Pie, Cell,
    ResponsiveContainer, Tooltip,
} from 'recharts';
<<<<<<< HEAD
import { toast } from 'react-hot-toast';
=======
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1


/* ── helpers ──────────────────────────────────────── */
const DIFFICULTY_COLOR = { easy: 'text-emerald-400', medium: 'text-amber-400', hard: 'text-rose-400' };
const DIFFICULTY_BAR   = { easy: 'bg-emerald-500', medium: 'bg-amber-500', hard: 'bg-rose-500' };

const heatLevel = (count) => {
    if (count === 0) return 'border border-slate-600/60';
    if (count <= 2)  return 'bg-blue-900/50 border border-blue-800/40';
    if (count <= 5)  return 'bg-blue-700/70 border border-blue-600/40';
    if (count <= 8)  return 'bg-blue-500   border border-blue-400/40';
    return 'bg-[#135bec] border border-blue-400/60';
};


const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Mon','','Wed','','Fri','','Sun'];

/* ─────────────────────────────────────────────────── */
const Dashboard = () => {
    const { user: authUser } = useSelector(s => s.auth);
<<<<<<< HEAD
    const dispatch = useDispatch();
    const navigate = useNavigate();
=======
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
    const [stats, setStats]   = useState(null);
    const [solved, setSolved] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState(null);

<<<<<<< HEAD
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({ firstName: '', lastName: '', password: '' });

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Updating profile...');
        try {
            const payload = { ...editData };
            if (!payload.password) delete payload.password; 
            
            await axiosClient.patch('/user/updateProfile', payload);
            toast.success('Profile updated successfully!', { id: toastId });
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile', { id: toastId });
        }
    };

    const handleDeleteProfile = async () => {
        if (!window.confirm("Are you sure you want to delete your profile? This action cannot be undone and all your submissions will be lost.")) {
            return;
        }
        
        const toastId = toast.loading('Deleting profile...');
        try {
            await axiosClient.delete('/user/deleteProfile');
            toast.success('Profile deleted successfully! We will miss you.', { id: toastId });
            dispatch(logoutUser());
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete profile', { id: toastId });
        }
    };

=======
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
    useEffect(() => {
        const load = async () => {
            try {
                const [dashRes, solvedRes] = await Promise.all([
                    axiosClient.get('/user/dashboard'),
                    axiosClient.get('/problem/problemSolvedByUser').catch(() => ({ data: { user: [] } })),
                ]);
                setStats(dashRes.data);
                setSolved(solvedRes.data?.user || []);
            } catch (err) {
                console.error(err);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    /* ── heatmap grid (52 weeks × 7 days) ──────── */
    const { weeks, totalSubmissions } = useMemo(() => {
        if (!stats) return { weeks: [], totalSubmissions: 0 };
        const hm = stats.stats?.heatmapData || {};
        const grid = [];
        const today = new Date();
        for (let i = 363; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = d.toISOString().split('T')[0];
            grid.push({ date: key, count: hm[key] || 0 });
        }
        const w = [];
        for (let i = 0; i < grid.length; i += 7) w.push(grid.slice(i, i + 7));
        const total = Object.values(hm).reduce((a, b) => a + b, 0);
        return { weeks: w, totalSubmissions: total };
    }, [stats]);

    /* ── pie data for language chart ───────────── */
    const langPieData = useMemo(() => {
        if (!stats) return [];
        const ls = stats.stats?.languageStats || {};
        const LABEL = {
            cpp: 'C++', 'c++': 'C++', cplusplus: 'C++',
            js: 'JavaScript', javascript: 'JavaScript',
            py: 'Python', python: 'Python',
            java: 'Java', ts: 'TypeScript', typescript: 'TypeScript',
        };
        // merge by normalised name
        const merged = {};
        Object.entries(ls).forEach(([lang, count]) => {
            const key = LABEL[lang.toLowerCase()] || lang;
            merged[key] = (merged[key] || 0) + count;
        });
        const COLORS = ['#135bec','#8b5cf6','#06b6d4','#f59e0b','#10b981','#f43f5e','#a3e635'];
        return Object.entries(merged).map(([lang, count], i) => ({
            lang, count, color: COLORS[i % COLORS.length]
        }));
    }, [stats]);

    /* ── difficulty breakdown from solved problems ── */
    const { easyCount, medCount, hardCount } = useMemo(() => {
        return {
            easyCount: solved.filter(p => p.difficulty === 'easy').length,
            medCount:  solved.filter(p => p.difficulty === 'medium').length,
            hardCount: solved.filter(p => p.difficulty === 'hard').length,
        };
    }, [solved]);


    /* ── guards ─────────────────────────────────── */
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-[#135bec] border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm font-mono uppercase tracking-widest">Loading…</p>
            </div>
        </div>
    );

    if (error || !stats) return (
        <div className="min-h-screen flex items-center justify-center text-red-400" style={{ background: '#0f172a' }}>
            {error || 'No data available'}
        </div>
    );

    const { user, stats: userStats } = stats;
    const solvedTotal = user.solvedCount || 0;
    const maxDiff = Math.max(easyCount, medCount, hardCount, 1);
    const initials = (user.firstName || authUser?.firstName || 'U').slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen flex flex-col text-slate-100" style={{ background: '#0f172a', fontFamily: "'Space Grotesk', sans-serif" }}>
            <Navbar />

            <main className="flex-1 flex justify-center py-8 px-4 sm:px-8">
                <div className="w-full max-w-[1200px] flex flex-col gap-6">

                    {/* ── Profile Header Card ─────────────────────── */}
                    <section className="bg-[#1e293b] rounded-xl p-6 border border-slate-800 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left w-full">
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#135bec] to-purple-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-[#0f172a]">
                                        {initials}
                                    </div>
                                    {user.role === 'admin' && (
                                        <div className="absolute bottom-1 right-1 bg-[#135bec] rounded-full p-1 border-2 border-[#0f172a]">
                                            <span className="material-symbols-outlined text-white text-[16px]">verified</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex flex-col justify-center gap-2 flex-1">
                                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3">
                                        <h1 className="text-3xl font-bold tracking-tight leading-tight">
                                            {user.firstName}{user.lastName ? ` ${user.lastName}` : ''}
                                        </h1>
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#135bec]/20 text-[#135bec] border border-[#135bec]/30 mb-0 sm:mb-1.5 uppercase tracking-wide">
                                            {user.role === 'admin' ? 'Admin' : 'Developer'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-400 text-sm flex-wrap justify-center sm:justify-start">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">alternate_email</span>
                                            {user.emailId}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">leaderboard</span>
                                            Rank #{user.rank || '—'}
                                        </span>
                                        {user.points !== undefined && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">star</span>
                                                {user.points} pts
                                            </span>
                                        )}
                                    </div>
                                    {/* Language badges */}
                                    {langPieData.length > 0 && (
                                        <div className="flex gap-2 mt-2 flex-wrap justify-center sm:justify-start">
                                            {langPieData.map(({ lang }) => (
                                                <span key={lang} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 text-xs text-slate-400 border border-slate-700 capitalize">
                                                    <span className="material-symbols-outlined text-[14px] text-[#135bec]">code</span>
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0 shrink-0">
                                {user.role === 'admin' && (
                                    <Link to="/admin"
                                        className="flex-1 md:flex-none h-10 px-5 rounded-lg bg-[#135bec] hover:bg-blue-600 text-white text-sm font-bold tracking-wide transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                                        Admin Panel
                                    </Link>
                                )}
<<<<<<< HEAD
                                <button onClick={() => {
                                    setEditData({ firstName: user.firstName || '', lastName: user.lastName || '', password: '' });
                                    setIsEditModalOpen(true);
                                }} className="flex-1 md:flex-none h-10 px-4 rounded-lg bg-[#135bec] hover:bg-blue-600 shadow-lg shadow-blue-500/25 text-white border border-transparent text-sm font-bold transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                    Edit Profile
                                </button>
=======
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
                                <button className="flex-1 md:flex-none h-10 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 text-sm font-bold transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">share</span>
                                    Share
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* ── Stats Grid ──────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* Streak */}
                        <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <span className="material-symbols-outlined text-[120px]">local_fire_department</span>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Current Streak</p>
                                    <span className="material-symbols-outlined text-orange-500 text-[24px]">local_fire_department</span>
                                </div>
                                <p className="text-4xl font-bold text-white mb-1">
                                    {userStats.currentStreak ?? 0} <span className="text-lg font-medium text-slate-400">Days</span>
                                </p>
                            </div>
                            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 w-fit px-2 py-1 rounded">
                                <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span>
                                Keep it up!
                            </div>
                        </div>

                        {/* Global Rank */}
                        <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <span className="material-symbols-outlined text-[120px]">public</span>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Global Rank</p>
                                    <span className="material-symbols-outlined text-[#135bec] text-[24px]">public</span>
                                </div>
                                <p className="text-4xl font-bold text-white mb-1">#{user.rank || '—'}</p>
                            </div>
                            <div className="mt-4 text-xs font-semibold text-slate-400">
                                {user.points || 0} total points
                            </div>
                        </div>

                        {/* Total Solved */}
                        <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <span className="material-symbols-outlined text-[120px]">check_circle</span>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Solved</p>
                                    <span className="material-symbols-outlined text-purple-400 text-[24px]">check_circle</span>
                                </div>
                                <p className="text-4xl font-bold text-white mb-1">{solvedTotal}</p>
                            </div>
                            <div className="mt-4 text-xs font-semibold text-slate-400">
                                <span className="text-emerald-400 mr-1">{userStats.totalSubmissions || 0}</span> total submissions
                            </div>
                        </div>

                        {/* Difficulty Breakdown */}
                        <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-800 flex flex-col">
                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">Difficulty</p>
                            <div className="flex flex-col gap-3 flex-1 justify-center">
                                {[
                                    { label: 'Easy',   count: easyCount, cls: 'text-emerald-400', bar: 'bg-emerald-500' },
                                    { label: 'Medium', count: medCount,  cls: 'text-amber-400',   bar: 'bg-amber-500'   },
                                    { label: 'Hard',   count: hardCount, cls: 'text-rose-400',    bar: 'bg-rose-500'    },
                                ].map(({ label, count, cls, bar }) => (
                                    <div key={label} className="flex flex-col gap-1">
                                        <div className={`flex justify-between text-xs font-bold ${cls}`}>
                                            <span>{label}</span><span>{count}</span>
                                        </div>
                                        <div className="w-full bg-slate-900 rounded-full h-2">
                                            <div className={`${bar} h-2 rounded-full transition-all duration-700`}
                                                style={{ width: `${Math.round((count / maxDiff) * 100)}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Activity Heatmap ────────────────────────── */}
                    <section className="bg-[#1e293b] rounded-xl p-6 border border-slate-800">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white">Submission History</h3>
                                <p className="text-slate-400 text-sm">{totalSubmissions} submissions in the last year</p>
                            </div>
                        </div>
                        <div className="w-full overflow-x-auto pb-2">
                            <div style={{ minWidth: 700 }} className="flex flex-col gap-1">
                                <div className="flex gap-1 h-28">
                                    {/* Day labels */}
                                    <div className="flex flex-col justify-between pr-2 py-0.5 text-[10px] text-slate-500 font-medium shrink-0">
                                        {DAYS.map((d, i) => <span key={i}>{d}</span>)}
                                    </div>
                                    {/* Week columns */}
                                    <div className="flex-1 flex gap-[3px]">
                                        {weeks.map((week, wIdx) => (
                                            <div key={wIdx} className="flex flex-col gap-[3px] flex-1">
                                                {week.map((day, dIdx) => (
                                                    <div key={dIdx}
                                                        title={`${day.date}: ${day.count} submission${day.count !== 1 ? 's' : ''}`}
                                                        className={`flex-1 rounded-sm ${heatLevel(day.count)} hover:ring-1 ring-white/30 transition-all cursor-pointer`}
                                                    />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Month labels */}
                                <div className="flex justify-between pl-8 text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                                    {MONTHS.map(m => <span key={m}>{m}</span>)}
                                </div>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-slate-500">
                            <span>Less</span>
                            {['bg-slate-800','bg-blue-900/40','bg-blue-700/60','bg-blue-600','bg-[#135bec]'].map((cls,i) => (
                                <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
                            ))}
                            <span>More</span>
                        </div>
                    </section>

                    {/* ── Bottom Row: Recent Solved + Badges/Language ── */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Recent Solved Problems */}
                        <div className="lg:col-span-2 bg-[#1e293b] rounded-xl p-6 border border-slate-800">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">Solved Problems</h3>
                                <Link to="/" className="text-[#135bec] text-sm font-medium hover:underline">View All</Link>
                            </div>
                            <div className="flex flex-col gap-3">
                                {solved.length === 0 ? (
                                    <div className="text-slate-500 text-sm py-6 text-center">
                                        No problems solved yet. <Link to="/" className="text-[#135bec] hover:underline">Start solving →</Link>
                                    </div>
                                ) : (
                                    solved.slice(0, 6).map((p, i) => (
                                        <Link key={p._id || i} to={`/problems/${p._id}`}
                                            className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 hover:bg-slate-700/40 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                                    <span className="material-symbols-outlined text-[20px]">check</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-white group-hover:text-[#135bec] transition-colors">{p.title}</p>
                                                    <p className="text-xs text-slate-500 capitalize">{p.difficulty} · {(p.tags || []).slice(0, 2).join(', ')}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded border capitalize
                                                ${p.difficulty === 'easy'   ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                  p.difficulty === 'medium' ? 'bg-amber-500/10  text-amber-400  border-amber-500/20'  :
                                                                              'bg-rose-500/10   text-rose-400   border-rose-500/20'}`}>
                                                {p.difficulty}
                                            </span>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Language Proficiency + Badges */}
                        <div className="flex flex-col gap-6">
                            {/* Language Donut */}
                            <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-800 flex-1">
                                <h3 className="text-lg font-bold text-white mb-4">Language Stats</h3>
                                {langPieData.length > 0 ? (
                                    <div className="flex flex-col gap-4">
                                        <ResponsiveContainer width="100%" height={160}>
                                            <PieChart>
                                                <Pie
                                                    data={langPieData} dataKey="count" nameKey="lang"
                                                    cx="50%" cy="50%"
                                                    innerRadius={45} outerRadius={70}
                                                    paddingAngle={3}
                                                >
                                                    {langPieData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                                                    formatter={(val, name) => [`${val} submissions`, name]}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Legend */}
                                        <div className="flex flex-col gap-1.5">
                                            {langPieData.map(({ lang, count, color }) => (
                                                <div key={lang} className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                                                        <span className="text-slate-300 capitalize font-medium">{lang}</span>
                                                    </div>
                                                    <span className="text-slate-500">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[180px] flex items-center justify-center text-slate-500 text-sm">Solve problems to see language data</div>
                                )}
                            </div>

                            {/* Badges */}
                            <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-800">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white">Badges</h3>
                                    <span className="text-slate-500 text-xs">Coming soon</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { icon: 'emoji_events', label: 'Contest Win', color: 'text-amber-400',  earned: false },
                                        { icon: 'code',         label: '100 Solved',  color: 'text-blue-400',   earned: solvedTotal >= 100 },
                                        { icon: 'terminal',     label: 'Algo Expert', color: 'text-purple-400', earned: false },
                                        { icon: 'bolt',         label: '30-Day',      color: 'text-emerald-400',earned: (userStats.currentStreak ?? 0) >= 30 },
                                        { icon: 'workspace_premium', label: 'Guardian', color: 'text-slate-400', earned: false },
                                        { icon: 'school',       label: 'Mentor',      color: 'text-slate-400',  earned: false },
                                    ].map(({ icon, label, color, earned }) => (
                                        <div key={label}
                                            className={`aspect-square rounded-lg bg-slate-900/60 flex flex-col items-center justify-center p-2 text-center border cursor-pointer transition-all
                                                ${earned
                                                    ? 'border-slate-700 hover:border-slate-600 hover:bg-slate-700/40'
                                                    : 'border-transparent opacity-40 grayscale'}`}
                                        >
                                            <div className={`mb-1 ${earned ? color : 'text-slate-400'}`}>
                                                <span className="material-symbols-outlined text-[30px]">{icon}</span>
                                            </div>
                                            <p className="text-[10px] font-bold leading-tight text-white">{label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Admin section */}
                    {authUser?.role === 'admin' && (
                        <section className="bg-red-900/10 border border-red-500/20 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                                System Alerts
                            </h3>
                            <p className="text-sm text-red-200/60">System status is stable. Visit the Admin Panel to manage problems.</p>
                            <Link to="/admin" className="inline-flex items-center gap-2 mt-3 text-sm text-red-400 hover:text-red-300 font-semibold transition-colors">
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                Go to Admin Panel
                            </Link>
                        </section>
                    )}

                </div>
            </main>

<<<<<<< HEAD
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Edit Profile</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-6 flex flex-col gap-4 text-left">
                            <div className="flex gap-4 flex-col sm:flex-row">
                                <div className="flex-1 flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">First Name</label>
                                    <input type="text" 
                                        className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#135bec] transition-colors"
                                        value={editData.firstName} onChange={e => setEditData({...editData, firstName: e.target.value})} required />
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Last Name</label>
                                    <input type="text" 
                                        className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#135bec] transition-colors"
                                        value={editData.lastName} onChange={e => setEditData({...editData, lastName: e.target.value})} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">New Password</label>
                                <input type="password" placeholder="Leave blank to keep same"
                                    className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#135bec] transition-colors"
                                    value={editData.password} onChange={e => setEditData({...editData, password: e.target.value})} />
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                                <button type="button" onClick={handleDeleteProfile} className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wide">
                                    Delete Account
                                </button>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-5 py-2 rounded-lg text-sm font-bold bg-[#135bec] hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all">
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

=======
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
            <Footer />
        </div>
    );
};

export default Dashboard;
