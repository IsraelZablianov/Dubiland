-- DUB-698: Seed Build-10 Workshop (math, ages 5-6) catalog row + level.
--
-- Rollback (manual, dev/staging):
--   DELETE FROM public.game_levels WHERE game_id IN (SELECT id FROM public.games WHERE slug = 'build10Workshop');
--   DELETE FROM public.games WHERE slug = 'build10Workshop';

WITH topic AS (
  SELECT id
  FROM public.topics
  WHERE slug = 'math'
  LIMIT 1
),
age_group AS (
  SELECT id
  FROM public.age_groups
  WHERE min_age = 5 AND max_age = 6
  LIMIT 1
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
    'build10Workshop',
    'games.build10Workshop.title',
    'games.build10Workshop.subtitle',
    'drag_drop',
    'Build10WorkshopGame',
    4,
    4,
    NULL,
    '/audio/he/games/build-10-workshop/instructions/intro.mp3',
    true
  FROM topic, age_group
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.games
    WHERE slug = 'build10Workshop'
  )
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id
  FROM public.games
  WHERE slug = 'build10Workshop'
)
INSERT INTO public.game_levels (
  id,
  game_id,
  level_number,
  config_json,
  sort_order
)
SELECT
  gen_random_uuid(),
  resolved_game.id,
  1,
  '{
    "adaptive": true,
    "rounds": 8,
    "promotionGates": {
      "l1ToL2": { "firstAttemptSuccessMinPct": 75, "hintUsageMaxPct": 35, "window": 8 },
      "l2ToL3": { "firstAttemptSuccessMinPct": 80, "independentAlternateMinPct": 70, "window": 10 }
    },
    "remediation": {
      "consecutiveMissesForRangeReduce": 2,
      "consecutiveFirstAttemptSuccessForBoost": 3,
      "unknownPartUnlockWindow": 4,
      "unknownPartUnlockFirstAttemptMinPct": 75
    }
  }'::jsonb,
  1
FROM resolved_game
WHERE NOT EXISTS (
  SELECT 1
  FROM public.game_levels gl
  WHERE gl.game_id = resolved_game.id
    AND gl.level_number = 1
);
