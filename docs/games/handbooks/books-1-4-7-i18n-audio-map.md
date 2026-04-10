# Books 1/4/7 Decodable Content Pack — i18n to Audio Map

Source locale: `packages/web/src/i18n/locales/he/common.json`

Primary runtime coordination threads:
- Reading PM lane: [DUB-379](/DUB/issues/DUB-379)
- FED runtime gates lane: [DUB-392](/DUB/issues/DUB-392)
- Content lane (this pack): [DUB-393](/DUB/issues/DUB-393)
- Story-depth overhaul lane: [DUB-525](/DUB/issues/DUB-525)

## Implemented Book Slugs
- Book 1 (`3-4`): `mikaSoundGarden`
- Book 4 (`5-6`): `yoavLetterMap`
- Book 7 (`6-7`): `tamarWordTower`

## Key Family Contract

### `common.handbooks.<slug>.*`
- `meta.*`
- `scriptPackage.narration.*`
- `scriptPackage.prompts.*`
- `scriptPackage.hints.*`
- `scriptPackage.retry.*`
- `scriptPackage.praise.*`
- `sentenceBank.*`
- `interactions.<interactionId>.{prompt,hint,success,retry}`
- `storyArc.chapter{A|B|C}.{title,transition}`
- `pages.pageXX.{narration,cta}` (Book 1: `page01-page08`, Book 4: `page01-page10`, Book 7: `page01-page12`)
- `chapterRecap.{title,summary,nextStep}`
- `readingProgression.*` (Books 4 and 7)

### `common.parentDashboard.handbooks.<slug>.*`
- `progressSummary`
- `nextStep`
- `readingSignal`
- `confusionFocus`
- `storyEngagement`
- `decodeInStoryAccuracy`
- `evidenceReading`
- `independenceTrend`

## Audio Output Pattern
Generated path shape for all above keys:
- `/audio/he/handbooks/<slug-kebab>/...`
- `/audio/he/parent-dashboard/handbooks/<slug-kebab>/...`

Examples:
- `common.handbooks.yoavLetterMap.scriptPackage.narration.intro`
  -> `/audio/he/handbooks/yoav-letter-map/script-package/narration/intro.mp3`
- `common.parentDashboard.handbooks.tamarWordTower.progressSummary`
  -> `/audio/he/parent-dashboard/handbooks/tamar-word-tower/progress-summary.mp3`

## Decodable Sentence Bank Coverage
- `mikaSoundGarden`: modeled words + modeled phrases for print-awareness stage (narrator-modeled).
- `yoavLetterMap`: fully pointed words + fully pointed short phrases (CV/CVC focus).
- `tamarWordTower`: pointed phrases + bridge phrases with selective reduced pointing.

## Integration Notes for FED (`DUB-392`)
- Keep child-facing line lookups on the key families above and avoid hardcoded copy in runtime.
- Use `scriptPackage` for reusable narration/prompt/hint/retry/praise playback events.
- Use `sentenceBank` for decoding cards and text-evidence checkpoints.
- Parent summary cards can read directly from `common.parentDashboard.handbooks.<slug>.*`.
