# Letters Video Series — i18n to Audio Map

Source locale: `packages/web/src/i18n/locales/he/common.json`

Structured key map for Remotion: `packages/remotion/src/content/lettersVideoSeries.ts`

Generated with: `yarn generate-audio`

## Series Key Families

- `common.videos.lettersSeries.title` -> `/audio/he/videos/letters-series/title.mp3`
- `common.videos.lettersSeries.subtitle` -> `/audio/he/videos/letters-series/subtitle.mp3`
- `common.videos.lettersSeries.transitions.nextLetter` -> `/audio/he/videos/letters-series/transitions/next-letter.mp3`
- `common.videos.lettersSeries.transitions.seriesOutro` -> `/audio/he/videos/letters-series/transitions/series-outro.mp3`
- `common.videos.lettersSeries.episodes.*.intro` -> `/audio/he/videos/letters-series/episodes/*/intro.mp3`
- `common.videos.lettersSeries.episodes.*.pronunciation` -> `/audio/he/videos/letters-series/episodes/*/pronunciation.mp3`
- `common.videos.lettersSeries.episodes.*.exampleWord` -> `/audio/he/videos/letters-series/episodes/*/example-word.mp3`
- `common.videos.lettersSeries.episodes.*.celebration` -> `/audio/he/videos/letters-series/episodes/*/celebration.mp3`

## Initial Episode Inventory

| Episode | Script keys | Audio base path |
|---|---|---|
| `alef` | `common.videos.lettersSeries.episodes.alef.{intro,pronunciation,exampleWord,celebration}` | `/audio/he/videos/letters-series/episodes/alef/` |
| `bet` | `common.videos.lettersSeries.episodes.bet.{intro,pronunciation,exampleWord,celebration}` | `/audio/he/videos/letters-series/episodes/bet/` |
| `gimel` | `common.videos.lettersSeries.episodes.gimel.{intro,pronunciation,exampleWord,celebration}` | `/audio/he/videos/letters-series/episodes/gimel/` |
| `dalet` | `common.videos.lettersSeries.episodes.dalet.{intro,pronunciation,exampleWord,celebration}` | `/audio/he/videos/letters-series/episodes/dalet/` |
| `he` | `common.videos.lettersSeries.episodes.he.{intro,pronunciation,exampleWord,celebration}` | `/audio/he/videos/letters-series/episodes/he/` |
| `vav` | `common.videos.lettersSeries.episodes.vav.{intro,pronunciation,exampleWord,celebration}` | `/audio/he/videos/letters-series/episodes/vav/` |

## Reusable Supporting Keys

- `common.letters.symbols.*` -> on-screen letter glyphs
- `common.letters.pronunciation.*` -> reusable letter-name audio
- `common.letters.sampleWords.*` -> reusable sample-word audio

## Media Integration Notes

- Remotion can iterate `LETTERS_VIDEO_SERIES_EPISODES` and pull all four script beats per episode in a fixed timeline: `intro -> pronunciation -> exampleWord -> celebration`.
- Keep audio lookup runtime-driven via `packages/web/public/audio/he/manifest.json` (`i18n key -> audio path`).
