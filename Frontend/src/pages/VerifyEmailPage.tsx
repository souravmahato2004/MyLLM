import { Link, useSearchParams } from 'react-router-dom';
import { Feather, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { TOOLS_CONFIG } from '../config/tools.config';
import { authService } from '../services/authService';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const verificationCode = searchParams.get('code');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    verificationCode ? 'loading' : 'error'
  );

  const verificationPromiseRef = useRef<{ code: string; promise: Promise<{ message: string }> } | null>(null);

  useEffect(() => {
    if (!verificationCode) return;

    if (!verificationPromiseRef.current || verificationPromiseRef.current.code !== verificationCode) {
      verificationPromiseRef.current = {
        code: verificationCode,
        promise: authService.verifyEmail(verificationCode)
      };
    }

    let isCurrent = true;

    verificationPromiseRef.current.promise
      .then(() => {
        if (isCurrent) {
          setStatus('success');
        }
      })
      .catch(() => {
        if (isCurrent) setStatus('error');
      });

    return () => {
      isCurrent = false;
    };
  }, [verificationCode]);

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
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm px-8 py-10">
            {status === 'loading' && (
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-6">
                <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
                <div>
                  <h1 className="text-xl font-bold text-stone-900">Verifying Email</h1>
                  <p className="text-sm text-stone-400 mt-1">Please wait while we confirm your email verification link...</p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-6 fade-up py-4">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-bounce" />
                  </div>
                  <h1 className="text-xl font-bold text-stone-900">Email Verified!</h1>
                  <p className="text-xs text-stone-400 leading-relaxed max-w-[280px] mx-auto">
                    Your account has been successfully verified. You are ready to start writing with NavQuill.
                  </p>
                </div>

                <Link
                  id="verify-proceed-btn"
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-semibold hover:from-violet-500 hover:to-violet-400 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-violet-200 group"
                >
                  Proceed to Login
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-6 fade-up py-4">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shadow-sm">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <h1 className="text-xl font-bold text-stone-900">Verification Failed</h1>
                  <p className="text-xs text-stone-400 leading-relaxed max-w-[280px] mx-auto">
                    This email verification link is invalid, expired, or corrupted. Please register again or contact support.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    to="/register"
                    className="w-full py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-sm font-medium text-stone-700 transition-colors duration-150 text-center"
                  >
                    Create a new account
                  </Link>
                  <Link
                    to="/login"
                    className="text-xs text-stone-405 hover:text-stone-650 font-semibold transition-colors pt-1"
                  >
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
