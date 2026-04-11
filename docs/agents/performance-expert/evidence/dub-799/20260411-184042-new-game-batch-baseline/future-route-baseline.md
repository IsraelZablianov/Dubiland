# DUB-799 Future Route Baseline (Pre-Implementation)

Generated: 2026-04-11T15:46:33.427Z

## Method

- Guest-shell cold Lighthouse matrix on representative existing routes.
- `/games` used as the first-run shell baseline for JS delta calculations.
- Each future route is mapped to one canonical reference route from the same topic/interaction family.

## Proposed Interim Budgets

- performance >= 80
- lcp_ms <= 4000
- max_long_task_ms <= 420
- js_delta_vs_games_bytes <= 20000

## Shell Baseline

- /games: perf 83, FCP 3603ms, LCP 3603ms, max long task 440ms, JS 654974B

## Future Route Mapping and Baselines

| Issue | Future route | Reference route | Perf | FCP ms | LCP ms | Long task ms | JS bytes | JS delta vs /games | Budget pass |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| DUB-779 | /games/numbers/pattern-train | /games/numbers/more-or-less-market | 84 | 3524 | 3524 | 348 | 664799 | +9825 | PASS |
| DUB-781 | /games/numbers/measure-and-match | /games/numbers/number-line-jumps | 68 | 3512 | 11695 | 335 | 664640 | +9666 | FAIL |
| DUB-782 | /games/reading/sound-slide-blending | /games/reading/nikud-sound-ladder | 69 | 3544 | 7160 | 367 | 655424 | +450 | FAIL |
| DUB-783 | /games/reading/spell-and-send-post-office | /games/reading/picture-to-word-builder | 84 | 3573 | 3573 | 407 | 673164 | +18190 | PASS |
| DUB-784 | /games/reading/pointing-fade-bridge | /games/reading/decodable-story-missions | 81 | 3768 | 3768 | 404 | 666526 | +11552 | PASS |

## Budget Fails and Remediation Targets

- DUB-781 (/games/numbers/measure-and-match) fails: performance, lcp_ms
- DUB-782 (/games/reading/sound-slide-blending) fails: performance, lcp_ms

## Commands

```bash
node scripts/dub-637-protected-route-matrix.mjs \
  --out-dir docs/agents/performance-expert/evidence/dub-799/20260411-184042-new-game-batch-baseline \
  --profiles guest_shell \
  --routes "/games,/games/numbers/more-or-less-market,/games/numbers/number-line-jumps,/games/reading/nikud-sound-ladder,/games/reading/picture-to-word-builder,/games/reading/decodable-story-missions"
```

