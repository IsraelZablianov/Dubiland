-- DUB-767: Letter Storybook v2 — separate catalog row from v1 (`letterStorybook`).
-- Inserts one published `games` row (`letterStorybookV2`), one `game_levels` config surface,
-- and age/topic/difficulty tag assignments (idempotent).
--
-- Rollback (manual, dev/staging):
--   DELETE FROM public.game_levels WHERE game_id IN (
--     SELECT id FROM public.games WHERE slug = 'letterStorybookV2'
--   );
--   DELETE FROM public.game_tag_assignments WHERE game_id IN (
--     SELECT id FROM public.games WHERE slug = 'letterStorybookV2'
--   );
--   DELETE FROM public.games WHERE slug = 'letterStorybookV2';

-- ---------------------------------------------------------------------------
-- letterStorybookV2 — reading, ages 5–6 primary + 3–4 / 6–7 support
-- ---------------------------------------------------------------------------
WITH topic AS (
  SELECT id
  FROM public.topics
  WHERE slug = 'reading'
  LIMIT 1
),
age_group AS (
  SELECT id
  FROM public.age_groups
  WHERE min_age = 5 AND max_age = 6
  LIMIT 1
),
inserted_game AS (
  INSERT INTO public.games (
    id,
    topic_id,
    age_group_id,
    slug,
    name_key,
    description_key,
    game_type,
    component_key,
    difficulty,
    sort_order,
    thumbnail_url,
    audio_url,
    is_published
  )
  SELECT
    gen_random_uuid(),
    topic.id,
    age_group.id,
    'letterStorybookV2',
    'games.letterStorybookV2.title',
    'games.letterStorybookV2.subtitle',
    'storybook_letters_v2',
    'LetterStorybookV2Game',
    4,
    10,
    NULL,
    '/audio/he/games/letter-storybook-v2/instructions/intro.mp3',
    true
  FROM topic, age_group
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.games
    WHERE slug = 'letterStorybookV2'
  )
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id
  FROM public.games
  WHERE slug = 'letterStorybookV2'
)
INSERT INTO public.game_levels (
  id,
  game_id,
  level_number,
  config_json,
  sort_order
)
SELECT
  gen_random_uuid(),
  resolved_game.id,
  1,
  '{
    "adaptive": true,
    "storyVersion": 2,
    "pages": 22,
    "storyLetterCount": 22,
    "chapterCount": 3,
    "antiRandomTapGuard": {
      "wrongTapCount": 3,
      "windowMs": 2000,
      "pauseMs": 1000
    }
  }'::jsonb,
  1
FROM resolved_game
WHERE NOT EXISTS (
  SELECT 1
  FROM public.game_levels gl
  WHERE gl.game_id = resolved_game.id
    AND gl.level_number = 1
);

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'age'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'age.primary.5-6'
WHERE g.slug = 'letterStorybookV2'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'support'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'age'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'age.primary.3-4'
WHERE g.slug = 'letterStorybookV2'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'support'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'age'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'age.primary.6-7'
WHERE g.slug = 'letterStorybookV2'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.topics top ON top.id = g.topic_id
JOIN public.tag_dimensions d ON d.slug = 'topic'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'topic.' || top.slug
WHERE g.slug = 'letterStorybookV2'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'difficulty'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'difficulty.' || coalesce(g.difficulty, 1)::text
WHERE g.slug = 'letterStorybookV2'
ON CONFLICT (game_id, tag_id) DO NOTHING;
