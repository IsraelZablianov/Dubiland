# Measure and Match (Hebrew: מודדים ומתאימים)

## Learning Objective
- Curriculum area: Math measurement foundations (מדידה בסיסית)
- Core skill: compare and classify objects by length, weight, and volume using concrete representations before symbols.
- Measurable outcome: After 4 sessions, child correctly solves at least 80% of comparison rounds (`longer/shorter`, `heavier/lighter`, `fuller/emptier`) with no more than one hint per round.
- Milestone mapping:
  - Ages 6-7: apply measurement language and comparison logic in familiar daily-life objects.
  - Stretch target: transition from perceptual guess to tool-assisted reasoning.

## Target Age Range
- Primary: 6-7
- Secondary support: advanced 5.8+

## Mechanic
- Primary interaction: Drag objects onto comparison stations (ruler track, balance scale, fill cups), with tap fallback.
- Round loop:
  1. Audio-first instruction presents one comparison goal (for example: "מה ארוך יותר?" / "מה כבד יותר?").
  2. Child drags candidate objects into the station.
  3. Station animates immediate outcome (scale tilt, ruler overlay, fill line).
  4. Validation triggers from placement action; no separate check button.
- Engine fit:
  - One DB row in `games` table (slug: `measureAndMatch`, `game_type: drag_drop`).
  - One component: `MeasureAndMatchGame`.
- Mobile/RTL requirements:
  - HUD, prompts, and controls are RTL.
  - Measurement visuals preserve conventional direction where needed (ruler increments left-to-right).
  - Touch targets remain 44px+.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Difficulty Curve
- Level 1 (Single-Attribute Compare):
  - Comparisons with visually obvious differences.
  - Domains rotate one at a time: length, then weight, then volume.
  - Choices: 2 objects.
- Level 2 (Near-Difference Compare):
  - Smaller visual differences and mild distractors.
  - Child uses station feedback (not only visual guess).
  - Choices: 3 objects or 2-step compare (choose then place).
- Level 3 (Apply in Routine Context):
  - Mixed comparison prompts inside mini scenarios (pack lunch box, choose right cup, sort market items).
  - One rule change per block (for example: switch from "heaviest" to "lightest").
  - Choices: 3-4 with controlled distractor similarity.
- Adaptive rules:
  - 2 consecutive misses -> reduce to 2 choices and replay comparison word with demonstration.
  - 3 consecutive first-attempt successes -> increase one variable only (similarity OR context complexity).
  - Promotion gate L1->L2: first-attempt success `>=75%` over last 8 rounds.
  - Promotion gate L2->L3: first-attempt success `>=80%` over last 10 rounds and hint usage `<=30%`.

## Feedback Design
- Success feedback:
  - Station animation confirms correct comparison (balanced/tilted/fill-level).
  - דובי praise line reinforces vocabulary ("נכון, זה ארוך יותר!").
- Mistake handling:
  - No punitive marks or harsh sounds.
  - Gentle cue + one focused hint on the relevant attribute.
  - Immediate retry with reduced distractor distance.
- Encouragement pattern:
  - Celebrate reasoning process ("בדקת יפה") before answer confirmation.

## Session Design
- Expected play time: 6-8 minutes.
- Session shape: 8-10 rounds in two micro-blocks.
- Natural stopping points:
  - Optional break card after first block.
  - End recap showing strongest comparison category and next focus.
- Replay value:
  - Rotating contexts (kitchen, playground, market) while preserving same measurement objectives.

## Audio Requirements
- All user-facing strings must be i18n-keyed with paired Hebrew narration.
- Required key families:
  - `games.measureAndMatch.title`
  - `games.measureAndMatch.subtitle`
  - `games.measureAndMatch.instructions.*`
  - `games.measureAndMatch.prompts.length.*`
  - `games.measureAndMatch.prompts.weight.*`
  - `games.measureAndMatch.prompts.volume.*`
  - `games.measureAndMatch.hints.*`
  - `games.measureAndMatch.recovery.*`
  - `feedback.success.*`
  - `feedback.encouragement.*`
- Audio file pattern:
  - `public/audio/he/games/measure-and-match/*.mp3`
- Accessibility:
  - Replay/hint controls always visible and announced.

## Parent Visibility
- Parent dashboard metrics:
  - Accuracy by measurement domain (length/weight/volume).
  - Confusion tags (`perceptual-guess`, `term-mixup`, `tool-ignore`).
  - Hint reliance trend across levels.
- Parent summary keys:
  - `parentDashboard.games.measureAndMatch.progressSummary`
  - `parentDashboard.games.measureAndMatch.nextStep`

## Inspiration / References
- Khan Academy Kids: manipulative-first math reasoning progression.
- TinyTap: direct-touch compare-and-sort loops.
- Montessori Preschool: self-correcting material interaction and calm repetition.

## Review Status
- Mechanics review requested from Gaming Expert (pending).
