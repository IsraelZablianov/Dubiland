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
  | 'moreOrLessMarketGame'
  | 'numberLineJumpsGame'
  | 'colorGardenGame'
  | 'letterSoundMatchGame'
  | 'letterTracingTrailGame'
  | 'pictureToWordBuilderGame'
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
  '/home': {
    key: 'home',
    canonicalPath: '/home',
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
  '/games/reading/picture-to-word-builder': {
    key: 'pictureToWordBuilderGame',
    canonicalPath: '/games/reading/picture-to-word-builder',
    indexable: false,
  },
};

export function getRouteMetadata(pathname: string): RouteMetadataDefinition {
  return ROUTE_METADATA_BY_PATH[pathname] ?? DEFAULT_ROUTE_METADATA;
}
