import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { Listings } from './components/Listings';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { BrowseBusinesses } from './pages/BrowseBusinesses';
import { BusinessDetails } from './pages/BusinessDetails';
import { SignUp } from './pages/auth/SignUp';
import { SignIn } from './pages/auth/SignIn';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { About } from './pages/About';
import { Support } from './pages/Support';
import { Terms } from './pages/Terms';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Articles } from './pages/Articles';
// P2-FIX-BUG2: import ListingWizard so 'Sell Your Business' / 'List Your Business' has a destination
import { ListingWizard } from './pages/ListingWizard';
import { Toaster } from 'sonner';

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
      const id = Number(path.split('/details/')[1]);
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
        if (e.state.selectedBusinessId) setSelectedBusinessId(e.state.selectedBusinessId);
      } else {
        const path = window.location.pathname;
        if (path.startsWith('/details/')) {
          const id = Number(path.split('/details/')[1]);
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

  const handleNavigate = (page: string, id?: string | number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (page === 'details' && id != null) setSelectedBusinessId(id);
    // P2-FIX-BUG2: unauthenticated users trying to list a business are sent to sign-in first
    if (page === 'list-business' && !isLoggedIn) {
      setView('signin');
      return;
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
        {view === 'signin' && <SignIn onNavigate={handleNavigate} />}
        {view === 'forgot-password' && <ForgotPassword onNavigate={handleNavigate} />}

        {view === 'dashboard' && (
          isLoggedIn
            ? <Dashboard
                onNavigate={handleNavigate}
                onEditListing={(id: string | number) => {
                  setSelectedBusinessId(id);
                  setView('list-business');
                }}
              />
            : <SignIn onNavigate={handleNavigate} />
        )}

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
