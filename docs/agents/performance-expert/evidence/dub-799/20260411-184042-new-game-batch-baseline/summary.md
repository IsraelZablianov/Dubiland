# DUB-637 Protected Route Matrix Summary

- Generated: 2026-04-11T15:44:28.956Z
- Base URL: http://127.0.0.1:4196
- Cache mode: cold
- Route entry mode: direct document navigation

## Profile: guest_shell

| Route | Status | Perf | FCP ms | LCP ms | Long task ms | Bytes | Login chunk | Supabase chunk | Final URL |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| /games | ok | 83 | 3603 | 3603 | 440 | 122081 | false | false | http://127.0.0.1:4196/games |
| /games/numbers/more-or-less-market | ok | 84 | 3524 | 3524 | 348 | 122081 | false | false | http://127.0.0.1:4196/games/numbers/more-or-less-market |
| /games/numbers/number-line-jumps | ok | 68 | 3512 | 11695 | 335 | 122081 | false | false | http://127.0.0.1:4196/games/numbers/number-line-jumps |
| /games/reading/nikud-sound-ladder | ok | 69 | 3544 | 7160 | 367 | 122081 | false | false | http://127.0.0.1:4196/games/reading/nikud-sound-ladder |
| /games/reading/picture-to-word-builder | ok | 84 | 3573 | 3573 | 407 | 122081 | false | false | http://127.0.0.1:4196/games/reading/picture-to-word-builder |
| /games/reading/decodable-story-missions | ok | 81 | 3768 | 3768 | 404 | 122081 | false | false | http://127.0.0.1:4196/games/reading/decodable-story-missions |

## Budget Verdict

- Overall pass: false
- Failed checks: 6
- Skipped checks: 0

### Failed checks

- guest_shell /games: lcp_ms, fcp_ms, max_long_task_ms
- guest_shell /games/numbers/more-or-less-market: missing_budget
- guest_shell /games/numbers/number-line-jumps: missing_budget
- guest_shell /games/reading/nikud-sound-ladder: missing_budget
- guest_shell /games/reading/picture-to-word-builder: missing_budget
- guest_shell /games/reading/decodable-story-missions: missing_budget

## Pre/Post Delta (Guest Profile)

- Baseline source: /Users/israelz/Documents/dev/AI/Learning/docs/agents/performance-expert/evidence/dub-506/20260411-012316-final-matrix-post-dub-610/lighthouse-summary.json

| Route | LCP delta ms | FCP delta ms | Long task delta ms | Bytes delta | Login chunk (before→after) | Supabase chunk (before→after) |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| /games | -427.43 | -427.43 | 146.229 | -146415 | true -> false | true -> false |
| /games/numbers/more-or-less-market | n/a | n/a | n/a | n/a | n/a | n/a |
| /games/numbers/number-line-jumps | n/a | n/a | n/a | n/a | n/a | n/a |
| /games/reading/nikud-sound-ladder | n/a | n/a | n/a | n/a | n/a | n/a |
| /games/reading/picture-to-word-builder | n/a | n/a | n/a | n/a | n/a | n/a |
| /games/reading/decodable-story-missions | n/a | n/a | n/a | n/a | n/a | n/a |

