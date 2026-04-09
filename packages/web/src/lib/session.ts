export interface ActiveChildProfile {
  id: string;
  name: string;
  emoji: string;
}

const GUEST_MODE_KEY = 'dubiland:guest-mode';
const ACTIVE_CHILD_KEY = 'dubiland:active-child';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function isGuestModeEnabled(): boolean {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(GUEST_MODE_KEY) === 'true';
}

export function enableGuestMode(): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(GUEST_MODE_KEY, 'true');
}

export function disableGuestMode(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(GUEST_MODE_KEY);
}

export function setActiveChildProfile(profile: ActiveChildProfile): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ACTIVE_CHILD_KEY, JSON.stringify(profile));
}

export function getActiveChildProfile(): ActiveChildProfile | null {
  if (!canUseStorage()) return null;

  const value = window.localStorage.getItem(ACTIVE_CHILD_KEY);
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as ActiveChildProfile;
    if (!parsed.id || !parsed.name || !parsed.emoji) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearActiveChildProfile(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ACTIVE_CHILD_KEY);
}
