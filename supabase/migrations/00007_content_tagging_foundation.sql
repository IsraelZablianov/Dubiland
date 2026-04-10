-- Content tagging foundation (DUB-165): normalized tags + RLS + catalog RPC.
-- Spec: docs/architecture/2026-04-10-content-tagging-architecture.md
--
-- Rollback (manual — dev/staging only):
--   DROP FUNCTION IF EXISTS public.dubiland_catalog_for_child(uuid, text[], text, text, int, int);
--   DROP FUNCTION IF EXISTS public.dubiland_child_age_band(uuid);
--   DROP VIEW IF EXISTS public.video_tags_expanded;
--   DROP VIEW IF EXISTS public.game_tags_expanded;
--   DROP TABLE IF EXISTS public.video_tag_assignments;
--   DROP TABLE IF EXISTS public.game_tag_assignments;
--   DROP TABLE IF EXISTS public.tags;
--   DROP TABLE IF EXISTS public.tag_dimensions;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------
CREATE TABLE public.tag_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_key TEXT NOT NULL,
  allows_multiple BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id UUID NOT NULL REFERENCES public.tag_dimensions (id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name_key TEXT NOT NULL,
  description_key TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dimension_id, slug)
);

CREATE INDEX tags_dimension_sort_idx ON public.tags (dimension_id, sort_order);

CREATE TABLE public.game_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games (id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags (id) ON DELETE CASCADE,
  assignment_role TEXT NOT NULL CHECK (assignment_role IN ('primary', 'support', 'derived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, tag_id)
);

CREATE INDEX game_tag_assignments_game_id_idx ON public.game_tag_assignments (game_id);
CREATE INDEX game_tag_assignments_tag_id_idx ON public.game_tag_assignments (tag_id);

CREATE TABLE public.video_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.videos (id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags (id) ON DELETE CASCADE,
  assignment_role TEXT NOT NULL CHECK (assignment_role IN ('primary', 'support', 'derived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (video_id, tag_id)
);

CREATE INDEX video_tag_assignments_video_id_idx ON public.video_tag_assignments (video_id);
CREATE INDEX video_tag_assignments_tag_id_idx ON public.video_tag_assignments (tag_id);

-- ---------------------------------------------------------------------------
-- Expanded views (catalog / debugging)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.game_tags_expanded AS
SELECT
  gta.game_id AS content_id,
  'game'::text AS content_type,
  t.slug AS tag_slug,
  d.slug AS dimension_slug,
  gta.assignment_role
FROM public.game_tag_assignments gta
JOIN public.tags t ON t.id = gta.tag_id
JOIN public.tag_dimensions d ON d.id = t.dimension_id;

CREATE OR REPLACE VIEW public.video_tags_expanded AS
SELECT
  vta.video_id AS content_id,
  'video'::text AS content_type,
  t.slug AS tag_slug,
  d.slug AS dimension_slug,
  vta.assignment_role
FROM public.video_tag_assignments vta
JOIN public.tags t ON t.id = vta.tag_id
JOIN public.tag_dimensions d ON d.id = t.dimension_id;

-- ---------------------------------------------------------------------------
-- RLS: reference + assignment visibility
-- ---------------------------------------------------------------------------
ALTER TABLE public.tag_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tag_dimensions_public_select" ON public.tag_dimensions
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "tags_public_select_active" ON public.tags
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "game_tag_assignments_public_select_published" ON public.game_tag_assignments
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = game_tag_assignments.game_id AND g.is_published = true
    )
  );

CREATE POLICY "video_tag_assignments_public_select_published" ON public.video_tag_assignments
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = video_tag_assignments.video_id AND v.is_published = true
    )
  );

GRANT SELECT ON public.tag_dimensions TO anon, authenticated;
GRANT SELECT ON public.tags TO anon, authenticated;
GRANT SELECT ON public.game_tag_assignments TO anon, authenticated;
GRANT SELECT ON public.video_tag_assignments TO anon, authenticated;
GRANT SELECT ON public.game_tags_expanded TO anon, authenticated;
GRANT SELECT ON public.video_tags_expanded TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Age band helper (for catalog ordering / filtering)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dubiland_child_age_band(p_child_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH c AS (
    SELECT birth_date FROM public.children WHERE id = p_child_id
  ),
  yrs AS (
    SELECT
      CASE
        WHEN c.birth_date IS NULL THEN 3
        ELSE GREATEST(
          0,
          date_part('year', age (current_date, c.birth_date))::int
        )
      END AS y
    FROM c
  ),
  pick AS (
    SELECT ag.min_age, ag.max_age
    FROM yrs
    JOIN public.age_groups ag ON yrs.y >= ag.min_age AND yrs.y <= ag.max_age
    ORDER BY ag.min_age DESC
    LIMIT 1
  )
  SELECT
    CASE
      WHEN EXISTS (SELECT 1 FROM pick) THEN
        (SELECT pick.min_age::text || '-' || pick.max_age::text FROM pick)
      ELSE '3-4'
    END;
$$;

COMMENT ON FUNCTION public.dubiland_child_age_band(uuid) IS
  'Maps child birth_date to canonical age band string (e.g. 3-4). Default 3-4 if unknown.';

-- ---------------------------------------------------------------------------
-- Catalog RPC: profile / manual age band + primary-before-support ranking
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dubiland_catalog_for_child(
  p_child_id uuid,
  p_content_types text[] DEFAULT ARRAY['game', 'video']::text[],
  p_topic_slug text DEFAULT NULL,
  p_age_band text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  content_type text,
  content_id uuid,
  slug text,
  name_key text,
  description_key text,
  topic_slug text,
  difficulty_level int,
  primary_age_band text,
  support_age_bands text[],
  age_match_kind text,
  age_match_rank int,
  sort_order int,
  thumbnail_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH authorized AS (
    SELECT 1
    FROM public.children c
    JOIN public.families f ON f.id = c.family_id
    WHERE c.id = p_child_id
      AND f.auth_user_id = (SELECT auth.uid())
  ),
  params AS (
    SELECT
      public.dubiland_child_age_band(p_child_id) AS profile_band,
      (lower(btrim(coalesce(p_age_band, ''))) = 'all') AS show_all_ages,
      CASE
        WHEN lower(btrim(coalesce(p_age_band, ''))) = 'all' THEN NULL::text
        WHEN btrim(coalesce(p_age_band, '')) = '' THEN public.dubiland_child_age_band(p_child_id)
        ELSE btrim(p_age_band)
      END AS filter_band
  ),
  game_age AS (
    SELECT
      g.id AS game_id,
      max(t.metadata_json ->> 'band') FILTER (
        WHERE gta.assignment_role = 'primary' AND d.slug = 'age'
      ) AS primary_band,
      coalesce(
        array_agg(DISTINCT (t.metadata_json ->> 'band')) FILTER (
          WHERE gta.assignment_role = 'support'
            AND d.slug = 'age'
            AND (t.metadata_json ->> 'band') IS NOT NULL
        ),
        ARRAY[]::text[]
      ) AS support_bands
    FROM public.games g
    INNER JOIN authorized ON true
    LEFT JOIN public.game_tag_assignments gta ON gta.game_id = g.id
    LEFT JOIN public.tags t ON t.id = gta.tag_id AND t.is_active = true
    LEFT JOIN public.tag_dimensions d ON d.id = t.dimension_id
    WHERE g.is_published = true
      AND ('game'::text = ANY (p_content_types))
    GROUP BY g.id
  ),
  game_diff AS (
    SELECT DISTINCT ON (g.id)
      g.id AS game_id,
      coalesce(
        (t.metadata_json ->> 'level')::int,
        g.difficulty,
        1
      )::int AS difficulty_level
    FROM public.games g
    INNER JOIN authorized ON true
    LEFT JOIN public.game_tag_assignments gta ON gta.game_id = g.id
      AND gta.assignment_role IN ('primary', 'derived')
    LEFT JOIN public.tags t ON t.id = gta.tag_id AND t.is_active = true
    LEFT JOIN public.tag_dimensions d ON d.id = t.dimension_id AND d.slug = 'difficulty'
    WHERE g.is_published = true
      AND ('game'::text = ANY (p_content_types))
    ORDER BY g.id, (gta.assignment_role = 'primary') DESC, gta.id NULLS LAST
  ),
  game_rows AS (
    SELECT
      'game'::text AS content_type,
      g.id AS content_id,
      g.slug,
      g.name_key,
      g.description_key,
      top.slug AS topic_slug,
      gd.difficulty_level,
      coalesce(ga.primary_band, ag.min_age::text || '-' || ag.max_age::text) AS primary_age_band,
      coalesce(ga.support_bands, ARRAY[]::text[]) AS support_age_bands,
      CASE
        WHEN (SELECT show_all_ages FROM params) THEN
          CASE
            WHEN coalesce(ga.primary_band, ag.min_age::text || '-' || ag.max_age::text) = (SELECT profile_band FROM params) THEN 'primary'
            WHEN (SELECT profile_band FROM params) = ANY (coalesce(ga.support_bands, ARRAY[]::text[])) THEN 'support'
            ELSE 'none'
          END
        WHEN coalesce(ga.primary_band, ag.min_age::text || '-' || ag.max_age::text) = (SELECT filter_band FROM params) THEN 'primary'
        WHEN (SELECT filter_band FROM params) = ANY (coalesce(ga.support_bands, ARRAY[]::text[])) THEN 'support'
        ELSE 'none'
      END AS age_match_kind,
      CASE
        WHEN (SELECT show_all_ages FROM params) THEN
          CASE
            WHEN coalesce(ga.primary_band, ag.min_age::text || '-' || ag.max_age::text) = (SELECT profile_band FROM params) THEN 1
            WHEN (SELECT profile_band FROM params) = ANY (coalesce(ga.support_bands, ARRAY[]::text[])) THEN 2
            ELSE 3
          END
        WHEN coalesce(ga.primary_band, ag.min_age::text || '-' || ag.max_age::text) = (SELECT filter_band FROM params) THEN 1
        WHEN (SELECT filter_band FROM params) = ANY (coalesce(ga.support_bands, ARRAY[]::text[])) THEN 2
        ELSE 3
      END AS age_match_rank,
      coalesce(g.sort_order, 0) AS sort_order,
      g.thumbnail_url
    FROM public.games g
    JOIN public.age_groups ag ON ag.id = g.age_group_id
    JOIN public.topics top ON top.id = g.topic_id
    LEFT JOIN game_age ga ON ga.game_id = g.id
    LEFT JOIN game_diff gd ON gd.game_id = g.id
    WHERE g.is_published = true
      AND EXISTS (SELECT 1 FROM authorized)
      AND ('game'::text = ANY (p_content_types))
      AND (p_topic_slug IS NULL OR btrim(p_topic_slug) = '' OR top.slug = p_topic_slug)
      AND (
        (SELECT show_all_ages FROM params)
        OR coalesce(ga.primary_band, ag.min_age::text || '-' || ag.max_age::text) = (SELECT filter_band FROM params)
        OR (SELECT filter_band FROM params) = ANY (coalesce(ga.support_bands, ARRAY[]::text[]))
      )
  ),
  video_age AS (
    SELECT
      v.id AS video_id,
      max(t.metadata_json ->> 'band') FILTER (
        WHERE vta.assignment_role = 'primary' AND d.slug = 'age'
      ) AS primary_band,
      coalesce(
        array_agg(DISTINCT (t.metadata_json ->> 'band')) FILTER (
          WHERE vta.assignment_role = 'support'
            AND d.slug = 'age'
            AND (t.metadata_json ->> 'band') IS NOT NULL
        ),
        ARRAY[]::text[]
      ) AS support_bands
    FROM public.videos v
    INNER JOIN authorized ON true
    LEFT JOIN public.video_tag_assignments vta ON vta.video_id = v.id
    LEFT JOIN public.tags t ON t.id = vta.tag_id AND t.is_active = true
    LEFT JOIN public.tag_dimensions d ON d.id = t.dimension_id
    WHERE v.is_published = true
      AND ('video'::text = ANY (p_content_types))
    GROUP BY v.id
  ),
  video_diff AS (
    SELECT DISTINCT ON (v.id)
      v.id AS video_id,
      coalesce((t.metadata_json ->> 'level')::int, 2)::int AS difficulty_level
    FROM public.videos v
    INNER JOIN authorized ON true
    LEFT JOIN public.video_tag_assignments vta ON vta.video_id = v.id
      AND vta.assignment_role IN ('primary', 'derived')
    LEFT JOIN public.tags t ON t.id = vta.tag_id AND t.is_active = true
    LEFT JOIN public.tag_dimensions d ON d.id = t.dimension_id AND d.slug = 'difficulty'
    WHERE v.is_published = true
      AND ('video'::text = ANY (p_content_types))
    ORDER BY v.id, (vta.assignment_role = 'primary') DESC, vta.id NULLS LAST
  ),
  video_rows AS (
    SELECT
      'video'::text AS content_type,
      v.id AS content_id,
      NULL::text AS slug,
      v.name_key,
      v.description_key,
      top.slug AS topic_slug,
      vd.difficulty_level,
      coalesce(va.primary_band, ag.min_age::text || '-' || ag.max_age::text) AS primary_age_band,
      coalesce(va.support_bands, ARRAY[]::text[]) AS support_age_bands,
      CASE
        WHEN (SELECT show_all_ages FROM params) THEN
          CASE
            WHEN coalesce(va.primary_band, ag.min_age::text || '-' || ag.max_age::text) = (SELECT profile_band FROM params) THEN 'primary'
            WHEN (SELECT profile_band FROM params) = ANY (coalesce(va.support_bands, ARRAY[]::text[])) THEN 'support'
            ELSE 'none'
          END
        WHEN coalesce(va.primary_band, ag.min_age::text || '-' || ag.max_age::text) = (SELECT filter_band FROM params) THEN 'primary'
        WHEN (SELECT filter_band FROM params) = ANY (coalesce(va.support_bands, ARRAY[]::text[])) THEN 'support'
        ELSE 'none'
      END AS age_match_kind,
      CASE
        WHEN (SELECT show_all_ages FROM params) THEN
          CASE
            WHEN coalesce(va.primary_band, ag.min_age::text || '-' || ag.max_age::text) = (SELECT profile_band FROM params) THEN 1
            WHEN (SELECT profile_band FROM params) = ANY (coalesce(va.support_bands, ARRAY[]::text[])) THEN 2
            ELSE 3
          END
        WHEN coalesce(va.primary_band, ag.min_age::text || '-' || ag.max_age::text) = (SELECT filter_band FROM params) THEN 1
        WHEN (SELECT filter_band FROM params) = ANY (coalesce(va.support_bands, ARRAY[]::text[])) THEN 2
        ELSE 3
      END AS age_match_rank,
      coalesce(v.sort_order, 0) AS sort_order,
      v.thumbnail_url
    FROM public.videos v
    JOIN public.age_groups ag ON ag.id = v.age_group_id
    JOIN public.topics top ON top.id = v.topic_id
    LEFT JOIN video_age va ON va.video_id = v.id
    LEFT JOIN video_diff vd ON vd.video_id = v.id
    WHERE v.is_published = true
      AND EXISTS (SELECT 1 FROM authorized)
      AND ('video'::text = ANY (p_content_types))
      AND (p_topic_slug IS NULL OR btrim(p_topic_slug) = '' OR top.slug = p_topic_slug)
      AND (
        (SELECT show_all_ages FROM params)
        OR coalesce(va.primary_band, ag.min_age::text || '-' || ag.max_age::text) = (SELECT filter_band FROM params)
        OR (SELECT filter_band FROM params) = ANY (coalesce(va.support_bands, ARRAY[]::text[]))
      )
  ),
  combined AS (
    SELECT * FROM game_rows
    UNION ALL
    SELECT * FROM video_rows
  )
  SELECT
    c.content_type,
    c.content_id,
    c.slug,
    c.name_key,
    c.description_key,
    c.topic_slug,
    c.difficulty_level,
    c.primary_age_band,
    c.support_age_bands,
    c.age_match_kind,
    c.age_match_rank,
    c.sort_order,
    c.thumbnail_url
  FROM combined c
  ORDER BY c.age_match_rank ASC, c.sort_order ASC, c.content_type ASC, c.name_key ASC
  LIMIT greatest(0, least(p_limit, 200))
  OFFSET greatest(0, p_offset);
$$;

COMMENT ON FUNCTION public.dubiland_catalog_for_child(uuid, text[], text, text, int, int) IS
  'Published catalog for a parent-owned child: age filter/ordering (profile, manual band, or all), optional topic, primary-before-support ranking.';

-- Not exposed to clients: would leak approximate age for arbitrary child IDs.
REVOKE ALL ON FUNCTION public.dubiland_child_age_band(uuid) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.dubiland_catalog_for_child(uuid, text[], text, text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dubiland_catalog_for_child(uuid, text[], text, text, int, int) TO authenticated;
