import { lazy, Suspense, useEffect, useState } from 'react';

const RouteMetadataManager = lazy(async () => {
  const module = await import('@/seo/RouteMetadataManager');
  return { default: module.RouteMetadataManager };
});

export function PublicRouteMetadataSidecar() {
  const [hasCommitted, setHasCommitted] = useState(false);

  useEffect(() => {
    setHasCommitted(true);
  }, []);

  if (!hasCommitted) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <RouteMetadataManager />
    </Suspense>
  );
}
