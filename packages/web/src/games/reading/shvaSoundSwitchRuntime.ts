import type { HintTrend, StableRange } from '@/games/engine';

export type ShvaStage = 'L1' | 'L2' | 'L3';
export type ShvaCluster = 'audiblePrefix' | 'silentContrast' | 'mixedTransfer';

export interface ShvaRoundTemplate {
  id: string;
  stage: ShvaStage;
  cluster: ShvaCluster;
  promptMode: 'listenChoose' | 'transferRead';
  targetAudioKey: string;
  targetDisplayKey: string;
  choices: readonly string[];
  correctChoiceKey: string;
  blendWordKey: string;
  segmentedHintKey: string;
  fullWordDecode: boolean;
  minimalContrast: boolean;
  scaffold?: boolean;
}

export interface ShvaRoundTelemetry {
  stage: ShvaStage;
  cluster: ShvaCluster;
  firstTryCorrect: boolean;
  chooseFirstTryCorrect: boolean;
  blendFirstTryCorrect: boolean;
  hintsUsed: number;
  independent: boolean;
  randomIntervention: boolean;
  fullWordDecode: boolean;
  minimalContrast: boolean;
  latencyMs: number;
}

export interface StageGateStats {
  firstTryAccuracy: number;
  chooseAccuracy: number;
  blendAccuracy: number;
  hintUsage: number;
  randomInterventions: number;
}

const NIKUD_MARKS_PATTERN = /[\u0591-\u05C7]/g;

export const STAGE_ORDER: readonly ShvaStage[] = ['L1', 'L2', 'L3'];

export const STAGE_TARGET_ROUNDS: Readonly<Record<ShvaStage, number>> = {
  L1: 10,
  L2: 12,
  L3: 12,
};

export const L1_ROUNDS: readonly ShvaRoundTemplate[] = [
  {
    id: 'l1-be',
    stage: 'L1',
    cluster: 'audiblePrefix',
    promptMode: 'listenChoose',
    targetAudioKey: 'syllables.shva.be',
    targetDisplayKey: 'syllables.shva.be',
    choices: ['syllables.shva.be', 'syllables.shva.beContrast'],
    correctChoiceKey: 'syllables.shva.be',
    blendWordKey: 'words.pronunciation.dvar',
    segmentedHintKey: 'syllables.shva.be',
    fullWordDecode: false,
    minimalContrast: false,
  },
  {
    id: 'l1-le',
    stage: 'L1',
    cluster: 'audiblePrefix',
    promptMode: 'listenChoose',
    targetAudioKey: 'syllables.shva.le',
    targetDisplayKey: 'syllables.shva.le',
    choices: ['syllables.shva.le', 'syllables.shva.leContrast'],
    correctChoiceKey: 'syllables.shva.le',
    blendWordKey: 'words.pronunciation.shvil',
    segmentedHintKey: 'syllables.shva.le',
    fullWordDecode: false,
    minimalContrast: false,
  },
  {
    id: 'l1-me',
    stage: 'L1',
    cluster: 'audiblePrefix',
    promptMode: 'listenChoose',
    targetAudioKey: 'syllables.shva.me',
    targetDisplayKey: 'syllables.shva.me',
    choices: ['syllables.shva.me', 'syllables.shva.meContrast'],
    correctChoiceKey: 'syllables.shva.me',
    blendWordKey: 'words.pronunciation.zman',
    segmentedHintKey: 'syllables.shva.me',
    fullWordDecode: false,
    minimalContrast: false,
  },
  {
    id: 'l1-cluster-dva',
    stage: 'L1',
    cluster: 'silentContrast',
    promptMode: 'listenChoose',
    targetAudioKey: 'syllables.shva.clusterDva',
    targetDisplayKey: 'syllables.shva.clusterDva',
    choices: ['syllables.shva.clusterDva', 'syllables.shva.clusterZma'],
    correctChoiceKey: 'syllables.shva.clusterDva',
    blendWordKey: 'words.pronunciation.dvar',
    segmentedHintKey: 'syllables.shva.clusterDva',
    fullWordDecode: false,
    minimalContrast: true,
  },
  {
    id: 'l1-cluster-zma',
    stage: 'L1',
    cluster: 'silentContrast',
    promptMode: 'listenChoose',
    targetAudioKey: 'syllables.shva.clusterZma',
    targetDisplayKey: 'syllables.shva.clusterZma',
    choices: ['syllables.shva.clusterZma', 'syllables.shva.clusterShvi'],
    correctChoiceKey: 'syllables.shva.clusterZma',
    blendWordKey: 'words.pronunciation.zman',
    segmentedHintKey: 'syllables.shva.clusterZma',
    fullWordDecode: false,
    minimalContrast: false,
  },
  {
    id: 'l1-cluster-shvi',
    stage: 'L1',
    cluster: 'silentContrast',
    promptMode: 'listenChoose',
    targetAudioKey: 'syllables.shva.clusterShvi',
    targetDisplayKey: 'syllables.shva.clusterShvi',
    choices: ['syllables.shva.clusterShvi', 'syllables.shva.clusterDva'],
    correctChoiceKey: 'syllables.shva.clusterShvi',
    blendWordKey: 'words.pronunciation.shvil',
    segmentedHintKey: 'syllables.shva.clusterShvi',
    fullWordDecode: false,
    minimalContrast: false,
  },
];

export const L2_ROUNDS: readonly ShvaRoundTemplate[] = [
  {
    id: 'l2-dvar-near',
    stage: 'L2',
    cluster: 'silentContrast',
    promptMode: 'listenChoose',
    targetAudioKey: 'words.pronunciation.dvar',
    targetDisplayKey: 'words.pronunciation.dvar',
    choices: ['words.pronunciation.dvar', 'words.pronunciation.davar'],
    correctChoiceKey: 'words.pronunciation.dvar',
    blendWordKey: 'words.pronunciation.dvar',
    segmentedHintKey: 'syllables.shva.clusterDva',
    fullWordDecode: true,
    minimalContrast: true,
  },
  {
    id: 'l2-davar-near',
    stage: 'L2',
    cluster: 'silentContrast',
    promptMode: 'listenChoose',
    targetAudioKey: 'words.pronunciation.davar',
    targetDisplayKey: 'words.pronunciation.davar',
    choices: ['words.pronunciation.davar', 'words.pronunciation.dvar'],
    correctChoiceKey: 'words.pronunciation.davar',
    blendWordKey: 'words.pronunciation.davar',
    segmentedHintKey: 'syllables.shva.clusterDva',
    fullWordDecode: true,
    minimalContrast: true,
  },
  {
    id: 'l2-zman',
    stage: 'L2',
    cluster: 'mixedTransfer',
    promptMode: 'listenChoose',
    targetAudioKey: 'words.pronunciation.zman',
    targetDisplayKey: 'words.pronunciation.zman',
    choices: ['words.pronunciation.zman', 'words.pronunciation.shvil', 'words.pronunciation.davar'],
    correctChoiceKey: 'words.pronunciation.zman',
    blendWordKey: 'words.pronunciation.zman',
    segmentedHintKey: 'syllables.shva.clusterZma',
    fullWordDecode: true,
    minimalContrast: false,
  },
  {
    id: 'l2-shvil',
    stage: 'L2',
    cluster: 'mixedTransfer',
    promptMode: 'listenChoose',
    targetAudioKey: 'words.pronunciation.shvil',
    targetDisplayKey: 'words.pronunciation.shvil',
    choices: ['words.pronunciation.shvil', 'words.pronunciation.zman', 'words.pronunciation.dvar'],
    correctChoiceKey: 'words.pronunciation.shvil',
    blendWordKey: 'words.pronunciation.shvil',
    segmentedHintKey: 'syllables.shva.clusterShvi',
    fullWordDecode: true,
    minimalContrast: false,
  },
];

export const L3_ROUNDS: readonly ShvaRoundTemplate[] = [
  {
    id: 'l3-word-dvar',
    stage: 'L3',
    cluster: 'mixedTransfer',
    promptMode: 'transferRead',
    targetAudioKey: 'words.pronunciation.dvar',
    targetDisplayKey: 'words.pronunciation.dvar',
    choices: ['words.pronunciation.dvar', 'words.pronunciation.davar', 'words.pronunciation.zman'],
    correctChoiceKey: 'words.pronunciation.dvar',
    blendWordKey: 'words.pronunciation.dvar',
    segmentedHintKey: 'syllables.shva.clusterDva',
    fullWordDecode: true,
    minimalContrast: true,
  },
  {
    id: 'l3-word-zman',
    stage: 'L3',
    cluster: 'mixedTransfer',
    promptMode: 'transferRead',
    targetAudioKey: 'words.pronunciation.zman',
    targetDisplayKey: 'words.pronunciation.zman',
    choices: ['words.pronunciation.zman', 'words.pronunciation.shvil', 'words.pronunciation.davar'],
    correctChoiceKey: 'words.pronunciation.zman',
    blendWordKey: 'words.pronunciation.zman',
    segmentedHintKey: 'syllables.shva.clusterZma',
    fullWordDecode: true,
    minimalContrast: false,
  },
  {
    id: 'l3-phrase-zman',
    stage: 'L3',
    cluster: 'mixedTransfer',
    promptMode: 'transferRead',
    targetAudioKey: 'phrases.pointed.yeshZmanLikriya',
    targetDisplayKey: 'phrases.pointed.yeshZmanLikriya',
    choices: [
      'phrases.pointed.yeshZmanLikriya',
      'phrases.pointed.dubiHolekhBashvil',
      'phrases.pointed.haDeletSgura',
    ],
    correctChoiceKey: 'phrases.pointed.yeshZmanLikriya',
    blendWordKey: 'words.pronunciation.zman',
    segmentedHintKey: 'syllables.shva.clusterZma',
    fullWordDecode: false,
    minimalContrast: false,
  },
  {
    id: 'l3-word-shvil',
    stage: 'L3',
    cluster: 'mixedTransfer',
    promptMode: 'transferRead',
    targetAudioKey: 'words.pronunciation.shvil',
    targetDisplayKey: 'words.pronunciation.shvil',
    choices: ['words.pronunciation.shvil', 'words.pronunciation.zman', 'words.pronunciation.dvar'],
    correctChoiceKey: 'words.pronunciation.shvil',
    blendWordKey: 'words.pronunciation.shvil',
    segmentedHintKey: 'syllables.shva.clusterShvi',
    fullWordDecode: true,
    minimalContrast: false,
  },
  {
    id: 'l3-phrase-dvar',
    stage: 'L3',
    cluster: 'mixedTransfer',
    promptMode: 'transferRead',
    targetAudioKey: 'phrases.pointed.dubiRoehDvarKatan',
    targetDisplayKey: 'phrases.pointed.dubiRoehDvarKatan',
    choices: [
      'phrases.pointed.dubiRoehDvarKatan',
      'phrases.pointed.haDeletSgura',
      'phrases.pointed.yeshZmanLikriya',
    ],
    correctChoiceKey: 'phrases.pointed.dubiRoehDvarKatan',
    blendWordKey: 'words.pronunciation.dvar',
    segmentedHintKey: 'syllables.shva.clusterDva',
    fullWordDecode: false,
    minimalContrast: false,
  },
  {
    id: 'l3-word-davar',
    stage: 'L3',
    cluster: 'silentContrast',
    promptMode: 'transferRead',
    targetAudioKey: 'words.pronunciation.davar',
    targetDisplayKey: 'words.pronunciation.davar',
    choices: ['words.pronunciation.davar', 'words.pronunciation.dvar', 'words.pronunciation.shvil'],
    correctChoiceKey: 'words.pronunciation.davar',
    blendWordKey: 'words.pronunciation.davar',
    segmentedHintKey: 'syllables.shva.clusterDva',
    fullWordDecode: true,
    minimalContrast: true,
  },
];

export const RECOVERY_ROUND: ShvaRoundTemplate = {
  id: 'recovery-dvar',
  stage: 'L2',
  cluster: 'silentContrast',
  promptMode: 'listenChoose',
  targetAudioKey: 'words.pronunciation.dvar',
  targetDisplayKey: 'words.pronunciation.dvar',
  choices: ['words.pronunciation.dvar', 'words.pronunciation.davar'],
  correctChoiceKey: 'words.pronunciation.dvar',
  blendWordKey: 'words.pronunciation.dvar',
  segmentedHintKey: 'syllables.shva.clusterDva',
  fullWordDecode: true,
  minimalContrast: true,
  scaffold: true,
};

export const SCANNED_WORD_KEYS: readonly string[] = [
  'words.pronunciation.dvar',
  'words.pronunciation.davar',
  'words.pronunciation.zman',
  'words.pronunciation.shvil',
];

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function stripNikud(value: string): string {
  return value.replace(NIKUD_MARKS_PATTERN, '');
}

export function toLetterTilesFromWord(word: string): string[] {
  return Array.from(stripNikud(word).trim());
}

export function nextStage(stage: ShvaStage): ShvaStage | null {
  const index = STAGE_ORDER.indexOf(stage);
  if (index < 0 || index >= STAGE_ORDER.length - 1) {
    return null;
  }
  return STAGE_ORDER[index + 1];
}

export function previousStage(stage: ShvaStage): ShvaStage {
  const index = STAGE_ORDER.indexOf(stage);
  if (index <= 0) {
    return STAGE_ORDER[0];
  }
  return STAGE_ORDER[index - 1];
}

export function toPercent(successes: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((successes / total) * 100)));
}

export function toStableRange(firstAttemptSuccessRate: number): StableRange {
  if (firstAttemptSuccessRate >= 85) return '1-10';
  if (firstAttemptSuccessRate >= 65) return '1-5';
  return '1-3';
}

export function toHintTrend(rounds: readonly ShvaRoundTelemetry[]): HintTrend {
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

export function takeLast<T>(items: readonly T[], count: number): T[] {
  if (count <= 0) {
    return [];
  }
  if (items.length <= count) {
    return [...items];
  }
  return items.slice(items.length - count);
}

export function evaluateStageGate(rounds: readonly ShvaRoundTelemetry[]): StageGateStats {
  const firstTryCorrect = rounds.filter((round) => round.firstTryCorrect).length;
  const chooseCorrect = rounds.filter((round) => round.chooseFirstTryCorrect).length;
  const blendCorrect = rounds.filter((round) => round.blendFirstTryCorrect).length;
  const hintsUsed = rounds.reduce((sum, round) => sum + round.hintsUsed, 0);
  const randomInterventions = rounds.filter((round) => round.randomIntervention).length;

  return {
    firstTryAccuracy: toPercent(firstTryCorrect, rounds.length),
    chooseAccuracy: toPercent(chooseCorrect, rounds.length),
    blendAccuracy: toPercent(blendCorrect, rounds.length),
    hintUsage: hintsUsed,
    randomInterventions,
  };
}

export function buildRoundPool(stage: ShvaStage): readonly ShvaRoundTemplate[] {
  if (stage === 'L1') {
    return L1_ROUNDS;
  }
  if (stage === 'L2') {
    return L2_ROUNDS;
  }
  return L3_ROUNDS;
}

export function buildChoiceSet(
  template: ShvaRoundTemplate,
  maxOptions: number,
  forceTwoChoice: boolean,
): string[] {
  const limit = forceTwoChoice ? 2 : maxOptions;
  const target = template.correctChoiceKey;
  const foils = template.choices.filter((key) => key !== target);
  const selectedFoils = shuffle(foils).slice(0, Math.max(1, limit - 1));
  return shuffle([target, ...selectedFoils]);
}
