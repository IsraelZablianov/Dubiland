-- DUB-699: Seed Time-and-Routine Builder (math, ages 6-7) catalog row + level.
--
-- Rollback (manual, dev/staging):
--   DELETE FROM public.game_levels WHERE game_id IN (SELECT id FROM public.games WHERE slug = 'timeAndRoutineBuilder');
--   DELETE FROM public.games WHERE slug = 'timeAndRoutineBuilder';

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
    'timeAndRoutineBuilder',
    'games.timeAndRoutineBuilder.title',
    'games.timeAndRoutineBuilder.subtitle',
    'sequence',
    'TimeAndRoutineBuilderGame',
    4,
    5,
    NULL,
    '/audio/he/games/time-and-routine-builder/instructions/intro.mp3',
    true
  FROM topic, age_group
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.games
    WHERE slug = 'timeAndRoutineBuilder'
  )
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id
  FROM public.games
  WHERE slug = 'timeAndRoutineBuilder'
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
      "l1ToL2": { "firstAttemptSuccessMinPct": 80, "window": 6 },
      "l2ToL3": { "firstAttemptSuccessMinPct": 80, "hintUsageMaxPct": 30, "window": 8 }
    },
    "remediation": {
      "consecutiveMissesForRangeReduce": 2,
      "consecutiveFirstAttemptSuccessForPromotion": 3,
      "misconceptionThreshold": 3,
      "misconceptions": ["before_after", "clock_anchor"]
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
