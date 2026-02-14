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
    emailId: z.string().email("Invalid email address"),
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
    <div className="bg-black font-sans text-gray-300 antialiased h-screen w-full relative overflow-hidden selection:bg-gray-500 selection:text-white">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwMDAwIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz4KPC9zdmc+')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black to-black"></div>
      </div>

      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden z-10">
        <div className="min-h-full flex flex-col items-center justify-center p-4">
          <div className="glass-panel w-full max-w-[420px] rounded-3xl p-8 relative overflow-hidden group border-t border-l border-white/10 shadow-2xl my-8 !bg-gray-900/60">
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-gray-800 to-black flex items-center justify-center shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)] border border-gray-700 mb-5 relative">
                <span className="material-symbols-outlined text-gray-200 text-3xl relative z-10">terminal</span>
              </div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-600 tracking-tight">Create Account</h2>
            </div>

            <form onSubmit={handleSubmit(submitData)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1" htmlFor="firstName">Name</label>
                <div className="relative group/input">
                  <input
                    className="glass-input block w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm placeholder:text-gray-600 focus:text-white focus:!border-gray-500 focus:!shadow-[0_0_0_1px_rgba(107,114,128,0.5),0_0_15px_rgba(107,114,128,0.15)]"
                    id="firstName"
                    placeholder="Enter your name"
                    type="text"
                    {...register("firstName")}
                  />
                </div>
                {errors.firstName && <p className="text-red-400 text-xs pl-1">⚠ {errors.firstName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1" htmlFor="emailId">Email</label>
                <div className="relative group/input">
                  <input
                    className="glass-input block w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm placeholder:text-gray-600 focus:text-white focus:!border-gray-500 focus:!shadow-[0_0_0_1px_rgba(107,114,128,0.5),0_0_15px_rgba(107,114,128,0.15)]"
                    id="emailId"
                    placeholder="name@company.com"
                    type="email"
                    {...register("emailId")}
                  />
                </div>
                {errors.emailId && <p className="text-red-400 text-xs pl-1">⚠ {errors.emailId.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1" htmlFor="password">Password</label>
                <div className="relative group/input">
                  <input
                    className="glass-input block w-full pl-11 pr-11 py-3.5 rounded-2xl text-sm placeholder:text-gray-600 focus:text-white focus:!border-gray-500 focus:!shadow-[0_0_0_1px_rgba(107,114,128,0.5),0_0_15px_rgba(107,114,128,0.15)]"
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative group/input">
                  <input
                    className="glass-input block w-full pl-11 pr-11 py-3.5 rounded-2xl text-sm placeholder:text-gray-600 focus:text-white focus:!border-gray-500 focus:!shadow-[0_0_0_1px_rgba(107,114,128,0.5),0_0_15px_rgba(107,114,128,0.15)]"
                    id="confirmPassword"
                    placeholder="••••••••"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                  />
                  <button
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-white cursor-pointer transition-colors"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs pl-1">⚠ {errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm tracking-wide shadow-lg mt-4 cursor-pointer bg-gradient-to-r from-gray-800 to-gray-950 hover:from-gray-700 hover:to-gray-900 border border-gray-700 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Signing up..." : "Sign Up"}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                Already a member?{" "}
                <Link to="/login" className="text-white hover:text-gray-200 font-medium transition-colors ml-1">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;