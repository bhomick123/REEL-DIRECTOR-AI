import React, { useState, useEffect } from 'react';
import {
  X,
  Instagram,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  ArrowRight,
  LogOut,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { InstagramConnection, UserProfile } from '../types';
import { fetchWithAuth } from '../utils/authClient';

interface InstagramConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  instagram: InstagramConnection;
  user: UserProfile;
  onConnectSuccess: (connection: InstagramConnection) => void;
  onDisconnect: () => void;
  onOpenGoogleAuth: () => void;
}

export const InstagramConnectModal: React.FC<InstagramConnectModalProps> = ({
  isOpen,
  onClose,
  instagram,
  user,
  onConnectSuccess,
  onDisconnect,
  onOpenGoogleAuth,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metaOAuthConfig, setMetaOAuthConfig] = useState<{
    isConfigured: boolean;
    authUrl?: string;
  }>({ isConfigured: false });

  // Check Meta OAuth configuration when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const checkMetaConfig = async () => {
      try {
        const res = await fetchWithAuth('/api/instagram/auth-url');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setMetaOAuthConfig({
              isConfigured: !!data.isConfigured,
              authUrl: data.authUrl,
            });
          }
        }
      } catch (err) {
        console.warn('Could not check Instagram OAuth status:', err);
      }
    };

    checkMetaConfig();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartMetaOAuth = () => {
    if (!metaOAuthConfig.isConfigured || !metaOAuthConfig.authUrl) {
      setError(
        'Meta Developer App credentials (INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET) are not configured. Configure them in environment secrets to enable live Instagram OAuth.'
      );
      return;
    }

    // Direct redirect to Meta's official OAuth consent screen
    window.location.href = metaOAuthConfig.authUrl;
  };

  const handleDisconnectConfirm = async () => {
    if (!confirm('Are you sure you want to disconnect this Instagram account?')) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/instagram/disconnect', {
        method: 'POST',
      });
      if (res.ok) {
        onDisconnect();
        onClose();
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.error || 'Failed to disconnect Instagram.');
      }
    } catch (err: any) {
      console.error('Error disconnecting:', err);
      setError(err.message || 'Failed to disconnect Instagram.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="instagram-connect-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="instagram-connect-dialog"
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl p-6 sm:p-8 text-zinc-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient glow */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg p-2">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                Instagram Connection
              </h2>
              <p className="text-xs text-zinc-400">
                Official Meta Graph API Integration
              </p>
            </div>
          </div>
          <button
            id="close-instagram-connect-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-5 relative z-10 max-h-[75vh] overflow-y-auto pr-1">
          {/* Linked Account Banner */}
          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="text-xs">
                <span className="text-zinc-400">Authenticated Session: </span>
                <span className="text-white font-mono font-semibold">
                  {user?.email || 'Logged In Creator'}
                </span>
              </div>
            </div>
            {!user?.isGoogleAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGoogleAuth();
                }}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Sign in with Google
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {instagram.isConnected ? (
            /* Currently Connected View */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-200">
                    Instagram Account Verified & Connected
                  </h4>
                  <p className="text-xs text-zinc-300 mt-1">
                    Your Instagram professional account is verified and linked to your session. Real metrics and insights are fetched directly via Meta Graph API.
                  </p>
                </div>
              </div>

              {/* Profile Card */}
              <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-pink-500/50 bg-pink-950 flex items-center justify-center">
                    {instagram.profilePictureUrl ? (
                      <img
                        src={instagram.profilePictureUrl}
                        alt={instagram.username}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Instagram className="w-6 h-6 text-pink-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      @{instagram.username}
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {instagram.accountType || 'CREATOR'} Account • {instagram.followersCount ? instagram.followersCount.toLocaleString() + ' Followers' : 'Active'}
                    </p>
                    {instagram.permissionsGranted && instagram.permissionsGranted.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {instagram.permissionsGranted.map((perm) => (
                          <span
                            key={perm}
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-pink-950/60 text-pink-300 border border-pink-500/20"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  id="disconnect-instagram-btn"
                  onClick={handleDisconnectConfirm}
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect Instagram</span>
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
            /* Disconnected state: Real OAuth or Setup Instructions */
            <div className="space-y-4">
              {metaOAuthConfig.isConfigured ? (
                /* Meta OAuth Configured - Real Connect Flow */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-pink-950/20 border border-pink-500/20 text-xs text-pink-200 space-y-2">
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      Live Meta OAuth Ready
                    </p>
                    <p className="text-zinc-300 leading-relaxed">
                      Click below to authenticate with Meta and link your Instagram Professional (Creator/Business) account. Ownership and insights are cryptographically verified through Meta Graph API.
                    </p>
                  </div>

                  <button
                    type="button"
                    id="connect-meta-oauth-btn"
                    onClick={handleStartMetaOAuth}
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:opacity-95 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-pink-900/20 cursor-pointer"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>Connect Instagram with Meta OAuth</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Meta OAuth Not Configured - Setup Notice */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-2">
                    <div className="flex items-center space-x-2 text-amber-300 font-semibold">
                      <KeyRound className="w-4 h-4" />
                      <span>Meta Developer Configuration Required</span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed">
                      To connect a real Instagram account, Meta App credentials must be configured on the server:
                    </p>
                    <div className="p-2.5 rounded-lg bg-black/40 font-mono text-[11px] text-pink-300 space-y-1">
                      <div>INSTAGRAM_CLIENT_ID=&lt;your_meta_app_id&gt;</div>
                      <div>INSTAGRAM_CLIENT_SECRET=&lt;your_meta_app_secret&gt;</div>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Simulated handle connections have been disabled to ensure authentic data grounding. Only real Meta Graph API tokens are accepted.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="w-full py-3 px-4 rounded-xl bg-white/[0.05] border border-white/10 text-zinc-500 text-xs font-semibold flex items-center justify-center space-x-2 cursor-not-allowed"
                  >
                    <Instagram className="w-4 h-4 text-zinc-600" />
                    <span>Meta OAuth Integration Disabled (Credentials Required)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500 relative z-10">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Meta Graph API v19.0</span>
          </div>
          <span>Strict Data Grounding</span>
        </div>
      </div>
    </div>
  );
};
