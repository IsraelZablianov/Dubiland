export function RouteFallback() {
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
