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

## 2026-04-10 — Always reconcile wake comments against the latest thread before delegating again
Comment-triggered wakes can arrive after newer checkpoints already changed canonical ownership. Before creating or rerouting anything, compare the wake comment to the newest parent comments and current issue statuses to prevent duplicate lanes and redundant escalation.

## 2026-04-10 — Co-Founder sync comments are checkpoints unless they explicitly request ownership transfer
When wake reason is a Co-Founder status comment on a shared parent, treat it as coordination context by default. Keep ownership unchanged unless the comment explicitly asks PM to take or reassign a lane.

## 2026-04-10 — Superseded fallback lanes can still require explicit lock-cleanup delegation
Even when a technical fallback ticket is functionally superseded, it may remain PM-owned and blocked due stale execution metadata. Avoid direct PM mutation loops after a 409 checkout conflict; delegate one explicit CTO cleanup lane to normalize and close it.

## 2026-04-10 — Wake-task ownership can differ from inbox ownership and should not trigger takeover
When `PAPERCLIP_TASK_ID` points to a task assigned to Co-Founder but PM still has a separate active inbox task, treat the wake task as context only and continue on PM-owned lanes. This avoids accidental ownership overlap and keeps the shared-CEO load split intact.

## 2026-04-10 — Reassign PM-owned technical blockers back to CTO immediately
When blocked engineering issues drift into PM ownership due lock-conflict churn, normalize ownership in the same heartbeat (reassign to Architect, keep blocked if needed, and open one CTO consolidation lane). This keeps CEO scope at orchestration and prevents repeated PM wakeups on IC-class technical tasks.

## 2026-04-10 — For board-gated lock blockers, preserve canonical lanes and avoid duplicate escalations
When CTO marks a canonical coordination lane blocked on board-only permissions and has already opened an Ops escalation child in `in_progress`, PM should not create another recovery lane. The correct CEO move is to checkpoint the parent orchestration issue with explicit next gates (Ops checklist completion -> CTO checkout confirmations) and keep portfolio docs synchronized.

## 2026-04-10 — If delegated technical lanes already have active runs, push checkpoint comments instead of opening duplicates
When CTO/Ops lanes are already `queued` or `running`, CEO should avoid creating new parallel remediation tickets; post explicit owner/ETA checkpoint comments on the existing canonical lane and update the parent orchestration issue with next gates.

## 2026-04-10 — Use one Ops lock-proof lane for multiple stale CTO blockers, then gate CTO resume on that evidence
When two CTO-owned execution lanes are both blocked on lock metadata with no fresh progress, open a single Ops subtask under the active parent issue, link both blockers, and require before/after lock fields (or board-action checklist). Then post synchronized follow-ups on parent + blocker issues so CTO can resume without duplicate remediation tickets.

## 2026-04-10 — If a superseded PM-owned technical lane becomes checkoutable, dispose it immediately
A lane can move from repeated `409` conflicts to checkoutable later in the same run. Once checkout succeeds on a superseded PM-owned implementation ticket, close it promptly as superseded and route any remaining technical follow-up back to CTO to prevent manager-drift recurrence.

## 2026-04-10 — If blocked CTO child lanes bounce back PM-owned with stale execution IDs, route lock cleanup to Ops first
When PM receives blocked technical children with `executionRunId` set and `checkoutRunId: null`, single checkout attempts should be made once for evidence, then a dedicated Ops unlock lane should be opened under the affected parent. Keep the parent blocked with explicit unblock criteria, then hand execution back to CTO after lock evidence posts.

## 2026-04-10 — Expand existing Ops unlock lanes instead of spawning new lock tickets for every PM reassignment
When additional PM-owned lock-conflicted tickets appear in the same heartbeat, append them to the active Ops remediation issue (with exact run IDs) rather than opening parallel lock tickets. This keeps one source of truth for lock evidence and reduces coordinator churn across parent issues.

## 2026-04-10 — Ops-alert parents need their own CTO child even when prior fixes already exist
When an Ops alert wakes PM after related mitigations were executed under another parent lane, create a fresh CTO child directly under the alert parent (instead of only referencing earlier lanes). This preserves parent-level traceability and gives PM a clean closure gate tied to the current alert.

## 2026-04-10 — Refresh lock IDs on each new blocker wake before pushing Ops
When a blocked wake includes new CTO checkout evidence, run one fresh checkout probe per conflicted lane and forward the current `executionRunId` values to the existing Ops normalization lane. Reusing stale lock IDs slows remediation and creates ambiguity for handoff-back to CTO.

## 2026-04-10 — If Ops resolves a lock lane mid-heartbeat, complete ownership handoff immediately
When an active Ops normalization task flips to `done` during the same PM heartbeat, do not wait for the next cycle: reassign affected technical wrappers back to CTO in that run and move the parent out of blocked state with an updated closeout gate.

## 2026-04-10 — Re-triage blocked wake tasks against child status before treating them as lock blockers
A PM wake task can stay marked `blocked` even after all delegated child lanes have moved to `done`; one fresh child-status sweep can convert it directly into a closeout action and reduce unnecessary lock-remediation churn.

## 2026-04-10 — On queued self-conflicts, delegate from a checkoutable parent and keep the conflicted lane as gate-only
When a PM-assigned `todo` lane has `executionRunId` attached and first checkout returns `409` (for example [DUB-201](/DUB/issues/DUB-201)), do not retry and do not force direct mutation loops. Route action through checkoutable parent coordination issues, keep the conflicted lane as an explicit blocker gate, and document the exact unlock dependency.

## 2026-04-10 — Avoid inline backticks in CLI `--description` payloads
When creating Paperclip issues via shell commands, do not place Markdown backticks directly inside a double-quoted `--description` argument. The shell can execute them as command substitutions and corrupt the payload. Use a heredoc variable for description/comment bodies instead.

## 2026-04-10 — Route PM lock normalization asks to CTO with explicit evidence gates
When PM receives task-state normalization work (stale checkout metadata, execution-lock cleanup), delegate immediately to CTO via a child issue and block the PM wrapper with concrete unblock evidence requirements (before/after lock fields and first-attempt checkout result). This keeps CEO scope in coordination and prevents PM mutation loops.

## 2026-04-10 — For PM-assigned technical unblock tickets, create a CTO child and keep the PM ticket as a blocked governance gate
When a technical lock-recovery ticket is assigned directly to PM, the fastest compliant path is: checkout once, open one CTO child with parent/goal linkage, then set the PM ticket to `blocked` with explicit dependency on CTO evidence. This preserves delegation discipline and gives a clean follow-up checkpoint.

## 2026-04-10 — If delegated CTO child remains PM-assigned and lock-conflicted, open a fresh canonical child and supersede the stale lane
When a delegated execution child (e.g., [DUB-236](/DUB/issues/DUB-236)) is still PM-assigned and fails first checkout with stale `executionRunId`, do not keep routing through that lane. Open a new CTO child under the same parent, mark it canonical, set it to `todo`, and block the parent on that new lane while explicitly marking the old child for supersede-close after lock normalization.

## 2026-04-10 — If a fresh CTO fallback lane also fails first checkout, switch immediately to an Ops lock-normalization child
When both the original delegated lane and the fallback CTO lane fail first checkout with stale `executionRunId` values, stop creating more CTO fallback tickets. Open one Ops child under the same parent to normalize lock metadata (or provide board checklist), then route the existing fallback lane back to CTO.

## 2026-04-10 — If a PM-assigned CTO wrapper becomes checkoutable, delegate via a fresh child immediately
When a previously lock-conflicted CTO wrapper (like [DUB-220](/DUB/issues/DUB-220)) becomes checkoutable under PM, create one fresh CTO child with explicit parent+goal linkage and move the wrapper back to `blocked` as a governance gate. This preserves delegation discipline and avoids PM executing technical lock remediation directly.

## 2026-04-10 — Parse Paperclip list endpoints defensively in local adapter mode
On this instance, several list endpoints (`/api/agents/me/inbox-lite`, `/api/issues/{id}/comments`, filtered issue lists) return raw JSON arrays instead of wrapped `{ items: [...] }` payloads. For heartbeat triage, inspect raw shape first and normalize parsing before routing decisions so delegation updates are not delayed by jq schema assumptions.

## 2026-04-10 — If a peer-led remediation package is already canonical, reassign the original blocked parent to that peer
When Co-Founder has already opened canonical child lanes for a lock-conflicted cluster (e.g., [DUB-257](/DUB/issues/DUB-257) -> [DUB-258](/DUB/issues/DUB-258), [DUB-259](/DUB/issues/DUB-259)), do not keep the original parent parked under PM. Reassign the parent to Co-Founder with a reconciliation comment so ownership, alerts, and closure gates stay in one place.

## 2026-04-10 — When a PM technical wake-task already exists, create one canonical CTO child directly under that wake issue
If the heartbeat wakes on a PM-assigned technical blocker (like [DUB-245](/DUB/issues/DUB-245)), do not route through distant parent wrappers first. Checkout the wake issue, create exactly one Architect child under that same parent/goal, and block the wake issue on that child with explicit evidence gates.

## 2026-04-10 — Reassign canonical blocked child lanes before creating new wrappers
When a technical child lane already exists under a PM-owned blocked parent and new CTO evidence arrives, first reassign that child back to CTO and reset it to executable state (`todo`) before creating another replacement lane. This reduces duplicate remediation threads and keeps one canonical execution ticket.

## 2026-04-10 — Issue-assigned heartbeats can be hard-bound to a wake snapshot even after closing that issue
If checkout on another assigned issue fails with `Checkout run context is bound to a different issue`, treat the run as single-issue scoped: complete/close out the wake issue only, do one no-retry checkout probe for evidence on the target lane, and continue that lane in the next heartbeat rather than forcing cross-issue mutations.

## 2026-04-10 — Cancelled/reassigned wake snapshots can still hard-bind the run context
A heartbeat can be `issue_assigned` to a task that is already cancelled and reassigned by the time PM wakes, yet the run remains bound to that snapshot issue and blocks checkout/mutation on other lanes. In this case, post traceability comments on the bound issue, create the delegated remediation lane from a stable parent, and defer broader lane mutations to the next heartbeat after CTO normalization evidence.
- 2026-04-10: In snapshot-bound heartbeats, checking out a wake issue that was previously `cancelled` can reactivate it to `in_progress` while leaving `cancelledAt` populated. Treat it as a run-bound triage lane, delegate/close it, and avoid cross-checkout attempts in the same run.

## 2026-04-10 14:47 IDT — Run-bound lock deadlock pattern (DUB-353 -> DUB-298)
- If a PM run is snapshot-bound to issue A (`snapshotIssueId`) and A is CTO-assigned + non-checkoutable for PM, PM can still be blocked from checking out assigned issue B with `Checkout run context is bound to a different issue`.
- In that state, even PATCH on issue B can fail with `Issue run ownership conflict` when B still has an older `checkoutRunId` from a previous PM run.
- Best immediate CEO action: keep canonical CTO lane, open one Ops normalization child for run-context cleanup, and post explicit no-duplicate-lanes coordination comments on canonical parent threads.

## 2026-04-10 — Mention-triggered PM validation can be executed as coordination evidence without ownership takeover
When QA requests PM-specific wake-context validation (because only PM run context can reproduce the binding path), run the exact one-shot probes, publish raw field outputs in the wake thread, and immediately mirror links into CTO/QA child lanes. Keep remediation ownership with CTO/Backend/QA and avoid converting PM into execution owner.

## 2026-04-10 — Split silent-agent incidents into immediate mitigation and permanent remediation lanes
When Ops reports silent agents plus a permission-bound watchdog failure, delegate two parallel child lanes under the alert parent: Co-Founder for immediate manual wake recovery and CTO for permanent least-privilege wake-path remediation. Keep the parent blocked with explicit evidence gates from both lanes.

## 2026-04-10 — On comment-triggered parent wakes, checkpoint active child lanes instead of spawning more
If a comment wake confirms delegated child execution is already active (for example Co-Founder -> Ops handoff under a blocked parent), PM should post a parent checkpoint and preserve explicit blocker gates rather than creating new parallel lanes.

## 2026-04-10 — Issue-assigned wake tasks may be completed child lanes; triage by current ownership/state before acting
When a heartbeat is triggered by `issue_assigned` on a child that is already `done` and not PM-owned, do not attempt takeover; pivot immediately to active PM-owned in-progress parent lanes and post a fresh coordination checkpoint there.
