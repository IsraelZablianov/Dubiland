-- DUB-444: Publish launch-trio handbooks, widen interactiveHandbook catalog age reach, align ladder book4 slug with app + 00020.
--
-- (1) 00019 seeded mikaSoundGarden / yoavLetterMap / tamarWordTower with is_published=false for QA; flip to true for live read path + child progress FK.
-- (2) interactiveHandbook had primary age 4-5 + support 5-6/6-7 only (00013) — add support tag age.primary.3-4 so 3–4 profiles see the game on Home/catalog.
-- (3) 00018 set readingLadder.books.book4.handbookSlug to yoavLetterMap; app + 00020 use magicLetterMap for the illustrated letter-map slot — normalize DB JSON.
--
-- Rollback (manual):
--   UPDATE public.handbooks SET is_published = false
--   WHERE slug IN ('mikaSoundGarden','yoavLetterMap','tamarWordTower');
--   DELETE FROM public.game_tag_assignments gta
--   USING public.games g, public.tag_dimensions d, public.tags t
--   WHERE gta.game_id = g.id AND g.slug = 'interactiveHandbook'
--     AND t.id = gta.tag_id AND d.id = t.dimension_id AND d.slug = 'age'
--     AND t.slug = 'age.primary.3-4' AND gta.assignment_role = 'support';
--   -- Revert book4 slug only if needed:
--   UPDATE public.game_levels gl SET config_json = jsonb_set(
--     gl.config_json, ARRAY['readingLadder','books','book4','handbookSlug'], to_jsonb('yoavLetterMap'::text), true
--   ) FROM public.games g
--   WHERE g.id = gl.game_id AND g.slug = 'interactiveHandbook' AND gl.level_number = 1;

-- ---------------------------------------------------------------------------
-- 1) Publish launch trio
-- ---------------------------------------------------------------------------
UPDATE public.handbooks
SET is_published = true
WHERE slug IN ('mikaSoundGarden', 'yoavLetterMap', 'tamarWordTower');

-- ---------------------------------------------------------------------------
-- 2) Catalog: 3–4 support tag for interactiveHandbook (idempotent)
-- ---------------------------------------------------------------------------
INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'support'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'age'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'age.primary.3-4'
WHERE g.slug = 'interactiveHandbook'
ON CONFLICT (game_id, tag_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) Align reading ladder book4 handbook slug with InteractiveHandbook.tsx + 00020
-- ---------------------------------------------------------------------------
UPDATE public.game_levels AS gl
SET config_json = jsonb_set(
  COALESCE(gl.config_json, '{}'::jsonb),
  ARRAY['readingLadder', 'books', 'book4', 'handbookSlug'],
  to_jsonb('magicLetterMap'::text),
  true
)
FROM public.games AS g
WHERE g.id = gl.game_id
  AND g.slug = 'interactiveHandbook'
  AND gl.level_number = 1;
