import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { disableGuestMode } from '@/lib/session';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!isSupabaseConfigured ? false : true);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

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

    return () => subscription.unsubscribe();
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
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: origin ? `${origin}/login` : undefined,
      },
    });
    if (error) throw error;
  }, [guardSupabase]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!guardSupabase()) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, [guardSupabase]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!guardSupabase()) return;
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, [guardSupabase]);

  const signOut = useCallback(async () => {
    if (!guardSupabase()) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [guardSupabase]);

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
