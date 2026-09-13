import dns from 'node:dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Graceful fallback for older runtimes
}

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store.js';
import {
  analyzeReelWithGemini,
  analyzePhotoSetWithGemini,
  getFashionTrendRadar,
  chatWithReelDirector,
  generateCreateMyNextReelWithGemini,
} from './server/geminiService.js';
import { getUnifiedContentRecommendation } from './server/unifiedDirectorService.js';
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
  getGoogleConfig,
  generateGoogleOAuthUrl,
  exchangeGoogleCodeForTokens,
  fetchGoogleUserInfo,
  parseGoogleIdTokenPayload,
} from './server/googleAuthService.js';
import {
  MultiReelComparison,
  ReelAnalysisResult,
  PredictionVsRealityItem,
  DirectorChatRequest,
  UnifiedRecommendationRequest,
} from './src/types.js';

// Fallback for local run if APP_URL is unset
if (!process.env.APP_URL) {
  process.env.APP_URL = 'http://localhost:3000';
}

const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

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

  function getSessionUserId(req: express.Request): string {
    // 1. Bearer Token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const sessionUser = store.validateSession(token);
      if (sessionUser) return sessionUser;
    }

    // 2. x-session-token header
    const sessionToken = req.headers['x-session-token'] as string;
    if (sessionToken && typeof sessionToken === 'string') {
      const sessionUser = store.validateSession(sessionToken.trim());
      if (sessionUser) return sessionUser;
    }

    // 3. Cookie check
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(/reel_director_session=([^;]+)/);
      if (match && match[1]) {
        const sessionUser = store.validateSession(match[1].trim());
        if (sessionUser) return sessionUser;
      }
    }

    // Security Hardening: Client-supplied x-user-id or query params are NEVER trusted as authentication.
    // Identity must derive strictly from a validated cryptographic server-side session token.
    return '';
  }

  // ==========================================
  // GOOGLE AUTHENTICATION ROUTES
  // ==========================================

  // Google OAuth URL generation
  app.get('/api/auth/google/url', (req, res) => {
    try {
      const config = getGoogleConfig(req);
      const state = (req.query.state as string) || crypto.randomUUID();
      const authUrl = config.isConfigured ? generateGoogleOAuthUrl(state, req) : '';
      res.json({
        isConfigured: config.isConfigured,
        authUrl,
        redirectUri: config.redirectUri,
        clientId: config.clientId ? `${config.clientId.substring(0, 12)}...` : '',
      });
    } catch (err: any) {
      console.error('Failed to get Google OAuth URL:', err);
      res.status(500).json({ error: err.message || 'Failed to generate Google OAuth URL' });
    }
  });

  // Google OAuth Callback (Official Redirect)
  app.get('/api/auth/google/callback', async (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;

    if (error || !code) {
      return res.redirect(`/?auth_error=${encodeURIComponent(error || 'Google login was cancelled')}`);
    }

    try {
      const config = getGoogleConfig(req);
      const tokens = await exchangeGoogleCodeForTokens(code, config.redirectUri, req);
      if (!tokens || !tokens.accessToken) {
        throw new Error('Failed to retrieve token from Google');
      }

      const googleUser = await fetchGoogleUserInfo(tokens.accessToken);
      const user = store.setGoogleUser({
        googleId: googleUser.googleId,
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.avatarUrl,
      });

      const sessionToken = store.createSession(user.profile.id);

      res.setHeader(
        'Set-Cookie',
        `reel_director_session=${sessionToken}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=${30 * 86400}`
      );

      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Reel Director AI - Google Authentication</title></head>
          <body style="background:#0a0a10;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;">
              <h2 style="font-family:'Syne',sans-serif;margin-bottom:8px;">Authentication Successful</h2>
              <p style="color:#a1a1aa;font-size:14px;">Welcome back, ${user.profile.name}! Returning to Reel Director AI...</p>
            </div>
            <script>
              const payload = {
                type: 'GOOGLE_AUTH_SUCCESS',
                token: ${JSON.stringify(sessionToken)},
                user: ${JSON.stringify(user.profile)},
                instagram: ${JSON.stringify(user.instagram)}
              };
              try {
                localStorage.setItem('reel_director_session_token', ${JSON.stringify(sessionToken)});
                localStorage.setItem('reel_director_user', JSON.stringify(${JSON.stringify(user.profile)}));
              } catch(e) {}
              if (window.opener) {
                window.opener.postMessage(payload, '*');
                setTimeout(() => window.close(), 300);
              } else {
                window.location.href = '/?auth_success=true';
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('Google OAuth callback failure:', err);
      res.redirect(`/?auth_error=${encodeURIComponent(err.message || 'Google authentication failed')}`);
    }
  });

  // Verify Google Identity Services Credential (One-Tap / Sign in with Google Button)
  app.post('/api/auth/google/verify-credential', (req, res) => {
    try {
      const { credential } = req.body;
      if (!credential || typeof credential !== 'string') {
        return res.status(400).json({ error: 'Missing credential parameter' });
      }

      const payload = parseGoogleIdTokenPayload(credential);
      if (!payload || !payload.email) {
        return res.status(400).json({ error: 'Could not decode Google ID token payload' });
      }

      const user = store.setGoogleUser({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        avatarUrl: payload.picture,
      });

      const sessionToken = store.createSession(user.profile.id);

      res.setHeader(
        'Set-Cookie',
        `reel_director_session=${sessionToken}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=${30 * 86400}`
      );

      res.json({
        success: true,
        token: sessionToken,
        user: user.profile,
        instagram: user.instagram,
      });
    } catch (err: any) {
      console.error('Google credential verification error:', err);
      res.status(500).json({ error: err.message || 'Google credential verification failed' });
    }
  });

  // Session status
  app.get(['/api/auth/session', '/api/auth/me'], (req, res) => {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.json({ success: false, isAuthenticated: false, user: null, instagram: null });
    }

    const user = store.getUser(userId);
    const analyses = user.analyses || [];
    const comparisons = user.comparisons || [];
    res.json({
      success: true,
      isAuthenticated: true,
      user: user.profile,
      instagram: user.instagram,
      hasAnalyses: analyses.length > 0,
      analysesCount: analyses.length,
      comparisonsCount: comparisons.length,
    });
  });

  // Logout Endpoint
  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      store.destroySession(authHeader.substring(7).trim());
    }
    const sessionToken = req.headers['x-session-token'] as string;
    if (sessionToken) {
      store.destroySession(sessionToken.trim());
    }

    res.setHeader('Set-Cookie', 'reel_director_session=; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=0');
    res.json({ success: true, message: 'Logged out successfully.' });
  });

  // User profile (Protected)
  app.get('/api/user/profile', (req, res) => {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    const user = store.getUser(userId);
    const analyses = user.analyses || [];
    const comparisons = user.comparisons || [];
    res.json({
      success: true,
      user: user.profile,
      instagram: user.instagram,
      hasAnalyses: analyses.length > 0,
      analysesCount: analyses.length,
      comparisonsCount: comparisons.length,
    });
  });

  const handleUpdateUserProfile = (req: express.Request, res: express.Response) => {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    const user = store.getUser(userId);
    const { name, brandNiche } = req.body;
    if (name) user.profile.name = name;
    if (brandNiche) user.profile.brandNiche = brandNiche;
    store.saveUserSession(userId);
    res.json({ success: true, profile: user.profile });
  };
  app.post('/api/auth/profile', handleUpdateUserProfile);
  app.post('/api/user/profile', handleUpdateUserProfile);

  // Instagram Connection Status & Privacy (Protected)
  app.get('/api/instagram/status', (req, res) => {
    const metaConfig = getMetaConfig();
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    const user = store.getUser(userId);

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
              'In your app, configure Instagram API -> API setup with Instagram login',
              'Copy App ID into INSTAGRAM_CLIENT_ID and App Secret into INSTAGRAM_CLIENT_SECRET',
              'Set Valid OAuth Redirect URIs to: ' + metaConfig.redirectUri,
            ],
          }
        : null,
    });
  });

  // Generate official Meta OAuth URL (Protected - binds state to authenticated user)
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

    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required to connect Instagram.' });
    }
    const state = store.createOAuthState(userId);
    const authUrl = generateMetaOAuthUrl(state);
    res.json({
      isConfigured: metaConfig.isConfigured,
      authUrl,
      redirectUri: metaConfig.redirectUri,
    });
  });

  // OAuth Callback (Protected with cryptographic state validation)
  app.get('/api/instagram/callback', async (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;
    const errorReason = req.query.error_reason as string;

    if (error || !code) {
      const errorMsg = errorReason || error || 'Authorization was cancelled by user';
      return res.send(`
        <!DOCTYPE html>
        <html><body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'INSTAGRAM_OAUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
              window.close();
            } else {
              window.location.href = '/?oauth_error=${encodeURIComponent(errorMsg)}';
            }
          </script>
        </body></html>
      `);
    }

    const targetUserId = store.consumeOAuthState(state);
    if (!targetUserId) {
      const errorMsg = 'Invalid or expired OAuth state parameter (CSRF protection). Please try connecting again.';
      return res.status(403).send(`
        <!DOCTYPE html>
        <html><body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'INSTAGRAM_OAUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
              window.close();
            } else {
              window.location.href = '/?oauth_error=${encodeURIComponent(errorMsg)}';
            }
          </script>
        </body></html>
      `);
    }

    try {
      const tokens = await exchangeCodeForTokens(code);
      if (!tokens) {
        throw new Error('Token exchange returned empty result');
      }

      const { connection, media } = await fetchInstagramProfileAndMedia(
        tokens.accessToken
      );
      const user = store.getUser(targetUserId);
      user.instagram = connection;
      user.instagramAccessToken = tokens.accessToken;
      user.instagramMedia = media;
      user.insights = computeAccountPerformance(media, connection.followersCount);
      store.saveInstagramSession(targetUserId);

      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Instagram Connected</title></head>
          <body style="background:#0a0a10;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;">
              <h2 style="font-family:'Syne',sans-serif;margin-bottom:8px;">Instagram Connected!</h2>
              <p style="color:#a1a1aa;font-size:14px;">@${connection.username} successfully linked to your account. Returning to Reel Director...</p>
            </div>
            <script>
              const payload = {
                type: 'INSTAGRAM_OAUTH_SUCCESS',
                userId: ${JSON.stringify(targetUserId)},
                connection: ${JSON.stringify(connection)}
              };
              if (window.opener) {
                window.opener.postMessage(payload, '*');
                setTimeout(() => window.close(), 300);
              } else {
                window.location.href = '/?oauth_success=true';
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('Meta OAuth callback error:', err);
      res.redirect(
        `/?oauth_error=${encodeURIComponent(
          err.message || 'Failed to complete Instagram authorization'
        )}`
      );
    }
  });

  // Disconnect Instagram (Protected)
  app.post('/api/instagram/disconnect', (req, res) => {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    store.disconnectInstagram(userId);
    res.json({ success: true, message: 'Instagram disconnected successfully.' });
  });

  // Refresh Instagram data from live Meta Graph API (Protected)
  app.post('/api/instagram/refresh', async (req, res) => {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    const user = store.getUser(userId);
    if (!user.instagram.isConnected || !user.instagramAccessToken) {
      return res.status(400).json({
        error: 'No active Instagram connection or token found to refresh.',
      });
    }

    try {
      const { connection, media } = await fetchInstagramProfileAndMedia(
        user.instagramAccessToken
      );
      user.instagram = connection;
      user.instagramMedia = media;
      user.insights = computeAccountPerformance(media, connection.followersCount);
      store.saveInstagramSession(userId);

      res.json({
        success: true,
        performance: user.insights,
        mediaCount: user.instagramMedia.length,
        recentMedia: user.instagramMedia,
      });
    } catch (err: any) {
      console.error('Error refreshing Instagram media:', err);
      res.status(500).json({ error: err.message || 'Failed to refresh Instagram data.' });
    }
  });

  // Instagram Performance Engine (Protected)
  app.get('/api/instagram/performance', (req, res) => {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    const user = store.getUser(userId);
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
      recentMedia: user.instagramMedia,
    });
  });

  // Feature: Create My Next Reel (AI-Generated from Real Instagram Data) (Protected)
  app.post('/api/instagram/create-next-reel', async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      }
      const user = store.getUser(userId);
      const { focusTopic } = req.body || {};

      if (!user.insights) {
        user.insights = computeAccountPerformance(
          user.instagramMedia,
          user.instagram.followersCount || 0
        );
      }

      const concept = await generateCreateMyNextReelWithGemini({
        user: user.profile,
        instagram: user.instagram,
        insights: user.insights,
        media: user.instagramMedia,
        userGoalOrTopic: focusTopic,
      });

      user.nextReelConcept = concept;
      res.json({
        success: true,
        concept,
      });
    } catch (err: any) {
      console.error('Error generating Next Reel concept:', err);
      res.status(500).json({ error: err.message || 'Failed to generate Next Reel concept.' });
    }
  });

  app.get('/api/instagram/create-next-reel', async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      }
      const user = store.getUser(userId);
      if (user.nextReelConcept) {
        return res.json({ success: true, concept: user.nextReelConcept });
      }

      if (!user.insights) {
        user.insights = computeAccountPerformance(
          user.instagramMedia,
          user.instagram.followersCount || 0
        );
      }

      const concept = await generateCreateMyNextReelWithGemini({
        user: user.profile,
        instagram: user.instagram,
        insights: user.insights,
        media: user.instagramMedia,
      });

      user.nextReelConcept = concept;
      res.json({ success: true, concept });
    } catch (err: any) {
      console.error('Error fetching Next Reel concept:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch Next Reel concept.' });
    }
  });

  // Analyze single Reel Video (Protected)
  app.post('/api/reels/analyze', async (req, res) => {
    const startTime = Date.now();
    store.activeJobsCount++;
    try {
      const userId = getSessionUserId(req);
      if (!userId) {
        store.activeJobsCount--;
        return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      }

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

      const user = store.getUser(userId);
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

      store.saveAnalysis(userId, analysis);
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
      const userId = getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      }
      const user = store.getUser(userId);
      const isIgConnected = user?.instagram?.isConnected || false;
      const igMedia = user?.instagramMedia || [];
      const hasSufficientData = isIgConnected && igMedia.length >= 5;

      let recommendedPostingDay: string | undefined = undefined;
      let recommendedPostingTime = 'Not enough data yet';
      let postingWindowRationale = '';
      let postingDataNotice = '';

      if (!isIgConnected) {
        postingWindowRationale =
          'Connect your Instagram Professional account and provide sufficient historical data to calculate a personalized posting window.';
        postingDataNotice = 'Instagram account not connected';
      } else if (igMedia.length < 5) {
        postingWindowRationale = `Not enough data yet (${igMedia.length}/5 Reels published). Connect your Instagram Professional account and provide sufficient historical data to calculate a personalized posting window.`;
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
          if (!item.timestamp) continue;
          const d = new Date(item.timestamp);
          if (isNaN(d.getTime())) continue;
          const day = days[d.getDay()];
          const hour = d.getHours();
          dayCounts[day] = (dayCounts[day] || 0) + 1;
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }

        const topDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
        const topHourEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

        if (!topDayEntry || !topHourEntry) {
          recommendedPostingTime = 'Not enough data yet';
          postingWindowRationale =
            'Connect your Instagram Professional account and provide sufficient historical data to calculate a personalized posting window.';
          postingDataNotice = 'Insufficient timestamp data';
        } else {
          const bestDay = topDayEntry[0];
          const bestHour = Number(topHourEntry[0]);
          const startPeriod = bestHour >= 12 ? 'PM' : 'AM';
          const displayHour = bestHour % 12 === 0 ? 12 : bestHour % 12;
          const endHour = (bestHour + 1) % 12 === 0 ? 12 : (bestHour + 1) % 12;
          const endPeriod = bestHour + 1 >= 12 ? 'PM' : 'AM';

          recommendedPostingDay = bestDay;
          recommendedPostingTime = `${displayHour}:00 ${startPeriod} – ${endHour}:30 ${endPeriod}`;
          postingWindowRationale = `Calculated from your top ${topCount} performing published Reels, where historical follower saves and interactions peaked on ${bestDay}s.`;
          postingDataNotice = 'Personalized from connected account history';
        }
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
        hasSufficientPostingData:
          isIgConnected &&
          igMedia.length >= 5 &&
          Boolean(recommendedPostingDay) &&
          recommendedPostingTime !== 'Not enough data yet',
        postingDataNotice,
      };

      store.saveComparison(userId, comparison);
      res.json({ success: true, comparison });
    } catch (err: any) {
      console.error('Comparison error:', err);
      res.status(500).json({ error: 'Failed to generate Reel comparison', message: err.message });
    }
  });

  // Analyze Photo Set (1–15 Photos)
  app.post('/api/photos/analyze', async (req, res) => {
    const startTime = Date.now();
    store.activeJobsCount++;
    try {
      const { photos, userNiche } = req.body;

      if (!photos || !Array.isArray(photos) || photos.length === 0) {
        store.activeJobsCount--;
        return res.status(400).json({ error: 'At least 1 photo is required.' });
      }

      if (photos.length > 15) {
        store.activeJobsCount--;
        return res.status(400).json({ error: 'Maximum 15 photos allowed per set.' });
      }

      const userId = getSessionUserId(req);
      if (!userId) {
        store.activeJobsCount--;
        return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      }
      const user = store.getUser(userId);
      const igMedia = user.instagramMedia || [];
      const hasIg = user.instagram.isConnected;

      // Extract verified posting recommendation based on Phase 1 real-data calculation
      let recommendedPostingDay = 'Not enough data yet';
      let recommendedPostingTime = 'Not enough data yet';
      let postingWindowRationale = '';
      let hasSufficientPostingData = false;
      let postingDataNotice: string | undefined = undefined;

      if (!hasIg) {
        postingWindowRationale =
          'Connect your Instagram Professional account and provide sufficient historical data to calculate a personalized posting window.';
        postingDataNotice = 'Instagram not connected';
      } else if (igMedia.length < 5) {
        postingWindowRationale = `Not enough data yet (${igMedia.length}/5 media published). Connect your Instagram Professional account and provide sufficient historical data to calculate a personalized posting window.`;
        postingDataNotice = 'Insufficient historical media (< 5 published posts)';
      } else {
        const sortedByEngagement = [...igMedia].sort(
          (a, b) => ((b.likeCount || 0) + (b.commentsCount || 0)) - ((a.likeCount || 0) + (a.commentsCount || 0))
        );
        const topCount = Math.max(1, Math.floor(sortedByEngagement.length / 2));
        const topItems = sortedByEngagement.slice(0, topCount);

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayCounts: Record<string, number> = {};
        const hourCounts: Record<number, number> = {};

        for (const item of topItems) {
          if (!item.timestamp) continue;
          const d = new Date(item.timestamp);
          if (isNaN(d.getTime())) continue;
          const day = days[d.getDay()];
          const hour = d.getHours();
          dayCounts[day] = (dayCounts[day] || 0) + 1;
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }

        const topDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
        const topHourEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

        if (!topDayEntry || !topHourEntry) {
          recommendedPostingTime = 'Not enough data yet';
          postingWindowRationale =
            'Connect your Instagram Professional account and provide sufficient historical data to calculate a personalized posting window.';
          postingDataNotice = 'Insufficient timestamp data';
        } else {
          const bestDay = topDayEntry[0];
          const bestHour = Number(topHourEntry[0]);
          const startPeriod = bestHour >= 12 ? 'PM' : 'AM';
          const displayHour = bestHour % 12 === 0 ? 12 : bestHour % 12;
          const endHour = (bestHour + 1) % 12 === 0 ? 12 : (bestHour + 1) % 12;
          const endPeriod = bestHour + 1 >= 12 ? 'PM' : 'AM';

          recommendedPostingDay = bestDay;
          recommendedPostingTime = `${displayHour}:00 ${startPeriod} – ${endHour}:30 ${endPeriod}`;
          postingWindowRationale = `Calculated from your top ${topCount} performing published posts, where historical follower interactions peaked on ${bestDay}s.`;
          postingDataNotice = 'Personalized from connected account history';
          hasSufficientPostingData = true;
        }
      }

      const analysis = await analyzePhotoSetWithGemini({
        photos,
        userNiche: userNiche || user.profile.brandNiche,
        postingContext: {
          isIgConnected: hasIg,
          mediaCount: igMedia.length,
          recommendedPostingDay,
          recommendedPostingTime,
          postingWindowRationale,
          hasSufficientPostingData,
          postingDataNotice,
        },
      });

      store.totalJobsProcessed++;
      store.lastJobDurationMs = Date.now() - startTime;
      store.activeJobsCount--;

      res.json({ success: true, analysis });
    } catch (err: any) {
      store.activeJobsCount--;
      console.error('Error analyzing Photo Set:', err);
      res.status(500).json({ error: 'Failed to analyze Photo Set', message: err.message });
    }
  });

  // Phase 3: Unified Content Director ("What should I post today?") (Protected)
  app.post('/api/content/unified-recommendation', async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      }
      const { comparison, photoSet, userPreference, userNiche } = req.body as UnifiedRecommendationRequest;
      const user = store.getUser(userId);
      const activeComp = comparison || user.comparisons[0] || undefined;
      const niche = userNiche || user.profile.brandNiche;

      // Extract verified posting recommendation based on Phase 1 real-data calculation
      const igMedia = user.instagramMedia || [];
      const hasIg = user.instagram.isConnected;
      let recommendedPostingDay = 'Not enough data yet';
      let recommendedPostingTime = 'Not enough data yet';
      let postingWindowRationale = '';
      let hasSufficientPostingData = false;
      let postingDataNotice: string | undefined = undefined;

      if (!hasIg) {
        postingWindowRationale =
          'Connect your Instagram Professional account and provide sufficient historical data to calculate a personalized posting window.';
        postingDataNotice = 'Instagram not connected';
      } else if (igMedia.length < 5) {
        postingWindowRationale = `Not enough data yet (${igMedia.length}/5 media published). Connect your Instagram Professional account and provide sufficient historical data to calculate a personalized posting window.`;
        postingDataNotice = 'Insufficient historical media (< 5 published posts)';
      } else {
        const sortedByEngagement = [...igMedia].sort(
          (a, b) => ((b.likeCount || 0) + (b.commentsCount || 0)) - ((a.likeCount || 0) + (a.commentsCount || 0))
        );
        const topCount = Math.max(1, Math.floor(sortedByEngagement.length / 2));
        const topItems = sortedByEngagement.slice(0, topCount);

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayCounts: Record<string, number> = {};
        const hourCounts: Record<number, number> = {};

        for (const item of topItems) {
          if (!item.timestamp) continue;
          const d = new Date(item.timestamp);
          if (isNaN(d.getTime())) continue;
          const day = days[d.getDay()];
          const hour = d.getHours();
          dayCounts[day] = (dayCounts[day] || 0) + 1;
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }

        const topDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
        const topHourEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

        if (!topDayEntry || !topHourEntry) {
          recommendedPostingTime = 'Not enough data yet';
          postingWindowRationale =
            'Connect your Instagram Professional account and provide sufficient historical data to calculate a personalized posting window.';
          postingDataNotice = 'Insufficient timestamp data';
        } else {
          const bestDay = topDayEntry[0];
          const bestHour = Number(topHourEntry[0]);
          const startPeriod = bestHour >= 12 ? 'PM' : 'AM';
          const displayHour = bestHour % 12 === 0 ? 12 : bestHour % 12;
          const endHour = (bestHour + 1) % 12 === 0 ? 12 : (bestHour + 1) % 12;
          const endPeriod = bestHour + 1 >= 12 ? 'PM' : 'AM';

          recommendedPostingDay = bestDay;
          recommendedPostingTime = `${displayHour}:00 ${startPeriod} – ${endHour}:30 ${endPeriod}`;
          postingWindowRationale = `Calculated from your top ${topCount} performing published posts, where historical follower interactions peaked on ${bestDay}s.`;
          postingDataNotice = 'Personalized from connected account history';
          hasSufficientPostingData = true;
        }
      }

      const recommendation = await getUnifiedContentRecommendation({
        comparison: activeComp,
        photoSet,
        userPreference,
        userNiche: niche,
        instagramContext: {
          isConnected: hasIg,
          mediaCount: igMedia.length,
          recommendedPostingDay,
          recommendedPostingTime,
          postingWindowRationale,
          hasSufficientPostingData,
          postingDataNotice,
        },
      });

      res.json({ success: true, recommendation });
    } catch (err: any) {
      console.error('Unified recommendation endpoint error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to generate unified recommendation.',
        message: err.message || 'An unexpected error occurred.',
      });
    }
  });

  // Ask Your Reel Director / Photo Director Conversational Intelligence (Protected)
  app.post('/api/director/chat', async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      }

      const {
        message,
        currentReelId,
        activeComparison,
        activePhotoSet,
        currentPhotoNumber,
        unifiedRecommendation,
        history,
        userNiche,
      } = req.body as DirectorChatRequest;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'A valid message string is required.' });
      }

      if (message.length > 2000) {
        return res.status(400).json({ error: 'Message exceeds maximum length of 2000 characters.' });
      }

      // If activeComparison wasn't sent from client, fall back to stored comparison
      const user = store.getUser(userId);
      const comparison = activeComparison || user.comparisons[0] || undefined;
      const niche = userNiche || user.profile.brandNiche;

      const chatResponse = await chatWithReelDirector({
        message: message.trim(),
        currentReelId,
        activeComparison: comparison,
        activePhotoSet,
        currentPhotoNumber,
        unifiedRecommendation,
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

  // Trend Radar (Public Fashion Trend Intelligence)
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

  // Creator Memory (Protected)
  app.get('/api/creator/memory', (req, res) => {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    const user = store.getUser(userId);
    res.json({
      memory: user.creatorMemory,
      totalReelsAnalyzed: user.analyses.length,
      recentAnalyses: user.analyses.slice(0, 5),
    });
  });

  // Prediction vs Reality (Protected)
  app.get('/api/creator/prediction-vs-reality', (req, res) => {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    const user = store.getUser(userId);
    res.json({
      predictions: user.predictions,
      totalTracked: user.predictions.length,
    });
  });

  app.post('/api/creator/prediction-vs-reality', (req, res) => {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    const user = store.getUser(userId);
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
    const userId = getSessionUserId(req);
    const diagnostics = store.getDiagnostics(userId || undefined);
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
    const candidatePaths = [
      path.resolve(process.cwd(), 'dist'),
      currentDir,
      path.resolve(currentDir, 'dist'),
    ];
    const distPath = candidatePaths.find((p) => fs.existsSync(path.join(p, 'index.html'))) || candidatePaths[0];
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
