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
