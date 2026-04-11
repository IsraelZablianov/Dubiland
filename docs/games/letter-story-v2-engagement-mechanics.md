# Letter Story v2 — Engagement Mechanics (Continuous Narrative Route)

## Context
- Source issue: [DUB-761](/DUB/issues/DUB-761)
- Parent feature: [DUB-664](/DUB/issues/DUB-664)
- Companion lanes: [DUB-757](/DUB/issues/DUB-757), [DUB-758](/DUB/issues/DUB-758), [DUB-760](/DUB/issues/DUB-760), [DUB-762](/DUB/issues/DUB-762)
- Purpose: define engagement mechanics that keep story continuity strong while preserving letter-learning outcomes for ages `3-7`.

## Learning Guardrails
- Engagement is tied to literacy actions (letter-sound choice, decode step, story clue solve), not time-played.
- Every scene introduces at most one new variable (new letter OR new response format OR new distractor type).
- Every failure path is self-correcting: after support, the child still progresses without punishment.
- Core interaction must be learned in one try and repeated across scenes with minor variation.

## Mechanic
- Runtime route is a separate game (`letter-story-v2`) with one continuous narrative across all 22 letters.
- Scene loop target: `25-45s` per scene, with one interaction cluster every `20-35s`.
- Core scene loop:
  1. Story beat (`5-8s`): one short narrated line introduces context and target letter.
  2. Action A (`tap/select`): child identifies target letter in an RTL choice row.
  3. Action B (`tap/drag`): child applies the same target in story context (attach token, unlock gate, or choose matching object/sound).
  4. Immediate feedback: success/mistake response fires on action, then clue meter updates.
  5. Story resume (`2-4s`): short narrative continuation and transition to next scene.
- No `check/submit/test` controls. Validation fires only on taps, drags, or selections.
- Chapter cadence:
  - Chapter 1 (`letters 1-8`): guided discovery.
  - Chapter 2 (`letters 9-15`): guided retrieval with controlled decoys.
  - Chapter 3 (`letters 16-22` + bridge): transfer and contrast with short pointed text checks for `5-7`.

## Pre-Literate UX Baseline (Mandatory)
- Every instruction is audio-first and has replay via `▶` (minimum `44px` target).
- Child controls are icon-first only (`▶`, `↻`, `💡`, `→`); no child-facing text labels.
- One focal visual per prompt; dim non-relevant hotspots until action resolves.
- Touch-first ergonomics:
  - minimum hit area `44px`
  - avoid critical controls on bottom device edge
  - no pinch/flick requirements in scored flow
- Prompt language must be short and concrete:
  - ages `3-4`: up to 5 Hebrew words
  - ages `4-5`: up to 7 Hebrew words
  - ages `5-7`: up to 9 Hebrew words
- RTL-first layout for progression, choice order, and transition affordances.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | `games.letterStoryV2.controls.replay` then current prompt key replay | Active prompt pulse + focus ring on target area. |
| Retry scene concept | `↻` | `games.letterStoryV2.controls.retry` + `feedback.encouragement.*` | Soft reset to same concept, same story beat, no penalty. |
| Hint | `💡` | `games.letterStoryV2.controls.hint` + `games.letterStoryV2.hints.<sceneKey>.<step>` | Progressive scaffold (highlight -> partial solve -> modeled solve). |
| Next / continue | `→` | `games.letterStoryV2.controls.next` | Transition animation to next story scene. |

## Difficulty Curve
| Level | Primary age | One new variable introduced | Interaction load | Promotion / adaptation |
|---|---|---|---|---|
| Level 1: Guided Discovery | `3-4` | Target-letter familiarity only | 1 action per scene, max 2 choices, no confusable decoys | After 2 misses: auto-highlight correct option + supported success granted. |
| Level 2: Guided Retrieval | `4-5` | Add one familiar decoy | 2 actions per scene, max 3 choices, one known + one new concept | After 2 misses: reduce choices by one and replay simplified prompt. |
| Level 3: Transfer and Contrast | `5-7` | Add confusable contrast or short pointed CV/CVC transfer (not both in same scene) | 2 actions + periodic transfer checkpoint every 3 scenes | After 2 misses: drop contrast first, keep core target; on third miss, modeled solve then retry. |

### Adaptive Pacing Rules
- Miss trigger: `2` consecutive misses on same concept => simplify immediately.
- Inactivity trigger: `6s` no action => hint step 1; `12s` => hint step 2 + prompt replay.
- Rapid-tap trigger: `3` wrong taps within `2s` => temporary `900ms` input pause + calm narrated reset.
- Mastery trigger: `3` first-try successes in same pattern => lower visual scaffolds one step.
- Ages `3-4` are never hard-blocked by failed checkpoints; completion can continue in supported mode.

## Reward and Progression for Narrative Continuity
### Core v1 rewards
- `Letter Card Reveal`: unlock after each solved checkpoint (independent or supported success).
- `Story Clue Meter`: chapter strip with `3/4/5` slots by age band (`3-4`, `4-5`, `5-7`).
- `Chapter Reveal Beat`: short story payoff (`<=6s`) when clue meter fills.

### Progression principles
- Reward on completed learning action, not on speed.
- `Supported success` still advances story, but mastery analytics are flagged separately from independent success.
- Optional challenge nodes are available only for `5-7` and never required for core narrative completion.
- Micro-variation allowed in celebration visuals/audio; core interaction model stays stable.

## Anti-Friction Rules (Instruction + Flow)
- One instruction, one action target. No multi-step spoken command in one prompt.
- Keep scene entry-to-first-action time under `5s`.
- Keep any non-interactive cinematic segment under `6s`.
- If child fails twice, system shows the correct path and immediately gives retry opportunity.
- Repeated retries preserve story context and do not force full-scene restart.
- Never combine new letter introduction with new gesture type in same scene.

## FED Integration Notes (DUB-762)
### State machine contract
- Recommended state flow:
  - `story_intro`
  - `prompt_active`
  - `child_action`
  - `feedback_success | feedback_support`
  - `reward_beat`
  - `story_resume`
  - `scene_complete`
- Use `xstate` guards for adaptation triggers (`missCount`, `inactivityMs`, `rapidTapCount`).

### First shippable scope
- Implement one shared scene component with data-driven scene config:
  - `targetLetter`
  - `actionType` (`tap-select` or `drag-place`)
  - `choiceCountByAge`
  - `hintSequence`
  - `rewardSlotId`
- Keep parallax/page-turn effects optional and lightweight; never block input readiness.
- Use React + `framer-motion` for core interactions; no canvas dependency required for v1.

### QA/analytics hooks
- Emit telemetry per scene:
  - `scene_started`
  - `instruction_replayed`
  - `hint_used_step_{1|2|3}`
  - `scene_solved_independent`
  - `scene_solved_supported`
  - `rapid_tap_guard_triggered`
- Required QA checks:
  - No explicit `check/submit/test` controls in gameplay loop
  - all icon controls remain `44px+`
  - feedback fires on action without extra confirmation step

## Feedback Design
- Correct action:
  - Immediate visual confirmation (`250-500ms`) + short success audio.
  - Clue meter increments and mascot reaction fires (`<=900ms` total celebration).
- Incorrect action:
  - Gentle corrective cue (no negative buzzer), target highlight, and quick retry.
  - If miss threshold reached, show correct model and grant supported success.
- Hint ladder (`💡`):
  1. Replay prompt + isolate target zone.
  2. Contrast cue (show one distinguishing feature).
  3. Modeled solve + immediate child follow-up tap.
- Feedback must always preserve momentum into next story beat; avoid long modal interruptions.

## Audio Requirements
- Every child-facing line and icon action needs i18n key + Hebrew audio file.
- Required key families:
  - `games.letterStoryV2.instructions.<sceneKey>.*`
  - `games.letterStoryV2.controls.{replay,retry,hint,next}`
  - `games.letterStoryV2.hints.<sceneKey>.{step1,step2,step3}`
  - `games.letterStoryV2.feedback.{success,supported,retry}`
  - `games.letterStoryV2.rewards.{cardReveal,clueMeter,chapterReveal}`
  - `feedback.encouragement.*`
- Per-scene minimum audio contract:
  - `1` story beat line
  - `1` active instruction line
  - `1` success or supported-success line
  - `1+` hint/retry lines (as needed)
- Audio clips should generally remain short (`0.6-1.6s` for prompts) to preserve turn-taking pace.

## Open Coordination Dependencies
- Reading PM lane ([DUB-757](/DUB/issues/DUB-757)): final scene-to-letter progression map and transfer checkpoint placement.
- UX lane ([DUB-760](/DUB/issues/DUB-760)): final control-zone layout and transition motion limits.
- Content lane ([DUB-758](/DUB/issues/DUB-758)): Hebrew prompt scripts matching short-instruction limits by age band.
