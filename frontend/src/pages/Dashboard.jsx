<<<<<<< HEAD
import React, { useEffect, useState, useMemo } from 'react';
import axiosClient from '../utils/axiosClient';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../app/features/auth/authSlice';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'react-hot-toast';

/* ── heatmap intensity ── */
const heatStyle = (count) => {
    if (count === 0) return { background: '#1C1C1F' };
    if (count <= 2)  return { background: '#1a3a2a' };
    if (count <= 5)  return { background: '#10b981', opacity: 0.5 };
    if (count <= 8)  return { background: '#10b981', opacity: 0.8 };
    return { background: '#10b981' };
};

const StatCard = ({ icon, label, value, sub, color = '#FF4F00' }) => (
    <div className="rc-card p-4 flex flex-col gap-2 hover:border-[#333338] transition-all">
        <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: '#8A8B91' }}>{label}</span>
            <span className="material-symbols-outlined text-[18px]" style={{ color }}>{icon}</span>
        </div>
        <div className="text-2xl font-black text-white">{value}</div>
        {sub && <div className="text-[11px]" style={{ color: '#4a4a52' }}>{sub}</div>}
    </div>
);

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
            toast.success('Profile updated!', { id: toastId });
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update', { id: toastId });
        }
    };

    const handleDeleteProfile = async () => {
        if (!window.confirm("Delete your account? This cannot be undone.")) return;
        const toastId = toast.loading('Deleting account...');
        try {
            await axiosClient.delete('/user/deleteProfile');
            toast.success('Account deleted. Goodbye!', { id: toastId });
            dispatch(logoutUser());
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete', { id: toastId });
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
                setError('Failed to load dashboard');
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

    const { easyCount, medCount, hardCount } = useMemo(() => ({
        easyCount: solved.filter(p => p.difficulty === 'easy').length,
        medCount:  solved.filter(p => p.difficulty === 'medium').length,
        hardCount: solved.filter(p => p.difficulty === 'hard').length,
    }), [solved]);

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #FF4F00', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: '#8A8B91', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>Loading dashboard…</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (error || !stats) return (
        <div style={{ minHeight: '100vh', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontFamily: 'Inter, sans-serif' }}>
            {error || 'No data available'}
        </div>
    );

    const { user, stats: userStats } = stats;
    const solvedTotal = user.solvedCount || 0;
    const initials = (user.firstName || authUser?.firstName || 'U').slice(0, 2).toUpperCase();
    const pieTotal = Math.max(1, easyCount + medCount + hardCount);
    const easyPct = (easyCount / pieTotal) * 100;
    const medPct  = (medCount / pieTotal) * 100;
    const hardPct = (hardCount / pieTotal) * 100;

    return (
        <div style={{ background: '#000000', minHeight: '100vh', color: '#F3F3F5', fontFamily: 'Inter, sans-serif' }} className="flex flex-col">
            <style>{`.heatmap-grid { display: grid; grid-template-rows: repeat(7, 1fr); grid-template-columns: repeat(52, 12px); grid-auto-flow: column; gap: 3px; }`}</style>
            <Navbar />

            <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-white mb-1">Dashboard</h1>
                    <p style={{ color: '#8A8B91' }}>Welcome back, <span style={{ color: '#FF4F00' }}>{user.firstName || authUser?.firstName}</span>! Here's your progress.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left column ── */}
                    <div className="lg:col-span-1 flex flex-col gap-4">

                        {/* Profile card */}
                        <div className="rc-card p-6 text-center">
                            <div className="relative group inline-block mb-4">
                                <div className="size-24 rounded-full flex items-center justify-center text-white font-black text-3xl mx-auto"
                                    style={{ background: 'linear-gradient(135deg, #FF4F00, #FF8C42)', boxShadow: '0 0 20px rgba(255,79,0,0.3)' }}>
                                    {initials}
                                </div>
                                <button
                                    onClick={() => { setEditData({ firstName: user.firstName || '', lastName: user.lastName || '', password: '' }); setIsEditModalOpen(true); }}
                                    className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: 'rgba(0,0,0,0.6)' }}>
                                    <span className="material-symbols-outlined text-white">edit</span>
                                </button>
                            </div>
                            <h2 className="text-lg font-bold text-white">{user.firstName} {user.lastName}</h2>
                            <p className="text-sm mt-0.5 truncate" style={{ color: '#8A8B91' }}>{user.emailId}</p>

                            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold"
                                style={{ background: 'rgba(255,79,0,0.1)', color: '#FF4F00', border: '1px solid rgba(255,79,0,0.2)' }}>
                                <span className="material-symbols-outlined text-[14px]">toll</span>
                                {user.tokens !== undefined ? user.tokens : authUser?.tokens || 0} AI Tokens
                            </div>

                            <div className="flex gap-2 mt-4">
                                <a href="#" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
                                    style={{ background: '#1C1C1F', color: '#8A8B91', border: '1px solid #222225' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#333338'; e.currentTarget.style.color = '#F3F3F5'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#222225'; e.currentTarget.style.color = '#8A8B91'; }}>
                                    <span className="material-symbols-outlined text-[14px]">code</span>GitHub
                                </a>
                                <a href="#" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
                                    style={{ background: '#1C1C1F', color: '#8A8B91', border: '1px solid #222225' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#333338'; e.currentTarget.style.color = '#F3F3F5'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#222225'; e.currentTarget.style.color = '#8A8B91'; }}>
                                    <span className="material-symbols-outlined text-[14px]">work</span>LinkedIn
                                </a>
                            </div>

                            <button onClick={() => { setEditData({ firstName: user.firstName || '', lastName: user.lastName || '', password: '' }); setIsEditModalOpen(true); }}
                                className="btn-rc-primary w-full justify-center mt-3 text-sm">
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                Edit Profile
                            </button>
                            {user.role === 'admin' && (
                                <button onClick={() => navigate('/admin')} className="btn-rc-secondary w-full justify-center mt-2 text-sm">
                                    <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                                    Admin Panel
                                </button>
                            )}
                        </div>

                        {/* Community stats */}
                        <div className="rc-card p-5">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]" style={{ color: '#FF4F00' }}>groups</span>
                                Stats
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Total Points', value: user.points || 0 },
                                    { label: 'Submissions', value: totalSubmissions },
                                    { label: 'Account Type', value: <span className="capitalize">{user.role || 'Member'}</span> },
                                    { label: 'Global Rank', value: user.rank ? `#${user.rank}` : '—' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between items-center py-1 border-b" style={{ borderColor: '#1a1a1e' }}>
                                        <span className="text-sm" style={{ color: '#8A8B91' }}>{label}</span>
                                        <span className="text-sm font-semibold text-white">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Languages */}
                        <div className="rc-card p-5">
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]" style={{ color: '#FF4F00' }}>terminal</span>
                                Languages
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(userStats?.languageStats || {}).length > 0
                                    ? Object.keys(userStats.languageStats).map(lang => (
                                        <span key={lang} className="text-xs px-2.5 py-1 rounded-lg uppercase font-semibold"
                                            style={{ background: 'rgba(255,79,0,0.08)', color: '#FF4F00', border: '1px solid rgba(255,79,0,0.15)' }}>
                                            {lang}
                                        </span>
                                    ))
                                    : <span className="text-sm" style={{ color: '#4a4a52' }}>No submissions yet</span>
                                }
                            </div>
                        </div>
                    </div>

                    {/* ── Right columns ── */}
                    <div className="lg:col-span-2 flex flex-col gap-4">

                        {/* Stat cards row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard icon="check_circle" label="Solved" value={solvedTotal} color="#10b981" />
                            <StatCard icon="local_fire_department" label="Streak" value={userStats?.currentStreak ?? 0} sub="days active" color="#f59e0b" />
                            <StatCard icon="emoji_events" label="Rank" value={user.rank ? `#${user.rank}` : '—'} sub="worldwide" color="#a855f7" />
                            <StatCard icon="military_tech" label="Badges" value={0} color="#3b82f6" />
                        </div>

                        {/* Solved breakdown */}
                        <div className="rc-card p-5">
                            <h3 className="text-base font-bold text-white mb-5">Solved Problems</h3>
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                {/* Donut chart */}
                                <div className="relative size-36 shrink-0">
                                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                        <path style={{ color: '#1C1C1F' }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8" />
                                        <path style={{ color: '#10b981' }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${easyPct}, 100`} strokeWidth="3.8" />
                                        <path style={{ color: '#f59e0b' }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${medPct}, 100`} strokeDashoffset={`-${easyPct}`} strokeWidth="3.8" />
                                        <path style={{ color: '#ef4444' }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${hardPct}, 100`} strokeDashoffset={`-${easyPct + medPct}`} strokeWidth="3.8" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black text-white">{solvedTotal}</span>
                                        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#8A8B91' }}>Solved</span>
                                    </div>
                                </div>

                                {/* Bars */}
                                <div className="flex-1 w-full space-y-3">
                                    {[
                                        { label: 'Easy',   count: easyCount, color: '#10b981', pct: (easyCount / Math.max(1, solvedTotal)) * 100 },
                                        { label: 'Medium', count: medCount,  color: '#f59e0b', pct: (medCount / Math.max(1, solvedTotal)) * 100 },
                                        { label: 'Hard',   count: hardCount, color: '#ef4444', pct: (hardCount / Math.max(1, solvedTotal)) * 100 },
                                    ].map(({ label, count, color, pct }) => (
                                        <div key={label}>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span style={{ color: '#8A8B91' }}>{label}</span>
                                                <span className="font-bold text-white">{count}</span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full" style={{ background: '#1C1C1F' }}>
                                                <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Heatmap */}
                        <div className="rc-card p-5 overflow-x-auto hide-scrollbar">
                            <div className="w-max min-w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-white">{totalSubmissions} submissions in the last year</h3>
                                    <div className="flex items-center gap-2 text-[11px]" style={{ color: '#4a4a52' }}>
                                        <span>Less</span>
                                        <div className="flex gap-1">
                                            {[0, 1, 3, 6, 9].map(c => (
                                                <div key={c} className="size-3 rounded-sm" style={heatStyle(c)} />
                                            ))}
                                        </div>
                                        <span>More</span>
                                    </div>
                                </div>
                                <div className="heatmap-grid pb-2">
                                    {flatDays.map((day, i) => (
                                        <div key={i} title={`${day.date}: ${day.count} submissions`}
                                            className="size-3 rounded-sm shrink-0 cursor-pointer transition-all hover:ring-1 hover:ring-orange-400"
                                            style={heatStyle(day.count)} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent activity + Study plan */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Recent */}
                            <div className="rc-card overflow-hidden">
                                <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid #1a1a1e' }}>
                                    <h3 className="text-sm font-bold text-white">Recent Activity</h3>
                                    <Link to="/" className="text-xs font-medium transition-colors" style={{ color: '#FF4F00' }}>View All</Link>
                                </div>
                                <div className="divide-y" style={{ divideColor: '#0f0f10' }}>
                                    {solved.slice(0, 4).map((p, i) => (
                                        <div key={p._id || i}
                                            className="px-4 py-3 flex items-center justify-between cursor-pointer transition-colors"
                                            onClick={() => navigate(`/problems/${p._id}`)}
                                            onMouseEnter={e => e.currentTarget.style.background = '#0C0C0D'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <div>
                                                <div className="text-sm font-medium text-white truncate max-w-[140px]">{p.title}</div>
                                                <div className="text-xs capitalize mt-0.5" style={{ color: '#8A8B91' }}>{p.difficulty}</div>
                                            </div>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold badge-easy">Accepted</span>
                                        </div>
                                    ))}
                                    {solved.length === 0 && (
                                        <div className="p-6 text-center text-sm" style={{ color: '#4a4a52' }}>No submissions yet</div>
                                    )}
                                </div>
                            </div>

                            {/* Study Plan */}
                            <div className="rc-card overflow-hidden flex flex-col">
                                <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid #1a1a1e' }}>
                                    <h3 className="text-sm font-bold text-white">Study Plan</h3>
                                    <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(255,79,0,0.1)', color: '#FF4F00', border: '1px solid rgba(255,79,0,0.2)' }}>Day 1</span>
                                </div>
                                <div className="p-4 flex-1 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="size-9 rounded-lg flex items-center justify-center"
                                            style={{ background: 'rgba(255,79,0,0.1)', border: '1px solid rgba(255,79,0,0.15)' }}>
                                            <span className="material-symbols-outlined text-[18px]" style={{ color: '#FF4F00' }}>data_object</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">Data Structures 101</div>
                                            <div className="text-xs" style={{ color: '#8A8B91' }}>Arrays, linked lists, trees</div>
                                        </div>
                                    </div>
                                    <div className="w-full rounded-full h-1.5" style={{ background: '#1C1C1F' }}>
                                        <div className="h-1.5 rounded-full" style={{ width: '0%', background: '#FF4F00' }} />
                                    </div>
                                    <div className="space-y-2">
                                        {[{ title: 'Two Sum', diff: 'easy' }, { title: 'LRU Cache', diff: 'medium' }].map(p => (
                                            <button key={p.title}
                                                className="w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all"
                                                style={{ background: '#0C0C0D', border: '1px solid #1a1a1e' }}
                                                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,79,0,0.25)'}
                                                onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1e'}>
                                                <span className="text-sm text-white font-medium">{p.title}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${p.diff === 'easy' ? 'badge-easy' : 'badge-medium'}`}>
                                                    {p.diff}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <Link to="/" className="btn-rc-secondary mt-auto text-center text-xs justify-center">
                                        Continue Learning →
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Delete account */}
                        <div className="flex justify-end mt-2">
                            <button onClick={handleDeleteProfile}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                                style={{ color: '#4a4a52' }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#4a4a52'; e.currentTarget.style.background = 'transparent'; }}>
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
                    <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#111112', border: '1px solid #222225' }}>
                        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1a1a1e' }}>
                            <h3 className="text-lg font-bold text-white">Edit Profile</h3>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ color: '#8A8B91' }}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-6 flex flex-col gap-4">
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8A8B91' }}>First Name</label>
                                    <input type="text" className="rc-input" value={editData.firstName}
                                        onChange={e => setEditData({ ...editData, firstName: e.target.value })} required />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8A8B91' }}>Last Name</label>
                                    <input type="text" className="rc-input" value={editData.lastName}
                                        onChange={e => setEditData({ ...editData, lastName: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8A8B91' }}>New Password</label>
                                <input type="password" placeholder="Leave blank to keep current" className="rc-input"
                                    value={editData.password}
                                    onChange={e => setEditData({ ...editData, password: e.target.value })} />
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-rc-ghost">Cancel</button>
                                <button type="submit" className="btn-rc-primary text-sm">Save Changes</button>
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
=======
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
>>>>>>> 4c7510c4037886edc05d8b2d5844dc36ed14d532
