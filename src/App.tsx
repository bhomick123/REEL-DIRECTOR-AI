import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ReelUploader, UploadedReelItem } from './components/ReelUploader';
import { MultiReelComparisonView } from './components/MultiReelComparisonView';
import { ReelDetailModal } from './components/ReelDetailModal';
import { ContentPackView } from './components/ContentPackView';
import { PhotoUploader, UploadedPhotoItem } from './components/PhotoUploader';
import { PhotoDirectorView } from './components/PhotoDirectorView';
import { UnifiedDirectorCard } from './components/UnifiedDirectorCard';
import { InstagramDashboard } from './components/InstagramDashboard';
import { TrendRadarView } from './components/TrendRadarView';
import { CreatorMemoryView } from './components/CreatorMemoryView';
import { CreateMyNextReelView } from './components/CreateMyNextReelView';
import { PrivacyModal } from './components/PrivacyModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { InstagramConnectModal } from './components/InstagramConnectModal';
import { LoginScreen } from './components/LoginScreen';
import {
  UserProfile,
  InstagramConnection,
  MultiReelComparison,
  ReelAnalysisResult,
  PhotoSetAnalysisResult,
  UnifiedContentRecommendation,
} from './types';
import { FASHION_SHOOT_SAMPLES } from './data/sampleReels';
import { extractExactFrameAtTimestamp } from './utils/videoProcessor';
import { checkCurrentSession, logoutUser, fetchWithAuth } from './utils/authClient';
import { Sparkles, AlertCircle, Film, Layers, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<
    'director' | 'photo-director' | 'instagram' | 'create-reel' | 'trends' | 'memory' | 'diagnostics'
  >('director');
  const [contentType, setContentType] = useState<'video' | 'photo'>('video');

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Photo Director state
  const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState(false);
  const [activePhotoProcessingStep, setActivePhotoProcessingStep] = useState('');
  const [activePhotoAnalysis, setActivePhotoAnalysis] = useState<PhotoSetAnalysisResult | null>(null);
  
  // User & Instagram state
  const [user, setUser] = useState<UserProfile>({
    id: '',
    name: 'Creator',
    brandNiche: 'High-Street Minimal & Tailoring',
    preferredStyle: 'Monochrome, structured tailoring, clean lines',
    primaryGoal: 'Grow organic reach and save rate with luxury fashion aesthetics',
    avatarUrl: '',
    isGoogleAuthenticated: false,
  });

  const [instagram, setInstagram] = useState<InstagramConnection>({
    isConnected: false,
    permissionsGranted: [],
  });

  // Shootout & Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeProcessingStep, setActiveProcessingStep] = useState('');
  const [activeComparison, setActiveComparison] = useState<MultiReelComparison | null>(null);
  const [selectedReelDetail, setSelectedReelDetail] = useState<ReelAnalysisResult | null>(null);
  const [contentPackReel, setContentPackReel] = useState<ReelAnalysisResult | null>(null);

  // Phase 3: Unified Content Director state
  const [unifiedRecommendation, setUnifiedRecommendation] = useState<UnifiedContentRecommendation | null>(null);
  const [isGeneratingUnified, setIsGeneratingUnified] = useState(false);
  const [userPreference, setUserPreference] = useState<'REEL' | 'PHOTO' | 'CAROUSEL' | null>(null);

  // Modals state
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [diagnosticsModalOpen, setDiagnosticsModalOpen] = useState(false);
  const [googleAuthModalOpen, setGoogleAuthModalOpen] = useState(false);
  const [instagramConnectModalOpen, setInstagramConnectModalOpen] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fetch unified recommendation from backend
  const fetchUnifiedRecommendation = async (pref?: 'REEL' | 'PHOTO' | 'CAROUSEL' | null) => {
    if (!isAuthenticated) return;
    setIsGeneratingUnified(true);
    try {
      const activePref = pref !== undefined ? pref : userPreference;
      const response = await fetchWithAuth('/api/content/unified-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comparison: activeComparison || undefined,
          photoSet: activePhotoAnalysis || undefined,
          userPreference: activePref,
          userNiche: user.brandNiche,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.recommendation) {
          setUnifiedRecommendation(data.recommendation);
        }
      }
    } catch (err) {
      console.error('Error fetching unified recommendation:', err);
    } finally {
      setIsGeneratingUnified(false);
    }
  };

  // Re-fetch unified recommendation whenever content analysis or preference changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnifiedRecommendation(userPreference);
    }
  }, [activeComparison, activePhotoAnalysis, userPreference, isAuthenticated]);

  // Fetch user profile and instagram status
  const fetchInitialData = async () => {
    try {
      const [uRes, iRes] = await Promise.all([
        fetchWithAuth('/api/user/profile'),
        fetchWithAuth('/api/instagram/status'),
      ]);

      if (uRes.ok) {
        const uData = await uRes.json();
        if (uData.user) setUser(uData.user);
      }

      if (iRes.ok) {
        const iData = await iRes.json();
        if (iData.connection) setInstagram(iData.connection);
      }
    } catch (err) {
      console.error('Error fetching initial app data:', err);
    }
  };

  // Initialize session & handle redirect callback parameters
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // 1. Process URL query parameters if returning from an OAuth redirect
      const params = new URLSearchParams(window.location.search);
      const authSuccess = params.get('auth_success');
      const authError = params.get('auth_error');
      const oauthSuccess = params.get('oauth_success');
      const oauthError = params.get('oauth_error');

      if (authError) {
        setErrorToast(decodeURIComponent(authError));
      }
      if (oauthError) {
        setErrorToast(`Instagram Error: ${decodeURIComponent(oauthError)}`);
      }
      if (oauthSuccess) {
        setSuccessToast('Instagram connected successfully and saved to your account!');
      }
      if (authSuccess) {
        setSuccessToast('Google sign-in completed successfully!');
      }

      if (authSuccess || oauthSuccess || authError || oauthError) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // 2. Validate current session against backend
      const session = await checkCurrentSession();
      if (isMounted) {
        if (session.isAuthenticated && session.user) {
          setUser(session.user);
          if (session.instagram) {
            setInstagram(session.instagram);
          }
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
        setIsCheckingAuth(false);
      }
    };

    initAuth();

    // 3. Listen for OAuth postMessage events (for popup flows)
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          if (event.data.user) {
            setUser(event.data.user);
            if (event.data.instagram) setInstagram(event.data.instagram);
            setIsAuthenticated(true);
            setSuccessToast(`Signed in as ${event.data.user.email}`);
          }
        } else if (event.data.type === 'INSTAGRAM_OAUTH_SUCCESS') {
          if (event.data.connection) {
            setInstagram(event.data.connection);
            setSuccessToast(`@${event.data.connection.username} successfully linked!`);
          }
        } else if (event.data.type === 'INSTAGRAM_OAUTH_ERROR') {
          setErrorToast(`Instagram Error: ${event.data.error}`);
        }
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => {
      isMounted = false;
      window.removeEventListener('message', handleAuthMessage);
    };
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    await logoutUser();
    setIsAuthenticated(false);
    setUser({
      id: '',
      name: 'Creator',
      brandNiche: 'High-Street Minimal & Tailoring',
      preferredStyle: 'Monochrome, structured tailoring, clean lines',
      primaryGoal: 'Grow organic reach and save rate with luxury fashion aesthetics',
      avatarUrl: '',
      isGoogleAuthenticated: false,
    });
    setInstagram({
      isConnected: false,
      permissionsGranted: [],
    });
    setActiveComparison(null);
    setActivePhotoAnalysis(null);
    setContentPackReel(null);
    setGoogleAuthModalOpen(false);
    setInstagramConnectModalOpen(false);
    setSuccessToast('You have been logged out.');
  };

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
        const response = await fetchWithAuth('/api/reels/analyze', {
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
      const compResponse = await fetchWithAuth('/api/reels/compare', {
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

  // Run the Photo Director analysis
  const handleStartPhotoAnalysis = async (uploadedPhotos: UploadedPhotoItem[]) => {
    if (uploadedPhotos.length === 0) return;

    setIsAnalyzingPhotos(true);
    setErrorToast(null);
    setActivePhotoProcessingStep(
      `Loading ${uploadedPhotos.length} photo${uploadedPhotos.length === 1 ? '' : 's'} for multimodal inspection...`
    );

    try {
      setActivePhotoProcessingStep('Evaluating framing, lighting, sharpness & outfit drape...');
      const response = await fetchWithAuth('/api/photos/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: uploadedPhotos.map((p) => ({
            photoNumber: p.photoNumber,
            dataUrl: p.dataUrl,
            fileName: p.fileName,
            fileSizeMb: p.fileSizeMb,
          })),
          userNiche: user.brandNiche,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || 'Failed to analyze photo set.');
      }

      const data = await response.json();
      if (!data.analysis) {
        throw new Error('Analysis result was not returned by server.');
      }

      setActivePhotoAnalysis(data.analysis);
    } catch (err: any) {
      console.error('Photo analysis error:', err);
      setErrorToast(err.message || 'Failed to analyze photos. Please check image format and try again.');
    } finally {
      setIsAnalyzingPhotos(false);
      setActivePhotoProcessingStep('');
    }
  };

  // Disconnect Instagram
  const handleDisconnectInstagram = async () => {
    try {
      const res = await fetchWithAuth('/api/instagram/disconnect', { method: 'POST' });
      if (res.ok) {
        setInstagram({
          isConnected: false,
          permissionsGranted: [],
        });
        setSuccessToast('Instagram disconnected.');
      }
    } catch (err) {
      console.error('Error disconnecting Instagram:', err);
    }
  };

  // Loading state while verifying authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#090a10] text-zinc-100 flex items-center justify-center font-['Plus_Jakarta_Sans']">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-xl shadow-purple-500/20 animate-pulse">
            <div className="w-full h-full bg-[#0d0e18] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 font-mono tracking-wider">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated: render the professional login screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={(loggedUser, loggedInstagram) => {
          setUser(loggedUser);
          if (loggedInstagram) {
            setInstagram(loggedInstagram);
          }
          setIsAuthenticated(true);
          setSuccessToast(`Welcome, ${loggedUser.name || loggedUser.email}!`);
        }}
      />
    );
  }

  const isPhotoModeActive = currentTab === 'photo-director' || (currentTab === 'director' && contentType === 'photo');

  return (
    <div className="min-h-screen bg-[#0a0a10] text-zinc-100 font-['Plus_Jakarta_Sans'] flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Persistent Navigation Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'photo-director') {
            setContentType('photo');
          } else if (tab === 'director') {
            setContentType('video');
          }
        }}
        user={user}
        instagram={instagram}
        onOpenPrivacyModal={() => setPrivacyModalOpen(true)}
        onOpenDiagnosticsModal={() => setDiagnosticsModalOpen(true)}
        onOpenGoogleAuth={() => setGoogleAuthModalOpen(true)}
        onOpenInstagramModal={() => setInstagramConnectModalOpen(true)}
        onLogout={handleLogout}
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

        {/* Success Toast */}
        {successToast && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-zinc-400 hover:text-white font-bold ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* DIRECTOR SUITE: CONTENT SELECTION & WORKFLOWS */}
        {(currentTab === 'director' || currentTab === 'photo-director') && (
          <div className="space-y-6">
            {/* Phase 3: Unified Content Director Decision Card */}
            {!contentPackReel && (
              <UnifiedDirectorCard
                recommendation={unifiedRecommendation}
                isLoading={isGeneratingUnified}
                userPreference={userPreference}
                onSelectPreference={(pref) => {
                  setUserPreference(pref);
                }}
                onRefresh={() => fetchUnifiedRecommendation(userPreference)}
                onNavigateToReel={() => {
                  setContentType('video');
                  setCurrentTab('director');
                }}
                onNavigateToPhotos={() => {
                  setContentType('photo');
                  setCurrentTab('photo-director');
                }}
                onAskDirector={() => {
                  const chatEl = document.getElementById('ask-reel-director');
                  if (chatEl) {
                    chatEl.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                hasReels={!!activeComparison}
                hasPhotos={!!activePhotoAnalysis}
              />
            )}

            {/* Content Selection Toggle (Shown when not deep in content pack or comparison) */}
            {!contentPackReel && !activeComparison && !activePhotoAnalysis && (
              <div className="flex items-center justify-center mb-6">
                <div className="bg-[#12131e] border border-white/10 p-1.5 rounded-2xl flex items-center space-x-2 shadow-xl">
                  <button
                    onClick={() => {
                      setContentType('video');
                      setCurrentTab('director');
                    }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                      !isPhotoModeActive
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>Video / Reel Director</span>
                  </button>
                  <button
                    onClick={() => {
                      setContentType('photo');
                      setCurrentTab('photo-director');
                    }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                      isPhotoModeActive
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Photos / Photo Director</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-400/20 text-purple-300 text-[9px] font-extrabold border border-purple-400/30">
                      NEW
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* If Photos: Photo Director */}
            {isPhotoModeActive ? (
              <div>
                {activePhotoAnalysis ? (
                  <PhotoDirectorView
                    result={activePhotoAnalysis}
                    unifiedRecommendation={unifiedRecommendation}
                    userNiche={user?.brandNiche}
                    onNewAnalysis={() => setActivePhotoAnalysis(null)}
                  />
                ) : (
                  <PhotoUploader
                    onStartAnalysis={handleStartPhotoAnalysis}
                    isAnalyzing={isAnalyzingPhotos}
                    activeProcessingStep={activePhotoProcessingStep}
                  />
                )}
              </div>
            ) : (
              /* If Video: existing Reel Director */
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
                    unifiedRecommendation={unifiedRecommendation}
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
          </div>
        )}

        {/* TAB 2: INSTAGRAM PERFORMANCE */}
        {currentTab === 'instagram' && (
          <InstagramDashboard
            connection={instagram}
            onRefreshData={fetchInitialData}
            onOpenPrivacyModal={() => setPrivacyModalOpen(true)}
            onNavigateToCreateReel={() => setCurrentTab('create-reel')}
          />
        )}

        {/* TAB: CREATE MY NEXT REEL */}
        {currentTab === 'create-reel' && (
          <CreateMyNextReelView
            connection={instagram}
            onNavigateToInstagram={() => setCurrentTab('instagram')}
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

      {googleAuthModalOpen && (
        <GoogleAuthModal
          isOpen={googleAuthModalOpen}
          onClose={() => setGoogleAuthModalOpen(false)}
          currentUser={user}
          onLoginSuccess={(updatedUser) => {
            setUser(updatedUser);
            setIsAuthenticated(true);
            setSuccessToast(`Google session updated for ${updatedUser.email}`);
          }}
          onLogout={handleLogout}
        />
      )}

      {instagramConnectModalOpen && (
        <InstagramConnectModal
          isOpen={instagramConnectModalOpen}
          onClose={() => setInstagramConnectModalOpen(false)}
          instagram={instagram}
          user={user}
          onConnectSuccess={(conn) => {
            setInstagram(conn);
            setSuccessToast(`@${conn.username} linked to your account!`);
          }}
          onDisconnect={handleDisconnectInstagram}
          onOpenGoogleAuth={() => setGoogleAuthModalOpen(true)}
        />
      )}

      {diagnosticsModalOpen && (
        <DiagnosticsModal onClose={() => setDiagnosticsModalOpen(false)} />
      )}
    </div>
  );
}

