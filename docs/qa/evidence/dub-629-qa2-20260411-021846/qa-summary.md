## DUB-629 QA summary (2026-04-11)

- Scope executed: active integrated handbook baseline (`magic-letter-map` / book4) after Architect unblock.
- Runtime page-by-page visual matrix: pages 1..10 rendered with expected `page-<nn>-960.webp` sources.
- Fallback probe: forced missing `-960.webp` image and observed renderer fallback to `page-10.png`.
- RTL tablet check: `dir=rtl` confirmed and next-control icon transform is RTL-mirrored (`matrix(-1, 0, 0, 1, 0, 0)`).
- Screenshots captured: `handbook-1024x768.png`, `handbook-768x1024.png`.
- Static file contract check (`page-01..10` for `-960.webp`, `.webp`, `.png`): all present.
- `yarn typecheck`: pass.
