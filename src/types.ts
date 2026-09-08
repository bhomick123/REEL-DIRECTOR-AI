// Shared TypeScript Types for REEL DIRECTOR AI

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  brandNiche?: string;
  createdAt: string;
  avatarUrl?: string;
}

export interface InstagramConnection {
  isConnected: boolean;
  username?: string;
  profilePictureUrl?: string;
  accountType?: 'CREATOR' | 'BUSINESS' | 'PERSONAL';
  followersCount?: number;
  followsCount?: number;
  mediaCount?: number;
  biography?: string;
  website?: string;
  connectedAt?: string;
  permissionsGranted?: string[];
  tokenExpiresAt?: string;
  isMockDemo?: false;
}

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  mediaType: 'VIDEO' | 'IMAGE' | 'CAROUSEL_ALBUM';
  mediaProductType?: 'REELS' | 'FEED';
  timestamp: string;
  permalink: string;
  thumbnailUrl?: string;
  likeCount?: number;
  commentsCount?: number;
  viewsCount?: number;
  reach?: number;
  sharesCount?: number;
  savedCount?: number;
}

export interface InstagramPerformanceInsights {
  overallScore: number;
  averageReelViews: number;
  averageReach: number;
  engagementRate: number;
  averageLikes: number;
  averageComments: number;
  averageShares: number;
  averageSaves: number;
  bestPerformingDay: string;
  bestPostingTimeWindow: string;
  bestPerformingReel?: {
    id: string;
    caption: string;
    views: number;
    permalink: string;
  };
  contentPatterns: string[];
  hasSufficientData: boolean;
  dataNotice?: string;
}

export interface VideoFrameSample {
  timestamp: number; // in seconds
  formattedTime?: string; // e.g. "00:00.8"
  label: string;
  role?: 'opening' | 'hook' | 'transition' | 'detail' | 'payoff' | 'loop_reset' | 'cover';
  dataUrl: string; // base64 jpeg
}

export interface SceneCutEvent {
  timestamp: number;
  formattedTime: string;
  confidence: number; // 0 to 1
  description: string;
  intensityScore: number;
}

export interface TimelineEvent {
  timestamp: number;
  formattedTime: string;
  type: 'opening' | 'hook' | 'scene_change' | 'visual_detail' | 'audio_shift' | 'silence' | 'payoff' | 'loop_reset';
  visualObservation?: string;
  audioObservation?: string;
  editingObservation?: string;
  sceneChangeConfidence?: number;
}

export interface AudioMetrics {
  hasAudio: boolean;
  isMusicDetected: boolean;
  isSpeechDetected: boolean;
  estimatedBpm?: number | null; // null/undefined if unmeasured or unavailable
  speechClarityScore?: number;
  averageLoudnessDb?: number;
  peakAmplitude?: number;
  silenceRegionsCount?: number;
  loudSegmentsSummary?: string;
  musicVoiceBalance?: string;
  transcript?: string | null;
  transcriptStatus?: 'available' | 'unavailable' | 'not_configured';
  audioDirection: string;
}

export interface ReelSubscores {
  hook: number;
  scrollStop: number;
  fashionPresentation: number;
  outfitVisibility: number;
  visualQuality: number;
  editing: number;
  pacing: number;
  audio: number;
  musicBeatCompatibility: number;
  professionalism: number;
  premiumAesthetic: number;
  instagramSuitability: number;
  brandSuitability: number;
}

export interface TimelineEditNote {
  timestampRange: string; // e.g. "00:00 - 00:00.8"
  type: 'cut' | 'keep' | 'trim' | 'enhance' | 'audio' | 'overlay';
  title: string;
  suggestion: string;
  impactScore?: string;
}

export interface HookSuggestion {
  rank: 'Gold' | 'Silver' | 'Bronze' | 'Alternative';
  text: string;
  whyItFits: string;
  deliveryStyle: 'Voiceover' | 'On-screen text' | 'Both';
}

export interface OnScreenTextSuggestion {
  text: string;
  position: 'Center' | 'Top Safe Zone' | 'Lower Third' | 'Side Accent';
  suggestedTiming: string;
  styleAdvice: string;
}

export interface CaptionOptions {
  minimalPremium: string;
  casualCreator: string;
  highEngagement: string;
}

export interface CoverRecommendation {
  timestamp: number;
  formattedTime: string;
  previewUrl?: string;
  rationale: string;
  faceVisibility: 'Clear' | 'Partial' | 'Silhouette' | 'Not Visible';
  outfitVisibility: 'Full Body' | 'Detailed Close-up' | 'Half Body';
  suggestedOverlayTitles: string[];
}

export interface ReelAnalysisResult {
  id: string;
  reelNumber: number;
  fileName: string;
  videoUrl?: string;
  previewUrl?: string;
  durationSeconds: number;
  fileSizeMb: number;
  overallScore: number;
  rank?: number;
  isWinner?: boolean;
  subscores: ReelSubscores;
  scrollStopScore: number;
  scrollStopRationale: string;
  viralPotential: {
    level: 'Very High' | 'High' | 'Medium' | 'Low';
    score: number;
    signals: string[];
    disclaimer: string;
  };
  visualAnalysis: {
    openingFrameQuality: string;
    lightingAndColor: string;
    outfitDetailsAndStyling: string;
    compositionAndCameraWork: string;
    aestheticVibe: string;
  };
  editingAnalysis: {
    firstThreeSeconds: string;
    pacingAssessment: string;
    transitionObservations: string;
    loopPotential: string;
  };
  audioAnalysis: AudioMetrics;
  timelineFeedback: TimelineEditNote[];
  hooks: HookSuggestion[];
  onScreenText: OnScreenTextSuggestion[];
  captions: CaptionOptions;
  keywords: string[];
  hashtags: string[]; // exactly 5
  ctaAdvice: {
    recommended: boolean;
    suggestion: string;
    rationale: string;
  };
  audioStrategy: {
    action: 'Keep' | 'Replace' | 'Duck under voice' | 'Sync to beat' | 'Add trending aesthetic beat';
    tempoMoodDirection: string;
    notes: string;
  };
  coverRecommendation: CoverRecommendation;
  sceneCuts?: SceneCutEvent[];
  timelineEvents?: TimelineEvent[];
  improvementSteps: {
    stepNumber: number;
    description: string;
    estimatedLift: number;
  }[];
  potentialScoreAfterImprovement: number;
  analyzedAt: string;
}

export interface MultiReelComparison {
  id: string;
  createdAt: string;
  title: string;
  reels: ReelAnalysisResult[];
  winnerId: string;
  winnerReelNumber: number;
  winnerRationale: {
    strongestOpening: string;
    bestOutfitPresentation: string;
    bestPacing: string;
    bestEnding: string;
    bestAudioSync: string;
    advantageOverSecondPlace: string;
  };
  secondPlaceCritique?: {
    id: string;
    reelNumber: number;
    whyItLost: string;
  };
  recommendedPostingDay?: string;
  recommendedPostingTime: string;
  postingWindowRationale: string;
  hasSufficientPostingData?: boolean;
  postingDataNotice?: string;
}

export interface TrendRadarItem {
  id: string;
  topic: string;
  category: 'Fashion Format' | 'Editing Style' | 'Audio Direction' | 'Seasonal Aesthetic';
  description: string;
  confidence: 'High' | 'Medium' | 'Low';
  detectedDate: string;
  sourceOrigin: string;
  relevanceToCreator: string;
}

export interface CreatorMemoryProfile {
  preferredFashionStyles: string[];
  optimalReelDurationRange: string;
  highestScoringFormats: string[];
  preferredHookStyles: string[];
  bestPostingWindows: string[];
  totalReelsAnalyzed: number;
  averageScoreAcrossUploads: number;
  insightsSummary: string;
}

export interface PredictionVsRealityItem {
  id: string;
  reelTitle: string;
  postDate: string;
  predictedScore: number;
  actualViews?: number;
  actualReach?: number;
  actualLikes?: number;
  actualSaves?: number;
  actualShares?: number;
  accuracyRating?: 'High Correlation' | 'Moderate' | 'Pending Data';
  takeaway: string;
}

export interface DiagnosticsStatus {
  geminiApiConfigured: boolean;
  geminiModel: string;
  instagramOAuthConfigured: boolean;
  instagramClientIdPresent: boolean;
  instagramClientSecretPresent: boolean;
  instagramTokenConnected: boolean;
  serverPort: number;
  serverUptimeSeconds: number;
  totalJobsProcessed: number;
  activeJobsCount: number;
  lastJobDurationMs?: number;
}

// Ask Your Reel Director Chat Types
export interface DirectorChatMessage {
  id: string;
  sender: 'user' | 'director';
  text: string;
  timestamp: string;
  relatedReelNumber?: number;
}

export interface DirectorChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export interface DirectorChatRequest {
  message: string;
  currentReelId?: string;
  activeComparison?: MultiReelComparison;
  history?: DirectorChatHistoryItem[];
  userNiche?: string;
}

export interface DirectorChatResponse {
  success: boolean;
  reply: string;
  referencedReels?: number[];
  referencedTimestamps?: string[];
}

