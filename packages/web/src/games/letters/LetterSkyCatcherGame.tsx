import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameCompletionResult, GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';
import { resolveLettersRoutingContext } from '@/games/letters/lettersProgressionRouting';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { isRtlDirection, rtlNextGlyph, rtlProgressGradient, rtlReplayGlyph } from '@/lib/rtlChrome';

type GameLevelId = 1 | 2 | 3;
type MessageTone = 'neutral' | 'hint' | 'success';

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

type ObjectId =
  | 'arye'
  | 'balon'
  | 'gezer'
  | 'dag'
  | 'har'
  | 'vered'
  | 'zebra'
  | 'hatul'
  | 'tavas'
  | 'yeled'
  | 'kova'
  | 'limon'
  | 'mitriya'
  | 'ner'
  | 'sus'
  | 'anan'
  | 'perah'
  | 'tzav'
  | 'kof'
  | 'rakevet'
  | 'shemesh'
  | 'tapuach';

type LetterPronunciationKey = `letters.pronunciation.${LetterId}`;
type LetterAnchorWordKey = `letters.anchorWords.${LetterId}`;
type ObjectNameKey = `objects.names.${ObjectId}`;

type StatusKey =
  | LetterPronunciationKey
  | LetterAnchorWordKey
  | ObjectNameKey
  | 'games.letterSkyCatcher.title'
  | 'games.letterSkyCatcher.subtitle'
  | 'games.letterSkyCatcher.instructions.intro'
  | 'games.letterSkyCatcher.instructions.moveBear'
  | 'games.letterSkyCatcher.instructions.catchTargets'
  | 'games.letterSkyCatcher.instructions.tapReplay'
  | 'games.letterSkyCatcher.prompts.letterIntro.ready'
  | 'games.letterSkyCatcher.prompts.letterIntro.listenForLetter'
  | 'games.letterSkyCatcher.prompts.letterIntro.anchorWord'
  | 'games.letterSkyCatcher.prompts.letterRotate.nextLetter'
  | 'games.letterSkyCatcher.prompts.letterRotate.keepGoing'
  | 'games.letterSkyCatcher.prompts.objectHit.success'
  | 'games.letterSkyCatcher.prompts.objectHit.gentleRetry'
  | 'games.letterSkyCatcher.prompts.objectHit.missedTarget'
  | 'games.letterSkyCatcher.hints.replayInstruction'
  | 'games.letterSkyCatcher.hints.slowAndFocus'
  | 'games.letterSkyCatcher.hints.watchGlow'
  | 'games.letterSkyCatcher.hints.trySameLetter'
  | 'games.letterSkyCatcher.rewards.wearable'
  | 'games.letterSkyCatcher.rewards.trail'
  | 'games.letterSkyCatcher.rewards.glow'
  | 'games.letterSkyCatcher.rewards.celebration'
  | 'games.letterSkyCatcher.recap.summary'
  | 'games.letterSkyCatcher.recap.nextStep'
  | 'parentDashboard.games.letterSkyCatcher.progressSummary'
  | 'parentDashboard.games.letterSkyCatcher.letterConfusions'
  | 'parentDashboard.games.letterSkyCatcher.nextStep'
  | 'feedback.greatEffort'
  | 'feedback.keepGoing'
  | 'feedback.excellent'
  | 'feedback.youDidIt'
  | 'nav.next';

interface FallingObject {
  id: string;
  objectId: ObjectId;
  letterId: LetterId;
  lane: number;
  progress: number;
  speed: number;
  isTarget: boolean;
}

interface RoundMessage {
  key: StatusKey;
  tone: MessageTone;
}

interface DifficultyConfig {
  targetRatio: number;
  maxActiveObjects: number;
  minFallDurationSec: number;
  maxFallDurationSec: number;
}

interface SessionStats {
  hintUsageByBlock: number[];
  pairMistakes: Record<string, number>;
}

interface ObjectMeta {
  icon: string;
  letterId: LetterId;
  nameKey: ObjectNameKey;
}

const TOTAL_BLOCKS = 6;
const BLOCK_DURATION_MS = 30_000;
const BLOCK_SUPPORT_EXTENSION_MS = 5_000;
const REMEDIATION_DURATION_MS = 10_000;
const LANE_COUNT = 5;
const PLAYER_CATCH_START = 0.78;
const PLAYER_CATCH_END = 0.92;
const PLAYER_INLINE_SIZE = 88;
const OBJECT_INLINE_SIZE = 72;
const DEFAULT_LEVEL_ID: GameLevelId = 2;

const LETTER_POOL_BY_LEVEL: Record<GameLevelId, LetterId[]> = {
  1: ['mem', 'nun', 'lamed', 'shin', 'pe', 'qof'],
  2: ['mem', 'nun', 'lamed', 'shin', 'pe', 'qof', 'bet', 'tet', 'tav', 'resh'],
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

const LEVEL_DIFFICULTY: Record<GameLevelId, DifficultyConfig> = {
  1: {
    targetRatio: 0.6,
    maxActiveObjects: 3,
    minFallDurationSec: 2.0,
    maxFallDurationSec: 2.8,
  },
  2: {
    targetRatio: 0.45,
    maxActiveObjects: 4,
    minFallDurationSec: 1.6,
    maxFallDurationSec: 2.2,
  },
  3: {
    targetRatio: 0.35,
    maxActiveObjects: 5,
    minFallDurationSec: 1.2,
    maxFallDurationSec: 1.8,
  },
};

const CONFUSION_PAIRS: Array<[LetterId, LetterId]> = [
  ['bet', 'pe'],
  ['tet', 'tav'],
  ['alef', 'ayin'],
  ['dalet', 'resh'],
  ['samekh', 'shin'],
];

const OBJECT_META_BY_ID: Record<ObjectId, ObjectMeta> = {
  arye: { icon: '🦁', letterId: 'alef', nameKey: 'objects.names.arye' },
  balon: { icon: '🎈', letterId: 'bet', nameKey: 'objects.names.balon' },
  gezer: { icon: '🥕', letterId: 'gimel', nameKey: 'objects.names.gezer' },
  dag: { icon: '🐟', letterId: 'dalet', nameKey: 'objects.names.dag' },
  har: { icon: '⛰️', letterId: 'he', nameKey: 'objects.names.har' },
  vered: { icon: '🌹', letterId: 'vav', nameKey: 'objects.names.vered' },
  zebra: { icon: '🦓', letterId: 'zayin', nameKey: 'objects.names.zebra' },
  hatul: { icon: '🐱', letterId: 'het', nameKey: 'objects.names.hatul' },
  tavas: { icon: '🦚', letterId: 'tet', nameKey: 'objects.names.tavas' },
  yeled: { icon: '🧒', letterId: 'yod', nameKey: 'objects.names.yeled' },
  kova: { icon: '🧢', letterId: 'kaf', nameKey: 'objects.names.kova' },
  limon: { icon: '🍋', letterId: 'lamed', nameKey: 'objects.names.limon' },
  mitriya: { icon: '☂️', letterId: 'mem', nameKey: 'objects.names.mitriya' },
  ner: { icon: '🕯️', letterId: 'nun', nameKey: 'objects.names.ner' },
  sus: { icon: '🐴', letterId: 'samekh', nameKey: 'objects.names.sus' },
  anan: { icon: '☁️', letterId: 'ayin', nameKey: 'objects.names.anan' },
  perah: { icon: '🌸', letterId: 'pe', nameKey: 'objects.names.perah' },
  tzav: { icon: '🐢', letterId: 'tsadi', nameKey: 'objects.names.tzav' },
  kof: { icon: '🐵', letterId: 'qof', nameKey: 'objects.names.kof' },
  rakevet: { icon: '🚆', letterId: 'resh', nameKey: 'objects.names.rakevet' },
  shemesh: { icon: '☀️', letterId: 'shin', nameKey: 'objects.names.shemesh' },
  tapuach: { icon: '🍎', letterId: 'tav', nameKey: 'objects.names.tapuach' },
};

const OBJECT_IDS_BY_LETTER = Object.entries(OBJECT_META_BY_ID).reduce<Record<LetterId, ObjectId[]>>(
  (collection, [objectId, meta]) => {
    const key = meta.letterId;
    const nextCollection = collection;
    nextCollection[key] = [...(nextCollection[key] ?? []), objectId as ObjectId];
    return nextCollection;
  },
  {
    alef: [],
    bet: [],
    gimel: [],
    dalet: [],
    he: [],
    vav: [],
    zayin: [],
    het: [],
    tet: [],
    yod: [],
    kaf: [],
    lamed: [],
    mem: [],
    nun: [],
    samekh: [],
    ayin: [],
    pe: [],
    tsadi: [],
    qof: [],
    resh: [],
    shin: [],
    tav: [],
  },
);

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickRandom<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)] as T;
}

function shuffle<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function getAudioPathForKey(key: StatusKey): string {
  return resolveAudioPathFromKey(key, 'common');
}

function normalizePair(a: LetterId, b: LetterId): string {
  const ordered = [a, b].sort() as [LetterId, LetterId];
  return `${ordered[0]}|${ordered[1]}`;
}

function getHintTrend(hintsByBlock: number[]): ParentSummaryMetrics['hintTrend'] {
  if (hintsByBlock.length === 0) {
    return 'steady';
  }

  const midpoint = Math.ceil(hintsByBlock.length / 2);
  const firstHalf = hintsByBlock.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
  const secondHalf = hintsByBlock.slice(midpoint).reduce((sum, value) => sum + value, 0);

  if (secondHalf < firstHalf) return 'improving';
  if (secondHalf > firstHalf) return 'needs_support';
  return 'steady';
}

function getStableRange(accuracy: number): StableRange {
  if (accuracy >= 85) return '1-10';
  if (accuracy >= 60) return '1-5';
  return '1-3';
}

function getTopConfusionPair(pairMistakes: Record<string, number>): [LetterId, LetterId] | null {
  const entries = Object.entries(pairMistakes);
  if (entries.length === 0) {
    return null;
  }

  const [pairKey] = entries.sort((left, right) => right[1] - left[1])[0]!;
  const [a, b] = pairKey.split('|') as [LetterId, LetterId];
  return [a, b];
}

function resolveLevelId(levelNumber: number | null | undefined): GameLevelId {
  if (levelNumber === 1 || levelNumber === 2 || levelNumber === 3) {
    return levelNumber;
  }

  return DEFAULT_LEVEL_ID;
}

function buildLetterSequence(levelId: GameLevelId): LetterId[] {
  const pool = LETTER_POOL_BY_LEVEL[levelId];
  const sequence: LetterId[] = [];

  const confusionPair =
    levelId === 1
      ? null
      : pickRandom(CONFUSION_PAIRS.filter((pair) => pool.includes(pair[0]) && pool.includes(pair[1])));

  if (confusionPair) {
    sequence.push(confusionPair[0], confusionPair[1]);
  }

  while (sequence.length < TOTAL_BLOCKS) {
    const candidate = pickRandom(pool);
    const previous = sequence.at(-1);
    if (candidate === previous) {
      continue;
    }
    sequence.push(candidate);
  }

  return shuffle(sequence).slice(0, TOTAL_BLOCKS);
}

function laneToInlineStartPercent(lane: number): number {
  if (LANE_COUNT <= 1) {
    return 50;
  }

  return (lane / (LANE_COUNT - 1)) * 100;
}

function buildSpawnIntervalMs(levelId: GameLevelId, speedScale: number): number {
  if (levelId === 1) {
    return Math.max(520, randomInt(920, 1320) / Math.max(0.8, speedScale));
  }

  if (levelId === 2) {
    return Math.max(420, randomInt(760, 1120) / Math.max(0.85, speedScale));
  }

  return Math.max(320, randomInt(620, 980) / Math.max(0.9, speedScale));
}

function resolveDifficultyProfile(levelId: GameLevelId, ageBand: '3-4' | '4-5' | '5-6' | '6-7'): DifficultyConfig {
  const base = LEVEL_DIFFICULTY[levelId];

  if (ageBand === '3-4') {
    return {
      targetRatio: Math.max(base.targetRatio, 0.72),
      maxActiveObjects: 2,
      minFallDurationSec: Math.max(base.minFallDurationSec, 2.2),
      maxFallDurationSec: Math.max(base.maxFallDurationSec, 3.0),
    };
  }

  if (ageBand === '4-5') {
    return {
      targetRatio: Math.max(base.targetRatio, 0.62),
      maxActiveObjects: Math.min(3, Math.max(2, base.maxActiveObjects)),
      minFallDurationSec: Math.max(base.minFallDurationSec, 1.9),
      maxFallDurationSec: Math.max(base.maxFallDurationSec, 2.6),
    };
  }

  if (ageBand === '6-7') {
    return {
      targetRatio: Math.min(base.targetRatio, 0.34),
      maxActiveObjects: Math.min(LANE_COUNT, Math.max(base.maxActiveObjects, 5)),
      minFallDurationSec: Math.min(base.minFallDurationSec, 1.0),
      maxFallDurationSec: Math.min(base.maxFallDurationSec, 1.6),
    };
  }

  return base;
}

export function LetterSkyCatcherGame({ level, onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir(i18n.language));
  const replayIcon = rtlReplayGlyph(isRtl);
  const nextIcon = rtlNextGlyph(isRtl);

  const fallbackLevelId = useMemo(() => resolveLevelId(level.levelNumber), [level.levelNumber]);
  const levelConfigJson = useMemo(
    () => (level.configJson as Record<string, unknown>) ?? {},
    [level.configJson],
  );
  const routingContext = useMemo(
    () => resolveLettersRoutingContext(levelConfigJson, fallbackLevelId),
    [fallbackLevelId, levelConfigJson],
  );
  const levelId = useMemo(() => routingContext.initialLevelId, [routingContext.initialLevelId]);
  const levelConfig = useMemo(
    () => resolveDifficultyProfile(levelId, routingContext.ageBand),
    [levelId, routingContext.ageBand],
  );
  const letterSequence = useMemo(() => buildLetterSequence(levelId), [levelId]);

  const [blockIndex, setBlockIndex] = useState(0);
  const [currentLetter, setCurrentLetter] = useState<LetterId>(() => letterSequence[0] ?? 'mem');
  const [objects, setObjects] = useState<FallingObject[]>([]);
  const [playerLane, setPlayerLane] = useState(Math.floor(LANE_COUNT / 2));
  const [message, setMessage] = useState<RoundMessage>({
    key: 'games.letterSkyCatcher.instructions.intro',
    tone: 'neutral',
  });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);
  const [promptPulse, setPromptPulse] = useState(false);
  const [fieldFeedback, setFieldFeedback] = useState<'idle' | 'success' | 'miss'>('idle');
  const [scorePulse, setScorePulse] = useState(false);
  const [speedScale, setSpeedScale] = useState(1);
  const [targetRatio, setTargetRatio] = useState(levelConfig.targetRatio);
  const [maxActiveObjects, setMaxActiveObjects] = useState(levelConfig.maxActiveObjects);
  const [blockStartedAt, setBlockStartedAt] = useState(() => Date.now());
  const [blockEndsAt, setBlockEndsAt] = useState(() => Date.now() + BLOCK_DURATION_MS);
  const [blockExtended, setBlockExtended] = useState(false);
  const [hintObjectId, setHintObjectId] = useState<string | null>(null);
  const [correctCatches, setCorrectCatches] = useState(0);
  const [wrongCatches, setWrongCatches] = useState(0);
  const [missedTargets, setMissedTargets] = useState(0);
  const [rewardTier, setRewardTier] = useState(0);
  const [blockHintUsage, setBlockHintUsage] = useState(0);
  const [blockMistakes, setBlockMistakes] = useState(0);

  const playerLaneRef = useRef(playerLane);
  const blockIndexRef = useRef(blockIndex);
  const currentLetterRef = useRef(currentLetter);
  const objectsRef = useRef<FallingObject[]>(objects);
  const sessionCompleteRef = useRef(sessionComplete);
  const speedScaleRef = useRef(speedScale);
  const targetRatioRef = useRef(targetRatio);
  const maxActiveObjectsRef = useRef(maxActiveObjects);
  const blockEndsAtRef = useRef(blockEndsAt);
  const blockStartedAtRef = useRef(blockStartedAt);
  const blockExtendedRef = useRef(blockExtended);
  const blockHintUsageRef = useRef(blockHintUsage);
  const blockMistakesRef = useRef(blockMistakes);

  const targetHitStreakRef = useRef(0);
  const wrongCatchStreakRef = useRef(0);
  const adaptationToggleRef = useRef<'speed' | 'density'>('speed');

  const slowUntilRef = useRef(0);
  const remediationUntilRef = useRef(0);
  const hintUntilRef = useRef(0);
  const spawnIntervalMsRef = useRef(buildSpawnIntervalMs(levelId, 1));
  const lastSpawnAtRef = useRef(0);
  const lastTickAtRef = useRef(Date.now());
  const objectSerialRef = useRef(0);
  const pointerStartXRef = useRef<number | null>(null);

  const hintUsageByBlockRef = useRef<number[]>([]);
  const pairMistakesRef = useRef<Record<string, number>>({});

  const feedbackTimeoutRef = useRef<number | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);
  const scorePulseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    playerLaneRef.current = playerLane;
  }, [playerLane]);

  useEffect(() => {
    blockIndexRef.current = blockIndex;
  }, [blockIndex]);

  useEffect(() => {
    currentLetterRef.current = currentLetter;
  }, [currentLetter]);

  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  useEffect(() => {
    sessionCompleteRef.current = sessionComplete;
  }, [sessionComplete]);

  useEffect(() => {
    speedScaleRef.current = speedScale;
  }, [speedScale]);

  useEffect(() => {
    targetRatioRef.current = targetRatio;
  }, [targetRatio]);

  useEffect(() => {
    maxActiveObjectsRef.current = maxActiveObjects;
  }, [maxActiveObjects]);

  useEffect(() => {
    blockEndsAtRef.current = blockEndsAt;
  }, [blockEndsAt]);

  useEffect(() => {
    blockStartedAtRef.current = blockStartedAt;
  }, [blockStartedAt]);

  useEffect(() => {
    blockExtendedRef.current = blockExtended;
  }, [blockExtended]);

  useEffect(() => {
    blockHintUsageRef.current = blockHintUsage;
  }, [blockHintUsage]);

  useEffect(() => {
    blockMistakesRef.current = blockMistakes;
  }, [blockMistakes]);

  const playAudio = useCallback(
    async (key: StatusKey, mode: 'queue' | 'interrupt' = 'queue') => {
      if (audioPlaybackFailed) {
        return;
      }
      try {
        const path = getAudioPathForKey(key);
        if (mode === 'interrupt') {
          await audio.playNow(path);
          return;
        }
        await audio.play(path);
      } catch {
        setAudioPlaybackFailed((current) => current || true);
      }
    },
    [audio, audioPlaybackFailed],
  );

  const setMessageWithAudio = useCallback(
    (key: StatusKey, tone: MessageTone, mode: 'queue' | 'interrupt' = 'queue') => {
      setMessage({ key, tone });
      void playAudio(key, mode);
    },
    [playAudio],
  );

  const markFieldFeedback = useCallback((next: 'success' | 'miss') => {
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    setFieldFeedback(next);
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFieldFeedback('idle');
      feedbackTimeoutRef.current = null;
    }, 320);
  }, []);

  const pulsePrompt = useCallback((durationMs: number) => {
    setPromptPulse(true);
    if (pulseTimeoutRef.current !== null) {
      window.clearTimeout(pulseTimeoutRef.current);
    }

    pulseTimeoutRef.current = window.setTimeout(() => {
      setPromptPulse(false);
      pulseTimeoutRef.current = null;
    }, durationMs);
  }, []);

  const triggerScorePulse = useCallback(() => {
    setScorePulse(true);
    if (scorePulseTimeoutRef.current !== null) {
      window.clearTimeout(scorePulseTimeoutRef.current);
    }
    scorePulseTimeoutRef.current = window.setTimeout(() => {
      setScorePulse(false);
      scorePulseTimeoutRef.current = null;
    }, 300);
  }, []);

  const updateRewardTier = useCallback((nextCorrectCatches: number) => {
    const nextTier =
      nextCorrectCatches >= 12
        ? 4
        : nextCorrectCatches >= 9
          ? 3
          : nextCorrectCatches >= 6
            ? 2
            : nextCorrectCatches >= 3
              ? 1
              : 0;

    setRewardTier((currentTier) => {
      if (nextTier <= currentTier) {
        return currentTier;
      }

      const rewardKey: StatusKey =
        nextTier === 1
          ? 'games.letterSkyCatcher.rewards.wearable'
          : nextTier === 2
            ? 'games.letterSkyCatcher.rewards.trail'
            : nextTier === 3
              ? 'games.letterSkyCatcher.rewards.glow'
              : 'games.letterSkyCatcher.rewards.celebration';

      void playAudio(rewardKey);
      return nextTier;
    });
  }, [playAudio]);

  const resetRoundAdaptation = useCallback(() => {
    setSpeedScale(1);
    setTargetRatio(levelConfig.targetRatio);
    setMaxActiveObjects(levelConfig.maxActiveObjects);
    targetHitStreakRef.current = 0;
    wrongCatchStreakRef.current = 0;
    adaptationToggleRef.current = 'speed';
    remediationUntilRef.current = 0;
    slowUntilRef.current = 0;
    setHintObjectId(null);
  }, [levelConfig.maxActiveObjects, levelConfig.targetRatio]);

  const startBlock = useCallback(
    (nextBlockIndex: number, announcement: 'intro' | 'rotate' | 'manual-next' | 'retry') => {
      const nextLetter = letterSequence[nextBlockIndex] ?? pickRandom(LETTER_POOL_BY_LEVEL[levelId]);
      const now = Date.now();

      setBlockIndex(nextBlockIndex);
      setCurrentLetter(nextLetter);
      setObjects([]);
      objectsRef.current = [];
      setPlayerLane(Math.floor(LANE_COUNT / 2));
      setBlockStartedAt(now);
      setBlockEndsAt(now + BLOCK_DURATION_MS);
      setBlockExtended(false);
      setBlockHintUsage(0);
      setBlockMistakes(0);
      resetRoundAdaptation();

      blockHintUsageRef.current = 0;
      blockMistakesRef.current = 0;
      blockExtendedRef.current = false;
      blockStartedAtRef.current = now;
      blockEndsAtRef.current = now + BLOCK_DURATION_MS;
      spawnIntervalMsRef.current = buildSpawnIntervalMs(levelId, 1);
      lastSpawnAtRef.current = 0;

      if (announcement === 'retry') {
        setMessageWithAudio('games.letterSkyCatcher.hints.trySameLetter', 'hint', 'interrupt');
        void playAudio(`letters.pronunciation.${nextLetter}` as LetterPronunciationKey);
        return;
      }

      if (announcement === 'intro') {
        setMessageWithAudio('games.letterSkyCatcher.prompts.letterIntro.ready', 'neutral', 'interrupt');
      } else if (announcement === 'manual-next') {
        setMessageWithAudio('games.letterSkyCatcher.prompts.letterRotate.keepGoing', 'success', 'interrupt');
      } else {
        setMessageWithAudio('games.letterSkyCatcher.prompts.letterRotate.nextLetter', 'neutral', 'interrupt');
      }

      void playAudio('games.letterSkyCatcher.prompts.letterIntro.listenForLetter');
      void playAudio(`letters.pronunciation.${nextLetter}` as LetterPronunciationKey);
      void playAudio('games.letterSkyCatcher.prompts.letterIntro.anchorWord');
      void playAudio(`letters.anchorWords.${nextLetter}` as LetterAnchorWordKey);
    },
    [letterSequence, levelId, playAudio, resetRoundAdaptation, setMessageWithAudio],
  );

  const completeSession = useCallback(() => {
    if (sessionCompleteRef.current) {
      return;
    }

    sessionCompleteRef.current = true;

    const hintsByBlock = [...hintUsageByBlockRef.current];
    if (hintsByBlock.length < TOTAL_BLOCKS) {
      hintsByBlock.push(blockHintUsageRef.current);
      hintUsageByBlockRef.current = hintsByBlock;
    }

    const totalAttempts = correctCatches + wrongCatches + missedTargets;
    const accuracy = Math.round((correctCatches / Math.max(totalAttempts, 1)) * 100);
    const firstAttemptSuccessRate = Math.round((correctCatches / Math.max(TOTAL_BLOCKS * 3, 1)) * 100);
    const hintTrend = getHintTrend(hintsByBlock);

    const completionResult: GameCompletionResult = {
      completed: true,
      score: accuracy,
      stars: accuracy >= 85 ? 3 : accuracy >= 65 ? 2 : 1,
      roundsCompleted: TOTAL_BLOCKS,
      summaryMetrics: {
        highestStableRange: getStableRange(accuracy),
        firstAttemptSuccessRate,
        hintTrend,
      },
    };

    onComplete(completionResult);
    setSessionComplete(true);
    setMessage({ key: 'games.letterSkyCatcher.recap.summary', tone: 'success' });
    void playAudio('games.letterSkyCatcher.recap.summary', 'interrupt');
    void playAudio('games.letterSkyCatcher.recap.nextStep');
  }, [blockHintUsageRef, correctCatches, missedTargets, onComplete, playAudio, wrongCatches]);

  const goToNextBlock = useCallback(
    (source: 'timer' | 'manual-next' = 'timer') => {
      const finalizedHints = blockHintUsageRef.current;
      hintUsageByBlockRef.current = [...hintUsageByBlockRef.current, finalizedHints];

      const nextIndex = blockIndexRef.current + 1;
      if (nextIndex >= TOTAL_BLOCKS) {
        completeSession();
        return;
      }

      startBlock(nextIndex, source === 'manual-next' ? 'manual-next' : 'rotate');
    },
    [completeSession, startBlock],
  );

  const applyAdaptiveDifficultyAfterTargetHit = useCallback(() => {
    targetHitStreakRef.current += 1;
    wrongCatchStreakRef.current = 0;

    if (targetHitStreakRef.current < 3) {
      return;
    }

    targetHitStreakRef.current = 0;

    if (adaptationToggleRef.current === 'speed') {
      setSpeedScale((current) => {
        const next = Math.min(1.35, current + 0.08);
        speedScaleRef.current = next;
        return next;
      });
      adaptationToggleRef.current = 'density';
      return;
    }

    setMaxActiveObjects((current) => {
      const cap = Math.min(levelConfig.maxActiveObjects + 1, LANE_COUNT);
      const next = Math.min(cap, current + 1);
      maxActiveObjectsRef.current = next;
      return next;
    });
    adaptationToggleRef.current = 'speed';
  }, [levelConfig.maxActiveObjects]);

  const activateSupportMode = useCallback(
    (reason: 'wrong-catch-streak' | 'mistake-threshold') => {
      if (reason === 'wrong-catch-streak') {
        setMaxActiveObjects((current) => {
          const next = Math.max(2, current - 1);
          maxActiveObjectsRef.current = next;
          return next;
        });
        setMessageWithAudio('games.letterSkyCatcher.hints.slowAndFocus', 'hint', 'interrupt');
        void playAudio(`letters.anchorWords.${currentLetterRef.current}` as LetterAnchorWordKey);
        return;
      }

      const now = Date.now();
      remediationUntilRef.current = now + REMEDIATION_DURATION_MS;
      setTargetRatio(0.7);
      targetRatioRef.current = 0.7;
      setSpeedScale((current) => {
        const next = Math.max(0.78, current * 0.85);
        speedScaleRef.current = next;
        return next;
      });
      setMessageWithAudio('games.letterSkyCatcher.hints.watchGlow', 'hint', 'interrupt');
      pulsePrompt(900);
    },
    [playAudio, pulsePrompt, setMessageWithAudio],
  );

  const registerMistake = useCallback(
    (kind: 'wrong-catch' | 'missed-target', mistakenLetter?: LetterId) => {
      setBlockMistakes((current) => {
        const next = current + 1;
        blockMistakesRef.current = next;

        if (next >= 3 && !blockExtendedRef.current) {
          blockExtendedRef.current = true;
          setBlockExtended(true);
          setBlockEndsAt((endsAt) => {
            const nextEndsAt = endsAt + BLOCK_SUPPORT_EXTENSION_MS;
            blockEndsAtRef.current = nextEndsAt;
            return nextEndsAt;
          });
        }

        if (next >= 3 && Date.now() >= remediationUntilRef.current) {
          activateSupportMode('mistake-threshold');
        }

        return next;
      });

      targetHitStreakRef.current = 0;

      if (kind === 'wrong-catch') {
        wrongCatchStreakRef.current += 1;
      } else {
        wrongCatchStreakRef.current = 0;
      }

      if (wrongCatchStreakRef.current >= 2) {
        activateSupportMode('wrong-catch-streak');
        wrongCatchStreakRef.current = 0;
      }

      if (mistakenLetter) {
        const pairKey = normalizePair(currentLetterRef.current, mistakenLetter);
        pairMistakesRef.current = {
          ...pairMistakesRef.current,
          [pairKey]: (pairMistakesRef.current[pairKey] ?? 0) + 1,
        };
      }
    },
    [activateSupportMode],
  );

  const handleTargetCatch = useCallback(
    (object: FallingObject) => {
      markFieldFeedback('success');
      setCorrectCatches((current) => {
        const next = current + 1;
        updateRewardTier(next);
        return next;
      });
      triggerScorePulse();

      setMessageWithAudio('games.letterSkyCatcher.prompts.objectHit.success', 'success', 'interrupt');
      void playAudio(OBJECT_META_BY_ID[object.objectId].nameKey);
      applyAdaptiveDifficultyAfterTargetHit();
    },
    [applyAdaptiveDifficultyAfterTargetHit, markFieldFeedback, playAudio, setMessageWithAudio, triggerScorePulse, updateRewardTier],
  );

  const handleWrongCatch = useCallback(
    (object: FallingObject) => {
      markFieldFeedback('miss');
      setWrongCatches((current) => current + 1);
      setMessageWithAudio('games.letterSkyCatcher.prompts.objectHit.gentleRetry', 'hint', 'interrupt');
      registerMistake('wrong-catch', object.letterId);
    },
    [markFieldFeedback, registerMistake, setMessageWithAudio],
  );

  const handleMissedTarget = useCallback(() => {
    setMissedTargets((current) => current + 1);
    setMessageWithAudio('games.letterSkyCatcher.prompts.objectHit.missedTarget', 'hint');
    registerMistake('missed-target');
  }, [registerMistake, setMessageWithAudio]);

  const buildFallingObject = useCallback((): FallingObject => {
    const isRemediationActive = Date.now() < remediationUntilRef.current;
    const ratio = isRemediationActive ? 0.7 : targetRatioRef.current;

    const levelPool = LETTER_POOL_BY_LEVEL[levelId];
    const useTargetLetter = Math.random() < ratio;

    const objectLetter = useTargetLetter
      ? currentLetterRef.current
      : pickRandom(levelPool.filter((letter) => letter !== currentLetterRef.current));

    const objectId = pickRandom(OBJECT_IDS_BY_LETTER[objectLetter]);
    const minDuration = levelConfig.minFallDurationSec;
    const maxDuration = levelConfig.maxFallDurationSec;

    const randomDuration = randomInRange(minDuration, maxDuration);

    return {
      id: `letter-sky-${objectSerialRef.current += 1}`,
      objectId,
      letterId: objectLetter,
      lane: randomInt(0, LANE_COUNT - 1),
      progress: -0.18,
      speed: 1 / randomDuration,
      isTarget: objectLetter === currentLetterRef.current,
    };
  }, [levelConfig.maxFallDurationSec, levelConfig.minFallDurationSec, levelId]);

  const movePlayer = useCallback((direction: 'left' | 'right') => {
    setPlayerLane((current) => {
      const next = direction === 'left' ? Math.max(0, current - 1) : Math.min(LANE_COUNT - 1, current + 1);
      playerLaneRef.current = next;
      return next;
    });
  }, []);

  const handleReplay = useCallback(() => {
    if (sessionCompleteRef.current) {
      return;
    }

    slowUntilRef.current = Date.now() + 2000;
    pulsePrompt(850);
    setMessageWithAudio('games.letterSkyCatcher.hints.replayInstruction', 'neutral', 'interrupt');
    void playAudio('games.letterSkyCatcher.instructions.catchTargets');
    void playAudio(`letters.pronunciation.${currentLetterRef.current}` as LetterPronunciationKey);
    void playAudio(`letters.anchorWords.${currentLetterRef.current}` as LetterAnchorWordKey);
  }, [playAudio, pulsePrompt, setMessageWithAudio]);

  const handleRetry = useCallback(() => {
    if (sessionCompleteRef.current) {
      return;
    }

    setSpeedScale((current) => {
      const next = Math.max(0.75, current * 0.9);
      speedScaleRef.current = next;
      return next;
    });

    const currentIndex = blockIndexRef.current;
    startBlock(currentIndex, 'retry');
  }, [startBlock]);

  const handleHint = useCallback(() => {
    if (sessionCompleteRef.current) {
      return;
    }

    setBlockHintUsage((current) => {
      const next = current + 1;
      blockHintUsageRef.current = next;
      return next;
    });

    const now = Date.now();
    hintUntilRef.current = now + 1700;

    const currentObjects = objectsRef.current;
    const nextTarget = currentObjects.find((object) => object.isTarget);

    if (nextTarget) {
      setHintObjectId(nextTarget.id);
      setMessageWithAudio('games.letterSkyCatcher.hints.watchGlow', 'hint', 'interrupt');
      return;
    }

    const spawnedTarget = buildFallingObject();
    spawnedTarget.letterId = currentLetterRef.current;
    spawnedTarget.objectId = pickRandom(OBJECT_IDS_BY_LETTER[currentLetterRef.current]);
    spawnedTarget.isTarget = true;

    const nextObjects = [...currentObjects, spawnedTarget];
    objectsRef.current = nextObjects;
    setObjects(nextObjects);
    setHintObjectId(spawnedTarget.id);
    setMessageWithAudio('games.letterSkyCatcher.hints.watchGlow', 'hint', 'interrupt');
  }, [buildFallingObject, setMessageWithAudio]);

  const handleNext = useCallback(() => {
    if (sessionCompleteRef.current) {
      return;
    }

    void playAudio('nav.next', 'interrupt');
    goToNextBlock('manual-next');
  }, [goToNextBlock, playAudio]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (sessionCompleteRef.current) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        movePlayer('left');
        return;
      }

      if (event.key === 'ArrowRight') {
        movePlayer('right');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [movePlayer]);

  useEffect(() => {
    const now = Date.now();
    setBlockStartedAt(now);
    setBlockEndsAt(now + BLOCK_DURATION_MS);
    setMessageWithAudio('games.letterSkyCatcher.instructions.intro', 'neutral', 'interrupt');
    void playAudio('games.letterSkyCatcher.instructions.moveBear');
    void playAudio('games.letterSkyCatcher.instructions.catchTargets');

    const openerTimeout = window.setTimeout(() => {
      startBlock(0, 'intro');
    }, 160);

    return () => {
      window.clearTimeout(openerTimeout);
    };
  }, [playAudio, setMessageWithAudio, startBlock]);

  useEffect(() => {
    if (sessionComplete) {
      return;
    }

    const interval = window.setInterval(() => {
      if (sessionCompleteRef.current) {
        return;
      }

      const now = Date.now();
      const elapsedSec = Math.max(0.02, (now - lastTickAtRef.current) / 1000);
      lastTickAtRef.current = now;

      if (hintUntilRef.current > 0 && now >= hintUntilRef.current) {
        hintUntilRef.current = 0;
        setHintObjectId(null);
      }

      if (remediationUntilRef.current > 0 && now >= remediationUntilRef.current) {
        remediationUntilRef.current = 0;
        setTargetRatio(levelConfig.targetRatio);
        targetRatioRef.current = levelConfig.targetRatio;
      }

      if (now >= blockEndsAtRef.current) {
        goToNextBlock('timer');
        return;
      }

      const effectiveSpeedScale =
        speedScaleRef.current *
        (now < slowUntilRef.current ? 0.62 : 1) *
        (now < remediationUntilRef.current ? 0.84 : 1);

      const nextObjects: FallingObject[] = [];

      for (const object of objectsRef.current) {
        const nextProgress = object.progress + elapsedSec * object.speed * effectiveSpeedScale;

        const collidesWithPlayer =
          nextProgress >= PLAYER_CATCH_START &&
          nextProgress <= PLAYER_CATCH_END &&
          object.lane === playerLaneRef.current;

        if (collidesWithPlayer) {
          if (object.isTarget) {
            handleTargetCatch(object);
          } else {
            handleWrongCatch(object);
          }
          continue;
        }

        if (nextProgress >= 1.05) {
          if (object.isTarget) {
            handleMissedTarget();
          }
          continue;
        }

        nextObjects.push({
          ...object,
          progress: nextProgress,
        });
      }

      const shouldSpawn =
        nextObjects.length < maxActiveObjectsRef.current && now - lastSpawnAtRef.current >= spawnIntervalMsRef.current;

      if (shouldSpawn) {
        const spawned = buildFallingObject();
        nextObjects.push(spawned);
        lastSpawnAtRef.current = now;
        spawnIntervalMsRef.current = buildSpawnIntervalMs(levelId, effectiveSpeedScale);
      }

      objectsRef.current = nextObjects;
      setObjects(nextObjects);
    }, 40);

    return () => {
      window.clearInterval(interval);
    };
  }, [buildFallingObject, goToNextBlock, handleMissedTarget, handleTargetCatch, handleWrongCatch, levelConfig.targetRatio, levelId, sessionComplete]);

  useEffect(
    () => () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
      if (scorePulseTimeoutRef.current !== null) {
        window.clearTimeout(scorePulseTimeoutRef.current);
      }
    },
    [],
  );

  const blockProgress = useMemo(() => {
    const duration = Math.max(1, blockEndsAt - blockStartedAt);
    const remaining = Math.max(0, blockEndsAt - Date.now());
    const completionRatio = 1 - remaining / duration;
    return Math.max(0, Math.min(1, completionRatio));
  }, [blockEndsAt, blockStartedAt, objects.length]);

  const completionSummary = useMemo(() => {
    const hintsByBlock = hintUsageByBlockRef.current;
    const totalAttempts = correctCatches + wrongCatches + missedTargets;
    const accuracy = Math.round((correctCatches / Math.max(totalAttempts, 1)) * 100);
    const hintTrend = getHintTrend(hintsByBlock);

    const confusionPair = getTopConfusionPair(pairMistakesRef.current);
    const confusionPairLabel = confusionPair
      ? `${t(`letters.symbols.${confusionPair[0]}` as const)} / ${t(`letters.symbols.${confusionPair[1]}` as const)}`
      : `${t('letters.symbols.bet')} / ${t('letters.symbols.pe')}`;

    const hintTrendLabel =
      hintTrend === 'improving' ? t('feedback.excellent') : hintTrend === 'steady' ? t('feedback.keepGoing') : t('feedback.greatEffort');

    return {
      accuracy,
      confusionPairLabel,
      hintTrendLabel,
    };
  }, [correctCatches, missedTargets, t, wrongCatches, rewardTier]);

  const rewardLabel =
    rewardTier === 0
      ? t('games.letterSkyCatcher.rewards.wearable')
      : rewardTier === 1
        ? t('games.letterSkyCatcher.rewards.trail')
        : rewardTier === 2
          ? t('games.letterSkyCatcher.rewards.glow')
          : t('games.letterSkyCatcher.rewards.celebration');

  const activeLetterSymbol = t(`letters.symbols.${currentLetter}` as const);

  return (
    <Card padding="lg" className="letter-sky-catcher">
      <div className="letter-sky-catcher__header">
        <div className="letter-sky-catcher__title-wrap">
          <h2 className="letter-sky-catcher__title">{t('games.letterSkyCatcher.title')}</h2>
          <p className="letter-sky-catcher__subtitle">{t('games.letterSkyCatcher.subtitle')}</p>
        </div>

        <div className="letter-sky-catcher__meta-pills" aria-live="polite">
          <span className={['letter-sky-catcher__meta-pill', scorePulse ? 'letter-sky-catcher__meta-pill--score-pulse' : ''].join(' ')}>
            ⭐ {correctCatches}
          </span>
          <span className="letter-sky-catcher__meta-pill">🎯 {blockIndex + 1}/{TOTAL_BLOCKS}</span>
        </div>
      </div>

      <div className="letter-sky-catcher__progress" aria-label={t('games.estimatedTime', { minutes: 5 })}>
        {Array.from({ length: TOTAL_BLOCKS }, (_, index) => (
          <span
            key={`letter-block-${index + 1}`}
            className={[
              'letter-sky-catcher__progress-dot',
              index < blockIndex
                ? 'letter-sky-catcher__progress-dot--done'
                : index === blockIndex
                  ? 'letter-sky-catcher__progress-dot--active'
                  : '',
              index === blockIndex && !sessionComplete ? 'letter-sky-catcher__progress-dot--active-live' : '',
            ].join(' ')}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className={['letter-sky-catcher__status-row', promptPulse ? 'letter-sky-catcher__status-row--pulse' : ''].join(' ')}>
        <MascotIllustration variant="hint" size={54} />
        <p className={`letter-sky-catcher__message letter-sky-catcher__message--${message.tone}`}>{t(message.key)}</p>
      </div>

      {audioPlaybackFailed && !sessionComplete && (
        <p className="letter-sky-catcher__audio-fallback">
          🔇 {t('games.letterSkyCatcher.instructions.catchTargets')}
        </p>
      )}

      {!sessionComplete && (
        <div className="letter-sky-catcher__icon-controls">
          <button
            type="button"
            className="letter-sky-catcher__icon-button"
            onClick={handleReplay}
            aria-label={t('games.letterSkyCatcher.instructions.tapReplay')}
          >
            {replayIcon}
          </button>
          <button
            type="button"
            className="letter-sky-catcher__icon-button"
            onClick={handleRetry}
            aria-label={t('games.letterSkyCatcher.hints.trySameLetter')}
          >
            ↻
          </button>
          <button
            type="button"
            className="letter-sky-catcher__icon-button"
            onClick={handleHint}
            aria-label={t('games.letterSkyCatcher.hints.watchGlow')}
          >
            💡
          </button>
          <button type="button" className="letter-sky-catcher__icon-button" onClick={handleNext} aria-label={t('nav.next')}>
            {nextIcon}
          </button>
        </div>
      )}

      {!sessionComplete && (
        <div className="letter-sky-catcher__field-wrap">
          <div className="letter-sky-catcher__letter-chip" aria-live="polite">
            <button
              type="button"
              className="letter-sky-catcher__inline-replay"
              onClick={handleReplay}
              aria-label={t('games.letterSkyCatcher.instructions.tapReplay')}
            >
              {replayIcon}
            </button>
            <span className="letter-sky-catcher__letter-symbol">{activeLetterSymbol}</span>
            <span className="letter-sky-catcher__letter-word">{t(`letters.anchorWords.${currentLetter}` as const)}</span>
          </div>

          <div
            className={[
              'letter-sky-catcher__playfield',
              fieldFeedback === 'success' ? 'letter-sky-catcher__playfield--success' : '',
              fieldFeedback === 'miss' ? 'letter-sky-catcher__playfield--miss' : '',
            ].join(' ')}
            onPointerDown={(event) => {
              pointerStartXRef.current = event.clientX;
            }}
            onPointerUp={(event) => {
              const startX = pointerStartXRef.current;
              pointerStartXRef.current = null;
              if (startX === null) {
                return;
              }

              const deltaX = event.clientX - startX;
              if (Math.abs(deltaX) < 24) {
                return;
              }

              movePlayer(deltaX < 0 ? 'left' : 'right');
            }}
          >
            <div className="letter-sky-catcher__sky-layer" aria-hidden="true" />

            {Array.from({ length: LANE_COUNT }, (_, lane) => (
              <span
                key={`lane-guide-${lane}`}
                className="letter-sky-catcher__lane-guide"
                style={{ insetInlineStart: `${laneToInlineStartPercent(lane)}%` }}
                aria-hidden="true"
              />
            ))}

            {objects.map((object) => {
              const meta = OBJECT_META_BY_ID[object.objectId];
              const isHintGlow = hintObjectId === object.id;

              return (
                <button
                  key={object.id}
                  type="button"
                  className={[
                    'letter-sky-catcher__falling-object',
                    object.isTarget ? 'letter-sky-catcher__falling-object--target' : 'letter-sky-catcher__falling-object--distractor',
                    isHintGlow ? 'letter-sky-catcher__falling-object--hint' : '',
                  ].join(' ')}
                  style={{
                    insetInlineStart: `calc(${laneToInlineStartPercent(object.lane)}% - ${OBJECT_INLINE_SIZE / 2}px)`,
                    insetBlockStart: `calc(${Math.max(-0.18, object.progress) * 100}% - ${OBJECT_INLINE_SIZE / 2}px)`,
                  }}
                  onClick={() => {
                    if (object.lane === playerLaneRef.current) {
                      return;
                    }

                    const targetDirection = object.lane < playerLaneRef.current ? 'left' : 'right';
                    movePlayer(targetDirection);
                  }}
                  aria-label={t(meta.nameKey)}
                >
                  <span className="letter-sky-catcher__object-icon" aria-hidden="true">
                    {meta.icon}
                  </span>
                  <span className="letter-sky-catcher__object-name">{t(meta.nameKey)}</span>
                  <span className="letter-sky-catcher__object-badge">{t(`letters.symbols.${meta.letterId}` as const)}</span>
                </button>
              );
            })}

            <div
              className="letter-sky-catcher__player"
              style={{ insetInlineStart: `calc(${laneToInlineStartPercent(playerLane)}% - ${PLAYER_INLINE_SIZE / 2}px)` }}
              aria-live="polite"
            >
              <MascotIllustration variant="hero" size={74} />
            </div>
          </div>

          <div className="letter-sky-catcher__movement-controls">
            <button
              type="button"
              className="letter-sky-catcher__move-button"
              onClick={() => movePlayer('left')}
              aria-label={t('games.letterSkyCatcher.instructions.moveBearLeft')}
            >
              ⬅
            </button>
            <button
              type="button"
              className="letter-sky-catcher__move-button"
              onClick={() => movePlayer('right')}
              aria-label={t('games.letterSkyCatcher.instructions.moveBearRight')}
            >
              ➡
            </button>
          </div>

          <div className="letter-sky-catcher__timing-row" aria-hidden="true">
            <span
              className="letter-sky-catcher__timing-bar"
              style={{ inlineSize: `${Math.round(blockProgress * 100)}%` }}
            />
          </div>

          <p className="letter-sky-catcher__reward-hint">{rewardLabel}</p>
        </div>
      )}

      {sessionComplete && (
        <div className="letter-sky-catcher__completion">
          <SuccessCelebration dense />
          <p className="letter-sky-catcher__completion-title">{t('feedback.youDidIt')}</p>
          <p className="letter-sky-catcher__completion-line">
            {t('parentDashboard.games.letterSkyCatcher.progressSummary', {
              accuracy: `${completionSummary.accuracy}%`,
              hintTrend: completionSummary.hintTrendLabel,
            })}
          </p>
          <p className="letter-sky-catcher__completion-line">
            {t('parentDashboard.games.letterSkyCatcher.letterConfusions', {
              pair: completionSummary.confusionPairLabel,
            })}
          </p>
          <p className="letter-sky-catcher__completion-line">{t('parentDashboard.games.letterSkyCatcher.nextStep')}</p>
        </div>
      )}

      <style>{`
        .letter-sky-catcher {
          display: grid;
          gap: var(--space-md);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 26%, transparent);
          background:
            radial-gradient(circle at 10% 0%, color-mix(in srgb, var(--color-accent-secondary) 20%, transparent), transparent 58%),
            radial-gradient(circle at 90% 100%, color-mix(in srgb, var(--color-accent-primary) 16%, transparent), transparent 62%),
            var(--color-surface);
        }

        .letter-sky-catcher__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--space-sm);
        }

        .letter-sky-catcher__title-wrap {
          display: grid;
          gap: var(--space-2xs);
        }

        .letter-sky-catcher__title {
          margin: 0;
          font-size: var(--font-size-xl);
          color: var(--color-text-primary);
        }

        .letter-sky-catcher__subtitle {
          margin: 0;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .letter-sky-catcher__meta-pills {
          display: inline-flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .letter-sky-catcher__meta-pill {
          min-height: 48px;
          min-inline-size: 84px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding-inline: var(--space-sm);
          border-radius: var(--radius-full);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 32%, transparent);
          background: color-mix(in srgb, var(--color-accent-primary) 14%, transparent);
          color: var(--color-text-primary);
          font-weight: var(--font-weight-semibold);
          font-size: var(--font-size-sm);
        }

        .letter-sky-catcher__meta-pill--score-pulse {
          animation: letter-sky-catcher-score-pulse 300ms ease-out;
        }

        .letter-sky-catcher__progress {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 1fr;
          gap: var(--space-xs);
        }

        .letter-sky-catcher__progress-dot {
          block-size: 10px;
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-border) 72%, transparent);
          transition: var(--transition-fast);
        }

        .letter-sky-catcher__progress-dot--done {
          background: var(--color-accent-success);
        }

        .letter-sky-catcher__progress-dot--active {
          background: var(--color-accent-primary);
          transform: scaleY(1.35);
        }

        .letter-sky-catcher__progress-dot--active-live {
          animation: letter-sky-catcher-progress-breathe 1.1s ease-in-out infinite;
          transform-origin: center;
        }

        .letter-sky-catcher__status-row {
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm);
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
          background: color-mix(in srgb, var(--color-surface-muted) 82%, transparent);
        }

        .letter-sky-catcher__status-row--pulse {
          animation: letter-sky-catcher-prompt 360ms ease-out;
          border-color: color-mix(in srgb, var(--color-accent-primary) 62%, transparent);
          background: color-mix(in srgb, var(--color-accent-primary) 14%, var(--color-surface-muted));
        }

        .letter-sky-catcher__message {
          margin: 0;
          color: var(--color-text-primary);
          line-height: 1.4;
          font-size: var(--font-size-md);
        }

        .letter-sky-catcher__message--hint {
          color: color-mix(in srgb, var(--color-accent-warning) 82%, var(--color-text-primary));
        }

        .letter-sky-catcher__message--success {
          color: color-mix(in srgb, var(--color-accent-success) 84%, var(--color-text-primary));
        }

        .letter-sky-catcher__audio-fallback {
          margin: 0;
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-sm);
          border: 1px solid color-mix(in srgb, var(--color-accent-warning) 46%, transparent);
          background: color-mix(in srgb, var(--color-accent-warning) 16%, transparent);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          text-align: center;
        }

        .letter-sky-catcher__icon-controls {
          display: grid;
          grid-template-columns: repeat(4, minmax(48px, 1fr));
          gap: var(--space-xs);
        }

        .letter-sky-catcher__icon-button {
          min-height: 48px;
          min-inline-size: 48px;
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-border) 74%, transparent);
          background: var(--color-surface);
          font-size: 1.2rem;
          color: var(--color-text-primary);
          cursor: pointer;
          transition: transform 120ms ease;
        }

        .letter-sky-catcher__icon-button:active {
          transform: scale(0.96);
        }

        .letter-sky-catcher__field-wrap {
          display: grid;
          gap: var(--space-sm);
        }

        .letter-sky-catcher__letter-chip {
          display: inline-flex;
          align-items: center;
          justify-self: center;
          gap: var(--space-xs);
          min-height: 48px;
          padding-inline: var(--space-md);
          border-radius: var(--radius-full);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 36%, transparent);
          background: color-mix(in srgb, var(--color-accent-primary) 10%, transparent);
          color: var(--color-text-primary);
        }

        .letter-sky-catcher__inline-replay {
          min-height: 48px;
          min-inline-size: 48px;
          border-radius: var(--radius-full);
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          background: var(--color-surface);
          color: var(--color-text-primary);
          cursor: pointer;
        }

        .letter-sky-catcher__letter-symbol {
          font-size: clamp(1.5rem, 4vw, 2rem);
          font-weight: var(--font-weight-extrabold);
        }

        .letter-sky-catcher__letter-word {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .letter-sky-catcher__playfield {
          position: relative;
          min-block-size: 360px;
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          overflow: hidden;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--color-accent-primary) 18%, var(--color-surface-muted)) 0%,
              color-mix(in srgb, var(--color-surface) 92%, var(--color-theme-bg)) 64%,
              color-mix(in srgb, var(--color-accent-warning) 14%, var(--color-surface)) 100%
            );
        }

        .letter-sky-catcher__playfield--success {
          animation: letter-sky-catcher-success 320ms ease-out;
        }

        .letter-sky-catcher__playfield--miss {
          animation: letter-sky-catcher-miss 260ms ease-in-out;
        }

        .letter-sky-catcher__sky-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            circle at 80% 10%,
            color-mix(in srgb, var(--color-surface) 72%, transparent),
            transparent 46%
          );
        }

        .letter-sky-catcher__lane-guide {
          position: absolute;
          inset-block: 0;
          inline-size: 1px;
          background: linear-gradient(180deg, color-mix(in srgb, var(--color-border) 0%, transparent), color-mix(in srgb, var(--color-border) 46%, transparent), color-mix(in srgb, var(--color-border) 0%, transparent));
          transform: translateX(-50%);
        }

        .letter-sky-catcher__falling-object {
          position: absolute;
          inline-size: ${OBJECT_INLINE_SIZE}px;
          min-block-size: ${OBJECT_INLINE_SIZE}px;
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          background: color-mix(in srgb, var(--color-surface) 88%, var(--color-theme-bg));
          display: grid;
          justify-items: center;
          align-content: center;
          gap: 2px;
          padding: var(--space-2xs);
          cursor: pointer;
          transition: transform 120ms ease;
        }

        .letter-sky-catcher__falling-object:hover {
          transform: translateY(-2px);
        }

        .letter-sky-catcher__falling-object--target {
          box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--color-accent-success) 36%, transparent);
        }

        .letter-sky-catcher__falling-object--distractor {
          box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--color-accent-warning) 34%, transparent);
        }

        .letter-sky-catcher__falling-object--hint {
          animation: letter-sky-catcher-hint 800ms ease-in-out infinite;
        }

        .letter-sky-catcher__object-icon {
          font-size: 1.35rem;
          line-height: 1;
        }

        .letter-sky-catcher__object-name {
          font-size: 0.68rem;
          color: var(--color-text-primary);
          text-align: center;
          line-height: 1.2;
        }

        .letter-sky-catcher__object-badge {
          font-size: 0.7rem;
          font-weight: var(--font-weight-bold);
          color: var(--color-text-secondary);
          border-radius: var(--radius-full);
          padding-inline: 6px;
          border: 1px solid color-mix(in srgb, var(--color-border) 62%, transparent);
          background: color-mix(in srgb, var(--color-surface) 82%, var(--color-theme-bg));
        }

        .letter-sky-catcher__player {
          position: absolute;
          inset-block-end: 10px;
          inline-size: ${PLAYER_INLINE_SIZE}px;
          display: grid;
          justify-items: center;
          transition: inset-inline-start 170ms ease-out;
          pointer-events: none;
        }

        .letter-sky-catcher__movement-controls {
          display: grid;
          grid-template-columns: repeat(2, minmax(60px, 1fr));
          gap: var(--space-sm);
        }

        .letter-sky-catcher__move-button {
          min-block-size: 60px;
          min-inline-size: 60px;
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 34%, transparent);
          background: color-mix(in srgb, var(--color-accent-primary) 12%, var(--color-surface));
          font-size: 1.6rem;
          color: var(--color-text-primary);
          cursor: pointer;
          transition: transform 120ms ease;
        }

        .letter-sky-catcher__move-button:active {
          transform: scale(0.96);
        }

        .letter-sky-catcher__timing-row {
          inline-size: 100%;
          block-size: 8px;
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-border) 72%, transparent);
          overflow: hidden;
        }

        .letter-sky-catcher__timing-bar {
          display: block;
          block-size: 100%;
          border-radius: var(--radius-full);
          background: ${rtlProgressGradient(isRtl, 'var(--color-accent-success)', 'var(--color-accent-primary)')};
          transition: inline-size 140ms linear;
        }

        .letter-sky-catcher__reward-hint {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          text-align: center;
        }

        .letter-sky-catcher__completion {
          display: grid;
          gap: var(--space-sm);
          justify-items: center;
          text-align: center;
          padding: var(--space-lg);
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-accent-success) 42%, transparent);
          background: color-mix(in srgb, var(--color-accent-success) 10%, transparent);
        }

        .letter-sky-catcher__completion-title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
        }

        .letter-sky-catcher__completion-line {
          margin: 0;
          color: var(--color-text-secondary);
        }

        @keyframes letter-sky-catcher-prompt {
          0% { transform: scale(1); }
          50% { transform: scale(1.01); }
          100% { transform: scale(1); }
        }

        @keyframes letter-sky-catcher-success {
          0% { transform: scale(1); }
          55% { transform: scale(1.012); }
          100% { transform: scale(1); }
        }

        @keyframes letter-sky-catcher-miss {
          0% { transform: translateX(0); }
          33% { transform: translateX(5px); }
          66% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }

        @keyframes letter-sky-catcher-hint {
          0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent-primary) 42%, transparent); }
          70% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--color-accent-primary) 0%, transparent); }
          100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent-primary) 0%, transparent); }
        }

        @keyframes letter-sky-catcher-score-pulse {
          0% { transform: scale(1); }
          55% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }

        @keyframes letter-sky-catcher-progress-breathe {
          0% { transform: scaleY(1.35); }
          50% { transform: scaleY(1.56); }
          100% { transform: scaleY(1.35); }
        }

        @media (max-width: 768px) {
          .letter-sky-catcher {
            padding: var(--space-md);
          }

          .letter-sky-catcher__playfield {
            min-block-size: 320px;
          }

          .letter-sky-catcher__title {
            font-size: var(--font-size-lg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .letter-sky-catcher__status-row--pulse,
          .letter-sky-catcher__meta-pill--score-pulse,
          .letter-sky-catcher__progress-dot--active-live,
          .letter-sky-catcher__falling-object,
          .letter-sky-catcher__falling-object--hint,
          .letter-sky-catcher__playfield--success,
          .letter-sky-catcher__playfield--miss,
          .letter-sky-catcher__player,
          .letter-sky-catcher__move-button,
          .letter-sky-catcher__icon-button {
            animation: none !important;
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </Card>
  );
}
