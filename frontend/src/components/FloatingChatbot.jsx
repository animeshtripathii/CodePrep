import React, { useState, useRef, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-hot-toast';

import { useSelector } from 'react-redux';

const FloatingChatbot = ({ isEmbedded = false }) => {
    const { user } = useSelector(state => state.auth);
    const [isOpen, setIsOpen] = useState(isEmbedded ? true : false);

    // If embedded, keep it always open when rendered.
    useEffect(() => {
        if (isEmbedded) setIsOpen(true);
    }, [isEmbedded]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: "Hi! I'm CodeMaster AI. How can I help you today?"
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

        const userText = text.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setIsTyping(true);

        try {
            const response = await axiosClient.post('/chat/website', { message: userText });
            setMessages(prev => [...prev, { role: 'assistant', text: response.data }]);
        } catch (error) {
            console.error('Website Chat Error:', error);
            toast.error('Failed to get AI response');
        } finally {
            setIsTyping(false);
        }
    };

    const chatContent = (
        <div className={`flex flex-col overflow-hidden bg-[#02040a] ${isEmbedded ? 'w-full h-full' : 'mb-4 w-[350px] sm:w-[400px] h-[500px] border border-white/10 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200'}`}>
            {/* Header */}
            {!isEmbedded && (
            <div className="bg-white/[0.05] p-4 flex justify-between items-center shrink-0 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0EA5E9]">support_agent</span>
                    <h3 className="text-white font-bold text-lg">CodeMaster AI</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            )}

            {/* Messages Area */}
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#02040a]">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                                    msg.role === 'user' 
                                    ? 'bg-white/10 border-white/20' 
                                    : 'bg-[#0EA5E9]/15 border-[#0EA5E9]/35'
                                }`}>
                                    <span className={`material-symbols-outlined text-[16px] ${
                                        msg.role === 'user' ? 'text-slate-300' : 'text-[#0EA5E9]'
                                    }`}>
                                        {msg.role === 'user' ? 'person' : 'smart_toy'}
                                    </span>
                                </div>
                                <div className={`p-3.5 text-sm rounded-2xl shadow-sm max-w-[85%] overflow-hidden ${
                                    msg.role === 'user' 
                                    ? 'bg-[#6366F1]/15 border border-[#6366F1]/40 text-slate-100 rounded-tr-sm' 
                                    : 'bg-white/[0.05] border border-white/15 text-slate-100 rounded-tl-sm'
                                }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-invert prose-sm max-w-none text-slate-100 prose-p:text-slate-100 prose-headings:text-white prose-strong:text-white prose-pre:bg-black/40 prose-pre:text-slate-100 prose-pre:border prose-pre:border-white/20 prose-pre:p-3 prose-pre:rounded-lg [&_:not(pre)>code]:!bg-black/40 [&_:not(pre)>code]:!text-slate-100 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded-md [&_:not(pre)>code]:font-normal">
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
                                <div className="w-8 h-8 rounded-full bg-[#0EA5E9]/15 border border-[#0EA5E9]/35 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[#0EA5E9] text-[16px]">smart_toy</span>
                                </div>
                                <div className="bg-white/[0.05] border border-white/15 rounded-2xl rounded-tl-sm p-4 flex gap-1 items-center shadow-sm">
                                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white/[0.04] border-t border-white/10 shrink-0">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ask a question..."
                                className="w-full bg-white/[0.04] text-slate-100 placeholder-slate-400 text-sm rounded-full pl-4 pr-12 py-3 border border-white/15 focus:outline-none focus:border-[#6366F1]/70 focus:ring-1 focus:ring-[#6366F1]/60 transition-all"
                            />
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={isTyping || !input.trim()}
                                className="absolute right-2 w-8 h-8 rounded-full bg-[#6366F1] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4F46E5] transition-colors shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[18px]">send</span>
                            </button>
                        </div>
                    </div>
                </div>
    );

    if (isEmbedded) {
        return chatContent;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && chatContent}
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 hover:scale-110 ${
                    isOpen ? 'bg-white/10 border border-white/20 rotate-90 text-slate-300' : 'bg-[#6366F1] text-white'
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
