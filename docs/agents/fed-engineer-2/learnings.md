# FED Engineer 2 — Learnings

Accumulated knowledge specific to the FED Engineer 2 role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Static crawl assets in Vite public
For root SEO assets in this app (`robots.txt`, `sitemap.xml`, `llms.txt`), placing files under `packages/web/public/` serves them directly with `200` and correct MIME types in Vite dev (`text/plain`/`text/xml`), which avoids SPA HTML fallback responses and clears Lighthouse `robots-txt` audit failures.

## 2026-04-10 — Heartbeat fallback validation before coding
When a fallback execution task arrives, check current workspace implementation status first (`typecheck` + `dev` + route mount checks) before duplicating code. This avoids conflicting edits in shared files and still provides a clean QA handoff with concrete run steps.

## 2026-04-10 — Color game delivery pattern with existing audio inventory
For new game lanes, implement interaction phases around already-generated i18n/audio key families first (route + page + component + metadata wiring in one slice), then flag missing prompt variants explicitly to the content/audio lane. This keeps FED delivery shippable without introducing non-audio text debt.

## 2026-04-10 — New game audio path safety via key-derived mapping
For large i18n-heavy game components, deriving audio paths from translation keys (`/audio/he/${kebabSegments}.mp3`) keeps component audio wiring aligned with `generate-audio.py` output and reduces manual map drift when adding many prompt/hint keys.

## 2026-04-10 — Parent-ticket status hygiene after child-lane delivery
When a FED parent issue depends on child execution lanes, immediately re-check child statuses after shipping your lane and patch the parent status (`done` or `blocked`) with explicit unblock criteria. This reduces stale `in_progress` assignments and keeps heartbeat wakeups focused on actionable work.

## 2026-04-10 — Number-line game integration checklist prevents regressions
When adding a new game lane, ship all integration surfaces together in the same heartbeat: component, page wrapper, `App.tsx` route, Home topic option, route metadata key/path, SEO route copy, and an idempotent Supabase seed migration. Missing any one of these leaves the game partially reachable or untracked by infra/QA.
