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
  NextReelConceptResult,
} from '../src/types.js';
import { computeAccountPerformance } from './instagramService.js';
import fs from 'fs';
import path from 'path';

const SESSION_FILE = path.join(process.cwd(), '.instagram_session.json');

interface UserData {
  profile: UserProfile;
  instagram: InstagramConnection;
  instagramAccessToken?: string;
  instagramMedia: InstagramMediaItem[];
  insights?: InstagramPerformanceInsights;
  analyses: ReelAnalysisResult[];
  comparisons: MultiReelComparison[];
  creatorMemory: CreatorMemoryProfile;
  predictions: PredictionVsRealityItem[];
  nextReelConcept?: NextReelConceptResult;
}

class Store {
  private users: Map<string, UserData> = new Map();
  public startTime = Date.now();
  public totalJobsProcessed = 0;
  public activeJobsCount = 0;
  public lastJobDurationMs = 0;

  constructor() {
    // Seed the primary creator user session with connected Instagram Professional account
    const defaultUserId = 'creator-primary';

    const initialMedia: InstagramMediaItem[] = [
      {
        id: '18023456789012345',
        caption: 'High-Low Layering Transition. Structured wool blazer paired with relaxed wide-leg denim. Fit 1 or Fit 2? Let me know which silhouette you\'d wear in the comments.\n\n#minimalstyle #tailoredblazer #stylingideas #outfitinspo #fashionreels',
        mediaType: 'VIDEO',
        mediaProductType: 'REELS',
        timestamp: '2026-09-01T18:30:00.000Z',
        permalink: 'https://www.instagram.com/reel/C-xyz123/',
        thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
        likeCount: 3420,
        commentsCount: 384,
        viewsCount: 48500,
        reach: 41200,
        sharesCount: 640,
        savedCount: 1290,
      },
      {
        id: '18023456789012346',
        caption: 'Monochrome Linen Transitional Fit. Tailored pleated trousers and relaxed button-down for warm September afternoons. Which accessories elevate this most?\n\n#monochromefashion #cleanlines #tailoring #autumnprep',
        mediaType: 'VIDEO',
        mediaProductType: 'REELS',
        timestamp: '2026-08-25T18:15:00.000Z',
        permalink: 'https://www.instagram.com/reel/C-xyz124/',
        thumbnailUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
        likeCount: 2890,
        commentsCount: 245,
        viewsCount: 36200,
        reach: 31000,
        sharesCount: 410,
        savedCount: 890,
      },
      {
        id: '18023456789012347',
        caption: '3 Ways to Style a Tailored Charcoal Trench. Day meeting, gallery opening, and evening dinner. Full styling notes in the first comment.\n\n#trenchoatstyling #fashionreels #fallessentials #capsulewardrobe',
        mediaType: 'VIDEO',
        mediaProductType: 'REELS',
        timestamp: '2026-08-18T19:00:00.000Z',
        permalink: 'https://www.instagram.com/reel/C-xyz125/',
        thumbnailUrl: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=600&q=80',
        likeCount: 3150,
        commentsCount: 312,
        viewsCount: 42100,
        reach: 37400,
        sharesCount: 520,
        savedCount: 1140,
      },
      {
        id: '18023456789012348',
        caption: 'Saturday morning coffee run. Oversized knitwear and vintage leather. Minimal effort, maximum comfort.\n\n#weekendvibes #casualminimalism #cozyfit',
        mediaType: 'VIDEO',
        mediaProductType: 'REELS',
        timestamp: '2026-08-29T10:30:00.000Z',
        permalink: 'https://www.instagram.com/reel/C-xyz126/',
        thumbnailUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
        likeCount: 1940,
        commentsCount: 118,
        viewsCount: 24100,
        reach: 20500,
        sharesCount: 180,
        savedCount: 420,
      },
      {
        id: '18023456789012349',
        caption: 'Sunday mood. 🖤\n\n#mood #aesthetic #fashion',
        mediaType: 'VIDEO',
        mediaProductType: 'REELS',
        timestamp: '2026-08-23T21:45:00.000Z',
        permalink: 'https://www.instagram.com/reel/C-xyz127/',
        thumbnailUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=600&q=80',
        likeCount: 1120,
        commentsCount: 42,
        viewsCount: 15300,
        reach: 13200,
        sharesCount: 85,
        savedCount: 210,
      },
      {
        id: '18023456789012350',
        caption: 'Fabric drape and movement study: Silk blend slip dress with heavyweight tailored overcoat contrast. What do we think of this texture pairing?\n\n#fabricdrape #contraststyling #luxuryminimal #reelsdaily',
        mediaType: 'VIDEO',
        mediaProductType: 'REELS',
        timestamp: '2026-08-11T18:45:00.000Z',
        permalink: 'https://www.instagram.com/reel/C-xyz128/',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
        likeCount: 2650,
        commentsCount: 260,
        viewsCount: 33400,
        reach: 28900,
        sharesCount: 360,
        savedCount: 910,
      },
    ];

    const initialConnection: InstagramConnection = {
      isConnected: true,
      username: 'sofia.martinez.style',
      accountType: 'CREATOR',
      followersCount: 42800,
      followsCount: 412,
      mediaCount: 184,
      biography: 'Minimalist tailoring, high-low silhouettes & structured wardrobe curation. Director’s cut.',
      website: 'https://sofiamartinez.style',
      profilePictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      connectedAt: '2026-09-01T12:00:00.000Z',
      permissionsGranted: ['instagram_business_basic'],
    };

    const initialInsights = computeAccountPerformance(initialMedia, initialConnection.followersCount);

    this.users.set(defaultUserId, {
      profile: {
        id: defaultUserId,
        name: 'Sofia Martinez',
        email: 'singhbhomick9@gmail.com',
        brandNiche: 'High-Street Minimal & Luxury Fashion',
        createdAt: new Date().toISOString(),
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      },
      instagram: initialConnection,
      instagramMedia: initialMedia,
      insights: initialInsights,
      analyses: [],
      comparisons: [],
      creatorMemory: {
        preferredFashionStyles: ['Minimalist Monochrome', 'Tailored Suiting', 'Effortless Luxury Casual'],
        optimalReelDurationRange: '7s – 11s',
        highestScoringFormats: ['Outfit Reveal with Fast Transition', 'Paced Texture Close-up to Full Body'],
        preferredHookStyles: ['Quiet Luxury Detail Opener', 'Direct Value Statement'],
        bestPostingWindows: ['Tuesday: 6:30 PM – 8:30 PM'],
        totalReelsAnalyzed: initialMedia.length,
        averageScoreAcrossUploads: initialInsights.overallScore,
        insightsSummary: 'Audience demonstrates highest retention when outfit details are framed in the first 1.2 seconds, paired with high-contrast styling and binary choice question prompts in captions.',
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
        },
      ],
    });

    // Check for persisted session from live OAuth
    try {
      if (fs.existsSync(SESSION_FILE)) {
        const raw = fs.readFileSync(SESSION_FILE, 'utf-8');
        const session = JSON.parse(raw);
        const user = this.users.get(defaultUserId);
        if (user && session) {
          if (session.instagram) user.instagram = session.instagram;
          if (session.instagramAccessToken) user.instagramAccessToken = session.instagramAccessToken;
          if (Array.isArray(session.instagramMedia) && session.instagramMedia.length > 0) {
            user.instagramMedia = session.instagramMedia;
            user.insights = computeAccountPerformance(user.instagramMedia, user.instagram.followersCount || 0);
          }
        }
      }
    } catch (err) {
      console.error('Error reading Instagram session file:', err);
    }
  }

  saveInstagramSession(userId = 'creator-primary') {
    try {
      const user = this.getUser(userId);
      const sessionData = {
        instagram: user.instagram,
        instagramAccessToken: user.instagramAccessToken,
        instagramMedia: user.instagramMedia,
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist Instagram session:', err);
    }
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
      geminiModel: 'gemini-3.6-flash',
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
