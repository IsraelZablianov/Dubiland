import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { MascotIllustration } from '@/components/illustrations';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/lib/supabaseConfig';
import { isGuestModeEnabled } from '@/lib/session';

const HANDBOOK_RENDER_FIRST_ROUTE = '/games/reading/interactive-handbook';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isHandbookRenderFirst = location.pathname === HANDBOOK_RENDER_FIRST_ROUTE;

  if (!isSupabaseConfigured) {
    return <>{children}</>;
  }

  if (isGuestModeEnabled()) {
    return <>{children}</>;
  }

  if (loading) {
    if (isHandbookRenderFirst) {
      return <>{children}</>;
    }

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--color-theme-bg)',
        }}
      >
        <MascotIllustration
          variant="loading"
          size={120}
          className="floating-element"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
