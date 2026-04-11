# DUB-686 Performance Audit

Date: 2026-04-11
Agent: Performance Expert

## Scope
- Bundle size + chunk topology (Vite production builds)
- Lighthouse performance runs on `/`, `/letters`, `/parents`, `/about`
- Animation path review (route transitions + game loops)
- Image optimization + lazy loading checks
- Code-splitting effectiveness check

## Evidence Files
- Baseline Lighthouse (current env): `docs/agents/performance-expert/evidence/dub-686/20260411-145149-baseline-preview/lighthouse-summary.json`
- NODE_ENV production check: `docs/agents/performance-expert/evidence/dub-686/20260411-145950-node-env-production-check/lighthouse-summary.json`
- Bundle env comparison: `docs/agents/performance-expert/evidence/dub-686/20260411-145950-node-env-production-check/bundle-env-compare.json`

## Key Findings

### 1) Critical: build environment leaks React development runtime into bundle
Observed root cause:
- Runtime env had `NODE_ENV=development`.
- `vite build` then emitted React development runtime into main bundle.

Measured impact (same code, env-only change):
- `index` chunk raw: `668,553 -> 461,042` bytes (`-207,511`, `-31.0%`)
- `index` chunk gzip: `178,343 -> 124,891` bytes (`-53,452`, `-30.0%`)
- total JS bytes: `2,098,691 -> 1,581,928` (`-516,763`, `-24.6%`)

Lighthouse median impact (4 routes, same machine):
- Performance: `82 -> 87` (`+5`)
- FCP: `3703ms -> 3214ms` (`-489ms`)
- LCP: `3721ms -> 3235ms` (`-486ms`)
- Max potential FID: `31ms -> 23ms` (`-8ms`)

### 2) LCP still misses target (<2.5s) after env fix
NODE_ENV=production check still shows text LCP in `3.1s-3.9s` band:
- `/`: `3934ms`
- `/letters`: `3201ms`
- `/parents`: `3135ms`
- `/about`: `3269ms`

LCP elements are text nodes (not images), so critical-path JS/CSS + font delivery are dominating first paint.

### 3) Code splitting is broadly effective
- App has 29 route-level `lazy()` imports in `packages/web/src/App.tsx`.
- Root route network shows only 6 scripts and only the landing page chunk loaded on first paint.
- No evidence of unrelated game route chunks on root first load.

### 4) Image optimization has a concrete regression on `/about`
Build/pipeline blocker from `images:budgets`:
- `public/images/about/boys-soccer-raw.png` (`1491.8 KiB`) > `120 KiB` limit
- `public/images/about/boys-soccer.jpg` (`243.0 KiB`) > `120 KiB` limit

Lighthouse `/about` confirms delivery inefficiency:
- `modern-image-formats`: est savings `154 KiB`
- `uses-responsive-images`: est savings `134 KiB`
- offending URL: `/images/about/boys-soccer.jpg`

### 5) Animation/render hotspots are concentrated in game code, not route shell
- Public route wrapper animation is currently bypassed in `App.tsx` for `shell === 'public'`.
- No Lighthouse non-composited animation findings on audited public routes.
- Game-level hotspot found in `LetterSkyCatcherGame`:
  - `setInterval(..., 40)` loop mutates state every tick (`setObjects(nextObjects)`), causing high-frequency React re-renders.
  - Transitions on layout-affecting props (`inset-inline-start`, `inline-size`) can trigger layout work each frame.

### 6) Missing CI performance gates
- No `@lhci/cli` config or CI assertions detected.
- No enforced budget gate for bundle size/LCP regressions in CI.

## Recommended Subtasks
1. Enforce production build env in all build/lighthouse scripts (`NODE_ENV=production`) and add a guard that fails if dev React runtime appears in build artifacts.
   - Owner: FED Engineer
2. Reduce critical-path bootstrap (`index` chunk) via deeper app-shell split (header/auth/metadata boundaries) and route-first JS minimization.
   - Owner: Architect + FED Engineer
3. Re-encode `/about` hero image to WebP/AVIF responsive set and update page markup to `srcset/sizes`.
   - Owner: FED Engineer
4. Refactor `LetterSkyCatcherGame` loop from interval-driven React state churn to RAF/ref update model; remove layout-property transitions in moving gameplay elements.
   - Owner: FED Engineer 3
5. Add Lighthouse CI + bundle budgets to fail regressions in PR/CI.
   - Owner: Architect
