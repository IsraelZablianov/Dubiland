type AudioManifestEntry = string | { path?: string };

type AudioManifest = Record<string, AudioManifestEntry>;

const AUDIO_MANIFEST_URL = '/audio/he/manifest.json';
const DEFAULT_NAMESPACE = 'common';
const EXPLICIT_NAMESPACES = ['common', 'onboarding', 'public', 'seo'] as const;

let manifestPathByKey: Map<string, string> | null = null;
let manifestLoadPromise: Promise<void> | null = null;

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function normalizeLookupKey(rawKey: string): string {
  const trimmed = rawKey.trim();
  if (trimmed.includes(':')) {
    const [namespace, key] = trimmed.split(':', 2);
    if (namespace && key) {
      return `${namespace}.${key}`;
    }
  }
  return trimmed;
}

function hasExplicitNamespace(key: string): boolean {
  return EXPLICIT_NAMESPACES.some((namespace) => key === namespace || key.startsWith(`${namespace}.`));
}

function toManifestLookupKeys(key: string, defaultNamespace: string): string[] {
  if (!key) {
    return [];
  }

  const lookupKeys = [key];
  if (!hasExplicitNamespace(key)) {
    lookupKeys.unshift(`${defaultNamespace}.${key}`);
  }
  return [...new Set(lookupKeys)];
}

function toFallbackPathKey(key: string): string {
  if (key.startsWith(`${DEFAULT_NAMESPACE}.`)) {
    return key.slice(DEFAULT_NAMESPACE.length + 1);
  }
  return key;
}

function readManifestAudioPath(entry: AudioManifestEntry): string | null {
  if (typeof entry === 'string') {
    return entry;
  }

  if (entry && typeof entry === 'object' && typeof entry.path === 'string') {
    return entry.path;
  }

  return null;
}

function isManifest(value: unknown): value is AudioManifest {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function storeManifest(value: unknown): void {
  if (!isManifest(value)) {
    return;
  }

  const next = new Map<string, string>();
  for (const [key, entry] of Object.entries(value)) {
    const path = readManifestAudioPath(entry);
    if (typeof path === 'string' && path.startsWith('/audio/he/')) {
      next.set(key, path);
    }
  }

  manifestPathByKey = next;
}

async function loadManifest(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const response = await fetch(AUDIO_MANIFEST_URL);
    if (!response.ok) {
      return;
    }
    const payload: unknown = await response.json();
    storeManifest(payload);
  } catch {
    // Keep deterministic fallback behavior when the manifest cannot be loaded.
  }
}

export function warmAudioManifestLookup(): void {
  if (manifestLoadPromise || typeof window === 'undefined') {
    return;
  }
  manifestLoadPromise = loadManifest();
}

export function resolveAudioPathFromKey(rawKey: string, defaultNamespace = DEFAULT_NAMESPACE): string {
  if (!rawKey) {
    return '/audio/he/branding/app-name.mp3';
  }

  if (rawKey.startsWith('/') || rawKey.startsWith('http://') || rawKey.startsWith('https://')) {
    return rawKey;
  }

  const normalizedKey = normalizeLookupKey(rawKey);
  const lookupKeys = toManifestLookupKeys(normalizedKey, defaultNamespace);
  for (const key of lookupKeys) {
    const manifestPath = manifestPathByKey?.get(key);
    if (manifestPath) {
      return manifestPath;
    }
  }

  warmAudioManifestLookup();

  const fallbackPathKey = toFallbackPathKey(normalizedKey);
  const pathSegments = fallbackPathKey.split('.').map(toKebabCase).filter(Boolean);
  if (pathSegments.length === 0) {
    return '/audio/he/branding/app-name.mp3';
  }

  return `/audio/he/${pathSegments.join('/')}.mp3`;
}
