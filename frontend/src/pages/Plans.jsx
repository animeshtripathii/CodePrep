import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'react-hot-toast';

const FREE_FEATURES = [
  'Access to 50+ problems',
  'Basic code editor',
  'Community discussions',
  '1 AI interview / month',
  'Progress tracking',
];

const PRO_FEATURES = [
  'Unlimited problems (2000+)',
  'Company-specific questions',
  'Unlimited AI mock interviews',
  'Unlimited peer interview rooms',
  'Advanced analytics & heatmap',
  'Priority support',
  'Resume review (coming soon)',
  'Mock contest rooms',
];

const Plans = () => {
  const { isAuthenticated, user } = useSelector(s => s.auth);
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState('monthly'); // monthly | annual

  useEffect(() => {
    axiosClient.get('/plan/all')
      .then(r => setPlans(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = (planId) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    toast('Coming soon! 🚀', { style: { background: '#1C1C1F', color: '#F3F3F5', border: '1px solid #333338' } });
  };

  return (
    <div style={{ background: '#000000', minHeight: '100vh', color: '#F3F3F5', fontFamily: 'Inter, sans-serif' }} className="flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="hero-glow text-center px-6 pt-16 pb-10">
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: 'rgba(255,79,0,0.1)', border: '1px solid rgba(255,79,0,0.2)', color: '#FF4F00' }}>
            <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
            Simple, Transparent Pricing
          </div>
          <h1 className="text-4xl font-black mb-3 text-white tracking-tight">
            Invest in your<br /><span className="text-gradient-orange">career growth</span>
          </h1>
          <p style={{ color: '#8A8B91' }}>Start free, upgrade when you're ready. No hidden fees.</p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className="text-sm" style={{ color: billing === 'monthly' ? '#F3F3F5' : '#8A8B91' }}>Monthly</span>
            <button onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ background: billing === 'annual' ? '#FF4F00' : '#222225' }}>
              <div className="absolute top-0.5 size-5 rounded-full bg-white transition-all"
                style={{ left: billing === 'annual' ? '26px' : '2px' }} />
            </button>
            <span className="text-sm flex items-center gap-1.5" style={{ color: billing === 'annual' ? '#F3F3F5' : '#8A8B91' }}>
              Annual
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                Save 30%
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="max-w-4xl mx-auto px-6 pb-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Free Plan */}
          <div className="rc-card rounded-2xl p-6 flex flex-col">
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#8A8B91' }}>Free</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-sm mb-1" style={{ color: '#8A8B91' }}>/forever</span>
              </div>
              <p className="text-sm" style={{ color: '#8A8B91' }}>Perfect for getting started</p>
            </div>

            <ul className="flex flex-col gap-2.5 mb-8 flex-1">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: '#8A8B91' }}>
                  <span className="material-symbols-outlined text-[16px]" style={{ color: '#4a4a52' }}>check</span>
                  {f}
                </li>
              ))}
            </ul>

            <button className="btn-rc-secondary w-full justify-center py-2.5">
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="rounded-2xl p-6 flex flex-col relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0f0500, #1a0800)', border: '1px solid rgba(255,79,0,0.3)', boxShadow: '0 0 40px rgba(255,79,0,0.1)' }}>

            {/* Most popular badge */}
            <div className="absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ background: '#FF4F00', color: 'white' }}>
              MOST POPULAR
            </div>

            {/* Glow effect */}
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,79,0,0.15), transparent)', pointerEvents: 'none' }} />

            <div className="mb-6 relative z-10">
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#FF4F00' }}>Pro</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-white">
                  ${billing === 'annual' ? '7' : '9'}
                </span>
                <span className="text-sm mb-1" style={{ color: '#8A8B91' }}>/month</span>
                {billing === 'annual' && <span className="text-xs mb-1 ml-1 line-through" style={{ color: '#4a4a52' }}>$9</span>}
              </div>
              <p className="text-sm" style={{ color: '#8A8B91' }}>
                {billing === 'annual' ? 'Billed $84/year' : 'Billed monthly'}
              </p>
            </div>

            <ul className="flex flex-col gap-2.5 mb-8 flex-1 relative z-10">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-white">
                  <span className="material-symbols-outlined text-[16px]" style={{ color: '#FF4F00' }}>check_circle</span>
                  {f}
                </li>
              ))}
            </ul>

            <button onClick={() => handleSubscribe('pro')}
              className="btn-rc-primary w-full justify-center py-2.5 relative z-10">
              <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
              Upgrade to Pro
            </button>
          </div>
        </div>

        {/* FAQ / trust section */}
        <div className="mt-16 text-center">
          <h2 className="text-lg font-bold text-white mb-2">Frequently Asked</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 text-left">
            {[
              { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your Pro subscription at any time with no penalties.' },
              { q: 'What payment methods?', a: 'We accept all major credit cards, PayPal, and UPI (India).' },
              { q: 'Is there a student discount?', a: 'Yes! Email us with your .edu address for 50% off Pro.' },
              { q: 'Are new features included?', a: 'All future features are included at no extra cost for Pro users.' },
            ].map(({ q, a }) => (
              <div key={q} className="rc-card p-4">
                <h3 className="text-sm font-semibold text-white mb-1">{q}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#8A8B91' }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Plans;