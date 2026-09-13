import React from 'react';
import {
  Film,
  Camera,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  MessageSquare,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { UnifiedContentRecommendation, UnifiedRecommendationType } from '../types';

interface UnifiedDirectorCardProps {
  recommendation: UnifiedContentRecommendation | null;
  isLoading: boolean;
  userPreference: 'REEL' | 'PHOTO' | 'CAROUSEL' | null;
  onSelectPreference: (pref: 'REEL' | 'PHOTO' | 'CAROUSEL' | null) => void;
  onRefresh: () => void;
  onNavigateToReel?: () => void;
  onNavigateToPhotos?: () => void;
  onAskDirector?: (starterQuery?: string) => void;
  hasReels: boolean;
  hasPhotos: boolean;
  className?: string;
}

export const UnifiedDirectorCard: React.FC<UnifiedDirectorCardProps> = ({
  recommendation,
  isLoading,
  userPreference,
  onSelectPreference,
  onRefresh,
  onNavigateToReel,
  onNavigateToPhotos,
  onAskDirector,
  hasReels,
  hasPhotos,
  className = '',
}) => {
  const getVerdictBadge = (type: UnifiedRecommendationType) => {
    switch (type) {
      case 'REEL':
        return {
          label: 'POST THE REEL',
          bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          dot: 'bg-purple-400',
          icon: Film,
        };
      case 'SINGLE_PHOTO':
        return {
          label: 'POST SINGLE PHOTO',
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400',
          icon: Camera,
        };
      case 'CAROUSEL':
        return {
          label: 'POST THE CAROUSEL',
          bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
          dot: 'bg-indigo-400',
          icon: Layers,
        };
      case 'DONT_POST':
        return {
          label: "DON'T POST ANY OF THESE YET",
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-400',
          icon: XCircle,
        };
      case 'NOT_ENOUGH_DATA':
      default:
        return {
          label: 'NOT ENOUGH DATA YET',
          bg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
          dot: 'bg-zinc-500',
          icon: HelpCircle,
        };
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const upper = confidence?.toUpperCase();
    switch (upper) {
      case 'HIGH':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-950/40 border-amber-500/30';
      case 'LOW':
      default:
        return 'text-zinc-400 bg-zinc-900 border-zinc-700';
    }
  };

  const badge = recommendation
    ? getVerdictBadge(recommendation.recommendationType)
    : getVerdictBadge('NOT_ENOUGH_DATA');
  const BadgeIcon = badge.icon;

  return (
    <div
      id="unified-director-card"
      className={`relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#12131e] via-[#0d0e17] to-[#090a10] p-6 sm:p-8 shadow-2xl transition-all ${className}`}
    >
      {/* Decorative subtle background aura */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-purple-600/10 blur-[90px]" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-600/10 blur-[80px]" />

      {/* Top Bar: Title & Controls */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-['Syne']">
              What Should I Post?
            </h2>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Your content director's decision across all analyzed Reels & Photos.
          </p>
        </div>

        {/* Action Controls & Format Preference */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preference filter pills */}
          <div className="flex items-center rounded-xl bg-black/40 p-1 border border-white/[0.06]">
            <button
              onClick={() => onSelectPreference(null)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                userPreference === null
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Let AI pick the best format objectively"
            >
              All Formats
            </button>
            <button
              onClick={() => onSelectPreference('REEL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                userPreference === 'REEL'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Force evaluation prioritizing Reels"
            >
              Prefer Reel
            </button>
            <button
              onClick={() => onSelectPreference('CAROUSEL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                userPreference === 'CAROUSEL'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Force evaluation prioritizing Carousels"
            >
              Prefer Carousel
            </button>
            <button
              onClick={() => onSelectPreference('PHOTO')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                userPreference === 'PHOTO'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Force evaluation prioritizing Single Photos"
            >
              Prefer Photo
            </button>
          </div>

          {/* Re-evaluate button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-50"
            title="Re-evaluate recommendation"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="relative z-10 mt-6">
        {isLoading ? (
          <div className="space-y-4 py-8 text-center animate-pulse">
            <div className="mx-auto h-8 w-48 rounded-full bg-white/10" />
            <div className="mx-auto h-6 w-96 max-w-full rounded bg-white/5" />
            <div className="mx-auto h-20 w-full max-w-xl rounded-xl bg-white/5" />
            <p className="text-xs text-zinc-500 font-mono mt-3">
              Synthesizing Reel video pacing, photo aesthetics, and Instagram engagement evidence...
            </p>
          </div>
        ) : !recommendation || recommendation.recommendationType === 'NOT_ENOUGH_DATA' ? (
          /* Scenario: NOT ENOUGH DATA YET */
          <div className="rounded-xl border border-white/[0.08] bg-black/30 p-6 sm:p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/80 border border-zinc-700 text-zinc-400 mb-4">
              <HelpCircle className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider uppercase bg-zinc-800 text-zinc-300 border border-zinc-700 mb-3">
              Not enough data yet
            </span>
            <h3 className="text-lg font-bold text-white mb-2">
              {recommendation?.headline || 'No Content Available to Compare'}
            </h3>
            <p className="text-sm text-zinc-400 max-w-lg mx-auto mb-6">
              {recommendation?.reasoning ||
                'To generate an evidence-based recommendation on what to post today, upload and analyze at least one Reel in Reel Director or a set of photos in Photo Director.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {onNavigateToReel && (
                <button
                  onClick={onNavigateToReel}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/20"
                >
                  <Film className="h-4 w-4" />
                  <span>Analyze Reels in Reel Director</span>
                </button>
              )}
              {onNavigateToPhotos && (
                <button
                  onClick={onNavigateToPhotos}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all"
                >
                  <Camera className="h-4 w-4" />
                  <span>Analyze Photos in Photo Director</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Concrete Evidence-Based Recommendation */
          <div className="space-y-6">
            {/* Top Decision Hero Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-black/40 p-5 backdrop-blur-sm">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider uppercase border ${badge.bg}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${badge.dot} animate-pulse`} />
                    <BadgeIcon className="h-3.5 w-3.5" />
                    <span>{badge.label}</span>
                  </span>

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border ${getConfidenceBadge(
                      recommendation.confidence
                    )}`}
                  >
                    Confidence: {recommendation.confidence}
                  </span>

                  {recommendation.userPreferenceApplied &&
                    recommendation.userPreferenceApplied !== 'NONE' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-purple-950/60 border border-purple-500/30 text-purple-300">
                        <SlidersHorizontal className="h-3 w-3" />
                        <span>Preference: {recommendation.userPreferenceApplied}</span>
                      </span>
                    )}
                </div>

                <div className="pt-1">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {recommendation.selectedTitle}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-300 leading-relaxed max-w-3xl">
                    {recommendation.reasoning}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row md:flex-col gap-2 shrink-0">
                {recommendation.recommendationType === 'REEL' && onNavigateToReel && (
                  <button
                    onClick={onNavigateToReel}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/25"
                  >
                    <Film className="h-4 w-4" />
                    <span>View Winning Reel</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}

                {(recommendation.recommendationType === 'SINGLE_PHOTO' ||
                  recommendation.recommendationType === 'CAROUSEL') &&
                  onNavigateToPhotos && (
                    <button
                      onClick={onNavigateToPhotos}
                      className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/25"
                    >
                      <Layers className="h-4 w-4" />
                      <span>View Photo Set & Flow</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}

                {onAskDirector && (
                  <button
                    onClick={() =>
                      onAskDirector(
                        recommendation.recommendationType === 'REEL'
                          ? 'Why should I post the Reel?'
                          : recommendation.recommendationType === 'CAROUSEL'
                          ? 'Why should I post the carousel?'
                          : 'Why did you choose this single photo?'
                      )
                    }
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 text-xs font-bold transition-all"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
                    <span>Ask Director Why</span>
                  </button>
                )}
              </div>
            </div>

            {/* Evidence Grid: Why vs Watch Out For */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Why (Evidence Points) */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-5">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Why Post This (Evidence)</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-zinc-300">
                  {recommendation.evidence.map((point, i) => (
                    <li key={i} className="flex items-start space-x-2 leading-relaxed">
                      <span className="text-emerald-400 font-bold select-none">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Watch Out For (Specific Risks / Caveats) */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-5">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-3">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Watch Out For</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-zinc-300">
                  {recommendation.risks.length > 0 ? (
                    recommendation.risks.map((risk, i) => (
                      <li key={i} className="flex items-start space-x-2 leading-relaxed">
                        <span className="text-amber-400 font-bold select-none">•</span>
                        <span>{risk}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-zinc-500 italic">No significant creative risks flagged.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Alternative & Posting Time Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Alternative Option */}
              <div className="rounded-xl border border-white/[0.08] bg-black/30 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-1.5">
                    <ArrowRight className="h-3.5 w-3.5" />
                    <span>Alternative Option</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {recommendation.alternativeOption || 'None necessary today.'}
                  </p>
                </div>
                <div className="mt-3 flex items-center space-x-2 text-[11px] text-zinc-500">
                  <span>Available in your shoot session</span>
                </div>
              </div>

              {/* Posting Schedule Window (Phase 1 Logic Reused) */}
              <div className="rounded-xl border border-white/[0.08] bg-black/30 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-zinc-400 font-bold text-xs uppercase tracking-wider mb-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Recommended Posting Window</span>
                  </div>

                  {(recommendation.postingDataState === 'SUFFICIENT' ||
                    recommendation.hasSufficientPostingData) &&
                  recommendation.recommendedPostingDay !== 'Not enough data yet' ? (
                    <div>
                      <p className="text-sm font-bold text-white">
                        {recommendation.recommendedPostingDay} •{' '}
                        <span className="text-indigo-400">{recommendation.recommendedPostingTime}</span>
                      </p>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        {recommendation.postingWindowRationale}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-zinc-400 flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-xs">
                          Not enough data yet
                        </span>
                      </p>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Connect your Instagram Professional account and provide sufficient historical data
                        to calculate a personalized posting window.
                      </p>
                    </div>
                  )}
                </div>

                {recommendation.postingDataNotice && (
                  <div className="mt-2 text-[10px] font-mono text-zinc-500 border-t border-white/[0.04] pt-1">
                    {recommendation.postingDataNotice}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
