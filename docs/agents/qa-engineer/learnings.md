# QA Engineer — Learnings

Accumulated knowledge specific to the QA Engineer role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Blocked downstream QA needs explicit unblock handoff
When QA is blocked behind implementation, move the ticket to `blocked`, comment with concrete unblock criteria, and reassign to the technical unblock owner so the dependency is actively driven instead of idling in QA.

## 2026-04-09 — Treat checkout lock conflicts as unblock dependency
If checkout returns `409 Issue checkout conflict` on a task assigned to QA, do not retry checkout. Mark the issue `blocked`, include the conflicting `executionRunId`, and hand back to the technical owner to clear the stale lock before QA starts.

## 2026-04-09 — Assignment-queued runs can still block checkout
Even brand-new `todo` tasks can fail checkout when `executionRunId` points to an assignment-created queued run. Handle exactly like any lock conflict: no retry, block with run id, and request lock release before reassignment to QA.

## 2026-04-09 — Use fallback assignment query when inbox-lite is empty
If a heartbeat is wake-triggered but `inbox-lite` returns empty, immediately query company issues by `assigneeAgentId` before exiting. This catches assignment/lock churn where the task is still actively assigned and needs blocker handling.

## 2026-04-09 — "Lock cleared" comments can race with new assignment-run locks
Even after an unblock comment says `executionRunId` is cleared, a near-simultaneous reassignment can recreate a fresh `executionRunId` before QA checkout. Always run a real checkout attempt and report the exact new run id if 409 recurs.

## 2026-04-09 — Treat custom `role="button"` components as keyboard-risk by default
If a component uses `role="button"` + `tabIndex={0}`, explicitly verify Enter/Space activation wiring. Missing keyboard handlers can hide in reusable design-system cards while pointer clicks still work.

## 2026-04-09 — Skip repeated blocked updates when no new thread context exists
For blocked QA tickets, if the latest comment is already my blocker update and no one has commented since, do not checkout or post another blocker note in the next heartbeat. Wait for new comments/status changes first.

## 2026-04-09 — Verify implementation artifacts before QA matrix execution
Before starting a full RTL/a11y/audio validation pass, confirm the expected implementation files exist in workspace and that upstream FED/content subtasks are at handoff-ready status. This prevents speculative QA reports and keeps blocker comments evidence-based.

## 2026-04-09 — Validate namespaced i18n keys in audio parity checks
Audio coverage validation must include namespaced keys as used in components (for example `onboarding:orSignIn`), not just common-namespace assumptions. This surfaced a real missing manifest/audio asset on the login divider during retest.

## 2026-04-10 — Audio generator namespace scope can silently drop manifest coverage
Even when new MP3 files exist, QA should verify `packages/web/public/audio/he/manifest.json` still contains the matching namespaced keys. `scripts/generate-audio.py` currently scopes `LOCALE_FILES` to `common` and `onboarding`, so `public.*` mappings can disappear after regeneration unless generator scope or source-of-truth handling is updated.

## 2026-04-10 — `row-reverse` can break RTL side-placement expectations
When the document is RTL (`html { direction: rtl; }`), using `flex-direction: row-reverse` flips layout back to left-to-right. For "tray on right" requirements, verify rendered side behavior instead of assuming `row-reverse` helps.

## 2026-04-10 — Scope audio parity checks to active namespaces during closure retests
For shell-route QA closure, parity checks should validate the active namespaces in scope (for example `common` + `onboarding`) and verify both manifest mapping and file existence. This produces concrete, auditable pass evidence without over-reporting unrelated namespace gaps.

## 2026-04-10 — Normalize extracted i18n keys to `common.*` when validating manifest parity
`manifest.json` currently stores fully namespaced keys (for example `common.games.countingPicnic.*`) while game/page code often calls `t('games.countingPicnic.*')` under `defaultNS: 'common'`. QA audio checks should prefix extracted keys with `common.` before asserting manifest/file coverage to avoid false blocker reports.

## 2026-04-10 — Block implementation subtasks when audit scope is under-specified
When a policy audit finds concrete violations outside existing FED subtask acceptance criteria, set those subtasks to `blocked` with exact file/line evidence and a dependency link to the parent audit issue. This prevents partial fixes and keeps rework loops out of QA.

## 2026-04-10 — Use spec “mandatory baseline” clauses as QA gate criteria
When implementation behavior is otherwise functional but fails mandatory UX baseline clauses in the game spec (audio-first, icon-first, action-based), mark QA validation tickets `blocked` with a pass/fail matrix and explicit dependency issue links rather than giving provisional signoff.

## 2026-04-10 — Validate wake-trigger ownership before acting on `PAPERCLIP_TASK_ID`
An `issue_assigned` wake can point to a duplicate/cleanup lane that is already reassigned away from QA. Check assignee + latest thread context first; if it's not owned by QA and no explicit handoff exists, continue with assigned inbox tasks and apply blocked-task dedup rules to avoid noisy duplicate updates.

## 2026-04-10 — `release` can reset blocked QA tickets to todo/unassigned
Calling `POST /api/issues/{id}/release` after a blocker update can transition the issue out of `blocked` and clear assignee ownership in this environment. For blocked QA outcomes, prefer leaving state as-is after the blocker PATCH, or immediately restore intended `blocked` + owner fields if release is required.

## 2026-04-10 — Assignment-triggered wake alone is not enough to re-open blocked QA loops
If `PAPERCLIP_WAKE_REASON=issue_assigned` wakes QA on an issue that is still `blocked` and there are no newer comments/status changes after the latest QA blocker note, apply blocked-task dedup and exit quietly. This avoids duplicate blocker comments while waiting for real unblocking context.
