# DUB-637 Protected Route Matrix Summary

- Generated: 2026-04-11T13:12:41.800Z
- Base URL: http://127.0.0.1:4196
- Cache mode: cold
- Route entry mode: direct document navigation

## Profile: guest_shell

| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| /games | ok | 80 | 3906 | 3906 | 284 | 233883 | false | false | http://127.0.0.1:4196/games |
| /profiles | ok | 81 | 3820 | 3820 | 277 | 233883 | false | false | http://127.0.0.1:4196/profiles |
| /parent | ok | 81 | 3800 | 3800 | 257 | 233883 | false | false | http://127.0.0.1:4196/parent |
| /games/reading/interactive-handbook | ok | 80 | 3899 | 3899 | 347 | 238618 | false | true | http://127.0.0.1:4196/games/reading/interactive-handbook |

## Profile: anonymous_redirect

| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| /games | ok | 98 | 1118 | 1551 | 398 | 858 | true | true | http://127.0.0.1:4196/games |
| /profiles | ok | 100 | 908 | 1108 | 267 | 859 | true | true | http://127.0.0.1:4196/profiles |
| /parent | ok | 100 | 897 | 1105 | 255 | 860 | true | true | http://127.0.0.1:4196/parent |
| /games/reading/interactive-handbook | ok | 100 | 984 | 984 | 339 | 1883 | true | true | http://127.0.0.1:4196/games/reading/interactive-handbook |

## Profile: authenticated

| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| /games | skipped (missing_credentials) | - | - | - | - | - | - | - | - |
| /profiles | skipped (missing_credentials) | - | - | - | - | - | - | - | - |
| /parent | skipped (missing_credentials) | - | - | - | - | - | - | - | - |
| /games/reading/interactive-handbook | skipped (missing_credentials) | - | - | - | - | - | - | - | - |

## Budget Verdict

- Overall pass: false
- Failed checks: 4
- Skipped checks: 4

### Failed checks

- guest_shell /games: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes
- guest_shell /profiles: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes
- guest_shell /parent: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes
- guest_shell /games/reading/interactive-handbook: lcp_ms, fcp_ms, max_long_task_ms, supabase_chunk_requested

## Pre/Post Delta (Guest Profile)

- Baseline source: /Users/israelz/Documents/dev/AI/Learning/docs/agents/performance-expert/evidence/dub-506/20260411-012316-final-matrix-post-dub-610/lighthouse-summary.json

| Route | LCP delta ms | FCP delta ms | Long task delta ms | Bytes delta | Login chunk (before→after) | Supabase chunk (before→after) |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| /games | -124.915 | -124.915 | -10.215 | -34613 | true -> false | true -> false |
| /profiles | -169.021 | -169.02 | -0.364 | -34613 | true -> false | true -> false |
| /parent | -223.213 | -223.213 | -43.989 | -34613 | true -> false | true -> false |
| /games/reading/interactive-handbook | 242.79 | 242.791 | 55.818 | -28863 | true -> false | true -> true |

