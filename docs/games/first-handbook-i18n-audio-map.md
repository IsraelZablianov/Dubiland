# First Handbook (דובי והתרמיל האבוד) — i18n to Audio Map

Source locale: `packages/web/src/i18n/locales/he/common.json`

Generated with: `yarn generate-audio`

## Handbook Key Families

- `common.handbooks.library.title` -> `/audio/he/handbooks/library/title.mp3`
- `common.handbooks.library.subtitle` -> `/audio/he/handbooks/library/subtitle.mp3`
- `common.handbooks.reader.controls.*` -> `/audio/he/handbooks/reader/controls/*`
- `common.handbooks.reader.status.*` -> `/audio/he/handbooks/reader/status/*`
- `common.handbooks.firstAdventure.meta.*` -> `/audio/he/handbooks/first-adventure/meta/*`
- `common.handbooks.firstAdventure.pages.page0X.narration` -> `/audio/he/handbooks/first-adventure/pages/page0X/narration.mp3`
- `common.handbooks.firstAdventure.pages.page0X.cta` -> `/audio/he/handbooks/first-adventure/pages/page0X/cta.mp3`
- `common.handbooks.firstAdventure.interactions.<interaction>.{prompt,hint,success,retry}` -> `/audio/he/handbooks/first-adventure/interactions/<interaction>/...`
- `common.handbooks.firstAdventure.readingProgression.level{1,2,3}.*` -> `/audio/he/handbooks/first-adventure/reading-progression/level{1,2,3}/*`
- `common.handbooks.firstAdventure.feedback.*.*` -> `/audio/he/handbooks/first-adventure/feedback/...`
- `common.handbooks.firstAdventure.transitions.*` -> `/audio/he/handbooks/first-adventure/transitions/*`
- `common.handbooks.firstAdventure.completion.*` -> `/audio/he/handbooks/first-adventure/completion/*`
- `common.parentDashboard.handbooks.firstAdventure.*` -> `/audio/he/parent-dashboard/handbooks/first-adventure/*`

## Page Inventory (Narration + CTA)

| Page | Narration key | CTA key |
|---|---|---|
| 1 | `common.handbooks.firstAdventure.pages.page01.narration` | `common.handbooks.firstAdventure.pages.page01.cta` |
| 2 | `common.handbooks.firstAdventure.pages.page02.narration` | `common.handbooks.firstAdventure.pages.page02.cta` |
| 3 | `common.handbooks.firstAdventure.pages.page03.narration` | `common.handbooks.firstAdventure.pages.page03.cta` |
| 4 | `common.handbooks.firstAdventure.pages.page04.narration` | `common.handbooks.firstAdventure.pages.page04.cta` |
| 5 | `common.handbooks.firstAdventure.pages.page05.narration` | `common.handbooks.firstAdventure.pages.page05.cta` |
| 6 | `common.handbooks.firstAdventure.pages.page06.narration` | `common.handbooks.firstAdventure.pages.page06.cta` |
| 7 | `common.handbooks.firstAdventure.pages.page07.narration` | `common.handbooks.firstAdventure.pages.page07.cta` |
| 8 | `common.handbooks.firstAdventure.pages.page08.narration` | `common.handbooks.firstAdventure.pages.page08.cta` |
| 9 | `common.handbooks.firstAdventure.pages.page09.narration` | `common.handbooks.firstAdventure.pages.page09.cta` |
| 10 | `common.handbooks.firstAdventure.pages.page10.narration` | `common.handbooks.firstAdventure.pages.page10.cta` |

## Runtime Integration Notes

- Runtime lookup should continue using `packages/web/public/audio/he/manifest.json` (`i18n key -> audio path`).
- Child-facing handbook flow should use handbook-specific keys first, then fallback to `common.feedback.*` if a generic clip is needed.
- Parent dashboard can consume `common.parentDashboard.handbooks.firstAdventure.*` immediately for summary cards once handbook progress events are wired.
- Reading progression order should follow: `decodePointedWord` -> `decodePointedPhrase` -> `decodeBridgePhrase` -> `literalComprehension`.
