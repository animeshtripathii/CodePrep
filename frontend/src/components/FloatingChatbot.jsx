import React, { useState, useRef, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-hot-toast';

const FloatingChatbot = () => {
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

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-[#111722] border border-[#2b3245] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
                    {/* Header */}
                    <div className="bg-[#135bec] p-4 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-white">support_agent</span>
                            <h3 className="text-white font-bold text-lg">CodePrep Support</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#101622]">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#2b3245]' : 'bg-gradient-to-br from-[#135bec] to-purple-600'}`}>
                                    <span className="material-symbols-outlined text-white text-[16px]">
                                        {msg.role === 'user' ? 'person' : 'smart_toy'}
                                    </span>
                                </div>
                                <div className={`p-3.5 text-sm rounded-2xl shadow-sm max-w-[85%] overflow-hidden ${
                                    msg.role === 'user' 
                                    ? 'bg-[#135bec] text-white rounded-tr-sm' 
                                    : 'bg-[#1e2330] border border-[#2b3245] text-slate-300 rounded-tl-sm'
                                }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-[#151b26] prose-pre:border prose-pre:border-[#2b3245] prose-pre:p-3 prose-pre:rounded-lg">
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
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#135bec] to-purple-600 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-white text-[16px]">smart_toy</span>
                                </div>
                                <div className="bg-[#1e2330] border border-[#2b3245] rounded-2xl rounded-tl-sm p-4 flex gap-1 items-center">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-[#111722] border-t border-[#2b3245] shrink-0">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ask a question..."
                                className="w-full bg-[#151b26] text-white text-sm rounded-full pl-4 pr-12 py-3 border border-[#2b3245] focus:outline-none focus:border-[#135bec] focus:ring-1 focus:ring-[#135bec] transition-all"
                            />
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={isTyping || !input.trim()}
                                className="absolute right-2 w-8 h-8 rounded-full bg-[#135bec] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f4fd4] transition-colors"
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
                    isOpen ? 'bg-[#2b3245] rotate-90' : 'bg-[#135bec]'
                }`}
            >
                <span className="material-symbols-outlined text-white text-2xl">
                    {isOpen ? 'close' : 'chat'}
                </span>
            </button>
        </div>
    );
};

export default FloatingChatbot;
