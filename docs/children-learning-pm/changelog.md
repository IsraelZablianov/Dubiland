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

### 2026-04-11 — Cross-Topic Benchmark Synthesis Published and Top-Pick Specs Delegated (DUB-775)
- Published `docs/children-learning-pm/curriculum-benchmark-cross-topic-shortlist-2026-04-11.md` under [DUB-775](/DUB/issues/DUB-775), including:
  - benchmark matrix for Khan Academy Kids, TinyTap, and Duolingo ABC across math/letters/reading/colors patterns.
  - Dubiland coverage-to-gap mapping by learning area and age-band impact.
  - 5-idea shortlist with prioritized top picks for immediate execution.
- Authored three new full game specs in `docs/games/`:
  - `pattern-train.md`
  - `spell-and-send.md`
  - `measure-and-match.md`
- Created direct implementation lanes with FED load balancing and explicit coordination requirements:
  - Pattern Train -> FED Engineer 3 ([DUB-779](/DUB/issues/DUB-779))
  - Spell-and-Send -> FED Engineer 2 ([DUB-780](/DUB/issues/DUB-780))
  - Measure and Match -> FED Engineer ([DUB-781](/DUB/issues/DUB-781))
- Updated `docs/children-learning-pm/features.md`:
  - moved Pattern Train, Spell-and-Send, and Measure and Match from Planned to In Progress with delegated ownership.
  - expanded curriculum coverage rows for Numbers, Reading, and Pattern/Logic.
- Coherence status:
  - integrated Gaming Expert checkpoint from [DUB-774](/DUB/issues/DUB-774).
  - Reading PM lane [DUB-776](/DUB/issues/DUB-776) checkpoint was still pending at publish time and is tracked as a follow-up alignment step.
- Delegation gate check completed: no finalized Children PM specs remain in non-delegated state in `docs/children-learning-pm/features.md`.
- Learning areas affected: Early logic/sequencing (דפוסים והיגיון), Reading encode bridge (קריאה/כתיבה), Math measurement transfer (מדידה).

### 2026-04-11 — Age-Band Progression and Curriculum-Fit Review Delivered to DUB-674
- Delivered age-band review artifact `docs/children-learning-pm/age-band-progression-curriculum-fit-review-2026-04-11.md` from [DUB-693](/DUB/issues/DUB-693), covering 3-4, 4-5, 5-6, and 6-7 progression fit.
- Posted parent-lane recommendations on [DUB-674](/DUB/issues/DUB-674#comment-7e79b5d7-4981-4fea-a537-7c49e873b3f4) with:
  - prioritized gap closure order (subtraction, number bonds, time/routine transfer),
  - wave-based rollout plan (quick wins -> delegated depth lanes -> next-wave backlog),
  - explicit de-dup alignment with [DUB-692](/DUB/issues/DUB-692) to avoid duplicate implementation tickets.
- Locked execution source-of-truth for math depth to existing delegated lanes:
  - [DUB-694](/DUB/issues/DUB-694)
  - [DUB-698](/DUB/issues/DUB-698)
  - [DUB-699](/DUB/issues/DUB-699)
- Learning areas affected: Numbers (מספרים), cross-curriculum time/sequence readiness, progression continuity across ages 3-7.

### 2026-04-11 — Math Depth Spec Pack Authored and Directly Delegated (DUB-676)
- Completed math/early-skills progression review artifact at `docs/children-learning-pm/math-early-skills-objectives-2026-04-11.md` under [DUB-676](/DUB/issues/DUB-676), with updated objective mapping and next-wave idea backlog.
- Authored three new gap-closure game specs:
  - `docs/games/subtraction-street.md`
  - `docs/games/build-10-workshop.md`
  - `docs/games/time-and-routine-builder.md`
- Created direct implementation lanes and assigned ownership with load-aware FED balancing:
  - Subtraction Street -> FED Engineer ([DUB-694](/DUB/issues/DUB-694))
  - Build-10 Workshop -> FED Engineer 2 ([DUB-698](/DUB/issues/DUB-698))
  - Time-and-Routine Builder -> FED Engineer ([DUB-699](/DUB/issues/DUB-699))
- Updated `docs/children-learning-pm/features.md`:
  - moved the three P0 math-gap items from Planned to In Progress with delegated status links.
  - refreshed curriculum coverage for Numbers and added a dedicated Time & Sequence coverage row.
  - added next-wave planned idea rows (Pattern Train, Measure and Match, Money Market Mini).
- Delegation gate check completed: no newly finalized specs remain in non-delegated or "not yet handed off" state.
- Learning areas affected: Numbers (מספרים), cross-curriculum math transfer (זמן וסדר יום), early logic sequencing.

### 2026-04-11 — Letter Storybook Pedagogy and Sequencing Gates Validated
- Delivered `docs/children-learning-pm/letter-storybook-pedagogy-validation-2026-04-11.md` under [DUB-652](/DUB/issues/DUB-652) to validate the new "Learn the Letters" storybook program ([DUB-647](/DUB/issues/DUB-647)).
- Locked required constraints for spec sign-off in [DUB-651](/DUB/issues/DUB-651):
  - developmental letter staging (not pure alphabetical exposure),
  - explicit confusable-pair sequence and remediation loop,
  - age-banded sentence complexity caps,
  - contextual final-form policy,
  - mandatory audio-first/icon-first interaction baseline.
- Updated `docs/children-learning-pm/features.md` to include the new storybook lane with delegated ownership and active support lanes.
- Acceptance checkpoint: PM confirmed this validation output as merge-gate input for [DUB-651](/DUB/issues/DUB-651) and parent sign-off criteria in [DUB-647](/DUB/issues/DUB-647) (comment `2026-04-11T09:19:55Z`).
- Delegation gate check completed: no existing Children PM feature rows in `features.md` are left in a "not yet handed off" or non-delegated state.
- Learning areas affected: Letters (אותיות), early reading bridge (קריאה), age-band progression quality.

### 2026-04-10 — Curriculum consistency checkpoints defined and correction lanes delegated
- Published `docs/children-learning-pm/curriculum-consistency-checkpoints-2026-04-10.md` under [DUB-568](/DUB/issues/DUB-568) with an 8-checkpoint quality matrix (`C1-C8`) spanning objective measurability, progression continuity, pre-literate UX, audio/i18n parity, parent metric comparability, and review-state hygiene.
- Flagged priority drifts:
  - stale review-state language in delegated core specs (`counting-picnic`, `more-or-less-market`, `letter-tracing-trail`);
  - cross-PM reading visibility mismatch between Children PM and Reading PM trackers;
  - parent-dashboard metric naming inconsistency across active games.
- Created direct correction handoff lanes:
  - Gaming Expert: [DUB-582](/DUB/issues/DUB-582)
  - Reading PM: [DUB-574](/DUB/issues/DUB-574)
  - Architect: [DUB-575](/DUB/issues/DUB-575)
- Updated `docs/children-learning-pm/features.md`:
  - added a dedicated in-progress row for curriculum consistency correction lanes.
  - refreshed letters/reading coverage language to reflect active reading-bridge lanes and delegated overhauls.
- Delegation gate check completed: no finalized Children PM specs left in "not yet handed off" state; remaining undecided items are un-authored planned gaps.

### 2026-04-10 — Critical Educational Quality Audit Completed (Ages 3-7)
- Completed comprehensive audit in `docs/children-learning-pm/educational-quality-audit-2026-04-10.md` under [DUB-502](/DUB/issues/DUB-502), including:
  - web-backed Ministry curriculum signal review (kindergarten and grade-1 literacy/numeracy pages).
  - full game-to-learning-objective mapping across Children Learning PM and Reading PM active catalog.
  - 1-week and 1-month measurable outcome expectations for ages 3-4, 5-6, and 6-7.
  - hard-gap analysis for older children (no dedicated lanes for subtraction, place value, measurement/time, writing/encoding, and inferential listening comprehension).
- Added prioritized, task-ready backlog recommendations (P0/P1) focused on closing 5-7 depth gaps before expanding early-years breadth.
- Delegation gate check performed on `docs/children-learning-pm/features.md`: no un-handed-off finalized specs found in this heartbeat.
- Learning areas affected: Numbers (מספרים), Reading (קריאה), cross-curriculum depth and age-band mastery quality.

### 2026-04-10 — Wave 2 Handbook Specs (Books 4-10) Completed and Directly Delegated
- Authored seven new handbook specs under `docs/games/handbooks/`:
  - `book-4-yoav-letter-map.md`
  - `book-5-naama-syllable-box.md`
  - `book-6-ori-bread-market.md`
  - `book-7-tamar-word-tower.md`
  - `book-8-sahar-secret-clock.md`
  - `book-9-guy-class-newspaper.md`
  - `book-10-alma-root-families.md`
- Created direct implementation lanes and balanced ownership across FED 1/2/3:
  - [DUB-445](/DUB/issues/DUB-445), [DUB-446](/DUB/issues/DUB-446), [DUB-447](/DUB/issues/DUB-447), [DUB-448](/DUB/issues/DUB-448), [DUB-449](/DUB/issues/DUB-449), [DUB-450](/DUB/issues/DUB-450), [DUB-451](/DUB/issues/DUB-451).
- Created Wave 2 support lanes under parent [DUB-423](/DUB/issues/DUB-423):
  - Reading PM [DUB-436](/DUB/issues/DUB-436)
  - Gaming Expert [DUB-437](/DUB/issues/DUB-437)
  - UX Designer [DUB-438](/DUB/issues/DUB-438)
  - Content Writer [DUB-439](/DUB/issues/DUB-439)
  - Media Expert [DUB-440](/DUB/issues/DUB-440)
- Updated `docs/children-learning-pm/features.md` to mark Wave 2 specs as delegated and expand handbook/reading curriculum coverage for ages 5-7.
- Learning areas affected: Reading (קריאה), Hebrew decoding progression, text-evidence comprehension, morphology-light transfer.

### 2026-04-10 — Handbook Market Analysis and 10-Book Age Matrix Completed
- Completed `docs/games/handbook-market-analysis.md` under [DUB-378](/DUB/issues/DUB-378) with:
  - benchmark synthesis of Epic!, Vooks, FarFaria, Storypark, HOMER, and Khan Academy Kids story patterns.
  - age-band attention and interaction-density recommendations for 3-4, 5-6, and 6-7.
  - a 10-book age-group matrix (3 books for ages 3-4, 3 books for ages 5-6, 4 books for ages 6-7).
- Selected top 3 launch candidates (one per age group):
  - `דובי וגן ההפתעות` (3-4)
  - `משימת האותיות בפארק` (5-6)
  - `בלשי המילים בעיר העתיקה` (6-7)
- Synced `docs/children-learning-pm/features.md` to reference the [DUB-378](/DUB/issues/DUB-378) market-analysis output inside the Interactive Handbooks row.
- Learning areas affected: Reading (קריאה), cross-curriculum story learning progression and launch sequencing.

### 2026-04-10 — Interactive Handbooks Pillar Spec Completed and Delegated
- Completed handbook feature spec at `docs/games/interactive-handbooks-pillar.md` under [DUB-326](/DUB/issues/DUB-326), including:
  - full product flow, modes, session loop, completion logic, and adaptive age-band progression (3-4, 5-6, 6-7).
  - mandatory pre-literate UX baseline (`▶`/`↻`/`💡`/`→`) and action-triggered validation requirements.
  - first implementation blueprint: `דובי וגן ההפתעות` with 12 pages, page-level intent, and inline interaction insertion points.
- Created direct FED implementation handoff [DUB-335](/DUB/issues/DUB-335), assigned to FED Engineer 3 after load check showed lowest active queue among FED 1/2/3.
- Updated `docs/children-learning-pm/features.md` with delegated status and added handbook coverage row to curriculum mapping.
- Learning areas affected: Reading (קריאה), cross-curriculum story-based learning (letters, numbers, vocabulary).

### 2026-04-10 — Letter Sky Catcher Spec Completed and Directly Delegated
- Completed new letters/phonics arcade spec at `docs/games/letter-sky-catcher.md` from task [DUB-311](/DUB/issues/DUB-311), including:
  - 3-level adaptive difficulty with 30-second letter rotation.
  - full pre-literate UX baseline (`▶`/`↻`/`💡`/`→`, action-based validation only).
  - Hebrew vocabulary bank with 3-5 object starters per Hebrew letter and full i18n/audio key families.
- Created direct implementation handoff issue [DUB-312](/DUB/issues/DUB-312), assigned to FED Engineer 3 based on active load balancing across FED 1/2/3.
- Updated `docs/children-learning-pm/features.md` with delegated status and expanded letters curriculum coverage notes for ages 3-7.
- Learning areas affected: Letters (אותיות), phonological awareness, impulse-control gameplay foundations.

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
