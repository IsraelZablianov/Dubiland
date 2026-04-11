# Spell-and-Send Post Office — i18n + Audio Map

Issues: [DUB-786](/DUB/issues/DUB-786), [DUB-783](/DUB/issues/DUB-783), [DUB-789](/DUB/issues/DUB-789)  
Spec: `docs/games/spell-and-send-post-office.md`

## Canonical key families

- `common.games.spellAndSendPostOffice.*`
- `common.parentDashboard.games.spellAndSendPostOffice.*`
- Linked pronunciation families:
- `common.words.pronunciation.*`
- `common.phrases.pronunciation.*`

## Required runtime families

- `games.spellAndSendPostOffice.instructions.*`
- `games.spellAndSendPostOffice.controls.*`
- `games.spellAndSendPostOffice.prompts.listen.*`
- `games.spellAndSendPostOffice.prompts.encode.*`
- `games.spellAndSendPostOffice.prompts.stages.*`
- `games.spellAndSendPostOffice.prompts.phraseBridge.*`
- `games.spellAndSendPostOffice.prompts.inactivity.*`
- `games.spellAndSendPostOffice.hints.*`
- `games.spellAndSendPostOffice.feedback.success.*`
- `games.spellAndSendPostOffice.feedback.retry.*`
- `games.spellAndSendPostOffice.segmentedWords.<wordId>.part1|part2`
- `games.spellAndSendPostOffice.completion.*`

## Runtime event -> i18n key contract

| Runtime event | i18n key |
|---|---|
| `instruction_replay_icon_tap` | `games.spellAndSendPostOffice.instructions.tapReplay` |
| `control_replay_tap` | `games.spellAndSendPostOffice.controls.replayCue` |
| `control_retry_tap` | `games.spellAndSendPostOffice.controls.retryCue` |
| `control_hint_tap` | `games.spellAndSendPostOffice.controls.hintCue` |
| `control_next_tap` | `games.spellAndSendPostOffice.controls.nextCue` |
| `inactivity_6s_replay` | `games.spellAndSendPostOffice.prompts.inactivity.replayAfterPause` |
| `anti_guess_tier1_reset` | `games.spellAndSendPostOffice.hints.antiGuessTier1Reset` |
| `anti_guess_tier2_modeled` | `games.spellAndSendPostOffice.hints.antiGuessTier2ModeledRecovery` |
| `hint_stage_1` | `games.spellAndSendPostOffice.hints.stage1ReplayWord` |
| `hint_stage_2` | `games.spellAndSendPostOffice.hints.stage2SegmentedWord` |
| `hint_stage_3` | `games.spellAndSendPostOffice.hints.stage3RevealSlot` |
| `postcard_send_next_word` | `games.spellAndSendPostOffice.feedback.success.transition.nextWord` |

## Sub-stage word pools (curated)

### L1 (3-letter warm-up)

- `words.pronunciation.dag`
- `words.pronunciation.sal`
- `words.pronunciation.gam`
- `words.pronunciation.kad`
- `words.pronunciation.gal`
- `words.pronunciation.hag`

### L2A (4-letter without final-form focus)

- `words.pronunciation.delet`
- `words.pronunciation.gesher`
- `words.pronunciation.kadur`
- `words.pronunciation.kore`
- `words.pronunciation.kotev`
- `words.pronunciation.mafteah`
- `words.pronunciation.mikhtav`
- `words.pronunciation.shomer`

### L2B (4-letter, one final-form family per block, target share 25%)

| Block | Final-form family | Sequence (8 items) | Final-form targets |
|---|---|---|---|
| `l2b-kaf` | כ/ך | `delet`, `kore`, `malakh`, `kadur`, `shomer`, `arukh`, `gesher`, `mikhtav` | `malakh`, `arukh` |
| `l2b-mem` | מ/ם | `kadur`, `kotev`, `shalom`, `delet`, `mikhtav`, `halom`, `gesher`, `shomer` | `shalom`, `halom` |
| `l2b-nun` | נ/ן | `mafteah`, `kore`, `balon`, `delet`, `shomer`, `sakin`, `kadur`, `mikhtav` | `balon`, `sakin` |
| `l2b-pe` | פ/ף | `gesher`, `kotev`, `atuf`, `kadur`, `kore`, `tsafuf`, `delet`, `shomer` | `atuf`, `tsafuf` |
| `l2b-tsadi` | צ/ץ | `mikhtav`, `shomer`, `rahuts`, `kore`, `kadur`, `kafuts`, `delet`, `gesher` | `rahuts`, `kafuts` |

Guardrails enforced by this table:

- first three items contain no back-to-back final-form targets
- one family only per block
- final-form density = `2/8 = 25%` per block

### L3A (5-letter single-word encoding)

- `words.pronunciation.sipur`
- `words.pronunciation.shulhan`
- `words.pronunciation.arnava`
- `words.pronunciation.madrekha`
- `words.pronunciation.hanukha`
- `words.pronunciation.yeladim`

### L3B (word-to-phrase bridge)

- `phrases.pronunciation.shalomDubi`
- `phrases.pronunciation.mikhtavArukh`
- `phrases.pronunciation.shulhanGadol`
- `phrases.pronunciation.sipurKatsar`
- `phrases.pronunciation.balonKahol`
- `phrases.pronunciation.malakhTov`

## Segmented-word script contract

Each target word has two clip keys:

- `games.spellAndSendPostOffice.segmentedWords.<wordId>.part1`
- `games.spellAndSendPostOffice.segmentedWords.<wordId>.part2`

Examples:

- `mikhtav`: `מִכְ` + `תָּב`
- `malakh`: `מַלְ` + `אָךְ`
- `shalom`: `שָׁ` + `לוֹם`
- `rahuts`: `רָ` + `חוּץ`
- `madrekha`: `מַדְ` + `רֵכָה`

## Timing contract

- segmented hint playback gap (`part1 -> part2`): `250-320ms`
- replay start target after icon tap: `<=250ms`
- anti-guess tier 1 pause: `900ms`
- anti-guess tier 2 pause: `1200ms`

## Parent dashboard keys

- `parentDashboard.games.spellAndSendPostOffice.progressSummary`
- `parentDashboard.games.spellAndSendPostOffice.finalFormAccuracy`
- `parentDashboard.games.spellAndSendPostOffice.nextStep`

## Audio path contract

Generated via `yarn generate-audio`:

- `/audio/he/games/spell-and-send-post-office/instructions/*.mp3`
- `/audio/he/games/spell-and-send-post-office/controls/*.mp3`
- `/audio/he/games/spell-and-send-post-office/prompts/**/*.mp3`
- `/audio/he/games/spell-and-send-post-office/hints/*.mp3`
- `/audio/he/games/spell-and-send-post-office/feedback/**/*.mp3`
- `/audio/he/games/spell-and-send-post-office/segmented-words/**/*.mp3`
- `/audio/he/games/spell-and-send-post-office/completion/*.mp3`
- `/audio/he/parent-dashboard/games/spell-and-send-post-office/*.mp3`
- `/audio/he/words/pronunciation/*.mp3` (for added pool items)
- `/audio/he/phrases/pronunciation/*.mp3` (for phrase-bridge targets)

Manifest source of truth:

- `packages/web/public/audio/he/manifest.json`

## Parity check

- `122` keys under `common.games.spellAndSendPostOffice.*` (including `60` segmented-word clips)
- `3` keys under `common.parentDashboard.games.spellAndSendPostOffice.*`
- `16` linked additions under `common.words.pronunciation.*`
- `6` linked additions under `common.phrases.pronunciation.*`
- `147` targeted keys total
- `0` missing manifest mappings
- `0` missing audio files on disk
