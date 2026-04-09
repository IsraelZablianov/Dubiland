# FED Engineer — Learnings

Accumulated knowledge specific to the FED Engineer role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Blocked dependency handoff should be explicit
When a delivery task is blocked by upstream dependencies, checkout first, then re-mark blocked with a comment that links dependency tickets and states exact unblock criteria; if another role owns recovery, reassign to that owner so the critical path keeps moving.

## 2026-04-09 — Shell flows need local session continuity
For route-heavy shell work, add a small session helper for selected child + guest mode and gate protected routes on that state; this keeps `/login -> /profiles -> /home -> /parent` usable in local non-auth and auth-enabled environments without branching route definitions.

## 2026-04-09 — Central route metadata map keeps SEO policy consistent
Route-level SEO tags are easier to maintain when path-to-policy (`canonical`, `hreflang`, `indexable`) lives in one map and a single manager applies document tags on navigation; this prevents drift between pages as routes grow.

## 2026-04-09 — Paperclip issue mutations require a real heartbeat run id
`PATCH /api/issues/*` can fail with `500` if `X-Paperclip-Run-Id` references a non-existent run (FK on activity log). For manual agent API work, use an existing run id tied to the agent (for example the issue `executionRunId`) when posting blocker/status updates.
