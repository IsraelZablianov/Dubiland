import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/design-system';
import { SuccessCelebration } from '@/components/motion';
import type { GameProps, ParentSummaryMetrics, ReadingGateStatus, StableRange } from '@/games/engine';

type HandbookMode = 'readToMe' | 'readAndPlay' | 'calmReplay';
type StatusTone = 'neutral' | 'hint' | 'success' | 'error';
type HintTrend = ParentSummaryMetrics['hintTrend'];
type AgeBand = '3-4' | '5-6' | '6-7';
type LadderBookId = 'book1' | 'book4' | 'book7';
type PageId =
  | 'p01'
  | 'p02'
  | 'p03'
  | 'p04'
  | 'p05'
  | 'p06'
  | 'p07'
  | 'p08'
  | 'p09'
  | 'p10';

interface ChoiceDefinition {
  id: string;
  labelKey: string;
  isCorrect: boolean;
  audioKey?: string;
}

interface InteractionDefinition {
  id: string;
  required: boolean;
  promptKey: string;
  hintKey: string;
  successKey: string;
  retryKey: string;
  choices: ChoiceDefinition[];
}

interface HandbookPageDefinition {
  id: PageId;
  narrationKey: string;
  promptKey: string;
  interaction?: InteractionDefinition;
}

interface CompletionSummary {
  metrics: ParentSummaryMetrics;
  firstAttemptRate: number;
  hintRate: number;
  hints: HintTrend;
  visitedCount: number;
  readingGate: ReadingGateStatus;
}

export interface InteractiveHandbookPageProgress {
  visited: boolean;
  solved: boolean;
}

export interface InteractiveHandbookProgressSnapshot {
  furthestPageNumber: number;
  completed: boolean;
  pageCompletion: Record<string, InteractiveHandbookPageProgress>;
}

interface InteractiveHandbookGameProps extends GameProps {
  initialProgress?: InteractiveHandbookProgressSnapshot | null;
  onProgressChange?: (snapshot: InteractiveHandbookProgressSnapshot) => void;
}

type HandbookSlug = 'mikaSoundGarden' | 'yoavLetterMap' | 'tamarWordTower';
type InteractionChoicePresetId =
  | 'letters_bet'
  | 'letters_pe'
  | 'words_gan'
  | 'words_dubi'
  | 'numbers_four'
  | 'recap_letters'
  | 'recap_counting';

const PAGE_IDS: PageId[] = ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p09', 'p10'];
const PAGE_ID_SET = new Set<PageId>(PAGE_IDS);
const LADDER_BOOK_SEQUENCE: LadderBookId[] = ['book1', 'book4', 'book7'];
const AGE_BAND_TO_BOOK: Record<AgeBand, LadderBookId> = {
  '3-4': 'book1',
  '5-6': 'book4',
  '6-7': 'book7',
};
const BOOK_TO_HANDBOOK_SLUG: Record<LadderBookId, HandbookSlug> = {
  book1: 'mikaSoundGarden',
  book4: 'yoavLetterMap',
  book7: 'tamarWordTower',
};
const DEFAULT_QUALITY_GATE_BY_BOOK: Record<LadderBookId, { firstTryAccuracyMin: number; hintRateMax: number }> = {
  book1: { firstTryAccuracyMin: 60, hintRateMax: 55 },
  book4: { firstTryAccuracyMin: 80, hintRateMax: 35 },
  book7: { firstTryAccuracyMin: 75, hintRateMax: 30 },
};
const PROMPT_KEY_ORDER_BY_BOOK: Record<LadderBookId, string[]> = {
  book1: ['firstSound', 'trackLetter', 'findSpeaker', 'choosePicture'],
  book4: ['decodeWord', 'chooseNikud', 'contrastLetters', 'readThenAnswer'],
  book7: ['decodePhrase', 'bridgePhrase', 'sequenceCheck', 'evidenceTap'],
};
const INTERACTION_FLOW_BY_BOOK: Record<LadderBookId, Array<{ pageId: PageId; interactionId: string; presetId: InteractionChoicePresetId }>> = {
  book1: [
    { pageId: 'p02', interactionId: 'firstSoundTap', presetId: 'letters_bet' },
    { pageId: 'p04', interactionId: 'letterPath', presetId: 'letters_pe' },
    { pageId: 'p06', interactionId: 'literalChoice', presetId: 'words_dubi' },
  ],
  book4: [
    { pageId: 'p02', interactionId: 'decodePointedWord', presetId: 'words_gan' },
    { pageId: 'p04', interactionId: 'chooseWordByNikud', presetId: 'numbers_four' },
    { pageId: 'p06', interactionId: 'confusableContrast', presetId: 'letters_bet' },
    { pageId: 'p08', interactionId: 'literalAfterDecoding', presetId: 'words_gan' },
  ],
  book7: [
    { pageId: 'p02', interactionId: 'decodePointedPhrase', presetId: 'words_gan' },
    { pageId: 'p05', interactionId: 'decodeBridgePhrase', presetId: 'numbers_four' },
    { pageId: 'p07', interactionId: 'sequenceOrder', presetId: 'recap_counting' },
    { pageId: 'p09', interactionId: 'textEvidenceTap', presetId: 'recap_letters' },
  ],
};
const CHOICE_PRESETS: Record<InteractionChoicePresetId, ChoiceDefinition[]> = {
  letters_bet: [
    { id: 'bet', labelKey: 'games.interactiveHandbook.choices.letters.bet', isCorrect: true },
    { id: 'kaf', labelKey: 'games.interactiveHandbook.choices.letters.kaf', isCorrect: false },
    { id: 'pe', labelKey: 'games.interactiveHandbook.choices.letters.pe', isCorrect: false },
  ],
  letters_pe: [
    { id: 'pe', labelKey: 'games.interactiveHandbook.choices.letters.pe', isCorrect: true },
    { id: 'bet', labelKey: 'games.interactiveHandbook.choices.letters.bet', isCorrect: false },
    { id: 'kaf', labelKey: 'games.interactiveHandbook.choices.letters.kaf', isCorrect: false },
  ],
  words_gan: [
    { id: 'gan', labelKey: 'games.interactiveHandbook.choices.words.gan', isCorrect: true },
    { id: 'dag', labelKey: 'games.interactiveHandbook.choices.words.dag', isCorrect: false },
    { id: 'dubi', labelKey: 'games.interactiveHandbook.choices.words.dubi', isCorrect: false },
  ],
  words_dubi: [
    { id: 'dubi', labelKey: 'games.interactiveHandbook.choices.words.dubi', isCorrect: true },
    { id: 'dag', labelKey: 'games.interactiveHandbook.choices.words.dag', isCorrect: false },
    { id: 'gan', labelKey: 'games.interactiveHandbook.choices.words.gan', isCorrect: false },
  ],
  numbers_four: [
    { id: 'two', labelKey: 'games.interactiveHandbook.choices.numbers.two', isCorrect: false },
    { id: 'four', labelKey: 'games.interactiveHandbook.choices.numbers.four', isCorrect: true },
    { id: 'six', labelKey: 'games.interactiveHandbook.choices.numbers.six', isCorrect: false },
  ],
  recap_letters: [
    { id: 'counting', labelKey: 'games.interactiveHandbook.choices.recap.counting', isCorrect: false },
    { id: 'colors', labelKey: 'games.interactiveHandbook.choices.recap.colors', isCorrect: false },
    { id: 'letters', labelKey: 'games.interactiveHandbook.choices.recap.letters', isCorrect: true },
  ],
  recap_counting: [
    { id: 'counting', labelKey: 'games.interactiveHandbook.choices.recap.counting', isCorrect: true },
    { id: 'colors', labelKey: 'games.interactiveHandbook.choices.recap.colors', isCorrect: false },
    { id: 'letters', labelKey: 'games.interactiveHandbook.choices.recap.letters', isCorrect: false },
  ],
};

function isHandbookSlug(value: unknown): value is HandbookSlug {
  return value === 'mikaSoundGarden' || value === 'yoavLetterMap' || value === 'tamarWordTower';
}

function handbookMetaKey(slug: HandbookSlug, field: 'title' | 'subtitle' | 'estimatedDuration'): string {
  return `handbooks.${slug}.meta.${field}`;
}

function handbookScriptKey(
  slug: HandbookSlug,
  section: 'narration' | 'prompts' | 'hints' | 'retry' | 'praise',
  key: string,
): string {
  return `handbooks.${slug}.scriptPackage.${section}.${key}`;
}

function handbookSentenceKey(slug: HandbookSlug, group: string, key: string): string {
  return `handbooks.${slug}.sentenceBank.${group}.${key}`;
}

function handbookInteractionKey(slug: HandbookSlug, interactionId: string, field: 'prompt' | 'hint' | 'success' | 'retry'): string {
  return `handbooks.${slug}.interactions.${interactionId}.${field}`;
}

function parentHandbookKey(slug: HandbookSlug, field: 'progressSummary' | 'nextStep' | 'readingSignal' | 'confusionFocus'): string {
  return `parentDashboard.handbooks.${slug}.${field}`;
}

function completionPraiseKey(slug: HandbookSlug, activeBookId: LadderBookId): string {
  if (activeBookId === 'book1') return handbookScriptKey(slug, 'praise', 'teamwork');
  if (activeBookId === 'book4') return handbookScriptKey(slug, 'praise', 'greatProgress');
  return handbookScriptKey(slug, 'praise', 'independent');
}

function buildNarrationSentenceKeys(activeBookId: LadderBookId, handbookSlug: HandbookSlug): string[] {
  if (activeBookId === 'book1') {
    return ['p01', 'p02', 'p03', 'p04', 'p05', 'p06'].map((id) => handbookSentenceKey(handbookSlug, 'modeledPhrases', id));
  }

  if (activeBookId === 'book4') {
    return ['p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08'].map((id) =>
      handbookSentenceKey(handbookSlug, 'pointedPhrases', id),
    );
  }

  return [
    ...['p01', 'p02', 'p03', 'p04', 'p05'].map((id) => handbookSentenceKey(handbookSlug, 'pointedPhrases', id)),
    ...['b01', 'b02', 'b03', 'b04', 'b05'].map((id) => handbookSentenceKey(handbookSlug, 'bridgePhrases', id)),
  ];
}

function buildInteractionDefinition(
  handbookSlug: HandbookSlug,
  interactionId: string,
  presetId: InteractionChoicePresetId,
): InteractionDefinition {
  return {
    id: interactionId,
    required: true,
    promptKey: handbookInteractionKey(handbookSlug, interactionId, 'prompt'),
    hintKey: handbookInteractionKey(handbookSlug, interactionId, 'hint'),
    successKey: handbookInteractionKey(handbookSlug, interactionId, 'success'),
    retryKey: handbookInteractionKey(handbookSlug, interactionId, 'retry'),
    choices: CHOICE_PRESETS[presetId],
  };
}

function buildPageDefinitions(activeBookId: LadderBookId, handbookSlug: HandbookSlug): HandbookPageDefinition[] {
  const narrationKeys = buildNarrationSentenceKeys(activeBookId, handbookSlug).slice(0, PAGE_IDS.length);
  const promptTokens = PROMPT_KEY_ORDER_BY_BOOK[activeBookId];
  const interactionFlow = INTERACTION_FLOW_BY_BOOK[activeBookId];
  const interactionByPage = new Map(
    interactionFlow.map((item) => [item.pageId, buildInteractionDefinition(handbookSlug, item.interactionId, item.presetId)]),
  );

  return narrationKeys.map((narrationKey, index) => {
    const pageId = PAGE_IDS[index] as PageId;
    const promptToken = promptTokens[index % promptTokens.length] ?? promptTokens[0];

    return {
      id: pageId,
      narrationKey,
      promptKey: handbookScriptKey(handbookSlug, 'prompts', promptToken),
      interaction: interactionByPage.get(pageId),
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLadderBookId(value: unknown): value is LadderBookId {
  return typeof value === 'string' && LADDER_BOOK_SEQUENCE.includes(value as LadderBookId);
}

function isAgeBand(value: unknown): value is AgeBand {
  return typeof value === 'string' && value in AGE_BAND_TO_BOOK;
}

function clampPercent(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveActiveLadderBookId(levelConfig: Record<string, unknown>): LadderBookId {
  const readingLadderConfig = isRecord(levelConfig.readingLadder) ? levelConfig.readingLadder : null;
  if (readingLadderConfig && isLadderBookId(readingLadderConfig.activeBook)) {
    return readingLadderConfig.activeBook;
  }

  if (isAgeBand(levelConfig.defaultBand)) {
    return AGE_BAND_TO_BOOK[levelConfig.defaultBand];
  }

  return 'book4';
}

function resolveHandbookSlug(levelConfig: Record<string, unknown>, activeBookId: LadderBookId): HandbookSlug {
  const readingLadderConfig = isRecord(levelConfig.readingLadder) ? levelConfig.readingLadder : null;
  const booksConfig = readingLadderConfig && isRecord(readingLadderConfig.books) ? readingLadderConfig.books : null;
  const activeBookConfig = booksConfig && isRecord(booksConfig[activeBookId]) ? booksConfig[activeBookId] : null;

  if (activeBookConfig && isHandbookSlug(activeBookConfig.handbookSlug)) {
    return activeBookConfig.handbookSlug;
  }

  if (isHandbookSlug(levelConfig.handbookSlug)) {
    return levelConfig.handbookSlug;
  }

  return BOOK_TO_HANDBOOK_SLUG[activeBookId];
}

function resolveQualityGate(
  levelConfig: Record<string, unknown>,
  activeBookId: LadderBookId,
): { firstTryAccuracyMin: number; hintRateMax: number } {
  const readingLadderConfig = isRecord(levelConfig.readingLadder) ? levelConfig.readingLadder : null;
  const qualityGateConfig = readingLadderConfig && isRecord(readingLadderConfig.qualityGate)
    ? readingLadderConfig.qualityGate
    : null;
  const defaultQualityGate = DEFAULT_QUALITY_GATE_BY_BOOK[activeBookId];

  return {
    firstTryAccuracyMin: clampPercent(
      qualityGateConfig?.firstTryAccuracyMin,
      defaultQualityGate.firstTryAccuracyMin,
    ),
    hintRateMax: clampPercent(qualityGateConfig?.hintRateMax, defaultQualityGate.hintRateMax),
  };
}

function getNextBookId(activeBookId: LadderBookId): LadderBookId | null {
  const activeIndex = LADDER_BOOK_SEQUENCE.indexOf(activeBookId);
  if (activeIndex < 0 || activeIndex >= LADDER_BOOK_SEQUENCE.length - 1) {
    return null;
  }

  return LADDER_BOOK_SEQUENCE[activeIndex + 1] ?? null;
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

function getHintTrend(pageHintUsage: Record<string, number>, orderedPageIds: PageId[]): HintTrend {
  const values = orderedPageIds.map((pageId) => pageHintUsage[pageId] ?? 0);
  const midpoint = Math.ceil(values.length / 2);
  const firstHalf = values.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
  const secondHalf = values.slice(midpoint).reduce((sum, value) => sum + value, 0);

  if (secondHalf < firstHalf) {
    return 'improving';
  }

  if (secondHalf === firstHalf) {
    return 'steady';
  }

  return 'needs_support';
}

function buildStableRange(mandatorySolvedCount: number, mandatoryTotal: number): StableRange {
  if (mandatoryTotal <= 0) {
    return '1-3';
  }

  const completionRatio = mandatorySolvedCount / mandatoryTotal;
  if (completionRatio >= 0.8) {
    return '1-10';
  }

  if (completionRatio >= 0.5) {
    return '1-5';
  }

  return '1-3';
}

function toneClassName(tone: StatusTone): string {
  if (tone === 'hint') return 'interactive-handbook__message interactive-handbook__message--hint';
  if (tone === 'success') return 'interactive-handbook__message interactive-handbook__message--success';
  if (tone === 'error') return 'interactive-handbook__message interactive-handbook__message--error';
  return 'interactive-handbook__message';
}

function shouldHideOptionalInteraction(mode: HandbookMode, interaction: InteractionDefinition | undefined): boolean {
  return mode === 'calmReplay' && interaction?.required === false;
}

function isPageId(value: string): value is PageId {
  return PAGE_ID_SET.has(value as PageId);
}

function pageIdToPageNumber(pageId: PageId): number {
  return Number.parseInt(pageId.slice(1), 10);
}

function getInitialPageIndex(progress: InteractiveHandbookProgressSnapshot | null | undefined, totalPages: number): number {
  const rawPage = progress?.furthestPageNumber ?? 1;
  const clampedPage = Math.min(Math.max(1, totalPages), Math.max(1, Math.floor(rawPage)));
  return clampedPage - 1;
}

function getInitialVisitedPages(
  progress: InteractiveHandbookProgressSnapshot | null | undefined,
  initialPageId: PageId,
  validPageIds: Set<PageId>,
): Set<PageId> {
  const visited = new Set<PageId>([initialPageId]);
  if (!progress?.pageCompletion) {
    return visited;
  }

  Object.entries(progress.pageCompletion).forEach(([pageId, status]) => {
    if (!status?.visited || !isPageId(pageId) || !validPageIds.has(pageId)) {
      return;
    }
    visited.add(pageId);
  });

  return visited;
}

function getInitialSolvedPages(
  progress: InteractiveHandbookProgressSnapshot | null | undefined,
  validPageIds: Set<PageId>,
): Set<PageId> {
  const solved = new Set<PageId>();
  if (!progress?.pageCompletion) {
    return solved;
  }

  Object.entries(progress.pageCompletion).forEach(([pageId, status]) => {
    if (!status?.solved || !isPageId(pageId) || !validPageIds.has(pageId)) {
      return;
    }
    solved.add(pageId);
  });

  return solved;
}

export function InteractiveHandbookGame({
  level,
  onComplete,
  audio,
  initialProgress = null,
  onProgressChange,
}: InteractiveHandbookGameProps) {
  const { t } = useTranslation('common');
  const activeLadderBookId = useMemo(() => resolveActiveLadderBookId(level.configJson), [level.configJson]);
  const activeHandbookSlug = useMemo(
    () => resolveHandbookSlug(level.configJson, activeLadderBookId),
    [activeLadderBookId, level.configJson],
  );
  const pageDefinitions = useMemo(
    () => buildPageDefinitions(activeLadderBookId, activeHandbookSlug),
    [activeHandbookSlug, activeLadderBookId],
  );
  const pageDefinitionIdSet = useMemo(() => new Set(pageDefinitions.map((page) => page.id)), [pageDefinitions]);
  const totalPages = pageDefinitions.length;
  const initialPageIndex = getInitialPageIndex(initialProgress, totalPages);
  const initialPageId = (pageDefinitions[initialPageIndex]?.id ?? pageDefinitions[0]?.id ?? 'p01') as PageId;

  const [mode, setMode] = useState<HandbookMode>('readToMe');
  const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex);
  const [visitedPages, setVisitedPages] = useState<Set<PageId>>(() =>
    getInitialVisitedPages(initialProgress, initialPageId, pageDefinitionIdSet),
  );
  const [solvedPages, setSolvedPages] = useState<Set<PageId>>(() => getInitialSolvedPages(initialProgress, pageDefinitionIdSet));
  const [firstAttemptSuccessPages, setFirstAttemptSuccessPages] = useState<Set<PageId>>(new Set());
  const [pageAttempts, setPageAttempts] = useState<Record<string, number>>({});
  const [pageHintUsage, setPageHintUsage] = useState<Record<string, number>>({});
  const [selectedChoiceByPage, setSelectedChoiceByPage] = useState<Record<string, string>>({});
  const [highlightChoiceByPage, setHighlightChoiceByPage] = useState<Record<string, string>>({});
  const [statusKey, setStatusKey] = useState('games.interactiveHandbook.instructions.intro');
  const [statusTone, setStatusTone] = useState<StatusTone>('neutral');
  const [completionSummary, setCompletionSummary] = useState<CompletionSummary | null>(null);
  const [isNarrationPaused, setIsNarrationPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(Boolean(initialProgress?.completed));

  const completionSentRef = useRef(false);

  const qualityGate = useMemo(
    () => resolveQualityGate(level.configJson, activeLadderBookId),
    [activeLadderBookId, level.configJson],
  );
  const handbookCompletionTitleKey = useMemo(
    () => completionPraiseKey(activeHandbookSlug, activeLadderBookId),
    [activeHandbookSlug, activeLadderBookId],
  );
  const handbookCompletionNextStepKey = useMemo(
    () => parentHandbookKey(activeHandbookSlug, 'nextStep'),
    [activeHandbookSlug],
  );

  const currentPage = (pageDefinitions[currentPageIndex] ?? pageDefinitions[0]) as HandbookPageDefinition;

  const activeInteraction = useMemo(() => {
    if (shouldHideOptionalInteraction(mode, currentPage.interaction)) {
      return undefined;
    }

    return currentPage.interaction;
  }, [currentPage.interaction, mode]);

  const mandatoryPageIds = useMemo(
    () => pageDefinitions.filter((page) => page.interaction?.required).map((page) => page.id),
    [pageDefinitions],
  );

  const mandatorySolvedCount = useMemo(
    () => mandatoryPageIds.filter((pageId) => solvedPages.has(pageId)).length,
    [mandatoryPageIds, solvedPages],
  );

  const canAdvanceCurrentPage = !activeInteraction || solvedPages.has(currentPage.id) || !activeInteraction.required;
  const isLastPage = currentPageIndex === totalPages - 1;

  const progressSnapshot = useMemo<InteractiveHandbookProgressSnapshot>(() => {
    const pageCompletion: Record<string, InteractiveHandbookPageProgress> = {};
    let furthestPageNumber = currentPageIndex + 1;

    pageDefinitions.forEach((page) => {
      const visited = visitedPages.has(page.id);
      const solved = solvedPages.has(page.id);
      if (!visited && !solved) {
        return;
      }

      furthestPageNumber = Math.max(furthestPageNumber, pageIdToPageNumber(page.id));
      pageCompletion[page.id] = { visited, solved };
    });

    return {
      furthestPageNumber,
      completed: isCompleted,
      pageCompletion,
    };
  }, [currentPageIndex, isCompleted, pageDefinitions, solvedPages, visitedPages]);

  const playAudioKey = useCallback(
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

  const markPageVisited = useCallback((pageId: PageId) => {
    setVisitedPages((previous) => {
      if (previous.has(pageId)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(pageId);
      return next;
    });
  }, []);

  const applyHint = useCallback(
    (autoTriggered: boolean) => {
      if (!activeInteraction) {
        return;
      }

      const pageId = currentPage.id;
      const correctChoiceId =
        activeInteraction.choices.find((choice) => choice.isCorrect)?.id ?? activeInteraction.choices[0]?.id ?? '';

      setPageHintUsage((previous) => ({
        ...previous,
        [pageId]: (previous[pageId] ?? 0) + 1,
      }));

      setHighlightChoiceByPage((previous) => ({
        ...previous,
        [pageId]: correctChoiceId,
      }));

      setStatusKey(activeInteraction.hintKey);
      setStatusTone('hint');
      playAudioKey(activeInteraction.hintKey, autoTriggered);
    },
    [activeInteraction, currentPage.id, playAudioKey],
  );

  const replayCurrentPrompt = useCallback(() => {
    if (activeInteraction) {
      setStatusKey(activeInteraction.promptKey);
      setStatusTone('neutral');
      playAudioKey(activeInteraction.promptKey, true);
      return;
    }

    setStatusKey(currentPage.promptKey);
    setStatusTone('neutral');
    playAudioKey(currentPage.narrationKey, true);
  }, [activeInteraction, currentPage.narrationKey, currentPage.promptKey, playAudioKey]);

  const toggleNarrationPause = useCallback(() => {
    if (isNarrationPaused) {
      setIsNarrationPaused(false);
      setStatusKey('games.interactiveHandbook.status.interactionResume');
      setStatusTone('neutral');
      replayCurrentPrompt();
      return;
    }

    setIsNarrationPaused(true);
    audio.stop();
    setStatusKey('games.interactiveHandbook.status.interactionPause');
    setStatusTone('hint');
  }, [audio, isNarrationPaused, replayCurrentPrompt]);

  const retryCurrentInteraction = useCallback(() => {
    if (!activeInteraction) {
      return;
    }

    const pageId = currentPage.id;

    setSelectedChoiceByPage((previous) => {
      const next = { ...previous };
      delete next[pageId];
      return next;
    });

    setHighlightChoiceByPage((previous) => {
      const next = { ...previous };
      delete next[pageId];
      return next;
    });

    setStatusKey('games.interactiveHandbook.controls.retryCue');
    setStatusTone('neutral');
    playAudioKey('games.interactiveHandbook.controls.retryCue', true);

    window.setTimeout(() => {
      setStatusKey(activeInteraction.promptKey);
      playAudioKey(activeInteraction.promptKey);
    }, 180);
  }, [activeInteraction, currentPage.id, playAudioKey]);

  const resolveCompletion = useCallback(() => {
    if (completionSentRef.current) {
      return;
    }

    const allPagesVisited = pageDefinitions.every((page) => visitedPages.has(page.id));
    const allMandatorySolved = mandatoryPageIds.every((pageId) => solvedPages.has(pageId));

    if (!allPagesVisited || !allMandatorySolved) {
      setStatusKey('games.interactiveHandbook.status.completeInteractionFirst');
      setStatusTone('error');
      playAudioKey('games.interactiveHandbook.status.completeInteractionFirst', true);
      return;
    }

    const firstAttemptRate = mandatoryPageIds.length
      ? Math.round(
          (mandatoryPageIds.filter((pageId) => firstAttemptSuccessPages.has(pageId)).length / mandatoryPageIds.length) *
            100,
        )
      : 100;
    const mandatoryHintCount = mandatoryPageIds.reduce((sum, pageId) => sum + (pageHintUsage[pageId] ?? 0), 0);
    const hintRate = mandatoryPageIds.length ? Math.round((mandatoryHintCount / mandatoryPageIds.length) * 100) : 0;

    const hintTrend = getHintTrend(pageHintUsage, pageDefinitions.map((page) => page.id));
    const metrics: ParentSummaryMetrics = {
      highestStableRange: buildStableRange(mandatorySolvedCount, mandatoryPageIds.length),
      firstAttemptSuccessRate: firstAttemptRate,
      hintTrend,
    };
    const gatePassed = firstAttemptRate >= qualityGate.firstTryAccuracyMin && hintRate <= qualityGate.hintRateMax;
    const readingGate: ReadingGateStatus = {
      activeBookId: activeLadderBookId,
      nextBookId: gatePassed ? getNextBookId(activeLadderBookId) : null,
      passed: gatePassed,
      firstAttemptSuccessRate: firstAttemptRate,
      hintRate,
      firstTryAccuracyMin: qualityGate.firstTryAccuracyMin,
      hintRateMax: qualityGate.hintRateMax,
    };

    const optionalSolved = pageDefinitions.filter((page) => page.interaction && !page.interaction.required).filter(
      (page) => solvedPages.has(page.id),
    ).length;
    const visitedCount = pageDefinitions.filter((page) => visitedPages.has(page.id)).length;

    const score = mandatorySolvedCount * 35 + optionalSolved * 12 + firstAttemptRate + (gatePassed ? 45 : 0);
    const stars = firstAttemptRate >= 85 ? 3 : firstAttemptRate >= 65 ? 2 : 1;

    completionSentRef.current = true;

    setCompletionSummary({
      metrics,
      firstAttemptRate,
      hintRate,
      hints: hintTrend,
      visitedCount,
      readingGate,
    });
    setIsCompleted(true);

    setStatusKey(handbookCompletionTitleKey);
    setStatusTone('success');

    playAudioKey(handbookCompletionTitleKey, true);

    onComplete({
      stars,
      score,
      completed: true,
      roundsCompleted: visitedCount,
      summaryMetrics: metrics,
      readingGate,
    });
  }, [
    activeLadderBookId,
    firstAttemptSuccessPages,
    handbookCompletionTitleKey,
    mandatoryPageIds,
    mandatorySolvedCount,
    onComplete,
    pageHintUsage,
    pageDefinitions,
    playAudioKey,
    qualityGate.firstTryAccuracyMin,
    qualityGate.hintRateMax,
    solvedPages,
    visitedPages,
  ]);

  const chooseInteractionOption = useCallback(
    (choice: ChoiceDefinition) => {
      if (!activeInteraction) {
        return;
      }

      const pageId = currentPage.id;
      const nextAttempts = (pageAttempts[pageId] ?? 0) + 1;

      setPageAttempts((previous) => ({
        ...previous,
        [pageId]: nextAttempts,
      }));

      setSelectedChoiceByPage((previous) => ({
        ...previous,
        [pageId]: choice.id,
      }));

      setHighlightChoiceByPage((previous) => {
        const next = { ...previous };
        delete next[pageId];
        return next;
      });

      playAudioKey(choice.audioKey ?? choice.labelKey);

      if (choice.isCorrect) {
        setSolvedPages((previous) => {
          if (previous.has(pageId)) {
            return previous;
          }
          const next = new Set(previous);
          next.add(pageId);
          return next;
        });

        if (nextAttempts === 1 && activeInteraction.required) {
          setFirstAttemptSuccessPages((previous) => {
            if (previous.has(pageId)) {
              return previous;
            }
            const next = new Set(previous);
            next.add(pageId);
            return next;
          });
        }

        setStatusKey(activeInteraction.successKey);
        setStatusTone('success');
        playAudioKey(activeInteraction.successKey, true);
        return;
      }

      setStatusKey(activeInteraction.retryKey);
      setStatusTone('error');
      playAudioKey(activeInteraction.retryKey, true);

      if (nextAttempts >= 2) {
        applyHint(false);
      }
    },
    [activeInteraction, applyHint, currentPage.id, pageAttempts, playAudioKey],
  );

  const goToNextPage = useCallback(() => {
    if (activeInteraction?.required && !solvedPages.has(currentPage.id)) {
      setStatusKey('games.interactiveHandbook.status.completeInteractionFirst');
      setStatusTone('error');
      playAudioKey('games.interactiveHandbook.status.completeInteractionFirst', true);
      return;
    }

    playAudioKey('games.interactiveHandbook.controls.nextCue', true);

    if (isLastPage) {
      resolveCompletion();
      return;
    }

    const nextIndex = Math.min(currentPageIndex + 1, totalPages - 1);
    const nextPage = pageDefinitions[nextIndex] as HandbookPageDefinition;

    markPageVisited(nextPage.id);
    setCurrentPageIndex(nextIndex);
  }, [
    activeInteraction,
    currentPage.id,
    currentPageIndex,
    isLastPage,
    markPageVisited,
    pageDefinitions,
    playAudioKey,
    resolveCompletion,
    solvedPages,
    totalPages,
  ]);

  const visibleChoices = useMemo(() => {
    if (!activeInteraction) {
      return [];
    }

    const attempts = pageAttempts[currentPage.id] ?? 0;
    if (attempts >= 2 && activeInteraction.choices.length > 2) {
      const correct = activeInteraction.choices.find((choice) => choice.isCorrect);
      const fallback = activeInteraction.choices.find((choice) => !choice.isCorrect);
      return [correct, fallback].filter((choice): choice is ChoiceDefinition => Boolean(choice));
    }

    return activeInteraction.choices;
  }, [activeInteraction, currentPage.id, pageAttempts]);

  useEffect(() => {
    markPageVisited(currentPage.id);
    setStatusKey(currentPage.promptKey);
    setStatusTone('neutral');
    setHighlightChoiceByPage((previous) => {
      const next = { ...previous };
      delete next[currentPage.id];
      return next;
    });

    if (isNarrationPaused) {
      return;
    }

    playAudioKey(currentPage.narrationKey, true);

    if (activeInteraction) {
      window.setTimeout(() => {
        setStatusKey(activeInteraction.promptKey);
        playAudioKey(activeInteraction.promptKey);
      }, 220);
    }
  }, [
    activeInteraction,
    currentPage.id,
    currentPage.narrationKey,
    currentPage.promptKey,
    isNarrationPaused,
    markPageVisited,
    playAudioKey,
  ]);

  useEffect(() => {
    if (!activeInteraction || solvedPages.has(currentPage.id) || isNarrationPaused) {
      return;
    }

    const timeoutMs = mode === 'readToMe' ? 4200 : mode === 'readAndPlay' ? 6200 : 7200;
    const timer = window.setTimeout(() => {
      applyHint(true);
    }, timeoutMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeInteraction, applyHint, currentPage.id, isNarrationPaused, mode, solvedPages]);

  useEffect(() => {
    onProgressChange?.(progressSnapshot);
  }, [onProgressChange, progressSnapshot]);

  const progressSegments = useMemo(
    () => pageDefinitions.map((page, index) => ({ index, id: page.id })),
    [pageDefinitions],
  );

  const summaryHintKey = completionSummary
    ? completionSummary.hints === 'improving'
      ? 'games.interactiveHandbook.summary.hintTrend.improving'
      : completionSummary.hints === 'steady'
        ? 'games.interactiveHandbook.summary.hintTrend.steady'
        : 'games.interactiveHandbook.summary.hintTrend.needsSupport'
    : null;

  return (
    <Card padding="lg" className="interactive-handbook">
      <div className="interactive-handbook__header">
        <div className="interactive-handbook__title-wrap">
          <h2 className="interactive-handbook__title">{t(handbookMetaKey(activeHandbookSlug, 'title') as any)}</h2>
          <p className="interactive-handbook__subtitle">{t(handbookMetaKey(activeHandbookSlug, 'subtitle') as any)}</p>
        </div>

        <div className="interactive-handbook__mode-switch" role="group" aria-label={t('games.interactiveHandbook.controls.modeGroup')}>
          <button
            type="button"
            className={`interactive-handbook__mode-button ${mode === 'readToMe' ? 'is-active' : ''}`}
            onClick={() => {
              setMode('readToMe');
              playAudioKey('games.interactiveHandbook.modes.readToMe', true);
            }}
            aria-label={t('games.interactiveHandbook.modes.readToMe')}
          >
            {t('games.interactiveHandbook.modes.readToMe')}
          </button>
          <button
            type="button"
            className={`interactive-handbook__mode-button ${mode === 'readAndPlay' ? 'is-active' : ''}`}
            onClick={() => {
              setMode('readAndPlay');
              playAudioKey('games.interactiveHandbook.modes.readAndPlay', true);
            }}
            aria-label={t('games.interactiveHandbook.modes.readAndPlay')}
          >
            {t('games.interactiveHandbook.modes.readAndPlay')}
          </button>
          <button
            type="button"
            className={`interactive-handbook__mode-button ${mode === 'calmReplay' ? 'is-active' : ''}`}
            onClick={() => {
              setMode('calmReplay');
              playAudioKey('games.interactiveHandbook.modes.calmReplay', true);
            }}
            aria-label={t('games.interactiveHandbook.modes.calmReplay')}
          >
            {t('games.interactiveHandbook.modes.calmReplay')}
          </button>
        </div>
      </div>

      <div className="interactive-handbook__progress-row">
        <p className="interactive-handbook__progress-label" aria-live="polite">
          {t('games.interactiveHandbook.reader.pageLabel', {
            current: currentPageIndex + 1,
            total: totalPages,
          })}
        </p>

        <div className="interactive-handbook__progress-rail" aria-hidden="true">
          {progressSegments.map((segment) => {
            const state =
              segment.index < currentPageIndex
                ? 'done'
                : segment.index === currentPageIndex
                  ? 'active'
                  : 'pending';

            return (
              <span
                key={segment.id}
                className={`interactive-handbook__progress-dot interactive-handbook__progress-dot--${state}`}
              />
            );
          })}
        </div>
      </div>

      <div className="interactive-handbook__stage">
        <div className="interactive-handbook__story-card" role="group" aria-label={t(currentPage.narrationKey as any)}>
          <p className="interactive-handbook__page-chip">
            {t('games.interactiveHandbook.reader.pageLabel', {
              current: currentPageIndex + 1,
              total: totalPages,
            })}
          </p>
          <p className="interactive-handbook__narration">{t(currentPage.narrationKey as any)}</p>
          <p className="interactive-handbook__prompt">{t(currentPage.promptKey as any)}</p>
        </div>

        <div className="interactive-handbook__status-row">
          <p className={toneClassName(statusTone)}>{t(statusKey as any)}</p>
        </div>

        <div className="interactive-handbook__controls">
          <button
            type="button"
            className="interactive-handbook__icon-button"
            onClick={replayCurrentPrompt}
            aria-label={t('games.interactiveHandbook.controls.replay')}
          >
            ▶
          </button>
          <button
            type="button"
            className={`interactive-handbook__icon-button ${isNarrationPaused ? 'is-active' : ''}`}
            onClick={toggleNarrationPause}
            aria-label={
              isNarrationPaused ? t('handbooks.reader.controls.playNarration') : t('handbooks.reader.controls.pauseNarration')
            }
            aria-pressed={isNarrationPaused}
          >
            {isNarrationPaused ? '⏵' : '⏸'}
          </button>
          <button
            type="button"
            className="interactive-handbook__icon-button"
            onClick={retryCurrentInteraction}
            disabled={!activeInteraction}
            aria-label={t('games.interactiveHandbook.controls.retry')}
          >
            ↻
          </button>
          <button
            type="button"
            className="interactive-handbook__icon-button"
            onClick={() => applyHint(false)}
            disabled={!activeInteraction}
            aria-label={t('games.interactiveHandbook.controls.hint')}
          >
            💡
          </button>
          <button
            type="button"
            className="interactive-handbook__icon-button"
            onClick={goToNextPage}
            disabled={!canAdvanceCurrentPage && !isLastPage}
            aria-label={t('games.interactiveHandbook.controls.next')}
          >
            →
          </button>
        </div>

        {activeInteraction && (
          <div className="interactive-handbook__interaction-card" aria-live="polite">
            <p className="interactive-handbook__interaction-title">{t(activeInteraction.promptKey as any)}</p>
            <div className="interactive-handbook__choices-grid" role="group" aria-label={t('games.interactiveHandbook.instructions.tapChoice')}>
              {visibleChoices.map((choice) => {
                const selected = selectedChoiceByPage[currentPage.id] === choice.id;
                const highlighted = highlightChoiceByPage[currentPage.id] === choice.id;

                return (
                  <button
                    key={`${currentPage.id}-${choice.id}`}
                    type="button"
                    className={[
                      'interactive-handbook__choice',
                      selected ? 'is-selected' : '',
                      highlighted ? 'is-highlighted' : '',
                    ].join(' ')}
                    onClick={() => chooseInteractionOption(choice)}
                    aria-label={t(choice.labelKey as any)}
                  >
                    <span>{t(choice.labelKey as any)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {completionSummary && (
          <div className="interactive-handbook__completion">
            <SuccessCelebration dense />
            <h3 className="interactive-handbook__completion-title">{t(handbookCompletionTitleKey as any)}</h3>
            <p className="interactive-handbook__completion-line">
              {t(parentHandbookKey(activeHandbookSlug, 'progressSummary') as any, {
                successRate: completionSummary.firstAttemptRate,
                pagesVisited: completionSummary.visitedCount,
              })}
            </p>
            <p className="interactive-handbook__completion-line">
              {t(
                completionSummary.readingGate.passed
                  ? 'games.interactiveHandbook.gates.qualityPassed'
                  : 'games.interactiveHandbook.gates.qualityNeedsSupport',
                {
                  book: t(`games.interactiveHandbook.ladderBooks.${completionSummary.readingGate.activeBookId}` as any),
                  firstAttemptRate: completionSummary.firstAttemptRate,
                  hintRate: completionSummary.hintRate,
                },
              )}
            </p>
            <p className="interactive-handbook__completion-line">
              {t('games.interactiveHandbook.gates.thresholds', {
                firstTryThreshold: completionSummary.readingGate.firstTryAccuracyMin,
                hintRateThreshold: completionSummary.readingGate.hintRateMax,
              })}
            </p>
            {summaryHintKey && <p className="interactive-handbook__completion-line">{t(summaryHintKey as any)}</p>}
            <p className="interactive-handbook__completion-line">
              {completionSummary.readingGate.nextBookId
                ? t('games.interactiveHandbook.gates.nextBookReady', {
                    nextBook: t(`games.interactiveHandbook.ladderBooks.${completionSummary.readingGate.nextBookId}` as any),
                  })
                : t('games.interactiveHandbook.gates.replayCurrentBook')}
            </p>
            <p className="interactive-handbook__completion-line">{t(handbookCompletionNextStepKey as any)}</p>
          </div>
        )}
      </div>

      <style>{`
        .interactive-handbook {
          display: grid;
          gap: var(--space-md);
          border: 2px solid color-mix(in srgb, var(--color-theme-primary) 16%, transparent);
          background:
            radial-gradient(circle at 85% 18%, color-mix(in srgb, var(--color-theme-secondary) 22%, transparent), transparent 40%),
            linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 92%, var(--color-theme-bg) 8%), var(--color-bg-card));
        }

        .interactive-handbook__header {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: var(--space-md);
        }

        .interactive-handbook__title-wrap {
          display: grid;
          gap: var(--space-2xs);
        }

        .interactive-handbook__title {
          margin: 0;
          font-size: var(--font-size-2xl);
          color: var(--color-text-primary);
        }

        .interactive-handbook__subtitle {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .interactive-handbook__mode-switch {
          display: grid;
          grid-auto-flow: column;
          gap: var(--space-2xs);
        }

        .interactive-handbook__mode-button {
          min-height: 44px;
          min-width: 92px;
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          background: var(--color-surface);
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
          cursor: pointer;
          padding: 0 var(--space-xs);
        }

        .interactive-handbook__mode-button.is-active {
          border-color: color-mix(in srgb, var(--color-theme-primary) 72%, transparent);
          color: var(--color-text-primary);
          background: color-mix(in srgb, var(--color-theme-primary) 16%, var(--color-surface));
        }

        .interactive-handbook__progress-row {
          display: grid;
          gap: var(--space-2xs);
        }

        .interactive-handbook__progress-label {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
        }

        .interactive-handbook__progress-rail {
          display: grid;
          grid-template-columns: repeat(${totalPages}, minmax(8px, 1fr));
          gap: 6px;
        }

        .interactive-handbook__progress-dot {
          inline-size: 100%;
          block-size: 8px;
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-border) 72%, transparent);
        }

        .interactive-handbook__progress-dot--done {
          background: color-mix(in srgb, var(--color-accent-success) 88%, white 12%);
        }

        .interactive-handbook__progress-dot--active {
          background: color-mix(in srgb, var(--color-theme-primary) 80%, white 20%);
          animation: interactive-handbook-progress-pulse 900ms ease-in-out infinite alternate;
        }

        .interactive-handbook__stage {
          display: grid;
          gap: var(--space-sm);
        }

        .interactive-handbook__story-card {
          min-height: 220px;
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-border) 76%, transparent);
          padding: var(--space-md);
          display: grid;
          gap: var(--space-xs);
          background:
            linear-gradient(145deg, color-mix(in srgb, var(--color-theme-bg) 72%, var(--color-bg-card) 28%), var(--color-bg-card));
        }

        .interactive-handbook__page-chip {
          margin: 0;
          justify-self: start;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-theme-secondary) 20%, transparent);
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
        }

        .interactive-handbook__narration {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-lg);
          line-height: 1.5;
        }

        .interactive-handbook__prompt {
          margin: 0;
          color: color-mix(in srgb, var(--color-theme-primary) 78%, var(--color-text-primary));
          font-size: var(--font-size-md);
        }

        .interactive-handbook__status-row {
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          background: color-mix(in srgb, var(--color-surface-muted) 84%, transparent);
          padding: var(--space-sm);
          min-height: 56px;
          display: flex;
          align-items: center;
        }

        .interactive-handbook__message {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
        }

        .interactive-handbook__message--hint {
          color: color-mix(in srgb, var(--color-accent-warning) 84%, var(--color-text-primary));
        }

        .interactive-handbook__message--success {
          color: color-mix(in srgb, var(--color-accent-success) 86%, var(--color-text-primary));
        }

        .interactive-handbook__message--error {
          color: color-mix(in srgb, var(--color-accent-danger) 80%, var(--color-text-primary));
        }

        .interactive-handbook__controls {
          display: grid;
          grid-template-columns: repeat(5, minmax(44px, 1fr));
          gap: var(--space-xs);
        }

        .interactive-handbook__icon-button {
          min-height: 52px;
          min-width: 52px;
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-size: 1.3rem;
          cursor: pointer;
          transition: transform var(--motion-duration-fast) var(--motion-ease-standard);
        }

        .interactive-handbook__icon-button:active:not(:disabled) {
          transform: scale(0.96);
        }

        .interactive-handbook__icon-button.is-active {
          border-color: color-mix(in srgb, var(--color-theme-primary) 64%, transparent);
          background: color-mix(in srgb, var(--color-theme-primary) 12%, var(--color-surface));
        }

        .interactive-handbook__icon-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .interactive-handbook__interaction-card {
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-theme-primary) 44%, transparent);
          background: color-mix(in srgb, var(--color-surface) 84%, var(--color-theme-bg));
          padding: var(--space-md);
          display: grid;
          gap: var(--space-sm);
        }

        .interactive-handbook__interaction-title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
        }

        .interactive-handbook__choices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--space-xs);
        }

        .interactive-handbook__choice {
          min-height: 56px;
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
          background: var(--color-bg-card);
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
          cursor: pointer;
          padding: 0 var(--space-sm);
        }

        .interactive-handbook__choice.is-selected {
          border-color: color-mix(in srgb, var(--color-theme-primary) 72%, transparent);
          background: color-mix(in srgb, var(--color-theme-primary) 14%, var(--color-bg-card));
        }

        .interactive-handbook__choice.is-highlighted {
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-warning) 40%, transparent);
        }

        .interactive-handbook__completion {
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-accent-success) 58%, transparent);
          background: color-mix(in srgb, var(--color-accent-success) 10%, var(--color-bg-card));
          padding: var(--space-md);
          display: grid;
          gap: var(--space-xs);
        }

        .interactive-handbook__completion-title {
          margin: 0;
          color: var(--color-text-primary);
          font-size: var(--font-size-xl);
        }

        .interactive-handbook__completion-line {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        @keyframes interactive-handbook-progress-pulse {
          from {
            transform: scaleX(0.95);
          }
          to {
            transform: scaleX(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .interactive-handbook__progress-dot--active {
            animation: none;
          }

          .interactive-handbook__icon-button {
            transition: none;
          }
        }

        @media (max-width: 960px) {
          .interactive-handbook__header {
            grid-template-columns: 1fr;
          }

          .interactive-handbook__mode-switch {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </Card>
  );
}
