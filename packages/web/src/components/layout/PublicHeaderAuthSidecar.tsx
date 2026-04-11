import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ensureCommonNamespaceLoaded, hasCommonNamespaceLoaded } from '@/i18n';
import { usePublicAuthState } from '@/hooks/usePublicAuthState';
import { type ActiveChildProfile, getActiveChildProfile, isGuestModeEnabled } from '@/lib/session';

export interface PublicHeaderAuthSnapshot {
  isAuthenticated: boolean;
  loading: boolean;
  commonNamespaceReady: boolean;
  child: ActiveChildProfile | null;
  signOut: (() => Promise<void>) | null;
}

interface PublicHeaderAuthSidecarProps {
  onSnapshotChange: (snapshot: PublicHeaderAuthSnapshot) => void;
}

function isSameSnapshot(a: PublicHeaderAuthSnapshot, b: PublicHeaderAuthSnapshot): boolean {
  return (
    a.isAuthenticated === b.isAuthenticated &&
    a.loading === b.loading &&
    a.commonNamespaceReady === b.commonNamespaceReady &&
    a.signOut === b.signOut &&
    a.child?.id === b.child?.id &&
    a.child?.name === b.child?.name &&
    a.child?.emoji === b.child?.emoji &&
    a.child?.ageBand === b.child?.ageBand
  );
}

const EMPTY_AUTH_SNAPSHOT: PublicHeaderAuthSnapshot = {
  isAuthenticated: false,
  loading: false,
  commonNamespaceReady: false,
  child: null,
  signOut: null,
};

export function PublicHeaderAuthSidecar({ onSnapshotChange }: PublicHeaderAuthSidecarProps) {
  const guestModeEnabled = isGuestModeEnabled();
  const { hasAuthenticatedUser, loading } = usePublicAuthState(!guestModeEnabled);
  const [commonNamespaceReady, setCommonNamespaceReady] = useState(() => hasCommonNamespaceLoaded());
  const { signOut } = useAuth();
  const isAuthenticated = guestModeEnabled || hasAuthenticatedUser;
  const lastSnapshotRef = useRef<PublicHeaderAuthSnapshot>(EMPTY_AUTH_SNAPSHOT);

  useEffect(() => {
    if (!isAuthenticated || commonNamespaceReady) {
      return;
    }

    let active = true;

    void ensureCommonNamespaceLoaded().then(() => {
      if (!active) return;
      setCommonNamespaceReady(true);
    });

    return () => {
      active = false;
    };
  }, [commonNamespaceReady, isAuthenticated]);

  const child = isAuthenticated ? getActiveChildProfile() : null;

  useEffect(() => {
    const nextSnapshot: PublicHeaderAuthSnapshot = {
      isAuthenticated,
      loading,
      commonNamespaceReady,
      child,
      signOut: isAuthenticated ? signOut : null,
    };

    if (isSameSnapshot(lastSnapshotRef.current, nextSnapshot)) {
      return;
    }

    lastSnapshotRef.current = nextSnapshot;
    onSnapshotChange(nextSnapshot);
  }, [
    child,
    commonNamespaceReady,
    isAuthenticated,
    loading,
    onSnapshotChange,
    signOut,
  ]);

  return null;
}
