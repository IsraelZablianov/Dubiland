export type ReadingRoutingAgeBand = '3-4' | '4-5' | '5-6' | '6-7';
export type ReadingRoutingLevelId = 1 | 2 | 3;
export type ReadingMasteryOutcome =
  | 'unknown'
  | 'introduced'
  | 'practicing'
  | 'passed'
  | 'mastered'
  | 'needs_support';

export interface ReadingRoutingContext {
  ageBand: ReadingRoutingAgeBand;
  masteryOutcome: ReadingMasteryOutcome | null;
  inSupportMode: boolean;
  initialLevelId: ReadingRoutingLevelId;
}

interface ResolveReadingRoutingOptions {
  baseLevelByAgeBand?: Partial<Record<ReadingRoutingAgeBand, ReadingRoutingLevelId>>;
  minLevel?: ReadingRoutingLevelId;
  maxLevel?: ReadingRoutingLevelId;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toTrimmedLower(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function toReadingAgeBand(value: unknown): ReadingRoutingAgeBand | null {
  const normalized = toTrimmedLower(value);
  if (!normalized) {
    return null;
  }

  if (normalized === '3-4' || normalized === '3_4' || normalized === '34') return '3-4';
  if (normalized === '4-5' || normalized === '4_5' || normalized === '45') return '4-5';
  if (normalized === '5-6' || normalized === '5_6' || normalized === '56') return '5-6';
  if (normalized === '6-7' || normalized === '6_7' || normalized === '67') return '6-7';
  return null;
}

function toReadingMasteryOutcome(value: unknown): ReadingMasteryOutcome | null {
  const normalized = toTrimmedLower(value);
  if (!normalized) {
    return null;
  }

  if (normalized === 'unknown') return 'unknown';
  if (normalized === 'introduced') return 'introduced';
  if (normalized === 'practicing') return 'practicing';
  if (normalized === 'passed') return 'passed';
  if (normalized === 'mastered') return 'mastered';
  if (normalized === 'needs_support' || normalized === 'needs-support') return 'needs_support';
  return null;
}

function toLevelId(value: unknown): ReadingRoutingLevelId | null {
  if (value === 1 || value === 2 || value === 3) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (parsed === 1 || parsed === 2 || parsed === 3) {
      return parsed;
    }
  }

  return null;
}

function defaultBaseLevelByAgeBand(ageBand: ReadingRoutingAgeBand): ReadingRoutingLevelId {
  if (ageBand === '3-4' || ageBand === '4-5') {
    return 1;
  }
  if (ageBand === '5-6') {
    return 2;
  }
  return 3;
}

function ageBandFallbackFromLevel(levelId: ReadingRoutingLevelId): ReadingRoutingAgeBand {
  if (levelId === 1) return '4-5';
  if (levelId === 2) return '5-6';
  return '6-7';
}

function resolveConfiguredStartLevel(levelConfig: Record<string, unknown>): ReadingRoutingLevelId | null {
  const directCandidates: unknown[] = [
    levelConfig.startingLevel,
    levelConfig.startLevel,
    levelConfig.startingLevelNumber,
    levelConfig.startLevelNumber,
    levelConfig.initialLevel,
    levelConfig.initialLevelNumber,
    levelConfig.levelNumber,
    levelConfig.servedLevel,
    levelConfig.servedLevelNumber,
  ];

  for (const candidate of directCandidates) {
    const parsed = toLevelId(candidate);
    if (parsed) {
      return parsed;
    }
  }

  const progressionConfig = isRecord(levelConfig.progression) ? levelConfig.progression : null;
  if (progressionConfig) {
    const nestedCandidates: unknown[] = [
      progressionConfig.startingLevel,
      progressionConfig.startingLevelNumber,
      progressionConfig.startLevel,
      progressionConfig.startLevelNumber,
      progressionConfig.initialLevel,
      progressionConfig.initialLevelNumber,
      progressionConfig.levelNumber,
      progressionConfig.servedLevel,
      progressionConfig.servedLevelNumber,
    ];

    for (const candidate of nestedCandidates) {
      const parsed = toLevelId(candidate);
      if (parsed) {
        return parsed;
      }
    }
  }

  return null;
}

function clampLevel(
  value: ReadingRoutingLevelId,
  minLevel: ReadingRoutingLevelId,
  maxLevel: ReadingRoutingLevelId,
): ReadingRoutingLevelId {
  if (value < minLevel) {
    return minLevel;
  }
  if (value > maxLevel) {
    return maxLevel;
  }
  return value;
}

export function resolveReadingRoutingContext(
  levelConfig: Record<string, unknown>,
  fallbackLevel: ReadingRoutingLevelId,
  options: ResolveReadingRoutingOptions = {},
): ReadingRoutingContext {
  const progressionConfig = isRecord(levelConfig.progression) ? levelConfig.progression : null;
  const minLevel = options.minLevel ?? 1;
  const maxLevel = options.maxLevel ?? 3;

  const ageBand =
    toReadingAgeBand(levelConfig.profileAgeBand) ??
    toReadingAgeBand(levelConfig.ageBand) ??
    toReadingAgeBand(levelConfig.defaultBand) ??
    toReadingAgeBand(levelConfig.age_band) ??
    toReadingAgeBand(progressionConfig?.profileAgeBand) ??
    toReadingAgeBand(progressionConfig?.ageBand) ??
    toReadingAgeBand(progressionConfig?.age_band) ??
    ageBandFallbackFromLevel(fallbackLevel);

  const masteryOutcome =
    toReadingMasteryOutcome(levelConfig.masteryOutcome) ??
    toReadingMasteryOutcome(levelConfig.mastery_outcome) ??
    toReadingMasteryOutcome(progressionConfig?.masteryOutcome) ??
    toReadingMasteryOutcome(progressionConfig?.mastery_outcome) ??
    null;

  const inSupportMode =
    Boolean(levelConfig.inSupportMode) ||
    Boolean(levelConfig.in_support_mode) ||
    Boolean(progressionConfig?.inSupportMode) ||
    Boolean(progressionConfig?.in_support_mode);

  const configuredStartLevel = resolveConfiguredStartLevel(levelConfig);
  const baseLevelByAgeBand = options.baseLevelByAgeBand ?? {};
  const baseLevel =
    baseLevelByAgeBand[ageBand] ?? defaultBaseLevelByAgeBand(ageBand);

  let initialLevelId = configuredStartLevel ?? baseLevel;

  if (!configuredStartLevel) {
    if (inSupportMode || masteryOutcome === 'needs_support') {
      initialLevelId = Math.max(minLevel, initialLevelId - 1) as ReadingRoutingLevelId;
    } else if (masteryOutcome === 'mastered' || masteryOutcome === 'passed') {
      if (ageBand === '4-5' && initialLevelId < 2) {
        initialLevelId = 2;
      } else if (ageBand === '5-6' && initialLevelId < 3) {
        initialLevelId = 3;
      }
    } else if ((masteryOutcome === 'introduced' || masteryOutcome === 'practicing') && ageBand === '6-7') {
      initialLevelId = Math.max(2, initialLevelId - 1) as ReadingRoutingLevelId;
    }
  }

  initialLevelId = clampLevel(initialLevelId, minLevel, maxLevel);

  return {
    ageBand,
    masteryOutcome,
    inSupportMode,
    initialLevelId,
  };
}
