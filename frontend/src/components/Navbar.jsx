import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from "../context/features/auth/authSlice.js";

const Navbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
      dispatch(logoutUser());
      // Optionally redirect if needed, but authSlice/App.jsx usually handles protected routes
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[#0dccf2]/10 bg-[#050a0b]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#0dccf2] rounded-lg flex items-center justify-center text-[#050a0b] group-hover:scale-105 transition-transform">
              <span className="material-icons text-xl font-bold">code</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white uppercase group-hover:text-[#0dccf2] transition-colors">
              Code<span className="text-[#0dccf2] group-hover:text-white transition-colors">Prep</span>
            </span>
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? "text-[#0dccf2] underline underline-offset-4 decoration-2" : "text-slate-300 hover:text-[#0dccf2]"}`}
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/" 
              className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? "text-[#0dccf2] underline underline-offset-4 decoration-2" : "text-slate-300 hover:text-[#0dccf2]"}`}
            >
              Problems
            </NavLink>
            <a className="text-sm font-medium text-slate-300 hover:text-[#0dccf2] transition-colors cursor-not-allowed opacity-70" title="Coming Soon">Contests</a>
            <a className="text-sm font-medium text-slate-300 hover:text-[#0dccf2] transition-colors cursor-not-allowed opacity-70" title="Coming Soon">Leaderboard</a>
            
            {/* Admin Link if user is admin */}
            {user?.role === 'admin' && (
              <NavLink 
                to="/admin" 
                className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? "text-[#0dccf2] underline underline-offset-4 decoration-2" : "text-slate-300 hover:text-[#0dccf2]"}`}
              >
                Admin Panel
              </NavLink>
            )}
          </div>
          
          {/* User Section */}
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
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-full bg-[#0dccf2]/10 border border-[#0dccf2]/30 flex items-center justify-center text-[#0dccf2] hover:bg-[#0dccf2] hover:text-black transition-colors"
                  title="Logout"
               >
                  <span className="material-icons text-sm">logout</span>
               </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
