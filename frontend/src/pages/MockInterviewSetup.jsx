import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import toast from 'react-hot-toast';

const LEVEL_TO_DIFFICULTY = {
    junior: 'easy',
    mid: 'medium',
    senior: 'hard',
    staff: 'hard'
};

const LEVEL_LABEL = {
    junior: 'Junior',
    mid: 'Mid-Level',
    senior: 'Senior',
    staff: 'Staff/Lead'
};

const MockInterviewSetup = () => {
    const navigate = useNavigate();
    const [cvFile, setCvFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [aiDuration, setAiDuration] = useState('45');
    const [peerDuration, setPeerDuration] = useState('60');
    const [aiLevel, setAiLevel] = useState('mid');
    const [peerLevel, setPeerLevel] = useState('mid');
    const [problems, setProblems] = useState([]);
    const [selectedProblemId, setSelectedProblemId] = useState('');
    const [isLoadingProblems, setIsLoadingProblems] = useState(true);
    const [interviewMode, setInterviewMode] = useState('ai');

    const fetchProblems = useCallback(async () => {
        try {
            const response = await axiosClient.get('/problem/getAllProblem?limit=100');
            if (response.data && response.data.problems) {
                setProblems(response.data.problems);
            }
        } catch (err) {
            console.error('Error fetching problems:', err);
            toast.error('Failed to load problem list.');
        } finally {
            setIsLoadingProblems(false);
        }
    }, []);

    useEffect(() => {
        fetchProblems();
    }, [fetchProblems]);

    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            setCvFile(file);
        }
    }, []);

    const getProblemIdForInterview = useCallback(async (mode, activeLevel) => {
        if (mode === 'peer') return selectedProblemId;

        const derivedDifficulty = LEVEL_TO_DIFFICULTY[activeLevel] || 'medium';
        let filtered = problems.filter((p) => p.difficulty && p.difficulty.toLowerCase() === derivedDifficulty);
        if (filtered.length === 0) filtered = problems;

        if (filtered.length > 0) {
            const randomP = filtered[Math.floor(Math.random() * filtered.length)];
            return randomP._id;
        }

        const randomRes = await axiosClient.get('/problem/getRandomProblem');
        if (randomRes.data && randomRes.data.problemId) {
            return randomRes.data.problemId;
        }

        return null;
    }, [problems, selectedProblemId]);

    const handleStartInterview = useCallback(async (modeOverride) => {
        const mode = modeOverride || interviewMode;

        if (mode === 'ai' && !cvFile) {
            toast.error('Please upload your CV before starting the AI mock interview.');
            return;
        }
        if (mode === 'peer' && !selectedProblemId) {
            toast.error('Please select a problem for Peer-to-Peer interview.');
            return;
        }

        const activeLevel = mode === 'ai' ? aiLevel : peerLevel;
        const selectedDuration = parseInt(mode === 'ai' ? aiDuration : peerDuration, 10);

        let finalProblemId;
        try {
            finalProblemId = await getProblemIdForInterview(mode, activeLevel);
        } catch (err) {
            console.error('Fallback random problem fetch failed:', err);
            toast.error('No problems available to start an interview.');
            return;
        }

        if (!finalProblemId) {
            toast.error('No problems available in the database.');
            return;
        }

        if (mode === 'ai') {
            setIsUploading(true);
            const toastId = toast.loading('Reading CV structure and starting interview...');

            try {
                const formData = new FormData();
                formData.append('cvFile', cvFile);

                const response = await axiosClient.post('/interview/upload-cv', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.data && response.data.text) {
                    if (response.data.remainingAttempts !== null && response.data.remainingAttempts !== undefined) {
                        toast.success(`CV processed. AI interviews left: ${response.data.remainingAttempts}`, { id: toastId });
                    } else {
                        toast.success('CV Processed! Entering Interview Room...', { id: toastId });
                    }
                    navigate(`/mock-interview/${finalProblemId}?mode=ai`, {
                        state: { 
                            cvText: response.data.text, 
                            cvFileName: cvFile.name, 
                            duration: selectedDuration,
                            role: `${LEVEL_LABEL[aiLevel] || 'Mid-Level'} Software Engineer`
                        }
                    });
                } else {
                    throw new Error('Failed to extract text');
                }

            } catch (error) {
                console.error('Upload Error:', error);
                toast.error(error.response?.data?.message || 'Failed to analyze CV file.', { id: toastId });
                setIsUploading(false);
            }
        } else {
            navigate(`/mock-interview/${finalProblemId}?mode=peer`, {
                state: { duration: selectedDuration }
            });
        }
    }, [
        interviewMode,
        cvFile,
        selectedProblemId,
        aiLevel,
        peerLevel,
        aiDuration,
        peerDuration,
        navigate,
        getProblemIdForInterview,
    ]);

    return (
        <div className="mock-setup-page flex flex-col min-h-[calc(100vh-61px)] text-slate-200 font-display relative overflow-hidden">
            <style>{`
                .mock-setup-page {
                    background:
                        radial-gradient(120% 120% at 0% 0%, rgba(14, 165, 233, 0.16) 0%, rgba(14, 165, 233, 0) 48%),
                        radial-gradient(120% 120% at 100% 100%, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 50%),
                        #02040a;
                }
                .mock-orb-1 {
                    position: absolute;
                    left: -220px;
                    top: -220px;
                    width: 760px;
                    height: 760px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(14, 165, 233, 0.65) 0%, rgba(14, 165, 233, 0) 70%);
                    filter: blur(120px);
                    opacity: 0.26;
                    pointer-events: none;
                    animation: mockLiquid 20s ease-in-out infinite alternate;
                }
                .mock-orb-2 {
                    position: absolute;
                    right: -150px;
                    bottom: -150px;
                    width: 620px;
                    height: 620px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.62) 0%, rgba(99, 102, 241, 0) 70%);
                    filter: blur(120px);
                    opacity: 0.26;
                    pointer-events: none;
                    animation: mockLiquid 26s ease-in-out infinite alternate-reverse;
                }
                .mock-glass {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .mock-chip {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .mock-chip:hover {
                    border-color: rgba(129, 140, 248, 0.5);
                    background: rgba(99, 102, 241, 0.14);
                }
                .mock-chip-active {
                    background: linear-gradient(135deg, rgba(129, 140, 248, 0.38), rgba(99, 102, 241, 0.55));
                    border: 1px solid rgba(165, 180, 252, 0.65);
                    color: #eef2ff;
                    box-shadow: 0 0 18px rgba(99, 102, 241, 0.33);
                }
                @keyframes mockLiquid {
                    0% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(40px, -55px) scale(1.08); }
                    100% { transform: translate(-45px, 45px) scale(0.92); }
                }
            `}</style>

            <div className="mock-orb-1"></div>
            <div className="mock-orb-2"></div>
            
            
            <main className="flex-1 flex items-start justify-center px-4 sm:px-6 py-8 relative z-10 overflow-y-auto">
                <div className="w-full max-w-6xl space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">Configure Your Session</h1>
                        <p className="text-slate-400 text-sm max-w-2xl">Choose your interview format and tailor the experience to your level. Our AI or peer network is ready to help you level up.</p>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <section
                            onClick={() => setInterviewMode('ai')}
                            className={`mock-glass rounded-2xl p-5 transition-all cursor-pointer ${interviewMode === 'ai' ? 'ring-1 ring-indigo-400/60 shadow-[0_0_26px_rgba(99,102,241,0.22)]' : 'hover:border-indigo-400/40'}`}
                        >
                            <div className="flex items-start justify-between gap-3 mb-5">
                                <div className="space-y-2">
                                    <div className="inline-flex items-center justify-center size-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                                        <span className="material-symbols-outlined text-[20px]">psychology</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">AI Mock Interview</h2>
                                    <p className="text-xs text-slate-400">Face our advanced AI tailored to your profile with dynamic follow-ups and real-time feedback.</p>
                                </div>
                                <span className="text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border border-indigo-300/30 text-indigo-200 bg-indigo-500/15">Recommended</span>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Select Duration</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['30', '45', '60', '90'].map((item) => (
                                            <button
                                                key={`ai-d-${item}`}
                                                type="button"
                                                onClick={() => setAiDuration(item)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${aiDuration === item ? 'mock-chip-active' : 'mock-chip text-slate-300'}`}
                                            >
                                                {item}m
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Select Level</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['junior', 'mid', 'senior', 'staff'].map((item) => (
                                            <button
                                                key={`ai-l-${item}`}
                                                type="button"
                                                onClick={() => setAiLevel(item)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${aiLevel === item ? 'mock-chip-active' : 'mock-chip text-slate-300'}`}
                                            >
                                                {LEVEL_LABEL[item]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-xs text-slate-300 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px] text-indigo-300">info</span>
                                    AI will select a random problem tuned to your selected level.
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleStartInterview('ai')}
                                    disabled={isUploading}
                                    className={`w-full py-3 rounded-xl border text-sm font-bold tracking-[0.14em] uppercase transition-all ${
                                        isUploading
                                            ? 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed'
                                            : !cvFile
                                                ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                                : 'bg-indigo-500/30 border-indigo-300/40 text-indigo-100 hover:bg-indigo-500/45'
                                    }`}
                                >
                                    {isUploading ? 'Preparing...' : 'Start AI Session'}
                                </button>
                            </div>
                        </section>

                        <section
                            onClick={() => setInterviewMode('peer')}
                            className={`mock-glass rounded-2xl p-5 transition-all cursor-pointer ${interviewMode === 'peer' ? 'ring-1 ring-indigo-400/60 shadow-[0_0_26px_rgba(99,102,241,0.22)]' : 'hover:border-indigo-400/40'}`}
                        >
                            <div className="space-y-2 mb-5">
                                <div className="inline-flex items-center justify-center size-10 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-200">
                                    <span className="material-symbols-outlined text-[20px]">groups</span>
                                </div>
                                <h2 className="text-2xl font-bold text-white">Peer-to-Peer</h2>
                                <p className="text-xs text-slate-400">Collaborate and solve problems with fellow engineers in a realistic interview setup.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Select Duration</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['30', '45', '60', '90'].map((item) => (
                                            <button
                                                key={`peer-d-${item}`}
                                                type="button"
                                                onClick={() => setPeerDuration(item)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${peerDuration === item ? 'mock-chip-active' : 'mock-chip text-slate-300'}`}
                                            >
                                                {item}m
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Select Level</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['junior', 'mid', 'senior', 'staff'].map((item) => (
                                            <button
                                                key={`peer-l-${item}`}
                                                type="button"
                                                onClick={() => setPeerLevel(item)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${peerLevel === item ? 'mock-chip-active' : 'mock-chip text-slate-300'}`}
                                            >
                                                {LEVEL_LABEL[item]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Select Problem</p>
                                    <select
                                        className="w-full bg-black/45 border border-white/10 text-slate-200 text-sm rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 shadow-inner transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        value={selectedProblemId}
                                        onChange={(e) => setSelectedProblemId(e.target.value)}
                                        disabled={isLoadingProblems}
                                    >
                                        <option value="" className="bg-slate-800">Select a problem</option>
                                        {problems.map((p) => (
                                            <option key={p._id} value={p._id} className="bg-slate-800">
                                                {p.title} ({p.difficulty || 'N/A'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleStartInterview('peer')}
                                    className="w-full py-3 rounded-xl border border-white/15 text-sm font-bold tracking-[0.14em] uppercase transition-all bg-white/5 text-slate-200 hover:bg-indigo-500/20 hover:border-indigo-300/45"
                                >
                                    Find Peer Match
                                </button>
                            </div>
                        </section>
                    </div>

                    <section className="mock-glass rounded-2xl p-6 sm:p-8">
                        <div className={`border border-dashed rounded-2xl px-5 py-10 text-center transition-all ${cvFile ? 'border-sky-400/45 bg-sky-500/5' : 'border-white/15 bg-white/2'}`}>
                            <input
                                type="file"
                                id="cv-upload"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="cv-upload" className="cursor-pointer flex flex-col items-center gap-3">
                                <span className={`size-11 rounded-full border flex items-center justify-center ${cvFile ? 'border-sky-300/45 bg-sky-500/15 text-sky-300' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                                    <span className="material-symbols-outlined">upload</span>
                                </span>
                                <h3 className="text-2xl font-bold text-white">Upload CV / Resume</h3>
                                <p className="text-sm text-slate-400 max-w-lg">
                                    Drag and drop your resume here, or browse files. AI mode uses your resume to personalize interview questions.
                                </p>
                                <p className="text-xs tracking-[0.2em] text-slate-500 uppercase">PDF . DOCX . DOC . TXT</p>
                                {cvFile && <p className="text-sm font-semibold text-sky-300">Selected: {cvFile.name}</p>}
                            </label>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
};

export default MockInterviewSetup;
