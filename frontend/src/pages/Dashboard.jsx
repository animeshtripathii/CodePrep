import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import axiosClient from '../utils/axiosClient';

const statusTone = (status = '') => {
    const normalized = status.toLowerCase();
    if (normalized.includes('accept') || normalized.includes('success')) {
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
    }
    if (normalized.includes('pending')) {
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    }
    return 'bg-red-500/10 text-red-300 border-red-500/30';
};

const heatmapClass = (count) => {
    if (count <= 0) return 'bg-white/3 border-white/10';
    if (count <= 2) return 'bg-indigo-500/20 border-indigo-500/30';
    if (count <= 5) return 'bg-indigo-500/40 border-indigo-500/50';
    if (count <= 8) return 'bg-indigo-500/60 border-indigo-500/70';
    return 'bg-indigo-500/90 border-indigo-400/90 shadow-[0_0_6px_rgba(99,102,241,0.45)]';
};

const relativeTime = (input) => {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} mins ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
};

const formatMemory = (memoryKb = 0) => {
    const value = Number(memoryKb) || 0;
    if (value <= 0) return 'N/A';
    if (value >= 1024) return `${(value / 1024).toFixed(1)} MB`;
    return `${value} KB`;
};

const formatRuntime = (runtimeMs = 0) => {
    const value = Number(runtimeMs) || 0;
    if (value <= 0) return 'N/A';
    return `${value} ms`;
};

const polygonPoints = (ratio) => {
    const outer = 45;
    const center = 50;
    return new Array(6).fill(0).map((_, i) => {
        const angle = ((Math.PI * 2) / 6) * i - Math.PI / 2;
        const r = outer * ratio;
        const x = center + Math.cos(angle) * r;
        const y = center + Math.sin(angle) * r;
        return `${x},${y}`;
    }).join(' ');
};

const radarPoints = (values) => {
    const outer = 45;
    const center = 50;
    return values.map((value, i) => {
        const angle = ((Math.PI * 2) / 6) * i - Math.PI / 2;
        const ratio = Math.max(0, Math.min(100, value)) / 100;
        const r = outer * ratio;
        const x = center + Math.cos(angle) * r;
        const y = center + Math.sin(angle) * r;
        return { x, y };
    });
};

const Dashboard = () => {
    const navigate = useNavigate();
    const { user: authUser } = useSelector((state) => state.auth);

    const [stats, setStats] = useState(null);
    const [solved, setSolved] = useState([]);
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchText, setSearchText] = useState('');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({ firstName: '', lastName: '', password: '', profileImage: '' });

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [dashRes, solvedRes, recentRes] = await Promise.all([
                    axiosClient.get('/user/dashboard'),
                    axiosClient.get('/problem/problemSolvedByUser').catch(() => ({ data: { user: [] } })),
                    axiosClient.get('/submission/recent?limit=8').catch(() => ({ data: { submissions: [] } }))
                ]);

                setStats(dashRes.data);
                setSolved(solvedRes.data?.user || []);
                setRecent(recentRes.data?.submissions || []);
            } catch (loadError) {
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setEditData((prev) => ({ ...prev, profileImage: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Updating profile...');
        try {
            const payload = { ...editData };
            if (!payload.password) delete payload.password;
            await axiosClient.patch('/user/updateProfile', payload);

            setStats((prev) => {
                if (!prev?.user) return prev;
                return {
                    ...prev,
                    user: {
                        ...prev.user,
                        firstName: payload.firstName ?? prev.user.firstName,
                        lastName: payload.lastName ?? prev.user.lastName,
                        profileImage: payload.profileImage || prev.user.profileImage,
                    },
                };
            });

            setIsEditModalOpen(false);
            setEditData({ firstName: '', lastName: '', password: '', profileImage: '' });
            toast.success('Profile updated successfully', { id: toastId });
        } catch (updateError) {
            toast.error(updateError.response?.data?.message || 'Failed to update profile', { id: toastId });
        }
    };

    const computed = useMemo(() => {
        if (!stats) {
            return {
                easyCount: 0,
                mediumCount: 0,
                hardCount: 0,
                solvedTotal: 0,
                easyPct: 0,
                mediumPct: 0,
                hardPct: 0,
                heatmapDays: [],
                totalSubmissions: 0,
                activeDays: 0,
                maxStreak: 0,
                monthlyBlocks: [],
                periodLabel: 'Rolling 12M',
                radarValues: [0, 0, 0, 0, 0, 0],
                radarLabels: ['Consistency', 'Accuracy', 'Breadth', 'Volume', 'Depth', 'Growth']
            };
        }

        const easyCount = solved.filter((item) => item.difficulty === 'easy').length;
        const mediumCount = solved.filter((item) => item.difficulty === 'medium').length;
        const hardCount = solved.filter((item) => item.difficulty === 'hard').length;
        const solvedTotal = Number(stats.user?.solvedCount || solved.length);

        const easyPct = solvedTotal > 0 ? Math.round((easyCount / solvedTotal) * 100) : 0;
        const mediumPct = solvedTotal > 0 ? Math.round((mediumCount / solvedTotal) * 100) : 0;
        const hardPct = solvedTotal > 0 ? Math.round((hardCount / solvedTotal) * 100) : 0;

        const hm = stats.stats?.heatmapData || {};
        const dayCount = 53 * 7;
        const today = new Date();
        const heatmapDays = [];

        for (let i = dayCount - 1; i >= 0; i -= 1) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const key = date.toISOString().split('T')[0];
            heatmapDays.push({ date: key, count: hm[key] || 0 });
        }

        const monthlyBlocks = [];
        const monthStart = new Date(today.getFullYear(), today.getMonth() - 11, 1);
        const periodLabel = `${monthStart.toLocaleString('en-US', { month: 'short' })} - ${today.toLocaleString('en-US', { month: 'short' })} (rolling)`;
        for (let idx = 0; idx < 12; idx += 1) {
            const blockDate = new Date(monthStart.getFullYear(), monthStart.getMonth() + idx, 1);
            const year = blockDate.getFullYear();
            const month = blockDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            const dayValues = [];
            for (let d = 1; d <= daysInMonth; d += 1) {
                const dateKey = new Date(year, month, d).toISOString().split('T')[0];
                dayValues.push({ date: dateKey, count: hm[dateKey] || 0 });
            }

            const cells = [];
            const cellCount = 28;
            for (let cellIndex = 0; cellIndex < cellCount; cellIndex += 1) {
                const start = Math.floor((cellIndex * dayValues.length) / cellCount);
                const end = Math.floor(((cellIndex + 1) * dayValues.length) / cellCount);
                const bucket = dayValues.slice(start, Math.max(start + 1, end));
                const count = bucket.reduce((sum, item) => sum + item.count, 0);
                const sampleDate = bucket[0]?.date || `${year}-${String(month + 1).padStart(2, '0')}-01`;
                cells.push({ date: sampleDate, count });
            }

            monthlyBlocks.push({
                label: blockDate.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
                cells
            });
        }

        const yearlySubmissions = heatmapDays.reduce((sum, day) => sum + day.count, 0);
        const activeDays = heatmapDays.filter((day) => day.count > 0).length;

        let maxStreak = 0;
        let runningStreak = 0;
        heatmapDays.forEach((day) => {
            if (day.count > 0) {
                runningStreak += 1;
                maxStreak = Math.max(maxStreak, runningStreak);
            } else {
                runningStreak = 0;
            }
        });

        const languageCount = Object.keys(stats.stats?.languageStats || {}).length;
        const totalSubmissions = Number(stats.stats?.totalSubmissions || 0);
        const acceptanceRate = Number(stats.stats?.acceptanceRate || 0);
        const currentStreak = Number(stats.stats?.currentStreak || 0);
        const rank = Number(stats.user?.rank || 0);

        const radarValues = [
            Math.min(100, currentStreak * 10),
            Math.min(100, acceptanceRate),
            Math.min(100, languageCount * 22),
            Math.min(100, totalSubmissions * 2),
            Math.min(100, solvedTotal > 0 ? Math.round(((mediumCount + hardCount) / solvedTotal) * 100) : 0),
            Math.max(5, rank > 0 ? Math.max(0, Math.min(100, 110 - rank)) : 20)
        ];

        return {
            easyCount,
            mediumCount,
            hardCount,
            solvedTotal,
            easyPct,
            mediumPct,
            hardPct,
            heatmapDays,
            totalSubmissions: yearlySubmissions || totalSubmissions,
            activeDays,
            maxStreak,
            monthlyBlocks,
            periodLabel,
            radarValues,
            radarLabels: ['Consistency', 'Accuracy', 'Breadth', 'Volume', 'Depth', 'Growth']
        };
    }, [solved, stats]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-400">
                {error || 'No dashboard data available'}
            </div>
        );
    }

    const { user, stats: userStats } = stats;
    const initials = (user.firstName || authUser?.firstName || 'U').slice(0, 2).toUpperCase();
    const displayName = `${user.firstName || authUser?.firstName || 'User'} ${user.lastName || authUser?.lastName || ''}`.trim();
    const availableTokens = Number.isFinite(Number(user.tokens)) ? Number(user.tokens) : 0;
    const radarPointData = radarPoints(computed.radarValues);
    const radarPolygon = radarPointData.map((point) => `${point.x},${point.y}`).join(' ');
    const circumference = 2 * Math.PI * 45;
    const easyArc = (computed.easyCount / Math.max(1, computed.solvedTotal)) * circumference;
    const mediumArc = (computed.mediumCount / Math.max(1, computed.solvedTotal)) * circumference;
    const hardArc = (computed.hardCount / Math.max(1, computed.solvedTotal)) * circumference;
    const filteredRecent = recent.filter((item) => item.problemTitle.toLowerCase().includes(searchText.toLowerCase()));

    return (
        <div className="min-h-screen relative overflow-x-hidden text-slate-100" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <style>{`
                .dashboard-glass {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(22px);
                    -webkit-backdrop-filter: blur(22px);
                    border-radius: 16px;
                }
                .ambient-orb {
                    position: fixed;
                    border-radius: 50%;
                    filter: blur(120px);
                    opacity: 0.2;
                    pointer-events: none;
                    z-index: 0;
                    animation: liquid 20s ease-in-out infinite alternate;
                }
                .orb-left {
                    width: 760px;
                    height: 760px;
                    left: -220px;
                    top: -220px;
                    background: radial-gradient(circle, rgba(14,165,233,0.65) 0%, rgba(14,165,233,0) 70%);
                }
                .orb-right {
                    width: 620px;
                    height: 620px;
                    right: -150px;
                    bottom: -150px;
                    background: radial-gradient(circle, rgba(99,102,241,0.55) 0%, rgba(99,102,241,0) 70%);
                    animation-direction: alternate-reverse;
                    animation-duration: 26s;
                }
                .heatmap-grid {
                    display: grid;
                    grid-template-columns: repeat(53, minmax(10px, 10px));
                    grid-template-rows: repeat(7, minmax(10px, 10px));
                    gap: 3px;
                    width: max-content;
                }
                .heatmap-square {
                    width: 10px;
                    height: 10px;
                    border-radius: 2px;
                    border-width: 1px;
                }
                .activity-heatmap-grid {
                    display: grid;
                    grid-template-columns: repeat(53, minmax(10px, 10px));
                    grid-template-rows: repeat(7, 9px);
                    grid-auto-flow: column;
                    gap: 3px;
                    width: max-content;
                    min-height: 81px;
                }
                .activity-heatmap-grid-month {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(11px, 11px));
                    grid-template-rows: repeat(7, 10px);
                    grid-auto-flow: column;
                    gap: 3px;
                    width: max-content;
                }
                .activity-heatmap-square {
                    width: 11px;
                    height: 10px;
                    border-radius: 2px;
                    border-width: 1px;
                }
                .activity-months-row {
                    display: flex;
                    gap: 14px;
                    width: max(100%, max-content);
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .activity-month-block {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }
                .activity-month-label {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.18em;
                    color: rgb(148 163 184);
                    white-space: nowrap;
                }
                @keyframes liquid {
                    0% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(40px, -55px) scale(1.08); }
                    100% { transform: translate(-45px, 45px) scale(0.92); }
                }
            `}</style>

            <div className="ambient-orb orb-left" />
            <div className="ambient-orb orb-right" />

            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-1 max-w-7xl w-full mx-auto px-5 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex flex-col gap-2">
                        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>User Dashboard</h1>
                        <p className="text-slate-400">Track your progress, consistency, and coding signal from real submissions.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block relative w-64">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
                                <input
                                    type="text"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    className="w-full bg-white/3 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
                                    placeholder="Search submissions"
                                />
                            </div>
                            <div className="relative group">
                                <div className="w-10 h-10 rounded-lg border border-white/10 bg-indigo-500/15 text-indigo-200 flex items-center justify-center shadow-[0_0_14px_rgba(99,102,241,0.25)]">
                                    <span className="material-symbols-outlined text-[20px]">code</span>
                                </div>
                                <div className="pointer-events-none absolute right-0 top-12 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 rounded-lg border border-white/10 bg-[#0b1020]/95 px-3 py-2 text-xs text-slate-200 shadow-xl whitespace-nowrap">
                                    <div className="font-semibold text-white">{displayName || initials}</div>
                                    <div className="text-indigo-300 mt-0.5">Tokens: {availableTokens}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <section className="dashboard-glass p-6 flex flex-col gap-6">
                            <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Solved</h2>
                            <div className="flex items-center justify-center py-2">
                                <div className="relative w-36 h-36">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#22c55e" strokeWidth="8" strokeDasharray={`${easyArc} ${circumference}`} strokeDashoffset="0" />
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#eab308" strokeWidth="8" strokeDasharray={`${mediumArc} ${circumference}`} strokeDashoffset={`-${easyArc}`} />
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#ef4444" strokeWidth="8" strokeDasharray={`${hardArc} ${circumference}`} strokeDashoffset={`-${easyArc + mediumArc}`} />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{computed.solvedTotal}</span>
                                        <span className="text-[10px] uppercase tracking-widest text-slate-400">Total Solved</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1"><span className="text-green-400">Easy</span><span>{computed.easyCount} ({computed.easyPct}%)</span></div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${computed.easyPct}%` }} /></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1"><span className="text-yellow-400">Medium</span><span>{computed.mediumCount} ({computed.mediumPct}%)</span></div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 rounded-full" style={{ width: `${computed.mediumPct}%` }} /></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1"><span className="text-red-400">Hard</span><span>{computed.hardCount} ({computed.hardPct}%)</span></div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full" style={{ width: `${computed.hardPct}%` }} /></div>
                                </div>
                            </div>
                        </section>

                        <section className="dashboard-glass p-5 lg:col-span-3 flex flex-col gap-4 self-start">
                            <div className="flex flex-col gap-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl text-slate-100 font-semibold">{computed.totalSubmissions}</span>
                                        <span className="text-2xl text-slate-400">submissions in the past one year</span>
                                        <span className="material-symbols-outlined text-slate-500 text-sm">info</span>
                                    </div>
                                    <select className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/60">
                                        <option>{computed.periodLabel}</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-6 text-slate-300 flex-wrap">
                                    <span className="text-base">Total active days: <span className="text-slate-100 font-semibold">{computed.activeDays}</span></span>
                                    <span className="text-base">Max streak: <span className="text-slate-100 font-semibold">{computed.maxStreak}</span></span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-6">
                                <div className="overflow-x-auto -mx-2 px-2 pb-1">
                                    <div className="activity-months-row min-w-full" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                        {computed.monthlyBlocks.map((block) => (
                                            <div key={block.label} className="activity-month-block">
                                                <div className="activity-heatmap-grid-month" title={`${block.label} activity`}>
                                                    {block.cells.map((cell, idx) => (
                                                        <div
                                                            key={`${block.label}-${cell.date}-${idx}`}
                                                            title={`${cell.date}: ${cell.count} submissions`}
                                                            className={`activity-heatmap-square border ${heatmapClass(cell.count)}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="activity-month-label">{block.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="dashboard-glass p-6 lg:col-span-1 flex flex-col gap-4 items-center">
                            <h2 className="text-xl font-bold self-start" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Skill Matrix</h2>
                            <div className="relative w-full max-w-65 aspect-square my-2">
                                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_14px_rgba(99,102,241,0.4)]">
                                    <polygon points={polygonPoints(1)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
                                    <polygon points={polygonPoints(0.75)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                                    <polygon points={polygonPoints(0.5)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                                    <polygon points={polygonPoints(0.25)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                                    {new Array(6).fill(0).map((_, i) => {
                                        const angle = ((Math.PI * 2) / 6) * i - Math.PI / 2;
                                        const x = 50 + Math.cos(angle) * 45;
                                        const y = 50 + Math.sin(angle) * 45;
                                        return <line key={`axis-${i}`} x1="50" y1="50" x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />;
                                    })}
                                    <polygon points={radarPolygon} fill="rgba(99,102,241,0.25)" stroke="#6366F1" strokeWidth="1.4" />
                                    {radarPointData.map((point, i) => <circle key={`point-${i}`} cx={point.x} cy={point.y} r="1.8" fill="#0EA5E9" />)}
                                </svg>

                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wide text-slate-400">Consistency</span>
                                <span className="absolute top-[22%] -right-7 text-[10px] uppercase tracking-wide text-slate-400">Accuracy</span>
                                <span className="absolute bottom-[24%] -right-4 text-[10px] uppercase tracking-wide text-slate-400">Breadth</span>
                                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wide text-slate-400">Volume</span>
                                <span className="absolute bottom-[24%] -left-5 text-[10px] uppercase tracking-wide text-slate-400">Depth</span>
                                <span className="absolute top-[22%] -left-5 text-[10px] uppercase tracking-wide text-slate-400">Growth</span>
                            </div>
                            <div className="w-full text-xs text-slate-400 space-y-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                <div className="flex justify-between"><span>Acceptance</span><span>{userStats.acceptanceRate}%</span></div>
                                <div className="flex justify-between"><span>Current Streak</span><span>{userStats.currentStreak} days</span></div>
                                <div className="flex justify-between"><span>Languages Used</span><span>{Object.keys(userStats.languageStats || {}).length}</span></div>
                            </div>
                        </section>

                        <section className="dashboard-glass p-6 lg:col-span-3 flex flex-col gap-4 lg:-mt-28">
                            <div className="flex items-center justify-between gap-3 mb-1">
                                <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Recent Submissions</h2>
                                <button onClick={() => navigate('/')} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View Problems</button>
                            </div>
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-160">
                                    <thead>
                                        <tr className="text-xs uppercase tracking-wider text-slate-400 border-b border-white/10" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                            <th className="py-3 px-4 font-normal">Problem</th>
                                            <th className="py-3 px-4 font-normal">Status</th>
                                            <th className="py-3 px-4 font-normal">Runtime</th>
                                            <th className="py-3 px-4 font-normal">Memory</th>
                                            <th className="py-3 px-4 font-normal text-right">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {filteredRecent.map((item) => (
                                            <tr key={item._id} className="border-b last:border-b-0 border-white/10 hover:bg-white/4 transition-colors">
                                                <td className="py-4 px-4 font-medium text-slate-100">{item.problemTitle}</td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border ${statusTone(item.status)}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                        {item.status || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-slate-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatRuntime(item.runtime)}</td>
                                                <td className="py-4 px-4 text-slate-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatMemory(item.memory)}</td>
                                                <td className="py-4 px-4 text-slate-400 text-right" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{relativeTime(item.createdAt)}</td>
                                            </tr>
                                        ))}
                                        {filteredRecent.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="py-8 text-center text-slate-500">No submissions found for this filter.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    <div className="flex justify-between items-center gap-3 flex-wrap text-sm text-slate-400">
                        <span>Signed in as {user.firstName} {user.lastName} ({user.emailId})</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-200" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            <span className="material-symbols-outlined text-[15px]">token</span>
                            Tokens Left: {Number.isFinite(Number(user.tokens)) ? Number(user.tokens) : 0}
                        </span>
                    </div>
                </main>
            </div>

            {isEditModalOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#06080f]/95 backdrop-blur-2xl overflow-hidden">
                        <div className="p-5 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Edit Profile</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-5 flex flex-col gap-4">
                            <div className="flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full border border-dashed border-white/25 overflow-hidden relative">
                                    {(editData.profileImage || user.profileImage) ? (
                                        <img src={editData.profileImage || user.profileImage} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                                            <span className="material-symbols-outlined">add_a_photo</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                    value={editData.firstName}
                                    onChange={(e) => setEditData((prev) => ({ ...prev, firstName: e.target.value }))}
                                    className="bg-white/3 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="First name"
                                    required
                                />
                                <input
                                    value={editData.lastName}
                                    onChange={(e) => setEditData((prev) => ({ ...prev, lastName: e.target.value }))}
                                    className="bg-white/3 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Last name"
                                />
                            </div>
                            <input
                                type="password"
                                value={editData.password}
                                onChange={(e) => setEditData((prev) => ({ ...prev, password: e.target.value }))}
                                className="bg-white/3 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="New password (optional)"
                            />
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:text-white">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
