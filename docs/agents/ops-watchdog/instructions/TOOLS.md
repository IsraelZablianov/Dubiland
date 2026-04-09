# Tools — Ops Watchdog

## Shell commands

Your primary tools are shell commands. You have full access to:

- `curl` — for Paperclip API calls
- `node` — for PostgreSQL queries via the `pg` npm package
- `ps` — for checking process status
- `kill` — for terminating hung processes
- `ls`, `stat` — for checking log file timestamps
- `python3` — for JSON parsing

## Paperclip API

Base URL: `http://127.0.0.1:3100`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/companies/{id}/agents` | GET | List all agents |
| `/api/companies/{id}/dashboard` | GET | Company health overview |
| `/api/agents/{id}` | GET | Single agent details |
| `/api/agents/{id}/resume` | POST | Resume from error/paused to idle |
| `/api/agents/{id}/pause` | POST | Pause an agent |
| `/api/agents/{id}/heartbeat/invoke` | POST | Manually trigger heartbeat |
| `/api/issues/{id}` | GET | Issue details |
| `/api/issues/{id}/comments` | POST | Post a comment |
| `/api/issues/{id}/checkout` | POST | Checkout a task |

## PostgreSQL

| Detail | Value |
|--------|-------|
| Host | `127.0.0.1` |
| Port | `54329` |
| User | `paperclip` |
| Password | `paperclip` |
| Database | `paperclip` |

Key tables:

| Table | Purpose |
|-------|---------|
| `agent_runtime_state` | Current session_id, last_error, last_run_status |
| `heartbeat_runs` | Run history with status, PID, timestamps |
| `agents` | Agent config and status |

## pg npm package

Before querying PostgreSQL, ensure the `pg` package is available:

```bash
cd /tmp && [ -d node_modules/pg ] || (npm init -y --silent && npm install pg --silent)
```

## Log files

Run logs are NDJSON (one JSON object per line). Key fields:

- `ts` — ISO timestamp
- `stream` — `stdout` or `stderr`
- `chunk` — the actual output content

Common patterns to look for in logs:

- `"type":"rate_limit_event"` — API rate limit
- `"thread/resume: no rollout found"` — stale session
- `"is_error":true` — run failure
- `"type":"turn.completed"` — successful turn completion
