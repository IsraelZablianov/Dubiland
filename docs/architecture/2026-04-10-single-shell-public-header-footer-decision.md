# 2026-04-10 — Single Shell Decision: `PublicHeader` + `PublicFooter` Everywhere (DUB-556)

## Context

- Source issue: [DUB-556](/DUB/issues/DUB-556)
- CEO directive parent: [DUB-547](/DUB/issues/DUB-547)
- Implementation lane: [DUB-548](/DUB/issues/DUB-548)
- Current runtime split (pre-decision):
  - `MarketingShell` (`PublicHeader` + `PublicFooter`) on marketing/public routes
  - `ChildPlayShell` custom header + no footer on child/game routes
  - `ParentShell` + `AppHeader` + no footer on parent route

The directive is explicit: visual and structural shell consistency is required across the whole product. The canonical header/footer pair is the one already used by the home page.

## Decision

Dubiland adopts a **single canonical page shell** for all routes:

1. Every route renders `PublicHeader` as the primary top-level header.
2. Every route renders `PublicFooter` as the bottom-level footer.
3. Any child or parent-specific controls are rendered as **secondary context UI under the primary header**, never as a replacement header.
4. Route protection/auth remains handled by `ProtectedRoute`; it does not own visual shell composition.

This is an architecture-level standard, not a page-by-page preference.

## Canonical Composition Contract

All pages must follow this composition order:

1. `PublicHeader`
2. Optional contextual strip (child profile/game nav/parent quick actions), page-specific
3. Route content (`main`)
4. `PublicFooter`

Allowed variation: content density and local contextual controls.
Not allowed: replacing `PublicHeader`/`PublicFooter` with route-local shell chrome.

## Migration Boundaries

Scope for first implementation pass in [DUB-548](/DUB/issues/DUB-548):

1. `packages/web/src/App.tsx`
2. `packages/web/src/components/layout/ChildPlayShell.tsx`
3. `packages/web/src/components/layout/ParentShell.tsx`
4. `packages/web/src/components/layout/AppHeader.tsx`

Required outcome:

1. All route wrappers in `App.tsx` use the same primary shell contract (`PublicHeader` + `PublicFooter`).
2. `ChildPlayShell` is reduced to optional secondary chrome (or replaced by a context strip component).
3. `ParentShell` no longer injects `AppHeader` as a primary header.
4. `AppHeader` is removed or marked deprecated and unused by active routes.

## Trade-Offs and Rationale

1. Pro: Immediate consistency across marketing, child, and parent flows.
2. Pro: Lower cognitive switching for families moving between zones.
3. Pro: Single shell contract simplifies QA visual checks and regression prevention.
4. Con: Child/game routes may need additional layout tuning after unification.
5. Con: Existing custom shell affordances must be re-homed as secondary UI.

Given the CEO quality directive and current inconsistency debt, consistency is prioritized over preserving divergent route shells.

## Enforcement Rules

1. New routes must not introduce new top-level header/footer components.
2. `PublicHeader` + `PublicFooter` are mandatory defaults for route composition.
3. Architecture review blocks any PR that restores parallel primary shells.
4. QA shell checks should validate header/footer parity on `/`, `/games`, `/games/*`, `/profiles`, and `/parent`.

## Done Gate for DUB-556

[DUB-556](/DUB/issues/DUB-556) is complete when this architecture decision is documented and linked for implementation in [DUB-548](/DUB/issues/DUB-548).

Implementation and QA closure remain tracked in their execution lanes and should not diverge from this decision.
