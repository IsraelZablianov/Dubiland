# Dubiland Learning Changelog

Learning-focused changelog maintained by the Children Learning PM. Record game specs completed, curriculum decisions, and pedagogical milestones in reverse chronological order.

## Format

```markdown
### YYYY-MM-DD — Title
- What changed and why
- Learning area affected (letters, numbers, reading, etc.)
- Related spec or task ID if applicable
```

---

### 2026-04-10 — QA Retrofit Subtasks Unblocked and Rebalanced Across 5 Live Games
- Processed parent delegation task [DUB-124](/DUB/issues/DUB-124) by reusing the existing child lanes [DUB-125](/DUB/issues/DUB-125), [DUB-126](/DUB/issues/DUB-126), [DUB-127](/DUB/issues/DUB-127), [DUB-128](/DUB/issues/DUB-128), and [DUB-129](/DUB/issues/DUB-129) instead of creating duplicate tickets.
- Expanded each child issue with explicit QA line-item acceptance criteria from [DUB-131](/DUB/issues/DUB-131), including action-triggered validation and adjacent replay requirements across all child-facing text surfaces.
- Moved all five child lanes from `blocked` back to `todo` after scope updates, and rebalanced reading/colors retrofit ownership to FED Engineer 2 for capacity and code-lane continuity.
- Updated `docs/children-learning-pm/features.md` with a dedicated in-progress row for this cross-game retrofit pack.
- Learning areas affected: cross-curriculum pre-literate UX compliance (audio-first, icon-driven controls).

### 2026-04-10 — Audio-Icon UX Baseline Applied Across All Game Specs
- Updated all active game specs in `docs/games/` to include a mandatory pre-literate UX baseline section:
  - every instruction line must include adjacent `▶` replay
  - child controls are icon-first (`▶`, `↻`, `💡`)
  - no separate check/test buttons for validation
- Fixed mechanic wording conflicts so validation is action-based (notably `counting-picnic.md` and `number-line-jumps.md`).
- Updated Children Learning PM instruction templates (`docs/agents/children-learning-pm/instructions/AGENTS.md` and `HEARTBEAT.md`) so future specs inherit the same baseline requirements by default.
- Learning areas affected: cross-curriculum UX accessibility for pre-readers (ages 3-7), audio-first compliance.

### 2026-04-10 — Counting Picnic Marked as Shipped
- Verified implementation and QA completion across [DUB-27](/DUB/issues/DUB-27), [DUB-47](/DUB/issues/DUB-47), [DUB-62](/DUB/issues/DUB-62), and [DUB-48](/DUB/issues/DUB-48), then moved Counting Picnic from In Progress to Shipped in `docs/children-learning-pm/features.md`.
- Updated curriculum coverage for Numbers (מספרים), ages 3-4, from "Spec ready" to "Shipped: Counting Picnic".
- Learning area affected: Numbers (מספרים), curriculum tracking accuracy.

### 2026-04-10 — Direct Delegation Migration Applied to Letter and Reading Specs
- Closed PM kickoff handoff task [DUB-30](/DUB/issues/DUB-30) after CEO split execution into explicit technical/mechanics/content lanes ([DUB-85](/DUB/issues/DUB-85), [DUB-86](/DUB/issues/DUB-86), [DUB-87](/DUB/issues/DUB-87)).
- For remaining non-delegated specs, created direct assignee lanes under parent specs:
  - Letter Sound Match: [DUB-92](/DUB/issues/DUB-92), [DUB-93](/DUB/issues/DUB-93), [DUB-94](/DUB/issues/DUB-94)
  - Picture to Word Builder: [DUB-95](/DUB/issues/DUB-95), [DUB-96](/DUB/issues/DUB-96), [DUB-97](/DUB/issues/DUB-97)
- Reassigned parent ownership to implementing engineers:
  - [DUB-31](/DUB/issues/DUB-31) -> FED Engineer
  - [DUB-32](/DUB/issues/DUB-32) -> FED Engineer 2
- Updated `docs/children-learning-pm/features.md` statuses from legacy "Handed off to CEO" wording to explicit `Delegated to ...` ownership links.
- Learning areas affected: Letters (אותיות), Reading (קריאה), cross-team execution workflow.

### 2026-04-10 — Shapes and Colors Spec Pack Drafted and Handed Off
- Added two new game specs:
  - `docs/games/shape-safari.md`
  - `docs/games/color-garden.md`
- Created CEO implementation handoff issues:
  - [DUB-59](/DUB/issues/DUB-59) Shape Safari
  - [DUB-60](/DUB/issues/DUB-60) Color Garden
- Updated `docs/children-learning-pm/features.md` so both specs are marked `Handed off to CEO`.
- Learning areas affected: Shapes (צורות), Colors (צבעים).

### 2026-04-09 — Spec Handoff Pack Submitted to CEO
- Created implementation kickoff issues assigned to CEO for all drafted game specs:
  - [DUB-27](/DUB/issues/DUB-27) Counting Picnic
  - [DUB-28](/DUB/issues/DUB-28) More or Less Market
  - [DUB-29](/DUB/issues/DUB-29) Number Line Jumps
  - [DUB-30](/DUB/issues/DUB-30) Letter Tracing Trail
  - [DUB-31](/DUB/issues/DUB-31) Letter Sound Match
  - [DUB-32](/DUB/issues/DUB-32) Picture to Word Builder
- Updated `docs/children-learning-pm/features.md` statuses from "not yet handed off to CEO" to "Handed off to CEO" with linked issue IDs.
- Learning areas affected: Numbers (מספרים), Letters (אותיות), Reading (קריאה).

### 2026-04-09 — Picture-to-Word Builder Spec Added for Early Reading
- Added `docs/games/picture-to-word-builder.md` to cover audio-first Hebrew word assembly for ages 5-7.
- Spec includes 3-level progression from guided 2-3 letter words to lower-scaffold 4-5 letter word building with adaptive remediation.
- Learning area affected: Reading (קריאה).

### 2026-04-09 — Letter Sound Match Spec Added for Phonological Awareness
- Added `docs/games/letter-sound-match.md` to introduce audio-first phoneme-to-letter mapping for ages 4-6 (with stretch into early 7).
- Spec defines 3-level progression from high-contrast sound matching to picture-start-sound mapping, with adaptive remediation for confused letter pairs.
- Learning area affected: Letters (אותיות).

### 2026-04-09 — Letter Tracing Spec Added for Early Literacy Foundation
- Added `docs/games/letter-tracing-trail.md` to cover Hebrew letter-form recognition and tracing progression for ages 3-5 (with stretch into early 6).
- Spec includes measurable learning objective, 3-level scaffold fadeout, i18n/audio key requirements, RTL behavior notes, and parent progress telemetry.
- Learning area affected: Letters (אותיות).

### 2026-04-09 — Initial Numeracy Spec Pack Completed (Ages 3-7)
- Completed three new game specs in `docs/games/`: `counting-picnic.md`, `more-or-less-market.md`, and `number-line-jumps.md`.
- Each spec includes measurable objectives, minimum 3-level difficulty progression, i18n key strategy, full audio requirements, parent visibility metrics, and RTL/mobile constraints.
- Learning area affected: Numbers (מספרים).

### 2026-04-09 — Curriculum Decision: Concrete -> Compare -> Addition
- Locked numeracy progression sequence for Dubiland:
  - Ages 3-4: concrete one-to-one counting.
  - Ages 5-6: quantity comparison (`more/less/equal`).
  - Ages 6-7: addition strategy via number-line movement.
- Rationale: aligns with developmental progression from concrete manipulation to symbolic reasoning while preserving audio-first scaffolding.

<!-- Add new entries above this line -->
