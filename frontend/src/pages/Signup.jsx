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
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1

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
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

<<<<<<< HEAD
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

=======
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
  const submitData = (data) => {
    dispatch(registerUser(data));
  };

  return (
    <div
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
            backgroundSize: '4rem 4rem',
            maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
          }}
        />
      </div>

      {/* ── Card ── */}
      <main className="relative z-10 w-full max-w-md px-6 py-8">
        <div
          className="rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          style={{ background: 'rgba(30,41,59,0.7)', backdropFilter: 'blur(20px)' }}
        >
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60" />

          <div className="p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
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
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Enter your name"
                    {...register("firstName")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>
                {errors.firstName && <p className="text-red-400 text-xs mt-1">⚠ {errors.firstName.message}</p>}
              </div>

              {/* Email */}
              <div className="group">
                <label className="block text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1.5" htmlFor="emailId">Email</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-500 group-focus-within:text-blue-400 transition-colors text-[20px]">alternate_email</span>
                  <input
                    id="emailId"
                    type="email"
                    placeholder="Enter your email"
                    {...register("emailId")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>
                {errors.emailId && <p className="text-red-400 text-xs mt-1">⚠ {errors.emailId.message}</p>}
              </div>

              {/* Password */}
              <div className="group">
                <label className="block text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1.5" htmlFor="password">Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-500 group-focus-within:text-blue-400 transition-colors text-[20px]">lock</span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    {...register("password")}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility" : "visibility_off"}</span>
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">⚠ {errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div className="group">
                <label className="block text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1.5" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-500 group-focus-within:text-blue-400 transition-colors text-[20px]">beenhere</span>
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••••••"
                    {...register("confirmPassword")}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{showConfirm ? "visibility" : "visibility_off"}</span>
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">⚠ {errors.confirmPassword.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                )}
                {loading ? "Creating account…" : "Create Account"}
              </button>

              {/* Footer */}
              <div className="flex justify-between items-center text-xs text-slate-400 pt-3 border-t border-white/5">
                <span className="text-slate-500">Already have an account?</span>
                <Link to="/login" className="hover:text-blue-400 transition-colors">Login →</Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Signup;
