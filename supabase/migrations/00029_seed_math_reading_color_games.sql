-- DUB-687: Catalog rows for shipped games that previously only had local stub IDs in the web app.
-- Aligns with packages/web/src/pages/* static Game objects (slugs, i18n keys, audio, thumbnails).
--
-- Rollback (manual, dev/staging):
--   DELETE FROM public.game_levels WHERE game_id IN (SELECT id FROM public.games WHERE slug IN (
--     'countingPicnic', 'moreOrLessMarket', 'shapeSafari', 'colorGarden', 'pictureToWordBuilder'
--   ));
--   DELETE FROM public.games WHERE slug IN (
--     'countingPicnic', 'moreOrLessMarket', 'shapeSafari', 'colorGarden', 'pictureToWordBuilder'
--   );

-- ---------------------------------------------------------------------------
-- countingPicnic — math, ages 3–4
-- ---------------------------------------------------------------------------
WITH topic AS (
  SELECT id FROM public.topics WHERE slug = 'math' LIMIT 1
),
age_group AS (
  SELECT id FROM public.age_groups WHERE min_age = 3 AND max_age = 4 LIMIT 1
),
inserted_game AS (
  INSERT INTO public.games (
    id,
    topic_id,
    age_group_id,
    slug,
    name_key,
    description_key,
    game_type,
    component_key,
    difficulty,
    sort_order,
    thumbnail_url,
    audio_url,
    is_published
  )
  SELECT
    gen_random_uuid(),
    topic.id,
    age_group.id,
    'countingPicnic',
    'games.countingPicnic.title',
    'games.countingPicnic.subtitle',
    'drag_drop',
    'CountingPicnicGame',
    2,
    1,
    '/images/games/thumbnails/countingPicnic/thumb-16x10.webp',
    '/audio/he/games/counting-picnic/instructions/intro.mp3',
    true
  FROM topic, age_group
  WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE slug = 'countingPicnic')
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id FROM public.games WHERE slug = 'countingPicnic'
)
INSERT INTO public.game_levels (id, game_id, level_number, config_json, sort_order)
SELECT
  gen_random_uuid(),
  resolved_game.id,
  1,
  '{"adaptive": true, "rounds": 8}'::jsonb,
  1
FROM resolved_game
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_levels gl
  WHERE gl.game_id = resolved_game.id AND gl.level_number = 1
);

-- ---------------------------------------------------------------------------
-- moreOrLessMarket — math, ages 5–6
-- ---------------------------------------------------------------------------
WITH topic AS (
  SELECT id FROM public.topics WHERE slug = 'math' LIMIT 1
),
age_group AS (
  SELECT id FROM public.age_groups WHERE min_age = 5 AND max_age = 6 LIMIT 1
),
inserted_game AS (
  INSERT INTO public.games (
    id,
    topic_id,
    age_group_id,
    slug,
    name_key,
    description_key,
    game_type,
    component_key,
    difficulty,
    sort_order,
    thumbnail_url,
    audio_url,
    is_published
  )
  SELECT
    gen_random_uuid(),
    topic.id,
    age_group.id,
    'moreOrLessMarket',
    'games.moreOrLessMarket.title',
    'games.moreOrLessMarket.subtitle',
    'match',
    'MoreOrLessMarketGame',
    3,
    2,
    NULL,
    '/audio/he/games/more-or-less-market/instructions/intro.mp3',
    true
  FROM topic, age_group
  WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE slug = 'moreOrLessMarket')
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id FROM public.games WHERE slug = 'moreOrLessMarket'
)
INSERT INTO public.game_levels (id, game_id, level_number, config_json, sort_order)
SELECT
  gen_random_uuid(),
  resolved_game.id,
  1,
  '{"adaptive": true, "rounds": 8}'::jsonb,
  1
FROM resolved_game
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_levels gl
  WHERE gl.game_id = resolved_game.id AND gl.level_number = 1
);

-- ---------------------------------------------------------------------------
-- shapeSafari — math, ages 4–5
-- ---------------------------------------------------------------------------
WITH topic AS (
  SELECT id FROM public.topics WHERE slug = 'math' LIMIT 1
),
age_group AS (
  SELECT id FROM public.age_groups WHERE min_age = 4 AND max_age = 5 LIMIT 1
),
inserted_game AS (
  INSERT INTO public.games (
    id,
    topic_id,
    age_group_id,
    slug,
    name_key,
    description_key,
    game_type,
    component_key,
    difficulty,
    sort_order,
    thumbnail_url,
    audio_url,
    is_published
  )
  SELECT
    gen_random_uuid(),
    topic.id,
    age_group.id,
    'shapeSafari',
    'games.shapeSafari.title',
    'games.shapeSafari.subtitle',
    'drag_drop',
    'ShapeSafariGame',
    2,
    3,
    NULL,
    '/audio/he/games/shape-safari/instructions/intro.mp3',
    true
  FROM topic, age_group
  WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE slug = 'shapeSafari')
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id FROM public.games WHERE slug = 'shapeSafari'
)
INSERT INTO public.game_levels (id, game_id, level_number, config_json, sort_order)
SELECT
  gen_random_uuid(),
  resolved_game.id,
  1,
  '{"adaptive": true, "rounds": 8}'::jsonb,
  1
FROM resolved_game
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_levels gl
  WHERE gl.game_id = resolved_game.id AND gl.level_number = 1
);

-- ---------------------------------------------------------------------------
-- colorGarden — same learning surface as app stub (topic math), ages 3–4
-- ---------------------------------------------------------------------------
WITH topic AS (
  SELECT id FROM public.topics WHERE slug = 'math' LIMIT 1
),
age_group AS (
  SELECT id FROM public.age_groups WHERE min_age = 3 AND max_age = 4 LIMIT 1
),
inserted_game AS (
  INSERT INTO public.games (
    id,
    topic_id,
    age_group_id,
    slug,
    name_key,
    description_key,
    game_type,
    component_key,
    difficulty,
    sort_order,
    thumbnail_url,
    audio_url,
    is_published
  )
  SELECT
    gen_random_uuid(),
    topic.id,
    age_group.id,
    'colorGarden',
    'games.colorGarden.title',
    'games.colorGarden.subtitle',
    'match',
    'ColorGardenGame',
    2,
    2,
    '/images/games/thumbnails/colorGarden/thumb-16x10.webp',
    '/audio/he/games/color-garden/instructions/intro.mp3',
    true
  FROM topic, age_group
  WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE slug = 'colorGarden')
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id FROM public.games WHERE slug = 'colorGarden'
)
INSERT INTO public.game_levels (id, game_id, level_number, config_json, sort_order)
SELECT
  gen_random_uuid(),
  resolved_game.id,
  1,
  '{"adaptive": true, "rounds": 6}'::jsonb,
  1
FROM resolved_game
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_levels gl
  WHERE gl.game_id = resolved_game.id AND gl.level_number = 1
);

-- ---------------------------------------------------------------------------
-- pictureToWordBuilder — reading, ages 5–6
-- ---------------------------------------------------------------------------
WITH topic AS (
  SELECT id FROM public.topics WHERE slug = 'reading' LIMIT 1
),
age_group AS (
  SELECT id FROM public.age_groups WHERE min_age = 5 AND max_age = 6 LIMIT 1
),
inserted_game AS (
  INSERT INTO public.games (
    id,
    topic_id,
    age_group_id,
    slug,
    name_key,
    description_key,
    game_type,
    component_key,
    difficulty,
    sort_order,
    thumbnail_url,
    audio_url,
    is_published
  )
  SELECT
    gen_random_uuid(),
    topic.id,
    age_group.id,
    'pictureToWordBuilder',
    'games.pictureToWordBuilder.title',
    'games.pictureToWordBuilder.subtitle',
    'drag_drop',
    'PictureToWordBuilderGame',
    3,
    3,
    '/images/games/thumbnails/pictureToWordBuilder/thumb-16x10.webp',
    '/audio/he/games/picture-to-word-builder/instructions/intro.mp3',
    true
  FROM topic, age_group
  WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE slug = 'pictureToWordBuilder')
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id FROM public.games WHERE slug = 'pictureToWordBuilder'
)
INSERT INTO public.game_levels (id, game_id, level_number, config_json, sort_order)
SELECT
  gen_random_uuid(),
  resolved_game.id,
  1,
  '{"adaptive": true, "rounds": 8}'::jsonb,
  1
FROM resolved_game
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_levels gl
  WHERE gl.game_id = resolved_game.id AND gl.level_number = 1
);

-- ---------------------------------------------------------------------------
-- Catalog maintenance: resolve games by React registry key (admin / validation)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_games_component_key ON public.games (component_key);
