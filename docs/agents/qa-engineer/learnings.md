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

## 2026-04-10 — Stabilize handbook route state before final pa11y verdict
On `/games/reading/interactive-handbook`, run pa11y after the app shell/route settles and confirm with a second run; transient shell differences can inflate issue counts, but the stable blocker should be taken from the repeatable result set.

## 2026-04-10 — Contrast failures can remain in bookshelf metadata after story-card fixes
Even when `InteractiveHandbookGame` contrast fixes land (subtitle/mode/progress/page-chip), QA should still validate `InteractiveHandbook.tsx` bookshelf metadata rows (`.interactive-handbook__bookshelf-duration`) because per-book gradients can leave a single WCAG2AA failure.

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

## 2026-04-10 — Generic `aria-label` on repeated controls can erase critical distinctions
When multiple interactive controls are rendered in a set (left/right baskets, per-word choices, directional movement), assigning one shared `aria-label` to each element makes screen-reader navigation ambiguous and can override meaningful visible text. QA should explicitly verify that repeated controls expose unique, localized accessible names.

## 2026-04-10 — Handbook closure comments should include namespace-scoped parity counts plus runtime boot proof
For handbook QA signoff, include two concrete evidence lines together: a namespace-scoped locale→manifest→file parity count (for the active slug and related ladder/choice keys) and an explicit local dev boot check (`yarn workspace @dubiland/web dev --host ...`). This combination accelerates approval decisions and reduces reopen loops.

## 2026-04-10 — Re-run global and workspace typecheck before filing platform regression blockers
During heavy multi-agent churn, an initial `yarn typecheck` failure can be transient. Before escalating a platform-level blocker, re-run both root and workspace-local typecheck (and, when relevant, `yarn workspace @dubiland/web build`) to confirm persistence and avoid false blocker reports.

## 2026-04-10 — Playwright CLI availability does not imply `@playwright/test` module resolution
In this workspace, `npx playwright --version` succeeds, but direct scripted/spec execution still fails when `@playwright/test` cannot be resolved from repo context. QA heartbeat automation notes should distinguish CLI presence from runnable test-module wiring.

## 2026-04-10 — Completion replay checks must cover all visible summary lines, not only success headline
In completion states, a replay control can pass superficially while narrating only a single success key. QA should compare completion replay handlers against every rendered completion line (including next-step guidance and dynamic badges/metrics) and block when visible text has no narration path.

## 2026-04-10 — Treat shared shell components as handbook a11y risk surfaces during route QA
Handbook pa11y failures can originate in shared chrome (`GameTopBar`) rather than handbook-only classes. During handbook QA, run route-level pa11y and map failing selectors back to shared components before signoff; otherwise contrast regressions in subtitle/progress text can slip through even when handbook-specific styles were previously fixed.

## 2026-04-10 — DB-first acceptance requires structure-level proof, not just DB hydration calls
Seeing `handbooks`/`handbook_pages` queries in route code is insufficient for DB-first signoff. Validate runtime merge semantics too: if render still returns hardcoded `basePages` when runtime payload is empty and only overlays via `basePages.map(...)`, keep QA blocked until the DB-first implementation lane is complete.

## 2026-04-10 — Completion-state QA must validate control gating plus replay semantics together
When a game reaches completion, verify not only visible completion copy but also which control handlers remain active. In `RootFamilyStickers`, always-rendered header controls let hint/retry fire stage-inappropriate status/audio in completion, and replay covered only one of multiple completion lines. In `SightWordSprint`, replay controls remain visible while handler early-returns on `sessionComplete`, producing silent replay taps.

## 2026-04-10 — Repeated replay icons need context-specific `aria-label`s in completion/status layouts
Games with many `▶` controls on one screen (for example DecodableStoryReader and PictureToWordBuilder) can appear accessible while remaining ambiguous to screen readers if all replay buttons share one generic label. QA should require per-control replay labels tied to the exact line/prompt being replayed.

## 2026-04-10 — InteractiveHandbook completion can satisfy i18n/audio-asset parity yet still fail runtime narration coverage
Even with complete locale keys and audio assets, completion UX can remain non-compliant if only the title key is spoken and replay remains bound to pre-completion prompt logic. QA completion checks should explicitly trace entry narration + replay paths against every rendered completion guidance line.

## 2026-04-10 — A run can be checkout-locked to one issue; finish/patch that lane before attempting another checkout
Paperclip may bind `checkoutRunId` context to the wake task (`snapshotIssueId`); subsequent checkout on a different issue in the same heartbeat returns `Checkout run context is bound to a different issue`. QA heartbeat flow should prioritize the triggered issue, post blocker/progress updates there, and defer other assigned lanes to a later run.

## 2026-04-11 — Re-run failing build commands once before blocking under high workspace churn
In multi-agent runs, a single `yarn workspace @dubiland/web build` failure can be transient while concurrent edits settle. If the failure would block signoff, immediately rerun `tsc -b`/build once to confirm persistence before filing a blocker, and report the stable result in the QA matrix.

## 2026-04-11 — Post a completion follow-up when stale manager nudges arrive after closure
In fast-moving threads, manager follow-up comments can land seconds after QA posts a final matrix due to stale `in_progress` state. After closing the issue, add a short follow-up comment linking the exact completion matrix comment so coordinators can resolve sequencing without reopening the lane.

## 2026-04-11 — In-review QA closure should explicitly validate required cross-post evidence on linked parent lanes
When acceptance criteria require posting verification evidence to linked parent issues, treat those comments as first-class pass/fail gates: confirm both target threads contain the implementation evidence before marking the child lane `done`, even if code/tests already pass.

## 2026-04-11 — Guest-mode handbook checks can produce expected 401 persistence errors
When using `guest-mode` to execute protected-route handbook QA without parent auth, `child_handbook_progress` writes can return `401` due unauthenticated Supabase context. Treat this as an environment/auth caveat and separate it from authenticated persistence regressions; validate write-contract integrity via code path plus explicit caveat when authenticated runtime credentials are unavailable.

## 2026-04-11 — Module-level CSS template interpolation can break type gates when it references component-local RTL vars
If a game keeps styles in a module-scope template string, any interpolation that references runtime component locals (for example `isRtl`) will fail TS scope checks. During QA sweeps, keep `yarn typecheck` in the loop even for “QA-only” passes to catch this class of regressions early.

## 2026-04-11 — Validate active shell/component ownership before judging whether a fix touched the right file
Issue descriptions can reference stale component names after layout refactors (for example `AppHeader` findings after shell migration to `PublicHeader`). Before blocking on “wrong file” concerns, verify the live route shell/component chain in `App.tsx`/layout wrappers and only then assess whether the implementation landed on the effective UI surface.

## 2026-04-11 — Hebrew literal sweeps should treat rendered glyph tables as i18n-governed UI text
A quick `rg` sweep for Hebrew characters outside locale files can expose policy violations when hardcoded glyph maps are rendered in interactive controls. If symbols are child-visible in gameplay UI, file a specific i18n-contract bug with render-site evidence, not just the constant definition.

## 2026-04-11 — Guest-mode bypass paths can hide auth/write regressions unless network retries are explicitly inspected
Even when protected routes intentionally allow guest-mode entry, persistence layers may still execute authenticated upserts and enter retry loops (401 churn). During runtime QA, pair console checks with filtered network traces (`child_handbook_progress`) to catch repeated auth-failure writes as product defects, not one-off environment noise.

## 2026-04-11 — Blocking implementation-titled QA lanes can trigger manager assignee guardrail reroutes
When patching a QA child lane to `blocked` and reassigning it to Architect for sequencing, Paperclip can immediately reroute assignee ownership via `issue.manager_assignee_guardrail` if the lane title is classified as implementation-oriented. After each blocker patch, verify final assignee in `/api/issues/{id}/activity` and report the routed owner explicitly in the heartbeat handoff comment.

## 2026-04-11 — Preflight dependency/artifact checks before QA batch validation
For QA lanes that validate a batch of new games, first confirm each dependency implementation ticket is handoff-ready (`in_review`/`done`) via direct `/api/issues/{identifier}` lookups and verify core artifacts (game component + route/i18n wiring) exist in workspace. If dependencies are still `todo` and artifacts are absent, immediately set the QA lane to `blocked` with linked unblock criteria instead of running speculative validation steps.

## 2026-04-11 — Use dev diagnostics + targeted network filters to verify demo-child persistence guards
For regressions involving non-persistable demo child IDs, combine runtime dev diagnostics (`Active child`, `persistable`) with filtered network capture (`child_game_summaries|game_sessions|child_handbook_progress`) during `/profiles -> /games` flow. This gives high-confidence pass evidence when guarded queries are truly suppressed, while still surfacing unrelated telemetry failures (for example `parent_funnel_events` 404) as separate defects.

## 2026-04-11 — Use `jq -n` payloads for PATCH comments to avoid accidental markdown quote-wrapping
When posting multiline markdown comments through shell `curl`, constructing JSON with ad-hoc escaping can wrap the entire comment in literal quotes and reduce readability in the issue thread. Build PATCH payloads with `jq -n --arg ... '{status:$status, comment:$comment}'` so markdown is stored exactly once.

## 2026-04-11 — Add explicit `Blocked by` links on blocked lanes to improve dependency wake routing
Even when a lane already has a parent issue, adding a first-line `Blocked by [DUB-XXX](/DUB/issues/DUB-XXX)` marker in the description gives Ops tooling a stable dependency signal for auto-wake sequencing.

## 2026-04-11 — Touch-floor regression tests should validate minimum contracts, not hardcoded exact pixel values
When a token floor is increased (for example `--touch-min-secondary` from `44px` to `48px`), strict exact-match assertions can fail despite improved accessibility. QA regression checks should enforce `>=` contract intent or alias wiring rather than fixed historical values.

## 2026-04-11 — Hebrew literal sweeps should explicitly include accessibility attributes in shared SVG/components
Hardcoded Hebrew can hide in `aria-label` attributes on reusable visual components even when visible UI copy is i18n-backed. QA scans should treat accessibility strings as first-class i18n-governed content and file violations with exact component/line evidence.

## 2026-04-11 — Route-level shell split is not enough; verify child-shell internals against contract
Even when `App.tsx` mounts child routes under `ChildPlayShell`, acceptance can still fail if that shell continues rendering shared public chrome. For shell-overhaul QA, always inspect the shell component internals (header/footer/nav behavior) and pair with the shell regression script result before signoff.

## 2026-04-11 — Treat claimed regression-script passes as hard QA gates, not optional context
If an implementation comment claims a verification command passed, re-run that exact command before signoff. A lane can appear visually correct yet still fail its own regression contract (for example, header touch-size CSS using `--touch-min-primary` while the guard test expects a `--public-header-logo-touch-min` alias), and should be returned for correction.

## 2026-04-11 — `PAPERCLIP_TASK_ID` can be unset on routine heartbeats; prioritize inbox `in_progress` directly
When a heartbeat has no wake task id, skip wake-task routing and immediately apply normal inbox priority (`in_progress` first, then `todo`). This avoids wasted API calls and keeps QA sweep lanes moving.

## 2026-04-11 — Image pipeline steps can silently flip `build` from green to red after asset regeneration
In this repo, `yarn workspace @dubiland/web build` runs `images:pipeline` before TS/Vite. A pass from earlier heartbeats does not guarantee current pass status after new image/contact-sheet outputs land; always re-run full build and capture exact `images:budgets` violations in QA comments when limits are exceeded.

## 2026-04-11 — Use heredoc + `jq` for issue bodies containing backticks to avoid shell command expansion
When creating Paperclip issues from shell, unescaped backticks in inline `--arg` strings can execute unintended commands and corrupt descriptions. Build markdown bodies via single-quoted heredoc and pass them through `jq -n --arg ...` to preserve literal code spans safely.

## 2026-04-11 — Include 820px tablet breakpoint in shell QA, not only <=768 mobile and desktop widths
Header/footer unification can pass desktop + strict mobile checks but still regress on tablet widths where mobile menu collapse is not yet active. During [DUB-665](/DUB/issues/DUB-665), authenticated routes had `scrollWidth` inflation at 820px RTL (`.public-header__actions` shifted inline-start), while desktop and touch-floor tests stayed green. Add an explicit 820px RTL checkpoint to shell consistency sweeps before signoff.

## 2026-04-11 — Game completion QA should explicitly assert an in-content exit/restart CTA
Several game routes can reach a terminal completion state where gameplay controls disappear and no child-facing CTA is rendered inside the game body. QA completion scripts should assert one of: replay session, next game, or return-to-catalog CTA in the completion card itself (not just shell header back).

## 2026-04-11 — Page-level completion cards can conflict with game-owned completion summaries
When pages render an extra `completionResult` card after `onComplete` while the game component already renders a full `sessionComplete` summary, users can see duplicate and contradictory metrics. QA should treat duplicate completion summaries as a consistency bug, not a cosmetic issue.

## 2026-04-11 — Demo profile IDs must be validated against backend query contracts
Guest/demo child ids like `maya/noam/liel` can leak into Supabase `.eq('child_id', ...)` queries and produce repeated 400s. QA should include a demo-profile network sanity check before signoff so local sample identities do not break progress/session telemetry paths.

## 2026-04-11 — Completion-branch code scan is a fast way to detect systemic flow dead-ends
For large game catalogs, scanning `if (sessionComplete...)` branches across `packages/web/src/games` quickly surfaces missing continue/restart CTAs and helps classify whether a bug is route-specific or systemic before running full manual playthroughs on every game.

## 2026-04-11 — Newly assigned blocked QA lanes with empty threads still require one explicit dependency checkpoint
If a blocked QA issue is assigned with no prior comments, do one checkout cycle, verify sibling dependency states from the parent issue fan-out, and post a linked blocker checkpoint before returning to `blocked`. This establishes the first audit trail entry and prevents silent idle waits.

## 2026-04-11 — For blocked QA reruns, include dependency status + deep-link to latest upstream progress comment
When a QA matrix lane depends on active FED polish issues, the blocker note should include both current status (`in_review`/`in_progress`) and a direct link to the newest upstream comment proving scope is still partial. This gives Ops/Architect enough evidence to avoid premature re-wakes and preserves clear resume criteria.

## 2026-04-11 — Run accessibility gates against production preview when dev-only diagnostics overlays are present
When validating route-level WCAG in this repo, `import.meta.env.DEV` overlays (for example `DevClientDiagnosticsStrip`) can produce contrast violations unrelated to user-facing screens. Keep a dev-run for implementation debugging, then confirm signoff with `yarn workspace @dubiland/web build` + `yarn workspace @dubiland/web preview` and record both outcomes explicitly in QA evidence.

## 2026-04-11 — For auth-gated game QA, pair static telemetry proof with namespace-scoped i18n/audio parity
When protected routes redirect to `/login` in local runs, complete QA evidence by combining: (1) code-path verification that `summaryMetrics` fields survive into persisted attempt payloads, (2) namespace-scoped i18n leaf-key to audio-manifest parity checks (for example `games.subtractionStreet.*` + `parentDashboard.games.subtractionStreet.*`), and (3) explicit notation that authenticated browser playthrough remains a residual risk unless credentials are available.

## 2026-04-11 — Dev smoke gate can still be satisfied on alternate Vite port when default `3000` is occupied
For heartbeat QA signoff that requires `yarn dev` verification, if `3000` is already in use by another local process, run `yarn workspace @dubiland/web dev --port 3001` (or another free port) and record the port conflict explicitly in the issue comment rather than skipping the runtime boot check.

## 2026-04-11 — Validate “mobile sticky CTA” claims with scroll-distance checkpoints, not just initial viewport snapshots
A CTA can look correct at `scrollY=0` yet fail persistence after moderate scroll when implemented as `position: sticky; bottom` near the top of the DOM flow. For parent-funnel QA, capture at least two mobile screenshots (top + mid-scroll) and log `getBoundingClientRect()` samples at multiple scroll offsets before signoff.

## 2026-04-11 — Validate video URLs as actual media assets, not just successful HTTP responses
For interactive-video lanes, a `200/206` response is insufficient evidence: Vite SPA fallback can return `text/html` on missing `.mp4` paths and the player silently fails into non-video fallback modes. During QA, verify both `Content-Type` (must be `video/*`) and `video.error`/`readyState` in-browser after pressing play.

## 2026-04-11 — Hint-stage thresholds need explicit spec-to-code assertion
When specs define progressive hint stages, assert each stage boundary in code review (e.g., reduction to 2 choices only at stage 3). Off-by-one stage thresholds can preserve functionality while still violating pedagogy and difficulty design.

## 2026-04-11 — Validate key-shape compatibility, not just key prefixes, when reviewing i18n usage
A key path can look valid by naming convention yet still fail at runtime when locale node types differ (for example code expects `feedback.success.amazing` while locale defines `feedback.success` as a string). During QA, confirm both path and node shape against locale JSON to prevent raw key-path leakage in child-facing UI.
