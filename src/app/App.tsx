import React, { Suspense, lazy, useState, useEffect } from 'react';
import Lenis from 'lenis';
import { AuthProvider, useAuth } from '@/app/providers/AuthProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { ThemeProvider, useTheme, THEMES } from '@/app/providers/ThemeProvider';
import { NotificationProvider } from '@/app/providers/NotificationProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import Navbar from '@/app/shell/Navbar';
import LandingPage from '@/features/landing/pages/LandingPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import TimetableGrid from '@/features/timetable/components/TimetableGrid';
import { PrayerTimesNotifier } from '@/features/timetable/components/PrayerTimesWidget';
import ErrorScreen from '@/app/shell/ErrorScreen';
import ErrorBoundary from '@/app/shell/ErrorBoundary';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
const LogoutModal = lazy(() => import('@/features/auth/modals/LogoutModal'));
import PwaInstallPrompt from '@/features/pwa/components/PwaInstallPrompt';
const PdfExportModal = lazy(() => import('@/features/export/modals/PdfExportModal'));
const ExamScheduleModal = lazy(() => import('@/features/planning/modals/ExamScheduleModal'));
const ToolsDrawer = lazy(() => import('@/app/shell/ToolsDrawer'));
const GpaCalculatorModal = lazy(() => import('@/features/planning/modals/GpaCalculatorModal'));
const AttendanceScanModal = lazy(() => import('@/features/timetable/components/AttendanceScanModal'));
const CompareScheduleModal = lazy(() => import('@/features/sharing/modals/CompareScheduleModal'));
const PrayerTimesModal = lazy(() => import('@/features/timetable/modals/PrayerTimesModal'));
const PrayerToast = lazy(() => import('@/features/timetable/components/PrayerToast'));

const SITE_NAME = 'USAS Class Timetable';
const SITE_DESCRIPTION = 'Official and independent student schedule portal for Universiti Sultan Azlan Shah (USAS) to preview, format, and export class timetables into calendar feeds (.ICS), printable A4 PDFs, and lockscreen wallpapers.';
const SITE_IMAGE = '/seo-preview.svg';
const SITE_IMAGE_ALT = 'USAS Class Timetable preview image';
const SITE_KEYWORDS = 'USAS, Universiti Sultan Azlan Shah, timetable, class schedule, student portal, PDF export, wallpaper export';

function ensureMetaTag(key: 'name' | 'property', value: string, content: string) {
  const selector = `meta[${key}="${value}"]`;
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(key, value);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function ensureLinkTag(rel: string, href: string) {
  const selector = `link[rel="${rel}"]`;
  let element = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function ensureStructuredData(id: string, value: unknown) {
  const selector = `script[data-seo-jsonld="${id}"]`;
  let element = document.head.querySelector(selector) as HTMLScriptElement | null;
  if (!element) {
    element = document.createElement('script');
    element.type = 'application/ld+json';
    element.setAttribute('data-seo-jsonld', id);
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(value);
}

function removeStructuredData(id: string) {
  document.head.querySelector(`script[data-seo-jsonld="${id}"]`)?.remove();
}

function MainContent() {
  const { session, timetableData, login, logout, error, setError, refreshTimetable } = useAuth();
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const [pathname, setPathname] = useState(() => window.location.pathname || '/');
  const view = session
    ? 'app'
    : pathname === '/login'
      ? 'login'
      : 'landing';

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isPrayerTimesOpen, setIsPrayerTimesOpen] = useState(false);
  const [isAttendanceScanOpen, setIsAttendanceScanOpen] = useState(false);
  const [attendanceRefreshToken, setAttendanceRefreshToken] = useState(0);
  const [isGpaModalOpen, setIsGpaModalOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isCompareScheduleOpen, setIsCompareScheduleOpen] = useState(false);
  const [initialCompareData, setInitialCompareData] = useState<string | null>(null);

  // Auto-login to demo account if URL has ?demo=true, and check for compare_schedule
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isDemo = params.get('demo') === 'true';
    const compareData = params.get('compare_schedule');
    
    if (isDemo && !session) {
      login('AI210042', 'demo123', true).then(() => {
        if (!compareData) window.history.replaceState({}, '', '/app');
      }).catch(console.error);
    }
    
    if (compareData && session) {
      setInitialCompareData(compareData);
      setIsCompareScheduleOpen(true);
      window.history.replaceState({}, '', '/app');
    }
  }, [session, login]);

  // Update document title, meta tags, and structured data
  useEffect(() => {
    const title = view === 'login'
      ? 'Login | USAS Class Timetable'
      : 'USAS Class Timetable';
    const description = view === 'landing'
      ? SITE_DESCRIPTION
      : view === 'login'
        ? (lang === 'en'
            ? 'Sign in to access your USAS timetable, export tools, and student planning utilities.'
            : 'Log masuk untuk akses jadual USAS, alat eksport, dan utiliti perancangan pelajar.')
        : (lang === 'en'
            ? 'View and manage your active USAS timetable session.'
            : 'Lihat dan urus sesi jadual aktif USAS anda.');
    const robots = view === 'landing'
      ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
      : 'noindex,nofollow';
    const canonicalUrl = new URL(view === 'landing' ? '/' : pathname, window.location.origin).toString();

    document.title = title;
    ensureMetaTag('name', 'description', description);
    ensureMetaTag('name', 'robots', robots);
    ensureMetaTag('name', 'keywords', SITE_KEYWORDS);
    ensureMetaTag('property', 'og:title', title);
    ensureMetaTag('property', 'og:description', description);
    ensureMetaTag('property', 'og:type', 'website');
    ensureMetaTag('property', 'og:url', canonicalUrl);
    ensureMetaTag('property', 'og:image', new URL(SITE_IMAGE, window.location.origin).toString());
    ensureMetaTag('property', 'og:image:alt', SITE_IMAGE_ALT);
    ensureMetaTag('property', 'og:site_name', SITE_NAME);
    ensureMetaTag('name', 'twitter:card', 'summary_large_image');
    ensureMetaTag('name', 'twitter:title', title);
    ensureMetaTag('name', 'twitter:description', description);
    ensureMetaTag('name', 'twitter:image', new URL(SITE_IMAGE, window.location.origin).toString());
    ensureMetaTag('name', 'twitter:image:alt', SITE_IMAGE_ALT);
    ensureLinkTag('canonical', canonicalUrl);

    if (view === 'landing') {
      ensureStructuredData('website', {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        url: canonicalUrl,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        browserRequirements: 'JavaScript and modern browser support',
      });
    } else {
      removeStructuredData('website');
    }
  }, [lang, pathname, view]);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname || '/');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    body.style.overflowY = session ? 'hidden' : 'auto';
    body.style.height = session ? '100%' : 'auto';
    root.style.overflowY = session ? 'hidden' : 'auto';
    root.style.height = session ? '100%' : 'auto';

    return () => {
      body.style.overflowY = '';
      body.style.height = '';
      root.style.overflowY = '';
      root.style.height = '';
    };
  }, [session]);

  useEffect(() => {
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    
    if (view !== 'landing' || isTouchDevice) {
      // Ensure any lingering Lenis instance is removed when not on landing page or on mobile
      const lenisWindow = window as unknown as Window & { usasLenis?: Lenis };
      if (lenisWindow.usasLenis) {
        lenisWindow.usasLenis.destroy();
        delete lenisWindow.usasLenis;
      }
      return;
    }

    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      allowNestedScroll: true,
    });
    const lenisWindow = window as unknown as Window & { usasLenis?: Lenis };
    lenisWindow.usasLenis = lenis;

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      delete lenisWindow.usasLenis;
    };
  }, [view]);

  useEffect(() => {
    if (session) {
      if (pathname !== '/app') {
        window.history.replaceState({}, '', '/app');
        setPathname('/app');
      }
      return;
    }

    if (pathname === '/app') {
      window.history.replaceState({}, '', '/login');
      setPathname('/login');
    }
  }, [pathname, session]);
  

  const navigateTo = (nextPath: '/' | '/login' | '/app') => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
      setPathname(nextPath);
      window.scrollTo(0, 0);
    }
  };

  const validPaths = new Set(['/', '/login', '/app']);
  if (!validPaths.has(pathname)) {
    return (
      <ErrorScreen
        status={404}
        title={lang === 'ms' ? 'Halaman tidak dijumpai' : 'Page not found'}
        message={lang === 'ms' ? 'Laluan ini tidak wujud dalam portal ini.' : 'The path you requested does not exist in this portal.'}
        primaryLabel={lang === 'ms' ? 'Mula semula' : 'Go home'}
        secondaryLabel={lang === 'ms' ? 'Muat semula' : 'Reload'}
        onPrimary={() => window.location.replace('/')}
        onSecondary={() => window.location.reload()}
      />
    );
  }

  return (
    <div className={`w-full ${view === 'app' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'} flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 antialiased ${
      theme === THEMES.LIGHT ? 'bg-[#f8fafc] text-slate-800' :
      theme === THEMES.OLED ? 'bg-black text-slate-100' :
      theme === THEMES.EMERALD ? 'bg-[#012117] text-slate-100' :
      'bg-[#060E1F] text-slate-100'
    }`}>
      <Navbar 
        onOpenTools={() => setIsToolsOpen(true)}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        view={view}
        onNavigateHome={() => navigateTo('/')}
        onNavigateLogin={() => navigateTo('/login')}
      />
      {session && error && (
        <div
          role="alert"
          aria-live="polite"
          className={`flex items-center gap-3 px-3 sm:px-6 py-2 text-xs font-semibold border-b flex-shrink-0 ${
            theme === THEMES.LIGHT
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-amber-400/10 border-amber-400/20 text-amber-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="flex-1 min-w-0">{error}</span>
          <button
            type="button"
            onClick={() => { setError(null); void refreshTimetable(); }}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 border border-current/30 hover:bg-black/5"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{lang === 'ms' ? 'Cuba lagi' : 'Retry'}</span>
          </button>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label={lang === 'ms' ? 'Tutup' : 'Dismiss'}
            className="p-1 rounded-md hover:bg-black/5"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
      {session && <PrayerTimesNotifier />}
      
      <main className={view === 'app' ? 'flex-1 min-h-0 overflow-hidden relative' : 'flex-1 relative'}>
        {!session && view === 'landing' && (
          <LandingPage onGoToLogin={() => navigateTo('/login')} />
        )}
        {!session && view === 'login' && (
          <LoginPage />
        )}
        {session && (
          <TimetableGrid 
            attendanceRefreshToken={attendanceRefreshToken} 
            onOpenExam={() => setIsExamModalOpen(true)}
          />
        )}
      </main>

      <Suspense fallback={null}>
        {session && <PrayerToast />}
        
        {/* Tools Drawer — houses ALL secondary actions */}
        <ToolsDrawer
          isOpen={isToolsOpen}
          onClose={() => setIsToolsOpen(false)}
          onOpenPdf={() => { setIsPdfModalOpen(true); }}
          onOpenExam={() => { setIsExamModalOpen(true); }}
          onOpenAttendanceScan={() => { setIsAttendanceScanOpen(true); }}
          onOpenCompare={() => { setIsCompareScheduleOpen(true); }}
          onOpenGpa={() => { setIsGpaModalOpen(true); }}
          onOpenPrayerTimes={() => { setIsPrayerTimesOpen(true); }}
          onOpenLogout={() => { setIsLogoutModalOpen(true); }}
        />

        {/* Modals */}
        <PdfExportModal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} />
        <PrayerTimesModal isOpen={isPrayerTimesOpen} onClose={() => setIsPrayerTimesOpen(false)} />
        <ExamScheduleModal isOpen={isExamModalOpen} onClose={() => setIsExamModalOpen(false)} courses={timetableData?.timetable || []} />
        <AttendanceScanModal
          isOpen={isAttendanceScanOpen}
          onClose={() => setIsAttendanceScanOpen(false)}
          onSuccessfulScan={() => setAttendanceRefreshToken((value) => value + 1)}
        />
        <CompareScheduleModal
          isOpen={isCompareScheduleOpen}
          onClose={() => { setIsCompareScheduleOpen(false); setInitialCompareData(null); }}
          initialSharedData={initialCompareData}
        />
        <GpaCalculatorModal isOpen={isGpaModalOpen} onClose={() => setIsGpaModalOpen(false)} courses={timetableData?.timetable || []} />
        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={() => {
            setIsLogoutModalOpen(false);
            setIsToolsOpen(false);
            logout();
          }}
        />
      </Suspense>
      {view === 'landing' && <PwaInstallPrompt />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <LanguageProvider>
            <ErrorBoundary>
              <MainContent />
            </ErrorBoundary>
          </LanguageProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

















