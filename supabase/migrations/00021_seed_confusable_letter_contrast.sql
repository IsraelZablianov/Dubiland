WITH topic AS (
  SELECT id
  FROM topics
  WHERE slug = 'reading'
  LIMIT 1
),
age_group AS (
  SELECT id
  FROM age_groups
  WHERE min_age = 5 AND max_age = 6
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
    'confusableLetterContrast',
    'games.confusableLetterContrast.title',
    'games.confusableLetterContrast.subtitle',
    'contrast_match_sort',
    'ConfusableLetterContrastGame',
    4,
    6,
    NULL,
    '/audio/he/games/confusable-letter-contrast/instructions/intro.mp3',
    true
  FROM topic, age_group
  WHERE NOT EXISTS (
    SELECT 1
    FROM games
    WHERE slug = 'confusableLetterContrast'
  )
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id
  FROM games
  WHERE slug = 'confusableLetterContrast'
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
  '{
    "adaptive": true,
    "sessionMinutesTarget": 5,
    "fallbackAfterSamePairErrors": 2,
    "slowModeHintsThreshold": 2,
    "slowModeErrorsThreshold": 3,
    "slowModeRounds": 2,
    "masteryWindow": 6,
    "masteryFirstTryThreshold": 5,
    "masteryHintsMax": 1,
    "antiRandomTapGuard": {
      "wrongTapCount": 3,
      "intervalMs": 450,
      "windowMs": 5000,
      "pauseMs": 1000
    }
  }'::jsonb,
  1
FROM resolved_game
WHERE NOT EXISTS (
  SELECT 1
  FROM game_levels
  WHERE game_levels.game_id = resolved_game.id
    AND game_levels.level_number = 1
);

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'age'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'age.primary.5-6'
WHERE g.slug = 'confusableLetterContrast'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'support'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'age'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'age.primary.6-7'
WHERE g.slug = 'confusableLetterContrast'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.topics top ON top.id = g.topic_id
JOIN public.tag_dimensions d ON d.slug = 'topic'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'topic.' || top.slug
WHERE g.slug = 'confusableLetterContrast'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'difficulty'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'difficulty.' || coalesce(g.difficulty, 1)::text
WHERE g.slug = 'confusableLetterContrast'
ON CONFLICT (game_id, tag_id) DO NOTHING;
