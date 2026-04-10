# Shva Sound Switch — i18n + Audio Map

Issue: [DUB-413](/DUB/issues/DUB-413)  
Spec: `docs/games/shva-sound-switch.md`

## Locale coverage

All keys are in `packages/web/src/i18n/locales/he/common.json`.

- `common.games.shvaSoundSwitch.*`
  - `instructions.*`
  - `prompts.listenChoose.*`
  - `prompts.blendRail.*`
  - `prompts.transferRead.*`
  - `hints.*`
  - `feedback.success.*`
  - `feedback.retry.*`
  - `feedback.encouragement.*`
- `common.syllables.shva.*`
- `common.words.pronunciation.{dvar,davar,zman,shvil}`
- `common.phrases.pointed.*`
- `common.parentDashboard.games.shvaSoundSwitch.*`

Audio override file:

- `packages/web/src/i18n/locales/he/audio-overrides.json`
  - `common.parentDashboard.games.shvaSoundSwitch.progressSummary`
  - `common.parentDashboard.games.shvaSoundSwitch.confusions`

## Audio output paths

Generated via `yarn generate-audio` into:

- `/audio/he/games/shva-sound-switch/...`
- `/audio/he/syllables/shva/...`
- `/audio/he/words/pronunciation/{dvar,davar,zman,shvil}.mp3`
- `/audio/he/phrases/pointed/...`
- `/audio/he/parent-dashboard/games/shva-sound-switch/...`

Manifest:

- `packages/web/public/audio/he/manifest.json`

## Parity check

Targeted parity result after generation:

- `69` targeted keys
- `0` missing manifest mappings
- `0` missing audio files
