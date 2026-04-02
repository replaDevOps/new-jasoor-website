/**
 * tokenRefreshService.ts
 *
 * Mirrors OLD frontend src/utils/tokenRefreshService.js exactly.
 *
 * Responsibilities:
 *  - refreshAccessToken()   — calls REFRESH_TOKEN mutation, stores new tokens
 *  - startAutoRefresh()     — polls every 2 min, refreshes if token is >7 min old
 *  - stopAutoRefresh()      — clears the interval
 *  - initializeAuth()       — runs on app mount to recover an expired access token
 *  - handleLogout()         — clears tokens + dispatches auth:logout event
 *  - registerWSReconnect()  — allows apolloClient to register a WS reconnect callback
 */

import {
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
  shouldRefreshToken,
  isAuthenticated,
  AuthUser,
} from './tokenManager';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RefreshTokenResponse {
  data?: {
    refreshToken?: {
      token: string;
      refreshToken: string;
      user: AuthUser;
    };
  };
}

// ─── Shared State ─────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
let wsReconnectCallback: (() => void) | null = null;
let autoRefreshInterval: ReturnType<typeof setInterval> | null = null;

// ─── Subscriber Pattern ───────────────────────────────────────────────────────
// Queues requests that arrive while a refresh is already in flight.

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
  if (wsReconnectCallback) {
    wsReconnectCallback();
  }
};

// ─── WS Reconnect Registry ───────────────────────────────────────────────────

export const registerWSReconnect = (callback: () => void): void => {
  wsReconnectCallback = callback;
};

// ─── Core Refresh ─────────────────────────────────────────────────────────────

/**
 * Calls the REFRESH_TOKEN mutation directly via fetch (avoiding circular
 * import with apolloClient.ts which also imports this file).
 *
 * Returns the new access token string, or null on failure.
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  // If already refreshing, wait for that to complete
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => resolve(token));
    });
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.error('❌ No refresh token available');
    clearAuthTokens();
    return null;
  }

  isRefreshing = true;

  try {
    const GRAPHQL_URL =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GRAPHQL_URL) ||
      'https://verify.jusoor-sa.co/graphql';

    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation RefreshToken($token: String!) {
            refreshToken(token: $token) {
              token
              refreshToken
              user { id status }
            }
          }
        `,
        variables: { token: refreshToken },
      }),
    });

    const json: RefreshTokenResponse = await response.json();

    if (json.data?.refreshToken?.token) {
      const {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        user,
      } = json.data.refreshToken;

      setAuthTokens(newAccessToken, newRefreshToken, user);
      onTokenRefreshed(newAccessToken);
      isRefreshing = false;
      return newAccessToken;
    } else {
      throw new Error('Invalid refresh token response');
    }
  } catch (error: any) {
    console.error('❌ Token refresh failed:', error.message);
    clearAuthTokens();
    isRefreshing = false;
    window.dispatchEvent(new CustomEvent('auth:logout'));
    return null;
  }
};

// ─── Token Validation ─────────────────────────────────────────────────────────

export const ensureValidToken = async (): Promise<boolean> => {
  if (!isAuthenticated()) return false;
  if (shouldRefreshToken()) {
    const newToken = await refreshAccessToken();
    return !!newToken;
  }
  return true;
};

/**
 * Runs on app mount. Handles all three cases:
 *  1. No tokens → return false (user not logged in)
 *  2. Has access token → check if needs refresh
 *  3. Has refresh token but no access token → try to recover session
 */
export const initializeAuth = async (): Promise<boolean> => {
  const hasAccess = isAuthenticated();
  const hasRefresh = !!getRefreshToken();

  if (!hasAccess && !hasRefresh) return false;

  if (hasAccess) {
    if (shouldRefreshToken()) {
      const newToken = await refreshAccessToken();
      return !!newToken;
    }
    return true;
  }

  // Access token missing but refresh token exists — try to recover
  if (!hasAccess && hasRefresh) {
    const newToken = await refreshAccessToken();
    return !!newToken;
  }

  return false;
};

// ─── Auto-Refresh Interval ────────────────────────────────────────────────────

/**
 * Starts the token auto-refresh background interval (every 2 minutes).
 * First calls initializeAuth() to recover any expired session.
 * Returns true if authenticated, false if not.
 */
export const startAutoRefresh = async (): Promise<boolean> => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }

  const isAuth = await initializeAuth();
  if (!isAuth) return false;

  autoRefreshInterval = setInterval(async () => {
    if (isAuthenticated()) {
      if (shouldRefreshToken()) {
        await ensureValidToken();
      }
    } else {
      stopAutoRefresh();
    }
  }, 2 * 60 * 1000); // 2 minutes

  return true;
};

export const stopAutoRefresh = (): void => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const handleLogout = (): void => {
  stopAutoRefresh();
  clearAuthTokens();
  window.dispatchEvent(new CustomEvent('auth:logout'));
};
