-- DUB-373: Parent dashboard metrics — honest time windows + consecutive play streak.
-- Contract for FED: call rpc('dubiland_parent_dashboard_metrics', { p_timezone: <IANA> })
--   e.g. Intl.DateTimeFormat().resolvedOptions().timeZone. Default 'Asia/Jerusalem'.
--
-- Semantics:
--   * Learning minutes: sum of session duration per row, capped at 24h per session.
--     Duration uses COALESCE(ended_at, now()) so in-flight sessions count toward "now".
--   * today_learning_minutes: sessions whose started_at falls on the caller's local calendar day.
--   * rolling_7d_*: inclusive window of the local today and the prior 6 days (7 local dates).
--   * consecutive_play_streak_days: consecutive local dates with ≥1 session start, anchored to
--     today if active today, else yesterday (single grace day if today is empty).
--
-- Rollback (manual):
--   DROP FUNCTION IF EXISTS public.dubiland_parent_dashboard_metrics(text);
--   DROP FUNCTION IF EXISTS public.dubiland_consecutive_play_streak_days(uuid, text);

CREATE OR REPLACE FUNCTION dubiland_consecutive_play_streak_days(p_child_id uuid, p_tz text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  today_d date;
  d date;
  streak int := 0;
BEGIN
  today_d := (now() AT TIME ZONE p_tz)::date;

  IF EXISTS (
    SELECT 1
    FROM game_sessions gs
    WHERE gs.child_id = p_child_id
      AND (gs.started_at AT TIME ZONE p_tz)::date = today_d
  ) THEN
    d := today_d;
  ELSIF EXISTS (
    SELECT 1
    FROM game_sessions gs
    WHERE gs.child_id = p_child_id
      AND (gs.started_at AT TIME ZONE p_tz)::date = today_d - 1
  ) THEN
    d := today_d - 1;
  ELSE
    RETURN 0;
  END IF;

  LOOP
    IF EXISTS (
      SELECT 1
      FROM game_sessions gs
      WHERE gs.child_id = p_child_id
        AND (gs.started_at AT TIME ZONE p_tz)::date = d
    ) THEN
      streak := streak + 1;
      d := d - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN streak;
END;
$$;

COMMENT ON FUNCTION dubiland_consecutive_play_streak_days(uuid, text) IS
  'Consecutive local calendar days with play, grace through yesterday if today is empty. RLS applies.';

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
      SUM(
        LEAST(
          86400.0,
          EXTRACT(
            EPOCH FROM (COALESCE(gs.ended_at, now()) - gs.started_at)
          ) / 60.0
        )
      )::integer AS minutes,
      COUNT(*)::bigint AS session_count
    FROM game_sessions gs
    GROUP BY gs.child_id
  ) lm ON lm.child_id = c.id
  LEFT JOIN (
    SELECT
      gs.child_id,
      SUM(
        LEAST(
          86400.0,
          EXTRACT(
            EPOCH FROM (COALESCE(gs.ended_at, now()) - gs.started_at)
          ) / 60.0
        )
      )::integer AS minutes
    FROM game_sessions gs
    WHERE (gs.started_at AT TIME ZONE tz)::date = local_today
    GROUP BY gs.child_id
  ) td ON td.child_id = c.id
  LEFT JOIN (
    SELECT
      gs.child_id,
      SUM(
        LEAST(
          86400.0,
          EXTRACT(
            EPOCH FROM (COALESCE(gs.ended_at, now()) - gs.started_at)
          ) / 60.0
        )
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

COMMENT ON FUNCTION dubiland_parent_dashboard_metrics(text) IS
  'Per-child dashboard metrics for the authenticated parent: local-day today, rolling 7 local days, consecutive play streak.';

REVOKE ALL ON FUNCTION dubiland_consecutive_play_streak_days(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION dubiland_parent_dashboard_metrics(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION dubiland_consecutive_play_streak_days(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION dubiland_parent_dashboard_metrics(text) TO authenticated;
