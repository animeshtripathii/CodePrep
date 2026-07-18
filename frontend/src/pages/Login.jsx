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
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const CODE_LINES = [
  '> npm run interview --mode=ai',
  '✓ Connecting to AI interviewer...',
  '✓ Problem selected: Two Sum',
  '> function twoSum(nums, target) {',
  '    const map = new Map();',
  '    for (let i = 0; i < nums.length; i++) {',
  '      if (map.has(target - nums[i]))',
  '        return [map.get(target - nums[i]), i];',
  '      map.set(nums[i], i);',
  '    }',
  '  }',
  '✓ Solution accepted! Time: O(n)',
  '> Score: 94/100 — Excellent!',
];

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, isAuthenticated, error } = useSelector((state) => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) });

  useEffect(() => { if (isAuthenticated) navigate("/"); }, [isAuthenticated]);
  useEffect(() => { if (error) toast.error(error); }, [error]);

  // Animate code lines
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= CODE_LINES.length) { clearInterval(id); setTimeout(() => setVisibleLines(0), 3000); }
    }, 400);
    return () => clearInterval(id);
  }, []);

  // Restart animation when visibleLines resets
  useEffect(() => {
    if (visibleLines !== 0) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= CODE_LINES.length) { clearInterval(id); setTimeout(() => setVisibleLines(0), 3000); }
    }, 400);
    return () => clearInterval(id);
  }, [visibleLines === 0 ? visibleLines : null]);

  const submitData = (data) => { dispatch(loginUser(data)); };

  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: '#F3F3F5', fontFamily: 'Inter, sans-serif', display: 'flex' }}>

      {/* Left: Animated terminal */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#0C0C0D', borderRight: '1px solid #1a1a1e' }}>
        {/* Orange glow */}
        <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '500px', height: '500px', background: 'radial-gradient(ellipse, rgba(255,79,0,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="dot-grid-bg absolute inset-0 opacity-40" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 rounded-lg flex items-center justify-center font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #FF4F00, #FF8C42)', color: 'white' }}>{'}'}</div>
            <span className="font-bold text-white">CodePrep</span>
          </div>
          <p className="text-xs" style={{ color: '#4a4a52' }}>Interview Practice Platform</p>
        </div>

        {/* Terminal window */}
        <div className="relative z-10">
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #222225', background: '#000000' }}>
            <div className="flex items-center gap-2 px-4 py-3" style={{ background: '#111112', borderBottom: '1px solid #1a1a1e' }}>
              <div className="size-3 rounded-full" style={{ background: '#ef4444' }} />
              <div className="size-3 rounded-full" style={{ background: '#f59e0b' }} />
              <div className="size-3 rounded-full" style={{ background: '#10b981' }} />
              <span className="text-xs ml-2" style={{ color: '#4a4a52', fontFamily: 'JetBrains Mono' }}>~/codeprep</span>
            </div>
            <div className="p-5 space-y-1" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', minHeight: '280px' }}>
              {CODE_LINES.slice(0, visibleLines).map((line, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span style={{
                    color: line.startsWith('>') ? '#FF4F00' : line.startsWith('✓') ? '#10b981' : '#8A8B91',
                    whiteSpace: 'pre'
                  }}>{line}</span>
                </div>
              ))}
              <span className="inline-block w-2 h-4 ml-0.5 animate-pulse" style={{ background: '#FF4F00', verticalAlign: 'middle' }} />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[['2k+', 'Problems'], ['95%', 'Success Rate'], ['500+', 'Users']].map(([v, l]) => (
              <div key={l}>
                <div className="text-xl font-black" style={{ color: '#FF4F00' }}>{v}</div>
                <div className="text-xs mt-0.5" style={{ color: '#4a4a52' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs relative z-10" style={{ color: '#333338' }}>© {new Date().getFullYear()} CodePrep</p>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="size-8 rounded-lg flex items-center justify-center font-black text-sm"
                style={{ background: 'linear-gradient(135deg, #FF4F00, #FF8C42)', color: 'white' }}>{'}'}</div>
              <span className="font-bold text-white">CodePrep</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Welcome back</h1>
            <p style={{ color: '#8A8B91' }}>Sign in to continue your practice</p>
          </div>

          <form onSubmit={handleSubmit(submitData)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8A8B91' }}>Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#4a4a52' }}>alternate_email</span>
                <input id="emailId" type="email" placeholder="you@example.com"
                  {...register("emailId")}
                  className="rc-input pl-10"
                />
              </div>
              {errors.emailId && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>⚠ {errors.emailId.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8A8B91' }}>Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#4a4a52' }}>lock</span>
                <input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  {...register("password")}
                  className="rc-input pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#4a4a52' }}>
                  <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility" : "visibility_off"}</span>
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>⚠ {errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs transition-colors" style={{ color: '#8A8B91' }}
                onMouseEnter={e => e.currentTarget.style.color = '#FF4F00'}
                onMouseLeave={e => e.currentTarget.style.color = '#8A8B91'}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-rc-primary w-full justify-center py-3 mt-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">login</span>
              )}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <p className="text-center text-sm pt-2" style={{ color: '#8A8B91' }}>
              No account?{' '}
              <Link to="/signup" style={{ color: '#FF4F00', fontWeight: '600' }}
                onMouseEnter={e => e.currentTarget.style.color = '#FF8C42'}
                onMouseLeave={e => e.currentTarget.style.color = '#FF4F00'}>
                Create one →
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
