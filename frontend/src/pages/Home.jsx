import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import axiosClient from '../utils/axiosClient'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState(null);
  const [loadingSolved, setLoadingSolved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({ difficulty: 'all', status: 'all', tag: 'all' });

  const solvedProblemIds = React.useMemo(() => {
    if (!user || !user.problemSolved) return new Set();
    return new Set(user.problemSolved.map(p => {
      const id = (p && typeof p === 'object' && p._id) ? p._id : p;
      return String(id);
    }));
  }, [user]);

  const allTags = React.useMemo(
    () => [...new Set(problems.flatMap(p => p.tags || []))].sort(),
    [problems]
  );

  const problemOfTheDay = React.useMemo(() => {
    if (!problems || problems.length === 0) return null;
    const today = new Date();
    const hash = today.getFullYear() * 100 + today.getMonth() * 31 + today.getDate();
    return problems[hash % problems.length];
  }, [problems]);

  useEffect(() => {
    if (filter.status === 'solved') return;
    const fetchProblems = async () => {
      try {
        const params = new URLSearchParams({
          page: currentPage, limit: 10, search: searchTerm,
          difficulty: filter.difficulty !== 'all' ? filter.difficulty : '',
          tag: filter.tag !== 'all' ? filter.tag : ''
        });
        const res = await axiosClient.get(`/problem/getAllProblem?${params}`);
        setProblems(res.data.problems || []);
        setTotalPages(res.data.totalPages || 1);
      } catch (e) {}
    };
    const t = setTimeout(fetchProblems, 400);
    return () => clearTimeout(t);
  }, [currentPage, searchTerm, filter.difficulty, filter.tag, filter.status]);

  useEffect(() => {
    if (filter.status !== 'solved') { setSolvedProblems(null); return; }
    setLoadingSolved(true);
    axiosClient.get('/problem/problemSolvedByUser')
      .then(r => setSolvedProblems(r.data.user || []))
      .catch(() => setSolvedProblems([]))
      .finally(() => setLoadingSolved(false));
  }, [filter.status]);

  const displayedProblems = React.useMemo(() => {
    if (filter.status === 'solved') return solvedProblems || [];
    if (filter.status === 'unsolved') return problems.filter(p => !solvedProblemIds.has(String(p._id)));
    return problems;
  }, [filter.status, problems, solvedProblems, solvedProblemIds]);

  const handleFilterChange = (key, value) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const getDifficultyClass = (d) => {
    switch (d?.toLowerCase()) {
      case 'easy': return 'badge-easy';
      case 'medium': return 'badge-medium';
      case 'hard': return 'badge-hard';
      default: return '';
    }
  };

  return (
    <div style={{ background: '#000000', minHeight: '100vh', color: '#F3F3F5', fontFamily: 'Inter, sans-serif' }}
      className="flex flex-col">
      <Navbar />

      <div className="flex flex-1 w-full max-w-[1440px] mx-auto">

        {/* ── Left Sidebar ── */}
        <aside className="hidden lg:flex w-64 flex-col shrink-0 h-[calc(100vh-56px)] sticky top-14 border-r"
          style={{ borderColor: '#1a1a1e', background: '#000000' }}>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 hide-scrollbar">

            {/* Problem of the Day */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[14px]" style={{ color: '#FF4F00' }}>local_fire_department</span>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8A8B91' }}>Daily Challenge</span>
              </div>
              {problemOfTheDay ? (
                <div className="rc-card-orange p-3 cursor-pointer group"
                  onClick={() => window.location.href = `/editor/${problemOfTheDay._id}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-semibold text-white leading-snug group-hover:text-orange-400 transition-colors line-clamp-2">
                      {problemOfTheDay.title}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize shrink-0 ${getDifficultyClass(problemOfTheDay.difficulty)}`}>
                      {problemOfTheDay.difficulty}
                    </span>
                  </div>
                  <p className="text-[11px] mb-3 leading-relaxed" style={{ color: '#8A8B91' }}>
                    Solve today's featured problem and earn XP!
                  </p>
                  <button className="w-full py-1.5 text-xs font-semibold rounded-lg transition-all"
                    style={{ background: 'rgba(255,79,0,0.12)', color: '#FF4F00', border: '1px solid rgba(255,79,0,0.25)' }}>
                    Solve Now →
                  </button>
                </div>
              ) : (
                <div className="rc-card p-4 flex justify-center items-center h-28">
                  <div className="size-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#FF4F00', borderTopColor: 'transparent' }} />
                </div>
              )}
            </div>

            {/* Categories */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[14px]" style={{ color: '#FF4F00' }}>category</span>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8A8B91' }}>Categories</span>
              </div>
              <nav className="flex flex-col gap-0.5">
                <button onClick={() => handleFilterChange('tag', 'all')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left w-full"
                  style={filter.tag === 'all'
                    ? { background: 'rgba(255,79,0,0.1)', color: '#FF4F00', border: '1px solid rgba(255,79,0,0.2)' }
                    : { color: '#8A8B91' }}>
                  <span className="material-symbols-outlined text-[14px]">apps</span>
                  <span className="font-medium">All Problems</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: '#1C1C1F', color: '#8A8B91' }}>{problems.length}</span>
                </button>
                {allTags.slice(0, 12).map(t => (
                  <button key={t} onClick={() => handleFilterChange('tag', t)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left w-full"
                    style={filter.tag === t
                      ? { background: 'rgba(255,79,0,0.1)', color: '#FF4F00' }
                      : { color: '#8A8B91' }}>
                    <span className="material-symbols-outlined text-[14px]">label</span>
                    <span className="truncate">{t}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Upgrade banner */}
          <div className="p-4 border-t" style={{ borderColor: '#1a1a1e' }}>
            <div className="p-3 rounded-xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1a0a00, #2a1200)', border: '1px solid rgba(255,79,0,0.2)' }}>
              <div className="absolute -top-4 -right-4 text-6xl opacity-10">⚡</div>
              <div className="text-sm font-bold text-white mb-1">Go Pro</div>
              <div className="text-[11px] mb-2.5" style={{ color: '#8A8B91' }}>Unlock exclusive company questions</div>
              <NavLink to="/plans">
                <button className="w-full py-1.5 text-xs font-bold rounded-lg" style={{ background: '#FF4F00', color: 'white' }}>
                  Upgrade Now
                </button>
              </NavLink>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 flex flex-col p-6 min-w-0">

          {/* Interview Feature Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <NavLink to="/interview/ai">
              <div className="rc-card-orange p-4 cursor-pointer group flex items-center gap-4">
                <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,79,0,0.12)', border: '1px solid rgba(255,79,0,0.2)' }}>
                  <span className="material-symbols-outlined text-[22px]" style={{ color: '#FF4F00' }}>smart_toy</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-white">AI Mock Interview</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(255,79,0,0.15)', color: '#FF4F00', border: '1px solid rgba(255,79,0,0.3)' }}>NEW</span>
                  </div>
                  <p className="text-[11px]" style={{ color: '#8A8B91' }}>Practice with AI avatar — voice, hints & scoring</p>
                </div>
                <span className="material-symbols-outlined text-[18px] ml-auto shrink-0 transition-transform group-hover:translate-x-1" style={{ color: '#FF4F00' }}>arrow_forward</span>
              </div>
            </NavLink>
            <NavLink to="/interview/peer">
              <div className="rc-card p-4 cursor-pointer group flex items-center gap-4"
                style={{ borderColor: '#222225' }}>
                <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <span className="material-symbols-outlined text-[22px]" style={{ color: '#3b82f6' }}>group</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-white">Peer Interview Room</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>NEW</span>
                  </div>
                  <p className="text-[11px]" style={{ color: '#8A8B91' }}>Code together with live video, chat & editor</p>
                </div>
                <span className="material-symbols-outlined text-[18px] ml-auto shrink-0 transition-transform group-hover:translate-x-1" style={{ color: '#3b82f6' }}>arrow_forward</span>
              </div>
            </NavLink>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Problem Library</h1>
              <p className="text-sm mt-1" style={{ color: '#8A8B91' }}>2000+ coding challenges across all topics</p>
            </div>
            <button
              onClick={() => {
                if (problems.length > 0) window.location.href = `/editor/${problems[Math.floor(Math.random() * problems.length)]._id}`;
              }}
              className="btn-rc-secondary text-sm gap-1.5 self-start sm:self-auto">
              <span className="material-symbols-outlined text-[16px]">shuffle</span>
              Random
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#4a4a52' }}>search</span>
              <input
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="rc-input pl-10"
                placeholder="Search problems by title or tag..."
                type="text"
              />
            </div>
            <div className="flex gap-2">
              {[
                { key: 'difficulty', options: ['all', 'easy', 'medium', 'hard'], label: 'Difficulty' },
                { key: 'status', options: ['all', 'solved', 'unsolved'], label: 'Status' },
              ].map(({ key, options, label }) => (
                <select key={key} value={filter[key]}
                  onChange={e => handleFilterChange(key, e.target.value)}
                  className="rc-input !py-2 !px-3 !w-auto cursor-pointer text-sm min-w-[120px]">
                  <option value="all">{label}</option>
                  {options.filter(o => o !== 'all').map(o => (
                    <option key={o} value={o} className="capitalize">{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                  ))}
                </select>
              ))}
            </div>
          </div>

          {/* Active filters */}
          {(filter.difficulty !== 'all' || filter.status !== 'all' || filter.tag !== 'all') && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filter.difficulty !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium badge-medium">
                  {filter.difficulty}
                  <button onClick={() => handleFilterChange('difficulty', 'all')}><span className="material-symbols-outlined text-[12px]">close</span></button>
                </span>
              )}
              {filter.status !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium badge-easy">
                  {filter.status}
                  <button onClick={() => handleFilterChange('status', 'all')}><span className="material-symbols-outlined text-[12px]">close</span></button>
                </span>
              )}
              {filter.tag !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                  {filter.tag}
                  <button onClick={() => handleFilterChange('tag', 'all')}><span className="material-symbols-outlined text-[12px]">close</span></button>
                </span>
              )}
              <button onClick={() => { setFilter({ difficulty: 'all', status: 'all', tag: 'all' }); setCurrentPage(1); }}
                className="text-xs underline" style={{ color: '#8A8B91' }}>
                Clear all
              </button>
            </div>
          )}

          <div className="text-xs mb-3" style={{ color: '#4a4a52' }}>
            {filter.status === 'solved' && loadingSolved ? 'Loading…' : `${displayedProblems.length} problems found`}
          </div>

          {/* Problem Table */}
          <div className="rounded-xl overflow-hidden flex-1 flex flex-col" style={{ border: '1px solid #1a1a1e', background: '#000000' }}>
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-5 py-3 text-[10px] font-bold uppercase tracking-widest"
              style={{ background: '#0C0C0D', borderBottom: '1px solid #1a1a1e', color: '#4a4a52' }}>
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-6 md:col-span-5">Title</div>
              <div className="hidden md:block col-span-2">Acceptance</div>
              <div className="col-span-3 md:col-span-2">Difficulty</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            {/* Rows */}
            <div className="flex flex-col flex-1 divide-y" style={{ divideColor: '#0f0f10' }}>
              {filter.status === 'solved' && loadingSolved ? (
                <div className="flex-1 flex justify-center items-center p-12">
                  <div className="size-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#FF4F00', borderTopColor: 'transparent' }} />
                </div>
              ) : displayedProblems.length > 0 ? (
                displayedProblems.map((problem, idx) => {
                  const pid = String(problem._id);
                  const isSolved = filter.status === 'solved' ? true : solvedProblemIds.has(pid);
                  return (
                    <div key={problem._id}
                      className="group grid grid-cols-12 gap-3 px-5 py-3.5 items-center cursor-pointer transition-all"
                      style={{ borderBottom: '1px solid #0f0f10' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#0C0C0D'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => window.location.href = `/editor/${problem._id}`}>

                      <div className="col-span-1 flex justify-center">
                        {isSolved
                          ? <span className="material-symbols-outlined text-[18px]" style={{ color: '#10b981' }}>check_circle</span>
                          : <div className="size-4 rounded-full border transition-colors" style={{ borderColor: '#333338' }} />
                        }
                      </div>

                      <div className="col-span-6 md:col-span-5">
                        <div className="text-sm font-medium text-white group-hover:text-orange-400 transition-colors truncate">
                          {(currentPage - 1) * 10 + idx + 1}. {problem.title}
                        </div>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {(problem.tags || []).slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: '#1C1C1F', color: '#8A8B91' }}>{tag}</span>
                          ))}
                        </div>
                      </div>

                      <div className="hidden md:block col-span-2">
                        <span className="text-sm" style={{ color: '#4a4a52' }}>{problem.acceptance || '—'}</span>
                      </div>

                      <div className="col-span-3 md:col-span-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${getDifficultyClass(problem.difficulty)}`}>
                          {problem.difficulty || 'Medium'}
                        </span>
                      </div>

                      <div className="col-span-2 flex justify-end">
                        <button className="opacity-0 group-hover:opacity-100 transition-all text-xs font-semibold px-3 py-1.5 rounded-lg"
                          style={isSolved
                            ? { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }
                            : { background: '#FF4F00', color: 'white' }}>
                          {isSolved ? 'Revisit' : 'Solve'}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
                  <span className="material-symbols-outlined text-5xl mb-4 opacity-20" style={{ color: '#8A8B91' }}>search_off</span>
                  <p className="text-sm font-medium" style={{ color: '#8A8B91' }}>No problems match your filters</p>
                  <button onClick={() => { setSearchTerm(''); setFilter({ difficulty: 'all', status: 'all', tag: 'all' }); setCurrentPage(1); }}
                    className="btn-rc-secondary mt-4 text-sm">
                    Clear Filters
                  </button>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 flex items-center justify-between border-t" style={{ borderColor: '#1a1a1e', background: '#0C0C0D' }}>
              <span className="text-xs" style={{ color: '#4a4a52' }}>Page {currentPage} of {totalPages || 1}</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                    className="p-1.5 rounded-lg disabled:opacity-30 transition-colors hover:bg-white/5">
                    <span className="material-symbols-outlined text-[18px]" style={{ color: '#8A8B91' }}>chevron_left</span>
                  </button>
                  {getPageNumbers().map((p, i) =>
                    p === '...'
                      ? <span key={`d${i}`} className="px-2 text-sm" style={{ color: '#4a4a52' }}>…</span>
                      : <button key={p} onClick={() => setCurrentPage(p)}
                          className="size-8 rounded-lg text-sm font-medium transition-all"
                          style={currentPage === p
                            ? { background: '#FF4F00', color: 'white' }
                            : { color: '#8A8B91' }}
                          onMouseEnter={e => { if (currentPage !== p) e.target.style.background = '#1C1C1F'; }}
                          onMouseLeave={e => { if (currentPage !== p) e.target.style.background = 'transparent'; }}>
                          {p}
                        </button>
                  )}
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg disabled:opacity-30 transition-colors hover:bg-white/5">
                    <span className="material-symbols-outlined text-[18px]" style={{ color: '#8A8B91' }}>chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
