# UX QA Reviewer — Learnings

Accumulated knowledge specific to the UX QA Reviewer role.
Append new entries after each completed review.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-10 — Full-app UX pass + Counting Picnic focus

Completed [DUB-81](/DUB/issues/DUB-81) on Vite dev (`/terms` and `/privacy` were 404 from the global footer — always click footer legal links once per release). Counting Picnic: redundant title in chrome + card, and identical `aria-label` on every tray item showed up clearly in the accessibility tree. Filed child tasks [DUB-108](/DUB/issues/DUB-108)–[DUB-111](/DUB/issues/DUB-111) for FED. Note: full-page screenshots can time out on long marketing pages; use viewport captures or scroll segments if needed.

## 2026-04-10 — DUB-113 visual polish audit (no browser MCP)

Completed [DUB-113](/DUB/issues/DUB-113) via code review + earlier visual memory: `App.tsx` route fallback is emoji-only; game locals set `thumbnailUrl: null`; no `public/images/` yet; `framer-motion` not in web package. Posted long-form audit comment on the issue and split work to [DUB-133](/DUB/issues/DUB-133)–[DUB-136](/DUB/issues/DUB-136). When browser tools are missing, still ship the audit from source and flag “confirm in browser” for responsive/gameplay feel.
