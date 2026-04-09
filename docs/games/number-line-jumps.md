# Number Line Jumps (Hebrew: קפיצות מספרים עם דובי)

## Learning Objective
- Curriculum area: Numbers (מספרים)
- Core skill: Early addition fluency using number-line movement and decomposition strategies.
- Measurable outcome: After 5 sessions, child solves at least 75% of addition rounds up to 20 with no more than one hint per round.
- Milestone mapping:
  - Ages 6-7: transition from concrete counting to structured mental addition.

## Target Age Range
- Primary: 6-7

## Mechanic
- Primary interaction: Tap and drag on a number line.
- Round loop:
  1. Audio story prompt presents an addition challenge (for example, "Dubi is on 7 and jumps 3 forward").
  2. Child drags a jump arc or taps step chips to move דובי on the number line.
  3. Child confirms destination number.
  4. Game responds with celebration or scaffolded retry.
- Engine fit:
  - One DB row in `games` table (slug: `numberLineJumps`, `game_type: tap`).
  - One component: `NumberLineJumpsGame`.
- Mobile/RTL requirements:
  - Number line visual still increases left-to-right for math consistency, while instructions and controls remain RTL.
  - All controls are 44px+ with generous spacing for tablet touch.

## Difficulty Curve
- Level 1 (Within 10):
  - Start numbers 0-7, addends 1-3.
  - Visible single-step hops with spoken counting.
- Level 2 (Within 20):
  - Start numbers 0-15, addends 1-5.
  - Child chooses jump chunking (for example, +2 then +3).
  - Optional tens-anchor hints.
- Level 3 (Strategy Rounds):
  - Missing addend and short story variants (for example, "You are on 9 and need to reach 14").
  - Includes occasional two-addend chaining.
  - Reduced visual scaffolds; replay audio always available.
- Adaptive rules:
  - If child misses 2 rounds, switch to smaller addends and re-enable step-by-step narration.
  - If child succeeds 4 rounds in sequence, introduce strategy round early.
  - Hint escalation: replay prompt -> highlighted jump path -> guided first hop.

## Feedback Design
- Success path:
  - דובי lands with celebratory animation and upbeat audio cue.
  - Positive phrase chosen from rotating success bank.
  - Strategy praise when child uses efficient jumps.
- Mistake path:
  - Soft correction language only; no negative symbols.
  - Number line replays last jump visually with encouragement.
  - Child retries with the same equation before moving on.
- Encouragement pattern:
  - Reward persistence and strategy use, not speed.

## Session Design
- Expected play time: 8-12 minutes.
- Session shape: 10 rounds with adaptive distribution across levels.
- Natural stopping points:
  - Optional pause after round 5.
  - Session end recap recommends either replay or lighter follow-up game.
- Replay value:
  - Equation pool and short story contexts vary each play session.

## Audio Requirements
- Every text surface must be i18n-keyed with Hebrew narration.
- Required key families:
  - `games.numberLineJumps.title`
  - `games.numberLineJumps.subtitle`
  - `games.numberLineJumps.instructions.*`
  - `games.numberLineJumps.prompts.addition.*`
  - `games.numberLineJumps.prompts.missingAddend.*`
  - `games.numberLineJumps.hints.*`
  - `games.numberLineJumps.strategyPraise.*`
  - `feedback.encouragement.*`
  - `feedback.success.*`
- Audio file pattern:
  - `public/audio/he/games/number-line-jumps/*.mp3`
  - Audio manifest must map each key used in the game.
- Accessibility:
  - Replay instruction and equation narration controls are always visible and touch-friendly.

## Parent Visibility
- Parent dashboard metrics:
  - Accuracy by range (within 10 vs within 20).
  - Hint reliance trend by level.
  - Strategy adoption signal (single count-all vs grouped jumps).
- Parent summary keys:
  - `parentDashboard.games.numberLineJumps.progressSummary`
  - `parentDashboard.games.numberLineJumps.nextStep`

## Inspiration / References
- Teach Your Monster to Read: progression through structured game-world mastery.
- Khan Academy Kids: adaptive leveling and scaffold fadeout.
- Lingokids: short-session loops with clear stopping moments.

## Review Status
- Mechanics review requested from Gaming Expert before implementation handoff.
