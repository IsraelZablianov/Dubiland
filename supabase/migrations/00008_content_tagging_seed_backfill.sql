-- Seed tag taxonomy + backfill assignments from legacy columns (DUB-165).
-- Pedagogy taxonomy: extend under dimension `skill` per DUB-145 / editorial workflow.
-- Spec: docs/architecture/2026-04-10-content-tagging-architecture.md
--
-- Rollback (manual — dev/staging only):
--   TRUNCATE video_tag_assignments, game_tag_assignments;
--   DELETE FROM tags;
--   DELETE FROM tag_dimensions;
--   (Only if no dependent production data.)

-- ---------------------------------------------------------------------------
-- Dimensions (idempotent)
-- ---------------------------------------------------------------------------
INSERT INTO public.tag_dimensions (slug, name_key, allows_multiple, sort_order)
VALUES
  ('age', 'tagDimensions.age', true, 1),
  ('topic', 'tagDimensions.topic', false, 2),
  ('difficulty', 'tagDimensions.difficulty', false, 3),
  ('skill', 'tagDimensions.skill', true, 4)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Tags: age.primary.* from age_groups
-- ---------------------------------------------------------------------------
INSERT INTO public.tags (dimension_id, slug, name_key, metadata_json, sort_order)
SELECT
  d.id,
  'age.primary.' || ag.min_age::text || '-' || ag.max_age::text,
  ag.label_key,
  jsonb_build_object(
    'band', ag.min_age::text || '-' || ag.max_age::text,
    'kind', 'primary'
  ),
  ag.min_age
FROM public.age_groups ag
CROSS JOIN public.tag_dimensions d
WHERE d.slug = 'age'
ON CONFLICT (dimension_id, slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Tags: topic.* from topics
-- ---------------------------------------------------------------------------
INSERT INTO public.tags (dimension_id, slug, name_key, metadata_json, sort_order)
SELECT
  d.id,
  'topic.' || top.slug,
  top.name_key,
  jsonb_build_object('topic_slug', top.slug),
  coalesce(top.sort_order, 0)
FROM public.topics top
CROSS JOIN public.tag_dimensions d
WHERE d.slug = 'topic'
ON CONFLICT (dimension_id, slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Tags: difficulty.1 .. difficulty.5
-- ---------------------------------------------------------------------------
INSERT INTO public.tags (dimension_id, slug, name_key, metadata_json, sort_order)
SELECT
  d.id,
  'difficulty.' || lvl::text,
  'tags.difficulty.' || lvl::text,
  jsonb_build_object('level', lvl),
  lvl
FROM generate_series(1, 5) AS lvl
CROSS JOIN public.tag_dimensions d
WHERE d.slug = 'difficulty'
ON CONFLICT (dimension_id, slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Backfill games → tag assignments (primary)
-- ---------------------------------------------------------------------------
INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.age_groups ag ON ag.id = g.age_group_id
JOIN public.tag_dimensions d ON d.slug = 'age'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'age.primary.' || ag.min_age::text || '-' || ag.max_age::text
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.topics top ON top.id = g.topic_id
JOIN public.tag_dimensions d ON d.slug = 'topic'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'topic.' || top.slug
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'difficulty'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'difficulty.' || coalesce(g.difficulty, 1)::text
ON CONFLICT (game_id, tag_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Backfill videos → tag assignments
-- ---------------------------------------------------------------------------
INSERT INTO public.video_tag_assignments (video_id, tag_id, assignment_role)
SELECT v.id, t.id, 'primary'
FROM public.videos v
JOIN public.age_groups ag ON ag.id = v.age_group_id
JOIN public.tag_dimensions d ON d.slug = 'age'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'age.primary.' || ag.min_age::text || '-' || ag.max_age::text
ON CONFLICT (video_id, tag_id) DO NOTHING;

INSERT INTO public.video_tag_assignments (video_id, tag_id, assignment_role)
SELECT v.id, t.id, 'primary'
FROM public.videos v
JOIN public.topics top ON top.id = v.topic_id
JOIN public.tag_dimensions d ON d.slug = 'topic'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'topic.' || top.slug
ON CONFLICT (video_id, tag_id) DO NOTHING;

-- Provisional difficulty from video_type (editorial review); stored as derived.
INSERT INTO public.video_tag_assignments (video_id, tag_id, assignment_role)
SELECT v.id, t.id, 'derived'
FROM public.videos v
JOIN public.tag_dimensions d ON d.slug = 'difficulty'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'difficulty.' || CASE v.video_type
    WHEN 'song' THEN '1'
    WHEN 'explainer' THEN '2'
    WHEN 'interactive' THEN '3'
    ELSE '2'
  END
ON CONFLICT (video_id, tag_id) DO NOTHING;
