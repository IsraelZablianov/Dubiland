# 2026-04-11 — DUB-691 Fresh-Eyes Friction Audit + Delight Quick Wins

## Context

- Source issue: [DUB-691](/DUB/issues/DUB-691)
- Parent sprint: [DUB-674](/DUB/issues/DUB-674)
- De-dup reference: [DUB-678](/DUB/issues/DUB-678)

This pass intentionally excludes the already-covered `DUB-678` lane (route polish + token contract for `/terms`, `/privacy`, `/parent`, `/no-such-page`) and focuses on net-new friction across:

- Landing -> login
- Login -> profile picker
- Profile picker -> home
- Home -> game start
- In-game loop -> completion

## Net-New Top 10 Improvements

| # | Improvement | Severity | Child impact | Complexity | Evidence anchor |
|---|---|---|---|---|---|
| 1 | Move gameplay routes off marketing chrome (`PublicHeader` + `PublicFooter`) and into child play shell | High | Reduces distraction and accidental exits during play | M | `packages/web/src/components/layout/AppShell.tsx`, `packages/web/src/App.tsx` |
| 2 | Wire existing `ChildPlayShell` into runtime for `/games` and `/games/*` (parent guard + icon nav already implemented but unused) | High | Adds predictable child nav + safer parent gate | M | `packages/web/src/components/layout/ChildPlayShell.tsx`, `packages/web/src/App.tsx` |
| 3 | Cut first-play friction: guest flow currently needs multiple confirmations before first game | High | Faster first success in FTUE, lower abandonment | M | `packages/web/src/pages/Login.tsx`, `packages/web/src/pages/ProfilePicker.tsx`, `packages/web/src/pages/Home.tsx` |
| 4 | Reduce Profile Picker decision load and competing actions (demo expansion + parent zone + continue shown together) | High | Better focus for ages 3-5; fewer wrong-path taps | S | `packages/web/src/pages/ProfilePicker.tsx` |
| 5 | Simplify `/games` information hierarchy for younger bands (hero stats + featured + age filter + sections currently stack together) | High | Keeps within working-memory limits | M | `packages/web/src/pages/Home.tsx` |
| 6 | Demote/highly gate age chips for child view (currently up to 5+ filter choices visible at once) | Medium | Avoids cognitive overload in child-facing flow | S | `packages/web/src/components/design-system/AgeRangeFilterBar.tsx`, `packages/web/src/pages/Home.tsx` |
| 7 | Enforce `>=60px` child-interaction floor inside games (current 48-52px controls still common) | High | Fewer motor misses, less frustration | M | `packages/web/src/games/numbers/CountingPicnicGame.tsx`, `packages/web/src/games/letters/LetterSkyCatcherGame.tsx`, `packages/web/src/games/numbers/MoreOrLessMarketGame.tsx` |
| 8 | Standardize in-game top bar; `GameTopBar` exists but is only used in 3 reading games | Medium | Predictable controls and instruction replay behavior across all games | M | `packages/web/src/components/design-system/GameTopBar.tsx`, `packages/web/src/games/*` |
| 9 | Replace generic suspense fallback with mascot-led loading micro-state | Medium | Children interpret loading as intentional, not broken | S | `packages/web/src/App.tsx` |
| 10 | Add tap-to-hear affordances on parent-facing public surfaces for mixed sessions (text-only today) | Medium | Keeps non-readers oriented when they land on public pages | S-M | `packages/web/src/pages/Landing.tsx`, `packages/web/src/pages/Parents.tsx`, `packages/web/src/pages/About.tsx` |

## Why These Are Net-New vs DUB-678

`DUB-678` focused route polish contracts and touch semantics for low-score routes (`/terms`, `/privacy`, `/parent`, `/no-such-page`).

This list targets unaddressed friction in the core active journey (FTUE, home decision load, gameplay shell, in-game control consistency, loading guidance, and audio affordances).

## Immediate Quick Wins (No-Code / Low-Code)

Ship order for fastest visible impact:

1. **Copy quick win:** update `home.startLearning` to a continuation-oriented label (e.g., "continue play" phrasing) to reduce decision hesitation.
2. **Copy quick win:** rename `profile.moreDemoProfiles` to explicitly parent-scoped wording so children stay on the main path.
3. **Layout quick win:** hide age-filter card in child mode by default; expose via parent action only.
4. **Layout quick win:** in Profile Picker, visually separate `Parent Zone` from `Continue` (distance + demoted style) to remove equal-weight competition.
5. **Micro-state quick win:** swap fallback skeleton for mascot + one short reassurance line.
6. **Card quick win:** for age bands `3-4` and `4-5`, show one badge max on `GameCard` and suppress extra metadata lines.

## Recommended Execution Order

1. **P0 (next 24-48h):** Items 3, 4, 5, 9
2. **P1 (next sprint):** Items 1, 2, 6, 7
3. **P2 (follow-up sprint):** Items 8, 10

## Acceptance Checks

- First guest run reaches first playable interaction with fewer taps than current flow.
- Ages 3-5 child-facing screens expose max 3 primary choices at once.
- Sampled in-game controls on top 5 routes meet `>=60px` for child actions.
- All game routes show consistent top-bar behavior (back, progress, replay instruction).
- Loading and fallback states include mascot-led reassurance (and reduced-motion-safe behavior).
