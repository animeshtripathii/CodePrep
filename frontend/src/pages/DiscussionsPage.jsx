import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import axiosClient from '../utils/axiosClient';
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

    // 2. Setup Socket when activeProblem changes
    useEffect(() => {
        if (!activeProblem || !user) return;

        // Reset states
        setMessages([]);
        setAccessDeniedMessage('');
        setRoomId(null);
        setHasMore(false);

        const backendUrl = import.meta.env.VITE_API_URL || "https://codeprep-1kzd.onrender.com";
        const newSocket = io(backendUrl, {
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
        <div className="flex flex-col h-screen bg-slate-50 font-sans">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                {/* L E F T   S I D E B A R */}
                <div className="w-80 bg-white border-r border-slate-200 flex flex-col overflow-hidden hidden md:flex">
                    <div className="p-4 border-b border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900 font-['Space_Grotesk']">Discussions</h2>
                        <div className="flex bg-slate-100 p-1 rounded-lg mt-4 mb-3">
                            <button className="flex-1 bg-white text-slate-800 text-xs font-bold py-1.5 rounded shadow-sm">Trending</button>
                            <button className="flex-1 text-slate-500 hover:text-slate-700 text-xs font-bold py-1.5 rounded transition-colors">My Doubts</button>
                        </div>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Filter by tags..."
                                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-md py-2 pl-9 pr-3 text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredProblems.map(p => (
                            <div 
                                key={p._id}
                                onClick={() => setActiveProblem(p)}
                                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${activeProblem?._id === p._id ? 'bg-green-50 border-l-4 border-l-green-500' : 'hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className={`font-bold text-sm ${activeProblem?._id === p._id ? 'text-green-800' : 'text-slate-800'}`}>{p.title}</h3>
                                    <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded ${p.difficulty==='easy'?'bg-green-100 text-green-700':p.difficulty==='medium'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>
                                        {p.difficulty}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-1">{p.tags?.join(', ')}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* C E N T E R   C H A T   A R E A */}
                <div className="flex-1 flex flex-col bg-slate-50 relative">
                    {activeProblem ? (
                        <>
                            <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm z-10">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <span className="text-green-600">#</span> {activeProblem.title}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                        <span>Joined {roomId}</span>
                                    </p>
                                </div>
                            </div>

                            {accessDeniedMessage ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                                    <div className="bg-red-50 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-3xl">lock</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h3>
                                    <p className="text-slate-600">{accessDeniedMessage}</p>
                                </div>
                            ) : (
                                <>
                                    {/* Chat Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={chatContainerRef}>
                                        {/* Top Loader Target */}
                                        <div ref={observerTarget} className="h-4 flex items-center justify-center">
                                            {isFetchingHistory && <span className="w-5 h-5 border-2 border-green-500 border-t-transparent flex rounded-full animate-spin"></span>}
                                        </div>

                                        {messages.length === 0 && !isFetchingHistory && (
                                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                                <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">chat_bubble_outline</span>
                                                <p className="text-slate-500 font-medium text-sm">No messages yet</p>
                                                <p className="text-slate-400 text-xs mt-1">Be the first to start the discussion!</p>
                                            </div>
                                        )}

                                        {messages.map((msg, index) => {
                                            const isAi = msg.content.includes("**@CodeBot**");
                                            const isMe = msg.senderId?._id === user?._id;

                                            return (
                                                <div key={msg._id || index} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <div className="w-8 h-8 rounded-full flex-shrink-0 bg-slate-200 overflow-hidden border border-slate-300">
                                                        {msg.senderId?.avatar ? (
                                                            <img src={msg.senderId.avatar} alt="avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className={`w-full h-full flex items-center justify-center text-white font-bold text-xs ${isAi ? 'bg-green-600' : isMe ? 'bg-blue-600' : 'bg-slate-600'}`}>
                                                                {isAi ? 'AI' : msg.senderId?.firstName?.[0]?.toUpperCase() || '?'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : isAi ? 'bg-green-50 border border-green-200 text-slate-800 rounded-tl-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                                                        {!isMe && (
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-xs font-bold ${isAi ? 'text-green-700' : 'text-slate-700'}`}>
                                                                    {isAi ? 'CodeBot' : msg.senderId?.firstName}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="text-sm leading-relaxed [&_pre]:bg-slate-800 [&_pre]:text-green-300 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:my-2 [&_pre]:overflow-x-auto [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs [&_code]:text-red-600">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {msg.content}
                                                            </ReactMarkdown>
                                                        </div>
                                                        {isMe && (
                                                            <div className="flex justify-end mt-1 opacity-70">
                                                                <span className="material-symbols-outlined text-[14px]">done_all</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Input Bar */}
                                    <div className="p-4 bg-white border-t border-slate-200">
                                        <form onSubmit={handleSendMessage} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                            <div className="p-2 border-b border-slate-200 flex items-center justify-between bg-white">
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={askAI} 
                                                        onChange={e => setAskAI(e.target.checked)}
                                                        className="rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                                    />
                                                    <span className="text-xs font-bold text-green-700 group-hover:text-green-800 flex items-center gap-1 transition-colors">
                                                        <span className="material-symbols-outlined text-[16px]">robot_2</span>
                                                        Ask AI
                                                    </span>
                                                </label>
                                            </div>
                                            <div className="flex items-end gap-2 p-2">
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
                                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-900 placeholder:text-slate-400 p-2 max-h-32 resize-none"
                                                    rows={2}
                                                />
                                                <button 
                                                    type="submit"
                                                    disabled={!messageInput.trim()}
                                                    className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-bold text-sm px-4 py-2 mb-1 rounded-lg transition-colors flex items-center gap-1"
                                                >
                                                    Send
                                                    <span className="material-symbols-outlined text-[16px]">send</span>
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

                {/* R I G H T   S I D E B A R */}
                <div className="w-72 bg-white border-l border-slate-200 p-5 hidden lg:block overflow-y-auto">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                        <h3 className="font-bold text-green-800 text-sm flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-[18px]">robot_2</span>
                            Quick Assist
                        </h3>
                        <p className="text-[10px] text-green-600 font-bold mb-3 uppercase tracking-wider">Powered by CodeBot AI</p>
                        <div className="space-y-2">
                            <div className="bg-white border border-green-100 text-xs text-slate-700 p-2 rounded cursor-pointer hover:border-green-300 transition-colors" onClick={() => setMessageInput("What is the time complexity?")}>
                                "What is the time complexity?"
                            </div>
                            <div className="bg-white border border-green-100 text-xs text-slate-700 p-2 rounded cursor-pointer hover:border-green-300 transition-colors" onClick={() => setMessageInput("Can you explain the optimal approach?")}>
                                "Can you explain the optimal approach?"
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Active on this problem</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 relative">
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 leading-tight">sarah_codes</p>
                                    <p className="text-[10px] text-slate-500">Writing code...</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 relative">
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 leading-tight">dev_john</p>
                                    <p className="text-[10px] text-slate-500">Reading description</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiscussionsPage;
