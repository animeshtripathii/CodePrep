import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import axiosClient from '../utils/axiosClient'
import { logoutUser, checkAuthStatus } from "../app/features/auth/authSlice.js"

const Home = () => {
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

  // Memoize solved problem IDs for performance and consistency
  const solvedProblemIds = React.useMemo(() => {
    if (!user || !user.problemSolved) return new Set();
    return new Set(user.problemSolved.map(p => {
        // Handle both populated objects (with _id) and raw ID strings
        const id = (p && typeof p === 'object' && p._id) ? p._id : p;
        return String(id);
    }));
  }, [user]);

  // Get all unique tags from problems for the dropdown
  const allTags = [...new Set(problems.flatMap(p => p.tags || []))].sort();
  
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await axiosClient.get(`/problem/getAllProblem?page=${currentPage}&limit=8`);
        setProblems(response.data.problems || []); 
        setTotalPages(response.data.totalPages || 1);
      } catch (error) {
        // console.error("Error fetching problems:", error);
      }
    };
    fetchProblems();
  }, [currentPage]); // Re-fetch when page changes

  // Filter Logic
  const filteredProblems = problems.filter((problem) => {
    // 1. Search Term
    const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Difficulty
    const matchesDifficulty = 
      filter.difficulty === "all" || 
      (problem.difficulty && problem.difficulty.toLowerCase() === filter.difficulty.toLowerCase());

    // 3. Status (Solved/Unsolved)
    let matchesStatus = true;
    if (filter.status !== "all") {
        const problemId = String(problem._id);
        const isSolved = solvedProblemIds.has(problemId);

        if (filter.status === "solved") matchesStatus = isSolved;
        if (filter.status === "unsolved") matchesStatus = !isSolved;
    }

    // 4. Tag (Specific Tags)
    const matchesTag = 
      filter.tag === "all" ||
      (problem.tags && problem.tags.some(t => t.toLowerCase() === filter.tag.toLowerCase()));

    return matchesSearch && matchesDifficulty && matchesStatus && matchesTag;
  });

  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'easy': return 'bg-[#0dccf2]/10 text-[#0dccf2] border border-[#0dccf2]/20';
      case 'medium': return 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20';
      case 'hard': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default: return 'bg-white/10 text-white border border-white/20';
    }
  };

  return (
    <div className="bg-[#050a0b] dark:bg-[#101f22] text-slate-300 min-h-screen font-sans selection:bg-[#0dccf2]/30 relative overflow-hidden transition-colors duration-300">
      
       {/* Background Mesh Gradient (Matches Login/Signup) */}
       <div className="absolute inset-0 bg-[radial-gradient(at_0%_0%,rgba(13,204,242,0.15)_0px,transparent_50%),radial-gradient(at_100%_100%,rgba(13,204,242,0.1)_0px,transparent_50%),radial-gradient(at_50%_50%,rgba(16,31,34,1)_0px,transparent_100%)] pointer-events-none -z-10"></div>
      
       {/* Decorative 3D Elements (Blurred Orbs/Grid) - Matches Login/Signup */}
       <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Top Left Glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0dccf2]/20 rounded-full blur-[100px] opacity-50"></div>
        {/* Bottom Right Glow */}
        <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-[#0dccf2]/10 rounded-full blur-[120px] opacity-40"></div>
        {/* Abstract Geometric Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-[#0dccf2]/10 rounded-full opacity-20 transform -translate-x-1/2 rotate-45" style={{borderWidth: '1px'}}></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 border border-[#0dccf2]/5 rounded-full opacity-20 transform translate-x-1/2 -rotate-12" style={{borderWidth: '1px'}}></div>
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(13,204,242,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(13,204,242,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]"></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#0dccf2]/10 bg-[#050a0b]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0dccf2] rounded-lg flex items-center justify-center text-[#050a0b]">
                <span className="material-icons text-xl font-bold">code</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white uppercase">Code<span className="text-[#0dccf2]">Prep</span></span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a className="text-sm font-medium hover:text-[#0dccf2] transition-colors" href="#">Dashboard</a>
              <a className="text-sm font-medium text-[#0dccf2] underline underline-offset-4 decoration-2" href="#">Problems</a>
              <a className="text-sm font-medium hover:text-[#0dccf2] transition-colors" href="#">Contests</a>
              <a className="text-sm font-medium hover:text-[#0dccf2] transition-colors" href="#">Leaderboard</a>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full hover:bg-[#0dccf2]/10 transition-colors">
                <span className="material-icons text-slate-400">notifications</span>
              </button>
              
              <div className="flex items-center gap-3 border-l border-white/10 pl-4">
                 <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">User</div>
                    <div className="text-sm font-bold text-white leading-none">{user?.firstName || 'GUEST'}</div>
                 </div>
                 <button 
                    onClick={() => dispatch(logoutUser())}
                    className="w-8 h-8 rounded-full bg-[#0dccf2]/10 border border-[#0dccf2]/30 flex items-center justify-center text-[#0dccf2] hover:bg-[#0dccf2] hover:text-black transition-colors"
                 >
                    <span className="material-icons text-sm">logout</span>
                 </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">

        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Problem Explorer</h1>
          <p className="text-slate-400">Browse through our collection of high-quality coding challenges.</p>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-10 items-center">
          <div className="relative flex-grow w-full lg:w-auto">
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-slate-800 placeholder:text-slate-500 rounded-lg py-3 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0dccf2] shadow-sm" 
              placeholder="Search problems by title or keywords..." 
              type="text"
            />
          </div>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <select 
                value={filter.difficulty}
                onChange={(e) => setFilter({...filter, difficulty: e.target.value})}
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
                onChange={(e) => setFilter({...filter, tag: e.target.value})}
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

        {/* Problem Grid */}
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
                  
                  <p className="text-sm text-slate-400 mb-6 flex-grow line-clamp-2 min-h-[40px]">
                    {problem.description || "Solve this challenging problem to test your skills."}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div className="flex gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {(problem.tags && problem.tags[0]) ? problem.tags[0] : 'Algorithms'}
                      </span>
                      {(problem.tags && problem.tags[1]) && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            {problem.tags[1]}
                          </span>
                      )}
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
            // No results or Loading state logic
            // Since we filter client side, if problems.length > 0 but filtered is 0, show "No results"
            // If problems.length is 0, show "Loading" (assuming initial fetch is happening)
            problems.length === 0 ? (
               // Loading Skeletons for initial load
               [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="hover:border-[#0dccf2] hover:shadow-[0_0_20px_rgba(13,204,242,0.2)] hover:-translate-y-1 transition-all duration-300 rounded-xl p-5 flex flex-col group bg-[#101f22]/60 backdrop-blur-xl border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase bg-[#0dccf2]/10 text-[#0dccf2] border border-[#0dccf2]/20">Easy</span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="material-icons text-xs">trending_up</span>
                        <span className="text-xs font-medium">Loading...</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-100 mb-2 leading-tight group-hover:text-[#0dccf2] transition-colors">Loading Challenge...</h3>
                    <p className="text-sm text-slate-400 mb-6 flex-grow line-clamp-2">Please wait while we fetch the latest coding problems for you.</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                       <div className="w-8 h-8 rounded-lg bg-[#0dccf2]/10 animate-pulse"></div>
                    </div>
                  </div>
               ))
            ) : (
               // No Matches found
               <div className="col-span-full py-12 text-center text-slate-500">
                  <span className="material-icons text-4xl mb-2 text-slate-600">search_off</span>
                  <p>No problems found matching your filters.</p>
               </div>
            )
          )}
          
        </div>

        {/* Pagination Controls */}
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

      {/* Footer Information */}
      <footer className="mt-20 border-t border-white/5 py-12 bg-[#050a0b]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-[#0dccf2] rounded flex items-center justify-center text-[#050a0b]">
                  <span className="material-icons text-sm font-bold">code</span>
                </div>
                <span className="text-lg font-bold text-white uppercase">Code<span className="text-[#0dccf2]">Prep</span></span>
              </div>
              <p className="text-slate-400 text-sm max-w-sm">The ultimate platform for sharpening your technical skills through competitive programming and real-world software engineering challenges.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="text-slate-400 text-sm space-y-2">
                <li><a className="hover:text-[#0dccf2] transition-colors" href="#">Documentation</a></li>
                <li><a className="hover:text-[#0dccf2] transition-colors" href="#">API Reference</a></li>
                <li><a className="hover:text-[#0dccf2] transition-colors" href="#">Community Forum</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="text-slate-400 text-sm space-y-2">
                <li><a className="hover:text-[#0dccf2] transition-colors" href="#">Help Center</a></li>
                <li><a className="hover:text-[#0dccf2] transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-[#0dccf2] transition-colors" href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-slate-500 text-xs">
            <p>© 2024 CodePrep Interactive. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a className="hover:text-[#0dccf2] transition-colors" href="#">Twitter</a>
              <a className="hover:text-[#0dccf2] transition-colors" href="#">Discord</a>
              <a className="hover:text-[#0dccf2] transition-colors" href="#">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
