import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { resolveGameConcurrentChoiceLimit } from '@/lib/concurrentChoiceLimit';
import { isRtlDirection, rtlNextGlyph, rtlReplayGlyph } from '@/lib/rtlChrome';

type ShapeId = 'circle' | 'square' | 'triangle' | 'rectangle' | 'star';
type RoundMode = 'match' | 'sort' | 'missing';
type MessageTone = 'neutral' | 'hint' | 'success';
type BoardFeedback = 'idle' | 'success' | 'miss';
type HintTrend = ParentSummaryMetrics['hintTrend'];

type MatchPromptKey =
  | 'games.shapeSafari.prompts.match.circle'
  | 'games.shapeSafari.prompts.match.square'
  | 'games.shapeSafari.prompts.match.triangle'
  | 'games.shapeSafari.prompts.match.rectangle'
  | 'games.shapeSafari.prompts.match.star';

type SortPromptKey =
  | 'games.shapeSafari.prompts.sort.circles'
  | 'games.shapeSafari.prompts.sort.squares'
  | 'games.shapeSafari.prompts.sort.triangles'
  | 'games.shapeSafari.prompts.sort.rectangles'
  | 'games.shapeSafari.prompts.sort.stars'
  | 'games.shapeSafari.prompts.sort.mixed';

type InactivityPromptKey =
  | 'games.shapeSafari.prompts.inactivity.gentleNudge'
  | 'games.shapeSafari.prompts.inactivity.replayPrompt'
  | 'games.shapeSafari.prompts.inactivity.tapAnyShape';

type StatusKey =
  | MatchPromptKey
  | SortPromptKey
  | InactivityPromptKey
  | 'games.shapeSafari.title'
  | 'games.shapeSafari.subtitle'
  | 'games.shapeSafari.instructions.intro'
  | 'games.shapeSafari.instructions.listenAndFind'
  | 'games.shapeSafari.instructions.dragToMatch'
  | 'games.shapeSafari.instructions.sortByShape'
  | 'games.shapeSafari.instructions.chooseMissing'
  | 'games.shapeSafari.instructions.tapReplay'
  | 'games.shapeSafari.hints.checkEdges'
  | 'games.shapeSafari.hints.lookAtCorners'
  | 'games.shapeSafari.hints.matchOutline'
  | 'games.shapeSafari.hints.focusShapeNotColor'
  | 'games.shapeSafari.hints.useReplay'
  | 'games.shapeSafari.hints.gentleRetry'
  | 'games.shapeSafari.recovery.demo.watchDubi'
  | 'games.shapeSafari.recovery.demo.yourTurn'
  | 'games.shapeSafari.recovery.demo.trySameAgain'
  | 'games.shapeSafari.roundComplete.greatObservation'
  | 'games.shapeSafari.roundComplete.shapeMastery'
  | 'games.shapeSafari.roundComplete.nextChallenge'
  | 'games.shapeSafari.feedback.encouragement.keepTrying'
  | 'games.shapeSafari.feedback.encouragement.almostThere'
  | 'games.shapeSafari.feedback.encouragement.tryAgain'
  | 'games.shapeSafari.feedback.success.wellDone'
  | 'games.shapeSafari.feedback.success.amazing'
  | 'games.shapeSafari.feedback.success.celebrate'
  | 'shapes.names.circle'
  | 'shapes.names.square'
  | 'shapes.names.triangle'
  | 'shapes.names.rectangle'
  | 'shapes.names.star'
  | 'parentDashboard.games.shapeSafari.progressSummary'
  | 'parentDashboard.games.shapeSafari.nextStep'
  | 'feedback.excellent'
  | 'feedback.keepGoing'
  | 'feedback.greatEffort'
  | 'nav.next';

interface RoundState {
  id: string;
  roundNumber: number;
  mode: RoundMode;
  target: ShapeId;
  options: ShapeId[];
  instructionKey: StatusKey;
  promptKey: MatchPromptKey | SortPromptKey;
  simplifyApplied: boolean;
  tapFallbackEnabled: boolean;
}

interface RoundMessage {
  key: StatusKey;
  tone: MessageTone;
}

interface SessionStats {
  totalAttempts: number;
  correctAnswers: number;
  firstAttemptHits: number;
  hintUsageByRound: Record<number, number>;
  confusionPairs: Record<string, number>;
}

const TOTAL_ROUNDS = 6;

const SHAPE_SYMBOL_BY_ID: Record<ShapeId, string> = {
  circle: '◯',
  square: '▢',
  triangle: '△',
  rectangle: '▭',
  star: '☆',
};

const SHAPE_POOL_BY_ROUND: Record<number, ShapeId[]> = {
  1: ['circle', 'square', 'triangle'],
  2: ['circle', 'square', 'triangle'],
  3: ['circle', 'square', 'triangle', 'rectangle'],
  4: ['circle', 'square', 'triangle', 'rectangle'],
  5: ['circle', 'square', 'triangle', 'rectangle', 'star'],
  6: ['circle', 'square', 'triangle', 'rectangle', 'star'],
};

const SHAPE_NAME_KEY_BY_ID: Record<ShapeId, StatusKey> = {
  circle: 'shapes.names.circle',
  square: 'shapes.names.square',
  triangle: 'shapes.names.triangle',
  rectangle: 'shapes.names.rectangle',
  star: 'shapes.names.star',
};

const MATCH_PROMPT_BY_SHAPE: Record<ShapeId, MatchPromptKey> = {
  circle: 'games.shapeSafari.prompts.match.circle',
  square: 'games.shapeSafari.prompts.match.square',
  triangle: 'games.shapeSafari.prompts.match.triangle',
  rectangle: 'games.shapeSafari.prompts.match.rectangle',
  star: 'games.shapeSafari.prompts.match.star',
};

const SORT_PROMPT_BY_SHAPE: Record<ShapeId, SortPromptKey> = {
  circle: 'games.shapeSafari.prompts.sort.circles',
  square: 'games.shapeSafari.prompts.sort.squares',
  triangle: 'games.shapeSafari.prompts.sort.triangles',
  rectangle: 'games.shapeSafari.prompts.sort.rectangles',
  star: 'games.shapeSafari.prompts.sort.stars',
};

const ROUND_SUCCESS_KEYS: Array<
  | 'games.shapeSafari.roundComplete.greatObservation'
  | 'games.shapeSafari.roundComplete.shapeMastery'
  | 'games.shapeSafari.roundComplete.nextChallenge'
> = [
  'games.shapeSafari.roundComplete.greatObservation',
  'games.shapeSafari.roundComplete.shapeMastery',
  'games.shapeSafari.roundComplete.nextChallenge',
];

const ENCOURAGEMENT_KEYS: Array<
  | 'games.shapeSafari.feedback.encouragement.keepTrying'
  | 'games.shapeSafari.feedback.encouragement.almostThere'
  | 'games.shapeSafari.feedback.encouragement.tryAgain'
> = [
  'games.shapeSafari.feedback.encouragement.keepTrying',
  'games.shapeSafari.feedback.encouragement.almostThere',
  'games.shapeSafari.feedback.encouragement.tryAgain',
];

const NEXT_ICON_SUCCESS_KEYS: Array<
  | 'games.shapeSafari.feedback.success.wellDone'
  | 'games.shapeSafari.feedback.success.amazing'
  | 'games.shapeSafari.feedback.success.celebrate'
> = [
  'games.shapeSafari.feedback.success.wellDone',
  'games.shapeSafari.feedback.success.amazing',
  'games.shapeSafari.feedback.success.celebrate',
];

const INACTIVITY_PROMPT_KEYS: InactivityPromptKey[] = [
  'games.shapeSafari.prompts.inactivity.gentleNudge',
  'games.shapeSafari.prompts.inactivity.replayPrompt',
  'games.shapeSafari.prompts.inactivity.tapAnyShape',
];

function resolveAudioPath(key: StatusKey): string {
  return resolveAudioPathFromKey(key, 'common');
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(values: readonly T[]): T {
  return values[randomInt(0, values.length - 1)] as T;
}

function shuffle<T>(values: T[]): T[] {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function getRoundMode(roundNumber: number): RoundMode {
  if (roundNumber <= 2) {
    return 'match';
  }
  if (roundNumber === 6) {
    return 'missing';
  }
  return 'sort';
}

function getRoundInstructionKey(mode: RoundMode, roundNumber: number): StatusKey {
  if (roundNumber === 1) {
    return 'games.shapeSafari.instructions.intro';
  }

  if (mode === 'match') {
    return 'games.shapeSafari.instructions.listenAndFind';
  }

  if (mode === 'sort') {
    return 'games.shapeSafari.instructions.sortByShape';
  }

  return 'games.shapeSafari.instructions.chooseMissing';
}

function getRoundOptionCount(roundNumber: number, maxConcurrentChoices: number): number {
  const roundTargetCount = roundNumber <= 2 ? 3 : roundNumber <= 4 ? 4 : 5;
  return Math.max(2, Math.min(roundTargetCount, maxConcurrentChoices));
}

function buildRoundOptions(target: ShapeId, roundNumber: number, simplify: boolean, maxConcurrentChoices: number): ShapeId[] {
  const sourcePool = SHAPE_POOL_BY_ROUND[roundNumber] ?? SHAPE_POOL_BY_ROUND[6];
  const optionCount = getRoundOptionCount(roundNumber, maxConcurrentChoices);
  const pool = simplify && sourcePool.length > 3 ? sourcePool.slice(0, sourcePool.length - 1) : sourcePool;

  const targetSafePool = pool.includes(target) ? pool : [...pool, target];
  const clampedOptionCount = Math.max(2, Math.min(optionCount, targetSafePool.length));
  const distractors = shuffle(targetSafePool.filter((shape) => shape !== target)).slice(0, clampedOptionCount - 1);
  return shuffle([target, ...distractors]);
}

function buildRound(roundNumber: number, maxConcurrentChoices: number, targetOverride?: ShapeId, simplify = false): RoundState {
  const roundPool = SHAPE_POOL_BY_ROUND[roundNumber] ?? SHAPE_POOL_BY_ROUND[6];
  const target = targetOverride ?? pickRandom(roundPool);
  const mode = getRoundMode(roundNumber);
  const promptKey = mode === 'match' ? MATCH_PROMPT_BY_SHAPE[target] : SORT_PROMPT_BY_SHAPE[target];

  return {
    id: `shape-safari-round-${roundNumber}-${target}-${simplify ? 'simple' : 'full'}`,
    roundNumber,
    mode,
    target,
    options: buildRoundOptions(target, roundNumber, simplify, maxConcurrentChoices),
    instructionKey: getRoundInstructionKey(mode, roundNumber),
    promptKey,
    simplifyApplied: simplify,
    tapFallbackEnabled: roundNumber >= 3,
  };
}

function toStableRange(accuracy: number): StableRange {
  if (accuracy >= 85) return '1-10';
  if (accuracy >= 60) return '1-5';
  return '1-3';
}

function toHintTrend(hintsByRound: number[]): HintTrend {
  if (hintsByRound.length === 0) {
    return 'steady';
  }

  const midpoint = Math.ceil(hintsByRound.length / 2);
  const firstHalf = hintsByRound.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
  const secondHalf = hintsByRound.slice(midpoint).reduce((sum, value) => sum + value, 0);

  if (secondHalf < firstHalf) return 'improving';
  if (secondHalf > firstHalf) return 'needs_support';
  return 'steady';
}

function getTopConfusionPair(confusionPairs: Record<string, number>): [ShapeId, ShapeId] | null {
  const entries = Object.entries(confusionPairs);
  if (entries.length === 0) {
    return null;
  }

  const [pair] = entries.sort((a, b) => b[1] - a[1])[0];
  const [target, selected] = pair.split(':') as [ShapeId, ShapeId];
  return [target, selected];
}

export function ShapeSafariGame({ level, child, onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir(i18n.language));
  const replayIcon = rtlReplayGlyph(isRtl);
  const nextIcon = rtlNextGlyph(isRtl);
  const maxConcurrentChoices = useMemo(
    () => resolveGameConcurrentChoiceLimit(level.configJson, child.birthDate),
    [child.birthDate, level.configJson],
  );

  const [roundNumber, setRoundNumber] = useState(1);
  const [round, setRound] = useState<RoundState>(() => buildRound(1, maxConcurrentChoices));
  const [roundSolved, setRoundSolved] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);
  const [attemptInRound, setAttemptInRound] = useState(0);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [highlightShape, setHighlightShape] = useState<ShapeId | null>(null);
  const [lastInteractionAt, setLastInteractionAt] = useState(() => Date.now());
  const [message, setMessage] = useState<RoundMessage>({
    key: 'games.shapeSafari.instructions.intro',
    tone: 'neutral',
  });
  const [promptPulse, setPromptPulse] = useState(false);
  const [scorePulse, setScorePulse] = useState(false);
  const [boardFeedback, setBoardFeedback] = useState<BoardFeedback>('idle');
  const [lastPickedShape, setLastPickedShape] = useState<ShapeId | null>(null);
  const [pickFeedback, setPickFeedback] = useState<BoardFeedback>('idle');

  const [stats, setStats] = useState<SessionStats>({
    totalAttempts: 0,
    correctAnswers: 0,
    firstAttemptHits: 0,
    hintUsageByRound: {},
    confusionPairs: {},
  });

  const inactivityTimerRef = useRef<number | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const promptPulseTimeoutRef = useRef<number | null>(null);
  const scorePulseTimeoutRef = useRef<number | null>(null);
  const boardFeedbackTimeoutRef = useRef<number | null>(null);
  const pickFeedbackTimeoutRef = useRef<number | null>(null);
  const recoveryInFlightRef = useRef(false);
  const nextActionInFlightRef = useRef(false);
  const pickAudioTokenRef = useRef(0);
  const progressSegments = useMemo(() => Array.from({ length: TOTAL_ROUNDS }, (_, index) => index + 1), []);

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

  const incrementHintUsage = useCallback((targetRound: number) => {
    setStats((previous) => ({
      ...previous,
      hintUsageByRound: {
        ...previous.hintUsageByRound,
        [targetRound]: (previous.hintUsageByRound[targetRound] ?? 0) + 1,
      },
    }));
  }, []);

  const triggerScorePulse = useCallback(() => {
    setScorePulse(true);
    if (scorePulseTimeoutRef.current !== null) {
      window.clearTimeout(scorePulseTimeoutRef.current);
    }
    scorePulseTimeoutRef.current = window.setTimeout(() => {
      setScorePulse(false);
      scorePulseTimeoutRef.current = null;
    }, 420);
  }, []);

  const triggerBoardFeedback = useCallback((feedback: Exclude<BoardFeedback, 'idle'>) => {
    setBoardFeedback(feedback);
    if (boardFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(boardFeedbackTimeoutRef.current);
    }
    boardFeedbackTimeoutRef.current = window.setTimeout(() => {
      setBoardFeedback('idle');
      boardFeedbackTimeoutRef.current = null;
    }, 340);
  }, []);

  const triggerPickFeedback = useCallback((shape: ShapeId, feedback: Exclude<BoardFeedback, 'idle'>) => {
    setLastPickedShape(shape);
    setPickFeedback(feedback);
    if (pickFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(pickFeedbackTimeoutRef.current);
    }
    pickFeedbackTimeoutRef.current = window.setTimeout(() => {
      setPickFeedback('idle');
      setLastPickedShape(null);
      pickFeedbackTimeoutRef.current = null;
    }, 360);
  }, []);

  const triggerTargetHighlight = useCallback((shape: ShapeId, durationMs: number) => {
    setHighlightShape(shape);
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightShape(null);
      highlightTimerRef.current = null;
    }, durationMs);
  }, []);

  const triggerPromptPulse = useCallback((durationMs: number) => {
    setPromptPulse(true);
    if (promptPulseTimeoutRef.current !== null) {
      window.clearTimeout(promptPulseTimeoutRef.current);
    }
    promptPulseTimeoutRef.current = window.setTimeout(() => {
      setPromptPulse(false);
      promptPulseTimeoutRef.current = null;
    }, durationMs);
  }, []);

  const triggerReplayVisualFeedback = useCallback(
    (durationMs: number) => {
      triggerPromptPulse(durationMs);
      triggerTargetHighlight(round.target, durationMs);
    },
    [round.target, triggerPromptPulse, triggerTargetHighlight],
  );

  const announceRound = useCallback(
    async (nextRound: RoundState) => {
      setMessage({ key: nextRound.instructionKey, tone: 'neutral' });
      await playNow(nextRound.instructionKey);
      await playQueued(nextRound.promptKey);
    },
    [playNow, playQueued],
  );

  const restartInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current !== null) {
      window.clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = window.setTimeout(() => {
      if (sessionComplete || roundSolved) {
        return;
      }

      incrementHintUsage(roundNumber);
      const inactivityPromptKey = pickRandom(INACTIVITY_PROMPT_KEYS);
      setMessage({ key: inactivityPromptKey, tone: 'hint' });
      triggerReplayVisualFeedback(1200);
      void playNow(inactivityPromptKey);
      void playQueued(round.promptKey);
    }, 7000);
  }, [
    incrementHintUsage,
    playNow,
    playQueued,
    round.promptKey,
    roundNumber,
    roundSolved,
    sessionComplete,
    triggerReplayVisualFeedback,
  ]);

  useEffect(() => {
    setAttemptInRound(0);
    setConsecutiveMisses(0);
    setRoundSolved(false);
    setDragOver(false);
    setHighlightShape(null);
    setPromptPulse(false);
    setBoardFeedback('idle');
    setLastPickedShape(null);
    setPickFeedback('idle');
    void announceRound(round);
  }, [announceRound, round]);

  useEffect(() => {
    restartInactivityTimer();
    return () => {
      if (inactivityTimerRef.current !== null) {
        window.clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [restartInactivityTimer, lastInteractionAt, round.id, roundSolved, sessionComplete]);

  useEffect(
    () => () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
      if (promptPulseTimeoutRef.current !== null) {
        window.clearTimeout(promptPulseTimeoutRef.current);
      }
      if (scorePulseTimeoutRef.current !== null) {
        window.clearTimeout(scorePulseTimeoutRef.current);
      }
      if (boardFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(boardFeedbackTimeoutRef.current);
      }
      if (pickFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(pickFeedbackTimeoutRef.current);
      }
    },
    [],
  );

  const handleReplay = useCallback(() => {
    setLastInteractionAt(Date.now());
    setMessage({ key: 'games.shapeSafari.instructions.tapReplay', tone: 'neutral' });
    triggerReplayVisualFeedback(1200);
    void playNow('games.shapeSafari.instructions.tapReplay');
    void playQueued(round.promptKey);
  }, [playNow, playQueued, round.promptKey, triggerReplayVisualFeedback]);

  const runRecoveryDemo = useCallback(async () => {
    if (recoveryInFlightRef.current) {
      return;
    }

    recoveryInFlightRef.current = true;

    try {
      setMessage({ key: 'games.shapeSafari.recovery.demo.watchDubi', tone: 'hint' });
      triggerReplayVisualFeedback(1500);
      await playNow('games.shapeSafari.recovery.demo.watchDubi');

      setMessage({ key: 'games.shapeSafari.recovery.demo.yourTurn', tone: 'hint' });
      await playNow('games.shapeSafari.recovery.demo.yourTurn');

      setMessage({ key: 'games.shapeSafari.recovery.demo.trySameAgain', tone: 'hint' });
      await playNow('games.shapeSafari.recovery.demo.trySameAgain');

      const retryRound = buildRound(roundNumber, maxConcurrentChoices, round.target, true);
      setRound(retryRound);
      setAttemptInRound(0);
      setConsecutiveMisses(0);
      setRoundSolved(false);
      triggerReplayVisualFeedback(1200);
    } finally {
      recoveryInFlightRef.current = false;
    }
  }, [maxConcurrentChoices, playNow, round.target, roundNumber, triggerReplayVisualFeedback]);

  const handleRetryRound = useCallback(() => {
    if (sessionComplete) {
      return;
    }

    setLastInteractionAt(Date.now());
    const encouragementKey = pickRandom(ENCOURAGEMENT_KEYS);
    setRoundSolved(false);
    setAttemptInRound(0);
    setConsecutiveMisses(0);
    setDragOver(false);
    setBoardFeedback('idle');
    setLastPickedShape(null);
    setPickFeedback('idle');
    setMessage({ key: encouragementKey, tone: 'hint' });
    incrementHintUsage(roundNumber);
    triggerReplayVisualFeedback(1200);
    void (async () => {
      await playNow(encouragementKey);
      await playQueued(round.promptKey);
    })();
  }, [incrementHintUsage, playNow, playQueued, round.promptKey, roundNumber, sessionComplete, triggerReplayVisualFeedback]);

  const handleHint = useCallback(() => {
    if (sessionComplete || roundSolved) {
      return;
    }

    setLastInteractionAt(Date.now());
    incrementHintUsage(roundNumber);

    const hintKey: StatusKey =
      consecutiveMisses >= 2
        ? 'games.shapeSafari.hints.matchOutline'
        : consecutiveMisses === 1
          ? 'games.shapeSafari.hints.lookAtCorners'
          : 'games.shapeSafari.hints.checkEdges';

    setMessage({ key: hintKey, tone: 'hint' });
    triggerTargetHighlight(round.target, 1200);

    void playNow(hintKey);
  }, [
    consecutiveMisses,
    incrementHintUsage,
    playNow,
    round.target,
    roundSolved,
    roundNumber,
    sessionComplete,
    triggerTargetHighlight,
  ]);

  const finalizeSession = useCallback(() => {
    const accuracy = Math.round((stats.correctAnswers / Math.max(stats.totalAttempts, 1)) * 100);
    const firstAttemptSuccessRate = Math.round((stats.firstAttemptHits / TOTAL_ROUNDS) * 100);
    const hintsByRound = Object.entries(stats.hintUsageByRound)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, value]) => value);
    const hintTrend = toHintTrend(hintsByRound);

    onComplete({
      completed: true,
      stars: accuracy >= 85 ? 3 : accuracy >= 65 ? 2 : 1,
      score: accuracy,
      roundsCompleted: TOTAL_ROUNDS,
      summaryMetrics: {
        highestStableRange: toStableRange(accuracy),
        firstAttemptSuccessRate,
        hintTrend,
      },
    });

    setSessionComplete(true);
    setMessage({ key: 'feedback.excellent', tone: 'success' });
    void playNow('feedback.excellent');
  }, [onComplete, playNow, stats]);

  const goToNextRound = useCallback(() => {
    setLastInteractionAt(Date.now());

    if (roundNumber >= TOTAL_ROUNDS) {
      finalizeSession();
      return;
    }

    const nextRoundNumber = roundNumber + 1;
    setRoundNumber(nextRoundNumber);
    setRound(buildRound(nextRoundNumber, maxConcurrentChoices));
  }, [finalizeSession, maxConcurrentChoices, roundNumber]);

  const handleNextRound = useCallback(() => {
    if (sessionComplete || !roundSolved || nextActionInFlightRef.current) {
      return;
    }

    nextActionInFlightRef.current = true;
    setLastInteractionAt(Date.now());

    const successKey = pickRandom(NEXT_ICON_SUCCESS_KEYS);
    setMessage({ key: successKey, tone: 'success' });

    void (async () => {
      try {
        await playNow(successKey);
        goToNextRound();
      } finally {
        nextActionInFlightRef.current = false;
      }
    })();
  }, [goToNextRound, playNow, roundSolved, sessionComplete]);

  const handlePickShape = useCallback(
    (shape: ShapeId) => {
      if (sessionComplete || roundSolved) {
        return;
      }

      setLastInteractionAt(Date.now());
      setStats((previous) => ({
        ...previous,
        totalAttempts: previous.totalAttempts + 1,
      }));

      const shapeNameKey = SHAPE_NAME_KEY_BY_ID[shape];
      let followUpAudioKey: StatusKey | null = null;
      let runRecoveryFlow = false;

      if (shape === round.target) {
        triggerBoardFeedback('success');
        triggerPickFeedback(shape, 'success');
        if (attemptInRound === 0) {
          triggerScorePulse();
        }
        const successKey = ROUND_SUCCESS_KEYS[(roundNumber - 1) % ROUND_SUCCESS_KEYS.length];
        setStats((previous) => ({
          ...previous,
          correctAnswers: previous.correctAnswers + 1,
          firstAttemptHits: previous.firstAttemptHits + (attemptInRound === 0 ? 1 : 0),
        }));
        setRoundSolved(true);
        setConsecutiveMisses(0);
        setMessage({
          key: successKey,
          tone: 'success',
        });
        followUpAudioKey = successKey;
      } else {
        const nextMissCount = consecutiveMisses + 1;
        triggerBoardFeedback('miss');
        triggerPickFeedback(shape, 'miss');
        setAttemptInRound((previous) => previous + 1);
        setConsecutiveMisses(nextMissCount);
        incrementHintUsage(roundNumber);

        setStats((previous) => ({
          ...previous,
          confusionPairs: {
            ...previous.confusionPairs,
            [`${round.target}:${shape}`]: (previous.confusionPairs[`${round.target}:${shape}`] ?? 0) + 1,
          },
        }));

        if (nextMissCount >= 3) {
          setMessage({ key: 'games.shapeSafari.recovery.demo.watchDubi', tone: 'hint' });
          runRecoveryFlow = true;
        } else if (nextMissCount === 2) {
          if (!round.simplifyApplied) {
            setRound(buildRound(roundNumber, maxConcurrentChoices, round.target, true));
          }
          setMessage({ key: 'games.shapeSafari.hints.lookAtCorners', tone: 'hint' });
          triggerTargetHighlight(round.target, 1400);
          followUpAudioKey = 'games.shapeSafari.hints.lookAtCorners';
        } else {
          setMessage({ key: round.promptKey, tone: 'neutral' });
          triggerReplayVisualFeedback(1200);
          followUpAudioKey = round.promptKey;
        }
      }

      const pickAudioToken = pickAudioTokenRef.current + 1;
      pickAudioTokenRef.current = pickAudioToken;

      void (async () => {
        await playNow(shapeNameKey);
        // Skip stale follow-up audio when a newer tap already took control of the audio queue.
        if (pickAudioTokenRef.current !== pickAudioToken) {
          return;
        }
        if (runRecoveryFlow) {
          await runRecoveryDemo();
          return;
        }
        if (followUpAudioKey) {
          await playQueued(followUpAudioKey);
        }
      })();
    },
    [
      attemptInRound,
      consecutiveMisses,
      incrementHintUsage,
      maxConcurrentChoices,
      playNow,
      playQueued,
      round.promptKey,
      round.simplifyApplied,
      round.target,
      roundNumber,
      roundSolved,
      runRecoveryDemo,
      sessionComplete,
      triggerBoardFeedback,
      triggerPickFeedback,
      triggerReplayVisualFeedback,
      triggerScorePulse,
      triggerTargetHighlight,
    ],
  );

  const onDragStart = useCallback(
    (shape: ShapeId) => (event: React.DragEvent<HTMLButtonElement>) => {
      if (roundSolved || sessionComplete) {
        return;
      }
      event.dataTransfer.setData('text/plain', shape);
      event.dataTransfer.effectAllowed = 'move';
    },
    [roundSolved, sessionComplete],
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      setDragOver(false);
      const payload = event.dataTransfer.getData('text/plain') as ShapeId;
      if (!payload) {
        return;
      }
      handlePickShape(payload);
    },
    [handlePickShape],
  );

  const topConfusionPairLabel = useMemo(() => {
    const pair = getTopConfusionPair(stats.confusionPairs);
    if (!pair) {
      return `${t('shapes.names.square')} / ${t('shapes.names.rectangle')}`;
    }

    return `${t(SHAPE_NAME_KEY_BY_ID[pair[0]])} / ${t(SHAPE_NAME_KEY_BY_ID[pair[1]])}`;
  }, [stats.confusionPairs, t]);

  const accuracyLabel = useMemo(() => {
    const accuracy = Math.round((stats.correctAnswers / Math.max(stats.totalAttempts, 1)) * 100);
    return `${accuracy}%`;
  }, [stats.correctAnswers, stats.totalAttempts]);

  const toneClassName = `shape-safari__message shape-safari__message--${message.tone}`;
  const guideVariant = message.tone === 'success' ? 'success' : 'hint';

  return (
    <Card padding="lg" className="shape-safari">
      <div className="shape-safari__header">
        <div className="shape-safari__title-wrap">
          <h2 className="shape-safari__title">{t('games.shapeSafari.title')}</h2>
          <p className="shape-safari__subtitle">{t('games.shapeSafari.subtitle')}</p>
        </div>

        <div className="shape-safari__round-pill" aria-live="polite">
          {Math.min(roundNumber, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}
        </div>
      </div>

      <div className="shape-safari__progress">
        <span className="sr-only">{t('games.estimatedTime', { minutes: 5 })}</span>
        {progressSegments.map((segment) => {
          const state =
            segment < roundNumber
              ? 'done'
              : segment === roundNumber
                ? 'active'
                : 'pending';

          return (
            <span
              key={`segment-${segment}`}
              className={[
                'shape-safari__progress-dot',
                `shape-safari__progress-dot--${state}`,
                state === 'active' ? 'shape-safari__progress-dot--active-live' : '',
              ].join(' ')}
              aria-hidden="true"
            />
          );
        })}
      </div>

      <div className="shape-safari__score-strip" aria-hidden="true">
        <span className={['shape-safari__score-pill', scorePulse ? 'shape-safari__score-pill--pulse' : ''].join(' ')}>
          <span>⭐</span>
          <span>{stats.firstAttemptHits}</span>
        </span>
        <span className="shape-safari__score-pill">
          <span>🎯</span>
          <span>
            {Math.min(roundNumber, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
          </span>
        </span>
      </div>

      <div className={['shape-safari__status-row', promptPulse ? 'shape-safari__status-row--pulse' : ''].join(' ')}>
        <FloatingGuide variant={guideVariant} celebrate={boardFeedback === 'success'} />
        <p className={toneClassName}>{t(message.key)}</p>
      </div>

      {audioPlaybackFailed && !sessionComplete && (
        <p className="shape-safari__audio-fallback">
          🔇 {t('games.shapeSafari.instructions.listenAndFind')}
        </p>
      )}

      {!sessionComplete && (
        <div className="shape-safari__controls">
          <button type="button" className="shape-safari__icon-button" onClick={handleReplay} aria-label={t('games.shapeSafari.instructions.tapReplay')}>
            {replayIcon}
          </button>
          <button type="button" className="shape-safari__icon-button" onClick={handleRetryRound} aria-label={t('games.shapeSafari.hints.gentleRetry')}>
            ↻
          </button>
          <button type="button" className="shape-safari__icon-button" onClick={handleHint} aria-label={t('games.shapeSafari.hints.checkEdges')}>
            💡
          </button>
          <button
            type="button"
            className="shape-safari__icon-button"
            onClick={handleNextRound}
            disabled={!roundSolved}
            aria-label={t('nav.next')}
          >
            {nextIcon}
          </button>
        </div>
      )}

      {!sessionComplete && (
        <>
          <div
            className={`shape-safari__target-zone ${dragOver ? 'is-drag-over' : ''}`}
            onDragOver={(event) => {
              if (round.mode === 'match') return;
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => {
              setDragOver(false);
            }}
            onDrop={onDrop}
            aria-live="polite"
          >
            <span className="shape-safari__target-label">{t(SHAPE_NAME_KEY_BY_ID[round.target])}</span>
            <span className={`shape-safari__target-symbol ${highlightShape === round.target ? 'is-highlight' : ''}`}>
              {SHAPE_SYMBOL_BY_ID[round.target]}
            </span>
            <small className="shape-safari__target-note">
              {round.mode === 'missing'
                ? t('games.shapeSafari.instructions.chooseMissing')
                : round.mode === 'sort'
                  ? t('games.shapeSafari.instructions.dragToMatch')
                  : t('games.shapeSafari.instructions.listenAndFind')}
            </small>
          </div>

          <div
            className={[
              'shape-safari__options-grid',
              boardFeedback === 'success' ? 'shape-safari__options-grid--success' : '',
              boardFeedback === 'miss' ? 'shape-safari__options-grid--miss' : '',
            ].join(' ')}
          >
            {round.options.map((shape) => {
              const isTargetHighlight = highlightShape === shape;

              return (
                <button
                  key={`${round.id}-${shape}`}
                  type="button"
                  className={[
                    'shape-safari__shape-card',
                    isTargetHighlight ? 'is-highlight' : '',
                    lastPickedShape === shape && pickFeedback === 'success' ? 'is-picked-success' : '',
                    lastPickedShape === shape && pickFeedback === 'miss' ? 'is-picked-miss' : '',
                  ].join(' ')}
                  onClick={() => handlePickShape(shape)}
                  draggable={round.mode !== 'match'}
                  onDragStart={onDragStart(shape)}
                  disabled={roundSolved}
                  aria-label={t(SHAPE_NAME_KEY_BY_ID[shape])}
                >
                  <span className="shape-safari__shape-symbol">{SHAPE_SYMBOL_BY_ID[shape]}</span>
                  <span className="shape-safari__shape-name">{t(SHAPE_NAME_KEY_BY_ID[shape])}</span>
                  {round.tapFallbackEnabled && <small className="shape-safari__tap-note">↕</small>}
                </button>
              );
            })}
          </div>
        </>
      )}

      {sessionComplete && (
        <div className="shape-safari__completion">
          <SuccessCelebration />
          <p className="shape-safari__completion-title">{t('feedback.youDidIt')}</p>
          <p className="shape-safari__completion-summary">
            {t('parentDashboard.games.shapeSafari.progressSummary', {
              accuracy: accuracyLabel,
              confusedPair: topConfusionPairLabel,
            })}
          </p>
          <p className="shape-safari__completion-next">{t('parentDashboard.games.shapeSafari.nextStep')}</p>
        </div>
      )}

      <style>{`
        .shape-safari {
          display: grid;
          gap: var(--space-md);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 24%, transparent);
          background:
            radial-gradient(circle at 90% 0%, color-mix(in srgb, var(--color-accent-secondary) 16%, transparent), transparent 56%),
            radial-gradient(circle at 10% 100%, color-mix(in srgb, var(--color-accent-primary) 14%, transparent), transparent 60%),
            var(--color-surface);
        }

        .shape-safari__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-sm);
          flex-wrap: wrap;
        }

        .shape-safari__title-wrap {
          display: grid;
          gap: var(--space-2xs);
        }

        .shape-safari__title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-xl);
        }

        .shape-safari__subtitle {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .shape-safari__round-pill {
          min-height: 48px;
          min-width: 112px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding-inline: var(--space-sm);
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-accent-primary) 18%, transparent);
          color: var(--color-text-primary);
          font-weight: var(--font-weight-semibold);
        }

        .shape-safari__progress {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 1fr;
          gap: var(--space-xs);
        }

        .shape-safari__progress-dot {
          block-size: 10px;
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-border) 70%, transparent);
          transition: var(--transition-fast);
        }

        .shape-safari__progress-dot--done {
          background: var(--color-accent-success);
        }

        .shape-safari__progress-dot--active {
          background: var(--color-accent-primary);
          transform: scaleY(1.35);
        }

        .shape-safari__progress-dot--active-live {
          animation: shape-safari-progress-live 1.1s ease-in-out infinite;
        }

        .shape-safari__score-strip {
          display: inline-flex;
          gap: var(--space-xs);
          align-items: center;
        }

        .shape-safari__score-pill {
          min-height: 48px;
          padding-inline: var(--space-sm);
          border-radius: var(--radius-full);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 34%, transparent);
          background: color-mix(in srgb, var(--color-accent-primary) 12%, transparent);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2xs);
          color: var(--color-text-primary);
          font-weight: var(--font-weight-semibold);
          font-size: var(--font-size-sm);
        }

        .shape-safari__score-pill--pulse {
          animation: shape-safari-score-pill 420ms var(--motion-ease-bounce);
        }

        .shape-safari__status-row {
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm);
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          background: color-mix(in srgb, var(--color-surface-muted) 80%, transparent);
        }

        .shape-safari__status-row--pulse {
          border-color: color-mix(in srgb, var(--color-accent-primary) 64%, transparent);
          background: color-mix(in srgb, var(--color-accent-primary) 12%, var(--color-surface-muted));
          animation: shape-safari-prompt-pulse 360ms ease-out;
        }

        .shape-safari__floating-guide,
        .shape-safari__floating-guide * {
          pointer-events: none;
        }

        .shape-safari__floating-guide--celebrate {
          animation: shape-safari-guide-cheer 340ms ease-out;
        }

        .shape-safari__message {
          margin: 0;
          font-size: var(--font-size-md);
          color: var(--color-text-primary);
          line-height: 1.35;
        }

        .shape-safari__message--hint {
          color: color-mix(in srgb, var(--color-accent-warning) 80%, var(--color-text-primary));
        }

        .shape-safari__message--success {
          color: color-mix(in srgb, var(--color-accent-success) 82%, var(--color-text-primary));
        }

        .shape-safari__audio-fallback {
          margin: 0;
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-sm);
          border: 1px solid color-mix(in srgb, var(--color-accent-warning) 46%, transparent);
          background: color-mix(in srgb, var(--color-accent-warning) 16%, transparent);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          text-align: center;
        }

        .shape-safari__controls {
          display: grid;
          grid-template-columns: repeat(4, minmax(48px, 1fr));
          gap: var(--space-xs);
        }

        .shape-safari__icon-button {
          min-height: 48px;
          min-width: 48px;
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          font-size: 1.2rem;
          cursor: pointer;
          color: var(--color-text-primary);
          transition: transform 130ms ease, box-shadow 130ms ease, border-color 130ms ease;
        }

        .shape-safari__icon-button:not(:disabled):active {
          transform: scale(0.97);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-primary) 20%, transparent);
        }

        .shape-safari__icon-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .shape-safari__target-zone {
          min-height: 88px;
          padding: var(--space-md);
          border: 2px dashed color-mix(in srgb, var(--color-accent-primary) 44%, var(--color-border));
          border-radius: var(--radius-lg);
          display: grid;
          justify-items: center;
          align-content: center;
          gap: var(--space-2xs);
          text-align: center;
          background: color-mix(in srgb, var(--color-surface-muted) 72%, transparent);
        }

        .shape-safari__target-zone.is-drag-over {
          background: color-mix(in srgb, var(--color-accent-primary) 18%, var(--color-surface-muted));
        }

        .shape-safari__target-label {
          font-size: var(--font-size-md);
          color: var(--color-text-secondary);
        }

        .shape-safari__target-symbol {
          font-size: 2rem;
          color: var(--color-text-primary);
          transition: transform 160ms ease, color 160ms ease;
        }

        .shape-safari__target-symbol.is-highlight {
          transform: scale(1.18);
          color: var(--color-accent-primary);
        }

        .shape-safari__target-note {
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
        }

        .shape-safari__options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
          gap: var(--space-sm);
          transform-origin: center;
        }

        .shape-safari__options-grid--success {
          animation: shape-safari-grid-success 340ms ease-out;
        }

        .shape-safari__options-grid--miss {
          animation: shape-safari-grid-miss 300ms ease-in-out;
        }

        .shape-safari__shape-card {
          min-height: 92px;
          min-width: 48px;
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          display: grid;
          justify-items: center;
          align-content: center;
          gap: var(--space-2xs);
          cursor: pointer;
          padding: var(--space-xs);
          color: var(--color-text-primary);
          transition: transform 140ms ease, border-color 140ms ease;
        }

        .shape-safari__shape-card:hover {
          transform: translateY(-2px);
          border-color: color-mix(in srgb, var(--color-accent-primary) 52%, var(--color-border));
        }

        .shape-safari__shape-card:disabled {
          cursor: default;
          opacity: 0.6;
          transform: none;
        }

        .shape-safari__shape-card.is-highlight {
          border-color: var(--color-accent-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-primary) 26%, transparent);
        }

        .shape-safari__shape-card.is-picked-success {
          border-color: var(--color-accent-success);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent-success) 24%, transparent);
          animation: shape-safari-card-pop 300ms ease-out;
        }

        .shape-safari__shape-card.is-picked-miss {
          border-color: color-mix(in srgb, var(--color-warning) 80%, black);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-warning) 20%, transparent);
          animation: shape-safari-card-miss 240ms ease-in-out;
        }

        .shape-safari__shape-symbol {
          font-size: 1.8rem;
        }

        .shape-safari__shape-name {
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
        }

        .shape-safari__tap-note {
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
        }

        .shape-safari__completion {
          display: grid;
          gap: var(--space-sm);
          justify-items: center;
          text-align: center;
          padding: var(--space-lg);
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-accent-success) 44%, transparent);
          background: color-mix(in srgb, var(--color-accent-success) 12%, transparent);
        }

        .shape-safari__completion-title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
        }

        .shape-safari__completion-summary,
        .shape-safari__completion-next {
          margin: 0;
          color: var(--color-text-secondary);
        }

        @keyframes shape-safari-progress-live {
          0% { transform: scaleY(1.35); }
          50% { transform: scaleY(1.62); }
          100% { transform: scaleY(1.35); }
        }

        @keyframes shape-safari-score-pill {
          0% { transform: scale(0.94); }
          65% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }

        @keyframes shape-safari-grid-success {
          0% { transform: scale(1); }
          40% {
            transform: scale(1.015);
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent-success) 44%, transparent);
          }
          100% {
            transform: scale(1);
            box-shadow: none;
          }
        }

        @keyframes shape-safari-grid-miss {
          0% { transform: translateX(0); }
          25% { transform: translateX(6px); }
          50% { transform: translateX(-6px); }
          75% { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }

        @keyframes shape-safari-prompt-pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent-primary) 28%, transparent);
          }
          55% {
            transform: scale(1.01);
            box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-accent-primary) 0%, transparent);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent-primary) 0%, transparent);
          }
        }

        @keyframes shape-safari-guide-cheer {
          0% {
            transform: translateY(0) scale(1);
          }
          45% {
            transform: translateY(-4px) scale(1.06);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }

        @keyframes shape-safari-card-pop {
          0% {
            transform: scale(1);
          }
          55% {
            transform: scale(1.07);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes shape-safari-card-miss {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        @media (max-width: 768px) {
          .shape-safari {
            padding: var(--space-md);
          }

          .shape-safari__title {
            font-size: var(--font-size-lg);
          }

          .shape-safari__target-zone {
            min-height: 78px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .shape-safari__target-symbol,
          .shape-safari__shape-card,
          .shape-safari__progress-dot,
          .shape-safari__progress-dot--active-live,
          .shape-safari__status-row--pulse,
          .shape-safari__floating-guide--celebrate,
          .shape-safari__score-pill--pulse,
          .shape-safari__options-grid--success,
          .shape-safari__options-grid--miss,
          .shape-safari__shape-card.is-picked-success,
          .shape-safari__shape-card.is-picked-miss {
            animation: none !important;
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </Card>
  );
}

function FloatingGuide({ variant, celebrate }: { variant: 'hint' | 'success'; celebrate: boolean }) {
  return (
    <div
      className={['shape-safari__floating-guide', celebrate ? 'shape-safari__floating-guide--celebrate' : ''].join(
        ' ',
      )}
      aria-hidden="true"
    >
      <MascotIllustration variant={variant} size={52} />
    </div>
  );
}
