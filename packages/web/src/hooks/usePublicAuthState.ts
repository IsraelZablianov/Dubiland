import { useEffect, useState } from 'react';

interface PublicAuthState {
  hasAuthenticatedUser: boolean;
  loading: boolean;
}

function hasPersistedSupabaseSessionHint(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const keys = Object.keys(window.localStorage);
    return keys.some((key) => {
      if (!key.startsWith('sb-') || !key.endsWith('-auth-token')) {
        return false;
      }

      const token = window.localStorage.getItem(key);
      return typeof token === 'string' && token.length > 0;
    });
  } catch {
    return false;
  }
}

function isSupabaseConfiguredInEnv(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function usePublicAuthState(enabled: boolean): PublicAuthState {
  const [hasAuthenticatedUser, setHasAuthenticatedUser] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;

    if (!enabled || !isSupabaseConfiguredInEnv()) {
      setHasAuthenticatedUser(false);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    if (!hasPersistedSupabaseSessionHint()) {
      setHasAuthenticatedUser(false);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);

    void import('@/lib/supabase')
      .then(({ supabase }) => {
        if (!active) return;

        void supabase.auth
          .getSession()
          .then(({ data: { session } }) => {
            if (!active) return;
            setHasAuthenticatedUser(Boolean(session?.user));
            setLoading(false);
          })
          .catch(() => {
            if (!active) return;
            setHasAuthenticatedUser(false);
            setLoading(false);
          });

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!active) return;
          setHasAuthenticatedUser(Boolean(session?.user));
          setLoading(false);
        });

        unsubscribe = () => subscription.unsubscribe();
      })
      .catch(() => {
        if (!active) return;
        setHasAuthenticatedUser(false);
        setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [enabled]);

  return { hasAuthenticatedUser, loading };
}
