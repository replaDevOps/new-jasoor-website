import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Toaster } from 'sonner';

// ── Home page sections: loaded eagerly (always visible on first paint) ──────
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { Listings } from './components/Listings';
import { FAQ } from './components/FAQ';

// ── All other pages: lazy-loaded only when the user navigates to them ───────
// This splits each page into its own JS chunk, dramatically reducing initial bundle size.
const BrowseBusinesses = lazy(() => import('./pages/BrowseBusinesses').then(m => ({ default: m.BrowseBusinesses })));
const BusinessDetails   = lazy(() => import('./pages/BusinessDetails').then(m => ({ default: m.BusinessDetails })));
const SignUp            = lazy(() => import('./pages/auth/SignUp').then(m => ({ default: m.SignUp })));
const SignIn            = lazy(() => import('./pages/auth/SignIn').then(m => ({ default: m.SignIn })));
const ForgotPassword    = lazy(() => import('./pages/auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const Dashboard         = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const About             = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Support           = lazy(() => import('./pages/Support').then(m => ({ default: m.Support })));
const Terms             = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));
const PrivacyPolicy     = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const Articles          = lazy(() => import('./pages/Articles').then(m => ({ default: m.Articles })));
// P2-FIX-BUG2: ListingWizard lazy-loaded — it's huge and only used by logged-in sellers
const ListingWizard     = lazy(() => import('./pages/ListingWizard').then(m => ({ default: m.ListingWizard })));

// Minimal fallback shown while a lazy chunk is downloading
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-8 h-8 rounded-full border-4 border-[#10B981] border-t-transparent animate-spin" />
  </div>
);

// BUG-16: Map view names to URL paths and back
// P2-FIX-BUG2: added 'list-business' entry
const VIEW_TO_PATH: Record<string, string> = {
  home: '/',
  browse: '/browse',
  details: '/details',
  'list-business': '/list-business',
  signup: '/signup',
  signin: '/signin',
  'forgot-password': '/forgot-password',
  dashboard: '/dashboard',
  about: '/about',
  support: '/support',
  terms: '/terms',
  privacy: '/privacy',
  articles: '/articles',
  'not-found': '/404',
};

const PATH_TO_VIEW: Record<string, string> = Object.fromEntries(
  Object.entries(VIEW_TO_PATH).map(([v, p]) => [p, v])
);

// P2-FIX-BUG2: added 'list-business' to the union type
type ViewType =
  | 'home' | 'browse' | 'details' | 'list-business'
  | 'signup' | 'signin' | 'forgot-password' | 'dashboard'
  | 'about' | 'support' | 'terms' | 'privacy' | 'articles' | 'not-found';

function AppContent() {
  const { isLoggedIn, direction, language } = useApp();

  // BUG-16: Initialize view from current URL path
  const getInitialView = (): ViewType => {
    const path = window.location.pathname;
    // Support /details/123 URLs — but /details with no ID goes to browse
    if (path.startsWith('/details/')) {
      const id = decodeURIComponent(path.split('/details/')[1] || '');
      if (id) return 'details';
      return 'browse';
    }
    if (path === '/details') return 'browse';
    return (PATH_TO_VIEW[path] as ViewType) || 'not-found';
  };

  const getInitialBusinessId = (): string | null => {
    const path = window.location.pathname;
    const match = path.match(/^\/details\/([^/]+)/);
    return match ? match[1] : null;
  };

  const [view, setView] = useState<ViewType>(getInitialView);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | number | null>(getInitialBusinessId);
  // Stores where to return after a forced sign-in (e.g. signed-out user clicking Make Offer)
  const [pendingReturn, setPendingReturn] = useState<{ view: ViewType; id?: string | number } | null>(null);
  // Intent-routing: when navigating to dashboard with a specific sub-tab target (e.g. settings:identity)
  const [dashboardDefaultTab, setDashboardDefaultTab] = useState<string | undefined>(undefined);

  // BUG-16: Sync URL when view changes
  useEffect(() => {
    let path = VIEW_TO_PATH[view] || '/';
    // Include business ID in URL so refresh works
    if (view === 'details' && selectedBusinessId) {
      path = `/details/${selectedBusinessId}`;
    }
    if (window.location.pathname !== path) {
      window.history.pushState({ view, selectedBusinessId }, '', path);
    }
  }, [view, selectedBusinessId]);

  // BUG-16: Handle browser back/forward buttons
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state?.view) {
        setView(e.state.view as ViewType);
        // Always sync selectedBusinessId from history state — clear it when the restored
        // state has no id so stale IDs don't reopen edit mode unexpectedly.
        setSelectedBusinessId(e.state.selectedBusinessId ?? null);
      } else {
        const path = window.location.pathname;
        if (path.startsWith('/details/')) {
          const id = decodeURIComponent(path.split('/details/')[1] || '');
          if (id) setSelectedBusinessId(id);
          setView('details');
        } else {
          setView((PATH_TO_VIEW[path] as ViewType) || 'not-found');
        }
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Auth guard: if login state drops to false while the dashboard is open
  // (token expired mid-session or sign-out button clicked), force navigation
  // to home. This makes logout reliable regardless of component mount state.
  useEffect(() => {
    if (!isLoggedIn && view === 'dashboard') {
      setView('home');
    }
  }, [isLoggedIn, view]);

  const handleNavigate = (page: string, id?: string | number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Intent-route: 'dashboard:settings:identity' → open Dashboard directly on Settings → Identity
    if (page === 'dashboard:settings:identity') {
      setDashboardDefaultTab('settings:identity');
      setPendingReturn(null);
      setView('dashboard');
      return;
    }
    // Clear dashboard intent for all other navigations
    setDashboardDefaultTab(undefined);
    if (page === 'details' && id != null) setSelectedBusinessId(id);
    if (page === 'list-business' && id == null) setSelectedBusinessId(null);
    // P2-FIX-BUG2: unauthenticated users trying to list a business are sent to sign-in first
    if (page === 'list-business' && !isLoggedIn) {
      setPendingReturn({ view: 'list-business' });
      setView('signin');
      return;
    }
    // Signed-out user redirected to signin from a listing action — capture return destination
    if (page === 'signin' && view === 'details' && selectedBusinessId) {
      setPendingReturn({ view: 'details', id: selectedBusinessId });
    } else if (page !== 'signin') {
      // Clear pending return when navigating to any page other than signin
      setPendingReturn(null);
    }
    // BUG-15: any unknown page now lands on not-found instead of silently showing home
    const target = VIEW_TO_PATH[page] ? (page as ViewType) : 'not-found';
    setView(target);
  };

  return (
    <>
      <main className="min-h-screen bg-white font-sans text-gray-900 selection:bg-[#004E39] selection:text-white">
        <Toaster position="top-center" dir={direction} />

        {/* Hide navbar on full-screen pages */}
        {!['dashboard', 'signup', 'signin', 'forgot-password', 'list-business'].includes(view) && (
          <Navbar
            onNavigate={(page) => handleNavigate(page)}
            useLightLogo={['about', 'support', 'browse', 'articles', 'privacy', 'terms'].includes(view)}
          />
        )}

        {view === 'home' && (
          <>
            <Hero onNavigate={handleNavigate} />
            <Features />
            <HowItWorks onNavigate={handleNavigate} />
            <Listings onViewAll={() => handleNavigate('browse')} onNavigate={handleNavigate} />
            <FAQ onNavigate={handleNavigate} />
          </>
        )}

        <Suspense fallback={<PageLoader />}>
          {view === 'browse' && <BrowseBusinesses onNavigate={handleNavigate} />}

          {view === 'details' && (
            <BusinessDetails
              onBack={() => handleNavigate('browse')}
              businessId={selectedBusinessId}
              onNavigate={handleNavigate}
            />
          )}

          {/* P2-FIX-BUG2: ListingWizard now reachable via 'list-business' */}
          {view === 'list-business' && (
            <ListingWizard
              mode={selectedBusinessId ? 'edit' : 'create'}
              initialData={selectedBusinessId ? { id: String(selectedBusinessId) } : undefined}
              onSuccess={() => { setSelectedBusinessId(null); handleNavigate('dashboard'); }}
              onClose={() => { setSelectedBusinessId(null); handleNavigate('dashboard'); }}
              onCancel={() => { setSelectedBusinessId(null); handleNavigate('dashboard'); }}
            />
          )}

          {view === 'about' && <About onNavigate={handleNavigate} />}
          {view === 'support' && <Support onNavigate={handleNavigate} />}
          {view === 'terms' && <Terms onNavigate={handleNavigate} />}
          {view === 'privacy' && <PrivacyPolicy onNavigate={handleNavigate} />}
          {view === 'articles' && <Articles onNavigate={handleNavigate} />}

          {view === 'signup' && <SignUp onNavigate={handleNavigate} />}
          {view === 'signin' && <SignIn onNavigate={handleNavigate} returnTo={pendingReturn ?? undefined} />}
          {view === 'forgot-password' && <ForgotPassword onNavigate={handleNavigate} />}

          {view === 'dashboard' && (
            isLoggedIn
              ? <Dashboard
                  onNavigate={handleNavigate}
                  defaultTab={dashboardDefaultTab}
                  onEditListing={(id: string | number) => {
                    setSelectedBusinessId(id);
                    setView('list-business');
                  }}
                />
              : <SignIn onNavigate={handleNavigate} returnTo={pendingReturn ?? undefined} />
          )}
        </Suspense>

        {/* BUG-15: 404 page for invalid routes */}
        {view === 'not-found' && (
          <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-8 text-center">
            <div className="text-8xl mb-6">🔍</div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">
              {language === 'ar' ? 'الصفحة غير موجودة' : '404 — Page Not Found'}
            </h1>
            <p className="text-gray-500 text-lg max-w-md mb-8">
              {language === 'ar'
                ? 'يبدو أن هذه الصفحة غير موجودة أو أن الرابط غير صحيح.'
                : "The page you're looking for doesn't exist or the link is broken."}
            </p>
            <button
              onClick={() => handleNavigate('home')}
              className="px-8 py-3.5 bg-[#008A66] text-white font-bold rounded-xl hover:bg-[#007053] transition-colors shadow-lg shadow-[#008A66]/20"
            >
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </button>
          </div>
        )}

        {/* Hide footer on full-screen / standalone pages */}
        {!['dashboard', 'not-found', 'list-business'].includes(view) && (
          <Footer onNavigate={handleNavigate} />
        )}
      </main>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
