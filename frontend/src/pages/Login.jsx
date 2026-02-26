import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { loginUser } from ".././app/features/auth/authSlice.js";
import { toast } from "react-hot-toast";

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
  const { loading, isAuthenticated, error } = useSelector((state) => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const submitData = (data) => {
    dispatch(loginUser(data));
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden text-[#0d1b12] bg-[#f8fcf9] selection:bg-[#13ec5b]/30"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Background glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-[#13ec5b]/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-48 -right-40 w-[32rem] h-[32rem] bg-[#13ec5b]/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-green-200/20 rounded-full blur-[100px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(19,236,91,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(19,236,91,0.08) 1px, transparent 1px)',
            backgroundSize: '4rem 4rem',
            maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
          }}
        />
      </div>

      {/* ── Card ── */}
      <main className="relative z-10 w-full max-w-md px-6">
        <div
          className="rounded-3xl border border-[#e7f3eb] shadow-xl overflow-hidden bg-white"
        >
          {/* Green top accent line */}
          <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#13ec5b] to-transparent opacity-80" />

          <div className="p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 opacity-90 bg-green-50 shadow-sm"
                style={{ border: '1px solid rgba(19,236,91,0.3)' }}>
                <span className="material-symbols-outlined text-[#13ec5b] text-2xl font-bold">terminal</span>
              </div>
              <h1 className="text-3xl font-black text-[#0d1b12] tracking-tight mb-1"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CodePrep</h1>
              <p className="text-[#4c9a66] text-sm font-semibold uppercase tracking-widest mt-2">Login to your account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(submitData)} className="space-y-6">

              {/* Email */}
              <div className="group relative">
                <label className="block text-xs font-bold text-[#4c9a66] uppercase tracking-widest mb-2" htmlFor="emailId">
                  Email
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-400 group-focus-within:text-[#13ec5b] transition-colors text-[20px]">alternate_email</span>
                  <input
                    id="emailId"
                    type="email"
                    placeholder="Enter your email"
                    {...register("emailId")}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-[#e7f3eb] text-[#0d1b12] placeholder-slate-400 focus:outline-none focus:border-[#13ec5b] focus:ring-1 focus:ring-[#13ec5b] transition-all text-sm shadow-sm"
                  />
                </div>
                {errors.emailId && <p className="text-red-500 text-xs mt-1.5 font-medium">⚠ {errors.emailId.message}</p>}
              </div>

              {/* Password */}
              <div className="group relative">
                <label className="block text-xs font-bold text-[#4c9a66] uppercase tracking-widest mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-400 group-focus-within:text-[#13ec5b] transition-colors text-[20px]">lock</span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    {...register("password")}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-[#e7f3eb] text-[#0d1b12] placeholder-slate-400 focus:outline-none focus:border-[#13ec5b] focus:ring-1 focus:ring-[#13ec5b] transition-all text-sm shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-[#0d1b12] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility" : "visibility_off"}</span>
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">⚠ {errors.password.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#13ec5b] hover:bg-[#0ecb4d] text-black font-bold text-sm tracking-wide transition-all shadow-md shadow-[#13ec5b]/20 disabled:opacity-60 disabled:cursor-not-allowed mt-4"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">login</span>
                )}
                {loading ? "Authenticating…" : "Login"}
              </button>

              {/* Footer links */}
              <div className="flex justify-between items-center text-xs font-medium text-slate-500 pt-5 mt-2 border-t border-[#e7f3eb]">
                <Link to="/forgot-password" className="hover:text-[#13ec5b] transition-colors">Forgot Password</Link>
                <Link to="/signup" className="hover:text-[#13ec5b] transition-colors text-[#0d1b12]">Create Account →</Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
