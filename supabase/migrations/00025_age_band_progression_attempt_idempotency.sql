-- DUB-544: Age-band progression context on attempts, client-UUID idempotent upserts,
-- read model for latest per-child mastery signals (view).
--
-- Rollback (manual — dev/staging only):
--   DROP VIEW IF EXISTS public.dubiland_child_game_mastery_latest;
--   DROP POLICY IF EXISTS "game_attempts_update_own" ON public.game_attempts;
--   DROP TRIGGER IF EXISTS trg_game_attempts_updated_at ON public.game_attempts;
--   DROP TRIGGER IF EXISTS trg_game_attempts_refresh_summary ON public.game_attempts;
--   DROP TRIGGER IF EXISTS trg_game_attempts_match_session ON public.game_attempts;
--   CREATE OR REPLACE FUNCTION ... (restore 00006 versions of enforce + refresh);
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS age_band;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS starting_level_id;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS mastery_outcome;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS in_support_mode;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS support_flags;
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS updated_at;
--   DROP INDEX IF EXISTS public.idx_game_attempts_child_game_progress;

-- ---------------------------------------------------------------------------
-- First-class progression fields (analytics + routing; JSONB payload remains for game-specific detail)
-- ---------------------------------------------------------------------------
ALTER TABLE public.game_attempts
  ADD COLUMN IF NOT EXISTS age_band TEXT,
  ADD COLUMN IF NOT EXISTS starting_level_id UUID
    REFERENCES public.game_levels (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mastery_outcome TEXT,
  ADD COLUMN IF NOT EXISTS in_support_mode BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.game_attempts
  DROP CONSTRAINT IF EXISTS game_attempts_age_band_chk;

ALTER TABLE public.game_attempts
  ADD CONSTRAINT game_attempts_age_band_chk
  CHECK (age_band IS NULL OR age_band IN ('3-4', '4-5', '5-6', '6-7'));

ALTER TABLE public.game_attempts
  DROP CONSTRAINT IF EXISTS game_attempts_mastery_outcome_chk;

ALTER TABLE public.game_attempts
  ADD CONSTRAINT game_attempts_mastery_outcome_chk
  CHECK (
    mastery_outcome IS NULL
    OR mastery_outcome IN (
      'unknown',
      'introduced',
      'practicing',
      'passed',
      'mastered',
      'needs_support'
    )
  );

COMMENT ON COLUMN public.game_attempts.id IS
  'Primary key; clients may supply a stable UUID for idempotent retries (upsert on id).';

COMMENT ON COLUMN public.game_attempts.age_band IS
  'Child age band label at attempt time (3-4 … 6-7); mirrors catalog / routing.';

COMMENT ON COLUMN public.game_attempts.level_id IS
  'Level served / completed for this attempt (legacy column; use for served level).';

COMMENT ON COLUMN public.game_attempts.starting_level_id IS
  'Level the child began from in this progression context (may differ from level_id when adaptive routing jumps).';

COMMENT ON COLUMN public.game_attempts.mastery_outcome IS
  'Coarse mastery signal for age routing and dashboards.';

COMMENT ON COLUMN public.game_attempts.in_support_mode IS
  'True when attempt was taken in reduced-demand / scaffolding mode.';

COMMENT ON COLUMN public.game_attempts.support_flags IS
  'Structured hints (e.g. hint_count, read_aloud) without expanding child PII.';

CREATE INDEX IF NOT EXISTS idx_game_attempts_child_game_progress
  ON public.game_attempts (child_id, game_id, updated_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_attempts_starting_level_id
  ON public.game_attempts (starting_level_id)
  WHERE starting_level_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Integrity: session match + immutable identity on update + starting_level game match
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dubiland_enforce_attempt_matches_session()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  s_child UUID;
  s_game UUID;
  gl_game UUID;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'game_attempts: id is immutable';
    END IF;
    IF NEW.child_id IS DISTINCT FROM OLD.child_id
      OR NEW.game_id IS DISTINCT FROM OLD.game_id
      OR NEW.session_id IS DISTINCT FROM OLD.session_id THEN
      RAISE EXCEPTION 'game_attempts: child_id, game_id, session_id are immutable on update';
    END IF;
  END IF;

  SELECT child_id, game_id INTO s_child, s_game
  FROM public.game_sessions
  WHERE id = NEW.session_id;

  IF s_child IS NULL THEN
    RAISE EXCEPTION 'game_attempts: session % not found', NEW.session_id;
  END IF;

  IF NEW.child_id IS DISTINCT FROM s_child OR NEW.game_id IS DISTINCT FROM s_game THEN
    RAISE EXCEPTION 'game_attempts: child_id/game_id must match session';
  END IF;

  IF NEW.starting_level_id IS NOT NULL THEN
    SELECT game_id INTO gl_game FROM public.game_levels WHERE id = NEW.starting_level_id;
    IF gl_game IS NULL THEN
      RAISE EXCEPTION 'game_attempts: starting_level_id not found';
    END IF;
    IF gl_game IS DISTINCT FROM NEW.game_id THEN
      RAISE EXCEPTION 'game_attempts: starting_level_id must belong to game_id';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_game_attempts_match_session ON public.game_attempts;
CREATE TRIGGER trg_game_attempts_match_session
  BEFORE INSERT OR UPDATE ON public.game_attempts
  FOR EACH ROW EXECUTE FUNCTION public.dubiland_enforce_attempt_matches_session();

DROP TRIGGER IF EXISTS trg_game_attempts_updated_at ON public.game_attempts;
CREATE TRIGGER trg_game_attempts_updated_at
  BEFORE UPDATE ON public.game_attempts
  FOR EACH ROW EXECUTE FUNCTION public.dubiland_set_updated_at();

-- ---------------------------------------------------------------------------
-- Rollup: INSERT increments attempts; UPDATE is idempotent replay (refresh bests only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dubiland_refresh_summary_from_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bump_ts TIMESTAMPTZ;
BEGIN
  bump_ts := GREATEST(NEW.created_at, COALESCE(NEW.updated_at, NEW.created_at));

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.child_game_summaries AS s (
      child_id,
      game_id,
      total_sessions,
      total_attempts,
      best_score,
      best_stars,
      last_played_at,
      updated_at
    )
    VALUES (
      NEW.child_id,
      NEW.game_id,
      0,
      1,
      NEW.score,
      NEW.stars,
      NEW.created_at,
      now()
    )
    ON CONFLICT (child_id, game_id) DO UPDATE SET
      total_attempts = s.total_attempts + 1,
      best_score = GREATEST(s.best_score, EXCLUDED.best_score),
      best_stars = GREATEST(s.best_stars, EXCLUDED.best_stars),
      last_played_at = GREATEST(s.last_played_at, EXCLUDED.last_played_at),
      updated_at = now();

  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.child_game_summaries s SET
      best_score = GREATEST(s.best_score, NEW.score),
      best_stars = GREATEST(s.best_stars, NEW.stars),
      last_played_at = GREATEST(s.last_played_at, bump_ts),
      updated_at = now()
    WHERE s.child_id = NEW.child_id AND s.game_id = NEW.game_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_game_attempts_refresh_summary ON public.game_attempts;
CREATE TRIGGER trg_game_attempts_refresh_summary
  AFTER INSERT OR UPDATE ON public.game_attempts
  FOR EACH ROW EXECUTE FUNCTION public.dubiland_refresh_summary_from_attempt();

-- ---------------------------------------------------------------------------
-- RLS: allow parents to upsert idempotent attempts (same child, JWT family)
-- ---------------------------------------------------------------------------
CREATE POLICY "game_attempts_update_own" ON public.game_attempts
  FOR UPDATE
  USING (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Read model: one row per (child, game) — latest attempt by write time
-- security_invoker: enforce game_attempts RLS for the caller
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.dubiland_child_game_mastery_latest
WITH (security_invoker = true) AS
SELECT DISTINCT ON (ga.child_id, ga.game_id)
  ga.child_id,
  ga.game_id,
  ga.id AS latest_attempt_id,
  ga.age_band,
  ga.starting_level_id,
  ga.level_id AS served_level_id,
  ga.mastery_outcome,
  ga.in_support_mode,
  ga.support_flags,
  ga.score AS latest_score,
  ga.stars AS latest_stars,
  ga.difficulty_profile_id,
  ga.created_at AS attempt_created_at,
  ga.updated_at AS attempt_updated_at,
  GREATEST(ga.created_at, ga.updated_at) AS last_activity_at
FROM public.game_attempts ga
ORDER BY
  ga.child_id,
  ga.game_id,
  GREATEST(ga.created_at, ga.updated_at) DESC,
  ga.id DESC;

COMMENT ON VIEW public.dubiland_child_game_mastery_latest IS
  'Latest attempt per child × game for age routing and mastery UI; respects RLS on game_attempts.';

GRANT SELECT ON public.dubiland_child_game_mastery_latest TO authenticated;
