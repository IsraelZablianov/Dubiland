import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import { MascotIllustration } from '@/components/illustrations';
import { SuccessCelebration } from '@/components/motion';
import type { GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';

type GardenColor = 'red' | 'blue' | 'yellow' | 'green' | 'orange' | 'purple' | 'pink' | 'brown';
type ItemCategory = 'fruit' | 'toy' | 'nature';
type RoundMode = 'match' | 'sort' | 'rule';
type HintTone = 'neutral' | 'hint' | 'success';
type BoardFeedback = 'idle' | 'success' | 'miss';

type MatchPromptKey =
  | 'games.colorGarden.prompts.match.red'
  | 'games.colorGarden.prompts.match.blue'
  | 'games.colorGarden.prompts.match.yellow'
  | 'games.colorGarden.prompts.match.green'
  | 'games.colorGarden.prompts.match.orange'
  | 'games.colorGarden.prompts.match.purple';

type SortPromptKey =
  | 'games.colorGarden.prompts.sort.redBasket'
  | 'games.colorGarden.prompts.sort.blueBasket'
  | 'games.colorGarden.prompts.sort.yellowBasket'
  | 'games.colorGarden.prompts.sort.greenBasket'
  | 'games.colorGarden.prompts.sort.mixedGarden'
  | 'games.colorGarden.prompts.sort.fruitsBlue';

type StatusKey =
  | MatchPromptKey
  | SortPromptKey
  | 'games.colorGarden.title'
  | 'games.colorGarden.subtitle'
  | 'games.colorGarden.instructions.intro'
  | 'games.colorGarden.instructions.listenAndFind'
  | 'games.colorGarden.instructions.tapMatches'
  | 'games.colorGarden.instructions.dragToBasket'
  | 'games.colorGarden.instructions.colorAndCategory'
  | 'games.colorGarden.instructions.tapReplay'
  | 'games.colorGarden.hints.compareSwatch'
  | 'games.colorGarden.hints.lookAtColorOnly'
  | 'games.colorGarden.hints.startWithOne'
  | 'games.colorGarden.hints.useReplay'
  | 'games.colorGarden.hints.gentleRetry'
  | 'games.colorGarden.roundComplete.greatColorMatch'
  | 'games.colorGarden.roundComplete.gardenGrowing'
  | 'games.colorGarden.roundComplete.nextColor'
  | 'games.colorGarden.feedback.encouragement.keepTrying'
  | 'games.colorGarden.feedback.encouragement.almostThere'
  | 'games.colorGarden.feedback.encouragement.tryAgain'
  | 'games.colorGarden.feedback.success.wellDone'
  | 'games.colorGarden.feedback.success.amazing'
  | 'games.colorGarden.feedback.success.celebrate'
  | 'colors.names.red'
  | 'colors.names.blue'
  | 'colors.names.yellow'
  | 'colors.names.green'
  | 'colors.names.orange'
  | 'colors.names.purple'
  | 'colors.names.pink'
  | 'colors.names.brown'
  | 'feedback.greatEffort'
  | 'feedback.excellent'
  | 'feedback.keepGoing'
  | 'feedback.youDidIt';

type AudioKey = keyof typeof AUDIO_PATH_BY_KEY;

type HintTrend = ParentSummaryMetrics['hintTrend'];

interface GardenItem {
  id: string;
  color: GardenColor;
  category: ItemCategory;
  emoji: string;
}

interface RoundConfig {
  roundNumber: number;
  simplifyOneVariable: boolean;
  masteryBoost: boolean;
}

interface RoundState {
  id: string;
  mode: RoundMode;
  roundNumber: number;
  instructionKey: StatusKey;
  promptKey: MatchPromptKey | SortPromptKey;
  targetColor: GardenColor;
  requiredCategory: ItemCategory | null;
  palette: GardenColor[];
  basketColors: GardenColor[];
  items: GardenItem[];
  tapFallbackEnabled: boolean;
}

interface RoundMessage {
  key: StatusKey;
  tone: HintTone;
}

interface ColorAccuracyStat {
  rounds: number;
  firstAttemptHits: number;
  misses: number;
}

interface SessionStats {
  firstAttemptSuccesses: number;
  hintUsageByRound: number[];
  shadeConfusions: number;
  colorStats: Partial<Record<GardenColor, ColorAccuracyStat>>;
}

interface SummaryReport {
  accuracyByFamily: string;
  shadeConfusion: string;
  hintTrendLabelKey: 'feedback.excellent' | 'feedback.keepGoing' | 'feedback.greatEffort';
  hintTrend: HintTrend;
  firstAttemptSuccessRate: number;
}

const TOTAL_ROUNDS = 6;
const MIDPOINT_ROUND = 3;

const CORE_COLORS: GardenColor[] = ['red', 'blue', 'yellow', 'green'];
const EXPANSION_COLORS: GardenColor[] = ['orange', 'purple'];

const COLOR_STYLE_BY_KEY: Record<GardenColor, string> = {
  red: '#FF6B6B',
  blue: '#4D96FF',
  yellow: '#FFC75F',
  green: '#6BCB77',
  orange: '#FF9F45',
  purple: '#B07CFF',
  pink: '#FF7EB6',
  brown: '#9A6B3F',
};

const COLOR_NAME_KEY_BY_COLOR: Record<GardenColor, StatusKey> = {
  red: 'colors.names.red',
  blue: 'colors.names.blue',
  yellow: 'colors.names.yellow',
  green: 'colors.names.green',
  orange: 'colors.names.orange',
  purple: 'colors.names.purple',
  pink: 'colors.names.pink',
  brown: 'colors.names.brown',
};

const CATEGORY_EMOJI_POOL: Record<ItemCategory, string[]> = {
  fruit: ['🍎', '🍓', '🍉', '🍒', '🍊'],
  toy: ['🪁', '🪀', '🧩', '🚗', '🎈'],
  nature: ['🌼', '🌻', '🍃', '🦋', '🌷'],
};

const ROUND_SUCCESS_ROTATION: Array<
  | 'games.colorGarden.roundComplete.greatColorMatch'
  | 'games.colorGarden.roundComplete.gardenGrowing'
  | 'games.colorGarden.roundComplete.nextColor'
> = [
  'games.colorGarden.roundComplete.greatColorMatch',
  'games.colorGarden.roundComplete.gardenGrowing',
  'games.colorGarden.roundComplete.nextColor',
];

const SORT_PROMPT_BY_BASKET: Record<GardenColor, SortPromptKey> = {
  red: 'games.colorGarden.prompts.sort.redBasket',
  blue: 'games.colorGarden.prompts.sort.blueBasket',
  yellow: 'games.colorGarden.prompts.sort.yellowBasket',
  green: 'games.colorGarden.prompts.sort.greenBasket',
  orange: 'games.colorGarden.prompts.sort.mixedGarden',
  purple: 'games.colorGarden.prompts.sort.mixedGarden',
  pink: 'games.colorGarden.prompts.sort.mixedGarden',
  brown: 'games.colorGarden.prompts.sort.mixedGarden',
};

const AUDIO_PATH_BY_KEY = {
  'games.colorGarden.title': '/audio/he/games/color-garden/title.mp3',
  'games.colorGarden.subtitle': '/audio/he/games/color-garden/subtitle.mp3',
  'games.colorGarden.instructions.intro': '/audio/he/games/color-garden/instructions/intro.mp3',
  'games.colorGarden.instructions.listenAndFind':
    '/audio/he/games/color-garden/instructions/listen-and-find.mp3',
  'games.colorGarden.instructions.tapMatches': '/audio/he/games/color-garden/instructions/tap-matches.mp3',
  'games.colorGarden.instructions.dragToBasket': '/audio/he/games/color-garden/instructions/drag-to-basket.mp3',
  'games.colorGarden.instructions.colorAndCategory':
    '/audio/he/games/color-garden/instructions/color-and-category.mp3',
  'games.colorGarden.instructions.tapReplay': '/audio/he/games/color-garden/instructions/tap-replay.mp3',
  'games.colorGarden.prompts.match.red': '/audio/he/games/color-garden/prompts/match/red.mp3',
  'games.colorGarden.prompts.match.blue': '/audio/he/games/color-garden/prompts/match/blue.mp3',
  'games.colorGarden.prompts.match.yellow': '/audio/he/games/color-garden/prompts/match/yellow.mp3',
  'games.colorGarden.prompts.match.green': '/audio/he/games/color-garden/prompts/match/green.mp3',
  'games.colorGarden.prompts.match.orange': '/audio/he/games/color-garden/prompts/match/orange.mp3',
  'games.colorGarden.prompts.match.purple': '/audio/he/games/color-garden/prompts/match/purple.mp3',
  'games.colorGarden.prompts.sort.redBasket': '/audio/he/games/color-garden/prompts/sort/red-basket.mp3',
  'games.colorGarden.prompts.sort.blueBasket': '/audio/he/games/color-garden/prompts/sort/blue-basket.mp3',
  'games.colorGarden.prompts.sort.yellowBasket': '/audio/he/games/color-garden/prompts/sort/yellow-basket.mp3',
  'games.colorGarden.prompts.sort.greenBasket': '/audio/he/games/color-garden/prompts/sort/green-basket.mp3',
  'games.colorGarden.prompts.sort.mixedGarden': '/audio/he/games/color-garden/prompts/sort/mixed-garden.mp3',
  'games.colorGarden.prompts.sort.fruitsBlue': '/audio/he/games/color-garden/prompts/sort/fruits-blue.mp3',
  'games.colorGarden.hints.compareSwatch': '/audio/he/games/color-garden/hints/compare-swatch.mp3',
  'games.colorGarden.hints.lookAtColorOnly': '/audio/he/games/color-garden/hints/look-at-color-only.mp3',
  'games.colorGarden.hints.startWithOne': '/audio/he/games/color-garden/hints/start-with-one.mp3',
  'games.colorGarden.hints.useReplay': '/audio/he/games/color-garden/hints/use-replay.mp3',
  'games.colorGarden.hints.gentleRetry': '/audio/he/games/color-garden/hints/gentle-retry.mp3',
  'games.colorGarden.roundComplete.greatColorMatch':
    '/audio/he/games/color-garden/round-complete/great-color-match.mp3',
  'games.colorGarden.roundComplete.gardenGrowing':
    '/audio/he/games/color-garden/round-complete/garden-growing.mp3',
  'games.colorGarden.roundComplete.nextColor': '/audio/he/games/color-garden/round-complete/next-color.mp3',
  'games.colorGarden.feedback.encouragement.keepTrying':
    '/audio/he/games/color-garden/feedback/encouragement/keep-trying.mp3',
  'games.colorGarden.feedback.encouragement.almostThere':
    '/audio/he/games/color-garden/feedback/encouragement/almost-there.mp3',
  'games.colorGarden.feedback.encouragement.tryAgain':
    '/audio/he/games/color-garden/feedback/encouragement/try-again.mp3',
  'games.colorGarden.feedback.success.wellDone': '/audio/he/games/color-garden/feedback/success/well-done.mp3',
  'games.colorGarden.feedback.success.amazing': '/audio/he/games/color-garden/feedback/success/amazing.mp3',
  'games.colorGarden.feedback.success.celebrate': '/audio/he/games/color-garden/feedback/success/celebrate.mp3',
  'colors.names.red': '/audio/he/colors/names/red.mp3',
  'colors.names.blue': '/audio/he/colors/names/blue.mp3',
  'colors.names.yellow': '/audio/he/colors/names/yellow.mp3',
  'colors.names.green': '/audio/he/colors/names/green.mp3',
  'colors.names.orange': '/audio/he/colors/names/orange.mp3',
  'colors.names.purple': '/audio/he/colors/names/purple.mp3',
  'colors.names.pink': '/audio/he/colors/names/pink.mp3',
  'colors.names.brown': '/audio/he/colors/names/brown.mp3',
  'feedback.greatEffort': '/audio/he/feedback/great-effort.mp3',
  'feedback.excellent': '/audio/he/feedback/excellent.mp3',
  'feedback.keepGoing': '/audio/he/feedback/keep-going.mp3',
  'feedback.youDidIt': '/audio/he/feedback/you-did-it.mp3',
} as const;

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

function makeItem(id: string, color: GardenColor, category: ItemCategory): GardenItem {
  return {
    id,
    color,
    category,
    emoji: pickRandom(CATEGORY_EMOJI_POOL[category]),
  };
}

function createMatchRound(config: RoundConfig): RoundState {
  const basePalette = config.masteryBoost ? [...CORE_COLORS, EXPANSION_COLORS[0]] : [...CORE_COLORS];
  const targetColor = pickRandom(basePalette) as GardenColor;

  const optionCount = config.simplifyOneVariable
    ? 2
    : Math.min(basePalette.length, config.roundNumber === 1 ? 2 : 3 + (config.masteryBoost ? 1 : 0));

  const distractorPool = basePalette.filter((color) => color !== targetColor);
  const optionColors = shuffle([targetColor, ...shuffle(distractorPool).slice(0, optionCount - 1)]);

  const items = optionColors.map((color, index) =>
    makeItem(`match-${config.roundNumber}-${color}-${index}`, color, 'nature'),
  );

  return {
    id: `color-garden-match-${config.roundNumber}`,
    mode: 'match',
    roundNumber: config.roundNumber,
    instructionKey: 'games.colorGarden.instructions.listenAndFind',
    promptKey: `games.colorGarden.prompts.match.${targetColor}` as MatchPromptKey,
    targetColor,
    requiredCategory: null,
    palette: optionColors,
    basketColors: [],
    items,
    tapFallbackEnabled: false,
  };
}

function createSortRound(config: RoundConfig): RoundState {
  const basketCount = config.simplifyOneVariable ? 2 : config.roundNumber === 3 ? 3 : 4;
  const basketColors = CORE_COLORS.slice(0, basketCount);
  const itemCount = config.simplifyOneVariable ? 4 : 6;

  const items = Array.from({ length: itemCount }, (_, index) => {
    const color = pickRandom(basketColors) as GardenColor;
    const category = pickRandom(['fruit', 'toy', 'nature'] as const);
    return makeItem(`sort-${config.roundNumber}-${index}`, color, category);
  });

  const focusColor = pickRandom(basketColors) as GardenColor;
  const promptKey = config.simplifyOneVariable
    ? SORT_PROMPT_BY_BASKET[focusColor]
    : 'games.colorGarden.prompts.sort.mixedGarden';

  return {
    id: `color-garden-sort-${config.roundNumber}`,
    mode: 'sort',
    roundNumber: config.roundNumber,
    instructionKey: 'games.colorGarden.instructions.dragToBasket',
    promptKey,
    targetColor: focusColor,
    requiredCategory: null,
    palette: basketColors,
    basketColors,
    items,
    tapFallbackEnabled: config.simplifyOneVariable,
  };
}

function createRuleRound(config: RoundConfig): RoundState {
  const palette = config.simplifyOneVariable
    ? (['blue', 'red'] as GardenColor[])
    : config.masteryBoost
      ? (['blue', 'red', 'yellow', 'green', 'orange'] as GardenColor[])
      : (['blue', 'red', 'yellow', 'green'] as GardenColor[]);

  const requiredMatches = config.simplifyOneVariable ? 1 : 2;
  const totalItems = config.simplifyOneVariable ? 4 : 6;

  const guaranteedMatches = Array.from({ length: requiredMatches }, (_, index) =>
    makeItem(`rule-${config.roundNumber}-match-${index}`, 'blue', 'fruit'),
  );

  const distractors: GardenItem[] = [];
  for (let index = guaranteedMatches.length; index < totalItems; index += 1) {
    const color = pickRandom(palette);
    const category = pickRandom(['fruit', 'toy', 'nature'] as const);

    if (color === 'blue' && category === 'fruit') {
      distractors.push(makeItem(`rule-${config.roundNumber}-distractor-${index}`, 'red', category));
    } else {
      distractors.push(makeItem(`rule-${config.roundNumber}-distractor-${index}`, color, category));
    }
  }

  return {
    id: `color-garden-rule-${config.roundNumber}`,
    mode: 'rule',
    roundNumber: config.roundNumber,
    instructionKey: 'games.colorGarden.instructions.colorAndCategory',
    promptKey: 'games.colorGarden.prompts.sort.fruitsBlue',
    targetColor: 'blue',
    requiredCategory: 'fruit',
    palette,
    basketColors: [],
    items: shuffle([...guaranteedMatches, ...distractors]),
    tapFallbackEnabled: false,
  };
}

function createRound(config: RoundConfig): RoundState {
  if (config.roundNumber <= 2) {
    return createMatchRound(config);
  }

  if (config.roundNumber <= 4) {
    return createSortRound(config);
  }

  return createRuleRound(config);
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

function getStableRange(firstAttemptSuccessRate: number): StableRange {
  if (firstAttemptSuccessRate >= 80) {
    return '1-10';
  }
  if (firstAttemptSuccessRate >= 55) {
    return '1-5';
  }
  return '1-3';
}

function getHintTrendLabelKey(hintTrend: HintTrend): SummaryReport['hintTrendLabelKey'] {
  if (hintTrend === 'improving') {
    return 'feedback.excellent';
  }
  if (hintTrend === 'steady') {
    return 'feedback.keepGoing';
  }
  return 'feedback.greatEffort';
}

function isShadedColor(color: GardenColor): boolean {
  return color === 'orange' || color === 'purple' || color === 'pink' || color === 'brown';
}

function buildSummaryReport(stats: SessionStats): SummaryReport {
  const roundsPlayed = stats.hintUsageByRound.length;
  const firstAttemptSuccessRate =
    roundsPlayed === 0 ? 0 : Math.round((stats.firstAttemptSuccesses / roundsPlayed) * 100);
  const hintTrend = getHintTrend(stats.hintUsageByRound);

  return {
    accuracyByFamily: `${firstAttemptSuccessRate}%`,
    shadeConfusion: `${stats.shadeConfusions}`,
    hintTrendLabelKey: getHintTrendLabelKey(hintTrend),
    hintTrend,
    firstAttemptSuccessRate,
  };
}

function isRuleTargetItem(item: GardenItem, requiredColor: GardenColor, requiredCategory: ItemCategory): boolean {
  return item.color === requiredColor && item.category === requiredCategory;
}

export function ColorGardenGame({ onComplete, audio }: GameProps) {
  const { t, i18n } = useTranslation('common');

  const [roundConfig, setRoundConfig] = useState<RoundConfig>({
    roundNumber: 1,
    simplifyOneVariable: false,
    masteryBoost: false,
  });
  const [round, setRound] = useState<RoundState>(() =>
    createRound({
      roundNumber: 1,
      simplifyOneVariable: false,
      masteryBoost: false,
    }),
  );
  const [pendingRoundConfig, setPendingRoundConfig] = useState<RoundConfig | null>(null);

  const [midpointPaused, setMidpointPaused] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [assignmentByItemId, setAssignmentByItemId] = useState<Record<string, GardenColor>>({});

  const [hintStep, setHintStep] = useState(0);
  const [usedHintThisRound, setUsedHintThisRound] = useState(false);
  const [mistakesThisRound, setMistakesThisRound] = useState(0);
  const [highlightTargets, setHighlightTargets] = useState(false);
  const [tapFallbackEnabled, setTapFallbackEnabled] = useState(false);
  const [gardenCelebrate, setGardenCelebrate] = useState(false);

  const [roundMessage, setRoundMessage] = useState<RoundMessage>({
    key: 'games.colorGarden.instructions.intro',
    tone: 'neutral',
  });

  const [cleanRoundsInRow, setCleanRoundsInRow] = useState(0);
  const [struggleRoundsInRow, setStruggleRoundsInRow] = useState(0);

  const [sessionStats, setSessionStats] = useState<SessionStats>({
    firstAttemptSuccesses: 0,
    hintUsageByRound: [],
    shadeConfusions: 0,
    colorStats: {},
  });
  const [starTokens, setStarTokens] = useState(0);
  const [summaryReport, setSummaryReport] = useState<SummaryReport | null>(null);
  const [scorePulse, setScorePulse] = useState(false);
  const [boardFeedback, setBoardFeedback] = useState<BoardFeedback>('idle');
  const [duplicatePulseItemId, setDuplicatePulseItemId] = useState<string | null>(null);

  const completionReportedRef = useRef(false);
  const scorePulseTimeoutRef = useRef<number | null>(null);
  const boardFeedbackTimeoutRef = useRef<number | null>(null);
  const duplicatePulseTimeoutRef = useRef<number | null>(null);

  const targetRuleItemIds = useMemo(() => {
    if (round.mode !== 'rule' || !round.requiredCategory) {
      return new Set<string>();
    }

    return new Set(
      round.items
        .filter((item) => isRuleTargetItem(item, round.targetColor, round.requiredCategory as ItemCategory))
        .map((item) => item.id),
    );
  }, [round]);

  const unassignedSortItems = useMemo(() => {
    if (round.mode !== 'sort') {
      return [];
    }

    return round.items.filter((item) => !assignmentByItemId[item.id]);
  }, [assignmentByItemId, round]);

  const assignedSortItems = useMemo(() => {
    if (round.mode !== 'sort') {
      return [];
    }

    return round.items.filter((item) => assignmentByItemId[item.id]);
  }, [assignmentByItemId, round]);

  const roundProgressSegments = useMemo(() => Array.from({ length: TOTAL_ROUNDS }, (_, index) => index + 1), []);

  const playAudioKey = useCallback(
    (key: AudioKey) => {
      const audioPath = AUDIO_PATH_BY_KEY[key];
      if (!audioPath) {
        return;
      }
      audio.play(audioPath);
    },
    [audio],
  );

  const setMessageWithAudio = useCallback(
    (key: StatusKey, tone: HintTone) => {
      setRoundMessage({ key, tone });
      if ((key as AudioKey) in AUDIO_PATH_BY_KEY) {
        playAudioKey(key as AudioKey);
      }
    },
    [playAudioKey],
  );

  const resetRoundInteractions = useCallback((nextRound: RoundState) => {
    setSelectedItemIds([]);
    setAssignmentByItemId({});
    setHintStep(0);
    setUsedHintThisRound(false);
    setMistakesThisRound(0);
    setHighlightTargets(false);
    setTapFallbackEnabled(nextRound.tapFallbackEnabled);
    setGardenCelebrate(false);
    setBoardFeedback('idle');
    setDuplicatePulseItemId(null);
  }, []);

  const triggerScorePulse = useCallback(() => {
    setScorePulse(true);
    if (scorePulseTimeoutRef.current) {
      window.clearTimeout(scorePulseTimeoutRef.current);
    }
    scorePulseTimeoutRef.current = window.setTimeout(() => {
      setScorePulse(false);
      scorePulseTimeoutRef.current = null;
    }, 420);
  }, []);

  const triggerBoardFeedback = useCallback((feedback: Exclude<BoardFeedback, 'idle'>) => {
    setBoardFeedback(feedback);
    if (boardFeedbackTimeoutRef.current) {
      window.clearTimeout(boardFeedbackTimeoutRef.current);
    }
    boardFeedbackTimeoutRef.current = window.setTimeout(() => {
      setBoardFeedback('idle');
      boardFeedbackTimeoutRef.current = null;
    }, 340);
  }, []);

  const triggerDuplicatePulse = useCallback((itemId: string) => {
    setDuplicatePulseItemId(itemId);
    if (duplicatePulseTimeoutRef.current) {
      window.clearTimeout(duplicatePulseTimeoutRef.current);
    }
    duplicatePulseTimeoutRef.current = window.setTimeout(() => {
      setDuplicatePulseItemId((current) => (current === itemId ? null : current));
      duplicatePulseTimeoutRef.current = null;
    }, 360);
  }, []);

  const loadRound = useCallback(
    (nextConfig: RoundConfig) => {
      const nextRound = createRound(nextConfig);
      setRoundConfig(nextConfig);
      setRound(nextRound);
      resetRoundInteractions(nextRound);
    },
    [resetRoundInteractions],
  );

  const finalizeSession = useCallback(
    (stats: SessionStats, stars: number) => {
      const report = buildSummaryReport(stats);
      setSummaryReport(report);
      setSessionComplete(true);
      setMessageWithAudio(report.hintTrendLabelKey, 'success');

      if (completionReportedRef.current) {
        return;
      }
      completionReportedRef.current = true;

      onComplete({
        stars: Math.min(3, Math.max(1, stars)),
        score:
          stats.firstAttemptSuccesses * 14 +
          (TOTAL_ROUNDS - stats.hintUsageByRound.reduce((sum, v) => sum + v, 0)) * 8,
        completed: true,
        roundsCompleted: stats.hintUsageByRound.length,
        summaryMetrics: {
          highestStableRange: getStableRange(report.firstAttemptSuccessRate),
          firstAttemptSuccessRate: report.firstAttemptSuccessRate,
          hintTrend: report.hintTrend,
        },
      });
    },
    [onComplete, setMessageWithAudio],
  );

  const completeRound = useCallback(
    (forcedStruggle = false) => {
      if (sessionComplete || midpointPaused) {
        return;
      }

      const roundWasStruggle = forcedStruggle || usedHintThisRound || mistakesThisRound > 0;
      triggerBoardFeedback('success');
      if (!roundWasStruggle) {
        triggerScorePulse();
      }
      const updatedStats: SessionStats = {
        firstAttemptSuccesses: sessionStats.firstAttemptSuccesses + (roundWasStruggle ? 0 : 1),
        hintUsageByRound: [...sessionStats.hintUsageByRound, usedHintThisRound ? 1 : 0],
        shadeConfusions: sessionStats.shadeConfusions,
        colorStats: { ...sessionStats.colorStats },
      };

      const colorStat = updatedStats.colorStats[round.targetColor] ?? {
        rounds: 0,
        firstAttemptHits: 0,
        misses: 0,
      };
      colorStat.rounds += 1;
      colorStat.firstAttemptHits += roundWasStruggle ? 0 : 1;
      colorStat.misses += mistakesThisRound;
      updatedStats.colorStats[round.targetColor] = colorStat;

      if (isShadedColor(round.targetColor) && mistakesThisRound > 0) {
        updatedStats.shadeConfusions += 1;
      }

      const nextStarTokens = updatedStats.hintUsageByRound.length % 2 === 0 ? starTokens + 1 : starTokens;
      setSessionStats(updatedStats);
      setStarTokens(nextStarTokens);
      setGardenCelebrate(true);

      const successKey =
        ROUND_SUCCESS_ROTATION[(updatedStats.hintUsageByRound.length - 1) % ROUND_SUCCESS_ROTATION.length];
      setMessageWithAudio(successKey, 'success');

      let nextCleanRoundsInRow = roundWasStruggle ? 0 : cleanRoundsInRow + 1;
      let nextStruggleRoundsInRow = roundWasStruggle ? struggleRoundsInRow + 1 : 0;

      let masteryBoost = roundConfig.masteryBoost;
      if (nextCleanRoundsInRow >= 3) {
        masteryBoost = true;
        nextCleanRoundsInRow = 0;
      }

      let simplifyOneVariable = mistakesThisRound >= 2;
      if (nextStruggleRoundsInRow >= 2) {
        simplifyOneVariable = true;
        nextStruggleRoundsInRow = 0;
      }

      setCleanRoundsInRow(nextCleanRoundsInRow);
      setStruggleRoundsInRow(nextStruggleRoundsInRow);

      if (updatedStats.hintUsageByRound.length >= TOTAL_ROUNDS) {
        window.setTimeout(() => {
          finalizeSession(updatedStats, nextStarTokens);
        }, 600);
        return;
      }

      const nextRoundNumber = roundConfig.roundNumber + 1;
      const nextConfig: RoundConfig = {
        roundNumber: nextRoundNumber,
        simplifyOneVariable,
        masteryBoost,
      };

      if (nextRoundNumber === MIDPOINT_ROUND + 1) {
        setPendingRoundConfig(nextConfig);
        setMidpointPaused(true);
        return;
      }

      window.setTimeout(() => {
        loadRound(nextConfig);
      }, 650);
    },
    [
      cleanRoundsInRow,
      finalizeSession,
      loadRound,
      midpointPaused,
      mistakesThisRound,
      round.targetColor,
      roundConfig,
      sessionComplete,
      sessionStats,
      setMessageWithAudio,
      starTokens,
      struggleRoundsInRow,
      usedHintThisRound,
      triggerBoardFeedback,
      triggerScorePulse,
    ],
  );

  const applyGuidedDemo = useCallback(() => {
    if (round.mode === 'match') {
      setHighlightTargets(true);
      window.setTimeout(() => {
        completeRound(true);
      }, 420);
      return;
    }

    if (round.mode === 'sort') {
      const nextTarget = round.items.find((item) => !assignmentByItemId[item.id]);
      if (!nextTarget) {
        completeRound(true);
        return;
      }

      setAssignmentByItemId((current) => {
        const nextAssignments = {
          ...current,
          [nextTarget.id]: nextTarget.color,
        };

        const roundSolved = round.items.every((item) => nextAssignments[item.id] === item.color);
        if (roundSolved) {
          window.setTimeout(() => completeRound(true), 360);
        }

        return nextAssignments;
      });
      return;
    }

    const missingTarget = [...targetRuleItemIds].find((itemId) => !selectedItemIds.includes(itemId));
    if (!missingTarget) {
      window.setTimeout(() => {
        completeRound(true);
      }, 240);
      return;
    }

    setSelectedItemIds((current) => {
      if (current.includes(missingTarget)) {
        return current;
      }

      const nextSelection = [...current, missingTarget];
      if (nextSelection.length === targetRuleItemIds.size) {
        window.setTimeout(() => {
          completeRound(true);
        }, 260);
      }
      return nextSelection;
    });
  }, [assignmentByItemId, completeRound, round, selectedItemIds, targetRuleItemIds]);

  const escalateHint = useCallback(
    (mistakeCount: number) => {
      const nextHintStep = Math.min(mistakeCount, 3);
      setHintStep(nextHintStep);
      setUsedHintThisRound(true);

      if (nextHintStep === 1) {
        setMessageWithAudio(round.promptKey, 'hint');
        return;
      }

      if (nextHintStep === 2) {
        setHighlightTargets(true);

        if (round.mode === 'rule') {
          setMessageWithAudio('games.colorGarden.hints.lookAtColorOnly', 'hint');
        } else {
          setMessageWithAudio('games.colorGarden.hints.compareSwatch', 'hint');
        }

        if (round.mode === 'sort') {
          setTapFallbackEnabled(true);
        }
        return;
      }

      setMessageWithAudio('games.colorGarden.hints.startWithOne', 'hint');
      applyGuidedDemo();
    },
    [applyGuidedDemo, round.mode, round.promptKey, setMessageWithAudio],
  );

  const registerMistake = useCallback(() => {
    if (sessionComplete || midpointPaused) {
      return;
    }

    triggerBoardFeedback('miss');
    setMessageWithAudio('games.colorGarden.feedback.encouragement.tryAgain', 'hint');

    setMistakesThisRound((currentMistakes) => {
      const nextMistakeCount = currentMistakes + 1;

      window.setTimeout(() => {
        escalateHint(nextMistakeCount);
      }, 260);

      return nextMistakeCount;
    });
  }, [escalateHint, midpointPaused, sessionComplete, setMessageWithAudio, triggerBoardFeedback]);

  const handleMatchChoice = useCallback(
    (item: GardenItem) => {
      if (round.mode !== 'match' || sessionComplete || midpointPaused) {
        return;
      }

      if (item.color !== round.targetColor) {
        registerMistake();
        return;
      }

      completeRound();
    },
    [completeRound, midpointPaused, registerMistake, round, sessionComplete],
  );

  const handleSortAssign = useCallback(
    (itemId: string, color: GardenColor) => {
      if (round.mode !== 'sort' || sessionComplete || midpointPaused) {
        return;
      }

      const item = round.items.find((entry) => entry.id === itemId);
      if (!item) {
        return;
      }

      if (item.color !== color) {
        registerMistake();
        return;
      }

      setAssignmentByItemId((currentAssignments) => {
        const nextAssignments = {
          ...currentAssignments,
          [item.id]: color,
        };

        const solved = round.items.every((entry) => nextAssignments[entry.id] === entry.color);
        if (solved) {
          window.setTimeout(() => completeRound(), 280);
        }

        return nextAssignments;
      });
      setHighlightTargets(false);
    },
    [completeRound, midpointPaused, registerMistake, round, sessionComplete],
  );

  const handleSortItemTap = useCallback(
    (itemId: string) => {
      if (round.mode !== 'sort') {
        return;
      }

      const item = round.items.find((entry) => entry.id === itemId);
      if (!item) {
        return;
      }

      if (!tapFallbackEnabled) {
        setTapFallbackEnabled(true);
        setMessageWithAudio('games.colorGarden.hints.startWithOne', 'hint');
      }

      handleSortAssign(itemId, item.color);
    },
    [handleSortAssign, round, setMessageWithAudio, tapFallbackEnabled],
  );

  const handleRuleChoice = useCallback(
    (item: GardenItem) => {
      if (round.mode !== 'rule' || sessionComplete || midpointPaused) {
        return;
      }

      if (!targetRuleItemIds.has(item.id)) {
        registerMistake();
        return;
      }

      if (selectedItemIds.includes(item.id)) {
        triggerDuplicatePulse(item.id);
        setMessageWithAudio('games.colorGarden.hints.gentleRetry', 'hint');
        return;
      }

      setSelectedItemIds((current) => {
        const nextSelection = [...current, item.id];
        if (nextSelection.length === targetRuleItemIds.size) {
          window.setTimeout(() => {
            completeRound();
          }, 220);
        }

        return nextSelection;
      });
      setHighlightTargets(false);
    },
    [
      completeRound,
      midpointPaused,
      registerMistake,
      round.mode,
      selectedItemIds,
      sessionComplete,
      setMessageWithAudio,
      targetRuleItemIds,
      triggerDuplicatePulse,
    ],
  );

  const handleReplayInstruction = useCallback(() => {
    if (sessionComplete || midpointPaused) {
      return;
    }

    setMessageWithAudio('games.colorGarden.hints.useReplay', 'neutral');

    window.setTimeout(() => {
      setMessageWithAudio(round.promptKey, 'neutral');

      if (round.mode === 'match') {
        window.setTimeout(() => {
          const colorAudioKey = COLOR_NAME_KEY_BY_COLOR[round.targetColor];
          playAudioKey(colorAudioKey as AudioKey);
        }, 260);
      }
    }, 220);
  }, [midpointPaused, playAudioKey, round, sessionComplete, setMessageWithAudio]);

  const handleContinueAfterMidpoint = useCallback(() => {
    if (!pendingRoundConfig) {
      return;
    }

    setMidpointPaused(false);
    loadRound(pendingRoundConfig);
    setPendingRoundConfig(null);
  }, [loadRound, pendingRoundConfig]);

  useEffect(() => {
    if (midpointPaused || sessionComplete) {
      return;
    }

    setMessageWithAudio(round.instructionKey, 'neutral');

    const timer = window.setTimeout(() => {
      setMessageWithAudio(round.promptKey, 'neutral');

      if (round.mode === 'match') {
        window.setTimeout(() => {
          const colorAudioKey = COLOR_NAME_KEY_BY_COLOR[round.targetColor];
          playAudioKey(colorAudioKey as AudioKey);
        }, 240);
      }
    }, 320);

    return () => {
      window.clearTimeout(timer);
    };
  }, [midpointPaused, playAudioKey, round, sessionComplete, setMessageWithAudio]);

  useEffect(() => {
    return () => {
      if (scorePulseTimeoutRef.current) {
        window.clearTimeout(scorePulseTimeoutRef.current);
      }
      if (boardFeedbackTimeoutRef.current) {
        window.clearTimeout(boardFeedbackTimeoutRef.current);
      }
      if (duplicatePulseTimeoutRef.current) {
        window.clearTimeout(duplicatePulseTimeoutRef.current);
      }
      audio.stop();
    };
  }, [audio]);

  const messageText = t(roundMessage.key);
  const replayButtonAriaLabel = t('games.colorGarden.instructions.tapReplay');
  const boardHintKey: StatusKey =
    round.mode === 'rule'
      ? 'games.colorGarden.instructions.colorAndCategory'
      : 'games.colorGarden.instructions.tapMatches';
  const showInRoundCoach = !sessionComplete && !midpointPaused && !gardenCelebrate;
  const nextArrowIcon = i18n.dir(i18n.language) === 'rtl' ? '←' : '→';

  const playStatusAudio = useCallback(
    (key: StatusKey) => {
      if ((key as AudioKey) in AUDIO_PATH_BY_KEY) {
        playAudioKey(key as AudioKey);
      }
    },
    [playAudioKey],
  );

  if (sessionComplete && summaryReport) {
    return (
      <div className="color-garden color-garden--complete">
        <Card padding="lg" className="color-garden__shell">
          <h2 className="color-garden__title">{t('feedback.youDidIt')}</h2>
          <p className="color-garden__subtitle">{t('games.colorGarden.roundComplete.gardenGrowing')}</p>

          <div className="color-garden__stars" aria-label={t(summaryReport.hintTrendLabelKey)}>
            {Array.from({ length: Math.max(1, starTokens) }).map((_, index) => (
              <span key={`star-${index}`} className="color-garden__star" aria-hidden="true">
                🌟
              </span>
            ))}
          </div>

          <Card padding="md" className="color-garden__summary-card">
            <p>
              {t('parentDashboard.games.colorGarden.progressSummary', {
                accuracyByFamily: summaryReport.accuracyByFamily,
                shadeConfusion: summaryReport.shadeConfusion,
                hintTrend: t(summaryReport.hintTrendLabelKey),
              })}
            </p>
            <p>{t('parentDashboard.games.colorGarden.nextStep')}</p>
          </Card>
        </Card>

        <style>{colorGardenStyles}</style>
      </div>
    );
  }

  if (midpointPaused) {
    return (
      <div className="color-garden color-garden--midpoint">
        <Card padding="lg" className="color-garden__shell">
          <div className="color-garden__text-row color-garden__text-row--center">
            <h2 className="color-garden__title">{t('feedback.greatEffort')}</h2>
            <button
              type="button"
              className="color-garden__replay-button"
              onClick={() => playStatusAudio('feedback.greatEffort')}
              aria-label={replayButtonAriaLabel}
            >
              <span aria-hidden="true">▶</span>
            </button>
          </div>
          <div className="color-garden__text-row color-garden__text-row--center">
            <p className="color-garden__subtitle">{t('games.colorGarden.roundComplete.nextColor')}</p>
            <button
              type="button"
              className="color-garden__replay-button"
              onClick={() => playStatusAudio('games.colorGarden.roundComplete.nextColor')}
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
            style={{ minWidth: 'var(--touch-min)', paddingInline: 'var(--space-lg)' }}
          >
            <span aria-hidden="true">{nextArrowIcon}</span>
          </Button>
        </Card>

        <style>{colorGardenStyles}</style>
      </div>
    );
  }

  return (
    <div className="color-garden">
      <Card padding="lg" className="color-garden__shell">
        <header className="color-garden__header">
          <div className="color-garden__heading">
            <div className="color-garden__text-row">
              <h2 className="color-garden__title">{t('games.colorGarden.title')}</h2>
              <button
                type="button"
                className="color-garden__replay-button"
                onClick={() => playStatusAudio('games.colorGarden.title')}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">▶</span>
              </button>
            </div>
            <div className="color-garden__text-row">
              <p className="color-garden__subtitle">{t('games.colorGarden.subtitle')}</p>
              <button
                type="button"
                className="color-garden__replay-button"
                onClick={() => playStatusAudio('games.colorGarden.subtitle')}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">▶</span>
              </button>
            </div>
          </div>

          <div className="color-garden__actions">
            <Button
              variant="secondary"
              size="md"
              onClick={handleReplayInstruction}
              aria-label={t('games.colorGarden.instructions.tapReplay')}
              className="color-garden__replay-btn"
            >
              <span className="color-garden__replay-icon" aria-hidden="true">
                ▶
              </span>
            </Button>
          </div>
        </header>

        <div className="color-garden__progress" aria-label={t('games.estimatedTime', { minutes: 5 })}>
          {roundProgressSegments.map((segment) => {
            const state =
              segment < roundConfig.roundNumber
                ? 'done'
                : segment === roundConfig.roundNumber
                  ? 'active'
                  : 'pending';

            return (
              <span
                key={`segment-${segment}`}
                className={[
                  'color-garden__progress-dot',
                  `color-garden__progress-dot--${state}`,
                  state === 'active' ? 'color-garden__progress-dot--active-live' : '',
                ].join(' ')}
                aria-hidden="true"
              />
            );
          })}
        </div>

        <div className="color-garden__score-strip" aria-hidden="true">
          <span className={['color-garden__score-pill', scorePulse ? 'color-garden__score-pill--pulse' : ''].join(' ')}>
            <span>⭐</span>
            <span>{sessionStats.firstAttemptSuccesses}</span>
          </span>
          <span className="color-garden__score-pill">
            <span>🎯</span>
            <span>
              {roundConfig.roundNumber}/{TOTAL_ROUNDS}
            </span>
          </span>
        </div>

        <div className={`color-garden__message color-garden__message--${roundMessage.tone}`}>
          <p className="color-garden__message-text" aria-live="polite">
            {messageText}
          </p>
          <button
            type="button"
            className="color-garden__replay-button"
            onClick={() => playStatusAudio(roundMessage.key)}
            aria-label={replayButtonAriaLabel}
          >
            <span aria-hidden="true">▶</span>
          </button>
        </div>

        <section className="color-garden__board">
          <div className="color-garden__scene-props" aria-hidden="true">
            <span>🌼</span>
            <span>🦋</span>
            <span>🍎</span>
            <span>🌷</span>
            <span>🪴</span>
          </div>
          {showInRoundCoach && (
            <div className="color-garden__coach" aria-hidden="true">
              <MascotIllustration variant="hint" size={56} />
            </div>
          )}

          <Card padding="md" className="color-garden__panel color-garden__panel--swatches">
            <div className="color-garden__text-row">
              <p className="color-garden__panel-label">{t(round.instructionKey)}</p>
              <button
                type="button"
                className="color-garden__replay-button"
                onClick={() => playStatusAudio(round.instructionKey)}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">▶</span>
              </button>
            </div>
            <div className="color-garden__swatch-grid">
              {round.palette.map((color) => (
                <button
                  key={`swatch-${color}`}
                  type="button"
                  className={[
                    'color-garden__swatch',
                    highlightTargets && color === round.targetColor ? 'color-garden__swatch--highlight' : '',
                  ].join(' ')}
                  style={{
                    background: `linear-gradient(180deg, ${COLOR_STYLE_BY_KEY[color]}, color-mix(in srgb, ${COLOR_STYLE_BY_KEY[color]} 78%, white))`,
                    color: color === 'yellow' ? 'var(--color-text-primary)' : 'var(--color-text-inverse)',
                  }}
                  onClick={() => playAudioKey(COLOR_NAME_KEY_BY_COLOR[color] as AudioKey)}
                  aria-label={t(COLOR_NAME_KEY_BY_COLOR[color])}
                >
                  {t(COLOR_NAME_KEY_BY_COLOR[color])}
                </button>
              ))}
            </div>

            <div className="color-garden__text-row">
              <p className="color-garden__hint">{t(boardHintKey)}</p>
              <button
                type="button"
                className="color-garden__replay-button"
                onClick={() => playStatusAudio(boardHintKey)}
                aria-label={replayButtonAriaLabel}
              >
                <span aria-hidden="true">▶</span>
              </button>
            </div>
          </Card>

          <Card
            padding="md"
            className={[
              'color-garden__panel',
              'color-garden__panel--board',
              gardenCelebrate ? 'color-garden__panel--celebrate' : '',
              boardFeedback === 'success' ? 'color-garden__panel--success' : '',
              boardFeedback === 'miss' ? 'color-garden__panel--miss' : '',
            ].join(' ')}
          >
            {round.mode === 'match' && (
              <div className="color-garden__match-grid">
                {round.items.map((item) => {
                  const highlighted = highlightTargets && item.color === round.targetColor;
                  return (
                    <div key={item.id} className="color-garden__item-card">
                      <button
                        type="button"
                        className={['color-garden__item', highlighted ? 'color-garden__item--highlight' : ''].join(
                          ' ',
                        )}
                        style={{ borderColor: COLOR_STYLE_BY_KEY[item.color] }}
                        onClick={() => handleMatchChoice(item)}
                        aria-label={t(COLOR_NAME_KEY_BY_COLOR[item.color])}
                      >
                        <span className="color-garden__item-emoji" aria-hidden="true">
                          {item.emoji}
                        </span>
                      </button>
                      <div className="color-garden__text-row color-garden__text-row--tight">
                        <span className="color-garden__item-label">{t(COLOR_NAME_KEY_BY_COLOR[item.color])}</span>
                        <button
                          type="button"
                          className="color-garden__replay-button"
                          onClick={() => playStatusAudio(COLOR_NAME_KEY_BY_COLOR[item.color])}
                          aria-label={replayButtonAriaLabel}
                        >
                          <span aria-hidden="true">▶</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {round.mode === 'sort' && (
              <div className="color-garden__sort-layout">
                <div className="color-garden__item-tray">
                  {unassignedSortItems.map((item) => (
                    <div key={item.id} className="color-garden__item-card">
                      <button
                        type="button"
                        className={[
                          'color-garden__item',
                          highlightTargets && item.color === round.targetColor ? 'color-garden__item--highlight' : '',
                        ].join(' ')}
                        style={{ borderColor: COLOR_STYLE_BY_KEY[item.color] }}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData('text/plain', item.id);
                        }}
                        onClick={() => handleSortItemTap(item.id)}
                        aria-label={t(COLOR_NAME_KEY_BY_COLOR[item.color])}
                      >
                        <span className="color-garden__item-emoji" aria-hidden="true">
                          {item.emoji}
                        </span>
                      </button>
                      <div className="color-garden__text-row color-garden__text-row--tight">
                        <span className="color-garden__item-label">{t(COLOR_NAME_KEY_BY_COLOR[item.color])}</span>
                        <button
                          type="button"
                          className="color-garden__replay-button"
                          onClick={() => playStatusAudio(COLOR_NAME_KEY_BY_COLOR[item.color])}
                          aria-label={replayButtonAriaLabel}
                        >
                          <span aria-hidden="true">▶</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="color-garden__basket-grid">
                  {round.basketColors.map((color) => (
                    <div
                      key={`basket-${color}`}
                      className="color-garden__basket"
                      style={{
                        borderColor: color,
                        background: `color-mix(in srgb, ${COLOR_STYLE_BY_KEY[color]} 18%, white)`,
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const itemId = event.dataTransfer.getData('text/plain');
                        if (itemId) {
                          handleSortAssign(itemId, color);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if ((event.key === 'Enter' || event.key === ' ') && unassignedSortItems[0]) {
                          event.preventDefault();
                          handleSortAssign(unassignedSortItems[0].id, color);
                        }
                      }}
                      aria-label={t(COLOR_NAME_KEY_BY_COLOR[color])}
                    >
                      <div className="color-garden__text-row color-garden__text-row--tight">
                        <strong>{t(COLOR_NAME_KEY_BY_COLOR[color])}</strong>
                        <button
                          type="button"
                          className="color-garden__replay-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            playStatusAudio(COLOR_NAME_KEY_BY_COLOR[color]);
                          }}
                          aria-label={replayButtonAriaLabel}
                        >
                          <span aria-hidden="true">▶</span>
                        </button>
                      </div>
                      <div className="color-garden__basket-items">
                        {assignedSortItems
                          .filter((item) => assignmentByItemId[item.id] === color)
                          .map((item) => (
                            <span key={`placed-${item.id}`} className="color-garden__placed-item" aria-hidden="true">
                              {item.emoji}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {round.mode === 'rule' && (
              <div className="color-garden__rule-layout">
                <div className="color-garden__text-row">
                  <p className="color-garden__rule-note">{t('games.colorGarden.prompts.sort.fruitsBlue')}</p>
                  <button
                    type="button"
                    className="color-garden__replay-button"
                    onClick={() => playStatusAudio('games.colorGarden.prompts.sort.fruitsBlue')}
                    aria-label={replayButtonAriaLabel}
                  >
                    <span aria-hidden="true">▶</span>
                  </button>
                </div>
                <div className="color-garden__rule-grid">
                  {round.items.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    const isTarget = targetRuleItemIds.has(item.id);

                    return (
                      <div key={item.id} className="color-garden__item-card">
                        <button
                          type="button"
                          className={[
                            'color-garden__item',
                            isSelected ? 'color-garden__item--selected' : '',
                            highlightTargets && isTarget ? 'color-garden__item--highlight' : '',
                            duplicatePulseItemId === item.id ? 'color-garden__item--duplicate-pulse' : '',
                          ].join(' ')}
                          style={{ borderColor: COLOR_STYLE_BY_KEY[item.color] }}
                          onClick={() => handleRuleChoice(item)}
                          aria-label={t(COLOR_NAME_KEY_BY_COLOR[item.color])}
                        >
                          <span className="color-garden__item-emoji" aria-hidden="true">
                            {item.emoji}
                          </span>
                        </button>
                        <div className="color-garden__text-row color-garden__text-row--tight">
                          <span className="color-garden__item-label">{t(COLOR_NAME_KEY_BY_COLOR[item.color])}</span>
                          <button
                            type="button"
                            className="color-garden__replay-button"
                            onClick={() => playStatusAudio(COLOR_NAME_KEY_BY_COLOR[item.color])}
                            aria-label={replayButtonAriaLabel}
                          >
                            <span aria-hidden="true">▶</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tapFallbackEnabled && round.mode === 'sort' && (
              <div className="color-garden__text-row">
                <p className="color-garden__fallback-note">{t('games.colorGarden.hints.startWithOne')}</p>
                <button
                  type="button"
                  className="color-garden__replay-button"
                  onClick={() => playStatusAudio('games.colorGarden.hints.startWithOne')}
                  aria-label={replayButtonAriaLabel}
                >
                  <span aria-hidden="true">▶</span>
                </button>
              </div>
            )}
            {hintStep > 0 && (
              <div className="color-garden__text-row">
                <p className="color-garden__fallback-note">{t('games.colorGarden.hints.gentleRetry')}</p>
                <button
                  type="button"
                  className="color-garden__replay-button"
                  onClick={() => playStatusAudio('games.colorGarden.hints.gentleRetry')}
                  aria-label={replayButtonAriaLabel}
                >
                  <span aria-hidden="true">▶</span>
                </button>
              </div>
            )}
          </Card>
        </section>

        {gardenCelebrate && (
          <div className="color-garden__celebration-overlay" aria-hidden="true">
            <SuccessCelebration />
            <div className="color-garden__celebration-mascot">
              <MascotIllustration variant="success" size={88} />
            </div>
          </div>
        )}
      </Card>

      <style>{colorGardenStyles}</style>
    </div>
  );
}

const colorGardenStyles = `
  .color-garden {
    display: flex;
    justify-content: center;
    padding: var(--space-xl);
    background:
      radial-gradient(circle at 12% 14%, color-mix(in srgb, var(--color-accent-warning) 20%, transparent) 0, transparent 42%),
      radial-gradient(circle at 84% 90%, color-mix(in srgb, var(--color-accent-success) 22%, transparent) 0, transparent 56%),
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--color-theme-bg) 84%, #ffffff) 0%,
        color-mix(in srgb, var(--color-accent-info) 8%, #ffffff) 100%
      );
    min-height: 100%;
  }

  .color-garden__shell {
    width: min(1120px, 100%);
    display: grid;
    gap: var(--space-md);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 28%, white);
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--color-bg-card) 86%, #ffffff) 0%,
        color-mix(in srgb, var(--color-accent-success) 8%, #ffffff) 100%
      );
  }

  .color-garden__header {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
    align-items: center;
    justify-content: space-between;
    position: relative;
    z-index: 2;
  }

  .color-garden__heading {
    display: grid;
    gap: var(--space-xs);
  }

  .color-garden__text-row {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .color-garden__text-row > :first-child {
    margin: 0;
    flex: 1;
  }

  .color-garden__text-row--tight,
  .color-garden__text-row--center {
    justify-content: center;
  }

  .color-garden__text-row--tight > :first-child,
  .color-garden__text-row--center > :first-child {
    flex: initial;
  }

  [dir='rtl'] .color-garden__text-row .color-garden__replay-button {
    order: -1;
  }

  .color-garden__title {
    font-size: var(--font-size-2xl);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-extrabold);
  }

  .color-garden__subtitle {
    color: var(--color-text-secondary);
    font-size: var(--font-size-md);
  }

  .color-garden__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .color-garden__replay-btn {
    min-inline-size: 48px;
    min-block-size: 48px;
    padding-inline: var(--space-md);
  }

  .color-garden__replay-icon {
    font-size: 1.05rem;
    line-height: 1;
  }

  .color-garden__replay-button {
    inline-size: 48px;
    block-size: 48px;
    min-inline-size: 48px;
    min-block-size: 48px;
    border-radius: var(--radius-sm);
    border: none;
    background: transparent;
    color: var(--color-theme-primary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: transform var(--transition-fast), color var(--transition-fast);
  }

  .color-garden__replay-button:hover {
    transform: translateY(-1px);
    color: color-mix(in srgb, var(--color-theme-primary) 72%, var(--color-text-primary));
  }

  .color-garden__replay-button:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--color-theme-primary) 45%, transparent);
    outline-offset: 2px;
  }

  .color-garden__progress {
    display: grid;
    grid-template-columns: repeat(6, minmax(14px, 1fr));
    gap: var(--space-xs);
  }

  .color-garden__progress-dot {
    height: 14px;
    border-radius: var(--radius-full);
    background: var(--color-star-empty);
  }

  .color-garden__progress-dot--done {
    background: var(--color-accent-success);
  }

  .color-garden__progress-dot--active {
    background: var(--color-accent-primary);
    transform: scaleY(1.2);
  }

  .color-garden__progress-dot--active-live {
    animation: color-garden-progress-live 1.1s ease-in-out infinite;
  }

  .color-garden__score-strip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .color-garden__score-pill {
    min-height: 48px;
    padding-inline: var(--space-sm);
    border-radius: var(--radius-full);
    border: 1px solid color-mix(in srgb, var(--color-theme-primary) 30%, transparent);
    background: color-mix(in srgb, var(--color-theme-primary) 14%, white);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2xs);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
  }

  .color-garden__score-pill--pulse {
    animation: color-garden-score-pill 420ms var(--motion-ease-bounce);
  }

  .color-garden__message {
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    min-height: 48px;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    border: 2px solid transparent;
    position: relative;
    z-index: 2;
  }

  .color-garden__message-text {
    margin: 0;
    font-size: var(--font-size-md);
    flex: 1;
  }

  .color-garden__message--neutral {
    background: color-mix(in srgb, var(--color-bg-secondary) 70%, white);
    color: var(--color-text-primary);
  }

  .color-garden__message--hint {
    background: color-mix(in srgb, var(--color-accent-secondary) 30%, white);
    color: var(--color-text-primary);
    border-color: color-mix(in srgb, var(--color-accent-primary) 45%, transparent);
  }

  .color-garden__message--success {
    background: color-mix(in srgb, var(--color-accent-success) 22%, white);
    color: var(--color-text-primary);
    border-color: color-mix(in srgb, var(--color-accent-success) 60%, transparent);
  }

  .color-garden__board {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: var(--space-md);
    align-items: stretch;
    position: relative;
    z-index: 2;
  }

  .color-garden__scene-props {
    position: absolute;
    inset-inline: var(--space-sm);
    inset-block-start: calc(-1 * var(--space-md));
    display: flex;
    justify-content: space-between;
    align-items: center;
    opacity: 0.84;
    pointer-events: none;
    font-size: 1.35rem;
  }

  .color-garden__coach {
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
    border: 2px solid color-mix(in srgb, var(--color-accent-primary) 28%, transparent);
    box-shadow: var(--shadow-sm);
    animation: color-garden-coach-float 1600ms ease-in-out infinite;
  }

  .color-garden__coach,
  .color-garden__coach * {
    pointer-events: none;
  }

  .color-garden__panel {
    display: grid;
    gap: var(--space-sm);
    align-content: start;
  }

  .color-garden__panel-label {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .color-garden__swatch-grid {
    display: grid;
    gap: var(--space-xs);
    grid-template-columns: repeat(2, minmax(48px, 1fr));
  }

  .color-garden__swatch {
    min-height: 48px;
    border-radius: var(--radius-full);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 26%, transparent);
    font-weight: var(--font-weight-bold);
    padding: 0 var(--space-sm);
  }

  .color-garden__swatch--highlight {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent-primary) 24%, transparent);
  }

  .color-garden__hint {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .color-garden__match-grid,
  .color-garden__rule-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--space-sm);
  }

  .color-garden__item-tray {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
    gap: var(--space-sm);
  }

  .color-garden__item-card {
    display: grid;
    gap: var(--space-xs);
    align-content: start;
  }

  .color-garden__item {
    min-height: 56px;
    border-radius: var(--radius-lg);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 26%, transparent);
    background: white;
    display: grid;
    gap: var(--space-xs);
    justify-items: center;
    align-content: center;
    padding: var(--space-sm);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .color-garden__item:active {
    transform: scale(0.97);
  }

  .color-garden__item--selected {
    background: color-mix(in srgb, var(--color-accent-info) 20%, white);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent-info) 35%, transparent);
  }

  .color-garden__item--highlight {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent-primary) 24%, transparent);
  }

  .color-garden__item--duplicate-pulse {
    animation: color-garden-item-duplicate 360ms ease-out;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent-warning) 32%, transparent);
  }

  .color-garden__item-emoji {
    font-size: 1.7rem;
  }

  .color-garden__item-label {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
  }

  .color-garden__sort-layout {
    display: grid;
    gap: var(--space-md);
  }

  .color-garden__basket-grid {
    display: grid;
    gap: var(--space-sm);
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  }

  .color-garden__basket {
    min-height: 120px;
    border-radius: var(--radius-lg);
    border: 2px dashed color-mix(in srgb, var(--color-theme-primary) 28%, transparent);
    padding: var(--space-sm);
    display: grid;
    align-content: start;
    gap: var(--space-xs);
  }

  .color-garden__basket strong {
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
  }

  .color-garden__basket-items {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .color-garden__placed-item {
    inline-size: 32px;
    block-size: 32px;
    border-radius: var(--radius-md);
    display: inline-grid;
    place-items: center;
    background: color-mix(in srgb, white 70%, var(--color-bg-secondary));
  }

  .color-garden__rule-layout {
    display: grid;
    gap: var(--space-sm);
  }

  .color-garden__rule-note {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .color-garden__panel--celebrate {
    border: 2px solid color-mix(in srgb, var(--color-accent-success) 45%, transparent);
    background: color-mix(in srgb, var(--color-accent-success) 14%, white);
  }

  .color-garden__panel--success {
    animation: color-garden-panel-success 340ms ease-out;
  }

  .color-garden__panel--miss {
    animation: color-garden-panel-miss 300ms ease-in-out;
  }

  .color-garden__celebration-overlay {
    position: absolute;
    inset-inline: var(--space-md);
    inset-block-end: var(--space-md);
    display: grid;
    justify-items: center;
    gap: var(--space-xs);
    pointer-events: none;
    z-index: 1;
    animation: color-garden-celebrate 620ms var(--motion-ease-bounce) both;
  }

  .color-garden__celebration-overlay * {
    pointer-events: none;
  }

  .color-garden__celebration-mascot {
    animation: color-garden-mascot-pop 620ms var(--motion-ease-bounce) both;
  }

  .color-garden__fallback-note {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .color-garden--midpoint,
  .color-garden--complete {
    align-items: center;
  }

  .color-garden--midpoint .color-garden__shell,
  .color-garden--complete .color-garden__shell {
    max-width: 680px;
    text-align: center;
  }

  .color-garden__stars {
    display: flex;
    justify-content: center;
    gap: var(--space-xs);
  }

  .color-garden__star {
    font-size: 1.8rem;
  }

  .color-garden__summary-card {
    display: grid;
    gap: var(--space-sm);
    text-align: start;
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 18%, transparent);
  }

  @keyframes color-garden-celebrate {
    from {
      opacity: 0;
      transform: translateY(10px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes color-garden-mascot-pop {
    from {
      transform: scale(0.8) rotate(-3deg);
    }

    to {
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes color-garden-coach-float {
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

  @keyframes color-garden-progress-live {
    0% {
      transform: scaleY(1.2);
    }

    50% {
      transform: scaleY(1.48);
    }

    100% {
      transform: scaleY(1.2);
    }
  }

  @keyframes color-garden-score-pill {
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

  @keyframes color-garden-panel-success {
    0% {
      transform: scale(1);
    }

    40% {
      transform: scale(1.014);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent-success) 44%, transparent);
    }

    100% {
      transform: scale(1);
      box-shadow: none;
    }
  }

  @keyframes color-garden-panel-miss {
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

  @keyframes color-garden-item-duplicate {
    0% {
      transform: scale(1);
    }

    35% {
      transform: scale(1.04);
    }

    65% {
      transform: scale(0.98);
    }

    100% {
      transform: scale(1);
    }
  }

  @media (max-width: 920px) {
    .color-garden {
      padding: var(--space-md);
    }

    .color-garden__board {
      grid-template-columns: 1fr;
    }

    .color-garden__actions button {
      inline-size: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .color-garden *,
    .color-garden *::before,
    .color-garden *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }

    .color-garden__celebration-overlay,
    .color-garden__celebration-mascot,
    .color-garden__coach {
      animation: none !important;
    }
  }
`;
