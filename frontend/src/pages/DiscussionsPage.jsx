import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import axiosClient from '../utils/axiosClient';
import getBackendUrl from '../utils/backendUrl';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { updateUserTokens } from '../app/features/auth/authSlice';
import Navbar from '../components/Navbar';

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

    // Helper to read JWT from browser cookie
    const getTokenFromCookie = () => {
        const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
        return match ? decodeURIComponent(match[1]) : null;
    };

    // 2. Setup Socket when activeProblem changes
    useEffect(() => {
        if (!activeProblem || !user) return;

        // Reset states
        setMessages([]);
        setAccessDeniedMessage('');
        setRoomId(null);
        setHasMore(false);

        const jwtToken = user?.token || getTokenFromCookie();
        if (!jwtToken) {
            setAccessDeniedMessage("No auth token found. Please log in again.");
            return;
        }

        const backendUrl = getBackendUrl();
        const newSocket = io(backendUrl, {
            auth: { token: jwtToken },
            withCredentials: true,
            transports: ['websocket']
        });

        newSocket.on("connect", () => {
            console.log("Socket connected!");
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
    }, [activeProblem, user]);

    // 3. Fetch History Logic
    const fetchHistory = async (targetRoomId, lastMessageId) => {
        if (isFetchingHistory) return;
        setIsFetchingHistory(true);

        try {
            const url = `/discussion/history/${targetRoomId}` + (lastMessageId ? `?lastMessageId=${lastMessageId}` : '');
            const res = await axiosClient.get(url);
            
            if (res.data.success) {
                setMessages(prev => lastMessageId ? [...res.data.messages, ...prev] : res.data.messages);
                setHasMore(res.data.hasMore);
                
                if (!lastMessageId) {
                    scrollToBottom();
                }
            }
        } catch (err) {
            console.error("Error fetching history", err);
        } finally {
            setIsFetchingHistory(false);
        }
    };

    // 4. Intersection Observer for Infinite Scroll Pagination
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && roomId && messages.length > 0 && !isFetchingHistory) {
                    const lastId = messages[0]._id;
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
    }, [hasMore, roomId, messages, isFetchingHistory]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        }, 100);
    };

    // 5. Send Message Handler
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !socket || !roomId) return;

        if (user.tokens < 2) {
            toast.error("Insufficient tokens. You need 2 tokens to send a message.");
            return;
        }

        const content = askAI ? `**@CodeBot** ${messageInput}` : messageInput;

        socket.emit("sendMessage", { roomId, content }, (response) => {
            if (response.error) {
                toast.error(response.error);
            } else if (response.success) {
                setMessageInput('');
                if (response.tokensRemaining !== undefined) {
                    dispatch(updateUserTokens(response.tokensRemaining));
                }
            }
        });
    };

    const filteredProblems = problems.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col h-screen font-sans" style={{ background: '#000000', color: '#F3F3F5' }}>
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                {/* LEFT SIDEBAR */}
                <div className="w-72 flex flex-col overflow-hidden hidden md:flex" style={{ background: '#0C0C0D', borderRight: '1px solid #1a1a1e' }}>
                    <div className="p-4" style={{ borderBottom: '1px solid #1a1a1e' }}>
                        <h2 className="text-base font-bold text-white mb-3">Discussions</h2>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#4a4a52' }}>search</span>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search problems..."
                                className="rc-input pl-9 text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto hide-scrollbar">
                        {filteredProblems.map(p => (
                            <div
                                key={p._id}
                                onClick={() => setActiveProblem(p)}
                                className="p-3 cursor-pointer transition-all"
                                style={{
                                    borderBottom: '1px solid #111112',
                                    background: activeProblem?._id === p._id ? 'rgba(255,79,0,0.06)' : 'transparent',
                                    borderLeft: activeProblem?._id === p._id ? '2px solid #FF4F00' : '2px solid transparent'
                                }}
                                onMouseEnter={e => { if (activeProblem?._id !== p._id) e.currentTarget.style.background = '#111112'; }}
                                onMouseLeave={e => { if (activeProblem?._id !== p._id) e.currentTarget.style.background = 'transparent'; }}>
                                <div className="flex items-center justify-between mb-0.5">
                                    <h3 className="font-semibold text-sm truncate max-w-[160px]" style={{ color: activeProblem?._id === p._id ? '#FF4F00' : '#F3F3F5' }}>{p.title}</h3>
                                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${p.difficulty==='easy'?'badge-easy':p.difficulty==='medium'?'badge-medium':'badge-hard'}`}>{p.difficulty}</span>
                                </div>
                                <p className="text-[11px] line-clamp-1" style={{ color: '#4a4a52' }}>{p.tags?.join(', ')}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CENTER CHAT AREA */}
                <div className="flex-1 flex flex-col relative" style={{ background: '#000000' }}>
                    {activeProblem ? (
                        <>
                            <div className="px-5 py-3 flex items-center justify-between z-10" style={{ background: '#0C0C0D', borderBottom: '1px solid #1a1a1e' }}>
                                <div>
                                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                        <span style={{ color: '#FF4F00' }}>#</span> {activeProblem.title}
                                    </h2>
                                    <p className="text-[11px] mt-0.5 flex items-center gap-1.5" style={{ color: '#4a4a52' }}>
                                        <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                                        {roomId ? `Room: ${roomId}` : 'Connecting...'}
                                    </p>
                                </div>
                            </div>

                            {accessDeniedMessage ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                    <div className="size-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                        <span className="material-symbols-outlined text-3xl">lock</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Access Denied</h3>
                                    <p style={{ color: '#8A8B91' }}>{accessDeniedMessage}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar" ref={chatContainerRef}>
                                        <div ref={observerTarget} className="h-4 flex items-center justify-center">
                                            {isFetchingHistory && <span className="size-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FF4F00', borderTopColor: 'transparent' }} />}
                                        </div>

                                        {messages.length === 0 && !isFetchingHistory && (
                                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                                <span className="material-symbols-outlined text-5xl mb-3" style={{ color: '#1a1a1e' }}>chat_bubble_outline</span>
                                                <p className="text-sm font-medium" style={{ color: '#4a4a52' }}>No messages yet</p>
                                                <p className="text-xs mt-1" style={{ color: '#333338' }}>Be the first to start the discussion!</p>
                                            </div>
                                        )}

                                        {messages.map((msg, index) => {
                                            const isAi = msg.content.includes("**@CodeBot**");
                                            const isMe = msg.senderId?._id === user?._id;
                                            return (
                                                <div key={msg._id || index} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <div className="size-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold"
                                                        style={isAi ? { background: 'rgba(255,79,0,0.15)', color: '#FF4F00' } : isMe ? { background: 'rgba(59,130,246,0.15)', color: '#3b82f6' } : { background: '#1C1C1F', color: '#8A8B91' }}>
                                                        {isAi ? 'AI' : msg.senderId?.firstName?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                                                        style={isMe
                                                            ? { background: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.15)', borderTopRightRadius: '4px' }
                                                            : isAi
                                                            ? { background: 'rgba(255,79,0,0.06)', color: '#F3F3F5', border: '1px solid rgba(255,79,0,0.15)', borderTopLeftRadius: '4px' }
                                                            : { background: '#1C1C1F', color: '#F3F3F5', borderTopLeftRadius: '4px' }}>
                                                        {!isMe && (
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[11px] font-bold" style={{ color: isAi ? '#FF4F00' : '#8A8B91' }}>
                                                                    {isAi ? '🤖 CodeBot' : msg.senderId?.firstName}
                                                                </span>
                                                                <span className="text-[10px]" style={{ color: '#333338' }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        )}
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Input Bar */}
                                    <div className="p-3" style={{ borderTop: '1px solid #1a1a1e', background: '#0C0C0D' }}>
                                        <form onSubmit={handleSendMessage} className="rounded-xl overflow-hidden" style={{ background: '#111112', border: '1px solid #222225' }}>
                                            <div className="px-3 py-2 flex items-center" style={{ borderBottom: '1px solid #1a1a1e' }}>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={askAI} onChange={e => setAskAI(e.target.checked)} className="cursor-pointer" style={{ accentColor: '#FF4F00' }} />
                                                    <span className="text-xs font-bold flex items-center gap-1" style={{ color: askAI ? '#FF4F00' : '#8A8B91' }}>
                                                        <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                                                        Ask AI (2 tokens)
                                                    </span>
                                                </label>
                                            </div>
                                            <div className="flex items-end gap-2 p-2">
                                                <textarea
                                                    value={messageInput}
                                                    onChange={e => setMessageInput(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                                                    placeholder={askAI ? 'Ask AI about this problem...' : 'Share your thought or doubt...'}
                                                    className="flex-1 bg-transparent border-none focus:outline-none text-sm p-2 max-h-24 resize-none"
                                                    style={{ color: '#F3F3F5' }}
                                                    rows={2}
                                                />
                                                <button type="submit" disabled={!messageInput.trim()}
                                                    className="size-9 rounded-lg flex items-center justify-center shrink-0 mb-1 transition-all disabled:opacity-30"
                                                    style={{ background: '#FF4F00', color: 'white' }}>
                                                    <span className="material-symbols-outlined text-[18px]">send</span>
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50">
                            Select a problem from the left to join discussions.
                        </div>
                    )}
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="w-64 p-4 hidden lg:block overflow-y-auto hide-scrollbar" style={{ background: '#0C0C0D', borderLeft: '1px solid #1a1a1e' }}>
                    <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(255,79,0,0.06)', border: '1px solid rgba(255,79,0,0.15)' }}>
                        <h3 className="text-sm font-bold mb-1 flex items-center gap-1.5" style={{ color: '#FF4F00' }}>
                            <span className="material-symbols-outlined text-[16px]">smart_toy</span>Quick Prompts
                        </h3>
                        <p className="text-[10px] mb-3 uppercase tracking-wider" style={{ color: '#4a4a52' }}>Powered by CodeBot AI</p>
                        <div className="space-y-2">
                            {['What is the time complexity?', 'Explain the optimal approach', 'Give me a hint'].map(q => (
                                <button key={q} onClick={() => { setAskAI(true); setMessageInput(q); }}
                                    className="w-full text-left text-xs px-2.5 py-2 rounded-lg transition-all"
                                    style={{ background: '#111112', color: '#8A8B91', border: '1px solid #1a1a1e' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#F3F3F5'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#8A8B91'}>
                                    → {q}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#4a4a52' }}>Active now</h4>
                        <div className="space-y-3">
                            {['sarah_codes', 'dev_john'].map(name => (
                                <div key={name} className="flex items-center gap-2.5">
                                    <div className="size-7 rounded-full relative flex items-center justify-center text-[11px] font-bold" style={{ background: '#1C1C1F', color: '#8A8B91' }}>
                                        {name[0].toUpperCase()}
                                        <span className="absolute bottom-0 right-0 size-2 rounded-full bg-green-400" style={{ border: '1.5px solid #0C0C0D' }} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-white">{name}</p>
                                        <p className="text-[10px]" style={{ color: '#4a4a52' }}>Online</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiscussionsPage;
