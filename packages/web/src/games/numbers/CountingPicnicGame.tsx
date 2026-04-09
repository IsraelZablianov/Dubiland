import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import type { GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';

type GameLevelId = 1 | 2 | 3;
type HintTone = 'neutral' | 'hint' | 'success';
type CountingNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type StatusKey =
  | 'games.countingPicnic.instructions.intro'
  | 'games.countingPicnic.instructions.dragOneByOne'
  | 'games.countingPicnic.instructions.tapCheck'
  | 'games.countingPicnic.instructions.listenAndCount'
  | 'games.countingPicnic.hints.countSlowly'
  | 'games.countingPicnic.hints.oneAtATime'
  | 'games.countingPicnic.hints.useReplay'
  | 'games.countingPicnic.hints.gentleRetry'
  | 'games.countingPicnic.roundComplete.greatCounting'
  | 'games.countingPicnic.roundComplete.basketReady'
  | 'games.countingPicnic.roundComplete.nextNumber'
  | 'games.countingPicnic.feedback.encouragement.keepTrying'
  | 'games.countingPicnic.feedback.encouragement.almostThere'
  | 'games.countingPicnic.feedback.encouragement.tryAgain'
  | 'feedback.greatEffort'
  | 'feedback.keepGoing'
  | 'feedback.excellent'
  | 'feedback.youDidIt';

type AudioKey = keyof typeof AUDIO_PATH_BY_KEY;

interface RoundMessage {
  key: StatusKey;
  values?: { count: number };
  tone: HintTone;
}

interface TrayItem {
  id: string;
  emoji: string;
  isTarget: boolean;
}

interface RoundState {
  id: string;
  roundNumber: number;
  level: GameLevelId;
  targetCount: CountingNumber;
  targetEmoji: string;
  trayItems: TrayItem[];
  fallbackMode: boolean;
}

interface SessionStats {
  firstAttemptSuccesses: number;
  hintUsageByRound: number[];
  highestTargetReached: number;
}

interface RangeConfig {
  min: CountingNumber;
  max: CountingNumber;
}

const TOTAL_ROUNDS = 8;
const MIDPOINT_ROUND = 4;

const RANGE_BY_LEVEL: Record<GameLevelId, RangeConfig> = {
  1: { min: 1, max: 3 },
  2: { min: 1, max: 5 },
  3: { min: 1, max: 10 },
};

const OBJECT_PACKS = [
  {
    targets: ['🍎', '🍐', '🍓'],
    distractors: ['🍋', '🥝'],
  },
  {
    targets: ['🧸', '🪀', '🧩'],
    distractors: ['🚗', '🎈'],
  },
  {
    targets: ['🏖️', '🐚', '🦀'],
    distractors: ['🐠', '🪣'],
  },
] as const;

const ROUND_SUCCESS_ROTATION: Array<
  | 'games.countingPicnic.roundComplete.greatCounting'
  | 'games.countingPicnic.roundComplete.basketReady'
  | 'games.countingPicnic.roundComplete.nextNumber'
> = [
  'games.countingPicnic.roundComplete.greatCounting',
  'games.countingPicnic.roundComplete.basketReady',
  'games.countingPicnic.roundComplete.nextNumber',
];

const NUMBER_KEY_BY_VALUE: Record<CountingNumber, AudioKey> = {
  1: 'games.countingPicnic.numbers.1',
  2: 'games.countingPicnic.numbers.2',
  3: 'games.countingPicnic.numbers.3',
  4: 'games.countingPicnic.numbers.4',
  5: 'games.countingPicnic.numbers.5',
  6: 'games.countingPicnic.numbers.6',
  7: 'games.countingPicnic.numbers.7',
  8: 'games.countingPicnic.numbers.8',
  9: 'games.countingPicnic.numbers.9',
  10: 'games.countingPicnic.numbers.10',
};

const AUDIO_PATH_BY_KEY = {
  'games.countingPicnic.instructions.intro':
    '/audio/he/games/counting-picnic/instructions/intro.mp3',
  'games.countingPicnic.instructions.dragOneByOne':
    '/audio/he/games/counting-picnic/instructions/drag-one-by-one.mp3',
  'games.countingPicnic.instructions.tapCheck':
    '/audio/he/games/counting-picnic/instructions/tap-check.mp3',
  'games.countingPicnic.instructions.listenAndCount':
    '/audio/he/games/counting-picnic/instructions/listen-and-count.mp3',
  'games.countingPicnic.hints.countSlowly': '/audio/he/games/counting-picnic/hints/count-slowly.mp3',
  'games.countingPicnic.hints.oneAtATime': '/audio/he/games/counting-picnic/hints/one-at-atime.mp3',
  'games.countingPicnic.hints.useReplay': '/audio/he/games/counting-picnic/hints/use-replay.mp3',
  'games.countingPicnic.hints.gentleRetry': '/audio/he/games/counting-picnic/hints/gentle-retry.mp3',
  'games.countingPicnic.roundComplete.greatCounting':
    '/audio/he/games/counting-picnic/round-complete/great-counting.mp3',
  'games.countingPicnic.roundComplete.basketReady':
    '/audio/he/games/counting-picnic/round-complete/basket-ready.mp3',
  'games.countingPicnic.roundComplete.nextNumber':
    '/audio/he/games/counting-picnic/round-complete/next-number.mp3',
  'games.countingPicnic.feedback.encouragement.keepTrying':
    '/audio/he/games/counting-picnic/feedback/encouragement/keep-trying.mp3',
  'games.countingPicnic.feedback.encouragement.almostThere':
    '/audio/he/games/counting-picnic/feedback/encouragement/almost-there.mp3',
  'games.countingPicnic.feedback.encouragement.tryAgain':
    '/audio/he/games/counting-picnic/feedback/encouragement/try-again.mp3',
  'games.countingPicnic.feedback.success.wellDone':
    '/audio/he/games/counting-picnic/feedback/success/well-done.mp3',
  'games.countingPicnic.feedback.success.amazing':
    '/audio/he/games/counting-picnic/feedback/success/amazing.mp3',
  'games.countingPicnic.feedback.success.celebrate':
    '/audio/he/games/counting-picnic/feedback/success/celebrate.mp3',
  'games.countingPicnic.numbers.1': '/audio/he/games/counting-picnic/numbers/1.mp3',
  'games.countingPicnic.numbers.2': '/audio/he/games/counting-picnic/numbers/2.mp3',
  'games.countingPicnic.numbers.3': '/audio/he/games/counting-picnic/numbers/3.mp3',
  'games.countingPicnic.numbers.4': '/audio/he/games/counting-picnic/numbers/4.mp3',
  'games.countingPicnic.numbers.5': '/audio/he/games/counting-picnic/numbers/5.mp3',
  'games.countingPicnic.numbers.6': '/audio/he/games/counting-picnic/numbers/6.mp3',
  'games.countingPicnic.numbers.7': '/audio/he/games/counting-picnic/numbers/7.mp3',
  'games.countingPicnic.numbers.8': '/audio/he/games/counting-picnic/numbers/8.mp3',
  'games.countingPicnic.numbers.9': '/audio/he/games/counting-picnic/numbers/9.mp3',
  'games.countingPicnic.numbers.10': '/audio/he/games/counting-picnic/numbers/10.mp3',
} as const;

function clampCountingNumber(value: number): CountingNumber {
  if (value <= 1) return 1;
  if (value >= 10) return 10;
  return value as CountingNumber;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)] as T;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function getTargetRange(highestTargetReached: number): StableRange {
  if (highestTargetReached >= 8) {
    return '1-10';
  }
  if (highestTargetReached >= 4) {
    return '1-5';
  }
  return '1-3';
}

function getHintTrend(hintUsageByRound: number[]): ParentSummaryMetrics['hintTrend'] {
  const midpoint = Math.ceil(hintUsageByRound.length / 2);
  const firstHalf = hintUsageByRound.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
  const secondHalf = hintUsageByRound.slice(midpoint).reduce((sum, value) => sum + value, 0);

  if (secondHalf < firstHalf) {
    return 'improving';
  }
  if (secondHalf === firstHalf) {
    return 'steady';
  }
  return 'needs_support';
}

function buildSummaryMetrics(stats: SessionStats): ParentSummaryMetrics {
  const firstAttemptSuccessRate =
    stats.hintUsageByRound.length === 0
      ? 0
      : Math.round((stats.firstAttemptSuccesses / stats.hintUsageByRound.length) * 100);

  return {
    highestStableRange: getTargetRange(stats.highestTargetReached),
    firstAttemptSuccessRate,
    hintTrend: getHintTrend(stats.hintUsageByRound),
  };
}

function getEmojiPools(level: GameLevelId, roundNumber: number): {
  targetPool: string[];
  distractorPool: string[];
  distractorCount: number;
  narratedDropsLimit: number;
} {
  const pack = OBJECT_PACKS[(roundNumber - 1) % OBJECT_PACKS.length];

  if (level === 1) {
    return {
      targetPool: [pack.targets[0]],
      distractorPool: [],
      distractorCount: 0,
      narratedDropsLimit: 10,
    };
  }

  if (level === 2) {
    return {
      targetPool: [...pack.targets.slice(0, 2)],
      distractorPool: [...pack.distractors.slice(0, 1)],
      distractorCount: 3,
      narratedDropsLimit: 3,
    };
  }

  const adjacentPack = OBJECT_PACKS[roundNumber % OBJECT_PACKS.length];
  return {
    targetPool: [...pack.targets],
    distractorPool: [...pack.distractors, adjacentPack.targets[0]],
    distractorCount: 5,
    narratedDropsLimit: 2,
  };
}

function createRound(options: {
  level: GameLevelId;
  roundNumber: number;
  rangeOverride: RangeConfig | null;
  fallbackMode: boolean;
  previousRound: RoundState | null;
}): RoundState {
  const { level, roundNumber, rangeOverride, fallbackMode, previousRound } = options;
  const targetRange = rangeOverride ?? RANGE_BY_LEVEL[level];
  const pools = getEmojiPools(level, roundNumber);

  let targetCount = clampCountingNumber(randomInt(targetRange.min, targetRange.max));
  if (level === 3 && previousRound && roundNumber % 2 === 0) {
    targetCount = previousRound.targetCount;
  }

  let targetEmoji = pickRandom(pools.targetPool);
  if (level === 3 && previousRound && roundNumber % 2 === 0) {
    const alternatives = pools.targetPool.filter((emoji) => emoji !== previousRound.targetEmoji);
    if (alternatives.length > 0) {
      targetEmoji = pickRandom(alternatives);
    }
  }

  const targetInventoryCount = Math.max(targetCount + 4, 10);
  const targetItems: TrayItem[] = Array.from({ length: targetInventoryCount }, (_, index) => ({
    id: `target-${roundNumber}-${index}`,
    emoji: targetEmoji,
    isTarget: true,
  }));

  const distractorItems: TrayItem[] = Array.from(
    { length: pools.distractorCount },
    (_, index): TrayItem => ({
      id: `distractor-${roundNumber}-${index}`,
      emoji: pickRandom(pools.distractorPool),
      isTarget: false,
    }),
  );

  return {
    id: `round-${roundNumber}-${level}`,
    roundNumber,
    level,
    targetCount,
    targetEmoji,
    trayItems: shuffle([...targetItems, ...distractorItems]),
    fallbackMode,
  };
}

function getRangeOverrideForFallback(level: GameLevelId): RangeConfig | null {
  if (level === 1) {
    return null;
  }
  return RANGE_BY_LEVEL[(level - 1) as GameLevelId];
}

function getFeedbackKeyFromHintTrend(hintTrend: ParentSummaryMetrics['hintTrend']): StatusKey {
  if (hintTrend === 'improving') {
    return 'feedback.excellent';
  }
  if (hintTrend === 'steady') {
    return 'feedback.keepGoing';
  }
  return 'feedback.greatEffort';
}

export function CountingPicnicGame({ onComplete, audio }: GameProps) {
  const { t } = useTranslation('common');

  const [level, setLevel] = useState<GameLevelId>(1);
  const [roundNumber, setRoundNumber] = useState(1);
  const [cleanRoundsInRow, setCleanRoundsInRow] = useState(0);
  const [struggleRoundsInRow, setStruggleRoundsInRow] = useState(0);
  const [fallbackRoundsRemaining, setFallbackRoundsRemaining] = useState(0);
  const [rangeOverride, setRangeOverride] = useState<RangeConfig | null>(null);
  const [midpointPaused, setMidpointPaused] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [starTokens, setStarTokens] = useState(0);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    firstAttemptSuccesses: 0,
    hintUsageByRound: [],
    highestTargetReached: 0,
  });
  const [summaryMetrics, setSummaryMetrics] = useState<ParentSummaryMetrics | null>(null);

  const [round, setRound] = useState<RoundState>(() =>
    createRound({
      level: 1,
      roundNumber: 1,
      rangeOverride: null,
      fallbackMode: false,
      previousRound: null,
    }),
  );
  const previousRoundRef = useRef<RoundState | null>(round);
  const completionReportedRef = useRef(false);

  const [basketItemIds, setBasketItemIds] = useState<string[]>([]);
  const [hintStep, setHintStep] = useState(0);
  const [usedHintThisRound, setUsedHintThisRound] = useState(false);
  const [mistakesThisRound, setMistakesThisRound] = useState(0);
  const [highlightTargetItems, setHighlightTargetItems] = useState(false);
  const [wiggleItemId, setWiggleItemId] = useState<string | null>(null);
  const [basketCelebrating, setBasketCelebrating] = useState(false);
  const [replayCountAudioArmed, setReplayCountAudioArmed] = useState(false);
  const [roundMessage, setRoundMessage] = useState<RoundMessage>({
    key: 'games.countingPicnic.instructions.dragOneByOne',
    tone: 'neutral',
  });

  const trayItemById = useMemo(() => {
    return round.trayItems.reduce<Record<string, TrayItem>>((record, item) => {
      record[item.id] = item;
      return record;
    }, {});
  }, [round.trayItems]);

  const basketCount = basketItemIds.length;
  const sourceTrayItems = useMemo(
    () => round.trayItems.filter((item) => !basketItemIds.includes(item.id)),
    [basketItemIds, round.trayItems],
  );
  const targetItemsRemaining = useMemo(
    () => sourceTrayItems.filter((item) => item.isTarget),
    [sourceTrayItems],
  );

  const roundProgressSegments = useMemo(
    () => Array.from({ length: TOTAL_ROUNDS }, (_, index) => index + 1),
    [],
  );

  const isRoundTargetMet = basketCount === round.targetCount;

  const playAudioKey = useCallback(
    (key: AudioKey) => {
      const path = AUDIO_PATH_BY_KEY[key];
      if (!path) return;
      audio.play(path);
    },
    [audio],
  );

  const playNumberAudio = useCallback(
    (value: number) => {
      const key = NUMBER_KEY_BY_VALUE[clampCountingNumber(value)];
      playAudioKey(key);
    },
    [playAudioKey],
  );

  const resetRoundInteractionState = useCallback(() => {
    setBasketItemIds([]);
    setHintStep(0);
    setUsedHintThisRound(false);
    setMistakesThisRound(0);
    setHighlightTargetItems(false);
    setWiggleItemId(null);
    setBasketCelebrating(false);
    setReplayCountAudioArmed(false);
  }, []);

  const loadRound = useCallback(
    (nextRound: RoundState) => {
      previousRoundRef.current = nextRound;
      setRound(nextRound);
      resetRoundInteractionState();
    },
    [resetRoundInteractionState],
  );

  const finalizeSession = useCallback(
    (stats: SessionStats, earnedStars: number) => {
      const summary = buildSummaryMetrics(stats);
      setSummaryMetrics(summary);
      setSessionComplete(true);
      setRoundMessage({
        key: getFeedbackKeyFromHintTrend(summary.hintTrend),
        tone: 'success',
      });
      playAudioKey('games.countingPicnic.feedback.success.celebrate');

      if (completionReportedRef.current) {
        return;
      }
      completionReportedRef.current = true;

      onComplete({
        stars: Math.min(3, earnedStars),
        score: stats.firstAttemptSuccesses * 12 + stats.hintUsageByRound.length * 8,
        completed: true,
        roundsCompleted: stats.hintUsageByRound.length,
        summaryMetrics: summary,
      });
    },
    [onComplete, playAudioKey],
  );

  const prepareNextRound = useCallback(
    (options: {
      nextRoundNumber: number;
      nextLevel: GameLevelId;
      nextCleanStreak: number;
      nextStruggleStreak: number;
      nextFallbackRoundsRemaining: number;
      nextRangeOverride: RangeConfig | null;
      skipLoadForMidpoint: boolean;
    }) => {
      setRoundNumber(options.nextRoundNumber);
      setLevel(options.nextLevel);
      setCleanRoundsInRow(options.nextCleanStreak);
      setStruggleRoundsInRow(options.nextStruggleStreak);
      setFallbackRoundsRemaining(options.nextFallbackRoundsRemaining);
      setRangeOverride(options.nextRangeOverride);

      if (options.skipLoadForMidpoint) {
        setMidpointPaused(true);
        return;
      }

      const fallbackMode = options.nextFallbackRoundsRemaining > 0;
      const nextRound = createRound({
        level: options.nextLevel,
        roundNumber: options.nextRoundNumber,
        rangeOverride: options.nextRangeOverride,
        fallbackMode,
        previousRound: previousRoundRef.current,
      });
      loadRound(nextRound);
    },
    [loadRound],
  );

  const completeRound = useCallback(
    (finalBasket: string[], forcedStruggle = false) => {
      if (finalBasket.length !== round.targetCount || sessionComplete) {
        return;
      }

      const roundWasStruggle = forcedStruggle || usedHintThisRound || mistakesThisRound > 0;
      const firstAttempt = !roundWasStruggle;

      const updatedStats: SessionStats = {
        firstAttemptSuccesses: sessionStats.firstAttemptSuccesses + (firstAttempt ? 1 : 0),
        hintUsageByRound: [...sessionStats.hintUsageByRound, usedHintThisRound ? 1 : 0],
        highestTargetReached: Math.max(sessionStats.highestTargetReached, round.targetCount),
      };

      const nextStarTokens = updatedStats.hintUsageByRound.length % 2 === 0
        ? starTokens + 1
        : starTokens;

      setSessionStats(updatedStats);
      setStarTokens(nextStarTokens);
      setBasketCelebrating(true);

      const successKey =
        ROUND_SUCCESS_ROTATION[(updatedStats.hintUsageByRound.length - 1) % ROUND_SUCCESS_ROTATION.length];
      setRoundMessage({
        key: successKey,
        tone: 'success',
      });
      playAudioKey(successKey);

      if (updatedStats.hintUsageByRound.length >= TOTAL_ROUNDS) {
        window.setTimeout(() => {
          finalizeSession(updatedStats, nextStarTokens);
        }, 600);
        return;
      }

      let nextLevel = level;
      let nextCleanStreak = roundWasStruggle ? 0 : cleanRoundsInRow + 1;
      let nextStruggleStreak = roundWasStruggle ? struggleRoundsInRow + 1 : 0;
      let nextFallbackRoundsRemaining = fallbackRoundsRemaining;
      let nextRangeOverride = rangeOverride;
      const fallbackWasActive = fallbackRoundsRemaining > 0;

      if (nextStruggleStreak >= 2) {
        const fallbackRange = getRangeOverrideForFallback(level);
        if (fallbackRange) {
          nextRangeOverride = fallbackRange;
          nextFallbackRoundsRemaining = 1;
          nextStruggleStreak = 0;
        }
      }

      if (nextCleanStreak >= 3 && level < 3) {
        nextLevel = (level + 1) as GameLevelId;
        nextCleanStreak = 0;
      }

      if (fallbackWasActive) {
        nextFallbackRoundsRemaining -= 1;
        if (nextFallbackRoundsRemaining === 0) {
          nextRangeOverride = null;
        }
      }

      const nextRoundNumber = round.roundNumber + 1;
      const shouldPauseAtMidpoint = nextRoundNumber === MIDPOINT_ROUND + 1;

      window.setTimeout(() => {
        prepareNextRound({
          nextRoundNumber,
          nextLevel,
          nextCleanStreak,
          nextStruggleStreak,
          nextFallbackRoundsRemaining,
          nextRangeOverride,
          skipLoadForMidpoint: shouldPauseAtMidpoint,
        });
      }, 650);
    },
    [
      cleanRoundsInRow,
      fallbackRoundsRemaining,
      finalizeSession,
      level,
      mistakesThisRound,
      playAudioKey,
      prepareNextRound,
      rangeOverride,
      round,
      sessionComplete,
      sessionStats,
      starTokens,
      struggleRoundsInRow,
      usedHintThisRound,
    ],
  );

  const registerMistake = useCallback(
    (itemId: string, key: StatusKey) => {
      setMistakesThisRound((value) => value + 1);
      setUsedHintThisRound(true);
      setRoundMessage({ key, tone: 'hint' });
      setWiggleItemId(itemId);
      playAudioKey('games.countingPicnic.feedback.encouragement.keepTrying');

      window.setTimeout(() => {
        setWiggleItemId((current) => (current === itemId ? null : current));
      }, 260);
    },
    [playAudioKey],
  );

  const applyHintEscalation = useCallback(() => {
    const nextHintStep = Math.min(hintStep + 1, 3);
    setHintStep(nextHintStep);
    setUsedHintThisRound(true);

    if (nextHintStep === 1) {
      setRoundMessage({
        key: 'games.countingPicnic.hints.countSlowly',
        tone: 'hint',
      });
      playAudioKey('games.countingPicnic.hints.countSlowly');
      return false;
    }

    if (nextHintStep === 2) {
      setHighlightTargetItems(true);
      setRoundMessage({
        key: 'games.countingPicnic.hints.oneAtATime',
        tone: 'hint',
      });
      playAudioKey('games.countingPicnic.hints.oneAtATime');
      return false;
    }

    const missingCount = round.targetCount - basketItemIds.length;
    if (missingCount <= 0) {
      return false;
    }

    const scaffoldItems = targetItemsRemaining.slice(0, missingCount).map((item) => item.id);
    if (scaffoldItems.length === 0) {
      return false;
    }

    const nextBasket = [...basketItemIds, ...scaffoldItems];
    setBasketItemIds(nextBasket);
    setRoundMessage({
      key: 'games.countingPicnic.hints.countSlowly',
      tone: 'hint',
    });
    playAudioKey('games.countingPicnic.hints.countSlowly');

    window.setTimeout(() => {
      completeRound(nextBasket, true);
    }, 500);

    return true;
  }, [
    basketItemIds,
    completeRound,
    hintStep,
    playAudioKey,
    round.targetCount,
    targetItemsRemaining,
  ]);

  const validateBasket = useCallback(
    (candidateBasket: string[]) => {
      if (candidateBasket.length === round.targetCount) {
        completeRound(candidateBasket);
        return;
      }

      if (candidateBasket.length > round.targetCount) {
        setRoundMessage({
          key: 'games.countingPicnic.hints.gentleRetry',
          tone: 'hint',
        });
        playAudioKey('games.countingPicnic.hints.gentleRetry');
        return;
      }

      applyHintEscalation();
    },
    [applyHintEscalation, completeRound, playAudioKey, round.targetCount],
  );

  const handleTrayItemAction = useCallback(
    (itemId: string) => {
      if (sessionComplete || midpointPaused) {
        return;
      }

      const item = trayItemById[itemId];
      if (!item) {
        return;
      }

      if (!item.isTarget) {
        registerMistake(itemId, 'games.countingPicnic.feedback.encouragement.tryAgain');
        return;
      }

      if (basketItemIds.length >= round.targetCount) {
        registerMistake(itemId, 'games.countingPicnic.hints.gentleRetry');
        return;
      }

      const nextBasket = [...basketItemIds, itemId];
      const nextCount = nextBasket.length;
      setBasketItemIds(nextBasket);
      setHighlightTargetItems(false);
      setRoundMessage({
        key: 'games.countingPicnic.instructions.dragOneByOne',
        tone: 'neutral',
      });

      const narrationLimit = getEmojiPools(round.level, round.roundNumber).narratedDropsLimit;
      const shouldPlayNumber = nextCount <= narrationLimit || replayCountAudioArmed;
      if (shouldPlayNumber) {
        playNumberAudio(nextCount);
        if (replayCountAudioArmed) {
          setReplayCountAudioArmed(false);
        }
      }

      if (nextCount === round.targetCount) {
        window.setTimeout(() => {
          validateBasket(nextBasket);
        }, 260);
      }
    },
    [
      basketItemIds,
      midpointPaused,
      playNumberAudio,
      registerMistake,
      replayCountAudioArmed,
      round.level,
      round.roundNumber,
      round.targetCount,
      sessionComplete,
      trayItemById,
      validateBasket,
    ],
  );

  const handleReplayInstruction = useCallback(() => {
    setReplayCountAudioArmed(true);
    setRoundMessage({
      key: 'games.countingPicnic.hints.useReplay',
      tone: 'neutral',
    });
    playAudioKey('games.countingPicnic.instructions.intro');

    window.setTimeout(() => {
      playNumberAudio(round.targetCount);
    }, 280);
  }, [playAudioKey, playNumberAudio, round.targetCount]);

  const handleContinueAfterMidpoint = useCallback(() => {
    setMidpointPaused(false);

    const fallbackMode = fallbackRoundsRemaining > 0;
    const nextRound = createRound({
      level,
      roundNumber,
      rangeOverride,
      fallbackMode,
      previousRound: previousRoundRef.current,
    });
    loadRound(nextRound);
  }, [fallbackRoundsRemaining, level, loadRound, rangeOverride, roundNumber]);

  useEffect(() => {
    if (midpointPaused || sessionComplete) {
      return;
    }

    setRoundMessage({
      key: 'games.countingPicnic.instructions.intro',
      values: { count: round.targetCount },
      tone: 'neutral',
    });
    playAudioKey('games.countingPicnic.instructions.intro');

    const timer = window.setTimeout(() => {
      playNumberAudio(round.targetCount);
    }, 280);

    return () => {
      window.clearTimeout(timer);
    };
  }, [midpointPaused, playAudioKey, playNumberAudio, round.id, round.targetCount, sessionComplete]);

  useEffect(() => {
    return () => {
      audio.stop();
    };
  }, [audio]);

  const currentMessageText = roundMessage.values
    ? t(roundMessage.key, roundMessage.values)
    : t(roundMessage.key);

  if (sessionComplete && summaryMetrics) {
    return (
      <div className="counting-picnic counting-picnic--complete">
        <Card padding="lg" className="counting-picnic__shell">
          <h2 className="counting-picnic__title">{t('feedback.youDidIt')}</h2>
          <p className="counting-picnic__subtitle">{t('games.countingPicnic.roundComplete.basketReady')}</p>

          <div className="counting-picnic__stars" aria-label={t('feedback.excellent')}>
            {Array.from({ length: Math.max(1, starTokens) }).map((_, index) => (
              <span key={`star-${index}`} className="counting-picnic__star" aria-hidden="true">
                ⭐
              </span>
            ))}
          </div>

          <Card padding="md" className="counting-picnic__summary-card">
            <p>
              {t('parentDashboard.games.countingPicnic.progressSummary', {
                range: summaryMetrics.highestStableRange,
                successRate: summaryMetrics.firstAttemptSuccessRate,
              })}
            </p>
            <p>{t('parentDashboard.games.countingPicnic.nextStep')}</p>
          </Card>

          <p className="counting-picnic__hint-note">{t(getFeedbackKeyFromHintTrend(summaryMetrics.hintTrend))}</p>
        </Card>

        <style>{countingPicnicStyles}</style>
      </div>
    );
  }

  if (midpointPaused) {
    return (
      <div className="counting-picnic counting-picnic--midpoint">
        <Card padding="lg" className="counting-picnic__shell">
          <h2 className="counting-picnic__title">{t('feedback.greatEffort')}</h2>
          <p className="counting-picnic__subtitle">{t('games.countingPicnic.roundComplete.nextNumber')}</p>
          <Button
            variant="primary"
            size="lg"
            onClick={handleContinueAfterMidpoint}
            aria-label={t('nav.next')}
          >
            {t('nav.next')}
          </Button>
        </Card>

        <style>{countingPicnicStyles}</style>
      </div>
    );
  }

  return (
    <div className="counting-picnic">
      <Card padding="lg" className="counting-picnic__shell">
        <header className="counting-picnic__header">
          <div className="counting-picnic__actions">
            <Button
              variant="secondary"
              size="md"
              onClick={handleReplayInstruction}
              aria-label={t('games.countingPicnic.hints.useReplay')}
            >
              🔊 {t('games.countingPicnic.hints.useReplay')}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => validateBasket(basketItemIds)}
              aria-label={t('games.countingPicnic.instructions.tapCheck')}
            >
              {t('games.countingPicnic.instructions.tapCheck')}
            </Button>
          </div>
        </header>

        <div className="counting-picnic__round-progress" aria-label={t('games.estimatedTime', { minutes: 6 })}>
          {roundProgressSegments.map((segment) => {
            const state =
              segment < round.roundNumber
                ? 'done'
                : segment === round.roundNumber
                  ? 'active'
                  : 'pending';

            return (
              <span
                key={`segment-${segment}`}
                className={`counting-picnic__round-dot counting-picnic__round-dot--${state}`}
                aria-hidden="true"
              />
            );
          })}
        </div>

        <p
          className={`counting-picnic__message counting-picnic__message--${roundMessage.tone}`}
          aria-live="polite"
        >
          {currentMessageText}
        </p>

        <section className="counting-picnic__board">
          <Card padding="md" className="counting-picnic__tray-card">
            <p className="counting-picnic__tray-instruction">{t('games.countingPicnic.instructions.dragOneByOne')}</p>

            <div className="counting-picnic__tray-grid">
              {sourceTrayItems.map((item, index) => {
                const wiggle = wiggleItemId === item.id;
                const highlighted = highlightTargetItems && item.isTarget;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={[
                      'counting-picnic__item',
                      wiggle ? 'counting-picnic__item--wiggle' : '',
                      highlighted ? 'counting-picnic__item--highlight' : '',
                      item.isTarget ? '' : 'counting-picnic__item--distractor',
                    ].join(' ')}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', item.id);
                    }}
                    onClick={() => handleTrayItemAction(item.id)}
                    aria-label={`${t('games.countingPicnic.instructions.dragOneByOne')} ${item.emoji} ${index + 1}`}
                  >
                    {item.emoji}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card
            padding="md"
            className={[
              'counting-picnic__basket-card',
              basketCelebrating ? 'counting-picnic__basket-card--celebrate' : '',
            ].join(' ')}
          >
            <div className="counting-picnic__target-row">
              {Array.from({ length: round.targetCount }).map((_, index) => {
                const countValue = (index + 1) as CountingNumber;
                const filled = index < basketCount;
                return (
                  <button
                    key={`target-${countValue}`}
                    type="button"
                    className={[
                      'counting-picnic__target-chip',
                      filled ? 'counting-picnic__target-chip--filled' : '',
                    ].join(' ')}
                    onClick={() => playNumberAudio(countValue)}
                    aria-label={t(NUMBER_KEY_BY_VALUE[countValue])}
                  >
                    {countValue}
                  </button>
                );
              })}
            </div>

            <div
              className="counting-picnic__basket-dropzone"
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const itemId = event.dataTransfer.getData('text/plain');
                if (itemId) {
                  handleTrayItemAction(itemId);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  validateBasket(basketItemIds);
                }
              }}
              aria-label={t('games.countingPicnic.instructions.tapCheck')}
            >
              <span className="counting-picnic__basket-emoji" aria-hidden="true">
                🧺
              </span>
              <span className="counting-picnic__basket-count">
                {basketCount} / {round.targetCount}
              </span>
              <span className="counting-picnic__basket-number">
                {t(NUMBER_KEY_BY_VALUE[round.targetCount])}
              </span>
            </div>

            {round.fallbackMode && (
              <p className="counting-picnic__fallback-note">
                {t('games.countingPicnic.instructions.listenAndCount')}
              </p>
            )}

            {isRoundTargetMet && (
              <p className="counting-picnic__done-note">{t('games.countingPicnic.roundComplete.greatCounting')}</p>
            )}
          </Card>
        </section>
      </Card>

      <style>{countingPicnicStyles}</style>
    </div>
  );
}

const countingPicnicStyles = `
  .counting-picnic {
    display: flex;
    justify-content: center;
    padding: var(--space-xl);
    background: var(--color-theme-bg);
    min-height: 100%;
  }

  .counting-picnic__shell {
    width: min(1120px, 100%);
    display: grid;
    gap: var(--space-md);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 28%, white);
  }

  .counting-picnic__header {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
    align-items: center;
    justify-content: space-between;
  }

  .counting-picnic__heading {
    display: grid;
    gap: var(--space-xs);
  }

  .counting-picnic__title {
    font-size: var(--font-size-2xl);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-extrabold);
  }

  .counting-picnic__subtitle {
    color: var(--color-text-secondary);
    font-size: var(--font-size-md);
  }

  .counting-picnic__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .counting-picnic__round-progress {
    display: grid;
    grid-template-columns: repeat(8, minmax(14px, 1fr));
    gap: var(--space-xs);
  }

  .counting-picnic__round-dot {
    height: 14px;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-text-secondary) 24%, white);
    border: 1px solid color-mix(in srgb, var(--color-text-secondary) 42%, transparent);
  }

  .counting-picnic__round-dot--done {
    background: var(--color-accent-success);
    border-color: color-mix(in srgb, var(--color-accent-success) 72%, transparent);
  }

  .counting-picnic__round-dot--active {
    background: var(--color-accent-primary);
    border-color: color-mix(in srgb, var(--color-accent-primary) 72%, transparent);
    transform: scaleY(1.2);
  }

  .counting-picnic__message {
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-size-md);
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    border: 2px solid transparent;
  }

  .counting-picnic__message--neutral {
    background: color-mix(in srgb, var(--color-bg-secondary) 70%, white);
    color: var(--color-text-primary);
  }

  .counting-picnic__message--hint {
    background: color-mix(in srgb, var(--color-accent-secondary) 30%, white);
    color: var(--color-text-primary);
    border-color: color-mix(in srgb, var(--color-accent-primary) 45%, transparent);
  }

  .counting-picnic__message--success {
    background: color-mix(in srgb, var(--color-accent-success) 22%, white);
    color: var(--color-text-primary);
    border-color: color-mix(in srgb, var(--color-accent-success) 60%, transparent);
  }

  .counting-picnic__board {
    display: flex;
    flex-direction: row;
    gap: var(--space-md);
    align-items: stretch;
  }

  .counting-picnic__tray-card,
  .counting-picnic__basket-card {
    flex: 1;
    display: grid;
    gap: var(--space-md);
    align-content: start;
  }

  .counting-picnic__tray-instruction {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .counting-picnic__tray-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
    gap: var(--space-sm);
  }

  .counting-picnic__item {
    min-height: 52px;
    min-width: 52px;
    border-radius: var(--radius-lg);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 22%, transparent);
    background: white;
    font-size: 1.8rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    box-shadow: var(--shadow-sm);
  }

  .counting-picnic__item:active {
    transform: scale(0.96);
  }

  .counting-picnic__item--distractor {
    opacity: 0.78;
  }

  .counting-picnic__item--highlight {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent-primary) 20%, transparent);
  }

  .counting-picnic__item--wiggle {
    animation: tray-wiggle 220ms ease-in-out;
  }

  .counting-picnic__target-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(44px, 1fr));
    gap: var(--space-xs);
  }

  .counting-picnic__target-chip {
    min-height: 44px;
    border-radius: var(--radius-full);
    border: 2px dashed color-mix(in srgb, var(--color-theme-primary) 36%, transparent);
    background: white;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
  }

  .counting-picnic__target-chip--filled {
    border-style: solid;
    border-color: var(--color-accent-success);
    background: color-mix(in srgb, var(--color-accent-success) 22%, white);
  }

  .counting-picnic__basket-dropzone {
    min-height: 230px;
    border-radius: var(--radius-xl);
    border: 3px dashed color-mix(in srgb, var(--color-theme-primary) 35%, transparent);
    background: color-mix(in srgb, var(--color-bg-secondary) 58%, white);
    display: grid;
    place-items: center;
    gap: var(--space-xs);
    text-align: center;
    padding: var(--space-md);
  }

  .counting-picnic__basket-emoji {
    font-size: 3rem;
  }

  .counting-picnic__basket-count {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-extrabold);
    color: var(--color-text-primary);
  }

  .counting-picnic__basket-number {
    font-size: var(--font-size-md);
    color: var(--color-text-secondary);
  }

  .counting-picnic__basket-card--celebrate .counting-picnic__basket-dropzone {
    border-color: var(--color-accent-success);
    background: color-mix(in srgb, var(--color-accent-success) 20%, white);
  }

  .counting-picnic__fallback-note,
  .counting-picnic__done-note {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .counting-picnic__done-note {
    color: var(--color-accent-success);
    font-weight: var(--font-weight-bold);
  }

  .counting-picnic--midpoint,
  .counting-picnic--complete {
    align-items: center;
  }

  .counting-picnic--midpoint .counting-picnic__shell,
  .counting-picnic--complete .counting-picnic__shell {
    max-width: 640px;
    text-align: center;
  }

  .counting-picnic__stars {
    display: flex;
    justify-content: center;
    gap: var(--space-xs);
  }

  .counting-picnic__star {
    font-size: 1.9rem;
  }

  .counting-picnic__summary-card {
    display: grid;
    gap: var(--space-sm);
    text-align: start;
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 18%, transparent);
  }

  .counting-picnic__hint-note {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  @keyframes tray-wiggle {
    0% { transform: translateX(0); }
    30% { transform: translateX(-6px); }
    70% { transform: translateX(6px); }
    100% { transform: translateX(0); }
  }

  @media (max-width: 860px) {
    .counting-picnic {
      padding: var(--space-md);
    }

    .counting-picnic__board {
      flex-direction: column;
    }

    .counting-picnic__actions button {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .counting-picnic *,
    .counting-picnic *::before,
    .counting-picnic *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
