import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameCompletionResult, GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { isRtlDirection, rtlNextGlyph, rtlReplayGlyph } from '@/lib/rtlChrome';

type WorkshopLevel = 1 | 2 | 3;
type ThemeKey = 'lego' | 'crates' | 'beads';
type PartKey = 'partA' | 'partB';
type Objective = 'primary' | 'alternate';
type MessageTone = 'neutral' | 'hint' | 'success';
type BoardFeedback = 'idle' | 'success' | 'miss';
type BoostMode = 'range' | 'unknown' | 'alternate' | null;

type InstructionKey =
  | 'games.build10Workshop.instructions.intro'
  | 'games.build10Workshop.instructions.dragOrTap'
  | 'games.build10Workshop.instructions.twoWays'
  | 'games.build10Workshop.instructions.unknownPart'
  | 'games.build10Workshop.instructions.teenBridge'
  | 'games.build10Workshop.instructions.tapReplay'
  | 'games.build10Workshop.instructions.altCue'
  | 'games.build10Workshop.instructions.trayHint';

type PromptKey =
  | 'games.build10Workshop.prompts.make10.makeTarget'
  | 'games.build10Workshop.prompts.make10.makeTen'
  | 'games.build10Workshop.prompts.make10.fillFrame'
  | 'games.build10Workshop.prompts.twoWays.buildTwoWays'
  | 'games.build10Workshop.prompts.twoWays.unknownPart'
  | 'games.build10Workshop.prompts.twoWays.alternateReminder'
  | 'games.build10Workshop.prompts.twoWays.foundAnotherWay'
  | 'games.build10Workshop.prompts.teenBridge.tenPlusOnes'
  | 'games.build10Workshop.prompts.teenBridge.twoTens'
  | 'games.build10Workshop.prompts.teenBridge.tenPlusUnknown';

type HintKey =
  | 'games.build10Workshop.hints.useTenFrame'
  | 'games.build10Workshop.hints.splitParts'
  | 'games.build10Workshop.hints.tryNeighborPair'
  | 'games.build10Workshop.hints.replayPrompt'
  | 'games.build10Workshop.hints.gentleRetry'
  | 'games.build10Workshop.hints.alternativePath';

type RecoveryKey =
  | 'games.build10Workshop.recovery.checkTogether'
  | 'games.build10Workshop.recovery.simplifyRange'
  | 'games.build10Workshop.recovery.teenBridgeSupport';

type GlobalFeedbackKey =
  | 'feedback.greatEffort'
  | 'feedback.keepGoing'
  | 'feedback.excellent'
  | 'feedback.youDidIt';

type WorkshopFeedbackKey = 'games.build10Workshop.feedback.success.wellDone';

type ParentSummaryKey =
  | 'parentDashboard.games.build10Workshop.progressSummary'
  | 'parentDashboard.games.build10Workshop.nextStep';

type StatusKey =
  | InstructionKey
  | PromptKey
  | HintKey
  | RecoveryKey
  | WorkshopFeedbackKey
  | GlobalFeedbackKey
  | ParentSummaryKey
  | 'games.build10Workshop.title'
  | 'games.build10Workshop.subtitle'
  | 'games.build10Workshop.summary.masteredUpTo10'
  | 'games.build10Workshop.summary.masteredTo20'
  | 'games.build10Workshop.summary.trend.improving'
  | 'games.build10Workshop.summary.trend.steady'
  | 'games.build10Workshop.summary.trend.needs_support'
  | 'games.build10Workshop.instructions.partA'
  | 'games.build10Workshop.instructions.partB'
  | 'games.build10Workshop.instructions.removeCube'
  | 'games.build10Workshop.instructions.modelReplay'
  | 'games.build10Workshop.instructions.trayLabel'
  | 'games.build10Workshop.instructions.material.lego'
  | 'games.build10Workshop.instructions.material.crates'
  | 'games.build10Workshop.instructions.material.beads'
  | 'games.build10Workshop.instructions.decompositionPrefix'
  | 'games.build10Workshop.instructions.plusWord'
  | 'games.build10Workshop.instructions.equalsWord'
  | 'nav.next';

interface UnknownPartSpec {
  knownPart: number;
  knownSide: PartKey;
  requiredUnknown: number;
}

interface RoundState {
  id: string;
  roundNumber: number;
  level: WorkshopLevel;
  target: number;
  theme: ThemeKey;
  instructionKey: InstructionKey;
  promptKey: PromptKey;
  alternatePromptKey: PromptKey;
  promptValues: Record<string, number>;
  requiresAlternate: boolean;
  unknownPart: UnknownPartSpec | null;
  fullSlotCues: boolean;
  primaryLock: { side: PartKey; value: number } | null;
  requiredPrimaryCanonical: string | null;
}

interface RoundMessage {
  key: StatusKey;
  tone: MessageTone;
  values?: Record<string, string | number>;
}

interface RoundOutcome {
  level: WorkshopLevel;
  target: number;
  firstAttemptSuccess: boolean;
  usedHint: boolean;
  requiredAlternate: boolean;
  alternateCompleted: boolean;
  alternateIndependent: boolean;
  unknownPartRound: boolean;
  unknownPartCorrect: boolean;
}

interface SessionSummary {
  firstAttemptAccuracy: number;
  alternateRate: number;
  unknownTrend: ParentSummaryMetrics['hintTrend'];
  hintTrend: ParentSummaryMetrics['hintTrend'];
  masteredTotalsKey: Extract<
    StatusKey,
    'games.build10Workshop.summary.masteredUpTo10' | 'games.build10Workshop.summary.masteredTo20'
  >;
  metrics: ParentSummaryMetrics;
}

interface GateResult {
  enforced: boolean;
  passed: boolean;
}

const TOTAL_ROUNDS = 8;
const CHECKPOINT_ROUND = 4;
const L1_GATE_WINDOW = 8;
const L2_GATE_WINDOW = 10;
const UNKNOWN_GATE_WINDOW = 4;
const SLOT_CAPACITY = 20;

const THEME_ROTATION: ThemeKey[] = ['lego', 'crates', 'beads'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)] as T;
}

function canonicalPair(partA: number, partB: number): string {
  const left = Math.min(partA, partB);
  const right = Math.max(partA, partB);
  return `${left}-${right}`;
}

function toStableRange(highestTarget: number): StableRange {
  if (highestTarget >= 8) {
    return '1-10';
  }

  if (highestTarget >= 4) {
    return '1-5';
  }

  return '1-3';
}

function toHintTrendFromFlags(values: boolean[]): ParentSummaryMetrics['hintTrend'] {
  if (values.length === 0) {
    return 'steady';
  }

  const midpoint = Math.ceil(values.length / 2);
  const firstHalf = values.slice(0, midpoint).filter(Boolean).length;
  const secondHalf = values.slice(midpoint).filter(Boolean).length;

  if (secondHalf < firstHalf) {
    return 'improving';
  }

  if (secondHalf === firstHalf) {
    return 'steady';
  }

  return 'needs_support';
}

function toAccuracyTrend(values: boolean[]): ParentSummaryMetrics['hintTrend'] {
  if (values.length < 2) {
    return 'steady';
  }

  const midpoint = Math.ceil(values.length / 2);
  const firstHalf = values.slice(0, midpoint);
  const secondHalf = values.slice(midpoint);

  const firstRate = firstHalf.length === 0 ? 0 : (firstHalf.filter(Boolean).length / firstHalf.length) * 100;
  const secondRate = secondHalf.length === 0 ? 0 : (secondHalf.filter(Boolean).length / secondHalf.length) * 100;

  if (secondRate > firstRate + 5) {
    return 'improving';
  }

  if (secondRate + 5 < firstRate) {
    return 'needs_support';
  }

  return 'steady';
}

function evaluateL1Gate(outcomes: RoundOutcome[]): GateResult {
  const window = outcomes.slice(-L1_GATE_WINDOW);
  if (window.length < L1_GATE_WINDOW) {
    return { enforced: false, passed: true };
  }

  const firstAttemptRate = (window.filter((round) => round.firstAttemptSuccess).length / window.length) * 100;
  const hintUsageRate = (window.filter((round) => round.usedHint).length / window.length) * 100;

  return {
    enforced: true,
    passed: firstAttemptRate >= 75 && hintUsageRate <= 35,
  };
}

function evaluateL2Gate(outcomes: RoundOutcome[]): GateResult {
  const levelTwoAndAbove = outcomes.filter((round) => round.level >= 2);
  const window = levelTwoAndAbove.slice(-L2_GATE_WINDOW);
  if (window.length < L2_GATE_WINDOW) {
    return { enforced: false, passed: true };
  }

  const firstAttemptRate = (window.filter((round) => round.firstAttemptSuccess).length / window.length) * 100;
  const independentAlternateRate = (window.filter((round) => round.alternateIndependent).length / window.length) * 100;

  return {
    enforced: true,
    passed: firstAttemptRate >= 80 && independentAlternateRate >= 70,
  };
}

function hasUnknownPartUnlocked(outcomes: RoundOutcome[]): boolean {
  const window = outcomes.slice(-UNKNOWN_GATE_WINDOW);
  if (window.length < UNKNOWN_GATE_WINDOW) {
    return false;
  }

  const firstAttemptRate = (window.filter((round) => round.firstAttemptSuccess).length / window.length) * 100;
  return firstAttemptRate >= 75;
}

function toPlannedLevel(roundNumber: number): WorkshopLevel {
  if (roundNumber <= 3) {
    return 1;
  }

  if (roundNumber <= 6) {
    return 2;
  }

  return 3;
}

function chooseBoostMode(level: WorkshopLevel, unknownUnlocked: boolean): BoostMode {
  const options: BoostMode[] = ['range'];

  if (level <= 2) {
    options.push('alternate');
  }

  if (level >= 2 && unknownUnlocked) {
    options.push('unknown');
  }

  return pickRandom(options);
}

function computeAlternativePair(target: number, forbiddenCanonical: string): [number, number] {
  const candidates: Array<[number, number]> = [];

  for (let left = 0; left <= target; left += 1) {
    const right = target - left;
    const canonical = canonicalPair(left, right);
    if (canonical !== forbiddenCanonical) {
      candidates.push([left, right]);
    }
  }

  if (candidates.length === 0) {
    return [Math.max(0, target - 1), 1];
  }

  const sorted = [...candidates].sort((a, b) => {
    const balanceA = Math.abs(a[0] - a[1]);
    const balanceB = Math.abs(b[0] - b[1]);
    return balanceA - balanceB;
  });

  return sorted[0] ?? candidates[0] ?? [Math.max(0, target - 1), 1];
}

function buildRound(options: {
  roundNumber: number;
  outcomes: RoundOutcome[];
  simplify: boolean;
  boostMode: BoostMode;
}): RoundState {
  const { roundNumber, outcomes, simplify, boostMode } = options;

  const plannedLevel = toPlannedLevel(roundNumber);
  const l1Gate = evaluateL1Gate(outcomes);
  const l2Gate = evaluateL2Gate(outcomes);

  let level = plannedLevel;
  if (plannedLevel >= 2 && l1Gate.enforced && !l1Gate.passed) {
    level = 1;
  }

  if (plannedLevel === 3 && l2Gate.enforced && !l2Gate.passed) {
    level = 2;
  }

  const unknownUnlocked = hasUnknownPartUnlocked(outcomes);
  const theme = THEME_ROTATION[(roundNumber - 1) % THEME_ROTATION.length] as ThemeKey;

  const fullSlotCues = simplify || level !== plannedLevel;

  let target = 10;
  if (level === 1) {
    target = randomInt(simplify ? 4 : 4, simplify ? 7 : 10);
  } else if (level === 2) {
    target = randomInt(simplify ? 6 : 6, simplify ? 8 : 10);
  } else {
    const useTwentyBridge = roundNumber % 2 === 0;
    if (useTwentyBridge) {
      target = 20;
    } else {
      target = randomInt(simplify ? 11 : 12, simplify ? 15 : 19);
    }
  }

  if (boostMode === 'range' && !simplify) {
    if (level === 1) {
      target = randomInt(8, 10);
    } else if (level === 2) {
      target = randomInt(8, 10);
    } else {
      target = randomInt(16, 20);
    }
  }

  const requiresAlternate = level >= 2 || (boostMode === 'alternate' && level === 1);

  const useTeenBridge = level === 3;
  const useTwoTens = useTeenBridge && target === 20;

  const useUnknownPart =
    level >= 2 &&
    !useTwoTens &&
    (boostMode === 'unknown' || (unknownUnlocked && roundNumber % 2 === 0));

  let unknownPart: UnknownPartSpec | null = null;
  if (useUnknownPart) {
    const knownPart = useTeenBridge ? 10 : randomInt(1, Math.max(1, target - 2));
    const knownSide: PartKey = roundNumber % 2 === 0 ? 'partA' : 'partB';
    unknownPart = {
      knownPart,
      knownSide,
      requiredUnknown: target - knownPart,
    };
  }

  let primaryLock: { side: PartKey; value: number } | null = null;
  if (unknownPart) {
    primaryLock = {
      side: unknownPart.knownSide,
      value: unknownPart.knownPart,
    };
  } else if (useTeenBridge) {
    primaryLock = {
      side: 'partA',
      value: 10,
    };
  }

  let requiredPrimaryCanonical: string | null = null;
  if (unknownPart) {
    const left = unknownPart.knownSide === 'partA' ? unknownPart.knownPart : unknownPart.requiredUnknown;
    const right = unknownPart.knownSide === 'partA' ? unknownPart.requiredUnknown : unknownPart.knownPart;
    requiredPrimaryCanonical = canonicalPair(left, right);
  } else if (useTeenBridge) {
    requiredPrimaryCanonical = canonicalPair(10, target - 10);
  }

  const instructionKey: InstructionKey =
    roundNumber === 1
      ? 'games.build10Workshop.instructions.intro'
      : useTeenBridge
        ? 'games.build10Workshop.instructions.teenBridge'
        : unknownPart
          ? 'games.build10Workshop.instructions.unknownPart'
          : requiresAlternate
            ? 'games.build10Workshop.instructions.twoWays'
            : 'games.build10Workshop.instructions.dragOrTap';

  const promptKey: PromptKey = useTeenBridge
    ? useTwoTens
      ? 'games.build10Workshop.prompts.teenBridge.twoTens'
      : unknownPart
        ? 'games.build10Workshop.prompts.teenBridge.tenPlusUnknown'
        : 'games.build10Workshop.prompts.teenBridge.tenPlusOnes'
    : requiresAlternate
      ? unknownPart
        ? 'games.build10Workshop.prompts.twoWays.unknownPart'
        : 'games.build10Workshop.prompts.twoWays.buildTwoWays'
      : target === 10
        ? 'games.build10Workshop.prompts.make10.makeTen'
        : roundNumber % 2 === 0
          ? 'games.build10Workshop.prompts.make10.fillFrame'
          : 'games.build10Workshop.prompts.make10.makeTarget';

  const alternatePromptKey: PromptKey = useTeenBridge
    ? 'games.build10Workshop.prompts.teenBridge.tenPlusOnes'
    : 'games.build10Workshop.prompts.twoWays.alternateReminder';

  return {
    id: `build10-workshop-round-${roundNumber}-${level}-${target}`,
    roundNumber,
    level,
    target,
    theme,
    instructionKey,
    promptKey,
    alternatePromptKey,
    promptValues: {
      target,
      known: unknownPart?.knownPart ?? 0,
      unknown: unknownPart?.requiredUnknown ?? 0,
      ones: Math.max(0, target - 10),
    },
    requiresAlternate,
    unknownPart,
    fullSlotCues,
    primaryLock,
    requiredPrimaryCanonical,
  };
}

function buildSessionSummary(outcomes: RoundOutcome[]): SessionSummary {
  const totalRounds = outcomes.length;
  const firstAttemptAccuracy =
    totalRounds === 0 ? 0 : Math.round((outcomes.filter((outcome) => outcome.firstAttemptSuccess).length / totalRounds) * 100);

  const alternateRounds = outcomes.filter((outcome) => outcome.requiredAlternate);
  const alternateRate =
    alternateRounds.length === 0
      ? 0
      : Math.round((alternateRounds.filter((outcome) => outcome.alternateCompleted).length / alternateRounds.length) * 100);

  const unknownRounds = outcomes.filter((outcome) => outcome.unknownPartRound);
  const unknownTrend = toAccuracyTrend(unknownRounds.map((outcome) => outcome.unknownPartCorrect));
  const hintTrend = toHintTrendFromFlags(outcomes.map((outcome) => outcome.usedHint));

  const highestTarget = outcomes.reduce((highest, outcome) => Math.max(highest, outcome.target), 0);
  const masteredTotalsKey: SessionSummary['masteredTotalsKey'] =
    highestTarget > 10
      ? 'games.build10Workshop.summary.masteredTo20'
      : 'games.build10Workshop.summary.masteredUpTo10';

  const metrics: ParentSummaryMetrics = {
    highestStableRange: toStableRange(highestTarget),
    firstAttemptSuccessRate: firstAttemptAccuracy,
    hintTrend,
    alternateDecompositionRate: alternateRate,
    unknownPartAccuracyTrend: unknownTrend,
    masteredTotalsKey,
  };

  return {
    firstAttemptAccuracy,
    alternateRate,
    unknownTrend,
    hintTrend,
    masteredTotalsKey,
    metrics,
  };
}

function numberNameKey(value: number): string {
  const normalized = Math.max(0, Math.min(20, Math.round(value)));
  return `numbers.names.${normalized}`;
}

function themeToken(theme: ThemeKey): string {
  if (theme === 'lego') return '🧱';
  if (theme === 'crates') return '📦';
  return '🟣';
}

export function Build10WorkshopGame({ onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir(i18n.language));
  const replayIcon = rtlReplayGlyph(isRtl);
  const nextIcon = rtlNextGlyph(isRtl);

  const outcomesRef = useRef<RoundOutcome[]>([]);
  const resolvedRoundsRef = useRef(0);
  const consecutiveMissesRef = useRef(0);
  const firstAttemptStreakRef = useRef(0);
  const simplifyNextRoundRef = useRef(false);
  const boostModeNextRoundRef = useRef<BoostMode>(null);
  const boardFeedbackTimeoutRef = useRef<number | null>(null);

  const [outcomes, setOutcomes] = useState<RoundOutcome[]>([]);
  const [resolvedRounds, setResolvedRounds] = useState(0);
  const [firstAttemptStars, setFirstAttemptStars] = useState(0);
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);

  const [round, setRound] = useState<RoundState>(() =>
    buildRound({
      roundNumber: 1,
      outcomes: [],
      simplify: false,
      boostMode: null,
    }),
  );

  const [objective, setObjective] = useState<Objective>('primary');
  const [parts, setParts] = useState<Record<PartKey, number>>(() => ({
    partA: round.primaryLock?.side === 'partA' ? round.primaryLock.value : 0,
    partB: round.primaryLock?.side === 'partB' ? round.primaryLock.value : 0,
  }));
  const [activePart, setActivePart] = useState<PartKey>('partA');

  const [roundMessage, setRoundMessage] = useState<RoundMessage>({
    key: 'games.build10Workshop.instructions.intro',
    tone: 'neutral',
  });
  const [roundFlow, setRoundFlow] = useState<'prompt' | 'input' | 'feedback' | 'next'>('prompt');

  const [usedHintThisRound, setUsedHintThisRound] = useState(false);
  const [roundHadMiss, setRoundHadMiss] = useState(false);
  const [hintStep, setHintStep] = useState(0);

  const [firstPair, setFirstPair] = useState<[number, number] | null>(null);
  const [alternatePair, setAlternatePair] = useState<[number, number] | null>(null);
  const [duplicateAlternateAttempts, setDuplicateAlternateAttempts] = useState(0);
  const [suggestedAlternative, setSuggestedAlternative] = useState<[number, number] | null>(null);

  const [showNextAction, setShowNextAction] = useState(false);
  const [boardFeedback, setBoardFeedback] = useState<BoardFeedback>('idle');
  const [interactionSerial, setInteractionSerial] = useState(0);
  const [inactivityPulse, setInactivityPulse] = useState(false);

  const [checkpointPaused, setCheckpointPaused] = useState(false);
  const [checkpointShown, setCheckpointShown] = useState(false);
  const [pendingRoundNumber, setPendingRoundNumber] = useState<number | null>(null);

  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);

  const progressSegments = useMemo(() => Array.from({ length: TOTAL_ROUNDS }, (_, index) => index + 1), []);

  const totalBuilt = parts.partA + parts.partB;
  const remainingCubes = Math.max(0, round.target - totalBuilt);
  const slotCount = Math.max(10, round.target);
  const themeLabelKey = `games.build10Workshop.instructions.material.${round.theme}` as const;

  const isPartLocked = useCallback(
    (part: PartKey) => {
      return objective === 'primary' && round.primaryLock?.side === part;
    },
    [objective, round.primaryLock],
  );

  const minPartValue = useCallback(
    (part: PartKey) => {
      if (objective !== 'primary') {
        return 0;
      }

      if (round.primaryLock?.side === part) {
        return round.primaryLock.value;
      }

      return 0;
    },
    [objective, round.primaryLock],
  );

  const objectivePromptKey = objective === 'primary' ? round.promptKey : round.alternatePromptKey;

  const playStatusAudio = useCallback(
    async (key: string, mode: 'queue' | 'now' = 'queue') => {
      if (audioPlaybackFailed) {
        return;
      }

      const audioPath = resolveAudioPathFromKey(key, 'common');
      try {
        if (mode === 'now') {
          await audio.playNow(audioPath);
        } else {
          await audio.play(audioPath);
        }
      } catch {
        setAudioPlaybackFailed(true);
      }
    },
    [audio, audioPlaybackFailed],
  );

  const playDecompositionAudio = useCallback(
    async (pair: [number, number], target: number) => {
      if (audioPlaybackFailed) {
        return;
      }

      const [left, right] = pair;
      const sequence = [
        'games.build10Workshop.instructions.decompositionPrefix',
        numberNameKey(left),
        'games.build10Workshop.instructions.plusWord',
        numberNameKey(right),
        'games.build10Workshop.instructions.equalsWord',
        numberNameKey(target),
      ].map((key) => resolveAudioPathFromKey(key, 'common'));

      try {
        await audio.playSequence(sequence);
      } catch {
        setAudioPlaybackFailed(true);
      }
    },
    [audio, audioPlaybackFailed],
  );

  const setMessageWithAudio = useCallback(
    (message: RoundMessage, mode: 'queue' | 'now' = 'queue') => {
      setRoundMessage(message);
      void playStatusAudio(message.key, mode);
    },
    [playStatusAudio],
  );

  const bumpInteraction = useCallback(() => {
    setInteractionSerial((value) => value + 1);
    setInactivityPulse(false);
  }, []);

  const setBoardFeedbackPulse = useCallback((nextFeedback: Exclude<BoardFeedback, 'idle'>) => {
    if (boardFeedbackTimeoutRef.current) {
      window.clearTimeout(boardFeedbackTimeoutRef.current);
    }

    setBoardFeedback(nextFeedback);
    boardFeedbackTimeoutRef.current = window.setTimeout(() => {
      setBoardFeedback('idle');
      boardFeedbackTimeoutRef.current = null;
    }, 420);
  }, []);

  const resetPartsForObjective = useCallback(
    (nextObjective: Objective) => {
      if (nextObjective === 'primary') {
        setParts({
          partA: round.primaryLock?.side === 'partA' ? round.primaryLock.value : 0,
          partB: round.primaryLock?.side === 'partB' ? round.primaryLock.value : 0,
        });
        setActivePart(round.primaryLock?.side === 'partB' ? 'partA' : 'partA');
        return;
      }

      setParts({ partA: 0, partB: 0 });
      setActivePart('partA');
    },
    [round.primaryLock],
  );

  const loadRound = useCallback((roundNumber: number, outcomesSnapshot: RoundOutcome[]) => {
    const nextRound = buildRound({
      roundNumber,
      outcomes: outcomesSnapshot,
      simplify: simplifyNextRoundRef.current,
      boostMode: boostModeNextRoundRef.current,
    });

    simplifyNextRoundRef.current = false;
    boostModeNextRoundRef.current = null;

    setRound(nextRound);
    setObjective('primary');
    setParts({
      partA: nextRound.primaryLock?.side === 'partA' ? nextRound.primaryLock.value : 0,
      partB: nextRound.primaryLock?.side === 'partB' ? nextRound.primaryLock.value : 0,
    });

    setActivePart('partA');
    setRoundFlow('prompt');
    setUsedHintThisRound(false);
    setRoundHadMiss(false);
    setHintStep(0);
    setShowNextAction(false);
    setBoardFeedback('idle');
    setInactivityPulse(false);
    setFirstPair(null);
    setAlternatePair(null);
    setDuplicateAlternateAttempts(0);
    setSuggestedAlternative(null);
  }, []);

  const finalizeSession = useCallback(() => {
    const summary = buildSessionSummary(outcomesRef.current);
    setSessionSummary(summary);
    setSessionComplete(true);
    setRoundFlow('feedback');
    setShowNextAction(false);

    const hintPenalty = outcomesRef.current.filter((outcome) => outcome.usedHint).length * 12;
    const scoreBase = outcomesRef.current.length * 140;
    const score = Math.max(120, scoreBase - hintPenalty);
    const stars = summary.firstAttemptAccuracy >= 85 ? 3 : summary.firstAttemptAccuracy >= 65 ? 2 : 1;

    const completion: GameCompletionResult = {
      completed: true,
      score,
      stars,
      summaryMetrics: summary.metrics,
      roundsCompleted: outcomesRef.current.length,
    };

    onComplete(completion);
    setMessageWithAudio({ key: 'feedback.youDidIt', tone: 'success' }, 'now');
    void playStatusAudio('parentDashboard.games.build10Workshop.progressSummary');
  }, [onComplete, playStatusAudio, setMessageWithAudio]);

  const completeRound = useCallback(
    (primaryModel: [number, number], alternateModel: [number, number] | null) => {
      const unknownCorrect =
        round.unknownPart == null
          ? true
          : round.unknownPart.knownSide === 'partA'
            ? primaryModel[1] === round.unknownPart.requiredUnknown
            : primaryModel[0] === round.unknownPart.requiredUnknown;

      const outcome: RoundOutcome = {
        level: round.level,
        target: round.target,
        firstAttemptSuccess: !roundHadMiss,
        usedHint: usedHintThisRound,
        requiredAlternate: round.requiresAlternate,
        alternateCompleted: Boolean(alternateModel),
        alternateIndependent: Boolean(alternateModel) && !roundHadMiss && !usedHintThisRound,
        unknownPartRound: round.unknownPart != null,
        unknownPartCorrect: unknownCorrect,
      };

      const nextOutcomes = [...outcomesRef.current, outcome];
      outcomesRef.current = nextOutcomes;
      setOutcomes(nextOutcomes);

      const nextResolvedRounds = resolvedRoundsRef.current + 1;
      resolvedRoundsRef.current = nextResolvedRounds;
      setResolvedRounds(nextResolvedRounds);

      if (!roundHadMiss) {
        firstAttemptStreakRef.current += 1;
      } else {
        firstAttemptStreakRef.current = 0;
      }

      if (!usedHintThisRound && !roundHadMiss) {
        setFirstAttemptStars((value) => value + 1);
      }

      if (firstAttemptStreakRef.current >= 3) {
        boostModeNextRoundRef.current = chooseBoostMode(round.level, hasUnknownPartUnlocked(nextOutcomes));
        firstAttemptStreakRef.current = 0;
      }

      consecutiveMissesRef.current = 0;

      setBoardFeedbackPulse('success');
      setShowNextAction(true);
      setRoundFlow('next');
      setMessageWithAudio(
        {
          key: alternateModel
            ? 'games.build10Workshop.prompts.twoWays.foundAnotherWay'
            : 'games.build10Workshop.feedback.success.wellDone',
          tone: 'success',
          values: { target: round.target },
        },
        'now',
      );
    },
    [round, roundHadMiss, setBoardFeedbackPulse, setMessageWithAudio, usedHintThisRound],
  );

  const registerMiss = useCallback(
    (message: RoundMessage) => {
      setRoundHadMiss(true);
      setUsedHintThisRound(true);
      setRoundFlow('feedback');
      setBoardFeedbackPulse('miss');
      setMessageWithAudio(message, 'now');

      consecutiveMissesRef.current += 1;
      if (consecutiveMissesRef.current >= 2) {
        simplifyNextRoundRef.current = true;
      }

      window.setTimeout(() => {
        resetPartsForObjective(objective);
        setRoundFlow('input');
      }, 320);
    },
    [objective, resetPartsForObjective, setBoardFeedbackPulse, setMessageWithAudio],
  );

  const validateCurrentModel = useCallback(
    (snapshot: Record<PartKey, number>) => {
      const currentPair: [number, number] = [snapshot.partA, snapshot.partB];
      const canonical = canonicalPair(currentPair[0], currentPair[1]);

      if (objective === 'primary') {
        if (round.requiredPrimaryCanonical && canonical !== round.requiredPrimaryCanonical) {
          const recoveryKey: RecoveryKey = round.level === 3
            ? 'games.build10Workshop.recovery.teenBridgeSupport'
            : 'games.build10Workshop.recovery.checkTogether';

          registerMiss({
            key: recoveryKey,
            tone: 'hint',
            values: { target: round.target, known: round.unknownPart?.knownPart ?? 10 },
          });
          return;
        }

        setFirstPair(currentPair);
        void playDecompositionAudio(currentPair, round.target);

        if (round.requiresAlternate) {
          setObjective('alternate');
          setRoundFlow('prompt');
          setParts({ partA: 0, partB: 0 });
          setSuggestedAlternative(null);
          setDuplicateAlternateAttempts(0);
          setMessageWithAudio(
            {
              key: 'games.build10Workshop.prompts.twoWays.alternateReminder',
              tone: 'success',
              values: { target: round.target },
            },
            'now',
          );
          return;
        }

        completeRound(currentPair, null);
        return;
      }

      if (!firstPair) {
        registerMiss({ key: 'games.build10Workshop.recovery.checkTogether', tone: 'hint' });
        return;
      }

      const firstCanonical = canonicalPair(firstPair[0], firstPair[1]);
      if (canonical === firstCanonical) {
        const nextDuplicateAttempts = duplicateAlternateAttempts + 1;
        setDuplicateAlternateAttempts(nextDuplicateAttempts);

        if (nextDuplicateAttempts >= 2) {
          const alternative = computeAlternativePair(round.target, firstCanonical);
          setSuggestedAlternative(alternative);
          registerMiss({
            key: 'games.build10Workshop.hints.alternativePath',
            tone: 'hint',
            values: {
              left: alternative[0],
              right: alternative[1],
            },
          });
          return;
        }

        registerMiss({ key: 'games.build10Workshop.hints.gentleRetry', tone: 'hint' });
        return;
      }

      setAlternatePair(currentPair);
      void playDecompositionAudio(currentPair, round.target);
      completeRound(firstPair, currentPair);
    },
    [
      completeRound,
      duplicateAlternateAttempts,
      firstPair,
      objective,
      playDecompositionAudio,
      registerMiss,
      round,
      setMessageWithAudio,
    ],
  );

  const applyCubeToPart = useCallback(
    (part: PartKey) => {
      if (sessionComplete || checkpointPaused || roundFlow !== 'input') {
        return;
      }

      if (isPartLocked(part)) {
        return;
      }

      if (remainingCubes <= 0) {
        return;
      }

      bumpInteraction();
      setActivePart(part);

      setParts((current) => ({
        ...current,
        [part]: current[part] + 1,
      }));
    },
    [
      bumpInteraction,
      checkpointPaused,
      isPartLocked,
      remainingCubes,
      roundFlow,
      sessionComplete,
    ],
  );

  const removeCubeFromPart = useCallback(
    (part: PartKey) => {
      if (sessionComplete || checkpointPaused || roundFlow !== 'input') {
        return;
      }

      const minimum = minPartValue(part);
      if (parts[part] <= minimum) {
        return;
      }

      bumpInteraction();
      setActivePart(part);
      setParts((current) => ({
        ...current,
        [part]: Math.max(minimum, current[part] - 1),
      }));
    },
    [bumpInteraction, checkpointPaused, minPartValue, parts, roundFlow, sessionComplete],
  );

  const handleReplayPrompt = useCallback(() => {
    if (sessionComplete || checkpointPaused) {
      return;
    }

    bumpInteraction();
    setMessageWithAudio({ key: 'games.build10Workshop.instructions.tapReplay', tone: 'neutral' }, 'now');
    void playStatusAudio(objectivePromptKey, 'queue');
  }, [
    bumpInteraction,
    checkpointPaused,
    objectivePromptKey,
    playStatusAudio,
    sessionComplete,
    setMessageWithAudio,
  ]);

  const handleHint = useCallback(() => {
    if (sessionComplete || checkpointPaused || roundFlow === 'next') {
      return;
    }

    bumpInteraction();
    setUsedHintThisRound(true);

    setHintStep((currentStep) => {
      const nextStep = Math.min(currentStep + 1, 3);

      if (nextStep === 1) {
        setMessageWithAudio({ key: 'games.build10Workshop.hints.replayPrompt', tone: 'hint' }, 'now');
        void playStatusAudio(objectivePromptKey, 'queue');
      } else if (nextStep === 2) {
        setMessageWithAudio({ key: 'games.build10Workshop.hints.useTenFrame', tone: 'hint' }, 'now');
      } else {
        const baseCanonical = firstPair ? canonicalPair(firstPair[0], firstPair[1]) : canonicalPair(parts.partA, parts.partB);
        const suggestion = computeAlternativePair(round.target, baseCanonical);
        setSuggestedAlternative(suggestion);
        setMessageWithAudio(
          {
            key: 'games.build10Workshop.hints.alternativePath',
            tone: 'hint',
            values: { left: suggestion[0], right: suggestion[1] },
          },
          'now',
        );
      }

      return nextStep;
    });
  }, [
    bumpInteraction,
    checkpointPaused,
    firstPair,
    objectivePromptKey,
    parts,
    playStatusAudio,
    round.target,
    roundFlow,
    sessionComplete,
    setMessageWithAudio,
  ]);

  const handleRetry = useCallback(() => {
    if (sessionComplete || checkpointPaused || roundFlow === 'next') {
      return;
    }

    bumpInteraction();
    setUsedHintThisRound(true);
    setMessageWithAudio({ key: 'games.build10Workshop.hints.gentleRetry', tone: 'hint' }, 'now');
    resetPartsForObjective(objective);
    setRoundFlow('input');
  }, [
    bumpInteraction,
    checkpointPaused,
    objective,
    resetPartsForObjective,
    roundFlow,
    sessionComplete,
    setMessageWithAudio,
  ]);

  const handleNext = useCallback(() => {
    if (sessionComplete || !showNextAction) {
      return;
    }

    bumpInteraction();
    void playStatusAudio('nav.next', 'now');

    if (resolvedRoundsRef.current >= TOTAL_ROUNDS) {
      finalizeSession();
      return;
    }

    if (resolvedRoundsRef.current === CHECKPOINT_ROUND && !checkpointShown) {
      setCheckpointShown(true);
      setCheckpointPaused(true);
      setPendingRoundNumber(resolvedRoundsRef.current + 1);
      setMessageWithAudio({ key: 'feedback.greatEffort', tone: 'success' }, 'now');
      return;
    }

    loadRound(resolvedRoundsRef.current + 1, outcomesRef.current);
  }, [
    bumpInteraction,
    checkpointShown,
    finalizeSession,
    loadRound,
    playStatusAudio,
    sessionComplete,
    setMessageWithAudio,
    showNextAction,
  ]);

  const handleContinueAfterCheckpoint = useCallback(() => {
    if (!pendingRoundNumber) {
      return;
    }

    setCheckpointPaused(false);
    loadRound(pendingRoundNumber, outcomesRef.current);
    setPendingRoundNumber(null);
    void playStatusAudio('nav.next', 'now');
  }, [loadRound, pendingRoundNumber, playStatusAudio]);

  const handleCheckpointReplay = useCallback(() => {
    if (!checkpointPaused) {
      return;
    }

    bumpInteraction();
    void playStatusAudio('games.build10Workshop.instructions.twoWays');
  }, [bumpInteraction, checkpointPaused, playStatusAudio]);

  const handlePartDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, part: PartKey) => {
      event.preventDefault();
      applyCubeToPart(part);
    },
    [applyCubeToPart],
  );

  const handleTrayCubeDragStart = useCallback((event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData('text/plain', 'cube');
    event.dataTransfer.effectAllowed = 'copy';
  }, []);

  useEffect(() => {
    if (sessionComplete || checkpointPaused) {
      return;
    }

    setRoundFlow('prompt');

    const instructionKey: InstructionKey =
      objective === 'primary'
        ? round.instructionKey
        : 'games.build10Workshop.instructions.twoWays';

    setMessageWithAudio(
      {
        key: instructionKey,
        tone: objective === 'alternate' ? 'success' : 'neutral',
        values: round.promptValues,
      },
      'now',
    );

    const timeoutId = window.setTimeout(() => {
      setRoundMessage({ key: objectivePromptKey, tone: 'neutral', values: round.promptValues });
      void playStatusAudio(objectivePromptKey, 'queue');
      setRoundFlow('input');
    }, 280);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    checkpointPaused,
    objective,
    objectivePromptKey,
    playStatusAudio,
    round.id,
    round.instructionKey,
    round.promptValues,
    sessionComplete,
    setMessageWithAudio,
  ]);

  useEffect(() => {
    if (sessionComplete || checkpointPaused || roundFlow !== 'input') {
      return;
    }

    const inactivityTimeout = window.setTimeout(() => {
      setInactivityPulse(true);
      setMessageWithAudio({ key: 'games.build10Workshop.hints.replayPrompt', tone: 'hint' }, 'now');
      void playStatusAudio(objectivePromptKey, 'queue');
    }, 9000);

    return () => {
      window.clearTimeout(inactivityTimeout);
    };
  }, [
    checkpointPaused,
    interactionSerial,
    objectivePromptKey,
    playStatusAudio,
    roundFlow,
    sessionComplete,
    setMessageWithAudio,
  ]);

  useEffect(() => {
    if (sessionComplete || checkpointPaused || roundFlow !== 'input') {
      return;
    }

    if (parts.partA + parts.partB !== round.target) {
      return;
    }

    setRoundFlow('feedback');
    validateCurrentModel(parts);
  }, [
    checkpointPaused,
    parts,
    round.target,
    roundFlow,
    sessionComplete,
    validateCurrentModel,
  ]);

  useEffect(() => {
    return () => {
      if (boardFeedbackTimeoutRef.current) {
        window.clearTimeout(boardFeedbackTimeoutRef.current);
      }
      audio.stop();
    };
  }, [audio]);

  const messageText = t(roundMessage.key, roundMessage.values);

  if (sessionComplete && sessionSummary) {
    return (
      <div className="build10-workshop build10-workshop--summary">
        <Card padding="lg" className="build10-workshop__shell">
          <h2 className="build10-workshop__title">{t('feedback.youDidIt')}</h2>
          <div className="build10-workshop__celebration"><SuccessCelebration /></div>
          <p className="build10-workshop__message build10-workshop__message--success" aria-live="polite">
            {t('parentDashboard.games.build10Workshop.progressSummary', {
              masteredTotals: t(sessionSummary.masteredTotalsKey),
              alternateRate: `${sessionSummary.alternateRate}%`,
              unknownTrend: t(`games.build10Workshop.summary.trend.${sessionSummary.unknownTrend}`),
              accuracy: `${sessionSummary.firstAttemptAccuracy}%`,
            })}
          </p>
          <p className="build10-workshop__summary-note">{t('parentDashboard.games.build10Workshop.nextStep')}</p>
          <p className="build10-workshop__summary-note">
            {t(`games.build10Workshop.summary.trend.${sessionSummary.hintTrend}`)}
          </p>
        </Card>
        <style>{build10WorkshopStyles}</style>
      </div>
    );
  }

  if (checkpointPaused) {
    return (
      <div className="build10-workshop build10-workshop--checkpoint">
        <Card padding="lg" className="build10-workshop__shell">
          <h2 className="build10-workshop__title">{t('feedback.greatEffort')}</h2>
          <p className="build10-workshop__summary-note">{t('games.build10Workshop.instructions.twoWays')}</p>
          <div className="build10-workshop__checkpoint-actions">
            <Button
              variant="secondary"
              size="md"
              onClick={handleCheckpointReplay}
              aria-label={t('games.build10Workshop.instructions.tapReplay')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              {replayIcon}
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleContinueAfterCheckpoint}
              aria-label={t('nav.next')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              {nextIcon}
            </Button>
          </div>
        </Card>
        <style>{build10WorkshopStyles}</style>
      </div>
    );
  }

  return (
    <div className="build10-workshop">
      <Card padding="lg" className="build10-workshop__shell">
        <header className="build10-workshop__header">
          <div className="build10-workshop__heading">
            <h2 className="build10-workshop__title">{t('games.build10Workshop.title')}</h2>
            <p className="build10-workshop__subtitle">{t('games.build10Workshop.subtitle')}</p>
          </div>

          <div className="build10-workshop__controls">
            <Button
              variant="secondary"
              size="md"
              onClick={handleReplayPrompt}
              aria-label={t('games.build10Workshop.instructions.tapReplay')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              {replayIcon}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleHint}
              aria-label={t('games.build10Workshop.hints.useTenFrame')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              💡
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleRetry}
              aria-label={t('games.build10Workshop.hints.gentleRetry')}
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

        <div className="build10-workshop__progress" aria-label={t('games.estimatedTime', { minutes: 7 })}>
          {progressSegments.map((segment) => {
            const state =
              segment <= resolvedRounds ? 'done' : segment === resolvedRounds + 1 ? 'active' : 'pending';
            return (
              <span
                key={`build10-progress-${segment}`}
                className={[
                  'build10-workshop__progress-dot',
                  `build10-workshop__progress-dot--${state}`,
                  state === 'active' && roundFlow === 'input' ? 'build10-workshop__progress-dot--live' : '',
                ].join(' ')}
                aria-hidden="true"
              />
            );
          })}
        </div>

        <div className="build10-workshop__score-strip" aria-hidden="true">
          <span className="build10-workshop__score-pill">⭐ {firstAttemptStars}</span>
          <span className="build10-workshop__score-pill">
            🎯 {resolvedRounds}/{TOTAL_ROUNDS}
          </span>
          <span className="build10-workshop__score-pill">{themeToken(round.theme)} {t(themeLabelKey)}</span>
        </div>

        <div className="build10-workshop__message-row">
          <p className={`build10-workshop__message build10-workshop__message--${roundMessage.tone}`} aria-live="polite">
            {messageText}
          </p>
          <Button
            variant="secondary"
            size="md"
            onClick={handleReplayPrompt}
            aria-label={t('games.build10Workshop.instructions.tapReplay')}
            style={{ minWidth: 'var(--touch-min)' }}
          >
            {replayIcon}
          </Button>
        </div>

        <div className="build10-workshop__coach" aria-hidden="true">
          <MascotIllustration variant={roundMessage.tone === 'success' ? 'success' : 'hint'} size={52} />
        </div>

        {audioPlaybackFailed && (
          <p className="build10-workshop__audio-fallback" aria-live="polite">
            🔇 {t('games.build10Workshop.instructions.tapReplay')}
          </p>
        )}

        <Card padding="md" className="build10-workshop__prompt-card">
          <p className="build10-workshop__prompt">{t(objectivePromptKey, round.promptValues)}</p>
        </Card>

        <div className="build10-workshop__equation" dir="ltr" aria-live="polite">
          <span>{parts.partA}</span>
          <span>+</span>
          <span>{parts.partB}</span>
          <span>=</span>
          <span>{totalBuilt}</span>
          <span>/</span>
          <span>{round.target}</span>
        </div>

        <section
          className={[
            'build10-workshop__parts',
            boardFeedback === 'success' ? 'build10-workshop__parts--success' : '',
            boardFeedback === 'miss' ? 'build10-workshop__parts--miss' : '',
          ].join(' ')}
          aria-label={t('games.build10Workshop.instructions.dragOrTap')}
        >
          {(['partA', 'partB'] as const).map((part) => {
            const count = parts[part];
            const lockMin = minPartValue(part);
            const isLocked = isPartLocked(part);
            const isActive = activePart === part;
            const suggestedValue = suggestedAlternative ? (part === 'partA' ? suggestedAlternative[0] : suggestedAlternative[1]) : null;
            const partLabel = t(part === 'partA' ? 'games.build10Workshop.instructions.partA' : 'games.build10Workshop.instructions.partB');
            const showSlotCues = round.fullSlotCues || usedHintThisRound || objective === 'alternate';

            return (
              <div
                key={`part-${part}`}
                className={[
                  'build10-workshop__part',
                  isActive ? 'is-active' : '',
                  isLocked ? 'is-locked' : '',
                  inactivityPulse && isActive ? 'is-pulse' : '',
                ].join(' ')}
                onClick={() => applyCubeToPart(part)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handlePartDrop(event, part)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    applyCubeToPart(part);
                  }
                }}
                aria-label={`${partLabel}: ${count}`}
              >
                <div className="build10-workshop__part-header">
                  <span>{partLabel}</span>
                  <button
                    type="button"
                    className="build10-workshop__icon-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeCubeFromPart(part);
                    }}
                    aria-label={t('games.build10Workshop.instructions.removeCube', { part: partLabel })}
                    disabled={count <= lockMin || roundFlow !== 'input'}
                  >
                    −
                  </button>
                </div>

                <div className="build10-workshop__slots" dir="ltr" aria-hidden="true">
                  {Array.from({ length: SLOT_CAPACITY }, (_, index) => {
                    const filled = index < count;
                    const visibleCue = showSlotCues && index < slotCount;
                    const isGhost = suggestedValue != null && index < suggestedValue && !filled;

                    return (
                      <span
                        key={`slot-${part}-${index}`}
                        className={[
                          'build10-workshop__slot',
                          filled ? 'is-filled' : '',
                          visibleCue ? 'is-cue' : '',
                          isGhost ? 'is-ghost' : '',
                        ].join(' ')}
                      >
                        {filled ? themeToken(round.theme) : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        <Card padding="md" className="build10-workshop__tray-card">
          <div className="build10-workshop__tray-header">
            <p className="build10-workshop__tray-label">{t('games.build10Workshop.instructions.trayLabel')}</p>
            <p className="build10-workshop__tray-meta" dir="ltr">
              {remainingCubes}/{round.target}
            </p>
          </div>

          <div className="build10-workshop__tray" role="group" aria-label={t('games.build10Workshop.instructions.trayHint')}>
            {Array.from({ length: remainingCubes }, (_, index) => (
              <button
                key={`tray-cube-${round.id}-${index}`}
                type="button"
                className="build10-workshop__tray-cube"
                draggable
                onDragStart={handleTrayCubeDragStart}
                onClick={() => applyCubeToPart(activePart)}
                aria-label={t('games.build10Workshop.instructions.trayHint')}
              >
                {themeToken(round.theme)}
              </button>
            ))}
          </div>
        </Card>

        {(firstPair || alternatePair) && (
          <div className="build10-workshop__models">
            {firstPair && (
              <button
                type="button"
                className="build10-workshop__model-chip"
                onClick={() => {
                  bumpInteraction();
                  void playDecompositionAudio(firstPair, round.target);
                }}
                aria-label={t('games.build10Workshop.instructions.modelReplay')}
              >
                {t('games.build10Workshop.instructions.modelReplay')} · {firstPair[0]} + {firstPair[1]}
              </button>
            )}

            {alternatePair && (
              <button
                type="button"
                className="build10-workshop__model-chip build10-workshop__model-chip--alternate"
                onClick={() => {
                  bumpInteraction();
                  void playDecompositionAudio(alternatePair, round.target);
                }}
                aria-label={t('games.build10Workshop.instructions.modelReplay')}
              >
                {t('games.build10Workshop.instructions.modelReplay')} · {alternatePair[0]} + {alternatePair[1]}
              </button>
            )}
          </div>
        )}
      </Card>

      <style>{build10WorkshopStyles}</style>
    </div>
  );
}

const build10WorkshopStyles = `
  .build10-workshop {
    display: flex;
    justify-content: center;
    padding: var(--space-xl);
    background:
      radial-gradient(circle at 8% 12%, color-mix(in srgb, var(--color-theme-primary) 20%, transparent), transparent 44%),
      radial-gradient(circle at 92% 6%, color-mix(in srgb, var(--color-accent-success) 22%, transparent), transparent 40%),
      var(--color-theme-bg);
    min-height: 100%;
  }

  .build10-workshop__shell {
    width: min(1120px, 100%);
    display: grid;
    gap: var(--space-md);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 30%, white);
  }

  .build10-workshop__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .build10-workshop__heading {
    display: grid;
    gap: var(--space-2xs);
  }

  .build10-workshop__title {
    margin: 0;
    font-size: var(--font-size-xl);
    color: var(--color-text-primary);
  }

  .build10-workshop__subtitle {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .build10-workshop__controls {
    display: inline-flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .build10-workshop__progress {
    display: grid;
    grid-template-columns: repeat(${TOTAL_ROUNDS}, minmax(0, 1fr));
    gap: var(--space-xs);
  }

  .build10-workshop__progress-dot {
    display: block;
    block-size: 12px;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-border) 55%, white);
  }

  .build10-workshop__progress-dot--active {
    background: var(--color-theme-primary);
  }

  .build10-workshop__progress-dot--live {
    animation: build10-progress-live 1.1s ease-in-out infinite;
  }

  .build10-workshop__progress-dot--done {
    background: var(--color-accent-success);
  }

  .build10-workshop__score-strip {
    display: inline-flex;
    gap: var(--space-xs);
    align-items: center;
    justify-self: start;
    flex-wrap: wrap;
  }

  .build10-workshop__score-pill {
    min-height: var(--touch-min);
    padding-inline: var(--space-sm);
    border-radius: var(--radius-full);
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 32%, white);
    background: color-mix(in srgb, var(--color-theme-primary) 12%, white);
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
  }

  .build10-workshop__message-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-sm);
    align-items: start;
  }

  .build10-workshop__message {
    margin: 0;
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
  }

  .build10-workshop__message--neutral {
    background: color-mix(in srgb, var(--color-theme-primary) 14%, white);
    border-color: color-mix(in srgb, var(--color-theme-primary) 30%, white);
  }

  .build10-workshop__message--hint {
    background: color-mix(in srgb, var(--color-warning) 20%, white);
    border-color: color-mix(in srgb, var(--color-warning) 42%, white);
  }

  .build10-workshop__message--success {
    background: color-mix(in srgb, var(--color-accent-success) 20%, white);
    border-color: color-mix(in srgb, var(--color-accent-success) 42%, white);
  }

  .build10-workshop__coach {
    justify-self: end;
    inline-size: 68px;
    block-size: 68px;
    border-radius: var(--radius-full);
    border: 2px solid color-mix(in srgb, var(--color-accent-primary) 28%, transparent);
    background: color-mix(in srgb, var(--color-bg-card) 88%, white);
    display: grid;
    place-items: center;
    pointer-events: none;
    animation: build10-coach-float 1.5s ease-in-out infinite;
  }

  .build10-workshop__audio-fallback {
    margin: 0;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    border: 1px dashed color-mix(in srgb, var(--color-warning) 48%, white);
    background: color-mix(in srgb, var(--color-warning) 16%, white);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
  }

  .build10-workshop__prompt-card {
    border: 1px dashed color-mix(in srgb, var(--color-theme-primary) 34%, white);
    background: color-mix(in srgb, var(--color-bg-card) 74%, var(--color-theme-primary) 26%);
  }

  .build10-workshop__prompt {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
  }

  .build10-workshop__equation {
    justify-self: center;
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    min-height: var(--touch-min);
    padding-inline: var(--space-sm);
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-accent-info) 14%, white);
    border: 1px solid color-mix(in srgb, var(--color-accent-info) 30%, white);
  }

  .build10-workshop__parts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-md);
  }

  .build10-workshop__parts--success {
    animation: build10-board-success 340ms ease-out;
  }

  .build10-workshop__parts--miss {
    animation: build10-board-miss 300ms ease-in-out;
  }

  .build10-workshop__part {
    border-radius: var(--radius-lg);
    border: 1px solid color-mix(in srgb, var(--color-border) 74%, white);
    background: color-mix(in srgb, var(--color-bg-secondary) 70%, white);
    padding: var(--space-sm);
    display: grid;
    gap: var(--space-sm);
    cursor: pointer;
    min-height: 220px;
  }

  .build10-workshop__part.is-active {
    border-color: color-mix(in srgb, var(--color-theme-primary) 58%, white);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-theme-primary) 18%, transparent);
  }

  .build10-workshop__part.is-locked {
    border-style: dashed;
  }

  .build10-workshop__part.is-pulse {
    animation: build10-part-pulse 880ms ease-in-out infinite;
  }

  .build10-workshop__part-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-sm);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }

  .build10-workshop__icon-button {
    min-width: var(--touch-min);
    min-height: var(--touch-min);
    border-radius: var(--radius-md);
    border: 1px solid color-mix(in srgb, var(--color-border) 72%, white);
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    font-size: var(--font-size-lg);
    cursor: pointer;
  }

  .build10-workshop__icon-button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .build10-workshop__slots {
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap: 6px;
  }

  .build10-workshop__slot {
    min-height: 28px;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    display: grid;
    place-items: center;
    font-size: 0.88rem;
    opacity: 0;
    transition: opacity 140ms ease, transform 140ms ease;
  }

  .build10-workshop__slot.is-cue {
    opacity: 1;
    border-color: color-mix(in srgb, var(--color-border) 64%, white);
    background: color-mix(in srgb, var(--color-bg-card) 84%, white);
  }

  .build10-workshop__slot.is-filled {
    opacity: 1;
    border-color: color-mix(in srgb, var(--color-theme-primary) 46%, white);
    background: color-mix(in srgb, var(--color-theme-primary) 20%, white);
    transform: translateY(-1px);
  }

  .build10-workshop__slot.is-ghost {
    border-color: color-mix(in srgb, var(--color-warning) 76%, white);
    background: color-mix(in srgb, var(--color-warning) 20%, white);
  }

  .build10-workshop__tray-card {
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 22%, white);
  }

  .build10-workshop__tray-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
  }

  .build10-workshop__tray-label,
  .build10-workshop__tray-meta {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }

  .build10-workshop__tray {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    justify-content: flex-start;
  }

  .build10-workshop__tray-cube {
    min-width: var(--touch-min);
    min-height: var(--touch-min);
    border-radius: var(--radius-md);
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 34%, white);
    background: color-mix(in srgb, var(--color-theme-primary) 12%, white);
    color: var(--color-text-primary);
    cursor: grab;
    font-size: 1rem;
  }

  .build10-workshop__tray-cube:active {
    cursor: grabbing;
  }

  .build10-workshop__models {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .build10-workshop__model-chip {
    min-height: var(--touch-min);
    padding-inline: var(--space-sm);
    border-radius: var(--radius-full);
    border: 1px solid color-mix(in srgb, var(--color-accent-info) 34%, white);
    background: color-mix(in srgb, var(--color-accent-info) 14%, white);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    cursor: pointer;
  }

  .build10-workshop__model-chip--alternate {
    border-color: color-mix(in srgb, var(--color-accent-success) 38%, white);
    background: color-mix(in srgb, var(--color-accent-success) 16%, white);
  }

  .build10-workshop--summary,
  .build10-workshop--checkpoint {
    align-items: center;
  }

  .build10-workshop__summary-note {
    margin: 0;
    color: var(--color-text-secondary);
  }

  .build10-workshop__checkpoint-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--space-sm);
  }

  .build10-workshop__celebration {
    display: flex;
    justify-content: center;
  }

  @keyframes build10-progress-live {
    0% { transform: scale(1); }
    50% { transform: scale(1.18); }
    100% { transform: scale(1); }
  }

  @keyframes build10-coach-float {
    0% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
    100% { transform: translateY(0); }
  }

  @keyframes build10-board-success {
    0% { transform: scale(1); }
    40% { transform: scale(1.012); }
    100% { transform: scale(1); }
  }

  @keyframes build10-board-miss {
    0% { transform: translateX(0); }
    25% { transform: translateX(6px); }
    50% { transform: translateX(-6px); }
    75% { transform: translateX(3px); }
    100% { transform: translateX(0); }
  }

  @keyframes build10-part-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }

  @media (max-width: 920px) {
    .build10-workshop {
      padding: var(--space-md);
    }

    .build10-workshop__message-row {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .build10-workshop__coach,
    .build10-workshop__progress-dot--live,
    .build10-workshop__parts--success,
    .build10-workshop__parts--miss,
    .build10-workshop__part.is-pulse {
      animation: none !important;
    }
  }
`;
