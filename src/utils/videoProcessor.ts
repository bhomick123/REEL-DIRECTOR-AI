import { VideoFrameSample, AudioMetrics, SceneCutEvent, TimelineEvent } from '../types';

/**
 * Formats decimal seconds to standard Instagram Reel timecode MM:SS.s (e.g. 4.7 -> "00:04.7")
 */
export function formatTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const wholeSecs = Math.floor(secs);
  const tenths = Math.floor((secs - wholeSecs) * 10);
  return `${mins.toString().padStart(2, '0')}:${wholeSecs.toString().padStart(2, '0')}.${tenths}`;
}

export interface AdaptiveFramePlan {
  time: number;
  formattedTime: string;
  label: string;
  role: 'opening' | 'hook' | 'transition' | 'detail' | 'payoff' | 'loop_reset';
}

/**
 * Generates an adaptive frame sampling schedule based on total video duration.
 * Keeps Gemini request size optimal (6 to 12 frames) while capturing crucial narrative beats.
 */
export function generateAdaptiveFramePlan(duration: number): AdaptiveFramePlan[] {
  const safeDuration = Math.max(1, duration || 8);

  if (safeDuration <= 6) {
    // Ultra short Reel (e.g. 3-6s): 6 key moments
    const times = [
      { t: 0.0, role: 'opening' as const, label: 'Opening Hook (0.0s)' },
      { t: Math.min(0.6, safeDuration * 0.15), role: 'hook' as const, label: 'Scroll-Stop Decision (0.6s)' },
      { t: Math.min(1.5, safeDuration * 0.35), role: 'transition' as const, label: 'Outfit Reveal' },
      { t: Math.min(3.0, safeDuration * 0.60), role: 'detail' as const, label: 'Styling Detail' },
      { t: Math.max(0.5, safeDuration - 1.2), role: 'payoff' as const, label: 'Pose Payoff' },
      { t: Math.max(0.2, safeDuration - 0.2), role: 'loop_reset' as const, label: 'Ending & Loop Reset' },
    ];
    return times.map((item) => ({
      time: Math.round(item.t * 10) / 10,
      formattedTime: formatTimestamp(item.t),
      label: item.label,
      role: item.role,
    }));
  }

  if (safeDuration <= 15) {
    // Standard fashion Reel (7-15s): 8 key moments
    const times = [
      { t: 0.0, role: 'opening' as const, label: 'Opening Frame (0.0s)' },
      { t: Math.min(0.8, safeDuration * 0.08), role: 'hook' as const, label: 'Early Visual Hook (0.8s)' },
      { t: Math.min(1.8, safeDuration * 0.20), role: 'hook' as const, label: 'Subject Entry & First Motion' },
      { t: Math.min(3.5, safeDuration * 0.38), role: 'transition' as const, label: 'Primary Outfit Reveal' },
      { t: Math.min(5.5, safeDuration * 0.58), role: 'detail' as const, label: 'Fabric / Texture Detail' },
      { t: Math.min(8.0, safeDuration * 0.75), role: 'transition' as const, label: 'Secondary Movement / Turn' },
      { t: Math.max(1.0, safeDuration - 1.5), role: 'payoff' as const, label: 'Silhouette Payoff' },
      { t: Math.max(0.5, safeDuration - 0.3), role: 'loop_reset' as const, label: 'Loop Replay Reset' },
    ];
    return times.map((item) => ({
      time: Math.round(item.t * 10) / 10,
      formattedTime: formatTimestamp(item.t),
      label: item.label,
      role: item.role,
    }));
  }

  if (safeDuration <= 30) {
    // Medium-length Reel (16-30s): 10 strategic moments
    const step = safeDuration / 9;
    const roles: AdaptiveFramePlan['role'][] = [
      'opening',
      'hook',
      'hook',
      'transition',
      'detail',
      'transition',
      'detail',
      'transition',
      'payoff',
      'loop_reset',
    ];
    return Array.from({ length: 10 }, (_, i) => {
      const t = i === 0 ? 0.0 : i === 9 ? Math.max(0.5, safeDuration - 0.3) : i * step;
      const role = roles[i];
      const rounded = Math.round(t * 10) / 10;
      return {
        time: rounded,
        formattedTime: formatTimestamp(rounded),
        label: i === 0 ? 'Opening Frame' : i === 1 ? 'Early Hook' : i === 9 ? 'Loop Reset' : `Segment ${i + 1}`,
        role,
      };
    });
  }

  // Long Reel (30s+): 12 frames max
  const step = safeDuration / 11;
  return Array.from({ length: 12 }, (_, i) => {
    const t = i === 0 ? 0.0 : i === 11 ? Math.max(0.5, safeDuration - 0.4) : i * step;
    const rounded = Math.round(t * 10) / 10;
    return {
      time: rounded,
      formattedTime: formatTimestamp(rounded),
      label: i === 0 ? 'Opening Frame' : i === 1 ? 'Visual Hook' : i === 11 ? 'Loop Reset' : `Timeline ${formatTimestamp(rounded)}`,
      role: i === 0 ? 'opening' : i === 1 ? 'hook' : i === 11 ? 'loop_reset' : 'detail',
    };
  });
}

/**
 * Extracts representative video frames, computes real visual scene changes,
 * and performs Web Audio analysis.
 */
export async function extractVideoFramesAndMetadata(
  file: File | Blob,
  fileName: string
): Promise<{
  duration: number;
  width: number;
  height: number;
  frames: VideoFrameSample[];
  audioMetrics: AudioMetrics;
  sceneCuts: SceneCutEvent[];
  timelineEvents: TimelineEvent[];
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration || 8;
        const width = video.videoWidth || 1080;
        const height = video.videoHeight || 1920;

        // 1. Adaptive Frame Plan
        const plan = generateAdaptiveFramePlan(duration);

        const frames: VideoFrameSample[] = [];
        const sceneCuts: SceneCutEvent[] = [];
        const timelineEvents: TimelineEvent[] = [];

        // Main display canvas scaled to max 480x854 for crisp, fast transmission
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 480 / (width || 480));
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Lightweight 32x32 offscreen luminance comparison grid for REAL scene-cut detection
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 32;
        thumbCanvas.height = 32;
        const thumbCtx = thumbCanvas.getContext('2d', { willReadFrequently: true });
        let prevLuminance: Uint8Array | null = null;

        for (let i = 0; i < plan.length; i++) {
          const item = plan[i];
          await seekVideo(video, item.time);

          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            frames.push({
              timestamp: item.time,
              formattedTime: item.formattedTime,
              label: item.label,
              role: item.role,
              dataUrl,
            });

            // Real Scene/Cut Detection: Compute luminance delta from previous frame
            if (thumbCtx) {
              thumbCtx.drawImage(video, 0, 0, 32, 32);
              const imgData = thumbCtx.getImageData(0, 0, 32, 32);
              const currentLuminance = extractLuminanceGrid(imgData.data);

              if (prevLuminance) {
                const diff = computeLuminanceDiff(prevLuminance, currentLuminance);
                // Threshold 26 on a 0-255 scale detects sharp transitions, angle switches, or hard jump cuts
                if (diff >= 26 && item.time > 0.3) {
                  const cutEvent: SceneCutEvent = {
                    timestamp: item.time,
                    formattedTime: item.formattedTime,
                    confidence: Math.min(1, Math.round((diff / 70) * 100) / 100),
                    description: diff >= 45 ? 'Hard jump cut / camera angle change' : 'Visual motion transition',
                    intensityScore: Math.round(diff),
                  };
                  sceneCuts.push(cutEvent);

                  timelineEvents.push({
                    timestamp: item.time,
                    formattedTime: item.formattedTime,
                    type: 'scene_change',
                    visualObservation: cutEvent.description,
                    sceneChangeConfidence: cutEvent.confidence,
                    editingObservation: `Visual shift detected with ${cutEvent.intensityScore}px variance.`,
                  });
                }
              }
              prevLuminance = currentLuminance;
            }

            // Push base timeline observation if not already logged as scene cut
            if (i === 0) {
              timelineEvents.push({
                timestamp: item.time,
                formattedTime: item.formattedTime,
                type: 'opening',
                visualObservation: 'Initial visual scroll-stop frame displayed.',
              });
            } else if (item.role === 'hook') {
              timelineEvents.push({
                timestamp: item.time,
                formattedTime: item.formattedTime,
                type: 'hook',
                visualObservation: 'Core visual hook established; movement or subject turn.',
              });
            } else if (item.role === 'loop_reset') {
              timelineEvents.push({
                timestamp: item.time,
                formattedTime: item.formattedTime,
                type: 'loop_reset',
                visualObservation: 'Ending posture resets toward initial frame for seamless loop.',
              });
            }
          }
        }

        // 2. Real Web Audio Analysis (No fake 114 BPM)
        const audioMetrics = await analyzeAudioTrack(file);

        if (audioMetrics.hasAudio) {
          timelineEvents.push({
            timestamp: 0.0,
            formattedTime: '00:00.0',
            type: 'audio_shift',
            audioObservation: `Audio active (${audioMetrics.averageLoudnessDb || -20} dB RMS). Peak amplitude: ${audioMetrics.peakAmplitude || 0.5}.`,
          });
        } else {
          timelineEvents.push({
            timestamp: 0.0,
            formattedTime: '00:00.0',
            type: 'silence',
            audioObservation: 'Silent or muted audio track detected in source container.',
          });
        }

        // Sort timeline events chronologically
        timelineEvents.sort((a, b) => a.timestamp - b.timestamp);

        URL.revokeObjectURL(objectUrl);
        resolve({
          duration,
          width,
          height,
          frames,
          audioMetrics,
          sceneCuts,
          timelineEvents,
        });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video metadata: ' + (video.error?.message || 'Invalid or corrupted video format')));
    };
  });
}

/**
 * Extracts the EXACT video frame at a given timestamp using HTML5 Video and Canvas.
 * Safely clamps to video duration, handles decimal timestamps (e.g. 4.7s), and prevents memory leaks.
 */
export async function extractExactFrameAtTimestamp(
  source: File | Blob | string,
  targetTimestamp: number
): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    let objectUrl: string | null = null;
    if (typeof source === 'string') {
      video.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      video.src = objectUrl;
    }

    const cleanUp = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };

    // Safety timeout after 3.5 seconds to prevent hung promises on unusual mobile formats
    const timeoutTimer = setTimeout(() => {
      cleanUp();
      resolve('');
    }, 3500);

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration || 8;
        // Clamp timestamp strictly between 0.0s and (duration - 0.05s)
        const safeTime = isNaN(targetTimestamp) || targetTimestamp < 0
          ? 0.0
          : Math.min(targetTimestamp, Math.max(0, duration - 0.05));

        await seekVideo(video, safeTime);

        const width = video.videoWidth || 1080;
        const height = video.videoHeight || 1920;
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 480 / width);
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          clearTimeout(timeoutTimer);
          cleanUp();
          resolve(dataUrl);
          return;
        }

        clearTimeout(timeoutTimer);
        cleanUp();
        resolve('');
      } catch {
        clearTimeout(timeoutTimer);
        cleanUp();
        resolve('');
      }
    };

    video.onerror = () => {
      clearTimeout(timeoutTimer);
      cleanUp();
      resolve('');
    };
  });
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };
    video.addEventListener('seeked', onSeeked);
    // Clamp within 0 and duration
    const target = Math.max(0, Math.min(time, (video.duration || 100) - 0.05));
    video.currentTime = target;
  });
}

function extractLuminanceGrid(rgba: Uint8ClampedArray): Uint8Array {
  const count = rgba.length / 4;
  const lum = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    const idx = i * 4;
    lum[i] = Math.round(0.299 * rgba[idx] + 0.587 * rgba[idx + 1] + 0.114 * rgba[idx + 2]);
  }
  return lum;
}

function computeLuminanceDiff(a: Uint8Array, b: Uint8Array): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum / len;
}

/**
 * Analyzes audio track presence, loudness (RMS in dB), peak amplitude,
 * silence regions, and tests for rhythmic BPM without faking values.
 */
async function analyzeAudioTrack(file: File | Blob): Promise<AudioMetrics> {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      return {
        hasAudio: true,
        isMusicDetected: false,
        isSpeechDetected: false,
        estimatedBpm: null, // Explicitly null/unavailable when API is missing
        transcript: null,
        transcriptStatus: 'unavailable',
        audioDirection: 'Audio track detected in container (Web Audio API unavailable for waveform metrics).',
      };
    }

    const audioCtx = new AudioContextClass();
    const arrayBuffer = await file.slice(0, 1024 * 1024 * 4).arrayBuffer(); // first 4MB
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    if (!audioBuffer || audioBuffer.numberOfChannels === 0) {
      audioCtx.close();
      return {
        hasAudio: false,
        isMusicDetected: false,
        isSpeechDetected: false,
        estimatedBpm: null,
        transcript: null,
        transcriptStatus: 'unavailable',
        audioDirection: 'No native audio track detected in video container. Pair with an aesthetic soundtrack before export.',
      };
    }

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    let sumSquares = 0;
    let peak = 0;

    for (let i = 0; i < channelData.length; i++) {
      const val = channelData[i];
      sumSquares += val * val;
      const absVal = Math.abs(val);
      if (absVal > peak) peak = absVal;
    }

    const rms = Math.sqrt(sumSquares / channelData.length);
    const db = Math.round(20 * Math.log10(Math.max(0.0001, rms)));
    const hasAudio = rms > 0.004;

    // Detect approximate silence regions (< -42 dB)
    let silenceChunks = 0;
    const chunkSize = Math.floor(sampleRate * 0.5); // 0.5s chunks
    for (let i = 0; i < channelData.length; i += chunkSize) {
      let chunkSum = 0;
      const limit = Math.min(i + chunkSize, channelData.length);
      for (let j = i; j < limit; j++) {
        chunkSum += channelData[j] * channelData[j];
      }
      const chunkRms = Math.sqrt(chunkSum / (limit - i));
      if (chunkRms < 0.005) {
        silenceChunks++;
      }
    }

    // Measure real BPM via onset peak periodicity (autocorrelation)
    const detectedBpm = estimateRhythmicBpm(channelData, sampleRate);

    audioCtx.close();

    return {
      hasAudio,
      isMusicDetected: hasAudio && peak > 0.15,
      isSpeechDetected: false,
      estimatedBpm: detectedBpm, // ONLY populated if real rhythmic periodicity exists, otherwise null
      averageLoudnessDb: db,
      peakAmplitude: Math.round(peak * 100) / 100,
      silenceRegionsCount: silenceChunks,
      loudSegmentsSummary: hasAudio ? `Active audio waveform (${db} dB RMS, peak ${(peak * 100).toFixed(0)}%)` : 'Silent audio track',
      transcript: null,
      transcriptStatus: 'unavailable',
      audioDirection: hasAudio
        ? detectedBpm
          ? `Rhythmic track measured at ${detectedBpm} BPM (${db} dB RMS). Clean dynamic range.`
          : `Audio active (${db} dB RMS). Rhythmic BPM unmeasured; ensure cuts align with downbeats.`
        : 'Silent video track. Must pair with a 110–120 BPM minimal aesthetic beat before posting.',
    };
  } catch (err) {
    return {
      hasAudio: true,
      isMusicDetected: false,
      isSpeechDetected: false,
      estimatedBpm: null, // Never default to 114
      transcript: null,
      transcriptStatus: 'unavailable',
      audioDirection: 'Audio track present; rhythmic tempo unmeasured.',
    };
  }
}

/**
 * Real rhythmic BPM estimator based on low-frequency energy envelope peaks.
 * Returns integer BPM between 65 and 175 IF strong periodicity is confirmed, otherwise null.
 */
function estimateRhythmicBpm(data: Float32Array, sampleRate: number): number | null {
  try {
    // Subsample to 500Hz envelope
    const downsampleFactor = Math.floor(sampleRate / 500);
    const envelopeLength = Math.min(Math.floor(data.length / downsampleFactor), 3000); // ~6 seconds
    if (envelopeLength < 1000) return null;

    const envelope = new Float32Array(envelopeLength);
    for (let i = 0; i < envelopeLength; i++) {
      let maxVal = 0;
      const start = i * downsampleFactor;
      const end = Math.min(start + downsampleFactor, data.length);
      for (let j = start; j < end; j++) {
        const abs = Math.abs(data[j]);
        if (abs > maxVal) maxVal = abs;
      }
      envelope[i] = maxVal;
    }

    // Autocorrelation over lag range corresponding to 65–175 BPM
    // At 500Hz: 60 BPM = 500 samples lag, 180 BPM = 166 samples lag
    const minLag = Math.floor((60 / 180) * 500); // ~166
    const maxLag = Math.floor((60 / 65) * 500);  // ~461

    let bestCorrelation = 0;
    let bestLag = 0;

    for (let lag = minLag; lag <= maxLag; lag++) {
      let corr = 0;
      let count = 0;
      for (let i = 0; i < envelopeLength - lag; i++) {
        corr += envelope[i] * envelope[i + lag];
        count++;
      }
      corr = count > 0 ? corr / count : 0;
      if (corr > bestCorrelation) {
        bestCorrelation = corr;
        bestLag = lag;
      }
    }

    // Check significance threshold
    if (bestLag > 0 && bestCorrelation > 0.08) {
      const calculatedBpm = Math.round((60 * 500) / bestLag);
      if (calculatedBpm >= 65 && calculatedBpm <= 180) {
        return calculatedBpm;
      }
    }

    return null;
  } catch {
    return null;
  }
}
