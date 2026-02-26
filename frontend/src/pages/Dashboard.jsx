import React, { useEffect, useState, useMemo } from 'react';
import axiosClient from '../utils/axiosClient';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../app/features/auth/authSlice';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'react-hot-toast';

/* ── helpers ──────────────────────────────────────── */
const heatLevel = (count) => {
    if (count === 0) return 'bg-slate-100';
    if (count <= 2)  return 'bg-green-200';
    if (count <= 5)  return 'bg-green-400';
    if (count <= 8)  return 'bg-green-600';
    return 'bg-green-800';
};

/* ─────────────────────────────────────────────────── */
const Dashboard = () => {
    const { user: authUser } = useSelector(s => s.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [stats, setStats]   = useState(null);
    const [solved, setSolved] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState(null);

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

    const { flatDays, totalSubmissions } = useMemo(() => {
        if (!stats) return { flatDays: [], totalSubmissions: 0 };
        const hm = stats.stats?.heatmapData || {};
        const grid = [];
        const today = new Date();
        for (let i = 363; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = d.toISOString().split('T')[0];
            grid.push({ date: key, count: hm[key] || 0 });
        }
        const total = Object.values(hm).reduce((a, b) => a + b, 0);
        return { flatDays: grid, totalSubmissions: total };
    }, [stats]);

    const { easyCount, medCount, hardCount } = useMemo(() => {
        return {
            easyCount: solved.filter(p => p.difficulty === 'easy').length,
            medCount:  solved.filter(p => p.difficulty === 'medium').length,
            hardCount: solved.filter(p => p.difficulty === 'hard').length,
        };
    }, [solved]);


    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-sm font-mono uppercase tracking-widest">Loading…</p>
            </div>
        </div>
    );

    if (error || !stats) return (
        <div className="min-h-screen flex items-center justify-center text-red-500 bg-slate-50">
            {error || 'No data available'}
        </div>
    );

    const { user, stats: userStats } = stats;
    const solvedTotal = user.solvedCount || 0;
    const initials = (user.firstName || authUser?.firstName || 'U').slice(0, 2).toUpperCase();

    // Pie math
    const pieTotal = Math.max(1, easyCount + medCount + hardCount);
    const easyPct = (easyCount / pieTotal) * 100;
    const medPct = (medCount / pieTotal) * 100;
    const hardPct = (hardCount / pieTotal) * 100;

    return (
        <div className="bg-slate-50 text-slate-900 font-display min-h-screen flex flex-col overflow-x-hidden">
            <style>{`
                ::-webkit-scrollbar { width: 8px; height: 8px; }
                ::-webkit-scrollbar-track { background: #f1f5f9; }
                ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                .heatmap-grid {
                    display: grid;
                    grid-template-rows: repeat(7, 1fr);
                    grid-template-columns: repeat(52, 12px);
                    grid-auto-flow: column;
                    gap: 4px;
                }
            `}</style>
            
            <Navbar />

            <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
                    <p className="text-slate-500">Welcome back, {user.firstName || authUser?.firstName}! Here's what's happening with your projects today.</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative group cursor-pointer mb-4">
                                    <div className="size-28 flex items-center justify-center rounded-full bg-green-500 text-white font-bold text-4xl border-4 border-slate-50 object-cover shadow-sm">
                                        {initials}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                                        setEditData({ firstName: user.firstName || '', lastName: user.lastName || '', password: '' });
                                        setIsEditModalOpen(true);
                                    }}>
                                        <span className="material-symbols-outlined text-white">edit</span>
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">{user.firstName} {user.lastName}</h2>
                                <p className="text-sm text-slate-500 mb-2">{user.emailId}</p>
                                <p className="text-sm font-bold text-green-600 mb-4 px-3 py-1 bg-green-50 rounded-full inline-block border border-green-200">
                                    <span className="material-symbols-outlined text-[14px] align-middle mr-1">toll</span>
                                    {user.tokens !== undefined ? user.tokens : authUser?.tokens || 0} AI Tokens
                                </p>
                                <p className="text-sm text-slate-600 mb-6 max-w-[240px]">
                                    {user.role === 'admin' ? 'Platform Administrator' : 'Software Developer and Enthusiast'}
                                </p>
                                <div className="flex gap-3 w-full mb-6">
                                    <a className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-50 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors border border-slate-200" href="#">
                                        <span className="material-symbols-outlined text-[18px]">code</span>
                                        GitHub
                                    </a>
                                    <a className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-50 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors border border-slate-200" href="#">
                                        <span className="material-symbols-outlined text-[18px]">work</span>
                                        LinkedIn
                                    </a>
                                </div>
                                <button onClick={() => {
                                    setEditData({ firstName: user.firstName || '', lastName: user.lastName || '', password: '' });
                                    setIsEditModalOpen(true);
                                }} className="w-full py-2.5 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/20">
                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                    Edit Profile
                                </button>
                                {user.role === 'admin' && (
                                    <button onClick={() => navigate('/admin')} className="w-full mt-3 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-500/20">
                                        <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                                        Admin Panel
                                    </button>
                                )}
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-slate-200">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Skills & Languages</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(userStats?.languageStats || {}).length > 0 ? (
                                        Object.keys(userStats.languageStats).map((lang, index) => (
                                            <span key={index} className="px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium border border-green-100 uppercase">{lang}</span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-slate-500">No skills yet</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-600">groups</span>
                                Community Stats
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Total Points</span>
                                    <span className="text-sm font-medium text-slate-900">{user.points || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Total Submissions</span>
                                    <span className="text-sm font-medium text-slate-900">{totalSubmissions}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Account Type</span>
                                    <span className="text-sm font-medium text-slate-900 capitalize">{user.role || 'Member'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Global Rank</span>
                                    <span className="text-sm font-medium text-slate-900">Top #{user.rank || '—'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between h-32 hover:border-green-600/50 transition-colors cursor-default">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-medium text-slate-500">Solved</span>
                                    <span className="material-symbols-outlined text-green-600">check_circle</span>
                                </div>
                                <div>
                                    <span className="text-2xl font-bold text-slate-900 block">{solvedTotal}</span>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between h-32 hover:border-orange-200 transition-colors cursor-default">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-medium text-slate-500">Streak</span>
                                    <span className="material-symbols-outlined text-orange-500">local_fire_department</span>
                                </div>
                                <div>
                                    <span className="text-2xl font-bold text-slate-900 block">{userStats.currentStreak ?? 0}</span>
                                    <span className="text-xs font-medium text-slate-500 mt-1">Days active</span>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between h-32 hover:border-yellow-200 transition-colors cursor-default">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-medium text-slate-500">Rank</span>
                                    <span className="material-symbols-outlined text-yellow-500">emoji_events</span>
                                </div>
                                <div>
                                    <span className="text-2xl font-bold text-slate-900 block">#{user.rank || '—'}</span>
                                    <span className="text-xs font-medium text-green-600 flex items-center gap-0.5 mt-1">
                                        <span className="material-symbols-outlined text-[14px]">public</span>
                                        World
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between h-32 hover:border-purple-200 transition-colors cursor-default">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-medium text-slate-500">Badges</span>
                                    <span className="material-symbols-outlined text-purple-500">military_tech</span>
                                </div>
                                <div className="flex items-center gap-[-8px]">
                                    <span className="text-2xl font-bold text-slate-900 block mr-2">0</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 pb-2">
                                <h3 className="text-lg font-bold text-slate-900">Solved Problems</h3>
                            </div>
                            <div className="p-6 flex flex-col md:flex-row items-center gap-8">
                                <div className="relative size-40 flex-shrink-0">
                                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                        <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8"></path>
                                        <path className="text-emerald-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${easyPct}, 100`} strokeWidth="3.8"></path>
                                        <path className="text-amber-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${medPct}, 100`} strokeDashoffset={`-${easyPct}`} strokeWidth="3.8"></path>
                                        <path className="text-rose-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${hardPct}, 100`} strokeDashoffset={`-${easyPct + medPct}`} strokeWidth="3.8"></path>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-slate-900">{solvedTotal}</span>
                                        <span className="text-xs text-slate-500 uppercase font-semibold">Solved</span>
                                    </div>
                                </div>
                                <div className="flex-1 w-full space-y-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 font-medium">Easy</span>
                                            <span className="text-slate-900 font-bold">{easyCount}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ width: `${(easyCount / Math.max(1, solvedTotal)) * 100}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 font-medium">Medium</span>
                                            <span className="text-slate-900 font-bold">{medCount}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(medCount / Math.max(1, solvedTotal)) * 100}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 font-medium">Hard</span>
                                            <span className="text-slate-900 font-bold">{hardCount}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(hardCount / Math.max(1, solvedTotal)) * 100}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-x-auto custom-scrollbar">
                            <div className="w-max min-w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-slate-900">{totalSubmissions} submissions in the last year</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span>Less</span>
                                        <div className="flex gap-1">
                                            <div className="size-3 rounded-sm bg-slate-100"></div>
                                            <div className="size-3 rounded-sm bg-green-200"></div>
                                            <div className="size-3 rounded-sm bg-green-400"></div>
                                            <div className="size-3 rounded-sm bg-green-600"></div>
                                            <div className="size-3 rounded-sm bg-green-800"></div>
                                        </div>
                                        <span>More</span>
                                    </div>
                                </div>
                                <div className="heatmap-grid pb-2">
                                    {flatDays.map((day, i) => (
                                        <div key={i} title={`${day.date}: ${day.count} submissions`} className={`size-3 rounded-sm flex-shrink-0 ${heatLevel(day.count)} hover:ring-2 hover:ring-offset-1 hover:ring-green-400 transition-all cursor-pointer`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                    <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
                                    <Link to="/problems" className="text-xs font-medium text-green-600 hover:text-green-700 hover:underline">View All</Link>
                                </div>
                                <div className="divide-y divide-slate-100 min-h-[220px]">
                                    {solved.slice(0, 4).map((p, i) => (
                                        <div key={p._id || i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/problems/${p._id}`)}>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-900">{p.title}</span>
                                                <span className="text-xs text-slate-500 capitalize">{p.difficulty}</span>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200`}>Accepted</span>
                                        </div>
                                    ))}
                                    {solved.length === 0 && <div className="p-6 text-center text-sm text-slate-500">No recent submissions found</div>}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                    <h3 className="text-base font-bold text-slate-900">Study Plan</h3>
                                    <span className="text-xs font-medium text-green-600 bg-green-100 border border-green-200 px-2 py-1 rounded">Day 1</span>
                                </div>
                                <div className="p-4 flex-1 flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 border border-green-200">
                                            <span className="material-symbols-outlined">data_object</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">Data Structures 101</h4>
                                            <p className="text-xs text-slate-500">Master arrays, linked lists, and trees.</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-green-600 h-2 rounded-full shadow-[0_0_8px_rgba(22,163,74,0.4)]" style={{ width: '0%' }}></div>
                                    </div>
                                    <div className="mt-2 space-y-2">
                                        <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-green-50 hover:border-green-200 transition-all group bg-white">
                                            <div className="flex items-center gap-3">
                                                <div className="size-5 rounded-full border-2 border-slate-300 group-hover:border-green-600 transition-colors flex items-center justify-center">
                                                    <div className="size-2 rounded-full bg-green-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                </div>
                                                <span className="text-sm text-slate-700 font-medium group-hover:text-green-600 transition-colors">Two Sum</span>
                                            </div>
                                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Easy</span>
                                        </button>
                                        <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-green-50 hover:border-green-200 transition-all group bg-white">
                                            <div className="flex items-center gap-3">
                                                <div className="size-5 rounded-full border-2 border-slate-300 group-hover:border-green-600 transition-colors flex items-center justify-center">
                                                    <div className="size-2 rounded-full bg-green-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                </div>
                                                <span className="text-sm text-slate-700 font-medium group-hover:text-green-600 transition-colors">LRU Cache</span>
                                            </div>
                                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Medium</span>
                                        </button>
                                    </div>
                                    <Link to="/problems" className="mt-auto w-full text-center py-2 rounded-lg bg-slate-50 text-slate-700 text-sm font-medium hover:bg-green-50 hover:text-green-700 transition-colors border border-slate-200 hover:border-green-200">
                                        Continue Learning
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button onClick={handleDeleteProfile} className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity bg-transparent px-3 py-1 rounded hover:bg-red-50">
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900">Edit Profile</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-6 flex flex-col gap-4 text-left">
                            <div className="flex gap-4 flex-col sm:flex-row">
                                <div className="flex-1 flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">First Name</label>
                                    <input type="text" 
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors"
                                        value={editData.firstName} onChange={e => setEditData({...editData, firstName: e.target.value})} required />
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Last Name</label>
                                    <input type="text" 
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors"
                                        value={editData.lastName} onChange={e => setEditData({...editData, lastName: e.target.value})} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">New Password</label>
                                <input type="password" placeholder="Leave blank to keep same"
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors"
                                    value={editData.password} onChange={e => setEditData({...editData, password: e.target.value})} />
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 transition-all">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <Footer />
        </div>
    );
};

export default Dashboard;
