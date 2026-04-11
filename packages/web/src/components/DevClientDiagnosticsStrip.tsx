import { useCallback, useState } from 'react';
import { isPersistableChildId } from '@/lib/persistableChildId';
import { loadSupabaseRuntime } from '@/lib/loadSupabaseRuntime';
import { getActiveChildProfile } from '@/lib/session';
import { isSupabaseConfigured } from '@/lib/supabaseConfig';

/**
 * Fixed footer in `yarn dev` only. Surfaces why there may be zero Supabase traffic
 * (missing VITE_* env, non-UUID child profile, or probe errors).
 */
export function DevClientDiagnosticsStrip() {
  const [probe, setProbe] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const runProbe = useCallback(async () => {
    setBusy(true);
    setProbe(null);
    try {
      if (!isSupabaseConfigured) {
        setProbe('Skipped: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set for this build.');
        return;
      }
      const supabase = await loadSupabaseRuntime();
      if (!supabase) {
        setProbe('loadSupabaseRuntime() returned null.');
        return;
      }
      const { data, error } = await supabase.from('games').select('id').eq('is_published', true).limit(1);
      if (error) {
        setProbe(`games select error: ${error.message}`);
        return;
      }
      setProbe(`OK: games row count ${Array.isArray(data) ? data.length : 0} (check Network → Fetch for *.supabase.co).`);
    } catch (e) {
      setProbe(e instanceof Error ? e.message : 'Probe threw');
    } finally {
      setBusy(false);
    }
  }, []);

  if (!import.meta.env.DEV) {
    return null;
  }

  const profile = typeof window !== 'undefined' ? getActiveChildProfile() : null;
  const childId = profile?.id ?? '(none)';
  const persistable = profile?.id ? isPersistableChildId(profile.id) : false;

  return (
    <div
      role="status"
      aria-label="Developer diagnostics"
      style={{
        position: 'fixed',
        insetInline: 0,
        insetBlockEnd: 0,
        zIndex: 9999,
        padding: '8px 12px',
        fontSize: '12px',
        lineHeight: 1.45,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        background: 'color-mix(in srgb, #1a1a2e 92%, white)',
        color: '#f8f8f2',
        borderTop: '1px solid #44475a',
        display: 'grid',
        gap: '4px',
      }}
    >
      <div>
        <strong>DEV</strong> · Supabase env:{' '}
        {isSupabaseConfigured ? (
          <span style={{ color: '#50fa7b' }}>VITE_* present</span>
        ) : (
          <span style={{ color: '#ff5555' }}>
            missing — add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to repo root .env and restart `yarn dev`
          </span>
        )}
      </div>
      <div>
        Active child: <code style={{ wordBreak: 'break-all' }}>{childId}</code> · persistable:{' '}
        {persistable ? (
          <span style={{ color: '#50fa7b' }}>yes</span>
        ) : (
          <span style={{ color: '#ffb86c' }}>no — open /profiles and select a real child (UUID)</span>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => void runProbe()}
          disabled={busy}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #6272a4',
            background: '#44475a',
            color: '#f8f8f2',
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {busy ? 'Probing…' : 'Probe Supabase (games)'}
        </button>
        <span style={{ opacity: 0.85 }}>
          In DevTools Network, show <strong>All</strong> or <strong>Fetch</strong> — not only XHR.
        </span>
      </div>
      {probe ? <div style={{ color: '#8be9fd' }}>{probe}</div> : null}
    </div>
  );
}
