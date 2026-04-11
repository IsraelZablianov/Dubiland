import { getActiveChildProfile } from '@/lib/session';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function hasPersistedSupabaseSessionHint(): boolean {
  if (!canUseStorage()) {
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

export function hasActiveChildSessionHint(): boolean {
  return Boolean(getActiveChildProfile()?.id);
}
