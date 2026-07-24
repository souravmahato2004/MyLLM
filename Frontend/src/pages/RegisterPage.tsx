import { Link, useNavigate } from 'react-router-dom';
import { Feather, Mail, Lock, User, Eye, EyeOff, ArrowRight, Check, Loader2, CheckCircle2, Inbox } from 'lucide-react';
import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { TOOLS_CONFIG } from '../config/tools.config';
import { authService } from '../services/authService';

const STEPS = ['Register', 'Personalize', 'Get Started'];

export function RegisterPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const currentStep = 0;

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const handleGoogleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setError('');
      try {
        await authService.googleAuth({ access_token: tokenResponse.access_token });
        navigate('/', { replace: true });
      } catch {
        setError('Google sign-up failed. Please try again.');
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => setError('Google sign-up was cancelled or failed.'),
  });

  // ── Email / Password ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setIsLoading(true);
    setError('');
    try {
      await authService.register({ name, email, password });
      localStorage.removeItem('access_token');
      setIsEmailSent(true);
    } catch {
      setError('Registration failed. The email may already be in use.');
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
          Already have an account?{' '}
          <Link to="/login" className="text-violet-600 hover:text-violet-500 font-semibold transition-colors">
            Log in
          </Link>
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm px-8 py-9">
            {!isEmailSent ? (
              <>
                {/* Step indicator */}
                <div className="flex items-center gap-0 mb-8">
                  {STEPS.map((step, i) => (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                            i < currentStep
                              ? 'bg-emerald-500 text-white'
                              : i === currentStep
                              ? 'bg-violet-600 text-white'
                              : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          {i < currentStep ? <Check className="w-3.5 h-3.5" /> : i + 1}
                        </div>
                        <span className={`text-[10px] font-medium whitespace-nowrap ${i === currentStep ? 'text-violet-600' : 'text-stone-400'}`}>
                          {step}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-px mx-2 mb-4 transition-colors ${i < currentStep ? 'bg-emerald-300' : 'bg-stone-200'}`} />
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-center mb-7">
                  <h1 className="text-2xl font-bold text-stone-900">Create your account</h1>
                  <p className="text-sm text-stone-400 mt-1">Start writing smarter for free.</p>
                </div>

                {/* Error banner */}
                {error && (
                  <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 text-center">
                    {error}
                  </div>
                )}

                {/* ── Google button ── */}
                <button
                  id="register-google-btn"
                  type="button"
                  onClick={() => handleGoogleRegister()}
                  disabled={isGoogleLoading || isLoading}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-sm font-medium text-stone-700 transition-colors duration-150 mb-3 disabled:opacity-60 cursor-pointer"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
                  ) : (
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

                {/* ── Form ── */}
                <form id="register-form" className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="register-name" className="block text-xs font-semibold text-stone-600 mb-1.5">
                      Full name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      <input
                        id="register-name"
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Smith"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-850 placeholder-stone-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="register-email" className="block text-xs font-semibold text-stone-600 mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      <input
                        id="register-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-850 placeholder-stone-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="register-password" className="block text-xs font-semibold text-stone-600 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      <input
                        id="register-password"
                        type={showPw ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-855 placeholder-stone-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all duration-200"
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
                    id="register-submit-btn"
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-semibold hover:from-violet-500 hover:to-violet-400 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-violet-200 group disabled:opacity-60 mt-1 cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-4 text-center text-xs text-stone-400">
                  By creating an account you agree to our{' '}
                  <a href="#" className="text-violet-500 hover:text-violet-600 transition-colors">Terms</a>
                  {' '}and{' '}
                  <a href="#" className="text-violet-500 hover:text-violet-600 transition-colors">Privacy Policy</a>.
                </p>
              </>
            ) : (
              <div className="text-center space-y-6 fade-up">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h1 className="text-xl font-bold text-stone-900">Verify Your Email</h1>
                  <p className="text-xs text-stone-500 leading-relaxed max-w-[280px] mx-auto">
                    Thanks for signing up! We've sent a verification email to <strong className="text-stone-700">{email}</strong>. Please check your inbox.
                  </p>
                </div>

                {/* Open Mail Client Button */}
                {(() => {
                  const domain = email.split('@')[1]?.toLowerCase();
                  if (!domain) return null;
                  const provider = domain === 'gmail.com' ? { name: 'Gmail', url: 'https://mail.google.com' }
                    : domain === 'yahoo.com' ? { name: 'Yahoo Mail', url: 'https://mail.yahoo.com' }
                    : ['outlook.com', 'hotmail.com', 'live.com'].includes(domain) ? { name: 'Outlook', url: 'https://outlook.live.com' }
                    : { name: 'Email Client', url: `https://${domain}` };

                  return (
                    <div className="px-2">
                      <a
                        href={provider.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100/80 text-stone-700 text-sm font-semibold active:scale-[0.98] transition-all duration-200 shadow-sm cursor-pointer text-decoration-none"
                      >
                        <Inbox className="w-4 h-4 text-stone-500" />
                        Open {provider.name}
                      </a>
                    </div>
                  );
                })()}

                <div className="pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-750 font-semibold transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5 rotate-180 text-stone-400" />
                    Back to login
                  </Link>
                </div>
              </div>
            )}
          </div>

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
