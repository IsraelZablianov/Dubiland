import { lazy, Suspense, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ScrollToTop } from '@/components/routing/ScrollToTop';
import { RouteFallback } from '@/components/routing/RouteFallback';
import { flushParentFunnelEventQueue } from '@/lib/parentFunnelInstrumentation';
import { resolveBootstrapRouteFamily } from '@/routing/bootstrapRouteFamily';

const PublicBootstrapApp = lazy(() => import('@/bootstrap/PublicBootstrapApp'));
const ProtectedBootstrapApp = lazy(() => import('@/bootstrap/ProtectedBootstrapApp'));
const RouteMetadataManager = lazy(async () => {
  const module = await import('@/seo/RouteMetadataManager');
  return { default: module.RouteMetadataManager };
});

export default function App() {
  const location = useLocation();
  const routeFamily = resolveBootstrapRouteFamily(location.pathname);

  useEffect(() => {
    void flushParentFunnelEventQueue();
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={null}>
        <RouteMetadataManager />
      </Suspense>
      <Suspense fallback={<RouteFallback />}>
        {routeFamily === 'protected' ? <ProtectedBootstrapApp /> : <PublicBootstrapApp />}
      </Suspense>
    </>
  );
}
