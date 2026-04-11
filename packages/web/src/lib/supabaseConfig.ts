const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (import.meta.env.DEV && !isSupabaseConfigured) {
  console.warn(
    '[Dubiland] Supabase is OFF for this dev build: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the repo root .env (see .env.example), then restart `yarn dev`. No progress or catalog RPCs will run.',
  );
}

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
} as const;
