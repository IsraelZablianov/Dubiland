import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameCompletionResult, GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';
import { resolveReadingRoutingContext, type ReadingRoutingAgeBand } from '@/games/reading/readingProgressionRouting';
import { resolveAudioPathFromKey } from '@/lib/audioPathResolver';
import { isRtlDirection, rtlNextGlyph, rtlReplayGlyph } from '@/lib/rtlChrome';

type Tone = 'neutral' | 'hint' | 'success';
type PageKind = 'cover' | 'mission' | 'letter' | 'checkpoint' | 'finalForms' | 'celebration';
type ChapterId = 'one' | 'two' | 'three';
type FinalFormId = 'kafSofit' | 'memSofit' | 'nunSofit' | 'peSofit' | 'tsadiSofit';
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

interface LetterDefinition {
  id: LetterId;
  emoji: string;
  chapter: ChapterId;
}

interface LetterPage {
  id: `letter-${LetterId}`;
  kind: 'letter';
  letterId: LetterId;
  chapter: ChapterId;
  requiresInteraction: true;
}

interface CheckpointPage {
  id: `checkpoint-${ChapterId}`;
  kind: 'checkpoint';
  chapter: ChapterId;
  targetLetterId: LetterId;
  requiresInteraction: true;
}

interface FinalFormsPage {
  id: 'final-forms-bridge';
  kind: 'finalForms';
  requiresInteraction: true;
}

interface CoverPage {
  id: 'cover';
  kind: 'cover';
  requiresInteraction: false;
}

interface MissionPage {
  id: 'mission';
  kind: 'mission';
  requiresInteraction: false;
}

interface CelebrationPage {
  id: 'celebration';
  kind: 'celebration';
  requiresInteraction: false;
}

type StoryPage = LetterPage | CheckpointPage | FinalFormsPage | CoverPage | MissionPage | CelebrationPage;

interface ChoiceOption {
  id: string;
  label: string;
  audioKey: string;
  isCorrect: boolean;
}

interface StatusMessage {
  key: string;
  tone: Tone;
}

interface FinalFormDefinition {
  id: FinalFormId;
  baseSymbolKey: `games.letterStorybook.finalForms.${FinalFormId}.baseSymbol`;
  finalSymbolKey: `games.letterStorybook.finalForms.${FinalFormId}.symbol`;
  decoyLetterId: LetterId;
  wordKey: `games.letterStorybook.finalForms.${FinalFormId}.exampleWord`;
  promptKey: `games.letterStorybook.finalForms.${FinalFormId}.prompt`;
}

const WINDOW_DOT_SIZE = 5;
const SWIPE_THRESHOLD_PX = 56;
const SWIPE_VERTICAL_DRIFT_PX = 64;
const ANTI_RANDOM_TAP_COUNT = 3;
const ANTI_RANDOM_WINDOW_MS = 2000;
const ANTI_RANDOM_PAUSE_MS = 1000;

const LETTER_SEQUENCE: LetterDefinition[] = [
  { id: 'alef', emoji: '🦁', chapter: 'one' },
  { id: 'bet', emoji: '🍌', chapter: 'one' },
  { id: 'gimel', emoji: '🐪', chapter: 'one' },
  { id: 'dalet', emoji: '🐟', chapter: 'one' },
  { id: 'he', emoji: '⛰️', chapter: 'one' },
  { id: 'vav', emoji: '🌹', chapter: 'one' },
  { id: 'zayin', emoji: '🦓', chapter: 'one' },
  { id: 'het', emoji: '🐱', chapter: 'one' },
  { id: 'tet', emoji: '🐑', chapter: 'two' },
  { id: 'yod', emoji: '✋', chapter: 'two' },
  { id: 'kaf', emoji: '⚽', chapter: 'two' },
  { id: 'lamed', emoji: '💗', chapter: 'two' },
  { id: 'mem', emoji: '💧', chapter: 'two' },
  { id: 'nun', emoji: '🕯️', chapter: 'two' },
  { id: 'samekh', emoji: '🐴', chapter: 'two' },
  { id: 'ayin', emoji: '☁️', chapter: 'three' },
  { id: 'pe', emoji: '🦋', chapter: 'three' },
  { id: 'tsadi', emoji: '🐦', chapter: 'three' },
  { id: 'qof', emoji: '🐒', chapter: 'three' },
  { id: 'resh', emoji: '🚂', chapter: 'three' },
  { id: 'shin', emoji: '☀️', chapter: 'three' },
  { id: 'tav', emoji: '🍎', chapter: 'three' },
];

const CHECKPOINT_TARGET_BY_CHAPTER: Record<ChapterId, LetterId> = {
  one: 'het',
  two: 'nun',
  three: 'tav',
};

const FINAL_FORMS: FinalFormDefinition[] = [
  {
    id: 'kafSofit',
    baseSymbolKey: 'games.letterStorybook.finalForms.kafSofit.baseSymbol',
    finalSymbolKey: 'games.letterStorybook.finalForms.kafSofit.symbol',
    decoyLetterId: 'bet',
    wordKey: 'games.letterStorybook.finalForms.kafSofit.exampleWord',
    promptKey: 'games.letterStorybook.finalForms.kafSofit.prompt',
  },
  {
    id: 'memSofit',
    baseSymbolKey: 'games.letterStorybook.finalForms.memSofit.baseSymbol',
    finalSymbolKey: 'games.letterStorybook.finalForms.memSofit.symbol',
    decoyLetterId: 'shin',
    wordKey: 'games.letterStorybook.finalForms.memSofit.exampleWord',
    promptKey: 'games.letterStorybook.finalForms.memSofit.prompt',
  },
  {
    id: 'nunSofit',
    baseSymbolKey: 'games.letterStorybook.finalForms.nunSofit.baseSymbol',
    finalSymbolKey: 'games.letterStorybook.finalForms.nunSofit.symbol',
    decoyLetterId: 'zayin',
    wordKey: 'games.letterStorybook.finalForms.nunSofit.exampleWord',
    promptKey: 'games.letterStorybook.finalForms.nunSofit.prompt',
  },
  {
    id: 'peSofit',
    baseSymbolKey: 'games.letterStorybook.finalForms.peSofit.baseSymbol',
    finalSymbolKey: 'games.letterStorybook.finalForms.peSofit.symbol',
    decoyLetterId: 'tet',
    wordKey: 'games.letterStorybook.finalForms.peSofit.exampleWord',
    promptKey: 'games.letterStorybook.finalForms.peSofit.prompt',
  },
  {
    id: 'tsadiSofit',
    baseSymbolKey: 'games.letterStorybook.finalForms.tsadiSofit.baseSymbol',
    finalSymbolKey: 'games.letterStorybook.finalForms.tsadiSofit.symbol',
    decoyLetterId: 'resh',
    wordKey: 'games.letterStorybook.finalForms.tsadiSofit.exampleWord',
    promptKey: 'games.letterStorybook.finalForms.tsadiSofit.prompt',
  },
];

const CHAPTER_SLOT_COUNT: Record<ReadingRoutingAgeBand, number> = {
  '3-4': 3,
  '4-5': 4,
  '5-6': 4,
  '6-7': 5,
};

function toAudioPath(key: string): string {
  return resolveAudioPathFromKey(key, 'common');
}

function toStableRange(value: number): StableRange {
  if (value >= 85) return '1-10';
  if (value >= 65) return '1-5';
  return '1-3';
}

function toHintTrend(hintsPerPage: number[]): ParentSummaryMetrics['hintTrend'] {
  if (hintsPerPage.length < 2) {
    return 'steady';
  }

  const midpoint = Math.ceil(hintsPerPage.length / 2);
  const firstHalf = hintsPerPage.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
  const secondHalf = hintsPerPage.slice(midpoint).reduce((sum, value) => sum + value, 0);

  if (secondHalf < firstHalf) return 'improving';
  if (secondHalf === firstHalf) return 'steady';
  return 'needs_support';
}

function toParentSummaryAgeBand(ageBand: ReadingRoutingAgeBand): ParentSummaryMetrics['ageBand'] {
  if (ageBand === '3-4' || ageBand === '4-5') {
    return '3-4';
  }
  if (ageBand === '5-6') {
    return '5-6';
  }
  return '6-7';
}

function toLetterSymbolKey(letterId: LetterId): `games.letterStorybook.letters.${LetterId}.symbol` {
  return `games.letterStorybook.letters.${letterId}.symbol`;
}

function buildPages(): StoryPage[] {
  const letterPages: LetterPage[] = LETTER_SEQUENCE.map((letter) => ({
    id: `letter-${letter.id}`,
    kind: 'letter',
    letterId: letter.id,
    chapter: letter.chapter,
    requiresInteraction: true,
  }));

  const checkpointPages: CheckpointPage[] = [
    {
      id: 'checkpoint-one',
      kind: 'checkpoint',
      chapter: 'one',
      targetLetterId: CHECKPOINT_TARGET_BY_CHAPTER.one,
      requiresInteraction: true,
    },
    {
      id: 'checkpoint-two',
      kind: 'checkpoint',
      chapter: 'two',
      targetLetterId: CHECKPOINT_TARGET_BY_CHAPTER.two,
      requiresInteraction: true,
    },
    {
      id: 'checkpoint-three',
      kind: 'checkpoint',
      chapter: 'three',
      targetLetterId: CHECKPOINT_TARGET_BY_CHAPTER.three,
      requiresInteraction: true,
    },
  ];

  return [
    { id: 'cover', kind: 'cover', requiresInteraction: false },
    { id: 'mission', kind: 'mission', requiresInteraction: false },
    ...letterPages,
    ...checkpointPages,
    { id: 'final-forms-bridge', kind: 'finalForms', requiresInteraction: true },
    { id: 'celebration', kind: 'celebration', requiresInteraction: false },
  ];
}

function getChapterLetterIds(chapter: ChapterId): LetterId[] {
  return LETTER_SEQUENCE.filter((letter) => letter.chapter === chapter).map((letter) => letter.id);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isLetterPage(page: StoryPage): page is LetterPage {
  return page.kind === 'letter';
}

function isCheckpointPage(page: StoryPage): page is CheckpointPage {
  return page.kind === 'checkpoint';
}

function isFinalFormsPage(page: StoryPage): page is FinalFormsPage {
  return page.kind === 'finalForms';
}

export function LetterStorybookGame({ level: runtimeLevel, onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');
  const isRtl = isRtlDirection(i18n.dir(i18n.language));
  const replayIcon = rtlReplayGlyph(isRtl);
  const nextIcon = rtlNextGlyph(isRtl);
  const prevIcon = isRtl ? '→' : '←';

  const pages = useMemo(() => buildPages(), []);
  const levelConfig = useMemo(
    () => (runtimeLevel.configJson as Record<string, unknown>) ?? {},
    [runtimeLevel.configJson],
  );
  const routingContext = useMemo(
    () =>
      resolveReadingRoutingContext(levelConfig, 2, {
        baseLevelByAgeBand: {
          '3-4': 1,
          '4-5': 1,
          '5-6': 2,
          '6-7': 3,
        },
      }),
    [levelConfig],
  );
  const slotCount = CHAPTER_SLOT_COUNT[routingContext.ageBand];

  const [pageIndex, setPageIndex] = useState(0);
  const [status, setStatus] = useState<StatusMessage>({
    key: 'games.letterStorybook.instructions.intro',
    tone: 'neutral',
  });
  const [solvedPageIds, setSolvedPageIds] = useState<Set<string>>(new Set());
  const [attemptsByPage, setAttemptsByPage] = useState<Record<string, number>>({});
  const [hintsByPage, setHintsByPage] = useState<Record<string, number>>({});
  const [firstTrySuccessByPage, setFirstTrySuccessByPage] = useState<Record<string, boolean>>({});
  const [selectedOptionByPage, setSelectedOptionByPage] = useState<Record<string, string>>({});
  const [finalFormStep, setFinalFormStep] = useState(0);
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);
  const [isNarrationPlaying, setIsNarrationPlaying] = useState(false);
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const [replayTapCount, setReplayTapCount] = useState(0);
  const [pauseUntil, setPauseUntil] = useState(0);

  const completionSentRef = useRef(false);
  const wrongTapTimestampsRef = useRef<number[]>([]);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const statusTimeoutRef = useRef<number | null>(null);

  const currentPage = pages[pageIndex] ?? pages[0]!;

  const isSupportCheckpointUnlocked =
    routingContext.ageBand === '3-4' && currentPage.kind === 'checkpoint';

  const isPageSolved = useCallback(
    (pageId: string) => solvedPageIds.has(pageId),
    [solvedPageIds],
  );

  const interactionRequired = currentPage.requiresInteraction && !isSupportCheckpointUnlocked;
  const interactionSolved = isPageSolved(currentPage.id);
  const interactionLocked = interactionRequired && !interactionSolved;

  const canGoPrevious = pageIndex > 0;
  const canGoNext = pageIndex < pages.length - 1 && !interactionLocked;

  const activeLetterDefinition = isLetterPage(currentPage)
    ? LETTER_SEQUENCE.find((entry) => entry.id === currentPage.letterId) ?? null
    : null;

  const currentChapter = useMemo<ChapterId | null>(() => {
    if (isLetterPage(currentPage)) {
      return currentPage.chapter;
    }

    if (isCheckpointPage(currentPage)) {
      return currentPage.chapter;
    }

    if (isFinalFormsPage(currentPage) || currentPage.kind === 'celebration') {
      return 'three';
    }

    return 'one';
  }, [currentPage]);

  const chapterProgress = useMemo(() => {
    if (!currentChapter) {
      return 0;
    }

    const letterPageIds = pages
      .filter((page): page is LetterPage => isLetterPage(page) && page.chapter === currentChapter)
      .map((page) => page.id);

    const checkpointId = `checkpoint-${currentChapter}`;
    const solvedLetters = letterPageIds.filter((id) => solvedPageIds.has(id)).length;
    const solvedCheckpoint = solvedPageIds.has(checkpointId) ? 1 : 0;
    const solvedUnits = solvedLetters + solvedCheckpoint;

    return clamp(Math.round((solvedUnits / (letterPageIds.length + 1)) * slotCount), 0, slotCount);
  }, [currentChapter, pages, slotCount, solvedPageIds]);

  const dotWindow = useMemo(() => {
    const totalPages = pages.length;
    if (totalPages <= WINDOW_DOT_SIZE) {
      return pages.map((_, index) => index);
    }

    const start = clamp(pageIndex - Math.floor(WINDOW_DOT_SIZE / 2), 0, totalPages - WINDOW_DOT_SIZE);
    return Array.from({ length: WINDOW_DOT_SIZE }, (_, index) => start + index);
  }, [pageIndex, pages]);

  const playAudio = useCallback(
    async (key: string, mode: 'queue' | 'interrupt' = 'queue') => {
      if (audioPlaybackFailed) {
        return;
      }

      const path = toAudioPath(key);

      try {
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

  const playNarrationForPage = useCallback(async () => {
    if (audioPlaybackFailed) {
      return;
    }

    let narrationKey = 'games.letterStorybook.instructions.intro';

    if (currentPage.kind === 'cover') {
      narrationKey = 'games.letterStorybook.cover.welcome';
    } else if (currentPage.kind === 'mission') {
      narrationKey = 'games.letterStorybook.instructions.mission';
    } else if (isLetterPage(currentPage)) {
      narrationKey = `games.letterStorybook.letters.${currentPage.letterId}.story`;
    } else if (isCheckpointPage(currentPage)) {
      narrationKey = `games.letterStorybook.checkpoints.${currentPage.chapter}.intro`;
    } else if (isFinalFormsPage(currentPage)) {
      narrationKey = 'games.letterStorybook.finalForms.intro';
    } else if (currentPage.kind === 'celebration') {
      narrationKey = 'games.letterStorybook.completion.summary';
    }

    setIsNarrationPlaying(true);

    if (isLetterPage(currentPage)) {
      await playAudio(narrationKey, 'interrupt');
      await playAudio(`games.letterStorybook.letters.${currentPage.letterId}.sound`);
      await playAudio(`games.letterStorybook.letters.${currentPage.letterId}.word`);
      setIsNarrationPlaying(false);
      return;
    }

    if (isCheckpointPage(currentPage)) {
      await playAudio(narrationKey, 'interrupt');
      await playAudio(`games.letterStorybook.checkpoints.${currentPage.chapter}.prompt`);
      setIsNarrationPlaying(false);
      return;
    }

    if (isFinalFormsPage(currentPage)) {
      const activeFinal = FINAL_FORMS[clamp(finalFormStep, 0, FINAL_FORMS.length - 1)]!;
      await playAudio(narrationKey, 'interrupt');
      await playAudio(activeFinal.promptKey);
      await playAudio(activeFinal.wordKey);
      setIsNarrationPlaying(false);
      return;
    }

    if (currentPage.kind === 'cover') {
      await playAudio(narrationKey, 'interrupt');
      await playAudio('games.letterStorybook.cover.goal');
      setIsNarrationPlaying(false);
      return;
    }

    if (currentPage.kind === 'mission') {
      await playAudio(narrationKey, 'interrupt');
      await playAudio('games.letterStorybook.instructions.listenAndTapLetter');
      setIsNarrationPlaying(false);
      return;
    }

    if (currentPage.kind === 'celebration') {
      await playAudio('games.letterStorybook.completion.title', 'interrupt');
      await playAudio(narrationKey);
      setIsNarrationPlaying(false);
      return;
    }

    await playAudio(narrationKey, 'interrupt');
    setIsNarrationPlaying(false);
  }, [audioPlaybackFailed, currentPage, finalFormStep, playAudio]);

  const setStatusWithAudio = useCallback(
    (key: StatusMessage['key'], tone: Tone, mode: 'queue' | 'interrupt' = 'interrupt') => {
      setStatus({ key, tone });
      void playAudio(key, mode);
    },
    [playAudio],
  );

  useEffect(() => {
    if (statusTimeoutRef.current !== null) {
      window.clearTimeout(statusTimeoutRef.current);
    }

    if (interactionLocked) {
      return;
    }

    statusTimeoutRef.current = window.setTimeout(() => {
      setStatusWithAudio('games.letterStorybook.instructions.tapNext', 'neutral', 'queue');
      statusTimeoutRef.current = null;
    }, 1100);

    return () => {
      if (statusTimeoutRef.current !== null) {
        window.clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = null;
      }
    };
  }, [interactionLocked, setStatusWithAudio]);

  useEffect(() => {
    void playNarrationForPage();

    if (currentPage.kind === 'cover') {
      setStatus({ key: 'games.letterStorybook.instructions.intro', tone: 'neutral' });
      return;
    }

    if (currentPage.kind === 'mission') {
      setStatus({ key: 'games.letterStorybook.instructions.mission', tone: 'neutral' });
      return;
    }

    if (currentPage.kind === 'celebration') {
      setStatus({ key: 'games.letterStorybook.completion.summary', tone: 'success' });
      return;
    }

    setStatus({ key: 'games.letterStorybook.instructions.tapReplay', tone: 'neutral' });
  }, [currentPage, playNarrationForPage]);

  useEffect(
    () => () => {
      if (statusTimeoutRef.current !== null) {
        window.clearTimeout(statusTimeoutRef.current);
      }
    },
    [],
  );

  const buildLetterChoiceOptions = useCallback(
    (letterId: LetterId): ChoiceOption[] => {
      const letterIndex = LETTER_SEQUENCE.findIndex((entry) => entry.id === letterId);
      const optionCount = routingContext.ageBand === '3-4' ? 2 : 3;
      const distractorIndexes = [
        (letterIndex + 3 + LETTER_SEQUENCE.length) % LETTER_SEQUENCE.length,
        (letterIndex + 7 + LETTER_SEQUENCE.length) % LETTER_SEQUENCE.length,
        (letterIndex + 11 + LETTER_SEQUENCE.length) % LETTER_SEQUENCE.length,
      ];

      const distractorIds = distractorIndexes
        .map((index) => LETTER_SEQUENCE[index]!.id)
        .filter((id) => id !== letterId)
        .slice(0, optionCount - 1);

      const allIds = [letterId, ...distractorIds]
        .filter((id, index, collection) => collection.indexOf(id) === index)
        .slice(0, optionCount);

      allIds.sort((left, right) => {
        if (left === letterId) return -1;
        if (right === letterId) return 1;
        return left.localeCompare(right);
      });

      return allIds.map((id) => ({
        id,
        label: t(`games.letterStorybook.letters.${id}.word` as const),
        audioKey: `games.letterStorybook.letters.${id}.word`,
        isCorrect: id === letterId,
      }));
    },
    [routingContext.ageBand, t],
  );

  const buildCheckpointChoiceOptions = useCallback(
    (page: CheckpointPage): ChoiceOption[] => {
      const optionCount = routingContext.ageBand === '3-4' ? 2 : 3;
      const chapterLetterIds = getChapterLetterIds(page.chapter);
      const chapterIndex = chapterLetterIds.indexOf(page.targetLetterId);
      const distractors = [
        chapterLetterIds[(chapterIndex + 1 + chapterLetterIds.length) % chapterLetterIds.length],
        chapterLetterIds[(chapterIndex + 3 + chapterLetterIds.length) % chapterLetterIds.length],
      ]
        .filter((id): id is LetterId => Boolean(id) && id !== page.targetLetterId)
        .slice(0, optionCount - 1);

      const ids = [page.targetLetterId, ...distractors];
      ids.sort((left, right) => {
        if (left === page.targetLetterId) return -1;
        if (right === page.targetLetterId) return 1;
        return left.localeCompare(right);
      });

      return ids.map((id) => ({
        id,
        label: t(`games.letterStorybook.letters.${id}.symbol` as const),
        audioKey: `games.letterStorybook.letters.${id}.sound`,
        isCorrect: id === page.targetLetterId,
      }));
    },
    [routingContext.ageBand, t],
  );

  const buildFinalFormChoiceOptions = useCallback(
    (step: number): ChoiceOption[] => {
      const current = FINAL_FORMS[clamp(step, 0, FINAL_FORMS.length - 1)]!;
      const finalSymbol = t(current.finalSymbolKey);
      const decoySymbol = t(toLetterSymbolKey(current.decoyLetterId));
      const options = [
        {
          id: `${current.id}-final`,
          label: finalSymbol,
          audioKey: current.wordKey,
          isCorrect: true,
        },
        {
          id: `${current.id}-base`,
          label: t(current.baseSymbolKey),
          audioKey: current.baseSymbolKey,
          isCorrect: false,
        },
        {
          id: `${current.id}-decoy`,
          label: decoySymbol,
          audioKey: 'games.letterStorybook.finalForms.retry',
          isCorrect: false,
        },
      ];

      return options;
    },
    [t],
  );

  const activeChoiceOptions = useMemo(() => {
    if (isLetterPage(currentPage)) {
      return buildLetterChoiceOptions(currentPage.letterId);
    }

    if (isCheckpointPage(currentPage)) {
      return buildCheckpointChoiceOptions(currentPage);
    }

    if (isFinalFormsPage(currentPage)) {
      return buildFinalFormChoiceOptions(finalFormStep);
    }

    return [];
  }, [buildCheckpointChoiceOptions, buildFinalFormChoiceOptions, buildLetterChoiceOptions, currentPage, finalFormStep]);

  const registerSolvedPage = useCallback(
    (pageId: string, wasFirstTry: boolean) => {
      setSolvedPageIds((previous) => {
        const next = new Set(previous);
        next.add(pageId);
        return next;
      });
      setFirstTrySuccessByPage((previous) => ({
        ...previous,
        [pageId]: wasFirstTry,
      }));
      setStatusWithAudio('games.letterStorybook.feedback.success.v1', 'success');
    },
    [setStatusWithAudio],
  );

  const registerWrongTap = useCallback((): boolean => {
    const now = Date.now();
    const recent = wrongTapTimestampsRef.current.filter((timestamp) => now - timestamp <= ANTI_RANDOM_WINDOW_MS);
    recent.push(now);
    wrongTapTimestampsRef.current = recent;

    if (recent.length >= ANTI_RANDOM_TAP_COUNT) {
      setPauseUntil(now + ANTI_RANDOM_PAUSE_MS);
      setStatusWithAudio('games.letterStorybook.guards.rapidTapPause', 'hint', 'interrupt');
      wrongTapTimestampsRef.current = [];
      return true;
    }

    return false;
  }, [setStatusWithAudio]);

  const handleChoiceSelect = useCallback(
    (option: ChoiceOption) => {
      if (!interactionRequired) {
        return;
      }

      if (Date.now() < pauseUntil) {
        setStatusWithAudio('games.letterStorybook.guards.rapidTapReset', 'hint', 'queue');
        return;
      }

      setSelectedOptionByPage((previous) => ({
        ...previous,
        [currentPage.id]: option.id,
      }));
      void playAudio(option.audioKey, 'interrupt');

      const currentAttempts = attemptsByPage[currentPage.id] ?? 0;
      const nextAttempts = currentAttempts + 1;
      setAttemptsByPage((previous) => ({
        ...previous,
        [currentPage.id]: nextAttempts,
      }));

      if (option.isCorrect) {
        if (isFinalFormsPage(currentPage)) {
          if (finalFormStep >= FINAL_FORMS.length - 1) {
            registerSolvedPage(currentPage.id, nextAttempts === 1);
            setStatusWithAudio('games.letterStorybook.finalForms.success', 'success');
            return;
          }

          setFinalFormStep((value) => value + 1);
          setStatusWithAudio('games.letterStorybook.feedback.success.v2', 'success');
          return;
        }

        registerSolvedPage(currentPage.id, nextAttempts === 1);
        return;
      }

      const wasAntiRandomPause = registerWrongTap();
      if (wasAntiRandomPause) {
        return;
      }

      setStatusWithAudio('games.letterStorybook.feedback.encouragement.v1', 'hint', 'interrupt');
    },
    [
      attemptsByPage,
      currentPage,
      finalFormStep,
      interactionRequired,
      pauseUntil,
      playAudio,
      registerSolvedPage,
      registerWrongTap,
      setStatusWithAudio,
    ],
  );

  const activeHintStep = hintsByPage[currentPage.id] ?? 0;

  const handleHint = useCallback(() => {
    if (currentPage.kind === 'cover' || currentPage.kind === 'mission' || currentPage.kind === 'celebration') {
      return;
    }

    setHintsByPage((previous) => ({
      ...previous,
      [currentPage.id]: (previous[currentPage.id] ?? 0) + 1,
    }));

    if (isLetterPage(currentPage)) {
      const nextHintStep = clamp(activeHintStep + 1, 1, 3);
      const hintKey = `games.letterStorybook.letters.${currentPage.letterId}.hint${nextHintStep}`;
      setStatusWithAudio(hintKey, 'hint', 'interrupt');
      return;
    }

    if (isFinalFormsPage(currentPage)) {
      setStatusWithAudio('games.letterStorybook.finalForms.hint1', 'hint', 'interrupt');
      return;
    }

    if (isCheckpointPage(currentPage)) {
      setStatusWithAudio(`games.letterStorybook.checkpoints.${currentPage.chapter}.hint1`, 'hint', 'interrupt');
      return;
    }
  }, [activeHintStep, currentPage, setStatusWithAudio]);

  const handleRetry = useCallback(() => {
    if (currentPage.kind === 'cover' || currentPage.kind === 'mission' || currentPage.kind === 'celebration') {
      return;
    }

    setSelectedOptionByPage((previous) => ({
      ...previous,
      [currentPage.id]: '',
    }));
    setStatusWithAudio('games.letterStorybook.instructions.tapRetry', 'hint', 'interrupt');
  }, [currentPage, setStatusWithAudio]);

  const goPrevious = useCallback(() => {
    if (!canGoPrevious) {
      return;
    }

    setPageIndex((index) => Math.max(0, index - 1));
    setStatusWithAudio('games.letterStorybook.instructions.tapReplay', 'neutral', 'queue');
  }, [canGoPrevious, setStatusWithAudio]);

  const buildCompletionResult = useCallback((): GameCompletionResult => {
    const interactivePages = pages.filter((page) => page.requiresInteraction).map((page) => page.id);
    const solvedInteractivePages = interactivePages.filter((id) => solvedPageIds.has(id));
    const firstTryCount = solvedInteractivePages.filter((id) => firstTrySuccessByPage[id]).length;
    const totalInteractive = interactivePages.length;

    const firstAttemptSuccessRate = Math.round((firstTryCount / Math.max(totalInteractive, 1)) * 100);
    const hintsPerPage = solvedInteractivePages.map((id) => hintsByPage[id] ?? 0);
    const hintTrend = toHintTrend(hintsPerPage);
    const checkpointPages = pages.filter(isCheckpointPage).map((page) => page.id);
    const checkpointFirstTryCount = checkpointPages.filter((id) => firstTrySuccessByPage[id]).length;
    const checkpointAccuracy = Math.round((checkpointFirstTryCount / Math.max(checkpointPages.length, 1)) * 100);

    const replayParticipation = Math.round(
      clamp((replayTapCount / Math.max(pages.length, 1)) * 100, 0, 100),
    );

    const score = Math.round(
      clamp(firstAttemptSuccessRate * 0.74 + checkpointAccuracy * 0.18 + (100 - (hintsPerPage.reduce((sum, value) => sum + value, 0) * 4)) * 0.08, 0, 100),
    );

    return {
      completed: true,
      score,
      stars: score >= 85 ? 3 : score >= 65 ? 2 : 1,
      roundsCompleted: solvedInteractivePages.length,
      summaryMetrics: {
        highestStableRange: toStableRange(firstAttemptSuccessRate),
        firstAttemptSuccessRate,
        hintTrend,
        ageBand: toParentSummaryAgeBand(routingContext.ageBand),
        decodeAccuracy: checkpointAccuracy,
        sequenceEvidenceScore: checkpointAccuracy,
        listenParticipation: replayParticipation,
      },
    };
  }, [firstTrySuccessByPage, hintsByPage, pages, replayTapCount, routingContext.ageBand, solvedPageIds]);

  const finishSession = useCallback(() => {
    if (completionSentRef.current) {
      return;
    }

    const completion = buildCompletionResult();
    completionSentRef.current = true;
    setShowCompletionCelebration(true);
    onComplete(completion);
    setStatusWithAudio('games.letterStorybook.completion.summary', 'success', 'interrupt');
  }, [buildCompletionResult, onComplete, setStatusWithAudio]);

  const goNext = useCallback(() => {
    if (currentPage.kind === 'celebration') {
      finishSession();
      return;
    }

    if (interactionLocked) {
      setStatusWithAudio('games.letterStorybook.instructions.matchAssociation', 'hint', 'interrupt');
      return;
    }

    setPageIndex((index) => Math.min(index + 1, pages.length - 1));
  }, [currentPage.kind, finishSession, interactionLocked, pages.length, setStatusWithAudio]);

  const handleNarrationReplay = useCallback(() => {
    setReplayTapCount((value) => value + 1);
    setStatusWithAudio('games.letterStorybook.instructions.tapReplay', 'neutral', 'interrupt');
    void playNarrationForPage();
  }, [playNarrationForPage, setStatusWithAudio]);

  const handleEdgeNext = useCallback(() => {
    if (!interactionLocked || isSupportCheckpointUnlocked) {
      goNext();
      return;
    }

    setStatusWithAudio('games.letterStorybook.instructions.matchAssociation', 'hint', 'interrupt');
  }, [goNext, interactionLocked, isSupportCheckpointUnlocked, setStatusWithAudio]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (interactionLocked) {
        return;
      }

      const start = pointerStartRef.current;
      pointerStartRef.current = null;
      if (!start) {
        return;
      }

      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;
      if (Math.abs(deltaY) > SWIPE_VERTICAL_DRIFT_PX) {
        return;
      }

      if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) {
        return;
      }

      if (deltaX < 0) {
        goNext();
      } else {
        goPrevious();
      }
    },
    [goNext, goPrevious, interactionLocked],
  );

  const renderStoryBody = () => {
    if (currentPage.kind === 'cover') {
      return (
        <div className="letter-storybook__cover" role="group" aria-label={t('games.letterStorybook.cover.welcome')}>
          <span className="letter-storybook__cover-icon" aria-hidden="true">
            📚
          </span>
          <h2 className="letter-storybook__cover-title">{t('games.letterStorybook.cover.welcome')}</h2>
          <p className="letter-storybook__cover-copy">{t('games.letterStorybook.cover.goal')}</p>
        </div>
      );
    }

    if (currentPage.kind === 'mission') {
      return (
        <div className="letter-storybook__cover" role="group" aria-label={t('games.letterStorybook.instructions.mission')}>
          <span className="letter-storybook__cover-icon" aria-hidden="true">
            🧭
          </span>
          <h2 className="letter-storybook__cover-title">{t('games.letterStorybook.instructions.mission')}</h2>
          <p className="letter-storybook__cover-copy">{t('games.letterStorybook.instructions.listenAndTapLetter')}</p>
        </div>
      );
    }

    if (currentPage.kind === 'celebration') {
      return (
        <div className="letter-storybook__cover" role="group" aria-label={t('games.letterStorybook.completion.title')}>
          <span className="letter-storybook__cover-icon" aria-hidden="true">
            🎉
          </span>
          <h2 className="letter-storybook__cover-title">{t('games.letterStorybook.completion.title')}</h2>
          <p className="letter-storybook__cover-copy">{t('games.letterStorybook.completion.nextStep')}</p>
        </div>
      );
    }

    if (isLetterPage(currentPage) && activeLetterDefinition) {
      const letterSymbol = t(`games.letterStorybook.letters.${currentPage.letterId}.symbol` as const);
      const anchorWord = t(`games.letterStorybook.letters.${currentPage.letterId}.word` as const);
      return (
        <div className="letter-storybook__letter-stage">
          <div className="letter-storybook__letter-hero" aria-live="polite">
            <span className="letter-storybook__letter-symbol">{letterSymbol}</span>
            <span className="letter-storybook__letter-word">{anchorWord}</span>
          </div>
          <span className="letter-storybook__letter-emoji" aria-hidden="true">
            {activeLetterDefinition.emoji}
          </span>
        </div>
      );
    }

    if (isCheckpointPage(currentPage)) {
      const targetSymbol = t(`games.letterStorybook.letters.${currentPage.targetLetterId}.symbol` as const);
      const targetWord = t(`games.letterStorybook.letters.${currentPage.targetLetterId}.word` as const);
      return (
        <div className="letter-storybook__checkpoint-stage">
          <span className="letter-storybook__checkpoint-icon" aria-hidden="true">
            🧩
          </span>
          <h3 className="letter-storybook__checkpoint-title">{t(`games.letterStorybook.checkpoints.${currentPage.chapter}.intro`)}</h3>
          <p className="letter-storybook__checkpoint-copy">
            {t(`games.letterStorybook.checkpoints.${currentPage.chapter}.prompt`)}
          </p>
          <p className="letter-storybook__checkpoint-target" aria-live="polite">
            {targetSymbol} · {targetWord}
          </p>
        </div>
      );
    }

    if (isFinalFormsPage(currentPage)) {
      const step = FINAL_FORMS[clamp(finalFormStep, 0, FINAL_FORMS.length - 1)]!;
      const baseSymbol = t(step.baseSymbolKey);
      const finalSymbol = t(step.finalSymbolKey);
      return (
        <div className="letter-storybook__checkpoint-stage">
          <span className="letter-storybook__checkpoint-icon" aria-hidden="true">
            ✨
          </span>
          <h3 className="letter-storybook__checkpoint-title">{t('games.letterStorybook.finalForms.intro')}</h3>
          <p className="letter-storybook__checkpoint-copy">{t(step.promptKey)}</p>
          <p className="letter-storybook__checkpoint-target" aria-live="polite">
            {baseSymbol} → {finalSymbol}
          </p>
        </div>
      );
    }

    return null;
  };

  const narrationText = useMemo(() => {
    if (currentPage.kind === 'cover') {
      return t('games.letterStorybook.cover.startPrompt');
    }

    if (currentPage.kind === 'mission') {
      return t('games.letterStorybook.instructions.mission');
    }

    if (currentPage.kind === 'celebration') {
      return t('games.letterStorybook.completion.summary');
    }

    if (isLetterPage(currentPage)) {
      return t(`games.letterStorybook.letters.${currentPage.letterId}.story` as const);
    }

    if (isCheckpointPage(currentPage)) {
      return t(`games.letterStorybook.checkpoints.${currentPage.chapter}.prompt`);
    }

    const finalStep = FINAL_FORMS[clamp(finalFormStep, 0, FINAL_FORMS.length - 1)]!;
    return t(finalStep.promptKey);
  }, [currentPage, finalFormStep, t]);

  const pageChipLetter = useMemo(() => {
    if (isLetterPage(currentPage)) {
      return t(`games.letterStorybook.letters.${currentPage.letterId}.symbol` as const);
    }

    if (isCheckpointPage(currentPage)) {
      return t(`games.letterStorybook.letters.${currentPage.targetLetterId}.symbol` as const);
    }

    if (isFinalFormsPage(currentPage)) {
      return t(FINAL_FORMS[clamp(finalFormStep, 0, FINAL_FORMS.length - 1)]!.finalSymbolKey);
    }

    return '☆';
  }, [currentPage, finalFormStep, t]);

  return (
    <Card padding="lg" className="letter-storybook">
      {showCompletionCelebration ? <SuccessCelebration /> : null}

      <header className="letter-storybook__header">
        <div className="letter-storybook__title-wrap">
          <h2 className="letter-storybook__title">{t('games.letterStorybook.title')}</h2>
          <p className="letter-storybook__subtitle">{t('games.letterStorybook.subtitle')}</p>
        </div>

        <div className="letter-storybook__chip" aria-live="polite">
          {pageChipLetter} · {pageIndex + 1} / {pages.length}
        </div>
      </header>

      <div className="letter-storybook__progress-row" aria-label={t('games.letterStorybook.instructions.checkpointReady')}>
        <div className="letter-storybook__clue-meter" role="status" aria-live="polite">
          {Array.from({ length: slotCount }, (_, index) => (
            <span
              key={`clue-slot-${index + 1}`}
              className={[
                'letter-storybook__clue-slot',
                index < chapterProgress ? 'letter-storybook__clue-slot--filled' : '',
              ].join(' ')}
              aria-hidden="true"
            />
          ))}
        </div>

        <div className="letter-storybook__dot-window" aria-hidden="true">
          {dotWindow.map((index) => (
            <span
              key={`window-dot-${index}`}
              className={[
                'letter-storybook__dot',
                index < pageIndex ? 'letter-storybook__dot--done' : '',
                index === pageIndex ? 'letter-storybook__dot--active' : '',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      <section
        className="letter-storybook__frame"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <button
          type="button"
          className="letter-storybook__edge-nav letter-storybook__edge-nav--previous"
          onClick={goPrevious}
          disabled={!canGoPrevious}
          aria-label={t('nav.back')}
        >
          {prevIcon}
        </button>

        <button
          type="button"
          className="letter-storybook__edge-nav letter-storybook__edge-nav--next"
          onClick={handleEdgeNext}
          disabled={pageIndex >= pages.length - 1 || interactionLocked}
          aria-label={t('games.letterStorybook.controls.next')}
        >
          {nextIcon}
        </button>

        <div className="letter-storybook__stage">{renderStoryBody()}</div>

        <button
          type="button"
          className="letter-storybook__narration-strip"
          onClick={handleNarrationReplay}
          aria-label={t('games.letterStorybook.controls.replay')}
        >
          <span className="letter-storybook__narration-icon" aria-hidden="true">
            {isNarrationPlaying ? '⏸' : replayIcon}
          </span>
          <span className="letter-storybook__narration-text">{narrationText}</span>
        </button>

        {interactionRequired && !interactionSolved ? (
          <div className="letter-storybook__interaction-tray" role="group" aria-label={t('games.letterStorybook.instructions.matchAssociation')}>
            {activeChoiceOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={[
                  'letter-storybook__choice',
                  selectedOptionByPage[currentPage.id] === option.id ? 'letter-storybook__choice--selected' : '',
                ].join(' ')}
                onClick={() => handleChoiceSelect(option)}
                aria-label={option.label}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="letter-storybook__control-rail" role="group" aria-label={t('games.letterStorybook.instructions.tapNext')}>
          <button
            type="button"
            className="letter-storybook__control-button"
            onClick={handleNarrationReplay}
            aria-label={t('games.letterStorybook.controls.replay')}
          >
            {replayIcon}
          </button>

          <button
            type="button"
            className="letter-storybook__control-button"
            onClick={handleRetry}
            aria-label={t('games.letterStorybook.controls.retry')}
            disabled={!interactionRequired}
          >
            ↻
          </button>

          <button
            type="button"
            className="letter-storybook__control-button"
            onClick={handleHint}
            aria-label={t('games.letterStorybook.controls.hint')}
            disabled={!interactionRequired}
          >
            💡
          </button>

          <button
            type="button"
            className="letter-storybook__control-button"
            onClick={goNext}
            aria-label={pageIndex >= pages.length - 1 ? t('nav.finish') : t('games.letterStorybook.controls.next')}
            disabled={interactionLocked}
          >
            {pageIndex >= pages.length - 1 ? '✓' : nextIcon}
          </button>
        </div>

        <div className="letter-storybook__status-row" aria-live="polite">
          <MascotIllustration variant="hint" size={52} />
          <p className={`letter-storybook__status-text letter-storybook__status-text--${status.tone}`}>{t(status.key, { defaultValue: '' })}</p>
        </div>

        {audioPlaybackFailed ? (
          <p className="letter-storybook__audio-fallback">🔇 {t('games.letterStorybook.instructions.tapReplay')}</p>
        ) : null}
      </section>

      <style>{`
        .letter-storybook {
          display: grid;
          gap: var(--space-md);
          background:
            linear-gradient(160deg, color-mix(in srgb, var(--color-theme-bg) 82%, white 18%) 0%, color-mix(in srgb, var(--color-bg-card) 88%, white 12%) 100%);
          border-radius: var(--radius-xl);
        }

        .letter-storybook__header {
          display: flex;
          justify-content: space-between;
          gap: var(--space-sm);
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .letter-storybook__title-wrap {
          display: grid;
          gap: 4px;
        }

        .letter-storybook__title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: clamp(1.4rem, 2vw, 1.9rem);
        }

        .letter-storybook__subtitle {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-md);
        }

        .letter-storybook__chip {
          min-inline-size: var(--storybook-page-chip-min-inline-size, 9.25rem);
          border-radius: var(--radius-pill);
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 34%, transparent);
          padding-block: 8px;
          padding-inline: 14px;
          color: var(--color-text-primary);
          background: color-mix(in srgb, var(--color-theme-primary) 12%, white 88%);
          text-align: center;
          font-weight: var(--font-weight-semibold);
          font-size: var(--font-size-sm);
        }

        .letter-storybook__progress-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-sm);
        }

        .letter-storybook__clue-meter {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-block-size: 24px;
        }

        .letter-storybook__clue-slot {
          inline-size: 20px;
          block-size: 14px;
          border-radius: var(--radius-pill);
          background: color-mix(in srgb, var(--color-border-subtle) 68%, white 32%);
          border: 1px solid color-mix(in srgb, var(--color-text-muted) 24%, transparent);
        }

        .letter-storybook__clue-slot--filled {
          background: color-mix(in srgb, var(--color-theme-primary) 72%, white 28%);
          border-color: color-mix(in srgb, var(--color-theme-primary) 72%, transparent);
        }

        .letter-storybook__dot-window {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2xs);
        }

        .letter-storybook__dot {
          inline-size: 12px;
          block-size: 12px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--color-border-subtle) 65%, white 35%);
        }

        .letter-storybook__dot--done {
          background: color-mix(in srgb, var(--color-theme-primary) 68%, white 32%);
        }

        .letter-storybook__dot--active {
          background: var(--color-theme-secondary);
          transform: scale(var(--storybook-progress-active-scale, 1.3));
          animation: letter-storybook-dot-pulse 1s ease-in-out infinite;
        }

        .letter-storybook__frame {
          position: relative;
          display: grid;
          gap: var(--space-sm);
          border-radius: var(--handbook-frame-radius);
          border: var(--handbook-frame-border);
          box-shadow: var(--handbook-frame-shadow);
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 87%, white 13%) 0%, color-mix(in srgb, var(--color-theme-bg) 90%, white 10%) 100%);
          padding-block: var(--space-md);
          padding-inline: clamp(16px, 2.8vw, 28px);
          overflow: hidden;
          min-block-size: clamp(560px, 75vh, 820px);
        }

        .letter-storybook__edge-nav {
          position: absolute;
          inset-block-start: 52%;
          transform: translateY(-50%);
          inline-size: var(--storybook-nav-lane-inline-size, clamp(72px, 11vw, 112px));
          block-size: var(--storybook-nav-lane-block-size, clamp(220px, 48vh, 360px));
          border: 0;
          background: transparent;
          color: color-mix(in srgb, var(--color-text-primary) 72%, transparent);
          font-size: 1.85rem;
          display: grid;
          place-items: center;
          z-index: 5;
        }

        .letter-storybook__edge-nav:disabled {
          opacity: 0.35;
        }

        .letter-storybook__edge-nav--previous {
          inset-inline-end: 0;
        }

        .letter-storybook__edge-nav--next {
          inset-inline-start: 0;
        }

        .letter-storybook__stage {
          min-block-size: clamp(240px, 48vh, 420px);
          border-radius: var(--radius-xl);
          background:
            radial-gradient(circle at 18% 20%, color-mix(in srgb, var(--color-theme-secondary) 18%, transparent), transparent 52%),
            radial-gradient(circle at 78% 76%, color-mix(in srgb, var(--color-theme-primary) 16%, transparent), transparent 56%),
            color-mix(in srgb, var(--color-bg-card) 89%, white 11%);
          display: grid;
          place-items: center;
          padding-inline: clamp(14px, 2vw, 26px);
          text-align: center;
          position: relative;
        }

        .letter-storybook__cover,
        .letter-storybook__checkpoint-stage {
          display: grid;
          gap: var(--space-xs);
          align-items: center;
          justify-items: center;
          max-inline-size: 42rem;
        }

        .letter-storybook__cover-icon,
        .letter-storybook__checkpoint-icon {
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1;
        }

        .letter-storybook__cover-title,
        .letter-storybook__checkpoint-title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: clamp(1.3rem, 2.2vw, 1.85rem);
        }

        .letter-storybook__cover-copy,
        .letter-storybook__checkpoint-copy {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-md);
          line-height: 1.5;
        }

        .letter-storybook__checkpoint-target {
          margin: 0;
          color: var(--color-theme-primary);
          font-size: clamp(2.8rem, 7vw, 4.3rem);
          line-height: 1;
          font-weight: var(--font-weight-bold);
        }

        .letter-storybook__letter-stage {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: clamp(12px, 2vw, 24px);
          align-items: center;
          inline-size: min(100%, 740px);
        }

        .letter-storybook__letter-hero {
          display: grid;
          justify-items: center;
          gap: 10px;
        }

        .letter-storybook__letter-symbol {
          font-size: clamp(5rem, 12vw, 7rem);
          line-height: 0.94;
          color: color-mix(in srgb, var(--color-theme-primary) 82%, black 18%);
          text-shadow: 0 8px 20px color-mix(in srgb, var(--color-theme-primary) 25%, transparent);
          font-weight: var(--font-weight-bold);
        }

        .letter-storybook__letter-word {
          font-size: clamp(1.45rem, 3.4vw, 2.1rem);
          color: var(--color-text-primary);
          font-weight: var(--font-weight-semibold);
        }

        .letter-storybook__letter-emoji {
          font-size: clamp(3.1rem, 7vw, 5.2rem);
          filter: drop-shadow(0 10px 12px rgba(0, 0, 0, 0.12));
        }

        .letter-storybook__narration-strip {
          min-block-size: max(60px, var(--storybook-replay-target-size, var(--touch-primary-action)));
          border-radius: var(--radius-lg);
          border: 2px solid color-mix(in srgb, var(--color-theme-secondary) 28%, transparent);
          background: color-mix(in srgb, var(--color-theme-secondary) 12%, white 88%);
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding-inline: clamp(12px, 1.8vw, 20px);
          color: var(--color-text-primary);
          text-align: start;
          font-family: inherit;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-medium);
        }

        .letter-storybook__narration-icon {
          inline-size: 32px;
          block-size: 32px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--color-bg-card) 78%, white 22%);
          display: grid;
          place-items: center;
          flex: none;
          font-size: 1.1rem;
        }

        .letter-storybook__narration-text {
          line-height: 1.45;
        }

        .letter-storybook__interaction-tray {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: clamp(10px, 1.6vw, 16px);
        }

        .letter-storybook__choice {
          min-block-size: max(60px, var(--touch-primary-action));
          border-radius: var(--radius-lg);
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 28%, transparent);
          background: color-mix(in srgb, var(--color-bg-secondary) 72%, white 28%);
          font-size: clamp(1.2rem, 2.6vw, 1.6rem);
          color: var(--color-text-primary);
          font-weight: var(--font-weight-semibold);
          font-family: inherit;
          padding-inline: var(--space-sm);
          transition: transform var(--motion-duration-fast) ease, border-color var(--motion-duration-fast) ease;
        }

        .letter-storybook__choice:active {
          transform: scale(0.98);
        }

        .letter-storybook__choice--selected {
          border-color: var(--color-theme-primary);
          background: color-mix(in srgb, var(--color-theme-primary) 20%, white 80%);
        }

        .letter-storybook__control-rail {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--storybook-control-gap, clamp(12px, 1.8vw, 16px));
          align-items: center;
        }

        .letter-storybook__control-button {
          min-inline-size: max(60px, var(--touch-primary-action));
          min-block-size: max(60px, var(--touch-primary-action));
          border-radius: var(--radius-lg);
          border: 0;
          background: color-mix(in srgb, var(--color-theme-primary) 82%, white 18%);
          color: var(--color-text-primary-on-dark);
          font-size: clamp(1.2rem, 3vw, 1.55rem);
          font-family: inherit;
          font-weight: var(--font-weight-semibold);
        }

        .letter-storybook__control-button:disabled {
          opacity: 0.45;
        }

        .letter-storybook__status-row {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          border-radius: var(--radius-lg);
          background: color-mix(in srgb, var(--color-bg-card) 84%, white 16%);
          padding-inline: var(--space-sm);
          padding-block: var(--space-xs);
        }

        .letter-storybook__status-text {
          margin: 0;
          color: var(--color-text-secondary);
          line-height: 1.4;
          font-size: var(--font-size-md);
        }

        .letter-storybook__status-text--success {
          color: color-mix(in srgb, var(--color-success) 88%, black 12%);
          font-weight: var(--font-weight-semibold);
        }

        .letter-storybook__status-text--hint {
          color: color-mix(in srgb, var(--color-warning) 70%, black 30%);
          font-weight: var(--font-weight-semibold);
        }

        .letter-storybook__audio-fallback {
          margin: 0;
          color: var(--color-text-muted);
          font-size: var(--font-size-sm);
        }

        @keyframes letter-storybook-dot-pulse {
          0% {
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-theme-secondary) 42%, transparent);
          }
          100% {
            box-shadow: 0 0 0 12px transparent;
          }
        }

        @media (max-width: 900px) {
          .letter-storybook__frame {
            min-block-size: clamp(540px, 72vh, 720px);
            padding-inline: 14px;
          }

          .letter-storybook__letter-stage {
            grid-template-columns: 1fr;
          }

          .letter-storybook__edge-nav {
            inline-size: 72px;
            block-size: clamp(200px, 34vh, 260px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .letter-storybook__dot--active {
            animation: none;
          }

          .letter-storybook__choice,
          .letter-storybook__control-button {
            transition: none;
          }
        }
      `}</style>
    </Card>
  );
}
