# DUB-637 Protected Route Matrix Summary

- Generated: 2026-04-10T22:54:19.363Z
- Base URL: http://127.0.0.1:4196
- Cache mode: cold
- Route entry mode: direct document navigation

## Profile: guest_shell

| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| /games | ok | 69 | 4642 | 5783 | 373 | 409214 | false | true | http://127.0.0.1:4196/games |
| /profiles | ok | 72 | 4477 | 5202 | 264 | 284287 | false | true | http://127.0.0.1:4196/profiles |
| /parent | ok | 70 | 4455 | 5305 | 226 | 338228 | false | true | http://127.0.0.1:4196/parent |
| /games/reading/interactive-handbook | ok | 81 | 3757 | 3757 | 303 | 378949 | false | true | http://127.0.0.1:4196/games/reading/interactive-handbook |

## Profile: anonymous_redirect

| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| /games | ok | 79 | 4025 | 4025 | 291 | 268496 | true | true | http://127.0.0.1:4196/games |
| /profiles | ok | 79 | 4044 | 4044 | 304 | 268496 | true | true | http://127.0.0.1:4196/profiles |
| /parent | ok | 79 | 4038 | 4038 | 308 | 268496 | true | true | http://127.0.0.1:4196/parent |
| /games/reading/interactive-handbook | ok | 82 | 3646 | 3646 | 275 | 267481 | true | true | http://127.0.0.1:4196/games/reading/interactive-handbook |

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

- guest_shell /games: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes, supabase_chunk_requested
- guest_shell /profiles: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes, supabase_chunk_requested
- guest_shell /parent: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes, supabase_chunk_requested
- guest_shell /games/reading/interactive-handbook: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes, supabase_chunk_requested

## Pre/Post Delta (Guest Profile)

- Baseline source: /Users/israelz/Documents/dev/AI/Learning/docs/agents/performance-expert/evidence/dub-506/20260411-012316-final-matrix-post-dub-610/lighthouse-summary.json

| Route | LCP delta ms | FCP delta ms | Long task delta ms | Bytes delta | Login chunk (before→after) | Supabase chunk (before→after) |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| /games | 1752.427 | 610.755 | 79.349 | 140718 | true -> false | true -> true |
| /profiles | 1213.205 | 488.203 | -13.506 | 15791 | true -> false | true -> true |
| /parent | 1281.208 | 431.204 | -74.643 | 69732 | true -> false | true -> true |
| /games/reading/interactive-handbook | 100.598 | 100.599 | 12.027 | 111468 | true -> false | true -> true |

