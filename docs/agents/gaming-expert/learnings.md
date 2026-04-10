# Gaming Expert — Learnings

Accumulated knowledge specific to the Gaming Expert role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Empty Inbox Heartbeat Discipline
When no issue is assigned (`inbox-lite` and fallback assignee query both empty) and no wake-comment handoff exists, exit the heartbeat without self-assigning unowned work. Log the run in daily memory for continuity.

## 2026-04-09 — Agent-Local PARA Path
Use `$AGENT_HOME/memory` and `$AGENT_HOME/life` for durable notes. In this repo, `$AGENT_HOME` resolves to `docs/agents/gaming-expert`, not the repository root.

## 2026-04-10 — Comparison Game Overload Pattern
For ages 5-6 quantity comparison games, avoid introducing `equal`, drag mechanics, and two-step prompts in the same level. Split these into micro-steps and keep one new variable per stage to reduce frustration and preserve learning signal.

## 2026-04-10 — Shape Recognition Loop Length and Input Mode
For ages 3-6 shape classification, target a 3-5 minute loop with tap-first interaction on easy levels and optional drag only after mastery signals. Keeping tap fallback active prevents motor-friction drop-off and improves learning reliability on tablets.

## 2026-04-10 — Color Progression Should Separate Hue Learning from Rule Learning
For ages 3-6 color games, teach hue recognition first (core colors), then sorting, then color+object rules. Do not introduce shade discrimination in the same stage as new rule logic; stacking both raises cognitive load and weakens instructional signal.

## 2026-04-10 — Tracing Games Need Quantified Mastery Gates
For ages 3-5 letter tracing, specs are implementation-ready only when each level defines numeric pass thresholds (for example path coverage, stroke-order score, retry limits) plus explicit assist/frustration triggers. This prevents ambiguous progression logic and keeps adaptive support consistent across FED, QA, and analytics.

## 2026-04-10 — Phoneme-Unique Letter Sets Should Come First
For ages 4-6 Hebrew sound-to-letter games, early rounds should use letters with mostly unique phoneme mapping. Same-sound grapheme families (for example ט/ת, ק/כ, א/ע, ס/שׂ) require word-context scaffolding and should not be scored as isolated-sound-only multiple-choice prompts.

## 2026-04-10 — Confusion Pairs Need a Fixed Recovery Sequence
When a child repeatedly confuses a specific letter pair, remediation should follow a deterministic 3-step loop (A/B isolated contrast -> anchor-word contrast -> transfer-check round) before normal progression resumes. This prevents adaptive oscillation and gives FED explicit state-machine transitions.

## 2026-04-10 — Number Line Strategy Progression Needs Micro-Stages
For ages 6-7 number-line addition, do not introduce missing-addend and two-addend chaining in the same step. Sequence as bridge-to-10 mastery -> missing-addend -> chaining, and gate progression with explicit thresholds (for example, 4/5 correct with <=1 hint) plus concept-specific remediation triggers.

## 2026-04-10 — Word Builder Should Separate Distractor Complexity from Word-Length Growth
For ages 5-7 drag-to-build reading games, avoid increasing word length and distractor confusability in the same progression step. Use a scaffold ladder with single-variable transitions and a fixed 3-step confusion-pair remediation loop to keep adaptation stable and implementation deterministic.

## 2026-04-10 — Letter Video Series Works Best with Stage-Based Letter Families
For ages 3-7 Hebrew letter videos, a staged rollout (phonological warm-up -> high-distinction letters -> confusable pairs -> final forms -> decoding bridge) is clearer than strict alphabetic order. Keeping each video to one new variable with fixed repetition cadence reduces cognitive overload and gives Content/Media teams stable script and animation templates.

## 2026-04-10 — Canonical Mechanics Template Prevents Spec Drift
When founder-level interaction rules apply across multiple games, create one shared `docs/games/game-design-guidelines.md` baseline and require each spec to include a concrete icon inventory table. This keeps icon semantics (`▶`, `↻`, `💡`, `→`) and action-triggered feedback rules consistent and reduces review churn between PM, FED, and QA.

## 2026-04-10 — Remove Ambiguous "Check" Wording from Specs
When enforcing "no check/submit/test buttons," avoid using "check" phrasing in remediation copy (for example "let's check together" or "transfer-check round"). Use alternatives like "count together" or "near-transfer round" so PM/FED/QA read the rule unambiguously.

## 2026-04-10 — Tagging Taxonomy Should Use Primary Age + Adjacent Support Bands
For content tagging across ages 3-7, require exactly one primary age band and allow only adjacent support bands. Pair this with one primary skill tag and a shared `difficulty.1-5` semantic ladder so filtering stays predictable and avoids overbroad "fits everyone" labeling.

## 2026-04-10 — Runner Letter Games Need Accuracy-Gated Rewards + Fixed Confusion Sequencing
For catch/avoid reading games, pure catch-count rewards can incentivize random tapping. Keep no-punishment feedback, but gate cosmetic rewards on precision thresholds and cap one confusion-pair family per block with deterministic 3-step remediation triggers so FED/QA can implement and verify state transitions consistently.

## 2026-04-10 — Storybook Interactions Require a Hard Pause/Resume Contract
For interactive handbook pages, learning quality and narrative continuity improve when every inline challenge uses an explicit state sequence (`story_playing -> interaction_prompt -> feedback -> story_resume`) with checkpoint resume, action-triggered validation, and one-step adaptive simplification after two failures. Writing this as a reusable matrix (mechanic x age band x adaptation) made PM/FED handoff concrete and testable.

## 2026-04-10 — Root-Family Decoding Specs Need Decoy Caps + Anti-Guess Gates
For ages 6-7 morphology-light reading games, sorting quality improves when decoy density is explicitly capped in the core path (about 1 decoy per 6-7 cards), while higher decoy density is restricted to mastery extension only. Rewarding stickers only on strategy-quality rounds (first-try accuracy + low hint use) and adding a rapid-tap "pause + model" recovery gate prevents random-drag success loops and keeps the learning signal tied to decoding behavior.

## 2026-04-10 — Decodable Stories Need Decode-First Quotas + Text-Lock Gates
For ages 5.5-7 decodable story flows, image support is useful only when checkpoints enforce decode-first behavior with measurable rules (text interaction before image tap, delayed image reveal, and a decode-first checkpoint quota per story). Pairing these with explicit mastery gates based on first-attempt decoding accuracy prevents hint-assisted progression and keeps story engagement from diluting phonics rigor.

## 2026-04-10 — Sight-Word Fluency Should Separate Orthography Fade from Speed Pressure
For ages 5.5-7 sight-word games, avoid introducing partial nikud fade and soft-timer pressure in the same progression step. Sequence as fade-first mastery, then optional timer cue unlock, and pair with decoy caps plus rapid-tap recovery gates so fluency rewards remain accuracy-driven instead of guess-driven.

## 2026-04-10 — First-Three Handbook Matrices Make Cross-Team Handoffs Executable
For multi-book handbook initiatives, translating each priority book into page-level interaction rows (`input type`, `reward pattern`, `correction pattern`) removes ambiguity between PM, FED, UX, and Content lanes. This format also exposes anti-frustration trigger points early (inactivity, rapid taps, repeated confusion) so adaptive logic can be implemented as deterministic state transitions instead of ad-hoc UI behavior.

## 2026-04-10 — Confusable Letter Contrast Needs Final-Form Deferral + Rapid-Tap Guard
For ages 5.5-6.5 confusable-letter games, keep early progression on non-final-form pairs and move final-form contrasts into dedicated later levels. Pair this with an explicit rapid-tap recovery gate (short input pause + modeled replay) so random tapping cannot accidentally simulate mastery.

## 2026-04-10 — Wave Specs Need Explicit Support-Mode Ladders per Book
For multi-book reading handbooks, a generic "gentle retry" note is not enough for implementation quality. Each spec should include a deterministic support trigger (attempt/inactivity threshold), fixed simplification order, and clear exit condition so FED can encode state transitions consistently and QA can verify anti-frustration behavior across books.

## 2026-04-10 — Handbook Engagement Improves with Tap-Level Feedback + Page-Turn Anticipation
For interactive storybook flows, kids stay motivated when every tap gets immediate micro-feedback (short motion + SFX) and solved interactions trigger a brief pre-turn reward beat near the next-page control. Keeping the core mechanic stable while rotating praise variants adds novelty without adding cognitive load.

## 2026-04-10 — Exposure-Only Age Bands Must Not Share Mastery Completion Gates
When a spec labels an age band as listen/explore exposure (for example `3-4`), completion logic cannot still require decoding mastery checkpoints for that same band. The contract must separate exposure completion from mastery completion, or telemetry and progression gating become misleading.

## 2026-04-10 — Engagement Reviews Need a Clear Blocker vs Polish Split
For launch-critical handbook reviews, comments should separate immediate retention blockers (tap responsiveness, page-turn motivation beats, age-band gate mismatches) from non-blocking polish (celebration variety, cadence tuning). This keeps FED execution focused under deadline pressure.

## 2026-04-10 — Static Page-Level `levelNumber` Defaults Flatten Age Scaling
When page wrappers hardcode `levelNumber: 1`, even well-designed adaptive game engines under-deliver for ages 5-7 because sessions spend most time in entry-level pathways. For age-sensitive experiences, route level/config by profile age band plus mastery history at page-entry time, then let in-session adaptation refine within band instead of starting every child from the same baseline.

## 2026-04-10 — Story-Depth Specs Must Align Slug Routing + Text-Action Gates
For handbook narrative overhauls, mechanics reviews should always cross-check the spec’s target slug against live ladder routing (for example `yoavLetterMap` vs `magicLetterMap`) before content work starts, or teams can ship polished copy to an inactive runtime path. Also, “no image-shortcut” claims are not implementation-ready unless specs define explicit choice-lock conditions (`requiresTextActionBeforeChoice`) and how hotspots/illustrations are prevented from satisfying scored checkpoints by themselves.

## 2026-04-10 — Cross-Lane Rubric Scoring Speeds Priority Decisions
When quality directives span multiple teams, a shared 0-2 mechanics rubric with lane-by-lane scores (ready/at-risk/blocker) turns broad feedback into routing decisions PM/CTO can execute immediately. Pairing the scorecard with a dated P0/P1 correction queue reduces ambiguity and avoids parallel “quality” work streams drifting in different directions.

## 2026-04-10 — Calibration-First Spec Corrections Reduce Rework
When a correction lane requires consistency edits across multiple specs, posting a pre-edit threshold matrix first (with promotion/regression gates) creates a shared baseline and avoids edit churn. Then each spec can be updated with explicit reviewed/calibrated status lines and rationale, making QA ownership and implementation thresholds unambiguous.

## 2026-04-10 — Reading Consistency Requires Age-Band Numeric Gates Across Specs
For reading specs that share one runtime, narrative clarity alone is insufficient. Add one cross-spec numeric gate set per age band (`checkpoint density`, `max decoys`, `rapid-tap triggers`, `transition locks`) so FED and QA can implement and verify identical behavior across decodable stories and handbooks.

## 2026-04-10 — Pointing Fade Must Be Decoupled from Comprehension Format Jumps
When moving from fully pointed to partially pointed text (ages 6-7), never introduce a new comprehension format in the same cluster. A capped fade step (for example `<=10` percentage points) plus a stability gate (`decode >=85%`) prevents compounding difficulty spikes.

## 2026-04-10 — Coordination Comments Should Publish a Single QA-Ready Matrix Link
For multi-lane mechanics work, post one canonical matrix comment and link it into implementation and QA issues. This prevents drift between runtime constants and test assertions and reduces duplicate interpretation across lanes.

## 2026-04-10 — Handbook Story-Depth Signoff Needs Page-Level Checkpoint Maps
For multi-chapter reading handbooks, mechanics signoff should require explicit scored page maps per book (with decode/literal/evidence ratios) plus age-band hint trigger thresholds. This converts broad narrative pacing notes into enforceable runtime contracts and makes anti-shortcut QA tests deterministic.

## 2026-04-10 — Cancelled Duplicate Wake Tasks Should Be Treated as No-Op After Assignment Check
When a wake task is assigned to Gaming Expert but already `cancelled` as a duplicate (with a canonical replacement issue linked in thread comments), do not attempt checkout. Confirm inbox/fallback assignment queries still show no active tasks, then exit heartbeat without self-assignment.
