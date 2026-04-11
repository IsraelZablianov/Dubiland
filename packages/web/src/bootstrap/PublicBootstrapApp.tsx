import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { MarketingShell } from '@/components/layout';
import { RouteFallback } from '@/components/routing/RouteFallback';
import { AuthProvider } from '@/hooks/useAuth';
import { ensureCommonNamespaceLoaded, hasCommonNamespaceLoaded } from '@/i18n';

const Landing = lazy(() => import('@/pages/Landing'));
const About = lazy(() => import('@/pages/About'));
const Parents = lazy(() => import('@/pages/Parents'));
const ParentsFaq = lazy(() => import('@/pages/ParentsFaq'));
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const TopicPillar = lazy(() => import('@/pages/TopicPillar'));
const Login = lazy(() => import('@/pages/Login'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function requiresCommonNamespace(pathname: string): boolean {
  return pathname === '/login';
}

function withMarketingShell(element: ReactNode) {
  return <MarketingShell>{element}</MarketingShell>;
}

export default function PublicBootstrapApp() {
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
      if (!active) {
        return;
      }
      setCommonNamespaceReady(true);
    });

    return () => {
      active = false;
    };
  }, [commonNamespaceRequired]);

  if (!commonNamespaceReady) {
    return <RouteFallback />;
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      {/* MarketingShell renders PublicHeader, which lazy-loads PublicHeaderAuthSidecar → useAuth(). */}
      <AuthProvider>
        <Routes>
          <Route path="/" element={withMarketingShell(<Landing />)} />
          <Route path="/about" element={withMarketingShell(<About />)} />
          <Route path="/parents" element={withMarketingShell(<Parents />)} />
          <Route path="/parents/faq" element={withMarketingShell(<ParentsFaq />)} />
          <Route path="/terms" element={withMarketingShell(<Terms />)} />
          <Route path="/privacy" element={withMarketingShell(<Privacy />)} />
          <Route path="/letters" element={withMarketingShell(<TopicPillar topic="letters" />)} />
          <Route path="/numbers" element={withMarketingShell(<TopicPillar topic="numbers" />)} />
          <Route path="/reading" element={withMarketingShell(<TopicPillar topic="reading" />)} />
          <Route path="/login" element={withMarketingShell(<Login />)} />
          <Route path="*" element={withMarketingShell(<NotFound />)} />
        </Routes>
      </AuthProvider>
    </Suspense>
  );
}
