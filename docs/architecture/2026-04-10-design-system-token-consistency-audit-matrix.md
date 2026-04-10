# 2026-04-10 — Design System + Token Consistency Audit Matrix (DUB-552)

## Context

- Source issue: [DUB-552](/DUB/issues/DUB-552)
- Parent directive: [DUB-547](/DUB/issues/DUB-547)
- Related UX baseline: `docs/architecture/2026-04-10-ux-visual-consistency-audit-canonical-baseline.md`

## Scope

- `packages/web/src/components/design-system/tokens.css`
- Route shells and page wrappers in `packages/web/src/App.tsx` and `packages/web/src/components/layout/*`
- Highest-traffic pages:
  - `Landing.tsx`, `Home.tsx`, `ProfilePicker.tsx`, `ParentDashboard.tsx`, `InteractiveHandbook.tsx`
- Core consistency-sensitive components:
  - `Button.tsx`, `GameCard.tsx`, `InteractiveHandbookGame.tsx`

## Token Coverage Snapshot

Token reference scan (2026-04-10):

- Total tokens declared in `tokens.css`: 147
- Tokens referenced via `var(--token)` in `packages/web/src` (excluding declaration file): 113
- Tokens currently unreferenced: 34

Unreferenced token groups (highest-priority cleanup targets):

1. Handbook tokens not wired to active styles
   - `--handbook-control-min-height`
   - `--handbook-control-surface-opacity`
   - `--handbook-nav-hotspot-size`
   - `--handbook-nav-hotspot-offset`
   - `--handbook-progress-dot-size`
   - `--handbook-progress-dot-gap`
2. Motion/texture tokens defined but not consumed
   - `--motion-page-transition-out`
   - `--motion-success-burst`
   - `--texture-dots-soft`
   - `--texture-dots-size`
   - `--texture-waves-soft`
3. Topic gradient aliases not consumed directly
   - `--gradient-topic-numbers`
   - `--gradient-topic-letters`
   - `--gradient-topic-reading`

## Consistency Findings

| Severity | Finding | Evidence |
|---|---|---|
| Critical | Base `Button` large size uses hardcoded `56px` instead of tokenized primary touch target. | `packages/web/src/components/design-system/Button.tsx:49` |
| Critical | Child-facing controls remain below primary touch token target (`72px`) in shared patterns. | `packages/web/src/components/design-system/GameCard.tsx:282`, `packages/web/src/games/reading/InteractiveHandbookGame.tsx:3043`, `packages/web/src/games/reading/InteractiveHandbookGame.tsx:3103` |
| High | Route container widths drift by page (`960`, `1040`, `1120`, `1180`), breaking rhythm parity. | `packages/web/src/pages/ProfilePicker.tsx:398`, `packages/web/src/pages/ParentDashboard.tsx:170`, `packages/web/src/pages/Home.tsx:744`, `packages/web/src/pages/InteractiveHandbook.tsx:845` |
| High | Header/footer are not globally identical because app uses three shell families (`MarketingShell`, `ChildPlayShell`, `ParentShell`) with different structures. | `packages/web/src/App.tsx:83`, `packages/web/src/App.tsx:101`, `packages/web/src/App.tsx:117` |
| Medium | Child surfaces still include `font-size-xs` in active content areas; should remain metadata-only for readability. | `packages/web/src/pages/Home.tsx:813`, `packages/web/src/pages/Home.tsx:928`, `packages/web/src/pages/Home.tsx:937` |

## Owner + ETA Matrix (Mapped to Existing Work)

| Priority | Work | Owner | Issue | ETA after pickup |
|---|---|---|---|---|
| P0 | Normalize button/touch target contract | FED Engineer | [DUB-571](/DUB/issues/DUB-571) | 1 heartbeat |
| P1 | Unify child-route header pattern + container width contract | FED Engineer 2 | [DUB-572](/DUB/issues/DUB-572) | 1-2 heartbeats |
| P1 | Align `GameCard` + handbook control/readability hierarchy | FED Engineer 3 | [DUB-573](/DUB/issues/DUB-573) | 1-2 heartbeats |
| P0 | Header/footer parity strategy + rollout | FED Engineer | [DUB-548](/DUB/issues/DUB-548) | 1 heartbeat |
| P0 | Engineering guardrails for rollout ordering and parity checks | Architect/CTO | [DUB-562](/DUB/issues/DUB-562) | Parallel |

## UX Audit Completion Gate (for DUB-552)

`DUB-552` is complete when:

1. Audit evidence and token coverage are documented (this file).
2. Known UX consistency gaps are mapped to active implementation tickets with owners and ETA.
3. Parent issue [DUB-547](/DUB/issues/DUB-547) has explicit UX-lane evidence and linkage.
