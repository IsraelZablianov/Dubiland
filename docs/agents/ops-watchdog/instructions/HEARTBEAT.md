# HEARTBEAT — Ops Watchdog

Execute this checklist on every heartbeat. Do not skip steps. Your job is twofold: **keep agents running** and **keep work flowing**.

## Checklist

### 1. Load context

Read your `AGENTS.md`, `SOUL.md`, and the `agent-watchdog` skill (`skills/agent-watchdog/SKILL.md`). Check `docs/agents/ops-watchdog/learnings.md` for past incidents and patterns. **Also read `docs/agents/ops-watchdog/instincts.md`** for critical behavioral rules.

**Critical reminders:**
- Do NOT create `[CTO]` or `[Ops Alert]` meta-tasks for problems you can fix directly. This caused a 65-issue blocked spiral on 2026-04-10.
- Fix locks in the DB, invoke heartbeats directly, unblock tasks, rebalance workloads.
- Only escalate what you truly cannot fix yourself.

### 2. Collect health snapshot

Run Phase 1 from the `agent-watchdog` skill:

```bash
COMPANY_ID="$PAPERCLIP_COMPANY_ID"

# a) Fetch all agents from API
curl -s "http://127.0.0.1:3100/api/companies/$COMPANY_ID/agents" > /tmp/watchdog-agents.json

# b) Fetch runtime state + run stats from PostgreSQL
cd /tmp && node -e "
const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 54329, user: 'paperclip', database: 'paperclip', password: 'paperclip' });
c.connect().then(async () => {
  const rs = await c.query(\`
    SELECT a.id, a.name, a.status,
           rs.session_id, rs.last_run_status, rs.last_error,
           rs.updated_at as runtime_updated,
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
    WHERE a.company_id = '$(echo $COMPANY_ID)'
    ORDER BY a.name
  \`);
  console.log(JSON.stringify(rs.rows, null, 2));
  await c.end();
}).catch(e => console.error(e.message));
"
```

### 3. Detect problems

For each agent in the snapshot, apply the heuristics from Phase 2 of the skill:

1. **Hung process** — status `running` + PID alive + log stale > 10 min
2. **Dead process** — status `running` + PID not in process table
3. **Stale session** — `last_error` matches known crash patterns
4. **Rate-limit stall** — `last_error` mentions rate limit
5. **Error status** — API status is `error`
6. **Queued pile-up** — 3+ queued runs
7. **EPIPE server crash** — 3+ agents in `error` simultaneously + recent failed runs with "Process lost -- child pid" error (see heuristic #18 in AGENTS.md)
8. **Ghost running** — status `running` + heartbeat_run `running` with NULL/dead PID + `last_run_status = 'succeeded'` in `agent_runtime_state` + queued runs piling up (see heuristic #20 in AGENTS.md)
9. **Lost process handle** — heartbeat_run error contains "Lost in-memory process handle" (see heuristic #21 in AGENTS.md)

**EPIPE early check (do this first):** Before individual agent checks, count how many agents are in `error` status. If 3+ are in `error` at once, query recent heartbeat runs for the "Process lost" pattern. If confirmed, switch to the **Server Crash Recovery** procedure in AGENTS.md — it's more efficient than recovering agents one by one since the root cause is the server, not the agents.

For agents with status `running`, verify:

```bash
# Check if process is alive
ps -p $PID -o pid= 2>/dev/null

# Check log freshness
LOG_DIR="$HOME/.paperclip/instances/default/data/run-logs/$COMPANY_ID/$AGENT_ID"
LATEST_LOG=$(ls -t "$LOG_DIR"/*.ndjson 2>/dev/null | head -1)
LOG_AGE_SEC=$(( $(date +%s) - $(stat -f '%m' "$LATEST_LOG") ))
```

### 3a. Detect and auto-fix ghost running agents

**Run this immediately after the snapshot.** Ghost running agents pile up queued runs every heartbeat interval, so early detection prevents queue bloat.

This single script detects all ghost running agents and fixes them in one pass:

```bash
cd /tmp && node -e "
const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 54329, user: 'paperclip', database: 'paperclip', password: 'paperclip' });
c.connect().then(async () => {
  // --- DETECT ---
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
        -- Ghost: run succeeded but agent still 'running'
        rs.last_run_status = 'succeeded'
        -- Lost handle: server explicitly lost track
        OR hr.error LIKE '%Lost in-memory process handle%'
      )
  \`);

  if (ghosts.rows.length === 0) {
    console.log('GHOST_CHECK: clean — no ghost running agents');
    await c.end();
    return;
  }

  console.log('GHOST_CHECK: found', ghosts.rows.length, 'ghost running agent(s)');

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

    // Report PID for manual kill if alive (check via 'ps' after this script)
    if (g.process_pid) {
      console.log('  [!] Orphan PID', g.process_pid, '— run: ps -p', g.process_pid, '-o pid= && kill', g.process_pid);
    }
  }

  console.log('\\nGHOST_RECOVERY: done —', ghosts.rows.length, 'agent(s) reset to idle');
  await c.end();
}).catch(e => console.error('GHOST_CHECK_ERROR:', e.message));
"

# Kill any orphaned PIDs reported above (the script prints them).
# For each PID printed with [!]:
#   ps -p $PID -o pid= 2>/dev/null && kill $PID
```

**What this script does:**
1. Queries all agents where `agents.status = 'running'` AND (`last_run_status = 'succeeded'` OR heartbeat_run error mentions "Lost in-memory process handle")
2. For each ghost agent: marks stale `running` heartbeat_runs as `failed`, cancels all queued runs, resets agent to `idle`, clears session
3. Prints orphaned PIDs that need killing (kill them manually after the script)

**If the script prints `GHOST_CHECK: clean`** — no ghost agents, skip to step 3b.

**If it prints `GHOST_RECOVERY: done`** — verify each fixed agent is `idle` via the API, then report in step 6 under a **Ghost Recovery** section.

### 3b. Check if PM (CEO) is idle

Run Phase 2b from the `agent-watchdog` skill. If the PM's status is `idle`, has no pending/running heartbeat runs, and its last completed run was more than 25 minutes ago, invoke a heartbeat:

```bash
PM_ID="9ba06101-670c-4da3-9d57-56fdc8d67b03"

# Use the Phase 2b detection query from the skill to check PM idle status.
# If output contains PM_IDLE_NEEDS_WAKE:
curl -s -X POST "http://127.0.0.1:3100/api/agents/$PM_ID/heartbeat/invoke"
```

Include results in your report under an **Idle Agent Probing** section.

### 3c. Check for stale execution locks on issues

Run Phase 2c from the `agent-watchdog` skill. Query all non-terminal issues that have an `execution_run_id` pointing to a finished, failed, cancelled, or missing heartbeat run. These locks prevent agents from checking out issues.

For each stale lock found:
1. Cancel the stale run if it's still in `queued`/`running` status
2. Clear the lock fields (`execution_run_id`, `execution_locked_at`, `execution_agent_name_key`, `checkout_run_id`) via Procedure F
3. Restore the correct assignee if it was changed during lock confusion
4. Log the issue identifier, the stale run ID, and the action taken

### 3d. Check for silent agents

Run Phase 2d from the `agent-watchdog` skill. For each idle, non-paused agent whose last heartbeat was more than 3x its configured interval ago:
1. Flag as `SILENT_AGENT`
2. Invoke a manual heartbeat via Procedure G
3. Verify the agent picks up work
4. If it goes silent again, note for escalation (may need Paperclip server restart)

### 3e. Task health scan — blocked tasks

Query all blocked issues and check their real dependencies:

```bash
COMPANY_ID="$PAPERCLIP_COMPANY_ID"

# Fetch all blocked tasks
curl -s "http://127.0.0.1:3100/api/companies/$COMPANY_ID/issues?status=blocked" > /tmp/watchdog-blocked.json

# For each blocked task, check if it has real blockedByIssueIds
python3 -c "
import json
with open('/tmp/watchdog-blocked.json') as f:
    data = json.load(f)
items = data if isinstance(data, list) else data.get('items', [])
print(f'Total blocked: {len(items)}')
phantom = []
for i in items:
    # Need to fetch full issue to get blockedBy
    pass
print('Fetching individual issues to check blockedBy...')
for i in items:
    print(f'  [{i.get(\"identifier\",\"?\")}] {i.get(\"title\",\"?\")[:60]} | assignee: {i.get(\"assigneeAgentId\",\"none\")[:12]}')
"
```

For each blocked task, fetch `GET /api/issues/{id}` and inspect `blockedBy`:
- **Empty `blockedBy` array** → phantom blocker. PATCH to `todo` with comment "Unblocking: no real dependency exists."
- **All blockers are `done`/`cancelled`** → resolved blocker. PATCH to `todo`, set `blockedByIssueIds: []`.
- **Blockers are still active** → legitimate. Leave as is but verify the blocker task is assigned and progressing.

### 3f. Task health scan — meta-task spirals

Check for clusters of tasks about the same root cause:

```bash
# Look for spiral patterns in task titles
python3 -c "
import json
with open('/tmp/watchdog-blocked.json') as f:
    data = json.load(f)
items = data if isinstance(data, list) else data.get('items', [])

# Also load in_progress and todo
import subprocess
for status in ['in_progress', 'todo']:
    r = subprocess.run(['curl', '-s', f'http://127.0.0.1:3100/api/companies/$COMPANY_ID/issues?status={status}'],
                      capture_output=True, text=True)
    more = json.loads(r.stdout)
    items.extend(more if isinstance(more, list) else more.get('items', []))

# Detect spiral keywords
spiral_keywords = ['lock contamination', 'execution-lock', 'checkout conflict', 'stale checkout', 'lock reattachment']
spiral_tasks = []
for i in items:
    title = (i.get('title','') + ' ' + i.get('description','')).lower()
    if any(kw in title for kw in spiral_keywords):
        spiral_tasks.append(i)

if len(spiral_tasks) >= 3:
    print(f'SPIRAL DETECTED: {len(spiral_tasks)} tasks about lock/checkout issues')
    for t in spiral_tasks:
        print(f'  [{t.get(\"identifier\")}] {t.get(\"title\",\"\")[:70]}')
    print('ACTION: Cancel all but 1 canonical task')
else:
    print(f'No spiral detected ({len(spiral_tasks)} lock-related tasks)')
"
```

If a spiral is detected (3+ tasks about the same root cause): cancel all but the most recent one. Use `PATCH /api/issues/{id}` with `{"status": "cancelled", "comment": "Cancelled by Ops Watchdog: meta-task spiral cleanup. Keeping [DUB-XXX] as canonical task."}`.

### 3g. Workload rebalancing

Check task distribution across role groups:

```bash
COMPANY_ID="$PAPERCLIP_COMPANY_ID"

# Get all active tasks with assignees
curl -s "http://127.0.0.1:3100/api/companies/$COMPANY_ID/issues?status=todo,in_progress,in_review" > /tmp/watchdog-active.json

python3 -c "
import json
from collections import defaultdict

with open('/tmp/watchdog-active.json') as f:
    data = json.load(f)
items = data if isinstance(data, list) else data.get('items', [])

# Count tasks per agent
agent_tasks = defaultdict(lambda: {'todo': 0, 'in_progress': 0, 'in_review': 0, 'total': 0})
for i in items:
    aid = i.get('assigneeAgentId', 'unassigned')
    status = i.get('status', '?')
    if status in agent_tasks[aid]:
        agent_tasks[aid][status] += 1
    agent_tasks[aid]['total'] += 1

# FED Engineer IDs
fed_ids = {
    'afb1aaf8-04b5-45f7-80d1-fd401ae14510': 'FED 1',
    '0dad1b67-3702-4a03-b08b-3342247d371b': 'FED 2',
    'aa97a097-c8e5-47e6-9075-e7f8fb5d3709': 'FED 3',
}
qa_ids = {
    'e11728f3-bb90-417d-842a-9a1bb633eed4': 'QA 1',
    'bef56e46-8b5a-48fc-bbce-acb9ea364c8a': 'QA 2',
}

for group_name, group_ids in [('FED Engineers', fed_ids), ('QA Engineers', qa_ids)]:
    print(f'\n{group_name}:')
    counts = {}
    for aid, name in group_ids.items():
        t = agent_tasks.get(aid, {'todo':0,'in_progress':0,'in_review':0,'total':0})
        counts[name] = t
        print(f'  {name}: {t[\"total\"]} total (todo:{t[\"todo\"]} ip:{t[\"in_progress\"]} ir:{t[\"in_review\"]})')
    
    totals = [c['total'] for c in counts.values()]
    if totals and max(totals) - min(totals) >= 3:
        print(f'  ⚠ IMBALANCE: gap of {max(totals) - min(totals)} tasks. Rebalance needed!')
    else:
        print(f'  ✓ Balanced')
"
```

If imbalance is detected (gap >= 3 tasks within a role group):
1. Identify `todo` tasks on the overloaded agent
2. PATCH `assigneeAgentId` to move them to the underloaded peer
3. Add a comment: "Reassigned by Ops Watchdog for workload balance."
4. After reassigning, invoke a heartbeat for the receiving agent

### 3h. Review bottleneck check

If any engineer has 3+ tasks in `in_review`, reassign them to QA agents for review:

```bash
# From the active tasks data, find review bottlenecks
python3 -c "
import json
with open('/tmp/watchdog-active.json') as f:
    data = json.load(f)
items = data if isinstance(data, list) else data.get('items', [])

from collections import defaultdict
review_by_agent = defaultdict(list)
for i in items:
    if i.get('status') == 'in_review':
        review_by_agent[i.get('assigneeAgentId','')].append(i)

qa_agents = ['e11728f3-bb90-417d-842a-9a1bb633eed4', 'bef56e46-8b5a-48fc-bbce-acb9ea364c8a']
for aid, tasks in review_by_agent.items():
    if aid not in qa_agents and len(tasks) >= 3:
        print(f'BOTTLENECK: agent {aid[:12]} has {len(tasks)} in_review tasks')
        for t in tasks:
            print(f'  [{t.get(\"identifier\")}] {t.get(\"title\",\"\")[:60]}')
        print('ACTION: Reassign to QA agents')
"
```

For bottlenecked `in_review` tasks: distribute evenly to QA 1 and QA 2 by PATCH `assigneeAgentId`. The tasks stay in `in_review` status — QA agents will pick them up and perform the review.

### 4. Recover

For each problem detected, execute the matching recovery procedure from Phase 3 of the skill:

1. **Ghost running agents** — already handled by step 3a's script. If any reported orphan PIDs, kill them now:
   ```bash
   # For each orphan PID printed by step 3a:
   ps -p $PID -o pid= 2>/dev/null && kill $PID && echo "Killed $PID" || echo "PID $PID already dead"
   ```
2. **Hung/dead process** — kill process (Procedure A) → clear session (B) → mark run failed (C) → resume (D)
3. **Error status / stale session** — clear session (B) → resume (D). Use DB-direct resume if API returns 403:
   ```bash
   # DB-direct resume (bypasses permission restrictions)
   cd /tmp && node -e "
   const { Client } = require('pg');
   const c = new Client({ host: '127.0.0.1', port: 54329, user: 'paperclip', database: 'paperclip', password: 'paperclip' });
   c.connect().then(async () => {
     await c.query(\"UPDATE agent_runtime_state SET session_id = NULL, last_error = NULL, last_run_status = 'completed' WHERE agent_id = '\$AGENT_ID'\");
     await c.query(\"UPDATE agents SET status = 'idle', pause_reason = NULL, paused_at = NULL WHERE id = '\$AGENT_ID' AND status = 'error' RETURNING name\");
     console.log('Resumed agent');
     await c.end();
   }).catch(e => console.error(e.message));
   "
   ```
4. **Stale execution locks** — already handled by step 3c
5. **Silent agents** — already handled by step 3d
6. For all recoveries: verify status transition after 10s

**Max 2 recovery attempts per agent.** If it fails twice, skip and note for escalation.

### 5. Verify recovery

For each recovered agent, wait 10 seconds then check:

```bash
curl -s "http://127.0.0.1:3100/api/agents/$AGENT_ID" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d['name'], ':', d['status'])"
```

Expected: status is `idle` or `running` (freshly started heartbeat).

### 6. Report

Post a comment on your current task with:

- Timestamp
- **Agent health:** Table of agents scanned, problems found, actions taken, results
- **Task health:** Blockers cleared, spirals cancelled, tasks rebalanced, misassignments fixed
- **Workload snapshot:** Task counts per FED and QA agent after rebalancing
- Any escalations needed
- Summary of overall system health and productivity

### 7. Record learnings

If you encounter a new crash pattern or learn something about recovery, update `docs/agents/ops-watchdog/learnings.md`.

### 8. Exit

Update your task status and exit. Do not linger.

## Rules (non-negotiable)

- **Always load the watchdog skill** — it has the procedures; don't improvise
- **Checkout before working** — follow Paperclip protocol
- **Never kill your own PID** — check `$$` and `$PPID`
- **Comment before exiting** — always leave a report
- **Don't touch healthy agents** — only act on confirmed problems
