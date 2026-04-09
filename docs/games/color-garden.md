# Color Garden (Hebrew: גינת הצבעים)

## Learning Objective
- Curriculum area: Colors (צבעים)
- Core skill: Color recognition, color-word association, and sorting by color category.
- Measurable outcome: After 4 sessions, child correctly sorts and identifies target colors in at least 85% of Level 2 rounds with no more than one hint.
- Milestone mapping:
  - Ages 3-4: identify core colors (red, blue, yellow, green).
  - Ages 5-6: handle expanded color set and shade-level discrimination.

## Target Age Range
- Primary: 3-6

## Mechanic
- Primary interaction: Tap-to-select and drag-to-sort.
- Round loop:
  1. דובי announces a single target with audio + one large swatch.
  2. Child taps matching object(s) or drags one object type into a basket.
  3. System gives immediate feedback per attempt (success or gentle retry cue).
  4. Round ends with micro-celebration + next prompt.
- Finalized color progression:
  - Core set (start): red, blue, yellow, green.
  - Expansion set (after mastery): orange, purple.
  - Rule/challenge set (late): white, black, brown, pink (one new color at a time).
- Engine fit:
  - One DB row in `games` table (slug: `colorGarden`, `game_type: match`).
  - One component: `ColorGardenGame`.
- Mobile/RTL requirements:
  - 44px+ targets for swatches, objects, and baskets.
  - Prompt and controls right-aligned for RTL.

## Pre-Literate UX Baseline (Mandatory)
- Every instruction text shown to the child must include an adjacent `▶` play icon (minimum 44px) that replays the exact instruction audio.
- Child-facing controls are icon-first, not text-first. Use persistent icons for replay (`▶`), retry (`↻`), hint (`💡`), and next (`→`).
- Text labels may appear only as supporting parent/teacher UI; gameplay controls for children must remain understandable via icon + audio alone.
- Feedback and validation are action-based: the game responds immediately to taps, drags, traces, or spoken input and never requires a separate `check` or `test` button.
- Icon taps trigger short narrated cues from i18n/audio keys so pre-readers can learn each icon meaning by sound.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays active `games.colorGarden.instructions.*` clip | Prompt pulse + target color swatch emphasis. |
| Retry round | `↻` | Plays `feedback.encouragement.*`, then current prompt replay | Soft reset to same color objective. |
| Hint | `💡` | Plays next hint from `games.colorGarden.hints.*` | Highlights target swatch/object path. |
| Next / continue | `→` | Plays short cue from `feedback.success.*` | Transitions to next color challenge. |

## Difficulty Curve
- Level 1 (Easy, ages 3-4: Color Find):
  - 2 -> 3 choices on screen (tap only).
  - Core colors only (red, blue, yellow, green).
  - One-step prompt only: "tap the blue flower."
  - No shade distractors.
- Level 2 (Medium, ages 4-5: Color Sort):
  - 3 -> 4 baskets (drag with tap fallback).
  - Core colors + at most 1 new color introduced per round block.
  - Sorting by color only (no object rule yet).
  - Keep high-contrast assets; do not introduce shade pairs in this level.
- Level 3 (Hard, ages 5-6: Color Rules):
  - Rule prompts add one new variable at a time:
    1. Color + object (for example, "put blue fruits in the basket")
    2. Two-rule prompt only after stable success trend.
  - Shade discrimination appears only in final rounds and only for one pair at a time.
  - Instruction replay always available.
- Adaptive rules:
  - 2 misses in one round -> simplify one variable only (fewer options OR remove a distractor OR switch drag to tap fallback).
  - 3 successful rounds -> increase one variable only (add one color OR add one basket OR add one rule).
  - Repeated confusion on a color/shade pair triggers a short contrast round before progression resumes.

## Feedback Design
- Success path:
  - Correct item: instant bloom + spoken color-name reinforcement.
  - Round complete: garden growth animation + short praise phrase.
  - Session complete: sticker reveal (one sticker theme per session).
- Mistake path:
  - No red X, no buzzer.
  - Gentle narration ("let's compare colors together").
  - Hint cadence:
    1. First miss: replay prompt.
    2. Second miss: pulse target swatch + subtle outline hint.
    3. Third miss: guided demo (auto-place first correct item), then retry.
- Encouragement pattern:
  - Celebrate effort and attention, not speed.

## Session Design
- Expected play time: 2-5 minutes.
- Session shape: 5-7 adaptive rounds (short, high-frequency loops).
- Natural stopping points:
  - Optional break after round 3.
  - End recap with "colors mastered today" card.
- Replay value:
  - Seasonal garden themes and rotating object sets keep repetition fresh.

## Edge Cases and Failure Recovery
- Random tapping streak (common at age 3):
  - Detect 4 rapid wrong taps -> temporarily reduce choices to 2 and slow instruction pace.
- Drag motor friction:
  - If two failed drags in a row, show tap-to-send fallback for that round.
- Theme color ambiguity:
  - If themed assets reduce color clarity, overlay canonical swatch badge on each item.
- Audio overlap:
  - Latest instruction interrupts queued praise audio to preserve prompt clarity.
- Confidence drop after repeated errors:
  - Force one guaranteed-success micro-round before returning to previous difficulty.

## Audio Requirements
- All strings must be i18n-keyed with Hebrew narration.
- Required key families:
  - `games.colorGarden.title`
  - `games.colorGarden.subtitle`
  - `games.colorGarden.instructions.*`
  - `games.colorGarden.prompts.match.*`
  - `games.colorGarden.prompts.sort.*`
  - `games.colorGarden.hints.*`
  - `games.colorGarden.rules.*`
  - `games.colorGarden.recovery.*`
  - `colors.names.*`
  - `feedback.encouragement.*`
  - `feedback.success.*`
- Audio file pattern:
  - `public/audio/he/games/color-garden/*.mp3`
  - `public/audio/he/colors/*.mp3`
- Accessibility:
  - Replay instruction and color-name controls always visible (44px+).
  - Tapping a swatch replays color pronunciation.

## Parent Visibility
- Parent dashboard metrics:
  - Accuracy by color family.
  - Shade confusion frequency.
  - Hint reliance trend over sessions.
- Parent summary keys:
  - `parentDashboard.games.colorGarden.progressSummary`
  - `parentDashboard.games.colorGarden.nextStep`

## Inspiration / References
- Endless Alphabet: vivid sensory reinforcement and playful audio.
- Lingokids: themed variety with stable learning objective.
- Montessori Preschool: calm, no-failure correction loops.

## Review Status
- Mechanics review finalized by Gaming Expert on 2026-04-10; ready for implementation handoff.
