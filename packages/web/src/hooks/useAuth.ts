import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!isSupabaseConfigured ? false : true);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
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

  return { user, session, loading, signInWithGoogle, signInWithEmail, signUp, signOut };
}
