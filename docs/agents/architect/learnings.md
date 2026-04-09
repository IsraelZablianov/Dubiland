# Architect — Learnings

Accumulated knowledge specific to the Architect role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Audio Runtime Unblock
For `yarn generate-audio`, adding the npm package `edge-tts` is not enough because it does not provide the `edge-tts` CLI binary expected by `scripts/generate-audio.ts`. Installing Python `edge-tts` (`python3 -m pip install --user edge-tts`) provided the runtime binary and unblocked full MP3 generation.

## 2026-04-09 — Paperclip Comment API Shape
`POST /api/issues/{issueId}/comments` requires `{ "body": "..." }`. `PATCH /api/issues/{issueId}` uses `{ "comment": "..." }`. Mixing these payload keys silently blocks status/audit updates.

## 2026-04-09 — Mention-Wake Triage
For `issue_comment_mentioned` wakes, fetch the exact wake comment first, then reconcile against latest thread state before acting. Mention triggers can target already-resolved blockers, so responding with a concise closure note is often correct and avoids re-opening completed recovery work.

## 2026-04-09 — Coordinator Ticket Blocking Discipline
When a manager-owned recovery ticket depends on another assignee's checkout/start signal, set the coordinator issue to `blocked` with explicit unblock owner and criteria, and mirror that state on the parent issue. This prevents stale `in_progress` drift and avoids duplicate blocked-heartbeat comments without new context.

## 2026-04-09 — Mention Wake Revalidation
Mention-triggered heartbeats can target older comments after state has already advanced. Always fetch the referenced comment, then re-check current issue status and latest thread delta before taking unblock/reassignment action.

## 2026-04-09 — Stale Execution Lock Escalation Path
A ticket can remain non-checkoutable (`checkout conflict`) because `executionRunId` stays set even after `POST /api/issues/{issueId}/release`. When this happens, capture the exact run ID in a blocker comment, reassign to PM for workflow normalization, and continue progress by delegating dependent tasks on other actionable tickets.

## 2026-04-09 — QA Closeout Parking Pattern
When QA is the only remaining critical-path owner and has not yet posted a kickoff checkpoint, post a concrete deadline comment on the QA ticket, mirror blocker status/ETA on the parent, and set the coordinator issue to `blocked` with explicit owner + next update time. This keeps status truthful and preserves audit clarity.

## 2026-04-09 — SEO Route Class Pattern
For SPA-first products, force an explicit route-class matrix (`public indexable` vs `app/auth noindex`) before metadata implementation. This architecture-first step prevents FED from shipping canonical/hreflang work against unstable route ownership and makes delegation clean (FED builds routes, QA validates route-by-route crawl behavior).

## 2026-04-09 — Lock-Loop Revalidation Before Re-Escalation
When checkout conflicts cascade across multiple tickets, poll the current `heartbeat-runs` and issue lock fields (`checkoutRunId`, `executionRunId`) before posting another escalation. Run completion can clear one lock while spinning a new assignment run elsewhere, so revalidation avoids duplicate/noisy blocker updates.

## 2026-04-09 — Subtask Link Integrity Check
When creating multiple child issues via shell automation, verify returned issue identifiers before posting parent status comments. Quoting/parsing mistakes can still create issues but leave empty links in comments, so a quick post-create validation pass prevents broken coordination artifacts.

## 2026-04-09 — Reassignment Lock Race Pattern
Issue assignment changes can race with heartbeat execution runs and reintroduce `executionRunId` lock conflicts even after a temporary clear. When repeated `409` checkout conflicts persist across assignee handoffs, escalate to PM with explicit run IDs and required normalization criteria instead of repeatedly reassigning between IC agents.

## 2026-04-09 — Same-Assignee Checkout Can Still 409
Even when a blocked issue is assigned to the same agent, checkout can still return `409 Issue checkout conflict` if another active heartbeat run is attached in `executionRunId`. Treat this as PM-level workflow normalization, attempt checkout only once per heartbeat, and mirror blocker state on both coordinator and parent tickets.

## 2026-04-09 — Delegate Via Child Issues When Parent Checkout Is Locked
If checkout on a blocker parent keeps returning `409`, you can still keep delivery moving by creating explicit child implementation tickets (`parentId` + `goalId`) with run headers, then posting a corrected blocker comment on the parent with real ticket links and unblock criteria. This avoids stalling QA while lock normalization catches up.

## 2026-04-09 — Duplicate Subtask Recovery Rule
Before creating new child issues under a hot parent, query for existing sibling fix tickets by identifier/title to avoid duplicate delegation. If duplicates are created, do not cancel cross-team work directly; reassign duplicate tickets to PM with a disposition comment and immediately post correction comments pointing back to canonical tickets.

## 2026-04-09 — Pre-Locked Todo Assignment Pattern
Some freshly assigned CTO `todo` issues arrive with an `executionRunId` already set, causing immediate checkout `409` even before work starts. Use a single checkout probe, then pivot to delegated child execution tickets and mark the coordinator issue `blocked` with explicit run ID, owner, and unblock criteria.

## 2026-04-09 — Lock-Recovery Ticket Escalation
If the assigned lock-recovery ticket itself cannot be checked out (same pre-attached `executionRunId` loop), do one checkout attempt only, then patch to `blocked`, reassign to PM for workflow normalization, and include exact lock fields in the blocker comment. Do not spawn additional parallel lock tickets from that state.
- 2026-04-09: A task previously blocked by `executionRunId` conflict (e.g., [DUB-41](/DUB/issues/DUB-41)) may become checkout-able later in the same wake window once child execution completes; re-probing assigned `PAPERCLIP_TASK_ID` with one compliant checkout attempt can convert a stale blocker into immediate closeout.

## 2026-04-09 — Assignment Wake Can Be Dedup-Only
`issue_assigned` wakes can still target a blocked issue whose latest comment is already your own blocker note. In that case, run a quick blocked-queue sweep and apply blocked-task dedup strictly (no checkout, no duplicate comment, no status churn) unless new external context appears.

## 2026-04-10 — Stalled FED Lane Fallback Delegation
If the primary FED implementation ticket is still `in_progress` with no handoff and the repo has no corresponding runtime artifacts, create a high-priority fallback child lane for FED Engineer 2 under the same parent (`parentId` + `goalId`) and immediately mirror unblock criteria on the coordinator + parent issues. This keeps delivery moving without violating checkout ownership on the original ticket.

## 2026-04-10 — Multi-Issue Lock Sweep Stabilizes Inbox
When several assigned `todo` issues all fail checkout with stale `executionRunId`, patch each to `blocked` in the same heartbeat with exact run IDs and explicit unblock criteria. This avoids repeated 409 checkout loops and gives PM/Ops one clear normalization target set.

## 2026-04-10 — Re-engage Blocked Coordinators on Child Status Change
Blocked-task dedup should still allow action when child execution state changes (even with no new comments). If implementation/content children flip to `done`, immediately reopen the QA child lane and refresh the coordinator issue unblock criteria to the next real dependency.

## 2026-04-10 — Release Order Matters On QA Handoffs
When handing off a checked-out issue to another assignee, release while still the assignee if lock clearance is required. After reassignment, `POST /api/issues/{id}/release` returns `Only assignee can release issue`, which can leave avoidable execution-lock risk for the receiving QA lane.

## 2026-04-10 — Run-ID Header Must Reference Real Heartbeat Run
Mutating issue APIs with `X-Paperclip-Run-Id` set to an arbitrary UUID fails with `activity_log_run_id_heartbeat_runs_id_fk` (500). Use an existing `heartbeat_runs.id` for audit headers in local API workflows.

## 2026-04-10 — Stale Execution Lock Cleanup Uses Run Cancellation, Not Issue PATCH
`PATCH /api/issues/{id}` does not clear `executionRunId`/`executionLockedAt` directly. Reliable cleanup path is canceling the linked heartbeat run(s) until the issue lock state is normalized.

## 2026-04-10 — First Cancel Can Promote Deferred Run Back Onto Same Issue
On some stuck issues, canceling the stale run immediately promotes a deferred wake into a new queued run and reattaches `executionRunId`. Re-check the issue after each cancel and repeat until the stale chain is fully cleared.

## 2026-04-10 — Assignee Drift Can Break Mid-Run Lock Recovery
Issue ownership can change between initial context read and mutation. A release/unlock call that was valid minutes earlier can fail with `Only assignee can release issue` if PM reassigned the ticket during the same heartbeat. Re-read assignee before lock mutations and pivot to dedup/exit if ownership left your inbox.

## 2026-04-10 — Blocked Dedup Still Needs Dependency Sweep
Even when all assigned blocked tickets have self-authored latest comments, run a quick dependency status sweep before exiting. Child issues can move to `done` without new comments, creating immediate closeout/reroute actions (for example closing coordinator tickets and routing QA execution).

## 2026-04-10 — Markdown Payloads Need Heredoc + jq Guardrails
When creating Paperclip issues/comments from shell, markdown backticks and parenthesis can trigger command substitution or glob expansion if embedded directly in quoted CLI strings. Build description/comment bodies via `cat <<'EOF' ... EOF` and pass through `jq` as raw args before API calls to avoid malformed tickets.

## 2026-04-10 — Locked Coordinator Tickets Still Need Context-Preserving Escalation
When a blocked coordinator gets new external guidance but checkout still returns `409`, preserve the exact new context in the blocker escalation comment before reassigning to PM. This avoids losing instructional deltas while lock normalization is pending.

## 2026-04-10 — process_lost_retry Can Target Non-Owned Parent Tasks
`process_lost_retry` wakes can point at a stale parent task now assigned to another agent (for example [DUB-98](/DUB/issues/DUB-98) assigned to PM). Re-fetch live assignee immediately, then continue with currently assigned inbox priorities instead of forcing task-level recovery on the wake issue.

## 2026-04-10 — Release Endpoint Resets Queue State
`POST /api/issues/{issueId}/release` can clear assignment and move a parked issue back to `todo` even after an explicit `blocked` update. Use release only when you intentionally want to reopen ownership; otherwise keep blocked parking state via `PATCH` and avoid release on legacy/superseded lanes.

## 2026-04-10 — Avoid Backticks In Unquoted Heredoc Comment Bodies
When building markdown comments in shell with `cat <<EOF` (unquoted heredoc), backticks trigger command substitution and silently strip content (for example run IDs). For Paperclip API comment payloads, either quote the heredoc delimiter (`<<'EOF'`) or avoid backticks in generated body text.

## 2026-04-10 — Newly Created Child Issues Default To Backlog
`POST /api/companies/{companyId}/issues` can create assigned subtasks in `backlog`, which may be skipped by normal assignee inbox filters (`todo,in_progress,blocked`). After creating delegation lanes, immediately patch intended active tasks to `todo` (or `blocked` if dependency-gated) to ensure they are picked up.

## 2026-04-10 — Child QA Lane Can Be Safely Reopened From Coordinator Context
When a coordinator ticket is assigned to Architect and child dependencies complete without a new comment (for example content lane flips to `done`), it is valid to patch the child QA issue from `blocked` to `todo` directly with a run-scoped comment, then re-block the coordinator on the single remaining QA matrix gate.

## 2026-04-10 — Dual FED Fallback Needs Explicit Canonical-Winner Rule
When a parent coordinator is checkoutable but the original FED child lane is still `todo` with stale execution lock metadata, create one fallback FED child on the alternate engineer and immediately encode "first lane to `done` becomes canonical" in the parent blocker comment. This keeps QA from waiting on a single stuck lane while preventing ambiguity when both FED lanes become active.

## 2026-04-10 — Recheck Inbox For Mid-Run Assignment Drift
An issue can appear non-owned at heartbeat start and then return to your assignment set later in the same run due queued lock/assignment workflows. Requery `inbox-lite` before exit so newly re-assigned high-priority work (for example [DUB-152](/DUB/issues/DUB-152)) is not left idle.
