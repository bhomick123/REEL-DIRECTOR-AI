import { UserProfile, InstagramConnection } from '../types';

const TOKEN_KEY = 'reel_director_session_token';
const USER_KEY = 'reel_director_user';

export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to store session token:', err);
  }
}

export function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserProfile) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to store user profile:', err);
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
}

export function getAuthHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const token = getSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-session-token'] = token;
  }

  return headers;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = getAuthHeaders(options.headers as Record<string, string>);
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}

export async function checkCurrentSession(): Promise<{
  isAuthenticated: boolean;
  user: UserProfile | null;
  instagram: InstagramConnection | null;
}> {
  try {
    const res = await fetchWithAuth('/api/auth/session');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        setStoredUser(data.user);
        return {
          isAuthenticated: true,
          user: data.user,
          instagram: data.instagram || { isConnected: false, permissionsGranted: [] },
        };
      }
    }
  } catch (err) {
    console.error('Session check failed:', err);
  }

  return { isAuthenticated: false, user: null, instagram: null };
}

export async function logoutUser(): Promise<void> {
  try {
    await fetchWithAuth('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    clearSession();
  }
}

