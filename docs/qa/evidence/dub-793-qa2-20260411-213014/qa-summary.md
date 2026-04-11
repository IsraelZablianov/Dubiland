# DUB-793 QA2 Verification Summary

## Scope
- Issue: [DUB-793](/DUB/issues/DUB-793)
- Parent: [DUB-765](/DUB/issues/DUB-765)
- Handoff source: [DUB-794#comment-3f518489](/DUB/issues/DUB-794#comment-3f518489-62e4-42ac-b173-d58c0005e55c)

## Commands
- `yarn workspace @dubiland/web test:touch-shell` -> PASS (`10/10`)
- `yarn typecheck` -> PASS

## Runtime verification (fresh local server)
- Server: `yarn workspace @dubiland/web dev --host 127.0.0.1 --port 4315`
- Route: `/games`
- Viewports: `390x844`, `960x900`, `1366x900`

### Pass matrix
- RTL + layout shell:
  - `dir=rtl` on all viewports.
  - No horizontal overflow (`scrollWidth === clientWidth`) on all viewports.
  - Mobile shows sticky top utility shelf; tablet/desktop show sticky side rail.
- Tablet side-nav UX:
  - Collapse/expand toggle works (`panelBefore=true`, collapse -> hidden, expand -> visible).
  - Toggle touch target minimum observed `60px`.
- Section-jump UX (after explicit reveal action):
  - 4 jump controls render on all viewports (`אותיות`, `קריאה`, `חשבון ומשחקי מספרים`, `ספרים אינטראקטיביים`).
  - Jump control min height `48px` (>=44px).
  - Jump click moves page to target sections (positive `scrollY` deltas on all viewports).
- Reduced-motion behavior:
  - Section jump calls `scrollIntoView` with `behavior: "auto"` under `prefers-reduced-motion: reduce`.
- Age filter mapping behavior:
  - Band switching updates selected state and game/section presentation.
  - Progressive-reveal bands (`3-4`, `4-5`, `5-6`, `כל הגילים`) show the chooser card first, then expand to section-jump + section grid after explicit reveal action.

## Artifacts
- `runtime-matrix-base.json`
- `section-jump-matrix.json`
- `sticky-scroll-matrix.json`
- `age-filter-matrix.json`
- `jump-active-followup.json`
- `touch-shell.log`
- `typecheck.log`
- `mobile-games-fresh-server.png`
- `tablet-games-fresh-server.png`
- `desktop-games-fresh-server.png`
- `mobile-games-section-jumps.png`
- `tablet-games-section-jumps.png`
- `desktop-games-section-jumps.png`
