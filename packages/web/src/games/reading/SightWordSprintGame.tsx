import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, GameTopBar } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameCompletionResult, GameProps, HintTrend, ParentSummaryMetrics, StableRange } from '@/games/engine';
import { resolveReadingRoutingContext, type ReadingRoutingAgeBand } from '@/games/reading/readingProgressionRouting';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { isRtlDirection, rtlNextGlyph, rtlReplayGlyph } from '@/lib/rtlChrome';

type LevelId = 1 | 2 | 3;
type MessageTone = 'neutral' | 'hint' | 'success';
type Phase = 'intro' | 'select' | 'frame' | 'complete';
type BoardFeedbackTone = 'idle' | 'success' | 'miss';

type WordId = 'ani' | 'ata' | 'hi' | 'hu' | 'im' | 'al' | 'gam' | 'shel' | 'po' | 'kan' | 'ze' | 'ma';

type PhraseId =
  | 'aniPo'
  | 'ataKan'
  | 'hiPoGam'
  | 'huKanGam'
  | 'aniImDubi'
  | 'seferAlShulhan'
  | 'hiGamKan'
  | 'zeShelDubi'
  | 'aniPoGam'
  | 'huKan'
  | 'zePo'
  | 'maPo';

interface WordEntry {
  id: WordId;
  key: `words.highFrequency.${WordId}`;
}

interface PhraseEntry {
  id: PhraseId;
  targetWord: WordId;
  frameKey: `games.sightWordSprint.frames.${PhraseId}`;
  phraseKey: `phrases.pronunciation.${PhraseId}`;
}

interface Round {
  targetWord: WordId;
  phrase: PhraseEntry;
  options: WordId[];
}

interface RoundMessage {
  key: string;
  tone: MessageTone;
}

interface SessionSummary {
  accuracy: number;
  speedTrendLabel: string;
  hintTrendLabel: string;
  masteryWordLabel: string;
  masteryPercent: number;
}

interface SightWordSprintGameProps extends GameProps {
  onRequestBack?: () => void;
}

const DEFAULT_TOTAL_ROUNDS = 8;

const BASE_OPTION_COUNT: Record<LevelId, number> = {
  1: 2,
  2: 3,
  3: 4,
};

const ROUND_SECONDS: Record<LevelId, number> = {
  1: 0,
  2: 0,
  3: 16,
};

const WORDS: Record<WordId, WordEntry> = {
  ani: { id: 'ani', key: 'words.highFrequency.ani' },
  ata: { id: 'ata', key: 'words.highFrequency.ata' },
  hi: { id: 'hi', key: 'words.highFrequency.hi' },
  hu: { id: 'hu', key: 'words.highFrequency.hu' },
  im: { id: 'im', key: 'words.highFrequency.im' },
  al: { id: 'al', key: 'words.highFrequency.al' },
  gam: { id: 'gam', key: 'words.highFrequency.gam' },
  shel: { id: 'shel', key: 'words.highFrequency.shel' },
  po: { id: 'po', key: 'words.highFrequency.po' },
  kan: { id: 'kan', key: 'words.highFrequency.kan' },
  ze: { id: 'ze', key: 'words.highFrequency.ze' },
  ma: { id: 'ma', key: 'words.highFrequency.ma' },
};

const WORD_POOL_BY_LEVEL: Record<LevelId, WordId[]> = {
  1: ['ani', 'hi', 'hu', 'im', 'al', 'po'],
  2: ['ani', 'ata', 'hi', 'hu', 'im', 'al', 'gam', 'shel', 'po', 'kan', 'ze'],
  3: ['ani', 'ata', 'hi', 'hu', 'im', 'al', 'gam', 'shel', 'po', 'kan', 'ze', 'ma'],
};

const PHRASES: PhraseEntry[] = [
  {
    id: 'aniPo',
    targetWord: 'ani',
    frameKey: 'games.sightWordSprint.frames.aniPo',
    phraseKey: 'phrases.pronunciation.aniPo',
  },
  {
    id: 'ataKan',
    targetWord: 'ata',
    frameKey: 'games.sightWordSprint.frames.ataKan',
    phraseKey: 'phrases.pronunciation.ataKan',
  },
  {
    id: 'hiPoGam',
    targetWord: 'hi',
    frameKey: 'games.sightWordSprint.frames.hiPoGam',
    phraseKey: 'phrases.pronunciation.hiPoGam',
  },
  {
    id: 'huKanGam',
    targetWord: 'hu',
    frameKey: 'games.sightWordSprint.frames.huKanGam',
    phraseKey: 'phrases.pronunciation.huKanGam',
  },
  {
    id: 'aniImDubi',
    targetWord: 'im',
    frameKey: 'games.sightWordSprint.frames.aniImDubi',
    phraseKey: 'phrases.pronunciation.aniImDubi',
  },
  {
    id: 'seferAlShulhan',
    targetWord: 'al',
    frameKey: 'games.sightWordSprint.frames.seferAlShulhan',
    phraseKey: 'phrases.pronunciation.seferAlShulhan',
  },
  {
    id: 'hiGamKan',
    targetWord: 'gam',
    frameKey: 'games.sightWordSprint.frames.hiGamKan',
    phraseKey: 'phrases.pronunciation.hiGamKan',
  },
  {
    id: 'zeShelDubi',
    targetWord: 'shel',
    frameKey: 'games.sightWordSprint.frames.zeShelDubi',
    phraseKey: 'phrases.pronunciation.zeShelDubi',
  },
  {
    id: 'aniPoGam',
    targetWord: 'po',
    frameKey: 'games.sightWordSprint.frames.aniPoGam',
    phraseKey: 'phrases.pronunciation.aniPoGam',
  },
  {
    id: 'huKan',
    targetWord: 'kan',
    frameKey: 'games.sightWordSprint.frames.huKan',
    phraseKey: 'phrases.pronunciation.huKan',
  },
  {
    id: 'zePo',
    targetWord: 'ze',
    frameKey: 'games.sightWordSprint.frames.zePo',
    phraseKey: 'phrases.pronunciation.zePo',
  },
  {
    id: 'maPo',
    targetWord: 'ma',
    frameKey: 'games.sightWordSprint.frames.maPo',
    phraseKey: 'phrases.pronunciation.maPo',
  },
];

const FIRST_HINT_KEY = 'games.sightWordSprint.hints.replayWord';
const SECOND_HINT_KEY = 'games.sightWordSprint.hints.replayPhrase';
const THIRD_HINT_KEY = 'games.sightWordSprint.hints.highlightTarget';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

function audioPathForKey(key: string): string {
  return resolveAudioPathFromKey(key, 'common');
}

function resolveLevel(levelNumber: number | null | undefined): LevelId {
  if (levelNumber === 1 || levelNumber === 2 || levelNumber === 3) {
    return levelNumber;
  }
  return 2;
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalized = Math.floor(value);
    return normalized > 0 ? normalized : null;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

function resolveRoundTarget(ageBand: ReadingRoutingAgeBand): number {
  if (ageBand === '3-4') {
    return 6;
  }
  if (ageBand === '4-5') {
    return 7;
  }
  if (ageBand === '6-7') {
    return 10;
  }
  return DEFAULT_TOTAL_ROUNDS;
}

function resolveInitialOptionCount(
  ageBand: ReadingRoutingAgeBand,
  levelId: LevelId,
  inSupportMode: boolean,
): number {
  if (inSupportMode) {
    return 2;
  }

  if (ageBand === '3-4') {
    return 2;
  }

  if (ageBand === '4-5') {
    return Math.min(3, BASE_OPTION_COUNT[levelId]);
  }

  if (ageBand === '6-7') {
    const elevated = (BASE_OPTION_COUNT[levelId] + 1) as number;
    return Math.min(5, elevated);
  }

  return BASE_OPTION_COUNT[levelId];
}

function resolveRoundSeconds(ageBand: ReadingRoutingAgeBand, levelId: LevelId): number {
  if (ageBand === '6-7') {
    if (levelId === 1) {
      return 12;
    }
    if (levelId === 2) {
      return 14;
    }
    return 16;
  }
  return ROUND_SECONDS[levelId];
}

function getHintTrend(hintsByRound: number[]): HintTrend {
  if (hintsByRound.length === 0) return 'steady';

  const midpoint = Math.ceil(hintsByRound.length / 2);
  const firstHalf = hintsByRound.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
  const secondHalf = hintsByRound.slice(midpoint).reduce((sum, value) => sum + value, 0);

  if (secondHalf < firstHalf) return 'improving';
  if (secondHalf > firstHalf) return 'needs_support';
  return 'steady';
}

function stableRangeFromAccuracy(accuracy: number): StableRange {
  if (accuracy >= 86) return '1-10';
  if (accuracy >= 68) return '1-5';
  return '1-3';
}

function speedTrendLabelKey(responseTimesMs: number[]): 'feedback.excellent' | 'feedback.keepGoing' | 'feedback.greatEffort' {
  if (responseTimesMs.length < 4) {
    return 'feedback.keepGoing';
  }

  const midpoint = Math.floor(responseTimesMs.length / 2);
  const firstHalf = responseTimesMs.slice(0, midpoint);
  const secondHalf = responseTimesMs.slice(midpoint);

  const firstAvg = firstHalf.reduce((sum, value) => sum + value, 0) / Math.max(1, firstHalf.length);
  const secondAvg = secondHalf.reduce((sum, value) => sum + value, 0) / Math.max(1, secondHalf.length);

  if (secondAvg <= firstAvg * 0.88) {
    return 'feedback.excellent';
  }

  if (secondAvg <= firstAvg * 1.05) {
    return 'feedback.keepGoing';
  }

  return 'feedback.greatEffort';
}

function createRound(levelId: LevelId, optionCount: number, previousWord: WordId | null): Round {
  const levelWordPool = WORD_POOL_BY_LEVEL[levelId];
  const availableWords = previousWord ? levelWordPool.filter((wordId) => wordId !== previousWord) : levelWordPool;
  const targetWord = pickRandom(availableWords.length > 0 ? availableWords : levelWordPool);

  const phraseCandidates = PHRASES.filter((phrase) => phrase.targetWord === targetWord);
  const phrase = pickRandom(phraseCandidates);

  const distractorPool = levelWordPool.filter((wordId) => wordId !== targetWord);
  const distractors = shuffle(distractorPool).slice(0, Math.max(1, optionCount - 1));
  const options = shuffle([targetWord, ...distractors]);

  return {
    targetWord,
    phrase,
    options,
  };
}

export function SightWordSprintGame({ level, onComplete, audio, onRequestBack }: SightWordSprintGameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir(i18n.language));
  const replayIcon = rtlReplayGlyph(isRtl);
  const nextIcon = rtlNextGlyph(isRtl);
  const levelConfig = useMemo(
    () => (level.configJson as Record<string, unknown>) ?? {},
    [level.configJson],
  );
  const fallbackLevelId = useMemo(() => resolveLevel(level.levelNumber), [level.levelNumber]);
  const routingContext = useMemo(
    () =>
      resolveReadingRoutingContext(levelConfig, fallbackLevelId, {
        baseLevelByAgeBand: {
          '3-4': 1,
          '4-5': 1,
          '5-6': 2,
          '6-7': 3,
        },
      }),
    [fallbackLevelId, levelConfig],
  );
  const levelId = routingContext.initialLevelId;
  const totalRounds = useMemo(() => {
    const configuredRoundCount =
      toPositiveInt(levelConfig.rounds) ??
      toPositiveInt(levelConfig.totalRounds) ??
      toPositiveInt(levelConfig.roundCount) ??
      (typeof levelConfig.progression === 'object' && levelConfig.progression && !Array.isArray(levelConfig.progression)
        ? toPositiveInt((levelConfig.progression as Record<string, unknown>).rounds) ??
          toPositiveInt((levelConfig.progression as Record<string, unknown>).totalRounds)
        : null);
    return configuredRoundCount ?? resolveRoundTarget(routingContext.ageBand);
  }, [levelConfig, routingContext.ageBand]);
  const initialOptionCount = useMemo(
    () => resolveInitialOptionCount(routingContext.ageBand, levelId, routingContext.inSupportMode),
    [levelId, routingContext.ageBand, routingContext.inSupportMode],
  );
  const initialRoundSeconds = useMemo(
    () => resolveRoundSeconds(routingContext.ageBand, levelId),
    [levelId, routingContext.ageBand],
  );

  const [roundIndex, setRoundIndex] = useState(0);
  const [optionCount, setOptionCount] = useState(initialOptionCount);
  const [phase, setPhase] = useState<Phase>('intro');
  const [sessionComplete, setSessionComplete] = useState(false);
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);
  const [round, setRound] = useState<Round>(() => createRound(levelId, initialOptionCount, null));
  const [slotWord, setSlotWord] = useState<WordId | null>(null);
  const [hintStage, setHintStage] = useState(0);
  const [highlightTarget, setHighlightTarget] = useState(false);
  const [highlightSlot, setHighlightSlot] = useState(false);
  const [boardFeedbackTone, setBoardFeedbackTone] = useState<BoardFeedbackTone>('idle');
  const [scorePulse, setScorePulse] = useState(false);
  const [countdownSec, setCountdownSec] = useState(initialRoundSeconds);
  const [roundMessage, setRoundMessage] = useState<RoundMessage>({
    key: 'games.sightWordSprint.instructions.intro',
    tone: 'neutral',
  });
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const roundSeconds = useMemo(
    () => resolveRoundSeconds(routingContext.ageBand, levelId),
    [levelId, routingContext.ageBand],
  );

  const timerRef = useRef<number | null>(null);
  const introTimeoutRef = useRef<number | null>(null);
  const hintClearTimeoutRef = useRef<number | null>(null);
  const roundAdvanceTimeoutRef = useRef<number | null>(null);
  const boardFeedbackTimeoutRef = useRef<number | null>(null);
  const scorePulseTimeoutRef = useRef<number | null>(null);
  const roundStartedAtRef = useRef(Date.now());
  const roundHadMistakeRef = useRef(false);
  const roundUsedHintRef = useRef(false);
  const firstTrySuccessesRef = useRef(0);
  const cleanStreakRef = useRef(0);
  const attemptsRef = useRef(0);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const roundHintsRef = useRef<number[]>([]);
  const responseTimesRef = useRef<number[]>([]);
  const previousTargetWordRef = useRef<WordId | null>(round.targetWord);
  const wrongByWordRef = useRef<Record<WordId, number>>({
    ani: 0,
    ata: 0,
    hi: 0,
    hu: 0,
    im: 0,
    al: 0,
    gam: 0,
    shel: 0,
    po: 0,
    kan: 0,
    ze: 0,
    ma: 0,
  });
  const wordStatsRef = useRef<Record<WordId, { hits: number; misses: number }>>({
    ani: { hits: 0, misses: 0 },
    ata: { hits: 0, misses: 0 },
    hi: { hits: 0, misses: 0 },
    hu: { hits: 0, misses: 0 },
    im: { hits: 0, misses: 0 },
    al: { hits: 0, misses: 0 },
    gam: { hits: 0, misses: 0 },
    shel: { hits: 0, misses: 0 },
    po: { hits: 0, misses: 0 },
    kan: { hits: 0, misses: 0 },
    ze: { hits: 0, misses: 0 },
    ma: { hits: 0, misses: 0 },
  });

  const playAudio = useCallback(
    async (key: string, mode: 'queue' | 'interrupt' = 'queue') => {
      if (audioPlaybackFailed) {
        return;
      }
      try {
        const path = audioPathForKey(key);
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
    (key: string, tone: MessageTone, mode: 'queue' | 'interrupt' = 'queue') => {
      setRoundMessage({ key, tone });
      void playAudio(key, mode);
    },
    [playAudio],
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearRoundAdvanceTimeout = useCallback(() => {
    if (roundAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(roundAdvanceTimeoutRef.current);
      roundAdvanceTimeoutRef.current = null;
    }
  }, []);

  const clearBoardFeedbackTimeout = useCallback(() => {
    if (boardFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(boardFeedbackTimeoutRef.current);
      boardFeedbackTimeoutRef.current = null;
    }
  }, []);

  const clearScorePulseTimeout = useCallback(() => {
    if (scorePulseTimeoutRef.current !== null) {
      window.clearTimeout(scorePulseTimeoutRef.current);
      scorePulseTimeoutRef.current = null;
    }
  }, []);

  const triggerBoardFeedback = useCallback(
    (tone: Exclude<BoardFeedbackTone, 'idle'>) => {
      clearBoardFeedbackTimeout();
      setBoardFeedbackTone(tone);
      boardFeedbackTimeoutRef.current = window.setTimeout(() => {
        setBoardFeedbackTone('idle');
        boardFeedbackTimeoutRef.current = null;
      }, tone === 'success' ? 760 : 600);
    },
    [clearBoardFeedbackTimeout],
  );

  const triggerScorePulse = useCallback(() => {
    clearScorePulseTimeout();
    setScorePulse(true);
    scorePulseTimeoutRef.current = window.setTimeout(() => {
      setScorePulse(false);
      scorePulseTimeoutRef.current = null;
    }, 760);
  }, [clearScorePulseTimeout]);

  const clearHighlightsSoon = useCallback(() => {
    if (hintClearTimeoutRef.current !== null) {
      window.clearTimeout(hintClearTimeoutRef.current);
    }

    hintClearTimeoutRef.current = window.setTimeout(() => {
      setHighlightTarget(false);
      setHighlightSlot(false);
      hintClearTimeoutRef.current = null;
    }, 1700);
  }, []);

  const beginSelectPhase = useCallback((activeRound: Round) => {
    setPhase('select');
    roundStartedAtRef.current = Date.now();
    roundHadMistakeRef.current = false;
    roundUsedHintRef.current = false;
    setHintStage(0);
    setSlotWord(null);
    setHighlightTarget(false);
    setHighlightSlot(false);
    setBoardFeedbackTone('idle');
    setCountdownSec(roundSeconds);

    setMessageWithAudio('games.sightWordSprint.prompts.wordSelect.chooseWord', 'neutral', 'interrupt');
    void playAudio(`words.highFrequency.${activeRound.targetWord}`);
  }, [playAudio, roundSeconds, setMessageWithAudio]);

  const scheduleRoundIntro = useCallback((activeRound: Round) => {
    if (introTimeoutRef.current !== null) {
      window.clearTimeout(introTimeoutRef.current);
    }

    setPhase('intro');
    setMessageWithAudio('games.sightWordSprint.prompts.wordIntro.ready', 'neutral', 'interrupt');
    void playAudio('games.sightWordSprint.prompts.wordIntro.listen');
    void playAudio(`words.highFrequency.${activeRound.targetWord}`);
    void playAudio('games.sightWordSprint.prompts.wordIntro.modelSentence');
    void playAudio(activeRound.phrase.phraseKey);

    introTimeoutRef.current = window.setTimeout(() => {
      beginSelectPhase(activeRound);
      introTimeoutRef.current = null;
    }, 1050);
  }, [beginSelectPhase, playAudio, setMessageWithAudio]);

  const finishSession = useCallback(() => {
    clearTimer();
    clearRoundAdvanceTimeout();

    const accuracy = Math.round((hitsRef.current / Math.max(1, attemptsRef.current)) * 100);
    const hintTrend = getHintTrend(roundHintsRef.current);
    const responseTrendKey = speedTrendLabelKey(responseTimesRef.current);

    const highestMastery = (Object.entries(wordStatsRef.current) as Array<[WordId, { hits: number; misses: number }]>)
      .map(([wordId, stats]) => {
        const total = stats.hits + stats.misses;
        const mastery = Math.round((stats.hits / Math.max(1, total)) * 100);
        return { wordId, mastery };
      })
      .sort((left, right) => right.mastery - left.mastery)[0];

    const masteryWord = highestMastery?.wordId ?? 'ani';
    const masteryPercent = highestMastery?.mastery ?? 0;

    const summaryMetrics: ParentSummaryMetrics = {
      highestStableRange: stableRangeFromAccuracy(accuracy),
      firstAttemptSuccessRate: Math.round((firstTrySuccessesRef.current / Math.max(1, totalRounds)) * 100),
      hintTrend,
    };

    const completionResult: GameCompletionResult = {
      completed: true,
      roundsCompleted: totalRounds,
      score: accuracy,
      stars: accuracy >= 86 ? 3 : accuracy >= 68 ? 2 : 1,
      summaryMetrics,
    };

    onComplete(completionResult);

    setSummary({
      accuracy,
      speedTrendLabel: t(responseTrendKey),
      hintTrendLabel:
        hintTrend === 'improving' ? t('feedback.excellent') : hintTrend === 'steady' ? t('feedback.keepGoing') : t('feedback.greatEffort'),
      masteryWordLabel: t(WORDS[masteryWord].key),
      masteryPercent,
    });

    setSessionComplete(true);
    setPhase('complete');
    setMessageWithAudio('games.sightWordSprint.feedback.success.sessionComplete', 'success', 'interrupt');
    void playAudio('games.sightWordSprint.prompts.frameComplete.recap');
  }, [clearRoundAdvanceTimeout, clearTimer, onComplete, playAudio, setMessageWithAudio, t, totalRounds]);

  const startNextRound = useCallback(() => {
    clearRoundAdvanceTimeout();
    const hintsThisRound = roundUsedHintRef.current ? 1 : 0;
    roundHintsRef.current = [...roundHintsRef.current, hintsThisRound];

    if (!roundHadMistakeRef.current && !roundUsedHintRef.current) {
      cleanStreakRef.current += 1;
      firstTrySuccessesRef.current += 1;
    } else {
      cleanStreakRef.current = 0;
    }

    let nextOptionCount = optionCount;

    if (cleanStreakRef.current >= 4) {
      const maxAllowed = routingContext.ageBand === '6-7'
        ? Math.min(5, BASE_OPTION_COUNT[levelId] + 2)
        : Math.min(4, BASE_OPTION_COUNT[levelId] + 1);
      nextOptionCount = Math.min(maxAllowed, optionCount + 1);
      setOptionCount(nextOptionCount);
      cleanStreakRef.current = 0;
      setMessageWithAudio('games.sightWordSprint.hints.precisionNudge.accuracyFirst', 'hint');
    }

    const nextRoundIndex = roundIndex + 1;
    if (nextRoundIndex >= totalRounds) {
      finishSession();
      return;
    }

    if (routingContext.ageBand === '6-7' && nextRoundIndex >= Math.max(0, totalRounds - 2)) {
      nextOptionCount = Math.max(nextOptionCount, 4);
      setOptionCount(nextOptionCount);
      setMessageWithAudio('games.sightWordSprint.hints.precisionNudge.accuracyFirst', 'hint');
    }

    const nextRound = createRound(levelId, nextOptionCount, previousTargetWordRef.current);
    previousTargetWordRef.current = nextRound.targetWord;

    setRoundIndex(nextRoundIndex);
    setRound(nextRound);
    setHintStage(0);
    setSlotWord(null);
    setBoardFeedbackTone('idle');
  }, [clearRoundAdvanceTimeout, finishSession, levelId, optionCount, roundIndex, routingContext.ageBand, setMessageWithAudio, totalRounds]);

  const rebuildCurrentOptions = useCallback(
    (nextOptionCount: number) => {
      const levelWordPool = WORD_POOL_BY_LEVEL[levelId].filter((wordId) => wordId !== round.targetWord);
      const distractors = shuffle(levelWordPool).slice(0, Math.max(1, nextOptionCount - 1));
      const options = shuffle([round.targetWord, ...distractors]);

      setRound((current) => ({
        ...current,
        options,
      }));
    },
    [levelId, round.targetWord],
  );

  const registerWrongAttempt = useCallback(() => {
    roundHadMistakeRef.current = true;
    missesRef.current += 1;
    wordStatsRef.current[round.targetWord] = {
      ...wordStatsRef.current[round.targetWord],
      misses: wordStatsRef.current[round.targetWord].misses + 1,
    };

    wrongByWordRef.current[round.targetWord] += 1;
    triggerBoardFeedback('miss');

    setMessageWithAudio('games.sightWordSprint.feedback.retry.tryAgain', 'hint', 'interrupt');
    void playAudio('games.sightWordSprint.feedback.retry.listenAgain');

    if (wrongByWordRef.current[round.targetWord] >= 2) {
      wrongByWordRef.current[round.targetWord] = 0;
      setOptionCount((current) => {
        const next = Math.max(2, current - 1);
        rebuildCurrentOptions(next);
        return next;
      });
      setHighlightTarget(true);
      clearHighlightsSoon();
      setMessageWithAudio('games.sightWordSprint.hints.reduceChoices', 'hint', 'interrupt');
      void playAudio(round.phrase.phraseKey);
    }
  }, [clearHighlightsSoon, playAudio, rebuildCurrentOptions, round.phrase.phraseKey, round.targetWord, setMessageWithAudio, triggerBoardFeedback]);

  const handleSelectWord = useCallback(
    (wordId: WordId) => {
      if (phase !== 'select' || sessionComplete) {
        return;
      }

      attemptsRef.current += 1;

      if (wordId !== round.targetWord) {
        registerWrongAttempt();
        return;
      }

      hitsRef.current += 1;
      wordStatsRef.current[round.targetWord] = {
        ...wordStatsRef.current[round.targetWord],
        hits: wordStatsRef.current[round.targetWord].hits + 1,
      };

      responseTimesRef.current = [...responseTimesRef.current, Date.now() - roundStartedAtRef.current];

      setPhase('frame');
      setSlotWord(null);
      setHighlightTarget(false);
      setHintStage(0);
      setMessageWithAudio('games.sightWordSprint.prompts.frameComplete.dragWord', 'success', 'interrupt');
      void playAudio(round.phrase.phraseKey);
    },
    [phase, registerWrongAttempt, round.phrase.phraseKey, round.targetWord, sessionComplete, setMessageWithAudio, playAudio],
  );

  const handlePlaceWord = useCallback(
    (wordId: WordId) => {
      if (phase !== 'frame' || sessionComplete) {
        return;
      }

      if (wordId !== round.targetWord) {
        registerWrongAttempt();
        setHighlightSlot(true);
        clearHighlightsSoon();
        setMessageWithAudio('games.sightWordSprint.feedback.retry.frameRetry', 'hint', 'interrupt');
        return;
      }

      const cleanRound = !roundHadMistakeRef.current && !roundUsedHintRef.current;
      setSlotWord(wordId);
      triggerBoardFeedback('success');
      if (cleanRound) {
        triggerScorePulse();
      }
      setMessageWithAudio('games.sightWordSprint.feedback.success.frameComplete', 'success', 'interrupt');
      void playAudio(round.phrase.phraseKey);
      void playAudio('games.sightWordSprint.feedback.success.badgeProgress');

      clearRoundAdvanceTimeout();
      roundAdvanceTimeoutRef.current = window.setTimeout(() => {
        startNextRound();
        roundAdvanceTimeoutRef.current = null;
      }, 760);
    },
    [
      clearHighlightsSoon,
      clearRoundAdvanceTimeout,
      phase,
      playAudio,
      registerWrongAttempt,
      round.phrase.phraseKey,
      round.targetWord,
      sessionComplete,
      setMessageWithAudio,
      startNextRound,
      triggerBoardFeedback,
      triggerScorePulse,
    ],
  );

  const handleReplay = useCallback(() => {
    if (sessionComplete) {
      return;
    }

    setMessageWithAudio('games.sightWordSprint.instructions.tapReplay', 'neutral', 'interrupt');

    if (phase === 'select') {
      void playAudio('games.sightWordSprint.prompts.wordSelect.chooseWord');
      void playAudio(`words.highFrequency.${round.targetWord}`);
      return;
    }

    if (phase === 'frame') {
      void playAudio('games.sightWordSprint.prompts.frameComplete.dragWord');
      void playAudio(round.phrase.phraseKey);
      return;
    }

    void playAudio('games.sightWordSprint.instructions.intro');
  }, [phase, playAudio, round.phrase.phraseKey, round.targetWord, sessionComplete, setMessageWithAudio]);

  const handleRetry = useCallback(() => {
    if (sessionComplete) {
      return;
    }

    setOptionCount((current) => {
      const next = Math.max(2, current - 1);
      rebuildCurrentOptions(next);
      return next;
    });

    setPhase('select');
    setSlotWord(null);
    setHintStage(0);
    setHighlightTarget(false);
    setHighlightSlot(false);
    setBoardFeedbackTone('idle');
    setScorePulse(false);
    setCountdownSec(roundSeconds);
    roundHadMistakeRef.current = true;
    roundStartedAtRef.current = Date.now();
    clearRoundAdvanceTimeout();

    setMessageWithAudio('games.sightWordSprint.instructions.tapRetry', 'hint', 'interrupt');
    void playAudio(`words.highFrequency.${round.targetWord}`);
  }, [clearRoundAdvanceTimeout, playAudio, rebuildCurrentOptions, round.targetWord, roundSeconds, sessionComplete, setMessageWithAudio]);

  const handleHint = useCallback(() => {
    if (sessionComplete) {
      return;
    }

    roundUsedHintRef.current = true;

    setHintStage((current) => {
      const next = Math.min(3, current + 1);

      if (next === 1) {
        setMessageWithAudio(FIRST_HINT_KEY, 'hint', 'interrupt');
        void playAudio(`words.highFrequency.${round.targetWord}`);
      } else if (next === 2) {
        setMessageWithAudio(SECOND_HINT_KEY, 'hint', 'interrupt');
        void playAudio(round.phrase.phraseKey);
      } else {
        setMessageWithAudio(THIRD_HINT_KEY, 'hint', 'interrupt');
        if (phase === 'select') {
          setHighlightTarget(true);
        } else {
          setHighlightSlot(true);
        }
        clearHighlightsSoon();
      }

      return next;
    });
  }, [clearHighlightsSoon, phase, playAudio, round.phrase.phraseKey, round.targetWord, sessionComplete, setMessageWithAudio]);

  const handleNext = useCallback(() => {
    if (sessionComplete) {
      return;
    }

    void playAudio('nav.next', 'interrupt');

    if (phase === 'intro') {
      beginSelectPhase(round);
      return;
    }

    if (phase === 'frame' && slotWord === round.targetWord) {
      clearRoundAdvanceTimeout();
      startNextRound();
      return;
    }

    setMessageWithAudio('games.sightWordSprint.prompts.wordSelect.chooseWord', 'neutral', 'interrupt');
  }, [beginSelectPhase, clearRoundAdvanceTimeout, phase, playAudio, round, round.targetWord, sessionComplete, setMessageWithAudio, slotWord, startNextRound]);

  useEffect(() => {
    if (sessionComplete) {
      return;
    }

    scheduleRoundIntro(round);

    return () => {
      if (introTimeoutRef.current !== null) {
        window.clearTimeout(introTimeoutRef.current);
      }
      if (hintClearTimeoutRef.current !== null) {
        window.clearTimeout(hintClearTimeoutRef.current);
      }
      clearRoundAdvanceTimeout();
      clearBoardFeedbackTimeout();
      clearScorePulseTimeout();
      clearTimer();
    };
  }, [clearBoardFeedbackTimeout, clearRoundAdvanceTimeout, clearScorePulseTimeout, clearTimer, round.phrase.id, round.targetWord, roundIndex, scheduleRoundIntro, sessionComplete]);

  useEffect(() => {
    clearTimer();

    if (sessionComplete || phase !== 'select' || roundSeconds <= 0) {
      return;
    }

    setCountdownSec(roundSeconds);

    timerRef.current = window.setInterval(() => {
      setCountdownSec((current) => {
        if (current <= 1) {
          window.clearInterval(timerRef.current ?? 0);
          timerRef.current = null;
          setMessageWithAudio('games.sightWordSprint.hints.softTimer', 'hint', 'interrupt');
          void playAudio('games.sightWordSprint.prompts.wordSelect.keepRhythm');
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      clearTimer();
    };
  }, [clearTimer, phase, playAudio, roundSeconds, sessionComplete, setMessageWithAudio]);

  const targetWordLabel = t(WORDS[round.targetWord].key);

  const completionSummary = summary ?? {
    accuracy: 0,
    speedTrendLabel: t('feedback.keepGoing'),
    hintTrendLabel: t('feedback.keepGoing'),
    masteryWordLabel: t(WORDS.ani.key),
    masteryPercent: 0,
  };

  return (
    <Card padding="lg" className="sight-word-sprint">
        <GameTopBar
        title={t('games.sightWordSprint.title')}
        subtitle={t('games.sightWordSprint.subtitle')}
        progressLabel={`${Math.min(roundIndex + 1, totalRounds)}/${totalRounds}`}
        progressAriaLabel={t('games.sightWordSprint.prompts.wordSelect.chooseWord')}
        currentStep={Math.min(roundIndex + 1, totalRounds)}
        totalSteps={totalRounds}
        onReplayInstruction={handleReplay}
        replayAriaLabel={t('games.sightWordSprint.instructions.tapReplay')}
        onBack={onRequestBack}
        backAriaLabel={t('nav.back')}
        rightSlot={
          <div className="sight-word-sprint__score" aria-live="polite">
            <span className={['sight-word-sprint__score-pill', scorePulse ? 'sight-word-sprint__score-pill--pulse' : ''].join(' ')}>
              🎯 {roundIndex + 1}/{totalRounds}
            </span>
            {roundSeconds > 0 && <span className="sight-word-sprint__score-pill">⏱ {countdownSec}</span>}
          </div>
        }
      />

      <div className={['sight-word-sprint__status', roundMessage.tone === 'hint' ? 'sight-word-sprint__status--hint' : '', roundMessage.tone === 'success' ? 'sight-word-sprint__status--success' : ''].join(' ')}>
        <MascotIllustration variant="hint" size={50} />
        <p className="sight-word-sprint__status-text">{t(roundMessage.key as any)}</p>
        <button
          type="button"
          className="sight-word-sprint__inline-replay"
          onClick={handleReplay}
          aria-label={t('games.sightWordSprint.instructions.tapReplay')}
        >
          {replayIcon}
        </button>
      </div>

      {audioPlaybackFailed && !sessionComplete && (
        <p className="sight-word-sprint__audio-fallback">
          🔇 {t('games.sightWordSprint.prompts.wordSelect.chooseWord')}
        </p>
      )}

      {!sessionComplete && (
        <div className="sight-word-sprint__icon-controls">
          <button
            type="button"
            className="sight-word-sprint__icon-button"
            onClick={handleReplay}
            aria-label={t('games.sightWordSprint.instructions.tapReplay')}
          >
            {replayIcon}
          </button>
          <button
            type="button"
            className="sight-word-sprint__icon-button"
            onClick={handleRetry}
            aria-label={t('games.sightWordSprint.instructions.tapRetry')}
          >
            ↻
          </button>
          <button
            type="button"
            className="sight-word-sprint__icon-button"
            onClick={handleHint}
            aria-label={t('games.sightWordSprint.instructions.tapHint')}
          >
            💡
          </button>
          <button type="button" className="sight-word-sprint__icon-button" onClick={handleNext} aria-label={t('nav.next')}>
            {nextIcon}
          </button>
        </div>
      )}

      {!sessionComplete && (
        <section
          className={[
            'sight-word-sprint__board',
            boardFeedbackTone === 'success' ? 'sight-word-sprint__board--success' : '',
            boardFeedbackTone === 'miss' ? 'sight-word-sprint__board--miss' : '',
          ].join(' ')}
        >
          <Card padding="md" className="sight-word-sprint__target-card">
            <div className="sight-word-sprint__target-label-row">
              <span className="sight-word-sprint__target-label">{t('games.sightWordSprint.prompts.wordIntro.targetWord')}</span>
              <button
                type="button"
                className="sight-word-sprint__small-replay"
                onClick={() => {
                  void playAudio(`words.highFrequency.${round.targetWord}`, 'interrupt');
                }}
                aria-label={t('games.sightWordSprint.instructions.tapReplay')}
              >
                {replayIcon}
              </button>
            </div>
            <p className="sight-word-sprint__target-word" dir="rtl">{targetWordLabel}</p>
          </Card>

          <Card padding="md" className="sight-word-sprint__select-card">
            <p className="sight-word-sprint__section-title">{t('games.sightWordSprint.prompts.wordSelect.chooseWord')}</p>
            <div className="sight-word-sprint__word-options" dir="rtl">
              {round.options.map((wordId) => {
                const isTarget = wordId === round.targetWord;
                const shouldGlow = isTarget && highlightTarget;

                return (
                  <button
                    key={`option-${wordId}`}
                    type="button"
                    className={[
                      'sight-word-sprint__word-chip',
                      shouldGlow ? 'sight-word-sprint__word-chip--hint' : '',
                    ].join(' ')}
                    onClick={() => handleSelectWord(wordId)}
                    aria-label={t(WORDS[wordId].key)}
                  >
                    {t(WORDS[wordId].key)}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card padding="md" className="sight-word-sprint__frame-card">
            <p className="sight-word-sprint__section-title">{t('games.sightWordSprint.prompts.frameComplete.dragWord')}</p>
            <p className="sight-word-sprint__frame-text" dir="rtl">
              {t(round.phrase.frameKey, {
                slot: slotWord ? t(WORDS[slotWord].key) : '___',
              })}
            </p>

            <div className="sight-word-sprint__frame-tools" dir="rtl">
              <button
                type="button"
                className={[
                  'sight-word-sprint__drop-slot',
                  highlightSlot ? 'sight-word-sprint__drop-slot--hint' : '',
                  slotWord ? 'sight-word-sprint__drop-slot--filled' : '',
                ].join(' ')}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const rawWordId = event.dataTransfer.getData('text/plain') as WordId | '';
                  if (!rawWordId) {
                    return;
                  }
                  handlePlaceWord(rawWordId);
                }}
                onClick={() => {
                  void playAudio(round.phrase.phraseKey, 'interrupt');
                }}
                aria-label={t('games.sightWordSprint.prompts.frameComplete.slotLabel')}
              >
                {slotWord ? t(WORDS[slotWord].key) : t('games.sightWordSprint.prompts.frameComplete.slotLabel')}
              </button>

              <div className="sight-word-sprint__frame-chips">
                {round.options.map((wordId) => (
                  <button
                    key={`frame-chip-${wordId}`}
                    type="button"
                    draggable
                    className="sight-word-sprint__frame-chip"
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', wordId);
                    }}
                    onClick={() => handlePlaceWord(wordId)}
                    aria-label={t(WORDS[wordId].key)}
                  >
                    {t(WORDS[wordId].key)}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </section>
      )}

      {sessionComplete && (
        <div className="sight-word-sprint__completion">
          <SuccessCelebration dense />
          <p className="sight-word-sprint__completion-title">{t('feedback.youDidIt')}</p>
          <p className="sight-word-sprint__completion-line">
            {t('parentDashboard.games.sightWordSprint.progressSummary', {
              accuracy: `${completionSummary.accuracy}%`,
              speedTrend: completionSummary.speedTrendLabel,
              hintTrend: completionSummary.hintTrendLabel,
            })}
          </p>
          <p className="sight-word-sprint__completion-line">
            {t('parentDashboard.games.sightWordSprint.highFrequencyMastery', {
              masteredWords: `${completionSummary.masteryWordLabel} (${completionSummary.masteryPercent}%)`,
              word: completionSummary.masteryWordLabel,
              mastery: `${completionSummary.masteryPercent}%`,
            })}
          </p>
          <p className="sight-word-sprint__completion-line">{t('parentDashboard.games.sightWordSprint.nextStep')}</p>
        </div>
      )}

      <style>{`
        .sight-word-sprint {
          display: grid;
          gap: var(--space-md);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 24%, transparent);
          background:
            radial-gradient(circle at 8% 12%, color-mix(in srgb, var(--color-accent-secondary) 16%, transparent), transparent 56%),
            radial-gradient(circle at 92% 88%, color-mix(in srgb, var(--color-accent-primary) 14%, transparent), transparent 62%),
            var(--color-surface);
        }

        .sight-word-sprint__score {
          display: inline-flex;
          gap: var(--space-xs);
          align-items: center;
          flex-wrap: wrap;
        }

        .sight-word-sprint__score-pill {
          min-height: 48px;
          min-inline-size: 76px;
          padding-inline: var(--space-sm);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-full);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 30%, transparent);
          background: color-mix(in srgb, var(--color-accent-primary) 10%, var(--color-surface));
          color: var(--color-text-primary);
          font-weight: var(--font-weight-semibold);
        }

        .sight-word-sprint__score-pill--pulse {
          animation: sight-word-score-pill-pulse 520ms ease;
        }

        .sight-word-sprint__status {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: var(--space-sm);
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          background: color-mix(in srgb, var(--color-surface-muted) 84%, transparent);
          padding: var(--space-sm);
        }

        .sight-word-sprint__status--hint {
          border-color: color-mix(in srgb, var(--color-accent-warning) 58%, transparent);
        }

        .sight-word-sprint__status--success {
          border-color: color-mix(in srgb, var(--color-accent-success) 58%, transparent);
        }

        .sight-word-sprint__status-text {
          margin: 0;
          color: var(--color-text-primary);
        }

        .sight-word-sprint__audio-fallback {
          margin: 0;
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-sm);
          border: 1px solid color-mix(in srgb, var(--color-accent-warning) 46%, transparent);
          background: color-mix(in srgb, var(--color-accent-warning) 16%, transparent);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          text-align: center;
        }

        .sight-word-sprint__inline-replay {
          min-height: 48px;
          min-inline-size: 48px;
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
          background: var(--color-surface);
          color: var(--color-text-primary);
          cursor: pointer;
          font-size: 1.05rem;
        }

        .sight-word-sprint__icon-controls {
          display: grid;
          grid-template-columns: repeat(4, minmax(48px, 1fr));
          gap: var(--space-xs);
        }

        .sight-word-sprint__icon-button {
          min-height: 48px;
          min-inline-size: 48px;
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          background: var(--color-surface);
          color: var(--color-text-primary);
          cursor: pointer;
          font-size: 1.2rem;
          transition: transform 120ms ease;
        }

        .sight-word-sprint__icon-button:active {
          transform: scale(0.96);
        }

        .sight-word-sprint__board {
          display: grid;
          gap: var(--space-sm);
          transition: transform 180ms ease;
        }

        .sight-word-sprint__board--success {
          animation: sight-word-board-pop 340ms ease;
        }

        .sight-word-sprint__board--miss {
          animation: sight-word-board-shake 320ms ease;
        }

        .sight-word-sprint__target-card,
        .sight-word-sprint__select-card,
        .sight-word-sprint__frame-card {
          display: grid;
          gap: var(--space-sm);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 18%, transparent);
        }

        .sight-word-sprint__target-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-xs);
        }

        .sight-word-sprint__target-label {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .sight-word-sprint__small-replay {
          min-height: 48px;
          min-inline-size: 48px;
          border-radius: var(--radius-sm);
          border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
          background: var(--color-surface);
          color: var(--color-text-primary);
          cursor: pointer;
          font-size: 1rem;
        }

        .sight-word-sprint__target-word {
          margin: 0;
          font-size: clamp(1.6rem, 4vw, 2.2rem);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
        }

        .sight-word-sprint__section-title {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .sight-word-sprint__word-options,
        .sight-word-sprint__frame-chips {
          display: grid;
          gap: var(--space-xs);
          grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
        }

        .sight-word-sprint__word-chip,
        .sight-word-sprint__frame-chip {
          min-height: 56px;
          min-inline-size: 56px;
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 34%, transparent);
          background: color-mix(in srgb, var(--color-surface) 90%, var(--color-theme-bg));
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
          cursor: pointer;
          touch-action: manipulation;
        }

        .sight-word-sprint__word-chip--hint,
        .sight-word-sprint__drop-slot--hint {
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-warning) 34%, transparent);
        }

        .sight-word-sprint__frame-text {
          margin: 0;
          color: var(--color-text-primary);
          font-size: clamp(1.05rem, 2.2vw, 1.35rem);
          line-height: 1.7;
        }

        .sight-word-sprint__frame-tools {
          display: grid;
          gap: var(--space-sm);
        }

        .sight-word-sprint__drop-slot {
          min-height: 56px;
          border-radius: var(--radius-md);
          border: 2px dashed color-mix(in srgb, var(--color-accent-primary) 46%, transparent);
          background: color-mix(in srgb, var(--color-theme-bg) 60%, var(--color-surface));
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
          cursor: pointer;
          padding-inline: var(--space-sm);
        }

        .sight-word-sprint__drop-slot--filled {
          border-style: solid;
        }

        .sight-word-sprint__completion {
          display: grid;
          gap: var(--space-sm);
          justify-items: center;
          text-align: center;
          padding: var(--space-lg);
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-accent-success) 40%, transparent);
          background: color-mix(in srgb, var(--color-accent-success) 12%, transparent);
        }

        .sight-word-sprint__completion-title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
        }

        .sight-word-sprint__completion-line {
          margin: 0;
          color: var(--color-text-secondary);
        }

        @keyframes sight-word-score-pill-pulse {
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

        @keyframes sight-word-board-pop {
          0% {
            transform: scale(1);
          }
          45% {
            transform: scale(1.01);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes sight-word-board-shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-6px);
          }
          75% {
            transform: translateX(6px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sight-word-sprint__score-pill--pulse,
          .sight-word-sprint__board--success,
          .sight-word-sprint__board--miss,
          .sight-word-sprint__icon-button,
          .sight-word-sprint__word-chip,
          .sight-word-sprint__frame-chip,
          .sight-word-sprint__drop-slot {
            transition: none !important;
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </Card>
  );
}
