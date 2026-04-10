-- Magic Letter Map launch-slot seed (DUB-395).
-- Depends: 00012 (handbook foundation), 00013 (interactive handbook base game seed).
--
-- Rollback (manual, dev/staging):
--   DELETE FROM public.handbook_media_assets
--   WHERE handbook_id IN (SELECT id FROM public.handbooks WHERE slug = 'magicLetterMap');
--   DELETE FROM public.handbook_pages
--   WHERE handbook_id IN (SELECT id FROM public.handbooks WHERE slug = 'magicLetterMap');
--   DELETE FROM public.handbooks WHERE slug = 'magicLetterMap';

-- ---------------------------------------------------------------------------
-- Published handbook row (age 5-6 launch slot)
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
  'magicLetterMap',
  'games.interactiveHandbook.handbooks.magicLetterMap.cover.title',
  'games.interactiveHandbook.handbooks.magicLetterMap.cover.subtitle',
  'bear',
  NULL,
  1,
  true,
  2,
  '{
    "version": 2,
    "critical": [
      "/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p01/narration.mp3",
      "/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p01/prompt.mp3",
      "/audio/he/games/interactive-handbook/handbooks/magic-letter-map/interactions/first-sound/prompt.mp3"
    ],
    "pages": {
      "p01": [
        "/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p01/narration.mp3",
        "/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p01/prompt.mp3"
      ],
      "p02": [
        "/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p02/narration.mp3",
        "/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p02/prompt.mp3"
      ],
      "p03": [
        "/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p03/narration.mp3",
        "/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p03/prompt.mp3"
      ]
    }
  }'::jsonb
FROM public.topics t
CROSS JOIN public.age_groups ag
WHERE t.slug = 'reading'
  AND ag.min_age = 5
  AND ag.max_age = 6
  AND NOT EXISTS (
    SELECT 1 FROM public.handbooks h WHERE h.slug = 'magicLetterMap'
  );

-- ---------------------------------------------------------------------------
-- Handbook pages (10-page launch-B layout)
-- ---------------------------------------------------------------------------
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
  CASE gs.n
    WHEN 2 THEN '[{"id":"firstSound","required":true}]'::jsonb
    WHEN 3 THEN '[{"id":"chooseLetter","required":true}]'::jsonb
    WHEN 5 THEN '[{"id":"simpleAdd","required":true}]'::jsonb
    WHEN 6 THEN '[{"id":"decodePointedWord","required":true}]'::jsonb
    WHEN 7 THEN '[{"id":"literalComprehension","required":true}]'::jsonb
    WHEN 8 THEN '[{"id":"sortObjects","required":false}]'::jsonb
    WHEN 10 THEN '[{"id":"recapSkill","required":true}]'::jsonb
    ELSE '[]'::jsonb
  END,
  'games.interactiveHandbook.handbooks.magicLetterMap.pages.p' || lpad(gs.n::text, 2, '0') || '.narration',
  45
FROM public.handbooks h
CROSS JOIN generate_series(1, 10) AS gs(n)
WHERE h.slug = 'magicLetterMap'
  AND NOT EXISTS (
    SELECT 1
    FROM public.handbook_pages p
    WHERE p.handbook_id = h.id
      AND p.page_number = gs.n
  );

-- ---------------------------------------------------------------------------
-- Audio media inventory (page clips + interaction clips)
-- ---------------------------------------------------------------------------
WITH target_handbook AS (
  SELECT id
  FROM public.handbooks
  WHERE slug = 'magicLetterMap'
),
page_assets AS (
  SELECT
    '/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p' || lpad(gs.n::text, 2, '0') || '/narration.mp3'
      AS storage_path,
    gs.n * 10 AS sort_order
  FROM generate_series(1, 10) AS gs(n)
  UNION ALL
  SELECT
    '/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p' || lpad(gs.n::text, 2, '0') || '/prompt.mp3'
      AS storage_path,
    gs.n * 10 + 1 AS sort_order
  FROM generate_series(1, 10) AS gs(n)
),
interaction_slugs AS (
  SELECT *
  FROM (VALUES
    ('first-sound'),
    ('choose-letter'),
    ('simple-add'),
    ('decode-pointed-word'),
    ('literal-comprehension'),
    ('sort-objects'),
    ('recap-skill')
  ) AS v(interaction_slug)
),
interaction_fields AS (
  SELECT *
  FROM (VALUES
    ('prompt', 0),
    ('hint', 1),
    ('success', 2),
    ('retry', 3)
  ) AS v(field_name, field_sort)
),
interaction_assets AS (
  SELECT
    '/audio/he/games/interactive-handbook/handbooks/magic-letter-map/interactions/'
      || i.interaction_slug
      || '/'
      || f.field_name
      || '.mp3' AS storage_path,
    200 + row_number() OVER (ORDER BY i.interaction_slug, f.field_sort) AS sort_order
  FROM interaction_slugs i
  CROSS JOIN interaction_fields f
),
all_assets AS (
  SELECT storage_path, sort_order FROM page_assets
  UNION ALL
  SELECT storage_path, sort_order FROM interaction_assets
)
INSERT INTO public.handbook_media_assets (
  handbook_id,
  storage_path,
  kind,
  mime_type,
  sort_order
)
SELECT
  h.id,
  a.storage_path,
  'audio',
  'audio/mpeg',
  a.sort_order
FROM target_handbook h
CROSS JOIN all_assets a
ON CONFLICT (handbook_id, storage_path) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Point the interactive handbook catalog row to this launch slot
-- ---------------------------------------------------------------------------
UPDATE public.games
SET audio_url = '/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p01/narration.mp3'
WHERE slug = 'interactiveHandbook';

UPDATE public.game_levels gl
SET config_json = gl.config_json || jsonb_build_object(
  'adaptive', true,
  'pages', 10,
  'defaultBand', '5-6',
  'handbookSlug', 'magicLetterMap'
)
WHERE gl.level_number = 1
  AND EXISTS (
    SELECT 1
    FROM public.games g
    WHERE g.id = gl.game_id
      AND g.slug = 'interactiveHandbook'
  );
