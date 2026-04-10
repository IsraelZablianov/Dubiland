# Counting Picnic (Hebrew: פיקניק ספירה עם דובי)

## Learning Objective
- Curriculum area: Numbers (מספרים)
- Core skill: One-to-one counting and numeral-to-quantity mapping for 1-10.
- Measurable outcome: After 3 sessions, child correctly completes at least 8/10 rounds in the 1-10 range with no more than 1 hint per round.
- Milestone mapping:
  - Ages 3-4: count visible sets up to 5 with auditory support.
  - Ages 4-5 extension: count mixed sets up to 10 and match spoken number prompts.

## Target Age Range
- Primary: 3-4
- Secondary stretch: early 5

## Mechanic
- Primary interaction: Drag-and-drop objects into דובי's picnic basket.
- Round loop:
  1. Audio prompt asks for a quantity (for example, "Put 4 apples in the basket" via i18n key + narration).
  2. Child drags items from a right-side source tray (RTL-first layout) into a center basket.
  3. Each drop snaps with visual count feedback (dots + spoken count).
  4. Game auto-validates on each drop and resolves the round immediately when the target count is reached.
- Engine fit:
  - One DB row in `games` table (slug: `countingPicnic`, `game_type: drag_drop`).
  - One component: `CountingPicnicGame`.
- Mobile/RTL requirements:
  - Minimum touch targets: 44px.
  - Source tray starts on the right side; progress and helper UI are right-aligned.

## Pre-Literate UX Baseline (Mandatory)
- Every instruction text shown to the child must include an adjacent `▶` play icon (minimum 44px) that replays the exact instruction audio.
- Child-facing controls are icon-first, not text-first. Use persistent icons for replay (`▶`), retry (`↻`), hint (`💡`), and next (`→`).
- Text labels may appear only as supporting parent/teacher UI; gameplay controls for children must remain understandable via icon + audio alone.
- Feedback and validation are action-based: the game responds immediately to taps, drags, traces, or spoken input and never requires a separate `check` or `test` button.
- Icon taps trigger short narrated cues from i18n/audio keys so pre-readers can learn each icon meaning by sound.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays active `games.countingPicnic.instructions.*` clip | Prompt pulse + current target highlight. |
| Retry round | `↻` | Plays `feedback.encouragement.*`, then replays current prompt | Soft round reset with same target quantity. |
| Hint | `💡` | Plays next scaffold cue from `games.countingPicnic.hints.*` | Highlights the next valid object/count step. |
| Next / continue | `→` | Plays `games.countingPicnic.roundComplete.*` cue | Transitions into the next round after micro-celebration. |

## Difficulty Curve
- Level 1 (Starter): targets 1-3, single object type, no distractors, full audio counting on every drop.
- Level 2 (Core): targets 1-5, 2 object types, mild distractors, count audio only on first 3 drops unless child taps replay.
- Level 3 (Stretch): targets 1-10, mixed objects + distractors, occasional "same number but different object" rounds.
- Adaptive rules:
  - 2 consecutive struggle rounds -> temporary fallback to previous range with clearer visual placeholders.
  - 3 clean rounds in a row -> move to next level.
  - Hint system escalates from gentle nudge -> highlighted next item -> auto-count scaffold.
  - Promotion gate (L1 -> L2): first-attempt success `>=75%` over the last 8 rounds and hint usage `<=35%`.
  - Promotion gate (L2 -> L3): first-attempt success `>=80%` over the last 8 rounds and hint usage `<=25%`.
  - Regression gate: if first-attempt success drops below `60%` for 2 consecutive sessions, step back one level for the next session.

## Feedback Design
- Success path:
  - Immediate celebration animation on basket.
  - Positive audio from `feedback.*` keys (rotation to avoid repetition).
  - Star token appears every 2 successful rounds (no loss state).
- Mistake path:
  - No red X, no buzzer.
  - Gentle message + audio prompt to retry.
  - If over-counted: extra item wiggles and returns softly to tray with encouraging narration.
- Encouragement pattern:
  - Effort praise first, correction second.
  - "Try again" phrasing uses i18n + paired audio only.

## Session Design
- Expected play time: 5-7 minutes.
- Session shape: 8 rounds total (2-3 rounds per level depending on adaptation).
- Natural stopping points:
  - Midpoint pause after round 4 with optional "finish later" card.
  - End-of-session celebration with "next recommended game" card.
- Replay value:
  - Object packs rotate (fruits, toys, beach items) while preserving the same counting objective.

## Audio Requirements
- All user-facing text must be i18n-keyed and have paired Hebrew audio.
- Required key families:
  - `games.countingPicnic.title`
  - `games.countingPicnic.subtitle`
  - `games.countingPicnic.instructions.*`
  - `games.countingPicnic.hints.*`
  - `games.countingPicnic.roundComplete.*`
  - `games.countingPicnic.numbers.1` through `games.countingPicnic.numbers.10`
  - `feedback.encouragement.*`
  - `feedback.success.*`
- Audio file pattern:
  - `public/audio/he/games/counting-picnic/*.mp3`
  - Manifest entries must map each i18n key to an audio path.
- Accessibility:
  - Replay instruction button always visible and 44px+.
  - Number pronunciations replay on tap for each numeral chip.

## Parent Visibility
- Parent dashboard metrics:
  - Highest stable counting range (for example, 1-5 or 1-10).
  - First-attempt success rate by level.
  - Hint reliance trend (decreasing = readiness to progress).
- Parent-facing summary text should be i18n key-based:
  - `parentDashboard.games.countingPicnic.progressSummary`
  - `parentDashboard.games.countingPicnic.nextStep`

## Inspiration / References
- Khan Academy Kids: mastery progression and gentle scaffolds.
- Montessori Preschool: no-failure discovery loop and calm correction.
- Endless Alphabet: playful feedback and high-quality sound association.

## Review Status
- Reviewed by Gaming Expert on 2026-04-10 (DUB-582).
- Calibration status: Thresholds calibrated and implementation-ready for first pass.
- Rationale: Core loop already fits ages 3-4, but progression required explicit numeric promotion/regression gates to keep adaptation consistent across FED and QA.
