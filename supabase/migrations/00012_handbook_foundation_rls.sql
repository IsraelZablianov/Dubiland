-- Interactive handbooks foundation (DUB-330 / DUB-325).
-- Spec: docs/architecture/2026-04-10-handbook-architecture.md
--
-- Rollback (manual — dev/staging only):
--   DROP TABLE IF EXISTS public.child_handbook_progress;
--   DROP TABLE IF EXISTS public.handbook_media_assets;
--   DROP TABLE IF EXISTS public.handbook_pages;
--   DROP TABLE IF EXISTS public.handbooks;

-- ---------------------------------------------------------------------------
-- Catalog: handbook → pages → media inventory
-- ---------------------------------------------------------------------------
CREATE TABLE public.handbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics (id) ON DELETE RESTRICT,
  age_group_id UUID NOT NULL REFERENCES public.age_groups (id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  title_key TEXT NOT NULL,
  description_key TEXT,
  theme_slug TEXT NOT NULL DEFAULT 'bear',
  cover_thumbnail_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  content_schema_version INT NOT NULL DEFAULT 1,
  preload_manifest_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX handbooks_topic_sort_idx ON public.handbooks (topic_id, sort_order);
CREATE INDEX handbooks_published_sort_idx ON public.handbooks (is_published, sort_order)
  WHERE is_published = true;

CREATE TABLE public.handbook_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handbook_id UUID NOT NULL REFERENCES public.handbooks (id) ON DELETE CASCADE,
  page_number INT NOT NULL CHECK (page_number >= 1),
  layout_kind TEXT NOT NULL DEFAULT 'picture_book'
    CHECK (layout_kind IN ('picture_book', 'comic_strip', 'freeform')),
  blocks_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  interactions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  narration_key TEXT,
  estimated_read_sec INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (handbook_id, page_number)
);

CREATE INDEX handbook_pages_handbook_page_idx ON public.handbook_pages (handbook_id, page_number);

CREATE TABLE public.handbook_media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handbook_id UUID NOT NULL REFERENCES public.handbooks (id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'audio', 'video', 'vector')),
  mime_type TEXT,
  byte_length INT,
  width_px INT,
  height_px INT,
  duration_ms INT,
  checksum_sha256 TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (handbook_id, storage_path)
);

CREATE INDEX handbook_media_assets_handbook_idx ON public.handbook_media_assets (handbook_id);

-- ---------------------------------------------------------------------------
-- Per-child reading progress (family-scoped)
-- ---------------------------------------------------------------------------
CREATE TABLE public.child_handbook_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children (id) ON DELETE CASCADE,
  handbook_id UUID NOT NULL REFERENCES public.handbooks (id) ON DELETE CASCADE,
  furthest_page_number INT NOT NULL DEFAULT 0 CHECK (furthest_page_number >= 0),
  completed BOOLEAN NOT NULL DEFAULT false,
  page_completion_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, handbook_id)
);

CREATE INDEX child_handbook_progress_child_idx ON public.child_handbook_progress (child_id);
CREATE INDEX child_handbook_progress_handbook_idx ON public.child_handbook_progress (handbook_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers (reuse shared helper from 00006)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_handbooks_updated_at ON public.handbooks;
CREATE TRIGGER trg_handbooks_updated_at
  BEFORE UPDATE ON public.handbooks
  FOR EACH ROW EXECUTE FUNCTION dubiland_set_updated_at();

DROP TRIGGER IF EXISTS trg_handbook_pages_updated_at ON public.handbook_pages;
CREATE TRIGGER trg_handbook_pages_updated_at
  BEFORE UPDATE ON public.handbook_pages
  FOR EACH ROW EXECUTE FUNCTION dubiland_set_updated_at();

DROP TRIGGER IF EXISTS trg_child_handbook_progress_updated_at ON public.child_handbook_progress;
CREATE TRIGGER trg_child_handbook_progress_updated_at
  BEFORE UPDATE ON public.child_handbook_progress
  FOR EACH ROW EXECUTE FUNCTION dubiland_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.handbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handbook_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handbook_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_handbook_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "handbooks_public_select_published" ON public.handbooks
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "handbook_pages_public_select_published" ON public.handbook_pages
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.handbooks h
      WHERE h.id = handbook_pages.handbook_id AND h.is_published = true
    )
  );

CREATE POLICY "handbook_media_assets_public_select_published" ON public.handbook_media_assets
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.handbooks h
      WHERE h.id = handbook_media_assets.handbook_id AND h.is_published = true
    )
  );

CREATE POLICY "child_handbook_progress_select_own" ON public.child_handbook_progress
  FOR SELECT USING (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "child_handbook_progress_insert_own" ON public.child_handbook_progress
  FOR INSERT WITH CHECK (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "child_handbook_progress_update_own" ON public.child_handbook_progress
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

CREATE POLICY "child_handbook_progress_delete_own" ON public.child_handbook_progress
  FOR DELETE USING (
    child_id IN (
      SELECT c.id FROM public.children c
      JOIN public.families f ON c.family_id = f.id
      WHERE f.auth_user_id = (SELECT auth.uid())
    )
  );
