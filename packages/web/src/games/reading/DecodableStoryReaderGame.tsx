import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/design-system';
import { SuccessCelebration } from '@/components/motion';
import type { GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';

type HintTrend = ParentSummaryMetrics['hintTrend'];
type MessageTone = 'neutral' | 'hint' | 'success' | 'error';
type CheckpointFeedbackTone = 'idle' | 'success' | 'error';
type PageId = 'p01' | 'p02' | 'p03' | 'p04' | 'p05' | 'p06';
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
  key: string;
  isCorrect: boolean;
}

interface StoryPage {
  id: PageId;
  sceneEmoji: string;
  narrationKey: string;
  decodePromptKey: string;
  phraseId: PhraseId;
  words: WordId[];
  targetWordId: WordId;
  comprehensionPromptKey: string;
  comprehensionOptions: ComprehensionOption[];
}

const STORY_PAGES: StoryPage[] = [
  {
    id: 'p01',
    sceneEmoji: '🌿',
    narrationKey: 'games.decodableMicroStories.pages.p01.narration.text',
    decodePromptKey: 'games.decodableMicroStories.pages.p01.decodePrompt.text',
    phraseId: 'dubiHalachLagan',
    words: ['dubi', 'halach', 'lagan'],
    targetWordId: 'dubi',
    comprehensionPromptKey: 'games.decodableMicroStories.pages.p01.comprehension.prompt',
    comprehensionOptions: [
      { id: 'dubi', key: 'games.decodableMicroStories.pages.p01.comprehension.options.dubi', isCorrect: true },
      { id: 'dag', key: 'games.decodableMicroStories.pages.p01.comprehension.options.dag', isCorrect: false },
      { id: 'kelev', key: 'games.decodableMicroStories.pages.p01.comprehension.options.kelev', isCorrect: false },
    ],
  },
  {
    id: 'p02',
    sceneEmoji: '🐟',
    narrationKey: 'games.decodableMicroStories.pages.p02.narration.text',
    decodePromptKey: 'games.decodableMicroStories.pages.p02.decodePrompt.text',
    phraseId: 'dubiRaahDagKatan',
    words: ['dubi', 'raah', 'dag', 'katan'],
    targetWordId: 'dag',
    comprehensionPromptKey: 'games.decodableMicroStories.pages.p02.comprehension.prompt',
    comprehensionOptions: [
      {
        id: 'dagKatan',
        key: 'games.decodableMicroStories.pages.p02.comprehension.options.dagKatan',
        isCorrect: true,
      },
      {
        id: 'etsGadol',
        key: 'games.decodableMicroStories.pages.p02.comprehension.options.etsGadol',
        isCorrect: false,
      },
      {
        id: 'kovaKahol',
        key: 'games.decodableMicroStories.pages.p02.comprehension.options.kovaKahol',
        isCorrect: false,
      },
    ],
  },
  {
    id: 'p03',
    sceneEmoji: '🪨',
    narrationKey: 'games.decodableMicroStories.pages.p03.narration.text',
    decodePromptKey: 'games.decodableMicroStories.pages.p03.decodePrompt.text',
    phraseId: 'hadagSamTikAlSela',
    words: ['vehadag', 'sam', 'tik', 'al', 'sela'],
    targetWordId: 'tik',
    comprehensionPromptKey: 'games.decodableMicroStories.pages.p03.comprehension.prompt',
    comprehensionOptions: [
      { id: 'alSela', key: 'games.decodableMicroStories.pages.p03.comprehension.options.alSela', isCorrect: true },
      {
        id: 'baMayim',
        key: 'games.decodableMicroStories.pages.p03.comprehension.options.baMayim',
        isCorrect: false,
      },
      {
        id: 'alEts',
        key: 'games.decodableMicroStories.pages.p03.comprehension.options.alEts',
        isCorrect: false,
      },
    ],
  },
  {
    id: 'p04',
    sceneEmoji: '👋',
    narrationKey: 'games.decodableMicroStories.pages.p04.narration.text',
    decodePromptKey: 'games.decodableMicroStories.pages.p04.decodePrompt.text',
    phraseId: 'dubiKaraShalomDag',
    words: ['dubi', 'kara', 'shalom', 'dag'],
    targetWordId: 'shalom',
    comprehensionPromptKey: 'games.decodableMicroStories.pages.p04.comprehension.prompt',
    comprehensionOptions: [
      {
        id: 'shalomDag',
        key: 'games.decodableMicroStories.pages.p04.comprehension.options.shalomDag',
        isCorrect: true,
      },
      {
        id: 'boLagan',
        key: 'games.decodableMicroStories.pages.p04.comprehension.options.boLagan',
        isCorrect: false,
      },
      {
        id: 'lehitraot',
        key: 'games.decodableMicroStories.pages.p04.comprehension.options.lehitraot',
        isCorrect: false,
      },
    ],
  },
  {
    id: 'p05',
    sceneEmoji: '🥖',
    narrationKey: 'games.decodableMicroStories.pages.p05.narration.text',
    decodePromptKey: 'games.decodableMicroStories.pages.p05.decodePrompt.text',
    phraseId: 'hadagHeviLehemLedubi',
    words: ['vehadag', 'hevi', 'lehem', 'dubi'],
    targetWordId: 'lehem',
    comprehensionPromptKey: 'games.decodableMicroStories.pages.p05.comprehension.prompt',
    comprehensionOptions: [
      { id: 'lehem', key: 'games.decodableMicroStories.pages.p05.comprehension.options.lehem', isCorrect: true },
      { id: 'sefer', key: 'games.decodableMicroStories.pages.p05.comprehension.options.sefer', isCorrect: false },
      { id: 'kadur', key: 'games.decodableMicroStories.pages.p05.comprehension.options.kadur', isCorrect: false },
    ],
  },
  {
    id: 'p06',
    sceneEmoji: '✨',
    narrationKey: 'games.decodableMicroStories.pages.p06.narration.text',
    decodePromptKey: 'games.decodableMicroStories.pages.p06.decodePrompt.text',
    phraseId: 'dubiVehadagSamchuBagan',
    words: ['dubi', 'vehadag', 'samchu', 'bagan'],
    targetWordId: 'samchu',
    comprehensionPromptKey: 'games.decodableMicroStories.pages.p06.comprehension.prompt',
    comprehensionOptions: [
      {
        id: 'dubiVehadag',
        key: 'games.decodableMicroStories.pages.p06.comprehension.options.dubiVehadag',
        isCorrect: true,
      },
      { id: 'rakHadag', key: 'games.decodableMicroStories.pages.p06.comprehension.options.rakHadag', isCorrect: false },
      { id: 'rakDubi', key: 'games.decodableMicroStories.pages.p06.comprehension.options.rakDubi', isCorrect: false },
    ],
  },
];

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

function createPageCounterRecord(initialValue: number): Record<PageId, number> {
  return STORY_PAGES.reduce<Record<PageId, number>>(
    (accumulator, page) => ({ ...accumulator, [page.id]: initialValue }),
    {} as Record<PageId, number>,
  );
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

export function DecodableStoryReaderGame({ onComplete, audio }: GameProps) {
  const { t } = useTranslation('common');

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [hintStep, setHintStep] = useState(0);
  const [messageTone, setMessageTone] = useState<MessageTone>('neutral');
  const [messageKey, setMessageKey] = useState('games.decodableMicroStories.instructions.intro');
  const [hintUsageByPage, setHintUsageByPage] = useState<Record<PageId, number>>(() =>
    createPageCounterRecord(0),
  );
  const [wrongAttemptsByPage, setWrongAttemptsByPage] = useState<Record<PageId, number>>(() =>
    createPageCounterRecord(0),
  );
  const [firstAttemptSuccessCount, setFirstAttemptSuccessCount] = useState(0);
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
  const currentPage = STORY_PAGES[currentPageIndex];
  const independentMode = !supportMode && independentStreak >= 3;

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

  const playPageNarration = useCallback(
    (interrupt = false) => {
      const queue = [currentPage.narrationKey];
      if (!independentMode) {
        queue.push(currentPage.decodePromptKey);
      }
      if (supportMode) {
        queue.push('games.decodableMicroStories.hints.replayPhrase');
        queue.push(`phrases.pronunciation.${currentPage.phraseId}`);
      }

      const [firstKey, ...remainingKeys] = queue;
      if (!firstKey) return;

      playKey(firstKey, interrupt);
      remainingKeys.forEach((key) => {
        playKey(key);
      });
    },
    [currentPage.decodePromptKey, currentPage.narrationKey, currentPage.phraseId, independentMode, playKey, supportMode],
  );

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIdsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (completed) return;

    setSelectedOptionId(null);
    setLocked(false);
    setHintStep(0);
    setScorePulse(false);
    setCheckpointFeedback('idle');
    setMessageTone(supportMode ? 'hint' : 'neutral');
    setMessageKey(
      supportMode
        ? 'games.decodableMicroStories.instructions.supportMode'
        : 'games.decodableMicroStories.instructions.chooseAnswer',
    );
    playPageNarration(true);
  }, [completed, currentPage.id, playPageNarration, supportMode]);

  const instructionKey = useMemo(() => {
    if (completed) return 'games.decodableMicroStories.completion.summary';
    if (messageTone !== 'neutral') return messageKey;
    if (supportMode) return 'games.decodableMicroStories.instructions.supportMode';
    if (independentMode) return 'games.decodableMicroStories.instructions.independentTurn';
    return 'games.decodableMicroStories.instructions.chooseAnswer';
  }, [completed, independentMode, messageKey, messageTone, supportMode]);

  const hintTrend = useMemo(
    () => getHintTrend(STORY_PAGES.map((page) => hintUsageByPage[page.id] ?? 0)),
    [hintUsageByPage],
  );
  const hintTrendSummaryKey = useMemo(() => toHintTrendSummaryKey(hintTrend), [hintTrend]);
  const successRate = Math.round((firstAttemptSuccessCount / STORY_PAGES.length) * 100);

  const adaptiveBadgeKey = useMemo(() => {
    if (supportMode) return 'games.decodableMicroStories.adaptive.supportMode';
    if (independentMode) return 'games.decodableMicroStories.adaptive.independentMode';
    return null;
  }, [independentMode, supportMode]);

  const completeSession = useCallback(() => {
    if (completionSentRef.current) return;
    completionSentRef.current = true;

    setCompleted(true);
    setLocked(true);
    setMessageTone('success');
    setMessageKey('games.decodableMicroStories.completion.summary');

    const hintVector = STORY_PAGES.map((page) => hintUsageByPage[page.id] ?? 0);
    const firstAttemptSuccessRate = Math.round((firstAttemptSuccessCount / STORY_PAGES.length) * 100);
    const totalHints = hintVector.reduce((sum, value) => sum + value, 0) + supportModeActivations;
    const summaryHintTrend = getHintTrend(hintVector);

    onComplete({
      completed: true,
      score: firstAttemptSuccessRate,
      stars: toStars(firstAttemptSuccessRate, totalHints),
      roundsCompleted: STORY_PAGES.length,
      summaryMetrics: {
        highestStableRange: toStableRange(firstAttemptSuccessRate),
        firstAttemptSuccessRate,
        hintTrend: summaryHintTrend,
      },
    });

    playKey('games.decodableMicroStories.completion.title', true);
    playKey('games.decodableMicroStories.completion.nextStep');
  }, [firstAttemptSuccessCount, hintUsageByPage, onComplete, playKey, supportModeActivations]);

  const handleReplayInstruction = useCallback(() => {
    playKey(instructionKey, true);
  }, [instructionKey, playKey]);

  const handleReplayNarration = useCallback(() => {
    setMessageTone('neutral');
    setMessageKey('games.decodableMicroStories.instructions.modelReplay');
    playPageNarration(true);
  }, [playPageNarration]);

  const handleReplayPhrase = useCallback(() => {
    playKey(`phrases.pronunciation.${currentPage.phraseId}`, true);
  }, [currentPage.phraseId, playKey]);

  const handleReplayDecodePrompt = useCallback(() => {
    playKey(currentPage.decodePromptKey, true);
  }, [currentPage.decodePromptKey, playKey]);

  const handleReplayComprehensionPrompt = useCallback(() => {
    playKey(currentPage.comprehensionPromptKey, true);
  }, [currentPage.comprehensionPromptKey, playKey]);

  const handlePlayWord = useCallback(
    (wordId: WordId) => {
      playKey(`words.pronunciation.${wordId}`, true);
    },
    [playKey],
  );

  const handleRetryCheckpoint = useCallback(() => {
    if (completed) return;
    setSelectedOptionId(null);
    setHintStep(0);
    setCheckpointFeedback('idle');
    setMessageTone('neutral');
    setMessageKey('games.decodableMicroStories.instructions.chooseAnswer');
    playKey('games.decodableMicroStories.controls.retry', true);
  }, [completed, playKey]);

  const handleHint = useCallback(() => {
    if (completed || locked) return;

    const nextHintStep = Math.min(3, hintStep + 1);
    if (nextHintStep === hintStep) return;

    setHintStep(nextHintStep);
    setHintUsageByPage((previous) => ({
      ...previous,
      [currentPage.id]: (previous[currentPage.id] ?? 0) + 1,
    }));

    const hintKey =
      nextHintStep === 1
        ? 'games.decodableMicroStories.hints.replayPhrase'
        : nextHintStep === 2
          ? 'games.decodableMicroStories.hints.syllableCue'
          : 'games.decodableMicroStories.hints.graphemeHighlight';

    setMessageTone('hint');
    setMessageKey(hintKey);
    playKey(hintKey, true);

    if (nextHintStep === 1) {
      playKey(`phrases.pronunciation.${currentPage.phraseId}`);
    }
  }, [completed, currentPage.id, currentPage.phraseId, hintStep, locked, playKey]);

  const handleSelectOption = useCallback(
    (option: ComprehensionOption) => {
      if (locked || completed) return;

      setSelectedOptionId(option.id);
      const wrongAttempts = wrongAttemptsByPage[currentPage.id] ?? 0;

      if (option.isCorrect) {
        const firstTrySuccess = wrongAttempts === 0 && hintStep === 0;
        setLocked(true);
        setConsecutiveMisses(0);
        setShowCelebration(true);
        setCheckpointFeedback('success');
        scheduleTimeout(() => {
          setCheckpointFeedback('idle');
        }, 540);

        if (firstTrySuccess) {
          setFirstAttemptSuccessCount((count) => count + 1);
          setScorePulse(true);
          scheduleTimeout(() => {
            setScorePulse(false);
          }, 420);
          setIndependentStreak((streak) => {
            const nextStreak = streak + 1;
            if (nextStreak >= 3) {
              setSupportMode(false);
            }
            return nextStreak;
          });
        } else {
          setIndependentStreak(0);
        }

        const successKey = SUCCESS_MESSAGE_ROTATION[currentPageIndex % SUCCESS_MESSAGE_ROTATION.length];
        setMessageTone('success');
        setMessageKey(successKey);
        playKey(successKey, true);

        scheduleTimeout(() => {
          setShowCelebration(false);
        }, 850);

        scheduleTimeout(() => {
          if (currentPageIndex === STORY_PAGES.length - 1) {
            completeSession();
            return;
          }
          setCurrentPageIndex((index) => Math.min(index + 1, STORY_PAGES.length - 1));
        }, 950);
        return;
      }

      const nextWrongAttempts = wrongAttempts + 1;
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
        if (nextMisses >= 2) {
          setSupportMode((wasSupportMode) => {
            if (!wasSupportMode) {
              setSupportModeActivations((count) => count + 1);
            }
            return true;
          });
        }
        return nextMisses;
      });

      const retryKey = RETRY_MESSAGE_ROTATION[Math.min(nextWrongAttempts - 1, RETRY_MESSAGE_ROTATION.length - 1)];
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
    },
    [
      completed,
      completeSession,
      currentPage.id,
      currentPageIndex,
      hintStep,
      locked,
      playKey,
      scheduleTimeout,
      wrongAttemptsByPage,
    ],
  );

  const hintCount = hintUsageByPage[currentPage.id] ?? 0;
  const wrongAttempts = wrongAttemptsByPage[currentPage.id] ?? 0;
  const displayedPage = completed ? STORY_PAGES.length : currentPageIndex + 1;

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
            total: STORY_PAGES.length,
          })}
        </p>
        <div className="decodable-story__progress-track" aria-hidden="true">
          {STORY_PAGES.map((page, index) => {
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
          🎯 {displayedPage}/{STORY_PAGES.length}
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
              <p className="decodable-story__narration">{t(currentPage.narrationKey as any)}</p>
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
              <p className="decodable-story__decode-prompt">{t(currentPage.decodePromptKey as any)}</p>
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
              <p className="decodable-story__phrase">{t(`phrases.pronunciation.${currentPage.phraseId}` as any)}</p>
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
                  className={`decodable-story__word-button ${hintStep >= 3 && wordId === currentPage.targetWordId ? 'is-highlight' : ''}`}
                  onClick={() => handlePlayWord(wordId)}
                  aria-label={t('games.decodableMicroStories.instructions.tapWord')}
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
                <p className="decodable-story__checkpoint-prompt">{t(currentPage.comprehensionPromptKey as any)}</p>
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
                {currentPage.comprehensionOptions.map((option) => {
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
                      {t(option.key as any)}
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
          <h3 className="decodable-story__completion-title">{t('games.decodableMicroStories.completion.title')}</h3>
          <p className="decodable-story__completion-line">
            {t('parentDashboard.games.decodableMicroStories.progressSummary', {
              successRate,
              hintTrend: t(hintTrendSummaryKey as any),
            })}
          </p>
          <p className="decodable-story__completion-line">{t(hintTrendSummaryKey as any)}</p>
          <p className="decodable-story__completion-line">{t('parentDashboard.games.decodableMicroStories.nextStep')}</p>
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
          grid-template-columns: repeat(${STORY_PAGES.length}, minmax(0, 1fr));
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
