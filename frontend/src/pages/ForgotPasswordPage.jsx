<<<<<<< HEAD
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await axiosClient.post('/user/forgot-password', { emailId: email });
            setSuccess(res.data.message);
            setEmail('');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: '#000000', color: '#F3F3F5', fontFamily: 'Inter, sans-serif' }}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '500px', height: '500px', background: 'radial-gradient(ellipse, rgba(255,79,0,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div className="dot-grid-bg absolute inset-0 opacity-40" />
            </div>

            <div className="w-full max-w-sm relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/login" className="inline-flex items-center gap-2">
                        <div className="size-8 rounded-lg flex items-center justify-center font-black text-sm"
                            style={{ background: 'linear-gradient(135deg, #FF4F00, #FF8C42)', color: 'white' }}>{'}'}</div>
                        <span className="font-bold text-white text-xl">CodePrep</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="rc-card p-8">
                    <div className="text-center mb-6">
                        <div className="size-12 mx-auto rounded-xl flex items-center justify-center mb-4"
                            style={{ background: 'rgba(255,79,0,0.1)', border: '1px solid rgba(255,79,0,0.2)' }}>
                            <span className="material-symbols-outlined text-[#FF4F00] text-2xl">lock_reset</span>
                        </div>
                        <h1 className="text-white text-xl font-black mb-1">Forgot Password?</h1>
                        <p style={{ color: '#8A8B91', fontSize: '13px' }}>
                            We'll send you a link to reset your password.
                        </p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="rounded-lg p-3.5 mb-5 flex items-start gap-2.5"
                            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <span className="material-symbols-outlined text-[#10b981] text-lg mt-0.5">check_circle</span>
                            <p className="text-sm leading-relaxed" style={{ color: '#10b981' }}>{success}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="rounded-lg p-3.5 mb-5 flex items-start gap-2.5"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <span className="material-symbols-outlined text-[#ef4444] text-lg mt-0.5">error</span>
                            <p className="text-sm leading-relaxed" style={{ color: '#ef4444' }}>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8A8B91' }}>
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="rc-input"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-rc-primary w-full justify-center py-2.5 mt-2 text-sm disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">mail</span>
                                    Send Reset Link
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-xs transition-colors inline-flex items-center gap-1"
                            style={{ color: '#8A8B91' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#FF4F00'}
                            onMouseLeave={e => e.currentTarget.style.color = '#8A8B91'}>
                            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
=======
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await axiosClient.post('/user/forgot-password', { emailId: email });
            setSuccess(res.data.message);
            setEmail('');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', fontFamily: "'Inter', sans-serif" }}>

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/login" className="inline-flex items-center gap-2 group">
                        <div className="bg-green-500/10 p-2.5 rounded-xl border border-green-500/20 group-hover:bg-green-500/20 transition-colors">
                            <span className="material-symbols-outlined text-green-400 text-2xl">terminal</span>
                        </div>
                        <span className="text-white text-xl font-bold tracking-tight"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CodePrep</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 mx-auto bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-green-400 text-3xl">lock_reset</span>
                        </div>
                        <h1 className="text-white text-2xl font-bold mb-1"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Forgot Password?</h1>
                        <p className="text-slate-400 text-sm">
                            Enter your email and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-5 flex items-start gap-3">
                            <span className="material-symbols-outlined text-green-400 text-xl mt-0.5">check_circle</span>
                            <p className="text-green-300 text-sm leading-relaxed">{success}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-5 flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-400 text-xl mt-0.5">error</span>
                            <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-5">
                            <label className="block text-xs font-bold text-green-400/80 uppercase tracking-widest mb-2" htmlFor="email">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">mail</span>
                                    Send Reset Link
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-sm text-slate-400 hover:text-green-400 transition-colors inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
>>>>>>> 4c7510c4037886edc05d8b2d5844dc36ed14d532
