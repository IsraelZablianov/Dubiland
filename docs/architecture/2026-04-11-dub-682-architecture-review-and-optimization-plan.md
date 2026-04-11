# DUB-682 Architecture Review and Optimization Plan

Date: 2026-04-11  
Owner: Architect (CTO)  
Issue: [DUB-682](/DUB/issues/DUB-682)

## Scope

This review covered:

- Data model completeness for upcoming games
- Schema optimization opportunities
- Component architecture and refactor opportunities
- Performance bottlenecks and architectural debt
- Shared types/constants in `packages/shared/`
- Game engine pattern and `GameProps` contract

## Findings

### 1) Game engine execution is fragmented across route pages

Evidence:

- `GameProps` is minimal and does not include persistence/session primitives: `packages/web/src/games/engine/types.ts:44`
- The app has hand-wired per-route wrappers for every game path: `packages/web/src/App.tsx:88`
- `NumberLineJumps` is currently the only route using canonical attempt persistence (`persistGameAttempt`): `packages/web/src/pages/NumberLineJumps.tsx:11` and `packages/web/src/pages/NumberLineJumps.tsx:90`
- Other routes still simulate sync without data persistence (example `CountingPicnic`): `packages/web/src/pages/CountingPicnic.tsx:64`

Impact:

- Inconsistent telemetry and parent dashboard coverage between games
- Repeated route boilerplate increases regression risk
- New game onboarding cost is higher than required by the “one component + one row” rule

Decision:

- Introduce a shared route-level game runtime (`GameRouteShell` + `useGameAttemptSync`) used by every game page
- Move per-game pages to declarative config (game slug + route + component), keeping UI-specific pieces local

### 2) Shared contract drift is causing domain and analytics blind spots

Evidence:

- Shared `Game` type carries `topicId` as free `string` (used as both slug and UUID in practice): `packages/shared/src/types/game.ts:16`
- Parent metrics domain resolver expects slug-like topic keys (`math|numbers|letters|reading`) and falls back to a partial game slug map: `packages/web/src/lib/parentMetricsAdapter.ts:30` and `packages/web/src/lib/parentMetricsAdapter.ts:37`
- Many shipped game slugs are absent from `DOMAIN_BY_GAME_KEY`, so domain resolution can return `null`: `packages/web/src/lib/parentMetricsAdapter.ts:129`
- `ParentSummaryMetrics.ageBand` omits `4-5`: `packages/web/src/games/engine/types.ts:10`

Impact:

- Parent metrics are not produced uniformly across the catalog
- Domain-level comparability is degraded for PM/QA decision-making

Decision:

- Canonicalize domain resolution via DB-backed metadata (`game_id -> topic_slug`) instead of local string heuristics
- Expand age-band typing to the full set (`3-4`, `4-5`, `5-6`, `6-7`)
- Tighten shared DTOs so topic identity is explicit (`topicId` UUID + `topicSlug`)

### 3) Hosted-child personalization currently drops age-band context

Evidence:

- Hosted profile fetch excludes age/birth context: `packages/web/src/pages/ProfilePicker.tsx:130`
- Active profile written to local session for hosted children does not include `ageBand`: `packages/web/src/pages/ProfilePicker.tsx:234`
- New hosted child insert also skips age-band/birth-date collection: `packages/web/src/pages/ProfilePicker.tsx:223`

Impact:

- Difficulty adaptation and age-filter defaults are weaker for real hosted accounts than for demo flows
- Metrics age-segmentation quality is reduced

Decision:

- Add an explicit child age-band capture path (preferred minimal-PII field) and propagate into active profile/session runtime
- Backfill existing children using server-side derivation where possible

### 4) Home progress read path has correctness and efficiency gaps

Evidence:

- Home hook reads sessions directly and filters with a UTC date prefix string: `packages/web/src/hooks/useChildProgress.ts:56`
- Daily minutes include only rows with `ended_at`, excluding active sessions: `packages/web/src/hooks/useChildProgress.ts:110`
- Parent dashboard already has RPCs that normalize durations with `COALESCE(ended_at, now())`: `supabase/migrations/00016_parent_dashboard_metrics_rpc.sql:119`

Impact:

- Under-counted daily minutes on home experience
- Extra client-side joins/work that duplicate server-side read-model logic

Decision:

- Reuse read-model RPCs (or a narrow dedicated RPC) for home metrics
- Add explicit session lifecycle finalization/update contract in the attempt write path

### 5) Offline-first and PWA architecture is not yet implemented

Evidence:

- Vite config does not register a PWA plugin: `packages/web/vite.config.ts:10`
- Web package dependencies do not include an IndexedDB outbox stack (`dexie`) or PWA tooling: `packages/web/package.json:20`

Impact:

- Weak resilience on tablet/unstable Wi-Fi scenarios
- Attempt writes can fail without durable retry guarantees beyond current in-memory state

Decision:

- Implement phased offline foundation:
  1. PWA app-shell and runtime caching
  2. IndexedDB outbox for attempt writes with UUID idempotency
  3. Background sync flush + UI retry surface

### 6) Parent metrics read model can be optimized for scale

Evidence:

- Current `parentMetricsV1` view/RPC repeatedly parses JSONB payload fields on `game_attempts`: `supabase/migrations/00026_parent_metrics_v1_read_model.sql:23`

Impact:

- Cost grows with attempt volume and multi-child households

Decision:

- Add typed projection columns or a maintained rollup table for frequent parent-metric dimensions
- Keep JSON payload for long-tail flexibility, but move hot fields to indexed primitives

## Prioritized Execution Plan

## P0 (immediate)

1. Unify game completion persistence across all game routes.
2. Fix shared contract drift that suppresses parent metrics (domain + age-band typing).
3. Restore hosted-child age-band personalization path.

## P1

1. Replace home progress joins with server read-model/RPC.
2. Add session lifecycle finalization path and ensure daily-minute correctness.
3. Start offline-first foundation (PWA + durable outbox).

## P2

1. Optimize parent metrics read model for scale.
2. Reduce route boilerplate by moving to declarative route manifest + game runtime wrapper.

## Delegation Map

- Backend Engineer: schema/read-model/session-lifecycle changes
- FED Engineer / FED Engineer 2 / FED Engineer 3: route runtime unification + hosted profile age-band propagation + route manifest cleanup
- Performance Expert: PWA + caching/offline performance baseline
- QA Engineer / QA Engineer 2: telemetry correctness, offline retry behavior, RTL/accessibility regression matrix

