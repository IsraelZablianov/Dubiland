# Interactive Handbooks Mechanics (Hebrew: ספרונים אינטראקטיביים)

## Learning Objective
- Define a reusable interaction system for handbook pages that teaches numeracy and early literacy while keeping story flow intact.
- Keep interactions developmentally aligned for ages 3-7 with explicit easy/medium/hard progression.
- Ensure mechanics are implementation-ready for PM, Architect, FED, Content Writer, and QA.

## Target Age Range
- Primary: 3-7
- Difficulty bands:
  - Easy: 3-4
  - Medium: 4-5
  - Hard: 5-7

## Mechanic
- Page loop:
  1. Story phase: narration + animation/video segment runs (8-25 seconds).
  2. Pause gate: page enters `interaction_prompt` state, story media pauses, and one focal task appears.
  3. Child action: tap/drag/select/trace/input triggers immediate validation (no check/submit button).
  4. Feedback: success micro-celebration or gentle corrective scaffold.
  5. Resume: story continues from checkpoint and page can complete.
- State contract for implementation (`xstate` recommended):
  - `page_intro` -> `story_playing` -> `interaction_prompt` -> (`feedback_success` or `feedback_retry`) -> `story_resume` -> `page_complete`
- Interaction density per page:
  - Ages 3-4: max 1 interaction on a page.
  - Ages 4-5: max 1 interaction; occasional challenge page with 2 very short prompts.
  - Ages 5-7: max 2 interactions, but never two new concepts on the same page.

## Pre-Literate UX Baseline (Mandatory)
- Every instruction has paired Hebrew audio and replay icon (`▶`, minimum 44px).
- Child controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), continue (`→`).
- Feedback is action-triggered only; no explicit `check/submit/test` controls in gameplay.
- One focal visual target at a time during interaction prompts.
- All child tap targets must remain 44px+ and avoid bottom-edge-only hotspots.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays active instruction key (`handbooks.interactions.instructions.*`) | Prompt pulses and active target highlights. |
| Retry interaction | `↻` | Encouragement cue (`feedback.encouragement.*`) + prompt replay | Same concept restarts with one simplification step. |
| Hint | `💡` | Context hint key (`handbooks.interactions.hints.*`) | Shows next valid move (glow, outline, or guide path). |
| Continue story | `→` | Transition cue (`feedback.success.*`) | Returns to story playback checkpoint. |

## Interaction Taxonomy Matrix
| Interaction type | Learning goal | Easy (3-4) | Medium (4-5) | Hard (5-7) | Adaptive simplification (after 2 failed attempts) | FED approach |
|---|---|---|---|---|---|---|
| Counting tap/select | 1:1 correspondence + number words | Count sets 1-3 with slow audio cadence; 2 choices max | Count sets 1-5; 3 choices | Count/add small sets to 10; mixed layouts | Reduce set size by 1, then enable sequential highlight counting | React + `framer-motion` |
| Color match | Visual discrimination + vocabulary | Match 3 core colors, one object at a time | Match 4-5 colors, mild distractors | Match color in context (story clue + object family) | Reduce options to 2 and add color swatch hint pulse | React + `framer-motion` |
| Equation entry | Concrete arithmetic mapping | Choose answer chip for sums within 3 (no free typing) | Choose chip for sums within 5 and take-away within 5 | Enter result with numeral chips/keypad for sums within 10 | Convert to concrete visual split-combine and reduce operands | React + controlled inputs |
| Letter identification | Sound-symbol mapping | Pick target letter from 2 high-distinction letters | Pick from 3 letters; introduce one confusable foil occasionally | Identify letter/sound with context clue and 4 choices | Drop to 2 options + anchor-word audio replay | React + `framer-motion` |
| Drag/drop mapping | Classification + motor planning | Drag one item to one obvious target | Drag 2-3 items with simple category cues | Drag to multiple bins with one rule variation | Switch to tap-to-place fallback and ghost target preview | `@use-gesture/react` + DOM/CSS |

## Difficulty Curve
- Isolation of difficulty:
  - Easy -> Medium: add exactly one variable (more options OR more items OR mild distractors).
  - Medium -> Hard: add one variable again (speed, distractor similarity, or response format).
- Adaptive pacing:
  - If 2 failed attempts or 8 seconds inactivity: apply one simplification step only.
  - Simplification order: fewer choices -> stronger hint -> slower animation -> concrete visual scaffold.
  - Recovery: after 2 consecutive correct responses without hint, return one step toward baseline.
- Session length target:
  - Interaction segments should be 10-35 seconds each.
  - Total active interaction time per 5-20 page handbook should fit 2-5 minute loops by age.
- Mastery progression thresholds:
  - Promote concept tier when child gets 4 of last 5 prompts correct with at most 1 hint.
  - Trigger remediation micro-loop when same error pattern appears 3 times in one session.

## Pause/Resume Story Rules
- When interaction begins:
  - Pause narration, video, and non-essential animations within 120ms.
  - Freeze page state at a resume checkpoint (timecode + animation frame id).
  - Disable page-turn gesture until interaction resolves.
- During interaction:
  - Keep ambient animation subtle to reduce cognitive load.
  - Auto-replay instruction if no action for 6 seconds.
- On success:
  - Play success micro-feedback (400-900ms), then resume story from checkpoint.
  - Maintain continuity by resuming voice/music ducking levels smoothly.
- On retry:
  - Keep child on same story page and same concept; do not eject to menu.

## Hint Cadence and Retry Policy
- Hint cadence:
  - Manual hint is always available (`💡`).
  - Auto-hint triggers after 2 incorrect attempts or 8 seconds inactivity.
  - Hard mode still allows hints, but only one auto-hint per prompt before simplification.
- Retry policy:
  - Unlimited retries with no punitive language.
  - Each retry keeps concept constant and changes only one support variable.
  - After 3 retries on same prompt, use guided success mode (highlighted correct path) and move on.

## Scoring and Progress Model
- No negative scoring for mistakes.
- Per-interaction score:
  - First-try correct: 3 mastery stars.
  - Correct after hint/retry: 2 mastery stars.
  - Guided success after multiple retries: 1 mastery star.
- Book completion summary:
  - `engagement_score`: completed interactions / offered interactions.
  - `mastery_score`: average stars across interactions.
  - `support_score`: inverse of hint and guided-success usage.
- Reward cadence:
  - Every correct action: small celebration (sparkle + short audio cue).
  - End of page: one micro-reward card (sticker/story item).
  - End of handbook: narrative celebration scene with דובי and recap audio.
- Parent/analytics fields:
  - `first_try_accuracy`
  - `hint_rate`
  - `retry_count`
  - `time_to_first_action_ms`
  - `concept_mastery_by_type` (counting, color, equation, letter, drag_drop)

## Feedback Design
- Correct action:
  - Immediate positive audio + visual confirmation on the acted object.
  - Maintain flow with short celebrations; do not interrupt with long reward sequences mid-page.
- Incorrect action:
  - Gentle correction cue and visual nudge to next likely valid action.
  - No red error overlays, no lives, no fail screens.
- Variation without unpredictability:
  - Rotate 4-6 micro-celebration variants, but keep validation timing constant.

## Audio Requirements
- Every child-facing line must map to i18n key + Hebrew audio file.
- Required key families:
  - `handbooks.interactions.instructions.*`
  - `handbooks.interactions.hints.*`
  - `handbooks.interactions.success.*`
  - `handbooks.interactions.retry.*`
  - `handbooks.interactions.transitions.*`
  - `feedback.encouragement.*`
  - `feedback.success.*`
- Audio behavior:
  - Prompt replay must restart from current prompt context, not page start.
  - Interaction cue audio should be short (<1.2s) to keep story rhythm.

## Implementation Notes (FED + Architecture)
- Use `xstate` for page/interaction state transitions to avoid impossible story states.
- Use DOM-first rendering for tap/select/color/letter interactions.
- Use `@use-gesture/react` for drag/drop interactions with tap fallback enabled.
- Keep interaction config data-driven so PM/Content can author prompts without code changes.

## Owner and ETA Matrix
| Workstream | Owner | ETA (date) | Output |
|---|---|---|---|
| Mechanics baseline + matrix | Gaming Expert | 2026-04-10 | This spec + issue comment handoff |
| Product approval + prioritization | PM | 2026-04-11 | Locked v1 interaction scope |
| Data model and schema hooks | Architect | 2026-04-11 | Handbook interaction schema notes |
| Story player + interaction engine implementation | FED Engineer | 2026-04-13 | Playable handbook interaction flow |
| i18n keys + Hebrew audio asset generation | Content Writer | 2026-04-13 | Prompt/hint/feedback audio set |
| RTL/touch/accessibility validation | QA Engineer | 2026-04-14 | QA signoff and defects list |

## Review Status
- Drafted by Gaming Expert on 2026-04-10 for [DUB-329](/DUB/issues/DUB-329).
- Intended handoff target: parent feature thread [DUB-325](/DUB/issues/DUB-325).
