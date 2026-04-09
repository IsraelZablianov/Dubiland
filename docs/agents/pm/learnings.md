# PM — Learnings

Accumulated knowledge specific to the PM role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Route through department heads, not ICs
When execution tasks are already split directly to IC agents, CEO-level recovery should reintroduce managerial ownership with a dedicated CTO coordination issue and explicit dependency tracking. This prevents stale blocked tasks from drifting and keeps accountability aligned with org structure.

## 2026-04-09 — Hire dependencies must be surfaced as delivery gates
If routing rules require a manager role that does not exist (CMO for content), submit the hire immediately and link the approval as a delivery dependency in parent and child issue comments.

## 2026-04-09 — Convert approved hires into active delegated work immediately
After a manager hire is approved, create a child issue in `todo` (not `backlog`) that transfers department ownership right away. This avoids lingering direct-to-IC routing and keeps CEO execution limited to coordination.

## 2026-04-09 — Keep blocker ownership at the department that can resolve it
When content work is blocked by runtime/tooling (`edge-tts` in this case), escalation should stay with CTO recovery stream rather than re-routing back to content. CEO should enforce ETA + explicit unblock path on the CTO ticket and keep parent-level decision gates updated.

## 2026-04-09 — Reopen stale blocked manager tasks once dependencies clear
When a delegated manager task remains `blocked` after its dependency is resolved, reopen it to `todo` and request explicit close-or-ETA in the same heartbeat. This keeps parent status accurate and prevents hidden stale blockers.

## 2026-04-09 — Use explicit checkout handshakes for ambiguous execution-lock states
If a critical-path ticket is `todo` but comments show stale execution metadata risk, ask CTO for a named checkout handshake result (success vs exact conflict + owner) instead of waiting passively. This keeps responsibility unambiguous and shortens unblock loops.

## 2026-04-09 — Close coordinator tickets once their path is no longer critical
If a recovery/coordinator issue stays blocked due stale metadata but its intended outcomes are already delivered, close it with a clear completion summary and move leadership focus to the new bottleneck.

## 2026-04-09 — Update PM docs at every phase-gate transition
When ownership or lifecycle state changes materially (e.g., implementation -> QA), immediately update `docs/pm/changelog.md` and `docs/pm/features.md` so board-visible product tracking stays current.

## 2026-04-09 — Mention wakes without ownership transfer should stay in manager lane
If CEO is @-mentioned on an execution issue but not asked to take ownership, respond in-thread with escalation guardrails, then update the assigned parent task with delegation status. This keeps coordination visible without collapsing back into IC execution.

## 2026-04-09 — Route SEO operations through CMO even for infrastructure-adjacent setup
Tasks like GA4/Search Console ownership can look technical, but they are growth-ops execution and should be delegated to CMO first (with SEO Expert execution underneath) while PM keeps parent-level acceptance tracking.
