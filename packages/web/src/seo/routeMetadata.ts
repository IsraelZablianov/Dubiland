export type RouteMetadataKey =
  | 'landing'
  | 'about'
  | 'parents'
  | 'parentsFaq'
  | 'terms'
  | 'privacy'
  | 'letters'
  | 'numbers'
  | 'reading'
  | 'login'
  | 'profiles'
  | 'home'
  | 'parent'
  | 'countingPicnicGame'
  | 'shapeSafariGame'
  | 'moreOrLessMarketGame'
  | 'numberLineJumpsGame'
  | 'build10WorkshopGame'
  | 'subtractionStreetGame'
  | 'timeAndRoutineBuilderGame'
  | 'colorGardenGame'
  | 'letterSoundMatchGame'
  | 'letterTracingTrailGame'
  | 'letterSkyCatcherGame'
  | 'pictureToWordBuilderGame'
  | 'sightWordSprintGame'
  | 'decodableMicroStoriesGame'
  | 'decodableStoryMissionsGame'
  | 'interactiveHandbookGame'
  | 'letterStorybookGame'
  | 'rootFamilyStickersGame'
  | 'confusableLetterContrastGame'
  | 'nikudSoundLadderGame'
  | 'syllableTrainBuilderGame'
  | 'blendToReadVideoShortsGame'
  | 'notFound'
  | 'default';

export interface RouteMetadataDefinition {
  key: RouteMetadataKey;
  canonicalPath: string | null;
  indexable: boolean;
}

const DEFAULT_ROUTE_METADATA: RouteMetadataDefinition = {
  key: 'notFound',
  canonicalPath: null,
  indexable: false,
};

const ROUTE_METADATA_BY_PATH: Record<string, RouteMetadataDefinition> = {
  '/': {
    key: 'landing',
    canonicalPath: '/',
    indexable: true,
  },
  '/about': {
    key: 'about',
    canonicalPath: '/about',
    indexable: true,
  },
  '/parents': {
    key: 'parents',
    canonicalPath: '/parents',
    indexable: true,
  },
  '/parents/faq': {
    key: 'parentsFaq',
    canonicalPath: '/parents/faq',
    indexable: true,
  },
  '/terms': {
    key: 'terms',
    canonicalPath: '/terms',
    indexable: true,
  },
  '/privacy': {
    key: 'privacy',
    canonicalPath: '/privacy',
    indexable: true,
  },
  '/letters': {
    key: 'letters',
    canonicalPath: '/letters',
    indexable: true,
  },
  '/numbers': {
    key: 'numbers',
    canonicalPath: '/numbers',
    indexable: true,
  },
  '/reading': {
    key: 'reading',
    canonicalPath: '/reading',
    indexable: true,
  },
  '/login': {
    key: 'login',
    canonicalPath: '/login',
    indexable: false,
  },
  '/profiles': {
    key: 'profiles',
    canonicalPath: '/profiles',
    indexable: false,
  },
  '/games': {
    key: 'home',
    canonicalPath: '/games',
    indexable: false,
  },
  '/parent': {
    key: 'parent',
    canonicalPath: '/parent',
    indexable: false,
  },
  '/games/numbers/counting-picnic': {
    key: 'countingPicnicGame',
    canonicalPath: '/games/numbers/counting-picnic',
    indexable: false,
  },
  '/games/numbers/shape-safari': {
    key: 'shapeSafariGame',
    canonicalPath: '/games/numbers/shape-safari',
    indexable: false,
  },
  '/games/numbers/more-or-less-market': {
    key: 'moreOrLessMarketGame',
    canonicalPath: '/games/numbers/more-or-less-market',
    indexable: false,
  },
  '/games/numbers/number-line-jumps': {
    key: 'numberLineJumpsGame',
    canonicalPath: '/games/numbers/number-line-jumps',
    indexable: false,
  },
  '/games/numbers/build-10-workshop': {
    key: 'build10WorkshopGame',
    canonicalPath: '/games/numbers/build-10-workshop',
    indexable: false,
  },
  '/games/numbers/subtraction-street': {
    key: 'subtractionStreetGame',
    canonicalPath: '/games/numbers/subtraction-street',
    indexable: false,
  },
  '/games/numbers/time-and-routine-builder': {
    key: 'timeAndRoutineBuilderGame',
    canonicalPath: '/games/numbers/time-and-routine-builder',
    indexable: false,
  },
  '/games/colors/color-garden': {
    key: 'colorGardenGame',
    canonicalPath: '/games/colors/color-garden',
    indexable: false,
  },
  '/games/letters/letter-sound-match': {
    key: 'letterSoundMatchGame',
    canonicalPath: '/games/letters/letter-sound-match',
    indexable: false,
  },
  '/games/letters/letter-tracing-trail': {
    key: 'letterTracingTrailGame',
    canonicalPath: '/games/letters/letter-tracing-trail',
    indexable: false,
  },
  '/games/letters/letter-sky-catcher': {
    key: 'letterSkyCatcherGame',
    canonicalPath: '/games/letters/letter-sky-catcher',
    indexable: false,
  },
  '/games/reading/picture-to-word-builder': {
    key: 'pictureToWordBuilderGame',
    canonicalPath: '/games/reading/picture-to-word-builder',
    indexable: false,
  },
  '/games/reading/sight-word-sprint': {
    key: 'sightWordSprintGame',
    canonicalPath: '/games/reading/sight-word-sprint',
    indexable: false,
  },
  '/games/reading/decodable-micro-stories': {
    key: 'decodableMicroStoriesGame',
    canonicalPath: '/games/reading/decodable-micro-stories',
    indexable: false,
  },
  '/games/reading/decodable-story-missions': {
    key: 'decodableStoryMissionsGame',
    canonicalPath: '/games/reading/decodable-story-missions',
    indexable: false,
  },
  '/games/reading/interactive-handbook': {
    key: 'interactiveHandbookGame',
    canonicalPath: '/games/reading/interactive-handbook',
    indexable: false,
  },
  '/games/reading/letter-storybook': {
    key: 'letterStorybookGame',
    canonicalPath: '/games/reading/letter-storybook',
    indexable: false,
  },
  '/games/reading/root-family-stickers': {
    key: 'rootFamilyStickersGame',
    canonicalPath: '/games/reading/root-family-stickers',
    indexable: false,
  },
  '/games/reading/confusable-letter-contrast': {
    key: 'confusableLetterContrastGame',
    canonicalPath: '/games/reading/confusable-letter-contrast',
    indexable: false,
  },
  '/games/reading/nikud-sound-ladder': {
    key: 'nikudSoundLadderGame',
    canonicalPath: '/games/reading/nikud-sound-ladder',
    indexable: false,
  },
  '/games/reading/syllable-train-builder': {
    key: 'syllableTrainBuilderGame',
    canonicalPath: '/games/reading/syllable-train-builder',
    indexable: false,
  },
  '/games/reading/blend-to-read-video-shorts': {
    key: 'blendToReadVideoShortsGame',
    canonicalPath: '/games/reading/blend-to-read-video-shorts',
    indexable: false,
  },
};

export function getRouteMetadata(pathname: string): RouteMetadataDefinition {
  return ROUTE_METADATA_BY_PATH[pathname] ?? DEFAULT_ROUTE_METADATA;
}
