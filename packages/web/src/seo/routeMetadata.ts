type RouteMetadataKey = 'login' | 'profiles' | 'home' | 'parent' | 'default';

export interface RouteMetadataDefinition {
  key: RouteMetadataKey;
  canonicalPath: string;
  indexable: boolean;
}

const DEFAULT_ROUTE_METADATA: RouteMetadataDefinition = {
  key: 'default',
  canonicalPath: '/home',
  indexable: false,
};

const ROUTE_METADATA_BY_PATH: Record<string, RouteMetadataDefinition> = {
  '/': {
    key: 'home',
    canonicalPath: '/home',
    indexable: false,
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
};

export function getRouteMetadata(pathname: string): RouteMetadataDefinition {
  return ROUTE_METADATA_BY_PATH[pathname] ?? DEFAULT_ROUTE_METADATA;
}
