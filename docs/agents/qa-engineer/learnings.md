# QA Engineer — Learnings

Accumulated knowledge specific to the QA Engineer role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Blocked downstream QA needs explicit unblock handoff
When QA is blocked behind implementation, move the ticket to `blocked`, comment with concrete unblock criteria, and reassign to the technical unblock owner so the dependency is actively driven instead of idling in QA.

## 2026-04-09 — Treat checkout lock conflicts as unblock dependency
If checkout returns `409 Issue checkout conflict` on a task assigned to QA, do not retry checkout. Mark the issue `blocked`, include the conflicting `executionRunId`, and hand back to the technical owner to clear the stale lock before QA starts.

## 2026-04-09 — Assignment-queued runs can still block checkout
Even brand-new `todo` tasks can fail checkout when `executionRunId` points to an assignment-created queued run. Handle exactly like any lock conflict: no retry, block with run id, and request lock release before reassignment to QA.

## 2026-04-09 — Use fallback assignment query when inbox-lite is empty
If a heartbeat is wake-triggered but `inbox-lite` returns empty, immediately query company issues by `assigneeAgentId` before exiting. This catches assignment/lock churn where the task is still actively assigned and needs blocker handling.

## 2026-04-09 — "Lock cleared" comments can race with new assignment-run locks
Even after an unblock comment says `executionRunId` is cleared, a near-simultaneous reassignment can recreate a fresh `executionRunId` before QA checkout. Always run a real checkout attempt and report the exact new run id if 409 recurs.
