<<<<<<< HEAD
import React, { useState, useRef, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

const FloatingChatbot = () => {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState([{
        role: 'assistant',
        text: "Hi! I'm **CodePrep AI**. Ask me anything about problems, algorithms, or interview tips! 🚀"
    }]);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isTyping, isOpen]);

    const handleSendMessage = async (text = input) => {
        if (!text.trim()) return;

        if (user && user.tokens < 20) {
            toast.error('You need at least 20 AI tokens! Please upgrade to continue.', { duration: 4000 });
            const upgradeMsg = "You have 0 AI tokens remaining.\n\n[Upgrade your plan](/plans) to continue using CodePrep AI.";
            setMessages(prev => [...prev, { role: 'user', text: text.trim() }, { role: 'assistant', text: upgradeMsg }]);
            setInput('');
            return;
        }

        const userText = text.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setIsTyping(true);

        try {
            const response = await axiosClient.post('/chat/website', { message: userText });
            setMessages(prev => [...prev, { role: 'assistant', text: response.data }]);
            if (user && user.tokens !== undefined) {
                dispatch({ type: 'auth/updateUserTokens', payload: Math.max(0, user.tokens - 20) });
            }
        } catch (error) {
            toast.error('Failed to get AI response');
        } finally {
            setIsTyping(false);
        }
    };

    const QUICK_PROMPTS = ['Explain Big O notation', 'Dynamic programming tips', 'How to solve Two Sum?'];

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">

            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[360px] sm:w-[400px] flex flex-col overflow-hidden rounded-2xl shadow-2xl"
                    style={{ height: '520px', background: '#0C0C0D', border: '1px solid #222225', animation: 'slide-up 0.2s ease' }}>

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 shrink-0"
                        style={{ background: '#111112', borderBottom: '1px solid #1a1a1e' }}>
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #FF4F00, #FF8C42)', boxShadow: '0 0 12px rgba(255,79,0,0.3)' }}>
                                <span className="material-symbols-outlined text-[18px] text-white">smart_toy</span>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white leading-none">CodePrep AI</div>
                                <div className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: '#10b981' }}>
                                    <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Online · {user?.tokens ?? 0} tokens
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)}
                            className="size-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                            style={{ color: '#8A8B91' }}>
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className="size-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold"
                                    style={msg.role === 'assistant'
                                        ? { background: 'rgba(255,79,0,0.15)', color: '#FF4F00', border: '1px solid rgba(255,79,0,0.2)' }
                                        : { background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                                    {msg.role === 'assistant' ? 'AI' : 'Me'}
                                </div>
                                <div className={`max-w-[82%] px-3 py-2.5 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                                    style={msg.role === 'user'
                                        ? { background: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.15)' }
                                        : { background: '#1C1C1F', color: '#F3F3F5' }}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-sm max-w-none"
                                            style={{ '--tw-prose-body': '#F3F3F5', '--tw-prose-headings': '#ffffff', '--tw-prose-code': '#FF8C42', '--tw-prose-pre-bg': '#111112' }}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap">{msg.text}</div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-2.5">
                                <div className="size-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold"
                                    style={{ background: 'rgba(255,79,0,0.15)', color: '#FF4F00', border: '1px solid rgba(255,79,0,0.2)' }}>AI</div>
                                <div className="px-4 py-3 rounded-xl rounded-tl-sm flex gap-1.5 items-center" style={{ background: '#1C1C1F' }}>
                                    <span className="typing-dot" style={{ color: '#FF4F00' }}>●</span>
                                    <span className="typing-dot" style={{ color: '#FF4F00' }}>●</span>
                                    <span className="typing-dot" style={{ color: '#FF4F00' }}>●</span>
                                </div>
                            </div>
                        )}

                        {/* Quick prompts */}
                        {messages.length === 1 && !isTyping && (
                            <div className="space-y-1.5 pt-1">
                                <p className="text-[10px] uppercase tracking-wider" style={{ color: '#4a4a52' }}>Quick prompts</p>
                                {QUICK_PROMPTS.map(p => (
                                    <button key={p} onClick={() => handleSendMessage(p)}
                                        className="w-full text-left text-xs px-3 py-2 rounded-lg transition-all"
                                        style={{ background: '#111112', color: '#8A8B91', border: '1px solid #1a1a1e' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,79,0,0.3)'; e.currentTarget.style.color = '#F3F3F5'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1e'; e.currentTarget.style.color = '#8A8B91'; }}>
                                        → {p}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-3 shrink-0" style={{ borderTop: '1px solid #1a1a1e' }}>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ask anything..."
                                className="rc-input flex-1 !py-2 text-sm"
                            />
                            <button onClick={() => handleSendMessage()}
                                disabled={isTyping || !input.trim()}
                                className="size-9 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: '#FF4F00', color: 'white' }}>
                                <span className="material-symbols-outlined text-[18px]">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button onClick={() => setIsOpen(!isOpen)}
                className="size-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110"
                style={isOpen
                    ? { background: '#111112', border: '1px solid #333338', color: '#8A8B91' }
                    : { background: 'linear-gradient(135deg, #FF4F00, #FF6028)', color: 'white', boxShadow: '0 0 30px rgba(255,79,0,0.4)' }}>
                <span className="material-symbols-outlined text-[24px]">{isOpen ? 'close' : 'chat'}</span>
            </button>
        </div>
    );
};

export default FloatingChatbot;
=======
import React, { useState, useRef, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-hot-toast';

import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

const FloatingChatbot = () => {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: "Hi! I'm CodePrep's platform assistant. How can I help you today?"
        }
    ]);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isTyping, isOpen]);

    const handleSendMessage = async (text = input) => {
        if (!text.trim()) return;

        if (user && user.tokens < 20) {
            toast.error('You need at least 20 AI tokens to chat! Please upgrade to continue.', {
                duration: 4000,
                icon: '🚀'
            });
            const upgradeMsg = "You have 0 AI tokens remaining.\n\n[Please upgrade your plan](/plans) to continue using CodePrep AI Support.";
            setMessages(prev => [...prev, { role: 'user', text: text.trim() }, { role: 'assistant', text: upgradeMsg }]);
            setInput('');
            return;
        }

        const userText = text.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setIsTyping(true);

        try {
            const response = await axiosClient.post('/chat/website', { message: userText });
            setMessages(prev => [...prev, { role: 'assistant', text: response.data }]);
            
            // Deduct locally for instant UI update
            if (user && user.tokens !== undefined) {
                 dispatch({ type: 'auth/updateUserTokens', payload: Math.max(0, user.tokens - 20) });
            }
        } catch (error) {
            console.error('Website Chat Error:', error);
            toast.error('Failed to get AI response');
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white border border-[#e7f3eb] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
                    {/* Header */}
                    <div className="bg-[#13ec5b] p-4 flex justify-between items-center shrink-0 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#0d1b12]">support_agent</span>
                            <h3 className="text-[#0d1b12] font-bold text-lg">CodePrep Support</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-[#0d1b12]/70 hover:text-[#0d1b12] transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#f8fcf9]">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                                    msg.role === 'user' 
                                    ? 'bg-slate-200 border-slate-300' 
                                    : 'bg-green-100 border-green-200'
                                }`}>
                                    <span className={`material-symbols-outlined text-[16px] ${
                                        msg.role === 'user' ? 'text-slate-500' : 'text-green-600'
                                    }`}>
                                        {msg.role === 'user' ? 'person' : 'smart_toy'}
                                    </span>
                                </div>
                                <div className={`p-3.5 text-sm rounded-2xl shadow-sm max-w-[85%] overflow-hidden ${
                                    msg.role === 'user' 
                                    ? 'bg-green-100 border border-green-200 text-green-900 rounded-tr-sm' 
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                                }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-slate prose-sm max-w-none text-slate-800 prose-p:text-slate-800 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200 prose-pre:p-3 prose-pre:rounded-lg">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.text}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap">{msg.text}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-green-600 text-[16px]">smart_toy</span>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 flex gap-1 items-center shadow-sm">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-[#e7f3eb] shrink-0">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ask a question..."
                                className="w-full bg-slate-50 text-[#0d1b12] placeholder-slate-400 text-sm rounded-full pl-4 pr-12 py-3 border border-slate-200 focus:outline-none focus:border-[#13ec5b] focus:ring-1 focus:ring-[#13ec5b] transition-all"
                            />
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={isTyping || !input.trim()}
                                className="absolute right-2 w-8 h-8 rounded-full bg-[#13ec5b] text-[#0d1b12] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0ecb4d] transition-colors shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[18px]">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 hover:scale-110 ${
                    isOpen ? 'bg-white border border-slate-200 rotate-90 text-slate-500' : 'bg-[#13ec5b] text-[#0d1b12]'
                }`}
            >
                <span className="material-symbols-outlined text-2xl">
                    {isOpen ? 'close' : 'chat'}
                </span>
            </button>
        </div>
    );
};

export default FloatingChatbot;
>>>>>>> 4c7510c4037886edc05d8b2d5844dc36ed14d532
