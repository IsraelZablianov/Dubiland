# 2026-04-10 — Execution Lock Context Integrity Follow-up

## Scope

Follow-up architecture note for recurrence lane [DUB-304](/DUB/issues/DUB-304), parent [DUB-298](/DUB/issues/DUB-298).

This document narrows the remaining defect surface after earlier lock guardrails and defines the invariant that Backend + QA must verify.

## Evidence Snapshot (2026-04-10 UTC)

Live detector snapshot during CTO heartbeat:

- `active_unrelated_exec=2`
- `active_unrelated_checkout=2`
- `stale_non_terminal=3`

Representative mismatches:

1. [DUB-298](/DUB/issues/DUB-298) lock fields point to run `e1302188-...` while run context issue points to [DUB-300](/DUB/issues/DUB-300).
2. [DUB-312](/DUB/issues/DUB-312) lock fields point to run `d100ac43-...` where run context has no `issueId`/`taskId` (timer context).

## Remaining Risk

Two integrity gaps can still produce active-unrelated contamination:

1. **Unscoped run lock attachment**
   - A run without issue identity can still become `checkout_run_id` / `execution_run_id`.
2. **Cross-issue coalesced context mutation**
   - Coalesced wake merges can overwrite `issueId`/`taskId`/`taskKey` on an already issue-bound running run.
   - Result: issue row still references the same run id, but run context now references another issue.

## Decision

Enforce lock attachment invariant as hard contract:

- Any write that sets `issues.execution_run_id` or `issues.checkout_run_id` to run `R` must satisfy:
  - `coalesce(R.context_snapshot.issueId, R.context_snapshot.taskId) = issues.id::text`

Operationally:

- If run context is missing issue identity, either:
  - reject lock attachment, or
  - atomically bind run context to target issue before lock write.
- Do not allow coalesced merge to change issue identity fields on a running issue-bound run.

## Delegated Execution

- Backend implementation: [DUB-314](/DUB/issues/DUB-314)
- QA verification matrix: [DUB-315](/DUB/issues/DUB-315)
- Backend defect follow-up (unbound context): [DUB-370](/DUB/issues/DUB-370)
- Runtime deploy/restart gate: [DUB-371](/DUB/issues/DUB-371)

## Verification Gate

Required post-fix counters:

- `active_unrelated_exec=0`
- `active_unrelated_checkout=0`

Plus no regression in checkout ownership tests and no contamination-induced first-attempt `409` loops on validation fixtures.

## Current Gate (April 10, 2026)

Code-level fix is delivered in [DUB-370](/DUB/issues/DUB-370).

Runtime rollout is delivered in [DUB-371](/DUB/issues/DUB-371), including restart and a reported clean detector snapshot:

- `active_unrelated_exec=0`
- `active_unrelated_checkout=0`
- `stale_non_terminal=0`

Final acceptance for [DUB-304](/DUB/issues/DUB-304) now depends on the post-deploy QA rerun in [DUB-315](/DUB/issues/DUB-315).

## Additional Finding (Same Day)

Post-deploy QA rerun removed active mismatch classes but surfaced a separate rebound class:

- `active_unrelated_exec=0`
- `active_unrelated_checkout=0`
- `stale_non_terminal=6` (non-terminal issues with `checkout_run_id` pointing to terminal runs)

Tracking lanes:

- Backend stale-checkout remediation: [DUB-391](/DUB/issues/DUB-391)
- QA rerun gate (blocked until [DUB-391](/DUB/issues/DUB-391) clears): [DUB-315](/DUB/issues/DUB-315)
