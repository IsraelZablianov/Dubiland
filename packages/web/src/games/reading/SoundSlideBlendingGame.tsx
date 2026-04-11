import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameCompletionResult, GameProps, HintTrend, StableRange } from '@/games/engine';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { isRtlDirection, rtlNextGlyph, rtlProgressGradient } from '@/lib/rtlChrome';

type StageId = 'L1' | 'L2A' | 'L2B' | 'L3A' | 'L3B';
type Tone = 'neutral' | 'success' | 'hint' | 'error';
type ConsonantId = 'alef' | 'bet' | 'gimel' | 'dalet';
type NikudId = 'patah' | 'qamats' | 'segol' | 'tsere' | 'hirik' | 'holam';

type SyllableKey =
  | 'syllables.pronunciation.baPatah'
  | 'syllables.pronunciation.baQamats'
  | 'syllables.pronunciation.beSegol'
  | 'syllables.pronunciation.beTsere'
  | 'syllables.pronunciation.biHirik'
  | 'syllables.pronunciation.boHolam'
  | 'syllables.pronunciation.gaPatah'
  | 'syllables.pronunciation.gaQamats'
  | 'syllables.pronunciation.geSegol'
  | 'syllables.pronunciation.geTsere'
  | 'syllables.pronunciation.daPatah'
  | 'syllables.pronunciation.daQamats'
  | 'syllables.pronunciation.deSegol'
  | 'syllables.pronunciation.diHirik'
  | 'syllables.pronunciation.doHolam'
  | 'syllables.pronunciation.oHolam';

type WordKey =
  | 'words.pronunciation.gan'
  | 'words.pronunciation.gam'
  | 'words.pronunciation.dag'
  | 'words.pronunciation.dan'
  | 'words.pronunciation.or'
  | 'words.pronunciation.oz';

type ChoiceKey = SyllableKey | WordKey;

interface RoundDefinition {
  id: string;
  stage: StageId;
  consonant: ConsonantId;
  nikud: NikudId;
  segmentedKey: SyllableKey;
  blendedKey: ChoiceKey;
  choices: readonly ChoiceKey[];
  correctChoiceKey: ChoiceKey;
  nearFoilPairKey?:
    | 'games.soundSlideBlending.progression.itemBank.nearFoils.baPatahVsBaQamats'
    | 'games.soundSlideBlending.progression.itemBank.nearFoils.beSegolVsBeTsere';
  transferRound?: boolean;
}

interface ScoredRound {
  stage: StageId;
  firstTryCorrect: boolean;
  hintsUsed: number;
  maxHintStage: number;
  independent: boolean;
  nearFoilPairKey: string | null;
  nearFoilCorrect: boolean;
}

interface StageStats {
  total: number;
  firstTryCorrect: number;
  stage2PlusHints: number;
  stage3Hints: number;
  independentPasses: number;
  nearFoilTotal: number;
  nearFoilCorrect: number;
}

interface SoundSlideBlendingCompletionResult extends GameCompletionResult {
  independentRate: number;
  assistedRate: number;
  confusionPairKey: string;
}

interface StageTargets {
  L1: number;
  L2A: number;
  L2B: number;
  L3A: number;
  L3B: number;
}

interface ConsonantDefinition {
  symbolKey: string;
  audioKey: string;
}

interface NikudDefinition {
  labelKey: string;
  audioKey: string;
}

const STAGE_ORDER: StageId[] = ['L1', 'L2A', 'L2B', 'L3A', 'L3B'];

const DEFAULT_STAGE_TARGETS: StageTargets = {
  L1: 10,
  L2A: 10,
  L2B: 20,
  L3A: 5,
  L3B: 15,
};

const SUCCESS_ROTATION = [
  'games.soundSlideBlending.feedback.success.blendedCorrect',
  'games.soundSlideBlending.feedback.success.heardAndMatched',
  'games.soundSlideBlending.feedback.success.independentWin',
] as const;

const CONSONANTS: Record<ConsonantId, ConsonantDefinition> = {
  alef: {
    symbolKey: 'letters.symbols.alef',
    audioKey: 'letters.pronunciation.alef',
  },
  bet: {
    symbolKey: 'letters.symbols.bet',
    audioKey: 'letters.pronunciation.bet',
  },
  gimel: {
    symbolKey: 'letters.symbols.gimel',
    audioKey: 'letters.pronunciation.gimel',
  },
  dalet: {
    symbolKey: 'letters.symbols.dalet',
    audioKey: 'letters.pronunciation.dalet',
  },
};

const NIKUD: Record<NikudId, NikudDefinition> = {
  patah: {
    labelKey: 'nikud.pronunciation.patah',
    audioKey: 'nikud.pronunciation.patah',
  },
  qamats: {
    labelKey: 'nikud.pronunciation.qamats',
    audioKey: 'nikud.pronunciation.qamats',
  },
  segol: {
    labelKey: 'nikud.pronunciation.segol',
    audioKey: 'nikud.pronunciation.segol',
  },
  tsere: {
    labelKey: 'nikud.pronunciation.tsere',
    audioKey: 'nikud.pronunciation.tsere',
  },
  hirik: {
    labelKey: 'nikud.pronunciation.hirik',
    audioKey: 'nikud.pronunciation.hirik',
  },
  holam: {
    labelKey: 'nikud.pronunciation.holam',
    audioKey: 'nikud.pronunciation.holam',
  },
};

const ROUNDS_BY_STAGE: Record<StageId, readonly RoundDefinition[]> = {
  L1: [
    {
      id: 'l1-ba-patah',
      stage: 'L1',
      consonant: 'bet',
      nikud: 'patah',
      segmentedKey: 'syllables.pronunciation.baPatah',
      blendedKey: 'syllables.pronunciation.baPatah',
      choices: ['syllables.pronunciation.baPatah', 'syllables.pronunciation.boHolam'],
      correctChoiceKey: 'syllables.pronunciation.baPatah',
    },
    {
      id: 'l1-be-segol',
      stage: 'L1',
      consonant: 'bet',
      nikud: 'segol',
      segmentedKey: 'syllables.pronunciation.beSegol',
      blendedKey: 'syllables.pronunciation.beSegol',
      choices: ['syllables.pronunciation.beSegol', 'syllables.pronunciation.biHirik'],
      correctChoiceKey: 'syllables.pronunciation.beSegol',
    },
    {
      id: 'l1-bi-hirik',
      stage: 'L1',
      consonant: 'bet',
      nikud: 'hirik',
      segmentedKey: 'syllables.pronunciation.biHirik',
      blendedKey: 'syllables.pronunciation.biHirik',
      choices: ['syllables.pronunciation.biHirik', 'syllables.pronunciation.baQamats'],
      correctChoiceKey: 'syllables.pronunciation.biHirik',
    },
    {
      id: 'l1-bo-holam',
      stage: 'L1',
      consonant: 'bet',
      nikud: 'holam',
      segmentedKey: 'syllables.pronunciation.boHolam',
      blendedKey: 'syllables.pronunciation.boHolam',
      choices: ['syllables.pronunciation.boHolam', 'syllables.pronunciation.beSegol'],
      correctChoiceKey: 'syllables.pronunciation.boHolam',
    },
  ],
  L2A: [
    {
      id: 'l2a-ba-patah',
      stage: 'L2A',
      consonant: 'bet',
      nikud: 'patah',
      segmentedKey: 'syllables.pronunciation.baPatah',
      blendedKey: 'syllables.pronunciation.baPatah',
      choices: [
        'syllables.pronunciation.baPatah',
        'syllables.pronunciation.boHolam',
        'syllables.pronunciation.biHirik',
      ],
      correctChoiceKey: 'syllables.pronunciation.baPatah',
    },
    {
      id: 'l2a-ga-qamats',
      stage: 'L2A',
      consonant: 'gimel',
      nikud: 'qamats',
      segmentedKey: 'syllables.pronunciation.gaQamats',
      blendedKey: 'syllables.pronunciation.gaQamats',
      choices: [
        'syllables.pronunciation.gaQamats',
        'syllables.pronunciation.geSegol',
        'syllables.pronunciation.gaPatah',
      ],
      correctChoiceKey: 'syllables.pronunciation.gaQamats',
    },
    {
      id: 'l2a-de-segol',
      stage: 'L2A',
      consonant: 'dalet',
      nikud: 'segol',
      segmentedKey: 'syllables.pronunciation.deSegol',
      blendedKey: 'syllables.pronunciation.deSegol',
      choices: [
        'syllables.pronunciation.deSegol',
        'syllables.pronunciation.diHirik',
        'syllables.pronunciation.doHolam',
      ],
      correctChoiceKey: 'syllables.pronunciation.deSegol',
    },
  ],
  L2B: [
    {
      id: 'l2b-ba-patah-vs-qamats',
      stage: 'L2B',
      consonant: 'bet',
      nikud: 'patah',
      segmentedKey: 'syllables.pronunciation.baPatah',
      blendedKey: 'syllables.pronunciation.baPatah',
      choices: [
        'syllables.pronunciation.baPatah',
        'syllables.pronunciation.baQamats',
        'syllables.pronunciation.boHolam',
      ],
      correctChoiceKey: 'syllables.pronunciation.baPatah',
      nearFoilPairKey: 'games.soundSlideBlending.progression.itemBank.nearFoils.baPatahVsBaQamats',
    },
    {
      id: 'l2b-be-segol-vs-tsere',
      stage: 'L2B',
      consonant: 'bet',
      nikud: 'segol',
      segmentedKey: 'syllables.pronunciation.beSegol',
      blendedKey: 'syllables.pronunciation.beSegol',
      choices: [
        'syllables.pronunciation.beSegol',
        'syllables.pronunciation.beTsere',
        'syllables.pronunciation.biHirik',
      ],
      correctChoiceKey: 'syllables.pronunciation.beSegol',
      nearFoilPairKey: 'games.soundSlideBlending.progression.itemBank.nearFoils.beSegolVsBeTsere',
    },
    {
      id: 'l2b-ga-patah-vs-qamats',
      stage: 'L2B',
      consonant: 'gimel',
      nikud: 'patah',
      segmentedKey: 'syllables.pronunciation.gaPatah',
      blendedKey: 'syllables.pronunciation.gaPatah',
      choices: [
        'syllables.pronunciation.gaPatah',
        'syllables.pronunciation.gaQamats',
        'syllables.pronunciation.geSegol',
      ],
      correctChoiceKey: 'syllables.pronunciation.gaPatah',
      nearFoilPairKey: 'games.soundSlideBlending.progression.itemBank.nearFoils.baPatahVsBaQamats',
    },
  ],
  L3A: [
    {
      id: 'l3a-gan',
      stage: 'L3A',
      consonant: 'gimel',
      nikud: 'patah',
      segmentedKey: 'syllables.pronunciation.gaPatah',
      blendedKey: 'words.pronunciation.gan',
      choices: ['words.pronunciation.gan', 'words.pronunciation.gam', 'words.pronunciation.dag'],
      correctChoiceKey: 'words.pronunciation.gan',
    },
    {
      id: 'l3a-dag',
      stage: 'L3A',
      consonant: 'dalet',
      nikud: 'qamats',
      segmentedKey: 'syllables.pronunciation.daQamats',
      blendedKey: 'words.pronunciation.dag',
      choices: ['words.pronunciation.dag', 'words.pronunciation.dan', 'words.pronunciation.gan'],
      correctChoiceKey: 'words.pronunciation.dag',
    },
    {
      id: 'l3a-or',
      stage: 'L3A',
      consonant: 'alef',
      nikud: 'holam',
      segmentedKey: 'syllables.pronunciation.oHolam',
      blendedKey: 'words.pronunciation.or',
      choices: ['words.pronunciation.or', 'words.pronunciation.oz', 'words.pronunciation.dag'],
      correctChoiceKey: 'words.pronunciation.or',
    },
  ],
  L3B: [
    {
      id: 'l3b-transfer-gan',
      stage: 'L3B',
      consonant: 'gimel',
      nikud: 'patah',
      segmentedKey: 'syllables.pronunciation.gaPatah',
      blendedKey: 'words.pronunciation.gan',
      choices: [
        'words.pronunciation.gan',
        'words.pronunciation.gam',
        'words.pronunciation.dan',
        'words.pronunciation.dag',
      ],
      correctChoiceKey: 'words.pronunciation.gan',
      transferRound: true,
    },
    {
      id: 'l3b-transfer-dag',
      stage: 'L3B',
      consonant: 'dalet',
      nikud: 'qamats',
      segmentedKey: 'syllables.pronunciation.daQamats',
      blendedKey: 'words.pronunciation.dag',
      choices: [
        'words.pronunciation.dag',
        'words.pronunciation.dan',
        'words.pronunciation.gan',
        'words.pronunciation.or',
      ],
      correctChoiceKey: 'words.pronunciation.dag',
      transferRound: true,
    },
    {
      id: 'l3b-transfer-or',
      stage: 'L3B',
      consonant: 'alef',
      nikud: 'holam',
      segmentedKey: 'syllables.pronunciation.oHolam',
      blendedKey: 'words.pronunciation.or',
      choices: [
        'words.pronunciation.or',
        'words.pronunciation.oz',
        'words.pronunciation.dag',
        'words.pronunciation.gam',
      ],
      correctChoiceKey: 'words.pronunciation.or',
      transferRound: true,
    },
  ],
};

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

function toPositiveInteger(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }

  return fallback;
}

function resolveStageTargets(configJson: Record<string, unknown>): StageTargets {
  const stageTargets = isRecord(configJson.stageTargets) ? configJson.stageTargets : {};

  return {
    L1: toPositiveInteger(stageTargets.l1Rounds, DEFAULT_STAGE_TARGETS.L1),
    L2A: toPositiveInteger(stageTargets.l2aRounds, DEFAULT_STAGE_TARGETS.L2A),
    L2B: toPositiveInteger(stageTargets.l2bRounds, DEFAULT_STAGE_TARGETS.L2B),
    L3A: toPositiveInteger(stageTargets.l3aRounds, DEFAULT_STAGE_TARGETS.L3A),
    L3B: toPositiveInteger(stageTargets.l3bRounds, DEFAULT_STAGE_TARGETS.L3B),
  };
}

function toAudioPath(key: string): string {
  return resolveAudioPathFromKey(key, 'common');
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

function toHintTrend(rounds: readonly ScoredRound[]): HintTrend {
  if (rounds.length < 2) {
    return 'steady';
  }

  const midpoint = Math.ceil(rounds.length / 2);
  const firstHalf = rounds.slice(0, midpoint).reduce((sum, round) => sum + round.hintsUsed, 0);
  const secondHalf = rounds.slice(midpoint).reduce((sum, round) => sum + round.hintsUsed, 0);

  if (secondHalf < firstHalf) {
    return 'improving';
  }

  if (secondHalf > firstHalf) {
    return 'needs_support';
  }

  return 'steady';
}

function toStableRange(firstTryRate: number): StableRange {
  if (firstTryRate >= 85) return '1-10';
  if (firstTryRate >= 65) return '1-5';
  return '1-3';
}

function toStars(firstTryRate: number): number {
  if (firstTryRate >= 90) return 3;
  if (firstTryRate >= 70) return 2;
  return 1;
}

function createEmptyStageStats(): StageStats {
  return {
    total: 0,
    firstTryCorrect: 0,
    stage2PlusHints: 0,
    stage3Hints: 0,
    independentPasses: 0,
    nearFoilTotal: 0,
    nearFoilCorrect: 0,
  };
}

function shuffleChoices<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function toPreviousStage(stage: StageId): StageId {
  if (stage === 'L3B') return 'L3A';
  if (stage === 'L3A') return 'L2B';
  if (stage === 'L2B') return 'L2A';
  if (stage === 'L2A') return 'L1';
  return 'L1';
}

function nextRoundForStage(stage: StageId, pointers: Record<StageId, number>): RoundDefinition {
  const rounds = ROUNDS_BY_STAGE[stage];
  const index = pointers[stage] % rounds.length;
  pointers[stage] += 1;

  return {
    ...rounds[index],
    choices: [...rounds[index].choices],
  };
}

interface StageGateResult {
  passed: boolean;
  firstTryRate: number;
  independentRate: number;
  nearFoilRate: number;
}

function evaluateStageGate(stage: StageId, stats: StageStats): StageGateResult {
  const firstTryRate = percentFrom(stats.firstTryCorrect, stats.total);
  const independentRate = percentFrom(stats.independentPasses, stats.total);
  const nearFoilRate = percentFrom(stats.nearFoilCorrect, stats.nearFoilTotal);

  if (stage === 'L1') {
    return {
      passed: firstTryRate >= 80 && stats.stage2PlusHints <= 2,
      firstTryRate,
      independentRate,
      nearFoilRate,
    };
  }

  if (stage === 'L2A') {
    return {
      passed: firstTryRate >= 70 && stats.stage3Hints <= 1,
      firstTryRate,
      independentRate,
      nearFoilRate,
    };
  }

  if (stage === 'L2B') {
    const nearFoilPass = stats.nearFoilTotal === 0 ? true : nearFoilRate >= 75;
    return {
      passed: firstTryRate >= 80 && nearFoilPass,
      firstTryRate,
      independentRate,
      nearFoilRate,
    };
  }

  if (stage === 'L3A') {
    return {
      passed: firstTryRate >= 80 && stats.stage2PlusHints <= 1,
      firstTryRate,
      independentRate,
      nearFoilRate,
    };
  }

  return {
    passed: firstTryRate >= 80 && stats.stage3Hints <= 1 && independentRate >= 80,
    firstTryRate,
    independentRate,
    nearFoilRate,
  };
}

export function SoundSlideBlendingGame({ level, onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir(i18n.language));
  const nextGlyph = rtlNextGlyph(isRtl);

  const stageTargets = useMemo(
    () => resolveStageTargets((level.configJson as Record<string, unknown>) ?? {}),
    [level.configJson],
  );

  const roundPointersRef = useRef<Record<StageId, number>>({
    L1: 0,
    L2A: 0,
    L2B: 0,
    L3A: 0,
    L3B: 0,
  });

  const initialRound = useMemo(() => nextRoundForStage('L1', roundPointersRef.current), []);

  const [stage, setStage] = useState<StageId>('L1');
  const [round, setRound] = useState<RoundDefinition>(initialRound);
  const [choiceOrder, setChoiceOrder] = useState<ChoiceKey[]>(() => shuffleChoices(initialRound.choices));
  const [stageRoundCount, setStageRoundCount] = useState(0);
  const [statusKey, setStatusKey] = useState('games.soundSlideBlending.instructions.intro');
  const [statusTone, setStatusTone] = useState<Tone>('neutral');
  const [selectedConsonant, setSelectedConsonant] = useState<ConsonantId | null>(null);
  const [selectedNikud, setSelectedNikud] = useState<NikudId | null>(null);
  const [slideProgress, setSlideProgress] = useState(0);
  const [hasBlended, setHasBlended] = useState(false);
  const [isRoundSolved, setIsRoundSolved] = useState(false);
  const [selectedChoiceKey, setSelectedChoiceKey] = useState<ChoiceKey | null>(null);
  const [hintStage, setHintStage] = useState(0);
  const [hintsUsedRound, setHintsUsedRound] = useState(0);
  const [maxHintStageRound, setMaxHintStageRound] = useState(0);
  const [roundMisses, setRoundMisses] = useState(0);
  const [supportRoundsRemaining, setSupportRoundsRemaining] = useState(0);
  const [reducedOptionsRoundsRemaining, setReducedOptionsRoundsRemaining] = useState(0);
  const [weakStageStreak, setWeakStageStreak] = useState(0);
  const [pauseUntilMs, setPauseUntilMs] = useState<number | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const completionSentRef = useRef(false);
  const scoredRoundsRef = useRef<ScoredRound[]>([]);
  const stageStatsRef = useRef<Record<StageId, StageStats>>({
    L1: createEmptyStageStats(),
    L2A: createEmptyStageStats(),
    L2B: createEmptyStageStats(),
    L3A: createEmptyStageStats(),
    L3B: createEmptyStageStats(),
  });
  const confusionCountsRef = useRef<Record<string, number>>({});
  const dragPointerIdRef = useRef<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const tapTimesRef = useRef<number[]>([]);
  const missTimesRef = useRef<number[]>([]);
  const antiTapCooldownUntilRef = useRef(0);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityHintTriggeredRef = useRef(false);
  const lastActionAtRef = useRef(Date.now());
  const successRotationRef = useRef(0);
  const bootstrappedRef = useRef(false);

  const stageProgressPercent = useMemo(
    () => percentFrom(stageRoundCount, stageTargets[stage]),
    [stage, stageRoundCount, stageTargets],
  );

  const railThumbOffset = 8 + Math.round(slideProgress * 112);

  const isInputPaused = useMemo(() => {
    if (pauseUntilMs === null) {
      return false;
    }

    return Date.now() < pauseUntilMs;
  }, [pauseUntilMs]);

  const playAudioKey = useCallback(
    async (key: string, mode: 'queue' | 'interrupt' = 'queue') => {
      const path = toAudioPath(key);
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
      const paths = keys.map((key) => toAudioPath(key));
      await audio.playSequence(paths);
    },
    [audio],
  );

  const setStatusWithAudio = useCallback(
    (nextStatusKey: string, tone: Tone, mode: 'queue' | 'interrupt' = 'interrupt') => {
      setStatusKey(nextStatusKey);
      setStatusTone(tone);
      void playAudioKey(nextStatusKey, mode).catch(() => {
        // Audio fallbacks are handled in shared audio manager.
      });
    },
    [playAudioKey],
  );

  const touchAction = useCallback(() => {
    lastActionAtRef.current = Date.now();
    inactivityHintTriggeredRef.current = false;
  }, []);

  const pauseInput = useCallback((durationMs: number) => {
    const until = Date.now() + durationMs;
    setPauseUntilMs(until);

    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }

    pauseTimerRef.current = setTimeout(() => {
      setPauseUntilMs(null);
      pauseTimerRef.current = null;
    }, durationMs);
  }, []);

  const playSegmentedToBlended = useCallback(
    async (targetRound: RoundDefinition, mode: 'queue' | 'interrupt' = 'interrupt') => {
      const segmentedPath = toAudioPath(targetRound.segmentedKey);
      const blendedPath = toAudioPath(targetRound.blendedKey);

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

  const resetRoundState = useCallback(
    (nextRound: RoundDefinition, shouldAutoModel: boolean) => {
      setSelectedConsonant(null);
      setSelectedNikud(null);
      setSlideProgress(0);
      setHasBlended(false);
      setIsRoundSolved(false);
      setSelectedChoiceKey(null);
      setHintStage(0);
      setHintsUsedRound(0);
      setMaxHintStageRound(0);
      setRoundMisses(0);
      setChoiceOrder(shuffleChoices(nextRound.choices));
      setShowCelebration(false);
      setPauseUntilMs(null);

      dragPointerIdRef.current = null;
      dragStartYRef.current = null;
      tapTimesRef.current = [];
      missTimesRef.current = [];
      inactivityHintTriggeredRef.current = false;
      lastActionAtRef.current = Date.now();

      setStatusWithAudio('games.soundSlideBlending.prompts.build.chooseConsonant', 'neutral', 'interrupt');

      if (shouldAutoModel) {
        void playSegmentedToBlended(nextRound, 'queue').catch(() => {
          // Keep gameplay responsive when audio assets fail.
        });
      }
    },
    [playSegmentedToBlended, setStatusWithAudio],
  );

  const queueRound = useCallback(
    (
      nextStage: StageId,
      options?: {
        supportMode?: boolean;
        leadAudioKey?: string;
      },
    ) => {
      const nextRound = nextRoundForStage(nextStage, roundPointersRef.current);
      setStage(nextStage);
      setRound(nextRound);

      const shouldAutoModel = nextStage === 'L1' || Boolean(options?.supportMode);
      resetRoundState(nextRound, shouldAutoModel);

      if (options?.leadAudioKey) {
        void playAudioKey(options.leadAudioKey, 'queue').catch(() => {
          // No-op if transition audio is unavailable.
        });
      }
    },
    [playAudioKey, resetRoundState],
  );

  const registerTap = useCallback(() => {
    const now = Date.now();

    tapTimesRef.current = [...tapTimesRef.current.filter((stamp) => now - stamp <= 2000), now];
    missTimesRef.current = missTimesRef.current.filter((stamp) => now - stamp <= 20000);

    if (now < antiTapCooldownUntilRef.current) {
      return;
    }

    const tier2Triggered = tapTimesRef.current.length >= 6 || missTimesRef.current.length >= 3;
    if (tier2Triggered) {
      antiTapCooldownUntilRef.current = now + 1600;
      setReducedOptionsRoundsRemaining((value) => Math.max(value, 2));
      setSupportRoundsRemaining((value) => Math.max(value, 2));
      pauseInput(1200);
      setStatusWithAudio('games.soundSlideBlending.feedback.retry.antiRandomTapPauseReplay', 'hint', 'interrupt');
      void playSegmentedToBlended(round, 'queue').catch(() => {
        // Keep interaction alive when anti-random recovery audio fails.
      });
      return;
    }

    const tier1Triggered = tapTimesRef.current.filter((stamp) => now - stamp <= 1500).length >= 4;
    if (tier1Triggered) {
      antiTapCooldownUntilRef.current = now + 1200;
      setStatusWithAudio('games.soundSlideBlending.feedback.retry.antiRandomTapPauseReplay', 'hint', 'interrupt');
      void playAudioKey('games.soundSlideBlending.controls.replayCue', 'queue').catch(() => {
        // Keep flow resilient when optional cue audio fails.
      });
    }
  }, [pauseInput, playAudioKey, playSegmentedToBlended, round, setStatusWithAudio]);

  const visibleChoices = useMemo(() => {
    const correctKey = round.correctChoiceKey;
    let options = [...choiceOrder];
    const supportActive = supportRoundsRemaining > 0 || reducedOptionsRoundsRemaining > 0;

    if ((supportActive || hintStage >= 2) && options.length > 2) {
      const distractors = options.filter((option) => option !== correctKey);
      const trimmedDistractors = distractors.slice(0, Math.max(1, distractors.length - 1));
      options = [correctKey, ...trimmedDistractors];
    }

    if (hintStage >= 3 && options.length > 2) {
      const firstDistractor = options.find((option) => option !== correctKey);
      options = firstDistractor ? [correctKey, firstDistractor] : [correctKey];
    }

    return options;
  }, [choiceOrder, hintStage, reducedOptionsRoundsRemaining, round.correctChoiceKey, supportRoundsRemaining]);

  const playPromptForSelection = useCallback(
    (targetRound: RoundDefinition) => {
      const promptKey = targetRound.transferRound
        ? 'games.soundSlideBlending.prompts.transfer.chooseByReading'
        : targetRound.stage === 'L3A'
          ? 'games.soundSlideBlending.prompts.choose.cvcBridge'
          : targetRound.nearFoilPairKey
            ? 'games.soundSlideBlending.prompts.choose.watchNikudContrast'
            : 'games.soundSlideBlending.prompts.choose.findPointedSyllable';

      setStatusWithAudio(promptKey, 'neutral', 'interrupt');
    },
    [setStatusWithAudio],
  );

  const handleMissFeedback = useCallback(
    (countNearFoilMiss: boolean) => {
      missTimesRef.current = [...missTimesRef.current, Date.now()];

      if (countNearFoilMiss && round.nearFoilPairKey) {
        confusionCountsRef.current[round.nearFoilPairKey] =
          (confusionCountsRef.current[round.nearFoilPairKey] ?? 0) + 1;
      }

      setRoundMisses((previousMisses) => {
        const nextMisses = previousMisses + 1;

        if (nextMisses === 1) {
          setStatusWithAudio('games.soundSlideBlending.feedback.retry.replaySlow', 'error', 'interrupt');
          void playSegmentedToBlended(round, 'queue').catch(() => {
            // Best-effort replay only.
          });
          return nextMisses;
        }

        if (nextMisses === 2) {
          setHintStage((current) => Math.max(current, 2));
          setMaxHintStageRound((current) => Math.max(current, 2));
          setStatusWithAudio('games.soundSlideBlending.feedback.retry.focusNikud', 'hint', 'interrupt');
          return nextMisses;
        }

        setHintStage(3);
        setMaxHintStageRound((current) => Math.max(current, 3));
        setHintsUsedRound((current) => current + 1);
        setStatusWithAudio('games.soundSlideBlending.feedback.retry.guidedModelThenTry', 'hint', 'interrupt');
        void playSegmentedToBlended(round, 'queue').catch(() => {
          // Best-effort replay only.
        });
        return nextMisses;
      });
    },
    [playSegmentedToBlended, round, setStatusWithAudio],
  );

  const handleConsonantSelect = useCallback(
    (consonant: ConsonantId) => {
      if (sessionCompleted || isRoundSolved || isInputPaused) {
        return;
      }

      touchAction();
      registerTap();
      setSelectedConsonant(consonant);
      void playAudioKey(CONSONANTS[consonant].audioKey, 'interrupt').catch(() => {
        // Audio fallback handled globally.
      });

      if (selectedNikud) {
        setStatusWithAudio('games.soundSlideBlending.prompts.build.swipeToBlend', 'neutral', 'queue');
      } else {
        setStatusWithAudio('games.soundSlideBlending.prompts.build.chooseNikud', 'neutral', 'queue');
      }
    },
    [isInputPaused, isRoundSolved, playAudioKey, registerTap, selectedNikud, sessionCompleted, setStatusWithAudio, touchAction],
  );

  const handleNikudSelect = useCallback(
    (nikud: NikudId) => {
      if (sessionCompleted || isRoundSolved || isInputPaused) {
        return;
      }

      touchAction();
      registerTap();
      setSelectedNikud(nikud);
      void playAudioKey(NIKUD[nikud].audioKey, 'interrupt').catch(() => {
        // Audio fallback handled globally.
      });

      if (selectedConsonant) {
        setStatusWithAudio('games.soundSlideBlending.prompts.build.swipeToBlend', 'neutral', 'queue');
      } else {
        setStatusWithAudio('games.soundSlideBlending.prompts.build.chooseConsonant', 'neutral', 'queue');
      }
    },
    [isInputPaused, isRoundSolved, playAudioKey, registerTap, selectedConsonant, sessionCompleted, setStatusWithAudio, touchAction],
  );

  const handleRailPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (sessionCompleted || isRoundSolved || isInputPaused) {
        return;
      }

      touchAction();
      registerTap();

      if (!selectedConsonant) {
        setStatusWithAudio('games.soundSlideBlending.instructions.tapConsonant', 'hint', 'interrupt');
        return;
      }

      if (!selectedNikud) {
        setStatusWithAudio('games.soundSlideBlending.instructions.tapNikud', 'hint', 'interrupt');
        return;
      }

      dragPointerIdRef.current = event.pointerId;
      dragStartYRef.current = event.clientY;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [isInputPaused, isRoundSolved, registerTap, selectedConsonant, selectedNikud, sessionCompleted, setStatusWithAudio, touchAction],
  );

  const handleRailPointerMove = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (dragPointerIdRef.current !== event.pointerId || dragStartYRef.current === null) {
      return;
    }

    const delta = Math.max(0, event.clientY - dragStartYRef.current);
    const progress = Math.max(0, Math.min(1, delta / 120));
    setSlideProgress(progress);
  }, []);

  const releaseRailPointer = useCallback((pointerId: number | null) => {
    if (pointerId === null) {
      return;
    }

    dragPointerIdRef.current = null;
    dragStartYRef.current = null;
  }, []);

  const attemptBlendFromRail = useCallback(() => {
    if (slideProgress < 0.88) {
      setSlideProgress(0);
      setStatusWithAudio('games.soundSlideBlending.instructions.swipeSlide', 'neutral', 'interrupt');
      return;
    }

    if (!selectedConsonant || !selectedNikud) {
      setSlideProgress(0);
      setStatusWithAudio('games.soundSlideBlending.instructions.swipeSlide', 'hint', 'interrupt');
      return;
    }

    if (selectedConsonant !== round.consonant || selectedNikud !== round.nikud) {
      setSlideProgress(0);
      setHasBlended(false);
      handleMissFeedback(Boolean(round.nearFoilPairKey));
      return;
    }

    setSlideProgress(1);
    setHasBlended(true);
    playPromptForSelection(round);
    void playSegmentedToBlended(round, 'queue').catch(() => {
      // Best-effort audio chain.
    });
  }, [
    handleMissFeedback,
    playPromptForSelection,
    playSegmentedToBlended,
    round,
    selectedConsonant,
    selectedNikud,
    setStatusWithAudio,
    slideProgress,
  ]);

  const handleRailPointerUp = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (dragPointerIdRef.current !== event.pointerId) {
        return;
      }

      releaseRailPointer(event.pointerId);
      attemptBlendFromRail();
    },
    [attemptBlendFromRail, releaseRailPointer],
  );

  const handleRailPointerCancel = useCallback(() => {
    releaseRailPointer(dragPointerIdRef.current);
    setSlideProgress(0);
  }, [releaseRailPointer]);

  const handleChoiceSelect = useCallback(
    (choice: ChoiceKey) => {
      if (sessionCompleted || isRoundSolved || isInputPaused || !hasBlended) {
        return;
      }

      touchAction();
      registerTap();
      setSelectedChoiceKey(choice);
      void playAudioKey(choice, 'interrupt').catch(() => {
        // Audio fallback handled globally.
      });

      if (choice === round.correctChoiceKey) {
        setIsRoundSolved(true);
        setShowCelebration(true);
        const successKey = SUCCESS_ROTATION[successRotationRef.current % SUCCESS_ROTATION.length];
        successRotationRef.current += 1;
        setStatusWithAudio(successKey, 'success', 'interrupt');
        return;
      }

      handleMissFeedback(Boolean(round.nearFoilPairKey));
    },
    [hasBlended, handleMissFeedback, isInputPaused, isRoundSolved, playAudioKey, registerTap, round.correctChoiceKey, round.nearFoilPairKey, sessionCompleted, setStatusWithAudio, touchAction],
  );

  const handleReplay = useCallback(() => {
    if (sessionCompleted || isInputPaused) {
      return;
    }

    touchAction();
    registerTap();
    setStatusWithAudio('games.soundSlideBlending.controls.replayCue', 'neutral', 'interrupt');

    const promptKey = !selectedConsonant
      ? 'games.soundSlideBlending.prompts.build.chooseConsonant'
      : !selectedNikud
        ? 'games.soundSlideBlending.prompts.build.chooseNikud'
        : !hasBlended
          ? 'games.soundSlideBlending.prompts.build.swipeToBlend'
          : round.transferRound
            ? 'games.soundSlideBlending.prompts.transfer.chooseByReading'
            : round.stage === 'L3A'
              ? 'games.soundSlideBlending.prompts.choose.cvcBridge'
              : round.nearFoilPairKey
                ? 'games.soundSlideBlending.prompts.choose.watchNikudContrast'
                : 'games.soundSlideBlending.prompts.choose.findPointedSyllable';

    void playAudioSequence([promptKey]).catch(() => {
      // Non-blocking replay.
    });

    if (selectedConsonant && selectedNikud) {
      void playSegmentedToBlended(round, 'queue').catch(() => {
        // Non-blocking replay.
      });
    }
  }, [hasBlended, isInputPaused, playAudioSequence, playSegmentedToBlended, registerTap, round, selectedConsonant, selectedNikud, sessionCompleted, setStatusWithAudio, touchAction]);

  const handleRetry = useCallback(() => {
    if (sessionCompleted || isInputPaused) {
      return;
    }

    touchAction();
    registerTap();
    setRoundMisses((value) => value + 1);
    missTimesRef.current = [...missTimesRef.current, Date.now()];
    setSelectedConsonant(null);
    setSelectedNikud(null);
    setSlideProgress(0);
    setHasBlended(false);
    setSelectedChoiceKey(null);
    setIsRoundSolved(false);
    setSupportRoundsRemaining((value) => Math.max(value, 1));
    setReducedOptionsRoundsRemaining((value) => Math.max(value, 1));
    setStatusWithAudio('games.soundSlideBlending.feedback.retry.gentle', 'hint', 'interrupt');
    void playAudioSequence(['games.soundSlideBlending.prompts.build.chooseConsonant']).catch(() => {
      // Non-blocking retry cue.
    });
  }, [isInputPaused, playAudioSequence, registerTap, sessionCompleted, setStatusWithAudio, touchAction]);

  const handleHint = useCallback(() => {
    if (sessionCompleted || isRoundSolved || isInputPaused) {
      return;
    }

    touchAction();
    registerTap();

    const nextStageValue = Math.min(3, hintStage + 1);
    setHintStage(nextStageValue);
    setHintsUsedRound((value) => value + 1);
    setMaxHintStageRound((value) => Math.max(value, nextStageValue));

    if (nextStageValue === 1) {
      setStatusWithAudio('games.soundSlideBlending.hints.stage1ReplayBlend', 'hint', 'interrupt');
      void playSegmentedToBlended(round, 'queue').catch(() => {
        // Best-effort hint audio.
      });
      return;
    }

    if (nextStageValue === 2) {
      setStatusWithAudio('games.soundSlideBlending.hints.stage2HighlightPair', 'hint', 'interrupt');
      return;
    }

    setStatusWithAudio('games.soundSlideBlending.hints.stage3ReduceAndModel', 'hint', 'interrupt');
    void playSegmentedToBlended(round, 'queue').catch(() => {
      // Best-effort hint audio.
    });
  }, [hintStage, isInputPaused, isRoundSolved, playSegmentedToBlended, registerTap, round, sessionCompleted, setStatusWithAudio, touchAction]);

  const finalizeSession = useCallback(() => {
    if (completionSentRef.current) {
      return;
    }

    completionSentRef.current = true;
    setSessionCompleted(true);

    const allRounds = scoredRoundsRef.current;
    const firstTryRate = percentFrom(
      allRounds.filter((scoredRound) => scoredRound.firstTryCorrect).length,
      allRounds.length,
    );
    const independentRate = percentFrom(
      allRounds.filter((scoredRound) => scoredRound.independent).length,
      allRounds.length,
    );
    const assistedRate = clampPercent(100 - independentRate);

    const [topConfusionPairKey] = Object.entries(confusionCountsRef.current).sort((a, b) => b[1] - a[1])[0] ?? [
      'games.soundSlideBlending.progression.itemBank.nearFoils.baPatahVsBaQamats',
      0,
    ];

    const completion: SoundSlideBlendingCompletionResult = {
      completed: true,
      stars: toStars(firstTryRate),
      score: firstTryRate,
      roundsCompleted: allRounds.length,
      summaryMetrics: {
        highestStableRange: toStableRange(firstTryRate),
        firstAttemptSuccessRate: firstTryRate,
        hintTrend: toHintTrend(allRounds),
        decodeAccuracy: firstTryRate,
        sequenceEvidenceScore: independentRate,
        gatePassed: true,
      },
      independentRate,
      assistedRate,
      confusionPairKey: topConfusionPairKey,
    };

    setStatusWithAudio('games.soundSlideBlending.completion.title', 'success', 'interrupt');
    onComplete(completion);
  }, [onComplete, setStatusWithAudio]);

  const handleContinue = useCallback(() => {
    if (!isRoundSolved || sessionCompleted) {
      return;
    }

    const firstTryCorrect = roundMisses === 0 && hintsUsedRound === 0 && maxHintStageRound === 0;
    const independent = firstTryCorrect;
    const nearFoilCorrect = Boolean(round.nearFoilPairKey) ? firstTryCorrect : false;

    const scoredRound: ScoredRound = {
      stage,
      firstTryCorrect,
      hintsUsed: hintsUsedRound,
      maxHintStage: maxHintStageRound,
      independent,
      nearFoilPairKey: round.nearFoilPairKey ?? null,
      nearFoilCorrect,
    };

    const stats = stageStatsRef.current[stage];
    stageStatsRef.current[stage] = {
      total: stats.total + 1,
      firstTryCorrect: stats.firstTryCorrect + (firstTryCorrect ? 1 : 0),
      stage2PlusHints: stats.stage2PlusHints + (maxHintStageRound >= 2 ? 1 : 0),
      stage3Hints: stats.stage3Hints + (maxHintStageRound >= 3 ? 1 : 0),
      independentPasses: stats.independentPasses + (independent ? 1 : 0),
      nearFoilTotal: stats.nearFoilTotal + (round.nearFoilPairKey ? 1 : 0),
      nearFoilCorrect: stats.nearFoilCorrect + (nearFoilCorrect ? 1 : 0),
    };

    const nextRoundCount = stageRoundCount + 1;
    setStageRoundCount(nextRoundCount);
    scoredRoundsRef.current = [...scoredRoundsRef.current, scoredRound];

    const nextSupportRounds = Math.max(0, supportRoundsRemaining - 1);
    const nextReducedRounds = Math.max(0, reducedOptionsRoundsRemaining - 1);
    setSupportRoundsRemaining(nextSupportRounds);
    setReducedOptionsRoundsRemaining(nextReducedRounds);

    if (nextRoundCount < stageTargets[stage]) {
      queueRound(stage, { supportMode: nextSupportRounds > 0 || nextReducedRounds > 0 });
      return;
    }

    const stageGate = evaluateStageGate(stage, stageStatsRef.current[stage]);
    stageStatsRef.current[stage] = createEmptyStageStats();
    setStageRoundCount(0);

    if (stageGate.passed) {
      setWeakStageStreak(0);
      setSupportRoundsRemaining(0);
      setReducedOptionsRoundsRemaining(0);

      const stageIndex = STAGE_ORDER.indexOf(stage);
      if (stageIndex >= STAGE_ORDER.length - 1) {
        finalizeSession();
        return;
      }

      const promotedStage = STAGE_ORDER[stageIndex + 1];
      const leadAudioKey =
        stage === 'L1'
          ? 'games.soundSlideBlending.progression.gates.level1To2'
          : stage === 'L2B'
            ? 'games.soundSlideBlending.progression.gates.level2To3'
            : stage === 'L3A'
              ? 'games.soundSlideBlending.feedback.success.transition.transferBridge'
              : 'games.soundSlideBlending.feedback.success.transition.nextStation';

      queueRound(promotedStage, { supportMode: false, leadAudioKey });
      return;
    }

    const nextWeakStreak = weakStageStreak + 1;
    if (nextWeakStreak >= 2 && stage !== 'L1') {
      const regressedStage = toPreviousStage(stage);
      setWeakStageStreak(0);
      setSupportRoundsRemaining(2);
      setReducedOptionsRoundsRemaining(2);
      queueRound(regressedStage, {
        supportMode: true,
        leadAudioKey: 'games.soundSlideBlending.progression.recovery.twoMissesModelRound',
      });
      return;
    }

    setWeakStageStreak(nextWeakStreak);
    setSupportRoundsRemaining(2);
    setReducedOptionsRoundsRemaining(2);
    queueRound(stage, {
      supportMode: true,
      leadAudioKey: 'games.soundSlideBlending.progression.recovery.reducedOptions',
    });
  }, [
    finalizeSession,
    hintsUsedRound,
    isRoundSolved,
    maxHintStageRound,
    queueRound,
    reducedOptionsRoundsRemaining,
    round.nearFoilPairKey,
    roundMisses,
    sessionCompleted,
    stage,
    stageRoundCount,
    stageTargets,
    supportRoundsRemaining,
    weakStageStreak,
  ]);

  useEffect(() => {
    if (bootstrappedRef.current) {
      return;
    }

    bootstrappedRef.current = true;
    setStatusWithAudio('games.soundSlideBlending.instructions.intro', 'neutral', 'interrupt');
    void playAudioSequence(['games.soundSlideBlending.prompts.build.chooseConsonant']).catch(() => {
      // Best-effort bootstrap prompt.
    });
    void playSegmentedToBlended(initialRound, 'queue').catch(() => {
      // Best-effort bootstrap model.
    });
  }, [initialRound, playAudioSequence, playSegmentedToBlended, setStatusWithAudio]);

  useEffect(() => {
    if (sessionCompleted || isRoundSolved || isInputPaused || hasBlended) {
      return;
    }

    const interval = window.setInterval(() => {
      const idleMs = Date.now() - lastActionAtRef.current;
      if (idleMs < 6000 || inactivityHintTriggeredRef.current) {
        return;
      }

      inactivityHintTriggeredRef.current = true;
      setHintStage((current) => Math.max(current, 1));
      setMaxHintStageRound((current) => Math.max(current, 1));
      setStatusWithAudio('games.soundSlideBlending.hints.stage1ReplayBlend', 'hint', 'interrupt');
      void playSegmentedToBlended(round, 'queue').catch(() => {
        // Best-effort inactivity hint audio.
      });
    }, 700);

    return () => {
      window.clearInterval(interval);
    };
  }, [hasBlended, isInputPaused, isRoundSolved, playSegmentedToBlended, round, sessionCompleted, setStatusWithAudio]);

  useEffect(() => {
    if (!showCelebration) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowCelebration(false);
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [showCelebration]);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, []);

  const controlButtonStyle: CSSProperties = {
    inlineSize: '56px',
    minInlineSize: '56px',
    blockSize: '56px',
    minBlockSize: '56px',
    borderRadius: '16px',
    border: '2px solid var(--color-border-primary)',
    background: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)',
    fontSize: '1.35rem',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  };

  const statusToneBackground: Record<Tone, string> = {
    neutral: 'var(--color-bg-secondary)',
    success: 'color-mix(in srgb, var(--color-success) 18%, var(--color-bg-primary))',
    hint: 'color-mix(in srgb, var(--color-warning) 16%, var(--color-bg-primary))',
    error: 'color-mix(in srgb, var(--color-danger) 16%, var(--color-bg-primary))',
  };

  return (
    <Card padding="md" style={{ display: 'grid', gap: 'var(--space-md)' }}>
      <Card
        padding="sm"
        style={{
          display: 'grid',
          gap: 'var(--space-sm)',
          background: statusToneBackground[statusTone],
          border: '2px solid var(--color-border-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <MascotIllustration
            variant={
              statusTone === 'success'
                ? 'success'
                : statusTone === 'hint' || statusTone === 'error'
                  ? 'hint'
                  : 'hero'
            }
            size={52}
          />
          <p style={{ margin: 0, color: 'var(--color-text-primary)', fontWeight: 700 }}>{t(statusKey as never)}</p>
        </div>
        <div
          role="progressbar"
          aria-label={t('games.soundSlideBlending.title')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={stageProgressPercent}
          style={{
            inlineSize: '100%',
            blockSize: '12px',
            borderRadius: '999px',
            background: 'var(--color-surface-muted)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              inlineSize: `${stageProgressPercent}%`,
              blockSize: '100%',
              background: rtlProgressGradient(
                isRtl,
                'var(--color-accent-primary)',
                'var(--color-success)',
              ),
              transition: 'inline-size 180ms ease',
            }}
          />
        </div>
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-sm)',
        }}
      >
        <Card padding="sm" style={{ display: 'grid', gap: 'var(--space-sm)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('games.soundSlideBlending.prompts.build.chooseConsonant')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--space-xs)' }}>
            {(Object.keys(CONSONANTS) as ConsonantId[]).map((consonant) => {
              const isActive = selectedConsonant === consonant;
              return (
                <button
                  key={consonant}
                  type="button"
                  aria-label={t(CONSONANTS[consonant].audioKey as never)}
                  onClick={() => handleConsonantSelect(consonant)}
                  disabled={sessionCompleted || isInputPaused || isRoundSolved}
                  style={{
                    minBlockSize: '52px',
                    borderRadius: '14px',
                    border: isActive
                      ? '2px solid var(--color-accent-primary)'
                      : '2px solid var(--color-border-primary)',
                    background: isActive
                      ? 'color-mix(in srgb, var(--color-accent-primary) 22%, var(--color-bg-primary))'
                      : 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    cursor: sessionCompleted || isInputPaused || isRoundSolved ? 'not-allowed' : 'pointer',
                  }}
                >
                  {t(CONSONANTS[consonant].symbolKey as never)}
                </button>
              );
            })}
          </div>
        </Card>

        <Card padding="sm" style={{ display: 'grid', gap: 'var(--space-sm)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('games.soundSlideBlending.prompts.build.chooseNikud')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--space-xs)' }}>
            {(Object.keys(NIKUD) as NikudId[]).map((nikud) => {
              const isActive = selectedNikud === nikud;
              return (
                <button
                  key={nikud}
                  type="button"
                  aria-label={t(NIKUD[nikud].labelKey as never)}
                  onClick={() => handleNikudSelect(nikud)}
                  disabled={sessionCompleted || isInputPaused || isRoundSolved}
                  style={{
                    minBlockSize: '52px',
                    borderRadius: '14px',
                    border: isActive
                      ? '2px solid var(--color-accent-primary)'
                      : '2px solid var(--color-border-primary)',
                    background: isActive
                      ? 'color-mix(in srgb, var(--color-accent-primary) 22%, var(--color-bg-primary))'
                      : 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: sessionCompleted || isInputPaused || isRoundSolved ? 'not-allowed' : 'pointer',
                  }}
                >
                  {t(NIKUD[nikud].labelKey as never)}
                </button>
              );
            })}
          </div>
        </Card>

        <Card padding="sm" style={{ display: 'grid', gap: 'var(--space-sm)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('games.soundSlideBlending.instructions.swipeSlide')}
          </p>
          <button
            type="button"
            onPointerDown={handleRailPointerDown}
            onPointerMove={handleRailPointerMove}
            onPointerUp={handleRailPointerUp}
            onPointerCancel={handleRailPointerCancel}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSlideProgress(1);
                attemptBlendFromRail();
              }
            }}
            aria-label={t('games.soundSlideBlending.instructions.swipeSlide')}
            disabled={sessionCompleted || isInputPaused || isRoundSolved}
            style={{
              position: 'relative',
              inlineSize: '100%',
              minBlockSize: '176px',
              borderRadius: '24px',
              border: '2px solid var(--color-border-primary)',
              background:
                hasBlended || isRoundSolved
                  ? 'color-mix(in srgb, var(--color-success) 20%, var(--color-bg-primary))'
                  : 'linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 100%)',
              touchAction: 'none',
              cursor: sessionCompleted || isInputPaused || isRoundSolved ? 'not-allowed' : 'grab',
              overflow: 'hidden',
            }}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                insetInline: '14px',
                insetBlockStart: '8px',
                insetBlockEnd: '8px',
                borderRadius: '999px',
                background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-accent-primary) 24%, transparent), transparent)',
              }}
            />
            <span
              aria-hidden
              style={{
                position: 'absolute',
                insetInline: '18px',
                insetBlockStart: `${railThumbOffset}px`,
                blockSize: '48px',
                borderRadius: '999px',
                border: '2px solid var(--color-accent-primary)',
                background: 'var(--color-bg-primary)',
                color: 'var(--color-accent-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                transition: 'inset-block-start 60ms linear',
              }}
            >
              ⬇
            </span>
          </button>
        </Card>
      </div>

      <Card padding="sm" style={{ display: 'grid', gap: 'var(--space-sm)' }}>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          {t(
            round.transferRound
              ? ('games.soundSlideBlending.prompts.transfer.chooseByReading' as never)
              : round.stage === 'L3A'
                ? ('games.soundSlideBlending.prompts.choose.cvcBridge' as never)
                : round.nearFoilPairKey
                  ? ('games.soundSlideBlending.prompts.choose.watchNikudContrast' as never)
                  : ('games.soundSlideBlending.prompts.choose.findPointedSyllable' as never),
          )}
        </p>
        <div
          style={{
            direction: 'rtl',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(128px, 1fr))',
            gap: 'var(--space-xs)',
            opacity: hasBlended || isRoundSolved ? 1 : 0.55,
          }}
        >
          {visibleChoices.map((choice) => {
            const isCorrect = choice === round.correctChoiceKey;
            const isSelected = selectedChoiceKey === choice;
            const showError = isSelected && !isCorrect;
            const showSuccess = isSelected && isCorrect;

            return (
              <button
                key={choice}
                type="button"
                aria-label={t(choice as never)}
                onClick={() => handleChoiceSelect(choice)}
                disabled={sessionCompleted || isInputPaused || isRoundSolved || !hasBlended}
                style={{
                  minBlockSize: '56px',
                  borderRadius: '16px',
                  border: showSuccess
                    ? '2px solid var(--color-success)'
                    : showError
                      ? '2px solid var(--color-danger)'
                      : '2px solid var(--color-border-primary)',
                  background: showSuccess
                    ? 'color-mix(in srgb, var(--color-success) 22%, var(--color-bg-primary))'
                    : showError
                      ? 'color-mix(in srgb, var(--color-danger) 16%, var(--color-bg-primary))'
                      : 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  cursor:
                    sessionCompleted || isInputPaused || isRoundSolved || !hasBlended
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {t(choice as never)}
              </button>
            );
          })}
        </div>
      </Card>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-sm)',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          <button
            type="button"
            aria-label={t('games.soundSlideBlending.controls.replay')}
            onClick={handleReplay}
            disabled={sessionCompleted || isInputPaused}
            style={controlButtonStyle}
          >
            <span aria-hidden>▶</span>
            <span style={visuallyHiddenStyle}>{t('games.soundSlideBlending.controls.replay')}</span>
          </button>
          <button
            type="button"
            aria-label={t('games.soundSlideBlending.controls.retry')}
            onClick={handleRetry}
            disabled={sessionCompleted || isInputPaused}
            style={controlButtonStyle}
          >
            <span aria-hidden>↻</span>
            <span style={visuallyHiddenStyle}>{t('games.soundSlideBlending.controls.retry')}</span>
          </button>
          <button
            type="button"
            aria-label={t('games.soundSlideBlending.controls.hint')}
            onClick={handleHint}
            disabled={sessionCompleted || isInputPaused || isRoundSolved}
            style={controlButtonStyle}
          >
            <span aria-hidden>💡</span>
            <span style={visuallyHiddenStyle}>{t('games.soundSlideBlending.controls.hint')}</span>
          </button>
        </div>

        <button
          type="button"
          aria-label={t('games.soundSlideBlending.controls.next')}
          onClick={handleContinue}
          disabled={!isRoundSolved || sessionCompleted || isInputPaused}
          style={{
            ...controlButtonStyle,
            inlineSize: '64px',
            minInlineSize: '64px',
            opacity: !isRoundSolved || sessionCompleted || isInputPaused ? 0.45 : 1,
          }}
        >
          <span aria-hidden>{nextGlyph}</span>
          <span style={visuallyHiddenStyle}>{t('games.soundSlideBlending.controls.next')}</span>
        </button>
      </div>

      {showCelebration ? (
        <SuccessCelebration
          key={`${round.id}-${stageRoundCount}-${selectedChoiceKey ?? 'none'}`}
          dense
        />
      ) : null}
    </Card>
  );
}
