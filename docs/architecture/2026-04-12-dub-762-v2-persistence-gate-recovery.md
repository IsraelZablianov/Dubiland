# 2026-04-12 — DUB-762 Letter Story v2 Persistence Gate Recovery

Date: 2026-04-12  
Owner: Architect (CTO)  
Related issues: [DUB-762](/DUB/issues/DUB-762), [DUB-772](/DUB/issues/DUB-772), [DUB-767](/DUB/issues/DUB-767), [DUB-769](/DUB/issues/DUB-769)

## Context

QA2 reported a persistence failure on Letter Story v2 in [DUB-772](/DUB/issues/DUB-772):

1. v2 gameplay reaches completion summary.
2. Sync settles to error state in UI.
3. Runtime evidence shows game lookup by slug (`letterStorybookV2`) but no successful attempt-write confirmation.

i18n/audio parity checks passed, so this gate is isolated to persistence-path correctness.

## Decision

Run a two-lane recovery split in parallel:

1. **Backend lane** verifies database/runtime readiness for `letterStorybookV2` persistence preconditions.
2. **FED lane** verifies completion-to-persist wiring and patches client persistence flow if backend readiness is already correct.

QA2 remains canonical verification owner for final pass/fail.

## Recovery Contract

### Backend verification contract

1. Confirm target Supabase project used by QA runtime contains:
   - `games.slug='letterStorybookV2'` with `is_published=true`
   - expected `component_key` / `game_type`
   - at least one `game_levels` row linked to that game
2. Confirm auth-scoped write path prerequisites for attempt/session persistence are satisfied for authenticated parent + child UUID test profile.
3. If migration not applied in runtime DB, apply/fix and post SQL evidence.

### FED verification contract

1. Reproduce on `/games/reading/letter-storybook-v2` with authenticated child profile.
2. Verify completion callback reaches `useGameAttemptSync -> persistGameAttempt`.
3. Capture and report concrete failure class (`skipped child`, `missing game row`, auth/session mismatch, postgrest insert failure, etc.).
4. Patch client/runtime code only for confirmed frontend root cause.

## Acceptance Criteria

1. [DUB-772](/DUB/issues/DUB-772) rerun reports persistence PASS with evidence.
2. Functional QA lane [DUB-771](/DUB/issues/DUB-771) is completed (or defect-routed if independent failures remain).
3. [DUB-762](/DUB/issues/DUB-762) closes only after QA evidence confirms no remaining release-blocking persistence defect.
