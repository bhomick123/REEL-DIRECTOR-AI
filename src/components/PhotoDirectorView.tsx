import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Copy,
  Check,
  ChevronRight,
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Sliders,
  Maximize2,
  MessageSquare,
  HelpCircle,
  Eye,
  AlertCircle,
  Flame,
} from 'lucide-react';
import { PhotoSetAnalysisResult, IndividualPhotoAnalysis, UnifiedContentRecommendation } from '../types';
import { AskDirectorChat } from './AskDirectorChat';

interface PhotoDirectorViewProps {
  result: PhotoSetAnalysisResult;
  unifiedRecommendation?: UnifiedContentRecommendation | null;
  userNiche?: string;
  onNewAnalysis: () => void;
}

export const PhotoDirectorView: React.FC<PhotoDirectorViewProps> = ({
  result,
  unifiedRecommendation,
  userNiche = 'High-Street Minimal & Tailoring',
  onNewAnalysis,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'POST' | 'MAYBE' | 'DONT_POST'>('ALL');
  const [activePhotoNumber, setActivePhotoNumber] = useState<number>(result.strongestPhotoNumber || 1);
  const [copiedCaptionTone, setCopiedCaptionTone] = useState<string | null>(null);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [selectedInspectPhoto, setSelectedInspectPhoto] = useState<IndividualPhotoAnalysis | null>(null);

  const totalPhotos = result.photos.length;
  const postPhotos = result.photos.filter((p) => p.status === 'POST');
  const maybePhotos = result.photos.filter((p) => p.status === 'MAYBE');
  const dontPostPhotos = result.photos.filter((p) => p.status === 'DONT_POST');

  const filteredPhotos = result.photos.filter((p) => {
    if (filter === 'ALL') return true;
    return p.status === filter;
  });

  const strongestPhoto = result.photos.find((p) => p.photoNumber === result.strongestPhotoNumber) || result.photos[0];

  const handleCopyCaption = (text: string, tone: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaptionTone(tone);
    setTimeout(() => setCopiedCaptionTone(null), 2000);
  };

  const handleCopyHashtags = (hashtags: string[]) => {
    navigator.clipboard.writeText(hashtags.join(' '));
    setCopiedHashtags(true);
    setTimeout(() => setCopiedHashtags(false), 2000);
  };

  const scrollToChat = (photoNumber?: number) => {
    if (photoNumber) {
      setActivePhotoNumber(photoNumber);
    }
    const chatEl = document.getElementById('ask-reel-director');
    if (chatEl) {
      chatEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn pb-16">
      {/* Top Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <button
            onClick={onNewAnalysis}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors mb-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Upload New Shoot</span>
          </button>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Syne']">
              Photo Shootout Results
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold font-mono">
              {totalPhotos} {totalPhotos === 1 ? 'PHOTO' : 'PHOTOS'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Multimodal analysis completed • Tailored for {userNiche}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => scrollToChat()}
            className="px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center space-x-2 transition-all hover:scale-[1.02]"
          >
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>Ask Photo Director</span>
          </button>
        </div>
      </div>

      {/* Primary Verdict Banner */}
      <div
        className={`rounded-3xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden ${
          result.verdictType === 'CAROUSEL'
            ? 'bg-gradient-to-br from-emerald-950/40 via-[#12141c] to-emerald-950/20 border-emerald-500/30 shadow-emerald-950/20'
            : result.verdictType === 'SINGLE_POST'
            ? 'bg-gradient-to-br from-indigo-950/40 via-[#12141c] to-indigo-950/20 border-indigo-500/30 shadow-indigo-950/20'
            : 'bg-gradient-to-br from-rose-950/40 via-[#12141c] to-rose-950/20 border-rose-500/30 shadow-rose-950/20'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 border ${
                  result.verdictType === 'CAROUSEL'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : result.verdictType === 'SINGLE_POST'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {result.verdictType === 'CAROUSEL' && <Layers className="w-3.5 h-3.5" />}
                {result.verdictType === 'SINGLE_POST' && <ImageIcon className="w-3.5 h-3.5" />}
                {result.verdictType === 'NO_POST' && <XCircle className="w-3.5 h-3.5" />}
                <span>
                  {result.verdictType === 'CAROUSEL'
                    ? 'RECOMMENDED CAROUSEL'
                    : result.verdictType === 'SINGLE_POST'
                    ? 'RECOMMENDED SINGLE PHOTO'
                    : "HONEST VERDICT: DON'T POST"}
                </span>
              </span>

              {result.verdictType === 'CAROUSEL' && result.carouselOrder && (
                <span className="px-2.5 py-1 rounded-full bg-white/[0.04] text-zinc-300 text-xs font-mono border border-white/10">
                  {result.carouselOrder.recommendedOrder?.length || (result.carouselOrder as any).recommendedSlideCount || postPhotos.length} Slides Ordered
                </span>
              )}

              {result.verdictType === 'SINGLE_POST' && (
                <span className="px-2.5 py-1 rounded-full bg-white/[0.04] text-zinc-300 text-xs font-mono border border-white/10">
                  Hero: Photo #{result.strongestPhotoNumber}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['Syne']">
              {result.verdictType === 'CAROUSEL'
                ? `Publish a ${result.carouselOrder?.recommendedOrder?.length || (result.carouselOrder as any)?.recommendedSlideCount || postPhotos.length}-slide carousel starting with Photo #${result.carouselOrder?.firstSlidePhotoNumber || result.strongestPhotoNumber}`
                : result.verdictType === 'SINGLE_POST'
                ? `Post Photo #${result.strongestPhotoNumber} as a high-impact single photo. Do not dilute it in a carousel.`
                : `We advise against posting this set. Consider a quick re-shoot.`}
            </h2>

            <p className="text-sm text-zinc-300 leading-relaxed">{result.overallVerdict}</p>

            {result.carouselOrder?.flowRationale && (
              <div className="pt-2 flex items-start space-x-2 text-xs text-zinc-400">
                <ChevronRight className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-200">Flow Rationale:</strong>{' '}
                  {result.carouselOrder.flowRationale}
                </span>
              </div>
            )}
          </div>

          {/* Hero Thumbnail Preview */}
          {strongestPhoto && (
            <div className="shrink-0 flex flex-col items-center sm:items-start lg:items-center">
              <div className="w-28 sm:w-32 aspect-[4/5] rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-xl relative group bg-black">
                <img
                  src={strongestPhoto.imageUrl}
                  alt={`Photo #${strongestPhoto.photoNumber}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-bold text-white font-mono">
                  #{strongestPhoto.photoNumber}
                </div>
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-purple-600/90 text-[10px] font-bold text-white">
                  {strongestPhoto.score}/100
                </div>
              </div>
              <span className="text-[11px] text-zinc-400 mt-2 font-medium">Strongest Shot</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Quick Stat Metric Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#12131d] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Strongest Photo</p>
            <p className="text-xl font-bold text-white font-mono">
              #{result.strongestPhotoNumber}{' '}
              <span className="text-xs text-purple-400">({strongestPhoto?.score || 0}/100)</span>
            </p>
          </div>
        </div>

        <div className="bg-[#12131d] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Recommend Post</p>
            <p className="text-xl font-bold text-emerald-400 font-mono">
              {postPhotos.length}{' '}
              <span className="text-xs text-zinc-500">/ {totalPhotos}</span>
            </p>
          </div>
        </div>

        <div className="bg-[#12131d] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Maybe / Edit</p>
            <p className="text-xl font-bold text-amber-400 font-mono">
              {maybePhotos.length}{' '}
              <span className="text-xs text-zinc-500">/ {totalPhotos}</span>
            </p>
          </div>
        </div>

        <div className="bg-[#12131d] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Don't Post / Retake</p>
            <p className="text-xl font-bold text-rose-400 font-mono">
              {dontPostPhotos.length}{' '}
              <span className="text-xs text-zinc-500">/ {totalPhotos}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Carousel Sequencing Visualizer (If Carousel is recommended) */}
      {result.carouselOrder && result.carouselOrder.isRecommended && (
        <div className="bg-[#12131d] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white font-['Syne']">
                  Optimal Carousel Slide Order
                </h3>
              </div>
              <p className="text-xs text-zinc-400">
                Sequenced mathematically for swipe retention, silhouette contrast, and scroll-stop hook.
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
              Slide 1 = Hook
            </div>
          </div>

          {/* Slide Timeline Sequence */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {(result.carouselOrder.recommendedOrder || (result.carouselOrder as any).orderedPhotoNumbers || []).map((pNum: number, index: number) => {
              const photo = result.photos.find((p) => p.photoNumber === pNum);
              const isFirst = index === 0;

              return (
                <div
                  key={pNum}
                  onClick={() => setSelectedInspectPhoto(photo || null)}
                  className={`group relative rounded-2xl overflow-hidden border transition-all cursor-pointer ${
                    isFirst
                      ? 'border-purple-500 bg-purple-950/20 shadow-xl shadow-purple-950/40 ring-2 ring-purple-500/30'
                      : 'border-white/[0.08] bg-black/40 hover:border-white/20'
                  }`}
                >
                  <div className="aspect-[4/5] relative overflow-hidden bg-black">
                    {photo ? (
                      <img
                        src={photo.previewUrl || (photo as any).imageUrl || (photo as any).dataUrl}
                        alt={`Slide ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}

                    {/* Slide Number Badge */}
                    <div
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono shadow-md ${
                        isFirst
                          ? 'bg-purple-600 text-white'
                          : 'bg-black/80 text-zinc-300 border border-white/10'
                      }`}
                    >
                      Slide {index + 1}
                    </div>

                    {isFirst && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-400 text-black text-[9px] font-extrabold uppercase tracking-wide">
                        HOOK
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] text-zinc-300 font-mono">
                      Photo #{pNum}
                    </div>
                  </div>

                  <div className="p-3 bg-[#0d0e15] border-t border-white/[0.04]">
                    <p className="text-[11px] font-medium text-white truncate">
                      {isFirst ? 'Attention Hook' : `Swipe Slide ${index + 1}`}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">
                      Score: {photo?.score || 0}/100
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rationale Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Why Photo #{result.carouselOrder.firstSlidePhotoNumber} is Slide 1</span>
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {result.carouselOrder.firstSlideRationale || (result.carouselOrder as any).whyFirstSlide || 'Selected as slide 1 for strongest thumb-stopping power.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span>Pacing & Narrative Transition</span>
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {result.carouselOrder.flowRationale}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Individual Photo Inspection Grid */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white font-['Syne']">
              Individual Photo Analysis
            </h3>
            <p className="text-xs text-zinc-400">
              Granular review across composition, exposure, sharpness, pose, and retake directives.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'ALL'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({totalPhotos})
            </button>
            <button
              onClick={() => setFilter('POST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'POST'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400 hover:text-white'
              }`}
            >
              Post ({postPhotos.length})
            </button>
            <button
              onClick={() => setFilter('MAYBE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'MAYBE'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-400 hover:text-white'
              }`}
            >
              Maybe ({maybePhotos.length})
            </button>
            <button
              onClick={() => setFilter('DONT_POST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'DONT_POST'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-400 hover:text-white'
              }`}
            >
              Don't Post ({dontPostPhotos.length})
            </button>
          </div>
        </div>

        {/* Photo Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => {
            const isPost = photo.status === 'POST';
            const isMaybe = photo.status === 'MAYBE';
            const isDont = photo.status === 'DONT_POST';

            return (
              <div
                key={photo.photoNumber}
                className={`bg-[#12131d] rounded-3xl border overflow-hidden shadow-xl flex flex-col transition-all hover:border-purple-500/40 ${
                  isPost
                    ? 'border-emerald-500/20'
                    : isMaybe
                    ? 'border-amber-500/20'
                    : 'border-rose-500/20'
                }`}
              >
                {/* Photo Aspect Ratio Image */}
                <div className="aspect-[4/5] bg-black relative overflow-hidden group">
                  <img
                    src={photo.previewUrl || (photo as any).imageUrl || (photo as any).dataUrl}
                    alt={`Photo #${photo.photoNumber}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Photo Index Badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-xs font-bold text-white font-mono">
                    Photo #{photo.photoNumber}
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border shadow-lg ${
                      isPost
                        ? 'bg-emerald-500/90 text-white border-emerald-400'
                        : isMaybe
                        ? 'bg-amber-500/90 text-black border-amber-300'
                        : 'bg-rose-600/90 text-white border-rose-400'
                    }`}
                  >
                    {isPost ? 'RECOMMEND POST' : isMaybe ? 'MAYBE / ADJUST' : 'DO NOT POST'}
                  </div>

                  {/* Score pill bottom right */}
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-xs font-bold text-white font-mono border border-white/10">
                    {photo.score ?? 85}/100
                  </div>

                  {/* Inspect Button Overlay */}
                  <button
                    onClick={() => setSelectedInspectPhoto(photo)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white space-x-2 font-semibold text-xs"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>Click to Inspect Full Details</span>
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Verdict text */}
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1.5">
                      Verdict: {isPost ? 'Editorial Grade' : isMaybe ? 'Needs Minor Polish' : 'Flawed Outtake'}
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed">{photo.verdictSummary || (photo as any).verdict || 'Analysis evaluated.'}</p>
                  </div>

                  {/* Retake Alert if applicable */}
                  {photo.retakeRecommended && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Retake Recommended: </span>
                        <span>{photo.retakeAdvice || 'Better to retake rather than edit.'}</span>
                      </div>
                    </div>
                  )}

                  {/* Evaluated Factors Tags */}
                  <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Evaluated Factors
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                        <span className="text-zinc-500 block text-[9px] uppercase">Sharpness</span>
                        <span className="text-zinc-200 font-medium truncate block">
                          {photo.evaluatedFactors?.sharpness || (photo as any).factors?.sharpness || 'Sharp & clear'}
                        </span>
                      </div>
                      <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                        <span className="text-zinc-500 block text-[9px] uppercase">Lighting</span>
                        <span className="text-zinc-200 font-medium truncate block">
                          {photo.evaluatedFactors?.lighting || (photo as any).factors?.lighting || 'Natural light'}
                        </span>
                      </div>
                      <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                        <span className="text-zinc-500 block text-[9px] uppercase">Outfit Clarity</span>
                        <span className="text-zinc-200 font-medium truncate block">
                          {photo.evaluatedFactors?.outfitPresentation || (photo as any).factors?.outfitPresentation || 'Clear drape'}
                        </span>
                      </div>
                      <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                        <span className="text-zinc-500 block text-[9px] uppercase">Pose</span>
                        <span className="text-zinc-200 font-medium truncate block">
                          {photo.evaluatedFactors?.poseAndExpression || (photo as any).factors?.poseAndExpression || 'Editorial pose'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths / Weaknesses */}
                  <div className="space-y-2 pt-1">
                    {Array.isArray(photo.strengths) && photo.strengths.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {photo.strengths.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[10px] font-medium border border-emerald-500/20"
                          >
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {Array.isArray(photo.weaknesses) && photo.weaknesses.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {photo.weaknesses.map((w, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 text-[10px] font-medium border border-rose-500/20"
                          >
                            ✗ {w}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fixes List */}
                  {((photo.practicalImprovements && photo.practicalImprovements.length > 0) || ((photo as any).editingImprovements && (photo as any).editingImprovements.length > 0)) && (
                    <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1">
                      <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                        Suggested Edits
                      </p>
                      <ul className="text-[11px] text-zinc-300 space-y-1 list-disc list-inside">
                        {(photo.practicalImprovements || (photo as any).editingImprovements || []).map((fix: string, idx: number) => (
                          <li key={idx}>{fix}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Footer button */}
                  <div className="pt-2">
                    <button
                      onClick={() => scrollToChat(photo.photoNumber)}
                      className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold border border-white/[0.08] transition-colors flex items-center justify-center space-x-2"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                      <span>Ask Director About Photo #{photo.photoNumber}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Captions Suite */}
      <div className="bg-[#12131d] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-2 border-b border-white/[0.06] pb-4">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-lg font-bold text-white font-['Syne']">
              5 Fashion-First Caption Alternatives
            </h3>
            <p className="text-xs text-zinc-400">
              Written specifically for your look and niche. No cringe or over-enthusiastic generic copy.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              tone: 'Minimal',
              label: 'Minimalist & Editorial',
              text: result.captions.minimal,
            },
            {
              tone: 'Stylish',
              label: 'High-Fashion & Trend',
              text: result.captions.stylish,
            },
            {
              tone: 'Confident',
              label: 'Bold & Direct',
              text: result.captions.confident,
            },
            {
              tone: 'Natural',
              label: 'Conversational & Chill',
              text: result.captions.natural,
            },
            {
              tone: 'Witty',
              label: 'Clever & Subtle',
              text: result.captions.witty,
            },
          ].map((item) => (
            <div
              key={item.tone}
              className="bg-[#0e0f17] border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between space-y-3 group hover:border-purple-500/40 transition-colors"
            >
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 text-[10px] font-bold uppercase tracking-wider border border-white/[0.06]">
                  {item.label}
                </span>
                <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">{item.text}</p>
              </div>

              <button
                onClick={() => handleCopyCaption(item.text, item.tone)}
                className={`w-full py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  copiedCaptionTone === item.tone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08]'
                }`}
              >
                {copiedCaptionTone === item.tone ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Caption</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Verified Hashtags & Best Time To Post */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hashtags Card */}
        <div className="bg-[#12131d] border border-white/[0.08] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne']">
                5 Niche Hashtags
              </h4>
              <p className="text-xs text-zinc-400">Strictly 5 outfit-tailored tags</p>
            </div>
            <button
              onClick={() => handleCopyHashtags(result.hashtags)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-300 border border-white/[0.08] flex items-center space-x-1.5 transition-colors"
            >
              {copiedHashtags ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHashtags ? 'Copied All' : 'Copy All'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {result.hashtags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-purple-300 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Phase 1 Verified Best Time to Post Card */}
        <div className="bg-[#12131d] border border-white/[0.08] rounded-3xl p-6 space-y-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne']">
              Optimal Posting Schedule
            </h4>
          </div>

          {result.hasSufficientPostingData ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {result.recommendedPostingDay}
                </span>
                <span className="text-lg font-bold text-white font-mono">
                  {result.recommendedPostingTime}
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {result.postingWindowRationale}
              </p>
              {result.postingDataNotice && (
                <span className="inline-block text-[10px] text-zinc-500 bg-white/[0.03] px-2 py-0.5 rounded">
                  {result.postingDataNotice}
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-zinc-400">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-sm font-semibold text-zinc-200">Not enough data yet</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {result.postingWindowRationale ||
                  'Connect your Instagram Professional account and publish at least 5 posts to calculate a personalized posting window based on real account interactions.'}
              </p>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-zinc-500">
                Notice: {result.postingDataNotice || 'Requires connected Instagram with ≥5 published posts'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inspect Photo Modal */}
      {selectedInspectPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#12131d] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-1 rounded-lg bg-black/80 text-xs font-bold text-white font-mono border border-white/10">
                  Photo #{selectedInspectPhoto.photoNumber}
                </span>
                <h3 className="text-base font-bold text-white font-['Syne']">
                  Full Optical Inspection
                </h3>
              </div>
              <button
                onClick={() => setSelectedInspectPhoto(null)}
                className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="aspect-[4/5] max-h-72 mx-auto rounded-2xl overflow-hidden bg-black border border-white/10">
              <img
                src={selectedInspectPhoto.previewUrl || (selectedInspectPhoto as any).imageUrl || (selectedInspectPhoto as any).dataUrl}
                alt={`Photo #${selectedInspectPhoto.photoNumber}`}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Overall Verdict
                </span>
                <p className="text-xs text-zinc-200 leading-relaxed">
                  {selectedInspectPhoto.verdictSummary || (selectedInspectPhoto as any).verdict || 'Optical evaluation complete.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Composition</span>
                  <span className="text-zinc-200">
                    {selectedInspectPhoto.evaluatedFactors?.composition || (selectedInspectPhoto as any).factors?.composition || 'Balanced framing'}
                  </span>
                </div>
                <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Lighting</span>
                  <span className="text-zinc-200">
                    {selectedInspectPhoto.evaluatedFactors?.lighting || (selectedInspectPhoto as any).factors?.lighting || 'Clean daylight'}
                  </span>
                </div>
                <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Sharpness</span>
                  <span className="text-zinc-200">
                    {selectedInspectPhoto.evaluatedFactors?.sharpness || (selectedInspectPhoto as any).factors?.sharpness || 'In-focus'}
                  </span>
                </div>
                <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Pose & Expression</span>
                  <span className="text-zinc-200">
                    {selectedInspectPhoto.evaluatedFactors?.poseAndExpression || (selectedInspectPhoto as any).factors?.poseAndExpression || 'Editorial'}
                  </span>
                </div>
              </div>

              {((selectedInspectPhoto.practicalImprovements && selectedInspectPhoto.practicalImprovements.length > 0) || ((selectedInspectPhoto as any).editingImprovements && (selectedInspectPhoto as any).editingImprovements.length > 0)) && (
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1.5">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                    Recommended Edits
                  </span>
                  <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
                    {(selectedInspectPhoto.practicalImprovements || (selectedInspectPhoto as any).editingImprovements || []).map((fix: string, idx: number) => (
                      <li key={idx}>{fix}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSelectedInspectPhoto(null);
                scrollToChat(selectedInspectPhoto.photoNumber);
              }}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Director About This Photo in Chat</span>
            </button>
          </div>
        </div>
      )}

      {/* Ask Your Photo Director Chat Module */}
      <AskDirectorChat
        activePhotoSet={result}
        activePhotoNumber={activePhotoNumber}
        unifiedRecommendation={unifiedRecommendation}
        userNiche={userNiche}
        onSelectPhotoNumber={(pNum) => setActivePhotoNumber(pNum)}
      />
    </div>
  );
};
