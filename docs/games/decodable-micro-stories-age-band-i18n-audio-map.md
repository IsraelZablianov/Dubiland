# Decodable Micro Stories Age-Band Overhaul — i18n to Audio Map

Source locale: `packages/web/src/i18n/locales/he/common.json`  
Audio manifest: `packages/web/public/audio/he/manifest.json`

Primary coordination threads:
- Parent quality lane: [DUB-501](/DUB/issues/DUB-501)
- Content implementation lane: [DUB-528](/DUB/issues/DUB-528)

## Age-Band Story Packs Added

- `3-4`: `stories.missingSound` (`4` pages)
- `5-6`: `stories.yoavClueMap` (`6` pages)
- `6-7`: `stories.tamarLockedFloor` (`8` pages)

## Key Family Contract

### Child-facing per band
- `common.games.decodableMicroStories.ageBand.<band>.instructions.*`
- `common.games.decodableMicroStories.ageBand.<band>.controls.*`
- `common.games.decodableMicroStories.ageBand.<band>.hints.*`
- `common.games.decodableMicroStories.ageBand.<band>.feedback.success.*`
- `common.games.decodableMicroStories.ageBand.<band>.feedback.retry.*`
- `common.games.decodableMicroStories.ageBand.<band>.adaptive.*`
- `common.games.decodableMicroStories.ageBand.<band>.completion.*`
- `common.games.decodableMicroStories.ageBand.<band>.stories.<storyId>.title`
- `common.games.decodableMicroStories.ageBand.<band>.stories.<storyId>.pages.<pageId>.{narration,prompt}`

### Parent-facing per band
- `common.parentDashboard.games.decodableMicroStories.ageBand.<band>.progressSummary`
- `common.parentDashboard.games.decodableMicroStories.ageBand.<band>.nextStep`
- Metrics added by spec:
  - `3-4`: `listenParticipation`, `hintDependenceTrend`
  - `5-6`: `decodeAccuracy`, `hintDependenceTrend`
  - `6-7`: `decodeAccuracy`, `sequenceEvidenceScore`, `hintDependenceTrend`

## Audio Output Pattern

- Child keys:
  - `/audio/he/games/decodable-micro-stories/age-band/<band>/<...>.mp3`
- Parent keys:
  - `/audio/he/parent-dashboard/games/decodable-micro-stories/age-band/<band>/<...>.mp3`

Examples:
- `common.games.decodableMicroStories.ageBand.5-6.stories.yoavClueMap.pages.p03.narration`
  -> `/audio/he/games/decodable-micro-stories/age-band/5-6/stories/yoav-clue-map/pages/p03/narration.mp3`
- `common.parentDashboard.games.decodableMicroStories.ageBand.6-7.sequenceEvidenceScore`
  -> `/audio/he/parent-dashboard/games/decodable-micro-stories/age-band/6-7/sequence-evidence-score.mp3`

## Parity Snapshot (2026-04-11)

Post-generation command: `yarn generate-audio` -> `Done! 2787/2787 generated`

- `common.games.decodableMicroStories.ageBand.3-4.*`: `27` keys, `0` missing manifest, `0` missing files
- `common.games.decodableMicroStories.ageBand.5-6.*`: `28` keys, `0` missing manifest, `0` missing files
- `common.games.decodableMicroStories.ageBand.6-7.*`: `34` keys, `0` missing manifest, `0` missing files
- `common.parentDashboard.games.decodableMicroStories.ageBand.3-4.*`: `4` keys, `0` missing manifest, `0` missing files
- `common.parentDashboard.games.decodableMicroStories.ageBand.5-6.*`: `4` keys, `0` missing manifest, `0` missing files
- `common.parentDashboard.games.decodableMicroStories.ageBand.6-7.*`: `5` keys, `0` missing manifest, `0` missing files
