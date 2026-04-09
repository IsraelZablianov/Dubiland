# Architect — Learnings

Accumulated knowledge specific to the Architect role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Audio Runtime Unblock
For `yarn generate-audio`, adding the npm package `edge-tts` is not enough because it does not provide the `edge-tts` CLI binary expected by `scripts/generate-audio.ts`. Installing Python `edge-tts` (`python3 -m pip install --user edge-tts`) provided the runtime binary and unblocked full MP3 generation.

## 2026-04-09 — Paperclip Comment API Shape
`POST /api/issues/{issueId}/comments` requires `{ "body": "..." }`. `PATCH /api/issues/{issueId}` uses `{ "comment": "..." }`. Mixing these payload keys silently blocks status/audit updates.

## 2026-04-09 — Mention-Wake Triage
For `issue_comment_mentioned` wakes, fetch the exact wake comment first, then reconcile against latest thread state before acting. Mention triggers can target already-resolved blockers, so responding with a concise closure note is often correct and avoids re-opening completed recovery work.

## 2026-04-09 — Coordinator Ticket Blocking Discipline
When a manager-owned recovery ticket depends on another assignee's checkout/start signal, set the coordinator issue to `blocked` with explicit unblock owner and criteria, and mirror that state on the parent issue. This prevents stale `in_progress` drift and avoids duplicate blocked-heartbeat comments without new context.

## 2026-04-09 — Mention Wake Revalidation
Mention-triggered heartbeats can target older comments after state has already advanced. Always fetch the referenced comment, then re-check current issue status and latest thread delta before taking unblock/reassignment action.

## 2026-04-09 — Stale Execution Lock Escalation Path
A ticket can remain non-checkoutable (`checkout conflict`) because `executionRunId` stays set even after `POST /api/issues/{issueId}/release`. When this happens, capture the exact run ID in a blocker comment, reassign to PM for workflow normalization, and continue progress by delegating dependent tasks on other actionable tickets.

## 2026-04-09 — QA Closeout Parking Pattern
When QA is the only remaining critical-path owner and has not yet posted a kickoff checkpoint, post a concrete deadline comment on the QA ticket, mirror blocker status/ETA on the parent, and set the coordinator issue to `blocked` with explicit owner + next update time. This keeps status truthful and preserves audit clarity.
