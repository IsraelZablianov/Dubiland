# Magic Letter Map Launch Handbook — i18n to Audio Map

Source locale: `packages/web/src/i18n/locales/he/common.json`  
Audio manifest: `packages/web/public/audio/he/manifest.json`

Primary coordination threads:
- Parent launch lane: [DUB-432](/DUB/issues/DUB-432)
- Content/audio lane: [DUB-541](/DUB/issues/DUB-541)
- FED integration gate: [DUB-579](/DUB/issues/DUB-579)
- QA final pass/fail gate: [DUB-578](/DUB/issues/DUB-578)

## Key Family Contract

### `common.games.interactiveHandbook.handbooks.magicLetterMap.*`
- `cover.{title,subtitle,heroAlt}`
- `pages.p01-p10.{narration,prompt}`
- `interactions.<interactionId>.{prompt,hint,success,retry}`
- Additive calibration families (already present):
  - `interactions.<interactionId>.praiseVariants.v{1,2,3}`
  - `interactions.<interactionId>.ageBandSupport.band3_4.{prompt,hint,retry}`
  - `interactions.<interactionId>.ageBandSupport.band5_6.{prompt,hint,retry}`
- `completion.{title,nextStep}`

### Shared handbook runtime shell
- `common.games.interactiveHandbook.*`
  - Includes instructions, controls, status, reader labels, modes, gates, and choice labels used by runtime.

### Parent summary family
- `common.parentDashboard.games.interactiveHandbook.{progressSummary,nextStep}`

## Audio Output Pattern

- `common.games.interactiveHandbook.handbooks.magicLetterMap.*`
  -> `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/...`
- `common.games.interactiveHandbook.*`
  -> `/audio/he/games/interactive-handbook/...`
- `common.parentDashboard.games.interactiveHandbook.*`
  -> `/audio/he/parent-dashboard/games/interactive-handbook/...`

Examples:
- `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p03.narration`
  -> `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p03/narration.mp3`
- `common.games.interactiveHandbook.controls.retry`
  -> `/audio/he/games/interactive-handbook/controls/retry.mp3`
- `common.parentDashboard.games.interactiveHandbook.progressSummary`
  -> `/audio/he/parent-dashboard/games/interactive-handbook/progress-summary.mp3`

## Page Inventory (Deterministic Key -> Audio)

| Page | Narration key | Narration audio | Prompt key | Prompt audio |
|---|---|---|---|---|
| p01 | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p01.narration` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p01/narration.mp3` | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p01.prompt` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p01/prompt.mp3` |
| p02 | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p02.narration` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p02/narration.mp3` | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p02.prompt` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p02/prompt.mp3` |
| p03 | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p03.narration` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p03/narration.mp3` | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p03.prompt` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p03/prompt.mp3` |
| p04 | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p04.narration` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p04/narration.mp3` | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p04.prompt` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p04/prompt.mp3` |
| p05 | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p05.narration` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p05/narration.mp3` | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p05.prompt` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p05/prompt.mp3` |
| p06 | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p06.narration` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p06/narration.mp3` | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p06.prompt` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p06/prompt.mp3` |
| p07 | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p07.narration` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p07/narration.mp3` | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p07.prompt` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p07/prompt.mp3` |
| p08 | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p08.narration` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p08/narration.mp3` | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p08.prompt` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p08/prompt.mp3` |
| p09 | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p09.narration` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p09/narration.mp3` | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p09.prompt` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p09/prompt.mp3` |
| p10 | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p10.narration` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p10/narration.mp3` | `common.games.interactiveHandbook.handbooks.magicLetterMap.pages.p10.prompt` | `/audio/he/games/interactive-handbook/handbooks/magic-letter-map/pages/p10/prompt.mp3` |

## Parity Snapshot (2026-04-11)

- `magic.cover`: `3` keys, `0` missing manifest, `0` missing files
- `magic.pages`: `20` keys, `0` missing manifest, `0` missing files
- `magic.interactions`: `54` keys, `0` missing manifest, `0` missing files
- `magic.completion`: `2` keys, `0` missing manifest, `0` missing files
- `interactiveHandbook.shell`: `365` keys, `0` missing manifest, `0` missing files
- `parent.interactiveHandbook`: `2` keys, `0` missing manifest, `0` missing files

## Runtime Safety Notes

- Handbook runtime files contain no hardcoded Hebrew literals (`InteractiveHandbook.tsx`, `InteractiveHandbookGame.tsx`, `HandbookPageRenderer.tsx`, `handbookRuntimeAdapter.ts`).
- Runtime should continue resolving audio via manifest key lookup (`i18n key -> audio path`) to keep FED/QA behavior deterministic.
