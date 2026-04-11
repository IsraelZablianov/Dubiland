# Decodable Story Missions — i18n/Audio Integration Map

Reference contract for [DUB-706](/DUB/issues/DUB-706) runtime wiring and [DUB-708](/DUB/issues/DUB-708) mechanics alignment.

## Canonical Prefixes
- `common.games.decodableStoryMissions.*`
- `common.parentDashboard.games.decodableStoryMissions.*`
- `common.words.pronunciation.*` (mission vocabulary support)
- `common.phrases.pronunciation.*` (decode-first sentence support)

## Required Runtime Families
- `games.decodableStoryMissions.instructions.*`
- `games.decodableStoryMissions.controls.replay|retry|hint|next`
- `games.decodableStoryMissions.hints.stage1.*`
- `games.decodableStoryMissions.hints.stage2.*`
- `games.decodableStoryMissions.hints.stage3.*`
- `games.decodableStoryMissions.missions.<id>.narration.*`
- `games.decodableStoryMissions.missions.<id>.decodePrompt.*`
- `games.decodableStoryMissions.missions.<id>.comprehension.*`
- `games.decodableStoryMissions.feedback.success.transition.*`
- `games.decodableStoryMissions.feedback.retry.*`

## Gate Event -> i18n Key (1:1)
| Runtime event | i18n key |
|---|---|
| `decode_gate_pre_unlock_tap` | `games.decodableStoryMissions.feedback.retry.preUnlockNudge` |
| `anti_random_tap_pause_replay` | `games.decodableStoryMissions.feedback.retry.antiRandomTapPauseReplay` |
| `control_replay_tap` | `games.decodableStoryMissions.controls.replay` |
| `control_retry_tap` | `games.decodableStoryMissions.controls.retry` |
| `control_hint_tap` | `games.decodableStoryMissions.controls.hint` |
| `control_next_tap` | `games.decodableStoryMissions.controls.next` |
| `mission_transition_next_page` | `games.decodableStoryMissions.feedback.success.transition.toNextPage` |
| `mission_transition_checkpoint` | `games.decodableStoryMissions.feedback.success.transition.checkpointUnlocked` |
| `mission_transition_next_mission` | `games.decodableStoryMissions.feedback.success.transition.toNextMission` |

## Hint Ladder Copy Contract (Age 6-7, short)
- Stage 1 replay cue: `hints.stage1.replayCue|afterFirstMiss|afterInactivity`
- Stage 2 grapheme/chunk cue: `hints.stage2.graphemeFocus|chunkFocus|nikudFocus`
- Stage 3 reduced-options modeled exemplar: `hints.stage3.reducedOptionsModel|modeledExemplar|oneMoreWithTwoChoices`

## Level 3 Nikud Consistency Contract
- Cluster A (`games.decodableStoryMissions.level3.clusterA.*`): partial-pointing fade only on mastered words.
- Cluster B (`games.decodableStoryMissions.level3.clusterB.*`): same pointing profile as Cluster A, then add sequence prompt language.

## Parent Summary Keys
- `parentDashboard.games.decodableStoryMissions.progressSummary`
- `parentDashboard.games.decodableStoryMissions.missionBreakdown`
- `parentDashboard.games.decodableStoryMissions.nextStep`
