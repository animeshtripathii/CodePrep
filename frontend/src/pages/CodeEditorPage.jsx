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
    const [editorTheme, setEditorTheme] = useState('vs-dark');
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
        easy:   'badge-easy',
        medium: 'badge-medium',
        hard:   'badge-hard',
    };

    const langDisplayName = {
        'c': 'C', 'c++': 'C++', 'java': 'Java',
        'javascript': 'JavaScript', 'python': 'Python',
    };

    // ── Loading / Error States ────────────────────────────────────
    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #FF4F00', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: '#8A8B91', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>Loading problem…</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!problem) {
        return (
            <div style={{ minHeight: '100vh', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontFamily: 'Inter, sans-serif' }}>
                Problem not found.
            </div>
        );
    }

    // ── Main Render ───────────────────────────────────────────────
    return (
        <div className="flex flex-col h-screen overflow-hidden font-display" style={{ background: '#000000', color: '#F3F3F5' }}>

            {/* ═══════════════ NAVBAR ═══════════════ */}
            <Navbar />

            {/* ═══════════════ MAIN WORKSPACE ═══════════════ */}
            <main className="flex-1 flex overflow-hidden p-2 gap-2">
                <Group orientation="horizontal">

                    {/* ── LEFT PANEL: Problem Description ── */}
                    <Panel defaultSize={50} minSize={20} className="flex flex-col rounded-xl overflow-hidden" style={{ background: '#0C0C0D', border: '1px solid #222225' }}>

                        {/* Tab bar */}
                        <div className="flex items-center px-2 h-12 shrink-0 gap-2" style={{ background: '#0C0C0D', borderBottom: '1px solid #1a1a1e' }}>
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
                                        'flex items-center gap-1.5 px-3 h-full border-b-2 text-sm font-semibold transition-colors',
                                        activeTab === key
                                            ? 'border-[#FF4F00] text-white'
                                            : 'border-transparent text-[#8A8B91] hover:text-white'
                                    )}
                                >
                                    <span className={clsx('material-symbols-outlined text-[18px]', activeTab === key ? 'text-[#FF4F00]' : 'text-[#8A8B91]')}>{icon}</span>
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
                                    {/* Title */}
                                    <h1 className="text-2xl font-bold text-white mb-4">{problem.title}</h1>

                                    {/* Difficulty + Tags */}
                                    <div className="flex flex-wrap items-center gap-3 mb-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${difficultyStyle[problem.difficulty?.toLowerCase()] || difficultyStyle.medium}`}>
                                            {problem.difficulty}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <div className="prose prose-invert prose-sm max-w-none text-[#F3F3F5] leading-relaxed mb-8">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {problem.description}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Examples */}
                                    {(problem.visibleTestCases || []).map((tc, i) => (
                                        <div key={i} className="mb-6">
                                            <h3 className="text-white font-bold text-sm mb-3">Example {i + 1}:</h3>
                                            <div className="rounded-lg p-4 space-y-2" style={{ background: '#111112', border: '1px solid #1a1a1e' }}>
                                                <p className="font-mono text-sm">
                                                    <strong className="text-white font-semibold">Input:</strong>{' '}
                                                    <span style={{ color: '#8A8B91' }}>{tc.input}</span>
                                                </p>
                                                <p className="font-mono text-sm">
                                                    <strong className="text-white font-semibold">Output:</strong>{' '}
                                                    <span style={{ color: '#8A8B91' }}>{tc.output}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {activeTab === 'editorial' && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-white mb-4">Editorial</h2>
                                    
                                    {problem.secureUrl || problem.videoUrl ? (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
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
                                                <div className="p-6 rounded-xl text-center space-y-3" style={{ background: '#111112', border: '1px solid #1a1a1e' }}>
                                                    <span className="material-symbols-outlined text-4xl text-blue-500 mb-2">link</span>
                                                    <p className="font-medium" style={{ color: '#8A8B91' }}>An external video solution is available.</p>
                                                    <a 
                                                        href={problem.videoUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 bg-[#FF4F00] hover:bg-[#FF8C42] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
                                                    >
                                                        Watch Video Solution
                                                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-6 rounded-xl text-center" style={{ background: '#111112', border: '1px solid #1a1a1e' }}>
                                            <span className="material-symbols-outlined text-4xl mb-2" style={{ color: '#333338' }}>videocam_off</span>
                                            <p className="font-medium" style={{ color: '#8A8B91' }}>No video editorial available for this problem.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'solution' && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-white mb-4">Solution Code</h2>
                                    {problem.referenceSolution && problem.referenceSolution.length > 0 ? (
                                        problem.referenceSolution.map((sol, i) => (
                                            <div key={i} className="p-4 rounded-lg border mb-4" style={{ background: '#111112', borderColor: '#1a1a1e' }}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-semibold text-sm capitalize" style={{ color: '#8A8B91' }}>{sol.language} Solution</span>
                                                </div>
                                                <pre className="text-sm font-mono p-4 rounded-lg overflow-x-auto shadow-sm" style={{ background: '#000000', color: '#F3F3F5', border: '1px solid #1a1a1e' }}>
                                                    {sol.completeCode || "No code available"}
                                                </pre>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm" style={{ color: '#8A8B91' }}>No solution available for this problem.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'submissions' && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-white mb-4">Your Submissions</h2>
                                    {loadingSubmissions ? (
                                        <div className="flex justify-center py-10">
                                            <div className="size-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FF4F00', borderTopColor: 'transparent' }} />
                                        </div>
                                    ) : submissions.length > 0 ? (
                                        <div className="overflow-x-auto rounded-lg border" style={{ background: '#0C0C0D', borderColor: '#1a1a1e' }}>
                                            <table className="w-full text-left text-sm" style={{ color: '#8A8B91' }}>
                                                <thead className="text-xs uppercase border-b" style={{ background: '#111112', borderColor: '#1a1a1e', color: '#4a4a52' }}>
                                                    <tr>
                                                        <th scope="col" className="px-4 py-3 font-medium">Status</th>
                                                        <th scope="col" className="px-4 py-3 font-medium">Language</th>
                                                        <th scope="col" className="px-4 py-3 font-medium">Runtime</th>
                                                        <th scope="col" className="px-4 py-3 font-medium">Memory</th>
                                                        <th scope="col" className="px-4 py-3 font-medium">Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#1a1a1e]">
                                                    {submissions.map((sub, i) => {
                                                        const isAccepted = sub.status === 'accepted' || sub.status?.toLowerCase() === 'accepted';
                                                        return (
                                                            <tr key={i} className="transition-colors group cursor-pointer hover:bg-[#111112]">
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <div className={`font-semibold ${isAccepted ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                                                                        {isAccepted ? 'Accepted' : sub.status}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <span className="px-2 py-1 rounded text-xs" style={{ background: '#000000', border: '1px solid #1a1a1e', color: '#8A8B91' }}>
                                                                        {sub.language}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                                                                    {sub.runtime ? `${sub.runtime} s` : 'N/A'}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                                                                    {sub.memory ? `${sub.memory} KB` : 'N/A'}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: '#4a4a52' }}>
                                                                    {new Date(sub.createdAt).toLocaleDateString()}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-sm" style={{ color: '#8A8B91' }}>You haven't submitted any code for this problem yet.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </Panel>

                    {/* Resize handle */}
                    <Separator className="w-2 bg-transparent hover:bg-orange-600/20 transition-colors cursor-col-resize flex items-center justify-center">
                        <div className="h-8 w-1 bg-[#333338] rounded-full"></div>
                    </Separator>

                    {/* ── MIDDLE PANEL: Editor + Terminal ── */}
                    <Panel defaultSize={showRightPanel ? 33 : 50} minSize={30} className="relative flex flex-col rounded-xl overflow-hidden" style={{ background: '#0C0C0D', border: '1px solid #222225' }}>
                        <Group orientation="vertical" style={{ height: '100%' }}>

                            {/* Editor section */}
                            <Panel defaultSize={70} minSize={25} className="flex flex-col">

                                {/* Editor toolbar */}
                                <div className="flex items-center justify-between px-4 h-12 shrink-0" style={{ background: '#0C0C0D', borderBottom: '1px solid #1a1a1e' }}>
                                    <div className="flex items-center gap-4">

                                        {/* ── Language selector ── */}
                                        <div className="flex items-center gap-2 rounded-md px-3 py-1.5" style={{ background: '#111112', border: '1px solid #1a1a1e' }}>
                                            <span className="material-symbols-outlined text-[#FF4F00] text-[18px]">code</span>
                                            <select
                                                value={language}
                                                onChange={e => setLanguage(e.target.value)}
                                                className="appearance-none bg-transparent border-none outline-none text-sm font-semibold text-white cursor-pointer pr-4 focus:ring-0"
                                                style={{ colorScheme: 'dark' }}
                                            >
                                                <option value="c" className="bg-[#111112]">C</option>
                                                <option value="c++" className="bg-[#111112]">C++</option>
                                                <option value="java" className="bg-[#111112]">Java</option>
                                                <option value="javascript" className="bg-[#111112]">JavaScript</option>
                                                <option value="python" className="bg-[#111112]">Python 3</option>
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
                                            className="flex items-center justify-center p-2 rounded-md hover:bg-white/5 text-[#8A8B91] hover:text-white transition"
                                            title="Reset Code"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                                        </button>
                                        <button
                                            onClick={() => setShowRightPanel(!showRightPanel)}
                                            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md transition text-sm font-bold border ${
                                                showRightPanel 
                                                ? 'bg-[rgba(255,79,0,0.15)] text-[#FF4F00] border-[rgba(255,79,0,0.2)]' 
                                                : 'btn-rc-secondary'
                                            }`}
                                            title="Toggle AI Panel"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                                            {showRightPanel ? 'Close AI' : 'Ask AI'}
                                        </button>
                                        <div className="h-6 w-px bg-[#1a1a1e] mx-1"></div>
                                        <button
                                            onClick={handleRun}
                                            disabled={output === 'Running...' || isSubmitting}
                                            className={`px-4 py-1.5 rounded-md text-sm font-bold border transition-colors flex items-center gap-1.5 ${output === 'Running...' || isSubmitting ? 'opacity-40 cursor-not-allowed text-[#8A8B91]' : 'btn-rc-secondary'}`}
                                        >
                                            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                                            Run
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || output === 'Running...'}
                                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-1.5 ${isSubmitting || output === 'Running...' ? 'opacity-40 cursor-not-allowed text-white' : 'btn-rc-primary'}`}
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
                                        theme={editorTheme}
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
                            <Separator className="h-2 hover:bg-orange-600/10 transition-colors cursor-row-resize flex items-center justify-center" style={{ background: '#0C0C0D', borderTop: '1px solid #1a1a1e', borderBottom: '1px solid #1a1a1e' }}>
                                <div className="w-8 h-1 bg-[#333338] rounded-full"></div>
                            </Separator>

                            {/* ── Bottom: Console / Test Cases ── */}
                            <Panel defaultSize={30} minSize={15} className="flex flex-col animate-in fade-in" style={{ background: '#0C0C0D' }}>

                                {/* Bottom tab bar */}
                                <div className="flex items-center px-4 pt-2 gap-2 shrink-0" style={{ background: '#0C0C0D', borderBottom: '1px solid #1a1a1e' }}>
                                    <button
                                        onClick={() => setActiveBottomTab('testcases')}
                                        className={clsx(
                                            'flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-semibold relative top-[1px] transition-colors border-t border-l border-r',
                                            activeBottomTab === 'testcases'
                                                ? 'bg-[#0C0C0D] text-white border-[#1a1a1e]'
                                                : 'text-[#8A8B91] hover:text-white border-transparent hover:bg-white/5'
                                        )}
                                    >
                                        Testcase
                                    </button>
                                    <button
                                        onClick={() => setActiveBottomTab('results')}
                                        className={clsx(
                                            'flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-semibold relative top-[1px] transition-colors border-t border-l border-r',
                                            activeBottomTab === 'results'
                                                ? 'bg-[#0C0C0D] text-white border-[#1a1a1e]'
                                                : 'text-[#8A8B91] hover:text-white border-transparent hover:bg-white/5'
                                        )}
                                    >
                                        Result
                                        {submitResult && <span className={`w-2 h-2 rounded-full ml-1 ${submitResult.status?.toLowerCase() === 'accepted' ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />}
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
                                                        'px-4 py-2 text-sm font-medium rounded-lg text-left transition-all border',
                                                        activeTestCase === i
                                                            ? 'bg-[#111112] text-white border-[#1a1a1e] shadow-sm'
                                                            : 'text-[#8A8B91] hover:text-white hover:bg-white/5 border-transparent'
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
                                                    <p className="mb-2 font-display text-xs uppercase font-bold tracking-wider" style={{ color: '#4a4a52' }}>Input:</p>
                                                    <div className="rounded-lg p-3 whitespace-pre-wrap" style={{ background: '#111112', border: '1px solid #1a1a1e', color: '#F3F3F5' }}>
                                                        {problem.visibleTestCases[activeTestCase].input}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="mb-2 font-display text-xs uppercase font-bold tracking-wider" style={{ color: '#4a4a52' }}>Expected Output:</p>
                                                    <div className="rounded-lg p-3 whitespace-pre-wrap" style={{ background: '#111112', border: '1px solid #1a1a1e', color: '#F3F3F5' }}>
                                                        {problem.visibleTestCases[activeTestCase].output}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Results tab */}
                                {activeBottomTab === 'results' && (
                                    <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                                        {output === 'Running...' || output === 'Submitting...' ? (
                                            <div className="flex items-center gap-3 text-[#8A8B91] font-medium animate-pulse">
                                                <div className="size-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FF4F00', borderTopColor: 'transparent' }} />
                                                {output}
                                            </div>
                                        ) : submitResult ? (
                                            <div className="space-y-4">
                                                <h3 className={`text-2xl font-bold ${submitResult.status === 'accepted' || submitResult.status?.toLowerCase() === 'accepted' ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                                                    {submitResult.status === 'accepted' || submitResult.status?.toLowerCase() === 'accepted' ? 'Accepted' : submitResult.status}
                                                </h3>
                                                <div className="flex gap-4 text-sm font-medium flex-wrap">
                                                    <div className="p-4 rounded-xl flex-1 border min-w-[120px]" style={{ background: '#111112', borderColor: '#1a1a1e' }}>
                                                        <p className="text-xs mb-1 uppercase tracking-wider" style={{ color: '#4a4a52' }}>Runtime</p>
                                                        <p className="text-lg flex items-end gap-1 font-mono text-white">
                                                            {submitResult.runtime || 0} <span style={{ color: '#8A8B91', fontSize: '13px' }}>s</span>
                                                        </p>
                                                    </div>
                                                    <div className="p-4 rounded-xl flex-1 border min-w-[120px]" style={{ background: '#111112', borderColor: '#1a1a1e' }}>
                                                        <p className="text-xs mb-1 uppercase tracking-wider" style={{ color: '#4a4a52' }}>Memory</p>
                                                        <p className="text-lg flex items-end gap-1 font-mono text-white">
                                                            {submitResult.memory || 0} <span style={{ color: '#8A8B91', fontSize: '13px' }}>KB</span>
                                                        </p>
                                                    </div>
                                                    <div className="p-4 rounded-xl flex-1 border min-w-[120px]" style={{ background: '#111112', borderColor: '#1a1a1e' }}>
                                                        <p className="text-xs mb-1 uppercase tracking-wider" style={{ color: '#4a4a52' }}>Test Cases</p>
                                                        <p className="text-lg flex items-end gap-1 font-mono text-white">
                                                            {submitResult.testCasesPassed} / {submitResult.testCasesTotal}
                                                        </p>
                                                    </div>
                                                </div>
                                                {submitResult.errorMessage && (
                                                    <div className="border p-4 rounded-xl font-mono text-sm overflow-auto whitespace-pre-wrap text-[#ef4444]" style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.15)' }}>
                                                        {submitResult.errorMessage}
                                                    </div>
                                                )}
                                            </div>
                                        ) : runResult ? (
                                            <div className="space-y-4">
                                                <h3 className={`text-xl font-bold ${runResult.every(r => r.status.id === 3) ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                                                    {runResult.every(r => r.status.id === 3) ? 'Accepted' : 'Wrong Answer'}
                                                </h3>
                                                
                                                {/* Tabs for Test Cases inside Run Result */}
                                                <div className="flex gap-2 mb-4 flex-wrap">
                                                    {runResult.map((res, idx) => (
                                                        <button 
                                                            key={idx}
                                                            onClick={() => setActiveTestCase(idx)}
                                                            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                                                                activeTestCase === idx ? 'bg-[#111112] text-white border-[#1a1a1e] shadow-sm' : 'text-[#8A8B91] border-transparent hover:bg-white/5'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-2 h-2 rounded-full ${res.status.id === 3 ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`}></span>
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
                                                                <p className="mb-2 font-display text-xs uppercase font-bold tracking-wider" style={{ color: '#4a4a52' }}>Input</p>
                                                                <div className="rounded-lg p-3 whitespace-pre-wrap" style={{ background: '#111112', border: '1px solid #1a1a1e', color: '#F3F3F5' }}>
                                                                    {problem.visibleTestCases[activeTestCase].input}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="mb-2 font-display text-xs uppercase font-bold tracking-wider" style={{ color: '#4a4a52' }}>Output</p>
                                                                <div className={`border rounded-lg p-3 whitespace-pre-wrap ${runResult[activeTestCase].status.id === 3 ? 'bg-[rgba(16,185,129,0.06)] border-[#10b981] text-[#10b981]' : 'bg-[rgba(239,68,68,0.06)] border-[#ef4444] text-[#ef4444]'}`}>
                                                                    {runResult[activeTestCase].stdout || runResult[activeTestCase].compile_output || runResult[activeTestCase].stderr || runResult[activeTestCase].status.description}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="mb-2 font-display text-xs uppercase font-bold tracking-wider" style={{ color: '#4a4a52' }}>Expected</p>
                                                                <div className="rounded-lg p-3 whitespace-pre-wrap" style={{ background: '#111112', border: '1px solid #1a1a1e', color: '#F3F3F5' }}>
                                                                    {problem.visibleTestCases[activeTestCase].output}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : output ? (
                                            <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed p-4 rounded-xl" style={{ background: '#111112', border: '1px solid #1a1a1e', color: '#8A8B91' }}>{output}</pre>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: '#4a4a52' }}>
                                                <span className="material-symbols-outlined text-[48px]">play_circle</span>
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
                            showRightPanel ? "bg-transparent hover:bg-orange-600/20" : "hidden"
                        )}
                    >
                        <div className="h-8 w-1 bg-[#333338] rounded-full"></div>
                    </Separator>

                    {/* ── RIGHT PANEL: AI Chat ── */}
                    {showRightPanel && (
                        <Panel defaultSize={33} minSize={15} className="flex flex-col rounded-xl overflow-hidden" style={{ background: '#0C0C0D', border: '1px solid #222225' }}>
                            
                            <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
                                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 hide-scrollbar">
                                    {aiMessages.map((msg, idx) => (
                                        msg.role === 'assistant' ? (
                                            <div key={idx} className="flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                                                <div className="size-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold"
                                                    style={{ background: 'rgba(255,79,0,0.15)', color: '#FF4F00' }}>AI</div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-white">CodeMaster AI</span>
                                                    </div>
                                                    <div className="rounded-xl rounded-tl-sm p-3.5 text-sm leading-relaxed" style={{ background: '#1C1C1F', color: '#F3F3F5' }}>
                                                        <div className="prose prose-invert prose-sm max-w-none text-[#F3F3F5]">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {msg.text}
                                                            </ReactMarkdown>
                                                        </div>
                                                        {idx === 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-4">
                                                                <button onClick={() => handleSendAiMessage("Explain Complexity")} className="text-xs px-3 py-1.5 rounded-lg transition-colors border"
                                                                    style={{ background: 'rgba(255,79,0,0.06)', color: '#FF4F00', borderColor: 'rgba(255,79,0,0.15)' }}
                                                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#FF4F00'}
                                                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,79,0,0.15)'}>
                                                                    Explain Complexity
                                                                </button>
                                                                <button onClick={() => handleSendAiMessage("Show Hint")} className="text-xs px-3 py-1.5 rounded-lg transition-colors border"
                                                                    style={{ background: '#111112', color: '#8A8B91', borderColor: '#1a1a1e' }}
                                                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#333338'}
                                                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1e'}>
                                                                    Show Hint
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={idx} className="flex gap-2.5 flex-row-reverse animate-in fade-in slide-in-from-bottom-2 duration-150">
                                                <div className="size-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold"
                                                    style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>Me</div>
                                                <div className="rounded-xl rounded-tr-sm p-3.5 text-sm" style={{ background: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.15)' }}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                    
                                    {isAiTyping && (
                                        <div className="flex gap-2.5">
                                            <div className="size-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold"
                                                style={{ background: 'rgba(255,79,0,0.15)', color: '#FF4F00' }}>AI</div>
                                            <div className="rounded-xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5" style={{ background: '#1C1C1F' }}>
                                                <span className="typing-dot animate-bounce" style={{ color: '#FF4F00', animationDelay: '0ms' }}>●</span>
                                                <span className="typing-dot animate-bounce" style={{ color: '#FF4F00', animationDelay: '150ms' }}>●</span>
                                                <span className="typing-dot animate-bounce" style={{ color: '#FF4F00', animationDelay: '300ms' }}>●</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3" style={{ borderTop: '1px solid #1a1a1e' }}>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            value={aiInput}
                                            onChange={e => setAiInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSendAiMessage()}
                                            placeholder="Ask AI for help or hints..." 
                                            className="rc-input flex-1 !py-2 text-sm"
                                        />
                                        <button 
                                            onClick={() => handleSendAiMessage()}
                                            disabled={isAiTyping || !aiInput.trim()}
                                            className="size-9 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                            style={{ background: '#FF4F00', color: 'white' }}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">send</span>
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 px-1">
                                        <span className="text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                                            style={{ color: '#4a4a52' }}
                                            onMouseEnter={e => e.currentTarget.style.color = '#8A8B91'}
                                            onMouseLeave={e => e.currentTarget.style.color = '#4a4a52'}
                                            onClick={() => setAiInput(prev => prev + "\n```" + language + "\n" + code + "\n```")}>
                                            <span className="material-symbols-outlined text-[12px]">code</span>
                                            Insert Code Snippet
                                        </span>
                                        <span className={`text-[10px] font-bold ${user && user.tokens <= 0 ? 'text-red-500' : 'text-[#FF4F00]'}`}>
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
