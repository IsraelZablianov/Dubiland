# DUB-637 Protected Route Matrix Summary

- Generated: 2026-04-11T14:53:56.916Z
- Base URL: http://127.0.0.1:4196
- Cache mode: cold
- Route entry mode: direct document navigation

## Profile: guest_shell

| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| /games | ok | 74 | 4525 | 4525 | 454 | 233883 | false | false | http://127.0.0.1:4196/games |
| /profiles | ok | 78 | 4164 | 4164 | 332 | 233883 | false | false | http://127.0.0.1:4196/profiles |
| /parent | ok | 79 | 4014 | 4014 | 313 | 233883 | false | false | http://127.0.0.1:4196/parent |
| /games/reading/interactive-handbook | ok | 79 | 3998 | 3998 | 415 | 238613 | false | true | http://127.0.0.1:4196/games/reading/interactive-handbook |

## Profile: anonymous_redirect

| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| /games | ok | 100 | 1519 | 1519 | 277 | 862 | true | true | http://127.0.0.1:4196/games |
| /profiles | ok | 100 | 1132 | 1357 | 345 | 859 | true | true | http://127.0.0.1:4196/profiles |
| /parent | ok | 100 | 945 | 1012 | 312 | 860 | true | true | http://127.0.0.1:4196/parent |
| /games/reading/interactive-handbook | ok | 100 | 1059 | 1059 | 445 | 1882 | true | true | http://127.0.0.1:4196/games/reading/interactive-handbook |

## Profile: authenticated

| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| /games | ok | 100 | 1174 | 1174 | 562 | 0 | false | true | http://127.0.0.1:4196/games |
| /profiles | ok | 100 | 862 | 1737 | 260 | 764 | false | true | http://127.0.0.1:4196/profiles |
| /parent | ok | 78 | 879 | 1771 | 263 | 2160 | false | true | http://127.0.0.1:4196/parent |
| /games/reading/interactive-handbook | ok | 100 | 1088 | 1088 | 485 | 4731 | false | true | http://127.0.0.1:4196/games/reading/interactive-handbook |

## Budget Verdict

- Overall pass: false
- Failed checks: 8
- Skipped checks: 0

### Failed checks

- guest_shell /games: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes
- guest_shell /profiles: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes
- guest_shell /parent: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes
- guest_shell /games/reading/interactive-handbook: lcp_ms, fcp_ms, max_long_task_ms, supabase_chunk_requested
- authenticated /games: max_long_task_ms, supabase_chunk_requested
- authenticated /profiles: max_long_task_ms, supabase_chunk_requested
- authenticated /parent: max_long_task_ms, supabase_chunk_requested
- authenticated /games/reading/interactive-handbook: max_long_task_ms, supabase_chunk_requested

## Pre/Post Delta (Guest Profile)

- Baseline source: /Users/israelz/Documents/dev/AI/Learning/docs/agents/performance-expert/evidence/dub-506/20260411-012316-final-matrix-post-dub-610/lighthouse-summary.json

| Route | LCP delta ms | FCP delta ms | Long task delta ms | Bytes delta | Login chunk (before→after) | Supabase chunk (before→after) |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| /games | 493.846 | 493.846 | 160.282 | -34613 | true -> false | true -> false |
| /profiles | 175.292 | 175.293 | 53.948 | -34613 | true -> false | true -> false |
| /parent | -9.426 | -9.426 | 12.417 | -34613 | true -> false | true -> false |
| /games/reading/interactive-handbook | 341.585 | 341.586 | 123.847 | -28868 | true -> false | true -> true |

