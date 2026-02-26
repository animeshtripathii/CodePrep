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
            <main className="flex-1 flex overflow-hidden p-2 gap-2">
                <Group orientation="horizontal">

                    {/* ── LEFT PANEL: Problem Description ── */}
                    <Panel defaultSize={50} minSize={20} className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

                        {/* Tab bar */}
                        <div className="flex items-center bg-white border-b border-slate-200 px-2 h-12 shrink-0 gap-2">
                            {[
                                { key: 'description', label: 'Description', icon: 'description' },
                                { key: 'editorial',   label: 'Editorial',   icon: 'menu_book'   },
                                { key: 'solution',    label: 'Solution',    icon: 'verified'    },
                                { key: 'submissions', label: 'Submissions', icon: 'history'     },
                            ].map(({ key, label, icon }) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={clsx(
                                        'flex items-center gap-1.5 px-3 h-full border-b-2 text-sm font-medium transition-colors',
                                        activeTab === key
                                            ? 'border-green-600 text-slate-900'
                                            : 'border-transparent text-slate-500 hover:text-slate-700'
                                    )}
                                >
                                    <span className={clsx('material-symbols-outlined text-[18px]', activeTab === key && 'text-green-600')}>{icon}</span>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Scrollable left content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

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
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-slate-900 mb-4">Editorial</h2>
                                    
                                    {problem.secureUrl || problem.videoUrl ? (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-red-500">play_circle</span>
                                                Video Solution
                                            </h3>
                                            
                                            {problem.secureUrl ? (
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
                                            ) : (
                                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center space-y-3">
                                                    <span className="material-symbols-outlined text-4xl text-blue-500 mb-2">link</span>
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
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                                            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">videocam_off</span>
                                            <p className="text-slate-500 font-medium">No video editorial available for this problem.</p>
                                        </div>
                                    )}
                                </div>
                            )}

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
                                                            <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer">
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
                                </div>
                            )}
                        </div>
                    </Panel>

                    {/* Resize handle */}
                    <Separator className="w-2 bg-transparent hover:bg-green-600/20 transition-colors cursor-col-resize flex items-center justify-center">
                        <div className="h-8 w-1 bg-slate-300 rounded-full"></div>
                    </Separator>

                    {/* ── MIDDLE PANEL: Editor + Terminal ── */}
                    <Panel defaultSize={showRightPanel ? 33 : 50} minSize={30} className="relative flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <Group orientation="vertical" style={{ height: '100%' }}>

                            {/* Editor section */}
                            <Panel defaultSize={70} minSize={25} className="flex flex-col">

                                {/* Editor toolbar */}
                                <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 px-4 h-12 shrink-0">
                                    <div className="flex items-center gap-4">

                                        {/* ── Language selector ── */}
                                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-3 py-1.5 shadow-sm">
                                            <span className="material-symbols-outlined text-green-600 text-[18px]">code</span>
                                            <select
                                                value={language}
                                                onChange={e => setLanguage(e.target.value)}
                                                className="appearance-none bg-transparent border-none outline-none text-sm font-semibold text-slate-700 cursor-pointer pr-4 focus:ring-0"
                                            >
                                                <option value="c">C</option>
                                                <option value="c++">C++</option>
                                                <option value="java">Java</option>
                                                <option value="javascript">JavaScript</option>
                                                <option value="python">Python 3</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Actions Right */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                if (problem?.startCode) {
                                                    const s = problem.startCode.find(sc => sc.language.toLowerCase() === language);
                                                    if (s) setCode(s.initialCode);
                                                }
                                            }}
                                            className="flex items-center justify-center p-2 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
                                            title="Reset Code"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                                        </button>
                                        <button
                                            onClick={() => setShowRightPanel(!showRightPanel)}
                                            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md transition border text-sm font-bold ${
                                                showRightPanel 
                                                ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200 shadow-sm' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
                                            }`}
                                            title="Toggle AI Panel"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                                            {showRightPanel ? 'Close AI' : 'Ask AI'}
                                        </button>
                                        <div className="h-6 w-px bg-slate-200 mx-1"></div>
                                        <button
                                            onClick={handleRun}
                                            disabled={output === 'Running...' || isSubmitting}
                                            className={`px-4 py-1.5 rounded-md text-sm font-bold border transition-colors flex items-center gap-1.5 ${output === 'Running...' || isSubmitting ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'}`}
                                        >
                                            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                                            Run
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || output === 'Running...'}
                                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors flex items-center gap-1.5 ${isSubmitting || output === 'Running...' ? 'bg-green-300 text-white cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 shadow-sm shadow-green-600/20'}`}
                                        >
                                            <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                                            Submit
                                        </button>
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
                            <Separator className="h-2 bg-slate-50 border-y border-slate-200 hover:bg-green-600/10 transition-colors cursor-row-resize flex items-center justify-center">
                                <div className="w-8 h-1 bg-slate-300 rounded-full"></div>
                            </Separator>

                            {/* ── Bottom: Console / Test Cases ── */}
                            <Panel defaultSize={30} minSize={15} className="flex flex-col bg-white">

                                {/* Bottom tab bar */}
                                <div className="flex items-center px-4 pt-2 gap-2 border-b border-slate-200 bg-slate-50">
                                    <button
                                        onClick={() => setActiveBottomTab('testcases')}
                                        className={clsx(
                                            'flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-semibold relative top-[1px] transition-colors',
                                            activeBottomTab === 'testcases'
                                                ? 'bg-white text-slate-900 border-t border-l border-r border-slate-200'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                        )}
                                    >
                                        Testcase
                                    </button>
                                    <button
                                        onClick={() => setActiveBottomTab('results')}
                                        className={clsx(
                                            'flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-semibold relative top-[1px] transition-colors',
                                            activeBottomTab === 'results'
                                                ? 'bg-white text-slate-900 border-t border-l border-r border-slate-200'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                        )}
                                    >
                                        Result
                                        {submitResult && <span className={`w-2 h-2 rounded-full ${submitResult.status?.toLowerCase() === 'accepted' ? 'bg-green-500' : 'bg-red-500'}`} />}
                                    </button>
                                    <div className="flex-1" />
                                    <button className="p-1 text-slate-400 hover:text-slate-700 transition">
                                        <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
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
                    <Separator 
                        className={clsx(
                            "w-2 transition-all cursor-col-resize flex items-center justify-center",
                            showRightPanel ? "bg-transparent hover:bg-green-600/20" : "hidden"
                        )}
                    >
                        <div className="h-8 w-1 bg-slate-300 rounded-full"></div>
                    </Separator>

                    {/* ── RIGHT PANEL: AI Chat ── */}
                    {showRightPanel && (
                        <Panel defaultSize={33} minSize={15} className="flex flex-col bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            
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
                                                        <div className="prose prose-slate prose-sm max-w-none text-slate-800 prose-p:text-slate-800 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-pre:bg-white prose-pre:border prose-pre:border-slate-200 prose-pre:shadow-sm prose-pre:max-w-full prose-pre:overflow-x-auto">
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
                                    <div className="flex justify-between items-center mt-2 px-1">
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
                                            <span className="material-symbols-outlined text-[12px]">code</span>
                                            Insert Code Snippet
                                        </span>
                                        <span className={`text-[10px] font-bold ${user && user.tokens <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                                            AI Tokens: {user ? user.tokens : 0}
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
