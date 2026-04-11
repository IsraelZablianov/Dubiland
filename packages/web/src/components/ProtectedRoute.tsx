import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { hasActiveChildSessionHint, hasPersistedSupabaseSessionHint } from '@/lib/authSessionHints';
import { isSupabaseConfigured } from '@/lib/supabaseConfig';
import { isGuestModeEnabled } from '@/lib/session';

const AUTH_BOOTSTRAP_DELAY_MS = 120;
const AUTH_BOOTSTRAP_IDLE_TIMEOUT_MS = 1200;

type IdleCallbackHandle = number;

interface IdleCallbackApi {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout?: number },
  ) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
}

function scheduleDeferredAuthCheck(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    callback();
    return () => undefined;
  }

  const idleWindow = window as Window & IdleCallbackApi;
  let hasRun = false;
  let timeoutId: number | null = null;
  let idleHandle: IdleCallbackHandle | null = null;

  const run = () => {
    if (hasRun) {
      return;
    }
    hasRun = true;
    callback();
  };

  timeoutId = window.setTimeout(run, AUTH_BOOTSTRAP_DELAY_MS);
  if (typeof idleWindow.requestIdleCallback === 'function') {
    idleHandle = idleWindow.requestIdleCallback(run, { timeout: AUTH_BOOTSTRAP_IDLE_TIMEOUT_MS });
  }

  return () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (idleHandle !== null && typeof idleWindow.cancelIdleCallback === 'function') {
      idleWindow.cancelIdleCallback(idleHandle);
      idleHandle = null;
    }
  };
}

function hasProtectedShellHint(): boolean {
  return hasPersistedSupabaseSessionHint() || hasActiveChildSessionHint();
}

function ProtectedShellBoundary({ children }: { children: ReactNode }) {
  const shouldRenderShellFirst =
    !isSupabaseConfigured || isGuestModeEnabled() || hasProtectedShellHint();

  if (shouldRenderShellFirst) {
    return <>{children}</>;
  }

  // Anonymous protected entry still renders shell-first; AuthBootstrapGate
  // reconciles to /login asynchronously without blocking first paint.
  return <>{children}</>;
}

function AuthBootstrapGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [shouldReconcileAuth, setShouldReconcileAuth] = useState(false);

  useEffect(() => {
    return scheduleDeferredAuthCheck(() => {
      setShouldReconcileAuth(true);
    });
  }, []);

  if (!shouldReconcileAuth || !isSupabaseConfigured || isGuestModeEnabled()) {
    return <>{children}</>;
  }

  if (loading) {
    return <>{children}</>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedShellBoundary>
      <AuthBootstrapGate>{children}</AuthBootstrapGate>
    </ProtectedShellBoundary>
  );
}
