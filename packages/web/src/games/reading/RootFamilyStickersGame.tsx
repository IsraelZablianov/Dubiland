import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';

type Stage = 'sorting' | 'building' | 'phraseRead' | 'complete';
type StatusTone = 'neutral' | 'hint' | 'success' | 'error';
type BoardFeedback = 'idle' | 'success' | 'miss';
type RootId = 'ktv' | 'lmd' | 'kra' | 'smr';
type WordId =
  | 'katav'
  | 'kotev'
  | 'mikhtav'
  | 'lamad'
  | 'lomed'
  | 'limud'
  | 'kara'
  | 'kore'
  | 'mikra'
  | 'shamar'
  | 'shomer'
  | 'mishmeret'
  | 'hatik'
  | 'dubi';
type PhraseTargetId = 'dubiKotev' | 'hayeledLomed' | 'hayaldaKoreet' | 'aniShomerAlHatik';
type HintTrend = ParentSummaryMetrics['hintTrend'];

interface RootFamilyDefinition {
  id: RootId;
  key: `roots.common.${RootId}`;
  anchorWords: [WordId, WordId];
  icon: string;
  hue: string;
}

interface SortCard {
  id: string;
  wordId: WordId;
  expectedRootId: RootId | null;
  isDecoy: boolean;
}

interface SortingRoundDefinition {
  id: string;
  roots: [RootId, RootId];
  cards: SortCard[];
  promptKey:
    | 'games.rootFamilyStickers.prompts.sorting.matchFamily'
    | 'games.rootFamilyStickers.prompts.sorting.textFirst'
    | 'games.rootFamilyStickers.prompts.sorting.oneDecoy';
  showRootHighlight: boolean;
}

interface BuildRoundDefinition {
  id: string;
  rootId: RootId;
  targetWordId: WordId;
  options: [WordId, WordId, WordId];
  instructionKey:
    | 'games.rootFamilyStickers.prompts.building.chooseAffix'
    | 'games.rootFamilyStickers.prompts.building.prefixThenRoot'
    | 'games.rootFamilyStickers.prompts.building.suffixThenRoot';
}

interface PhraseRoundDefinition {
  id: string;
  target: PhraseTargetId;
}

interface StatusMessage {
  key:
    | 'games.rootFamilyStickers.instructions.intro'
    | 'games.rootFamilyStickers.instructions.dragToBasket'
    | 'games.rootFamilyStickers.instructions.buildWord'
    | 'games.rootFamilyStickers.instructions.readPhrase'
    | 'games.rootFamilyStickers.instructions.slowMode'
    | 'games.rootFamilyStickers.hints.listenForRepeatedSound'
    | 'games.rootFamilyStickers.hints.highlightRootLetters'
    | 'games.rootFamilyStickers.hints.solvedExample'
    | 'games.rootFamilyStickers.hints.affixIsExtra'
    | 'games.rootFamilyStickers.hints.slowModeCue'
    | 'games.rootFamilyStickers.hints.gentleRetry'
    | 'games.rootFamilyStickers.feedback.retry.gentle'
    | 'games.rootFamilyStickers.feedback.retry.pauseAndModel'
    | 'games.rootFamilyStickers.feedback.retry.backToFocus'
    | 'games.rootFamilyStickers.feedback.success.wellDone'
    | 'games.rootFamilyStickers.feedback.success.sameRoot'
    | 'games.rootFamilyStickers.feedback.success.familySticker'
    | 'games.rootFamilyStickers.feedback.encouragement.keepTrying'
    | 'games.rootFamilyStickers.feedback.encouragement.almostThere'
    | 'games.rootFamilyStickers.feedback.encouragement.tryAgain'
    | 'games.rootFamilyStickers.strategyPraise.acceptedHintThenCorrect'
    | 'games.rootFamilyStickers.strategyPraise.usedReplayThenCorrect'
    | 'games.rootFamilyStickers.strategyPraise.carefulDecoding'
    | 'games.rootFamilyStickers.strategyPraise.stayedCalmAfterMistake'
    | 'games.rootFamilyStickers.prompts.phraseRead.finalRead';
  tone: StatusTone;
}

interface SessionStats {
  totalActions: number;
  firstAttemptSuccesses: number;
  hintUsageByCheckpoint: number[];
  completedCheckpoints: number;
  rootConfusions: Record<string, number>;
  recentSortingOutcomes: boolean[];
}

const ROOTS: Record<RootId, RootFamilyDefinition> = {
  ktv: {
    id: 'ktv',
    key: 'roots.common.ktv',
    anchorWords: ['katav', 'kotev'],
    icon: '✍️',
    hue: '#f97316',
  },
  lmd: {
    id: 'lmd',
    key: 'roots.common.lmd',
    anchorWords: ['lamad', 'lomed'],
    icon: '📚',
    hue: '#14b8a6',
  },
  kra: {
    id: 'kra',
    key: 'roots.common.kra',
    anchorWords: ['kara', 'kore'],
    icon: '📖',
    hue: '#3b82f6',
  },
  smr: {
    id: 'smr',
    key: 'roots.common.smr',
    anchorWords: ['shamar', 'shomer'],
    icon: '🛡️',
    hue: '#22c55e',
  },
};

const SORTING_ROUNDS: SortingRoundDefinition[] = [
  {
    id: 'discovery',
    roots: ['ktv', 'lmd'],
    promptKey: 'games.rootFamilyStickers.prompts.sorting.matchFamily',
    showRootHighlight: true,
    cards: [
      { id: 'r1-katav', wordId: 'katav', expectedRootId: 'ktv', isDecoy: false },
      { id: 'r1-kotev', wordId: 'kotev', expectedRootId: 'ktv', isDecoy: false },
      { id: 'r1-lamad', wordId: 'lamad', expectedRootId: 'lmd', isDecoy: false },
      { id: 'r1-lomed', wordId: 'lomed', expectedRootId: 'lmd', isDecoy: false },
    ],
  },
  {
    id: 'familySorting',
    roots: ['ktv', 'lmd'],
    promptKey: 'games.rootFamilyStickers.prompts.sorting.textFirst',
    showRootHighlight: false,
    cards: [
      { id: 'r2-katav', wordId: 'katav', expectedRootId: 'ktv', isDecoy: false },
      { id: 'r2-mikhtav', wordId: 'mikhtav', expectedRootId: 'ktv', isDecoy: false },
      { id: 'r2-kotev', wordId: 'kotev', expectedRootId: 'ktv', isDecoy: false },
      { id: 'r2-lamad', wordId: 'lamad', expectedRootId: 'lmd', isDecoy: false },
      { id: 'r2-lomed', wordId: 'lomed', expectedRootId: 'lmd', isDecoy: false },
      { id: 'r2-limud', wordId: 'limud', expectedRootId: 'lmd', isDecoy: false },
    ],
  },
  {
    id: 'decoyCap',
    roots: ['kra', 'smr'],
    promptKey: 'games.rootFamilyStickers.prompts.sorting.oneDecoy',
    showRootHighlight: false,
    cards: [
      { id: 'r3-kara', wordId: 'kara', expectedRootId: 'kra', isDecoy: false },
      { id: 'r3-kore', wordId: 'kore', expectedRootId: 'kra', isDecoy: false },
      { id: 'r3-mikra', wordId: 'mikra', expectedRootId: 'kra', isDecoy: false },
      { id: 'r3-shamar', wordId: 'shamar', expectedRootId: 'smr', isDecoy: false },
      { id: 'r3-shomer', wordId: 'shomer', expectedRootId: 'smr', isDecoy: false },
      { id: 'r3-mishmeret', wordId: 'mishmeret', expectedRootId: 'smr', isDecoy: false },
      { id: 'r3-hatik-decoy', wordId: 'hatik', expectedRootId: null, isDecoy: true },
    ],
  },
];

const BUILD_ROUNDS: BuildRoundDefinition[] = [
  {
    id: 'build-ktv',
    rootId: 'ktv',
    targetWordId: 'mikhtav',
    options: ['mikhtav', 'limud', 'mikra'],
    instructionKey: 'games.rootFamilyStickers.prompts.building.prefixThenRoot',
  },
  {
    id: 'build-smr',
    rootId: 'smr',
    targetWordId: 'mishmeret',
    options: ['mishmeret', 'kore', 'kotev'],
    instructionKey: 'games.rootFamilyStickers.prompts.building.suffixThenRoot',
  },
];

const PHRASE_ROUNDS: PhraseRoundDefinition[] = [
  { id: 'phrase-kotev', target: 'dubiKotev' },
  { id: 'phrase-shomer', target: 'aniShomerAlHatik' },
];

const PHRASE_KEY_BY_ID: Record<
  PhraseTargetId,
  `games.rootFamilyStickers.prompts.phraseRead.targets.${PhraseTargetId}`
> = {
  dubiKotev: 'games.rootFamilyStickers.prompts.phraseRead.targets.dubiKotev',
  hayeledLomed: 'games.rootFamilyStickers.prompts.phraseRead.targets.hayeledLomed',
  hayaldaKoreet: 'games.rootFamilyStickers.prompts.phraseRead.targets.hayaldaKoreet',
  aniShomerAlHatik: 'games.rootFamilyStickers.prompts.phraseRead.targets.aniShomerAlHatik',
};

const SORTING_SUCCESS_MESSAGES: Array<
  | 'games.rootFamilyStickers.feedback.success.wellDone'
  | 'games.rootFamilyStickers.feedback.success.sameRoot'
> = ['games.rootFamilyStickers.feedback.success.wellDone', 'games.rootFamilyStickers.feedback.success.sameRoot'];

const TOTAL_CHECKPOINTS = SORTING_ROUNDS.length + BUILD_ROUNDS.length + PHRASE_ROUNDS.length;

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

function phraseAudioPath(target: PhraseTargetId): string {
  return keyToAudioPath(PHRASE_KEY_BY_ID[target]);
}

function wordAudioPath(word: WordId): string {
  return `/audio/he/words/pronunciation/${toKebabCase(word)}.mp3`;
}

function rootAudioPath(root: RootId): string {
  return `/audio/he/roots/common/${toKebabCase(root)}.mp3`;
}

function shuffle<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function getHintTrend(hintUsageByCheckpoint: number[]): HintTrend {
  if (hintUsageByCheckpoint.length === 0) {
    return 'steady';
  }

  const midpoint = Math.ceil(hintUsageByCheckpoint.length / 2);
  const firstHalf = hintUsageByCheckpoint.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
  const secondHalf = hintUsageByCheckpoint.slice(midpoint).reduce((sum, value) => sum + value, 0);

  if (secondHalf < firstHalf) return 'improving';
  if (secondHalf === firstHalf) return 'steady';
  return 'needs_support';
}

function toStableRange(firstAttemptSuccessRate: number): StableRange {
  if (firstAttemptSuccessRate >= 85) return '1-10';
  if (firstAttemptSuccessRate >= 65) return '1-5';
  return '1-3';
}

function toneIcon(tone: StatusTone): string {
  if (tone === 'success') return '✅';
  if (tone === 'hint') return '💡';
  if (tone === 'error') return '🔁';
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

export function RootFamilyStickersGame({ onComplete, audio }: GameProps) {
  const { t } = useTranslation('common');

  const [stage, setStage] = useState<Stage>('sorting');
  const [status, setStatus] = useState<StatusMessage>({
    key: 'games.rootFamilyStickers.instructions.intro',
    tone: 'neutral',
  });
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [sortingRoundIndex, setSortingRoundIndex] = useState(0);
  const [sortingCards, setSortingCards] = useState<SortCard[]>(() => shuffle(SORTING_ROUNDS[0].cards));
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showRootHighlight, setShowRootHighlight] = useState(SORTING_ROUNDS[0].showRootHighlight);

  const [buildRoundIndex, setBuildRoundIndex] = useState(0);
  const [buildErrors, setBuildErrors] = useState(0);
  const [buildSolved, setBuildSolved] = useState(false);

  const [phraseRoundIndex, setPhraseRoundIndex] = useState(0);
  const [phraseCompleted, setPhraseCompleted] = useState(false);

  const [checkpointHints, setCheckpointHints] = useState(0);
  const [hintStep, setHintStep] = useState(0);
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const [boardFeedback, setBoardFeedback] = useState<BoardFeedback>('idle');
  const [scorePulse, setScorePulse] = useState(false);

  const currentSortingRound = SORTING_ROUNDS[sortingRoundIndex] ?? SORTING_ROUNDS[0];
  const currentBuildRound = BUILD_ROUNDS[buildRoundIndex] ?? BUILD_ROUNDS[0];
  const currentPhraseRound = PHRASE_ROUNDS[phraseRoundIndex] ?? PHRASE_ROUNDS[0];

  const dragCardIdRef = useRef<string | null>(null);
  const cardErrorsRef = useRef<Record<string, number>>({});
  const completionSentRef = useRef(false);
  const scorePulseTimeoutRef = useRef<number | null>(null);
  const boardFeedbackTimeoutRef = useRef<number | null>(null);
  const statsRef = useRef<SessionStats>({
    totalActions: 0,
    firstAttemptSuccesses: 0,
    hintUsageByCheckpoint: [],
    completedCheckpoints: 0,
    rootConfusions: {},
    recentSortingOutcomes: [],
  });

  const canAdvance =
    (stage === 'sorting' && sortingCards.length === 0) ||
    (stage === 'building' && buildSolved) ||
    (stage === 'phraseRead' && phraseCompleted);

  const checkpointIndex =
    stage === 'sorting'
      ? sortingRoundIndex
      : stage === 'building'
        ? SORTING_ROUNDS.length + buildRoundIndex
        : stage === 'phraseRead'
          ? SORTING_ROUNDS.length + BUILD_ROUNDS.length + phraseRoundIndex
          : TOTAL_CHECKPOINTS;

  const progressDisplayStep = stage === 'complete' ? TOTAL_CHECKPOINTS : checkpointIndex + 1;

  const updateStatus = useCallback(
    (message: StatusMessage, playMode: 'queued' | 'interrupt' = 'interrupt') => {
      setStatus(message);
      const audioPath = keyToAudioPath(message.key);
      if (playMode === 'interrupt') {
        void audio.playNow(audioPath);
        return;
      }
      void audio.play(audioPath);
    },
    [audio],
  );

  const triggerScorePulse = useCallback(() => {
    setScorePulse(true);
    if (scorePulseTimeoutRef.current !== null) {
      window.clearTimeout(scorePulseTimeoutRef.current);
    }
    scorePulseTimeoutRef.current = window.setTimeout(() => {
      setScorePulse(false);
      scorePulseTimeoutRef.current = null;
    }, 420);
  }, []);

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

  const pushCheckpointHints = useCallback(() => {
    statsRef.current.hintUsageByCheckpoint.push(checkpointHints);
    statsRef.current.completedCheckpoints += 1;
    setCheckpointHints(0);
    setHintStep(0);
  }, [checkpointHints]);

  const countSortingOutcome = useCallback((isCorrect: boolean) => {
    const history = statsRef.current.recentSortingOutcomes;
    history.push(isCorrect);
    if (history.length > 5) {
      history.shift();
    }

    const recentErrors = history.filter((item) => !item).length;
    if (recentErrors >= 3 && history.length >= 5 && !isSlowMode) {
      setIsSlowMode(true);
      updateStatus(
        {
          key: 'games.rootFamilyStickers.instructions.slowMode',
          tone: 'hint',
        },
        'interrupt',
      );
    }
  }, [isSlowMode, updateStatus]);

  const announceSortingRound = useCallback(async () => {
    const [rootOne, rootTwo] = currentSortingRound.roots;
    const [anchorOne, anchorTwo] = ROOTS[rootOne].anchorWords;

    await audio.playNow(keyToAudioPath('games.rootFamilyStickers.instructions.dragToBasket'));
    await audio.playSequence([
      keyToAudioPath('games.rootFamilyStickers.prompts.rootIntro.listenForPattern'),
      rootAudioPath(rootOne),
      wordAudioPath(anchorOne),
      rootAudioPath(rootTwo),
      wordAudioPath(anchorTwo),
      keyToAudioPath(currentSortingRound.promptKey),
    ]);
  }, [audio, currentSortingRound]);

  const announceBuildRound = useCallback(async () => {
    await audio.playNow(keyToAudioPath('games.rootFamilyStickers.instructions.buildWord'));
    await audio.playSequence([
      keyToAudioPath('games.rootFamilyStickers.prompts.building.chooseAffix'),
      rootAudioPath(currentBuildRound.rootId),
      keyToAudioPath(currentBuildRound.instructionKey),
    ]);
  }, [audio, currentBuildRound]);

  const announcePhraseRound = useCallback(async () => {
    await audio.playNow(keyToAudioPath('games.rootFamilyStickers.instructions.readPhrase'));
    await audio.playSequence([
      keyToAudioPath('games.rootFamilyStickers.prompts.phraseRead.pointAndRead'),
      phraseAudioPath(currentPhraseRound.target),
    ]);
  }, [audio, currentPhraseRound]);

  const resetSortingRound = useCallback(
    (roundIndex: number) => {
      const round = SORTING_ROUNDS[roundIndex] ?? SORTING_ROUNDS[0];
      cardErrorsRef.current = {};
      setSortingCards(shuffle(round.cards));
      setSelectedCardId(null);
      setShowRootHighlight(round.showRootHighlight);
      setHintStep(0);
      setCheckpointHints(0);
    },
    [],
  );

  const handleHint = useCallback(async () => {
    setCheckpointHints((value) => value + 1);
    setHintStep((value) => value + 1);

    if (stage === 'sorting') {
      if (hintStep === 0) {
        updateStatus(
          {
            key: 'games.rootFamilyStickers.hints.listenForRepeatedSound',
            tone: 'hint',
          },
          'interrupt',
        );
        return;
      }

      if (hintStep === 1) {
        setShowRootHighlight(true);
        updateStatus(
          {
            key: 'games.rootFamilyStickers.hints.highlightRootLetters',
            tone: 'hint',
          },
          'interrupt',
        );
        return;
      }

      const modeledCard = sortingCards.find((card) => !card.isDecoy);
      if (modeledCard) {
        await audio.playNow(keyToAudioPath('games.rootFamilyStickers.hints.solvedExample'));
        setSortingCards((cards) => cards.filter((card) => card.id !== modeledCard.id));
      }
      setSelectedCardId(null);
      return;
    }

    if (stage === 'building') {
      updateStatus(
        {
          key: 'games.rootFamilyStickers.hints.affixIsExtra',
          tone: 'hint',
        },
        'interrupt',
      );
      return;
    }

    updateStatus(
      {
        key: 'games.rootFamilyStickers.prompts.phraseRead.finalRead',
        tone: 'hint',
      },
      'interrupt',
    );
  }, [audio, hintStep, sortingCards, stage, updateStatus]);

  const handleRetry = useCallback(() => {
    updateStatus(
      {
        key: 'games.rootFamilyStickers.feedback.encouragement.tryAgain',
        tone: 'neutral',
      },
      'interrupt',
    );

    if (stage === 'sorting') {
      resetSortingRound(sortingRoundIndex);
      return;
    }

    if (stage === 'building') {
      setBuildSolved(false);
      setBuildErrors(0);
      setHintStep(0);
      setCheckpointHints(0);
      return;
    }

    if (stage === 'phraseRead') {
      setPhraseCompleted(false);
      setHintStep(0);
      setCheckpointHints(0);
    }
  }, [resetSortingRound, sortingRoundIndex, stage, updateStatus]);

  const handleReplayInstruction = useCallback(() => {
    if (stage === 'sorting') {
      void announceSortingRound();
      return;
    }

    if (stage === 'building') {
      void announceBuildRound();
      return;
    }

    if (stage === 'phraseRead') {
      void announcePhraseRound();
      return;
    }

    void audio.playNow(keyToAudioPath('games.rootFamilyStickers.feedback.success.familySticker'));
  }, [announceBuildRound, announcePhraseRound, announceSortingRound, audio, stage]);

  const handlePlaceCard = useCallback(
    (cardId: string, rootId: RootId) => {
      if (stage !== 'sorting') return;

      const card = sortingCards.find((item) => item.id === cardId);
      if (!card) return;

      if (isSlowMode) {
        void audio.playNow(wordAudioPath(card.wordId));
      }

      statsRef.current.totalActions += 1;

      if (card.expectedRootId === rootId && !card.isDecoy) {
        const mistakesForCard = cardErrorsRef.current[card.id] ?? 0;
        if (mistakesForCard === 0) {
          statsRef.current.firstAttemptSuccesses += 1;
          triggerScorePulse();
        }

        const successMessage =
          checkpointHints > 0
            ? 'games.rootFamilyStickers.strategyPraise.acceptedHintThenCorrect'
            : SORTING_SUCCESS_MESSAGES[statsRef.current.completedCheckpoints % SORTING_SUCCESS_MESSAGES.length];

        updateStatus(
          {
            key: successMessage,
            tone: 'success',
          },
          'interrupt',
        );
        triggerBoardFeedback('success');

        countSortingOutcome(true);
        setSortingCards((items) => items.filter((item) => item.id !== card.id));
        setSelectedCardId(null);
        return;
      }

      countSortingOutcome(false);
      triggerBoardFeedback('miss');

      if (card.isDecoy) {
        updateStatus(
          {
            key: 'games.rootFamilyStickers.feedback.retry.pauseAndModel',
            tone: 'error',
          },
          'interrupt',
        );
        setSortingCards((items) => items.filter((item) => item.id !== card.id));
        setSelectedCardId(null);
        return;
      }

      cardErrorsRef.current[card.id] = (cardErrorsRef.current[card.id] ?? 0) + 1;
      const confusionKey = `${card.expectedRootId}:${rootId}`;
      statsRef.current.rootConfusions[confusionKey] = (statsRef.current.rootConfusions[confusionKey] ?? 0) + 1;

      updateStatus(
        {
          key: 'games.rootFamilyStickers.hints.gentleRetry',
          tone: 'error',
        },
        'interrupt',
      );

      if (sortingRoundIndex > 0) {
        const previousRound = sortingRoundIndex - 1;
        setSortingRoundIndex(previousRound);
        resetSortingRound(previousRound);
        updateStatus(
          {
            key: 'games.rootFamilyStickers.hints.solvedExample',
            tone: 'hint',
          },
          'queued',
        );
      }
    },
    [
      audio,
      checkpointHints,
      countSortingOutcome,
      isSlowMode,
      resetSortingRound,
      sortingCards,
      sortingRoundIndex,
      stage,
      triggerBoardFeedback,
      triggerScorePulse,
      updateStatus,
    ],
  );

  const handleDropOnRoot = useCallback(
    (rootId: RootId) => {
      const draggedCardId = dragCardIdRef.current ?? selectedCardId;
      if (!draggedCardId) return;
      dragCardIdRef.current = null;
      handlePlaceCard(draggedCardId, rootId);
    },
    [handlePlaceCard, selectedCardId],
  );

  const handleBuildChoice = useCallback(
    (wordId: WordId) => {
      if (stage !== 'building' || buildSolved) return;

      statsRef.current.totalActions += 1;

      if (wordId === currentBuildRound.targetWordId) {
        if (buildErrors === 0) {
          statsRef.current.firstAttemptSuccesses += 1;
          triggerScorePulse();
        }

        setBuildSolved(true);
        updateStatus(
          {
            key: buildErrors > 0 ? 'games.rootFamilyStickers.strategyPraise.stayedCalmAfterMistake' : 'games.rootFamilyStickers.feedback.success.sameRoot',
            tone: 'success',
          },
          'interrupt',
        );
        void audio.playSequence([wordAudioPath(wordId), keyToAudioPath('games.rootFamilyStickers.feedback.success.wellDone')]);
        triggerBoardFeedback('success');
        return;
      }

      setBuildErrors((value) => value + 1);
      triggerBoardFeedback('miss');
      updateStatus(
        {
          key: 'games.rootFamilyStickers.feedback.retry.backToFocus',
          tone: 'error',
        },
        'interrupt',
      );
    },
    [audio, buildErrors, buildSolved, currentBuildRound.targetWordId, stage, triggerBoardFeedback, triggerScorePulse, updateStatus],
  );

  const handlePhraseReadComplete = useCallback(() => {
    if (stage !== 'phraseRead' || phraseCompleted) return;

    statsRef.current.totalActions += 1;
    if (checkpointHints === 0) {
      statsRef.current.firstAttemptSuccesses += 1;
      triggerScorePulse();
    }

    setPhraseCompleted(true);
    updateStatus(
      {
        key: 'games.rootFamilyStickers.feedback.success.familySticker',
        tone: 'success',
      },
      'interrupt',
    );
    void audio.playSequence([phraseAudioPath(currentPhraseRound.target), keyToAudioPath('games.rootFamilyStickers.prompts.phraseRead.finalRead')]);
    triggerBoardFeedback('success');
  }, [audio, checkpointHints, currentPhraseRound.target, phraseCompleted, stage, triggerBoardFeedback, triggerScorePulse, updateStatus]);

  const handleNext = useCallback(() => {
    if (!canAdvance) return;

    pushCheckpointHints();

    if (stage === 'sorting') {
      const hasAnotherSortingRound = sortingRoundIndex < SORTING_ROUNDS.length - 1;
      if (hasAnotherSortingRound) {
        const nextRound = sortingRoundIndex + 1;
        setSortingRoundIndex(nextRound);
        resetSortingRound(nextRound);
        return;
      }

      setStage('building');
      setBuildRoundIndex(0);
      setBuildSolved(false);
      setBuildErrors(0);
      return;
    }

    if (stage === 'building') {
      const hasAnotherBuildRound = buildRoundIndex < BUILD_ROUNDS.length - 1;
      if (hasAnotherBuildRound) {
        setBuildRoundIndex((value) => value + 1);
        setBuildSolved(false);
        setBuildErrors(0);
        return;
      }

      setStage('phraseRead');
      setPhraseRoundIndex(0);
      setPhraseCompleted(false);
      return;
    }

    const hasAnotherPhraseRound = phraseRoundIndex < PHRASE_ROUNDS.length - 1;
    if (hasAnotherPhraseRound) {
      setPhraseRoundIndex((value) => value + 1);
      setPhraseCompleted(false);
      return;
    }

    setStage('complete');
    setShowCompletionCelebration(true);
  }, [
    buildRoundIndex,
    canAdvance,
    phraseRoundIndex,
    pushCheckpointHints,
    resetSortingRound,
    sortingRoundIndex,
    stage,
  ]);

  useEffect(() => {
    if (stage === 'sorting') {
      void announceSortingRound();
      return;
    }

    if (stage === 'building') {
      void announceBuildRound();
      return;
    }

    if (stage === 'phraseRead') {
      void announcePhraseRound();
    }
  }, [announceBuildRound, announcePhraseRound, announceSortingRound, stage, sortingRoundIndex, buildRoundIndex, phraseRoundIndex]);

  useEffect(() => {
    if (stage !== 'complete' || completionSentRef.current) {
      return;
    }

    completionSentRef.current = true;
    const firstAttemptSuccessRate =
      statsRef.current.totalActions === 0
        ? 0
        : Math.round((statsRef.current.firstAttemptSuccesses / statsRef.current.totalActions) * 100);

    const hintTrend = getHintTrend(statsRef.current.hintUsageByCheckpoint);
    const totalHints = statsRef.current.hintUsageByCheckpoint.reduce((sum, value) => sum + value, 0);

    const stars =
      firstAttemptSuccessRate >= 85 && totalHints <= 3
        ? 3
        : firstAttemptSuccessRate >= 65
          ? 2
          : 1;

    const score = Math.max(100, Math.round(firstAttemptSuccessRate * 10 + Math.max(0, 40 - totalHints * 5)));
    const summaryMetrics: ParentSummaryMetrics = {
      highestStableRange: toStableRange(firstAttemptSuccessRate),
      firstAttemptSuccessRate,
      hintTrend,
    };

    onComplete({
      stars,
      score,
      completed: true,
      summaryMetrics,
      roundsCompleted: statsRef.current.completedCheckpoints,
    });
  }, [onComplete, stage]);

  useEffect(
    () => () => {
      if (scorePulseTimeoutRef.current !== null) {
        window.clearTimeout(scorePulseTimeoutRef.current);
      }
      if (boardFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(boardFeedbackTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (stage !== 'sorting' || sortingCards.length > 0) {
      return;
    }

    updateStatus(
      {
        key: 'games.rootFamilyStickers.feedback.success.wellDone',
        tone: 'success',
      },
      'queued',
    );
  }, [sortingCards.length, stage, updateStatus]);

  const controlButtons = (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-xs)',
      }}
    >
      <Button
        variant="secondary"
        size="md"
        onClick={handleReplayInstruction}
        aria-label={t('games.rootFamilyStickers.instructions.tapReplay')}
        title={t('games.rootFamilyStickers.instructions.tapReplay')}
        style={{ minInlineSize: '48px', paddingInline: 'var(--space-sm)' }}
      >
        <span aria-hidden="true">▶</span>
      </Button>
      <Button
        variant="secondary"
        size="md"
        onClick={handleRetry}
        aria-label={t('games.rootFamilyStickers.instructions.tapRetry')}
        title={t('games.rootFamilyStickers.instructions.tapRetry')}
        style={{ minInlineSize: '48px', paddingInline: 'var(--space-sm)' }}
      >
        <span aria-hidden="true">↻</span>
      </Button>
      <Button
        variant="secondary"
        size="md"
        onClick={() => void handleHint()}
        aria-label={t('games.rootFamilyStickers.instructions.tapHint')}
        title={t('games.rootFamilyStickers.instructions.tapHint')}
        style={{ minInlineSize: '48px', paddingInline: 'var(--space-sm)' }}
      >
        <span aria-hidden="true">💡</span>
      </Button>
      <Button
        variant="primary"
        size="md"
        onClick={handleNext}
        disabled={!canAdvance}
        aria-label={t('games.rootFamilyStickers.instructions.tapNext')}
        title={t('games.rootFamilyStickers.instructions.tapNext')}
        style={{ minInlineSize: '48px', paddingInline: 'var(--space-sm)' }}
      >
        <span aria-hidden="true">→</span>
      </Button>
    </div>
  );

  const sortingRootButtons = currentSortingRound.roots.map((rootId) => {
    const root = ROOTS[rootId];
    const [anchorOne, anchorTwo] = root.anchorWords;
    return (
      <button
        key={root.id}
        type="button"
        onClick={() => handleDropOnRoot(root.id)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleDropOnRoot(root.id);
        }}
        aria-label={`${t(root.key)} ${t('games.rootFamilyStickers.prompts.sorting.matchFamily')}`}
        style={{
          minBlockSize: '130px',
          borderRadius: 'var(--radius-lg)',
          border: `2px solid ${showRootHighlight ? root.hue : 'var(--color-border-subtle)'}`,
          background: `linear-gradient(180deg, color-mix(in srgb, ${root.hue} 18%, white), var(--color-bg-card))`,
          boxShadow: 'var(--shadow-sm)',
          padding: 'var(--space-sm)',
          display: 'grid',
          gap: 'var(--space-xs)',
          textAlign: 'center',
          cursor: 'pointer',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '1.45rem' }}>
          {root.icon}
        </span>
        <strong style={{ color: 'var(--color-text-primary)' }}>{t(root.key)}</strong>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          {t(`words.pronunciation.${anchorOne}`)} · {t(`words.pronunciation.${anchorTwo}`)}
        </span>
      </button>
    );
  });

  return (
    <Card
      className="root-family-stickers"
      padding="md"
      style={{
        display: 'grid',
        gap: 'var(--space-md)',
        background:
          'radial-gradient(circle at 8% 10%, color-mix(in srgb, var(--color-theme-secondary) 22%, transparent), transparent 40%), linear-gradient(180deg, var(--color-bg-card) 0%, color-mix(in srgb, var(--color-theme-bg) 80%, white 20%) 100%)',
      }}
    >
      <header
        style={{
          display: 'grid',
          gap: 'var(--space-sm)',
          alignItems: 'center',
          gridTemplateColumns: '1fr auto',
        }}
      >
        <div style={{ display: 'grid', gap: 'var(--space-2xs)' }}>
          <h2 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: 'var(--font-size-xl)' }}>
            {t('games.rootFamilyStickers.title')}
          </h2>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{t('games.rootFamilyStickers.subtitle')}</p>
        </div>
        {controlButtons}
      </header>

      <div className="root-family-stickers__progress" aria-hidden="true">
        {Array.from({ length: TOTAL_CHECKPOINTS }, (_, index) => (
          <span
            key={`root-family-progress-${index + 1}`}
            className={[
              'root-family-stickers__progress-dot',
              index < checkpointIndex ? 'root-family-stickers__progress-dot--done' : '',
              index === checkpointIndex ? 'root-family-stickers__progress-dot--active-live' : '',
            ].join(' ')}
          />
        ))}
      </div>

      <div className="root-family-stickers__score-strip" aria-hidden="true">
        <span className={['root-family-stickers__score-pill', scorePulse ? 'root-family-stickers__score-pill--pulse' : ''].join(' ')}>
          <span>⭐</span>
          <span>{statsRef.current.firstAttemptSuccesses}</span>
        </span>
        <span className="root-family-stickers__score-pill">
          <span>🎯</span>
          <span>
            {progressDisplayStep}/{TOTAL_CHECKPOINTS}
          </span>
        </span>
      </div>

      <Card
        className={[
          'root-family-stickers__surface',
          boardFeedback === 'success' ? 'root-family-stickers__surface--success' : '',
          boardFeedback === 'miss' ? 'root-family-stickers__surface--miss' : '',
        ].join(' ')}
        padding="md"
        style={{
          display: 'grid',
          gap: 'var(--space-sm)',
          border: '2px solid color-mix(in srgb, var(--color-theme-primary) 20%, transparent)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 'var(--space-sm)',
            alignItems: 'center',
          }}
        >
          <MascotIllustration variant={stage === 'complete' ? 'success' : 'hero'} size={78} />
          <div style={{ display: 'grid', gap: 'var(--space-2xs)' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {toneIcon(status.tone)} {t(status.key)}
            </span>
            {isSlowMode && (
              <span style={{ color: 'var(--color-accent-info)', fontSize: 'var(--font-size-xs)' }}>
                {t('games.rootFamilyStickers.instructions.slowMode')}
              </span>
            )}
          </div>
        </div>

        {stage === 'sorting' && (
          <section style={{ display: 'grid', gap: 'var(--space-sm)' }}>
            <div
              style={{
                display: 'grid',
                gap: 'var(--space-sm)',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              }}
            >
              {sortingRootButtons}
            </div>

            <div
              style={{
                display: 'grid',
                gap: 'var(--space-sm)',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              }}
            >
              {sortingCards.map((card) => {
                const wordLabel = t(`words.pronunciation.${card.wordId}`);
                const isSelected = selectedCardId === card.id;

                return (
                  <button
                    key={card.id}
                    type="button"
                    draggable
                    onDragStart={() => {
                      dragCardIdRef.current = card.id;
                    }}
                    onDragEnd={() => {
                      dragCardIdRef.current = null;
                    }}
                    onClick={() => {
                      setSelectedCardId((activeId) => (activeId === card.id ? null : card.id));
                      void audio.playNow(wordAudioPath(card.wordId));
                    }}
                    aria-label={wordLabel}
                    style={{
                      minBlockSize: '64px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${
                        isSelected
                          ? 'var(--color-accent-primary)'
                          : card.isDecoy
                            ? 'var(--color-accent-warning)'
                            : 'var(--color-border-subtle)'
                      }`,
                      background: 'var(--color-bg-surface)',
                      padding: 'var(--space-sm)',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-bold)' as unknown as number,
                      cursor: 'grab',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--space-xs)',
                    }}
                  >
                    <span>{wordLabel}</span>
                    {card.isDecoy && (
                      <span aria-hidden="true" style={{ fontSize: '0.9rem' }}>
                        ⚠️
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {stage === 'building' && (
          <section style={{ display: 'grid', gap: 'var(--space-sm)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-sm)',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  minInlineSize: '78px',
                  minBlockSize: '78px',
                  borderRadius: '999px',
                  border: `2px solid ${ROOTS[currentBuildRound.rootId].hue}`,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'var(--color-bg-surface)',
                }}
              >
                <strong style={{ color: 'var(--color-text-primary)' }}>{t(ROOTS[currentBuildRound.rootId].key)}</strong>
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 'var(--space-sm)',
              }}
            >
              {currentBuildRound.options.map((wordId) => (
                <Button
                  key={wordId}
                  variant={buildSolved && wordId === currentBuildRound.targetWordId ? 'primary' : 'secondary'}
                  size="md"
                  onClick={() => handleBuildChoice(wordId)}
                  aria-label={t(`words.pronunciation.${wordId}`)}
                  disabled={buildSolved}
                  style={{
                    minBlockSize: '56px',
                    fontSize: 'var(--font-size-lg)',
                  }}
                >
                  {t(`words.pronunciation.${wordId}`)}
                </Button>
              ))}
            </div>
          </section>
        )}

        {stage === 'phraseRead' && (
          <section
            style={{
              display: 'grid',
              gap: 'var(--space-sm)',
              justifyItems: 'center',
              textAlign: 'center',
            }}
          >
            <button
              type="button"
              onClick={handlePhraseReadComplete}
              aria-label={t(PHRASE_KEY_BY_ID[currentPhraseRound.target])}
              style={{
                minInlineSize: 'min(420px, 100%)',
                minBlockSize: '90px',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${phraseCompleted ? 'var(--color-accent-success)' : 'var(--color-border-subtle)'}`,
                background: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-extrabold)' as unknown as number,
                padding: 'var(--space-md)',
                cursor: 'pointer',
              }}
            >
              {t(PHRASE_KEY_BY_ID[currentPhraseRound.target])}
            </button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => void audio.playNow(phraseAudioPath(currentPhraseRound.target))}
              aria-label={t('games.rootFamilyStickers.instructions.tapReplay')}
              style={{ minInlineSize: '56px', paddingInline: 'var(--space-md)' }}
            >
              <span aria-hidden="true">▶</span>
              <span style={visuallyHiddenStyle}>{t('games.rootFamilyStickers.instructions.tapReplay')}</span>
            </Button>
          </section>
        )}

        {stage === 'complete' && (
          <section
            style={{
              display: 'grid',
              gap: 'var(--space-sm)',
              justifyItems: 'center',
              textAlign: 'center',
            }}
          >
            {showCompletionCelebration && <SuccessCelebration dense />}
            <p style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: 'var(--font-size-lg)' }}>
              {t('games.rootFamilyStickers.feedback.success.familySticker')}
            </p>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {t('games.rootFamilyStickers.feedback.encouragement.keepTrying')}
            </p>
          </section>
        )}
      </Card>

      <style>{`
        .root-family-stickers__progress {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 1fr;
          gap: var(--space-xs);
        }

        .root-family-stickers__progress-dot {
          block-size: 10px;
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-border) 70%, transparent);
        }

        .root-family-stickers__progress-dot--done {
          background: var(--color-accent-success);
        }

        .root-family-stickers__progress-dot--active-live {
          background: var(--color-accent-primary);
          animation: root-family-progress-live 1.1s ease-in-out infinite;
        }

        .root-family-stickers__score-strip {
          display: inline-flex;
          gap: var(--space-xs);
          align-items: center;
          flex-wrap: wrap;
        }

        .root-family-stickers__score-pill {
          min-height: 48px;
          border-radius: var(--radius-full);
          border: 1px solid color-mix(in srgb, var(--color-accent-primary) 34%, transparent);
          background: color-mix(in srgb, var(--color-accent-primary) 12%, transparent);
          padding-inline: var(--space-sm);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2xs);
          color: var(--color-text-primary);
          font-weight: var(--font-weight-semibold);
        }

        .root-family-stickers__score-pill--pulse {
          animation: root-family-score-pill 420ms var(--motion-ease-bounce);
        }

        .root-family-stickers__surface--success {
          animation: root-family-surface-success 300ms ease-out;
        }

        .root-family-stickers__surface--miss {
          animation: root-family-surface-miss 300ms ease-in-out;
        }

        @keyframes root-family-progress-live {
          0%,
          100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(1.3);
          }
        }

        @keyframes root-family-score-pill {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.07);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes root-family-surface-success {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.01);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes root-family-surface-miss {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(3px);
          }
          75% {
            transform: translateX(-3px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .root-family-stickers__progress-dot--active-live,
          .root-family-stickers__score-pill--pulse,
          .root-family-stickers__surface--success,
          .root-family-stickers__surface--miss {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </Card>
  );
}
