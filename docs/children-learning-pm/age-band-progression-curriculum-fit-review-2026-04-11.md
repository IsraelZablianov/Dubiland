# Age-Band Progression and Curriculum-Fit Review (Ages 3-7)

Date: 2026-04-11  
Source lane: [DUB-693](/DUB/issues/DUB-693)  
Parent lane: [DUB-674](/DUB/issues/DUB-674)

## Goal
Evaluate the current game portfolio by age band, flag under-leveled content, and propose rollout priorities that raise depth for older learners without harming younger usability.

## Age-Band Review

| Age Band | Current Strength | Under-Leveled Risk | Product Action |
|---|---|---|---|
| 3-4 | Strong concrete counting + shape/color recognition foundations. | Some loops still over-index on count-all; pattern reasoning is light. | Add short subitizing inserts and keep one-variable rounds with strict visual simplicity. |
| 4-5 | Good transition from pure matching to guided comparison. | Transitional bridge between preschool and school-readiness logic is thin. | Add pattern/sequence lane (planned `Pattern Train`) and maintain explicit hint ladders. |
| 5-6 | Strong quantity comparison (`more/less`) and early reading support. | Number composition/decomposition and encode-from-audio depth are under-covered. | Prioritize `Build-10 Workshop` and keep `Spell-and-Send` as next literacy depth lane. |
| 6-7 | Strong addition strategy (`number-line-jumps`) and reading breadth. | Missing subtraction companion and everyday math transfer (time/routines) weakens mastery carryover. | Prioritize `Subtraction Street` + `Time-and-Routine Builder` to close math transfer gaps. |

## Curriculum and Progression Gaps (Prioritized)

1. **P0 — Subtraction strategy gap** (`within 10/20`) for ages 6-7.
2. **P0 — Number bonds/composition gap** (`5/10/20`) for ages 5-7.
3. **P0 — Time/sequence transfer gap** (hour/half-hour + routines) for ages 6-7.
4. **P1 — Pattern/logic transition gap** for ages 4-6.
5. **P1 — Decode-to-encode writing bridge gap** for ages 6-7.

## De-dup Alignment with Gaming Expert Lane

Aligned with [DUB-692](/DUB/issues/DUB-692) and intentionally de-duplicated:
- Keep Gaming Expert proposals for existing-game mechanics tuning as **enhancement tracks** (subitizing inserts, confusion-recovery ladders, pacing fixes).
- Treat PM-authored specs and delegated lanes from [DUB-676](/DUB/issues/DUB-676) as the **execution source of truth** for math depth:
  - [DUB-694](/DUB/issues/DUB-694) Subtraction Street
  - [DUB-698](/DUB/issues/DUB-698) Build-10 Workshop
  - [DUB-699](/DUB/issues/DUB-699) Time-and-Routine Builder
- Do **not** open duplicate implementation tickets for these same concepts.

## Recommended Rollout Order

### Wave 1 (Immediate, low-to-medium effort / high impact)
1. Counting loop upgrade: subitizing micro-round insertion.
2. Letter-sound confusion-recovery ladder hardening.
3. Number-line concrete pre-bridge for early 6-year-olds.

### Wave 2 (Already delegated, core depth expansion)
1. Deliver Subtraction Street ([DUB-694](/DUB/issues/DUB-694)).
2. Deliver Build-10 Workshop ([DUB-698](/DUB/issues/DUB-698)).
3. Deliver Time-and-Routine Builder ([DUB-699](/DUB/issues/DUB-699)).

### Wave 3 (Next backlog after Wave 2 stability)
1. Pattern Train (ages 4-6).
2. Spell-and-Send (ages 6-7).
3. Measure and Match / Money Market Mini (ages 6-7 breadth expansion).

## Guardrails

- Keep pre-literate UX baseline non-negotiable (`▶`, `↻`, `💡`, action-based validation).
- Introduce one cognitive variable at a time, especially in ages 3-5.
- Preserve short sessions and clear stopping points.
- Use parent dashboard metrics to gate progression moves, not only completion counts.
