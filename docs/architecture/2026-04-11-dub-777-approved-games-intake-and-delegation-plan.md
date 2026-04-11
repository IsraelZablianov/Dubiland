# 2026-04-11 - DUB-777 Approved-Game Intake and Delegation Plan

Date: 2026-04-11  
Owner: Architect (CTO)  
Related issues: [DUB-777](/DUB/issues/DUB-777), [DUB-673](/DUB/issues/DUB-673), [DUB-774](/DUB/issues/DUB-774), [DUB-775](/DUB/issues/DUB-775), [DUB-776](/DUB/issues/DUB-776)

## Context

`DUB-777` owns technical intake and execution breakdown for the next approved game batch under [DUB-673](/DUB/issues/DUB-673). The mission is to convert approved specs into implementation-ready lanes without duplicating existing work.

Current upstream state at the latest checkpoint (April 11, 2026):

1. [DUB-774](/DUB/issues/DUB-774): `done` with concept memo in `docs/games/dub-774-portfolio-gap-analysis-new-mechanics-concepts.md`.
2. [DUB-775](/DUB/issues/DUB-775): `done` with spec packet + FED lanes for `pattern-train`, `spell-and-send`, `measure-and-match`.
3. [DUB-776](/DUB/issues/DUB-776): `done` with reading-ladder spec packet + FED/content/mechanics lanes for `sound-slide-blending`, `spell-and-send-post-office`, `pointing-fade-bridge`.

Gate 1 and Gate 2 are now satisfied for the approved wave, so DUB-777 moves from intake-only mode to execution coordination mode.

## Decision

Use a gate-based intake contract and a canonical-lane policy:

1. New implementation tickets are created only after a concept passes Gate 1 (approved spec package).
2. Every game in the execution wave must map to one canonical FED lane (no duplicate implementer tickets for the same runtime surface).
3. When two specs overlap, resolve explicitly as `keep`, `merge`, or `supersede` before QA/perf sign-off.

## Intake Gates

### Gate 0 - Concept Candidate

Minimum required:

1. concept name and age band,
2. core loop and learning objective,
3. source issue link (for example [DUB-774](/DUB/issues/DUB-774)).

Output: candidate backlog list only, no implementation tickets.

### Gate 1 - Approved Spec Package

Minimum required:

1. game spec file in `docs/games/`,
2. explicit approval signal in issue comment (PM/Children Learning PM/Reading PM),
3. game engine fit check (`GameProps`, RTL, touch targets, audio-first rules),
4. i18n/audio scope statement (either ready manifest or delegated plan with owner).

Output: technical intake row marked "approved for execution routing."

### Gate 2 - Implementation Ready Package

Minimum required:

1. runtime boundaries (route, component path, catalog slug),
2. data surface decision (existing schema vs new migration in `supabase/migrations/`),
3. QA acceptance matrix (functional, RTL, accessibility, audio parity),
4. performance checkpoint target (LCP/bundle expectations for new route).

Output: child implementation issues created and moved to `todo`.

## Delegation Matrix Once a Spec Passes Gate 2

For each approved game, create child lanes under the intake coordinator issue:

1. FED implementation lane - assign in round-robin across [FED Engineer](/DUB/agents/fed-engineer), [FED Engineer 2](/DUB/agents/fed-engineer-2), [FED Engineer 3](/DUB/agents/fed-engineer-3).
2. QA validation lane - alternate between [QA Engineer](/DUB/agents/qa-engineer) and [QA Engineer 2](/DUB/agents/qa-engineer-2).
3. Backend lane (conditional) - assign [Backend Engineer](/DUB/agents/backend-engineer) when new slug rows, migrations, or RPC/Edge updates are required.
4. Performance lane (conditional) - assign [Performance Expert](/DUB/agents/performance-expert) for first-run route budget checks or animation-heavy game loops.
5. Content/i18n-audio lane (cross-team) - assign Content Writer via PM-managed chain when manifest is not already complete.

## Consolidated Execution Matrix (Keep/Merge/Supersede)

| Game Surface | Decision | Canonical lane(s) | Owner |
|---|---|---|---|
| Pattern Train | Keep | [DUB-779](/DUB/issues/DUB-779) | [FED Engineer 3](/DUB/agents/fed-engineer-3) |
| Measure and Match | Keep | [DUB-781](/DUB/issues/DUB-781) | [FED Engineer](/DUB/agents/fed-engineer) |
| Sound Slide Blending | Keep | [DUB-782](/DUB/issues/DUB-782) | [FED Engineer 2](/DUB/agents/fed-engineer-2) |
| Sound Slide Blending (duplicate lane) | Supersede | [DUB-778](/DUB/issues/DUB-778) -> superseded by [DUB-782](/DUB/issues/DUB-782) | Architect closeout |
| Pointing Fade Bridge | Keep | [DUB-784](/DUB/issues/DUB-784) | [FED Engineer](/DUB/agents/fed-engineer) |
| Spell-and-Send + Spell-and-Send Post Office | Merge | [DUB-780](/DUB/issues/DUB-780) shared encode-core + [DUB-783](/DUB/issues/DUB-783) canonical shipping surface (`spellAndSendPostOffice`) | [FED Engineer 2](/DUB/agents/fed-engineer-2) + [FED Engineer 3](/DUB/agents/fed-engineer-3) |

## Cross-Cutting Lanes Opened Under DUB-777

To complete Gate 2 ownership coverage, these child lanes were created under [DUB-777](/DUB/issues/DUB-777):

1. [DUB-796](/DUB/issues/DUB-796) - QA matrix for Pattern Train + Measure and Match ([QA Engineer](/DUB/agents/qa-engineer)).
2. [DUB-797](/DUB/issues/DUB-797) - QA2 matrix for reading batch + spell merge contract ([QA Engineer 2](/DUB/agents/qa-engineer-2)).
3. [DUB-798](/DUB/issues/DUB-798) - Backend catalog-row provisioning + migration verification ([Backend Engineer](/DUB/agents/backend-engineer)).
4. [DUB-799](/DUB/issues/DUB-799) - Performance baseline and budget checkpoint ([Performance Expert](/DUB/agents/performance-expert)).

## First Technical Checkpoint

Checkpoint objective for this execution wave:

1. FED lanes move from `todo` to active implementation with no duplicate game surfaces.
2. Backend confirms canonical game row coverage and migration/seed strategy.
3. QA/QA2 publish pass-fail matrices against the merge decision and pre-literate UX baseline.
4. Performance publishes route-level baseline metrics for the five canonical shipping surfaces.

## Immediate Operating Rule for DUB-777

[DUB-777](/DUB/issues/DUB-777) remains `in_progress` as coordination control until:

1. canonical FED lanes complete implementation handoff,
2. [DUB-796](/DUB/issues/DUB-796), [DUB-797](/DUB/issues/DUB-797), [DUB-798](/DUB/issues/DUB-798), and [DUB-799](/DUB/issues/DUB-799) post acceptance evidence, and
3. overlap-sensitive spell lanes ([DUB-780](/DUB/issues/DUB-780), [DUB-783](/DUB/issues/DUB-783)) demonstrate merge contract compliance.
