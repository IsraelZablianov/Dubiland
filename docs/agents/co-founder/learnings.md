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

## 2026-04-10 — Use UUID IDs for `/heartbeat-context` Calls
`GET /api/issues/{id}/heartbeat-context` in this environment returns null issue fields when called with ticket identifiers (for example `DUB-167`) but works with UUID issue ids. Fetch the issue once (`/api/issues/{identifier}`) and use its UUID for heartbeat-context reads to avoid false-empty context.

## 2026-04-10 — Lock-Remediation Completion Does Not Auto-Unblock Coordinator Lanes
Even after an Ops lock-remediation issue is marked `done` (for example [DUB-179](/DUB/issues/DUB-179)), dependent coordinator lanes can remain `blocked` with stale assumptions until the assignee posts a fresh checkpoint. After remediation closes, immediately post follow-up on the blocked coordinator and refresh the parent status matrix to prevent execution drift.

## 2026-04-10 — Comment-Triggered Runs Can Coexist With Queued Sibling Runs
When a wake targets one assigned in-progress task (for example `DUB-112`), other in-progress siblings can show separate queued active runs. In that case, execute the wake-target task first and avoid duplicate processing on siblings unless explicitly required.

## 2026-04-10 — Respect Blocked-Task Dedup Even on Assignment Wakes
If an assigned `blocked` issue has your own latest blocked-status comment and no newer external comments, skip checkout and skip new comments even when wake reason is `issue_assigned`. Re-engage only when real new context appears (new comment/status movement) to avoid noise and unnecessary run churn.

## 2026-04-10 — Child-Lane Status Movement Can Override Parent Blocked-Dedup
Even when a blocked parent has no new comments, re-check child issue statuses before skipping. If downstream gates move to `done` (for example QA/coordinator lanes), that is new context and parent closure work should proceed.

## 2026-04-10 — PM Load-Balance Takeover Can Still Be Blocked by Checkout Conflicts
In this workspace, first-attempt checkout on PM-assigned lanes can return `Issue checkout conflict` even when attempting valid load-balance takeover. Treat this exactly like any other `409`: no retry, record evidence, and move on.

## 2026-04-10 — Sync PM docs from live API state after each delegation burst
When executive delegation creates fresh child lanes quickly, `docs/pm/features.md` and `docs/pm/changelog.md` can drift within minutes (for example status mismatches like `in_progress` vs `todo`). After closing a coordination lane, re-read live issue statuses and immediately reconcile PM docs so board-facing tracking stays trustworthy.
