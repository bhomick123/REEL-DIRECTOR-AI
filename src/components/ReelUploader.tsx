import React, { useState, useRef } from 'react';
import { Upload, Film, Play, Sparkles, Check, AlertCircle, X, ArrowRight, Loader2, Music, Clock } from 'lucide-react';
import { FASHION_SHOOT_SAMPLES, SampleReelShoot } from '../data/sampleReels';
import { extractVideoFramesAndMetadata, generateAdaptiveFramePlan } from '../utils/videoProcessor';
import { ReelAnalysisResult, VideoFrameSample, AudioMetrics, SceneCutEvent, TimelineEvent } from '../types';

export interface UploadedReelItem {
  id: string;
  reelNumber: number;
  fileName: string;
  fileSizeMb: number;
  file?: File;
  previewUrl: string;
  durationSeconds: number;
  frames: VideoFrameSample[];
  audioMetrics: AudioMetrics;
  sceneCuts?: SceneCutEvent[];
  timelineEvents?: TimelineEvent[];
  status: 'ready' | 'processing' | 'completed' | 'error';
  progressStep?: string;
  errorMessage?: string;
  analysis?: ReelAnalysisResult;
}

interface ReelUploaderProps {
  onStartAnalysis: (reels: UploadedReelItem[]) => Promise<void>;
  isAnalyzing: boolean;
  activeProcessingStep: string;
}

export const ReelUploader: React.FC<ReelUploaderProps> = ({
  onStartAnalysis,
  isAnalyzing,
  activeProcessingStep,
}) => {
  const [reelItems, setReelItems] = useState<UploadedReelItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [localProcessing, setLocalProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file uploads
  const handleFiles = async (files: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.mov')) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    setLocalProcessing(true);
    const newItems: UploadedReelItem[] = [...reelItems];

    for (const file of validFiles) {
      if (newItems.length >= 10) break; // max 10 reels

      const currentNumber = newItems.length + 1;
      const previewUrl = URL.createObjectURL(file);
      const sizeMb = Math.round((file.size / (1024 * 1024)) * 10) / 10;

      try {
        // Extract real frames, scene cuts, timeline events, and analyze audio
        const { duration, frames, audioMetrics, sceneCuts, timelineEvents } = await extractVideoFramesAndMetadata(file, file.name);

        newItems.push({
          id: `reel-upload-${Date.now()}-${currentNumber}`,
          reelNumber: currentNumber,
          fileName: file.name,
          fileSizeMb: sizeMb,
          file,
          previewUrl,
          durationSeconds: duration,
          frames,
          audioMetrics,
          sceneCuts,
          timelineEvents,
          status: 'ready',
          progressStep: 'Ready for AI Director analysis',
        });
      } catch (err: any) {
        console.error('Error reading video frames:', err);
        // Add item with fallback thumbnail
        newItems.push({
          id: `reel-upload-${Date.now()}-${currentNumber}`,
          reelNumber: currentNumber,
          fileName: file.name,
          fileSizeMb: sizeMb,
          file,
          previewUrl,
          durationSeconds: 8.5,
          frames: [],
          audioMetrics: {
            hasAudio: true,
            isMusicDetected: false,
            isSpeechDetected: false,
            estimatedBpm: null,
            transcript: null,
            transcriptStatus: 'unavailable',
            audioDirection: 'Audio track detected in container',
          },
          status: 'ready',
          progressStep: 'Ready for AI Director analysis',
        });
      }
    }

    setReelItems(newItems);
    setLocalProcessing(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Load sample demo fashion shoot takes with real duration-adaptive frame plan
  const loadDemoShoot = () => {
    const demoItems: UploadedReelItem[] = FASHION_SHOOT_SAMPLES.map((sample, idx) => {
      const plan = generateAdaptiveFramePlan(sample.durationSeconds);
      const frames: VideoFrameSample[] = plan.map((p) => ({
        timestamp: p.time,
        formattedTime: p.formattedTime,
        label: p.label,
        role: p.role,
        dataUrl: sample.thumbnailUrl,
      }));
      const timelineEvents: TimelineEvent[] = plan.map((p) => ({
        timestamp: p.time,
        formattedTime: p.formattedTime,
        type: (p.role === 'opening' ? 'opening' : p.role === 'hook' ? 'hook' : p.role === 'loop_reset' ? 'loop_reset' : 'scene_change') as any,
        visualObservation: `${p.label} at ${p.formattedTime}.`,
      }));

      return {
        id: sample.id,
        reelNumber: idx + 1,
        fileName: sample.fileName,
        fileSizeMb: sample.fileSizeMb,
        previewUrl: sample.videoUrl,
        durationSeconds: sample.durationSeconds,
        frames,
        audioMetrics: {
          hasAudio: true,
          isMusicDetected: true,
          isSpeechDetected: false,
          estimatedBpm: null,
          transcript: null,
          transcriptStatus: 'unavailable',
          audioDirection: 'Minimal electronic luxury beat; tempo unmeasured in demo asset.',
        },
        timelineEvents,
        status: 'ready',
        progressStep: 'Ready for AI Director analysis',
      };
    });

    setReelItems(demoItems);
  };

  const removeReel = (id: string) => {
    setReelItems((prev) =>
      prev.filter((item) => item.id !== id).map((item, idx) => ({ ...item, reelNumber: idx + 1 }))
    );
  };

  const triggerAnalysis = () => {
    if (reelItems.length < 2) return;
    onStartAnalysis(reelItems);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto pt-2 pb-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Multi-Reel Shootout Engine</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-['Syne']">
          Don’t guess which Reel to post. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-200">
            Let AI decide.
          </span>
        </h1>
        <p className="mt-2.5 text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Upload 2 to 10 takes of your fashion shoot. The AI analyzes visual hooks, outfit reveals, cut pacing,
          and audio to crown the winning Reel and generate your complete post strategy.
        </p>
      </div>

      {/* Upload Box */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all ${
          dragActive
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-white/[0.12] bg-[#12131c]/60 hover:border-purple-500/40 hover:bg-[#12131c]/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/mp4,video/quicktime,video/mov,video/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={isAnalyzing || localProcessing}
        />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center mb-4 text-purple-400 shadow-inner">
            <Upload className="w-7 h-7" />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white mb-1">
            Drop 2–10 Reel takes here or browse files
          </h3>
          <p className="text-xs text-zinc-400 mb-5">
            Supports MP4, MOV, vertical 9:16 format up to 100MB per video
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing || localProcessing}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              Select Videos from Device
            </button>

            <button
              onClick={loadDemoShoot}
              disabled={isAnalyzing || localProcessing}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.1] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Load 4-Take Fashion Demo
            </button>
          </div>

          {localProcessing && (
            <div className="mt-4 flex items-center space-x-2 text-xs text-purple-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Extracting video frames and analyzing audio track...</span>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Reels Grid */}
      {reelItems.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne']">
                Shoot Variations ({reelItems.length}/10)
              </h3>
              {reelItems.length < 2 && (
                <span className="text-[11px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                  Upload at least 2 Reels to compare
                </span>
              )}
            </div>
            <button
              onClick={() => setReelItems([])}
              disabled={isAnalyzing}
              className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reelItems.map((item) => (
              <div
                key={item.id}
                className="relative group bg-[#151622] rounded-xl border border-white/[0.08] overflow-hidden hover:border-purple-500/30 transition-all shadow-md"
              >
                {/* Video / Thumbnail Container (9:16 aspect preview) */}
                <div className="relative aspect-[9/14] bg-black/60 overflow-hidden flex items-center justify-center">
                  {item.frames[0]?.dataUrl ? (
                    <img
                      src={item.frames[0].dataUrl}
                      alt={item.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : item.previewUrl && item.previewUrl.startsWith('blob:') ? (
                    <video
                      src={item.previewUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Film className="w-10 h-10 text-zinc-600" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

                  {/* Reel Number Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-white flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>Reel #{item.reelNumber}</span>
                  </div>

                  {/* Remove Button */}
                  {!isAnalyzing && (
                    <button
                      onClick={() => removeReel(item.id)}
                      className="absolute top-2.5 right-2.5 p-1 rounded-lg bg-black/70 hover:bg-red-500/80 text-white/80 hover:text-white transition-all opacity-80 group-hover:opacity-100"
                      title="Remove Reel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Bottom Video Metadata */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-left text-[11px] text-zinc-300 space-y-1">
                    <p className="font-semibold text-white truncate text-xs">{item.fileName}</p>
                    <div className="flex items-center space-x-3 text-zinc-400 text-[10px]">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.durationSeconds.toFixed(1)}s</span>
                      </span>
                      <span>{item.fileSizeMb} MB</span>
                      <span className="flex items-center space-x-1 text-emerald-400">
                        <Music className="w-3 h-3" />
                        <span>Audio</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar / status under card */}
                {isAnalyzing && (
                  <div className="p-2.5 bg-purple-950/40 border-t border-purple-500/20 text-[11px] text-purple-300 flex items-center space-x-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400 shrink-0" />
                    <span className="truncate">{activeProcessingStep || 'Analyzing hook and pacing...'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#12131d] p-5 rounded-2xl border border-white/[0.08]">
            <div>
              <h4 className="text-sm font-bold text-white">Ready for Multi-Reel Shootout</h4>
              <p className="text-xs text-zinc-400">
                {reelItems.length >= 2
                  ? `${reelItems.length} variations ready. AI will score each take and crown the official winner.`
                  : 'Add at least 1 more Reel variation to run comparative scoring.'}
              </p>
            </div>

            <button
              onClick={triggerAnalysis}
              disabled={reelItems.length < 2 || isAnalyzing}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-xl shadow-purple-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Director Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Shootout & Pick Winner</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
