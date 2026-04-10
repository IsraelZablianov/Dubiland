import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import type { GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';

type GameLevelId = 1 | 2 | 3;
type ComparisonKind = 'more' | 'less' | 'equal';
type Side = 'left' | 'right';
type DisplayMode = 'setVsSet' | 'setVsNumber';
type MessageTone = 'neutral' | 'hint' | 'success';
type ThemeKey = 'basketFruits' | 'basketToys' | 'basketShells';

type InstructionKey =
  | 'games.moreOrLessMarket.instructions.intro'
  | 'games.moreOrLessMarket.instructions.tapChoice'
  | 'games.moreOrLessMarket.instructions.dragBadge'
  | 'games.moreOrLessMarket.instructions.listenAndCompare';

type PromptKey =
  | 'games.moreOrLessMarket.prompts.more.basketFruits'
  | 'games.moreOrLessMarket.prompts.more.basketToys'
  | 'games.moreOrLessMarket.prompts.more.basketShells'
  | 'games.moreOrLessMarket.prompts.more.numbers'
  | 'games.moreOrLessMarket.prompts.less.basketFruits'
  | 'games.moreOrLessMarket.prompts.less.basketToys'
  | 'games.moreOrLessMarket.prompts.less.basketShells'
  | 'games.moreOrLessMarket.prompts.less.numbers'
  | 'games.moreOrLessMarket.prompts.equal.baskets'
  | 'games.moreOrLessMarket.prompts.equal.cards'
  | 'games.moreOrLessMarket.prompts.equal.numbers';

type HintKey =
  | 'games.moreOrLessMarket.hints.countTogether'
  | 'games.moreOrLessMarket.hints.compareOneByOne'
  | 'games.moreOrLessMarket.hints.tapToCount'
  | 'games.moreOrLessMarket.hints.useReplay'
  | 'games.moreOrLessMarket.hints.gentleRetry';

type EncouragementKey =
  | 'games.moreOrLessMarket.feedback.encouragement.keepTrying'
  | 'games.moreOrLessMarket.feedback.encouragement.almostThere'
  | 'games.moreOrLessMarket.feedback.encouragement.tryAgain';

type SuccessKey =
  | 'games.moreOrLessMarket.feedback.success.wellDone'
  | 'games.moreOrLessMarket.feedback.success.amazing'
  | 'games.moreOrLessMarket.feedback.success.celebrate';

type GlobalFeedbackKey = 'feedback.greatEffort' | 'feedback.keepGoing' | 'feedback.excellent' | 'feedback.youDidIt';

type ParentSummaryKey =
  | 'parentDashboard.games.moreOrLessMarket.progressSummary'
  | 'parentDashboard.games.moreOrLessMarket.nextStep';

type StatusKey =
  | InstructionKey
  | PromptKey
  | HintKey
  | EncouragementKey
  | SuccessKey
  | GlobalFeedbackKey
  | ParentSummaryKey
  | 'nav.next';

interface RoundConfig {
  roundNumber: number;
  simplifyRound: boolean;
  masteryBoost: boolean;
}

interface RoundState {
  id: string;
  level: GameLevelId;
  roundNumber: number;
  comparison: ComparisonKind;
  promptKey: PromptKey;
  instructionKey: InstructionKey;
  correctSide: Side | 'equal';
  leftValue: number;
  rightValue: number;
  leftTokens: string[];
  rightTokens: string[];
  leftIsNumberCard: boolean;
  rightIsNumberCard: boolean;
  displayMode: DisplayMode;
  requiresBadge: boolean;
  showCountScaffold: boolean;
}

interface RoundMessage {
  key: StatusKey;
  tone: MessageTone;
}

interface ComparisonStats {
  rounds: number;
  firstAttemptHits: number;
}

interface SessionStats {
  firstAttemptSuccesses: number;
  hintUsageByRound: number[];
  highestValueCompared: number;
  comparisonStats: Record<ComparisonKind, ComparisonStats>;
}

interface SummaryReport {
  firstAttemptAccuracy: number;
  averageHintLevel: string;
  hintTrend: ParentSummaryMetrics['hintTrend'];
  hintToneKey: Extract<GlobalFeedbackKey, 'feedback.excellent' | 'feedback.keepGoing' | 'feedback.greatEffort'>;
}

const TOTAL_ROUNDS = 9;
const CHECKPOINT_ROUNDS = [4, 7];
const NON_CRITICAL_AUDIO_DELAY_MS = 5000;
const CHECKPOINT_INSTRUCTION_KEY: InstructionKey = 'games.moreOrLessMarket.instructions.listenAndCompare';

const TOKEN_POOL_BY_THEME: Record<ThemeKey, string[]> = {
  basketFruits: ['🍊', '🍎', '🍐', '🍓'],
  basketToys: ['🪁', '🧩', '🚗', '🪀'],
  basketShells: ['🐚', '🪸', '🦀', '🏖️'],
};

const BADGE_SYMBOL_BY_KIND: Record<ComparisonKind, string> = {
  more: '>',
  less: '<',
  equal: '=',
};

const SUCCESS_ROTATION: SuccessKey[] = [
  'games.moreOrLessMarket.feedback.success.wellDone',
  'games.moreOrLessMarket.feedback.success.amazing',
  'games.moreOrLessMarket.feedback.success.celebrate',
];

const ENCOURAGEMENT_ROTATION: EncouragementKey[] = [
  'games.moreOrLessMarket.feedback.encouragement.keepTrying',
  'games.moreOrLessMarket.feedback.encouragement.almostThere',
  'games.moreOrLessMarket.feedback.encouragement.tryAgain',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)] as T;
}

function toKebabCase(segment: string): string {
  return segment.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function keyToAudioPath(key: StatusKey): string | null {
  const segments = key.split('.');

  if (segments[0] === 'games' && segments[1] === 'moreOrLessMarket') {
    return `/audio/he/games/more-or-less-market/${segments.slice(2).map(toKebabCase).join('/')}.mp3`;
  }

  if (segments[0] === 'feedback') {
    return `/audio/he/feedback/${segments.slice(1).map(toKebabCase).join('/')}.mp3`;
  }

  if (segments[0] === 'parentDashboard' && segments[1] === 'games' && segments[2] === 'moreOrLessMarket') {
    return `/audio/he/parent-dashboard/games/more-or-less-market/${segments
      .slice(3)
      .map(toKebabCase)
      .join('/')}.mp3`;
  }

  if (segments[0] === 'nav') {
    return `/audio/he/nav/${segments.slice(1).map(toKebabCase).join('/')}.mp3`;
  }

  return null;
}

function getLevelByRound(roundNumber: number): GameLevelId {
  if (roundNumber <= 3) {
    return 1;
  }

  if (roundNumber <= 6) {
    return 2;
  }

  return 3;
}

function getThemeByRound(roundNumber: number): ThemeKey {
  const cycle: ThemeKey[] = ['basketFruits', 'basketToys', 'basketShells'];
  return cycle[(roundNumber - 1) % cycle.length] as ThemeKey;
}

function buildTokenDeck(value: number, theme: ThemeKey): string[] {
  const palette = TOKEN_POOL_BY_THEME[theme];
  return Array.from({ length: value }, (_, index) => palette[index % palette.length] as string);
}

function computeHintTrend(hintUsageByRound: number[]): ParentSummaryMetrics['hintTrend'] {
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

function getHintToneKey(
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

function getStableRangeFromHighestValue(highestValue: number): StableRange {
  if (highestValue >= 15) {
    return '1-10';
  }

  if (highestValue >= 8) {
    return '1-5';
  }

  return '1-3';
}

function getPromptKey(comparison: ComparisonKind, theme: ThemeKey, displayMode: DisplayMode, roundNumber: number): PromptKey {
  if (comparison === 'equal') {
    if (displayMode === 'setVsNumber') {
      return 'games.moreOrLessMarket.prompts.equal.numbers';
    }

    if (roundNumber === 8) {
      return 'games.moreOrLessMarket.prompts.equal.cards';
    }

    return 'games.moreOrLessMarket.prompts.equal.baskets';
  }

  if (displayMode === 'setVsNumber') {
    return `games.moreOrLessMarket.prompts.${comparison}.numbers` as PromptKey;
  }

  return `games.moreOrLessMarket.prompts.${comparison}.${theme}` as PromptKey;
}

function pickComparison(roundNumber: number, level: GameLevelId, masteryBoost: boolean): ComparisonKind {
  if (level === 1) {
    return 'more';
  }

  if (level === 2) {
    if (roundNumber === 4) {
      return 'more';
    }
    return pickRandom(['more', 'less'] as const);
  }

  if (roundNumber === 8) {
    return 'equal';
  }

  if (roundNumber === 7) {
    return pickRandom(['more', 'less'] as const);
  }

  return masteryBoost
    ? pickRandom(['more', 'less', 'equal'] as const)
    : pickRandom(['more', 'less'] as const);
}

function createRound(config: RoundConfig): RoundState {
  const level = getLevelByRound(config.roundNumber);
  const theme = getThemeByRound(config.roundNumber);

  const requiresBadge = level === 3;
  const displayMode: DisplayMode =
    level === 3 && config.roundNumber >= 9 && !config.simplifyRound ? 'setVsNumber' : 'setVsSet';

  const comparison = pickComparison(config.roundNumber, level, config.masteryBoost);

  const rangeByLevel: Record<GameLevelId, { min: number; max: number }> = {
    1: { min: 1, max: 6 },
    2: { min: 1, max: 10 },
    3: { min: 5, max: 20 },
  };

  const { min, max } = rangeByLevel[level];

  let leftValue = 0;
  let rightValue = 0;

  if (comparison === 'equal') {
    const equalValue = randomInt(min, max);
    leftValue = equalValue;
    rightValue = equalValue;
  } else {
    const diffMin = level === 1 ? 2 : config.simplifyRound ? 3 : 1;
    const diffMax = level === 1 ? 4 : level === 2 ? 5 : 7;

    const safeBaseMax = Math.max(min, max - diffMin);
    const base = randomInt(min, safeBaseMax);
    const cappedDiffMax = Math.max(diffMin, Math.min(diffMax, max - base));
    const diff = randomInt(diffMin, cappedDiffMax);

    if (Math.random() < 0.5) {
      leftValue = base;
      rightValue = base + diff;
    } else {
      leftValue = base + diff;
      rightValue = base;
    }
  }

  const correctSide: Side | 'equal' =
    comparison === 'equal'
      ? 'equal'
      : comparison === 'more'
        ? leftValue > rightValue
          ? 'left'
          : 'right'
        : leftValue < rightValue
          ? 'left'
          : 'right';

  const numberCardSide: Side | null = displayMode === 'setVsNumber' ? (config.roundNumber % 2 === 0 ? 'left' : 'right') : null;

  const leftIsNumberCard = numberCardSide === 'left';
  const rightIsNumberCard = numberCardSide === 'right';

  const promptKey = getPromptKey(comparison, theme, displayMode, config.roundNumber);

  return {
    id: `more-less-market-${config.roundNumber}-${comparison}-${displayMode}`,
    level,
    roundNumber: config.roundNumber,
    comparison,
    promptKey,
    instructionKey: requiresBadge
      ? 'games.moreOrLessMarket.instructions.dragBadge'
      : 'games.moreOrLessMarket.instructions.tapChoice',
    correctSide,
    leftValue,
    rightValue,
    leftTokens: leftIsNumberCard ? [] : buildTokenDeck(leftValue, theme),
    rightTokens: rightIsNumberCard ? [] : buildTokenDeck(rightValue, theme),
    leftIsNumberCard,
    rightIsNumberCard,
    displayMode,
    requiresBadge,
    showCountScaffold: level === 1 || config.simplifyRound,
  };
}

function chunkTokens(tokens: string[]): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < tokens.length; index += 5) {
    chunks.push(tokens.slice(index, index + 5));
  }
  return chunks;
}

function buildSummaryReport(stats: SessionStats): SummaryReport {
  const roundsPlayed = stats.hintUsageByRound.length;
  const firstAttemptAccuracy =
    roundsPlayed === 0 ? 0 : Math.round((stats.firstAttemptSuccesses / roundsPlayed) * 100);

  const averageHintRaw =
    roundsPlayed === 0
      ? 0
      : stats.hintUsageByRound.reduce((sum, value) => sum + value, 0) / roundsPlayed;

  const averageHintLevel = averageHintRaw.toFixed(1);
  const hintTrend = computeHintTrend(stats.hintUsageByRound);

  return {
    firstAttemptAccuracy,
    averageHintLevel,
    hintTrend,
    hintToneKey: getHintToneKey(hintTrend),
  };
}

export function MoreOrLessMarketGame({ onComplete, audio }: GameProps) {
  const { t } = useTranslation('common');

  const [roundConfig, setRoundConfig] = useState<RoundConfig>({
    roundNumber: 1,
    simplifyRound: false,
    masteryBoost: false,
  });
  const [round, setRound] = useState<RoundState>(() =>
    createRound({
      roundNumber: 1,
      simplifyRound: false,
      masteryBoost: false,
    }),
  );

  const [pendingRoundConfig, setPendingRoundConfig] = useState<RoundConfig | null>(null);
  const [checkpointPaused, setCheckpointPaused] = useState(false);

  const [selectedSide, setSelectedSide] = useState<Side | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<ComparisonKind | null>(null);
  const [draggingBadgeKind, setDraggingBadgeKind] = useState<ComparisonKind | null>(null);
  const [badgeSlotHot, setBadgeSlotHot] = useState(false);
  const [badgeSlotAcceptPulse, setBadgeSlotAcceptPulse] = useState(false);
  const [badgeSlotRejectPulse, setBadgeSlotRejectPulse] = useState(false);

  const [showCountScaffold, setShowCountScaffold] = useState(round.showCountScaffold);
  const [revealedCountBySide, setRevealedCountBySide] = useState<Record<Side, boolean>>({
    left: false,
    right: false,
  });
  const [highlightCorrectSide, setHighlightCorrectSide] = useState(false);

  const [mistakesThisRound, setMistakesThisRound] = useState(0);
  const [hintStep, setHintStep] = useState(0);
  const [usedHintThisRound, setUsedHintThisRound] = useState(false);

  const [consecutiveSuccesses, setConsecutiveSuccesses] = useState(0);
  const [consecutiveStruggles, setConsecutiveStruggles] = useState(0);

  const [sessionComplete, setSessionComplete] = useState(false);
  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [scorePulse, setScorePulse] = useState(false);
  const [nonCriticalAudioReady, setNonCriticalAudioReady] = useState(false);

  const [roundMessage, setRoundMessage] = useState<RoundMessage>({
    key: 'games.moreOrLessMarket.instructions.intro',
    tone: 'neutral',
  });

  const [sessionStats, setSessionStats] = useState<SessionStats>({
    firstAttemptSuccesses: 0,
    hintUsageByRound: [],
    highestValueCompared: 0,
    comparisonStats: {
      more: { rounds: 0, firstAttemptHits: 0 },
      less: { rounds: 0, firstAttemptHits: 0 },
      equal: { rounds: 0, firstAttemptHits: 0 },
    },
  });

  const completionReportedRef = useRef(false);

  const progressSegments = useMemo(() => Array.from({ length: TOTAL_ROUNDS }, (_, index) => index + 1), []);

  const playAudioKey = useCallback(
    (key: StatusKey) => {
      const audioPath = keyToAudioPath(key);
      if (!audioPath) {
        return;
      }
      audio.play(audioPath);
    },
    [audio],
  );

  const setMessageWithAudio = useCallback(
    (key: StatusKey, tone: MessageTone) => {
      setRoundMessage({ key, tone });
      playAudioKey(key);
    },
    [playAudioKey],
  );

  const markNonCriticalAudioReady = useCallback(() => {
    setNonCriticalAudioReady(true);
  }, []);

  const resetRoundInteractions = useCallback((nextRound: RoundState) => {
    setSelectedSide(null);
    setSelectedBadge(null);
    setDraggingBadgeKind(null);
    setBadgeSlotHot(false);
    setBadgeSlotAcceptPulse(false);
    setBadgeSlotRejectPulse(false);
    setShowCountScaffold(nextRound.showCountScaffold);
    setRevealedCountBySide({ left: false, right: false });
    setHighlightCorrectSide(false);
    setMistakesThisRound(0);
    setHintStep(0);
    setUsedHintThisRound(false);
    setScorePulse(false);
  }, []);

  const loadRound = useCallback(
    (nextConfig: RoundConfig) => {
      const nextRound = createRound(nextConfig);
      setRoundConfig(nextConfig);
      setRound(nextRound);
      resetRoundInteractions(nextRound);
      setMessageWithAudio(nextRound.instructionKey, 'neutral');
    },
    [resetRoundInteractions, setMessageWithAudio],
  );

  const finalizeSession = useCallback(
    (finalStats: SessionStats) => {
      if (completionReportedRef.current) {
        return;
      }

      completionReportedRef.current = true;

      const report = buildSummaryReport(finalStats);
      setSummary(report);
      setSessionComplete(true);
      setMessageWithAudio('feedback.youDidIt', 'success');

      const stars = report.firstAttemptAccuracy >= 85 ? 3 : report.firstAttemptAccuracy >= 60 ? 2 : 1;

      onComplete({
        stars,
        score:
          finalStats.firstAttemptSuccesses * 120 +
          (TOTAL_ROUNDS - finalStats.hintUsageByRound.reduce((sum, value) => sum + value, 0)) * 20,
        completed: true,
        roundsCompleted: finalStats.hintUsageByRound.length,
        summaryMetrics: {
          highestStableRange: getStableRangeFromHighestValue(finalStats.highestValueCompared),
          firstAttemptSuccessRate: report.firstAttemptAccuracy,
          hintTrend: report.hintTrend,
        },
      });
    },
    [onComplete, setMessageWithAudio],
  );

  const completeRound = useCallback(
    (forcedStruggle = false) => {
      if (sessionComplete || checkpointPaused) {
        return;
      }

      const roundWasStruggle = forcedStruggle || usedHintThisRound || mistakesThisRound > 0;
      if (!roundWasStruggle) {
        setScorePulse(true);
      }

      const updatedComparisonStats: SessionStats['comparisonStats'] = {
        ...sessionStats.comparisonStats,
        [round.comparison]: {
          rounds: sessionStats.comparisonStats[round.comparison].rounds + 1,
          firstAttemptHits:
            sessionStats.comparisonStats[round.comparison].firstAttemptHits + (roundWasStruggle ? 0 : 1),
        },
      };

      const updatedStats: SessionStats = {
        firstAttemptSuccesses: sessionStats.firstAttemptSuccesses + (roundWasStruggle ? 0 : 1),
        hintUsageByRound: [...sessionStats.hintUsageByRound, roundWasStruggle ? Math.max(1, hintStep) : 0],
        highestValueCompared: Math.max(sessionStats.highestValueCompared, round.leftValue, round.rightValue),
        comparisonStats: updatedComparisonStats,
      };

      setSessionStats(updatedStats);

      const solvedRounds = updatedStats.hintUsageByRound.length;
      const successKey = SUCCESS_ROTATION[(solvedRounds - 1) % SUCCESS_ROTATION.length] as SuccessKey;
      setMessageWithAudio(successKey, 'success');

      const nextConsecutiveSuccesses = roundWasStruggle ? 0 : consecutiveSuccesses + 1;
      const nextConsecutiveStruggles = roundWasStruggle ? consecutiveStruggles + 1 : 0;

      setConsecutiveSuccesses(nextConsecutiveSuccesses >= 3 ? 0 : nextConsecutiveSuccesses);
      setConsecutiveStruggles(nextConsecutiveStruggles >= 2 ? 0 : nextConsecutiveStruggles);

      if (solvedRounds >= TOTAL_ROUNDS) {
        window.setTimeout(() => {
          finalizeSession(updatedStats);
        }, 550);
        return;
      }

      const nextRoundNumber = roundConfig.roundNumber + 1;
      const nextConfig: RoundConfig = {
        roundNumber: nextRoundNumber,
        simplifyRound:
          roundWasStruggle && (mistakesThisRound >= 2 || nextConsecutiveStruggles >= 2),
        masteryBoost: roundConfig.masteryBoost || nextConsecutiveSuccesses >= 3,
      };

      if (CHECKPOINT_ROUNDS.includes(nextRoundNumber)) {
        setPendingRoundConfig(nextConfig);
        setCheckpointPaused(true);
        return;
      }

      window.setTimeout(() => {
        loadRound(nextConfig);
      }, 650);
    },
    [
      checkpointPaused,
      consecutiveStruggles,
      consecutiveSuccesses,
      finalizeSession,
      hintStep,
      loadRound,
      mistakesThisRound,
      round,
      roundConfig,
      sessionComplete,
      sessionStats,
      setMessageWithAudio,
      usedHintThisRound,
    ],
  );

  const applyGuidedRecovery = useCallback(() => {
    setUsedHintThisRound(true);
    setHintStep(3);
    setShowCountScaffold(true);
    setHighlightCorrectSide(true);

    if (round.correctSide !== 'equal') {
      setSelectedSide(round.correctSide);
    }

    if (round.requiresBadge) {
      setSelectedBadge(round.comparison === 'equal' ? 'equal' : round.comparison);
    }

    setMessageWithAudio('games.moreOrLessMarket.hints.countTogether', 'hint');

    window.setTimeout(() => {
      completeRound(true);
    }, 550);
  }, [completeRound, round, setMessageWithAudio]);

  const registerMistake = useCallback(() => {
    if (sessionComplete || checkpointPaused) {
      return;
    }

    setMistakesThisRound((previousMistakes) => {
      const nextMistakes = previousMistakes + 1;
      setUsedHintThisRound(true);

      if (nextMistakes === 1) {
        const key = ENCOURAGEMENT_ROTATION[randomInt(0, ENCOURAGEMENT_ROTATION.length - 1)] as EncouragementKey;
        setMessageWithAudio(key, 'hint');
        return nextMistakes;
      }

      if (nextMistakes === 2) {
        setHintStep((current) => Math.max(current, 2));
        setShowCountScaffold(true);
        setHighlightCorrectSide(true);
        setMessageWithAudio('games.moreOrLessMarket.hints.compareOneByOne', 'hint');
        return nextMistakes;
      }

      applyGuidedRecovery();
      return nextMistakes;
    });
  }, [applyGuidedRecovery, checkpointPaused, sessionComplete, setMessageWithAudio]);

  const evaluateSelection = useCallback(
    (candidateSide: Side | null, badge: ComparisonKind | null) => {
      if (sessionComplete || checkpointPaused) {
        return;
      }

      if (round.requiresBadge && !badge) {
        setMessageWithAudio('games.moreOrLessMarket.instructions.dragBadge', 'neutral');
        return;
      }

      if (round.comparison !== 'equal' && !candidateSide) {
        setMessageWithAudio('games.moreOrLessMarket.instructions.tapChoice', 'neutral');
        return;
      }

      const isCorrect =
        round.comparison === 'equal'
          ? badge === 'equal'
          : round.requiresBadge
            ? candidateSide === round.correctSide && badge === round.comparison
            : candidateSide === round.correctSide;

      if (isCorrect) {
        if (round.requiresBadge) {
          setBadgeSlotHot(false);
          setBadgeSlotAcceptPulse(true);
        }
        completeRound();
        return;
      }

      if (round.requiresBadge) {
        setBadgeSlotRejectPulse(true);
      }
      registerMistake();
    },
    [
      checkpointPaused,
      completeRound,
      registerMistake,
      round.comparison,
      round.correctSide,
      round.requiresBadge,
      sessionComplete,
      setMessageWithAudio,
    ],
  );

  const handleSideChoice = useCallback(
    (side: Side) => {
      if (sessionComplete || checkpointPaused) {
        return;
      }

      markNonCriticalAudioReady();
      setSelectedSide(side);

      if (!round.requiresBadge) {
        evaluateSelection(side, null);
        return;
      }

      if (selectedBadge) {
        evaluateSelection(side, selectedBadge);
        return;
      }

      setMessageWithAudio('games.moreOrLessMarket.instructions.dragBadge', 'neutral');
    },
    [
      checkpointPaused,
      evaluateSelection,
      markNonCriticalAudioReady,
      round.requiresBadge,
      selectedBadge,
      sessionComplete,
      setMessageWithAudio,
    ],
  );

  const handleBadgeChoice = useCallback(
    (badge: ComparisonKind) => {
      if (sessionComplete || checkpointPaused || !round.requiresBadge) {
        return;
      }

      markNonCriticalAudioReady();
      setSelectedBadge(badge);

      if (round.comparison === 'equal') {
        evaluateSelection(null, badge);
        return;
      }

      if (!selectedSide) {
        setMessageWithAudio('games.moreOrLessMarket.instructions.tapChoice', 'neutral');
        return;
      }

      evaluateSelection(selectedSide, badge);
    },
    [
      checkpointPaused,
      evaluateSelection,
      markNonCriticalAudioReady,
      round.comparison,
      round.requiresBadge,
      selectedSide,
      sessionComplete,
      setMessageWithAudio,
    ],
  );

  const handleBadgeDrop = useCallback(
    (badgeText: string) => {
      markNonCriticalAudioReady();

      if (badgeText !== 'more' && badgeText !== 'less' && badgeText !== 'equal') {
        setBadgeSlotRejectPulse(true);
        return;
      }
      setBadgeSlotHot(false);
      handleBadgeChoice(badgeText);
    },
    [handleBadgeChoice, markNonCriticalAudioReady],
  );

  const handleReplayPrompt = useCallback(() => {
    if (sessionComplete || checkpointPaused) {
      return;
    }

    markNonCriticalAudioReady();
    setUsedHintThisRound(true);
    setHintStep((current) => Math.max(current, 1));
    setMessageWithAudio('games.moreOrLessMarket.hints.useReplay', 'hint');

    window.setTimeout(() => {
      setMessageWithAudio(round.promptKey, 'neutral');
    }, 180);
  }, [
    checkpointPaused,
    markNonCriticalAudioReady,
    round.promptKey,
    sessionComplete,
    setMessageWithAudio,
  ]);

  const handleHint = useCallback(() => {
    if (sessionComplete || checkpointPaused) {
      return;
    }

    markNonCriticalAudioReady();
    setUsedHintThisRound(true);
    setShowCountScaffold(true);

    setHintStep((currentHintStep) => {
      const nextHintStep = Math.min(currentHintStep + 1, 3);

      if (nextHintStep === 1) {
        setMessageWithAudio('games.moreOrLessMarket.hints.countTogether', 'hint');
      } else if (nextHintStep === 2) {
        setHighlightCorrectSide(true);
        setMessageWithAudio('games.moreOrLessMarket.hints.compareOneByOne', 'hint');
      } else {
        setHighlightCorrectSide(true);
        if (round.correctSide !== 'equal') {
          setSelectedSide(round.correctSide);
        }
        if (round.requiresBadge) {
          setSelectedBadge(round.comparison === 'equal' ? 'equal' : round.comparison);
        }
        setMessageWithAudio('games.moreOrLessMarket.hints.tapToCount', 'hint');
      }

      return nextHintStep;
    });
  }, [checkpointPaused, markNonCriticalAudioReady, round, sessionComplete, setMessageWithAudio]);

  const handleRetry = useCallback(() => {
    if (sessionComplete || checkpointPaused) {
      return;
    }

    markNonCriticalAudioReady();
    setSelectedSide(null);
    setSelectedBadge(null);
    setShowCountScaffold(true);
    setUsedHintThisRound(true);
    setHintStep((current) => Math.max(current, 1));
    setMessageWithAudio('games.moreOrLessMarket.hints.gentleRetry', 'hint');
  }, [checkpointPaused, markNonCriticalAudioReady, sessionComplete, setMessageWithAudio]);

  const handleCheckpointReplay = useCallback(() => {
    if (!checkpointPaused || sessionComplete) {
      return;
    }
    setMessageWithAudio(CHECKPOINT_INSTRUCTION_KEY, 'neutral');
  }, [checkpointPaused, sessionComplete, setMessageWithAudio]);

  const revealCountOnSide = useCallback(
    (side: Side) => {
      if (round.level < 2) {
        return;
      }

      markNonCriticalAudioReady();
      setUsedHintThisRound(true);
      setShowCountScaffold(true);
      setRevealedCountBySide((current) => ({
        ...current,
        [side]: true,
      }));
      setMessageWithAudio('games.moreOrLessMarket.hints.tapToCount', 'hint');
    },
    [markNonCriticalAudioReady, round.level, setMessageWithAudio],
  );

  const handleContinueAfterCheckpoint = useCallback(() => {
    if (!pendingRoundConfig) {
      return;
    }

    setCheckpointPaused(false);
    loadRound(pendingRoundConfig);
    setPendingRoundConfig(null);
  }, [loadRound, pendingRoundConfig]);

  const messageText = t(roundMessage.key, {
    comparisonType: '> / < / =',
    accuracy: summary ? `${summary.firstAttemptAccuracy}%` : '0%',
    hintLevel: summary?.averageHintLevel ?? '0.0',
  });
  const hasRoundInteraction = selectedSide !== null || selectedBadge !== null || hintStep > 0 || mistakesThisRound > 0;

  useEffect(() => {
    let readinessTimeout: number | null = null;
    const paintFrame = window.requestAnimationFrame(() => {
      readinessTimeout = window.setTimeout(() => {
        setNonCriticalAudioReady(true);
      }, NON_CRITICAL_AUDIO_DELAY_MS);
    });

    return () => {
      window.cancelAnimationFrame(paintFrame);
      if (readinessTimeout !== null) {
        window.clearTimeout(readinessTimeout);
      }
    };
  }, []);

  useEffect(() => {
    let introTimeout: number | null = null;
    const paintFrame = window.requestAnimationFrame(() => {
      introTimeout = window.setTimeout(() => {
        setMessageWithAudio('games.moreOrLessMarket.instructions.intro', 'neutral');
      }, 320);
    });

    return () => {
      window.cancelAnimationFrame(paintFrame);
      if (introTimeout !== null) {
        window.clearTimeout(introTimeout);
      }
    };
  }, [setMessageWithAudio]);

  useEffect(() => {
    if (!checkpointPaused || sessionComplete) {
      return;
    }

    const checkpointPromptTimeout = window.setTimeout(() => {
      setMessageWithAudio(CHECKPOINT_INSTRUCTION_KEY, 'neutral');
    }, 180);

    return () => {
      window.clearTimeout(checkpointPromptTimeout);
    };
  }, [checkpointPaused, sessionComplete, setMessageWithAudio]);

  useEffect(() => {
    if (!badgeSlotAcceptPulse) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setBadgeSlotAcceptPulse(false);
    }, 260);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [badgeSlotAcceptPulse]);

  useEffect(() => {
    if (!badgeSlotRejectPulse) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setBadgeSlotRejectPulse(false);
    }, 220);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [badgeSlotRejectPulse]);

  useEffect(() => {
    if (!scorePulse) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setScorePulse(false);
    }, 340);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [scorePulse]);

  useEffect(() => {
    if (sessionComplete || checkpointPaused || !nonCriticalAudioReady || hasRoundInteraction) {
      return;
    }

    const promptTimeout = window.setTimeout(() => {
      playAudioKey(round.promptKey);
    }, 220);

    return () => {
      window.clearTimeout(promptTimeout);
    };
  }, [checkpointPaused, hasRoundInteraction, nonCriticalAudioReady, playAudioKey, round.promptKey, sessionComplete]);

  useEffect(() => {
    return () => {
      audio.stop();
    };
  }, [audio]);

  if (sessionComplete && summary) {
    return (
      <div className="more-less-market more-less-market--summary">
        <Card padding="lg" className="more-less-market__shell">
          <h2 className="more-less-market__title">{t('feedback.youDidIt')}</h2>
          <p className="more-less-market__message more-less-market__message--success" aria-live="polite">
            {t('parentDashboard.games.moreOrLessMarket.progressSummary', {
              comparisonType: '> / < / =',
              accuracy: `${summary.firstAttemptAccuracy}%`,
              hintLevel: summary.averageHintLevel,
            })}
          </p>
          <p className="more-less-market__summary-note">{t('parentDashboard.games.moreOrLessMarket.nextStep')}</p>
          <p className="more-less-market__summary-tone">{t(summary.hintToneKey)}</p>
        </Card>
        <style>{moreLessMarketStyles}</style>
      </div>
    );
  }

  if (checkpointPaused) {
    return (
      <div className="more-less-market more-less-market--checkpoint">
        <Card padding="lg" className="more-less-market__shell">
          <h2 className="more-less-market__title">{t('feedback.greatEffort')}</h2>
          <p className="more-less-market__summary-note">{t(CHECKPOINT_INSTRUCTION_KEY)}</p>
          <div className="more-less-market__checkpoint-actions">
            <Button
              variant="secondary"
              size="md"
              onClick={handleCheckpointReplay}
              aria-label={t('games.moreOrLessMarket.hints.useReplay')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              ▶
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleContinueAfterCheckpoint}
              aria-label={t('nav.next')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              ⏭
            </Button>
          </div>
        </Card>
        <style>{moreLessMarketStyles}</style>
      </div>
    );
  }

  return (
    <div className="more-less-market">
      <Card padding="lg" className="more-less-market__shell">
        <header className="more-less-market__header">
          <div className="more-less-market__heading">
            <h2 className="more-less-market__title">{t('games.moreOrLessMarket.title')}</h2>
            <p className="more-less-market__subtitle">{t('games.moreOrLessMarket.subtitle')}</p>
          </div>

          <div className="more-less-market__controls">
            <Button
              variant="secondary"
              size="md"
              onClick={handleReplayPrompt}
              aria-label={t('games.moreOrLessMarket.hints.useReplay')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              ▶
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleHint}
              aria-label={t('games.moreOrLessMarket.hints.countTogether')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              💡
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleRetry}
              aria-label={t('games.moreOrLessMarket.hints.gentleRetry')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              ↻
            </Button>
          </div>
        </header>

        <div className="more-less-market__progress" aria-label={t('games.estimatedTime', { minutes: 5 })}>
          {progressSegments.map((segment) => {
            const state =
              segment < roundConfig.roundNumber
                ? 'done'
                : segment === roundConfig.roundNumber
                  ? 'active'
                  : 'pending';

            return (
              <span
                key={`progress-${segment}`}
                className={`more-less-market__progress-dot more-less-market__progress-dot--${state}`}
                aria-hidden="true"
              />
            );
          })}
        </div>

        <div className="more-less-market__score-strip" aria-live="polite">
          <span
            className={[
              'more-less-market__score-pill',
              scorePulse ? 'more-less-market__score-pill--pulse' : '',
            ].join(' ')}
            aria-label={t('feedback.excellent')}
          >
            <span aria-hidden="true">⭐</span>
            <span>{sessionStats.firstAttemptSuccesses}</span>
          </span>
          <span className="more-less-market__score-pill" aria-label={t('nav.next')}>
            <span aria-hidden="true">🧩</span>
            <span>
              {roundConfig.roundNumber} / {TOTAL_ROUNDS}
            </span>
          </span>
        </div>

        <p className={`more-less-market__message more-less-market__message--${roundMessage.tone}`} aria-live="polite">
          {messageText}
        </p>

        <Card padding="md" className="more-less-market__prompt-card">
          <p className="more-less-market__prompt">{t(round.promptKey)}</p>
        </Card>

        <section className="more-less-market__board" dir="rtl">
          <div
            className={[
              'more-less-market__basket',
              selectedSide === 'right' ? 'more-less-market__basket--selected' : '',
              highlightCorrectSide && round.correctSide === 'right' ? 'more-less-market__basket--hint' : '',
            ].join(' ')}
            onClick={() => handleSideChoice('right')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleSideChoice('right');
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={t('games.moreOrLessMarket.instructions.tapChoiceRight')}
          >
            {round.rightIsNumberCard ? (
              <span className="more-less-market__number">{round.rightValue}</span>
            ) : (
              <div className="more-less-market__token-grid" aria-hidden="true">
                {chunkTokens(round.rightTokens).map((tokenRow, rowIndex) => (
                  <div key={`right-row-${rowIndex}`} className="more-less-market__token-row">
                    {tokenRow.map((token, tokenIndex) => (
                      <span key={`right-token-${rowIndex}-${tokenIndex}`} className="more-less-market__token">
                        {token}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {(showCountScaffold || revealedCountBySide.right) && (
              <span className="more-less-market__count-chip" aria-hidden="true">
                {round.rightValue}
              </span>
            )}

            {!round.rightIsNumberCard && (
              <button
                type="button"
                className="more-less-market__count-button"
                onClick={(event) => {
                  event.stopPropagation();
                  revealCountOnSide('right');
                }}
                aria-label={t('games.moreOrLessMarket.hints.tapToCountRight')}
              >
                🔢
              </button>
            )}
          </div>

          {round.requiresBadge && (
            <Card padding="sm" className="more-less-market__badge-zone">
              <div className="more-less-market__badge-options">
                {(['more', 'less', 'equal'] as const).map((badgeKind) => (
                  <button
                    key={`badge-${badgeKind}`}
                    type="button"
                    className={[
                      'more-less-market__badge',
                      selectedBadge === badgeKind ? 'more-less-market__badge--selected' : '',
                      draggingBadgeKind === badgeKind ? 'more-less-market__badge--dragging' : '',
                    ].join(' ')}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', badgeKind);
                      setDraggingBadgeKind(badgeKind);
                    }}
                    onDragEnd={() => {
                      setDraggingBadgeKind((current) => (current === badgeKind ? null : current));
                      setBadgeSlotHot(false);
                    }}
                    onClick={() => handleBadgeChoice(badgeKind)}
                    aria-label={t(`games.moreOrLessMarket.prompts.${badgeKind}.numbers` as const)}
                  >
                    {BADGE_SYMBOL_BY_KIND[badgeKind]}
                  </button>
                ))}
              </div>

              <div
                className={[
                  'more-less-market__badge-slot',
                  (badgeSlotHot || draggingBadgeKind !== null) ? 'more-less-market__badge-slot--hot' : '',
                  badgeSlotAcceptPulse ? 'more-less-market__badge-slot--accept' : '',
                  badgeSlotRejectPulse ? 'more-less-market__badge-slot--reject' : '',
                ].join(' ')}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setBadgeSlotHot(true);
                }}
                onDragLeave={() => {
                  setBadgeSlotHot(false);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setBadgeSlotHot(true);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDraggingBadgeKind(null);
                  const badgeText = event.dataTransfer.getData('text/plain');
                  handleBadgeDrop(badgeText);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if ((event.key === 'Enter' || event.key === ' ') && selectedBadge) {
                    event.preventDefault();
                    handleBadgeChoice(selectedBadge);
                  }
                }}
                aria-label={t('games.moreOrLessMarket.instructions.dragBadge')}
              >
                {selectedBadge ? BADGE_SYMBOL_BY_KIND[selectedBadge] : '⬇️'}
              </div>
            </Card>
          )}

          <div
            className={[
              'more-less-market__basket',
              selectedSide === 'left' ? 'more-less-market__basket--selected' : '',
              highlightCorrectSide && round.correctSide === 'left' ? 'more-less-market__basket--hint' : '',
            ].join(' ')}
            onClick={() => handleSideChoice('left')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleSideChoice('left');
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={t('games.moreOrLessMarket.instructions.tapChoiceLeft')}
          >
            {round.leftIsNumberCard ? (
              <span className="more-less-market__number">{round.leftValue}</span>
            ) : (
              <div className="more-less-market__token-grid" aria-hidden="true">
                {chunkTokens(round.leftTokens).map((tokenRow, rowIndex) => (
                  <div key={`left-row-${rowIndex}`} className="more-less-market__token-row">
                    {tokenRow.map((token, tokenIndex) => (
                      <span key={`left-token-${rowIndex}-${tokenIndex}`} className="more-less-market__token">
                        {token}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {(showCountScaffold || revealedCountBySide.left) && (
              <span className="more-less-market__count-chip" aria-hidden="true">
                {round.leftValue}
              </span>
            )}

            {!round.leftIsNumberCard && (
              <button
                type="button"
                className="more-less-market__count-button"
                onClick={(event) => {
                  event.stopPropagation();
                  revealCountOnSide('left');
                }}
                aria-label={t('games.moreOrLessMarket.hints.tapToCountLeft')}
              >
                🔢
              </button>
            )}
          </div>
        </section>

        {round.level === 3 && (
          <p className="more-less-market__helper-note">{t('games.moreOrLessMarket.instructions.dragBadge')}</p>
        )}
      </Card>

      <style>{moreLessMarketStyles}</style>
    </div>
  );
}

const moreLessMarketStyles = `
  .more-less-market {
    display: flex;
    justify-content: center;
    padding: var(--space-xl);
    background: var(--color-theme-bg);
    min-height: 100%;
  }

  .more-less-market__shell {
    width: min(1120px, 100%);
    display: grid;
    gap: var(--space-md);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 24%, white);
  }

  .more-less-market__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .more-less-market__heading {
    display: grid;
    gap: var(--space-xs);
  }

  .more-less-market__title {
    font-size: var(--font-size-2xl);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-extrabold);
  }

  .more-less-market__subtitle {
    color: var(--color-text-secondary);
    font-size: var(--font-size-md);
  }

  .more-less-market__controls {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .more-less-market__progress {
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
    gap: var(--space-2xs);
  }

  .more-less-market__progress-dot {
    height: 12px;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-star-empty) 65%, white);
  }

  .more-less-market__progress-dot--active {
    background: linear-gradient(90deg, var(--color-accent-info), var(--color-accent-success));
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent-info) 28%, transparent);
    animation: more-less-progress-breathe 1.2s ease-in-out infinite;
  }

  .more-less-market__progress-dot--done {
    background: var(--color-accent-success);
  }

  .more-less-market__message {
    margin: 0;
    min-height: 40px;
    border-radius: var(--radius-lg);
    padding: var(--space-sm) var(--space-md);
    background: color-mix(in srgb, var(--color-theme-primary) 10%, white);
    color: var(--color-text-primary);
    line-height: 1.6;
    font-size: var(--font-size-md);
  }

  .more-less-market__score-strip {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .more-less-market__score-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: var(--radius-full);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 24%, transparent);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
    min-height: 48px;
    padding-inline: var(--space-sm);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .more-less-market__score-pill--pulse {
    animation: more-less-score-bump 340ms var(--motion-ease-bounce);
    box-shadow: 0 8px 16px color-mix(in srgb, var(--color-accent-success) 20%, transparent);
  }

  .more-less-market__message--hint {
    background: color-mix(in srgb, var(--color-accent-warning) 14%, white);
  }

  .more-less-market__message--success {
    background: color-mix(in srgb, var(--color-accent-success) 14%, white);
  }

  .more-less-market__prompt-card {
    border: 2px dashed color-mix(in srgb, var(--color-theme-primary) 25%, transparent);
  }

  .more-less-market__prompt {
    margin: 0;
    font-size: var(--font-size-lg);
    color: var(--color-text-primary);
    text-align: center;
  }

  .more-less-market__board {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: var(--space-sm);
    align-items: stretch;
  }

  .more-less-market__basket {
    position: relative;
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 28%, transparent);
    border-radius: var(--radius-xl);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--color-bg-primary) 94%, var(--color-theme-primary) 6%),
      color-mix(in srgb, var(--color-bg-primary) 90%, var(--color-theme-primary) 10%)
    );
    min-height: 230px;
    padding: var(--space-sm);
    display: grid;
    align-content: start;
    gap: var(--space-xs);
    cursor: pointer;
  }

  .more-less-market__basket--selected {
    border-color: var(--color-accent-info);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-info) 20%, transparent);
  }

  .more-less-market__basket--hint {
    border-color: var(--color-accent-success);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-success) 18%, transparent);
  }

  .more-less-market__token-grid {
    display: grid;
    gap: var(--space-2xs);
    justify-items: center;
    align-content: start;
  }

  .more-less-market__token-row {
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
  }

  .more-less-market__token {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-accent-warning) 16%, white);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }

  .more-less-market__number {
    margin: auto;
    font-size: clamp(2.4rem, 5vw, 4rem);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-extrabold);
    line-height: 1;
  }

  .more-less-market__count-chip {
    position: absolute;
    inset-inline-end: var(--space-xs);
    inset-block-start: var(--space-xs);
    background: var(--color-accent-info);
    color: var(--color-text-inverse);
    border-radius: var(--radius-full);
    min-width: var(--touch-min);
    min-height: var(--touch-min);
    padding-inline: var(--space-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-bold);
  }

  .more-less-market__count-button {
    position: absolute;
    inset-inline-start: var(--space-xs);
    inset-block-end: var(--space-xs);
    width: var(--touch-min);
    height: var(--touch-min);
    border-radius: var(--radius-full);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 30%, transparent);
    background: var(--color-bg-primary);
    cursor: pointer;
  }

  .more-less-market__badge-zone {
    display: grid;
    align-content: center;
    gap: var(--space-sm);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 24%, transparent);
  }

  .more-less-market__badge-options {
    display: grid;
    gap: var(--space-xs);
  }

  .more-less-market__badge {
    width: 56px;
    min-height: 56px;
    border-radius: var(--radius-lg);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 25%, transparent);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-size: 1.35rem;
    font-weight: var(--font-weight-extrabold);
    cursor: grab;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
  }

  .more-less-market__badge--selected {
    border-color: var(--color-accent-info);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-info) 20%, transparent);
  }

  .more-less-market__badge--dragging {
    transform: scale(1.06);
    box-shadow: 0 10px 18px color-mix(in srgb, var(--color-accent-info) 28%, transparent);
  }

  .more-less-market__badge-slot {
    min-height: 70px;
    min-width: 70px;
    border: 2px dashed color-mix(in srgb, var(--color-accent-warning) 55%, transparent);
    border-radius: var(--radius-xl);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    color: var(--color-text-primary);
    background: color-mix(in srgb, var(--color-accent-warning) 10%, white);
    transition:
      transform var(--transition-fast),
      border-color var(--transition-fast),
      background var(--transition-fast),
      box-shadow var(--transition-fast);
  }

  .more-less-market__badge-slot--hot {
    border-style: solid;
    border-color: var(--color-accent-primary);
    background: color-mix(in srgb, var(--color-accent-primary) 12%, white);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent-primary) 14%, transparent);
    transform: scale(1.02);
  }

  .more-less-market__badge-slot--accept {
    animation: more-less-slot-pop 260ms ease-out;
  }

  .more-less-market__badge-slot--reject {
    animation: more-less-slot-shake 220ms ease-in-out;
  }

  .more-less-market__helper-note {
    margin: 0;
    color: var(--color-text-secondary);
    text-align: center;
  }

  .more-less-market__summary-note,
  .more-less-market__summary-tone {
    margin: 0;
    color: var(--color-text-secondary);
  }

  .more-less-market__checkpoint-actions {
    display: flex;
    gap: var(--space-sm);
    justify-content: center;
    flex-wrap: wrap;
  }

  .more-less-market--summary,
  .more-less-market--checkpoint {
    align-items: center;
  }

  @keyframes more-less-progress-breathe {
    0%,
    100% {
      transform: scaleX(1);
    }
    50% {
      transform: scaleX(1.04);
    }
  }

  @keyframes more-less-slot-pop {
    0% {
      transform: scale(1);
    }
    65% {
      transform: scale(1.06);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes more-less-slot-shake {
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

  @keyframes more-less-score-bump {
    0% {
      transform: scale(1);
    }
    45% {
      transform: scale(1.08);
    }
    100% {
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .more-less-market__progress-dot--active,
    .more-less-market__badge-slot--accept,
    .more-less-market__badge-slot--reject,
    .more-less-market__score-pill--pulse {
      animation: none;
    }
  }

  @media (max-width: 900px) {
    .more-less-market__board {
      grid-template-columns: 1fr;
    }

    .more-less-market__badge-zone {
      order: 2;
      justify-items: center;
    }

    .more-less-market__badge-options {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      width: 100%;
    }

    .more-less-market__basket {
      min-height: 210px;
    }
  }
`;
