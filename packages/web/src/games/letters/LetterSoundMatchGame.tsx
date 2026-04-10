import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';

type GameLevelId = 1 | 2 | 3;
type RoundMode = 'listen' | 'wordBridge' | 'remediationListen' | 'remediationWord' | 'remediationTransfer';
type HintTone = 'neutral' | 'hint' | 'success';
type ChoiceGridFeedback = 'idle' | 'success' | 'miss';
type AudioPlaybackMode = 'queue' | 'interrupt';

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
type SampleWordAudioKey = `letters.sampleWords.${LetterId}`;
type PairKey = `${LetterId}|${LetterId}`;

type PromptKey =
  | 'games.letterSoundMatch.prompts.listen.readyForSound'
  | 'games.letterSoundMatch.prompts.listen.whichLetter'
  | 'games.letterSoundMatch.prompts.listen.listenAgain'
  | 'games.letterSoundMatch.prompts.listen.firstSoundWord'
  | 'games.letterSoundMatch.prompts.listen.pairPractice';

type StatusKey =
  | PromptKey
  | LetterAudioKey
  | SampleWordAudioKey
  | 'games.letterSoundMatch.title'
  | 'games.letterSoundMatch.subtitle'
  | 'games.letterSoundMatch.instructions.intro'
  | 'games.letterSoundMatch.instructions.listenToSound'
  | 'games.letterSoundMatch.instructions.tapMatchingLetter'
  | 'games.letterSoundMatch.instructions.wordBridge'
  | 'games.letterSoundMatch.instructions.useReplay'
  | 'games.letterSoundMatch.instructions.tapFirstThenDrag'
  | 'games.letterSoundMatch.hints.replaySlowly'
  | 'games.letterSoundMatch.hints.focusOnStart'
  | 'games.letterSoundMatch.hints.startWithTwoChoices'
  | 'games.letterSoundMatch.hints.lookAndListen'
  | 'games.letterSoundMatch.hints.gentleRetry'
  | 'games.letterSoundMatch.success.matchedSound'
  | 'games.letterSoundMatch.success.greatListening'
  | 'games.letterSoundMatch.success.readyForNextSound'
  | 'games.letterSoundMatch.feedback.encouragement.keepTrying'
  | 'games.letterSoundMatch.feedback.encouragement.almostThere'
  | 'games.letterSoundMatch.feedback.encouragement.tryAgain'
  | 'games.letterSoundMatch.feedback.success.wellDone'
  | 'games.letterSoundMatch.feedback.success.amazing'
  | 'games.letterSoundMatch.feedback.success.celebrate'
  | 'feedback.greatEffort'
  | 'feedback.excellent'
  | 'feedback.keepGoing'
  | 'feedback.youDidIt'
  | 'parentDashboard.games.letterSoundMatch.progressSummary'
  | 'parentDashboard.games.letterSoundMatch.nextStep';

type AudioKey =
  | Exclude<StatusKey, LetterAudioKey | SampleWordAudioKey>
  | LetterAudioKey
  | SampleWordAudioKey;

interface RoundState {
  id: string;
  roundNumber: number;
  level: GameLevelId;
  mode: RoundMode;
  targetLetter: LetterId;
  optionLetters: LetterId[];
  promptKey: PromptKey;
  instructionKey: StatusKey;
  slowedReplay: boolean;
  forceReplayBeforeTap: boolean;
  remediationPair: [LetterId, LetterId] | null;
}

interface RoundMessage {
  key: StatusKey;
  tone: HintTone;
}

interface RemediationState {
  pair: [LetterId, LetterId];
  step: 1 | 2 | 3;
}

interface SessionStats {
  firstAttemptSuccesses: number;
  hintUsageByRound: number[];
  highestLevelReached: GameLevelId;
  pairMistakes: Partial<Record<PairKey, number>>;
  pairMistakeEvents: Array<{ pairKey: PairKey; round: number }>;
  roundsCompleted: number;
}

const TOTAL_ROUNDS = 6;
const MIDPOINT_ROUND = 3;
const INACTIVITY_MS = 7000;
const RAPID_TAP_WINDOW_MS = 2400;
const MIDPOINT_CONTINUE_CUE_DELAY_MS = 520;

const EASY_SET: LetterId[] = ['mem', 'nun', 'lamed', 'samekh', 'shin', 'pe'];
const MEDIUM_ADDITIONS: LetterId[] = ['bet', 'dalet', 'resh', 'kaf', 'gimel', 'he'];

const LEVEL_POOL: Record<GameLevelId, LetterId[]> = {
  1: [...EASY_SET],
  2: [...EASY_SET, ...MEDIUM_ADDITIONS],
  3: [
    ...EASY_SET,
    ...MEDIUM_ADDITIONS,
    'tet',
    'tav',
    'qof',
    'alef',
    'ayin',
    'tsadi',
    'vav',
    'yod',
    'het',
    'zayin',
  ],
};

const CONFUSION_PAIRS: Array<[LetterId, LetterId]> = [
  ['bet', 'pe'],
  ['dalet', 'resh'],
  ['tet', 'tav'],
  ['qof', 'kaf'],
  ['samekh', 'shin'],
  ['alef', 'ayin'],
];

const ROUND_SUCCESS_ROTATION: Array<
  | 'games.letterSoundMatch.success.matchedSound'
  | 'games.letterSoundMatch.success.greatListening'
  | 'games.letterSoundMatch.success.readyForNextSound'
> = [
  'games.letterSoundMatch.success.matchedSound',
  'games.letterSoundMatch.success.greatListening',
  'games.letterSoundMatch.success.readyForNextSound',
];

const STATIC_AUDIO_PATH_BY_KEY = {
  'games.letterSoundMatch.title': '/audio/he/games/letter-sound-match/title.mp3',
  'games.letterSoundMatch.subtitle': '/audio/he/games/letter-sound-match/subtitle.mp3',
  'games.letterSoundMatch.instructions.intro': '/audio/he/games/letter-sound-match/instructions/intro.mp3',
  'games.letterSoundMatch.instructions.listenToSound':
    '/audio/he/games/letter-sound-match/instructions/listen-to-sound.mp3',
  'games.letterSoundMatch.instructions.tapMatchingLetter':
    '/audio/he/games/letter-sound-match/instructions/tap-matching-letter.mp3',
  'games.letterSoundMatch.instructions.wordBridge':
    '/audio/he/games/letter-sound-match/instructions/word-bridge.mp3',
  'games.letterSoundMatch.instructions.useReplay': '/audio/he/games/letter-sound-match/instructions/use-replay.mp3',
  'games.letterSoundMatch.instructions.tapFirstThenDrag':
    '/audio/he/games/letter-sound-match/instructions/tap-first-then-drag.mp3',

  'games.letterSoundMatch.prompts.listen.readyForSound':
    '/audio/he/games/letter-sound-match/prompts/listen/ready-for-sound.mp3',
  'games.letterSoundMatch.prompts.listen.whichLetter':
    '/audio/he/games/letter-sound-match/prompts/listen/which-letter.mp3',
  'games.letterSoundMatch.prompts.listen.listenAgain':
    '/audio/he/games/letter-sound-match/prompts/listen/listen-again.mp3',
  'games.letterSoundMatch.prompts.listen.firstSoundWord':
    '/audio/he/games/letter-sound-match/prompts/listen/first-sound-word.mp3',
  'games.letterSoundMatch.prompts.listen.pairPractice':
    '/audio/he/games/letter-sound-match/prompts/listen/pair-practice.mp3',

  'games.letterSoundMatch.hints.replaySlowly': '/audio/he/games/letter-sound-match/hints/replay-slowly.mp3',
  'games.letterSoundMatch.hints.focusOnStart': '/audio/he/games/letter-sound-match/hints/focus-on-start.mp3',
  'games.letterSoundMatch.hints.startWithTwoChoices':
    '/audio/he/games/letter-sound-match/hints/start-with-two-choices.mp3',
  'games.letterSoundMatch.hints.lookAndListen': '/audio/he/games/letter-sound-match/hints/look-and-listen.mp3',
  'games.letterSoundMatch.hints.gentleRetry': '/audio/he/games/letter-sound-match/hints/gentle-retry.mp3',

  'games.letterSoundMatch.success.matchedSound': '/audio/he/games/letter-sound-match/success/matched-sound.mp3',
  'games.letterSoundMatch.success.greatListening': '/audio/he/games/letter-sound-match/success/great-listening.mp3',
  'games.letterSoundMatch.success.readyForNextSound':
    '/audio/he/games/letter-sound-match/success/ready-for-next-sound.mp3',

  'games.letterSoundMatch.feedback.encouragement.keepTrying':
    '/audio/he/games/letter-sound-match/feedback/encouragement/keep-trying.mp3',
  'games.letterSoundMatch.feedback.encouragement.almostThere':
    '/audio/he/games/letter-sound-match/feedback/encouragement/almost-there.mp3',
  'games.letterSoundMatch.feedback.encouragement.tryAgain':
    '/audio/he/games/letter-sound-match/feedback/encouragement/try-again.mp3',

  'games.letterSoundMatch.feedback.success.wellDone':
    '/audio/he/games/letter-sound-match/feedback/success/well-done.mp3',
  'games.letterSoundMatch.feedback.success.amazing':
    '/audio/he/games/letter-sound-match/feedback/success/amazing.mp3',
  'games.letterSoundMatch.feedback.success.celebrate':
    '/audio/he/games/letter-sound-match/feedback/success/celebrate.mp3',

  'feedback.greatEffort': '/audio/he/feedback/great-effort.mp3',
  'feedback.excellent': '/audio/he/feedback/excellent.mp3',
  'feedback.keepGoing': '/audio/he/feedback/keep-going.mp3',
  'feedback.youDidIt': '/audio/he/feedback/you-did-it.mp3',
  'parentDashboard.games.letterSoundMatch.progressSummary':
    '/audio/he/parent-dashboard/games/letter-sound-match/progress-summary.mp3',
  'parentDashboard.games.letterSoundMatch.nextStep': '/audio/he/parent-dashboard/games/letter-sound-match/next-step.mp3',
} as const;

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

function normalizePair(first: LetterId, second: LetterId): PairKey {
  return ([first, second].sort() as [LetterId, LetterId]).join('|') as PairKey;
}

function getPairByLetter(letter: LetterId): [LetterId, LetterId] | null {
  const matched = CONFUSION_PAIRS.find((pair) => pair[0] === letter || pair[1] === letter);
  return matched ? [...matched] as [LetterId, LetterId] : null;
}

function getMaxOptionCount(level: GameLevelId): number {
  if (level === 1) {
    return 3;
  }
  return 4;
}

function getStableRange(level: GameLevelId): StableRange {
  if (level === 3) {
    return '1-10';
  }
  if (level === 2) {
    return '1-5';
  }
  return '1-3';
}

function getHintTrend(hintUsageByRound: number[]): ParentSummaryMetrics['hintTrend'] {
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

function getFeedbackKeyFromHintTrend(hintTrend: ParentSummaryMetrics['hintTrend']): StatusKey {
  if (hintTrend === 'improving') {
    return 'feedback.excellent';
  }
  if (hintTrend === 'steady') {
    return 'feedback.keepGoing';
  }
  return 'feedback.greatEffort';
}

function resolveAudioPath(key: AudioKey): string | null {
  if (key in STATIC_AUDIO_PATH_BY_KEY) {
    return STATIC_AUDIO_PATH_BY_KEY[key as keyof typeof STATIC_AUDIO_PATH_BY_KEY];
  }

  if (key.startsWith('letters.pronunciation.')) {
    const letter = key.replace('letters.pronunciation.', '');
    return `/audio/he/letters/pronunciation/${letter}.mp3`;
  }

  if (key.startsWith('letters.sampleWords.')) {
    const letter = key.replace('letters.sampleWords.', '');
    return `/audio/he/letters/sample-words/${letter}.mp3`;
  }

  return null;
}

function pickInstructionKey(mode: RoundMode): StatusKey {
  if (mode === 'wordBridge' || mode === 'remediationWord') {
    return 'games.letterSoundMatch.instructions.wordBridge';
  }
  return 'games.letterSoundMatch.instructions.listenToSound';
}

function pickPromptKey(mode: RoundMode, roundNumber: number): PromptKey {
  if (mode === 'wordBridge' || mode === 'remediationWord') {
    return 'games.letterSoundMatch.prompts.listen.firstSoundWord';
  }

  if (mode === 'remediationListen' || mode === 'remediationTransfer') {
    return 'games.letterSoundMatch.prompts.listen.pairPractice';
  }

  const promptCycle: PromptKey[] = [
    'games.letterSoundMatch.prompts.listen.readyForSound',
    'games.letterSoundMatch.prompts.listen.whichLetter',
    'games.letterSoundMatch.prompts.listen.listenAgain',
  ];

  return promptCycle[(roundNumber - 1) % promptCycle.length] as PromptKey;
}

function buildOptionLetters(options: {
  targetLetter: LetterId;
  level: GameLevelId;
  optionCount: number;
  forceTwoChoice: boolean;
  remediation: RemediationState | null;
}): LetterId[] {
  const { targetLetter, level, optionCount, forceTwoChoice, remediation } = options;

  if (remediation) {
    const [first, second] = remediation.pair;

    if (remediation.step === 1 || remediation.step === 2) {
      return shuffle([first, second]);
    }

    const neutralPool = LEVEL_POOL[Math.max(1, level - 1) as GameLevelId].filter(
      (letter) => letter !== first && letter !== second,
    );
    const neutral = neutralPool.length > 0 ? pickRandom(neutralPool) : targetLetter;
    return shuffle([first, second, neutral]);
  }

  const desiredOptionCount = forceTwoChoice ? 2 : Math.max(2, Math.min(getMaxOptionCount(level), optionCount));

  const pool = LEVEL_POOL[level].filter((letter) => letter !== targetLetter);
  const selected = new Set<LetterId>([targetLetter]);

  const pair = getPairByLetter(targetLetter);
  if (pair) {
    const distractor = pair[0] === targetLetter ? pair[1] : pair[0];
    selected.add(distractor);
  }

  while (selected.size < desiredOptionCount && pool.length > 0) {
    selected.add(pickRandom(pool));
  }

  return shuffle(Array.from(selected));
}

function pickTargetLetter(options: {
  level: GameLevelId;
  repeatTarget: LetterId | null;
  previousTarget: LetterId | null;
  remediation: RemediationState | null;
}): LetterId {
  const { level, repeatTarget, previousTarget, remediation } = options;

  if (repeatTarget) {
    return repeatTarget;
  }

  if (remediation) {
    return remediation.step === 2 ? remediation.pair[1] : remediation.pair[0];
  }

  const pool = LEVEL_POOL[level];
  const candidates = pool.filter((letter) => letter !== previousTarget);
  if (candidates.length === 0) {
    return pickRandom(pool);
  }

  return pickRandom(candidates);
}

function buildRound(options: {
  roundNumber: number;
  level: GameLevelId;
  optionCount: number;
  repeatTarget: LetterId | null;
  previousTarget: LetterId | null;
  remediation: RemediationState | null;
  forceTwoChoice: boolean;
  slowedReplay: boolean;
  forceReplayBeforeTap: boolean;
}): RoundState {
  const {
    roundNumber,
    level,
    optionCount,
    repeatTarget,
    previousTarget,
    remediation,
    forceTwoChoice,
    slowedReplay,
    forceReplayBeforeTap,
  } = options;

  const mode: RoundMode = remediation
    ? remediation.step === 1
      ? 'remediationListen'
      : remediation.step === 2
        ? 'remediationWord'
        : 'remediationTransfer'
    : level === 3 && roundNumber >= 5 && roundNumber % 2 === 0
      ? 'wordBridge'
      : 'listen';

  const targetLetter = pickTargetLetter({
    level,
    repeatTarget,
    previousTarget,
    remediation,
  });

  const optionLetters = buildOptionLetters({
    targetLetter,
    level,
    optionCount,
    forceTwoChoice,
    remediation,
  });

  return {
    id: `round-${roundNumber}-${mode}-${targetLetter}-${optionLetters.join('-')}`,
    roundNumber,
    level,
    mode,
    targetLetter,
    optionLetters,
    promptKey: pickPromptKey(mode, roundNumber),
    instructionKey: pickInstructionKey(mode),
    slowedReplay,
    forceReplayBeforeTap,
    remediationPair: remediation?.pair ?? null,
  };
}

function toLetterAudioKey(letter: LetterId): LetterAudioKey {
  return `letters.pronunciation.${letter}`;
}

function toSampleWordAudioKey(letter: LetterId): SampleWordAudioKey {
  return `letters.sampleWords.${letter}`;
}

export function LetterSoundMatchGame({ onComplete, audio }: GameProps) {
  const { t } = useTranslation('common');
  const choiceGridFeedbackTimeoutRef = useRef<number | null>(null);
  const scorePulseTimeoutRef = useRef<number | null>(null);
  const midpointContinueTimeoutRef = useRef<number | null>(null);

  const [roundNumber, setRoundNumber] = useState(1);
  const [level, setLevel] = useState<GameLevelId>(1);
  const [optionCount, setOptionCount] = useState(2);
  const [previousTarget, setPreviousTarget] = useState<LetterId | null>(null);

  const [repeatTarget, setRepeatTarget] = useState<LetterId | null>(null);
  const [remediation, setRemediation] = useState<RemediationState | null>(null);
  const [slowReplayRoundsRemaining, setSlowReplayRoundsRemaining] = useState(0);
  const [forceTwoChoiceRoundsRemaining, setForceTwoChoiceRoundsRemaining] = useState(0);
  const [forceReplayGateRoundsRemaining, setForceReplayGateRoundsRemaining] = useState(0);

  const [consecutiveSuccesses, setConsecutiveSuccesses] = useState(0);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);

  const [midpointPaused, setMidpointPaused] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [pendingRoundState, setPendingRoundState] = useState<RoundState | null>(null);

  const [sessionStats, setSessionStats] = useState<SessionStats>({
    firstAttemptSuccesses: 0,
    hintUsageByRound: [],
    highestLevelReached: 1,
    pairMistakes: {},
    pairMistakeEvents: [],
    roundsCompleted: 0,
  });

  const [round, setRound] = useState<RoundState>(() =>
    buildRound({
      roundNumber: 1,
      level: 1,
      optionCount: 2,
      repeatTarget: null,
      previousTarget: null,
      remediation: null,
      forceTwoChoice: false,
      slowedReplay: false,
      forceReplayBeforeTap: false,
    }),
  );

  const [roundMessage, setRoundMessage] = useState<RoundMessage>({
    key: 'games.letterSoundMatch.instructions.intro',
    tone: 'neutral',
  });
  const [attemptsThisRound, setAttemptsThisRound] = useState(0);
  const [mistakesThisRound, setMistakesThisRound] = useState(0);
  const [usedHintThisRound, setUsedHintThisRound] = useState(false);
  const [hintStep, setHintStep] = useState(0);
  const [correctRevealLetter, setCorrectRevealLetter] = useState<LetterId | null>(null);
  const [inactivePulseLetter, setInactivePulseLetter] = useState<LetterId | null>(null);
  const [awaitingReplayGate, setAwaitingReplayGate] = useState(false);
  const [interactionNonce, setInteractionNonce] = useState(0);
  const [rapidIncorrectTaps, setRapidIncorrectTaps] = useState<number[]>([]);
  const [stampCount, setStampCount] = useState(0);
  const [showStampBurst, setShowStampBurst] = useState(false);
  const [scorePulse, setScorePulse] = useState(false);
  const [choiceGridFeedback, setChoiceGridFeedback] = useState<ChoiceGridFeedback>('idle');
  const [audioDegraded, setAudioDegraded] = useState(false);

  const completionReportedRef = useRef(false);

  const roundProgressSegments = useMemo(
    () => Array.from({ length: TOTAL_ROUNDS }, (_, index) => index + 1),
    [],
  );

  const currentLetterAudioKey = toLetterAudioKey(round.targetLetter);
  const currentSampleWordAudioKey = toSampleWordAudioKey(round.targetLetter);

  const currentLetterGlyph = useMemo(() => {
    const pronunciation = t(currentLetterAudioKey);
    return Array.from(pronunciation)[0] ?? pronunciation;
  }, [currentLetterAudioKey, t]);

  const handleAudioPlaybackFailure = useCallback(() => {
    setAudioDegraded((current) => {
      if (current) {
        return current;
      }
      setRoundMessage({ key: 'feedback.keepGoing', tone: 'hint' });
      return true;
    });
  }, []);

  const playAudioKey = useCallback(
    (key: AudioKey, mode: AudioPlaybackMode = 'queue') => {
      if (audioDegraded) {
        return;
      }

      const path = resolveAudioPath(key);
      if (!path) {
        return;
      }

      if (mode === 'interrupt') {
        void audio.playNow(path).catch(() => {
          handleAudioPlaybackFailure();
        });
        return;
      }

      void audio.play(path).catch(() => {
        handleAudioPlaybackFailure();
      });
    },
    [audio, audioDegraded, handleAudioPlaybackFailure],
  );

  const setMessageWithAudio = useCallback(
    (key: StatusKey, tone: HintTone, mode: AudioPlaybackMode = 'queue') => {
      setRoundMessage({ key, tone });
      playAudioKey(key as AudioKey, mode);
    },
    [playAudioKey],
  );

  const triggerChoiceGridFeedback = useCallback((feedback: Exclude<ChoiceGridFeedback, 'idle'>) => {
    setChoiceGridFeedback(feedback);
    if (choiceGridFeedbackTimeoutRef.current) {
      window.clearTimeout(choiceGridFeedbackTimeoutRef.current);
    }
    choiceGridFeedbackTimeoutRef.current = window.setTimeout(() => {
      setChoiceGridFeedback('idle');
      choiceGridFeedbackTimeoutRef.current = null;
    }, 340);
  }, []);

  const triggerScorePulse = useCallback(() => {
    setScorePulse(true);
    if (scorePulseTimeoutRef.current) {
      window.clearTimeout(scorePulseTimeoutRef.current);
    }
    scorePulseTimeoutRef.current = window.setTimeout(() => {
      setScorePulse(false);
      scorePulseTimeoutRef.current = null;
    }, 440);
  }, []);

  const resetRoundInteraction = useCallback((nextRound: RoundState) => {
    setAttemptsThisRound(0);
    setMistakesThisRound(0);
    setUsedHintThisRound(false);
    setHintStep(0);
    setCorrectRevealLetter(null);
    setInactivePulseLetter(null);
    setAwaitingReplayGate(nextRound.forceReplayBeforeTap);
    setRapidIncorrectTaps([]);
  }, []);

  const playRoundPrompt = useCallback(
    (options?: { slower?: boolean }) => {
      const slower = options?.slower ?? false;
      const shouldUseSlowReplay = slower || round.slowedReplay;

      if (shouldUseSlowReplay) {
        setRoundMessage({ key: 'games.letterSoundMatch.hints.replaySlowly', tone: 'hint' });
        playAudioKey('games.letterSoundMatch.hints.replaySlowly', 'interrupt');
      } else {
        setRoundMessage({ key: round.promptKey, tone: 'neutral' });
        playAudioKey(round.promptKey, 'interrupt');
      }

      window.setTimeout(() => {
        if (round.mode === 'wordBridge' || round.mode === 'remediationWord') {
          playAudioKey(currentSampleWordAudioKey);
          window.setTimeout(() => {
            playAudioKey(currentLetterAudioKey);
          }, 260);
          return;
        }

        playAudioKey(currentLetterAudioKey);
      }, 260);
    },
    [currentLetterAudioKey, currentSampleWordAudioKey, playAudioKey, round.mode, round.promptKey, round.slowedReplay],
  );

  const completeSession = useCallback(
    (stats: SessionStats, reachedLevel: GameLevelId) => {
      const hintTrend = getHintTrend(stats.hintUsageByRound);
      const firstAttemptSuccessRate =
        stats.hintUsageByRound.length === 0
          ? 0
          : Math.round((stats.firstAttemptSuccesses / stats.hintUsageByRound.length) * 100);

      setSessionComplete(true);
      setMessageWithAudio(getFeedbackKeyFromHintTrend(hintTrend), 'success');
      playAudioKey('games.letterSoundMatch.feedback.success.celebrate');

      if (completionReportedRef.current) {
        return;
      }
      completionReportedRef.current = true;

      onComplete({
        stars:
          firstAttemptSuccessRate >= 85 ? 3 :
            firstAttemptSuccessRate >= 60 ? 2 :
              1,
        score: stats.firstAttemptSuccesses * 18 + stats.roundsCompleted * 10,
        completed: true,
        roundsCompleted: stats.roundsCompleted,
        summaryMetrics: {
          highestStableRange: getStableRange(reachedLevel),
          firstAttemptSuccessRate,
          hintTrend,
        },
      });
    },
    [onComplete, playAudioKey, setMessageWithAudio],
  );

  const moveToNextRound = useCallback(
    (options: {
      repeatTargetNextRound: LetterId | null;
      nextLevel: GameLevelId;
      nextOptionCount: number;
      nextRemediation: RemediationState | null;
      slowReplayNextRounds: number;
      forceTwoChoiceNextRounds: number;
      forceReplayGateNextRounds: number;
      nextConsecutiveSuccesses: number;
      nextConsecutiveMisses: number;
      nextStats: SessionStats;
    }) => {
      const {
        repeatTargetNextRound,
        nextLevel,
        nextOptionCount,
        nextRemediation,
        slowReplayNextRounds,
        forceTwoChoiceNextRounds,
        forceReplayGateNextRounds,
        nextConsecutiveSuccesses,
        nextConsecutiveMisses,
        nextStats,
      } = options;

      if (nextStats.roundsCompleted >= TOTAL_ROUNDS) {
        completeSession(nextStats, nextLevel);
        return;
      }

      const nextRoundNumber = round.roundNumber + 1;
      const nextRound = buildRound({
        roundNumber: nextRoundNumber,
        level: nextLevel,
        optionCount: nextOptionCount,
        repeatTarget: repeatTargetNextRound,
        previousTarget: round.targetLetter,
        remediation: nextRemediation,
        forceTwoChoice: forceTwoChoiceNextRounds > 0,
        slowedReplay: slowReplayNextRounds > 0,
        forceReplayBeforeTap: forceReplayGateNextRounds > 0,
      });

      setRoundNumber(nextRoundNumber);
      setLevel(nextLevel);
      setOptionCount(nextOptionCount);
      setPreviousTarget(round.targetLetter);

      setRepeatTarget(repeatTargetNextRound);
      setRemediation(nextRemediation);
      setSlowReplayRoundsRemaining(Math.max(0, slowReplayNextRounds - 1));
      setForceTwoChoiceRoundsRemaining(Math.max(0, forceTwoChoiceNextRounds - 1));
      setForceReplayGateRoundsRemaining(Math.max(0, forceReplayGateNextRounds - 1));

      setConsecutiveSuccesses(nextConsecutiveSuccesses);
      setConsecutiveMisses(nextConsecutiveMisses);

      if (nextRoundNumber === MIDPOINT_ROUND + 1) {
        setPendingRoundState(nextRound);
        setMidpointPaused(true);
        return;
      }

      window.setTimeout(() => {
        setRound(nextRound);
        resetRoundInteraction(nextRound);
      }, 520);
    },
    [completeSession, resetRoundInteraction, round.roundNumber, round.targetLetter],
  );

  const completeRound = useCallback(
    (succeededOnFirstAttempt: boolean) => {
      if (sessionComplete || midpointPaused) {
        return;
      }

      const hadStruggle = !succeededOnFirstAttempt || usedHintThisRound;
      if (succeededOnFirstAttempt) {
        triggerScorePulse();
      }

      const pairEventsInLastWindow = sessionStats.pairMistakeEvents.filter(
        (entry) => entry.round >= round.roundNumber - 4,
      );

      const pairWithRemediationNeed = Object.entries(
        pairEventsInLastWindow.reduce<Record<string, number>>((acc, entry) => {
          acc[entry.pairKey] = (acc[entry.pairKey] ?? 0) + 1;
          return acc;
        }, {}),
      ).find(([, count]) => count >= 3)?.[0] as PairKey | undefined;

      const remediationFromPair = pairWithRemediationNeed
        ? (pairWithRemediationNeed.split('|') as [LetterId, LetterId])
        : null;

      const nextRemediation: RemediationState | null = remediation
        ? remediation.step === 3
          ? null
          : {
              pair: remediation.pair,
              step: remediation.step === 1 ? 2 : 3,
            }
        : remediationFromPair
          ? {
              pair: remediationFromPair,
              step: 1,
            }
          : null;

      const nextStats: SessionStats = {
        firstAttemptSuccesses: sessionStats.firstAttemptSuccesses + (succeededOnFirstAttempt ? 1 : 0),
        hintUsageByRound: [...sessionStats.hintUsageByRound, hadStruggle ? 1 : 0],
        highestLevelReached: Math.max(sessionStats.highestLevelReached, round.level) as GameLevelId,
        pairMistakes: sessionStats.pairMistakes,
        pairMistakeEvents: sessionStats.pairMistakeEvents,
        roundsCompleted: sessionStats.roundsCompleted + 1,
      };

      setSessionStats(nextStats);

      const nextStampCount = nextStats.roundsCompleted % 3 === 0
        ? stampCount + 1
        : stampCount;
      if (nextStampCount !== stampCount) {
        setStampCount(nextStampCount);
        setShowStampBurst(true);
        window.setTimeout(() => {
          setShowStampBurst(false);
        }, 620);
      }

      const successKey =
        ROUND_SUCCESS_ROTATION[(nextStats.roundsCompleted - 1) % ROUND_SUCCESS_ROTATION.length];
      setMessageWithAudio(successKey, 'success');

      let nextLevel = level;
      let nextOptionCount = optionCount;
      let nextConsecutiveSuccesses = hadStruggle ? 0 : consecutiveSuccesses + 1;
      let nextConsecutiveMisses = hadStruggle ? consecutiveMisses + 1 : 0;

      let nextRepeatTarget: LetterId | null = null;
      let nextSlowReplayRounds = slowReplayRoundsRemaining;
      let nextForceTwoChoiceRounds = forceTwoChoiceRoundsRemaining;
      let nextForceReplayGateRounds = forceReplayGateRoundsRemaining;

      if (nextConsecutiveSuccesses >= 3) {
        if (nextOptionCount < getMaxOptionCount(nextLevel)) {
          nextOptionCount += 1;
        } else if (nextLevel < 3) {
          nextLevel = (nextLevel + 1) as GameLevelId;
          nextOptionCount = Math.min(getMaxOptionCount(nextLevel), Math.max(3, nextOptionCount));
        }
        nextConsecutiveSuccesses = 0;
      }

      if (nextConsecutiveMisses >= 2) {
        nextOptionCount = Math.max(2, nextOptionCount - 1);
        nextRepeatTarget = round.targetLetter;
        nextSlowReplayRounds = Math.max(nextSlowReplayRounds, 1);
        nextConsecutiveMisses = 0;
      }

      if (nextRemediation && !remediation) {
        nextOptionCount = 2;
        nextForceTwoChoiceRounds = Math.max(nextForceTwoChoiceRounds, 1);
      }

      moveToNextRound({
        repeatTargetNextRound: nextRepeatTarget,
        nextLevel,
        nextOptionCount,
        nextRemediation,
        slowReplayNextRounds: nextSlowReplayRounds,
        forceTwoChoiceNextRounds: nextForceTwoChoiceRounds,
        forceReplayGateNextRounds: nextForceReplayGateRounds,
        nextConsecutiveSuccesses,
        nextConsecutiveMisses,
        nextStats,
      });
    },
    [
      consecutiveMisses,
      consecutiveSuccesses,
      forceReplayGateRoundsRemaining,
      forceTwoChoiceRoundsRemaining,
      level,
      midpointPaused,
      moveToNextRound,
      optionCount,
      remediation,
      round.level,
      round.roundNumber,
      round.targetLetter,
      sessionComplete,
      sessionStats,
      setMessageWithAudio,
      slowReplayRoundsRemaining,
      stampCount,
      triggerScorePulse,
      usedHintThisRound,
    ],
  );

  const handleReplay = useCallback(
    (options?: { slower?: boolean; gateReleased?: boolean }) => {
      if (sessionComplete || midpointPaused) {
        return;
      }

      setInteractionNonce((value) => value + 1);
      setInactivePulseLetter(null);
      setMessageWithAudio('games.letterSoundMatch.instructions.useReplay', 'neutral', 'interrupt');

      if (options?.gateReleased) {
        setAwaitingReplayGate(false);
      }

      window.setTimeout(() => {
        playRoundPrompt({ slower: options?.slower ?? false });
      }, 180);
    },
    [midpointPaused, playRoundPrompt, sessionComplete, setMessageWithAudio],
  );

  const handleHintControl = useCallback(() => {
    if (sessionComplete || midpointPaused) {
      return;
    }

    setUsedHintThisRound(true);
    setHintStep((current) => Math.max(current, 1));
    setCorrectRevealLetter(null);
    setInteractionNonce((value) => value + 1);
    setMessageWithAudio('games.letterSoundMatch.hints.lookAndListen', 'hint');
    setInactivePulseLetter(round.targetLetter);

    window.setTimeout(() => {
      if (awaitingReplayGate) {
        handleReplay({ slower: true, gateReleased: true });
        window.setTimeout(() => {
          setInactivePulseLetter(round.targetLetter);
        }, 200);
        return;
      }

      playRoundPrompt({ slower: true });
    }, 200);
  }, [
    awaitingReplayGate,
    handleReplay,
    midpointPaused,
    playRoundPrompt,
    round.targetLetter,
    sessionComplete,
    setMessageWithAudio,
  ]);

  const handleRetryControl = useCallback(() => {
    if (sessionComplete || midpointPaused) {
      return;
    }

    setUsedHintThisRound(true);
    setHintStep((current) => Math.max(current, 1));
    setAttemptsThisRound(0);
    setMistakesThisRound(0);
    setCorrectRevealLetter(null);
    setInactivePulseLetter(null);
    setAwaitingReplayGate(false);
    setRapidIncorrectTaps([]);
    setMessageWithAudio('games.letterSoundMatch.hints.gentleRetry', 'hint');

    window.setTimeout(() => {
      handleReplay({ slower: true, gateReleased: true });
    }, 180);
  }, [handleReplay, midpointPaused, sessionComplete, setMessageWithAudio]);

  const applyHintEscalation = useCallback(
    (mistakes: number) => {
      setUsedHintThisRound(true);
      setHintStep(mistakes);

      if (mistakes === 1) {
        setMessageWithAudio('games.letterSoundMatch.hints.focusOnStart', 'hint');
        playAudioKey('games.letterSoundMatch.feedback.encouragement.keepTrying');
        return;
      }

      if (mistakes === 2) {
        setMessageWithAudio('games.letterSoundMatch.hints.startWithTwoChoices', 'hint');
        playAudioKey('games.letterSoundMatch.feedback.encouragement.almostThere');
        setRound((currentRound) => {
          if (currentRound.optionLetters.length <= 2) {
            return currentRound;
          }

          const distractorPool = currentRound.optionLetters.filter((letter) => letter !== currentRound.targetLetter);
          const narrowedDistractor = distractorPool.length > 0 ? pickRandom(distractorPool) : currentRound.targetLetter;

          return {
            ...currentRound,
            optionLetters: shuffle([currentRound.targetLetter, narrowedDistractor]),
          };
        });
        return;
      }

      setMessageWithAudio('games.letterSoundMatch.hints.gentleRetry', 'hint');
      playAudioKey('games.letterSoundMatch.feedback.encouragement.tryAgain');
      setCorrectRevealLetter(round.targetLetter);

      window.setTimeout(() => {
        setRound((currentRound) => {
          const fallbackPool = LEVEL_POOL[Math.max(1, currentRound.level - 1) as GameLevelId].filter(
            (letter) => letter !== currentRound.targetLetter,
          );
          const nearTransferDistractor = fallbackPool.length > 0
            ? pickRandom(fallbackPool)
            : currentRound.targetLetter;

          return {
            ...currentRound,
            optionLetters: shuffle([currentRound.targetLetter, nearTransferDistractor]),
            forceReplayBeforeTap: true,
          };
        });

        setAwaitingReplayGate(true);
        setCorrectRevealLetter(null);
        setMistakesThisRound(0);
        setAttemptsThisRound(0);
        setInteractionNonce((value) => value + 1);
        handleReplay({ slower: true, gateReleased: true });
      }, 560);
    },
    [handleReplay, playAudioKey, round.targetLetter, setMessageWithAudio],
  );

  const handleIncorrectSelection = useCallback(
    (selectedLetter: LetterId) => {
      triggerChoiceGridFeedback('miss');
      const nextAttempt = attemptsThisRound + 1;
      const nextMistakes = mistakesThisRound + 1;

      setAttemptsThisRound(nextAttempt);
      setMistakesThisRound(nextMistakes);

      const pairKey = normalizePair(round.targetLetter, selectedLetter);
      const nextPairEvents = [...sessionStats.pairMistakeEvents, { pairKey, round: round.roundNumber }];
      const nextPairMistakes = {
        ...sessionStats.pairMistakes,
        [pairKey]: (sessionStats.pairMistakes[pairKey] ?? 0) + 1,
      };

      setSessionStats((currentStats) => ({
        ...currentStats,
        pairMistakeEvents: nextPairEvents,
        pairMistakes: nextPairMistakes,
      }));

      const now = Date.now();
      const recentMistaps = [...rapidIncorrectTaps, now].filter((timestamp) => now - timestamp <= RAPID_TAP_WINDOW_MS);
      setRapidIncorrectTaps(recentMistaps);

      if (recentMistaps.length >= 4) {
        setForceTwoChoiceRoundsRemaining(1);
        setForceReplayGateRoundsRemaining(1);
        setMessageWithAudio('games.letterSoundMatch.hints.startWithTwoChoices', 'hint');
      }

      applyHintEscalation(Math.min(3, nextMistakes));
    },
    [
      applyHintEscalation,
      attemptsThisRound,
      mistakesThisRound,
      rapidIncorrectTaps,
      round.roundNumber,
      round.targetLetter,
      sessionStats.pairMistakeEvents,
      sessionStats.pairMistakes,
      setMessageWithAudio,
      triggerChoiceGridFeedback,
    ],
  );

  const handleOptionTap = useCallback(
    (letter: LetterId) => {
      if (sessionComplete || midpointPaused) {
        return;
      }

      setInteractionNonce((value) => value + 1);
      setInactivePulseLetter(null);

      if (awaitingReplayGate) {
        setMessageWithAudio('games.letterSoundMatch.instructions.useReplay', 'hint', 'interrupt');
        playAudioKey('games.letterSoundMatch.hints.replaySlowly');
        return;
      }

      if (letter === round.targetLetter) {
        triggerChoiceGridFeedback('success');
        playAudioKey(toLetterAudioKey(letter));
        completeRound(attemptsThisRound === 0 && !usedHintThisRound);
        return;
      }

      handleIncorrectSelection(letter);
    },
    [
      attemptsThisRound,
      awaitingReplayGate,
      completeRound,
      handleIncorrectSelection,
      midpointPaused,
      playAudioKey,
      round.targetLetter,
      sessionComplete,
      setMessageWithAudio,
      triggerChoiceGridFeedback,
      usedHintThisRound,
    ],
  );

  const handleContinueAfterMidpoint = useCallback(() => {
    if (!pendingRoundState || midpointContinueTimeoutRef.current) {
      return;
    }

    const nextRoundState = pendingRoundState;
    playAudioKey('games.letterSoundMatch.feedback.success.wellDone', 'interrupt');
    setPendingRoundState(null);
    midpointContinueTimeoutRef.current = window.setTimeout(() => {
      midpointContinueTimeoutRef.current = null;
      setMidpointPaused(false);
      setRound(nextRoundState);
      resetRoundInteraction(nextRoundState);
    }, MIDPOINT_CONTINUE_CUE_DELAY_MS);
  }, [pendingRoundState, playAudioKey, resetRoundInteraction]);

  useEffect(() => {
    if (sessionComplete || midpointPaused) {
      return;
    }

    setRoundMessage({ key: round.instructionKey, tone: 'neutral' });
    playAudioKey(round.instructionKey as AudioKey, 'interrupt');

    const timer = window.setTimeout(() => {
      playRoundPrompt({ slower: round.slowedReplay });
    }, 260);

    return () => {
      window.clearTimeout(timer);
    };
  }, [midpointPaused, playAudioKey, playRoundPrompt, round.id, round.instructionKey, round.slowedReplay, sessionComplete]);

  useEffect(() => {
    if (sessionComplete || midpointPaused) {
      return;
    }

    const timer = window.setTimeout(() => {
      setUsedHintThisRound(true);
      setInactivePulseLetter(round.optionLetters[0] ?? round.targetLetter);
      setMessageWithAudio('games.letterSoundMatch.hints.lookAndListen', 'hint');
      handleReplay({ slower: true });
    }, INACTIVITY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    handleReplay,
    interactionNonce,
    midpointPaused,
    round.id,
    round.optionLetters,
    round.targetLetter,
    sessionComplete,
    setMessageWithAudio,
  ]);

  useEffect(() => {
    return () => {
      if (choiceGridFeedbackTimeoutRef.current) {
        window.clearTimeout(choiceGridFeedbackTimeoutRef.current);
      }
      if (scorePulseTimeoutRef.current) {
        window.clearTimeout(scorePulseTimeoutRef.current);
      }
      if (midpointContinueTimeoutRef.current) {
        window.clearTimeout(midpointContinueTimeoutRef.current);
      }
      audio.stop();
    };
  }, [audio]);

  const strongestPair = useMemo(() => {
    const entries = Object.entries(sessionStats.pairMistakes) as Array<[PairKey, number]>;
    if (entries.length === 0) {
      return null;
    }

    const [pairKey] = entries.sort((left, right) => right[1] - left[1])[0] as [PairKey, number];
    return pairKey;
  }, [sessionStats.pairMistakes]);

  const strongestPairLabel = useMemo(() => {
    if (!strongestPair) {
      return `${currentLetterGlyph}/${currentLetterGlyph}`;
    }

    const [first, second] = strongestPair.split('|') as [LetterId, LetterId];
    const firstGlyph = Array.from(t(toLetterAudioKey(first)))[0] ?? t(toLetterAudioKey(first));
    const secondGlyph = Array.from(t(toLetterAudioKey(second)))[0] ?? t(toLetterAudioKey(second));
    return `${firstGlyph}/${secondGlyph}`;
  }, [currentLetterGlyph, strongestPair, t]);

  const sessionAccuracy =
    sessionStats.roundsCompleted === 0
      ? 0
      : Math.round((sessionStats.firstAttemptSuccesses / sessionStats.roundsCompleted) * 100);
  const replayButtonAriaLabel = t('games.letterSoundMatch.instructions.useReplay');
  const showRoundCelebration = roundMessage.tone === 'success';
  const showInRoundCoach = !showRoundCelebration;

  if (sessionComplete) {
    const hintTrend = getHintTrend(sessionStats.hintUsageByRound);

    return (
      <div className="letter-sound-match letter-sound-match--complete">
        <Card padding="lg" className="letter-sound-match__shell">
          <div className="letter-sound-match__text-row letter-sound-match__text-row--center">
            <h2 className="letter-sound-match__title">{t('feedback.youDidIt')}</h2>
            <button
              type="button"
              className="letter-sound-match__replay-button"
              onClick={() => playAudioKey('feedback.youDidIt')}
              aria-label={replayButtonAriaLabel}
            >
              <span aria-hidden="true">▶</span>
            </button>
          </div>
          <div className="letter-sound-match__text-row letter-sound-match__text-row--center">
            <p className="letter-sound-match__subtitle">{t('games.letterSoundMatch.feedback.success.amazing')}</p>
            <button
              type="button"
              className="letter-sound-match__replay-button"
              onClick={() => playAudioKey('games.letterSoundMatch.feedback.success.amazing')}
              aria-label={replayButtonAriaLabel}
            >
              <span aria-hidden="true">▶</span>
            </button>
          </div>

          <div className="letter-sound-match__stamps" aria-label={t('feedback.excellent')}>
            {Array.from({ length: Math.max(1, stampCount) }).map((_, index) => (
              <span key={`stamp-${index}`} className="letter-sound-match__stamp" aria-hidden="true">
                🌟
              </span>
            ))}
          </div>

          <Card padding="md" className="letter-sound-match__summary-card">
            <div className="letter-sound-match__text-row">
              <p>
                {t('parentDashboard.games.letterSoundMatch.progressSummary', {
                  accuracy: sessionAccuracy,
                  confusedPair: strongestPairLabel,
                })}
              </p>
              <button
                type="button"
                className="letter-sound-match__replay-button"
                onClick={() => playAudioKey('parentDashboard.games.letterSoundMatch.progressSummary')}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">▶</span>
              </button>
            </div>
            <div className="letter-sound-match__text-row">
              <p>{t('parentDashboard.games.letterSoundMatch.nextStep')}</p>
              <button
                type="button"
                className="letter-sound-match__replay-button"
                onClick={() => playAudioKey('parentDashboard.games.letterSoundMatch.nextStep')}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">▶</span>
              </button>
            </div>
          </Card>

          <div className="letter-sound-match__text-row letter-sound-match__text-row--center">
            <p className="letter-sound-match__hint-note">{t(getFeedbackKeyFromHintTrend(hintTrend))}</p>
            <button
              type="button"
              className="letter-sound-match__replay-button"
              onClick={() => playAudioKey(getFeedbackKeyFromHintTrend(hintTrend))}
              aria-label={replayButtonAriaLabel}
            >
              <span aria-hidden="true">▶</span>
            </button>
          </div>
        </Card>

        <style>{letterSoundMatchStyles}</style>
      </div>
    );
  }

  if (midpointPaused) {
    return (
      <div className="letter-sound-match letter-sound-match--midpoint">
        <Card padding="lg" className="letter-sound-match__shell">
          <div className="letter-sound-match__text-row">
            <h2 className="letter-sound-match__title">{t('feedback.greatEffort')}</h2>
            <button
              type="button"
              className="letter-sound-match__replay-button"
              onClick={() => playAudioKey('feedback.greatEffort')}
              aria-label={replayButtonAriaLabel}
            >
              <span aria-hidden="true">▶</span>
            </button>
          </div>
          <div className="letter-sound-match__text-row">
            <p className="letter-sound-match__subtitle">{t('games.letterSoundMatch.success.greatListening')}</p>
            <button
              type="button"
              className="letter-sound-match__replay-button"
              onClick={() => playAudioKey('games.letterSoundMatch.success.greatListening')}
              aria-label={replayButtonAriaLabel}
            >
              <span aria-hidden="true">▶</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleContinueAfterMidpoint}
            disabled={!pendingRoundState}
            aria-label={t('nav.next')}
            style={{ minWidth: '56px', paddingInline: 'var(--space-lg)' }}
          >
            <span aria-hidden="true">→</span>
          </Button>
        </Card>

        <style>{letterSoundMatchStyles}</style>
      </div>
    );
  }

  return (
    <div className="letter-sound-match">
      <Card padding="lg" className="letter-sound-match__shell">
        <header className="letter-sound-match__header">
          <div className="letter-sound-match__heading">
            <div className="letter-sound-match__text-row">
              <h2 className="letter-sound-match__title">{t('games.letterSoundMatch.title')}</h2>
              <button
                type="button"
                className="letter-sound-match__replay-button"
                onClick={() => playAudioKey('games.letterSoundMatch.title')}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">▶</span>
              </button>
            </div>
            <div className="letter-sound-match__text-row">
              <p className="letter-sound-match__subtitle">{t('games.letterSoundMatch.subtitle')}</p>
              <button
                type="button"
                className="letter-sound-match__replay-button"
                onClick={() => playAudioKey('games.letterSoundMatch.subtitle')}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">▶</span>
              </button>
            </div>
          </div>

          <div className="letter-sound-match__actions">
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleReplay({ slower: false, gateReleased: true })}
              aria-label={t('games.letterSoundMatch.instructions.useReplay')}
              style={{ minWidth: 'var(--touch-min)', paddingInline: 'var(--space-md)' }}
            >
              <span aria-hidden="true">▶</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleHintControl}
              aria-label={t('games.letterSoundMatch.hints.lookAndListen')}
              style={{ minWidth: 'var(--touch-min)', paddingInline: 'var(--space-md)' }}
            >
              <span aria-hidden="true">💡</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleRetryControl}
              aria-label={t('games.letterSoundMatch.hints.gentleRetry')}
              style={{ minWidth: 'var(--touch-min)', paddingInline: 'var(--space-md)' }}
            >
              <span aria-hidden="true">↻</span>
            </Button>
          </div>
        </header>

        <div className="letter-sound-match__progress" aria-label={t('games.estimatedTime', { minutes: 5 })}>
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
                  'letter-sound-match__progress-dot',
                  `letter-sound-match__progress-dot--${state}`,
                  state === 'active' ? 'letter-sound-match__progress-dot--active-live' : '',
                ].join(' ')}
                aria-hidden="true"
              />
            );
          })}
        </div>

        <div className="letter-sound-match__score-strip" aria-hidden="true">
          <span
            className={[
              'letter-sound-match__score-pill',
              scorePulse ? 'letter-sound-match__score-pill--pulse' : '',
            ].join(' ')}
          >
            <span>⭐</span>
            <span>{sessionStats.firstAttemptSuccesses}</span>
          </span>
          <span className="letter-sound-match__score-pill">
            <span>🎯</span>
            <span>
              {sessionStats.roundsCompleted}/{TOTAL_ROUNDS}
            </span>
          </span>
        </div>

        <div className={`letter-sound-match__message letter-sound-match__message--${roundMessage.tone}`}>
          <p className="letter-sound-match__message-text" aria-live="polite">
            {t(roundMessage.key)}
          </p>
          <button
            type="button"
            className="letter-sound-match__replay-button"
            onClick={() => playAudioKey(roundMessage.key as AudioKey)}
            aria-label={replayButtonAriaLabel}
          >
            <span aria-hidden="true">▶</span>
          </button>
        </div>

        {audioDegraded ? (
          <p className="letter-sound-match__audio-fallback" aria-live="polite">
            <span aria-hidden="true">🔇</span>
            <span>{t('feedback.keepGoing')}</span>
          </p>
        ) : null}

        <section className="letter-sound-match__board">
          <div className="letter-sound-match__scene-props" aria-hidden="true">
            <span>🔠</span>
            <span>🧩</span>
            <span>✨</span>
            <span>🪁</span>
            <span>🔤</span>
          </div>
          {showInRoundCoach ? (
            <div className="letter-sound-match__coach" aria-hidden="true">
              <MascotIllustration variant="hint" size={56} />
            </div>
          ) : null}

          <Card padding="md" className="letter-sound-match__prompt-card">
            <div className="letter-sound-match__prompt-head">
              <span className="letter-sound-match__target-glyph" aria-hidden="true">
                {currentLetterGlyph}
              </span>

              <div className="letter-sound-match__metrics">
                <span className="letter-sound-match__metric-pill" aria-label={t('games.difficulty')}>
                  🎯 {round.level}
                </span>
                <span className="letter-sound-match__metric-pill" aria-label={t('nav.next')}>
                  {round.roundNumber}/{TOTAL_ROUNDS}
                </span>
                <span className="letter-sound-match__metric-pill" aria-label={t('feedback.keepGoing')}>
                  {sessionAccuracy}%
                </span>
              </div>
            </div>

            <div className="letter-sound-match__text-row">
              <p className="letter-sound-match__instruction">{t(round.instructionKey)}</p>
              <button
                type="button"
                className="letter-sound-match__replay-button"
                onClick={() => playAudioKey(round.instructionKey as AudioKey)}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">▶</span>
              </button>
            </div>

            {round.mode === 'wordBridge' || round.mode === 'remediationWord' ? (
              <div className="letter-sound-match__text-row">
                <p className="letter-sound-match__word-bridge-note">{t(toSampleWordAudioKey(round.targetLetter))}</p>
                <button
                  type="button"
                  className="letter-sound-match__replay-button"
                  onClick={() => playAudioKey(currentSampleWordAudioKey)}
                  aria-label={replayButtonAriaLabel}
                >
                  <span aria-hidden="true">▶</span>
                </button>
              </div>
            ) : null}

            {awaitingReplayGate ? (
              <div className="letter-sound-match__text-row">
                <p className="letter-sound-match__gate-note">{t('games.letterSoundMatch.hints.replaySlowly')}</p>
                <button
                  type="button"
                  className="letter-sound-match__replay-button"
                  onClick={() => playAudioKey('games.letterSoundMatch.hints.replaySlowly')}
                  aria-label={replayButtonAriaLabel}
                >
                  <span aria-hidden="true">▶</span>
                </button>
              </div>
            ) : null}

            {showStampBurst ? (
              <div className="letter-sound-match__stamp-burst" aria-hidden="true">
                ✨🌟✨
              </div>
            ) : null}
          </Card>

          <div
            className={[
              'letter-sound-match__choices-grid',
              choiceGridFeedback === 'success' ? 'letter-sound-match__choices-grid--success' : '',
              choiceGridFeedback === 'miss' ? 'letter-sound-match__choices-grid--miss' : '',
            ].join(' ')}
            role="group"
            aria-label={t('games.letterSoundMatch.instructions.tapMatchingLetter')}
          >
            {round.optionLetters.map((letter) => {
              const letterKey = toLetterAudioKey(letter);
              const letterLabel = t(letterKey);
              const glyph = Array.from(letterLabel)[0] ?? letterLabel;
              const isCorrectReveal = correctRevealLetter === letter;
              const isInactivePulse = inactivePulseLetter === letter;

              return (
                <div className="letter-sound-match__choice-item" key={`choice-${letter}`}>
                  <button
                    type="button"
                    className={[
                      'letter-sound-match__choice',
                      isCorrectReveal ? 'letter-sound-match__choice--correct' : '',
                      isInactivePulse ? 'letter-sound-match__choice--pulse' : '',
                    ].join(' ')}
                    onClick={() => handleOptionTap(letter)}
                    aria-label={letterLabel}
                  >
                    <span className="letter-sound-match__choice-glyph" aria-hidden="true">
                      {glyph}
                    </span>
                    <span className="letter-sound-match__choice-label">{letterLabel}</span>
                  </button>
                  <button
                    type="button"
                    className="letter-sound-match__replay-button"
                    onClick={() => playAudioKey(letterKey)}
                    aria-label={`${replayButtonAriaLabel} ${letterLabel}`}
                  >
                    <span aria-hidden="true">▶</span>
                  </button>
                </div>
              );
            })}
          </div>

          {hintStep > 0 ? (
            <div className="letter-sound-match__text-row">
              <p className="letter-sound-match__hint-note-inline">{t('games.letterSoundMatch.hints.lookAndListen')}</p>
              <button
                type="button"
                className="letter-sound-match__replay-button"
                onClick={() => playAudioKey('games.letterSoundMatch.hints.lookAndListen')}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">▶</span>
              </button>
            </div>
          ) : null}
        </section>

        {showRoundCelebration ? (
          <div className="letter-sound-match__celebration-overlay" aria-hidden="true">
            <SuccessCelebration />
            <div className="letter-sound-match__celebration-mascot">
              <MascotIllustration variant="success" size={84} />
            </div>
          </div>
        ) : null}
      </Card>

      <style>{letterSoundMatchStyles}</style>
    </div>
  );
}

const letterSoundMatchStyles = `
  .letter-sound-match {
    width: 100%;
    border-radius: var(--radius-xl);
    padding: var(--space-sm);
    background:
      radial-gradient(circle at 14% 18%, color-mix(in srgb, var(--color-accent-primary) 16%, transparent) 0, transparent 44%),
      radial-gradient(circle at 84% 86%, color-mix(in srgb, var(--color-accent-success) 14%, transparent) 0, transparent 56%),
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--color-bg-secondary) 74%, #ffffff) 0%,
        color-mix(in srgb, var(--color-theme-primary) 10%, #ffffff) 100%
      );
  }

  .letter-sound-match__shell {
    display: grid;
    gap: var(--space-md);
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(circle at 90% 10%, color-mix(in srgb, var(--color-accent-primary) 18%, transparent) 0, transparent 48%),
      radial-gradient(circle at 10% 90%, color-mix(in srgb, var(--color-accent-success) 18%, transparent) 0, transparent 52%),
      var(--color-bg-card);
  }

  .letter-sound-match__header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: var(--space-md);
    flex-wrap: wrap;
    position: relative;
    z-index: 2;
  }

  .letter-sound-match__heading {
    display: grid;
    gap: var(--space-xs);
  }

  .letter-sound-match__title {
    margin: 0;
    font-size: var(--font-size-xl);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-extrabold);
  }

  .letter-sound-match__subtitle {
    margin: 0;
    color: var(--color-text-secondary);
  }

  .letter-sound-match__actions {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .letter-sound-match__text-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
  }

  .letter-sound-match__text-row > :first-child {
    flex: 1;
  }

  .letter-sound-match__text-row--center {
    justify-content: center;
  }

  .letter-sound-match__text-row--center > :first-child {
    flex: initial;
  }

  [dir='rtl'] .letter-sound-match__text-row .letter-sound-match__replay-button {
    order: -1;
  }

  .letter-sound-match__replay-button {
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

  .letter-sound-match__replay-button:hover {
    color: color-mix(in srgb, var(--color-theme-primary) 75%, var(--color-text-primary));
    transform: translateY(-1px);
  }

  .letter-sound-match__replay-button:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--color-accent-primary) 65%, transparent);
    outline-offset: 2px;
  }

  .letter-sound-match__progress {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: var(--space-xs);
  }

  .letter-sound-match__progress-dot {
    block-size: 10px;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-theme-secondary) 35%, transparent);
    transition: var(--transition-fast);
  }

  .letter-sound-match__progress-dot--done {
    background: var(--color-accent-success);
  }

  .letter-sound-match__progress-dot--active {
    background: var(--color-accent-primary);
    transform: scaleY(1.4);
  }

  .letter-sound-match__progress-dot--active-live {
    animation: letter-sound-match-progress-live 1.1s ease-in-out infinite;
  }

  .letter-sound-match__score-strip {
    display: inline-flex;
    align-items: center;
    justify-self: start;
    gap: var(--space-xs);
  }

  .letter-sound-match__score-pill {
    min-height: var(--touch-min);
    padding-inline: var(--space-sm);
    border-radius: var(--radius-full);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2xs);
    background: color-mix(in srgb, var(--color-theme-primary) 12%, var(--color-bg-card));
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 30%, transparent);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
  }

  .letter-sound-match__score-pill--pulse {
    animation: letter-sound-match-score-pill 420ms var(--motion-ease-bounce);
  }

  .letter-sound-match__message {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    background: color-mix(in srgb, var(--color-theme-secondary) 14%, transparent);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
    position: relative;
    z-index: 2;
  }

  .letter-sound-match__message-text {
    margin: 0;
    flex: 1;
  }

  .letter-sound-match__message--hint {
    background: color-mix(in srgb, var(--color-accent-warning) 20%, transparent);
  }

  .letter-sound-match__message--success {
    background: color-mix(in srgb, var(--color-accent-success) 24%, transparent);
  }

  .letter-sound-match__audio-fallback {
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

  .letter-sound-match__board {
    display: grid;
    gap: var(--space-md);
    position: relative;
    z-index: 2;
  }

  .letter-sound-match__scene-props {
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

  .letter-sound-match__coach {
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
    animation: letter-sound-match-coach-float 1600ms ease-in-out infinite;
  }

  .letter-sound-match__coach,
  .letter-sound-match__coach * {
    pointer-events: none;
  }

  .letter-sound-match__prompt-card {
    display: grid;
    gap: var(--space-sm);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 25%, transparent);
  }

  .letter-sound-match__prompt-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .letter-sound-match__target-glyph {
    inline-size: 62px;
    block-size: 62px;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-theme-primary) 22%, var(--color-bg-card));
    color: var(--color-text-primary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: var(--font-weight-extrabold);
  }

  .letter-sound-match__metrics {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .letter-sound-match__metric-pill {
    min-height: var(--touch-min);
    padding-inline: var(--space-sm);
    border-radius: var(--radius-full);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--color-bg-secondary) 76%, var(--color-bg-card));
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
  }

  .letter-sound-match__instruction,
  .letter-sound-match__word-bridge-note,
  .letter-sound-match__gate-note,
  .letter-sound-match__hint-note-inline {
    margin: 0;
    color: var(--color-text-secondary);
  }

  .letter-sound-match__word-bridge-note,
  .letter-sound-match__gate-note {
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--color-accent-info) 12%, transparent);
    color: var(--color-text-primary);
  }

  .letter-sound-match__stamp-burst {
    font-size: 1.1rem;
    animation: letter-sound-match-burst 620ms ease-out;
  }

  .letter-sound-match__choices-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: var(--space-sm);
    transform-origin: center;
  }

  .letter-sound-match__choices-grid--success {
    animation: letter-sound-match-grid-success 360ms ease-out;
  }

  .letter-sound-match__choices-grid--miss {
    animation: letter-sound-match-grid-miss 300ms ease-in-out;
  }

  .letter-sound-match__choice-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-xs);
    align-items: center;
  }

  .letter-sound-match__choice {
    width: 100%;
    min-height: 78px;
    border-radius: var(--radius-lg);
    border: 2px solid color-mix(in srgb, var(--color-theme-secondary) 28%, transparent);
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    display: grid;
    gap: 2px;
    place-items: center;
    text-align: center;
    padding: var(--space-sm);
    font-family: var(--font-family-primary);
    cursor: pointer;
    transition: var(--transition-fast);
    box-shadow: var(--shadow-sm);
    touch-action: manipulation;
  }

  .letter-sound-match__choice:hover {
    border-color: var(--color-theme-primary);
    transform: translateY(-1px);
  }

  .letter-sound-match__choice:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--color-accent-primary) 65%, transparent);
    outline-offset: 2px;
  }

  .letter-sound-match__choice--correct {
    border-color: var(--color-accent-success);
    background: color-mix(in srgb, var(--color-accent-success) 16%, var(--color-bg-card));
  }

  .letter-sound-match__choice--pulse {
    animation: letter-sound-match-pulse 1.3s ease-in-out infinite;
  }

  .letter-sound-match__choice-glyph {
    font-size: 2rem;
    font-weight: var(--font-weight-extrabold);
    line-height: 1;
  }

  .letter-sound-match__choice-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .letter-sound-match__stamps {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-sm);
  }

  .letter-sound-match__stamp {
    inline-size: 52px;
    block-size: 52px;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-accent-warning) 28%, transparent);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
  }

  .letter-sound-match__summary-card {
    display: grid;
    gap: var(--space-xs);
  }

  .letter-sound-match__summary-card p {
    margin: 0;
  }

  .letter-sound-match__hint-note {
    margin: 0;
    text-align: center;
    color: var(--color-text-secondary);
  }

  .letter-sound-match--complete,
  .letter-sound-match--midpoint {
    display: grid;
    place-items: center;
  }

  .letter-sound-match__celebration-overlay {
    position: absolute;
    inset-inline: var(--space-md);
    inset-block-end: var(--space-md);
    display: grid;
    justify-items: center;
    gap: var(--space-xs);
    pointer-events: none;
    z-index: 1;
    animation: letter-sound-match-celebrate 620ms var(--motion-ease-bounce) both;
  }

  .letter-sound-match__celebration-overlay * {
    pointer-events: none;
  }

  .letter-sound-match__celebration-mascot {
    animation: letter-sound-match-mascot-pop 620ms var(--motion-ease-bounce) both;
  }

  @keyframes letter-sound-match-pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent-primary) 46%, transparent);
    }

    70% {
      transform: scale(1.03);
      box-shadow: 0 0 0 10px color-mix(in srgb, var(--color-accent-primary) 0%, transparent);
    }

    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent-primary) 0%, transparent);
    }
  }

  @keyframes letter-sound-match-progress-live {
    0% {
      transform: scaleY(1.4);
    }

    50% {
      transform: scaleY(1.7);
    }

    100% {
      transform: scaleY(1.4);
    }
  }

  @keyframes letter-sound-match-score-pill {
    0% {
      transform: scale(0.94);
    }

    65% {
      transform: scale(1.08);
    }

    100% {
      transform: scale(1);
    }
  }

  @keyframes letter-sound-match-grid-success {
    0% {
      transform: scale(1);
    }

    40% {
      transform: scale(1.015);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent-success) 45%, transparent);
    }

    100% {
      transform: scale(1);
      box-shadow: none;
    }
  }

  @keyframes letter-sound-match-grid-miss {
    0% {
      transform: translateX(0);
    }

    25% {
      transform: translateX(6px);
    }

    50% {
      transform: translateX(-6px);
    }

    75% {
      transform: translateX(3px);
    }

    100% {
      transform: translateX(0);
    }
  }

  @keyframes letter-sound-match-burst {
    from {
      transform: scale(0.5);
      opacity: 0;
    }

    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes letter-sound-match-celebrate {
    from {
      opacity: 0;
      transform: translateY(8px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes letter-sound-match-mascot-pop {
    from {
      transform: scale(0.82) rotate(-3deg);
    }

    to {
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes letter-sound-match-coach-float {
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

  @media (max-width: 820px) {
    .letter-sound-match__header {
      align-items: stretch;
    }

    .letter-sound-match__actions {
      justify-content: flex-start;
    }

    .letter-sound-match__choices-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .letter-sound-match__text-row {
      flex-wrap: wrap;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .letter-sound-match__choice,
    .letter-sound-match__progress-dot,
    .letter-sound-match__progress-dot--active-live,
    .letter-sound-match__stamp-burst,
    .letter-sound-match__choice--pulse,
    .letter-sound-match__score-pill--pulse,
    .letter-sound-match__choices-grid--success,
    .letter-sound-match__choices-grid--miss {
      animation: none !important;
      transition: none !important;
      transform: none !important;
    }

    .letter-sound-match__celebration-overlay,
    .letter-sound-match__celebration-mascot,
    .letter-sound-match__coach {
      animation: none !important;
    }
  }
`;
