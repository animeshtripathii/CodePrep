import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const features = [
  { icon: 'check_circle', text: 'Real-time feedback' },
  { icon: 'check_circle', text: 'Voice input support' },
  { icon: 'check_circle', text: 'Code quality scoring' },
  { icon: 'check_circle', text: '50+ interview problems' },
];

const peerFeatures = [
  { icon: 'check_circle', text: 'Shared live code editor' },
  { icon: 'check_circle', text: 'Video & audio via Agora' },
  { icon: 'check_circle', text: 'Real-time chat panel' },
  { icon: 'check_circle', text: 'Virtual whiteboard' },
];

const stats = [
  { value: '500+', label: 'Interviews Conducted' },
  { value: '95%', label: 'Success Rate' },
  { value: '50+', label: 'Problem Sets' },
  { value: '2min', label: 'Avg. Match Time' },
];

const InterviewPage = () => {
  return (
    <div style={{ background: '#000000', minHeight: '100vh', color: '#F3F3F5', fontFamily: 'Inter, sans-serif' }} className="flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="hero-glow relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-16">
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: 'rgba(255,79,0,0.1)', border: '1px solid rgba(255,79,0,0.2)', color: '#FF4F00' }}>
            <span className="size-1.5 rounded-full animate-pulse" style={{ background: '#FF4F00' }} />
            Interview Practice Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight tracking-tight">
            Ace Your Next{' '}
            <span className="text-gradient-orange">Technical Interview</span>
          </h1>
          <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: '#8A8B91' }}>
            Practice with our AI interviewer or team up with a peer — both powered by real coding challenges.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-xs mt-0.5" style={{ color: '#8A8B91' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-5xl mx-auto px-6 pb-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* AI Mock Interview */}
          <Link to="/interview/ai" className="group block">
            <div className="rc-card-orange rounded-2xl p-6 h-full flex flex-col transition-all duration-300 group-hover:scale-[1.01]">
              {/* Icon */}
              <div className="size-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(255,79,0,0.1)', border: '1px solid rgba(255,79,0,0.2)' }}>
                <span className="material-symbols-outlined text-[28px]" style={{ color: '#FF4F00' }}>smart_toy</span>
              </div>

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">AI Mock Interview</h2>
                  <p className="text-sm" style={{ color: '#8A8B91' }}>
                    Practice with an AI that talks, listens, and gives real feedback — just like a real interview.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ml-3"
                  style={{ background: 'rgba(255,79,0,0.15)', color: '#FF4F00', border: '1px solid rgba(255,79,0,0.3)' }}>
                  AI POWERED
                </span>
              </div>

              <ul className="flex flex-col gap-2 mb-6 flex-1">
                {features.map(({ icon, text }) => (
                  <li key={text} className="flex items-center gap-2 text-sm" style={{ color: '#8A8B91' }}>
                    <span className="material-symbols-outlined text-[16px]" style={{ color: '#10b981' }}>{icon}</span>
                    {text}
                  </li>
                ))}
              </ul>

              <button className="btn-rc-primary w-full justify-center text-sm">
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                Start AI Interview
                <span className="material-symbols-outlined text-[16px] ml-auto transition-transform group-hover:translate-x-1">arrow_forward</span>
              </button>
            </div>
          </Link>

          {/* Peer Interview */}
          <Link to="/interview/peer" className="group block">
            <div className="rc-card rounded-2xl p-6 h-full flex flex-col transition-all duration-300 group-hover:scale-[1.01]"
              style={{ borderColor: 'rgba(59,130,246,0.2)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)'}>
              <div className="size-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <span className="material-symbols-outlined text-[28px]" style={{ color: '#3b82f6' }}>group</span>
              </div>

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Peer Interview Room</h2>
                  <p className="text-sm" style={{ color: '#8A8B91' }}>
                    Create a room, invite a friend, and code together in real-time with video and chat.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ml-3"
                  style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                  LIVE
                </span>
              </div>

              <ul className="flex flex-col gap-2 mb-6 flex-1">
                {peerFeatures.map(({ icon, text }) => (
                  <li key={text} className="flex items-center gap-2 text-sm" style={{ color: '#8A8B91' }}>
                    <span className="material-symbols-outlined text-[16px]" style={{ color: '#3b82f6' }}>{icon}</span>
                    {text}
                  </li>
                ))}
              </ul>

              <button className="w-full justify-center text-sm btn-rc-secondary py-2.5"
                style={{ borderColor: 'rgba(59,130,246,0.3)', color: '#3b82f6' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}>
                <span className="material-symbols-outlined text-[18px]">video_call</span>
                Create / Join Room
                <span className="material-symbols-outlined text-[16px] ml-auto transition-transform group-hover:translate-x-1">arrow_forward</span>
              </button>
            </div>
          </Link>
        </div>

        {/* How it works */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-white text-center mb-2">How It Works</h2>
          <p className="text-sm text-center mb-10" style={{ color: '#8A8B91' }}>Two paths to interview mastery</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '01', icon: 'tune', title: 'Choose your mode', desc: 'Pick AI interview for solo practice or Peer Room for collaborative coding.' },
              { step: '02', icon: 'code', title: 'Solve problems', desc: 'Work through real coding challenges in a Monaco editor with syntax highlighting.' },
              { step: '03', icon: 'insights', title: 'Get feedback', desc: 'Receive instant AI scoring on communication, correctness, and code quality.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="rc-card p-5 text-center">
                <div className="text-xs font-bold mb-3" style={{ color: '#FF4F00' }}>{step}</div>
                <div className="size-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: '#1C1C1F' }}>
                  <span className="material-symbols-outlined text-[20px]" style={{ color: '#8A8B91' }}>{icon}</span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#8A8B91' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InterviewPage;
