# Decodable Story Missions (Hebrew: משימות סיפורים מפוענחים)

## Learning Objective
- Curriculum stage: Word Reading -> Phrase & Sentence Reading -> Reading Comprehension -> Decodable Stories.
- Core reading skill: read controlled, fully pointed mini-books with decode-first checkpoints and literal comprehension transfer.
- Measurable outcome: after 8 sessions, child completes Level 2 story missions with >=85% decode accuracy and >=80% literal-comprehension accuracy while keeping hint-stage-3 usage <=1 per mission.
- Milestone mapping (age ~6):
  - Sustains decoding behavior in connected text, not isolated drills.
  - Connects accurate word reading to simple sentence-level understanding.

## Curriculum Position
- Placement in reading ladder:
  1. After `decodable-micro-stories` baseline completion.
  2. After stable CV/CVC blending and high-frequency word support.
  3. Before partially pointed long-form handbook reading.
- Prerequisites:
  - Child can decode short pointed phrases with moderate independence.
  - Child has seen decode-first interaction model in prior story lane.
- What comes next:
  - Partially pointed bridge stories.
  - Longer comprehension tasks (sequence, simple inference) after literal mastery.

## Target Age Range
- Primary: 6-7
- Entry support: strong 5.8+

## Mechanic
- Primary interaction: mission-map story progression where each page includes a decode-first micro task before comprehension.
- Core loop:
  1. Child enters a story mission (5-8 pages).
  2. Reads a highlighted pointed sentence with optional replay (`▶`).
  3. Completes immediate decode action (tap target word, reorder syllables, or choose matching pointed phrase).
  4. Completes one literal comprehension action (select, sequence, yes/no).
  5. Receives recap and unlocks next mission checkpoint.
- Engine fit:
  - One DB row in `games` (`slug: decodableStoryMissions`, `game_type: story_mission_decode`).
  - One runtime component: `DecodableStoryMissionsGame`.
- RTL/mobile requirements:
  - Mission map, story text flow, and action layouts are RTL-first.
  - Every tappable target is >=44px.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), next (`→`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Icon Inventory (Mandatory)

| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays active instruction or page narration (`games.decodableStoryMissions.instructions.*`, `games.decodableStoryMissions.missions.<id>.narration.*`) | Active sentence pulse + word highlight reset on current task. |
| Retry round | `↻` | Encouragement + retry cue (`games.decodableStoryMissions.feedback.retry.*`) then prompt replay | Soft reset of same concept; no score loss. |
| Hint | `💡` | Context hint by stage (`games.decodableStoryMissions.hints.stage1.*`, `stage2.*`, `stage3.*`) | One-step scaffold only (never auto-solves full page). |
| Next / continue | `→` | Transition cue (`games.decodableStoryMissions.feedback.success.transition.*`) | Moves to next page/checkpoint with short progress animation. |

## Image Strategy
- Story illustrations support narrative engagement, not decoding solutions.
- Decode-first lock:
  - Comprehension image interactions stay disabled until decode action is complete.
  - Target words appear before image reveal on scored pages.
- Fade plan:
  - Level 1: full scene art.
  - Level 2: reduced clue detail in answer areas.
  - Level 3: periodic text-only decode cards before image return.

## Decode-First Gate Contract (Mandatory)

| Gate | Runtime rule | Recovery behavior |
|---|---|---|
| Page unlock gate | Comprehension controls remain disabled until current page decode action is solved. | Pre-unlock taps trigger gentle nudge + replay; no penalty. |
| Image hotspot gate | Story hotspots are hidden/disabled until at least one text interaction and one decode attempt are recorded. | After `2` hotspot taps before decode, show overlay arrow to text target. |
| Mission progression gate | Mark mission as `independent-pass` only when decode-first completion is `>=80%` of scored pages and hint-stage-3 usage is `<=1`. | If gate is missed, mission still completes as `supported-pass` and injects one recovery mission before new mission unlock. |
| Anti-random-tap gate | Trigger when `>=4` non-target taps in `<2s` or `3` responses in a row under `600ms`. | Pause input `900ms`, replay model line, then reduce options by `1` on retry. |

## Difficulty Curve
- Level 1 (Guided Mission Pages):
  - Fully pointed text, one short sentence per page, `5-6` pages per mission.
  - One decode action per page, literal comprehension every `2` pages.
  - Hint ladder timing: stage 1 after first miss, stage 2 after second miss, stage 3 after third miss or `>8s` inactivity.
- Level 2 (Independent Mission Flow):
  - Fully pointed text with controlled high-frequency words.
  - Up to two short sentences per page, `6-7` pages per mission.
  - Decode + literal comprehension both present on most pages.
  - Reduced replay prompting, but replay icon remains always available.
  - Promotion gate to Level 3: `2` consecutive `independent-pass` missions with decode `>=85%` and literal comprehension `>=80%`.
- Level 3 (Bridge Mission):
  - Keep one new variable per cluster:
    - Cluster A (`first 2 missions`): introduce partial-pointing fade on mastered words only (`<=10` percentage-point fade per mission cluster) while keeping literal comprehension format unchanged.
    - Cluster B (`after Cluster A gate`): keep pointing profile stable and introduce sequence comprehension every `2` pages.
  - Decode remains first action on every scored page; no comprehension-format jump in the same cluster as new pointing fade.
- Adaptive scaffolding:
  - Two consecutive decode misses trigger forced contrast item (same grapheme frame, different vowel/pattern).
  - If hint-stage-3 is used twice in one mission or decode first-try accuracy falls below `70%`, assign one recovery mission next (fully pointed + max `2` options), then return to current level.
  - No permanent demotion inside the same session; max one recovery mission per mission block.
  - If child clears 3 missions with high independent accuracy, unlock stretch mission set.

## Feedback Design
- Success:
  - Specific praise tied to reading action ("קראת ואז פתרת את המשימה!").
  - Mission badges emphasize independent decoding.
- Mistakes:
  - Gentle correction and immediate retry.
  - No penalty loss; progression depends on completion, not speed.
  - Repeated misses trigger scaffolded recovery page before continuing mission.
- Hint progression:
  1. Replay model sentence.
  2. Highlight target grapheme/word chunk.
  3. Reduce response options and provide one solved exemplar.
  - Regression fairness rule: after a stage-3 hint page, next scored page starts with stage-1 support pre-armed (no immediate repeat stage-3).

## Session Design
- Mission loop target: 4-6 minutes per mission.
- Session length: 8-12 minutes (`1` mission standard, optional `2nd` mission if child opts in).
- Session structure:
  - 1 mission baseline + optional second mission.
  - 6-9 decode actions and 3-4 comprehension checks.
- Natural stopping points:
  - Mission checkpoint pages.
  - End-of-mission summary card with continue/stop choice.
- Replay hooks:
  - Daily "review mission" built from prior error patterns.
  - Weekly themed mission rotation for repeated decoding practice with new stories.

## Audio Requirements
- All story text, prompts, and feedback are i18n-keyed with Hebrew audio.
- Required key families:
  - `games.decodableStoryMissions.title`
  - `games.decodableStoryMissions.instructions.*`
  - `games.decodableStoryMissions.missions.<id>.narration.*`
  - `games.decodableStoryMissions.missions.<id>.decodePrompt.*`
  - `games.decodableStoryMissions.missions.<id>.comprehension.*`
  - `games.decodableStoryMissions.hints.stage1.*`
  - `games.decodableStoryMissions.hints.stage2.*`
  - `games.decodableStoryMissions.hints.stage3.*`
  - `games.decodableStoryMissions.controls.replay`
  - `games.decodableStoryMissions.controls.retry`
  - `games.decodableStoryMissions.controls.hint`
  - `games.decodableStoryMissions.controls.next`
  - `games.decodableStoryMissions.feedback.success.*`
  - `games.decodableStoryMissions.feedback.success.transition.*`
  - `games.decodableStoryMissions.feedback.retry.*`
  - `games.decodableStoryMissions.level3.clusterA.*`
  - `games.decodableStoryMissions.level3.clusterB.*`
  - `words.pronunciation.*`
  - `phrases.pronunciation.*`
- Stage-specific hint contract (age `6-7`, short lines only):
  - Stage 1 replay cue: `games.decodableStoryMissions.hints.stage1.replayCue|afterFirstMiss|afterInactivity`
  - Stage 2 grapheme/chunk focus cue: `games.decodableStoryMissions.hints.stage2.graphemeFocus|chunkFocus|nikudFocus`
  - Stage 3 reduced-options modeled exemplar: `games.decodableStoryMissions.hints.stage3.reducedOptionsModel|modeledExemplar|oneMoreWithTwoChoices`
- Decode-first recovery cue coverage (mandatory Hebrew + audio):
  - Pre-unlock nudge when comprehension is tapped before decode:
    - `games.decodableStoryMissions.feedback.retry.preUnlockNudge`
  - Anti-random-tap pause+replay line:
    - `games.decodableStoryMissions.feedback.retry.antiRandomTapPauseReplay`
- Runtime gate event -> i18n key mapping contract (must stay `1:1` with [DUB-706](/DUB/issues/DUB-706)):
  - `decode_gate_pre_unlock_tap` -> `games.decodableStoryMissions.feedback.retry.preUnlockNudge`
  - `anti_random_tap_pause_replay` -> `games.decodableStoryMissions.feedback.retry.antiRandomTapPauseReplay`
  - `control_replay_tap` -> `games.decodableStoryMissions.controls.replay`
  - `control_retry_tap` -> `games.decodableStoryMissions.controls.retry`
  - `control_hint_tap` -> `games.decodableStoryMissions.controls.hint`
  - `control_next_tap` -> `games.decodableStoryMissions.controls.next`
  - `mission_transition_next_page` -> `games.decodableStoryMissions.feedback.success.transition.toNextPage`
  - `mission_transition_checkpoint` -> `games.decodableStoryMissions.feedback.success.transition.checkpointUnlocked`
  - `mission_transition_next_mission` -> `games.decodableStoryMissions.feedback.success.transition.toNextMission`
- Asset pattern:
  - `public/audio/he/games/decodable-story-missions/*.mp3`
  - `public/audio/he/words/*.mp3`
  - `public/audio/he/phrases/*.mp3`
- Audio behavior constraints:
  - Word-tap pronunciation starts in <=250ms.
  - Narration and prompts duck background by >=6dB.
- Level 3 nikud consistency (must hold in copy + audio):
  - Cluster A (`first 2 missions`): partial-pointing fade only on mastered words (`games.decodableStoryMissions.level3.clusterA.*`).
  - Cluster B (`after Cluster A gate`): preserve the same pointing profile, then introduce sequence prompt language (`games.decodableStoryMissions.level3.clusterB.sequencePromptLanguage`).

## Parent Visibility
- Parent dashboard metrics:
  - Decode accuracy by mission and pattern set.
  - Literal comprehension accuracy by mission.
  - Independent-read rate vs hint-assisted completion.
  - Decode-first completion rate (`independent-pass` vs `supported-pass`).
  - Recovery-mission trigger rate and hint-stage-3 trend.
  - Recommended next content set (review mission / advance mission).
- Suggested parent key families:
  - `parentDashboard.games.decodableStoryMissions.progressSummary`
  - `parentDashboard.games.decodableStoryMissions.missionBreakdown`
  - `parentDashboard.games.decodableStoryMissions.nextStep`

## Inspiration / References
- Reading Eggs: leveled decodable books anchored to explicit phonics sequence.
- HOMER: narrative engagement with scaffolded reading checkpoints.
- Khan Academy Kids ELA: mastery dashboards with transparent parent signals.

## Review Request
- Request Gaming Expert review for mission pacing and anti-guessing gates.
- Request Content Writer review for decodable text control, nikud consistency, and narration flow.
