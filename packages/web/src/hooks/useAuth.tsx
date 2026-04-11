import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { hasPersistedSupabaseSessionHint } from '@/lib/authSessionHints';
import { loadSupabaseRuntime } from '@/lib/loadSupabaseRuntime';
import { isSupabaseConfigured } from '@/lib/supabaseConfig';
import { disableGuestMode, isGuestModeEnabled } from '@/lib/session';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_BOOTSTRAP_PREFIXES = ['/games', '/parent'] as const;
const HANDBOOK_RENDER_FIRST_ROUTE = '/games/reading/interactive-handbook';

function isRenderFirstAuthPath(pathname: string): boolean {
  return pathname === HANDBOOK_RENDER_FIRST_ROUTE;
}

function shouldBootstrapAuthForPath(pathname: string): boolean {
  if (pathname === '/login' || pathname === '/profiles') {
    return true;
  }

  return AUTH_BOOTSTRAP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() =>
    !isSupabaseConfigured ? false : !isRenderFirstAuthPath(location.pathname),
  );
  const bootstrappedRef = useRef(false);
  const subscriptionRef = useRef<(() => void) | null>(null);

  const loadSupabase = useCallback(async () => {
    const supabase = await loadSupabaseRuntime();
    if (!supabase) {
      throw new Error('Supabase runtime is unavailable.');
    }

    return supabase;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || bootstrappedRef.current) {
      return;
    }

    const hasSessionHint = hasPersistedSupabaseSessionHint();
    const shouldSkipGuestBootstrap =
      isGuestModeEnabled() && location.pathname !== '/login' && !hasSessionHint;

    if (shouldSkipGuestBootstrap) {
      setLoading(false);
      return;
    }

    const shouldBootstrap = shouldBootstrapAuthForPath(location.pathname) || hasSessionHint;

    if (!shouldBootstrap) {
      setLoading(false);
      return;
    }

    const renderFirstRoute = isRenderFirstAuthPath(location.pathname);
    let active = true;
    setLoading(!renderFirstRoute);

    void loadSupabase()
      .then(async (supabase) => {
        if (!active) return;

        const { data } = await supabase.auth.getSession();
        if (!active) return;

        const nextSession = data.session ?? null;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        if (nextSession?.user) {
          disableGuestMode();
        }
        setLoading(false);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, next: Session | null) => {
          setSession(next);
          setUser(next?.user ?? null);
          if (next?.user) {
            disableGuestMode();
          }
          setLoading(false);
        });

        subscriptionRef.current?.();
        subscriptionRef.current = () => subscription.unsubscribe();
        bootstrappedRef.current = true;
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadSupabase, location.pathname]);

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, []);

  const guardSupabase = useCallback(() => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
      return false;
    }
    return true;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!guardSupabase()) return;
    const supabase = await loadSupabase();
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}${base}/login`
        : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
  }, [guardSupabase, loadSupabase]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!guardSupabase()) return;
    const supabase = await loadSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, [guardSupabase, loadSupabase]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!guardSupabase()) return;
    const supabase = await loadSupabase();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, [guardSupabase, loadSupabase]);

  const signOut = useCallback(async () => {
    if (!guardSupabase()) return;
    const supabase = await loadSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [guardSupabase, loadSupabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUp,
      signOut,
    }),
    [user, session, loading, signInWithGoogle, signInWithEmail, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
