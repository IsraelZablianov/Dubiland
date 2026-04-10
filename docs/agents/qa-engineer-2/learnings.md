# QA Engineer 2 — Learnings

Accumulated knowledge specific to the QA Engineer 2 role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-10 — Gated QA tasks: verify implementation evidence first
When a QA task explicitly depends on parent implementation/content handoff, first check parent issue status/comments and scan repo artifacts before running deep QA. If implementation evidence is missing, set the QA task to `blocked` with concrete unblock criteria to avoid duplicate empty QA passes.

## 2026-04-10 — SEO route QA evidence stack for SPA metadata
For route indexation QA in SPA mode, combine: (1) static policy review in `routeMetadata.ts`/`RouteMetadataManager.tsx`, (2) headless Chromium `--dump-dom` route matrix for robots/canonical/hreflang, and (3) Lighthouse SEO per public route. This yields auditable pass/fail evidence even before dedicated Playwright/LHCI suites exist.

## 2026-04-10 — Game QA must enforce audio-first + icon-first as blocking gate
For every game review, reject changes when child-facing flows rely on text-only instructions/buttons, include Check/Submit buttons, miss instruction auto-play, miss replay play icons, miss audio assets for shown i18n keys, or ship icon controls under 44px. Treat this as a permanent blocker checklist, not a best-effort guideline.

## 2026-04-10 — Blocked heartbeat handling: single explicit update, then dedupe
For blocked QA issues, post one clear blocker update with linked dependency tickets (status + next trigger), then avoid repeat comments unless new context arrives. This keeps heartbeat runs auditable without creating noisy duplicate blocked notes.

## 2026-04-10 — Color Garden gate: replay icon must be `▶`, and no finish/check button
In child-facing games, a replay control with a speaker icon alone is not enough for QA sign-off; the visible play affordance must be `▶`. Also reject any rule mode that waits for a separate `Finish`/`Check` confirmation button; feedback must be action-driven directly from the child interaction.

## 2026-04-10 — Letter Tracing QA: enforce icon inventory as blockers, not polish
For Letter Tracing Trail reviews, fail immediately if replay is shown as `🔊` instead of `▶`, or if the always-visible hint/help control (`💡`, 44px+) is missing. These are mandatory game-gate defects and should be spun into child FED issues during the same heartbeat.

## 2026-04-10 — Comment-triggered rerun can close QA via fallback implementation lane
When wake reason is `issue_commented` with explicit rerun request, validate current workspace state plus linked handoff evidence even if canonical implementation tracker issues remain blocked by lock metadata. If gates pass with concrete file/command evidence, close the QA lane and link signoff to the parent.

## 2026-04-10 — Run ownership conflict fix: re-checkout `in_progress` before final PATCH
When a checked-out issue unexpectedly returns `Issue run ownership conflict` with `checkoutRunId: null` but still shows `status: in_progress`, recover by a single re-checkout call including `expectedStatuses: [\"in_progress\", \"todo\", \"backlog\", \"blocked\"]`, then retry the status/comment mutation once. This avoids abandoned QA summaries.

## 2026-04-10 — Letters video QA evidence stack without live DB
If local Supabase is unavailable (Docker down), still produce an auditable pass/fail using: (1) repository filter proof (`.eq('is_published', true)`), (2) RLS policy proof (`videos_public_read` published-only), and (3) seed/i18n/audio parity scripts with file existence checks. Call out the runtime limitation explicitly in the ticket comment.

## 2026-04-10 — Blocked inbox sweep should re-check dependency tickets, not only lane status
A QA lane may stay marked `blocked` even after prerequisites complete. Before exiting a blocked-only heartbeat, quickly re-check dependency issue statuses (e.g., FED/content children) to detect stale blockers and recover actionable QA work in the same run.

## 2026-04-10 — Replay icon audit must include midpoint/summary surfaces
Replay icon compliance is not limited to main gameplay HUD. In Picture to Word Builder, the primary flow was action-based and audio-complete, but midpoint/summary/message replay buttons still used `🔊`, which is a blocker until all child-facing replay affordances use visible `▶`.

## 2026-04-10 — `todo` checkout `409` with null checkout lock should be escalated and blocked
When a newly assigned `todo` issue cannot be checked out because `checkoutRunId=null` but `executionRunId` is still set, treat it as execution-lock corruption: do not retry checkout, immediately move the issue to `blocked` with lock metadata, and escalate to Architect for lock normalization before QA/FED execution resumes.

## 2026-04-10 — Fresh FED handoff does not override stale execution-lock blockers
If a blocked QA lane receives a new FED "ready for rerun" comment but checkout still returns `409` with `checkoutRunId=null` and stale `executionRunId`, treat the handoff as new context but keep the lane blocked, link the handoff comment in your blocker update, and re-escalate lock normalization to Architect without retrying checkout.

## 2026-04-10 — Parent reassignment can bypass blocked child lane, so retest code before re-blocking
When a parent implementation ticket is reassigned directly to QA while the canonical FED remediation child is still lock-blocked, run a fresh code-level retest (with current line references and command evidence) before re-blocking and escalating. This prevents stale blocker comments and keeps escalation auditable.

## 2026-04-10 — Mandatory game blocker reruns should target checkpoint states explicitly
When game QA blockers involve child-facing checkpoint UI (replay icon, icon-first controls), rerun should explicitly verify checkpoint-specific render paths in code and include evidence for auto-play + touch-min guarantees, not just main gameplay controls.

## 2026-04-10 — Marketing touch-target QA closes fastest with a 3-layer evidence stack
For marketing CTA uplift lanes, close QA with a compact but auditable stack: (1) source verification of touch tokens and CTA style overrides, (2) route/viewport measurement matrix from `docs/qa/evidence/<issue>/measurements.json`, and (3) runtime gates (`yarn typecheck` + web build). If primary CTAs are >=60px, prominent CTAs hit 72px targets where intended, and secondary controls still map to 44px, mark the lane `done` with a surface-by-surface matrix.

## 2026-04-10 — Assignment wake does not imply dependency handoff readiness
If a QA lane is auto-assigned while its implementation dependency is still `todo` with no handoff comment, checkout once for run ownership, then immediately return the lane to `blocked` with explicit unblock evidence requirements. This avoids speculative QA execution and keeps handoff contracts clear.

## 2026-04-10 — Empty workspace heartbeat fallback: use project workspace metadata
If a reassigned lane wakes in an empty execution cwd (not a git repo), recover by reading the linked issue/project metadata and running QA verification from the project primary workspace path. If sibling canonical QA already closed with full evidence, close the duplicate lane with linked proof instead of duplicating review effort.

## 2026-04-10 — Counting Picnic replay-glyph QA needs full-surface audit
For `CountingPicnicGame`, replay-glyph regressions can remain on completion, midpoint, summary, and in-round message surfaces even when submit/check flows are already removed. Use a full replay-button surface scan and block until all child-facing replay controls show visible `▶` (not `🔊`).

## 2026-04-10 — Guardrail QA must probe live API behavior, not just backend handoff notes
For governance features (assignee guardrails/auditability), validate with real API create/update scenarios plus activity-log queries, then cancel probe issues after evidence capture. A green backend handoff comment is not sufficient if live API still accepts bypass paths.

## 2026-04-10 — Assignment-bound run context must be handled before cross-issue QA
When a heartbeat run is assignment-triggered, checkout on a different assigned issue can fail with `Checkout run context is bound to a different issue` (snapshot tied to `PAPERCLIP_TASK_ID`). This binding can persist for the full run even after the wake task is closed, so process that task first and defer other assigned lanes to a later heartbeat.

## 2026-04-10 — Letter Tracing header text must be replay-audio covered too
In `LetterTracingTrailGame`, even after replay fixes on instructions/summary chips, the main gameplay header title + subtitle can still be text-only (`games.letterTracingTrail.title` / `games.letterTracingTrail.subtitle`). Keep a dedicated header-surface replay check in the mandatory blocker pass.

## 2026-04-10 — Guardrail reruns need a fixed 5-scenario matrix plus cleanup links
For manager-assignee guardrail validation, always rerun the full matrix on live API: create reroute, override+rationale, override-without-rationale (expect 400), title-transition backfill, and activity-log visibility. Record probe issue links for each scenario and explicitly cancel probe issues in the same heartbeat so rerun evidence is auditable without leaving inbox noise.

## 2026-04-10 — Blocked wake-task can still hard-bind run snapshot to that issue
When a heartbeat is assignment-triggered for a blocked issue, checking it out and re-blocking can still leave the run snapshot bound to that issue for the rest of the run. Cross-issue checkout attempts then return `409` (`Checkout run context is bound to a different issue`) with `snapshotIssueId` set to the wake issue. Treat it as run-scoped and defer other assigned lanes to the next heartbeat.

## 2026-04-10 — Handbook QA must treat mocked sync as a critical integration blocker
For handbook lanes, migrations + i18n/audio completeness are not enough for sign-off. If UI sync is simulated locally (for example, `setTimeout` state flips) and no runtime `child_handbook_progress` upsert/read path exists, mark QA `blocked` with `critical` severity and require FED handoff that includes real optimistic writes plus reproducible RLS smoke steps.

## 2026-04-10 — Backend handoff artifacts are not runtime proof for control-plane authz fixes
For governance/API authz lanes, a backend "done" comment with patch artifacts is insufficient for QA sign-off. Always run the live endpoint matrix under the required auth contexts; if runtime still returns legacy errors, post endpoint/status/run-id/timestamp evidence on parent issues and keep the QA lane `blocked` until deployment is confirmed and rerun is requested.

## 2026-04-10 — Checkout success is not enough; run context must bind to issue identity
For lock-integrity QA, verify not only that checkout returns 200, but also that the backing `heartbeat_run.contextSnapshot` gains `issueId/taskId` matching the checked-out issue. If lock fields are written while run context remains unbound (`issueId/taskId=null`), treat it as a critical backend defect and fail the validation lane.

## 2026-04-10 — Reopened `todo` QA rerun lanes still require dependency-gate enforcement
If coordinator lanes are flipped from `blocked` back to `todo` before implementation children are done, re-check dependencies immediately and return the QA lanes to `blocked` with canonical-lane routing. This prevents duplicate reruns and keeps QA execution aligned to the true unblock trigger.

## 2026-04-10 — Lock contamination rerun verdict must track stale residue separately from active mismatches
In checkout-lock integrity reruns, treat the matrix as failing if `stale_non_terminal` remains above zero even when `active_unrelated_exec` and `active_unrelated_checkout` are both zero. Active-path fixes do not imply historical lock residue is resolved; require an explicit backend cleanup/remediation lane for stale rows.

## 2026-04-10 — RLS QA can stay end-to-end when signup is rate-limited by using a confirmed parent token + synthetic foreign child
If fresh signup is blocked by rate limits or confirmation gating, validate `child_handbook_progress` policies with one confirmed parent auth context plus a synthetic child in another family: own-child write should succeed, cross-family write should 403, and cross-family read should return empty. This preserves auditable deny/allow proof without skipping runtime RLS checks.

## 2026-04-10 — Launch-trio QA lanes should hard-gate on slot FED handoff and declare slot ownership in kickoff
For parallel handbook rollouts, avoid duplicate QA by declaring slot ownership in kickoff comments (for example `5-6` vs `3-4`/`6-7`) and immediately blocking the lane if its paired FED slot issue is still kickoff-only without handoff evidence. Require file list + typecheck/build outputs before running QA matrices.

## 2026-04-10 — Launch-trio slot ownership can change after kickoff
Kickoff dedupe notes are not durable ownership truth. On each assignment wake, re-check current assignee and latest routing comments; if Architect reroutes a slot, update the QA ownership statement and blocker contract immediately to avoid stale duplicate-review assumptions.

## 2026-04-10 — Assignment wake task can outrank inbox-lite ordering when `in_review` is absent
If `PAPERCLIP_TASK_ID` points to an assigned `in_review` issue that is not returned by `inbox-lite`, treat the wake task as primary and execute checkout/review there first; relying only on inbox-lite can mis-prioritize newer `todo` lanes.

## 2026-04-10 — Launch-slot QA must verify runtime slug map, not just dependency status/handoff notes
Even when FED dependency issues are `done`, validate the actual runtime slot mapping (`ageBand -> book -> handbookSlug`) and page-count contracts in code. In this heartbeat, `5-6` was still wired to `yoavLetterMap` with 8-page flow while `magicLetterMap` 10-page assets existed but were unreachable, requiring a new FED fix lane.

## 2026-04-10 — Home RTL progress QA should validate anchor + gradient together
For RTL-native progress bars, reviewing gradient angle alone is insufficient. Verify both track anchoring (`justify-content` start/end by `dir`) and fill gradient direction so visual completion semantics align with Hebrew reading flow.

## 2026-04-10 — Replay-glyph compliance reruns must still enforce auto-play on new instruction surfaces
Even when a rerun scope is “icon remediation” (`🔊` → `▶`), keep the mandatory game blocker for instruction auto-play on every newly displayed instruction state (e.g., midpoint/completion overlays). Replay availability is not a substitute for auto-play.

## 2026-04-10 — Assignment-triggered wake can carry a non-owned `PAPERCLIP_TASK_ID`
On `issue_assigned` wakes, verify `PAPERCLIP_TASK_ID` assignee before prioritizing it. If it is not assigned to QA and inbox only contains a blocked lane with no new comments since your last blocker update, apply blocked-dedup and exit without checkout/comment noise.

## 2026-04-10 — Handbook reruns close faster with a key+audio parity script for the exact slot pack
For interactive-handbook slot reruns (e.g., `5-6` -> `magicLetterMap`), pair code mapping checks with a scripted parity sweep of required i18n/audio keys (cover/pages/interactions/completion + parent summary keys) using the same kebab-case path transform as runtime `keyToAudioPath`. Reporting `checked`/`missing` counts gives auditable sign-off evidence and catches silent asset drift quickly.

## 2026-04-10 — Parent dashboard QA must gate smooth-scroll on reduced-motion
For non-game UX polish lanes, treat programmatic smooth scrolling as an accessibility gate: any `scrollIntoView({ behavior: 'smooth' })` path must detect `prefers-reduced-motion` and fall back to `behavior: 'auto'` before QA sign-off.

## 2026-04-10 — Checkout conflict issue can become run-context anchor for later checkouts
When a target issue returns checkout conflict with stale lock metadata, subsequent checkouts in the same run may fail with `Checkout run context is bound to a different issue` and `snapshotIssueId` pointing to the conflicted issue. Treat remaining assigned reviews as deferred to next heartbeat (no same-run retries), and leave an explicit defer note on affected lanes.

## 2026-04-10 — Login onboarding-skip QA should validate the full access-context matrix
For login bypass fixes, close QA only after verifying redirect guards across all three allowed contexts with a non-guest active child: local mode (no Supabase), guest mode, and authenticated session. Also confirm regressions stay clean (`user` without child still routes `/profiles`, no-child still sees onboarding), then record `typecheck` + web build evidence.

## 2026-04-10 — Handbook QA blocker bundle should include screenshots + runtime matrix + pa11y JSON
For tablet-first handbook lanes, capture an auditable artifact pack (`768x1024` + `1024x768` screenshots, runtime timing/control matrix JSON, and `pa11y` JSON). Treat missing in-page illustrations (`img/picture/svg` count 0 in story surface), RTL direction glyph mismatch, and unresolved contrast errors as immediate blockers and route fixes to the active FED implementation lane.

## 2026-04-10 — Nav active-state QA for `/games` migration should use a 3-point code contract
When migrating app-home semantics from `/home` to `/games`, close QA only after all three are true together: (1) app nav links point to `/games` (not `/`), (2) active matcher keeps `/games` active for `/games`, `/games/*`, and legacy `/home`, and (3) landing-home matcher is restricted to exact `/` to prevent false public-home highlights inside app/game routes.

## 2026-04-10 — Paperclip identifier filter may still return full issue list; always jq-select locally
For `/api/companies/{companyId}/issues?identifier=...`, do not assume server-side exact filtering. Pipe the response through `jq` and select by exact `identifier` locally to avoid noisy context and token-heavy logs during heartbeat triage.

## 2026-04-10 — Same-run task switch needs `release`, and release can mutate issue ownership/state
When a heartbeat run is context-bound to one issue, switching to another assigned issue may require `POST /api/issues/{issueId}/release` on the bound issue first. That release call can reset checkout fields and may alter assignment/status routing, so always re-fetch the released issue immediately after switching to confirm it still reflects the intended blocker/owner state.
