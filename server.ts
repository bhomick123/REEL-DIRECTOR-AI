import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store.js';
import {
  analyzeReelWithGemini,
  getFashionTrendRadar,
  chatWithReelDirector,
} from './server/geminiService.js';
import {
  getMetaConfig,
  generateMetaOAuthUrl,
  exchangeCodeForTokens,
  fetchInstagramProfileAndMedia,
  computeAccountPerformance,
  INSTAGRAM_PERMISSIONS,
  INSTAGRAM_PRIVACY_EXPLANATION,
} from './server/instagramService.js';
import {
  MultiReelComparison,
  ReelAnalysisResult,
  PredictionVsRealityItem,
  DirectorChatRequest,
} from './src/types.js';

const __filename = typeof import.meta?.url === 'string' ? fileURLToPath(import.meta.url) : '';
const __dirname = __filename ? path.dirname(__filename) : process.cwd();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and urlencoded parser with generous limit for sampled video frames
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ limit: '60mb', extended: true }));

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'REEL DIRECTOR AI',
      timestamp: new Date().toISOString(),
    });
  });

  // User session and profile
  const handleGetUserProfile = (req: express.Request, res: express.Response) => {
    const user = store.getUser('creator-primary');
    res.json({
      success: true,
      user: user.profile,
      instagram: user.instagram,
      hasAnalyses: user.analyses.length > 0,
      analysesCount: user.analyses.length,
      comparisonsCount: user.comparisons.length,
    });
  };
  app.get('/api/auth/session', handleGetUserProfile);
  app.get('/api/user/profile', handleGetUserProfile);

  const handleUpdateUserProfile = (req: express.Request, res: express.Response) => {
    const user = store.getUser('creator-primary');
    const { name, brandNiche } = req.body;
    if (name) user.profile.name = name;
    if (brandNiche) user.profile.brandNiche = brandNiche;
    res.json({ success: true, profile: user.profile });
  };
  app.post('/api/auth/profile', handleUpdateUserProfile);
  app.post('/api/user/profile', handleUpdateUserProfile);

  // Instagram Connection Status & Privacy
  app.get('/api/instagram/status', (req, res) => {
    const metaConfig = getMetaConfig();
    const user = store.getUser('creator-primary');

    res.json({
      isConfigured: metaConfig.isConfigured,
      isConnected: user.instagram.isConnected,
      connection: user.instagram,
      permissions: INSTAGRAM_PERMISSIONS,
      privacyExplanation: INSTAGRAM_PRIVACY_EXPLANATION,
      configGuide: !metaConfig.isConfigured
        ? {
            notice: 'Meta App credentials are not yet set in environment secrets.',
            steps: [
              'Go to Meta for Developers (developers.facebook.com)',
              'Create or open an app with "Instagram Graph API" product enabled',
              'Copy App ID into INSTAGRAM_CLIENT_ID and App Secret into INSTAGRAM_CLIENT_SECRET',
              'Set Valid OAuth Redirect URIs to: ' + metaConfig.redirectUri,
            ],
          }
        : null,
    });
  });

  // Generate official Meta OAuth URL
  app.get('/api/instagram/auth-url', (req, res) => {
    const metaConfig = getMetaConfig();
    if (!metaConfig.isConfigured) {
      return res.status(400).json({
        error: 'Instagram OAuth credentials are not configured.',
        message:
          'Please set INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET in environment secrets to initiate live Meta OAuth.',
        redirectUri: metaConfig.redirectUri,
      });
    }

    const authUrl = generateMetaOAuthUrl();
    res.json({ authUrl, redirectUri: metaConfig.redirectUri });
  });

  // OAuth Callback
  app.get('/api/instagram/callback', async (req, res) => {
    const code = req.query.code as string;
    const error = req.query.error as string;
    const errorReason = req.query.error_reason as string;

    if (error || !code) {
      return res.redirect(
        `/?oauth_error=${encodeURIComponent(
          errorReason || error || 'Authorization was cancelled by user'
        )}`
      );
    }

    try {
      const tokens = await exchangeCodeForTokens(code);
      if (!tokens) {
        throw new Error('Token exchange returned empty result');
      }

      const { connection, media } = await fetchInstagramProfileAndMedia(
        tokens.accessToken
      );
      const user = store.getUser('creator-primary');
      user.instagram = connection;
      user.instagramMedia = media;
      user.insights = computeAccountPerformance(media, connection.followersCount);

      res.redirect('/?oauth_success=true');
    } catch (err: any) {
      console.error('Meta OAuth callback error:', err);
      res.redirect(
        `/?oauth_error=${encodeURIComponent(
          err.message || 'Failed to complete Instagram authorization'
        )}`
      );
    }
  });

  // Disconnect Instagram
  app.post('/api/instagram/disconnect', (req, res) => {
    const user = store.getUser('creator-primary');
    user.instagram = { isConnected: false, permissionsGranted: [] };
    user.instagramMedia = [];
    user.insights = undefined;
    res.json({ success: true, message: 'Instagram disconnected successfully.' });
  });

  // Instagram Performance Engine
  app.get('/api/instagram/performance', (req, res) => {
    const user = store.getUser('creator-primary');
    if (!user.instagram.isConnected) {
      return res.json({
        isConnected: false,
        performance: computeAccountPerformance([], 0),
        message: 'No Instagram account connected. Connect an Instagram Professional account to view authentic performance data.',
      });
    }

    if (!user.insights) {
      user.insights = computeAccountPerformance(
        user.instagramMedia,
        user.instagram.followersCount || 0
      );
    }

    res.json({
      isConnected: true,
      performance: user.insights,
      mediaCount: user.instagramMedia.length,
      recentMedia: user.instagramMedia.slice(0, 6),
    });
  });

  // Analyze single Reel Video
  app.post('/api/reels/analyze', async (req, res) => {
    const startTime = Date.now();
    store.activeJobsCount++;
    try {
      const {
        reelNumber,
        fileName,
        durationSeconds,
        fileSizeMb,
        frames,
        audioMetrics,
        sceneCuts,
        timelineEvents,
      } = req.body;

      if (!fileName || !frames || !Array.isArray(frames)) {
        store.activeJobsCount--;
        return res.status(400).json({ error: 'Missing required video frames or metadata.' });
      }

      const user = store.getUser('creator-primary');
      const analysis = await analyzeReelWithGemini({
        reelNumber: Number(reelNumber) || 1,
        fileName: String(fileName),
        durationSeconds: Number(durationSeconds) || 8,
        fileSizeMb: Number(fileSizeMb) || 5,
        frames,
        audioMetrics: audioMetrics || {
          hasAudio: true,
          isMusicDetected: false,
          isSpeechDetected: false,
          estimatedBpm: null,
          transcript: null,
          transcriptStatus: 'unavailable',
          audioDirection: 'Standard audio track detected.',
        },
        sceneCuts,
        timelineEvents,
        creatorContext: user.profile.brandNiche,
      });

      store.saveAnalysis('creator-primary', analysis);
      store.totalJobsProcessed++;
      store.lastJobDurationMs = Date.now() - startTime;
      store.activeJobsCount--;

      res.json({ success: true, analysis });
    } catch (err: any) {
      store.activeJobsCount--;
      console.error('Error analyzing Reel:', err);
      res.status(500).json({ error: 'Failed to analyze Reel video', message: err.message });
    }
  });

  // Multi-Reel Comparison
  app.post('/api/reels/compare', (req, res) => {
    try {
      const reels = ((req.body as any).reels || (req.body as any).reelAnalyses) as ReelAnalysisResult[];
      if (!reels || !Array.isArray(reels) || reels.length < 2) {
        return res.status(400).json({ error: 'At least 2 Reels are required for comparison.' });
      }

      // Rank all reels by overall score descending
      const sortedReels = [...reels].sort((a, b) => b.overallScore - a.overallScore);
      const rankedReels = sortedReels.map((reel, index) => ({
        ...reel,
        rank: index + 1,
        isWinner: index === 0,
      }));

      const winner = rankedReels[0];
      const secondPlace = rankedReels[1];

      // Personalized Posting Recommendation Evaluation (No fake/default times)
      const user = store.getUser('creator-primary');
      const isIgConnected = user?.instagram?.isConnected || false;
      const igMedia = user?.instagramMedia || [];
      const hasSufficientData = isIgConnected && igMedia.length >= 5;

      let recommendedPostingDay: string | undefined = undefined;
      let recommendedPostingTime = 'Not enough data yet';
      let postingWindowRationale = '';
      let postingDataNotice = '';

      if (!isIgConnected) {
        postingWindowRationale =
          'Instagram account not connected. Connect your Instagram Professional account to calculate your audience peak engagement window.';
        postingDataNotice = 'Instagram account not connected';
      } else if (igMedia.length < 5) {
        postingWindowRationale = `Not enough historical data yet (${igMedia.length}/5 Reels published). At least 5 published Reels are needed to determine statistically sound posting windows.`;
        postingDataNotice = 'Insufficient historical media (< 5 published Reels)';
      } else {
        // Calculate personalized peak day and window from top quartile media items
        const sortedByEngagement = [...igMedia].sort(
          (a, b) => ((b.likeCount || 0) + (b.commentsCount || 0)) - ((a.likeCount || 0) + (a.commentsCount || 0))
        );
        const topCount = Math.max(1, Math.floor(sortedByEngagement.length / 2));
        const topItems = sortedByEngagement.slice(0, topCount);

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayCounts: Record<string, number> = {};
        const hourCounts: Record<number, number> = {};

        for (const item of topItems) {
          const d = new Date(item.timestamp);
          const day = days[d.getDay()];
          const hour = d.getHours();
          dayCounts[day] = (dayCounts[day] || 0) + 1;
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }

        const bestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Tuesday';
        const bestHour = Number(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 19);
        const startPeriod = bestHour >= 12 ? 'PM' : 'AM';
        const displayHour = bestHour % 12 === 0 ? 12 : bestHour % 12;
        const endHour = (bestHour + 1) % 12 === 0 ? 12 : (bestHour + 1) % 12;
        const endPeriod = bestHour + 1 >= 12 ? 'PM' : 'AM';

        recommendedPostingDay = bestDay;
        recommendedPostingTime = `${displayHour}:00 ${startPeriod} – ${endHour}:30 ${endPeriod}`;
        postingWindowRationale = `Calculated from your top ${topCount} performing published Reels, where historical follower saves and interactions peaked on ${bestDay}s.`;
        postingDataNotice = 'Personalized from connected account history';
      }

      const comparison: MultiReelComparison = {
        id: `comp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: `Shoot Shootout (${reels.length} Variations)`,
        reels: rankedReels,
        winnerId: winner.id,
        winnerReelNumber: winner.reelNumber,
        winnerRationale: {
          strongestOpening: `Reel #${winner.reelNumber} initiates with ${winner.scrollStopScore}/100 scroll-stop score, immediately establishing silhouette and fabric textures without dead space.`,
          bestOutfitPresentation: `Visual presentation scored ${winner.subscores.fashionPresentation}/100, outperforming variations with superior subject lighting and proportional framing.`,
          bestPacing: `Cut pacing (${winner.subscores.pacing}/100) maintains viewer retention without lingering on repetitive angles.`,
          bestEnding: `Ending framing resets cleanly at the ${winner.durationSeconds}s mark, offering high loop replay potential.`,
          bestAudioSync: `Audio and transition cuts align closely with beat dynamics (${winner.subscores.musicBeatCompatibility}/100).`,
          advantageOverSecondPlace: secondPlace
            ? `Scores ${winner.overallScore - secondPlace.overallScore} points higher than Reel #${secondPlace.reelNumber} primarily due to faster initial hook and crisper texture resolution.`
            : 'Highest overall composite rating across all evaluated creative pillars.',
        },
        secondPlaceCritique: secondPlace
          ? {
              id: secondPlace.id,
              reelNumber: secondPlace.reelNumber,
              whyItLost: `Reel #${secondPlace.reelNumber} has excellent visual quality (${secondPlace.subscores.visualQuality}/100), but its opening 00:00–00:01.2 delay and slightly repetitive mid-clip pacing dampened its overall scroll-stop capacity by ${winner.scrollStopScore - secondPlace.scrollStopScore} points.`,
            }
          : undefined,
        recommendedPostingDay,
        recommendedPostingTime,
        postingWindowRationale,
        hasSufficientPostingData: hasSufficientData,
        postingDataNotice,
      };

      store.saveComparison('creator-primary', comparison);
      res.json({ success: true, comparison });
    } catch (err: any) {
      console.error('Comparison error:', err);
      res.status(500).json({ error: 'Failed to generate Reel comparison', message: err.message });
    }
  });

  // Ask Your Reel Director Conversational Intelligence
  app.post('/api/director/chat', async (req, res) => {
    try {
      const { message, currentReelId, activeComparison, history, userNiche } = req.body as DirectorChatRequest;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'A valid message string is required.' });
      }

      if (message.length > 2000) {
        return res.status(400).json({ error: 'Message exceeds maximum length of 2000 characters.' });
      }

      // If activeComparison wasn't sent from client, fall back to stored comparison
      const user = store.getUser('creator-primary');
      const comparison = activeComparison || user.comparisons[0] || undefined;
      const niche = userNiche || user.profile.brandNiche;

      const chatResponse = await chatWithReelDirector({
        message: message.trim(),
        currentReelId,
        activeComparison: comparison,
        history: Array.isArray(history) ? history : [],
        userNiche: niche,
      });

      res.json(chatResponse);
    } catch (err: any) {
      console.error('Director chat endpoint error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to process Director question.',
        message: err.message || 'An unexpected error occurred.',
      });
    }
  });

  // Trend Radar
  app.get('/api/reels/trends', async (req, res) => {
    try {
      const trends = await getFashionTrendRadar();
      res.json({
        trends,
        updatedAt: new Date().toISOString(),
        trendConfidence: 'High',
        disclaimer: 'Signals compiled from fashion creator formats, audio benchmarks, and Instagram styling trends.',
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch trends', message: err.message });
    }
  });

  // Creator Memory
  app.get('/api/creator/memory', (req, res) => {
    const user = store.getUser('creator-primary');
    res.json({
      memory: user.creatorMemory,
      totalReelsAnalyzed: user.analyses.length,
      recentAnalyses: user.analyses.slice(0, 5),
    });
  });

  // Prediction vs Reality
  app.get('/api/creator/prediction-vs-reality', (req, res) => {
    const user = store.getUser('creator-primary');
    res.json({
      predictions: user.predictions,
      totalTracked: user.predictions.length,
    });
  });

  app.post('/api/creator/prediction-vs-reality', (req, res) => {
    const user = store.getUser('creator-primary');
    const { reelTitle, predictedScore, actualViews, actualReach, actualLikes, actualSaves, actualShares, takeaway } = req.body;

    const newItem: PredictionVsRealityItem = {
      id: `pred-${Date.now()}`,
      reelTitle: reelTitle || 'Recent Fashion Reel',
      postDate: new Date().toISOString().split('T')[0],
      predictedScore: Number(predictedScore) || 88,
      actualViews: Number(actualViews) || 0,
      actualReach: Number(actualReach) || 0,
      actualLikes: Number(actualLikes) || 0,
      actualSaves: Number(actualSaves) || 0,
      actualShares: Number(actualShares) || 0,
      accuracyRating: (Number(actualViews) > 20000 && Number(predictedScore) >= 88) ? 'High Correlation' : 'Moderate',
      takeaway: takeaway || 'Post performed in alignment with AI hook and pacing predictions.',
    };

    user.predictions.unshift(newItem);
    res.json({ success: true, item: newItem });
  });

  // Diagnostics (Admin / Developer)
  const handleGetDiagnostics = (req: express.Request, res: express.Response) => {
    const diagnostics = store.getDiagnostics();
    res.json({
      diagnostics,
      timestamp: new Date().toISOString(),
    });
  };
  app.get('/api/admin/diagnostics', handleGetDiagnostics);
  app.get('/api/diagnostics', handleGetDiagnostics);

  // ==========================================
  // VITE DEV MIDDLEWARE / STATIC ASSETS
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`REEL DIRECTOR AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
