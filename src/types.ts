// Shared TypeScript Types for REEL DIRECTOR AI

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  brandNiche?: string;
  preferredStyle?: string;
  primaryGoal?: string;
  createdAt?: string;
  avatarUrl?: string;
  isGoogleAuthenticated?: boolean;
  googleId?: string;
  lastLoginAt?: string;
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

export interface PerformanceMetricDetail {
  value: number | null;
  formatted: string;
  isAvailable: boolean;
  unavailableReason?: string;
  label: string;
  description: string;
  calculationNote?: string;
}

export interface PerformancePatternItem {
  title: string;
  finding: string;
  evidence: string;
  takeaway: string;
}

export interface ContentStrategyRecommendation {
  id: string;
  priority: 'High' | 'Medium' | 'Test';
  title: string;
  category: 'Topic & Theme' | 'Hook & Structure' | 'Caption & Discussion' | 'Posting Schedule';
  actionableStep: string;
  whyBasedOnActualData: string; // Grounded in real performance numbers
  supportingMetrics: string; // e.g. "Top Reel achieved 320 likes vs 140 average"
  expectedImpact: string;
}

export interface NextReelRecommendation {
  conceptTitle: string;
  coreHook: string;
  visualFormat: string;
  captionPrompt: string;
  suggestedPostingDayAndTime: string;
  whyThisWillWork: string;
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
  viewsCount?: number | null; // null if unprovided by Graph API
  reach?: number | null; // null if unprovided by Graph API
  sharesCount?: number | null; // null if unprovided by Graph API
  savedCount?: number | null; // null if unprovided by Graph API
  engagementRate?: number;
  isTopPerformer?: boolean;
  isLowestPerformer?: boolean;
}

export interface InstagramPerformanceInsights {
  overallScore: number;
  totalReelsAnalyzed: number;
  totalFeedPostsAnalyzed?: number;
  
  // Available vs Unavailable Metric Summaries (never invented)
  metrics: {
    views: PerformanceMetricDetail;
    reach: PerformanceMetricDetail;
    likes: PerformanceMetricDetail;
    comments: PerformanceMetricDetail;
    shares: PerformanceMetricDetail;
    saves: PerformanceMetricDetail;
    engagementRate: PerformanceMetricDetail;
  };

  // Feature 1: Strongest and Weakest Patterns
  strongestPatterns: PerformancePatternItem[];
  weakestPatterns: PerformancePatternItem[];

  // Top and Bottom Reels
  bestPerformingReel?: {
    id: string;
    caption: string;
    views: number | null;
    reach: number | null;
    likes: number;
    comments: number;
    permalink: string;
    publishedDate: string;
    whyItWon: string;
  };
  lowestPerformingReel?: {
    id: string;
    caption: string;
    views: number | null;
    reach: number | null;
    likes: number;
    comments: number;
    permalink: string;
    publishedDate: string;
    bottleneck: string;
  };

  // Feature 2: Content Strategy Recommendations
  nextReelRecommendation?: NextReelRecommendation;
  strategyRecommendations: ContentStrategyRecommendation[];
  contentThemesDetected: Array<{ theme: string; count: number; avgLikes: number }>;

  // Existing compatibility fields
  averageReelViews: number;
  averageReach: number;
  engagementRate: number;
  averageLikes: number;
  averageComments: number;
  averageShares: number;
  averageSaves: number;
  bestPerformingDay: string;
  bestPostingTimeWindow: string;
  contentPatterns: string[];
  hasSufficientData: boolean;
  dataNotice?: string;
}

// FEATURE: CREATE MY NEXT REEL
export interface NextReelHookOption {
  hookNumber: 1 | 2 | 3;
  hookText: string;
  style: string;
  deliveryNotes: string;
  psychologicalTrigger: string;
}

export interface NextReelScriptScene {
  sceneNumber: number;
  timestamp: string;
  shotType: string;
  visualAction: string;
  spokenAudioOrText: string;
  onScreenText?: string;
  directorNote: string;
}

export interface NextReelConceptResult {
  hasSufficientData: boolean;
  dataNotice?: string;
  reelIdea: {
    title: string;
    concept: string;
    targetDuration: string;
    contentFormat: string;
    bestPostingWindow: string;
  };
  hooks: NextReelHookOption[];
  script: {
    scenes: NextReelScriptScene[];
    totalEstimatedDuration: string;
    filmingChecklist: string[];
    audioDirection: string;
  };
  caption: string;
  cta: {
    primaryText: string;
    type: 'Comment-Driving' | 'Save-Oriented' | 'Share-Driven';
    rationale: string;
  };
  hashtags: string[];
  whyThisShouldWork: {
    explanation: string;
    dataGroundingEvidence: string;
    connectedPatterns: string[];
    metricsReferenced: {
      accountMetric: string;
      value: string;
      influenceOnConcept: string;
    }[];
  };
  generatedAt: string;
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
  sampledFrameTimestamps?: string[];
  sampledFrames?: Array<{
    timestamp: number;
    formattedTime: string;
    label: string;
    role?: string;
  }>;
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

// Ask Your Reel Director / Photo Director Chat Types
export interface DirectorChatMessage {
  id: string;
  sender: 'user' | 'director';
  text: string;
  timestamp: string;
  relatedReelNumber?: number;
  relatedPhotoNumber?: number;
  referencedPhotos?: number[];
}

export interface DirectorChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export interface DirectorChatRequest {
  message: string;
  currentReelId?: string;
  activeComparison?: MultiReelComparison;
  activePhotoSet?: PhotoSetAnalysisResult;
  currentPhotoNumber?: number;
  unifiedRecommendation?: UnifiedContentRecommendation;
  history?: DirectorChatHistoryItem[];
  userNiche?: string;
}

export interface DirectorChatResponse {
  success: boolean;
  reply: string;
  referencedReels?: number[];
  referencedPhotos?: number[];
  referencedTimestamps?: string[];
}

// ========================================================
// PHOTO DIRECTOR TYPES & INTERFACES
// ========================================================

export type PhotoVerdictStatus = 'POST' | 'MAYBE' | 'DONT_POST';

export interface PhotoEvaluationFactors {
  composition: string;
  lighting: string;
  exposure: string;
  sharpness: string;
  poseAndExpression: string;
  outfitPresentation: string;
  backgroundAndFraming: string;
  distractions: string;
}

export interface IndividualPhotoAnalysis {
  id: string;
  photoNumber: number;
  fileName: string;
  previewUrl: string;
  status: PhotoVerdictStatus;
  score: number; // 0-100
  verdictSummary: string;
  evaluatedFactors: PhotoEvaluationFactors;
  strengths: string[];
  weaknesses: string[];
  practicalImprovements: string[];
  retakeRecommended: boolean;
  retakeAdvice?: string;
}

export interface CarouselOrderRecommendation {
  isRecommended: boolean;
  recommendedOrder: number[]; // e.g. [3, 1, 4, 2] of Photo numbers
  firstSlidePhotoNumber: number;
  firstSlideRationale: string;
  flowRationale: string;
}

export interface PhotoCaptions {
  minimal: string;
  stylish: string;
  confident: string;
  natural: string;
  witty: string;
}

export interface PhotoSetAnalysisResult {
  id: string;
  createdAt: string;
  totalPhotosAnalyzed: number;
  photos: IndividualPhotoAnalysis[];
  overallVerdict: string;
  verdictType: 'CAROUSEL' | 'SINGLE_POST' | 'NO_POST';
  recommendedPostPhotoNumbers: number[];
  maybePostPhotoNumbers: number[];
  dontPostPhotoNumbers: number[];
  strongestPhotoNumber: number | null;
  weakestPhotoNumber: number | null;
  isVisuallyRepetitive: boolean;
  repetitiveObservation?: string;
  setObservations: string[];
  carouselOrder?: CarouselOrderRecommendation;
  singlePhotoRationale?: string;
  noPostRationale?: string;
  captions: PhotoCaptions;
  hashtags: [string, string, string, string, string]; // Exactly 5 content-specific hashtags
  // Verified posting-time integration from Phase 1
  recommendedPostingDay?: string;
  recommendedPostingTime: string;
  postingWindowRationale: string;
  hasSufficientPostingData?: boolean;
  postingDataNotice?: string;
}

// ========================================================
// PHASE 3: UNIFIED CONTENT DIRECTOR TYPES
// ========================================================

export type UnifiedRecommendationType =
  | 'REEL'
  | 'SINGLE_PHOTO'
  | 'CAROUSEL'
  | 'DONT_POST'
  | 'NOT_ENOUGH_DATA';

export type RecommendationConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type UserPostingPreference = 'ALL' | 'REEL' | 'PHOTO' | 'CAROUSEL';

export interface UnifiedContentRecommendation {
  id: string;
  createdAt: string;
  recommendationType: UnifiedRecommendationType;
  recommendedReelId?: string;
  recommendedReelNumber?: number;
  recommendedPhotoNumbers?: number[];
  confidence: RecommendationConfidence;
  headline: string; // e.g. "POST THE REEL", "POST THE CAROUSEL", "POST SINGLE PHOTO", "DON'T POST ANY OF THESE YET", "NOT ENOUGH DATA YET"
  selectedTitle: string; // e.g. "Reel #2 — Paris Evening Look" or "Carousel (Photos #1, #3, #5)"
  reasoning: string;
  evidence: string[]; // 3-5 concise evidence points
  strengths: string[];
  risks: string[]; // specific weaknesses / "Watch out for"
  alternativeOption?: string;
  userPreferenceApplied?: 'REEL' | 'PHOTO' | 'CAROUSEL' | 'NONE';
  contentAvailability: {
    hasReels: boolean;
    reelsCount: number;
    hasPhotos: boolean;
    photosCount: number;
  };
  postingDataState: 'SUFFICIENT' | 'INSUFFICIENT' | 'DISCONNECTED';
  hasSufficientPostingData?: boolean;
  recommendedPostingDay?: string;
  recommendedPostingTime: string;
  postingWindowRationale: string;
  postingDataNotice?: string;
}

export interface UnifiedRecommendationRequest {
  comparison?: MultiReelComparison;
  photoSet?: PhotoSetAnalysisResult;
  userPreference?: UserPostingPreference;
  userNiche?: string;
}


