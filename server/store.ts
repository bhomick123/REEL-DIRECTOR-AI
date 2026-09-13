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
import crypto from 'crypto';

const SESSION_FILE = path.join(process.cwd(), '.instagram_session.json');
const USER_SESSIONS_FILE = path.join(process.cwd(), '.user_sessions.json');
const AUTH_SESSIONS_FILE = path.join(process.cwd(), '.auth_sessions.json');

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
  private sessions: Map<string, { userId: string; createdAt: number }> = new Map();
  private oauthStates: Map<string, { userId: string; createdAt: number }> = new Map();
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
        bestPostingWindows: initialInsights.bestPostingTimeWindow && initialInsights.bestPostingTimeWindow !== 'Not enough data yet' ? [initialInsights.bestPostingTimeWindow] : [],
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

      // Load all persisted user accounts (e.g. Google-authenticated creator accounts)
      if (fs.existsSync(USER_SESSIONS_FILE)) {
        const rawUsers = fs.readFileSync(USER_SESSIONS_FILE, 'utf-8');
        const parsedUsers: Record<string, UserData> = JSON.parse(rawUsers);
        for (const [uid, udata] of Object.entries(parsedUsers)) {
          if (udata && udata.profile) {
            if (udata.instagramMedia && udata.instagramMedia.length > 0 && !udata.insights) {
              udata.insights = computeAccountPerformance(udata.instagramMedia, udata.instagram?.followersCount || 0);
            }
            this.users.set(uid, udata);
          }
        }
      }
      // Load auth sessions
      if (fs.existsSync(AUTH_SESSIONS_FILE)) {
        try {
          const rawSessions = fs.readFileSync(AUTH_SESSIONS_FILE, 'utf-8');
          const parsed = JSON.parse(rawSessions);
          for (const [token, sData] of Object.entries(parsed as Record<string, { userId: string; createdAt: number }>)) {
            if (sData && sData.userId) {
              this.sessions.set(token, sData);
            }
          }
        } catch (e) {
          console.error('Failed to parse auth sessions:', e);
        }
      }
    } catch (err) {
      console.error('Error reading session files:', err);
    }
  }

  saveSessions() {
    try {
      const obj: Record<string, { userId: string; createdAt: number }> = {};
      for (const [token, data] of this.sessions.entries()) {
        obj[token] = data;
      }
      fs.writeFileSync(AUTH_SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist auth sessions:', err);
    }
  }

  createSession(userId: string): string {
    const token = crypto.randomUUID();
    this.sessions.set(token, {
      userId,
      createdAt: Date.now(),
    });
    this.saveSessions();
    return token;
  }

  validateSession(token: string): string | null {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;

    // 30 days validity
    const maxAge = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - session.createdAt > maxAge) {
      this.sessions.delete(token);
      this.saveSessions();
      return null;
    }

    return session.userId;
  }

  destroySession(token: string): void {
    if (token && this.sessions.has(token)) {
      this.sessions.delete(token);
      this.saveSessions();
    }
  }

  saveUserSession(userId: string) {
    try {
      const user = this.getUser(userId);
      let allUsers: Record<string, any> = {};
      if (fs.existsSync(USER_SESSIONS_FILE)) {
        try {
          allUsers = JSON.parse(fs.readFileSync(USER_SESSIONS_FILE, 'utf-8'));
        } catch {
          allUsers = {};
        }
      }
      allUsers[userId] = {
        profile: user.profile,
        instagram: user.instagram,
        instagramAccessToken: user.instagramAccessToken,
        instagramMedia: user.instagramMedia,
        insights: user.insights,
        creatorMemory: user.creatorMemory,
      };
      fs.writeFileSync(USER_SESSIONS_FILE, JSON.stringify(allUsers, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Failed to persist user session for ${userId}:`, err);
    }
  }

  createOAuthState(userId: string): string {
    if (!userId) {
      throw new Error('User ID is required to generate OAuth state');
    }
    const state = crypto.randomBytes(24).toString('hex');
    this.oauthStates.set(state, { userId, createdAt: Date.now() });

    // Evict expired state entries (> 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [key, data] of this.oauthStates.entries()) {
      if (data.createdAt < tenMinutesAgo) {
        this.oauthStates.delete(key);
      }
    }
    return state;
  }

  consumeOAuthState(state: string): string | null {
    if (!state || typeof state !== 'string') return null;
    const cleanState = state.trim();
    const data = this.oauthStates.get(cleanState);
    if (!data) return null;
    this.oauthStates.delete(cleanState);

    // Enforce 10-minute expiry window
    if (Date.now() - data.createdAt > 10 * 60 * 1000) {
      return null;
    }
    return data.userId;
  }

  saveInstagramSession(userId: string) {
    try {
      if (!userId) return;
      const user = this.getUser(userId);
      const sessionData = {
        instagram: user.instagram,
        instagramAccessToken: user.instagramAccessToken,
        instagramMedia: user.instagramMedia,
      };
      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2), 'utf-8');
      this.saveUserSession(userId);
    } catch (err) {
      console.error('Failed to persist Instagram session:', err);
    }
  }

  setGoogleUser(profileData: {
    id?: string;
    email: string;
    name?: string;
    avatarUrl?: string;
    googleId?: string;
  }): UserData {
    const cleanEmail = profileData.email.trim().toLowerCase();
    // Stable unique user ID by googleId or sanitized email
    const userId = profileData.googleId
      ? `google_${profileData.googleId}`
      : `user_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

    const existing = this.users.get(userId);
    const now = new Date().toISOString();
    if (existing) {
      existing.profile.name = profileData.name || existing.profile.name;
      existing.profile.email = cleanEmail;
      existing.profile.avatarUrl = profileData.avatarUrl || existing.profile.avatarUrl;
      existing.profile.isGoogleAuthenticated = true;
      existing.profile.googleId = profileData.googleId || existing.profile.googleId;
      existing.profile.lastLoginAt = now;
      this.saveUserSession(userId);
      return existing;
    }

    // New Google user account - isolated with clean initial state
    const newUser = this.getUser(userId);
    newUser.profile = {
      id: userId,
      name: profileData.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      brandNiche: 'Fashion, Lifestyle & Creative Direction',
      createdAt: now,
      lastLoginAt: now,
      avatarUrl:
        profileData.avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          profileData.name || cleanEmail
        )}`,
      isGoogleAuthenticated: true,
      googleId: profileData.googleId,
    };

    // Brand new user starts with no Instagram connection and no inherited demo data
    newUser.instagram = { isConnected: false, permissionsGranted: [] };
    newUser.instagramAccessToken = undefined;
    newUser.instagramMedia = [];
    newUser.insights = undefined;

    this.saveUserSession(userId);
    return newUser;
  }

  disconnectInstagram(userId: string): void {
    if (!userId) return;
    const user = this.getUser(userId);
    user.instagram = { isConnected: false, permissionsGranted: [] };
    user.instagramAccessToken = undefined;
    user.instagramMedia = [];
    user.insights = undefined;
    this.saveInstagramSession(userId);
  }

  getUser(userId: string): UserData {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('A valid authenticated userId is required to access user data.');
    }
    const cleanId = userId.trim();
    let user = this.users.get(cleanId);
    if (!user) {
      user = {
        profile: {
          id: cleanId,
          name: 'Creator',
          email: `${cleanId}@reeldirector.ai`,
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
      this.users.set(cleanId, user);
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

  getDiagnostics(userId?: string): DiagnosticsStatus {
    const isGeminiSet = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
    const isInstaClientIdSet = !!process.env.INSTAGRAM_CLIENT_ID;
    const isInstaSecretSet = !!process.env.INSTAGRAM_CLIENT_SECRET;
    const activeUser = userId ? this.users.get(userId) : undefined;

    return {
      geminiApiConfigured: isGeminiSet,
      geminiModel: 'gemini-3.6-flash',
      instagramOAuthConfigured: isInstaClientIdSet && isInstaSecretSet,
      instagramClientIdPresent: isInstaClientIdSet,
      instagramClientSecretPresent: isInstaSecretSet,
      instagramTokenConnected: !!activeUser?.instagram?.isConnected,
      serverPort: 3000,
      serverUptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      totalJobsProcessed: this.totalJobsProcessed,
      activeJobsCount: this.activeJobsCount,
      lastJobDurationMs: this.lastJobDurationMs,
    };
  }
}

export const store = new Store();
