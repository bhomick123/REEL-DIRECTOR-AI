import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ReelUploader, UploadedReelItem } from './components/ReelUploader';
import { MultiReelComparisonView } from './components/MultiReelComparisonView';
import { ReelDetailModal } from './components/ReelDetailModal';
import { ContentPackView } from './components/ContentPackView';
import { InstagramDashboard } from './components/InstagramDashboard';
import { TrendRadarView } from './components/TrendRadarView';
import { CreatorMemoryView } from './components/CreatorMemoryView';
import { PrivacyModal } from './components/PrivacyModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { UserProfile, InstagramConnection, MultiReelComparison, ReelAnalysisResult } from './types';
import { FASHION_SHOOT_SAMPLES } from './data/sampleReels';
import { extractExactFrameAtTimestamp } from './utils/videoProcessor';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'director' | 'instagram' | 'trends' | 'memory' | 'diagnostics'>('director');
  
  // User & Instagram state
  const [user, setUser] = useState<UserProfile>({
    id: 'creator-demo-1',
    name: 'Sofia Martinez',
    brandNiche: 'High-Street Minimal & Tailoring',
    preferredStyle: 'Monochrome, structured tailoring, clean lines',
    primaryGoal: 'Grow organic reach and save rate with luxury fashion aesthetics',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  });

  const [instagram, setInstagram] = useState<InstagramConnection>({
    isConnected: true,
    username: 'sofia.martinez.style',
    accountType: 'CREATOR',
    followersCount: 42800,
    mediaCount: 184,
    profilePictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    permissionsGranted: [
      'instagram_basic',
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement',
    ],
  });

  // Shootout & Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeProcessingStep, setActiveProcessingStep] = useState('');
  const [activeComparison, setActiveComparison] = useState<MultiReelComparison | null>(null);
  const [selectedReelDetail, setSelectedReelDetail] = useState<ReelAnalysisResult | null>(null);
  const [contentPackReel, setContentPackReel] = useState<ReelAnalysisResult | null>(null);

  // Modals state
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [diagnosticsModalOpen, setDiagnosticsModalOpen] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Fetch initial user & instagram status from backend
  const fetchInitialData = async () => {
    try {
      const [uRes, iRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/instagram/status'),
      ]);

      if (uRes.ok) {
        const contentType = uRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const uData = await uRes.json();
          if (uData.user) setUser(uData.user);
        }
      }

      if (iRes.ok) {
        const contentType = iRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const iData = await iRes.json();
          if (iData.connection) setInstagram(iData.connection);
        }
      }
    } catch (err) {
      console.error('Error fetching initial app data:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Run the multi-take comparison shootout
  const handleStartAnalysis = async (uploadedReels: UploadedReelItem[]) => {
    if (uploadedReels.length < 2) return;

    setIsAnalyzing(true);
    setErrorToast(null);

    try {
      const analyzedReels: ReelAnalysisResult[] = [];

      for (let i = 0; i < uploadedReels.length; i++) {
        const reel = uploadedReels[i];
        setActiveProcessingStep(`Analyzing Reel #${reel.reelNumber}: Visual hooks & outfit drape...`);

        // Call backend Gemini service
        const response = await fetch('/api/reels/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reelNumber: reel.reelNumber,
            fileName: reel.fileName,
            durationSeconds: reel.durationSeconds,
            fileSizeMb: reel.fileSizeMb,
            frames: reel.frames,
            audioMetrics: reel.audioMetrics,
            sceneCuts: reel.sceneCuts,
            timelineEvents: reel.timelineEvents,
            userNiche: user.brandNiche,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to analyze Reel #${reel.reelNumber}`);
        }

        const data = await response.json();
        let coverPreview = data.analysis.coverRecommendation?.previewUrl;

        // If source video file exists and timestamp is recommended, extract exact frame at that time
        if (reel.file && typeof data.analysis.coverRecommendation?.timestamp === 'number') {
          try {
            const exactCover = await extractExactFrameAtTimestamp(reel.file, data.analysis.coverRecommendation.timestamp);
            if (exactCover) {
              coverPreview = exactCover;
            }
          } catch (e) {
            console.warn('Could not extract exact cover frame:', e);
          }
        }

        const reelAnalysisResult: ReelAnalysisResult = {
          ...data.analysis,
          videoUrl: reel.previewUrl,
          previewUrl: coverPreview || reel.previewUrl,
          coverRecommendation: {
            ...data.analysis.coverRecommendation,
            previewUrl: coverPreview || data.analysis.coverRecommendation?.previewUrl,
          },
        };
        analyzedReels.push(reelAnalysisResult);
      }

      // Run comparative ranking engine
      setActiveProcessingStep('Calculating scroll-stop rankings & crowning winner...');
      const compResponse = await fetch('/api/reels/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reels: analyzedReels,
          userNiche: user.brandNiche,
        }),
      });

      if (!compResponse.ok) {
        throw new Error('Failed to rank Reel variations');
      }

      const compData = await compResponse.json();
      setActiveComparison(compData.comparison);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorToast(err.message || 'Error occurred during AI analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setActiveProcessingStep('');
    }
  };

  // Disconnect Instagram
  const handleDisconnectInstagram = async () => {
    try {
      const res = await fetch('/api/instagram/disconnect', { method: 'POST' });
      if (res.ok) {
        setInstagram({
          isConnected: false,
          permissionsGranted: [],
        });
      }
    } catch (err) {
      console.error('Error disconnecting Instagram:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a10] text-zinc-100 font-['Plus_Jakarta_Sans'] flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Persistent Navigation Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        instagram={instagram}
        onOpenPrivacyModal={() => setPrivacyModalOpen(true)}
        onOpenDiagnosticsModal={() => setDiagnosticsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Error Notification Toast */}
        {errorToast && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorToast}</span>
            </div>
            <button
              onClick={() => setErrorToast(null)}
              className="text-zinc-400 hover:text-white font-bold ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: DIRECTOR SUITE */}
        {currentTab === 'director' && (
          <div>
            {contentPackReel ? (
              <ContentPackView
                reel={contentPackReel}
                comparison={activeComparison}
                onBackToComparison={() => setContentPackReel(null)}
              />
            ) : activeComparison ? (
              <MultiReelComparisonView
                comparison={activeComparison}
                userNiche={user?.brandNiche}
                onSelectReelDetail={(reel) => setSelectedReelDetail(reel)}
                onViewContentPack={(winner) => setContentPackReel(winner)}
                onNewAnalysis={() => {
                  setActiveComparison(null);
                  setContentPackReel(null);
                }}
              />
            ) : (
              <ReelUploader
                onStartAnalysis={handleStartAnalysis}
                isAnalyzing={isAnalyzing}
                activeProcessingStep={activeProcessingStep}
              />
            )}
          </div>
        )}

        {/* TAB 2: INSTAGRAM PERFORMANCE */}
        {currentTab === 'instagram' && (
          <InstagramDashboard
            connection={instagram}
            onRefreshData={fetchInitialData}
            onOpenPrivacyModal={() => setPrivacyModalOpen(true)}
          />
        )}

        {/* TAB 3: TREND RADAR */}
        {currentTab === 'trends' && <TrendRadarView />}

        {/* TAB 4: CREATOR MEMORY */}
        {currentTab === 'memory' && <CreatorMemoryView />}
      </main>

      {/* MODALS */}
      {selectedReelDetail && (
        <ReelDetailModal
          reel={selectedReelDetail}
          onClose={() => setSelectedReelDetail(null)}
          onSelectForContentPack={(reel) => {
            setContentPackReel(reel);
            setSelectedReelDetail(null);
          }}
        />
      )}

      {privacyModalOpen && (
        <PrivacyModal
          user={user}
          instagram={instagram}
          onClose={() => setPrivacyModalOpen(false)}
          onDisconnectInstagram={handleDisconnectInstagram}
        />
      )}

      {diagnosticsModalOpen && (
        <DiagnosticsModal onClose={() => setDiagnosticsModalOpen(false)} />
      )}
    </div>
  );
}
