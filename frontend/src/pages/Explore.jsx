import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import '../styles/Explore.css';

const Explore = () => {
  const navigate = useNavigate();
  const solvedFromAuth = useSelector((state) => state.auth?.problemSolved || state.auth?.user?.problemSolved || []);
  const [problems, setProblems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(""); // mapped to 'solved', 'unsolved', 'attempted'
  const latestRequestIdRef = useRef(0);

  const difficulties = useMemo(() => ['Easy', 'Medium', 'Hard'], []);
  const topics = useMemo(() => ['Arrays', 'Strings', 'Two Pointers', 'Dynamic Programming', 'Graphs', 'Trees', 'Backtracking', 'Heaps'], []);

  const resetToFirstPage = useCallback(() => {
    setCurrentPage((prev) => (prev === 1 ? prev : 1));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      resetToFirstPage(); // Reset page on new search only when needed
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, resetToFirstPage]);

  const fetchProblems = useCallback(async (page, search, tag, difficulty, status) => {
    const requestId = ++latestRequestIdRef.current;
    setIsLoading(true);
    try {
      let url = `/problem/getAllProblem?page=${page}&limit=9`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (tag) url += `&tag=${encodeURIComponent(tag)}`;
      if (difficulty) url += `&difficulty=${encodeURIComponent(difficulty)}`;
      if (status) url += `&status=${encodeURIComponent(status)}`;
      
      const res = await axiosClient.get(url);
      if (requestId !== latestRequestIdRef.current) return;
      setProblems(res.data.problems || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching problems", error);
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchProblems(currentPage, debouncedSearch, selectedTag, selectedDifficulty, selectedStatus);
  }, [currentPage, debouncedSearch, selectedTag, selectedDifficulty, selectedStatus, fetchProblems]);

  // Handle tag selection
  const handleTagClick = useCallback((tag) => {
    if (selectedTag === tag) {
      setSelectedTag(""); // Deselect
    } else {
      setSelectedTag(tag);
      resetToFirstPage(); // Reset page
    }
  }, [selectedTag, resetToFirstPage]);

  const handleDifficultyClick = useCallback((diff) => {
    if (selectedDifficulty === diff) {
      setSelectedDifficulty(""); // Deselect
    } else {
      setSelectedDifficulty(diff);
      resetToFirstPage(); // Reset page
    }
  }, [selectedDifficulty, resetToFirstPage]);

  const handleStatusClick = useCallback((status) => {
    if (selectedStatus === status) {
      setSelectedStatus(""); // Deselect
    } else {
      setSelectedStatus(status);
      resetToFirstPage(); // Reset page
    }
  }, [selectedStatus, resetToFirstPage]);

  const difficultyTone = useCallback((difficulty = '') => {
    const normalized = String(difficulty).toLowerCase();
    if (normalized === 'easy') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (normalized === 'medium') return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  }, []);

  const solvedProblemIdSet = useMemo(() => {
    const ids = (Array.isArray(solvedFromAuth) ? solvedFromAuth : []).map((item) => {
      if (typeof item === 'string') return item;
      return item?._id || item?.id || null;
    }).filter(Boolean);
    return new Set(ids);
  }, [solvedFromAuth]);

  return (
    <div className="explore-page-wrapper text-slate-100 font-[Manrope] antialiased selection:bg-[#6366F1]/30 min-h-screen flex flex-col relative z-10 w-full">
      <div className="bg-orb-1"></div>
      <div className="bg-orb-2"></div>
      
      {/* Main Content Layout */}
      <div className="flex flex-1 overflow-hidden relative z-10 max-w-[1600px] mx-auto w-full h-[calc(100vh-61px)]">
        
        {/* Pinned Sidebar (280px) */}
        <aside className="w-[280px] hidden lg:flex flex-col h-full explore-glass-panel border-t-0 border-l-0 border-b-0 overflow-y-auto explore-scrollbar-hide py-6 px-5 shrink-0">
          <div className="mb-8">
            <h3 className="text-[#8B949E] text-[11px] font-bold uppercase tracking-widest mb-3">Status</h3>
            <div className="space-y-2">
              <label onClick={() => handleStatusClick('solved')} className="flex items-center gap-3 cursor-pointer group">
                <div className={`relative flex items-center justify-center size-5 rounded border transition-colors ${selectedStatus === 'solved' ? 'border-[#0EA5E9] bg-[#0EA5E9]/10' : 'border-white/20 bg-white/5 group-hover:border-white/40'}`}>
                  <span className={`material-symbols-outlined text-[14px] text-[#0EA5E9] transition-opacity ${selectedStatus === 'solved' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>check</span>
                </div>
                <span className={`text-sm transition-colors ${selectedStatus === 'solved' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>Solved</span>
              </label>
              <label onClick={() => handleStatusClick('unsolved')} className="flex items-center gap-3 cursor-pointer group">
                <div className={`relative flex items-center justify-center size-5 rounded border transition-colors ${selectedStatus === 'unsolved' ? 'border-[#8B949E] bg-[#8B949E]/10' : 'border-white/20 bg-white/5 group-hover:border-white/40'}`}>
                  <span className={`material-symbols-outlined text-[14px] text-[#8B949E] transition-opacity ${selectedStatus === 'unsolved' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>remove</span>
                </div>
                <span className={`text-sm transition-colors ${selectedStatus === 'unsolved' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>Unsolved</span>
              </label>
              <label onClick={() => handleStatusClick('attempted')} className="flex items-center gap-3 cursor-pointer group">
                <div className={`relative flex items-center justify-center size-5 rounded border transition-colors ${selectedStatus === 'attempted' ? 'border-[#8B5CF6] bg-[#8B5CF6]/10' : 'border-white/20 bg-white/5 group-hover:border-white/40'}`}>
                  <span className={`material-symbols-outlined text-[14px] text-[#8B5CF6] transition-opacity ${selectedStatus === 'attempted' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>schedule</span>
                </div>
                <span className={`text-sm transition-colors ${selectedStatus === 'attempted' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>Attempted</span>
              </label>
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-[#8B949E] text-[11px] font-bold uppercase tracking-widest mb-3">Difficulty</h3>
            <div className="flex flex-col gap-2">
              {difficulties.map(diff => (
                <button 
                  key={diff}
                  onClick={() => handleDifficultyClick(diff)}
                  className={`flex items-center justify-between px-3 py-2 rounded-md transition-all text-sm text-left group ${
                    selectedDifficulty === diff 
                      ? 'bg-white/10 border-white/20' 
                      : 'bg-white/5 hover:bg-white/10 border-white/5'
                  } border`}
                >
                  <span className={`${
                    diff === 'Easy' ? 'text-emerald-400 group-hover:text-emerald-300' :
                    diff === 'Medium' ? 'text-amber-400 group-hover:text-amber-300' :
                    'text-rose-500 group-hover:text-rose-400'
                  }`}>{diff}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-[#8B949E] text-[11px] font-bold uppercase tracking-widest mb-3">Topics</h3>
            <div className="flex flex-wrap gap-2">
              {topics.map(topic => (
                <button 
                  key={topic}
                  onClick={() => handleTagClick(topic.toLowerCase())}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedTag === topic.toLowerCase() 
                      ? 'border-[#6366F1] bg-[#6366F1]/20 text-white shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-auto pt-8">
            <div className="explore-glass-panel p-4 rounded-lg">
              <p className="text-xs text-[#8B949E] mb-2">Daily Goal</p>
              <div className="flex items-end justify-between mb-2">
                <span className="text-lg font-['Space_Grotesk'] font-bold">2/3</span>
                <span className="text-[10px] font-mono text-[#0EA5E9]">Problems</span>
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#0EA5E9] w-[66%] shadow-[0_0_8px_rgba(14,165,233,0.8)]"></div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-y-auto explore-scrollbar-hide">
          
          {/* Search Area */}
          <div className="p-6 pb-3 sticky top-0 z-40 bg-transparent backdrop-blur-md border-b border-white/10">
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-[#8B949E]">search</span>
              </div>
              <input 
                className="w-full h-16 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-white font-mono text-sm placeholder:text-[#8B949E] placeholder:font-mono focus:outline-none focus:ring-1 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] transition-all shadow-inner" 
                placeholder="> Search algorithms, topics, or problem numbers..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Grid Content */}
          <div className="p-6 pt-4 flex-1">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-['Space_Grotesk'] font-bold text-white tracking-tight capitalize">
                  {searchQuery ? `Search: ${searchQuery}` : selectedTag ? selectedTag : 'All Problems'}
                </h1>
                <span className="text-sm font-mono text-[#8B949E]">Showing {problems.length} problems</span>
              </div>
              
              {/* Masonry-ish Grid (Auto-fill) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-max">
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="explore-glass-card rounded-lg p-5 flex flex-col gap-4 explore-shimmer h-[140px]">
                      <div className="flex justify-between items-start">
                        <div className="w-3/4 h-5 bg-white/10 rounded"></div>
                        <div className="w-6 h-6 bg-white/10 rounded-full"></div>
                      </div>
                      <div className="flex gap-2 mt-auto">
                        <div className="w-16 h-4 bg-white/10 rounded"></div>
                        <div className="w-20 h-4 bg-white/10 rounded"></div>
                      </div>
                    </div>
                  ))
                ) : problems.length > 0 ? (
                  problems.map((problem, i) => {
                    const isSolved = Boolean(problem?.isSolved) || solvedProblemIdSet.has(problem._id);
                    return (
                    <button 
                      key={problem._id} 
                      onClick={() => navigate(`/editor/${problem._id}`)}
                      className="explore-glass-card rounded-lg p-5 flex flex-col gap-3 group text-left h-[140px] animate-fade-in-up"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-base font-['Space_Grotesk'] font-medium text-slate-100 group-hover:text-white leading-tight line-clamp-2">
                          {problem.title}
                        </h3>
                        <div className={`size-6 rounded-full border flex items-center justify-center shrink-0 ${isSolved ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300' : 'border-white/20 group-hover:border-white/40 text-transparent'}`}>
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#8B949E] line-clamp-2 mt-1">
                        {problem.description?.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-3 mt-auto pt-2">
                        <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${difficultyTone(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                      </div>
                    </button>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center text-[#8B949E] py-10">
                    No problems found.
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-[#8B949E] text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Explore;