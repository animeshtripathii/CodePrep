import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { loginUser } from "../context/features/auth/authSlice.js";


const loginSchema = z.object({
  emailId: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }), 
});

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useSelector((state) => state.auth);
 
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const submitData = (data) => {
    dispatch(loginUser(data));
  };

  return (
    <div className="bg-[#f5f8f8] dark:bg-[#101f22] font-sans text-white min-h-screen flex flex-col relative overflow-hidden bg-[#050a0b] transition-colors duration-300">
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

      {/* Main Content Container */}
      <main className="relative z-10 w-full max-w-md px-6 m-auto">
        {/* Crystal Glass Card */}
        <div className="bg-[#101f22]/60 backdrop-blur-xl border border-white/10 border-t-white/15 border-l-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl p-8 md:p-12 relative overflow-hidden group/card">
          {/* Subtle Inner Shine */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0dccf2]/30 to-transparent opacity-50"></div>
          
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0dccf2]/10 border border-[#0dccf2]/20 text-[#0dccf2] mb-6 shadow-[0_0_15px_rgba(13,204,242,0.3)]">
              <span className="material-icons text-2xl">terminal</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2 drop-shadow-lg font-display">CodePrep</h1>
            <p className="text-slate-400 text-sm tracking-wide uppercase">Login to Your Account</p>
          </div>
          
          {/* Login Form */}
          <form onSubmit={handleSubmit(submitData)} className="space-y-8">
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
            
            {/* Actions */}
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-lg p-[1px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#0dccf2]/50 to-[#0dccf2]/20 opacity-50 blur-sm group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-[#0dccf2]/20 hover:bg-[#0dccf2]/30 backdrop-blur-md border border-[#0dccf2]/30 rounded-lg px-6 py-3.5 flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(13,204,242,0.15)] group-hover:shadow-[0_0_30px_rgba(13,204,242,0.4)]">
                  <span className="font-bold tracking-widest uppercase text-sm text-cyan-50 mr-2 font-['Space_Grotesk']">
                    {loading ? "Authenticating..." : "Login"}
                  </span>
                   <span className="material-icons text-sm transform group-hover:translate-x-1 transition-transform duration-300">arrow_forward</span>
                </div>
              </button>
            </div>
            
            {/* Footer Links */}
            <div className="flex justify-between items-center text-xs text-slate-400 mt-6 pt-6 border-t border-white/5">
              <a className="hover:text-[#0dccf2] transition-colors duration-200" href="#">Forgot Password</a>
              <span className="text-white/10">|</span>
              <Link className="hover:text-[#0dccf2] transition-colors duration-200" to="/signup">Create Account</Link>
            </div>
          </form>
        </div>
  
      </main>
    </div>
  );
}
export default Login;

