export type ChildAgeBand = '3-4' | '4-5' | '5-6' | '6-7';
export type ChildAgeBandSelection = ChildAgeBand | 'all';

interface LooseRecord {
  [key: string]: unknown;
}

function isRecord(value: unknown): value is LooseRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNormalized(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function toChildAgeBand(value: unknown): ChildAgeBand | null {
  const normalized = toNormalized(value);
  if (!normalized) {
    return null;
  }

  if (normalized === '3-4' || normalized === '3_4' || normalized === '34') return '3-4';
  if (normalized === '4-5' || normalized === '4_5' || normalized === '45') return '4-5';
  if (normalized === '5-6' || normalized === '5_6' || normalized === '56') return '5-6';
  if (normalized === '6-7' || normalized === '6_7' || normalized === '67') return '6-7';
  return null;
}

function toAgeYears(birthDate: string, now: Date): number | null {
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }

  let years = now.getUTCFullYear() - parsed.getUTCFullYear();
  const hasBirthdayPassed =
    now.getUTCMonth() > parsed.getUTCMonth() ||
    (now.getUTCMonth() === parsed.getUTCMonth() && now.getUTCDate() >= parsed.getUTCDate());

  if (!hasBirthdayPassed) {
    years -= 1;
  }

  return Number.isFinite(years) ? years : null;
}

export function resolveAgeBandFromBirthDate(birthDate: string | null | undefined, now: Date = new Date()): ChildAgeBand | null {
  if (!birthDate) {
    return null;
  }

  const years = toAgeYears(birthDate, now);
  if (years == null) {
    return null;
  }

  if (years <= 4) return '3-4';
  if (years === 5) return '4-5';
  if (years === 6) return '5-6';
  return '6-7';
}

export function resolveAgeBandFromLevelConfig(levelConfig: unknown): ChildAgeBand | null {
  if (!isRecord(levelConfig)) {
    return null;
  }

  const progressionConfig = isRecord(levelConfig.progression) ? levelConfig.progression : null;

  const candidates: unknown[] = [
    levelConfig.profileAgeBand,
    levelConfig.ageBand,
    levelConfig.defaultBand,
    levelConfig.age_band,
    progressionConfig?.profileAgeBand,
    progressionConfig?.ageBand,
    progressionConfig?.defaultBand,
    progressionConfig?.age_band,
  ];

  for (const candidate of candidates) {
    const parsed = toChildAgeBand(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

export function resolveConcurrentChoiceLimitForAgeBand(ageBand: ChildAgeBand | null | undefined): number {
  if (ageBand === '6-7') {
    return 5;
  }

  if (ageBand === '3-4' || ageBand === '4-5' || ageBand === '5-6') {
    return 3;
  }

  return 4;
}

export function resolveConcurrentChoiceLimit(
  selectedAgeBand: ChildAgeBandSelection,
  profileAgeBand?: ChildAgeBand,
): number {
  const effectiveAgeBand = selectedAgeBand === 'all' ? profileAgeBand : selectedAgeBand;
  return resolveConcurrentChoiceLimitForAgeBand(effectiveAgeBand);
}

export function resolveGameConcurrentChoiceLimit(levelConfig: unknown, childBirthDate: string | null | undefined): number {
  const ageBand = resolveAgeBandFromLevelConfig(levelConfig) ?? resolveAgeBandFromBirthDate(childBirthDate);
  return resolveConcurrentChoiceLimitForAgeBand(ageBand);
}
