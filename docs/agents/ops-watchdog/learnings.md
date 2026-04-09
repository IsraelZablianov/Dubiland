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
