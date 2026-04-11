import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameCompletionResult, GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { isRtlDirection, rtlNextGlyph, rtlReplayGlyph } from '@/lib/rtlChrome';

type LevelBand = 'within10' | 'within20' | 'missingPart';
type MisconceptionTag = 'overshoot' | 'direction' | 'crossing10';
type UnknownPrompt = 'direct' | 'missingResult' | 'missingSubtrahend';
type RoundFlow = 'prompt' | 'input' | 'feedback' | 'next';
type MessageTone = 'neutral' | 'hint' | 'success';
type StatusKey = string;
type StreetTheme = 'park' | 'market' | 'beach';

type AccuracyRangeKey = 'within10' | 'within20';

interface RoundState {
  id: string;
  roundNumber: number;
  levelBand: LevelBand;
  theme: StreetTheme;
  instructionKey: StatusKey;
  promptKey: StatusKey;
  promptValues: Record<string, number>;
  start: number;
  target: number;
  subtractBy: number;
  unknownPrompt: UnknownPrompt;
  stepChoices: number[];
  directionDecoys: number[];
  showCounters: boolean;
  allowDragAssist: boolean;
  crossingTenChallenge: boolean;
  remediationTag: MisconceptionTag | null;
  highlightStepOne: boolean;
}

interface RoundMessage {
  key: StatusKey;
  tone: MessageTone;
}

interface RoundOutcome {
  level: LevelBand;
  firstAttemptSuccess: boolean;
  usedHint: boolean;
}

interface RangeStats {
  firstAttemptSuccesses: number;
  totalRounds: number;
}

interface LevelHintStats {
  rounds: number;
  roundsWithHint: number;
}

interface SessionStats {
  firstAttemptSuccesses: number;
  hintUsageByRound: number[];
  accuracyByRange: Record<AccuracyRangeKey, RangeStats>;
  hintUsageByLevel: Record<LevelBand, LevelHintStats>;
  misconceptionCounts: Record<MisconceptionTag, number>;
}

interface SessionSummary {
  overallAccuracy: number;
  within10Accuracy: number;
  within20Accuracy: number;
  hintTrendLabel: StatusKey;
  topMisconceptionLabel: StatusKey;
}

interface BuildRoundOptions {
  roundNumber: number;
  levelBand: LevelBand;
  reducedRange: boolean;
  remediationTag: MisconceptionTag | null;
  allowCrossingTen: boolean;
}

const TOTAL_ROUNDS = 9;
const CHECKPOINT_ROUND = 4;
const NUMBER_LINE_MAX = 20;
const NUMBER_LINE_VALUES = Array.from({ length: NUMBER_LINE_MAX + 1 }, (_, index) => index);

const WITHIN10_PROMPTS: StatusKey[] = [
  'games.subtractionStreet.prompts.within10.startAndTakeAway',
  'games.subtractionStreet.prompts.within10.hopBack',
  'games.subtractionStreet.prompts.within10.removeCounters',
  'games.subtractionStreet.prompts.within10.findLanding',
];

const WITHIN20_PROMPTS: StatusKey[] = [
  'games.subtractionStreet.prompts.within20.jumpBack',
  'games.subtractionStreet.prompts.within20.planBackSteps',
  'games.subtractionStreet.prompts.within20.crossTenWhenNeeded',
  'games.subtractionStreet.prompts.within20.findResult',
];

const MISSING_PART_PROMPTS: Record<UnknownPrompt, StatusKey[]> = {
  direct: [
    'games.subtractionStreet.prompts.missingPart.solveEquation',
    'games.subtractionStreet.prompts.missingPart.findResult',
  ],
  missingResult: [
    'games.subtractionStreet.prompts.missingPart.resultAtStart',
    'games.subtractionStreet.prompts.missingPart.whereWillDubiLand',
  ],
  missingSubtrahend: [
    'games.subtractionStreet.prompts.missingPart.findMissingSubtrahend',
    'games.subtractionStreet.prompts.missingPart.howMuchRemoved',
  ],
};

const ENCOURAGEMENT_ROTATION: StatusKey[] = [
  'feedback.encouragement.keepTrying',
  'feedback.encouragement.almostThere',
  'feedback.encouragement.tryAgain',
];

const SUCCESS_ROTATION: StatusKey[] = ['feedback.success.wellDone', 'feedback.success.amazing', 'feedback.success.celebrate'];

const HINT_ROTATION: StatusKey[] = [
  'games.subtractionStreet.hints.replayPrompt',
  'games.subtractionStreet.hints.countBackByOnes',
  'games.subtractionStreet.hints.useCounters',
];

const THEME_ROTATION: StreetTheme[] = ['park', 'market', 'beach'];

const LEVEL_ORDER: LevelBand[] = ['within10', 'within20', 'missingPart'];

const LEVEL_TRANSITION_KEY: Record<LevelBand, StatusKey> = {
  within10: 'games.subtractionStreet.levelTransitions.within10',
  within20: 'games.subtractionStreet.levelTransitions.within20',
  missingPart: 'games.subtractionStreet.levelTransitions.missingPart',
};

const TOP_MISCONCEPTION_LABEL: Record<MisconceptionTag, StatusKey> = {
  overshoot: 'games.subtractionStreet.misconceptions.overshoot',
  direction: 'games.subtractionStreet.misconceptions.direction',
  crossing10: 'games.subtractionStreet.misconceptions.crossing10',
};

const DEFAULT_STATS: SessionStats = {
  firstAttemptSuccesses: 0,
  hintUsageByRound: [],
  accuracyByRange: {
    within10: {
      firstAttemptSuccesses: 0,
      totalRounds: 0,
    },
    within20: {
      firstAttemptSuccesses: 0,
      totalRounds: 0,
    },
  },
  hintUsageByLevel: {
    within10: {
      rounds: 0,
      roundsWithHint: 0,
    },
    within20: {
      rounds: 0,
      roundsWithHint: 0,
    },
    missingPart: {
      rounds: 0,
      roundsWithHint: 0,
    },
  },
  misconceptionCounts: {
    overshoot: 0,
    direction: 0,
    crossing10: 0,
  },
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getAudioPathForKey(key: StatusKey): string {
  return resolveAudioPathFromKey(key, 'common');
}

function getUnknownPrompt(roundNumber: number): UnknownPrompt {
  const blockIndex = Math.floor((roundNumber - 1) / 2) % 3;
  if (blockIndex === 1) {
    return 'missingResult';
  }
  if (blockIndex === 2) {
    return 'missingSubtrahend';
  }
  return 'direct';
}

function resolveInstructionKey(roundNumber: number, levelBand: LevelBand): StatusKey {
  if (roundNumber === 1) {
    return 'games.subtractionStreet.instructions.intro';
  }

  if (levelBand === 'within10') {
    return 'games.subtractionStreet.instructions.removeAndHop';
  }

  if (levelBand === 'missingPart') {
    return 'games.subtractionStreet.instructions.findMissingPart';
  }

  return 'games.subtractionStreet.instructions.tapBackwardJumps';
}

function toHintTrend(hintUsageByRound: number[]): ParentSummaryMetrics['hintTrend'] {
  if (hintUsageByRound.length === 0) {
    return 'steady';
  }

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

function toHintTrendLabel(trend: ParentSummaryMetrics['hintTrend']): StatusKey {
  if (trend === 'improving') {
    return 'feedback.excellent';
  }

  if (trend === 'steady') {
    return 'feedback.keepGoing';
  }

  return 'feedback.greatEffort';
}

function toStableRange(levelBand: LevelBand): StableRange {
  if (levelBand === 'missingPart') {
    return '1-10';
  }

  if (levelBand === 'within20') {
    return '1-5';
  }

  return '1-3';
}

function toPercent(successes: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((successes / total) * 100);
}

function toLevelFromSupport(levelBand: LevelBand): AccuracyRangeKey {
  if (levelBand === 'within10') {
    return 'within10';
  }

  return 'within20';
}

function buildRound(options: BuildRoundOptions): RoundState {
  const { levelBand, reducedRange, remediationTag, allowCrossingTen, roundNumber } = options;

  const theme = THEME_ROTATION[(roundNumber - 1) % THEME_ROTATION.length]!;

  let start = 0;
  let subtractBy = 0;
  let target = 0;
  let unknownPrompt: UnknownPrompt = 'direct';
  let crossingTenChallenge = false;

  if (levelBand === 'within10') {
    start = randomInt(reducedRange ? 4 : 5, 10);
    subtractBy = randomInt(1, reducedRange ? 2 : 3);
    target = start - subtractBy;
  } else if (levelBand === 'within20') {
    if (remediationTag === 'crossing10') {
      start = randomInt(12, 18);
      const minForCrossing = Math.max(2, start - 9);
      const maxForCrossing = Math.min(6, start - 1);
      subtractBy = randomInt(Math.min(minForCrossing, maxForCrossing), maxForCrossing);
      target = start - subtractBy;
      crossingTenChallenge = true;
    } else {
      const startMin = reducedRange ? 9 : 8;
      const startMax = reducedRange ? 16 : 20;
      start = randomInt(startMin, startMax);

      const subtractMin = reducedRange ? 1 : 2;
      const subtractMax = reducedRange ? 3 : 6;

      if (!allowCrossingTen) {
        if (start > 10) {
          const maxWithoutCrossing = Math.max(subtractMin, Math.min(subtractMax, start - 10));
          subtractBy = randomInt(subtractMin, maxWithoutCrossing);
        } else {
          subtractBy = randomInt(subtractMin, Math.min(subtractMax, start));
        }
      } else {
        const shouldCrossTen = Math.random() < 0.4 && start > 10;
        if (shouldCrossTen) {
          const crossingMin = Math.max(subtractMin, start - 9);
          const crossingMax = Math.min(subtractMax, start - 1);
          subtractBy = randomInt(Math.min(crossingMin, crossingMax), crossingMax);
          crossingTenChallenge = true;
        } else {
          subtractBy = randomInt(subtractMin, Math.min(subtractMax, start));
        }
      }

      target = start - subtractBy;
    }
  } else {
    unknownPrompt = getUnknownPrompt(roundNumber);

    start = randomInt(reducedRange ? 10 : 12, 20);
    subtractBy = randomInt(reducedRange ? 2 : 3, reducedRange ? 4 : 6);
    subtractBy = Math.min(subtractBy, start - 1);
    target = start - subtractBy;

    if (allowCrossingTen && start > 10 && target < 10) {
      crossingTenChallenge = true;
    }
  }

  const stepBase = levelBand === 'within10' ? [1, 2, 3] : [1, 2, 3, 4, 5, 6];
  const reducedStepBase = reducedRange ? [1, 2, 3] : stepBase;
  const stepChoices = new Set<number>(reducedStepBase);
  stepChoices.add(1);
  if (subtractBy <= 6) {
    stepChoices.add(subtractBy);
  }

  if (remediationTag === 'overshoot') {
    stepChoices.clear();
    stepChoices.add(1);
    stepChoices.add(Math.min(2, subtractBy));
    stepChoices.add(Math.min(3, subtractBy));
  }

  if (remediationTag === 'crossing10') {
    stepChoices.clear();
    stepChoices.add(1);
    stepChoices.add(2);
    stepChoices.add(Math.min(4, subtractBy));
  }

  const directionDecoys = levelBand === 'within10' ? [] : remediationTag === 'direction' ? [1, 2] : [1];

  const promptKey =
    levelBand === 'within10'
      ? WITHIN10_PROMPTS[(roundNumber - 1) % WITHIN10_PROMPTS.length]!
      : levelBand === 'within20'
        ? WITHIN20_PROMPTS[(roundNumber - 1) % WITHIN20_PROMPTS.length]!
        : MISSING_PART_PROMPTS[unknownPrompt][(roundNumber - 1) % MISSING_PART_PROMPTS[unknownPrompt].length]!;

  const promptValues: Record<string, number> =
    unknownPrompt === 'missingSubtrahend'
      ? {
          start,
          target,
        }
      : {
          start,
          subtract: subtractBy,
          target,
        };

  return {
    id: `subtraction-street-${roundNumber}-${Math.random().toString(36).slice(2, 10)}`,
    roundNumber,
    levelBand,
    theme,
    instructionKey: resolveInstructionKey(roundNumber, levelBand),
    promptKey,
    promptValues,
    start,
    target,
    subtractBy,
    unknownPrompt,
    stepChoices: Array.from(stepChoices).filter((value) => value > 0).sort((left, right) => left - right),
    directionDecoys,
    showCounters: levelBand === 'within10' || reducedRange || remediationTag !== null,
    allowDragAssist: remediationTag !== null,
    crossingTenChallenge,
    remediationTag,
    highlightStepOne: remediationTag !== null,
  };
}

function evaluatePromotionGate(levelBand: LevelBand, history: RoundOutcome[]): boolean {
  if (levelBand === 'missingPart') {
    return false;
  }

  const config =
    levelBand === 'within10'
      ? {
          window: 8,
          minSuccessPct: 75,
          maxHintPct: 35,
        }
      : {
          window: 10,
          minSuccessPct: 80,
          maxHintPct: 25,
        };

  const sample = history.filter((entry) => entry.level === levelBand).slice(-config.window);
  if (sample.length < config.window) {
    return false;
  }

  const firstAttemptSuccessPct = Math.round((sample.filter((entry) => entry.firstAttemptSuccess).length / sample.length) * 100);
  const hintUsagePct = Math.round((sample.filter((entry) => entry.usedHint).length / sample.length) * 100);

  return firstAttemptSuccessPct >= config.minSuccessPct && hintUsagePct <= config.maxHintPct;
}

function classifyMisconception(round: RoundState, steps: number[]): MisconceptionTag {
  if (steps.some((step) => step > 0)) {
    return 'direction';
  }

  if (round.crossingTenChallenge) {
    return 'crossing10';
  }

  return 'overshoot';
}

function resolveThemeEmoji(theme: StreetTheme): string {
  if (theme === 'market') {
    return '🧺';
  }

  if (theme === 'beach') {
    return '🏖️';
  }

  return '🌳';
}

function resolveInitialLevel(levelConfig: unknown, hasBirthDate: boolean): LevelBand {
  if (levelConfig && typeof levelConfig === 'object' && !Array.isArray(levelConfig)) {
    const raw = (levelConfig as Record<string, unknown>).startLevel;
    if (raw === 'within10' || raw === 'within20' || raw === 'missingPart') {
      return raw;
    }
  }

  if (!hasBirthDate) {
    return 'within10';
  }

  return 'within10';
}

export function SubtractionStreetGame({ level, onComplete, audio, child }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir(i18n.language));
  const replayIcon = rtlReplayGlyph(isRtl);
  const nextIcon = rtlNextGlyph(isRtl);
  const initialLevel = useMemo(
    () => resolveInitialLevel(level.configJson, Boolean(child.birthDate)),
    [child.birthDate, level.configJson],
  );

  const [currentLevel, setCurrentLevel] = useState<LevelBand>(initialLevel);
  const [round, setRound] = useState<RoundState>(() =>
    buildRound({
      roundNumber: 1,
      levelBand: initialLevel,
      reducedRange: false,
      remediationTag: null,
      allowCrossingTen: initialLevel !== 'within10',
    }),
  );
  const [roundFlow, setRoundFlow] = useState<RoundFlow>('prompt');
  const [roundMessage, setRoundMessage] = useState<RoundMessage>({
    key: 'games.subtractionStreet.instructions.intro',
    tone: 'neutral',
  });
  const [selectedSteps, setSelectedSteps] = useState<number[]>([]);
  const [roundAttempt, setRoundAttempt] = useState(0);
  const [hintDepth, setHintDepth] = useState(0);
  const [usedHintThisRound, setUsedHintThisRound] = useState(false);
  const [resolvedRounds, setResolvedRounds] = useState(0);
  const [showNextAction, setShowNextAction] = useState(false);
  const [checkpointPaused, setCheckpointPaused] = useState(false);
  const [checkpointShown, setCheckpointShown] = useState(false);
  const [pendingRoundNumber, setPendingRoundNumber] = useState<number | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>(DEFAULT_STATS);
  const [dragAssistValue, setDragAssistValue] = useState(1);
  const [firstAttemptStars, setFirstAttemptStars] = useState(0);
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);

  const currentLevelRef = useRef<LevelBand>(initialLevel);
  const reduceRangeNextRoundRef = useRef(false);
  const remediationTagNextRoundRef = useRef<MisconceptionTag | null>(null);
  const allowCrossingTenRef = useRef(initialLevel !== 'within10');
  const nonCrossingL2FirstAttemptRef = useRef(0);
  const consecutiveMissesRef = useRef(0);
  const consecutiveFirstAttemptSuccessRef = useRef(0);
  const outcomeHistoryRef = useRef<RoundOutcome[]>([]);
  const misconceptionTriggerRef = useRef<Record<MisconceptionTag, number>>({
    overshoot: 0,
    direction: 0,
    crossing10: 0,
  });

  const totalDelta = useMemo(() => selectedSteps.reduce((sum, value) => sum + value, 0), [selectedSteps]);
  const previewValue = round.start + totalDelta;
  const removedAmount = Math.max(0, round.start - previewValue);
  const remainingAmount = Math.max(0, round.subtractBy - removedAmount);

  const progressSegments = useMemo(() => Array.from({ length: TOTAL_ROUNDS }, (_, index) => index + 1), []);
  const translateDynamic = useCallback(
    (key: StatusKey, values?: Record<string, unknown>) =>
      values ? t(key as any, values as any) : t(key as any),
    [t],
  );

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

  const loadRound = useCallback(
    (roundNumber: number) => {
      const nextRound = buildRound({
        roundNumber,
        levelBand: currentLevelRef.current,
        reducedRange: reduceRangeNextRoundRef.current,
        remediationTag: remediationTagNextRoundRef.current,
        allowCrossingTen: allowCrossingTenRef.current,
      });

      reduceRangeNextRoundRef.current = false;
      remediationTagNextRoundRef.current = null;

      setRound(nextRound);
      setRoundFlow('prompt');
      setSelectedSteps([]);
      setRoundAttempt(0);
      setHintDepth(0);
      setUsedHintThisRound(false);
      setShowNextAction(false);
      setDragAssistValue(1);
    },
    [],
  );

  const finalizeSession = useCallback(() => {
    const roundsPlayed = Math.max(1, resolvedRounds);
    const overallAccuracy = Math.round((sessionStats.firstAttemptSuccesses / roundsPlayed) * 100);
    const hintTrend = toHintTrend(sessionStats.hintUsageByRound);
    const hintTrendLabel = toHintTrendLabel(hintTrend);

    const within10Accuracy = toPercent(
      sessionStats.accuracyByRange.within10.firstAttemptSuccesses,
      sessionStats.accuracyByRange.within10.totalRounds,
    );
    const within20Accuracy = toPercent(
      sessionStats.accuracyByRange.within20.firstAttemptSuccesses,
      sessionStats.accuracyByRange.within20.totalRounds,
    );

    const misconceptionEntries = Object.entries(sessionStats.misconceptionCounts) as Array<[MisconceptionTag, number]>;
    const topMisconception = misconceptionEntries.sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'overshoot';
    const topMisconceptionLabel = TOP_MISCONCEPTION_LABEL[topMisconception];

    const hintUsageByLevel = {
      within10: toPercent(
        sessionStats.hintUsageByLevel.within10.roundsWithHint,
        sessionStats.hintUsageByLevel.within10.rounds,
      ),
      within20: toPercent(
        sessionStats.hintUsageByLevel.within20.roundsWithHint,
        sessionStats.hintUsageByLevel.within20.rounds,
      ),
      missingPart: toPercent(
        sessionStats.hintUsageByLevel.missingPart.roundsWithHint,
        sessionStats.hintUsageByLevel.missingPart.rounds,
      ),
    };

    const summaryMetrics: ParentSummaryMetrics = {
      highestStableRange: toStableRange(currentLevelRef.current),
      firstAttemptSuccessRate: overallAccuracy,
      hintTrend,
      accuracyByRange: {
        within10: within10Accuracy,
        within20: within20Accuracy,
      },
      misconceptionTrend: {
        overshoot: sessionStats.misconceptionCounts.overshoot,
        direction: sessionStats.misconceptionCounts.direction,
        crossing10: sessionStats.misconceptionCounts.crossing10,
      },
      hintUsageByLevel,
    };

    setSessionSummary({
      overallAccuracy,
      within10Accuracy,
      within20Accuracy,
      hintTrendLabel,
      topMisconceptionLabel,
    });

    setSessionComplete(true);
    setShowNextAction(false);
    setRoundFlow('feedback');
    setMessageWithAudio('feedback.youDidIt', 'success');
    playAudioKey('parentDashboard.games.subtractionStreet.progressSummary');

    const score = Math.max(100, Math.round(overallAccuracy * 12) + Math.max(0, firstAttemptStars) * 18);
    const stars = overallAccuracy >= 85 ? 3 : overallAccuracy >= 65 ? 2 : 1;

    const completionResult: GameCompletionResult = {
      completed: true,
      score,
      stars,
      roundsCompleted: resolvedRounds,
      summaryMetrics,
    };

    onComplete(completionResult);
  }, [firstAttemptStars, onComplete, playAudioKey, resolvedRounds, sessionStats, setMessageWithAudio]);

  const maybePromoteLevel = useCallback(() => {
    if (consecutiveFirstAttemptSuccessRef.current < 3) {
      return;
    }

    const current = currentLevelRef.current;
    if (!evaluatePromotionGate(current, outcomeHistoryRef.current)) {
      return;
    }

    const currentIndex = LEVEL_ORDER.indexOf(current);
    const nextLevel = LEVEL_ORDER[currentIndex + 1];

    if (!nextLevel) {
      return;
    }

    currentLevelRef.current = nextLevel;
    setCurrentLevel(nextLevel);
    consecutiveFirstAttemptSuccessRef.current = 0;
    setMessageWithAudio(LEVEL_TRANSITION_KEY[nextLevel], 'success');
  }, [setMessageWithAudio]);

  const handleRoundSuccess = useCallback(
    (steps: number[]) => {
      const firstAttempt = roundAttempt === 0;
      const usedHint = usedHintThisRound;
      const levelBand = round.levelBand;
      const rangeKey = toLevelFromSupport(levelBand);

      outcomeHistoryRef.current = [
        ...outcomeHistoryRef.current,
        {
          level: levelBand,
          firstAttemptSuccess: firstAttempt,
          usedHint,
        },
      ];

      if (firstAttempt) {
        consecutiveFirstAttemptSuccessRef.current += 1;
        setFirstAttemptStars((value) => value + 1);
      } else {
        consecutiveFirstAttemptSuccessRef.current = 0;
      }

      if (levelBand === 'within20' && !round.crossingTenChallenge && firstAttempt) {
        nonCrossingL2FirstAttemptRef.current += 1;
        if (nonCrossingL2FirstAttemptRef.current >= 2) {
          allowCrossingTenRef.current = true;
        }
      }

      consecutiveMissesRef.current = 0;

      setSessionStats((current) => {
        const next: SessionStats = {
          firstAttemptSuccesses: current.firstAttemptSuccesses + (firstAttempt ? 1 : 0),
          hintUsageByRound: [...current.hintUsageByRound, usedHint ? Math.max(1, hintDepth) : 0],
          accuracyByRange: {
            within10: {
              ...current.accuracyByRange.within10,
            },
            within20: {
              ...current.accuracyByRange.within20,
            },
          },
          hintUsageByLevel: {
            within10: {
              ...current.hintUsageByLevel.within10,
            },
            within20: {
              ...current.hintUsageByLevel.within20,
            },
            missingPart: {
              ...current.hintUsageByLevel.missingPart,
            },
          },
          misconceptionCounts: {
            ...current.misconceptionCounts,
          },
        };

        next.accuracyByRange[rangeKey].totalRounds += 1;
        if (firstAttempt) {
          next.accuracyByRange[rangeKey].firstAttemptSuccesses += 1;
        }

        next.hintUsageByLevel[levelBand].rounds += 1;
        if (usedHint) {
          next.hintUsageByLevel[levelBand].roundsWithHint += 1;
        }

        return next;
      });

      maybePromoteLevel();

      setResolvedRounds((value) => value + 1);
      setRoundFlow('feedback');
      setShowNextAction(true);
      setMessageWithAudio(SUCCESS_ROTATION[resolvedRounds % SUCCESS_ROTATION.length]!, 'success');

      if (steps.length <= 2) {
        setRound((current) => ({
          ...current,
          highlightStepOne: false,
        }));
      }
    },
    [hintDepth, maybePromoteLevel, resolvedRounds, round, roundAttempt, setMessageWithAudio, usedHintThisRound],
  );

  const beginRetryWithSupport = useCallback(
    (misconception: MisconceptionTag) => {
      setRoundFlow('input');
      setRoundAttempt((value) => value + 1);
      setUsedHintThisRound(true);
      setHintDepth((value) => Math.max(value, 1));
      setSelectedSteps([]);
      setRound((current) => ({
        ...current,
        showCounters: true,
        allowDragAssist: true,
        highlightStepOne: true,
      }));

      const recoveryKey =
        misconception === 'direction'
          ? 'games.subtractionStreet.recovery.direction'
          : misconception === 'crossing10'
            ? 'games.subtractionStreet.recovery.crossing10'
            : 'games.subtractionStreet.recovery.overshoot';

      setMessageWithAudio(recoveryKey, 'hint');
    },
    [setMessageWithAudio],
  );

  const handleRoundMiss = useCallback(
    (misconception: MisconceptionTag) => {
      consecutiveMissesRef.current += 1;
      consecutiveFirstAttemptSuccessRef.current = 0;

      if (consecutiveMissesRef.current >= 2) {
        reduceRangeNextRoundRef.current = true;
      }

      misconceptionTriggerRef.current[misconception] += 1;
      if (misconceptionTriggerRef.current[misconception] >= 3) {
        remediationTagNextRoundRef.current = misconception;
        misconceptionTriggerRef.current[misconception] = 0;
      }

      setSessionStats((current) => ({
        ...current,
        misconceptionCounts: {
          ...current.misconceptionCounts,
          [misconception]: current.misconceptionCounts[misconception] + 1,
        },
      }));

      setRoundFlow('feedback');
      setMessageWithAudio(ENCOURAGEMENT_ROTATION[roundAttempt % ENCOURAGEMENT_ROTATION.length]!, 'hint');

      window.setTimeout(() => {
        beginRetryWithSupport(misconception);
      }, 320);
    },
    [beginRetryWithSupport, roundAttempt, setMessageWithAudio],
  );

  const validateSteps = useCallback(
    (steps: number[]) => {
      const total = steps.reduce((sum, value) => sum + value, 0);
      const preview = round.start + total;
      const removed = round.start - preview;

      if (steps.some((step) => step > 0)) {
        handleRoundMiss('direction');
        return;
      }

      if (removed < round.subtractBy) {
        setRoundFlow('input');
        return;
      }

      if (preview === round.target) {
        handleRoundSuccess(steps);
        return;
      }

      handleRoundMiss(classifyMisconception(round, steps));
    },
    [handleRoundMiss, handleRoundSuccess, round],
  );

  const handleStepTap = useCallback(
    (delta: number) => {
      if (sessionComplete || checkpointPaused || roundFlow !== 'input') {
        return;
      }

      setRoundFlow('feedback');
      setSelectedSteps((current) => {
        const next = [...current, delta];
        window.setTimeout(() => {
          validateSteps(next);
        }, 90);
        return next;
      });
    },
    [checkpointPaused, roundFlow, sessionComplete, validateSteps],
  );

  const handleReplayPrompt = useCallback(() => {
    if (sessionComplete || checkpointPaused) {
      return;
    }

    setMessageWithAudio('games.subtractionStreet.instructions.tapReplay', 'hint');
    window.setTimeout(() => {
      playAudioKey(round.promptKey);
    }, 140);
  }, [checkpointPaused, playAudioKey, round.promptKey, sessionComplete, setMessageWithAudio]);

  const handleHint = useCallback(() => {
    if (sessionComplete || checkpointPaused || roundFlow === 'next') {
      return;
    }

    setUsedHintThisRound(true);
    setHintDepth((value) => {
      const next = Math.min(value + 1, HINT_ROTATION.length);
      const key = HINT_ROTATION[next - 1]!;
      setMessageWithAudio(key, 'hint');

      if (next === 1) {
        window.setTimeout(() => {
          playAudioKey(round.promptKey);
        }, 130);
      }

      if (next >= 2) {
        setRound((current) => ({
          ...current,
          showCounters: true,
          highlightStepOne: true,
        }));
      }

      return next;
    });
  }, [checkpointPaused, playAudioKey, round.promptKey, roundFlow, sessionComplete, setMessageWithAudio]);

  const handleRetry = useCallback(() => {
    if (sessionComplete || checkpointPaused || roundFlow === 'next') {
      return;
    }

    setSelectedSteps([]);
    setRoundAttempt((value) => value + 1);
    setUsedHintThisRound(true);
    setHintDepth((value) => Math.max(1, value));
    setRoundFlow('input');
    setMessageWithAudio('games.subtractionStreet.hints.gentleRetry', 'hint');
  }, [checkpointPaused, roundFlow, sessionComplete, setMessageWithAudio]);

  const handleDragAssistApply = useCallback(() => {
    if (!round.allowDragAssist) {
      return;
    }

    handleStepTap(-Math.max(1, dragAssistValue));
  }, [dragAssistValue, handleStepTap, round.allowDragAssist]);

  const handleNext = useCallback(() => {
    if (sessionComplete || !showNextAction) {
      return;
    }

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
  }, [loadRound, pendingRoundNumber, playAudioKey]);

  const handleCheckpointReplay = useCallback(() => {
    if (!checkpointPaused) {
      return;
    }

    playAudioKey('games.subtractionStreet.instructions.listenAndHopBack');
  }, [checkpointPaused, playAudioKey]);

  useEffect(() => {
    if (sessionComplete || checkpointPaused) {
      return;
    }

    const introTimeout = window.setTimeout(() => {
      setMessageWithAudio(round.instructionKey, 'neutral');

      window.setTimeout(() => {
        playAudioKey(round.promptKey);
        setRoundFlow('input');

        if (round.remediationTag) {
          const remediationKey =
            round.remediationTag === 'direction'
              ? 'games.subtractionStreet.recovery.direction'
              : round.remediationTag === 'crossing10'
                ? 'games.subtractionStreet.recovery.crossing10'
                : 'games.subtractionStreet.recovery.overshoot';
          setMessageWithAudio(remediationKey, 'hint');
        }
      }, 220);
    }, 180);

    return () => {
      window.clearTimeout(introTimeout);
    };
  }, [checkpointPaused, playAudioKey, round.id, round.instructionKey, round.promptKey, round.remediationTag, sessionComplete, setMessageWithAudio]);

  useEffect(() => {
    currentLevelRef.current = currentLevel;
  }, [currentLevel]);

  useEffect(() => {
    return () => {
      audio.stop();
    };
  }, [audio]);

  const trail = useMemo(() => {
    let cursor = round.start;
    return selectedSteps.map((step, index) => {
      const from = cursor;
      const to = Math.max(0, Math.min(NUMBER_LINE_MAX, from + step));
      cursor = to;
      return {
        id: `${round.id}-trail-${index}`,
        from,
        to,
        step,
      };
    });
  }, [round.id, round.start, selectedSteps]);

  const messageText = translateDynamic(roundMessage.key, round.promptValues);

  if (sessionComplete && sessionSummary) {
    return (
      <div className="subtraction-street subtraction-street--summary">
        <Card padding="lg" className="subtraction-street__shell">
          <h2 className="subtraction-street__title">{t('feedback.youDidIt')}</h2>
          <div className="subtraction-street__celebration">
            <SuccessCelebration />
          </div>
          <p className="subtraction-street__message subtraction-street__message--success" aria-live="polite">
            {t('parentDashboard.games.subtractionStreet.progressSummary', {
              within10Accuracy: `${sessionSummary.within10Accuracy}%`,
              within20Accuracy: `${sessionSummary.within20Accuracy}%`,
              topMisconception: translateDynamic(sessionSummary.topMisconceptionLabel),
            })}
          </p>
          <p className="subtraction-street__summary-note">{t('parentDashboard.games.subtractionStreet.nextStep')}</p>
          <p className="subtraction-street__summary-tone">{translateDynamic(sessionSummary.hintTrendLabel)}</p>
        </Card>
        <style>{subtractionStreetStyles}</style>
      </div>
    );
  }

  if (checkpointPaused) {
    return (
      <div className="subtraction-street subtraction-street--checkpoint">
        <Card padding="lg" className="subtraction-street__shell">
          <h2 className="subtraction-street__title">{t('feedback.greatEffort')}</h2>
          <p className="subtraction-street__summary-note">{t('games.subtractionStreet.instructions.listenAndHopBack')}</p>
          <div className="subtraction-street__checkpoint-controls">
            <Button
              variant="secondary"
              size="md"
              onClick={handleCheckpointReplay}
              aria-label={t('games.subtractionStreet.instructions.tapReplay')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              {replayIcon}
            </Button>
            <Button variant="primary" size="lg" onClick={handleContinueAfterCheckpoint} aria-label={t('nav.next')}>
              {nextIcon}
            </Button>
          </div>
        </Card>
        <style>{subtractionStreetStyles}</style>
      </div>
    );
  }

  return (
    <div className="subtraction-street">
      <Card padding="lg" className="subtraction-street__shell">
        <header className="subtraction-street__header">
          <div className="subtraction-street__heading">
            <h2 className="subtraction-street__title">{t('games.subtractionStreet.title')}</h2>
            <p className="subtraction-street__subtitle">{t('games.subtractionStreet.subtitle')}</p>
          </div>

          <div className="subtraction-street__controls">
            <Button
              variant="secondary"
              size="md"
              onClick={handleReplayPrompt}
              aria-label={t('games.subtractionStreet.instructions.tapReplay')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              {replayIcon}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleHint}
              aria-label={t('games.subtractionStreet.hints.replayPrompt')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              💡
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleRetry}
              aria-label={t('games.subtractionStreet.hints.gentleRetry')}
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

        <div className="subtraction-street__meta">
          <span className="subtraction-street__meta-pill">{resolveThemeEmoji(round.theme)} {t(`games.subtractionStreet.themes.${round.theme}`)}</span>
          <span className="subtraction-street__meta-pill">{t(`games.subtractionStreet.levelLabel.${round.levelBand}`)}</span>
          <span className="subtraction-street__meta-pill">⭐ {firstAttemptStars}</span>
        </div>

        <div className="subtraction-street__progress" aria-label={t('games.estimatedTime', { minutes: 6 })}>
          {progressSegments.map((segment) => {
            const state = segment <= resolvedRounds ? 'done' : segment === resolvedRounds + 1 ? 'active' : 'pending';
            return <span key={`sub-progress-${segment}`} className={`subtraction-street__dot subtraction-street__dot--${state}`} aria-hidden="true" />;
          })}
        </div>

        <p className={`subtraction-street__message subtraction-street__message--${roundMessage.tone}`} aria-live="polite">
          {messageText}
        </p>

        <div className="subtraction-street__coach" aria-hidden="true">
          <MascotIllustration variant={roundMessage.tone === 'success' ? 'success' : 'hint'} size={52} />
        </div>

        {audioPlaybackFailed && (
          <p className="subtraction-street__audio-fallback" aria-live="polite">
            🔇 {t('games.subtractionStreet.instructions.listenAndHopBack')}
          </p>
        )}

        <Card padding="md" className="subtraction-street__prompt-card">
          <p className="subtraction-street__prompt">{translateDynamic(round.promptKey, round.promptValues)}</p>
        </Card>

        <section className="subtraction-street__board" dir="ltr" aria-label={t('games.subtractionStreet.instructions.tapBackwardJumps')}>
          <div className="subtraction-street__line" role="group" aria-label={t('games.subtractionStreet.instructions.listenAndHopBack')}>
            {NUMBER_LINE_VALUES.map((value) => {
              const isStart = value === round.start;
              const isTarget = value === round.target;
              const isPreview = value === previewValue;
              const between = value >= Math.min(round.start, previewValue) && value <= Math.max(round.start, previewValue);

              return (
                <div
                  key={`sub-marker-${value}`}
                  className={[
                    'subtraction-street__marker',
                    between ? 'subtraction-street__marker--between' : '',
                    isStart ? 'subtraction-street__marker--start' : '',
                    isTarget ? 'subtraction-street__marker--target' : '',
                    isPreview ? 'subtraction-street__marker--preview' : '',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  <span>{value}</span>
                </div>
              );
            })}
          </div>

          {trail.length > 0 && (
            <ol className="subtraction-street__trail" aria-hidden="true">
              {trail.map((entry) => (
                <li key={entry.id} className="subtraction-street__trail-chip">
                  <span>{entry.from}→{entry.to}</span>
                  <span>{entry.step > 0 ? '+' : ''}{entry.step}</span>
                </li>
              ))}
            </ol>
          )}

          {round.crossingTenChallenge && (
            <div className="subtraction-street__ten-anchor" aria-hidden="true">
              <span>10</span>
            </div>
          )}
        </section>

        <Card padding="md" className="subtraction-street__equation-card">
          <div className="subtraction-street__equation" aria-live="polite">
            {round.unknownPrompt === 'missingSubtrahend' ? (
              <>
                <span>{round.start}</span>
                <span>-</span>
                <span>?</span>
                <span>=</span>
                <span>{round.target}</span>
              </>
            ) : round.unknownPrompt === 'missingResult' ? (
              <>
                <span>?</span>
                <span>=</span>
                <span>{round.start}</span>
                <span>-</span>
                <span>{round.subtractBy}</span>
              </>
            ) : (
              <>
                <span>{round.start}</span>
                <span>-</span>
                <span>{removedAmount}</span>
                <span>=</span>
                <span>{previewValue}</span>
              </>
            )}
          </div>
          <p className="subtraction-street__remaining" aria-live="polite">
            {remainingAmount}
          </p>
        </Card>

        {round.showCounters && (
          <div className="subtraction-street__counters" aria-live="polite">
            {Array.from({ length: round.subtractBy }, (_, index) => {
              const isRemoved = index < removedAmount;
              return (
                <span
                  key={`sub-counter-${round.id}-${index}`}
                  className={isRemoved ? 'subtraction-street__counter subtraction-street__counter--removed' : 'subtraction-street__counter'}
                  aria-hidden="true"
                >
                  ●
                </span>
              );
            })}
          </div>
        )}

        <div className="subtraction-street__steps" role="group" aria-label={t('games.subtractionStreet.instructions.tapBackwardJumps')}>
          {round.stepChoices.map((step) => (
            <button
              key={`sub-step-${round.id}-${step}`}
              type="button"
              className={[
                'subtraction-street__step',
                round.highlightStepOne && step === 1 ? 'subtraction-street__step--hint' : '',
              ].join(' ')}
              onClick={() => handleStepTap(-step)}
              disabled={roundFlow !== 'input' || sessionComplete}
              aria-label={t('games.subtractionStreet.instructions.jumpByStep', { step })}
            >
              -{step}
            </button>
          ))}
        </div>

        {round.directionDecoys.length > 0 && (
          <div className="subtraction-street__direction-decoys" role="group" aria-label={t('games.subtractionStreet.instructions.directionCheck')}>
            {round.directionDecoys.map((step) => (
              <button
                key={`sub-decoy-${round.id}-${step}`}
                type="button"
                className="subtraction-street__step subtraction-street__step--decoy"
                onClick={() => handleStepTap(step)}
                disabled={roundFlow !== 'input' || sessionComplete}
                aria-label={t('games.subtractionStreet.instructions.forwardByStep', { step })}
              >
                +{step}
              </button>
            ))}
          </div>
        )}

        {round.allowDragAssist && (
          <div className="subtraction-street__drag-assist">
            <input
              type="range"
              min={1}
              max={Math.max(1, Math.min(6, round.subtractBy))}
              value={dragAssistValue}
              onChange={(event) => setDragAssistValue(Number(event.target.value))}
              aria-label={t('games.subtractionStreet.instructions.dragAssist')}
            />
            <Button
              variant="secondary"
              size="md"
              onClick={handleDragAssistApply}
              aria-label={t('games.subtractionStreet.instructions.dragAssistApply', { step: dragAssistValue })}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              ⇠
            </Button>
          </div>
        )}
      </Card>

      <style>{subtractionStreetStyles}</style>
    </div>
  );
}

const subtractionStreetStyles = `
  .subtraction-street {
    display: flex;
    justify-content: center;
    padding: var(--space-xl);
    background: var(--color-theme-bg);
    min-height: 100%;
  }

  .subtraction-street__shell {
    width: min(1120px, 100%);
    display: grid;
    gap: var(--space-md);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 24%, white);
  }

  .subtraction-street__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .subtraction-street__heading {
    display: grid;
    gap: var(--space-2xs);
  }

  .subtraction-street__title {
    margin: 0;
    font-size: var(--font-size-xl);
    color: var(--color-text-primary);
  }

  .subtraction-street__subtitle {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .subtraction-street__controls {
    display: inline-flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .subtraction-street__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .subtraction-street__meta-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    min-height: var(--touch-min);
    padding-inline: var(--space-sm);
    border-radius: var(--radius-full);
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 24%, white);
    background: color-mix(in srgb, var(--color-theme-primary) 10%, white);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);
  }

  .subtraction-street__progress {
    display: grid;
    grid-template-columns: repeat(${TOTAL_ROUNDS}, minmax(0, 1fr));
    gap: var(--space-xs);
  }

  .subtraction-street__dot {
    display: block;
    height: 12px;
    border-radius: var(--radius-full);
    background: var(--color-star-empty);
  }

  .subtraction-street__dot--active {
    background: var(--color-theme-primary);
  }

  .subtraction-street__dot--done {
    background: var(--color-accent-success);
  }

  .subtraction-street__message {
    margin: 0;
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    font-size: var(--font-size-md);
    color: var(--color-text-primary);
  }

  .subtraction-street__message--neutral {
    background: color-mix(in srgb, var(--color-theme-primary) 12%, white);
    border-color: color-mix(in srgb, var(--color-theme-primary) 28%, white);
  }

  .subtraction-street__message--hint {
    background: color-mix(in srgb, var(--color-warning) 16%, white);
    border-color: color-mix(in srgb, var(--color-warning) 32%, white);
  }

  .subtraction-street__message--success {
    background: color-mix(in srgb, var(--color-accent-success) 14%, white);
    border-color: color-mix(in srgb, var(--color-accent-success) 32%, white);
  }

  .subtraction-street__coach {
    justify-self: end;
    pointer-events: none;
  }

  .subtraction-street__audio-fallback {
    margin: 0;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--color-warning) 16%, white);
    color: var(--color-text-primary);
  }

  .subtraction-street__prompt-card {
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 20%, white);
  }

  .subtraction-street__prompt {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
  }

  .subtraction-street__board {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    background: linear-gradient(180deg, color-mix(in srgb, var(--color-theme-primary) 10%, white), white);
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 24%, white);
  }

  .subtraction-street__line {
    display: grid;
    grid-template-columns: repeat(21, minmax(0, 1fr));
    gap: 4px;
  }

  .subtraction-street__marker {
    min-height: 50px;
    border-radius: var(--radius-md);
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 14%, white);
    background: white;
    color: var(--color-text-secondary);
    display: grid;
    place-items: center;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
  }

  .subtraction-street__marker--between {
    background: color-mix(in srgb, var(--color-theme-primary) 8%, white);
  }

  .subtraction-street__marker--start {
    border-color: color-mix(in srgb, var(--color-theme-primary) 48%, white);
    background: color-mix(in srgb, var(--color-theme-primary) 14%, white);
  }

  .subtraction-street__marker--target {
    border-color: color-mix(in srgb, var(--color-accent-success) 48%, white);
    background: color-mix(in srgb, var(--color-accent-success) 14%, white);
  }

  .subtraction-street__marker--preview {
    border-color: color-mix(in srgb, var(--color-warning) 46%, white);
    background: color-mix(in srgb, var(--color-warning) 16%, white);
  }

  .subtraction-street__trail {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .subtraction-street__trail-chip {
    display: inline-flex;
    gap: var(--space-2xs);
    align-items: center;
    min-height: var(--touch-min);
    padding-inline: var(--space-sm);
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-theme-primary) 12%, white);
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 24%, white);
    color: var(--color-text-primary);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
  }

  .subtraction-street__ten-anchor {
    justify-self: center;
    padding: var(--space-2xs) var(--space-sm);
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-warning) 24%, white);
    border: 1px solid color-mix(in srgb, var(--color-warning) 40%, white);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }

  .subtraction-street__equation-card {
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 18%, white);
  }

  .subtraction-street__equation {
    display: flex;
    justify-content: center;
    gap: var(--space-xs);
    align-items: center;
    color: var(--color-text-primary);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
  }

  .subtraction-street__remaining {
    margin: var(--space-xs) 0 0;
    text-align: center;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .subtraction-street__counters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    justify-content: center;
  }

  .subtraction-street__counter {
    font-size: var(--font-size-md);
    color: var(--color-theme-primary);
    opacity: 1;
  }

  .subtraction-street__counter--removed {
    opacity: 0.22;
  }

  .subtraction-street__steps,
  .subtraction-street__direction-decoys {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    justify-content: center;
  }

  .subtraction-street__step {
    min-width: var(--touch-min);
    min-height: var(--touch-min);
    border-radius: var(--radius-md);
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 30%, white);
    background: white;
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);
    padding-inline: var(--space-sm);
    cursor: pointer;
    transition: transform 140ms ease, background-color 140ms ease;
  }

  .subtraction-street__step:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .subtraction-street__step:not(:disabled):active {
    transform: scale(0.96);
  }

  .subtraction-street__step--hint {
    background: color-mix(in srgb, var(--color-warning) 18%, white);
    border-color: color-mix(in srgb, var(--color-warning) 44%, white);
  }

  .subtraction-street__step--decoy {
    background: color-mix(in srgb, var(--color-danger) 10%, white);
    border-color: color-mix(in srgb, var(--color-danger) 28%, white);
  }

  .subtraction-street__drag-assist {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
  }

  .subtraction-street__drag-assist input[type='range'] {
    width: min(340px, 100%);
  }

  .subtraction-street__celebration {
    max-width: 320px;
    justify-self: center;
  }

  .subtraction-street__summary-note,
  .subtraction-street__summary-tone {
    margin: 0;
    color: var(--color-text-secondary);
    text-align: center;
  }

  .subtraction-street__checkpoint-controls {
    display: inline-flex;
    gap: var(--space-sm);
    justify-self: center;
  }

  .subtraction-street--checkpoint,
  .subtraction-street--summary {
    align-items: center;
  }

  @media (max-width: 900px) {
    .subtraction-street {
      padding: var(--space-md);
    }

    .subtraction-street__line {
      grid-template-columns: repeat(11, minmax(0, 1fr));
    }

    .subtraction-street__marker {
      min-height: 46px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .subtraction-street__step,
    .subtraction-street__dot,
    .subtraction-street__trail-chip {
      transition: none !important;
      animation: none !important;
    }
  }
`;
