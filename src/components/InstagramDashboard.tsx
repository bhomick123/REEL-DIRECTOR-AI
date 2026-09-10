import React, { useState, useEffect } from 'react';
import {
  Instagram,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ExternalLink,
  BarChart2,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Calendar,
  Clock,
  RefreshCw,
  Key,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  CheckCircle2,
  HelpCircle,
  Layers,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import {
  InstagramConnection,
  InstagramPerformanceInsights,
  InstagramMediaItem,
} from '../types';

interface InstagramDashboardProps {
  connection: InstagramConnection;
  onRefreshData: () => Promise<void>;
  onOpenPrivacyModal: () => void;
}

export const InstagramDashboard: React.FC<InstagramDashboardProps> = ({
  connection,
  onRefreshData,
  onOpenPrivacyModal,
}) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);
  const [performance, setPerformance] = useState<InstagramPerformanceInsights | null>(null);
  const [recentMedia, setRecentMedia] = useState<InstagramMediaItem[]>([]);
  const [activeSection, setActiveSection] = useState<'analysis' | 'strategy'>('analysis');
  const [statusInfo, setStatusInfo] = useState<{
    isConfigured: boolean;
    configGuide?: { notice: string; steps: string[] } | null;
  }>({ isConfigured: false });

  const fetchStatusAndPerformance = async () => {
    setLoading(true);
    try {
      const [statusRes, perfRes] = await Promise.all([
        fetch('/api/instagram/status'),
        fetch('/api/instagram/performance'),
      ]);

      if (statusRes.ok) {
        const sData = await statusRes.json();
        setStatusInfo({
          isConfigured: sData.isConfigured,
          configGuide: sData.configGuide,
        });
      }

      if (perfRes.ok) {
        const pData = await perfRes.json();
        setPerformance(pData.performance);
        setRecentMedia(pData.recentMedia || []);
      }
    } catch (err) {
      console.error('Error fetching Instagram performance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndPerformance();
  }, [connection.isConnected]);

  const handleLiveRefresh = async () => {
    setRefreshing(true);
    setRefreshToast(null);
    try {
      const res = await fetch('/api/instagram/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.performance) setPerformance(data.performance);
        if (data.recentMedia) setRecentMedia(data.recentMedia);
        setRefreshToast('Live Instagram data refreshed via Meta Graph API.');
      } else {
        // Fall back to standard status refresh
        await fetchStatusAndPerformance();
        await onRefreshData();
        setRefreshToast('Performance metrics refreshed successfully.');
      }
    } catch (err) {
      console.error('Error during live refresh:', err);
      await fetchStatusAndPerformance();
      setRefreshToast('Refreshed account status.');
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshToast(null), 4000);
    }
  };

  const handleConnectInstagram = async () => {
    try {
      const res = await fetch('/api/instagram/auth-url');
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert(
          data.message ||
            'Instagram OAuth credentials (INSTAGRAM_CLIENT_ID & INSTAGRAM_CLIENT_SECRET) are not configured. Check the setup guide below.'
        );
      }
    } catch (err) {
      alert('Could not initiate Meta OAuth. Check server logs.');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight font-['Syne']">
              Instagram Performance & Strategy
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              <span>Official Meta Graph API</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Authentic Reel performance signals, strongest/weakest patterns, and data-backed creative strategies.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {connection.isConnected ? (
            <button
              onClick={onOpenPrivacyModal}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.1] text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Data & Privacy</span>
            </button>
          ) : (
            <button
              onClick={handleConnectInstagram}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Instagram className="w-4 h-4" />
              <span>Connect with Meta OAuth</span>
            </button>
          )}

          <button
            onClick={handleLiveRefresh}
            disabled={loading || refreshing}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer"
            title="Refresh Live Instagram Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin text-purple-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {refreshToast && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{refreshToast}</span>
        </div>
      )}

      {/* Privacy Guarantee Box */}
      <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-start space-x-3 text-xs text-zinc-300">
        <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">Privacy & API Integrity Boundary</p>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            REEL DIRECTOR AI evaluates authentic performance data retrieved directly from your connected Instagram Professional account.
            <strong className="text-zinc-200"> Your private messages (DMs) and passwords are never accessed, requested, or stored.</strong> All metrics are calculated honestly without synthetic multipliers.
          </p>
        </div>
      </div>

      {/* STATE 1: NOT CONNECTED / CREDENTIALS PENDING */}
      {!connection.isConnected && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-[#131422] border border-white/[0.08] text-center max-w-2xl mx-auto space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 mx-auto flex items-center justify-center shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-[#12131d] rounded-[14px] flex items-center justify-center">
                <Instagram className="w-8 h-8 text-pink-400" />
              </div>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white font-['Syne']">
              Connect Instagram Professional to Unlock Performance Intelligence
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              Analyze your actual Reel performance data, isolate strongest and weakest patterns, and receive data-backed strategy recommendations.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleConnectInstagram}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 cursor-pointer transition-all"
              >
                <Instagram className="w-4 h-4" />
                <span>Connect with Meta OAuth</span>
              </button>
            </div>
          </div>

          {/* Meta API Setup Guide */}
          {!statusInfo.isConfigured && statusInfo.configGuide && (
            <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-[#11121d] border border-white/[0.06] space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-['Syne']">
                <Key className="w-4 h-4" />
                <span>Meta App Credentials Configuration</span>
              </div>
              <p className="text-xs text-zinc-400">
                To initiate live OAuth with Meta, configure your credentials in the environment or Settings panel:
              </p>
              <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                {statusInfo.configGuide.steps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* STATE 2: CONNECTED / PERFORMANCE ANALYSIS & STRATEGY */}
      {connection.isConnected && performance && (
        <div className="space-y-8">
          {/* Account Profile Bar */}
          <div className="p-6 rounded-2xl bg-[#131422] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {connection.profilePictureUrl ? (
                <img
                  src={connection.profilePictureUrl}
                  alt={connection.username}
                  className="w-14 h-14 rounded-2xl object-cover border border-purple-500/30 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-purple-600/20 text-purple-300 flex items-center justify-center font-bold text-xl shrink-0">
                  {connection.username?.[0]?.toUpperCase() || 'I'}
                </div>
              )}

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">@{connection.username}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    {connection.accountType || 'Professional'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                    Verified Account
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {connection.followersCount ? connection.followersCount.toLocaleString() : '—'} followers • {connection.mediaCount} published posts • {performance.totalReelsAnalyzed} Reels evaluated
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-xs text-zinc-400 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-white/[0.06]">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500">Peak Window</p>
                <p className="text-sm font-semibold text-white">{performance.bestPerformingDay}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-zinc-500">Account Health</p>
                <p className="text-xl font-black text-emerald-400">{performance.overallScore}/100</p>
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-2">
            <button
              onClick={() => setActiveSection('analysis')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeSection === 'analysis'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Feature 1: Performance Analysis</span>
            </button>

            <button
              onClick={() => setActiveSection('strategy')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeSection === 'strategy'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Feature 2: Content Strategy Recommendations</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* FEATURE 1: INSTAGRAM PERFORMANCE ANALYSIS                */}
          {/* ========================================================= */}
          {activeSection === 'analysis' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Section Subheading */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white font-['Syne'] flex items-center space-x-2">
                    <BarChart2 className="w-5 h-5 text-purple-400" />
                    <span>Real Reel Performance Metrics</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Analyzed across your connected Reel performance data. Missing metrics are never fabricated.
                  </p>
                </div>
                <span className="text-[11px] text-zinc-400 bg-white/[0.04] px-3 py-1 rounded-lg border border-white/[0.06]">
                  {performance.totalReelsAnalyzed} Reels Analyzed
                </span>
              </div>

              {/* 7 Core Performance Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {/* 1. Views / Plays */}
                <div className="p-4 rounded-2xl bg-[#131422] border border-white/[0.08] flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span className="font-semibold text-zinc-300">Views / Plays</span>
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div>
                    {performance.metrics.views.isAvailable ? (
                      <p className="text-lg sm:text-xl font-black text-white">
                        {performance.metrics.views.formatted}
                      </p>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium block w-fit">
                        Not reported by API
                      </span>
                    )}
                    <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                      {performance.metrics.views.description}
                    </p>
                  </div>
                </div>

                {/* 2. Reach */}
                <div className="p-4 rounded-2xl bg-[#131422] border border-white/[0.08] flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span className="font-semibold text-zinc-300">Reach</span>
                    <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div>
                    {performance.metrics.reach.isAvailable ? (
                      <p className="text-lg sm:text-xl font-black text-white">
                        {performance.metrics.reach.formatted}
                      </p>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium block w-fit">
                        Not reported by API
                      </span>
                    )}
                    <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                      {performance.metrics.reach.description}
                    </p>
                  </div>
                </div>

                {/* 3. Likes */}
                <div className="p-4 rounded-2xl bg-[#131422] border border-white/[0.08] flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span className="font-semibold text-zinc-300">Avg Likes</span>
                    <Heart className="w-3.5 h-3.5 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-black text-pink-300">
                      {performance.metrics.likes.formatted}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                      {performance.metrics.likes.description}
                    </p>
                  </div>
                </div>

                {/* 4. Comments */}
                <div className="p-4 rounded-2xl bg-[#131422] border border-white/[0.08] flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span className="font-semibold text-zinc-300">Avg Comments</span>
                    <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-black text-cyan-300">
                      {performance.metrics.comments.formatted}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                      {performance.metrics.comments.description}
                    </p>
                  </div>
                </div>

                {/* 5. Shares */}
                <div className="p-4 rounded-2xl bg-[#131422] border border-white/[0.08] flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span className="font-semibold text-zinc-300">Avg Shares</span>
                    <Share2 className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div>
                    {performance.metrics.shares.isAvailable ? (
                      <p className="text-lg sm:text-xl font-black text-blue-300">
                        {performance.metrics.shares.formatted}
                      </p>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium block w-fit">
                        Not reported by API
                      </span>
                    )}
                    <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                      {performance.metrics.shares.description}
                    </p>
                  </div>
                </div>

                {/* 6. Saves */}
                <div className="p-4 rounded-2xl bg-[#131422] border border-white/[0.08] flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span className="font-semibold text-zinc-300">Avg Saves</span>
                    <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    {performance.metrics.saves.isAvailable ? (
                      <p className="text-lg sm:text-xl font-black text-amber-300">
                        {performance.metrics.saves.formatted}
                      </p>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium block w-fit">
                        Not reported by API
                      </span>
                    )}
                    <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                      {performance.metrics.saves.description}
                    </p>
                  </div>
                </div>

                {/* 7. Engagement Rate */}
                <div className="p-4 rounded-2xl bg-[#131422] border border-white/[0.08] flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span className="font-semibold text-zinc-300">Engagement</span>
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-black text-emerald-400">
                      {performance.metrics.engagementRate.formatted}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                      {performance.metrics.engagementRate.calculationNote || performance.metrics.engagementRate.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Strongest & Weakest Performance Patterns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* STRONGEST PATTERNS */}
                <div className="p-6 rounded-2xl bg-[#131422] border border-emerald-500/20 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne']">
                        Strongest Performance Patterns
                      </h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20">
                      High Growth Signals
                    </span>
                  </div>

                  <div className="space-y-3">
                    {performance.strongestPatterns.map((pattern, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-[#161828] border border-white/[0.06] space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-emerald-300">{pattern.title}</p>
                          <span className="text-[10px] text-zinc-400 bg-emerald-950/40 px-2 py-0.5 rounded font-mono">
                            Pattern #{idx + 1}
                          </span>
                        </div>
                        <p className="text-xs text-white leading-relaxed font-medium">{pattern.finding}</p>
                        <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04] text-[11px] text-zinc-300">
                          <strong className="text-zinc-200">Real Data Evidence: </strong>
                          <span>{pattern.evidence}</span>
                        </div>
                        <p className="text-[11px] text-emerald-400/90 font-medium">
                          <strong>Actionable Insight: </strong>
                          {pattern.takeaway}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WEAKEST PATTERNS */}
                <div className="p-6 rounded-2xl bg-[#131422] border border-amber-500/20 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne']">
                        Weakest Performance Patterns
                      </h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">
                      Bottlenecks to Avoid
                    </span>
                  </div>

                  <div className="space-y-3">
                    {performance.weakestPatterns.map((pattern, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-[#161828] border border-white/[0.06] space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-amber-300">{pattern.title}</p>
                          <span className="text-[10px] text-zinc-400 bg-amber-950/40 px-2 py-0.5 rounded font-mono">
                            Pattern #{idx + 1}
                          </span>
                        </div>
                        <p className="text-xs text-white leading-relaxed font-medium">{pattern.finding}</p>
                        <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04] text-[11px] text-zinc-300">
                          <strong className="text-zinc-200">Observed Dropoff: </strong>
                          <span>{pattern.evidence}</span>
                        </div>
                        <p className="text-[11px] text-amber-400/90 font-medium">
                          <strong>Correction Step: </strong>
                          {pattern.takeaway}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Contrast: Top Reel vs Lowest Reel */}
              {(performance.bestPerformingReel || performance.lowestPerformingReel) && (
                <div className="p-6 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne'] flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Reel Performance Contrast (Top Performer vs Lowest Performer)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Top Performer Card */}
                    {performance.bestPerformingReel && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/20 to-[#18192a] border border-emerald-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
                            ★ Top Performing Reel
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {performance.bestPerformingReel.publishedDate}
                          </span>
                        </div>

                        <p className="text-xs text-white font-medium line-clamp-2 leading-relaxed">
                          "{performance.bestPerformingReel.caption}"
                        </p>

                        <div className="flex items-center space-x-4 text-xs font-bold">
                          <span className="text-pink-300 flex items-center space-x-1">
                            <Heart className="w-3.5 h-3.5" />
                            <span>{performance.bestPerformingReel.likes.toLocaleString()} likes</span>
                          </span>
                          <span className="text-cyan-300 flex items-center space-x-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{performance.bestPerformingReel.comments.toLocaleString()} comments</span>
                          </span>
                          {performance.bestPerformingReel.views != null && (
                            <span className="text-purple-300 flex items-center space-x-1">
                              <Eye className="w-3.5 h-3.5" />
                              <span>{performance.bestPerformingReel.views.toLocaleString()} plays</span>
                            </span>
                          )}
                        </div>

                        <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 text-[11px] text-emerald-300 leading-relaxed">
                          <strong>Why It Won: </strong>
                          {performance.bestPerformingReel.whyItWon}
                        </div>

                        {performance.bestPerformingReel.permalink && (
                          <a
                            href={performance.bestPerformingReel.permalink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-zinc-400 hover:text-white flex items-center space-x-1 w-fit transition-colors pt-1"
                          >
                            <span>View on Instagram</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Lowest Performer Card */}
                    {performance.lowestPerformingReel && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/20 to-[#18192a] border border-amber-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                            Lowest Performing Reel
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {performance.lowestPerformingReel.publishedDate}
                          </span>
                        </div>

                        <p className="text-xs text-white font-medium line-clamp-2 leading-relaxed">
                          "{performance.lowestPerformingReel.caption}"
                        </p>

                        <div className="flex items-center space-x-4 text-xs font-bold">
                          <span className="text-zinc-300 flex items-center space-x-1">
                            <Heart className="w-3.5 h-3.5 text-pink-400" />
                            <span>{performance.lowestPerformingReel.likes.toLocaleString()} likes</span>
                          </span>
                          <span className="text-zinc-300 flex items-center space-x-1">
                            <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{performance.lowestPerformingReel.comments.toLocaleString()} comments</span>
                          </span>
                          {performance.lowestPerformingReel.views != null && (
                            <span className="text-zinc-300 flex items-center space-x-1">
                              <Eye className="w-3.5 h-3.5 text-purple-400" />
                              <span>{performance.lowestPerformingReel.views.toLocaleString()} plays</span>
                            </span>
                          )}
                        </div>

                        <div className="p-2.5 rounded-lg bg-black/40 border border-amber-500/20 text-[11px] text-amber-300 leading-relaxed">
                          <strong>Identified Bottleneck: </strong>
                          {performance.lowestPerformingReel.bottleneck}
                        </div>

                        {performance.lowestPerformingReel.permalink && (
                          <a
                            href={performance.lowestPerformingReel.permalink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-zinc-400 hover:text-white flex items-center space-x-1 w-fit transition-colors pt-1"
                          >
                            <span>View on Instagram</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Published Reels Feed Table */}
              {recentMedia.length > 0 && (
                <div className="p-6 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne']">
                        Imported Media Items & Engagement
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Directly retrieved from your Instagram Graph API profile endpoint.
                      </p>
                    </div>
                    <span className="text-xs text-zinc-400 font-mono">
                      {recentMedia.length} posts retrieved
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentMedia.map((item, idx) => {
                      const isTop = performance.bestPerformingReel?.id === item.id;
                      return (
                        <div
                          key={item.id || idx}
                          className={`p-4 rounded-xl bg-[#161828] border transition-all flex flex-col justify-between space-y-3 ${
                            isTop ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' : 'border-white/[0.06]'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] text-zinc-400">
                              <span className="px-2 py-0.5 rounded bg-white/[0.05] font-semibold text-zinc-300 uppercase">
                                {item.mediaProductType || item.mediaType}
                              </span>
                              <span>
                                {new Date(item.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>

                            {item.thumbnailUrl && (
                              <div className="relative aspect-[9/10] w-full rounded-lg overflow-hidden bg-black/40">
                                <img
                                  src={item.thumbnailUrl}
                                  alt="Instagram Reel Cover"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                {isTop && (
                                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-purple-600 text-white font-bold text-[10px] shadow">
                                    ★ Top Performer
                                  </span>
                                )}
                              </div>
                            )}

                            <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed">
                              {item.caption || 'No caption provided.'}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-3">
                              <span className="text-pink-300 flex items-center space-x-1 font-semibold">
                                <Heart className="w-3.5 h-3.5" />
                                <span>{(item.likeCount || 0).toLocaleString()}</span>
                              </span>
                              <span className="text-cyan-300 flex items-center space-x-1 font-semibold">
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{(item.commentsCount || 0).toLocaleString()}</span>
                              </span>
                            </div>

                            {item.permalink && (
                              <a
                                href={item.permalink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-zinc-400 hover:text-white transition-colors"
                                title="View on Instagram"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* FEATURE 2: CONTENT STRATEGY RECOMMENDATIONS              */}
          {/* ========================================================= */}
          {activeSection === 'strategy' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Section Subheading */}
              <div>
                <h2 className="text-lg font-bold text-white font-['Syne'] flex items-center space-x-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  <span>Data-Backed Content Strategy Recommendations</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Formulated strictly from your actual Instagram performance data and winning audience signals.
                </p>
              </div>

              {/* HIGHLIGHT: RECOMMEND WHAT REEL TO MAKE NEXT */}
              {performance.nextReelRecommendation && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-950/40 via-[#131422] to-[#18192a] border border-purple-500/30 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-300 font-['Syne']">
                        Recommended Next Reel to Create
                      </span>
                    </div>
                    <span className="text-[11px] px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30 font-semibold w-fit">
                      Target Release: {performance.nextReelRecommendation.suggestedPostingDayAndTime}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight font-['Syne']">
                      {performance.nextReelRecommendation.conceptTitle}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Core Hook & Format */}
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          Opening Hook (0.0s – 1.0s)
                        </p>
                        <p className="text-xs text-white leading-relaxed font-medium">
                          {performance.nextReelRecommendation.coreHook}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          Visual Format & Cut Pacing
                        </p>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {performance.nextReelRecommendation.visualFormat}
                        </p>
                      </div>
                    </div>

                    {/* Caption Prompt & Rationale */}
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          Caption Discussion Prompt
                        </p>
                        <p className="text-xs text-cyan-300 leading-relaxed font-medium">
                          {performance.nextReelRecommendation.captionPrompt}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 space-y-1">
                        <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                          Why This Will Outperform (Based on Real Data)
                        </p>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {performance.nextReelRecommendation.whyThisWillWork}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DETECTED CONTENT THEMES */}
              {performance.contentThemesDetected && performance.contentThemesDetected.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider font-['Syne']">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Top Themes Identified From Your Real Captions</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {performance.contentThemesDetected.map((theme, idx) => (
                      <div
                        key={idx}
                        className="px-3.5 py-2 rounded-xl bg-[#18192a] border border-white/[0.06] flex items-center space-x-2.5 text-xs"
                      >
                        <span className="font-semibold text-white">{theme.theme}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                          {theme.count} post{theme.count > 1 ? 's' : ''}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          avg {theme.avgLikes.toLocaleString()} likes
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3 TO 5 ACTIONABLE CONTENT RECOMMENDATIONS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne']">
                    Actionable Strategy Playbook ({performance.strategyRecommendations.length} Recommendations)
                  </h3>
                  <span className="text-xs text-zinc-400">
                    Grounded in your real account metrics
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {performance.strategyRecommendations.map((rec, idx) => {
                    const priorityStyles = {
                      High: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      Medium: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                      Test: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                    }[rec.priority] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

                    return (
                      <div
                        key={rec.id || idx}
                        className="p-5 rounded-2xl bg-[#131422] border border-white/[0.08] hover:border-white/[0.14] transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-full bg-white/[0.05] text-zinc-300 text-xs font-bold flex items-center justify-center font-mono">
                              {idx + 1}
                            </span>
                            <h4 className="text-sm font-bold text-white font-['Syne']">{rec.title}</h4>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${priorityStyles}`}>
                              {rec.priority} Priority
                            </span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 font-medium border border-white/[0.06]">
                              {rec.category}
                            </span>
                          </div>
                        </div>

                        {/* Action Step */}
                        <div className="p-3.5 rounded-xl bg-[#171829] border border-white/[0.06] text-xs text-zinc-200 leading-relaxed">
                          <strong className="text-purple-300">Action Step: </strong>
                          <span>{rec.actionableStep}</span>
                        </div>

                        {/* WHY Based on Actual Performance */}
                        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-zinc-300 leading-relaxed">
                          <div className="flex items-center space-x-1.5 text-purple-300 font-semibold mb-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>WHY based on your actual performance data:</span>
                          </div>
                          <p className="text-zinc-300 text-[11px] leading-relaxed">
                            {rec.whyBasedOnActualData}
                          </p>
                          <div className="mt-2 text-[10px] font-mono text-purple-200/80 bg-black/30 px-2 py-1 rounded w-fit">
                            Metric Proof: {rec.supportingMetrics}
                          </div>
                        </div>

                        {/* Expected Impact */}
                        <div className="flex items-center space-x-2 text-[11px] text-emerald-400 font-medium pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Expected Impact: {rec.expectedImpact}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
