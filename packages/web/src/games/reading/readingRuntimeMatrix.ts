export type ReadingAgeBand = '3-4' | '5-6' | '6-7';
export type ReadingProfileAgeBand = ReadingAgeBand | '4-5';
export type ReadingLadderBookId = 'book1' | 'book4' | 'book5' | 'book6' | 'book7' | 'book8' | 'book9' | 'book10';

export interface ReadingAntiGuessGuard {
  rapidTapCount: number;
  rapidTapWindowMs: number;
  pauseMs: number;
  shortResponseStreakThreshold?: number;
  shortResponseWindowMs?: number;
}

interface ReadingHandbookBandRules {
  defaultBookId: ReadingLadderBookId;
  masteryMode: 'listen_explore' | 'decode_core' | 'pointing_bridge';
  allowsIndependentDecodeScoring: boolean;
  enforceDecodeFirstScoredLock: boolean;
  allowsPartialPointingOnMasteredTokens: boolean;
  hintTriggerMs: number;
  maxChoiceCount: number;
  antiGuessGuard: ReadingAntiGuessGuard;
}

interface ReadingDecodableBandRules {
  storyPages: number;
  supportMissThreshold: number;
  maxHintStep: number;
  decodeWithinTwoAttemptsTarget: number;
  sequenceEvidenceTarget: number;
  participationTarget: number;
  maxChoiceCount: number;
  antiGuessGuard: ReadingAntiGuessGuard;
  requiresDecodeFirstScoredLock: boolean;
  allowsPartialPointingOnMasteredTokens: boolean;
}

interface ReadingTransitionRules {
  maxPointingFadePerClusterPct: number;
  freezePointingFadeBelowDecodeAccuracyPct: number;
  keepComprehensionFormatStablePages: number;
}

export interface ReadingBandRuntimeRules {
  handbook: ReadingHandbookBandRules;
  decodable: ReadingDecodableBandRules;
  transitions: ReadingTransitionRules;
}

const BASE_TRANSITION_RULES: ReadingTransitionRules = {
  maxPointingFadePerClusterPct: 10,
  freezePointingFadeBelowDecodeAccuracyPct: 85,
  keepComprehensionFormatStablePages: 2,
};

export const READING_RUNTIME_MATRIX: Record<ReadingAgeBand, ReadingBandRuntimeRules> = {
  '3-4': {
    handbook: {
      defaultBookId: 'book1',
      masteryMode: 'listen_explore',
      allowsIndependentDecodeScoring: false,
      enforceDecodeFirstScoredLock: false,
      allowsPartialPointingOnMasteredTokens: false,
      hintTriggerMs: 800,
      maxChoiceCount: 2,
      antiGuessGuard: {
        rapidTapCount: 3,
        rapidTapWindowMs: 2000,
        pauseMs: 800,
      },
    },
    decodable: {
      storyPages: 4,
      supportMissThreshold: 1,
      maxHintStep: 2,
      decodeWithinTwoAttemptsTarget: 70,
      sequenceEvidenceTarget: 0,
      participationTarget: 70,
      maxChoiceCount: 2,
      antiGuessGuard: {
        rapidTapCount: 3,
        rapidTapWindowMs: 2000,
        pauseMs: 800,
      },
      requiresDecodeFirstScoredLock: true,
      allowsPartialPointingOnMasteredTokens: false,
    },
    transitions: BASE_TRANSITION_RULES,
  },
  '5-6': {
    handbook: {
      defaultBookId: 'book4',
      masteryMode: 'decode_core',
      allowsIndependentDecodeScoring: true,
      enforceDecodeFirstScoredLock: true,
      allowsPartialPointingOnMasteredTokens: false,
      hintTriggerMs: 1000,
      maxChoiceCount: 3,
      antiGuessGuard: {
        rapidTapCount: 4,
        rapidTapWindowMs: 2000,
        pauseMs: 1000,
      },
    },
    decodable: {
      storyPages: 6,
      supportMissThreshold: 2,
      maxHintStep: 3,
      decodeWithinTwoAttemptsTarget: 85,
      sequenceEvidenceTarget: 0,
      participationTarget: 75,
      maxChoiceCount: 3,
      antiGuessGuard: {
        rapidTapCount: 4,
        rapidTapWindowMs: 2000,
        pauseMs: 1000,
      },
      requiresDecodeFirstScoredLock: true,
      allowsPartialPointingOnMasteredTokens: false,
    },
    transitions: BASE_TRANSITION_RULES,
  },
  '6-7': {
    handbook: {
      defaultBookId: 'book7',
      masteryMode: 'pointing_bridge',
      allowsIndependentDecodeScoring: true,
      enforceDecodeFirstScoredLock: true,
      allowsPartialPointingOnMasteredTokens: true,
      hintTriggerMs: 1000,
      maxChoiceCount: 3,
      antiGuessGuard: {
        rapidTapCount: 4,
        rapidTapWindowMs: 2000,
        pauseMs: 1000,
        shortResponseStreakThreshold: 3,
        shortResponseWindowMs: 600,
      },
    },
    decodable: {
      storyPages: 6,
      supportMissThreshold: 2,
      maxHintStep: 3,
      decodeWithinTwoAttemptsTarget: 88,
      sequenceEvidenceTarget: 80,
      participationTarget: 80,
      maxChoiceCount: 3,
      antiGuessGuard: {
        rapidTapCount: 4,
        rapidTapWindowMs: 2000,
        pauseMs: 1000,
        shortResponseStreakThreshold: 3,
        shortResponseWindowMs: 600,
      },
      requiresDecodeFirstScoredLock: true,
      allowsPartialPointingOnMasteredTokens: true,
    },
    transitions: BASE_TRANSITION_RULES,
  },
};

export const READING_LADDER_BOOK_BY_AGE_BAND: Record<ReadingAgeBand, ReadingLadderBookId> = {
  '3-4': READING_RUNTIME_MATRIX['3-4'].handbook.defaultBookId,
  '5-6': READING_RUNTIME_MATRIX['5-6'].handbook.defaultBookId,
  '6-7': READING_RUNTIME_MATRIX['6-7'].handbook.defaultBookId,
};

export const READING_DEFAULT_AGE_BAND_BY_BOOK: Record<ReadingLadderBookId, ReadingAgeBand> = {
  book1: '3-4',
  book4: '5-6',
  book5: '5-6',
  book6: '5-6',
  book7: '6-7',
  book8: '6-7',
  book9: '6-7',
  book10: '6-7',
};

export function isReadingAgeBand(value: unknown): value is ReadingAgeBand {
  return value === '3-4' || value === '5-6' || value === '6-7';
}

export function toReadingAgeBand(value: unknown): ReadingAgeBand {
  if (value === '3-4') {
    return '3-4';
  }

  if (value === '6-7') {
    return '6-7';
  }

  return '5-6';
}
