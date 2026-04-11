import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameCompletionResult, GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { resolveGameConcurrentChoiceLimit } from '@/lib/concurrentChoiceLimit';
import { isRtlDirection, rtlNextGlyph, rtlReplayGlyph } from '@/lib/rtlChrome';

type GameConcept = 'within_ten' | 'bridge_to_10' | 'missing_addend';
type RoundFlow = 'prompt' | 'input' | 'validate' | 'feedback' | 'remediation' | 'next';
type MessageTone = 'neutral' | 'hint' | 'success';
type BoardFeedback = 'idle' | 'success' | 'miss';

type InstructionKey =
  | 'games.numberLineJumps.instructions.intro'
  | 'games.numberLineJumps.instructions.listenAndPlanJump'
  | 'games.numberLineJumps.instructions.dragOrTapJumps'
  | 'games.numberLineJumps.instructions.confirmDestination'
  | 'games.numberLineJumps.instructions.tapReplay';

type AdditionPromptKey =
  | 'games.numberLineJumps.prompts.addition.startAndAdd'
  | 'games.numberLineJumps.prompts.addition.jumpForward'
  | 'games.numberLineJumps.prompts.addition.countOn'
  | 'games.numberLineJumps.prompts.addition.splitAndJump';

type MissingAddendPromptKey =
  | 'games.numberLineJumps.prompts.missingAddend.reachTarget'
  | 'games.numberLineJumps.prompts.missingAddend.howManyJumps'
  | 'games.numberLineJumps.prompts.missingAddend.findMissingPart'
  | 'games.numberLineJumps.prompts.missingAddend.bridgeToTarget';

type PromptKey = AdditionPromptKey | MissingAddendPromptKey;

type HintKey =
  | 'games.numberLineJumps.hints.countStepByStep'
  | 'games.numberLineJumps.hints.splitBigJump'
  | 'games.numberLineJumps.hints.useTenAnchor'
  | 'games.numberLineJumps.hints.replayPrompt'
  | 'games.numberLineJumps.hints.gentleRetry';

type StrategyPraiseKey =
  | 'games.numberLineJumps.strategyPraise.smartChunking'
  | 'games.numberLineJumps.strategyPraise.usedTenAnchor'
  | 'games.numberLineJumps.strategyPraise.steadyCounting';

type LevelTransitionKey =
  | 'games.numberLineJumps.levelTransitions.withinTen'
  | 'games.numberLineJumps.levelTransitions.withinTwenty'
  | 'games.numberLineJumps.levelTransitions.strategyRounds';

type EncouragementKey =
  | 'games.numberLineJumps.feedback.encouragement.keepTrying'
  | 'games.numberLineJumps.feedback.encouragement.almostThere'
  | 'games.numberLineJumps.feedback.encouragement.tryAgain';

type SuccessKey =
  | 'games.numberLineJumps.feedback.success.wellDone'
  | 'games.numberLineJumps.feedback.success.amazing'
  | 'games.numberLineJumps.feedback.success.celebrate';

type GlobalFeedbackKey = 'feedback.greatEffort' | 'feedback.keepGoing' | 'feedback.excellent' | 'feedback.youDidIt';

type ParentSummaryKey =
  | 'parentDashboard.games.numberLineJumps.progressSummary'
  | 'parentDashboard.games.numberLineJumps.nextStep';

type StatusKey =
  | InstructionKey
  | PromptKey
  | HintKey
  | StrategyPraiseKey
  | LevelTransitionKey
  | EncouragementKey
  | SuccessKey
  | GlobalFeedbackKey
  | ParentSummaryKey
  | 'games.numberLineJumps.title'
  | 'games.numberLineJumps.subtitle'
  | 'nav.next';

interface RoundState {
  id: string;
  roundNumber: number;
  concept: GameConcept;
  instructionKey: InstructionKey;
  transitionKey: LevelTransitionKey | null;
  promptKey: PromptKey;
  promptValues?: {
    start: number;
    target: number;
  };
  start: number;
  target: number;
  requiredJump: number;
  stepChoices: number[];
  showTenAnchor: boolean;
  showCounters: boolean;
  requiresReplayBeforeInput: boolean;
  highlightNextHop: boolean;
}

interface RoundMessage {
  key: StatusKey;
  tone: MessageTone;
}

interface SessionStats {
  firstAttemptSuccesses: number;
  hintUsageByRound: number[];
  highestTargetReached: number;
}

interface BuildRoundOptions {
  roundNumber: number;
  simplify: boolean;
  remediation: boolean;
  lockToTwoChoices: boolean;
  maxConcurrentChoices: number;
}

interface SessionSummary {
  accuracy: number;
  hintTrendLabelKey: Extract<GlobalFeedbackKey, 'feedback.excellent' | 'feedback.keepGoing' | 'feedback.greatEffort'>;
  hintTrendText: string;
}

interface JumpTrailSegment {
  id: string;
  from: number;
  to: number;
  step: number;
}

const TOTAL_ROUNDS = 8;
const CHECKPOINT_ROUND = 4;
const NUMBER_LINE_MAX = 20;
const NUMBER_LINE_VALUES = Array.from({ length: NUMBER_LINE_MAX + 1 }, (_, index) => index);

const ADDITION_PROMPT_ROTATION: AdditionPromptKey[] = [
  'games.numberLineJumps.prompts.addition.startAndAdd',
  'games.numberLineJumps.prompts.addition.jumpForward',
  'games.numberLineJumps.prompts.addition.countOn',
  'games.numberLineJumps.prompts.addition.splitAndJump',
];

const MISSING_ADDEND_PROMPT_ROTATION: MissingAddendPromptKey[] = [
  'games.numberLineJumps.prompts.missingAddend.reachTarget',
  'games.numberLineJumps.prompts.missingAddend.howManyJumps',
  'games.numberLineJumps.prompts.missingAddend.findMissingPart',
  'games.numberLineJumps.prompts.missingAddend.bridgeToTarget',
];

const ENCOURAGEMENT_ROTATION: EncouragementKey[] = [
  'games.numberLineJumps.feedback.encouragement.keepTrying',
  'games.numberLineJumps.feedback.encouragement.almostThere',
  'games.numberLineJumps.feedback.encouragement.tryAgain',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)] as T;
}

function getAudioPathForKey(key: StatusKey): string {
  return resolveAudioPathFromKey(key, 'common');
}

function getBaseConcept(roundNumber: number): GameConcept {
  if (roundNumber <= 3) {
    return 'within_ten';
  }

  if (roundNumber <= 6) {
    return 'bridge_to_10';
  }

  return 'missing_addend';
}

function downgradeConcept(concept: GameConcept): GameConcept {
  if (concept === 'missing_addend') {
    return 'bridge_to_10';
  }

  if (concept === 'bridge_to_10') {
    return 'within_ten';
  }

  return concept;
}

function getTransitionKey(roundNumber: number): LevelTransitionKey | null {
  if (roundNumber === 1) {
    return 'games.numberLineJumps.levelTransitions.withinTen';
  }

  if (roundNumber === 4) {
    return 'games.numberLineJumps.levelTransitions.withinTwenty';
  }

  if (roundNumber === 7) {
    return 'games.numberLineJumps.levelTransitions.strategyRounds';
  }

  return null;
}

function getInstructionKey(roundNumber: number, concept: GameConcept): InstructionKey {
  if (roundNumber === 1) {
    return 'games.numberLineJumps.instructions.intro';
  }

  if (concept === 'missing_addend') {
    return 'games.numberLineJumps.instructions.confirmDestination';
  }

  if (concept === 'bridge_to_10') {
    return 'games.numberLineJumps.instructions.dragOrTapJumps';
  }

  return 'games.numberLineJumps.instructions.listenAndPlanJump';
}

function getStepChoices(
  requiredJump: number,
  concept: GameConcept,
  simplify: boolean,
  lockToTwoChoices: boolean,
  maxConcurrentChoices: number,
): number[] {
  if (lockToTwoChoices) {
    const reduced = new Set<number>([1, Math.min(3, Math.max(1, requiredJump))]);
    return Array.from(reduced).sort((left, right) => left - right);
  }

  const baseChoices =
    concept === 'within_ten'
      ? [1, 2, 3]
      : concept === 'bridge_to_10'
        ? [1, 2, 3, 5]
        : [1, 2, 3, 4, 5];

  const choices = new Set<number>(simplify ? baseChoices.slice(0, 3) : baseChoices);
  choices.add(1);

  if (requiredJump <= 5) {
    choices.add(requiredJump);
  }

  if (!simplify && requiredJump >= 6) {
    choices.add(6);
  }

  const orderedChoices = Array.from(choices).sort((left, right) => left - right);
  const cap = Math.max(2, maxConcurrentChoices);
  if (orderedChoices.length <= cap) {
    return orderedChoices;
  }

  const preferred = new Set<number>([1]);
  if (requiredJump <= 6) {
    preferred.add(requiredJump);
  }

  const prioritized = [
    ...orderedChoices.filter((value) => preferred.has(value)),
    ...orderedChoices.filter((value) => !preferred.has(value)),
  ];

  return prioritized.slice(0, cap).sort((left, right) => left - right);
}

function buildRound(options: BuildRoundOptions): RoundState {
  const baseConcept = getBaseConcept(options.roundNumber);
  const concept = options.simplify ? downgradeConcept(baseConcept) : baseConcept;

  let start = 0;
  let target = 0;

  if (concept === 'within_ten') {
    const addend = randomInt(1, options.simplify ? 2 : 3);
    start = randomInt(0, 10 - addend);
    target = start + addend;
  } else if (concept === 'bridge_to_10') {
    const shouldCrossTen = options.roundNumber % 2 === 0;
    const minStart = shouldCrossTen ? 7 : 4;
    const maxStart = shouldCrossTen ? 9 : 14;

    start = randomInt(minStart, maxStart);

    const minAddend = options.simplify ? 2 : 3;
    const maxAddend = options.simplify ? 4 : 5;
    const addend = randomInt(minAddend, maxAddend);

    target = Math.min(NUMBER_LINE_MAX, start + addend);
    if (target === start) {
      target = Math.min(NUMBER_LINE_MAX, start + 2);
    }
  } else {
    start = randomInt(options.simplify ? 5 : 7, options.simplify ? 12 : 16);
    target = Math.min(NUMBER_LINE_MAX, start + randomInt(options.simplify ? 2 : 3, options.simplify ? 4 : 7));
  }

  const requiredJump = Math.max(1, target - start);
  const stepChoices = getStepChoices(
    requiredJump,
    concept,
    options.simplify,
    options.lockToTwoChoices,
    options.maxConcurrentChoices,
  );

  const promptKey: PromptKey =
    concept === 'missing_addend'
      ? MISSING_ADDEND_PROMPT_ROTATION[(options.roundNumber - 1) % MISSING_ADDEND_PROMPT_ROTATION.length]!
      : ADDITION_PROMPT_ROTATION[(options.roundNumber - 1) % ADDITION_PROMPT_ROTATION.length]!;

  return {
    id: `number-line-${options.roundNumber}-${Math.random().toString(36).slice(2, 10)}`,
    roundNumber: options.roundNumber,
    concept,
    instructionKey: getInstructionKey(options.roundNumber, concept),
    transitionKey: getTransitionKey(options.roundNumber),
    promptKey,
    promptValues:
      concept === 'missing_addend'
        ? {
            start,
            target,
          }
        : undefined,
    start,
    target,
    requiredJump,
    stepChoices,
    showTenAnchor: target > 10,
    showCounters: options.remediation,
    requiresReplayBeforeInput: options.lockToTwoChoices,
    highlightNextHop: options.remediation,
  };
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

function getStableRange(highestTargetReached: number): StableRange {
  if (highestTargetReached >= 8) {
    return '1-10';
  }

  if (highestTargetReached >= 4) {
    return '1-5';
  }

  return '1-3';
}

function getHintTrendLabelKey(
  trend: ParentSummaryMetrics['hintTrend'],
): Extract<GlobalFeedbackKey, 'feedback.excellent' | 'feedback.keepGoing' | 'feedback.greatEffort'> {
  if (trend === 'improving') {
    return 'feedback.excellent';
  }

  if (trend === 'steady') {
    return 'feedback.keepGoing';
  }

  return 'feedback.greatEffort';
}

function buildSummary(stats: SessionStats): { metrics: ParentSummaryMetrics; summary: SessionSummary } {
  const roundsPlayed = stats.hintUsageByRound.length;
  const accuracy = roundsPlayed === 0 ? 0 : Math.round((stats.firstAttemptSuccesses / roundsPlayed) * 100);
  const hintTrend = getHintTrend(stats.hintUsageByRound);
  const hintTrendLabelKey = getHintTrendLabelKey(hintTrend);

  return {
    metrics: {
      highestStableRange: getStableRange(stats.highestTargetReached),
      firstAttemptSuccessRate: accuracy,
      hintTrend,
    },
    summary: {
      accuracy,
      hintTrendLabelKey,
      hintTrendText: hintTrend,
    },
  };
}

export function NumberLineJumpsGame({ level, child, onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir(i18n.language));
  const replayIcon = rtlReplayGlyph(isRtl);
  const nextIcon = rtlNextGlyph(isRtl);
  const maxConcurrentChoices = useMemo(
    () => resolveGameConcurrentChoiceLimit(level.configJson, child.birthDate),
    [child.birthDate, level.configJson],
  );

  const consecutiveMissesRef = useRef(0);
  const conceptMissHistoryRef = useRef<Array<{ concept: GameConcept; solvedRound: number }>>([]);
  const simplifyNextRoundRef = useRef(false);
  const lockChoicesNextRoundRef = useRef(false);
  const remediationNextRoundRef = useRef(false);
  const rapidMistapRef = useRef({ count: 0, lastAt: 0 });
  const boardFeedbackTimeoutRef = useRef<number | null>(null);
  const starPulseTimeoutRef = useRef<number | null>(null);

  const [round, setRound] = useState<RoundState>(() =>
    buildRound({
      roundNumber: 1,
      simplify: false,
      remediation: false,
      lockToTwoChoices: false,
      maxConcurrentChoices,
    }),
  );
  const [roundFlow, setRoundFlow] = useState<RoundFlow>('prompt');
  const [roundMessage, setRoundMessage] = useState<RoundMessage>({
    key: 'games.numberLineJumps.instructions.intro',
    tone: 'neutral',
  });
  const [selectedSteps, setSelectedSteps] = useState<number[]>([]);
  const [hintStep, setHintStep] = useState(0);
  const [usedHintThisRound, setUsedHintThisRound] = useState(false);
  const [roundAttempt, setRoundAttempt] = useState(0);
  const [resolvedRounds, setResolvedRounds] = useState(0);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    firstAttemptSuccesses: 0,
    hintUsageByRound: [],
    highestTargetReached: 0,
  });
  const [showNextAction, setShowNextAction] = useState(false);
  const [checkpointPaused, setCheckpointPaused] = useState(false);
  const [pendingRoundNumber, setPendingRoundNumber] = useState<number | null>(null);
  const [checkpointShown, setCheckpointShown] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [interactionSerial, setInteractionSerial] = useState(0);
  const [inactivityPulse, setInactivityPulse] = useState(false);
  const [firstAttemptStars, setFirstAttemptStars] = useState(0);
  const [starPulse, setStarPulse] = useState(false);
  const [boardFeedback, setBoardFeedback] = useState<BoardFeedback>('idle');
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);

  const totalJump = useMemo(() => selectedSteps.reduce((sum, value) => sum + value, 0), [selectedSteps]);
  const previewValue = round.start + totalJump;
  const remainingJump = Math.max(0, round.requiredJump - totalJump);
  const jumpTrail = useMemo<JumpTrailSegment[]>(() => {
    let cursor = round.start;
    return selectedSteps.map((step, index) => {
      const from = cursor;
      const to = Math.min(NUMBER_LINE_MAX, from + step);
      cursor = to;
      return {
        id: `${round.id}-hop-${index}-${from}-${to}`,
        from,
        to,
        step,
      };
    });
  }, [round.id, round.start, selectedSteps]);
  const lastHopTarget = jumpTrail.length > 0 ? jumpTrail[jumpTrail.length - 1]?.to ?? null : null;

  const progressSegments = useMemo(() => Array.from({ length: TOTAL_ROUNDS }, (_, index) => index + 1), []);

  const playAudioKey = useCallback(
    (key: StatusKey) => {
      if (audioPlaybackFailed) {
        return;
      }

      void audio.play(getAudioPathForKey(key)).catch(() => {
        setAudioPlaybackFailed(true);
      });
    },
    [audio, audioPlaybackFailed],
  );

  const setMessageWithAudio = useCallback(
    (key: StatusKey, tone: MessageTone) => {
      setRoundMessage({ key, tone });
      playAudioKey(key);
    },
    [playAudioKey],
  );

  const bumpInteraction = useCallback(() => {
    setInteractionSerial((value) => value + 1);
    setInactivityPulse(false);
  }, []);

  const triggerBoardFeedback = useCallback((nextState: Exclude<BoardFeedback, 'idle'>) => {
    if (boardFeedbackTimeoutRef.current) {
      window.clearTimeout(boardFeedbackTimeoutRef.current);
    }

    setBoardFeedback(nextState);
    boardFeedbackTimeoutRef.current = window.setTimeout(() => {
      setBoardFeedback('idle');
      boardFeedbackTimeoutRef.current = null;
    }, 420);
  }, []);

  const loadRound = useCallback(
    (roundNumber: number) => {
      const nextRound = buildRound({
        roundNumber,
        simplify: simplifyNextRoundRef.current,
        remediation: remediationNextRoundRef.current,
        lockToTwoChoices: lockChoicesNextRoundRef.current,
        maxConcurrentChoices,
      });

      simplifyNextRoundRef.current = false;
      remediationNextRoundRef.current = false;
      lockChoicesNextRoundRef.current = false;

      setRound(nextRound);
      setRoundFlow('prompt');
      setSelectedSteps([]);
      setHintStep(0);
      setUsedHintThisRound(false);
      setRoundAttempt(0);
      setShowNextAction(false);
      setInactivityPulse(false);
      setBoardFeedback('idle');
    },
    [maxConcurrentChoices],
  );

  const finalizeSession = useCallback(() => {
    const built = buildSummary(sessionStats);
    setSessionSummary(built.summary);
    setSessionComplete(true);
    setRoundFlow('feedback');
    setShowNextAction(false);
    setMessageWithAudio('feedback.youDidIt', 'success');
    playAudioKey('parentDashboard.games.numberLineJumps.progressSummary');

    const scoreBase = resolvedRounds * 120;
    const hintPenalty = sessionStats.hintUsageByRound.reduce((sum, value) => sum + value, 0) * 10;
    const score = Math.max(100, scoreBase - hintPenalty);

    const stars = built.metrics.firstAttemptSuccessRate >= 85 ? 3 : built.metrics.firstAttemptSuccessRate >= 65 ? 2 : 1;

    const completionResult: GameCompletionResult = {
      completed: true,
      score,
      stars,
      summaryMetrics: built.metrics,
      roundsCompleted: resolvedRounds,
    };

    onComplete(completionResult);
  }, [onComplete, playAudioKey, resolvedRounds, sessionStats, setMessageWithAudio]);

  const beginRetryWithSupport = useCallback(
    (showRemediation: boolean) => {
      setRoundFlow(showRemediation ? 'remediation' : 'input');
      setSelectedSteps([]);
      setRoundAttempt((value) => value + 1);
      setUsedHintThisRound(true);
      setHintStep((value) => Math.max(value, showRemediation ? 2 : 1));
      setRound((current) => ({
        ...current,
        showCounters: current.showCounters || showRemediation,
        highlightNextHop: true,
        requiresReplayBeforeInput: false,
      }));

      setMessageWithAudio(
        showRemediation ? 'games.numberLineJumps.hints.countStepByStep' : 'games.numberLineJumps.hints.gentleRetry',
        'hint',
      );

      if (showRemediation) {
        const guidedStep = round.showTenAnchor && round.start < 10 && round.target > 10 ? Math.max(1, 10 - round.start) : 1;
        const assistedStep =
          round.requiredJump <= 1 ? 0 : Math.min(guidedStep, Math.max(1, round.requiredJump - 1));

        window.setTimeout(() => {
          setSelectedSteps(assistedStep > 0 ? [assistedStep] : []);
          setRoundFlow('input');
        }, 280);
      }
    },
    [round.requiredJump, round.showTenAnchor, round.start, round.target, setMessageWithAudio],
  );

  const handleRoundSuccess = useCallback(
    (steps: number[]) => {
      const usedStrategyKey: StrategyPraiseKey =
        round.showTenAnchor && steps.some((step) => round.start + step === 10)
          ? 'games.numberLineJumps.strategyPraise.usedTenAnchor'
          : steps.length >= 2
            ? 'games.numberLineJumps.strategyPraise.smartChunking'
            : 'games.numberLineJumps.strategyPraise.steadyCounting';

      setRoundFlow('feedback');
      setShowNextAction(true);
      setMessageWithAudio(usedStrategyKey, 'success');
      triggerBoardFeedback('success');

      if (roundAttempt === 0) {
        setFirstAttemptStars((value) => value + 1);
        setStarPulse(true);
        if (starPulseTimeoutRef.current) {
          window.clearTimeout(starPulseTimeoutRef.current);
        }
        starPulseTimeoutRef.current = window.setTimeout(() => {
          setStarPulse(false);
          starPulseTimeoutRef.current = null;
        }, 520);
      }

      consecutiveMissesRef.current = 0;

      setSessionStats((current) => ({
        firstAttemptSuccesses: current.firstAttemptSuccesses + (roundAttempt === 0 ? 1 : 0),
        hintUsageByRound: [...current.hintUsageByRound, usedHintThisRound ? Math.max(1, hintStep) : 0],
        highestTargetReached: Math.max(current.highestTargetReached, round.target),
      }));

      setResolvedRounds((value) => value + 1);
      setRoundFlow('next');
    },
    [hintStep, round.showTenAnchor, round.start, round.target, roundAttempt, setMessageWithAudio, triggerBoardFeedback, usedHintThisRound],
  );

  const handleRoundMiss = useCallback(() => {
    setRoundFlow('feedback');
    triggerBoardFeedback('miss');

    const encouragementKey = ENCOURAGEMENT_ROTATION[roundAttempt % ENCOURAGEMENT_ROTATION.length]!;
    setMessageWithAudio(encouragementKey, 'hint');

    consecutiveMissesRef.current += 1;
    simplifyNextRoundRef.current = consecutiveMissesRef.current >= 2;

    const solvedRound = resolvedRounds + 1;
    conceptMissHistoryRef.current = [...conceptMissHistoryRef.current, { concept: round.concept, solvedRound }].filter(
      (entry) => solvedRound - entry.solvedRound < 5,
    );

    const conceptMisses = conceptMissHistoryRef.current.filter((entry) => entry.concept === round.concept).length;
    const shouldRemediate = conceptMisses >= 3 || roundAttempt >= 2;

    if (shouldRemediate) {
      remediationNextRoundRef.current = true;
    }

    const now = Date.now();
    if (now - rapidMistapRef.current.lastAt <= 900) {
      rapidMistapRef.current.count += 1;
    } else {
      rapidMistapRef.current.count = 1;
    }
    rapidMistapRef.current.lastAt = now;

    if (rapidMistapRef.current.count >= 4) {
      lockChoicesNextRoundRef.current = true;
      setRound((current) => ({
        ...current,
        requiresReplayBeforeInput: true,
      }));
      setMessageWithAudio('games.numberLineJumps.hints.replayPrompt', 'hint');
    }

    window.setTimeout(() => {
      beginRetryWithSupport(shouldRemediate);
    }, 420);
  }, [beginRetryWithSupport, resolvedRounds, round.concept, roundAttempt, setMessageWithAudio, triggerBoardFeedback]);

  const validateCurrentInput = useCallback(
    (steps: number[]) => {
      const total = steps.reduce((sum, value) => sum + value, 0);
      if (total === round.requiredJump) {
        handleRoundSuccess(steps);
        return;
      }

      handleRoundMiss();
    },
    [handleRoundMiss, handleRoundSuccess, round.requiredJump],
  );

  const handleStepTap = useCallback(
    (step: number) => {
      if (sessionComplete || checkpointPaused || roundFlow !== 'input') {
        return;
      }

      bumpInteraction();

      if (round.requiresReplayBeforeInput) {
        setMessageWithAudio('games.numberLineJumps.hints.replayPrompt', 'hint');
        return;
      }

      const nextSteps = [...selectedSteps, step];
      const nextTotal = nextSteps.reduce((sum, value) => sum + value, 0);
      setSelectedSteps(nextSteps);
      setRoundFlow('validate');

      if (nextTotal >= round.requiredJump) {
        window.setTimeout(() => {
          validateCurrentInput(nextSteps);
        }, 120);
        return;
      }

      setRoundFlow('input');
    },
    [
      bumpInteraction,
      checkpointPaused,
      round.requiredJump,
      round.requiresReplayBeforeInput,
      roundFlow,
      selectedSteps,
      sessionComplete,
      setMessageWithAudio,
      validateCurrentInput,
    ],
  );

  const handleReplayPrompt = useCallback(() => {
    if (sessionComplete || checkpointPaused) {
      return;
    }

    bumpInteraction();
    setRound((current) => ({
      ...current,
      requiresReplayBeforeInput: false,
    }));
    setMessageWithAudio('games.numberLineJumps.instructions.tapReplay', 'hint');
    window.setTimeout(() => {
      playAudioKey(round.promptKey);
    }, 160);
  }, [bumpInteraction, checkpointPaused, playAudioKey, round.promptKey, sessionComplete, setMessageWithAudio]);

  const handleHint = useCallback(() => {
    if (sessionComplete || checkpointPaused || roundFlow === 'next') {
      return;
    }

    bumpInteraction();
    setUsedHintThisRound(true);

    setHintStep((value) => {
      const next = Math.min(value + 1, 3);

      if (next === 1) {
        setMessageWithAudio('games.numberLineJumps.hints.replayPrompt', 'hint');
        window.setTimeout(() => {
          playAudioKey(round.promptKey);
        }, 140);
      } else if (next === 2) {
        const hintKey = round.showTenAnchor
          ? 'games.numberLineJumps.hints.useTenAnchor'
          : 'games.numberLineJumps.hints.splitBigJump';
        setRound((current) => ({ ...current, highlightNextHop: true }));
        setMessageWithAudio(hintKey, 'hint');
      } else {
        beginRetryWithSupport(true);
      }

      return next;
    });
  }, [
    beginRetryWithSupport,
    bumpInteraction,
    checkpointPaused,
    playAudioKey,
    round.promptKey,
    round.showTenAnchor,
    roundFlow,
    sessionComplete,
    setMessageWithAudio,
  ]);

  const handleRetry = useCallback(() => {
    if (sessionComplete || checkpointPaused || roundFlow === 'next') {
      return;
    }

    bumpInteraction();
    setRound((current) => ({
      ...current,
      requiresReplayBeforeInput: false,
    }));
    beginRetryWithSupport(false);
  }, [beginRetryWithSupport, bumpInteraction, checkpointPaused, roundFlow, sessionComplete]);

  const handleNext = useCallback(() => {
    if (sessionComplete || !showNextAction) {
      return;
    }

    bumpInteraction();
    playAudioKey('nav.next');

    if (resolvedRounds >= TOTAL_ROUNDS) {
      finalizeSession();
      return;
    }

    if (resolvedRounds === CHECKPOINT_ROUND && !checkpointShown) {
      setCheckpointShown(true);
      setCheckpointPaused(true);
      setPendingRoundNumber(resolvedRounds + 1);
      setMessageWithAudio('feedback.greatEffort', 'success');
      return;
    }

    loadRound(resolvedRounds + 1);
  }, [
    bumpInteraction,
    checkpointShown,
    finalizeSession,
    loadRound,
    playAudioKey,
    resolvedRounds,
    sessionComplete,
    setMessageWithAudio,
    showNextAction,
  ]);

  const handleContinueAfterCheckpoint = useCallback(() => {
    if (!pendingRoundNumber) {
      return;
    }

    setCheckpointPaused(false);
    loadRound(pendingRoundNumber);
    setPendingRoundNumber(null);
    playAudioKey('nav.next');
    setMessageWithAudio('games.numberLineJumps.instructions.listenAndPlanJump', 'neutral');
  }, [loadRound, pendingRoundNumber, playAudioKey, setMessageWithAudio]);

  const handleCheckpointReplay = useCallback(() => {
    if (!checkpointPaused) {
      return;
    }

    bumpInteraction();
    playAudioKey('games.numberLineJumps.instructions.listenAndPlanJump');
  }, [bumpInteraction, checkpointPaused, playAudioKey]);

  useEffect(() => {
    if (sessionComplete || checkpointPaused) {
      return;
    }

    const introKey = round.transitionKey ?? round.instructionKey;
    const introTone: MessageTone = round.transitionKey ? 'success' : 'neutral';
    setMessageWithAudio(introKey, introTone);

    const promptTimeout = window.setTimeout(() => {
      playAudioKey(round.promptKey);
      if (round.requiresReplayBeforeInput) {
        setMessageWithAudio('games.numberLineJumps.hints.replayPrompt', 'hint');
      }
      setRoundFlow('input');
    }, round.transitionKey ? 520 : 280);

    return () => {
      window.clearTimeout(promptTimeout);
    };
  }, [
    checkpointPaused,
    playAudioKey,
    round.id,
    round.instructionKey,
    round.promptKey,
    round.requiresReplayBeforeInput,
    round.transitionKey,
    sessionComplete,
    setMessageWithAudio,
  ]);

  useEffect(() => {
    if (sessionComplete || checkpointPaused || roundFlow !== 'input') {
      return;
    }

    const inactivityTimeout = window.setTimeout(() => {
      setInactivityPulse(true);
      setMessageWithAudio('games.numberLineJumps.hints.replayPrompt', 'hint');
      playAudioKey(round.promptKey);
      setRound((current) => ({ ...current, highlightNextHop: true }));
    }, 8000);

    return () => {
      window.clearTimeout(inactivityTimeout);
    };
  }, [
    checkpointPaused,
    interactionSerial,
    playAudioKey,
    round.id,
    round.promptKey,
    roundFlow,
    sessionComplete,
    setMessageWithAudio,
  ]);

  useEffect(() => {
    return () => {
      if (boardFeedbackTimeoutRef.current) {
        window.clearTimeout(boardFeedbackTimeoutRef.current);
      }
      if (starPulseTimeoutRef.current) {
        window.clearTimeout(starPulseTimeoutRef.current);
      }
      audio.stop();
    };
  }, [audio]);

  const messageText = t(roundMessage.key, round.promptValues);
  const coachVariant = sessionComplete || roundMessage.tone === 'success' ? 'success' : 'hint';

  if (sessionComplete && sessionSummary) {
    return (
      <div className="number-line-jumps number-line-jumps--summary">
        <Card padding="lg" className="number-line-jumps__shell">
          <h2 className="number-line-jumps__title">{t('feedback.youDidIt')}</h2>
          <div className="number-line-jumps__summary-celebration">
            <SuccessCelebration />
          </div>
          <p className="number-line-jumps__message number-line-jumps__message--success" aria-live="polite">
            {t('parentDashboard.games.numberLineJumps.progressSummary', {
              accuracy: `${sessionSummary.accuracy}%`,
              hintTrend: t(sessionSummary.hintTrendLabelKey),
            })}
          </p>
          <p className="number-line-jumps__summary-note">{t('parentDashboard.games.numberLineJumps.nextStep')}</p>
          <p className="number-line-jumps__summary-tone">{t(sessionSummary.hintTrendLabelKey)}</p>
        </Card>
        <style>{numberLineJumpsStyles}</style>
      </div>
    );
  }

  if (checkpointPaused) {
    return (
      <div className="number-line-jumps number-line-jumps--checkpoint">
        <Card padding="lg" className="number-line-jumps__shell">
          <h2 className="number-line-jumps__title">{t('feedback.greatEffort')}</h2>
          <div className="number-line-jumps__checkpoint-note">
            <p className="number-line-jumps__summary-note">{t('games.numberLineJumps.instructions.listenAndPlanJump')}</p>
            <Button
              variant="secondary"
              size="md"
              onClick={handleCheckpointReplay}
              aria-label={t('games.numberLineJumps.instructions.tapReplay')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              {replayIcon}
            </Button>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleContinueAfterCheckpoint}
            aria-label={t('nav.next')}
            style={{ minWidth: 'var(--touch-min)' }}
          >
            {nextIcon}
          </Button>
        </Card>
        <style>{numberLineJumpsStyles}</style>
      </div>
    );
  }

  return (
    <div className="number-line-jumps">
      <Card padding="lg" className="number-line-jumps__shell">
        <header className="number-line-jumps__header">
          <div className="number-line-jumps__heading">
            <h2 className="number-line-jumps__title">{t('games.numberLineJumps.title')}</h2>
            <p className="number-line-jumps__subtitle">{t('games.numberLineJumps.subtitle')}</p>
          </div>

          <div className="number-line-jumps__controls">
            <Button
              variant="secondary"
              size="md"
              onClick={handleReplayPrompt}
              aria-label={t('games.numberLineJumps.instructions.tapReplay')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              {replayIcon}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleHint}
              aria-label={t('games.numberLineJumps.hints.replayPrompt')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              💡
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleRetry}
              aria-label={t('games.numberLineJumps.hints.gentleRetry')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              ↻
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleNext}
              aria-label={t('nav.next')}
              disabled={!showNextAction}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              {nextIcon}
            </Button>
          </div>
        </header>

        <div className="number-line-jumps__progress">
          <span className="sr-only">{t('games.estimatedTime', { minutes: 5 })}</span>
          {progressSegments.map((segment) => {
            const state =
              segment <= resolvedRounds ? 'done' : segment === resolvedRounds + 1 ? 'active' : 'pending';

            return (
              <span
                key={`progress-${segment}`}
                className={[
                  'number-line-jumps__progress-dot',
                  `number-line-jumps__progress-dot--${state}`,
                  state === 'active' && roundFlow === 'input' ? 'number-line-jumps__progress-dot--live' : '',
                ].join(' ')}
                aria-hidden="true"
              />
            );
          })}
        </div>

        <div className="number-line-jumps__score-strip" aria-hidden="true">
          <div
            className={[
              'number-line-jumps__score-pill',
              starPulse ? 'number-line-jumps__score-pill--pulse' : '',
            ].join(' ')}
          >
            <span>⭐</span>
            <span>{firstAttemptStars}</span>
          </div>
          <div className="number-line-jumps__score-pill">
            <span>🎯</span>
            <span>
              {resolvedRounds}/{TOTAL_ROUNDS}
            </span>
          </div>
        </div>

        <p className={`number-line-jumps__message number-line-jumps__message--${roundMessage.tone}`} aria-live="polite">
          {messageText}
        </p>
        <div className="number-line-jumps__coach" aria-hidden="true">
          <MascotIllustration variant={coachVariant} size={52} />
        </div>
        {audioPlaybackFailed && (
          <p className="number-line-jumps__audio-fallback" aria-live="polite">
            🔇 {t('games.numberLineJumps.instructions.dragOrTapJumps')}
          </p>
        )}

        <Card padding="md" className="number-line-jumps__prompt-card">
          <p className="number-line-jumps__prompt">{t(round.promptKey, round.promptValues)}</p>
        </Card>

        <section
          className={[
            'number-line-jumps__board',
            boardFeedback === 'success' ? 'number-line-jumps__board--success' : '',
            boardFeedback === 'miss' ? 'number-line-jumps__board--miss' : '',
          ].join(' ')}
          dir="ltr"
          aria-label={t('games.numberLineJumps.title')}
          tabIndex={0}
        >
          <div className="number-line-jumps__line" role="group" aria-label={t('games.numberLineJumps.instructions.listenAndPlanJump')}>
            {NUMBER_LINE_VALUES.map((value) => {
              const isStart = value === round.start;
              const isPreview = value === previewValue;
              const isTarget = value === round.target;
              const isBetween = value >= Math.min(round.start, previewValue) && value <= Math.max(round.start, previewValue);

              return (
                <div
                  key={`marker-${value}`}
                  className={[
                    'number-line-jumps__marker',
                    isBetween ? 'number-line-jumps__marker--between' : '',
                    isStart ? 'number-line-jumps__marker--start' : '',
                    isPreview ? 'number-line-jumps__marker--preview' : '',
                    isTarget ? 'number-line-jumps__marker--target' : '',
                    lastHopTarget === value ? 'number-line-jumps__marker--hop-target' : '',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  <span className="number-line-jumps__marker-value">{value}</span>
                </div>
              );
            })}
          </div>

          {jumpTrail.length > 0 && (
            <ol className="number-line-jumps__hop-trail" aria-hidden="true">
              {jumpTrail.map((hop, index) => (
                <li
                  key={hop.id}
                  className={[
                    'number-line-jumps__hop-chip',
                    boardFeedback === 'success' ? 'number-line-jumps__hop-chip--success' : '',
                    boardFeedback === 'miss' ? 'number-line-jumps__hop-chip--miss' : '',
                  ].join(' ')}
                  style={{ ['--number-line-hop-delay' as string]: `${index * 70}ms` }}
                >
                  <span className="number-line-jumps__hop-range">{hop.from}→{hop.to}</span>
                  <span className="number-line-jumps__hop-step">+{hop.step}</span>
                </li>
              ))}
            </ol>
          )}

          {round.showTenAnchor && (
            <div className="number-line-jumps__anchor" aria-hidden="true">
              <span className="number-line-jumps__anchor-chip">10</span>
            </div>
          )}
        </section>

        <Card padding="md" className="number-line-jumps__preview-card">
          <div className="number-line-jumps__equation" aria-live="polite">
            <span>{round.start}</span>
            <span>+</span>
            <span>{totalJump}</span>
            <span>=</span>
            <span className="number-line-jumps__preview-value">{previewValue}</span>
          </div>
          <p className="number-line-jumps__remaining">{remainingJump}</p>
        </Card>

        {round.showCounters && (
          <div className="number-line-jumps__counters" aria-live="polite">
            {Array.from({ length: round.requiredJump }, (_, index) => (
              <span key={`counter-${index}`} className="number-line-jumps__counter" aria-hidden="true">
                ●
              </span>
            ))}
          </div>
        )}

        <div className="number-line-jumps__steps" role="group" aria-label={t('games.numberLineJumps.instructions.dragOrTapJumps')}>
          {round.stepChoices.map((step) => (
            <button
              key={`step-${round.id}-${step}`}
              type="button"
              className={[
                'number-line-jumps__step-chip',
                round.highlightNextHop && step === 1 ? 'number-line-jumps__step-chip--hint' : '',
                inactivityPulse && step === 1 ? 'number-line-jumps__step-chip--pulse' : '',
              ].join(' ')}
              onClick={() => handleStepTap(step)}
              disabled={roundFlow !== 'input' || sessionComplete}
              aria-label={t('games.numberLineJumps.instructions.jumpByStep', { step })}
            >
              +{step}
            </button>
          ))}
        </div>

      </Card>

      <style>{numberLineJumpsStyles}</style>
    </div>
  );
}

const numberLineJumpsStyles = `
  .number-line-jumps {
    display: flex;
    justify-content: center;
    padding: var(--space-xl);
    background: var(--color-theme-bg);
    min-height: 100%;
  }

  .number-line-jumps__shell {
    width: min(1120px, 100%);
    display: grid;
    gap: var(--space-md);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 24%, white);
  }

  .number-line-jumps__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .number-line-jumps__heading {
    display: grid;
    gap: var(--space-2xs);
  }

  .number-line-jumps__title {
    margin: 0;
    font-size: var(--font-size-xl);
    color: var(--color-text-primary);
  }

  .number-line-jumps__subtitle {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .number-line-jumps__controls {
    display: inline-flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .number-line-jumps__progress {
    display: grid;
    grid-template-columns: repeat(${TOTAL_ROUNDS}, minmax(0, 1fr));
    gap: var(--space-xs);
    align-items: center;
  }

  .number-line-jumps__progress-dot {
    display: block;
    height: 12px;
    border-radius: var(--radius-full);
    background: var(--color-star-empty);
  }

  .number-line-jumps__progress-dot--active {
    background: var(--color-theme-primary);
  }

  .number-line-jumps__progress-dot--live {
    animation: number-line-jumps-active-dot 1100ms ease-in-out infinite;
  }

  .number-line-jumps__progress-dot--done {
    background: var(--color-accent-success);
  }

  .number-line-jumps__score-strip {
    display: inline-flex;
    gap: var(--space-xs);
    align-items: center;
    justify-self: start;
  }

  .number-line-jumps__score-pill {
    display: inline-flex;
    gap: var(--space-2xs);
    align-items: center;
    min-height: var(--touch-min);
    padding-inline: var(--space-sm);
    border-radius: var(--radius-full);
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 28%, white);
    background: color-mix(in srgb, var(--color-theme-primary) 10%, white);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }

  .number-line-jumps__score-pill--pulse {
    animation: number-line-jumps-star-pill 480ms ease-out;
  }

  .number-line-jumps__message {
    margin: 0;
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    font-size: var(--font-size-md);
    color: var(--color-text-primary);
  }

  .number-line-jumps__message--neutral {
    background: color-mix(in srgb, var(--color-theme-primary) 12%, white);
    border-color: color-mix(in srgb, var(--color-theme-primary) 28%, white);
  }

  .number-line-jumps__message--hint {
    background: color-mix(in srgb, var(--color-warning) 20%, white);
    border-color: color-mix(in srgb, var(--color-warning) 42%, white);
  }

  .number-line-jumps__message--success {
    background: color-mix(in srgb, var(--color-accent-success) 18%, white);
    border-color: color-mix(in srgb, var(--color-accent-success) 40%, white);
  }

  .number-line-jumps__coach {
    justify-self: end;
    inline-size: 68px;
    block-size: 68px;
    border-radius: var(--radius-full);
    display: grid;
    place-items: center;
    pointer-events: none;
    background: color-mix(in srgb, var(--color-bg-card) 88%, white);
    border: 2px solid color-mix(in srgb, var(--color-accent-primary) 30%, transparent);
    box-shadow: var(--shadow-sm);
    animation: number-line-jumps-coach-float 1500ms ease-in-out infinite;
  }

  .number-line-jumps__coach,
  .number-line-jumps__coach * {
    pointer-events: none;
  }

  .number-line-jumps__audio-fallback {
    margin: 0;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    border: 1px dashed color-mix(in srgb, var(--color-warning) 48%, white);
    background: color-mix(in srgb, var(--color-warning) 16%, white);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }

  .number-line-jumps__prompt-card {
    border: 1px dashed color-mix(in srgb, var(--color-theme-primary) 36%, white);
    background: color-mix(in srgb, var(--color-bg-card) 70%, var(--color-theme-primary) 30%);
  }

  .number-line-jumps__prompt {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
  }

  .number-line-jumps__board {
    display: grid;
    gap: var(--space-xs);
    border-radius: var(--radius-lg);
    background: color-mix(in srgb, var(--color-bg-secondary) 70%, white);
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 18%, white);
    padding: var(--space-md);
    overflow-x: auto;
  }

  .number-line-jumps__board:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--color-theme-primary) 72%, white);
    outline-offset: 2px;
  }

  .number-line-jumps__board--success {
    animation: number-line-jumps-board-success 360ms ease-out;
  }

  .number-line-jumps__board--miss {
    animation: number-line-jumps-board-miss 320ms ease-in-out;
  }

  .number-line-jumps__line {
    display: grid;
    grid-template-columns: repeat(${NUMBER_LINE_MAX + 1}, minmax(48px, 1fr));
    gap: 6px;
    min-width: max-content;
  }

  .number-line-jumps__marker {
    position: relative;
    display: grid;
    place-items: center;
    border-radius: var(--radius-md);
    min-height: 52px;
    border: 1px solid color-mix(in srgb, var(--color-border) 80%, white);
    background: color-mix(in srgb, var(--color-bg-card) 86%, white);
    transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
  }

  .number-line-jumps__marker--between {
    background: color-mix(in srgb, var(--color-accent-info) 14%, white);
  }

  .number-line-jumps__marker--start {
    border-color: var(--color-theme-primary);
    background: color-mix(in srgb, var(--color-theme-primary) 20%, white);
  }

  .number-line-jumps__marker--preview {
    border-color: var(--color-accent-success);
    background: color-mix(in srgb, var(--color-accent-success) 26%, white);
    transform: translateY(-4px);
  }

  .number-line-jumps__marker--target {
    box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--color-warning) 80%, black);
  }

  .number-line-jumps__marker--hop-target {
    box-shadow:
      inset 0 0 0 2px color-mix(in srgb, var(--color-accent-info) 72%, transparent),
      0 0 0 4px color-mix(in srgb, var(--color-accent-info) 16%, transparent);
    transform: translateY(-2px);
  }

  .number-line-jumps__marker-value {
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
  }

  .number-line-jumps__hop-trail {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .number-line-jumps__hop-chip {
    min-height: var(--touch-min);
    border-radius: var(--radius-full);
    border: 1px solid color-mix(in srgb, var(--color-accent-info) 34%, white);
    background: color-mix(in srgb, var(--color-accent-info) 12%, white);
    color: var(--color-text-primary);
    padding-inline: var(--space-sm);
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    font-weight: var(--font-weight-semibold);
    animation: number-line-jumps-hop-enter 280ms ease-out both;
    animation-delay: var(--number-line-hop-delay, 0ms);
  }

  .number-line-jumps__hop-chip--success {
    border-color: color-mix(in srgb, var(--color-accent-success) 52%, white);
    background: color-mix(in srgb, var(--color-accent-success) 16%, white);
  }

  .number-line-jumps__hop-chip--miss {
    border-color: color-mix(in srgb, var(--color-warning) 62%, white);
    background: color-mix(in srgb, var(--color-warning) 16%, white);
  }

  .number-line-jumps__hop-range {
    font-size: var(--font-size-sm);
  }

  .number-line-jumps__hop-step {
    font-size: var(--font-size-xs);
    color: color-mix(in srgb, var(--color-text-primary) 82%, transparent);
    background: color-mix(in srgb, var(--color-bg-primary) 72%, transparent);
    border-radius: var(--radius-full);
    padding-inline: 6px;
    min-height: 22px;
    display: inline-flex;
    align-items: center;
  }

  .number-line-jumps__anchor {
    display: flex;
    justify-content: center;
  }

  .number-line-jumps__anchor-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--touch-min);
    min-width: var(--touch-min);
    padding-inline: var(--space-sm);
    border-radius: var(--radius-full);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    background: color-mix(in srgb, var(--color-warning) 40%, white);
  }

  .number-line-jumps__preview-card {
    display: grid;
    gap: var(--space-xs);
    border: 1px solid color-mix(in srgb, var(--color-accent-info) 34%, white);
  }

  .number-line-jumps__equation {
    display: inline-flex;
    gap: var(--space-xs);
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-xl);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
  }

  .number-line-jumps__preview-value {
    color: var(--color-theme-primary);
  }

  .number-line-jumps__remaining {
    margin: 0;
    text-align: center;
    color: var(--color-text-secondary);
  }

  .number-line-jumps__counters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    justify-content: center;
  }

  .number-line-jumps__counter {
    color: var(--color-accent-info);
    font-size: 1rem;
    line-height: 1;
  }

  .number-line-jumps__steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
    gap: var(--space-sm);
  }

  .number-line-jumps__step-chip {
    min-height: var(--touch-min);
    min-width: var(--touch-min);
    border-radius: var(--radius-lg);
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 30%, white);
    background: color-mix(in srgb, var(--color-theme-primary) 10%, white);
    color: var(--color-text-primary);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition: transform 140ms ease, background 140ms ease, border-color 140ms ease;
  }

  .number-line-jumps__step-chip:disabled {
    cursor: default;
    opacity: 0.58;
  }

  .number-line-jumps__step-chip:not(:disabled):active {
    transform: translateY(1px) scale(0.98);
  }

  .number-line-jumps__step-chip--hint {
    border-color: color-mix(in srgb, var(--color-warning) 80%, black);
    background: color-mix(in srgb, var(--color-warning) 30%, white);
  }

  .number-line-jumps__step-chip--pulse {
    animation: number-line-jumps-pulse 900ms ease-in-out infinite;
  }

  .number-line-jumps--checkpoint,
  .number-line-jumps--summary {
    align-items: center;
  }

  .number-line-jumps__summary-note,
  .number-line-jumps__summary-tone {
    margin: 0;
    color: var(--color-text-secondary);
  }

  .number-line-jumps__summary-celebration {
    display: flex;
    justify-content: center;
  }

  .number-line-jumps__checkpoint-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
  }

  @keyframes number-line-jumps-pulse {
    0% {
      transform: scale(1);
    }

    50% {
      transform: scale(1.04);
    }

    100% {
      transform: scale(1);
    }
  }

  @keyframes number-line-jumps-active-dot {
    0% {
      transform: scale(1);
    }

    50% {
      transform: scale(1.18);
    }

    100% {
      transform: scale(1);
    }
  }

  @keyframes number-line-jumps-star-pill {
    0% {
      transform: scale(0.92);
    }

    60% {
      transform: scale(1.1);
    }

    100% {
      transform: scale(1);
    }
  }

  @keyframes number-line-jumps-coach-float {
    0% {
      transform: translateY(0);
    }

    50% {
      transform: translateY(-4px);
    }

    100% {
      transform: translateY(0);
    }
  }

  @keyframes number-line-jumps-board-success {
    0% {
      transform: scale(1);
    }

    40% {
      transform: scale(1.015);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent-success) 45%, transparent);
    }

    100% {
      transform: scale(1);
      box-shadow: none;
    }
  }

  @keyframes number-line-jumps-board-miss {
    0% {
      transform: translateX(0);
    }

    25% {
      transform: translateX(6px);
    }

    50% {
      transform: translateX(-6px);
    }

    75% {
      transform: translateX(3px);
    }

    100% {
      transform: translateX(0);
    }
  }

  @keyframes number-line-jumps-hop-enter {
    0% {
      opacity: 0;
      transform: translateY(6px) scale(0.94);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-width: 920px) {
    .number-line-jumps {
      padding: var(--space-md);
    }

    .number-line-jumps__controls {
      width: 100%;
      justify-content: flex-start;
    }

    .number-line-jumps__line {
      grid-template-columns: repeat(${NUMBER_LINE_MAX + 1}, minmax(48px, 1fr));
    }

    .number-line-jumps__equation {
      font-size: var(--font-size-lg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .number-line-jumps__marker,
    .number-line-jumps__marker--hop-target,
    .number-line-jumps__hop-chip,
    .number-line-jumps__step-chip,
    .number-line-jumps__step-chip--pulse,
    .number-line-jumps__progress-dot--live,
    .number-line-jumps__score-pill--pulse,
    .number-line-jumps__board--success,
    .number-line-jumps__board--miss {
      transition: none;
      animation: none;
      transform: none;
    }

    .number-line-jumps__coach {
      animation: none;
    }
  }
`;
