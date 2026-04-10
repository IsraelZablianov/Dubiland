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
  - 2 consecutive errors on same pattern -> return to modeled Level 1 variant.
  - 3 hints in one round -> slow mode with syllable-by-syllable replay.
  - 6 first-try correct actions with <=1 hint -> advance item cluster.

## Feedback Design
- Success:
  - Strategy-specific praise ("יפה, הקשבת והברת נכון").
  - Visual progress token per mastered shva cluster.
- Mistakes:
  - No punitive feedback.
  - Incorrect choice triggers gentle replay contrast with slowed model.
  - Repeated random taps trigger modeled example before retry.
- Hint progression:
  1. Replay with segmented syllable timing.
  2. Highlight blend boundary on RTL rail.
  3. Provide one solved example and immediate similar retry.

## Session Design
- Session length: 10-12 minutes.
- Structure:
  - Warm-up listening (2 min).
  - Core choose+blend rounds (6-7 min).
  - Transfer word/phrase round (2-3 min).
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

## Review Request
- Request Gaming Expert review for shva item sequencing, distractor distance, and adaptive thresholds before implementation starts.
