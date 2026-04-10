# 2026-04-10 — Watchdog Cross-Agent Recovery Authorization

## Context

Ops Watchdog currently cannot safely execute cross-agent recovery actions (`resume`, `heartbeat/invoke`) due authorization boundaries. Directly granting broad agent-to-agent mutation capability would violate least privilege and increase blast radius.

Related issues:
- [DUB-89](/DUB/issues/DUB-89)
- [DUB-107](/DUB/issues/DUB-107)
- [DUB-105](/DUB/issues/DUB-105)

## Options Considered

1. Capability-grant model (watchdog gets direct cross-agent permissions)
- Pros: fewer hops, simpler call path.
- Cons: broad permission surface, harder to constrain and audit, higher misuse risk.

2. Board-privileged recovery gateway (recommended)
- Pros: strict trust boundary, explicit allowlist, auditable, safer default.
- Cons: one extra service hop and contract to maintain.

## Decision

Adopt **Option 2**: watchdog requests recovery through a board-privileged automation endpoint, not direct cross-agent mutation rights.

## Proposed API Surface

### `POST /api/automation/recovery-actions`

Creates a recovery request and executes approved actions through privileged service context.

Request:

```json
{
  "requestedByAgentId": "57030338-c341-45ee-ad6b-60a28cc9852b",
  "targetAgentId": "5f7a9323-368f-439d-b3a8-62cda910830b",
  "action": "resume_and_invoke",
  "reason": "stalled execution lock",
  "idempotencyKey": "uuid"
}
```

Response:

```json
{
  "id": "uuid",
  "status": "accepted",
  "targetAgentId": "5f7a9323-368f-439d-b3a8-62cda910830b",
  "action": "resume_and_invoke"
}
```

### `GET /api/automation/recovery-actions/{id}`

Returns request status, decision trace, and execution metadata for audit/debug.

## Authorization Model

- Watchdog can only create recovery requests for approved actions.
- Privileged gateway enforces:
  - action allowlist (`resume`, `heartbeat/invoke`)
  - target allowlist (configured agents/groups)
  - per-agent and global rate limits
  - loop protection (same target+action backoff window)
- Direct watchdog access to cross-agent mutation endpoints remains denied.

## Audit and Data Model

Persist each action in a dedicated audit table/log record:

- `id`
- `requested_by_agent_id`
- `target_agent_id`
- `action`
- `reason`
- `idempotency_key`
- `decision` (`allowed`/`denied`)
- `decision_reason`
- `invoked_run_id` (nullable)
- `created_at`, `completed_at`

## Rollout Plan

1. Implement gateway endpoint behind feature flag `watchdog_recovery_gateway`.
2. Implement Backend lane [DUB-142](/DUB/issues/DUB-142).
3. Add QA verification lane [DUB-144](/DUB/issues/DUB-144) for allow/deny and audit coverage.
4. Route watchdog recovery workflow to gateway only.
5. Remove any temporary direct cross-agent grants.

## Canonical Lane Routing (DUB-163)

This section is the coordination contract for cross-agent wake remediation and lock-conflict handling.

- Canonical CTO coordination lane: [DUB-163](/DUB/issues/DUB-163)
- Incident/source lanes: [DUB-89](/DUB/issues/DUB-89), [DUB-107](/DUB/issues/DUB-107)
- Lock-clear unblock lane (Ops + board-gated controls): [DUB-164](/DUB/issues/DUB-164)
- Backend implementation lane: [DUB-142](/DUB/issues/DUB-142)
- QA validation lane: [DUB-144](/DUB/issues/DUB-144)

### Lane State Matrix (2026-04-10)

| Lane | Owner | Current state | Next required event |
| --- | --- | --- | --- |
| [DUB-164](/DUB/issues/DUB-164) | Ops Watchdog | `in_progress` | Post completion evidence for board-gated lock cleanup |
| [DUB-142](/DUB/issues/DUB-142) | Backend Engineer | `todo` | Checkout and implement gateway endpoint + audit log path |
| [DUB-144](/DUB/issues/DUB-144) | QA Engineer | `blocked` | Start after backend implementation is ready |
| [DUB-162](/DUB/issues/DUB-162) | Architect | `blocked` | Resume only after DUB-164 completion evidence is posted |
| [DUB-98](/DUB/issues/DUB-98) | Architect | `blocked` | Resume only after DUB-164 completion evidence is posted |
| [DUB-85](/DUB/issues/DUB-85) | Architect | `blocked` | Resume only after DUB-164 completion evidence is posted |
| [DUB-141](/DUB/issues/DUB-141) | Architect | `done` | No further action (retain as historical confirmation) |

### Lock-Conflict Routing Rule

When a lane is blocked by stale run metadata or board-gated permissions:

1. Do not retry checkout after an initial `409`.
2. Record blocker once in the affected lane and route all further unblock work through [DUB-164](/DUB/issues/DUB-164).
3. Keep implementation and QA activity in [DUB-142](/DUB/issues/DUB-142) and [DUB-144](/DUB/issues/DUB-144), not in incident lanes.
4. Use [DUB-163](/DUB/issues/DUB-163) as the only canonical cross-lane status feed.

## Risks and Mitigations

- Risk: gateway abuse or retry loops.
  - Mitigation: idempotency keys, rate limits, backoff windows, explicit deny reasons.
- Risk: operational delays due extra hop.
  - Mitigation: narrow endpoint, lightweight execution, observable audit records.
- Risk: partial rollout confusion.
  - Mitigation: feature flag with staged enablement and documented fallback.

## Ownership and ETA

- Architecture and contract owner: Architect (2026-04-10)
- Implementation owner: Backend Engineer via [DUB-142](/DUB/issues/DUB-142) (target 2026-04-10)
- Validation owner: QA Engineer via [DUB-144](/DUB/issues/DUB-144) (target 2026-04-11)
