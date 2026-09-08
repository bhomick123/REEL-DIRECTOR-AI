import React, { useState } from 'react';
import { Copy, Check, Sparkles, Hash, Tag, Clock, Calendar, CheckSquare, Music, Image as ImageIcon, ArrowLeft, Download, ShieldCheck, AlertCircle } from 'lucide-react';
import { ReelAnalysisResult, MultiReelComparison } from '../types';

interface ContentPackViewProps {
  reel: ReelAnalysisResult;
  comparison?: MultiReelComparison | null;
  onBackToComparison: () => void;
}

export const ContentPackView: React.FC<ContentPackViewProps> = ({
  reel,
  comparison,
  onBackToComparison,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [selectedCaptionType, setSelectedCaptionType] = useState<'minimalPremium' | 'casualCreator' | 'highEngagement'>('minimalPremium');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    vertical: true,
    quality: true,
    audio: true,
    opening: true,
    cover: false,
    caption: false,
    hashtags: false,
    time: false,
  });

  const hasPostingData = comparison?.hasSufficientPostingData ?? false;
  const postingDay = comparison?.recommendedPostingDay;
  const postingTime = comparison?.recommendedPostingTime || 'Not enough data yet';
  const postingRationale = comparison?.postingWindowRationale || 'Instagram account not connected or insufficient historical media. Connect your account to compute statistically sound posting windows.';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fullContentPackageText = `
REEL DIRECTOR AI — FINAL CONTENT PACK
======================================
RECOMMENDED: Reel #${reel.reelNumber} (${reel.fileName})
OVERALL SCORE: ${reel.overallScore}/100 (Scroll-Stop: ${reel.scrollStopScore}/100)

1. BEST HOOK (GOLD):
"${reel.hooks[0]?.text}"
Rationale: ${reel.hooks[0]?.whyItFits}

2. ON-SCREEN TEXT OVERLAY:
"${reel.onScreenText[0]?.text}" (${reel.onScreenText[0]?.position}, Timing: ${reel.onScreenText[0]?.suggestedTiming})

3. CAPTION (${selectedCaptionType}):
${reel.captions[selectedCaptionType]}

4. EXACT 5 HASHTAGS:
${reel.hashtags.join(' ')}

5. SEO KEYWORDS:
${reel.keywords.join(', ')}

6. AUDIO STRATEGY:
${reel.audioStrategy.tempoMoodDirection}
Action: ${reel.audioStrategy.action}

7. BEST COVER FRAME:
Timestamp: ${reel.coverRecommendation.formattedTime}
Rationale: ${reel.coverRecommendation.rationale}

8. POSTING SCHEDULE:
${hasPostingData && postingDay ? `Recommended Day: ${postingDay}\nRecommended Window: ${postingTime}\nRationale: ${postingRationale}` : `Status: Not enough data yet\nNotice: Connect your Instagram Professional account with at least 5 published Reels to calculate personalized audience peak windows.`}
`;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Bar with Back Button and Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <button
          onClick={onBackToComparison}
          className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Multi-Reel Shootout</span>
        </button>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => copyToClipboard(fullContentPackageText.trim(), 'all')}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            {copiedSection === 'all' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'all' ? 'Copied Full Pack!' : 'Copy Entire Package'}</span>
          </button>
        </div>
      </div>

      {/* Package Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#17142a] via-[#131422] to-[#11121d] border border-purple-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold font-['Syne']">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Ready-to-Post Creative Package</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Syne']">
            🏆 Content Pack: Reel #{reel.reelNumber}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300">
            Tailored specifically for <span className="text-white font-semibold">{reel.fileName}</span> based on visual hook, pacing, and current fashion discovery signals.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center">
            <p className="text-[10px] uppercase font-bold text-zinc-400">Composite Score</p>
            <p className="text-2xl font-black text-white">{reel.overallScore}<span className="text-xs text-purple-400">/100</span></p>
          </div>
          <div className="px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center">
            <p className="text-[10px] uppercase font-bold text-zinc-400">Scroll Stop</p>
            <p className="text-2xl font-black text-amber-300">{reel.scrollStopScore}<span className="text-xs text-zinc-400">/100</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Hooks, Captions, Hashtags, Keywords (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION 1: RANKED HOOKS */}
          <div className="p-6 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne']">
                  1. Tailored Fashion Hooks (Ranked)
                </h3>
                <p className="text-xs text-zinc-400">
                  Crafted specifically for the opening frame. Free of cringe cliches.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {reel.hooks.map((hook, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#18192a] border border-white/[0.06] hover:border-purple-500/30 transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                      hook.rank === 'Gold' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' :
                      hook.rank === 'Silver' ? 'bg-zinc-200/20 text-zinc-200 border border-zinc-200/30' :
                      'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      {hook.rank} Choice
                    </span>
                    <button
                      onClick={() => copyToClipboard(hook.text, `hook-${idx}`)}
                      className="text-xs text-zinc-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedSection === `hook-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSection === `hook-${idx}` ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <p className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                    "{hook.text}"
                  </p>
                  <p className="text-xs text-zinc-400">
                    <strong>Why it fits:</strong> {hook.whyItFits}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: CAPTIONS (3 OPTIONS) */}
          <div className="p-6 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne']">
                  2. Caption Options (Human-Sounding)
                </h3>
                <p className="text-xs text-zinc-400">
                  Choose the tone that aligns with your brand persona.
                </p>
              </div>

              {/* Caption Style Switcher */}
              <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/[0.08]">
                <button
                  onClick={() => setSelectedCaptionType('minimalPremium')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedCaptionType === 'minimalPremium' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Minimal
                </button>
                <button
                  onClick={() => setSelectedCaptionType('casualCreator')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedCaptionType === 'casualCreator' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Casual
                </button>
                <button
                  onClick={() => setSelectedCaptionType('highEngagement')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedCaptionType === 'highEngagement' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Engage
                </button>
              </div>
            </div>

            {/* Selected Caption Card */}
            <div className="p-4 rounded-xl bg-[#18192a] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-300 uppercase">
                  {selectedCaptionType === 'minimalPremium' ? 'Minimal Premium Luxury' :
                   selectedCaptionType === 'casualCreator' ? 'Casual Relatable Creator' :
                   'High-Engagement (Saves & Comments)'}
                </span>
                <button
                  onClick={() => copyToClipboard(reel.captions[selectedCaptionType], 'caption')}
                  className="text-xs text-zinc-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                >
                  {copiedSection === 'caption' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'caption' ? 'Copied' : 'Copy Caption'}</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-zinc-200 whitespace-pre-line leading-relaxed">
                {reel.captions[selectedCaptionType]}
              </p>
            </div>
          </div>

          {/* SECTION 3: EXACT 5 HASHTAGS & SEO KEYWORDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Exactly 5 Hashtags */}
            <div className="p-5 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white">
                  <Hash className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider font-['Syne']">
                    Best 5 Hashtags
                  </h4>
                </div>
                <button
                  onClick={() => copyToClipboard(reel.hashtags.join(' '), 'hashtags')}
                  className="text-xs text-purple-300 hover:text-white flex items-center space-x-1"
                >
                  {copiedSection === 'hashtags' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {reel.hashtags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-zinc-400 italic">
                *Capped strictly at 5 high-relevance tags to keep metadata clean.
              </p>
            </div>

            {/* SEO Keywords */}
            <div className="p-5 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white">
                  <Tag className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider font-['Syne']">
                    SEO Keywords
                  </h4>
                </div>
                <button
                  onClick={() => copyToClipboard(reel.keywords.join(', '), 'keywords')}
                  className="text-xs text-indigo-300 hover:text-white flex items-center space-x-1"
                >
                  {copiedSection === 'keywords' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {reel.keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-300 text-[11px]"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Audio, Cover, Posting Time, and Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* SECTION 4: AUDIO STRATEGY */}
          <div className="p-5 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-3">
            <div className="flex items-center space-x-2 text-white">
              <Music className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-['Syne']">
                Audio Strategy & Direction
              </h4>
            </div>
            <div className="space-y-2 text-xs text-zinc-300">
              <p><strong>Action:</strong> <span className="text-purple-300 font-semibold">{reel.audioStrategy.action}</span></p>
              <p><strong>Recommended Style:</strong> {reel.audioStrategy.tempoMoodDirection}</p>
              <p className="text-zinc-400 text-[11px] leading-relaxed">{reel.audioStrategy.notes}</p>
            </div>
          </div>

          {/* SECTION 5: RECOMMENDED COVER */}
          <div className="p-5 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider font-['Syne']">
                  Best Cover Frame
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {reel.coverRecommendation.formattedTime}
              </span>
            </div>

            {/* Actual Cover Frame Image Preview */}
            {reel.coverRecommendation.previewUrl && (
              <div className="relative aspect-[9/13] max-h-56 mx-auto rounded-xl overflow-hidden bg-black border border-white/[0.1] shadow-inner">
                <img
                  src={reel.coverRecommendation.previewUrl}
                  alt="Recommended cover frame"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-indigo-300 font-mono text-[10px] font-bold border border-white/10">
                  Target: {reel.coverRecommendation.formattedTime}
                </div>
              </div>
            )}

            <p className="text-xs text-zinc-300">
              {reel.coverRecommendation.rationale}
            </p>

            <div className="pt-1 text-[11px] text-zinc-400 space-y-1">
              <p>Outfit: <strong className="text-zinc-200">{reel.coverRecommendation.outfitVisibility}</strong> • Face: <strong className="text-zinc-200">{reel.coverRecommendation.faceVisibility}</strong></p>
            </div>

            {reel.coverRecommendation.suggestedOverlayTitles?.length > 0 && (
              <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                <p className="text-[10px] uppercase font-bold text-zinc-400">Suggested Cover Overlay Text</p>
                <div className="flex flex-wrap gap-2">
                  {reel.coverRecommendation.suggestedOverlayTitles.map((t, idx) => (
                    <span key={idx} className="text-xs font-semibold text-white bg-white/[0.06] px-2 py-1 rounded-md border border-white/[0.08]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: BEST POSTING WINDOW */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161726] to-[#12131e] border border-purple-500/20 space-y-3">
            <div className="flex items-center space-x-2 text-white">
              <Calendar className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-['Syne']">
                Recommended Posting Window
              </h4>
            </div>

            {hasPostingData && postingDay ? (
              <>
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{postingDay}</p>
                    <p className="text-sm font-black text-purple-300">{postingTime}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    Account Data
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {postingRationale}
                </p>
              </>
            ) : (
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300">Audience Peak Window</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Not enough data yet</span>
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {postingRationale}
                </p>
              </div>
            )}
          </div>

          {/* SECTION 7: FINAL POST CHECKLIST */}
          <div className="p-5 rounded-2xl bg-[#131422] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider font-['Syne']">
                  Final Post Checklist
                </h4>
              </div>
              <span className="text-[10px] text-zinc-400">
                {Object.values(checklist).filter(Boolean).length}/8 verified
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { id: 'vertical', label: 'Vertical 9:16 aspect ratio verified' },
                { id: 'quality', label: 'High-quality 1080p export ready' },
                { id: 'audio', label: 'Audio loudness balanced (no audio clipping)' },
                { id: 'opening', label: 'First 1.2 seconds shows movement / hook' },
                { id: 'cover', label: 'Cover frame selected at recommended timestamp' },
                { id: 'caption', label: 'Caption selected and copied' },
                { id: 'hashtags', label: 'Exactly 5 targeted hashtags added' },
                { id: 'time', label: 'Scheduled for recommended 7:15–8:30 PM window' },
              ].map((item) => (
                <label
                  key={item.id}
                  className="flex items-center space-x-2.5 text-zinc-300 hover:text-white cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.id]}
                    onChange={() => toggleChecklist(item.id)}
                    className="w-4 h-4 rounded border-white/20 text-purple-600 focus:ring-0 bg-white/[0.05]"
                  />
                  <span className={checklist[item.id] ? 'line-through text-zinc-500' : ''}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
