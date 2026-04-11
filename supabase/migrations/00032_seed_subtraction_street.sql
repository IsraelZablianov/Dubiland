-- DUB-694: Seed Subtraction Street (math, ages 6-7) catalog row + level.
--
-- Rollback (manual, dev/staging):
--   DELETE FROM public.game_levels WHERE game_id IN (SELECT id FROM public.games WHERE slug = 'subtractionStreet');
--   DELETE FROM public.games WHERE slug = 'subtractionStreet';

WITH topic AS (
  SELECT id
  FROM public.topics
  WHERE slug = 'math'
  LIMIT 1
),
age_group AS (
  SELECT id
  FROM public.age_groups
  WHERE min_age = 6 AND max_age = 7
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
    'subtractionStreet',
    'games.subtractionStreet.title',
    'games.subtractionStreet.subtitle',
    'tap',
    'SubtractionStreetGame',
    4,
    4,
    NULL,
    '/audio/he/games/subtraction-street/instructions/intro.mp3',
    true
  FROM topic, age_group
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.games
    WHERE slug = 'subtractionStreet'
  )
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id
  FROM public.games
  WHERE slug = 'subtractionStreet'
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
    "rounds": 9,
    "promotionGates": {
      "l1ToL2": { "firstAttemptSuccessMinPct": 75, "hintUsageMaxPct": 35, "window": 8 },
      "l2ToL3": { "firstAttemptSuccessMinPct": 80, "hintUsageMaxPct": 25, "window": 10 }
    },
    "remediation": {
      "consecutiveMissesForRangeReduce": 2,
      "consecutiveFirstAttemptSuccessForPromotion": 3,
      "misconceptionThreshold": 3,
      "misconceptions": ["overshoot", "direction", "crossing10"]
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
