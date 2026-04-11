-- DUB-798: Canonical `games` (+ `game_levels`) rows for DUB-777 approved batch.
-- Spec slugs: patternTrain, measureAndMatch, soundSlideBlending, spellAndSendPostOffice, pointingFadeBridge.
-- Merge decision (DUB-777): single shipping surface `spellAndSendPostOffice` — no separate `spellAndSend` catalog row.
--
-- RLS: inserts run as migration role; `games` / `game_levels` policies unchanged (no new tables).
--
-- Rollback (manual, dev/staging):
--   DELETE FROM public.game_levels WHERE game_id IN (SELECT id FROM public.games WHERE slug IN (
--     'patternTrain', 'measureAndMatch', 'soundSlideBlending', 'spellAndSendPostOffice', 'pointingFadeBridge'
--   ));
--   DELETE FROM public.games WHERE slug IN (
--     'patternTrain', 'measureAndMatch', 'soundSlideBlending', 'spellAndSendPostOffice', 'pointingFadeBridge'
--   );

-- ---------------------------------------------------------------------------
-- patternTrain — math, ages 4–5 (primary band per docs/games/pattern-train.md)
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
    'patternTrain',
    'games.patternTrain.title',
    'games.patternTrain.subtitle',
    'drag_drop',
    'PatternTrainGame',
    2,
    40,
    NULL,
    NULL,
    false
  FROM topic, age_group
  WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE slug = 'patternTrain')
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id FROM public.games WHERE slug = 'patternTrain'
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
-- measureAndMatch — math, ages 6–7
-- ---------------------------------------------------------------------------
WITH topic AS (
  SELECT id FROM public.topics WHERE slug = 'math' LIMIT 1
),
age_group AS (
  SELECT id FROM public.age_groups WHERE min_age = 6 AND max_age = 7 LIMIT 1
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
    'measureAndMatch',
    'games.measureAndMatch.title',
    'games.measureAndMatch.subtitle',
    'drag_drop',
    'MeasureAndMatchGame',
    3,
    41,
    NULL,
    NULL,
    false
  FROM topic, age_group
  WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE slug = 'measureAndMatch')
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id FROM public.games WHERE slug = 'measureAndMatch'
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
-- soundSlideBlending — reading, ages 5–6 (intro audio shipped)
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
    'soundSlideBlending',
    'games.soundSlideBlending.title',
    'games.soundSlideBlending.subtitle',
    'syllable_blend_slide',
    'SoundSlideBlendingGame',
    3,
    42,
    NULL,
    '/audio/he/games/sound-slide-blending/instructions/intro.mp3',
    false
  FROM topic, age_group
  WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE slug = 'soundSlideBlending')
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id FROM public.games WHERE slug = 'soundSlideBlending'
)
INSERT INTO public.game_levels (id, game_id, level_number, config_json, sort_order)
SELECT
  gen_random_uuid(),
  resolved_game.id,
  1,
  '{"adaptive": true, "rounds": 10}'::jsonb,
  1
FROM resolved_game
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_levels gl
  WHERE gl.game_id = resolved_game.id AND gl.level_number = 1
);

-- ---------------------------------------------------------------------------
-- spellAndSendPostOffice — reading, ages 5–6 (intro audio shipped)
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
    'spellAndSendPostOffice',
    'games.spellAndSendPostOffice.title',
    'games.spellAndSendPostOffice.subtitle',
    'rtl_word_encoding',
    'SpellAndSendPostOfficeGame',
    3,
    43,
    NULL,
    '/audio/he/games/spell-and-send-post-office/instructions/intro.mp3',
    false
  FROM topic, age_group
  WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE slug = 'spellAndSendPostOffice')
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id FROM public.games WHERE slug = 'spellAndSendPostOffice'
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
-- pointingFadeBridge — reading, ages 6–7
-- ---------------------------------------------------------------------------
WITH topic AS (
  SELECT id FROM public.topics WHERE slug = 'reading' LIMIT 1
),
age_group AS (
  SELECT id FROM public.age_groups WHERE min_age = 6 AND max_age = 7 LIMIT 1
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
    'pointingFadeBridge',
    'games.pointingFadeBridge.title',
    'games.pointingFadeBridge.subtitle',
    'mixed_pointing_sentence_bridge',
    'PointingFadeBridgeGame',
    4,
    44,
    NULL,
    NULL,
    false
  FROM topic, age_group
  WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE slug = 'pointingFadeBridge')
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id FROM public.games WHERE slug = 'pointingFadeBridge'
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
