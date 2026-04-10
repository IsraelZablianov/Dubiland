import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';

type Level = 1 | 2 | 3;
type Phase = 'tap' | 'sort' | 'transfer' | 'roundDone' | 'sessionDone';
type Tone = 'neutral' | 'hint' | 'success' | 'error';
type BoardFeedback = 'idle' | 'success' | 'miss';
type PairId = 'betKaf' | 'daletResh' | 'vavZayin' | 'finalNunVav';
type LetterId = 'bet' | 'kaf' | 'dalet' | 'resh' | 'vav' | 'zayin' | 'finalNun';
type TransferMode = 'syllables' | 'words';

interface PairDefinition {
  id: PairId;
  target: LetterId;
  confusable: LetterId;
  tapPromptKey: `games.confusableLetterContrast.prompts.tapMatch.${string}`;
  transferPromptKey: `games.confusableLetterContrast.prompts.transferRead.${string}`;
}

interface RoundDefinition {
  id: string;
  level: Level;
  pairId: PairId;
  choices: LetterId[];
  sortLetters?: LetterId[];
  transferMode?: TransferMode;
}

interface SortCard {
  id: string;
  letterId: LetterId;
}

interface StatusMessage {
  key: `games.confusableLetterContrast.${string}`;
  tone: Tone;
}

interface SessionRoundPerformance {
  pairId: PairId;
  firstTry: boolean;
  hints: number;
}

interface SessionStats {
  roundsCompleted: number;
  firstTryRounds: number;
  totalActions: number;
  hintsPerRound: number[];
  pairConfusions: Record<PairId, number>;
  performance: SessionRoundPerformance[];
  transferAttempts: number;
  transferSuccesses: number;
}

const FALLBACK_AFTER_SAME_PAIR_ERRORS = 2;
const SLOW_MODE_HINT_THRESHOLD = 2;
const SLOW_MODE_ERROR_THRESHOLD = 3;
const SLOW_MODE_ROUNDS = 2;
const MASTERY_WINDOW = 6;
const MASTERY_FIRST_TRY_THRESHOLD = 5;
const MASTERY_HINTS_MAX = 1;
const ANTI_RANDOM_WRONG_TAP_COUNT = 3;
const ANTI_RANDOM_TAP_INTERVAL_MS = 450;
const ANTI_RANDOM_WINDOW_MS = 5000;
const ANTI_RANDOM_PAUSE_MS = 1000;

const LETTER_SYMBOLS: Record<LetterId, string> = {
  bet: 'ב',
  kaf: 'כ',
  dalet: 'ד',
  resh: 'ר',
  vav: 'ו',
  zayin: 'ז',
  finalNun: 'ן',
};

const LETTER_PRONUNCIATION_KEY: Record<LetterId, `letters.pronunciation.${string}`> = {
  bet: 'letters.pronunciation.bet',
  kaf: 'letters.pronunciation.kaf',
  dalet: 'letters.pronunciation.dalet',
  resh: 'letters.pronunciation.resh',
  vav: 'letters.pronunciation.vav',
  zayin: 'letters.pronunciation.zayin',
  finalNun: 'letters.pronunciation.nun',
};

const LETTER_TRANSFER_KEY: Record<LetterId, string> = {
  bet: 'bet',
  kaf: 'kaf',
  dalet: 'dalet',
  resh: 'resh',
  vav: 'vav',
  zayin: 'zayin',
  finalNun: 'finalNun',
};

const PAIRS: Record<PairId, PairDefinition> = {
  betKaf: {
    id: 'betKaf',
    target: 'bet',
    confusable: 'kaf',
    tapPromptKey: 'games.confusableLetterContrast.prompts.tapMatch.pairBetKaf',
    transferPromptKey: 'games.confusableLetterContrast.prompts.transferRead.pairBetKaf',
  },
  daletResh: {
    id: 'daletResh',
    target: 'dalet',
    confusable: 'resh',
    tapPromptKey: 'games.confusableLetterContrast.prompts.tapMatch.pairDaletResh',
    transferPromptKey: 'games.confusableLetterContrast.prompts.transferRead.pairDaletResh',
  },
  vavZayin: {
    id: 'vavZayin',
    target: 'vav',
    confusable: 'zayin',
    tapPromptKey: 'games.confusableLetterContrast.prompts.tapMatch.pairVavZayin',
    transferPromptKey: 'games.confusableLetterContrast.prompts.transferRead.pairVavZayin',
  },
  finalNunVav: {
    id: 'finalNunVav',
    target: 'finalNun',
    confusable: 'vav',
    tapPromptKey: 'games.confusableLetterContrast.prompts.tapMatch.pairFinalNunVav',
    transferPromptKey: 'games.confusableLetterContrast.prompts.transferRead.pairFinalNunVav',
  },
};

const ROUND_SEQUENCE: RoundDefinition[] = [
  {
    id: 'level1-bet-kaf',
    level: 1,
    pairId: 'betKaf',
    choices: ['bet', 'kaf'],
  },
  {
    id: 'level1-dalet-resh',
    level: 1,
    pairId: 'daletResh',
    choices: ['dalet', 'resh'],
  },
  {
    id: 'level2-vav-zayin',
    level: 2,
    pairId: 'vavZayin',
    choices: ['vav', 'zayin', 'bet', 'dalet'],
    sortLetters: ['vav', 'zayin', 'vav', 'zayin'],
  },
  {
    id: 'level2-final-nun-vav',
    level: 2,
    pairId: 'finalNunVav',
    choices: ['finalNun', 'vav', 'resh', 'kaf'],
    sortLetters: ['finalNun', 'vav', 'finalNun', 'vav'],
  },
  {
    id: 'level3-bet-kaf-transfer',
    level: 3,
    pairId: 'betKaf',
    choices: ['bet', 'kaf'],
    transferMode: 'syllables',
  },
  {
    id: 'level3-dalet-resh-transfer',
    level: 3,
    pairId: 'daletResh',
    choices: ['dalet', 'resh'],
    transferMode: 'words',
  },
];

const TOTAL_ROUNDS = ROUND_SEQUENCE.length;

const PAIR_LABEL_KEYS: Record<PairId, [LetterId, LetterId]> = {
  betKaf: ['bet', 'kaf'],
  daletResh: ['dalet', 'resh'],
  vavZayin: ['vav', 'zayin'],
  finalNunVav: ['finalNun', 'vav'],
};

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function keyToAudioPath(key: string): string {
  return `/audio/he/${key.split('.').map(toKebabCase).join('/')}.mp3`;
}

function shuffle<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function toStableRange(firstAttemptSuccessRate: number): StableRange {
  if (firstAttemptSuccessRate >= 85) return '1-10';
  if (firstAttemptSuccessRate >= 65) return '1-5';
  return '1-3';
}

function toHintTrend(hintsPerRound: number[]): ParentSummaryMetrics['hintTrend'] {
  if (hintsPerRound.length < 2) {
    return 'steady';
  }

  const midpoint = Math.ceil(hintsPerRound.length / 2);
  const firstHalf = hintsPerRound.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
  const secondHalf = hintsPerRound.slice(midpoint).reduce((sum, value) => sum + value, 0);

  if (secondHalf < firstHalf) {
    return 'improving';
  }
  if (secondHalf === firstHalf) {
    return 'steady';
  }
  return 'needs_support';
}

function toneIcon(tone: Tone): string {
  if (tone === 'success') return '✅';
  if (tone === 'hint') return '💡';
  if (tone === 'error') return '↻';
  return '▶';
}

const visuallyHiddenStyle: CSSProperties = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  width: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
};

export function ConfusableLetterContrastGame({ onComplete, audio }: GameProps) {
  const { t } = useTranslation('common');
  const tx = useCallback((key: string) => t(key as never), [t]);

  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('tap');
  const [status, setStatus] = useState<StatusMessage>({
    key: 'games.confusableLetterContrast.instructions.intro',
    tone: 'neutral',
  });
  const [boardFeedback, setBoardFeedback] = useState<BoardFeedback>('idle');
  const [roundHintCount, setRoundHintCount] = useState(0);
  const [roundErrorCount, setRoundErrorCount] = useState(0);
  const [hintStep, setHintStep] = useState(0);
  const [slowModeRoundsRemaining, setSlowModeRoundsRemaining] = useState(0);
  const [canContinue, setCanContinue] = useState(false);
  const [tapChoices, setTapChoices] = useState<LetterId[]>([]);
  const [transferChoices, setTransferChoices] = useState<LetterId[]>([]);
  const [sortCards, setSortCards] = useState<SortCard[]>([]);
  const [selectedTapChoice, setSelectedTapChoice] = useState<LetterId | null>(null);
  const [selectedSortCardId, setSelectedSortCardId] = useState<string | null>(null);
  const [masteredPairs, setMasteredPairs] = useState<Set<PairId>>(new Set());
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const [inputLockedUntil, setInputLockedUntil] = useState(0);
  const [pairErrorStreak, setPairErrorStreak] = useState<Record<PairId, number>>({
    betKaf: 0,
    daletResh: 0,
    vavZayin: 0,
    finalNunVav: 0,
  });
  const [fallbackRoundsByPair, setFallbackRoundsByPair] = useState<Record<PairId, number>>({
    betKaf: 0,
    daletResh: 0,
    vavZayin: 0,
    finalNunVav: 0,
  });

  const wrongTapTimestampsRef = useRef<number[]>([]);
  const draggedSortCardIdRef = useRef<string | null>(null);
  const completionSentRef = useRef(false);
  const boardFeedbackTimeoutRef = useRef<number | null>(null);
  const statsRef = useRef<SessionStats>({
    roundsCompleted: 0,
    firstTryRounds: 0,
    totalActions: 0,
    hintsPerRound: [],
    pairConfusions: {
      betKaf: 0,
      daletResh: 0,
      vavZayin: 0,
      finalNunVav: 0,
    },
    performance: [],
    transferAttempts: 0,
    transferSuccesses: 0,
  });

  const currentRound = ROUND_SEQUENCE[roundIndex] ?? ROUND_SEQUENCE[0];
  const currentPair = PAIRS[currentRound.pairId];
  const fallbackCountForCurrentPair = fallbackRoundsByPair[currentRound.pairId] ?? 0;
  const isFallbackRound = currentRound.level > 1 && fallbackCountForCurrentPair > 0;
  const effectiveLevel: Level = isFallbackRound ? 1 : currentRound.level;
  const transferMode: TransferMode = currentRound.transferMode ?? 'syllables';
  const isSlowMode = slowModeRoundsRemaining > 0;
  const isInputLocked = Date.now() < inputLockedUntil;

  const setStatusWithAudio = useCallback(
    (key: StatusMessage['key'], tone: Tone, playback: 'interrupt' | 'queued' = 'interrupt') => {
      setStatus({ key, tone });
      const audioPath = keyToAudioPath(key);
      if (playback === 'interrupt') {
        void audio.playNow(audioPath);
        return;
      }
      void audio.play(audioPath);
    },
    [audio],
  );

  const triggerBoardFeedback = useCallback((feedback: Exclude<BoardFeedback, 'idle'>) => {
    setBoardFeedback(feedback);
    if (boardFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(boardFeedbackTimeoutRef.current);
    }

    boardFeedbackTimeoutRef.current = window.setTimeout(() => {
      setBoardFeedback('idle');
      boardFeedbackTimeoutRef.current = null;
    }, 340);
  }, []);

  const transferItemTextKey = useCallback(
    (letterId: LetterId) =>
      `games.confusableLetterContrast.transferItems.${transferMode}.${LETTER_TRANSFER_KEY[letterId]}` as const,
    [transferMode],
  );

  const transferItemAudioPath = useCallback(
    (letterId: LetterId) => keyToAudioPath(transferItemTextKey(letterId)),
    [transferItemTextKey],
  );

  const letterPronunciationAudioPath = useCallback(
    (letterId: LetterId) => keyToAudioPath(LETTER_PRONUNCIATION_KEY[letterId]),
    [],
  );

  const announcePrompt = useCallback(
    async (nextPhase: Phase = phase) => {
      if (nextPhase === 'tap') {
        await audio.playNow(keyToAudioPath('games.confusableLetterContrast.instructions.tapMatch'));
        await audio.playSequence([
          keyToAudioPath('games.confusableLetterContrast.prompts.tapMatch.ready'),
          keyToAudioPath(currentPair.tapPromptKey),
        ]);
        if (isSlowMode) {
          await audio.play(keyToAudioPath('games.confusableLetterContrast.hints.slowFirstSound'));
        }
        return;
      }

      if (nextPhase === 'sort') {
        await audio.playNow(keyToAudioPath('games.confusableLetterContrast.instructions.sortContrast'));
        await audio.playSequence([
          keyToAudioPath('games.confusableLetterContrast.prompts.sortContrast.sortCards'),
          keyToAudioPath('games.confusableLetterContrast.prompts.sortContrast.checkFirstSound'),
        ]);
        if (isSlowMode) {
          await audio.play(keyToAudioPath('games.confusableLetterContrast.hints.slowFirstSound'));
        }
        return;
      }

      if (nextPhase === 'transfer') {
        await audio.playNow(keyToAudioPath('games.confusableLetterContrast.instructions.transferRead'));
        await audio.playSequence([
          keyToAudioPath('games.confusableLetterContrast.prompts.transferRead.readAndTap'),
          keyToAudioPath(currentPair.transferPromptKey),
        ]);
        if (isSlowMode) {
          await audio.play(keyToAudioPath('games.confusableLetterContrast.hints.slowFirstSound'));
        }
      }
    },
    [audio, currentPair.tapPromptKey, currentPair.transferPromptKey, isSlowMode, phase],
  );

  const applyFallbackForPair = useCallback(
    (pairId: PairId) => {
      setFallbackRoundsByPair((previous) => {
        if ((previous[pairId] ?? 0) > 0) {
          return previous;
        }
        return {
          ...previous,
          [pairId]: 1,
        };
      });
      setStatusWithAudio('games.confusableLetterContrast.hints.twoChoicesOnly', 'hint', 'queued');
    },
    [setStatusWithAudio],
  );

  const clearPairErrorStreak = useCallback((pairId: PairId) => {
    setPairErrorStreak((previous) => {
      if (previous[pairId] === 0) {
        return previous;
      }
      return {
        ...previous,
        [pairId]: 0,
      };
    });
  }, []);

  const recordPairError = useCallback(
    (pairId: PairId) => {
      statsRef.current.pairConfusions[pairId] += 1;
      setPairErrorStreak((previous) => {
        const nextValue = (previous[pairId] ?? 0) + 1;
        if (nextValue >= FALLBACK_AFTER_SAME_PAIR_ERRORS) {
          applyFallbackForPair(pairId);
        }

        return {
          ...previous,
          [pairId]: nextValue,
        };
      });
    },
    [applyFallbackForPair],
  );

  const shouldPauseForRandomTap = useCallback(
    (pairId: PairId) => {
      const now = Date.now();
      const recent = wrongTapTimestampsRef.current.filter((timestamp) => now - timestamp <= ANTI_RANDOM_WINDOW_MS);
      recent.push(now);
      wrongTapTimestampsRef.current = recent;

      if (recent.length < ANTI_RANDOM_WRONG_TAP_COUNT) {
        return false;
      }

      const trailing = recent.slice(-ANTI_RANDOM_WRONG_TAP_COUNT);
      const isRapidSequence = trailing[1] - trailing[0] < ANTI_RANDOM_TAP_INTERVAL_MS && trailing[2] - trailing[1] < ANTI_RANDOM_TAP_INTERVAL_MS;
      if (!isRapidSequence) {
        return false;
      }

      wrongTapTimestampsRef.current = [];
      setInputLockedUntil(now + ANTI_RANDOM_PAUSE_MS);
      setStatusWithAudio('games.confusableLetterContrast.feedback.retry.pauseAndModel', 'error', 'interrupt');
      void audio.playSequence([
        keyToAudioPath('games.confusableLetterContrast.hints.solvedExample'),
        keyToAudioPath(PAIRS[pairId].tapPromptKey),
      ]);
      return true;
    },
    [audio, setStatusWithAudio],
  );

  const completeRound = useCallback(
    (successKey: StatusMessage['key']) => {
      setCanContinue(true);
      setPhase('roundDone');
      setStatusWithAudio(successKey, 'success', 'interrupt');
      triggerBoardFeedback('success');
      clearPairErrorStreak(currentRound.pairId);
    },
    [clearPairErrorStreak, currentRound.pairId, setStatusWithAudio, triggerBoardFeedback],
  );

  const initializeLevel2Sort = useCallback(() => {
    const pool = currentRound.sortLetters ?? [currentPair.target, currentPair.confusable, currentPair.target, currentPair.confusable];
    const cards = shuffle(pool).map((letterId, index) => ({
      id: `${currentRound.id}-sort-${index}-${letterId}`,
      letterId,
    }));

    setSortCards(cards);
    setSelectedSortCardId(null);
    setPhase('sort');
    void announcePrompt('sort');
  }, [announcePrompt, currentPair.confusable, currentPair.target, currentRound.id, currentRound.sortLetters]);

  const handleTapChoice = useCallback(
    (choice: LetterId) => {
      if (phase !== 'tap' || isInputLocked) {
        return;
      }

      statsRef.current.totalActions += 1;
      setSelectedTapChoice(choice);
      void audio.playNow(letterPronunciationAudioPath(choice));

      if (choice === currentPair.target) {
        triggerBoardFeedback('success');

        if (effectiveLevel === 2) {
          setStatusWithAudio('games.confusableLetterContrast.feedback.success.accurateChoice', 'success', 'interrupt');
          initializeLevel2Sort();
          return;
        }

        completeRound('games.confusableLetterContrast.feedback.success.accurateChoice');
        return;
      }

      if (shouldPauseForRandomTap(currentRound.pairId)) {
        return;
      }

      setRoundErrorCount((value) => value + 1);
      recordPairError(currentRound.pairId);
      triggerBoardFeedback('miss');
      setStatusWithAudio('games.confusableLetterContrast.feedback.retry.focusFirstSound', 'error', 'interrupt');
    },
    [
      audio,
      completeRound,
      currentPair.target,
      currentRound.pairId,
      effectiveLevel,
      initializeLevel2Sort,
      isInputLocked,
      letterPronunciationAudioPath,
      phase,
      recordPairError,
      setStatusWithAudio,
      shouldPauseForRandomTap,
      triggerBoardFeedback,
    ],
  );

  const placeSortCard = useCallback(
    (cardId: string, bucket: 'target' | 'confusable') => {
      if (phase !== 'sort' || isInputLocked) {
        return;
      }

      const card = sortCards.find((entry) => entry.id === cardId);
      if (!card) {
        return;
      }

      statsRef.current.totalActions += 1;
      const expectedBucket: 'target' | 'confusable' = card.letterId === currentPair.target ? 'target' : 'confusable';
      if (bucket === expectedBucket) {
        triggerBoardFeedback('success');

        const nextCards = sortCards.filter((entry) => entry.id !== cardId);
        setSortCards(nextCards);
        setSelectedSortCardId(null);

        if (nextCards.length === 0) {
          completeRound('games.confusableLetterContrast.feedback.success.greatSorting');
        }
        return;
      }

      if (shouldPauseForRandomTap(currentRound.pairId)) {
        return;
      }

      setRoundErrorCount((value) => value + 1);
      recordPairError(currentRound.pairId);
      triggerBoardFeedback('miss');
      setStatusWithAudio('games.confusableLetterContrast.feedback.retry.gentle', 'error', 'interrupt');
    },
    [
      completeRound,
      currentPair.target,
      currentRound.pairId,
      isInputLocked,
      phase,
      recordPairError,
      setStatusWithAudio,
      shouldPauseForRandomTap,
      sortCards,
      triggerBoardFeedback,
    ],
  );

  const handleDropOnBucket = useCallback(
    (bucket: 'target' | 'confusable') => {
      const draggedCardId = draggedSortCardIdRef.current ?? selectedSortCardId;
      if (!draggedCardId) {
        return;
      }

      draggedSortCardIdRef.current = null;
      placeSortCard(draggedCardId, bucket);
    },
    [placeSortCard, selectedSortCardId],
  );

  const handleTransferChoice = useCallback(
    (choice: LetterId) => {
      if (phase !== 'transfer' || isInputLocked) {
        return;
      }

      statsRef.current.totalActions += 1;
      statsRef.current.transferAttempts += 1;
      void audio.playNow(transferItemAudioPath(choice));

      if (choice === currentPair.target) {
        statsRef.current.transferSuccesses += 1;
        completeRound('games.confusableLetterContrast.feedback.success.transferReadGreat');
        return;
      }

      if (shouldPauseForRandomTap(currentRound.pairId)) {
        return;
      }

      setRoundErrorCount((value) => value + 1);
      recordPairError(currentRound.pairId);
      triggerBoardFeedback('miss');
      setStatusWithAudio('games.confusableLetterContrast.feedback.retry.tryAgainPair', 'error', 'interrupt');
    },
    [
      completeRound,
      currentPair.target,
      currentRound.pairId,
      isInputLocked,
      phase,
      recordPairError,
      setStatusWithAudio,
      shouldPauseForRandomTap,
      transferItemAudioPath,
      triggerBoardFeedback,
    ],
  );

  const handleHint = useCallback(() => {
    if (phase === 'sessionDone') {
      return;
    }

    setRoundHintCount((value) => value + 1);
    const nextHintStep = hintStep + 1;
    setHintStep(nextHintStep);

    if (nextHintStep === 1) {
      setStatusWithAudio('games.confusableLetterContrast.hints.replayTargetSound', 'hint', 'interrupt');
      return;
    }

    if (nextHintStep === 2) {
      setStatusWithAudio('games.confusableLetterContrast.hints.slowFirstSound', 'hint', 'interrupt');
      return;
    }

    if (nextHintStep === 3) {
      setStatusWithAudio('games.confusableLetterContrast.hints.compareShape', 'hint', 'interrupt');
      return;
    }

    applyFallbackForPair(currentRound.pairId);
    setStatusWithAudio('games.confusableLetterContrast.hints.solvedExample', 'hint', 'interrupt');
  }, [applyFallbackForPair, currentRound.pairId, hintStep, phase, setStatusWithAudio]);

  const handleRetry = useCallback(() => {
    if (phase === 'sessionDone') {
      return;
    }

    setSelectedTapChoice(null);
    setSelectedSortCardId(null);

    if (phase === 'sort') {
      initializeLevel2Sort();
    } else if (phase === 'transfer') {
      setStatusWithAudio('games.confusableLetterContrast.feedback.retry.gentle', 'neutral', 'interrupt');
      void announcePrompt('transfer');
    } else {
      setStatusWithAudio('games.confusableLetterContrast.feedback.retry.gentle', 'neutral', 'interrupt');
      void announcePrompt('tap');
    }
  }, [announcePrompt, initializeLevel2Sort, phase, setStatusWithAudio]);

  const handleReplayInstruction = useCallback(() => {
    if (phase === 'sessionDone') {
      void audio.playNow(keyToAudioPath('games.confusableLetterContrast.feedback.success.heardDifference'));
      return;
    }

    void announcePrompt(phase);
  }, [announcePrompt, audio, phase]);

  const handleContinue = useCallback(() => {
    if (!canContinue || phase !== 'roundDone') {
      return;
    }

    const firstTry = roundErrorCount === 0;
    const pairId = currentRound.pairId;

    statsRef.current.roundsCompleted += 1;
    statsRef.current.hintsPerRound.push(roundHintCount);
    statsRef.current.performance.push({
      pairId,
      firstTry,
      hints: roundHintCount,
    });

    if (firstTry) {
      statsRef.current.firstTryRounds += 1;
    }

    const recentWindow = statsRef.current.performance.slice(-MASTERY_WINDOW);
    const recentWindowHints = recentWindow.reduce((sum, entry) => sum + entry.hints, 0);
    if (
      recentWindow.length === MASTERY_WINDOW &&
      recentWindow.filter((entry) => entry.firstTry).length >= MASTERY_FIRST_TRY_THRESHOLD &&
      recentWindowHints <= MASTERY_HINTS_MAX
    ) {
      setMasteredPairs((previous) => {
        const next = new Set(previous);
        next.add(pairId);
        return next;
      });
      setStatusWithAudio('games.confusableLetterContrast.feedback.success.heardDifference', 'success', 'queued');
    }

    if (isFallbackRound) {
      setFallbackRoundsByPair((previous) => ({
        ...previous,
        [pairId]: Math.max((previous[pairId] ?? 0) - 1, 0),
      }));
    }

    setSlowModeRoundsRemaining((previous) => {
      const decremented = previous > 0 ? previous - 1 : 0;
      const shouldEnableSlowMode =
        roundHintCount >= SLOW_MODE_HINT_THRESHOLD || roundErrorCount >= SLOW_MODE_ERROR_THRESHOLD;

      if (shouldEnableSlowMode) {
        return Math.max(decremented, SLOW_MODE_ROUNDS);
      }
      return decremented;
    });

    if (roundIndex >= TOTAL_ROUNDS - 1) {
      setPhase('sessionDone');
      setCanContinue(false);
      setShowCompletionCelebration(true);
      return;
    }

    setRoundIndex((value) => value + 1);
    setCanContinue(false);
  }, [
    canContinue,
    currentRound.pairId,
    isFallbackRound,
    phase,
    roundErrorCount,
    roundHintCount,
    roundIndex,
    setStatusWithAudio,
  ]);

  useEffect(() => {
    setRoundHintCount(0);
    setRoundErrorCount(0);
    setHintStep(0);
    setCanContinue(false);
    setSelectedTapChoice(null);
    setSelectedSortCardId(null);
    setBoardFeedback('idle');

    if (effectiveLevel === 3) {
      setPhase('transfer');
      setTapChoices([]);
      setSortCards([]);
      setTransferChoices(shuffle([currentPair.target, currentPair.confusable]));
      return;
    }

    setPhase('tap');
    setTapChoices(shuffle(effectiveLevel === 1 ? [currentPair.target, currentPair.confusable] : currentRound.choices));
    setTransferChoices([]);
    setSortCards([]);
  }, [currentPair.confusable, currentPair.target, currentRound.choices, effectiveLevel, roundIndex]);

  useEffect(() => {
    if (phase !== 'tap' && phase !== 'sort' && phase !== 'transfer') {
      return;
    }

    void announcePrompt(phase);
  }, [announcePrompt, phase]);

  useEffect(() => {
    if (phase !== 'sessionDone' || completionSentRef.current) {
      return;
    }

    completionSentRef.current = true;

    const completedRounds = statsRef.current.roundsCompleted;
    const firstAttemptSuccessRate =
      completedRounds === 0 ? 0 : Math.round((statsRef.current.firstTryRounds / completedRounds) * 100);

    const totalHints = statsRef.current.hintsPerRound.reduce((sum, value) => sum + value, 0);
    const hintTrend = toHintTrend(statsRef.current.hintsPerRound);
    const transferSuccessRate =
      statsRef.current.transferAttempts === 0
        ? 100
        : Math.round((statsRef.current.transferSuccesses / statsRef.current.transferAttempts) * 100);

    const summaryMetrics: ParentSummaryMetrics = {
      highestStableRange: toStableRange(firstAttemptSuccessRate),
      firstAttemptSuccessRate,
      hintTrend,
    };

    const stars =
      firstAttemptSuccessRate >= 85 && totalHints <= 4
        ? 3
        : firstAttemptSuccessRate >= 65
          ? 2
          : 1;

    const score = Math.max(100, Math.round(firstAttemptSuccessRate * 10 + transferSuccessRate * 3 - totalHints * 4));

    const topConfusionPair = (
      Object.entries(statsRef.current.pairConfusions).sort((left, right) => right[1] - left[1])[0]?.[0] as PairId | undefined
    ) ?? 'betKaf';

    const pairLabel = `${LETTER_SYMBOLS[PAIR_LABEL_KEYS[topConfusionPair][0]]}/${LETTER_SYMBOLS[PAIR_LABEL_KEYS[topConfusionPair][1]]}`;

    onComplete({
      stars,
      score,
      completed: true,
      roundsCompleted: completedRounds,
      summaryMetrics,
      transferSuccessRate,
      topConfusionPair: pairLabel,
    } as GameProps['onComplete'] extends (result: infer TResult) => void ? TResult : never);
  }, [onComplete, phase]);

  useEffect(
    () => () => {
      if (boardFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(boardFeedbackTimeoutRef.current);
      }
    },
    [],
  );

  const masteryBadges = useMemo(() => {
    if (masteredPairs.size === 0) {
      return [] as string[];
    }

    return Array.from(masteredPairs).map((pairId) => {
      const [left, right] = PAIR_LABEL_KEYS[pairId];
      return `${LETTER_SYMBOLS[left]} / ${LETTER_SYMBOLS[right]}`;
    });
  }, [masteredPairs]);

  const progressIndex = phase === 'sessionDone' ? TOTAL_ROUNDS : roundIndex + 1;

  const controlButtons = (
    <div className="confusable-contrast__control-row">
      <Button
        variant="secondary"
        size="md"
        onClick={handleReplayInstruction}
        aria-label={t('games.confusableLetterContrast.instructions.tapReplay')}
        title={t('games.confusableLetterContrast.instructions.tapReplay')}
        style={{ minInlineSize: '48px', paddingInline: 'var(--space-sm)' }}
      >
        <span aria-hidden="true">▶</span>
      </Button>

      <Button
        variant="secondary"
        size="md"
        onClick={handleRetry}
        aria-label={t('games.confusableLetterContrast.instructions.tapRetry')}
        title={t('games.confusableLetterContrast.instructions.tapRetry')}
        style={{ minInlineSize: '48px', paddingInline: 'var(--space-sm)' }}
      >
        <span aria-hidden="true">↻</span>
      </Button>

      <Button
        variant="secondary"
        size="md"
        onClick={handleHint}
        aria-label={t('games.confusableLetterContrast.instructions.tapHint')}
        title={t('games.confusableLetterContrast.instructions.tapHint')}
        style={{ minInlineSize: '48px', paddingInline: 'var(--space-sm)' }}
      >
        <span aria-hidden="true">💡</span>
      </Button>

      <Button
        variant="primary"
        size="md"
        onClick={handleContinue}
        disabled={!canContinue}
        aria-label={t('games.confusableLetterContrast.instructions.tapNext')}
        title={t('games.confusableLetterContrast.instructions.tapNext')}
        style={{ minInlineSize: '48px', paddingInline: 'var(--space-sm)' }}
      >
        <span aria-hidden="true">→</span>
      </Button>
    </div>
  );

  return (
    <Card
      className="confusable-contrast"
      padding="md"
      style={{
        display: 'grid',
        gap: 'var(--space-md)',
        background:
          'radial-gradient(circle at 12% 12%, color-mix(in srgb, var(--color-theme-secondary) 24%, transparent), transparent 42%), linear-gradient(180deg, var(--color-bg-card) 0%, color-mix(in srgb, var(--color-theme-bg) 82%, white 18%) 100%)',
      }}
    >
      <header className="confusable-contrast__header">
        <div className="confusable-contrast__heading">
          <h2 className="confusable-contrast__title">{t('games.confusableLetterContrast.title')}</h2>
          <p className="confusable-contrast__subtitle">{t('games.confusableLetterContrast.subtitle')}</p>
        </div>
        {controlButtons}
      </header>

      <div className="confusable-contrast__progress" aria-hidden="true">
        {Array.from({ length: TOTAL_ROUNDS }, (_, index) => (
          <span
            key={`confusable-progress-${index + 1}`}
            className={[
              'confusable-contrast__progress-dot',
              index < roundIndex ? 'confusable-contrast__progress-dot--done' : '',
              index === roundIndex && phase !== 'sessionDone' ? 'confusable-contrast__progress-dot--active' : '',
            ].join(' ')}
          />
        ))}
      </div>

      <div className="confusable-contrast__score-strip" aria-hidden="true">
        <span className="confusable-contrast__score-pill">
          <span>🎯</span>
          <span>
            {progressIndex}/{TOTAL_ROUNDS}
          </span>
        </span>
        <span className="confusable-contrast__score-pill">
          <span>💡</span>
          <span>{roundHintCount}</span>
        </span>
        {isSlowMode && <span className="confusable-contrast__score-pill">🐢</span>}
      </div>

      <Card
        className={[
          'confusable-contrast__board',
          boardFeedback === 'success' ? 'confusable-contrast__board--success' : '',
          boardFeedback === 'miss' ? 'confusable-contrast__board--miss' : '',
        ].join(' ')}
        padding="md"
      >
        <div className="confusable-contrast__status-row">
          <MascotIllustration variant={phase === 'sessionDone' ? 'success' : 'hero'} size={72} />

          <div className="confusable-contrast__status-text-wrap">
            <div className="confusable-contrast__instruction-row">
              <p className="confusable-contrast__status-text" dir="rtl">
                {toneIcon(status.tone)} {tx(status.key)}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReplayInstruction}
                aria-label={t('games.confusableLetterContrast.instructions.tapReplay')}
                title={t('games.confusableLetterContrast.instructions.tapReplay')}
                style={{ minInlineSize: '48px', minBlockSize: '48px', paddingInline: 'var(--space-xs)' }}
              >
                <span aria-hidden="true">▶</span>
              </Button>
            </div>
            {isInputLocked && (
              <p className="confusable-contrast__status-note">{t('games.confusableLetterContrast.feedback.retry.pauseAndModel')}</p>
            )}
            {isFallbackRound && (
              <p className="confusable-contrast__status-note">{t('games.confusableLetterContrast.hints.twoChoicesOnly')}</p>
            )}
          </div>
        </div>

        {phase === 'tap' && (
          <section className="confusable-contrast__tap-stage" dir="rtl">
            <p className="confusable-contrast__stage-title">{t('games.confusableLetterContrast.instructions.tapMatch')}</p>
            <div className="confusable-contrast__option-grid">
              {tapChoices.map((choice) => {
                const isSelected = selectedTapChoice === choice;
                return (
                  <button
                    key={`${currentRound.id}-tap-${choice}`}
                    type="button"
                    className={[
                      'confusable-contrast__letter-option',
                      isSelected ? 'confusable-contrast__letter-option--selected' : '',
                    ].join(' ')}
                    onClick={() => handleTapChoice(choice)}
                    aria-label={tx(LETTER_PRONUNCIATION_KEY[choice])}
                    disabled={isInputLocked}
                  >
                    <span className="confusable-contrast__letter-symbol" aria-hidden="true">
                      {LETTER_SYMBOLS[choice]}
                    </span>
                    <span className="confusable-contrast__letter-name">{tx(LETTER_PRONUNCIATION_KEY[choice])}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {phase === 'sort' && (
          <section className="confusable-contrast__sort-stage" dir="rtl">
            <p className="confusable-contrast__stage-title">{t('games.confusableLetterContrast.instructions.sortContrast')}</p>

            <div className="confusable-contrast__bucket-grid">
              <button
                type="button"
                className="confusable-contrast__bucket"
                onClick={() => handleDropOnBucket('target')}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDropOnBucket('target');
                }}
                aria-label={t('games.confusableLetterContrast.prompts.sortContrast.targetBucket')}
                disabled={isInputLocked}
              >
                <strong>{t('games.confusableLetterContrast.prompts.sortContrast.targetBucket')}</strong>
                <span>
                  {LETTER_SYMBOLS[currentPair.target]} · {tx(LETTER_PRONUNCIATION_KEY[currentPair.target])}
                </span>
              </button>

              <button
                type="button"
                className="confusable-contrast__bucket"
                onClick={() => handleDropOnBucket('confusable')}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDropOnBucket('confusable');
                }}
                aria-label={t('games.confusableLetterContrast.prompts.sortContrast.confusableBucket')}
                disabled={isInputLocked}
              >
                <strong>{t('games.confusableLetterContrast.prompts.sortContrast.confusableBucket')}</strong>
                <span>
                  {LETTER_SYMBOLS[currentPair.confusable]} · {tx(LETTER_PRONUNCIATION_KEY[currentPair.confusable])}
                </span>
              </button>
            </div>

            <div className="confusable-contrast__sort-cards">
              {sortCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={[
                    'confusable-contrast__sort-card',
                    selectedSortCardId === card.id ? 'confusable-contrast__sort-card--selected' : '',
                  ].join(' ')}
                  draggable
                  onDragStart={() => {
                    draggedSortCardIdRef.current = card.id;
                  }}
                  onDragEnd={() => {
                    draggedSortCardIdRef.current = null;
                  }}
                  onClick={() => {
                    setSelectedSortCardId((current) => (current === card.id ? null : card.id));
                    void audio.playNow(letterPronunciationAudioPath(card.letterId));
                  }}
                  aria-label={tx(LETTER_PRONUNCIATION_KEY[card.letterId])}
                  disabled={isInputLocked}
                >
                  <span className="confusable-contrast__letter-symbol" aria-hidden="true">
                    {LETTER_SYMBOLS[card.letterId]}
                  </span>
                  <span className="confusable-contrast__letter-name">{tx(LETTER_PRONUNCIATION_KEY[card.letterId])}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {phase === 'transfer' && (
          <section className="confusable-contrast__transfer-stage" dir="rtl">
            <p className="confusable-contrast__stage-title">{t('games.confusableLetterContrast.instructions.transferRead')}</p>
            <div className="confusable-contrast__transfer-options">
              {transferChoices.map((choice) => (
                <button
                  key={`${currentRound.id}-transfer-${choice}`}
                  type="button"
                  className="confusable-contrast__transfer-option"
                  onClick={() => handleTransferChoice(choice)}
                  aria-label={tx(transferItemTextKey(choice))}
                  disabled={isInputLocked}
                >
                  <span>{tx(transferItemTextKey(choice))}</span>
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => void audio.playNow(transferItemAudioPath(currentPair.target))}
              aria-label={t('games.confusableLetterContrast.instructions.tapReplay')}
              style={{ minInlineSize: '56px', justifySelf: 'center' }}
            >
              <span aria-hidden="true">▶</span>
              <span style={visuallyHiddenStyle}>{t('games.confusableLetterContrast.instructions.tapReplay')}</span>
            </Button>
          </section>
        )}

        {phase === 'sessionDone' && (
          <section className="confusable-contrast__completion" dir="rtl">
            {showCompletionCelebration && <SuccessCelebration dense />}
            <p className="confusable-contrast__completion-title">{t('feedback.youDidIt')}</p>
            <p className="confusable-contrast__completion-line">{t('games.confusableLetterContrast.feedback.success.heardDifference')}</p>
            <p className="confusable-contrast__completion-line">{t('parentDashboard.games.confusableLetterContrast.nextStep')}</p>
            {masteryBadges.length > 0 && (
              <p className="confusable-contrast__completion-line">
                {masteryBadges.join(' • ')}
              </p>
            )}
          </section>
        )}
      </Card>

      <style>{`
        .confusable-contrast__header {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: var(--space-sm);
          align-items: center;
        }

        .confusable-contrast__heading {
          display: grid;
          gap: var(--space-2xs);
        }

        .confusable-contrast__title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-xl);
        }

        .confusable-contrast__subtitle {
          margin: 0;
          color: var(--color-text-secondary);
        }

        .confusable-contrast__control-row {
          display: flex;
          gap: var(--space-xs);
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .confusable-contrast__progress {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 1fr;
          gap: var(--space-xs);
        }

        .confusable-contrast__progress-dot {
          block-size: 10px;
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-border) 70%, transparent);
        }

        .confusable-contrast__progress-dot--done {
          background: var(--color-accent-success);
        }

        .confusable-contrast__progress-dot--active {
          background: var(--color-accent-primary);
          animation: confusable-progress-active 1s ease-in-out infinite;
        }

        .confusable-contrast__score-strip {
          display: inline-flex;
          gap: var(--space-xs);
          flex-wrap: wrap;
          align-items: center;
        }

        .confusable-contrast__score-pill {
          min-height: 48px;
          border-radius: var(--radius-full);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 34%, transparent);
          background: color-mix(in srgb, var(--color-accent-primary) 12%, transparent);
          padding-inline: var(--space-sm);
          display: inline-flex;
          align-items: center;
          gap: var(--space-2xs);
          color: var(--color-text-primary);
          font-weight: var(--font-weight-semibold);
        }

        .confusable-contrast__board {
          display: grid;
          gap: var(--space-sm);
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 24%, transparent);
          transition: border-color 220ms ease, transform 220ms ease;
        }

        .confusable-contrast__board--success {
          border-color: color-mix(in srgb, var(--color-accent-success) 68%, transparent);
          transform: translateY(-2px);
        }

        .confusable-contrast__board--miss {
          border-color: color-mix(in srgb, var(--color-accent-warning) 70%, transparent);
        }

        .confusable-contrast__status-row {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: var(--space-sm);
          align-items: center;
        }

        .confusable-contrast__status-text-wrap {
          display: grid;
          gap: var(--space-2xs);
        }

        .confusable-contrast__instruction-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-xs);
        }

        .confusable-contrast__status-text {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-base);
        }

        .confusable-contrast__status-note {
          margin: 0;
          color: var(--color-accent-info);
          font-size: var(--font-size-sm);
        }

        .confusable-contrast__tap-stage,
        .confusable-contrast__sort-stage,
        .confusable-contrast__transfer-stage,
        .confusable-contrast__completion {
          display: grid;
          gap: var(--space-sm);
        }

        .confusable-contrast__stage-title {
          margin: 0;
          color: var(--color-text-secondary);
          text-align: center;
          font-weight: var(--font-weight-semibold);
        }

        .confusable-contrast__option-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
          gap: var(--space-sm);
        }

        .confusable-contrast__letter-option,
        .confusable-contrast__sort-card,
        .confusable-contrast__transfer-option {
          min-height: 64px;
          border-radius: var(--radius-lg);
          border: 2px solid var(--color-border-subtle);
          background: var(--color-bg-surface);
          color: var(--color-text-primary);
          padding: var(--space-sm);
          cursor: pointer;
          display: grid;
          place-items: center;
          gap: var(--space-2xs);
          transition: transform 180ms ease, border-color 180ms ease;
        }

        .confusable-contrast__letter-option:active,
        .confusable-contrast__sort-card:active,
        .confusable-contrast__transfer-option:active {
          transform: scale(0.98);
        }

        .confusable-contrast__letter-option--selected,
        .confusable-contrast__sort-card--selected {
          border-color: var(--color-accent-primary);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent-primary) 24%, transparent);
        }

        .confusable-contrast__letter-symbol {
          font-size: clamp(1.85rem, 4vw, 2.5rem);
          font-weight: var(--font-weight-extrabold);
        }

        .confusable-contrast__letter-name {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .confusable-contrast__bucket-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: var(--space-sm);
        }

        .confusable-contrast__bucket {
          min-height: 118px;
          border-radius: var(--radius-lg);
          border: 2px dashed color-mix(in srgb, var(--color-theme-primary) 36%, transparent);
          background: color-mix(in srgb, var(--color-theme-primary) 10%, var(--color-bg-surface));
          color: var(--color-text-primary);
          display: grid;
          gap: var(--space-2xs);
          place-items: center;
          text-align: center;
          padding: var(--space-sm);
          cursor: pointer;
        }

        .confusable-contrast__sort-cards,
        .confusable-contrast__transfer-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: var(--space-sm);
        }

        .confusable-contrast__completion {
          justify-items: center;
          text-align: center;
        }

        .confusable-contrast__completion-title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-extrabold);
        }

        .confusable-contrast__completion-line {
          margin: 0;
          color: var(--color-text-secondary);
        }

        @keyframes confusable-progress-active {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.14);
          }
        }

        @media (max-width: 720px) {
          .confusable-contrast__header {
            grid-template-columns: 1fr;
          }

          .confusable-contrast__control-row {
            justify-content: flex-start;
          }

          .confusable-contrast__instruction-row {
            align-items: flex-start;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .confusable-contrast__progress-dot--active,
          .confusable-contrast__board,
          .confusable-contrast__letter-option,
          .confusable-contrast__sort-card,
          .confusable-contrast__transfer-option {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </Card>
  );
}
