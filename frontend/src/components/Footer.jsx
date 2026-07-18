import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ background: '#000000', borderTop: '1px solid #1a1a1e', fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
                style={{ background: 'linear-gradient(135deg, #FF4F00, #FF8C42)', boxShadow: '0 0 16px rgba(255,79,0,0.25)' }}>
                {'{}'}
              </div>
              <span className="text-white font-bold text-[15px] tracking-tight">
                Code<span style={{ color: '#FF4F00' }}>Prep</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#8A8B91' }}>
              Master data structures and algorithms with curated challenges, AI interviews, and peer coding sessions.
            </p>
            <div className="flex gap-2">
              {[
                { icon: 'public', label: 'Website' },
                { icon: 'mail', label: 'Email' },
                { icon: 'code', label: 'GitHub' },
              ].map(({ icon, label }) => (
                <a key={icon} href="#" title={label}
                  className="size-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: '#111112', border: '1px solid #222225', color: '#8A8B91' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,79,0,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,79,0,0.3)'; e.currentTarget.style.color = '#FF4F00'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#111112'; e.currentTarget.style.borderColor = '#222225'; e.currentTarget.style.color = '#8A8B91'; }}>
                  <span className="material-symbols-outlined text-[16px]">{icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#4a4a52' }}>Platform</h3>
            <ul className="space-y-2.5">
              {[
                { to: '/', label: 'Problems' },
                { to: '/dashboard', label: 'Dashboard' },
                { to: '/interview', label: 'AI Interview', badge: 'NEW' },
                { to: '/interview/peer', label: 'Peer Room', badge: 'NEW' },
                { to: '/discussions', label: 'Discussions' },
              ].map(({ to, label, badge }) => (
                <li key={to}>
                  <Link to={to} className="flex items-center gap-2 text-sm transition-colors"
                    style={{ color: '#8A8B91' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#F3F3F5'}
                    onMouseLeave={e => e.currentTarget.style.color = '#8A8B91'}>
                    {label}
                    {badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(255,79,0,0.1)', color: '#FF4F00', border: '1px solid rgba(255,79,0,0.2)' }}>
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#4a4a52' }}>Resources</h3>
            <ul className="space-y-2.5">
              {['Documentation', 'Blog', 'Community', 'Changelog'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm transition-colors" style={{ color: '#8A8B91' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#F3F3F5'}
                    onMouseLeave={e => e.currentTarget.style.color = '#8A8B91'}>{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#4a4a52' }}>Legal</h3>
            <ul className="space-y-2.5 mb-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm transition-colors" style={{ color: '#8A8B91' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#F3F3F5'}
                    onMouseLeave={e => e.currentTarget.style.color = '#8A8B91'}>{item}</a>
                </li>
              ))}
            </ul>
            <Link to="/plans">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,79,0,0.05)', border: '1px solid rgba(255,79,0,0.15)' }}>
                <div className="text-xs font-bold text-white mb-0.5">Upgrade to Pro ⚡</div>
                <div className="text-[11px]" style={{ color: '#8A8B91' }}>Unlock all features</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: '#1a1a1e' }}>
          <div className="flex items-center gap-3 text-xs" style={{ color: '#4a4a52' }}>
            <span>© {new Date().getFullYear()} CodePrep</span>
            <span className="size-1 rounded-full" style={{ background: '#333338' }} />
            <a href="#" style={{ color: '#4a4a52' }} onMouseEnter={e => e.currentTarget.style.color = '#8A8B91'} onMouseLeave={e => e.currentTarget.style.color = '#4a4a52'}>Terms</a>
            <span className="size-1 rounded-full" style={{ background: '#333338' }} />
            <a href="#" style={{ color: '#4a4a52' }} onMouseEnter={e => e.currentTarget.style.color = '#8A8B91'} onMouseLeave={e => e.currentTarget.style.color = '#4a4a52'}>Privacy</a>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <span className="size-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
            <span className="text-xs font-medium" style={{ color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
