import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import axiosClient from '../utils/axiosClient';
import { useSelector } from 'react-redux';

/* ── Room Setup Screen ── */
const RoomSetup = ({ onJoin }) => {
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState('create'); // create | join

  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
  const [newCode] = useState(generateCode);

  const handleSubmit = () => {
    const code = mode === 'create' ? newCode : roomCode.trim().toUpperCase();
    if (!code) return;
    onJoin(code);
  };

  return (
    <div style={{ background: '#000000', minHeight: '100vh', color: '#F3F3F5', fontFamily: 'Inter, sans-serif' }}
      className="flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="size-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <span className="material-symbols-outlined text-[30px]" style={{ color: '#3b82f6' }}>group</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Peer Interview Room</h1>
          <p style={{ color: '#8A8B91' }}>Create or join a room to practice together</p>
        </div>

        <div className="rc-card p-6">
          {/* Mode tabs */}
          <div className="flex rounded-lg p-0.5 mb-6" style={{ background: '#0C0C0D', border: '1px solid #222225' }}>
            {['create', 'join'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-md text-sm font-medium capitalize transition-all"
                style={mode === m
                  ? { background: '#1C1C1F', color: '#FF4F00', boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }
                  : { color: '#8A8B91' }}>
                {m === 'create' ? '+ Create Room' : '→ Join Room'}
              </button>
            ))}
          </div>

          {mode === 'create' ? (
            <div className="text-center">
              <div className="text-xs mb-2" style={{ color: '#8A8B91' }}>Your Room Code</div>
              <div className="text-4xl font-black tracking-[0.3em] mb-1" style={{ color: '#FF4F00', fontFamily: 'JetBrains Mono, monospace' }}>
                {newCode}
              </div>
              <p className="text-xs mb-6" style={{ color: '#4a4a52' }}>Share this code with your partner</p>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-xs font-medium mb-2" style={{ color: '#8A8B91' }}>Enter Room Code</label>
              <input
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                maxLength={6}
                className="rc-input text-center text-xl font-black tracking-widest"
                style={{ fontFamily: 'JetBrains Mono, monospace', color: '#FF4F00' }}
              />
            </div>
          )}

          <button onClick={handleSubmit} className="btn-rc-primary w-full justify-center mt-2">
            <span className="material-symbols-outlined text-[18px]">{mode === 'create' ? 'add_circle' : 'login'}</span>
            {mode === 'create' ? 'Create & Enter Room' : 'Join Room'}
          </button>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: '#4a4a52' }}>
          Rooms are private and end when everyone leaves
        </p>
      </div>
    </div>
  );
};

/* ── Video Tile ── */
const VideoTile = ({ stream, label, muted = false }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="relative rounded-xl overflow-hidden aspect-video" style={{ background: '#111112', border: '1px solid #222225' }}>
      {stream
        ? <video ref={videoRef} autoPlay muted={muted} className="w-full h-full object-cover" />
        : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[28px]" style={{ color: '#333338' }}>videocam_off</span>
            <span className="text-xs" style={{ color: '#4a4a52' }}>Camera off</span>
          </div>
        )
      }
      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: 'rgba(0,0,0,0.7)', color: '#F3F3F5' }}>
        {label}
      </div>
    </div>
  );
};

/* ── PROBLEMS (simplified list for peer room) ── */
const PEER_PROBLEMS = [
  { title: 'Two Sum', desc: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', difficulty: 'easy', starter: 'function twoSum(nums, target) {\n  // solve here\n}\n\nconsole.log(twoSum([2,7,11,15], 9));' },
  { title: 'Maximum Subarray', desc: 'Find the contiguous subarray which has the largest sum and return its sum.', difficulty: 'medium', starter: 'function maxSubArray(nums) {\n  // solve here\n}\n\nconsole.log(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]));' },
  { title: 'Binary Search', desc: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums.', difficulty: 'easy', starter: 'function search(nums, target) {\n  // solve here\n}\n\nconsole.log(search([-1,0,3,5,9,12], 9));' },
  { title: 'Climbing Stairs', desc: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?', difficulty: 'easy', starter: 'function climbStairs(n) {\n  // solve here\n}\n\nconsole.log(climbStairs(5));' },
  { title: 'Word Break', desc: 'Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.', difficulty: 'medium', starter: 'function wordBreak(s, wordDict) {\n  // solve here\n}\n\nconsole.log(wordBreak("leetcode", ["leet","code"]));' },
];

const PEER_STARTER_TEMPLATES = {
  javascript: {
    'Two Sum': `function twoSum(nums, target) {\n  // solve here\n}\n\nconsole.log(twoSum([2,7,11,15], 9));`,
    'Maximum Subarray': `function maxSubArray(nums) {\n  // solve here\n}\n\nconsole.log(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]));`,
    'Binary Search': `function search(nums, target) {\n  // solve here\n}\n\nconsole.log(search([-1,0,3,5,9,12], 9));`,
    'Climbing Stairs': `function climbStairs(n) {\n  // solve here\n}\n\nconsole.log(climbStairs(5));`,
    'Word Break': `function wordBreak(s, wordDict) {\n  // solve here\n}\n\nconsole.log(wordBreak("leetcode", ["leet","code"]));`
  },
  python: {
    'Two Sum': `def twoSum(nums, target):\n    # solve here\n    pass\n\nprint(twoSum([2,7,11,15], 9))`,
    'Maximum Subarray': `def maxSubArray(nums):\n    # solve here\n    pass\n\nprint(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]))`,
    'Binary Search': `def search(nums, target):\n    # solve here\n    pass\n\nprint(search([-1,0,3,5,9,12], 9))`,
    'Climbing Stairs': `def climbStairs(n):\n    # solve here\n    pass\n\nprint(climbStairs(5))`,
    'Word Break': `def wordBreak(s, wordDict):\n    # solve here\n    pass\n\nprint(wordBreak("leetcode", ["leet","code"]))`
  },
  cpp: {
    'Two Sum': `#include <vector>\n\nstd::vector<int> twoSum(std::vector<int>& nums, int target) {\n    // solve here\n    return {};\n}`,
    'Maximum Subarray': `#include <vector>\n\nint maxSubArray(std::vector<int>& nums) {\n    // solve here\n    return 0;\n}`,
    'Binary Search': `#include <vector>\n\nint search(std::vector<int>& nums, int target) {\n    // solve here\n    return -1;\n}`,
    'Climbing Stairs': `int climbStairs(int n) {\n    // solve here\n    return 0;\n}`,
    'Word Break': `#include <string>\n#include <vector>\n\nbool wordBreak(std::string s, std::vector<std::string>& wordDict) {\n    // solve here\n    return false;\n}`
  },
  java: {
    'Two Sum': `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // solve here\n        return new int[]{};\n    }\n}`,
    'Maximum Subarray': `class Solution {\n    public int maxSubArray(int[] nums) {\n        // solve here\n        return 0;\n    }\n}`,
    'Binary Search': `class Solution {\n    public int search(int[] nums, int target) {\n        // solve here\n        return -1;\n    }\n}`,
    'Climbing Stairs': `class Solution {\n    public int climbStairs(int n) {\n        // solve here\n        return 0;\n    }\n}`,
    'Word Break': `class Solution {\n    public boolean wordBreak(String s, List<String> wordDict) {\n        // solve here\n        return false;\n    }\n}`
  },
  c: {
    'Two Sum': `int* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // solve here\n    return NULL;\n}`,
    'Maximum Subarray': `int maxSubArray(int* nums, int numsSize) {\n    // solve here\n    return 0;\n}`,
    'Binary Search': `int search(int* nums, int numsSize, int target) {\n    // solve here\n    return -1;\n}`,
    'Climbing Stairs': `int climbStairs(int n) {\n    // solve here\n    return 0;\n}`,
    'Word Break': `bool wordBreak(char* s, char** wordDict, int wordDictSize) {\n    // solve here\n    return false;\n}`
  }
};

const PEER_OPTIMAL_SOLUTIONS = {
  'Two Sum': `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) return [map.get(complement), i];
        map.set(nums[i], i);
    }
    return [];
}`,
  'Maximum Subarray': `function maxSubArray(nums) {
    let maxSoFar = nums[0];
    let currMax = nums[0];
    for (let i = 1; i < nums.length; i++) {
        currMax = Math.max(nums[i], currMax + nums[i]);
        maxSoFar = Math.max(maxSoFar, currMax);
    }
    return maxSoFar;
}`,
  'Binary Search': `function search(nums, target) {
    let l = 0, r = nums.length - 1;
    while (l <= r) {
        let m = Math.floor((l + r) / 2);
        if (nums[m] === target) return m;
        if (nums[m] < target) l = m + 1;
        else r = m - 1;
    }
    return -1;
}`,
  'Climbing Stairs': `function climbStairs(n) {
    if (n <= 2) return n;
    let first = 1, second = 2;
    for (let i = 3; i <= n; i++) {
        let third = first + second;
        first = second;
        second = third;
    }
    return second;
}`,
  'Word Break': `function wordBreak(s, wordDict) {
    const wordSet = new Set(wordDict);
    const dp = Array(s.length + 1).fill(false);
    dp[0] = true;
    for (let i = 1; i <= s.length; i++) {
        for (let j = 0; j < i; j++) {
            if (dp[j] && wordSet.has(s.substring(j, i))) {
                dp[i] = true;
                break;
            }
        }
    }
    return dp[s.length];
}`
};

const PeerInterviewPage = () => {
  const { user } = useSelector(s => s.auth);
  const [roomCode, setRoomCode] = useState(null);
  const [connected, setConnected] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [code, setCode] = useState('// Select a problem to get started\n');
  const [language, setLanguage] = useState('javascript');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // chat | problem
  
  // Workspace Tab: editor | whiteboard
  const [workspaceTab, setWorkspaceTab] = useState('editor');

  // Peer report state
  const [phase, setPhase] = useState('interview'); // interview | feedback
  const [score, setScore] = useState({
    collabScore: 88,
    summary: 'Strong synergy in technical design. Code structure followed clean practices.',
    strengths: ['Active pair-programming communication.', 'Logical test case verification.'],
    feedback: ['Refine variable naming for better semantic clarity.']
  });

  // Whiteboard Canvas states
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#FF4F00');
  const [brushWidth, setBrushWidth] = useState(3);
  const [eraserMode, setEraserMode] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const socketRef = useRef(null);
  const chatRef = useRef(null);
  const codeUpdateRef = useRef(false);
  const userName = user?.firstName || 'You';

  const addSystemMsg = useCallback((text) => {
    setChatMessages(prev => [...prev, { role: 'system', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
  }, []);

  // Canvas operations drawing handler
  const drawOnCanvas = useCallback((x0, y0, x1, y1, color, width, emit = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    if (emit && socketRef.current) {
      socketRef.current.emit('draw-line', { room: roomCode, x0, y0, x1, y1, color, width });
    }
  }, [roomCode]);

  const clearCanvasLocal = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Init camera
  useEffect(() => {
    if (!roomCode) return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => { setLocalStream(stream); })
      .catch(() => { addSystemMsg('Camera/mic not available — continuing without video.'); });

    return () => { if (localStream) localStream.getTracks().forEach(t => t.stop()); };
  }, [roomCode]);

  // Socket.io connection
  useEffect(() => {
    if (!roomCode) return;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    socketRef.current = io(backendUrl, {
      auth: { token: user?.token },
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      setConnected(true);
      socketRef.current.emit('join-room', { room: roomCode, userName });
      addSystemMsg(`You joined room ${roomCode}`);
    });

    socketRef.current.on('user-joined', ({ userName: name }) => {
      setPartnerConnected(true);
      addSystemMsg(`${name} joined the room 🎉`);
    });

    socketRef.current.on('user-left', ({ userName: name }) => {
      setPartnerConnected(false);
      addSystemMsg(`${name} left the room`);
    });

    socketRef.current.on('code-update', ({ code: newCode }) => {
      codeUpdateRef.current = true;
      setCode(newCode);
    });

    socketRef.current.on('peer-language-change', ({ language: lang }) => {
      setLanguage(lang);
    });

    socketRef.current.on('chat-message', ({ userName: name, message, time }) => {
      setChatMessages(prev => [...prev, { role: 'partner', text: message, sender: name, time }]);
    });

    socketRef.current.on('problem-selected', ({ problem }) => {
      setSelectedProblem(problem);
      setCode(problem.starter);
      addSystemMsg(`Problem selected: ${problem.title}`);
    });

    // Whiteboard socket listeners
    socketRef.current.on('draw-line', ({ x0, y0, x1, y1, color, width }) => {
      drawOnCanvas(x0, y0, x1, y1, color, width, false);
    });

    socketRef.current.on('clear-canvas', () => {
      clearCanvasLocal();
    });

    socketRef.current.on('end-peer-interview', () => {
      setPhase('feedback');
    });

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [roomCode, userName, addSystemMsg, drawOnCanvas, clearCanvasLocal]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMessages]);

  const handleCodeChange = (val) => {
    if (codeUpdateRef.current) { codeUpdateRef.current = false; return; }
    setCode(val);
    socketRef.current?.emit('code-update', { room: roomCode, code: val });
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    socketRef.current?.emit('peer-language-change', { room: roomCode, language: lang });
    
    // reset code to language template
    if (selectedProblem) {
      const qTitle = selectedProblem.title;
      const starter = PEER_STARTER_TEMPLATES[lang]?.[qTitle] || PEER_STARTER_TEMPLATES['javascript']?.[qTitle] || '';
      setCode(starter);
      socketRef.current?.emit('code-update', { room: roomCode, code: starter });
    }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { role: 'self', text: chatInput, sender: userName, time }]);
    socketRef.current?.emit('chat-message', { room: roomCode, userName, message: chatInput, time });
    setChatInput('');
  };

  const selectProblem = (p) => {
    setSelectedProblem(p);
    setCode(p.starter);
    socketRef.current?.emit('problem-selected', { room: roomCode, problem: p });
    setActiveTab('chat');
  };

  const endPeerInterview = () => {
    socketRef.current?.emit('end-peer-interview', { room: roomCode });
    setPhase('feedback');
  };

  // Canvas mouse handlers
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const handleMouseDown = (e) => {
    const coords = getCanvasCoords(e);
    lastPos.current = coords;
    setDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!drawing) return;
    const coords = getCanvasCoords(e);
    const drawColor = eraserMode ? '#000000' : brushColor;
    drawOnCanvas(lastPos.current.x, lastPos.current.y, coords.x, coords.y, drawColor, brushWidth, true);
    lastPos.current = coords;
  };

  const handleMouseUpOrLeave = () => {
    setDrawing(false);
  };

  const handleClearCanvas = () => {
    clearCanvasLocal();
    socketRef.current?.emit('clear-canvas', { room: roomCode });
  };

  const getDiffClass = d => d === 'easy' ? 'badge-easy' : d === 'medium' ? 'badge-medium' : 'badge-hard';

  if (!roomCode) return <RoomSetup onJoin={setRoomCode} />;

  /* ── SCORE SCREEN (Collaborative Report) ── */
  if (phase === 'feedback') {
    return (
      <div style={{ background: '#000000', minHeight: '100vh', color: '#F3F3F5', fontFamily: 'Inter, sans-serif' }} className="py-12 px-6 flex items-center justify-center">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <span className="material-symbols-outlined text-[#FF4F00] text-[48px] mb-2 font-light">handshake</span>
            <h1 className="text-3xl font-black text-white">Peer Evaluation Report</h1>
            <p className="text-slate-400 mt-1">Room: <span className="font-mono text-white">{roomCode}</span> · Collaboration Summary</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            {/* Score block */}
            <div className="rc-card p-6 text-center md:col-span-1">
              <div className="size-24 rounded-full flex flex-col items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(255,79,0,0.05)', border: '3px solid #FF4F00', boxShadow: '0 0 15px rgba(255,79,0,0.1)' }}>
                <span className="text-3xl font-black text-white">{score.collabScore}</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Collab</span>
              </div>
              <h3 className="text-sm font-bold text-white">Synergy Score</h3>
              <p className="text-xs text-slate-500 mt-2">Evaluates shared planning, task division, and active communication.</p>
            </div>

            {/* Critique block */}
            <div className="rc-card p-6 md:col-span-2 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Collaboration Highlights</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{score.summary}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-semibold">Strengths</h4>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                  {score.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Constructive Peer Feedback</h4>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                  {score.feedback.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>

          </div>

          {selectedProblem && PEER_OPTIMAL_SOLUTIONS[selectedProblem.title] && (
            <div className="rc-card p-6 mb-8">
              <h3 className="text-sm font-bold text-white mb-3">Optimal Reference Solution for "{selectedProblem.title}"</h3>
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#222225' }}>
                <Editor
                  height="160px"
                  language="javascript"
                  value={PEER_OPTIMAL_SOLUTIONS[selectedProblem.title]}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    fontSize: 12,
                    fontFamily: 'JetBrains Mono, monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    padding: { top: 12 },
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button onClick={() => { setRoomCode(null); setPhase('interview'); setChatMessages([]); }} className="btn-rc-secondary px-8">
              Create/Join Another Room
            </button>
            <a href="/" className="btn-rc-primary px-8">Back to Dashboard</a>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#000000', minHeight: '100vh', color: '#F3F3F5', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-12 shrink-0" style={{ background: '#0C0C0D', borderBottom: '1px solid #1a1a1e' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setRoomCode(null)} className="flex items-center gap-1.5 text-sm animate-in fade-in" style={{ color: '#8A8B91' }}>
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Leave
          </button>
          <div className="h-4 w-px" style={{ background: '#222225' }} />
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full" style={{ background: connected ? '#10b981' : '#ef4444' }} />
            <span className="font-mono text-xs font-bold" style={{ color: '#F3F3F5' }}>{roomCode}</span>
          </div>
          {partnerConnected && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
              Partner Online
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Main area Workspace Tabs switcher */}
          <div className="flex rounded-lg p-0.5 border" style={{ background: '#111112', borderColor: '#222225' }}>
            <button onClick={() => setWorkspaceTab('editor')}
              className="px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1"
              style={workspaceTab === 'editor' ? { background: '#FF4F00', color: 'white' } : { color: '#8A8B91' }}>
              <span className="material-symbols-outlined text-[14px]">code</span>
              Editor
            </button>
            <button onClick={() => setWorkspaceTab('whiteboard')}
              className="px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1"
              style={workspaceTab === 'whiteboard' ? { background: '#FF4F00', color: 'white' } : { color: '#8A8B91' }}>
              <span className="material-symbols-outlined text-[14px]">gesture</span>
              Whiteboard
            </button>
          </div>

          <div className="h-4 w-px" style={{ background: '#222225' }} />

          <button onClick={() => { setMicOn(m => !m); if (localStream) localStream.getAudioTracks().forEach(t => { t.enabled = !micOn; }); }}
            className="p-2 rounded-lg transition-all"
            style={{ background: micOn ? '#1C1C1F' : 'rgba(239,68,68,0.15)', border: '1px solid #222225', color: micOn ? '#8A8B91' : '#ef4444' }}>
            <span className="material-symbols-outlined text-[16px]">{micOn ? 'mic' : 'mic_off'}</span>
          </button>
          <button onClick={() => { setCamOn(c => !c); if (localStream) localStream.getVideoTracks().forEach(t => { t.enabled = !camOn; }); }}
            className="p-2 rounded-lg transition-all"
            style={{ background: camOn ? '#1C1C1F' : 'rgba(239,68,68,0.15)', border: '1px solid #222225', color: camOn ? '#8A8B91' : '#ef4444' }}>
            <span className="material-symbols-outlined text-[16px]">{camOn ? 'videocam' : 'videocam_off'}</span>
          </button>
          <button onClick={() => { navigator.clipboard.writeText(roomCode); toast.success('Room code copied!'); }}
            className="btn-rc-secondary !py-1.5 !px-3 text-xs gap-1">
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
            Copy Code
          </button>

          <button onClick={endPeerInterview} className="btn-rc-primary !py-1.5 !px-3 text-xs bg-red-600 hover:bg-red-700">
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            End Interview
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>

        {/* Left Side: Dynamic Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {workspaceTab === 'editor' ? (
            /* Coding workspace: split problem desc + Monaco */
            <div className="flex-1 flex min-w-0" style={{ background: '#000000' }}>
              
              {/* Problem Description Column */}
              <div className="w-1/2 flex flex-col border-r min-w-0" style={{ borderColor: '#1a1a1e', background: '#0C0C0D' }}>
                <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: '#1a1a1e', background: '#111112' }}>
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">Problem Description</span>
                </div>
                <div className="flex-1 overflow-y-auto p-5 leading-relaxed">
                  {selectedProblem ? (
                    <>
                      <h2 className="text-lg font-black text-white mb-2">{selectedProblem.title}</h2>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${getDiffClass(selectedProblem.difficulty)}`}>
                        {selectedProblem.difficulty}
                      </span>
                      <p className="text-xs text-slate-300 mt-4 leading-relaxed">
                        {selectedProblem.desc}
                      </p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <span className="material-symbols-outlined text-[40px] opacity-25">code_off</span>
                      <p className="text-xs mt-2">Select a problem from the right "Problems" panel to begin.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Monaco Editor Column */}
              <div className="w-1/2 flex flex-col min-w-0">
                <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: '#1a1a1e', background: '#111112' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Language:</span>
                    <select
                      value={language}
                      onChange={e => handleLanguageChange(e.target.value)}
                      className="bg-[#1C1C1F] border border-[#222225] rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="cpp">C++</option>
                      <option value="java">Java</option>
                      <option value="c">C</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1">
                  <Editor
                    height="100%"
                    language={language === 'cpp' ? 'cpp' : language === 'python' ? 'python' : language}
                    value={code}
                    onChange={handleCodeChange}
                    theme="vs-dark"
                    options={{
                      fontSize: 13, fontFamily: 'JetBrains Mono, monospace',
                      minimap: { enabled: false }, scrollBeyondLastLine: false,
                      padding: { top: 16 }, lineNumbers: 'on',
                      renderLineHighlight: 'gutter', smoothScrolling: true,
                    }}
                  />
                </div>
              </div>

            </div>
          ) : (
            /* Whiteboard sketch area */
            <div className="flex-1 flex flex-col" style={{ background: '#080809' }}>
              
              {/* Canvas controls panel */}
              <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: '#1a1a1e', background: '#111112' }}>
                <div className="flex items-center gap-4">
                  
                  {/* Colors */}
                  <div className="flex items-center gap-1.5">
                    {['#FF4F00', '#3b82f6', '#10b981', '#ffffff'].map(c => (
                      <button key={c} onClick={() => { setBrushColor(c); setEraserMode(false); }}
                        className="size-5 rounded-full border transition-all"
                        style={{ background: c, borderColor: brushColor === c && !eraserMode ? '#fff' : '#222225', transform: brushColor === c && !eraserMode ? 'scale(1.15)' : 'scale(1)' }}
                      />
                    ))}
                  </div>

                  <div className="h-4 w-px bg-slate-800" />

                  {/* Eraser */}
                  <button onClick={() => setEraserMode(prev => !prev)}
                    className="p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all"
                    style={{ background: eraserMode ? '#FF4F00' : '#1C1C1F', color: eraserMode ? '#fff' : '#8A8B91', border: '1px solid #222225' }}>
                    <span className="material-symbols-outlined text-[14px]">ink_eraser</span>
                    Eraser
                  </button>

                  <div className="h-4 w-px bg-slate-800" />

                  {/* Brush Size */}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Width:</span>
                    <input type="range" min={1} max={12} value={brushWidth} onChange={e => setBrushWidth(parseInt(e.target.value))}
                      className="accent-[#FF4F00] h-1 bg-slate-800 rounded-lg cursor-pointer" />
                    <span className="w-4 font-mono text-center text-white">{brushWidth}px</span>
                  </div>

                </div>

                <button onClick={handleClearCanvas}
                  className="btn-rc-secondary !py-1 !px-2.5 text-xs flex items-center gap-1 border-red-500/20 text-red-400 hover:text-red-300">
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  Clear Board
                </button>
              </div>

              {/* Whiteboard drawing canvas */}
              <div className="flex-1 relative overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={1200}
                  height={800}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  onTouchStart={handleMouseDown}
                  onTouchMove={handleMouseMove}
                  onTouchEnd={handleMouseUpOrLeave}
                  className="w-full h-full bg-black cursor-crosshair transition-opacity duration-300"
                />
              </div>

            </div>
          )}

        </div>

        {/* Right side: video tiles + chat/problems side-panel */}
        <div className="w-72 shrink-0 flex flex-col border-l" style={{ borderColor: '#1a1a1e', background: '#0C0C0D' }}>

          {/* Video tiles */}
          <div className="p-3 flex flex-col gap-2 border-b" style={{ borderColor: '#1a1a1e' }}>
            <VideoTile stream={localStream} label={`${userName} (You)`} muted />
            <VideoTile stream={null} label="Partner" />
          </div>

          {/* Tab switcher */}
          <div className="flex border-b" style={{ borderColor: '#1a1a1e' }}>
            {[{ id: 'chat', icon: 'chat', label: 'Chat' }, { id: 'problem', icon: 'code', label: 'Problems' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all border-b-2"
                style={activeTab === tab.id
                  ? { borderBottomColor: '#FF4F00', color: '#FF4F00' }
                  : { borderBottomColor: 'transparent', color: '#8A8B91' }}>
                <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Chat panel */}
          {activeTab === 'chat' && (
            <>
              <div ref={chatRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 hide-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="text-center mt-8">
                    <span className="material-symbols-outlined text-3xl opacity-20" style={{ color: '#8A8B91' }}>chat</span>
                    <p className="text-xs mt-2" style={{ color: '#4a4a52' }}>Chat will appear here</p>
                  </div>
                )}
                {chatMessages.map((m, i) => (
                  <div key={i}>
                    {m.role === 'system' ? (
                      <div className="text-center text-[10px] py-1" style={{ color: '#4a4a52' }}>{m.text}</div>
                    ) : (
                      <div className={`flex flex-col ${m.role === 'self' ? 'items-end' : 'items-start'}`}>
                        <div className="text-[9px] mb-0.5 px-1" style={{ color: '#4a4a52' }}>{m.sender} · {m.time}</div>
                        <div className="px-3 py-2 rounded-xl text-xs max-w-[85%]"
                          style={m.role === 'self'
                            ? { background: 'rgba(255,79,0,0.12)', color: '#F3F3F5', border: '1px solid rgba(255,79,0,0.2)' }
                            : { background: '#1C1C1F', color: '#F3F3F5' }}>
                          {m.text}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-3 border-t" style={{ borderColor: '#1a1a1e' }}>
                <div className="flex gap-2">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat()}
                    placeholder="Message..." className="rc-input flex-1 !py-2 text-xs" />
                  <button onClick={sendChat} className="p-2 rounded-lg" style={{ background: '#FF4F00', color: 'white' }}>
                    <span className="material-symbols-outlined text-[16px]">send</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Problems panel */}
          {activeTab === 'problem' && (
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 hide-scrollbar">
              {PEER_PROBLEMS.map(p => (
                <button key={p.title} onClick={() => selectProblem(p)}
                  className="w-full text-left p-3 rounded-xl transition-all"
                  style={selectedProblem?.title === p.title
                    ? { background: 'rgba(255,79,0,0.08)', border: '1px solid rgba(255,79,0,0.25)' }
                    : { background: '#111112', border: '1px solid #1a1a1e' }}
                  onMouseEnter={e => { if (selectedProblem?.title !== p.title) e.currentTarget.style.borderColor = '#333338'; }}
                  onMouseLeave={e => { if (selectedProblem?.title !== p.title) e.currentTarget.style.borderColor = '#1a1a1e'; }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white">{p.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${getDiffClass(p.difficulty)}`}>{p.difficulty}</span>
                  </div>
                  <p className="text-[10px]" style={{ color: '#8A8B91' }}>{p.desc}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeerInterviewPage;
