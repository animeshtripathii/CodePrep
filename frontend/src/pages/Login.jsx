import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { loginUser } from ".././app/features/auth/authSlice.js";;

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
    <div className="bg-black font-sans text-gray-300 antialiased h-screen w-full overflow-hidden relative selection:bg-gray-500 selection:text-white">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwMDAwIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz4KPC9zdmc+')] z-0 opacity-20"></div>
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-black to-black z-0"></div>
      
      <div className="absolute top-[-10%] left-[-10%] w-150 h-150 rounded-full blur-[80px] animate-float z-0 pointer-events-none opacity-20 bg-gray-700/30"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-125 h-125 rounded-full blur-[90px] animate-float-delayed z-0 pointer-events-none opacity-20 bg-gray-800/30"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel w-full max-w-105 rounded-3xl p-8 relative overflow-hidden group border-t border-l border-white/10 shadow-2xl bg-gray-900/60!">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-gray-800 to-black flex items-center justify-center shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)] border border-gray-700 mb-5 relative">
              <span className="material-symbols-outlined text-gray-200 text-3xl relative z-10">terminal</span>
            </div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-white via-gray-400 to-gray-600 tracking-tight">Welcome Back</h2>
            <p className="text-gray-400 text-sm mt-2 font-light">Enter your credentials to access the terminal</p>
          </div>

          <form onSubmit={handleSubmit(submitData)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1" htmlFor="emailId">Email</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 group-focus-within/input:text-gray-300 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                </div>
                <input
                  className="glass-input block w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm placeholder:text-gray-600 focus:text-white focus:border-gray-500! focus:shadow-[0_0_0_1px_rgba(107,114,128,0.5),0_0_15px_rgba(107,114,128,0.15)]!"
                  id="emailId"
                  placeholder="name@company.com"
                  type="email"
                  {...register("emailId")}
                />
              </div>
              {errors.emailId && <p className="text-red-400 text-xs pl-1">⚠ {errors.emailId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider" htmlFor="password">Password</label>
              </div>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 group-focus-within/input:text-gray-300 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock_open</span>
                </div>
                <input
                  className="glass-input block w-full pl-11 pr-11 py-3.5 rounded-2xl text-sm placeholder:text-gray-600 focus:text-white focus:border-gray-500! focus:shadow-[0_0_0_1px_rgba(107,114,128,0.5),0_0_15px_rgba(107,114,128,0.15)]!"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                />
                <button
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-white cursor-pointer transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs pl-1">⚠ {errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm tracking-wide shadow-lg mt-4 cursor-pointer bg-linear-to-r from-gray-800 to-gray-950 hover:from-gray-700 hover:to-gray-900 border border-gray-700 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              New to CodePrep? 
              <Link to="/signup" className="text-white hover:text-gray-200 font-medium transition-colors ml-1">Create account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;