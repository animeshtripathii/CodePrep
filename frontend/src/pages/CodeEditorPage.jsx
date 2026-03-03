import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
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
    const [editorTheme, setEditorTheme] = useState('vs');
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
    
    // Submissions Detail State
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    // Panel Toggle State
    const [showRightPanel, setShowRightPanel] = useState(true);

    // AI Chat State
    const [activeRightTab, setActiveRightTab] = useState('ai');
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
    }, [aiMessages, isAiTyping, activeRightTab]);

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

    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();

    const handleSendAiMessage = async (text = aiInput) => {
        if (!text.trim()) return;

        if (user && user.tokens < 20) {
            toast.error('You need at least 20 AI tokens to chat! Please upgrade to continue.', {
                duration: 4000,
                icon: '🚀'
            });
            const upgradeMsg = "You have 0 AI tokens remaining.\n\n[Please upgrade your plan](/plans) to continue receiving coding hints from CodeMaster AI.";
            const newUserMsg = { role: 'user', text: text.trim() };
            setAiMessages(prev => [...prev, newUserMsg, { role: 'assistant', text: upgradeMsg }]);
            setAiInput('');
            return;
        }

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
            
            // Deduct locally for instant UI update
            if (user && user.tokens !== undefined) {
                 dispatch({ type: 'auth/updateUserTokens', payload: Math.max(0, user.tokens - 20) });
            }
        } catch (error) {
            console.error('AI Chat Error:', error);
            toast.error('Failed to get AI response');
        } finally {
            setIsAiTyping(false);
        }
    };

    const difficultyStyle = {
        easy:   'bg-green-100 text-green-700 border-green-200',
        medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        hard:   'bg-red-100 text-red-700 border-red-200',
    };

    const langDisplayName = {
        'c': 'C', 'c++': 'C++', 'java': 'Java',
        'javascript': 'JavaScript', 'python': 'Python',
    };

    // ── Loading / Error States ────────────────────────────────────
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium text-slate-500 font-mono uppercase tracking-widest">
                        Loading Problem...
                    </p>
                </div>
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
                <p>Problem not found.</p>
            </div>
        );
    }

    // ── Main Render ───────────────────────────────────────────────
    return (
        <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden font-display">

            {/* ═══════════════ NAVBAR ═══════════════ */}
            <Navbar />

            {/* ═══════════════ MAIN WORKSPACE ═══════════════ */}
            <main className="flex-1 flex overflow-hidden p-2 gap-2 bg-slate-200">
                <Group orientation="horizontal">

                    {/* ── LEFT PANEL: Problem Description ── */}
                    <Panel defaultSize={50} minSize={20} className="flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">

                        {/* Tab bar */}
                        <div className="flex flex-wrap items-center bg-slate-50 border-b border-slate-200 px-2 h-10 shrink-0 gap-1 overflow-x-auto custom-scrollbar-hide rounded-t-lg">
                            {[
                                { key: 'description', label: 'Description', icon: 'description', color: 'text-blue-500' },
                                { key: 'editorial',   label: 'Editorial',   icon: 'menu_book',   color: 'text-yellow-500' },
                                { key: 'solution',    label: 'Solutions',    icon: 'science',     color: 'text-cyan-500' },
                                { key: 'submissions', label: 'Submissions', icon: 'update',      color: 'text-slate-400' },
                            ].map(({ key, label, icon, color }) => (
                                <button
                                    key={key}
                                    onClick={() => {
                                        setActiveTab(key);
                                        if (key !== 'submissions') setSelectedSubmission(null);
                                    }}
                                    className={clsx(
                                        'flex items-center gap-1.5 px-3 min-w-max h-full text-xs font-semibold transition-colors',
                                        activeTab === key
                                            ? 'bg-white text-slate-900 border-t-2 border-t-transparent shadow-sm rounded-t-md relative -bottom-px z-10'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md my-1'
                                    )}
                                    style={activeTab === key ? { borderTopColor: 'inherit', marginTop: '2px' } : {}}
                                >
                                    <span className={clsx('material-symbols-outlined text-[16px]', activeTab === key ? color : 'text-slate-400')}>{icon}</span>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Scrollable left content */}
                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">

                            {/* Content based on active tab */}
                            {activeTab === 'description' && (
                                <>
                                    {/* Title */}
                                    <h1 className="text-2xl font-bold text-slate-900 mb-4">{problem.title}</h1>

                                    {/* Difficulty + Tags */}
                                    <div className="flex flex-wrap items-center gap-3 mb-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${difficultyStyle[problem.difficulty?.toLowerCase()] || difficultyStyle.medium}`}>
                                            {problem.difficulty}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed mb-8">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {problem.description}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Examples */}
                                    {(problem.visibleTestCases || []).map((tc, i) => (
                                        <div key={i} className="mb-6">
                                            <h3 className="text-slate-900 font-bold text-sm mb-3">Example {i + 1}:</h3>
                                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2">
                                                <p className="font-mono text-sm">
                                                    <strong className="text-slate-700 font-semibold">Input:</strong>{' '}
                                                    <span className="text-slate-600">{tc.input}</span>
                                                </p>
                                                <p className="font-mono text-sm">
                                                    <strong className="text-slate-700 font-semibold">Output:</strong>{' '}
                                                    <span className="text-slate-600">{tc.output}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}


                            {activeTab === 'editorial' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-slate-900 mb-4">Editorial</h2>
                                    
                                    {problem.secureUrl && (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-red-500">play_circle</span>
                                                Video Solution
                                            </h3>
                                            <div className="w-full bg-black rounded-xl overflow-hidden shadow-sm aspect-video">
                                                <video 
                                                    src={problem.secureUrl}
                                                    controls 
                                                    className="w-full h-full object-contain"
                                                    controlsList="nodownload"
                                                    preload="metadata"
                                                >
                                                    Your browser does not support the video tag.
                                                </video>
                                            </div>
                                        </div>
                                    )}

                                    {problem.videoUrl && (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-blue-500">link</span>
                                                External Video Solution
                                            </h3>
                                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center space-y-3">
                                                <p className="text-slate-700 font-medium">An external video solution is available.</p>
                                                <a 
                                                    href={problem.videoUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
                                                >
                                                    Watch Video Solution
                                                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {!problem.secureUrl && !problem.videoUrl && (
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                                            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">videocam_off</span>
                                            <p className="text-slate-500 font-medium">No video editorial available for this problem.</p>
                                        </div>
                                    )}
                                </div>
                            )}
```

                            {activeTab === 'solution' && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-slate-900 mb-4">Solution Code</h2>
                                    {problem.referenceSolution && problem.referenceSolution.length > 0 ? (
                                        problem.referenceSolution.map((sol, i) => (
                                            <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-slate-700 font-semibold text-sm capitalize">{sol.language} Solution</span>
                                                </div>
                                                <pre className="text-sm text-slate-700 font-mono bg-white border border-slate-200 p-4 rounded-lg overflow-x-auto shadow-sm">
                                                    {sol.completeCode || "No code available"}
                                                </pre>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-slate-500 text-sm">No solution available for this problem.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'submissions' && (
                                <div className="space-y-4">
                                    {!selectedSubmission ? (
                                        <>
                                            <h2 className="text-xl font-bold text-slate-900 mb-4">Your Submissions</h2>
                                            {loadingSubmissions ? (
                                        <div className="flex justify-center py-10">
                                            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : submissions.length > 0 ? (
                                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                            <table className="w-full text-left text-sm text-slate-600">
                                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                                                    <tr>
                                                        <th scope="col" className="px-4 py-3 font-medium">Status</th>
                                                        <th scope="col" className="px-4 py-3 font-medium">Language</th>
                                                        <th scope="col" className="px-4 py-3 font-medium">Runtime</th>
                                                        <th scope="col" className="px-4 py-3 font-medium">Memory</th>
                                                        <th scope="col" className="px-4 py-3 font-medium">Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {submissions.map((sub, i) => {
                                                        const isAccepted = sub.status === 'accepted' || sub.status?.toLowerCase() === 'accepted';
                                                        return (
                                                            <tr key={i} onClick={() => setSelectedSubmission(sub)} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <div className={`font-semibold ${isAccepted ? 'text-green-600' : 'text-red-500'}`}>
                                                                        {isAccepted ? 'Accepted' : sub.status}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs text-slate-700">
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
                                                <p className="text-slate-500 text-sm">You haven't submitted any code for this problem yet.</p>
                                            )}
                                        </>
                                    ) : (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                            {/* Back button */}
                                            <button 
                                                onClick={() => setSelectedSubmission(null)}
                                                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-semibold text-sm group pb-2"
                                            >
                                                <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                                                All Submissions
                                            </button>
                                            
                                            {/* Header */}
                                            <div className="flex flex-col gap-3">
                                                <div className="flex flex-wrap items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <h2 className={`text-2xl font-bold ${selectedSubmission.status === 'accepted' || selectedSubmission.status?.toLowerCase() === 'accepted' ? 'text-green-600' : 'text-red-500'}`}>
                                                            {selectedSubmission.status === 'accepted' || selectedSubmission.status?.toLowerCase() === 'accepted' ? 'Accepted' : selectedSubmission.status}
                                                        </h2>
                                                        <span className="text-sm font-medium text-slate-500 mt-1">93 / 93 testcases passed</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setActiveTab('editorial')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors border border-slate-200 shadow-sm">
                                                            <span className="material-symbols-outlined text-[16px]">menu_book</span> Editorial
                                                        </button>
                                                        <button onClick={() => setActiveTab('solution')} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm shadow-green-600/20">
                                                            <span className="material-symbols-outlined text-[16px]">edit_square</span> Solution
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                                                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                                                        <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center shrink-0 border border-slate-300 overflow-hidden">
                                                            {user && user.profileImage ? (
                                                                <img src={user.profileImage} alt="User" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="material-symbols-outlined text-[14px] text-slate-500">person</span>
                                                            )}
                                                        </div>
                                                        {user?.username || 'User'}
                                                    </div>
                                                    <span>submitted at {new Date(selectedSubmission.createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Performance Cards */}
                                            <div className="bg-[#262626] rounded-xl p-5 shadow-inner border border-[#3e3e42] text-slate-300 relative overflow-hidden mt-2">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
                                                <div className="grid grid-cols-2 gap-4 relative z-10">
                                                    {/* Runtime */}
                                                    <div className="flex flex-col gap-2 border-r border-[#404040] pr-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5 text-slate-300 font-medium text-sm">
                                                                <span className="material-symbols-outlined text-[18px]">schedule</span> Runtime
                                                            </div>
                                                            <span className="material-symbols-outlined text-[16px] text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">info</span>
                                                        </div>
                                                        <div className="flex flex-wrap items-baseline gap-2 mt-1">
                                                            <span className="text-3xl font-bold text-white font-mono">{selectedSubmission.runtime || 0}</span>
                                                            <span className="text-sm text-slate-400">ms</span>
                                                            <span className="text-sm text-slate-500 ml-1 border-l border-slate-600 pl-3">Beats <span className="font-bold text-white">{(Math.random() * 80 + 10).toFixed(2)}%</span></span>
                                                        </div>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setShowRightPanel(true); handleSendAiMessage("Can you analyze the time and space complexity of my recently submitted code?"); }}
                                                            className="flex items-center gap-1.5 text-[12px] font-bold text-[#b49cf8] hover:text-[#c4aef9] transition-colors mt-3 w-fit bg-[#b49cf8]/10 hover:bg-[#b49cf8]/20 px-3 py-1.5 rounded-md"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                                                            Analyze Complexity
                                                        </button>
                                                    </div>
                                                    {/* Memory */}
                                                    <div className="flex flex-col gap-2 pl-2 opacity-60 hover:opacity-100 transition-opacity cursor-default">
                                                        <div className="flex items-center gap-1.5 text-slate-300 font-medium text-sm">
                                                            <span className="material-symbols-outlined text-[18px]">memory</span> Memory
                                                        </div>
                                                        <div className="flex flex-wrap items-baseline gap-2 mt-1">
                                                            <span className="text-xl font-bold text-white font-mono">{selectedSubmission.memory || 0}</span>
                                                            <span className="text-sm text-slate-400">MB</span>
                                                            <span className="text-sm text-slate-500 ml-1 border-l border-slate-600 pl-3">Beats <span className="font-bold text-green-500">{(Math.random() * 80 + 10).toFixed(2)}%</span> <span className="text-green-500 ml-1">🌱</span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Fake Chart / Visual */}
                                                <div className="mt-10 pt-4 border-t border-[#404040] relative z-10 h-28 flex items-end gap-[2px]">
                                                     {/* Y-axis labels */}
                                                     <div className="absolute -left-2 top-4 bottom-4 w-8 flex flex-col justify-between text-[11px] text-slate-500 items-end pr-2 border-r border-[#404040]/50 z-20 font-mono">
                                                         <span>75%</span>
                                                         <span>50%</span>
                                                         <span>25%</span>
                                                         <span>0%</span>
                                                     </div>
                                                     <div className="absolute inset-0 border-b border-[#404040]/50 pointer-events-none z-0 mt-4 mb-4">
                                                         <div className="h-full border-t border-[#404040]/30 w-full" />
                                                         <div className="h-full border-t border-[#404040]/30 w-full absolute top-1/3" />
                                                         <div className="h-full border-t border-[#404040]/30 w-full absolute top-2/3" />
                                                     </div>
                                                     <div className="flex-1 flex items-end h-[calc(100%-16px)] mb-4 ml-8 gap-[3px] z-10 mx-2">
                                                         {[...Array(60)].map((_, i) => {
                                                             const isHighlighted = i === 52; // Fake highlight for current sub
                                                             const isPeak = i === 5;
                                                             let h = Math.random() * 8 + 2;
                                                             if (isPeak) h = 80;
                                                             else if (Math.abs(i - 5) < 3) h = 80 - Math.abs(i - 5) * 20;
                                                             else if (Math.abs(i - 12) < 2) h = 30 - Math.abs(i-12) * 10;
                                                             else if (i > 40 && i < 55) h = Math.random() * 5 + 4;
                                                             
                                                             return (
                                                                 <div key={i} className={`flex-1 rounded-t-[1px] group relative ${isHighlighted ? 'bg-[#007acc] z-20' : 'bg-[#007acc] hover:bg-blue-400 transition-colors opacity-90'}`} style={{ height: `${isHighlighted ? h + 15 : h}%` }}>
                                                                     {isHighlighted && (
                                                                         <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-[3px] border-[#262626] bg-slate-200 shrink-0 shadow-lg flex items-center justify-center z-30">
                                                                            <span className="material-symbols-outlined text-[14px] text-slate-600">person</span>
                                                                         </div>
                                                                     )}
                                                                 </div>
                                                             );
                                                         })}
                                                     </div>
                                                     {/* X-axis labels */}
                                                     <div className="absolute -bottom-1 left-8 right-2 flex justify-between text-[11px] text-slate-500 px-2 font-mono">
                                                         <span>17ms</span>
                                                         <span>360ms</span>
                                                         <span>704ms</span>
                                                         <span>1047ms</span>
                                                         <span>1391ms</span>
                                                         <span>1734ms</span>
                                                         <span>2078ms</span>
                                                         <span>2421ms</span>
                                                     </div>
                                                </div>
                                            </div>
                                            
                                            {/* Code display */}
                                            <div className="space-y-4 pt-2">
                                                <div className="flex items-center gap-4 text-slate-500 text-sm font-semibold border-b border-slate-200 pb-2">
                                                    <span className="text-slate-900 border-b-[3px] border-slate-900 pb-[9px] -mb-[11px]">Code</span>
                                                    <span className="border-l-[1.5px] border-slate-300 pl-4 capitalize flex items-center gap-1.5 mt-0.5">
                                                        {selectedSubmission.language || 'c++'}
                                                    </span>
                                                </div>
                                                <div className="bg-[#1e1e1e] border border-[#3e3e42] rounded-xl overflow-hidden shadow-sm group relative">
                                                    <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                        <button 
                                                            onClick={async () => {
                                                                try {
                                                                    await navigator.clipboard.writeText(selectedSubmission.code || '');
                                                                    toast.success('Code copied to clipboard!');
                                                                } catch (err) {
                                                                    toast.error('Failed to copy code');
                                                                }
                                                            }}
                                                            className="p-1.5 bg-[#2d2d30] hover:bg-[#3e3e42] text-slate-300 rounded-md transition-colors border border-[#454545]"
                                                            title="Copy Code"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                                        </button>
                                                    </div>
                                                    <div className="absolute top-0 left-0 bottom-0 w-12 bg-[#1e1e1e] border-r border-[#3e3e42]/50 pointer-events-none z-10 flex flex-col items-center pt-5 text-[13px] font-mono text-slate-500 select-none">
                                                        {selectedSubmission.code ? selectedSubmission.code.split('\n').map((_, idx) => (
                                                            <div key={idx} className="leading-relaxed h-[21px]">{idx + 1}</div>
                                                        )) : <div className="leading-relaxed h-[21px]">1</div>}
                                                    </div>
                                                    <pre className="p-5 pl-16 overflow-x-auto text-[13px] font-mono text-[#d4d4d4] leading-relaxed relative custom-scrollbar bg-[#1e1e1e]">
                                                        {selectedSubmission.code || 'No code provided.'}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Panel>

                    {/* Resize handle */}
                    <Separator className="w-2 transition-colors cursor-col-resize flex flex-col items-center justify-center relative touch-none group">
                        <div className="h-6 w-1 bg-slate-300 rounded-full group-hover:bg-slate-400 transition-colors"></div>
                    </Separator>

                    {/* ── MIDDLE PANEL: Editor + Terminal ── */}
                    <Panel defaultSize={showRightPanel ? 40 : 50} minSize={30} className="relative flex flex-col bg-transparent overflow-hidden">
                        <Group orientation="vertical">

                            {/* Editor section */}
                            <Panel defaultSize={70} minSize={25} className="flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden relative">
                                
                                {/* Header: < > Code */}
                                <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 px-3 h-10 shrink-0 overflow-x-auto custom-scrollbar-hide">
                                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs min-w-max">
                                        <span className="material-symbols-outlined text-green-600 text-[16px]">code</span>
                                        Code
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center bg-white border border-slate-200 rounded text-xs overflow-hidden shadow-sm">
                                            <select
                                                value={language}
                                                onChange={e => setLanguage(e.target.value)}
                                                className="appearance-none bg-transparent border-none outline-none font-semibold text-slate-700 cursor-pointer px-2 py-0.5 focus:ring-0"
                                            >
                                                <option value="c">C</option>
                                                <option value="c++">C++</option>
                                                <option value="java">Java</option>
                                                <option value="javascript">JavaScript</option>
                                                <option value="python">Python 3</option>
                                            </select>
                                        </div>

                                        <div className="h-4 w-px bg-slate-300 mx-1"></div>

                                        <button
                                            onClick={() => {
                                                if (problem?.startCode) {
                                                    const s = problem.startCode.find(sc => sc.language.toLowerCase() === language);
                                                    if (s) setCode(s.initialCode);
                                                }
                                            }}
                                            className="flex items-center justify-center p-1 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded transition border border-slate-200 shadow-sm"
                                            title="Reset Code"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                                        </button>

                                        <button
                                            onClick={handleRun}
                                            disabled={output === 'Running...' || isSubmitting}
                                            className={`px-3 py-1 rounded shadow-sm text-xs font-bold border transition-colors flex items-center gap-1.5 ${output === 'Running...' || isSubmitting ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                                            title="Run Code"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                                            Run
                                        </button>

                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || output === 'Running...'}
                                            className={`px-3 py-1 rounded shadow-sm text-xs font-bold transition-colors flex items-center gap-1.5 border ${isSubmitting || output === 'Running...' ? 'bg-green-300 text-white border-green-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 shadow-[0_2px_10px_rgba(22,163,74,0.3)] border-green-700'}`}
                                            title="Submit Code"
                                        >
                                            <span className="material-symbols-outlined text-[14px] text-green-100">cloud_upload</span>
                                            Submit
                                        </button>

                                        {!showRightPanel && (
                                            <>
                                                <div className="h-4 w-px bg-slate-300 mx-1"></div>
                                                <button
                                                    onClick={() => setShowRightPanel(true)}
                                                    className="flex items-center justify-center p-1 bg-white border border-slate-200 shadow-sm shadow-purple-500/10 hover:bg-slate-50 text-slate-700 rounded transition gap-1"
                                                    title="Open AI Assist"
                                                >
                                                    <span className="material-symbols-outlined text-purple-600 text-[16px]">auto_awesome</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Monaco editor */}
                                <div className="flex-1 relative">
                                    <Editor
                                        height="100%"
                                        language={language === 'c++' ? 'cpp' : language}
                                        value={code}
                                        onChange={value => setCode(value)}
                                        theme="vs"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            lineHeight: 24,
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
                            <Separator className="h-2 transition-colors cursor-row-resize flex items-center justify-center relative touch-none group">
                                <div className="w-6 h-1 bg-slate-300 rounded-full group-hover:bg-slate-400 transition-colors"></div>
                            </Separator>

                            {/* ── Bottom: Console / Test Cases ── */}
                            <Panel defaultSize={30} minSize={15} className="flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">

                                {/* Bottom tab bar */}
                                <div className="flex items-center px-2 bg-slate-50 border-b border-slate-200 h-10 shrink-0 gap-1 overflow-x-auto custom-scrollbar-hide">
                                    <button
                                        onClick={() => setActiveBottomTab('testcases')}
                                        className={clsx(
                                            'flex items-center gap-1.5 px-3 min-w-max h-full text-xs font-semibold transition-colors',
                                            activeBottomTab === 'testcases'
                                                ? 'bg-white text-slate-900 border-t-2 border-t-transparent shadow-sm rounded-t-md relative -bottom-px z-10'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md my-1'
                                        )}
                                        style={activeBottomTab === 'testcases' ? { borderTopColor: 'inherit', marginTop: '2px' } : {}}
                                    >
                                        <span className={clsx('material-symbols-outlined text-[16px]', activeBottomTab === 'testcases' ? 'text-green-500' : 'text-slate-400')}>check_circle</span>
                                        Testcase
                                    </button>
                                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                    <button
                                        onClick={() => setActiveBottomTab('results')}
                                        className={clsx(
                                            'flex items-center gap-1.5 px-3 min-w-max h-full text-xs font-semibold transition-colors',
                                            activeBottomTab === 'results'
                                                ? 'bg-white text-slate-900 border-t-2 border-t-transparent shadow-sm rounded-t-md relative -bottom-px z-10'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md my-1'
                                        )}
                                        style={activeBottomTab === 'results' ? { borderTopColor: 'inherit', marginTop: '2px' } : {}}
                                    >
                                        <span className={clsx('material-symbols-outlined text-[16px]', activeBottomTab === 'results' ? 'text-green-500' : 'text-slate-400')}>terminal</span>
                                        Test Result
                                        {submitResult && <span className={`w-2 h-2 rounded-full ml-1 ${submitResult.status?.toLowerCase() === 'accepted' ? 'bg-green-500' : 'bg-red-500'}`} />}
                                    </button>
                                </div>

                                {/* Test Cases tab */}
                                {activeBottomTab === 'testcases' && (
                                    <div className="flex flex-1 overflow-hidden p-4 gap-4">
                                        {/* Case selector (Vertical tabs) */}
                                        <div className="flex flex-col gap-2 w-32 shrink-0">
                                            {(problem.visibleTestCases || []).map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setActiveTestCase(i)}
                                                    className={clsx(
                                                        'px-4 py-2 text-sm font-medium rounded-lg text-left transition-all',
                                                        activeTestCase === i
                                                            ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200'
                                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent'
                                                    )}
                                                >
                                                    Case {i + 1}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Input / Output display */}
                                        {problem.visibleTestCases?.[activeTestCase] && (
                                            <div className="flex-1 overflow-y-auto space-y-4 font-mono text-sm">
                                                <div>
                                                    <p className="text-slate-500 mb-2 font-display text-xs uppercase font-bold tracking-wider">Input:</p>
                                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 whitespace-pre-wrap">
                                                        {problem.visibleTestCases[activeTestCase].input}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 mb-2 font-display text-xs uppercase font-bold tracking-wider">Expected Output:</p>
                                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 whitespace-pre-wrap">
                                                        {problem.visibleTestCases[activeTestCase].output}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Results tab */}
                                {activeBottomTab === 'results' && (
                                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                        {output === 'Running...' || output === 'Submitting...' ? (
                                            <div className="flex items-center gap-3 text-slate-500 font-medium">
                                                <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                                {output}
                                            </div>
                                        ) : submitResult ? (
                                            <div className="space-y-4">
                                                <h3 className={`text-2xl font-bold ${submitResult.status === 'accepted' || submitResult.status?.toLowerCase() === 'accepted' ? 'text-green-600' : 'text-red-500'}`}>
                                                    {submitResult.status === 'accepted' || submitResult.status?.toLowerCase() === 'accepted' ? 'Accepted' : submitResult.status}
                                                </h3>
                                                <div className="flex gap-4 text-sm font-medium flex-wrap">
                                                    <div className="bg-slate-50 p-4 rounded-xl flex-1 border border-slate-200 min-w-[120px]">
                                                        <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Runtime</p>
                                                        <p className="text-slate-900 text-lg flex items-end gap-1 font-mono">
                                                            {submitResult.runtime || 0} <span className="text-slate-500 text-sm pb-0.5">s</span>
                                                        </p>
                                                    </div>
                                                    <div className="bg-slate-50 p-4 rounded-xl flex-1 border border-slate-200 min-w-[120px]">
                                                        <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Memory</p>
                                                        <p className="text-slate-900 text-lg flex items-end gap-1 font-mono">
                                                            {submitResult.memory || 0} <span className="text-slate-500 text-sm pb-0.5">KB</span>
                                                        </p>
                                                    </div>
                                                    <div className="bg-slate-50 p-4 rounded-xl flex-1 border border-slate-200 min-w-[120px]">
                                                        <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Test Cases</p>
                                                        <p className="text-slate-900 text-lg flex items-end gap-1 font-mono">
                                                            {submitResult.testCasesPassed} / {submitResult.testCasesTotal}
                                                        </p>
                                                    </div>
                                                </div>
                                                {submitResult.errorMessage && (
                                                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 font-mono text-sm overflow-auto whitespace-pre-wrap">
                                                        {submitResult.errorMessage}
                                                    </div>
                                                )}
                                            </div>
                                        ) : runResult ? (
                                            <div className="space-y-4">
                                                <h3 className={`text-xl font-bold ${runResult.every(r => r.status.id === 3) ? 'text-green-600' : 'text-red-500'}`}>
                                                    {runResult.every(r => r.status.id === 3) ? 'Accepted' : 'Wrong Answer'}
                                                </h3>
                                                
                                                {/* Tabs for Test Cases inside Run Result */}
                                                <div className="flex gap-2 mb-4 flex-wrap">
                                                    {runResult.map((res, idx) => (
                                                        <button 
                                                            key={idx}
                                                            onClick={() => setActiveTestCase(idx)}
                                                            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                                                                activeTestCase === idx ? 'bg-slate-100 text-slate-900 border-slate-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-transparent'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-2 h-2 rounded-full ${res.status.id === 3 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                                Case {idx + 1}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Result content for active test case */}
                                                {runResult[activeTestCase] && problem.visibleTestCases[activeTestCase] && (
                                                    <div className="flex gap-6">
                                                        <div className="flex-1 space-y-4 font-mono text-sm">
                                                            <div>
                                                                <p className="text-slate-500 mb-2 font-display text-xs uppercase font-bold tracking-wider">Input</p>
                                                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 whitespace-pre-wrap">
                                                                    {problem.visibleTestCases[activeTestCase].input}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-500 mb-2 font-display text-xs uppercase font-bold tracking-wider">Output</p>
                                                                <div className={`border rounded-lg p-3 whitespace-pre-wrap ${runResult[activeTestCase].status.id === 3 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                                                    {runResult[activeTestCase].stdout || runResult[activeTestCase].compile_output || runResult[activeTestCase].stderr || runResult[activeTestCase].status.description}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-500 mb-2 font-display text-xs uppercase font-bold tracking-wider">Expected</p>
                                                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 whitespace-pre-wrap">
                                                                    {problem.visibleTestCases[activeTestCase].output}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : output ? (
                                            <pre className="font-mono text-sm text-slate-700 whitespace-pre-wrap leading-relaxed p-4 bg-slate-50 border border-slate-200 rounded-xl">{output}</pre>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                                                <span className="material-symbols-outlined text-[48px] text-slate-300">play_circle</span>
                                                <span className="text-sm font-medium">Click Run or Submit to see results</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Panel>
                        </Group>
                    </Panel>

                    {/* Resize handle */}
                    <Separator className={clsx(
                            "w-2 transition-colors cursor-col-resize flex flex-col items-center justify-center relative touch-none group",
                            showRightPanel ? "flex" : "hidden"
                        )}
                    >
                        <div className="h-6 w-1 bg-slate-300 rounded-full group-hover:bg-slate-400 transition-colors"></div>
                    </Separator>

                    {showRightPanel && (
                        <Panel defaultSize={25} minSize={15} className="flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            {/* Header: ✨ CodeMaster AI */}
                            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 px-3 h-10 shrink-0">
                                <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                                    <span className="material-symbols-outlined text-purple-600 text-[16px]">auto_awesome</span>
                                    CodeMaster AI
                                </div>
                                <div className="flex items-center gap-2">
                                     <button onClick={() => setShowRightPanel(false)} className="text-slate-400 hover:text-slate-700 flex items-center justify-center bg-transparent hover:bg-slate-200 p-1 rounded-md transition-colors">
                                         <span className="material-symbols-outlined text-[16px]">close</span>
                                     </button>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
                                    {aiMessages.map((msg, idx) => (
                                        msg.role === 'assistant' ? (
                                            <div key={idx} className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 border border-green-200">
                                                    <span className="material-symbols-outlined text-green-600 text-[18px]">smart_toy</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-slate-900">CodeMaster AI</span>
                                                        <span className="text-[10px] text-slate-400">Just now</span>
                                                    </div>
                                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-800 shadow-sm overflow-hidden break-words w-full">
                                                        <div className="prose prose-slate prose-sm max-w-none text-slate-800 prose-p:text-slate-800 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-pre:bg-slate-100 prose-pre:text-slate-900 prose-pre:border prose-pre:border-slate-300 prose-pre:shadow-sm prose-pre:max-w-full prose-pre:overflow-x-auto [&_:not(pre)>code]:!bg-slate-100 [&_:not(pre)>code]:!text-slate-900 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded-md [&_:not(pre)>code]:font-normal">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {msg.text}
                                                            </ReactMarkdown>
                                                        </div>
                                                        {idx === 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-4">
                                                                <button onClick={() => handleSendAiMessage("Explain Complexity")} className="bg-white hover:bg-slate-50 text-xs px-3 py-1.5 rounded-full text-green-600 font-medium transition-colors border border-green-200 hover:border-green-300">
                                                                    Explain Complexity
                                                                </button>
                                                                <button onClick={() => handleSendAiMessage("Show Hint")} className="bg-white hover:bg-slate-50 text-xs px-3 py-1.5 rounded-full text-slate-600 font-medium transition-colors border border-slate-200 hover:border-slate-300">
                                                                    Show Hint
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={idx} className="flex gap-3 flex-row-reverse">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-slate-500 text-[18px]">person</span>
                                                </div>
                                                <div className="bg-green-100 border border-green-200 rounded-2xl rounded-tr-sm p-3.5 text-sm text-green-900 shadow-sm whitespace-pre-wrap">
                                                    {msg.text}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                    
                                    {isAiTyping && (
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-green-600 text-[16px]">smart_toy</span>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 bg-white border-t border-slate-100">
                                    <div className="relative border border-slate-200 rounded-xl bg-slate-50 focus-within:ring-1 focus-within:ring-green-600 focus-within:border-green-600 transition-all shadow-sm">
                                        <input 
                                            type="text" 
                                            value={aiInput}
                                            onChange={e => setAiInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSendAiMessage()}
                                            placeholder="Ask AI for help or hints..." 
                                            className="w-full bg-transparent border-none pl-4 pr-10 py-3 text-sm text-slate-700 focus:outline-none focus:ring-0 placeholder:text-slate-400"
                                        />
                                        <button 
                                            onClick={() => handleSendAiMessage()}
                                            disabled={isAiTyping || !aiInput.trim()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600 p-1.5 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">send</span>
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 px-1 pb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
                                                <div className="w-5 h-3 bg-green-500 rounded-full flex items-center p-0.5 justify-end"><div className="w-2 h-2 bg-white rounded-full"></div></div>
                                                Agent
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-bold ${user && user.tokens <= 0 ? 'text-red-500' : 'text-purple-600'}`}>
                                            Tokens: {user ? user.tokens : 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Panel>
                    )}
                </Group>
            </main>
        </div>
    );
};

export default CodeEditorPage;
