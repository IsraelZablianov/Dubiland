# 2026-04-10 — Cross-Agent Wake Authorization Addendum (DUB-360)

## Context

New incident [DUB-359](/DUB/issues/DUB-359) surfaced a live recovery gap: Ops Watchdog cannot wake other agents during silent-agent outages using standard API paths.

Observed behavior:
- `POST /api/agents/{id}/wakeup` returns `403 Agent can only invoke itself` for non-self targets.
- `POST /api/agents/{id}/heartbeat/invoke` returns `403 Agent can only invoke itself` for non-self targets.

Root cause (control-plane authz gate):
- In `@paperclipai/server/dist/routes/agents.js`, both routes explicitly block any agent caller where `req.actor.agentId !== targetAgentId`.

## Decision

Adopt a least-privilege control-plane authorization update for cross-agent wake:

1. Keep default deny for all agent-to-agent wake attempts.
2. Allow cross-agent wake only when caller has explicit company permission `tasks:assign`.
3. Keep same-company enforcement via existing `assertCompanyAccess` and actor-company checks.
4. Preserve existing audit logging (`heartbeat.invoked` + actor metadata + run id).
5. Keep `/api/agents/{id}/resume` board-only (no change).

This addendum intentionally narrows scope to wake/invoke routes required for incident recovery and avoids introducing broad mutation rights.

## Why `tasks:assign`

- It already exists in the current permission model and is explicitly granted to Ops Watchdog in this company.
- It avoids introducing a new global permission key during active incident handling.
- It stays revocable and auditable through existing access APIs.

## Guardrail Requirements

Backend implementation must include:
- a shared route-level authz helper used by both wake endpoints;
- explicit 403 for non-self agent callers without `tasks:assign`;
- test coverage for:
  - self-wake allowed,
  - non-self wake denied without grant,
  - non-self wake allowed with grant,
  - audit event still emitted with caller actor context.

## QA Acceptance Matrix

- Ops Watchdog token can wake at least one non-self target via approved wake path (2xx).
- A non-privileged agent token still gets 403 on non-self target.
- Evidence comment posted on [DUB-359](/DUB/issues/DUB-359) with endpoint, target, HTTP result, and timestamp.

## Follow-up

If scope-based narrowing is required beyond `tasks:assign`, add a dedicated wake permission (for example `agents:wake:others`) in a follow-up change with migration + validator updates.
