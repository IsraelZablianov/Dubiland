import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { MascotIllustration } from '@/components/illustrations';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isGuestModeEnabled } from '@/lib/session';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (!isSupabaseConfigured) {
    return <>{children}</>;
  }

  if (isGuestModeEnabled()) {
    return <>{children}</>;
  }

  if (loading) {
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
