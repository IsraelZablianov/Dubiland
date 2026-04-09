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
- Primary interaction: Tap-to-jump (default on all levels); optional drag arc appears only in late hard rounds with tap fallback always available.
- Round loop:
  1. Audio prompt introduces one addition challenge with one focal visual (for example: "דובי על 7, קופץ 3 קדימה").
  2. Child taps step chips to build the jump (drag arc unlocked only after mastery).
  3. Destination preview updates live as each step is chosen.
  4. Game resolves feedback immediately when the jump sequence completes, then either advances or enters a guided retry.
- Engine fit:
  - One DB row in `games` table (slug: `numberLineJumps`, `game_type: tap`).
  - One component: `NumberLineJumpsGame`.
- Mobile/RTL requirements:
  - Number line visual still increases left-to-right for math consistency, while instructions and controls remain RTL.
  - All controls are 44px+ with generous spacing for tablet touch.
  - Avoid bottom-edge critical controls for tablet ergonomics.

## Pre-Literate UX Baseline (Mandatory)
- Every instruction text shown to the child must include an adjacent `▶` play icon (minimum 44px) that replays the exact instruction audio.
- Child-facing controls are icon-first, not text-first. Use persistent icons for replay (`▶`), retry (`↻`), hint (`💡`), and next (`→`).
- Text labels may appear only as supporting parent/teacher UI; gameplay controls for children must remain understandable via icon + audio alone.
- Feedback and validation are action-based: the game responds immediately to taps, drags, traces, or spoken input and never requires a separate `check` or `test` button.
- Icon taps trigger short narrated cues from i18n/audio keys so pre-readers can learn each icon meaning by sound.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays active `games.numberLineJumps.instructions.*` or prompt audio | Prompt pulse + current number-line cue emphasis. |
| Retry round | `↻` | Plays `feedback.encouragement.*`, then replays current equation prompt | Soft reset to same concept with restored scaffold. |
| Hint | `💡` | Plays next scaffold cue from `games.numberLineJumps.hints.*` | Highlights valid jump path / guided first hop. |
| Next / continue | `→` | Plays short transition cue from `feedback.success.*` | Moves directly to the next addition round. |

## Difficulty Curve
- Level release order:
  - Stage A: within 10, no crossing-10 jumps.
  - Stage B: within 20, bridge-to-10 decomposition.
  - Stage C: strategy forms (missing addend, then controlled chaining).
- Level 1 (Easy, ages 6-early 7: Counted Jumps):
  - Start numbers 0-6, addends 1-2.
  - One hop per tap with spoken 1:1 counting cadence.
  - Two destination candidates max; no chaining.
- Level 2 (Medium, ages 6-7: Bridge to 10):
  - Start numbers 0-15, addends 2-5.
  - Introduce one new variable per round block: decomposition OR reduced marker support (never both together).
  - Tens-anchor cue available on demand.
- Level 3 (Hard, ages 7 stretch: Strategy Builder):
  - Ordered micro-phases:
    1. Missing addend rounds (fixed target, one unknown).
    2. Two-addend chaining appears only after stable missing-addend success.
  - Story prompts remain short and audio replay stays persistent.
  - Visual scaffolds fade gradually, never all at once.
- Adaptive rules:
  - Promotion gate: 4 of last 5 rounds correct with <=1 hint.
  - 2 consecutive misses: step back one micro-stage, reduce options by one, re-enable narrated count-all support.
  - 3 misses on the same concept across 5 rounds (bridge-to-10 or missing addend): trigger targeted remediation mini-loop before progression resumes.
  - Hint cadence: replay prompt -> highlighted jump path -> guided first hop -> answer reveal + immediate near-transfer retry.

## Remediation and Math-Safety Guardrails
- Remediation mini-loop (single concept only):
  1. Concrete counters appear above the line and sync with spoken counting.
  2. Guided first hop by דובי, child completes final hop.
  3. Near-transfer round with similar numbers before returning to normal flow.
- Math-safety guardrails:
  - No timers, no lives, no speed scoring.
  - No red X, buzzer, or punitive language.
  - After a third miss, show the correct landing with explanation, then let the child retry a similar item immediately.
  - Replay instruction and equation narration controls are always visible and touch-friendly.
- FED state guidance:
  - Use explicit round states (`prompt -> input -> validate -> feedback -> remediation -> next`) to keep adaptive transitions deterministic.
  - Track misconception tags (`bridge_to_10`, `missing_addend`, `overshoot`) for remediation routing and parent analytics.

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
- Expected play time: 4-6 minutes.
- Session shape: 6-8 adaptive rounds (+1 optional bonus round when accuracy is stable).
- Natural stopping points:
  - Optional pause after round 4.
  - Session end recap recommends either replay or lighter follow-up game.
- Replay value:
  - Equation pool and short story contexts vary each play session.

## Edge Cases and Failure Recovery
- Random tapping streak:
  - Detect 4 rapid incorrect taps -> lock next round to 2 options and require prompt replay before next tap.
- Drag motor friction:
  - If two failed drags occur in one session, keep drag optional but default to tap chips for all remaining rounds.
- RTL orientation confusion:
  - If child repeatedly taps leftward for forward jumps, show a brief "forward is rightward" animation cue before retry.
- Inactivity:
  - If no interaction for 8 seconds, replay the instruction and pulse one valid next action.

## Audio Requirements
- Every text surface must be i18n-keyed with Hebrew narration.
- Required key families:
  - `games.numberLineJumps.title`
  - `games.numberLineJumps.subtitle`
  - `games.numberLineJumps.instructions.*`
  - `games.numberLineJumps.prompts.addition.*`
  - `games.numberLineJumps.prompts.missingAddend.*`
  - `games.numberLineJumps.prompts.bridgeToTen.*`
  - `games.numberLineJumps.hints.*`
  - `games.numberLineJumps.recovery.*`
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
- Mechanics review finalized by Gaming Expert on 2026-04-10; ready for FED implementation, Content Writer i18n/audio coverage, and QA remediation-path validation.
