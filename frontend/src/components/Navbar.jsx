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
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-10 py-3 shadow-sm font-display">
      {/* Left: Logo + nav links */}
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-3 text-green-600 group">
          <div className="size-8 flex items-center justify-center bg-green-600 rounded-lg text-white shadow-md shadow-green-500/20">
            <span className="material-symbols-outlined text-[20px] leading-none">code</span>
          </div>
          <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight group-hover:text-green-600 transition-colors">
            CodePrep
          </h2>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-green-600' : 'text-slate-600 hover:text-green-600'}`
            }
          >
            Problems
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-green-600' : 'text-slate-600 hover:text-green-600'}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/discussions"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-green-600' : 'text-slate-600 hover:text-green-600'}`
            }
          >
            Discussions
          </NavLink>
          <a
            className="text-sm font-medium text-slate-400 cursor-not-allowed"
            title="Coming Soon"
          >
            Contest
          </a>
          <NavLink
            to="/plans"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-green-600' : 'text-slate-600 hover:text-green-600'}`
            }
          >
            Upgrade
          </NavLink>

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-green-600' : 'text-slate-600 hover:text-green-600'}`
              }
            >
              Admin Panel
            </NavLink>
          )}
        </nav>
      </div>

      {/* Right: actions + user */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex w-full max-w-xs items-center rounded-lg bg-slate-100 border border-transparent focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600 transition-all">
            <div className="text-slate-400 flex items-center justify-center pl-3">
                <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input className="w-full bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 py-2 pl-2" placeholder="Search problems, users..."/>
        </div>
        <div className="flex gap-2">
            {/* Notification bell */}
            <button className="flex size-9 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors relative">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-green-600 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-9 w-[1px] bg-slate-200 mx-1"></div>
            
            {/* User section */}
            <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block mr-1">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Signed in as</div>
                    <div className="text-sm font-bold text-slate-900 leading-none">{user?.firstName || 'Guest'}</div>
                </div>

                {/* Avatar */}
                <div className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-green-500 text-white font-bold text-sm border-2 border-slate-100">
                    {initials}
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    title="Logout"
                    className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors ml-1"
                >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
