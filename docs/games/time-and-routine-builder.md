# Time-and-Routine Builder (Hebrew: בונים סדר יום ושעון)

## Learning Objective
- Curriculum area: Cross-curriculum (Math + Daily routines)
- Core skill: Sequence events logically and connect routines to clock-time anchors (hour and half-hour).
- Measurable outcome: After 4 sessions, child correctly orders routine cards and matches them to hour/half-hour clock targets with at least 80% accuracy in Level 2+ rounds.
- Milestone mapping:
  - Ages 6-7: understand before/after order, morning-noon-evening grouping, and basic analog clock anchors.
  - Ages 7 stretch: apply simple elapsed-time reasoning with guided support.

## Target Age Range
- Primary: 6-7

## Mechanic
- Primary interaction: Drag routine cards onto a timeline and tap/drag clock hands to matching anchors.
- Round loop:
  1. Audio prompt states a routine goal (for example: "שימו את ארוחת הבוקר לפני היציאה לגן").
  2. Child drags routine cards into timeline slots (RTL timeline scaffold).
  3. In clock rounds, child sets/selects hour or half-hour on a teaching clock.
  4. System validates instantly after each placement/clock action.
- Engine fit:
  - One DB row in `games` table (slug: `timeAndRoutineBuilder`, `game_type: sequence`).
  - One component: `TimeAndRoutineBuilderGame`.
- Mobile/RTL requirements:
  - Timeline cards and prompts flow RTL.
  - Clock face keeps standard clockwise behavior; pointer motion guidance is narrated.
  - All interactive cards/buttons are 44px+.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` replay icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), next (`→`).
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; no separate `check`/`test` button.

## Difficulty Curve
- Level 1 (Routine Order Foundations):
  - 3-card sequences (morning routine, bedtime routine).
  - No clock matching yet; focus on before/after logic.
  - Strong visual scaffolds and narrated transitions.
- Level 2 (Routine + Clock Anchors):
  - 4-card sequences paired with hour/half-hour anchors (`07:00`, `07:30`, `20:00`, etc.).
  - Child matches each routine event to one of 2-3 time options.
  - One variable increase at a time (sequence length OR time-choice load).
- Level 3 (Planning and Reasoning):
  - 5-card mixed routines with a missing event/time slot.
  - Introduce simple elapsed relation prompts ("אם יצאנו בחצי, מתי מתחיל החוג?") with guided choices.
  - Visual scaffolds fade gradually.
- Adaptive rules:
  - 2 consecutive misses -> shrink sequence by one card and reduce clock choices.
  - 3 first-attempt successes -> add one variable only.
  - Repeated confusion (`before/after`, `hour/half-hour`) triggers focused remediation mini-round before progression.
  - Promotion gate L1->L2: first-attempt sequence accuracy `>=80%` over last 6 rounds.
  - Promotion gate L2->L3: combined sequence+clock accuracy `>=80%` and hint usage `<=30%` over last 8 rounds.

## Feedback Design
- Success feedback:
  - Timeline animates forward with a positive routine-complete cue.
  - Clock chime + praise line from `feedback.success.*`.
- Mistake handling:
  - No harsh error states.
  - Gentle coaching line: "נבדוק מה קורה קודם" with one highlighted positional cue.
  - Immediate retry with reduced load.
- Encouragement pattern:
  - Reinforce planning and observation ("סידרת את זה מצוין").

## Session Design
- Expected play time: 6-8 minutes.
- Session shape: 6-8 adaptive rounds (mix of sequence and clock tasks).
- Natural stopping points:
  - Stop/continue choice after first 3 rounds.
  - End recap shows strongest routine skill and recommended real-world practice prompt for parents.
- Replay value:
  - Rotating familiar Israeli routine sets (גן, חוג, ארוחת ערב, מקלחת, סיפור לילה) while preserving objective.

## Audio Requirements
- All child-facing text must be i18n-keyed with paired Hebrew narration.
- Required key families:
  - `games.timeAndRoutineBuilder.title`
  - `games.timeAndRoutineBuilder.subtitle`
  - `games.timeAndRoutineBuilder.instructions.*`
  - `games.timeAndRoutineBuilder.prompts.sequence.*`
  - `games.timeAndRoutineBuilder.prompts.clock.*`
  - `games.timeAndRoutineBuilder.prompts.elapsed.*`
  - `games.timeAndRoutineBuilder.hints.*`
  - `games.timeAndRoutineBuilder.recovery.*`
  - `feedback.encouragement.*`
  - `feedback.success.*`
- Audio file pattern:
  - `public/audio/he/games/time-and-routine-builder/*.mp3`
- Accessibility:
  - Persistent replay and hint controls (44px+).
  - Tap any timeline card to replay its narrated activity label.

## Parent Visibility
- Parent dashboard metrics:
  - Sequence-order accuracy.
  - Clock-match accuracy (`hour` vs `half-hour`).
  - Hint reliance and misconception trend (`before_after`, `clock_anchor`).
- Parent summary keys:
  - `parentDashboard.games.timeAndRoutineBuilder.progressSummary`
  - `parentDashboard.games.timeAndRoutineBuilder.nextStep`

## Inspiration / References
- Lingokids: routine-based life-skill framing with short playful loops.
- Khan Academy Kids: scaffolded sequencing and adaptive progression.
- Montessori Preschool: self-paced corrective flow with no punitive states.

## Review Status
- Mechanics review requested from Gaming Expert (pending).
