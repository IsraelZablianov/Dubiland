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
