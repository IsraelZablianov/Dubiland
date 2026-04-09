# PM — Learnings

Accumulated knowledge specific to the PM role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Route through department heads, not ICs
When execution tasks are already split directly to IC agents, CEO-level recovery should reintroduce managerial ownership with a dedicated CTO coordination issue and explicit dependency tracking. This prevents stale blocked tasks from drifting and keeps accountability aligned with org structure.

## 2026-04-09 — Hire dependencies must be surfaced as delivery gates
If routing rules require a manager role that does not exist (CMO for content), submit the hire immediately and link the approval as a delivery dependency in parent and child issue comments.

## 2026-04-09 — Convert approved hires into active delegated work immediately
After a manager hire is approved, create a child issue in `todo` (not `backlog`) that transfers department ownership right away. This avoids lingering direct-to-IC routing and keeps CEO execution limited to coordination.

## 2026-04-09 — Keep blocker ownership at the department that can resolve it
When content work is blocked by runtime/tooling (`edge-tts` in this case), escalation should stay with CTO recovery stream rather than re-routing back to content. CEO should enforce ETA + explicit unblock path on the CTO ticket and keep parent-level decision gates updated.

## 2026-04-09 — Reopen stale blocked manager tasks once dependencies clear
When a delegated manager task remains `blocked` after its dependency is resolved, reopen it to `todo` and request explicit close-or-ETA in the same heartbeat. This keeps parent status accurate and prevents hidden stale blockers.

## 2026-04-09 — Use explicit checkout handshakes for ambiguous execution-lock states
If a critical-path ticket is `todo` but comments show stale execution metadata risk, ask CTO for a named checkout handshake result (success vs exact conflict + owner) instead of waiting passively. This keeps responsibility unambiguous and shortens unblock loops.

## 2026-04-09 — Close coordinator tickets once their path is no longer critical
If a recovery/coordinator issue stays blocked due stale metadata but its intended outcomes are already delivered, close it with a clear completion summary and move leadership focus to the new bottleneck.

## 2026-04-09 — Update PM docs at every phase-gate transition
When ownership or lifecycle state changes materially (e.g., implementation -> QA), immediately update `docs/pm/changelog.md` and `docs/pm/features.md` so board-visible product tracking stays current.

## 2026-04-09 — Replace self-locked coordinator tickets with fresh executable lanes
When a coordinator issue is blocked by its own stale `executionRunId` and checkout conflicts, create a fresh delegated replacement issue, then close the stuck coordinator as superseded to prevent inbox deadlock.

## 2026-04-09 — Sync stale child states to delivered reality quickly
If implementation already landed via delegated child work, close outdated blocked tickets and reopen the next acceptance lane immediately; this prevents false blockers from hiding the true gate.

## 2026-04-09 — Escalate repeating lock-conflict patterns to reliability ownership
If a fresh replacement ticket reproduces the same stale `executionRunId` checkout failure, escalate immediately to Ops Watchdog with a platform-cleanup task instead of creating another CTO retry loop.

## 2026-04-09 — Close parent rollout tasks once acceptance is explicit
When CMO/owner posts a clear PASS with only non-blocking follow-ups, close the parent delivery issue immediately and move any residual work to tracked follow-up tickets to reduce coordination drag.

## 2026-04-09 — Mention wakes without ownership transfer should stay in manager lane
If CEO is @-mentioned on an execution issue but not asked to take ownership, respond in-thread with escalation guardrails, then update the assigned parent task with delegation status. This keeps coordination visible without collapsing back into IC execution.

## 2026-04-09 — Route SEO operations through CMO even for infrastructure-adjacent setup
Tasks like GA4/Search Console ownership can look technical, but they are growth-ops execution and should be delegated to CMO first (with SEO Expert execution underneath) while PM keeps parent-level acceptance tracking.

## 2026-04-09 — Release does not clear `executionRunId`; lock recovery needs explicit CTO ownership
On tasks with stale `executionRunId`, `POST /release` may unassign and clear checkout while leaving execution lock metadata intact, which still blocks checkout with `409`. CEO should quickly delegate lock normalization as a dedicated CTO task and avoid repeated mutation attempts on locked parents.

## 2026-04-10 — Use checked-out parent lanes to recover from child checkout conflicts
When a PM child task cannot be checked out (`409`), do not loop retries on that child. Instead, checkout an active parent lane that is available and create fresh CTO recovery tasks there with explicit links back to the conflicted child tasks, so execution can continue immediately.

## 2026-04-10 — New game kickoff should split immediately by department
When Children Learning PM hands off a game spec to CEO, create same-heartbeat child tasks for Gaming Expert, CTO delivery, and Content Writer under the parent issue. Keeping the parent in `in_progress` as a coordination umbrella preserves visibility while preventing CEO drift into implementation work.

## 2026-04-10 — Only assignees can use issue release, so non-assignee lock drift must be delegated
If a run attaches stale `executionRunId` metadata to an issue not assigned to CEO, `POST /api/issues/:id/release` fails with `Only assignee can release issue`. Do not loop mutation attempts; delegate lock normalization to CTO/Ops and document the dependency on the checked-out parent issue.

## 2026-04-10 — Treat same-agent run-ownership conflicts as hard stops on issue mutation
If an in-progress PM issue returns run-ownership conflict (different `checkoutRunId` on the same assignee), do not retry comments/patches on that issue in the same heartbeat. Post coordination updates on executable child issues and continue delegation from a checkoutable lane.

## 2026-04-10 — Validate wake-task ownership from heartbeat context before acting
`PAPERCLIP_TASK_ID` can wake PM on an issue that has already been reassigned by the time the heartbeat starts. Confirm current assignee in `heartbeat-context` first, and only prioritize the wake task if PM still owns it.

## 2026-04-10 — `executionRunId` conflicts with null checkout are still non-retriable
An issue can return checkout conflict with `checkoutRunId=null` but a populated `executionRunId` from another queued run. Treat this exactly like any other `409`: do not retry, move to a different task, and document the conflict in PM tracking artifacts.

## 2026-04-10 — Lock-conflicted parent tasks can still move via delegated child lanes
If PM cannot checkout a newly assigned top-level task due stale `executionRunId`, continue progress from an executable checked-out parent issue and create role-specific child lanes under the locked parent (`CTO`, `UX`, `Gaming`) so teams can start independently while lock normalization is pending.

## 2026-04-10 — `release` can drop assignment/state on active parent coordination issues
`POST /api/issues/:id/release` on an active PM lane can flip the issue to `todo` and clear assignee ownership (`assigneeAgentId: null`) while leaving `executionRunId` metadata intact. Only use release when you intentionally want to relinquish ownership; otherwise keep the lane checked out and post a coordination comment.

## 2026-04-10 — Batch stale-lock conflicts should be escalated as one CTO normalization lane
When multiple PM-assigned blocked technical issues each return first-attempt `409` with distinct stale `executionRunId`s, do not attempt per-issue retries or piecemeal reassignment. Create one critical CTO recovery task enumerating all conflicted issues/run IDs, keep coordination updates on an executable parent lane, and use Co-Founder coverage for non-blocked sibling streams.

## 2026-04-10 — Close co-founder handoff loops immediately in the parent lane
When a delegated Co-Founder coordination task is completed quickly, post a same-heartbeat parent checkpoint with the new child-lane status matrix and explicit next gate for the remaining owner (CTO here). This keeps board-facing status accurate and prevents completed delegation lanes from lingering as implicit assumptions.

## 2026-04-10 — When PM inbox is saturated by stale technical blockers, normalize ownership in one pass
If PM accumulates many blocked technical tickets with stale lock noise, run one consolidated routing pass: create a fresh Ops cleanup lane, return canonical technical lanes to CTO as blocked dependencies, cancel duplicate/legacy lanes, and update the parent orchestration ticket in the same heartbeat.

## 2026-04-10 — Wake-task ownership can differ from inbox ownership and should not trigger takeover
When `PAPERCLIP_TASK_ID` points to a task assigned to Co-Founder but PM still has a separate active inbox task, treat the wake task as context only and continue on PM-owned lanes. This avoids accidental ownership overlap and keeps the shared-CEO load split intact.
