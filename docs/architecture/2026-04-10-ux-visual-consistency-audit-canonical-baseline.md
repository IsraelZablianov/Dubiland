# 2026-04-10 — UX Visual Consistency Audit + Canonical Baseline (DUB-563)

## Context

- Source issue: [DUB-563](/DUB/issues/DUB-563)
- CEO directive parent: [DUB-547](/DUB/issues/DUB-547)
- CTO coordination lane: [DUB-562](/DUB/issues/DUB-562)
- Goal: ship a consistent visual system for highest-traffic Dubiland surfaces (headers/footers, spacing, typography, and button behavior)

## Audited Surfaces (highest traffic)

1. Marketing entry: `/` (`Landing.tsx`) + global marketing shell (`PublicHeader`, `PublicFooter`)
2. Child app hub: `/games` (`Home.tsx`) + child shell (`ChildPlayShell`)
3. Child profile flow: `/profiles` (`ProfilePicker.tsx`)
4. Parent zone: `/parent` (`ParentDashboard.tsx`) + parent shell (`ParentShell`, `AppHeader`)
5. Core reading/game flow: `/games/reading/interactive-handbook` (`InteractiveHandbook.tsx`, `InteractiveHandbookGame.tsx`)
6. Representative game route wrappers (`ColorGarden.tsx`, `LetterSoundMatch.tsx`, `LetterTracingTrail.tsx`, etc.)

## 1) Top Inconsistency Gaps

| Severity | Gap | Evidence |
|---|---|---|
| Critical | Button size contract drift: `Button` large size is hardcoded to `56px`, below child-primary token targets. | `packages/web/src/components/design-system/Button.tsx:49` vs tokens in `packages/web/src/components/design-system/tokens.css:113-115` |
| Critical | Child action affordances still use undersized controls in key flows (`52px`/`56px`). | `GameCard.tsx:282-283`, `InteractiveHandbookGame.tsx:3043-3044`, `InteractiveHandbookGame.tsx:3103` |
| High | Child-route header/container rhythm drifts across top routes (`960`, `1040`, `1120`, `1180` max widths). | `Home.tsx:744`, `ProfilePicker.tsx:398`, `ParentDashboard.tsx:170`, `InteractiveHandbook.tsx:845` |
| High | Page-level inline header duplication persists on many child/game routes, causing visual hierarchy drift and repeated one-off styling. | `Home.tsx:755-790`, `ProfilePicker.tsx:400-426`, `InteractiveHandbook.tsx:846-874`, representative game pages use repeated ad-hoc header blocks |
| Medium | Header systems are not tokenized by shell contract; heights/spacing differ without a shared baseline token map. | `PublicHeader.tsx:175-183`, `AppHeader.tsx:86-94`, `ChildPlayShell.tsx:293-360` |

## 2) Canonical Baseline v1 (Design Contract)

### A. Shell-level consistency (intentional divergence, tokenized)

Three shell families remain, but each must be token-backed and internally consistent:

1. `MarketingShell` (public): marketing header + footer, trust messaging cadence
2. `ChildPlayShell` (gameplay): icon-first, oversized child controls, parent-safe exit
3. `ParentShell` (parent tasks): concise dashboard utility navigation

Required token additions (or central constants) for shell parity:

- `--layout-max-width-marketing`
- `--layout-max-width-child`
- `--layout-max-width-parent`
- `--shell-header-min-height-marketing`
- `--shell-header-min-height-child`
- `--shell-header-min-height-parent`

### B. Button and control contract

1. `Button` sizes must be token-only (no hardcoded pixel heights in component core).
2. Child-primary interactive controls target `>= 72px`; secondary controls use `--touch-min`.
3. Remove per-page min-height overrides where they compensate for a weak base component.

### C. Typography and readability contract

1. Child-facing active prompts/actions should not render below `var(--font-size-md)`.
2. `var(--font-size-xs)` usage should be restricted to parent/supportive metadata, not primary child action copy.
3. Repeated page headings/subtitles should use one shared route-header pattern per shell.

### D. Pattern-level baseline

1. Introduce reusable child-route `PageHeader` pattern (title + subtitle + optional action slot) and replace repeated inline implementations.
2. Keep one canonical `GameCard` hierarchy for title/tag/progress/play-cue density.
3. Keep handbook controls and interaction choices aligned with handbook token system (`--handbook-*` + touch tokens).

## 3) Prioritized Fix List + Handoff Links

| Priority | Workstream | Owner | Handoff Issue | ETA (after pickup) |
|---|---|---|---|---|
| P0 | Normalize design-system button sizing + child touch contract | FED Engineer | [DUB-571](/DUB/issues/DUB-571) | 1 heartbeat |
| P1 | Unify child-route header pattern + container width contract | FED Engineer 2 | [DUB-572](/DUB/issues/DUB-572) | 1-2 heartbeats |
| P1 | Align `GameCard` + handbook control/readability hierarchy | FED Engineer 3 | [DUB-573](/DUB/issues/DUB-573) | 1-2 heartbeats |
| P0 coordination | Engineering-level consistency guardrails and sequencing | Architect/CTO | [DUB-562](/DUB/issues/DUB-562) | parallel |

## 4) Closure Sequence

1. Land [DUB-571](/DUB/issues/DUB-571) first (unblocks all downstream UI sizing consistency).
2. Land [DUB-572](/DUB/issues/DUB-572) and [DUB-573](/DUB/issues/DUB-573) in parallel.
3. CTO lane [DUB-562](/DUB/issues/DUB-562) validates canonical implementation checklist and cross-route consistency rules.
4. QA lanes validate post-merge visual parity against this baseline before [DUB-547](/DUB/issues/DUB-547) closure.

## 5) Done Gate for DUB-563

`DUB-563` can close after:

- this baseline is published,
- FED handoff issues are created and linked,
- and PM can see owner+ETA evidence for the UX lane back on [DUB-547](/DUB/issues/DUB-547).
