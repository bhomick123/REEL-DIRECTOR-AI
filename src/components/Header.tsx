import React from 'react';
import { Sparkles, Instagram, ShieldCheck, Activity, Brain, Radio, Sliders, CheckCircle2, ChevronRight } from 'lucide-react';
import { UserProfile, InstagramConnection } from '../types';

interface HeaderProps {
  currentTab: 'director' | 'instagram' | 'create-reel' | 'trends' | 'memory' | 'diagnostics';
  setCurrentTab: (tab: 'director' | 'instagram' | 'create-reel' | 'trends' | 'memory' | 'diagnostics') => void;
  user: UserProfile;
  instagram: InstagramConnection;
  onOpenPrivacyModal: () => void;
  onOpenDiagnosticsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  user,
  instagram,
  onOpenPrivacyModal,
  onOpenDiagnosticsModal,
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'director'
                  ? 'bg-purple-600/90 text-white shadow-sm shadow-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              🎬 Director Suite
            </button>
            <button
              onClick={() => setCurrentTab('instagram')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

          {/* Right Controls: Instagram Status & Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Instagram Connection Pill */}
            {instagram.isConnected ? (
              <button
                onClick={onOpenPrivacyModal}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-all"
                title="Instagram Professional account connected"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline font-medium">@{instagram.username || 'connected'}</span>
                <span className="sm:hidden font-medium">IG Live</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentTab('instagram')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 text-purple-300 text-xs hover:bg-purple-500/20 transition-all"
              >
                <Instagram className="w-3.5 h-3.5 text-purple-400" />
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

            {/* User Profile Avatar */}
            <div
              onClick={onOpenPrivacyModal}
              className="cursor-pointer flex items-center space-x-2.5 pl-1.5 sm:pl-2"
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
            🎬 Director Suite
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
