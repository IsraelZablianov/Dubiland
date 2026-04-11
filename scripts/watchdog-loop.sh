#!/usr/bin/env bash
set -euo pipefail

API="http://127.0.0.1:3100/api"
COMPANY="107038ed-546d-4c3f-afca-26feea951289"
INTERVAL_SEC=600  # 10 minutes
PG_PORT=54329
LOG_FILE="/tmp/watchdog-loop.log"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

cancel_stuck_runs() {
  local stuck
  stuck=$(curl -s "$API/companies/$COMPANY/heartbeat-runs" | python3 -c "
import sys,json,datetime as dt
runs = json.load(sys.stdin)
now = dt.datetime.now(dt.timezone.utc)
for r in runs:
    if r.get('status') != 'running': continue
    started = r.get('startedAt','')
    if not started: continue
    t = dt.datetime.fromisoformat(started.replace('Z','+00:00'))
    age_min = (now - t).total_seconds() / 60
    if age_min > 30:
        print(r['id'])
" 2>/dev/null)

  if [ -z "$stuck" ]; then
    log "  No stuck runs found"
    return
  fi

  while IFS= read -r rid; do
    curl -s -X POST "$API/heartbeat-runs/$rid/cancel" > /dev/null 2>&1
    log "  Cancelled stuck run: $rid"
  done <<< "$stuck"
}

fix_error_agents() {
  local errors
  errors=$(curl -s "$API/companies/$COMPANY/agents" | python3 -c "
import sys,json
for a in json.load(sys.stdin):
    if a.get('status') == 'error':
        print(a['id'])
" 2>/dev/null)

  if [ -z "$errors" ]; then
    log "  No error agents"
    return
  fi

  while IFS= read -r aid; do
    cd /tmp && node -e "
const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: $PG_PORT, user: 'paperclip', database: 'paperclip', password: 'paperclip' });
c.connect().then(async () => {
  await c.query(\"UPDATE agent_runtime_state SET session_id = NULL, last_error = NULL, last_run_status = 'completed' WHERE agent_id = '\$aid'\");
  await c.end();
}).catch(() => process.exit(0));
" 2>/dev/null || true
    curl -s -X POST "$API/agents/$aid/resume" > /dev/null 2>&1
    local name
    name=$(curl -s "$API/agents/$aid" | python3 -c "import sys,json; print(json.load(sys.stdin).get('name','?'))" 2>/dev/null)
    log "  Fixed & resumed error agent: $name ($aid)"
  done <<< "$errors"
}

trigger_idle_agents() {
  local idle_agents
  idle_agents=$(curl -s "$API/companies/$COMPANY/agents" | python3 -c "
import sys,json,datetime as dt
now = dt.datetime.now(dt.timezone.utc)
for a in json.load(sys.stdin):
    if a.get('status') != 'idle': continue
    last = a.get('lastHeartbeatAt','')
    if not last: 
        print(a['id'], a['name'])
        continue
    t = dt.datetime.fromisoformat(last.replace('Z','+00:00'))
    age_min = (now - t).total_seconds() / 60
    if age_min > 15:
        print(a['id'], a['name'])
" 2>/dev/null)

  if [ -z "$idle_agents" ]; then
    log "  All agents recently active"
    return
  fi

  while IFS= read -r line; do
    local aid name
    aid=$(echo "$line" | cut -d' ' -f1)
    name=$(echo "$line" | cut -d' ' -f2-)
    curl -s -X POST "$API/agents/$aid/heartbeat/invoke" > /dev/null 2>&1
    log "  Triggered idle agent: $name"
  done <<< "$idle_agents"
}

print_status() {
  curl -s "$API/companies/$COMPANY/agents" | python3 -c "
import sys,json
agents = json.load(sys.stdin)
running = sum(1 for a in agents if a['status'] == 'running')
idle = sum(1 for a in agents if a['status'] == 'idle')
error = sum(1 for a in agents if a['status'] == 'error')
print(f'  Agents: {running} running, {idle} idle, {error} error — total {len(agents)}')
" 2>/dev/null

  curl -s "$API/companies/$COMPANY/dashboard" | python3 -c "
import sys,json
d = json.load(sys.stdin)
t = d.get('tasks',{})
print(f'  Tasks: {t.get(\"open\",0)} open, {t.get(\"inProgress\",0)} in-progress, {t.get(\"blocked\",0)} blocked, {t.get(\"done\",0)} done')
" 2>/dev/null
}

# ---- Main Loop ----
log "========================================="
log "Watchdog loop started (interval: ${INTERVAL_SEC}s)"
log "========================================="

CYCLE=0
while true; do
  CYCLE=$((CYCLE + 1))
  log ""
  log "=== Cycle $CYCLE ==="

  log "Step 1: Cancel stuck runs (>30 min)"
  cancel_stuck_runs

  log "Step 2: Fix error agents"
  fix_error_agents

  log "Step 3: Trigger stale idle agents (>15 min since last heartbeat)"
  trigger_idle_agents

  log "Step 4: Status"
  print_status

  log "--- Sleeping ${INTERVAL_SEC}s until next cycle ---"
  sleep "$INTERVAL_SEC"
done
