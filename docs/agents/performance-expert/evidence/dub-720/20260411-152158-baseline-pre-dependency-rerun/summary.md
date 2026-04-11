# DUB-720 Baseline Snapshot (pre-dependency complete)

Generated: 2026-04-11T12:30:58Z
Evidence dir: docs/agents/performance-expert/evidence/dub-720/20260411-152158-baseline-pre-dependency-rerun

## Lighthouse route/game matrix

| Route | Perf | FCP ms | LCP ms | CLS | TBT ms | Verdict |
|---|---:|---:|---:|---:|---:|---|
| /terms | 88 | 3126 | 3126 | 0.002 | 0 | FAIL |
| /privacy | 88 | 3125 | 3125 | 0.002 | 0 | FAIL |
| /parent | 79 | 3980 | 4055 | 0.001 | 0 | FAIL |
| /no-such-page | 86 | 3148 | 3415 | 0.001 | 0 | FAIL |
| /games/numbers/more-or-less-market | 76 | 4320 | 4386 | 0.001 | 0 | FAIL |
| /games/numbers/shape-safari | 75 | 4380 | 4455 | 0.001 | 0 | FAIL |
| /games/numbers/number-line-jumps | 75 | 4349 | 4449 | 0.001 | 0 | FAIL |
| /games/reading/picture-to-word-builder | 75 | 4338 | 4405 | 0.001 | 0 | FAIL |
| /games/reading/sight-word-sprint | 75 | 4374 | 4507 | 0.001 | 0 | FAIL |
| /games/reading/confusable-letter-contrast | 77 | 4029 | 4196 | 0.001 | 0 | FAIL |

Aggregate:
- Pass count: 0/10
- Median performance: 77
- Median LCP: 4386 ms
- Worst LCP route: /games/reading/sight-word-sprint

## Route contamination flags

| Route | Login chunk | Supabase chunk | Requests | Transfer KB |
|---|---|---|---:|---:|
| /terms | false | false | 15 | 216 |
| /privacy | false | false | 15 | 216 |
| /parent | true | true | 28 | 363 |
| /no-such-page | false | false | 16 | 217 |
| /games/numbers/more-or-less-market | true | true | 31 | 318 |
| /games/numbers/shape-safari | true | true | 37 | 359 |
| /games/numbers/number-line-jumps | true | true | 36 | 359 |
| /games/reading/picture-to-word-builder | true | true | 30 | 336 |
| /games/reading/sight-word-sprint | true | true | 41 | 358 |
| /games/reading/confusable-letter-contrast | true | true | 36 | 357 |

## Bundle delta vs DUB-686 production baseline
- Index chunk bytes: 461042 -> 480868 (+19826, +4.3%)
- Total JS bytes: 1581928 -> 1634534 (+52606, +3.33%)

## Image budget gate
- images:budgets exit code: 1
- failing assets:
  - images/about/boys-soccer-raw.png (1491.8 KiB > 120 KiB)
  - images/about/boys-soccer.jpg (243.0 KiB > 120 KiB)

## Interpretation
- Start-condition dependency is not met yet: [DUB-672](/DUB/issues/DUB-672) is blocked and [DUB-680](/DUB/issues/DUB-680) is in_progress.
- Treat this as pre-final baseline evidence; final GO/NO-GO rerun required after dependency lanes close.
