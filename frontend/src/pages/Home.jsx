import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import axiosClient from '../utils/axiosClient'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  const problemOfTheDay = React.useMemo(() => {
    if (!problems || problems.length === 0) return null;
    const today = new Date();
    const hash = today.getFullYear() * 100 + today.getMonth() * 31 + today.getDate();
    return problems[hash % problems.length];
  }, [problems]);

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


  const handlePickRandom = async () => {
    try {
      const response = await axiosClient.get('/problem/getRandomProblem');
      if (response.data.problemId) {
        navigate(`/editor/${response.data.problemId}`);
      }
    } catch (error) {
      // console.error("Error picking random problem:", error);
    }
  };

  return (
    <div className="bg-[#f8fcf9] text-[#0d1b12] min-h-screen flex flex-col font-sans antialiased selection:bg-[#13ec5b]/30">

      {/* ── Navbar ── */}
      <Navbar />

      <div className="flex flex-1 w-full max-w-[1440px] mx-auto">
        {/* Sidebar Filter */}
        <aside className="hidden lg:flex w-72 flex-col border-r border-[#e7f3eb] bg-[#f8fcf9] h-[calc(100vh-65px)] sticky top-[65px] flex-shrink-0 relative overflow-hidden">
          
          {/* Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 hide-scrollbar pb-4 block">
            {/* Problem of the Day */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4c9a66]">Problem of the Day</h3>
              {problemOfTheDay ? (
                <div className="p-4 bg-white rounded-xl border border-[#e7f3eb] flex flex-col shadow-sm hover:border-[#13ec5b]/50 transition-colors cursor-pointer group" onClick={() => window.location.href = `/editor/${problemOfTheDay._id}`}>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="font-bold text-sm text-[#0d1b12] group-hover:text-[#13ec5b] transition-colors line-clamp-2">{problemOfTheDay.title}</span>
                    <span className={`text-xs px-2 flex-shrink-0 py-0.5 rounded-full font-medium capitalize ${
                      problemOfTheDay.difficulty?.toLowerCase() === 'easy' ? 'bg-green-100 text-green-800' :
                      problemOfTheDay.difficulty?.toLowerCase() === 'medium' ? 'bg-amber-100 text-amber-800' :
                      problemOfTheDay.difficulty?.toLowerCase() === 'hard' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {problemOfTheDay.difficulty || 'Medium'}
                    </span>
                  </div>
                  <p className="text-xs text-[#4c9a66] mb-3 line-clamp-2">Challenge yourself with today&apos;s featured problem and improve your coding skills.</p>
                  <button className="w-full mt-auto py-1.5 bg-[#f8fcf9] hover:bg-[#e7f3eb] text-[#0d1b12] text-xs font-bold rounded shadow-sm border border-[#e7f3eb] transition-colors">Solve Challenge</button>
                </div>
              ) : (
                <div className="p-4 bg-white rounded-xl border border-[#e7f3eb] flex flex-col justify-center items-center shadow-sm h-[130px]">
                  <span className="w-5 h-5 border-2 border-[#13ec5b] border-t-transparent rounded-full animate-spin"></span>
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#4c9a66]">Categories</h3>
              </div>
              <nav className="flex flex-col gap-1">
                <button onClick={() => handleFilterChange('tag', 'all')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border shadow-sm group transition-all w-full text-left ${filter.tag === 'all' ? 'bg-white border-[#13ec5b]/50' : 'bg-transparent border-transparent hover:bg-white hover:border-[#13ec5b]/50'}`}>
                  <div className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${filter.tag === 'all' ? 'bg-[#13ec5b] text-black' : 'bg-green-50 text-green-700 group-hover:bg-[#13ec5b] group-hover:text-black'}`}>
                    <span className="material-symbols-outlined text-[20px]">view_list</span>
                  </div>
                  <span className={`text-sm font-semibold flex-1 ${filter.tag === 'all' ? 'text-[#0d1b12]' : 'text-slate-600 group-hover:text-[#0d1b12]'}`}>All Problems</span>
                  <span className="text-xs font-medium text-[#4c9a66] bg-gray-100 px-2 py-0.5 rounded-full">{problems.length}</span>
                </button>
                
                {allTags.slice(0, 10).map(t => (
                  <button key={t} onClick={() => handleFilterChange('tag', t)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border shadow-sm group transition-all w-full text-left ${filter.tag === t ? 'bg-white border-[#13ec5b]/50' : 'bg-transparent border-transparent hover:bg-white hover:border-[#13ec5b]/50'}`}>
                    <div className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${filter.tag === t ? 'bg-[#13ec5b] text-black' : 'bg-gray-50 text-gray-500 group-hover:text-[#13ec5b] group-hover:bg-green-50'}`}>
                      <span className="material-symbols-outlined text-[20px] font-light">label</span>
                    </div>
                    <span className={`text-sm font-medium flex-1 truncate ${filter.tag === t ? 'text-[#0d1b12] font-semibold' : 'text-slate-600 group-hover:text-[#0d1b12]'}`}>{t}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Upgrade Banner - Fixed at bottom */}
          <div className="shrink-0 p-6 pt-2 bg-gradient-to-t from-[#f8fcf9] via-[#f8fcf9] to-transparent z-10 relative">
            <div className="p-4 bg-gradient-to-br from-[#1b2532] to-[#151c28] rounded-xl text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-2 right-2 p-1 opacity-20">
                <span className="material-symbols-outlined text-[32px]">workspace_premium</span>
              </div>
              <h4 className="font-bold text-[15px] mb-1 z-10 relative tracking-wide">Upgrade to Pro</h4>
              <p className="text-xs text-slate-300 mb-3 z-10 relative max-w-[200px]">Get access to company specific questions.</p>
              <button className="w-full py-2 bg-[#13ec5b] hover:bg-[#0ecb4d] text-[#0d1b12] text-xs font-bold rounded-lg shadow-sm transition-colors z-10 relative tracking-wide">Unlock Now</button>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 flex flex-col p-6 lg:p-8 min-w-0">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-[#0d1b12] text-3xl md:text-4xl font-black leading-tight tracking-tight">Problem Library</h1>
              <p className="text-[#4c9a66] text-base font-normal">Sharpen your skills with over 2000+ coding challenges.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePickRandom}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e7f3eb] rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium text-[#0d1b12]"
              >
                <span className="material-symbols-outlined text-[20px] text-[#13ec5b]">shuffle</span>
                Pick Random
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="sticky top-[64px] z-40 bg-[#f8fcf9]/95 backdrop-blur-sm py-4 -mx-4 px-4 md:mx-0 md:px-0 md:static md:bg-transparent md:backdrop-blur-none md:py-0 md:mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group rounded-xl overflow-hidden shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[#4c9a66] text-[20px]">search</span>
                </div>
                <input 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="block w-full pl-10 pr-3 py-3 border-none ring-1 ring-[#e7f3eb] leading-5 bg-white placeholder-[#4c9a66] focus:outline-none focus:ring-2 focus:ring-[#13ec5b] focus:bg-white sm:text-sm transition-all text-[#0d1b12]" 
                  placeholder="Search questions by title, ID or tag" 
                  type="text"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                
                <div className="relative min-w-[120px]">
                  <select 
                    value={filter.difficulty}
                    onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                    className="appearance-none flex items-center justify-between w-full pl-4 pr-10 py-3 bg-white border border-[#e7f3eb] rounded-xl shadow-sm text-sm font-medium text-[#0d1b12] hover:border-[#13ec5b]/50 focus:outline-none focus:ring-2 focus:ring-[#13ec5b] transition-all whitespace-nowrap cursor-pointer"
                  >
                    <option value="all">Difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <span className="material-symbols-outlined text-[18px] text-[#4c9a66] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                </div>

                <div className="relative min-w-[120px]">
                  <select 
                    value={filter.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="appearance-none flex items-center justify-between w-full pl-4 pr-10 py-3 bg-white border border-[#e7f3eb] rounded-xl shadow-sm text-sm font-medium text-[#0d1b12] hover:border-[#13ec5b]/50 focus:outline-none focus:ring-2 focus:ring-[#13ec5b] transition-all whitespace-nowrap cursor-pointer"
                  >
                    <option value="all">Status</option>
                    <option value="solved">Solved</option>
                    <option value="unsolved">Unsolved</option>
                  </select>
                  <span className="material-symbols-outlined text-[18px] text-[#4c9a66] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                </div>

                <div className="relative min-w-[120px] lg:hidden">
                  <select 
                    value={filter.tag}
                    onChange={(e) => handleFilterChange('tag', e.target.value)}
                    className="appearance-none flex items-center justify-between w-full pl-4 pr-10 py-3 bg-white border border-[#e7f3eb] rounded-xl shadow-sm text-sm font-medium text-[#0d1b12] hover:border-[#13ec5b]/50 focus:outline-none focus:ring-2 focus:ring-[#13ec5b] transition-all whitespace-nowrap cursor-pointer"
                  >
                    <option value="all">Tags</option>
                    {allTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined text-[18px] text-[#4c9a66] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                </div>

              </div>
            </div>

            {/* Active Filters Display */}
            {(filter.difficulty !== 'all' || filter.status !== 'all' || filter.tag !== 'all') && (
              <div className="flex flex-wrap gap-2 mt-4 mb-2">
                {filter.difficulty !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    Difficulty: <span className="capitalize ml-1">{filter.difficulty}</span>
                    <button onClick={() => handleFilterChange('difficulty', 'all')} className="ml-1.5 inline-flex text-amber-600 hover:text-amber-900 focus:outline-none">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                )}
                {filter.status !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                    Status: <span className="capitalize ml-1">{filter.status}</span>
                    <button onClick={() => handleFilterChange('status', 'all')} className="ml-1.5 inline-flex text-blue-600 hover:text-blue-900 focus:outline-none">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                )}
                {filter.tag !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200">
                    Tag: <span className="capitalize ml-1">{filter.tag}</span>
                    <button onClick={() => handleFilterChange('tag', 'all')} className="ml-1.5 inline-flex text-purple-600 hover:text-purple-900 focus:outline-none">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                )}
                <button 
                  onClick={() => { handleFilterChange('difficulty', 'all'); handleFilterChange('status', 'all'); handleFilterChange('tag', 'all'); }} 
                  className="text-xs text-[#4c9a66] hover:text-[#13ec5b] underline ml-2"
                >
                  Clear all
                </button>
              </div>
            )}
            
            <span className="text-xs text-[#4c9a66] mb-2 block">
              {filter.status === 'solved' && loadingSolved
                ? 'Loading…'
                : `${displayedProblems.length} problem${displayedProblems.length !== 1 ? 's' : ''} found`
              }
            </span>
          </div>

          {/* Problem List Table */}
          <div className="bg-white border border-[#e7f3eb] rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col mt-4">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#e7f3eb] bg-gray-50/50 text-xs font-semibold text-[#4c9a66] uppercase tracking-wider">
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-6 md:col-span-5">Title</div>
              <div className="hidden md:block col-span-2">Acceptance</div>
              <div className="col-span-3 md:col-span-2">Difficulty</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            {/* List Items */}
            <div className="flex flex-col flex-1 divide-y divide-[#e7f3eb] min-h-[400px]">
              {filter.status === 'solved' && loadingSolved ? (
                <div className="p-12 flex justify-center w-full h-full items-center">
                  <span className="w-8 h-8 border-4 border-[#13ec5b] border-t-transparent rounded-full animate-spin"></span>
                </div>
              ) : displayedProblems.length > 0 ? (
                displayedProblems.map((problem) => {
                  const problemId = String(problem._id);
                  const isSolved = filter.status === 'solved' ? true : solvedProblemIds.has(problemId);
                  
                  const difficultyLower = problem.difficulty?.toLowerCase();
                  const badgeClasses = difficultyLower === 'easy' 
                    ? 'bg-green-100 text-green-800' 
                    : difficultyLower === 'medium'
                      ? 'bg-amber-100 text-amber-800'
                      : difficultyLower === 'hard'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-gray-100 text-gray-800';

                  return (
                    <div 
                      key={problem._id} 
                      className={`group grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-green-50/30 transition-colors cursor-pointer ${isSolved ? 'bg-slate-50/30' : ''}`}
                      onClick={() => window.location.href = `/editor/${problem._id}`}
                    >
                      <div className="col-span-1 flex justify-center">
                        {isSolved ? (
                          <span className="material-symbols-outlined text-[#13ec5b] text-[20px] font-bold">check_circle</span>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-[#13ec5b] transition-colors"></div>
                        )}
                      </div>
                      
                      <div className="col-span-6 md:col-span-5">
                        <h3 className="text-sm font-semibold text-[#0d1b12] group-hover:text-[#13ec5b] transition-colors truncate">
                          {problem.title}
                        </h3>
                        <div className="flex gap-2 mt-1.5 flex-wrap overflow-hidden h-5">
                          {(problem.tags || []).slice(0, 3).map((tag) => (
                            <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 truncate max-w-[100px]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="hidden md:block col-span-2">
                        <span className="text-sm text-[#4c9a66]">{problem.acceptance || '—'}</span>
                      </div>
                      
                      <div className="col-span-3 md:col-span-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${badgeClasses}`}>
                          {problem.difficulty || 'Medium'}
                        </span>
                      </div>
                      
                      <div className="col-span-2 flex justify-end">
                        {isSolved ? (
                          <button className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg bg-amber-300 text-[#0d1b12] text-xs font-bold shadow-sm hover:shadow-md">
                            Resume
                          </button>
                        ) : (
                          <button className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg bg-[#13ec5b] text-[#0d1b12] text-xs font-bold shadow-sm hover:shadow-md">
                            Solve
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-20 text-center text-[#4c9a66] flex flex-col justify-center items-center h-full">
                  <span className="material-symbols-outlined text-6xl mb-4 block opacity-40">search_off</span>
                  <p className="text-[15px] font-medium text-slate-500">No problems found matching your filters.</p>
                  <button 
                    onClick={() => { setSearchTerm(''); setFilter({difficulty: 'all', status: 'all', tag: 'all'}); setCurrentPage(1); }}
                    className="mt-4 px-4 py-2 border border-[#e7f3eb] rounded-lg text-sm font-medium text-[#0d1b12] hover:bg-gray-50 transition-colors bg-white shadow-sm"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-auto border-t border-[#e7f3eb] bg-gray-50/50 px-6 py-3 flex items-center justify-between">
              <span className="text-xs text-[#4c9a66]">
                Showing Page {currentPage} of {totalPages || 1}
              </span>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md text-[#4c9a66] hover:text-[#0d1b12] hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  
                  {getPageNumbers().map((pageNum, idx) => 
                    pageNum === '...' ? (
                      <span key={`dots-${idx}`} className="px-2 text-[#4c9a66] font-medium text-sm">...</span>
                    ) : (
                      <button 
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          currentPage === pageNum 
                            ? 'bg-[#13ec5b] text-[#0d1b12] shadow-sm' 
                            : 'text-[#4c9a66] hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  )}
                  
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md text-[#4c9a66] hover:text-[#0d1b12] hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
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
