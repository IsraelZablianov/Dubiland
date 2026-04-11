# Learn the Letters Storybook — Gamification Hooks

## Context
- Source task: [DUB-656](/DUB/issues/DUB-656)
- Parent storybook thread: [DUB-647](/DUB/issues/DUB-647)
- Objective: add lightweight engagement hooks for ages 3-7 that increase completion and replay while preserving literacy outcomes.

## Recommended Hooks (2 Core + 1 Later)
| Hook | Scope | Why it supports literacy | Complexity |
|---|---|---|---|
| `Letter Card Reveal` | Core v1 | Reinforces grapheme -> sound -> anchor word mapping on every solved checkpoint. | Low |
| `Story Clue Meter` | Core v1 | Ties reading interactions to visible story progress, reducing random tapping/drop-off. | Low |
| `Constellation Album` | Optional later | Adds spaced review across sessions with soft streak motivation for older children. | Medium |

## Hook 1 — Letter Card Reveal (`core v1`)
### Mechanic
- After each solved story checkpoint, reveal one collectible card: letter glyph + association image + short narrated line.
- Example beat: "זאת האות מ. מ כמו מטריה."
- Card reveal is automatic on success, then child can tap `▶` to replay the same audio.

### Age-band adaptation
- Ages 3-4: automatic reveal only, one tap to continue.
- Ages 4-5: tap-to-flip card for second replay (`▶`) before continue.
- Ages 5-7: one lightweight retrieval prompt before reveal (2 options max in easy, 3 in hard).

### Guardrails
- No point loss or lockout on misses.
- If child misses twice, show correct card and still award it (self-correcting loop).
- Keep reveal animation under 900ms so story rhythm remains intact.

## Hook 2 — Story Clue Meter (`core v1`)
### Mechanic
- Persistent top-of-page progress strip (icon-only) with 3-5 clue slots per chapter.
- Each completed literacy interaction fills one slot and triggers a short mascot reaction.
- Full strip unlocks a short story reveal beat (map piece, door opening, scene transition).

### Age-band adaptation
- Ages 3-4: 3 slots, no optional branches.
- Ages 4-5: 4 slots, one repeated known concept + one new concept.
- Ages 5-7: 5 slots, last slot may be optional challenge for bonus reveal.

### Guardrails
- Progress advances on supported success too (after hint/retry), not only first try.
- Never require two new concepts in the same slot.
- No timer pressure; meter tracks completion quality, not speed.

## Hook 3 — Constellation Album (`optional later`)
### Mechanic
- Every 5 collected letter cards unlock one album constellation.
- Album node opens a 10-15 second recap: 3 known letters + 1 retrieval prompt.
- Optional soft streak badge (cosmetic only) for return sessions; no penalty for missed days.

### Why later
- Requires extra content operations (cluster-level recap audio, additional art states, and parent summary labels).
- Best shipped after v1 telemetry confirms card reveal and clue meter improve completion/hint rates.

## v1 Implementation Notes (FED + Content + QA)
- Keep hooks inside existing handbook state flow: `interaction_prompt -> feedback_success -> story_resume`.
- Child controls remain icon-first (`▶`, `↻`, `💡`, `→`) with mapped Hebrew audio.
- Validation remains action-triggered only; no check/submit buttons.
- Minimum target size remains 44px; avoid bottom-edge-only critical controls.

## Suggested Success Metrics for PM
- `chapter_completion_rate` (before vs after hook rollout)
- `interaction_retry_rate` (expect downtrend with stable completion)
- `first_try_accuracy` by age band (should not drop while engagement rises)
- `replay_rate_7d` (especially ages 5-7 for optional later scope decision)

## Recommendation
- Ship `Letter Card Reveal` and `Story Clue Meter` in v1.
- Gate `Constellation Album` behind 2-week telemetry review after v1 launch.
