# Dubiland Game Design Guidelines (Ages 3-7)

Use this file as the mandatory template baseline for every new or updated game spec in `docs/games/`.

## Foundational Mechanics Rules (Non-Negotiable)
1. Audio-first instructions:
- No instruction is valid unless it has both an i18n key and a Hebrew audio file.
- Every active prompt must expose a replay control with a triangle icon (`▶`, minimum 44px).
2. Icon-driven child UI:
- Child-facing controls are icons first, not text labels.
- Mandatory core control set: replay (`▶`), retry (`↻`), hint (`💡`), next/continue (`→`).
- Text labels are allowed only in parent/teacher surfaces.
3. Action-based feedback only:
- Do not use `Check`, `Submit`, or `Test` buttons in gameplay loops.
- Validation happens immediately on the child action (tap/drag/trace/select).
- Correct action triggers celebration + sound. Incorrect action triggers gentle hint + visual nudge.
4. Icon semantics must be documented:
- Every game spec must include an icon inventory table with action, icon, audio behavior, and immediate feedback.
- Icon tap audio must be mapped to concrete key families already listed in that game's audio requirements.

## Required Spec Sections
Every gameplay spec must include these sections:
- `## Mechanic`
- `## Pre-Literate UX Baseline (Mandatory)`
- `## Icon Inventory (Mandatory)`
- `## Difficulty Curve`
- `## Feedback Design`
- `## Audio Requirements`

## Icon Inventory Template (Copy into each spec)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays current instruction key (`games.<slug>.instructions.*`) | Prompt highlight/pulse on the active task. |
| Retry round | `↻` | Short encouragement cue (`feedback.encouragement.*`), then prompt replay | Soft reset to same concept with no penalty. |
| Hint | `💡` | Context hint key (`games.<slug>.hints.*` or equivalent) | Visual scaffold for next valid move. |
| Next / continue | `→` | Round-complete transition cue, then next prompt | Smooth transition animation to next round. |

## QA Gate for Mechanics Review
Before marking mechanics ready:
- Verify no child-facing text-only controls remain.
- Verify no explicit `check/submit/test` control exists in the round loop.
- Verify every listed icon has mapped audio behavior.
- Verify minimum touch size remains 44px+ for all child controls.
