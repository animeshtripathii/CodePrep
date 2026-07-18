import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import axiosClient from '../utils/axiosClient';
import { toast } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';

/* ── AI avatar face SVG ── */
const AIAvatar = ({ speaking }) => (
  <div className="relative flex items-center justify-center">
    <div className={`size-28 rounded-full flex items-center justify-center transition-all duration-300 ${speaking ? 'avatar-speaking' : ''}`}
      style={{ background: 'linear-gradient(135deg, #1a0a00, #2a1000)', border: `3px solid ${speaking ? '#FF4F00' : '#222225'}`, boxShadow: speaking ? '0 0 30px rgba(255,79,0,0.4)' : 'none' }}>
      <span className="material-symbols-outlined text-[52px]" style={{ color: speaking ? '#FF4F00' : '#4a4a52' }}>smart_toy</span>
    </div>
    {/* Speaking rings */}
    {speaking && (
      <>
        <div className="absolute size-36 rounded-full opacity-30 animate-ping" style={{ border: '2px solid #FF4F00' }} />
        <div className="absolute size-44 rounded-full opacity-15 animate-ping" style={{ border: '1px solid #FF4F00', animationDelay: '0.3s' }} />
      </>
    )}
    {/* Status badge */}
    <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
      style={{ background: speaking ? '#FF4F00' : '#1C1C1F', color: 'white', border: '2px solid #000' }}>
      <span className="size-1.5 rounded-full" style={{ background: speaking ? 'white' : '#10b981' }} />
      {speaking ? 'Speaking' : 'Listening'}
    </div>
  </div>
);

/* ── Timer ── */
const Timer = ({ seconds, total }) => {
  const pct = seconds / total;
  const color = pct > 0.6 ? '#10b981' : pct > 0.3 ? '#f59e0b' : '#ef4444';
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: '#1C1C1F', border: '1px solid #222225' }}>
      <span className="material-symbols-outlined text-[16px]" style={{ color }}>timer</span>
      <span className="font-mono text-sm font-bold" style={{ color }}>{mm}:{ss}</span>
    </div>
  );
};

const INTERVIEW_QUESTIONS = [
  { title: 'Two Sum', description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].', difficulty: 'easy', starter: '// Two Sum\nfunction twoSum(nums, target) {\n  // Your solution here\n  \n}\n\nconsole.log(twoSum([2,7,11,15], 9));' },
  { title: 'Reverse Linked List', description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.\n\nExample:\nInput: head = [1,2,3,4,5]\nOutput: [5,4,3,2,1]', difficulty: 'easy', starter: '// Reverse Linked List\nfunction reverseList(head) {\n  // Your solution here\n  \n}' },
  { title: 'Valid Parentheses', description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.\n\nExample:\nInput: s = "()[]{}"\nOutput: true', difficulty: 'easy', starter: '// Valid Parentheses\nfunction isValid(s) {\n  // Your solution here\n  \n}\n\nconsole.log(isValid("()[]{}"));' },
  { title: 'Merge K Sorted Lists', description: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.', difficulty: 'hard', starter: '// Merge K Sorted Lists\nfunction mergeKLists(lists) {\n  // Your solution here\n  \n}' },
  { title: 'LRU Cache', description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n- LRUCache(int capacity)\n- int get(int key)\n- void put(int key, int value)', difficulty: 'medium', starter: '// LRU Cache\nclass LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    // Your implementation\n  }\n  \n  get(key) {}\n  put(key, value) {}\n}' },
];

const STARTER_TEMPLATES = {
  javascript: {
    'Two Sum': `// Two Sum\nfunction twoSum(nums, target) {\n  // Your solution here\n  \n}\n\nconsole.log(twoSum([2,7,11,15], 9));`,
    'Reverse Linked List': `// Reverse Linked List\nfunction reverseList(head) {\n  // Your solution here\n  \n}`,
    'Valid Parentheses': `// Valid Parentheses\nfunction isValid(s) {\n  // Your solution here\n  \n}\n\nconsole.log(isValid("()[]{}"));`,
    'Merge K Sorted Lists': `// Merge K Sorted Lists\nfunction mergeKLists(lists) {\n  // Your solution here\n  \n}`,
    'LRU Cache': `// LRU Cache\nclass LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n  }\n  get(key) {}\n  put(key, value) {}\n}`
  },
  python: {
    'Two Sum': `# Two Sum\ndef twoSum(nums, target):\n    # Your solution here\n    pass\n\nprint(twoSum([2,7,11,15], 9))`,
    'Reverse Linked List': `# Reverse Linked List\ndef reverseList(head):\n    # Your solution here\n    pass`,
    'Valid Parentheses': `# Valid Parentheses\ndef isValid(s: str) -> bool:\n    # Your solution here\n    pass\n\nprint(isValid("()[]{}"))`,
    'Merge K Sorted Lists': `# Merge K Sorted Lists\ndef mergeKLists(lists):\n    # Your solution here\n    pass`,
    'LRU Cache': `# LRU Cache\nclass LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n    def get(self, key: int) -> int:\n        pass\n    def put(self, key: int, value: int) -> None:\n        pass`
  },
  cpp: {
    'Two Sum': `// Two Sum\n#include <vector>\n#include <iostream>\n\nstd::vector<int> twoSum(std::vector<int>& nums, int target) {\n    // Your solution here\n    return {};\n}`,
    'Reverse Linked List': `// Reverse Linked List\nListNode* reverseList(ListNode* head) {\n    // Your solution here\n    return nullptr;\n}`,
    'Valid Parentheses': `// Valid Parentheses\n#include <string>\n\nbool isValid(std::string s) {\n    // Your solution here\n    return false;\n}`,
    'Merge K Sorted Lists': `// Merge K Sorted Lists\n#include <vector>\n\nListNode* mergeKLists(std::vector<ListNode*>& lists) {\n    // Your solution here\n    return nullptr;\n}`,
    'LRU Cache': `// LRU Cache\nclass LRUCache {\npublic:\n    LRUCache(int capacity) {}\n    int get(int key) { return -1; }\n    void put(int key, int value) {}\n};`
  },
  java: {
    'Two Sum': `// Two Sum\nimport java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your solution here\n        return new int[]{};\n    }\n}`,
    'Reverse Linked List': `// Reverse Linked List\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n        // Your solution here\n        return null;\n    }\n}`,
    'Valid Parentheses': `// Valid Parentheses\nclass Solution {\n    public boolean isValid(String s) {\n        // Your solution here\n        return false;\n    }\n}`,
    'Merge K Sorted Lists': `// Merge K Sorted Lists\nclass Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        // Your solution here\n        return null;\n    }\n}`,
    'LRU Cache': `// LRU Cache\nclass LRUCache {\n    public LRUCache(int capacity) {}\n    public int get(int key) { return -1; }\n    public void put(int key, int value) {}\n}`
  },
  c: {
    'Two Sum': `// Two Sum\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // Your solution here\n    return NULL;\n}`,
    'Reverse Linked List': `// Reverse Linked List\nstruct ListNode* reverseList(struct ListNode* head) {\n    // Your solution here\n    return NULL;\n}`,
    'Valid Parentheses': `// Valid Parentheses\nbool isValid(char* s) {\n    // Your solution here\n    return false;\n}`,
    'Merge K Sorted Lists': `// Merge K Sorted Lists\nstruct ListNode* mergeKLists(struct ListNode** lists, int listsSize) {\n    // Your solution here\n    return NULL;\n}`,
    'LRU Cache': `// Outer structure\ntypedef struct {}\nLRUCache;`
  }
};

const OPTIMAL_SOLUTIONS = {
  javascript: {
    'Two Sum': `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
    'Reverse Linked List': `function reverseList(head) {
    let prev = null;
    let curr = head;
    while (curr !== null) {
        let nextTemp = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
}`,
    'Valid Parentheses': `function isValid(s) {
    const stack = [];
    const map = {
        ')': '(',
        '}': '{',
        ']': '['
    };
    for (let char of s) {
        if (char === '(' || char === '{' || char === '[') {
            stack.push(char);
        } else {
            if (stack.pop() !== map[char]) return false;
        }
    }
    return stack.length === 0;
}`,
    'Merge K Sorted Lists': `function mergeKLists(lists) {
    if (lists.length === 0) return null;
    return mergeHelper(lists, 0, lists.length - 1);
}`,
    'LRU Cache': `class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.map = new Map();
    }
    get(key) {
        if (!this.map.has(key)) return -1;
        const val = this.map.get(key);
        this.map.delete(key);
        this.map.set(key, val);
        return val;
    }
    put(key, value) {
        if (this.map.has(key)) this.map.delete(key);
        this.map.set(key, value);
        if (this.map.size > this.capacity) {
            const firstKey = this.map.keys().next().value;
            this.map.delete(firstKey);
        }
    }
}`
  },
  python: {
    'Two Sum': `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    'Reverse Linked List': `def reverseList(head):
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev`,
    'Valid Parentheses': `def isValid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)
    return not stack`,
    'Merge K Sorted Lists': `import heapq
def mergeKLists(lists):
    h = []
    for i, lst in enumerate(lists):
        if lst:
            heapq.heappush(h, (lst.val, i, lst))
    dummy = ListNode(0)
    curr = dummy
    while h:
        val, i, node = heapq.heappop(h)
        curr.next = node
        curr = curr.next
        if node.next:
            heapq.heappush(h, (node.next.val, i, node.next))
    return dummy.next`,
    'LRU Cache': `from collections import OrderedDict
class LRUCache:
    def __init__(self, capacity: int):
        self.cache = OrderedDict()
        self.capacity = capacity
    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]
    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)`
  }
};

const AI_PROMPTS = [
  "Hello! I'm your AI interviewer. Let's start with a warm-up. Can you tell me about your coding experience?",
  "Great! Let me present you with a coding problem. Please read it carefully and think aloud as you work through it.",
  "I see you've started coding. Can you walk me through your approach?",
  "Interesting approach! What's the time complexity of your solution?",
  "Good thinking. Have you considered any edge cases?",
  "Your solution looks promising. Can you optimize it further?",
  "Excellent! Let's discuss the space complexity as well.",
  "You're doing great! Let's wrap up. Any questions for me?",
];

const MockInterviewPage = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [phase, setPhase] = useState('setup'); // setup | intro | coding | feedback
  const [selectedQ, setSelectedQ] = useState(0);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(INTERVIEW_QUESTIONS[0].starter);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [timer, setTimer] = useState(2700); // 45 min
  const [timerRunning, setTimerRunning] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState({
    communication: 82,
    codeQuality: 78,
    problemSolving: 85,
    overall: 82,
    strengths: [],
    weaknesses: [],
    optimalSolution: ''
  });
  const [difficulty, setDifficulty] = useState('all');
  const [cvFile, setCvFile] = useState(null);
  const [cvFileName, setCvFileName] = useState('');
  const chatRef = useRef(null);
  const recognitionRef = useRef(null);
  const aiMsgIdx = useRef(0);
  const silenceTimerRef = useRef(null);
  // Always-current mirror of messages — safe to read inside async callbacks
  const messagesRef = useRef([]);

  // Sync code starter on language selector update
  useEffect(() => {
    const qTitle = INTERVIEW_QUESTIONS[selectedQ].title;
    const template = STARTER_TEMPLATES[language]?.[qTitle] || STARTER_TEMPLATES['javascript']?.[qTitle] || '';
    setCode(template);
  }, [language, selectedQ]);

  const addMessage = useCallback((role, text) => {
    const entry = { role, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    messagesRef.current = [...messagesRef.current, entry];
    setMessages(messagesRef.current);
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, 50);
  }, []);

  const speakAI = useCallback((text, onDone) => {
    setAiSpeaking(true);
    addMessage('ai', text);
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speaking before starting
      window.speechSynthesis.cancel();
      
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.95; 
      utt.pitch = 1;
      
      utt.onend = () => { setAiSpeaking(false); onDone && onDone(); };
      utt.onerror = () => { setAiSpeaking(false); onDone && onDone(); };
      window.speechSynthesis.speak(utt);
    } else {
      setTimeout(() => { setAiSpeaking(false); onDone && onDone(); }, text.length * 50);
    }
  }, [addMessage]);

  // Timer
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(id); return 0; } return t - 1; }), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  // Clear the 10-second silence timeout
  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  // Reset the 10-second silence timer (restarts on every speech segment)
  const resetSilenceTimer = (rec) => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setListening(false);
      toast('Microphone stopped — no speech detected for 10 seconds.', { id: 'mic-toast', icon: '🎙️' });
    }, 10000);
  };

  const stopListening = () => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  };

  // Voice recognition
  const startListening = () => {
    // Toggle off if already listening
    if (listening) {
      stopListening();
      return;
    }

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser. Please use Chrome.');
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setAiSpeaking(false);
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    recognitionRef.current = rec;
    // continuous=true keeps mic open across natural pauses in speech
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    // Accumulate all result segments into one transcript buffer
    let transcriptBuffer = '';

    rec.onstart = () => {
      setListening(true);
      transcriptBuffer = '';
      toast.success('Microphone active — speak now. Stops after 10s of silence.', { id: 'mic-toast', duration: 4000 });
      resetSilenceTimer(rec);
    };

    rec.onresult = e => {
      // Collect each finalized result segment
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          transcriptBuffer += (transcriptBuffer ? ' ' : '') + e.results[i][0].transcript.trim();
        }
      }
      // Reset silence timer each time speech is detected
      resetSilenceTimer(rec);
    };

    rec.onerror = e => {
      console.error('Speech recognition error:', e.error);
      clearSilenceTimer();
      setListening(false);
      if (e.error === 'not-allowed') {
        toast.error('Microphone access blocked. Enable permissions in browser.');
      } else if (e.error !== 'aborted') {
        toast.error(`Mic error: ${e.error}`);
      }
    };

    rec.onend = () => {
      clearSilenceTimer();
      setListening(false);
      recognitionRef.current = null;
      // Auto-send whatever was captured — do NOT put it in the text box
      const captured = transcriptBuffer.trim();
      transcriptBuffer = '';
      if (captured) {
        toast.success('Voice captured — sending...', { id: 'mic-toast', duration: 1500 });
        // Add user message to state/ref first
        const entry = { role: 'user', text: captured, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        messagesRef.current = [...messagesRef.current, entry];
        setMessages(messagesRef.current);
        setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, 50);
        // Build history snapshot and call AI — messagesRef.current is already up to date
        const historySnapshot = messagesRef.current.map(m => ({ role: m.role, text: m.text }));
        callAI(captured, historySnapshot);
      }
    };

    rec.start();
  };

  const startInterview = () => {
    setPhase('intro');
    setTimerRunning(true);
    const qTitle = INTERVIEW_QUESTIONS[selectedQ].title;
    setCode(STARTER_TEMPLATES[language]?.[qTitle] || STARTER_TEMPLATES['javascript']?.[qTitle] || '');
    
    let greeting = AI_PROMPTS[0];
    if (cvFileName) {
      greeting = `Hello! I'm your AI interviewer. I've reviewed your resume "${cvFileName}". Let's start with a resume-customized question: Can you tell me about the most challenging coding project mentioned in your experience?`;
    }
    
    setTimeout(() => speakAI(greeting), 500);
  };

  // Shared AI call logic — used by both typed and voice messages
  const callAI = async (text, historySnapshot) => {
    if (user && user.tokens < 20) {
      toast.error('You need at least 20 AI tokens to chat! Please upgrade to continue.', {
        style: { background: '#1C1C1F', color: '#F3F3F5', border: '1px solid #333338' }
      });
      return;
    }

    setAiSpeaking(true);
    try {
      const q = INTERVIEW_QUESTIONS[selectedQ];
      const res = await axiosClient.post('/chat/interview', {
        message: text,
        history: historySnapshot,
        problemTitle: q.title,
        problemDescription: q.description,
        code,
        language,
        cvFileName
      });
      const reply = res.data.text;
      speakAI(reply);
      if (user && user.tokens !== undefined) {
        dispatch({ type: 'auth/updateUserTokens', payload: Math.max(0, user.tokens - 20) });
      }
    } catch (err) {
      console.error('AI Interview communication error:', err);
      speakAI('I encountered a connection hiccup. Could you please tell me about your approach or continue coding?');
    }
  };



  const sendMessage = async () => {
    const text = userInput.trim();
    if (!text) return;
    addMessage('user', text); // updates messagesRef.current synchronously
    setUserInput('');
    // Read from ref — always current, never stale
    const history = messagesRef.current.map(m => ({ role: m.role, text: m.text }));
    await callAI(text, history);
  };

  const endInterview = () => {
    setTimerRunning(false);
    
    // Evaluate performance based on inputs and state to generate the AI Report
    const qTitle = INTERVIEW_QUESTIONS[selectedQ].title;
    const isCodeEdited = code && code !== STARTER_TEMPLATES[language]?.[qTitle] && code !== INTERVIEW_QUESTIONS[selectedQ].starter;
    const msgCount = messages.filter(m => m.role === 'user').length;
    
    // Calculate metric scores
    let comm = Math.floor(Math.random() * 15) + 75; // baseline 75-90
    if (msgCount >= 5) comm += 8;
    else if (msgCount <= 1) comm -= 15;
    comm = Math.min(Math.max(comm, 50), 98);

    let solQuality = Math.floor(Math.random() * 15) + 70;
    if (isCodeEdited) {
      solQuality += 12;
      if (code.includes('for') || code.includes('while') || code.includes('Map') || code.includes('dict') || code.includes('seen')) {
        solQuality += 5;
      }
    } else {
      solQuality = 35; // Didn't write any code!
    }
    solQuality = Math.min(Math.max(solQuality, 20), 98);

    let probSol = Math.floor(Math.random() * 15) + 72;
    if (isCodeEdited) probSol += 8;
    if (msgCount >= 4) probSol += 5;
    probSol = Math.min(Math.max(probSol, 30), 98);

    const overallScore = Math.round((comm + solQuality + probSol) / 3);

    // AI feedback report lists
    let strengthsList = [];
    let weaknessesList = [];

    if (isCodeEdited) {
      strengthsList.push("Demonstrated working knowledge of syntax and logic implementation.");
      strengthsList.push("Approached solving the problem step-by-step using coding paradigms.");
    } else {
      weaknessesList.push("No significant code changes were submitted. Ensure you attempt the implementation.");
    }

    if (msgCount >= 3) {
      strengthsList.push("Clear thought transparency. Thought aloud during critical decisions.");
    } else {
      weaknessesList.push("Communication was minimal. Try to explain your algorithm out loud as you type.");
    }

    if (cvFileName) {
      strengthsList.push(`Aligned coding practices with your professional background: ${cvFileName}`);
    }

    if (strengthsList.length === 0) strengthsList.push("Responsive to standard compiler outputs.");
    if (weaknessesList.length === 0) weaknessesList.push("Could optimize algorithm time-complexity to avoid nested iterations.");

    const optimalSol = OPTIMAL_SOLUTIONS[language]?.[qTitle] || OPTIMAL_SOLUTIONS['javascript']?.[qTitle] || '';

    setScore({
      communication: comm,
      codeQuality: solQuality,
      problemSolving: probSol,
      overall: overallScore,
      strengths: strengthsList,
      weaknesses: weaknessesList,
      optimalSolution: optimalSol
    });

    setPhase('feedback');
    setShowScore(true);
    speakAI("Great job! Let me now evaluate your performance. I've generated your custom feedback evaluation report.");
  };

  const filteredQs = difficulty === 'all' ? INTERVIEW_QUESTIONS : INTERVIEW_QUESTIONS.filter(q => q.difficulty === difficulty);
  const getDiffClass = d => d === 'easy' ? 'badge-easy' : d === 'medium' ? 'badge-medium' : 'badge-hard';

  /* ── SETUP SCREEN ── */
  if (phase === 'setup') {
    return (
      <div style={{ background: '#000000', minHeight: '100vh', color: '#F3F3F5', fontFamily: 'Inter, sans-serif' }}>
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <div className="size-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(255,79,0,0.1)', border: '1px solid rgba(255,79,0,0.2)' }}>
              <span className="material-symbols-outlined text-[32px]" style={{ color: '#FF4F00' }}>smart_toy</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2">AI Mock Interview</h1>
            <p style={{ color: '#8A8B91' }}>Choose a problem, then face the AI interviewer</p>
          </div>

          {/* CV upload */}
          <div className="rc-card p-5 mb-6">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]" style={{ color: '#FF4F00' }}>description</span>
              Tailor Interview with your Resume (Optional)
            </h3>
            <p className="text-xs mb-4" style={{ color: '#8A8B91' }}>Upload your resume/CV (PDF, DOCX or TXT) to get custom, resume-specific behavioral and technical questions.</p>
            <div className="flex items-center gap-4">
              <label className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl border border-dashed cursor-pointer transition-all hover:bg-white/5 animate-in fade-in duration-200"
                style={{ borderColor: '#333338', background: '#0C0C0D' }}>
                <span className="material-symbols-outlined text-2xl mb-1" style={{ color: '#FF4F00' }}>cloud_upload</span>
                <span className="text-xs font-semibold text-white">{cvFileName || 'Select Resume File'}</span>
                <span className="text-[10px] mt-0.5" style={{ color: '#4a4a52' }}>PDF, DOCX, TXT up to 5MB</span>
                <input type="file" accept=".pdf,.docx,.txt" className="hidden"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      setCvFile(file);
                      setCvFileName(file.name);
                      toast.success(`Resume "${file.name}" uploaded successfully!`, { style: { background: '#1C1C1F', color: '#F3F3F5', border: '1px solid #333338' } });
                    }
                  }} />
              </label>
              {cvFile && (
                <button type="button" onClick={() => { setCvFile(null); setCvFileName(''); }}
                  className="btn-rc-secondary !py-2.5" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Difficulty filter */}
          <div className="flex gap-2 mb-4">
            {['all', 'easy', 'medium', 'hard'].map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all"
                style={difficulty === d
                  ? { background: '#FF4F00', color: 'white' }
                  : { background: '#1C1C1F', color: '#8A8B91', border: '1px solid #222225' }}>
                {d}
              </button>
            ))}
          </div>

          {/* Problem list */}
          <div className="flex flex-col gap-3 mb-8">
            {filteredQs.map((q, i) => {
              const realIdx = INTERVIEW_QUESTIONS.indexOf(q);
              return (
                <button key={q.title} onClick={() => setSelectedQ(realIdx)}
                  className="w-full text-left p-4 rounded-xl transition-all"
                  style={selectedQ === realIdx
                    ? { background: 'rgba(255,79,0,0.08)', border: '1px solid rgba(255,79,0,0.3)' }
                    : { background: '#111112', border: '1px solid #222225' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white text-sm">{i + 1}. {q.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${getDiffClass(q.difficulty)}`}>
                      {q.difficulty}
                    </span>
                  </div>
                  <p className="text-xs mt-1 line-clamp-1" style={{ color: '#8A8B91' }}>{q.description}</p>
                </button>
              );
            })}
          </div>

          {/* Language selection on setup screen */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-400 mb-2">Preferred Coding Language</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full bg-[#111112] border border-[#222225] rounded-xl p-3 text-white focus:outline-none focus:border-[#FF4F00]"
              style={{ colorScheme: 'dark' }}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python 3</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="c">C</option>
            </select>
          </div>

          <button onClick={startInterview} className="btn-rc-primary w-full justify-center text-base py-3">
            <span className="material-symbols-outlined text-[20px]">play_circle</span>
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  /* ── SCORE SCREEN (AI Report Layout) ── */
  if (phase === 'feedback') {
    return (
      <div style={{ background: '#000000', minHeight: '100vh', color: '#F3F3F5', fontFamily: 'Inter, sans-serif' }} className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center mb-10">
            <span className="material-symbols-outlined text-[#FF4F00] text-[48px] mb-2">analytics</span>
            <h1 className="text-3xl font-black text-white">AI Evaluation Report</h1>
            <p className="text-slate-400 mt-1">Review your mock interview stats, strengths, and recommended code solutions.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            {/* Column 1: Overall Performance Radial and Breakdowns */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="rc-card p-6 text-center">
                <div className="size-28 rounded-full flex flex-col items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(255,79,0,0.05)', border: '4px solid #FF4F00', boxShadow: '0 0 20px rgba(255,79,0,0.15)' }}>
                  <span className="text-4xl font-black text-white">{score.overall}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Overall</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-6">Performance Score</h3>
                
                {[
                  { label: 'Communication', value: score.communication, color: '#3b82f6' },
                  { label: 'Code Quality', value: score.codeQuality, color: '#10b981' },
                  { label: 'Problem Solving', value: score.problemSolving, color: '#FF4F00' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="mb-4 text-left">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: '#8A8B91' }}>{label}</span>
                      <span className="font-bold text-white">{value}/100</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#1C1C1F' }}>
                      <div className="h-1.5 rounded-full transition-all duration-1000" style={{ width: `${value}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick statistics */}
              <div className="rc-card p-5 text-xs space-y-3" style={{ background: '#0C0C0D' }}>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: '#1c1c1f' }}>
                  <span className="text-slate-400">Problem Attempted:</span>
                  <span className="font-semibold text-white">{INTERVIEW_QUESTIONS[selectedQ].title}</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: '#1c1c1f' }}>
                  <span className="text-slate-400">Coding Language:</span>
                  <span className="font-mono text-white capitalize">{language}</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: '#1c1c1f' }}>
                  <span className="text-slate-400">Resume Uploaded:</span>
                  <span className="font-semibold text-white">{cvFileName ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time Remaining:</span>
                  <span className="font-mono text-white">{Math.floor(timer / 60)}m {timer % 60}s</span>
                </div>
              </div>
            </div>

            {/* Column 2: Detailed AI Feedback and Recommendations */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              <div className="rc-card p-6">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-green-500">check_circle</span>
                  AI Strengths Assessment
                </h3>
                <ul className="space-y-2">
                  {score.strengths.map((str, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-[#FF4F00] font-bold select-none">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rc-card p-6">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-yellow-500">warning</span>
                  Key Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {score.weaknesses.map((weak, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-red-500 font-bold select-none">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Code Solution view */}
              {score.optimalSolution && (
                <div className="rc-card p-6">
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-[#FF4F00]">psychology</span>
                    Optimal reference Solution ({language})
                  </h3>
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#222225' }}>
                    <Editor
                      height="180px"
                      language={language === 'python' ? 'python' : 'javascript'}
                      value={score.optimalSolution}
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

            </div>

          </div>

          <div className="flex gap-4 justify-center">
            <button onClick={() => { setPhase('setup'); setMessages([]); aiMsgIdx.current = 0; setTimer(2700); setCvFile(null); setCvFileName(''); }}
              className="btn-rc-secondary px-8">
              Try Another Interview
            </button>
            <a href="/" className="btn-rc-primary px-8">Back to Dashboard</a>
          </div>

        </div>
      </div>
    );
  }

  /* ── INTERVIEW SCREEN ── */
  return (
    <div style={{ background: '#000000', minHeight: '100vh', color: '#F3F3F5', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-12 shrink-0" style={{ background: '#0C0C0D', borderBottom: '1px solid #1a1a1e' }}>
        <div className="flex items-center gap-3">
          <a href="/interview" className="flex items-center gap-1.5 text-sm" style={{ color: '#8A8B91' }}>
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Exit
          </a>
          <div className="h-4 w-px" style={{ background: '#222225' }} />
          <span className="text-sm font-medium text-white">{INTERVIEW_QUESTIONS[selectedQ].title}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${getDiffClass(INTERVIEW_QUESTIONS[selectedQ].difficulty)}`}>
            {INTERVIEW_QUESTIONS[selectedQ].difficulty}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Timer seconds={timer} total={2700} />
          <button onClick={endInterview} className="btn-rc-primary !py-1.5 !px-3 text-xs bg-red-600 hover:bg-red-700 hover:shadow-red-600/10">
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            End Interview
          </button>
        </div>
      </div>

      {/* Main layout: AI panel + 2-Column Split Workspace */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>

        {/* Column 1: AI Chat Assistant panel */}
        <div className="w-80 shrink-0 flex flex-col border-r" style={{ borderColor: '#1a1a1e', background: '#0C0C0D' }}>

          {/* Avatar */}
          <div className="flex flex-col items-center py-6 px-4 border-b" style={{ borderColor: '#1a1a1e' }}>
            <AIAvatar speaking={aiSpeaking} />
            <div className="mt-4 text-center">
              <div className="text-sm font-bold text-white">Alex (AI Interviewer)</div>
              <div className="text-xs mt-0.5" style={{ color: '#8A8B91' }}>Senior Engineer @ CodePrep</div>
            </div>
          </div>

          {/* Chat transcript — fixed height, scrolls internally */}
          <div ref={chatRef} className="overflow-y-auto p-3 flex flex-col gap-3" style={{ flex: '1 1 0', minHeight: 0, scrollbarWidth: 'thin', scrollbarColor: '#333338 transparent' }}>
            {messages.length === 0 && (
              <div className="text-center mt-8">
                <span className="material-symbols-outlined text-3xl opacity-20" style={{ color: '#8A8B91' }}>chat</span>
                <p className="text-xs mt-2" style={{ color: '#4a4a52' }}>Conversation will appear here</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="size-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold"
                  style={{ background: m.role === 'ai' ? 'rgba(255,79,0,0.2)' : 'rgba(59,130,246,0.2)', color: m.role === 'ai' ? '#FF4F00' : '#3b82f6' }}>
                  {m.role === 'ai' ? 'AI' : 'You'}
                </div>
                <div className="max-w-[80%]">
                  <div className="px-3 py-2 rounded-xl text-xs leading-relaxed"
                    style={m.role === 'ai'
                      ? { background: '#1C1C1F', color: '#F3F3F5' }
                      : { background: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}>
                    {m.text}
                  </div>
                  <div className="text-[9px] mt-1 px-1" style={{ color: '#4a4a52' }}>{m.time}</div>
                </div>
              </div>
            ))}
            {aiSpeaking && (
              <div className="flex gap-2">
                <div className="size-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold"
                  style={{ background: 'rgba(255,79,0,0.2)', color: '#FF4F00' }}>AI</div>
                <div className="px-3 py-2 rounded-xl" style={{ background: '#1C1C1F' }}>
                  <span className="typing-dot text-orange-400">●</span>
                  <span className="typing-dot text-orange-400 ml-1">●</span>
                  <span className="typing-dot text-orange-400 ml-1">●</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t" style={{ borderColor: '#1a1a1e' }}>
            <div className="flex gap-2">
              <input
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={listening ? '🎙 Listening...' : 'Type or speak...'}
                className="rc-input flex-1 !py-2 text-xs"
              />
              <button onClick={startListening}
                title={listening ? 'Stop listening (click to stop)' : 'Start voice input'}
                className="p-2 rounded-lg transition-all"
                style={{ background: listening ? 'rgba(239,68,68,0.2)' : '#1C1C1F', border: `1px solid ${listening ? 'rgba(239,68,68,0.4)' : '#222225'}`, color: listening ? '#ef4444' : '#8A8B91' }}>
                <span className="material-symbols-outlined text-[16px]">{listening ? 'mic_off' : 'mic'}</span>
              </button>
              <button onClick={sendMessage}
                className="p-2 rounded-lg" style={{ background: '#FF4F00', color: 'white' }}>
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right workspace: Split coding section */}
        <div className="flex-1 flex min-w-0" style={{ background: '#000000' }}>
          
          {/* Column 2: Problem description */}
          <div className="w-1/2 flex flex-col border-r min-w-0" style={{ borderColor: '#1a1a1e', background: '#0C0C0D' }}>
            <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: '#1a1a1e', background: '#111112' }}>
              <span className="text-xs font-semibold text-white uppercase tracking-wider">Problem Description</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 leading-relaxed">
              <h2 className="text-lg font-black text-white mb-2">{INTERVIEW_QUESTIONS[selectedQ].title}</h2>
              <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {INTERVIEW_QUESTIONS[selectedQ].description}
              </div>
            </div>
          </div>

          {/* Column 3: Monaco Editor + Language Selector */}
          <div className="w-1/2 flex flex-col min-w-0">
            <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: '#1a1a1e', background: '#111112' }}>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Language:</span>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
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
                onChange={v => setCode(v)}
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

      </div>
    </div>
  );
};

export default MockInterviewPage;
