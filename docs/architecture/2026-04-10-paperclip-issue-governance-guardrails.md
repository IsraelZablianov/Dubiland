# 2026-04-10 — Paperclip Issue Governance Guardrails

## Context

Two recurring operational defects are blocking execution throughput:

1. Lock contamination on issues (`executionRunId` / `checkoutRunId`) causing first-attempt checkout `409` loops.
2. Manager-assignment drift where PM/manager ends up owning implementation lanes that should default to IC roles.

Related escalation lanes: [DUB-266](/DUB/issues/DUB-266), [DUB-267](/DUB/issues/DUB-267), [DUB-274](/DUB/issues/DUB-274), [DUB-276](/DUB/issues/DUB-276).

Existing patch references in this repo:

- `contrib/paperclip-DUB-204-full.patch`
- `contrib/paperclip-DUB-234-hard-guard.patch`
- `contrib/paperclip-DUB-270-heartbeat-hotfix-vs-2026.403.0.patch`

## Decision A — Lock Attachment Invariants (Execution/Checkout)

Enforce these invariants in Paperclip server issue lifecycle paths (`heartbeat`, `issues.checkout`, run adoption/reattachment):

1. A run may attach lock fields to an issue only when `run.contextSnapshot.issueId === issue.id`.
2. Legacy run adoption must be agent-scoped (same assignee/actor) and company-scoped.
3. Queued runs must not eagerly attach `executionRunId`; attach only on actual claim/start of the run.
4. When discovering an active run whose snapshot issue does not match the issue row, clear lock linkage and treat as non-authoritative.
5. Checkout must reject actor runs whose snapshot is bound to a different issue.

### Expected impact

- Eliminates recurring `active_unrelated` and `checkout_mismatch` contamination classes.
- Stabilizes first-attempt checkout behavior for assignees.

## Decision B — Manager Assignment Guardrail for Implementation Lanes

For newly created implementation issues, apply default assignee routing away from manager roles.

### Rule

If issue is classified as implementation lane (for example prefix/tag/type contains `FED`, `Backend`, `QA`, `Performance`, or similar execution-class tags), and assignee resolves to a manager role (`ceo`, `cto`, PM-like manager), then:

1. Auto-route to mapped IC role owner (or mapped pool balancing policy).
2. Record assignment provenance in issue history (guardrail-applied event).
3. Allow manager assignment only with explicit override flag + required rationale string.

### Expected impact

- Prevents immediate manager ownership drift on new execution lanes.
- Preserves intentional exceptions with auditable override.

## Verification Plan

1. Backend tests:
   - checkout run context mismatch is rejected.
   - legacy run adoption cannot reattach unrelated agent/run.
   - queued-to-running lifecycle does not poison issue lock fields.
   - manager-assignment guardrail auto-routes implementation lanes.
   - override path works only with explicit rationale.
2. QA validation:
   - before/after tables for contamination counters (`active_unrelated`, `checkout_mismatch`).
   - spot-check first-attempt checkout on previously impacted lanes.
   - create synthetic manager-assigned implementation lane and verify auto-reroute + audit log.

## Rollout

1. Apply backend patch set in Paperclip server with tests.
2. Deploy to staging and run targeted watchdog pass.
3. Validate counters and checkout stability over at least one full heartbeat cycle.
4. Roll to production and monitor for regression.
