# Game Mechanics and Difficulty Consistency Rubric (v1)

Date: 2026-04-10  
Owner: Gaming Expert  
Tracking issue: DUB-566

## Scoring Model
- Score each dimension `0-2`.
- `0`: missing.
- `1`: partial or implied but not enforceable.
- `2`: explicit, implementable, and testable.
- Max total: `12`.

### Risk bands
- `10-12`: ready.
- `7-9`: at risk.
- `0-6`: blocker.

## Rubric Dimensions
| Dimension | What "2" looks like |
|---|---|
| Age-band differentiation | Behavior explicitly differs by age band (`3-4`, `4-5/5-6`, `6-7`) with runtime routing and content policy. |
| Difficulty isolation | One new variable per step/cluster, with clear progression order and no stacked novelty jumps. |
| Hint/adaptation determinism | Hint ladder steps and auto-trigger thresholds are explicit by band (attempt/inactivity based). |
| Anti-guessing integrity | Action-triggered validation enforced (`read/tap before answer`), no image-only pass path for scored checks. |
| Engagement cadence | Frequent low-friction feedback, clear solved-to-next momentum, and frustration recovery without punishment. |
| QA measurability | Pass/fail gates, metrics, and regression tests are defined and runnable. |

## Active Lane Evaluation (Current)
| Lane | Ageband | Isolation | Hinting | Anti-guess | Engagement | QA | Total | Risk |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| DUB-527 (Decodable age-band scaling) | 2 | 1 | 1 | 1 | 1 | 1 | 7 | At risk |
| DUB-524 (Handbook depth impl) | 1 | 1 | 1 | 1 | 1 | 0 | 5 | Blocker |
| DUB-546 (Reading/word-game scaling queue) | 2 | 2 | 1 | 1 | 1 | 1 | 8 | At risk |
| DUB-570 (Choice cap by age) | 1 | 1 | 1 | 2 | 1 | 1 | 7 | At risk |
| DUB-498 (Cross-game quality fixes) | 0 | 1 | 1 | 0 | 2 | 1 | 5 | Blocker |
| DUB-441 (Handbook player) | 0 | 0 | 0 | 0 | 2 | 1 | 3 | Blocker |
| DUB-542 (Handbook regression blocker) | 0 | 0 | 0 | 1 | 0 | 2 | 3 | Blocker |

## Prioritized Correction Queue
| Priority | Correction | Lane | Owner suggestion | Target date |
|---|---|---|---|---|
| P0 | Close handbook word/question trust blocker and rerun QA matrix. | DUB-542 -> DUB-487 | FED Engineer 2 + QA Engineer 2 | 2026-04-11 |
| P0 | Enforce decode-before-choice lock for scored checks in handbook/reading loops. | DUB-498 | FED Engineer | 2026-04-11 |
| P0 | Apply mechanics-review fixes before implementation freeze (icon inventory, age mapping, distractor matrix, anti-guess gates). | DUB-524, DUB-527 | FED Engineer + Reading PM + Gaming Expert | 2026-04-11 |
| P1 | Add per-band hint trigger thresholds and deterministic support-mode exits. | DUB-546 | FED Engineer 3 + Gaming Expert | 2026-04-11 |
| P1 | Land age-based simultaneous-choice caps across targeted games. | DUB-570 | Architect + FED implementation owner | 2026-04-12 |
| P2 | Add solved-to-next-page anticipation beat in handbook loop. | DUB-441 | FED Engineer + UX Designer consult | 2026-04-12 |

## Notes
- This rubric is implementation-facing: each dimension must map to code/config and QA checks, not narrative intent alone.
- Results should be re-scored after each lane posts verification evidence.
