// -----------------------------------------------------------------------------
// AppContext.tsx — integration snippet for performLogout()
//
// This is NOT a replacement file. It shows EXACTLY the block to change inside
// the existing `src/context/AppContext.tsx`. Copy the body of `logout`,
// everything else stays.
// -----------------------------------------------------------------------------

/* imports to add at the top (keep existing imports) */
// import { performLogout } from '@/utils/logout';
// import { apolloClient } from '@/config/apolloClient';

// -----------------------------------------------------------------------------
// Replace the current `logout` implementation with this:
// -----------------------------------------------------------------------------
/*
  const logout = useCallback(async () => {
    // 1. Terminate the session on both client and server.
    await performLogout({ client: apolloClient });

    // 2. Flip React state so guarded views re-render immediately.
    setIsLoggedIn(false);
    setUserId(null);
    setUser?.(null); // if the context keeps a user object

    // 3. Navigation is handled by App.tsx listening to `jusoor:auth:logged-out`.
    //    Do NOT call window.location.reload() — it re-runs the bootstrap and
    //    causes a visible flash. The event-driven navigation handles it.
  }, [apolloClient]);
*/

// -----------------------------------------------------------------------------
// If the existing `logout` does any *business-specific* cleanup (e.g., resets
// listing wizard draft, clears unread-notification cache), KEEP those calls
// and put them BEFORE `performLogout(...)`. They access app state that gets
// wiped out downstream.
// -----------------------------------------------------------------------------
export {};
