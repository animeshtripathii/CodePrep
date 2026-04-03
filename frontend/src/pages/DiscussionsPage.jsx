import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import axiosClient from '../utils/axiosClient';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { updateUserTokens } from '../app/features/auth/authSlice';
import { showInsufficientTokensToast, isTokenIssueMessage } from '../utils/professionalAlerts';

const DiscussionsPage = () => {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();

    const [problems, setProblems] = useState([]);
    const [activeProblem, setActiveProblem] = useState(null);
    const [search, setSearch] = useState('');

    const [socket, setSocket] = useState(null);
    const [roomId, setRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);
    
    const [messageInput, setMessageInput] = useState('');
    const [askAI, setAskAI] = useState(false);
    
    const [accessDeniedMessage, setAccessDeniedMessage] = useState('');

    const chatContainerRef = useRef(null);
    const observerTarget = useRef(null);
    const isFetchingHistoryRef = useRef(false);

    const backendUrl = useMemo(
        () => import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`,
        []
    );

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        }, 100);
    }, []);

    // 3. Fetch History Logic
    const fetchHistory = useCallback(async (targetRoomId, lastMessageId) => {
        if (isFetchingHistoryRef.current) return;

        isFetchingHistoryRef.current = true;
        setIsFetchingHistory(true);

        try {
            const url = `/discussion/history/${targetRoomId}` + (lastMessageId ? `?lastMessageId=${lastMessageId}` : '');
            const res = await axiosClient.get(url);

            if (res.data.success) {
                setMessages((prev) => (lastMessageId ? [...res.data.messages, ...prev] : res.data.messages));
                setHasMore(res.data.hasMore);

                if (!lastMessageId) {
                    scrollToBottom();
                }
            }
        } catch (err) {
            console.error('Error fetching history', err);
        } finally {
            isFetchingHistoryRef.current = false;
            setIsFetchingHistory(false);
        }
    }, [scrollToBottom]);

    // 1. Fetch Problems for Left Sidebar
    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const res = await axiosClient.get('/problem/getAllProblem?limit=500');
                setProblems(res.data.problems || []);
                if (res.data.problems?.length > 0) {
                    setActiveProblem(res.data.problems[0]);
                }
            } catch (err) {
                console.error("Failed to load problems", err);
            }
        };
        fetchProblems();
    }, []);

    // 2. Setup Socket when activeProblem changes
    useEffect(() => {
        if (!activeProblem || !user) return;

        // Reset states
        setMessages([]);
        setAccessDeniedMessage('');
        setRoomId(null);
        setHasMore(false);

        const newSocket = io(backendUrl, {
            withCredentials: true,
            transports: ['websocket']
        });

        newSocket.on("connect", () => {
            newSocket.emit("join_problem_room", { problemId: activeProblem._id }, async (response) => {
                if (response.error) {
                    setAccessDeniedMessage(response.error);
                } else if (response.roomId) {
                    setRoomId(response.roomId);
                    await fetchHistory(response.roomId, null); // Initial history fetch
                }
            });
        });

        newSocket.on("newMessage", (msg) => {
            setMessages(prev => [...prev, msg]);
            scrollToBottom();
        });

        newSocket.on("connect_error", (err) => {
            console.error("Socket Auth Error:", err.message);
            setAccessDeniedMessage(err.message);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [activeProblem, user, backendUrl, fetchHistory, scrollToBottom]);

    const oldestMessageId = useMemo(() => messages[0]?._id, [messages]);

    // 4. Intersection Observer for Infinite Scroll Pagination
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && roomId && oldestMessageId && !isFetchingHistoryRef.current) {
                    const lastId = oldestMessageId;
                    fetchHistory(roomId, lastId);
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) observer.unobserve(observerTarget.current);
        };
    }, [hasMore, roomId, oldestMessageId, fetchHistory]);

    // 5. Send Message Handler
    const handleSendMessage = useCallback((e) => {
        e.preventDefault();
        const trimmedMessage = messageInput.trim();
        if (!trimmedMessage || !socket || !roomId) return;

        const tokenCost = askAI ? 5 : 0;
        if (tokenCost > 0 && user?.tokens < tokenCost) {
            showInsufficientTokensToast({ balance: user?.tokens, required: tokenCost });
            return;
        }

        const content = askAI ? `**@CodeBot** ${trimmedMessage}` : trimmedMessage;

        socket.emit("sendMessage", { roomId, content }, (response) => {
            if (response.error) {
                if (isTokenIssueMessage(response.error)) {
                    showInsufficientTokensToast({ balance: user?.tokens, required: tokenCost || 5 });
                } else {
                    toast.error(response.error);
                }
            } else if (response.success) {
                setMessageInput('');
                if (response.tokensRemaining !== undefined) {
                    dispatch(updateUserTokens(response.tokensRemaining));
                }
            }
        });
    }, [askAI, dispatch, messageInput, roomId, socket, user?.tokens]);

    const filteredProblems = useMemo(
        () => problems.filter((p) => p.title.toLowerCase().includes(search.toLowerCase())),
        [problems, search]
    );

    return (
        <div className="flex flex-col h-[calc(100vh-61px)] bg-[#050914] font-sans relative overflow-hidden">
            <style>{`
                .discussion-scroll-hide::-webkit-scrollbar { display: none; }
                .discussion-scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            {/* Background Layers */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
            
            <div className="flex flex-1 min-h-0 overflow-hidden relative z-10 p-4 gap-4 items-stretch">
                {/* L E F T   S I D E B A R */}
                <div className="w-88 h-full bg-white/5 rounded-2xl overflow-hidden hidden md:flex md:flex-col backdrop-blur-xl border border-white/10 shadow-2xl shrink-0">
                    <div className="p-5 border-b border-white/10 bg-white/5">
                        <h2 className="text-xl font-bold text-white font-display drop-shadow-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-400">forum</span>
                            Discussions
                        </h2>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px] group-focus-within:text-indigo-400 transition-colors">search</span>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Filter by tags..."
                                className="w-full bg-white/5 border border-white/10 text-sm rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all shadow-inner placeholder:text-slate-600 font-medium"
                            />
                        </div>
                    </div>
                    <div className="discussion-scroll-hide flex-1 min-h-0 overflow-y-auto bg-white/3">
                        {filteredProblems.map(p => (
                            <div 
                                key={p._id}
                                onClick={() => setActiveProblem(p)}
                                className={`p-4 border-b border-white/5 cursor-pointer transition-all duration-300 ${activeProblem?._id === p._id ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500 shadow-[inset_0_0_20px_rgba(99,102,241,0.08)]' : 'hover:bg-white/5 border-l-4 border-l-transparent'}`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <h3 className={`font-bold text-sm truncate pr-2 ${activeProblem?._id === p._id ? 'text-indigo-300 drop-shadow-sm' : 'text-slate-300'}`}>{p.title}</h3>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded shrink-0 border shadow-sm ${p.difficulty==='easy'?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20':p.difficulty==='medium'?'bg-amber-500/10 text-amber-400 border-amber-500/20':'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                        {p.difficulty}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-1 font-medium">{p.tags?.join(', ')}</p>
                            </div>
                        ))}


                    </div>
                </div>

                {/* C E N T E R   C H A T   A R E A */}
                <div className="flex-1 min-h-0 h-full flex flex-col bg-white/5 rounded-2xl relative overflow-hidden border border-white/10 shadow-2xl backdrop-blur-xl">
                    {activeProblem ? (
                        <div className="flex flex-col h-full min-h-0 pl-0">
                            <div className="bg-white/6 border-b border-white/10 p-5 flex items-center justify-between shrink-0 backdrop-blur-md">
                                <div>
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2 drop-shadow-sm tracking-wide">
                                        <span className="text-indigo-500 font-extrabold text-xl">#</span> {activeProblem.title}
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2 font-medium">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                        <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">Connected to room {roomId?.slice(0,6)}...</span>
                                    </p>
                                </div>
                            </div>

                            {accessDeniedMessage ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/4">
                                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(244,63,94,0.1)] backdrop-blur-md">
                                        <span className="material-symbols-outlined text-4xl">lock</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-200 mb-3 tracking-tight">Access Denied</h3>
                                    <p className="text-slate-400 max-w-md font-medium">{accessDeniedMessage}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col flex-1 min-h-0"> 
                                    {/* Chat Messages */}
                                    <div className="discussion-scroll-hide flex-1 overflow-y-auto p-6 space-y-6 bg-white/3" ref={chatContainerRef}>
                                        {/* Top Loader Target */}
                                        <div ref={observerTarget} className="h-4 flex items-center justify-center">
                                            {isFetchingHistory && <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent flex rounded-full animate-spin"></span>}
                                        </div>

                                        {messages.length === 0 && !isFetchingHistory && (
                                            <div className="flex flex-col items-center justify-center h-full text-center">
                                                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                                    <span className="material-symbols-outlined text-4xl text-slate-500">chat</span>
                                                </div>
                                                <p className="text-slate-300 font-bold text-lg mb-1">No messages yet</p>
                                                <p className="text-slate-500 text-sm font-medium">Be the first to start the discussion!</p>
                                            </div>
                                        )}

                                        {messages.map((msg, index) => {
                                            const isAi = msg.content.includes("**@CodeBot**");
                                            const isMe = msg.senderId?._id === user?._id;

                                            return (
                                                <div key={msg._id || index} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <div className="w-10 h-10 rounded-xl shrink-0 bg-white/8 overflow-hidden border border-white/10 shadow-lg backdrop-blur-md">
                                                        {msg.senderId?.avatar ? (
                                                            <img src={msg.senderId.avatar} alt="avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className={`w-full h-full flex items-center justify-center text-white font-bold text-sm ${isAi ? 'bg-gradient-to-br from-indigo-500 to-blue-600' : isMe ? 'bg-gradient-to-br from-blue-500 to-indigo-500' : 'bg-gradient-to-br from-slate-600 to-slate-800'}`}>
                                                                {isAi ? <span className="material-symbols-outlined text-[20px]">smart_toy</span> : msg.senderId?.firstName?.[0]?.toUpperCase() || '?'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`max-w-[75%] rounded-2xl px-5 py-4 shadow-md backdrop-blur-sm ${isMe ? 'bg-gradient-to-br from-indigo-500/20 to-blue-500/20 text-slate-200 border border-indigo-500/30 rounded-tr-[4px]' : isAi ? 'bg-indigo-500/10 border border-indigo-500/30 text-slate-200 rounded-tl-[4px] shadow-[inset_0_0_20px_rgba(99,102,241,0.08)]' : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-[4px]'}`}>
                                                        {!isMe && (
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className={`text-xs font-bold tracking-wide uppercase ${isAi ? 'text-indigo-400 drop-shadow-sm' : 'text-slate-400'}`}>
                                                                    {isAi ? 'CodeBot' : msg.senderId?.firstName}
                                                                </span>
                                                                <span className="text-[10px] text-slate-500 font-medium">
                                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="text-sm leading-relaxed 
                                                                        prose prose-invert prose-sm max-w-none
                                                                        prose-p:m-0 prose-p:mb-2 last:prose-p:mb-0
                                                                        prose-a:text-blue-400
                                                                        prose-strong:text-white
                                                                        prose-code:text-emerald-300 prose-code:bg-white/8 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-white/10
                                                                        prose-pre:bg-white/6 prose-pre:text-slate-300 prose-pre:border prose-pre:border-white/10 prose-pre:shadow-inner">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {msg.content}
                                                            </ReactMarkdown>
                                                        </div>
                                                        {isMe && (
                                                            <div className="flex justify-end mt-2 opacity-50">
                                                                <span className="material-symbols-outlined text-[14px]">done_all</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Input Bar */}
                                    <div className="p-5 bg-white/5 border-t border-white/10 shrink-0 backdrop-blur-xl">
                                        <form onSubmit={handleSendMessage} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-inner backdrop-blur-md focus-within:border-indigo-500/50 transition-colors">
                                            <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between bg-white/4">
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={askAI} 
                                                        onChange={e => setAskAI(e.target.checked)}
                                                        className="rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                                                    />
                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1.5 transition-colors drop-shadow-sm">
                                                        <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                                                        Ask CodeBot
                                                    </span>
                                                </label>
                                            </div>
                                            <div className="flex items-end gap-3 p-3">
                                                <textarea
                                                    value={messageInput}
                                                    onChange={e => setMessageInput(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendMessage(e);
                                                        }
                                                    }}
                                                    placeholder={askAI ? "Ask the AI a question about this problem..." : "Type your doubt or code here..."}
                                                    className="flex-1 appearance-none bg-transparent !border-0 !outline-none !ring-0 focus:!outline-none focus:!ring-0 focus:!border-0 shadow-none text-sm text-slate-200 placeholder:text-slate-500 p-2 max-h-32 resize-none font-medium custom-scrollbar"
                                                    style={{ boxShadow: 'none' }}
                                                    rows={1}
                                                />
                                                <button 
                                                    type="submit"
                                                    disabled={!messageInput.trim()}
                                                    className="bg-indigo-600/80 hover:bg-indigo-600 disabled:bg-white/5 disabled:text-slate-500 disabled:border-white/5 disabled:shadow-none text-white border border-indigo-500/50 font-bold text-sm px-5 py-2.5 mb-1 rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                                                >
                                                    <span className="drop-shadow-sm">Send</span>
                                                    <span className="material-symbols-outlined text-[18px] drop-shadow-sm">send</span>
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white/4">
                            <span className="material-symbols-outlined text-6xl text-slate-600 mb-4 opacity-50">forum</span>
                            <span className="font-medium text-lg text-slate-300">Select a problem to join discussions</span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default DiscussionsPage;
