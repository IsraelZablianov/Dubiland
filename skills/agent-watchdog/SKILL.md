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

### Recovery Flowchart

```
For each agent with a problem:

1. Is status "running" with a PID?
   ├─ Process alive + log stale > 10min? → Kill (A) → Clear session (B) → Mark run failed (C) → Resume (D)
   ├─ Process dead? → Clear session (B) → Mark run failed (C) → Resume (D)
   └─ Process alive + log fresh? → Skip (healthy)

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
