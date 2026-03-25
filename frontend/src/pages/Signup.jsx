import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { checkAuthStatus } from ".././app/features/auth/authSlice.js";
import { toast } from "react-hot-toast";
import axiosClient from "../utils/axiosClient.js";

const signupSchema = z
  .object({
    firstName: z.string().min(3, "Full name must be at least 3 characters").max(30, "Full name must be less than 30 characters"),
    emailId: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string().min(8, "Confirm password must match"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const submitData = useCallback(async (data) => {
    setSendingOtp(true);
    try {
      const payload = {
        firstName: data.firstName,
        emailId: data.emailId,
        password: data.password,
      };
      const res = await axiosClient.post('/user/signup/request-otp', payload);
      toast.success(res?.data?.message || 'OTP sent to your email');
      setPendingEmail(data.emailId);
      setOtpSent(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  }, []);

  const handleVerifyOtp = useCallback(async () => {
    if (!pendingEmail || !otp.trim()) {
      toast.error('Enter OTP to verify signup');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await axiosClient.post('/user/signup/verify-otp', {
        emailId: pendingEmail,
        otp: otp.trim(),
      });
      const token = res?.data?.user?.token;
      if (token) {
        localStorage.setItem('codeprep_auth_token', token);
      }
      toast.success('Signup successful');
      await dispatch(checkAuthStatus());
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'OTP verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  }, [pendingEmail, otp, dispatch, navigate]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const toggleConfirmVisibility = useCallback(() => {
    setShowConfirm((prev) => !prev);
  }, []);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden text-slate-200 bg-transparent selection:bg-[#6366F1]/30"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Background glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-[#6366F1]/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-48 -right-40 w-[32rem] h-[32rem] bg-[#0EA5E9]/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-[#6366F1]/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '4rem 4rem',
            maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
          }}
        />
      </div>

      {/* ── Card ── */}
      <main className="relative z-10 w-full max-w-md px-6 py-8">
        <div
          className="rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden bg-[#0a0f1d]/80 backdrop-blur-xl"
        >
          <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#6366F1] to-transparent opacity-80" />

          <div className="p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 opacity-90 bg-[#6366F1]/10 shadow-[0_0_15px_rgba(99,102,241,0.2)] border border-[#6366F1]/20">
                <span className="material-symbols-outlined text-[#0EA5E9] text-2xl font-bold">terminal</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mb-1"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CodePrep</h1>
              <p className="text-[#8B5CF6] text-xs font-semibold uppercase tracking-widest mt-1">Create your account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(submitData)} className="space-y-4">

              {/* Name */}
              <div className="group">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5" htmlFor="firstName">Name</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-500 group-focus-within:text-[#6366F1] transition-colors text-[20px]">badge</span>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Enter your name"
                    {...register("firstName")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all text-sm shadow-sm"
                  />
                </div>
                {errors.firstName && <p className="text-rose-400 text-xs mt-1 font-medium">⚠ {errors.firstName.message}</p>}
              </div>

              {/* Email */}
              <div className="group">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5" htmlFor="emailId">Email</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-500 group-focus-within:text-[#6366F1] transition-colors text-[20px]">alternate_email</span>
                  <input
                    id="emailId"
                    type="email"
                    placeholder="Enter your email"
                    {...register("emailId")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all text-sm shadow-sm"
                  />
                </div>
                {errors.emailId && <p className="text-rose-400 text-xs mt-1 font-medium">⚠ {errors.emailId.message}</p>}
              </div>

              {/* Password */}
              <div className="group">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5" htmlFor="password">Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-500 group-focus-within:text-[#6366F1] transition-colors text-[20px]">lock</span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    {...register("password")}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all text-sm shadow-sm"
                  />
                  <button type="button" onClick={togglePasswordVisibility} className="absolute right-3 text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility" : "visibility_off"}</span>
                  </button>
                </div>
                {errors.password && <p className="text-rose-400 text-xs mt-1 font-medium">⚠ {errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div className="group">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-500 group-focus-within:text-[#6366F1] transition-colors text-[20px]">beenhere</span>
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••••••"
                    {...register("confirmPassword")}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all text-sm shadow-sm"
                  />
                  <button type="button" onClick={toggleConfirmVisibility} className="absolute right-3 text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{showConfirm ? "visibility" : "visibility_off"}</span>
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-rose-400 text-xs mt-1 font-medium">⚠ {errors.confirmPassword.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || sendingOtp || otpSent}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] disabled:opacity-60 disabled:cursor-not-allowed mt-4"
              >
                {(loading || sendingOtp) ? (
                  <span className="w-4 h-4 border-2 border-[#0a0f1d] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                )}
                {sendingOtp ? "Sending OTP..." : (otpSent ? "OTP Sent" : "Send OTP")}
              </button>

              {otpSent && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all text-sm shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {verifyingOtp ? "Verifying OTP..." : "Verify OTP & Signup"}
                  </button>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-between items-center text-xs font-medium text-slate-400 pt-4 mt-2 border-t border-white/10">
                <span>Already have an account?</span>
                <Link to="/login" className="hover:text-[#6366F1] transition-colors text-white">Login →</Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Signup;
