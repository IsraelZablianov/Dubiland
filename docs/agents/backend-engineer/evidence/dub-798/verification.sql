-- Run after `npx supabase db reset` or migration apply (role with read on public.games / public.game_levels).
SELECT
  g.slug,
  g.component_key,
  g.game_type,
  g.is_published,
  g.curriculum_domain,
  g.name_key,
  t.slug AS topic_slug,
  ag.min_age,
  ag.max_age,
  (SELECT COUNT(*) FROM public.game_levels gl WHERE gl.game_id = g.id) AS level_rows
FROM public.games g
JOIN public.topics t ON t.id = g.topic_id
JOIN public.age_groups ag ON ag.id = g.age_group_id
WHERE g.slug IN (
  'patternTrain',
  'measureAndMatch',
  'soundSlideBlending',
  'spellAndSendPostOffice',
  'pointingFadeBridge'
)
ORDER BY g.slug;
