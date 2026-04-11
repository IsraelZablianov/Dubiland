# Sound Slide Blending — i18n + Audio Map

Issues: [DUB-785](/DUB/issues/DUB-785), [DUB-782](/DUB/issues/DUB-782), [DUB-788](/DUB/issues/DUB-788)  
Spec: `docs/games/sound-slide-blending.md`

## Canonical key families

- `common.games.soundSlideBlending.*`
- `common.parentDashboard.games.soundSlideBlending.*`
- Linked pronunciation families:
- `common.letters.pronunciation.*`
- `common.nikud.pronunciation.*`
- `common.syllables.pronunciation.*`
- `common.words.pronunciation.*`

## Required runtime families

- `games.soundSlideBlending.instructions.*`
- `games.soundSlideBlending.controls.*`
- `games.soundSlideBlending.prompts.listen.*`
- `games.soundSlideBlending.prompts.build.*`
- `games.soundSlideBlending.prompts.choose.*`
- `games.soundSlideBlending.prompts.transfer.*`
- `games.soundSlideBlending.hints.*`
- `games.soundSlideBlending.feedback.success.*`
- `games.soundSlideBlending.feedback.retry.*`
- `games.soundSlideBlending.progression.*`
- `games.soundSlideBlending.completion.*`

## Runtime event -> i18n key contract

| Runtime event | i18n key |
|---|---|
| `instruction_replay_icon_tap` | `games.soundSlideBlending.instructions.tapReplay` |
| `control_replay_tap` | `games.soundSlideBlending.controls.replayCue` |
| `control_retry_tap` | `games.soundSlideBlending.controls.retryCue` |
| `control_hint_tap` | `games.soundSlideBlending.controls.hintCue` |
| `control_next_tap` | `games.soundSlideBlending.controls.nextCue` |
| `rail_swipe_blend` | `games.soundSlideBlending.prompts.listen.segmentedModel` -> `games.soundSlideBlending.prompts.listen.blendedModel` |
| `hint_stage_1` | `games.soundSlideBlending.hints.stage1ReplayBlend` |
| `hint_stage_2` | `games.soundSlideBlending.hints.stage2HighlightPair` |
| `hint_stage_3` | `games.soundSlideBlending.hints.stage3ReduceAndModel` |
| `rapid_tap_pause_replay` | `games.soundSlideBlending.feedback.retry.antiRandomTapPauseReplay` |

## Segmented-to-blended timing proposal

- For `rail_swipe_blend`, play `prompts.listen.segmentedModel` first.
- Insert `180-250ms` pause, then play `prompts.listen.blendedModel`.
- Hard cap: segmented-to-blended gap `<=300ms`.
- Replay response target after icon tap: audio starts in `<=250ms`.

## Audio path contract

Generated via `yarn generate-audio`:

- `/audio/he/games/sound-slide-blending/instructions/*.mp3`
- `/audio/he/games/sound-slide-blending/controls/*.mp3`
- `/audio/he/games/sound-slide-blending/prompts/listen/*.mp3`
- `/audio/he/games/sound-slide-blending/prompts/build/*.mp3`
- `/audio/he/games/sound-slide-blending/prompts/choose/*.mp3`
- `/audio/he/games/sound-slide-blending/prompts/transfer/*.mp3`
- `/audio/he/games/sound-slide-blending/hints/*.mp3`
- `/audio/he/games/sound-slide-blending/feedback/success/*.mp3`
- `/audio/he/games/sound-slide-blending/feedback/retry/*.mp3`
- `/audio/he/games/sound-slide-blending/progression/**/*.mp3`
- `/audio/he/games/sound-slide-blending/completion/*.mp3`
- `/audio/he/parent-dashboard/games/sound-slide-blending/*.mp3`

Manifest source of truth:

- `packages/web/public/audio/he/manifest.json`

## Parent dashboard keys

- `parentDashboard.games.soundSlideBlending.progressSummary`
- `parentDashboard.games.soundSlideBlending.confusions`
- `parentDashboard.games.soundSlideBlending.independenceSplit`
- `parentDashboard.games.soundSlideBlending.nextStep`

## Parity check

- `68` keys under `common.games.soundSlideBlending.*`
- `4` keys under `common.parentDashboard.games.soundSlideBlending.*`
- `4` linked additions under `common.syllables.pronunciation.*` (`daPatah`, `deSegol`, `diHirik`, `doHolam`)
- `76` targeted keys total
- `0` missing manifest mappings
- `0` missing audio files on disk
