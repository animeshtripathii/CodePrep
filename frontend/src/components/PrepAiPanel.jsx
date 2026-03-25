import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axiosClient from '../utils/axiosClient';
import { toast } from 'react-hot-toast';

const quickPrompts = [
    'Give me a brute-force approach first.',
    'Now suggest an optimized approach.',
    'Explain edge cases I should test.',
    'Review my current code and point out bugs.'
];

const PrepAiPanel = ({ problem, code, language, selectedTestCase, runCaseResults, onClose }) => {
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: 'Prep AI is ready. Ask for hints, approach, edge cases, or debugging help.'
        }
    ]);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isSending]);

    const contextText = useMemo(() => {
        const shortCode = String(code || '').slice(0, 1800);
        const testcaseInfo = selectedTestCase
            ? `Selected testcase input: ${selectedTestCase.input}\nSelected testcase expected output: ${selectedTestCase.output}`
            : 'No testcase selected.';

        const runSummary = Array.isArray(runCaseResults) && runCaseResults.length > 0
            ? runCaseResults.slice(0, 5).map((item, idx) => `Case ${idx + 1}: ${item.status}`).join('\n')
            : 'No run results yet.';

        return [
            `Problem title: ${problem?.title || 'Unknown'}`,
            `Problem difficulty: ${problem?.difficulty || 'Unknown'}`,
            `Language: ${language}`,
            testcaseInfo,
            'Recent run summary:',
            runSummary,
            'Current user code:',
            shortCode || 'No code yet.'
        ].join('\n');
    }, [problem, language, selectedTestCase, runCaseResults, code]);

    const sendMessage = async (text) => {
        const userText = String(text || '').trim();
        if (!userText) return;

        setMessages((prev) => [...prev, { role: 'user', text: userText }]);
        setInput('');
        setIsSending(true);

        try {
            const response = await axiosClient.post('/chat/coding', {
                message: userText,
                code,
                language,
                problemTitle: problem?.title || '',
                problemDescription: [problem?.description || '', contextText].join('\n\n')
            });
            const textResponse = typeof response.data === 'string'
                ? response.data
                : response.data?.message || 'I could not generate a response right now.';

            setMessages((prev) => [...prev, { role: 'assistant', text: textResponse }]);
        } catch (error) {
            console.error('Prep AI error:', error);
            toast.error('Failed to get Prep AI response');
            setMessages((prev) => [...prev, { role: 'assistant', text: 'Failed to fetch AI response. Please try again.' }]);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#02040a]">
            <div className="px-3 py-2 border-b border-white/10 bg-white/4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6366F1] text-[18px]">auto_awesome</span>
                    <span className="text-sm font-semibold text-white">Prep AI</span>
                </div>
                <button onClick={onClose} className="text-white/60 hover:text-white text-lg leading-none">&times;</button>
            </div>

            <div className="px-3 py-2 border-b border-white/10 flex flex-wrap gap-2 bg-white/2">
                {quickPrompts.map((prompt) => (
                    <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="text-[11px] px-2 py-1 rounded border border-white/15 bg-white/5 text-slate-200 hover:text-white hover:border-[#6366F1]/50"
                    >
                        {prompt}
                    </button>
                ))}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] rounded-lg border px-3 py-2 text-xs ${msg.role === 'user' ? 'bg-[#6366F1]/20 border-[#6366F1]/40 text-slate-100' : 'bg-white/5 border-white/15 text-slate-100'}`}>
                            {msg.role === 'assistant' ? (
                                <div className="prose prose-invert prose-sm max-w-none text-slate-100 prose-p:my-1 prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/20">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                </div>
                            ) : (
                                <span className="whitespace-pre-wrap">{msg.text}</span>
                            )}
                        </div>
                    </div>
                ))}
                {isSending && (
                    <div className="text-slate-400 text-xs">Prep AI is thinking...</div>
                )}
            </div>

            <div className="p-3 border-t border-white/10 bg-white/4">
                <div className="flex items-center gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                        placeholder="Ask Prep AI..."
                        className="flex-1 bg-white/5 border border-white/15 rounded px-3 py-2 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1]/60"
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={isSending || !input.trim()}
                        className="px-3 py-2 rounded bg-[#6366F1] text-white text-xs font-semibold disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrepAiPanel;
