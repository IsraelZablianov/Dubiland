# Shva Sound Switch (Hebrew: מתג שווא)

## Learning Objective
- Curriculum stage: Nikud (Vowel Diacritics) -> Syllable Decoding.
- Core reading skill: distinguish beginner-level shva behavior in controlled pointed words/syllables (audible shva-na vs silent shva-nach cases introduced gradually).
- Measurable outcome: after 5 sessions, child correctly decodes shva-target syllables in >=80% of Level 2 rounds and reads Level 3 pointed words with <=1 hint per round.
- Milestone mapping (age ~6):
  - Notices that not every marked sign is pronounced the same way in every position.
  - Uses guided decoding rather than guessing when shva appears.

## Curriculum Position
- Placement in reading ladder: after core nikud familiarity (patah/kamatz/segol/tzere/chirik/cholam/shuruk) and early CV/CVC blending.
- Prerequisites:
  - Child reads short pointed syllables and simple pointed words.
  - Child has basic blending fluency.
  - Child can use icon-first controls (`▶`, `↻`, `💡`).
- What comes next:
  - More complex syllable decoding with mixed vowel patterns.
  - Phrase reading with controlled shva exposure.

## Target Age Range
- Primary: 6-7
- Supported with heavy scaffolding: advanced 5.8+

## Mechanic
- Primary interaction: tap-to-hear and choose + drag-to-blend syllable rails.
- Core loop:
  1. דובי presents a pointed target syllable/word with shva and plays model audio.
  2. Child selects the correct spoken pattern from two audio options.
  3. Child drags letter tiles to blend the target sequence on an RTL syllable rail.
  4. Child reads one short pointed transfer word/mini-phrase.
- Engine fit:
  - One DB row in `games` table (`slug: shvaSoundSwitch`, `game_type: shva_choose_blend`).
  - One gameplay component: `ShvaSoundSwitchGame`.
- RTL/mobile requirements:
  - Syllable rails and blending animation run RTL.
  - All interaction targets are >=44px.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays current prompt (`games.shvaSoundSwitch.instructions.*`) | Current shva target pulses and model replay starts. |
| Retry round | `↻` | Encouragement + prompt replay | Resets same item with no penalty. |
| Hint | `💡` | Progressive hint (`games.shvaSoundSwitch.hints.*`) | Adds syllable segmentation cue and slowed audio. |
| Continue | `→` | Success transition cue | Moves to next controlled shva item. |

## Image Strategy
- No images in core decoding rounds.
- Optional lightweight mnemonic image may appear only in onboarding (first minute) to reduce anxiety, then fully removed.
- Guardrail: decoding interactions remain text+audio first for orthographic attention.

## Difficulty Curve
- Level 1 (Guided Shva Listening):
  - Two-option audio choice with clear model replay and segmented syllable cue.
  - Only highly controlled examples with consistent patterning.
- Level 2 (Blend and Decide):
  - Child both chooses correct audio and drags tiles to blend target.
  - Add near-miss distractor that differs only in shva handling.
  - Reduce visual cues after first second.
- Level 3 (Transfer Word/Phrase):
  - Child decodes short pointed word, then one 2-4 word pointed phrase.
  - Mix previously trained shva patterns with non-shva controls.
  - No new rule complexity until mastery threshold is met.
- Adaptive logic:
  - Use the calibrated sequencing and thresholds below as the single source of truth.
  - Struggle handling is cluster-local (fallback only for the active shva cluster).
  - Mastered clusters move to spaced review, not full removal.

### Shva Cluster Sequencing And Distractor Distance (Calibrated)
- Cluster order for first ship:
  1. Audible shva in predictable prefix patterns (`בְ`, `לְ`, `כְ`) with familiar word stems.
  2. Controlled silent-shva contrasts in short pointed words where letter order stays constant.
  3. Mixed audible/silent shva contrasts with one non-shva control item per block.
- Distractor distance policy:
  - Level 1: 2 audio choices only; distractor must differ in both rhythm and shva realization.
  - Level 2 early: 2 audio choices + blend rail; distractor differs only in shva handling (near-miss).
  - Level 2 late: 3 choices max (target, near-miss shva foil, far non-shva foil).
  - Level 3 transfer: 3 choices max, with at least one same-onset foil every 4 items.
- Isolation rule: add only one new variable per block (new cluster, more options, or reduced cueing).

### Adaptive Thresholds (Calibrated)
- Promotion gate (L1 -> L2):
  - Listen/choose first-try accuracy `>=80%` across last 10 items, and
  - Hint usage `<=2` in that window.
- Promotion gate (L2 -> L3):
  - Combined choose+blend first-try accuracy `>=85%` across last 12 items, and
  - Blend-rail completion accuracy `>=80%`, and
  - No more than 1 random-tap intervention in that window.
- Regression gate (any level):
  - First-try accuracy `<60%` across 8 items, or
  - 3 consecutive errors on one shva cluster, or
  - 3 level-3 hints in one block.
  - If triggered, step down one level for next 4 items, then re-evaluate.
- Slow mode behavior:
  - Trigger: 2 hints in one block or 2 consecutive errors.
  - Effect: segmented audio at `0.85x`, blend-boundary highlight +400ms, and options reduced by 1 for next 2 items.
  - Exit: 2 first-try correct responses in slow mode.

### Transfer Anti-Guessing Rules (Calibrated)
- Level 3 transfer rounds require two actions to pass: correct listen/choose plus correct blend completion.
- At least 50% of transfer items must be full-word decoding items where end-state cannot be inferred from one letter cue.
- One minimal contrast set every 4 items should keep graphemes constant and vary only shva realization.
- Choice order must be shuffled every trial; correct option cannot stay in a fixed position.
- If 3 consecutive correct transfer responses occur with <600ms latency, inject one scaffold item with forced full-model replay before continuing.

## Feedback Design
- Success:
  - Strategy-specific praise ("יפה, הקשבת והברת נכון").
  - Visual progress token per mastered shva cluster.
- Mistakes:
  - No punitive feedback.
  - Incorrect choice triggers gentle replay contrast with slowed model.
  - Repeated random taps are handled by the anti-random tapping guardrail below.
- Hint progression:
  1. Replay with segmented syllable timing.
  2. Highlight blend boundary on RTL rail.
  3. Provide one solved example and immediate similar retry.
- Anti-random tapping guardrail:
  - Detect random tapping as 3 incorrect taps within 2 seconds.
  - On trigger: freeze options for 1200ms, replay model audio, then run one non-punitive 2-choice recovery item.
  - Recovery item does not reduce streak/reward state.
  - Max 2 interventions per round to protect flow.

## Session Design
- Session length: 6-8 minutes.
- Structure:
  - Warm-up listening (1-1.5 min).
  - Core choose+blend rounds (3.5-4 min).
  - Transfer word/phrase round (1.5-2 min).
- Natural stopping points:
  - After each shva item cluster.
  - After transfer recap card.
- Replay hooks:
  - Spaced repetition focuses on most-confused shva items.
  - Daily micro-rotation prevents overloading one pattern set.

## Audio Requirements
- All child-facing strings must be i18n keyed with Hebrew audio.
- Required key families:
  - `games.shvaSoundSwitch.title`
  - `games.shvaSoundSwitch.instructions.*`
  - `games.shvaSoundSwitch.prompts.listenChoose.*`
  - `games.shvaSoundSwitch.prompts.blendRail.*`
  - `games.shvaSoundSwitch.prompts.transferRead.*`
  - `games.shvaSoundSwitch.hints.*`
  - `games.shvaSoundSwitch.feedback.success.*`
  - `games.shvaSoundSwitch.feedback.retry.*`
  - `syllables.shva.*`
  - `words.pronunciation.*`
  - `phrases.pointed.*`
- Audio asset pattern:
  - `public/audio/he/games/shva-sound-switch/*.mp3`
  - `public/audio/he/syllables/*.mp3`
  - `public/audio/he/words/*.mp3`
- Audio behavior constraints:
  - Replay/hint audio ducks background by >=6dB.
  - Segmented model clips should remain short (target <=1200ms each).

## Parent Visibility
- Parent dashboard metrics:
  - Accuracy by shva item cluster.
  - Most-confused listen/choose contrasts.
  - Hint usage trend by level.
  - Transfer-read completion for shva words/phrases.
- Suggested parent i18n key families:
  - `parentDashboard.games.shvaSoundSwitch.progressSummary`
  - `parentDashboard.games.shvaSoundSwitch.confusions`
  - `parentDashboard.games.shvaSoundSwitch.nextStep`

## Inspiration / References
- Reading Eggs: explicit sound-pattern contrast before transfer reading.
- Teach Your Monster to Read: repeated blending with varied mechanics.
- Ji Alef-Bet: Hebrew-first nikud sensitivity in early decoding.
- Hebrew reading pedagogy: introduce shva in controlled, audio-supported progression before open-text exposure.

## Review Status
- Reviewed by Gaming Expert on 2026-04-10 ([DUB-414](/DUB/issues/DUB-414)).
- Calibration status: Shva cluster sequencing, distractor distance, adaptive thresholds, anti-random tapping, and anti-guess transfer rules are implementation-ready.
- Rationale: The original draft was educationally aligned but left key progression controls qualitative; numeric thresholds and deterministic intervention triggers make delivery and QA verification consistent.
