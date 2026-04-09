# Letter Tracing Trail — i18n to Audio Map

Source locale: `packages/web/src/i18n/locales/he/common.json`

Generated with: `yarn generate-audio`

## Game Key Families

- `common.games.letterTracingTrail.title` -> `/audio/he/games/letter-tracing-trail/title.mp3`
- `common.games.letterTracingTrail.subtitle` -> `/audio/he/games/letter-tracing-trail/subtitle.mp3`
- `common.games.letterTracingTrail.instructions.*` -> `/audio/he/games/letter-tracing-trail/instructions/*.mp3`
- `common.games.letterTracingTrail.letterPrompt.*` -> `/audio/he/games/letter-tracing-trail/letter-prompt/*.mp3`
- `common.games.letterTracingTrail.strokeHint.*` -> `/audio/he/games/letter-tracing-trail/stroke-hint/*.mp3`
- `common.games.letterTracingTrail.completionPraise.*` -> `/audio/he/games/letter-tracing-trail/completion-praise/*.mp3`
- `common.games.letterTracingTrail.feedback.encouragement.*` -> `/audio/he/games/letter-tracing-trail/feedback/encouragement/*.mp3`
- `common.games.letterTracingTrail.feedback.success.*` -> `/audio/he/games/letter-tracing-trail/feedback/success/*.mp3`

## Letter Pronunciation Keys

- `common.letters.pronunciation.*` -> `/audio/he/letters/pronunciation/*.mp3`

## Parent Dashboard Summary Keys

- `common.parentDashboard.games.letterTracingTrail.progressSummary` -> `/audio/he/parent-dashboard/games/letter-tracing-trail/progress-summary.mp3`
- `common.parentDashboard.games.letterTracingTrail.nextStep` -> `/audio/he/parent-dashboard/games/letter-tracing-trail/next-step.mp3`

## Notes

- Spoken override is defined for `common.parentDashboard.games.letterTracingTrail.progressSummary` in `packages/web/src/i18n/locales/he/audio-overrides.json` to avoid placeholder-heavy narration.
- Runtime lookup should use `packages/web/public/audio/he/manifest.json` as source of truth (`i18n key -> audio path`).
