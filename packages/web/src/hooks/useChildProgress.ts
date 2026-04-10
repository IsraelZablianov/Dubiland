import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type TopicSlug = 'math' | 'letters' | 'reading';

export interface TopicProgress {
  slug: TopicSlug;
  progress: number;
}

export interface ChildProgressData {
  topics: TopicProgress[];
  dailyMinutes: number;
  loading: boolean;
}

const EMPTY: ChildProgressData = {
  topics: [
    { slug: 'math', progress: 0 },
    { slug: 'letters', progress: 0 },
    { slug: 'reading', progress: 0 },
  ],
  dailyMinutes: 0,
  loading: false,
};

export function useChildProgress(childId: string | null): ChildProgressData {
  const [data, setData] = useState<ChildProgressData>({ ...EMPTY, loading: true });

  useEffect(() => {
    if (!childId || childId === 'guest' || !isSupabaseConfigured) {
      setData(EMPTY);
      return;
    }

    let cancelled = false;

    async function fetch() {
      try {
        const [topicsRes, gamesRes, summariesRes, sessionsRes] = await Promise.all([
          supabase.from('topics').select('id, slug'),
          supabase.from('games').select('id, topic_id, is_published').eq('is_published', true),
          supabase.from('child_game_summaries').select('game_id, best_stars').eq('child_id', childId!),
          supabase
            .from('game_sessions')
            .select('started_at, ended_at')
            .eq('child_id', childId!)
            .gte('started_at', new Date().toISOString().slice(0, 10)),
        ]);

        if (cancelled) return;

        const topics = topicsRes.data ?? [];
        const games = gamesRes.data ?? [];
        const summaries = summariesRes.data ?? [];
        const sessions = sessionsRes.data ?? [];

        const topicIdBySlug = new Map(topics.map((t) => [t.id, t.slug as TopicSlug]));
        const starsById = new Map(summaries.map((s) => [s.game_id, s.best_stars]));

        const topicGameCount = new Map<TopicSlug, number>();
        const topicStarSum = new Map<TopicSlug, number>();

        for (const game of games) {
          const slug = topicIdBySlug.get(game.topic_id);
          if (!slug) continue;

          topicGameCount.set(slug, (topicGameCount.get(slug) ?? 0) + 1);
          const stars = starsById.get(game.id) ?? 0;
          topicStarSum.set(slug, (topicStarSum.get(slug) ?? 0) + stars);
        }

        const topicProgress: TopicProgress[] = (['math', 'letters', 'reading'] as TopicSlug[]).map(
          (slug) => {
            const total = topicGameCount.get(slug) ?? 0;
            const earned = topicStarSum.get(slug) ?? 0;
            const maxStars = total * 3;
            return {
              slug,
              progress: maxStars > 0 ? Math.round((earned / maxStars) * 100) : 0,
            };
          },
        );

        let dailyMs = 0;
        for (const s of sessions) {
          if (s.ended_at && s.started_at) {
            dailyMs += new Date(s.ended_at).getTime() - new Date(s.started_at).getTime();
          }
        }

        if (!cancelled) {
          setData({
            topics: topicProgress,
            dailyMinutes: Math.round(dailyMs / 60_000),
            loading: false,
          });
        }
      } catch {
        if (!cancelled) setData(EMPTY);
      }
    }

    void fetch();
    return () => { cancelled = true; };
  }, [childId]);

  return data;
}
