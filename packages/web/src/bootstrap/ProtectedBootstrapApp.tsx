import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell, MarketingShell } from '@/components/layout';
import { AnimatedPage } from '@/components/motion';
import { RouteFallback } from '@/components/routing/RouteFallback';
import { AuthProvider } from '@/hooks/useAuth';
import { ensureCommonNamespaceLoaded, hasCommonNamespaceLoaded } from '@/i18n';
import { GAME_ROUTE_MANIFEST, type GameRouteManifestEntry } from '@/routing/gameRouteManifest';

const Home = lazy(() => import('@/pages/Home'));
const ParentDashboard = lazy(() => import('@/pages/ParentDashboard'));
const ProfilePicker = lazy(() => import('@/pages/ProfilePicker'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function withAnimatedAppPage(element: ReactNode) {
  return <AnimatedPage className="animated-page--shell-app">{element}</AnimatedPage>;
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
    : withAnimatedAppPage(<RouteComponent />);

  return withProtectedAppShell(content);
}

export default function ProtectedBootstrapApp() {
  const location = useLocation();
  const [commonNamespaceReady, setCommonNamespaceReady] = useState(() => hasCommonNamespaceLoaded());

  useEffect(() => {
    let active = true;

    if (hasCommonNamespaceLoaded()) {
      setCommonNamespaceReady(true);
      return () => {
        active = false;
      };
    }

    setCommonNamespaceReady(false);

    void ensureCommonNamespaceLoaded().then(() => {
      if (!active) {
        return;
      }
      setCommonNamespaceReady(true);
    });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  if (!commonNamespaceReady) {
    return <RouteFallback />;
  }

  return (
    <AuthProvider>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/profiles" element={withProtectedAppShell(withAnimatedAppPage(<ProfilePicker />))} />
          <Route path="/games" element={withProtectedAppShell(withAnimatedAppPage(<Home />))} />
          <Route path="/parent" element={withProtectedAppShell(withAnimatedAppPage(<ParentDashboard />))} />
          {GAME_ROUTE_MANIFEST.map((route) => (
            <Route key={route.path} path={route.path} element={buildGameRouteElement(route)} />
          ))}
          <Route path="*" element={<MarketingShell><NotFound /></MarketingShell>} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
