# Pattern Train (Hebrew: רכבת הדפוסים)

## Learning Objective
- Curriculum area: Early logic + sequencing (דפוסים ורצפים)
- Core skill: identify, continue, and repair visual/audio patterns (`AB`, `AAB`, `ABC`, and alternating attribute rules).
- Measurable outcome: After 4 sessions, child completes at least 80% of level-calibrated pattern rounds on first attempt with no more than one hint per round.
- Milestone mapping:
  - Ages 4-5: detect and continue simple repeating patterns.
  - Ages 5-6: infer the rule and predict the next unit with mixed attributes.

## Target Age Range
- Primary: 4-6
- Secondary support: advanced 3.8+

## Mechanic
- Primary interaction: Drag train cars into the missing slot, with tap-to-select fallback.
- Round loop:
  1. Audio-first prompt plays a short pattern rule (for example: "מה בא אחרי אדום-כחול-אדום-כחול?").
  2. Child drags or taps the next car piece.
  3. Validation happens immediately on placement; no separate check button.
  4. Train animates forward after correct completion.
- Engine fit:
  - One DB row in `games` table (slug: `patternTrain`, `game_type: drag_drop`).
  - One component: `PatternTrainGame`.
- Mobile/RTL requirements:
  - Car queue and controls render RTL.
  - Pattern sequence itself is read right-to-left in presentation order.
  - Interactive targets remain 44px+.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Difficulty Curve
- Level 1 (Repeat and Continue):
  - Patterns: `AB` with one visual attribute (color or shape).
  - Choices: 2 options.
  - Full ghost outline of missing slot stays visible.
- Level 2 (Two-Attribute Patterns):
  - Patterns: `AAB` and `ABB`, mixing color + icon family.
  - Choices: 3 options.
  - Prompt asks child to say or hear the rule before placing.
- Level 3 (Rule Transfer and Repair):
  - Patterns: `ABC` and one-break sequences (find/repair wrong car in sequence).
  - Choices: 3-4 options.
  - Visual supports fade; audio replay persists.
- Adaptive rules:
  - 2 consecutive misses -> reduce options by 1 and replay rule with slower pacing.
  - 3 consecutive first-attempt successes -> raise one variable only (pattern type OR distractor similarity).
  - Promotion gate L1->L2: first-attempt success `>=75%` over last 8 rounds.
  - Promotion gate L2->L3: first-attempt success `>=80%` over last 10 rounds and hint usage `<=30%`.

## Feedback Design
- Success feedback:
  - Train movement + celebration chime + דובי encouragement.
  - Rule reinforcement audio ("מעולה, הבנת את הדפוס!").
- Mistake handling:
  - No red X, no buzzer.
  - Gentle wobble + supportive retry cue.
  - Same objective repeats with lower distractor load.
- Encouragement pattern:
  - Effort language first, then one actionable hint.

## Session Design
- Expected play time: 5-7 minutes.
- Session shape: 9-12 quick rounds.
- Natural stopping points:
  - Mini-break card after round 5.
  - End card with one mastered pattern type and one next-focus rule.
- Replay value:
  - Rotating train themes (animals, market goods, holiday objects) while preserving logic objective.

## Audio Requirements
- All user-facing strings must be i18n-keyed with paired Hebrew narration.
- Required key families:
  - `games.patternTrain.title`
  - `games.patternTrain.subtitle`
  - `games.patternTrain.instructions.*`
  - `games.patternTrain.prompts.level1.*`
  - `games.patternTrain.prompts.level2.*`
  - `games.patternTrain.prompts.level3.*`
  - `games.patternTrain.hints.*`
  - `games.patternTrain.recovery.*`
  - `feedback.success.*`
  - `feedback.encouragement.*`
- Audio file pattern:
  - `public/audio/he/games/pattern-train/*.mp3`
- Accessibility:
  - Replay/hint controls remain persistent and tappable at all times.

## Parent Visibility
- Parent dashboard metrics:
  - Accuracy by pattern type (`AB`, `AAB`, `ABC`, repair).
  - Hint reliance trend.
  - Misconception tags (`rule-skip`, `distractor-bias`, `attribute-confusion`).
- Parent summary keys:
  - `parentDashboard.games.patternTrain.progressSummary`
  - `parentDashboard.games.patternTrain.nextStep`

## Inspiration / References
- Khan Academy Kids: progression from concrete repeat rules to abstract rule detection.
- TinyTap: short drag/tap rounds with immediate result.
- Lingokids: micro-session pacing and replay via theme variation.

## Review Status
- Mechanics review requested from Gaming Expert (pending).
