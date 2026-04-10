# Interactive Handbooks Mechanics (Hebrew: ספרונים אינטראקטיביים)

## Learning Objective
- Define a reusable interaction system for handbook pages that teaches numeracy and early literacy while keeping story flow intact.
- Keep interactions developmentally aligned for ages 3-7 with explicit age-band progression (`3-4`, `5-6`, `6-7`).
- Ensure mechanics are implementation-ready for PM, Architect, FED, Content Writer, and QA.
- Provide a direct interaction playbook for the first 3 production-priority handbooks (one per age band).

## Target Age Range
- Primary: 3-7
- Difficulty bands:
  - Easy: 3-4
  - Medium: 5-6
  - Hard: 6-7

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
  - Ages 5-6: max 1 interaction; occasional challenge page with 2 very short prompts.
  - Ages 6-7: max 2 interactions, but never two new concepts on the same page.

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
| Interaction type | Learning goal | Easy (3-4) | Medium (5-6) | Hard (6-7) | Adaptive simplification (after 2 failed attempts) | FED approach |
|---|---|---|---|---|---|---|
| Counting tap/select | 1:1 correspondence + number words | Count sets 1-3 with slow audio cadence; 2 choices max | Count sets 1-5; 3 choices | Count/add small sets to 10; mixed layouts | Reduce set size by 1, then enable sequential highlight counting | React + `framer-motion` |
| Color match | Visual discrimination + vocabulary | Match 3 core colors, one object at a time | Match 4-5 colors, mild distractors | Match color in context (story clue + object family) | Reduce options to 2 and add color swatch hint pulse | React + `framer-motion` |
| Equation entry | Concrete arithmetic mapping | Choose answer chip for sums within 3 (no free typing) | Choose chip for sums/take-away within 10 using object support | Enter result with numeral chips/keypad for sums within 20 and one-step story problem | Convert to concrete visual split-combine and reduce operands | React + controlled inputs |
| Letter identification | Sound-symbol mapping | Pick target letter from 2 high-distinction letters | Pick from 3 letters and read one pointed short word | Identify letter/sound with context clue and 4 choices plus one confusable foil | Drop to 2 options + anchor-word audio replay | React + `framer-motion` |
| Drag/drop mapping | Classification + motor planning | Drag one item to one obvious target | Drag 2-3 items with simple category cues | Drag to multiple bins with one rule variation + one near-transfer case | Switch to tap-to-place fallback and ghost target preview | `@use-gesture/react` + DOM/CSS |

## Interaction Mechanic Library by Age Band (10-Handbook Planning)
| Age band | Interaction portfolio per handbook | Core engagement hooks | Cognitive-load budget | Escalation cap per page |
|---|---|---|---|---|
| 3-4 | 2 counting taps, 1 color/shape selection, 1 simple search interaction, 0-1 drag moment with tap fallback | Predictable mascot cue + immediate sparkle feedback on each action | One-step prompts only, max 2 choices in new concepts | 1 new variable, max 1 required interaction |
| 5-6 | 1 counting/addition interaction, 1 letter/sound interaction, 1 drag-sort interaction, 1 path decision | Micro-collection reward every 2 successful pages + story consequence reveal | One new concept + one known concept per interactive page | 1 new variable, max 1 required + 1 optional interaction |
| 6-7 | 1 decoding interaction, 1 word/phrase building interaction, 1 math-in-story prompt, 1 sequencing/comprehension interaction | Competence framing ("you solved the clue"), varied celebration set with fixed timing | Two-step prompts allowed only when first step is familiar | 1 new variable, max 2 required interactions when both are short |

## Difficulty Curve
- Isolation of difficulty:
  - Easy -> Medium: add exactly one variable (more options OR more items OR mild distractors).
  - Medium -> Hard: add one variable again (speed, distractor similarity, or response format).
- Adaptive pacing:
  - If 2 failed attempts or 8 seconds inactivity: apply one simplification step only.
  - Simplification order: fewer choices -> stronger hint -> slower animation -> concrete visual scaffold.
  - Recovery: after 2 consecutive correct responses without hint, return one step toward baseline.
- Feedback-loop recommendations:
  - Every child action returns multimodal feedback within 300ms (visual + SFX + optional short voice cue).
  - Retry feedback must keep the same concept and only change one support variable.
  - End each interactive page with one predictable closure beat: success line -> sticker/story token -> resume.
- Session length target:
  - Interaction segments should be 10-35 seconds each.
  - Total active interaction time per 5-20 page handbook should fit 2-5 minute loops by age.
- Mastery progression thresholds:
  - Promote concept tier when child gets 4 of last 5 prompts correct with at most 1 hint.
  - Trigger remediation micro-loop when same error pattern appears 3 times in one session.
- Cross-book progression for 10-handbook lineup:
  - Book-to-book progression introduces exactly one new mechanic family while reusing at least two known mechanic families.
  - Harder book unlocks are gated by signal quality (`first_try_accuracy >= 70%` and `hint_rate <= 35%` over prior book), not just completion.
  - If quality gate is missed, next session serves the same book in "support mode" (reduced options + stronger hints) before advancing.

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

## First 3 Prioritized Handbooks — Page-Level Interaction Patterns
These are production-priority interaction patterns (one book per age band) for immediate implementation sequencing under the 10-handbook initiative.

### Book A (Ages 3-4) — `book-01-yael-and-the-rainbow-balloon`
| Page | Interaction pattern | Input type | Reward pattern | Correction pattern |
|---|---|---|---|---|
| 2 | Count 3 floating balloons to help יעל land safely | Tap-select number chip | Balloon pops + short cheer + balloon sticker | Replay count audio + highlight each balloon in order; reduce choices to 2 |
| 4 | Choose the red balloon among 3 colors | Tap choice | Color burst + mascot clap | Wrong color gently fades; red balloon pulses with hint cue |
| 6 | Match circle/triangle signs to the path | Tap-to-place (drag optional) | Path lights up + progress chime | Ghost outline appears; switch to tap-only placement |
| 8 | Find the animal friend hiding behind a cloud | Tap hotspot search | Character wave + story resumes immediately | Zoom pulse on relevant cloud zone, then guided reveal after third miss |

### Book B (Ages 5-6) — `book-02-dubi-and-the-lost-backpack`
Pattern source aligns with `docs/games/first-handbook-dubi-and-the-lost-backpack.md`.

| Page | Interaction pattern | Input type | Reward pattern | Correction pattern |
|---|---|---|---|---|
| 3 | `countFish`: count concrete fish and choose answer | Tap choice | Ripple sparkle + "כל הכבוד, ספרת נכון" | Sequential fish highlight + count cadence replay |
| 5 | `chooseLetter`: choose ד for "דובי" | Tap letter choice | Gate opens + mascot nod | Anchor-word cue ("ד... דובי"), options reduced to 2 |
| 6 | `solveMath`: solve 3 + 2 using apples | Tap answer chip | Apple basket fills + success chime | Split-combine scaffold appears; operands visually regrouped |
| 7 | `buildWord`: build "דג" in order | Drag or tap-to-place letters | Word glows + sticker unlock | First slot prefilled, then guided slot highlight |
| 8 | `choosePath`: select path with 3 stars | Tap path | Camera pan to chosen path + celebration cue | Star count overlay appears on each path before retry |

### Book C (Ages 6-7) — `book-03-ori-and-the-mystery-map`
| Page | Interaction pattern | Input type | Reward pattern | Correction pattern |
|---|---|---|---|---|
| 3 | Decode pointed clue word before opening map fragment | Tap-select decoded word | Map fragment revealed + confidence praise | Syllable segmentation hint + one foil removed |
| 5 | Sequence 3 story events in correct order | Drag reorder (tap fallback) | Timeline animates forward + badge token | Wrong placement snaps back with gentle wobble + positional hint |
| 7 | Solve one-step math word clue to pick route | Tap numeral choice | Route highlight + ambient music lift | Problem revoiced slower + concrete object overlay |
| 9 | Build a short phrase from word tiles | Drag/tap tile assembly | Phrase voiceover + collectible compass piece | First tile locked in place + hint on next valid tile |
| 11 | Literal comprehension: answer from sentence evidence | Tap sentence segment then answer chip | Evidence highlight + final key unlock | Force text re-read with highlighted clue before next attempt |

## Anti-Frustration Guardrails (Ages 3-7)
| Risk trigger | Guardrail behavior | Why this protects learning |
|---|---|---|
| 2 incorrect attempts on same prompt | Keep concept, reduce one variable only (fewer options or stronger cue) | Preserves learning target while lowering cognitive load |
| 8 seconds inactivity | Auto-replay prompt audio + pulse one focal target | Re-engages without introducing new instructions |
| 3 consecutive retries on same prompt | Guided success mode, then immediate return to normal flow | Avoids shame loops and prevents session abandonment |
| Rapid random tapping (`>=5` taps in `2s`) | Brief calming pause (`700ms`) + "let's do this together" modeled attempt | Interrupts guessing behavior and restores deliberate action |
| Repeated confusion on one pair (letters or quantities) | Deterministic 3-step remediation: contrast -> anchor cue -> transfer prompt | Stabilizes adaptation and yields cleaner mastery signal |
| Motor friction on drag actions | Auto-switch to tap-to-place after one failed drag path | Keeps focus on concept rather than motor precision |
| End-of-session fatigue signs (slower responses + higher hint use) | Offer short closure card and optional calm replay mode | Maintains positive emotional ending instead of forced completion |

## UX Interaction-Zone Constraints (Coordination with DUB-381)
- Keep primary child controls in safe zones with 12-16px spacing between tap targets.
- Avoid bottom-edge-only critical controls; reserve bottom edge for mascot and passive visuals.
- Disable page-turn hotspots during mandatory interactions to prevent accidental progression.
- Keep all interaction controls at least 44px and expose tap fallback for every drag mechanic.

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
| Mechanics baseline + matrix | Gaming Expert | 2026-04-10 | Initial interaction matrix for [DUB-329](/DUB/issues/DUB-329) |
| Mechanics expansion for 10-handbook rollout | Gaming Expert | 2026-04-10 | Age-band library, first-3 page patterns, anti-frustration guardrails ([DUB-380](/DUB/issues/DUB-380)) |
| Product approval + prioritization | PM | 2026-04-11 | Locked v1 interaction scope |
| Data model and schema hooks | Architect | 2026-04-11 | Handbook interaction schema notes |
| Story player + interaction engine implementation | FED Engineer | 2026-04-13 | Playable handbook interaction flow |
| i18n keys + Hebrew audio asset generation | Content Writer | 2026-04-13 | Prompt/hint/feedback audio set |
| RTL/touch/accessibility validation | QA Engineer | 2026-04-14 | QA signoff and defects list |

## Review Status
- Drafted by Gaming Expert on 2026-04-10 for [DUB-329](/DUB/issues/DUB-329).
- Expanded on 2026-04-10 for [DUB-380](/DUB/issues/DUB-380) to support 10-handbook production planning and first-3-book implementation patterns.
- Intended handoff target: parent feature thread [DUB-377](/DUB/issues/DUB-377).
