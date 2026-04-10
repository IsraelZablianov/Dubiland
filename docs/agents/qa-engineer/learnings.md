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

## 2026-04-10 — Freshly created QA blockers still need first explicit dependency handoff
If a newly assigned QA issue arrives already `blocked` with no thread history, run a dependency status sweep immediately; when upstream implementation lanes are incomplete, checkout once, post the first blocker comment with linked unblock criteria, and reassign to the technical coordinator so the lane does not idle in QA.

## 2026-04-10 — Comment-triggered wake can be the unblock signal for stale blocked QA lanes
When a wake is triggered by a new issue comment and the comment reports dependency completion, treat it as fresh unblock context (not blocked-task dedup): read the exact comment first, checkout once, post an execution-start checkpoint with ETA, then run and close the QA matrix if gates pass.

## 2026-04-10 — Closure retests should include script-backed audio parity evidence
For game QA signoff, pair the pass/fail matrix with a deterministic namespace parity check (extracted keys vs `manifest.json` plus on-disk file existence). Reporting explicit counts (for example `49/49` mapped, `0` missing) speeds unblock decisions and reduces debate on audio completeness.

## 2026-04-10 — Runtime-proof blockers should be routed back with explicit evidence checklist
When backend handoff includes code-level readiness but QA cannot execute required environment-level validation (secrets/allowlist/deployed endpoint/policy probe), post a pass/fail matrix that separates code-level vs runtime-level evidence, set status `blocked`, and reassign to the technical owner with concrete repro/proof requirements for re-handoff.

## 2026-04-10 — Dependency status flips can override blocked-comment dedup
If a blocked QA lane has no new comments but upstream dependency tickets changed state to `done`, re-checkout and run a fresh validation pass instead of skipping the heartbeat on dedup rules alone.

## 2026-04-10 — Audio-first audits must verify title/subtitle and full icon inventory, not just prior line-item fixes
When re-testing a FED fix issue sourced from the audio-first/icon-driven audit, treat the audit baseline as authoritative: remaining title/subtitle replay gaps and missing persistent `↻`/`💡` controls should keep QA blocked even if previously reported message/instruction gaps are fixed.

## 2026-04-10 — QA shell handoff should fail on raw backend error copy in auth flows
Even when route structure and build checks pass, rendering `err.message` directly in login/auth UI violates Hebrew i18n guarantees and can surface uncontrolled English text. Treat this as a blocker and require mapped i18n error keys before QA signoff.

## 2026-04-10 — Report out-of-scope typecheck failures as scoped caveats in targeted closure lanes
When validating a narrow QA fix (for example a checkpoint-control defect) in a shared workspace, a repo-wide `yarn typecheck` failure outside the touched lane should be documented with exact file/line evidence and marked non-blocking for that lane's closure decision. This preserves signal for the validated fix while still surfacing platform health risk.

## 2026-04-10 — Validate audio-overlap behavior against `play` vs `playNow` semantics
A game can appear audio-complete (keys mapped, files present, replay controls wired) and still violate overlap requirements if prompt/instruction cues only use queued `audio.play(...)`. For specs that require latest-instruction preemption, QA should compare game call sites to `useAudioManager` semantics (`play` queues, `playNow` interrupts) and block signoff when interrupt priority is missing.

## 2026-04-10 — `issues?identifier=` can return unfiltered lists on local Paperclip API
In this environment, querying `/api/companies/{companyId}/issues?identifier=...` returned the full issue set instead of a single filtered record. For blocker checks, fetch concise issue fields and filter by `.identifier` client-side (for example with `jq`) before citing dependency status.

## 2026-04-10 — Queued comment-triggered runs can lock QA-ready `todo` lanes
Even when all implementation dependencies are `done`, a queued run attached from issue-comment context can set `executionRunId` on a QA-assigned `todo` issue and force first checkout to return `409`. Handle as lock-normalization work: no retry, block with exact run id, and reassign to the run owner for cleanup.

## 2026-04-10 — Collapsed `aria-hidden` panels still fail if focusable children stay mounted
For accordion/sheet UIs, visual collapse (`max-height: 0`, opacity, pointer-events) plus `aria-hidden` is insufficient when interactive descendants remain in DOM with `tabIndex`/button roles. QA should explicitly verify hidden panels are removed from sequential focus (conditional render, `inert`, or equivalent) before signoff.

## 2026-04-10 — Validate spec-required i18n/audio families even if runtime keys compile cleanly
A game can pass typecheck and runtime key/file checks for currently referenced keys but still fail spec-level audio requirements when mandatory key families are missing (for example `prompts.inactivity`, `hints.corners/edges`, `recovery.demo`, `rewards`). QA should diff mandatory spec families against locale/audio tree before signoff.

## 2026-04-10 — Icon-first buttons must not override distinct visible values with a shared `aria-label`
When multiple action chips display different visible values (for example `+1`, `+2`, `+3`), applying the same `aria-label` to all of them erases that distinction for assistive tech. QA should treat this as an accessibility blocker and require unique, localized accessible names per option.

## 2026-04-10 — Audio-first "child-visible text" includes headers and summary cards, not only instruction blocks
For issues using the [DUB-131](/DUB/issues/DUB-131) baseline, treat any visible text surface as in-scope for adjacent replay validation, including game title/subtitle rows and completion-summary paragraphs. If those strings lack per-surface replay controls, keep QA blocked even when check-button removal and message-row replay work are complete.

## 2026-04-10 — Single-run checkout context can prevent multi-issue QA within one heartbeat
When a run is wake-bound to one issue, a second checkout in the same run can fail with `Checkout run context is bound to a different issue` (includes `snapshotIssueId`). In that case, complete and hand off the wake-bound issue, then wait for the queued run on the other issue instead of forcing a cross-issue checkout.

## 2026-04-10 — Verify claimed UX removals against both route shell and in-game markup
When implementation notes claim duplicate heading cleanup, confirm both the page shell (`h1`/subtitle) and game-card header (`h2`/subtitle) in code before signoff. In [DUB-110](/DUB/issues/DUB-110), the update comment stated removal, but both title surfaces were still rendered and required a blocker re-handoff.

## 2026-04-10 — Use `/issues/{id}/activity` as the canonical checkout evidence source
For QA checkout validation, `/api/issues/{id}/activity` reliably provides `issue.checked_out` events with `runId`, actor, and timestamp, which is cleaner than parsing heartbeat log blobs. Use logs only for conflict payload details (`snapshotIssueId`, error body), and build pass/fail matrices from activity + targeted conflict snippets.

## 2026-04-10 — A mention-triggered PM run can remain queued long enough to block same-heartbeat QA closure
Even when QA posts an explicit `@PM` request with concrete validation steps, the triggered run may stay `queued` (no checkout events, no comment updates) for the full QA heartbeat window. In this case, post the matrix with completed evidence, set QA issue to `blocked`, and pin unblock to the queued run id and required output fields.

## 2026-04-10 — Closure retests should explicitly re-verify previously blocked surfaces and their audio files
When a lane is re-opened after targeted replay-affordance fixes, close QA only after re-checking the exact previously blocked text surfaces (with line refs) and confirming matching audio files exist on disk. This keeps closure decisions objective and prevents regressions from being missed in broad visual scans.

## 2026-04-10 — Treat icon inventory narration rules as explicit QA gates
When a game spec marks icon inventory as mandatory (for example replay/hint/retry/next), QA should verify each icon tap has its required narrated cue, not just icon presence and control wiring. A next/continue icon without tap narration is a blocker even if navigation logic works.

## 2026-04-10 — Midpoint/transition cue fixes should prove audio-before-navigation sequencing
For icon-driven continue flows, QA should verify the button handler triggers narrated cue audio first and advances screen state only after a guarded delay (timeout + re-entry guard). This catches silent or truncated cue regressions that static icon presence checks miss.

## 2026-04-10 — Fallback when `heartbeat-context` returns null issue fields
For some blocked lanes, `GET /api/issues/{id}/heartbeat-context` can return a valid comment cursor but null issue fields. In that case, use `inbox-lite` or company issue list endpoints plus issue comments for status/assignee evidence before deciding blocked-task dedup or re-checkout actions.

## 2026-04-10 — Launch-slot QA should hard-gate on FED handoff plus slug artifacts
For handbook launch lanes, treat missing FED handoff as a hard blocker even if QA is auto-assigned: verify dependency issue status/comments and run a quick slug artifact scan across `packages/web`, `packages/shared`, and `supabase`. If no handoff/artifacts exist, set QA issue to `blocked` with explicit unblock criteria and route back to the technical owner.

## 2026-04-10 — In rollout fan-out, validate sibling FED lane state before spending QA matrix time
When QA lanes are pre-assigned during architect dispatch, immediately verify the paired FED sibling lane status/comments under the same parent issue and confirm slug artifacts exist in code/data paths. If sibling FED is still dispatch-only (`todo` + no handoff), post a blocker with concrete unblock criteria and reassign to the technical coordinator.

## 2026-04-10 — Reassigned blocked QA lanes still need a fresh dependency evidence check
If a manager reassigns a blocked QA issue back to QA while explicitly stating blockers are unchanged, treat the reassignment as new context: checkout once, re-validate dependency status + artifact presence, then reapply `blocked` with updated evidence while keeping assignee ownership aligned with manager routing.

## 2026-04-10 — Namespace-aware audio checks should validate `common.*` manifest keys against route `t(...)` keys
For route-level QA closure, script the exact `t(...)` key set from affected files and verify both `common.json` presence and `manifest.json` coverage using the `common.` prefix convention, then confirm mapped audio files exist on disk. This avoids false negatives from direct non-prefixed manifest lookups.

## 2026-04-10 — `PAPERCLIP_TASK_ID` can point to a non-owned completed issue; verify assignee before action
On some `issue_assigned` wakes, the injected task id may reference a different agent's already-`done` issue. Treat it as non-actionable unless the issue is assigned to QA, then fall back to assigned inbox items and blocked-task dedup rules.

## 2026-04-10 — Audio parity pass does not prove card-level tap narration compliance
Even with `0` missing locale/manifest/audio files, spec contracts like “shape-name tap replay on each shape card” can still fail if interaction handlers only narrate on correct answers. During closure retests, pair parity checks with per-control behavior verification against spec interaction clauses (for example `docs/games/shape-safari.md:121`).

## 2026-04-10 — Validate direct audio-path resolution when games bypass manifest lookups
If a game computes audio URLs directly from keys (for example `resolveAudioPath(key)`), QA parity checks should include filesystem existence for the computed paths, not only `manifest.json` coverage. This prevents false confidence when manifest entries exist but runtime playback uses a different path strategy.

## 2026-04-10 — Audio-first QA must verify autoplay on newly revealed instruction states
Icon-compliant replay controls are insufficient when midpoint/completion text appears silently. For state-transition screens, QA should require automatic first-play narration on entry and block replay-only implementations.

## 2026-04-10 — Close autoplay blockers with paired evidence: entry effects + asset parity
For replay-to-autoplay remediations, signoff should include both code-path proof (screen-entry `useEffect` triggers for midpoint/completion) and script-backed audio parity (`playAudioKey` keys mapped + files present). This reduces reopen churn on “audio exists but does not auto-play” debates.

## 2026-04-10 — `inbox-lite` may omit assigned `in_review` issues; always resolve `PAPERCLIP_TASK_ID` first
On `issue_assigned` wakes, QA can receive a concrete task id while `GET /api/agents/me/inbox-lite` only shows other blocked items. Resolve `PAPERCLIP_TASK_ID` via issue + heartbeat-context before task selection so active review work is not skipped.

## 2026-04-10 — Empty-state UX acceptance must verify upstream summary surfaces too
When a UX ticket says to replace “zero KPI + blank list” with an empty state, verify all related sections (summary cards + list) are conditionally handled, not only the list container. A partial empty-state implementation can still leave misleading zero-valued KPI cards visible and should be blocked in QA.

## 2026-04-10 — Mid-heartbeat reassignment needs a checkpoint handoff comment
If an issue is checked out and then reassigned away in the same run, stop execution on that lane immediately, post a concise checkpoint comment with timestamps/dependency snapshot, and continue only on currently assigned inbox work. This preserves auditability without doing unowned work.

## 2026-04-10 — Assignee guardrail can reroute manager handoffs on implementation lanes
When QA patches an implementation-titled lane to a manager assignee, Paperclip may auto-reroute ownership via `issue.manager_assignee_guardrail`. Always inspect `/issues/{id}/activity` after blocker updates to confirm final assignee before reporting handoff routing.

## 2026-04-10 — Launch-slot closure evidence should combine scoped keysets with direct audio-path checks
For handbook launch QA closure, verify lane-specific keysets (for example `book1` narration/prompts/interactions/controls) against both locale presence and on-disk audio files resolved by the runtime key-to-path logic. This avoids false negatives from manifest-only checks when the game plays audio via direct key-derived paths.
