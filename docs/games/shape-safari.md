# Shape Safari (Hebrew: ספארי צורות)

## Learning Objective
- Curriculum area: Shapes (צורות)
- Core skill: Visual shape recognition, categorization, and early spatial reasoning (circle, square, triangle, rectangle, star).
- Measurable outcome: After 4 sessions, child correctly classifies target shapes in at least 80% of Level 2 rounds with no more than one hint.
- Milestone mapping:
  - Ages 3-4: recognize and match basic 2D shapes.
  - Ages 5-6: classify shapes with distractors and combine shape clues in multi-step rounds.

## Target Age Range
- Primary: 3-6

## Mechanic
- Primary interaction: Tap-select with auto-snap on Level 1; drag-and-drop starts in Level 2 with tap fallback always available.
- Round loop:
  1. דובי introduces one target shape with a short audio prompt and single focal visual pulse.
  2. Child chooses one candidate shape (tap on easy, drag or tap on medium/hard).
  3. System gives immediate micro-feedback (success animation or gentle retry cue).
  4. If incorrect, hint support escalates in fixed cadence before any new content is introduced.
  5. In advanced rounds, child selects the missing shape in a composed scene.
- Engine fit:
  - One DB row in `games` table (slug: `shapeSafari`, `game_type: drag_drop`).
  - One component: `ShapeSafariGame`.
- Mobile/RTL requirements:
  - Touch targets 44px+.
  - Sort bins and prompts arranged for RTL scanning.
  - Avoid bottom-edge critical controls to reduce accidental tablet touches.

## Pre-Literate UX Baseline (Mandatory)
- Every instruction text shown to the child must include an adjacent `▶` play icon (minimum 44px) that replays the exact instruction audio.
- Child-facing controls are icon-first, not text-first. Use persistent icons for replay (`▶`), retry (`↻`), hint (`💡`), and next (`→`).
- Text labels may appear only as supporting parent/teacher UI; gameplay controls for children must remain understandable via icon + audio alone.
- Feedback and validation are action-based: the game responds immediately to taps, drags, traces, or spoken input and never requires a separate `check` or `test` button.
- Icon taps trigger short narrated cues from i18n/audio keys so pre-readers can learn each icon meaning by sound.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays active `games.shapeSafari.instructions.*` clip | Prompt pulse + target-shape outline glow. |
| Retry round | `↻` | Plays `feedback.encouragement.*`, then current prompt replay | Soft reset to same shape objective. |
| Hint | `💡` | Plays scaffold cue from `games.shapeSafari.hints.*` | Shows edge/corner cue and valid-target emphasis. |
| Next / continue | `→` | Plays short success cue from `feedback.success.*` | Moves to next adaptive round transition. |

## Difficulty Curve
- Target shape release order:
  - Easy: circle, square, triangle.
  - Medium: add rectangle.
  - Hard: add star.
- Level 1 (Easy, ages 3-4):
  - 2-3 options, one target at a time.
  - No color/size distractors.
  - Tap-select default with auto-snap to reduce motor load.
  - Full audio naming on every attempt.
- Level 2 (Medium, ages 4-5):
  - 3-4 options, mini-sort of 2 objects per round.
  - Introduce one new variable at a time (size variation OR color distractor, never both in same round).
  - Drag-and-drop active, but tap fallback remains.
- Level 3 (Hard, ages 5-6):
  - 4-5 options with square vs rectangle contrast rounds.
  - Missing-shape scene appears only after stable success at Level 2.
  - Visual scaffolds reduced gradually; replay always available.
- Adaptive rules:
  - 2 errors in a row -> remove the newest variable, reduce options by one, and re-enable outline glow.
  - 3 successful rounds -> advance one step (never introduce two new variables in one jump).
  - 3 errors on same pair (example: square vs rectangle) -> inject focused contrast round before resuming progression.

## Hint Cadence and Failure Recovery
- First incorrect attempt:
  - Repeat target prompt and pulse the target shape outline.
- Second consecutive incorrect attempt:
  - Add explicit edge/corner hint and temporarily reduce distractors.
- Third consecutive incorrect attempt:
  - דובי demonstrates the correct move once, then child retries immediately on a similar item.
- Inactivity recovery:
  - If no interaction for 7 seconds, replay instruction and highlight one valid candidate.

## Feedback Design
- Success path:
  - Positive safari animation + rotating praise line.
  - Shape name replay to reinforce vocabulary.
  - Sticker piece reward every 3 completed rounds (no penalty for mistakes between rewards).
- Mistake path:
  - No negative buzzer or red X.
  - Gentle retry cue focused on what to observe next (edges/corners).
  - Retry with clearer outlines and reduced distractors.
- Encouragement pattern:
  - Praise observation ("you looked carefully") before correction.

## Session Design
- Expected play time: 3-5 minutes.
- Session shape: 6 adaptive rounds (plus optional bonus round for ages 5-6).
- Natural stopping points:
  - Pause option after round 3.
  - End recap highlighting strongest recognized shapes.
- Replay value:
  - Visual themes rotate (jungle, sea, city) while objective remains shape classification.

## Audio Requirements
- All text must use i18n keys and paired Hebrew audio.
- Required key families:
  - `games.shapeSafari.title`
  - `games.shapeSafari.subtitle`
  - `games.shapeSafari.instructions.*`
  - `games.shapeSafari.prompts.match.*`
  - `games.shapeSafari.prompts.sort.*`
  - `games.shapeSafari.prompts.inactivity.*`
  - `games.shapeSafari.hints.*`
  - `games.shapeSafari.hints.corners.*`
  - `games.shapeSafari.hints.edges.*`
  - `games.shapeSafari.recovery.demo.*`
  - `games.shapeSafari.rewards.*`
  - `shapes.names.*`
  - `feedback.encouragement.*`
  - `feedback.success.*`
- Audio file pattern:
  - `public/audio/he/games/shape-safari/*.mp3`
  - `public/audio/he/shapes/*.mp3`
- Accessibility:
  - Replay prompt control always visible (44px+).
  - Shape-name tap replay available on each shape card.

## Parent Visibility
- Parent dashboard metrics:
  - Accuracy by shape category.
  - Most-confused shape pairs.
  - Hint reliance trend.
- Parent summary keys:
  - `parentDashboard.games.shapeSafari.progressSummary`
  - `parentDashboard.games.shapeSafari.nextStep`

## Inspiration / References
- Montessori Preschool: classification via concrete visual cues.
- Khan Academy Kids: adaptive scaffold fade with supportive retry loops.
- TinyTap: accessible drag-sort mechanics for preschool learners.

## Review Status
- Mechanics validated by Gaming Expert on 2026-04-10; ready for FED implementation and Content Writer audio/copy production.
