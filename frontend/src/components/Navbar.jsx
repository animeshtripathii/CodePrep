import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../app/features/auth/authSlice.js';

const Navbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef(null);

  const handleLogout = () => { dispatch(logoutUser()); setDropdownOpen(false); };
  const initials = user?.firstName ? user.firstName.slice(0, 2).toUpperCase() : 'U';

  useEffect(() => {
    const handleClick = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navLinks = [
    { to: '/', label: 'Problems', icon: 'code' },
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/interview', label: 'Interview', icon: 'smart_toy', highlight: true },
    { to: '/discussions', label: 'Discuss', icon: 'forum' },
    { to: '/plans', label: 'Upgrade', icon: 'workspace_premium' },
  ];

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid #1a1a1e' }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div
            className="size-8 rounded-lg flex items-center justify-center text-white font-black text-sm transition-all duration-200 group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #FF4F00, #FF8C42)', boxShadow: '0 0 16px rgba(255,79,0,0.35)' }}
          >
            {'{}'}
          </div>
          <span className="text-white font-bold text-[15px] tracking-tight leading-none hidden sm:block">
            Code<span style={{ color: '#FF4F00' }}>Prep</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, icon, highlight }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 relative
                ${isActive
                  ? 'text-white bg-white/8'
                  : highlight
                    ? 'text-orange-400 hover:text-orange-300 hover:bg-white/5'
                    : 'text-[#8A8B91] hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="material-symbols-outlined text-[16px] leading-none"
                    style={{ color: isActive ? '#FF4F00' : highlight ? '#FF6363' : 'inherit' }}>
                    {icon}
                  </span>
                  {label}
                  {highlight && (
                    <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,79,0,0.15)', color: '#FF4F00', border: '1px solid rgba(255,79,0,0.3)' }}>
                      NEW
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-t-full"
                      style={{ background: '#FF4F00' }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive ? 'text-white bg-white/8' : 'text-[#8A8B91] hover:text-white hover:bg-white/5'}`
              }>
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              Admin
            </NavLink>
          )}
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Notification */}
          <button className="relative p-2 rounded-lg transition-colors hover:bg-white/5 text-[#8A8B91] hover:text-white hidden sm:flex items-center">
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            <span className="absolute top-2 right-2 size-1.5 rounded-full" style={{ background: '#FF4F00' }} />
          </button>

          {/* User dropdown */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all hover:bg-white/5"
            >
              <div className="size-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                style={{ background: 'linear-gradient(135deg, #FF4F00, #FF8C42)' }}>
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-white font-medium text-xs leading-none">{user?.firstName || 'User'}</div>
                <div className="text-[10px] mt-0.5" style={{ color: '#8A8B91' }}>{user?.role || 'member'}</div>
              </div>
              <span className="material-symbols-outlined text-[14px] text-[#8A8B91] hidden sm:block">expand_more</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden shadow-2xl"
                style={{ background: '#111112', border: '1px solid #222225', animation: 'slide-up 0.15s ease' }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: '#1a1a1e' }}>
                  <div className="text-white font-semibold text-sm">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: '#8A8B91' }}>{user?.emailId || user?.email}</div>
                </div>
                <div className="py-1.5">
                  {[
                    { to: '/dashboard', icon: 'person', label: 'Profile' },
                    { to: '/plans', icon: 'workspace_premium', label: 'Upgrade Plan' },
                  ].map(({ to, icon, label }) => (
                    <Link key={to} to={to} onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-white/5"
                      style={{ color: '#8A8B91' }}>
                      <span className="material-symbols-outlined text-[16px]">{icon}</span>
                      {label}
                    </Link>
                  ))}
                </div>
                <div className="py-1.5 border-t" style={{ borderColor: '#1a1a1e' }}>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-red-500/10"
                    style={{ color: '#ef4444' }}>
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 text-[#8A8B91]">
            <span className="material-symbols-outlined text-[20px]">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t px-4 py-3 flex flex-col gap-1" style={{ borderColor: '#1a1a1e', background: '#000000' }}>
          {navLinks.map(({ to, label, icon, highlight }) => (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'text-white bg-white/8' : highlight ? 'text-orange-400' : 'text-[#8A8B91]'}`
              }>
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              {label}
              {highlight && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,79,0,0.2)', color: '#FF4F00' }}>NEW</span>}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;
