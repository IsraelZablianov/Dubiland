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

## 2026-04-09 — Typed i18n keys in TS require explicit key maps for dynamic profile ids
When `t()` is strongly typed, template-string keys like ``profile.defaultNames.${id}`` fail compile-time checks and can widen return types to `unknown`; a `const` key map (`id -> exact i18n key`) keeps type safety and avoids hardcoded UI strings.

## 2026-04-09 — Route metadata defaults should map unknown URLs to 404/no-canonical
For public/app route split work, using a route-policy map with a `notFound` default and optional canonical avoids stale canonical/hreflang tags on unknown URLs; pair that with `noindex,nofollow` for non-indexable routes to align crawl behavior with architecture.

## 2026-04-09 — JSON-LD should be generated from route policy, not page components
Keeping schema generation inside the central route metadata manager (with reusable builders + validation) lets us enforce one rule set for `public indexable` gating, canonical URL construction, and FAQ i18n sourcing without duplicating logic across pages.

## 2026-04-09 — Ship-first game integration can use typed local game fixtures before catalog wiring
When game catalog DB rows/loader plumbing are not ready, a FED-safe path is to keep `GameProps` strict, inject local `Game`/`GameLevel` fixtures in a route wrapper, and still emit a typed completion payload (`summaryMetrics`) so Architect can wire persistence later without reworking gameplay logic.

## 2026-04-10 — Public-page copy needs explicit audio manifest updates
Current audio generation in this workspace covers `common` and `onboarding` keys, so new `public.*` UI strings (for example About page sections) need explicit MP3 generation and `packages/web/public/audio/he/manifest.json` entries to keep user-facing text/audio parity.

## 2026-04-10 — SPA 404 SEO policy needs explicit canonical/hreflang removal
For unknown routes in the route metadata map, using `canonicalPath: null` and removing canonical/hreflang tags in the metadata effect prevents stale canonical tags from persisting across client-side navigation while preserving `noindex,nofollow`.

## 2026-04-10 — Public tunnel validation needs Vite preview host allowlisting
When exposing Vite preview through a public tunnel (for example `*.trycloudflare.com`), requests can fail with `403 Blocked request. This host is not allowed` unless the tunnel hostname is added via `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` (or `preview.allowedHosts`); set this before validator runs so external crawlers get real `200` responses.

## 2026-04-10 — In RTL flex layouts, use `row` for start-side-first ordering
When a board should place the first child on the reading start side (right in Hebrew RTL), `flex-direction: row` preserves that behavior via document direction, while `row-reverse` in RTL flips to left-first and can regress tray/source ordering.

## 2026-04-10 — Audio-key families scale better than static per-file manifests in game components
For audio-first games with many dynamic letter keys, mapping i18n key families (`letters.pronunciation.*`, `letters.sampleWords.*`) to deterministic file paths inside the game component keeps playback reliable even when manifest generation lags; pair this with strict `GameProps` wrappers and route wiring so gameplay can ship while catalog seeding lands in a migration.

## 2026-04-10 — Game components can be complete while route/catalog wiring is still missing
Before marking a FED lane done, explicitly verify all four integration points: page wrapper, `App.tsx` route, Home launch entry, and DB seed migration. In this codebase, complex game components may already exist, but missing one of those integration steps still blocks QA and end-to-end playability.

## 2026-04-10 — Legal footer links require full route + metadata wiring
When public footer links point to legal pages, fix is not only adding React routes: also add i18n-backed page copy, route metadata keys (title/description/canonical), and sitemap entries in the same change so links stop 404ing and SEO tags stay coherent.

## 2026-04-10 — 404 recovery CTAs should avoid protected routes for anonymous users
On public fallback pages, secondary recovery buttons should target `/login` (or another public entry) instead of protected app paths like `/home`; otherwise guests/logged-out users hit auth redirects that feel like a loop instead of a clear next step.

## 2026-04-10 — Avoid duplicate game headings between page chrome and in-card shells
When a game route already renders page-level title/subtitle chrome, keep the active in-game shell focused on controls/status (not a second title block) and make draggable-item `aria-label`s unique with i18n text plus emoji/index to prevent indistinguishable controls in assistive tech.

## 2026-04-10 — Hebrew-first topic cards should avoid Latin alphabet emojis
On Hebrew marketing surfaces, emojis like `🔠` can visually read as Latin "AB/CD" and conflict with Hebrew-first positioning; prefer neutral learning icons (for example `🧩`) unless a dedicated Hebrew glyph asset is available.

## 2026-04-10 — Shared illustration/motion primitives unblock cross-page polish fast
For broad UI-polish tickets, creating small reusable wrappers first (`AnimatedPage`, `FloatingElement`, mascot/topic/feature illustration components) lets us replace emoji-heavy visuals and apply consistent reduced-motion-aware behavior across many routes with low regression risk.

## 2026-04-10 — Promise-tail audio queues are safer than mutable drain loops for chained prompts
When many game flows fire `audio.play(...)` calls quickly (timeouts, hints, replay), a single serialized promise tail plus explicit generation-based cancellation (`stop`/`playNow`/unmount) gives deterministic one-at-a-time playback and avoids overlap races.

## 2026-04-10 — Pre-literate game QA fixes should pair icon controls with per-text replay affordances
When QA flags pre-literate gaps, fixing only top-level replay buttons is not enough: each visible instructional/feedback text block (midpoint, completion, summary, hints, live round message) needs an adjacent 44px replay control wired to its exact i18n audio key, and manual “check/submit” controls should be replaced with action-triggered progression (drag/tap) plus optional hint icons.

## 2026-04-10 — Explicit dropzone hot/accept/reject states add polish without heavy refactors
For DOM/CSS game boards, tracking drag target states (`hot`, `accept`, `reject`) as explicit React flags gives clear child feedback (hover, success pop, gentle error shake) while staying low-risk and still honoring the existing global `prefers-reduced-motion` guardrails.

## 2026-04-10 — Lightweight score-strip motion helps game progress readability
Adding a compact score strip (`stars/clean-hits + round progress`) with short pulse-on-success and active-progress breathing animation improves at-a-glance pacing for kids and parents without introducing new copy, schema changes, or heavy runtime animation dependencies.

## 2026-04-10 — Route-shell motion is easier to tune with CSS variable direction contracts
For RTL-first apps, assigning public/app entry offsets via CSS variables on `html` (`--route-shell-inline-public/app`) and applying one shared keyframe keeps route transitions consistent across all pages while still allowing clean LTR overrides and reduced-motion zeroing.

## 2026-04-10 — Shared global UI (like footer) must be mounted in both public and app layouts
When a cross-site component is expected on all routes, verify it exists in each top-level layout (`PublicLayout` and `AppLayout`), not just one branch; otherwise authenticated pages silently diverge from public navigation/legal expectations.

## 2026-04-10 — Pre-literate icon bars need explicit action wiring, not just icon swaps
For child-first control baselines, replacing labels with icons is insufficient unless each icon has a narrated i18n cue and concrete behavior (`▶` replay exact prompt, `↻` retry + prompt replay, `💡` scaffold escalation, `→` continue/advance). Queueing advance callbacks in state/refs prevents “next” taps from becoming dead UI while preserving immediate trace-based validation.

## 2026-04-10 — Paperclip checkout conflicts can happen when a child issue is already execution-locked by another queued run
If `POST /checkout` returns a 409 with `executionRunId` set, do not retry that ticket. Switch to a different assigned issue (often the wake-target parent), continue useful implementation/verification there, and hand off with explicit evidence so QA can retest without waiting on the locked child run.

## 2026-04-10 — Transient game feedback states work best with explicit timeout refs
For low-risk polish in existing game components, model board-level `success/miss` animations and score-pill pulses as short-lived state plus timeout refs that are cleared on unmount; this prevents stale animation states while preserving reduced-motion compliance and avoids introducing heavier animation dependencies.

## 2026-04-10 — Letter choice-grid feedback should reset with shared refs to avoid overlapping pulses
In tap-based letter games, pairing `success/miss` grid animations with a single managed timeout ref (clear before set, clear on unmount) prevents stacked feedback classes when kids tap quickly, while still keeping `prefers-reduced-motion` behavior deterministic.

## 2026-04-10 — Pre-literate game shipping is fastest when audio path derivation follows i18n key structure
For new game lanes with large audio key families, deriving mp3 paths directly from i18n keys (kebab-case segments) avoids brittle per-file maps, keeps replay/hint/feedback controls consistent, and reduces integration risk when Content Writer audio has already been generated under predictable folders.

## 2026-04-10 — Some heartbeat runs are snapshot-bound to a specific issue
When checkout returns “run context is bound to a different issue,” treat the run as single-issue scoped: finish/update the snapshot issue (especially blocked-state communication) and avoid trying to hop into other assigned tickets until a new heartbeat run starts.

## 2026-04-10 — Replay compliance checks should validate glyph + touch target together
For child-facing narration controls, compliance is two-part: every replay affordance shows visible `▶` (not `🔊`) and keeps a minimum 44px target (`inline-size`/`block-size`), with no audio behavior changes.

## 2026-04-10 — Reading-builder polish can reuse ref-backed session stats for live score strips
In PictureToWordBuilder, deriving stars/round counters from existing `sessionStatsRef` plus short-lived pulse/board feedback state delivers visible pacing cues without new copy or schema work; clear those feedback timeouts on round reset and unmount to avoid stale animation carryover.

## 2026-04-10 — Route-entry audio fixes need metric attribution before chasing strict LCP targets
Deferring non-critical prompt audio (interaction-gated + delayed post-paint fallback) successfully removed prompt transfer from initial route entry, but LCP stayed high in repeated local Lighthouse runs; when this happens, explicitly mark the task blocked and escalate for broader render-path profiling instead of over-tuning child-first instruction timing.

## 2026-04-10 — Login trust polish should reuse shared mascot illustration variants
On the parent-facing `/login` gate, replacing a theme emoji with shared `MascotIllustration` (`hero` plus small `hint` near the guest CTA) preserves FTUE character continuity with the rest of public routes without adding new copy or audio keys.

## 2026-04-10 — Marketing CTA touch-target rollouts are safest with tokenized per-instance overrides
Because `Button` sizing is inline-style driven in this codebase, broad CSS class rules will not override touch height defaults; for scoped marketing uplift work, add explicit touch tokens (`60px` floor, `72px` prominent target) and pass style overrides only on conversion CTAs so app/internal controls keep existing behavior.

## 2026-04-10 — Shell-page QA regressions cluster around i18n-safe errors + explicit CTA wiring
For platform-shell routes, treat auth errors as i18n-controlled copy only (no raw backend messages), expose selection state with `aria-pressed` on interactive cards, and avoid “looks-clickable but no-op” buttons by attaching a concrete handler (navigation, scroll, or local panel toggle) before handing back to QA.

## 2026-04-10 — Letter Sound Match fallback lane closes fastest by pairing replay parity with persistent icon controls
When a QA fallback asks for pre-literate baseline closure, treat header/midpoint text replay parity as separate from tray controls: add adjacent replay buttons to title/subtitle surfaces and keep persistent `🔊` + `💡` + `↻` tray actions wired to existing i18n-backed audio cues so no new copy/audio generation is required.

## 2026-04-10 — Shape matching games benefit from light board feedback loops before full art pass
For ShapeSafari-style rounds, adding tiny transient board feedback (`success` pop / `miss` shake), a compact first-attempt score strip, and active-progress breathing gives immediate UX clarity without new copy/assets, as long as timers are ref-cleaned and `prefers-reduced-motion` explicitly disables every new class.

## 2026-04-10 — Color sorting games can reuse panel-level feedback to avoid mode-specific animation branches
For multi-mode boards (match/sort/rule) like ColorGarden, attaching `success/miss` choreography to the shared board panel wrapper is lower-risk than per-mode grid animations and still gives clear feedback while keeping touch/RTL behaviors unchanged.

## 2026-04-10 — FTUE profile pickers should separate discovery controls from route-critical CTAs
On `/profiles`, keeping first paint to one selected card plus a low-emphasis disclosure for demo profiles reduces child choice overload without removing flexibility; also enforce label-route honesty (`parentZone` for `/parent`) so parent actions remain trustworthy.

## 2026-04-10 — Reopened implementation lanes can close via verification-only when mandatory fixes are already present
If a reassigned FED issue targets specific QA gaps that are already present in the current code snapshot, do not force redundant edits; re-verify the exact acceptance checks (`typecheck` + app startup), post a concrete parent handoff comment with file/behavior/audio evidence, and close the lane cleanly.

## 2026-04-10 — Instruction/prompt overlap fixes are safest with a local playback-mode wrapper
For game-specific overlap bugs, keep default audio queue behavior intact and add a tiny per-component playback mode (`queue` vs `interrupt`) so only instruction/prompt cues use `audio.playNow(...)`; this prevents guidance from being masked by praise while preserving replay/hint/retry control narration behavior.

## 2026-04-10 — Footer regressions on authenticated routes can be fixed at shared layout layer
When app routes all mount through `AppLayout`, restoring a missing shared footer is safest by adding it once in `AppLayout` (and verifying `typecheck` + `yarn dev` startup) instead of patching individual route pages.

## 2026-04-10 — Collapsed sheets must gate design-system Card interactivity
In this codebase, `Card` sets `role=button` and `tabIndex=0` whenever `interactive` is true, so collapsible regions cannot leave hidden cards mounted with `interactive` always-on; tie `interactive` to the expanded state (or unmount collapsed content) to keep hidden controls out of sequential keyboard focus.

## 2026-04-10 — Decorative mascot overlays need descendant-level pointer-event guards
Setting `pointer-events: none` on a wrapper alone is not enough for complex mascot/celebration compositions; enforce non-interactive behavior at the mascot component itself and on overlay descendants, then keep game content layers explicitly above decorative layers (`z-index`) to prevent touch blocking regressions.

## 2026-04-10 — Replay/inactivity QA closures are fastest with one shared visual-feedback hook
When spec requires both replay and idle-recovery emphasis, centralize behavior in reusable helpers (prompt pulse + target highlight timeout) and call the same path from replay tap and inactivity timer; this keeps feedback parity tight, avoids drift between flows, and simplifies reduced-motion coverage.

## 2026-04-10 — Single-title QA fixes should prefer keeping the surface that already has replay audio
When duplicate page and in-card headings are flagged, the least risky closure is to keep only the title/subtitle surface that already includes i18n-backed replay controls, and remove the duplicate surface so hierarchy is singular without needing new audio wiring.

## 2026-04-10 — Home RTL progress bars should combine anchor direction and gradient direction
For RTL-native progress rails, move the fill anchor to the inline start edge (`justify-content: flex-end` under `html[dir='rtl']`) and flip gradient orientation (`270deg`) together; this keeps both growth motion and color flow aligned with Hebrew reading direction.

## 2026-04-10 — Tracing games need separate miss/success feedback channels to avoid stale board states
In pointer-trace mechanics, keep `success` and `miss` board animations as distinct short-lived states with dedicated timeout refs (cleared on unmount) and pair them with active-dot breathing + score-pill pulse; this delivers clearer pacing feedback without breaking reduced-motion behavior.

## 2026-04-10 — Shell navigation audio needs a short lead window before route changes
When `useAudioManager` is owned by the current page, immediate `navigate(...)` cuts feedback playback on unmount; for child-shell actions (`/home`, `/profiles`), trigger `audio.playNow(...)` first and delay navigation briefly (~140ms) with a cleanup-safe timeout so taps feel responsive and audible.

## 2026-04-10 — Reopened 404 lanes should be verified against current router before editing
When a legal-route bug is re-assigned after lock/review churn, first validate live route wiring (`App.tsx`, footer links, i18n pages) and run `@dubiland/web` typecheck/build; if the fix is already present, move directly to `in_review` with concrete verification evidence instead of adding redundant code churn.

## 2026-04-10 — Shape retry cadence is clearer when miss stages map to distinct audio primitives
For pre-literate shape rounds, map miss #1 to prompt replay + pulse, miss #2 to scaffold hint + distractor reduction, and miss #3 to a short demo sequence before same-target retry; this avoids repetitive “try again” loops and keeps the retry/next icon contracts audibly consistent.

## 2026-04-10 — Inline-style game components can still adopt shared motion polish via a local class layer
When an existing game relies mostly on inline styles (like RootFamilyStickers), add a small class-based layer for progress-dot breathing, score-pill pulse, and transient success/miss surface states, plus timeout cleanup and reduced-motion guards; this enables consistent animation polish without a risky full styling rewrite.

## 2026-04-10 — Midpoint next-arrow cues should block round transition briefly
For midpoint `→` controls in narrated games, play an existing `feedback.success.*` clip with interrupt mode and delay the next-round state swap by a short fixed window (~520ms), guarded by a timeout ref; this preserves audible confirmation before the next instruction audio starts and prevents double-tap races.

## 2026-04-10 — Add one timeout owner per transient animation lane in reading games
When adding board success/miss choreography plus score-pill pulse in reading games, give each transient effect its own timeout ref (`advance`, `feedback`, `pulse`) and clear all refs on retry/unmount; this prevents stale callbacks from firing into the next round and keeps reduced-motion toggles predictable.

## 2026-04-10 — Parent dashboard honesty requires one RPC contract and one shared daily-goal constant
For `/parent`, avoid recomputing metrics from raw `game_sessions` in the client; consume `dubiland_parent_dashboard_metrics` once, map by `child_id`, and drive today/weekly/streak cards directly from the RPC fields. Keep the daily-goal denominator in a shared web constant used by both Home and Parent Dashboard so product can tune one source instead of diverging hardcoded values.

## 2026-04-10 — Profile add flows should stay visible after first successful create
In hosted profile pickers, avoid rendering the create-child form only in the zero-state branch; once the first child is created, the same form must remain accessible in the normal picker layout so parents can add additional children without a hidden second path.

## 2026-04-10 — Authenticated shell headers must expose a global sign-out path
When protected routes reuse a marketing-style shared header, verify the authenticated action cluster still includes `signOut`; if not, add a top-level logout control that clears guest/local child session state and then calls auth sign-out so users are never trapped in-session.

## 2026-04-10 — Parent-facing polish lanes close fastest by reusing Home visual primitives
For `/parent` parity tasks, a low-risk lift is to reuse the Home storybook background treatment, header grid rhythm, and card chrome (2px themed border + subtle gradient + `padding="lg"`), then scope page-specific classes (`parent-dashboard__*`) so responsive/RTL behavior stays predictable without touching shared design-system components.

## 2026-04-10 — Parent weekly child cards are more scannable as identity-plus-metrics blocks
In `/parent`, replacing wrap-heavy inline stat text with a two-zone layout (avatar/name/stars + responsive 2x2 metric grid) and adding a dedicated no-children card/CTA improves tablet readability without introducing new i18n/audio keys.

## 2026-04-10 — Parent action bars should separate navigation/utilities from destructive controls
For `/parent` polish, place report jump + settings toggle in a shared toolbar card and keep logout as a smaller trailing danger action; pairing this with dedicated audio-settings i18n copy (instead of reusing page subtitle) improves IA honesty while staying compliant with text+audio requirements.

## 2026-04-10 — Global SPA scroll reset is safest as a router-level utility component
When cross-page navigation keeps prior scroll positions, add one `ScrollToTop` null-render component at app root that watches `useLocation()` and calls `window.scrollTo(0, 0)` in `useLayoutEffect`; this fixes all route branches at once and avoids brittle per-page patches.

## 2026-04-10 — Public shell home affordances must be session-aware
On mixed public/app surfaces (`PublicHeader`, `NotFound`), route logo and recovery CTAs to `/home` for active guest/auth sessions while keeping anonymous fallback to marketing `/`; this preserves “back to games” continuity without adding new copy/audio keys.

## 2026-04-10 — Launch-slot aliases should be explicit in FED runtime mappings
For handbook launch-trio lanes, keep a visible alias map in reader/runtime code (`bouncy-balloon` → `mikaSoundGarden`, `magic-letter-map` → `magicLetterMap`, `star-message` → `tamarWordTower`) and drive age-band page counts from the active ladder book (`book1` uses 8 pages). This gives QA deterministic slug traces while preserving canonical DB slugs.

## 2026-04-10 — Decodable reading checkpoints polish best when feedback sits on the panel container
In comprehension-heavy reading games, adding transient `success/miss` choreography to the shared checkpoint panel (instead of each option button) plus score-pill pulse + active progress breathing gives clearer pacing without extra copy/audio keys, and stays stable if every transient state is reset on page-change/retry and disabled under `prefers-reduced-motion`.

## 2026-04-10 — Fast-action catcher games need score feedback in the always-visible header lane
For reflex games like `LetterSkyCatcher`, pulsing the existing score pill on successful catches and adding breathing animation only to the active progress dot gives immediate reinforcement without adding layout noise; keep pulse timers cleanup-safe and disable both animations under reduced-motion.

## 2026-04-10 — Smooth-scroll controls must honor reduced-motion at action time
For parent-facing utility actions that jump within the page (like "view reports"), compute `prefers-reduced-motion` when the control is activated and switch `scrollIntoView` to `behavior: 'auto'`; this closes accessibility review gaps without changing layout or copy/audio contracts.

## 2026-04-10 — Parent dashboard empty-state QA closures should gate summary KPIs with `hasChildren`
When QA requires an empty-state CTA "instead of" zero metrics, treat the whole dashboard body as two branches (`hasChildren` vs empty state) so summary cards and weekly list never render placeholder zeros; then verify with both `yarn typecheck` and a real Vite startup to prove the lane is review-ready.

## 2026-04-10 — RTL reader controls should derive direction once and mirror navigation glyphs
For Hebrew storybook controls, compute `isRtl` from `i18n.dir()` in the component and use it for forward-arrow glyphs (`←` in RTL, `→` in LTR); pair this with stronger text contrast (not near-threshold secondary tones) on small labels/buttons to avoid QA contrast failures around 4.49:1.

## 2026-04-10 — Shell touch-floor fixes are safest with explicit floor aliases plus source-level regression checks
For shared marketing/app shells, define dedicated floor tokens (`--touch-min-secondary: 44px`, `--touch-min-primary: 60px`) and enforce them directly on logo/nav/footer selectors, then add a lightweight node:test guard that inspects those selector blocks in source to catch accidental regressions even when runtime Playwright coverage is intermittent.

## 2026-04-10 — Replay icon QA checks should assert icon routing, not only button wiring
In shared icon components, a missing explicit branch (for example `kind === 'replay'`) can silently fall through to a default glyph. For pre-literate controls, verify both the replay button hookup and the rendered icon contract (`▶` affordance) before closing QA blockers.

## 2026-04-10 — Bookshelf metadata text on gradient cards should default to primary text contrast
In `InteractiveHandbook` bookshelf cards, tiny duration labels rendered with `--color-text-secondary` can fail WCAG2AA on accent-tinted gradients; using `--color-text-primary` (plus semibold weight) is a safer baseline for small metadata text in child-facing card surfaces.

## 2026-04-10 — Telemetry writes from local game fixtures need slug resolution plus retry-stable IDs
When game pages still use local placeholder IDs (`local-*`), resolve the canonical `games.id` by `slug` before invoking `submit-game-attempt`; keep one `clientSessionId` per play session and reuse the same `attemptId` on retry so idempotent upserts do not duplicate attempt rows.

## 2026-04-10 — Status badges in reading games should avoid speaker glyph fallbacks
For child-facing reading games, keep replay controls explicitly `▶` and use the same non-speaker icon language for neutral status badges; replacing `🔊` fallback in `toneIcon` avoids glyph inconsistency regressions while preserving i18n/audio behavior and 44px replay target compliance.

## 2026-04-10 — Reader toolbars should use semantic SVG icons and a single title surface
For handbook-style game shells, replace literal toolbar glyphs (`▶`, `💡`, `→`) with reusable SVG controls that keep `aria-label` text and mirror direction in RTL via transform; keep the editorial title only at page chrome level to prevent duplicate headings inside the game card.

## 2026-04-10 — Age-band mastery overrides should run after DB/runtime merge in handbook flows
When handbook interaction `required` flags can come from seeded defaults and `handbook_pages.interactions_json`, age-band-specific contracts (for example 3-4 exposure-only decoding on `magicLetterMap` `p06/p07`) must be applied after runtime merge so profile policy is enforced consistently regardless DB defaults.

## 2026-04-10 — New handbook lanes ship fastest when treated as "slug package + ladder slot + audio parity"
For non-launch handbooks (e.g. `oriBreadMarket`), implementation is stable when done as one bundle: add slug/book mapping in reader runtime, define interaction flow + required flags for that slot, add full `common.handbooks.<slug>` and `common.parentDashboard.handbooks.<slug>` families, then run `yarn generate-audio` and verify manifest coverage before moving to `in_review`.

## 2026-04-10 — Large button size must come from the touch-action token
Keep `Button` `size="lg"` bound to `--touch-primary-action` (not hardcoded px), then remove per-page `minHeight` overrides in child flows so Home/Profile/Game/Handbook CTAs stay consistent and token-controlled.

## 2026-04-10 — Handbook DB hydration should degrade gracefully when media-asset query fails
For DB-driven handbook rendering, treat `handbook_pages` as the critical source and keep runtime content active even if `handbook_media_assets` fetch errors; passing an empty media list preserves block/narration integration and avoids unnecessary fallback to legacy-only page definitions.

## 2026-04-10 — Route de-dupes should migrate nav, auth redirects, and crawl metadata together
When consolidating duplicate app routes (`/home` -> `/games`), close the loop in one pass: remove the route definition, retarget in-app navigation/back actions and login/profile redirects, and regenerate crawl assets (`robots.txt`, `llms.txt`) so SEO metadata does not retain stale private paths.

## 2026-04-10 — Audio-degradation fallback should be stateful and non-blocking in game loops
In narration-heavy games, wrap `audio.play`/`playNow` with one shared failure handler that flips a persistent `audioDegraded` flag, keeps gameplay interactive, and surfaces a compact fallback hint row. Pair this with `--touch-min: 48px` and replace hardcoded `44px` controls in game-local styles to satisfy child touch-target QA quickly across multiple game shells.

## 2026-04-10 — Child-route shell splits are safest with compatibility wrappers
When replacing one shared app layout with dedicated route shells, add explicit `MarketingShell`/`ChildPlayShell`/`ParentShell` components, but keep legacy `PublicLayout`/`AppLayout` as thin wrappers for compatibility. This lets App route mounts switch immediately while minimizing blast radius for any lingering imports.

## 2026-04-10 — Checkpoint states need their own audio-first control pair
When a game inserts a checkpoint between rounds, treat it as a separate narrated state: auto-play the checkpoint instruction on entry, add a visible `▶` replay button for that exact instruction key, and keep continue icon-first with an aria label and 44px-safe target sizing.

## 2026-04-10 — Directional controls in RTL games need side-specific aria labels and mirrored audio keys
When controls are symmetric in layout (left/right movement, left/right basket/count actions), avoid shared instruction labels because screen readers collapse them as duplicates. Use side-specific i18n keys (`...Left`/`...Right`) for aria names and run `yarn generate-audio` so the new keys immediately get manifest-backed Hebrew audio assets.

## 2026-04-10 — Fast touch-target audits across games are easiest with one literal scan pass
When a quality lane asks for child tap target enforcement across many game files, scanning `packages/web/src/games/**` for literal `44px` tokens and normalizing to `48px` in one patch is a reliable first sweep; then verify with `rg "44px"` returning empty plus `yarn typecheck` and a Vite boot check.
