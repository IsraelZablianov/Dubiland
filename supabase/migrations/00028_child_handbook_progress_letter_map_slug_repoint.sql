-- DUB-660: Restore `child_handbook_progress` for the illustrated letter-map handbook after slug split.
--
-- Context: 00019 seeded `yoavLetterMap`; 00020 added `magicLetterMap`; 00022 aligned catalog/game_levels
-- to `magicLetterMap` for book4. The client hydrates progress by `handbooks.slug = 'magicLetterMap'`.
-- Rows still keyed to `yoavLetterMap` handbook UUID are invisible on read → reload appears to reset
-- to page 1 even when a progress row exists.
--
-- Rollback (manual — only if re-seeding yoav progress from backups):
--   Not automatically reversible; restore from snapshot if required.

DO $$
DECLARE
  yoav_id uuid;
  magic_id uuid;
BEGIN
  SELECT id INTO yoav_id FROM public.handbooks WHERE slug = 'yoavLetterMap' LIMIT 1;
  SELECT id INTO magic_id FROM public.handbooks WHERE slug = 'magicLetterMap' LIMIT 1;

  IF yoav_id IS NULL OR magic_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.child_handbook_progress (
    child_id,
    handbook_id,
    furthest_page_number,
    completed,
    page_completion_json,
    last_opened_at
  )
  SELECT
    p.child_id,
    magic_id,
    p.furthest_page_number,
    p.completed,
    p.page_completion_json,
    p.last_opened_at
  FROM public.child_handbook_progress AS p
  WHERE p.handbook_id = yoav_id
  ON CONFLICT (child_id, handbook_id) DO UPDATE SET
    furthest_page_number = GREATEST(
      public.child_handbook_progress.furthest_page_number,
      EXCLUDED.furthest_page_number
    ),
    completed = public.child_handbook_progress.completed OR EXCLUDED.completed,
    page_completion_json = EXCLUDED.page_completion_json || public.child_handbook_progress.page_completion_json,
    last_opened_at = GREATEST(
      public.child_handbook_progress.last_opened_at,
      EXCLUDED.last_opened_at
    ),
    updated_at = now();

  DELETE FROM public.child_handbook_progress AS p WHERE p.handbook_id = yoav_id;
END $$;
