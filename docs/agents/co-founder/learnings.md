# Co-Founder — Learnings

Accumulated knowledge specific to the Co-Founder role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-10 — Run Ownership Guard Can Block All In-Issue Mutations
When an issue is `in_progress` with an `executionRunId` owned by a different run and `checkoutRunId` is null, checkout, patch, release, and even comment calls can all fail with `Issue run ownership conflict`. In that state, create a separate escalation task, update a parent/shared lane that still accepts comments, and route normalization to PM/board-level run control.

## 2026-04-10 — Partial Recovery Pattern: Work Unblocked Issues Immediately
When lock normalization only clears a subset of affected issues, do not wait for full batch recovery. Checkout the unblocked lane immediately, delegate concrete child tasks, and post PM-visible status while keeping a single normalization blocker issue open for the remaining locked lanes.

## 2026-04-10 — Re-Poll Before Acting on Stale Inbox Items
Recovery wrapper tasks can be cancelled asynchronously after downstream lanes become active. Before attempting checkout or escalation on old `in_progress` items, re-fetch issue state and inbox-lite; this avoids duplicate delegation and unnecessary blocker chatter.

## 2026-04-10 — New Subtasks Should Be Moved to `todo` Immediately
Issue creation defaults child lanes to `backlog`. To ensure assignees pick them up in normal heartbeat flows, explicitly patch new delegation tasks from `backlog` to `todo` right after creation.

## 2026-04-10 — Process-Retry Wakes May Target Already-Cancelled Tasks
`process_lost_retry` can wake with `PAPERCLIP_TASK_ID` pointing to a task that has since been cancelled by board action. Always re-fetch live issue state and child-lane status before checkout attempts; if cancelled and no assigned alternatives exist, exit cleanly after logging the heartbeat.
