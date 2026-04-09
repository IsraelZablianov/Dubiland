import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import type { GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';

type LetterId =
  | 'alef'
  | 'bet'
  | 'gimel'
  | 'dalet'
  | 'he'
  | 'vav'
  | 'zayin'
  | 'het'
  | 'tet'
  | 'yod'
  | 'kaf'
  | 'lamed'
  | 'mem'
  | 'nun'
  | 'samekh'
  | 'ayin'
  | 'pe'
  | 'tsadi'
  | 'qof'
  | 'resh'
  | 'shin'
  | 'tav';

type LetterAudioKey = `letters.pronunciation.${LetterId}`;
type GameLevelId = 1 | 2 | 3;
type HintTone = 'neutral' | 'hint' | 'success';

type StatusKey =
  | LetterAudioKey
  | 'games.letterTracingTrail.instructions.intro'
  | 'games.letterTracingTrail.instructions.listenToLetter'
  | 'games.letterTracingTrail.instructions.startAtDot'
  | 'games.letterTracingTrail.instructions.followPath'
  | 'games.letterTracingTrail.instructions.chooseAndTrace'
  | 'games.letterTracingTrail.instructions.tapReplay'
  | 'games.letterTracingTrail.letterPrompt.listen'
  | 'games.letterTracingTrail.letterPrompt.chooseCorrect'
  | 'games.letterTracingTrail.letterPrompt.nowTrace'
  | 'games.letterTracingTrail.letterPrompt.matchSound'
  | 'games.letterTracingTrail.strokeHint.traceSlowly'
  | 'games.letterTracingTrail.strokeHint.stayOnTrack'
  | 'games.letterTracingTrail.strokeHint.startAgainTogether'
  | 'games.letterTracingTrail.strokeHint.watchGhostHand'
  | 'games.letterTracingTrail.completionPraise.tracedBeautifully'
  | 'games.letterTracingTrail.completionPraise.greatPersistence'
  | 'games.letterTracingTrail.completionPraise.readyForNextLetter'
  | 'games.letterTracingTrail.feedback.encouragement.keepTrying'
  | 'games.letterTracingTrail.feedback.encouragement.almostThere'
  | 'games.letterTracingTrail.feedback.encouragement.tryAgain'
  | 'games.letterTracingTrail.feedback.success.wellDone'
  | 'games.letterTracingTrail.feedback.success.amazing'
  | 'games.letterTracingTrail.feedback.success.celebrate'
  | 'feedback.greatEffort'
  | 'feedback.excellent'
  | 'feedback.keepGoing'
  | 'feedback.youDidIt';

type AudioKey = StatusKey;
type HintTrend = ParentSummaryMetrics['hintTrend'];

type PatternId = 'hook' | 'arch' | 'zig' | 'loop' | 'stairs' | 'swoop' | 'split' | 'bridge';

interface Point {
  x: number;
  y: number;
}

interface RoundMessage {
  key: StatusKey;
  tone: HintTone;
}

interface RoundState {
  id: string;
  roundNumber: number;
  level: GameLevelId;
  targetLetter: LetterId;
  optionLetters: LetterId[];
  pathPoints: Point[];
  guidePoints: Point[];
  startPoint: Point;
  hintPoints: Point[];
  fallbackMode: boolean;
  requiresSelection: boolean;
  contrastMode: boolean;
}

interface SessionStats {
  firstAttemptSuccesses: number;
  hintUsageByRound: number[];
  highestLevelReached: GameLevelId;
}

type AudioManifest = Record<string, string>;

const TRACE_VIEW_WIDTH = 340;
const TRACE_VIEW_HEIGHT = 220;
const TOTAL_ROUNDS = 8;
const MIDPOINT_ROUND = 4;

const LETTER_AUDIO_KEY_BY_ID: Record<LetterId, LetterAudioKey> = {
  alef: 'letters.pronunciation.alef',
  bet: 'letters.pronunciation.bet',
  gimel: 'letters.pronunciation.gimel',
  dalet: 'letters.pronunciation.dalet',
  he: 'letters.pronunciation.he',
  vav: 'letters.pronunciation.vav',
  zayin: 'letters.pronunciation.zayin',
  het: 'letters.pronunciation.het',
  tet: 'letters.pronunciation.tet',
  yod: 'letters.pronunciation.yod',
  kaf: 'letters.pronunciation.kaf',
  lamed: 'letters.pronunciation.lamed',
  mem: 'letters.pronunciation.mem',
  nun: 'letters.pronunciation.nun',
  samekh: 'letters.pronunciation.samekh',
  ayin: 'letters.pronunciation.ayin',
  pe: 'letters.pronunciation.pe',
  tsadi: 'letters.pronunciation.tsadi',
  qof: 'letters.pronunciation.qof',
  resh: 'letters.pronunciation.resh',
  shin: 'letters.pronunciation.shin',
  tav: 'letters.pronunciation.tav',
};

const LETTER_POOL_BY_LEVEL: Record<GameLevelId, LetterId[]> = {
  1: ['alef', 'bet', 'gimel', 'dalet', 'he', 'vav'],
  2: ['alef', 'bet', 'gimel', 'dalet', 'he', 'vav', 'zayin', 'het', 'tet', 'yod', 'kaf', 'lamed'],
  3: [
    'alef',
    'bet',
    'gimel',
    'dalet',
    'he',
    'vav',
    'zayin',
    'het',
    'tet',
    'yod',
    'kaf',
    'lamed',
    'mem',
    'nun',
    'samekh',
    'ayin',
    'pe',
    'tsadi',
    'qof',
    'resh',
    'shin',
    'tav',
  ],
};

const SIMILAR_LETTERS: Record<LetterId, LetterId[]> = {
  alef: ['ayin', 'he'],
  bet: ['kaf', 'pe'],
  gimel: ['nun', 'tsadi'],
  dalet: ['resh', 'kaf'],
  he: ['het', 'alef'],
  vav: ['yod', 'nun'],
  zayin: ['vav', 'nun'],
  het: ['he', 'tav'],
  tet: ['samekh', 'qof'],
  yod: ['vav', 'kaf'],
  kaf: ['bet', 'dalet'],
  lamed: ['kaf', 'tav'],
  mem: ['samekh', 'nun'],
  nun: ['gimel', 'zayin'],
  samekh: ['mem', 'tet'],
  ayin: ['alef', 'tsadi'],
  pe: ['bet', 'qof'],
  tsadi: ['nun', 'ayin'],
  qof: ['tet', 'resh'],
  resh: ['dalet', 'qof'],
  shin: ['tav', 'samekh'],
  tav: ['het', 'shin'],
};

const TRACE_PATTERN_POINTS: Record<PatternId, Point[]> = {
  hook: [
    { x: 286, y: 28 },
    { x: 214, y: 28 },
    { x: 214, y: 176 },
    { x: 124, y: 192 },
  ],
  arch: [
    { x: 68, y: 184 },
    { x: 120, y: 84 },
    { x: 176, y: 42 },
    { x: 232, y: 84 },
    { x: 286, y: 184 },
  ],
  zig: [
    { x: 60, y: 182 },
    { x: 128, y: 80 },
    { x: 190, y: 182 },
    { x: 254, y: 80 },
    { x: 308, y: 182 },
  ],
  loop: [
    { x: 142, y: 36 },
    { x: 224, y: 36 },
    { x: 266, y: 98 },
    { x: 224, y: 162 },
    { x: 142, y: 162 },
    { x: 96, y: 98 },
    { x: 142, y: 36 },
    { x: 252, y: 186 },
  ],
  stairs: [
    { x: 80, y: 46 },
    { x: 212, y: 46 },
    { x: 212, y: 92 },
    { x: 124, y: 92 },
    { x: 124, y: 132 },
    { x: 242, y: 132 },
    { x: 242, y: 178 },
    { x: 90, y: 178 },
  ],
  swoop: [
    { x: 286, y: 40 },
    { x: 224, y: 98 },
    { x: 176, y: 124 },
    { x: 126, y: 154 },
    { x: 82, y: 196 },
  ],
  split: [
    { x: 94, y: 38 },
    { x: 94, y: 178 },
    { x: 178, y: 104 },
    { x: 266, y: 178 },
    { x: 266, y: 40 },
  ],
  bridge: [
    { x: 66, y: 162 },
    { x: 122, y: 82 },
    { x: 178, y: 82 },
    { x: 236, y: 162 },
    { x: 302, y: 162 },
  ],
};

const PATTERN_BY_LETTER: Record<LetterId, PatternId> = {
  alef: 'hook',
  bet: 'loop',
  gimel: 'swoop',
  dalet: 'stairs',
  he: 'bridge',
  vav: 'hook',
  zayin: 'split',
  het: 'arch',
  tet: 'loop',
  yod: 'swoop',
  kaf: 'hook',
  lamed: 'zig',
  mem: 'bridge',
  nun: 'split',
  samekh: 'loop',
  ayin: 'arch',
  pe: 'stairs',
  tsadi: 'zig',
  qof: 'bridge',
  resh: 'swoop',
  shin: 'split',
  tav: 'stairs',
};

const ROUND_PRAISE_ROTATION: Array<
  | 'games.letterTracingTrail.completionPraise.tracedBeautifully'
  | 'games.letterTracingTrail.completionPraise.greatPersistence'
  | 'games.letterTracingTrail.completionPraise.readyForNextLetter'
> = [
  'games.letterTracingTrail.completionPraise.tracedBeautifully',
  'games.letterTracingTrail.completionPraise.greatPersistence',
  'games.letterTracingTrail.completionPraise.readyForNextLetter',
];

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

function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function expandPolyline(points: Point[], stepSize: number): Point[] {
  const expanded: Point[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const segmentLength = distance(start, end);
    const steps = Math.max(1, Math.ceil(segmentLength / stepSize));

    for (let step = 0; step < steps; step += 1) {
      const progress = step / steps;
      expanded.push({
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
      });
    }
  }

  expanded.push(points[points.length - 1]);
  return expanded;
}

function buildHintPoints(pathPoints: Point[]): Point[] {
  if (pathPoints.length <= 2) {
    return pathPoints;
  }

  const hints: Point[] = [];
  for (let index = 1; index < pathPoints.length - 1; index += 2) {
    hints.push(pathPoints[index]);
  }
  return hints;
}

function calculateCoverage(guidePoints: Point[], tracePoints: Point[], tolerance: number): number {
  if (guidePoints.length === 0 || tracePoints.length === 0) {
    return 0;
  }

  let covered = 0;
  for (const guidePoint of guidePoints) {
    const touched = tracePoints.some((tracePoint) => distance(guidePoint, tracePoint) <= tolerance);
    if (touched) {
      covered += 1;
    }
  }

  return covered / guidePoints.length;
}

function snapToGuide(point: Point, guidePoints: Point[], radius: number): Point {
  let bestPoint = point;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const guidePoint of guidePoints) {
    const currentDistance = distance(point, guidePoint);
    if (currentDistance < bestDistance) {
      bestDistance = currentDistance;
      bestPoint = guidePoint;
    }
  }

  if (bestDistance <= radius) {
    return bestPoint;
  }

  return point;
}

function getHintTrend(hintUsageByRound: number[]): HintTrend {
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

function getStableRange(level: GameLevelId): StableRange {
  if (level >= 3) {
    return '1-10';
  }
  if (level === 2) {
    return '1-5';
  }
  return '1-3';
}

function getFeedbackKeyFromHintTrend(hintTrend: HintTrend): StatusKey {
  if (hintTrend === 'improving') {
    return 'feedback.excellent';
  }
  if (hintTrend === 'steady') {
    return 'feedback.keepGoing';
  }
  return 'feedback.greatEffort';
}

function isAudioManifest(value: unknown): value is AudioManifest {
  return Boolean(value) && typeof value === 'object';
}

function sortPair(a: LetterId, b: LetterId): [LetterId, LetterId] {
  return a < b ? [a, b] : [b, a];
}

function buildRound(options: {
  roundNumber: number;
  level: GameLevelId;
  fallbackMode: boolean;
  contrastPair: [LetterId, LetterId] | null;
  previousLetter: LetterId | null;
}): RoundState {
  const { roundNumber, level, fallbackMode, contrastPair, previousLetter } = options;
  const pool = LETTER_POOL_BY_LEVEL[level];
  const canUseContrastPair =
    level === 3 &&
    contrastPair !== null &&
    contrastPair.every((letter) => pool.includes(letter));

  let targetLetter = pickRandom(pool);
  let contrastMode = false;

  if (canUseContrastPair && contrastPair) {
    targetLetter = pickRandom(contrastPair);
    contrastMode = true;
  } else if (previousLetter && pool.length > 1 && targetLetter === previousLetter) {
    const alternatives = pool.filter((letter) => letter !== previousLetter);
    targetLetter = pickRandom(alternatives);
  }

  let optionLetters: LetterId[] = [targetLetter];
  if (level === 3) {
    const similarOptions = SIMILAR_LETTERS[targetLetter].filter((letter) => pool.includes(letter));

    optionLetters = [targetLetter];

    if (contrastMode && contrastPair) {
      const pairedLetter = contrastPair.find((letter) => letter !== targetLetter);
      if (pairedLetter) {
        optionLetters.push(pairedLetter);
      }
    }

    if (optionLetters.length < 2 && similarOptions.length > 0) {
      optionLetters.push(similarOptions[0]);
    }

    const randomCandidates = pool.filter((letter) => !optionLetters.includes(letter));
    while (optionLetters.length < 3 && randomCandidates.length > 0) {
      const candidateIndex = randomInt(0, randomCandidates.length - 1);
      const [candidate] = randomCandidates.splice(candidateIndex, 1);
      optionLetters.push(candidate);
    }

    optionLetters = shuffle(optionLetters).slice(0, 3);
  }

  const pathPoints = TRACE_PATTERN_POINTS[PATTERN_BY_LETTER[targetLetter]];
  const guidePoints = expandPolyline(pathPoints, 8);

  return {
    id: `letter-tracing-${roundNumber}-${level}-${targetLetter}-${contrastMode ? 'contrast' : 'normal'}`,
    roundNumber,
    level,
    targetLetter,
    optionLetters,
    pathPoints,
    guidePoints,
    startPoint: pathPoints[0],
    hintPoints: buildHintPoints(pathPoints),
    fallbackMode,
    requiresSelection: level === 3,
    contrastMode,
  };
}

function getSvgPoint(
  event: React.PointerEvent<SVGSVGElement>,
  svgElement: SVGSVGElement,
): Point {
  const bounds = svgElement.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width) * TRACE_VIEW_WIDTH;
  const y = ((event.clientY - bounds.top) / bounds.height) * TRACE_VIEW_HEIGHT;

  return {
    x: Math.min(TRACE_VIEW_WIDTH, Math.max(0, x)),
    y: Math.min(TRACE_VIEW_HEIGHT, Math.max(0, y)),
  };
}

export function LetterTracingTrailGame({ onComplete, audio }: GameProps) {
  const { t } = useTranslation('common');

  const [audioManifest, setAudioManifest] = useState<AudioManifest | null>(null);

  const [roundNumber, setRoundNumber] = useState(1);
  const [level, setLevel] = useState<GameLevelId>(1);
  const [cleanRoundsInRow, setCleanRoundsInRow] = useState(0);
  const [struggleRoundsInRow, setStruggleRoundsInRow] = useState(0);
  const [fallbackRoundsRemaining, setFallbackRoundsRemaining] = useState(0);
  const [contrastPair, setContrastPair] = useState<[LetterId, LetterId] | null>(null);

  const [midpointPaused, setMidpointPaused] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [pendingRoundState, setPendingRoundState] = useState<RoundState | null>(null);

  const [starTokens, setStarTokens] = useState(0);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    firstAttemptSuccesses: 0,
    hintUsageByRound: [],
    highestLevelReached: 1,
  });

  const [round, setRound] = useState<RoundState>(() =>
    buildRound({
      roundNumber: 1,
      level: 1,
      fallbackMode: false,
      contrastPair: null,
      previousLetter: null,
    }),
  );

  const [selectedLetterId, setSelectedLetterId] = useState<LetterId>(round.targetLetter);
  const [tracePoints, setTracePoints] = useState<Point[]>([]);
  const [traceCoverage, setTraceCoverage] = useState(0);
  const [isTracing, setIsTracing] = useState(false);
  const [usedHintThisRound, setUsedHintThisRound] = useState(false);
  const [mistakesThisRound, setMistakesThisRound] = useState(0);
  const [hintStep, setHintStep] = useState(0);
  const [highlightGuide, setHighlightGuide] = useState(false);
  const [showGhostHand, setShowGhostHand] = useState(false);
  const [traceCelebrate, setTraceCelebrate] = useState(false);

  const [roundMessage, setRoundMessage] = useState<RoundMessage>({
    key: 'games.letterTracingTrail.instructions.intro',
    tone: 'neutral',
  });

  const previousLetterRef = useRef<LetterId | null>(round.targetLetter);
  const completionReportedRef = useRef(false);
  const tracePointsRef = useRef<Point[]>([]);
  const mistakesThisRoundRef = useRef(0);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const tracingEnabled =
    !sessionComplete &&
    !midpointPaused &&
    (!round.requiresSelection || selectedLetterId === round.targetLetter);

  const startTolerance = round.fallbackMode ? 44 : level === 1 ? 36 : level === 2 ? 30 : 26;
  const completionThreshold = round.fallbackMode ? 0.52 : level === 1 ? 0.58 : level === 2 ? 0.68 : 0.76;
  const coverageTolerance = round.fallbackMode ? 24 : level === 1 ? 20 : level === 2 ? 18 : 15;
  const shouldSnapToPath = round.fallbackMode || level === 1 || hintStep >= 2;
  const snapRadius = round.fallbackMode ? 26 : level === 1 ? 18 : 10;

  const traceGuideStrokeWidth = round.fallbackMode ? 28 : level === 1 ? 24 : level === 2 ? 18 : 14;
  const traceInkStrokeWidth = round.fallbackMode ? 16 : level === 1 ? 12 : level === 2 ? 10 : 9;

  const roundProgressSegments = useMemo(
    () => Array.from({ length: TOTAL_ROUNDS }, (_, index) => index + 1),
    [],
  );

  const attemptedLetters = sessionStats.hintUsageByRound.length;
  const independentLetters = sessionStats.firstAttemptSuccesses;

  const currentLetterAudioKey = LETTER_AUDIO_KEY_BY_ID[round.targetLetter];

  const currentLetterGlyph = useMemo(() => {
    const pronunciation = t(currentLetterAudioKey);
    return Array.from(pronunciation)[0] ?? pronunciation;
  }, [currentLetterAudioKey, t]);

  const targetPath = useMemo(
    () => round.pathPoints.map((point) => `${point.x},${point.y}`).join(' '),
    [round.pathPoints],
  );

  const tracePath = useMemo(
    () => tracePoints.map((point) => `${point.x},${point.y}`).join(' '),
    [tracePoints],
  );

  const hintPath = useMemo(
    () => round.hintPoints.map((point) => `${point.x},${point.y}`).join(' '),
    [round.hintPoints],
  );

  useEffect(() => {
    let mounted = true;

    void fetch('/audio/he/manifest.json')
      .then((response) => response.json())
      .then((manifest: unknown) => {
        if (!mounted || !isAudioManifest(manifest)) {
          return;
        }
        setAudioManifest(manifest);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const resolveAudioPath = useCallback(
    (key: AudioKey): string | null => {
      if (!audioManifest) {
        return null;
      }
      return audioManifest[`common.${key}`] ?? null;
    },
    [audioManifest],
  );

  const playAudioKey = useCallback(
    (key: AudioKey) => {
      const path = resolveAudioPath(key);
      if (!path) {
        return;
      }
      audio.play(path);
    },
    [audio, resolveAudioPath],
  );

  const setMessageWithAudio = useCallback(
    (key: StatusKey, tone: HintTone) => {
      setRoundMessage({ key, tone });
      playAudioKey(key);
    },
    [playAudioKey],
  );

  const setMistakeState = useCallback((nextMistakes: number) => {
    mistakesThisRoundRef.current = nextMistakes;
    setMistakesThisRound(nextMistakes);
  }, []);

  const clearTrace = useCallback(() => {
    tracePointsRef.current = [];
    setTracePoints([]);
    setTraceCoverage(0);
    setIsTracing(false);
    setTraceCelebrate(false);
  }, []);

  const resetRoundInteraction = useCallback(
    (nextRound: RoundState) => {
      clearTrace();
      setUsedHintThisRound(false);
      setMistakeState(0);
      setHintStep(0);
      setHighlightGuide(false);
      setShowGhostHand(false);
      setTraceCelebrate(false);
      setSelectedLetterId(nextRound.requiresSelection ? ('' as LetterId) : nextRound.targetLetter);
    },
    [clearTrace, setMistakeState],
  );

  const loadRound = useCallback(
    (nextRound: RoundState) => {
      previousLetterRef.current = nextRound.targetLetter;
      setRound(nextRound);
      resetRoundInteraction(nextRound);

      if (nextRound.contrastMode) {
        setContrastPair(null);
      }
    },
    [resetRoundInteraction],
  );

  const finalizeSession = useCallback(
    (stats: SessionStats, stars: number) => {
      const roundsPlayed = stats.hintUsageByRound.length;
      const firstAttemptSuccessRate =
        roundsPlayed === 0
          ? 0
          : Math.round((stats.firstAttemptSuccesses / roundsPlayed) * 100);
      const hintTrend = getHintTrend(stats.hintUsageByRound);

      setSessionComplete(true);
      setMessageWithAudio(getFeedbackKeyFromHintTrend(hintTrend), 'success');
      playAudioKey('games.letterTracingTrail.feedback.success.celebrate');

      if (completionReportedRef.current) {
        return;
      }
      completionReportedRef.current = true;

      onComplete({
        stars: Math.min(3, Math.max(1, stars)),
        score: stats.firstAttemptSuccesses * 15 + roundsPlayed * 8,
        completed: true,
        roundsCompleted: roundsPlayed,
        summaryMetrics: {
          highestStableRange: getStableRange(stats.highestLevelReached),
          firstAttemptSuccessRate,
          hintTrend,
        },
      });
    },
    [onComplete, playAudioKey, setMessageWithAudio],
  );

  const completeRound = useCallback(() => {
    if (sessionComplete || midpointPaused) {
      return;
    }

    const roundWasStruggle = usedHintThisRound || mistakesThisRoundRef.current > 0;

    const updatedStats: SessionStats = {
      firstAttemptSuccesses: sessionStats.firstAttemptSuccesses + (roundWasStruggle ? 0 : 1),
      hintUsageByRound: [...sessionStats.hintUsageByRound, usedHintThisRound ? 1 : 0],
      highestLevelReached: Math.max(sessionStats.highestLevelReached, round.level) as GameLevelId,
    };

    const nextStarTokens = updatedStats.hintUsageByRound.length % 2 === 0
      ? starTokens + 1
      : starTokens;

    setSessionStats(updatedStats);
    setStarTokens(nextStarTokens);
    setTraceCelebrate(true);

    const roundPraise =
      ROUND_PRAISE_ROTATION[(updatedStats.hintUsageByRound.length - 1) % ROUND_PRAISE_ROTATION.length];
    setMessageWithAudio(roundPraise, 'success');

    if (updatedStats.hintUsageByRound.length >= TOTAL_ROUNDS) {
      window.setTimeout(() => {
        finalizeSession(updatedStats, nextStarTokens);
      }, 560);
      return;
    }

    let nextLevel = level;
    let nextCleanRoundsInRow = roundWasStruggle ? 0 : cleanRoundsInRow + 1;
    let nextStruggleRoundsInRow = roundWasStruggle ? struggleRoundsInRow + 1 : 0;
    let nextFallbackRoundsRemaining = Math.max(0, fallbackRoundsRemaining - 1);

    if (nextStruggleRoundsInRow >= 2) {
      nextFallbackRoundsRemaining = Math.max(nextFallbackRoundsRemaining, 2);
      nextStruggleRoundsInRow = 0;
    }

    if (nextCleanRoundsInRow >= 3 && level < 3) {
      nextLevel = (level + 1) as GameLevelId;
      nextCleanRoundsInRow = 0;
    }

    const nextRoundNumber = round.roundNumber + 1;
    const nextRound = buildRound({
      roundNumber: nextRoundNumber,
      level: nextLevel,
      fallbackMode: nextFallbackRoundsRemaining > 0,
      contrastPair,
      previousLetter: round.targetLetter,
    });

    setRoundNumber(nextRoundNumber);
    setLevel(nextLevel);
    setCleanRoundsInRow(nextCleanRoundsInRow);
    setStruggleRoundsInRow(nextStruggleRoundsInRow);
    setFallbackRoundsRemaining(nextFallbackRoundsRemaining);

    if (nextRoundNumber === MIDPOINT_ROUND + 1) {
      setPendingRoundState(nextRound);
      setMidpointPaused(true);
      return;
    }

    window.setTimeout(() => {
      loadRound(nextRound);
    }, 620);
  }, [
    cleanRoundsInRow,
    contrastPair,
    fallbackRoundsRemaining,
    finalizeSession,
    level,
    loadRound,
    midpointPaused,
    round,
    sessionComplete,
    sessionStats,
    setMessageWithAudio,
    starTokens,
    struggleRoundsInRow,
    usedHintThisRound,
  ]);

  const registerTraceMistake = useCallback(
    (mode: 'selection' | 'trace') => {
      if (sessionComplete || midpointPaused) {
        return;
      }

      setUsedHintThisRound(true);
      setTraceCelebrate(false);
      clearTrace();

      const nextMistakes = mistakesThisRoundRef.current + 1;
      setMistakeState(nextMistakes);

      const nextHintStep = Math.min(nextMistakes, 3);
      setHintStep(nextHintStep);

      if (nextHintStep === 1) {
        setMessageWithAudio(
          mode === 'selection'
            ? 'games.letterTracingTrail.letterPrompt.chooseCorrect'
            : 'games.letterTracingTrail.strokeHint.traceSlowly',
          'hint',
        );
        playAudioKey('games.letterTracingTrail.feedback.encouragement.keepTrying');
        return;
      }

      if (nextHintStep === 2) {
        setHighlightGuide(true);
        setMessageWithAudio('games.letterTracingTrail.strokeHint.stayOnTrack', 'hint');
        playAudioKey('games.letterTracingTrail.feedback.encouragement.almostThere');
        return;
      }

      setHighlightGuide(true);
      setShowGhostHand(true);
      setMessageWithAudio('games.letterTracingTrail.strokeHint.watchGhostHand', 'hint');
      playAudioKey('games.letterTracingTrail.feedback.encouragement.tryAgain');
    },
    [
      clearTrace,
      midpointPaused,
      playAudioKey,
      sessionComplete,
      setMessageWithAudio,
      setMistakeState,
    ],
  );

  const appendTracePoint = useCallback(
    (point: Point) => {
      const nextPoint = shouldSnapToPath
        ? snapToGuide(point, round.guidePoints, snapRadius)
        : point;

      const previousPoint = tracePointsRef.current[tracePointsRef.current.length - 1];
      if (previousPoint && distance(previousPoint, nextPoint) < 2.4) {
        return;
      }

      const nextTrace = [...tracePointsRef.current, nextPoint];
      tracePointsRef.current = nextTrace;
      setTracePoints(nextTrace);
      setTraceCoverage(calculateCoverage(round.guidePoints, nextTrace, coverageTolerance));
    },
    [coverageTolerance, round.guidePoints, shouldSnapToPath, snapRadius],
  );

  const finalizeTraceAttempt = useCallback(() => {
    if (!tracingEnabled) {
      return;
    }

    const coverage = calculateCoverage(round.guidePoints, tracePointsRef.current, coverageTolerance);
    setTraceCoverage(coverage);

    if (tracePointsRef.current.length < 5) {
      registerTraceMistake('trace');
      return;
    }

    if (coverage >= completionThreshold) {
      completeRound();
      return;
    }

    registerTraceMistake('trace');
  }, [
    completeRound,
    completionThreshold,
    coverageTolerance,
    registerTraceMistake,
    round.guidePoints,
    tracingEnabled,
  ]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (!tracingEnabled || !svgRef.current) {
        return;
      }

      const point = getSvgPoint(event, svgRef.current);
      if (distance(point, round.startPoint) > startTolerance) {
        registerTraceMistake('trace');
        setMessageWithAudio('games.letterTracingTrail.strokeHint.startAgainTogether', 'hint');
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      setIsTracing(true);
      setTraceCelebrate(false);
      setHighlightGuide(false);
      setShowGhostHand(false);

      tracePointsRef.current = [round.startPoint];
      setTracePoints([round.startPoint]);
      setTraceCoverage(0);
      setRoundMessage({ key: 'games.letterTracingTrail.instructions.followPath', tone: 'neutral' });
    },
    [
      registerTraceMistake,
      round.startPoint,
      setMessageWithAudio,
      startTolerance,
      tracingEnabled,
    ],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (!isTracing || !svgRef.current) {
        return;
      }

      appendTracePoint(getSvgPoint(event, svgRef.current));
    },
    [appendTracePoint, isTracing],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (!isTracing || !svgRef.current) {
        return;
      }

      appendTracePoint(getSvgPoint(event, svgRef.current));
      setIsTracing(false);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      finalizeTraceAttempt();
    },
    [appendTracePoint, finalizeTraceAttempt, isTracing],
  );

  const handleLetterSelection = useCallback(
    (optionLetter: LetterId) => {
      if (!round.requiresSelection || sessionComplete || midpointPaused) {
        return;
      }

      if (optionLetter === round.targetLetter) {
        setSelectedLetterId(optionLetter);
        setMessageWithAudio('games.letterTracingTrail.letterPrompt.nowTrace', 'neutral');

        window.setTimeout(() => {
          playAudioKey(LETTER_AUDIO_KEY_BY_ID[optionLetter]);
        }, 220);

        return;
      }

      setContrastPair(sortPair(round.targetLetter, optionLetter));
      registerTraceMistake('selection');
    },
    [midpointPaused, playAudioKey, registerTraceMistake, round, sessionComplete, setMessageWithAudio],
  );

  const handleReplayInstruction = useCallback(() => {
    if (sessionComplete || midpointPaused) {
      return;
    }

    setMessageWithAudio('games.letterTracingTrail.instructions.tapReplay', 'neutral');

    window.setTimeout(() => {
      if (round.requiresSelection && selectedLetterId !== round.targetLetter) {
        setMessageWithAudio('games.letterTracingTrail.letterPrompt.matchSound', 'neutral');
      } else {
        setMessageWithAudio('games.letterTracingTrail.instructions.startAtDot', 'neutral');
      }

      window.setTimeout(() => {
        playAudioKey(LETTER_AUDIO_KEY_BY_ID[round.targetLetter]);
      }, 220);
    }, 220);
  }, [
    midpointPaused,
    playAudioKey,
    round.requiresSelection,
    round.targetLetter,
    selectedLetterId,
    sessionComplete,
    setMessageWithAudio,
  ]);

  const handleResetTrace = useCallback(() => {
    if (sessionComplete || midpointPaused) {
      return;
    }

    clearTrace();
    setMessageWithAudio('games.letterTracingTrail.strokeHint.startAgainTogether', 'neutral');
  }, [clearTrace, midpointPaused, sessionComplete, setMessageWithAudio]);

  const handleCheckTrace = useCallback(() => {
    if (sessionComplete || midpointPaused || !tracingEnabled) {
      return;
    }

    finalizeTraceAttempt();
  }, [finalizeTraceAttempt, midpointPaused, sessionComplete, tracingEnabled]);

  const handleContinueAfterMidpoint = useCallback(() => {
    if (!pendingRoundState) {
      return;
    }

    setMidpointPaused(false);
    loadRound(pendingRoundState);
    setPendingRoundState(null);
  }, [loadRound, pendingRoundState]);

  useEffect(() => {
    if (midpointPaused || sessionComplete) {
      return;
    }

    const shouldChooseLetter = round.requiresSelection && selectedLetterId !== round.targetLetter;
    const instructionKey = shouldChooseLetter
      ? 'games.letterTracingTrail.instructions.chooseAndTrace'
      : 'games.letterTracingTrail.instructions.startAtDot';

    setRoundMessage({ key: instructionKey, tone: 'neutral' });
    playAudioKey(instructionKey);

    const timer = window.setTimeout(() => {
      if (shouldChooseLetter) {
        playAudioKey('games.letterTracingTrail.letterPrompt.matchSound');
      } else {
        playAudioKey('games.letterTracingTrail.instructions.followPath');
      }

      window.setTimeout(() => {
        playAudioKey(LETTER_AUDIO_KEY_BY_ID[round.targetLetter]);
      }, 230);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    midpointPaused,
    playAudioKey,
    round.id,
    round.requiresSelection,
    round.targetLetter,
    selectedLetterId,
    sessionComplete,
  ]);

  useEffect(() => {
    return () => {
      audio.stop();
    };
  }, [audio]);

  if (sessionComplete) {
    return (
      <div className="letter-tracing-trail letter-tracing-trail--complete">
        <Card padding="lg" className="letter-tracing-trail__shell">
          <h2 className="letter-tracing-trail__title">{t('feedback.youDidIt')}</h2>
          <p className="letter-tracing-trail__subtitle">{t('games.letterTracingTrail.feedback.success.amazing')}</p>

          <div className="letter-tracing-trail__stars" aria-label={t('feedback.excellent')}>
            {Array.from({ length: Math.max(1, starTokens) }).map((_, index) => (
              <span key={`star-${index}`} className="letter-tracing-trail__star" aria-hidden="true">
                ⭐
              </span>
            ))}
          </div>

          <Card padding="md" className="letter-tracing-trail__summary-card">
            <p>
              {t('parentDashboard.games.letterTracingTrail.progressSummary', {
                attemptedLetters,
                independentLetters,
              })}
            </p>
            <p>{t('parentDashboard.games.letterTracingTrail.nextStep')}</p>
          </Card>

          <p className="letter-tracing-trail__hint-note">
            {t(getFeedbackKeyFromHintTrend(getHintTrend(sessionStats.hintUsageByRound)))}
          </p>
        </Card>

        <style>{letterTracingTrailStyles}</style>
      </div>
    );
  }

  if (midpointPaused) {
    return (
      <div className="letter-tracing-trail letter-tracing-trail--midpoint">
        <Card padding="lg" className="letter-tracing-trail__shell">
          <h2 className="letter-tracing-trail__title">{t('feedback.greatEffort')}</h2>
          <p className="letter-tracing-trail__subtitle">{t('games.letterTracingTrail.completionPraise.readyForNextLetter')}</p>

          <Button
            variant="primary"
            size="lg"
            onClick={handleContinueAfterMidpoint}
            aria-label={t('nav.next')}
          >
            {t('nav.next')}
          </Button>
        </Card>

        <style>{letterTracingTrailStyles}</style>
      </div>
    );
  }

  return (
    <div className="letter-tracing-trail">
      <Card padding="lg" className="letter-tracing-trail__shell">
        <header className="letter-tracing-trail__header">
          <div className="letter-tracing-trail__heading">
            <h2 className="letter-tracing-trail__title">{t('games.letterTracingTrail.title')}</h2>
            <p className="letter-tracing-trail__subtitle">{t('games.letterTracingTrail.subtitle')}</p>
          </div>

          <div className="letter-tracing-trail__actions">
            <Button
              variant="secondary"
              size="md"
              onClick={handleReplayInstruction}
              aria-label={t('games.letterTracingTrail.instructions.tapReplay')}
            >
              🔊 {t('games.letterTracingTrail.instructions.tapReplay')}
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={handleResetTrace}
              aria-label={t('feedback.tryAgain')}
            >
              {t('feedback.tryAgain')}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleCheckTrace}
              aria-label={t('nav.finish')}
              disabled={!tracingEnabled}
            >
              {t('nav.finish')}
            </Button>
          </div>
        </header>

        <div className="letter-tracing-trail__progress" aria-label={t('games.estimatedTime', { minutes: 7 })}>
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
                className={`letter-tracing-trail__progress-dot letter-tracing-trail__progress-dot--${state}`}
                aria-hidden="true"
              />
            );
          })}
        </div>

        <p
          className={`letter-tracing-trail__message letter-tracing-trail__message--${roundMessage.tone}`}
          aria-live="polite"
        >
          {t(roundMessage.key)}
        </p>

        <section className="letter-tracing-trail__board">
          <Card padding="md" className="letter-tracing-trail__trace-card">
            <div className="letter-tracing-trail__trace-head">
              <span className="letter-tracing-trail__target-glyph" aria-hidden="true">
                {currentLetterGlyph}
              </span>

              <div className="letter-tracing-trail__metrics">
                <span aria-label={t('games.difficulty')} className="letter-tracing-trail__metric-pill">
                  🎯 {round.level}
                </span>
                <span aria-label={t('feedback.keepGoing')} className="letter-tracing-trail__metric-pill">
                  {Math.round(traceCoverage * 100)}%
                </span>
                <span aria-label={t('nav.next')} className="letter-tracing-trail__metric-pill">
                  {round.roundNumber}/{TOTAL_ROUNDS}
                </span>
              </div>
            </div>

            <svg
              ref={svgRef}
              viewBox={`0 0 ${TRACE_VIEW_WIDTH} ${TRACE_VIEW_HEIGHT}`}
              className={[
                'letter-tracing-trail__canvas',
                tracingEnabled ? 'letter-tracing-trail__canvas--active' : '',
                traceCelebrate ? 'letter-tracing-trail__canvas--celebrate' : '',
              ].join(' ')}
              role="img"
              aria-label={t('games.letterTracingTrail.instructions.followPath')}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <polyline
                points={targetPath}
                className={[
                  'letter-tracing-trail__guide-line',
                  highlightGuide || round.level === 1 || round.fallbackMode
                    ? 'letter-tracing-trail__guide-line--strong'
                    : '',
                ].join(' ')}
                strokeWidth={traceGuideStrokeWidth}
              />

              {showGhostHand && (
                <polyline
                  points={targetPath}
                  className="letter-tracing-trail__ghost-line"
                  strokeWidth={Math.max(8, traceGuideStrokeWidth - 4)}
                />
              )}

              {(round.level === 1 || round.fallbackMode || highlightGuide) && (
                <polyline
                  points={hintPath}
                  className="letter-tracing-trail__hint-line"
                  strokeWidth={5}
                />
              )}

              <polyline
                points={tracePath}
                className="letter-tracing-trail__trace-line"
                strokeWidth={traceInkStrokeWidth}
              />

              <circle
                className="letter-tracing-trail__start-dot"
                cx={round.startPoint.x}
                cy={round.startPoint.y}
                r={12}
              />
            </svg>
          </Card>

          <Card padding="md" className="letter-tracing-trail__choice-card">
            <p className="letter-tracing-trail__choice-instruction">
              {t(
                round.requiresSelection && selectedLetterId !== round.targetLetter
                  ? 'games.letterTracingTrail.letterPrompt.chooseCorrect'
                  : 'games.letterTracingTrail.letterPrompt.nowTrace',
              )}
            </p>

            {round.requiresSelection && (
              <div className="letter-tracing-trail__options-grid">
                {round.optionLetters.map((optionLetter) => {
                  const optionLabel = t(LETTER_AUDIO_KEY_BY_ID[optionLetter]);
                  const optionGlyph = Array.from(optionLabel)[0] ?? optionLabel;
                  const isSelected = selectedLetterId === optionLetter;

                  return (
                    <button
                      key={`${round.id}-option-${optionLetter}`}
                      type="button"
                      className={[
                        'letter-tracing-trail__option',
                        isSelected ? 'letter-tracing-trail__option--selected' : '',
                      ].join(' ')}
                      onClick={() => handleLetterSelection(optionLetter)}
                      aria-label={optionLabel}
                    >
                      <span className="letter-tracing-trail__option-glyph" aria-hidden="true">
                        {optionGlyph}
                      </span>
                      <span className="letter-tracing-trail__option-name">{optionLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="letter-tracing-trail__target-name-wrap">
              <span className="letter-tracing-trail__target-chip">{t(currentLetterAudioKey)}</span>
              {round.fallbackMode && (
                <span className="letter-tracing-trail__target-chip letter-tracing-trail__target-chip--support">
                  {t('games.letterTracingTrail.strokeHint.watchGhostHand')}
                </span>
              )}
            </div>
          </Card>
        </section>
      </Card>

      <style>{letterTracingTrailStyles}</style>
    </div>
  );
}

const letterTracingTrailStyles = `
  .letter-tracing-trail {
    display: flex;
    justify-content: center;
    padding: var(--space-xl);
    background: var(--color-theme-bg);
    min-height: 100%;
  }

  .letter-tracing-trail__shell {
    width: min(1120px, 100%);
    display: grid;
    gap: var(--space-md);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 26%, white);
  }

  .letter-tracing-trail__header {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
    align-items: center;
    justify-content: space-between;
  }

  .letter-tracing-trail__heading {
    display: grid;
    gap: var(--space-xs);
  }

  .letter-tracing-trail__title {
    font-size: var(--font-size-2xl);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-extrabold);
  }

  .letter-tracing-trail__subtitle {
    color: var(--color-text-secondary);
    font-size: var(--font-size-md);
  }

  .letter-tracing-trail__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .letter-tracing-trail__progress {
    display: grid;
    grid-template-columns: repeat(8, minmax(14px, 1fr));
    gap: var(--space-xs);
  }

  .letter-tracing-trail__progress-dot {
    height: 14px;
    border-radius: var(--radius-full);
    background: var(--color-star-empty);
  }

  .letter-tracing-trail__progress-dot--done {
    background: var(--color-accent-success);
  }

  .letter-tracing-trail__progress-dot--active {
    background: var(--color-accent-primary);
    transform: scaleY(1.2);
  }

  .letter-tracing-trail__message {
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-size-md);
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    border: 2px solid transparent;
  }

  .letter-tracing-trail__message--neutral {
    background: color-mix(in srgb, var(--color-bg-secondary) 72%, white);
    color: var(--color-text-primary);
  }

  .letter-tracing-trail__message--hint {
    background: color-mix(in srgb, var(--color-accent-secondary) 28%, white);
    color: var(--color-text-primary);
    border-color: color-mix(in srgb, var(--color-accent-primary) 42%, transparent);
  }

  .letter-tracing-trail__message--success {
    background: color-mix(in srgb, var(--color-accent-success) 24%, white);
    color: var(--color-text-primary);
    border-color: color-mix(in srgb, var(--color-accent-success) 55%, transparent);
  }

  .letter-tracing-trail__board {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: var(--space-md);
    align-items: stretch;
  }

  .letter-tracing-trail__trace-card,
  .letter-tracing-trail__choice-card {
    display: grid;
    gap: var(--space-md);
    align-content: start;
  }

  .letter-tracing-trail__trace-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  .letter-tracing-trail__target-glyph {
    width: 60px;
    height: 60px;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-theme-primary) 20%, white);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 34%, transparent);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 2.1rem;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-extrabold);
  }

  .letter-tracing-trail__metrics {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .letter-tracing-trail__metric-pill {
    min-height: 44px;
    padding: 0 var(--space-sm);
    border-radius: var(--radius-full);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 24%, transparent);
    background: white;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
  }

  .letter-tracing-trail__canvas {
    width: 100%;
    min-height: 250px;
    border-radius: var(--radius-lg);
    border: 3px dashed color-mix(in srgb, var(--color-theme-primary) 30%, transparent);
    background: color-mix(in srgb, var(--color-bg-secondary) 54%, white);
    touch-action: none;
  }

  .letter-tracing-trail__canvas--active {
    border-color: color-mix(in srgb, var(--color-accent-primary) 70%, transparent);
  }

  .letter-tracing-trail__canvas--celebrate {
    border-color: var(--color-accent-success);
    background: color-mix(in srgb, var(--color-accent-success) 18%, white);
  }

  .letter-tracing-trail__guide-line {
    fill: none;
    stroke: color-mix(in srgb, var(--color-theme-primary) 34%, transparent);
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .letter-tracing-trail__guide-line--strong {
    stroke: color-mix(in srgb, var(--color-theme-primary) 58%, transparent);
  }

  .letter-tracing-trail__ghost-line {
    fill: none;
    stroke: color-mix(in srgb, var(--color-accent-info) 72%, transparent);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 10 14;
    animation: trail-ghost-flow 1.3s linear infinite;
  }

  .letter-tracing-trail__hint-line {
    fill: none;
    stroke: color-mix(in srgb, var(--color-accent-primary) 46%, transparent);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 2 12;
  }

  .letter-tracing-trail__trace-line {
    fill: none;
    stroke: var(--color-accent-success);
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .letter-tracing-trail__start-dot {
    fill: color-mix(in srgb, var(--color-accent-primary) 72%, white);
    stroke: white;
    stroke-width: 4;
  }

  .letter-tracing-trail__choice-instruction {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .letter-tracing-trail__options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: var(--space-sm);
  }

  .letter-tracing-trail__option {
    min-height: 64px;
    border-radius: var(--radius-lg);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 24%, transparent);
    background: white;
    box-shadow: var(--shadow-sm);
    padding: var(--space-sm);
    display: grid;
    gap: var(--space-2xs);
    justify-items: center;
    align-content: center;
  }

  .letter-tracing-trail__option--selected {
    border-color: var(--color-accent-success);
    background: color-mix(in srgb, var(--color-accent-success) 15%, white);
  }

  .letter-tracing-trail__option-glyph {
    font-size: 1.7rem;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-extrabold);
    line-height: 1;
  }

  .letter-tracing-trail__option-name {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-tight);
  }

  .letter-tracing-trail__target-name-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .letter-tracing-trail__target-chip {
    min-height: 44px;
    padding: 0 var(--space-sm);
    border-radius: var(--radius-full);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 28%, transparent);
    background: color-mix(in srgb, var(--color-theme-primary) 12%, white);
    display: inline-flex;
    align-items: center;
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
  }

  .letter-tracing-trail__target-chip--support {
    border-color: color-mix(in srgb, var(--color-accent-info) 34%, transparent);
    background: color-mix(in srgb, var(--color-accent-info) 16%, white);
  }

  .letter-tracing-trail--midpoint,
  .letter-tracing-trail--complete {
    align-items: center;
  }

  .letter-tracing-trail--midpoint .letter-tracing-trail__shell,
  .letter-tracing-trail--complete .letter-tracing-trail__shell {
    max-width: 660px;
    text-align: center;
  }

  .letter-tracing-trail__stars {
    display: flex;
    justify-content: center;
    gap: var(--space-xs);
  }

  .letter-tracing-trail__star {
    font-size: 1.9rem;
  }

  .letter-tracing-trail__summary-card {
    display: grid;
    gap: var(--space-sm);
    text-align: start;
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 20%, transparent);
  }

  .letter-tracing-trail__hint-note {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  @keyframes trail-ghost-flow {
    0% {
      stroke-dashoffset: 0;
    }
    100% {
      stroke-dashoffset: -120;
    }
  }

  @media (max-width: 920px) {
    .letter-tracing-trail {
      padding: var(--space-md);
    }

    .letter-tracing-trail__board {
      grid-template-columns: 1fr;
    }

    .letter-tracing-trail__actions button {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .letter-tracing-trail *,
    .letter-tracing-trail *::before,
    .letter-tracing-trail *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
