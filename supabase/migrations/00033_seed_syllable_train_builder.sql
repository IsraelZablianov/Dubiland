WITH topic AS (
  SELECT id
  FROM public.topics
  WHERE slug = 'reading'
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
    'syllableTrainBuilder',
    'games.syllableTrainBuilder.title',
    'games.syllableTrainBuilder.subtitle',
    'blend_rail_builder',
    'SyllableTrainBuilderGame',
    4,
    8,
    NULL,
    '/audio/he/games/syllable-train-builder/instructions/intro.mp3',
    true
  FROM topic, age_group
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.games
    WHERE slug = 'syllableTrainBuilder'
  )
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id
  FROM public.games
  WHERE slug = 'syllableTrainBuilder'
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
    "transferRoundsTarget": 5,
    "cvGate": {
      "minItems": 10,
      "firstTryAccuracyPct": 85,
      "minNikudPatterns": 4,
      "maxHintsInLastWindow": 2,
      "hintWindow": 6
    },
    "cvcGate": {
      "minItems": 12,
      "firstTryAccuracyPct": 80,
      "nearMissAccuracyPct": 75,
      "minClosingConsonants": 3
    },
    "regression": {
      "windowSize": 6,
      "firstTryFloorPct": 60,
      "scaffoldRounds": 3
    },
    "calmAssist": {
      "wrongActions": 3,
      "windowMs": 4000,
      "pauseMs": 800
    }
  }'::jsonb,
  1
FROM resolved_game
WHERE NOT EXISTS (
  SELECT 1
  FROM public.game_levels
  WHERE game_levels.game_id = resolved_game.id
    AND game_levels.level_number = 1
);

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'age'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'age.primary.5-6'
WHERE g.slug = 'syllableTrainBuilder'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'support'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'age'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'age.primary.6-7'
WHERE g.slug = 'syllableTrainBuilder'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.topics top ON top.id = g.topic_id
JOIN public.tag_dimensions d ON d.slug = 'topic'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'topic.' || top.slug
WHERE g.slug = 'syllableTrainBuilder'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'difficulty'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'difficulty.' || coalesce(g.difficulty, 1)::text
WHERE g.slug = 'syllableTrainBuilder'
ON CONFLICT (game_id, tag_id) DO NOTHING;
