# Ops Watchdog — Learnings

Accumulated knowledge specific to the Ops Watchdog role.
Append new entries after each incident or completed heartbeat.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Stale execution locks cause checkout deadlocks

**Incident:** QA Engineer couldn't check out DUB-5 for 3+ hours because the issue had a stale `execution_run_id` from a previous Architect heartbeat run. The Architect's run had been assigned to the issue when it handed the task back to QA, but the execution lock persisted even after the run finished. Every QA checkout attempt hit 409, and every time QA marked the issue blocked and reassigned to Architect, the Architect would re-lock it in a loop.

**Root cause:** The `execution_run_id` on an issue is not cleared by the normal PATCH API or the `/release` endpoint. It's a system-managed field tied to the heartbeat run lifecycle. When a run finishes abnormally or the issue is reassigned mid-execution, this field can become orphaned.

**Recovery:** Direct database UPDATE to clear `execution_run_id`, `execution_locked_at`, `execution_agent_name_key`, and `checkout_run_id` on the stuck issue. Also cancel any queued/running heartbeat runs that reference the stale lock to prevent re-acquisition.

**Prevention:** Added Phase 2c (stale execution lock detection) and Procedure F (lock cleanup) to the agent-watchdog skill.

## 2026-04-09 — Silent agents (heartbeat gap) are invisible to basic health checks

**Incident:** QA Engineer last heartbeat was at 17:09, but its status showed `idle` (not `error`). No pause reason was set. The agent simply stopped receiving heartbeats despite having a 20-minute interval configured. Basic API health checks (status, pause state) showed everything normal.

**Root cause:** The Paperclip scheduler silently dropped the agent's timer. The agent was not in error state, not paused, just never triggered again.

**Recovery:** Manual heartbeat invocation via `npx paperclipai heartbeat run --agent-id $ID --source on_demand --trigger manual`.

**Prevention:** Added Phase 2d (silent agent detection) and Procedure G (manual wake) to the agent-watchdog skill. Detection threshold: flag when last heartbeat exceeds 3x the configured interval.

**Key signal:** Compare `last_heartbeat_at` against `runtime_config.heartbeatIntervalMinutes` (or `runtime_config.heartbeat.intervalSec / 60`). If the gap is > 3x the interval and the agent is idle + not paused, it's silent.

## 2026-04-09 — Stale execution locks can reappear immediately after successful runs

**Incident:** During a single watchdog heartbeat, stale execution locks were cleared on `DUB-52`, `DUB-18`, and `DUB-21`, but new stale locks surfaced minutes later on `DUB-24` and `DUB-9` while other agents were still completing normal heartbeats.

**Root cause hypothesis:** Lock fields (`execution_run_id`, `execution_locked_at`, `execution_agent_name_key`, `checkout_run_id`) are not reliably cleared when some heartbeat runs finish with `succeeded` status. This creates recurring `409 checkout conflict` risk even without crashes.

**Operational impact:** One-pass stale-lock cleanup is insufficient. A clean snapshot can become stale again within the same watchdog run if active heartbeats finish between detection and reporting.

**Mitigation:** Run at least one post-recovery stale-lock verification pass before reporting done. If new stale locks appear, clear them in the same heartbeat and escalate as a platform bug.

## 2026-04-10 — Ops Watchdog token cannot call cross-agent resume/invoke endpoints

**Incident:** During watchdog recovery, calls to `POST /api/agents/{id}/resume` returned `403 Board access required`, and calls to `POST /api/agents/{id}/heartbeat/invoke` returned `403 Agent can only invoke itself` when targeting other agents.

**Impact:** Standard Procedure D/G from the watchdog skill cannot run via API using the Ops Watchdog agent token. Without fallback, error/silent agents remain unrecovered.

**Recovery workaround used:**  
1. Clear stale runtime state in `agent_runtime_state` (`session_id`, `last_error`, `last_run_status`)  
2. For `error` agents, apply DB-equivalent of resume by setting `agents.status='idle'`, `pause_reason=NULL`, `paused_at=NULL`  
3. Escalate permission-model mismatch to PM for board-level fix

**Follow-up needed:** Update either (a) Ops Watchdog permissions/capabilities to allow cross-agent wake/recovery actions, or (b) watchdog skill to explicitly use board-routed automation for resume/invoke.

## 2026-04-09 — EPIPE server crash loop causes mass agent failure

**Incident:** Between 21:56 and 22:08, the Paperclip server crashed and restarted at least 4 times in rapid succession. Each crash killed all running agent heartbeat processes, resulting in 49 failed heartbeat runs across 8 agents. Six agents were left in `error` status: UX Designer, Content Writer, Architect, QA Engineer 2, Co-Founder, and UX QA Reviewer.

**Root cause:** The Paperclip Node.js server has an unhandled `EPIPE` error. When a client disconnects (browser tab closed, SSE connection dropped) and the server tries to write to that socket, Node.js emits an `error` event on the socket. Since no handler catches it, it becomes an `uncaughtException` and crashes the entire process. Stack trace:

```
node:events:502
      throw er; // Unhandled 'error' event
Error: write EPIPE
    at WriteWrap.onWriteComplete [as oncomplete] (node:internal/stream_base_commons:95:16)
```

**Signature to detect:**
- Multiple agents in `error` status simultaneously (not just one)
- Recent failed heartbeat runs all share the same error: `"Process lost -- child pid XXXXX is no longer running"`
- Failed runs cluster in a short time window (< 15 minutes)
- The Paperclip server log shows `Error: write EPIPE` followed by a restart

**Key distinction:** This is NOT an individual agent problem. Do not waste time debugging each agent's code or config. The root cause is the server crashing and taking all agents down with it.

**Recovery:** 
1. Verify the server is running again (`/api/health`)
2. For each agent in `error` status, wake with `forceFreshSession: true`
3. Clean up stale execution locks left behind by dead runs
4. The underlying tasks/issues are not lost — they're still assigned and will be picked up on next successful heartbeat

**Impact:** 49 heartbeat runs failed. No work was permanently lost, but ~12 minutes of agent time across all affected agents was wasted.

**Prevention:** This is an upstream Paperclip bug. The server needs to handle EPIPE gracefully (e.g., catch the socket error event or add a process-level `uncaughtException` handler that logs but doesn't crash). Until fixed, running Paperclip in a restart loop (`while true; do npx paperclipai run; sleep 3; done`) helps reduce downtime but doesn't prevent the cascading agent failures.

## 2026-04-10 — `/wakeup` triggerDetail is enum-restricted

**Incident:** While trying to recover silent agents, `POST /api/agents/{id}/wakeup` initially returned validation errors because `triggerDetail` was set to a custom string.

**Learning:** The endpoint currently accepts only `manual | ping | callback | system` for `triggerDetail`. Use one of these values or the request fails before permission checks.

## 2026-04-10 — Cancelled issues can retain execution lock residue

**Incident:** Legacy cancelled lanes (`DUB-137` to `DUB-140`) still had non-null `execution_run_id` metadata, including queued and succeeded backing runs.

**Operational impact:** Even when a lane is terminal (`cancelled`), stale execution metadata pollutes lock diagnostics and can hide queue pressure.

**Mitigation:** Include selected cancelled/legacy lanes in targeted cleanup passes when they appear in incident scope, and fail any queued backing runs before nulling lock fields.

## 2026-04-10 — Issue comment updates can reattach execution lock to unrelated active run

**Incident:** After clearing queued run locks on `DUB-163`, posting follow-up comments on blocked CTO lanes caused `DUB-163.execution_run_id` to reattach to Architect's currently running run (`83d24eb1-...`) whose context issue was `DUB-89` (unrelated lane).

**Impact:** The lane appeared lock-free, then silently regained a checkout-conflict lock without a new lane-specific run being queued.

**Mitigation:** After any lock-clear + comment workflow, perform a second lock validation pass. If `execution_run_id` points to an unrelated active run, clear lock fields directly in DB (`execution_run_id`, `execution_locked_at`, `execution_agent_name_key`, `checkout_run_id`) without cancelling the active unrelated run.

## 2026-04-10 — Active-unrelated lock contamination can hit multiple lanes at once

**Incident:** During a post-report verification pass, four non-terminal issues (`DUB-1`, `DUB-162`, `DUB-98`, `DUB-85`) simultaneously held `execution_run_id` values pointing to *running* heartbeat runs whose `context_snapshot.issueId` belonged to other lanes.

**Impact:** The stale-lock detector (finished/failed runs only) can report clean while checkout conflicts are still possible due to active-but-unrelated lock contamination.

**Mitigation:** Add a dedicated pass for `hr.status IN ('queued','running') AND hr.context_snapshot.issueId != issues.id`. Clear only issue lock fields; do **not** cancel the active run unless it is itself stale. Re-run both detectors (`stale_non_terminal` + `active_unrelated`) until both are zero before ending heartbeat.

## 2026-04-10 — Dead-PID detection can race with normal run rollover

**Incident:** During watchdog scanning, PM was briefly flagged as `running` with a missing PID, then immediately started a fresh run in the next snapshot. A one-pass detector would have treated this as a dead-process incident.

**Learning:** `status=running` + missing PID can be a transient rollover race (run finished between queries). Before recovery actions on non-stuck agents, run a short refresh pass (API + DB + PID check) to confirm the signal persists.

**Mitigation:** Require a second snapshot before kill/resume when the only signal is dead PID and no stale-log evidence exists. Continue immediate recovery only for confirmed hung runs (alive PID + stale log).

## 2026-04-10 — Local trusted API allows board-context wake without agent token scope

**Incident:** Ops Watchdog token-scoped calls to `POST /api/agents/{id}/wakeup` and `npx paperclipai heartbeat run --agent-id ...` were blocked for cross-agent wake with `Agent can only invoke itself`, preventing silent-agent recovery via standard authenticated routes.

**Learning:** In local trusted mode, calling `POST /api/agents/{id}/heartbeat/invoke` on `http://127.0.0.1:3100`/`3101` **without Authorization header** executes as board context (`actorId: local-board`) and succeeds for cross-agent wake.

**Mitigation:** For watchdog silent-agent recovery, prefer board-context invoke endpoint when token-scoped wake is denied. Record invoked run IDs and verify status transition after 10s.

## 2026-04-10 — `checkout_run_id` can retain unrelated run IDs after `execution_run_id` clears

**Incident:** Several non-terminal issues had `execution_run_id = NULL` but retained `checkout_run_id` pointing to runs whose `context_snapshot.issueId` belonged to different lanes (`DUB-1`, `DUB-59`, `DUB-116`, `DUB-10`).

**Impact:** Standard stale-lock detectors (execution_run-focused) can report clean while checkout conflicts continue via stale `checkout_run_id`.

**Mitigation:** Add a dedicated cleanup pass for `checkout_run_id` mismatch (`checkout context issue != issue.id`). Clear `checkout_run_id`, and if `execution_run_id` equals the same mismatched run, clear execution lock fields in the same update.

## 2026-04-10 — Repeated lock clears can fail when foreign running runs keep reattaching

**Incident:** During lock cleanup, `DUB-103` reattached `execution_run_id`/`checkout_run_id` to unrelated running runs multiple times in the same heartbeat (`a72bdc77-...` then `3e7bffa2-...`), even after direct DB clears.

**Impact:** A single cleanup pass can appear successful (`active_unrelated=0`) and then regress within minutes while other agents continue running.

**Operational rule:** Treat this as a **recurring platform defect** after 2 cleanup attempts in one heartbeat. Stop retrying, escalate to PM/board with evidence and run IDs, and avoid infinite clear loops.

## 2026-04-10 — Wake attempts must validate run creation, not just JSON parse success

**Incident:** A wake batch initially used stale/incorrect agent UUIDs. The invoke endpoint returned JSON (`{"error":"Agent not found"}`), which still parsed successfully and could be miscounted as a successful wake if only transport/parsing is checked.

**Impact:** Silent-agent recovery can appear successful in logs while no heartbeat run is actually queued for the intended agent.

**Mitigation:** For every wake attempt, require all of:
- response contains a non-null run `id`
- response `status` is `queued` or `running`
- post-invoke verification confirms the target agent status transition (`idle` -> `running` or recent `lastHeartbeatAt` advancement)

If any check fails, treat as failed recovery and retry once with a fresh agent-id lookup from `/api/companies/{companyId}/agents`.

## 2026-04-10 — Lock contamination can spread to new lanes after report/comment activity

**Incident:** After clearing stale/reattached locks and reaching a clean guardrail pass (`active_unrelated=0`, `checkout_mismatch=0`), posting report comments was followed by fresh contamination on additional lanes (`DUB-181`, `DUB-182`, `DUB-29`) tied to unrelated running runs.

**Impact:** A "clean" snapshot is not stable while active agent runs continue. Additional issue updates/comments in the same heartbeat can be followed by new lock contamination on other issues.

**Operational rule:** After two cleanup attempts in one heartbeat, stop repeating lock clears and escalate as a platform defect to PM/board. Avoid infinite clear loops.

**Mitigation:** Always run a final guardrail verification pass immediately before exit, and if recurrence returns, open a critical escalation issue with exact issue IDs, run IDs, and context issue IDs.

## 2026-04-10 — DUB-246 ownership can regress while keeping a valid issue-scoped execution run

**Incident:** After lock normalization on `DUB-246` (set to `todo` + Architect), concurrent workflow activity briefly regressed the lane back to `blocked` + PM while the same issue-scoped execution run (`3945a1d5-...`) remained attached.

**Impact:** Acceptance checks can fail transiently even when stale lock fields were correctly cleared; a follow-up ownership/status normalization may be required in the same heartbeat.

**Mitigation:** Re-apply a single controlled ownership normalization (`assignee=Architect`, `status=todo`), then verify for at least one additional pass that:
- `execution_run_id` context still points to `DUB-246`
- `active_unrelated=0`
- `checkout_mismatch=0`

If regression reappears again in the same heartbeat, escalate as recurring platform/workflow race.

## 2026-04-10 — `context_snapshot.issueId` is the authoritative lock-context key

**Incident:** Active-unrelated lock detection initially used `hr.context_snapshot->'issue'->>'id'`, which returned `NULL` for modern runs and falsely flagged nearly every active lock as unrelated.

**Learning:** Current heartbeat context stores issue linkage at top-level keys: `context_snapshot.issueId` (fallback `taskId`), not nested `context_snapshot.issue.id`.

**Mitigation:** For both `execution_run_id` and `checkout_run_id` mismatch checks, use:
- `COALESCE(hr.context_snapshot->>'issueId', hr.context_snapshot->>'taskId', '') <> issues.id::text`

This sharply reduces false positives and prevents accidental cleanup of healthy active runs.

## 2026-04-10 — Ghost running: agents stuck in `running` after successful completion

**Incident:** PM, Architect, and Co-Founder were all stuck in `running` status for 3+ hours. Their codex processes had finished successfully (log files stopped writing at ~04:23 UTC, `agent_runtime_state.last_run_status = 'succeeded'`), but the server never transitioned the `heartbeat_runs` records from `running` to a terminal state and never reset agent status to `idle`. Meanwhile, queued heartbeat_runs piled up: PM had 8, Architect had 12, Co-Founder had 1 — none could execute.

**Root cause:** The Paperclip server lost track of the run lifecycle. For PM and Architect, the `heartbeat_runs` records were stuck in `running` with NULL `process_pid` — the process finished but the server never got the completion signal. For Co-Founder, the server explicitly logged "Lost in-memory process handle, but child pid 19174 is still alive" — the process was orphaned after a server internal error.

**Key diagnostic signals:**
- Agent API status: `running` (not `error` — this is why normal monitoring can miss it)
- `agent_runtime_state.last_run_status`: `succeeded` (contradicts the `running` agent status)
- `heartbeat_runs` has a record in `running` status with NULL or stale PID
- Log files are stale (no writes for hours)
- Queued heartbeat_runs accumulating (3+ is a strong signal)

**Why existing heuristics missed it:**
- Heuristic #1 (Hung process) requires a live PID — these had NULL PIDs
- Heuristic #2 (Dead process) requires a PID that was once alive — NULL PID means the server never tracked it
- Heuristic #5 (Error status) only fires on `error` — these were `running`
- The `/resume` API doesn't work because the agent is in `running` state, not `error`

**Recovery applied:**
1. Killed Co-Founder's orphaned process (pid 19174)
2. Marked 3 stale `running` heartbeat_runs as `failed`
3. Cancelled 20 piled-up `queued` heartbeat_runs
4. Reset all 3 agents to `idle` via direct DB update on `agents` table
5. Cleared stale session state in `agent_runtime_state`

**Prevention:** Added heuristics #20 (Ghost running) and #21 (Lost process handle) to AGENTS.md and the agent-watchdog skill. Added Procedure H for recovery. The key detection is cross-referencing `agent_runtime_state.last_run_status = 'succeeded'` against `agents.status = 'running'` — this contradiction is the definitive signal.

## 2026-04-10 — Recurrence can switch from execution contamination to fresh stale checkout-only locks

**Incident:** After a DUB-246 normalization pass reached a clean guardrail snapshot (`active_unrelated_exec=0`, `active_unrelated_checkout=0`), a new lane (DUB-275) appeared with stale `checkout_run_id` pointing to a `succeeded` run within minutes.

**Impact:** Even when active-unrelated counters are zero, the system can still regress via fresh checkout residue on newly touched lanes, so one clean pass is not sufficient proof of platform stability.

**Operational rule:** Treat this as recurrence after one cleanup pass; escalate and stop retry loops. Do not keep clearing every newly appearing stale checkout in the same heartbeat.

**Mitigation:** Escalate with board checklist and require two consecutive watchdog heartbeats at `stale_locks=0` plus zero active-unrelated counters before declaring lock stability.

## 2026-04-10 — Active lock contamination can map to a different live issue context

**Incident:** After two lock-cleanup passes, `DUB-285` reattached both `execution_run_id` and `checkout_run_id` to a **running** QA2 run (`adfd8301-...`) whose `context_snapshot.issueId/taskId` pointed to `DUB-125` instead of `DUB-285`.

**Why it matters:** This is stronger evidence than blank-context contamination. The run had a valid, non-empty issue context, but lock pointers were still written onto the wrong issue.

**Operational rule:** If this recurs after two cleanup attempts in the same heartbeat, stop lock-clear retries and escalate as a platform defect (critical). Do not cancel the active run unless it is itself stale/hung.

**Mitigation:** Escalation should include: contaminated issue ID/identifier, mismatched run ID, and the run's true context issue ID/identifier so backend can reproduce lock write-path corruption.

## 2026-04-10 — Phantom blockers are the #1 productivity killer

**Incident:** Board review found 10 blocked tasks. ALL of them had empty `blockedByIssueIds` arrays — agents had set themselves to `blocked` status via comments (soft blockers) but never set the formal dependency. This meant Paperclip could never auto-unblock them, and agents would re-check each heartbeat, find them still "blocked", and move on.

**Impact:** 10 tasks with no real dependency were stuck indefinitely. Agents wasted heartbeats checking blocked tasks that could have been worked on.

**Root cause:** When agents encounter a perceived dependency (e.g. "waiting for FED implementation"), they PATCH status to `blocked` and write a comment — but don't set `blockedByIssueIds`. Without the formal link, Paperclip cannot auto-wake the assignee when the dependency completes.

**Recovery:** For each phantom-blocked task:
1. Check if a real dependency exists (read the task description and comments)
2. If yes → set `blockedByIssueIds` to the real dependency task IDs
3. If no → PATCH status to `todo`

**Prevention:** Every heartbeat, scan all blocked tasks and check `blockedBy` array from `GET /api/issues/{id}`. Empty array + blocked status = phantom blocker. Fix immediately.

## 2026-04-10 — Workload imbalance causes cascading slowdowns

**Incident:** FED Engineer 1 had 8 tasks in `in_review` plus 4 more in todo/in_progress (12 total active tasks). FED Engineer 2 and FED Engineer 3 had near zero. QA Agents had no review work despite 8 tasks waiting for review.

**Impact:** FED 1 was spending heartbeats context-switching across 12 tasks instead of making progress. QA agents were idle with nothing to review. FED 2 and 3 were also idle.

**Root cause:** Tasks naturally accumulate on the first agent that picks them up. No automatic rebalancing exists in Paperclip.

**Recovery:**
1. Moved 4 of FED 1's `in_review` tasks to QA 1 and QA 2 (they're the actual reviewers)
2. Moved 2 of FED 1's `todo` tasks to FED 2 and FED 3
3. Invoked heartbeats for all reassigned agents

**Prevention:** Every heartbeat, count tasks per agent within each role group. If gap >= 3, move `todo` tasks from overloaded to underloaded. Move `in_review` to QA agents. Never move `in_progress` (agent has context).

## 2026-04-10 — Meta-task spirals: detection and cleanup pattern

**Incident:** 7 of 23 open tasks were about "lock contamination" — a recursive pattern where agents created tasks about tasks about lock issues. None were making progress; all were blocking each other or the agents assigned to them.

**Detection pattern:** Search for title clusters. If 3+ tasks contain the same root-cause keywords (e.g. "lock contamination", "execution-lock", "checkout conflict", "stale checkout"), and they're all stuck in `blocked`/`in_progress` without recent comments showing actual progress, it's a spiral.

**Recovery:** Cancel all but the most recent canonical task. Comment on each cancelled task explaining the spiral was detected. If the underlying issue (e.g. actual lock contamination) still exists, handle it directly via DB procedures — don't create new tasks.

**Key lesson:** The spiral happens because agents follow the protocol (detect problem → create task → assign) but the tasks themselves become the problem. The Ops Watchdog must break this cycle by fixing directly and cancelling the meta-work.

## 2026-04-10 — Recursive meta-issue spiral caused 65-issue blocked backlog

**Incident:** 65 issues accumulated in `blocked` status. The root cause was NOT agent crashes or execution locks — it was a **recursive bureaucratic spiral** in the task system. The pattern:

1. An execution lock got stuck on an issue
2. Agents created `[CTO]` tasks to fix it
3. Those tasks got assigned to PM (who is not the CTO — the **Architect** is the CTO) or piled up on the Architect
4. Neither could resolve them in one heartbeat, so they went `blocked`
5. Watchdog detected problems, created `[Ops Alert]` tasks
6. Agents created MORE `[CTO]` tasks to resolve the alerts
7. Those also got blocked → repeat

This spiraled into 31 `[CTO]` lock-cleanup meta-tasks, 7 `[Ops Alert]` meta-tasks, and 9 meta-QA validation tasks — all obsolete since the underlying execution locks had already been resolved.

**Key facts:**
- The Architect agent IS the CTO. Tasks labeled `[CTO]` should route to the Architect, not PM
- 22 of the 31 `[CTO]` tasks were misassigned to PM instead of Architect
- PM ended up with 28 blocked issues, completely overwhelmed
- Only 4 execution locks existed at the time of cleanup, all pointing to legitimate running heartbeats

**Resolution (manual by board):**
1. Cancelled 48 obsolete meta-issues (32 CTO lock tasks + 7 Ops Alerts + 9 meta-QA/coordination)
2. Unblocked 13 real work items to `todo` (games, SEO, bug fixes, QA validations, performance, content)
3. Fixed misassignments: game implementations from QA→FED, bug fixes from PM→FED, perf work from FED→Performance Expert
4. Moved 4 GA4/Search Console provisioning tasks to `backlog` (require external Google account access)
5. Invoked heartbeats on all 19 idle agents — all came back online

**Prevention rules for Ops Watchdog:**
- Do NOT create `[CTO]` meta-tasks to fix lock contamination. Clear locks directly in DB (you already have the procedures)
- Do NOT create `[Ops Alert]` tasks for problems you can fix yourself. Only escalate truly unrecoverable issues
- If you detect 10+ blocked issues about locks/checkout, treat it as a spiral and flag for board intervention rather than creating more issues
- The Architect = CTO. If a task needs CTO attention, assign to Architect (`5f7a9323-368f-439d-b3a8-62cda910830b`)
- Maximum 2 meta-issues per root cause. If 2 attempts to fix via task delegation haven't worked, stop creating tasks and escalate directly

## 2026-04-10 — Mass silent agents: 9 of 20 agents missed 3x heartbeat interval

**Incident:** At 12:57 UTC, 9 agents were flagged as silent (last heartbeat > 3x their 10-minute interval): PM (52min), Co-Founder (51min), Children Learning PM (50min), UX Designer (50min), Media Expert (50min), SEO Expert (48min), Content Writer (57min), CMO (44min), Gaming Expert (71min). Only QA Engineer 2 was actively running.

**Root cause:** The Paperclip scheduler appears to silently drop heartbeat timers. Agents were not in `error` state, not paused — just never triggered.

**Recovery:** Board invoked `POST /api/agents/{id}/heartbeat/invoke` for all 19 agents. All 19 returned HTTP 200. Within 15 seconds, 19 of 20 were in `running` status.

**Learning:** The Ops Watchdog's own 35-minute heartbeat interval is too slow to catch this. By the time watchdog wakes, agents may have been silent for 45+ minutes. Consider:
- Checking silent agents should be the FIRST action in every watchdog heartbeat
- If watchdog detects 3+ silent agents at once, invoke all of them immediately rather than one at a time
- Use the board-context invoke endpoint (no auth header on localhost) since agent-scoped tokens cannot invoke cross-agent heartbeats

## 2026-04-10 — `blockedByIssueIds` writes are not visible in issue payloads

**Incident:** During blocker normalization, PATCH requests including `blockedByIssueIds` succeeded (HTTP 200), but subsequent `GET /api/issues/{id}` responses still returned `blockedByIssueIds: null` and no dependency fields.

**Impact:** Heuristic checks that rely on reading dependency arrays from issue payloads can misclassify legitimate blockers as phantom blockers.

**Mitigation:** For now, treat blocker linkage as comment-documented unless/until dependency fields are reliably exposed. Keep phantom-blocker cleanup tied to latest blocker comments plus lock-state verification.

## 2026-04-10 — Priority redirect requires `backlog`, not just `todo`

**Incident:** Non-handbook lanes moved from `in_progress` to `todo` were immediately re-picked by active agents in the same heartbeat, reintroducing priority drift.

**Mitigation:** When board priority requires hard redirection (e.g., handbook-first launch), move non-priority lanes to `backlog` with an explicit resume condition tied to the priority issue.

## 2026-04-10 — 2.5-hour system stall: all blocked tasks had resolved dependencies but nobody unblocked them

**Incident:** After a wave of handbook implementation completions (DUB-463, DUB-458, DUB-468, DUB-459, DUB-445–451 all done by 17:53 UTC), 6 downstream tasks (QA, Performance, Backend, CMO) remained `blocked` for 2.5+ hours. All 20 agents were idle, waking every 10 minutes, finding nothing actionable, and exiting. Zero progress for 2.5 hours until the board manually intervened.

**Root cause (triple failure):**

1. **Agents soft-blocked via comments, not formal links.** QA set DUB-452 to `blocked` and wrote "waiting for DUB-458, DUB-463" in a comment — but never set `blockedByIssueIds`. When those tasks completed, Paperclip had no way to auto-unblock.

2. **`blockedByIssueIds` API bug made heuristic #22/#23 blind.** The API returns `null` for this field regardless of what was set. Heuristic #22 (phantom blocker) couldn't distinguish "no dependency" from "dependency not returned by API." The watchdog couldn't confidently unblock anything.

3. **Ops Watchdog itself was silent for 2.5 hours.** Last heartbeat at 16:33 UTC, didn't run again until board intervention. With 20 agents competing for limited codex_local concurrency slots, the watchdog rarely got a turn.

**Impact:** 6 blocked tasks × 2.5 hours = ~15 agent-hours wasted. 14 agents had zero work and sat idle.

**Fix applied:** Added heuristic #29 (comment-referenced blocker resolution) and heuristic #30/#31 to AGENTS.md. Heuristic #29 reads blocked task comments, extracts DUB-ID references, checks if they're done, and unblocks automatically. This bypasses the broken `blockedByIssueIds` API entirely.

**Prevention:** Heuristic #29 procedure must run BEFORE heuristic #22 on every heartbeat. It catches the most common stall pattern: agent writes "waiting for DUB-X" in a comment, DUB-X completes, nobody notices.
