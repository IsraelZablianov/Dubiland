# Curriculum Consistency Checkpoints (Ages 3-7)

Date: 2026-04-10  
Parent issue: [DUB-568](/DUB/issues/DUB-568)

## Purpose

Create one consistency quality bar across active math, letters, and reading specs so progression is measurable, age-fit, and operationally aligned across PM lanes.

## Scope Reviewed

- Children PM tracker: `docs/children-learning-pm/features.md`
- Reading PM tracker: `docs/reading-pm/features.md`
- Core specs in active execution:
  - Math: `counting-picnic`, `more-or-less-market`, `number-line-jumps`
  - Letters: `letter-tracing-trail`, `letter-sound-match`, `letter-sky-catcher`, plus reading-track bridges (`confusable-letter-contrast`, `sofit-word-end-detective`, `shva-sound-switch`, `final-forms-video-pedagogy`)
  - Reading: `picture-to-word-builder`, handbook wave specs, and active overhaul specs (`handbook-story-depth-overhaul-books-1-4-7`, `decodable-micro-stories-age-band-scaling`)

## Consistency Checkpoint Matrix

| ID | Checkpoint | Definition | Current State |
|---|---|---|---|
| C1 | Objective measurability | Every active spec has explicit measurable outcome(s) tied to age milestones. | Mostly pass |
| C2 | 3-level progression clarity | Difficulty includes at least 3 levels + explicit adaptation logic. | Pass |
| C3 | Pre-literate UX integrity | `▶/↻/💡` icon-first controls, 44px+ targets, action-triggered validation, no check/test button. | Pass |
| C4 | Audio + i18n parity | Child-facing copy/audio key families are comprehensive and explicit. | Pass |
| C5 | Progression gate continuity | Specs define prerequisites/next-stage logic across adjacent games/books. | Mostly pass |
| C6 | Cross-PM catalog visibility | Children PM and Reading PM trackers represent the same active reading lanes at summary level. | Drift detected |
| C7 | Parent metric comparability | Parent dashboard metrics are comparable across games (shared naming contract). | Drift detected |
| C8 | Review-state hygiene | Specs in delegated execution do not retain stale "review requested" states. | Drift detected |

## Drift and Gap Findings

### 1) Review-state drift in delegated core specs (C8)
- `docs/games/counting-picnic.md`
- `docs/games/more-or-less-market.md`
- `docs/games/letter-tracing-trail.md`

These still show "review requested" language despite active delegated execution lanes. This creates ambiguity on pedagogical readiness.

### 2) Cross-PM visibility drift for reading foundations (C6)
Reading-track active lanes (`Sofit`, `Shva`, `Final Forms Video`, story-depth/decodable overhauls) are tracked in Reading PM features but were not summarized in the Children PM feature lifecycle view.

### 3) Parent metric naming inconsistency (C7)
Specs include strong parent visibility sections, but metric names are not normalized enough for cross-game comparison dashboards (accuracy/hint/independence/progression semantics vary).

### 4) Age 6-7 numeracy depth remains open (C5 strategic gap)
Dedicated subtraction, number composition/decomposition, and time-sequence game specs remain in planned status and un-authored:
- `Subtraction Street`
- `Build-10 Workshop`
- `Time-and-Routine Builder`

## Prioritized Correction Lanes (Delegated)

- [DUB-582](/DUB/issues/DUB-582) — Gaming Expert: close pending mechanics-review flags and calibrate thresholds in legacy core specs.
- [DUB-574](/DUB/issues/DUB-574) — Reading PM: deliver parity-ready reading summary block for Children PM coverage synchronization.
- [DUB-575](/DUB/issues/DUB-575) — Architect: define shared parent-dashboard metric contract across active curriculum games.

Duplicate retries [DUB-580](/DUB/issues/DUB-580) and [DUB-581](/DUB/issues/DUB-581) were superseded by canonical lane [DUB-582](/DUB/issues/DUB-582).

## Delegation Gate Check (Children PM)

- Finalized specs in `docs/children-learning-pm/features.md` were checked for handoff state.
- No finalized spec was left as "not yet handed off" in this heartbeat.
- Remaining non-delegated items are planned gaps with no authored spec yet (not implementation-ready).
