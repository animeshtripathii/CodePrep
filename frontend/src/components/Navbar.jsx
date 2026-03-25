import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../app/features/auth/authSlice.js';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    dispatch(logoutUser());
    setOpenMenu(false);
    navigate('/login');
  };

  const initials = user?.firstName
    ? user.firstName.slice(0, 2).toUpperCase()
    : 'GU';
  const displayName = `${user?.firstName || 'User'} ${user?.lastName || ''}`.trim();
  const availableTokens = Number.isFinite(Number(user?.tokens)) ? Number(user.tokens) : 0;

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    };

    window.addEventListener('mousedown', closeOnOutside);
    return () => window.removeEventListener('mousedown', closeOnOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap px-4 sm:px-8 py-3 border-b border-indigo-400/20 bg-[#070d1b]/80 backdrop-blur-xl">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-3 text-indigo-300 group">
          <div className="size-8 flex items-center justify-center bg-indigo-500 rounded-lg text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <span className="material-symbols-outlined text-[20px] leading-none">code</span>
          </div>
          <h2 className="text-white text-lg font-bold leading-tight tracking-tight group-hover:text-indigo-300 transition-colors">
            CodePrep
          </h2>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink
            to="/explore"
            className={({ isActive }) =>
              `text-sm font-medium transition-all duration-300 ${isActive ? 'text-indigo-300' : 'text-slate-300 hover:text-white'}`
            }
          >
            Problems
          </NavLink>
          <NavLink
            to="/mock-interview-setup"
            className={({ isActive }) =>
              `text-sm font-medium transition-all duration-300 ${isActive ? 'text-indigo-300' : 'text-slate-300 hover:text-white'}`
            }
          >
            Interview
          </NavLink>
          <NavLink
            to="/discussions"
            className={({ isActive }) =>
              `text-sm font-medium transition-all duration-300 ${isActive ? 'text-indigo-300' : 'text-slate-300 hover:text-white'}`
            }
          >
            Discuss
          </NavLink>
          <NavLink
            to="/plans"
            className={({ isActive }) =>
              `text-sm font-medium transition-all duration-300 ${isActive ? 'text-indigo-300' : 'text-slate-300 hover:text-white'}`
            }
          >
            Upgrade
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-3 relative" ref={menuRef}>
        <div className="relative group">
          <button
            onClick={() => setOpenMenu((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-indigo-500 text-white border border-indigo-300/40 overflow-hidden flex items-center justify-center text-xs font-bold">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <span className="material-symbols-outlined text-[18px] text-slate-300">expand_more</span>
          </button>
          <div className="pointer-events-none absolute right-0 top-11 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 rounded-lg border border-white/10 bg-[#0b1020]/95 px-3 py-2 text-xs text-slate-200 shadow-xl whitespace-nowrap">
            <div className="font-semibold text-white">{displayName}</div>
            <div className="text-indigo-300 mt-0.5">Tokens: {availableTokens}</div>
          </div>
        </div>

        {openMenu && (
          <div className="absolute right-0 top-12 z-60 w-44 rounded-xl border border-white/10 bg-[#0b1020]/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
            <button
              onClick={() => {
                navigate('/dashboard');
                setOpenMenu(false);
              }}
              className="block w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-white/10"
            >
              Dashboard
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  navigate('/admin');
                  setOpenMenu(false);
                }}
                className="block w-full text-left px-4 py-2.5 text-sm text-indigo-300 hover:bg-indigo-500/10"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={() => {
                navigate('/settings');
                setOpenMenu(false);
              }}
              className="block w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-white/10"
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
