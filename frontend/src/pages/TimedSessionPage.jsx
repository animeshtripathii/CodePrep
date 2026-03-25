import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import axiosClient from '../utils/axiosClient';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TimedSessionPage = () => {
    const navigate = useNavigate();

    const [session, setSession] = useState(null);
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('// Write your code here\n');
    
    const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes in seconds
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Warn tracking
    const warnCountRef = useRef(0);
    const latestCodeRef = useRef(code);
    const latestLanguageRef = useRef(language);
    const latestProblemRef = useRef(problem);
    const latestSessionRef = useRef(session);

    useEffect(() => {
        latestCodeRef.current = code;
    }, [code]);

    useEffect(() => {
        latestLanguageRef.current = language;
    }, [language]);

    useEffect(() => {
        latestProblemRef.current = problem;
    }, [problem]);

    useEffect(() => {
        latestSessionRef.current = session;
    }, [session]);

    useEffect(() => {
        const startSession = async () => {
            try {
                const response = await axiosClient.post('/interview/start');
                setSession(response.data.session);
                
                // Fetch problem details
                const probRes = await axiosClient.get(`problem/problemById/${response.data.problemId}`);
                const problemData = probRes.data.problem;
                setProblem(problemData);
                
                if (problemData.startCode && problemData.startCode.length > 0) {
                    const starter = problemData.startCode.find(sc => sc.language.toLowerCase() === language)
                        || problemData.startCode[0];
                    if (starter) {
                        setCode(starter.initialCode);
                        setLanguage(starter.language.toLowerCase());
                    }
                }
                setLoading(false);
            } catch (error) {
                console.error('Error starting session:', error);
                toast.error('Failed to start timed session');
                navigate('/dashboard');
            }
        };

        startSession();
    }, [navigate]);

    const handleEndSession = useCallback(async (autoSubmit = false) => {
        if (isSubmitting) return;

        const currentSession = latestSessionRef.current;
        const currentProblem = latestProblemRef.current;
        const currentCode = latestCodeRef.current;
        const currentLanguage = latestLanguageRef.current;

        if (!currentSession || !currentProblem) {
            toast.error('Session data missing. Returning to dashboard.');
            navigate('/dashboard');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Ending session...');

        try {
            if (autoSubmit || currentCode) {
                await axiosClient.post(`/submission/submit/${currentProblem._id}`, {
                    code: currentCode,
                    language: currentLanguage,
                });
            }

            await axiosClient.post('/interview/end', { sessionId: currentSession._id });
            toast.success('Session completed and recorded.', { id: toastId });
            navigate('/dashboard');
        } catch (error) {
            toast.error('Failed to end session gracefully.', { id: toastId });
            navigate('/dashboard');
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, navigate]);

    // Timer logic
    useEffect(() => {
        if (loading || !session) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleEndSession(true); // Auto-submit when time is up
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [loading, session, handleEndSession]);

    // Visibility Change / Tab Switch detection
    useEffect(() => {
        if (loading || !session) return;

        const handleVisibilityChange = async () => {
            if (document.hidden) {
                warnCountRef.current += 1;
                
                // Flag on backend
                try {
                    await axiosClient.post('/interview/flag', { sessionId: session._id });
                } catch (e) {
                     console.error("Error flagging session", e);
                }

                if (warnCountRef.current >= 3) {
                    alert("Session terminated due to multiple tab switches.");
                    handleEndSession(false);
                } else {
                    alert(`Warning: You switched tabs. This is a strict timed session. (${warnCountRef.current}/3 warnings)`);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Prevent accidental closing
        const handleBeforeUnload = (e) => {
             e.preventDefault();
             e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [loading, session]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (loading || !problem) {
        return <div className="flex h-screen items-center justify-center font-bold text-2xl text-slate-500 animate-pulse">Initializing Strict Secure Session...</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-[#0f111a] text-slate-200 overflow-hidden font-display select-none relative">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

            {/* Header */}
            <header className="flex justify-between items-center px-6 py-4 bg-black/40 border-b border-white/10 shadow-sm z-10 shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-rose-600 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                        Strict Timed Session
                    </h1>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-center">
                        <div className="text-xs text-slate-400 font-bold tracking-widest uppercase mb-1 drop-shadow-md">Time Remaining</div>
                        <div className={`text-4xl font-mono font-bold tracking-tight drop-shadow-lg ${timeLeft < 300 ? 'text-rose-500 animate-pulse drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]' : 'text-slate-100'}`}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            if (window.confirm("Are you sure you want to end this session early?")) {
                                handleEndSession(true);
                            }
                        }}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 font-bold rounded shadow-[0_0_15px_rgba(244,63,94,0.2)] disabled:opacity-50 transition-all backdrop-blur-sm hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                    >
                        End & Submit
                    </button>
                </div>
            </header>

            {/* Main Area */}
            <main className="flex-1 overflow-hidden p-2 gap-2 flex relative z-10 bg-transparent">
                <Group orientation="horizontal">
                    <Panel defaultSize={40} minSize={20} className="flex flex-col glass-card bg-black/20 rounded-xl border border-white/10 shadow-2xl overflow-hidden m-1 backdrop-blur-xl">
                        <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center pointer-events-none backdrop-blur-md">
                            <h2 className="font-bold text-lg text-white drop-shadow-sm">{problem.title}</h2>
                            <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded border shadow-sm ${problem.difficulty === 'hard' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : problem.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                {problem.difficulty}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar text-sm text-slate-300 pointer-events-auto bg-transparent">
                            <div className="prose prose-invert prose-sm max-w-none 
                                            prose-headings:text-slate-100 prose-a:text-blue-400 prose-strong:text-slate-200 
                                            prose-code:text-emerald-300 prose-code:bg-black/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-white/10
                                            prose-pre:bg-black/60 prose-pre:text-slate-300 prose-pre:border prose-pre:border-white/10">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {problem.description}
                                </ReactMarkdown>
                            </div>
                            {problem.visibleTestCases && problem.visibleTestCases.length > 0 && (
                                <div className="mt-8 space-y-4">
                                    <h3 className="font-bold text-base text-white border-b border-white/10 pb-2 drop-shadow-sm">Examples</h3>
                                    {problem.visibleTestCases.map((tc, i) => (
                                        <div key={i} className="bg-black/30 border border-white/10 p-4 rounded-lg shadow-inner backdrop-blur-sm">
                                            <div className="font-bold text-slate-200 mb-2 drop-shadow-sm capitalize tracking-wide">Example {i+1}:</div>
                                            <div className="bg-black/40 p-3 rounded border border-white/5 shadow-inner">
                                                <div className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap"><span className="text-blue-400 font-bold uppercase tracking-wider">Input:</span> <span className="text-slate-300">{tc.input}</span></div>
                                                <div className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap mt-1"><span className="text-emerald-400 font-bold uppercase tracking-wider">Output:</span> <span className="text-slate-300">{tc.output}</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Panel>

                    <Separator className="w-2 cursor-col-resize group flex items-center justify-center touch-none">
                        <div className="h-6 w-1 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors" />
                    </Separator>

                    <Panel defaultSize={60} minSize={30} className="flex flex-col glass-card bg-black/40 rounded-xl border border-white/10 shadow-2xl overflow-hidden m-1 backdrop-blur-md">
                        <div className="px-4 py-2 bg-black/40 border-b border-white/10 flex items-center justify-between pointer-events-none backdrop-blur-xl shrink-0">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider drop-shadow-sm">Solution Editor</div>
                            <select 
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-black/50 border border-white/10 text-slate-300 px-3 py-1.5 rounded-md text-xs font-bold pointer-events-auto outline-none focus:border-purple-500/50 transition-colors shadow-inner [&>option]:bg-slate-900"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="c++">C++</option>
                                <option value="java">Java</option>
                            </select>
                        </div>
                        <div className="flex-1 relative pointer-events-auto bg-[#0f111a]/50">
                            <Editor
                                height="100%"
                                language={language === 'c++' ? 'cpp' : language}
                                value={code}
                                onChange={value => setCode(value)}
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 15,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    lineHeight: 24,
                                    padding: { top: 16 }
                                }}
                            />
                        </div>
                    </Panel>
                </Group>
            </main>
        </div>
    );
};

export default TimedSessionPage;
