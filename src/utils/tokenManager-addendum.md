# `tokenManager.ts` — `clearAllTokens()` addendum

The existing `src/utils/tokenManager.ts` owns the encrypted-cookie schema for
`_at`, `_rt`, and `userId`. `performLogout(...)` in `src/utils/logout.ts`
delegates wipe responsibility to it via `tokenManager.clearAllTokens()`.

If that method doesn't exist yet, **append** the following to the bottom of
`tokenManager.ts`. Adapt the cookie-wipe helper to whatever `setAccessToken` /
`setRefreshToken` already use (domain, path, Secure, SameSite). Do NOT
duplicate encryption logic — reuse what's already exported from the file.

```ts
// ---------------------------------------------------------------------------
// clearAllTokens — one entry point used by performLogout().
//
// This MUST match the cookie options used when tokens are set. If set() uses
// { path: '/', secure: true, sameSite: 'strict', domain: 'jossor-new-frontend.vercel.app' },
// then this MUST expire the cookie with matching options — otherwise the
// browser keeps the cookie around.
// ---------------------------------------------------------------------------

/**
 * Expire a single cookie by name. Mirrors the options used when it was set.
 * Tries a few variants so we don't leave dangling cookies if the domain
 * attribute shifts between localhost / vercel / apex.
 */
function expireCookie(name: string): void {
  const baseOptions = [
    'Max-Age=0',
    'Path=/',
    'SameSite=Lax',
  ];
  const variants: string[] = [
    `${name}=; ${baseOptions.join('; ')}`,
    `${name}=; ${baseOptions.join('; ')}; Secure`,
  ];
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    variants.push(`${name}=; ${baseOptions.join('; ')}; Domain=${host}`);
    // Parent domain (e.g. ".vercel.app") in case cookies were set with it:
    const parts = host.split('.');
    if (parts.length > 2) {
      variants.push(`${name}=; ${baseOptions.join('; ')}; Domain=.${parts.slice(-2).join('.')}`);
    }
  }
  try {
    for (const v of variants) document.cookie = v;
  } catch {
    /* SSR / privacy mode */
  }
}

/**
 * Clear every piece of auth state this module owns:
 *   - the `_at`, `_rt`, `userId` cookies (or whatever the current schema is)
 *   - any in-memory caches the module keeps (decrypted token value, etc.)
 *   - the remember-me marker if the module owns one
 *
 * After this returns, `tokenManager.getAccessToken()` MUST return null/undef.
 */
export async function clearAllTokens(): Promise<void> {
  // 1. Cookies — wipe the known names. Add any other names this file writes.
  for (const name of ['_at', '_rt', 'userId']) {
    expireCookie(name);
  }

  // 2. In-memory caches. If the module keeps `let cachedAccessToken = ...`
  //    reset it here. Example:
  try {
    // @ts-expect-error — intentional reset of any module-local cache.
    if (typeof cachedAccessToken !== 'undefined') cachedAccessToken = null;
    // @ts-expect-error
    if (typeof cachedRefreshToken !== 'undefined') cachedRefreshToken = null;
    // @ts-expect-error
    if (typeof cachedUserId !== 'undefined') cachedUserId = null;
  } catch {
    /* no-op */
  }

  // 3. Cancel any pending refresh-timer so it doesn't fire post-logout and
  //    re-seed cookies. Adapt to the real name in this file.
  try {
    // @ts-expect-error
    if (typeof refreshTimer !== 'undefined' && refreshTimer) {
      clearTimeout(refreshTimer);
      // @ts-expect-error
      refreshTimer = null;
    }
  } catch {
    /* no-op */
  }
}

// Attach to the default export so `tokenManager.clearAllTokens()` works.
// If `tokenManager` is a named object, add `clearAllTokens` to it too:
//
//   export const tokenManager = { ..., clearAllTokens };
//
```

## Why it's in a separate file

`tokenManager.ts` is the one file in the repo that owns the cookie
encryption key path. Every other auth-related utility must go through it
or we end up with four different places that each guess the cookie names.
`performLogout()` is one of those callers and deliberately doesn't reach
for `document.cookie` directly.
