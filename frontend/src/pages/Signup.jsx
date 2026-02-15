import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { registerUser } from ".././app/features/auth/authSlice.js";

const signupSchema = z
  .object({
    firstName: z.string().min(3, "Full name length must be at least 3 characters").max(30, "Full name length must be less than 30 characters "),
    emailId: z.string().email("Invalid email address" ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z
      .string()
      .min(8, "Confirm password and password must be same"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const submitData = (data) => {
    dispatch(registerUser(data));
  };

  return (
    <div className="bg-[#050a0b] font-sans text-white h-screen w-screen flex items-center justify-center relative overflow-hidden selection:bg-[#0dccf2] selection:text-black">
      
      {/* Background Mesh Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(at_0%_0%,rgba(13,204,242,0.15)_0px,transparent_50%),radial-gradient(at_100%_100%,rgba(13,204,242,0.1)_0px,transparent_50%),radial-gradient(at_50%_50%,rgba(16,31,34,1)_0px,transparent_100%)]"></div>

      {/* Decorative 3D Elements (Blurred Orbs/Grid) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top Left Glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0dccf2]/20 rounded-full blur-[100px] opacity-50"></div>
        {/* Bottom Right Glow */}
        <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-[#0dccf2]/10 rounded-full blur-[120px] opacity-40"></div>
        {/* Abstract Geometric Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-[#0dccf2]/10 rounded-full opacity-20 transform -translate-x-1/2 rotate-45" style={{borderWidth: '1px'}}></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 border border-[#0dccf2]/5 rounded-full opacity-20 transform translate-x-1/2 -rotate-12" style={{borderWidth: '1px'}}></div>
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(13,204,242,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(13,204,242,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]"></div>
      </div>

      {/* Main Content Container - Flexibly Scaled */}
      <main className="relative z-10 w-full max-w-md px-4">
        {/* Crystal Glass Card */}
        <div className="bg-[#101f22]/60 backdrop-blur-xl border border-white/10 border-t-white/15 border-l-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl p-10 relative overflow-hidden group/card text-s">
          {/* Subtle Inner Shine */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0dccf2]/30 to-transparent opacity-50"></div>
          
          {/* Header Section */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#0dccf2]/10 border border-[#0dccf2]/20 text-[#0dccf2] mb-3 shadow-[0_0_15px_rgba(13,204,242,0.3)]">
              <span className="material-icons text-xl">terminal</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1 drop-shadow-lg font-['Space_Grotesk']">CodePrep</h1>
            <p className="text-slate-400 text-xs tracking-wide uppercase">Create Your Account</p>
          </div>
          
          {/* Signup Form */}
          <form onSubmit={handleSubmit(submitData)} className="space-y-6">
            
            {/* Name Input */}
            <div className="group relative">
              <label className="block text-xs font-medium text-[#0dccf2]/80 uppercase tracking-widest mb-1 ml-1" htmlFor="firstName">Name</label>
              <div className="relative flex items-center">
                <span className="material-icons absolute left-0 text-slate-500 group-focus-within:text-[#0dccf2] transition-colors duration-300 z-10">badge</span>
                <input 
                  className="w-full bg-transparent border-0 border-b-2 border-white/10 text-white placeholder-slate-600 focus:ring-0 focus:border-white/10 pl-10 pb-2 pt-2 transition-all duration-300 font-light focus:outline-none relative z-0" 
                  id="firstName" 
                  placeholder="Enter your name" 
                  type="text"
                  {...register("firstName")}
                />
                {/* Animated Bottom Border */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#0dccf2] to-[#0dccf2] w-0 group-focus-within:w-full transition-all duration-300"></div>
              </div>
              {errors.firstName && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-0">⚠ {errors.firstName.message}</p>}
            </div>

            {/* Email Input */}
            <div className="group relative">
              <label className="block text-xs font-medium text-[#0dccf2]/80 uppercase tracking-widest mb-1 ml-1" htmlFor="emailId">Email</label>
              <div className="relative flex items-center">
                <span className="material-icons absolute left-0 text-slate-500 group-focus-within:text-[#0dccf2] transition-colors duration-300 z-10">alternate_email</span>
                <input 
                  className="w-full bg-transparent border-0 border-b-2 border-white/10 text-white placeholder-slate-600 focus:ring-0 focus:border-white/10 pl-10 pb-2 pt-2 transition-all duration-300 font-light focus:outline-none relative z-0" 
                  id="emailId" 
                  placeholder="Enter your email" 
                  type="email"
                  {...register("emailId")}
                />
                {/* Animated Bottom Border */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#0dccf2] to-[#0dccf2] w-0 group-focus-within:w-full transition-all duration-300"></div>
              </div>
              {errors.emailId && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-0">⚠ {errors.emailId.message}</p>}
            </div>
            
            {/* Password Input */}
            <div className="group relative">
              <div className="flex justify-between items-center mb-1 ml-1">
                <label className="block text-xs font-medium text-[#0dccf2]/80 uppercase tracking-widest" htmlFor="password">Passcode</label>
              </div>
              <div className="relative flex items-center">
                <span className="material-icons absolute left-0 text-slate-500 group-focus-within:text-[#0dccf2] transition-colors duration-300 z-10">lock_open</span>
                <input 
                  className="w-full bg-transparent border-0 border-b-2 border-white/10 text-white placeholder-slate-600 focus:ring-0 focus:border-white/10 pl-10 pb-2 pt-2 transition-all duration-300 font-light focus:outline-none relative z-0" 
                  id="password" 
                  placeholder="••••••••••••" 
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                />
                {/* Animated Bottom Border */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#0dccf2] to-[#0dccf2] w-0 group-focus-within:w-full transition-all duration-300"></div>
                <button 
                  className="absolute right-0 text-slate-500 hover:text-white transition-colors cursor-pointer z-10" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-icons text-sm">{showPassword ? "visibility" : "visibility_off"}</span>
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-0">⚠ {errors.password.message}</p>}
            </div>

            {/* Confirm Password Input */}
            <div className="group relative">
              <div className="flex justify-between items-center mb-1 ml-1">
                <label className="block text-xs font-medium text-[#0dccf2]/80 uppercase tracking-widest" htmlFor="confirmPassword">Verify Passcode</label>
              </div>
              <div className="relative flex items-center">
                <span className="material-icons absolute left-0 text-slate-500 group-focus-within:text-[#0dccf2] transition-colors duration-300 z-10">beenhere</span>
                <input 
                  className="w-full bg-transparent border-0 border-b-2 border-white/10 text-white placeholder-slate-600 focus:ring-0 focus:border-white/10 pl-10 pb-2 pt-2 transition-all duration-300 font-light focus:outline-none relative z-0" 
                  id="confirmPassword" 
                  placeholder="••••••••••••" 
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                />
                {/* Animated Bottom Border */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#0dccf2] to-[#0dccf2] w-0 group-focus-within:w-full transition-all duration-300"></div>
                <button 
                  className="absolute right-0 text-slate-500 hover:text-white transition-colors cursor-pointer z-10" 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="material-icons text-sm">{showConfirmPassword ? "visibility" : "visibility_off"}</span>
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-0">⚠ {errors.confirmPassword.message}</p>}
            </div>
            
            {/* Actions */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-lg p-[1px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#0dccf2]/50 to-[#0dccf2]/20 opacity-50 blur-sm group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-[#0dccf2]/20 hover:bg-[#0dccf2]/30 backdrop-blur-md border border-[#0dccf2]/30 rounded-lg px-6 py-2.5 flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(13,204,242,0.15)] group-hover:shadow-[0_0_30px_rgba(13,204,242,0.4)]">
                  <span className="font-bold tracking-widest uppercase text-xs text-cyan-50 mr-2 font-['Space_Grotesk']">
                    {loading ? "Initializing..." : "Create Account"}
                  </span>
                  <span className="material-icons text-sm transform group-hover:translate-x-1 transition-transform duration-300">arrow_forward</span>
                </div>
              </button>
            </div>
            
            {/* Footer Links */}
            <div className="flex justify-between items-center text-[12px] text-slate-400 mt-4 pt-4 border-t border-white/5">
              <span className="text-slate-500">Already have access?</span>
              <Link className="hover:text-[#0dccf2] transition-colors duration-200 uppercase tracking-wider" to="/login">Login System</Link>
            </div>
          </form>
        </div>
      
      </main>
    </div>
  );
}

export default Signup;
