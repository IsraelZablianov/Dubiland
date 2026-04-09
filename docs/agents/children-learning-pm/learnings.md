# Children Learning PM — Learnings

Accumulated knowledge specific to the Children Learning PM role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-10 — Blocked Engineering Lanes Need Scope Patches, Not Replacement Tickets
When QA blocks execution lanes for incomplete acceptance criteria, the fastest PM action is to patch the existing child issue descriptions with line-level requirements and reopen them to `todo`. Reusing active lanes keeps ownership/history intact and prevents duplicate ticket sprawl.

## 2026-04-10 — Duplicate Parent Tasks Should Reuse Existing Child Lanes
When two parent issues carry the same delegation brief, check existing `parentId` child tickets before creating new ones. Reusing the active child lane set (and closing the duplicate parent with linked references) prevents engineer overload and conflicting ownership.

## 2026-04-10 — Icon Semantics Must Be Explicit in Specs, Not Implied
Even when specs already required audio replay, implementation risk remained high until icon semantics were written as a mandatory baseline (`▶` replay, `↻` retry, `💡` hint) with action-triggered validation and explicit ban on separate check/test buttons. Writing this baseline section directly into every spec and template reduces UX drift for pre-readers.

## 2026-04-10 — Feature Status Should Be Synced to Issue Outcomes, Not Spec Milestones
`features.md` can drift when parent implementation issues close but rows stay "In Progress." A quick heartbeat check against current issue statuses (parent + QA lanes) is enough to promote finished games to "Shipped" and keep curriculum coverage accurate for planning decisions.

## 2026-04-10 — Child-Lane Delegation Prevents Stalls During Checkout Conflicts
When parent spec issues cannot be checked out due `409` execution conflicts, work can still move by creating clearly scoped child lanes (FED, Gaming, Content) and reassigning parent ownership to the delivery engineer. This keeps implementation momentum without violating "never retry 409" policy.

## 2026-04-09 — Numeracy Sequence Must Track Cognitive Development
For ages 3-7, game sequencing works best as concrete counting -> quantity comparison -> number-line addition. This keeps mechanics aligned with how symbolic reasoning emerges, instead of jumping too early to abstract arithmetic.

## 2026-04-09 — Audio Completeness Is a Product Requirement, Not a Nice-to-Have
Specs are stronger when audio coverage is defined at key-family level (`instructions`, `hints`, `success`, concept pronunciation). This prevents implementation drift where text is i18n-ready but narration is partial.

## 2026-04-09 — Variation Should Change Theme, Not Learning Objective
Benchmark pattern across Lingokids and Khan Academy Kids: replay engagement improves when visuals/theme rotate while the cognitive task remains stable. This is the safest way to add repetition without turning sessions into drill fatigue.

## 2026-04-09 — Trace Mechanics Need Scaffold Fade, Not Binary Success/Fail
For ages 3-5, tracing should move from thick guided paths to lighter support gradually. A hard pass/fail on path precision causes frustration quickly; progressive hint escalation keeps confidence and still produces measurable skill growth.

## 2026-04-09 — Phonological Work Must Start Audio-First, Not Visual-First
For pre-readers, letter-sound matching performs better when rounds start from sound cues and only then present letter choices. Starting from visual letters over-indexes on shape recognition and weakens listening discrimination.

## 2026-04-09 — Reading Builders Need Progressive Decoding Support
For ages 5-7, word-building should start with high-frequency short words and fade supports gradually (prefill, reduced distractors, segmented replay). Immediate jump to independent spelling produces avoidable frustration and weakens session completion.

## 2026-04-09 — Specs Need Explicit Implementation Handoff or They Stall
Spec quality alone does not move product delivery. Each finalized spec must create a concrete implementation issue with a named owner, then update feature status to avoid duplicate or missing handoffs.

## 2026-04-10 — Classification Games Work Best With Distractor Control
For shapes/colors, progression quality depends on controlled distractor introduction (first none, then one variable, then mixed variables). Jumping to multi-variable distractors too early creates false failure unrelated to the core concept.
