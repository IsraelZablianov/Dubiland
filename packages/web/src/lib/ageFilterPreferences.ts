import type { CatalogAgeBand } from '@/lib/catalogRepository';

const STORAGE_KEY = 'dubiland:age-filter-overrides';

type AgeFilterOverrideStore = Record<string, CatalogAgeBand>;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function parseStore(value: string | null): AgeFilterOverrideStore {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const output: AgeFilterOverrideStore = {};
    for (const [key, band] of Object.entries(parsed)) {
      if (
        band === '3-4' ||
        band === '4-5' ||
        band === '5-6' ||
        band === '6-7' ||
        band === 'all'
      ) {
        output[key] = band;
      }
    }

    return output;
  } catch {
    return {};
  }
}

function readStore(): AgeFilterOverrideStore {
  if (!canUseStorage()) {
    return {};
  }

  return parseStore(window.localStorage.getItem(STORAGE_KEY));
}

function writeStore(store: AgeFilterOverrideStore): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getPersistedAgeBandOverride(childId: string | null | undefined): CatalogAgeBand | null {
  if (!childId) {
    return null;
  }

  const store = readStore();
  return store[childId] ?? null;
}

export async function persistAgeBandOverride(
  childId: string | null | undefined,
  ageBand: CatalogAgeBand | null,
): Promise<void> {
  if (!childId) {
    return;
  }

  const store = readStore();

  if (ageBand) {
    store[childId] = ageBand;
  } else {
    delete store[childId];
  }

  // Keep updates optimistic in UI and treat persistence as async background work.
  await Promise.resolve();
  writeStore(store);
}
