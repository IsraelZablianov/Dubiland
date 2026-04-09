import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components/design-system';
import type { GameProps, ParentSummaryMetrics, StableRange } from '@/games/engine';

type GardenColor = 'red' | 'blue' | 'yellow' | 'green' | 'orange' | 'purple' | 'pink' | 'brown';
type ItemCategory = 'fruit' | 'toy' | 'nature';
type RoundMode = 'match' | 'sort' | 'rule';
type HintTone = 'neutral' | 'hint' | 'success';

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
  toy: ['🧸', '🪀', '🧩', '🚗', '🎈'],
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

function areSetsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) {
    return false;
  }

  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }

  return true;
}

export function ColorGardenGame({ onComplete, audio }: GameProps) {
  const { t } = useTranslation('common');

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

  const completionReportedRef = useRef(false);

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
      return;
    }

    setSelectedItemIds((current) => [...current, missingTarget]);
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

    setMessageWithAudio('games.colorGarden.feedback.encouragement.tryAgain', 'hint');

    setMistakesThisRound((currentMistakes) => {
      const nextMistakeCount = currentMistakes + 1;

      window.setTimeout(() => {
        escalateHint(nextMistakeCount);
      }, 260);

      return nextMistakeCount;
    });
  }, [escalateHint, midpointPaused, sessionComplete, setMessageWithAudio]);

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

  const handleRuleToggle = useCallback(
    (itemId: string) => {
      if (round.mode !== 'rule' || sessionComplete || midpointPaused) {
        return;
      }

      setSelectedItemIds((current) => {
        if (current.includes(itemId)) {
          return current.filter((value) => value !== itemId);
        }
        return [...current, itemId];
      });
    },
    [midpointPaused, round.mode, sessionComplete],
  );

  const handleRuleCheck = useCallback(() => {
    if (round.mode !== 'rule' || sessionComplete || midpointPaused) {
      return;
    }

    const selectedSet = new Set(selectedItemIds);
    if (!areSetsEqual(selectedSet, targetRuleItemIds)) {
      registerMistake();
      return;
    }

    completeRound();
  }, [completeRound, midpointPaused, registerMistake, round.mode, selectedItemIds, sessionComplete, targetRuleItemIds]);

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
      audio.stop();
    };
  }, [audio]);

  const messageText = t(roundMessage.key);

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
          <h2 className="color-garden__title">{t('feedback.greatEffort')}</h2>
          <p className="color-garden__subtitle">{t('games.colorGarden.roundComplete.nextColor')}</p>
          <Button variant="primary" size="lg" onClick={handleContinueAfterMidpoint} aria-label={t('nav.next')}>
            {t('nav.next')}
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
            <h2 className="color-garden__title">{t('games.colorGarden.title')}</h2>
            <p className="color-garden__subtitle">{t('games.colorGarden.subtitle')}</p>
          </div>

          <div className="color-garden__actions">
            <Button
              variant="secondary"
              size="md"
              onClick={handleReplayInstruction}
              aria-label={t('games.colorGarden.instructions.tapReplay')}
            >
              🔊 {t('games.colorGarden.instructions.tapReplay')}
            </Button>
            {round.mode === 'rule' && (
              <Button variant="primary" size="md" onClick={handleRuleCheck} aria-label={t('nav.finish')}>
                {t('nav.finish')}
              </Button>
            )}
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
                className={`color-garden__progress-dot color-garden__progress-dot--${state}`}
                aria-hidden="true"
              />
            );
          })}
        </div>

        <p className={`color-garden__message color-garden__message--${roundMessage.tone}`} aria-live="polite">
          {messageText}
        </p>

        <section className="color-garden__board">
          <Card padding="md" className="color-garden__panel color-garden__panel--swatches">
            <p className="color-garden__panel-label">{t(round.instructionKey)}</p>
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

            <p className="color-garden__hint">
              {round.mode === 'rule'
                ? t('games.colorGarden.instructions.colorAndCategory')
                : t('games.colorGarden.instructions.tapMatches')}
            </p>
          </Card>

          <Card
            padding="md"
            className={[
              'color-garden__panel',
              'color-garden__panel--board',
              gardenCelebrate ? 'color-garden__panel--celebrate' : '',
            ].join(' ')}
          >
            {round.mode === 'match' && (
              <div className="color-garden__match-grid">
                {round.items.map((item) => {
                  const highlighted = highlightTargets && item.color === round.targetColor;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={['color-garden__item', highlighted ? 'color-garden__item--highlight' : ''].join(' ')}
                      style={{ borderColor: COLOR_STYLE_BY_KEY[item.color] }}
                      onClick={() => handleMatchChoice(item)}
                      aria-label={t(COLOR_NAME_KEY_BY_COLOR[item.color])}
                    >
                      <span className="color-garden__item-emoji" aria-hidden="true">
                        {item.emoji}
                      </span>
                      <span className="color-garden__item-label">{t(COLOR_NAME_KEY_BY_COLOR[item.color])}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {round.mode === 'sort' && (
              <div className="color-garden__sort-layout">
                <div className="color-garden__item-tray">
                  {unassignedSortItems.map((item) => (
                    <button
                      key={item.id}
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
                      <span className="color-garden__item-label">{t(COLOR_NAME_KEY_BY_COLOR[item.color])}</span>
                    </button>
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
                      <strong>{t(COLOR_NAME_KEY_BY_COLOR[color])}</strong>
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
                <p className="color-garden__rule-note">{t('games.colorGarden.prompts.sort.fruitsBlue')}</p>
                <div className="color-garden__rule-grid">
                  {round.items.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    const isTarget = targetRuleItemIds.has(item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={[
                          'color-garden__item',
                          isSelected ? 'color-garden__item--selected' : '',
                          highlightTargets && isTarget ? 'color-garden__item--highlight' : '',
                        ].join(' ')}
                        style={{ borderColor: COLOR_STYLE_BY_KEY[item.color] }}
                        onClick={() => handleRuleToggle(item.id)}
                        aria-label={t(COLOR_NAME_KEY_BY_COLOR[item.color])}
                      >
                        <span className="color-garden__item-emoji" aria-hidden="true">
                          {item.emoji}
                        </span>
                        <span className="color-garden__item-label">{t(COLOR_NAME_KEY_BY_COLOR[item.color])}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tapFallbackEnabled && round.mode === 'sort' && (
              <p className="color-garden__fallback-note">{t('games.colorGarden.hints.startWithOne')}</p>
            )}
            {hintStep > 0 && <p className="color-garden__fallback-note">{t('games.colorGarden.hints.gentleRetry')}</p>}
          </Card>
        </section>
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
    background: var(--color-theme-bg);
    min-height: 100%;
  }

  .color-garden__shell {
    width: min(1120px, 100%);
    display: grid;
    gap: var(--space-md);
    border: 2px solid color-mix(in srgb, var(--color-theme-primary) 28%, white);
  }

  .color-garden__header {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
    align-items: center;
    justify-content: space-between;
  }

  .color-garden__heading {
    display: grid;
    gap: var(--space-xs);
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

  .color-garden__message {
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-size-md);
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    border: 2px solid transparent;
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
    grid-template-columns: repeat(2, minmax(44px, 1fr));
  }

  .color-garden__swatch {
    min-height: 44px;
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

  .color-garden__item {
    min-height: 52px;
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

  .color-garden__item-emoji {
    font-size: 1.7rem;
  }

  .color-garden__item-label {
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
  }
`;
