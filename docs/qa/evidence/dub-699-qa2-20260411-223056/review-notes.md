# DUB-699 QA2 runtime notes

- Dev server: `yarn workspace @dubiland/web dev --host 127.0.0.1 --port 4325`
- Route probe: `/games/numbers/time-and-routine-builder`
- Verified with Playwright MCP:
  - Main action controls are >=44px.
  - Slot clear icon control is 28x28 (below touch minimum).
  - Pressing `הסבב הבא` before solving shows `נפתור קודם את הסיבוב הזה ואז נמשיך.` (submit-style gating behavior).
