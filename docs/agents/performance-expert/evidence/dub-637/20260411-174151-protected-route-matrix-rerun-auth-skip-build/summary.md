# DUB-637 Protected Route Matrix Summary

- Generated: 2026-04-11T14:46:10.066Z
- Base URL: http://127.0.0.1:4196
- Cache mode: cold
- Route entry mode: direct document navigation

## Profile: guest_shell

| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| /games | ok | 79 | 4023 | 4023 | 431 | 233883 | false | false | http://127.0.0.1:4196/games |
| /profiles | ok | 80 | 3971 | 3971 | 362 | 233883 | false | false | http://127.0.0.1:4196/profiles |
| /parent | ok | 78 | 4094 | 4094 | 359 | 233883 | false | false | http://127.0.0.1:4196/parent |
| /games/reading/interactive-handbook | ok | 72 | 4893 | 4893 | 528 | 238617 | false | true | http://127.0.0.1:4196/games/reading/interactive-handbook |

## Profile: anonymous_redirect

| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| /games | ok | 96 | 1328 | 1836 | 522 | 861 | true | true | http://127.0.0.1:4196/games |
| /profiles | ok | 100 | 1118 | 1427 | 392 | 862 | true | true | http://127.0.0.1:4196/profiles |
| /parent | ok | 100 | 1459 | 1459 | 336 | 859 | true | true | http://127.0.0.1:4196/parent |
| /games/reading/interactive-handbook | ok | 100 | 1199 | 1199 | 452 | 1887 | true | true | http://127.0.0.1:4196/games/reading/interactive-handbook |

## Profile: authenticated

| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| /games | error (email_form_not_found) | - | - | - | - | - | - | - | - |
| /profiles | error (email_form_not_found) | - | - | - | - | - | - | - | - |
| /parent | error (email_form_not_found) | - | - | - | - | - | - | - | - |
| /games/reading/interactive-handbook | error (email_form_not_found) | - | - | - | - | - | - | - | - |

## Budget Verdict

- Overall pass: false
- Failed checks: 4
- Skipped checks: 0

### Failed checks

- guest_shell /games: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes
- guest_shell /profiles: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes
- guest_shell /parent: lcp_ms, fcp_ms, max_long_task_ms, total_transfer_bytes
- guest_shell /games/reading/interactive-handbook: lcp_ms, fcp_ms, max_long_task_ms, supabase_chunk_requested

## Pre/Post Delta (Guest Profile)

- Baseline source: /Users/israelz/Documents/dev/AI/Learning/docs/agents/performance-expert/evidence/dub-506/20260411-012316-final-matrix-post-dub-610/lighthouse-summary.json

| Route | LCP delta ms | FCP delta ms | Long task delta ms | Bytes delta | Login chunk (before→after) | Supabase chunk (before→after) |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| /games | -7.829 | -7.829 | 137.016 | -34613 | true -> false | true -> false |
| /profiles | -17.899 | -17.898 | 84.223 | -34613 | true -> false | true -> false |
| /parent | 69.955 | 69.955 | 58.426 | -34613 | true -> false | true -> false |
| /games/reading/interactive-handbook | 1236.881 | 1236.882 | 236.761 | -28864 | true -> false | true -> true |

