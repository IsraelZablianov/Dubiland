import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/design-system';
import { SuccessCelebration } from '@/components/motion';
import type { GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';
import {
  READING_RUNTIME_MATRIX,
  toReadingAgeBand,
  type ReadingAgeBand,
  type ReadingAntiGuessGuard,
  type ReadingProfileAgeBand,
} from '@/games/reading/readingRuntimeMatrix';

type HintTrend = ParentSummaryMetrics['hintTrend'];
type DecodableAgeBand = ReadingAgeBand;
type DecodableProfileAgeBand = ReadingProfileAgeBand;
type MessageTone = 'neutral' | 'hint' | 'success' | 'error';
type CheckpointFeedbackTone = 'idle' | 'success' | 'error';
type PageId = 'p01' | 'p02' | 'p03' | 'p04' | 'p05' | 'p06';
type CheckpointType = 'literal' | 'sequence' | 'evidence';
type WordId =
  | 'dubi'
  | 'halach'
  | 'lagan'
  | 'raah'
  | 'dag'
  | 'katan'
  | 'sam'
  | 'tik'
  | 'al'
  | 'sela'
  | 'kara'
  | 'shalom'
  | 'hevi'
  | 'lehem'
  | 'vehadag'
  | 'samchu'
  | 'bagan';
type PhraseId =
  | 'dubiHalachLagan'
  | 'dubiRaahDagKatan'
  | 'hadagSamTikAlSela'
  | 'dubiKaraShalomDag'
  | 'hadagHeviLehemLedubi'
  | 'dubiVehadagSamchuBagan';

interface ComprehensionOption {
  id: string;
  fallbackOptionId: string;
  isCorrect: boolean;
}

interface StoryPage {
  id: PageId;
  fallbackPageId: PageId;
  sceneEmoji: string;
  phraseId: PhraseId;
  words: WordId[];
  targetWordId: WordId;
  checkpointType: CheckpointType;
  comprehensionOptions: ComprehensionOption[];
}

interface StoryPack {
  ageBand: DecodableAgeBand;
  storyId: string;
  pages: StoryPage[];
  supportMissThreshold: number;
  maxHintStep: number;
  decodeWithinTwoAttemptsTarget: number;
  sequenceEvidenceTarget: number;
  participationTarget: number;
  maxChoiceCount: number;
  antiGuessGuard: ReadingAntiGuessGuard;
}

const BASE_STORY_PAGES: StoryPage[] = [
  {
    id: 'p01',
    fallbackPageId: 'p01',
    sceneEmoji: '🌿',
    phraseId: 'dubiHalachLagan',
    words: ['dubi', 'halach', 'lagan'],
    targetWordId: 'dubi',
    checkpointType: 'literal',
    comprehensionOptions: [
      { id: 'dubi', fallbackOptionId: 'dubi', isCorrect: true },
      { id: 'dag', fallbackOptionId: 'dag', isCorrect: false },
      { id: 'kelev', fallbackOptionId: 'kelev', isCorrect: false },
    ],
  },
  {
    id: 'p02',
    fallbackPageId: 'p02',
    sceneEmoji: '🐟',
    phraseId: 'dubiRaahDagKatan',
    words: ['dubi', 'raah', 'dag', 'katan'],
    targetWordId: 'dag',
    checkpointType: 'literal',
    comprehensionOptions: [
      {
        id: 'dagKatan',
        fallbackOptionId: 'dagKatan',
        isCorrect: true,
      },
      {
        id: 'etsGadol',
        fallbackOptionId: 'etsGadol',
        isCorrect: false,
      },
      {
        id: 'kovaKahol',
        fallbackOptionId: 'kovaKahol',
        isCorrect: false,
      },
    ],
  },
  {
    id: 'p03',
    fallbackPageId: 'p03',
    sceneEmoji: '🪨',
    phraseId: 'hadagSamTikAlSela',
    words: ['vehadag', 'sam', 'tik', 'al', 'sela'],
    targetWordId: 'tik',
    checkpointType: 'literal',
    comprehensionOptions: [
      { id: 'alSela', fallbackOptionId: 'alSela', isCorrect: true },
      {
        id: 'baMayim',
        fallbackOptionId: 'baMayim',
        isCorrect: false,
      },
      {
        id: 'alEts',
        fallbackOptionId: 'alEts',
        isCorrect: false,
      },
    ],
  },
  {
    id: 'p04',
    fallbackPageId: 'p04',
    sceneEmoji: '👋',
    phraseId: 'dubiKaraShalomDag',
    words: ['dubi', 'kara', 'shalom', 'dag'],
    targetWordId: 'shalom',
    checkpointType: 'literal',
    comprehensionOptions: [
      {
        id: 'shalomDag',
        fallbackOptionId: 'shalomDag',
        isCorrect: true,
      },
      {
        id: 'boLagan',
        fallbackOptionId: 'boLagan',
        isCorrect: false,
      },
      {
        id: 'lehitraot',
        fallbackOptionId: 'lehitraot',
        isCorrect: false,
      },
    ],
  },
  {
    id: 'p05',
    fallbackPageId: 'p05',
    sceneEmoji: '🥖',
    phraseId: 'hadagHeviLehemLedubi',
    words: ['vehadag', 'hevi', 'lehem', 'dubi'],
    targetWordId: 'lehem',
    checkpointType: 'literal',
    comprehensionOptions: [
      { id: 'lehem', fallbackOptionId: 'lehem', isCorrect: true },
      { id: 'sefer', fallbackOptionId: 'sefer', isCorrect: false },
      { id: 'kadur', fallbackOptionId: 'kadur', isCorrect: false },
    ],
  },
  {
    id: 'p06',
    fallbackPageId: 'p06',
    sceneEmoji: '✨',
    phraseId: 'dubiVehadagSamchuBagan',
    words: ['dubi', 'vehadag', 'samchu', 'bagan'],
    targetWordId: 'samchu',
    checkpointType: 'literal',
    comprehensionOptions: [
      {
        id: 'dubiVehadag',
        fallbackOptionId: 'dubiVehadag',
        isCorrect: true,
      },
      { id: 'rakHadag', fallbackOptionId: 'rakHadag', isCorrect: false },
      { id: 'rakDubi', fallbackOptionId: 'rakDubi', isCorrect: false },
    ],
  },
];

const STORY_PACKS: Record<DecodableAgeBand, StoryPack> = {
  '3-4': {
    ageBand: '3-4',
    storyId: 'lostSound',
    pages: BASE_STORY_PAGES.slice(0, READING_RUNTIME_MATRIX['3-4'].decodable.storyPages),
    supportMissThreshold: READING_RUNTIME_MATRIX['3-4'].decodable.supportMissThreshold,
    maxHintStep: READING_RUNTIME_MATRIX['3-4'].decodable.maxHintStep,
    decodeWithinTwoAttemptsTarget: READING_RUNTIME_MATRIX['3-4'].decodable.decodeWithinTwoAttemptsTarget,
    sequenceEvidenceTarget: READING_RUNTIME_MATRIX['3-4'].decodable.sequenceEvidenceTarget,
    participationTarget: READING_RUNTIME_MATRIX['3-4'].decodable.participationTarget,
    maxChoiceCount: READING_RUNTIME_MATRIX['3-4'].decodable.maxChoiceCount,
    antiGuessGuard: READING_RUNTIME_MATRIX['3-4'].decodable.antiGuessGuard,
  },
  '5-6': {
    ageBand: '5-6',
    storyId: 'yoavHintMap',
    pages: BASE_STORY_PAGES,
    supportMissThreshold: READING_RUNTIME_MATRIX['5-6'].decodable.supportMissThreshold,
    maxHintStep: READING_RUNTIME_MATRIX['5-6'].decodable.maxHintStep,
    decodeWithinTwoAttemptsTarget: READING_RUNTIME_MATRIX['5-6'].decodable.decodeWithinTwoAttemptsTarget,
    sequenceEvidenceTarget: READING_RUNTIME_MATRIX['5-6'].decodable.sequenceEvidenceTarget,
    participationTarget: READING_RUNTIME_MATRIX['5-6'].decodable.participationTarget,
    maxChoiceCount: READING_RUNTIME_MATRIX['5-6'].decodable.maxChoiceCount,
    antiGuessGuard: READING_RUNTIME_MATRIX['5-6'].decodable.antiGuessGuard,
  },
  '6-7': {
    ageBand: '6-7',
    storyId: 'tamarLockedFloor',
    pages: BASE_STORY_PAGES.map((page, pageIndex) => ({
      ...page,
      checkpointType: pageIndex === 3 ? 'evidence' : pageIndex % 2 === 1 ? 'sequence' : 'literal',
    })),
    supportMissThreshold: READING_RUNTIME_MATRIX['6-7'].decodable.supportMissThreshold,
    maxHintStep: READING_RUNTIME_MATRIX['6-7'].decodable.maxHintStep,
    decodeWithinTwoAttemptsTarget: READING_RUNTIME_MATRIX['6-7'].decodable.decodeWithinTwoAttemptsTarget,
    sequenceEvidenceTarget: READING_RUNTIME_MATRIX['6-7'].decodable.sequenceEvidenceTarget,
    participationTarget: READING_RUNTIME_MATRIX['6-7'].decodable.participationTarget,
    maxChoiceCount: READING_RUNTIME_MATRIX['6-7'].decodable.maxChoiceCount,
    antiGuessGuard: READING_RUNTIME_MATRIX['6-7'].decodable.antiGuessGuard,
  },
};

const SUCCESS_MESSAGE_ROTATION = [
  'games.decodableMicroStories.feedback.success.decodeExact',
  'games.decodableMicroStories.feedback.success.comprehensionExact',
  'games.decodableMicroStories.feedback.success.keepReading',
] as const;

const RETRY_MESSAGE_ROTATION = [
  'games.decodableMicroStories.feedback.retry.gentle',
  'games.decodableMicroStories.feedback.retry.focusText',
  'games.decodableMicroStories.feedback.retry.oneMoreTry',
] as const;

function createPageCounterRecord(storyPages: StoryPage[], initialValue: number): Record<PageId, number> {
  return storyPages.reduce<Record<PageId, number>>(
    (accumulator, page) => ({ ...accumulator, [page.id]: initialValue }),
    {} as Record<PageId, number>,
  );
}

function createPageFlagRecord(storyPages: StoryPage[], initialValue: boolean): Record<PageId, boolean> {
  return storyPages.reduce<Record<PageId, boolean>>(
    (accumulator, page) => ({ ...accumulator, [page.id]: initialValue }),
    {} as Record<PageId, boolean>,
  );
}

function applyChoiceCap(options: ComprehensionOption[], cap: number): ComprehensionOption[] {
  if (!Number.isFinite(cap) || cap < 1 || options.length <= cap) {
    return options;
  }

  const boundedCap = Math.max(1, Math.floor(cap));
  const correctOption = options.find((option) => option.isCorrect);
  const distractors = options.filter((option) => !option.isCorrect);

  if (!correctOption) {
    return options.slice(0, boundedCap);
  }

  return [correctOption, ...distractors.slice(0, Math.max(0, boundedCap - 1))].slice(0, boundedCap);
}

function toAgeBandSuffixFromFallbackKey(key: string): string {
  if (key.startsWith('games.decodableMicroStories.')) {
    return key.replace('games.decodableMicroStories.', '');
  }
  if (key.startsWith('parentDashboard.games.decodableMicroStories.')) {
    return key.replace('parentDashboard.games.decodableMicroStories.', '');
  }
  return key;
}

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

function getHintTrend(hintUsageByPage: number[]): HintTrend {
  const midpoint = Math.ceil(hintUsageByPage.length / 2);
  const firstHalf = hintUsageByPage.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
  const secondHalf = hintUsageByPage.slice(midpoint).reduce((sum, value) => sum + value, 0);

  if (secondHalf < firstHalf) return 'improving';
  if (secondHalf === firstHalf) return 'steady';
  return 'needs_support';
}

function toStableRange(firstAttemptSuccessRate: number): StableRange {
  if (firstAttemptSuccessRate >= 85) return '1-10';
  if (firstAttemptSuccessRate >= 60) return '1-5';
  return '1-3';
}

function toStars(firstAttemptSuccessRate: number, totalHints: number): 1 | 2 | 3 {
  if (firstAttemptSuccessRate >= 85 && totalHints <= 4) return 3;
  if (firstAttemptSuccessRate >= 60) return 2;
  return 1;
}

function toHintTrendSummaryKey(hintTrend: HintTrend): string {
  if (hintTrend === 'improving') return 'games.decodableMicroStories.summary.hintTrend.improving';
  if (hintTrend === 'steady') return 'games.decodableMicroStories.summary.hintTrend.steady';
  return 'games.decodableMicroStories.summary.hintTrend.needsSupport';
}

function toMessageClassName(tone: MessageTone): string {
  if (tone === 'hint') return 'decodable-story__message decodable-story__message--hint';
  if (tone === 'success') return 'decodable-story__message decodable-story__message--success';
  if (tone === 'error') return 'decodable-story__message decodable-story__message--error';
  return 'decodable-story__message';
}

export function DecodableStoryReaderGame({ level, onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');

  const activeAgeBand = useMemo(() => {
    const config = level.configJson;
    if (config && typeof config === 'object' && !Array.isArray(config)) {
      const rawAgeBand = (config as Record<string, unknown>).ageBand as DecodableProfileAgeBand | undefined;
      return toReadingAgeBand(rawAgeBand);
    }
    return '5-6';
  }, [level.configJson]);

  const activeStoryPack = useMemo(() => STORY_PACKS[activeAgeBand], [activeAgeBand]);
  const activeStoryPages = activeStoryPack.pages;

  const resolveAgeBandGameKey = useCallback(
    (suffix: string, fallbackKey: string): string => {
      const candidate = `games.decodableMicroStories.ageBand.${activeAgeBand}.${suffix}`;
      return i18n.exists(candidate, { ns: 'common' }) ? candidate : fallbackKey;
    },
    [activeAgeBand, i18n],
  );

  const resolveAgeBandParentKey = useCallback(
    (suffix: string, fallbackKey: string): string => {
      const candidate = `parentDashboard.games.decodableMicroStories.ageBand.${activeAgeBand}.${suffix}`;
      return i18n.exists(candidate, { ns: 'common' }) ? candidate : fallbackKey;
    },
    [activeAgeBand, i18n],
  );

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [hintStep, setHintStep] = useState(0);
  const [messageTone, setMessageTone] = useState<MessageTone>('neutral');
  const [messageKey, setMessageKey] = useState(() =>
    resolveAgeBandGameKey('instructions.intro', 'games.decodableMicroStories.instructions.intro'),
  );
  const [hintUsageByPage, setHintUsageByPage] = useState<Record<PageId, number>>(() =>
    createPageCounterRecord(activeStoryPages, 0),
  );
  const [wrongAttemptsByPage, setWrongAttemptsByPage] = useState<Record<PageId, number>>(() =>
    createPageCounterRecord(activeStoryPages, 0),
  );
  const [decodeReadyByPage, setDecodeReadyByPage] = useState<Record<PageId, boolean>>(() =>
    createPageFlagRecord(activeStoryPages, false),
  );
  const [participationByPage, setParticipationByPage] = useState<Record<PageId, boolean>>(() =>
    createPageFlagRecord(activeStoryPages, false),
  );
  const [firstAttemptSuccessCount, setFirstAttemptSuccessCount] = useState(0);
  const [decodeWithinTwoAttemptsCount, setDecodeWithinTwoAttemptsCount] = useState(0);
  const [sequenceEvidenceSuccessCount, setSequenceEvidenceSuccessCount] = useState(0);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [independentStreak, setIndependentStreak] = useState(0);
  const [supportMode, setSupportMode] = useState(false);
  const [supportModeActivations, setSupportModeActivations] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [scorePulse, setScorePulse] = useState(false);
  const [checkpointFeedback, setCheckpointFeedback] = useState<CheckpointFeedbackTone>('idle');

  const completionSentRef = useRef(false);
  const timeoutIdsRef = useRef<number[]>([]);
  const nonTargetTapTimesRef = useRef<number[]>([]);
  const quickResponseStreakRef = useRef(0);
  const lastResponseAtRef = useRef<number | null>(null);
  const currentPage = activeStoryPages[Math.min(currentPageIndex, activeStoryPages.length - 1)] ?? activeStoryPages[0];
  const independentMode = activeAgeBand !== '3-4' && !supportMode && independentStreak >= 3;

  const chooseAnswerKey = useMemo(
    () => resolveAgeBandGameKey('instructions.chooseAnswer', 'games.decodableMicroStories.instructions.chooseAnswer'),
    [resolveAgeBandGameKey],
  );
  const supportInstructionKey = useMemo(
    () => resolveAgeBandGameKey('instructions.supportMode', 'games.decodableMicroStories.instructions.supportMode'),
    [resolveAgeBandGameKey],
  );
  const independentInstructionKey = useMemo(
    () => resolveAgeBandGameKey('instructions.independentTurn', 'games.decodableMicroStories.instructions.independentTurn'),
    [resolveAgeBandGameKey],
  );
  const modelReplayKey = useMemo(
    () => resolveAgeBandGameKey('instructions.modelReplay', 'games.decodableMicroStories.instructions.modelReplay'),
    [resolveAgeBandGameKey],
  );
  const decodeFirstInstructionKey = useMemo(
    () => resolveAgeBandGameKey('instructions.decodeFirst', 'games.decodableMicroStories.instructions.decodeFirst'),
    [resolveAgeBandGameKey],
  );
  const completionSummaryKey = useMemo(
    () => resolveAgeBandGameKey('completion.summary', 'games.decodableMicroStories.completion.summary'),
    [resolveAgeBandGameKey],
  );
  const completionTitleKey = useMemo(
    () => resolveAgeBandGameKey('completion.title', 'games.decodableMicroStories.completion.title'),
    [resolveAgeBandGameKey],
  );
  const completionNextStepKey = useMemo(
    () => resolveAgeBandGameKey('completion.nextStep', 'games.decodableMicroStories.completion.nextStep'),
    [resolveAgeBandGameKey],
  );
  const retryControlKey = useMemo(
    () => resolveAgeBandGameKey('controls.retry', 'games.decodableMicroStories.controls.retry'),
    [resolveAgeBandGameKey],
  );
  const replayPhraseHintKey = useMemo(
    () => resolveAgeBandGameKey('hints.replayPhrase', 'games.decodableMicroStories.hints.replayPhrase'),
    [resolveAgeBandGameKey],
  );
  const antiGuessHintKey = useMemo(
    () =>
      activeAgeBand === '3-4'
        ? replayPhraseHintKey
        : resolveAgeBandGameKey('hints.decodeBeforeAnswer', 'games.decodableMicroStories.hints.decodeBeforeAnswer'),
    [activeAgeBand, replayPhraseHintKey, resolveAgeBandGameKey],
  );

  const pageNarrationKey = useMemo(() => {
    return resolveAgeBandGameKey(
      `stories.${activeStoryPack.storyId}.pages.${currentPage.id}.narration.text`,
      `games.decodableMicroStories.pages.${currentPage.fallbackPageId}.narration.text`,
    );
  }, [activeStoryPack.storyId, currentPage.fallbackPageId, currentPage.id, resolveAgeBandGameKey]);

  const pageDecodePromptKey = useMemo(() => {
    return resolveAgeBandGameKey(
      `stories.${activeStoryPack.storyId}.pages.${currentPage.id}.decodePrompt.text`,
      `games.decodableMicroStories.pages.${currentPage.fallbackPageId}.decodePrompt.text`,
    );
  }, [activeStoryPack.storyId, currentPage.fallbackPageId, currentPage.id, resolveAgeBandGameKey]);

  const pageComprehensionPromptKey = useMemo(() => {
    return resolveAgeBandGameKey(
      `stories.${activeStoryPack.storyId}.pages.${currentPage.id}.comprehension.prompt`,
      `games.decodableMicroStories.pages.${currentPage.fallbackPageId}.comprehension.prompt`,
    );
  }, [activeStoryPack.storyId, currentPage.fallbackPageId, currentPage.id, resolveAgeBandGameKey]);

  const resolveOptionKey = useCallback(
    (page: StoryPage, option: ComprehensionOption): string => {
      return resolveAgeBandGameKey(
        `stories.${activeStoryPack.storyId}.pages.${page.id}.comprehension.options.${option.id}`,
        `games.decodableMicroStories.pages.${page.fallbackPageId}.comprehension.options.${option.fallbackOptionId}`,
      );
    },
    [activeStoryPack.storyId, resolveAgeBandGameKey],
  );

  const phrasePronunciationKey = `phrases.pronunciation.${currentPage.phraseId}`;
  const sequenceEvidenceTotal = useMemo(
    () => activeStoryPages.filter((page) => page.checkpointType !== 'literal').length,
    [activeStoryPages],
  );
  const participationRate = useMemo(() => {
    const engagedPages = activeStoryPages.filter((page) => participationByPage[page.id]).length;
    return Math.round((engagedPages / activeStoryPages.length) * 100);
  }, [activeStoryPages, participationByPage]);
  const decodeAccuracy = useMemo(
    () => Math.round((decodeWithinTwoAttemptsCount / activeStoryPages.length) * 100),
    [activeStoryPages.length, decodeWithinTwoAttemptsCount],
  );
  const sequenceEvidenceScore = useMemo(
    () =>
      sequenceEvidenceTotal === 0 ? 0 : Math.round((sequenceEvidenceSuccessCount / Math.max(1, sequenceEvidenceTotal)) * 100),
    [sequenceEvidenceSuccessCount, sequenceEvidenceTotal],
  );
  const completionPrimaryScore = useMemo(() => {
    if (activeAgeBand === '3-4') return participationRate;
    if (activeAgeBand === '6-7') {
      return Math.round((decodeAccuracy + sequenceEvidenceScore) / 2);
    }
    return decodeAccuracy;
  }, [activeAgeBand, decodeAccuracy, participationRate, sequenceEvidenceScore]);

  const playKey = useCallback(
    (key: string, interrupt = false) => {
      const audioPath = keyToAudioPath(key);
      if (interrupt) {
        void audio.playNow(audioPath);
        return;
      }
      void audio.play(audioPath);
    },
    [audio],
  );

  const scheduleTimeout = useCallback((callback: () => void, delayMs: number) => {
    const timeoutId = window.setTimeout(callback, delayMs);
    timeoutIdsRef.current.push(timeoutId);
  }, []);

  const markParticipation = useCallback((pageId: PageId) => {
    setParticipationByPage((previous) => {
      if (previous[pageId]) return previous;
      return { ...previous, [pageId]: true };
    });
  }, []);

  const markDecodeReady = useCallback(
    (pageId: PageId) => {
      setDecodeReadyByPage((previous) => {
        if (previous[pageId]) return previous;
        return { ...previous, [pageId]: true };
      });
      markParticipation(pageId);
    },
    [markParticipation],
  );

  const playPageNarration = useCallback(
    (interrupt = false) => {
      const queue = [pageNarrationKey];
      if (!independentMode) {
        queue.push(pageDecodePromptKey);
      }
      if (supportMode) {
        queue.push(replayPhraseHintKey);
        queue.push(phrasePronunciationKey);
      }

      const [firstKey, ...remainingKeys] = queue;
      if (!firstKey) return;

      playKey(firstKey, interrupt);
      remainingKeys.forEach((key) => {
        playKey(key);
      });
    },
    [
      independentMode,
      pageDecodePromptKey,
      pageNarrationKey,
      phrasePronunciationKey,
      playKey,
      replayPhraseHintKey,
      supportMode,
    ],
  );

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIdsRef.current = [];
    };
  }, []);

  useEffect(() => {
    completionSentRef.current = false;
    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
    nonTargetTapTimesRef.current = [];
    quickResponseStreakRef.current = 0;
    lastResponseAtRef.current = null;
    setCurrentPageIndex(0);
    setSelectedOptionId(null);
    setLocked(false);
    setHintStep(0);
    setMessageTone('neutral');
    setMessageKey(resolveAgeBandGameKey('instructions.intro', 'games.decodableMicroStories.instructions.intro'));
    setHintUsageByPage(createPageCounterRecord(activeStoryPages, 0));
    setWrongAttemptsByPage(createPageCounterRecord(activeStoryPages, 0));
    setDecodeReadyByPage(createPageFlagRecord(activeStoryPages, false));
    setParticipationByPage(createPageFlagRecord(activeStoryPages, false));
    setFirstAttemptSuccessCount(0);
    setDecodeWithinTwoAttemptsCount(0);
    setSequenceEvidenceSuccessCount(0);
    setConsecutiveMisses(0);
    setIndependentStreak(0);
    setSupportMode(false);
    setSupportModeActivations(0);
    setCompleted(false);
    setShowCelebration(false);
    setScorePulse(false);
    setCheckpointFeedback('idle');
  }, [activeAgeBand, activeStoryPages, resolveAgeBandGameKey]);

  useEffect(() => {
    if (completed) return;

    setSelectedOptionId(null);
    setLocked(false);
    setHintStep(0);
    setScorePulse(false);
    setCheckpointFeedback('idle');
    nonTargetTapTimesRef.current = [];
    quickResponseStreakRef.current = 0;
    lastResponseAtRef.current = null;
    setDecodeReadyByPage((previous) => ({ ...previous, [currentPage.id]: false }));
    setMessageTone(supportMode ? 'hint' : 'neutral');
    setMessageKey(supportMode ? supportInstructionKey : chooseAnswerKey);
    playPageNarration(true);
  }, [
    chooseAnswerKey,
    completed,
    currentPage.id,
    playPageNarration,
    supportInstructionKey,
    supportMode,
  ]);

  const instructionKey = useMemo(() => {
    if (completed) return completionSummaryKey;
    if (messageTone !== 'neutral') return messageKey;
    if (supportMode) return supportInstructionKey;
    if (independentMode) return independentInstructionKey;
    return chooseAnswerKey;
  }, [
    chooseAnswerKey,
    completed,
    completionSummaryKey,
    independentInstructionKey,
    independentMode,
    messageKey,
    messageTone,
    supportInstructionKey,
    supportMode,
  ]);

  const hintTrend = useMemo(
    () => getHintTrend(activeStoryPages.map((page) => hintUsageByPage[page.id] ?? 0)),
    [activeStoryPages, hintUsageByPage],
  );

  const hintTrendSummaryKey = useMemo(() => {
    const fallback = toHintTrendSummaryKey(hintTrend);
    return resolveAgeBandGameKey(toAgeBandSuffixFromFallbackKey(fallback), fallback);
  }, [hintTrend, resolveAgeBandGameKey]);

  const adaptiveBadgeKey = useMemo(() => {
    if (supportMode) {
      return resolveAgeBandGameKey('adaptive.supportMode', 'games.decodableMicroStories.adaptive.supportMode');
    }
    if (independentMode) {
      return resolveAgeBandGameKey('adaptive.independentMode', 'games.decodableMicroStories.adaptive.independentMode');
    }
    return null;
  }, [independentMode, resolveAgeBandGameKey, supportMode]);

  const reduceChoicesThreshold = activeAgeBand === '3-4' ? 1 : activeStoryPack.maxHintStep;
  const shouldReduceChoices = supportMode || hintStep >= reduceChoicesThreshold;
  const visibleComprehensionOptions = useMemo(() => {
    const cappedOptions = applyChoiceCap(currentPage.comprehensionOptions, activeStoryPack.maxChoiceCount);
    if (!shouldReduceChoices) return cappedOptions;
    const correctOption = cappedOptions.find((option) => option.isCorrect);
    const firstDistractor = cappedOptions.find((option) => !option.isCorrect);
    if (correctOption && firstDistractor) {
      return [correctOption, firstDistractor];
    }
    return cappedOptions;
  }, [activeStoryPack.maxChoiceCount, currentPage.comprehensionOptions, shouldReduceChoices]);

  const completeSession = useCallback(() => {
    if (completionSentRef.current) return;
    completionSentRef.current = true;

    setCompleted(true);
    setLocked(true);
    setMessageTone('success');
    setMessageKey(completionSummaryKey);

    const hintVector = activeStoryPages.map((page) => hintUsageByPage[page.id] ?? 0);
    const totalHints = hintVector.reduce((sum, value) => sum + value, 0) + supportModeActivations;
    const summaryHintTrend = getHintTrend(hintVector);
    const passedGate =
      activeAgeBand === '3-4'
        ? participationRate >= activeStoryPack.participationTarget
        : activeAgeBand === '6-7'
          ? decodeAccuracy >= activeStoryPack.decodeWithinTwoAttemptsTarget &&
            sequenceEvidenceScore >= activeStoryPack.sequenceEvidenceTarget
          : decodeAccuracy >= activeStoryPack.decodeWithinTwoAttemptsTarget;

    onComplete({
      completed: true,
      score: completionPrimaryScore,
      stars: toStars(completionPrimaryScore, totalHints),
      roundsCompleted: activeStoryPages.length,
      summaryMetrics: {
        highestStableRange: toStableRange(completionPrimaryScore),
        firstAttemptSuccessRate: completionPrimaryScore,
        hintTrend: summaryHintTrend,
        ageBand: activeAgeBand,
        listenParticipation: activeAgeBand === '3-4' ? participationRate : undefined,
        decodeAccuracy: activeAgeBand !== '3-4' ? decodeAccuracy : undefined,
        sequenceEvidenceScore: activeAgeBand === '6-7' ? sequenceEvidenceScore : undefined,
        gatePassed: passedGate,
      },
    });

    playKey(completionTitleKey, true);
    playKey(completionNextStepKey);
  }, [
    activeAgeBand,
    activeStoryPages,
    activeStoryPack.decodeWithinTwoAttemptsTarget,
    activeStoryPack.participationTarget,
    activeStoryPack.sequenceEvidenceTarget,
    completionNextStepKey,
    completionPrimaryScore,
    completionSummaryKey,
    completionTitleKey,
    decodeAccuracy,
    hintUsageByPage,
    onComplete,
    participationRate,
    playKey,
    sequenceEvidenceScore,
    supportModeActivations,
  ]);

  const handleReplayInstruction = useCallback(() => {
    playKey(instructionKey, true);
    markParticipation(currentPage.id);
  }, [currentPage.id, instructionKey, markParticipation, playKey]);

  const handleReplayNarration = useCallback(() => {
    setMessageTone('neutral');
    setMessageKey(modelReplayKey);
    markParticipation(currentPage.id);
    playPageNarration(true);
  }, [currentPage.id, markParticipation, modelReplayKey, playPageNarration]);

  const handleReplayPhrase = useCallback(() => {
    markDecodeReady(currentPage.id);
    playKey(phrasePronunciationKey, true);
  }, [currentPage.id, markDecodeReady, phrasePronunciationKey, playKey]);

  const handleReplayDecodePrompt = useCallback(() => {
    markDecodeReady(currentPage.id);
    playKey(pageDecodePromptKey, true);
  }, [currentPage.id, markDecodeReady, pageDecodePromptKey, playKey]);

  const handleReplayComprehensionPrompt = useCallback(() => {
    markParticipation(currentPage.id);
    playKey(pageComprehensionPromptKey, true);
  }, [currentPage.id, markParticipation, pageComprehensionPromptKey, playKey]);

  const handlePlayWord = useCallback(
    (wordId: WordId) => {
      markDecodeReady(currentPage.id);
      playKey(`words.pronunciation.${wordId}`, true);
    },
    [currentPage.id, markDecodeReady, playKey],
  );

  const handleRetryCheckpoint = useCallback(() => {
    if (completed) return;
    nonTargetTapTimesRef.current = [];
    quickResponseStreakRef.current = 0;
    lastResponseAtRef.current = null;
    setSelectedOptionId(null);
    setHintStep(0);
    setCheckpointFeedback('idle');
    setMessageTone('neutral');
    setMessageKey(chooseAnswerKey);
    playKey(retryControlKey, true);
  }, [chooseAnswerKey, completed, playKey, retryControlKey]);

  const hintKeysByStep = useMemo(() => {
    if (activeAgeBand === '3-4') {
      return [
        resolveAgeBandGameKey('hints.replayPhrase', 'games.decodableMicroStories.hints.replayPhrase'),
        resolveAgeBandGameKey('hints.reduceChoices', 'games.decodableMicroStories.hints.reduceChoices'),
      ];
    }
    if (activeAgeBand === '6-7') {
      return [
        resolveAgeBandGameKey('hints.replayPhrase', 'games.decodableMicroStories.hints.replayPhrase'),
        resolveAgeBandGameKey('hints.decodeBeforeAnswer', 'games.decodableMicroStories.hints.decodeBeforeAnswer'),
        resolveAgeBandGameKey('hints.reduceChoices', 'games.decodableMicroStories.hints.reduceChoices'),
      ];
    }
    return [
      resolveAgeBandGameKey('hints.replayPhrase', 'games.decodableMicroStories.hints.replayPhrase'),
      resolveAgeBandGameKey('hints.syllableCue', 'games.decodableMicroStories.hints.syllableCue'),
      resolveAgeBandGameKey('hints.graphemeHighlight', 'games.decodableMicroStories.hints.graphemeHighlight'),
    ];
  }, [activeAgeBand, resolveAgeBandGameKey]);

  const handleHint = useCallback(() => {
    if (completed || locked) return;

    const nextHintStep = Math.min(activeStoryPack.maxHintStep, hintStep + 1);
    if (nextHintStep === hintStep) return;

    setHintStep(nextHintStep);
    setHintUsageByPage((previous) => ({
      ...previous,
      [currentPage.id]: (previous[currentPage.id] ?? 0) + 1,
    }));

    const hintKey = hintKeysByStep[nextHintStep - 1] ?? hintKeysByStep[hintKeysByStep.length - 1];
    setMessageTone('hint');
    setMessageKey(hintKey);
    markDecodeReady(currentPage.id);
    playKey(hintKey, true);

    if (nextHintStep === 1) {
      playKey(phrasePronunciationKey);
    }
  }, [
    activeStoryPack.maxHintStep,
    completed,
    currentPage.id,
    hintKeysByStep,
    hintStep,
    locked,
    markDecodeReady,
    phrasePronunciationKey,
    playKey,
  ]);

  const triggerAntiGuessGuard = useCallback(() => {
    setLocked(true);
    setMessageTone('hint');
    setMessageKey(antiGuessHintKey);
    playKey(antiGuessHintKey, true);
    scheduleTimeout(() => {
      setLocked(false);
      setSelectedOptionId(null);
      setMessageTone('neutral');
      setMessageKey(decodeFirstInstructionKey);
      playKey(pageDecodePromptKey, true);
    }, activeStoryPack.antiGuessGuard.pauseMs);
  }, [
    activeStoryPack.antiGuessGuard.pauseMs,
    antiGuessHintKey,
    decodeFirstInstructionKey,
    pageDecodePromptKey,
    playKey,
    scheduleTimeout,
  ]);

  const handleSelectOption = useCallback(
    (option: ComprehensionOption) => {
      if (locked || completed) return;

      if (!(decodeReadyByPage[currentPage.id] ?? false)) {
        setMessageTone('hint');
        setMessageKey(decodeFirstInstructionKey);
        playKey(decodeFirstInstructionKey, true);
        return;
      }

      setSelectedOptionId(option.id);
      const wrongAttempts = wrongAttemptsByPage[currentPage.id] ?? 0;

      if (option.isCorrect) {
        nonTargetTapTimesRef.current = [];
        quickResponseStreakRef.current = 0;
        lastResponseAtRef.current = null;
        const firstTrySuccess = wrongAttempts === 0 && hintStep === 0;
        const solvedWithinTwoAttempts = wrongAttempts <= 1;
        setLocked(true);
        setConsecutiveMisses(0);
        setShowCelebration(true);
        setCheckpointFeedback('success');
        markParticipation(currentPage.id);
        scheduleTimeout(() => {
          setCheckpointFeedback('idle');
        }, 540);

        if (solvedWithinTwoAttempts) {
          setDecodeWithinTwoAttemptsCount((count) => count + 1);
        }
        if (firstTrySuccess) {
          setFirstAttemptSuccessCount((count) => count + 1);
          setScorePulse(true);
          scheduleTimeout(() => {
            setScorePulse(false);
          }, 420);
          if (activeAgeBand !== '3-4') {
            setIndependentStreak((streak) => {
              const nextStreak = streak + 1;
              if (nextStreak >= 3) {
                setSupportMode(false);
              }
              return nextStreak;
            });
          }
        } else {
          setIndependentStreak(0);
        }

        if (currentPage.checkpointType !== 'literal') {
          setSequenceEvidenceSuccessCount((count) => count + 1);
        }

        const successFallbackKey = SUCCESS_MESSAGE_ROTATION[currentPageIndex % SUCCESS_MESSAGE_ROTATION.length];
        const successKey = resolveAgeBandGameKey(toAgeBandSuffixFromFallbackKey(successFallbackKey), successFallbackKey);
        setMessageTone('success');
        setMessageKey(successKey);
        playKey(successKey, true);

        scheduleTimeout(() => {
          setShowCelebration(false);
        }, 850);

        scheduleTimeout(() => {
          if (currentPageIndex === activeStoryPages.length - 1) {
            completeSession();
            return;
          }
          setCurrentPageIndex((index) => Math.min(index + 1, activeStoryPages.length - 1));
        }, 950);
        return;
      }

      const nextWrongAttempts = wrongAttempts + 1;
      const guardConfig = activeStoryPack.antiGuessGuard;
      const now = performance.now();
      nonTargetTapTimesRef.current = nonTargetTapTimesRef.current
        .filter((timestamp) => now - timestamp <= guardConfig.rapidTapWindowMs)
        .concat(now);
      if (guardConfig.shortResponseWindowMs) {
        const responseGapMs = lastResponseAtRef.current === null ? Infinity : now - lastResponseAtRef.current;
        quickResponseStreakRef.current = responseGapMs < guardConfig.shortResponseWindowMs
          ? quickResponseStreakRef.current + 1
          : 1;
      } else {
        quickResponseStreakRef.current = 0;
      }
      lastResponseAtRef.current = now;
      setWrongAttemptsByPage((previous) => ({
        ...previous,
        [currentPage.id]: nextWrongAttempts,
      }));
      setIndependentStreak(0);
      setScorePulse(false);
      setCheckpointFeedback('error');
      scheduleTimeout(() => {
        setCheckpointFeedback('idle');
      }, 420);
      setConsecutiveMisses((previousMisses) => {
        const nextMisses = previousMisses + 1;
        if (nextMisses >= activeStoryPack.supportMissThreshold) {
          setSupportMode((wasSupportMode) => {
            if (!wasSupportMode) {
              setSupportModeActivations((count) => count + 1);
            }
            return true;
          });
        }
        return nextMisses;
      });

      const retryFallbackKey = RETRY_MESSAGE_ROTATION[Math.min(nextWrongAttempts - 1, RETRY_MESSAGE_ROTATION.length - 1)];
      const retryKey = resolveAgeBandGameKey(toAgeBandSuffixFromFallbackKey(retryFallbackKey), retryFallbackKey);
      setMessageTone('error');
      setMessageKey(retryKey);
      playKey(retryKey, true);

      if (nextWrongAttempts === 1 && hintStep === 0) {
        setHintStep(1);
        setHintUsageByPage((previous) => ({
          ...previous,
          [currentPage.id]: (previous[currentPage.id] ?? 0) + 1,
        }));
      }

      if (nextWrongAttempts >= 3) {
        setHintStep(activeStoryPack.maxHintStep);
        playKey(phrasePronunciationKey);
      }

      const rapidTapGuardTriggered = nonTargetTapTimesRef.current.length >= guardConfig.rapidTapCount;
      const quickResponseGuardTriggered = Boolean(
        guardConfig.shortResponseStreakThreshold &&
        quickResponseStreakRef.current >= guardConfig.shortResponseStreakThreshold,
      );
      if (rapidTapGuardTriggered || quickResponseGuardTriggered) {
        nonTargetTapTimesRef.current = [];
        quickResponseStreakRef.current = 0;
        triggerAntiGuessGuard();
      }
    },
    [
      activeAgeBand,
      activeStoryPack.antiGuessGuard,
      activeStoryPack.maxHintStep,
      activeStoryPack.supportMissThreshold,
      activeStoryPages.length,
      completeSession,
      completed,
      currentPage.checkpointType,
      currentPage.id,
      currentPageIndex,
      decodeFirstInstructionKey,
      decodeReadyByPage,
      hintStep,
      locked,
      markParticipation,
      phrasePronunciationKey,
      playKey,
      resolveAgeBandGameKey,
      scheduleTimeout,
      triggerAntiGuessGuard,
      wrongAttemptsByPage,
    ],
  );

  const hintCount = hintUsageByPage[currentPage.id] ?? 0;
  const wrongAttempts = wrongAttemptsByPage[currentPage.id] ?? 0;
  const displayedPage = completed ? activeStoryPages.length : currentPageIndex + 1;
  const parentProgressSummaryKey = resolveAgeBandParentKey(
    'progressSummary',
    'parentDashboard.games.decodableMicroStories.progressSummary',
  );
  const parentNextStepKey = resolveAgeBandParentKey('nextStep', 'parentDashboard.games.decodableMicroStories.nextStep');

  return (
    <Card padding="lg" className="decodable-story__shell">
      {showCelebration && <SuccessCelebration className="decodable-story__celebration" />}

      <header className="decodable-story__header">
        <div className="decodable-story__title-wrap">
          <h2 className="decodable-story__title">{t('games.decodableMicroStories.title')}</h2>
          <p className="decodable-story__subtitle">{t('games.decodableMicroStories.subtitle')}</p>
        </div>
        {adaptiveBadgeKey && <p className="decodable-story__adaptive-badge">{t(adaptiveBadgeKey as any)}</p>}
      </header>

      <div className="decodable-story__progress-row">
        <p className="decodable-story__progress-label" aria-live="polite">
          {t('games.decodableMicroStories.status.pageLabel', {
            current: displayedPage,
            total: activeStoryPages.length,
          })}
        </p>
        <div className="decodable-story__progress-track" aria-hidden="true">
          {activeStoryPages.map((page, index) => {
            const state = completed || index < currentPageIndex ? 'done' : index === currentPageIndex ? 'active' : 'pending';
            return (
              <span
                key={page.id}
                className={`decodable-story__progress-dot decodable-story__progress-dot--${state}`}
              />
            );
          })}
        </div>
      </div>
      <div className="decodable-story__score-strip" aria-live="polite">
        <span className={`decodable-story__score-pill ${scorePulse ? 'decodable-story__score-pill--pulse' : ''}`}>
          ⭐ {firstAttemptSuccessCount}
        </span>
        <span className="decodable-story__score-pill">
          🎯 {displayedPage}/{activeStoryPages.length}
        </span>
        {!completed && supportMode && <span className="decodable-story__score-pill">💡 {hintCount}</span>}
      </div>

      {!completed && (
        <>
          <section className="decodable-story__story-card">
            <div className="decodable-story__story-row">
              <p className="decodable-story__scene" aria-hidden="true">
                {currentPage.sceneEmoji}
              </p>
              <p className="decodable-story__narration">{t(pageNarrationKey as any)}</p>
              <button
                type="button"
                className="decodable-story__audio-inline"
                onClick={handleReplayNarration}
                aria-label={t('games.decodableMicroStories.controls.replay')}
              >
                ▶
              </button>
            </div>

            <div className="decodable-story__story-row">
              <p className="decodable-story__decode-prompt">{t(pageDecodePromptKey as any)}</p>
              <button
                type="button"
                className="decodable-story__audio-inline"
                onClick={handleReplayDecodePrompt}
                aria-label={t('games.decodableMicroStories.controls.replay')}
              >
                ▶
              </button>
            </div>

            <div className="decodable-story__story-row decodable-story__story-row--phrase">
              <p className="decodable-story__phrase">{t(phrasePronunciationKey as any)}</p>
              <button
                type="button"
                className="decodable-story__audio-inline"
                onClick={handleReplayPhrase}
                aria-label={t('games.decodableMicroStories.controls.replay')}
              >
                ▶
              </button>
            </div>

            <div className="decodable-story__word-grid" role="group" aria-label={t('games.decodableMicroStories.instructions.tapWord')}>
              {currentPage.words.map((wordId) => (
                <button
                  key={`${currentPage.id}-${wordId}`}
                  type="button"
                  className={`decodable-story__word-button ${
                    hintStep >= activeStoryPack.maxHintStep && wordId === currentPage.targetWordId ? 'is-highlight' : ''
                  }`}
                  onClick={() => handlePlayWord(wordId)}
                >
                  {t(`words.pronunciation.${wordId}` as any)}
                </button>
              ))}
            </div>
          </section>

          <section className="decodable-story__status-panel">
            <div className="decodable-story__message-row">
              <p className={toMessageClassName(messageTone)} aria-live="polite">
                {t(messageKey as any)}
              </p>
              <button
                type="button"
                className="decodable-story__audio-inline"
                onClick={handleReplayInstruction}
                aria-label={t('games.decodableMicroStories.controls.replay')}
              >
                ▶
              </button>
            </div>

            <div className="decodable-story__controls" role="group" aria-label={t('games.decodableMicroStories.instructions.iconControls')}>
              <button
                type="button"
                className="decodable-story__icon-button"
                onClick={handleReplayNarration}
                aria-label={t('games.decodableMicroStories.controls.replay')}
              >
                <span aria-hidden="true">▶</span>
              </button>
              <button
                type="button"
                className="decodable-story__icon-button"
                onClick={handleRetryCheckpoint}
                aria-label={t('games.decodableMicroStories.controls.retry')}
              >
                <span aria-hidden="true">↻</span>
              </button>
              <button
                type="button"
                className="decodable-story__icon-button"
                onClick={handleHint}
                aria-label={t('games.decodableMicroStories.controls.hint')}
                disabled={locked}
              >
                <span aria-hidden="true">💡</span>
              </button>
            </div>

            <div
              className={`decodable-story__checkpoint-card ${
                checkpointFeedback === 'success'
                  ? 'decodable-story__checkpoint-card--success'
                  : checkpointFeedback === 'error'
                    ? 'decodable-story__checkpoint-card--error'
                    : ''
              }`}
            >
              <div className="decodable-story__story-row">
                <p className="decodable-story__checkpoint-prompt">{t(pageComprehensionPromptKey as any)}</p>
                <button
                  type="button"
                  className="decodable-story__audio-inline"
                  onClick={handleReplayComprehensionPrompt}
                  aria-label={t('games.decodableMicroStories.controls.replay')}
                >
                  ▶
                </button>
              </div>

              <div className="decodable-story__options-grid" role="group" aria-label={t('games.decodableMicroStories.instructions.chooseAnswer')}>
                {visibleComprehensionOptions.map((option) => {
                  const isSelected = selectedOptionId === option.id;
                  const optionTone = isSelected
                    ? option.isCorrect
                      ? 'is-correct'
                      : 'is-wrong'
                    : '';
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`decodable-story__option ${optionTone}`}
                      onClick={() => handleSelectOption(option)}
                      aria-pressed={isSelected}
                      disabled={locked}
                    >
                      {t(resolveOptionKey(currentPage, option) as any)}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}

      {completed && (
        <section className="decodable-story__completion">
          <h3 className="decodable-story__completion-title">{t(completionTitleKey as any)}</h3>
          <p className="decodable-story__completion-line">
            {t(parentProgressSummaryKey as any, {
              successRate: completionPrimaryScore,
              hintTrend: t(hintTrendSummaryKey as any),
            })}
          </p>
          <p className="decodable-story__completion-line">
            {activeAgeBand === '3-4'
              ? `👂 ${participationRate}%`
              : activeAgeBand === '6-7'
                ? `📖 ${decodeAccuracy}% · 🧩 ${sequenceEvidenceScore}%`
                : `📖 ${decodeAccuracy}%`}
          </p>
          <p className="decodable-story__completion-line">{t(hintTrendSummaryKey as any)}</p>
          <p className="decodable-story__completion-line">{t(parentNextStepKey as any)}</p>
        </section>
      )}

      <footer className="decodable-story__footer" aria-hidden={completed}>
        <p className="decodable-story__footer-item">
          {t('games.decodableMicroStories.status.hintsUsed', { count: hintCount })}
        </p>
        <p className="decodable-story__footer-item">
          {t('games.decodableMicroStories.status.retryCount', { count: wrongAttempts })}
        </p>
        <p className="decodable-story__footer-item">
          {t('games.decodableMicroStories.status.consecutiveMisses', { count: consecutiveMisses })}
        </p>
      </footer>

      <style>{`
        .decodable-story__shell {
          direction: rtl;
          display: grid;
          gap: var(--space-md);
          background:
            radial-gradient(circle at 8% 12%, color-mix(in srgb, var(--color-theme-secondary) 20%, transparent), transparent 36%),
            linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 92%, white 8%) 0%, var(--color-bg-card) 100%);
          border: 2px solid color-mix(in srgb, var(--color-theme-secondary) 38%, transparent);
          position: relative;
          overflow: hidden;
        }

        .decodable-story__celebration {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
        }

        .decodable-story__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-sm);
          flex-wrap: wrap;
        }

        .decodable-story__title-wrap {
          display: grid;
          gap: var(--space-2xs);
        }

        .decodable-story__title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: clamp(1.35rem, 1.1rem + 1.1vw, 1.9rem);
        }

        .decodable-story__subtitle {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .decodable-story__adaptive-badge {
          margin: 0;
          padding-block: var(--space-2xs);
          padding-inline: var(--space-sm);
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-theme-secondary) 22%, transparent);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
        }

        .decodable-story__progress-row {
          display: grid;
          gap: var(--space-xs);
        }

        .decodable-story__progress-label {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .decodable-story__progress-track {
          display: grid;
          grid-template-columns: repeat(${activeStoryPages.length}, minmax(0, 1fr));
          gap: var(--space-2xs);
        }

        .decodable-story__progress-dot {
          min-block-size: 10px;
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-text-secondary) 20%, transparent);
          transition: transform 160ms ease, background 160ms ease;
        }

        .decodable-story__progress-dot--done {
          background: color-mix(in srgb, var(--color-theme-secondary) 74%, white 26%);
        }

        .decodable-story__progress-dot--active {
          background: var(--color-accent-primary);
          transform: scaleY(1.15);
          animation: decodable-story-progress-breathe 1.3s ease-in-out infinite;
        }

        .decodable-story__score-strip {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs);
        }

        .decodable-story__score-pill {
          margin: 0;
          padding-inline: var(--space-sm);
          padding-block: var(--space-2xs);
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-theme-secondary) 14%, transparent);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
        }

        .decodable-story__score-pill--pulse {
          animation: decodable-story-score-pulse 320ms ease;
        }

        .decodable-story__story-card {
          display: grid;
          gap: var(--space-sm);
          padding: var(--space-md);
          border-radius: var(--radius-lg);
          background: color-mix(in srgb, var(--color-bg-primary) 66%, transparent);
          border: 1px solid color-mix(in srgb, var(--color-theme-secondary) 30%, transparent);
        }

        .decodable-story__story-row {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: var(--space-xs);
        }

        .decodable-story__story-row--phrase {
          padding-block-start: var(--space-2xs);
          border-block-start: 1px dashed color-mix(in srgb, var(--color-theme-secondary) 34%, transparent);
        }

        .decodable-story__scene {
          margin: 0;
          font-size: 1.9rem;
          line-height: 1;
        }

        .decodable-story__narration,
        .decodable-story__decode-prompt,
        .decodable-story__phrase,
        .decodable-story__checkpoint-prompt {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
          line-height: 1.6;
        }

        .decodable-story__phrase {
          font-weight: var(--font-weight-bold);
          color: color-mix(in srgb, var(--color-text-primary) 90%, var(--color-theme-secondary) 10%);
        }

        .decodable-story__audio-inline {
          min-inline-size: 48px;
          min-block-size: 48px;
          border-radius: var(--radius-full);
          border: 1px solid color-mix(in srgb, var(--color-theme-secondary) 46%, transparent);
          background: color-mix(in srgb, var(--color-bg-card) 85%, white 15%);
          color: var(--color-text-primary);
          font-size: 1.05rem;
          cursor: pointer;
          transition: transform 140ms ease, background 140ms ease;
        }

        .decodable-story__audio-inline:active {
          transform: scale(0.95);
        }

        .decodable-story__word-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: var(--space-xs);
          margin-block-start: var(--space-2xs);
        }

        .decodable-story__word-button {
          min-block-size: 52px;
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-theme-secondary) 42%, transparent);
          background: var(--color-bg-card);
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
          padding-inline: var(--space-sm);
          padding-block: var(--space-xs);
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 120ms ease;
        }

        .decodable-story__word-button:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

        .decodable-story__word-button.is-highlight {
          border-color: var(--color-accent-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-primary) 24%, transparent);
          background: color-mix(in srgb, var(--color-accent-primary) 10%, var(--color-bg-card) 90%);
        }

        .decodable-story__status-panel {
          display: grid;
          gap: var(--space-sm);
        }

        .decodable-story__message-row {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: var(--space-xs);
        }

        .decodable-story__message {
          margin: 0;
          min-block-size: 48px;
          padding-inline: var(--space-sm);
          padding-block: var(--space-xs);
          border-radius: var(--radius-md);
          background: color-mix(in srgb, var(--color-theme-secondary) 12%, transparent);
          color: var(--color-text-primary);
          display: flex;
          align-items: center;
          font-size: var(--font-size-sm);
        }

        .decodable-story__message--hint {
          background: color-mix(in srgb, var(--color-accent-primary) 16%, transparent);
        }

        .decodable-story__message--success {
          background: color-mix(in srgb, var(--color-accent-success) 18%, transparent);
        }

        .decodable-story__message--error {
          background: color-mix(in srgb, var(--color-accent-danger) 14%, transparent);
        }

        .decodable-story__controls {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs);
        }

        .decodable-story__icon-button {
          min-inline-size: 52px;
          min-block-size: 52px;
          border-radius: var(--radius-full);
          border: 1px solid color-mix(in srgb, var(--color-theme-secondary) 45%, transparent);
          background: color-mix(in srgb, var(--color-bg-card) 90%, white 10%);
          color: var(--color-text-primary);
          font-size: 1.2rem;
          cursor: pointer;
          transition: transform 140ms ease;
        }

        .decodable-story__icon-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .decodable-story__icon-button:active:not(:disabled) {
          transform: translateY(1px) scale(0.96);
        }

        .decodable-story__checkpoint-card {
          display: grid;
          gap: var(--space-sm);
          padding: var(--space-sm);
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-theme-secondary) 30%, transparent);
          background: color-mix(in srgb, var(--color-bg-card) 86%, white 14%);
        }

        .decodable-story__checkpoint-card--success {
          border-color: color-mix(in srgb, var(--color-accent-success) 58%, transparent);
          animation: decodable-story-card-pop 280ms ease;
        }

        .decodable-story__checkpoint-card--error {
          border-color: color-mix(in srgb, var(--color-accent-danger) 55%, transparent);
          animation: decodable-story-card-shake 300ms ease;
        }

        .decodable-story__options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: var(--space-xs);
        }

        .decodable-story__option {
          min-block-size: 52px;
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-theme-secondary) 38%, transparent);
          background: var(--color-bg-primary);
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
          padding-inline: var(--space-sm);
          cursor: pointer;
          transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
        }

        .decodable-story__option:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

        .decodable-story__option.is-correct {
          border-color: var(--color-accent-success);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-success) 20%, transparent);
        }

        .decodable-story__option.is-wrong {
          border-color: var(--color-accent-danger);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-danger) 16%, transparent);
        }

        .decodable-story__option:disabled {
          cursor: default;
        }

        .decodable-story__completion {
          display: grid;
          gap: var(--space-xs);
          padding: var(--space-md);
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-accent-success) 44%, transparent);
          background: color-mix(in srgb, var(--color-accent-success) 10%, var(--color-bg-card) 90%);
        }

        .decodable-story__completion-title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-xl);
        }

        .decodable-story__completion-line {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          line-height: 1.6;
        }

        .decodable-story__footer {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs);
          justify-content: flex-start;
        }

        .decodable-story__footer-item {
          margin: 0;
          padding-inline: var(--space-sm);
          padding-block: var(--space-2xs);
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-theme-secondary) 14%, transparent);
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        @keyframes decodable-story-progress-breathe {
          0%,
          100% {
            transform: scaleY(1.15);
          }
          50% {
            transform: scaleY(1.3);
          }
        }

        @keyframes decodable-story-score-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes decodable-story-card-pop {
          0% {
            transform: scale(0.99);
          }
          60% {
            transform: scale(1.01);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes decodable-story-card-shake {
          0% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-3px);
          }
          50% {
            transform: translateX(3px);
          }
          75% {
            transform: translateX(-2px);
          }
          100% {
            transform: translateX(0);
          }
        }

        @media (max-width: 860px) {
          .decodable-story__title {
            font-size: clamp(1.2rem, 1rem + 0.9vw, 1.5rem);
          }

          .decodable-story__word-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .decodable-story__options-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .decodable-story__audio-inline,
          .decodable-story__icon-button,
          .decodable-story__word-button,
          .decodable-story__option,
          .decodable-story__progress-dot {
            transition: none;
          }

          .decodable-story__progress-dot--active,
          .decodable-story__score-pill--pulse,
          .decodable-story__checkpoint-card--success,
          .decodable-story__checkpoint-card--error {
            animation: none;
          }
        }
      `}</style>
    </Card>
  );
}
