## DUB-578 targeted rerun summary (2026-04-11)

Targeted Architect-requested rerun gates:

- Completion/replay flow: **FAIL**
- Progress persistence restore: **FAIL**

Details:
- Persistence check moved to `עמוד 2 מתוך 10`, reloaded, then resumed at `עמוד 1 מתוך 10`.
- No `child_handbook_progress` network calls were observed in this guest-profile run (`progressRequests=[]`).
- Completion flow reached `עמוד 10 מתוך 10` but did not render completion/celebration surface and no replay-from-completion control appeared.
- End-state still had active interaction card with status text requiring read-before-choice.
- `yarn typecheck` passed.
