// Drop-in replacement for the `logout()` function in src/context/AppContext.tsx.
// Also shows the reactive auth state change required so the UI updates without
// a manual refresh. Keep the rest of the file intact.
//
// Required imports at the top of AppContext.tsx:
//   import { performLogout } from '../utils/logout';
//   import { useApolloClient, useMutation } from '@apollo/client';
//   import { LOGOUT } from '../graphql/mutations/auth';

// Inside AppProvider, replace the existing logout() with this version:

import { performLogout } from '../utils/logout';
import { useApolloClient, useMutation } from '@apollo/client';
import { LOGOUT } from '../graphql/mutations/auth';

// ... inside AppProvider body:
// const [logoutMutation] = useMutation(LOGOUT, { errorPolicy: 'all' });
// const apolloClient = useApolloClient();
//
// const logout = useCallback(async () => {
//   setIsLoggedIn(false);   // optimistic: UI flips immediately
//   setUserId(null);
//
//   await performLogout({
//     apolloClient,
//     serverLogout: () => logoutMutation(),
//     redirect: () => {
//       // Navigation handled by the caller — but we also reset view state here
//       // by using a window event the App.tsx view-state machine listens to:
//       window.dispatchEvent(new CustomEvent('jusoor:auth:logged-out'));
//     },
//   });
// }, [apolloClient, logoutMutation]);

// In App.tsx, add a one-time listener so any view resets to SignIn:
// useEffect(() => {
//   const onLogout = () => setView('signin');
//   window.addEventListener('jusoor:auth:logged-out', onLogout);
//   return () => window.removeEventListener('jusoor:auth:logged-out', onLogout);
// }, []);

// In your Navbar user-menu:
// <button onClick={async () => { await logout(); onNavigate?.('signin'); }}>
//   {isAr ? 'تسجيل الخروج' : 'Log out'}
// </button>

// Verification checklist after applying:
// 1. Click "Log out" — page updates immediately, no refresh required.
// 2. Cookies `_at`, `_rt`, `userId` are gone in DevTools > Application > Cookies.
// 3. localStorage drafts cleared.
// 4. Apollo cache cleared — navigating back to /dashboard routes to /signin.
// 5. Hitting Back button does not restore an authenticated view.

export {};
