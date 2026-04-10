import type { Database } from '@dubiland/shared';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type CatalogAgeBand = '3-4' | '4-5' | '5-6' | '6-7' | 'all';
export type CatalogContentType = 'game' | 'video';
export type CatalogTopicSlug = 'math' | 'letters' | 'reading';
export type CatalogAgeMatchKind = 'primary' | 'support' | 'none';

type CatalogRpcRow = Database['public']['Functions']['dubiland_catalog_for_child']['Returns'][number];

export interface CatalogItem {
  contentType: CatalogContentType;
  contentId: string;
  slug: string | null;
  nameKey: string;
  descriptionKey: string | null;
  topicSlug: CatalogTopicSlug;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  primaryAgeBand: Exclude<CatalogAgeBand, 'all'>;
  supportAgeBands: Array<Exclude<CatalogAgeBand, 'all'>>;
  ageMatchKind: CatalogAgeMatchKind;
  ageMatchRank: 1 | 2 | 3;
  sortOrder: number;
  thumbnailUrl: string | null;
}

interface ListCatalogForChildOptions {
  childId: string;
  contentTypes?: CatalogContentType[];
  topicSlug?: CatalogTopicSlug | null;
  ageBand?: CatalogAgeBand | null;
  limit?: number;
  offset?: number;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const AGE_BANDS: Array<Exclude<CatalogAgeBand, 'all'>> = ['3-4', '4-5', '5-6', '6-7'];

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function isCatalogContentType(value: string): value is CatalogContentType {
  return value === 'game' || value === 'video';
}

function isCatalogTopicSlug(value: string): value is CatalogTopicSlug {
  return value === 'math' || value === 'letters' || value === 'reading';
}

function isAgeBand(value: string): value is Exclude<CatalogAgeBand, 'all'> {
  return AGE_BANDS.includes(value as Exclude<CatalogAgeBand, 'all'>);
}

function toDifficultyLevel(value: number): 1 | 2 | 3 | 4 | 5 {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(5, Math.round(value))) as 1 | 2 | 3 | 4 | 5;
}

function toAgeMatchKind(value: string): CatalogAgeMatchKind {
  if (value === 'primary' || value === 'support') {
    return value;
  }
  return 'none';
}

function toAgeMatchRank(value: number): 1 | 2 | 3 {
  if (value <= 1) return 1;
  if (value === 2) return 2;
  return 3;
}

function toCatalogItem(row: CatalogRpcRow): CatalogItem | null {
  if (!isCatalogContentType(row.content_type) || !isCatalogTopicSlug(row.topic_slug)) {
    return null;
  }

  const primaryAgeBand = isAgeBand(row.primary_age_band) ? row.primary_age_band : '3-4';
  const supportAgeBands = row.support_age_bands.filter(isAgeBand);

  return {
    contentType: row.content_type,
    contentId: row.content_id,
    slug: row.slug,
    nameKey: row.name_key,
    descriptionKey: row.description_key,
    topicSlug: row.topic_slug,
    difficultyLevel: toDifficultyLevel(row.difficulty_level),
    primaryAgeBand,
    supportAgeBands,
    ageMatchKind: toAgeMatchKind(row.age_match_kind),
    ageMatchRank: toAgeMatchRank(row.age_match_rank),
    sortOrder: row.sort_order,
    thumbnailUrl: row.thumbnail_url,
  };
}

/**
 * Returns `null` when the runtime cannot call the catalog RPC (missing Supabase
 * config or a local demo profile id that is not a UUID).
 */
export async function listCatalogForChild(
  options: ListCatalogForChildOptions,
): Promise<CatalogItem[] | null> {
  const { childId, contentTypes = ['game'], topicSlug = null, ageBand = null, limit = 50, offset = 0 } = options;

  if (!isSupabaseConfigured || !isUuid(childId)) {
    return null;
  }

  const { data, error } = await supabase.rpc('dubiland_catalog_for_child', {
    p_child_id: childId,
    p_content_types: contentTypes,
    p_topic_slug: topicSlug ?? undefined,
    p_age_band: ageBand ?? undefined,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    throw error;
  }

  return (data ?? []).map(toCatalogItem).filter((item): item is CatalogItem => item !== null);
}
