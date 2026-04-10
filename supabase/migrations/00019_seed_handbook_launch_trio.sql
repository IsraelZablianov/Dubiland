-- Launch trio handbook content packs (DUB-397).
-- Version: 00019 (00018 is handbook reading-ladder runtime gates).
-- Depends: 00001 (topics, age_groups), 00012 (handbooks, pages, media).
--
-- CTO rollout aliases (docs/architecture/2026-04-10-handbook-launch-trio-technical-rollout.md):
--   3-4 "bouncy-balloon"  -> handbooks.slug mikaSoundGarden
--   5-6 "magic-letter-map" -> handbooks.slug yoavLetterMap
--   6-7 "star-message"    -> handbooks.slug tamarWordTower
--
-- i18n roots: handbooks.<slug>.* (packages/web/src/i18n/locales/he/common.json).
-- Static audio: /audio/he/handbooks/<kebab>/... (yoav paths are forward-looking; upsert is safe).
--
-- is_published = false until QA signoff (rollout §4). Flip to true when ready for anon/authenticated read RLS path.
--
-- Rollback (manual):
--   DELETE FROM public.handbook_media_assets WHERE handbook_id IN (SELECT id FROM public.handbooks WHERE slug IN ('mikaSoundGarden','yoavLetterMap','tamarWordTower'));
--   DELETE FROM public.handbook_pages WHERE handbook_id IN (SELECT id FROM public.handbooks WHERE slug IN ('mikaSoundGarden','yoavLetterMap','tamarWordTower'));
--   DELETE FROM public.handbooks WHERE slug IN ('mikaSoundGarden','yoavLetterMap','tamarWordTower');

-- ---------------------------------------------------------------------------
-- mikaSoundGarden — age 3–4
-- ---------------------------------------------------------------------------
INSERT INTO public.handbooks (
  topic_id,
  age_group_id,
  slug,
  title_key,
  description_key,
  theme_slug,
  cover_thumbnail_url,
  sort_order,
  is_published,
  content_schema_version,
  preload_manifest_json
)
SELECT
  t.id,
  ag.id,
  'mikaSoundGarden',
  'handbooks.mikaSoundGarden.meta.title',
  'handbooks.mikaSoundGarden.meta.subtitle',
  'bear',
  NULL,
  10,
  false,
  1,
  jsonb_build_object(
    'version', 1,
    'critical', jsonb_build_array(
      jsonb_build_object('path', '/audio/he/handbooks/mika-sound-garden/script-package/narration/intro.mp3', 'kind', 'audio'),
      jsonb_build_object('path', '/audio/he/handbooks/mika-sound-garden/script-package/narration/checkpoint.mp3', 'kind', 'audio'),
      jsonb_build_object('path', '/audio/he/handbooks/mika-sound-garden/meta/title.mp3', 'kind', 'audio')
    ),
    'pages', '{}'::jsonb
  )
FROM public.topics t
CROSS JOIN public.age_groups ag
WHERE t.slug = 'reading'
  AND ag.min_age = 3
  AND ag.max_age = 4
  AND NOT EXISTS (
    SELECT 1 FROM public.handbooks h WHERE h.slug = 'mikaSoundGarden'
  );

INSERT INTO public.handbook_pages (
  handbook_id,
  page_number,
  layout_kind,
  blocks_json,
  interactions_json,
  narration_key,
  estimated_read_sec
)
SELECT h.id, v.page_number, 'picture_book', '[]'::jsonb, '[]'::jsonb, v.narration_key, v.est_sec
FROM public.handbooks h
CROSS JOIN (
  VALUES
    (1, 'handbooks.mikaSoundGarden.scriptPackage.narration.intro', 40),
    (2, 'handbooks.mikaSoundGarden.scriptPackage.narration.checkpoint', 35),
    (3, 'handbooks.mikaSoundGarden.scriptPackage.narration.transition', 30),
    (4, 'handbooks.mikaSoundGarden.scriptPackage.narration.outro', 40),
    (5, 'handbooks.mikaSoundGarden.sentenceBank.modeledPhrases.p01', 35),
    (6, 'handbooks.mikaSoundGarden.sentenceBank.modeledPhrases.p02', 35),
    (7, 'handbooks.mikaSoundGarden.sentenceBank.modeledPhrases.p03', 35),
    (8, 'handbooks.mikaSoundGarden.sentenceBank.modeledPhrases.p04', 35)
) AS v(page_number, narration_key, est_sec)
WHERE h.slug = 'mikaSoundGarden'
  AND NOT EXISTS (
    SELECT 1 FROM public.handbook_pages p
    WHERE p.handbook_id = h.id AND p.page_number = v.page_number
  );

INSERT INTO public.handbook_media_assets (handbook_id, storage_path, kind, sort_order)
SELECT h.id, x.path, 'audio', x.ord
FROM public.handbooks h
CROSS JOIN (
  VALUES
    (1, '/audio/he/handbooks/mika-sound-garden/script-package/narration/intro.mp3'),
    (2, '/audio/he/handbooks/mika-sound-garden/script-package/narration/checkpoint.mp3'),
    (3, '/audio/he/handbooks/mika-sound-garden/script-package/narration/transition.mp3'),
    (4, '/audio/he/handbooks/mika-sound-garden/script-package/narration/outro.mp3'),
    (5, '/audio/he/handbooks/mika-sound-garden/sentence-bank/modeled-phrases/p01.mp3'),
    (6, '/audio/he/handbooks/mika-sound-garden/sentence-bank/modeled-phrases/p02.mp3'),
    (7, '/audio/he/handbooks/mika-sound-garden/sentence-bank/modeled-phrases/p03.mp3'),
    (8, '/audio/he/handbooks/mika-sound-garden/sentence-bank/modeled-phrases/p04.mp3'),
    (9, '/audio/he/handbooks/mika-sound-garden/meta/title.mp3')
) AS x(ord, path)
WHERE h.slug = 'mikaSoundGarden'
ON CONFLICT (handbook_id, storage_path) DO NOTHING;

-- ---------------------------------------------------------------------------
-- yoavLetterMap — age 5–6 (audio tree may be generated after this seed)
-- ---------------------------------------------------------------------------
INSERT INTO public.handbooks (
  topic_id,
  age_group_id,
  slug,
  title_key,
  description_key,
  theme_slug,
  cover_thumbnail_url,
  sort_order,
  is_published,
  content_schema_version,
  preload_manifest_json
)
SELECT
  t.id,
  ag.id,
  'yoavLetterMap',
  'handbooks.yoavLetterMap.meta.title',
  'handbooks.yoavLetterMap.meta.subtitle',
  'bear',
  NULL,
  20,
  false,
  1,
  jsonb_build_object(
    'version', 1,
    'critical', jsonb_build_array(
      jsonb_build_object('path', '/audio/he/handbooks/yoav-letter-map/script-package/narration/intro.mp3', 'kind', 'audio'),
      jsonb_build_object('path', '/audio/he/handbooks/yoav-letter-map/script-package/narration/checkpoint.mp3', 'kind', 'audio'),
      jsonb_build_object('path', '/audio/he/handbooks/yoav-letter-map/meta/title.mp3', 'kind', 'audio')
    ),
    'pages', '{}'::jsonb
  )
FROM public.topics t
CROSS JOIN public.age_groups ag
WHERE t.slug = 'reading'
  AND ag.min_age = 5
  AND ag.max_age = 6
  AND NOT EXISTS (
    SELECT 1 FROM public.handbooks h WHERE h.slug = 'yoavLetterMap'
  );

INSERT INTO public.handbook_pages (
  handbook_id,
  page_number,
  layout_kind,
  blocks_json,
  interactions_json,
  narration_key,
  estimated_read_sec
)
SELECT h.id, v.page_number, 'picture_book', '[]'::jsonb, '[]'::jsonb, v.narration_key, v.est_sec
FROM public.handbooks h
CROSS JOIN (
  VALUES
    (1, 'handbooks.yoavLetterMap.scriptPackage.narration.intro', 45),
    (2, 'handbooks.yoavLetterMap.scriptPackage.narration.checkpoint', 40),
    (3, 'handbooks.yoavLetterMap.scriptPackage.narration.transition', 35),
    (4, 'handbooks.yoavLetterMap.scriptPackage.narration.outro', 45),
    (5, 'handbooks.yoavLetterMap.sentenceBank.pointedPhrases.p01', 40),
    (6, 'handbooks.yoavLetterMap.sentenceBank.pointedPhrases.p02', 40),
    (7, 'handbooks.yoavLetterMap.sentenceBank.pointedPhrases.p03', 40),
    (8, 'handbooks.yoavLetterMap.sentenceBank.pointedPhrases.p04', 40),
    (9, 'handbooks.yoavLetterMap.sentenceBank.pointedPhrases.p05', 40),
    (10, 'handbooks.yoavLetterMap.sentenceBank.pointedPhrases.p06', 40),
    (11, 'handbooks.yoavLetterMap.sentenceBank.pointedPhrases.p07', 40),
    (12, 'handbooks.yoavLetterMap.sentenceBank.pointedPhrases.p08', 40)
) AS v(page_number, narration_key, est_sec)
WHERE h.slug = 'yoavLetterMap'
  AND NOT EXISTS (
    SELECT 1 FROM public.handbook_pages p
    WHERE p.handbook_id = h.id AND p.page_number = v.page_number
  );

INSERT INTO public.handbook_media_assets (handbook_id, storage_path, kind, sort_order)
SELECT h.id, x.path, 'audio', x.ord
FROM public.handbooks h
CROSS JOIN (
  VALUES
    (1, '/audio/he/handbooks/yoav-letter-map/script-package/narration/intro.mp3'),
    (2, '/audio/he/handbooks/yoav-letter-map/script-package/narration/checkpoint.mp3'),
    (3, '/audio/he/handbooks/yoav-letter-map/script-package/narration/transition.mp3'),
    (4, '/audio/he/handbooks/yoav-letter-map/script-package/narration/outro.mp3'),
    (5, '/audio/he/handbooks/yoav-letter-map/sentence-bank/pointed-phrases/p01.mp3'),
    (6, '/audio/he/handbooks/yoav-letter-map/sentence-bank/pointed-phrases/p02.mp3'),
    (7, '/audio/he/handbooks/yoav-letter-map/sentence-bank/pointed-phrases/p03.mp3'),
    (8, '/audio/he/handbooks/yoav-letter-map/sentence-bank/pointed-phrases/p04.mp3'),
    (9, '/audio/he/handbooks/yoav-letter-map/meta/title.mp3')
) AS x(ord, path)
WHERE h.slug = 'yoavLetterMap'
ON CONFLICT (handbook_id, storage_path) DO NOTHING;

-- ---------------------------------------------------------------------------
-- tamarWordTower — age 6–7
-- ---------------------------------------------------------------------------
INSERT INTO public.handbooks (
  topic_id,
  age_group_id,
  slug,
  title_key,
  description_key,
  theme_slug,
  cover_thumbnail_url,
  sort_order,
  is_published,
  content_schema_version,
  preload_manifest_json
)
SELECT
  t.id,
  ag.id,
  'tamarWordTower',
  'handbooks.tamarWordTower.meta.title',
  'handbooks.tamarWordTower.meta.subtitle',
  'bear',
  NULL,
  30,
  false,
  1,
  jsonb_build_object(
    'version', 1,
    'critical', jsonb_build_array(
      jsonb_build_object('path', '/audio/he/handbooks/tamar-word-tower/script-package/narration/intro.mp3', 'kind', 'audio'),
      jsonb_build_object('path', '/audio/he/handbooks/tamar-word-tower/script-package/narration/checkpoint.mp3', 'kind', 'audio'),
      jsonb_build_object('path', '/audio/he/handbooks/tamar-word-tower/meta/title.mp3', 'kind', 'audio')
    ),
    'pages', '{}'::jsonb
  )
FROM public.topics t
CROSS JOIN public.age_groups ag
WHERE t.slug = 'reading'
  AND ag.min_age = 6
  AND ag.max_age = 7
  AND NOT EXISTS (
    SELECT 1 FROM public.handbooks h WHERE h.slug = 'tamarWordTower'
  );

INSERT INTO public.handbook_pages (
  handbook_id,
  page_number,
  layout_kind,
  blocks_json,
  interactions_json,
  narration_key,
  estimated_read_sec
)
SELECT h.id, v.page_number, 'picture_book', '[]'::jsonb, '[]'::jsonb, v.narration_key, v.est_sec
FROM public.handbooks h
CROSS JOIN (
  VALUES
    (1, 'handbooks.tamarWordTower.scriptPackage.narration.intro', 50),
    (2, 'handbooks.tamarWordTower.scriptPackage.narration.checkpoint', 45),
    (3, 'handbooks.tamarWordTower.scriptPackage.narration.transition', 40),
    (4, 'handbooks.tamarWordTower.scriptPackage.narration.outro', 50),
    (5, 'handbooks.tamarWordTower.sentenceBank.pointedPhrases.p01', 45),
    (6, 'handbooks.tamarWordTower.sentenceBank.pointedPhrases.p02', 45),
    (7, 'handbooks.tamarWordTower.sentenceBank.pointedPhrases.p03', 45),
    (8, 'handbooks.tamarWordTower.sentenceBank.pointedPhrases.p04', 45),
    (9, 'handbooks.tamarWordTower.sentenceBank.pointedPhrases.p05', 45),
    (10, 'handbooks.tamarWordTower.sentenceBank.bridgePhrases.b01', 50),
    (11, 'handbooks.tamarWordTower.sentenceBank.bridgePhrases.b02', 50),
    (12, 'handbooks.tamarWordTower.sentenceBank.bridgePhrases.b03', 50),
    (13, 'handbooks.tamarWordTower.sentenceBank.bridgePhrases.b04', 50),
    (14, 'handbooks.tamarWordTower.sentenceBank.bridgePhrases.b05', 50)
) AS v(page_number, narration_key, est_sec)
WHERE h.slug = 'tamarWordTower'
  AND NOT EXISTS (
    SELECT 1 FROM public.handbook_pages p
    WHERE p.handbook_id = h.id AND p.page_number = v.page_number
  );

INSERT INTO public.handbook_media_assets (handbook_id, storage_path, kind, sort_order)
SELECT h.id, x.path, 'audio', x.ord
FROM public.handbooks h
CROSS JOIN (
  VALUES
    (1, '/audio/he/handbooks/tamar-word-tower/script-package/narration/intro.mp3'),
    (2, '/audio/he/handbooks/tamar-word-tower/script-package/narration/checkpoint.mp3'),
    (3, '/audio/he/handbooks/tamar-word-tower/script-package/narration/transition.mp3'),
    (4, '/audio/he/handbooks/tamar-word-tower/script-package/narration/outro.mp3'),
    (5, '/audio/he/handbooks/tamar-word-tower/sentence-bank/pointed-phrases/p01.mp3'),
    (6, '/audio/he/handbooks/tamar-word-tower/sentence-bank/pointed-phrases/p02.mp3'),
    (7, '/audio/he/handbooks/tamar-word-tower/sentence-bank/pointed-phrases/p03.mp3'),
    (8, '/audio/he/handbooks/tamar-word-tower/sentence-bank/pointed-phrases/p04.mp3'),
    (9, '/audio/he/handbooks/tamar-word-tower/sentence-bank/pointed-phrases/p05.mp3'),
    (10, '/audio/he/handbooks/tamar-word-tower/sentence-bank/bridge-phrases/b01.mp3'),
    (11, '/audio/he/handbooks/tamar-word-tower/sentence-bank/bridge-phrases/b02.mp3'),
    (12, '/audio/he/handbooks/tamar-word-tower/sentence-bank/bridge-phrases/b03.mp3'),
    (13, '/audio/he/handbooks/tamar-word-tower/sentence-bank/bridge-phrases/b04.mp3'),
    (14, '/audio/he/handbooks/tamar-word-tower/sentence-bank/bridge-phrases/b05.mp3'),
    (15, '/audio/he/handbooks/tamar-word-tower/meta/title.mp3')
) AS x(ord, path)
WHERE h.slug = 'tamarWordTower'
ON CONFLICT (handbook_id, storage_path) DO NOTHING;
