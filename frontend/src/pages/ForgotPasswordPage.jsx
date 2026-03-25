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
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden text-slate-200 bg-transparent selection:bg-indigo-500/30 px-4"
            style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Background glows ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute inset-0"
                                style={{
                                    background: 'radial-gradient(120% 120% at 0% 0%, rgba(14, 165, 233, 0.16) 0%, rgba(14, 165, 233, 0) 48%), radial-gradient(120% 120% at 100% 100%, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 50%), #02040a'
                                }}
                            />
                            <div className="absolute -top-48 -left-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
                            <div className="absolute -bottom-48 -right-40 w-[32rem] h-[32rem] bg-indigo-500/10 rounded-full blur-[140px]" />
                            <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />
              <div className="absolute inset-0"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                  backgroundSize: '4rem 4rem',
                  maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
                }}
              />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/login" className="inline-flex items-center gap-2 group">
                        <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 group-hover:bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-colors">
                            <span className="material-symbols-outlined text-cyan-300 text-2xl">terminal</span>
                        </div>
                        <span className="text-white text-xl font-bold tracking-tight"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CodePrep</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-[#0a0f1d]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 mx-auto bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                            <span className="material-symbols-outlined text-cyan-300 text-3xl">lock_reset</span>
                        </div>
                        <h1 className="text-white text-2xl font-bold mb-1"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Forgot Password?</h1>
                        <p className="text-slate-400 text-sm">
                            Enter your email and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-lg p-4 mb-5 flex items-start gap-3 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                            <span className="material-symbols-outlined text-indigo-300 text-xl mt-0.5">check_circle</span>
                            <p className="text-indigo-200 text-sm leading-relaxed">{success}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 mb-5 flex items-start gap-3 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                            <span className="material-symbols-outlined text-rose-400 text-xl mt-0.5">error</span>
                            <p className="text-rose-300 text-sm leading-relaxed">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-5">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="email">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
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
                        <Link to="/login" className="text-sm text-slate-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5">
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
