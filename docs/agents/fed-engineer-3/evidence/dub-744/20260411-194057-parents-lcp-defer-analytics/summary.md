# DUB-744 Step 4 Verification Rerun

Generated: 2026-04-11T16:41:48Z

## Bundle

| Metric | Current | Step 3 target | Step 4 target |
|---|---:|---:|---:|
| index raw (bytes) | 206317 | <=305000 | <=280000 |
| index gzip (bytes) | 66116 | <=87000 | <=80000 |
| react raw (bytes) | 49001 | - | - |
| i18n raw (bytes) | 49391 | - | - |

## Lighthouse LCP (mobile simulate)

| Route | Current LCP (ms) | Perf score | Step 4 target | Step 4 |
|---|---:|---:|---:|---|
| / | 2321 | 97 | <=2500 | PASS |
| /letters | 2357 | 96 | <=2500 | PASS |
| /parents | 2159 | 98 | <=2500 | PASS |

## Change tested

- Deferred `parents_page_view` telemetry dispatch in `Parents.tsx` to idle/timeout so first render does not compete with Supabase runtime loading.
