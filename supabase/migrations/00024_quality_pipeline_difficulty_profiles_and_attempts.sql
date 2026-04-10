-- DUB-530: Quality pipeline — per-game age-band difficulty profiles, handbook page
-- content revision, optional attempt → profile linkage.
-- Spec: docs/architecture/2026-04-10-quality-pipeline-architecture-review.md §4, §5
--
-- Rollback (manual — dev/staging only):
--   ALTER TABLE public.game_attempts DROP COLUMN IF EXISTS difficulty_profile_id;
--   DROP TABLE IF EXISTS public.game_difficulty_profiles;
--   ALTER TABLE public.handbook_pages DROP COLUMN IF EXISTS content_revision;

-- ---------------------------------------------------------------------------
-- game_difficulty_profiles: canonical baseline difficulty per game × age band
-- ---------------------------------------------------------------------------
CREATE TABLE public.game_difficulty_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games (id) ON DELETE CASCADE,
  age_band TEXT NOT NULL CHECK (age_band IN ('3-4', '4-5', '5-6', '6-7')),
  profile_version INT NOT NULL DEFAULT 1 CHECK (profile_version >= 1),
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, age_band, profile_version)
);

CREATE INDEX game_difficulty_profiles_game_published_sort_idx
  ON public.game_difficulty_profiles (game_id, is_published, sort_order)
  WHERE is_published = true;

CREATE INDEX game_difficulty_profiles_game_age_band_idx
  ON public.game_difficulty_profiles (game_id, age_band);

DROP TRIGGER IF EXISTS trg_game_difficulty_profiles_updated_at ON public.game_difficulty_profiles;
CREATE TRIGGER trg_game_difficulty_profiles_updated_at
  BEFORE UPDATE ON public.game_difficulty_profiles
  FOR EACH ROW EXECUTE FUNCTION dubiland_set_updated_at();

ALTER TABLE public.game_difficulty_profiles ENABLE ROW LEVEL SECURITY;

-- Catalog read: same pattern as games / handbook — published rows only, parent game published.
-- Writes: no INSERT/UPDATE/DELETE policies for anon/authenticated; seeds and tooling use service_role
-- (bypasses RLS) or SQL migrations.
CREATE POLICY "game_difficulty_profiles_public_select_published"
  ON public.game_difficulty_profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1
      FROM public.games g
      WHERE g.id = game_difficulty_profiles.game_id
        AND g.is_published = true
    )
  );

COMMENT ON TABLE public.game_difficulty_profiles IS
  'Per-game age-band difficulty baseline; runtime resolves profile and passes config_json into games.';

-- ---------------------------------------------------------------------------
-- Handbook: per-page revision for DB-first content contract invalidation
-- ---------------------------------------------------------------------------
ALTER TABLE public.handbook_pages
  ADD COLUMN IF NOT EXISTS content_revision INT NOT NULL DEFAULT 1 CHECK (content_revision >= 1);

COMMENT ON COLUMN public.handbook_pages.content_revision IS
  'Bump when executable blocks_json/interactions_json contract changes for this page; pairs with handbooks.content_schema_version.';

-- ---------------------------------------------------------------------------
-- Attempts: optional FK to profile used during play (analytics / dashboard)
-- ---------------------------------------------------------------------------
ALTER TABLE public.game_attempts
  ADD COLUMN IF NOT EXISTS difficulty_profile_id UUID
  REFERENCES public.game_difficulty_profiles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_game_attempts_difficulty_profile_id
  ON public.game_attempts (difficulty_profile_id)
  WHERE difficulty_profile_id IS NOT NULL;

COMMENT ON COLUMN public.game_attempts.difficulty_profile_id IS
  'Published difficulty profile active when this attempt was recorded; nullable for legacy clients.';
