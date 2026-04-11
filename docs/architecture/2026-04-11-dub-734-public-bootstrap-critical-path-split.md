# DUB-734: Public Bootstrap Critical-Path Split Plan

Date: 2026-04-11  
Owner: Architect (CTO)  
Related issues: [DUB-734](/DUB/issues/DUB-734), [DUB-686](/DUB/issues/DUB-686), [DUB-733](/DUB/issues/DUB-733), [DUB-634](/DUB/issues/DUB-634)

## Context

Performance Expert baseline for public routes after production-mode enforcement:

- `dist/assets/index-*.js`: `461,042` bytes (`124,891` gzip)
- Public-route LCP:
  - `/`: `~3934ms`
  - `/letters`: `~3201ms`
  - `/parents`: `~3135ms`

Current root graph still keeps too much startup logic in the entry chunk:

- `main.tsx` mounts global `ThemeProvider`, `BrowserRouter`, and `AuthProvider` before routing.
- `App.tsx` statically imports route chrome and metadata manager:
  - `AppShell` / `MarketingShell` -> `PublicHeader` + `PublicFooter`
  - `RouteMetadataManager` (JSON-LD/meta orchestration)
- `PublicHeader` includes auth-aware logic (`useAuth` + `usePublicAuthState`) even for anonymous public routes.

Route-level code splitting exists and is effective, but the root bootstrap still carries cross-cutting concerns that are not required for first paint on anonymous public paths.

## Decision

Adopt a four-step public critical-path split where each step must show measurable bundle/LCP deltas before moving to the next step.

### Step 1: Router Bootstrap Partition (public-first boundary)

Split startup into two route families:

1. `PublicBootstrapApp` (marketing/public routes only)
2. `ProtectedBootstrapApp` (auth-required route tree)

`main.tsx` should render a tiny route-family switcher first, then lazy-load protected route tree and protected shell logic only when the pathname resolves to protected space.

Target budget after Step 1:

- Root bootstrap chunk: `<=390,000` bytes raw, `<=106,000` gzip
- LCP targets:
  - `/`: `<=3400ms`
  - `/letters`: `<=3000ms`
  - `/parents`: `<=2950ms`

### Step 2: Metadata Sidecar Isolation (SEO wiring off hot path)

Move route metadata orchestration out of unconditional root mount:

- Keep minimal static fallback head tags in `index.html`.
- Load `RouteMetadataManager` only inside public route family and after first route commit (non-blocking mount).
- Keep canonical/JSON-LD parity by route through deterministic smoke checks.

Target budget after Step 2:

- Root bootstrap chunk: `<=345,000` bytes raw, `<=97,000` gzip
- LCP targets:
  - `/`: `<=3050ms`
  - `/letters`: `<=2800ms`
  - `/parents`: `<=2750ms`

### Step 3: Public Header/Auth Decoupling

Stop paying auth probe cost for anonymous marketing first paint:

- Split `PublicHeader` into:
  - static marketing header core (always available),
  - deferred auth-state probe sidecar (loaded on idle or explicit auth entry actions).
- Keep sign-in/out/profile affordances functionally identical after sidecar resolves.

Target budget after Step 3:

- Root bootstrap chunk: `<=305,000` bytes raw, `<=87,000` gzip
- LCP targets:
  - `/`: `<=2750ms`
  - `/letters`: `<=2580ms`
  - `/parents`: `<=2550ms`

### Step 4: i18n Startup Namespace Slimming

Keep i18n contract intact while reducing startup payload:

- Bootstrap with minimum namespace set for current route family.
- Load `common` namespace lazily for route families that require it.
- Preserve Dubiland rule: all user-facing strings remain i18n-backed and audio-backed.

Target budget after Step 4 (closure target):

- Root bootstrap chunk: `<=280,000` bytes raw, `<=80,000` gzip
- LCP targets:
  - `/`: `<=2500ms`
  - `/letters`: `<=2500ms`
  - `/parents`: `<=2500ms`

## Ordered Execution Plan (Implementation Tickets)

1. FED lane A (router split contract)
   - Implement Step 1 boundaries and prove chunk delta.
2. FED lane B (SEO metadata sidecar split)
   - Implement Step 2 and verify canonical/JSON-LD integrity.
3. FED lane C (header auth decoupling + i18n startup slimming)
   - Implement Steps 3-4 with parity checks for auth UX and translations.

Each lane must publish:

- Pre/post chunk table (`index`, `i18n`, `react`, total JS bytes)
- Lighthouse rerun for `/`, `/letters`, `/parents` (cold cache, direct navigation)
- Regression notes for auth behavior and metadata correctness

## Risk and Impact Notes

### Routing Risk

Risk: Route-family partition can create duplicate wrappers or break shared shell assumptions.

Guardrails:

- Keep one canonical shell contract per route family.
- Preserve protected-route behavior from [DUB-634](/DUB/issues/DUB-634) decisions.
- Add route smoke checks for all public and protected entrypoints.

### Auth Risk

Risk: Decoupled header auth probe can cause stale or flickering account actions.

Guardrails:

- Default to deterministic anonymous UI until probe resolves.
- Keep sign-out and profile navigation paths unchanged after probe hydration.
- Add explicit checks for guest mode and authenticated mode parity.

### SEO Metadata Risk

Risk: Deferred metadata mount can miss canonical/OG/JSON-LD state for crawlers or social scrapers.

Guardrails:

- Keep baseline static head tags in HTML.
- Mount metadata sidecar immediately after route commit (not user-interaction gated).
- Preserve and run JSON-LD smoke checks in CI/lane verification.

## Acceptance for DUB-734

`DUB-734` is complete when:

1. Plan artifact exists (this document + issue plan document).
2. Ordered FED execution tickets are created with explicit budgets.
3. Tickets include routing/auth/SEO guardrails and measurable verification outputs.
