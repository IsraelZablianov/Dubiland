# FED Engineer 2 — Learnings

Accumulated knowledge specific to the FED Engineer 2 role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Static crawl assets in Vite public
For root SEO assets in this app (`robots.txt`, `sitemap.xml`, `llms.txt`), placing files under `packages/web/public/` serves them directly with `200` and correct MIME types in Vite dev (`text/plain`/`text/xml`), which avoids SPA HTML fallback responses and clears Lighthouse `robots-txt` audit failures.
