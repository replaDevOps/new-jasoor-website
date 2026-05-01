import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CONTENT } from '../constants/content';
import { useMutation, useApolloClient } from '@apollo/client';
import { LOGOUT } from '../graphql/mutations/auth';
import { getUserId, clearAuthTokens } from '../utils/tokenManager';

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

  // Persist login state across refreshes
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try { return localStorage.getItem('jusoor_logged_in') === 'true'; } catch { return false; }
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

  const login = () => {
    setIsLoggedIn(true);
    try {
      localStorage.setItem('jusoor_logged_in', 'true');
      // Refresh userId from cookie after login
      setUserId(getUserId());
    } catch {}
  };

  // BUG-7 FIX: call server LOGOUT mutation before clearing local state
  const apolloClient = useApolloClient();
  const [logoutMutation] = useMutation(LOGOUT, { errorPolicy: 'all' });
  const logout = async () => {
    try { await logoutMutation(); } catch { /* proceed even if server call fails */ }
    // Clear all cached Apollo queries so stale user data doesn't persist after logout
    try { await apolloClient.clearStore(); } catch {}
    setIsLoggedIn(false);
    setUserId(null);
    try { localStorage.removeItem('jusoor_logged_in'); } catch {}
    clearAuthTokens(); // clear all auth cookies (_at, _rt, userId, userStatus)
  };

  // BUG-12 FIX: apolloClient dispatches 'auth:logout' when token refresh fails,
  // but AppContext never listened — user stayed logged in after session expired
  useEffect(() => {
    const handleAuthLogout = () => logout();
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
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
