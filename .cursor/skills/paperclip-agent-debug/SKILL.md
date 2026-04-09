---
name: paperclip-agent-debug
description: >-
  Debug Paperclip agent crashes, stale sessions, and heartbeat failures.
  Use when an agent status is "error", a heartbeat keeps failing, an agent
  is stuck in a crash loop, or the user mentions an agent "keeps crashing",
  "won't start", or "is broken".
---

# Debugging Paperclip Agent Crashes

## File Layout

All Paperclip state lives under `~/.paperclip/instances/default/`:

| Path | Contents |
|------|----------|
| `config.json` | Server config (ports, DB path) |
| `db/` | Embedded PostgreSQL data directory |
| `companies/{companyId}/agents/{agentId}/instructions/` | Agent SOUL.md, HEARTBEAT.md, AGENTS.md, TOOLS.md |
| `companies/{companyId}/codex-home/sessions/` | Codex session rollout files |
| `data/run-logs/{companyId}/{agentId}/` | NDJSON run logs per heartbeat |
| `workspaces/{agentId}/` | Fallback workspace for agents without a project workspace |
| `logs/server.log` | Paperclip server log |

## Diagnostic Steps

### 1. Identify the agent

The Paperclip API runs at `http://127.0.0.1:3100` (check `config.json` for port).

```bash
# Get agent by ID
curl -s http://127.0.0.1:3100/api/agents/{agentId} | python3 -m json.tool

# List all agents in a company
curl -s http://127.0.0.1:3100/api/companies/{companyId}/agents | python3 -c "
import sys,json
for a in json.load(sys.stdin):
    print(a['id'], '|', a['name'], '|', a['status'], '|', a['adapterType'])
"
```

If you only know the agent name, read each agent's `SOUL.md`:

```bash
for dir in ~/.paperclip/instances/default/companies/{companyId}/agents/*/; do
  echo "=== $(basename $dir) ==="
  head -3 "$dir/instructions/SOUL.md" 2>/dev/null
done
```

Key fields: `status` (`idle`, `running`, `error`, `paused`), `adapterType`, `adapterConfig.model`, `lastHeartbeatAt`.

### 2. Read run logs

Run logs are NDJSON files — one file per heartbeat invocation:

```bash
ls -lt ~/.paperclip/instances/default/data/run-logs/{companyId}/{agentId}/
```

Read the most recent file. Each line is a JSON event with `ts` and `stream` fields. Look for:

- **`stream: "stderr"`** — errors and crash messages
- **`"type":"rate_limit_event"`** — API rate limit hits
- **`"type":"result"` with `"is_error":true`** — run failed
- **`"subtype":"error_during_execution"`** — internal crash

### 3. Common crash patterns

| Error Pattern | Cause | Fix |
|---|---|---|
| `thread/resume: no rollout found for thread id {id}` | Stale session — adapter tries to resume a dead/expired session | Clear `session_id` in `agent_runtime_state` table (see Step 4) |
| `No conversation found with session ID: {id}` | Previous session expired or was cleaned up | Same as above |
| `rate_limit_event` with `overageStatus: "rejected"` | API rate limit hit | Wait for reset; session created during rate limit may become stale |
| `"is_error":true` with zero tokens | Agent couldn't start | Check adapter config, model availability, API keys |

### 4. Fix stale sessions (most common crash loop)

**How it happens:** A heartbeat fails (rate limit, timeout, etc.) but Paperclip saves the session ID. Every subsequent heartbeat tries to resume the dead session and crashes immediately.

**Connect to embedded PostgreSQL:**

The database port is in `config.json` (default: `54329`). Password: `paperclip`.

```bash
# Install pg if needed (one-time, in /tmp to avoid polluting project)
cd /tmp && npm init -y --silent && npm install pg --silent

# Query runtime state
node -e "
const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 54329, user: 'paperclip', database: 'paperclip', password: 'paperclip' });
c.connect().then(async () => {
  const r = await c.query(\"SELECT agent_id, session_id, last_error, last_run_status FROM agent_runtime_state WHERE agent_id = '\$AGENT_ID'\");
  console.log(JSON.stringify(r.rows, null, 2));
  await c.end();
}).catch(e => console.error(e.message));
"
```

**Clear the stale session:**

```bash
node -e "
const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 54329, user: 'paperclip', database: 'paperclip', password: 'paperclip' });
c.connect().then(async () => {
  const r = await c.query(\"UPDATE agent_runtime_state SET session_id = NULL, last_error = NULL, last_run_status = 'completed' WHERE agent_id = '\$AGENT_ID' RETURNING agent_id, session_id, last_error\");
  console.log('Cleared:', JSON.stringify(r.rows));
  await c.end();
}).catch(e => console.error(e.message));
"
```

### 5. Resume the agent

After clearing the stale session, resume via API:

```bash
curl -s -X POST http://127.0.0.1:3100/api/agents/{agentId}/resume | python3 -m json.tool
```

**Important:** Resume can trigger an immediate heartbeat. Make sure the DB fix is applied *before* calling resume. If the agent crashes again before your DB fix, just clear and resume again.

### 6. Verify recovery

```bash
# Trigger a manual heartbeat
curl -s -X POST http://127.0.0.1:3100/api/agents/{agentId}/heartbeat/invoke

# Wait ~10s, then check status
curl -s http://127.0.0.1:3100/api/agents/{agentId} | python3 -c "
import sys,json; d=json.load(sys.stdin)
print('Status:', d['status'], '| Last HB:', d.get('lastHeartbeatAt'))
"

# Check the latest run log for errors
ls -t ~/.paperclip/instances/default/data/run-logs/{companyId}/{agentId}/ | head -1
```

A healthy agent transitions: `idle` -> `running` -> `idle`. If it goes to `error`, check the new run log.

## Key Database Tables

| Table | Purpose |
|-------|---------|
| `agent_runtime_state` | Current session_id, last_error, last_run_status per agent |
| `heartbeat_runs` | History of all heartbeat invocations (status, error, session_id_before/after) |
| `agent_task_sessions` | Session references tied to specific tasks |
| `agents` | Agent config, status, adapter settings |

## Paperclip API Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/agents/{id}` | GET | Agent details and status |
| `/api/agents/{id}/resume` | POST | Resume from `error`/`paused` to `idle` |
| `/api/agents/{id}/pause` | POST | Pause heartbeats |
| `/api/agents/{id}/heartbeat/invoke` | POST | Manually trigger a heartbeat |
| `/api/companies/{id}/agents` | GET | List all agents |
| `/api/companies/{id}/dashboard` | GET | Company health summary |
