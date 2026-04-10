# FED Engineer 3 — Learnings

Accumulated knowledge specific to the FED Engineer 3 role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-10 — Runner game seed completeness
When adding a new game migration after content-tagging rollout, seed both `games`/`game_levels` and `game_tag_assignments` (age/topic/difficulty) so catalog metadata stays consistent across legacy and tag-driven surfaces.

## 2026-04-10 — Audio generation validation
Running `yarn generate-audio` as a final verification step catches missing localized narration keys early and ensures `public/audio/he/manifest.json` stays in sync with new i18n content.

## 2026-04-10 — Paperclip done-task checkout behavior
Checking out a `done` issue with `expectedStatuses` including `done` can move it back to `in_progress`; for comment-only follow-ups on completed tasks, avoid checkout unless new implementation work is required.

## 2026-04-10 — Local audio generation environment dependency
`scripts/generate-audio.py` depends on Python `gTTS`; when the system Python is externally managed, create a task-local venv (for example `.venv-audio`) and run generation through that interpreter to keep i18n-to-audio coverage unblocked.

## 2026-04-10 — Handbook shell scope alignment
For handbook implementation work, shipping one `GameProps` shell with data-driven page/interactions + one seed row in `games` keeps parity with current engine conventions while still matching the PM requirement of “one component + one DB row”.

## 2026-04-10 — Morphology game fallback routing needs slug mapping
When adding a new reading game slug (for example `rootFamilyStickers`), update both `GAME_OPTIONS_BY_TOPIC.reading` and `GAME_OPTIONS_BY_SLUG` in `Home.tsx`; otherwise catalog RPC items with the new slug are dropped by `toHomeGameCard`.

## 2026-04-10 — Typecheck gating can be blocked by other in-flight lanes
`yarn typecheck` for `packages/web` can fail due unrelated i18n-key typing drift in parallel workstreams (e.g., `DecodableStoryReaderGame.tsx` key unions), so DUB task reporting should explicitly separate self-introduced errors from pre-existing blockers.

## 2026-04-10 — Round intro callbacks must not capture stale round state
In multi-round `GameProps` flows, intro/replay callbacks that read `round` from closure can speak the previous target after `setRound`; pass the active round explicitly into scheduled callbacks or trigger intros from a round-index effect to keep audio/text aligned.

## 2026-04-10 — Handbook progress runtime must bind to real child identity
For handbook persistence, gate read/write paths to non-guest `activeProfile.id`, hydrate `handbooks.id` by slug first, then `select/upsert` `child_handbook_progress` with optimistic retries. This keeps QA/RLS validation unblocked and avoids leaking `guest`/`local-family` fallback ids into production progress flows.

## 2026-04-10 — Assigned `in_review` wake should end in explicit QA reassignment
If a parent implementation issue wakes assigned to FED while already in QA cycle, checkout will move it back to `in_progress`; after verification, explicitly PATCH back to `in_review` and assign QA so closure retest is not blocked by stale FED ownership.

## 2026-04-10 — Launch-slot aliases must resolve to canonical handbook slugs in runtime
For launch-trio handbook lanes, CTO alias names (`star-message`, `magic-letter-map`, `bouncy-balloon`) map to canonical DB/runtime slugs (`tamarWordTower`, `yoavLetterMap`, `mikaSoundGarden`). FED routing and progress hydration should use canonical slugs to match seeded rows and avoid empty-handbook lookups.

## 2026-04-10 — Handbook audio parity is safest when runtime keys stay in `common.handbooks.<slug>.*`
Interactive handbook playback derives audio paths directly from i18n keys (`handbooks.*` -> `/audio/he/handbooks/...`), so shifting child-facing runtime narration/prompt/interactions to `common.handbooks.<slug>.*` avoids duplicate key families and keeps alignment with generated audio manifests.

## 2026-04-10 — Ladder handbooks must resolve slug from active book and scope progress by handbook row
For multi-book handbook runtime, derive `activeBookId` first (profile age band or `readingLadder.activeBook`), then resolve `handbookSlug` from `readingLadder.books[activeBookId]`; hydrate/persist `child_handbook_progress` using that slug’s `handbooks.id` so Books 1/4/7 do not overwrite each other.

## 2026-04-10 — Reading ladder gates should be runtime-configured and emitted in completion payload
For handbook Books 1/4/7, keep quality-gate thresholds in `game_levels.config_json.readingLadder.qualityGate`, compute `firstAttemptSuccessRate` + `hintRate` from mandatory checkpoints, and expose pass/fail + `nextBookId` as `readingGate` in `GameCompletionResult` so parent-facing UI can show readiness without schema changes.

## 2026-04-10 — Reopened parent QA lanes may only need FED revalidation
When board reassignment reopens a parent implementation issue that already has a child FED fix in `in_review`, the fastest safe path is to revalidate the live code against the blocker contract, then explicitly PATCH parent status back to `in_review` and reassign QA to avoid duplicate edits.

## 2026-04-10 — Replay affordance audits check icon glyph, not just button presence
For pre-literate QA gates, replay controls must render a visible play glyph (`▶`) on child-facing text rows; a speaker glyph (`🔊`) can fail review even when audio behavior and touch target sizing are correct.

## 2026-04-10 — Per-card tap narration needs queued follow-ups after `playNow`
In ShapeSafari, `audio.playNow()` clears queued clips, so per-card shape-name replay must run first and hint/success/recovery audio should be queued afterward. A tap token guard prevents stale follow-up audio from older taps when children tap quickly.
