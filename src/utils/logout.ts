// src/utils/logout.ts  (v2 — tokenManager-integrated, no guessed keys)
//
// v2 changes vs v1:
//   * No more hardcoded cookie/localStorage key guesses that silently do nothing.
//   * Delegates cookie clearing to tokenManager.clearAll() — the source of truth.
//   * localStorage cleanup is SCOPED: only removes the `jusoor:*` prefix, never
//     blows away unrelated keys.
//   * Apollo client is stopped BEFORE clearStore() so the auto-refresh service
//     doesn't fire a refresh with a now-dead refresh token.

import type { ApolloClient } from '@apollo/client';
import { clearAllTokens } from './tokenManager';

/**
 * Remove every localStorage key prefixed with the app namespace.
 * Intentionally surgical — unrelated keys (e.g. feature flags from other tools) survive.
 */
function clearScopedLocalStorage(prefix = 'jusoor:'): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
    // Known non-prefixed draft keys used by the app:
    ['draft:newListing'].forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* Private mode / quota errors — ignore, we did our best. */
  }
}

export interface LogoutOptions {
  apolloClient?: ApolloClient<unknown> | null;
  /** Optional redirect callback — usually a navigation to SignIn. */
  redirect?: () => void;
  /** Best-effort server LOGOUT mutation. */
  serverLogout?: () => Promise<unknown>;
}

export async function performLogout(opts: LogoutOptions = {}): Promise<void> {
  const { apolloClient, redirect, serverLogout } = opts;

  // 1. Stop Apollo FIRST so the auto-refresh loop and subscriptions go quiet
  //    before we yank the tokens out from under them.
  if (apolloClient) {
    try { apolloClient.stop(); } catch { /* ignore */ }
  }

  // 2. Best-effort server logout with a hard timeout.
  if (serverLogout) {
    try {
      await Promise.race([
        serverLogout(),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    } catch {
      /* swallow — local cleanup must still happen */
    }
  }

  // 3. Real source-of-truth for cookies + token cache. No guessed keys.
  try {
    await clearAllTokens();
  } catch (e) {
    // If tokenManager ever fails, at least clear the documented three cookies
    // by expiring them. Keys per yazid-preferences: _at, _rt, userId.
    const expired = 'Thu, 01 Jan 1970 00:00:00 GMT';
    ['_at', '_rt', 'userId'].forEach((key) => {
      document.cookie = `${key}=; Path=/; Expires=${expired}; SameSite=Lax`;
    });
  }

  // 4. Scoped localStorage + full sessionStorage.
  clearScopedLocalStorage('jusoor:');
  try { window.sessionStorage.clear(); } catch { /* ignore */ }

  // 5. Clear Apollo cache AFTER tokens are gone so any still-inflight query
  //    sees empty auth, fails fast, and does not populate the store again.
  if (apolloClient) {
    try { await apolloClient.clearStore(); } catch { /* ignore */ }
    try { await apolloClient.resetStore(); } catch { /* ignore */ }
  }

  // 6. Redirect — caller chooses how to navigate (onNavigate or the global event).
  redirect?.();
}
