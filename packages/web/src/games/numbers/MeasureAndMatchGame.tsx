import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import { SuccessCelebration } from '@/components/motion';
import type { GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { resolveGameConcurrentChoiceLimit } from '@/lib/concurrentChoiceLimit';
import { isRtlDirection, rtlReplayGlyph } from '@/lib/rtlChrome';

type Domain = 'length' | 'weight' | 'volume';
type Goal = 'max' | 'min';
type LevelId = 1 | 2 | 3;
type FeedbackTone = 'neutral' | 'hint' | 'success';
type StationFeedback = 'idle' | 'success' | 'miss';
type ConfusionTag = 'perceptual-guess' | 'term-mixup' | 'tool-ignore';
type BoostMode = 'none' | 'similarity' | 'context';
type StatusKey = string;

interface CandidateTemplate {
  id: string;
  emoji: string;
  labelKey: string;
}

interface CandidateState extends CandidateTemplate {
  value: number;
}

interface RoundState {
  id: string;
  roundNumber: number;
  level: LevelId;
  domain: Domain;
  goal: Goal;
  contextKey: StatusKey;
  instructionKey: StatusKey;
  promptKey: StatusKey;
  candidates: CandidateState[];
  correctId: string;
  targetValue: number;
  nearDifference: boolean;
}

interface RoundConfig {
  roundNumber: number;
  level: LevelId;
  choiceLimit: number;
  nearDifference: boolean;
  contextComplexity: boolean;
}

interface RoundMessage {
  key: StatusKey;
  tone: FeedbackTone;
}

interface DomainStats {
  rounds: number;
  firstAttemptHits: number;
}

interface SessionStats {
  resolvedRounds: number;
  firstAttemptHits: number;
  hintUsageByRound: number[];
  domainStats: Record<Domain, DomainStats>;
  confusionCounts: Record<ConfusionTag, number>;
}

interface RoundOutcome {
  level: LevelId;
  firstAttempt: boolean;
  hintUsed: boolean;
}

interface SessionSummary {
  firstAttemptAccuracy: number;
  hintTrend: ParentSummaryMetrics['hintTrend'];
  topConfusion: ConfusionTag;
  strongestDomain: Domain;
  nextFocusDomain: Domain;
  accuracyByDomain: Record<Domain, number>;
}

const TOTAL_ROUNDS = 9;
const BREAK_AFTER_ROUND = 4;
const AUTO_ADVANCE_MS = 640;

const DOMAIN_ORDER: Domain[] = ['length', 'weight', 'volume'];

const DOMAIN_OBJECTS: Record<Domain, CandidateTemplate[]> = {
  length: [
    { id: 'pencil', emoji: '✏️', labelKey: 'games.measureAndMatch.objects.length.pencil' },
    { id: 'ribbon', emoji: '🎀', labelKey: 'games.measureAndMatch.objects.length.ribbon' },
    { id: 'rope', emoji: '🪢', labelKey: 'games.measureAndMatch.objects.length.rope' },
    { id: 'stick', emoji: '🪵', labelKey: 'games.measureAndMatch.objects.length.stick' },
    { id: 'ladder', emoji: '🪜', labelKey: 'games.measureAndMatch.objects.length.ladder' },
  ],
  weight: [
    { id: 'feather', emoji: '🪶', labelKey: 'games.measureAndMatch.objects.weight.feather' },
    { id: 'apple', emoji: '🍎', labelKey: 'games.measureAndMatch.objects.weight.apple' },
    { id: 'teddy', emoji: '🧸', labelKey: 'games.measureAndMatch.objects.weight.teddy' },
    { id: 'melon', emoji: '🍉', labelKey: 'games.measureAndMatch.objects.weight.melon' },
    { id: 'rock', emoji: '🪨', labelKey: 'games.measureAndMatch.objects.weight.rock' },
  ],
  volume: [
    { id: 'glass', emoji: '🥛', labelKey: 'games.measureAndMatch.objects.volume.glass' },
    { id: 'bottle', emoji: '🧴', labelKey: 'games.measureAndMatch.objects.volume.bottle' },
    { id: 'cup', emoji: '☕', labelKey: 'games.measureAndMatch.objects.volume.cup' },
    { id: 'pot', emoji: '🫖', labelKey: 'games.measureAndMatch.objects.volume.pot' },
    { id: 'bucket', emoji: '🪣', labelKey: 'games.measureAndMatch.objects.volume.bucket' },
  ],
};

const CONTEXT_KEYS: StatusKey[] = [
  'games.measureAndMatch.contexts.kitchen',
  'games.measureAndMatch.contexts.playground',
  'games.measureAndMatch.contexts.market',
];

const PROMPT_KEY_BY_DOMAIN_AND_GOAL: Record<Domain, Record<Goal, StatusKey>> = {
  length: {
    max: 'games.measureAndMatch.prompts.length.longer',
    min: 'games.measureAndMatch.prompts.length.shorter',
  },
  weight: {
    max: 'games.measureAndMatch.prompts.weight.heavier',
    min: 'games.measureAndMatch.prompts.weight.lighter',
  },
  volume: {
    max: 'games.measureAndMatch.prompts.volume.fuller',
    min: 'games.measureAndMatch.prompts.volume.emptier',
  },
};

const SUCCESS_KEY_BY_DOMAIN_AND_GOAL: Record<Domain, Record<Goal, StatusKey>> = {
  length: {
    max: 'games.measureAndMatch.feedback.success.lengthMax',
    min: 'games.measureAndMatch.feedback.success.lengthMin',
  },
  weight: {
    max: 'games.measureAndMatch.feedback.success.weightMax',
    min: 'games.measureAndMatch.feedback.success.weightMin',
  },
  volume: {
    max: 'games.measureAndMatch.feedback.success.volumeMax',
    min: 'games.measureAndMatch.feedback.success.volumeMin',
  },
};

const ENCOURAGEMENT_ROTATION: StatusKey[] = [
  'games.measureAndMatch.feedback.encouragement.keepTrying',
  'games.measureAndMatch.feedback.encouragement.almostThere',
  'games.measureAndMatch.feedback.encouragement.tryAgain',
];

const HINT_ROTATION: StatusKey[] = [
  'games.measureAndMatch.hints.compareOneByOne',
  'games.measureAndMatch.hints.focusAttributeWord',
  'games.measureAndMatch.hints.useToolFirst',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(values: readonly T[]): T {
  return values[randomInt(0, values.length - 1)] as T;
}

function shuffle<T>(values: readonly T[]): T[] {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function toHintTrend(hintsByRound: number[]): ParentSummaryMetrics['hintTrend'] {
  if (hintsByRound.length <= 1) {
    return hintsByRound[0] && hintsByRound[0] > 0 ? 'needs_support' : 'steady';
  }

  const midpoint = Math.ceil(hintsByRound.length / 2);
  const firstHalf = hintsByRound.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
  const secondHalf = hintsByRound.slice(midpoint).reduce((sum, value) => sum + value, 0);

  if (secondHalf < firstHalf) {
    return 'improving';
  }

  if (secondHalf === firstHalf) {
    return 'steady';
  }

  return 'needs_support';
}

function toStableRange(firstAttemptAccuracy: number): StableRange {
  if (firstAttemptAccuracy >= 85) {
    return '1-10';
  }
  if (firstAttemptAccuracy >= 65) {
    return '1-5';
  }
  return '1-3';
}

function domainValueRange(domain: Domain): { min: number; max: number; stepNear: number; stepWide: number } {
  if (domain === 'length') {
    return { min: 20, max: 95, stepNear: 6, stepWide: 14 };
  }

  if (domain === 'weight') {
    return { min: 2, max: 22, stepNear: 2, stepWide: 5 };
  }

  return { min: 20, max: 100, stepNear: 9, stepWide: 18 };
}

function buildAscendingValues(optionCount: number, domain: Domain, nearDifference: boolean): number[] {
  const range = domainValueRange(domain);
  const minStep = nearDifference ? range.stepNear : range.stepWide;
  const jitterMax = nearDifference ? Math.max(1, Math.floor(minStep / 2)) : Math.max(2, Math.floor(minStep / 2));
  const totalMinSpan = minStep * Math.max(optionCount - 1, 0);
  const startMax = Math.max(range.min, range.max - totalMinSpan);
  const start = randomInt(range.min, startMax);

  let current = start;
  const values: number[] = [];

  for (let index = 0; index < optionCount; index += 1) {
    if (index === 0) {
      values.push(current);
      continue;
    }

    const step = minStep + randomInt(0, jitterMax);
    current = Math.min(range.max, current + step);
    values.push(current);
  }

  // Keep strict monotonic order even when clamped at the edge.
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] <= values[index - 1]) {
      values[index] = values[index - 1] + 1;
    }
  }

  return values;
}

function roundLevelForNumber(roundNumber: number): LevelId {
  if (roundNumber <= 3) {
    return 1;
  }
  if (roundNumber <= 6) {
    return 2;
  }
  return 3;
}

function buildRoundConfig(
  roundNumber: number,
  level: LevelId,
  maxConcurrentChoices: number,
  simplifyNext: boolean,
  boost: BoostMode,
): RoundConfig {
  const baseChoicesByLevel: Record<LevelId, number> = { 1: 2, 2: 3, 3: 4 };
  const baseChoiceLimit = baseChoicesByLevel[level];
  const withBoost = boost === 'context' ? Math.min(baseChoiceLimit + 1, 4) : baseChoiceLimit;
  const choiceLimit = Math.max(2, Math.min(maxConcurrentChoices, simplifyNext ? 2 : withBoost));
  const nearDifference = simplifyNext ? false : level >= 2 || boost === 'similarity';

  return {
    roundNumber,
    level,
    choiceLimit,
    nearDifference,
    contextComplexity: level === 3 || boost === 'context',
  };
}

function buildRound(config: RoundConfig): RoundState {
  const domain = config.level === 1
    ? DOMAIN_ORDER[(config.roundNumber - 1) % DOMAIN_ORDER.length] as Domain
    : pickRandom(DOMAIN_ORDER);

  const goal: Goal =
    config.level === 1
      ? 'max'
      : config.roundNumber % 3 === 0
        ? 'min'
        : pickRandom(['max', 'min'] as const);

  const optionCount = Math.max(2, Math.min(config.choiceLimit, DOMAIN_OBJECTS[domain].length));
  const templates = shuffle(DOMAIN_OBJECTS[domain]).slice(0, optionCount);
  const orderedValues = buildAscendingValues(optionCount, domain, config.nearDifference);
  const shuffledValues = shuffle(orderedValues);

  const candidates = templates.map((template, index) => ({
    ...template,
    value: shuffledValues[index] as number,
  }));

  const targetValue = goal === 'max'
    ? Math.max(...candidates.map((candidate) => candidate.value))
    : Math.min(...candidates.map((candidate) => candidate.value));

  const correctId = candidates.find((candidate) => candidate.value === targetValue)?.id ?? candidates[0]?.id ?? '';

  const contextKey = config.contextComplexity
    ? pickRandom(CONTEXT_KEYS)
    : 'games.measureAndMatch.contexts.default';

  return {
    id: `measure-match-${config.roundNumber}-${domain}-${goal}-${optionCount}-${config.nearDifference ? 'near' : 'wide'}`,
    roundNumber: config.roundNumber,
    level: config.level,
    domain,
    goal,
    contextKey,
    instructionKey:
      config.roundNumber === 1
        ? 'games.measureAndMatch.instructions.intro'
        : 'games.measureAndMatch.instructions.dragToStation',
    promptKey: PROMPT_KEY_BY_DOMAIN_AND_GOAL[domain][goal],
    candidates,
    correctId,
    targetValue,
    nearDifference: config.nearDifference,
  };
}

function reduceRoundChoices(round: RoundState, selectedId: string): RoundState {
  if (round.candidates.length <= 2) {
    return round;
  }

  const correct = round.candidates.find((candidate) => candidate.id === round.correctId);
  const selected = round.candidates.find((candidate) => candidate.id === selectedId);
  if (!correct) {
    return round;
  }

  const reduced = selected && selected.id !== correct.id
    ? [correct, selected]
    : [
        correct,
        round.candidates
          .filter((candidate) => candidate.id !== correct.id)
          .sort((a, b) => Math.abs(a.value - correct.value) - Math.abs(b.value - correct.value))[0],
      ].filter((candidate): candidate is CandidateState => Boolean(candidate));

  return {
    ...round,
    candidates: shuffle(reduced),
  };
}

function classifyConfusionTag(
  round: RoundState,
  selected: CandidateState,
  hintStep: number,
): ConfusionTag {
  if (round.nearDifference && hintStep === 0) {
    return 'perceptual-guess';
  }

  const values = round.candidates.map((candidate) => candidate.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const pickedOppositeExtreme =
    (round.goal === 'max' && selected.value === minValue) ||
    (round.goal === 'min' && selected.value === maxValue);

  if (pickedOppositeExtreme) {
    return 'term-mixup';
  }

  return 'tool-ignore';
}

function domainAccuracy(stats: DomainStats): number {
  if (stats.rounds === 0) {
    return 0;
  }

  return Math.round((stats.firstAttemptHits / stats.rounds) * 100);
}

function buildInitialSessionStats(): SessionStats {
  return {
    resolvedRounds: 0,
    firstAttemptHits: 0,
    hintUsageByRound: [],
    domainStats: {
      length: { rounds: 0, firstAttemptHits: 0 },
      weight: { rounds: 0, firstAttemptHits: 0 },
      volume: { rounds: 0, firstAttemptHits: 0 },
    },
    confusionCounts: {
      'perceptual-guess': 0,
      'term-mixup': 0,
      'tool-ignore': 0,
    },
  };
}

export function MeasureAndMatchGame({ level, child, onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir(i18n.language));
  const replayIcon = rtlReplayGlyph(isRtl);
  const maxConcurrentChoices = useMemo(
    () => resolveGameConcurrentChoiceLimit(level.configJson, child.birthDate),
    [child.birthDate, level.configJson],
  );

  const initialConfigRef = useRef(
    buildRoundConfig(1, 1, maxConcurrentChoices, false, 'none'),
  );

  const [roundConfig, setRoundConfig] = useState<RoundConfig>(initialConfigRef.current);
  const [round, setRound] = useState<RoundState>(() => buildRound(initialConfigRef.current));

  const [roundMessage, setRoundMessage] = useState<RoundMessage>({
    key: 'games.measureAndMatch.instructions.intro',
    tone: 'neutral',
  });

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [highlightCandidateId, setHighlightCandidateId] = useState<string | null>(null);
  const [stationFeedback, setStationFeedback] = useState<StationFeedback>('idle');
  const [dropHot, setDropHot] = useState(false);

  const [usedHintThisRound, setUsedHintThisRound] = useState(false);
  const [hintStep, setHintStep] = useState(0);
  const [mistakesThisRound, setMistakesThisRound] = useState(0);
  const [hintsThisRound, setHintsThisRound] = useState(0);

  const [sessionStats, setSessionStats] = useState<SessionStats>(() => buildInitialSessionStats());
  const [checkpointPaused, setCheckpointPaused] = useState(false);
  const [checkpointShown, setCheckpointShown] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<RoundConfig | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);

  const [consecutiveMissRounds, setConsecutiveMissRounds] = useState(0);
  const [consecutiveFirstAttemptSuccesses, setConsecutiveFirstAttemptSuccesses] = useState(0);

  const completionReportedRef = useRef(false);
  const boostModeRef = useRef<'similarity' | 'context'>('similarity');
  const roundHistoryRef = useRef<RoundOutcome[]>([]);

  const selectedCandidate = useMemo(
    () => round.candidates.find((candidate) => candidate.id === selectedCandidateId) ?? null,
    [round.candidates, selectedCandidateId],
  );

  const promptProgress = useMemo(() => Array.from({ length: TOTAL_ROUNDS }, (_, index) => index + 1), []);

  const playAudioKey = useCallback(
    async (key: StatusKey, interrupt = false) => {
      if (audioPlaybackFailed) {
        return;
      }

      const path = resolveAudioPathFromKey(key, 'common');

      try {
        if (interrupt) {
          await audio.playNow(path);
          return;
        }
        await audio.play(path);
      } catch {
        setAudioPlaybackFailed(true);
      }
    },
    [audio, audioPlaybackFailed],
  );

  const setMessageWithAudio = useCallback(
    (key: StatusKey, tone: FeedbackTone, interrupt = false) => {
      setRoundMessage({ key, tone });
      void playAudioKey(key, interrupt);
    },
    [playAudioKey],
  );

  const resetRoundUi = useCallback(() => {
    setSelectedCandidateId(null);
    setHighlightCandidateId(null);
    setStationFeedback('idle');
    setDropHot(false);
    setUsedHintThisRound(false);
    setHintStep(0);
    setMistakesThisRound(0);
    setHintsThisRound(0);
  }, []);

  const loadRound = useCallback(
    (nextConfig: RoundConfig) => {
      const nextRound = buildRound(nextConfig);
      setRoundConfig(nextConfig);
      setRound(nextRound);
      resetRoundUi();
      setMessageWithAudio(nextRound.instructionKey, 'neutral', true);

      window.setTimeout(() => {
        setMessageWithAudio(nextRound.promptKey, 'neutral');
      }, 220);
    },
    [resetRoundUi, setMessageWithAudio],
  );

  const finalizeSession = useCallback(
    (finalStats: SessionStats) => {
      if (completionReportedRef.current) {
        return;
      }

      completionReportedRef.current = true;

      const accuracyByDomain = {
        length: domainAccuracy(finalStats.domainStats.length),
        weight: domainAccuracy(finalStats.domainStats.weight),
        volume: domainAccuracy(finalStats.domainStats.volume),
      } satisfies Record<Domain, number>;

      const strongestDomain = [...DOMAIN_ORDER].sort(
        (left, right) => accuracyByDomain[right] - accuracyByDomain[left],
      )[0] as Domain;
      const nextFocusDomain = [...DOMAIN_ORDER].sort(
        (left, right) => accuracyByDomain[left] - accuracyByDomain[right],
      )[0] as Domain;

      const totalConfusions = Object.values(finalStats.confusionCounts).reduce((sum, value) => sum + value, 0);
      const topConfusion = (Object.entries(finalStats.confusionCounts).sort(([, left], [, right]) => right - left)[0]?.[0] ??
        'tool-ignore') as ConfusionTag;

      const firstAttemptAccuracy = Math.round((finalStats.firstAttemptHits / TOTAL_ROUNDS) * 100);
      const hintTrend = toHintTrend(finalStats.hintUsageByRound);
      const summaryPayload: SessionSummary = {
        firstAttemptAccuracy,
        hintTrend,
        topConfusion,
        strongestDomain,
        nextFocusDomain,
        accuracyByDomain,
      };

      setSummary(summaryPayload);
      setSessionComplete(true);
      setMessageWithAudio('feedback.youDidIt', 'success', true);

      const misconceptionTrend = totalConfusions === 0
        ? {}
        : ({
            'perceptual-guess': Math.round((finalStats.confusionCounts['perceptual-guess'] / totalConfusions) * 100),
            'term-mixup': Math.round((finalStats.confusionCounts['term-mixup'] / totalConfusions) * 100),
            'tool-ignore': Math.round((finalStats.confusionCounts['tool-ignore'] / totalConfusions) * 100),
          } satisfies Partial<Record<ConfusionTag, number>>);

      const stars = firstAttemptAccuracy >= 85 ? 3 : firstAttemptAccuracy >= 65 ? 2 : 1;
      const hintCount = finalStats.hintUsageByRound.reduce((sum, value) => sum + value, 0);

      onComplete({
        stars,
        score: finalStats.firstAttemptHits * 120 + (TOTAL_ROUNDS - hintCount) * 24,
        completed: true,
        roundsCompleted: finalStats.resolvedRounds,
        summaryMetrics: {
          highestStableRange: toStableRange(firstAttemptAccuracy),
          firstAttemptSuccessRate: firstAttemptAccuracy,
          hintTrend,
          misconceptionTrend,
        },
      });
    },
    [onComplete, setMessageWithAudio],
  );

  const resolvePromotedLevel = useCallback(
    (currentLevel: LevelId, history: RoundOutcome[]): LevelId => {
      if (currentLevel === 1 && history.length >= 8) {
        const window = history.slice(-8);
        const firstAttemptRate = (window.filter((entry) => entry.firstAttempt).length / window.length) * 100;
        if (firstAttemptRate >= 75) {
          return 2;
        }
      }

      if (currentLevel >= 2 && history.length >= 10) {
        const window = history.slice(-10);
        const firstAttemptRate = (window.filter((entry) => entry.firstAttempt).length / window.length) * 100;
        const hintRate = (window.filter((entry) => entry.hintUsed).length / window.length) * 100;
        if (firstAttemptRate >= 80 && hintRate <= 30) {
          return 3;
        }
      }

      return currentLevel;
    },
    [],
  );

  const completeRound = useCallback(
    (firstAttempt: boolean) => {
      if (sessionComplete || checkpointPaused) {
        return;
      }

      const updatedDomainStats: SessionStats['domainStats'] = {
        ...sessionStats.domainStats,
        [round.domain]: {
          rounds: sessionStats.domainStats[round.domain].rounds + 1,
          firstAttemptHits: sessionStats.domainStats[round.domain].firstAttemptHits + (firstAttempt ? 1 : 0),
        },
      };

      const nextStats: SessionStats = {
        ...sessionStats,
        resolvedRounds: sessionStats.resolvedRounds + 1,
        firstAttemptHits: sessionStats.firstAttemptHits + (firstAttempt ? 1 : 0),
        hintUsageByRound: [...sessionStats.hintUsageByRound, hintsThisRound],
        domainStats: updatedDomainStats,
      };

      setSessionStats(nextStats);

      const nextHistory = [
        ...roundHistoryRef.current,
        { level: round.level, firstAttempt, hintUsed: usedHintThisRound },
      ];
      roundHistoryRef.current = nextHistory;

      if (nextStats.resolvedRounds >= TOTAL_ROUNDS) {
        window.setTimeout(() => {
          finalizeSession(nextStats);
        }, AUTO_ADVANCE_MS);
        return;
      }

      const streakFirstAttempt = firstAttempt ? consecutiveFirstAttemptSuccesses + 1 : 0;
      const streakMiss = firstAttempt ? 0 : consecutiveMissRounds + 1;

      let simplifyNext = false;
      let boost: BoostMode = 'none';

      if (streakMiss >= 2) {
        simplifyNext = true;
        setConsecutiveMissRounds(0);
      } else {
        setConsecutiveMissRounds(streakMiss);
      }

      if (streakFirstAttempt >= 3) {
        boost = boostModeRef.current;
        boostModeRef.current = boostModeRef.current === 'similarity' ? 'context' : 'similarity';
        setConsecutiveFirstAttemptSuccesses(0);
      } else {
        setConsecutiveFirstAttemptSuccesses(streakFirstAttempt);
      }

      const nextRoundNumber = roundConfig.roundNumber + 1;
      const promotedLevel = resolvePromotedLevel(round.level, nextHistory);
      const nextLevel = roundLevelForNumber(nextRoundNumber) > promotedLevel
        ? roundLevelForNumber(nextRoundNumber)
        : promotedLevel;
      const nextConfig = buildRoundConfig(
        nextRoundNumber,
        nextLevel,
        maxConcurrentChoices,
        simplifyNext,
        boost,
      );

      if (!checkpointShown && nextRoundNumber === BREAK_AFTER_ROUND + 1) {
        setCheckpointShown(true);
        setCheckpointPaused(true);
        setPendingConfig(nextConfig);
        setMessageWithAudio('games.measureAndMatch.instructions.breakCard', 'neutral', true);
        return;
      }

      window.setTimeout(() => {
        loadRound(nextConfig);
      }, AUTO_ADVANCE_MS);
    },
    [
      checkpointPaused,
      checkpointShown,
      consecutiveFirstAttemptSuccesses,
      consecutiveMissRounds,
      finalizeSession,
      hintsThisRound,
      loadRound,
      maxConcurrentChoices,
      resolvePromotedLevel,
      round,
      roundConfig.roundNumber,
      sessionComplete,
      sessionStats,
      setMessageWithAudio,
      usedHintThisRound,
    ],
  );

  const registerConfusion = useCallback((tag: ConfusionTag) => {
    setSessionStats((previous) => ({
      ...previous,
      confusionCounts: {
        ...previous.confusionCounts,
        [tag]: previous.confusionCounts[tag] + 1,
      },
    }));
  }, []);

  const evaluateCandidate = useCallback(
    (candidateId: string) => {
      if (sessionComplete || checkpointPaused) {
        return;
      }

      const candidate = round.candidates.find((entry) => entry.id === candidateId);
      if (!candidate) {
        return;
      }

      setSelectedCandidateId(candidate.id);
      setDropHot(false);

      const isCorrect = candidate.id === round.correctId;
      if (isCorrect) {
        setStationFeedback('success');
        setHighlightCandidateId(candidate.id);

        const successKey = SUCCESS_KEY_BY_DOMAIN_AND_GOAL[round.domain][round.goal];
        setMessageWithAudio(successKey, 'success');

        const firstAttempt = mistakesThisRound === 0 && !usedHintThisRound;
        window.setTimeout(() => {
          completeRound(firstAttempt);
        }, AUTO_ADVANCE_MS);
        return;
      }

      setStationFeedback('miss');
      setUsedHintThisRound(true);

      const confusionTag = classifyConfusionTag(round, candidate, hintStep);
      registerConfusion(confusionTag);

      setMistakesThisRound((previousMistakes) => {
        const nextMistakes = previousMistakes + 1;

        if (nextMistakes === 1) {
          setMessageWithAudio(pickRandom(ENCOURAGEMENT_ROTATION), 'hint');
          setRound((previousRound) => reduceRoundChoices(previousRound, candidate.id));
          return nextMistakes;
        }

        if (nextMistakes === 2) {
          setHighlightCandidateId(round.correctId);
          setHintStep(2);
          setHintsThisRound((previousHints) => previousHints + 1);
          setMessageWithAudio('games.measureAndMatch.recovery.simplifyChoices', 'hint');
          setRound((previousRound) => reduceRoundChoices(previousRound, candidate.id));
          return nextMistakes;
        }

        setHintStep(3);
        setHintsThisRound((previousHints) => previousHints + 1);
        setSelectedCandidateId(round.correctId);
        setHighlightCandidateId(round.correctId);
        setStationFeedback('success');
        setMessageWithAudio('games.measureAndMatch.recovery.guidedDemo', 'hint', true);
        window.setTimeout(() => {
          completeRound(false);
        }, AUTO_ADVANCE_MS);
        return nextMistakes;
      });
    },
    [
      checkpointPaused,
      completeRound,
      hintStep,
      mistakesThisRound,
      registerConfusion,
      round,
      sessionComplete,
      setMessageWithAudio,
      usedHintThisRound,
    ],
  );

  const handleReplayPrompt = useCallback(() => {
    if (sessionComplete || checkpointPaused) {
      return;
    }

    setUsedHintThisRound(true);
    setHintsThisRound((previous) => previous + 1);
    setMessageWithAudio('games.measureAndMatch.hints.useReplay', 'hint');

    window.setTimeout(() => {
      setMessageWithAudio(round.promptKey, 'neutral');
    }, 180);
  }, [checkpointPaused, round.promptKey, sessionComplete, setMessageWithAudio]);

  const handleHint = useCallback(() => {
    if (sessionComplete || checkpointPaused) {
      return;
    }

    setUsedHintThisRound(true);
    setHintsThisRound((previous) => previous + 1);

    setHintStep((previous) => {
      const nextStep = Math.min(previous + 1, 3);
      const hintKey = HINT_ROTATION[(nextStep - 1) % HINT_ROTATION.length] as StatusKey;
      setMessageWithAudio(hintKey, 'hint');

      if (nextStep >= 2) {
        setHighlightCandidateId(round.correctId);
      }

      return nextStep;
    });
  }, [checkpointPaused, round.correctId, sessionComplete, setMessageWithAudio]);

  const handleRetry = useCallback(() => {
    if (sessionComplete || checkpointPaused) {
      return;
    }

    setUsedHintThisRound(true);
    setHintsThisRound((previous) => previous + 1);
    setSelectedCandidateId(null);
    setStationFeedback('idle');
    setHighlightCandidateId(round.correctId);
    setMessageWithAudio('games.measureAndMatch.recovery.gentleRetry', 'hint');
  }, [checkpointPaused, round.correctId, sessionComplete, setMessageWithAudio]);

  const handleCandidateDragStart = useCallback(
    (candidateId: string) => (event: React.DragEvent<HTMLButtonElement>) => {
      if (sessionComplete || checkpointPaused) {
        event.preventDefault();
        return;
      }

      event.dataTransfer.setData('text/plain', candidateId);
      event.dataTransfer.effectAllowed = 'move';
    },
    [checkpointPaused, sessionComplete],
  );

  const handleStationDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDropHot(false);
      const candidateId = event.dataTransfer.getData('text/plain');
      if (!candidateId) {
        return;
      }
      evaluateCandidate(candidateId);
    },
    [evaluateCandidate],
  );

  const handleCheckpointContinue = useCallback(() => {
    if (!pendingConfig) {
      return;
    }

    setCheckpointPaused(false);
    setPendingConfig(null);
    loadRound(pendingConfig);
  }, [loadRound, pendingConfig]);

  const handlePlayAgain = useCallback(() => {
    completionReportedRef.current = false;
    roundHistoryRef.current = [];
    boostModeRef.current = 'similarity';

    setSessionStats(buildInitialSessionStats());
    setCheckpointPaused(false);
    setCheckpointShown(false);
    setPendingConfig(null);
    setSessionComplete(false);
    setSummary(null);
    setConsecutiveMissRounds(0);
    setConsecutiveFirstAttemptSuccesses(0);
    setAudioPlaybackFailed(false);

    const resetConfig = buildRoundConfig(1, 1, maxConcurrentChoices, false, 'none');
    loadRound(resetConfig);
  }, [loadRound, maxConcurrentChoices]);

  const stationScaleByDomain = useMemo(() => {
    const min = Math.min(...round.candidates.map((candidate) => candidate.value));
    const max = Math.max(...round.candidates.map((candidate) => candidate.value));
    const span = Math.max(1, max - min);

    return (candidate: CandidateState | null) => {
      if (!candidate) {
        return 35;
      }
      const normalized = (candidate.value - min) / span;
      return Math.round(35 + normalized * 65);
    };
  }, [round.candidates]);

  const stationTiltDeg = useMemo(() => {
    if (!selectedCandidate) {
      return 0;
    }

    const remaining = round.candidates.filter((candidate) => candidate.id !== selectedCandidate.id);
    const baseline = remaining.length > 0
      ? remaining.reduce((sum, candidate) => sum + candidate.value, 0) / remaining.length
      : selectedCandidate.value;
    const rawTilt = (selectedCandidate.value - baseline) * (round.domain === 'weight' ? 1.8 : 0.45);
    return Math.max(-16, Math.min(16, Math.round(rawTilt)));
  }, [round.candidates, round.domain, selectedCandidate]);

  const stationTargetScale = useMemo(() => {
    const pseudoCandidate: CandidateState = {
      id: 'target',
      emoji: '',
      labelKey: '',
      value: round.targetValue,
    };
    return stationScaleByDomain(pseudoCandidate);
  }, [round.targetValue, stationScaleByDomain]);

  useEffect(() => {
    const introTimer = window.setTimeout(() => {
      setMessageWithAudio('games.measureAndMatch.instructions.intro', 'neutral');
    }, 220);

    return () => {
      window.clearTimeout(introTimer);
      audio.stop();
    };
  }, [audio, setMessageWithAudio]);

  useEffect(() => {
    if (sessionComplete || checkpointPaused) {
      return;
    }

    const promptTimer = window.setTimeout(() => {
      setMessageWithAudio(round.promptKey, 'neutral');
    }, 3200);

    return () => {
      window.clearTimeout(promptTimer);
    };
  }, [checkpointPaused, round.promptKey, sessionComplete, setMessageWithAudio]);

  if (sessionComplete && summary) {
    return (
      <div className="measure-match measure-match--summary">
        <Card padding="lg" className="measure-match__shell">
          <h2 className="measure-match__title">{t('feedback.youDidIt')}</h2>
          <div className="measure-match__celebration">
            <SuccessCelebration />
          </div>
          <p className="measure-match__summary-text" aria-live="polite">
            {t('parentDashboard.games.measureAndMatch.progressSummary', {
              lengthAccuracy: `${summary.accuracyByDomain.length}%`,
              weightAccuracy: `${summary.accuracyByDomain.weight}%`,
              volumeAccuracy: `${summary.accuracyByDomain.volume}%`,
              topConfusion: t(`games.measureAndMatch.confusions.${summary.topConfusion}`),
              strongestDomain: t(`games.measureAndMatch.domains.${summary.strongestDomain}`),
              nextFocusDomain: t(`games.measureAndMatch.domains.${summary.nextFocusDomain}`),
              hintTrend: t(`games.measureAndMatch.hintTrend.${summary.hintTrend}`),
            })}
          </p>
          <p className="measure-match__summary-note">
            {t('parentDashboard.games.measureAndMatch.nextStep')}
          </p>
          <div className="measure-match__actions">
            <Button
              variant="primary"
              size="lg"
              onClick={handlePlayAgain}
              aria-label={t('games.measureAndMatch.controls.retry')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              ↻
            </Button>
          </div>
        </Card>
        <style>{measureAndMatchStyles}</style>
      </div>
    );
  }

  if (checkpointPaused) {
    return (
      <div className="measure-match measure-match--checkpoint">
        <Card padding="lg" className="measure-match__shell">
          <h2 className="measure-match__title">{t('feedback.greatEffort')}</h2>
          <p className="measure-match__summary-note">{t('games.measureAndMatch.instructions.breakCard')}</p>
          <div className="measure-match__actions">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setMessageWithAudio('games.measureAndMatch.instructions.breakCard', 'neutral')}
              aria-label={t('games.measureAndMatch.controls.replay')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              {replayIcon}
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleCheckpointContinue}
              aria-label={t('games.measureAndMatch.controls.continue')}
              style={{ minWidth: 'var(--touch-min)' }}
            >
              ⏭
            </Button>
          </div>
        </Card>
        <style>{measureAndMatchStyles}</style>
      </div>
    );
  }

  return (
    <div className="measure-match">
      <Card padding="lg" className="measure-match__shell">
        <header className="measure-match__header">
          <div className="measure-match__heading">
            <h2 className="measure-match__title">{t('games.measureAndMatch.title')}</h2>
            <p className="measure-match__subtitle">{t('games.measureAndMatch.subtitle')}</p>
          </div>

          <div className="measure-match__meta">
            <span className="measure-match__pill">{t(`games.measureAndMatch.levelLabel.${round.level}`)}</span>
            <span className="measure-match__pill">{round.roundNumber} / {TOTAL_ROUNDS}</span>
          </div>
        </header>

        <div className="measure-match__progress" aria-hidden="true">
          {promptProgress.map((step) => {
            const state = step < round.roundNumber ? 'done' : step === round.roundNumber ? 'active' : 'pending';
            return (
              <span
                key={`round-${step}`}
                className={[
                  'measure-match__progress-dot',
                  `measure-match__progress-dot--${state}`,
                ].join(' ')}
              />
            );
          })}
        </div>

        <div className="measure-match__message-row">
          <p className={`measure-match__message measure-match__message--${roundMessage.tone}`} aria-live="polite">
            {t(roundMessage.key as any)}
          </p>
          <Button
            variant="secondary"
            size="md"
            onClick={handleReplayPrompt}
            aria-label={t('games.measureAndMatch.controls.replay')}
            style={{ minWidth: 'var(--touch-min)' }}
          >
            {replayIcon}
          </Button>
        </div>

        {audioPlaybackFailed && (
          <p className="measure-match__audio-fallback" aria-live="polite">
            🔇 {t('games.measureAndMatch.instructions.listenAndCompare')}
          </p>
        )}

        <p className="measure-match__context">{t(round.contextKey as any)}</p>

        <section
          className={[
            'measure-match__station',
            `measure-match__station--${round.domain}`,
            dropHot ? 'measure-match__station--hot' : '',
            stationFeedback === 'success' ? 'measure-match__station--success' : '',
            stationFeedback === 'miss' ? 'measure-match__station--miss' : '',
          ].join(' ')}
          onDragOver={(event) => {
            event.preventDefault();
            setDropHot(true);
          }}
          onDragLeave={() => setDropHot(false)}
          onDrop={handleStationDrop}
          role="group"
          aria-label={t('games.measureAndMatch.instructions.dragToStation')}
        >
          <div className="measure-match__station-title">
            <span>{t(`games.measureAndMatch.domains.${round.domain}`)}</span>
            <span>{t(round.promptKey as any)}</span>
          </div>

          {round.domain === 'length' && (
            <div className="measure-match__ruler" dir="ltr" aria-hidden="true">
              <span className="measure-match__ruler-target" style={{ inlineSize: `${stationTargetScale}%` }} />
              <span
                className="measure-match__ruler-current"
                style={{ inlineSize: `${stationScaleByDomain(selectedCandidate)}%` }}
              />
            </div>
          )}

          {round.domain === 'weight' && (
            <div className="measure-match__balance" aria-hidden="true">
              <span className="measure-match__balance-pan measure-match__balance-pan--left" />
              <span className="measure-match__balance-pan measure-match__balance-pan--right" />
              <span
                className="measure-match__balance-beam"
                style={{ transform: `translateX(-50%) rotate(${stationTiltDeg}deg)` }}
              />
            </div>
          )}

          {round.domain === 'volume' && (
            <div className="measure-match__cup" aria-hidden="true">
              <span className="measure-match__cup-target" style={{ insetBlockEnd: `${stationTargetScale}%` }} />
              <span className="measure-match__cup-fill" style={{ blockSize: `${stationScaleByDomain(selectedCandidate)}%` }} />
            </div>
          )}
        </section>

        <div className="measure-match__controls" role="group" aria-label={t('games.measureAndMatch.instructions.iconControls')}>
          <Button
            variant="secondary"
            size="md"
            onClick={handleReplayPrompt}
            aria-label={t('games.measureAndMatch.controls.replay')}
            style={{ minWidth: 'var(--touch-min)' }}
          >
            {replayIcon}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleHint}
            aria-label={t('games.measureAndMatch.controls.hint')}
            style={{ minWidth: 'var(--touch-min)' }}
          >
            💡
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleRetry}
            aria-label={t('games.measureAndMatch.controls.retry')}
            style={{ minWidth: 'var(--touch-min)' }}
          >
            ↻
          </Button>
        </div>

        <div className="measure-match__choices">
          {round.candidates.map((candidate) => {
            const scalePct = stationScaleByDomain(candidate);
            return (
              <button
                key={candidate.id}
                type="button"
                draggable
                onDragStart={handleCandidateDragStart(candidate.id)}
                onClick={() => evaluateCandidate(candidate.id)}
                className={[
                  'measure-match__choice',
                  selectedCandidateId === candidate.id ? 'measure-match__choice--selected' : '',
                  highlightCandidateId === candidate.id ? 'measure-match__choice--highlight' : '',
                ].join(' ')}
                aria-label={t(candidate.labelKey as any)}
              >
                <span className="measure-match__choice-emoji" aria-hidden="true">{candidate.emoji}</span>
                <span className="measure-match__choice-label">{t(candidate.labelKey as any)}</span>
                <span className="measure-match__choice-scale" aria-hidden="true">
                  <span style={{ inlineSize: `${scalePct}%` }} />
                </span>
              </button>
            );
          })}
        </div>
      </Card>
      <style>{measureAndMatchStyles}</style>
    </div>
  );
}

const measureAndMatchStyles = `
  .measure-match {
    display: grid;
  }

  .measure-match__shell {
    display: grid;
    gap: var(--space-md);
    border: 1px solid color-mix(in srgb, var(--color-accent-info) 26%, transparent);
    background:
      radial-gradient(circle at 88% 0%, color-mix(in srgb, var(--color-accent-info) 16%, transparent), transparent 56%),
      radial-gradient(circle at 8% 96%, color-mix(in srgb, var(--color-accent-success) 10%, transparent), transparent 58%),
      var(--color-surface);
  }

  .measure-match__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .measure-match__heading {
    display: grid;
    gap: var(--space-2xs);
  }

  .measure-match__title {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-xl);
  }

  .measure-match__subtitle {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .measure-match__meta {
    display: inline-flex;
    gap: var(--space-xs);
    align-items: center;
  }

  .measure-match__pill {
    min-block-size: 48px;
    padding-inline: var(--space-sm);
    border-radius: var(--radius-full);
    border: 1px solid color-mix(in srgb, var(--color-accent-primary) 30%, transparent);
    background: color-mix(in srgb, var(--color-accent-primary) 12%, transparent);
    color: var(--color-text-primary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }

  .measure-match__progress {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: var(--space-xs);
  }

  .measure-match__progress-dot {
    block-size: 10px;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-border) 72%, transparent);
    transition: var(--transition-fast);
  }

  .measure-match__progress-dot--done {
    background: var(--color-accent-success);
  }

  .measure-match__progress-dot--active {
    background: var(--color-accent-primary);
    transform: scaleY(1.35);
  }

  .measure-match__message-row {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: var(--space-sm);
    border-radius: var(--radius-md);
    border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
    background: color-mix(in srgb, var(--color-surface-muted) 84%, transparent);
    padding: var(--space-sm);
  }

  .measure-match__message {
    margin: 0;
    color: var(--color-text-primary);
    line-height: 1.4;
    font-size: var(--font-size-md);
  }

  .measure-match__message--hint {
    color: color-mix(in srgb, var(--color-accent-warning) 82%, var(--color-text-primary));
  }

  .measure-match__message--success {
    color: color-mix(in srgb, var(--color-accent-success) 86%, var(--color-text-primary));
  }

  .measure-match__audio-fallback {
    margin: 0;
    text-align: center;
    border-radius: var(--radius-sm);
    border: 1px solid color-mix(in srgb, var(--color-accent-warning) 40%, transparent);
    background: color-mix(in srgb, var(--color-accent-warning) 14%, transparent);
    color: var(--color-text-primary);
    padding: var(--space-xs) var(--space-sm);
  }

  .measure-match__context {
    margin: 0;
    text-align: center;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .measure-match__station {
    min-block-size: 156px;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: var(--space-sm);
    border-radius: var(--radius-lg);
    border: 2px dashed color-mix(in srgb, var(--color-accent-primary) 40%, var(--color-border));
    background: color-mix(in srgb, var(--color-surface-muted) 70%, transparent);
    padding: var(--space-md);
    transition: border-color var(--motion-duration-fast), background var(--motion-duration-fast), transform var(--motion-duration-fast);
  }

  .measure-match__station--hot {
    background: color-mix(in srgb, var(--color-accent-primary) 14%, var(--color-surface-muted));
  }

  .measure-match__station--success {
    border-color: var(--color-accent-success);
    background: color-mix(in srgb, var(--color-accent-success) 14%, var(--color-surface-muted));
    transform: scale(1.01);
  }

  .measure-match__station--miss {
    border-color: color-mix(in srgb, var(--color-accent-warning) 72%, var(--color-border));
    background: color-mix(in srgb, var(--color-accent-warning) 12%, var(--color-surface-muted));
  }

  .measure-match__station-title {
    display: grid;
    justify-items: center;
    text-align: center;
    color: var(--color-text-primary);
    gap: var(--space-2xs);
  }

  .measure-match__ruler {
    position: relative;
    inline-size: min(420px, 100%);
    block-size: 54px;
    border-radius: var(--radius-md);
    border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
    background:
      repeating-linear-gradient(
        to right,
        color-mix(in srgb, var(--color-border) 42%, transparent) 0 2px,
        transparent 2px 24px
      ),
      color-mix(in srgb, var(--color-surface) 86%, white 14%);
    overflow: hidden;
  }

  .measure-match__ruler-target,
  .measure-match__ruler-current {
    position: absolute;
    inset-inline-start: var(--space-xs);
    block-size: 12px;
    border-radius: var(--radius-full);
  }

  .measure-match__ruler-target {
    inset-block-end: var(--space-sm);
    background: color-mix(in srgb, var(--color-accent-warning) 80%, transparent);
    opacity: 0.45;
  }

  .measure-match__ruler-current {
    inset-block-start: var(--space-sm);
    background: color-mix(in srgb, var(--color-accent-primary) 84%, white 16%);
  }

  .measure-match__balance {
    position: relative;
    inline-size: min(340px, 100%);
    block-size: 74px;
  }

  .measure-match__balance-beam {
    position: absolute;
    inset-inline-start: 50%;
    inset-block-start: 26px;
    inline-size: 72%;
    block-size: 6px;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-accent-primary) 78%, var(--color-text-primary));
    transform-origin: center;
    transition: transform var(--motion-duration-base) var(--motion-ease-bounce);
  }

  .measure-match__balance-pan {
    position: absolute;
    inline-size: 68px;
    block-size: 28px;
    inset-block-end: 0;
    border-radius: 0 0 var(--radius-md) var(--radius-md);
    border: 2px solid color-mix(in srgb, var(--color-border) 68%, transparent);
    background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  }

  .measure-match__balance-pan--left {
    inset-inline-start: 16%;
  }

  .measure-match__balance-pan--right {
    inset-inline-end: 16%;
  }

  .measure-match__cup {
    position: relative;
    inline-size: 94px;
    block-size: 118px;
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    border: 2px solid color-mix(in srgb, var(--color-border) 70%, transparent);
    background: color-mix(in srgb, var(--color-surface) 86%, white 14%);
    overflow: hidden;
  }

  .measure-match__cup-target {
    position: absolute;
    inset-inline: 10px;
    block-size: 2px;
    background: color-mix(in srgb, var(--color-accent-warning) 86%, transparent);
    opacity: 0.7;
  }

  .measure-match__cup-fill {
    position: absolute;
    inset-inline: 10px;
    inset-block-end: 8px;
    border-radius: var(--radius-sm);
    background: linear-gradient(180deg, color-mix(in srgb, var(--color-accent-info) 68%, white), var(--color-accent-info));
    transition: block-size var(--motion-duration-base) ease;
  }

  .measure-match__controls {
    display: grid;
    grid-template-columns: repeat(3, minmax(48px, 1fr));
    gap: var(--space-xs);
  }

  .measure-match__choices {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
    gap: var(--space-sm);
  }

  .measure-match__choice {
    min-block-size: 120px;
    min-inline-size: 48px;
    border-radius: var(--radius-md);
    border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
    background: var(--color-surface);
    color: var(--color-text-primary);
    padding: var(--space-sm);
    display: grid;
    gap: var(--space-2xs);
    justify-items: center;
    align-content: center;
    transition: transform var(--motion-duration-fast), border-color var(--motion-duration-fast), box-shadow var(--motion-duration-fast);
  }

  .measure-match__choice:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--color-accent-primary) 58%, var(--color-border));
  }

  .measure-match__choice--selected {
    border-color: color-mix(in srgb, var(--color-accent-primary) 78%, var(--color-border));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-primary) 22%, transparent);
  }

  .measure-match__choice--highlight {
    border-color: var(--color-accent-success);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent-success) 20%, transparent);
  }

  .measure-match__choice-emoji {
    font-size: 1.8rem;
    line-height: 1;
  }

  .measure-match__choice-label {
    font-size: var(--font-size-sm);
    text-align: center;
    line-height: 1.3;
  }

  .measure-match__choice-scale {
    inline-size: 100%;
    block-size: 10px;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-surface-muted) 72%, white 28%);
    overflow: hidden;
  }

  .measure-match__choice-scale > span {
    display: block;
    block-size: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, color-mix(in srgb, var(--color-accent-primary) 86%, white), var(--color-accent-primary));
  }

  .measure-match--summary,
  .measure-match--checkpoint {
    display: grid;
  }

  .measure-match__celebration {
    justify-self: center;
  }

  .measure-match__summary-text,
  .measure-match__summary-note {
    margin: 0;
    text-align: center;
    color: var(--color-text-secondary);
  }

  .measure-match__actions {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    justify-self: center;
  }

  @media (max-width: 920px) {
    .measure-match__choices {
      grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .measure-match__station,
    .measure-match__balance-beam,
    .measure-match__cup-fill,
    .measure-match__choice {
      transition: none !important;
    }

    .measure-match__progress-dot--active {
      transform: none;
    }
  }
`;
