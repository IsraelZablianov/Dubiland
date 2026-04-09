-- Letters video listing read path + idempotent seed for Hebrew letters series (DUB-149).
-- RLS: unchanged — videos already has RLS + videos_public_read (published rows only).
--
-- Rollback (manual): DROP INDEX IF EXISTS idx_videos_topic_published_sort;
--   DELETE FROM videos WHERE video_url LIKE '/videos/he/letters-series/%.mp4'
--     AND topic_id IN (SELECT id FROM topics WHERE slug = 'letters');

-- Supports queries: WHERE topic_id = ? AND is_published = true ORDER BY sort_order
CREATE INDEX IF NOT EXISTS idx_videos_topic_published_sort
  ON videos (topic_id, is_published, sort_order);

-- Idempotent seed: one row per episode; skip if same topic + name_key already exists.
-- age_group: youngest band (3–4) chosen deterministically to match letter-tracing seed pattern.
-- video_url: stable canonical path for rendered episode assets (placeholder until CDN/upload).
-- is_published: false until Media marks assets ready (see architecture doc publish gate).
INSERT INTO videos (
  id,
  topic_id,
  age_group_id,
  name_key,
  description_key,
  video_type,
  video_url,
  thumbnail_url,
  duration_sec,
  sort_order,
  is_published
)
SELECT
  gen_random_uuid(),
  t.id,
  ag.id,
  e.name_key,
  e.description_key,
  'explainer',
  e.video_url,
  NULL,
  NULL,
  e.sort_order,
  false
FROM topics t
CROSS JOIN age_groups ag
CROSS JOIN (
  VALUES
    (
      'common.letters.pronunciation.alef'::text,
      'common.videos.lettersSeries.episodes.alef.intro'::text,
      '/videos/he/letters-series/alef.mp4'::text,
      1
    ),
    (
      'common.letters.pronunciation.bet',
      'common.videos.lettersSeries.episodes.bet.intro',
      '/videos/he/letters-series/bet.mp4',
      2
    ),
    (
      'common.letters.pronunciation.gimel',
      'common.videos.lettersSeries.episodes.gimel.intro',
      '/videos/he/letters-series/gimel.mp4',
      3
    ),
    (
      'common.letters.pronunciation.dalet',
      'common.videos.lettersSeries.episodes.dalet.intro',
      '/videos/he/letters-series/dalet.mp4',
      4
    ),
    (
      'common.letters.pronunciation.he',
      'common.videos.lettersSeries.episodes.he.intro',
      '/videos/he/letters-series/he.mp4',
      5
    ),
    (
      'common.letters.pronunciation.vav',
      'common.videos.lettersSeries.episodes.vav.intro',
      '/videos/he/letters-series/vav.mp4',
      6
    )
) AS e(name_key, description_key, video_url, sort_order)
WHERE t.slug = 'letters'
  AND ag.min_age = 3
  AND ag.max_age = 4
  AND NOT EXISTS (
    SELECT 1
    FROM videos v
    WHERE v.topic_id = t.id
      AND v.name_key = e.name_key
  );
