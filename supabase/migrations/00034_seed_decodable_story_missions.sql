WITH topic AS (
  SELECT id
  FROM public.topics
  WHERE slug = 'reading'
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
    'decodableStoryMissions',
    'games.decodableStoryMissions.title',
    'games.decodableStoryMissions.subtitle',
    'story_mission_decode',
    'DecodableStoryMissionsGame',
    5,
    9,
    NULL,
    '/audio/he/games/decodable-story-missions/instructions/intro.mp3',
    true
  FROM topic, age_group
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.games
    WHERE slug = 'decodableStoryMissions'
  )
  RETURNING id
),
resolved_game AS (
  SELECT id FROM inserted_game
  UNION ALL
  SELECT id
  FROM public.games
  WHERE slug = 'decodableStoryMissions'
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
    "missionCount": 3,
    "pagesPerMission": 3,
    "decodeGate": {
      "minDecodeFirstPct": 80,
      "maxStage3Hints": 1
    },
    "imageHotspotGate": {
      "requiresTextInteraction": true,
      "requiresDecodeAttempt": true,
      "guideArrowAfterLockedTaps": 2
    },
    "antiRandomTapGate": {
      "nonTargetTapCount": 4,
      "rapidTapWindowMs": 2000,
      "rapidResponseStreak": 3,
      "rapidResponseWindowMs": 600,
      "pauseMs": 900,
      "reduceOptionsBy": 1
    },
    "progression": {
      "independentPass": {
        "decodeFirstPct": 80,
        "maxStage3Hints": 1
      },
      "recoveryTrigger": {
        "stage3HintsPerMission": 2,
        "firstTryDecodePctBelow": 70
      },
      "maxRecoveryPerMissionBlock": 1
    },
    "difficultyCurve": {
      "clusterAPointingFadeMaxPct": 10,
      "clusterBUnlockedAfterClusterA": true,
      "clusterBSequenceCadencePages": 2
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
  AND t.slug = 'age.primary.6-7'
WHERE g.slug = 'decodableStoryMissions'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'support'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'age'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'age.primary.5-6'
WHERE g.slug = 'decodableStoryMissions'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.topics top ON top.id = g.topic_id
JOIN public.tag_dimensions d ON d.slug = 'topic'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'topic.' || top.slug
WHERE g.slug = 'decodableStoryMissions'
ON CONFLICT (game_id, tag_id) DO NOTHING;

INSERT INTO public.game_tag_assignments (game_id, tag_id, assignment_role)
SELECT g.id, t.id, 'primary'
FROM public.games g
JOIN public.tag_dimensions d ON d.slug = 'difficulty'
JOIN public.tags t ON t.dimension_id = d.id
  AND t.slug = 'difficulty.' || coalesce(g.difficulty, 1)::text
WHERE g.slug = 'decodableStoryMissions'
ON CONFLICT (game_id, tag_id) DO NOTHING;
