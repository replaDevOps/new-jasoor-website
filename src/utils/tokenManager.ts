/**
 * tokenManager.ts
 *
 * Mirrors OLD frontend src/utils/tokenManager.js exactly.
 * Stores auth tokens in encrypted cookies using XOR cipher.
 * Cookie names, expiry times, encryption key, and all logic
 * are identical to the production OLD frontend.
 */

import Cookies from 'js-cookie';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  status: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TOKEN_CONFIG = {
  // Access token expires in 10 minutes (backend: '10m')
  ACCESS_TOKEN_EXPIRY: 10 / (24 * 60), // 10 minutes in days
  // Refresh token expires in 234 hours ≈ 9.75 days (backend: '234h')
  REFRESH_TOKEN_EXPIRY: 234 / 24, // 234 hours in days (9.75 days)
  // User data expiry (same as refresh token)
  USER_DATA_EXPIRY: 234 / 24, // 234 hours in days (9.75 days)

  // BUG-05 FIX: window.location.protocol was evaluated at module init time,
  // crashing in SSR / test environments. Now evaluated lazily at call time.
  get SECURE_OPTIONS() {
    return {
      secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
      sameSite: 'strict' as const,
    };
  },
};

// ─── Encryption ───────────────────────────────────────────────────────────────

// R-07 FIX: VITE_ENCRYPTION_KEY env var is now required for production.
// The hardcoded fallback 'J@$00r-S3cur3-K3y-2025' is kept ONLY so existing
// user sessions continue working until you rotate the key on a coordinated release.
// ACTION REQUIRED: Set VITE_ENCRYPTION_KEY=<new-secret> in Vercel environment variables.
// NOTE: Changing the key logs out all current users — coordinate a release window.
const ENCRYPTION_KEY = (import.meta as any).env?.VITE_ENCRYPTION_KEY || 'J@$00r-S3cur3-K3y-2025';

// Warn in development if falling back to hardcoded key
if (import.meta.env.DEV && !(import.meta as any).env?.VITE_ENCRYPTION_KEY) {
  console.warn(
    '[tokenManager] ⚠️  VITE_ENCRYPTION_KEY is not set — using insecure hardcoded fallback key.\n' +
    'Add VITE_ENCRYPTION_KEY=<secret> to your .env file and Vercel environment variables before going live.'
  );
}

const encryptToken = (token: string): string => {
  if (!token) return '';
  let encrypted = '';
  for (let i = 0; i < token.length; i++) {
    encrypted += String.fromCharCode(
      token.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    );
  }
  return btoa(encrypted);
};

const decryptToken = (encrypted: string): string => {
  if (!encrypted) return '';
  try {
    const decoded = atob(encrypted);
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(
        decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }
    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error);
    return '';
  }
};

// ─── Setters ──────────────────────────────────────────────────────────────────

export const setAuthTokens = (
  accessToken: string,
  refreshToken: string,
  user?: AuthUser | null
): boolean => {
  try {
    // Encrypt and store access token (short-lived)
    Cookies.set('_at', encryptToken(accessToken), {
      expires: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY,
      ...TOKEN_CONFIG.SECURE_OPTIONS,
    });

    // Encrypt and store refresh token (longer-lived)
    Cookies.set('_rt', encryptToken(refreshToken), {
      expires: TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY,
      ...TOKEN_CONFIG.SECURE_OPTIONS,
    });

    // Store user data (non-sensitive)
    if (user) {
      Cookies.set('userId', user.id, {
        expires: TOKEN_CONFIG.USER_DATA_EXPIRY,
      });
      Cookies.set('userStatus', user.status, {
        expires: TOKEN_CONFIG.USER_DATA_EXPIRY,
      });
    }

    // Set token refresh timestamp
    Cookies.set('tokenRefreshedAt', new Date().toISOString(), {
      expires: TOKEN_CONFIG.USER_DATA_EXPIRY,
    });

    return true;
  } catch (error) {
    console.error('❌ Error setting auth tokens:', error);
    return false;
  }
};

export const updateAccessToken = (newAccessToken: string): boolean => {
  try {
    Cookies.set('_at', encryptToken(newAccessToken), {
      expires: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY,
      ...TOKEN_CONFIG.SECURE_OPTIONS,
    });
    // Update refresh timestamp
    Cookies.set('tokenRefreshedAt', new Date().toISOString(), {
      expires: TOKEN_CONFIG.USER_DATA_EXPIRY,
    });
    return true;
  } catch (error) {
    console.error('Error updating access token:', error);
    return false;
  }
};

// ─── Getters ──────────────────────────────────────────────────────────────────

export const getAccessToken = (): string | null => {
  const encrypted = Cookies.get('_at');
  return encrypted ? decryptToken(encrypted) : null;
};

export const getRefreshToken = (): string | null => {
  const encrypted = Cookies.get('_rt');
  return encrypted ? decryptToken(encrypted) : null;
};

export const getUserId = (): string | null => {
  return Cookies.get('userId') || null;
};

export const getUserStatus = (): string | null => {
  return Cookies.get('userStatus') || null;
};

export const getUserData = () => {
  return {
    id: getUserId(),
    status: getUserStatus(),
    isAuthenticated: isAuthenticated(),
    hasRefreshToken: hasRefreshToken(),
  };
};

// ─── Status Checks ────────────────────────────────────────────────────────────

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

export const hasValidSession = (): boolean => {
  return !!getAccessToken() || !!getRefreshToken();
};

export const hasRefreshToken = (): boolean => {
  return !!getRefreshToken();
};

/**
 * Returns true if more than 7 minutes have passed since last refresh.
 * Token expires in 10 minutes — gives a 3-minute safety buffer.
 */
export const shouldRefreshToken = (): boolean => {
  const lastRefresh = Cookies.get('tokenRefreshedAt');
  if (!lastRefresh) return true;

  try {
    const lastRefreshTime = new Date(lastRefresh);
    const now = new Date();
    const minutesSinceRefresh = (now.getTime() - lastRefreshTime.getTime()) / (1000 * 60);
    return minutesSinceRefresh > 7;
  } catch (error) {
    console.error('Error checking token refresh time:', error);
    return true;
  }
};

// ─── Clear ────────────────────────────────────────────────────────────────────

export const clearAuthTokens = (): boolean => {
  try {
    Cookies.remove('_at');
    Cookies.remove('_rt');
    Cookies.remove('userId');
    Cookies.remove('userStatus');
    Cookies.remove('tokenRefreshedAt');

    // Also clear localStorage as fallback (mirrors OLD)
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    return true;
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
    return false;
  }
};
