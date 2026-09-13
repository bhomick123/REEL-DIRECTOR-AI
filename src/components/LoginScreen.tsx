import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Instagram,
  ArrowRight,
  AlertCircle,
  Film,
  KeyRound,
} from 'lucide-react';
import { UserProfile, InstagramConnection } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile, instagram?: InstagramConnection) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<{
    isConfigured: boolean;
    authUrl?: string;
    clientId?: string;
  }>({ isConfigured: false });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check backend Google OAuth configuration on mount
  useEffect(() => {
    let isMounted = true;
    const checkGoogleConfig = async () => {
      try {
        const res = await fetch('/api/auth/google/url');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setOauthStatus({
              isConfigured: !!data.isConfigured,
              authUrl: data.authUrl,
              clientId: data.clientId,
            });
          }
        }
      } catch (err) {
        console.warn('Could not check Google OAuth endpoint status:', err);
      }
    };
    checkGoogleConfig();

    // Listen for popup auth messages if a popup flow completed
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const { user, instagram } = event.data;
        if (user) {
          onLoginSuccess(user, instagram);
        }
      }
    };
    window.addEventListener('message', handleAuthMessage);
    return () => {
      isMounted = false;
      window.removeEventListener('message', handleAuthMessage);
    };
  }, [onLoginSuccess]);

  // Handle Official "Continue with Google"
  const handleContinueWithGoogle = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();

      if (data.isConfigured && data.authUrl) {
        // Direct redirect to Google's official OAuth consent screen
        window.location.href = data.authUrl;
        return;
      }

      // If Google OAuth credentials are NOT configured: Do NOT authenticate the user.
      // Instead show a clear setup/configuration message.
      setErrorMsg(
        'Google OAuth credentials are not configured on the server. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment secrets to enable live Google sign-in.'
      );
      setLoading(false);
    } catch (err: any) {
      console.error('Google login error:', err);
      setErrorMsg(err.message || 'Could not initiate Google authentication.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a10] text-zinc-100 flex flex-col justify-between relative overflow-hidden font-['Plus_Jakarta_Sans'] selection:bg-purple-600 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-pink-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none" />

      {/* Top Bar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-[#0d0e18] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div>
            <span className="text-sm font-black tracking-wider text-white font-['Syne']">
              REEL DIRECTOR<span className="text-purple-400">.AI</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] text-zinc-400 border border-white/[0.08] font-medium flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span>Secure Authentication</span>
          </span>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="relative rounded-3xl bg-[#11121d]/90 border border-white/[0.08] p-8 shadow-2xl backdrop-blur-xl space-y-6">
            {/* Header / Brand */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-semibold mb-1">
                <Film className="w-3.5 h-3.5 text-purple-400" />
                <span>Fashion & Creative Direction</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Syne']">
                REEL DIRECTOR<span className="text-purple-400">.AI</span>
              </h1>
              <p className="text-sm text-zinc-400 font-medium">
                Your AI Content Director
              </p>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* OAuth Status Notice if Not Configured */}
            {!oauthStatus.isConfigured && !errorMsg && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start space-x-2.5">
                <KeyRound className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-300 mb-0.5">Google OAuth Setup Notice</p>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    Set <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-amber-300">GOOGLE_CLIENT_ID</code> and <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-amber-300">GOOGLE_CLIENT_SECRET</code> in environment secrets to enable live Google authentication.
                  </p>
                </div>
              </div>
            )}

            {/* Primary Action: Continue with Google */}
            <div className="space-y-3 pt-2">
              <button
                id="btn-continue-with-google"
                onClick={handleContinueWithGoogle}
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-sm transition-all duration-200 shadow-xl shadow-white/5 flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-60 group active:scale-[0.99]"
              >
                {/* Official Google 'G' icon */}
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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

                <span className="font-bold tracking-tight">
                  {loading ? 'Authenticating with Google...' : 'Continue with Google'}
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <p className="text-center text-xs text-zinc-400">
                Sign in securely with your Google account.
              </p>
            </div>

            {/* Supporting Architecture Highlights */}
            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <div className="flex items-start space-x-3 text-left">
                <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Instagram className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">
                    Persistent Instagram Link
                  </h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Your connected Instagram profile stays permanently tied to your Google account across sessions.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-left">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">
                    Isolated & Private
                  </h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Zero password collection. Authentication happens via official OAuth dialogs only.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy footer */}
          <div className="text-center mt-6 text-xs text-zinc-500 space-y-1">
            <p>REEL DIRECTOR AI • Fashion Creative Direction Platform</p>
            <p className="text-[11px]">Meta Graph API & Google OAuth Compliant</p>
          </div>
        </div>
      </main>

      {/* Footer minimal padding */}
      <footer className="py-4 text-center text-[11px] text-zinc-600">
        &copy; {new Date().getFullYear()} Reel Director AI. All rights reserved.
      </footer>
    </div>
  );
};
