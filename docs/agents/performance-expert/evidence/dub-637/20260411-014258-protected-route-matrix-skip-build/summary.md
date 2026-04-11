# DUB-637 Protected Route Matrix Summary

- Generated: 2026-04-10T22:46:42.536Z
- Base URL: http://127.0.0.1:4196
- Cache mode: cold
- Route entry mode: direct document navigation

## Profile: guest_shell

| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| /games | ok | 69 | 4664 | 5780 | 387 | 409214 | false | true | http://127.0.0.1:4196/games |
| /profiles | ok | 72 | 4511 | 5220 | 282 | 284287 | false | true | http://127.0.0.1:4196/profiles |
| /parent | ok | 70 | 4486 | 5286 | 250 | 338228 | false | true | http://127.0.0.1:4196/parent |
| /games/reading/interactive-handbook | ok | 81 | 3781 | 3781 | 330 | 378951 | false | true | http://127.0.0.1:4196/games/reading/interactive-handbook |

## Profile: anonymous_redirect

| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| /games | ok | 79 | 4013 | 4013 | 275 | 268496 | true | true | http://127.0.0.1:4196/games |
| /profiles | ok | 79 | 3977 | 3977 | 266 | 268496 | true | true | http://127.0.0.1:4196/profiles |
| /parent | ok | 79 | 4050 | 4050 | 315 | 268496 | true | true | http://127.0.0.1:4196/parent |
| /games/reading/interactive-handbook | ok | 83 | 3603 | 3603 | 258 | 267481 | true | true | http://127.0.0.1:4196/games/reading/interactive-handbook |

## Profile: authenticated

| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| /games | skipped (missing_credentials) | - | - | - | - | - | - | - | - |
| /profiles | skipped (missing_credentials) | - | - | - | - | - | - | - | - |
| /parent | skipped (missing_credentials) | - | - | - | - | - | - | - | - |
| /games/reading/interactive-handbook | skipped (missing_credentials) | - | - | - | - | - | - | - | - |

## Budget Verdict

- Overall pass: false
- Failed checks: 8
- Skipped checks: 4

### Failed checks

- guest_shell /games: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes, supabase_chunk_requested
- guest_shell /profiles: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes, supabase_chunk_requested
- guest_shell /parent: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes, supabase_chunk_requested
- guest_shell /games/reading/interactive-handbook: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes, supabase_chunk_requested
- anonymous_redirect /games: redirects_to_login
- anonymous_redirect /profiles: redirects_to_login
- anonymous_redirect /parent: redirects_to_login
- anonymous_redirect /games/reading/interactive-handbook: redirects_to_login

## Pre/Post Delta (Guest Profile)

- Baseline source: /Users/israelz/Documents/dev/AI/Learning/docs/agents/performance-expert/evidence/dub-506/20260411-012316-final-matrix-post-dub-610/lighthouse-summary.json

| Route | LCP delta ms | FCP delta ms | Long task delta ms | Bytes delta | Login chunk (before→after) | Supabase chunk (before→after) |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| /games | 1749.561 | 632.889 | 93.777 | 140718 | true -> false | true -> true |
| /profiles | 1230.683 | 522.347 | 4.182 | 15791 | true -> false | true -> true |
| /parent | 1262.619 | 462.616 | -51.231 | 69732 | true -> false | true -> true |
| /games/reading/interactive-handbook | 124.644 | 124.645 | 38.152 | 111470 | true -> false | true -> true |

