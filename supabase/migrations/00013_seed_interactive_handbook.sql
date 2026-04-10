-- Interactive handbook: catalog game row + content graph seed (DUB-325 / DUB-330).
-- Depends: 00001 (games), 00007/00008 (tag dimensions), 00012 (handbooks tables).
--
-- Rollback (manual, dev/staging):
--   DELETE FROM public.game_tag_assignments WHERE game_id IN (SELECT id FROM public.games WHERE slug = 'interactiveHandbook');
--   DELETE FROM public.game_levels WHERE game_id IN (SELECT id FROM public.games WHERE slug = 'interactiveHandbook');
--   DELETE FROM public.games WHERE slug = 'interactiveHandbook';
--   DELETE FROM public.handbook_pages WHERE handbook_id IN (SELECT id FROM public.handbooks WHERE slug = 'gardenOfSurprises');
--   DELETE FROM public.handbooks WHERE slug = 'gardenOfSurprises';

-- ---------------------------------------------------------------------------
-- Published handbook (read path + child_handbook_progress FK target)
-- ---------------------------------------------------------------------------
INSERT INTO public.handbooks (
  topic_id,
  age_group_id,
  slug,
  title_key,
  description_key,
  theme_slug,
  cover_thumbnail_url,
  sort_order,
  is_published,
  content_schema_version,
  preload_manifest_json
)
SELECT
  t.id,
  ag.id,
  'gardenOfSurprises',
  'games.interactiveHandbook.handbooks.gardenOfSurprises.cover.title',
  'games.interactiveHandbook.handbooks.gardenOfSurprises.cover.subtitle',
  'bear',
  NULL,
  0,
  true,
  1,
  '{"version": 1, "critical": [], "pages": {}}'::jsonb
FROM public.topics t
CROSS JOIN public.age_groups ag
WHERE t.slug = 'reading'
  AND ag.min_age = 4
  AND ag.max_age = 5
  AND NOT EXISTS (
    SELECT 1 FROM public.handbooks h WHERE h.slug = 'gardenOfSurprises'
  );

INSERT INTO public.handbook_pages (
  handbook_id,
  page_number,
  layout_kind,
  blocks_json,
  interactions_json,
  narration_key,
  estimated_read_sec
)
SELECT
  h.id,
  gs.n,
  'picture_book',
  '[]'::jsonb,
  '[]'::jsonb,
  'games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p' || lpad(gs.n::text, 2, '0') || '.narration',
  45
FROM public.handbooks h
CROSS JOIN generate_series(1, 12) AS gs(n)
WHERE h.slug = 'gardenOfSurprises'
  AND NOT EXISTS (
    SELECT 1
    FROM public.handbook_pages p
    WHERE p.handbook_id = h.id
      AND p.page_number = gs.n
  );

-- ---------------------------------------------------------------------------
-- games + game_levels + tag assignments (catalog)
-- ---------------------------------------------------------------------------
WITH topic AS (
  SELECT id
  FROM topics
  WHERE slug = 'reading'
  LIMIT 1
),
age_group AS (
  SELECT id
  FROM age_groups
  WHERE min_age = 4 AND max_age = 5
  LIMIT 1
),
inserted_game AS (
  INSERT INTO games (
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
    'interactiveHandbook',
    'games.interactiveHandbook.title',
    'games.interactiveHandbook.subtitle',
    'handbook_story',
    'InteractiveHandbookGame',
    3,
    4,
    NULL,
    '/audio/he/games/interactive-handbook/handbooks/garden-of-surprises/pages/p01/narration.mp3',
    true
  FROM topic, age_group
  WHERE NOT EXISTS (
    SELECT 1
    FROM games
    WHERE slug = 'interactiveHandbook'
  )
  RETURNING id
),
resolved_game AS (
  SELECT DISTINCT id FROM (
    SELECT id FROM inserted_game
    UNION ALL
    SELECT id
    FROM games
    WHERE slug = 'interactiveHandbook'
  ) g
)
INSERT INTO game_levels (
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
  '{"adaptive": true, "pages": 12, "defaultBand": "5-6", "handbookSlug": "gardenOfSurprises"}'::jsonb,
  1
FROM resolved_game
WHERE NOT EXISTS (
  SELECT 1
  FROM game_levels
  WHERE game_levels.game_id = resolved_game.id
    AND game_levels.level_number = 1
);

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'age'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'age.primary.4-5'
WHERE g.slug = 'interactiveHandbook'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'support'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'age'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug IN ('age.primary.5-6', 'age.primary.6-7')
WHERE g.slug = 'interactiveHandbook'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.topics top ON top.id = g.topic_id
JOIN public.tag_dimensions d ON d.slug = 'topic'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'topic.' || top.slug
WHERE g.slug = 'interactiveHandbook'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'difficulty'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'difficulty.' || coalesce(g.difficulty, 1)::text
WHERE g.slug = 'interactiveHandbook'
ON CONFLICT (game_id, tag_id) DO NOTHING;
