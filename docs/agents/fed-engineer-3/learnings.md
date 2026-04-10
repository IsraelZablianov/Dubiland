# FED Engineer 3 — Learnings

Accumulated knowledge specific to the FED Engineer 3 role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-10 — Runner game seed completeness
When adding a new game migration after content-tagging rollout, seed both `games`/`game_levels` and `game_tag_assignments` (age/topic/difficulty) so catalog metadata stays consistent across legacy and tag-driven surfaces.

## 2026-04-10 — Audio generation validation
Running `yarn generate-audio` as a final verification step catches missing localized narration keys early and ensures `public/audio/he/manifest.json` stays in sync with new i18n content.

## 2026-04-10 — Paperclip done-task checkout behavior
Checking out a `done` issue with `expectedStatuses` including `done` can move it back to `in_progress`; for comment-only follow-ups on completed tasks, avoid checkout unless new implementation work is required.

## 2026-04-10 — Local audio generation environment dependency
`scripts/generate-audio.py` depends on Python `gTTS`; when the system Python is externally managed, create a task-local venv (for example `.venv-audio`) and run generation through that interpreter to keep i18n-to-audio coverage unblocked.

## 2026-04-10 — Handbook shell scope alignment
For handbook implementation work, shipping one `GameProps` shell with data-driven page/interactions + one seed row in `games` keeps parity with current engine conventions while still matching the PM requirement of “one component + one DB row”.

## 2026-04-10 — Morphology game fallback routing needs slug mapping
When adding a new reading game slug (for example `rootFamilyStickers`), update both `GAME_OPTIONS_BY_TOPIC.reading` and `GAME_OPTIONS_BY_SLUG` in `Home.tsx`; otherwise catalog RPC items with the new slug are dropped by `toHomeGameCard`.

## 2026-04-10 — Typecheck gating can be blocked by other in-flight lanes
`yarn typecheck` for `packages/web` can fail due unrelated i18n-key typing drift in parallel workstreams (e.g., `DecodableStoryReaderGame.tsx` key unions), so DUB task reporting should explicitly separate self-introduced errors from pre-existing blockers.

## 2026-04-10 — Round intro callbacks must not capture stale round state
In multi-round `GameProps` flows, intro/replay callbacks that read `round` from closure can speak the previous target after `setRound`; pass the active round explicitly into scheduled callbacks or trigger intros from a round-index effect to keep audio/text aligned.

## 2026-04-10 — Handbook progress runtime must bind to real child identity
For handbook persistence, gate read/write paths to non-guest `activeProfile.id`, hydrate `handbooks.id` by slug first, then `select/upsert` `child_handbook_progress` with optimistic retries. This keeps QA/RLS validation unblocked and avoids leaking `guest`/`local-family` fallback ids into production progress flows.

## 2026-04-10 — Assigned `in_review` wake should end in explicit QA reassignment
If a parent implementation issue wakes assigned to FED while already in QA cycle, checkout will move it back to `in_progress`; after verification, explicitly PATCH back to `in_review` and assign QA so closure retest is not blocked by stale FED ownership.

## 2026-04-10 — Launch-slot aliases must resolve to canonical handbook slugs in runtime
For launch-trio handbook lanes, CTO alias names (`star-message`, `magic-letter-map`, `bouncy-balloon`) map to canonical DB/runtime slugs (`tamarWordTower`, `yoavLetterMap`, `mikaSoundGarden`). FED routing and progress hydration should use canonical slugs to match seeded rows and avoid empty-handbook lookups.

## 2026-04-10 — Handbook audio parity is safest when runtime keys stay in `common.handbooks.<slug>.*`
Interactive handbook playback derives audio paths directly from i18n keys (`handbooks.*` -> `/audio/he/handbooks/...`), so shifting child-facing runtime narration/prompt/interactions to `common.handbooks.<slug>.*` avoids duplicate key families and keeps alignment with generated audio manifests.

## 2026-04-10 — Ladder handbooks must resolve slug from active book and scope progress by handbook row
For multi-book handbook runtime, derive `activeBookId` first (profile age band or `readingLadder.activeBook`), then resolve `handbookSlug` from `readingLadder.books[activeBookId]`; hydrate/persist `child_handbook_progress` using that slug’s `handbooks.id` so Books 1/4/7 do not overwrite each other.

## 2026-04-10 — Reading ladder gates should be runtime-configured and emitted in completion payload
For handbook Books 1/4/7, keep quality-gate thresholds in `game_levels.config_json.readingLadder.qualityGate`, compute `firstAttemptSuccessRate` + `hintRate` from mandatory checkpoints, and expose pass/fail + `nextBookId` as `readingGate` in `GameCompletionResult` so parent-facing UI can show readiness without schema changes.

## 2026-04-10 — Reopened parent QA lanes may only need FED revalidation
When board reassignment reopens a parent implementation issue that already has a child FED fix in `in_review`, the fastest safe path is to revalidate the live code against the blocker contract, then explicitly PATCH parent status back to `in_review` and reassign QA to avoid duplicate edits.

## 2026-04-10 — Replay affordance audits check icon glyph, not just button presence
For pre-literate QA gates, replay controls must render a visible play glyph (`▶`) on child-facing text rows; a speaker glyph (`🔊`) can fail review even when audio behavior and touch target sizing are correct.

## 2026-04-10 — Per-card tap narration needs queued follow-ups after `playNow`
In ShapeSafari, `audio.playNow()` clears queued clips, so per-card shape-name replay must run first and hint/success/recovery audio should be queued afterward. A tap token guard prevents stale follow-up audio from older taps when children tap quickly.

## 2026-04-10 — Recheck blocked QA lines before patching
When a FED lane is blocked on exact line numbers, first re-open the current file and verify those coordinates still reproduce; in shared workspaces, the blocker can already be fixed by upstream merges and the correct action is status recovery plus QA rerun, not duplicate edits.

## 2026-04-10 — Onboarding skip redirects must respect ProtectedRoute access
For “skip onboarding if child already configured” flows, gate `/home` redirects behind actual access conditions (`guest mode` or authenticated hosted user, or non-hosted mode); checking only local active-child state can cause `/login` -> `/home` -> `/login` loops when hosted auth is required.

## 2026-04-10 — Shared header nav needs mode-specific link maps
Because `AppLayout` currently mounts `PublicHeader`, nav active-state logic must branch for authenticated app mode vs public marketing mode; reusing a single `home -> /` map causes wrong highlights and wrong destinations on `/games/*` routes.

## 2026-04-10 — GitHub Pages SEO paths need explicit static route artifacts
For project-page deployments, relying only on SPA `404.html` rewrites leaves crawler-facing `curl -I` checks at `404`; adding a postbuild step that emits real HTML files per public SEO path (`about.html`, `parents/faq.html`, etc.) is required for direct static-route `200` responses.

## 2026-04-10 — Heartbeats should prefer assigned inbox lane over stale wake task ids
When `PAPERCLIP_TASK_ID` resolves to an issue not assigned to FED (or already done in another lane), treat it as wake metadata only and continue with owned `in_progress` inbox work after checkout. This avoids misdirected edits and keeps execution aligned with current ownership.

## 2026-04-10 — Parent dashboard trust hinges on honest states
In `ParentDashboard`, if no child profiles exist, suppress aggregate zero-metric cards and show a single manage-children CTA; also avoid placeholder controls (e.g., audio settings without real toggles) because parents read those as broken promises.

## 2026-04-10 — Catalog fallback merge keeps critical game discovery resilient
When Home uses server catalog results, age-band visibility fixes in local fallback config can still be hidden if the catalog omits a game; merging fallback cards into catalog output by slug preserves launch-critical discovery (like `interactiveHandbook` for age `3-4`) without breaking catalog ordering.

## 2026-04-10 — Completion UX should be a mode switch, not an inline footer
For handbook reading flows, replacing post-completion footer text with a dedicated celebration mode (confetti/stars + clear replay/home actions) gives children a stronger end-of-story affordance and avoids burying next actions below the game canvas.

## 2026-04-10 — Render-first handbook startup still needs queued optimistic progress before handbook hydration
When removing first-render hydration blockers in `InteractiveHandbook.tsx`, keep `pendingProgressRef` snapshots queued even before `handbookId` resolves; otherwise early child interactions can be dropped before Supabase hydration completes. Flush once `handbookId` becomes available to preserve optimistic update semantics.

## 2026-04-10 — New handbook content must live under top-level `common.handbooks.<slug>`
For interactive handbook lanes, placing new slug payloads under `games.interactiveHandbook.*` breaks runtime text/audio lookup paths; keep story/interactions/sentence-bank data under top-level `common.handbooks.<slug>.*` and reserve `games.interactiveHandbook.*` for shell-level labels (ladder/choices/gates).

## 2026-04-10 — Adding a mid-ladder handbook requires sequence + label + next-book parity
When introducing a new reading-ladder book between existing books (e.g., Book 8 before Book 9), update both runtime sequences (`LADDER_BOOK_SEQUENCE`, bookshelf/default ladder config) and `games.interactiveHandbook.ladderBooks.<bookId>` labels; otherwise gate messaging can route to a key with missing UX/audio parity.

## 2026-04-10 — Syllable-book lanes need shell/runtime/parent key families added together
For handbook Book 5-style lanes, ship all three i18n/audio surfaces in one pass: `common.handbooks.<slug>.*` runtime payload, `games.interactiveHandbook.choices.*` preset labels, and `parentDashboard.handbooks.<slug>.*` summary copy. Any missing family leaves generated audio/manifest parity incomplete even when game logic compiles.

## 2026-04-10 — Route-transition parity should be enforced per game route
In `App.tsx`, every app game route should pass through `withAnimatedPage(..., 'app')`; a single missing wrapper (as on More Or Less Market) creates inconsistent navigation feel even when page logic is correct.

## 2026-04-10 — Runtime handbook overrides must carry prompt and choice payloads
When `handbook_pages.blocks_json` / `interactions_json` are populated, fallback-only interaction mapping can drift from page text. Normalize runtime aliases (`target-word`, `main-word`, `question`) and let runtime prompt/choice payloads override static interaction defaults so target words render and questions stay aligned with visible page content.

## 2026-04-10 — Home discovery copy changes must ship with generated Hebrew audio keys
For home-page UX updates, every new `home.*` translation key (including helper copy like featured badges or section counters) must be followed by audio generation so `packages/web/public/audio/he/manifest.json` and `/audio/he/home/*` stay complete for pre-reader accessibility.

## 2026-04-10 — Final FED verification in shared lanes should clearly separate scoped vs unrelated type errors
When `yarn typecheck` fails in another in-flight lane (for example unmerged files outside the current issue scope), report the exact failing path/symbol and keep completion notes scoped to touched files plus successful runtime smoke checks.

## 2026-04-10 — Age-band runtime rollouts can ship safely before content lanes by key fallback
For staged reading-game overhauls, resolve `games.<slug>.ageBand.<band>.*` keys at runtime and fall back to legacy `games.<slug>.*` keys when absent. This enables FED routing/gating changes to ship independently while Content Writer lands full age-band i18n/audio in parallel.

## 2026-04-10 — Shared game chrome works best as a composable bar with optional slot + back callback
A reusable `GameTopBar` with `onRequestBack`, progress segments, replay action, and an optional right-side slot lets different games keep unique controls while standardizing child-critical chrome (back/progress/replay) and touch sizing in one place.

## 2026-04-10 — Handbook shelf clarity improves with featured + nearest-neighbor selection
For pre-readers, replacing an all-books grid with one featured handbook plus two adjacent options reduces choice overload while preserving reachability and keeps tap-state feedback explicit through active/selected visual states.

## 2026-04-10 — `in_review` tasks assigned to FED can be safely closed via checkout + re-verification
If a wake targets a FED-owned issue in `in_review`, running checkout can move it back to `in_progress` for final verification. Re-run `packages/web` typecheck + dev boot smoke, then patch to `done` with verification evidence instead of assuming it is already closed.

## 2026-04-10 — Single-shell parity can preserve child context by demoting custom headers
For global shell-unification directives, keep `ChildPlayShell` as a secondary context strip (child badge + game nav) and mount `PublicHeader`/`PublicFooter` inside both child and parent shells. This satisfies canonical route parity without rewriting every app route wrapper.
