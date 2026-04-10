import type { Database } from '@dubiland/shared';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { mapRouteTopicToContentSlug, type RouteTopicSlug } from '@/lib/topicSlugMap';

type VideoRow = Database['public']['Tables']['videos']['Row'];

const VIDEO_SELECT_FIELDS =
  'id, topic_id, age_group_id, name_key, description_key, video_type, video_url, thumbnail_url, duration_sec, sort_order';

export interface VideoAgeRange {
  minAge: number;
  maxAge: number;
}

export interface PublishedTopicVideo {
  id: string;
  topicId: string;
  ageGroupId: string;
  nameKey: string;
  descriptionKey: string | null;
  videoType: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
  sortOrder: number | null;
}

interface ListPublishedVideosByRouteTopicOptions {
  routeTopicSlug: RouteTopicSlug;
  ageRange?: VideoAgeRange;
}

function toPublishedTopicVideo(video: Pick<
  VideoRow,
  | 'id'
  | 'topic_id'
  | 'age_group_id'
  | 'name_key'
  | 'description_key'
  | 'video_type'
  | 'video_url'
  | 'thumbnail_url'
  | 'duration_sec'
  | 'sort_order'
>): PublishedTopicVideo {
  return {
    id: video.id,
    topicId: video.topic_id,
    ageGroupId: video.age_group_id,
    nameKey: video.name_key,
    descriptionKey: video.description_key,
    videoType: video.video_type,
    videoUrl: video.video_url,
    thumbnailUrl: video.thumbnail_url,
    durationSec: video.duration_sec,
    sortOrder: video.sort_order,
  };
}

async function findTopicIdBySlug(topicSlug: string): Promise<string | null> {
  const { data: topic, error } = await supabase.from('topics').select('id').eq('slug', topicSlug).maybeSingle();

  if (error) {
    throw error;
  }

  return topic?.id ?? null;
}

async function findAgeGroupIdsForRange(ageRange: VideoAgeRange): Promise<string[]> {
  if (ageRange.minAge > ageRange.maxAge) {
    return [];
  }

  const { data: ageGroups, error } = await supabase
    .from('age_groups')
    .select('id')
    .lte('min_age', ageRange.maxAge)
    .gte('max_age', ageRange.minAge);

  if (error) {
    throw error;
  }

  return (ageGroups ?? []).map((ageGroup) => ageGroup.id);
}

export async function listPublishedVideosByRouteTopic({
  routeTopicSlug,
  ageRange,
}: ListPublishedVideosByRouteTopicOptions): Promise<PublishedTopicVideo[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const contentTopicSlug = mapRouteTopicToContentSlug(routeTopicSlug);
  const topicId = await findTopicIdBySlug(contentTopicSlug);

  if (!topicId) {
    return [];
  }

  let matchingAgeGroupIds: string[] | null = null;

  if (ageRange) {
    matchingAgeGroupIds = await findAgeGroupIdsForRange(ageRange);
    if (matchingAgeGroupIds.length === 0) {
      return [];
    }
  }

  let videosQuery = supabase
    .from('videos')
    .select(VIDEO_SELECT_FIELDS)
    .eq('topic_id', topicId)
    .eq('is_published', true)
    .order('sort_order', { ascending: true, nullsFirst: false });

  if (matchingAgeGroupIds) {
    videosQuery = videosQuery.in('age_group_id', matchingAgeGroupIds);
  }

  const { data: videos, error } = await videosQuery;

  if (error) {
    throw error;
  }

  return (videos ?? []).map((video) => toPublishedTopicVideo(video));
}
