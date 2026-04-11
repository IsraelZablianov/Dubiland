# DUB-637 Protected Route Matrix Summary

- Generated: 2026-04-11T15:12:30.165Z
- Base URL: http://127.0.0.1:4196
- Cache mode: cold
- Route entry mode: direct document navigation

## Profile: authenticated

| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| /games | ok | 100 | 1299 | 1299 | 591 | 0 | false | true | http://127.0.0.1:4196/games |
| /profiles | ok | 99 | 914 | 1972 | 279 | 764 | false | true | http://127.0.0.1:4196/profiles |
| /parent | ok | 77 | 956 | 2048 | 310 | 2168 | false | true | http://127.0.0.1:4196/parent |
| /games/reading/interactive-handbook | ok | 100 | 1103 | 1103 | 455 | 4729 | false | true | http://127.0.0.1:4196/games/reading/interactive-handbook |

## Budget Verdict

- Overall pass: false
- Failed checks: 4
- Skipped checks: 0

### Failed checks

- authenticated /games: max_long_task_ms, supabase_chunk_requested
- authenticated /profiles: max_long_task_ms, supabase_chunk_requested
- authenticated /parent: max_long_task_ms, supabase_chunk_requested
- authenticated /games/reading/interactive-handbook: max_long_task_ms, supabase_chunk_requested

## Pre/Post Delta (Guest Profile)

- Baseline source: /Users/israelz/Documents/dev/AI/Learning/docs/agents/performance-expert/evidence/dub-506/20260411-012316-final-matrix-post-dub-610/lighthouse-summary.json

| Route | LCP delta ms | FCP delta ms | Long task delta ms | Bytes delta | Login chunk (before→after) | Supabase chunk (before→after) |
| --- | ---: | ---: | ---: | ---: | --- | --- |

