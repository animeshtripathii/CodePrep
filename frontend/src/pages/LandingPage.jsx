import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const COMMANDS = [
  { id: 'two-sum', title: 'Practice: Two Sum Challenge', category: 'Coding Problems', icon: 'code', path: '/login', shortcut: '↵' },
  { id: 'ai-mock', title: 'Start AI Mock Interview', category: 'AI Interview', icon: 'smart_toy', path: '/login', shortcut: '⌥A' },
  { id: 'peer-room', title: 'Create Peer Coding Room', category: 'Collaboration', icon: 'group', path: '/login', shortcut: '⌥P' },
  { id: 'discussions', title: 'Browse Discussion Boards', category: 'Community', icon: 'forum', path: '/login', shortcut: '⌥D' },
  { id: 'pricing', title: 'View Premium Pro Plans', category: 'Billing', icon: 'payments', path: '/plans', shortcut: '⌥C' },
];

const MOCKUP_TEXTS = {
  editor: {
    title: 'High-Fidelity Code Editor',
    tag: 'INTEGRATED COMPILER',
    desc: 'Solve algorithmic challenges directly on our Monaco-powered code editor workbench.',
    bullets: [
      'Multi-language templates (JS, Python, C++, Java, C).',
      'Instant feedback loops with public testcases execution check.',
      'CodeMaster AI Tutor panel for real-time hint queries.'
    ]
  },
  ai: {
    title: 'Gemini Mock Interviews',
    tag: 'DYNAMIC ASSESSMENTS',
    desc: 'Face our speaking AI interviewer avatar and pass mock behavioral & logical assessments.',
    bullets: [
      'Tailor questions by uploading your resume/CV before starting.',
      'Talk out loud - webkitSpeechRecognition records speech dynamically.',
      'End interview to instantly generate logic & communication reports.'
    ]
  },
  peer: {
    title: 'Real-Time Peer Collaboration',
    tag: 'COLLABORATIVE WORKBENCH',
    desc: 'Join private rooms with other candidates to pair program on algorithms and sketch designs.',
    bullets: [
      'Synchronized Monaco text inputs coordinate script edits instantly.',
      'Interactive canvas drawing whiteboard broadcasts sketch lines.',
      'Direct audio and video communication keeps pairs aligned.'
    ]
  },
  discuss: {
    title: 'Discussion Forums',
    tag: 'COMMUNITY HELPERS',
    desc: 'Explore queries, share solutions, and review advice inside dedicated discussions pages.',
    bullets: [
      'Ask the community or select CodeBot AI assistance check boxes.',
      'Upvote and pin optimal explanations and algorithmic tracks.',
      'Connect threads directly to CodePrep problem references.'
    ]
  }
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeMockup, setActiveMockup] = useState('editor'); // editor | ai | peer | discuss
  const [tiltStyle, setTiltStyle] = useState({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)' });
  const [isHovered, setIsHovered] = useState(false);
  const paletteRef = useRef(null);

  const filtered = COMMANDS.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  // Auto-slide cycle tabs
  const MOCKUPS = ['editor', 'ai', 'peer', 'discuss'];
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveMockup(prev => {
        const nextIdx = (MOCKUPS.indexOf(prev) + 1) % MOCKUPS.length;
        return MOCKUPS[nextIdx];
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isHovered]);

  // 3D Card hover tilt calculator
  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    
    const normalizedX = (x / box.width) - 0.5;
    const normalizedY = (y / box.height) - 0.5;
    
    // Rotate card slightly based on coordinate position
    const rotateY = normalizedX * 16; 
    const rotateX = -normalizedY * 16; 
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.05s ease-out',
    });
  };

  const handleCardMouseLeave = () => {
    setIsHovered(false);
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s ease-out',
    });
  };

  // Parallax mousemove tracker for hero section stripes
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth) - 0.5;
    const y = (clientY / innerHeight) - 0.5;
    setMousePos({ x, y });
  };

  // Auto wrap active index
  useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(0);
    if (activeIdx < 0 && filtered.length > 0) setActiveIdx(filtered.length - 1);
  }, [filtered, activeIdx]);

  // Keyboard navigation inside mockup launcher
  const handleKeyDown = (e) => {
    if (filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(prev => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(prev => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      navigate(filtered[activeIdx].path);
    }
  };

  return (
    <div style={{ background: '#000000', minHeight: '100vh', color: '#F3F3F5', fontFamily: 'Inter, sans-serif' }}
      className="overflow-x-hidden selection:bg-[#FF4F00]/30 selection:text-white"
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
    >
      
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/40 border-b border-[#111112]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-7 rounded-lg flex items-center justify-center font-black text-xs"
              style={{ background: 'linear-gradient(135deg, #FF4F00, #FF8C42)', color: 'white' }}>
              {'{ }'}
            </div>
            <span className="text-white text-base font-bold tracking-tight">CodePrep</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-semibold tracking-wide uppercase">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#ai-mock-feature" className="hover:text-white transition-colors">AI Interview</a>
            <a href="#peer-room-feature" className="hover:text-white transition-colors">Collaboration</a>
            <a href="/plans" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link to="/signup" className="btn-rc-primary py-1.5 px-3.5 text-xs font-bold">
              Join for Free
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION WITH DYNAMIC PARALLAX BACKGROUND ────────── */}
      <section className="relative pt-36 pb-12 px-6 max-w-6xl mx-auto text-center z-10 min-h-[90vh] flex flex-col justify-center items-center">
        
        {/* Raycast-style Diagonal Red/Pink Glowing Stripes (Moving Parallax) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#000000_90%)] z-10" />
          
          {/* Stripe 1 */}
          <div className="absolute h-[160%] w-[130px] rounded-full blur-[4px] opacity-[0.25]"
            style={{
              background: 'linear-gradient(180deg, #FF2D55 0%, #FF4F00 50%, #000000 100%)',
              left: '12%',
              top: '-30%',
              transform: `translate(${mousePos.x * 45}px, ${mousePos.y * 45}px) rotate(-35deg)`,
              transition: 'transform 0.3s ease-out',
            }}
          />
          {/* Stripe 2 (Sharper layer) */}
          <div className="absolute h-[160%] w-[160px] rounded-full blur-[6px] opacity-[0.45]"
            style={{
              background: 'linear-gradient(180deg, #FF1F56 10%, #FF3B30 60%, #000000 100%)',
              left: '32%',
              top: '-20%',
              transform: `translate(${mousePos.x * -25}px, ${mousePos.y * -25}px) rotate(-35deg)`,
              transition: 'transform 0.25s ease-out',
            }}
          />
          {/* Stripe 3 (Dominant Center stripe) */}
          <div className="absolute h-[160%] w-[180px] rounded-full blur-[10px] opacity-[0.6]"
            style={{
              background: 'linear-gradient(180deg, #FF2D55 0%, #FF4F00 55%, #000000 100%)',
              left: '52%',
              top: '-35%',
              transform: `translate(${mousePos.x * 35}px, ${mousePos.y * 35}px) rotate(-35deg)`,
              transition: 'transform 0.2s ease-out',
            }}
          />
          {/* Stripe 4 */}
          <div className="absolute h-[160%] w-[150px] rounded-full blur-[5px] opacity-[0.35]"
            style={{
              background: 'linear-gradient(180deg, #FF1F56 15%, #FF8C42 65%, #000000 100%)',
              left: '72%',
              top: '-15%',
              transform: `translate(${mousePos.x * -40}px, ${mousePos.y * -40}px) rotate(-35deg)`,
              transition: 'transform 0.35s ease-out',
            }}
          />
          {/* Stripe 5 */}
          <div className="absolute h-[160%] w-[130px] rounded-full blur-[12px] opacity-[0.25]"
            style={{
              background: 'linear-gradient(180deg, #FF2D55 0%, #000000 100%)',
              left: '88%',
              top: '-25%',
              transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px) rotate(-35deg)`,
              transition: 'transform 0.15s ease-out',
            }}
          />
        </div>

        {/* Dynamic Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold mb-8 border"
          style={{ background: 'rgba(255,79,0,0.06)', borderColor: 'rgba(255,79,0,0.2)', color: '#FF8C42' }}>
          <span className="size-1.5 rounded-full bg-[#FF4F00] animate-pulse" />
          Interactive Mock Interview Platform
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6 leading-[1.05]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Supercharge your <br />
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #FF4F00, #FF8C42)' }}>technical preparation.</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mb-12 leading-relaxed">
          An intuitive coding platform for candidates. Solve 100+ algorithmic tasks, code in real-time rooms, sketch on synced canvases, and interview with AI.
        </p>

        {/* Command Palette mockup launcher */}
        <div className="max-w-lg w-full text-left animate-in fade-in zoom-in duration-300">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 px-2 flex justify-between">
            <span>Command Palette Simulator</span>
            <span>Use ↑↓ keys & ↵ Enter</span>
          </div>
          
          <div ref={paletteRef} className="rounded-xl border shadow-2xl overflow-hidden"
            style={{ background: '#0C0C0D', borderColor: '#222225', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)' }}>
            
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: '#1c1c1f' }}>
              <span className="material-symbols-outlined text-slate-500 text-[18px]">search</span>
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setActiveIdx(0); }}
                placeholder="Search commands or practice problems..."
                className="bg-transparent text-sm text-white flex-1 focus:outline-none placeholder-slate-600"
              />
            </div>

            <div className="p-2 max-h-[260px] overflow-y-auto space-y-0.5">
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-600">No commands found. Try searching another topic!</div>
              ) : (
                filtered.map((cmd, idx) => (
                  <div
                    key={cmd.id}
                    onClick={() => navigate(cmd.path)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-150"
                    style={{
                      background: idx === activeIdx ? 'rgba(255,79,0,0.1)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[16px] transition-colors"
                        style={{ color: idx === activeIdx ? '#FF4F00' : '#8A8B91' }}>
                        {cmd.icon}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-white">{cmd.title}</div>
                        <div className="text-[10px] text-slate-500" style={{ marginTop: '1px' }}>{cmd.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold"
                        style={{ background: '#1C1C1F', color: idx === activeIdx ? '#FF4F00' : '#8A8B91', border: '1px solid #222225' }}>
                        {cmd.shortcut}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t flex justify-between items-center text-[10px] text-slate-500"
              style={{ borderColor: '#1c1c1f', background: '#111112' }}>
              <span>Category: {filtered[activeIdx]?.category || 'General'}</span>
              <span>Open Application</span>
            </div>
          </div>
        </div>

      </section>

      {/* ── DYNAMIC PRODUCT WORKSPACE PREVIEW SELECTOR (3D Card & Split Layout) ── */}
      <section className="py-24 px-6 border-t border-[#111112]" style={{ background: '#030304' }}>
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          
          {/* Left Column: Feature Details & Tab Selector (42% Width) */}
          <div className="w-full lg:w-[42%] text-left space-y-6">
            <div className="space-y-3">
              <span className="text-[9px] text-[#FF4F00] font-black uppercase tracking-widest bg-orange-500/5 px-2.5 py-1 rounded border border-orange-500/10">
                {MOCKUP_TEXTS[activeMockup].tag}
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {MOCKUP_TEXTS[activeMockup].title}
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                {MOCKUP_TEXTS[activeMockup].desc}
              </p>
            </div>

            {/* Bullets list */}
            <ul className="space-y-3 text-xs text-slate-300">
              {MOCKUP_TEXTS[activeMockup].bullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[15px] text-[#FF4F00] mt-0.5 select-none">check_circle</span>
                  <span className="leading-normal">{bullet}</span>
                </li>
              ))}
            </ul>

            {/* Tab Selector pills */}
            <div className="flex flex-col gap-1.5 pt-4 border-t border-[#1c1c1f]">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Select feature preview:</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'editor', label: 'Code Editor', icon: 'code' },
                  { id: 'ai', label: 'AI Mock Interview', icon: 'smart_toy' },
                  { id: 'peer', label: 'Peer Room', icon: 'group' },
                  { id: 'discuss', label: 'Discussions', icon: 'forum' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveMockup(tab.id); setIsHovered(true); }}
                    className="py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border text-left"
                    style={activeMockup === tab.id
                      ? { background: '#FF4F00', borderColor: '#FF4F00', color: 'white' }
                      : { background: '#0C0C0D', borderColor: '#1c1c1f', color: '#8A8B91' }}
                  >
                    <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: 3D Tilting macOS Mockup (58% Width) */}
          <div className="w-full lg:w-[58%] flex items-center justify-center" style={{ perspective: '1200px' }}>
            <div 
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              onMouseEnter={() => setIsHovered(true)}
              className="w-full rounded-xl border shadow-2xl overflow-hidden transition-all duration-200"
              style={{ borderColor: '#222225', background: '#0C0C0D', ...tiltStyle, transformStyle: 'preserve-3d' }}
            >
              
              {/* macOS title bar */}
              <div className="h-10 flex items-center justify-between px-4 border-b"
                style={{ borderColor: '#1c1c1f', background: '#111112' }}>
                <div className="flex gap-1.5">
                  <span className="size-3 rounded-full bg-[#ef4444]/60" />
                  <span className="size-3 rounded-full bg-[#f59e0b]/60" />
                  <span className="size-3 rounded-full bg-[#10b981]/60" />
                </div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest select-none">
                  {activeMockup === 'editor' && 'codeprep.io / editor / two-sum'}
                  {activeMockup === 'ai' && 'codeprep.io / interview / ai'}
                  {activeMockup === 'peer' && 'codeprep.io / interview / peer-room'}
                  {activeMockup === 'discuss' && 'codeprep.io / discussions'}
                </div>
                <div className="w-12" />
              </div>

              {/* Display Mockup Content */}
              <div className="h-[380px] flex text-xs text-left overflow-hidden">
                
                {/* MOCKUP 1: Code Editor */}
                {activeMockup === 'editor' && (
                  <div className="flex-1 flex text-slate-400">
                    {/* Left: Problem Desc */}
                    <div className="w-1/2 border-r p-5 space-y-4" style={{ borderColor: '#1c1c1f', background: '#0C0C0D' }}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-bold text-base">Two Sum</h3>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-widest">Easy</span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Given an array of integers <code className="font-mono text-white bg-slate-800 px-1 py-0.5 rounded">nums</code> and an integer <code className="font-mono text-white bg-slate-800 px-1 py-0.5 rounded">target</code>, return indices of the two numbers such that they add up to target.
                      </p>
                      <div className="p-3 rounded-lg text-[10px]" style={{ background: '#111112', border: '1px solid #1c1c1f' }}>
                        <span className="font-bold text-white block mb-1">Example 1:</span>
                        Input: nums = [2,7,11,15], target = 9 <br />
                        Output: [0,1]
                      </div>
                    </div>
                    {/* Right: Monaco */}
                    <div className="w-1/2 p-5 font-mono text-slate-300 bg-[#070708] flex flex-col justify-between">
                      <div className="space-y-1 text-slate-400">
                        <div><span className="text-[#FF4F00]">function</span> <span className="text-[#3b82f6]">twoSum</span>(nums, target) {'{'}</div>
                        <div className="pl-4">const seen = <span className="text-[#3b82f6]">new Map</span>();</div>
                        <div className="pl-4">for (let i = 0; i &lt; nums.length; i++) {'{'}</div>
                        <div className="pl-8 text-slate-300">const comp = target - nums[i];</div>
                        <div className="pl-8 text-slate-300">if (seen.has(comp)) return [seen.get(comp), i];</div>
                        <div className="pl-8 text-slate-300">seen.set(nums[i], i);</div>
                        <div className="pl-4">{'}'}</div>
                        <div>{'}'}</div>
                      </div>
                      <div className="flex justify-between border-t pt-3" style={{ borderColor: '#111112' }}>
                        <span className="text-slate-500 font-sans">Language: JavaScript</span>
                        <span className="text-green-500 font-sans font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Passed (4/4 Testcases)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* MOCKUP 2: AI Mock Interview */}
                {activeMockup === 'ai' && (
                  <div className="flex-1 flex text-slate-400">
                    {/* Left: AI Avatar Info */}
                    <div className="w-80 shrink-0 border-r p-5 flex flex-col items-center justify-center text-center gap-3" style={{ borderColor: '#1c1c1f', background: '#0C0C0D' }}>
                      <div className="size-20 rounded-full border-2 border-[#FF4F00] flex items-center justify-center bg-orange-500/5 shadow-[0_0_20px_rgba(255,79,0,0.15)]">
                        <span className="material-symbols-outlined text-4xl text-[#FF4F00]">smart_toy</span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">Alex (AI Interviewer)</h4>
                        <p className="text-[10px] text-slate-500">Senior Software Architect</p>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ background: '#FF4F00', color: 'white' }}>Speaking</span>
                    </div>
                    {/* Right: Timeline & Text-input */}
                    <div className="flex-1 p-5 flex flex-col justify-between" style={{ background: '#070708' }}>
                      <div className="space-y-3 overflow-y-auto pr-2">
                        <div className="flex gap-2">
                          <div className="size-5 rounded-full bg-orange-500/20 text-[#FF4F00] flex items-center justify-center text-[9px] font-bold">AI</div>
                          <div className="p-2.5 rounded-xl text-[11px] leading-relaxed max-w-[85%]" style={{ background: '#1C1C1F', color: '#F3F3F5' }}>
                            "Hi candidate! Let's walk through the Two Sum problem. What would be your approach for this algorithm?"
                          </div>
                        </div>
                        <div className="flex gap-2 flex-row-reverse">
                          <div className="size-5 rounded-full bg-blue-500/20 text-[#3b82f6] flex items-center justify-center text-[9px] font-bold">You</div>
                          <div className="p-2.5 rounded-xl text-[11px] leading-relaxed max-w-[85%]" style={{ background: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}>
                            "I plan to use a Hash Map to store elements we have seen so far, allowing lookup in linear time."
                          </div>
                        </div>
                      </div>
                      {/* Input */}
                      <div className="border-t pt-3 flex gap-2" style={{ borderColor: '#1c1c1f' }}>
                        <input disabled type="text" placeholder="🎙 Listening to your speech input..." className="rc-input flex-1 !py-1.5 text-[11px]" />
                        <button className="p-1.5 rounded-lg bg-[#FF4F00] text-white flex items-center justify-center"><span className="material-symbols-outlined text-[16px]">mic</span></button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MOCKUP 3: Peer Room & Whiteboard */}
                {activeMockup === 'peer' && (
                  <div className="flex-1 flex text-slate-400">
                    {/* Left: Code Editor Workspace */}
                    <div className="w-1/2 border-r p-4 flex flex-col justify-between" style={{ borderColor: '#1c1c1f', background: '#0C0C0D' }}>
                      <div className="space-y-3 font-mono text-[10px] text-slate-500">
                        <div><span className="text-[#FF4F00]">function</span> <span className="text-[#3b82f6]">reverseList</span>(head) {'{'}</div>
                        <div className="pl-4">let prev = <span className="text-white">null</span>, curr = head;</div>
                        <div className="pl-4">while (curr) {'{'}</div>
                        <div className="pl-8 text-white">let next = curr.next;</div>
                        <div className="pl-8 text-white">curr.next = prev;</div>
                        <div className="pl-8 text-white">prev = curr;</div>
                        <div className="pl-8 text-white">curr = next;</div>
                        <div className="pl-4">{'}'}</div>
                        <div>{'}'}</div>
                      </div>
                      {/* Video Avatars */}
                      <div className="grid grid-cols-2 gap-2 border-t pt-2" style={{ borderColor: '#1c1c1f' }}>
                        <div className="rounded bg-[#111112] p-1.5 flex items-center justify-between text-[10px]">
                          <span className="text-white font-bold">You (Camera On)</span>
                          <span className="material-symbols-outlined text-[12px] text-slate-500">mic</span>
                        </div>
                        <div className="rounded bg-[#111112] p-1.5 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500">Partner</span>
                          <span className="material-symbols-outlined text-[12px] text-red-500">mic_off</span>
                        </div>
                      </div>
                    </div>
                    {/* Right: Synced Concept Drawing Board */}
                    <div className="w-1/2 p-4 bg-black flex flex-col justify-between">
                      <div className="flex justify-between items-center border-b pb-1.5" style={{ borderColor: '#111112' }}>
                        <span className="text-[10px] font-bold text-slate-400">Concept Whiteboard</span>
                        <div className="flex gap-1">
                          <span className="size-2.5 rounded-full bg-[#FF4F00]" />
                          <span className="size-2.5 rounded-full bg-[#3b82f6]" />
                          <span className="size-2.5 rounded-full bg-[#10b981]" />
                        </div>
                      </div>
                      {/* Mock drawing lines represent linked list boxes */}
                      <div className="flex-1 relative flex items-center justify-center">
                        <div className="flex items-center gap-6">
                          <div className="border border-solid border-[#FF4F00] p-1.5 rounded bg-orange-500/5 text-center font-mono text-[9px]">
                            <div className="text-white font-bold">Node 1</div>
                            val: 12
                          </div>
                          <span className="material-symbols-outlined text-slate-500 text-[18px]">arrow_right_alt</span>
                          <div className="border border-solid border-[#FF4F00] p-1.5 rounded bg-orange-500/5 text-center font-mono text-[9px]">
                            <div className="text-white font-bold">Node 2</div>
                            val: 25
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-600 font-mono text-center">Sync drawing enabled over WebSockets</span>
                    </div>
                  </div>
                )}

                {/* MOCKUP 4: Discussions Board */}
                {activeMockup === 'discuss' && (
                  <div className="flex-1 flex text-slate-400" style={{ background: '#0C0C0D' }}>
                    {/* Threads Checklist */}
                    <div className="w-full p-5 space-y-3 overflow-y-auto">
                      <div className="flex justify-between items-center p-3 rounded-lg border" style={{ background: '#111112', borderColor: '#1c1c1f' }}>
                        <div>
                          <h4 className="text-white font-bold text-xs">How does LRU Cache eviction work in O(1) time?</h4>
                          <p className="text-[10px] text-slate-500 mt-1">Asked by Harmeet · 2 hours ago</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded bg-[#1C1C1F] border border-[#222225]">14 upvotes</span>
                      </div>

                      <div className="flex justify-between items-center p-3 rounded-lg border" style={{ background: '#111112', borderColor: '#1c1c1f' }}>
                        <div>
                          <h4 className="text-white font-bold text-xs">Getting started with AI mock tokens system</h4>
                          <p className="text-[10px] text-slate-500 mt-1">Asked by Admin · 1 day ago</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded bg-[#1C1C1F] border border-[#222225]">25 upvotes</span>
                      </div>

                      <div className="p-3.5 rounded-lg border bg-orange-500/5" style={{ borderColor: 'rgba(255,79,0,0.2)' }}>
                        <div className="flex items-center gap-1.5 mb-1.5 text-xs text-white font-bold">
                          <span className="material-symbols-outlined text-[15px] text-[#FF4F00]">smart_toy</span>
                          CodeBot AI reply:
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                          "For O(1) eviction, couple a Hash Map with a doubly linked list. The map provides O(1) lookup, while the linked list supports O(1) node inserts and deletions."
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── BENTO GRID FEATURES ───────────────────────────────────── */}
      <section id="features" className="py-24 px-6 border-t border-[#111112]" style={{ background: '#050505' }}>
        <div className="max-w-6xl mx-auto">
          
          <div className="mb-16">
            <h2 className="text-3xl font-black text-white leading-tight mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Packed with utility.
            </h2>
            <p className="text-slate-400 text-sm max-w-sm">Every element structured for professional preparation, pair coding, and review.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            
            {/* AI Mock Interview Box (Large, Span 4) */}
            <div className="md:col-span-4 rc-card p-6 flex flex-col justify-between" id="ai-mock-feature">
              <div>
                <div className="size-9 rounded-lg flex items-center justify-center mb-6" style={{ background: 'rgba(255,79,0,0.06)', border: '1px solid rgba(255,79,0,0.15)' }}>
                  <span className="material-symbols-outlined text-[18px] text-[#FF4F00]">smart_toy</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">Gemini AI Interviewer</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Conduct interactive interviews. Gemini scans your conversation, monitors your editor code, parses uploaded CV lines, and speaks dynamic feedback tailored to you.
                </p>
              </div>

              {/* Visual Preview */}
              <div className="rounded-xl border p-4 flex gap-4 text-xs" style={{ background: '#0C0C0D', borderColor: '#222225' }}>
                <div className="size-16 rounded-full shrink-0 flex items-center justify-center border-2 border-dashed border-[#FF4F00] bg-orange-500/5 animate-pulse">
                  <span className="material-symbols-outlined text-2xl text-[#FF4F00]">face</span>
                </div>
                <div className="flex-1 space-y-1">
                  <span className="font-bold text-white">AI Interviewer:</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    "I notice your Solution uses nested iterations. How can you optimize the time complexity to linear time?"
                  </p>
                </div>
              </div>
            </div>

            {/* Catalog (Span 2) */}
            <div className="md:col-span-2 rc-card p-6 flex flex-col justify-between">
              <div>
                <div className="size-9 rounded-lg flex items-center justify-center mb-6" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}>
                  <span className="material-symbols-outlined text-[18px] text-[#a855f7]">list</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">100+ Challenge List</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Practice Arrays, Trees, Sorting, and Dynamic Programming. Categorized by difficulty grades.
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="h-1.5 w-full rounded bg-slate-800 overflow-hidden"><div className="h-full bg-green-500 w-2/3" /></div>
                <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase"><span>Easy solved</span><span>66%</span></div>
              </div>
            </div>

            {/* Peer to peer and Whiteboard (Large, Span 4) */}
            <div className="md:col-span-4 rc-card p-6 flex flex-col justify-between" id="peer-room-feature">
              <div>
                <div className="size-9 rounded-lg flex items-center justify-center mb-6" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <span className="material-symbols-outlined text-[18px] text-[#3b82f6]">group</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">Real-time Collaboration & Synced Drawing</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Set up private rooms with code templates. Discuss logic over voice tracks and map complex architecture concepts using our shared canvas whiteboard.
                </p>
              </div>

              {/* Whiteboard canvas mockup preview */}
              <div className="rounded-xl border p-3 flex flex-col gap-2 bg-black/60" style={{ borderColor: '#1c1c1f' }}>
                <div className="flex gap-1.5 items-center">
                  <span className="size-2 rounded-full bg-[#FF4F00]" />
                  <span className="size-2 rounded-full bg-[#3b82f6]" />
                  <span className="size-2 rounded-full bg-[#10b981]" />
                  <div className="h-3 w-px bg-[#1c1c1f] mx-1" />
                  <span className="text-[10px] text-slate-500 font-mono">Drawing synchronized...</span>
                </div>
                <div className="h-16 rounded border border-dashed flex items-center justify-center text-slate-600 text-xs font-mono" style={{ borderColor: '#222225' }}>
                  [ Shared Concept Board Preview ]
                </div>
              </div>
            </div>

            {/* AI Tutor hints (Span 2) */}
            <div className="md:col-span-2 rc-card p-6 flex flex-col justify-between">
              <div>
                <div className="size-9 rounded-lg flex items-center justify-center mb-6" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <span className="material-symbols-outlined text-[18px] text-[#10b981]">help_center</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">CodeMaster Hints</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Stuck in the IDE? Ask the AI Tutor. Get hints, suggestions, and space/time analytics without showing the full code solution instantly.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider text-[9px]">DSA Tutor →</span>
            </div>

          </div>
        </div>
      </section>

      {/* ── QUICK FAQ INDEX ────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-[#111112]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-white text-center mb-12" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Got questions? We have answers.
          </h2>

          <div className="space-y-6">
            {[
              { q: "Is CodePrep free?", a: "Yes, practicing coding challenges is completely free. We offer premium Pro plans for unlimited AI Mock interview tokens and custom evaluation reviews." },
              { q: "How does the AI Mock Interview evaluate my profile?", a: "Gemini assesses the dialogue transcript, checks variable syntax in the code, notes space/time complexities, and checks CV fields to generate feedback report cards." },
              { q: "Are the Peer Coding Rooms private?", a: "Yes, room codes are randomly generated. The room instance and chats terminate when both users disconnect." },
            ].map((item, idx) => (
              <div key={idx} className="pb-6 border-b" style={{ borderColor: '#111112' }}>
                <h4 className="text-sm font-bold text-white mb-2">{item.q}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION BANNER ─────────────────────────────────── */}
      <section className="py-24 px-6 text-center border-t border-[#111112] relative z-10" style={{ background: '#000000' }}>
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#FF4F00]/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Excel in your technical tracks.
        </h2>
        <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8">
          Join free now. Practice problems, collaborate over boards, and pass technical assessments.
        </p>
        
        <Link to="/signup" className="btn-rc-primary px-8 py-3 text-sm font-bold">
          Get Started — It's Free
        </Link>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="border-t border-[#111112] py-12 px-6" style={{ background: '#050505' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="size-6 rounded-md flex items-center justify-center font-black text-[10px]"
              style={{ background: 'linear-gradient(135deg, #FF4F00, #FF8C42)', color: 'white' }}>
              {'{ }'}
            </div>
            <span className="text-white text-xs font-bold uppercase tracking-widest">CodePrep</span>
          </div>

          <p className="text-[10px] text-slate-600">
            © {new Date().getFullYear()} CodePrep, Inc. All rights reserved.
          </p>

          <div className="flex gap-4 text-xs text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="/plans" className="hover:text-white transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-white transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
