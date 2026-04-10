-- DUB-603 / DUB-575: Parent metrics V1 — curriculum comparability read model + RPC.
-- See docs/architecture/2026-04-10-parent-dashboard-metric-contract.md
--
-- Rollback (manual):
--   DROP FUNCTION IF EXISTS public.dubiland_parent_dashboard_curriculum_metrics(text);
--   DROP VIEW IF EXISTS public.dubiland_parent_metrics_latest_v1;
--   DROP INDEX IF EXISTS public.idx_game_attempts_parent_metrics_v1_child_created;

-- ---------------------------------------------------------------------------
-- Partial index: attempts that carry normalized parentMetricsV1 (query hot path)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_game_attempts_parent_metrics_v1_child_created
  ON public.game_attempts (child_id, created_at DESC, updated_at DESC)
  WHERE payload ? 'parentMetricsV1'
    AND (payload->'parentMetricsV1'->>'contractVersion') = 'parent-metrics.v1';

-- ---------------------------------------------------------------------------
-- View: latest parentMetricsV1 snapshot per (child, domain)
-- security_invoker: enforce game_attempts RLS for the caller
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.dubiland_parent_metrics_latest_v1
WITH (security_invoker = true) AS
SELECT DISTINCT ON (
  ga.child_id,
  (ga.payload->'parentMetricsV1'->>'domain')
)
  ga.child_id,
  (ga.payload->'parentMetricsV1'->>'domain') AS domain,
  (ga.payload->'parentMetricsV1'->>'skillKey') AS skill_key,
  CASE
    WHEN (ga.payload->'parentMetricsV1'->>'accuracyPct') ~ '^[0-9]+(\.[0-9]+)?$'
    THEN (ga.payload->'parentMetricsV1'->>'accuracyPct')::numeric
    ELSE NULL
  END AS accuracy_pct,
  (ga.payload->'parentMetricsV1'->>'hintTrend') AS hint_trend,
  (ga.payload->'parentMetricsV1'->>'independenceTrend') AS independence_trend,
  (ga.payload->'parentMetricsV1'->>'progressionBand') AS progression_band,
  (ga.payload->'parentMetricsV1'->>'ageBand') AS age_band,
  CASE
    WHEN (ga.payload->'parentMetricsV1'->>'decodeAccuracyPct') ~ '^[0-9]+(\.[0-9]+)?$'
    THEN (ga.payload->'parentMetricsV1'->>'decodeAccuracyPct')::numeric
    ELSE NULL
  END AS decode_accuracy_pct,
  CASE
    WHEN (ga.payload->'parentMetricsV1'->>'sequenceEvidenceScore') ~ '^[0-9]+(\.[0-9]+)?$'
    THEN (ga.payload->'parentMetricsV1'->>'sequenceEvidenceScore')::numeric
    ELSE NULL
  END AS sequence_evidence_score,
  CASE
    WHEN (ga.payload->'parentMetricsV1'->>'listenParticipationPct') ~ '^[0-9]+(\.[0-9]+)?$'
    THEN (ga.payload->'parentMetricsV1'->>'listenParticipationPct')::numeric
    ELSE NULL
  END AS listen_participation_pct,
  CASE
    WHEN ga.payload->'parentMetricsV1' ? 'gatePassed'
      AND jsonb_typeof(ga.payload->'parentMetricsV1'->'gatePassed') = 'boolean'
    THEN (ga.payload->'parentMetricsV1'->>'gatePassed')::boolean
    WHEN ga.payload->'parentMetricsV1'->>'gatePassed' IS NOT NULL
    THEN lower(ga.payload->'parentMetricsV1'->>'gatePassed') IN ('true', '1', 'yes')
    ELSE NULL
  END AS gate_passed,
  ga.id AS attempt_id,
  GREATEST(ga.created_at, ga.updated_at) AS metric_as_of
FROM public.game_attempts ga
WHERE ga.payload ? 'parentMetricsV1'
  AND jsonb_typeof(ga.payload->'parentMetricsV1') = 'object'
  AND (ga.payload->'parentMetricsV1'->>'contractVersion') = 'parent-metrics.v1'
  AND (ga.payload->'parentMetricsV1'->>'domain') IN ('math', 'letters', 'reading')
ORDER BY
  ga.child_id,
  (ga.payload->'parentMetricsV1'->>'domain'),
  GREATEST(ga.created_at, ga.updated_at) DESC,
  ga.updated_at DESC,
  ga.id DESC;

COMMENT ON VIEW public.dubiland_parent_metrics_latest_v1 IS
  'Latest parentMetrics.v1 row per child × curriculum domain; RLS via game_attempts (SECURITY INVOKER).';

GRANT SELECT ON public.dubiland_parent_metrics_latest_v1 TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: rolling 14 local-day avg accuracy + latest trend snapshot per domain
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dubiland_parent_dashboard_curriculum_metrics(
  p_timezone text DEFAULT 'Asia/Jerusalem'
)
RETURNS TABLE (
  child_id uuid,
  domain text,
  avg_accuracy_pct_14d numeric,
  hint_trend_latest text,
  independence_trend_latest text,
  progression_band_latest text,
  last_skill_key text,
  updated_at timestamptz
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
  WITH family_children AS (
    SELECT c.id AS cid
    FROM public.children c
    JOIN public.families f ON f.id = c.family_id
    WHERE f.auth_user_id = (SELECT auth.uid())
  ),
  v1 AS (
    SELECT
      ga.child_id,
      ga.created_at,
      ga.updated_at,
      ga.payload->'parentMetricsV1' AS pm,
      (ga.created_at AT TIME ZONE tz)::date AS d
    FROM public.game_attempts ga
    WHERE ga.child_id IN (SELECT fc.cid FROM family_children fc)
      AND ga.payload ? 'parentMetricsV1'
      AND jsonb_typeof(ga.payload->'parentMetricsV1') = 'object'
      AND (ga.payload->'parentMetricsV1'->>'contractVersion') = 'parent-metrics.v1'
      AND (ga.payload->'parentMetricsV1'->>'domain') IN ('math', 'letters', 'reading')
  ),
  latest_rows AS (
    SELECT DISTINCT ON (v.child_id, (v.pm->>'domain'))
      v.child_id,
      (v.pm->>'domain') AS dom,
      (v.pm->>'skillKey') AS sk,
      (v.pm->>'hintTrend') AS ht,
      (v.pm->>'independenceTrend') AS it,
      (v.pm->>'progressionBand') AS pb,
      GREATEST(v.created_at, v.updated_at) AS uat
    FROM v1 v
    ORDER BY
      v.child_id,
      (v.pm->>'domain'),
      GREATEST(v.created_at, v.updated_at) DESC,
      v.updated_at DESC
  ),
  avg_rows AS (
    SELECT
      v.child_id,
      (v.pm->>'domain') AS dom,
      AVG(
        CASE
          WHEN (v.pm->>'accuracyPct') ~ '^[0-9]+(\.[0-9]+)?$'
          THEN (v.pm->>'accuracyPct')::double precision
          ELSE NULL
        END
      ) AS avg_acc
    FROM v1 v
    WHERE v.d >= local_today - 13
      AND v.d <= local_today
    GROUP BY v.child_id, (v.pm->>'domain')
  )
  SELECT
    lr.child_id,
    lr.dom::text,
    CASE
      WHEN ar.avg_acc IS NULL THEN NULL
      ELSE ROUND(ar.avg_acc::numeric, 2)
    END,
    lr.ht::text,
    lr.it::text,
    lr.pb::text,
    lr.sk::text,
    lr.uat
  FROM latest_rows lr
  LEFT JOIN avg_rows ar
    ON ar.child_id = lr.child_id
    AND ar.dom = lr.dom
  ORDER BY lr.child_id, lr.dom;
END;
$$;

COMMENT ON FUNCTION public.dubiland_parent_dashboard_curriculum_metrics(text) IS
  'Per-child curriculum metrics from parentMetrics.v1: 14 local-day avg accuracy + latest trends; family scoped via children/families + RLS on game_attempts.';

REVOKE ALL ON FUNCTION public.dubiland_parent_dashboard_curriculum_metrics(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dubiland_parent_dashboard_curriculum_metrics(text) TO authenticated;
