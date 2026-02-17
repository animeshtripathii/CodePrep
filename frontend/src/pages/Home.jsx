import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import axiosClient from '../api/axiosClient'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const Home = () => {
  // ... existing hooks ...
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filter, setFilter] = useState({
    difficulty: "all",
    status: "all",
    tag: "all",
  });

  // ... memoized solvedProblemIds ...
  const solvedProblemIds = React.useMemo(() => {
    if (!user || !user.problemSolved) return new Set();
    return new Set(user.problemSolved.map(p => {
        const id = (p && typeof p === 'object' && p._id) ? p._id : p;
        return String(id);
    }));
  }, [user]);

  // ... allTags calculation ...
  const allTags = [...new Set(problems.flatMap(p => p.tags || []))].sort();
  
  // 1. UPDATE: Add filters and search to the dependency array
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        // 2. UPDATE: Construct Query String with search and filters
        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: 8,
          search: searchTerm, // Send search to backend
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

    // Debounce search to avoid too many API calls while typing
    const timeoutId = setTimeout(() => {
        fetchProblems();
    }, 500);

    return () => clearTimeout(timeoutId);

  }, [currentPage, searchTerm, filter.difficulty, filter.tag]); 
  // ^^^ Re-fetch when any of these change

  // 3. UPDATE: Client-side filter only handles 'Status' (Solved/Unsolved) 
  // because that usually depends on user data, not just problem data. 
  // (Unless your backend handles 'status' filtering too).
  const filteredProblems = problems.filter((problem) => {
    // Search and Difficulty are now handled by backend, 
    // but we keep Status filter here locally if backend doesn't support it.
    let matchesStatus = true;
    if (filter.status !== "all") {
        const problemId = String(problem._id);
        const isSolved = solvedProblemIds.has(problemId);

        if (filter.status === "solved") matchesStatus = isSolved;
        if (filter.status === "unsolved") matchesStatus = !isSolved;
    }

    return matchesStatus;
  });

  const getDifficultyColor = (difficulty) => {
     // ... existing code ...
     switch(difficulty?.toLowerCase()) {
      case 'easy': return 'bg-[#0dccf2]/10 text-[#0dccf2] border border-[#0dccf2]/20';
      case 'medium': return 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20';
      case 'hard': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default: return 'bg-white/10 text-white border border-white/20';
    }
  };

  return (
    // ... existing JSX ...
    // Note: Ensure you reset page to 1 when filters change if desired
    <div className="bg-[#050a0b] dark:bg-[#101f22] text-slate-300 min-h-screen font-sans selection:bg-[#0dccf2]/30 relative overflow-hidden transition-colors duration-300">
       {/* ... existing background elements ... */}
       <div className="absolute inset-0 bg-[radial-gradient(at_0%_0%,rgba(13,204,242,0.15)_0px,transparent_50%),radial-gradient(at_100%_100%,rgba(13,204,242,0.1)_0px,transparent_50%),radial-gradient(at_50%_50%,rgba(16,31,34,1)_0px,transparent_100%)] pointer-events-none -z-10"></div>
       <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0dccf2]/20 rounded-full blur-[100px] opacity-50"></div>
        <div className="absolute -bottom-40 -right-40 w-120 h-120 bg-[#0dccf2]/10 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-[#0dccf2]/10 rounded-full opacity-20 transform -translate-x-1/2 rotate-45" style={{borderWidth: '1px'}}></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 border border-[#0dccf2]/5 rounded-full opacity-20 transform translate-x-1/2 -rotate-12" style={{borderWidth: '1px'}}></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(13,204,242,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(13,204,242,0.03)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]"></div>
      </div>

      
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Problem Explorer</h1>
          <p className="text-slate-400">Browse through our collection of high-quality coding challenges.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-10 items-center">
          <div className="relative grow w-full lg:w-auto">
            <input 
              value={searchTerm}
              onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to page 1 on new search
              }}
              className="w-full bg-white text-slate-800 placeholder:text-slate-500 rounded-lg py-3 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0dccf2] shadow-sm" 
              placeholder="Search problems by title or keywords..." 
              type="text"
            />
          </div>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <select 
                value={filter.difficulty}
                onChange={(e) => {
                    setFilter({...filter, difficulty: e.target.value});
                    setCurrentPage(1); // Reset to page 1 on filter
                }}
                className="w-full appearance-none bg-[#1e293b] text-slate-300 rounded-lg py-3 pl-4 pr-10 text-sm cursor-pointer border border-slate-700/50 focus:border-[#0dccf2] focus:ring-0 outline-none hover:bg-[#283548] transition-colors"
              >
                <option value="all">Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-lg">expand_more</span>
            </div>
            
            <div className="relative flex-1 lg:flex-none">
              <select 
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
                className="w-full appearance-none bg-[#1e293b] text-slate-300 rounded-lg py-3 pl-4 pr-10 text-sm cursor-pointer border border-slate-700/50 focus:border-[#0dccf2] focus:ring-0 outline-none hover:bg-[#283548] transition-colors"
                title="Filter by Status"
              >
                <option value="all">Status</option>
                <option value="solved">Solved</option>
                <option value="unsolved">Unsolved</option>
              </select>
              <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-lg">expand_more</span>
            </div>
            
            <div className="relative flex-1 lg:flex-none">
              <select 
                value={filter.tag}
                onChange={(e) => {
                    setFilter({...filter, tag: e.target.value});
                    setCurrentPage(1); // Reset to page 1 on filter
                }}
                className="w-full appearance-none bg-[#1e293b] text-slate-300 rounded-lg py-3 pl-4 pr-10 text-sm cursor-pointer border border-slate-700/50 focus:border-[#0dccf2] focus:ring-0 outline-none hover:bg-[#283548] transition-colors"
              >
                <option value="all">All Tags</option>
                {allTags.map(tag => (
                   <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-lg">expand_more</span>
            </div>

            <button className="bg-[#0dccf2] hover:bg-[#0dccf2]/90 text-black font-semibold px-6 py-3 rounded-lg text-sm transition-all flex items-center gap-2 justify-center shadow-[0_0_15px_rgba(13,204,242,0.3)]">
              <span className="material-icons text-sm">tune</span>
              <span>Apply Filters</span>
            </button>
          </div>
        </div>

        {/* ... Rest of your JSX (Problem Grid, Pagination, Footer) ... */}
        {/* Note: I'm cutting the rest here to keep the answer concise, but you should keep the rest of your UI exactly as it was */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {filteredProblems.length > 0 ? (
            filteredProblems.map((problem) => {
              const problemId = String(problem._id);
              const isSolved = solvedProblemIds.has(problemId);

              return (
                <div key={problem._id} className="hover:border-[#0dccf2] hover:shadow-[0_0_20px_rgba(13,204,242,0.2)] hover:-translate-y-1 transition-all duration-300 rounded-xl p-5 flex flex-col group bg-[#101f22]/60 backdrop-blur-xl border border-white/10 relative overflow-hidden">
                  {/* Solved Sash */}
                  {isSolved && (
                    <div className="absolute top-0 right-0 bg-green-500/20 text-green-500 text-[10px] px-2 py-1 rounded-bl-xl border-l border-b border-green-500/20 font-bold tracking-wider flex items-center gap-1">
                       <span className="material-icons text-[12px]">check_circle</span> Solved
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty || 'Medium'}
                    </span>
                    <div className="flex items-center gap-1 text-slate-400">
                      <span className="material-icons text-xs text-[#0dccf2]">trending_up</span>
                      <span className="text-xs font-medium">{problem.acceptance || '65%'} Success</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-100 mb-2 leading-tight group-hover:text-[#0dccf2] transition-colors truncate">
                    {problem.title}
                  </h3>
                  
                  <p className="text-sm text-slate-400 mb-6 grow line-clamp-2 min-h-10">
                    {problem.description || "Solve this challenging problem to test your skills."}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div className="flex gap-2">
                       {/* Tags display ... */}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {(problem.tags && problem.tags[0]) ? problem.tags[0] : 'Algorithms'}
                      </span>
                    </div>
                    
                    <NavLink 
                      to={`/problems/${problem._id}`}
                      className="w-8 h-8 rounded-lg bg-[#0dccf2]/10 text-[#0dccf2] flex items-center justify-center hover:bg-[#0dccf2] hover:text-[#050a0b] transition-all"
                    >
                      <span className="material-icons text-lg">play_arrow</span>
                    </NavLink>
                  </div>
                </div>
              );
            })
          ) : (
            problems.length === 0 ? (
               // ... Loading skeletons ...
               <div>Loading...</div>
            ) : (
               <div className="col-span-full py-12 text-center text-slate-500">
                  <span className="material-icons text-4xl mb-2 text-slate-600">search_off</span>
                  <p>No problems found matching your filters.</p>
               </div>
            )
          )}
          
        </div>
        
        {/* Pagination ... */}
        <div className="mt-12 flex justify-center items-center gap-4">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              currentPage === 1 
                ? 'bg-[#1e293b]/50 text-slate-600 cursor-not-allowed border border-slate-700/30' 
                : 'bg-[#1e293b] text-slate-300 hover:text-[#0dccf2] hover:bg-[#283548] border border-slate-700/50 hover:border-[#0dccf2]/30 shadow-lg shadow-black/20'
            }`}
          >
            <span className="material-icons text-sm">arrow_back</span>
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] rounded-xl border border-slate-700/50">
            <span className="text-[#0dccf2] font-bold">{currentPage}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{totalPages}</span>
          </div>

          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              currentPage === totalPages 
                ? 'bg-[#1e293b]/50 text-slate-600 cursor-not-allowed border border-slate-700/30' 
                : 'bg-[#1e293b] text-slate-300 hover:text-[#0dccf2] hover:bg-[#283548] border border-slate-700/50 hover:border-[#0dccf2]/30 shadow-lg shadow-black/20'
            }`}
          >
            <span>Next</span>
            <span className="material-icons text-sm">arrow_forward</span>
          </button>
        </div>
        
      </main>

      <Footer />
    </div>
  )
}

export default Home
