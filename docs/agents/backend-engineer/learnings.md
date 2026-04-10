# Learnings — Backend Engineer

- When an issue shows a stale `checkoutRunId` pointing at a **succeeded** heartbeat run (CMO/checkout 409), the public issue schema does not allow patching `checkoutRunId` directly. A safe repair (preserving assignee) is `PATCH` `status` from `in_progress` → `todo` → `in_progress`: the server nulls `checkoutRunId` on any transition away from `in_progress`. An agent who is **not** the in-progress assignee can perform this PATCH without checkout ownership on that issue.
