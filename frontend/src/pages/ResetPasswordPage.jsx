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
            setTimeout(() => navigate('/login'), 3000);
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
                            <span className="material-symbols-outlined text-[#FF4F00] text-2xl">password</span>
                        </div>
                        <h1 className="text-white text-xl font-black mb-1">Reset Password</h1>
                        <p style={{ color: '#8A8B91', fontSize: '13px' }}>
                            Enter your new password below.
                        </p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="rounded-lg p-3.5 mb-5 flex items-start gap-2.5"
                            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <span className="material-symbols-outlined text-[#10b981] text-lg mt-0.5">check_circle</span>
                            <div>
                                <p className="text-sm leading-relaxed" style={{ color: '#10b981' }}>{success}</p>
                                <p className="text-[11px] mt-1" style={{ color: 'rgba(16,185,129,0.7)' }}>Redirecting to login...</p>
                            </div>
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

                    {!success && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8A8B91' }}>
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
                                        className="rc-input pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility" : "visibility_off"}</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8A8B91' }}>
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
                                    className="rc-input"
                                />
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-[#ef4444] text-xs mt-1.5 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">warning</span>
                                        Passwords do not match
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !newPassword || !confirmPassword}
                                className="btn-rc-primary w-full justify-center py-2.5 mt-2 text-sm disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
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

export default ResetPasswordPage;
