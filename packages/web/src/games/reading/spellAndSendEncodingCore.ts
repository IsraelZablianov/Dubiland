import type { HintTrend, StableRange } from '@/games/engine';

export type SpellStage = 'L1' | 'L2A' | 'L2B' | 'L3A' | 'L3B';
export type PassType = 'independent-pass' | 'supported-pass';
export type AntiGuessTier = 1 | 2;
export type FinalFormFamily = 'kaf' | 'mem' | 'nun' | 'pe' | 'tsadi';

export type WordId =
  | 'dag'
  | 'sal'
  | 'gam'
  | 'kad'
  | 'gal'
  | 'hag'
  | 'delet'
  | 'gesher'
  | 'kadur'
  | 'kotev'
  | 'kore'
  | 'mafteah'
  | 'mikhtav'
  | 'shomer'
  | 'malakh'
  | 'arukh'
  | 'shalom'
  | 'halom'
  | 'balon'
  | 'sakin'
  | 'atuf'
  | 'tsafuf'
  | 'rahuts'
  | 'kafuts'
  | 'sipur'
  | 'shulhan'
  | 'arnava'
  | 'madrekha'
  | 'hanukha'
  | 'yeladim';

export interface WordDefinition {
  id: WordId;
  wordKey: `words.pronunciation.${WordId}`;
  segmentedPart1Key: `games.spellAndSendPostOffice.segmentedWords.${WordId}.part1`;
  segmentedPart2Key: `games.spellAndSendPostOffice.segmentedWords.${WordId}.part2`;
}

export interface RoundTelemetry {
  stage: SpellStage;
  firstSlotFirstTry: boolean;
  roundFirstTryCorrect: boolean;
  firstTryCorrectSlots: number;
  totalSlots: number;
  hintsUsed: number;
  stage2PlusHints: number;
  stage3Hints: number;
  finalFormTarget: boolean;
  finalFormCorrect: boolean;
  independentCompletion: boolean;
}

export interface StageEvaluation {
  stage: SpellStage;
  passed: boolean;
  passType: PassType;
  firstTryWordRate: number;
  firstTrySlotRate: number;
  firstSlotIndependentRate: number;
  independentRate: number;
  finalFormAccuracy: number;
  stage2PlusHints: number;
  stage3Hints: number;
  weakBlock: boolean;
}

export interface AntiGuessSnapshot {
  nowMs: number;
  wrongPlacementTimes: readonly number[];
  missTimes: readonly number[];
}

export interface L2BBlockRound {
  wordId: WordId;
  finalFormTarget: boolean;
  finalFormFamily: FinalFormFamily;
}

export interface L2BBlockPointers {
  target: number;
  filler: number;
}

const NIKUD_MARKS_PATTERN = /[\u0591-\u05C7]/g;

export const STAGE_ORDER: readonly SpellStage[] = ['L1', 'L2A', 'L2B', 'L3A', 'L3B'];

export const STAGE_TARGET_ROUNDS: Record<SpellStage, number> = {
  L1: 10,
  L2A: 10,
  L2B: 20,
  L3A: 5,
  L3B: 15,
};

export const FINAL_FORM_CHAR_TO_FAMILY: Readonly<Record<string, FinalFormFamily>> = {
  '\u05DA': 'kaf',
  '\u05DD': 'mem',
  '\u05DF': 'nun',
  '\u05E3': 'pe',
  '\u05E5': 'tsadi',
};

export const FINAL_FORM_FAMILY_LABEL_KEY: Readonly<Record<FinalFormFamily, string>> = {
  kaf: 'letters.pronunciation.kaf',
  mem: 'letters.pronunciation.mem',
  nun: 'letters.pronunciation.nun',
  pe: 'letters.pronunciation.pe',
  tsadi: 'letters.pronunciation.tsadi',
};

export const FINAL_FORM_FAMILIES: readonly FinalFormFamily[] = ['kaf', 'mem', 'nun', 'pe', 'tsadi'];

export const WORD_DEFINITIONS: Readonly<Record<WordId, WordDefinition>> = {
  dag: {
    id: 'dag',
    wordKey: 'words.pronunciation.dag',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.dag.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.dag.part2',
  },
  sal: {
    id: 'sal',
    wordKey: 'words.pronunciation.sal',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.sal.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.sal.part2',
  },
  gam: {
    id: 'gam',
    wordKey: 'words.pronunciation.gam',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.gam.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.gam.part2',
  },
  kad: {
    id: 'kad',
    wordKey: 'words.pronunciation.kad',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.kad.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.kad.part2',
  },
  gal: {
    id: 'gal',
    wordKey: 'words.pronunciation.gal',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.gal.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.gal.part2',
  },
  hag: {
    id: 'hag',
    wordKey: 'words.pronunciation.hag',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.hag.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.hag.part2',
  },
  delet: {
    id: 'delet',
    wordKey: 'words.pronunciation.delet',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.delet.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.delet.part2',
  },
  gesher: {
    id: 'gesher',
    wordKey: 'words.pronunciation.gesher',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.gesher.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.gesher.part2',
  },
  kadur: {
    id: 'kadur',
    wordKey: 'words.pronunciation.kadur',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.kadur.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.kadur.part2',
  },
  kotev: {
    id: 'kotev',
    wordKey: 'words.pronunciation.kotev',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.kotev.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.kotev.part2',
  },
  kore: {
    id: 'kore',
    wordKey: 'words.pronunciation.kore',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.kore.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.kore.part2',
  },
  mafteah: {
    id: 'mafteah',
    wordKey: 'words.pronunciation.mafteah',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.mafteah.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.mafteah.part2',
  },
  mikhtav: {
    id: 'mikhtav',
    wordKey: 'words.pronunciation.mikhtav',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.mikhtav.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.mikhtav.part2',
  },
  shomer: {
    id: 'shomer',
    wordKey: 'words.pronunciation.shomer',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.shomer.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.shomer.part2',
  },
  malakh: {
    id: 'malakh',
    wordKey: 'words.pronunciation.malakh',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.malakh.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.malakh.part2',
  },
  arukh: {
    id: 'arukh',
    wordKey: 'words.pronunciation.arukh',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.arukh.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.arukh.part2',
  },
  shalom: {
    id: 'shalom',
    wordKey: 'words.pronunciation.shalom',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.shalom.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.shalom.part2',
  },
  halom: {
    id: 'halom',
    wordKey: 'words.pronunciation.halom',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.halom.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.halom.part2',
  },
  balon: {
    id: 'balon',
    wordKey: 'words.pronunciation.balon',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.balon.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.balon.part2',
  },
  sakin: {
    id: 'sakin',
    wordKey: 'words.pronunciation.sakin',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.sakin.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.sakin.part2',
  },
  atuf: {
    id: 'atuf',
    wordKey: 'words.pronunciation.atuf',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.atuf.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.atuf.part2',
  },
  tsafuf: {
    id: 'tsafuf',
    wordKey: 'words.pronunciation.tsafuf',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.tsafuf.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.tsafuf.part2',
  },
  rahuts: {
    id: 'rahuts',
    wordKey: 'words.pronunciation.rahuts',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.rahuts.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.rahuts.part2',
  },
  kafuts: {
    id: 'kafuts',
    wordKey: 'words.pronunciation.kafuts',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.kafuts.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.kafuts.part2',
  },
  sipur: {
    id: 'sipur',
    wordKey: 'words.pronunciation.sipur',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.sipur.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.sipur.part2',
  },
  shulhan: {
    id: 'shulhan',
    wordKey: 'words.pronunciation.shulhan',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.shulhan.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.shulhan.part2',
  },
  arnava: {
    id: 'arnava',
    wordKey: 'words.pronunciation.arnava',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.arnava.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.arnava.part2',
  },
  madrekha: {
    id: 'madrekha',
    wordKey: 'words.pronunciation.madrekha',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.madrekha.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.madrekha.part2',
  },
  hanukha: {
    id: 'hanukha',
    wordKey: 'words.pronunciation.hanukha',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.hanukha.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.hanukha.part2',
  },
  yeladim: {
    id: 'yeladim',
    wordKey: 'words.pronunciation.yeladim',
    segmentedPart1Key: 'games.spellAndSendPostOffice.segmentedWords.yeladim.part1',
    segmentedPart2Key: 'games.spellAndSendPostOffice.segmentedWords.yeladim.part2',
  },
};

export const L1_WORD_IDS: readonly WordId[] = ['dag', 'sal', 'gam', 'kad', 'gal', 'hag'];

export const L2A_WORD_IDS: readonly WordId[] = [
  'delet',
  'gesher',
  'kadur',
  'kotev',
  'kore',
  'mafteah',
  'mikhtav',
  'shomer',
  'sipur',
  'shulhan',
];

export const L2B_FAMILY_WORD_IDS: Readonly<Record<FinalFormFamily, readonly WordId[]>> = {
  kaf: ['malakh', 'arukh'],
  mem: ['shalom', 'halom'],
  nun: ['balon', 'sakin'],
  pe: ['atuf', 'tsafuf'],
  tsadi: ['rahuts', 'kafuts'],
};

export const L2B_FILLER_WORD_IDS: readonly WordId[] = ['kadur', 'kotev', 'kore', 'mikhtav', 'shomer', 'sipur'];

export const L3A_WORD_IDS: readonly WordId[] = ['arnava', 'madrekha', 'hanukha', 'yeladim'];

export const L3B_TARGET_WORD_IDS: readonly WordId[] = ['arnava', 'madrekha', 'hanukha', 'yeladim', 'mikhtav'];

export const L3B_CONTEXT_WORD_IDS: readonly WordId[] = ['shalom', 'kadur', 'delet', 'sipur', 'kore'];

export function stripNikud(value: string): string {
  return value.replace(NIKUD_MARKS_PATTERN, '');
}

export function toLetterTilesFromWord(word: string): string[] {
  const stripped = stripNikud(word).trim();
  return Array.from(stripped);
}

export function resolveFinalFormFamily(letter: string): FinalFormFamily | null {
  return FINAL_FORM_CHAR_TO_FAMILY[letter] ?? null;
}

export function nextStage(stage: SpellStage): SpellStage | null {
  const index = STAGE_ORDER.indexOf(stage);
  if (index < 0 || index >= STAGE_ORDER.length - 1) {
    return null;
  }
  return STAGE_ORDER[index + 1];
}

export function previousStage(stage: SpellStage): SpellStage {
  const index = STAGE_ORDER.indexOf(stage);
  if (index <= 0) {
    return STAGE_ORDER[0];
  }
  return STAGE_ORDER[index - 1];
}

export function toStableRange(firstAttemptSuccessRate: number): StableRange {
  if (firstAttemptSuccessRate >= 85) return '1-10';
  if (firstAttemptSuccessRate >= 65) return '1-5';
  return '1-3';
}

export function toHintTrend(rounds: readonly RoundTelemetry[]): HintTrend {
  if (rounds.length < 2) {
    return 'steady';
  }

  const midpoint = Math.ceil(rounds.length / 2);
  const firstHalfHints = rounds.slice(0, midpoint).reduce((sum, round) => sum + round.hintsUsed, 0);
  const secondHalfHints = rounds.slice(midpoint).reduce((sum, round) => sum + round.hintsUsed, 0);

  if (secondHalfHints < firstHalfHints) {
    return 'improving';
  }
  if (secondHalfHints > firstHalfHints) {
    return 'needs_support';
  }
  return 'steady';
}

export function toStars(firstAttemptSuccessRate: number): number {
  if (firstAttemptSuccessRate >= 90) return 3;
  if (firstAttemptSuccessRate >= 70) return 2;
  return 1;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function percentFrom(successes: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return clampPercent((successes / total) * 100);
}

export function evaluateStageBlock(stage: SpellStage, rounds: readonly RoundTelemetry[]): StageEvaluation {
  const totalRounds = rounds.length;
  const firstTryWordCount = rounds.filter((round) => round.roundFirstTryCorrect).length;
  const totalFirstTrySlots = rounds.reduce((sum, round) => sum + round.firstTryCorrectSlots, 0);
  const totalSlots = rounds.reduce((sum, round) => sum + round.totalSlots, 0);
  const firstSlotFirstTryCount = rounds.filter((round) => round.firstSlotFirstTry).length;
  const independentCount = rounds.filter((round) => round.independentCompletion).length;
  const finalFormRounds = rounds.filter((round) => round.finalFormTarget);
  const finalFormCorrectCount = finalFormRounds.filter((round) => round.finalFormCorrect).length;
  const stage2PlusHints = rounds.reduce((sum, round) => sum + round.stage2PlusHints, 0);
  const stage3Hints = rounds.reduce((sum, round) => sum + round.stage3Hints, 0);

  const firstTryWordRate = percentFrom(firstTryWordCount, totalRounds);
  const firstTrySlotRate = percentFrom(totalFirstTrySlots, totalSlots);
  const firstSlotIndependentRate = percentFrom(firstSlotFirstTryCount, totalRounds);
  const independentRate = percentFrom(independentCount, totalRounds);
  const finalFormAccuracy = percentFrom(finalFormCorrectCount, finalFormRounds.length);

  let passed = false;

  if (stage === 'L1') {
    passed = totalRounds >= STAGE_TARGET_ROUNDS.L1 && totalRounds >= 8 && stage2PlusHints <= 2;
  } else if (stage === 'L2A') {
    passed =
      totalRounds >= STAGE_TARGET_ROUNDS.L2A &&
      firstTryWordCount >= 7 &&
      firstSlotIndependentRate >= 70;
  } else if (stage === 'L2B') {
    passed =
      totalRounds >= STAGE_TARGET_ROUNDS.L2B &&
      firstTryWordCount >= 16 &&
      finalFormRounds.length > 0 &&
      finalFormAccuracy >= 75;
  } else if (stage === 'L3A') {
    passed = totalRounds >= STAGE_TARGET_ROUNDS.L3A && firstTryWordCount >= 4 && stage2PlusHints <= 1;
  } else {
    passed = totalRounds >= STAGE_TARGET_ROUNDS.L3B && firstTryWordCount >= 12 && stage3Hints <= 1;
  }

  return {
    stage,
    passed,
    passType: passed ? 'independent-pass' : 'supported-pass',
    firstTryWordRate,
    firstTrySlotRate,
    firstSlotIndependentRate,
    independentRate,
    finalFormAccuracy,
    stage2PlusHints,
    stage3Hints,
    weakBlock: independentRate < 60,
  };
}

export function evaluateAntiGuessTier(snapshot: AntiGuessSnapshot): AntiGuessTier | null {
  const { nowMs, wrongPlacementTimes, missTimes } = snapshot;

  const wrongIn2Sec = wrongPlacementTimes.filter((stamp) => nowMs - stamp <= 2000).length;
  const wrongIn3Sec = wrongPlacementTimes.filter((stamp) => nowMs - stamp <= 3000).length;
  const missesIn20Sec = missTimes.filter((stamp) => nowMs - stamp <= 20_000).length;

  if (wrongIn3Sec >= 6 || missesIn20Sec >= 3) {
    return 2;
  }

  if (wrongIn2Sec >= 4) {
    return 1;
  }

  return null;
}

export function resolveBaseDecoyCount(stage: SpellStage): number {
  if (stage === 'L1') return 1;
  if (stage === 'L2A') return 2;
  if (stage === 'L2B') return 2;
  if (stage === 'L3A') return 3;
  return 3;
}

export function resolveDecoyCount(baseDecoyCount: number, reduceOneDecoy: boolean): number {
  const adjusted = reduceOneDecoy ? baseDecoyCount - 1 : baseDecoyCount;
  return Math.max(1, adjusted);
}

export function buildL2BBlock(
  family: FinalFormFamily,
  pointers: L2BBlockPointers,
): L2BBlockRound[] {
  const blockSize = 8;
  const targetPositions = new Set([3, 6]);
  const targetPool = L2B_FAMILY_WORD_IDS[family];
  const rounds: L2BBlockRound[] = [];

  for (let index = 0; index < blockSize; index += 1) {
    if (targetPositions.has(index)) {
      const wordId = targetPool[pointers.target % targetPool.length];
      pointers.target += 1;
      rounds.push({ wordId, finalFormTarget: true, finalFormFamily: family });
      continue;
    }

    const filler = L2B_FILLER_WORD_IDS[pointers.filler % L2B_FILLER_WORD_IDS.length];
    pointers.filler += 1;
    rounds.push({ wordId: filler, finalFormTarget: false, finalFormFamily: family });
  }

  return rounds;
}
