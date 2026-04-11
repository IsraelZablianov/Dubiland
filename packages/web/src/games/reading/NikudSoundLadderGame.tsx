import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import type { GameCompletionResult, GameProps, HintTrend, StableRange } from '@/games/engine';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { isRtlDirection, rtlNextGlyph, rtlProgressGradient, rtlReplayGlyph } from '@/lib/rtlChrome';

type StatusTone = 'neutral' | 'success' | 'hint';
export type NikudChoiceId = 'patah' | 'qamats' | 'segol' | 'tsere' | 'hirik' | 'holam';
export type NikudFamily = 'a' | 'e' | 'i' | 'o';
type PromptMode = 'sound' | 'name' | 'match' | 'anchor' | 'transfer';
type DistanceClass = 'D1' | 'D2' | 'D3';
type HintStage = 0 | 1 | 2 | 3;
type StageBand = 1 | 2 | 3;

interface NikudRoundDefinition {
  id: string;
  stage: StageBand;
  promptKey: string;
  promptMode: PromptMode;
  correctChoiceId: NikudChoiceId;
  choices: NikudChoiceId[];
  distanceProfile: DistanceClass[];
  transferWordKey?: string;
  nearFoilFamily?: Extract<NikudFamily, 'a' | 'e'>;
}

interface RoundOutcome {
  band: StageBand;
  targetFamily: NikudFamily;
  firstAttemptCorrect: boolean;
  correctForScore: boolean;
  independent: boolean;
  nearFoilRound: boolean;
  nearFoilCorrect: boolean;
  stage3HintUsed: boolean;
}

interface BandBlockSummary {
  totalCorrect: number;
  independentCorrect: number;
  nearFoilCorrect: number;
  nearFoilTotal: number;
  stage3Hints: number;
}

interface RecoveryLock {
  returnBand: 2 | 3;
  roundsLeft: number;
}

type FamilyUnlocks = Record<NikudFamily, boolean>;
type FamilyHistory = Record<NikudFamily, boolean[]>;
type BandPointers = Record<StageBand, number>;

type BandBlocks = Record<StageBand, RoundOutcome[]>;
type CompletedBandBlocks = Record<StageBand, BandBlockSummary[]>;

const SAME_SOUND_PAIRS: ReadonlyArray<readonly [NikudChoiceId, NikudChoiceId]> = [
  ['patah', 'qamats'],
  ['segol', 'tsere'],
];

const NIKUD_FAMILY_BY_CHOICE: Record<NikudChoiceId, NikudFamily> = {
  patah: 'a',
  qamats: 'a',
  segol: 'e',
  tsere: 'e',
  hirik: 'i',
  holam: 'o',
};

const HINT_STAGE_AUDIO_KEYS: Record<Exclude<HintStage, 0>, string> = {
  1: 'games.nikudSoundLadder.hints.stage1ReplayCue',
  2: 'games.nikudSoundLadder.hints.stage2NarrowingCue',
  3: 'games.nikudSoundLadder.hints.stage3ModeledExampleCue',
};

const SUCCESS_ROTATION_KEYS = [
  'games.nikudSoundLadder.feedback.success.wellDone',
  'games.nikudSoundLadder.feedback.success.greatListening',
  'games.nikudSoundLadder.feedback.success.niceBlend',
] as const;

const INACTIVITY_THRESHOLDS_MS = {
  stage1: 4000,
  stage2: 8000,
  stage3: 12000,
} as const;

const LEVEL_1_ROUNDS: NikudRoundDefinition[] = [
  {
    id: 'l1-name-patah',
    stage: 1,
    promptKey: 'nikud.pronunciation.patah',
    promptMode: 'name',
    correctChoiceId: 'patah',
    choices: ['patah', 'holam'],
    distanceProfile: ['D3'],
  },
  {
    id: 'l1-name-qamats',
    stage: 1,
    promptKey: 'nikud.pronunciation.qamats',
    promptMode: 'name',
    correctChoiceId: 'qamats',
    choices: ['qamats', 'hirik'],
    distanceProfile: ['D3'],
  },
  {
    id: 'l1-name-segol',
    stage: 1,
    promptKey: 'nikud.pronunciation.segol',
    promptMode: 'name',
    correctChoiceId: 'segol',
    choices: ['segol', 'holam'],
    distanceProfile: ['D3'],
  },
  {
    id: 'l1-name-tsere',
    stage: 1,
    promptKey: 'nikud.pronunciation.tsere',
    promptMode: 'name',
    correctChoiceId: 'tsere',
    choices: ['tsere', 'hirik'],
    distanceProfile: ['D3'],
  },
  {
    id: 'l1-listen-hirik',
    stage: 1,
    promptKey: 'games.nikudSoundLadder.prompts.listen.hirik',
    promptMode: 'sound',
    correctChoiceId: 'hirik',
    choices: ['hirik', 'qamats'],
    distanceProfile: ['D3'],
  },
  {
    id: 'l1-listen-holam',
    stage: 1,
    promptKey: 'games.nikudSoundLadder.prompts.listen.holam',
    promptMode: 'sound',
    correctChoiceId: 'holam',
    choices: ['holam', 'segol'],
    distanceProfile: ['D3'],
  },
];

const LEVEL_2_CORE_ROUNDS: NikudRoundDefinition[] = [
  {
    id: 'l2-match-ba-patah',
    stage: 2,
    promptKey: 'games.nikudSoundLadder.prompts.match.baPatah',
    promptMode: 'match',
    correctChoiceId: 'patah',
    choices: ['patah', 'hirik', 'holam'],
    distanceProfile: ['D2', 'D3'],
  },
  {
    id: 'l2-match-be-segol',
    stage: 2,
    promptKey: 'games.nikudSoundLadder.prompts.match.beSegol',
    promptMode: 'match',
    correctChoiceId: 'segol',
    choices: ['segol', 'hirik', 'holam'],
    distanceProfile: ['D2', 'D3'],
  },
  {
    id: 'l2-match-bi-hirik',
    stage: 2,
    promptKey: 'games.nikudSoundLadder.prompts.match.biHirik',
    promptMode: 'match',
    correctChoiceId: 'hirik',
    choices: ['hirik', 'holam', 'qamats'],
    distanceProfile: ['D2', 'D3'],
  },
  {
    id: 'l2-match-bo-holam',
    stage: 2,
    promptKey: 'games.nikudSoundLadder.prompts.match.boHolam',
    promptMode: 'match',
    correctChoiceId: 'holam',
    choices: ['holam', 'hirik', 'segol'],
    distanceProfile: ['D2', 'D3'],
  },
  {
    id: 'l2-anchor-qamats-safe',
    stage: 2,
    promptKey: 'games.nikudSoundLadder.prompts.match.anchorQamatsDag',
    promptMode: 'anchor',
    correctChoiceId: 'qamats',
    choices: ['qamats', 'holam', 'hirik'],
    distanceProfile: ['D2', 'D3'],
  },
  {
    id: 'l2-anchor-tsere-safe',
    stage: 2,
    promptKey: 'games.nikudSoundLadder.prompts.match.anchorTsereEts',
    promptMode: 'anchor',
    correctChoiceId: 'tsere',
    choices: ['tsere', 'hirik', 'holam'],
    distanceProfile: ['D2', 'D3'],
  },
];

const LEVEL_2_NEAR_FOIL_ROUNDS: NikudRoundDefinition[] = [
  {
    id: 'l2-anchor-patah-near',
    stage: 2,
    promptKey: 'games.nikudSoundLadder.prompts.match.anchorPatahGan',
    promptMode: 'anchor',
    correctChoiceId: 'patah',
    choices: ['patah', 'qamats', 'segol'],
    distanceProfile: ['D1', 'D3'],
    nearFoilFamily: 'a',
  },
  {
    id: 'l2-anchor-qamats-near',
    stage: 2,
    promptKey: 'games.nikudSoundLadder.prompts.match.anchorQamatsDag',
    promptMode: 'anchor',
    correctChoiceId: 'qamats',
    choices: ['qamats', 'patah', 'holam'],
    distanceProfile: ['D1', 'D3'],
    nearFoilFamily: 'a',
  },
  {
    id: 'l2-anchor-segol-near',
    stage: 2,
    promptKey: 'games.nikudSoundLadder.prompts.match.anchorSegolGesher',
    promptMode: 'anchor',
    correctChoiceId: 'segol',
    choices: ['segol', 'tsere', 'hirik'],
    distanceProfile: ['D1', 'D3'],
    nearFoilFamily: 'e',
  },
  {
    id: 'l2-anchor-tsere-near',
    stage: 2,
    promptKey: 'games.nikudSoundLadder.prompts.match.anchorTsereEts',
    promptMode: 'anchor',
    correctChoiceId: 'tsere',
    choices: ['tsere', 'segol', 'holam'],
    distanceProfile: ['D1', 'D3'],
    nearFoilFamily: 'e',
  },
];

const LEVEL_3_TRANSFER_CORE_ROUNDS: NikudRoundDefinition[] = [
  {
    id: 'l3-transfer-shalom-safe',
    stage: 3,
    promptKey: 'games.nikudSoundLadder.prompts.transfer.shalom',
    promptMode: 'transfer',
    correctChoiceId: 'qamats',
    choices: ['qamats', 'holam', 'hirik'],
    distanceProfile: ['D2', 'D3'],
    transferWordKey: 'games.nikudSoundLadder.transferWords.shalom',
  },
  {
    id: 'l3-transfer-bayit-safe',
    stage: 3,
    promptKey: 'games.nikudSoundLadder.prompts.transfer.bayit',
    promptMode: 'transfer',
    correctChoiceId: 'patah',
    choices: ['patah', 'holam', 'hirik'],
    distanceProfile: ['D2', 'D3'],
    transferWordKey: 'games.nikudSoundLadder.transferWords.bayit',
  },
  {
    id: 'l3-transfer-gesher-safe',
    stage: 3,
    promptKey: 'games.nikudSoundLadder.prompts.transfer.gesher',
    promptMode: 'transfer',
    correctChoiceId: 'segol',
    choices: ['segol', 'hirik', 'holam'],
    distanceProfile: ['D2', 'D3'],
    transferWordKey: 'games.nikudSoundLadder.transferWords.gesher',
  },
  {
    id: 'l3-transfer-ets-safe',
    stage: 3,
    promptKey: 'games.nikudSoundLadder.prompts.transfer.ets',
    promptMode: 'transfer',
    correctChoiceId: 'tsere',
    choices: ['tsere', 'hirik', 'holam'],
    distanceProfile: ['D2', 'D3'],
    transferWordKey: 'games.nikudSoundLadder.transferWords.ets',
  },
];

const LEVEL_3_TRANSFER_NEAR_FOIL_ROUNDS: NikudRoundDefinition[] = [
  {
    id: 'l3-transfer-shalom-near',
    stage: 3,
    promptKey: 'games.nikudSoundLadder.prompts.transfer.shalom',
    promptMode: 'transfer',
    correctChoiceId: 'qamats',
    choices: ['qamats', 'patah', 'holam', 'hirik'],
    distanceProfile: ['D1', 'D2', 'D3'],
    transferWordKey: 'games.nikudSoundLadder.transferWords.shalom',
    nearFoilFamily: 'a',
  },
  {
    id: 'l3-transfer-bayit-near',
    stage: 3,
    promptKey: 'games.nikudSoundLadder.prompts.transfer.bayit',
    promptMode: 'transfer',
    correctChoiceId: 'patah',
    choices: ['patah', 'qamats', 'segol', 'holam'],
    distanceProfile: ['D1', 'D2', 'D3'],
    transferWordKey: 'games.nikudSoundLadder.transferWords.bayit',
    nearFoilFamily: 'a',
  },
  {
    id: 'l3-transfer-gesher-near',
    stage: 3,
    promptKey: 'games.nikudSoundLadder.prompts.transfer.gesher',
    promptMode: 'transfer',
    correctChoiceId: 'segol',
    choices: ['segol', 'tsere', 'hirik', 'holam'],
    distanceProfile: ['D1', 'D2', 'D3'],
    transferWordKey: 'games.nikudSoundLadder.transferWords.gesher',
    nearFoilFamily: 'e',
  },
  {
    id: 'l3-transfer-ets-near',
    stage: 3,
    promptKey: 'games.nikudSoundLadder.prompts.transfer.ets',
    promptMode: 'transfer',
    correctChoiceId: 'tsere',
    choices: ['tsere', 'segol', 'hirik', 'holam'],
    distanceProfile: ['D1', 'D2', 'D3'],
    transferWordKey: 'games.nikudSoundLadder.transferWords.ets',
    nearFoilFamily: 'e',
  },
];

const LEVEL_3_REVIEW_ROUNDS: NikudRoundDefinition[] = [
  {
    id: 'l3-review-hirik',
    stage: 3,
    promptKey: 'games.nikudSoundLadder.prompts.match.biHirik',
    promptMode: 'match',
    correctChoiceId: 'hirik',
    choices: ['hirik', 'holam', 'qamats', 'segol'],
    distanceProfile: ['D2', 'D3', 'D3'],
  },
  {
    id: 'l3-review-holam',
    stage: 3,
    promptKey: 'games.nikudSoundLadder.prompts.match.boHolam',
    promptMode: 'match',
    correctChoiceId: 'holam',
    choices: ['holam', 'hirik', 'patah', 'segol'],
    distanceProfile: ['D2', 'D3', 'D3'],
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function roundPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toHintTrend(hintUses: number, totalRounds: number): HintTrend {
  if (totalRounds <= 0) {
    return 'steady';
  }

  const ratio = hintUses / totalRounds;
  if (ratio <= 0.5) return 'improving';
  if (ratio <= 1) return 'steady';
  return 'needs_support';
}

function toStableRange(firstAttemptSuccessRate: number): StableRange {
  if (firstAttemptSuccessRate >= 85) return '1-10';
  if (firstAttemptSuccessRate >= 65) return '1-5';
  return '1-3';
}

function toStars(firstAttemptSuccessRate: number): number {
  if (firstAttemptSuccessRate >= 90) return 3;
  if (firstAttemptSuccessRate >= 70) return 2;
  return 1;
}

function createDefaultFamilyUnlocks(): FamilyUnlocks {
  return {
    a: false,
    e: false,
    i: false,
    o: false,
  };
}

function createDefaultFamilyHistory(): FamilyHistory {
  return {
    a: [],
    e: [],
    i: [],
    o: [],
  };
}

function resolveStageCap(levelNumber: number): StageBand {
  if (levelNumber <= 1) {
    return 1;
  }
  if (levelNumber === 2) {
    return 2;
  }
  return 3;
}

function hasChoicePair(choices: NikudChoiceId[], pair: readonly [NikudChoiceId, NikudChoiceId]): boolean {
  return choices.includes(pair[0]) && choices.includes(pair[1]);
}

export function isRoundSameSoundSafe(round: NikudRoundDefinition): boolean {
  if (round.promptMode !== 'sound') {
    return true;
  }

  return !SAME_SOUND_PAIRS.some((pair) => hasChoicePair(round.choices, pair));
}

export function shouldUnlockNearFoilFamily(history: boolean[]): boolean {
  if (history.length < 10) {
    return false;
  }

  const recent = history.slice(-10);
  const successCount = recent.filter(Boolean).length;
  return successCount / 10 >= 0.8;
}

export function resolveHintStageFromMissCount(missCount: number): HintStage {
  if (missCount >= 3) return 3;
  if (missCount === 2) return 2;
  if (missCount === 1) return 1;
  return 0;
}

export function resolveHintStageFromInactivity(idleMs: number): HintStage {
  if (idleMs >= INACTIVITY_THRESHOLDS_MS.stage3) return 3;
  if (idleMs >= INACTIVITY_THRESHOLDS_MS.stage2) return 2;
  if (idleMs >= INACTIVITY_THRESHOLDS_MS.stage1) return 1;
  return 0;
}

function summarizeBandBlock(outcomes: RoundOutcome[]): BandBlockSummary {
  return outcomes.reduce<BandBlockSummary>(
    (summary, outcome) => ({
      totalCorrect: summary.totalCorrect + (outcome.correctForScore ? 1 : 0),
      independentCorrect: summary.independentCorrect + (outcome.independent ? 1 : 0),
      nearFoilCorrect: summary.nearFoilCorrect + (outcome.nearFoilCorrect ? 1 : 0),
      nearFoilTotal: summary.nearFoilTotal + (outcome.nearFoilRound ? 1 : 0),
      stage3Hints: summary.stage3Hints + (outcome.stage3HintUsed ? 1 : 0),
    }),
    {
      totalCorrect: 0,
      independentCorrect: 0,
      nearFoilCorrect: 0,
      nearFoilTotal: 0,
      stage3Hints: 0,
    },
  );
}

export function shouldPromoteFromLevel1(blocks: BandBlockSummary[]): boolean {
  if (blocks.length < 2) {
    return false;
  }

  const recent = blocks.slice(-2);
  return recent.every((block) => block.totalCorrect >= 8 && block.independentCorrect >= 6);
}

export function shouldPromoteFromLevel2(blocks: BandBlockSummary[]): boolean {
  if (blocks.length < 2) {
    return false;
  }

  const recent = blocks.slice(-2);
  const totalCorrect = recent.reduce((sum, block) => sum + block.totalCorrect, 0);
  const nearFoilTotal = recent.reduce((sum, block) => sum + block.nearFoilTotal, 0);
  const nearFoilCorrect = recent.reduce((sum, block) => sum + block.nearFoilCorrect, 0);
  const nearFoilAccuracy = nearFoilTotal > 0 ? nearFoilCorrect / nearFoilTotal : 0;
  const stage3LimitSatisfied = recent.every((block) => block.stage3Hints <= 1);

  return totalCorrect >= 17 && nearFoilAccuracy >= 0.7 && stage3LimitSatisfied;
}

function buildBandRoundPool(band: StageBand, familyUnlocks: FamilyUnlocks): NikudRoundDefinition[] {
  if (band === 1) {
    return LEVEL_1_ROUNDS;
  }

  if (band === 2) {
    return [
      ...LEVEL_2_CORE_ROUNDS,
      ...LEVEL_2_NEAR_FOIL_ROUNDS.filter((round) => !round.nearFoilFamily || familyUnlocks[round.nearFoilFamily]),
    ];
  }

  return [
    ...LEVEL_3_TRANSFER_CORE_ROUNDS,
    ...LEVEL_3_TRANSFER_NEAR_FOIL_ROUNDS.filter((round) => !round.nearFoilFamily || familyUnlocks[round.nearFoilFamily]),
    ...LEVEL_3_REVIEW_ROUNDS,
  ];
}

export function buildNikudSoundLadderRounds(levelNumber: number, familyUnlocks?: Partial<FamilyUnlocks>): NikudRoundDefinition[] {
  const unlockState = {
    ...createDefaultFamilyUnlocks(),
    ...familyUnlocks,
  };

  const stageCap = resolveStageCap(levelNumber);
  const rounds: NikudRoundDefinition[] = [];

  if (stageCap >= 1) {
    rounds.push(...buildBandRoundPool(1, unlockState));
  }

  if (stageCap >= 2) {
    rounds.push(...buildBandRoundPool(2, unlockState));
  }

  if (stageCap >= 3) {
    rounds.push(...buildBandRoundPool(3, unlockState));
  }

  return rounds.filter(isRoundSameSoundSafe);
}

function pickNextRoundForBand(band: StageBand, familyUnlocks: FamilyUnlocks, pointers: BandPointers): NikudRoundDefinition {
  const pool = buildBandRoundPool(band, familyUnlocks).filter(isRoundSameSoundSafe);
  const fallbackPool = buildBandRoundPool(1, familyUnlocks).filter(isRoundSameSoundSafe);
  const safePool = pool.length > 0 ? pool : fallbackPool;

  const pointer = pointers[band] % Math.max(1, safePool.length);
  pointers[band] = (pointer + 1) % Math.max(1, safePool.length);

  return safePool[pointer] ?? fallbackPool[0];
}

function getVisibleChoices(round: NikudRoundDefinition, maxHintStageThisRound: HintStage): NikudChoiceId[] {
  if (maxHintStageThisRound < 3) {
    return round.choices;
  }

  const firstFoil = round.choices.find((choice) => choice !== round.correctChoiceId) ?? round.correctChoiceId;
  return [round.correctChoiceId, firstFoil];
}

export function NikudSoundLadderGame({ level, onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir());

  const config = isRecord(level.configJson) ? level.configJson : {};
  const stageCap = resolveStageCap(level.levelNumber);
  const adaptiveMode = config.adaptive !== false;
  const totalRoundsTarget = Math.max(1, Math.round(Number(config.rounds) || 20));
  const initialBand = (adaptiveMode ? 1 : stageCap) as StageBand;

  const roundPointersRef = useRef<BandPointers>({ 1: 0, 2: 0, 3: 0 });
  const bandBlocksRef = useRef<BandBlocks>({ 1: [], 2: [], 3: [] });
  const completedBandBlocksRef = useRef<CompletedBandBlocks>({ 1: [], 2: [], 3: [] });
  const familyHistoryRef = useRef<FamilyHistory>(createDefaultFamilyHistory());

  const [familyUnlocks, setFamilyUnlocks] = useState<FamilyUnlocks>(createDefaultFamilyUnlocks());
  const familyUnlocksRef = useRef<FamilyUnlocks>(familyUnlocks);

  const [currentBand, setCurrentBand] = useState<StageBand>(initialBand);
  const currentBandRef = useRef<StageBand>(initialBand);

  const [recoveryLock, setRecoveryLock] = useState<RecoveryLock | null>(null);
  const recoveryLockRef = useRef<RecoveryLock | null>(null);

  const [roundHistory, setRoundHistory] = useState<RoundOutcome[]>([]);
  const roundHistoryRef = useRef<RoundOutcome[]>([]);

  const [statusKey, setStatusKey] = useState('games.nikudSoundLadder.instructions.intro');
  const [statusTone, setStatusTone] = useState<StatusTone>('neutral');

  const [currentRound, setCurrentRound] = useState<NikudRoundDefinition>(() =>
    pickNextRoundForBand(initialBand, familyUnlocksRef.current, roundPointersRef.current),
  );
  const [selectedChoiceId, setSelectedChoiceId] = useState<NikudChoiceId | null>(null);
  const [roundSolved, setRoundSolved] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);

  const [hintUses, setHintUses] = useState(0);
  const [firstAttemptSuccessCount, setFirstAttemptSuccessCount] = useState(0);
  const [scoredCorrectCount, setScoredCorrectCount] = useState(0);

  const [activeHintStage, setActiveHintStage] = useState<HintStage>(0);
  const activeHintStageRef = useRef<HintStage>(0);
  const [consecutiveIndependentRounds, setConsecutiveIndependentRounds] = useState(0);
  const consecutiveIndependentRoundsRef = useRef(0);

  const [missesThisRound, setMissesThisRound] = useState(0);
  const [maxHintStageThisRound, setMaxHintStageThisRound] = useState<HintStage>(0);
  const maxHintStageThisRoundRef = useRef<HintStage>(0);
  const [lastInteractionAt, setLastInteractionAt] = useState(() => Date.now());
  const [promptPulseToken, setPromptPulseToken] = useState(0);

  const completionSentRef = useRef(false);

  const playAudioKey = useCallback(
    (key: string, interrupt = false) => {
      if (!key) {
        return;
      }
      const audioPath = resolveAudioPathFromKey(key, 'common');
      const playbackPromise = interrupt ? audio.playNow(audioPath) : audio.play(audioPath);
      void playbackPromise.catch(() => {
        // Audio fallbacks are handled by the shared audio manager.
      });
    },
    [audio],
  );

  useEffect(() => {
    familyUnlocksRef.current = familyUnlocks;
  }, [familyUnlocks]);

  useEffect(() => {
    currentBandRef.current = currentBand;
  }, [currentBand]);

  useEffect(() => {
    recoveryLockRef.current = recoveryLock;
  }, [recoveryLock]);

  useEffect(() => {
    roundHistoryRef.current = roundHistory;
  }, [roundHistory]);

  useEffect(() => {
    activeHintStageRef.current = activeHintStage;
  }, [activeHintStage]);

  useEffect(() => {
    consecutiveIndependentRoundsRef.current = consecutiveIndependentRounds;
  }, [consecutiveIndependentRounds]);

  useEffect(() => {
    maxHintStageThisRoundRef.current = maxHintStageThisRound;
  }, [maxHintStageThisRound]);

  const triggerPromptPulse = useCallback(() => {
    setPromptPulseToken((token) => token + 1);
  }, []);

  const resetRoundState = useCallback(
    (round: NikudRoundDefinition) => {
      const baselineHintStage = activeHintStageRef.current;
      setSelectedChoiceId(null);
      setRoundSolved(false);
      setMissesThisRound(0);
      setMaxHintStageThisRound(baselineHintStage);
      maxHintStageThisRoundRef.current = baselineHintStage;
      setLastInteractionAt(Date.now());
      setStatusTone('neutral');
      setStatusKey(round.promptKey);
      triggerPromptPulse();
      playAudioKey(round.promptKey, true);
    },
    [playAudioKey, triggerPromptPulse],
  );

  useEffect(() => {
    const initialUnlocks = createDefaultFamilyUnlocks();
    familyHistoryRef.current = createDefaultFamilyHistory();
    familyUnlocksRef.current = initialUnlocks;
    setFamilyUnlocks(initialUnlocks);

    roundPointersRef.current = { 1: 0, 2: 0, 3: 0 };
    bandBlocksRef.current = { 1: [], 2: [], 3: [] };
    completedBandBlocksRef.current = { 1: [], 2: [], 3: [] };
    roundHistoryRef.current = [];

    setRoundHistory([]);
    setHintUses(0);
    setFirstAttemptSuccessCount(0);
    setScoredCorrectCount(0);

    setCurrentBand(initialBand);
    currentBandRef.current = initialBand;

    setRecoveryLock(null);
    recoveryLockRef.current = null;

    setActiveHintStage(0);
    activeHintStageRef.current = 0;

    setConsecutiveIndependentRounds(0);
    consecutiveIndependentRoundsRef.current = 0;

    setRoundNumber(1);

    const firstRound = pickNextRoundForBand(initialBand, initialUnlocks, roundPointersRef.current);
    setCurrentRound(firstRound);

    setIsCompleted(false);
    completionSentRef.current = false;
  }, [initialBand, stageCap, totalRoundsTarget]);

  useEffect(() => {
    if (isCompleted) {
      return;
    }

    resetRoundState(currentRound);
  }, [currentRound, isCompleted, resetRoundState]);

  const escalateHintStage = useCallback(
    (targetStage: HintStage) => {
      if (isCompleted || roundSolved || targetStage <= maxHintStageThisRoundRef.current) {
        return;
      }

      const boundedStage = Math.max(1, Math.min(3, targetStage)) as Exclude<HintStage, 0>;
      maxHintStageThisRoundRef.current = boundedStage;
      setMaxHintStageThisRound(boundedStage);
      setActiveHintStage((previous) => Math.max(previous, boundedStage) as HintStage);
      setHintUses((count) => count + 1);

      const stageKey = HINT_STAGE_AUDIO_KEYS[boundedStage];
      setStatusKey(stageKey);
      setStatusTone('hint');
      playAudioKey(stageKey, true);

      if (boundedStage === 1) {
        playAudioKey(currentRound.promptKey);
      }

      if (boundedStage === 3) {
        playAudioKey('games.nikudSoundLadder.hints.stage3TryAfterModel');
      }

      triggerPromptPulse();
    },
    [currentRound.promptKey, isCompleted, playAudioKey, roundSolved, triggerPromptPulse],
  );

  useEffect(() => {
    if (isCompleted || roundSolved) {
      return;
    }

    const now = Date.now();
    const idleMs = now - lastInteractionAt;

    const stage1Delay = Math.max(0, INACTIVITY_THRESHOLDS_MS.stage1 - idleMs);
    const stage2Delay = Math.max(0, INACTIVITY_THRESHOLDS_MS.stage2 - idleMs);
    const stage3Delay = Math.max(0, INACTIVITY_THRESHOLDS_MS.stage3 - idleMs);

    const timeoutIds: number[] = [];

    if (maxHintStageThisRoundRef.current < 1) {
      timeoutIds.push(window.setTimeout(() => escalateHintStage(1), stage1Delay));
    }

    if (maxHintStageThisRoundRef.current < 2) {
      timeoutIds.push(window.setTimeout(() => escalateHintStage(2), stage2Delay));
    }

    if (maxHintStageThisRoundRef.current < 3) {
      timeoutIds.push(window.setTimeout(() => escalateHintStage(3), stage3Delay));
    }

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [escalateHintStage, isCompleted, lastInteractionAt, roundSolved]);

  const finalizeSession = useCallback(() => {
    if (completionSentRef.current) {
      return;
    }

    completionSentRef.current = true;
    setIsCompleted(true);

    const completedRounds = roundHistoryRef.current.length;
    const firstAttemptSuccessRate = roundPercent((firstAttemptSuccessCount / Math.max(1, completedRounds)) * 100);
    const score = roundPercent((scoredCorrectCount / Math.max(1, completedRounds)) * 100);

    const result: GameCompletionResult = {
      completed: true,
      stars: toStars(firstAttemptSuccessRate),
      score,
      roundsCompleted: completedRounds,
      summaryMetrics: {
        highestStableRange: toStableRange(firstAttemptSuccessRate),
        firstAttemptSuccessRate,
        hintTrend: toHintTrend(hintUses, Math.max(1, completedRounds)),
      },
    };

    setStatusKey('games.nikudSoundLadder.feedback.success.sessionComplete');
    setStatusTone('success');
    playAudioKey('games.nikudSoundLadder.feedback.success.sessionComplete', true);
    onComplete(result);
  }, [firstAttemptSuccessCount, hintUses, onComplete, playAudioKey, scoredCorrectCount]);

  const applyRoundOutcome = useCallback(
    (outcome: RoundOutcome) => {
      const updatedHistory = [...roundHistoryRef.current, outcome];
      roundHistoryRef.current = updatedHistory;
      setRoundHistory(updatedHistory);

      const familyHistory = familyHistoryRef.current;
      const nextFamilyHistory: FamilyHistory = {
        ...familyHistory,
        [outcome.targetFamily]: [...familyHistory[outcome.targetFamily], outcome.correctForScore].slice(-10),
      };
      familyHistoryRef.current = nextFamilyHistory;

      const nextFamilyUnlocks: FamilyUnlocks = {
        a: shouldUnlockNearFoilFamily(nextFamilyHistory.a),
        e: shouldUnlockNearFoilFamily(nextFamilyHistory.e),
        i: false,
        o: false,
      };

      familyUnlocksRef.current = nextFamilyUnlocks;
      setFamilyUnlocks(nextFamilyUnlocks);

      if (outcome.independent) {
        const nextConsecutive = consecutiveIndependentRoundsRef.current + 1;
        consecutiveIndependentRoundsRef.current = nextConsecutive;
        setConsecutiveIndependentRounds(nextConsecutive);

        if (nextConsecutive >= 2) {
          activeHintStageRef.current = 0;
          setActiveHintStage(0);
        } else {
          setActiveHintStage((previous) => {
            const next = Math.max(0, previous - 1) as HintStage;
            activeHintStageRef.current = next;
            return next;
          });
        }
      } else {
        consecutiveIndependentRoundsRef.current = 0;
        setConsecutiveIndependentRounds(0);
      }

      const activeBand = outcome.band;
      const activeBlock = [...bandBlocksRef.current[activeBand], outcome];
      bandBlocksRef.current[activeBand] = activeBlock;

      let nextBand = currentBandRef.current;
      let nextRecoveryLock = recoveryLockRef.current;

      if (nextRecoveryLock) {
        const decremented = nextRecoveryLock.roundsLeft - 1;
        if (decremented <= 0) {
          nextBand = nextRecoveryLock.returnBand;
          nextRecoveryLock = null;
        } else {
          nextRecoveryLock = { ...nextRecoveryLock, roundsLeft: decremented };
          nextBand = Math.min(nextBand, (nextRecoveryLock.returnBand - 1) as StageBand) as StageBand;
        }
      } else {
        if (activeBand > 1 && activeBlock.length >= 6) {
          const firstSix = activeBlock.slice(0, 6);
          const firstSixCorrect = firstSix.filter((round) => round.correctForScore).length;
          const firstSixAccuracy = firstSixCorrect / 6;

          if (firstSixAccuracy < 0.5) {
            nextBand = (activeBand - 1) as StageBand;
            nextRecoveryLock = {
              returnBand: activeBand as 2 | 3,
              roundsLeft: 6,
            };
            bandBlocksRef.current[activeBand] = [];
          }
        }

        if (!nextRecoveryLock && activeBlock.length === 10) {
          const summary = summarizeBandBlock(activeBlock);
          const nextCompleted = [...completedBandBlocksRef.current[activeBand], summary].slice(-4);
          completedBandBlocksRef.current[activeBand] = nextCompleted;
          bandBlocksRef.current[activeBand] = [];

          if (activeBand === 1 && stageCap >= 2 && shouldPromoteFromLevel1(nextCompleted)) {
            nextBand = 2;
          }

          if (activeBand === 2 && stageCap >= 3 && shouldPromoteFromLevel2(nextCompleted)) {
            nextBand = 3;
          }
        }
      }

      if (nextBand !== currentBandRef.current) {
        currentBandRef.current = nextBand;
        setCurrentBand(nextBand);
      }

      recoveryLockRef.current = nextRecoveryLock;
      setRecoveryLock(nextRecoveryLock);
    },
    [stageCap],
  );

  const recordInteraction = useCallback(() => {
    setLastInteractionAt(Date.now());
  }, []);

  const handleChoiceSelect = useCallback(
    (choiceId: NikudChoiceId) => {
      if (isCompleted || roundSolved) {
        return;
      }

      recordInteraction();
      setSelectedChoiceId(choiceId);
      playAudioKey(`games.nikudSoundLadder.choiceLabels.${choiceId}`, true);

      if (choiceId === currentRound.correctChoiceId) {
        const firstTry = missesThisRound === 0;
        const stageUsed = maxHintStageThisRoundRef.current;
        const independent = stageUsed <= 1;
        const correctForScore = stageUsed < 3;
        const nearFoilRound = Boolean(currentRound.nearFoilFamily);

        if (firstTry) {
          setFirstAttemptSuccessCount((count) => count + 1);
        }

        if (correctForScore) {
          setScoredCorrectCount((count) => count + 1);
        }

        const outcome: RoundOutcome = {
          band: currentBandRef.current,
          targetFamily: NIKUD_FAMILY_BY_CHOICE[currentRound.correctChoiceId],
          firstAttemptCorrect: firstTry,
          correctForScore,
          independent,
          nearFoilRound,
          nearFoilCorrect: nearFoilRound ? correctForScore : false,
          stage3HintUsed: stageUsed >= 3,
        };

        applyRoundOutcome(outcome);
        setRoundSolved(true);

        const successKey = SUCCESS_ROTATION_KEYS[roundHistoryRef.current.length % SUCCESS_ROTATION_KEYS.length];
        setStatusKey(successKey);
        setStatusTone('success');
        playAudioKey(successKey, true);

        if (currentRound.transferWordKey) {
          playAudioKey(currentRound.transferWordKey);
        }

        return;
      }

      const nextMissCount = missesThisRound + 1;
      setMissesThisRound(nextMissCount);

      const nextStage = resolveHintStageFromMissCount(nextMissCount);
      if (nextStage > maxHintStageThisRoundRef.current) {
        escalateHintStage(nextStage);
      } else {
        setStatusKey('games.nikudSoundLadder.feedback.retry.listenAgain');
        setStatusTone('hint');
        playAudioKey('games.nikudSoundLadder.feedback.retry.listenAgain', true);
      }
    },
    [
      applyRoundOutcome,
      currentRound,
      escalateHintStage,
      isCompleted,
      missesThisRound,
      playAudioKey,
      recordInteraction,
      roundSolved,
    ],
  );

  const handleReplayPrompt = useCallback(() => {
    if (isCompleted) {
      return;
    }

    recordInteraction();
    setStatusKey(currentRound.promptKey);
    setStatusTone('neutral');
    playAudioKey('games.nikudSoundLadder.instructions.iconReplay', true);
    playAudioKey(currentRound.promptKey);
    triggerPromptPulse();
  }, [currentRound.promptKey, isCompleted, playAudioKey, recordInteraction, triggerPromptPulse]);

  const handleRetry = useCallback(() => {
    if (isCompleted) {
      return;
    }

    recordInteraction();
    setSelectedChoiceId(null);
    setStatusKey('games.nikudSoundLadder.feedback.retry.retryIcon');
    setStatusTone('hint');
    playAudioKey('games.nikudSoundLadder.instructions.iconRetry', true);
    playAudioKey('games.nikudSoundLadder.feedback.retry.promptReplay');
    playAudioKey(currentRound.promptKey);
    triggerPromptPulse();
  }, [currentRound.promptKey, isCompleted, playAudioKey, recordInteraction, triggerPromptPulse]);

  const handleHint = useCallback(() => {
    if (isCompleted) {
      return;
    }

    recordInteraction();
    playAudioKey('games.nikudSoundLadder.instructions.iconHint', true);

    const nextStage = Math.min(3, maxHintStageThisRoundRef.current + 1) as HintStage;
    if (nextStage > maxHintStageThisRoundRef.current) {
      escalateHintStage(nextStage);
    } else {
      setStatusKey('games.nikudSoundLadder.hints.stage3TryAfterModel');
      setStatusTone('hint');
      playAudioKey('games.nikudSoundLadder.hints.stage3TryAfterModel', true);
    }
  }, [escalateHintStage, isCompleted, playAudioKey, recordInteraction]);

  const handleNext = useCallback(() => {
    if (isCompleted) {
      return;
    }

    if (!roundSolved) {
      setStatusKey('games.nikudSoundLadder.instructions.solveBeforeNext');
      setStatusTone('hint');
      playAudioKey('games.nikudSoundLadder.instructions.solveBeforeNext', true);
      return;
    }

    if (roundHistoryRef.current.length >= totalRoundsTarget) {
      finalizeSession();
      return;
    }

    playAudioKey('games.nikudSoundLadder.instructions.iconNext', true);
    playAudioKey('games.nikudSoundLadder.feedback.transitions.nextRound');

    const nextRound = pickNextRoundForBand(currentBandRef.current, familyUnlocksRef.current, roundPointersRef.current);
    setRoundNumber((value) => value + 1);
    setCurrentRound(nextRound);
  }, [finalizeSession, isCompleted, playAudioKey, roundSolved, totalRoundsTarget]);

  const roundsCompleted = roundHistory.length;
  const progressPercent = roundPercent((roundsCompleted / Math.max(1, totalRoundsTarget)) * 100);

  const progressLabel = t('games.nikudSoundLadder.progress.roundLabel', {
    current: Math.min(roundNumber, totalRoundsTarget),
    total: totalRoundsTarget,
  });

  const solvedLabel = t('games.nikudSoundLadder.progress.solvedLabel', {
    solved: scoredCorrectCount,
  });

  const visibleChoices = useMemo(
    () => getVisibleChoices(currentRound, maxHintStageThisRound),
    [currentRound, maxHintStageThisRound],
  );

  return (
    <Card
      padding="lg"
      style={{
        display: 'grid',
        gap: 'var(--space-md)',
        background:
          'radial-gradient(circle at 14% 12%, color-mix(in srgb, var(--color-accent-primary) 16%, transparent), transparent 44%), var(--color-bg-card)',
      }}
    >
      <div className="nikud-sound-ladder__status-row">
        <p className={`nikud-sound-ladder__status nikud-sound-ladder__status--${statusTone}`}>{t(statusKey as any)}</p>
        <p className="nikud-sound-ladder__band-label" aria-live="polite">
          {t('games.nikudSoundLadder.progress.roundLabel', {
            current: currentBand,
            total: stageCap,
          })}
        </p>
      </div>

      <div className="nikud-sound-ladder__progress">
        <div className="nikud-sound-ladder__progress-meta">
          <p>{progressLabel}</p>
          <p>{solvedLabel}</p>
        </div>
        <div className="nikud-sound-ladder__progress-track" role="presentation" aria-hidden="true">
          <div
            className="nikud-sound-ladder__progress-fill"
            style={{
              inlineSize: `${progressPercent}%`,
              background: rtlProgressGradient(isRtl, 'var(--color-accent-success)', 'var(--color-accent-primary)'),
            }}
          />
        </div>
      </div>

      <Card
        key={`${currentRound.id}-${promptPulseToken}`}
        padding="md"
        className="nikud-sound-ladder__prompt-card"
        style={{
          display: 'grid',
          gap: 'var(--space-sm)',
          border: '2px solid color-mix(in srgb, var(--color-accent-primary) 28%, transparent)',
        }}
      >
        <div className="nikud-sound-ladder__prompt-row">
          <p className="nikud-sound-ladder__prompt">{t(currentRound.promptKey as any)}</p>
          <Button
            variant="secondary"
            size="md"
            onClick={handleReplayPrompt}
            aria-label={t('games.nikudSoundLadder.controls.replayPrompt')}
            title={t('games.nikudSoundLadder.instructions.iconReplay')}
            style={{ minHeight: 60, minWidth: 60, paddingInline: 'var(--space-md)' }}
          >
            {rtlReplayGlyph(isRtl)}
          </Button>
        </div>
        {currentRound.transferWordKey ? (
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              recordInteraction();
              playAudioKey(currentRound.transferWordKey as string, true);
            }}
            aria-label={t('games.nikudSoundLadder.controls.replayWord')}
            style={{ justifySelf: 'flex-start' }}
          >
            <span aria-hidden="true">{rtlReplayGlyph(isRtl)}</span>
            <span>{t(currentRound.transferWordKey as any)}</span>
          </Button>
        ) : null}
      </Card>

      <div className="nikud-sound-ladder__choices-grid" role="group" aria-label={t('games.nikudSoundLadder.instructions.chooseNikud')}>
        {visibleChoices.map((choiceId) => {
          const isSelected = selectedChoiceId === choiceId;
          const isCorrectChoice = choiceId === currentRound.correctChoiceId;
          const isIncorrectSelected = isSelected && !isCorrectChoice;
          const isDimmed = !roundSolved && maxHintStageThisRound >= 2 && !isCorrectChoice;

          return (
            <button
              key={`${currentRound.id}-${choiceId}`}
              type="button"
              className={[
                'nikud-sound-ladder__choice',
                isSelected ? 'is-selected' : '',
                roundSolved && isCorrectChoice ? 'is-correct' : '',
                isIncorrectSelected ? 'is-incorrect' : '',
                isDimmed ? 'is-dimmed' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleChoiceSelect(choiceId)}
              aria-label={t(`games.nikudSoundLadder.choiceLabels.${choiceId}` as any)}
              disabled={isCompleted}
            >
              <span className="nikud-sound-ladder__choice-symbol">{t(`games.nikudSoundLadder.symbols.${choiceId}` as any)}</span>
              <span className="nikud-sound-ladder__choice-label">{t(`games.nikudSoundLadder.choiceLabels.${choiceId}` as any)}</span>
              <span className="nikud-sound-ladder__choice-mark" aria-hidden="true">
                {roundSolved && isCorrectChoice ? '✓' : isIncorrectSelected ? '↺' : '○'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="nikud-sound-ladder__controls" role="group" aria-label={t('games.nikudSoundLadder.controls.groupLabel')}>
        <Button
          variant="secondary"
          size="md"
          onClick={handleReplayPrompt}
          aria-label={t('games.nikudSoundLadder.controls.replayPrompt')}
          title={t('games.nikudSoundLadder.instructions.iconReplay')}
          style={{ minHeight: 60, minWidth: 60, paddingInline: 'var(--space-md)' }}
        >
          {rtlReplayGlyph(isRtl)}
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={handleRetry}
          aria-label={t('games.nikudSoundLadder.controls.retry')}
          title={t('games.nikudSoundLadder.instructions.iconRetry')}
          style={{ minHeight: 60, minWidth: 60, paddingInline: 'var(--space-md)' }}
        >
          ↻
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={handleHint}
          aria-label={t('games.nikudSoundLadder.controls.hint')}
          title={t('games.nikudSoundLadder.instructions.iconHint')}
          style={{ minHeight: 60, minWidth: 60, paddingInline: 'var(--space-md)' }}
        >
          💡
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleNext}
          aria-label={t('games.nikudSoundLadder.controls.next')}
          title={t('games.nikudSoundLadder.instructions.iconNext')}
          style={{ minHeight: 60, minWidth: 60, paddingInline: 'var(--space-md)' }}
        >
          {rtlNextGlyph(isRtl)}
        </Button>
      </div>

      <style>{`
        .nikud-sound-ladder__status-row {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: var(--space-sm);
        }

        .nikud-sound-ladder__status {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
          line-height: var(--line-height-normal);
        }

        .nikud-sound-ladder__status--success {
          color: var(--color-accent-success);
        }

        .nikud-sound-ladder__status--hint {
          color: var(--color-accent-info);
        }

        .nikud-sound-ladder__band-label {
          margin: 0;
          padding-inline: var(--space-sm);
          padding-block: 4px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--color-accent-primary) 18%, transparent);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          white-space: nowrap;
        }

        .nikud-sound-ladder__progress {
          display: grid;
          gap: var(--space-xs);
        }

        .nikud-sound-ladder__progress-meta {
          display: flex;
          justify-content: space-between;
          gap: var(--space-sm);
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .nikud-sound-ladder__progress-meta p {
          margin: 0;
        }

        .nikud-sound-ladder__progress-track {
          block-size: 12px;
          inline-size: 100%;
          border-radius: 999px;
          background: color-mix(in srgb, var(--color-theme-secondary) 24%, var(--color-bg-muted));
          overflow: hidden;
        }

        .nikud-sound-ladder__progress-fill {
          block-size: 100%;
          transition: inline-size var(--transition-fast);
        }

        .nikud-sound-ladder__prompt-card {
          animation: nikud-sound-ladder__pulse 450ms ease-out;
        }

        .nikud-sound-ladder__prompt-row {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: var(--space-sm);
        }

        .nikud-sound-ladder__prompt {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-lg);
          line-height: var(--line-height-normal);
        }

        .nikud-sound-ladder__choices-grid {
          display: grid;
          gap: var(--space-sm);
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        }

        .nikud-sound-ladder__choice {
          min-block-size: 72px;
          border-radius: var(--radius-lg);
          border: 2px solid color-mix(in srgb, var(--color-theme-secondary) 44%, transparent);
          background: var(--color-bg-card);
          color: var(--color-text-primary);
          display: grid;
          justify-items: center;
          align-content: center;
          gap: 4px;
          font-family: var(--font-family-primary);
          cursor: pointer;
          transition: var(--transition-fast);
          padding: var(--space-sm);
        }

        .nikud-sound-ladder__choice.is-selected {
          border-color: var(--color-accent-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-primary) 22%, transparent);
        }

        .nikud-sound-ladder__choice.is-correct {
          border-color: var(--color-accent-success);
        }

        .nikud-sound-ladder__choice.is-incorrect {
          border-color: var(--color-accent-warning);
        }

        .nikud-sound-ladder__choice.is-dimmed {
          opacity: 0.5;
        }

        .nikud-sound-ladder__choice-symbol {
          font-size: clamp(1.6rem, 3.8vw, 2rem);
          line-height: 1;
          font-weight: var(--font-weight-bold);
        }

        .nikud-sound-ladder__choice-label {
          font-size: var(--font-size-sm);
        }

        .nikud-sound-ladder__choice-mark {
          font-size: var(--font-size-md);
        }

        .nikud-sound-ladder__controls {
          display: grid;
          grid-template-columns: repeat(4, minmax(60px, 1fr));
          gap: var(--space-sm);
        }

        @keyframes nikud-sound-ladder__pulse {
          0% {
            transform: scale(0.985);
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent-primary) 32%, transparent);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent-primary) 0%, transparent);
          }
        }

        @media (max-width: 900px) {
          .nikud-sound-ladder__status-row {
            grid-template-columns: 1fr;
          }

          .nikud-sound-ladder__band-label {
            justify-self: flex-start;
          }
        }
      `}</style>
    </Card>
  );
}
