# HEARTBEAT — Ops Watchdog

Execute this checklist on every heartbeat. Do not skip steps.

## Checklist

### 1. Load context

Read your `AGENTS.md`, `SOUL.md`, and the `agent-watchdog` skill (`skills/agent-watchdog/SKILL.md`). Check `docs/agents/ops-watchdog/learnings.md` for past incidents and patterns.

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

For agents with status `running`, verify:

```bash
# Check if process is alive
ps -p $PID -o pid= 2>/dev/null

# Check log freshness
LOG_DIR="$HOME/.paperclip/instances/default/data/run-logs/$COMPANY_ID/$AGENT_ID"
LATEST_LOG=$(ls -t "$LOG_DIR"/*.ndjson 2>/dev/null | head -1)
LOG_AGE_SEC=$(( $(date +%s) - $(stat -f '%m' "$LATEST_LOG") ))
```

### 4. Recover

For each problem detected, execute the matching recovery procedure from Phase 3 of the skill. Follow this order:

1. Kill hung/dead process (if applicable)
2. Clear stale session in DB
3. Mark stuck heartbeat_run as failed
4. Resume agent via API

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
- Table of agents scanned, problems found, actions taken, results
- Any escalations needed
- Summary of overall system health

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
