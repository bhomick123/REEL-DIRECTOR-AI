import crypto from 'crypto';
import express from 'express';

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  isConfigured: boolean;
}

export interface GoogleUserProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  verifiedEmail?: boolean;
}

export function getGoogleConfig(req?: express.Request): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  // Determine host and protocol from environment or request
  let origin = 'http://localhost:3000';
  if (process.env.APP_URL) {
    origin = process.env.APP_URL;
  } else if (req) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
    origin = `${proto}://${host}`;
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

  return {
    clientId,
    clientSecret,
    redirectUri,
    isConfigured: Boolean(clientId && clientSecret),
  };
}

export function generateGoogleOAuthUrl(state: string, req?: express.Request): string {
  const config = getGoogleConfig(req);
  if (!config.clientId) {
    return '';
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    access_type: 'offline',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCodeForTokens(
  code: string,
  redirectUri: string,
  req?: express.Request
): Promise<{ accessToken: string; idToken: string } | null> {
  const config = getGoogleConfig(req);
  if (!config.clientId || !config.clientSecret) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET) are not configured.');
  }

  const tokenEndpoint = 'https://oauth2.googleapis.com/token';
  const bodyParams = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri || config.redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google token exchange failed:', response.status, errorText);
    throw new Error(`Google token exchange error: ${errorText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    idToken: data.id_token,
  };
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserProfile> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to fetch Google userinfo: ${errText}`);
  }

  const data = await response.json();
  return {
    googleId: data.sub,
    email: data.email,
    name: data.name || data.email.split('@')[0],
    avatarUrl: data.picture,
    verifiedEmail: Boolean(data.email_verified),
  };
}

export function parseGoogleIdTokenPayload(idToken: string): any {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to parse Google ID Token:', err);
    return null;
  }
}
