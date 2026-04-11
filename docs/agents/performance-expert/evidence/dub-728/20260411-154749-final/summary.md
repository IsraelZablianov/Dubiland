# DUB-728 Final Performance Summary

Generated: 2026-04-11T12:49:27.040Z

## Lighthouse mobile (before vs final)

| Route | Perf before | Perf final | FCP before (ms) | FCP final (ms) | LCP before (ms) | LCP final (ms) | CLS before | CLS final | Verdict |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| / | 89 | 98 | 2884 | 1831 | 3057 | 2003 | 0.033 | 0.000 | PASS |
| /letters | 84 | 98 | 2879 | 1824 | 3675 | 2147 | 0.002 | 0.000 | PASS |
| /parents | 96 | 98 | 2276 | 1826 | 2298 | 1997 | 0.013 | 0.000 | PASS |
| /parents/faq | 89 | 98 | 2875 | 1829 | 3045 | 2000 | 0.003 | 0.000 | PASS |

## Commands run

```bash
cd packages/web && NODE_ENV=production yarn tsc -b
cd packages/web && NODE_ENV=production yarn vite build
cd packages/web && NODE_ENV=production yarn vite preview --host 127.0.0.1 --port 4192
npx --yes lighthouse 'http://127.0.0.1:4192/<route>' --preset=perf --only-categories=performance --emulated-form-factor=mobile --throttling-method=simulate --output=json --output-path=<artifact>
```

## Artifacts

- `lighthouse/*.json` raw per-route reports
- `lighthouse-summary.json` final metrics
- `before-final-delta.json` before/final deltas
- `vite-build.log`, `tsc.log`, `typecheck.log` verification logs