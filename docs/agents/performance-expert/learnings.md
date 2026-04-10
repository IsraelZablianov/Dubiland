# Performance Expert — Learnings

Accumulated knowledge specific to the Performance Expert role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — LCP drop via non-blocking font loading + route lazy loading
On `packages/web`, moving Google Fonts out of CSS `@import` into preconnect + non-blocking stylesheet links in `index.html`, combined with lazy route imports and Vite manual vendor chunks, reduced mobile Lighthouse LCP on key routes from `3.67s/3.42s/3.39s` (`/home` `/profiles` `/parent`) to `2.00s/2.14s/2.13s` in the same local preview setup. This change path reliably hits the `<2.5s` LCP target without UI regressions.

## 2026-04-10 — Header/auth coupling + above-fold lazy images can reintroduce LCP regressions
During [DUB-173](/DUB/issues/DUB-173), local Lighthouse mobile showed `/home` at LCP `3.47s` while `/` was `2.45s`. Two concrete causes surfaced: (1) Lighthouse `lcp-lazy-loaded` flagged an above-fold `TopicIllustration` image rendered with `loading="lazy"`, and (2) the public header's auth-aware path (`useAuth`) forced `supabase-*.js` (~52KB transfer) onto public routes. Durable fix strategy: keep above-fold visuals eager/high-priority and decouple public-shell first paint from Supabase auth client loading. Follow-up execution tickets: [DUB-177](/DUB/issues/DUB-177) and [DUB-178](/DUB/issues/DUB-178).

## 2026-04-10 — Game-route LCP can be dominated by page transition + immediate intro audio
On [DUB-178](/DUB/issues/DUB-178), Lighthouse marked the route `<h1>` as LCP, not game media. The effective fix was to remove `AnimatedPage` wrapping for `/games/numbers/more-or-less-market` and shift intro audio playback to first paint + `320ms`. This moved local mobile Lighthouse from Perf/LCP/CLS `94 / 2.80s / 0.019` to `96 / 2.35s / 0.053`. For text-LCP routes, treat entry animations and immediate audio fetch as first-class LCP risks.

## 2026-04-10 — Handbook route bottleneck is startup payload, not page-turn responsiveness
For [DUB-398](/DUB/issues/DUB-398), throttled tablet profiling on `/games/reading/interactive-handbook` showed startup bottlenecks (`LCP 2869ms` in Lighthouse mobile, startup wall `5010ms`, long task `1768ms`) while in-session page turns remained healthy (`p95 67.1ms`). The dominant startup payloads were `index` JS (~96KB transfer), `supabase` JS (~52KB), and immediate first narration fetch (~51KB). For handbook launches, prioritize first-paint decoupling and preload-tier governance before tuning page-turn mechanics.
