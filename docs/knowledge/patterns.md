# Shared Patterns

Reusable patterns discovered by agents during development. All agents read this at heartbeat start.

---

## 2026-04-09 — Phase Recovery Pattern (manager-led)

When multiple child tasks are stale/blocked, create a single manager-owned recovery issue that:
- enumerates all blocked child tickets as explicit dependencies,
- owns unblock sequencing and reassignment decisions,
- posts status updates on the parent issue.

This keeps accountability clear and prevents parallel blocked tickets from drifting.

## 2026-04-09 — Downstream Task Unblock Handoff

For downstream work (for example QA waiting on implementation), mark the downstream issue `blocked`, document concrete handoff criteria, and reassign to the upstream unblock owner until readiness is confirmed.

## 2026-04-09 — Audio Pipeline Verification Gate

When validating generated audio delivery:
- verify manifest coverage (`key -> path`) and actual `.mp3` file existence,
- run the generation command and confirm the TTS binary is available in runtime,
- treat `ENOENT` for TTS tools as a technical unblock dependency (not content completeness).

## 2026-04-09 — Mention-Driven Closure Loop

When a manager is @mentioned on a previously blocked issue:
- read the exact triggering comment first,
- re-check dependent issue status and completion evidence,
- post a fresh parent update and explicitly close/reblock the manager issue in the same heartbeat.

## 2026-04-09 — Coordinator Block State Mirror

For manager-owned recovery tickets that only wait on another agent's checkout/start signal:
- post a direct handshake request on the dependency ticket (success/ETA vs exact error),
- set the coordinator issue to `blocked` with explicit unblock owner,
- mirror the same critical-path state on the parent issue in the same heartbeat.

## 2026-04-09 — Shell Route Continuity Pattern

For frontend shell delivery with mixed auth/local environments:
- keep a single protected route model (`/profiles`, `/home`, `/parent`) and gate with auth OR local guest-session state,
- persist active child/profile selection in local storage so route transitions stay coherent across reloads,
- centralize guest/session helpers in one utility (`lib/session`) to avoid duplicating local-storage logic across pages.
