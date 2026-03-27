import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../app/features/auth/authSlice.js';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [openMenu, setOpenMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    dispatch(logoutUser());
    setOpenMenu(false);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const initials = user?.firstName ? user.firstName.slice(0, 2).toUpperCase() : 'GU';
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

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'auto';
  }, [mobileMenuOpen]);

  // Notice the <> fragment wrapper here!
  return (
    <>
      <header className="sticky top-0 z-[100] flex items-center justify-between px-4 sm:px-8 py-3 border-b border-indigo-400/20 bg-[#070d1b]/80 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 text-indigo-300 group">
            <div className="size-8 flex items-center justify-center bg-indigo-500 rounded-lg text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <span className="material-symbols-outlined text-[20px]">code</span>
            </div>
            <h2 className="text-white text-lg font-bold tracking-tight group-hover:text-indigo-300 transition-colors">
              CodePrep
            </h2>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {['Explore', 'Mock-Interview-Setup', 'Discussions', 'Plans'].map((path) => (
              <NavLink
                key={path}
                to={`/${path.toLowerCase()}`}
                className={({ isActive }) =>
                  `text-sm font-medium transition-all ${isActive ? 'text-indigo-300' : 'text-slate-300 hover:text-white'}`
                }
              >
                {path.replace('-', ' ')}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Desktop Profile */}
        <div className="hidden md:flex items-center gap-3 relative" ref={menuRef}>
          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold border border-white/20">
              {user?.profileImage ? <img src={user.profileImage} alt="Profile" className="rounded-full object-cover h-full w-full" /> : initials}
            </div>
            <span className="material-symbols-outlined text-[18px] text-slate-300">expand_more</span>
          </button>

          {openMenu && (
            <div className="absolute right-0 top-12 w-48 rounded-xl border border-white/10 bg-[#0b1020] shadow-2xl py-2 flex flex-col">
              <div className="px-4 py-2 border-b border-white/5 mb-1">
                <p className="text-xs text-white font-bold truncate">{displayName}</p>
                <p className="text-[10px] text-indigo-400">Tokens: {availableTokens}</p>
              </div>
              <button onClick={() => navigate('/dashboard')} className="text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Dashboard</button>
              {user?.role === 'admin' && <button onClick={() => navigate('/admin')} className="text-left px-4 py-2 text-sm text-amber-400 hover:bg-amber-400/5">Admin Panel</button>}
              <button onClick={() => navigate('/settings')} className="text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Settings</button>
              <hr className="border-white/5 my-1" />
              <button onClick={handleLogout} className="text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/5">Logout</button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button className="md:hidden p-2 text-slate-300 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(true)}>
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
      </header>

      {/* Mobile Slider Sidebar 
        MOVED OUTSIDE THE <header> TAG SO IT CAN TAKE FULL SCREEN HEIGHT 
      */}
      <div className={`fixed inset-0 z-[9999] md:hidden transition-all duration-300 ${mobileMenuOpen ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} 
          onClick={() => setMobileMenuOpen(false)} 
        />
        
        {/* Panel */}
        <div className={`absolute top-0 right-0 h-full w-[280px] bg-[#0a0f1d] shadow-2xl transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#0f172a]">
            <h3 className="text-white font-bold">Menu</h3>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors flex items-center">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pb-6">
            {/* Profile Info */}
            <div className="p-6 flex items-center gap-4 bg-indigo-500/5 border-b border-white/5">
              <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white border border-indigo-400/30 overflow-hidden shrink-0">
                {user?.profileImage ? <img src={user.profileImage} alt="Profile" className="object-cover h-full w-full" /> : initials}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-white font-bold truncate text-sm">{displayName}</p>
                <p className="text-indigo-400 text-xs flex items-center gap-1 font-semibold mt-1">
                   <span className="material-symbols-outlined text-[14px]">toll</span> {availableTokens} Tokens
                </p>
              </div>
            </div>

            {/* Links */}
            <nav className="p-4 flex flex-col gap-1">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 py-2">Navigation</p>
              <MobileNavLink to="/explore" icon="code_blocks" label="Problems" onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink to="/mock-interview-setup" icon="smart_toy" label="Interview" onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink to="/discussions" icon="forum" label="Discuss" onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink to="/plans" icon="workspace_premium" label="Upgrade" onClick={() => setMobileMenuOpen(false)} />
              
              <div className="h-px bg-white/5 my-4 mx-2" />
              
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 py-2">Account</p>
              <MobileNavLink to="/dashboard" icon="dashboard" label="Dashboard" onClick={() => setMobileMenuOpen(false)} />
              
              {user?.role === 'admin' && (
                <MobileNavLink to="/admin" icon="admin_panel_settings" label="Admin Panel" onClick={() => setMobileMenuOpen(false)} color="text-amber-400" />
              )}
              
              <MobileNavLink to="/settings" icon="settings" label="Settings" onClick={() => setMobileMenuOpen(false)} />
              
              <button onClick={handleLogout} className="flex items-center gap-4 px-4 py-3.5 w-full text-left text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors mt-4">
                <span className="material-symbols-outlined text-[22px]">logout</span>
                <span className="font-bold text-sm">Logout</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

// Helper Component for cleaner Mobile Links
const MobileNavLink = ({ to, icon, label, onClick, color = "text-slate-300" }) => (
  <NavLink 
    to={to} 
    onClick={onClick}
    className={({ isActive }) => `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg' : `${color} hover:bg-white/5 hover:text-white`}`}
  >
    <span className="material-symbols-outlined text-[22px]">{icon}</span>
    <span className="font-bold text-sm">{label}</span>
  </NavLink>
);

export default Navbar;