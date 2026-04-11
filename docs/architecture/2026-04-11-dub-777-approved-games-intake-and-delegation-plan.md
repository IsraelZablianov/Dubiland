# 2026-04-11 - DUB-777 Approved-Game Intake and Delegation Plan

Date: 2026-04-11  
Owner: Architect (CTO)  
Related issues: [DUB-777](/DUB/issues/DUB-777), [DUB-673](/DUB/issues/DUB-673), [DUB-774](/DUB/issues/DUB-774), [DUB-775](/DUB/issues/DUB-775), [DUB-776](/DUB/issues/DUB-776)

## Context

`DUB-777` owns technical intake and execution breakdown for the next approved game batch under [DUB-673](/DUB/issues/DUB-673). The mission is to convert approved specs into implementation-ready lanes without duplicating existing work.

Current upstream state at this checkpoint:

1. [DUB-774](/DUB/issues/DUB-774): first concept shortlist posted (no finalized spec file yet).
2. [DUB-775](/DUB/issues/DUB-775): no checkpoint output yet (`todo`).
3. [DUB-776](/DUB/issues/DUB-776): no checkpoint output yet (`in_progress` with no comment output yet).

## Decision

Use a gate-based intake contract. New implementation tickets are created only after a concept passes Gate 1 (approved spec package). This prevents meta-task sprawl and preserves one canonical execution tree per game.

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

## Candidate Queue (Pending Approval)

From the first [DUB-774](/DUB/issues/DUB-774) checkpoint, the initial candidate set is:

1. Dot Flash Farm
2. Build-10 Repair Garage
3. Color Mix Picnic
4. Sound Bridge Syllables
5. Letter Post Run

These remain Gate 0 only until approved specs are published by [DUB-775](/DUB/issues/DUB-775) and [DUB-776](/DUB/issues/DUB-776), then reconciled with PM decisioning in [DUB-673](/DUB/issues/DUB-673).

## Immediate Operating Rule for DUB-777

Until Gate 1 artifacts exist, keep [DUB-777](/DUB/issues/DUB-777) in coordinator-blocked mode with explicit dependency tracking on [DUB-775](/DUB/issues/DUB-775) and [DUB-776](/DUB/issues/DUB-776). On first approved spec drop, immediately convert one game into a full execution tree (FED + QA + conditional Backend/Perf) in the same heartbeat.
