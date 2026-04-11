import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { mapRouteTopicToContentSlug, type ContentTopicSlug, type RouteTopicSlug } from '@/lib/topicSlugMap';

const CountingPicnic = lazy(() => import('@/pages/CountingPicnic'));
const MoreOrLessMarket = lazy(() => import('@/pages/MoreOrLessMarket'));
const MeasureAndMatch = lazy(() => import('@/pages/MeasureAndMatch'));
const ShapeSafari = lazy(() => import('@/pages/ShapeSafari'));
const PatternTrain = lazy(() => import('@/pages/PatternTrain'));
const ColorGarden = lazy(() => import('@/pages/ColorGarden'));
const NumberLineJumps = lazy(() => import('@/pages/NumberLineJumps'));
const Build10Workshop = lazy(() => import('@/pages/Build10Workshop'));
const SubtractionStreet = lazy(() => import('@/pages/SubtractionStreet'));
const TimeAndRoutineBuilder = lazy(() => import('@/pages/TimeAndRoutineBuilder'));
const PictureToWordBuilder = lazy(() => import('@/pages/PictureToWordBuilder'));
const SightWordSprint = lazy(() => import('@/pages/SightWordSprint'));
const DecodableMicroStories = lazy(() => import('@/pages/DecodableMicroStories'));
const DecodableStoryMissions = lazy(() => import('@/pages/DecodableStoryMissions'));
const InteractiveHandbook = lazy(() => import('@/pages/InteractiveHandbook'));
const LetterStorybook = lazy(() => import('@/pages/LetterStorybook'));
const LetterStorybookV2 = lazy(() => import('@/pages/LetterStorybookV2'));
const RootFamilyStickers = lazy(() => import('@/pages/RootFamilyStickers'));
const ConfusableLetterContrast = lazy(() => import('@/pages/ConfusableLetterContrast'));
const NikudSoundLadder = lazy(() => import('@/pages/NikudSoundLadder'));
const SyllableTrainBuilder = lazy(() => import('@/pages/SyllableTrainBuilder'));
const SoundSlideBlending = lazy(() => import('@/pages/SoundSlideBlending'));
const ShvaSoundSwitch = lazy(() => import('@/pages/ShvaSoundSwitch'));
const SpellAndSendPostOffice = lazy(() => import('@/pages/SpellAndSendPostOffice'));
const PointingFadeBridge = lazy(() => import('@/pages/PointingFadeBridge'));
const BlendToReadVideoShorts = lazy(() => import('@/pages/BlendToReadVideoShorts'));
const LetterSoundMatch = lazy(() => import('@/pages/LetterSoundMatch'));
const LetterTracingTrail = lazy(() => import('@/pages/LetterTracingTrail'));
const LetterSkyCatcher = lazy(() => import('@/pages/LetterSkyCatcher'));

type RouteGameTopicSlug = RouteTopicSlug | 'colors';

export interface GameRouteManifestEntry {
  path: `/games/${RouteGameTopicSlug}/${string}`;
  routeTopicSlug: RouteGameTopicSlug;
  contentTopicSlug: ContentTopicSlug;
  gameSlug: string;
  component: LazyExoticComponent<ComponentType>;
  disableShellAnimation?: boolean;
}

interface DefineGameRouteParams {
  routeTopicSlug: RouteGameTopicSlug;
  gameSlug: string;
  component: LazyExoticComponent<ComponentType>;
  disableShellAnimation?: boolean;
}

function resolveContentTopicSlug(routeTopicSlug: RouteGameTopicSlug): ContentTopicSlug {
  if (routeTopicSlug === 'colors') {
    return 'math';
  }

  return mapRouteTopicToContentSlug(routeTopicSlug);
}

function defineGameRoute(params: DefineGameRouteParams): GameRouteManifestEntry {
  const { routeTopicSlug, gameSlug, component, disableShellAnimation = false } = params;

  return {
    path: `/games/${routeTopicSlug}/${gameSlug}`,
    routeTopicSlug,
    contentTopicSlug: resolveContentTopicSlug(routeTopicSlug),
    gameSlug,
    component,
    disableShellAnimation,
  };
}

export const GAME_ROUTE_MANIFEST = [
  defineGameRoute({
    routeTopicSlug: 'numbers',
    gameSlug: 'counting-picnic',
    component: CountingPicnic,
  }),
  defineGameRoute({
    routeTopicSlug: 'numbers',
    gameSlug: 'more-or-less-market',
    component: MoreOrLessMarket,
  }),
  defineGameRoute({
    routeTopicSlug: 'numbers',
    gameSlug: 'measure-and-match',
    component: MeasureAndMatch,
  }),
  defineGameRoute({
    routeTopicSlug: 'numbers',
    gameSlug: 'shape-safari',
    component: ShapeSafari,
  }),
  defineGameRoute({
    routeTopicSlug: 'numbers',
    gameSlug: 'pattern-train',
    component: PatternTrain,
  }),
  defineGameRoute({
    routeTopicSlug: 'numbers',
    gameSlug: 'number-line-jumps',
    component: NumberLineJumps,
  }),
  defineGameRoute({
    routeTopicSlug: 'numbers',
    gameSlug: 'build-10-workshop',
    component: Build10Workshop,
  }),
  defineGameRoute({
    routeTopicSlug: 'numbers',
    gameSlug: 'subtraction-street',
    component: SubtractionStreet,
  }),
  defineGameRoute({
    routeTopicSlug: 'numbers',
    gameSlug: 'time-and-routine-builder',
    component: TimeAndRoutineBuilder,
  }),
  defineGameRoute({
    routeTopicSlug: 'colors',
    gameSlug: 'color-garden',
    component: ColorGarden,
  }),
  defineGameRoute({
    routeTopicSlug: 'reading',
    gameSlug: 'picture-to-word-builder',
    component: PictureToWordBuilder,
  }),
  defineGameRoute({
    routeTopicSlug: 'reading',
    gameSlug: 'sight-word-sprint',
    component: SightWordSprint,
  }),
  defineGameRoute({
    routeTopicSlug: 'reading',
    gameSlug: 'decodable-micro-stories',
    component: DecodableMicroStories,
  }),
  defineGameRoute({
    routeTopicSlug: 'reading',
    gameSlug: 'decodable-story-missions',
    component: DecodableStoryMissions,
  }),
  defineGameRoute({
    routeTopicSlug: 'reading',
    gameSlug: 'interactive-handbook',
    component: InteractiveHandbook,
    disableShellAnimation: true,
  }),
  defineGameRoute({
    routeTopicSlug: 'reading',
    gameSlug: 'letter-storybook',
    component: LetterStorybook,
  }),
  defineGameRoute({
    routeTopicSlug: 'reading',
    gameSlug: 'letter-storybook-v2',
    component: LetterStorybookV2,
  }),
  defineGameRoute({
    routeTopicSlug: 'reading',
    gameSlug: 'root-family-stickers',
    component: RootFamilyStickers,
  }),
  defineGameRoute({
    routeTopicSlug: 'reading',
    gameSlug: 'confusable-letter-contrast',
    component: ConfusableLetterContrast,
  }),
  defineGameRoute({
    routeTopicSlug: 'reading',
    gameSlug: 'nikud-sound-ladder',
    component: NikudSoundLadder,
  }),
  defineGameRoute({
    routeTopicSlug: 'reading',
    gameSlug: 'syllable-train-builder',
    component: SyllableTrainBuilder,
  }),
  defineGameRoute({
    routeTopicSlug: 'reading',
    gameSlug: 'sound-slide-blending',
    component: SoundSlideBlending,
  }),
  defineGameRoute({
    routeTopicSlug: 'reading',
    gameSlug: 'shva-sound-switch',
    component: ShvaSoundSwitch,
  }),
  defineGameRoute({
    routeTopicSlug: 'reading',
    gameSlug: 'spell-and-send-post-office',
    component: SpellAndSendPostOffice,
  }),
  defineGameRoute({
    routeTopicSlug: 'reading',
    gameSlug: 'pointing-fade-bridge',
    component: PointingFadeBridge,
  }),
  defineGameRoute({
    routeTopicSlug: 'reading',
    gameSlug: 'blend-to-read-video-shorts',
    component: BlendToReadVideoShorts,
  }),
  defineGameRoute({
    routeTopicSlug: 'letters',
    gameSlug: 'letter-sound-match',
    component: LetterSoundMatch,
  }),
  defineGameRoute({
    routeTopicSlug: 'letters',
    gameSlug: 'letter-tracing-trail',
    component: LetterTracingTrail,
  }),
  defineGameRoute({
    routeTopicSlug: 'letters',
    gameSlug: 'letter-sky-catcher',
    component: LetterSkyCatcher,
  }),
] as const satisfies readonly GameRouteManifestEntry[];
