import React from 'react';
import { Trophy, Award, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Eye, Play, Flame, BarChart3, Clock } from 'lucide-react';
import { MultiReelComparison, ReelAnalysisResult } from '../types';
import { AskDirectorChat } from './AskDirectorChat';

interface MultiReelComparisonViewProps {
  comparison: MultiReelComparison;
  userNiche?: string;
  onSelectReelDetail: (reel: ReelAnalysisResult) => void;
  onViewContentPack: (winnerReel: ReelAnalysisResult) => void;
  onNewAnalysis: () => void;
}

export const MultiReelComparisonView: React.FC<MultiReelComparisonViewProps> = ({
  comparison,
  userNiche,
  onSelectReelDetail,
  onViewContentPack,
  onNewAnalysis,
}) => {
  const winner = comparison.reels.find((r) => r.isWinner) || comparison.reels[0];
  const runnerUp = comparison.reels.find((r) => r.rank === 2);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner: Winner Announcement */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#1c162e] via-[#141424] to-[#10111a] border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Director Winner Selected</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-['Syne']">
              Post <span className="text-purple-400">Reel #{winner.reelNumber}</span> — {winner.overallScore}/100 Score
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Out of {comparison.reels.length} variations evaluated, Reel #{winner.reelNumber} achieved the highest composite
              score for scroll-stop hook power, outfit silhouette presentation, and transition cut pacing.
            </p>
          </div>

          {/* Quick Winner Metric Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center min-w-[100px]">
              <p className="text-[10px] text-zinc-400 uppercase font-semibold">Overall</p>
              <p className="text-xl sm:text-2xl font-black text-white">{winner.overallScore}<span className="text-xs text-purple-400">/100</span></p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center min-w-[100px]">
              <p className="text-[10px] text-zinc-400 uppercase font-semibold">Scroll Stop</p>
              <p className="text-xl sm:text-2xl font-black text-amber-300">{winner.scrollStopScore}<span className="text-xs text-zinc-400">/100</span></p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center min-w-[100px]">
              <p className="text-[10px] text-zinc-400 uppercase font-semibold">Fashion Vibe</p>
              <p className="text-xl sm:text-2xl font-black text-purple-300">{winner.subscores.fashionPresentation}<span className="text-xs text-zinc-400">/100</span></p>
            </div>
            <button
              onClick={() => onViewContentPack(winner)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>Get Final Content Pack</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Why this Reel Wins vs Why Second Place Lost */}
        <div className="mt-8 pt-6 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Why Winner Won */}
          <div className="space-y-3 bg-[#131422]/80 p-4 sm:p-5 rounded-2xl border border-purple-500/20">
            <div className="flex items-center space-x-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-['Syne']">
                Why Reel #{winner.reelNumber} Wins
              </h3>
            </div>
            <ul className="text-xs text-zinc-300 space-y-2 leading-relaxed">
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Strongest Opening:</strong> {comparison.winnerRationale.strongestOpening}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Best Outfit Presentation:</strong> {comparison.winnerRationale.bestOutfitPresentation}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Cut Pacing:</strong> {comparison.winnerRationale.bestPacing}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Audio & Ending:</strong> {comparison.winnerRationale.bestAudioSync}</span>
              </li>
            </ul>
          </div>

          {/* Why Runner Up Lost */}
          {comparison.secondPlaceCritique && runnerUp && (
            <div className="space-y-3 bg-[#131422]/80 p-4 sm:p-5 rounded-2xl border border-amber-500/20">
              <div className="flex items-center space-x-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-['Syne']">
                  Why Reel #{runnerUp.reelNumber} Lost (Runner-Up)
                </h3>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {comparison.secondPlaceCritique.whyItLost}
              </p>
              <div className="pt-2 text-[11px] text-zinc-400 border-t border-white/[0.05] flex items-center justify-between">
                <span>Score difference: <strong>{winner.overallScore - runnerUp.overallScore} points</strong></span>
                <button
                  onClick={() => onSelectReelDetail(runnerUp)}
                  className="text-purple-300 hover:text-purple-200 underline font-medium"
                >
                  Inspect Reel #{runnerUp.reelNumber} timeline
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparative Matrix: All Uploaded Variations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight font-['Syne']">
              Shootout Ranking ({comparison.reels.length} Variations)
            </h3>
            <p className="text-xs text-zinc-400">
              Click any Reel card to inspect exact timestamp edit recommendations and subscore breakdowns.
            </p>
          </div>
          <button
            onClick={onNewAnalysis}
            className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02]"
          >
            + New Shootout
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {comparison.reels.map((reel) => {
            const isFirst = reel.rank === 1;
            const isSecond = reel.rank === 2;
            const isThird = reel.rank === 3;

            return (
              <div
                key={reel.id}
                onClick={() => onSelectReelDetail(reel)}
                className={`group relative bg-[#141522] rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                  isFirst
                    ? 'border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/10'
                    : 'border-white/[0.08] hover:border-purple-500/40'
                }`}
              >
                {/* 9:16 Thumbnail Preview Container */}
                <div className="relative aspect-[9/13] bg-black overflow-hidden">
                  {reel.coverRecommendation?.previewUrl ? (
                    <img
                      src={reel.coverRecommendation.previewUrl}
                      alt={reel.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600">
                      <Play className="w-8 h-8" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />

                  {/* Rank Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    {isFirst ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-black font-extrabold text-xs shadow-md flex items-center space-x-1">
                        <span>🥇 WINNER</span>
                      </span>
                    ) : isSecond ? (
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-200 text-black font-bold text-xs shadow-md">
                        🥈 2nd Place
                      </span>
                    ) : isThird ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-700/80 text-white font-bold text-xs shadow-md">
                        🥉 3rd Place
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-black/70 text-zinc-300 font-medium text-xs">
                        #{reel.rank}
                      </span>
                    )}
                  </div>

                  {/* Duration & Size */}
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] text-zinc-300">
                    {reel.durationSeconds.toFixed(1)}s
                  </div>

                  {/* Bottom Score Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <p className="text-xs font-bold text-white truncate">Reel #{reel.reelNumber}</p>
                    <p className="text-[10px] text-zinc-400 truncate mb-1">{reel.fileName}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black text-white">{reel.overallScore}<span className="text-xs text-purple-400">/100</span></span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                        Hook {reel.scrollStopScore}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subscore Bar Preview */}
                <div className="p-3.5 space-y-2 bg-[#12131d] border-t border-white/[0.06]">
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between text-zinc-400">
                      <span>Fashion Presentation</span>
                      <span className="font-semibold text-zinc-200">{reel.subscores.fashionPresentation}</span>
                    </div>
                    <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full"
                        style={{ width: `${reel.subscores.fashionPresentation}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between text-zinc-400">
                      <span>Cut Pacing</span>
                      <span className="font-semibold text-zinc-200">{reel.subscores.pacing}</span>
                    </div>
                    <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${reel.subscores.pacing}%` }}
                      />
                    </div>
                  </div>

                  <button className="w-full mt-2 py-1.5 text-center text-[11px] font-semibold text-purple-400 hover:text-purple-300 group-hover:underline flex items-center justify-center space-x-1">
                    <span>Inspect Timeline Feedback</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ask Your Reel Director — Context-Aware Studio Chat */}
      <AskDirectorChat comparison={comparison} userNiche={userNiche} />
    </div>
  );
};
