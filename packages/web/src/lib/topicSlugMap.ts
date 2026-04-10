export type RouteTopicSlug = 'letters' | 'numbers' | 'reading';
export type ContentTopicSlug = 'letters' | 'math' | 'reading';

const CONTENT_TOPIC_BY_ROUTE_TOPIC: Record<RouteTopicSlug, ContentTopicSlug> = {
  letters: 'letters',
  numbers: 'math',
  reading: 'reading',
};

export function mapRouteTopicToContentSlug(routeTopicSlug: RouteTopicSlug): ContentTopicSlug {
  return CONTENT_TOPIC_BY_ROUTE_TOPIC[routeTopicSlug];
}
