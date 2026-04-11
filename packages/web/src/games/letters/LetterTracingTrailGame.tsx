import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import type { GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';
import { resolveLettersRoutingContext } from '@/games/letters/lettersProgressionRouting';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { isRtlDirection, rtlNextGlyph, rtlReplayGlyph } from '@/lib/rtlChrome';

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
type LetterSymbolKey = `letters.symbols.${LetterId}`;
type GameLevelId = 1 | 2 | 3;
type HintTone = 'neutral' | 'hint' | 'success';

type StatusKey =
  | LetterAudioKey
  | 'games.letterTracingTrail.title'
  | 'games.letterTracingTrail.subtitle'
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
  | 'parentDashboard.games.letterTracingTrail.progressSummary'
  | 'parentDashboard.games.letterTracingTrail.nextStep'
  | 'feedback.greatEffort'
  | 'feedback.excellent'
  | 'feedback.keepGoing'
  | 'feedback.youDidIt';

type AudioKey = StatusKey;
type HintTrend = ParentSummaryMetrics['hintTrend'];
type SelectionFeedbackTone = 'success' | 'miss';

interface Point {
  x: number;
  y: number;
}

interface RoundMessage {
  key: StatusKey;
  tone: HintTone;
}

interface SelectionFeedback {
  letterId: LetterId;
  tone: SelectionFeedbackTone;
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

const LETTER_SYMBOL_KEY_BY_ID: Record<LetterId, LetterSymbolKey> = {
  alef: 'letters.symbols.alef',
  bet: 'letters.symbols.bet',
  gimel: 'letters.symbols.gimel',
  dalet: 'letters.symbols.dalet',
  he: 'letters.symbols.he',
  vav: 'letters.symbols.vav',
  zayin: 'letters.symbols.zayin',
  het: 'letters.symbols.het',
  tet: 'letters.symbols.tet',
  yod: 'letters.symbols.yod',
  kaf: 'letters.symbols.kaf',
  lamed: 'letters.symbols.lamed',
  mem: 'letters.symbols.mem',
  nun: 'letters.symbols.nun',
  samekh: 'letters.symbols.samekh',
  ayin: 'letters.symbols.ayin',
  pe: 'letters.symbols.pe',
  tsadi: 'letters.symbols.tsadi',
  qof: 'letters.symbols.qof',
  resh: 'letters.symbols.resh',
  shin: 'letters.symbols.shin',
  tav: 'letters.symbols.tav',
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

/** Sampled ellipse for ס (closed-ish loop in one stroke). */
function ellipsePolyline(cx: number, cy: number, rx: number, ry: number, segments: number): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = -Math.PI / 2 + (i / segments) * Math.PI * 2;
    pts.push({
      x: Math.round(cx + rx * Math.cos(angle)),
      y: Math.round(cy + ry * Math.sin(angle)),
    });
  }
  return pts;
}

/**
 * One-stroke polylines in TRACE_VIEW space that approximate block Hebrew shapes
 * (simplified for tracing coverage, not typographic outlines).
 */
const TRACE_PATH_BY_LETTER: Record<LetterId, Point[]> = {
  alef: [
    { x: 98, y: 48 },
    { x: 232, y: 138 },
    { x: 254, y: 138 },
    { x: 254, y: 188 },
  ],
  bet: [
    { x: 72, y: 44 },
    { x: 248, y: 44 },
    { x: 266, y: 90 },
    { x: 246, y: 168 },
    { x: 118, y: 168 },
    { x: 96, y: 88 },
  ],
  gimel: [
    { x: 268, y: 44 },
    { x: 112, y: 44 },
    { x: 86, y: 92 },
    { x: 118, y: 172 },
    { x: 226, y: 172 },
  ],
  dalet: [
    { x: 78, y: 48 },
    { x: 238, y: 48 },
    { x: 264, y: 96 },
    { x: 228, y: 176 },
    { x: 118, y: 176 },
  ],
  he: [
    { x: 272, y: 46 },
    { x: 76, y: 46 },
    { x: 58, y: 102 },
    { x: 58, y: 184 },
    { x: 234, y: 184 },
  ],
  vav: [
    { x: 172, y: 32 },
    { x: 172, y: 196 },
  ],
  zayin: [
    { x: 90, y: 48 },
    { x: 250, y: 48 },
    { x: 140, y: 184 },
  ],
  het: [
    { x: 68, y: 44 },
    { x: 272, y: 44 },
    { x: 252, y: 96 },
    { x: 252, y: 184 },
    { x: 88, y: 184 },
    { x: 88, y: 96 },
  ],
  tet: [
    { x: 200, y: 42 },
    { x: 120, y: 42 },
    { x: 88, y: 88 },
    { x: 88, y: 150 },
    { x: 130, y: 182 },
    { x: 210, y: 182 },
    { x: 248, y: 150 },
    { x: 248, y: 88 },
    { x: 220, y: 50 },
    { x: 200, y: 42 },
  ],
  yod: [
    { x: 170, y: 96 },
    { x: 170, y: 182 },
  ],
  kaf: [
    { x: 82, y: 46 },
    { x: 248, y: 46 },
    { x: 270, y: 96 },
    { x: 242, y: 180 },
    { x: 124, y: 180 },
    { x: 100, y: 96 },
  ],
  lamed: [
    { x: 228, y: 192 },
    { x: 210, y: 90 },
    { x: 140, y: 48 },
    { x: 98, y: 70 },
    { x: 92, y: 140 },
  ],
  mem: [
    { x: 52, y: 48 },
    { x: 288, y: 48 },
    { x: 288, y: 178 },
    { x: 190, y: 178 },
    { x: 190, y: 88 },
    { x: 150, y: 88 },
    { x: 150, y: 178 },
    { x: 52, y: 178 },
  ],
  nun: [
    { x: 268, y: 46 },
    { x: 98, y: 46 },
    { x: 98, y: 180 },
  ],
  samekh: ellipsePolyline(170, 112, 108, 72, 28),
  ayin: [
    { x: 172, y: 40 },
    { x: 172, y: 95 },
    { x: 235, y: 130 },
    { x: 172, y: 175 },
    { x: 109, y: 130 },
    { x: 172, y: 95 },
  ],
  pe: [
    { x: 74, y: 46 },
    { x: 242, y: 46 },
    { x: 260, y: 92 },
    { x: 238, y: 168 },
    { x: 122, y: 168 },
    { x: 102, y: 100 },
    { x: 92, y: 198 },
    { x: 168, y: 198 },
  ],
  tsadi: [
    { x: 186, y: 36 },
    { x: 186, y: 118 },
    { x: 58, y: 205 },
    { x: 232, y: 205 },
  ],
  qof: [
    { x: 178, y: 36 },
    { x: 178, y: 92 },
    { x: 250, y: 130 },
    { x: 178, y: 172 },
    { x: 106, y: 130 },
    { x: 178, y: 92 },
    { x: 178, y: 200 },
  ],
  resh: [
    { x: 80, y: 46 },
    { x: 250, y: 46 },
    { x: 268, y: 98 },
    { x: 246, y: 176 },
    { x: 126, y: 176 },
  ],
  shin: [
    { x: 52, y: 188 },
    { x: 96, y: 42 },
    { x: 168, y: 132 },
    { x: 244, y: 42 },
    { x: 288, y: 188 },
  ],
  tav: [
    { x: 58, y: 48 },
    { x: 280, y: 48 },
    { x: 280, y: 184 },
    { x: 58, y: 184 },
    { x: 58, y: 112 },
    { x: 280, y: 112 },
  ],
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

  const pathPoints = TRACE_PATH_BY_LETTER[targetLetter];
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

export function LetterTracingTrailGame({ level: runtimeLevel, onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir(i18n.language));
  const replayIcon = rtlReplayGlyph(isRtl);
  const nextIcon = rtlNextGlyph(isRtl);
  const levelConfig = useMemo(
    () => (runtimeLevel.configJson as Record<string, unknown>) ?? {},
    [runtimeLevel.configJson],
  );
  const routingContext = useMemo(
    () => resolveLettersRoutingContext(levelConfig, 1),
    [levelConfig],
  );
  const sessionStartLevel = useMemo<GameLevelId>(
    () => (routingContext.ageBand === '5-6' ? 1 : routingContext.initialLevelId),
    [routingContext.ageBand, routingContext.initialLevelId],
  );

  const [audioDegraded, setAudioDegraded] = useState(false);

  const [roundNumber, setRoundNumber] = useState(1);
  const [level, setLevel] = useState<GameLevelId>(sessionStartLevel);
  const [cleanRoundsInRow, setCleanRoundsInRow] = useState(0);
  const [struggleRoundsInRow, setStruggleRoundsInRow] = useState(0);
  const [fallbackRoundsRemaining, setFallbackRoundsRemaining] = useState(routingContext.inSupportMode ? 2 : 0);
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
      level: sessionStartLevel,
      fallbackMode: routingContext.inSupportMode,
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
  const [traceMiss, setTraceMiss] = useState(false);
  const [scorePulse, setScorePulse] = useState(false);
  const [selectionFeedback, setSelectionFeedback] = useState<SelectionFeedback | null>(null);

  const [roundMessage, setRoundMessage] = useState<RoundMessage>({
    key: 'games.letterTracingTrail.instructions.intro',
    tone: 'neutral',
  });

  const previousLetterRef = useRef<LetterId | null>(round.targetLetter);
  const completionReportedRef = useRef(false);
  const tracePointsRef = useRef<Point[]>([]);
  const mistakesThisRoundRef = useRef(0);
  const queuedAdvanceActionRef = useRef<null | (() => void)>(null);
  const queuedAdvanceTimerRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const traceCelebrateTimerRef = useRef<number | null>(null);
  const traceMissTimerRef = useRef<number | null>(null);
  const scorePulseTimerRef = useRef<number | null>(null);
  const selectionFeedbackTimerRef = useRef<number | null>(null);

  const tracingEnabled =
    !sessionComplete &&
    !midpointPaused &&
    (!round.requiresSelection || selectedLetterId === round.targetLetter);

  const levelForThreshold = round.level;
  const ageBandStartToleranceAdjust =
    routingContext.ageBand === '3-4' ? 6 :
      routingContext.ageBand === '4-5' ? 2 :
        routingContext.ageBand === '6-7' ? -4 :
          0;
  const ageBandCoverageToleranceAdjust =
    routingContext.ageBand === '3-4' ? 4 :
      routingContext.ageBand === '4-5' ? 2 :
        routingContext.ageBand === '6-7' ? -2 :
          0;
  const ageBandCompletionAdjust =
    routingContext.ageBand === '3-4' ? -0.05 :
      routingContext.ageBand === '4-5' ? -0.02 :
        routingContext.ageBand === '6-7' ? 0.06 :
          0;

  const baseStartTolerance = round.fallbackMode ? 44 : levelForThreshold === 1 ? 36 : levelForThreshold === 2 ? 30 : 26;
  const baseCompletionThreshold = round.fallbackMode ? 0.52 : levelForThreshold === 1 ? 0.58 : levelForThreshold === 2 ? 0.68 : 0.76;
  const baseCoverageTolerance = round.fallbackMode ? 24 : levelForThreshold === 1 ? 20 : levelForThreshold === 2 ? 18 : 15;

  const startTolerance = Math.max(20, baseStartTolerance + ageBandStartToleranceAdjust);
  const completionThreshold = Math.min(0.9, Math.max(0.48, baseCompletionThreshold + ageBandCompletionAdjust));
  const coverageTolerance = Math.max(12, baseCoverageTolerance + ageBandCoverageToleranceAdjust);
  const shouldSnapToPath = round.fallbackMode
    ? true
    : routingContext.ageBand === '6-7'
      ? hintStep >= 3
      : levelForThreshold === 1 || hintStep >= 2;
  const snapRadius = round.fallbackMode ? 26 : levelForThreshold === 1 ? 18 : routingContext.ageBand === '6-7' ? 8 : 10;

  const traceGuideStrokeWidth = round.fallbackMode ? 28 : level === 1 ? 24 : level === 2 ? 18 : 14;
  const traceInkStrokeWidth = round.fallbackMode ? 16 : level === 1 ? 12 : level === 2 ? 10 : 9;

  const roundProgressSegments = useMemo(
    () => Array.from({ length: TOTAL_ROUNDS }, (_, index) => index + 1),
    [],
  );

  const attemptedLetters = sessionStats.hintUsageByRound.length;
  const independentLetters = sessionStats.firstAttemptSuccesses;
  const replayButtonAriaLabel = t('games.letterTracingTrail.instructions.tapReplay');
  const completionHintFeedbackKey = getFeedbackKeyFromHintTrend(getHintTrend(sessionStats.hintUsageByRound));
  const choiceInstructionKey: StatusKey =
    round.requiresSelection && selectedLetterId !== round.targetLetter
      ? 'games.letterTracingTrail.letterPrompt.chooseCorrect'
      : 'games.letterTracingTrail.letterPrompt.nowTrace';

  const currentLetterAudioKey = LETTER_AUDIO_KEY_BY_ID[round.targetLetter];

  const currentLetterGlyph = useMemo(
    () => t(LETTER_SYMBOL_KEY_BY_ID[round.targetLetter]),
    [round.targetLetter, t],
  );

  const handleAudioPlaybackFailure = useCallback(() => {
    setAudioDegraded((current) => {
      if (current) {
        return current;
      }
      setRoundMessage({ key: 'feedback.keepGoing', tone: 'hint' });
      return true;
    });
  }, []);

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

  const playAudioKey = useCallback(
    (key: AudioKey) => {
      if (audioDegraded) {
        return;
      }
      const path = resolveAudioPathFromKey(key, 'common');
      void audio.play(path).catch(() => {
        handleAudioPlaybackFailure();
      });
    },
    [audio, audioDegraded, handleAudioPlaybackFailure],
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

  const clearQueuedAdvance = useCallback(() => {
    if (queuedAdvanceTimerRef.current !== null) {
      window.clearTimeout(queuedAdvanceTimerRef.current);
      queuedAdvanceTimerRef.current = null;
    }
    queuedAdvanceActionRef.current = null;
  }, []);

  const clearTransientFeedbackTimers = useCallback(() => {
    if (traceCelebrateTimerRef.current !== null) {
      window.clearTimeout(traceCelebrateTimerRef.current);
      traceCelebrateTimerRef.current = null;
    }
    if (traceMissTimerRef.current !== null) {
      window.clearTimeout(traceMissTimerRef.current);
      traceMissTimerRef.current = null;
    }
    if (scorePulseTimerRef.current !== null) {
      window.clearTimeout(scorePulseTimerRef.current);
      scorePulseTimerRef.current = null;
    }
    if (selectionFeedbackTimerRef.current !== null) {
      window.clearTimeout(selectionFeedbackTimerRef.current);
      selectionFeedbackTimerRef.current = null;
    }
  }, []);

  const triggerTraceCelebrate = useCallback(() => {
    if (traceCelebrateTimerRef.current !== null) {
      window.clearTimeout(traceCelebrateTimerRef.current);
      traceCelebrateTimerRef.current = null;
    }

    setTraceMiss(false);
    setTraceCelebrate(true);

    traceCelebrateTimerRef.current = window.setTimeout(() => {
      setTraceCelebrate(false);
      traceCelebrateTimerRef.current = null;
    }, 520);
  }, []);

  const triggerTraceMiss = useCallback(() => {
    if (traceMissTimerRef.current !== null) {
      window.clearTimeout(traceMissTimerRef.current);
      traceMissTimerRef.current = null;
    }

    setTraceCelebrate(false);
    setTraceMiss(true);

    traceMissTimerRef.current = window.setTimeout(() => {
      setTraceMiss(false);
      traceMissTimerRef.current = null;
    }, 380);
  }, []);

  const triggerScorePulse = useCallback(() => {
    if (scorePulseTimerRef.current !== null) {
      window.clearTimeout(scorePulseTimerRef.current);
      scorePulseTimerRef.current = null;
    }

    setScorePulse(true);
    scorePulseTimerRef.current = window.setTimeout(() => {
      setScorePulse(false);
      scorePulseTimerRef.current = null;
    }, 480);
  }, []);

  const markSelectionFeedback = useCallback((letterId: LetterId, tone: SelectionFeedbackTone) => {
    if (selectionFeedbackTimerRef.current !== null) {
      window.clearTimeout(selectionFeedbackTimerRef.current);
      selectionFeedbackTimerRef.current = null;
    }

    setSelectionFeedback({ letterId, tone });
    selectionFeedbackTimerRef.current = window.setTimeout(() => {
      setSelectionFeedback(null);
      selectionFeedbackTimerRef.current = null;
    }, tone === 'success' ? 520 : 420);
  }, []);

  const queueAdvanceAction = useCallback(
    (action: () => void, delayMs: number) => {
      clearQueuedAdvance();

      queuedAdvanceActionRef.current = () => {
        if (queuedAdvanceTimerRef.current !== null) {
          window.clearTimeout(queuedAdvanceTimerRef.current);
          queuedAdvanceTimerRef.current = null;
        }

        const queuedAction = action;
        queuedAdvanceActionRef.current = null;
        queuedAction();
      };

      queuedAdvanceTimerRef.current = window.setTimeout(() => {
        queuedAdvanceActionRef.current?.();
      }, delayMs);
    },
    [clearQueuedAdvance],
  );

  const flushQueuedAdvance = useCallback((): boolean => {
    if (!queuedAdvanceActionRef.current) {
      return false;
    }

    queuedAdvanceActionRef.current();
    return true;
  }, []);

  const clearTrace = useCallback(() => {
    tracePointsRef.current = [];
    setTracePoints([]);
    setTraceCoverage(0);
    setIsTracing(false);
    setTraceCelebrate(false);
    setTraceMiss(false);
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
      setTraceMiss(false);
      setScorePulse(false);
      setSelectionFeedback(null);
      setSelectedLetterId(nextRound.requiresSelection ? ('' as LetterId) : nextRound.targetLetter);
    },
    [clearTrace, setMistakeState],
  );

  const loadRound = useCallback(
    (nextRound: RoundState) => {
      clearQueuedAdvance();
      previousLetterRef.current = nextRound.targetLetter;
      setRound(nextRound);
      resetRoundInteraction(nextRound);

      if (nextRound.contrastMode) {
        setContrastPair(null);
      }
    },
    [clearQueuedAdvance, resetRoundInteraction],
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
    triggerTraceCelebrate();
    if (nextStarTokens > starTokens) {
      triggerScorePulse();
    }

    const roundPraise =
      ROUND_PRAISE_ROTATION[(updatedStats.hintUsageByRound.length - 1) % ROUND_PRAISE_ROTATION.length];
    setMessageWithAudio(roundPraise, 'success');

    if (updatedStats.hintUsageByRound.length >= TOTAL_ROUNDS) {
      queueAdvanceAction(() => {
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

    if (routingContext.ageBand === '5-6' && round.roundNumber === 1) {
      nextLevel = Math.max(2, nextLevel) as GameLevelId;
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

    queueAdvanceAction(() => {
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
    queueAdvanceAction,
    starTokens,
    struggleRoundsInRow,
    triggerScorePulse,
    triggerTraceCelebrate,
    usedHintThisRound,
    routingContext.ageBand,
  ]);

  const registerTraceMistake = useCallback(
    (mode: 'selection' | 'trace') => {
      if (sessionComplete || midpointPaused) {
        return;
      }

      setUsedHintThisRound(true);
      clearTrace();
      triggerTraceMiss();

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
      triggerTraceMiss,
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
      setTraceMiss(false);
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
        markSelectionFeedback(optionLetter, 'success');
        setMessageWithAudio('games.letterTracingTrail.letterPrompt.nowTrace', 'neutral');

        window.setTimeout(() => {
          playAudioKey(LETTER_AUDIO_KEY_BY_ID[optionLetter]);
        }, 220);

        return;
      }

      markSelectionFeedback(optionLetter, 'miss');
      setContrastPair(sortPair(round.targetLetter, optionLetter));
      registerTraceMistake('selection');
    },
    [
      markSelectionFeedback,
      midpointPaused,
      playAudioKey,
      registerTraceMistake,
      round,
      sessionComplete,
      setMessageWithAudio,
    ],
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
    setUsedHintThisRound(true);
    setMessageWithAudio('games.letterTracingTrail.feedback.encouragement.tryAgain', 'hint');

    window.setTimeout(() => {
      if (round.requiresSelection && selectedLetterId !== round.targetLetter) {
        setMessageWithAudio('games.letterTracingTrail.instructions.chooseAndTrace', 'neutral');
      } else {
        setMessageWithAudio('games.letterTracingTrail.instructions.startAtDot', 'neutral');
      }
    }, 220);
  }, [
    clearTrace,
    midpointPaused,
    round.requiresSelection,
    round.targetLetter,
    selectedLetterId,
    sessionComplete,
    setMessageWithAudio,
  ]);

  const handleHintControl = useCallback(() => {
    if (sessionComplete || midpointPaused) {
      return;
    }

    clearTrace();
    setUsedHintThisRound(true);
    setTraceCelebrate(false);

    const nextHintStep = Math.min(Math.max(hintStep + 1, 1), 3);
    setHintStep(nextHintStep);
    setHighlightGuide(true);

    if (nextHintStep >= 3) {
      setShowGhostHand(true);
      setMessageWithAudio('games.letterTracingTrail.strokeHint.watchGhostHand', 'hint');
      return;
    }

    setShowGhostHand(false);
    setMessageWithAudio(
      nextHintStep === 1
        ? 'games.letterTracingTrail.strokeHint.traceSlowly'
        : 'games.letterTracingTrail.strokeHint.stayOnTrack',
      'hint',
    );
  }, [clearTrace, hintStep, midpointPaused, sessionComplete, setMessageWithAudio]);

  const handleNextControl = useCallback(() => {
    if (sessionComplete || midpointPaused) {
      return;
    }

    if (queuedAdvanceActionRef.current) {
      setMessageWithAudio('games.letterTracingTrail.completionPraise.readyForNextLetter', 'success');
      flushQueuedAdvance();
      return;
    }

    if (round.requiresSelection && selectedLetterId !== round.targetLetter) {
      setMessageWithAudio('games.letterTracingTrail.instructions.chooseAndTrace', 'neutral');
      return;
    }

    setMessageWithAudio('games.letterTracingTrail.instructions.followPath', 'neutral');
  }, [
    flushQueuedAdvance,
    midpointPaused,
    round.requiresSelection,
    round.targetLetter,
    selectedLetterId,
    sessionComplete,
    setMessageWithAudio,
  ]);

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
      clearQueuedAdvance();
      clearTransientFeedbackTimers();
      audio.stop();
    };
  }, [audio, clearQueuedAdvance, clearTransientFeedbackTimers]);

  const coachVariant =
    sessionComplete || traceCelebrate || roundMessage.tone === 'success'
      ? 'success'
      : traceMiss || roundMessage.tone === 'hint' || showGhostHand || highlightGuide
        ? 'hint'
        : 'hero';

  if (sessionComplete) {
    return (
      <div className="letter-tracing-trail letter-tracing-trail--complete">
        <Card padding="lg" className="letter-tracing-trail__shell">
          <div className="letter-tracing-trail__text-row letter-tracing-trail__text-row--center">
            <h2 className="letter-tracing-trail__title">{t('feedback.youDidIt')}</h2>
            <button
              type="button"
              className="letter-tracing-trail__replay-button"
              onClick={() => playAudioKey('feedback.youDidIt')}
              aria-label={replayButtonAriaLabel}
            >
              <span aria-hidden="true">{replayIcon}</span>
            </button>
          </div>
          <div className="letter-tracing-trail__text-row letter-tracing-trail__text-row--center">
            <p className="letter-tracing-trail__subtitle">{t('games.letterTracingTrail.feedback.success.amazing')}</p>
            <button
              type="button"
              className="letter-tracing-trail__replay-button"
              onClick={() => playAudioKey('games.letterTracingTrail.feedback.success.amazing')}
              aria-label={replayButtonAriaLabel}
            >
              <span aria-hidden="true">{replayIcon}</span>
            </button>
          </div>

          <div className="letter-tracing-trail__stars">
            <span className="sr-only">{t('feedback.excellent')}</span>
            {Array.from({ length: Math.max(1, starTokens) }).map((_, index) => (
              <span key={`star-${index}`} className="letter-tracing-trail__star" aria-hidden="true">
                ⭐
              </span>
            ))}
          </div>

          <Card padding="md" className="letter-tracing-trail__summary-card">
            <div className="letter-tracing-trail__text-row">
              <p>
                {t('parentDashboard.games.letterTracingTrail.progressSummary', {
                  attemptedLetters,
                  independentLetters,
                })}
              </p>
              <button
                type="button"
                className="letter-tracing-trail__replay-button"
                onClick={() => playAudioKey('parentDashboard.games.letterTracingTrail.progressSummary')}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">{replayIcon}</span>
              </button>
            </div>
            <div className="letter-tracing-trail__text-row">
              <p>{t('parentDashboard.games.letterTracingTrail.nextStep')}</p>
              <button
                type="button"
                className="letter-tracing-trail__replay-button"
                onClick={() => playAudioKey('parentDashboard.games.letterTracingTrail.nextStep')}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">{replayIcon}</span>
              </button>
            </div>
          </Card>

          <div className="letter-tracing-trail__text-row letter-tracing-trail__text-row--center">
            <p className="letter-tracing-trail__hint-note">{t(completionHintFeedbackKey)}</p>
            <button
              type="button"
              className="letter-tracing-trail__replay-button"
              onClick={() => playAudioKey(completionHintFeedbackKey)}
              aria-label={replayButtonAriaLabel}
            >
              <span aria-hidden="true">{replayIcon}</span>
            </button>
          </div>
        </Card>

        <style>{letterTracingTrailStyles}</style>
      </div>
    );
  }

  if (midpointPaused) {
    return (
      <div className="letter-tracing-trail letter-tracing-trail--midpoint">
        <Card padding="lg" className="letter-tracing-trail__shell">
          <div className="letter-tracing-trail__text-row letter-tracing-trail__text-row--center">
            <h2 className="letter-tracing-trail__title">{t('feedback.greatEffort')}</h2>
            <button
              type="button"
              className="letter-tracing-trail__replay-button"
              onClick={() => playAudioKey('feedback.greatEffort')}
              aria-label={replayButtonAriaLabel}
            >
              <span aria-hidden="true">{replayIcon}</span>
            </button>
          </div>
          <div className="letter-tracing-trail__text-row letter-tracing-trail__text-row--center">
            <p className="letter-tracing-trail__subtitle">
              {t('games.letterTracingTrail.completionPraise.readyForNextLetter')}
            </p>
            <button
              type="button"
              className="letter-tracing-trail__replay-button"
              onClick={() => playAudioKey('games.letterTracingTrail.completionPraise.readyForNextLetter')}
              aria-label={replayButtonAriaLabel}
            >
              <span aria-hidden="true">{replayIcon}</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleContinueAfterMidpoint}
            aria-label={t('nav.next')}
            style={{ minWidth: '56px', paddingInline: 'var(--space-lg)' }}
          >
            <span aria-hidden="true">{nextIcon}</span>
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
            <div className="letter-tracing-trail__text-row">
              <h2 className="letter-tracing-trail__title">{t('games.letterTracingTrail.title')}</h2>
              <button
                type="button"
                className="letter-tracing-trail__replay-button"
                onClick={() => playAudioKey('games.letterTracingTrail.title')}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">{replayIcon}</span>
              </button>
            </div>
            <div className="letter-tracing-trail__text-row">
              <p className="letter-tracing-trail__subtitle">{t('games.letterTracingTrail.subtitle')}</p>
              <button
                type="button"
                className="letter-tracing-trail__replay-button"
                onClick={() => playAudioKey('games.letterTracingTrail.subtitle')}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">{replayIcon}</span>
              </button>
            </div>
          </div>

          <div
            className={[
              'letter-tracing-trail__coach',
              coachVariant === 'success' ? 'letter-tracing-trail__coach--success' : '',
              coachVariant === 'hint' ? 'letter-tracing-trail__coach--hint' : '',
            ].join(' ')}
            aria-hidden="true"
          >
            <MascotIllustration variant={coachVariant} size={52} />
          </div>

          <div className="letter-tracing-trail__actions">
            <Button
              variant="secondary"
              size="md"
              onClick={handleReplayInstruction}
              aria-label={t('games.letterTracingTrail.instructions.tapReplay')}
              style={{ minWidth: 'var(--touch-min)', paddingInline: 'var(--space-md)' }}
            >
              <span aria-hidden="true">{replayIcon}</span>
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={handleResetTrace}
              aria-label={t('feedback.tryAgain')}
              style={{ minWidth: 'var(--touch-min)', paddingInline: 'var(--space-md)' }}
            >
              <span aria-hidden="true">↻</span>
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={handleHintControl}
              aria-label={t('games.letterTracingTrail.strokeHint.watchGhostHand')}
              style={{ minWidth: 'var(--touch-min)', paddingInline: 'var(--space-md)' }}
            >
              <span aria-hidden="true">💡</span>
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={handleNextControl}
              aria-label={t('nav.next')}
              style={{ minWidth: 'var(--touch-min)', paddingInline: 'var(--space-md)' }}
            >
              <span aria-hidden="true">{nextIcon}</span>
            </Button>
          </div>
        </header>

        <div className="letter-tracing-trail__progress">
          <span className="sr-only">{t('games.estimatedTime', { minutes: 7 })}</span>
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
                className={[
                  `letter-tracing-trail__progress-dot`,
                  `letter-tracing-trail__progress-dot--${state}`,
                  state === 'active' ? 'letter-tracing-trail__progress-dot--breathing' : '',
                ].join(' ')}
                aria-hidden="true"
              />
            );
          })}
        </div>

        <div
          className={[
            'letter-tracing-trail__message',
            `letter-tracing-trail__message--${roundMessage.tone}`,
            traceCelebrate ? 'letter-tracing-trail__message--pulse' : '',
            traceMiss ? 'letter-tracing-trail__message--miss' : '',
          ].join(' ')}
        >
          <p className="letter-tracing-trail__message-text" aria-live="polite">
            {t(roundMessage.key)}
          </p>
          <button
            type="button"
            className="letter-tracing-trail__replay-button"
            onClick={() => playAudioKey(roundMessage.key)}
            aria-label={replayButtonAriaLabel}
          >
            <span aria-hidden="true">{replayIcon}</span>
          </button>
        </div>

        {audioDegraded ? (
          <p className="letter-tracing-trail__audio-fallback" aria-live="polite">
            <span aria-hidden="true">🔇</span>
            <span>{t('feedback.keepGoing')}</span>
          </p>
        ) : null}

        <section className="letter-tracing-trail__board">
          <Card
            padding="md"
            className={[
              'letter-tracing-trail__trace-card',
              traceCelebrate ? 'letter-tracing-trail__trace-card--success' : '',
              traceMiss ? 'letter-tracing-trail__trace-card--miss' : '',
              roundMessage.tone === 'hint' || highlightGuide || showGhostHand
                ? 'letter-tracing-trail__trace-card--hint'
                : '',
            ].join(' ')}
          >
            <div className="letter-tracing-trail__trace-head">
              <span className="letter-tracing-trail__target-glyph" aria-hidden="true">
                {currentLetterGlyph}
              </span>

              <div className="letter-tracing-trail__metrics">
                <span
                  className={[
                    'letter-tracing-trail__metric-pill',
                    scorePulse ? 'letter-tracing-trail__metric-pill--pulse' : '',
                  ].join(' ')}
                >
                  <span className="sr-only">{t('feedback.excellent')}</span>
                  ⭐ {starTokens}
                </span>
                <span className="letter-tracing-trail__metric-pill">
                  <span className="sr-only">{t('games.difficulty')}</span>
                  🎯 {round.level}
                </span>
                <span className="letter-tracing-trail__metric-pill">
                  <span className="sr-only">{t('feedback.keepGoing')}</span>
                  {Math.round(traceCoverage * 100)}%
                </span>
                <span className="letter-tracing-trail__metric-pill">
                  <span className="sr-only">{t('nav.next')}</span>
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
                traceMiss ? 'letter-tracing-trail__canvas--miss' : '',
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
                className={[
                  'letter-tracing-trail__start-dot',
                  traceCelebrate ? 'letter-tracing-trail__start-dot--success' : '',
                  traceMiss ? 'letter-tracing-trail__start-dot--miss' : '',
                ].join(' ')}
                cx={round.startPoint.x}
                cy={round.startPoint.y}
                r={12}
              />
            </svg>
          </Card>

          <Card
            padding="md"
            className={[
              'letter-tracing-trail__choice-card',
              selectionFeedback?.tone === 'success'
                ? 'letter-tracing-trail__choice-card--selection-success'
                : '',
              selectionFeedback?.tone === 'miss' ? 'letter-tracing-trail__choice-card--selection-miss' : '',
            ].join(' ')}
          >
            <div className="letter-tracing-trail__text-row">
              <p className="letter-tracing-trail__choice-instruction">{t(choiceInstructionKey)}</p>
              <button
                type="button"
                className="letter-tracing-trail__replay-button"
                onClick={() => playAudioKey(choiceInstructionKey)}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">{replayIcon}</span>
              </button>
            </div>

            {round.requiresSelection && (
              <div className="letter-tracing-trail__options-grid">
                {round.optionLetters.map((optionLetter) => {
                  const optionLabel = t(LETTER_AUDIO_KEY_BY_ID[optionLetter]);
                  const optionGlyph = t(LETTER_SYMBOL_KEY_BY_ID[optionLetter]);
                  const isSelected = selectedLetterId === optionLetter;
                  const optionAudioKey = LETTER_AUDIO_KEY_BY_ID[optionLetter];
                  const hasSelectionFeedback = selectionFeedback?.letterId === optionLetter;

                  return (
                    <div key={`${round.id}-option-${optionLetter}`} className="letter-tracing-trail__option-item">
                      <button
                        type="button"
                        className={[
                          'letter-tracing-trail__option',
                          isSelected ? 'letter-tracing-trail__option--selected' : '',
                          hasSelectionFeedback && selectionFeedback?.tone === 'success'
                            ? 'letter-tracing-trail__option--success'
                            : '',
                          hasSelectionFeedback && selectionFeedback?.tone === 'miss'
                            ? 'letter-tracing-trail__option--miss'
                            : '',
                        ].join(' ')}
                        onClick={() => handleLetterSelection(optionLetter)}
                        aria-label={optionLabel}
                      >
                        <span className="letter-tracing-trail__option-glyph" aria-hidden="true">
                          {optionGlyph}
                        </span>
                      </button>
                      <div className="letter-tracing-trail__option-label-row">
                        <button
                          type="button"
                          className="letter-tracing-trail__replay-button letter-tracing-trail__option-replay"
                          onClick={() => playAudioKey(optionAudioKey)}
                          aria-label={replayButtonAriaLabel}
                        >
                          <span aria-hidden="true">{replayIcon}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="letter-tracing-trail__target-name-wrap">
              <div className="letter-tracing-trail__target-audio-row">
                <span className="letter-tracing-trail__target-chip">{t(currentLetterAudioKey)}</span>
                <button
                  type="button"
                  className="letter-tracing-trail__replay-button letter-tracing-trail__target-chip-replay"
                  onClick={() => playAudioKey(currentLetterAudioKey)}
                  aria-label={replayButtonAriaLabel}
                >
                  <span aria-hidden="true">{replayIcon}</span>
                </button>
              </div>
              {round.fallbackMode && (
                <div className="letter-tracing-trail__target-audio-row">
                  <span className="letter-tracing-trail__target-chip letter-tracing-trail__target-chip--support">
                    {t('games.letterTracingTrail.strokeHint.watchGhostHand')}
                  </span>
                  <button
                    type="button"
                    className="letter-tracing-trail__replay-button letter-tracing-trail__target-chip-replay"
                    onClick={() => playAudioKey('games.letterTracingTrail.strokeHint.watchGhostHand')}
                    aria-label={replayButtonAriaLabel}
                  >
                    <span aria-hidden="true">{replayIcon}</span>
                  </button>
                </div>
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

  .letter-tracing-trail__coach {
    inline-size: 68px;
    block-size: 68px;
    border-radius: var(--radius-full);
    display: grid;
    place-items: center;
    pointer-events: none;
    background: color-mix(in srgb, var(--color-bg-card) 90%, white);
    border: 2px solid color-mix(in srgb, var(--color-accent-primary) 28%, transparent);
    box-shadow: var(--shadow-sm);
    transition:
      border-color 180ms ease,
      background-color 180ms ease,
      box-shadow 180ms ease;
    animation: letter-tracing-coach-float 1500ms ease-in-out infinite;
  }

  .letter-tracing-trail__coach--success {
    border-color: color-mix(in srgb, var(--color-accent-success) 64%, transparent);
    background: color-mix(in srgb, var(--color-accent-success) 16%, var(--color-bg-card));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-success) 20%, transparent);
  }

  .letter-tracing-trail__coach--hint {
    border-color: color-mix(in srgb, var(--color-accent-warning) 58%, transparent);
    background: color-mix(in srgb, var(--color-accent-warning) 14%, var(--color-bg-card));
  }

  .letter-tracing-trail__coach,
  .letter-tracing-trail__coach * {
    pointer-events: none;
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

  .letter-tracing-trail__progress-dot--breathing {
    animation: letter-tracing-dot-breathe 1.1s ease-in-out infinite;
  }

  .letter-tracing-trail__message {
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    border: 2px solid transparent;
  }

  .letter-tracing-trail__message-text {
    margin: 0;
    font-size: var(--font-size-md);
    flex: 1;
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

  .letter-tracing-trail__message--pulse {
    animation: letter-tracing-message-pulse 360ms ease-out;
  }

  .letter-tracing-trail__message--miss {
    animation: letter-tracing-message-shake 260ms ease-out;
  }

  .letter-tracing-trail__board {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: var(--space-md);
    align-items: stretch;
  }

  .letter-tracing-trail__text-row {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .letter-tracing-trail__text-row > :first-child {
    margin: 0;
    flex: 1;
  }

  .letter-tracing-trail__text-row--center {
    justify-content: center;
  }

  .letter-tracing-trail__text-row--center > :first-child {
    flex: initial;
  }

  [dir='rtl'] .letter-tracing-trail__text-row .letter-tracing-trail__replay-button {
    order: -1;
  }

  .letter-tracing-trail__replay-button {
    inline-size: var(--touch-min);
    block-size: var(--touch-min);
    min-inline-size: var(--touch-min);
    min-block-size: var(--touch-min);
    border-radius: var(--radius-sm);
    border: none;
    background: transparent;
    color: var(--color-theme-primary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 140ms ease, color 140ms ease;
    flex-shrink: 0;
  }

  .letter-tracing-trail__replay-button:hover {
    transform: translateY(-1px);
    color: color-mix(in srgb, var(--color-theme-primary) 72%, var(--color-text-primary));
  }

  .letter-tracing-trail__replay-button:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--color-theme-primary) 45%, transparent);
    outline-offset: 2px;
  }

  .letter-tracing-trail__audio-fallback {
    margin: 0;
    min-height: var(--touch-min);
    border-radius: var(--radius-md);
    border: 1px dashed color-mix(in srgb, var(--color-accent-warning) 52%, transparent);
    background: color-mix(in srgb, var(--color-bg-card) 90%, var(--color-accent-warning) 10%);
    color: var(--color-text-secondary);
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    padding-inline: var(--space-sm);
  }

  .letter-tracing-trail__trace-card,
  .letter-tracing-trail__choice-card {
    display: grid;
    gap: var(--space-md);
    align-content: start;
    transition:
      border-color 180ms ease,
      background-color 180ms ease;
  }

  .letter-tracing-trail__trace-card--hint {
    border-color: color-mix(in srgb, var(--color-accent-warning) 42%, transparent);
    background: color-mix(in srgb, var(--color-accent-warning) 10%, var(--color-bg-card));
  }

  .letter-tracing-trail__trace-card--success {
    border-color: color-mix(in srgb, var(--color-accent-success) 52%, transparent);
    background: color-mix(in srgb, var(--color-accent-success) 10%, var(--color-bg-card));
  }

  .letter-tracing-trail__trace-card--miss {
    border-color: color-mix(in srgb, var(--color-accent-danger) 46%, transparent);
    background: color-mix(in srgb, var(--color-accent-danger) 9%, var(--color-bg-card));
  }

  .letter-tracing-trail__choice-card--selection-success {
    border-color: color-mix(in srgb, var(--color-accent-success) 52%, transparent);
    background: color-mix(in srgb, var(--color-accent-success) 9%, var(--color-bg-card));
  }

  .letter-tracing-trail__choice-card--selection-miss {
    border-color: color-mix(in srgb, var(--color-accent-danger) 50%, transparent);
    background: color-mix(in srgb, var(--color-accent-danger) 10%, var(--color-bg-card));
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
    min-height: var(--touch-min);
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

  .letter-tracing-trail__metric-pill--pulse {
    animation: letter-tracing-pill-pulse 460ms ease-out;
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
    animation: letter-tracing-board-pop 420ms ease-out;
  }

  .letter-tracing-trail__canvas--miss {
    border-color: var(--color-accent-danger);
    background: color-mix(in srgb, var(--color-accent-danger) 14%, white);
    animation: letter-tracing-board-shake 320ms ease-out;
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
    transform-box: fill-box;
    transform-origin: center;
  }

  .letter-tracing-trail__start-dot--success {
    fill: color-mix(in srgb, var(--color-accent-success) 74%, white);
    animation: letter-tracing-start-dot-pop 360ms ease-out;
  }

  .letter-tracing-trail__start-dot--miss {
    fill: color-mix(in srgb, var(--color-accent-danger) 72%, white);
    animation: letter-tracing-message-shake 260ms ease-out;
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

  .letter-tracing-trail__option-item {
    display: grid;
    gap: var(--space-2xs);
  }

  .letter-tracing-trail__option {
    width: 100%;
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

  .letter-tracing-trail__option--success {
    border-color: color-mix(in srgb, var(--color-accent-success) 76%, transparent);
    background: color-mix(in srgb, var(--color-accent-success) 20%, white);
    animation: letter-tracing-option-pop 360ms ease-out;
  }

  .letter-tracing-trail__option--miss {
    border-color: color-mix(in srgb, var(--color-accent-danger) 72%, transparent);
    background: color-mix(in srgb, var(--color-accent-danger) 16%, white);
    animation: letter-tracing-option-shake 280ms ease-out;
  }

  .letter-tracing-trail__option-glyph {
    font-size: 1.7rem;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-extrabold);
    line-height: 1;
  }

  .letter-tracing-trail__option-label-row {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--touch-min);
  }

  .letter-tracing-trail__option-replay {
    inline-size: var(--touch-min);
    block-size: var(--touch-min);
    min-inline-size: var(--touch-min);
    min-block-size: var(--touch-min);
  }

  .letter-tracing-trail__target-name-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .letter-tracing-trail__target-audio-row {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
  }

  .letter-tracing-trail__target-chip {
    min-height: var(--touch-min);
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

  .letter-tracing-trail__target-chip-replay {
    inline-size: var(--touch-min);
    block-size: var(--touch-min);
    min-inline-size: var(--touch-min);
    min-block-size: var(--touch-min);
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

  @keyframes letter-tracing-dot-breathe {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.2);
    }
  }

  @keyframes letter-tracing-message-pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.015);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes letter-tracing-message-shake {
    0% {
      transform: translateX(0);
    }
    32% {
      transform: translateX(-4px);
    }
    64% {
      transform: translateX(4px);
    }
    100% {
      transform: translateX(0);
    }
  }

  @keyframes letter-tracing-option-pop {
    0% {
      transform: scale(1);
    }
    45% {
      transform: scale(1.06);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes letter-tracing-option-shake {
    0% {
      transform: translateX(0);
    }
    35% {
      transform: translateX(-6px);
    }
    70% {
      transform: translateX(6px);
    }
    100% {
      transform: translateX(0);
    }
  }

  @keyframes letter-tracing-start-dot-pop {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.14);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes letter-tracing-pill-pulse {
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

  @keyframes letter-tracing-board-pop {
    0% {
      transform: scale(1);
    }
    45% {
      transform: scale(1.015);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes letter-tracing-board-shake {
    0% {
      transform: translateX(0);
    }
    30% {
      transform: translateX(-6px);
    }
    60% {
      transform: translateX(6px);
    }
    100% {
      transform: translateX(0);
    }
  }

  @keyframes letter-tracing-coach-float {
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
