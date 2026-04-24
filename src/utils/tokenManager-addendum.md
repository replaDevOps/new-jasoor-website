# tokenManager — required `clearAllTokens` export

`utils/logout.ts` imports `clearAllTokens` from `./tokenManager`. If tokenManager
does not already expose that function, add this to the bottom of the existing
`src/utils/tokenManager.ts`. Do not rewrite the whole file — only append.

```ts
// Append to src/utils/tokenManager.ts — do not remove existing code.

/**
 * Clear every piece of auth state tokenManager owns.
 * Called by performLogout(). Safe to call multiple times.
 */
export async function clearAllTokens(): Promise<void> {
  // 1. Drop in-memory cache if the module keeps one.
  //    Example:  accessTokenCache = null; refreshTokenCache = null;
  //    Replace with whatever this module actually caches.

  // 2. Expire the documented three cookies on every path + domain pair used.
  const expired = 'Thu, 01 Jan 1970 00:00:00 GMT';
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const domains = [undefined, host, host ? `.${host}` : undefined].filter(Boolean) as (string | undefined)[];
  const paths = ['/', '/dashboard', '/auth'];
  const keys  = ['_at', '_rt', 'userId'];

  for (const key of keys) {
    for (const path of paths) {
      for (const domain of domains) {
        const domainPart = domain ? `; Domain=${domain}` : '';
        document.cookie = `${key}=; Path=${path}${domainPart}; Expires=${expired}; SameSite=Lax`;
      }
    }
  }

  // 3. If tokenManager uses encrypted cookies via a helper (e.g. setEncryptedCookie),
  //    call its matching remove path here. Example:
  //    await removeEncryptedCookie('_at');
  //    await removeEncryptedCookie('_rt');
  //    await removeEncryptedCookie('userId');
}
```

After adding, verify in DevTools:

1. Log in.
2. Confirm cookies `_at`, `_rt`, `userId` exist under Application → Cookies.
3. Call `logout()`.
4. Reload DevTools → Cookies panel — all three are gone.
5. Confirm no call to `/graphql` includes an Authorization header after logout.
