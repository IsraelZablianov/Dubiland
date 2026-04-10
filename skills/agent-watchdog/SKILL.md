---
name: agent-watchdog
description: >
  Detect and recover stuck, hung, errored, or crash-looping Paperclip agents.
  Use on every heartbeat to scan all agents, diagnose problems, and
  automatically restore healthy operation. Covers process hangs, stale
  sessions, rate-limit crash loops, and queued-run pile-ups.
---

# Agent Watchdog Skill

## Overview

Agents get stuck for predictable reasons. This skill gives you the detection
heuristics and recovery procedures to fix them automatically.

## Infrastructure

| Resource | Location / Address |
|---|---|
| Paperclip API | `http://127.0.0.1:3100` (verify via `~/.paperclip/instances/default/config.json`) |
| PostgreSQL | `127.0.0.1:54329`, user `paperclip`, password `paperclip`, db `paperclip` |
| Run logs | `~/.paperclip/instances/default/data/run-logs/{companyId}/{agentId}/` |
| Server log | `~/.paperclip/instances/default/logs/server.log` |

### Database access

```bash
cd /tmp && [ -d node_modules/pg ] || (npm init -y --silent && npm install pg --silent)

node -e "
const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 54329, user: 'paperclip', database: 'paperclip', password: 'paperclip' });
c.connect().then(async () => {
  // YOUR QUERY HERE
  const r = await c.query('SELECT 1');
  console.log(r.rows);
  await c.end();
}).catch(e => console.error(e.message));
"
```

## Phase 1 — Collect Agent Health Snapshot

Run this on every heartbeat. It produces a health report for all agents.

```bash
COMPANY_ID="$PAPERCLIP_COMPANY_ID"

# 1. Get all agents from API
curl -s "http://127.0.0.1:3100/api/companies/$COMPANY_ID/agents" > /tmp/watchdog-agents.json

# 2. Get runtime state from DB
cd /tmp && node -e "
const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 54329, user: 'paperclip', database: 'paperclip', password: 'paperclip' });
c.connect().then(async () => {
  const rs = await c.query(\`
    SELECT a.id, a.name, a.status,
           rs.session_id, rs.last_run_status, rs.last_error, rs.updated_at as runtime_updated,
           (SELECT COUNT(*) FROM heartbeat_runs hr
            WHERE hr.agent_id = a.id AND hr.status = 'queued') as queued_runs,
           (SELECT COUNT(*) FROM heartbeat_runs hr
            WHERE hr.agent_id = a.id AND hr.status = 'running') as running_runs,
           (SELECT process_pid FROM heartbeat_runs hr
            WHERE hr.agent_id = a.id AND hr.status = 'running'
            ORDER BY started_at DESC LIMIT 1) as running_pid,
           (SELECT started_at FROM heartbeat_runs hr
            WHERE hr.agent_id = a.id AND hr.status = 'running'
            ORDER BY started_at DESC LIMIT 1) as run_started_at
    FROM agents a
    LEFT JOIN agent_runtime_state rs ON rs.agent_id = a.id
    WHERE a.company_id = '$COMPANY_ID'
    ORDER BY a.name
  \`);
  console.log(JSON.stringify(rs.rows));
  await c.end();
}).catch(e => console.error(e.message));
" > /tmp/watchdog-state.json
```

## Phase 2 — Detect Problems

Parse the snapshot and flag agents matching these heuristics.

### Heuristic 1: Hung process (CRITICAL)

**Signature:** Agent status is `running`, a process PID exists, but the run log
hasn't been written to in more than **10 minutes**.

```bash
# For each agent with status "running":
LOG_DIR="$HOME/.paperclip/instances/default/data/run-logs/$COMPANY_ID/$AGENT_ID"
LATEST_LOG=$(ls -t "$LOG_DIR"/*.ndjson 2>/dev/null | head -1)
if [ -n "$LATEST_LOG" ]; then
  LOG_AGE_SEC=$(( $(date +%s) - $(stat -f '%m' "$LATEST_LOG") ))
  if [ "$LOG_AGE_SEC" -gt 600 ]; then
    echo "HUNG: $AGENT_NAME — log stale for ${LOG_AGE_SEC}s, PID $PID"
  fi
fi
```

Also verify the process is alive:

```bash
ps -p $PID -o pid= 2>/dev/null || echo "DEAD PROCESS: PID $PID not running"
```

**Decision matrix:**

| Process alive? | Log stale > 10min? | Action |
|---|---|---|
| Yes | Yes | **Hung** — kill process, clear session, resume |
| No | Yes | **Dead** — clear session, resume |
| Yes | No | Healthy running — skip |
| No | No | Race condition — recheck in 60s |

### Heuristic 2: Stale session crash loop

**Signature:** `last_run_status = 'failed'` and `last_error` contains
`thread/resume: no rollout found` or `No conversation found with session ID`.

The agent will keep failing every heartbeat until the stale `session_id` is
cleared.

### Heuristic 3: Rate-limit stall

**Signature:** `last_error` contains `rate_limit` or `You've hit your limit`.
The session created during rate-limiting may be invalid.

### Heuristic 4: Queued run pile-up

**Signature:** `queued_runs >= 3`. Runs accumulate when the current run is
stuck. After fixing the stuck run, queued runs drain automatically — but if
the count keeps growing, flag it.

### Heuristic 5: Error status

**Signature:** Agent API status is `error`. Agent cannot heartbeat until
resumed.

### Heuristic 6: Long-running process (WARNING)

**Signature:** `run_started_at` is more than **30 minutes** ago but log is
still being written to. Not necessarily broken, but worth flagging. Some
complex heartbeats legitimately take time — only escalate if > 60 minutes.

### Heuristic 7: Ghost running — status stuck after completion (CRITICAL)

**Signature:** Agent status is `running` in the `agents` table, there is a
`heartbeat_runs` record in `running` status with either NULL `process_pid` or
a dead PID, BUT `agent_runtime_state.last_run_status` = `succeeded`. The run
actually completed but the server failed to transition the heartbeat_run
record and the agent status.

**Why it happens:** The Paperclip server can lose track of a run's lifecycle —
especially after a server restart, memory pressure, or an internal error. The
codex process finishes normally and writes `last_run_status = 'succeeded'` to
`agent_runtime_state`, but the server never updates the `heartbeat_runs`
record from `running` to `succeeded` and never sets the agent back to `idle`.

**Cascading effect:** Every scheduled heartbeat gets queued but cannot start
because the agent is "already running." The queue grows by 1 every heartbeat
interval (e.g., 6/hour for a 10-min agent). After a few hours, a 10-min-
interval agent can have 20+ queued runs that will never execute.

**Detection query (DB only — check PID liveness separately via `ps`):**

```bash
cd /tmp && node -e "
const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 54329, user: 'paperclip', database: 'paperclip', password: 'paperclip' });
c.connect().then(async () => {
  const r = await c.query(\`
    SELECT a.id, a.name, a.status as agent_status,
           rs.last_run_status, rs.session_id, rs.updated_at as runtime_updated,
           hr.id as run_id, hr.status as run_status, hr.process_pid,
           hr.started_at as run_started,
           hr.error as run_error,
           (SELECT COUNT(*) FROM heartbeat_runs q
            WHERE q.agent_id = a.id AND q.status = 'queued') as queued_count
    FROM agents a
    JOIN agent_runtime_state rs ON rs.agent_id = a.id
    LEFT JOIN heartbeat_runs hr ON hr.agent_id = a.id AND hr.status = 'running'
    WHERE a.company_id = '\$COMPANY_ID'
      AND a.status = 'running'
  \`);
  r.rows.forEach(row => {
    const isGhost = row.run_status === 'running' && row.last_run_status === 'succeeded';
    const isLostHandle = (row.run_error || '').includes('Lost in-memory process handle');
    if (isGhost || isLostHandle) {
      console.log('GHOST_RUNNING:', row.name,
        '| run_status:', row.run_status,
        '| last_run_status:', row.last_run_status,
        '| pid:', row.process_pid,
        '| queued:', row.queued_count,
        '| lost_handle:', isLostHandle);
    }
  });
  await c.end();
}).catch(e => console.error(e.message));
"

# For each PID reported above, verify liveness:
# ps -p $PID -o pid= 2>/dev/null && echo "ALIVE" || echo "DEAD"
```

**Decision matrix:**

| `last_run_status` | heartbeat_run `running`? | PID alive? | Action |
|---|---|---|---|
| `succeeded` | Yes, NULL PID | N/A | **Ghost** — Procedure H |
| `succeeded` | Yes, dead PID | No | **Ghost** — Procedure H |
| `succeeded` | Yes, alive PID | Yes | **Lost handle** — Kill PID, then Procedure H |
| `failed` | Yes, alive PID | Yes | **Hung** — use existing Procedure A + B + C + D |
| `failed` | Yes, dead PID | No | **Dead** — use existing Procedure B + C + D |

### Heuristic 8: Lost process handle (CRITICAL)

**Signature:** A `heartbeat_runs` record has `error` containing "Lost
in-memory process handle, but child pid X is still alive". The Paperclip
server restarted or had an internal error and lost its reference to the child
process. The process may still be running as an orphan.

**Recovery:** Kill the orphaned process, then apply Procedure H.

## Phase 2b — Detect Idle PM (CEO)

The PM (CEO) drives the entire team. If it's idle for too long without a
heartbeat, all downstream work stalls. This phase checks whether the PM has
been sitting idle past its expected heartbeat interval and wakes it up.

**PM Agent ID:** `9ba06101-670c-4da3-9d57-56fdc8d67b03`
**Expected interval:** 20 minutes (with 5-minute grace → 25 min threshold)

### Detection query

```bash
PM_ID="9ba06101-670c-4da3-9d57-56fdc8d67b03"
IDLE_THRESHOLD_MIN=25

cd /tmp && node -e "
const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 54329, user: 'paperclip', database: 'paperclip', password: 'paperclip' });
c.connect().then(async () => {
  const r = await c.query(\`
    SELECT a.status,
           (SELECT MAX(finished_at) FROM heartbeat_runs
            WHERE agent_id = a.id AND status = 'completed') as last_completed,
           (SELECT COUNT(*) FROM heartbeat_runs
            WHERE agent_id = a.id AND status IN ('queued','running')) as pending_runs
    FROM agents a WHERE a.id = '$PM_ID'
  \`);
  const row = r.rows[0];
  if (!row) { console.log('PM_NOT_FOUND'); process.exit(0); }

  const lastRun = row.last_completed ? new Date(row.last_completed) : null;
  const minAgo = lastRun ? (Date.now() - lastRun.getTime()) / 60000 : Infinity;
  const isIdle = row.status === 'idle';
  const noPending = parseInt(row.pending_runs) === 0;
  const overdue = minAgo > $IDLE_THRESHOLD_MIN;

  console.log(JSON.stringify({ status: row.status, last_completed: row.last_completed, minutes_since: Math.round(minAgo), idle: isIdle, overdue, no_pending: noPending }));
  if (isIdle && overdue && noPending) {
    console.log('PM_IDLE_NEEDS_WAKE');
  } else {
    console.log('PM_OK');
  }
  await c.end();
}).catch(e => console.error(e.message));
"
```

**Decision matrix:**

| PM status | Last run > 25 min ago? | Pending runs? | Action |
|---|---|---|---|
| `idle` | Yes | None | **Invoke heartbeat** (Procedure E) |
| `idle` | Yes | Queued/running | Skip — already scheduled |
| `idle` | No | Any | Skip — recently ran |
| `running` | Any | Any | Skip — currently working |
| `error` | Any | Any | Handle via Phase 2 error heuristics |

### Procedure E: Invoke heartbeat for idle agent

```bash
curl -s -X POST "http://127.0.0.1:3100/api/agents/$PM_ID/heartbeat/invoke" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('Invoked heartbeat for', d.get('agentId', 'unknown'), '— run:', d.get('id', 'unknown'))"
```

After invoking, wait 10 seconds and verify the PM picked up work:

```bash
sleep 10
curl -s "http://127.0.0.1:3100/api/agents/$PM_ID" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('PM status:', d['status'])"
```

Include the result in your Phase 4 report under a separate "**Idle Agent Probing**" section.

## Phase 2c — Detect Stale Execution Locks on Issues

Issues can get stuck with an `execution_run_id` pointing to a run that already
finished or failed. This prevents any agent from checking out the issue (409
conflict), creating a permanent deadlock.

**Why it happens:** An agent's heartbeat crashes or is killed mid-execution.
The run is marked failed, but the issue still holds its `execution_run_id`,
`execution_locked_at`, and `checkout_run_id` references to the dead run.

### Detection query

```bash
cd /tmp && node -e "
const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 54329, user: 'paperclip', database: 'paperclip', password: 'paperclip' });
c.connect().then(async () => {
  const r = await c.query(\`
    SELECT i.id, i.identifier, i.title, i.status, i.assignee_agent_id,
           i.execution_run_id, i.execution_locked_at, i.execution_agent_name_key,
           hr.status as run_status, hr.finished_at as run_finished
    FROM issues i
    LEFT JOIN heartbeat_runs hr ON hr.id = i.execution_run_id
    WHERE i.company_id = '\$COMPANY_ID'
      AND i.execution_run_id IS NOT NULL
      AND i.status NOT IN ('done', 'cancelled')
      AND (hr.status IN ('failed', 'succeeded', 'cancelled') OR hr.id IS NULL)
  \`);
  if (r.rows.length === 0) { console.log('NO_STALE_LOCKS'); }
  else {
    r.rows.forEach(row => console.log('STALE_LOCK:', row.identifier, '| issue_status:', row.status,
      '| run:', (row.execution_run_id || '').substring(0,12), '| run_status:', row.run_status || 'MISSING'));
  }
  console.log(JSON.stringify(r.rows));
  await c.end();
}).catch(e => console.error(e.message));
"
```

**Decision matrix:**

| Run exists? | Run status | Action |
|---|---|---|
| Yes | `failed`/`succeeded`/`cancelled` | **Stale lock** — clear via Procedure F |
| No (NULL join) | N/A | **Orphaned lock** — clear via Procedure F |
| Yes | `running`/`queued` | Active run — verify process is alive before acting |

## Phase 2d — Detect Silent Agents (Heartbeat Gap)

An agent can be `idle` and not paused, but its heartbeat scheduler has silently
stopped triggering. This is different from a hung process — the agent simply
never gets invoked.

**Why it happens:** Scheduler bugs, machine sleep/wake, or the Paperclip
server restarting without re-registering agent timers.

### Detection query

```bash
cd /tmp && node -e "
const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 54329, user: 'paperclip', database: 'paperclip', password: 'paperclip' });
c.connect().then(async () => {
  const r = await c.query(\`
    SELECT a.id, a.name, a.status, a.last_heartbeat_at,
           COALESCE(
             (a.runtime_config->>'heartbeatIntervalMinutes')::int,
             ((a.runtime_config->'heartbeat'->>'intervalSec')::int / 60),
             30
           ) as interval_min,
           EXTRACT(EPOCH FROM (NOW() - a.last_heartbeat_at)) / 60 as minutes_since_heartbeat,
           a.paused_at
    FROM agents a
    WHERE a.company_id = '\$COMPANY_ID'
      AND a.status = 'idle'
      AND a.paused_at IS NULL
      AND a.last_heartbeat_at IS NOT NULL
  \`);
  r.rows.forEach(row => {
    const gap = parseFloat(row.minutes_since_heartbeat);
    const threshold = row.interval_min * 3;
    if (gap > threshold) {
      console.log('SILENT_AGENT:', row.name, '| last_heartbeat:', Math.round(gap), 'min ago',
        '| expected interval:', row.interval_min, 'min', '| missed ~' + Math.floor(gap / row.interval_min) + ' beats');
    }
  });
  await c.end();
}).catch(e => console.error(e.message));
"
```

**Threshold:** Flag when an agent's last heartbeat is more than **3x its
configured interval** (e.g., a 20-min agent silent for 60+ min).

**Recovery:** Invoke a manual heartbeat via `npx paperclipai heartbeat run
--agent-id $AGENT_ID --source on_demand --trigger manual`. If the agent picks
up work normally, the scheduler likely needs a Paperclip server restart to
re-register timers.

## Phase 3 — Recovery Procedures

### Procedure A: Kill hung process

```bash
# Graceful kill first
kill $PID
sleep 3

# Verify
if ps -p $PID -o pid= 2>/dev/null; then
  kill -9 $PID
  sleep 2
fi
```

### Procedure B: Clear stale session

```bash
cd /tmp && node -e "
const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 54329, user: 'paperclip', database: 'paperclip', password: 'paperclip' });
c.connect().then(async () => {
  const r = await c.query(
    \"UPDATE agent_runtime_state SET session_id = NULL, last_error = NULL, last_run_status = 'completed' WHERE agent_id = '\$AGENT_ID' RETURNING agent_id, session_id\"
  );
  console.log('Cleared:', JSON.stringify(r.rows));
  await c.end();
}).catch(e => console.error(e.message));
"
```

### Procedure C: Mark stuck heartbeat_run as failed

```bash
cd /tmp && node -e "
const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 54329, user: 'paperclip', database: 'paperclip', password: 'paperclip' });
c.connect().then(async () => {
  const r = await c.query(
    \"UPDATE heartbeat_runs SET status = 'failed', error = 'Watchdog: process hung/dead', finished_at = NOW() WHERE agent_id = '\$AGENT_ID' AND status = 'running' RETURNING id, status\"
  );
  console.log('Marked failed:', JSON.stringify(r.rows));
  await c.end();
}).catch(e => console.error(e.message));
"
```

### Procedure D: Resume agent

```bash
curl -s -X POST "http://127.0.0.1:3100/api/agents/$AGENT_ID/resume" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d['name'], '->', d['status'])"
```

### Procedure F: Clear stale execution lock on an issue

When an issue has a stale `execution_run_id` from a dead/finished run, clear
it so agents can check out the issue again.

```bash
ISSUE_ID="..." # The issue with the stale lock

cd /tmp && node -e "
const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 54329, user: 'paperclip', database: 'paperclip', password: 'paperclip' });
c.connect().then(async () => {
  // 1. Cancel any queued/running runs that reference this issue's stale lock
  const stale = await c.query(
    \"SELECT execution_run_id FROM issues WHERE id = '\$ISSUE_ID'\"
  );
  const staleRunId = stale.rows[0]?.execution_run_id;
  if (staleRunId) {
    await c.query(
      \"UPDATE heartbeat_runs SET status = 'failed', error = 'Watchdog: stale execution lock cleanup', finished_at = NOW() WHERE id = '\"+staleRunId+\"' AND status IN ('queued', 'running')\"
    );
  }

  // 2. Clear the lock fields on the issue
  const r = await c.query(
    \"UPDATE issues SET execution_run_id = NULL, execution_locked_at = NULL, execution_agent_name_key = NULL, checkout_run_id = NULL WHERE id = '\$ISSUE_ID' RETURNING identifier, status, assignee_agent_id\"
  );
  console.log('Cleared lock:', JSON.stringify(r.rows));
  await c.end();
}).catch(e => console.error(e.message));
"
```

**After clearing:** Verify the issue is back to a clean state and the assigned
agent can check it out on their next heartbeat. If the issue was reassigned
during the lock confusion, restore the correct assignee via the API:

```bash
curl -s -X PATCH "http://127.0.0.1:3100/api/issues/$ISSUE_ID" \
  -H "Content-Type: application/json" \
  -d "{\"assigneeAgentId\": \"$CORRECT_AGENT_ID\", \"status\": \"todo\"}"
```

### Procedure G: Wake a silent agent

When an agent's heartbeat has stopped firing (Phase 2d), manually invoke one:

```bash
npx paperclipai heartbeat run --agent-id $AGENT_ID --source on_demand --trigger manual
```

If this works but the agent goes silent again after one cycle, the Paperclip
scheduler may need a restart. Log this for escalation.

### Procedure H: Detect and fix all ghost running agents (batch)

When an agent's status is `running` but the run actually completed (Heuristic
7/8), the `/resume` API won't work because the agent isn't in `error` state.
You must fix the DB directly. This script detects AND fixes all ghosts in one
pass — run it as-is, no per-agent substitution needed.

```bash
cd /tmp && node -e "
const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 54329, user: 'paperclip', database: 'paperclip', password: 'paperclip' });
c.connect().then(async () => {
  // --- DETECT all ghost running agents ---
  const ghosts = await c.query(\`
    SELECT a.id, a.name,
           rs.last_run_status,
           hr.id as stale_run_id, hr.process_pid, hr.error as run_error,
           (SELECT COUNT(*) FROM heartbeat_runs q
            WHERE q.agent_id = a.id AND q.status = 'queued') as queued_count
    FROM agents a
    JOIN agent_runtime_state rs ON rs.agent_id = a.id
    LEFT JOIN heartbeat_runs hr ON hr.agent_id = a.id AND hr.status = 'running'
    WHERE a.company_id = '\$COMPANY_ID'
      AND a.status = 'running'
      AND (
        rs.last_run_status = 'succeeded'
        OR hr.error LIKE '%Lost in-memory process handle%'
      )
  \`);

  if (ghosts.rows.length === 0) {
    console.log('GHOST_CHECK: clean — no ghost running agents');
    await c.end();
    return;
  }

  console.log('GHOST_CHECK: found', ghosts.rows.length, 'ghost running agent(s)');

  // --- FIX each ghost ---
  for (const g of ghosts.rows) {
    console.log('\\n--- Fixing:', g.name, '---');
    console.log('  last_run_status:', g.last_run_status, '| pid:', g.process_pid, '| queued:', g.queued_count);

    // Step 1: Mark stale 'running' heartbeat_runs as failed
    const r1 = await c.query(
      \"UPDATE heartbeat_runs SET status = 'failed', finished_at = NOW(), \" +
      \"error = 'Watchdog: ghost running - completed but not transitioned' \" +
      \"WHERE agent_id = '\" + g.id + \"' AND status = 'running' RETURNING id\"
    );
    console.log('  [1] Marked', r1.rows.length, 'stale running run(s) as failed');

    // Step 2: Cancel all queued runs (accumulated while stuck)
    const r2 = await c.query(
      \"UPDATE heartbeat_runs SET status = 'cancelled', finished_at = NOW(), \" +
      \"error = 'Watchdog: cancelled - queued while agent was ghost running' \" +
      \"WHERE agent_id = '\" + g.id + \"' AND status = 'queued' RETURNING id\"
    );
    console.log('  [2] Cancelled', r2.rows.length, 'queued run(s)');

    // Step 3: Reset agent status to idle (NOT /resume — agent is 'running', not 'error')
    const r3 = await c.query(
      \"UPDATE agents SET status = 'idle' WHERE id = '\" + g.id + \"' AND status = 'running' RETURNING name\"
    );
    console.log('  [3] Reset agent to idle:', r3.rows.length > 0 ? 'done' : 'FAILED');

    // Step 4: Clear session state so next heartbeat starts fresh
    await c.query(
      \"UPDATE agent_runtime_state SET session_id = NULL, last_error = NULL, \" +
      \"last_run_status = 'completed' WHERE agent_id = '\" + g.id + \"'\"
    );
    console.log('  [4] Cleared session state');

    // Report orphaned PID for manual kill
    if (g.process_pid) {
      console.log('  [!] Orphan PID', g.process_pid, '— verify and kill if alive');
    }
  }

  console.log('\\nGHOST_RECOVERY: done —', ghosts.rows.length, 'agent(s) reset to idle');
  await c.end();
}).catch(e => console.error('GHOST_CHECK_ERROR:', e.message));
"

# Kill any orphaned PIDs reported by the script above:
# ps -p $PID -o pid= 2>/dev/null && kill $PID
```

**After running:** For each PID printed with `[!]`, check if it's alive
(`ps -p $PID -o pid=`) and kill it if so. Then verify all fixed agents show
`idle` via the API.

**Key facts about Procedure H:**
- Directly updates `agents.status` to `idle` — the `/resume` API rejects
  agents in `running` state (it only works for `error`/`paused`)
- Cancels queued runs instead of letting them drain — they accumulated while
  the agent was stuck and would fire in a burst otherwise
- Clears `session_id` to force a fresh session on next heartbeat
- The detection query matches BOTH `last_run_status = 'succeeded'` ghosts AND
  `Lost in-memory process handle` orphans in one pass

### Recovery Flowchart

```
For each agent with a problem:

1. Is status "running" with a PID?
   ├─ Process alive + log stale > 10min? → Kill (A) → Clear session (B) → Mark run failed (C) → Resume (D)
   ├─ Process dead? → Clear session (B) → Mark run failed (C) → Resume (D)
   └─ Process alive + log fresh? → Skip (healthy)

1b. Is status "running" but last_run_status = "succeeded"? (GHOST)
   ├─ PID alive? → Kill (A) → Reset ghost (H)
   ├─ PID dead or NULL? → Reset ghost (H)
   └─ Lost-handle error? → Kill (A) → Reset ghost (H)

2. Is status "error"?
   └─ Has stale session_id? → Clear session (B) → Resume (D)
   └─ No stale session? → Resume (D)

3. Is last_error a rate-limit?
   └─ Clear session (B) — rate-limited sessions are often invalid

4. Queued runs >= 5?
   └─ Log warning — likely symptom of a stuck run above

5. Issue has stale execution_run_id? (Phase 2c)
   └─ Run is finished/failed/missing? → Clear lock (F) → Restore assignee → Log

6. Agent is silent (idle + no heartbeat for 3x interval)? (Phase 2d)
   └─ Not paused? → Wake agent (G) → Verify pickup → Log
```

## Phase 4 — Report

After recovery, post a summary comment on your watchdog task:

```markdown
## Watchdog Report — {timestamp}

| Agent | Problem | Action | Result |
|---|---|---|---|
| Architect | Hung process (PID 97773, stale 2h) | Kill + clear + resume | ✅ Recovered |
| Gaming Expert | Stale session crash loop | Clear session + resume | ✅ Recovered |
| Media Expert | Never triggered | No action (healthy idle) | ℹ️ Info only |

### Queued Run Summary
- Architect: 4 queued → draining after recovery
- All others: 0 queued
```

## Key Database Tables

| Table | Key Columns | Purpose |
|---|---|---|
| `agent_runtime_state` | `agent_id`, `session_id`, `last_error`, `last_run_status` | Current session state per agent |
| `heartbeat_runs` | `agent_id`, `status`, `process_pid`, `started_at`, `finished_at`, `error` | History of all heartbeat invocations |
| `agents` | `id`, `name`, `status`, `company_id` | Agent config and API status |

## Safety Rules

1. **Never kill your own process** — check `$PPID` and `$$` before killing
2. **Never clear session for a healthy running agent** — only act on stale/dead/error
3. **Log every action** — record what you did, which agent, and the outcome
4. **Don't retry endlessly** — if an agent fails recovery twice in one heartbeat, skip and escalate
5. **Respect rate limits** — if you detect a rate-limit error, don't immediately re-trigger the agent; let the limit reset
6. **Check company ID** — only manage agents in your own company
