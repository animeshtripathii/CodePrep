import React, { useState, useRef, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-hot-toast';

<<<<<<< HEAD
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

const FloatingChatbot = () => {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
=======
const FloatingChatbot = () => {
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
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

<<<<<<< HEAD
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

=======
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
        const userText = text.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setIsTyping(true);

        try {
            const response = await axiosClient.post('/chat/website', { message: userText });
            setMessages(prev => [...prev, { role: 'assistant', text: response.data }]);
<<<<<<< HEAD
            
            // Deduct locally for instant UI update
            if (user && user.tokens !== undefined) {
                 dispatch({ type: 'auth/updateUserTokens', payload: Math.max(0, user.tokens - 20) });
            }
=======
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
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
<<<<<<< HEAD
                <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white border border-[#e7f3eb] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
                    {/* Header */}
                    <div className="bg-[#13ec5b] p-4 flex justify-between items-center shrink-0 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#0d1b12]">support_agent</span>
                            <h3 className="text-[#0d1b12] font-bold text-lg">CodePrep Support</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-[#0d1b12]/70 hover:text-[#0d1b12] transition-colors">
=======
                <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-[#111722] border border-[#2b3245] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
                    {/* Header */}
                    <div className="bg-[#135bec] p-4 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-white">support_agent</span>
                            <h3 className="text-white font-bold text-lg">CodePrep Support</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Messages Area */}
<<<<<<< HEAD
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
=======
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#101622]">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#2b3245]' : 'bg-gradient-to-br from-[#135bec] to-purple-600'}`}>
                                    <span className="material-symbols-outlined text-white text-[16px]">
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
                                        {msg.role === 'user' ? 'person' : 'smart_toy'}
                                    </span>
                                </div>
                                <div className={`p-3.5 text-sm rounded-2xl shadow-sm max-w-[85%] overflow-hidden ${
                                    msg.role === 'user' 
<<<<<<< HEAD
                                    ? 'bg-green-100 border border-green-200 text-green-900 rounded-tr-sm' 
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                                }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-slate prose-sm max-w-none text-slate-800 prose-p:text-slate-800 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200 prose-pre:p-3 prose-pre:rounded-lg">
=======
                                    ? 'bg-[#135bec] text-white rounded-tr-sm' 
                                    : 'bg-[#1e2330] border border-[#2b3245] text-slate-300 rounded-tl-sm'
                                }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-[#151b26] prose-pre:border prose-pre:border-[#2b3245] prose-pre:p-3 prose-pre:rounded-lg">
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
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
<<<<<<< HEAD
                                <div className="w-8 h-8 rounded-full bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-green-600 text-[16px]">smart_toy</span>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 flex gap-1 items-center shadow-sm">
=======
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#135bec] to-purple-600 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-white text-[16px]">smart_toy</span>
                                </div>
                                <div className="bg-[#1e2330] border border-[#2b3245] rounded-2xl rounded-tl-sm p-4 flex gap-1 items-center">
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
<<<<<<< HEAD
                    <div className="p-3 bg-white border-t border-[#e7f3eb] shrink-0">
=======
                    <div className="p-3 bg-[#111722] border-t border-[#2b3245] shrink-0">
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ask a question..."
<<<<<<< HEAD
                                className="w-full bg-slate-50 text-[#0d1b12] placeholder-slate-400 text-sm rounded-full pl-4 pr-12 py-3 border border-slate-200 focus:outline-none focus:border-[#13ec5b] focus:ring-1 focus:ring-[#13ec5b] transition-all"
=======
                                className="w-full bg-[#151b26] text-white text-sm rounded-full pl-4 pr-12 py-3 border border-[#2b3245] focus:outline-none focus:border-[#135bec] focus:ring-1 focus:ring-[#135bec] transition-all"
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
                            />
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={isTyping || !input.trim()}
<<<<<<< HEAD
                                className="absolute right-2 w-8 h-8 rounded-full bg-[#13ec5b] text-[#0d1b12] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0ecb4d] transition-colors shadow-sm"
=======
                                className="absolute right-2 w-8 h-8 rounded-full bg-[#135bec] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f4fd4] transition-colors"
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
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
<<<<<<< HEAD
                    isOpen ? 'bg-white border border-slate-200 rotate-90 text-slate-500' : 'bg-[#13ec5b] text-[#0d1b12]'
                }`}
            >
                <span className="material-symbols-outlined text-2xl">
=======
                    isOpen ? 'bg-[#2b3245] rotate-90' : 'bg-[#135bec]'
                }`}
            >
                <span className="material-symbols-outlined text-white text-2xl">
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
                    {isOpen ? 'close' : 'chat'}
                </span>
            </button>
        </div>
    );
};

export default FloatingChatbot;
