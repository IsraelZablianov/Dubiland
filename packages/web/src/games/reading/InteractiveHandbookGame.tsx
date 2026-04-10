import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/design-system';
import { SuccessCelebration } from '@/components/motion';
import type { GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';

type HandbookMode = 'readToMe' | 'readAndPlay' | 'calmReplay';
type StatusTone = 'neutral' | 'hint' | 'success' | 'error';
type HintTrend = ParentSummaryMetrics['hintTrend'];
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
  | 'p10'
  | 'p11'
  | 'p12';

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
  hints: HintTrend;
  visitedCount: number;
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

const PAGE_DEFINITIONS: HandbookPageDefinition[] = [
  {
    id: 'p01',
    narrationKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p01.narration',
    promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p01.prompt',
  },
  {
    id: 'p02',
    narrationKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p02.narration',
    promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p02.prompt',
    interaction: {
      id: 'collectSeeds',
      required: true,
      promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.collectSeeds.prompt',
      hintKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.collectSeeds.hint',
      successKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.collectSeeds.success',
      retryKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.collectSeeds.retry',
      choices: [
        { id: 'two', labelKey: 'games.interactiveHandbook.choices.numbers.two', isCorrect: false },
        { id: 'three', labelKey: 'games.interactiveHandbook.choices.numbers.three', isCorrect: true },
        { id: 'four', labelKey: 'games.interactiveHandbook.choices.numbers.four', isCorrect: false },
      ],
    },
  },
  {
    id: 'p03',
    narrationKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p03.narration',
    promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p03.prompt',
    interaction: {
      id: 'chooseYellowFlower',
      required: true,
      promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.chooseYellowFlower.prompt',
      hintKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.chooseYellowFlower.hint',
      successKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.chooseYellowFlower.success',
      retryKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.chooseYellowFlower.retry',
      choices: [
        { id: 'yellow', labelKey: 'games.interactiveHandbook.choices.colors.yellow', isCorrect: true },
        { id: 'blue', labelKey: 'games.interactiveHandbook.choices.colors.blue', isCorrect: false },
        { id: 'red', labelKey: 'games.interactiveHandbook.choices.colors.red', isCorrect: false },
      ],
    },
  },
  {
    id: 'p04',
    narrationKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p04.narration',
    promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p04.prompt',
    interaction: {
      id: 'pickLetterPe',
      required: true,
      promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.pickLetterPe.prompt',
      hintKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.pickLetterPe.hint',
      successKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.pickLetterPe.success',
      retryKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.pickLetterPe.retry',
      choices: [
        { id: 'pe', labelKey: 'games.interactiveHandbook.choices.letters.pe', isCorrect: true },
        { id: 'bet', labelKey: 'games.interactiveHandbook.choices.letters.bet', isCorrect: false },
        { id: 'kaf', labelKey: 'games.interactiveHandbook.choices.letters.kaf', isCorrect: false },
      ],
    },
  },
  {
    id: 'p05',
    narrationKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p05.narration',
    promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p05.prompt',
    interaction: {
      id: 'compareHealthyPlants',
      required: true,
      promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.compareHealthyPlants.prompt',
      hintKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.compareHealthyPlants.hint',
      successKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.compareHealthyPlants.success',
      retryKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.compareHealthyPlants.retry',
      choices: [
        { id: 'left', labelKey: 'games.interactiveHandbook.choices.compare.left', isCorrect: true },
        { id: 'right', labelKey: 'games.interactiveHandbook.choices.compare.right', isCorrect: false },
      ],
    },
  },
  {
    id: 'p06',
    narrationKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p06.narration',
    promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p06.prompt',
    interaction: {
      id: 'matchFishCount',
      required: false,
      promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.matchFishCount.prompt',
      hintKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.matchFishCount.hint',
      successKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.matchFishCount.success',
      retryKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.matchFishCount.retry',
      choices: [
        { id: 'three', labelKey: 'games.interactiveHandbook.choices.numbers.three', isCorrect: false },
        { id: 'four', labelKey: 'games.interactiveHandbook.choices.numbers.four', isCorrect: true },
        { id: 'six', labelKey: 'games.interactiveHandbook.choices.numbers.six', isCorrect: false },
      ],
    },
  },
  {
    id: 'p07',
    narrationKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p07.narration',
    promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p07.prompt',
    interaction: {
      id: 'solveAddition',
      required: true,
      promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.solveAddition.prompt',
      hintKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.solveAddition.hint',
      successKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.solveAddition.success',
      retryKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.solveAddition.retry',
      choices: [
        { id: 'four', labelKey: 'games.interactiveHandbook.choices.numbers.four', isCorrect: false },
        { id: 'six', labelKey: 'games.interactiveHandbook.choices.numbers.six', isCorrect: true },
        { id: 'eight', labelKey: 'games.interactiveHandbook.choices.numbers.eight', isCorrect: false },
      ],
    },
  },
  {
    id: 'p08',
    narrationKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p08.narration',
    promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p08.prompt',
    interaction: {
      id: 'matchSoundToLetter',
      required: true,
      promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.matchSoundToLetter.prompt',
      hintKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.matchSoundToLetter.hint',
      successKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.matchSoundToLetter.success',
      retryKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.matchSoundToLetter.retry',
      choices: [
        { id: 'pe', labelKey: 'games.interactiveHandbook.choices.letters.pe', isCorrect: true },
        { id: 'bet', labelKey: 'games.interactiveHandbook.choices.letters.bet', isCorrect: false },
        { id: 'kaf', labelKey: 'games.interactiveHandbook.choices.letters.kaf', isCorrect: false },
      ],
    },
  },
  {
    id: 'p09',
    narrationKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p09.narration',
    promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p09.prompt',
    interaction: {
      id: 'sortFruitToBasket',
      required: true,
      promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.sortFruitToBasket.prompt',
      hintKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.sortFruitToBasket.hint',
      successKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.sortFruitToBasket.success',
      retryKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.sortFruitToBasket.retry',
      choices: [
        { id: 'fruit', labelKey: 'games.interactiveHandbook.choices.baskets.fruit', isCorrect: true },
        { id: 'fish', labelKey: 'games.interactiveHandbook.choices.baskets.fish', isCorrect: false },
        { id: 'flowers', labelKey: 'games.interactiveHandbook.choices.baskets.flowers', isCorrect: false },
      ],
    },
  },
  {
    id: 'p10',
    narrationKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p10.narration',
    promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p10.prompt',
    interaction: {
      id: 'buildWordGan',
      required: true,
      promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.buildWordGan.prompt',
      hintKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.buildWordGan.hint',
      successKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.buildWordGan.success',
      retryKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.buildWordGan.retry',
      choices: [
        { id: 'dag', labelKey: 'games.interactiveHandbook.choices.words.dag', isCorrect: false },
        { id: 'gan', labelKey: 'games.interactiveHandbook.choices.words.gan', isCorrect: true },
        { id: 'dubi', labelKey: 'games.interactiveHandbook.choices.words.dubi', isCorrect: false },
      ],
    },
  },
  {
    id: 'p11',
    narrationKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p11.narration',
    promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p11.prompt',
    interaction: {
      id: 'countCelebration',
      required: false,
      promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.countCelebration.prompt',
      hintKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.countCelebration.hint',
      successKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.countCelebration.success',
      retryKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.countCelebration.retry',
      choices: [
        { id: 'six', labelKey: 'games.interactiveHandbook.choices.numbers.six', isCorrect: false },
        { id: 'seven', labelKey: 'games.interactiveHandbook.choices.numbers.seven', isCorrect: true },
        { id: 'eight', labelKey: 'games.interactiveHandbook.choices.numbers.eight', isCorrect: false },
      ],
    },
  },
  {
    id: 'p12',
    narrationKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p12.narration',
    promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p12.prompt',
    interaction: {
      id: 'pickLearnedConcept',
      required: true,
      promptKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.pickLearnedConcept.prompt',
      hintKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.pickLearnedConcept.hint',
      successKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.pickLearnedConcept.success',
      retryKey: 'games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.pickLearnedConcept.retry',
      choices: [
        { id: 'counting', labelKey: 'games.interactiveHandbook.choices.recap.counting', isCorrect: true },
        { id: 'colors', labelKey: 'games.interactiveHandbook.choices.recap.colors', isCorrect: true },
        { id: 'letters', labelKey: 'games.interactiveHandbook.choices.recap.letters', isCorrect: true },
      ],
    },
  },
];

const PAGE_ID_SET = new Set<PageId>(PAGE_DEFINITIONS.map((page) => page.id));

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

function buildStableRange(mandatorySolvedCount: number): StableRange {
  if (mandatorySolvedCount >= 8) {
    return '1-10';
  }

  if (mandatorySolvedCount >= 5) {
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

function getInitialPageIndex(progress: InteractiveHandbookProgressSnapshot | null | undefined): number {
  const rawPage = progress?.furthestPageNumber ?? 1;
  const clampedPage = Math.min(PAGE_DEFINITIONS.length, Math.max(1, Math.floor(rawPage)));
  return clampedPage - 1;
}

function getInitialVisitedPages(
  progress: InteractiveHandbookProgressSnapshot | null | undefined,
  initialPageId: PageId,
): Set<PageId> {
  const visited = new Set<PageId>([initialPageId]);
  if (!progress?.pageCompletion) {
    return visited;
  }

  Object.entries(progress.pageCompletion).forEach(([pageId, status]) => {
    if (!status?.visited || !isPageId(pageId)) {
      return;
    }
    visited.add(pageId);
  });

  return visited;
}

function getInitialSolvedPages(progress: InteractiveHandbookProgressSnapshot | null | undefined): Set<PageId> {
  const solved = new Set<PageId>();
  if (!progress?.pageCompletion) {
    return solved;
  }

  Object.entries(progress.pageCompletion).forEach(([pageId, status]) => {
    if (!status?.solved || !isPageId(pageId)) {
      return;
    }
    solved.add(pageId);
  });

  return solved;
}

export function InteractiveHandbookGame({
  child,
  onComplete,
  audio,
  initialProgress = null,
  onProgressChange,
}: InteractiveHandbookGameProps) {
  const { t } = useTranslation('common');

  const [mode, setMode] = useState<HandbookMode>('readToMe');
  const initialPageIndex = getInitialPageIndex(initialProgress);
  const initialPageId = (PAGE_DEFINITIONS[initialPageIndex]?.id ?? 'p01') as PageId;
  const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex);
  const [visitedPages, setVisitedPages] = useState<Set<PageId>>(() => getInitialVisitedPages(initialProgress, initialPageId));
  const [solvedPages, setSolvedPages] = useState<Set<PageId>>(() => getInitialSolvedPages(initialProgress));
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

  const currentPage = PAGE_DEFINITIONS[currentPageIndex] as HandbookPageDefinition;
  const totalPages = PAGE_DEFINITIONS.length;

  const activeInteraction = useMemo(() => {
    if (shouldHideOptionalInteraction(mode, currentPage.interaction)) {
      return undefined;
    }

    return currentPage.interaction;
  }, [currentPage.interaction, mode]);

  const mandatoryPageIds = useMemo(
    () => PAGE_DEFINITIONS.filter((page) => page.interaction?.required).map((page) => page.id),
    [],
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

    PAGE_DEFINITIONS.forEach((page) => {
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
  }, [currentPageIndex, isCompleted, solvedPages, visitedPages]);

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

    const allPagesVisited = PAGE_DEFINITIONS.every((page) => visitedPages.has(page.id));
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

    const hintTrend = getHintTrend(pageHintUsage, PAGE_DEFINITIONS.map((page) => page.id));
    const metrics: ParentSummaryMetrics = {
      highestStableRange: buildStableRange(mandatorySolvedCount),
      firstAttemptSuccessRate: firstAttemptRate,
      hintTrend,
    };

    const optionalSolved = PAGE_DEFINITIONS.filter((page) => page.interaction && !page.interaction.required).filter(
      (page) => solvedPages.has(page.id),
    ).length;

    const score = mandatorySolvedCount * 35 + optionalSolved * 12 + firstAttemptRate;
    const stars = firstAttemptRate >= 85 ? 3 : firstAttemptRate >= 65 ? 2 : 1;

    completionSentRef.current = true;

    setCompletionSummary({
      metrics,
      firstAttemptRate,
      hints: hintTrend,
      visitedCount: visitedPages.size,
    });
    setIsCompleted(true);

    setStatusKey('games.interactiveHandbook.recap.completed');
    setStatusTone('success');

    playAudioKey('games.interactiveHandbook.recap.completed', true);

    onComplete({
      stars,
      score,
      completed: true,
      roundsCompleted: visitedPages.size,
      summaryMetrics: metrics,
    });
  }, [
    firstAttemptSuccessPages,
    mandatoryPageIds,
    mandatorySolvedCount,
    onComplete,
    pageHintUsage,
    playAudioKey,
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
    const nextPage = PAGE_DEFINITIONS[nextIndex] as HandbookPageDefinition;

    markPageVisited(nextPage.id);
    setCurrentPageIndex(nextIndex);
  }, [
    activeInteraction,
    currentPage.id,
    currentPageIndex,
    isLastPage,
    markPageVisited,
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
    () => PAGE_DEFINITIONS.map((page, index) => ({ index, id: page.id })),
    [],
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
          <h2 className="interactive-handbook__title">{t('games.interactiveHandbook.title')}</h2>
          <p className="interactive-handbook__subtitle">{t('games.interactiveHandbook.handbooks.gardenOfSurprises.cover.subtitle')}</p>
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
          <p className="interactive-handbook__page-chip">{t(`games.interactiveHandbook.handbooks.gardenOfSurprises.pageBadges.${currentPage.id}` as any)}</p>
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
            <h3 className="interactive-handbook__completion-title">{t('games.interactiveHandbook.recap.completed')}</h3>
            <p className="interactive-handbook__completion-line">
              {t('parentDashboard.games.interactiveHandbook.progressSummary', {
                successRate: completionSummary.firstAttemptRate,
                pagesVisited: completionSummary.visitedCount,
              })}
            </p>
            {summaryHintKey && <p className="interactive-handbook__completion-line">{t(summaryHintKey as any)}</p>}
            <p className="interactive-handbook__completion-line">{t('parentDashboard.games.interactiveHandbook.nextStep')}</p>
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
