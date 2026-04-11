# Subtraction Street (Hebrew: רחוב החיסור)

## Learning Objective
- Curriculum area: Numbers (מספרים)
- Core skill: Subtraction as "taking away" and backward movement on the number line (`within 10`, then `within 20`).
- Measurable outcome: After 4 sessions, child solves at least 80% of level-calibrated subtraction rounds on first attempt with no more than one hint per round.
- Milestone mapping:
  - Ages 6-7: move from concrete take-away actions to symbolic subtraction equations.
  - Ages 7 stretch: solve missing-subtrahend prompts with guided support.

## Target Age Range
- Primary: 6-7
- Secondary stretch: late 7

## Mechanic
- Primary interaction: Tap-to-hop backward on a number line, with optional drag support only for remediation rounds.
- Round loop:
  1. Audio-first prompt introduces a single subtraction challenge (for example: "דובי על 9, מחסירים 3").
  2. Child taps backward jump chips (or taps counters to remove in concrete rounds).
  3. Landing preview updates live after each jump.
  4. Validation is immediate when the action sequence is complete; no separate check button.
- Engine fit:
  - One DB row in `games` table (slug: `subtractionStreet`, `game_type: tap`).
  - One component: `SubtractionStreetGame`.
- Mobile/RTL requirements:
  - Number line remains left-to-right for math convention; all prompts/controls remain RTL.
  - Touch targets 44px+ with spacing tuned for tablet thumb reach.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` replay icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), next (`→`).
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; no separate `check`/`test` button.

## Difficulty Curve
- Level 1 (Concrete Take-Away, within 10):
  - Start numbers `5-10`, subtract `1-3`.
  - Concrete counters shown above the line; child removes counters and sees matching backward hops.
  - One new variable at a time (range OR step-size).
- Level 2 (Number-Line Subtraction, within 20):
  - Start numbers `8-20`, subtract `2-6`.
  - Counters fade; backward jumps become primary representation.
  - Crossing 10 is introduced only after stable non-crossing success.
- Level 3 (Strategy and Missing Parts):
  - Mixed prompts (`14-5`, `? = 12-4`, `15-?=9`) with one unknown type per round block.
  - Visual scaffolds reduce gradually but replay/hint stay persistent.
- Adaptive rules:
  - 2 consecutive misses -> reduce range and re-enable concrete counters.
  - 3 consecutive first-attempt successes -> promote one step.
  - 3 misses on same misconception (`overshoot`, `wrong direction`, `crossing-10`) -> targeted remediation mini-loop before continuing.
  - Promotion gate L1->L2: first-attempt success `>=75%` over last 8 rounds and hint usage `<=35%`.
  - Promotion gate L2->L3: first-attempt success `>=80%` over last 10 rounds and hint usage `<=25%`.

## Feedback Design
- Success feedback:
  - Immediate positive animation (דובי lands + street light-up effect).
  - Rotating encouragement audio from `feedback.success.*`.
  - Strategy praise when child uses efficient jumps.
- Mistake handling:
  - No red X, no buzzer, no point loss.
  - Gentle cue: "ננסה יחד" + visual replay of last correct backward step.
  - Retry on a near-transfer item with lighter load.
- Encouragement pattern:
  - Effort-first language ("חשבת טוב") before corrective cue.

## Session Design
- Expected play time: 5-8 minutes.
- Session shape: 7-9 adaptive rounds.
- Natural stopping points:
  - Mid-session stop card after round 4.
  - End card with one mastered skill + one next-step recommendation.
- Replay value:
  - Rotating street themes (park, market, beach) with stable subtraction objective.

## Audio Requirements
- All user-facing strings must be i18n-keyed with paired Hebrew narration.
- Required key families:
  - `games.subtractionStreet.title`
  - `games.subtractionStreet.subtitle`
  - `games.subtractionStreet.instructions.*`
  - `games.subtractionStreet.prompts.within10.*`
  - `games.subtractionStreet.prompts.within20.*`
  - `games.subtractionStreet.prompts.missingPart.*`
  - `games.subtractionStreet.hints.*`
  - `games.subtractionStreet.recovery.*`
  - `feedback.encouragement.*`
  - `feedback.success.*`
- Audio file pattern:
  - `public/audio/he/games/subtraction-street/*.mp3`
- Accessibility:
  - Replay/hint controls always visible (44px+).
  - Number tap can replay spoken numeral in remediation mode.

## Parent Visibility
- Parent dashboard metrics:
  - Accuracy by subtraction range (`within10`, `within20`).
  - Misconception tags trend (`overshoot`, `direction`, `crossing10`).
  - Hint reliance trend by level.
- Parent summary keys:
  - `parentDashboard.games.subtractionStreet.progressSummary`
  - `parentDashboard.games.subtractionStreet.nextStep`

## Inspiration / References
- Khan Academy Kids: scaffolded arithmetic progression with calm correction.
- Teach Your Monster to Read: clear mastery gates and motivating progression loop.
- Lingokids: short-session structure and replay through theme rotation.

## Review Status
- Mechanics review requested from Gaming Expert (pending).
