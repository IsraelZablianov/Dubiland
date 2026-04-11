import type { Database } from '@dubiland/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/supabaseConfig';

type SupabaseRuntime = SupabaseClient<Database>;

let runtimePromise: Promise<SupabaseRuntime | null> | null = null;

/**
 * Lazy-loads the Supabase runtime so protected-route first paint can avoid
 * pulling the supabase chunk into the initial module graph.
 */
export async function loadSupabaseRuntime(): Promise<SupabaseRuntime | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!runtimePromise) {
    runtimePromise = import('@/lib/supabase')
      .then((module) => module.supabase)
      .catch((error) => {
        runtimePromise = null;
        throw error;
      });
  }

  return runtimePromise;
}
