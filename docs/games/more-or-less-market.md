# More or Less Market (Hebrew: שוק יותר או פחות)

## Learning Objective
- Curriculum area: Numbers (מספרים)
- Core skill: Compare quantities and identify "more", "less", and "equal" in sets up to 20.
- Measurable outcome: After 4 sessions, child solves at least 80% of comparison rounds in Level 2+ with no visual hint escalation.
- Milestone mapping:
  - Ages 5-6: visual quantity comparison and verbal reasoning.
  - Ages 6 extension: bridge from visual sets to numeral-based comparison.

## Target Age Range
- Primary: 5-6
- Secondary stretch: early 6-7

## Mechanic
- Primary interaction: Tap selection + drag comparison badge.
- Round loop:
  1. דובי gives a prompt (for example, "Tap the basket with more oranges").
  2. Child taps left/right basket or numeral card.
  3. In higher levels, child drags one badge (`more`, `less`, `equal`) into a center slot.
  4. Immediate feedback and next round transition.
- Engine fit:
  - One DB row in `games` table (slug: `moreOrLessMarket`, `game_type: match`).
  - One component: `MoreOrLessMarketGame`.
- Mobile/RTL requirements:
  - Choice cards are minimum 44px and arranged right-to-left.
  - Prompt and helper chips are right-aligned.

## Pre-Literate UX Baseline (Mandatory)
- Every instruction text shown to the child must include an adjacent `▶` play icon (minimum 44px) that replays the exact instruction audio.
- Child-facing controls are icon-first, not text-first. Use persistent icons for replay (`▶`), retry (`↻`), hint (`💡`), and next (`→`).
- Text labels may appear only as supporting parent/teacher UI; gameplay controls for children must remain understandable via icon + audio alone.
- Feedback and validation are action-based: the game responds immediately to taps, drags, traces, or spoken input and never requires a separate `check` or `test` button.
- Icon taps trigger short narrated cues from i18n/audio keys so pre-readers can learn each icon meaning by sound.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays active `games.moreOrLessMarket.instructions.*` clip | Prompt chip pulse + active comparison focus glow. |
| Retry round | `↻` | Plays `feedback.encouragement.*`, then current prompt replay | Resets current comparison with reduced load. |
| Hint | `💡` | Plays next support cue from `games.moreOrLessMarket.hints.*` | Starts recount/highlight scaffold for the same concept. |
| Next / continue | `→` | Plays short success transition from `feedback.success.*` | Advances directly to next comparison round. |

## Difficulty Curve
- Level 1 (Starter Compare):
  - Visual sets 1-6, difference of at least 2.
  - Only "more" prompts.
  - Counting dots shown under each set.
- Level 2 (Balanced Compare):
  - Visual sets 1-10, includes close quantities (difference 1-2).
  - Mix of "more" and "less" prompts.
  - Optional tap-to-count scaffold.
- Level 3 (Symbol Bridge):
  - Values 5-20, set-vs-set and numeral-vs-set rounds.
  - Includes equal quantities and `equal` badge usage.
  - Prompt variation introduces simple 2-step instruction only after stable `equal` mastery.
- Adaptive rules:
  - 2 consecutive mistakes -> return to wider quantity differences and auto-enable counting scaffold.
  - 3 consecutive successes -> unlock tighter comparisons or numeral rounds.
  - Equal-quantity rounds appear only after stable Level 2 performance.
  - Promotion gate (L1 -> L2): first-attempt success `>=70%` and hint usage `<=40%`.
  - Promotion gate (L2 -> L3): first-attempt success `>=80%` and hint usage `<=30%` for 2 consecutive sessions.
  - Choice-load cap: max 3 simultaneous actionable answers for core `5-6`, max 4 for `6-7` stretch rounds.

## Feedback Design
- Success path:
  - Friendly character celebration and short market animation.
  - Praise line from rotating `feedback.success.*` key set.
  - Progress bead fills after each successful round.
- Mistake path:
  - Gentle "let's count together" narration, no failure cues.
  - Optional visual recount animation that highlights each item in sequence.
  - Child retries immediately with the same concept and reduced cognitive load.
- Encouragement pattern:
  - "You noticed carefully" style effort praise.
  - Avoid competitive language or penalties.

## Session Design
- Expected play time: 7-10 minutes.
- Session shape: 9 rounds (3 per level, adaptive exits allowed).
- Natural stopping points:
  - After Level 1 and Level 2, offer a clear stop/continue choice.
  - End-of-session recap shows one strength and one next-step focus.
- Replay value:
  - Rotating themes (market fruits, toys, beach shells) with unchanged comparison objective.

## Audio Requirements
- All visible text must map to i18n keys with paired Hebrew narration.
- Required key families:
  - `games.moreOrLessMarket.title`
  - `games.moreOrLessMarket.subtitle`
  - `games.moreOrLessMarket.instructions.*`
  - `games.moreOrLessMarket.prompts.more.*`
  - `games.moreOrLessMarket.prompts.less.*`
  - `games.moreOrLessMarket.prompts.equal.*`
  - `games.moreOrLessMarket.hints.*`
  - `feedback.encouragement.*`
  - `feedback.success.*`
- Audio file pattern:
  - `public/audio/he/games/more-or-less-market/*.mp3`
  - Manifest must include one-to-one i18n key coverage.
- Accessibility:
  - Replay prompt button always visible (44px+).
  - Tap-to-count narration available on every comparison card.

## Parent Visibility
- Parent dashboard metrics:
  - Accuracy by comparison type (`more`, `less`, `equal`).
  - Average hint level needed per round.
  - Progression from object-set comparisons to numeral comparisons.
- Parent summary keys:
  - `parentDashboard.games.moreOrLessMarket.progressSummary`
  - `parentDashboard.games.moreOrLessMarket.nextStep`

## Inspiration / References
- Khan Academy Kids: adaptive comparison exercises with gentle support.
- Lingokids: themed worlds that vary visuals while preserving objective.
- Montessori Preschool: non-punitive correction and child-paced retry.

## Review Status
- Reviewed by Gaming Expert on 2026-04-10 (DUB-582).
- Calibration status: Thresholds calibrated and progression safeguards tightened.
- Rationale: The comparison ladder was directionally strong, but Level 3 needed explicit unlock thresholds and answer-load caps to avoid stacking too many new demands at once.
