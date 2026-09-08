import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Clock, Sparkles, Scissors, CheckCircle, Volume2, Film, ShieldAlert, TrendingUp, ChevronRight, Zap } from 'lucide-react';
import { ReelAnalysisResult } from '../types';
import { FASHION_SHOOT_SAMPLES } from '../data/sampleReels';
import { AskDirectorChat } from './AskDirectorChat';

interface ReelDetailModalProps {
  reel: ReelAnalysisResult;
  onClose: () => void;
  onSelectForContentPack?: (reel: ReelAnalysisResult) => void;
}

export const ReelDetailModal: React.FC<ReelDetailModalProps> = ({
  reel,
  onClose,
  onSelectForContentPack,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'timeline' | 'subscores' | 'visual_audio' | 'improve' | 'director_chat'>('timeline');
  const videoRef = useRef<HTMLVideoElement>(null);

  const sampleMatch = FASHION_SHOOT_SAMPLES.find(
    (s) => s.reelNumber === reel.reelNumber || s.fileName === reel.fileName
  );
  const videoSource =
    (reel.videoUrl && reel.videoUrl.trim() !== '' ? reel.videoUrl : null) ||
    (reel.previewUrl && reel.previewUrl.trim() !== '' ? reel.previewUrl : null) ||
    (sampleMatch?.videoUrl || null);

  const coverImage =
    (reel.coverRecommendation?.previewUrl && reel.coverRecommendation.previewUrl.trim() !== ''
      ? reel.coverRecommendation.previewUrl
      : null) ||
    (sampleMatch?.thumbnailUrl || null);

  useEffect(() => {
    // If a recommended cover timestamp exists, seek the video to that frame on load so the user sees the recommended cover frame
    if (typeof reel.coverRecommendation?.timestamp === 'number') {
      const coverTime = Math.max(0, Math.min(reel.coverRecommendation.timestamp, reel.durationSeconds));
      const seekCover = () => {
        if (videoRef.current) {
          videoRef.current.currentTime = coverTime;
          setCurrentTime(coverTime);
        }
      };
      const v = videoRef.current;
      if (v) {
        if (v.readyState >= 1) {
          seekCover();
        } else {
          v.addEventListener('loadedmetadata', seekCover, { once: true });
        }
      }
    }

    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch {
          // clean ignore on unmount
        }
      }
    };
  }, [reel.coverRecommendation?.timestamp, reel.durationSeconds]);

  const togglePlay = () => {
    if (!videoRef.current || !videoSource) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              console.warn('Video playback notice:', err.message || err);
            }
            setIsPlaying(false);
          });
      }
    }
  };

  const jumpToTimestamp = (seconds: number) => {
    if (!videoRef.current) return;
    const clampedTime = Math.max(0, Math.min(seconds, reel.durationSeconds));
    videoRef.current.currentTime = clampedTime;
    setCurrentTime(clampedTime);

    if (videoSource) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            if (err.name !== 'AbortError') {
              console.warn('Video jump notice:', err.message || err);
            }
          });
      }
    }
  };

  // Helper to parse timestamp strings like "00:02.4" to seconds
  const parseTimeToSeconds = (rangeStr: string): number => {
    const match = rangeStr.match(/(\d+):(\d+(\.\d+)?)/);
    if (match) {
      const minutes = parseFloat(match[1]);
      const seconds = parseFloat(match[2]);
      return minutes * 60 + seconds;
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0f1019] rounded-3xl border border-white/[0.1] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#121320]">
          <div className="flex items-center space-x-3">
            <div className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold font-['Syne']">
              Reel #{reel.reelNumber}
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
              {reel.fileName}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {onSelectForContentPack && (
              <button
                onClick={() => {
                  onSelectForContentPack(reel);
                  onClose();
                }}
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md"
              >
                Use this Reel for Content Pack
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content: 2-Column Split (Video Left, Analysis Tabs Right) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Video Player & Key Scores (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* 9:16 Video Player Container */}
            <div className="relative aspect-[9/15] bg-black rounded-2xl overflow-hidden border border-white/[0.08] group flex items-center justify-center shadow-lg">
              {videoSource ? (
                <video
                  ref={videoRef}
                  src={videoSource}
                  className="w-full h-full object-cover"
                  playsInline
                  onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
                  onEnded={() => setIsPlaying(false)}
                  onError={() => setIsPlaying(false)}
                />
              ) : coverImage ? (
                <img
                  src={coverImage}
                  alt={reel.fileName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600">
                  <Film className="w-12 h-12" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

              {/* Central Play/Pause Button */}
              {videoSource && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-purple-600/90 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/20 z-10"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </button>
              )}

              {/* Bottom Scrubber & Time */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-zinc-300 z-10">
                <span className="font-mono">{currentTime.toFixed(1)}s</span>
                <span className="font-mono text-zinc-400">{reel.durationSeconds.toFixed(1)}s</span>
              </div>
            </div>

            {/* Quick Seek to Recommended Cover Frame */}
            {reel.coverRecommendation && (
              <button
                type="button"
                onClick={() => jumpToTimestamp(reel.coverRecommendation.timestamp)}
                className="w-full px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Recommended Cover Frame ({reel.coverRecommendation.formattedTime})</span>
                </div>
                <span className="text-[10px] text-purple-300 font-mono bg-purple-500/20 px-1.5 py-0.5 rounded">Seek</span>
              </button>
            )}

            {/* Overall Score & Viral Potential Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-[#151625] border border-white/[0.08] text-center">
                <p className="text-[11px] text-zinc-400 font-semibold uppercase">Overall Score</p>
                <p className="text-3xl font-black text-white">{reel.overallScore}<span className="text-xs text-purple-400">/100</span></p>
                <p className="text-[10px] text-zinc-400 mt-1">Weighted composite</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#151625] border border-white/[0.08] text-center">
                <p className="text-[11px] text-zinc-400 font-semibold uppercase">Viral Potential</p>
                <p className={`text-2xl font-black ${
                  reel.viralPotential.level === 'Very High' ? 'text-emerald-400' :
                  reel.viralPotential.level === 'High' ? 'text-purple-400' : 'text-amber-400'
                }`}>
                  {reel.viralPotential.level}
                </p>
                <p className="text-[10px] text-zinc-400 mt-1">{reel.viralPotential.score}/100 estimate</p>
              </div>
            </div>

            {/* Scroll-Stop Test Box */}
            <div className="p-4 rounded-2xl bg-[#151625] border border-purple-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-['Syne']">
                  Scroll-Stop Score
                </span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300">
                  {reel.scrollStopScore}/100
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {reel.scrollStopRationale}
              </p>
              <p className="text-[10px] text-zinc-500 italic">
                *AI estimate based on visual contrast and motion acceleration. Not a guaranteed viewer metric.
              </p>
            </div>
          </div>

          {/* Right Column: Tabbed Intelligence (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Tabs Header */}
            <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  activeTab === 'timeline'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white bg-white/[0.03]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Exact Timeline Notes</span>
              </button>
              <button
                onClick={() => setActiveTab('subscores')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  activeTab === 'subscores'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white bg-white/[0.03]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>13 Subscores</span>
              </button>
              <button
                onClick={() => setActiveTab('visual_audio')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  activeTab === 'visual_audio'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white bg-white/[0.03]'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Visual & Audio</span>
              </button>
              <button
                onClick={() => setActiveTab('improve')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  activeTab === 'improve'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white bg-white/[0.03]'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>One-Click Improve</span>
              </button>
              <button
                onClick={() => setActiveTab('director_chat')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  activeTab === 'director_chat'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white bg-white/[0.03]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>Ask Director</span>
              </button>
            </div>

            {/* TAB 1: EXACT TIMELINE FEEDBACK (SIGNATURE FEATURE) */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne']">
                      Second-by-Second Editing Directives
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Concrete timestamp cuts and trims. Click any timestamp to jump the preview video.
                    </p>
                  </div>
                </div>

                {reel.sceneCuts && reel.sceneCuts.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#121320] border border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-200 flex items-center space-x-1.5 font-['Syne']">
                        <Scissors className="w-3.5 h-3.5 text-purple-400" />
                        <span>Detected Scene Transitions ({reel.sceneCuts.length})</span>
                      </span>
                      <span className="text-[10px] text-zinc-400">Algorithmic luminance cut detection</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {reel.sceneCuts.map((cut, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => jumpToTimestamp(cut.timestamp)}
                          className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-white border border-purple-500/20 text-[11px] font-mono transition-colors cursor-pointer"
                        >
                          Cut at {cut.timestamp.toFixed(2)}s ({Math.round(cut.confidence * 100)}% shift)
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  {reel.timelineFeedback.map((note, idx) => {
                    const parsedSeconds = parseTimeToSeconds(note.timestampRange);
                    return (
                      <div
                        key={idx}
                        onClick={() => jumpToTimestamp(parsedSeconds)}
                        className="group p-3.5 rounded-xl bg-[#141523] border border-white/[0.06] hover:border-purple-500/40 transition-all cursor-pointer flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-extrabold text-purple-300 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20">
                              {note.timestampRange}
                            </span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              note.type === 'keep' ? 'bg-emerald-500/10 text-emerald-400' :
                              note.type === 'trim' || note.type === 'cut' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-indigo-500/10 text-indigo-300'
                            }`}>
                              {note.type}
                            </span>
                            <span className="text-xs font-bold text-white">{note.title}</span>
                          </div>
                          <p className="text-xs text-zinc-300 pl-0.5 leading-relaxed">
                            {note.suggestion}
                          </p>
                        </div>

                        {note.impactScore && (
                          <span className="shrink-0 text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20">
                            {note.impactScore}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: SUBSCORES */}
            {activeTab === 'subscores' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne']">
                  13 Weighted Fashion & Engagement Subscores
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(reel.subscores).map(([key, rawVal]) => {
                    const val = Number(rawVal) || 0;
                    const formattedTitle = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase());

                    return (
                      <div key={key} className="p-3 rounded-xl bg-[#141523] border border-white/[0.06] space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-300 font-medium">{formattedTitle}</span>
                          <span className="font-bold text-white">{val}/100</span>
                        </div>
                        <div className="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              val >= 90 ? 'bg-purple-500' : val >= 80 ? 'bg-indigo-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: VISUAL & AUDIO */}
            {activeTab === 'visual_audio' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne']">
                  Creative Pillar Breakdown
                </h3>

                {/* Visual Analysis */}
                <div className="p-4 rounded-2xl bg-[#141523] border border-white/[0.06] space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-purple-400 font-bold">
                    <Film className="w-4 h-4" />
                    <span>Visual Aesthetics & Styling</span>
                  </div>
                  <div className="space-y-1.5 text-zinc-300">
                    <p><strong>Opening Frame:</strong> {reel.visualAnalysis.openingFrameQuality}</p>
                    <p><strong>Lighting & Tone:</strong> {reel.visualAnalysis.lightingAndColor}</p>
                    <p><strong>Outfit Presentation:</strong> {reel.visualAnalysis.outfitDetailsAndStyling}</p>
                    <p><strong>Composition:</strong> {reel.visualAnalysis.compositionAndCameraWork}</p>
                    <p><strong>Overall Aesthetic:</strong> {reel.visualAnalysis.aestheticVibe}</p>
                  </div>
                </div>

                {/* Audio Analysis */}
                <div className="p-4 rounded-2xl bg-[#141523] border border-white/[0.06] space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-indigo-400 font-bold">
                    <Volume2 className="w-4 h-4" />
                    <span>Audio Profile & Strategy</span>
                  </div>
                  <div className="space-y-1.5 text-zinc-300">
                    <p><strong>Action:</strong> {reel.audioStrategy.action}</p>
                    <p><strong>Recommended Style:</strong> {reel.audioStrategy.tempoMoodDirection}</p>
                    <p><strong>Notes:</strong> {reel.audioStrategy.notes}</p>
                    <p><strong>Track Presence:</strong> {reel.audioAnalysis.audioDirection}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ONE CLICK IMPROVE */}
            {activeTab === 'improve' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne']">
                      One-Click Improvement Engine
                    </h3>
                    <p className="text-xs text-zinc-400">
                      The minimum high-impact edits required to raise this Reel's score before posting.
                    </p>
                  </div>
                </div>

                {/* Before vs After Estimate Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#151626] to-indigo-950/40 border border-purple-500/30 flex items-center justify-around text-center">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Current Score</p>
                    <p className="text-2xl sm:text-3xl font-black text-white">{reel.overallScore}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ChevronRight className="w-6 h-6 text-purple-400 animate-pulse" />
                    <span className="text-[10px] text-purple-300 font-semibold">+ {reel.potentialScoreAfterImprovement - reel.overallScore} pts</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-purple-300">Potential Score</p>
                    <p className="text-2xl sm:text-3xl font-black text-purple-400">{reel.potentialScoreAfterImprovement}</p>
                  </div>
                </div>

                {/* Specific Improvement Steps */}
                <div className="space-y-2.5">
                  {reel.improvementSteps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="p-3.5 rounded-xl bg-[#141523] border border-white/[0.06] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold flex items-center justify-center shrink-0">
                          {step.stepNumber}
                        </span>
                        <p className="text-xs text-zinc-200">{step.description}</p>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                        +{step.estimatedLift} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: ASK REEL DIRECTOR (SPECIFIC REEL CONTEXT) */}
            {activeTab === 'director_chat' && (
              <div className="space-y-2">
                <AskDirectorChat
                  activeReel={reel}
                  onSeekToTimestamp={jumpToTimestamp}
                  className="border-white/[0.08] bg-[#0c0d15]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#121320] flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            Reel #{reel.reelNumber} — Ready for export or content package generation.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-semibold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
