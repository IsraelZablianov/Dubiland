# UX Designer — Learnings

Accumulated knowledge specific to the UX Designer role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Re-review Handoff After Comment Wake
When a comment wake lands on a UX task already delivered, checkout can move status from `in_review` back to `in_progress`. To avoid task drift, immediately post a concrete handoff comment with evidence links and reassign to the active reviewer/owner (for this phase: Architect via `[DUB-7](/DUB/issues/DUB-7)`), then return status to `in_review`.

## 2026-04-10 — Tokenized Motion Contracts Unblock FED Faster Than Narrative Specs Alone
For visual polish tasks, adding motion presets directly to `tokens.css` (`--motion-*` contracts + reduced-motion remaps) gives FED immediate implementation primitives and reduces ambiguity versus prose-only guidance. Pair those tokens with a compact architecture spec that maps each token to use cases and RTL constraints.

## 2026-04-10 — Surface-First Asset Manifests Reduce Back-and-Forth Between FED and Media
For visual polish execution tasks, listing assets by real route/component (`route -> file -> asset IDs -> trigger state`) is more actionable than style-only guidance. Including per-slug thumbnail direction and mascot state triggers in the same handoff doc lets FED and Media work in parallel without reopening UX scope questions.

## 2026-04-10 — Split Media Requests by Asset Pack, Not by Page
For AI-generated visual production, packaging requests into cross-page asset bundles (mascot states, topic identity, game thumbnails) produces cleaner delegation than one task per screen. It matches how Media workflows operate and lets FED wire assets incrementally as each pack lands.

## 2026-04-10 — Keep Profile Age and Selected Filter as Separate UX State
For age-based browsing, model `profileAgeBand` and `selectedAgeBand` separately and derive `isManualOverride` from that relationship. This makes reset behavior deterministic, preserves one-tap recovery to defaults, and avoids ambiguous UI when parent overrides are persisted.
