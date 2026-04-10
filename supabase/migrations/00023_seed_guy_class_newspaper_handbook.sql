-- Book 9 handbook seed: Guy and the Class Newspaper (DUB-450).
-- Depends: 00012 (handbook schema), 00022 (current interactiveHandbook ladder alignment).
--
-- Rollback (manual):
--   DELETE FROM public.handbook_media_assets
--   WHERE handbook_id IN (SELECT id FROM public.handbooks WHERE slug = 'guyClassNewspaper');
--   DELETE FROM public.handbook_pages
--   WHERE handbook_id IN (SELECT id FROM public.handbooks WHERE slug = 'guyClassNewspaper');
--   DELETE FROM public.handbooks WHERE slug = 'guyClassNewspaper';
--   UPDATE public.game_levels AS gl
--   SET config_json = jsonb_set(
--     COALESCE(gl.config_json, '{}'::jsonb),
--     ARRAY['readingLadder', 'orderedBookIds'],
--     to_jsonb(ARRAY['book1', 'book4', 'book6', 'book7', 'book10']::text[]),
--     true
--   )
--   FROM public.games AS g
--   WHERE g.id = gl.game_id AND g.slug = 'interactiveHandbook' AND gl.level_number = 1;
--   UPDATE public.game_levels AS gl
--   SET config_json = (COALESCE(gl.config_json, '{}'::jsonb) #- ARRAY['readingLadder', 'books', 'book9'])
--   FROM public.games AS g
--   WHERE g.id = gl.game_id AND g.slug = 'interactiveHandbook' AND gl.level_number = 1;

-- ---------------------------------------------------------------------------
-- Published handbook row (age 6-7)
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
  'guyClassNewspaper',
  'handbooks.guyClassNewspaper.meta.title',
  'handbooks.guyClassNewspaper.meta.subtitle',
  'bear',
  NULL,
  40,
  true,
  1,
  '{
    "version": 1,
    "critical": [
      "/audio/he/handbooks/guy-class-newspaper/meta/title.mp3",
      "/audio/he/handbooks/guy-class-newspaper/script-package/narration/intro.mp3",
      "/audio/he/handbooks/guy-class-newspaper/interactions/headline-match/prompt.mp3"
    ],
    "pages": {
      "p01": [
        "/audio/he/handbooks/guy-class-newspaper/sentence-bank/pointed-phrases/p01.mp3"
      ],
      "p02": [
        "/audio/he/handbooks/guy-class-newspaper/sentence-bank/pointed-phrases/p02.mp3",
        "/audio/he/handbooks/guy-class-newspaper/interactions/headline-match/prompt.mp3"
      ],
      "p03": [
        "/audio/he/handbooks/guy-class-newspaper/sentence-bank/pointed-phrases/p03.mp3",
        "/audio/he/handbooks/guy-class-newspaper/interactions/find-fact/prompt.mp3"
      ]
    }
  }'::jsonb
FROM public.topics t
CROSS JOIN public.age_groups ag
WHERE t.slug = 'reading'
  AND ag.min_age = 6
  AND ag.max_age = 7
  AND NOT EXISTS (
    SELECT 1 FROM public.handbooks h WHERE h.slug = 'guyClassNewspaper'
  );

-- ---------------------------------------------------------------------------
-- Handbook pages (12 pages with action-triggered checkpoints)
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
    WHEN 2 THEN '[{"id":"headlineMatch","required":true}]'::jsonb
    WHEN 3 THEN '[{"id":"findFact","required":true}]'::jsonb
    WHEN 4 THEN '[{"id":"orderSections","required":true}]'::jsonb
    WHEN 5 THEN '[{"id":"twoSentenceRead","required":false}]'::jsonb
    WHEN 6 THEN '[{"id":"strategyPrompt","required":false}]'::jsonb
    WHEN 7 THEN '[{"id":"literalChoice","required":true}]'::jsonb
    WHEN 8 THEN '[{"id":"eventSequence","required":true}]'::jsonb
    WHEN 9 THEN '[{"id":"anchoredInference","required":true}]'::jsonb
    WHEN 10 THEN '[{"id":"tapEvidence","required":true}]'::jsonb
    WHEN 11 THEN '[{"id":"headlineCheckFinal","required":true}]'::jsonb
    WHEN 12 THEN '[{"id":"recapChoice","required":true}]'::jsonb
    ELSE '[]'::jsonb
  END,
  'handbooks.guyClassNewspaper.sentenceBank.pointedPhrases.p' || lpad(gs.n::text, 2, '0'),
  48
FROM public.handbooks h
CROSS JOIN generate_series(1, 12) AS gs(n)
WHERE h.slug = 'guyClassNewspaper'
  AND NOT EXISTS (
    SELECT 1
    FROM public.handbook_pages p
    WHERE p.handbook_id = h.id
      AND p.page_number = gs.n
  );

-- ---------------------------------------------------------------------------
-- Audio media inventory
-- ---------------------------------------------------------------------------
WITH target_handbook AS (
  SELECT id
  FROM public.handbooks
  WHERE slug = 'guyClassNewspaper'
),
meta_assets AS (
  SELECT *
  FROM (VALUES
    ('/audio/he/handbooks/guy-class-newspaper/meta/title.mp3', 1),
    ('/audio/he/handbooks/guy-class-newspaper/meta/subtitle.mp3', 2),
    ('/audio/he/handbooks/guy-class-newspaper/meta/estimated-duration.mp3', 3)
  ) AS v(storage_path, sort_order)
),
page_assets AS (
  SELECT
    '/audio/he/handbooks/guy-class-newspaper/sentence-bank/pointed-phrases/p' || lpad(gs.n::text, 2, '0') || '.mp3'
      AS storage_path,
    20 + gs.n AS sort_order
  FROM generate_series(1, 12) AS gs(n)
),
narration_assets AS (
  SELECT *
  FROM (VALUES
    ('/audio/he/handbooks/guy-class-newspaper/script-package/narration/intro.mp3', 80),
    ('/audio/he/handbooks/guy-class-newspaper/script-package/narration/checkpoint.mp3', 81),
    ('/audio/he/handbooks/guy-class-newspaper/script-package/narration/transition.mp3', 82),
    ('/audio/he/handbooks/guy-class-newspaper/script-package/narration/outro.mp3', 83)
  ) AS v(storage_path, sort_order)
),
interaction_slugs AS (
  SELECT *
  FROM (VALUES
    ('headline-match'),
    ('find-fact'),
    ('order-sections'),
    ('two-sentence-read'),
    ('strategy-prompt'),
    ('literal-choice'),
    ('event-sequence'),
    ('anchored-inference'),
    ('tap-evidence'),
    ('headline-check-final'),
    ('recap-choice')
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
    '/audio/he/handbooks/guy-class-newspaper/interactions/'
      || i.interaction_slug
      || '/'
      || f.field_name
      || '.mp3' AS storage_path,
    120 + row_number() OVER (ORDER BY i.interaction_slug, f.field_sort) AS sort_order
  FROM interaction_slugs i
  CROSS JOIN interaction_fields f
),
all_assets AS (
  SELECT storage_path, sort_order FROM meta_assets
  UNION ALL
  SELECT storage_path, sort_order FROM page_assets
  UNION ALL
  SELECT storage_path, sort_order FROM narration_assets
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
-- Ladder config alignment: register book9 in interactive handbook metadata
-- ---------------------------------------------------------------------------
UPDATE public.game_levels AS gl
SET config_json = jsonb_set(
  jsonb_set(
    COALESCE(gl.config_json, '{}'::jsonb),
    ARRAY['readingLadder', 'orderedBookIds'],
    to_jsonb(ARRAY['book1', 'book4', 'book6', 'book7', 'book9', 'book10']::text[]),
    true
  ),
  ARRAY['readingLadder', 'books', 'book9'],
  '{
    "ageBand": "6-7",
    "handbookSlug": "guyClassNewspaper",
    "checkpointFocus": "paragraph_fact_inference"
  }'::jsonb,
  true
)
FROM public.games AS g
WHERE g.id = gl.game_id
  AND g.slug = 'interactiveHandbook'
  AND gl.level_number = 1;
