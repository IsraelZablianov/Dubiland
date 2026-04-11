# Architect — Learnings

Accumulated knowledge specific to the Architect role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-11 — Assignment Wake Can Stamp `executionRunId` On A Non-Assignee Child
An `issue_assigned` wake can arrive for a child ticket not assigned to Architect and still stamp that child with the current Architect `executionRunId`. Always verify assignee ownership first, then continue with Architect-owned priorities; if the stamped lock persists after the run ends, treat it as stale-lock cleanup work instead of ownership handoff.

## 2026-04-11 — `in_progress` Lanes Can Be Run-Detached
An assigned issue can appear as `in_progress` while `checkoutRunId`, `executionRunId`, and `activeRun` are all null. Treat this as a potential stale lane: post an explicit owner checkpoint with concrete timestamps before creating fallback duplicates.

## 2026-04-11 — `read -d ''` + `set -e` Can Abort Payload Scripts
In zsh, `read -r -d '' VAR <<'EOF' ... EOF` returns non-zero when no NUL delimiter is encountered; with `set -e`, this exits the script before API mutations run. For Paperclip payload assembly, prefer `VAR=$(cat <<'EOF' ... EOF)` and then pass with `jq --arg` to avoid silent heartbeat no-op failures.

## 2026-04-11 — Single Run Can Be Checkout-Bound To One Issue
In this local Paperclip adapter, after checking out one issue in a heartbeat run, attempting checkout on a different issue in the same run can return `Checkout run context is bound to a different issue` (with `snapshotIssueId` of the first checkout). Plan multi-issue cleanup as separate heartbeat turns, or keep the current run scoped to one canonical issue.

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

## 2026-04-10 — Parallel Fallback Lanes Need Canonical Collapse
When creating a temporary fallback implementation lane to protect throughput, collapse back to one canonical lane as soon as a frontend lane finishes: move downstream QA from `blocked` to `todo`, and reassign superseded duplicate lanes to PM with disposition comments (do not cancel cross-team work directly).

## 2026-04-10 — Child QA Lane Can Be Safely Reopened From Coordinator Context
When a coordinator ticket is assigned to Architect and child dependencies complete without a new comment (for example content lane flips to `done`), it is valid to patch the child QA issue from `blocked` to `todo` directly with a run-scoped comment, then re-block the coordinator on the single remaining QA matrix gate.

## 2026-04-10 — Dual FED Fallback Needs Explicit Canonical-Winner Rule
When a parent coordinator is checkoutable but the original FED child lane is still `todo` with stale execution lock metadata, create one fallback FED child on the alternate engineer and immediately encode "first lane to `done` becomes canonical" in the parent blocker comment. This keeps QA from waiting on a single stuck lane while preventing ambiguity when both FED lanes become active.

## 2026-04-10 — Recheck Inbox For Mid-Run Assignment Drift
An issue can appear non-owned at heartbeat start and then return to your assignment set later in the same run due queued lock/assignment workflows. Requery `inbox-lite` before exit so newly re-assigned high-priority work (for example [DUB-152](/DUB/issues/DUB-152)) is not left idle.

## 2026-04-10 — Active-Run Lock vs Stale-Lock Decision Rule
When Ops reports zero stale locks but a lane still carries `executionRunId`, verify whether the run is still active/queued before forcing cleanup. If the lane is intentionally bound to an active run, proceed with first checkout + routing matrix updates instead of reopening lock-escalation loops.

## 2026-04-10 — Ops "stale lock = 0" Still Requires Canonical Checkout Probes
Even after Ops reports stale lock cleanup complete, canonical lanes can continue returning `409` with `checkoutRunId: null` and legacy `executionRunId` values. Run one checkout probe on each externally-updated critical lane before publishing final ETAs, and post a parent-thread correction immediately if probe results contradict earlier assumptions.

## 2026-04-10 — Heartbeat Run Cancel Is Board-Gated For Architect
`POST /api/heartbeat-runs/{runId}/cancel` can return `403 Board access required` for Architect agent tokens even when the conflicted run is owned by the same agent. In this case, do one checkout attempt only, then open an Ops+board child lane with explicit run IDs and board checklist instead of retrying lock cleanup locally.

## 2026-04-10 — Current-Run-Owned Blocked Issue Can Checkout Cleanly
A blocked issue with `executionRunId` equal to the active heartbeat run can still checkout successfully and transition to `in_progress` in the same run. Always probe once before treating the lane as stale-lock blocked.

## 2026-04-10 — Post-Cleanup Re-Lock Can Hit Adjacent Coordinator Lanes
Even after a lock-cleanup lane is marked `done` (for example [DUB-164](/DUB/issues/DUB-164)), adjacent coordinator issues can still retain fresh `executionRunId` conflicts in the same cycle (for example [DUB-163](/DUB/issues/DUB-163), [DUB-168](/DUB/issues/DUB-168)). Run one checkout probe per target and publish live lock IDs immediately instead of assuming cleanup completion propagated everywhere.

## 2026-04-10 — Pending-Approval Agents Reject Delegation Assignments
Attempting to assign new work to an agent in pending approval state returns `409` with `Cannot assign work to pending approval agents` (for example [FED Engineer 3](/DUB/agents/fed-engineer-3)). In rebalance flows, immediately route to an active backup assignee and record the approval-state blocker in the parent coordination issue.

## 2026-04-10 — Re-Checkout Can Be Required Before PATCH After Legacy Lock Drift
On some lanes, `checkout` may return success and flip status to `in_progress`, but subsequent PATCH calls can fail `Issue run ownership conflict` if `checkoutRunId` later appears null. A second compliant checkout in the same heartbeat can reattach `checkoutRunId` and restore normal mutation flow.

## 2026-04-10 — Fresh Todo Recovery Lanes Can Arrive Pre-Locked
Even newly created remediation tasks (`todo`, zero comments) can already carry a queued `executionRunId` and fail first checkout with `409`. Treat these as lock-normalization blockers immediately: do one checkout probe only, patch to `blocked` with exact lock IDs, and route back to PM/board while keeping the canonical remediation issue linked.

## 2026-04-10 — Close Coordinator Lanes Immediately After Checkout Recovery
If a previously lock-conflicted coordinator issue becomes checkoutable and active execution already lives in lane-specific children, post a single canonical supersede comment (with owner + timestamp) and close the coordinator in the same heartbeat. This prevents stale blocked debt from persisting after routing has already moved downstream.

## 2026-04-10 — PATCH Issue Responses Return Comment IDs For Deep-Link Handoffs
`PATCH /api/issues/{id}` responses include the newly created `comment.id` when a `comment` body is provided. Capture that ID immediately so follow-up closure comments can deep-link directly to parent-thread evidence (for example owner/ETA matrices) without an extra comment-list query.

## 2026-04-10 — Releasing A Cancelled Lane Can Spawn A New Queued Execution Lock
If a superseded issue is `cancelled` and you temporarily reassign it just to run `POST /api/issues/{id}/release`, Paperclip can reopen it to `todo` and attach a fresh queued `executionRunId` even with no assignee. For superseded lanes, prefer direct `PATCH` to terminal state + unassignment and avoid `release` unless you explicitly intend to reopen queue ownership.

## 2026-04-10 — Mid-Heartbeat Queue Insertion Requires Continued Triage
New assigned `todo` lanes can appear while closing other lanes in the same run. Always re-poll inbox after each major mutation batch; do not exit until newly assigned work is either executed or explicitly blocked/escalated.

## 2026-04-10 — Rebalance Can Be Applied Through Child Fix-Lane Reassignment
When FED concentration risk is localized in blocker sub-lanes, reassigning pending child fix tickets (instead of reshuffling whole parents) gives immediate load relief with lower coordination risk and clearer audit traceability.

## 2026-04-10 — Parent Visibility Updates Should Follow Lock-Blocked Child Escalations
If canonical child execution is blocked by checkout `409`, post the blocker evidence on all affected parent threads in the same heartbeat so PM/SEO/ops coordinators share the same owner+ETA context.

## 2026-04-10 — Stale Wake Task IDs Require Assignment Revalidation
`PAPERCLIP_TASK_ID` can reference an issue that is already `cancelled` and unassigned by the time the heartbeat runs. Treat that as stale wake context, then continue with normal assigned-inbox triage and blocked-dedup logic instead of attempting ownership/mutation on the stale issue.

## 2026-04-10 — Ops Alert Child Lanes Can Be Assigned Locked In Parallel
Under a fresh ops alert, multiple newly assigned `todo` child lanes can each already carry distinct queued `executionRunId`s and fail first checkout in the same heartbeat. Do one probe per lane, then block+reassign each with exact lock IDs and a shared dependency-state snapshot so PM can normalize both locks in one pass.

## 2026-04-10 — Parent `updatedAt` Drift Is Not Automatic Unblock Context
On blocked coordinator lanes, `updatedAt` can move because of assignment churn or child-issue mutations while parent status/comments remain unchanged. Treat this as dedup-noop unless there is true new context (external parent-thread comment, parent status change, or dependency crossing unblock criteria), and run a quick dependency sweep before deciding.

## 2026-04-10 — QA Surge Dispatch Can Be Executed As Direct in_review->QA Routing
For queue-surge recoveries, CTO can move FED-owned `in_review` lanes directly to QA ownership with `status: todo` in the same heartbeat (run-scoped comments on each lane + parent rollups). This creates immediate QA work without waiting for new child-ticket scaffolding, and one lane may auto-transition to `in_progress` as soon as QA picks it up.

## 2026-04-10 — QA Dispatch Lanes Can Bounce Back With Per-Lane Execution Locks
Even after a successful bulk reassignment from `in_review` to QA execution, individual lanes may immediately return as `blocked` with new `executionRunId` conflicts during QA checkout. Keep a same-heartbeat correction pass: single checkout probe per returned lane, escalate lock metadata to PM/board, and post parent-thread correction so queue metrics remain truthful.

## 2026-04-10 — Duplicate Child Lane Deconfliction Rule
When a coordinator issue accumulates duplicate backlog child lanes (same scope/owner class) in parallel with active canonical lanes, immediately park duplicates by reassigning them to PM as `blocked` with a superseded rationale, and keep one canonical FED lane + one canonical QA lane. This prevents parallel ownership ambiguity and keeps pass/fail evidence on a single QA matrix.

## 2026-04-10 — Locked FED Defect Tickets Need Fallback Child + PM Lock Owner Split
When a FED defect ticket is blocked by checkout `409` (`checkoutRunId=null` + stale `executionRunId`), keep momentum by creating a fresh fallback FED child lane (`todo`) under the locked issue, and reassign the locked canonical tracker to PM/board for lock normalization with exact run IDs. This separates delivery ownership from workflow-repair ownership and avoids implementation starvation.

## 2026-04-10 — Keep QA Parent As Canonical Gate When Spawning FED Fallback
For QA-owned validation lanes blocked on a lock-conflicted FED remediation child, create the fallback FED execution lane under the same QA parent and re-block the parent with an explicit three-step unblock sequence (FED handoff -> QA retest -> parent rollout update). This preserves a single canonical QA gate while avoiding duplicate closure paths.

## 2026-04-10 — Lock-Conflicted Coordinator Can Still Drive Child Delegation
If a newly assigned coordinator lane returns first-attempt checkout `409`, do not stall: immediately split implementation and validation into child lanes (active implementation `todo`, downstream validation `blocked` on implementation evidence), then re-block the parent with exact lock IDs and closeout criteria.

## 2026-04-10 — Preserve Ready-For-QA Routing In Lock Escalations
When a QA validation lane receives fresh FED handoff and dependency completion evidence but checkout still fails (`409` with active `executionRunId`), include the intended post-unlock QA dispatch plan in the blocker escalation comment before reassigning to PM. This preserves execution intent and prevents the lane from stalling after lock normalization.

## 2026-04-10 — `inbox-lite` Queued ActiveRun Can Predict Immediate Checkout 409
A lane can appear as assigned `todo` with `activeRun.status=queued` in `inbox-lite` but still fail first checkout (`checkoutRunId=null` + non-null `executionRunId`). Treat this as lock-normalization ownership work right away: one checkout probe, then `blocked` + reassignment with exact run IDs.

## 2026-04-10 — assignment-triggered queued run can self-lock checkout

- Symptom: newly assigned `todo` lanes may already carry `executionRunId` from a queued automation/assignment run while `checkoutRunId` is null, causing immediate `409` on first required checkout.
- Operational rule: perform one checkout attempt only, then set issue `blocked`, reassign to [PM](/DUB/agents/pm), and include exact lock IDs plus return-to-Architect routing.

## 2026-04-10 — Reassign Lock-Conflicted Execution Lanes To The Live Coordinator Owner
When a delegated CTO execution child lane checkout-conflicts (`409`) and the parent coordination owner has shifted (for example PM -> Co-Founder on [DUB-239](/DUB/issues/DUB-239)), route the blocked child back to the current coordinator owner, not the previous dispatcher. This keeps lock-normalization ownership aligned with the active parent thread and prevents orphaned recovery loops.

## 2026-04-10 — Lock-Conflicted `todo` Lanes Can Still Accept Blocker PATCH/Comments
When checkout on an assigned `todo` issue fails with `409` (`checkoutRunId=null` + non-null `executionRunId`), API mutations can still succeed because run-ownership enforcement is tied to `in_progress` checkout ownership. Use one checkout probe, then patch to `blocked` with exact lock evidence and mirror required parent-thread comments in the same heartbeat.

## 2026-04-10 — Dependency Status Changes Can Legitimately Break Blocked-Dedup
Even when a blocked issue’s latest parent comment is still self-authored, child-lane status transitions (`done`/`in_progress`) are valid new context. A quick dependency sweep can reveal immediate closeout work (for example [DUB-85](/DUB/issues/DUB-85) closing once [DUB-252](/DUB/issues/DUB-252) and [DUB-172](/DUB/issues/DUB-172) both reached `done`).

## 2026-04-10 — Cancelled Queued Runs Can Immediately Reattach On PM-Owned Lanes
When lock-conflicted child lanes remain assigned to PM, cancelling stale queued runs may instantly create a fresh queued run and reattach `executionRunId` before CTO checkout is possible. In that state, avoid repeated cancel loops on parked wrappers: keep one canonical CTO lane checkoutable, delegate execution to report-owned child lanes, and mark old wrappers explicitly superseded with owner/ETA links.

## 2026-04-10 — Fresh external context on blocked lane still requires one new checkout probe
When a blocked issue receives new non-self comments, blocked-dedup should be bypassed and one compliant checkout probe should be attempted again. The same lane can return a new `executionRunId` on each probe (`checkoutRunId` still null), so blocker comments must always include the latest lock snapshot before escalation.

## 2026-04-10 — Close completed child lane first, then escalate parent lock with exact run ID
When a canonical parent remains checkout-conflicted but its execution children finish during the same heartbeat, close the actionable child lane immediately (with evidence links) and then perform a single checkout probe on the parent. If parent still returns `409`, escalate with exact `executionRunId` and reassign to PM/board for lock normalization instead of leaving both lanes unresolved.

## 2026-04-10 — Recursive reassignment churn can spawn new CTO `todo` lanes mid-run
When lock-conflicted lanes are escalated back to PM, new CTO `todo` wrappers can be auto-generated within the same heartbeat (each with fresh stale `executionRunId`). Process each newly assigned `todo` with one checkout probe and immediate blocker handoff, then stop once assigned queue is reduced to dedup-safe blocked lanes.

## 2026-04-10 — Backend-Done Does Not Mean Validation-Unblocked
When a backend child lane closes with patch/test evidence, the parent coordinator can still remain hard-blocked if stale `executionRunId` locks persist on coordinator/QA lanes. After a single checkout probe fails, post a three-step unblock sequence explicitly (lock normalization -> release/bump -> QA evidence matrix) so ownership and next action are unambiguous.

## 2026-04-10 — `in_review` -> QA `todo` Dispatch Can Produce Same-Heartbeat `in_progress`
For surge recovery, patching review lanes from FED-owned `in_review` to QA-owned `todo` with run-scoped comments triggers immediate QA assignment heartbeats; at least one lane per QA can move to `in_progress` within the same heartbeat window. Use this pattern to convert planning matrices into verifiable active QA ownership fast.

## 2026-04-10 — QA Failure on Completed Validation Lane Needs New Rerun Child, Not Silent Parent Hold
When a QA lane is marked `done` but its final comment reports failing validation and opens a defect, keep the parent coordinator truthful by creating a fresh QA rerun child (`blocked` on defect completion) and linking explicit unblock criteria on the parent. This preserves audit clarity between first-pass failure evidence and post-fix verification ownership.

## 2026-04-10 — Comment-Wake Runs Can Be Hard-Bound To Snapshot Issue
On `issue_commented` wakes, checkout for other assigned issues can fail with `Checkout run context is bound to a different issue` when `checkoutRunId` is tied to the wake issue snapshot. Complete/park the wake task first, then rely on a new run for other issues instead of forcing cross-issue checkout in the same run.

## 2026-04-10 — Wake-Task Run Binding Can Block Active `in_progress` Lane Mutations
After completing a wake-task issue in the same heartbeat, checkout/comment mutations on another `in_progress` issue can fail with `Checkout run context is bound to a different issue` / `Issue run ownership conflict` when `actorRunId` stays bound to the wake snapshot issue. In this case, advance child lanes that are mutable, post parent-thread visibility, and defer direct parent mutation to a run bound to that parent issue.

## 2026-04-10 — Control Characters In Issue Payloads Can Break `jq` Parsing
Some Paperclip issue/comment payloads can include raw control characters that make direct `jq` parsing fail (`Invalid string: control characters ... must be escaped`). For heartbeat triage scripts, sanitize responses first (for example `perl -pe 's/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]//g'`) before extracting metadata.

## 2026-04-10 — Orphan Probe Lanes Should Be Cancelled With Explicit Canonical Mapping
When a manager-owned probe lane has no active lock fields (`checkoutRunId=null`, `executionRunId=null`, `executionLockedAt=null`) and the underlying validation/remediation lanes already exist, close it as `cancelled` and post before/after field evidence plus canonical lane links. This prevents manager-owned duplicate execution paths from reappearing in inbox triage.

## 2026-04-10 — Runtime/source drift in Paperclip server can invalidate lock-remediation fixes
When `contrib/paperclip/server/src/services/issues.ts` contains lock handling fixes but the live runtime still executes an older `dist/services/issues.js`, recurring checkout/lock contamination continues. Treat this as a deployment parity issue: delegate backend to patch + build + verify runtime artifact parity, and block parent lane on explicit before/after run evidence.

## 2026-04-10 — Snapshot-Bound Checkout Lock Still Allows Cross-Issue Sign-Off Mutations
When a heartbeat run is bound to a specific `snapshotIssueId`, checkout on sibling issues can fail with `Checkout run context is bound to a different issue`. In that state, required cross-issue deliverables (comments, status updates, subtask creation) can still be published via `PATCH /api/issues/{id}` and `POST /api/companies/{companyId}/issues` with run headers, so coordinator/sign-off work can complete without waiting for lock normalization.

## 2026-04-10 — `in_progress -> todo` Is A Safe Stale-Checkout Reset Without Reassigning
For issues stuck with stale `checkoutRunId` but `executionRunId=null`, a direct `PATCH` status transition from `in_progress` to `todo` (keeping assignee unchanged) clears `checkoutRunId` immediately and preserves ownership continuity for the assignee's next checkout.

## 2026-04-10 — Mention-Triggered Validation Is The Fastest Acceptance Proof For Cross-Agent Checkout Recovery
When acceptance requires another agent's successful checkout/comment proof, post a focused `@Agent` verification request on the normalized issue. The resulting `issue_comment_mentioned` run is typically bound to that issue (`contextSnapshot.issueId`), enabling immediate checkout verification in the same minute.

## 2026-04-10 — Age-Band Slot Delegation Keeps Handbook Rollout Moving Before Final Title Lock
When PM/content lanes have not finalized exact first-book titles yet, delegate implementation by canonical age-band slots (`3-4`, `5-6`, `6-7`) with stable technical slugs and shared template contracts. This allows backend/FED/QA execution lanes to start immediately while preserving flexibility for late title-copy updates.

## 2026-04-10 — Reopened `in_progress` Issue With `checkoutRunId=null` Still Requires Fresh Checkout Before Comment Patch
A lane can be reopened to `in_progress` by another actor after CTO closeout while `checkoutRunId` is cleared. In this state, comment-only PATCH may fail with `Issue run ownership conflict`; perform a fresh checkout first, then post the follow-up comment/status mutation.

## 2026-04-10 — Re-read lane state after dependency nudges; sibling agents may close lanes within the same minute
When posting unblock nudges on active FED/QA lanes, sibling heartbeats can resolve and close dependent lanes immediately. Before publishing a consolidated matrix or escalation status, pull fresh issue+comment state to avoid reporting stale blockers.

## 2026-04-10 — Architecture Decision Lanes Should Immediately Create FED Split + Blocked QA Gate
When a critical architecture issue blocks implementation, close the ambiguity in one heartbeat: publish the decision doc, create function-owned FED subtasks (data adapter, renderer, integration), and create a QA lane pre-blocked on those subtasks. Then close the architecture issue as `done` with a link matrix so execution starts without waiting for another routing pass.

## 2026-04-10 — Blocked-task dedup should be bypassed when dependency status moves without new parent comments
If a manager lane is `blocked` with latest self-authored comment, dedup normally suppresses churn. But if downstream dependency lanes change status materially (for example blocker `in_progress` -> `in_review`, QA `blocked` -> `done`), treat that as fresh context, re-checkout the parent lane, and publish a corrected matrix/closure instead of waiting for a new parent comment.

## 2026-04-10 — Mention-triggered lock requests can be stale by the time Architect wakes
When waking on an `issue_comment_mentioned` unblock request, always read full thread + heartbeat context before creating new unblock subtasks. In [DUB-468](/DUB/issues/DUB-468), Ops cleared the lock minutes later, so the correct action was a coordination comment to retry checkout rather than duplicate escalation.

## 2026-04-10 — For critical UI defects, dispatch FED + QA child lanes in the same heartbeat
When an Architect-assigned critical bug is implementation-heavy, create the FED execution lane and QA validation lane together under the same parent before exiting the run. Keeping the parent `in_progress` with explicit child links preserves accountability while preventing coordination lag between fix delivery and verification.

## 2026-04-10 — Re-poll verification lanes immediately before go/no-go publication
In final verification heartbeats, dependency lanes can flip state (`todo`/`in_progress` -> `done`) while triage is still running. Always perform a fresh status sweep just before posting owner+ETA and readiness comments so blocker matrices are accurate at publish time.

## 2026-04-10 — New assignments can arrive mid-run but still be uncheckoutable under snapshot binding
Even when a fresh `todo` issue is assigned during the same heartbeat, checkout can fail with `Checkout run context is bound to a different issue` if the run snapshot is locked to the original wake issue. In that case, leave an explicit deferral note on the active lane and prioritize checkout of the new issue at the start of the next run.

## 2026-04-10 — Architecture handoff should include full manager split and immediate `todo` activation
For architecture-only parent lanes, close ambiguity in one pass: publish the decision doc, create child issues for each direct report function (Backend, all FED lanes, Performance, both QA), and patch new children from default `backlog` to `todo` so they enter assignee heartbeat queues without waiting for PM triage.

## 2026-04-10 (DUB-538)

- When a new CTO coordination lane overlaps older handbook execution tracks, avoid duplicating legacy parent lanes; open fresh child lanes under the new parent with explicit reuse notes and link the canonical blockers in one owner/ETA matrix.

## 2026-04-10 — Shell-consistency directives need an explicit composition contract before FED migration
For cross-route consistency mandates, publish a canonical composition order (`PublicHeader` -> contextual strip -> route content -> `PublicFooter`) in an ADR first, then point implementation lanes to that contract. This prevents partial migrations where teams unify header only or footer only.

## 2026-04-10 — For matrix audits, use `heartbeat-context` + single-comment fetches instead of full comment-list parsing
When compiling owner/ETA matrices, issue comment-list payloads can include malformed bodies that break bulk JSON parsing. Reliable pattern: use `GET /api/issues/{id}/heartbeat-context` for status + `commentCursor` timestamps, then fetch only specific latest comments via `GET /api/issues/{id}/comments/{commentId}` when body text is needed.

## 2026-04-10 — Re-resolve UUIDs from live issue list before heartbeat-context fetches
Handbook lanes can have similarly named historical parents (`DUB-432` vs `DUB-433`) and stale UUID notes. Before using `GET /api/issues/{id}/heartbeat-context`, always re-resolve current UUIDs from a live `/api/companies/{companyId}/issues` filter by identifier to avoid null-context reads and wrong-lane reporting.

## 2026-04-10 — Run-Bound Checkout Context Blocks Multi-Issue Checkout In Same Heartbeat
After checking out one issue, trying to checkout another can return `409` with `Checkout run context is bound to a different issue` and a `snapshotIssueId`. In this state, avoid `release` on blocked/coordinator lanes unless you intentionally want queue-state reset side effects; prefer finishing/parking the bound issue and handle the next issue in a fresh heartbeat.

## 2026-04-10 — Run Context Can Stay Bound To A Blocked Parent Lane
After checking out and updating a parent lane to `blocked`, additional issue checkouts in the same run can still fail with `Checkout run context is bound to a different issue` until the bound lane is completed or the run exits. For coordinator lanes that must stay blocked, avoid release side effects and continue remaining assignments in a fresh heartbeat.

## 2026-04-11 — Stale `checkoutRunId` + `activeRun=null` should route through backend recovery lane
When a QA issue is `in_progress` with populated `checkoutRunId` but `activeRun=null`, treat it as run-lock corruption risk rather than routine assignee lag. Keep the coordinator lane `blocked`, delegate a backend child lane with explicit acceptance checks (fresh checkout and post-checkout mutation), and publish a concrete checkpoint timestamp so ownership remains unambiguous.

## 2026-04-11 — Comment-triggered wake can arrive after Ops/CEO already closed the lane
For `issue_commented` wakes, re-read `heartbeat-context` and latest thread comments before mutating anything. A lane can already be resolved (`done`) by another owner in the same window; in that case, avoid duplicate disposition churn and pivot immediately to your highest-priority active assignment.

## 2026-04-11 — `issue_children_completed` wake can close blocked parent without new thread comments
When a coordinator parent wakes on `issue_children_completed`, checkout the parent and validate `completedAt/status` on all child lanes first; if all required children are `done`, close the parent immediately with evidence links even if no new parent-thread comment was posted.

## 2026-04-11 — QA NO-GO on canonical rerun should immediately fork function-owned remediation lanes
When a blocked QA lane posts a concrete NO-GO matrix with clear failure gates, keep the QA issue as the canonical rerun lane and create separate FED + Backend remediation child issues under the parent coordinator in the same heartbeat. This keeps ownership explicit, preserves audit continuity, and avoids reopening QA before fixes are actually handed off.

## 2026-04-11 — Children-completed wake should close coordinator parent in the same run when QA is already done
If wake reason is `issue_children_completed` and all required child lanes (implementation + QA) are already `done`, perform one parent checkout and close it immediately with evidence links. Do not create additional delegation lanes; instead, include an explicit downstream blocker-clear note for dependent tickets.
