# Sofit Word-End Detective (Hebrew: בלש סופיות)

## Learning Objective
- Curriculum stage: Letter Recognition -> Word Reading transfer.
- Core reading skill: identify and decode Hebrew final-form letters (ך, ם, ן, ף, ץ) in correct word-final position.
- Measurable outcome: after 5 sessions, child reaches >=85% correct final-form selection in Level 2 and reads Level 3 pointed words with final forms at >=80% first-try accuracy.
- Milestone mapping (age ~6):
  - Understands that final forms are context-dependent variants, not new unrelated letters.
  - Applies final-form recognition while decoding pointed words.

## Curriculum Position
- Placement in reading ladder: after base letter-sound familiarity and early word decoding, before broader phrase/stories fluency.
- Prerequisites:
  - Child can decode short pointed CV/CVC words.
  - Child recognizes base forms for כ/מ/נ/פ/צ.
  - Child can use icon-first controls (`▶`, `↻`, `💡`) independently.
- What comes next:
  - Phrase reading with mixed medial/final form distribution.
  - Decodable stories with consistent final-form exposure.

## Target Age Range
- Primary: 5.8-6.8
- Supported with scaffolding: advanced 5.5+

## Mechanic
- Primary interaction: tap-to-complete word endings + drag-sort by final position.
- Core loop:
  1. דובי plays a pointed target word missing its final letter.
  2. Child taps the correct ending from base-vs-final choices.
  3. Child drags completed words into two lanes: "ends with sofit" vs "no sofit".
  4. Child reads one short pointed phrase containing the completed word.
- Engine fit:
  - One DB row in `games` table (`slug: sofitWordEndDetective`, `game_type: ending_fill_sort_read`).
  - One gameplay component: `SofitWordEndDetectiveGame`.
- RTL/mobile requirements:
  - Word completion flow is RTL-first with final-letter drop target at visual word end.
  - All interactive controls are >=44px touch targets.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays active instruction (`games.sofitWordEndDetective.instructions.*`) | Missing-letter slot pulses and target word replays. |
| Retry round | `↻` | Encouragement + round prompt replay | Resets current word set without penalty. |
| Hint | `💡` | Progressive hint (`games.sofitWordEndDetective.hints.*`) | Highlights final position and compares base/final form visually. |
| Continue | `→` | Success transition cue | Moves to next word-ending set. |

## Image Strategy
- Images used only for meaning support in first onboarding words.
- Fade plan:
  - Level 1: optional picture appears beside full model word.
  - Level 2: picture removed for ending selection rounds.
  - Level 3: phrase transfer is text-first with no images.
- Guardrail: >=70% of interactions per session are text-only.

## Difficulty Curve
- Level 1 (Sofit Discovery):
  - 2-choice word-ending completion with explicit model (base vs final form pair).
  - Fully pointed words with clear final-position highlight.
- Level 2 (Mixed Endings):
  - 3-4 choices including plausible base-form distractor.
  - Add drag-sort by "has sofit" vs "no sofit" after completion.
  - Reduce visual highlighting after first second.
- Level 3 (Transfer to Phrase Reading):
  - Child completes and reads pointed words inside 2-4 word phrases.
  - Mix words with/without sofit to enforce position rule.
  - Optional partial nikud fade only after stable mastery.
- Adaptive logic:
  - 2 repeated errors on same final form -> temporary side-by-side model and replay.
  - 3 hints in one round -> slow mode with segmented word audio.
  - 6 first-try correct actions with <=1 hint -> move pair to spaced review.

## Feedback Design
- Success:
  - Specific praise linked to rule use ("מצוין, זו צ סופית בסוף המילה").
  - Badge token for each mastered final-form family.
- Mistakes:
  - No negative buzzer or failure screens.
  - Wrong choice slides back; correct position re-emphasized with brief narration.
  - Repeated rapid random taps trigger one modeled example before retry.
- Hint progression:
  1. Audio reminder: final form comes at the end of the word.
  2. Visual end-slot highlight + base/final pair contrast.
  3. One solved word with immediate retry on similar word.

## Session Design
- Session length: 10-12 minutes.
- Structure:
  - Warm-up (2 min): one known final-form family.
  - Core (6-7 min): ending completion + sorting across 2-3 families.
  - Transfer (2-3 min): pointed phrase reading with completed words.
- Natural stopping points:
  - After each final-form family cluster.
  - After transfer phrase recap card.
- Replay hooks:
  - Spaced repetition prioritizes most-confused final-form families.
  - Daily mix rotates between ך/ם/ן/ף/ץ with controlled load.

## Audio Requirements
- All child-facing strings must be i18n-keyed with Hebrew audio.
- Required key families:
  - `games.sofitWordEndDetective.title`
  - `games.sofitWordEndDetective.instructions.*`
  - `games.sofitWordEndDetective.prompts.completeEnding.*`
  - `games.sofitWordEndDetective.prompts.sorting.*`
  - `games.sofitWordEndDetective.prompts.transferRead.*`
  - `games.sofitWordEndDetective.hints.*`
  - `games.sofitWordEndDetective.feedback.success.*`
  - `games.sofitWordEndDetective.feedback.retry.*`
  - `letters.baseAndFinal.*`
  - `words.pronunciation.*`
  - `phrases.pointed.*`
- Audio asset pattern:
  - `public/audio/he/games/sofit-word-end-detective/*.mp3`
  - `public/audio/he/letters/*.mp3`
  - `public/audio/he/words/*.mp3`
- Audio behavior constraints:
  - Replay/hint audio ducks background by >=6dB.
  - Word clips should remain short (target <=900ms) for fast turns.

## Parent Visibility
- Parent dashboard metrics:
  - Accuracy by final-form family (ך/ם/ן/ף/ץ).
  - Most-confused base-vs-final contrasts.
  - Hint usage trend by level.
  - Phrase transfer success with final forms.
- Suggested parent i18n key families:
  - `parentDashboard.games.sofitWordEndDetective.progressSummary`
  - `parentDashboard.games.sofitWordEndDetective.confusions`
  - `parentDashboard.games.sofitWordEndDetective.nextStep`

## Inspiration / References
- Reading Eggs: explicit grapheme contrast before connected-text transfer.
- Khan Academy Kids ELA: mastery-gated letter pattern review.
- Ji Alef-Bet: Hebrew-specific orthography emphasis.
- Hebrew reading progression practice: final forms taught as positional allographs with repeated decoding exposure.

## Review Request
- Request Gaming Expert review for final-form family order, distractor design, and adaptive thresholds before implementation starts.
