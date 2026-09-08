// In-memory persistent store for sessions, creator memory, and Reel analyses
import {
  UserProfile,
  InstagramConnection,
  InstagramMediaItem,
  InstagramPerformanceInsights,
  ReelAnalysisResult,
  MultiReelComparison,
  CreatorMemoryProfile,
  PredictionVsRealityItem,
  DiagnosticsStatus,
} from '../src/types.js';

interface UserData {
  profile: UserProfile;
  instagram: InstagramConnection;
  instagramMedia: InstagramMediaItem[];
  insights?: InstagramPerformanceInsights;
  analyses: ReelAnalysisResult[];
  comparisons: MultiReelComparison[];
  creatorMemory: CreatorMemoryProfile;
  predictions: PredictionVsRealityItem[];
}

class Store {
  private users: Map<string, UserData> = new Map();
  public startTime = Date.now();
  public totalJobsProcessed = 0;
  public activeJobsCount = 0;
  public lastJobDurationMs = 0;

  constructor() {
    // Seed a default creator user session
    const defaultUserId = 'creator-primary';
    this.users.set(defaultUserId, {
      profile: {
        id: defaultUserId,
        name: 'Sofia Martinez',
        email: 'singhbhomick9@gmail.com',
        brandNiche: 'High-Street Minimal & Luxury Fashion',
        createdAt: new Date().toISOString(),
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      },
      instagram: {
        isConnected: false,
        permissionsGranted: [],
      },
      instagramMedia: [],
      analyses: [],
      comparisons: [],
      creatorMemory: {
        preferredFashionStyles: ['Minimalist Monochrome', 'Tailored Suiting', 'Effortless Luxury Casual'],
        optimalReelDurationRange: '7s – 11s',
        highestScoringFormats: ['Outfit Reveal with Fast Transition', 'Paced Texture Close-up to Full Body'],
        preferredHookStyles: ['Quiet Luxury Detail Opener', 'Direct Value Statement'],
        bestPostingWindows: ['Not enough data yet'],
        totalReelsAnalyzed: 0,
        averageScoreAcrossUploads: 0,
        insightsSummary: 'Audience demonstrates highest retention when outfit details are framed in the first 1.2 seconds, paired with non-intrusive ambient audio.',
      },
      predictions: [
        {
          id: 'prev-pred-1',
          reelTitle: 'Oversized Blazer & Raw Denim Styling',
          postDate: '2026-08-28',
          predictedScore: 92,
          actualViews: 48500,
          actualReach: 41200,
          actualLikes: 3420,
          actualSaves: 1290,
          actualShares: 640,
          accuracyRating: 'High Correlation',
          takeaway: 'Quick opening hook (<1.1s) led to 68% completion rate, verifying AI hook prediction.',
        },
        {
          id: 'prev-pred-2',
          reelTitle: 'Monochrome Linen Transitional Fit',
          postDate: '2026-08-15',
          predictedScore: 86,
          actualViews: 28900,
          actualReach: 24300,
          actualLikes: 1850,
          actualSaves: 740,
          actualShares: 290,
          accuracyRating: 'High Correlation',
          takeaway: 'Pacing was slightly delayed around 00:04.2, which dampened rewatches as predicted.',
        }
      ],
    });
  }

  getUser(userId = 'creator-primary'): UserData {
    let user = this.users.get(userId);
    if (!user) {
      user = {
        profile: {
          id: userId,
          name: 'Creator',
          email: `${userId}@reeldirector.ai`,
          brandNiche: 'Fashion & Aesthetic Content',
          createdAt: new Date().toISOString(),
        },
        instagram: { isConnected: false },
        instagramMedia: [],
        analyses: [],
        comparisons: [],
        creatorMemory: {
          preferredFashionStyles: [],
          optimalReelDurationRange: '8s – 12s',
          highestScoringFormats: [],
          preferredHookStyles: [],
          bestPostingWindows: [],
          totalReelsAnalyzed: 0,
          averageScoreAcrossUploads: 0,
          insightsSummary: 'Collect more Reels to identify creator-specific performance patterns.',
        },
        predictions: [],
      };
      this.users.set(userId, user);
    }
    return user;
  }

  saveAnalysis(userId: string, analysis: ReelAnalysisResult) {
    const user = this.getUser(userId);
    // Remove if already exists with same id
    user.analyses = [analysis, ...user.analyses.filter(a => a.id !== analysis.id)];
    
    // Update creator memory stats
    const total = user.analyses.length;
    const avgScore = Math.round(user.analyses.reduce((acc, a) => acc + a.overallScore, 0) / total);
    user.creatorMemory.totalReelsAnalyzed = total;
    user.creatorMemory.averageScoreAcrossUploads = avgScore;
  }

  saveComparison(userId: string, comparison: MultiReelComparison) {
    const user = this.getUser(userId);
    user.comparisons = [comparison, ...user.comparisons.filter(c => c.id !== comparison.id)];
  }

  getDiagnostics(): DiagnosticsStatus {
    const isGeminiSet = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
    const isInstaClientIdSet = !!process.env.INSTAGRAM_CLIENT_ID;
    const isInstaSecretSet = !!process.env.INSTAGRAM_CLIENT_SECRET;
    const user = this.getUser('creator-primary');

    return {
      geminiApiConfigured: isGeminiSet,
      geminiModel: 'gemini-3.8-flash',
      instagramOAuthConfigured: isInstaClientIdSet && isInstaSecretSet,
      instagramClientIdPresent: isInstaClientIdSet,
      instagramClientSecretPresent: isInstaSecretSet,
      instagramTokenConnected: user.instagram.isConnected,
      serverPort: 3000,
      serverUptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      totalJobsProcessed: this.totalJobsProcessed,
      activeJobsCount: this.activeJobsCount,
      lastJobDurationMs: this.lastJobDurationMs,
    };
  }
}

export const store = new Store();
