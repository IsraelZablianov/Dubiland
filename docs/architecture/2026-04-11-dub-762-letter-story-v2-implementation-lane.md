# 2026-04-11 — DUB-762 Letter Story v2 Technical Implementation Lane

Date: 2026-04-11  
Owner: Architect (CTO)  
Related issues: [DUB-762](/DUB/issues/DUB-762), [DUB-664](/DUB/issues/DUB-664), [DUB-757](/DUB/issues/DUB-757), [DUB-758](/DUB/issues/DUB-758), [DUB-759](/DUB/issues/DUB-759), [DUB-760](/DUB/issues/DUB-760), [DUB-761](/DUB/issues/DUB-761)

## Context

`DUB-664` requires a new **Letter Story v2** experience as a separate game/route, not a replacement for the existing `/games/reading/letter-storybook` flow.

Current baseline (`LetterStorybookGame`) is emoji-forward and tightly coupled to v1 content keys. Letter Story v2 must support:

1. continuous narrative flow across the 22 Hebrew letters,
2. illustration-first pages from Media Expert assets,
3. i18n/audio parity for all child-facing text,
4. optimistic persistence behavior aligned with existing game attempt infrastructure.

## Decision

Ship Letter Story v2 as a new runtime surface with isolated slug, route, component, and i18n namespace while reusing existing platform primitives (`GameProps`, `useGameAttemptSync`, catalog RPC, Home fallback contracts).

## Runtime and File Boundaries

### New route and page shell

- Add route: `/games/reading/letter-storybook-v2`.
- Add page: `packages/web/src/pages/LetterStorybookV2.tsx`.
- Add game component: `packages/web/src/games/reading/LetterStorybookV2Game.tsx`.

Page shell requirements:

1. Use `ChildRouteScaffold` and `ChildRouteHeader` (RTL-first).
2. Use `useGameAttemptSync` for optimistic write + retry path.
3. Source all user-facing strings via `t(...)`; no hardcoded Hebrew.

### Routing and discovery surfaces

Update:

1. `packages/web/src/routing/gameRouteManifest.ts`
2. `packages/web/src/pages/Home.tsx` fallback option map and `HomeGameSlug` union
3. `packages/web/src/seo/routeMetadata.ts` with `indexable: false`

### Content and audio key namespace

Use a new namespace root:

- `games.letterStorybookV2.*`
- `parentDashboard.games.letterStorybookV2.*`

Audio contract:

- Every key used by page/game controls and prompts must resolve to an audio asset.
- Target path root: `/audio/he/games/letter-storybook-v2/...`.

## Data and Migration Contract

Create a new seed migration:

- `supabase/migrations/00038_seed_letter_storybook_v2.sql`

Game row requirements:

1. `slug = 'letterStorybookV2'`
2. `component_key = 'LetterStorybookV2Game'`
3. topic `reading`, published, with age tags:
   - primary `5-6`
   - support `3-4`, `6-7`
4. one `game_levels` row with `config_json` containing at minimum:
   - `adaptive: true`
   - `storyVersion: 2`
   - deterministic page/count metadata for QA verification

Do not alter or repurpose v1 `letterStorybook` rows.

## Upstream Dependency Interface (DUB-757..761)

Implementation lanes must consume these artifacts:

1. [DUB-757](/DUB/issues/DUB-757): letter progression + story-beat order contract.
2. [DUB-758](/DUB/issues/DUB-758): i18n key list and script pack.
3. [DUB-759](/DUB/issues/DUB-759): asset manifest with stable file paths and alt-text requirements.
4. [DUB-760](/DUB/issues/DUB-760): layout spec (mobile/tablet safe zones + touch targets >=44px).
5. [DUB-761](/DUB/issues/DUB-761): interaction cadence, checkpoint density, anti-random guard behavior.

Until those artifacts are posted, implementation lanes can scaffold infrastructure but must block final content wiring.

## Persistence and Metrics Contract

Letter Story v2 must persist via existing attempt pipeline:

1. `useGameAttemptSync` on completion.
2. `persistGameAttempt` path (through hook) receives deterministic summary metrics.
3. No simulated sync state; use real optimistic + retry semantics.

Parent-facing summary keys for v2 must exist before QA sign-off.

## QA Acceptance Contract

Two-stage QA:

1. Functional/RTL/A11y:
   - route render, navigation flow, touch targets, keyboard/focus order, RTL controls.
2. Data/audio verification:
   - persistence record written,
   - completion summary renders from v2 keys,
   - audio key parity for all visible prompts and controls.

`DUB-762` closes only after FED implementation, backend migration, and both QA lanes report PASS evidence.
