/**
 * logout.ts — one-call logout that actually terminates the session.
 *
 * Design goals:
 *   1. Stop Apollo BEFORE wiping tokens so in-flight queries don't 401-cascade
 *      and trigger the refresh service.
 *   2. Delegate cookie wipe to tokenManager.clearAllTokens() — never hardcode
 *      cookie names here. tokenManager owns the encrypted-cookie schema.
 *   3. Scope localStorage cleanup to the `jusoor:` prefix. `localStorage.clear()`
 *      nukes unrelated app state (saved drafts, language preference, etc.).
 *   4. Dispatch `jusoor:auth:logged-out` so `App.tsx` can switch the view
 *      back to signin without a full page reload.
 *   5. Optionally call the LOGOUT mutation if the caller passes a client.
 *      This is fire-and-forget — we don't block the UI on a server call.
 *
 * Usage (in AppContext.tsx):
 *
 *   import { performLogout } from '@/utils/logout';
 *   import { apolloClient } from '@/config/apolloClient';
 *
 *   const logout = async () => {
 *     await performLogout({ client: apolloClient });
 *     setIsLoggedIn(false);
 *     setUserId(null);
 *   };
 */

import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { gql } from '@apollo/client';
import { tokenManager } from './tokenManager';

// Only define this if the server has a LOGOUT mutation. If it doesn't, the
// call is harmless — the promise rejects and we swallow it.
const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export interface LogoutOptions {
  /** Apollo client to stop + call LOGOUT on. Pass the app-wide singleton. */
  client?: ApolloClient<NormalizedCacheObject> | null;
  /** If false, skip the server-side LOGOUT mutation. Default: true. */
  callServer?: boolean;
  /** If false, skip dispatching the cross-app event. Default: true. */
  dispatchEvent?: boolean;
}

export const LOGGED_OUT_EVENT = 'jusoor:auth:logged-out';

/**
 * Scoped localStorage cleanup — only keys that start with `jusoor:`.
 * This preserves unrelated app state (e.g., listing wizard drafts that the
 * user may want to keep, language preference, theme).
 *
 * If some keys should ALSO survive logout (e.g., saved language), add them
 * to the `preserve` list.
 */
function clearScopedLocalStorage(preserve: string[] = ['jusoor:lang', 'jusoor:theme']): void {
  try {
    const keys = Object.keys(window.localStorage);
    for (const key of keys) {
      if (!key.startsWith('jusoor:')) continue;
      if (preserve.includes(key)) continue;
      window.localStorage.removeItem(key);
    }
  } catch {
    // SSR or privacy-mode browsers may throw here. Ignore.
  }
}

/**
 * Scoped sessionStorage cleanup — session-scoped state goes away anyway when
 * the tab closes, but on logout we want it gone immediately.
 */
function clearScopedSessionStorage(): void {
  try {
    const keys = Object.keys(window.sessionStorage);
    for (const key of keys) {
      if (!key.startsWith('jusoor:')) continue;
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

/**
 * Full logout. Safe to call multiple times; idempotent.
 *
 * Order matters:
 *   1. Stop Apollo → cancels in-flight queries, no 401 cascade.
 *   2. Call LOGOUT mutation (best-effort, tokens still attached here).
 *   3. Clear tokens via tokenManager (encrypted cookies + any in-memory cache).
 *   4. Clear scoped localStorage / sessionStorage.
 *   5. Clear Apollo cache.
 *   6. Dispatch event so App.tsx switches view.
 */
export async function performLogout(options: LogoutOptions = {}): Promise<void> {
  const { client = null, callServer = true, dispatchEvent = true } = options;

  // 1. Stop in-flight queries BEFORE tokens disappear.
  if (client) {
    try {
      client.stop();
    } catch {
      // client.stop can throw on some versions; safe to ignore.
    }
  }

  // 2. Best-effort server-side logout. Fire-and-forget with short timeout.
  if (callServer && client) {
    try {
      await Promise.race([
        client.mutate({ mutation: LOGOUT_MUTATION, errorPolicy: 'ignore' }),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    } catch {
      // Server may not expose LOGOUT — that's fine, we still wipe locally.
    }
  }

  // 3. Wipe all token storage through the owner of the encryption schema.
  try {
    await tokenManager.clearAllTokens();
  } catch (e) {
    // Fallback: at minimum remove the known cookie names if clearAllTokens
    // isn't implemented yet. tokenManager-addendum.md provides the proper
    // implementation to append.
    // eslint-disable-next-line no-console
    console.warn('[logout] tokenManager.clearAllTokens() unavailable', e);
    try {
      document.cookie = '_at=; Path=/; Max-Age=0';
      document.cookie = '_rt=; Path=/; Max-Age=0';
      document.cookie = 'userId=; Path=/; Max-Age=0';
    } catch {
      // SSR — ignore.
    }
  }

  // 4. Clear scoped client-side state.
  clearScopedLocalStorage();
  clearScopedSessionStorage();

  // 5. Clear Apollo cache (after tokens are gone so refetch-on-mount can't
  //    revive a stale session).
  if (client) {
    try {
      await client.clearStore();
    } catch {
      // ignore
    }
  }

  // 6. Notify the app so the router can switch views without a full reload.
  if (dispatchEvent && typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event(LOGGED_OUT_EVENT));
    } catch {
      // ignore
    }
  }
}
