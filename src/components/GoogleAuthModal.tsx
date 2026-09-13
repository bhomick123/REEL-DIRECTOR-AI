import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  LogOut,
  Sparkles,
  Shield,
  ArrowRight,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { UserProfile } from '../types';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthConfigured, setOauthConfigured] = useState<boolean>(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const checkOAuth = async () => {
      try {
        const res = await fetch('/api/auth/google/url');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setOauthConfigured(!!data.isConfigured);
            if (data.authUrl) setAuthUrl(data.authUrl);
          }
        }
      } catch (err) {
        console.warn('Failed to check Google OAuth URL:', err);
      }
    };
    checkOAuth();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContinueWithGoogle = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();

      if (data.isConfigured && data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }

      setError(
        'Google OAuth credentials are not configured on the server. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables to enable live authentication.'
      );
      setIsLoading(false);
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setError(err.message || 'Failed to initiate Google authentication.');
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    onLogout();
    onClose();
  };

  return (
    <div
      id="google-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="google-auth-dialog"
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl p-6 sm:p-8 text-zinc-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md p-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                Google Account
              </h2>
              <p className="text-xs text-zinc-400">Authenticated creator session</p>
            </div>
          </div>
          <button
            id="close-google-auth-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-5 relative z-10">
          {currentUser?.isGoogleAuthenticated ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-200">Google Account Active</h4>
                  <p className="text-xs text-zinc-300 mt-1">
                    Your authenticated Google session is active. Connected Instagram profiles and analyses are secured under your verified account.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500/50 bg-indigo-950 flex items-center justify-center text-white font-bold">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      currentUser.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{currentUser.name}</p>
                    <p className="text-xs text-indigo-300 font-mono">{currentUser.email}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 mt-1">
                      Verified Session
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  id="google-sign-out-btn"
                  onClick={handleSignOut}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Google</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-2.5 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Unauthenticated state */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 flex items-start space-x-2.5">
                <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Sign in with Google using official OAuth 2.0. Your session is protected by cryptographic server-side tokens.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {!oauthConfigured && !error && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start space-x-2.5">
                  <KeyRound className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-300 mb-0.5">Google OAuth Setup Required</p>
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">
                      Set <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-amber-300">GOOGLE_CLIENT_ID</code> and <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-amber-300">GOOGLE_CLIENT_SECRET</code> in environment secrets to enable live Google sign-in.
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                id="modal-google-login-btn"
                onClick={handleContinueWithGoogle}
                disabled={isLoading}
                className="w-full p-3.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-sm flex items-center justify-center space-x-3 transition-all shadow-lg hover:shadow-white/10 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-600" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500 relative z-10">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Cryptographic Session</span>
          </div>
          <span>Safe & Isolated</span>
        </div>
      </div>
    </div>
  );
};
