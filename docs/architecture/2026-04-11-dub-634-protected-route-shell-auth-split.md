# DUB-634: Protected-Route Shell vs Auth/Bootstrap Split for LCP Budget Recovery

Date: 2026-04-11  
Owner: Architect (CTO)  
Related issues: [DUB-634](/DUB/issues/DUB-634), [DUB-506](/DUB/issues/DUB-506), [DUB-593](/DUB/issues/DUB-593), [DUB-610](/DUB/issues/DUB-610)

## Context

Post-[DUB-610](/DUB/issues/DUB-610) route matrix evidence still shows protected-route contamination and budget misses:

- `/games`, `/profiles`, `/parent`, `/games/reading/interactive-handbook` all request `Login-*.js` + `supabase-*.js` on first-load audits.
- Median protected-route LCP remains around `~3.99s` (target `<2.5s`).
- Measured source: `docs/agents/performance-expert/evidence/dub-506/20260411-012316-final-matrix-post-dub-610/lighthouse-summary.json`.

Current routing/auth shape still lets auth/bootstrap work leak into first protected paint:

- global `AuthProvider` sits above app routing (`packages/web/src/main.tsx`);
- `ProtectedRoute` always consumes `useAuth` (`packages/web/src/components/ProtectedRoute.tsx`);
- protected route modules still import `@/lib/supabase` statically (`ProfilePicker`, `ParentDashboard`, `useChildProgress`, `catalogRepository`, `gameAttemptPersistence`).

## Decision

Dubiland will enforce a two-phase protected route startup model:

1. **Phase A: protected shell first-paint (no auth/bootstrap imports in critical path)**
2. **Phase B: auth + Supabase hydration as deferred sidecar (or on privileged action)**

This is now the required architecture for protected routes used in Lighthouse gating.

## Architecture Contract

### 1) Split Route Guard Responsibilities

Create two explicit boundaries:

1. `ProtectedShellBoundary` (new)
- No `useAuth` dependency.
- No direct `@/lib/supabase` import.
- Reads only:
  - `isSupabaseConfigured` from config,
  - guest-mode/session-hint flags from storage.
- Renders route shell immediately for protected paths in guest/session-hinted states.

2. `AuthBootstrapGate` (new)
- Runs after first paint (idle callback + timeout fallback).
- Owns lazy import of auth runtime and reconciliation to one of:
  - continue in guest/session-backed mode,
  - redirect to `/login` if required.
- Must not block first shell paint.

`ProtectedRoute` becomes a thin composition of these two boundaries, instead of directly coupling first paint to auth bootstrap.

### 2) Supabase Import Hygiene (Protected-Shell Safe)

On first-load of protected routes, static module graph must not include Supabase client.

Required pattern:

- New runtime loader utility (for example `loadSupabaseRuntime()` helper) that wraps `import('@/lib/supabase')`.
- All protected-route code paths call the loader inside effects/actions, not top-level imports.

First migration scope:

- `packages/web/src/pages/ProfilePicker.tsx`
- `packages/web/src/pages/ParentDashboard.tsx`
- `packages/web/src/hooks/useChildProgress.ts`
- `packages/web/src/lib/catalogRepository.ts`
- `packages/web/src/lib/gameAttemptPersistence.ts`

### 3) Deterministic Lighthouse Measurement Contract

All protected-route audits must declare and lock three dimensions:

1. **Auth state profile**
- `guest_shell`: `localStorage['dubiland:guest-mode']='true'` + guest active child set.
- `anonymous_redirect`: no guest flag, no Supabase auth token.
- `authenticated`: seeded perf test account session (non-production credentials, local/dev only).

2. **Cache state**
- Cold cache run: clear storage, caches, service workers, and cookies before each route.
- Warm cache run (optional secondary matrix): after one priming navigation.
- Gate decisions use **cold** matrix unless explicitly noted.

3. **Route entry semantics**
- Direct URL document navigation (not in-app click) for each audited route.
- One route per Lighthouse run.
- Same throttling preset across the full matrix.

### 4) Protected-Route Budget Table (Gate)

Applies to cold-cache `guest_shell` and `authenticated` profiles for:

- `/games`
- `/profiles`
- `/parent`
- `/games/reading/interactive-handbook`

| Route | LCP | FCP | Max long task | Total transfer bytes | Contamination flags |
|---|---:|---:|---:|---:|---|
| `/games` | `<=2500ms` | `<=1800ms` | `<=200ms` | `<=230000` | `login_chunk_requested=false`, `supabase_chunk_requested=false` |
| `/profiles` | `<=2500ms` | `<=1800ms` | `<=200ms` | `<=220000` | `login_chunk_requested=false`, `supabase_chunk_requested=false` |
| `/parent` | `<=2500ms` | `<=1800ms` | `<=200ms` | `<=230000` | `login_chunk_requested=false`, `supabase_chunk_requested=false` |
| `/games/reading/interactive-handbook` | `<=2500ms` | `<=1800ms` | `<=200ms` | `<=240000` | `login_chunk_requested=false`, `supabase_chunk_requested=false` |

If any route fails either budget or contamination flag, lane remains open and requires executable follow-up.

## Implementation Breakdown (Delegation Contract)

### FED lane (primary implementation)

Deliverables:

1. Implement `ProtectedShellBoundary` + `AuthBootstrapGate` composition for protected routes.
2. Remove first-load static Supabase imports from the migration file set listed above.
3. Keep existing auth semantics intact:
- non-guest + no valid session must still resolve to `/login`,
- guest mode remains allowed for child-facing flows.
4. Add route-level smoke tests (or equivalent runtime assertions) for:
- no first-paint block on auth bootstrap,
- redirect still occurs in `anonymous_redirect` profile.

### Performance lane

Deliverables:

1. Build/commit deterministic matrix runner that records:
- auth profile used,
- cache mode,
- route entry mode,
- contamination flags and vitals per route.
2. Run pre/post matrix against this budget table.
3. Post pass/fail summary with evidence links.

### QA lane

Deliverables:

1. Validate behavior matrix:
- `guest_shell` protected routes render without auth spinner lock,
- `anonymous_redirect` routes still route to login correctly,
- `authenticated` routes retain expected data behavior.
2. Validate RTL and touch UX are unchanged on `/games`, `/profiles`, `/parent`, handbook route.
3. Cross-check Lighthouse result artifacts map to the declared profile and cache mode.

## Risks and Guardrails

1. **Security regression risk**: shell-first must not become auth bypass for parent-owned data.
- Guardrail: redirect logic remains mandatory in non-guest unauthenticated state.

2. **Runtime drift risk**: ad-hoc future imports of `@/lib/supabase` can re-contaminate startup.
- Guardrail: keep protected-route static import ban documented and checked in review.

3. **Measurement drift risk**: route audits without explicit auth/cache profile are not comparable.
- Guardrail: reject evidence lacking profile + cache + route-entry metadata.

## Acceptance for DUB-634

`DUB-634` can close only when:

1. FED implementation lands with boundary split + import hygiene.
2. Performance matrix shows all four protected routes meet budgets with contamination flags cleared.
3. QA confirms auth-state behavior correctness and no RTL/touch regressions.
