# DUB-685 QA2 Accessibility + RTL Validation (All Routes)

Timestamp: 2026-04-11 15:06 IDT
Base URL: `http://127.0.0.1:4187` (Vite preview)

## Scope

Validated all routes from `packages/web/src/App.tsx`:
- Public: `/`, `/about`, `/parents`, `/parents/faq`, `/terms`, `/privacy`, `/letters`, `/numbers`, `/reading`, `/login`, fallback `__qa-404__`
- Protected: `/profiles`, `/games`, `/parent`, and all game routes under `/games/*`

Total routes checked: **29**

## Gates run

- `yarn typecheck` -> PASS
- `yarn workspace @dubiland/web test:touch-shell` -> PASS (7/7)
- RTL/touch/overflow matrix script -> PASS for global RTL shell checks
  - `dir=rtl` + computed RTL: PASS on all routes
  - Horizontal overflow: PASS on all routes
  - Touch target floor (<44px): PASS on all routes in matrix scan
- `pa11y-ci` (htmlcs): FAIL on 16/29 routes
- `pa11y --runner axe`: FAIL on 23/29 routes (plus targeted rerun on previously false-negative routes)

## Findings (actionable)

1. **P1 – Color contrast failures are widespread across public + game surfaces**
   - Rule: `color-contrast`
   - Evidence:
     - `pa11y-ci`: `pa11y-ci/*.log`
     - `axe`: `pa11y-axe/*.json`
     - Targeted rerun for routes with initial empty axe output: `pa11y-axe-rerun/*.json`
   - Notable counts:
     - `/games`: 102 (axe rerun)
     - `/games/numbers/number-line-jumps`: 37
     - `/games/reading/decodable-micro-stories`: 24
     - `/games/reading/sight-word-sprint`: 21
     - `/`: 19 (axe rerun)
     - `/parents`: 17
   - Suspected source tokens/classes:
     - `packages/web/src/components/design-system/tokens.css` (`--color-text-secondary`, `--color-star-empty`, theme accent usage)
     - Marketing text classes in `packages/web/src/pages/Landing.tsx`

2. **P1 – Invalid ARIA usage (`aria-prohibited-attr`) in multiple game HUDs**
   - Pattern: `aria-label` attached to non-interactive `div`/`span` metric or progress wrappers.
   - Affected route family (from axe):
     - `color-garden`, `shape-safari`, `counting-picnic`, `more-or-less-market`, `number-line-jumps`, `letter-sound-match`, `letter-tracing-trail`, `letter-sky-catcher`, `letter-storybook`
   - Representative code references:
     - `packages/web/src/games/numbers/MoreOrLessMarketGame.tsx:1138`, `:1168`
     - `packages/web/src/games/numbers/NumberLineJumpsGame.tsx:1050`
     - `packages/web/src/games/letters/LetterSoundMatchGame.tsx:1466`, `:1549`
     - `packages/web/src/games/letters/LetterTracingTrailGame.tsx:1513`, `:1566`
     - `packages/web/src/games/colors/ColorGardenGame.tsx:1156`
     - `packages/web/src/games/reading/LetterStorybookGame.tsx:1080`

3. **P1 – Nested interactive controls in MoreOrLessMarket baskets**
   - Rule: `nested-interactive`
   - Route: `/games/numbers/more-or-less-market`
   - Evidence: `pa11y-axe/games__numbers__more__or__less__market.json`
   - Code reference:
     - Basket container is `role="button"` + `tabIndex={0}` and contains inner button(s):
       - `packages/web/src/games/numbers/MoreOrLessMarketGame.tsx:1201-1266`
       - `packages/web/src/games/numbers/MoreOrLessMarketGame.tsx:1337-1370`

4. **P2 – Scrollable region is not keyboard focusable**
   - Rule: `scrollable-region-focusable`
   - Route: `/games/numbers/number-line-jumps`
   - Evidence: `pa11y-axe/games__numbers__number__line__jumps.json`
   - Code references:
     - Scroll container: `packages/web/src/games/numbers/NumberLineJumpsGame.tsx:1103-1111`
     - CSS `overflow-x: auto`: `packages/web/src/games/numbers/NumberLineJumpsGame.tsx:1373-1381`

## Non-blocking note

- `yarn workspace @dubiland/web build` currently fails due existing image budget violations (`images/about/boys-soccer-raw.png`, `images/about/boys-soccer.jpg`).
- This is not part of DUB-685 scope but should be tracked if build gate is expected in QA signoff.

## Verdict

**DUB-685 cannot be approved as accessibility-pass.**

RTL shell, overflow, and touch-floor checks pass, but accessibility fails on contrast + semantic ARIA issues and one keyboard-scroll issue.

