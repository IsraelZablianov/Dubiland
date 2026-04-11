-- Partial sessions (< 1 minute) were truncated to 0 learning minutes because metrics RPCs
-- summed (duration_seconds / 60) then cast to integer, flooring sub-minute play.
-- Use CEIL(total_session_seconds / 60) so short games still credit toward daily goals.

CREATE OR REPLACE FUNCTION dubiland_parent_dashboard_metrics(p_timezone text DEFAULT 'Asia/Jerusalem')
RETURNS TABLE (
  child_id uuid,
  lifetime_learning_minutes integer,
  today_learning_minutes integer,
  rolling_7d_learning_minutes integer,
  rolling_7d_active_days integer,
  consecutive_play_streak_days integer,
  lifetime_session_count bigint,
  rolling_7d_session_count bigint,
  best_stars_across_games integer
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
  IF EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = p_timezone) THEN
    tz := p_timezone;
  ELSE
    tz := 'Asia/Jerusalem';
  END IF;

  local_today := (now() AT TIME ZONE tz)::date;

  RETURN QUERY
  SELECT
    c.id AS child_id,
    COALESCE(lm.minutes, 0)::integer AS lifetime_learning_minutes,
    COALESCE(td.minutes, 0)::integer AS today_learning_minutes,
    COALESCE(wk.minutes, 0)::integer AS rolling_7d_learning_minutes,
    COALESCE(wk.active_days, 0)::integer AS rolling_7d_active_days,
    dubiland_consecutive_play_streak_days(c.id, tz) AS consecutive_play_streak_days,
    COALESCE(lm.session_count, 0::bigint) AS lifetime_session_count,
    COALESCE(wk.session_count, 0::bigint) AS rolling_7d_session_count,
    COALESCE(st.best_stars, 0)::integer AS best_stars_across_games
  FROM children c
  JOIN families f ON f.id = c.family_id
  LEFT JOIN (
    SELECT
      gs.child_id,
      CEIL(
        SUM(
          LEAST(
            (86400 * 60)::numeric,
            GREATEST(0::numeric, EXTRACT(EPOCH FROM (COALESCE(gs.ended_at, now()) - gs.started_at)))
          )
        ) / 60.0
      )::integer AS minutes,
      COUNT(*)::bigint AS session_count
    FROM game_sessions gs
    GROUP BY gs.child_id
  ) lm ON lm.child_id = c.id
  LEFT JOIN (
    SELECT
      gs.child_id,
      CEIL(
        SUM(
          LEAST(
            (86400 * 60)::numeric,
            GREATEST(0::numeric, EXTRACT(EPOCH FROM (COALESCE(gs.ended_at, now()) - gs.started_at)))
          )
        ) / 60.0
      )::integer AS minutes
    FROM game_sessions gs
    WHERE (gs.started_at AT TIME ZONE tz)::date = local_today
    GROUP BY gs.child_id
  ) td ON td.child_id = c.id
  LEFT JOIN (
    SELECT
      gs.child_id,
      CEIL(
        SUM(
          LEAST(
            (86400 * 60)::numeric,
            GREATEST(0::numeric, EXTRACT(EPOCH FROM (COALESCE(gs.ended_at, now()) - gs.started_at)))
          )
        ) / 60.0
      )::integer AS minutes,
      COUNT(*)::bigint AS session_count,
      COUNT(DISTINCT (gs.started_at AT TIME ZONE tz)::date)::integer AS active_days
    FROM game_sessions gs
    WHERE (gs.started_at AT TIME ZONE tz)::date >= local_today - 6
      AND (gs.started_at AT TIME ZONE tz)::date <= local_today
    GROUP BY gs.child_id
  ) wk ON wk.child_id = c.id
  LEFT JOIN (
    SELECT
      s.child_id,
      MAX(s.best_stars)::integer AS best_stars
    FROM child_game_summaries s
    GROUP BY s.child_id
  ) st ON st.child_id = c.id
  WHERE f.auth_user_id = (SELECT auth.uid())
  ORDER BY c.created_at ASC;
END;
$$;

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
        CEIL(
          SUM(
            LEAST(
              (86400 * 60)::numeric,
              GREATEST(0::numeric, EXTRACT(EPOCH FROM (COALESCE(gs.ended_at, now()) - gs.started_at)))
            )
          ) / 60.0
        )::integer,
        0
      ) AS minutes
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

COMMENT ON FUNCTION dubiland_parent_dashboard_metrics(text) IS
  'Parent dashboard metrics; learning minutes use CEIL(sum_seconds/60) so sessions under 1 minute still count.';

COMMENT ON FUNCTION dubiland_child_home_progress_metrics(uuid, text) IS
  'Single-child home metrics; today minutes use CEIL(sum_seconds/60) for partial sessions.';
