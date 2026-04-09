WITH topic AS (
  SELECT id
  FROM topics
  WHERE slug = 'letters'
  LIMIT 1
),
age_group AS (
  SELECT id
  FROM age_groups
  WHERE min_age = 3 AND max_age = 4
  LIMIT 1
),
inserted_game AS (
  INSERT INTO games (
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
    'letterTracingTrail',
    'games.letterTracingTrail.title',
    'games.letterTracingTrail.subtitle',
    'trace',
    'LetterTracingTrailGame',
    2,
    2,
    NULL,
    '/audio/he/games/letter-tracing-trail/instructions/intro.mp3',
    true
  FROM topic, age_group
  WHERE NOT EXISTS (
    SELECT 1
    FROM games
    WHERE slug = 'letterTracingTrail'
  )
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id
  FROM games
  WHERE slug = 'letterTracingTrail'
)
INSERT INTO game_levels (
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
  '{"adaptive": true, "rounds": 8}'::jsonb,
  1
FROM resolved_game
WHERE NOT EXISTS (
  SELECT 1
  FROM game_levels
  WHERE game_levels.game_id = resolved_game.id
    AND game_levels.level_number = 1
);
