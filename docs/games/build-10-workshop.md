# Build-10 Workshop (Hebrew: סדנת בונים 10)

## Learning Objective
- Curriculum area: Numbers (מספרים)
- Core skill: Number composition/decomposition (number bonds) with concrete-to-visual transfer for `5`, `10`, and `20`.
- Measurable outcome: After 4 sessions, child builds target totals with at least two valid decompositions in 75%+ of Level 2 rounds.
- Milestone mapping:
  - Ages 5-6: compose/decompose within 10 using manipulatives and ten-frames.
  - Ages 6-7: bridge to teen numbers as `10 + ones`, then `20` as two tens.

## Target Age Range
- Primary: 5-7

## Mechanic
- Primary interaction: Drag-and-snap cubes into ten-frames and part-part-whole boards, with tap-to-send fallback.
- Round loop:
  1. Audio prompt gives one target total (for example: "בנו את 10 בשתי דרכים שונות").
  2. Child drags colored cubes into frame(s).
  3. Game validates immediately as cubes snap into slots.
  4. When target is reached, child is prompted to create an alternate valid decomposition.
- Engine fit:
  - One DB row in `games` table (slug: `build10Workshop`, `game_type: drag_drop`).
  - One component: `Build10WorkshopGame`.
- Mobile/RTL requirements:
  - Boards and control chips arranged RTL; numeric progression remains conventional left-to-right inside ten-frame rows.
  - All drag sources/targets are 44px+ and spaced for tablet precision.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` replay icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), next (`→`).
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; no separate `check`/`test` button.

## Difficulty Curve
- Level 1 (Make 5 / Make 10 Foundations):
  - Targets `4-10`, one frame, concrete color grouping.
  - Child builds one valid model with full slot highlights.
  - Distinct number pairs emphasized (`2+3`, `4+1`, `5+5`).
- Level 2 (Two Ways to Build 10):
  - Targets `6-10`, child must produce two different decompositions for same target.
  - Part-part-whole board added after stable first decomposition accuracy.
  - Unknown part prompts introduced (`7 = 3 + ?`) with manipulatives visible.
- Level 3 (Teen Bridge and 20):
  - Targets `11-20` represented as `10 + ones` and later two-ten combinations.
  - Teen structure language added ("עשר ועוד...") with persistent audio replay.
  - Visual supports fade gradually; alternate-decomposition requirement remains.
- Adaptive rules:
  - 2 consecutive misses -> reduce target range and re-enable full slot cues.
  - 3 consecutive first-attempt successes -> increase one variable (range OR unknown-part OR alternate model requirement).
  - If child repeats identical decomposition twice when two forms are required, system plays gentle cue and highlights one alternative partition path.
  - Promotion gate L1->L2: first-attempt success `>=75%` and hint usage `<=35%` over last 8 rounds.
  - Promotion gate L2->L3: first-attempt success `>=80%` and independent alternate-model completion `>=70%` over last 10 rounds.

## Feedback Design
- Success feedback:
  - Frame fills with a short celebration animation and spoken number-bond reinforcement.
  - Bonus praise for alternate decomposition ("מצאת דרך נוספת!").
- Mistake handling:
  - No punitive symbols/sounds.
  - Gentle correction: "בואו נבדוק יחד" with one scaffolded slot highlight.
  - Immediate retry on same objective with reduced complexity.
- Encouragement pattern:
  - Praise flexible thinking and persistence, not speed.

## Session Design
- Expected play time: 6-9 minutes.
- Session shape: 8 adaptive rounds grouped into 2 micro-blocks.
- Natural stopping points:
  - Optional stop after first block (round 4).
  - End recap shows totals mastered and whether child found multiple decompositions.
- Replay value:
  - Rotating materials themes (lego cubes, fruit crates, bead trays) while preserving the same math objective.

## Audio Requirements
- All user-facing text must be i18n-keyed with paired Hebrew audio.
- Required key families:
  - `games.build10Workshop.title`
  - `games.build10Workshop.subtitle`
  - `games.build10Workshop.instructions.*`
  - `games.build10Workshop.prompts.make10.*`
  - `games.build10Workshop.prompts.twoWays.*`
  - `games.build10Workshop.prompts.teenBridge.*`
  - `games.build10Workshop.hints.*`
  - `games.build10Workshop.recovery.*`
  - `numbers.names.*`
  - `feedback.encouragement.*`
  - `feedback.success.*`
- Audio file pattern:
  - `public/audio/he/games/build-10-workshop/*.mp3`
- Accessibility:
  - Replay and hint controls stay persistent (44px+).
  - Tapping any built model can replay its spoken decomposition.

## Parent Visibility
- Parent dashboard metrics:
  - Target totals mastered (`<=10`, `11-20`).
  - Alternate decomposition rate (flexible-number thinking signal).
  - Unknown-part accuracy trend.
- Parent summary keys:
  - `parentDashboard.games.build10Workshop.progressSummary`
  - `parentDashboard.games.build10Workshop.nextStep`

## Inspiration / References
- Khan Academy Kids: concrete manipulatives to symbolic bridge in early math.
- Montessori Preschool: self-correcting materials and calm repetition.
- Lingokids: short, high-replay loops with themed variety.

## Review Status
- Mechanics review requested from Gaming Expert (pending).
