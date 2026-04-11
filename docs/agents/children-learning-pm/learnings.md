# Children Learning PM — Learnings

Accumulated knowledge specific to the Children Learning PM role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-11 — Done-Lane Wakeups Should Trigger Delegation Gate Recheck, Not New Tickets
When a completed PM lane wakes again, the safest action is to revalidate `features.md` delegation state and explicitly confirm de-dup alignment before creating any new implementation tasks. This preserves execution clarity and prevents accidental duplicate FED lanes for already-delegated specs.

## 2026-04-11 — Cross-Agent De-dup Works Best When PM Owns Curriculum Order and Gaming Owns Mechanics Tuning
Parallel recommendation lanes can overlap unless ownership boundaries are explicit. The reliable split is: Gaming Expert proposes mechanic-level upgrades, while Children PM locks age-band curriculum order and rollout waves, then points execution to already-delegated implementation lanes to prevent duplicate tickets.

## 2026-04-11 — Math Progression Quality Depends on Representation Bridges Between Skills
Adding depth for ages 5-7 works best when each new objective explicitly bridges from prior representation, not just higher numbers. The reliable sequence is compare -> compose/decompose -> add/subtract strategy -> routine/time transfer, with one new cognitive variable per level and explicit parent metrics for transition readiness.

## 2026-04-11 — Full Alphabet Storybooks Need Developmental Staging To Avoid Hidden Overload
A 22-letter storybook can look simple at feature level but become pedagogically noisy if it exposes confusable letters and sentence-length jumps too early. The reliable pattern is staged rollout (high-distinction letters first, confusable pairs later), plus explicit sentence complexity caps by age band and a strict "one new difficulty variable per page cluster" rule.

## 2026-04-10 — Catalog Coverage Can Look Full While Older-Age Mastery Is Still Shallow
A feature list can show broad curriculum labels (letters, numbers, reading), but a game-by-game objective audit revealed hard zero-coverage gaps for ages 5-7 (subtraction, place value, measurement/time, writing/encoding, inferential listening). PM quality checks need explicit age-band outcome targets (1 week/1 month) and a zero-game gap scan, not only category-level coverage tables.

## 2026-04-10 — Cross-PM Tracker Parity Must Be a Recurring Checkpoint
When Children PM and Reading PM trackers evolve separately, coverage can look inconsistent even when execution lanes exist. A recurring parity checkpoint (status + age-band impact sync) prevents false "gaps" and keeps curriculum planning decisions tied to real lane state.

## 2026-04-10 — Wave 2 Handbook Execution Works Best as Dual-Lane Delegation
For multi-book story programs, a single PM spec lane is not enough. The most reliable delivery pattern is parallel delegation: per-book FED implementation lanes plus cross-book support lanes (reading, mechanics, UX, content, media) under one parent issue. This reduces bottlenecks and keeps pedagogy, UX, and production quality aligned while engineers build.

## 2026-04-10 — Handbook Launch Should Start as One-Per-Age Pilot, Not Full Library Drop
For interactive storybooks ages 3-7, benchmark analysis supports launching one strong handbook per age band first (3-4, 5-6, 6-7), then expanding after telemetry confirms interaction density and hint cadence. Shipping all planned books at once increases pedagogy risk and makes it harder to tune age-fit pacing.

## 2026-04-10 — Storybook Features Need Explicit Session Boundaries to Protect Learning Quality
Interactive handbook concepts can easily drift into passive video consumption unless the spec defines mandatory interaction beats, mid-book stopping points, and non-autoplay exit behavior. Writing those boundaries directly into the product loop keeps sessions short, active, and measurable for ages 3-7.

## 2026-04-10 — Movement Mechanics Increase Phonics Engagement but Require Tight Distractor Ratios
Runner-style letter catching can improve engagement for ages 4-7, but learning quality drops fast if non-target density is too high too early. Keeping early rounds near 60/40 target-to-distractor and only increasing one variable at a time preserves both confidence and measurable phonics signal.

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
