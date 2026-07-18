import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { registerUser } from ".././app/features/auth/authSlice.js";
import { toast } from "react-hot-toast";

const signupSchema = z.object({
  firstName: z.string().min(3, "Name must be at least 3 characters").max(30),
  emailId: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

const FEATURES = [
  { icon: 'code', label: '2000+ Coding Problems' },
  { icon: 'smart_toy', label: 'AI Mock Interviews' },
  { icon: 'group', label: 'Peer Interview Rooms' },
  { icon: 'insights', label: 'Progress Analytics' },
];

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector(s => s.auth);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(signupSchema) });

  useEffect(() => { if (isAuthenticated) navigate("/"); }, [isAuthenticated]);
  useEffect(() => { if (error) toast.error(error); }, [error]);

  const submitData = (data) => { dispatch(registerUser(data)); };

  const Field = ({ id, label, icon, type = 'text', placeholder, reg, error, extra }) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8A8B91' }}>{label}</label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#4a4a52' }}>{icon}</span>
        <input id={id} type={type} placeholder={placeholder} {...register(reg)}
          className="rc-input pl-10 pr-10" />
        {extra}
      </div>
      {error && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>⚠ {error.message}</p>}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: '#F3F3F5', fontFamily: 'Inter, sans-serif', display: 'flex' }}>

      {/* Left: Feature showcase */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#0C0C0D', borderRight: '1px solid #1a1a1e' }}>
        <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '500px', height: '500px', background: 'radial-gradient(ellipse, rgba(255,79,0,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="dot-grid-bg absolute inset-0 opacity-30" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 rounded-lg flex items-center justify-center font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #FF4F00, #FF8C42)', color: 'white' }}>{'}'}</div>
            <span className="font-bold text-white">CodePrep</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">Everything you need to get hired</h2>
            <p style={{ color: '#8A8B91' }}>Join thousands of developers leveling up their interview skills</p>
          </div>
          <div className="space-y-3">
            {FEATURES.map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#111112', border: '1px solid #1a1a1e' }}>
                <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,79,0,0.1)' }}>
                  <span className="material-symbols-outlined text-[18px]" style={{ color: '#FF4F00' }}>{icon}</span>
                </div>
                <span className="text-sm font-medium text-white">{label}</span>
                <span className="material-symbols-outlined text-[16px] ml-auto" style={{ color: '#10b981' }}>check_circle</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs relative z-10" style={{ color: '#333338' }}>© {new Date().getFullYear()} CodePrep</p>
      </div>

      {/* Right: Signup form */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="size-8 rounded-lg flex items-center justify-center font-black text-sm"
                style={{ background: 'linear-gradient(135deg, #FF4F00, #FF8C42)', color: 'white' }}>{'}'}</div>
              <span className="font-bold text-white">CodePrep</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Create account</h1>
            <p style={{ color: '#8A8B91' }}>Start your interview prep journey today</p>
          </div>

          <form onSubmit={handleSubmit(submitData)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8A8B91' }}>First Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#4a4a52' }}>person</span>
                <input id="firstName" type="text" placeholder="Your first name" {...register("firstName")} className="rc-input pl-10" />
              </div>
              {errors.firstName && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>⚠ {errors.firstName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8A8B91' }}>Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#4a4a52' }}>alternate_email</span>
                <input id="emailId" type="email" placeholder="you@example.com" {...register("emailId")} className="rc-input pl-10" />
              </div>
              {errors.emailId && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>⚠ {errors.emailId.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8A8B91' }}>Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#4a4a52' }}>lock</span>
                <input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")} className="rc-input pl-10 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#4a4a52' }}>
                  <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility" : "visibility_off"}</span>
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>⚠ {errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8A8B91' }}>Confirm Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#4a4a52' }}>lock_reset</span>
                <input id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="••••••••" {...register("confirmPassword")} className="rc-input pl-10 pr-10" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#4a4a52' }}>
                  <span className="material-symbols-outlined text-[18px]">{showConfirm ? "visibility" : "visibility_off"}</span>
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>⚠ {errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-rc-primary w-full justify-center py-3 mt-2 text-sm disabled:opacity-50">
              {loading ? <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <span className="material-symbols-outlined text-[18px]">person_add</span>}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            <p className="text-center text-sm pt-2" style={{ color: '#8A8B91' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#FF4F00', fontWeight: '600' }}>Sign in →</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
