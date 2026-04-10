# 2026-04-10 — Marketing Touch Target System (DUB-210)

## Context

Public conversion surfaces in Dubiland must support parent-guided interaction while the parent often holds a phone/tablet one-handed near a child. The previous mixed sizing behavior made primary marketing CTAs inconsistent across entry surfaces.

Scope for this decision is public/marketing conversion controls only (not in-game controls).

## Decision

Adopt a three-tier touch target contract in design tokens and map each tier to intent:

1. `--touch-min: 44px` — secondary/dense controls (baseline accessibility floor)
2. `--touch-primary-action: 60px` — primary conversion actions in constrained layouts (header)
3. `--touch-primary-action-prominent: 72px` — hero/final prominent conversion CTAs

These tiers are already present in `packages/web/src/components/design-system/tokens.css` and are the canonical source of truth for marketing CTA sizing.

## Surface Mapping

Apply the contract to these public surfaces:

- `packages/web/src/components/layout/PublicHeader.tsx`
  - primary "try free" CTA uses `--touch-primary-action`
  - secondary login CTA remains at baseline `--touch-min`
- `packages/web/src/pages/Landing.tsx`
  - hero primary CTA and bottom/final CTA use `--touch-primary-action-prominent`
- `packages/web/src/pages/TopicPillar.tsx`
  - topic hero primary CTA uses `--touch-primary-action-prominent`
- `packages/web/src/pages/ParentsFaq.tsx`
  - public entry primary CTA uses `--touch-primary-action-prominent`

## Button API Guidance

`Button` size tokens remain generic (`sm`/`md`/`lg`). Marketing conversion targets should continue to use explicit style-token overrides on top-level CTAs instead of globally raising all `lg` buttons, to avoid accidental regressions in game/app surfaces.

## Spacing + RTL Rules

- Keep public header CTA pair RTL-safe and preserve clear separation between adjacent tap zones.
- Preferred adjacent action gap for dual CTA rows is `>= 16px` where layout allows.
- Do not reduce secondary controls below `44px`.

## QA Measurement Contract

Validation must report measured min heights per surface at:

- mobile: 375px width
- tablet: 768px+ width

Required matrix rows:

- Public header primary CTA
- Landing hero primary CTA
- Landing final CTA
- Topic pillar primary CTA (if touched by implementation)
- Parents FAQ primary CTA (if touched by implementation)

Any row under floor remains a blocker with exact selector/path and screenshot evidence.

## Rollout Ownership

- FED implementation: `[DUB-214](/DUB/issues/DUB-214)`
- QA verification: `[DUB-216](/DUB/issues/DUB-216)`
- Coordinator: `[DUB-210](/DUB/issues/DUB-210)`
