import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from "../app/features/auth/authSlice.js";

const Navbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const initials = user?.firstName
    ? user.firstName.slice(0, 2).toUpperCase()
    : 'GU';

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-slate-800 bg-[#111722]/90 backdrop-blur-md px-6 py-3">
      {/* Left: Logo + nav links */}
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-3 text-white group">
          <div className="size-8 text-[#135bec]">
            <span className="material-symbols-outlined text-4xl leading-none">code_blocks</span>
          </div>
          <h2 className="text-xl font-bold leading-tight tracking-tight group-hover:text-[#135bec] transition-colors">
            CodePrep
          </h2>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-[#135bec]' : 'text-slate-300 hover:text-[#135bec]'}`
            }
          >
            Problems
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-[#135bec]' : 'text-slate-300 hover:text-[#135bec]'}`
            }
          >
            Dashboard
          </NavLink>
          <a
            className="text-sm font-medium text-slate-500 cursor-not-allowed"
            title="Coming Soon"
          >
            Contests
          </a>
          <a
            className="text-sm font-medium text-slate-500 cursor-not-allowed"
            title="Coming Soon"
          >
            Leaderboard
          </a>

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-[#135bec]' : 'text-slate-300 hover:text-[#135bec]'}`
              }
            >
              Admin Panel
            </NavLink>
          )}
        </nav>
      </div>

      {/* Right: actions + user */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative">
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#135bec] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#135bec]" />
          </span>
          <button className="flex items-center justify-center rounded-lg h-9 w-9 hover:bg-slate-800 text-slate-400 transition-colors">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>
        </div>

        {/* Streak */}
        <button className="flex items-center justify-center rounded-lg h-9 w-9 hover:bg-slate-800 text-slate-400 transition-colors">
          <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
        </button>

        <div className="h-6 w-px bg-slate-700 mx-1" />

        {/* User section */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block mr-1">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Signed in as</div>
            <div className="text-sm font-bold text-white leading-none">{user?.firstName || 'Guest'}</div>
          </div>

          {/* Avatar */}
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#135bec] to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-[#135bec]/20">
            {initials}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
