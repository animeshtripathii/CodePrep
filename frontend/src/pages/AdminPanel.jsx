import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axiosClient from '../utils/axiosClient';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

/* ─── helpers ─────────────────────────────────────────────────────────── */
const difficultyBadge = {
    easy:   'bg-green-500/10  text-green-400  border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    hard:   'bg-red-500/10    text-red-400    border-red-500/20',
};
const statusBadge = {
    active:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    draft:    'bg-slate-500/10   text-slate-400   border-slate-500/20',
    archived: 'bg-orange-500/10  text-orange-400  border-orange-500/20',
};
const statusDot = {
    active:   'bg-emerald-500',
    draft:    'bg-slate-500',
    archived: 'bg-orange-500',
};

/* ─── zod schema ─────────────────────────────────────────────────────── */
const schema = z.object({
    title: z.string().min(1, 'Title is required').trim(),
    description: z.string().min(10, 'Description must be at least 10 characters').trim(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    tags: z.array(z.string()),
    visibleTestCases: z.array(z.object({
        input: z.string().min(1, 'Input is required'),
        output: z.string().min(1, 'Output is required'),
        explanation: z.string().min(1, 'Explanation is required'),
    })),
    hiddenTestCases: z.array(z.object({
        input: z.string().min(1, 'Input is required'),
        output: z.string().min(1, 'Output is required'),
    })),
    startCode: z.array(z.object({
        language: z.string().min(1, 'Language is required'),
        initialCode: z.string().min(1, 'Initial code is required'),
    })),
    referenceSolution: z.array(z.object({
        language: z.string().min(1, 'Language is required'),
        completeCode: z.string().min(1, 'Complete code is required'),
    })),
});

/* ═══════════════════════════════════════════════════════════════════════ */
const AdminPanel = () => {
    const { user } = useSelector(s => s.auth);

    // ─── nav ──────────────────────────────────────────────────────────
    const [activePage, setActivePage] = useState('problems'); // 'home' | 'problems'

    // ─── problems list ────────────────────────────────────────────────
    const [problems, setProblems] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [search, setSearch] = useState('');

    // ─── modal ────────────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [editingProblem, setEditingProblem] = useState(null); // null = create, object = edit

    // ─── form state ───────────────────────────────────────────────────
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [tagInput, setTagInput] = useState('');
    const [previewMode, setPreviewMode] = useState(false);
    const [publishNow, setPublishNow] = useState(false);
    const descriptionRef = React.useRef(null);

    /* ── form setup ────────────────────────────────────────────────── */
    const { register, control, handleSubmit, formState: { errors }, watch, setValue, reset } =
        useForm({
            resolver: zodResolver(schema),
            defaultValues: {
                title: '', description: '', difficulty: 'easy', tags: [],
                visibleTestCases: [{ input: '', output: '', explanation: '' }],
                hiddenTestCases: [{ input: '', output: '' }],
                startCode: [{ language: 'python', initialCode: '' }],
                referenceSolution: [{ language: 'python', completeCode: '' }],
            },
        });

    const { fields: visibleFields, append: appendVisible, remove: removeVisible } =
        useFieldArray({ control, name: 'visibleTestCases' });
    const { fields: hiddenFields, append: appendHidden, remove: removeHidden } =
        useFieldArray({ control, name: 'hiddenTestCases' });
    const { fields: startCodeFields, append: appendStart, remove: removeStart } =
        useFieldArray({ control, name: 'startCode' });
    const { fields: refFields, append: appendRef, remove: removeRef } =
        useFieldArray({ control, name: 'referenceSolution' });

    /* ── fetch problems ─────────────────────────────────────────────── */
    const fetchProblems = async () => {
        setListLoading(true);
        try {
            const res = await axiosClient.get('/problem/getAllProblem');
            setProblems(res.data.problems || []);
        } catch {
            toast.error('Failed to load problems');
        } finally {
            setListLoading(false);
        }
    };

    useEffect(() => { fetchProblems(); }, []);

    /* ── submit ────────────────────────────────────────────────────── */
    const onSubmit = async (data) => {
        setIsLoading(true);
        setStatusMessage('Saving problem...');
        const t = toast.loading('Saving problem...');
        try {
            const res = editingProblem
                ? await axiosClient.put(`/problem/update/${editingProblem._id}`, data)
                : await axiosClient.post('/problem/create', data);

            if (res.data.success || res.status === 200 || res.status === 201) {
                toast.dismiss(t);
                toast.success(res.data.message || 'Saved!');
                setStatusMessage('Saved successfully');
                fetchProblems();
                setTimeout(() => { closeModal(); setStatusMessage(null); }, 1500);
            }
        } catch (err) {
            toast.dismiss(t);
            const msg = err.response?.data?.message || err.message;
            toast.error(msg);
            setStatusMessage(`Error: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    /* ── delete ────────────────────────────────────────────────────── */
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this problem?')) return;
        try {
            await axiosClient.delete(`/problem/delete/${id}`);
            toast.success('Problem deleted');
            fetchProblems();
        } catch {
            toast.error('Failed to delete problem');
        }
    };

    /* ── modal helpers ─────────────────────────────────────────────── */
    const EMPTY_DEFAULTS = {
        title: '', description: '', difficulty: 'easy', tags: [],
        visibleTestCases: [{ input: '', output: '', explanation: '' }],
        hiddenTestCases: [{ input: '', output: '' }],
        startCode: [{ language: 'python', initialCode: '' }],
        referenceSolution: [{ language: 'python', completeCode: '' }],
    };

    const openCreate = () => {
        reset(EMPTY_DEFAULTS);
        setTagInput('');
        setEditingProblem(null);
        setStatusMessage(null);
        setPublishNow(false);
        setModalOpen(true);
    };

    const openEdit = async (p) => {
        setEditingProblem(p);
        setStatusMessage(null);
        setModalLoading(true);
        setModalOpen(true);
        try {
            // Fetch full problem data (list endpoint only returns basic fields)
            const res = await axiosClient.get(`/problem/problemById/${p._id}`);
            const full = res.data.problem || res.data;
            reset({
                title: full.title || '',
                description: full.description || '',
                difficulty: full.difficulty || 'easy',
                tags: full.tags || [],
                visibleTestCases: full.visibleTestCases?.length
                    ? full.visibleTestCases
                    : [{ input: '', output: '', explanation: '' }],
                hiddenTestCases: full.hiddenTestCases?.length
                    ? full.hiddenTestCases
                    : [{ input: '', output: '' }],
                startCode: full.startCode?.length
                    ? full.startCode
                    : [{ language: 'python', initialCode: '' }],
                referenceSolution: full.referenceSolution?.length
                    ? full.referenceSolution
                    : [{ language: 'python', completeCode: '' }],
            });
        } catch {
            toast.error('Failed to load problem details');
            closeModal();
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => { setModalOpen(false); setEditingProblem(null); };

    /* ── tag helpers ────────────────────────────────────────────────── */
    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const curr = watch('tags') || [];
            if (!curr.includes(tagInput.trim())) setValue('tags', [...curr, tagInput.trim()]);
            setTagInput('');
        }
    };
    const removeTag = (tag) => setValue('tags', (watch('tags') || []).filter(t => t !== tag));

    /* ── format helpers ─────────────────────────────────────────────── */
    const insertFormatting = (before, after = before) => {
        const el = descriptionRef.current;
        if (!el) return;
        const s = el.selectionStart, e = el.selectionEnd, txt = el.value;
        const sel = txt.substring(s, e);
        const newTxt = txt.substring(0, s) + before + sel + after + txt.substring(e);
        setValue('description', newTxt, { shouldValidate: true });
        setTimeout(() => { el.focus(); el.setSelectionRange(s + before.length, e + before.length); }, 0);
    };

    /* ── filtered list ──────────────────────────────────────────────── */
    const filtered = problems.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase())
    );

    /* ═══════════════════════════════════════════════════════════════════ */
    return (
        <div
            className="flex h-screen overflow-hidden text-slate-100"
            style={{ fontFamily: "'Inter', sans-serif", background: '#0f172a' }}
        >
            {/* ── SIDEBAR ─────────────────────────────────────────────── */}
            <aside className="w-64 flex-shrink-0 flex flex-col h-screen border-r border-slate-700/60"
                style={{ background: '#1e293b' }}>

                {/* Logo */}
                <div className="p-6 border-b border-slate-700/60">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                            <span className="material-symbols-outlined text-blue-400">terminal</span>
                        </div>
                        <div>
                            <h1 className="text-white text-lg font-bold leading-none"
                                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CodePrep</h1>
                            <p className="text-slate-400 text-xs mt-1">Admin Console</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <button
                        onClick={() => setActivePage('problems')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium text-left ${
                            activePage === 'problems'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">code</span>
                        <span>Problems</span>
                    </button>

                    {/* ── Divider + site links ── */}
                    <div className="pt-4 mt-2 border-t border-slate-700/50">
                        <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold px-3 mb-2">Go to Site</p>
                        <Link to="/dashboard"
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white"
                        >
                            <span className="material-symbols-outlined text-[20px]">dashboard</span>
                            <span>Dashboard</span>
                        </Link>
                        <Link to="/"
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white"
                        >
                            <span className="material-symbols-outlined text-[20px]">home</span>
                            <span>Home</span>
                        </Link>
                        <Link to="/problems"
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white"
                        >
                            <span className="material-symbols-outlined text-[20px]">list</span>
                            <span>Problems List</span>
                        </Link>
                    </div>
                </nav>


                {/* Admin profile footer */}

                <div className="p-4 border-t border-slate-700/60">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                            A
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">Admin User</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@codeprep.io'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── MAIN ────────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden" style={{ background: '#0f172a' }}>

                {/* ── Header ────────────────────────────────────────── */}
                <header className="flex justify-between items-center gap-4 px-8 py-5 border-b border-slate-700/60 sticky top-0 z-20"
                    style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)' }}>
                    <div>
                        <nav className="flex text-sm text-slate-400 mb-1 items-center gap-1.5">
                            <Link to="/" className="hover:text-white transition-colors">Dashboard</Link>
                            <span className="text-slate-600">/</span>
                            <span className="text-white font-medium capitalize">{activePage}</span>
                        </nav>
                        <h2 className="text-2xl font-bold text-white"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            {activePage === 'home' ? 'Dashboard' : 'Problems Management'}
                        </h2>
                        <p className="text-slate-400 text-sm mt-0.5">
                            {activePage === 'home'
                                ? 'Overview of your CodePrep admin console.'
                                : 'Manage coding challenges, test cases, and solutions.'}
                        </p>
                    </div>

                    {activePage === 'problems' && (
                        <div className="flex gap-3">
                            <button
                                onClick={openCreate}
                                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg shadow-blue-500/20 transition-all text-sm font-semibold"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                Add Problem
                            </button>
                        </div>
                    )}
                </header>

                {/* ── Scrollable body ────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-8">

                    {/* ── HOME page ─────────────────────────────────── */}
                    {activePage === 'home' && (() => {
                        // Filter to only this admin's problems
                        const myProblems = problems.filter(
                            p => p.problemCreator === user?._id || p.problemCreator?._id === user?._id
                        );

                        // Pie chart data — difficulty breakdown
                        const pieData = [
                            { name: 'Easy',   value: myProblems.filter(p => p.difficulty === 'easy').length,   color: '#22c55e' },
                            { name: 'Medium', value: myProblems.filter(p => p.difficulty === 'medium').length, color: '#f59e0b' },
                            { name: 'Hard',   value: myProblems.filter(p => p.difficulty === 'hard').length,   color: '#ef4444' },
                        ].filter(d => d.value > 0);

                        // Bar chart data — top 7 tags
                        const tagCount = {};
                        myProblems.forEach(p => (p.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
                        const barData = Object.entries(tagCount)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 7)
                            .map(([tag, count]) => ({ tag, count }));

                        return (
                            <div className="space-y-6">
                                {/* Stat cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {[
                                        { label: 'My Problems', value: myProblems.length, icon: 'code', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                                        { label: 'Easy', value: myProblems.filter(p => p.difficulty === 'easy').length, icon: 'check_circle', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                                        { label: 'Hard', value: myProblems.filter(p => p.difficulty === 'hard').length, icon: 'local_fire_department', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                                    ].map(c => (
                                        <div key={c.label} className={`${c.bg} border ${c.border} rounded-xl p-5 flex items-center gap-4`}>
                                            <div className={`${c.bg} border ${c.border} p-3 rounded-lg`}>
                                                <span className={`material-symbols-outlined ${c.color} text-2xl`}>{c.icon}</span>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{c.label}</p>
                                                <p className="text-white text-2xl font-bold mt-0.5">{c.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Charts row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                    {/* Difficulty Pie */}
                                    <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
                                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
                                            <span className="material-symbols-outlined text-blue-400 text-[18px]">pie_chart</span>
                                            Difficulty Breakdown
                                        </h3>
                                        {pieData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={200}>
                                                <PieChart>
                                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                                                        innerRadius={55} outerRadius={85} paddingAngle={3}
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                        labelLine={false}
                                                    >
                                                        {pieData.map((entry, i) => (
                                                            <Cell key={i} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                                                        itemStyle={{ color: '#cbd5e1' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No problems yet</div>
                                        )}
                                    </div>

                                    {/* Tags Bar */}
                                    <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
                                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
                                            <span className="material-symbols-outlined text-purple-400 text-[18px]">bar_chart</span>
                                            Top Tags
                                        </h3>
                                        {barData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={200}>
                                                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                    <XAxis dataKey="tag" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                                    <Tooltip
                                                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                                                        itemStyle={{ color: '#cbd5e1' }}
                                                        cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                                                    />
                                                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No tags yet</div>
                                        )}
                                    </div>
                                </div>

                                {/* Quick actions */}
                                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
                                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                                        <span className="material-symbols-outlined text-blue-400 text-[18px]">bolt</span>
                                        Quick Actions
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => { setActivePage('problems'); openCreate(); }}
                                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors shadow-lg shadow-blue-500/15"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">add</span>
                                            New Problem
                                        </button>
                                        <button
                                            onClick={() => setActivePage('problems')}
                                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-slate-600"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">list</span>
                                            All Problems
                                        </button>
                                    </div>
                                </div>

                                {/* My recent problems */}
                                {myProblems.length > 0 && (
                                    <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
                                        <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between">
                                            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                                                <span className="material-symbols-outlined text-blue-400 text-[18px]">person</span>
                                                My Problems
                                            </h3>
                                            <span className="text-slate-400 text-xs">{myProblems.length} total</span>
                                        </div>
                                        <table className="w-full text-sm">
                                            <tbody className="divide-y divide-slate-700/40">
                                                {myProblems.slice(0, 5).map((p, i) => (
                                                    <tr key={p._id} className="hover:bg-slate-700/20 transition-colors">
                                                        <td className="px-5 py-3 text-slate-500 font-mono text-xs w-10">{i + 1}</td>
                                                        <td className="px-5 py-3 text-white font-medium">{p.title}</td>
                                                        <td className="px-5 py-3">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border capitalize ${difficultyBadge[p.difficulty?.toLowerCase()] || difficultyBadge.medium}`}>
                                                                {p.difficulty}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors">
                                                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {myProblems.length > 5 && (
                                            <div className="px-5 py-3 border-t border-slate-700/60 text-center">
                                                <button onClick={() => setActivePage('problems')} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                                    View all {myProblems.length} problems →
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })()}


                    {/* ── PROBLEMS list page ────────────────────────── */}
                    {activePage === 'problems' && (
                        <>
                            {/* Search bar */}
                            <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
                                <div className="relative flex-1 w-full max-w-md">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                                    <input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        placeholder="Filter problems..."
                                        type="text"
                                    />
                                </div>
                                <div className="text-sm text-slate-400">
                                    <span className="text-white font-medium">{filtered.length}</span> problem{filtered.length !== 1 ? 's' : ''}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-700/60">
                                            <tr>
                                                <th className="px-6 py-3 pl-8 text-xs uppercase tracking-wider w-16">#</th>
                                                <th className="px-6 py-3 text-xs uppercase tracking-wider">Problem Title</th>
                                                <th className="px-6 py-3 text-xs uppercase tracking-wider w-32">Difficulty</th>
                                                <th className="px-6 py-3 text-xs uppercase tracking-wider w-64">Tags</th>
                                                <th className="px-6 py-3 text-xs uppercase tracking-wider text-right pr-8 w-24">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/40">
                                            {listLoading ? (
                                                [...Array(5)].map((_, i) => (
                                                    <tr key={i}>
                                                        <td colSpan={5} className="px-8 py-4">
                                                            <div className="flex items-center gap-6 animate-pulse">
                                                                <div className="h-3 w-10 bg-slate-700 rounded" />
                                                                <div className="h-3 flex-1 bg-slate-700 rounded" />
                                                                <div className="h-5 w-16 bg-slate-700 rounded-full" />
                                                                <div className="h-3 w-24 bg-slate-700 rounded" />
                                                                <div className="h-7 w-16 bg-slate-700 rounded" />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : filtered.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-12 text-slate-500">
                                                        <span className="material-symbols-outlined text-4xl block mb-2">search_off</span>
                                                        No problems found
                                                    </td>
                                                </tr>
                                            ) : filtered.map((p, idx) => (
                                                <tr key={p._id} className="hover:bg-slate-700/20 transition-colors group">
                                                    <td className="px-6 py-4 pl-8 text-slate-500 font-mono text-xs">{idx + 1}</td>
                                                    <td className="px-6 py-4">
                                                        <div
                                                            className="font-medium text-white group-hover:text-blue-400 transition-colors cursor-pointer"
                                                            onClick={() => openEdit(p)}
                                                        >
                                                            {p.title}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border capitalize ${difficultyBadge[p.difficulty?.toLowerCase()] || difficultyBadge.medium}`}>
                                                            {p.difficulty}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {(p.tags || []).slice(0, 3).map(tag => (
                                                                <span key={tag} className="px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 text-xs border border-slate-600/60">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                            {(p.tags || []).length > 3 && (
                                                                <span className="text-slate-500 text-xs">+{p.tags.length - 3}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 pr-8 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <button
                                                                onClick={() => openEdit(p)}
                                                                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                                                title="Edit"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(p._id)}
                                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                                                title="Delete"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Table footer */}
                                <div className="px-6 py-4 border-t border-slate-700/60 flex items-center justify-between bg-slate-800/40">
                                    <div className="text-sm text-slate-400">
                                        Showing <span className="text-white font-medium">{filtered.length}</span> of{' '}
                                        <span className="text-white font-medium">{problems.length}</span> problems
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* ═══════════════ ADD / EDIT PROBLEM MODAL ═══════════════ */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(6px)' }}
                    onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
                >
                    <div
                        className="w-full max-w-6xl flex flex-col rounded-xl border border-slate-700/60 shadow-2xl"
                        style={{ maxHeight: '90vh', background: '#1e293b' }}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-700/60 rounded-t-xl flex-shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-white"
                                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                    {editingProblem ? 'Edit Problem' : 'Add Problem'}
                                </h3>
                                <p className="text-slate-400 text-sm">Define problem details, test cases, and solution code.</p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Modal body */}
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="flex flex-col flex-1 overflow-hidden"
                            style={{ minHeight: 0 }}
                        >
                            {/* Loading overlay while fetching problem details */}
                            {modalLoading ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ background: '#0f172a' }}>
                                    <span className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-slate-400 text-sm">Loading problem details…</p>
                                </div>
                            ) : (
                            <div className="flex-1 overflow-y-auto p-8" style={{ background: '#0f172a' }}>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                                    {/* ── LEFT COLUMN ─────────────────────────── */}
                                    <div className="space-y-8">

                                        {/* Basic info card */}
                                        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
                                            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-blue-400">info</span>
                                                Basic Information
                                            </h4>
                                            <div className="space-y-4">
                                                {/* Title */}
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-1">Problem Title</label>
                                                    <input
                                                        {...register('title')}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                                                        placeholder="e.g. Reverse Linked List"
                                                    />
                                                    {errors.title && <span className="text-red-400 text-xs mt-1 block">{errors.title.message}</span>}
                                                </div>

                                                {/* Difficulty */}
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-1">Difficulty</label>
                                                    <select
                                                        {...register('difficulty')}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                                                    >
                                                        <option value="easy">Easy</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="hard">Hard</option>
                                                    </select>
                                                </div>

                                                {/* Tags */}
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-1">Tags</label>
                                                    <div className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 flex flex-wrap gap-2 items-center min-h-[42px] focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                                                        {(watch('tags') || []).map((tag, i) => (
                                                            <span key={i} className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                                                                {tag}
                                                                <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">
                                                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                                                </button>
                                                            </span>
                                                        ))}
                                                        <input
                                                            value={tagInput}
                                                            onChange={e => setTagInput(e.target.value)}
                                                            onKeyDown={handleAddTag}
                                                            className="bg-transparent border-none outline-none text-sm flex-grow min-w-[100px] text-slate-200 placeholder-slate-500"
                                                            placeholder="Add tag, press Enter…"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-1">Description (Markdown)</label>
                                                    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                                                        <div className="flex items-center gap-1 p-1.5 border-b border-slate-700 bg-slate-800/60">
                                                            <button type="button" onClick={() => insertFormatting('<b>', '</b>')} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                                                                <span className="material-symbols-outlined text-sm">format_bold</span>
                                                            </button>
                                                            <button type="button" onClick={() => insertFormatting('<i>', '</i>')} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                                                                <span className="material-symbols-outlined text-sm">format_italic</span>
                                                            </button>
                                                            <button type="button" onClick={() => insertFormatting('<code>', '</code>')} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                                                                <span className="material-symbols-outlined text-sm">code</span>
                                                            </button>
                                                            <button type="button" onClick={() => setPreviewMode(p => !p)}
                                                                className={`ml-auto p-1 hover:bg-slate-700 rounded transition-colors ${previewMode ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
                                                                <span className="material-symbols-outlined text-sm">{previewMode ? 'edit' : 'visibility'}</span>
                                                            </button>
                                                        </div>
                                                        {previewMode ? (
                                                            <div
                                                                className="p-3 text-slate-300 text-sm min-h-[120px] prose prose-invert prose-sm max-w-none"
                                                                dangerouslySetInnerHTML={{ __html: watch('description') || '<p class="text-slate-500 italic">Nothing yet…</p>' }}
                                                            />
                                                        ) : (
                                                            <textarea
                                                                {...(() => {
                                                                    const { ref, ...rest } = register('description');
                                                                    return { ...rest, ref: (e) => { ref(e); descriptionRef.current = e; } };
                                                                })()}
                                                                className="w-full bg-transparent p-3 text-slate-300 focus:outline-none resize-none font-mono text-sm"
                                                                placeholder="Write the problem statement here..."
                                                                rows={6}
                                                            />
                                                        )}
                                                    </div>
                                                    {errors.description && <span className="text-red-400 text-xs mt-1 block">{errors.description.message}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visible Test Cases */}
                                        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-white font-semibold flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-blue-400">visibility</span>
                                                    Visible Test Cases
                                                </h4>
                                                <button
                                                    type="button"
                                                    onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                                                    className="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded-full font-medium transition-colors border border-blue-500/20"
                                                >
                                                    + Add Case
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                {visibleFields.map((field, index) => (
                                                    <div key={field.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700/60 relative group hover:border-blue-500/30 transition-colors">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeVisible(index)}
                                                            className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                        <p className="text-xs text-slate-500 font-mono mb-3">Case #{index + 1}</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 block">Input</span>
                                                                <textarea
                                                                    {...register(`visibleTestCases.${index}.input`)}
                                                                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs font-mono text-slate-300 focus:outline-none resize-none focus:border-blue-500 transition-colors"
                                                                    rows={2}
                                                                />
                                                                {errors.visibleTestCases?.[index]?.input && <span className="text-red-400 text-xs">{errors.visibleTestCases[index].input.message}</span>}
                                                            </div>
                                                            <div>
                                                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 block">Output</span>
                                                                <textarea
                                                                    {...register(`visibleTestCases.${index}.output`)}
                                                                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs font-mono text-slate-300 focus:outline-none resize-none focus:border-blue-500 transition-colors"
                                                                    rows={2}
                                                                />
                                                                {errors.visibleTestCases?.[index]?.output && <span className="text-red-400 text-xs">{errors.visibleTestCases[index].output.message}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="mt-3">
                                                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 block">Explanation</span>
                                                            <input
                                                                {...register(`visibleTestCases.${index}.explanation`)}
                                                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
                                                                placeholder="Because nums[0] + nums[1] == 9..."
                                                            />
                                                            {errors.visibleTestCases?.[index]?.explanation && <span className="text-red-400 text-xs">{errors.visibleTestCases[index].explanation.message}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── RIGHT COLUMN ────────────────────────── */}
                                    <div className="space-y-8">

                                        {/* Start Code */}
                                        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
                                            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-purple-400">code_blocks</span>
                                                Start Code (Boilerplate)
                                            </h4>
                                            <div className="space-y-4">
                                                {startCodeFields.map((field, index) => (
                                                    <div key={field.id} className="flex flex-col bg-slate-900 rounded-lg border border-slate-700/60 overflow-hidden">
                                                        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/60 border-b border-slate-700/60">
                                                            <select
                                                                {...register(`startCode.${index}.language`)}
                                                                className="bg-slate-900 text-xs text-slate-300 font-medium focus:outline-none cursor-pointer rounded"
                                                            >
                                                                <option value="c">C</option>
                                                                <option value="c++">C++</option>
                                                                <option value="java">Java</option>
                                                                <option value="python">Python 3</option>
                                                                <option value="javascript">JavaScript</option>
                                                            </select>
                                                            <button type="button" onClick={() => removeStart(index)} className="text-slate-500 hover:text-red-400 transition-colors">
                                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            {...register(`startCode.${index}.initialCode`)}
                                                            className="flex-1 p-4 bg-transparent font-mono text-xs text-slate-300 focus:outline-none resize-none leading-relaxed"
                                                            rows={6}
                                                            placeholder="# User writes code here&#10;pass"
                                                            spellCheck={false}
                                                        />
                                                        {errors.startCode?.[index]?.initialCode && <span className="text-red-400 text-xs px-3 pb-2">{errors.startCode[index].initialCode.message}</span>}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => appendStart({ language: 'python', initialCode: '' })}
                                                    className="w-full py-2.5 border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center gap-2 text-xs font-medium transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                                    Add Language
                                                </button>
                                            </div>
                                        </div>

                                        {/* Reference Solution */}
                                        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
                                            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-green-400">check_circle</span>
                                                Reference Solution
                                            </h4>
                                            <div className="space-y-4">
                                                {refFields.map((field, index) => (
                                                    <div key={field.id} className="flex flex-col bg-slate-900 rounded-lg border border-slate-700/60 overflow-hidden">
                                                        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/60 border-b border-slate-700/60">
                                                            <select
                                                                {...register(`referenceSolution.${index}.language`)}
                                                                className="bg-slate-900 text-xs text-slate-300 font-medium focus:outline-none cursor-pointer rounded"
                                                            >
                                                                <option value="c">C</option>
                                                                <option value="c++">C++</option>
                                                                <option value="java">Java</option>
                                                                <option value="python">Python 3</option>
                                                                <option value="javascript">JavaScript</option>
                                                            </select>
                                                            <button type="button" onClick={() => removeRef(index)} className="text-slate-500 hover:text-red-400 transition-colors">
                                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            {...register(`referenceSolution.${index}.completeCode`)}
                                                            className="flex-1 p-4 bg-transparent font-mono text-xs text-green-100/70 focus:outline-none resize-none leading-relaxed"
                                                            rows={6}
                                                            placeholder="# Complete working solution here"
                                                            spellCheck={false}
                                                        />
                                                        {errors.referenceSolution?.[index]?.completeCode && <span className="text-red-400 text-xs px-3 pb-2">{errors.referenceSolution[index].completeCode.message}</span>}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => appendRef({ language: 'python', completeCode: '' })}
                                                    className="w-full py-2.5 border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center gap-2 text-xs font-medium transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                                    Add Language
                                                </button>
                                            </div>
                                        </div>

                                        {/* Hidden Test Cases */}
                                        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-white font-semibold flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-amber-500">lock</span>
                                                    Hidden Test Cases
                                                </h4>
                                                <button
                                                    type="button"
                                                    onClick={() => appendHidden({ input: '', output: '' })}
                                                    className="text-xs bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 px-3 py-1.5 rounded-full font-medium transition-colors border border-amber-500/20"
                                                >
                                                    + Add Case
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                {hiddenFields.map((field, index) => (
                                                    <div key={field.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700/60 border-l-2 border-l-amber-500/50 relative group">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeHidden(index)}
                                                            className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                        <p className="text-xs text-slate-500 font-mono mb-3">Hidden Case #{index + 1}</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 block">Input</span>
                                                                <textarea
                                                                    {...register(`hiddenTestCases.${index}.input`)}
                                                                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs font-mono text-slate-300 focus:outline-none resize-none focus:border-amber-500/50 transition-colors"
                                                                    rows={2}
                                                                />
                                                                {errors.hiddenTestCases?.[index]?.input && <span className="text-red-400 text-xs">{errors.hiddenTestCases[index].input.message}</span>}
                                                            </div>
                                                            <div>
                                                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 block">Output</span>
                                                                <textarea
                                                                    {...register(`hiddenTestCases.${index}.output`)}
                                                                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs font-mono text-slate-300 focus:outline-none resize-none focus:border-amber-500/50 transition-colors"
                                                                    rows={2}
                                                                />
                                                                {errors.hiddenTestCases?.[index]?.output && <span className="text-red-400 text-xs">{errors.hiddenTestCases[index].output.message}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            )}

                            {/* Modal footer */}
                            <div className="p-6 border-t border-slate-700/60 flex items-center justify-between rounded-b-xl flex-shrink-0"
                                style={{ background: '#1e293b' }}>
                                <label className="relative inline-flex items-center cursor-pointer gap-2">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={publishNow}
                                            onChange={e => setPublishNow(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-300">Publish Immediately</span>
                                </label>

                                {statusMessage && (
                                    <span className={`text-xs font-medium ${statusMessage.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {statusMessage}
                                    </span>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-5 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:bg-white/5 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/25 transition-colors flex items-center gap-2 disabled:opacity-60"
                                    >
                                        {isLoading ? (
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <span className="material-symbols-outlined text-[18px]">save</span>
                                        )}
                                        {isLoading ? 'Saving…' : 'Save Problem'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;