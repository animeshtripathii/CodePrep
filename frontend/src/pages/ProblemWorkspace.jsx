import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-hot-toast';
import Editor from '@monaco-editor/react';

const ProblemWorkspace = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Problem data
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);

    // Editor state
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');

    // Left panel tab
    const [leftTab, setLeftTab] = useState('description');

    // Bottom panel tab
    const [bottomTab, setBottomTab] = useState('testcase');
    const [activeTestCase, setActiveTestCase] = useState(0);

    // Console / test results
    const [consoleOutput, setConsoleOutput] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Resizing state ---
    // Horizontal: left panel width (percentage of total width)
    const [leftWidth, setLeftWidth] = useState(40);
    const isResizingH = useRef(false);
    const containerRef = useRef(null);

    // Vertical: editor height (percentage of right panel height)
    const [editorHeight, setEditorHeight] = useState(60);
    const isResizingV = useRef(false);
    const rightPanelRef = useRef(null);

    // Fetch problem on mount
    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const response = await axiosClient.get(`/problem/problemById/${id}`);
                const data = response.data.problem || response.data;
                setProblem(data);
                if (data.startCode && data.startCode.length > 0) {
                    const defaultLang = data.startCode[0];
                    setLanguage(defaultLang.language);
                    setCode(defaultLang.initialCode);
                }
            } catch (error) {
                console.error('Failed to fetch problem:', error);
                toast.error('Failed to load problem');
            } finally {
                setLoading(false);
            }
        };
        fetchProblem();
    }, [id]);

    // Handle language change
    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        if (problem?.startCode) {
            const match = problem.startCode.find(s => s.language === lang);
            if (match) setCode(match.initialCode);
            else setCode('');
        }
    };

    // Console log helper
    const addConsoleLog = (text, type = 'info') => {
        setConsoleOutput(prev => [...prev, { text, type, time: Date.now() }]);
    };

    // Run code
    const handleRun = async () => {
        setIsRunning(true);
        setConsoleOutput([]);
        setBottomTab('testresult');
        addConsoleLog('Compiling modules...');
        addConsoleLog(`Language: ${language}`);
        try {
            const response = await axiosClient.post(`/submission/run/${id}`, { code, language });
            const results = response.data.testResult;
            if (Array.isArray(results)) {
                results.forEach((r, i) => {
                    if (r.status?.id === 3) {
                        addConsoleLog(`✔ PASS: Test Case #${i + 1} — Expected '${r.expected_output?.trim()}', Got '${r.stdout?.trim()}'`, 'success');
                    } else if (r.status?.id === 4) {
                        addConsoleLog(`✘ FAIL: Test Case #${i + 1} — Expected '${r.expected_output?.trim()}', Got '${r.stdout?.trim() || 'null'}'`, 'error');
                    } else if (r.status?.id === 6) {
                        addConsoleLog(`✘ Compilation Error: ${r.compile_output || r.stderr || 'Unknown'}`, 'error');
                    } else if (r.status?.id === 5) {
                        addConsoleLog(`✘ Time Limit Exceeded on Test Case #${i + 1}`, 'error');
                    } else {
                        addConsoleLog(`✘ Runtime Error on Test Case #${i + 1}: ${r.stderr || r.status?.description || 'Unknown'}`, 'error');
                    }
                });
            } else {
                addConsoleLog('Run completed.', 'success');
            }
        } catch (error) {
            addConsoleLog(`Error: ${error.response?.data?.message || error.message}`, 'error');
        } finally {
            setIsRunning(false);
        }
    };

    // Submit code
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setConsoleOutput([]);
        setBottomTab('testresult');
        addConsoleLog('Submitting solution...');
        try {
            const response = await axiosClient.post(`/submission/submit/${id}`, { code, language });
            addConsoleLog(response.data.message || 'Submitted successfully!', 'success');
            toast.success(response.data.message || 'Solution accepted!');
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            addConsoleLog(`Submission Failed: ${msg}`, 'error');
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Resize handlers ---
    const handleHResizeDown = useCallback(() => { isResizingH.current = true; }, []);
    const handleVResizeDown = useCallback(() => { isResizingV.current = true; }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizingH.current && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const pct = ((e.clientX - rect.left) / rect.width) * 100;
                if (pct > 20 && pct < 70) setLeftWidth(pct);
            }
            if (isResizingV.current && rightPanelRef.current) {
                const rect = rightPanelRef.current.getBoundingClientRect();
                const pct = ((e.clientY - rect.top) / rect.height) * 100;
                if (pct > 20 && pct < 85) setEditorHeight(pct);
            }
        };
        const handleMouseUp = () => {
            isResizingH.current = false;
            isResizingV.current = false;
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // Monaco language map
    const getMonacoLanguage = (lang) => {
        const map = { 'python': 'python', 'java': 'java', 'c++': 'cpp', 'cpp': 'cpp', 'javascript': 'javascript', 'js': 'javascript', 'c': 'c', 'go': 'go', 'rust': 'rust', 'typescript': 'typescript' };
        return map[lang?.toLowerCase()] || 'plaintext';
    };

    // Monaco mount
    const handleEditorMount = (editor) => { editor.focus(); };

    // Difficulty badge
    const getDifficultyBadge = (d) => {
        if (d === 'easy') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
        if (d === 'medium') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25';
        return 'bg-red-500/15 text-red-400 border-red-500/25';
    };

    // File extension
    const getFileExt = () => {
        if (language === 'python') return 'py';
        if (language === 'java') return 'java';
        if (language === 'c++' || language === 'cpp') return 'cpp';
        if (language === 'javascript' || language === 'js') return 'js';
        return language;
    };

    if (loading) {
        return (
            <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-[#0dccf2]/30 border-t-[#0dccf2] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="h-screen bg-[#0a0a0a] flex items-center justify-center text-slate-500 text-sm">
                Problem not found.
            </div>
        );
    }

    const testCases = problem.visibleTestCases || [];

    return (
        <div className="h-screen bg-[#050a0b] dark:bg-[#101f22] text-slate-300 font-sans selection:bg-[#0dccf2]/30 relative overflow-hidden transition-colors duration-300">
            {/* Ambient background glow */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#0dccf2]/20 rounded-full blur-[100px] opacity-50"></div>
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#0dccf2]/10 rounded-full blur-[120px] opacity-40"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-emerald-500/5 rounded-full blur-[150px] opacity-20"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(13,204,242,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(13,204,242,0.03)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]"></div>
            </div>

            {/* Top Navigation Bar */}
            <nav className="relative z-20 h-12 shrink-0 flex items-center justify-between px-4 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    </button>
                    <div className="h-5 w-px bg-white/10"></div>
                    <span className="text-sm font-semibold text-white tracking-tight">DevNexus</span>
                    <span className="text-[10px] font-mono text-[#0dccf2]/50 tracking-widest hidden sm:inline">WORKSPACE</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 bg-white/[0.03] px-2.5 py-1 rounded-full border border-white/[0.06]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span>READY</span>
                    </div>
                    <button
                        onClick={handleRun}
                        disabled={isRunning || isSubmitting}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.1] hover:border-white/[0.15] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                    >
                        {isRunning ? (
                            <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <span className="material-symbols-outlined text-[16px] text-[#0dccf2]">play_arrow</span>
                        )}
                        <span>{isRunning ? 'Running...' : 'Run'}</span>
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isRunning || isSubmitting}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                    >
                        {isSubmitting ? (
                            <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                        )}
                        <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
                    </button>
                </div>
            </nav>

            {/* Main workspace area */}
            <div className="relative z-10 flex-1 flex min-h-0 p-2 gap-0" ref={containerRef}>

                {/* ===== LEFT PANEL — Problem Description ===== */}
                <div
                    className="flex flex-col min-w-0 min-h-0 h-full rounded-xl overflow-hidden border border-white/[0.06] bg-[#111111]/70 backdrop-blur-2xl"
                    style={{ width: `${leftWidth}%` }}
                >
                    {/* Left Panel Tabs */}
                    <div className="h-10 flex items-center gap-0 px-1 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
                        {[
                            { key: 'description', icon: 'description', label: 'Description' },
                            { key: 'solutions', icon: 'lightbulb', label: 'Solutions' },
                            { key: 'submissions', icon: 'history', label: 'Submissions' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setLeftTab(tab.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                                    leftTab === tab.key
                                        ? 'bg-white/[0.08] text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Left Panel Body */}
                    <div className="flex-1 min-h-0 flex flex-col">
                        {leftTab === 'description' && (
                            <div className="p-5 space-y-5 flex-1 overflow-y-auto custom-scroll" style={{maxHeight: '100%', minHeight: 0}}>
                                {/* Title + Difficulty */}
                                <div>
                                    <h1 className="text-xl font-bold text-white mb-3 leading-tight">{problem.title}</h1>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${getDifficultyBadge(problem.difficulty)}`}>
                                            {problem.difficulty}
                                        </span>
                                        {problem.tags?.map((tag, i) => (
                                            <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-400 border border-white/[0.08]">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="text-[13px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                                    {problem.description}
                                </div>

                                {/* Examples */}
                                {testCases.length > 0 && (
                                    <div className="space-y-4">
                                        {testCases.map((tc, i) => (
                                            <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                                                <div className="px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
                                                    <span className="text-[11px] font-semibold text-slate-400">Example {i + 1}</span>
                                                </div>
                                                <div className="p-4 space-y-3 font-mono text-xs">
                                                    <div>
                                                        <span className="text-slate-500 text-[10px] uppercase tracking-wider">Input</span>
                                                        <div className="mt-1 px-3 py-2 rounded-lg bg-black/30 text-emerald-400 whitespace-pre-wrap">{tc.input}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 text-[10px] uppercase tracking-wider">Output</span>
                                                        <div className="mt-1 px-3 py-2 rounded-lg bg-black/30 text-[#0dccf2] whitespace-pre-wrap">{tc.output}</div>
                                                    </div>
                                                    {tc.explanation && (
                                                        <div>
                                                            <span className="text-slate-500 text-[10px] uppercase tracking-wider">Explanation</span>
                                                            <div className="mt-1 text-slate-400 font-sans text-[12px] leading-relaxed">{tc.explanation}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Constraints placeholder */}
                                {problem.constraints && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-white mb-2">Constraints</h3>
                                        <div className="text-[13px] text-slate-400 whitespace-pre-wrap">{problem.constraints}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {leftTab === 'solutions' && (
                            <div className="flex flex-col items-center justify-center flex-1 overflow-y-auto custom-scroll p-5" style={{maxHeight: '100%', minHeight: 0}}>
                                <span className="material-symbols-outlined text-4xl mb-3 text-slate-600">lightbulb</span>
                                <p className="text-sm">Solutions will appear here</p>
                                <p className="text-xs text-slate-600 mt-1">Solve the problem first!</p>
                            </div>
                        )}

                        {leftTab === 'submissions' && (
                            <div className="flex flex-col items-center justify-center flex-1 overflow-y-auto custom-scroll p-5" style={{maxHeight: '100%', minHeight: 0}}>
                                <span className="material-symbols-outlined text-4xl mb-3 text-slate-600">history</span>
                                <p className="text-sm">Your submissions will appear here</p>
                                <p className="text-xs text-slate-600 mt-1">Run or submit your code to see results</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ===== HORIZONTAL RESIZER ===== */}
                <div
                    onMouseDown={handleHResizeDown}
                    className="w-2 shrink-0 cursor-col-resize flex items-center justify-center group hover:bg-[#0dccf2]/5 transition-colors duration-200 rounded-full mx-0"
                >
                    <div className="w-0.5 h-8 rounded-full bg-white/[0.08] group-hover:bg-[#0dccf2]/40 group-hover:h-12 transition-all duration-200"></div>
                </div>

                {/* ===== RIGHT PANEL — Editor + Testcase ===== */}
                <div
                    className="flex flex-col min-w-0 flex-1"
                    ref={rightPanelRef}
                >
                    {/* --- Code Editor Section --- */}
                    <div
                        className="flex flex-col rounded-xl overflow-hidden border border-white/[0.06] bg-[#111111]/70 backdrop-blur-2xl"
                        style={{ height: `${editorHeight}%` }}
                    >
                        {/* Editor Header */}
                        <div className="h-10 flex items-center justify-between px-2 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
                            <div className="flex items-center gap-1">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] text-white text-[11px] font-medium">
                                    <span className="material-symbols-outlined text-[14px] text-emerald-400">code</span>
                                    solution.{getFileExt()}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Language selector */}
                                <select
                                    value={language}
                                    onChange={(e) => handleLanguageChange(e.target.value)}
                                    className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0dccf2]/40 cursor-pointer hover:bg-white/[0.08] transition-colors appearance-none pr-6"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                                >
                                    {problem.startCode?.map(sc => (
                                        <option key={sc.language} value={sc.language}>{sc.language.charAt(0).toUpperCase() + sc.language.slice(1)}</option>
                                    ))}
                                    {(!problem.startCode || problem.startCode.length === 0) && (
                                        <>
                                            <option value="python">Python</option>
                                            <option value="java">Java</option>
                                            <option value="c++">C++</option>
                                            <option value="javascript">JavaScript</option>
                                        </>
                                    )}
                                </select>
                                <button
                                    onClick={() => {
                                        if (problem?.startCode) {
                                            const match = problem.startCode.find(s => s.language === language);
                                            if (match) setCode(match.initialCode);
                                        }
                                    }}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
                                    title="Reset code"
                                >
                                    <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                                </button>
                            </div>
                        </div>

                        {/* Monaco Editor */}
                        <div className="flex-1 min-h-0">
                            <Editor
                                language={getMonacoLanguage(language)}
                                value={code}
                                onChange={(value) => setCode(value || '')}
                                onMount={handleEditorMount}
                                theme="vs-dark"
                                options={{
                                    fontSize: 14,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                                    fontLigatures: true,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    padding: { top: 12, bottom: 12 },
                                    lineNumbersMinChars: 3,
                                    glyphMargin: false,
                                    folding: true,
                                    lineDecorationsWidth: 8,
                                    automaticLayout: true,
                                    tabSize: 4,
                                    wordWrap: 'off',
                                    cursorBlinking: 'smooth',
                                    cursorSmoothCaretAnimation: 'on',
                                    smoothScrolling: true,
                                    contextmenu: true,
                                    renderLineHighlight: 'line',
                                    bracketPairColorization: { enabled: true },
                                    suggestOnTriggerCharacters: true,
                                    acceptSuggestionOnEnter: 'on',
                                    overviewRulerBorder: false,
                                    scrollbar: {
                                        verticalScrollbarSize: 6,
                                        horizontalScrollbarSize: 6,
                                    },
                                }}
                                loading={
                                    <div className="flex items-center justify-center h-full bg-[#1a1a1a]">
                                        <div className="w-6 h-6 border-2 border-[#0dccf2]/30 border-t-[#0dccf2] rounded-full animate-spin"></div>
                                    </div>
                                }
                            />
                        </div>
                    </div>

                    {/* ===== VERTICAL RESIZER ===== */}
                    <div
                        onMouseDown={handleVResizeDown}
                        className="h-2 shrink-0 cursor-row-resize flex items-center justify-center group hover:bg-[#0dccf2]/5 transition-colors duration-200 rounded-full my-0"
                    >
                        <div className="h-0.5 w-8 rounded-full bg-white/[0.08] group-hover:bg-[#0dccf2]/40 group-hover:w-12 transition-all duration-200"></div>
                    </div>

                    {/* --- Testcase / Test Result Section --- */}
                    <div
                        className="flex flex-col rounded-xl overflow-hidden border border-white/[0.06] bg-[#111111]/70 backdrop-blur-2xl flex-1 min-h-0"
                    >
                        {/* Bottom Panel Tabs */}
                        <div className="h-10 flex items-center justify-between px-2 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setBottomTab('testcase')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                                        bottomTab === 'testcase'
                                            ? 'bg-white/[0.08] text-white'
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[14px] text-emerald-400">check_box</span>
                                    Testcase
                                </button>
                                <button
                                    onClick={() => setBottomTab('testresult')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                                        bottomTab === 'testresult'
                                            ? 'bg-white/[0.08] text-white'
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[14px] text-[#0dccf2]">terminal</span>
                                    Test Result
                                </button>
                            </div>
                            {bottomTab === 'testresult' && (
                                <button
                                    onClick={() => setConsoleOutput([])}
                                    className="text-[10px] uppercase tracking-wider text-slate-600 hover:text-slate-300 transition-colors cursor-pointer px-2 py-1 rounded hover:bg-white/[0.04]"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Bottom Panel Body */}
                        <div className="flex-1 overflow-y-auto custom-scroll min-h-0">
                            {bottomTab === 'testcase' && (
                                <div className="p-4">
                                    {/* Case tabs */}
                                    <div className="flex items-center gap-2 mb-4">
                                        {testCases.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveTestCase(i)}
                                                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                                                    activeTestCase === i
                                                        ? 'bg-white/[0.1] text-white border border-white/[0.1]'
                                                        : 'text-slate-500 hover:text-slate-300 bg-white/[0.03] hover:bg-white/[0.06] border border-transparent'
                                                }`}
                                            >
                                                Case {i + 1}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Active test case details */}
                                    {testCases[activeTestCase] && (
                                        <div className="space-y-3">
                                            {/* Parse input fields - show each key-value */}
                                            <div>
                                                <label className="text-[11px] font-medium text-slate-500 mb-1.5 block">Input</label>
                                                <div className="bg-black/30 border border-white/[0.06] rounded-lg px-3 py-2.5 font-mono text-[13px] text-slate-300 whitespace-pre-wrap">
                                                    {testCases[activeTestCase].input}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-medium text-slate-500 mb-1.5 block">Expected Output</label>
                                                <div className="bg-black/30 border border-white/[0.06] rounded-lg px-3 py-2.5 font-mono text-[13px] text-[#0dccf2] whitespace-pre-wrap">
                                                    {testCases[activeTestCase].output}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {testCases.length === 0 && (
                                        <div className="text-center py-8 text-slate-600 text-sm">
                                            No test cases available.
                                        </div>
                                    )}
                                </div>
                            )}

                            {bottomTab === 'testresult' && (
                                <div className="p-4 font-mono text-xs space-y-1">
                                    {consoleOutput.length === 0 && (
                                        <div className="text-center py-8 text-slate-600 text-sm font-sans">
                                            <span className="material-symbols-outlined text-3xl mb-2 block text-slate-700">terminal</span>
                                            Run or submit your code to see results
                                        </div>
                                    )}
                                    {consoleOutput.map((log, i) => (
                                        <div
                                            key={i}
                                            className={`px-2 py-1 rounded ${
                                                log.type === 'success'
                                                    ? 'text-emerald-400 bg-emerald-500/5'
                                                    : log.type === 'error'
                                                    ? 'text-red-400 bg-red-500/5'
                                                    : 'text-slate-400'
                                            }`}
                                        >
                                            {log.type === 'info' && <span className="text-slate-600 mr-1">&gt;</span>}
                                            {log.text}
                                        </div>
                                    ))}
                                    {(isRunning || isSubmitting) && (
                                        <div className="flex items-center gap-2 text-slate-400 mt-2 px-2">
                                            <span className="w-1.5 h-4 bg-[#0dccf2] rounded-sm animate-pulse"></span>
                                            <span className="text-[11px]">{isRunning ? 'Running tests...' : 'Submitting...'}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProblemWorkspace;
