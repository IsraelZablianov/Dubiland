# Pointing Fade Bridge — i18n + Audio Map

Issues: [DUB-787](/DUB/issues/DUB-787), [DUB-784](/DUB/issues/DUB-784), [DUB-790](/DUB/issues/DUB-790)  
Spec: `docs/games/pointing-fade-bridge.md`

## Canonical key families

- `common.games.pointingFadeBridge.*`
- `common.parentDashboard.games.pointingFadeBridge.*`
- Linked pronunciation families:
- `common.words.pronunciation.*`
- `common.phrases.pronunciation.*`
- `common.sentences.pronunciation.*`

## Required runtime families

- `games.pointingFadeBridge.instructions.*`
- `games.pointingFadeBridge.controls.*`
- `games.pointingFadeBridge.prompts.stages.*`
- `games.pointingFadeBridge.prompts.decodeAttempt.*`
- `games.pointingFadeBridge.prompts.transition.*`
- `games.pointingFadeBridge.hints.*`
- `games.pointingFadeBridge.feedback.success.*`
- `games.pointingFadeBridge.feedback.retry.*`
- `games.pointingFadeBridge.progression.tokenPolicy.*`
- `games.pointingFadeBridge.progression.gates.*`
- `games.pointingFadeBridge.progression.recovery.*`
- `games.pointingFadeBridge.completion.*`

## Runtime event -> i18n key contract

| Runtime event | i18n key |
|---|---|
| `instruction_replay_icon_tap` | `games.pointingFadeBridge.instructions.tapReplay` |
| `control_replay_tap` | `games.pointingFadeBridge.controls.replayCue` |
| `control_retry_tap` | `games.pointingFadeBridge.controls.retryCue` |
| `control_hint_tap` | `games.pointingFadeBridge.controls.hintCue` |
| `control_next_tap` | `games.pointingFadeBridge.controls.nextCue` |
| `stage_l1_loaded` | `games.pointingFadeBridge.prompts.stages.l1FullyPointed` |
| `stage_l2a_loaded` | `games.pointingFadeBridge.prompts.stages.l2aControlledPartial` |
| `stage_l2b_loaded` | `games.pointingFadeBridge.prompts.stages.l2bDeeperPartial` |
| `stage_l3a_loaded` | `games.pointingFadeBridge.prompts.stages.l3aMostlyUnpointed` |
| `stage_l3b_loaded` | `games.pointingFadeBridge.prompts.stages.l3bMixedAction` |
| `decode_attempt_required` | `games.pointingFadeBridge.prompts.decodeAttempt.tryBeforeHint` |
| `hint_stage_1` | `games.pointingFadeBridge.hints.stage1ReplaySentence` |
| `hint_stage_2` | `games.pointingFadeBridge.hints.stage2HighlightBoundary` |
| `hint_stage_3` | `games.pointingFadeBridge.hints.stage3RevealOneToken` |
| `hint_reveal_locked_until_attempt` | `games.pointingFadeBridge.hints.decodeAttemptFirst` |
| `fade_token_miss_twice_restore` | `games.pointingFadeBridge.hints.restorePointingAfterMisses` |
| `anti_random_tap_tier_1` | `games.pointingFadeBridge.hints.antiRandomTapTier1` |
| `anti_random_tap_tier_2` | `games.pointingFadeBridge.hints.antiRandomTapTier2` |
| `success_transition_next_card` | `games.pointingFadeBridge.feedback.success.transition.nextCard` |
| `success_transition_next_stage` | `games.pointingFadeBridge.feedback.success.transition.nextStage` |
| `retry_after_fast_taps` | `games.pointingFadeBridge.feedback.retry.antiRandomTapPauseReplay` |

## Token-level pointing policy map

| Policy | Contract | i18n key |
|---|---|---|
| New token protection | New/low-confidence tokens stay fully pointed for first 2 scored exposures. | `games.pointingFadeBridge.progression.tokenPolicy.newTokenProtected` |
| Fade eligibility | Fade only after `>=2/3` first-try correct reads with `<=1` hint in last 3 pointed exposures. | `games.pointingFadeBridge.progression.tokenPolicy.fadeEligibility` |
| Fade rollback | If a faded token is missed twice in the same block, restore full pointing for next 3 exposures. | `games.pointingFadeBridge.progression.tokenPolicy.fadeRollback` |
| Decode-first reveal lock | Nikud-reveal hint unlocks only after at least one decode attempt. | `games.pointingFadeBridge.progression.tokenPolicy.decodeFirstHintLock` |
| Single reveal limit | Same token cannot be reveal-hinted twice in one round. | `games.pointingFadeBridge.progression.tokenPolicy.singleRevealLimit` |

## Fade stage narration + sentence set pack

| Stage | Stage narration key | Sentence narration keys | Pointing profile |
|---|---|---|---|
| `L1` | `games.pointingFadeBridge.prompts.stages.l1FullyPointed` | `sentences.pronunciation.pointingFadeBridgeL1Set1`, `sentences.pronunciation.pointingFadeBridgeL1Set2` | Fully pointed baseline |
| `L2A` | `games.pointingFadeBridge.prompts.stages.l2aControlledPartial` | `sentences.pronunciation.pointingFadeBridgeL2aSet1`, `sentences.pronunciation.pointingFadeBridgeL2aSet2` | One mastered token faded |
| `L2B` | `games.pointingFadeBridge.prompts.stages.l2bDeeperPartial` | `sentences.pronunciation.pointingFadeBridgeL2bSet1`, `sentences.pronunciation.pointingFadeBridgeL2bSet2` | Two mastered tokens faded |
| `L3A` | `games.pointingFadeBridge.prompts.stages.l3aMostlyUnpointed` | `sentences.pronunciation.pointingFadeBridgeL3aSet1`, `sentences.pronunciation.pointingFadeBridgeL3aSet2` | Mostly unpointed, difficult token(s) pointed |
| `L3B` | `games.pointingFadeBridge.prompts.stages.l3bMixedAction` | `sentences.pronunciation.pointingFadeBridgeL3bSet1`, `sentences.pronunciation.pointingFadeBridgeL3bSet2` | Mostly unpointed + mixed action validation |

## Linked pronunciation additions

### `words.pronunciation`

- `mila`
- `milim`
- `mispat`
- `hadasha`
- `hasera`
- `nikud`

### `phrases.pronunciation`

- `pointingFadeBridgeStageL1`
- `pointingFadeBridgeStageL2a`
- `pointingFadeBridgeStageL2b`
- `pointingFadeBridgeStageL3a`
- `pointingFadeBridgeStageL3b`
- `pointingFadeBridgeDecodeFirst`

### `sentences.pronunciation`

- `pointingFadeBridgeL1Set1`
- `pointingFadeBridgeL1Set2`
- `pointingFadeBridgeL2aSet1`
- `pointingFadeBridgeL2aSet2`
- `pointingFadeBridgeL2bSet1`
- `pointingFadeBridgeL2bSet2`
- `pointingFadeBridgeL3aSet1`
- `pointingFadeBridgeL3aSet2`
- `pointingFadeBridgeL3bSet1`
- `pointingFadeBridgeL3bSet2`

## Audio path contract

Generated via `yarn generate-audio`:

- `/audio/he/games/pointing-fade-bridge/instructions/*.mp3`
- `/audio/he/games/pointing-fade-bridge/controls/*.mp3`
- `/audio/he/games/pointing-fade-bridge/prompts/stages/*.mp3`
- `/audio/he/games/pointing-fade-bridge/prompts/decode-attempt/*.mp3`
- `/audio/he/games/pointing-fade-bridge/prompts/transition/*.mp3`
- `/audio/he/games/pointing-fade-bridge/hints/*.mp3`
- `/audio/he/games/pointing-fade-bridge/feedback/success/**/*.mp3`
- `/audio/he/games/pointing-fade-bridge/feedback/retry/*.mp3`
- `/audio/he/games/pointing-fade-bridge/progression/**/*.mp3`
- `/audio/he/games/pointing-fade-bridge/completion/*.mp3`
- `/audio/he/parent-dashboard/games/pointing-fade-bridge/*.mp3`
- `/audio/he/words/pronunciation/*.mp3` (linked additions)
- `/audio/he/phrases/pronunciation/*.mp3` (linked additions)
- `/audio/he/sentences/pronunciation/*.mp3` (stage sentence pack)

Manifest source of truth:

- `packages/web/public/audio/he/manifest.json`

## Parity check

- `66` keys under `common.games.pointingFadeBridge.*`
- `3` keys under `common.parentDashboard.games.pointingFadeBridge.*`
- `6` linked additions under `common.words.pronunciation.*`
- `6` linked additions under `common.phrases.pronunciation.*`
- `10` linked additions under `common.sentences.pronunciation.*`
- `91` targeted keys total
- `0` missing manifest mappings
- `0` missing audio files on disk
- `yarn generate-audio` -> `Done! 4078/4078 generated`
