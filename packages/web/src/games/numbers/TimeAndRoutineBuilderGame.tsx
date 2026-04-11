import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameCompletionResult, GameProps, HintTrend, ParentSummaryMetrics, StableRange } from '@/games/engine';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { isRtlDirection, rtlNextGlyph, rtlReplayGlyph } from '@/lib/rtlChrome';

type LevelBand = 'level1' | 'level2' | 'level3';
type MisconceptionTag = 'before_after' | 'clock_anchor';
type MessageTone = 'neutral' | 'hint' | 'success';
type ClockAnchorKind = 'hour' | 'half_hour';

interface ClockTime {
  hour: number;
  minute: 0 | 30;
  kind: ClockAnchorKind;
}

interface RoutineEvent {
  id: string;
  labelKey: string;
  time: ClockTime;
}

interface RoutineSet {
  id: string;
  sequencePromptKey: string;
  clockPromptKey: string;
  elapsedPromptKey: string;
  events: RoutineEvent[];
}

interface RoundState {
  id: string;
  roundNumber: number;
  level: LevelBand;
  promptKey: string;
  instructionKey: string;
  orderedEvents: RoutineEvent[];
  cardPool: RoutineEvent[];
  initialSlots: Array<string | null>;
  lockedSlots: boolean[];
  missingSlotIndex: number | null;
  requiresClock: boolean;
  targetEventId: string | null;
  targetTime: ClockTime | null;
  clockChoices: ClockTime[];
  initialClock: ClockTime;
  remediationTag: MisconceptionTag | null;
}

interface RoundMessage {
  key: string;
  tone: MessageTone;
}

interface RoundOutcome {
  level: LevelBand;
  firstAttemptSequence: boolean;
  firstAttemptCombined: boolean;
  usedHint: boolean;
}

interface SessionStats {
  firstAttemptSequenceHits: number;
  firstAttemptClockHits: number;
  sequenceRounds: number;
  clockRounds: number;
  hintUsageByRound: number[];
  misconceptionCounts: Record<MisconceptionTag, number>;
  clockTypeTotals: Record<ClockAnchorKind, { hits: number; total: number }>;
}

interface FinalSummary {
  roundsCompleted: number;
  sequenceAccuracy: number;
  clockAccuracy: number;
  hintReliance: number;
  topMisconception: MisconceptionTag;
  hintTrend: HintTrend;
}

interface BuildRoundOptions {
  roundNumber: number;
  level: LevelBand;
  reducedLoad: boolean;
  reducedClockChoices: boolean;
  remediationTag: MisconceptionTag | null;
}

const TOTAL_ROUNDS = 8;
const CHECKPOINT_ROUND = 3;
const REMEDIATION_TRIGGER = 3;

const SUCCESS_ROTATION = ['feedback.success.wellDone', 'feedback.success.amazing', 'feedback.success.celebrate'] as const;

const ENCOURAGEMENT_ROTATION = [
  'feedback.encouragement.keepTrying',
  'feedback.encouragement.listenAndChoose',
  'feedback.encouragement.gentleRetry',
] as const;

const CLOCK_DRAG_SAMPLE_TIME: ClockTime = {
  hour: 12,
  minute: 0,
  kind: 'hour',
};

const DEFAULT_SESSION_STATS: SessionStats = {
  firstAttemptSequenceHits: 0,
  firstAttemptClockHits: 0,
  sequenceRounds: 0,
  clockRounds: 0,
  hintUsageByRound: [],
  misconceptionCounts: {
    before_after: 0,
    clock_anchor: 0,
  },
  clockTypeTotals: {
    hour: {
      hits: 0,
      total: 0,
    },
    half_hour: {
      hits: 0,
      total: 0,
    },
  },
};

const ROUTINE_LIBRARY: RoutineSet[] = [
  {
    id: 'morning',
    sequencePromptKey: 'games.timeAndRoutineBuilder.prompts.sequence.morning',
    clockPromptKey: 'games.timeAndRoutineBuilder.prompts.clock.morning',
    elapsedPromptKey: 'games.timeAndRoutineBuilder.prompts.elapsed.morning',
    events: [
      {
        id: 'morning-wake-up',
        labelKey: 'games.timeAndRoutineBuilder.routines.wakeUp',
        time: { hour: 7, minute: 0, kind: 'hour' },
      },
      {
        id: 'morning-breakfast',
        labelKey: 'games.timeAndRoutineBuilder.routines.breakfast',
        time: { hour: 7, minute: 30, kind: 'half_hour' },
      },
      {
        id: 'morning-brush-teeth',
        labelKey: 'games.timeAndRoutineBuilder.routines.brushTeeth',
        time: { hour: 8, minute: 0, kind: 'hour' },
      },
      {
        id: 'morning-pack-bag',
        labelKey: 'games.timeAndRoutineBuilder.routines.packBag',
        time: { hour: 8, minute: 30, kind: 'half_hour' },
      },
      {
        id: 'morning-leave-kindergarten',
        labelKey: 'games.timeAndRoutineBuilder.routines.leaveForKindergarten',
        time: { hour: 9, minute: 0, kind: 'hour' },
      },
    ],
  },
  {
    id: 'afternoon',
    sequencePromptKey: 'games.timeAndRoutineBuilder.prompts.sequence.afternoon',
    clockPromptKey: 'games.timeAndRoutineBuilder.prompts.clock.afternoon',
    elapsedPromptKey: 'games.timeAndRoutineBuilder.prompts.elapsed.afternoon',
    events: [
      {
        id: 'afternoon-snack',
        labelKey: 'games.timeAndRoutineBuilder.routines.afternoonSnack',
        time: { hour: 16, minute: 0, kind: 'hour' },
      },
      {
        id: 'afternoon-homework',
        labelKey: 'games.timeAndRoutineBuilder.routines.homework',
        time: { hour: 16, minute: 30, kind: 'half_hour' },
      },
      {
        id: 'afternoon-leave-chug',
        labelKey: 'games.timeAndRoutineBuilder.routines.leaveForClass',
        time: { hour: 17, minute: 0, kind: 'hour' },
      },
      {
        id: 'afternoon-class-start',
        labelKey: 'games.timeAndRoutineBuilder.routines.classStarts',
        time: { hour: 17, minute: 30, kind: 'half_hour' },
      },
      {
        id: 'afternoon-return-home',
        labelKey: 'games.timeAndRoutineBuilder.routines.returnHome',
        time: { hour: 18, minute: 0, kind: 'hour' },
      },
    ],
  },
  {
    id: 'evening',
    sequencePromptKey: 'games.timeAndRoutineBuilder.prompts.sequence.evening',
    clockPromptKey: 'games.timeAndRoutineBuilder.prompts.clock.evening',
    elapsedPromptKey: 'games.timeAndRoutineBuilder.prompts.elapsed.evening',
    events: [
      {
        id: 'evening-dinner',
        labelKey: 'games.timeAndRoutineBuilder.routines.dinner',
        time: { hour: 19, minute: 0, kind: 'hour' },
      },
      {
        id: 'evening-bath',
        labelKey: 'games.timeAndRoutineBuilder.routines.bath',
        time: { hour: 19, minute: 30, kind: 'half_hour' },
      },
      {
        id: 'evening-pajamas',
        labelKey: 'games.timeAndRoutineBuilder.routines.pajamas',
        time: { hour: 20, minute: 0, kind: 'hour' },
      },
      {
        id: 'evening-bedtime-story',
        labelKey: 'games.timeAndRoutineBuilder.routines.bedtimeStory',
        time: { hour: 20, minute: 30, kind: 'half_hour' },
      },
      {
        id: 'evening-sleep',
        labelKey: 'games.timeAndRoutineBuilder.routines.sleep',
        time: { hour: 21, minute: 0, kind: 'hour' },
      },
    ],
  },
];

function pickOne<T>(items: readonly T[], indexSeed: number): T {
  return items[indexSeed % items.length] as T;
}

function shuffleWithSeed<T>(items: readonly T[], seed: number): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = (seed + i * 3) % (i + 1);
    const temp = next[i];
    next[i] = next[j] as T;
    next[j] = temp as T;
  }
  return next;
}

function normalizeHour(hour: number): number {
  const candidate = hour % 12;
  return candidate === 0 ? 12 : candidate;
}

function toHalfStep(time: ClockTime): number {
  return (normalizeHour(time.hour) % 12) * 2 + (time.minute === 30 ? 1 : 0);
}

function fromHalfStep(step: number): ClockTime {
  const normalized = ((step % 24) + 24) % 24;
  const hourZeroBased = Math.floor(normalized / 2);
  const minute: 0 | 30 = normalized % 2 === 0 ? 0 : 30;

  return {
    hour: hourZeroBased === 0 ? 12 : hourZeroBased,
    minute,
    kind: minute === 0 ? 'hour' : 'half_hour',
  };
}

function addHalfSteps(base: ClockTime, delta: number): ClockTime {
  return fromHalfStep(toHalfStep(base) + delta);
}

function sameClockTime(left: ClockTime, right: ClockTime): boolean {
  return normalizeHour(left.hour) === normalizeHour(right.hour) && left.minute === right.minute;
}

function clockTimeKey(value: ClockTime): string {
  return `${normalizeHour(value.hour)}:${value.minute}`;
}

function digitalTime(value: ClockTime): string {
  const hour = String(normalizeHour(value.hour)).padStart(2, '0');
  const minute = value.minute === 0 ? '00' : '30';
  return `${hour}:${minute}`;
}

function toPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return Math.round((numerator / denominator) * 100);
}

function toHintTrend(hintUsageByRound: number[]): HintTrend {
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

function toStableRange(score: number): StableRange {
  if (score >= 85) {
    return '1-10';
  }

  if (score >= 65) {
    return '1-5';
  }

  return '1-3';
}

function toStars(score: number): number {
  if (score >= 90) {
    return 3;
  }

  if (score >= 70) {
    return 2;
  }

  return 1;
}

function isSequenceSolved(slots: Array<string | null>, orderedEvents: RoutineEvent[]): boolean {
  return orderedEvents.every((event, index) => slots[index] === event.id);
}

function buildClockChoices(target: ClockTime, count: number, seed: number): ClockTime[] {
  if (count <= 1) {
    return [target];
  }

  const offsets = [1, -1, 2, -2, 3, -3, 4, -4];
  const seededOffsets = shuffleWithSeed(offsets, seed);
  const decoys: ClockTime[] = [];

  for (const offset of seededOffsets) {
    const candidate = addHalfSteps(target, offset);
    if (sameClockTime(candidate, target)) {
      continue;
    }

    if (decoys.some((time) => sameClockTime(time, candidate))) {
      continue;
    }

    decoys.push(candidate);
    if (decoys.length >= count - 1) {
      break;
    }
  }

  return shuffleWithSeed([target, ...decoys], seed + 11);
}

function evaluatePromotionGate(currentLevel: LevelBand, outcomes: RoundOutcome[]): LevelBand | null {
  if (currentLevel === 'level1') {
    const sample = outcomes.filter((outcome) => outcome.level === 'level1').slice(-6);
    if (sample.length < 6) {
      return null;
    }

    const firstTrySequence = toPercent(
      sample.filter((outcome) => outcome.firstAttemptSequence).length,
      sample.length,
    );

    if (firstTrySequence >= 80) {
      return 'level2';
    }

    return null;
  }

  if (currentLevel === 'level2') {
    const sample = outcomes.filter((outcome) => outcome.level === 'level2').slice(-8);
    if (sample.length < 8) {
      return null;
    }

    const firstTryCombined = toPercent(
      sample.filter((outcome) => outcome.firstAttemptCombined).length,
      sample.length,
    );
    const hintUsage = toPercent(
      sample.filter((outcome) => outcome.usedHint).length,
      sample.length,
    );

    if (firstTryCombined >= 80 && hintUsage <= 30) {
      return 'level3';
    }

    return null;
  }

  return null;
}

function resolveInitialLevel(levelConfig: unknown): LevelBand {
  if (levelConfig && typeof levelConfig === 'object' && !Array.isArray(levelConfig)) {
    const startLevel = (levelConfig as Record<string, unknown>).startLevel;
    if (startLevel === 'level1' || startLevel === 'level2' || startLevel === 'level3') {
      return startLevel;
    }
  }

  return 'level1';
}

function buildRound(options: BuildRoundOptions): RoundState {
  const { roundNumber, level, reducedLoad, reducedClockChoices, remediationTag } = options;

  const routineSet = pickOne(ROUTINE_LIBRARY, roundNumber - 1);
  const baseLength = level === 'level1' ? 3 : level === 'level2' ? 4 : 5;
  const sequenceLength = Math.max(3, reducedLoad ? baseLength - 1 : baseLength);
  const maxStartIndex = Math.max(0, routineSet.events.length - sequenceLength);
  const startIndex = maxStartIndex === 0 ? 0 : roundNumber % (maxStartIndex + 1);
  const orderedEvents = routineSet.events.slice(startIndex, startIndex + sequenceLength);

  let requiresClock = level !== 'level1';
  if (remediationTag === 'clock_anchor') {
    requiresClock = true;
  }
  if (remediationTag === 'before_after') {
    requiresClock = false;
  }

  let missingSlotIndex: number | null = null;
  let initialSlots: Array<string | null> = Array.from({ length: orderedEvents.length }, () => null);
  let lockedSlots: boolean[] = Array.from({ length: orderedEvents.length }, () => false);
  let cardPool: RoutineEvent[] = shuffleWithSeed(orderedEvents, roundNumber + sequenceLength);

  if (level === 'level3' && remediationTag !== 'before_after') {
    missingSlotIndex = Math.min(
      orderedEvents.length - 1,
      Math.max(1, (roundNumber + 1) % Math.max(2, orderedEvents.length - 1)),
    );

    initialSlots = orderedEvents.map((event, index) => (index === missingSlotIndex ? null : event.id));
    lockedSlots = orderedEvents.map((_, index) => index !== missingSlotIndex);

    const missingEvent = orderedEvents[missingSlotIndex] as RoutineEvent;
    const decoySource = ROUTINE_LIBRARY[(roundNumber + 1) % ROUTINE_LIBRARY.length] as RoutineSet;
    const decoy =
      decoySource.events.find((event) => !orderedEvents.some((ordered) => ordered.id === event.id)) ??
      decoySource.events[0]!;

    cardPool = reducedClockChoices
      ? [missingEvent]
      : shuffleWithSeed([missingEvent, decoy], roundNumber + 7);
  }

  const targetEvent = requiresClock
    ? orderedEvents[Math.floor((orderedEvents.length - 1) / 2)] ?? orderedEvents[0]
    : null;
  const targetTime = targetEvent?.time ?? null;

  const clockChoiceCount = requiresClock ? (reducedClockChoices ? 2 : 3) : 0;
  const clockChoices =
    requiresClock && targetTime
      ? buildClockChoices(targetTime, clockChoiceCount, roundNumber + orderedEvents.length)
      : [];

  const promptKey =
    remediationTag === 'before_after'
      ? 'games.timeAndRoutineBuilder.recovery.beforeAfterPrompt'
      : remediationTag === 'clock_anchor'
        ? 'games.timeAndRoutineBuilder.recovery.clockAnchorPrompt'
        : level === 'level1'
          ? routineSet.sequencePromptKey
          : level === 'level2'
            ? routineSet.clockPromptKey
            : routineSet.elapsedPromptKey;

  const instructionKey =
    roundNumber === 1
      ? 'games.timeAndRoutineBuilder.instructions.intro'
      : remediationTag === 'before_after'
        ? 'games.timeAndRoutineBuilder.instructions.timelineFirst'
        : remediationTag === 'clock_anchor'
          ? 'games.timeAndRoutineBuilder.instructions.setClock'
          : missingSlotIndex !== null
            ? 'games.timeAndRoutineBuilder.instructions.fillMissing'
            : requiresClock
              ? 'games.timeAndRoutineBuilder.instructions.sequenceAndClock'
              : 'games.timeAndRoutineBuilder.instructions.timelineFirst';

  return {
    id: `time-routine-${roundNumber}-${Math.random().toString(36).slice(2, 10)}`,
    roundNumber,
    level,
    promptKey,
    instructionKey,
    orderedEvents,
    cardPool,
    initialSlots,
    lockedSlots,
    missingSlotIndex,
    requiresClock,
    targetEventId: targetEvent?.id ?? null,
    targetTime,
    clockChoices,
    initialClock: targetTime ?? CLOCK_DRAG_SAMPLE_TIME,
    remediationTag,
  };
}

function toClockAngleDegrees(value: ClockTime): number {
  const hourComponent = normalizeHour(value.hour) % 12;
  const topAligned = hourComponent * 30 + (value.minute === 30 ? 15 : 0);
  return topAligned - 90;
}

function pointerToClockTime(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): ClockTime {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const radians = Math.atan2(clientY - centerY, clientX - centerX);
  const degrees = (radians * 180) / Math.PI;
  const clockwiseFromTop = (degrees + 90 + 360) % 360;
  const step = Math.round(clockwiseFromTop / 15) % 24;
  return fromHalfStep(step);
}

export function TimeAndRoutineBuilderGame({ level, onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir(i18n.language));

  const initialLevel = useMemo(() => resolveInitialLevel(level.configJson), [level.configJson]);
  const initialRound = useMemo(
    () =>
      buildRound({
        roundNumber: 1,
        level: initialLevel,
        reducedLoad: false,
        reducedClockChoices: false,
        remediationTag: null,
      }),
    [initialLevel],
  );

  const [round, setRound] = useState<RoundState>(initialRound);
  const [slots, setSlots] = useState<Array<string | null>>(initialRound.initialSlots);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [clockValue, setClockValue] = useState<ClockTime>(initialRound.initialClock);
  const [clockSolved, setClockSolved] = useState(false);
  const [roundAttempts, setRoundAttempts] = useState(0);
  const [usedHintThisRound, setUsedHintThisRound] = useState(false);
  const [resolvedRounds, setResolvedRounds] = useState(0);
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [checkpointShown, setCheckpointShown] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showNextAction, setShowNextAction] = useState(false);
  const [firstAttemptStars, setFirstAttemptStars] = useState(0);
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);
  const [message, setMessage] = useState<RoundMessage>({
    key: initialRound.promptKey,
    tone: 'neutral',
  });
  const [sessionStats, setSessionStats] = useState<SessionStats>(DEFAULT_SESSION_STATS);
  const [finalSummary, setFinalSummary] = useState<FinalSummary | null>(null);

  const currentLevelRef = useRef<LevelBand>(initialLevel);
  const reduceLoadNextRoundRef = useRef(false);
  const reduceClockChoicesNextRoundRef = useRef(false);
  const remediationNextRoundRef = useRef<MisconceptionTag | null>(null);
  const outcomeHistoryRef = useRef<RoundOutcome[]>([]);
  const consecutiveStruggleRoundsRef = useRef(0);
  const consecutiveFirstAttemptSuccessRef = useRef(0);
  const misconceptionTriggerRef = useRef<Record<MisconceptionTag, number>>({
    before_after: 0,
    clock_anchor: 0,
  });
  const sessionStatsRef = useRef<SessionStats>(DEFAULT_SESSION_STATS);
  const clockFaceRef = useRef<HTMLDivElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const eventById = useMemo(() => {
    const map = new Map<string, RoutineEvent>();
    for (const event of round.orderedEvents) {
      map.set(event.id, event);
    }
    for (const event of round.cardPool) {
      map.set(event.id, event);
    }
    return map;
  }, [round.cardPool, round.orderedEvents]);

  const sequenceSolved = useMemo(() => isSequenceSolved(slots, round.orderedEvents), [slots, round.orderedEvents]);
  const roundSolved = sequenceSolved && (!round.requiresClock || clockSolved);

  const playAudioKey = useCallback(
    (key: string, interrupt = true) => {
      if (!key || audioPlaybackFailed) {
        return;
      }

      const path = resolveAudioPathFromKey(key, 'common');
      const promise = interrupt ? audio.playNow(path) : audio.play(path);
      void promise.catch(() => {
        setAudioPlaybackFailed(true);
      });
    },
    [audio, audioPlaybackFailed],
  );

  const setMessageWithAudio = useCallback(
    (key: string, tone: MessageTone, interrupt = true) => {
      setMessage({ key, tone });
      playAudioKey(key, interrupt);
    },
    [playAudioKey],
  );

  const updateSessionStats = useCallback((updater: (current: SessionStats) => SessionStats): SessionStats => {
    const next = updater(sessionStatsRef.current);
    sessionStatsRef.current = next;
    setSessionStats(next);
    return next;
  }, []);

  const registerMisconception = useCallback(
    (tag: MisconceptionTag) => {
      setRoundAttempts((current) => current + 1);
      misconceptionTriggerRef.current[tag] += 1;
      if (misconceptionTriggerRef.current[tag] >= REMEDIATION_TRIGGER) {
        remediationNextRoundRef.current = tag;
        misconceptionTriggerRef.current[tag] = 0;
      }

      updateSessionStats((current) => ({
        ...current,
        misconceptionCounts: {
          ...current.misconceptionCounts,
          [tag]: current.misconceptionCounts[tag] + 1,
        },
      }));
    },
    [updateSessionStats],
  );

  const finalizeSession = useCallback(
    (roundsCompleted: number, statsSnapshot: SessionStats) => {
      const sequenceAccuracy = toPercent(statsSnapshot.firstAttemptSequenceHits, statsSnapshot.sequenceRounds);
      const clockAccuracy =
        statsSnapshot.clockRounds > 0 ? toPercent(statsSnapshot.firstAttemptClockHits, statsSnapshot.clockRounds) : sequenceAccuracy;
      const combinedAccuracy = Math.round((sequenceAccuracy + clockAccuracy) / 2);
      const hintReliance = toPercent(
        statsSnapshot.hintUsageByRound.reduce((sum, value) => sum + value, 0),
        Math.max(1, roundsCompleted),
      );

      const hintTrend = toHintTrend(statsSnapshot.hintUsageByRound);
      const topMisconception =
        statsSnapshot.misconceptionCounts.before_after >= statsSnapshot.misconceptionCounts.clock_anchor
          ? 'before_after'
          : 'clock_anchor';

      const summaryMetrics: ParentSummaryMetrics = {
        highestStableRange: toStableRange(combinedAccuracy),
        firstAttemptSuccessRate: combinedAccuracy,
        hintTrend,
        ageBand: '6-7',
        decodeAccuracy: clockAccuracy,
        listenParticipation: hintReliance,
        sequenceEvidenceScore: sequenceAccuracy,
        gatePassed: currentLevelRef.current === 'level3',
        misconceptionTrend: {
          before_after: statsSnapshot.misconceptionCounts.before_after,
          clock_anchor: statsSnapshot.misconceptionCounts.clock_anchor,
        } as ParentSummaryMetrics['misconceptionTrend'],
      };

      const completionResult: GameCompletionResult = {
        completed: true,
        score: combinedAccuracy,
        stars: toStars(combinedAccuracy),
        roundsCompleted,
        summaryMetrics,
      };

      setFinalSummary({
        roundsCompleted,
        sequenceAccuracy,
        clockAccuracy,
        hintReliance,
        topMisconception,
        hintTrend,
      });
      setSessionComplete(true);
      setShowCheckpoint(false);
      setShowNextAction(false);
      setMessageWithAudio('feedback.youDidIt', 'success');
      onComplete(completionResult);
    },
    [onComplete, setMessageWithAudio],
  );

  const loadRound = useCallback(
    (roundNumber: number) => {
      let nextLevel = currentLevelRef.current;

      if (roundNumber === 4 && nextLevel === 'level1') {
        nextLevel = 'level2';
      }

      if (roundNumber === 7 && nextLevel === 'level2') {
        nextLevel = 'level3';
      }

      currentLevelRef.current = nextLevel;

      const nextRound = buildRound({
        roundNumber,
        level: nextLevel,
        reducedLoad: reduceLoadNextRoundRef.current,
        reducedClockChoices: reduceClockChoicesNextRoundRef.current,
        remediationTag: remediationNextRoundRef.current,
      });

      reduceLoadNextRoundRef.current = false;
      reduceClockChoicesNextRoundRef.current = false;
      remediationNextRoundRef.current = null;

      setRound(nextRound);
      setSlots(nextRound.initialSlots);
      setSelectedCardId(null);
      setClockValue(nextRound.initialClock);
      setClockSolved(false);
      setRoundAttempts(0);
      setUsedHintThisRound(false);
      setShowNextAction(false);
      setMessageWithAudio(nextRound.promptKey, 'neutral');
    },
    [setMessageWithAudio],
  );

  useEffect(() => {
    currentLevelRef.current = initialLevel;
    reduceLoadNextRoundRef.current = false;
    reduceClockChoicesNextRoundRef.current = false;
    remediationNextRoundRef.current = null;
    outcomeHistoryRef.current = [];
    consecutiveStruggleRoundsRef.current = 0;
    consecutiveFirstAttemptSuccessRef.current = 0;
    misconceptionTriggerRef.current = {
      before_after: 0,
      clock_anchor: 0,
    };
    sessionStatsRef.current = DEFAULT_SESSION_STATS;

    setSessionStats(DEFAULT_SESSION_STATS);
    setResolvedRounds(0);
    setFirstAttemptStars(0);
    setShowCheckpoint(false);
    setCheckpointShown(false);
    setSessionComplete(false);
    setFinalSummary(null);
    setAudioPlaybackFailed(false);

    const firstRound = buildRound({
      roundNumber: 1,
      level: initialLevel,
      reducedLoad: false,
      reducedClockChoices: false,
      remediationTag: null,
    });

    setRound(firstRound);
    setSlots(firstRound.initialSlots);
    setSelectedCardId(null);
    setClockValue(firstRound.initialClock);
    setClockSolved(false);
    setRoundAttempts(0);
    setUsedHintThisRound(false);
    setShowNextAction(false);
    setMessageWithAudio(firstRound.promptKey, 'neutral');
  }, [initialLevel, level.id, setMessageWithAudio]);

  const resolveCurrentPromptKey = useCallback((): string => {
    if (!sequenceSolved) {
      return round.promptKey;
    }

    if (round.requiresClock && !clockSolved) {
      return 'games.timeAndRoutineBuilder.instructions.setClock';
    }

    return SUCCESS_ROTATION[resolvedRounds % SUCCESS_ROTATION.length] as string;
  }, [clockSolved, resolvedRounds, round.promptKey, round.requiresClock, sequenceSolved]);

  const handleReplayPrompt = useCallback(() => {
    setMessageWithAudio(resolveCurrentPromptKey(), message.tone === 'success' ? 'success' : 'neutral');
  }, [message.tone, resolveCurrentPromptKey, setMessageWithAudio]);

  const handleAssignCardToSlot = useCallback(
    (cardId: string, slotIndex: number) => {
      if (sessionComplete || showCheckpoint || round.lockedSlots[slotIndex]) {
        return;
      }

      const nextSlots = [...slots];
      const existingIndex = nextSlots.findIndex((value) => value === cardId);
      if (existingIndex >= 0 && !round.lockedSlots[existingIndex]) {
        nextSlots[existingIndex] = null;
      }
      nextSlots[slotIndex] = cardId;

      setSlots(nextSlots);
      setSelectedCardId(null);
      setShowNextAction(false);
      if (round.requiresClock) {
        setClockSolved(false);
      }

      const expected = round.orderedEvents[slotIndex]?.id;
      if (expected && expected !== cardId) {
        registerMisconception('before_after');
        setMessageWithAudio('games.timeAndRoutineBuilder.recovery.beforeAfter', 'hint');
        return;
      }

      const solvedNow = isSequenceSolved(nextSlots, round.orderedEvents);
      if (solvedNow) {
        if (round.requiresClock) {
          setMessageWithAudio('games.timeAndRoutineBuilder.instructions.setClock', 'neutral');
          return;
        }

        const successKey = SUCCESS_ROTATION[resolvedRounds % SUCCESS_ROTATION.length] as string;
        setMessageWithAudio(successKey, 'success');
        setShowNextAction(true);
        return;
      }

      const encouragementKey =
        ENCOURAGEMENT_ROTATION[(resolvedRounds + roundAttempts + slotIndex) % ENCOURAGEMENT_ROTATION.length] as string;
      setMessage({ key: encouragementKey, tone: 'neutral' });
    },
    [
      round,
      roundAttempts,
      registerMisconception,
      resolvedRounds,
      sessionComplete,
      setMessageWithAudio,
      showCheckpoint,
      slots,
    ],
  );

  const handleClearSlot = useCallback(
    (slotIndex: number) => {
      if (round.lockedSlots[slotIndex]) {
        return;
      }

      const next = [...slots];
      next[slotIndex] = null;
      setSlots(next);
      setShowNextAction(false);
      if (round.requiresClock) {
        setClockSolved(false);
      }
    },
    [round.lockedSlots, round.requiresClock, slots],
  );

  const handleDropOnSlot = useCallback(
    (event: DragEvent<HTMLDivElement>, slotIndex: number) => {
      event.preventDefault();
      const cardId = event.dataTransfer.getData('text/plain');
      if (!cardId) {
        return;
      }

      handleAssignCardToSlot(cardId, slotIndex);
    },
    [handleAssignCardToSlot],
  );

  const evaluateClockGuess = useCallback(
    (candidate: ClockTime) => {
      if (!round.requiresClock || !round.targetTime || !sequenceSolved) {
        return;
      }

      if (sameClockTime(candidate, round.targetTime)) {
        setClockSolved(true);
        setShowNextAction(true);
        const successKey = SUCCESS_ROTATION[(resolvedRounds + 1) % SUCCESS_ROTATION.length] as string;
        setMessageWithAudio(successKey, 'success');
        return;
      }

      setClockSolved(false);
      setShowNextAction(false);
      registerMisconception('clock_anchor');
      setMessageWithAudio('games.timeAndRoutineBuilder.recovery.clockAnchor', 'hint');
    },
    [registerMisconception, resolvedRounds, round.requiresClock, round.targetTime, sequenceSolved, setMessageWithAudio],
  );

  const updateClockFromPointer = useCallback(
    (clientX: number, clientY: number, shouldEvaluate: boolean) => {
      const element = clockFaceRef.current;
      if (!element || !round.requiresClock || !sequenceSolved) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const nextValue = pointerToClockTime(clientX, clientY, rect);
      setClockValue(nextValue);

      if (shouldEvaluate) {
        evaluateClockGuess(nextValue);
      }
    },
    [evaluateClockGuess, round.requiresClock, sequenceSolved],
  );

  const handleClockPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!round.requiresClock || !sequenceSolved) {
        return;
      }

      activePointerIdRef.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      updateClockFromPointer(event.clientX, event.clientY, false);
    },
    [round.requiresClock, sequenceSolved, updateClockFromPointer],
  );

  const handleClockPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }

      updateClockFromPointer(event.clientX, event.clientY, false);
    },
    [updateClockFromPointer],
  );

  const handleClockPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      activePointerIdRef.current = null;
      updateClockFromPointer(event.clientX, event.clientY, true);
    },
    [updateClockFromPointer],
  );

  const handleClockChoiceTap = useCallback(
    (choice: ClockTime) => {
      if (!round.requiresClock || !sequenceSolved) {
        return;
      }

      setClockValue(choice);
      evaluateClockGuess(choice);
    },
    [evaluateClockGuess, round.requiresClock, sequenceSolved],
  );

  const handleHint = useCallback(() => {
    if (sessionComplete || showCheckpoint) {
      return;
    }

    if (!usedHintThisRound) {
      setUsedHintThisRound(true);
    }

    const hintKey =
      round.remediationTag === 'before_after'
        ? 'games.timeAndRoutineBuilder.hints.checkBeforeAfter'
        : round.remediationTag === 'clock_anchor'
          ? 'games.timeAndRoutineBuilder.hints.listenClock'
          : round.requiresClock && sequenceSolved && !clockSolved
            ? round.targetTime?.kind === 'half_hour'
              ? 'games.timeAndRoutineBuilder.hints.halfHour'
              : 'games.timeAndRoutineBuilder.hints.hourHand'
            : round.missingSlotIndex !== null && slots[round.missingSlotIndex] === null
              ? 'games.timeAndRoutineBuilder.hints.placeFirst'
              : 'games.timeAndRoutineBuilder.hints.tapCard';

    setMessageWithAudio(hintKey, 'hint');
  }, [
    clockSolved,
    round.missingSlotIndex,
    round.remediationTag,
    round.requiresClock,
    round.targetTime?.kind,
    sequenceSolved,
    sessionComplete,
    setMessageWithAudio,
    showCheckpoint,
    slots,
    usedHintThisRound,
  ]);

  const handleRetryRound = useCallback(() => {
    if (sessionComplete || showCheckpoint) {
      return;
    }

    setSlots(round.initialSlots);
    setSelectedCardId(null);
    setClockValue(round.initialClock);
    setClockSolved(false);
    setShowNextAction(false);
    setUsedHintThisRound(false);
    setRoundAttempts(0);
    setMessageWithAudio('games.timeAndRoutineBuilder.instructions.tryAgain', 'hint');
  }, [round.initialClock, round.initialSlots, sessionComplete, setMessageWithAudio, showCheckpoint]);

  const completeRoundAndAdvance = useCallback(() => {
    if (!roundSolved) {
      setMessageWithAudio('games.timeAndRoutineBuilder.instructions.solveBeforeNext', 'hint');
      return;
    }

    const firstAttempt = roundAttempts === 0;

    const outcome: RoundOutcome = {
      level: round.level,
      firstAttemptSequence: firstAttempt,
      firstAttemptCombined: firstAttempt,
      usedHint: usedHintThisRound,
    };

    outcomeHistoryRef.current = [...outcomeHistoryRef.current, outcome];

    const updatedStats = updateSessionStats((current) => {
      const next: SessionStats = {
        ...current,
        firstAttemptSequenceHits: current.firstAttemptSequenceHits + (firstAttempt ? 1 : 0),
        firstAttemptClockHits:
          current.firstAttemptClockHits + (round.requiresClock && firstAttempt ? 1 : 0),
        sequenceRounds: current.sequenceRounds + 1,
        clockRounds: current.clockRounds + (round.requiresClock ? 1 : 0),
        hintUsageByRound: [...current.hintUsageByRound, usedHintThisRound ? 1 : 0],
        misconceptionCounts: {
          ...current.misconceptionCounts,
        },
        clockTypeTotals: {
          hour: {
            ...current.clockTypeTotals.hour,
          },
          half_hour: {
            ...current.clockTypeTotals.half_hour,
          },
        },
      };

      if (round.requiresClock && round.targetTime) {
        const key = round.targetTime.kind;
        next.clockTypeTotals[key].total += 1;
        next.clockTypeTotals[key].hits += 1;
      }

      return next;
    });

    if (firstAttempt) {
      setFirstAttemptStars((current) => current + 1);
      consecutiveFirstAttemptSuccessRef.current += 1;
      consecutiveStruggleRoundsRef.current = 0;
    } else {
      consecutiveFirstAttemptSuccessRef.current = 0;
      consecutiveStruggleRoundsRef.current += 1;
    }

    if (consecutiveStruggleRoundsRef.current >= 2) {
      reduceLoadNextRoundRef.current = true;
      reduceClockChoicesNextRoundRef.current = true;
      consecutiveStruggleRoundsRef.current = 0;
    }

    const promotedByGate = evaluatePromotionGate(currentLevelRef.current, outcomeHistoryRef.current);
    if (promotedByGate) {
      currentLevelRef.current = promotedByGate;
    }

    if (consecutiveFirstAttemptSuccessRef.current >= 3) {
      if (currentLevelRef.current === 'level1') {
        currentLevelRef.current = 'level2';
      } else if (currentLevelRef.current === 'level2') {
        currentLevelRef.current = 'level3';
      }
      consecutiveFirstAttemptSuccessRef.current = 0;
    }

    const nextResolved = resolvedRounds + 1;
    setResolvedRounds(nextResolved);

    if (!checkpointShown && nextResolved === CHECKPOINT_ROUND) {
      setCheckpointShown(true);
      setShowCheckpoint(true);
      setShowNextAction(false);
      setMessageWithAudio('games.timeAndRoutineBuilder.instructions.checkpoint', 'neutral');
      return;
    }

    if (nextResolved >= TOTAL_ROUNDS) {
      finalizeSession(nextResolved, updatedStats);
      return;
    }

    loadRound(nextResolved + 1);
  }, [
    checkpointShown,
    finalizeSession,
    loadRound,
    resolvedRounds,
    round.level,
    round.requiresClock,
    round.targetTime,
    roundAttempts,
    roundSolved,
    setMessageWithAudio,
    updateSessionStats,
    usedHintThisRound,
  ]);

  const handleCheckpointContinue = useCallback(() => {
    setShowCheckpoint(false);
    loadRound(resolvedRounds + 1);
  }, [loadRound, resolvedRounds]);

  const handleCheckpointFinish = useCallback(() => {
    finalizeSession(resolvedRounds, sessionStatsRef.current);
  }, [finalizeSession, resolvedRounds]);

  const availableCards = useMemo(
    () =>
      round.cardPool.filter((event) => {
        const isAssigned = slots.includes(event.id);
        return !isAssigned;
      }),
    [round.cardPool, slots],
  );

  const targetEvent = round.targetEventId ? eventById.get(round.targetEventId) ?? null : null;

  if (sessionComplete && finalSummary) {
    return (
      <div className="time-routine time-routine--summary">
        <Card padding="lg" className="time-routine__shell">
          <h2 className="time-routine__title">{t('feedback.youDidIt')}</h2>
          <div className="time-routine__summary-celebration">
            <SuccessCelebration />
          </div>
          <p className="time-routine__message time-routine__message--success" aria-live="polite">
            {t('parentDashboard.games.timeAndRoutineBuilder.progressSummary', {
              sequenceAccuracy: `${finalSummary.sequenceAccuracy}%`,
              clockAccuracy: `${finalSummary.clockAccuracy}%`,
              hintReliance: `${finalSummary.hintReliance}%`,
              topMisconception: t(`games.timeAndRoutineBuilder.misconceptions.${finalSummary.topMisconception}` as any),
            })}
          </p>
          <p className="time-routine__summary-note">
            {t('parentDashboard.games.timeAndRoutineBuilder.nextStep')}
          </p>
          <p className="time-routine__summary-tone">
            {finalSummary.hintTrend === 'improving'
              ? t('feedback.excellent')
              : finalSummary.hintTrend === 'steady'
                ? t('feedback.keepGoing')
                : t('feedback.greatEffort')}
          </p>
          <p className="time-routine__summary-note">
            {t('games.timeAndRoutineBuilder.instructions.roundSummary', {
              done: finalSummary.roundsCompleted,
              total: TOTAL_ROUNDS,
            })}
          </p>
        </Card>
        <style>{timeRoutineStyles}</style>
      </div>
    );
  }

  if (showCheckpoint) {
    return (
      <div className="time-routine time-routine--checkpoint">
        <Card padding="lg" className="time-routine__shell">
          <h2 className="time-routine__title">{t('games.timeAndRoutineBuilder.instructions.checkpoint')}</h2>
          <p className="time-routine__summary-note">{t('games.timeAndRoutineBuilder.instructions.roundSummary', { done: resolvedRounds, total: TOTAL_ROUNDS })}</p>
          <div className="time-routine__checkpoint-actions" role="group" aria-label={t('games.timeAndRoutineBuilder.instructions.checkpoint')}>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleCheckpointFinish}
              aria-label={t('games.timeAndRoutineBuilder.controls.finish')}
              style={{ minWidth: 'var(--touch-min)', minHeight: 'var(--touch-min)' }}
            >
              ⏹
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleCheckpointContinue}
              aria-label={t('games.timeAndRoutineBuilder.controls.continue')}
              style={{ minWidth: 'var(--touch-min)', minHeight: 'var(--touch-min)' }}
            >
              {rtlNextGlyph(isRtl)}
            </Button>
          </div>
        </Card>
        <style>{timeRoutineStyles}</style>
      </div>
    );
  }

  return (
    <div className="time-routine">
      <Card padding="lg" className="time-routine__shell">
        <header className="time-routine__header">
          <div className="time-routine__heading">
            <h2 className="time-routine__title">{t('games.timeAndRoutineBuilder.title')}</h2>
            <p className="time-routine__subtitle">{t('games.timeAndRoutineBuilder.subtitle')}</p>
          </div>

          <div className="time-routine__meta" aria-live="polite">
            <span className="time-routine__pill">{t(`games.timeAndRoutineBuilder.levelLabel.${round.level}` as any)}</span>
            <span className="time-routine__pill">⭐ {firstAttemptStars}</span>
            <span className="time-routine__pill">{t('games.timeAndRoutineBuilder.instructions.roundSummary', { done: resolvedRounds, total: TOTAL_ROUNDS })}</span>
          </div>
        </header>

        <div className="time-routine__progress" aria-label={t('games.estimatedTime', { minutes: 7 })}>
          {Array.from({ length: TOTAL_ROUNDS }, (_, index) => {
            const segment = index + 1;
            const state = segment <= resolvedRounds ? 'done' : segment === resolvedRounds + 1 ? 'active' : 'idle';
            return <span key={`time-progress-${segment}`} className={`time-routine__dot time-routine__dot--${state}`} aria-hidden="true" />;
          })}
        </div>

        <div className="time-routine__instruction-row">
          <p className={`time-routine__message time-routine__message--${message.tone}`} aria-live="polite">
            {t(message.key as any)}
          </p>
          <Button
            variant="secondary"
            size="md"
            onClick={handleReplayPrompt}
            aria-label={t('games.timeAndRoutineBuilder.controls.replay')}
            style={{ minWidth: 'var(--touch-min)', minHeight: 'var(--touch-min)' }}
          >
            {rtlReplayGlyph(isRtl)}
          </Button>
        </div>

        {audioPlaybackFailed ? (
          <p className="time-routine__audio-fallback" aria-live="polite">
            🔇 {t('games.timeAndRoutineBuilder.instructions.timelineFirst')}
          </p>
        ) : null}

        <Card padding="md" className="time-routine__prompt-card">
          <div className="time-routine__prompt-head">
            <MascotIllustration variant="hint" size={48} />
            <p className="time-routine__prompt">{t(round.promptKey as any)}</p>
          </div>
        </Card>

        <section className="time-routine__board" dir="rtl" aria-label={t('games.timeAndRoutineBuilder.instructions.timelineFirst')}>
          <Card padding="md" className="time-routine__bank-card">
            <p className="time-routine__section-title">{t('games.timeAndRoutineBuilder.instructions.tapCard')}</p>
            <div className="time-routine__card-bank" role="list">
              {availableCards.map((event) => {
                const isSelected = selectedCardId === event.id;
                return (
                  <button
                    key={event.id}
                    type="button"
                    className={`time-routine__routine-card ${isSelected ? 'time-routine__routine-card--selected' : ''}`}
                    draggable
                    onDragStart={(dragEvent) => {
                      dragEvent.dataTransfer.setData('text/plain', event.id);
                      setSelectedCardId(event.id);
                    }}
                    onDragEnd={() => setSelectedCardId(null)}
                    onClick={() => {
                      setSelectedCardId((current) => (current === event.id ? null : event.id));
                      playAudioKey(event.labelKey);
                    }}
                    aria-label={t(event.labelKey as any)}
                  >
                    <span>{t(event.labelKey as any)}</span>
                    <span aria-hidden="true" className="time-routine__card-audio-chip">
                      {rtlReplayGlyph(isRtl)}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card padding="md" className="time-routine__timeline-card-wrap">
            <p className="time-routine__section-title">{t('games.timeAndRoutineBuilder.instructions.timelineFirst')}</p>
            <div className="time-routine__timeline" dir="rtl">
              {round.orderedEvents.map((event, index) => {
                const assignedId = slots[index];
                const assignedEvent = assignedId ? eventById.get(assignedId) : null;
                const isLocked = round.lockedSlots[index];
                const isCorrect = assignedId === event.id;
                const isMissing = round.missingSlotIndex === index;

                return (
                  <div
                    key={`timeline-slot-${event.id}`}
                    className={[
                      'time-routine__slot',
                      assignedId ? 'time-routine__slot--filled' : '',
                      isLocked ? 'time-routine__slot--locked' : '',
                      assignedId && !isCorrect ? 'time-routine__slot--mismatch' : '',
                    ].join(' ')}
                    onDragOver={(dragEvent) => dragEvent.preventDefault()}
                    onDrop={(dragEvent) => handleDropOnSlot(dragEvent, index)}
                    onClick={() => {
                      if (selectedCardId) {
                        handleAssignCardToSlot(selectedCardId, index);
                        return;
                      }

                      if (assignedEvent) {
                        playAudioKey(assignedEvent.labelKey);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(keyboardEvent) => {
                      if ((keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') && selectedCardId) {
                        keyboardEvent.preventDefault();
                        handleAssignCardToSlot(selectedCardId, index);
                      }
                    }}
                    aria-label={t('games.timeAndRoutineBuilder.timeline.slotLabel', { index: index + 1 })}
                  >
                    <span className="time-routine__slot-index">{index + 1}</span>
                    {assignedEvent ? (
                      <button
                        type="button"
                        className="time-routine__timeline-event"
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          playAudioKey(assignedEvent.labelKey);
                        }}
                        aria-label={t(assignedEvent.labelKey as any)}
                      >
                        {t(assignedEvent.labelKey as any)}
                      </button>
                    ) : (
                      <span className="time-routine__slot-empty">
                        {isMissing
                          ? t('games.timeAndRoutineBuilder.timeline.missingCard')
                          : t('games.timeAndRoutineBuilder.timeline.empty')}
                      </span>
                    )}
                    {assignedEvent && !isLocked ? (
                      <button
                        type="button"
                        className="time-routine__slot-clear"
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          handleClearSlot(index);
                        }}
                        aria-label={t('games.timeAndRoutineBuilder.controls.clearSlot')}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        {round.requiresClock ? (
          <Card padding="md" className="time-routine__clock-card" dir="ltr">
            <div className="time-routine__clock-header">
              <p className="time-routine__section-title">{t('games.timeAndRoutineBuilder.instructions.setClock')}</p>
              <p className="time-routine__clock-target" aria-live="polite">
                {targetEvent
                  ? t('games.timeAndRoutineBuilder.clock.setLabel', {
                      routine: t(targetEvent.labelKey as any),
                    })
                  : t('games.timeAndRoutineBuilder.instructions.setClock')}
              </p>
            </div>

            <div className="time-routine__clock-layout">
              <div
                ref={clockFaceRef}
                className={`time-routine__clock-face ${sequenceSolved ? 'time-routine__clock-face--active' : ''}`}
                onPointerDown={handleClockPointerDown}
                onPointerMove={handleClockPointerMove}
                onPointerUp={handleClockPointerUp}
                onPointerCancel={handleClockPointerUp}
                role="slider"
                aria-label={t('games.timeAndRoutineBuilder.clock.currentTime', { time: digitalTime(clockValue) })}
              >
                <span className="time-routine__clock-number time-routine__clock-number--top">12</span>
                <span className="time-routine__clock-number time-routine__clock-number--right">3</span>
                <span className="time-routine__clock-number time-routine__clock-number--bottom">6</span>
                <span className="time-routine__clock-number time-routine__clock-number--left">9</span>
                <span
                  className="time-routine__clock-hand"
                  style={{
                    transform: `translate(-50%, -100%) rotate(${toClockAngleDegrees(clockValue)}deg)`,
                  }}
                  aria-hidden="true"
                />
                <span className="time-routine__clock-center" aria-hidden="true" />
              </div>

              <div className="time-routine__clock-controls">
                <p className="time-routine__clock-readout" aria-live="polite">
                  {t('games.timeAndRoutineBuilder.clock.currentTime', { time: digitalTime(clockValue) })}
                </p>
                <div className="time-routine__clock-options" role="group" aria-label={t('games.timeAndRoutineBuilder.instructions.setClock')}>
                  {round.clockChoices.map((choice) => {
                    const selected = sameClockTime(choice, clockValue);
                    return (
                      <button
                        key={clockTimeKey(choice)}
                        type="button"
                        className={`time-routine__clock-option ${selected ? 'time-routine__clock-option--selected' : ''}`}
                        onClick={() => handleClockChoiceTap(choice)}
                        aria-label={t('games.timeAndRoutineBuilder.clock.choiceLabel', {
                          time: digitalTime(choice),
                        })}
                        disabled={!sequenceSolved}
                      >
                        {digitalTime(choice)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        <div className="time-routine__controls" role="group" aria-label={t('games.timeAndRoutineBuilder.instructions.intro')}>
          <Button
            variant="secondary"
            size="md"
            onClick={handleReplayPrompt}
            aria-label={t('games.timeAndRoutineBuilder.controls.replay')}
            style={{ minHeight: 'var(--touch-min)', minWidth: 'var(--touch-min)' }}
          >
            {rtlReplayGlyph(isRtl)}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleRetryRound}
            aria-label={t('games.timeAndRoutineBuilder.controls.retry')}
            style={{ minHeight: 'var(--touch-min)', minWidth: 'var(--touch-min)' }}
          >
            ↻
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleHint}
            aria-label={t('games.timeAndRoutineBuilder.controls.hint')}
            style={{ minHeight: 'var(--touch-min)', minWidth: 'var(--touch-min)' }}
          >
            💡
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={completeRoundAndAdvance}
            aria-label={t('games.timeAndRoutineBuilder.controls.next')}
            style={{ minHeight: 'var(--touch-min)', minWidth: 'var(--touch-min)' }}
          >
            {rtlNextGlyph(isRtl)}
          </Button>
        </div>

        {showNextAction ? (
          <p className="time-routine__next-ready" aria-live="polite">
            {t('games.timeAndRoutineBuilder.instructions.readyForNext')}
          </p>
        ) : null}
      </Card>

      <style>{timeRoutineStyles}</style>
    </div>
  );
}

const timeRoutineStyles = `
  .time-routine {
    display: flex;
    justify-content: center;
  }

  .time-routine__shell {
    width: min(1120px, 100%);
    display: grid;
    gap: var(--space-md);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 22%, white);
  }

  .time-routine__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .time-routine__heading {
    display: grid;
    gap: 6px;
  }

  .time-routine__title {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-extrabold);
  }

  .time-routine__subtitle {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-md);
  }

  .time-routine__meta {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .time-routine__pill {
    min-height: var(--touch-min);
    padding-inline: var(--space-sm);
    border-radius: var(--radius-full);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 24%, transparent);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    display: inline-flex;
    align-items: center;
    font-weight: var(--font-weight-bold);
  }

  .time-routine__progress {
    display: grid;
    gap: var(--space-2xs);
    grid-template-columns: repeat(${TOTAL_ROUNDS}, minmax(0, 1fr));
  }

  .time-routine__dot {
    block-size: 11px;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-theme-primary) 18%, white);
  }

  .time-routine__dot--active {
    background: linear-gradient(90deg, var(--color-accent-info), var(--color-accent-success));
  }

  .time-routine__dot--done {
    background: var(--color-accent-success);
  }

  .time-routine__instruction-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-sm);
  }

  .time-routine__message {
    margin: 0;
    min-height: 48px;
    border-radius: var(--radius-lg);
    padding: var(--space-sm) var(--space-md);
    color: var(--color-text-primary);
    background: color-mix(in srgb, var(--color-theme-primary) 9%, white);
    line-height: 1.6;
    font-size: var(--font-size-md);
  }

  .time-routine__message--hint {
    background: color-mix(in srgb, var(--color-accent-warning) 16%, white);
  }

  .time-routine__message--success {
    background: color-mix(in srgb, var(--color-accent-success) 16%, white);
  }

  .time-routine__audio-fallback {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .time-routine__prompt-card {
    border: 2px dashed color-mix(in srgb, var(--color-theme-primary) 28%, transparent);
  }

  .time-routine__prompt-head {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: var(--space-sm);
  }

  .time-routine__prompt {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-lg);
    line-height: 1.6;
  }

  .time-routine__board {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
    gap: var(--space-sm);
  }

  .time-routine__section-title {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
  }

  .time-routine__bank-card,
  .time-routine__timeline-card-wrap,
  .time-routine__clock-card {
    display: grid;
    gap: var(--space-sm);
  }

  .time-routine__card-bank {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--space-xs);
  }

  .time-routine__routine-card {
    min-height: 62px;
    border-radius: var(--radius-lg);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 28%, transparent);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-xs);
    text-align: start;
    padding: var(--space-sm);
    cursor: grab;
    touch-action: manipulation;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .time-routine__routine-card--selected {
    border-color: var(--color-accent-info);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-info) 16%, transparent);
    transform: translateY(-1px);
  }

  .time-routine__card-audio-chip {
    inline-size: 30px;
    block-size: 30px;
    border-radius: var(--radius-full);
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 28%, transparent);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-sm);
  }

  .time-routine__timeline {
    display: flex;
    flex-direction: row;
    gap: var(--space-xs);
    direction: rtl;
  }

  .time-routine__slot {
    min-block-size: 110px;
    min-inline-size: 130px;
    border-radius: var(--radius-lg);
    border: 2px dashed color-mix(in srgb, var(--color-theme-primary) 30%, transparent);
    background: color-mix(in srgb, var(--color-bg-primary) 94%, var(--color-theme-primary) 6%);
    display: grid;
    align-content: center;
    justify-items: center;
    gap: var(--space-xs);
    position: relative;
    padding: var(--space-xs);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

  .time-routine__slot--filled {
    border-style: solid;
  }

  .time-routine__slot--locked {
    background: color-mix(in srgb, var(--color-accent-success) 8%, var(--color-bg-primary));
  }

  .time-routine__slot--mismatch {
    border-color: color-mix(in srgb, var(--color-warning) 70%, black);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-warning) 18%, transparent);
  }

  .time-routine__slot-index {
    position: absolute;
    inset-inline-start: 8px;
    inset-block-start: 6px;
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-bold);
  }

  .time-routine__timeline-event {
    min-height: 50px;
    border-radius: var(--radius-md);
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 22%, transparent);
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    padding: var(--space-xs);
    width: 100%;
    cursor: pointer;
    text-align: center;
  }

  .time-routine__slot-empty {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    text-align: center;
  }

  .time-routine__slot-clear {
    position: absolute;
    inset-inline-end: 6px;
    inset-block-start: 4px;
    inline-size: 28px;
    block-size: 28px;
    border-radius: var(--radius-full);
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 26%, transparent);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .time-routine__clock-card {
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 24%, transparent);
  }

  .time-routine__clock-header {
    display: grid;
    gap: 4px;
  }

  .time-routine__clock-target {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
  }

  .time-routine__clock-layout {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: var(--space-md);
  }

  .time-routine__clock-face {
    inline-size: min(220px, 52vw);
    block-size: min(220px, 52vw);
    border-radius: var(--radius-full);
    border: 3px solid color-mix(in srgb, var(--color-theme-primary) 32%, transparent);
    position: relative;
    background: radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--color-bg-primary) 95%, white), var(--color-bg-primary));
    touch-action: none;
    opacity: 0.65;
  }

  .time-routine__clock-face--active {
    opacity: 1;
  }

  .time-routine__clock-number {
    position: absolute;
    font-weight: var(--font-weight-extrabold);
    color: var(--color-text-primary);
  }

  .time-routine__clock-number--top {
    inset-inline-start: 50%;
    inset-block-start: 10px;
    transform: translateX(-50%);
  }

  .time-routine__clock-number--right {
    inset-inline-end: 12px;
    inset-block-start: 50%;
    transform: translateY(-50%);
  }

  .time-routine__clock-number--bottom {
    inset-inline-start: 50%;
    inset-block-end: 8px;
    transform: translateX(-50%);
  }

  .time-routine__clock-number--left {
    inset-inline-start: 12px;
    inset-block-start: 50%;
    transform: translateY(-50%);
  }

  .time-routine__clock-hand {
    position: absolute;
    inset-inline-start: 50%;
    inset-block-start: 50%;
    inline-size: 6px;
    block-size: 34%;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-accent-primary) 68%, black);
    transform-origin: 50% 100%;
    transition: transform 120ms linear;
  }

  .time-routine__clock-center {
    position: absolute;
    inset-inline-start: 50%;
    inset-block-start: 50%;
    inline-size: 14px;
    block-size: 14px;
    transform: translate(-50%, -50%);
    border-radius: var(--radius-full);
    background: var(--color-accent-primary);
  }

  .time-routine__clock-controls {
    display: grid;
    gap: var(--space-sm);
  }

  .time-routine__clock-readout {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-extrabold);
  }

  .time-routine__clock-options {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .time-routine__clock-option {
    min-height: var(--touch-min);
    min-width: 72px;
    border-radius: var(--radius-full);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 28%, transparent);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    cursor: pointer;
    font-weight: var(--font-weight-bold);
  }

  .time-routine__clock-option--selected {
    border-color: var(--color-accent-info);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-info) 20%, transparent);
  }

  .time-routine__clock-option:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .time-routine__controls {
    display: grid;
    grid-template-columns: repeat(4, minmax(60px, 1fr));
    gap: var(--space-sm);
  }

  .time-routine__next-ready {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    text-align: center;
  }

  .time-routine__checkpoint-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-sm);
  }

  .time-routine__summary-celebration {
    display: flex;
    justify-content: center;
  }

  .time-routine__summary-note,
  .time-routine__summary-tone {
    margin: 0;
    color: var(--color-text-secondary);
  }

  @media (max-width: 960px) {
    .time-routine__board {
      grid-template-columns: minmax(0, 1fr);
    }

    .time-routine__timeline {
      overflow-x: auto;
      padding-block-end: var(--space-2xs);
    }

    .time-routine__clock-layout {
      grid-template-columns: minmax(0, 1fr);
      justify-items: center;
    }

    .time-routine__clock-controls {
      justify-items: center;
      text-align: center;
    }
  }
`;
