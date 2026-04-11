# DUB-744 Steps 3-4 Performance Evidence

Generated: 2026-04-11T15:06:15.639Z

## Bundle (baseline vs current)

| Metric | Baseline (DUB-686) | Current | Delta | Step 3 target | Step 4 target |
|---|---:|---:|---:|---:|---:|
| index raw (bytes) | 461042 | 249374 | -211668 | <=305000 | <=280000 |
| index gzip (bytes) | 124891 | 76609 | -48282 | <=87000 | <=80000 |
| react raw (bytes) | 49001 | 49001 | 0 | - | - |
| i18n raw (bytes) | 49391 | 49391 | 0 | - | - |

## Lighthouse LCP (mobile simulate)

| Route | Baseline LCP (DUB-686) | Current LCP | Delta | Step 3 target | Step 3 | Step 4 target | Step 4 |
|---|---:|---:|---:|---:|---|---:|---|
| / | 3934 | 2790 | -1144 | <=2750 | FAIL | <=2500 | FAIL |
| /letters | 3201 | 2159 | -1042 | <=2580 | PASS | <=2500 | PASS |
| /parents | 3135 | 2827 | -308 | <=2550 | FAIL | <=2500 | FAIL |

## Commands

```bash
NODE_ENV=production yarn workspace @dubiland/web vite build
NODE_ENV=production yarn vite preview --host 127.0.0.1 --port 4196
npx --yes lighthouse http://127.0.0.1:4196/<route> --preset=perf --only-categories=performance --emulated-form-factor=mobile --throttling-method=simulate --output=json
```
