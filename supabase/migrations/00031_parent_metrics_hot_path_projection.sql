-- DUB-713: Canonical curriculum domain on games + typed parent-metrics projection on
-- game_attempts so dashboard read paths avoid repeated JSONB parsing (DUB-682).
--
-- Rollback (manual — dev/staging):
--   DROP TRIGGER IF EXISTS trg_games_curriculum_domain ON public.games;
--   DROP FUNCTION IF EXISTS public.dubiland_sync_game_curriculum_domain();
--   DROP TRIGGER IF EXISTS trg_game_attempts_project_parent_metrics_v1 ON public.game_attempts;
--   DROP FUNCTION IF EXISTS public.dubiland_game_attempts_project_parent_metrics_v1();
--   ALTER TABLE public.games DROP COLUMN IF EXISTS curriculum_domain;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS pm_contract_version;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS pm_domain;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS pm_skill_key;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS pm_accuracy_pct;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS pm_hint_trend;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS pm_independence_trend;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS pm_progression_band;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS pm_age_band;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS pm_decode_accuracy_pct;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS pm_sequence_evidence_score;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS pm_listen_participation_pct;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS pm_gate_passed;
--   DROP INDEX IF EXISTS public.idx_game_attempts_pm_v1_child_domain_asof;
--   CREATE INDEX IF NOT EXISTS idx_game_attempts_parent_metrics_v1_child_created ... (restore 00026);
--   Then restore prior definitions of dubiland_parent_metrics_latest_v1 and
--   dubiland_parent_dashboard_curriculum_metrics from migration 00026.

-- ---------------------------------------------------------------------------
-- 1) games.curriculum_domain — denormalized join-free curriculum bucket for policy + writes
-- ---------------------------------------------------------------------------
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS curriculum_domain text;

ALTER TABLE public.games
  DROP CONSTRAINT IF EXISTS games_curriculum_domain_chk;

ALTER TABLE public.games
  ADD CONSTRAINT games_curriculum_domain_chk
  CHECK (
    curriculum_domain IS NULL
    OR curriculum_domain IN ('math', 'letters', 'reading')
  );

COMMENT ON COLUMN public.games.curriculum_domain IS
  'Parent-metrics curriculum bucket resolved from topics.slug at write time; join-free contract for Edge Functions and SQL.';

CREATE OR REPLACE FUNCTION public.dubiland_sync_game_curriculum_domain()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.curriculum_domain := (
    SELECT t.slug
    FROM public.topics t
    WHERE t.id = NEW.topic_id
      AND t.slug IN ('math', 'letters', 'reading')
    LIMIT 1
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.dubiland_sync_game_curriculum_domain() IS
  'BEFORE INSERT/UPDATE OF topic_id on games: set curriculum_domain from topics.slug when it is a parent-metrics domain.';

DROP TRIGGER IF EXISTS trg_games_curriculum_domain ON public.games;
CREATE TRIGGER trg_games_curriculum_domain
  BEFORE INSERT OR UPDATE OF topic_id ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.dubiland_sync_game_curriculum_domain();

UPDATE public.games g
SET curriculum_domain = t.slug
FROM public.topics t
WHERE t.id = g.topic_id
  AND t.slug IN ('math', 'letters', 'reading');

-- ---------------------------------------------------------------------------
-- 2) game_attempts pm_* — hot projection columns (filled from payload JSONB + trigger)
-- ---------------------------------------------------------------------------
ALTER TABLE public.game_attempts
  ADD COLUMN IF NOT EXISTS pm_contract_version text,
  ADD COLUMN IF NOT EXISTS pm_domain text,
  ADD COLUMN IF NOT EXISTS pm_skill_key text,
  ADD COLUMN IF NOT EXISTS pm_accuracy_pct numeric,
  ADD COLUMN IF NOT EXISTS pm_hint_trend text,
  ADD COLUMN IF NOT EXISTS pm_independence_trend text,
  ADD COLUMN IF NOT EXISTS pm_progression_band text,
  ADD COLUMN IF NOT EXISTS pm_age_band text,
  ADD COLUMN IF NOT EXISTS pm_decode_accuracy_pct numeric,
  ADD COLUMN IF NOT EXISTS pm_sequence_evidence_score numeric,
  ADD COLUMN IF NOT EXISTS pm_listen_participation_pct numeric,
  ADD COLUMN IF NOT EXISTS pm_gate_passed boolean;

ALTER TABLE public.game_attempts
  DROP CONSTRAINT IF EXISTS game_attempts_pm_domain_chk;

ALTER TABLE public.game_attempts
  ADD CONSTRAINT game_attempts_pm_domain_chk
  CHECK (pm_domain IS NULL OR pm_domain IN ('math', 'letters', 'reading'));

ALTER TABLE public.game_attempts
  DROP CONSTRAINT IF EXISTS game_attempts_pm_trend_chk;

ALTER TABLE public.game_attempts
  ADD CONSTRAINT game_attempts_pm_trend_chk
  CHECK (
    pm_hint_trend IS NULL
    OR pm_hint_trend IN ('improving', 'steady', 'needs_support')
  );

ALTER TABLE public.game_attempts
  DROP CONSTRAINT IF EXISTS game_attempts_pm_independence_trend_chk;

ALTER TABLE public.game_attempts
  ADD CONSTRAINT game_attempts_pm_independence_trend_chk
  CHECK (
    pm_independence_trend IS NULL
    OR pm_independence_trend IN ('improving', 'steady', 'needs_support')
  );

ALTER TABLE public.game_attempts
  DROP CONSTRAINT IF EXISTS game_attempts_pm_progression_band_chk;

ALTER TABLE public.game_attempts
  ADD CONSTRAINT game_attempts_pm_progression_band_chk
  CHECK (
    pm_progression_band IS NULL
    OR pm_progression_band IN ('1-3', '1-5', '1-10')
  );

ALTER TABLE public.game_attempts
  DROP CONSTRAINT IF EXISTS game_attempts_pm_age_band_chk;

ALTER TABLE public.game_attempts
  ADD CONSTRAINT game_attempts_pm_age_band_chk
  CHECK (
    pm_age_band IS NULL
    OR pm_age_band IN ('3-4', '4-5', '5-6', '6-7')
  );

COMMENT ON COLUMN public.game_attempts.pm_contract_version IS
  'Hot-path mirror of payload.parentMetricsV1.contractVersion when present (parent-metrics.v1).';

COMMENT ON COLUMN public.game_attempts.pm_domain IS
  'Hot-path mirror of parentMetricsV1.domain for indexed dashboard queries.';

CREATE OR REPLACE FUNCTION public.dubiland_game_attempts_project_parent_metrics_v1()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  pm jsonb;
  acc_txt text;
  dec_txt text;
  seq_txt text;
  lst_txt text;
BEGIN
  NEW.pm_contract_version := NULL;
  NEW.pm_domain := NULL;
  NEW.pm_skill_key := NULL;
  NEW.pm_accuracy_pct := NULL;
  NEW.pm_hint_trend := NULL;
  NEW.pm_independence_trend := NULL;
  NEW.pm_progression_band := NULL;
  NEW.pm_age_band := NULL;
  NEW.pm_decode_accuracy_pct := NULL;
  NEW.pm_sequence_evidence_score := NULL;
  NEW.pm_listen_participation_pct := NULL;
  NEW.pm_gate_passed := NULL;

  pm := NEW.payload -> 'parentMetricsV1';

  IF pm IS NULL OR jsonb_typeof(pm) <> 'object' THEN
    RETURN NEW;
  END IF;

  IF (pm ->> 'contractVersion') IS DISTINCT FROM 'parent-metrics.v1' THEN
    RETURN NEW;
  END IF;

  IF (pm ->> 'domain') IS NULL
    OR (pm ->> 'domain') NOT IN ('math', 'letters', 'reading') THEN
    RETURN NEW;
  END IF;

  NEW.pm_skill_key := NULLIF(btrim(pm ->> 'skillKey'), '');
  IF NEW.pm_skill_key IS NULL OR char_length(NEW.pm_skill_key) > 96 THEN
    RETURN NEW;
  END IF;

  acc_txt := pm ->> 'accuracyPct';
  IF acc_txt IS NULL OR acc_txt !~ '^[0-9]+(\.[0-9]+)?$' THEN
    RETURN NEW;
  END IF;
  NEW.pm_accuracy_pct := acc_txt::numeric;
  IF NEW.pm_accuracy_pct < 0 OR NEW.pm_accuracy_pct > 100 THEN
    RETURN NEW;
  END IF;

  IF (pm ->> 'hintTrend') IS NULL
    OR (pm ->> 'hintTrend') NOT IN ('improving', 'steady', 'needs_support') THEN
    RETURN NEW;
  END IF;
  IF (pm ->> 'independenceTrend') IS NULL
    OR (pm ->> 'independenceTrend') NOT IN ('improving', 'steady', 'needs_support') THEN
    RETURN NEW;
  END IF;
  IF (pm ->> 'progressionBand') IS NULL
    OR (pm ->> 'progressionBand') NOT IN ('1-3', '1-5', '1-10') THEN
    RETURN NEW;
  END IF;

  NEW.pm_contract_version := 'parent-metrics.v1';
  NEW.pm_domain := pm ->> 'domain';
  NEW.pm_hint_trend := pm ->> 'hintTrend';
  NEW.pm_independence_trend := pm ->> 'independenceTrend';
  NEW.pm_progression_band := pm ->> 'progressionBand';

  IF pm ? 'ageBand' AND (pm ->> 'ageBand') IN ('3-4', '4-5', '5-6', '6-7') THEN
    NEW.pm_age_band := pm ->> 'ageBand';
  END IF;

  dec_txt := pm ->> 'decodeAccuracyPct';
  IF dec_txt IS NOT NULL AND dec_txt ~ '^[0-9]+(\.[0-9]+)?$' THEN
    NEW.pm_decode_accuracy_pct := dec_txt::numeric;
  END IF;

  seq_txt := pm ->> 'sequenceEvidenceScore';
  IF seq_txt IS NOT NULL AND seq_txt ~ '^[0-9]+(\.[0-9]+)?$' THEN
    NEW.pm_sequence_evidence_score := seq_txt::numeric;
  END IF;

  lst_txt := pm ->> 'listenParticipationPct';
  IF lst_txt IS NOT NULL AND lst_txt ~ '^[0-9]+(\.[0-9]+)?$' THEN
    NEW.pm_listen_participation_pct := lst_txt::numeric;
  END IF;

  IF pm ? 'gatePassed' AND jsonb_typeof(pm -> 'gatePassed') = 'boolean' THEN
    NEW.pm_gate_passed := (pm ->> 'gatePassed')::boolean;
  ELSIF pm ->> 'gatePassed' IS NOT NULL THEN
    NEW.pm_gate_passed := lower(pm ->> 'gatePassed') IN ('true', '1', 'yes');
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.dubiland_game_attempts_project_parent_metrics_v1() IS
  'BEFORE INSERT OR UPDATE OF payload: populate pm_* columns from payload.parentMetricsV1 (v1 contract only).';

DROP TRIGGER IF EXISTS trg_game_attempts_project_parent_metrics_v1 ON public.game_attempts;
CREATE TRIGGER trg_game_attempts_project_parent_metrics_v1
  BEFORE INSERT OR UPDATE OF payload ON public.game_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.dubiland_game_attempts_project_parent_metrics_v1();

UPDATE public.game_attempts ga
SET payload = ga.payload
WHERE ga.payload ? 'parentMetricsV1'
  AND jsonb_typeof(ga.payload -> 'parentMetricsV1') = 'object'
  AND (ga.payload -> 'parentMetricsV1' ->> 'contractVersion') = 'parent-metrics.v1';

-- ---------------------------------------------------------------------------
-- 3) Indexing — replace JSON-only partial index with projection-first index
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_game_attempts_parent_metrics_v1_child_created;

CREATE INDEX IF NOT EXISTS idx_game_attempts_pm_v1_child_domain_asof
  ON public.game_attempts (
    child_id,
    pm_domain,
    (GREATEST(created_at, updated_at)) DESC,
    updated_at DESC,
    id DESC
  )
  WHERE pm_contract_version = 'parent-metrics.v1'
    AND pm_domain IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4) Read model: view + RPC prefer pm_* with JSON fallback for safety
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.dubiland_parent_metrics_latest_v1
WITH (security_invoker = true) AS
SELECT DISTINCT ON (
  ga.child_id,
  COALESCE(ga.pm_domain, ga.payload -> 'parentMetricsV1' ->> 'domain')
)
  ga.child_id,
  COALESCE(ga.pm_domain, ga.payload -> 'parentMetricsV1' ->> 'domain') AS domain,
  COALESCE(ga.pm_skill_key, ga.payload -> 'parentMetricsV1' ->> 'skillKey') AS skill_key,
  COALESCE(
    ga.pm_accuracy_pct,
    CASE
      WHEN (ga.payload -> 'parentMetricsV1' ->> 'accuracyPct') ~ '^[0-9]+(\.[0-9]+)?$'
      THEN (ga.payload -> 'parentMetricsV1' ->> 'accuracyPct')::numeric
      ELSE NULL
    END
  ) AS accuracy_pct,
  COALESCE(ga.pm_hint_trend, ga.payload -> 'parentMetricsV1' ->> 'hintTrend') AS hint_trend,
  COALESCE(
    ga.pm_independence_trend,
    ga.payload -> 'parentMetricsV1' ->> 'independenceTrend'
  ) AS independence_trend,
  COALESCE(
    ga.pm_progression_band,
    ga.payload -> 'parentMetricsV1' ->> 'progressionBand'
  ) AS progression_band,
  COALESCE(ga.pm_age_band, ga.payload -> 'parentMetricsV1' ->> 'ageBand') AS age_band,
  COALESCE(
    ga.pm_decode_accuracy_pct,
    CASE
      WHEN (ga.payload -> 'parentMetricsV1' ->> 'decodeAccuracyPct') ~ '^[0-9]+(\.[0-9]+)?$'
      THEN (ga.payload -> 'parentMetricsV1' ->> 'decodeAccuracyPct')::numeric
      ELSE NULL
    END
  ) AS decode_accuracy_pct,
  COALESCE(
    ga.pm_sequence_evidence_score,
    CASE
      WHEN (ga.payload -> 'parentMetricsV1' ->> 'sequenceEvidenceScore') ~ '^[0-9]+(\.[0-9]+)?$'
      THEN (ga.payload -> 'parentMetricsV1' ->> 'sequenceEvidenceScore')::numeric
      ELSE NULL
    END
  ) AS sequence_evidence_score,
  COALESCE(
    ga.pm_listen_participation_pct,
    CASE
      WHEN (ga.payload -> 'parentMetricsV1' ->> 'listenParticipationPct') ~ '^[0-9]+(\.[0-9]+)?$'
      THEN (ga.payload -> 'parentMetricsV1' ->> 'listenParticipationPct')::numeric
      ELSE NULL
    END
  ) AS listen_participation_pct,
  COALESCE(ga.pm_gate_passed, CASE
    WHEN ga.payload -> 'parentMetricsV1' ? 'gatePassed'
      AND jsonb_typeof(ga.payload -> 'parentMetricsV1' -> 'gatePassed') = 'boolean'
    THEN (ga.payload -> 'parentMetricsV1' ->> 'gatePassed')::boolean
    WHEN ga.payload -> 'parentMetricsV1' ->> 'gatePassed' IS NOT NULL
    THEN lower(ga.payload -> 'parentMetricsV1' ->> 'gatePassed') IN ('true', '1', 'yes')
    ELSE NULL
  END) AS gate_passed,
  ga.id AS attempt_id,
  GREATEST(ga.created_at, ga.updated_at) AS metric_as_of
FROM public.game_attempts ga
WHERE ga.pm_contract_version = 'parent-metrics.v1'
   OR (
    ga.payload ? 'parentMetricsV1'
    AND jsonb_typeof(ga.payload -> 'parentMetricsV1') = 'object'
    AND (ga.payload -> 'parentMetricsV1' ->> 'contractVersion') = 'parent-metrics.v1'
    AND (ga.payload -> 'parentMetricsV1' ->> 'domain') IN ('math', 'letters', 'reading')
  )
ORDER BY
  ga.child_id,
  COALESCE(ga.pm_domain, ga.payload -> 'parentMetricsV1' ->> 'domain'),
  GREATEST(ga.created_at, ga.updated_at) DESC,
  ga.updated_at DESC,
  ga.id DESC;

COMMENT ON VIEW public.dubiland_parent_metrics_latest_v1 IS
  'Latest parentMetrics.v1 row per child × curriculum domain; prefers typed pm_* projection with JSON fallback; RLS via game_attempts (SECURITY INVOKER).';

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
      COALESCE(ga.pm_domain, ga.payload -> 'parentMetricsV1' ->> 'domain') AS dom,
      COALESCE(ga.pm_skill_key, ga.payload -> 'parentMetricsV1' ->> 'skillKey') AS sk,
      COALESCE(
        ga.pm_accuracy_pct,
        CASE
          WHEN (ga.payload -> 'parentMetricsV1' ->> 'accuracyPct') ~ '^[0-9]+(\.[0-9]+)?$'
          THEN (ga.payload -> 'parentMetricsV1' ->> 'accuracyPct')::double precision
          ELSE NULL::double precision
        END
      ) AS acc_n,
      COALESCE(ga.pm_hint_trend, ga.payload -> 'parentMetricsV1' ->> 'hintTrend') AS ht,
      COALESCE(
        ga.pm_independence_trend,
        ga.payload -> 'parentMetricsV1' ->> 'independenceTrend'
      ) AS it,
      COALESCE(
        ga.pm_progression_band,
        ga.payload -> 'parentMetricsV1' ->> 'progressionBand'
      ) AS pb,
      (ga.created_at AT TIME ZONE tz)::date AS d
    FROM public.game_attempts ga
    WHERE ga.child_id IN (SELECT fc.cid FROM family_children fc)
      AND (
        ga.pm_contract_version = 'parent-metrics.v1'
        OR (
          ga.payload ? 'parentMetricsV1'
          AND jsonb_typeof(ga.payload -> 'parentMetricsV1') = 'object'
          AND (ga.payload -> 'parentMetricsV1' ->> 'contractVersion') = 'parent-metrics.v1'
        )
      )
      AND COALESCE(ga.pm_domain, ga.payload -> 'parentMetricsV1' ->> 'domain') IN (
        'math',
        'letters',
        'reading'
      )
  ),
  latest_rows AS (
    SELECT DISTINCT ON (v.child_id, v.dom)
      v.child_id,
      v.dom,
      v.sk,
      v.ht,
      v.it,
      v.pb,
      GREATEST(v.created_at, v.updated_at) AS uat
    FROM v1 v
    ORDER BY
      v.child_id,
      v.dom,
      GREATEST(v.created_at, v.updated_at) DESC,
      v.updated_at DESC
  ),
  avg_rows AS (
    SELECT
      v.child_id,
      v.dom,
      AVG(v.acc_n) AS avg_acc
    FROM v1 v
    WHERE v.d >= local_today - 13
      AND v.d <= local_today
      AND v.acc_n IS NOT NULL
    GROUP BY v.child_id, v.dom
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
  'Per-child curriculum metrics from parentMetrics.v1: prefers pm_* columns; 14 local-day avg accuracy + latest trends; family scoped via children/families + RLS on game_attempts.';
