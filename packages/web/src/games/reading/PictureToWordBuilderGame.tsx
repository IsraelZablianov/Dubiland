import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, GameTopBar } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';

type GameLevelId = 1 | 2 | 3;
type HintTone = 'neutral' | 'hint' | 'success';
type HintTrend = ParentSummaryMetrics['hintTrend'];
type BoardFeedback = 'idle' | 'success' | 'miss';

type LetterId =
  | 'alef'
  | 'bet'
  | 'gimel'
  | 'dalet'
  | 'he'
  | 'vav'
  | 'het'
  | 'yod'
  | 'kaf'
  | 'lamed'
  | 'mem'
  | 'nun'
  | 'samekh'
  | 'pe'
  | 'resh'
  | 'shin'
  | 'tav';

type WordId =
  | 'av'
  | 'dag'
  | 'yad'
  | 'dod'
  | 'bayit'
  | 'kelev'
  | 'sefer'
  | 'arye'
  | 'shalom'
  | 'tapuach'
  | 'menora'
  | 'arnevet';

type LetterPronunciationKey = `letters.pronunciation.${LetterId}`;
type LetterSymbolKey = `letters.symbols.${LetterId}`;
type WordPromptKey = `games.pictureToWordBuilder.prompts.word.${WordId}`;
type WordAudioKey = `reading.wordAudio.${WordId}`;

type StatusKey =
  | LetterPronunciationKey
  | WordPromptKey
  | WordAudioKey
  | 'games.pictureToWordBuilder.title'
  | 'games.pictureToWordBuilder.subtitle'
  | 'games.pictureToWordBuilder.instructions.intro'
  | 'games.pictureToWordBuilder.instructions.dragLetters'
  | 'games.pictureToWordBuilder.instructions.tapReplayWord'
  | 'games.pictureToWordBuilder.instructions.tapSegmentedHint'
  | 'games.pictureToWordBuilder.instructions.tapCheckWord'
  | 'games.pictureToWordBuilder.instructions.completeWord'
  | 'games.pictureToWordBuilder.hints.segmented.listenByParts'
  | 'games.pictureToWordBuilder.hints.segmented.firstSoundCue'
  | 'games.pictureToWordBuilder.hints.segmented.contrastPair'
  | 'games.pictureToWordBuilder.roundComplete.wordBuilt'
  | 'games.pictureToWordBuilder.roundComplete.stickerEarned'
  | 'games.pictureToWordBuilder.roundComplete.nextWord'
  | 'games.pictureToWordBuilder.feedback.encouragement.keepTrying'
  | 'games.pictureToWordBuilder.feedback.encouragement.almostThere'
  | 'games.pictureToWordBuilder.feedback.encouragement.tryAgain'
  | 'games.pictureToWordBuilder.feedback.success.wellDone'
  | 'games.pictureToWordBuilder.feedback.success.amazing'
  | 'games.pictureToWordBuilder.feedback.success.celebrate'
  | 'games.pictureToWordBuilder.summary.hintTrend.improving'
  | 'games.pictureToWordBuilder.summary.hintTrend.steady'
  | 'games.pictureToWordBuilder.summary.hintTrend.needsSupport'
  | 'games.pictureToWordBuilder.summary.noConfusionPair'
  | 'parentDashboard.games.pictureToWordBuilder.progressSummary'
  | 'parentDashboard.games.pictureToWordBuilder.nextStep'
  | 'feedback.greatEffort'
  | 'feedback.excellent'
  | 'feedback.keepGoing'
  | 'feedback.youDidIt'
  | 'nav.next';

interface WordEntry {
  id: WordId;
  pictureEmoji: string;
  letters: LetterId[];
}

interface TileState {
  id: string;
  letter: LetterId;
}

interface SlotState {
  tileId: string;
  letter: LetterId;
  locked: boolean;
}

interface RoundState {
  id: string;
  roundNumber: number;
  level: GameLevelId;
  word: WordEntry;
  tiles: TileState[];
  prefilledSlotIndexes: number[];
  fallbackMode: boolean;
  contrastLetter: LetterId | null;
}

interface RoundMessage {
  key: StatusKey;
  tone: HintTone;
}

interface SessionStats {
  firstAttemptSuccesses: number;
  hintUsageByRound: number[];
  maxWordLength: number;
  confusionPairs: Record<string, number>;
  successfulBuilds: number;
}

interface SummaryReport {
  firstAttemptSuccessRate: number;
  hintTrend: HintTrend;
  lengthBand: '2-3' | '3-4' | '4-5';
  confusionPair: { expected: LetterId; actual: LetterId } | null;
}

interface PictureToWordBuilderGameProps extends GameProps {
  onRequestBack?: () => void;
}

const TOTAL_ROUNDS = 8;
const MIDPOINT_ROUND = 4;

const BASE_DISTRACTOR_COUNT_BY_LEVEL: Record<GameLevelId, number> = {
  1: 1,
  2: 2,
  3: 4,
};

const ROUND_SUCCESS_ROTATION: Array<
  | 'games.pictureToWordBuilder.roundComplete.wordBuilt'
  | 'games.pictureToWordBuilder.roundComplete.stickerEarned'
  | 'games.pictureToWordBuilder.roundComplete.nextWord'
> = [
  'games.pictureToWordBuilder.roundComplete.wordBuilt',
  'games.pictureToWordBuilder.roundComplete.stickerEarned',
  'games.pictureToWordBuilder.roundComplete.nextWord',
];

const FEEDBACK_ROTATION: Array<
  | 'games.pictureToWordBuilder.feedback.success.wellDone'
  | 'games.pictureToWordBuilder.feedback.success.amazing'
  | 'games.pictureToWordBuilder.feedback.success.celebrate'
> = [
  'games.pictureToWordBuilder.feedback.success.wellDone',
  'games.pictureToWordBuilder.feedback.success.amazing',
  'games.pictureToWordBuilder.feedback.success.celebrate',
];

const WORDS: Record<WordId, WordEntry> = {
  av: {
    id: 'av',
    pictureEmoji: '👨',
    letters: ['alef', 'bet'],
  },
  dag: {
    id: 'dag',
    pictureEmoji: '🐟',
    letters: ['dalet', 'gimel'],
  },
  yad: {
    id: 'yad',
    pictureEmoji: '✋',
    letters: ['yod', 'dalet'],
  },
  dod: {
    id: 'dod',
    pictureEmoji: '👨‍🦰',
    letters: ['dalet', 'vav', 'dalet'],
  },
  bayit: {
    id: 'bayit',
    pictureEmoji: '🏠',
    letters: ['bet', 'yod', 'tav'],
  },
  kelev: {
    id: 'kelev',
    pictureEmoji: '🐶',
    letters: ['kaf', 'lamed', 'bet'],
  },
  sefer: {
    id: 'sefer',
    pictureEmoji: '📘',
    letters: ['samekh', 'pe', 'resh'],
  },
  arye: {
    id: 'arye',
    pictureEmoji: '🦁',
    letters: ['alef', 'resh', 'yod', 'he'],
  },
  shalom: {
    id: 'shalom',
    pictureEmoji: '👋',
    letters: ['shin', 'lamed', 'vav', 'mem'],
  },
  tapuach: {
    id: 'tapuach',
    pictureEmoji: '🍎',
    letters: ['tav', 'pe', 'vav', 'het'],
  },
  menora: {
    id: 'menora',
    pictureEmoji: '🕎',
    letters: ['mem', 'nun', 'vav', 'resh', 'he'],
  },
  arnevet: {
    id: 'arnevet',
    pictureEmoji: '🐰',
    letters: ['alef', 'resh', 'nun', 'bet', 'tav'],
  },
};

const WORD_IDS_BY_LEVEL: Record<GameLevelId, WordId[]> = {
  1: ['av', 'dag', 'yad', 'dod', 'bayit'],
  2: ['dod', 'bayit', 'kelev', 'sefer', 'arye'],
  3: ['arye', 'shalom', 'tapuach', 'menora', 'arnevet'],
};

const SIMILAR_LETTERS: Partial<Record<LetterId, LetterId[]>> = {
  alef: ['he', 'resh'],
  bet: ['kaf', 'pe'],
  gimel: ['nun', 'resh'],
  dalet: ['resh', 'bet'],
  he: ['alef', 'het'],
  vav: ['yod', 'nun'],
  het: ['he', 'tav'],
  yod: ['vav', 'nun'],
  kaf: ['bet', 'lamed'],
  lamed: ['kaf', 'mem'],
  mem: ['nun', 'samekh'],
  nun: ['mem', 'gimel'],
  samekh: ['mem', 'shin'],
  pe: ['bet', 'tav'],
  resh: ['dalet', 'gimel'],
  shin: ['samekh', 'tav'],
  tav: ['het', 'pe'],
};

const LETTER_SYMBOL_KEY_BY_ID: Record<LetterId, LetterSymbolKey> = {
  alef: 'letters.symbols.alef',
  bet: 'letters.symbols.bet',
  gimel: 'letters.symbols.gimel',
  dalet: 'letters.symbols.dalet',
  he: 'letters.symbols.he',
  vav: 'letters.symbols.vav',
  het: 'letters.symbols.het',
  yod: 'letters.symbols.yod',
  kaf: 'letters.symbols.kaf',
  lamed: 'letters.symbols.lamed',
  mem: 'letters.symbols.mem',
  nun: 'letters.symbols.nun',
  samekh: 'letters.symbols.samekh',
  pe: 'letters.symbols.pe',
  resh: 'letters.symbols.resh',
  shin: 'letters.symbols.shin',
  tav: 'letters.symbols.tav',
};

const ALL_LETTER_IDS = Object.keys(LETTER_SYMBOL_KEY_BY_ID) as LetterId[];

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

function getHintTrendLabelKey(trend: HintTrend): Extract<
  StatusKey,
  | 'games.pictureToWordBuilder.summary.hintTrend.improving'
  | 'games.pictureToWordBuilder.summary.hintTrend.steady'
  | 'games.pictureToWordBuilder.summary.hintTrend.needsSupport'
> {
  if (trend === 'improving') {
    return 'games.pictureToWordBuilder.summary.hintTrend.improving';
  }
  if (trend === 'steady') {
    return 'games.pictureToWordBuilder.summary.hintTrend.steady';
  }
  return 'games.pictureToWordBuilder.summary.hintTrend.needsSupport';
}

function getLengthBand(maxWordLength: number): SummaryReport['lengthBand'] {
  if (maxWordLength >= 5) {
    return '4-5';
  }
  if (maxWordLength >= 4) {
    return '3-4';
  }
  return '2-3';
}

function getStableRangeFromLengthBand(lengthBand: SummaryReport['lengthBand']): StableRange {
  if (lengthBand === '4-5') {
    return '1-10';
  }
  if (lengthBand === '3-4') {
    return '1-5';
  }
  return '1-3';
}

function buildSummaryReport(stats: SessionStats): SummaryReport {
  const attempts = stats.hintUsageByRound.length;
  const firstAttemptSuccessRate =
    attempts === 0 ? 0 : Math.round((stats.firstAttemptSuccesses / attempts) * 100);
  const hintTrend = getHintTrend(stats.hintUsageByRound);
  const lengthBand = getLengthBand(stats.maxWordLength);

  let topPair: SummaryReport['confusionPair'] = null;
  let topCount = 0;

  Object.entries(stats.confusionPairs).forEach(([pairKey, count]) => {
    if (count <= topCount) {
      return;
    }
    const [expected, actual] = pairKey.split(':') as [LetterId, LetterId];
    topCount = count;
    topPair = { expected, actual };
  });

  return {
    firstAttemptSuccessRate,
    hintTrend,
    lengthBand,
    confusionPair: topPair,
  };
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function getAudioPathForKey(key: StatusKey): string {
  return `/audio/he/${key.split('.').map((segment) => toKebabCase(segment)).join('/')}.mp3`;
}

function pickWord(level: GameLevelId, previousWordId: WordId | null): WordEntry {
  const basePool = WORD_IDS_BY_LEVEL[level];
  const withoutPrevious = previousWordId
    ? basePool.filter((wordId) => wordId !== previousWordId)
    : basePool;
  const selectedPool = withoutPrevious.length > 0 ? withoutPrevious : basePool;
  return WORDS[pickRandom(selectedPool)];
}

function createRound(options: {
  level: GameLevelId;
  roundNumber: number;
  previousWordId: WordId | null;
  fallbackMode: boolean;
  contrastLetter: LetterId | null;
}): RoundState {
  const { level, roundNumber, previousWordId, fallbackMode, contrastLetter } = options;
  const word = pickWord(level, previousWordId);
  const prefillFirstLetter = level === 1 || fallbackMode;

  const letterPool = [...word.letters];
  if (prefillFirstLetter) {
    letterPool.shift();
  }

  const desiredDistractors = fallbackMode
    ? Math.max(1, BASE_DISTRACTOR_COUNT_BY_LEVEL[level] - 1)
    : BASE_DISTRACTOR_COUNT_BY_LEVEL[level];

  const distractorCandidates = new Set<LetterId>();
  if (contrastLetter && !word.letters.includes(contrastLetter)) {
    distractorCandidates.add(contrastLetter);
  }

  word.letters.forEach((letterId) => {
    (SIMILAR_LETTERS[letterId] ?? []).forEach((similarLetterId) => {
      if (!word.letters.includes(similarLetterId)) {
        distractorCandidates.add(similarLetterId);
      }
    });
  });

  const fallbackDistractors = ALL_LETTER_IDS.filter((letterId) => !word.letters.includes(letterId));
  while (distractorCandidates.size < desiredDistractors) {
    distractorCandidates.add(pickRandom(fallbackDistractors));
  }

  const distractors = shuffle(Array.from(distractorCandidates)).slice(0, desiredDistractors);
  const tiles = shuffle([...letterPool, ...distractors]).map((letter, index) => ({
    id: `round-${roundNumber}-${word.id}-tile-${index}`,
    letter,
  }));

  return {
    id: `round-${roundNumber}-${word.id}-${level}-${fallbackMode ? 'fallback' : 'core'}`,
    roundNumber,
    level,
    word,
    tiles,
    prefilledSlotIndexes: prefillFirstLetter ? [0] : [],
    fallbackMode,
    contrastLetter,
  };
}

function createInitialSlots(round: RoundState): Array<SlotState | null> {
  return round.word.letters.map((letter, index) => {
    if (round.prefilledSlotIndexes.includes(index)) {
      return {
        tileId: `locked-${round.id}-${index}`,
        letter,
        locked: true,
      };
    }
    return null;
  });
}

export function PictureToWordBuilderGame({ onComplete, audio, onRequestBack }: PictureToWordBuilderGameProps) {
  const { t } = useTranslation('common');
  const boardFeedbackTimeoutRef = useRef<number | null>(null);
  const scorePulseTimeoutRef = useRef<number | null>(null);

  const [level, setLevel] = useState<GameLevelId>(1);
  const [roundNumber, setRoundNumber] = useState(1);
  const [cleanRoundsInRow, setCleanRoundsInRow] = useState(0);
  const [struggleRoundsInRow, setStruggleRoundsInRow] = useState(0);
  const [fallbackRoundsRemaining, setFallbackRoundsRemaining] = useState(0);
  const [pendingContrastLetter, setPendingContrastLetter] = useState<LetterId | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [midpointPaused, setMidpointPaused] = useState(false);
  const [stickerCount, setStickerCount] = useState(0);
  const [summaryReport, setSummaryReport] = useState<SummaryReport | null>(null);
  const [summaryMetrics, setSummaryMetrics] = useState<ParentSummaryMetrics | null>(null);

  const [round, setRound] = useState<RoundState>(() =>
    createRound({
      level: 1,
      roundNumber: 1,
      previousWordId: null,
      fallbackMode: false,
      contrastLetter: null,
    }),
  );
  const [slots, setSlots] = useState<Array<SlotState | null>>(() => createInitialSlots(round));
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [draggedTileId, setDraggedTileId] = useState<string | null>(null);
  const [coachVisible, setCoachVisible] = useState(true);
  const [invalidSlotIndexes, setInvalidSlotIndexes] = useState<number[]>([]);
  const [attemptsThisRound, setAttemptsThisRound] = useState(0);
  const [hintCountThisRound, setHintCountThisRound] = useState(0);
  const [usedHintThisRound, setUsedHintThisRound] = useState(false);
  const [roundMessage, setRoundMessage] = useState<RoundMessage>({
    key: 'games.pictureToWordBuilder.instructions.intro',
    tone: 'neutral',
  });
  const [scorePulse, setScorePulse] = useState(false);
  const [boardFeedback, setBoardFeedback] = useState<BoardFeedback>('idle');

  const completionReportedRef = useRef(false);
  const previousWordIdRef = useRef<WordId | null>(round.word.id);
  const lastAutoValidationSignatureRef = useRef<string | null>(null);
  const sessionStatsRef = useRef<SessionStats>({
    firstAttemptSuccesses: 0,
    hintUsageByRound: [],
    maxWordLength: 0,
    confusionPairs: {},
    successfulBuilds: 0,
  });

  const tileById = useMemo(() => {
    return round.tiles.reduce<Record<string, TileState>>((record, tile) => {
      record[tile.id] = tile;
      return record;
    }, {});
  }, [round.tiles]);

  const usedTileIds = useMemo(
    () => new Set(slots.filter((slot): slot is SlotState => Boolean(slot)).map((slot) => slot.tileId)),
    [slots],
  );
  const filledSlotsSignature = useMemo(
    () => slots.map((slot) => slot?.tileId ?? 'empty').join('|'),
    [slots],
  );

  const availableTiles = useMemo(
    () => round.tiles.filter((tile) => !usedTileIds.has(tile.id)),
    [round.tiles, usedTileIds],
  );

  const setMessageWithAudio = useCallback(
    (key: StatusKey, tone: HintTone = 'neutral') => {
      setRoundMessage({ key, tone });
      audio.play(getAudioPathForKey(key));
    },
    [audio],
  );

  const triggerBoardFeedback = useCallback((nextState: Exclude<BoardFeedback, 'idle'>) => {
    if (boardFeedbackTimeoutRef.current) {
      window.clearTimeout(boardFeedbackTimeoutRef.current);
    }

    setBoardFeedback(nextState);
    boardFeedbackTimeoutRef.current = window.setTimeout(() => {
      setBoardFeedback('idle');
      boardFeedbackTimeoutRef.current = null;
    }, 360);
  }, []);

  const triggerScorePulse = useCallback(() => {
    setScorePulse(true);
    if (scorePulseTimeoutRef.current) {
      window.clearTimeout(scorePulseTimeoutRef.current);
    }

    scorePulseTimeoutRef.current = window.setTimeout(() => {
      setScorePulse(false);
      scorePulseTimeoutRef.current = null;
    }, 460);
  }, []);

  const resetRoundInteractionState = useCallback((nextRound: RoundState) => {
    if (boardFeedbackTimeoutRef.current) {
      window.clearTimeout(boardFeedbackTimeoutRef.current);
      boardFeedbackTimeoutRef.current = null;
    }
    if (scorePulseTimeoutRef.current) {
      window.clearTimeout(scorePulseTimeoutRef.current);
      scorePulseTimeoutRef.current = null;
    }

    setSlots(createInitialSlots(nextRound));
    setSelectedTileId(null);
    setDraggedTileId(null);
    setInvalidSlotIndexes([]);
    setAttemptsThisRound(0);
    setHintCountThisRound(0);
    setUsedHintThisRound(false);
    setBoardFeedback('idle');
    setScorePulse(false);
  }, []);

  const loadRound = useCallback(
    (nextRound: RoundState) => {
      setRound(nextRound);
      previousWordIdRef.current = nextRound.word.id;
      resetRoundInteractionState(nextRound);
      setPendingContrastLetter(null);
    },
    [resetRoundInteractionState],
  );

  const applySessionCompletion = useCallback(
    (stats: SessionStats) => {
      const report = buildSummaryReport(stats);
      const metrics: ParentSummaryMetrics = {
        highestStableRange: getStableRangeFromLengthBand(report.lengthBand),
        firstAttemptSuccessRate: report.firstAttemptSuccessRate,
        hintTrend: report.hintTrend,
      };

      setSummaryReport(report);
      setSummaryMetrics(metrics);
      setSessionComplete(true);
      setRoundMessage({
        key: 'feedback.youDidIt',
        tone: 'success',
      });
      audio.play(getAudioPathForKey('games.pictureToWordBuilder.feedback.success.celebrate'));

      if (completionReportedRef.current) {
        return;
      }
      completionReportedRef.current = true;

      onComplete({
        stars: Math.min(3, Math.max(1, Math.ceil(stats.successfulBuilds / 3))),
        score: stats.firstAttemptSuccesses * 14 + stats.successfulBuilds * 8,
        completed: true,
        roundsCompleted: stats.hintUsageByRound.length,
        summaryMetrics: metrics,
      });
    },
    [audio, onComplete],
  );

  const finalizeRoundSuccess = useCallback(() => {
    if (sessionComplete || midpointPaused) {
      return;
    }

    const roundWasStruggle = attemptsThisRound > 0 || usedHintThisRound;
    const firstAttemptSuccess = !roundWasStruggle;

    const currentStats = sessionStatsRef.current;
    const nextStats: SessionStats = {
      ...currentStats,
      firstAttemptSuccesses: currentStats.firstAttemptSuccesses + (firstAttemptSuccess ? 1 : 0),
      hintUsageByRound: [...currentStats.hintUsageByRound, usedHintThisRound ? 1 : 0],
      maxWordLength: Math.max(currentStats.maxWordLength, round.word.letters.length),
      successfulBuilds: currentStats.successfulBuilds + 1,
    };
    sessionStatsRef.current = nextStats;

    const successKey =
      ROUND_SUCCESS_ROTATION[(nextStats.hintUsageByRound.length - 1) % ROUND_SUCCESS_ROTATION.length];
    const feedbackKey = FEEDBACK_ROTATION[(nextStats.hintUsageByRound.length - 1) % FEEDBACK_ROTATION.length];

    triggerBoardFeedback('success');
    if (firstAttemptSuccess) {
      triggerScorePulse();
    }

    setRoundMessage({
      key: successKey,
      tone: 'success',
    });
    audio.play(getAudioPathForKey(`reading.wordAudio.${round.word.id}`));
    window.setTimeout(() => {
      audio.play(getAudioPathForKey(feedbackKey));
    }, 260);

    const earnedSticker = nextStats.successfulBuilds % 3 === 0;
    if (earnedSticker) {
      setStickerCount((value) => value + 1);
    }

    if (nextStats.hintUsageByRound.length >= TOTAL_ROUNDS) {
      window.setTimeout(() => {
        applySessionCompletion(nextStats);
      }, 620);
      return;
    }

    let nextLevel = level;
    let nextCleanRounds = roundWasStruggle ? 0 : cleanRoundsInRow + 1;
    let nextStruggleRounds = roundWasStruggle ? struggleRoundsInRow + 1 : 0;
    let nextFallbackRounds = Math.max(0, fallbackRoundsRemaining - 1);

    if (nextStruggleRounds >= 2 && level > 1) {
      nextLevel = (level - 1) as GameLevelId;
      nextFallbackRounds = 2;
      nextStruggleRounds = 0;
    }

    if (nextCleanRounds >= 3 && level < 3) {
      nextLevel = (level + 1) as GameLevelId;
      nextCleanRounds = 0;
    }

    const nextRoundNumber = round.roundNumber + 1;
    const shouldPauseAtMidpoint = nextRoundNumber === MIDPOINT_ROUND + 1;

    setCleanRoundsInRow(nextCleanRounds);
    setStruggleRoundsInRow(nextStruggleRounds);
    setFallbackRoundsRemaining(nextFallbackRounds);
    setLevel(nextLevel);
    setRoundNumber(nextRoundNumber);

    if (shouldPauseAtMidpoint) {
      setMidpointPaused(true);
      return;
    }

    window.setTimeout(() => {
      loadRound(
        createRound({
          level: nextLevel,
          roundNumber: nextRoundNumber,
          previousWordId: previousWordIdRef.current,
          fallbackMode: nextFallbackRounds > 0,
          contrastLetter: pendingContrastLetter,
        }),
      );
    }, 640);
  }, [
    applySessionCompletion,
    attemptsThisRound,
    audio,
    cleanRoundsInRow,
    fallbackRoundsRemaining,
    level,
    loadRound,
    midpointPaused,
    pendingContrastLetter,
    round.roundNumber,
    round.word.id,
    round.word.letters.length,
    sessionComplete,
    struggleRoundsInRow,
    triggerBoardFeedback,
    triggerScorePulse,
    usedHintThisRound,
  ]);

  const registerConfusionPair = useCallback((expected: LetterId, actual: LetterId) => {
    const pairKey = `${expected}:${actual}`;
    const current = sessionStatsRef.current;
    sessionStatsRef.current = {
      ...current,
      confusionPairs: {
        ...current.confusionPairs,
        [pairKey]: (current.confusionPairs[pairKey] ?? 0) + 1,
      },
    };
  }, []);

  const placeTileInSlot = useCallback(
    (tileId: string, slotIndex: number) => {
      if (sessionComplete || midpointPaused) {
        return;
      }

      const targetTile = tileById[tileId];
      if (!targetTile) {
        return;
      }

      let placed = false;
      setSlots((previousSlots) => {
        if (slotIndex < 0 || slotIndex >= previousSlots.length) {
          return previousSlots;
        }

        if (previousSlots[slotIndex]?.locked) {
          return previousSlots;
        }

        const nextSlots = [...previousSlots];
        const currentTileSlotIndex = nextSlots.findIndex((slot) => slot?.tileId === tileId);
        if (currentTileSlotIndex !== -1) {
          nextSlots[currentTileSlotIndex] = null;
        }

        nextSlots[slotIndex] = {
          tileId,
          letter: targetTile.letter,
          locked: false,
        };
        placed = true;
        return nextSlots;
      });

      if (!placed) {
        return;
      }

      setInvalidSlotIndexes([]);
      setSelectedTileId(null);
      audio.play(getAudioPathForKey(`letters.pronunciation.${targetTile.letter}`));
    },
    [audio, midpointPaused, sessionComplete, tileById],
  );

  const removeTileFromSlot = useCallback((slotIndex: number) => {
    setSlots((previousSlots) => {
      if (slotIndex < 0 || slotIndex >= previousSlots.length) {
        return previousSlots;
      }
      const slot = previousSlots[slotIndex];
      if (!slot || slot.locked) {
        return previousSlots;
      }
      const nextSlots = [...previousSlots];
      nextSlots[slotIndex] = null;
      return nextSlots;
    });
    setInvalidSlotIndexes([]);
  }, []);

  const handleSegmentedHint = useCallback(
    (forceContrastMessage = false) => {
      if (sessionComplete || midpointPaused) {
        return;
      }

      const nextHintCount = hintCountThisRound + 1;
      setHintCountThisRound(nextHintCount);
      setUsedHintThisRound(true);

      const hintKey = forceContrastMessage
        ? 'games.pictureToWordBuilder.hints.segmented.contrastPair'
        : nextHintCount === 1
          ? 'games.pictureToWordBuilder.hints.segmented.firstSoundCue'
          : 'games.pictureToWordBuilder.hints.segmented.listenByParts';

      setMessageWithAudio(hintKey, 'hint');
      audio.play(getAudioPathForKey(`letters.pronunciation.${round.word.letters[0]}`));
      window.setTimeout(() => {
        audio.play(getAudioPathForKey(`reading.wordAudio.${round.word.id}`));
      }, 280);
    },
    [audio, hintCountThisRound, midpointPaused, round.word.id, round.word.letters, sessionComplete, setMessageWithAudio],
  );

  const validateCurrentWord = useCallback(() => {
    if (sessionComplete || midpointPaused) {
      return;
    }

    const missingSlotIndexes = slots
      .map((slot, index) => (slot ? -1 : index))
      .filter((index) => index !== -1);

    if (missingSlotIndexes.length > 0) {
      setRoundMessage({
        key: 'games.pictureToWordBuilder.instructions.completeWord',
        tone: 'hint',
      });
      audio.play(getAudioPathForKey('games.pictureToWordBuilder.instructions.completeWord'));
      setInvalidSlotIndexes(missingSlotIndexes);
      return;
    }

    const mismatchIndexes = slots.reduce<number[]>((acc, slot, index) => {
      const expectedLetter = round.word.letters[index];
      if (slot?.letter !== expectedLetter) {
        acc.push(index);
      }
      return acc;
    }, []);

    if (mismatchIndexes.length === 0) {
      finalizeRoundSuccess();
      return;
    }

    setAttemptsThisRound((value) => value + 1);
    triggerBoardFeedback('miss');
    setInvalidSlotIndexes(mismatchIndexes);
    setMessageWithAudio('games.pictureToWordBuilder.feedback.encouragement.keepTrying', 'hint');

    const mismatchIndex = mismatchIndexes[0];
    const expectedLetter = round.word.letters[mismatchIndex];
    const actualLetter = slots[mismatchIndex]?.letter;
    if (expectedLetter && actualLetter && expectedLetter !== actualLetter) {
      registerConfusionPair(expectedLetter, actualLetter);
      setPendingContrastLetter(actualLetter);
    }

    window.setTimeout(() => {
      setInvalidSlotIndexes([]);
    }, 900);

    if (attemptsThisRound >= 1) {
      handleSegmentedHint(true);
    }
  }, [
    attemptsThisRound,
    audio,
    finalizeRoundSuccess,
    handleSegmentedHint,
    midpointPaused,
    registerConfusionPair,
    round.word.id,
    round.word.letters,
    sessionComplete,
    setMessageWithAudio,
    slots,
    triggerBoardFeedback,
  ]);

  useEffect(() => {
    if (sessionComplete || midpointPaused) {
      return;
    }

    const allSlotsFilled = slots.every((slot) => Boolean(slot));
    if (!allSlotsFilled) {
      lastAutoValidationSignatureRef.current = null;
      return;
    }

    if (lastAutoValidationSignatureRef.current === filledSlotsSignature) {
      return;
    }

    lastAutoValidationSignatureRef.current = filledSlotsSignature;
    validateCurrentWord();
  }, [filledSlotsSignature, midpointPaused, sessionComplete, slots, validateCurrentWord]);

  const handleTileTap = useCallback(
    (tileId: string) => {
      if (sessionComplete || midpointPaused) {
        return;
      }

      if (selectedTileId === tileId) {
        setSelectedTileId(null);
        return;
      }

      setSelectedTileId(tileId);
      setRoundMessage({
        key: 'games.pictureToWordBuilder.instructions.dragLetters',
        tone: 'neutral',
      });
    },
    [midpointPaused, selectedTileId, sessionComplete],
  );

  const handleSlotTap = useCallback(
    (slotIndex: number) => {
      if (sessionComplete || midpointPaused) {
        return;
      }

      const currentSlot = slots[slotIndex];
      if (currentSlot?.locked) {
        audio.play(getAudioPathForKey(`letters.pronunciation.${currentSlot.letter}`));
        return;
      }

      if (currentSlot) {
        removeTileFromSlot(slotIndex);
        return;
      }

      if (!selectedTileId) {
        return;
      }

      placeTileInSlot(selectedTileId, slotIndex);
    },
    [audio, midpointPaused, placeTileInSlot, removeTileFromSlot, selectedTileId, sessionComplete, slots],
  );

  const handleReplayWord = useCallback(() => {
    if (sessionComplete || midpointPaused) {
      return;
    }
    setRoundMessage({
      key: 'games.pictureToWordBuilder.instructions.tapReplayWord',
      tone: 'neutral',
    });
    audio.play(getAudioPathForKey(`reading.wordAudio.${round.word.id}`));
  }, [audio, midpointPaused, round.word.id, sessionComplete]);

  const playStatusAudio = useCallback(
    (key: StatusKey) => {
      audio.play(getAudioPathForKey(key));
    },
    [audio],
  );

  const handleContinueAfterMidpoint = useCallback(() => {
    setMidpointPaused(false);
    loadRound(
      createRound({
        level,
        roundNumber,
        previousWordId: previousWordIdRef.current,
        fallbackMode: fallbackRoundsRemaining > 0,
        contrastLetter: pendingContrastLetter,
      }),
    );
  }, [fallbackRoundsRemaining, level, loadRound, pendingContrastLetter, roundNumber]);

  useEffect(() => {
    if (sessionComplete || midpointPaused) {
      return;
    }

    const promptKey = `games.pictureToWordBuilder.prompts.word.${round.word.id}` as WordPromptKey;
    setRoundMessage({
      key: promptKey,
      tone: round.contrastLetter ? 'hint' : 'neutral',
    });

    const introTimer = window.setTimeout(() => {
      audio.play(getAudioPathForKey('games.pictureToWordBuilder.instructions.intro'));
    }, 60);
    const promptTimer = window.setTimeout(() => {
      audio.play(getAudioPathForKey(promptKey));
    }, 340);
    const wordTimer = window.setTimeout(() => {
      audio.play(getAudioPathForKey(`reading.wordAudio.${round.word.id}`));
    }, 700);

    if (round.contrastLetter) {
      const contrastTimer = window.setTimeout(() => {
        setRoundMessage({
          key: 'games.pictureToWordBuilder.hints.segmented.contrastPair',
          tone: 'hint',
        });
        audio.play(getAudioPathForKey('games.pictureToWordBuilder.hints.segmented.contrastPair'));
      }, 1080);
      return () => {
        window.clearTimeout(introTimer);
        window.clearTimeout(promptTimer);
        window.clearTimeout(wordTimer);
        window.clearTimeout(contrastTimer);
      };
    }

    return () => {
      window.clearTimeout(introTimer);
      window.clearTimeout(promptTimer);
      window.clearTimeout(wordTimer);
    };
  }, [audio, midpointPaused, round.contrastLetter, round.id, round.word.id, sessionComplete]);

  useEffect(() => {
    if (sessionComplete || midpointPaused || roundMessage.tone === 'success' || draggedTileId) {
      setCoachVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setCoachVisible(true);
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draggedTileId, midpointPaused, round.id, roundMessage.tone, sessionComplete]);

  useEffect(() => {
    return () => {
      if (boardFeedbackTimeoutRef.current) {
        window.clearTimeout(boardFeedbackTimeoutRef.current);
      }
      if (scorePulseTimeoutRef.current) {
        window.clearTimeout(scorePulseTimeoutRef.current);
      }
      audio.stop();
    };
  }, [audio]);

  const confusionPairText = useMemo(() => {
    if (!summaryReport?.confusionPair) {
      return t('games.pictureToWordBuilder.summary.noConfusionPair');
    }
    return `${t(LETTER_SYMBOL_KEY_BY_ID[summaryReport.confusionPair.expected])} / ${t(LETTER_SYMBOL_KEY_BY_ID[summaryReport.confusionPair.actual])}`;
  }, [summaryReport, t]);

  const hintTrendLabel = summaryReport
    ? t(getHintTrendLabelKey(summaryReport.hintTrend))
    : t('games.pictureToWordBuilder.summary.hintTrend.steady');
  const replayButtonAriaLabel = t('games.pictureToWordBuilder.instructions.tapReplayWord');
  const showRoundCelebration = roundMessage.tone === 'success';
  const showInRoundCoach = coachVisible && !showRoundCelebration;
  const firstAttemptStars = sessionStatsRef.current.firstAttemptSuccesses;
  const resolvedRounds = sessionStatsRef.current.hintUsageByRound.length;

  if (sessionComplete && summaryReport && summaryMetrics) {
    return (
      <div className="picture-word-builder picture-word-builder--complete">
        <Card padding="lg" className="picture-word-builder__shell">
          <div className="picture-word-builder__text-row picture-word-builder__text-row--center">
            <h2 className="picture-word-builder__title">{t('feedback.youDidIt')}</h2>
            <button
              type="button"
              className="picture-word-builder__replay-button"
              onClick={() => playStatusAudio('feedback.youDidIt')}
              aria-label={replayButtonAriaLabel}
            >
              <span aria-hidden="true">▶</span>
            </button>
          </div>
          <div className="picture-word-builder__text-row picture-word-builder__text-row--center">
            <p className="picture-word-builder__subtitle">{t('games.pictureToWordBuilder.roundComplete.wordBuilt')}</p>
            <button
              type="button"
              className="picture-word-builder__replay-button"
              onClick={() => playStatusAudio('games.pictureToWordBuilder.roundComplete.wordBuilt')}
              aria-label={replayButtonAriaLabel}
            >
              <span aria-hidden="true">▶</span>
            </button>
          </div>

          <div className="picture-word-builder__stickers" aria-label={t('games.pictureToWordBuilder.roundComplete.stickerEarned')}>
            {Array.from({ length: Math.max(1, stickerCount) }).map((_, index) => (
              <span key={`sticker-${index}`} className="picture-word-builder__sticker" aria-hidden="true">
                🌟
              </span>
            ))}
          </div>

          <Card padding="md" className="picture-word-builder__summary-card">
            <div className="picture-word-builder__text-row">
              <p>
                {t('parentDashboard.games.pictureToWordBuilder.progressSummary', {
                  range: summaryReport.lengthBand,
                  successRate: summaryReport.firstAttemptSuccessRate,
                  hintTrend: hintTrendLabel,
                  confusedPair: confusionPairText,
                })}
              </p>
              <button
                type="button"
                className="picture-word-builder__replay-button"
                onClick={() => playStatusAudio('parentDashboard.games.pictureToWordBuilder.progressSummary')}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">▶</span>
              </button>
            </div>
            <div className="picture-word-builder__text-row">
              <p>{t('parentDashboard.games.pictureToWordBuilder.nextStep')}</p>
              <button
                type="button"
                className="picture-word-builder__replay-button"
                onClick={() => playStatusAudio('parentDashboard.games.pictureToWordBuilder.nextStep')}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">▶</span>
              </button>
            </div>
          </Card>

          <div className="picture-word-builder__text-row picture-word-builder__text-row--center">
            <p className="picture-word-builder__hint-note">{t(getHintTrendLabelKey(summaryMetrics.hintTrend))}</p>
            <button
              type="button"
              className="picture-word-builder__replay-button"
              onClick={() => playStatusAudio(getHintTrendLabelKey(summaryMetrics.hintTrend))}
              aria-label={replayButtonAriaLabel}
            >
              <span aria-hidden="true">▶</span>
            </button>
          </div>
        </Card>
        <style>{pictureWordBuilderStyles}</style>
      </div>
    );
  }

  if (midpointPaused) {
    return (
      <div className="picture-word-builder picture-word-builder--midpoint">
        <Card padding="lg" className="picture-word-builder__shell">
          <div className="picture-word-builder__text-row picture-word-builder__text-row--center">
            <h2 className="picture-word-builder__title">{t('feedback.greatEffort')}</h2>
            <button
              type="button"
              className="picture-word-builder__replay-button"
              onClick={() => playStatusAudio('feedback.greatEffort')}
              aria-label={replayButtonAriaLabel}
            >
              <span aria-hidden="true">▶</span>
            </button>
          </div>
          <div className="picture-word-builder__text-row picture-word-builder__text-row--center">
            <p className="picture-word-builder__subtitle">{t('games.pictureToWordBuilder.roundComplete.nextWord')}</p>
            <button
              type="button"
              className="picture-word-builder__replay-button"
              onClick={() => playStatusAudio('games.pictureToWordBuilder.roundComplete.nextWord')}
              aria-label={replayButtonAriaLabel}
            >
              <span aria-hidden="true">▶</span>
            </button>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleContinueAfterMidpoint}
            aria-label={t('nav.next')}
            style={{ minWidth: '56px', paddingInline: 'var(--space-lg)' }}
          >
            <span aria-hidden="true">⏭️</span>
          </Button>
        </Card>
        <style>{pictureWordBuilderStyles}</style>
      </div>
    );
  }

  return (
    <div className="picture-word-builder">
      <Card padding="lg" className="picture-word-builder__shell">
        <GameTopBar
          title={t('games.pictureToWordBuilder.title')}
          subtitle={t('games.pictureToWordBuilder.subtitle')}
          progressLabel={`${round.roundNumber}/${TOTAL_ROUNDS}`}
          progressAriaLabel={t('games.pictureToWordBuilder.instructions.completeWord')}
          currentStep={round.roundNumber}
          totalSteps={TOTAL_ROUNDS}
          onReplayInstruction={() => playStatusAudio(roundMessage.key)}
          replayAriaLabel={replayButtonAriaLabel}
          onBack={onRequestBack}
          backAriaLabel={t('nav.back')}
          rightSlot={
            <div className="picture-word-builder__actions">
              <Button
                variant="secondary"
                size="md"
                onClick={handleReplayWord}
                aria-label={t('games.pictureToWordBuilder.instructions.tapReplayWord')}
                style={{ minWidth: 'var(--touch-min)', paddingInline: 'var(--space-md)' }}
              >
                <span aria-hidden="true">▶</span>
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => handleSegmentedHint(false)}
                aria-label={t('games.pictureToWordBuilder.instructions.tapSegmentedHint')}
                style={{ minWidth: 'var(--touch-min)', paddingInline: 'var(--space-md)' }}
              >
                <span aria-hidden="true">🧩</span>
              </Button>
            </div>
          }
        />

        <div className="picture-word-builder__score-strip" aria-hidden="true">
          <span
            className={[
              'picture-word-builder__score-pill',
              scorePulse ? 'picture-word-builder__score-pill--pulse' : '',
            ].join(' ')}
          >
            <span>⭐</span>
            <span>{firstAttemptStars}</span>
          </span>
          <span className="picture-word-builder__score-pill">
            <span>🎯</span>
            <span>
              {resolvedRounds}/{TOTAL_ROUNDS}
            </span>
          </span>
        </div>

        <div className={`picture-word-builder__message picture-word-builder__message--${roundMessage.tone}`}>
          <p className="picture-word-builder__message-text" aria-live="polite">
            {t(roundMessage.key)}
          </p>
          <button
            type="button"
            className="picture-word-builder__replay-button"
            onClick={() => playStatusAudio(roundMessage.key)}
            aria-label={replayButtonAriaLabel}
          >
            <span aria-hidden="true">▶</span>
          </button>
        </div>

        <section
          className={[
            'picture-word-builder__board',
            boardFeedback === 'success' ? 'picture-word-builder__board--success' : '',
            boardFeedback === 'miss' ? 'picture-word-builder__board--miss' : '',
          ].join(' ')}
        >
          <div className="picture-word-builder__scene-props" aria-hidden="true">
            <span>📘</span>
            <span>🧩</span>
            <span>✨</span>
            <span>🪁</span>
            <span>🔤</span>
          </div>
          {showInRoundCoach && (
            <div className="picture-word-builder__coach" aria-hidden="true">
              <MascotIllustration variant="hint" size={56} />
            </div>
          )}

          <Card padding="md" className="picture-word-builder__target-card">
            <div className="picture-word-builder__image-wrap" aria-hidden="true">
              <span className="picture-word-builder__image">{round.word.pictureEmoji}</span>
            </div>

            <div className="picture-word-builder__slots" dir="rtl">
              {round.word.letters.map((letterId, slotIndex) => {
                const slot = slots[slotIndex];
                const isInvalid = invalidSlotIndexes.includes(slotIndex);
                const expectedSymbol = t(LETTER_SYMBOL_KEY_BY_ID[letterId]);
                const shownSymbol = slot ? t(LETTER_SYMBOL_KEY_BY_ID[slot.letter]) : '';

                return (
                  <button
                    key={`slot-${slotIndex}`}
                    type="button"
                    className={[
                      'picture-word-builder__slot',
                      slot ? 'picture-word-builder__slot--filled' : '',
                      slot?.locked ? 'picture-word-builder__slot--locked' : '',
                      isInvalid ? 'picture-word-builder__slot--invalid' : '',
                    ].join(' ')}
                    onClick={() => handleSlotTap(slotIndex)}
                    onDragOver={(event) => {
                      if (slot?.locked) {
                        return;
                      }
                      event.preventDefault();
                    }}
                    onDrop={(event) => {
                      if (slot?.locked) {
                        return;
                      }
                      event.preventDefault();
                      const droppedTileId = event.dataTransfer.getData('text/plain') || draggedTileId;
                      if (droppedTileId) {
                        placeTileInSlot(droppedTileId, slotIndex);
                      }
                    }}
                    aria-label={
                      slot
                        ? t(LETTER_SYMBOL_KEY_BY_ID[slot.letter])
                        : t('games.pictureToWordBuilder.instructions.dragLetters')
                    }
                  >
                    <span className="picture-word-builder__slot-letter">{slot ? shownSymbol : '·'}</span>
                    <span className="picture-word-builder__slot-icon" aria-hidden="true">
                      {slot?.locked ? '⭐' : isInvalid ? '✕' : slot ? '✓' : ''}
                    </span>
                    <span className="picture-word-builder__sr-only">{expectedSymbol}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card padding="md" className="picture-word-builder__tiles-card">
            <div className="picture-word-builder__text-row">
              <p className="picture-word-builder__tiles-title">{t('games.pictureToWordBuilder.instructions.dragLetters')}</p>
              <button
                type="button"
                className="picture-word-builder__replay-button"
                onClick={() => playStatusAudio('games.pictureToWordBuilder.instructions.dragLetters')}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">▶</span>
              </button>
            </div>

            <div className="picture-word-builder__tiles-grid" dir="rtl">
              {availableTiles.map((tile) => {
                const selected = selectedTileId === tile.id;
                return (
                  <button
                    key={tile.id}
                    type="button"
                    className={[
                      'picture-word-builder__tile',
                      selected ? 'picture-word-builder__tile--selected' : '',
                    ].join(' ')}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', tile.id);
                      setDraggedTileId(tile.id);
                    }}
                    onDragEnd={() => {
                      setDraggedTileId(null);
                    }}
                    onClick={() => handleTileTap(tile.id)}
                    aria-label={t(LETTER_SYMBOL_KEY_BY_ID[tile.letter])}
                  >
                    {t(LETTER_SYMBOL_KEY_BY_ID[tile.letter])}
                  </button>
                );
              })}
            </div>
          </Card>
        </section>

        {showRoundCelebration && (
          <div className="picture-word-builder__celebration-overlay" aria-hidden="true">
            <SuccessCelebration />
            <div className="picture-word-builder__celebration-mascot">
              <MascotIllustration variant="success" size={84} />
            </div>
          </div>
        )}
      </Card>

      <style>{pictureWordBuilderStyles}</style>
    </div>
  );
}

const pictureWordBuilderStyles = `
  .picture-word-builder {
    width: 100%;
    border-radius: var(--radius-xl);
    padding: var(--space-sm);
    background:
      radial-gradient(circle at 14% 18%, color-mix(in srgb, var(--color-accent-primary) 18%, transparent) 0, transparent 46%),
      radial-gradient(circle at 88% 86%, color-mix(in srgb, var(--color-accent-success) 14%, transparent) 0, transparent 56%),
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--color-bg-secondary) 76%, #ffffff) 0%,
        color-mix(in srgb, var(--color-theme-primary) 8%, #ffffff) 100%
      );
  }

  .picture-word-builder__shell {
    display: grid;
    gap: var(--space-md);
    position: relative;
    overflow: hidden;
    background: linear-gradient(180deg, color-mix(in srgb, var(--color-theme-primary) 9%, #ffffff), #ffffff);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 22%, transparent);
  }

  .picture-word-builder__title {
    margin: 0;
    color: var(--color-text-primary);
    font-size: clamp(1.25rem, 2vw, 1.8rem);
  }

  .picture-word-builder__subtitle {
    margin: 0;
    color: var(--color-text-secondary);
  }

  .picture-word-builder__actions {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .picture-word-builder__text-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
  }

  .picture-word-builder__text-row > :first-child {
    flex: 1;
  }

  .picture-word-builder__text-row--center {
    justify-content: center;
  }

  .picture-word-builder__text-row--center > :first-child {
    flex: initial;
  }

  [dir='rtl'] .picture-word-builder__text-row .picture-word-builder__replay-button {
    order: -1;
  }

  .picture-word-builder__replay-button {
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
    font-size: 1rem;
    line-height: 1;
    transition: transform var(--transition-fast), color var(--transition-fast);
    touch-action: manipulation;
    flex-shrink: 0;
  }

  .picture-word-builder__replay-button:hover {
    color: color-mix(in srgb, var(--color-theme-primary) 75%, var(--color-text-primary));
    transform: translateY(-1px);
  }

  .picture-word-builder__replay-button:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--color-accent-primary) 65%, transparent);
    outline-offset: 2px;
  }

  .picture-word-builder__score-strip {
    display: inline-flex;
    gap: var(--space-xs);
    align-items: center;
    justify-self: start;
  }

  .picture-word-builder__score-pill {
    display: inline-flex;
    gap: var(--space-2xs);
    align-items: center;
    min-height: var(--touch-min);
    padding-inline: var(--space-sm);
    border-radius: var(--radius-full);
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 26%, #ffffff);
    background: color-mix(in srgb, var(--color-theme-primary) 10%, #ffffff);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
  }

  .picture-word-builder__score-pill--pulse {
    animation: picture-word-builder-score-pill 480ms ease-out;
  }

  .picture-word-builder__message {
    margin: 0;
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--color-bg-secondary) 78%, #ffffff);
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
    position: relative;
    z-index: 2;
  }

  .picture-word-builder__message-text {
    margin: 0;
    flex: 1;
  }

  .picture-word-builder__message--hint {
    border: 2px dashed color-mix(in srgb, var(--color-accent-warning) 55%, #ffffff);
  }

  .picture-word-builder__message--success {
    border: 2px solid color-mix(in srgb, var(--color-accent-success) 58%, #ffffff);
  }

  .picture-word-builder__board {
    display: grid;
    gap: var(--space-md);
    grid-template-columns: 1fr;
    position: relative;
    z-index: 2;
  }

  .picture-word-builder__board--success {
    animation: picture-word-builder-board-success 340ms ease-out;
  }

  .picture-word-builder__board--miss {
    animation: picture-word-builder-board-miss 320ms ease-in-out;
  }

  .picture-word-builder__scene-props {
    position: absolute;
    inset-inline: var(--space-sm);
    inset-block-start: calc(-1 * var(--space-md));
    display: flex;
    justify-content: space-between;
    align-items: center;
    opacity: 0.82;
    pointer-events: none;
    font-size: 1.25rem;
  }

  .picture-word-builder__coach {
    position: absolute;
    inset-inline-end: var(--space-sm);
    inset-block-start: var(--space-sm);
    inline-size: 72px;
    block-size: 72px;
    border-radius: var(--radius-full);
    display: grid;
    place-items: center;
    pointer-events: none;
    z-index: 2;
    background: color-mix(in srgb, var(--color-bg-card) 88%, white);
    border: 2px solid color-mix(in srgb, var(--color-accent-primary) 30%, transparent);
    box-shadow: var(--shadow-sm);
    animation: picture-word-builder-coach-float 1600ms ease-in-out infinite;
  }

  .picture-word-builder__coach,
  .picture-word-builder__coach * {
    pointer-events: none;
  }

  .picture-word-builder__target-card,
  .picture-word-builder__tiles-card {
    display: grid;
    gap: var(--space-sm);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 18%, transparent);
  }

  .picture-word-builder__image-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    min-block-size: 108px;
    background: color-mix(in srgb, var(--color-theme-primary) 14%, #ffffff);
    border-radius: var(--radius-lg);
  }

  .picture-word-builder__image {
    font-size: clamp(2.2rem, 5vw, 3.5rem);
  }

  .picture-word-builder__slots {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    justify-content: center;
  }

  .picture-word-builder__slot {
    inline-size: clamp(58px, 10vw, 72px);
    min-inline-size: 56px;
    min-block-size: 56px;
    border-radius: var(--radius-md);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 34%, transparent);
    background: #ffffff;
    color: var(--color-text-primary);
    display: grid;
    place-items: center;
    gap: 2px;
    cursor: pointer;
    touch-action: manipulation;
    font-size: clamp(1.25rem, 3vw, 1.7rem);
    font-weight: var(--font-weight-bold);
  }

  .picture-word-builder__slot--filled {
    background: color-mix(in srgb, var(--color-theme-primary) 13%, #ffffff);
  }

  .picture-word-builder__slot--locked {
    border-style: dashed;
  }

  .picture-word-builder__slot--invalid {
    border-color: var(--color-accent-danger);
    background: color-mix(in srgb, var(--color-accent-danger) 16%, #ffffff);
  }

  .picture-word-builder__slot-letter {
    line-height: 1;
  }

  .picture-word-builder__slot-icon {
    font-size: 0.72rem;
    line-height: 1;
  }

  .picture-word-builder__tiles-title {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .picture-word-builder__tiles-grid {
    display: grid;
    gap: var(--space-xs);
    grid-template-columns: repeat(auto-fit, minmax(56px, 1fr));
  }

  .picture-word-builder__tile {
    min-block-size: 56px;
    min-inline-size: 56px;
    border-radius: var(--radius-md);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 32%, transparent);
    background: #ffffff;
    color: var(--color-text-primary);
    font-size: clamp(1.2rem, 2.5vw, 1.6rem);
    font-weight: var(--font-weight-bold);
    cursor: grab;
    touch-action: manipulation;
  }

  .picture-word-builder__tile--selected {
    border-color: var(--color-theme-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-theme-primary) 22%, transparent);
    transform: translateY(-1px);
  }

  .picture-word-builder__stickers {
    display: flex;
    justify-content: center;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .picture-word-builder__sticker {
    font-size: clamp(1.6rem, 4vw, 2rem);
  }

  .picture-word-builder__summary-card {
    border: 2px solid color-mix(in srgb, var(--color-accent-success) 36%, transparent);
    display: grid;
    gap: var(--space-xs);
  }

  .picture-word-builder__summary-card p {
    margin: 0;
    color: var(--color-text-primary);
  }

  .picture-word-builder__hint-note {
    margin: 0;
    color: var(--color-text-secondary);
    text-align: center;
  }

  .picture-word-builder__celebration-overlay {
    position: absolute;
    inset-inline: var(--space-md);
    inset-block-end: var(--space-md);
    display: grid;
    justify-items: center;
    gap: var(--space-xs);
    pointer-events: none;
    z-index: 1;
    animation: picture-word-builder-celebrate 620ms var(--motion-ease-bounce) both;
  }

  .picture-word-builder__celebration-overlay * {
    pointer-events: none;
  }

  .picture-word-builder__celebration-mascot {
    animation: picture-word-builder-mascot-pop 620ms var(--motion-ease-bounce) both;
  }

  .picture-word-builder__sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    border: 0;
    clip: rect(0 0 0 0);
  }

  @keyframes picture-word-builder-celebrate {
    from {
      opacity: 0;
      transform: translateY(8px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes picture-word-builder-mascot-pop {
    from {
      transform: scale(0.82) rotate(-3deg);
    }

    to {
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes picture-word-builder-coach-float {
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

  @keyframes picture-word-builder-score-pill {
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

  @keyframes picture-word-builder-board-success {
    0% {
      transform: scale(0.99);
    }

    100% {
      transform: scale(1);
    }
  }

  @keyframes picture-word-builder-board-miss {
    0%,
    100% {
      transform: translateX(0);
    }

    25% {
      transform: translateX(-4px);
    }

    75% {
      transform: translateX(4px);
    }
  }

  @media (min-width: 860px) {
    .picture-word-builder__board {
      grid-template-columns: 1.1fr 1fr;
    }
  }

  @media (max-width: 640px) {
    .picture-word-builder__actions {
      inline-size: 100%;
      justify-content: flex-start;
    }

    .picture-word-builder__actions > button {
      flex: 0 0 auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .picture-word-builder__tile {
      transition: none !important;
      transform: none !important;
    }

    .picture-word-builder__score-pill--pulse,
    .picture-word-builder__board--success,
    .picture-word-builder__board--miss,
    .picture-word-builder__celebration-overlay,
    .picture-word-builder__celebration-mascot,
    .picture-word-builder__coach {
      animation: none !important;
    }
  }
`;
