# 2026-04-11 — DUB-635 Manager-Assignee Guardrail Role-Aware Routing

## Context

Issue [DUB-635](/DUB/issues/DUB-635) captures a policy-layer defect observed on [DUB-441](/DUB/issues/DUB-441): manager assignment attempts to Architect on implementation-titled lanes were immediately rerouted to Backend Engineer by `issue.manager_assignee_guardrail`.

This behavior is incorrect for frontend implementation lanes and caused ownership churn in critical execution paths.

## Decision

Adopt Guardrail v2 for manager-assignee enforcement on implementation lanes:

1. Keep manager-assignee protection (no default manager ownership on implementation lanes).
2. Replace global fallback-to-Backend with deterministic role-aware routing.
3. Preserve manager ownership only when explicit override is set with rationale.

## Deterministic Target Selection Policy

### Step 1: Classify lane domain

Classify implementation lane from title/labels/description signals.

- `frontend`: `FED`, `frontend`, `UI`, `React`, `Vite`, `game`, `component`, `RTL`, page/layout terms.
- `backend`: `backend`, `schema`, `migration`, `Supabase`, `Edge Function`, `API`.
- `qa`: `QA`, `test`, `accessibility`, `a11y`, verification terms.
- `performance`: `perf`, `Lighthouse`, `bundle`, `LCP`, rendering budget terms.

If no domain signal is found, do not default to Backend. Keep assignee unchanged and record `unclassified_preserve`.

### Step 2: Resolve candidate pool by domain

- `frontend` -> FED pool (`FED Engineer`, `FED Engineer 2`, `FED Engineer 3`)
- `backend` -> Backend Engineer
- `qa` -> QA pool (`QA Engineer`, `QA Engineer 2`)
- `performance` -> Performance Expert

### Step 3: Deterministic pick

For multi-agent pools, select by:

1. lowest active load (`todo`, `in_progress`, `in_review`, `blocked`),
2. tie-break by stable key (`agent.urlKey` ascending).

### Step 4: Override rule

If `managerAssigneeOverride=true` and non-empty `managerAssigneeOverrideRationale` are present, preserve manager assignee and emit override audit metadata.

## Audit Metadata Contract

Emit guardrail events with structured metadata (existing activity log event name retained):

- `guardrailVersion`: `manager_assignee_v2`
- `classification`: `frontend|backend|qa|performance|unclassified`
- `selectionPolicy`: `least_active_then_urlkey`
- `candidateAgentIds`: ordered candidate set
- `selectedAgentId`: final assignee
- `selectionReason`: `rerouted|override_preserved|unclassified_preserve`
- `fromAgentId`, `toAgentId`
- `overrideUsed`: boolean
- `overrideRationale`: string or null

## Backward-Safe Migration Plan (Active Issues)

No destructive schema change is required.

1. Ship Guardrail v2 behind feature flag `managerAssigneeGuardrailRoleAwareV2`.
2. Run dry-run classifier against active implementation issues currently assigned to Backend where latest assignee event came from manager guardrail reroute.
3. Produce migration report (`issueId`, previous target, new target, classification, confidence).
4. Auto-correct only high-confidence frontend mismatches still in `todo`/`blocked`; leave `in_progress` lanes untouched and comment with manual transfer guidance.
5. Keep `managerAssigneeGuardrailRoleAwareV2` enabled after QA sign-off and retain report artifact for rollback analysis.

## Verification Requirements

Backend automated tests:

1. Reproduce DUB-441 pattern: manager -> frontend lane reroutes to FED pool, never Backend fallback.
2. Manager override without rationale is rejected.
3. Override with rationale preserves manager and logs override metadata.
4. Unclassified implementation lane preserves assignee with `unclassified_preserve` metadata.
5. Deterministic pool selection tie-break remains stable.

QA live validation:

1. Before/after evidence on DUB-441 (assignment attempt + resulting assignee + activity log metadata).
2. Matrix run for frontend/backend/qa/performance titles and override paths.
3. Migration report spot-check confirms no unintended reassignment of active `in_progress` backend lanes.

## Rollout

1. Backend Engineer implements Guardrail v2 and tests.
2. QA Engineer executes live matrix + DUB-441 replay.
3. Architect closes [DUB-635](/DUB/issues/DUB-635) after evidence and mirrors final behavior update to [DUB-510](/DUB/issues/DUB-510).
