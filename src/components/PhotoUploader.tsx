import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { FASHION_PHOTO_SHOOT_SAMPLES, SamplePhotoItem } from '../data/samplePhotos';

export interface UploadedPhotoItem {
  photoNumber: number;
  fileName: string;
  dataUrl: string;
  fileSizeMb: number;
}

interface PhotoUploaderProps {
  onStartAnalysis: (photos: UploadedPhotoItem[]) => void;
  isAnalyzing: boolean;
  activeProcessingStep: string;
}

function optimizeImageFile(file: File): Promise<{ dataUrl: string; sizeMb: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = (e.target?.result as string) || '';
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const approxBytes = Math.round((compressedDataUrl.length - 'data:image/jpeg;base64,'.length) * 0.75);
          resolve({
            dataUrl: compressedDataUrl,
            sizeMb: Number((approxBytes / (1024 * 1024)).toFixed(2)) || 0.3,
          });
        } else {
          resolve({
            dataUrl: rawDataUrl,
            sizeMb: Number((file.size / (1024 * 1024)).toFixed(2)),
          });
        }
      };
      img.onerror = () => {
        resolve({
          dataUrl: rawDataUrl,
          sizeMb: Number((file.size / (1024 * 1024)).toFixed(2)),
        });
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      resolve({
        dataUrl: '',
        sizeMb: 0,
      });
    };
    reader.readAsDataURL(file);
  });
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onStartAnalysis,
  isAnalyzing,
  activeProcessingStep,
}) => {
  const [photos, setPhotos] = useState<UploadedPhotoItem[]>([]);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const processFiles = (files: File[]) => {
    setErrorNotice(null);
    const validImageFiles = files.filter((f) => f.type.startsWith('image/'));

    if (validImageFiles.length === 0) {
      setErrorNotice('Please select valid image files (JPEG, PNG, WEBP, HEIC).');
      return;
    }

    if (photos.length + validImageFiles.length > 15) {
      setErrorNotice(`You can select a maximum of 15 photos. Currently selected: ${photos.length}.`);
      return;
    }

    validImageFiles.forEach(async (file) => {
      try {
        const optimized = await optimizeImageFile(file);
        if (!optimized.dataUrl) return;
        setPhotos((prev) => {
          if (prev.length >= 15) return prev;
          const nextNumber = prev.length + 1;
          return [
            ...prev,
            {
              photoNumber: nextNumber,
              fileName: file.name,
              dataUrl: optimized.dataUrl,
              fileSizeMb: optimized.sizeMb || 0.5,
            },
          ];
        });
      } catch (err) {
        console.warn('Failed to process image file:', err);
      }
    });
  };

  const handleRemovePhoto = (photoNumber: number) => {
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.photoNumber !== photoNumber);
      // Re-index remaining photos from 1 to N
      return filtered.map((p, idx) => ({
        ...p,
        photoNumber: idx + 1,
      }));
    });
  };

  const handleLoadSampleShoot = async () => {
    setErrorNotice(null);
    setIsLoadingSamples(true);
    try {
      const sampleItems: UploadedPhotoItem[] = await Promise.all(
        FASHION_PHOTO_SHOOT_SAMPLES.map(async (s, idx) => {
          try {
            const resp = await fetch(s.previewUrl);
            if (resp.ok) {
              const blob = await resp.blob();
              const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string) || s.previewUrl);
                reader.onerror = () => resolve(s.previewUrl);
                reader.readAsDataURL(blob);
              });
              return {
                photoNumber: idx + 1,
                fileName: s.fileName,
                dataUrl,
                fileSizeMb: Number((blob.size / (1024 * 1024)).toFixed(2)) || 0.2,
              };
            }
          } catch (e) {
            console.warn(`Client fetch fallback for sample #${idx + 1}:`, e);
          }
          return {
            photoNumber: idx + 1,
            fileName: s.fileName,
            dataUrl: s.previewUrl,
            fileSizeMb: 0.2,
          };
        })
      );
      setPhotos(sampleItems);
    } catch (err) {
      console.warn('Error loading sample shoot:', err);
      setPhotos(
        FASHION_PHOTO_SHOOT_SAMPLES.map((s, idx) => ({
          photoNumber: idx + 1,
          fileName: s.fileName,
          dataUrl: s.previewUrl,
          fileSizeMb: 0.2,
        }))
      );
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const handleClearAll = () => {
    setPhotos([]);
    setErrorNotice(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyzeClick = () => {
    if (photos.length === 0) {
      setErrorNotice('Please upload or select at least 1 photo to analyze.');
      return;
    }
    setErrorNotice(null);
    onStartAnalysis(photos);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Concept Explanation */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>EDITORIAL PHOTO & CAROUSEL INTELLIGENCE</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-['Syne']">
          Photo Director <span className="text-purple-400">AI</span>
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Upload 1–15 photos from your shoot. Photo Director evaluates lighting, sharpness, posture, outfit clarity, delivers an honest{' '}
          <span className="text-emerald-400 font-semibold">POST</span>,{' '}
          <span className="text-amber-400 font-semibold">MAYBE</span>, or{' '}
          <span className="text-rose-400 font-semibold">DON'T POST</span> verdict, and recommends the optimal carousel slide sequence.
        </p>
      </div>

      {/* Demo Quick-Load Banner */}
      <div className="max-w-3xl mx-auto bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-purple-900/30 border border-purple-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-purple-950/20">
        <div className="flex items-center space-x-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
            <Sparkles className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Try with Sample Paris Fashion Shoot</h4>
            <p className="text-xs text-zinc-400">
              Instantly loads 5 editorial looks: hero portrait, stride angle, macro detail, and flawed outtakes.
            </p>
          </div>
        </div>
        <button
          onClick={handleLoadSampleShoot}
          disabled={isAnalyzing || isLoadingSamples}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/20 transition-all flex items-center justify-center space-x-2 shrink-0 group hover:scale-[1.02] disabled:opacity-50"
        >
          {isLoadingSamples ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading Samples...</span>
            </>
          ) : (
            <>
              <span>Load 5 Sample Photos</span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-300 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>

      {/* Upload Drop Zone */}
      <div className="max-w-3xl mx-auto">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed border-white/15 hover:border-purple-500/50 rounded-2xl p-8 sm:p-12 text-center bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-7 h-7 text-purple-400" />
          </div>

          <h3 className="text-base font-semibold text-white mb-1">
            Drag & drop your photos here, or <span className="text-purple-400 underline underline-offset-4">browse files</span>
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-3">
            Upload between 1 and 15 photos from a single look, shoot, or collection. Supported formats: JPEG, PNG, WEBP, HEIC.
          </p>
          <div className="inline-flex items-center space-x-2 text-[11px] text-zinc-500 bg-white/[0.04] px-3 py-1 rounded-full">
            <span>Current count: {photos.length} / 15</span>
          </div>
        </div>

        {errorNotice && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}
      </div>

      {/* Selected Photos Grid */}
      {photos.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne']">
                Selected Photos ({photos.length})
              </h3>
              <span className="text-xs text-zinc-400">
                {photos.length === 1 ? 'Single photo mode' : `Ready for ${photos.length}-photo shootout`}
              </span>
            </div>
            <button
              onClick={handleClearAll}
              disabled={isAnalyzing}
              className="text-xs text-zinc-400 hover:text-rose-400 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {photos.map((item) => (
              <div
                key={item.photoNumber}
                className="group relative bg-[#12131c] border border-white/[0.08] rounded-xl overflow-hidden shadow-lg transition-all hover:border-purple-500/40"
              >
                {/* Photo Aspect Preview */}
                <div className="aspect-[4/5] bg-black/40 overflow-hidden relative">
                  <img
                    src={item.dataUrl}
                    alt={item.fileName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Photo Index Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-bold text-white font-mono">
                    #{item.photoNumber}
                  </div>
                  {/* Remove Button */}
                  {!isAnalyzing && (
                    <button
                      onClick={() => handleRemovePhoto(item.photoNumber)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
                      title="Remove photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Footer Meta */}
                <div className="p-2 text-left">
                  <p className="text-[11px] font-medium text-zinc-200 truncate">{item.fileName}</p>
                  <p className="text-[10px] text-zinc-500">{item.fileSizeMb} MB</p>
                </div>
              </div>
            ))}

            {/* Add more placeholder if < 15 */}
            {photos.length < 15 && !isAnalyzing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[4/5] border border-dashed border-white/10 hover:border-purple-500/40 rounded-xl flex flex-col items-center justify-center p-4 text-center bg-white/[0.01] hover:bg-white/[0.03] transition-all text-zinc-400 hover:text-purple-300 group"
              >
                <Plus className="w-6 h-6 mb-1 text-zinc-500 group-hover:text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-medium">Add Photo</span>
                <span className="text-[9px] text-zinc-600">({15 - photos.length} slots left)</span>
              </button>
            )}
          </div>

          {/* Action Button & Processing Bar */}
          <div className="pt-4 flex flex-col items-center justify-center">
            {isAnalyzing ? (
              <div className="w-full max-w-md bg-[#12131c] border border-purple-500/30 rounded-2xl p-5 text-center space-y-3 shadow-2xl">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                    Analyzing With Photo Director AI
                  </span>
                </div>
                <p className="text-xs text-zinc-300 font-medium">
                  {activeProcessingStep || 'Inspecting composition, lighting, and sharpness...'}
                </p>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full w-2/3 animate-pulse" />
                </div>
                <p className="text-[11px] text-zinc-500">
                  Multimodal vision examining 1–15 photos for editorial posture, outfit visibility, and carousel sequencing.
                </p>
              </div>
            ) : (
              <button
                onClick={handleAnalyzeClick}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-purple-900/30 hover:shadow-purple-700/40 transition-all flex items-center space-x-3 group hover:scale-[1.02]"
              >
                <Sparkles className="w-5 h-5 text-purple-200 group-hover:rotate-12 transition-transform" />
                <span>Run Photo Director Shootout ({photos.length} {photos.length === 1 ? 'Photo' : 'Photos'})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
