import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import clsx from 'clsx';
import axiosClient from '../utils/axiosClient';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CodeEditorPage = () => {
    const { id } = useParams();
    const [language, setLanguage] = useState('python');
    const [editorTheme, setEditorTheme] = useState('codeprep-dark');
    const [code, setCode] = useState('');
    const [output, setOutput] = useState('');
    const [activeTab, setActiveTab] = useState('description');
    const [activeBottomTab, setActiveBottomTab] = useState('testcases');
    const [activeTestCase, setActiveTestCase] = useState(0);
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [runResult, setRunResult] = useState(null);
    const [submitResult, setSubmitResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // AI Chat State
    const [aiInput, setAiInput] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [aiMessages, setAiMessages] = useState([
        {
            role: 'assistant',
            text: "Hi! I'm your CodePrep AI assistant.\n\nI can help you understand the problem, debug your code, or explain concepts. What do you need help with?"
        }
    ]);
    const chatContainerRef = useRef(null);

    // Scroll chat to bottom when messages update
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [aiMessages, isAiTyping, activeTab]);

    // ── Monaco themes ─────────────────────────────────────────────
    const EDITOR_THEMES = [
        { id: 'codeprep-dark',  label: 'CodePrep Dark'    },
        { id: 'codeprep-mocha', label: 'Mocha'            },
        { id: 'vs-dark',        label: 'VS Dark'          },
        { id: 'vs',             label: 'VS Light'         },
        { id: 'hc-black',       label: 'High Contrast'    },
    ];

    const handleEditorBeforeMount = (monaco) => {
        // CodePrep Dark — navy blue
        monaco.editor.defineTheme('codeprep-dark', {
            base: 'vs', inherit: true,
            rules: [
                { token: 'comment',   foreground: '4b5563', fontStyle: 'italic' },
                { token: 'keyword',   foreground: '135bec', fontStyle: 'bold'   },
                { token: 'string',    foreground: '7ee8a2'                       },
                { token: 'number',    foreground: 'f0a05a'                       },
                { token: 'type',      foreground: '93c5fd'                       },
                { token: 'function',  foreground: 'a5b4fc'                       },
                { token: 'variable',  foreground: 'e2e8f0'                       },
                { token: 'operator',  foreground: '94a3b8'                       },
                { token: 'delimiter', foreground: '64748b'                       },
            ],
            colors: {
                'editor.background':                 '#151b26',
                'editor.foreground':                 '#cbd5e1',
                'editor.lineHighlightBackground':    '#1e2330',
                'editor.lineHighlightBorder':        '#232f48',
                'editor.selectionBackground':        '#135bec30',
                'editorLineNumber.foreground':       '#374059',
                'editorLineNumber.activeForeground': '#135bec',
                'editorCursor.foreground':           '#135bec',
                'editor.inactiveSelectionBackground':'#135bec15',
                'editorIndentGuide.background1':     '#232f48',
                'editorIndentGuide.activeBackground1':'#135bec25',
                'scrollbarSlider.background':        '#135bec15',
                'scrollbarSlider.hoverBackground':   '#135bec30',
                'editorGutter.background':           '#151b26',
                'editorWidget.background':           '#1e2330',
                'editorSuggestWidget.background':    '#1e2330',
                'editorSuggestWidget.border':        '#135bec20',
                'editorSuggestWidget.selectedBackground':'#135bec20',
            }
        });

        // Mocha — warm brown
        monaco.editor.defineTheme('codeprep-mocha', {
            base: 'vs-dark', inherit: true,
            rules: [
                { token: 'comment',   foreground: '6d5c4e', fontStyle: 'italic' },
                { token: 'keyword',   foreground: 'e07040', fontStyle: 'bold'   },
                { token: 'string',    foreground: 'a8c97f'                       },
                { token: 'number',    foreground: 'f0c060'                       },
                { token: 'type',      foreground: 'd9a55b'                       },
                { token: 'function',  foreground: 'e0c097'                       },
            ],
            colors: {
                'editor.background':                 '#1c1611',
                'editor.foreground':                 '#d4c5b0',
                'editor.lineHighlightBackground':    '#251e16',
                'editor.lineHighlightBorder':        '#2e2318',
                'editor.selectionBackground':        '#e0704030',
                'editorLineNumber.foreground':       '#3d3028',
                'editorLineNumber.activeForeground': '#e07040',
                'editorCursor.foreground':           '#e07040',
                'editorGutter.background':           '#1c1611',
                'editorWidget.background':           '#251e16',
            }
        });
    };

    // ── Fetch problem ─────────────────────────────────────────────
    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const response = await axiosClient.get(`problem/problemById/${id}`);
                const problemData = response.data.problem;
                setProblem(problemData);
                if (problemData.startCode && problemData.startCode.length > 0) {
                    const starter = problemData.startCode.find(sc => sc.language.toLowerCase() === language)
                        || problemData.startCode[0];
                    if (starter) {
                        setCode(starter.initialCode);
                        setLanguage(starter.language.toLowerCase());
                    }
                } else {
                    setCode(`# Write your ${language} code here`);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching problem:', error);
                toast.error('Failed to load problem details');
                setLoading(false);
            }
        };
        if (id) fetchProblem();
    }, [id]);

    // Swap starter code when language changes
    useEffect(() => {
        if (problem && problem.startCode) {
            const starter = problem.startCode.find(sc => sc.language.toLowerCase() === language);
            if (starter) setCode(starter.initialCode);
        }
    }, [language, problem]);

    // Fetch submissions if tab is active
    useEffect(() => {
        if (activeTab === 'submissions' && id) {
            const fetchSubmissions = async () => {
                setLoadingSubmissions(true);
                try {
                    const response = await axiosClient.get(`/submission/submissions/${id}`);
                    setSubmissions(response.data);
                } catch (error) {
                    console.error('Error fetching submissions:', error);
                } finally {
                    setLoadingSubmissions(false);
                }
            };
            fetchSubmissions();
        }
    }, [activeTab, id]);

    // ── Run / Submit ──────────────────────────────────────────────
    const handleRun = async () => {
        setOutput('Running...');
        setRunResult(null);
        setSubmitResult(null);
        setActiveBottomTab('results');
        try {
            const response = await axiosClient.post(`/submission/run/${id}`, { code, language });
            if (response.data.testResult && Array.isArray(response.data.testResult)) {
                setRunResult(response.data.testResult);
                setOutput('');
            } else {
                setOutput(JSON.stringify(response.data, null, 2));
            }
        } catch (error) {
            setOutput(error.response?.data?.message || 'Error running code');
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitResult(null);
        setRunResult(null);
        setOutput('Submitting...');
        setActiveBottomTab('results');
        const toastId = toast.loading('Submitting code...');
        try {
            const response = await axiosClient.post(`/submission/submit/${id}`, { code, language });
            toast.success(response.data.message || 'Submitted!', { id: toastId });
            if (response.data.submission) {
                 setSubmitResult(response.data.submission);
                 setOutput('');
            } else {
                 setOutput('Submitted successfully.');
            }
            if (activeTab === 'submissions') {
                const subResponse = await axiosClient.get(`/submission/submissions/${id}`);
                setSubmissions(subResponse.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Submission failed', { id: toastId });
            setOutput(error.response?.data?.message || 'Submission failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── AI Chat ───────────────────────────────────────────────────
    const handleSendAiMessage = async (text = aiInput) => {
        if (!text.trim()) return;

        // Add user message
        const newUserMsg = { role: 'user', text: text.trim() };
        setAiMessages(prev => [...prev, newUserMsg]);
        setAiInput('');
        setIsAiTyping(true);

        try {
            const response = await axiosClient.post('/chat/coding', { 
                message: text, 
                code, 
                language, 
                problemId: id,
                problemTitle: problem?.title,
                problemDescription: problem?.description
            });
            setAiMessages(prev => [...prev, { role: 'assistant', text: response.data }]);
        } catch (error) {
            console.error('AI Chat Error:', error);
            toast.error('Failed to get AI response');
        } finally {
            setIsAiTyping(false);
        }
    };

    const difficultyStyle = {
        easy:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        medium: 'bg-amber-500/10  text-amber-400  border border-amber-500/20',
        hard:   'bg-rose-500/10   text-rose-400   border border-rose-500/20',
    };

    const langDisplayName = {
        'c': 'C', 'c++': 'C++', 'java': 'Java',
        'javascript': 'JavaScript', 'python': 'Python',
    };

    // ── Loading / Error States ────────────────────────────────────
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#101622]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-[#135bec] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium text-slate-400 font-mono uppercase tracking-widest">
                        Loading Problem...
                    </p>
                </div>
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#101622] text-slate-400">
                <p>Problem not found.</p>
            </div>
        );
    }

    // ── Main Render ───────────────────────────────────────────────
    return (
        <div className="flex flex-col h-screen bg-[#101622] overflow-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

            {/* ═══════════════ NAVBAR ═══════════════ */}
            <Navbar />

            {/* ── Problem title breadcrumb bar ── */}
            {problem && (
                <div className="h-9 flex items-center gap-2 border-b border-[#232f48] px-4 shrink-0 bg-[#111722]">
                    <span className="material-symbols-outlined text-slate-500 text-[16px]">chevron_right</span>
                    <span className="text-xs text-slate-400 truncate max-w-[360px]">{problem.title}</span>
                    <span className={clsx('ml-2 px-2 py-0.5 rounded text-[10px] font-semibold border capitalize',
                        problem.difficulty === 'easy'   ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        problem.difficulty === 'medium' ? 'bg-amber-500/10  text-amber-400  border-amber-500/20'   :
                                                          'bg-rose-500/10   text-rose-400   border-rose-500/20'
                    )}>{problem.difficulty}</span>
                </div>
            )}

            {/* ═══════════════ MAIN WORKSPACE ═══════════════ */}
            <main className="flex-1 flex overflow-hidden">
                <Group orientation="horizontal">

                    {/* ── LEFT PANEL: Problem Description ── */}
                    <Panel defaultSize={42} minSize={25} className="flex flex-col border-r border-[#232f48] bg-[#101622]">

                        {/* Tab bar */}
                        <div className="flex items-center bg-[#1e2330] border-b border-[#232f48] px-2 h-10 shrink-0">
                            {[
                                { key: 'description', label: 'Description', icon: 'description' },
                                { key: 'solutions',   label: 'Solutions',   icon: 'lightbulb'   },
                                { key: 'submissions', label: 'Submissions', icon: 'history'      },
                                { key: 'ai',          label: 'AI Helper',   icon: 'smart_toy'   },
                            ].map(({ key, label, icon }) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={clsx(
                                        'flex items-center gap-1.5 px-3 h-full border-b-2 text-xs font-medium transition-colors',
                                        activeTab === key
                                            ? 'border-[#135bec] text-white'
                                            : 'border-transparent text-slate-400 hover:text-slate-200'
                                    )}
                                >
                                    <span className={clsx('material-symbols-outlined text-[16px]', activeTab === key && 'text-[#135bec]')}>{icon}</span>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Scrollable description content */}
                        <div className="flex-1 overflow-y-auto p-6">

                            {/* Content based on active tab */}
                            {activeTab === 'description' && (
                                <>
                                    {/* Title */}
                                    <div className="flex justify-between items-start mb-4">
                                        <h1 className="text-xl font-bold text-white leading-tight">{problem.title}</h1>
                                        <div className="flex gap-2 shrink-0 ml-3">
                                            <button className="text-slate-400 hover:text-white transition">
                                                <span className="material-symbols-outlined text-[20px]">thumb_up</span>
                                            </button>
                                            <button className="text-slate-400 hover:text-white transition">
                                                <span className="material-symbols-outlined text-[20px]">star</span>
                                            </button>
                                            <button className="text-slate-400 hover:text-white transition">
                                                <span className="material-symbols-outlined text-[20px]">share</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Difficulty + Tags */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${difficultyStyle[problem.difficulty?.toLowerCase()] || difficultyStyle.medium}`}>
                                            {problem.difficulty}
                                        </span>
                                        {(problem.tags || []).map(tag => (
                                            <span key={tag} className="px-2.5 py-0.5 rounded-full bg-[#2b3245] text-slate-300 text-xs font-medium border border-[#374059]">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Description */}
                                    <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed mb-6">
                                        <p>{problem.description}</p>
                                    </div>

                                    {/* Examples */}
                                    {(problem.visibleTestCases || []).map((tc, i) => (
                                        <div key={i} className="mb-6">
                                            <h3 className="text-white font-bold text-sm mb-3">Example {i + 1}:</h3>
                                            <div className="bg-[#2b3245] rounded-lg p-4 border-l-2 border-[#135bec] space-y-1">
                                                <p className="font-mono text-xs">
                                                    <span className="text-slate-400">Input: </span>
                                                    <span className="text-white">{tc.input}</span>
                                                </p>
                                                <p className="font-mono text-xs">
                                                    <span className="text-slate-400">Output: </span>
                                                    <span className="text-white">{tc.output}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {activeTab === 'solutions' && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-white mb-4">Reference Solutions</h2>
                                    {problem.referenceSolution && problem.referenceSolution.length > 0 ? (
                                        problem.referenceSolution.map((sol, i) => (
                                            <div key={i} className="bg-[#2b3245] p-4 rounded-lg border border-[#374059]">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-slate-300 font-semibold text-sm capitalize">{sol.language} Solution</span>
                                                </div>
                                                <pre className="text-xs text-slate-400 font-mono bg-[#151b26] p-3 rounded overflow-x-auto">
                                                    {sol.completeCode || "No code available"}
                                                </pre>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-slate-400 text-sm">No solutions available for this problem.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'submissions' && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-white mb-4">Your Submissions</h2>
                                    {loadingSubmissions ? (
                                        <div className="flex justify-center py-10">
                                            <div className="w-8 h-8 border-4 border-[#135bec] border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : submissions.length > 0 ? (
                                        <div className="overflow-x-auto rounded-lg border border-[#374059] bg-[#1a202c]">
                                            <table className="w-full text-left text-sm text-slate-300">
                                                <thead className="bg-[#2b3245] text-xs uppercase text-slate-400">
                                                    <tr>
                                                        <th scope="col" className="px-4 py-3 font-medium">Status</th>
                                                        <th scope="col" className="px-4 py-3 font-medium">Language</th>
                                                        <th scope="col" className="px-4 py-3 font-medium">Runtime</th>
                                                        <th scope="col" className="px-4 py-3 font-medium">Memory</th>
                                                        <th scope="col" className="px-4 py-3 font-medium">Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#374059]">
                                                    {submissions.map((sub, i) => {
                                                        const isAccepted = sub.status === 'accepted' || sub.status?.toLowerCase() === 'accepted';
                                                        return (
                                                            <tr key={i} className="hover:bg-white/5 transition-colors group cursor-pointer">
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <div className={`font-semibold ${isAccepted ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                        {isAccepted ? 'Accepted' : sub.status}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <span className="bg-[#2b3245] px-2 py-1 rounded text-xs">
                                                                        {sub.language}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                                                                    {sub.runtime ? `${sub.runtime} s` : 'N/A'}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                                                                    {sub.memory ? `${sub.memory} KB` : 'N/A'}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                                                                    {new Date(sub.createdAt).toLocaleDateString()}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 text-sm">You haven't submitted any code for this problem yet.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'ai' && (
                                <div className="space-y-4 flex flex-col h-full overflow-hidden">
                                    <div className="flex items-center gap-2 mb-2 shrink-0">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#135bec] to-purple-600 flex items-center justify-center shadow-lg shadow-[#135bec]/20">
                                            <span className="material-symbols-outlined text-white text-[18px]">smart_toy</span>
                                        </div>
                                        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#135bec] to-purple-500">AI Assistant</h2>
                                    </div>
                                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-[#151b26] border border-[#2b3245] rounded-xl p-4 flex flex-col gap-4 shadow-inner custom-scrollbar">
                                        {aiMessages.map((msg, idx) => (
                                            msg.role === 'assistant' ? (
                                                /* AI Message (Left) */
                                                <div key={idx} className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#135bec] to-purple-600 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-white text-[16px]">smart_toy</span>
                                                    </div>
                                                    <div className="bg-[#1e2330] border border-[#2b3245] rounded-2xl rounded-tl-sm p-3.5 text-sm text-slate-300 shadow-sm max-w-[85%] overflow-hidden">
                                                        <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-[#151b26] prose-pre:border prose-pre:border-[#2b3245] prose-pre:p-3 prose-pre:rounded-lg">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {msg.text}
                                                            </ReactMarkdown>
                                                        </div>
                                                        {idx === 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-3">
                                                                <button onClick={() => handleSendAiMessage("Give me a hint")} className="bg-[#2b3245] hover:bg-[#374059] text-xs px-3 py-1.5 rounded-full text-slate-300 transition-colors border border-[#374059]">
                                                                    Give me a hint
                                                                </button>
                                                                <button onClick={() => handleSendAiMessage("Debug my code")} className="bg-[#2b3245] hover:bg-[#374059] text-xs px-3 py-1.5 rounded-full text-slate-300 transition-colors border border-[#374059]">
                                                                    Debug my code
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                /* User Message (Right) */
                                                <div key={idx} className="flex gap-3 flex-row-reverse">
                                                    <div className="w-8 h-8 rounded-full bg-[#2b3245] flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-slate-300 text-[16px]">person</span>
                                                    </div>
                                                    <div className="bg-[#135bec] border border-[#135bec] rounded-2xl rounded-tr-sm p-3.5 text-sm text-white shadow-sm max-w-[85%] whitespace-pre-wrap">
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                        
                                        {isAiTyping && (
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#135bec] to-purple-600 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-white text-[16px]">smart_toy</span>
                                                </div>
                                                <div className="bg-[#1e2330] border border-[#2b3245] rounded-2xl rounded-tl-sm p-3.5 text-sm text-slate-300 shadow-sm flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 shrink-0 pb-4">
                                        <div className="relative flex-1">
                                            <input 
                                                type="text" 
                                                value={aiInput}
                                                onChange={e => setAiInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleSendAiMessage()}
                                                placeholder="Ask AI about the problem or your code..." 
                                                className="w-full bg-[#151b26] border border-[#2b3245] rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-[#135bec]/50 focus:ring-1 focus:ring-[#135bec]/50 transition-all shadow-sm"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => handleSendAiMessage()}
                                            disabled={isAiTyping || !aiInput.trim()}
                                            className="bg-gradient-to-r from-[#135bec] to-purple-600 text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center hover:from-blue-600 hover:to-purple-500 transition-all shadow-lg shadow-[#135bec]/20 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">send</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Panel>

                    {/* Resize handle */}
                    <Separator className="w-1 bg-[#232f48] hover:bg-[#135bec]/40 transition-colors cursor-col-resize" />

                    {/* ── RIGHT PANEL: Editor + Terminal ── */}
                    <Panel minSize={30} className="relative flex flex-col bg-[#151b26]">
                        <Group orientation="vertical" style={{ height: '100%' }}>

                            {/* Editor section */}
                            <Panel defaultSize={62} minSize={25} className="flex flex-col">

                                {/* Editor toolbar */}
                                <div className="flex items-center justify-between bg-[#1e2330] border-b border-[#232f48] px-3 h-10 shrink-0">
                                    <div className="flex items-center gap-3">

                                        {/* ── Language selector ── */}
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-slate-500 text-[15px]">code</span>
                                            <select
                                                value={language}
                                                onChange={e => setLanguage(e.target.value)}
                                                className="appearance-none bg-transparent border-none outline-none text-sm font-semibold text-emerald-400 cursor-pointer pr-4"
                                            >
                                                <option value="c"          className="bg-[#1e2330] text-white">C</option>
                                                <option value="c++"        className="bg-[#1e2330] text-white">C++</option>
                                                <option value="java"       className="bg-[#1e2330] text-white">Java</option>
                                                <option value="javascript" className="bg-[#1e2330] text-white">JavaScript</option>
                                                <option value="python"     className="bg-[#1e2330] text-white">Python</option>
                                            </select>
                                            <span className="material-symbols-outlined text-slate-500 text-[14px] -ml-3 pointer-events-none">expand_more</span>
                                        </div>

                                        <div className="h-4 w-px bg-[#374059]" />

                                        {/* ── Theme selector ── */}
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-slate-500 text-[15px]">palette</span>
                                            <select
                                                value={editorTheme}
                                                onChange={e => setEditorTheme(e.target.value)}
                                                className="appearance-none bg-transparent border-none outline-none text-xs font-medium text-slate-300 cursor-pointer pr-4"
                                            >
                                                {EDITOR_THEMES.map(t => (
                                                    <option key={t.id} value={t.id} className="bg-[#1e2330] text-white">{t.label}</option>
                                                ))}
                                            </select>
                                            <span className="material-symbols-outlined text-slate-500 text-[14px] -ml-3 pointer-events-none">expand_more</span>
                                        </div>
                                    </div>

                                    {/* Reset */}
                                    <button
                                        onClick={() => {
                                            if (problem?.startCode) {
                                                const s = problem.startCode.find(sc => sc.language.toLowerCase() === language);
                                                if (s) setCode(s.initialCode);
                                            }
                                        }}
                                        className="flex items-center justify-center p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition"
                                        title="Reset Code"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                                    </button>
                                </div>

                                {/* Monaco editor */}
                                <div className="flex-1 relative">
                                    <Editor
                                        height="100%"
                                        language={language === 'c++' ? 'cpp' : language}
                                        value={code}
                                        onChange={value => setCode(value)}
                                        theme={editorTheme}
                                        beforeMount={handleEditorBeforeMount}
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            lineHeight: 22,
                                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                            fontLigatures: true,
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            padding: { top: 16 },
                                            renderLineHighlight: 'gutter',
                                            cursorBlinking: 'smooth',
                                        }}
                                    />
                                </div>
                            </Panel>

                            {/* Resize handle */}
                            <Separator className="h-1 bg-[#232f48] hover:bg-[#135bec]/40 transition-colors cursor-row-resize" />

                            {/* ── Bottom: Console / Test Cases ── */}
                            <Panel defaultSize={38} minSize={15} className="flex flex-col bg-[#1e2330]">

                                {/* Bottom tab bar */}
                                <div className="flex items-center px-2 pt-1.5 gap-1 border-b border-[#2b3245]">
                                    <button
                                        onClick={() => setActiveBottomTab('testcases')}
                                        className={clsx(
                                            'flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium relative top-[1px] transition-colors',
                                            activeBottomTab === 'testcases'
                                                ? 'bg-[#2b3245] text-white border-t border-l border-r border-[#374059]'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        )}
                                    >
                                        <span className={clsx('w-1.5 h-1.5 rounded-full', activeBottomTab === 'testcases' ? 'bg-green-500' : 'bg-slate-600')} />
                                        Test Cases
                                    </button>
                                    <button
                                        onClick={() => setActiveBottomTab('results')}
                                        className={clsx(
                                            'flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium relative top-[1px] transition-colors',
                                            activeBottomTab === 'results'
                                                ? 'bg-[#2b3245] text-white border-t border-l border-r border-[#374059]'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        )}
                                    >
                                        <span className={clsx('w-1.5 h-1.5 rounded-full', activeBottomTab === 'results' ? 'bg-[#135bec]' : 'bg-slate-600')} />
                                        Run Results
                                    </button>
                                    <div className="flex-1" />
                                    <button className="p-1 text-slate-400 hover:text-white transition">
                                        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                                    </button>
                                </div>

                                {/* Test Cases tab */}
                                {activeBottomTab === 'testcases' && (
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        {/* Case selector */}
                                        <div className="flex gap-2 px-4 py-3 border-b border-[#374059]">
                                            {(problem.visibleTestCases || []).map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setActiveTestCase(i)}
                                                    className={clsx(
                                                        'px-3 py-1 text-xs font-medium rounded border transition-all',
                                                        activeTestCase === i
                                                            ? 'bg-[#2b3245] text-white border-[#135bec]/50'
                                                            : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                                                    )}
                                                >
                                                    Case {i + 1}
                                                </button>
                                            ))}
                                            <button className="px-2 py-1 text-slate-400 hover:text-white text-xs rounded hover:bg-white/5 ml-auto transition">
                                                <span className="material-symbols-outlined text-[16px]">add</span>
                                            </button>
                                        </div>

                                        {/* Input / Output display */}
                                        {problem.visibleTestCases?.[activeTestCase] && (
                                            <div className="p-4 overflow-y-auto space-y-3 font-mono text-xs flex-1">
                                                <div>
                                                    <p className="text-slate-500 mb-1">Input =</p>
                                                    <div className="bg-[#151b26] border border-[#2b3245] rounded p-2.5 text-white whitespace-pre-wrap">
                                                        {problem.visibleTestCases[activeTestCase].input}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 mb-1">Expected Output =</p>
                                                    <div className="bg-[#151b26] border border-[#2b3245] rounded p-2.5 text-white whitespace-pre-wrap">
                                                        {problem.visibleTestCases[activeTestCase].output}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Results tab */}
                                {activeBottomTab === 'results' && (
                                    <div className="flex-1 overflow-y-auto p-4">
                                        {output === 'Running...' || output === 'Submitting...' ? (
                                            <div className="flex items-center gap-3 text-slate-400 text-xs">
                                                <div className="w-4 h-4 border-2 border-[#135bec] border-t-transparent rounded-full animate-spin" />
                                                {output}
                                            </div>
                                        ) : submitResult ? (
                                            <div className="space-y-4">
                                                <h3 className={`text-xl font-bold ${submitResult.status === 'accepted' || submitResult.status?.toLowerCase() === 'accepted' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {submitResult.status === 'accepted' || submitResult.status?.toLowerCase() === 'accepted' ? 'Accepted' : submitResult.status}
                                                </h3>
                                                <div className="flex gap-6 text-sm font-medium">
                                                    <div className="bg-[#2b3245] p-3 rounded-lg flex-1 border border-[#374059]">
                                                        <p className="text-slate-400 text-xs mb-1">Runtime</p>
                                                        <p className="text-white flex items-end gap-1">
                                                            <span className="material-symbols-outlined text-emerald-400 text-[18px]">timer</span>
                                                            {submitResult.runtime || 0} <span className="text-slate-500 text-xs ml-1">s</span>
                                                        </p>
                                                    </div>
                                                    <div className="bg-[#2b3245] p-3 rounded-lg flex-1 border border-[#374059]">
                                                        <p className="text-slate-400 text-xs mb-1">Memory</p>
                                                        <p className="text-white flex items-end gap-1">
                                                            <span className="material-symbols-outlined text-emerald-400 text-[18px]">memory</span>
                                                            {submitResult.memory || 0} <span className="text-slate-500 text-xs ml-1">KB</span>
                                                        </p>
                                                    </div>
                                                    <div className="bg-[#2b3245] p-3 rounded-lg flex-1 border border-[#374059]">
                                                        <p className="text-slate-400 text-xs mb-1">Test Cases</p>
                                                        <p className="text-white flex items-end gap-1">
                                                            <span className="material-symbols-outlined text-[#135bec] text-[18px]">fact_check</span>
                                                            {submitResult.testCasesPassed} / {submitResult.testCasesTotal}
                                                        </p>
                                                    </div>
                                                </div>
                                                {submitResult.errorMessage && (
                                                    <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-rose-400 text-xs font-mono overflow-auto whitespace-pre-wrap">
                                                        {submitResult.errorMessage}
                                                    </div>
                                                )}
                                            </div>
                                        ) : runResult ? (
                                            <div className="space-y-4">
                                                <h3 className={`text-lg font-bold ${runResult.every(r => r.status.id === 3) ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {runResult.every(r => r.status.id === 3) ? 'Accepted' : 'Wrong Answer'}
                                                </h3>
                                                
                                                {/* Tabs for Test Cases inside Run Result */}
                                                <div className="flex gap-2 mb-3">
                                                    {runResult.map((res, idx) => (
                                                        <button 
                                                            key={idx}
                                                            onClick={() => setActiveTestCase(idx)}
                                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                                                                activeTestCase === idx ? 'bg-[#2b3245] text-white border-[#135bec]/50' : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`w-1.5 h-1.5 rounded-full ${res.status.id === 3 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                                Case {idx + 1}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Result content for active test case */}
                                                {runResult[activeTestCase] && problem.visibleTestCases[activeTestCase] && (
                                                    <div className="space-y-3 font-mono text-xs">
                                                        <div>
                                                            <p className="text-slate-500 mb-1">Input</p>
                                                            <div className="bg-[#151b26] border border-[#2b3245] rounded p-2.5 text-white whitespace-pre-wrap">
                                                                {problem.visibleTestCases[activeTestCase].input}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-500 mb-1">Output</p>
                                                            <div className={`border rounded p-2.5 whitespace-pre-wrap ${runResult[activeTestCase].status.id === 3 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                                                {runResult[activeTestCase].stdout || runResult[activeTestCase].compile_output || runResult[activeTestCase].stderr || runResult[activeTestCase].status.description}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-500 mb-1">Expected Output</p>
                                                            <div className="bg-[#151b26] border border-[#2b3245] rounded p-2.5 text-white whitespace-pre-wrap">
                                                                {problem.visibleTestCases[activeTestCase].output}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-4 text-slate-500 mt-2">
                                                            <span>Time: {runResult[activeTestCase].time || 0}s</span>
                                                            <span>Memory: {runResult[activeTestCase].memory || 0}KB</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : output ? (
                                            <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{output}</pre>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600 text-xs">
                                                <span className="material-symbols-outlined text-[32px]">play_circle</span>
                                                <span>Click Run or Submit to see results</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Panel>
                        </Group>

                        {/* ── Floating Run / Submit buttons ── */}
                        <div className="absolute bottom-5 right-5 flex items-center gap-3 z-10">
                            <button
                                onClick={handleRun}
                                disabled={output === 'Running...' || isSubmitting}
                                className={`px-5 py-2 rounded-lg text-sm font-bold border transition-colors shadow-lg flex items-center gap-2 ${output === 'Running...' || isSubmitting ? 'bg-[#1e2330] text-slate-500 border-[#374059] cursor-not-allowed' : 'bg-[#2b3245] text-slate-200 border-[#374059] hover:bg-[#374059]'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                                Run
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || output === 'Running...'}
                                className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg flex items-center gap-2 ${isSubmitting || output === 'Running...' ? 'bg-blue-900/50 text-white/50 cursor-not-allowed' : 'bg-[#135bec] text-white hover:bg-blue-600 shadow-blue-900/20'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                                Submit
                            </button>
                        </div>
                    </Panel>
                </Group>
            </main>

            {/* ═══════════════ STATUS BAR ═══════════════ */}
            <footer className="h-7 bg-[#111722] border-t border-[#232f48] flex items-center justify-between px-4 text-[10px] text-slate-500 shrink-0 font-mono">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#135bec] shadow-[0_0_6px_rgba(19,91,236,0.6)]" />
                    Connected · {langDisplayName[language] || language}
                </div>
                <span>UTF-8</span>
            </footer>
        </div>
    );
};

export default CodeEditorPage;
