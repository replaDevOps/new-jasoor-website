import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CONTENT } from '../constants/content';
import { useMutation, useApolloClient } from '@apollo/client';
import { LOGOUT } from '../graphql/mutations/auth';
import { getUserId, clearAuthTokens, isAuthenticated, hasValidSession } from '../utils/tokenManager';
import { startAutoRefresh, stopAutoRefresh } from '../utils/tokenRefreshService';

type Language = 'ar' | 'en';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  content: typeof CONTENT.ar;
  direction: 'rtl' | 'ltr';
  isLoggedIn: boolean;
  login: () => void;
  logout: () => Promise<void>;
  // BUG-04 FIX: userId was missing from interface — Listings.tsx destructured it causing undefined
  userId: string | null;
}

// Default context for when components are rendered outside the provider (e.g. in previews)
const defaultContext: AppContextType = {
  language: 'ar',
  setLanguage: () => {},
  content: CONTENT.ar,
  direction: 'rtl',
  isLoggedIn: false,
  login: () => {},
  logout: async () => {},
  userId: null,
};

const AppContext = createContext<AppContextType>(defaultContext);

export function AppProvider({ children }: { children: ReactNode }) {
  // Persist language across refreshes
  const [language, setLanguageState] = useState<Language>(() => {
    try { return (localStorage.getItem('jusoor_lang') as Language) || 'ar'; } catch { return 'ar'; }
  });

  // Persist login state across refreshes.
  // Cross-check localStorage flag against the actual token cookie: if the flag
  // says "logged in" but the access token is gone (expired, cleared, or refresh
  // failed), clear the stale flag and treat as logged-out immediately so the
  // dashboard never renders in a no-auth state.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      if (localStorage.getItem('jusoor_logged_in') !== 'true') return false;
      const userId = getUserId();
      // No userId cookie at all — fully dead session, safe to wipe everything
      if (!userId) {
        localStorage.removeItem('jusoor_logged_in');
        clearAuthTokens();
        return false;
      }
      // Neither token is valid — no recovery possible, safe to wipe
      if (!hasValidSession()) {
        localStorage.removeItem('jusoor_logged_in');
        clearAuthTokens();
        return false;
      }
      // Access token may already be expired but refresh token is still valid.
      // Return true optimistically — startAutoRefresh() will silently refresh
      // the access token and confirm the session, or call clearLocalSession()
      // if refresh also fails.
      return true;
    } catch { return false; }
  });

  // BUG-04 FIX: Read userId from cookie so Listings.tsx gets the real value
  const [userId, setUserId] = useState<string | null>(() => {
    try { return getUserId(); } catch { return null; }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem('jusoor_lang', lang); } catch {}
  };

  const content = CONTENT[language];
  const direction = content.direction as 'rtl' | 'ltr';

  const clearLocalSession = async () => {
    stopAutoRefresh();
    clearAuthTokens();
    try { await apolloClient.clearStore(); } catch {}
    setIsLoggedIn(false);
    setUserId(null);
    try { localStorage.removeItem('jusoor_logged_in'); } catch {}
  };

  const login = () => {
    const nextUserId = getUserId();
    if (!nextUserId || !isAuthenticated()) {
      clearAuthTokens();
      setIsLoggedIn(false);
      setUserId(null);
      return;
    }
    setIsLoggedIn(true);
    try {
      localStorage.setItem('jusoor_logged_in', 'true');
      // Refresh userId from cookie after login
      setUserId(nextUserId);
      startAutoRefresh();
    } catch {}
  };

  // BUG-7 FIX: call server LOGOUT mutation before clearing local state
  const apolloClient = useApolloClient();
  const [logoutMutation] = useMutation(LOGOUT, { errorPolicy: 'all' });
  const logout = async () => {
    const serverLogout = logoutMutation().catch(() => undefined);
    await clearLocalSession();
    await serverLogout;
  };

  // BUG-12 FIX: apolloClient dispatches 'auth:logout' when token refresh fails,
  // but AppContext never listened — user stayed logged in after session expired
  useEffect(() => {
    const handleAuthLogout = () => { clearLocalSession(); };
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    startAutoRefresh().then((authenticated) => {
      if (cancelled) return;
      const nextUserId = getUserId();
      if (authenticated && nextUserId) {
        setUserId(nextUserId);
        setIsLoggedIn(true);
        try { localStorage.setItem('jusoor_logged_in', 'true'); } catch {}
      } else {
        clearLocalSession();
      }
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'jusoor_logged_in' && event.newValue !== 'true') {
        clearLocalSession();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', handleStorage);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppContext.Provider value={{ language, setLanguage, content, direction, isLoggedIn, login, logout, userId }}>
      <div dir={direction} className={language === 'ar' ? 'font-sans' : 'font-sans'}>
        {children}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
