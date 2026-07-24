import { Link, useNavigate } from 'react-router-dom';
import { Feather, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { TOOLS_CONFIG } from '../config/tools.config';
import { authService } from '../services/authService';

export function LoginPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setError('');
      try {
        await authService.googleAuth({ access_token: tokenResponse.access_token });
        navigate('/', { replace: true });
      } catch {
        setError('Google sign-in failed. Please try again.');
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => setError('Google sign-in was cancelled or failed.'),
  });

  // ── Email / Password ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setError('');
    try {
      await authService.login({ email, password });
      navigate('/', { replace: true });
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center shadow-md shadow-violet-200">
            <Feather className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold">
            <span className="text-stone-850">Nav</span>
            <span className="bg-gradient-to-r from-violet-600 to-violet-400 bg-clip-text text-transparent">Quill</span>
          </span>
        </div>
        <p className="text-sm text-stone-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-violet-600 hover:text-violet-500 font-semibold transition-colors">
            Sign up free
          </Link>
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm px-8 py-9">
            <div className="text-center mb-7">
              <h1 className="text-2xl font-bold text-stone-900">Log in to NavQuill</h1>
              <p className="text-sm text-stone-400 mt-1">Welcome back — let's get writing.</p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            {/* ── Google button ── */}
            <button
              id="login-google-btn"
              type="button"
              onClick={() => handleGoogleLogin()}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-sm font-medium text-stone-700 transition-colors duration-150 mb-3 disabled:opacity-60 cursor-pointer"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
              ) : (
                /* Google coloured G */
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-xs text-stone-400 font-medium">or continue with email</span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>

            {/* ── Email/Password form ── */}
            <form id="login-form" className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-stone-600 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="text-xs font-semibold text-stone-600">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs text-violet-500 hover:text-violet-650 font-medium transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-semibold hover:from-violet-500 hover:to-violet-400 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-violet-200 group disabled:opacity-60 mt-1 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Log in
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Tool color strip */}
          <div className="flex mt-4 rounded-2xl overflow-hidden h-1">
            {TOOLS_CONFIG.map(({ slug, color }) => (
              <div key={slug} className="flex-1" style={{ backgroundColor: color.hex }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
