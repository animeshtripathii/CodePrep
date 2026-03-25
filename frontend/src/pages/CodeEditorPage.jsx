import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axiosClient from '../utils/axiosClient';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PrepAiPanel from '../components/PrepAiPanel';

const getDifficultyTone = (difficulty = '') => {
    const normalized = String(difficulty).toLowerCase();
    if (normalized === 'easy') return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
    if (normalized === 'medium') return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
    return 'text-rose-400 border-rose-400/30 bg-rose-400/10';
};

const formatRunCase = (test, index) => ({
    id: `${index}`,
    status: test?.status?.description || 'Unknown',
    stdin: test?.stdin || '',
    expected: test?.expected_output || '',
    stdout: test?.stdout || test?.output || '',
    stderr: test?.stderr || test?.compile_output || ''
});

const CodeEditorPage = () => {
    const { id } = useParams();
    const mainSplitRef = useRef(null);
    const rightPanelRef = useRef(null);
    const editorTheme = 'vs-dark';
    const [language, setLanguage] = useState('python');
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
    const [showPrepAi, setShowPrepAi] = useState(false);
    const [leftPanelWidth, setLeftPanelWidth] = useState(46);
    const [bottomPanelHeight, setBottomPanelHeight] = useState(220);
    const [dragType, setDragType] = useState(null);

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const visibleCases = problem?.visibleTestCases || [];
    const safeTestCaseIndex = Math.min(activeTestCase, Math.max(visibleCases.length - 1, 0));
    const selectedVisibleCase = visibleCases[safeTestCaseIndex] || null;
    const runCaseResults = Array.isArray(runResult?.testResult) ? runResult.testResult.map(formatRunCase) : [];

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const response = await axiosClient.get(`/problem/problemById/${id}`);
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
                    setCode('# Write your code here');
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

    useEffect(() => {
        if (problem && problem.startCode) {
            const starter = problem.startCode.find(sc => sc.language.toLowerCase() === language);
            if (starter) setCode(starter.initialCode);
        }
    }, [language, problem]);

    useEffect(() => {
        setActiveTestCase(0);
    }, [problem?._id]);

    useEffect(() => {
        if (!dragType) return;

        const handleMouseMove = (event) => {
            if (dragType === 'vertical' && mainSplitRef.current) {
                const bounds = mainSplitRef.current.getBoundingClientRect();
                const nextPercent = ((event.clientX - bounds.left) / bounds.width) * 100;
                setLeftPanelWidth(clamp(nextPercent, 28, 68));
            }

            if (dragType === 'horizontal' && rightPanelRef.current) {
                const bounds = rightPanelRef.current.getBoundingClientRect();
                const nextHeight = bounds.bottom - event.clientY;
                const maxHeight = Math.max(160, bounds.height - 220);
                setBottomPanelHeight(clamp(nextHeight, 140, maxHeight));
            }
        };

        const handleMouseUp = () => {
            setDragType(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragType]);

    const handleRunCode = async () => {
        setIsSubmitting(true);
        setActiveBottomTab('console');
        try {
            const res = await axiosClient.post(`/submission/run/${id}`, {
                code,
                language
            });
            setRunResult(res.data);
            const testResult = Array.isArray(res.data?.testResult) ? res.data.testResult : [];
            const accepted = testResult.filter((item) => item?.status?.id === 3).length;
            setOutput(`Executed ${testResult.length} test cases. Passed: ${accepted}.`);
            toast.success('Code run successfully!');
        } catch (error) {
            console.error('Run code error', error);
            setRunResult({ error: error.response?.data?.message || 'Error running code' });
            setOutput(error.response?.data?.message || 'Error executing code.');
            toast.error('Code execution failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitCode = async () => {
        setIsSubmitting(true);
        setActiveBottomTab('console');
        try {
            const res = await axiosClient.post(`/submission/submit/${id}`, {
                code,
                language
            });
            setSubmitResult(res.data);
            const passed = Number(res.data?.submission?.testCasesPassed ?? 0);
            const total = Number(res.data?.submission?.testCasesTotal ?? 0);
            const status = res.data?.submission?.status || 'Submitted';
            if (total > 0) {
                setOutput(`Submission: ${status}. Passed ${passed}/${total} test cases.`);
            } else {
                setOutput(res.data.message || `Submission: ${status}.`);
            }
            toast.success('Solution submitted successfully!');
            setActiveTab('submissions');
            await fetchSubmissions();
        } catch (error) {
            console.error('Submit code error', error);
            setSubmitResult({ error: error.response?.data?.message || 'Error submitting code' });
            setOutput(error.response?.data?.message || 'Error submitting code.');
            toast.error('Submission failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchSubmissions = useCallback(async () => {
        if (!id) return;
        setLoadingSubmissions(true);
        try {
            const res = await axiosClient.get(`/submission/submissions/${id}`);
            setSubmissions(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            toast.error('Failed to load submissions');
        } finally {
            setLoadingSubmissions(false);
        }
    }, [id]);

    useEffect(() => {
        if (activeTab === 'submissions') {
            fetchSubmissions();
        }
    }, [activeTab, fetchSubmissions]);

    if (loading) return <div className="h-screen w-screen flex items-center justify-center text-white" style={{ background: '#02040a' }}>Loading...</div>;
    if (!problem) return <div className="h-screen w-screen flex items-center justify-center text-white" style={{ background: '#02040a' }}>Problem not found.</div>;

    return (
        <div className="editor-theme-root h-[calc(100vh-61px)] w-screen overflow-hidden flex flex-col font-body antialiased relative text-[#F8FAFC]">
            <style>{`
                .editor-theme-root {
                    background:
                        radial-gradient(120% 120% at 0% 0%, rgba(14, 165, 233, 0.16) 0%, rgba(14, 165, 233, 0) 48%),
                        radial-gradient(120% 120% at 100% 100%, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 50%),
                        #02040a;
                }
                .glass-panel { background-color: rgba(255, 255, 255, 0.03); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.1); }
                .glass-button { background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.2s ease; }
                .glass-button:hover { background-color: rgba(255, 255, 255, 0.1); border-color: rgba(99, 102, 241, 0.5); box-shadow: 0 0 15px rgba(99, 102, 241, 0.3); }
                .liquid-gradient { background: linear-gradient(135deg, #0EA5E9, #8B5CF6); background-size: 200% 200%; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-[#8B5CF6]/10 blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-[#0EA5E9]/10 blur-[120px]"></div>
            </div>

            <main className="relative z-10 flex flex-1 overflow-hidden p-4 gap-3">
                <div
                    ref={mainSplitRef}
                    className="grid flex-1 overflow-hidden gap-0"
                    style={{ gridTemplateColumns: `${leftPanelWidth}% 10px minmax(0, 1fr)` }}
                >
                    <section className="flex flex-col glass-panel rounded-lg overflow-hidden relative min-w-0">
                    <div className="flex border-b border-white/10 px-4 gap-5 bg-white/2 shrink-0">
                        {['description', 'editorial', 'solutions', 'submissions'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center justify-center border-b-2 pb-3 pt-4 px-1.5 transition-colors ${activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-white/40 hover:text-white/70'}`}
                            >
                                <span className="text-xs font-bold tracking-[0.04em] uppercase">{tab}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                        {activeTab === 'description' && (
                            <>
                                <div className="flex items-center justify-between mb-6 gap-4">
                                    <h1 className="text-[34px] font-display font-bold text-white tracking-tight">{problem.title}</h1>
                                    <span className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider border ${getDifficultyTone(problem.difficulty)}`}>{problem.difficulty}</span>
                                </div>
                                {!!problem.tags?.length && (
                                    <div className="flex flex-wrap gap-2 mb-5">
                                        {problem.tags.map((tag) => (
                                            <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] border border-white/10 bg-white/5 text-slate-300">{tag}</span>
                                        ))}
                                    </div>
                                )}
                                <div className="space-y-6 text-[#F8FAFC]/90 text-[15px] leading-relaxed">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.description}</ReactMarkdown>
                                </div>
                                {!!visibleCases.length && (
                                    <div className="mt-8 space-y-3">
                                        <h3 className="text-sm font-bold tracking-[0.06em] uppercase text-slate-300">Visible Test Cases</h3>
                                        {visibleCases.map((tc, idx) => (
                                            <div key={`desc-case-${idx}`} className="p-3 border border-white/10 rounded-lg bg-white/3 text-sm">
                                                <div><span className="text-slate-400">Input:</span> <span className="text-slate-100">{tc.input}</span></div>
                                                <div><span className="text-slate-400">Output:</span> <span className="text-slate-100">{tc.output}</span></div>
                                                {!!tc.explanation && <div><span className="text-slate-400">Explanation:</span> <span className="text-slate-100">{tc.explanation}</span></div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        {activeTab === 'editorial' && (
                            <div className="space-y-4 text-sm text-slate-200">
                                {problem.secureUrl || problem.videoUrl ? (
                                    <div className="space-y-3">
                                        <div className="text-slate-300">Editorial Video</div>
                                        <div className="rounded-lg overflow-hidden border border-white/10 bg-black/40">
                                            <video controls className="w-full max-h-100" src={problem.secureUrl || problem.videoUrl} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-slate-400">No editorial video available for this problem.</div>
                                )}
                            </div>
                        )}
                        {activeTab === 'solutions' && (
                            <div className="space-y-4 text-sm text-slate-200">
                                {Array.isArray(problem.referenceSolution) && problem.referenceSolution.length > 0 ? (
                                    problem.referenceSolution.map((sol, index) => (
                                        <div key={`${sol.language}-${index}`} className="rounded-lg border border-white/10 bg-white/3 overflow-hidden">
                                            <div className="px-3 py-2 border-b border-white/10 text-xs uppercase tracking-wider text-slate-300">{sol.language} Solution</div>
                                            <pre className="p-3 overflow-x-auto text-xs font-mono text-slate-100 whitespace-pre-wrap">{sol.completeCode}</pre>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-slate-400">No solutions available in database.</div>
                                )}
                            </div>
                        )}
                        {activeTab === 'submissions' && (
                            <div className="space-y-3 text-sm text-slate-200">
                                {loadingSubmissions && <div className="text-slate-400">Loading submissions...</div>}
                                {!loadingSubmissions && submissions.length === 0 && <div className="text-slate-400">No submissions yet.</div>}
                                {!loadingSubmissions && submissions.map((sub) => (
                                    <div key={sub._id} className="rounded-lg border border-white/10 bg-white/3 p-3">
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                            <span className="text-xs uppercase tracking-wider text-slate-300">{sub.language}</span>
                                            <span className="text-xs text-slate-400">{new Date(sub.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-slate-400">Status:</span> <span className="text-slate-100">{sub.status}</span>
                                        </div>
                                        <div className="text-sm"><span className="text-slate-400">Runtime:</span> {sub.runtime || 0} ms</div>
                                        <div className="text-sm"><span className="text-slate-400">Memory:</span> {sub.memory || 0} KB</div>
                                        <div className="text-sm"><span className="text-slate-400">Passed:</span> {sub.testCasesPassed || 0}/{sub.testCasesTotal || 0}</div>
                                        {sub.errorMessage && <div className="text-rose-300 text-xs mt-2">{sub.errorMessage}</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    </section>

                    <div
                        onMouseDown={() => setDragType('vertical')}
                        className="cursor-col-resize flex items-center justify-center group"
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize panels"
                    >
                        <div className="h-20 w-1 rounded-full bg-white/10 group-hover:bg-[#6366F1] transition-colors" />
                    </div>

                    <section ref={rightPanelRef} className="min-w-0 flex flex-col relative rounded-lg overflow-hidden border border-white/10 glass-panel">
                    <div className="min-h-0" style={{ height: `calc(100% - ${bottomPanelHeight}px - 10px)` }}>
                        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 glass-panel shrink-0 rounded-t-lg bg-white/3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-slate-100">Code</span>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="bg-transparent text-xs font-mono text-[#8B949E] outline-none glass-button rounded px-2 py-1"
                                >
                                    <option value="python">Python3</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="cpp">C++</option>
                                    <option value="java">Java</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowPrepAi((prev) => !prev)}
                                    className={`glass-button px-3 py-1.5 rounded text-xs font-medium ${showPrepAi ? 'text-[#6366F1] border-[#6366F1]/50' : 'text-[#F8FAFC]'}`}
                                >
                                    Prep AI
                                </button>
                                <button onClick={handleRunCode} disabled={isSubmitting} className="glass-button px-3.5 py-1.5 rounded text-xs font-medium text-[#F8FAFC]">{isSubmitting ? 'Running...' : 'Run'}</button>
                                <button onClick={handleSubmitCode} disabled={isSubmitting} className="bg-[#6366F1] hover:bg-[#6366F1]/80 text-white px-4 py-1.5 rounded text-xs font-bold transition-all">{isSubmitting ? 'Submitting...' : 'Submit'}</button>
                            </div>
                        </div>

                        <div className="min-h-0 relative overflow-hidden" style={{ height: 'calc(100% - 41px)' }}>
                            <Editor
                                height="100%"
                                language={language}
                                theme={editorTheme}
                                value={code}
                                onChange={(val) => setCode(val)}
                                options={{ minimap: { enabled: false }, fontSize: 14 }}
                            />
                        </div>
                    </div>

                    <div
                        onMouseDown={() => setDragType('horizontal')}
                        className="h-[10px] cursor-row-resize flex items-center justify-center group border-y border-white/10 bg-white/2"
                        role="separator"
                        aria-orientation="horizontal"
                        aria-label="Resize bottom panel"
                    >
                        <div className="w-14 h-1 rounded-full bg-white/10 group-hover:bg-[#6366F1] transition-colors" />
                    </div>

                    <div className="glass-panel border-t border-white/10 bg-white/2 backdrop-blur-xl shrink-0" style={{ height: `${bottomPanelHeight}px` }}>
                        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveBottomTab('console')} className={`text-xs font-mono uppercase tracking-wider flex items-center gap-2 ${activeBottomTab === 'console' ? 'text-[#0EA5E9]' : 'text-white/40 hover:text-white/70'}`}>Console</button>
                                <button onClick={() => setActiveBottomTab('testcases')} className={`text-xs font-mono uppercase tracking-wider flex items-center gap-2 ${activeBottomTab === 'testcases' ? 'text-[#0EA5E9]' : 'text-white/40 hover:text-white/70'}`}>Testcases</button>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400">Test Result</span>
                        </div>
                        <div className="p-4 overflow-y-auto bg-white/2" style={{ height: 'calc(100% - 44px)' }}>
                            {activeBottomTab === 'console' && (
                                <div className="space-y-3 text-xs font-mono">
                                    <pre className="text-white whitespace-pre-wrap">{output || 'Run or submit your code to see output.'}</pre>
                                    {!!runCaseResults.length && (
                                        <div className="space-y-2">
                                            {runCaseResults.map((item, idx) => (
                                                <div key={`run-case-${idx}`} className="border border-white/10 rounded p-2 bg-white/3">
                                                    <div className="text-slate-300">Case {idx + 1}: {item.status}</div>
                                                    {!!item.stdin && <div className="text-slate-400">Input: <span className="text-slate-200">{item.stdin}</span></div>}
                                                    {!!item.expected && <div className="text-slate-400">Expected: <span className="text-slate-200">{item.expected}</span></div>}
                                                    {!!item.stdout && <div className="text-slate-400">Output: <span className="text-slate-200">{item.stdout}</span></div>}
                                                    {!!item.stderr && <div className="text-rose-300">Error: {item.stderr}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeBottomTab === 'testcases' && (
                                <div className="space-y-3 text-sm">
                                    {visibleCases.length > 0 ? (
                                        <>
                                            <div className="flex flex-wrap gap-2">
                                                {visibleCases.map((_, index) => (
                                                    <button
                                                        key={`tc-btn-${index}`}
                                                        onClick={() => setActiveTestCase(index)}
                                                        className={`px-2.5 py-1 rounded border text-xs ${safeTestCaseIndex === index ? 'border-[#0EA5E9]/60 text-[#0EA5E9] bg-[#0EA5E9]/10' : 'border-white/10 text-slate-300 bg-white/3 hover:text-white'}`}
                                                    >
                                                        Case {index + 1}
                                                    </button>
                                                ))}
                                            </div>
                                            {selectedVisibleCase && (
                                                <div className="p-3 border border-white/10 rounded bg-white/3 text-slate-200 space-y-1">
                                                    <div><span className="text-slate-400">Input:</span> {selectedVisibleCase.input}</div>
                                                    <div><span className="text-slate-400">Expected Output:</span> {selectedVisibleCase.output}</div>
                                                    {selectedVisibleCase.explanation && <div><span className="text-slate-400">Explanation:</span> {selectedVisibleCase.explanation}</div>}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-slate-400">No visible test cases available.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    </section>
                </div>

                {showPrepAi && (
                    <aside className="w-[360px] min-w-[320px] max-w-[40vw] glass-panel rounded-lg overflow-hidden border border-white/10">
                        <PrepAiPanel
                            problem={problem}
                            code={code}
                            language={language}
                            selectedTestCase={selectedVisibleCase}
                            runCaseResults={runCaseResults}
                            onClose={() => setShowPrepAi(false)}
                        />
                    </aside>
                )}
            </main>
        </div>
    );
};

export default CodeEditorPage;



