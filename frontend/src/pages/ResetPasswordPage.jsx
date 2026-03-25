import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const res = await axiosClient.post(`/user/reset-password/${token}`, { newPassword });
            setSuccess(res.data.message);
            // Redirect to login after 3 seconds
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden text-slate-200 bg-transparent selection:bg-emerald-500/30 px-4"
            style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Background glows ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-48 -left-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
              <div className="absolute -bottom-48 -right-40 w-[32rem] h-[32rem] bg-emerald-500/5 rounded-full blur-[140px]" />
              <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />
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
                        <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 group-hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-colors">
                            <span className="material-symbols-outlined text-emerald-400 text-2xl">terminal</span>
                        </div>
                        <span className="text-white text-xl font-bold tracking-tight"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CodePrep</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-[#0a0f1d]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 mx-auto bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            <span className="material-symbols-outlined text-emerald-400 text-3xl">password</span>
                        </div>
                        <h1 className="text-white text-2xl font-bold mb-1"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Reset Password</h1>
                        <p className="text-slate-400 text-sm">
                            Enter your new password below.
                        </p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-5 flex items-start gap-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            <span className="material-symbols-outlined text-emerald-400 text-xl mt-0.5">check_circle</span>
                            <div>
                                <p className="text-emerald-300 text-sm leading-relaxed">{success}</p>
                                <p className="text-emerald-400/60 text-xs mt-1">Redirecting to login...</p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 mb-5 flex items-start gap-3 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                            <span className="material-symbols-outlined text-rose-400 text-xl mt-0.5">error</span>
                            <p className="text-rose-300 text-sm leading-relaxed">{error}</p>
                        </div>
                    )}

                    {!success && (
                        <form onSubmit={handleSubmit}>
                            {/* New Password */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="newPassword">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility" : "visibility_off"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="mb-5">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="confirmPassword">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
                                />
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">warning</span>
                                        Passwords do not match
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !newPassword || !confirmPassword}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0a0f1d] font-bold py-3 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-[#0a0f1d]/30 border-t-[#0a0f1d] rounded-full animate-spin"></div>
                                        Resetting...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">lock</span>
                                        Reset Password
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
