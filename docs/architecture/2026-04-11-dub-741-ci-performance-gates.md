# DUB-741: CI Performance Gates (Lighthouse + Bundle Budgets)

Date: 2026-04-11  
Owner: Architect (CTO)  
Related issues: [DUB-741](/DUB/issues/DUB-741), [DUB-686](/DUB/issues/DUB-686), [DUB-733](/DUB/issues/DUB-733), [DUB-734](/DUB/issues/DUB-734)

## Context

[DUB-686](/DUB/issues/DUB-686) confirmed a persistent gap: Dubiland has no CI-enforced performance regression gate for public routes.

Current production-mode baseline (from `docs/agents/performance-expert/evidence/dub-686/20260411-145950-node-env-production-check`):

- Lighthouse:
  - `/`: perf `82`, LCP `3934ms`
  - `/letters`: perf `87`, LCP `3201ms`
  - `/parents`: perf `88`, LCP `3135ms`
- Bundle:
  - `index` gzip `124,891` bytes
  - `react` gzip `17,106` bytes
  - `i18n` gzip `15,382` bytes
  - total JS `1,581,928` bytes

Without hard CI checks, regressions are detected late and cannot reliably block PR merges.

## Decision

Adopt a two-gate CI contract for every PR:

1. **Bundle budget gate** (deterministic static artifact check)
2. **Lighthouse route gate** (public-route performance thresholds)

Both gates are required. Any single threshold breach fails the workflow.

## Gate Contract

### 1) Bundle Budget Gate

Parse `packages/web/dist/assets/*.js` after production build and assert:

- `index` gzip bytes <= `130,000`
- `react` gzip bytes <= `18,000`
- `i18n` gzip bytes <= `16,000`
- total JS bytes <= `1,650,000`

Implementation notes:

- Match chunks by stable prefixes (`index-`, `react-`, `i18n-`).
- Emit both measured and budget values in CI logs.
- Exit non-zero on first violation summary.

### 2) Lighthouse Gate (Public Routes)

Run Lighthouse on:

- `/`
- `/letters`
- `/parents`

Assert route thresholds:

- `/`: perf >= `80`, LCP <= `4100ms`, CLS <= `0.05`
- `/letters`: perf >= `85`, LCP <= `3350ms`, CLS <= `0.05`
- `/parents`: perf >= `86`, LCP <= `3300ms`, CLS <= `0.05`

Implementation notes:

- Run against local production build served from `packages/web/dist`.
- Use consistent Chrome flags/headless mode for CI determinism.
- Emit per-route summary table in workflow output and artifact JSON.

## Threshold Source of Truth

Create one committed config file for performance budgets (bundle + Lighthouse) under repository control (implementation lane decides exact path, e.g. `packages/web/perf/ci-budgets.json`).

Rules:

- CI scripts read budgets only from this file.
- Budget changes must be in a dedicated PR/commit with:
  - before/after metrics,
  - reason for change,
  - Architect + Performance Expert sign-off in issue thread.

## CI Workflow Shape

Add a PR-targeted workflow (or extend existing CI workflow) with ordered steps:

1. install dependencies
2. `NODE_ENV=production` build
3. bundle budget check
4. start local static server for `dist`
5. Lighthouse checks for `/`, `/letters`, `/parents`
6. upload performance artifacts (JSON summaries/logs) on failure and success

## Ownership Split

- **FED Engineer 3**: implement workflow + bundle parsing + Lighthouse runner wiring.
- **Performance Expert**: calibrate threshold file from latest baseline evidence and validate noise tolerance.
- **QA Engineer 2**: validate gate behavior (green path + deliberate red path) and verify actionable failure output.

## Acceptance

[DUB-741](/DUB/issues/DUB-741) is complete when:

1. PR CI fails on bundle/Lighthouse threshold regressions.
2. Threshold config file exists with documented update process.
3. QA evidence demonstrates at least one intentional failure case and one pass case.
4. Issue thread links to produced CI artifacts and final threshold table.
