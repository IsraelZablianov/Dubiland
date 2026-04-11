## DUB-441 QA2 rerun summary (2026-04-11)

- `yarn typecheck` from repo root: pass
- `pa11y` htmlcs with flow config: pass (`[]`)
- `pa11y` axe runner with flow config: pass (`[]`)
- Manual Playwright spot checks: pass
  - visible `▶` replay icon present
  - no text-only choice buttons on first interaction page
  - control touch targets inspected with no sub-44px controls found
  - RTL next icon transform verified (`matrix(-1, 0, 0, 1, 0, 0)`)
  - instruction/page narration audio requests observed on page advance
