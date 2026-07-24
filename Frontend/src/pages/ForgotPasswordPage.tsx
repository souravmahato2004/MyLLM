import { Link } from 'react-router-dom';
import { Feather, Mail, ArrowLeft, Loader2, CheckCircle2, Inbox } from 'lucide-react';
import { useState } from 'react';
import { TOOLS_CONFIG } from '../config/tools.config';
import { sendResetLink } from '../services/authService';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);

    try {
      await sendResetLink(email);
      setIsSent(true);
    } catch {
      // Sim stub fallback
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
          Remembered password?{' '}
          <Link to="/login" className="text-violet-600 hover:text-violet-500 font-semibold transition-colors">
            Log in
          </Link>
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm px-8 py-9">
            {!isSent ? (
              <>
                <div className="text-center mb-7">
                  <h1 className="text-2xl font-bold text-stone-900">Forgot Password?</h1>
                  <p className="text-sm text-stone-400 mt-1">
                    Enter your email address to receive a link to reset your password.
                  </p>
                </div>

                <form id="forgot-password-form" className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="forgot-email" className="block text-xs font-semibold text-stone-600 mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <button
                    id="forgot-submit-btn"
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-semibold hover:from-violet-500 hover:to-violet-400 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-violet-200 group disabled:opacity-60 mt-1 cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-750 font-semibold transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to login
                    </Link>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center space-y-6 fade-up">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-bounce" />
                  </div>
                  <h1 className="text-xl font-bold text-stone-900">Email Link Sent!</h1>
                  <p className="text-xs text-stone-500 leading-relaxed max-w-[280px] mx-auto">
                    We have simulated sending a recovery email to <strong className="text-stone-700">{email}</strong>.
                  </p>
                </div>

                {/* Developer Mock Email Sandbox Box */}
                <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-4 text-left">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-[10px] mb-3 uppercase tracking-wider">
                    <Inbox className="w-3.5 h-3.5 text-amber-505 animate-pulse" />
                    <span>Dev Sandbox: Outgoing Email</span>
                  </div>

                  <div className="bg-white border border-stone-200/50 rounded-xl p-3 shadow-sm text-[11px] text-stone-700 space-y-2.5">
                    <div className="border-b border-stone-100 pb-2 space-y-1 text-[10px] text-stone-505">
                      <div><span className="font-semibold text-stone-400">From:</span> NavQuill Accounts &lt;no-reply@navquill.com&gt;</div>
                      <div><span className="font-semibold text-stone-400">To:</span> {email}</div>
                      <div><span className="font-semibold text-stone-400">Subject:</span> Reset your NavQuill Password</div>
                    </div>

                    <div className="space-y-2 pt-0.5">
                      <p className="leading-relaxed">Hi there,</p>
                      <p className="leading-relaxed">We received a request to reset your password. Please click the button below to set a new password:</p>

                      <div className="py-1.5 text-center">
                        <Link
                          id="dev-mock-reset-btn"
                          to={`/reset-password?code=rst_dev_hash_${encodeURIComponent(email)}`}
                          className="inline-flex items-center justify-center px-4 py-2 bg-violet-600 hover:bg-violet-755 text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
                        >
                          Reset Password
                        </Link>
                      </div>

                      <p className="text-[9px] text-stone-400 leading-relaxed border-t border-stone-100 pt-2">
                        If you did not request a password reset, you can safely ignore this email.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-750 font-semibold transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to login
                  </Link>
                </div>
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
