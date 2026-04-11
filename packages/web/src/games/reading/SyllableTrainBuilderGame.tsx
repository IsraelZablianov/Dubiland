import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import type { GameCompletionResult, GameProps, HintTrend, StableRange } from '@/games/engine';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { isRtlDirection, rtlNextGlyph, rtlReplayGlyph } from '@/lib/rtlChrome';

type Stage = 'cv' | 'cvc' | 'transfer';
type Tone = 'neutral' | 'success' | 'hint' | 'error';
type TileKind = 'consonant' | 'nikud';
type ConsonantId = 'alef' | 'bet' | 'gimel' | 'dalet' | 'resh' | 'zayin' | 'finalNun' | 'mem';
type NikudId = 'patah' | 'qamats' | 'segol' | 'hirik' | 'holam';
type TileId = ConsonantId | NikudId;

type SyllableKey =
  | 'syllables.pronunciation.baPatah'
  | 'syllables.pronunciation.gaQamats'
  | 'syllables.pronunciation.beSegol'
  | 'syllables.pronunciation.biHirik'
  | 'syllables.pronunciation.boHolam'
  | 'syllables.pronunciation.gaPatah'
  | 'syllables.pronunciation.daQamats'
  | 'syllables.pronunciation.oHolam';

type WordKey =
  | 'words.pronunciation.gan'
  | 'words.pronunciation.dag'
  | 'words.pronunciation.or'
  | 'words.pronunciation.gam'
  | 'words.pronunciation.dan'
  | 'words.pronunciation.oz';

interface TileDefinition {
  id: TileId;
  kind: TileKind;
  labelKey: string;
  symbolKey: string;
  audioKey: string;
}

interface BuildRoundDefinition {
  id: string;
  stage: 'cv' | 'cvc';
  slots: readonly TileId[];
  bank: readonly TileId[];
  segmentedKey: SyllableKey;
  blendedKey: SyllableKey | WordKey;
  nikudPattern: NikudId;
  closingConsonant?: ConsonantId;
  nearMissPairKey?:
    | 'games.syllableTrainBuilder.progression.itemBank.nearMissPairs.ganVsGam'
    | 'games.syllableTrainBuilder.progression.itemBank.nearMissPairs.dagVsDan'
    | 'games.syllableTrainBuilder.progression.itemBank.nearMissPairs.orVsOz';
  nearMissTile?: TileId;
}

interface TransferRoundDefinition {
  id: string;
  stage: 'transfer';
  slots: readonly TileId[];
  bank: readonly TileId[];
  segmentedKey: SyllableKey;
  blendedKey: WordKey;
  options: readonly WordKey[];
  correctWord: WordKey;
  nikudPattern: NikudId;
  closingConsonant: ConsonantId;
  finalFormTarget: boolean;
}

type RoundDefinition = BuildRoundDefinition | TransferRoundDefinition;

interface ScoredRound {
  stage: Stage;
  firstTryCorrect: boolean;
  hintsUsed: number;
  nikudPattern: NikudId;
  closingConsonant: ConsonantId | null;
  nearMissRound: boolean;
  nearMissFirstTrySuccess: boolean;
}

interface GateAConfig {
  minItems: number;
  firstTryAccuracyPct: number;
  minNikudPatterns: number;
  maxHintsInLastWindow: number;
  hintWindow: number;
}

interface GateBConfig {
  minItems: number;
  firstTryAccuracyPct: number;
  nearMissAccuracyPct: number;
  minClosingConsonants: number;
}

interface RegressionConfig {
  windowSize: number;
  firstTryFloorPct: number;
  scaffoldRounds: number;
}

interface CalmAssistConfig {
  wrongActions: number;
  windowMs: number;
  pauseMs: number;
}

interface RuntimeConfig {
  gateA: GateAConfig;
  gateB: GateBConfig;
  regression: RegressionConfig;
  calmAssist: CalmAssistConfig;
  transferRoundsTarget: number;
}

interface StagePointers {
  cv: number;
  cvc: number;
  transfer: number;
}

interface SyllableTrainBuilderCompletionResult extends GameCompletionResult {
  cvCoverage: number;
  cvcCoverage: number;
  distractorAccuracy: number;
}

const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  gateA: {
    minItems: 10,
    firstTryAccuracyPct: 85,
    minNikudPatterns: 4,
    maxHintsInLastWindow: 2,
    hintWindow: 6,
  },
  gateB: {
    minItems: 12,
    firstTryAccuracyPct: 80,
    nearMissAccuracyPct: 75,
    minClosingConsonants: 3,
  },
  regression: {
    windowSize: 6,
    firstTryFloorPct: 60,
    scaffoldRounds: 3,
  },
  calmAssist: {
    wrongActions: 3,
    windowMs: 4000,
    pauseMs: 800,
  },
  transferRoundsTarget: 5,
};

const TILE_DEFINITIONS: Record<TileId, TileDefinition> = {
  alef: {
    id: 'alef',
    kind: 'consonant',
    labelKey: 'letters.pronunciation.alef',
    symbolKey: 'letters.symbols.alef',
    audioKey: 'letters.pronunciation.alef',
  },
  bet: {
    id: 'bet',
    kind: 'consonant',
    labelKey: 'letters.pronunciation.bet',
    symbolKey: 'letters.symbols.bet',
    audioKey: 'letters.pronunciation.bet',
  },
  gimel: {
    id: 'gimel',
    kind: 'consonant',
    labelKey: 'letters.pronunciation.gimel',
    symbolKey: 'letters.symbols.gimel',
    audioKey: 'letters.pronunciation.gimel',
  },
  dalet: {
    id: 'dalet',
    kind: 'consonant',
    labelKey: 'letters.pronunciation.dalet',
    symbolKey: 'letters.symbols.dalet',
    audioKey: 'letters.pronunciation.dalet',
  },
  resh: {
    id: 'resh',
    kind: 'consonant',
    labelKey: 'letters.pronunciation.resh',
    symbolKey: 'letters.symbols.resh',
    audioKey: 'letters.pronunciation.resh',
  },
  zayin: {
    id: 'zayin',
    kind: 'consonant',
    labelKey: 'letters.pronunciation.zayin',
    symbolKey: 'letters.symbols.zayin',
    audioKey: 'letters.pronunciation.zayin',
  },
  finalNun: {
    id: 'finalNun',
    kind: 'consonant',
    labelKey: 'letters.pronunciation.nun',
    symbolKey: 'letters.symbols.finalNun',
    audioKey: 'letters.pronunciation.nun',
  },
  mem: {
    id: 'mem',
    kind: 'consonant',
    labelKey: 'letters.pronunciation.mem',
    symbolKey: 'letters.symbols.mem',
    audioKey: 'letters.pronunciation.mem',
  },
  patah: {
    id: 'patah',
    kind: 'nikud',
    labelKey: 'nikud.pronunciation.patah',
    symbolKey: 'nikud.pronunciation.patah',
    audioKey: 'nikud.pronunciation.patah',
  },
  qamats: {
    id: 'qamats',
    kind: 'nikud',
    labelKey: 'nikud.pronunciation.qamats',
    symbolKey: 'nikud.pronunciation.qamats',
    audioKey: 'nikud.pronunciation.qamats',
  },
  segol: {
    id: 'segol',
    kind: 'nikud',
    labelKey: 'nikud.pronunciation.segol',
    symbolKey: 'nikud.pronunciation.segol',
    audioKey: 'nikud.pronunciation.segol',
  },
  hirik: {
    id: 'hirik',
    kind: 'nikud',
    labelKey: 'nikud.pronunciation.hirik',
    symbolKey: 'nikud.pronunciation.hirik',
    audioKey: 'nikud.pronunciation.hirik',
  },
  holam: {
    id: 'holam',
    kind: 'nikud',
    labelKey: 'nikud.pronunciation.holam',
    symbolKey: 'nikud.pronunciation.holam',
    audioKey: 'nikud.pronunciation.holam',
  },
};

const CV_ROUNDS: readonly BuildRoundDefinition[] = [
  {
    id: 'cv-ba-patah',
    stage: 'cv',
    slots: ['bet', 'patah'],
    bank: ['bet', 'gimel', 'patah', 'qamats'],
    segmentedKey: 'syllables.pronunciation.baPatah',
    blendedKey: 'syllables.pronunciation.baPatah',
    nikudPattern: 'patah',
  },
  {
    id: 'cv-ga-qamats',
    stage: 'cv',
    slots: ['gimel', 'qamats'],
    bank: ['gimel', 'bet', 'qamats', 'segol'],
    segmentedKey: 'syllables.pronunciation.gaQamats',
    blendedKey: 'syllables.pronunciation.gaQamats',
    nikudPattern: 'qamats',
  },
  {
    id: 'cv-be-segol',
    stage: 'cv',
    slots: ['bet', 'segol'],
    bank: ['bet', 'dalet', 'segol', 'hirik'],
    segmentedKey: 'syllables.pronunciation.beSegol',
    blendedKey: 'syllables.pronunciation.beSegol',
    nikudPattern: 'segol',
  },
  {
    id: 'cv-bi-hirik',
    stage: 'cv',
    slots: ['bet', 'hirik'],
    bank: ['bet', 'gimel', 'hirik', 'holam'],
    segmentedKey: 'syllables.pronunciation.biHirik',
    blendedKey: 'syllables.pronunciation.biHirik',
    nikudPattern: 'hirik',
  },
  {
    id: 'cv-bo-holam',
    stage: 'cv',
    slots: ['bet', 'holam'],
    bank: ['bet', 'dalet', 'holam', 'qamats'],
    segmentedKey: 'syllables.pronunciation.boHolam',
    blendedKey: 'syllables.pronunciation.boHolam',
    nikudPattern: 'holam',
  },
];

const CVC_ROUNDS: readonly BuildRoundDefinition[] = [
  {
    id: 'cvc-gan',
    stage: 'cvc',
    slots: ['gimel', 'patah', 'finalNun'],
    bank: ['gimel', 'dalet', 'patah', 'qamats', 'finalNun', 'mem'],
    segmentedKey: 'syllables.pronunciation.gaPatah',
    blendedKey: 'words.pronunciation.gan',
    nikudPattern: 'patah',
    closingConsonant: 'finalNun',
    nearMissPairKey: 'games.syllableTrainBuilder.progression.itemBank.nearMissPairs.ganVsGam',
    nearMissTile: 'mem',
  },
  {
    id: 'cvc-dag',
    stage: 'cvc',
    slots: ['dalet', 'qamats', 'gimel'],
    bank: ['dalet', 'gimel', 'qamats', 'patah', 'gimel', 'finalNun'],
    segmentedKey: 'syllables.pronunciation.daQamats',
    blendedKey: 'words.pronunciation.dag',
    nikudPattern: 'qamats',
    closingConsonant: 'gimel',
    nearMissPairKey: 'games.syllableTrainBuilder.progression.itemBank.nearMissPairs.dagVsDan',
    nearMissTile: 'finalNun',
  },
  {
    id: 'cvc-or',
    stage: 'cvc',
    slots: ['alef', 'holam', 'resh'],
    bank: ['alef', 'gimel', 'holam', 'segol', 'resh', 'zayin'],
    segmentedKey: 'syllables.pronunciation.oHolam',
    blendedKey: 'words.pronunciation.or',
    nikudPattern: 'holam',
    closingConsonant: 'resh',
    nearMissPairKey: 'games.syllableTrainBuilder.progression.itemBank.nearMissPairs.orVsOz',
    nearMissTile: 'zayin',
  },
];

const TRANSFER_ROUNDS: readonly TransferRoundDefinition[] = [
  {
    id: 'transfer-gan',
    stage: 'transfer',
    slots: ['gimel', 'patah', 'finalNun'],
    bank: ['gimel', 'dalet', 'patah', 'qamats', 'finalNun', 'mem'],
    segmentedKey: 'syllables.pronunciation.gaPatah',
    blendedKey: 'words.pronunciation.gan',
    options: ['words.pronunciation.gan', 'words.pronunciation.gam', 'words.pronunciation.dan'],
    correctWord: 'words.pronunciation.gan',
    nikudPattern: 'patah',
    closingConsonant: 'finalNun',
    finalFormTarget: true,
  },
  {
    id: 'transfer-dag',
    stage: 'transfer',
    slots: ['dalet', 'qamats', 'gimel'],
    bank: ['dalet', 'gimel', 'qamats', 'patah', 'gimel', 'finalNun'],
    segmentedKey: 'syllables.pronunciation.daQamats',
    blendedKey: 'words.pronunciation.dag',
    options: ['words.pronunciation.dag', 'words.pronunciation.dan', 'words.pronunciation.gan'],
    correctWord: 'words.pronunciation.dag',
    nikudPattern: 'qamats',
    closingConsonant: 'gimel',
    finalFormTarget: false,
  },
  {
    id: 'transfer-or',
    stage: 'transfer',
    slots: ['alef', 'holam', 'resh'],
    bank: ['alef', 'gimel', 'holam', 'segol', 'resh', 'zayin'],
    segmentedKey: 'syllables.pronunciation.oHolam',
    blendedKey: 'words.pronunciation.or',
    options: ['words.pronunciation.or', 'words.pronunciation.oz', 'words.pronunciation.dag'],
    correctWord: 'words.pronunciation.or',
    nikudPattern: 'holam',
    closingConsonant: 'resh',
    finalFormTarget: false,
  },
  {
    id: 'transfer-gam',
    stage: 'transfer',
    slots: ['gimel', 'patah', 'mem'],
    bank: ['gimel', 'bet', 'patah', 'qamats', 'mem', 'finalNun'],
    segmentedKey: 'syllables.pronunciation.gaPatah',
    blendedKey: 'words.pronunciation.gam',
    options: ['words.pronunciation.gam', 'words.pronunciation.gan', 'words.pronunciation.dan'],
    correctWord: 'words.pronunciation.gam',
    nikudPattern: 'patah',
    closingConsonant: 'mem',
    finalFormTarget: false,
  },
  {
    id: 'transfer-dan',
    stage: 'transfer',
    slots: ['dalet', 'qamats', 'finalNun'],
    bank: ['dalet', 'gimel', 'qamats', 'patah', 'finalNun', 'gimel'],
    segmentedKey: 'syllables.pronunciation.daQamats',
    blendedKey: 'words.pronunciation.dan',
    options: ['words.pronunciation.dan', 'words.pronunciation.dag', 'words.pronunciation.gan'],
    correctWord: 'words.pronunciation.dan',
    nikudPattern: 'qamats',
    closingConsonant: 'finalNun',
    finalFormTarget: true,
  },
];

const SUCCESS_ROTATION: readonly string[] = [
  'games.syllableTrainBuilder.feedback.success.strategyPraise',
  'games.syllableTrainBuilder.feedback.success.blendedCorrect',
  'games.syllableTrainBuilder.feedback.success.nextStation',
];

const visuallyHiddenStyle: CSSProperties = {
  position: 'absolute',
  inlineSize: '1px',
  blockSize: '1px',
  margin: '-1px',
  border: 0,
  padding: 0,
  clip: 'rect(0 0 0 0)',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function percentFrom(successes: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return clampPercent((successes / total) * 100);
}

function toStableRange(firstAttemptSuccessRate: number): StableRange {
  if (firstAttemptSuccessRate >= 85) return '1-10';
  if (firstAttemptSuccessRate >= 65) return '1-5';
  return '1-3';
}

function toHintTrend(rounds: readonly ScoredRound[]): HintTrend {
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

function toStars(firstAttemptSuccessRate: number): number {
  if (firstAttemptSuccessRate >= 90) return 3;
  if (firstAttemptSuccessRate >= 70) return 2;
  return 1;
}

function toPositiveNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return fallback;
}

function toStageBefore(stage: Stage): Stage {
  if (stage === 'transfer') {
    return 'cvc';
  }
  if (stage === 'cvc') {
    return 'cv';
  }
  return 'cv';
}

function keyToAudioPath(key: string): string {
  return resolveAudioPathFromKey(key, 'common');
}

function cloneRound(round: RoundDefinition): RoundDefinition {
  if (round.stage === 'transfer') {
    return {
      ...round,
      slots: [...round.slots],
      bank: [...round.bank],
      options: [...round.options],
    };
  }

  return {
    ...round,
    slots: [...round.slots],
    bank: [...round.bank],
  };
}

function buildRoundForStage(stage: Stage, pointers: StagePointers): RoundDefinition {
  if (stage === 'cv') {
    const index = pointers.cv % CV_ROUNDS.length;
    pointers.cv += 1;
    return cloneRound(CV_ROUNDS[index]);
  }

  if (stage === 'cvc') {
    const index = pointers.cvc % CVC_ROUNDS.length;
    pointers.cvc += 1;
    return cloneRound(CVC_ROUNDS[index]);
  }

  const index = pointers.transfer % TRANSFER_ROUNDS.length;
  pointers.transfer += 1;
  return cloneRound(TRANSFER_ROUNDS[index]);
}

function resolveRuntimeConfig(configJson: Record<string, unknown>): RuntimeConfig {
  const gateA = isRecord(configJson.cvGate) ? configJson.cvGate : {};
  const gateB = isRecord(configJson.cvcGate) ? configJson.cvcGate : {};
  const regression = isRecord(configJson.regression) ? configJson.regression : {};
  const calmAssist = isRecord(configJson.calmAssist) ? configJson.calmAssist : isRecord(configJson.antiRandomTapGuard) ? configJson.antiRandomTapGuard : {};

  return {
    gateA: {
      minItems: Math.round(toPositiveNumber(gateA.minItems, DEFAULT_RUNTIME_CONFIG.gateA.minItems)),
      firstTryAccuracyPct: toPositiveNumber(gateA.firstTryAccuracyPct, DEFAULT_RUNTIME_CONFIG.gateA.firstTryAccuracyPct),
      minNikudPatterns: Math.round(toPositiveNumber(gateA.minNikudPatterns, DEFAULT_RUNTIME_CONFIG.gateA.minNikudPatterns)),
      maxHintsInLastWindow: Math.round(toPositiveNumber(gateA.maxHintsInLastWindow, DEFAULT_RUNTIME_CONFIG.gateA.maxHintsInLastWindow)),
      hintWindow: Math.round(toPositiveNumber(gateA.hintWindow, DEFAULT_RUNTIME_CONFIG.gateA.hintWindow)),
    },
    gateB: {
      minItems: Math.round(toPositiveNumber(gateB.minItems, DEFAULT_RUNTIME_CONFIG.gateB.minItems)),
      firstTryAccuracyPct: toPositiveNumber(gateB.firstTryAccuracyPct, DEFAULT_RUNTIME_CONFIG.gateB.firstTryAccuracyPct),
      nearMissAccuracyPct: toPositiveNumber(gateB.nearMissAccuracyPct, DEFAULT_RUNTIME_CONFIG.gateB.nearMissAccuracyPct),
      minClosingConsonants: Math.round(toPositiveNumber(gateB.minClosingConsonants, DEFAULT_RUNTIME_CONFIG.gateB.minClosingConsonants)),
    },
    regression: {
      windowSize: Math.round(toPositiveNumber(regression.windowSize, DEFAULT_RUNTIME_CONFIG.regression.windowSize)),
      firstTryFloorPct: toPositiveNumber(regression.firstTryFloorPct, DEFAULT_RUNTIME_CONFIG.regression.firstTryFloorPct),
      scaffoldRounds: Math.round(toPositiveNumber(regression.scaffoldRounds, DEFAULT_RUNTIME_CONFIG.regression.scaffoldRounds)),
    },
    calmAssist: {
      wrongActions: Math.round(toPositiveNumber(calmAssist.wrongActions, DEFAULT_RUNTIME_CONFIG.calmAssist.wrongActions)),
      windowMs: Math.round(toPositiveNumber(calmAssist.windowMs, DEFAULT_RUNTIME_CONFIG.calmAssist.windowMs)),
      pauseMs: Math.round(toPositiveNumber(calmAssist.pauseMs, DEFAULT_RUNTIME_CONFIG.calmAssist.pauseMs)),
    },
    transferRoundsTarget: Math.round(
      toPositiveNumber(configJson.transferRoundsTarget, DEFAULT_RUNTIME_CONFIG.transferRoundsTarget),
    ),
  };
}

function evaluateGateA(rounds: readonly ScoredRound[], config: GateAConfig) {
  const cvRounds = rounds.filter((round) => round.stage === 'cv');
  const firstTryRate = percentFrom(cvRounds.filter((round) => round.firstTryCorrect).length, cvRounds.length);
  const nikudCoverage = new Set(cvRounds.map((round) => round.nikudPattern)).size;
  const recentHints = cvRounds.slice(-config.hintWindow).reduce((sum, round) => sum + round.hintsUsed, 0);

  const passed =
    cvRounds.length >= config.minItems &&
    firstTryRate >= config.firstTryAccuracyPct &&
    nikudCoverage >= config.minNikudPatterns &&
    recentHints <= config.maxHintsInLastWindow;

  return {
    passed,
    count: cvRounds.length,
    firstTryRate,
    nikudCoverage,
    recentHints,
  };
}

function evaluateGateB(rounds: readonly ScoredRound[], config: GateBConfig) {
  const cvcRounds = rounds.filter((round) => round.stage === 'cvc');
  const firstTryRate = percentFrom(cvcRounds.filter((round) => round.firstTryCorrect).length, cvcRounds.length);
  const nearMissRounds = cvcRounds.filter((round) => round.nearMissRound);
  const nearMissSuccess = percentFrom(
    nearMissRounds.filter((round) => round.nearMissFirstTrySuccess).length,
    nearMissRounds.length,
  );
  const closingCoverage = new Set(cvcRounds.map((round) => round.closingConsonant).filter(Boolean)).size;

  const passed =
    cvcRounds.length >= config.minItems &&
    firstTryRate >= config.firstTryAccuracyPct &&
    nearMissSuccess >= config.nearMissAccuracyPct &&
    closingCoverage >= config.minClosingConsonants;

  return {
    passed,
    count: cvcRounds.length,
    firstTryRate,
    nearMissSuccess,
    closingCoverage,
  };
}

function needsRegression(rounds: readonly ScoredRound[], config: RegressionConfig): boolean {
  const recentRounds = rounds.slice(-config.windowSize);
  if (recentRounds.length < config.windowSize) {
    return false;
  }

  const recentFirstTryRate = percentFrom(
    recentRounds.filter((round) => round.firstTryCorrect).length,
    recentRounds.length,
  );

  return recentFirstTryRate < config.firstTryFloorPct;
}

export function SyllableTrainBuilderGame({ level, onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir(i18n.language));

  const runtimeConfig = useMemo(
    () => resolveRuntimeConfig((level.configJson as Record<string, unknown>) ?? {}),
    [level.configJson],
  );

  const stagePointersRef = useRef<StagePointers>({ cv: 0, cvc: 0, transfer: 0 });
  const firstRound = useMemo(() => buildRoundForStage('cv', stagePointersRef.current), []);

  const [round, setRound] = useState<RoundDefinition>(firstRound);
  const [stageTarget, setStageTarget] = useState<Stage>('cv');
  const [statusKey, setStatusKey] = useState<string>('games.syllableTrainBuilder.instructions.intro');
  const [statusTone, setStatusTone] = useState<Tone>('neutral');
  const [slotValues, setSlotValues] = useState<Array<TileId | null>>(() => Array(firstRound.slots.length).fill(null));
  const [ghostSlots, setGhostSlots] = useState<Set<number>>(new Set());
  const [hintStep, setHintStep] = useState(0);
  const [hintsUsedCurrentRound, setHintsUsedCurrentRound] = useState(0);
  const [hadIncorrectAction, setHadIncorrectAction] = useState(false);
  const [selectedTileId, setSelectedTileId] = useState<TileId | null>(null);
  const [highlightedSlotIndex, setHighlightedSlotIndex] = useState<number | null>(0);
  const [wrongSlotPulseIndex, setWrongSlotPulseIndex] = useState<number | null>(null);
  const [isRoundSolved, setIsRoundSolved] = useState(false);
  const [transferChoiceOpen, setTransferChoiceOpen] = useState(false);
  const [selectedTransferWord, setSelectedTransferWord] = useState<WordKey | null>(null);
  const [scoredRounds, setScoredRounds] = useState<ScoredRound[]>([]);
  const [transferRoundsCompleted, setTransferRoundsCompleted] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [guidedRoundsRemaining, setGuidedRoundsRemaining] = useState(0);
  const [regressionRoundsRemaining, setRegressionRoundsRemaining] = useState(0);
  const [regressionReturnStage, setRegressionReturnStage] = useState<Stage | null>(null);
  const [calmAssistBankReduction, setCalmAssistBankReduction] = useState(false);
  const [calmAssistPauseUntil, setCalmAssistPauseUntil] = useState<number | null>(null);
  const [firstTryStreak, setFirstTryStreak] = useState(0);
  const [reducedDistractors, setReducedDistractors] = useState(false);

  const completionSentRef = useRef(false);
  const incorrectActionTimesRef = useRef<number[]>([]);
  const rapidTapAlertsThisRoundRef = useRef(0);
  const lastWrongPlacementRef = useRef<{ slotIndex: number; tileId: TileId; count: number } | null>(null);

  const activeSlotIndex = useMemo(
    () => slotValues.findIndex((value) => value === null),
    [slotValues],
  );

  const isInputPaused = useMemo(() => {
    if (calmAssistPauseUntil === null) {
      return false;
    }
    return Date.now() < calmAssistPauseUntil;
  }, [calmAssistPauseUntil]);

  const solvedRounds = scoredRounds.length;
  const progressPercent = percentFrom(solvedRounds, Math.max(1, runtimeConfig.transferRoundsTarget + runtimeConfig.gateA.minItems + 3));

  const roundPromptKey = useMemo(() => {
    if (round.stage === 'cv') {
      if (activeSlotIndex <= 0) {
        return 'games.syllableTrainBuilder.prompts.build.placeConsonant';
      }
      if (activeSlotIndex === 1) {
        return 'games.syllableTrainBuilder.prompts.build.placeNikud';
      }
      return 'games.syllableTrainBuilder.prompts.build.blendNow';
    }

    if (round.stage === 'cvc') {
      if (activeSlotIndex <= 0) {
        return 'games.syllableTrainBuilder.prompts.build.placeConsonant';
      }
      if (activeSlotIndex === 1) {
        return 'games.syllableTrainBuilder.prompts.build.placeNikud';
      }
      if (activeSlotIndex === 2) {
        return 'games.syllableTrainBuilder.prompts.build.addClosingConsonant';
      }
      return 'games.syllableTrainBuilder.prompts.build.blendNow';
    }

    if (!transferChoiceOpen) {
      return 'games.syllableTrainBuilder.prompts.transfer.readPointedWord';
    }

    return 'games.syllableTrainBuilder.prompts.transfer.chooseMatchingWord';
  }, [activeSlotIndex, round.stage, transferChoiceOpen]);

  const playAudioKey = useCallback(
    async (key: string, mode: 'interrupt' | 'queue' = 'interrupt') => {
      const path = keyToAudioPath(key);
      if (mode === 'interrupt') {
        await audio.playNow(path);
        return;
      }
      await audio.play(path);
    },
    [audio],
  );

  const playAudioSequence = useCallback(
    async (keys: readonly string[]) => {
      const paths = keys.map((key) => keyToAudioPath(key));
      await audio.playSequence(paths);
    },
    [audio],
  );

  const setStatusWithAudio = useCallback(
    (key: string, tone: Tone, mode: 'interrupt' | 'queue' = 'interrupt') => {
      setStatusKey(key);
      setStatusTone(tone);
      void playAudioKey(key, mode).catch(() => {
        // Shared audio manager already handles fallback behavior.
      });
    },
    [playAudioKey],
  );

  const playSegmentedToBlendedModel = useCallback(
    async (targetRound: RoundDefinition, mode: 'interrupt' | 'queue' = 'interrupt') => {
      const segmentedPath = keyToAudioPath(targetRound.segmentedKey);
      const blendedPath = keyToAudioPath(targetRound.blendedKey);

      if (mode === 'interrupt') {
        await audio.playNow(segmentedPath);
      } else {
        await audio.play(segmentedPath);
      }

      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), 220);
      });

      await audio.play(blendedPath);
    },
    [audio],
  );

  const resetRoundState = useCallback((nextRound: RoundDefinition) => {
    setSlotValues(Array(nextRound.slots.length).fill(null));
    setGhostSlots(new Set());
    setHintStep(0);
    setHintsUsedCurrentRound(0);
    setHadIncorrectAction(false);
    setSelectedTileId(null);
    setHighlightedSlotIndex(0);
    setWrongSlotPulseIndex(null);
    setIsRoundSolved(false);
    setTransferChoiceOpen(false);
    setSelectedTransferWord(null);
    setCalmAssistBankReduction(false);
    setCalmAssistPauseUntil(null);
    incorrectActionTimesRef.current = [];
    rapidTapAlertsThisRoundRef.current = 0;
    lastWrongPlacementRef.current = null;
  }, []);

  const effectiveStage = useMemo<Stage>(() => {
    if (regressionRoundsRemaining > 0 && regressionReturnStage) {
      return toStageBefore(regressionReturnStage);
    }
    return stageTarget;
  }, [regressionReturnStage, regressionRoundsRemaining, stageTarget]);

  const queueNextRound = useCallback(
    (nextStage: Stage) => {
      const nextRound = buildRoundForStage(nextStage, stagePointersRef.current);
      setRound(nextRound);
      resetRoundState(nextRound);

      if (nextRound.stage === 'transfer') {
        setStatusWithAudio('games.syllableTrainBuilder.prompts.transfer.readPointedWord', 'neutral', 'interrupt');
      } else {
        setStatusWithAudio('games.syllableTrainBuilder.prompts.listen.targetCv', 'neutral', 'interrupt');
      }

      const shouldAutoModel =
        nextRound.stage === 'cv' ||
        (nextRound.stage === 'cvc' && firstTryStreak < 3) ||
        guidedRoundsRemaining > 0 ||
        regressionRoundsRemaining > 0;

      if (shouldAutoModel) {
        void playSegmentedToBlendedModel(nextRound, 'queue').catch(() => {
          // Keep interaction uninterrupted if model playback fails.
        });
      }

      if (nextRound.stage === 'cvc' && nextRound.nearMissPairKey) {
        setStatusWithAudio('games.syllableTrainBuilder.prompts.build.watchNearMiss', 'hint', 'queue');
      }

      if (nextRound.stage === 'transfer' && nextRound.finalFormTarget) {
        setStatusWithAudio('games.syllableTrainBuilder.prompts.transfer.finalFormHeadsUp', 'hint', 'queue');
      }
    },
    [firstTryStreak, guidedRoundsRemaining, playSegmentedToBlendedModel, regressionRoundsRemaining, resetRoundState, setStatusWithAudio],
  );

  const finalizeSession = useCallback(
    (completedRounds: readonly ScoredRound[]) => {
      if (completionSentRef.current) {
        return;
      }
      completionSentRef.current = true;
      setSessionCompleted(true);

      const firstTrySuccessRate = percentFrom(
        completedRounds.filter((entry) => entry.firstTryCorrect).length,
        completedRounds.length,
      );
      const hintTrend = toHintTrend(completedRounds);
      const cvCoverage = percentFrom(
        new Set(completedRounds.filter((entry) => entry.stage === 'cv').map((entry) => entry.nikudPattern)).size,
        5,
      );
      const cvcCoverage = percentFrom(
        new Set(
          completedRounds
            .filter((entry) => entry.stage === 'cvc')
            .map((entry) => entry.closingConsonant)
            .filter((value): value is ConsonantId => value !== null),
        ).size,
        3,
      );
      const nearMissRounds = completedRounds.filter((entry) => entry.stage === 'cvc' && entry.nearMissRound);
      const distractorAccuracy = percentFrom(
        nearMissRounds.filter((entry) => entry.nearMissFirstTrySuccess).length,
        nearMissRounds.length,
      );

      const completion: SyllableTrainBuilderCompletionResult = {
        completed: true,
        stars: toStars(firstTrySuccessRate),
        score: firstTrySuccessRate,
        roundsCompleted: completedRounds.length,
        summaryMetrics: {
          highestStableRange: toStableRange(firstTrySuccessRate),
          firstAttemptSuccessRate: firstTrySuccessRate,
          hintTrend,
        },
        cvCoverage,
        cvcCoverage,
        distractorAccuracy,
      };

      setStatusWithAudio('games.syllableTrainBuilder.feedback.success.transferGreat', 'success', 'interrupt');
      onComplete(completion);
    },
    [onComplete, setStatusWithAudio],
  );

  const evaluateProgression = useCallback(
    (nextRounds: readonly ScoredRound[]) => {
      const gateA = evaluateGateA(nextRounds, runtimeConfig.gateA);
      const gateB = evaluateGateB(nextRounds, runtimeConfig.gateB);

      let nextTargetStage = stageTarget;

      if (stageTarget === 'cv') {
        if (gateA.passed) {
          nextTargetStage = 'cvc';
          setReducedDistractors(false);
          setStatusWithAudio('games.syllableTrainBuilder.progression.gates.cvCoverageReady', 'success', 'queue');
        } else if (gateA.count >= runtimeConfig.gateA.minItems) {
          setReducedDistractors(true);
        }
      } else if (stageTarget === 'cvc') {
        if (gateB.passed) {
          nextTargetStage = 'transfer';
          setReducedDistractors(false);
          setStatusWithAudio('games.syllableTrainBuilder.progression.gates.cvcCoverageReady', 'success', 'queue');
        } else if (gateB.count >= runtimeConfig.gateB.minItems) {
          setReducedDistractors(true);
          setStatusWithAudio('games.syllableTrainBuilder.progression.gates.distractorReady', 'hint', 'queue');
        }
      }

      const shouldRegress = needsRegression(nextRounds, runtimeConfig.regression);

      if (shouldRegress && nextTargetStage !== 'cv') {
        setRegressionReturnStage(nextTargetStage);
        setRegressionRoundsRemaining(runtimeConfig.regression.scaffoldRounds);
        setStatusWithAudio('games.syllableTrainBuilder.feedback.retry.calmAssist', 'hint', 'interrupt');
      }

      if (nextTargetStage !== stageTarget) {
        setStageTarget(nextTargetStage);
      }

      return shouldRegress ? toStageBefore(nextTargetStage) : nextTargetStage;
    },
    [runtimeConfig.gateA, runtimeConfig.gateB, runtimeConfig.regression, setStatusWithAudio, stageTarget],
  );

  const completeCurrentRound = useCallback(() => {
    const firstTryCorrect = !hadIncorrectAction;

    const scoredRound: ScoredRound = {
      stage: round.stage,
      firstTryCorrect,
      hintsUsed: hintsUsedCurrentRound,
      nikudPattern: round.nikudPattern,
      closingConsonant: round.stage === 'cv' ? null : round.closingConsonant ?? null,
      nearMissRound: round.stage === 'cvc' && Boolean(round.nearMissPairKey),
      nearMissFirstTrySuccess: round.stage === 'cvc' && Boolean(round.nearMissPairKey) ? firstTryCorrect : false,
    };

    const nextRounds = [...scoredRounds, scoredRound];
    setScoredRounds(nextRounds);

    if (firstTryCorrect) {
      setFirstTryStreak((value) => value + 1);
    } else {
      setFirstTryStreak(0);
    }

    if (round.stage === 'transfer') {
      const nextTransferCount = transferRoundsCompleted + 1;
      setTransferRoundsCompleted(nextTransferCount);

      if (nextTransferCount >= runtimeConfig.transferRoundsTarget) {
        finalizeSession(nextRounds);
        return;
      }
    }

    const nextStage = evaluateProgression(nextRounds);

    if (guidedRoundsRemaining > 0) {
      setGuidedRoundsRemaining((value) => Math.max(0, value - 1));
    }

    if (regressionRoundsRemaining > 0) {
      const remaining = Math.max(0, regressionRoundsRemaining - 1);
      setRegressionRoundsRemaining(remaining);
      if (remaining === 0 && regressionReturnStage) {
        setStageTarget(regressionReturnStage);
        setRegressionReturnStage(null);
      }
    }

    queueNextRound(nextStage);
  }, [
    evaluateProgression,
    finalizeSession,
    guidedRoundsRemaining,
    hadIncorrectAction,
    hintsUsedCurrentRound,
    queueNextRound,
    regressionReturnStage,
    regressionRoundsRemaining,
    round,
    runtimeConfig.transferRoundsTarget,
    scoredRounds,
    transferRoundsCompleted,
  ]);

  const triggerCalmAssist = useCallback(() => {
    if (isInputPaused || sessionCompleted) {
      return;
    }

    rapidTapAlertsThisRoundRef.current += 1;
    if (rapidTapAlertsThisRoundRef.current >= 2) {
      setGuidedRoundsRemaining((value) => Math.max(value, 1));
    }

    setCalmAssistPauseUntil(Date.now() + runtimeConfig.calmAssist.pauseMs);
    setCalmAssistBankReduction(true);
    setHighlightedSlotIndex(activeSlotIndex >= 0 ? activeSlotIndex : Math.max(0, round.slots.length - 1));
    setStatusWithAudio('games.syllableTrainBuilder.feedback.retry.calmAssist', 'hint', 'interrupt');

    void playAudioSequence([
      'games.syllableTrainBuilder.feedback.retry.calmAssist',
      roundPromptKey,
    ]).catch(() => {
      // Keep flow resilient if queued audio fails.
    });

    incorrectActionTimesRef.current = [];
  }, [
    activeSlotIndex,
    isInputPaused,
    playAudioSequence,
    round.slots.length,
    roundPromptKey,
    runtimeConfig.calmAssist.pauseMs,
    sessionCompleted,
    setStatusWithAudio,
  ]);

  const registerIncorrectAction = useCallback(
    (slotIndex: number, tileId: TileId) => {
      setHadIncorrectAction(true);
      setWrongSlotPulseIndex(slotIndex);
      setHighlightedSlotIndex(slotIndex);

      const now = Date.now();
      incorrectActionTimesRef.current = [
        ...incorrectActionTimesRef.current.filter((timestamp) => now - timestamp <= runtimeConfig.calmAssist.windowMs),
        now,
      ];

      const previousWrongPlacement = lastWrongPlacementRef.current;
      const repeated =
        previousWrongPlacement !== null &&
        previousWrongPlacement.slotIndex === slotIndex &&
        previousWrongPlacement.tileId === tileId;

      const count = repeated && previousWrongPlacement ? previousWrongPlacement.count + 1 : 1;
      lastWrongPlacementRef.current = { slotIndex, tileId, count };

      if (count >= 2) {
        setStatusWithAudio('games.syllableTrainBuilder.feedback.retry.contrastCue', 'error', 'interrupt');
      } else {
        setStatusWithAudio('games.syllableTrainBuilder.feedback.retry.gentle', 'hint', 'interrupt');
      }

      if (incorrectActionTimesRef.current.length >= runtimeConfig.calmAssist.wrongActions) {
        triggerCalmAssist();
      }
    },
    [runtimeConfig.calmAssist.windowMs, runtimeConfig.calmAssist.wrongActions, setStatusWithAudio, triggerCalmAssist],
  );

  const playTileAudio = useCallback(
    (tileId: TileId) => {
      void playAudioKey(TILE_DEFINITIONS[tileId].audioKey, 'interrupt').catch(() => {
        // Fallback audio behavior is handled globally.
      });
    },
    [playAudioKey],
  );

  const handlePlaceTile = useCallback(
    (tileId: TileId, requestedSlotIndex?: number) => {
      if (sessionCompleted || isRoundSolved || isInputPaused) {
        return;
      }

      if (transferChoiceOpen && round.stage === 'transfer') {
        return;
      }

      const slotIndex =
        typeof requestedSlotIndex === 'number'
          ? requestedSlotIndex
          : activeSlotIndex >= 0
            ? activeSlotIndex
            : -1;

      if (slotIndex < 0 || slotIndex >= round.slots.length || slotValues[slotIndex] !== null) {
        return;
      }

      playTileAudio(tileId);

      const expectedTile = round.slots[slotIndex];
      if (tileId !== expectedTile) {
        registerIncorrectAction(slotIndex, tileId);
        return;
      }

      lastWrongPlacementRef.current = null;
      setWrongSlotPulseIndex(null);
      setHighlightedSlotIndex(slotIndex + 1 < round.slots.length ? slotIndex + 1 : null);

      setSlotValues((previous) => {
        const next = [...previous];
        next[slotIndex] = tileId;
        return next;
      });
      setSelectedTileId(null);

      const solvedAfterPlacement = slotValues.filter((value) => value !== null).length + 1 === round.slots.length;
      if (!solvedAfterPlacement) {
        if (slotIndex === 0) {
          setStatusWithAudio('games.syllableTrainBuilder.prompts.build.placeNikud', 'neutral', 'queue');
        } else if (slotIndex === 1 && round.stage === 'cvc') {
          setStatusWithAudio('games.syllableTrainBuilder.prompts.build.addClosingConsonant', 'neutral', 'queue');
        } else {
          setStatusWithAudio('games.syllableTrainBuilder.prompts.build.blendNow', 'neutral', 'queue');
        }
        return;
      }

      if (round.stage === 'transfer') {
        setTransferChoiceOpen(true);
        setStatusWithAudio('games.syllableTrainBuilder.prompts.transfer.chooseMatchingWord', 'neutral', 'interrupt');
        void playSegmentedToBlendedModel(round, 'queue').catch(() => {
          // Preserve interaction when audio queue fails.
        });
        return;
      }

      setIsRoundSolved(true);
      const successKey = SUCCESS_ROTATION[solvedRounds % SUCCESS_ROTATION.length];
      setStatusWithAudio(successKey, 'success', 'interrupt');
      void playSegmentedToBlendedModel(round, 'queue').catch(() => {
        // Keep progression responsive in case of audio failure.
      });
    },
    [
      activeSlotIndex,
      isInputPaused,
      isRoundSolved,
      playSegmentedToBlendedModel,
      playTileAudio,
      registerIncorrectAction,
      round,
      sessionCompleted,
      setStatusWithAudio,
      slotValues,
      solvedRounds,
      transferChoiceOpen,
    ],
  );

  const handleTransferChoice = useCallback(
    (choice: WordKey) => {
      if (!transferChoiceOpen || round.stage !== 'transfer' || sessionCompleted || isInputPaused) {
        return;
      }

      setSelectedTransferWord(choice);
      void playAudioKey(choice, 'interrupt').catch(() => {
        // Keep flow resilient if transfer word audio is unavailable.
      });

      if (choice !== round.correctWord) {
        setHadIncorrectAction(true);
        setStatusWithAudio('games.syllableTrainBuilder.feedback.retry.gentle', 'hint', 'interrupt');
        const slotForFocus = Math.max(0, round.slots.length - 1);
        registerIncorrectAction(slotForFocus, round.slots[slotForFocus]);
        return;
      }

      setIsRoundSolved(true);
      setStatusWithAudio('games.syllableTrainBuilder.feedback.success.transferGreat', 'success', 'interrupt');
    },
    [isInputPaused, playAudioKey, registerIncorrectAction, round, sessionCompleted, setStatusWithAudio, transferChoiceOpen],
  );

  const handleReplayPrompt = useCallback(() => {
    if (sessionCompleted) {
      return;
    }

    setStatusWithAudio('games.syllableTrainBuilder.controls.replayCue', 'neutral', 'interrupt');
    setHighlightedSlotIndex(activeSlotIndex >= 0 ? activeSlotIndex : Math.max(0, round.slots.length - 1));

    void playAudioSequence([roundPromptKey]).catch(() => {
      // Continue game flow even if audio replay fails.
    });

    if (round.stage !== 'transfer' || !transferChoiceOpen) {
      void playSegmentedToBlendedModel(round, 'queue').catch(() => {
        // Audio fallback is managed globally.
      });
    }
  }, [
    activeSlotIndex,
    playAudioSequence,
    playSegmentedToBlendedModel,
    round,
    roundPromptKey,
    sessionCompleted,
    setStatusWithAudio,
    transferChoiceOpen,
  ]);

  const handleRetryRound = useCallback(() => {
    if (sessionCompleted || isInputPaused) {
      return;
    }

    if (slotValues.some((value) => value !== null) || transferChoiceOpen) {
      setHadIncorrectAction(true);
    }

    resetRoundState(round);
    setStatusWithAudio('games.syllableTrainBuilder.feedback.retry.replayAndTry', 'hint', 'interrupt');
    void playAudioSequence([roundPromptKey]).catch(() => {
      // Keep controls responsive even if replay queue fails.
    });
  }, [
    isInputPaused,
    playAudioSequence,
    resetRoundState,
    round,
    roundPromptKey,
    sessionCompleted,
    setStatusWithAudio,
    slotValues,
    transferChoiceOpen,
  ]);

  const handleHint = useCallback(() => {
    if (sessionCompleted || isRoundSolved || isInputPaused) {
      return;
    }

    const nextStep = Math.min(3, hintStep + 1);
    setHintStep(nextStep);
    setHintsUsedCurrentRound((value) => value + 1);

    if (nextStep === 1) {
      setStatusWithAudio('games.syllableTrainBuilder.hints.tier1ReplaySlowSegment', 'hint', 'interrupt');
      void playSegmentedToBlendedModel(round, 'queue').catch(() => {
        // Keep hint flow stable if model audio fails.
      });
      return;
    }

    if (nextStep === 2) {
      const targetSlot = activeSlotIndex >= 0 ? activeSlotIndex : Math.max(0, round.slots.length - 1);
      setHighlightedSlotIndex(targetSlot);
      setStatusWithAudio('games.syllableTrainBuilder.hints.tier2SlotHighlight', 'hint', 'interrupt');
      return;
    }

    const targetSlot = activeSlotIndex >= 0 ? activeSlotIndex : -1;
    if (targetSlot >= 0) {
      const ghostTile = round.slots[targetSlot];
      setGhostSlots((previous) => {
        const next = new Set(previous);
        next.add(targetSlot);
        return next;
      });
      setSlotValues((previous) => {
        const next = [...previous];
        next[targetSlot] = ghostTile;
        return next;
      });
      setHighlightedSlotIndex(targetSlot + 1 < round.slots.length ? targetSlot + 1 : null);

      if (targetSlot + 1 >= round.slots.length) {
        if (round.stage === 'transfer') {
          setTransferChoiceOpen(true);
          setStatusWithAudio('games.syllableTrainBuilder.prompts.transfer.independentBlend', 'hint', 'interrupt');
        } else {
          setIsRoundSolved(true);
          setStatusWithAudio('games.syllableTrainBuilder.feedback.success.blendedCorrect', 'success', 'interrupt');
        }
      } else {
        setStatusWithAudio('games.syllableTrainBuilder.hints.tier3GhostTile', 'hint', 'interrupt');
      }

      return;
    }

    setStatusWithAudio('games.syllableTrainBuilder.hints.useHintStep', 'hint', 'interrupt');
  }, [
    activeSlotIndex,
    hintStep,
    isInputPaused,
    isRoundSolved,
    playSegmentedToBlendedModel,
    round,
    sessionCompleted,
    setStatusWithAudio,
  ]);

  const handleNext = useCallback(() => {
    if (sessionCompleted || isInputPaused) {
      return;
    }

    if (!isRoundSolved) {
      setStatusWithAudio('games.syllableTrainBuilder.feedback.retry.replayAndTry', 'hint', 'interrupt');
      return;
    }

    completeCurrentRound();
  }, [completeCurrentRound, isInputPaused, isRoundSolved, sessionCompleted, setStatusWithAudio]);

  const handleSlotClick = useCallback(
    (slotIndex: number) => {
      if (!selectedTileId) {
        setHighlightedSlotIndex(slotIndex);
        return;
      }
      handlePlaceTile(selectedTileId, slotIndex);
    },
    [handlePlaceTile, selectedTileId],
  );

  const handleTileSelect = useCallback(
    (tileId: TileId) => {
      if (sessionCompleted || isInputPaused || isRoundSolved) {
        return;
      }

      if (selectedTileId === tileId) {
        setSelectedTileId(null);
        return;
      }

      setSelectedTileId(tileId);
      playTileAudio(tileId);

      if (activeSlotIndex >= 0) {
        setHighlightedSlotIndex(activeSlotIndex);
      }
    },
    [activeSlotIndex, isInputPaused, isRoundSolved, playTileAudio, selectedTileId, sessionCompleted],
  );

  const handleDragStart = useCallback((event: DragEvent<HTMLButtonElement>, tileId: TileId) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', tileId);
  }, []);

  const handleDropOnSlot = useCallback(
    (event: DragEvent<HTMLButtonElement>, slotIndex: number) => {
      event.preventDefault();
      const tileId = event.dataTransfer.getData('text/plain') as TileId | '';
      if (!tileId || !(tileId in TILE_DEFINITIONS)) {
        return;
      }
      handlePlaceTile(tileId as TileId, slotIndex);
    },
    [handlePlaceTile],
  );

  const visibleBank = useMemo(() => {
    const uniqueBank = Array.from(new Set(round.bank));

    const shouldReduce =
      calmAssistBankReduction ||
      regressionRoundsRemaining > 0 ||
      guidedRoundsRemaining > 0 ||
      (reducedDistractors && round.stage === 'cvc');

    if (!shouldReduce) {
      return uniqueBank;
    }

    const targetSlot = activeSlotIndex >= 0 ? activeSlotIndex : Math.max(0, round.slots.length - 1);
    const requiredTile = round.slots[targetSlot];
    const reduced = [requiredTile, ...uniqueBank.filter((tile) => tile !== requiredTile).slice(0, 2)];
    return Array.from(new Set(reduced));
  }, [
    activeSlotIndex,
    calmAssistBankReduction,
    guidedRoundsRemaining,
    reducedDistractors,
    regressionRoundsRemaining,
    round.bank,
    round.slots,
    round.stage,
  ]);

  const stationLabel = useMemo(
    () => t('games.nikudSoundLadder.progress.roundLabel', { current: solvedRounds + 1, total: solvedRounds + 1 + 4 }),
    [solvedRounds, t],
  );

  const toneIcon = useMemo(() => {
    if (statusTone === 'success') return '✅';
    if (statusTone === 'hint') return '💡';
    if (statusTone === 'error') return '↻';
    return rtlReplayGlyph(isRtl);
  }, [isRtl, statusTone]);

  useEffect(() => {
    completionSentRef.current = false;
    stagePointersRef.current = { cv: 0, cvc: 0, transfer: 0 };
    const initialRound = buildRoundForStage('cv', stagePointersRef.current);

    setRound(initialRound);
    setStageTarget('cv');
    setStatusKey('games.syllableTrainBuilder.instructions.intro');
    setStatusTone('neutral');
    setScoredRounds([]);
    setTransferRoundsCompleted(0);
    setSessionCompleted(false);
    setGuidedRoundsRemaining(0);
    setRegressionRoundsRemaining(0);
    setRegressionReturnStage(null);
    setReducedDistractors(false);
    setFirstTryStreak(0);
    resetRoundState(initialRound);

    setStatusWithAudio('games.syllableTrainBuilder.instructions.intro', 'neutral', 'interrupt');
    setStatusWithAudio('games.syllableTrainBuilder.instructions.listenAndBuild', 'neutral', 'queue');
    void playSegmentedToBlendedModel(initialRound, 'queue').catch(() => {
      // Continue setup even if intro audio sequence fails.
    });
  }, [level.id, playSegmentedToBlendedModel, resetRoundState, setStatusWithAudio]);

  useEffect(() => {
    if (calmAssistPauseUntil === null) {
      return undefined;
    }

    const remaining = calmAssistPauseUntil - Date.now();
    if (remaining <= 0) {
      setCalmAssistPauseUntil(null);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCalmAssistPauseUntil(null);
    }, remaining);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [calmAssistPauseUntil]);

  useEffect(() => {
    if (wrongSlotPulseIndex === null) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setWrongSlotPulseIndex(null);
    }, 380);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [wrongSlotPulseIndex]);

  useEffect(() => {
    if (sessionCompleted) {
      return;
    }

    if (effectiveStage !== round.stage) {
      queueNextRound(effectiveStage);
    }
  }, [effectiveStage, queueNextRound, round.stage, sessionCompleted]);

  return (
    <Card
      padding="lg"
      style={{
        display: 'grid',
        gap: 'var(--space-md)',
        background:
          'radial-gradient(circle at 16% 10%, color-mix(in srgb, var(--color-accent-primary) 20%, transparent), transparent 46%), linear-gradient(180deg, var(--color-bg-card) 0%, color-mix(in srgb, var(--color-bg-card) 86%, var(--color-theme-bg) 14%) 100%)',
      }}
    >
      <header className="syllable-train__header">
        <div>
          <h2 className="syllable-train__title">{t('games.syllableTrainBuilder.title')}</h2>
          <p className="syllable-train__subtitle">{t('games.syllableTrainBuilder.subtitle')}</p>
        </div>
      </header>

      <div className="syllable-train__status-row">
        <p className={`syllable-train__status syllable-train__status--${statusTone}`}>
          <span aria-hidden="true">{toneIcon}</span>
          <span>{t(statusKey as never)}</span>
        </p>
        <Button
          variant="secondary"
          size="md"
          aria-label={t('games.syllableTrainBuilder.instructions.tapReplay')}
          onClick={handleReplayPrompt}
          style={{ minInlineSize: '60px', minBlockSize: '60px', paddingInline: 'var(--space-sm)' }}
          disabled={sessionCompleted || isInputPaused}
        >
          ▶
        </Button>
      </div>

      <div className="syllable-train__progress" aria-live="polite">
        <p className="syllable-train__station-label">{stationLabel}</p>
        <div className="syllable-train__progress-track" aria-hidden="true">
          <div
            className="syllable-train__progress-fill"
            style={{
              inlineSize: `${progressPercent}%`,
              background: `linear-gradient(${isRtl ? '270deg' : '90deg'}, var(--color-accent-primary) 0%, var(--color-accent-success) 100%)`,
            }}
          />
        </div>
      </div>

      <Card padding="md" className="syllable-train__rail-card">
        <div className="syllable-train__instruction-row">
          <p className="syllable-train__instruction">🔇 {t(roundPromptKey as never)}</p>
          {isInputPaused ? <span className="syllable-train__pause-chip">{t('games.syllableTrainBuilder.feedback.retry.calmAssist')}</span> : null}
        </div>

        <div className="syllable-train__rail" dir="rtl" role="group" aria-label={t('games.syllableTrainBuilder.instructions.dragRightToLeft')}>
          {round.slots.map((expectedTile, slotIndex) => {
            const filledTile = slotValues[slotIndex];
            const isActiveSlot = slotIndex === highlightedSlotIndex || (highlightedSlotIndex === null && slotIndex === activeSlotIndex);
            const isGhost = ghostSlots.has(slotIndex);
            const slotTile = filledTile ?? (isGhost ? expectedTile : null);

            return (
              <button
                key={`${round.id}-slot-${slotIndex}`}
                type="button"
                className={[
                  'syllable-train__slot',
                  slotTile ? 'is-filled' : '',
                  isActiveSlot ? 'is-active' : '',
                  wrongSlotPulseIndex === slotIndex ? 'is-wrong' : '',
                  isGhost ? 'is-ghost' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleSlotClick(slotIndex)}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(event) => handleDropOnSlot(event, slotIndex)}
                aria-label={t('games.syllableTrainBuilder.instructions.dragRightToLeft')}
                disabled={sessionCompleted || isInputPaused || isRoundSolved || (transferChoiceOpen && round.stage === 'transfer')}
              >
                {slotTile ? (
                  <>
                    <span className="syllable-train__slot-symbol">{t(TILE_DEFINITIONS[slotTile].symbolKey as never)}</span>
                    <span className="syllable-train__slot-label">{t(TILE_DEFINITIONS[slotTile].labelKey as never)}</span>
                  </>
                ) : (
                  <span className="syllable-train__slot-placeholder">●</span>
                )}
              </button>
            );
          })}
        </div>

        {round.stage === 'cvc' && round.nearMissPairKey ? (
          <p className="syllable-train__near-miss">{t(round.nearMissPairKey as never)}</p>
        ) : null}
      </Card>

      <div className="syllable-train__bank" role="group" aria-label={t('games.syllableTrainBuilder.instructions.listenAndBuild')}>
        {visibleBank.map((tileId) => {
          const definition = TILE_DEFINITIONS[tileId];
          return (
            <button
              key={`${round.id}-tile-${tileId}`}
              type="button"
              className={[
                'syllable-train__tile',
                selectedTileId === tileId ? 'is-selected' : '',
                definition.kind === 'nikud' ? 'is-nikud' : 'is-consonant',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleTileSelect(tileId)}
              onDoubleClick={() => handlePlaceTile(tileId)}
              draggable={!sessionCompleted && !isInputPaused && !isRoundSolved}
              onDragStart={(event) => handleDragStart(event, tileId)}
              aria-label={t(definition.labelKey as never)}
              disabled={sessionCompleted || isInputPaused || isRoundSolved || (transferChoiceOpen && round.stage === 'transfer')}
            >
              <span className="syllable-train__tile-symbol">{t(definition.symbolKey as never)}</span>
              <span className="syllable-train__tile-label">{t(definition.labelKey as never)}</span>
            </button>
          );
        })}
      </div>

      {round.stage === 'transfer' && transferChoiceOpen ? (
        <div className="syllable-train__transfer" role="group" aria-label={t('games.syllableTrainBuilder.prompts.transfer.chooseMatchingWord')}>
          {round.options.map((wordKey) => (
            <button
              key={`${round.id}-choice-${wordKey}`}
              type="button"
              className={[
                'syllable-train__transfer-option',
                selectedTransferWord === wordKey ? 'is-selected' : '',
                isRoundSolved && wordKey === round.correctWord ? 'is-correct' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleTransferChoice(wordKey)}
              disabled={sessionCompleted || isInputPaused || isRoundSolved}
              aria-label={t(wordKey as never)}
            >
              {t(wordKey as never)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="syllable-train__controls" role="group" aria-label={t('games.syllableTrainBuilder.instructions.listenAndBuild')}>
        <Button
          variant="secondary"
          size="md"
          onClick={handleReplayPrompt}
          aria-label={t('games.syllableTrainBuilder.instructions.tapReplay')}
          style={{ minInlineSize: '60px', minBlockSize: '60px', paddingInline: 'var(--space-sm)' }}
          disabled={sessionCompleted || isInputPaused}
        >
          <span aria-hidden="true">▶</span>
          <span style={visuallyHiddenStyle}>{t('games.syllableTrainBuilder.controls.replay')}</span>
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={handleRetryRound}
          aria-label={t('games.syllableTrainBuilder.instructions.tapRetry')}
          style={{ minInlineSize: '60px', minBlockSize: '60px', paddingInline: 'var(--space-sm)' }}
          disabled={sessionCompleted || isInputPaused}
        >
          <span aria-hidden="true">↻</span>
          <span style={visuallyHiddenStyle}>{t('games.syllableTrainBuilder.controls.retry')}</span>
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={handleHint}
          aria-label={t('games.syllableTrainBuilder.instructions.tapHint')}
          style={{ minInlineSize: '60px', minBlockSize: '60px', paddingInline: 'var(--space-sm)' }}
          disabled={sessionCompleted || isInputPaused || isRoundSolved}
        >
          <span aria-hidden="true">💡</span>
          <span style={visuallyHiddenStyle}>{t('games.syllableTrainBuilder.controls.hint')}</span>
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleNext}
          aria-label={t('games.syllableTrainBuilder.instructions.tapNext')}
          style={{ minInlineSize: '60px', minBlockSize: '60px', paddingInline: 'var(--space-sm)' }}
          disabled={sessionCompleted || isInputPaused}
        >
          <span aria-hidden="true">{rtlNextGlyph(isRtl)}</span>
          <span style={visuallyHiddenStyle}>{t('games.syllableTrainBuilder.controls.next')}</span>
        </Button>
      </div>

      <style>{`
        .syllable-train__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-sm);
        }

        .syllable-train__title {
          margin: 0;
          font-size: var(--font-size-xl);
          color: var(--color-text-primary);
        }

        .syllable-train__subtitle {
          margin: var(--space-2xs) 0 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .syllable-train__status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-sm);
        }

        .syllable-train__status {
          margin: 0;
          display: inline-flex;
          align-items: center;
          gap: var(--space-xs);
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
          line-height: var(--line-height-normal);
        }

        .syllable-train__status--success {
          color: var(--color-accent-success);
        }

        .syllable-train__status--hint {
          color: var(--color-accent-info);
        }

        .syllable-train__status--error {
          color: var(--color-accent-danger);
        }

        .syllable-train__progress {
          display: grid;
          gap: var(--space-2xs);
        }

        .syllable-train__station-label {
          margin: 0;
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .syllable-train__progress-track {
          inline-size: 100%;
          block-size: 12px;
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-surface-muted) 78%, white 22%);
          border: 1px solid color-mix(in srgb, var(--color-border-subtle) 72%, transparent);
          overflow: hidden;
        }

        .syllable-train__progress-fill {
          block-size: 100%;
          border-radius: inherit;
          transition: inline-size 220ms ease;
        }

        .syllable-train__rail-card {
          display: grid;
          gap: var(--space-sm);
          border: 2px solid color-mix(in srgb, var(--color-accent-primary) 24%, transparent);
          background: color-mix(in srgb, var(--color-bg-card) 84%, white 16%);
        }

        .syllable-train__instruction-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-sm);
        }

        .syllable-train__instruction {
          margin: 0;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .syllable-train__pause-chip {
          padding-block: var(--space-2xs);
          padding-inline: var(--space-xs);
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-accent-info) 18%, transparent);
          color: var(--color-accent-info);
          font-size: var(--font-size-xs);
        }

        .syllable-train__rail {
          display: flex;
          gap: var(--space-xs);
          flex-wrap: nowrap;
          justify-content: center;
          min-block-size: 112px;
          padding: var(--space-xs);
          border-radius: var(--radius-lg);
          background: color-mix(in srgb, var(--color-theme-bg) 86%, white 14%);
          border: 1px dashed color-mix(in srgb, var(--color-accent-primary) 30%, transparent);
        }

        .syllable-train__slot {
          inline-size: clamp(64px, 18vw, 96px);
          min-inline-size: 64px;
          min-block-size: 96px;
          padding-block: var(--space-xs);
          padding-inline: var(--space-2xs);
          border-radius: var(--radius-md);
          border: 2px dashed color-mix(in srgb, var(--color-border-default) 78%, transparent);
          background: color-mix(in srgb, var(--color-bg-card) 86%, white 14%);
          color: var(--color-text-primary);
          display: grid;
          align-content: center;
          justify-items: center;
          gap: var(--space-2xs);
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .syllable-train__slot.is-active {
          border-color: var(--color-accent-info);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-info) 28%, transparent);
        }

        .syllable-train__slot.is-wrong {
          border-color: var(--color-accent-danger);
          transform: translateY(-2px);
        }

        .syllable-train__slot.is-filled {
          border-style: solid;
          border-color: color-mix(in srgb, var(--color-accent-success) 48%, var(--color-border-default));
          background: color-mix(in srgb, var(--color-accent-success) 14%, var(--color-bg-card));
        }

        .syllable-train__slot.is-ghost {
          opacity: 0.78;
        }

        .syllable-train__slot-placeholder {
          font-size: var(--font-size-lg);
          color: color-mix(in srgb, var(--color-text-secondary) 68%, transparent);
        }

        .syllable-train__slot-symbol {
          font-size: clamp(1.45rem, 2.8vw, 2rem);
          line-height: 1;
        }

        .syllable-train__slot-label {
          font-size: var(--font-size-xs);
          text-align: center;
          color: var(--color-text-secondary);
        }

        .syllable-train__near-miss {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
        }

        .syllable-train__bank {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
          gap: var(--space-xs);
        }

        .syllable-train__tile {
          min-block-size: 72px;
          border-radius: var(--radius-md);
          border: 2px solid color-mix(in srgb, var(--color-border-default) 80%, transparent);
          background: color-mix(in srgb, var(--color-bg-card) 88%, white 12%);
          color: var(--color-text-primary);
          display: grid;
          gap: var(--space-2xs);
          justify-items: center;
          align-content: center;
          padding-inline: var(--space-2xs);
          transition: transform 140ms ease, border-color 140ms ease;
          touch-action: none;
        }

        .syllable-train__tile:hover,
        .syllable-train__tile:focus-visible {
          transform: translateY(-1px);
          border-color: color-mix(in srgb, var(--color-accent-primary) 56%, var(--color-border-default));
        }

        .syllable-train__tile.is-selected {
          border-color: var(--color-accent-info);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-info) 26%, transparent);
        }

        .syllable-train__tile.is-nikud {
          background: color-mix(in srgb, var(--color-accent-warning) 10%, var(--color-bg-card));
        }

        .syllable-train__tile-symbol {
          font-size: clamp(1.15rem, 2vw, 1.5rem);
          line-height: 1.1;
        }

        .syllable-train__tile-label {
          font-size: var(--font-size-xs);
          text-align: center;
          color: var(--color-text-secondary);
          line-height: 1.3;
        }

        .syllable-train__transfer {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(116px, 1fr));
          gap: var(--space-xs);
        }

        .syllable-train__transfer-option {
          min-block-size: 56px;
          border-radius: var(--radius-md);
          border: 2px solid color-mix(in srgb, var(--color-border-default) 82%, transparent);
          background: color-mix(in srgb, var(--color-bg-card) 90%, white 10%);
          color: var(--color-text-primary);
          font-size: clamp(1.05rem, 2vw, 1.2rem);
          transition: transform 140ms ease, border-color 140ms ease;
        }

        .syllable-train__transfer-option.is-selected {
          border-color: var(--color-accent-info);
        }

        .syllable-train__transfer-option.is-correct {
          border-color: var(--color-accent-success);
          background: color-mix(in srgb, var(--color-accent-success) 14%, var(--color-bg-card));
        }

        .syllable-train__controls {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--space-xs);
        }

        @media (max-width: 720px) {
          .syllable-train__header {
            align-items: center;
          }

          .syllable-train__controls {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .syllable-train__tile,
          .syllable-train__slot,
          .syllable-train__transfer-option,
          .syllable-train__progress-fill {
            transition: none;
          }
        }
      `}</style>
    </Card>
  );
}
