-- Phase A/B (DUB-160): RLS normalization, ownership indexes, updated_at, append-only progress tables.
-- Spec: docs/architecture/2026-04-10-supabase-architecture.md
--
-- Rollback (manual — dev/staging only):
--   DROP TRIGGER IF EXISTS trg_game_attempts_refresh_summary ON game_attempts;
--   DROP TRIGGER IF EXISTS trg_game_sessions_refresh_summary ON game_sessions;
--   DROP FUNCTION IF EXISTS dubiland_refresh_summary_from_attempt();
--   DROP FUNCTION IF EXISTS dubiland_refresh_summary_from_session();
--   DROP FUNCTION IF EXISTS dubiland_enforce_attempt_matches_session();
--   DROP FUNCTION IF EXISTS dubiland_set_updated_at();
--   DROP TABLE IF EXISTS game_attempts;
--   DROP TABLE IF EXISTS game_sessions;
--   DROP TABLE IF EXISTS child_game_summaries;
--   Re-apply legacy policies from 00001_initial_schema.sql if needed.

-- ---------------------------------------------------------------------------
-- Shared: updated_at maintenance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION dubiland_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Audit columns (non-destructive ADD)
-- ---------------------------------------------------------------------------
ALTER TABLE families ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE children ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE games ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE videos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DROP TRIGGER IF EXISTS trg_families_updated_at ON families;
CREATE TRIGGER trg_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION dubiland_set_updated_at();

DROP TRIGGER IF EXISTS trg_children_updated_at ON children;
CREATE TRIGGER trg_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION dubiland_set_updated_at();

DROP TRIGGER IF EXISTS trg_games_updated_at ON games;
CREATE TRIGGER trg_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION dubiland_set_updated_at();

DROP TRIGGER IF EXISTS trg_videos_updated_at ON videos;
CREATE TRIGGER trg_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION dubiland_set_updated_at();

DROP TRIGGER IF EXISTS trg_progress_updated_at ON progress;
CREATE TRIGGER trg_progress_updated_at
  BEFORE UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION dubiland_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS policy normalization (explicit per command + WITH CHECK)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "families_own" ON families;
DROP POLICY IF EXISTS "children_own" ON children;
DROP POLICY IF EXISTS "progress_own" ON progress;
DROP POLICY IF EXISTS "video_progress_own" ON video_progress;
DROP POLICY IF EXISTS "topics_public_read" ON topics;
DROP POLICY IF EXISTS "age_groups_public_read" ON age_groups;
DROP POLICY IF EXISTS "games_public_read" ON games;
DROP POLICY IF EXISTS "game_levels_public_read" ON game_levels;
DROP POLICY IF EXISTS "videos_public_read" ON videos;

CREATE POLICY "families_select_own" ON families
  FOR SELECT USING ((SELECT auth.uid()) = auth_user_id);

CREATE POLICY "families_insert_own" ON families
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = auth_user_id);

CREATE POLICY "families_update_own" ON families
  FOR UPDATE
  USING ((SELECT auth.uid()) = auth_user_id)
  WITH CHECK ((SELECT auth.uid()) = auth_user_id);

CREATE POLICY "families_delete_own" ON families
  FOR DELETE USING ((SELECT auth.uid()) = auth_user_id);

CREATE POLICY "children_select_own" ON children
  FOR SELECT USING (
    family_id IN (SELECT id FROM families WHERE auth_user_id = (SELECT auth.uid()))
  );

CREATE POLICY "children_insert_own" ON children
  FOR INSERT WITH CHECK (
    family_id IN (SELECT id FROM families WHERE auth_user_id = (SELECT auth.uid()))
  );

CREATE POLICY "children_update_own" ON children
  FOR UPDATE
  USING (
    family_id IN (SELECT id FROM families WHERE auth_user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    family_id IN (SELECT id FROM families WHERE auth_user_id = (SELECT auth.uid()))
  );

CREATE POLICY "children_delete_own" ON children
  FOR DELETE USING (
    family_id IN (SELECT id FROM families WHERE auth_user_id = (SELECT auth.uid()))
  );

CREATE POLICY "progress_select_own" ON progress
  FOR SELECT USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "progress_insert_own" ON progress
  FOR INSERT WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "progress_update_own" ON progress
  FOR UPDATE
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "progress_delete_own" ON progress
  FOR DELETE USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "video_progress_select_own" ON video_progress
  FOR SELECT USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "video_progress_insert_own" ON video_progress
  FOR INSERT WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "video_progress_update_own" ON video_progress
  FOR UPDATE
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "video_progress_delete_own" ON video_progress
  FOR DELETE USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "topics_public_read" ON topics FOR SELECT USING (true);
CREATE POLICY "age_groups_public_read" ON age_groups FOR SELECT USING (true);
CREATE POLICY "games_public_read" ON games FOR SELECT USING (is_published = true);
CREATE POLICY "game_levels_public_read" ON game_levels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = game_levels.game_id AND g.is_published = true
    )
  );
CREATE POLICY "videos_public_read" ON videos FOR SELECT USING (is_published = true);

-- ---------------------------------------------------------------------------
-- Ownership / read-path indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_children_family_id ON children (family_id);
CREATE INDEX IF NOT EXISTS idx_progress_child_id ON progress (child_id);
CREATE INDEX IF NOT EXISTS idx_progress_game_id ON progress (game_id);
CREATE INDEX IF NOT EXISTS idx_progress_child_game ON progress (child_id, game_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_child_id ON video_progress (child_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_video_id ON video_progress (video_id);
CREATE INDEX IF NOT EXISTS idx_families_auth_user_id ON families (auth_user_id);

-- ---------------------------------------------------------------------------
-- Append-only progress: sessions, attempts, rollups
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  client_session_id TEXT,
  device_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_game_sessions_child_client_session
  ON game_sessions (child_id, client_session_id)
  WHERE client_session_id IS NOT NULL AND btrim(client_session_id) <> '';

CREATE INDEX IF NOT EXISTS idx_game_sessions_child_started
  ON game_sessions (child_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_sessions_game_started
  ON game_sessions (game_id, started_at DESC);

CREATE TABLE IF NOT EXISTS game_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  level_id UUID REFERENCES game_levels(id) ON DELETE SET NULL,
  attempt_index INT NOT NULL DEFAULT 0,
  score INT NOT NULL DEFAULT 0,
  stars INT NOT NULL DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  duration_ms INT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_attempts_session_id ON game_attempts (session_id);
CREATE INDEX IF NOT EXISTS idx_game_attempts_child_game_created
  ON game_attempts (child_id, game_id, created_at DESC);

CREATE TABLE IF NOT EXISTS child_game_summaries (
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  total_sessions INT NOT NULL DEFAULT 0,
  total_attempts INT NOT NULL DEFAULT 0,
  best_score INT NOT NULL DEFAULT 0,
  best_stars INT NOT NULL DEFAULT 0 CHECK (best_stars BETWEEN 0 AND 3),
  last_played_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id, game_id)
);

-- Clients read rollups; writes only via SECURITY DEFINER triggers.
REVOKE INSERT, UPDATE, DELETE ON child_game_summaries FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON child_game_summaries FROM anon;

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_game_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_sessions_select_own" ON game_sessions
  FOR SELECT USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "game_sessions_insert_own" ON game_sessions
  FOR INSERT WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "game_sessions_update_own" ON game_sessions
  FOR UPDATE
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "game_attempts_select_own" ON game_attempts
  FOR SELECT USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "game_attempts_insert_own" ON game_attempts
  FOR INSERT WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "child_game_summaries_select_own" ON child_game_summaries
  FOR SELECT USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Integrity: attempt.child_id / game_id must match session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION dubiland_enforce_attempt_matches_session()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  s_child UUID;
  s_game UUID;
BEGIN
  SELECT child_id, game_id INTO s_child, s_game
  FROM game_sessions
  WHERE id = NEW.session_id;

  IF s_child IS NULL THEN
    RAISE EXCEPTION 'game_attempts: session % not found', NEW.session_id;
  END IF;

  IF NEW.child_id IS DISTINCT FROM s_child OR NEW.game_id IS DISTINCT FROM s_game THEN
    RAISE EXCEPTION 'game_attempts: child_id/game_id must match session';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_game_attempts_match_session ON game_attempts;
CREATE TRIGGER trg_game_attempts_match_session
  BEFORE INSERT ON game_attempts
  FOR EACH ROW EXECUTE FUNCTION dubiland_enforce_attempt_matches_session();

-- ---------------------------------------------------------------------------
-- Rollup maintenance (trusted writer; bypasses RLS as definer)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION dubiland_refresh_summary_from_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO child_game_summaries AS s (
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
    1,
    0,
    0,
    0,
    NEW.started_at,
    now()
  )
  ON CONFLICT (child_id, game_id) DO UPDATE SET
    total_sessions = s.total_sessions + 1,
    last_played_at = GREATEST(s.last_played_at, EXCLUDED.last_played_at),
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION dubiland_refresh_summary_from_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO child_game_summaries AS s (
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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_game_sessions_refresh_summary ON game_sessions;
CREATE TRIGGER trg_game_sessions_refresh_summary
  AFTER INSERT ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION dubiland_refresh_summary_from_session();

DROP TRIGGER IF EXISTS trg_game_attempts_refresh_summary ON game_attempts;
CREATE TRIGGER trg_game_attempts_refresh_summary
  AFTER INSERT ON game_attempts
  FOR EACH ROW EXECUTE FUNCTION dubiland_refresh_summary_from_attempt();
