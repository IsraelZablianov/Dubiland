# 2026-04-10 — Handbook Startup Critical-Path Decision (Auth + Intro Narration)

- Owner: Architect
- Source issue: [DUB-479](/DUB/issues/DUB-479)
- Escalated from: [DUB-461](/DUB/issues/DUB-461)
- Parent initiative: [DUB-433](/DUB/issues/DUB-433)

## Context

Measured local mobile Lighthouse and throttled profiling on `/games/reading/interactive-handbook` show startup misses despite recent preload-manifest work:

- Perf score `93` (pass), but LCP `2869ms` (target `<2500ms`)
- Startup wall time `5010ms` (target `<4500ms`)
- One long task spike `1768ms` (target `<200ms`)

The remaining startup bottleneck is the same two-part critical path identified in [DUB-461](/DUB/issues/DUB-461):

1. auth/supabase initialization is still coupled to handbook route startup;
2. first narration fetch/start competes with initial paint on slow tablets.

## Decision

Adopt a **render-first handbook startup policy** with two enforced rules.

### Rule A — Decouple auth/supabase from handbook first paint

For `/games/reading/interactive-handbook`, we optimize for first visual readiness before server synchronization.

1. Keep route authorization semantics, but do not block first paint on auth loading state.
2. Remove eager supabase client import from handbook route code path; load supabase lazily when hydration/sync actually starts.
3. Render handbook shell + local/runtime fallback immediately; hydrate server state in the background.
4. Keep optimistic progress behavior; queue writes until supabase client and handbook id are ready, then flush.

Rationale:

- This route is child-facing and must be resilient on weak Wi-Fi/tablets.
- Current behavior blocks UX on auth + data hydration work that is not needed for first frame.
- We preserve data integrity by deferring only timing, not authorization or write semantics.

### Rule B — Standardize intro narration startup timing

Adopt one narration startup policy for handbook route:

1. On route entry, prioritize first visual paint and input readiness.
2. Start intro narration only after paint settles (two RAFs + ~`250-350ms` delay).
3. Preload first narration with non-blocking priority; avoid high-priority audio fetch on initial frame.
4. Keep replay/interaction audio immediate after the first startup narration gate has passed.

Rationale:

- Audio is required for non-readers, but startup audio must not starve paint-critical resources.
- A deterministic timing policy prevents regressions from route-to-route ad hoc timers.

## Implementation Contract

### FED execution contract

1. `packages/web/src/hooks/useAuth.tsx`
- keep auth bootstrap, but ensure handbook route does not force first-paint spinner dependency.
- scope eager auth checks to routes that truly require immediate auth gating.

2. `packages/web/src/components/ProtectedRoute.tsx`
- add handbook-specific loading behavior: during `loading`, allow rendering for handbook route and complete auth resolution in background.
- if auth resolves unauthenticated and guest mode is not active, redirect as today.

3. `packages/web/src/pages/InteractiveHandbook.tsx`
- replace top-level `supabase` import with lazy client loading (`import('@/lib/supabase')`) inside hydration/sync functions.
- remove first-render blocking hydration gate (`isHydratingProgress` must not block initial handbook shell render).
- keep optimistic progress queue and retry semantics intact.

4. `packages/web/src/games/reading/InteractiveHandbookGame.tsx`
- replace ad hoc first-page narration timer with a shared startup policy helper.
- use low-priority preload for first narration asset on route entry.
- trigger first narration only after paint-settled gate.

### Performance execution contract

1. Re-run baseline commands from `docs/architecture/2026-04-10-handbook-launch-trio-performance-budgets.md` after FED patch.
2. Publish before/after table in issue thread using same metrics: Perf, FCP, LCP, startup wall time, long-task max.
3. Confirm route-start transfer delta for `supabase-*` chunk and first narration request timing.
4. If LCP or startup wall target still fails, post top-2 remaining bottlenecks with next-step recommendation.

## Guardrails

- No schema change is required for this decision.
- No RLS or data access policy is relaxed.
- No hardcoded Hebrew copy or audio key bypass is allowed.
- Child data safety posture remains unchanged (parent-owned account, minimal child PII, optimistic writes synced post-paint).

## Success Criteria for This Decision

The implementation is considered successful when measured on the same local mobile profile:

- LCP improves toward `<2500ms` target (or clear quantified delta if still above target).
- Startup wall time improves toward `<4500ms` target.
- First-paint no longer waits on auth spinner or handbook hydration fetch.
- Intro narration starts consistently after paint-settled gate.
