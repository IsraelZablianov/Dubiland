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
  - Use the calibrated promotion/regression/slow-mode thresholds below as the single source of truth.
  - Struggle handling is family-local (fallback only for the current final-form family).
  - Mastered families move to spaced review; do not remove all review exposure in-session.

### Final-Form Family Sequence And Distractor Policy (Calibrated)
- Family order for first ship:
  1. `מ/ם` (large visual closure contrast, easiest onboarding).
  2. `נ/ן` (vertical extension contrast with clear end-slot behavior).
  3. `פ/ף` (descender contrast after rule is established).
  4. `כ/ך` (tail extension with more confusable body shape).
  5. `צ/ץ` (most visually complex, hold for late blocks).
- Distractor policy by level:
  - Level 1: exactly 2 options (`base` vs `final`) for one family; no unrelated letters.
  - Level 2 early: 3 options (`target final`, `base counterpart`, `far decoy final` from mastered family).
  - Level 2 late: 4 options (`target final`, `base counterpart`, `near decoy final`, `no-sofit decoy`).
  - Level 3 transfer: cap to 3 options per phrase item and include a "no sofit needed" case in 40-50% of items.
- Isolation rule: only one new challenge variable per block (new family, more options, or highlight fade).

### Adaptive Thresholds (Calibrated)
- Promotion gate (L1 -> L2):
  - First-try accuracy `>=80%` across last 10 completion attempts for the active family, and
  - Hint usage `<=2` across those attempts.
- Promotion gate (L2 -> L3):
  - First-try accuracy `>=85%` across last 12 mixed attempts, and
  - Sort accuracy `>=80%`, and
  - No more than 1 random-tap intervention in that window.
- Regression gate (any level):
  - First-try accuracy `<60%` across 8 attempts, or
  - 3 consecutive errors on one family, or
  - 3 level-3 hints in one block.
  - If triggered, step down one level for next 4 attempts, then re-evaluate.
- Slow mode behavior:
  - Trigger: 2 hints in one block or 2 consecutive errors.
  - Effect: segmented word audio at `0.85x`, end-slot pulse +400ms, choice count reduced by 1 for next 2 attempts.
  - Exit: 2 first-try correct responses in slow mode.

### Transfer Anti-Guessing Rules (Calibrated)
- In Level 3, at least 50% of items must require decoding the full pointed word/phrase before ending selection (not just end-slot spotting).
- Include one minimal-pair contrast every 4 items where only final/base ending changes the correct answer.
- Ensure option position is shuffled each trial; correct final form cannot stay in a fixed edge position.
- If child answers correctly but with <600ms response time on 3 consecutive transfer trials, inject one "explain by audio cue" scaffold trial before continuing.

## Feedback Design
- Success:
  - Specific praise linked to rule use ("מצוין, זו צ סופית בסוף המילה").
  - Badge token for each mastered final-form family.
- Mistakes:
  - No negative buzzer or failure screens.
  - Wrong choice slides back; correct position re-emphasized with brief narration.
  - Repeated rapid random taps are handled by the anti-random tapping guardrail below.
- Hint progression:
  1. Audio reminder: final form comes at the end of the word.
  2. Visual end-slot highlight + base/final pair contrast.
  3. One solved word with immediate retry on similar word.
- Anti-random tapping guardrail:
  - Detect random tapping as 3 incorrect taps within 2 seconds.
  - On trigger: freeze choices for 1200ms, replay instruction, and run one non-punitive 2-choice recovery trial.
  - Recovery trial keeps reward/streak state unchanged.
  - Max 2 interventions per round to avoid flow break.

## Session Design
- Session length: 6-8 minutes.
- Structure:
  - Warm-up (1-1.5 min): one known final-form family.
  - Core (3.5-4 min): ending completion + sorting across 2 families.
  - Transfer (1.5-2 min): pointed phrase reading with completed words.
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

## Review Status
- Reviewed by Gaming Expert on 2026-04-10 ([DUB-411](/DUB/issues/DUB-411)).
- Calibration status: Family sequencing, distractor density, anti-guessing transfer rules, and adaptive thresholds are implementation-ready.
- Rationale: The base draft was pedagogically sound but left progression and anti-guess controls under-specified; numeric gates and deterministic safeguards now make FED/QA behavior testable.
