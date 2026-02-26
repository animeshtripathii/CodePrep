import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { registerUser } from ".././app/features/auth/authSlice.js";
<<<<<<< HEAD
import { toast } from "react-hot-toast";
=======
<<<<<<< HEAD
import { toast } from "react-hot-toast";
=======
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03

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
  const dispatch = useDispatch();
  const navigate = useNavigate();
<<<<<<< HEAD
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
=======
<<<<<<< HEAD
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
=======
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

<<<<<<< HEAD
=======
=======
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
  const submitData = (data) => {
    dispatch(registerUser(data));
  };

  return (
    <div
<<<<<<< HEAD
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden text-[#0d1b12] bg-[#f8fcf9] selection:bg-[#13ec5b]/30"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Background glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-[#13ec5b]/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-48 -right-40 w-[32rem] h-[32rem] bg-[#13ec5b]/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-green-200/20 rounded-full blur-[100px]" />
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(19,236,91,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(19,236,91,0.08) 1px, transparent 1px)',
=======
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden text-white"
      style={{ background: '#0f172a', fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Background glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-blue-500/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-48 -right-40 w-[32rem] h-[32rem] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-purple-500/8 rounded-full blur-[100px]" />
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)',
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
            backgroundSize: '4rem 4rem',
            maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
          }}
        />
      </div>

      {/* ── Card ── */}
      <main className="relative z-10 w-full max-w-md px-6 py-8">
        <div
<<<<<<< HEAD
          className="rounded-3xl border border-[#e7f3eb] shadow-xl overflow-hidden bg-white"
        >
          <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#13ec5b] to-transparent opacity-80" />
=======
          className="rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          style={{ background: 'rgba(30,41,59,0.7)', backdropFilter: 'blur(20px)' }}
        >
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60" />
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03

          <div className="p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
<<<<<<< HEAD
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 opacity-90 bg-green-50 shadow-sm"
                style={{ border: '1px solid rgba(19,236,91,0.3)' }}>
                <span className="material-symbols-outlined text-[#13ec5b] text-2xl font-bold">terminal</span>
              </div>
              <h1 className="text-2xl font-black text-[#0d1b12] tracking-tight mb-1"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CodePrep</h1>
              <p className="text-[#4c9a66] text-xs font-semibold uppercase tracking-widest mt-1">Create your account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(submitData)} className="space-y-4">

              {/* Name */}
              <div className="group">
                <label className="block text-xs font-bold text-[#4c9a66] uppercase tracking-widest mb-1.5" htmlFor="firstName">Name</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-400 group-focus-within:text-[#13ec5b] transition-colors text-[20px]">badge</span>
=======
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <span className="material-symbols-outlined text-blue-400 text-2xl">terminal</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight mb-1"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CodePrep</h1>
              <p className="text-slate-400 text-xs uppercase tracking-widest">Create your account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(submitData)} className="space-y-5">

              {/* Name */}
              <div className="group">
                <label className="block text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1.5" htmlFor="firstName">Name</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-500 group-focus-within:text-blue-400 transition-colors text-[20px]">badge</span>
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Enter your name"
                    {...register("firstName")}
<<<<<<< HEAD
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-[#e7f3eb] text-[#0d1b12] placeholder-slate-400 focus:outline-none focus:border-[#13ec5b] focus:ring-1 focus:ring-[#13ec5b] transition-all text-sm shadow-sm"
                  />
                </div>
                {errors.firstName && <p className="text-red-500 text-xs mt-1 font-medium">⚠ {errors.firstName.message}</p>}
=======
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>
                {errors.firstName && <p className="text-red-400 text-xs mt-1">⚠ {errors.firstName.message}</p>}
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
              </div>

              {/* Email */}
              <div className="group">
<<<<<<< HEAD
                <label className="block text-xs font-bold text-[#4c9a66] uppercase tracking-widest mb-1.5" htmlFor="emailId">Email</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-400 group-focus-within:text-[#13ec5b] transition-colors text-[20px]">alternate_email</span>
=======
                <label className="block text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1.5" htmlFor="emailId">Email</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-500 group-focus-within:text-blue-400 transition-colors text-[20px]">alternate_email</span>
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
                  <input
                    id="emailId"
                    type="email"
                    placeholder="Enter your email"
                    {...register("emailId")}
<<<<<<< HEAD
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-[#e7f3eb] text-[#0d1b12] placeholder-slate-400 focus:outline-none focus:border-[#13ec5b] focus:ring-1 focus:ring-[#13ec5b] transition-all text-sm shadow-sm"
                  />
                </div>
                {errors.emailId && <p className="text-red-500 text-xs mt-1 font-medium">⚠ {errors.emailId.message}</p>}
=======
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>
                {errors.emailId && <p className="text-red-400 text-xs mt-1">⚠ {errors.emailId.message}</p>}
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
              </div>

              {/* Password */}
              <div className="group">
<<<<<<< HEAD
                <label className="block text-xs font-bold text-[#4c9a66] uppercase tracking-widest mb-1.5" htmlFor="password">Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-400 group-focus-within:text-[#13ec5b] transition-colors text-[20px]">lock</span>
=======
                <label className="block text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1.5" htmlFor="password">Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-500 group-focus-within:text-blue-400 transition-colors text-[20px]">lock</span>
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    {...register("password")}
<<<<<<< HEAD
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-[#e7f3eb] text-[#0d1b12] placeholder-slate-400 focus:outline-none focus:border-[#13ec5b] focus:ring-1 focus:ring-[#13ec5b] transition-all text-sm shadow-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-slate-400 hover:text-[#0d1b12] transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility" : "visibility_off"}</span>
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">⚠ {errors.password.message}</p>}
=======
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility" : "visibility_off"}</span>
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">⚠ {errors.password.message}</p>}
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
              </div>

              {/* Confirm Password */}
              <div className="group">
<<<<<<< HEAD
                <label className="block text-xs font-bold text-[#4c9a66] uppercase tracking-widest mb-1.5" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-400 group-focus-within:text-[#13ec5b] transition-colors text-[20px]">beenhere</span>
=======
                <label className="block text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1.5" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-500 group-focus-within:text-blue-400 transition-colors text-[20px]">beenhere</span>
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••••••"
                    {...register("confirmPassword")}
<<<<<<< HEAD
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-[#e7f3eb] text-[#0d1b12] placeholder-slate-400 focus:outline-none focus:border-[#13ec5b] focus:ring-1 focus:ring-[#13ec5b] transition-all text-sm shadow-sm"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 text-slate-400 hover:text-[#0d1b12] transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{showConfirm ? "visibility" : "visibility_off"}</span>
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-medium">⚠ {errors.confirmPassword.message}</p>}
=======
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{showConfirm ? "visibility" : "visibility_off"}</span>
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">⚠ {errors.confirmPassword.message}</p>}
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
<<<<<<< HEAD
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#13ec5b] hover:bg-[#0ecb4d] text-black font-bold text-sm tracking-wide transition-all shadow-md shadow-[#13ec5b]/20 disabled:opacity-60 disabled:cursor-not-allowed mt-4"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
=======
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
                ) : (
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                )}
                {loading ? "Creating account…" : "Create Account"}
              </button>

              {/* Footer */}
<<<<<<< HEAD
              <div className="flex justify-between items-center text-xs font-medium text-slate-500 pt-4 mt-2 border-t border-[#e7f3eb]">
                <span>Already have an account?</span>
                <Link to="/login" className="hover:text-[#13ec5b] transition-colors text-[#0d1b12]">Login →</Link>
=======
              <div className="flex justify-between items-center text-xs text-slate-400 pt-3 border-t border-white/5">
                <span className="text-slate-500">Already have an account?</span>
                <Link to="/login" className="hover:text-blue-400 transition-colors">Login →</Link>
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Signup;
