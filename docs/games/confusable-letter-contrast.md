# Confusable Letter Contrast (Hebrew: מבדק אותיות דומות)

## Learning Objective
- Curriculum stage: Letter Recognition (confusable-letter discrimination).
- Core reading skill: accurately distinguish visually similar Hebrew print letters and bind each letter to its correct sound in rapid practice.
- Measurable outcome: after 5 sessions, child reaches >=85% first-try accuracy on core confusable pairs and <=1 hint per round in Level 3.
- Milestone mapping (age ~6):
  - Distinguishes look-alike letters without relying on picture cues.
  - Selects correct grapheme from minimal visual contrast sets in RTL flow.

## Curriculum Position
- Placement in reading ladder: after introductory letter familiarity/tracing and before syllable decoding.
- Prerequisites:
  - Child recognizes at least 12 base Hebrew letters in print script.
  - Child can use icon-first controls (`▶`, `↻`, `💡`) independently.
  - Child has completed at least one letter-sound mapping loop (for example `letter-sound-match`).
- What comes next:
  - CV syllable blending with reduced confusion errors.
  - Word decoding tasks with fewer letter-substitution mistakes.

## Target Age Range
- Primary: 5.5-6.5
- Extended support: advanced 5 and emerging 7 with adaptation

## Mechanic
- Primary interaction: tap-to-choose contrast target + drag-to-sort reinforcement.
- Core loop:
  1. דובי plays one target letter sound and highlights a model letter.
  2. Child taps the matching letter among 2-4 visually similar options.
  3. Child drags shown letters into two contrast buckets (target vs confusable).
  4. Child reads one short pointed syllable/word with the target letter.
- Engine fit:
  - One DB row in `games` table (`slug: confusableLetterContrast`, `game_type: contrast_match_sort`).
  - One gameplay component: `ConfusableLetterContrastGame`.
- RTL/mobile requirements:
  - Option order and progression animations follow RTL.
  - Touch targets for all letter cards and controls are >=44px.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays current prompt (`games.confusableLetterContrast.instructions.*`) | Target card pulses again and options re-focus. |
| Retry round | `↻` | Encouragement + same prompt replay | Resets current set without score penalty. |
| Hint | `💡` | Progressive hint (`games.confusableLetterContrast.hints.*`) | Adds visual contrast marker and optional slowed audio. |
| Continue | `→` | Success transition cue | Advances to next contrast pair set. |

## Image Strategy
- Images are allowed only for onboarding mnemonics in the first 2-3 rounds of Level 1.
- Fade plan:
  - Level 1: optional mnemonic icon appears beside model letter only.
  - Level 2: all images removed from choices; letters + audio only.
  - Level 3: fully text/letter driven with pointed syllable/word transfer.
- Guardrail: >=70% of all session actions are letter-only (no picture support).

## Difficulty Curve
- Level 1 (Pair Focus):
  - 2-choice rounds using one confusable pair at a time (for example ב/כ, ד/ר, ו/ז, ן/ו in appropriate context).
  - Target letter remains visually anchored after instruction.
  - Immediate corrective replay after each error.
- Level 2 (Mixed Contrast):
  - 3-4 choices per round, including one high-similarity decoy and one low-similarity decoy.
  - Add drag-sort mini-round after each tap selection.
  - No persistent anchor highlight after first second.
- Level 3 (Transfer to Decoding):
  - Child identifies target letter inside pointed CV/CVC syllables and short words.
  - One short read-aloud transfer item per round.
  - Optional partial nikud fade only after sustained mastery.
- Adaptive logic:
  - 2 consecutive errors on same pair -> temporary return to Level 1 style contrast for that pair.
  - 3 hints in one round -> auto-enable slowed prompt mode.
  - 6 first-try correct actions with <=1 hint -> promote pair to spaced-review queue.

## Feedback Design
- Success:
  - Specific praise tied to discrimination strategy ("שמעת טוב, זו ד ולא ר").
  - Visual reward token for each mastered pair.
- Mistakes:
  - No negative sounds.
  - Mis-tapped card gently returns and model contrast is replayed.
  - Repeated random tapping triggers short modeled example before next action.
- Hint progression:
  1. Repeat sound + target name.
  2. Visual highlight of distinguishing stroke/shape.
  3. Side-by-side animated contrast with one solved example.

## Session Design
- Session length: 10-12 minutes.
- Structure:
  - Warm-up (2 min): one known pair review.
  - Core (6-7 min): 2-3 confusable pairs in mixed rounds.
  - Transfer (2-3 min): pointed syllable/word contrast read.
- Natural stopping points:
  - After each completed confusable pair cluster.
  - After transfer mini-round recap.
- Replay value:
  - Spaced repetition prioritizes pairs with recent confusion.
  - Daily pair rotation avoids over-drill fatigue.

## Audio Requirements
- All child-facing text must be i18n keyed with matching Hebrew audio.
- Required key families:
  - `games.confusableLetterContrast.title`
  - `games.confusableLetterContrast.instructions.*`
  - `games.confusableLetterContrast.prompts.tapMatch.*`
  - `games.confusableLetterContrast.prompts.sortContrast.*`
  - `games.confusableLetterContrast.prompts.transferRead.*`
  - `games.confusableLetterContrast.hints.*`
  - `games.confusableLetterContrast.feedback.success.*`
  - `games.confusableLetterContrast.feedback.retry.*`
  - `letters.names.*`
  - `letters.sounds.*`
  - `syllables.pronunciation.*`
- Audio asset pattern:
  - `public/audio/he/games/confusable-letter-contrast/*.mp3`
  - `public/audio/he/letters/*.mp3`
  - `public/audio/he/syllables/*.mp3`
- Audio behavior constraints:
  - Replay and hint audio duck background by >=6dB.
  - Letter-sound clips should remain short (target <=700ms) for rapid turn-taking.

## Parent Visibility
- Parent dashboard metrics:
  - Accuracy by confusable pair.
  - Most-confused visual contrasts this week.
  - Hint usage trend and improvement over sessions.
  - Transfer-read success for syllable/word rounds.
- Suggested parent i18n key families:
  - `parentDashboard.games.confusableLetterContrast.progressSummary`
  - `parentDashboard.games.confusableLetterContrast.confusions`
  - `parentDashboard.games.confusableLetterContrast.nextStep`

## Inspiration / References
- Reading Eggs: systematic discrimination progression from isolated grapheme to decoding transfer.
- Khan Academy Kids ELA: mastery-gated letter/sound review with high repetition variety.
- Ji Alef-Bet: Hebrew-specific letter recognition and nikud-sensitive progression.
- Science of reading alignment: explicit confusable-letter contrast improves orthographic mapping and decoding accuracy.

## Review Request
- Request Gaming Expert review for contrast-pair ordering, decoy density, and adaptive thresholds before implementation starts.
