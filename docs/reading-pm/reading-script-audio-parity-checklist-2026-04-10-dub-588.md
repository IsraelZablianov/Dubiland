# DUB-588 — Reading Script/Audio Parity Checklist

Date: 2026-04-10  
Owner: Content Writer  
Parent: [DUB-569](/DUB/issues/DUB-569)

## Scope
- Lock age-band wording parity so `3-4` remains listen/explore where relevant.
- Confirm icon-first replay/retry/hint audio coverage across handbook + decodable packs.
- Align decode-first and anti-guess wording in child-facing prompts/status/hints.

## Key Families Checked

### 1) Age-Band Messaging Lock
- `games.decodableMicroStories.ageBand.3-4.*`
- `games.decodableMicroStories.ageBand.5-6.*`
- `games.decodableMicroStories.ageBand.6-7.*`
- `parentDashboard.games.decodableMicroStories.ageBand.3-4.*`
- `parentDashboard.games.decodableMicroStories.ageBand.5-6.*`
- `parentDashboard.games.decodableMicroStories.ageBand.6-7.*`
- `parentDashboard.handbooks.mikaSoundGarden.{decodeInStoryAccuracy,evidenceReading,independenceTrend}`

### 2) Icon-First Prompt Coverage (`▶`,`↻`,`💡`)
- `games.interactiveHandbook.controls.{replay,retry,hint,retryCue}`
- `games.decodableMicroStories.controls.{replay,retry,hint}`
- `games.decodableMicroStories.instructions.{tapReplay,tapRetry,tapHint,iconControls}`
- `games.decodableMicroStories.ageBand.*.controls.retry`
- `games.decodableMicroStories.ageBand.*.hints.{replayPhrase,reduceChoices,decodeBeforeAnswer}`

### 3) Decode-First / Anti-Guess Wording
- `games.interactiveHandbook.instructions.tapChoice`
- `games.interactiveHandbook.status.completeInteractionFirst`
- `games.decodableMicroStories.instructions.decodeFirst`
- `games.decodableMicroStories.hints.decodeBeforeAnswer`
- `games.decodableMicroStories.feedback.retry.focusText`
- `games.decodableMicroStories.ageBand.*.instructions.decodeFirst`
- `games.decodableMicroStories.ageBand.6-7.instructions.chooseAnswer`

## Validation Steps
1. Run `yarn generate-audio`.
2. Verify manifest coverage and on-disk `.mp3` for the key families above.
3. Run `yarn typecheck`.
4. Boot app with `yarn dev` for smoke validation.

## Validation Results (2026-04-10)
- `yarn generate-audio` completed successfully: `Done! 2717/2717 generated`.
- Targeted parity audit (DUB-588 families): `66` keys checked.
- Manifest parity: `0` missing mappings.
- File parity: `0` missing `.mp3` files.
- `yarn typecheck`: pass.
- `yarn dev --host 127.0.0.1 --port 4174`: booted successfully (`VITE v6.4.2`, local URL available).  
  Note: port `4173` was occupied during this run.
