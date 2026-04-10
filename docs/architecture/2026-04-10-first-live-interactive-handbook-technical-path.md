# 2026-04-10 — First Live Interactive Handbook Technical Path (DUB-538)

- Owner: Architect (CTO)
- Source issue: [DUB-538](/DUB/issues/DUB-538)
- Parent issue: [DUB-432](/DUB/issues/DUB-432)
- Reuse context: [DUB-433](/DUB/issues/DUB-433), [DUB-454](/DUB/issues/DUB-454)
- Related completed inputs: [DUB-539](/DUB/issues/DUB-539), [DUB-540](/DUB/issues/DUB-540)
- Pending cross-team dependency: [DUB-541](/DUB/issues/DUB-541)

## Decision Summary

1. Ship `magicLetterMap` as the canonical first live handbook slug for this lane.
2. Keep the DB-first runtime path as canonical: `handbooks` + `handbook_pages` + `handbook_media_assets` feed `InteractiveHandbook` and `InteractiveHandbookGame`.
3. Preserve fallback rendering only as a guard for sparse payloads; do not add new hardcoded content paths.
4. Treat the first live ship as complete only when the handbook is usable end-to-end for age bands `3-4`, `5-6`, and `6-7` with working navigation and progress persistence.

## Data and Runtime Readiness Contract

1. `handbooks.slug = magicLetterMap` must be `is_published = true`.
2. `handbook_pages` must contain a complete ordered page set for `p01-p10` with valid `narration_key` and interaction payload shape.
3. `handbook_media_assets` must map deterministically to the media pack from [DUB-539](/DUB/issues/DUB-539) (`/images/handbooks/magic-letter-map/*`).
4. Runtime must resolve prompts/choices from runtime payload first, with fallback only when runtime blocks/interactions are missing.
5. Child progress writes remain optimistic with background sync to `child_handbook_progress`.

## Execution Split for DUB-538

1. Backend lane: verify DB readiness contract and patch any content/schema drift needed for stable runtime hydration.
2. FED lane: complete final runtime alignment for DB-driven pages + UX polish contract from [DUB-540](/DUB/issues/DUB-540) without introducing duplicate handbook implementations.
3. QA lane: execute final matrix on tablet + mobile, including RTL, age-band discoverability, page-turn behavior, completion path, and persistence.

## ETA Checkpoints (Absolute Dates)

1. First implementation checkpoint: **April 11, 2026**.
2. QA execution start gate: after FED + Backend handoff and [DUB-541](/DUB/issues/DUB-541) completion.
3. Go/no-go summary target: **April 12, 2026**.

## Done Gate

[DUB-538](/DUB/issues/DUB-538) can close only after:

1. Backend and FED child lanes are `done` with linked evidence.
2. [DUB-541](/DUB/issues/DUB-541) is `done` (text/audio parity).
3. QA child lane posts pass/fail matrix and confirms no P0/P1 blockers.
4. Parent thread [DUB-432](/DUB/issues/DUB-432) has a final owner/ETA + readiness summary.
