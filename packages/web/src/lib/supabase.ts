import type { Database } from '@dubiland/shared';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabaseConfig } from '@/lib/supabaseConfig';

export { isSupabaseConfigured } from '@/lib/supabaseConfig';

export const supabase: SupabaseClient<Database> = isSupabaseConfigured
  ? createClient<Database>(supabaseConfig.url!, supabaseConfig.anonKey!, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : (null as unknown as SupabaseClient<Database>);
