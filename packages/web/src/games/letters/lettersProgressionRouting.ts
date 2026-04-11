export type LettersAgeBand = '3-4' | '4-5' | '5-6' | '6-7';
export type LettersGameLevelId = 1 | 2 | 3;
export type LettersMasteryOutcome =
  | 'unknown'
  | 'introduced'
  | 'practicing'
  | 'passed'
  | 'mastered'
  | 'needs_support';

export interface LettersRoutingContext {
  ageBand: LettersAgeBand;
  masteryOutcome: LettersMasteryOutcome | null;
  inSupportMode: boolean;
  initialLevelId: LettersGameLevelId;
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

function toLettersAgeBand(value: unknown): LettersAgeBand | null {
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

function toLettersMasteryOutcome(value: unknown): LettersMasteryOutcome | null {
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

function toLevelId(value: unknown): LettersGameLevelId | null {
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

function baseLevelByAgeBand(ageBand: LettersAgeBand): LettersGameLevelId {
  if (ageBand === '3-4' || ageBand === '4-5') {
    return 1;
  }
  if (ageBand === '5-6') {
    return 2;
  }
  return 3;
}

function ageBandFallbackFromLevel(levelId: LettersGameLevelId): LettersAgeBand {
  if (levelId === 1) {
    return '4-5';
  }
  if (levelId === 2) {
    return '5-6';
  }
  return '6-7';
}

function resolveConfiguredStartLevel(levelConfig: Record<string, unknown>): LettersGameLevelId | null {
  const directCandidates: unknown[] = [
    levelConfig.startingLevel,
    levelConfig.startLevel,
    levelConfig.startingLevelNumber,
    levelConfig.startLevelNumber,
    levelConfig.initialLevel,
    levelConfig.initialLevelNumber,
    levelConfig.levelNumber,
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

export function resolveLettersRoutingContext(
  levelConfig: Record<string, unknown>,
  fallbackLevel: LettersGameLevelId,
): LettersRoutingContext {
  const progressionConfig = isRecord(levelConfig.progression) ? levelConfig.progression : null;

  const ageBand =
    toLettersAgeBand(levelConfig.profileAgeBand) ??
    toLettersAgeBand(levelConfig.ageBand) ??
    toLettersAgeBand(levelConfig.defaultBand) ??
    toLettersAgeBand(levelConfig.age_band) ??
    toLettersAgeBand(progressionConfig?.ageBand) ??
    toLettersAgeBand(progressionConfig?.age_band) ??
    ageBandFallbackFromLevel(fallbackLevel);

  const masteryOutcome =
    toLettersMasteryOutcome(levelConfig.masteryOutcome) ??
    toLettersMasteryOutcome(levelConfig.mastery_outcome) ??
    toLettersMasteryOutcome(progressionConfig?.masteryOutcome) ??
    toLettersMasteryOutcome(progressionConfig?.mastery_outcome) ??
    null;

  const inSupportMode =
    Boolean(levelConfig.inSupportMode) ||
    Boolean(levelConfig.in_support_mode) ||
    Boolean(progressionConfig?.inSupportMode) ||
    Boolean(progressionConfig?.in_support_mode);

  const configuredStartLevel = resolveConfiguredStartLevel(levelConfig);
  let initialLevelId = configuredStartLevel ?? baseLevelByAgeBand(ageBand);

  if (!configuredStartLevel) {
    if (inSupportMode || masteryOutcome === 'needs_support') {
      initialLevelId = Math.max(1, initialLevelId - 1) as LettersGameLevelId;
    } else if (masteryOutcome === 'mastered' || masteryOutcome === 'passed') {
      if (ageBand === '4-5' && initialLevelId < 2) {
        initialLevelId = 2;
      }
      if (ageBand === '5-6' && initialLevelId < 3) {
        initialLevelId = 3;
      }
    } else if ((masteryOutcome === 'introduced' || masteryOutcome === 'practicing') && ageBand === '6-7') {
      initialLevelId = Math.max(2, initialLevelId - 1) as LettersGameLevelId;
    }
  }

  if (initialLevelId < 1) initialLevelId = 1;
  if (initialLevelId > 3) initialLevelId = 3;

  return {
    ageBand,
    masteryOutcome,
    inSupportMode,
    initialLevelId,
  };
}
