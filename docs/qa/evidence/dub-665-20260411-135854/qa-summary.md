# DUB-665 QA Consistency Sweep (post DUB-548)

Timestamp: 2026-04-11 14:03 IDT
Base URL: `http://127.0.0.1:4173`

## Automated gates

- `yarn typecheck` -> PASS
- `yarn workspace @dubiland/web test:touch-shell` -> PASS (5/5)

## Route matrix (desktop + tablet, RTL)

| Route | Desktop (1366x900) | Tablet (820x1180) | Notes |
|---|---|---|---|
| `/` | PASS | PASS | Shared shell present, no overflow, no touch-floor violations |
| `/profiles` | PASS | **FAIL** | Tablet horizontal overflow (`scrollWidth 933 > 820`) |
| `/games` | PASS | **FAIL** | Tablet horizontal overflow (`scrollWidth 935 > 820`) |
| `/games/numbers/counting-picnic` | PASS | **FAIL** | Tablet horizontal overflow (`scrollWidth 935 > 820`) |
| `/games/reading/interactive-handbook` | PASS | **FAIL** | Tablet horizontal overflow (`scrollWidth 935 > 820`) |
| `/home` | PASS* | PASS* | Resolves to NotFound page with shared shell (`PublicHeader` + `PublicFooter`) |

## Confirmed defect

- At 820px authenticated routes, `.public-header__actions` / `.public-header__app-actions` / `.public-header__app-nav` shift left and create horizontal overflow.
- Debug evidence: `tablet__games__overflow-debug.png`

## Fix lane opened

- [DUB-668](/DUB/issues/DUB-668) -> FED Engineer

## Evidence files

- `runtime-matrix.json`
- `desktop__*.png`
- `tablet__*.png`
- `tablet__games__overflow-debug.png`
