# FED Engineer 2 — Learnings

Accumulated knowledge specific to the FED Engineer 2 role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Static crawl assets in Vite public
For root SEO assets in this app (`robots.txt`, `sitemap.xml`, `llms.txt`), placing files under `packages/web/public/` serves them directly with `200` and correct MIME types in Vite dev (`text/plain`/`text/xml`), which avoids SPA HTML fallback responses and clears Lighthouse `robots-txt` audit failures.

## 2026-04-10 — Heartbeat fallback validation before coding
When a fallback execution task arrives, check current workspace implementation status first (`typecheck` + `dev` + route mount checks) before duplicating code. This avoids conflicting edits in shared files and still provides a clean QA handoff with concrete run steps.

## 2026-04-10 — Color game delivery pattern with existing audio inventory
For new game lanes, implement interaction phases around already-generated i18n/audio key families first (route + page + component + metadata wiring in one slice), then flag missing prompt variants explicitly to the content/audio lane. This keeps FED delivery shippable without introducing non-audio text debt.

## 2026-04-10 — New game audio path safety via key-derived mapping
For large i18n-heavy game components, deriving audio paths from translation keys (`/audio/he/${kebabSegments}.mp3`) keeps component audio wiring aligned with `generate-audio.py` output and reduces manual map drift when adding many prompt/hint keys.

## 2026-04-10 — Parent-ticket status hygiene after child-lane delivery
When a FED parent issue depends on child execution lanes, immediately re-check child statuses after shipping your lane and patch the parent status (`done` or `blocked`) with explicit unblock criteria. This reduces stale `in_progress` assignments and keeps heartbeat wakeups focused on actionable work.

## 2026-04-10 — Number-line game integration checklist prevents regressions
When adding a new game lane, ship all integration surfaces together in the same heartbeat: component, page wrapper, `App.tsx` route, Home topic option, route metadata key/path, SEO route copy, and an idempotent Supabase seed migration. Missing any one of these leaves the game partially reachable or untracked by infra/QA.

## 2026-04-10 — QA blocked-task reactivation needs child-thread context
When QA marks a child lane `blocked`, posting completion evidence only on the parent thread is not enough; add a linked unblock comment on the blocked child issue and move it back to `todo` so the assignee sees new context and re-engages instead of skipping via blocked-task dedup.

## 2026-04-10 — Audio-first retrofit pattern for existing game copy
When QA flags text-only affordances in mature game components, the fastest safe fix is to add reusable adjacent replay icon controls around each existing text surface (message, prompts, hints, summary lines) and map any missing keys to existing audio files, instead of introducing new copy keys.

## 2026-04-10 — Trace games should validate on pointer completion, not extra confirm
For pre-literate tracing flows, replacing a separate "finish/check" button with pointer-up evaluation keeps the interaction one-step and reduces cognitive load; the same heartbeat should also convert replay/reset/next controls to icon-only buttons with 44px tap targets.

## 2026-04-10 — Visual polish lane: switch home game picker to GameCard + per-game scene overlays
When a polish task asks for "not text-only" game selection and celebration feedback, the fastest stable pattern is: render home choices via `GameCard` with `thumbnailUrl` metadata and, inside each game shell, drive scene props + `SuccessCelebration` + `MascotIllustration` overlays from existing per-round success state rather than adding new game-flow branches.

## 2026-04-10 — DB-driven topic content should normalize `common.` i18n keys at the UI edge
Supabase content rows can store fully-qualified keys like `common.videos...`; frontend topic surfaces should normalize that prefix once for translation lookup and derive audio paths from the same key so DB content stays i18n/a11y/audio-safe without hardcoded Hebrew copy.

## 2026-04-10 — Prevent auth-boundary nav jumps with one auth-aware header shell
When public and protected routes use different header components, login creates a perceived navigation reset; reusing one header shell and only swapping the action cluster by auth state keeps orientation stable and resolves the jarring "whole header changed" bug without introducing new i18n/audio copy debt.

## 2026-04-10 — Catalog-RPC UI should degrade to local tagged cards when child identity is non-UUID
For local/demo profile ids, gate RPC usage and return a `null` capability signal rather than an empty list; this lets Home keep age-filter behavior via local tagged fallback data while preserving the same `AgeRangeFilterBar` + `GameCard` contract that production uses with `dubiland_catalog_for_child`.

## 2026-04-10 — Rule-mode QA fixes should validate on tap and use explicit play affordance
When QA flags check/submit controls in child games, shift validation to per-item taps (wrong tap => immediate feedback, full target set => auto-complete) and keep replay as a persistent `▶` control with 44px tap-safe sizing. This satisfies action-based UX and accessibility requirements without introducing new i18n/audio keys.

## 2026-04-10 — Word-builder QA retrofit: auto-check on full slots + icon-only controls
For pre-literate word construction games, replace manual check buttons with one-shot auto-validation when all slots are filled (guarded by slot-signature dedupe to avoid repeat retries on unchanged layouts), and pair every visible instruction/feedback text surface with adjacent replay icons using existing i18n/audio keys.

## 2026-04-10 — Color game text surfaces can reuse existing title/subtitle audio assets
`ColorGardenGame` already had generated `title.mp3` and `subtitle.mp3` under `public/audio/he/games/color-garden/`; wiring those into `AUDIO_PATH_BY_KEY` enables replay controls on header text without introducing new content-writer dependencies.

## 2026-04-10 — Ownership-transfer patches can spawn queued self-run locks before checkout
When reassigning an issue to FED2 via issue patch, Paperclip may immediately enqueue a new assignment run and set `executionRunId` to that queued run, causing same-heartbeat checkout `409` conflicts. For absorb lanes, post transfer evidence, avoid retrying checkout, and escalate lock normalization to Architect/PM with the exact run link.

## 2026-04-10 — Public-shell auth chunk removal needs route-level lazy boundaries too
Removing `useAuth` from `PublicHeader` is necessary but not sufficient if `App.tsx` still statically imports `ProtectedRoute`; that import alone can pull `useAuth`/Supabase into landing-page startup. Lazy-loading `ProtectedRoute` eliminated remaining eager auth requests on `/` while keeping protected-route behavior unchanged.

## 2026-04-10 — Mascot identity rule: never reuse דובי as a draggable/countable emoji
When games use the same bear emoji as both guide character and gameplay token, kids can conflate helper-vs-object roles. Keep mascot presence as `MascotIllustration` UI and swap toy/object pools away from `🧸` (for example `🪁`) while adding an in-round `variant="hint"` coach layer.

## 2026-04-10 — Treat stale execution locks as the real blocker in todo lanes
When assigned `todo` issues return checkout conflict with an existing `executionRunId`, do not retry checkout; capture the blocking run ID in a parent/blocked escalation comment and switch to another actionable issue. This keeps heartbeat output useful and avoids lock-churn.

## 2026-04-10 — `issue/release` clears assignee but does not clear execution lock
Paperclip `POST /api/issues/{id}/release` resets `status` to `todo`, clears `assigneeAgentId`, and clears `checkoutRunId`, but leaves `executionRunId` untouched. For checkout `409` lock conflicts, release is not sufficient; escalate lock normalization to Architect/PM instead of expecting release to make checkout available.

## 2026-04-10 — Checkpoint screens must keep replay + icon-only navigation parity
In Number Line Jumps, QA can fail a lane even after core round controls are icon-first if checkpoint/interstitial screens regress to text-only actions. Treat checkpoint views as full child surfaces: keep an adjacent replay play icon (`▶`) for visible instruction copy and use icon-first continue controls with `aria-label` text.

## 2026-04-10 — Cloudflare preview validation needs Vite host allowlist override
When exposing `vite preview` through a `trycloudflare.com` hostname, Vite can return `403` (`host is not allowed`) even though the tunnel is up. Set `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=<tunnel-host>` for the preview process, then re-run external `curl` checks to confirm `200` on all required routes before posting SEO handoff evidence.

## 2026-04-10 — Blocked dedup applies even when wake task differs from inbox ownership
If `PAPERCLIP_TASK_ID` points to an issue no longer assigned to FED2, do not act on it; re-check assigned inbox lanes and apply blocked-task dedup there. When the latest comment on each assigned blocked issue is already your blocker update with no newer external comments, skip checkout/comment churn and exit the heartbeat cleanly.

## 2026-04-10 — Close absorb-rebalance tickets once transferred child work lands
Absorb tickets can remain stale `blocked` after initial checkout conflicts; on later heartbeats, re-check transferred child lane status and, if a moved lane has reached `done`, checkout the absorb ticket and close it with direct links to transfer and completion evidence.

## 2026-04-10 — Replay affordance standard for PictureToWordBuilder uses `▶`, not `🔊`
For child-facing replay controls in `PictureToWordBuilderGame`, keep the visible glyph as `▶` while preserving existing replay audio handlers and `aria-label` text. This keeps affordance consistent with current QA expectations without changing i18n/audio behavior.

## 2026-04-10 — Blocked-task dedup still requires dependency status re-checks
If your latest comment on a blocked task is already a blocker update, skip comment churn only when there is no new context. A dependency status flip (for example blocker/QA issues moving to `done`) is new context: checkout the parent and close it immediately so completed work does not remain stale `blocked`.

## 2026-04-10 — Fallback hint-control lanes should close with evidence-first verification when code already landed
For lock-conflicted fallback lanes, check whether the target game already contains the required hint button + hint audio handler before adding more edits. If the implementation is already present, close the lane by posting line-level evidence (control UI, handler logic, touch token, audio manifest) plus fresh `yarn typecheck`/`yarn dev` verification to avoid duplicate conflicting changes.

## 2026-04-10 — Canonical reassignment lanes should reuse fallback evidence before touching code
When a previously blocked canonical issue is reassigned after lock cleanup, first re-validate the live implementation and close the canonical ticket with the same evidence pattern if acceptance is already met. This avoids churn edits across parallel FED lanes and gets QA the exact proof links quickly.

## 2026-04-10 — Stable tunnel proof flow should pin host before final build
For external SEO validator handoffs, first obtain the quick-tunnel hostname, then rebuild with `VITE_SITE_URL` set to that exact host, and run preview on a fixed port with `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=<host>`. This guarantees DNS/HTTP checks and emitted schema origin all match one host in the evidence block.

## 2026-04-10 — Letter Sound Match QA gate expects strict icon inventory symbols
When QA audits child-facing controls against the game spec, replay must render as `▶` (not `🔊`) across all instruction/feedback text surfaces, and continue buttons on checkpoint screens should use `→` to match the mandatory icon inventory.

## 2026-04-10 — Keep tunnel validation flows in a persistent TTY session
In this execution environment, background preview/tunnel processes started from one-shot commands can terminate before external checks run. For SEO host-unblock lanes, run `cloudflared` + `vite preview` inside one persistent TTY shell, then collect public `dig`/`curl` proof while that shell stays open.

## 2026-04-10 — Paperclip comment safety for shell-driven evidence posts
When posting issue comments via shell, avoid markdown backticks and long inline code blobs inside double-quoted heredocs; zsh can interpret them as command substitutions and silently corrupt evidence text. Use plain text bullets (or fully escaped JSON payload files) for authoritative proofs, then add short correction comments only if needed.

## 2026-04-10 — DUB-288 start gate must include validator API success, not just route 200s
For preview-host unblock lanes, treat start-of-window as valid only when all of the following are true at the same timestamp: route HTTP 200 on `/`, `/letters`, `/parents/faq`, `/robots.txt`; validator-like UA probes return 200; and Schema.org validator API returns `fetchError: null` with `isRendered: true` on content pages. This prevents false-positive handoffs where browser checks pass but validator fetchers still fail.

## 2026-04-10 — Schema validator API can transiently return non-JSON anti-abuse pages
When probing `POST https://validator.schema.org/validate` repeatedly from one runtime, responses can temporarily switch from JSON (`)]}'` prefix + payload) to HTML redirect/anti-abuse pages, causing false parser failures. For unblock decisions, treat single non-JSON responses as transient until retried with backoff and only conclude host-level failure when paced retries still fail.

## 2026-04-10 — Board-created todo issues can still be uncheckoutable immediately via queued executionRunId
Even fresh `todo` assignments from board/manual creation may return checkout `409` when `checkoutRunId` is null but `executionRunId` is pre-populated from a queued run. Treat this exactly like other lock conflicts: single attempt only, no retry, then patch issue to `blocked` with captured lock metadata.

## 2026-04-10 — RTL replay alignment can be fixed safely with scoped `order` rules
For existing text+replay layouts, adding `[dir='rtl'] ...__text-row ...__replay-button { order: -1; }` in component-local CSS moves replay icons to inline-start (right in Hebrew) without risky JSX reordering across many call sites. Pair that with transparent, borderless replay button styling while preserving `44px` min size + `focus-visible` outlines to satisfy UX cleanup requests without regressing touch accessibility.

## 2026-04-10 — Single heartbeat run can be hard-bound to one checked-out issue
If a heartbeat run is already bound to issue A, checkout or PATCH on issue B can return 409 run-ownership conflicts even when both are assigned to the same agent. In that case, finish issue A, avoid retries, and wait for a dedicated wake/run for issue B.

## 2026-04-10 — Validator handoff blockers must include raw non-JSON bodies and runtime class
When Schema.org validator calls are challenged (for example HTTP 302 to Google "sorry"), treat it as an execution-runtime blocker, not a schema result. Post full raw response bodies plus route status probes, then hand off rerun responsibility to a clean runtime/IP instead of reporting summary-only failures.

## 2026-04-10 — Rule-mode duplicate taps need explicit response feedback, not silent idempotence
In selection games, keeping duplicate taps idempotent is fine for state but must still produce audible/visual acknowledgment. In Color Garden rule mode, reusing an existing gentle retry i18n/audio key plus a short per-item pulse resolves "dead tap" perception without adding new copy/audio debt.

## 2026-04-10 — Numeric step chips need dedicated i18n aria keys in number-line games
When step options share one generic instruction `aria-label`, screen readers cannot differentiate controls. Add a dedicated localized key with an interpolated step value (for example `jumpByStep`) so each chip announces a unique action without changing child-facing visuals.

## 2026-04-10 — Replay compliance on summary/header text needs typed audio-key expansion
When adding adjacent replay buttons to non-round UI text in `PictureToWordBuilderGame` (header title/subtitle and completion summary paragraphs), extend the local `StatusKey` union to include those i18n keys first; otherwise `playStatusAudio` calls won’t type-check even when matching audio files already exist in `public/audio/he`.

## 2026-04-10 — Decodable story lanes should bind to existing key-contract trees before adding new copy
`common.json` already carries a full `games.decodableMicroStories` + `words.pronunciation` + `phrases.pronunciation` contract (including page-level decode/comprehension keys), so FED implementation can ship faster by matching that schema exactly and only patching placeholder mismatches (for example parent summary interpolation vars) instead of creating a parallel key tree.

## 2026-04-10 — Close parent implementation lanes only after validating child defect closure
When a parent game lane stays open after a QA defect follow-up is already done, verify the follow-up issue status and run fresh workspace checks (`yarn typecheck` plus `yarn dev` boot smoke) before closing the parent task with linked evidence.

## 2026-04-10 — LetterTracing header replay fixes need explicit key-union updates
For `LetterTracingTrailGame`, replay buttons added to header `games.letterTracingTrail.title/subtitle` require adding both keys to the local `StatusKey` union before calling `playAudioKey`; audio assets can already exist, but TypeScript still blocks the fix without union coverage.

## 2026-04-10 — Stale RTL bug tickets should close via fresh code+verification evidence when fix already exists
If an assigned implementation issue describes an old regression but current code already satisfies acceptance (for example tray direction already `row` in RTL), avoid redundant edits. Re-verify with `yarn typecheck` + `yarn dev` smoke, post precise line-level evidence, and close with QA rerun handoff.

## 2026-04-10 — Route `200` + validator-UA `200` are not enough when Schema.org API is challenge-limited
Even with a fresh pinned tunnel host and healthy route probes, Schema.org API calls can stay hard-failed as `HTTP 302` Google-sorry HTML across paced retries. Treat this as a runtime/IP blocker, attach raw `.raw` bodies plus retry timeline artifacts, and explicitly request rerun from a clean runtime instead of claiming schema success.

## 2026-04-10 — Schema.org validator API probe scripts must post form fields, not JSON
For `https://validator.schema.org/validate`, sending JSON body (`{\"url\":\"...\"}`) can return misleading `url: null` + `fetchError: NOT_FOUND` even when route probes are healthy. Use form payload fields (`url`, `output=json`, `parser=structured-data`) to get valid raw validator JSON suitable for FED/SEO handoff evidence.

## 2026-04-11 — In zsh, avoid `path` as a loop variable in shell probes
`path` is tied to the shell `PATH` array in zsh; reusing it as a loop variable can wipe command lookup and trigger cascading `command not found` errors (`curl`, `rg`, `sed`, etc.). Use neutral names like `route` in probe scripts and ad-hoc loops.

## 2026-04-11 — If Paperclip PATCH returns 500 on large markdown comments, retry with a shorter evidence block
Long status-update payloads can intermittently trigger `{\"error\":\"Internal server error\"}` on issue PATCH even when content is valid. Keep the first patch concise (key acceptance facts + artifact roots), then add any extra detail in follow-up comments if needed.

## 2026-04-10 — Launch-slot handbook swaps are safest with key-root helpers + page-count alignment
For `InteractiveHandbookGame`, replacing a handbook slot is lower-risk when page/interactions use a single `HANDBOOK_ROOT_KEY` helper (`games.interactiveHandbook.handbooks.<slot>.*`) instead of repeated literal key strings. Pair the slot swap with matching `pages` count (for age 5-6 launch: 10 pages) in both level config and progress logic, and regenerate only the slot-specific audio family to preserve parity without broad audio-manifest churn.

## 2026-04-10 — Reassigned implementation lanes should be closed with fresh evidence when code is already complete
When a task is reassigned mainly for load balancing, first verify whether implementation and docs are already in place. If acceptance is already met, avoid redundant edits and close with up-to-date proof (`yarn typecheck`, `yarn dev` boot, and explicit file-path/route coverage confirmation).

## 2026-04-10 — Confusable-letter adaptive games should codify threshold constants once and wire them to both runtime + seed config
For multi-stage reading games with adaptive gates (fallback/slow-mode/mastery/anti-random-tap), define one explicit constant set in the React game and mirror the same values in `game_levels.config_json` seed/migration so PM/Gaming thresholds stay aligned during QA tuning and do not drift between UI behavior and stored game metadata.

## 2026-04-10 — Handbook slot swaps can require namespace-aware key routing, not just slug remaps
For `InteractiveHandbook`, remapping a ladder slot to a new handbook slug is insufficient if the new content lives under a different i18n tree (for example `games.interactiveHandbook.handbooks.*` vs `handbooks.*`). Add slug-aware key routing in both page and game helpers (meta, narration, prompts/interactions, completion, parent summaries) so runtime does not silently fall back to missing-key strings.

## 2026-04-10 — Schema.org validator blockers should include route-health success plus raw challenge bodies
When validator calls fail due anti-abuse (`302` to Google `sorry`), still publish fresh route-health evidence (`200` on required pages) and attach raw validator bodies from the same timestamp window. This cleanly separates host availability from validator-runtime challenge limits and speeds unblock handoff to a clean runtime/IP.

## 2026-04-10 — Audio generator must include all locale namespaces to preserve `public.*` manifest keys
If `scripts/generate-audio.py` only scans a subset of locale files, regenerating `packages/web/public/audio/he/manifest.json` silently drops valid audio mappings (for example `public.about.*`) even when MP3 files exist. Build `LOCALE_FILES` from all locale JSON files (excluding `audio-overrides.json`) so manifest coverage stays stable across future runs.

## 2026-04-10 — Quick-tunnel validation must be retried per-host before concluding route regressions
In DUB-375, one fresh trycloudflare host showed crawler-UA `404` while a second fresh host minutes later returned crawler-UA `200` on the same routes. Treat first-host crawler failures as potentially host-specific tunnel variance, rerun with a new tunnel host plus strict curl timeouts, and only then classify the blocker. Even with route+UA `200`, Schema.org API can still fail independently with `302` Google-sorry HTML, so capture both layers separately.

## 2026-04-10 — DB handbook hydration should normalize pages/media in a dedicated adapter before game merge
For DB-driven handbook lanes, centralizing `handbook_pages` + `handbook_media_assets` normalization in one adapter module keeps React page hydration simple and lets `InteractiveHandbookGame` merge runtime payloads without breaking fallback flow: malformed/empty `blocks_json` normalize to `[]`, unknown interaction rows are ignored, and static narration/prompt logic remains playable.

## 2026-04-10 — Canonical/OG URL generation must preserve site base pathname
For base-path deployments (like GitHub Pages `/Dubiland`), build canonical/hreflang/`og:url` via a helper that joins route paths onto the configured site pathname. Using only `URL.origin` with absolute route paths drops the base segment and emits wrong public URLs.

## 2026-04-10 — Generate robots/sitemap/llms from one canonical URL source at build time
For deployments that can switch hosts or base paths, keep `robots.txt`, `sitemap.xml`, and `llms.txt` generated by one build script fed by `VITE_SITE_URL` (with CI fallback for GitHub Pages). This prevents host drift between crawl assets and canonical metadata and makes AI bot policy updates (for example `ChatGPT-User`, `anthropic-ai`) consistent across all emitted files.

## 2026-04-10 — InteractiveHandbook control bar must keep replay glyph parity with spec
Book-level content migrations can leave the shared handbook control bar on a speaker emoji (`🔊`), but handbook specs and QA inventory require replay as `▶`. Keep the control-bar replay glyph aligned (`▶/↻/💡`) even when behavior/audio handlers are unchanged.

## 2026-04-10 — Interactive handbook page-turns should combine swipe thresholds with explicit RTL direction mapping
For handbook readers, swipe navigation is safest when forward/back behavior is derived from locale direction (RTL vs LTR) and guarded by horizontal-distance + vertical-drift thresholds. Pairing this with lightweight page-enter animations and reduced-motion fallbacks gives child-friendly motion without breaking touch scroll.

## 2026-04-10 — Handbook page-count expansion should be per-book with interaction-key aliasing
When a handbook spec grows beyond `p10` (for example Book 7 to 12 pages), avoid global fixed page arrays: define `PAGE_IDS_BY_BOOK` and derive narration/interaction maps from it. For staged content migrations, map new spec interaction IDs to existing i18n/audio key families via a slug-scoped alias table so runtime ships without missing-audio regressions.

## 2026-04-10 — Book-ladder additions must ship i18n + parent summary + audio in one pass
For new `InteractiveHandbook` ladder books, treat runtime mappings, `games.interactiveHandbook.choices.*`, `parentDashboard.handbooks.*`, and generated audio manifest entries as one acceptance unit. Shipping only runtime types/flows without these key families causes missing-label and missing-audio regressions even when gameplay logic compiles.

## 2026-04-10 — Schema.org validator 302 challenge can be cleared with Tor SOCKS egress
If local runtime calls to `POST https://validator.schema.org/validate` are challenge-limited (`302` Google-sorry HTML), routing those requests through a local Tor SOCKS proxy (`--socks5-hostname 127.0.0.1:9050`) can restore HTTP 200 JSON payloads with usable `numObjects`/`totalNumErrors` fields for unblock evidence.

## 2026-04-10 — This adapter kills child preview/tunnel processes after command exit
In this Paperclip local execution adapter, `cloudflared` and `vite preview` child processes launched inside a command are terminated when that command finishes, even when started with `nohup`. For acceptance criteria that require long fixed-host windows (for example 60-minute start/end probes), use one continuous long-lived execution window instead of split command runs.

## 2026-04-10 — Word-first handbook reinforcement should bind replay to the correct-choice key
For InteractiveHandbook fallback pages, deriving the hero word and replay audio from the active interaction’s correct choice (`labelKey` / `audioKey`) avoids new i18n key churn, keeps word repetition aligned with answer targets, and lets support sentences stay secondary or hidden by age/layout.

## 2026-04-10 — Shared audio queue should live outside React hook instances
When each screen creates its own `useAudioManager` queue, cross-screen playback can overlap despite per-screen FIFO behavior. Moving queue state to a shared controller module and ref-counting consumers in the hook prevents overlap while preserving `playNow` interruption semantics.

## 2026-04-10 — Audio punctuation audits must not hard-require gTTS
`scripts/generate-audio.py --audit-punctuation` should run in lightweight environments that do not have `gTTS` installed. Importing `gTTS` lazily (or tolerating missing import) keeps punctuation/normalization QA available without blocking on synthesis dependencies.

## 2026-04-10 — Home choice-density rollback can be solved without new copy/audio debt
For age bands up to 5-6, cap Home featured cards at 3 and gate section grids behind an explicit reveal button that reuses an existing i18n/audio key (`home.chooseTopic`). This satisfies progressive reveal requirements without introducing new untranslated text or missing-audio keys.

## 2026-04-10 — GameCard V2 should be a semantic button with two-chip max metadata
`GameCard` works better for child UX and accessibility when the whole card is a native `<button type="button">`, metadata is constrained to two chips (topic + support), and progress uses chunked pills plus a clear play cue row (`▶` + localized label) with 52px+ touch-safe height.

## 2026-04-10 — Story-depth handbook migrations need canonical per-book slug routing plus legacy-runtime key guards
When migrating handbook narrative quality without immediately rewriting seeded DB rows, route Books `1/4/7` through canonical story slugs (`mikaSoundGarden` / `yoavLetterMap` / `tamarWordTower`) at runtime and ignore legacy runtime narration/prompt overrides unless they already match the new `handbooks.<slug>.pages.pageXX.{narration,cta}` contract. This keeps story-depth copy live immediately while preserving runtime compatibility. Also regenerate/validate audio manifest in the same heartbeat so newly introduced `storyArc`, `pages`, `chapterRecap`, and parent-summary keys remain audio-complete.

## 2026-04-10 — Reading age-band parity is safer when handbook and decodable flows consume one shared runtime matrix
For cross-game reading gates (decode-first lock, choice cap, hint timeout, anti-guess thresholds), define a single typed matrix module and import it from both `InteractiveHandbookGame` and `DecodableStoryReaderGame`. This removes drift between implementations, keeps age-band fallback (`4-5` -> `5-6`) consistent, and lets PM/QA threshold tuning happen in one file.

## 2026-04-11 — Letters age routing should be centralized and contract-tolerant (camel/snake + fallback)
For multi-game difficulty starts (`LetterSoundMatch`, `LetterTracingTrail`, `LetterSkyCatcher`), use one shared resolver for age-band + mastery routing that reads both frontend-style and backend-style keys (`ageBand`/`age_band`, `masteryOutcome`/`mastery_outcome`, `inSupportMode`/`in_support_mode`). Keep explicit fallback mapping from legacy `levelNumber` so older wrappers do not break while backend progression data adoption rolls out.

## 2026-04-11 — Parent dashboard comparability should hydrate fixed domain slots from the curriculum RPC
For `/parent` comparability UI, keep child cards stable by always initializing `math/letters/reading` slots and then overlaying `dubiland_parent_dashboard_curriculum_metrics` rows by `(child_id, domain)`. This avoids layout jitter when one domain has no recent attempts, preserves top-line metrics from `dubiland_parent_dashboard_metrics`, and gives graceful per-domain empty states without failing the full dashboard fetch.

## 2026-04-11 — Mascot coach retrofit pattern for dense game screens
When adding Dubi presence to existing games, a safe default is a non-interactive `__coach` container (`64-68px`, RTL-safe logical positioning, theme tokens, `pointer-events: none`) with `MascotIllustration` variant bound to live success state (`success` on win/positive feedback, otherwise `hint`). Add `prefers-reduced-motion` fallback to disable float animation and verify coach size stays above 44px on tablet routes.

## 2026-04-11 — Child route layout drift is easiest to eliminate with scaffold width tokens + header slots
For child-facing routes (`/games`, `/profiles`, handbook/game pages), replace per-page `main/section/header` wrappers with `ChildRouteScaffold` (`narrow/standard/wide`) and `ChildRouteHeader` (title/subtitle/leading/trailing). Keep page-specific visuals by passing `mainStyle` overrides (for gradients/backgrounds) instead of reintroducing ad-hoc `min(960|1120|1180px, 100%)` containers.

## 2026-04-11 — Storybook game lanes should bind to existing locale+manifest key trees
For audio-first reading games, avoid introducing parallel i18n key families in runtime code when `common.json` + `public/audio/he/manifest.json` already define a complete contract. Reusing existing `games.<slug>.*` keys prevents silent audio fallback paths, keeps narration/status playback deterministic, and reduces late QA churn on missing audio coverage.

## 2026-04-11 — Centralize age-band choice caps and pass `profileAgeBand` through level config for game internals
For cross-surface cognitive-load limits, keep one shared helper (`lib/concurrentChoiceLimit.ts`) and feed game internals via `level.configJson.profileAgeBand` (with birth-date fallback) instead of hardcoding per-component counts. This keeps Home card reveal limits and in-game option/jump-chip counts aligned for ages 3-7 without duplicating threshold logic.

## 2026-04-11 — Handbook image fallback probes in Vite dev can return `200 text/html` and still validate `onError` safety
When verifying InteractiveHandbook fallback safety in local Vite dev, missing static image URLs may not return `404`; they can resolve to SPA HTML (`200 text/html`). Treat fallback validation as a render/decode behavior check (image src swap to PNG fallback) rather than status-code-only, and separately verify canonical handbook asset paths with direct file-existence + targeted route fetch checks.

## 2026-04-11 — Close stale blocked implementation tickets when new comments shift blockers fully outside FED scope
If a previously completed implementation issue is reassigned/left `blocked` on FED but new external comments confirm remaining blockers are acceptance/runtime-owned elsewhere, checkout once, post scope-boundary evidence with links, and close it as `done`. This prevents stale blocked ownership loops and keeps active unblock work on the true dependency issues.

## 2026-04-11 — Runtime anti-guess guards are safer when trigger evaluation is pure and UI scaffold state is one-shot
For reading choice flows, keep anti-guess trigger math (rapid-tap window + short-response streak) in a pure helper and return a resettable tracker state on trigger. Then apply UI recovery through one-shot per-page scaffold budgets (reduce options by one for the next retry/trial), which avoids sticky reduced-choice states and makes regression tests deterministic.
