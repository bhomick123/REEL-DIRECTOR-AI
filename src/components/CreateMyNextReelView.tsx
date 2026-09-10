import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Film,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  Bookmark,
  Share2,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Play,
  Flame,
  Hash,
  ArrowRight,
  HelpCircle,
  Sliders,
  Scissors,
  CheckSquare,
} from 'lucide-react';
import {
  InstagramConnection,
  InstagramPerformanceInsights,
  NextReelConceptResult,
  NextReelHookOption,
  NextReelScriptScene,
} from '../types';

interface CreateMyNextReelViewProps {
  connection: InstagramConnection;
  insights?: InstagramPerformanceInsights;
  onNavigateToInstagram?: () => void;
}

export const CreateMyNextReelView: React.FC<CreateMyNextReelViewProps> = ({
  connection,
  insights,
  onNavigateToInstagram,
}) => {
  const [concept, setConcept] = useState<NextReelConceptResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [focusTopic, setFocusTopic] = useState<string>('');
  const [selectedHookTab, setSelectedHookTab] = useState<number>(1);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Fetch or initialize latest concept
  const fetchConcept = async (topic?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/instagram/create-next-reel', {
        method: topic ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: topic ? JSON.stringify({ focusTopic: topic }) : undefined,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate Next Reel concept');
      }

      const data = await res.json();
      if (data.concept) {
        setConcept(data.concept);
      }
    } catch (err: any) {
      console.error('Error fetching Next Reel concept:', err);
      setError(err.message || 'Unable to connect to AI Director service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConcept();
  }, []);

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleCopyAll = () => {
    if (!concept) return;
    const fullPlan = `=== REEL DIRECTOR AI: CREATE MY NEXT REEL ===
Title: ${concept.reelIdea.title}
Concept: ${concept.reelIdea.concept}
Target Duration: ${concept.reelIdea.targetDuration}
Format: ${concept.reelIdea.contentFormat}
Best Posting Window: ${concept.reelIdea.bestPostingWindow}

--- 3 SCROLL-STOPPING HOOKS (0-3s) ---
1. ${concept.hooks[0]?.hookText} (${concept.hooks[0]?.style})
2. ${concept.hooks[1]?.hookText} (${concept.hooks[1]?.style})
3. ${concept.hooks[2]?.hookText} (${concept.hooks[2]?.style})

--- COMPLETE SHOT-BY-SHOT SCRIPT ---
${concept.script.scenes
  .map(
    (s) =>
      `[Scene ${s.sceneNumber}] ${s.timestamp} - ${s.shotType}
Action: ${s.visualAction}
Audio/Text: ${s.spokenAudioOrText}
Director Note: ${s.directorNote}`
  )
  .join('\n\n')}

Audio Direction: ${concept.script.audioDirection}

--- INSTAGRAM-READY CAPTION ---
${concept.caption}

--- CALL-TO-ACTION (CTA) ---
${concept.cta.primaryText} (${concept.cta.type})

--- HASHTAGS ---
${concept.hashtags.join(' ')}

--- WHY THIS SHOULD WORK (GROUNDED IN REAL DATA) ---
${concept.whyThisShouldWork.explanation}
Data Evidence: ${concept.whyThisShouldWork.dataGroundingEvidence}`;

    handleCopy(fullPlan, 'all');
  };

  const promptSuggestions = [
    'Tailored Blazer & Denim High-Low',
    '3-Second Outfit Transition',
    'Capsule Wardrobe Fit Check',
    'Styling Mistake Pattern Interrupt',
    'Luxury Monochrome Contrast',
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#131422] via-[#0f101b] to-[#0a0a10] border border-white/[0.08] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Feature: Create My Next Reel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-['Syne']">
              Turn Real Performance Data into Your Next Viral Reel
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              No guesswork. Every idea, hook, script, caption, and CTA is mathematically engineered
              using the creator's real Instagram engagement patterns, best-performing Reels, and retention cues.
            </p>
          </div>

          {/* Connected Instagram Account Status Card */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/[0.08] p-4 shrink-0 flex flex-col space-y-2 min-w-[260px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-400">Data Source</span>
              {connection.isConnected ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Real Data Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  <span>Not Connected</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3 pt-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shrink-0">
                <img
                  src={connection.profilePictureUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={connection.username || 'Account'}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {connection.username ? `@${connection.username}` : 'No account connected'}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  {insights ? `${insights.totalReelsAnalyzed} Reels Analyzed` : 'Ready to analyze'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06] text-[10px] text-zinc-400 flex items-center justify-between">
              <span>Privacy Verified</span>
              <span className="text-zinc-500">No DMs or passwords accessed</span>
            </div>
          </div>
        </div>

        {/* Real Data Notice / Insufficient Data Banner */}
        {concept && !concept.hasSufficientData && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{concept.dataNotice || 'Insufficient connected data found. A universal high-retention blueprint has been provided.'}</span>
            </div>
            {onNavigateToInstagram && (
              <button
                onClick={onNavigateToInstagram}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-semibold text-xs border border-amber-500/40 shrink-0 flex items-center space-x-1.5 transition-colors"
              >
                <span>Connect Instagram</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Interactive Custom Generation Controls */}
        <div className="mt-6 pt-6 border-t border-white/[0.08]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchConcept(focusTopic.trim());
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={focusTopic}
                onChange={(e) => setFocusTopic(e.target.value)}
                placeholder="Optional: Enter a specific theme, outfit piece, or angle (e.g. 'Oversized trench coat transition')..."
                className="w-full bg-black/40 border border-white/[0.1] rounded-xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                  <span>Directing Next Reel...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Generate Next Reel</span>
                </>
              )}
            </button>
          </form>

          {/* Prompt Suggestion Chips */}
          <div className="mt-3 flex items-center space-x-2 overflow-x-auto pb-1 text-[11px] text-zinc-400">
            <span className="shrink-0 text-zinc-500">Try asking:</span>
            {promptSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setFocusTopic(item);
                  fetchConcept(item);
                }}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06] transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchConcept()}
            className="text-xs font-bold text-red-200 underline hover:text-white ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content Layout */}
      {concept && (
        <div className="space-y-8">
          {/* Quick Action Bar: Copy All / Status */}
          <div className="flex items-center justify-between bg-[#11121c] border border-white/[0.06] px-5 py-3 rounded-2xl">
            <div className="flex items-center space-x-2 text-xs text-zinc-400">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                Concept synthesized with <strong className="text-white">7 complete production modules</strong> ready to record.
              </span>
            </div>
            <button
              onClick={handleCopyAll}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-medium border border-purple-500/30 transition-all cursor-pointer"
            >
              {copiedSection === 'all' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied Entire Plan!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Complete Production Plan</span>
                </>
              )}
            </button>
          </div>

          {/* ======================================================== */}
          {/* 1. REEL IDEA */}
          {/* ======================================================== */}
          <div className="bg-[#11121d] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                  1
                </div>
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase text-purple-400">
                    Reel Idea & Creative Angle
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['Syne']">
                    {concept.reelIdea.title}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => handleCopy(`${concept.reelIdea.title}\n\n${concept.reelIdea.concept}`, 'idea')}
                className="text-xs text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                title="Copy Idea"
              >
                {copiedSection === 'idea' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed pt-1">
              {concept.reelIdea.concept}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/[0.06]">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <Film className="w-3.5 h-3.5" />
                <span>Format: {concept.reelIdea.contentFormat}</span>
              </div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <Clock className="w-3.5 h-3.5" />
                <span>Target Length: {concept.reelIdea.targetDuration}</span>
              </div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-pink-500/10 text-pink-300 border border-pink-500/20">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Optimal Schedule: {concept.reelIdea.bestPostingWindow}</span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. HOOK (3 Options for First 1-3 Seconds) */}
          {/* ======================================================== */}
          <div className="bg-[#11121d] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                  2
                </div>
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase text-purple-400">
                    Scroll-Stopping Hooks (First 1–3 Seconds)
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white font-['Syne']">
                    3 High-Impact Opening Variations
                  </h3>
                </div>
              </div>

              {/* Hook Option Selector Tabs */}
              <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/[0.06] self-start sm:self-auto">
                {concept.hooks.map((h) => (
                  <button
                    key={h.hookNumber}
                    onClick={() => setSelectedHookTab(h.hookNumber)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedHookTab === h.hookNumber
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Hook #{h.hookNumber}
                  </button>
                ))}
              </div>
            </div>

            {/* Hook Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {concept.hooks.map((h) => {
                const isSelected = selectedHookTab === h.hookNumber;
                return (
                  <div
                    key={h.hookNumber}
                    onClick={() => setSelectedHookTab(h.hookNumber)}
                    className={`relative rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-950/20 border-purple-500/50 shadow-lg shadow-purple-900/20 ring-1 ring-purple-500/40'
                        : 'bg-black/30 border-white/[0.06] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                          Option #{h.hookNumber}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 font-medium">
                          {h.style}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.06]">
                        <p className="text-sm font-semibold text-white italic">
                          "{h.hookText}"
                        </p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                            Delivery Notes (0–1.5s):
                          </span>
                          <p className="text-zinc-300 text-[11px] leading-relaxed">
                            {h.deliveryNotes}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                            Psychological Retention Trigger:
                          </span>
                          <p className="text-zinc-400 text-[11px] leading-relaxed">
                            {h.psychologicalTrigger}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(h.hookText, `hook-${h.hookNumber}`);
                      }}
                      className="mt-4 pt-3 border-t border-white/[0.06] w-full flex items-center justify-center space-x-1.5 text-xs text-purple-300 hover:text-white font-medium transition-colors"
                    >
                      {copiedSection === `hook-${h.hookNumber}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Copied Hook #{h.hookNumber}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Hook #{h.hookNumber}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 3. SCRIPT (Complete Short-Form Shot-by-Shot Guidance) */}
          {/* ======================================================== */}
          <div className="bg-[#11121d] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                  3
                </div>
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase text-purple-400">
                    Shot-by-Shot Reel Script & Direction
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white font-['Syne']">
                    Scene-by-Scene Production Storyboard
                  </h3>
                </div>
              </div>

              <button
                onClick={() => {
                  const scriptText = concept.script.scenes
                    .map(
                      (s) =>
                        `[Scene ${s.sceneNumber}] ${s.timestamp} | ${s.shotType}\nVisual: ${s.visualAction}\nSpoken: ${s.spokenAudioOrText}\nDirector Note: ${s.directorNote}`
                    )
                    .join('\n\n');
                  handleCopy(scriptText, 'script');
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-xs font-medium border border-white/[0.08] transition-colors"
              >
                {copiedSection === 'script' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Script Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Script</span>
                  </>
                )}
              </button>
            </div>

            {/* Scene Timeline Storyboard */}
            <div className="space-y-4">
              {concept.script.scenes.map((scene) => (
                <div
                  key={scene.sceneNumber}
                  className="bg-black/30 border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-1 rounded-md bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
                        Scene {scene.sceneNumber}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        ⏱️ {scene.timestamp}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-indigo-300 bg-indigo-950/40 px-2.5 py-0.5 rounded-md border border-indigo-500/20 self-start sm:self-auto">
                      {scene.shotType}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
                    {/* Visual Action */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Film className="w-3.5 h-3.5 text-purple-400" />
                        <span>Visual Action</span>
                      </span>
                      <p className="text-zinc-200 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/[0.04]">
                        {scene.visualAction}
                      </p>
                    </div>

                    {/* Spoken Audio or Text */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-pink-400" />
                        <span>Spoken Voiceover / Audio Cue</span>
                      </span>
                      <p className="text-zinc-200 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/[0.04]">
                        {scene.spokenAudioOrText}
                      </p>
                    </div>
                  </div>

                  {/* Director & Editorial Note */}
                  <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-start space-x-2 text-xs text-zinc-400">
                    <Sliders className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-zinc-300">Director Note:</strong> {scene.directorNote}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Audio & Filming Checklist Sub-panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-black/30 border border-white/[0.06] rounded-2xl p-4 space-y-2">
                <span className="text-xs font-bold text-zinc-300 flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Audio & Music Direction</span>
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {concept.script.audioDirection}
                </p>
              </div>

              <div className="bg-black/30 border border-white/[0.06] rounded-2xl p-4 space-y-2">
                <span className="text-xs font-bold text-zinc-300 flex items-center space-x-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ready-to-Record Checklist</span>
                </span>
                <ul className="space-y-1">
                  {concept.script.filmingChecklist.map((item, idx) => (
                    <li key={idx} className="text-xs text-zinc-400 flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 4. CAPTION & 5. CTA (Side by Side) */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 4. CAPTION */}
            <div className="bg-[#11121d] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                      4
                    </div>
                    <div>
                      <span className="text-xs font-bold tracking-wider uppercase text-purple-400">
                        Instagram-Ready Caption
                      </span>
                      <h4 className="text-base font-bold text-white">Full Post Copy</h4>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(concept.caption, 'caption')}
                    className="inline-flex items-center space-x-1 text-xs text-purple-300 hover:text-white"
                  >
                    {copiedSection === 'caption' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Caption</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-xs text-zinc-200 leading-relaxed font-sans whitespace-pre-line">
                  {concept.caption}
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 pt-2">
                💡 Formatted with strategic line breaks and binary discussion questions proven to spark replies.
              </p>
            </div>

            {/* 5. CTA & 6. HASHTAGS */}
            <div className="space-y-6">
              {/* 5. CTA */}
              <div className="bg-[#11121d] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                      5
                    </div>
                    <div>
                      <span className="text-xs font-bold tracking-wider uppercase text-purple-400">
                        Targeted Call-to-Action (CTA)
                      </span>
                      <h4 className="text-base font-bold text-white">Algorithmic Conversion Hook</h4>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {concept.cta.type}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                  <p className="text-sm font-bold text-white">
                    "{concept.cta.primaryText}"
                  </p>
                  <p className="text-xs text-zinc-400">
                    <strong className="text-purple-300">Why this CTA:</strong> {concept.cta.rationale}
                  </p>
                </div>
              </div>

              {/* 6. HASHTAGS */}
              <div className="bg-[#11121d] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                      6
                    </div>
                    <div>
                      <span className="text-xs font-bold tracking-wider uppercase text-purple-400">
                        Hashtags
                      </span>
                      <h4 className="text-base font-bold text-white">Curated Discovery Tags</h4>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(concept.hashtags.join(' '), 'hashtags')}
                    className="inline-flex items-center space-x-1 text-xs text-purple-300 hover:text-white"
                  >
                    {copiedSection === 'hashtags' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy All</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {concept.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      onClick={() => handleCopy(tag, `tag-${idx}`)}
                      className="px-3 py-1 rounded-xl bg-black/40 hover:bg-purple-900/30 text-purple-300 border border-white/[0.08] hover:border-purple-500/40 text-xs font-mono transition-colors cursor-pointer"
                    >
                      {copiedSection === `tag-${idx}` ? 'Copied!' : tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 7. WHY THIS SHOULD WORK (GROUNDED IN REAL DATA) */}
          {/* ======================================================== */}
          <div className="bg-gradient-to-br from-[#16132b] via-[#100f21] to-[#0b0b14] border border-purple-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-purple-500/20">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-200 font-bold text-sm">
                  7
                </div>
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase text-purple-400">
                    Data Grounding & Evidence
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white font-['Syne']">
                    Why This Reel Concept Should Work
                  </h3>
                </div>
              </div>

              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Fake Metrics</span>
              </span>
            </div>

            {/* Core Explanation */}
            <div className="space-y-2">
              <p className="text-sm text-zinc-200 leading-relaxed font-medium">
                {concept.whyThisShouldWork.explanation}
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                <strong className="text-zinc-300">Audience Evidence:</strong> {concept.whyThisShouldWork.dataGroundingEvidence}
              </p>
            </div>

            {/* Connected Observed Patterns */}
            {concept.whyThisShouldWork.connectedPatterns.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                  Connected Performance Patterns:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {concept.whyThisShouldWork.connectedPatterns.map((pattern, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-black/40 border border-purple-500/20 text-xs text-zinc-300 flex items-start space-x-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span>{pattern}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Referenced Real Account Metrics */}
            {concept.whyThisShouldWork.metricsReferenced && concept.whyThisShouldWork.metricsReferenced.length > 0 && (
              <div className="pt-3 border-t border-purple-500/20 space-y-2">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Account Signals Used in Synthesis:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {concept.whyThisShouldWork.metricsReferenced.map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-black/40 border border-white/[0.06] rounded-xl p-3 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                        <span>{m.accountMetric}</span>
                        <strong className="text-white">{m.value}</strong>
                      </div>
                      <p className="text-zinc-400 text-[10px] leading-relaxed pt-1">
                        {m.influenceOnConcept}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
