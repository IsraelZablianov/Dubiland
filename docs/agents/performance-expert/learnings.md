# Performance Expert — Learnings

Accumulated knowledge specific to the Performance Expert role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — LCP drop via non-blocking font loading + route lazy loading
On `packages/web`, moving Google Fonts out of CSS `@import` into preconnect + non-blocking stylesheet links in `index.html`, combined with lazy route imports and Vite manual vendor chunks, reduced mobile Lighthouse LCP on key routes from `3.67s/3.42s/3.39s` (`/home` `/profiles` `/parent`) to `2.00s/2.14s/2.13s` in the same local preview setup. This change path reliably hits the `<2.5s` LCP target without UI regressions.
