# 2026-04-10 - Engineering Consistency Enforcement Checklist (DUB-562)

## Context

- Source lane: [DUB-562](/DUB/issues/DUB-562)
- CEO directive parent: [DUB-547](/DUB/issues/DUB-547)
- Baseline architecture input: [DUB-556](/DUB/issues/DUB-556)
- UX audit input: [DUB-563](/DUB/issues/DUB-563)

This document defines the CTO enforcement checklist for engineering consistency across Dubiland. It is the canonical gate for implementation routing and CTO signoff on this cycle.

## Canonical Checklist (Pass/Fail)

### 1) Shell parity and route composition

1. Every route uses `PublicHeader` as the primary header.
2. Every route uses `PublicFooter` as the primary footer.
3. Child/parent route controls remain secondary UI below the primary header.
4. No route introduces a parallel top-level shell header contract.

Primary execution lane: [DUB-594](/DUB/issues/DUB-594) (mapped to technical scope in [DUB-548](/DUB/issues/DUB-548)).

### 2) Component pattern consistency

1. Child route headers use one shared pattern for title/subtitle/meta rhythm.
2. Container width rhythm is centralized; no ad-hoc `max-width` drift between core routes.
3. `GameCard` and Interactive Handbook controls share the same readability and touch hierarchy.

Execution lanes: [DUB-571](/DUB/issues/DUB-571), [DUB-572](/DUB/issues/DUB-572), [DUB-573](/DUB/issues/DUB-573).

### 3) Token and touch-contract compliance

1. Button/control sizing in shared primitives is token driven (no hardcoded fallback sizes for canonical states).
2. Child-primary actions follow child touch targets (>= 60px baseline, 72px target where specified).
3. Child-facing primary labels avoid undersized readability states.

Execution lanes: [DUB-571](/DUB/issues/DUB-571), [DUB-573](/DUB/issues/DUB-573).

### 4) Naming and implementation contracts

1. No new route-local "one-off shell" abstractions are introduced.
2. Shared patterns are applied via reusable components, not repeated inline blocks.
3. Naming remains explicit by role (`Public*`, `Child*`, `Parent*`) and aligned with established component boundaries.

Execution lanes: [DUB-594](/DUB/issues/DUB-594), [DUB-572](/DUB/issues/DUB-572).

### 5) Verification and release gate

1. Primary QA parity matrix posted with route-level pass/fail evidence.
2. Secondary QA sweep validates RTL and tablet parity independently.
3. Performance gate posts route-level deltas and fix links for regressions.
4. Any failed check has a linked executable fix issue before CTO signoff.

Verification lanes: [DUB-595](/DUB/issues/DUB-595), [DUB-596](/DUB/issues/DUB-596), [DUB-593](/DUB/issues/DUB-593).

## Top 5 Consistency Gaps (This Cycle)

| Rank | Severity | Gap | Primary lane |
|---|---|---|---|
| 1 | Critical | Shell parity drift: non-marketing routes still diverge from `PublicHeader` + `PublicFooter` contract. | [DUB-594](/DUB/issues/DUB-594), [DUB-548](/DUB/issues/DUB-548) |
| 2 | Critical | Shared button/touch-size baseline drifts from child token targets. | [DUB-571](/DUB/issues/DUB-571) |
| 3 | High | Child-route header/container rhythm drift (`max-width` and spacing variance). | [DUB-572](/DUB/issues/DUB-572) |
| 4 | High | `GameCard` and handbook controls are not fully aligned to one readability hierarchy. | [DUB-573](/DUB/issues/DUB-573) |
| 5 | High | No single measurable perf/consistency release gate across audited routes. | [DUB-593](/DUB/issues/DUB-593) |

## Closure Sequence

1. Land shell parity and touch baseline first: [DUB-594](/DUB/issues/DUB-594) + [DUB-571](/DUB/issues/DUB-571).
2. Land hierarchy and layout unification in parallel: [DUB-572](/DUB/issues/DUB-572) + [DUB-573](/DUB/issues/DUB-573).
3. Run QA matrix and secondary QA sweep: [DUB-595](/DUB/issues/DUB-595) then [DUB-596](/DUB/issues/DUB-596).
4. Run performance regression gate and convert failures into fix issues: [DUB-593](/DUB/issues/DUB-593).
5. CTO posts final readiness disposition to [DUB-547](/DUB/issues/DUB-547) only after all failed checks have executable fixes.

