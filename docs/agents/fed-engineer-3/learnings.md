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

## 2026-04-11 — Style lanes close faster with computed-style evidence
For touch/readability tasks, verify rendered `min-height` and `font-size` directly in Playwright (`page.evaluate`) on real routes (for example `/games` and `/games/reading/interactive-handbook`) and post those numeric values in the task comment. This turns “looks bigger” into auditable proof.

## 2026-04-11 — Reading age-band rollouts need page-level config wiring, not only in-game routing
Adding age/mastery routing logic inside reading game components is insufficient if route wrappers still pass static `levelNumber` defaults. Push `activeProfile.ageBand` into `level.configJson` on each page shell and let games consume normalized routing context, so local/demo runs and DB-backed lanes both exercise the same progression behavior.

## 2026-04-11 — Delight parity can be added safely at session-summary layer
For games that already have rich round feedback but lack shared motion reward, adding `SuccessCelebration` in the `sessionComplete` summary branch provides immediate UX parity without touching per-round state transitions, hint logic, or audio sequencing.

## 2026-04-11 — App-shell route transitions should stay block-axis to avoid horizontal bounce
For authenticated app routes wrapped by `.animated-page--shell-app`, use Y/scale/opacity entry (no `translateX`) and clip `overflow-x` during entry. Keep RTL/LTR inline slide behavior only on public-shell transitions so route motion stays polished without transient `scrollWidth > clientWidth` spikes.

## 2026-04-11 — RTL chrome fixes scale best with one shared glyph/gradient primitive
For cross-game RTL parity work, centralize directional replay/next glyph selection and horizontal progress-gradient direction in a shared helper (`rtlChrome`) and consume it from each game shell/card/home surface. This prevents per-file drift and makes static verification (`rg` for hardcoded glyphs/`90deg`) straightforward.

## 2026-04-11 — Protected-route pa11y checks need guest-entry actions plus route-root scope
For `/games/*` accessibility checks, direct pa11y URL runs can audit `/login` after auth redirects and report unrelated failures. Use a pa11y action flow (guest CTA -> profile continue -> navigate target route) and set `rootElement` to the route container (for handbook: `.interactive-handbook`) so contrast results map to the intended game surface.

## 2026-04-11 — OG asset URLs should resolve through `assetUrl` with base-path dedupe
For metadata images on project-subpath deploys, build absolute OG URLs from `assetUrl('/images/...')` and guard against double-prefixing when canonical base already includes the same subpath. This keeps `/images/games/thumbnails/contact-sheet-16x10.webp` path-stable while avoiding `/Dubiland/Dubiland/...` regressions.

## 2026-04-11 — In-place illustration lanes should ship evidence, not unnecessary refactors
When mascot/topic replacement tickets use stable path contracts, keep component mappings unchanged and validate with representative-route runtime checks (`complete` + non-zero natural dimensions) plus direct asset `200 image/svg+xml` probes. Closing with auditable evidence avoids risky no-op code churn in shared frontend lanes.

## 2026-04-11 — Paperclip release can reset task status without freeing same-run checkout snapshot
Using issue `release` mid-heartbeat can clear assignment/status unexpectedly (for example reverting `blocked` back to `todo`) while the run remains bound to the same snapshot issue for checkout. Prefer finishing one issue per run and avoid `release` unless the intent is explicit reassignment semantics.

## 2026-04-11 — Media-unblock follow-ups should prioritize deterministic revalidation before edits
When an illustration/media lane is reopened from upstream validation, rerun deterministic checks first (contact-sheet rebuild/hash, static path-contract grep, runtime 200 matrix). If hashes and paths are stable, close with evidence-only QA handoff instead of unnecessary file churn.

## 2026-04-11 — Shell-unification QA should combine static remnant scans with route-matrix runtime audits
For header/footer unification lanes, fastest safe closure is a two-step gate: (1) static scan of owned pages for custom header/footer remnants, then (2) runtime matrix over owned routes validating single shared header/footer, RTL dir, no horizontal overflow, and tablet touch floor. This catches real regressions without editing stable pages.

## 2026-04-11 — Manifest-first audio resolution should be centralized with deterministic fallback
When multiple games/pages build `/audio/he/...` paths locally, drift and namespace mismatches creep in. A shared `resolveAudioPathFromKey` utility (manifest lookup first, deterministic key-derived fallback second) plus early warm-up in `useAudioManager` keeps narration resilient across handbook/game flows without per-component manifest fetch logic.

## 2026-04-11 — Unified shell migrations should remove nested page-level `<main>` landmarks
When app shells render the canonical `<main>` around route content, page scaffolds like `ChildRouteScaffold` must use neutral containers (`div`/`section`) instead of another `<main>`. A quick route-matrix check (`header=1`, `footer=1`, `mainCount=1`, `no horizontal overflow`) catches this regression reliably.

## 2026-04-11 — Sparse runtime interaction payloads need frontend choice fallbacks to avoid dead-ends
Interactive handbook runtime rows can legally ship only `{ id, required }` in `interactions_json` (no `choices`). If base flow IDs differ (e.g., `magicLetterMap` `chooseLetter`), merge logic can produce `required=true` with zero choices, locking `next`. In `buildRuntimeInteractionDefinition`, resolve book-specific preset fallbacks by runtime interaction id, and downgrade `required` to `false` when no actionable choices exist.

## 2026-04-11 — Touch-floor regressions should validate contract plus runtime pass, not force one CSS alias
For shell touch-floor lanes, keep regression checks compatible with either stable alias usage (`--public-header-logo-touch-min`) or direct token wiring (`--touch-min-primary`) and require green runtime gates (`test:touch-shell`, typecheck, dev boot smoke) before closing an in-review pickup.

## 2026-04-11 — Wake-bound checkout conflicts can require explicit blocked-state lock reset before re-checkout
When a heartbeat wake is snapshot-bound to an assigned issue but `POST /checkout` returns `409` with stale `executionRunId`, patching the same issue to `blocked` with a precise lock-conflict comment can clear the stale execution lock and allow a clean checkout in the same run; after checkout, continue implementation and move status forward normally.

## 2026-04-11 — Public-shell AA fixes can pair contrast and touch evidence in one pass
For `/login` a11y regressions after shell unification, pairing pa11y checks on the protected-route redirect target with Playwright computed-style evidence (`dir=rtl`, CTA `min-height: 72px`, footer link `min-height: 44px`) closes contrast tickets without reopening touch-floor concerns.

## 2026-04-11 — Normalize legacy runtime interaction keys before UI/audio binding
Interactive handbook runtime payloads can still emit legacy Book4 interaction ids (`chooseWordByNikud`, `literalAfterDecoding`) in `promptKey`/`hintKey`/`successKey`/`retryKey` and block-level prompt keys. Normalize `interactions.<legacyId>.<field>` to canonical ids (`decodePointedWord`, `literalComprehension`) before render/audio resolution, and make runtime interaction matching alias-aware, to prevent raw i18n key leakage and missing-audio fallbacks.

## 2026-04-11 — Runtime-only final-page interactions should not hard-block handbook completion
For `magicLetterMap`, runtime content can inject a page-10 interaction not present in base flow. If treated as `required`, users can hit `עמוד 10 מתוך 10` and still fail completion transition (`completeInteractionFirst`). In runtime merge, demote runtime-only final-page interaction rows to optional so celebration + replay handoff remains deterministic.

## 2026-04-11 — Runtime regression tests importing `.tsx` need explicit TSX loader
`node --test` fails on handbook regression scripts that import `.tsx` modules directly. Run them as `node --import tsx --test <script>` (or equivalent package script) so process-lost retry heartbeats can revalidate quickly without false negatives.

## 2026-04-11 — Handbook runtime regression should execute from `packages/web` cwd for path aliases
Even with `node --import tsx --test`, running `interactive-handbook-runtime-regression.test.mjs` from repo root can fail resolving `@/...` imports. Run it from `packages/web` (or set equivalent tsconfig path context) so alias resolution stays deterministic in heartbeat revalidation passes.

## 2026-04-11 — Page transitions should auto-recenter handbook controls when prior scroll offset hides them
In portrait handbook flows, preserving a deep `window.scrollY` across page transitions can push the controls row above the viewport (for example around page 7), making `next` feel broken. A lightweight page-change guard that checks control-row bounds and calls `scrollIntoView({ block: 'nearest', inline: 'nearest' })` when out-of-frame prevents progression stalls without rewriting the layout system.

## 2026-04-11 — Legacy handbook runtime keys can leak from shorthand forms unless normalized pre-render
Book4 runtime payloads may still emit shorthand keys like `confusableContrast.success` (without full namespace). If merge logic treats those as final, status surfaces can display raw keys. Normalize shorthand `interactionId.field` and `interactions.interactionId.field` through the canonical interaction-key builder (with alias mapping, e.g. `confusableContrast -> chooseLetter`) before status/audio binding.

## 2026-04-11 — Prototype game lanes close faster with exported round builders plus runtime i18n/touch evidence
For new `GameProps` reading prototypes, exporting a pure round-builder (`build...Rounds`) enables fast TSX-backed node tests (`node --import tsx --test`) for level scaling/correct-choice contracts, while a short Playwright pass on the real route should explicitly confirm `dir="rtl"`, success-state Hebrew copy (no raw i18n key text), and min button size >=44px.

## 2026-04-11 — Gate-driven reading games should keep mastery telemetry independent from retry UX
For adaptive decoding lanes (`CV -> CVC -> transfer`), compute promotion/regression strictly from first-try signals and bounded windows, while keeping retries/hints non-punitive in UI. This lets gameplay stay calm for kids while thresholds remain auditable (`>=10 CV @85%`, `>=12 CVC @80%`, near-miss success, rapid-tap calm-assist) and easier to tune from level config JSON.

## 2026-04-11 — Route manifests should carry both route-topic and canonical content-topic
For game routing cleanup in `App.tsx`, defining a typed manifest with both `routeTopicSlug` (URL segment) and `contentTopicSlug` (canonical domain) prevents drift when aliases exist (for example `colors` route path mapping to `math` content domain) and keeps protected-route generation declarative.

## 2026-04-11 — Hosted profile age-band propagation is safest through birth-date read/write + session hydration
In hosted profile pickers, fetch `children.birth_date`, derive `ageBand`, and persist that `ageBand` into `ActiveChildProfile` before navigation. For child creation, collecting age band and writing a deterministic `birth_date` at insert time keeps `activeProfile.ageBand` available immediately for difficulty routing without changing guest/demo flows.

## 2026-04-11 — Demo profiles must be treated as non-persistable child identities in all Supabase `child_id` paths
Sample profile IDs (`maya/noam/liel`) are valid UI/session IDs but not DB UUIDs; any `child_id` filter/upsert path (for example progress summary hooks and handbook progress hydration) should gate on a UUID-level persistable-child check before querying Supabase to prevent `400 invalid input syntax for type uuid` noise.

## 2026-04-11 — HUD wrapper labels should use hidden text, not `aria-label` on generic containers
For game HUD `div`/`span` wrappers (progress dots, stars/stamps, score/metric pills), `aria-label` can trigger `aria-prohibited-attr`. Keep wrappers non-labeled and inject equivalent `.sr-only` text content while leaving decorative glyphs/dots `aria-hidden`; lock this with a focused regression script (`packages/web/scripts/aria-prohibited-hud-regression.test.mjs`).

## 2026-04-11 — Falling-object games perform better when simulation runs on RAF and paint commits are throttled
For DOM-based motion games like `LetterSkyCatcherGame`, keeping gameplay simulation in refs on `requestAnimationFrame` while throttling `setObjects` paint commits (about 24fps) reduces React churn versus per-tick interval state updates. Pair this with transform-based absolute positioning (`translate3d` from measured playfield metrics) so falling objects and player movement stay compositor-friendly on low-end tablets.

## 2026-04-11 — Public-shell auth and SEO namespaces should hydrate as sidecars, but route-content LCP can still dominate
For public bootstrap lanes, splitting `PublicHeader` into a static core plus idle/intent-loaded auth sidecar and deferring `seo` i18n namespace until `RouteMetadataManager` mounts materially reduces entry chunk pressure (`index 239726 raw / 74294 gzip` vs DUB-686 baseline). However, this alone may not close strict route LCP gates when page content regresses; treat shell-side splits as necessary but not sufficient and plan route-specific LCP follow-ups (`/parents` in DUB-744).

## 2026-04-11 — PR perf-gate workflows should publish summary artifacts even on gate failures
For CI budget/lighthouse lanes, add a dedicated summary script and run it with `if: always()` so failures still produce one markdown/json report for triage instead of forcing readers to piece data from scattered logs.
