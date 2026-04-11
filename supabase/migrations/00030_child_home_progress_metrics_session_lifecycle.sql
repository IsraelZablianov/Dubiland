-- DUB-712: Home child progress read-model + session end timestamps from attempt path.
--
-- 1) RPC `dubiland_child_home_progress_metrics` — one round-trip for home shell metrics
--    (today minutes uses COALESCE(ended_at, now()) like dubiland_parent_dashboard_metrics).
--    SECURITY INVOKER: only returns a row when p_child_id belongs to auth.uid()'s family.
--    No new tables/views; no separate RLS objects beyond function grants.
--
-- 2) Document session lifecycle: callers should send optional sessionEndedAt from
--    submit-game-attempt; server bumps ended_at with GREATEST semantics (see Edge Function).
--
-- Rollback (manual):
--   DROP FUNCTION IF EXISTS public.dubiland_child_home_progress_metrics(uuid, text);

CREATE OR REPLACE FUNCTION dubiland_child_home_progress_metrics(
  p_child_id uuid,
  p_timezone text DEFAULT 'Asia/Jerusalem'
)
RETURNS TABLE (
  child_id uuid,
  today_learning_minutes integer,
  topic_progress jsonb,
  game_progress_by_slug jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  tz text;
  local_today date;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM children c
    JOIN families f ON f.id = c.family_id
    WHERE c.id = p_child_id
      AND f.auth_user_id = (SELECT auth.uid())
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = p_timezone) THEN
    tz := p_timezone;
  ELSE
    tz := 'Asia/Jerusalem';
  END IF;

  local_today := (now() AT TIME ZONE tz)::date;

  RETURN QUERY
  WITH td AS (
    SELECT
      COALESCE(
        SUM(
          LEAST(
            86400.0,
            EXTRACT(
              EPOCH FROM (COALESCE(gs.ended_at, now()) - gs.started_at)
            ) / 60.0
          )
        ),
        0
      )::integer AS minutes
    FROM game_sessions gs
    WHERE gs.child_id = p_child_id
      AND (gs.started_at AT TIME ZONE tz)::date = local_today
  ),
  topic_rows AS (
    SELECT
      t.slug::text AS slug,
      CASE
        WHEN COALESCE(c.pub_cnt, 0) > 0 THEN
          LEAST(
            100,
            GREATEST(
              0,
              ROUND((100.0 * COALESCE(c.star_sum, 0)) / (c.pub_cnt * 3))::integer
            )
          )
        ELSE 0
      END AS prog,
      CASE t.slug::text
        WHEN 'math' THEN 1
        WHEN 'letters' THEN 2
        WHEN 'reading' THEN 3
        ELSE 9
      END AS ord
    FROM topics t
    LEFT JOIN (
      SELECT
        g.topic_id,
        COUNT(*)::integer AS pub_cnt,
        COALESCE(SUM(s.best_stars), 0)::numeric AS star_sum
      FROM games g
      LEFT JOIN child_game_summaries s
        ON s.game_id = g.id
        AND s.child_id = p_child_id
      WHERE g.is_published = true
      GROUP BY g.topic_id
    ) c ON c.topic_id = t.id
    WHERE t.slug::text IN ('math', 'letters', 'reading')
  ),
  topic_progress AS (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object('slug', slug, 'progress', prog)
        ORDER BY ord
      ),
      '[]'::jsonb
    ) AS j
    FROM topic_rows
  ),
  game_progress AS (
    SELECT COALESCE(
      (
        SELECT jsonb_object_agg(slug, max_prog)
        FROM (
          SELECT
            g.slug::text AS slug,
            MAX(
              LEAST(
                100,
                GREATEST(
                  0,
                  ROUND((100.0 * COALESCE(s.best_stars, 0)) / 3)::integer
                )
              )
            ) AS max_prog
          FROM games g
          LEFT JOIN child_game_summaries s
            ON s.game_id = g.id
            AND s.child_id = p_child_id
          WHERE g.is_published = true
          GROUP BY g.slug
        ) z
      ),
      '{}'::jsonb
    ) AS j
  )
  SELECT
    p_child_id,
    td.minutes,
    tp.j,
    gp.j
  FROM td
  CROSS JOIN topic_progress tp
  CROSS JOIN game_progress gp;
END;
$$;

COMMENT ON FUNCTION dubiland_child_home_progress_metrics(uuid, text) IS
  'Single-child home metrics: local-calendar today minutes (open sessions count to now), topic + per-game star progress. Family scoped via children/families; SECURITY INVOKER.';

REVOKE ALL ON FUNCTION dubiland_child_home_progress_metrics(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION dubiland_child_home_progress_metrics(uuid, text) TO authenticated;
