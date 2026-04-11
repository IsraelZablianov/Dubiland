import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameCompletionResult, GameProps, HintTrend, ParentSummaryMetrics, PatternAccuracyKey, StableRange } from '@/games/engine';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { resolveGameConcurrentChoiceLimit } from '@/lib/concurrentChoiceLimit';
import { isRtlDirection, rtlNextGlyph, rtlReplayGlyph } from '@/lib/rtlChrome';

type PatternLevel = 1 | 2 | 3;
type PatternType = 'AB' | 'AAB' | 'ABB' | 'ABC' | 'repair';
type PatternMetricType = PatternAccuracyKey;
type PatternMisconception = 'rule-skip' | 'distractor-bias' | 'attribute-confusion';
type RoundTheme = 'animals' | 'market' | 'holiday';
type MessageTone = 'neutral' | 'hint' | 'success';
type BoardFeedback = 'idle' | 'success' | 'miss';
type CarColor = 'red' | 'blue' | 'green' | 'orange';
type CarShape = 'circle' | 'triangle' | 'square' | 'star';
type StatusKey = string;

interface CarToken {
  id: string;
  color: CarColor;
  shape: CarShape;
}

interface RoundObjective {
  level: PatternLevel;
  patternType: PatternType;
  fullSequence: CarToken[];
  expected: CarToken;
  missingIndex: number;
  theme: RoundTheme;
  instructionKey: StatusKey;
  promptKey: StatusKey;
}

interface RoundState extends RoundObjective {
  id: string;
  slots: Array<CarToken | null>;
  options: CarToken[];
  supportMode: boolean;
  ghostHint: boolean;
}

interface RoundMessage {
  key: StatusKey;
  tone: MessageTone;
}

interface PatternStats {
  attempts: number;
  firstTryHits: number;
}

interface RoundHistoryEntry {
  level: PatternLevel;
  firstTry: boolean;
  usedHint: boolean;
}

interface SessionStats {
  totalAttempts: number;
  firstTryHits: number;
  hintUsageByRound: number[];
  patternStats: Record<PatternMetricType, PatternStats>;
  misconceptionCounts: Record<PatternMisconception, number>;
  roundHistory: RoundHistoryEntry[];
}

interface SessionSummary {
  firstTryRate: number;
  hintReliance: number;
  hintTrend: HintTrend;
  topMisconception: PatternMisconception;
  focusPattern: PatternMetricType;
}

const TOTAL_ROUNDS = 10;
const BREAK_AFTER_ROUND = 5;
const LEVEL_ONE_GATE_WINDOW = 8;
const LEVEL_TWO_GATE_WINDOW = 10;
const SUPPORT_MISS_THRESHOLD = 2;
const FIRST_TRY_STREAK_TO_RAISE = 3;

const THEMES: RoundTheme[] = ['animals', 'market', 'holiday'];
const COLORS: CarColor[] = ['red', 'blue', 'green', 'orange'];
const SHAPES: CarShape[] = ['circle', 'triangle', 'square', 'star'];

const SHAPE_SYMBOL: Record<CarShape, string> = {
  circle: '●',
  triangle: '▲',
  square: '■',
  star: '★',
};

const COLOR_HEX: Record<CarColor, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  orange: '#f59e0b',
};

const LEVEL_OPTION_COUNT: Record<PatternLevel, number> = {
  1: 2,
  2: 3,
  3: 4,
};

const SUCCESS_ROTATION: StatusKey[] = [
  'feedback.success.wellDone',
  'feedback.success.amazing',
  'feedback.success.celebrate',
];

const ENCOURAGEMENT_ROTATION: StatusKey[] = [
  'feedback.encouragement.keepTrying',
  'feedback.encouragement.almostThere',
  'feedback.encouragement.tryAgain',
];

const INITIAL_STATS: SessionStats = {
  totalAttempts: 0,
  firstTryHits: 0,
  hintUsageByRound: [],
  patternStats: {
    AB: { attempts: 0, firstTryHits: 0 },
    AAB: { attempts: 0, firstTryHits: 0 },
    ABC: { attempts: 0, firstTryHits: 0 },
    repair: { attempts: 0, firstTryHits: 0 },
  },
  misconceptionCounts: {
    'rule-skip': 0,
    'distractor-bias': 0,
    'attribute-confusion': 0,
  },
  roundHistory: [],
};

const MISCONCEPTION_LABEL_KEY: Record<PatternMisconception, StatusKey> = {
  'rule-skip': 'games.patternTrain.misconceptions.ruleSkip',
  'distractor-bias': 'games.patternTrain.misconceptions.distractorBias',
  'attribute-confusion': 'games.patternTrain.misconceptions.attributeConfusion',
};

const PATTERN_LABEL_KEY: Record<PatternMetricType, StatusKey> = {
  AB: 'games.patternTrain.patternTypes.AB',
  AAB: 'games.patternTrain.patternTypes.AAB',
  ABC: 'games.patternTrain.patternTypes.ABC',
  repair: 'games.patternTrain.patternTypes.repair',
};

function resolveAudioPath(key: StatusKey): string {
  return resolveAudioPathFromKey(key, 'common');
}

function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

function pickRandom<T>(items: readonly T[]): T {
  return items[randomInt(items.length)] as T;
}

function shuffle<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function toStableRange(firstTryRate: number): StableRange {
  if (firstTryRate >= 85) {
    return '1-10';
  }
  if (firstTryRate >= 65) {
    return '1-5';
  }
  return '1-3';
}

function toHintTrend(hintsByRound: number[]): HintTrend {
  if (hintsByRound.length === 0) {
    return 'steady';
  }

  const midpoint = Math.ceil(hintsByRound.length / 2);
  const firstHalf = hintsByRound.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
  const secondHalf = hintsByRound.slice(midpoint).reduce((sum, value) => sum + value, 0);

  if (secondHalf < firstHalf) {
    return 'improving';
  }
  if (secondHalf > firstHalf) {
    return 'needs_support';
  }
  return 'steady';
}

function toMetricPatternType(patternType: PatternType): PatternMetricType {
  if (patternType === 'AB') {
    return 'AB';
  }
  if (patternType === 'ABC') {
    return 'ABC';
  }
  if (patternType === 'repair') {
    return 'repair';
  }
  return 'AAB';
}

function toTokenKey(token: Pick<CarToken, 'color' | 'shape'>): string {
  return `${token.color}:${token.shape}`;
}

function tokensEqual(left: Pick<CarToken, 'color' | 'shape'>, right: Pick<CarToken, 'color' | 'shape'>): boolean {
  return left.color === right.color && left.shape === right.shape;
}

function buildToken(color: CarColor, shape: CarShape): CarToken {
  return {
    id: `car-${color}-${shape}`,
    color,
    shape,
  };
}

function buildDistinctTokens(count: number): CarToken[] {
  const pool: CarToken[] = [];
  for (const color of COLORS) {
    for (const shape of SHAPES) {
      pool.push(buildToken(color, shape));
    }
  }
  return shuffle(pool).slice(0, count);
}

function repeatPattern(pattern: readonly CarToken[], length: number): CarToken[] {
  return Array.from({ length }, (_, index) => pattern[index % pattern.length] as CarToken);
}

function buildPatternUnits(level: PatternLevel, patternType: PatternType): CarToken[] {
  if (level === 1) {
    const varyByColor = Math.random() >= 0.5;
    if (varyByColor) {
      const shape = pickRandom(SHAPES);
      const [colorA, colorB] = shuffle(COLORS).slice(0, 2);
      return [buildToken(colorA, shape), buildToken(colorB, shape)];
    }

    const color = pickRandom(COLORS);
    const [shapeA, shapeB] = shuffle(SHAPES).slice(0, 2);
    return [buildToken(color, shapeA), buildToken(color, shapeB)];
  }

  if (patternType === 'ABC') {
    return buildDistinctTokens(3);
  }

  const twoUnits = buildDistinctTokens(2);
  if (patternType === 'AAB') {
    return [twoUnits[0], twoUnits[0], twoUnits[1]];
  }

  if (patternType === 'ABB') {
    return [twoUnits[0], twoUnits[1], twoUnits[1]];
  }

  return twoUnits;
}

function buildPromptKey(patternType: PatternType): StatusKey {
  if (patternType === 'AB') {
    return 'games.patternTrain.prompts.level1.ab';
  }
  if (patternType === 'AAB') {
    return 'games.patternTrain.prompts.level2.aab';
  }
  if (patternType === 'ABB') {
    return 'games.patternTrain.prompts.level2.abb';
  }
  if (patternType === 'ABC') {
    return 'games.patternTrain.prompts.level3.abc';
  }
  return 'games.patternTrain.prompts.level3.repair';
}

function buildInstructionKey(patternType: PatternType, roundNumber: number): StatusKey {
  if (roundNumber === 1) {
    return 'games.patternTrain.instructions.intro';
  }

  if (patternType === 'repair') {
    return 'games.patternTrain.instructions.repairCar';
  }

  return 'games.patternTrain.instructions.listenRule';
}

function choosePatternType(level: PatternLevel, roundNumber: number): PatternType {
  if (level === 1) {
    return 'AB';
  }

  if (level === 2) {
    return roundNumber % 2 === 0 ? 'AAB' : 'ABB';
  }

  return roundNumber % 2 === 0 ? 'repair' : 'ABC';
}

function countByColor(sequence: readonly CarToken[]): Record<CarColor, number> {
  return sequence.reduce<Record<CarColor, number>>(
    (acc, token) => {
      acc[token.color] += 1;
      return acc;
    },
    {
      red: 0,
      blue: 0,
      green: 0,
      orange: 0,
    },
  );
}

function classifyMisconception(selected: CarToken, round: RoundState): PatternMisconception {
  const previousIndex = Math.max(0, round.missingIndex - 1);
  const previousToken = round.fullSequence[previousIndex] ?? null;

  if (previousToken && tokensEqual(selected, previousToken)) {
    return 'rule-skip';
  }

  if (selected.color === round.expected.color || selected.shape === round.expected.shape) {
    return 'attribute-confusion';
  }

  const colorCounts = countByColor(round.fullSequence.filter((token, index) => index !== round.missingIndex));
  const mostFrequentColor = (Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'blue') as CarColor;
  if (selected.color === mostFrequentColor && round.expected.color !== mostFrequentColor) {
    return 'distractor-bias';
  }

  return 'distractor-bias';
}

function buildOptions(
  objective: RoundObjective,
  optionsCount: number,
  similarityTier: number,
  maxConcurrentChoices: number,
): CarToken[] {
  const allowedCount = Math.max(2, Math.min(maxConcurrentChoices, optionsCount));
  const expectedKey = toTokenKey(objective.expected);

  const candidatePool: CarToken[] = [];
  for (const color of COLORS) {
    for (const shape of SHAPES) {
      const token = buildToken(color, shape);
      if (toTokenKey(token) !== expectedKey) {
        candidatePool.push(token);
      }
    }
  }

  const previousToken = objective.fullSequence[Math.max(0, objective.missingIndex - 1)] ?? null;
  const similarCandidates = candidatePool.filter(
    (candidate) => candidate.color === objective.expected.color || candidate.shape === objective.expected.shape,
  );
  const farCandidates = candidatePool.filter(
    (candidate) => candidate.color !== objective.expected.color && candidate.shape !== objective.expected.shape,
  );

  const unique = new Map<string, CarToken>();
  unique.set(expectedKey, objective.expected);

  if (similarityTier > 0 && previousToken && !tokensEqual(previousToken, objective.expected)) {
    unique.set(toTokenKey(previousToken), previousToken);
  }

  const preferredPool = similarityTier >= 2 ? [...shuffle(similarCandidates), ...shuffle(farCandidates)] : shuffle(candidatePool);
  for (const candidate of preferredPool) {
    if (unique.size >= allowedCount) {
      break;
    }
    unique.set(toTokenKey(candidate), candidate);
  }

  return shuffle(Array.from(unique.values())).slice(0, allowedCount);
}

function buildRoundObjective(roundNumber: number, level: PatternLevel): RoundObjective {
  const patternType = choosePatternType(level, roundNumber);
  const patternUnits = buildPatternUnits(level, patternType);

  const fullLength = patternType === 'ABC' ? 7 : 6;
  const fullSequence = repeatPattern(patternUnits, fullLength);

  const missingIndex = patternType === 'repair' ? Math.max(1, randomInt(fullLength - 2) + 1) : fullLength - 1;
  const expected = fullSequence[missingIndex] as CarToken;

  return {
    level,
    patternType,
    fullSequence,
    expected,
    missingIndex,
    theme: THEMES[(roundNumber - 1) % THEMES.length] as RoundTheme,
    instructionKey: buildInstructionKey(patternType, roundNumber),
    promptKey: buildPromptKey(patternType),
  };
}

function buildRoundState(params: {
  roundNumber: number;
  level: PatternLevel;
  similarityTier: number;
  maxConcurrentChoices: number;
}): RoundState {
  const objective = buildRoundObjective(params.roundNumber, params.level);
  const baseOptionCount = LEVEL_OPTION_COUNT[params.level];
  const options = buildOptions(objective, baseOptionCount, params.similarityTier, params.maxConcurrentChoices);

  const slots = objective.fullSequence.map((token, index) => (index === objective.missingIndex ? null : token));

  return {
    ...objective,
    id: `pattern-train-round-${params.roundNumber}-${params.level}-${objective.patternType}-${randomInt(1_000_000)}`,
    slots,
    options,
    supportMode: false,
    ghostHint: false,
  };
}

function withSupportMode(round: RoundState): RoundState {
  if (round.options.length <= 2) {
    return {
      ...round,
      supportMode: true,
    };
  }

  const expectedKey = toTokenKey(round.expected);
  const distractors = round.options.filter((option) => toTokenKey(option) !== expectedKey);
  const reduced = distractors.slice(0, Math.max(1, distractors.length - 1));

  return {
    ...round,
    supportMode: true,
    options: shuffle([round.expected, ...reduced]),
  };
}

function resolveAdaptiveLevel(currentLevel: PatternLevel, history: RoundHistoryEntry[]): PatternLevel {
  if (currentLevel === 1) {
    const recentLevelOne = history.filter((entry) => entry.level === 1).slice(-LEVEL_ONE_GATE_WINDOW);
    if (recentLevelOne.length >= LEVEL_ONE_GATE_WINDOW) {
      const firstTryRate = (recentLevelOne.filter((entry) => entry.firstTry).length / LEVEL_ONE_GATE_WINDOW) * 100;
      if (firstTryRate >= 75) {
        return 2;
      }
    }
  }

  if (currentLevel === 2) {
    const recentLevelTwo = history.filter((entry) => entry.level === 2).slice(-LEVEL_TWO_GATE_WINDOW);
    if (recentLevelTwo.length >= LEVEL_TWO_GATE_WINDOW) {
      const firstTryRate = (recentLevelTwo.filter((entry) => entry.firstTry).length / LEVEL_TWO_GATE_WINDOW) * 100;
      const hintRate = (recentLevelTwo.filter((entry) => entry.usedHint).length / LEVEL_TWO_GATE_WINDOW) * 100;
      if (firstTryRate >= 80 && hintRate <= 30) {
        return 3;
      }
    }
  }

  return currentLevel;
}

function computePatternAccuracy(stats: SessionStats): Record<PatternMetricType, number> {
  const output: Record<PatternMetricType, number> = {
    AB: 0,
    AAB: 0,
    ABC: 0,
    repair: 0,
  };

  for (const patternType of Object.keys(output) as PatternMetricType[]) {
    const patternStats = stats.patternStats[patternType];
    output[patternType] = patternStats.attempts > 0
      ? Math.round((patternStats.firstTryHits / patternStats.attempts) * 100)
      : 0;
  }

  return output;
}

function resolveTopMisconception(stats: SessionStats): PatternMisconception {
  const entries = Object.entries(stats.misconceptionCounts) as Array<[PatternMisconception, number]>;
  const sorted = entries.sort((left, right) => right[1] - left[1]);
  return sorted[0]?.[0] ?? 'rule-skip';
}

function resolveFocusPattern(patternAccuracy: Record<PatternMetricType, number>): PatternMetricType {
  const entries = Object.entries(patternAccuracy) as Array<[PatternMetricType, number]>;
  const sorted = entries.sort((left, right) => left[1] - right[1]);
  return sorted[0]?.[0] ?? 'AB';
}

export function PatternTrainGame({ level, child, onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir(i18n.language));
  const replayIcon = rtlReplayGlyph(isRtl);
  const nextIcon = rtlNextGlyph(isRtl);

  const maxConcurrentChoices = useMemo(
    () => resolveGameConcurrentChoiceLimit(level.configJson, child.birthDate),
    [child.birthDate, level.configJson],
  );

  const [roundNumber, setRoundNumber] = useState(1);
  const [adaptiveLevel, setAdaptiveLevel] = useState<PatternLevel>(1);
  const [distractorSimilarity, setDistractorSimilarity] = useState(0);
  const [round, setRound] = useState<RoundState>(() =>
    buildRoundState({
      roundNumber: 1,
      level: 1,
      similarityTier: 0,
      maxConcurrentChoices,
    }),
  );

  const [stats, setStats] = useState<SessionStats>(INITIAL_STATS);
  const statsRef = useRef<SessionStats>(INITIAL_STATS);

  const [roundSolved, setRoundSolved] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [breakVisible, setBreakVisible] = useState(false);
  const [breakShown, setBreakShown] = useState(false);
  const [hintCountInRound, setHintCountInRound] = useState(0);
  const [attemptInRound, setAttemptInRound] = useState(0);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [consecutiveFirstTrySuccesses, setConsecutiveFirstTrySuccesses] = useState(0);
  const [trainMoving, setTrainMoving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [boardFeedback, setBoardFeedback] = useState<BoardFeedback>('idle');
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);
  const [lastInteractionAt, setLastInteractionAt] = useState(() => Date.now());
  const [message, setMessage] = useState<RoundMessage>({
    key: 'games.patternTrain.instructions.intro',
    tone: 'neutral',
  });

  const interactionLockedRef = useRef(false);
  const inactivityTimeoutRef = useRef<number | null>(null);
  const boardFeedbackTimeoutRef = useRef<number | null>(null);

  const progressSegments = useMemo(() => Array.from({ length: TOTAL_ROUNDS }, (_, index) => index + 1), []);

  const updateStats = useCallback((next: SessionStats) => {
    statsRef.current = next;
    setStats(next);
  }, []);

  const playNow = useCallback(
    async (key: StatusKey) => {
      if (audioPlaybackFailed) {
        return;
      }

      try {
        await audio.playNow(resolveAudioPath(key));
      } catch {
        setAudioPlaybackFailed((current) => current || true);
      }
    },
    [audio, audioPlaybackFailed],
  );

  const playQueued = useCallback(
    async (key: StatusKey) => {
      if (audioPlaybackFailed) {
        return;
      }

      try {
        await audio.play(resolveAudioPath(key));
      } catch {
        setAudioPlaybackFailed((current) => current || true);
      }
    },
    [audio, audioPlaybackFailed],
  );

  const triggerBoardFeedback = useCallback((nextFeedback: Exclude<BoardFeedback, 'idle'>) => {
    setBoardFeedback(nextFeedback);
    if (boardFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(boardFeedbackTimeoutRef.current);
    }

    boardFeedbackTimeoutRef.current = window.setTimeout(() => {
      setBoardFeedback('idle');
      boardFeedbackTimeoutRef.current = null;
    }, 340);
  }, []);

  const announceRound = useCallback(
    async (nextRound: RoundState) => {
      setMessage({ key: nextRound.instructionKey, tone: 'neutral' });
      await playNow(nextRound.instructionKey);
      await playQueued(nextRound.promptKey);
    },
    [playNow, playQueued],
  );

  const finalizeSession = useCallback(
    (finalStats: SessionStats) => {
      const firstTryRate = Math.round((finalStats.firstTryHits / TOTAL_ROUNDS) * 100);
      const roundsWithHint = finalStats.hintUsageByRound.filter((count) => count > 0).length;
      const hintReliance = Math.round((roundsWithHint / Math.max(1, finalStats.hintUsageByRound.length)) * 100);
      const hintTrend = toHintTrend(finalStats.hintUsageByRound);
      const patternAccuracy = computePatternAccuracy(finalStats);
      const topMisconception = resolveTopMisconception(finalStats);
      const focusPattern = resolveFocusPattern(patternAccuracy);

      const summaryMetrics: ParentSummaryMetrics = {
        highestStableRange: toStableRange(firstTryRate),
        firstAttemptSuccessRate: firstTryRate,
        hintTrend,
        accuracyByPatternType: patternAccuracy,
        misconceptionTrend: {
          'rule-skip': finalStats.misconceptionCounts['rule-skip'],
          'distractor-bias': finalStats.misconceptionCounts['distractor-bias'],
          'attribute-confusion': finalStats.misconceptionCounts['attribute-confusion'],
        },
      };

      const completion: GameCompletionResult = {
        completed: true,
        roundsCompleted: TOTAL_ROUNDS,
        score: Math.round(firstTryRate * 0.8 + Math.max(0, 100 - hintReliance) * 0.2),
        stars: firstTryRate >= 85 ? 3 : firstTryRate >= 65 ? 2 : 1,
        summaryMetrics,
      };

      onComplete(completion);

      setSessionSummary({
        firstTryRate,
        hintReliance,
        hintTrend,
        topMisconception,
        focusPattern,
      });
      setSessionComplete(true);
      setMessage({ key: 'feedback.excellent', tone: 'success' });
      void playNow('feedback.excellent');
    },
    [onComplete, playNow],
  );

  const buildNextRound = useCallback(
    (nextRoundNumber: number, nextLevel: PatternLevel, nextSimilarityTier: number) =>
      buildRoundState({
        roundNumber: nextRoundNumber,
        level: nextLevel,
        similarityTier: nextSimilarityTier,
        maxConcurrentChoices,
      }),
    [maxConcurrentChoices],
  );

  const goToNextRound = useCallback(() => {
    if (!roundSolved || sessionComplete) {
      return;
    }

    if (roundNumber >= TOTAL_ROUNDS) {
      finalizeSession(statsRef.current);
      return;
    }

    const nextRoundNumber = roundNumber + 1;
    const resolvedLevel = resolveAdaptiveLevel(adaptiveLevel, statsRef.current.roundHistory);
    if (resolvedLevel !== adaptiveLevel) {
      setAdaptiveLevel(resolvedLevel);
    }

    setRoundNumber(nextRoundNumber);
    setRound(buildNextRound(nextRoundNumber, resolvedLevel, distractorSimilarity));

    setRoundSolved(false);
    setHintCountInRound(0);
    setAttemptInRound(0);
    setConsecutiveMisses(0);
    setTrainMoving(false);
    setDragOver(false);
    setLastInteractionAt(Date.now());

    if (nextRoundNumber === BREAK_AFTER_ROUND + 1 && !breakShown) {
      setBreakShown(true);
      setBreakVisible(true);
    }
  }, [
    adaptiveLevel,
    breakShown,
    buildNextRound,
    distractorSimilarity,
    finalizeSession,
    roundNumber,
    roundSolved,
    sessionComplete,
  ]);

  const markRoundSuccess = useCallback(() => {
    const firstTry = attemptInRound === 0;
    const metricPatternType = toMetricPatternType(round.patternType);

    const previous = statsRef.current;
    const next: SessionStats = {
      ...previous,
      totalAttempts: previous.totalAttempts + 1,
      firstTryHits: previous.firstTryHits + (firstTry ? 1 : 0),
      hintUsageByRound: [...previous.hintUsageByRound, hintCountInRound],
      roundHistory: [
        ...previous.roundHistory,
        {
          level: round.level,
          firstTry,
          usedHint: hintCountInRound > 0,
        },
      ],
      patternStats: {
        ...previous.patternStats,
        [metricPatternType]: {
          attempts: previous.patternStats[metricPatternType].attempts + 1,
          firstTryHits: previous.patternStats[metricPatternType].firstTryHits + (firstTry ? 1 : 0),
        },
      },
    };

    updateStats(next);

    const nextStreak = firstTry ? consecutiveFirstTrySuccesses + 1 : 0;
    if (nextStreak >= FIRST_TRY_STREAK_TO_RAISE) {
      setDistractorSimilarity((current) => Math.min(2, current + 1));
      setConsecutiveFirstTrySuccesses(0);
    } else {
      setConsecutiveFirstTrySuccesses(nextStreak);
    }

    setRoundSolved(true);
    setConsecutiveMisses(0);
    setTrainMoving(true);
    triggerBoardFeedback('success');

    const successKey = pickRandom(SUCCESS_ROTATION);
    setMessage({ key: successKey, tone: 'success' });
    void (async () => {
      await playNow(successKey);
      await playQueued('games.patternTrain.feedback.success.ruleReinforcement');
    })();
  }, [
    attemptInRound,
    consecutiveFirstTrySuccesses,
    hintCountInRound,
    playNow,
    playQueued,
    round.level,
    round.patternType,
    triggerBoardFeedback,
    updateStats,
  ]);

  const markRoundMiss = useCallback(
    (selected: CarToken) => {
      const misconception = classifyMisconception(selected, round);

      const previous = statsRef.current;
      const next: SessionStats = {
        ...previous,
        totalAttempts: previous.totalAttempts + 1,
        misconceptionCounts: {
          ...previous.misconceptionCounts,
          [misconception]: previous.misconceptionCounts[misconception] + 1,
        },
      };
      updateStats(next);

      setAttemptInRound((current) => current + 1);
      setConsecutiveFirstTrySuccesses(0);
      triggerBoardFeedback('miss');

      setConsecutiveMisses((current) => {
        const nextMisses = current + 1;

        if (nextMisses >= SUPPORT_MISS_THRESHOLD) {
          setRound((currentRound) => (currentRound.supportMode ? currentRound : withSupportMode(currentRound)));
          setMessage({ key: 'games.patternTrain.recovery.slowerReplay', tone: 'hint' });
          void (async () => {
            await playNow('games.patternTrain.recovery.slowerReplay');
            await playQueued(round.promptKey);
          })();
        } else {
          const encouragement = pickRandom(ENCOURAGEMENT_ROTATION);
          setMessage({ key: encouragement, tone: 'hint' });
          void playNow(encouragement);
        }

        return nextMisses;
      });
    },
    [playNow, playQueued, round, triggerBoardFeedback, updateStats],
  );

  const handlePlaceOption = useCallback(
    (option: CarToken) => {
      if (interactionLockedRef.current || sessionComplete || breakVisible || roundSolved) {
        return;
      }

      interactionLockedRef.current = true;
      setLastInteractionAt(Date.now());

      try {
        if (tokensEqual(option, round.expected)) {
          markRoundSuccess();
          return;
        }

        markRoundMiss(option);
      } finally {
        window.setTimeout(() => {
          interactionLockedRef.current = false;
        }, 60);
      }
    },
    [breakVisible, markRoundMiss, markRoundSuccess, round.expected, roundSolved, sessionComplete],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      setDragOver(false);
      if (roundSolved || sessionComplete || breakVisible) {
        return;
      }

      const optionId = event.dataTransfer.getData('text/plain');
      if (!optionId) {
        return;
      }

      const selected = round.options.find((option) => option.id === optionId);
      if (!selected) {
        return;
      }

      handlePlaceOption(selected);
    },
    [breakVisible, handlePlaceOption, round.options, roundSolved, sessionComplete],
  );

  const handleReplay = useCallback(() => {
    if (sessionComplete || breakVisible) {
      return;
    }

    setLastInteractionAt(Date.now());
    setMessage({ key: 'games.patternTrain.instructions.tapReplay', tone: 'neutral' });
    void (async () => {
      await playNow('games.patternTrain.instructions.tapReplay');
      await playQueued(round.promptKey);
    })();
  }, [breakVisible, playNow, playQueued, round.promptKey, sessionComplete]);

  const handleRetry = useCallback(() => {
    if (sessionComplete || breakVisible) {
      return;
    }

    setLastInteractionAt(Date.now());
    setAttemptInRound(0);
    setConsecutiveMisses(0);
    setRoundSolved(false);
    setRound((current) => (current.supportMode ? current : withSupportMode(current)));
    setMessage({ key: 'games.patternTrain.recovery.supportiveRetry', tone: 'hint' });

    void (async () => {
      await playNow('games.patternTrain.recovery.supportiveRetry');
      await playQueued(round.promptKey);
    })();
  }, [breakVisible, playNow, playQueued, round.promptKey, sessionComplete]);

  const handleHint = useCallback(() => {
    if (sessionComplete || breakVisible || roundSolved) {
      return;
    }

    setLastInteractionAt(Date.now());

    setHintCountInRound((current) => {
      const next = current + 1;

      const hintKey =
        next >= 3 || consecutiveMisses >= 2
          ? 'games.patternTrain.hints.thirdGhost'
          : next === 2 || consecutiveMisses === 1
            ? 'games.patternTrain.hints.secondCompare'
            : 'games.patternTrain.hints.firstLook';

      if (next >= 3 || consecutiveMisses >= 2) {
        setRound((currentRound) => ({
          ...currentRound,
          ghostHint: true,
        }));
      }

      setMessage({ key: hintKey, tone: 'hint' });
      void playNow(hintKey);

      return next;
    });
  }, [breakVisible, consecutiveMisses, playNow, roundSolved, sessionComplete]);

  const handleContinueFromBreak = useCallback(() => {
    setBreakVisible(false);
    setMessage({ key: 'games.patternTrain.instructions.listenRule', tone: 'neutral' });
    void announceRound(round);
  }, [announceRound, round]);

  useEffect(() => {
    statsRef.current = INITIAL_STATS;
    setStats(INITIAL_STATS);
    setRoundNumber(1);
    setAdaptiveLevel(1);
    setDistractorSimilarity(0);
    setRound(
      buildRoundState({
        roundNumber: 1,
        level: 1,
        similarityTier: 0,
        maxConcurrentChoices,
      }),
    );
    setRoundSolved(false);
    setSessionComplete(false);
    setSessionSummary(null);
    setHintCountInRound(0);
    setAttemptInRound(0);
    setConsecutiveMisses(0);
    setConsecutiveFirstTrySuccesses(0);
    setTrainMoving(false);
    setDragOver(false);
    setBreakVisible(false);
    setBreakShown(false);
    setBoardFeedback('idle');
    setMessage({ key: 'games.patternTrain.instructions.intro', tone: 'neutral' });
  }, [maxConcurrentChoices]);

  useEffect(() => {
    if (sessionComplete || breakVisible) {
      return;
    }

    setHintCountInRound(0);
    setAttemptInRound(0);
    setConsecutiveMisses(0);
    setRoundSolved(false);
    setTrainMoving(false);
    setDragOver(false);
    setMessage({ key: round.instructionKey, tone: 'neutral' });
    void announceRound(round);
  }, [announceRound, breakVisible, round.id, round.instructionKey, sessionComplete]);

  useEffect(() => {
    if (sessionComplete || breakVisible || roundSolved) {
      return;
    }

    if (inactivityTimeoutRef.current !== null) {
      window.clearTimeout(inactivityTimeoutRef.current);
    }

    inactivityTimeoutRef.current = window.setTimeout(() => {
      if (sessionComplete || breakVisible || roundSolved) {
        return;
      }

      setHintCountInRound((current) => current + 1);
      setMessage({ key: 'games.patternTrain.recovery.focusRule', tone: 'hint' });
      void (async () => {
        await playNow('games.patternTrain.recovery.focusRule');
        await playQueued(round.promptKey);
      })();
    }, 8000);

    return () => {
      if (inactivityTimeoutRef.current !== null) {
        window.clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
    };
  }, [breakVisible, lastInteractionAt, playNow, playQueued, round.promptKey, roundSolved, sessionComplete]);

  useEffect(
    () => () => {
      if (inactivityTimeoutRef.current !== null) {
        window.clearTimeout(inactivityTimeoutRef.current);
      }
      if (boardFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(boardFeedbackTimeoutRef.current);
      }
    },
    [],
  );

  const focusPatternLabel = sessionSummary ? t(PATTERN_LABEL_KEY[sessionSummary.focusPattern] as any) : t(PATTERN_LABEL_KEY.AB as any);
  const topMisconceptionLabel = sessionSummary
    ? t(MISCONCEPTION_LABEL_KEY[sessionSummary.topMisconception] as any)
    : t(MISCONCEPTION_LABEL_KEY['rule-skip'] as any);

  const toneClassName = `pattern-train__message pattern-train__message--${message.tone}`;

  return (
    <Card padding="lg" className="pattern-train">
      <div className="pattern-train__header">
        <div>
          <h2 className="pattern-train__title">{t('games.patternTrain.title')}</h2>
          <p className="pattern-train__subtitle">{t('games.patternTrain.subtitle')}</p>
        </div>

        <div className="pattern-train__status-pills" aria-live="polite">
          <span className="pattern-train__status-pill">
            🎯 {Math.min(roundNumber, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}
          </span>
          <span className="pattern-train__status-pill">⭐ {stats.firstTryHits}</span>
        </div>
      </div>

      <div className="pattern-train__progress" aria-hidden="true">
        {progressSegments.map((segment) => {
          const state =
            segment < roundNumber
              ? 'done'
              : segment === roundNumber
                ? 'active'
                : 'pending';

          return <span key={`pattern-segment-${segment}`} className={`pattern-train__progress-dot pattern-train__progress-dot--${state}`} />;
        })}
      </div>

      <div className="pattern-train__status-row">
        <MascotIllustration variant={message.tone === 'success' ? 'success' : 'hint'} size={52} />
        <div>
          <p className={toneClassName}>{t(message.key as any)}</p>
          <p className="pattern-train__theme-label">{t(`games.patternTrain.themes.${round.theme}` as any)}</p>
        </div>
      </div>

      {audioPlaybackFailed && !sessionComplete ? (
        <p className="pattern-train__audio-fallback">🔇 {t('games.patternTrain.instructions.listenRule')}</p>
      ) : null}

      {!sessionComplete ? (
        <div className="pattern-train__controls">
          <button type="button" className="pattern-train__icon-button" onClick={handleReplay} aria-label={t('games.patternTrain.controls.replay')}>
            {replayIcon}
          </button>
          <button type="button" className="pattern-train__icon-button" onClick={handleRetry} aria-label={t('games.patternTrain.controls.retry')}>
            ↻
          </button>
          <button type="button" className="pattern-train__icon-button" onClick={handleHint} aria-label={t('games.patternTrain.controls.hint')}>
            💡
          </button>
          <button
            type="button"
            className="pattern-train__icon-button"
            onClick={goToNextRound}
            aria-label={t('games.patternTrain.controls.next')}
            disabled={!roundSolved}
          >
            {nextIcon}
          </button>
        </div>
      ) : null}

      <div
        className={[
          'pattern-train__train-track',
          trainMoving ? 'pattern-train__train-track--moving' : '',
          boardFeedback === 'success' ? 'pattern-train__train-track--success' : '',
          boardFeedback === 'miss' ? 'pattern-train__train-track--miss' : '',
        ].join(' ')}
      >
        <div className="pattern-train__train" dir="rtl">
          {round.slots.map((slot, index) => {
            const isMissing = index === round.missingIndex;
            const slotClass = [
              'pattern-train__slot',
              isMissing ? 'is-missing' : '',
              dragOver && isMissing ? 'is-drag-over' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={`slot-${round.id}-${index}`}
                className={slotClass}
                onDragOver={(event) => {
                  if (!isMissing || roundSolved || sessionComplete || breakVisible) {
                    return;
                  }
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => {
                  if (isMissing) {
                    setDragOver(false);
                  }
                }}
                onDrop={isMissing ? handleDrop : undefined}
                role={isMissing ? 'button' : undefined}
                aria-label={
                  isMissing
                    ? t('games.patternTrain.cars.slotAria', {
                      index: index + 1,
                    })
                    : undefined
                }
              >
                {slot ? (
                  <span
                    className="pattern-train__car"
                    style={{
                      ['--pattern-train-car-color' as string]: COLOR_HEX[slot.color],
                    }}
                  >
                    <span className="pattern-train__car-symbol">{SHAPE_SYMBOL[slot.shape]}</span>
                  </span>
                ) : round.ghostHint ? (
                  <span
                    className="pattern-train__car pattern-train__car--ghost"
                    style={{
                      ['--pattern-train-car-color' as string]: COLOR_HEX[round.expected.color],
                    }}
                  >
                    <span className="pattern-train__car-symbol">{SHAPE_SYMBOL[round.expected.shape]}</span>
                  </span>
                ) : (
                  <span className="pattern-train__slot-placeholder">?</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pattern-train__options" dir="rtl">
        {round.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="pattern-train__option"
            draggable={!roundSolved && !sessionComplete && !breakVisible}
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', option.id);
              event.dataTransfer.effectAllowed = 'move';
            }}
            onClick={() => handlePlaceOption(option)}
            disabled={roundSolved || sessionComplete || breakVisible}
            aria-label={t('games.patternTrain.cars.optionAria', {
              color: t(`games.patternTrain.cars.colors.${option.color}`),
              shape: t(`games.patternTrain.cars.shapes.${option.shape}`),
            })}
          >
            <span
              className="pattern-train__car"
              style={{
                ['--pattern-train-car-color' as string]: COLOR_HEX[option.color],
              }}
            >
              <span className="pattern-train__car-symbol">{SHAPE_SYMBOL[option.shape]}</span>
            </span>
          </button>
        ))}
      </div>

      {breakVisible && !sessionComplete ? (
        <div className="pattern-train__break-card" role="dialog" aria-modal="true" aria-live="polite">
          <p className="pattern-train__break-text">{t('games.patternTrain.instructions.miniBreak')}</p>
          <button type="button" className="pattern-train__break-button" onClick={handleContinueFromBreak}>
            {nextIcon} {t('games.patternTrain.controls.continue')}
          </button>
        </div>
      ) : null}

      {sessionComplete && sessionSummary ? (
        <div className="pattern-train__summary" role="status" aria-live="polite">
          <p>
            {t('parentDashboard.games.patternTrain.progressSummary', {
              firstTryRate: `${sessionSummary.firstTryRate}%`,
              hintReliance: `${sessionSummary.hintReliance}%`,
              topMisconception: topMisconceptionLabel,
            })}
          </p>
          <p>
            {t('parentDashboard.games.patternTrain.patternBreakdown', {
              focusPattern: focusPatternLabel,
            })}
          </p>
          <p>{t('parentDashboard.games.patternTrain.nextStep')}</p>
        </div>
      ) : null}

      {sessionComplete ? <SuccessCelebration /> : null}

      <style>{`
        .pattern-train {
          position: relative;
          display: grid;
          gap: var(--space-md);
          background: color-mix(in srgb, var(--color-surface-elevated) 92%, #fff 8%);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 18%, transparent);
        }

        .pattern-train__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-sm);
        }

        .pattern-train__title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-xl);
        }

        .pattern-train__subtitle {
          margin: var(--space-2xs) 0 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .pattern-train__status-pills {
          display: flex;
          align-items: center;
          gap: var(--space-2xs);
        }

        .pattern-train__status-pill {
          display: inline-flex;
          align-items: center;
          gap: var(--space-3xs);
          min-block-size: 36px;
          padding-inline: var(--space-xs);
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-accent-primary) 14%, transparent);
          color: var(--color-text-primary);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
        }

        .pattern-train__progress {
          display: grid;
          grid-template-columns: repeat(${TOTAL_ROUNDS}, minmax(0, 1fr));
          gap: var(--space-3xs);
        }

        .pattern-train__progress-dot {
          block-size: 8px;
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-text-secondary) 18%, transparent);
          transition: transform 0.18s ease, background-color 0.18s ease;
        }

        .pattern-train__progress-dot--done {
          background: color-mix(in srgb, var(--color-accent-success) 84%, white 16%);
        }

        .pattern-train__progress-dot--active {
          background: color-mix(in srgb, var(--color-accent-primary) 88%, white 12%);
          transform: scaleY(1.25);
        }

        .pattern-train__status-row {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm);
          border-radius: var(--radius-lg);
          background: color-mix(in srgb, var(--color-accent-primary) 10%, transparent);
        }

        .pattern-train__message {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
        }

        .pattern-train__message--hint {
          color: color-mix(in srgb, var(--color-accent-warning) 78%, var(--color-text-primary));
        }

        .pattern-train__message--success {
          color: color-mix(in srgb, var(--color-accent-success) 78%, var(--color-text-primary));
        }

        .pattern-train__theme-label {
          margin: var(--space-3xs) 0 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
        }

        .pattern-train__audio-fallback {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .pattern-train__controls {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--space-xs);
        }

        .pattern-train__icon-button {
          min-inline-size: 44px;
          min-block-size: 52px;
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 30%, transparent);
          background: color-mix(in srgb, var(--color-surface-elevated) 88%, #fff 12%);
          font-size: 1.25rem;
          color: var(--color-text-primary);
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .pattern-train__icon-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .pattern-train__icon-button:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px color-mix(in srgb, var(--color-accent-primary) 20%, transparent);
        }

        .pattern-train__train-track {
          position: relative;
          border-radius: var(--radius-xl);
          padding: var(--space-md);
          background:
            radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--color-accent-secondary) 28%, transparent), transparent 48%),
            linear-gradient(120deg, color-mix(in srgb, var(--color-accent-primary) 8%, transparent), color-mix(in srgb, var(--color-accent-success) 8%, transparent));
          transition: transform 0.2s ease;
        }

        .pattern-train__train-track--moving {
          animation: pattern-train-move 0.6s ease;
        }

        .pattern-train__train-track--success {
          animation: pattern-train-success 0.4s ease;
        }

        .pattern-train__train-track--miss {
          animation: pattern-train-miss 0.3s ease;
        }

        .pattern-train__train {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: var(--space-xs);
          flex-wrap: wrap;
          direction: rtl;
        }

        .pattern-train__slot {
          min-inline-size: 72px;
          min-block-size: 72px;
          border-radius: var(--radius-lg);
          border: 2px dashed color-mix(in srgb, var(--color-text-secondary) 24%, transparent);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--color-surface-elevated) 84%, transparent);
          transition: border-color 0.2s ease, transform 0.2s ease;
        }

        .pattern-train__slot.is-missing {
          border-color: color-mix(in srgb, var(--color-accent-primary) 55%, transparent);
          background: color-mix(in srgb, var(--color-accent-primary) 10%, transparent);
        }

        .pattern-train__slot.is-drag-over {
          transform: translateY(-2px);
          border-color: color-mix(in srgb, var(--color-accent-success) 78%, transparent);
        }

        .pattern-train__slot-placeholder {
          font-size: 1.4rem;
          font-weight: var(--font-weight-bold);
          color: color-mix(in srgb, var(--color-text-secondary) 80%, transparent);
        }

        .pattern-train__options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
          gap: var(--space-xs);
        }

        .pattern-train__option {
          min-inline-size: 44px;
          min-block-size: 72px;
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 25%, transparent);
          background: color-mix(in srgb, var(--color-surface-elevated) 90%, #fff 10%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .pattern-train__option:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .pattern-train__option:not(:disabled):hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 18px color-mix(in srgb, var(--color-accent-primary) 20%, transparent);
        }

        .pattern-train__car {
          --pattern-train-car-color: #94a3b8;
          inline-size: 56px;
          block-size: 56px;
          border-radius: var(--radius-lg);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(140deg, var(--pattern-train-car-color), color-mix(in srgb, var(--pattern-train-car-color) 68%, white 32%));
          box-shadow:
            inset 0 -6px 0 color-mix(in srgb, #000 12%, transparent),
            0 6px 12px color-mix(in srgb, #000 18%, transparent);
        }

        .pattern-train__car--ghost {
          opacity: 0.38;
        }

        .pattern-train__car-symbol {
          color: #fff;
          font-size: 1.45rem;
          font-weight: var(--font-weight-bold);
          text-shadow: 0 2px 4px color-mix(in srgb, #000 30%, transparent);
        }

        .pattern-train__break-card {
          position: absolute;
          inset: 16% 12%;
          z-index: 2;
          border-radius: var(--radius-xl);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 30%, transparent);
          background: color-mix(in srgb, var(--color-surface-elevated) 96%, #fff 4%);
          box-shadow: 0 16px 32px color-mix(in srgb, #000 22%, transparent);
          padding: var(--space-lg);
          display: grid;
          align-content: center;
          justify-items: center;
          gap: var(--space-md);
          text-align: center;
        }

        .pattern-train__break-text {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
        }

        .pattern-train__break-button {
          min-inline-size: 44px;
          min-block-size: 52px;
          padding-inline: var(--space-md);
          border-radius: var(--radius-full);
          border: none;
          background: color-mix(in srgb, var(--color-accent-primary) 85%, #fff 15%);
          color: #fff;
          font-weight: var(--font-weight-semibold);
          font-size: var(--font-size-sm);
          cursor: pointer;
        }

        .pattern-train__summary {
          display: grid;
          gap: var(--space-2xs);
          padding: var(--space-sm);
          border-radius: var(--radius-lg);
          background: color-mix(in srgb, var(--color-accent-success) 11%, transparent);
          color: var(--color-text-primary);
        }

        .pattern-train__summary p {
          margin: 0;
        }

        @keyframes pattern-train-move {
          0% { transform: translateX(0); }
          50% { transform: translateX(-8px); }
          100% { transform: translateX(0); }
        }

        @keyframes pattern-train-success {
          0% { transform: scale(1); }
          50% { transform: scale(1.01); }
          100% { transform: scale(1); }
        }

        @keyframes pattern-train-miss {
          0% { transform: translateX(0); }
          30% { transform: translateX(5px); }
          60% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }

        @media (max-width: 820px) {
          .pattern-train {
            padding: var(--space-md);
          }

          .pattern-train__header {
            flex-direction: column;
            align-items: stretch;
          }

          .pattern-train__controls {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .pattern-train__slot {
            min-inline-size: 62px;
            min-block-size: 62px;
          }

          .pattern-train__car {
            inline-size: 50px;
            block-size: 50px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pattern-train__icon-button,
          .pattern-train__option,
          .pattern-train__train-track,
          .pattern-train__progress-dot {
            transition: none !important;
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </Card>
  );
}
