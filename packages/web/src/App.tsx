import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AppShell, MarketingShell } from '@/components/layout';
import { AnimatedPage } from '@/components/motion';
import { ScrollToTop } from '@/components/routing/ScrollToTop';
import { ensureCommonNamespaceLoaded, hasCommonNamespaceLoaded } from '@/i18n';
import { flushParentFunnelEventQueue } from '@/lib/parentFunnelInstrumentation';
import { GAME_ROUTE_MANIFEST, type GameRouteManifestEntry } from '@/routing/gameRouteManifest';

const Landing = lazy(() => import('@/pages/Landing'));
const About = lazy(() => import('@/pages/About'));
const Parents = lazy(() => import('@/pages/Parents'));
const ParentsFaq = lazy(() => import('@/pages/ParentsFaq'));
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const TopicPillar = lazy(() => import('@/pages/TopicPillar'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const ParentDashboard = lazy(() => import('@/pages/ParentDashboard'));
const ProfilePicker = lazy(() => import('@/pages/ProfilePicker'));
const ProtectedRoute = lazy(async () => {
  const module = await import('@/components/ProtectedRoute');
  return { default: module.ProtectedRoute };
});
const RouteMetadataManager = lazy(async () => {
  const module = await import('@/seo/RouteMetadataManager');
  return { default: module.RouteMetadataManager };
});

function RouteFallback() {
  return (
    <div className="route-fallback" aria-busy="true" aria-live="polite">
      <div className="route-fallback__panel">
        <span className="route-fallback__spinner" aria-hidden="true" />
        <div className="route-fallback__skeleton" aria-hidden="true">
          <span className="route-fallback__skeleton-pill route-fallback__skeleton-pill--title" />
          <span className="route-fallback__skeleton-pill route-fallback__skeleton-pill--line" />
          <span className="route-fallback__skeleton-pill route-fallback__skeleton-pill--line-short" />
        </div>
      </div>
    </div>
  );
}

type RouteShell = 'public' | 'app';
const COMMON_NAMESPACE_BOOTSTRAP_PREFIXES = ['/games', '/parent'] as const;

function requiresCommonNamespace(pathname: string) {
  if (pathname === '/login' || pathname === '/profiles') {
    return true;
  }

  return COMMON_NAMESPACE_BOOTSTRAP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function withAnimatedPage(element: ReactNode, shell: RouteShell) {
  if (shell === 'public') {
    return <>{element}</>;
  }

  return <AnimatedPage className={`animated-page--shell-${shell}`}>{element}</AnimatedPage>;
}

function withProtectedAppShell(element: ReactNode) {
  return (
    <ProtectedRoute>
      <AppShell>{element}</AppShell>
    </ProtectedRoute>
  );
}

function buildGameRouteElement(route: GameRouteManifestEntry) {
  const RouteComponent = route.component;
  const content = route.disableShellAnimation
    ? <RouteComponent />
    : withAnimatedPage(<RouteComponent />, 'app');

  return withProtectedAppShell(content);
}

export default function App() {
  const location = useLocation();
  const commonNamespaceRequired = requiresCommonNamespace(location.pathname);
  const [commonNamespaceReady, setCommonNamespaceReady] = useState(
    () => !commonNamespaceRequired || hasCommonNamespaceLoaded(),
  );

  useEffect(() => {
    let active = true;

    if (!commonNamespaceRequired) {
      setCommonNamespaceReady(true);
      return () => {
        active = false;
      };
    }

    if (hasCommonNamespaceLoaded()) {
      setCommonNamespaceReady(true);
      return () => {
        active = false;
      };
    }

    setCommonNamespaceReady(false);

    void ensureCommonNamespaceLoaded().then(() => {
      if (!active) return;
      setCommonNamespaceReady(true);
    });

    return () => {
      active = false;
    };
  }, [commonNamespaceRequired]);

  useEffect(() => {
    void flushParentFunnelEventQueue();
  }, [location.pathname]);

  if (!commonNamespaceReady) {
    return <RouteFallback />;
  }

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={null}>
        <RouteMetadataManager />
      </Suspense>

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public marketing pages */}
          <Route path="/" element={<MarketingShell>{withAnimatedPage(<Landing />, 'public')}</MarketingShell>} />
          <Route path="/about" element={<MarketingShell>{withAnimatedPage(<About />, 'public')}</MarketingShell>} />
          <Route path="/parents" element={<MarketingShell>{withAnimatedPage(<Parents />, 'public')}</MarketingShell>} />
          <Route path="/parents/faq" element={<MarketingShell>{withAnimatedPage(<ParentsFaq />, 'public')}</MarketingShell>} />
          <Route path="/terms" element={<MarketingShell>{withAnimatedPage(<Terms />, 'public')}</MarketingShell>} />
          <Route path="/privacy" element={<MarketingShell>{withAnimatedPage(<Privacy />, 'public')}</MarketingShell>} />
          <Route path="/letters" element={<MarketingShell>{withAnimatedPage(<TopicPillar topic="letters" />, 'public')}</MarketingShell>} />
          <Route path="/numbers" element={<MarketingShell>{withAnimatedPage(<TopicPillar topic="numbers" />, 'public')}</MarketingShell>} />
          <Route path="/reading" element={<MarketingShell>{withAnimatedPage(<TopicPillar topic="reading" />, 'public')}</MarketingShell>} />

          {/* Login — public header/footer */}
          <Route path="/login" element={<MarketingShell>{withAnimatedPage(<Login />, 'public')}</MarketingShell>} />

          {/* App shell — authenticated profile + game routes */}
          <Route
            path="/profiles"
            element={withProtectedAppShell(withAnimatedPage(<ProfilePicker />, 'app'))}
          />
          <Route
            path="/games"
            element={withProtectedAppShell(withAnimatedPage(<Home />, 'app'))}
          />
          <Route
            path="/parent"
            element={withProtectedAppShell(withAnimatedPage(<ParentDashboard />, 'app'))}
          />
          {GAME_ROUTE_MANIFEST.map((route) => (
            <Route key={route.path} path={route.path} element={buildGameRouteElement(route)} />
          ))}

          {/* 404 */}
          <Route path="*" element={<MarketingShell>{withAnimatedPage(<NotFound />, 'public')}</MarketingShell>} />
        </Routes>
      </Suspense>
    </>
  );
}
