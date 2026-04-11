# Blend to Read Video Shorts — i18n + Audio Map

Issues: [DUB-710](/DUB/issues/DUB-710), [DUB-709](/DUB/issues/DUB-709), [DUB-711](/DUB/issues/DUB-711)  
Spec: `docs/games/blend-to-read-video-shorts.md`

## Canonical key families

- `common.videos.blendToRead.title`
- `common.videos.blendToRead.instructions.*`
- `common.videos.blendToRead.episodes.<episodeId>.narration.*`
- `common.videos.blendToRead.episodes.<episodeId>.checkpoints.{one,two,three}.prompt`
- `common.videos.blendToRead.hints.*`
- `common.videos.blendToRead.feedback.success.default`
- `common.videos.blendToRead.feedback.retry.default`
- `common.parentDashboard.videos.blendToRead.*`
- Supporting vocabulary:
- `common.syllables.pronunciation.{maPatah,leSegol,shiHirik,sal,bat,gil}`
- `common.words.pronunciation.{matana,lehem,shir,sala,bayit,gil,sal}`

## Fixed episode IDs

- `episode-01-cv-patah`
- `episode-02-cv-segol`
- `episode-03-cv-hirik`
- `episode-04-cvc-bridge`
- `episode-05-word-transfer`
- `episode-06-challenge`

## Scene key -> clip filename contract

- `narration.intro` -> `intro.mp3`
- `narration.model` -> `model-blend.mp3`
- `checkpoints.one.prompt` -> `checkpoint-one.mp3`
- `checkpoints.two.prompt` -> `checkpoint-two.mp3`
- `checkpoints.three.prompt` -> `checkpoint-three.mp3`
- `narration.recap` -> `recap.mp3`
- `narration.celebration` -> `celebration.mp3`

## Audio output path contract

For each episode id above, clips are generated to:

- `public/audio/he/videos/blend-to-read/<episodeId>/intro.mp3`
- `public/audio/he/videos/blend-to-read/<episodeId>/model-blend.mp3`
- `public/audio/he/videos/blend-to-read/<episodeId>/checkpoint-one.mp3`
- `public/audio/he/videos/blend-to-read/<episodeId>/checkpoint-two.mp3`
- `public/audio/he/videos/blend-to-read/<episodeId>/checkpoint-three.mp3`
- `public/audio/he/videos/blend-to-read/<episodeId>/recap.mp3`
- `public/audio/he/videos/blend-to-read/<episodeId>/celebration.mp3`

These clip paths are consumed by Remotion metadata duration measurement and must remain stable.
