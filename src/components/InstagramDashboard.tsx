import React, { useState, useEffect } from 'react';
import { Instagram, ShieldCheck, AlertCircle, Sparkles, ExternalLink, BarChart2, Eye, Heart, MessageCircle, Bookmark, Share2, Calendar, Clock, RefreshCw, Key } from 'lucide-react';
import { InstagramConnection, InstagramPerformanceInsights, InstagramMediaItem } from '../types';

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
  const [performance, setPerformance] = useState<InstagramPerformanceInsights | null>(null);
  const [recentMedia, setRecentMedia] = useState<InstagramMediaItem[]>([]);
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
              My Instagram Performance
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
              Official Meta Graph API
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real performance signals, engagement health, and content patterns for your Professional Instagram account.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {connection.isConnected ? (
            <button
              onClick={onOpenPrivacyModal}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.1] text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Connected Data & Privacy</span>
            </button>
          ) : (
            <button
              onClick={handleConnectInstagram}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Instagram className="w-4 h-4" />
              <span>Connect Instagram Professional</span>
            </button>
          )}

          <button
            onClick={fetchStatusAndPerformance}
            disabled={loading}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06] transition-all"
            title="Refresh Account Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Strict Privacy Explanation Box */}
      <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-start space-x-3 text-xs text-zinc-300">
        <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">Privacy Guarantee</p>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            REEL DIRECTOR AI only requests the official Instagram permissions needed for content and performance analysis.
            <strong className="text-zinc-300"> Your Instagram messages (DMs) are never accessed or requested.</strong> No passwords are ever stored or requested.
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
              Connect Instagram to Unlock Creator Insights
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              We never fabricate data. To see your actual Reel views, engagement rates, and personalized posting windows, connect your Instagram Creator or Business account.
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

          {/* Meta API Setup Guide for Developers / Creators */}
          {!statusInfo.isConfigured && statusInfo.configGuide && (
            <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-[#11121d] border border-white/[0.06] space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-['Syne']">
                <Key className="w-4 h-4" />
                <span>Meta App Credentials Configuration Guide</span>
              </div>
              <p className="text-xs text-zinc-400">
                To connect live accounts, add your Meta Developer credentials in the environment or Settings panel:
              </p>
              <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                {statusInfo.configGuide.steps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">{step}</li>
                ))}
              </ul>
              <p className="text-[11px] text-zinc-500 pt-1">
                *Reel Video Analysis, multi-take shootout, timeline feedback, and hooks work fully right now without connecting Instagram!
              </p>
            </div>
          )}
        </div>
      )}

      {/* STATE 2: CONNECTED / ACTUAL PERFORMANCE DISPLAY */}
      {connection.isConnected && performance && (
        <div className="space-y-6">
          {/* Account Profile Bar */}
          <div className="p-6 rounded-2xl bg-[#131422] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {connection.profilePictureUrl ? (
                <img
                  src={connection.profilePictureUrl}
                  alt={connection.username}
                  className="w-14 h-14 rounded-2xl object-cover border border-purple-500/30"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-purple-600/20 text-purple-300 flex items-center justify-center font-bold text-xl">
                  {connection.username?.[0]?.toUpperCase() || 'I'}
                </div>
              )}

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">@{connection.username}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    {connection.accountType || 'Professional'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  {connection.followersCount?.toLocaleString()} followers • {connection.mediaCount} total posts
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs text-zinc-400">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-zinc-500">Account Health</p>
                <p className="text-xl font-black text-emerald-400">{performance.overallScore}/100</p>
              </div>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-1">
              <div className="flex items-center space-x-2 text-zinc-400 text-xs">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>Avg Reel Views</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">
                {performance.averageReelViews > 0 ? performance.averageReelViews.toLocaleString() : '—'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-1">
              <div className="flex items-center space-x-2 text-zinc-400 text-xs">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Avg Reach</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">
                {performance.averageReach > 0 ? performance.averageReach.toLocaleString() : '—'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-1">
              <div className="flex items-center space-x-2 text-zinc-400 text-xs">
                <Heart className="w-3.5 h-3.5 text-pink-400" />
                <span>Engagement Rate</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-pink-300">
                {performance.engagementRate > 0 ? `${performance.engagementRate}%` : '—'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-1">
              <div className="flex items-center space-x-2 text-zinc-400 text-xs">
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span>Avg Saves</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-300">
                {performance.averageSaves > 0 ? performance.averageSaves.toLocaleString() : '—'}
              </p>
            </div>
          </div>

          {/* Content Patterns & Best Posting Window */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Content Patterns */}
            <div className="p-6 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-4">
              <div className="flex items-center space-x-2 text-white">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-['Syne']">
                  Detected Content Patterns
                </h3>
              </div>

              <div className="space-y-2.5">
                {performance.contentPatterns.map((pattern, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#18192a] border border-white/[0.06] text-xs text-zinc-300 flex items-start space-x-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>{pattern}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Posting Schedule */}
            <div className="p-6 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-4">
              <div className="flex items-center space-x-2 text-white">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-['Syne']">
                  Best Posting Schedule
                </h3>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-400">Peak Reach Day</p>
                    <p className="text-sm font-bold text-white">{performance.bestPerformingDay}</p>
                  </div>
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>

                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-400">Optimal Reel Window</p>
                    <p className="text-sm font-bold text-white">{performance.bestPostingTimeWindow}</p>
                  </div>
                  <Clock className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
