import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import axiosClient from '../utils/axiosClient'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const Home = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState(null); // null = not fetched yet
  const [loadingSolved, setLoadingSolved] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filter, setFilter] = useState({
    difficulty: "all",
    status: "all",
    tag: "all",
  });

  // Set of IDs the user has already solved (from auth state, used for "Unsolved" filter)
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

  // ── Fetch paginated problems (all / difficulty / tag / search) ──
  useEffect(() => {
    if (filter.status === 'solved') return; // handled by separate effect

    const fetchProblems = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: 8,
          search: searchTerm,
          difficulty: filter.difficulty !== "all" ? filter.difficulty : "",
          tag: filter.tag !== "all" ? filter.tag : ""
        });
        const response = await axiosClient.get(`/problem/getAllProblem?${queryParams.toString()}`);
        setProblems(response.data.problems || []);
        setTotalPages(response.data.totalPages || 1);
      } catch (error) {
        // console.error("Error fetching problems:", error);
      }
    };

    const timeoutId = setTimeout(fetchProblems, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, filter.difficulty, filter.tag, filter.status]);

  // ── Fetch problems solved by user when status filter = 'solved' ──
  useEffect(() => {
    if (filter.status !== 'solved') {
      setSolvedProblems(null); // clear when not needed
      return;
    }
    const fetchSolvedProblems = async () => {
      setLoadingSolved(true);
      try {
        const response = await axiosClient.get('/problem/problemSolvedByUser');
        // API returns { count, user: [ ...problems ] }
        setSolvedProblems(response.data.user || []);
      } catch (error) {
        setSolvedProblems([]);
      } finally {
        setLoadingSolved(false);
      }
    };
    fetchSolvedProblems();
  }, [filter.status]);

  // ── Compute what to display ──
  const displayedProblems = React.useMemo(() => {
    if (filter.status === 'solved') {
      return solvedProblems || [];
    }
    if (filter.status === 'unsolved') {
      return problems.filter(p => !solvedProblemIds.has(String(p._id)));
    }
    return problems;
  }, [filter.status, problems, solvedProblems, solvedProblemIds]);


  const getDifficultyBadge = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'hard':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  // Helper: update one filter key and reset page to 1 atomically
  const handleFilterChange = (key, value) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Pagination page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };


  return (
    <div className="bg-[#101622] text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-[#135bec]/30">

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Main ── */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8">

        {/* ── Hero Section ── */}
        <section className="relative rounded-2xl overflow-hidden bg-[#1e293b] border border-slate-800 shadow-2xl">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#135bec]/10 via-[#101622] to-[#101622] pointer-events-none" />
          {/* BG icon */}
          <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none select-none">
            <span className="material-symbols-outlined text-[260px] text-white rotate-12 leading-none">terminal</span>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row gap-8 p-8 md:p-12 items-center justify-between">
            {/* Left: text + search */}
            <div className="flex flex-col gap-4 max-w-2xl text-center md:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 self-center md:self-start px-3 py-1 rounded-full bg-[#135bec]/10 border border-[#135bec]/25 text-[#135bec] text-xs font-bold uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#135bec] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#135bec]" />
                </span>
                New Challenges Added
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                Master the Code
              </h1>
              <p className="text-slate-400 text-lg md:text-xl max-w-xl">
                Sharpen your algorithms, data structures, and problem-solving skills with our extensive library of programming challenges.
              </p>

              {/* Search bar */}
              <div className="mt-4 flex w-full max-w-md shadow-lg shadow-black/20">
                <div className="relative w-full group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#135bec] transition-colors text-[20px]">search</span>
                  </div>
                  <input
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-l-lg leading-5 bg-[#0f172a] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#135bec] focus:border-[#135bec] sm:text-sm transition-all"
                    placeholder="Search by title, tag or ID"
                    type="text"
                  />
                </div>
                <button className="inline-flex items-center px-6 py-3 border border-transparent text-sm leading-5 font-bold rounded-r-lg text-white bg-[#135bec] hover:bg-[#135bec]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#135bec] transition-colors">
                  Search
                </button>
              </div>
            </div>

            {/* Right: Daily challenge card */}
            <div className="hidden lg:flex flex-col w-72 bg-[#1e293b]/50 backdrop-blur-sm border border-slate-700 rounded-xl p-5 hover:border-[#135bec]/50 transition-colors cursor-pointer group shrink-0">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <span className="material-symbols-outlined text-[22px]">calendar_today</span>
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-1 rounded">Daily Challenge</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#135bec] transition-colors">
                Minimize Deviation in Array
              </h3>
              <p className="text-xs text-slate-400 mb-4">Find the minimum deviation you can achieve after performing some operations on the array.</p>
              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-700/50">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/20">Hard</span>
                <span className="text-xs text-slate-400 ml-auto">Solves: 1.2k</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Filters & Table ── */}
        <div className="flex flex-col gap-6">

          {/* Tag filter pills */}
          <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Topics:</span>

            {/* Difficulty dropdown */}
            <div className="relative">
              <select
                value={filter.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="appearance-none bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 rounded-full px-4 py-1.5 pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#135bec] transition-colors"
              >
                <option value="all">All Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <span className="material-symbols-outlined text-slate-400 text-[14px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
            </div>

            {/* Status dropdown */}
            <div className="relative">
              <select
                value={filter.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="appearance-none bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 rounded-full px-4 py-1.5 pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#135bec] transition-colors"
              >
                <option value="all">All Status</option>
                <option value="solved">Solved</option>
                <option value="unsolved">Unsolved</option>
              </select>
              <span className="material-symbols-outlined text-slate-400 text-[14px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
            </div>

            {/* Tag dropdown */}
            <div className="relative">
              <select
                value={filter.tag}
                onChange={(e) => handleFilterChange('tag', e.target.value)}
                className="appearance-none bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 rounded-full px-4 py-1.5 pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#135bec] transition-colors"
              >
                <option value="all">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              <span className="material-symbols-outlined text-slate-400 text-[14px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
            </div>

            {/* Results count */}
            <span className="ml-auto text-xs text-slate-500">
              {filter.status === 'solved' && loadingSolved
                ? 'Loading…'
                : `${displayedProblems.length} problem${displayedProblems.length !== 1 ? 's' : ''} found`
              }
            </span>
          </div>

          {/* ── Problem Table ── */}
          <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-[#111722] shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#1e293b]/50 text-slate-400 font-semibold uppercase text-xs tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 w-16 text-center">Status</th>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Difficulty</th>
                    <th className="px-6 py-4">Acceptance</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {/* Loading spinner when fetching solved problems */}
                  {filter.status === 'solved' && loadingSolved ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="flex flex-col divide-y divide-slate-800/50">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-6 px-6 py-5 animate-pulse">
                              <div className="w-5 h-5 rounded-full bg-slate-800 mx-auto shrink-0" />
                              <div className="flex-1 space-y-2">
                                <div className="h-3.5 bg-slate-800 rounded w-2/5" />
                                <div className="h-2.5 bg-slate-800/60 rounded w-1/5" />
                              </div>
                              <div className="h-5 w-16 bg-slate-800 rounded-full" />
                              <div className="h-3.5 w-10 bg-slate-800 rounded" />
                              <div className="h-8 w-20 bg-slate-800 rounded-lg" />
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : displayedProblems.length > 0 ? (
                    displayedProblems.map((problem) => {
                      const problemId = String(problem._id);
                      const isSolved = filter.status === 'solved' ? true : solvedProblemIds.has(problemId);

                      return (
                        <tr key={problem._id} className="group hover:bg-white/[0.02] transition-colors">
                          {/* Status */}
                          <td className="px-6 py-4 text-center">
                            {isSolved ? (
                              <span className="material-symbols-outlined text-emerald-500 text-[20px]" title="Solved">check_circle</span>
                            ) : (
                              <span className="material-symbols-outlined text-slate-600 text-[20px]" title="Unsolved">radio_button_unchecked</span>
                            )}
                          </td>

                          {/* Title + Tags */}
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <NavLink
                                to={`/editor/${problem._id}`}
                                className="text-base font-medium text-slate-200 group-hover:text-[#135bec] transition-colors"
                              >
                                {problem.title}
                              </NavLink>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {(problem.tags || []).slice(0, 2).map((tag) => (
                                  <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>

                          {/* Difficulty */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getDifficultyBadge(problem.difficulty)}`}>
                              {problem.difficulty || 'Medium'}
                            </span>
                          </td>

                          {/* Acceptance */}
                          <td className="px-6 py-4 text-slate-400">
                            {problem.acceptance || '—'}
                          </td>

                          {/* Solve button */}
                          <td className="px-6 py-4 text-right">
                            <NavLink
                              to={`/editor/${problem._id}`}
                              className="inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-[#135bec] text-slate-300 hover:text-white border border-slate-700 hover:border-[#135bec] h-9 px-4 text-sm font-medium transition-all gap-1"
                            >
                              Solve
                              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </NavLink>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5}>
                        {problems.length === 0 && filter.status !== 'solved' ? (
                          /* Loading skeleton rows */
                          <div className="flex flex-col divide-y divide-slate-800/50">
                            {[...Array(6)].map((_, i) => (
                              <div key={i} className="flex items-center gap-6 px-6 py-5 animate-pulse">
                                <div className="w-5 h-5 rounded-full bg-slate-800 mx-auto shrink-0" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-3.5 bg-slate-800 rounded w-2/5" />
                                  <div className="h-2.5 bg-slate-800/60 rounded w-1/5" />
                                </div>
                                <div className="h-5 w-16 bg-slate-800 rounded-full" />
                                <div className="h-3.5 w-10 bg-slate-800 rounded" />
                                <div className="h-8 w-20 bg-slate-800 rounded-lg" />
                              </div>
                            ))}
                          </div>
                        ) : filter.status === 'solved' && solvedProblems !== null && solvedProblems.length === 0 ? (
                          <div className="py-16 text-center text-slate-500">
                            <span className="material-symbols-outlined text-5xl mb-3 text-emerald-800 block">emoji_events</span>
                            <p className="text-sm">You haven&apos;t solved any problems yet. Start solving!</p>
                          </div>
                        ) : (
                          <div className="py-16 text-center text-slate-500">
                            <span className="material-symbols-outlined text-5xl mb-3 text-slate-700 block">search_off</span>
                            <p className="text-sm">No problems found matching your filters.</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#1e293b]/30 border-t border-slate-800">
              <div className="text-sm text-slate-400">
                Page <span className="font-medium text-slate-200">{currentPage}</span> of <span className="font-medium text-slate-200">{totalPages}</span>
              </div>

              <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((pageNum, idx) =>
                  pageNum === '...' ? (
                    <span key={`dots-${idx}`} className="flex items-center justify-center h-9 w-9 text-slate-500 text-sm">…</span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`flex items-center justify-center h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-[#135bec] text-white shadow-lg shadow-[#135bec]/20'
                          : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
