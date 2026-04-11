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
    'letterStorybook',
    'games.letterStorybook.title',
    'games.letterStorybook.subtitle',
    'storybook_letters',
    'LetterStorybookGame',
    4,
    7,
    NULL,
    '/audio/he/games/letter-storybook/instructions/intro.mp3',
    true
  FROM topic, age_group
  WHERE NOT EXISTS (
    SELECT 1
    FROM games
    WHERE slug = 'letterStorybook'
  )
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id
  FROM games
  WHERE slug = 'letterStorybook'
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
  2,
  '{
    "adaptive": true,
    "pages": 29,
    "antiRandomTapGuard": {
      "wrongTapCount": 3,
      "windowMs": 2000,
      "pauseMs": 1000
    }
  }'::jsonb,
  1
FROM resolved_game
WHERE NOT EXISTS (
  SELECT 1
  FROM game_levels
  WHERE game_levels.game_id = resolved_game.id
    AND game_levels.level_number = 2
);

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'age'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'age.primary.5-6'
WHERE g.slug = 'letterStorybook'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'support'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'age'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'age.primary.3-4'
WHERE g.slug = 'letterStorybook'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'support'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'age'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'age.primary.6-7'
WHERE g.slug = 'letterStorybook'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.topics top ON top.id = g.topic_id
JOIN public.tag_dimensions d ON d.slug = 'topic'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'topic.' || top.slug
WHERE g.slug = 'letterStorybook'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'difficulty'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'difficulty.' || coalesce(g.difficulty, 1)::text
WHERE g.slug = 'letterStorybook'
ON CONFLICT (game_id, tag_id) DO NOTHING;
