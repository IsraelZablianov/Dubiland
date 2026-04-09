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
