import React from 'react';
import {
  Sparkles,
  Instagram,
  ShieldCheck,
  Activity,
  Brain,
  Radio,
  Sliders,
  CheckCircle2,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { UserProfile, InstagramConnection } from '../types';

interface HeaderProps {
  currentTab: 'director' | 'photo-director' | 'instagram' | 'create-reel' | 'trends' | 'memory' | 'diagnostics';
  setCurrentTab: (tab: 'director' | 'photo-director' | 'instagram' | 'create-reel' | 'trends' | 'memory' | 'diagnostics') => void;
  user: UserProfile;
  instagram: InstagramConnection;
  onOpenPrivacyModal: () => void;
  onOpenDiagnosticsModal: () => void;
  onOpenGoogleAuth: () => void;
  onOpenInstagramModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  user,
  instagram,
  onOpenPrivacyModal,
  onOpenDiagnosticsModal,
  onOpenGoogleAuth,
  onOpenInstagramModal,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0c0d12]/90 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => setCurrentTab('director')}
              className="flex items-center space-x-3 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-400 p-0.5 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#0e0f17] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-['Syne']">
                    REEL DIRECTOR<span className="text-purple-400">.AI</span>
                  </span>
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    FASHION
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 hidden sm:block">
                  Don't guess which Reel to post. Let AI decide.
                </p>
              </div>
            </button>
          </div>

          {/* Center Navigation Bar */}
          <nav className="hidden lg:flex items-center space-x-1 bg-white/[0.03] p-1.5 rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setCurrentTab('director')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'director'
                  ? 'bg-purple-600/90 text-white shadow-sm shadow-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              🎬 Reel Director
            </button>
            <button
              onClick={() => setCurrentTab('photo-director')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                currentTab === 'photo-director'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span>📸 Photo Director</span>
              <span className="px-1.5 py-0.2 rounded bg-purple-400/20 text-purple-300 text-[9px] font-extrabold border border-purple-400/30">
                NEW
              </span>
            </button>
            <button
              onClick={() => setCurrentTab('instagram')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'instagram'
                  ? 'bg-purple-600/90 text-white shadow-sm shadow-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              📊 Instagram Performance
            </button>
            <button
              onClick={() => setCurrentTab('create-reel')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'create-reel'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              ✨ Create My Next Reel
            </button>
            <button
              onClick={() => setCurrentTab('trends')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'trends'
                  ? 'bg-purple-600/90 text-white shadow-sm shadow-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              ⚡ Trend Radar
            </button>
            <button
              onClick={() => setCurrentTab('memory')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'memory'
                  ? 'bg-purple-600/90 text-white shadow-sm shadow-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              🧠 Creator Memory
            </button>
          </nav>

          {/* Right Controls: Google User, Instagram Status, Diagnostics & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Google / Gmail Account Status */}
            {user.isGoogleAuthenticated ? (
              <button
                id="header-google-user-btn"
                onClick={onOpenGoogleAuth}
                className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-xs text-zinc-200 transition-all group"
                title={`Signed in as ${user.email} • Click to manage account`}
              >
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0 shadow-sm overflow-hidden">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                  )}
                </div>
                <span className="hidden sm:inline font-mono text-[11px] text-zinc-300 max-w-[130px] truncate">
                  {user.email}
                </span>
                <span className="sm:hidden font-mono text-[11px] text-zinc-300">
                  {user.name.split(' ')[0]}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </button>
            ) : (
              <button
                id="header-sign-in-google-btn"
                onClick={onOpenGoogleAuth}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs transition-all shadow-sm active:scale-95"
                title="Sign in with Google"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </button>
            )}

            {/* Instagram Connection Pill */}
            {instagram.isConnected ? (
              <button
                id="header-instagram-connected-btn"
                onClick={onOpenInstagramModal}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-all"
                title="Instagram connected to your Google account • Click to view or disconnect"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline font-medium">@{instagram.username || 'connected'}</span>
                <span className="sm:hidden font-medium">IG Live</span>
              </button>
            ) : (
              <button
                id="header-connect-instagram-btn"
                onClick={onOpenInstagramModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-pink-300 text-xs hover:bg-pink-500/30 transition-all"
                title="Connect your Instagram account to this Google profile"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                <span className="font-medium">Connect IG</span>
              </button>
            )}

            {/* Diagnostics Quick Icon */}
            <button
              onClick={onOpenDiagnosticsModal}
              className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06] transition-all"
              title="Developer Diagnostics & System Health"
            >
              <Activity className="w-4 h-4 text-zinc-400" />
            </button>

            {/* Logout Button */}
            <button
              id="header-logout-btn"
              onClick={onLogout}
              className="p-2 rounded-xl bg-red-950/20 hover:bg-red-900/40 text-zinc-400 hover:text-red-300 border border-white/[0.06] hover:border-red-500/30 transition-all"
              title="Log out of Google account"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* User Profile Avatar */}
            <div
              onClick={onOpenPrivacyModal}
              className="cursor-pointer flex items-center space-x-2.5 pl-1"
              title="Connected Data & Creator Settings"
            >
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={user.name}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-white/20 hover:border-purple-400 transition-colors"
              />
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
                <p className="text-[10px] text-zinc-400 truncate max-w-[120px]">
                  {user.brandNiche?.split('&')[0] || 'Fashion Creator'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation */}
        <div className="lg:hidden flex items-center space-x-1 overflow-x-auto pb-3 pt-1 scrollbar-none">
          <button
            onClick={() => setCurrentTab('director')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              currentTab === 'director'
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white bg-white/[0.03]'
            }`}
          >
            🎬 Reel Director
          </button>
          <button
            onClick={() => setCurrentTab('photo-director')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1 ${
              currentTab === 'photo-director'
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white bg-white/[0.03]'
            }`}
          >
            <span>📸 Photo Director</span>
            <span className="px-1 py-0.2 rounded bg-purple-400/20 text-purple-200 text-[8px] font-extrabold">NEW</span>
          </button>
          <button
            onClick={() => setCurrentTab('instagram')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              currentTab === 'instagram'
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white bg-white/[0.03]'
            }`}
          >
            📊 IG Performance
          </button>
          <button
            onClick={() => setCurrentTab('create-reel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              currentTab === 'create-reel'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white bg-white/[0.03]'
            }`}
          >
            ✨ Create Next Reel
          </button>
          <button
            onClick={() => setCurrentTab('trends')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              currentTab === 'trends'
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white bg-white/[0.03]'
            }`}
          >
            ⚡ Trend Radar
          </button>
          <button
            onClick={() => setCurrentTab('memory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              currentTab === 'memory'
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white bg-white/[0.03]'
            }`}
          >
            🧠 Creator Memory
          </button>
        </div>
      </div>
    </header>
  );
};
