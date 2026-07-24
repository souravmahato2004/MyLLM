import { Link, useSearchParams } from 'react-router-dom';
import { Feather, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { TOOLS_CONFIG } from '../config/tools.config';
import { resetPasswordSubmit } from '../services/authService';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const resetCode = searchParams.get('code');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resetCode) {
      setError('Invalid or missing password reset verification code.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await resetPasswordSubmit(resetCode, password);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setError('Password reset failed. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!resetCode) {
    return (
      <div className="min-h-screen bg-[#F5F3EE] flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center shadow-md shadow-violet-200">
            <Feather className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold">
            <span className="text-stone-850">Nav</span>
            <span className="bg-gradient-to-r from-violet-600 to-violet-400 bg-clip-text text-transparent">Quill</span>
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="w-full max-w-[400px]">
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm px-8 py-10 text-center space-y-6">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shadow-sm">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <h1 className="text-xl font-bold text-stone-900">Link Invalid</h1>
                <p className="text-xs text-stone-400 leading-relaxed max-w-[285px] mx-auto">
                  This password reset link is invalid or expired. Please request a new link from the forgot password page.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/forgot-password"
                  className="w-full py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-sm font-medium text-stone-700 transition-colors duration-150 text-center"
                >
                  Request a new link
                </Link>
                <Link
                  to="/login"
                  className="text-xs text-stone-400 hover:text-stone-650 font-semibold transition-colors pt-1"
                >
                  Back to login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center shadow-md shadow-violet-200">
            <Feather className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold">
            <span className="text-stone-855">Nav</span>
            <span className="bg-gradient-to-r from-violet-600 to-violet-400 bg-clip-text text-transparent font-extrabold">Quill</span>
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm px-8 py-9">
            {!isSuccess ? (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-stone-900">Reset Password</h1>
                  <p className="text-sm text-stone-400 mt-1">Please type a secure new password for your account.</p>
                </div>

                {error && (
                  <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-xs text-red-655 text-center">
                    {error}
                  </div>
                )}

                <form id="reset-password-form" className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="reset-password-input" className="block text-xs font-semibold text-stone-600 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      <input
                        id="reset-password-input"
                        type={showPw ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-850 placeholder-stone-305 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reset-confirm-password" className="block text-xs font-semibold text-stone-600 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      <input
                        id="reset-confirm-password"
                        type={showConfirmPw ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-855 placeholder-stone-305 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                      >
                        {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="reset-submit-btn"
                    type="submit"
                    disabled={isLoading || !password || !confirmPassword}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-semibold hover:from-violet-500 hover:to-violet-400 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-violet-200 group disabled:opacity-60 mt-1 cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center space-y-6 fade-up py-4">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-bounce" />
                  </div>
                  <h1 className="text-xl font-bold text-stone-900">Success!</h1>
                  <p className="text-xs text-stone-400 leading-relaxed max-w-[280px] mx-auto">
                    Your password has been successfully reset. You can now log in with your new password.
                  </p>
                </div>

                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-semibold hover:from-violet-500 hover:to-violet-400 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-violet-200 group"
                >
                  Proceed to Login
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                </Link>
              </div>
            )}
          </div>

          {/* Color strip matches bottom page */}
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
