# DUB-746 — CI Budget Calibration Summary

Date: 2026-04-11

## Source baseline

- Lighthouse baseline: `docs/agents/performance-expert/evidence/dub-686/20260411-145950-node-env-production-check/lighthouse-summary.json`
- Bundle baseline: `docs/agents/performance-expert/evidence/dub-686/20260411-145950-node-env-production-check/bundle-env-compare.json`

## Final threshold contract

- Config file: `packages/web/perf/ci-budgets.json`
- Bundle budgets:
  - `index` gzip <= `130000`
  - `react` gzip <= `18000`
  - `i18n` gzip <= `16000`
  - `total JS` <= `1650000`
- Lighthouse budgets:
  - `/`: perf >= `80`, LCP <= `4100ms`, CLS <= `0.05`
  - `/letters`: perf >= `85`, LCP <= `3350ms`, CLS <= `0.05`
  - `/parents`: perf >= `86`, LCP <= `3300ms`, CLS <= `0.05`

## Tolerance rationale

- Byte and LCP ceilings are set with approximately `4-5%` headroom above production baseline.
- Lighthouse score floors keep `2-point` slack per route to absorb routine run variance.
- CLS cap is `0.05` on all routes, which is stricter than Core Web Vitals fail boundary (`0.1`) while still stable relative to observed low-baseline values.

## Output artifact

- Detailed baseline vs threshold table: `threshold-calibration.json`
