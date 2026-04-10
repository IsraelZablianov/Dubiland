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

## 2026-04-10 — Public SEO LCP improved by removing early auth/video work from first paint
On [DUB-430](/DUB/issues/DUB-430), the SEO routes were missing LCP mainly because first-view rendering still pulled auth/video work into the critical path. Effective fixes were: lazy auth bootstrap in `useAuth` (only on auth routes or session hint), removing public-route `AnimatedPage` wrapping, deferring `/letters` video repository load until scroll, and hiding hero mascot visuals on mobile SEO views so text wins LCP. In local mobile Lighthouse, LCP moved from `/ 2450ms`, `/letters 2529ms`, `/parents 2296ms` to `/ 2374ms`, `/letters 2083ms`, `/parents 2007ms`, with no Supabase request on these first paints.

## 2026-04-10 — Handbook audio preloads can silently convert into startup media downloads
On [DUB-461](/DUB/issues/DUB-461), preloading page audio too aggressively (`Audio` metadata warmups or immediate next-page prefetch) caused full MP3 downloads during Lighthouse startup, inflating transfer and hurting FCP/LCP. For handbook routes on slow tablets, keep manifest wiring but cap startup to minimal prompt-level preloads and defer broader audio warming until after first paint/user progression.

## 2026-04-10 — Auth decoupling can pass startup wall while LCP still regresses
On [DUB-480](/DUB/issues/DUB-480), post-handoff measurements after [DUB-481](/DUB/issues/DUB-481) showed `supabase-*` no longer requested in the handbook route-start window (including an 8s throttled observation), and startup wall improved from `5010ms` to `3739ms` (median). But cold Lighthouse LCP still worsened from `2869ms` to `3018ms`, and throttled long-task max rose from `1768ms` to `1890ms` (median). Durable takeaway: removing auth chunk pressure is necessary but insufficient; startup narration request policy and main-thread mount cost must be tuned in the same pass to hit `<2500ms` LCP.

## 2026-04-10 — Deterministic image pipelines should preserve PNG fallbacks and optimize modern formats
On [DUB-534](/DUB/issues/DUB-534), initial `sharp` re-encoding of PNG fallbacks increased fallback bytes despite better WebP/AVIF outputs. Reliable approach: keep PNG source bytes stable (copy-through when source is PNG), then optimize `webp`/`avif` and compact (`-960`) handbook renditions for runtime delivery. With this rule, `magic-letter-map` delivered measurable runtime wins (`page-*.webp` `-25.3%`, compact WebP `-16.6%`, startup preload pack `-33.6%`) while avoiding fallback regressions and enabling class-based CI budget gates.

## 2026-04-10 — Protected-route Lighthouse comparisons require deterministic auth/guest state
On [DUB-506](/DUB/issues/DUB-506), a rerun after route tweaks appeared to regress sharply, but trace inspection showed `/profiles` and `/games` resolving through login-path assets (`Login-*.js`) instead of the intended route payloads. Durable rule: for protected pages, treat route identity verification (network payloads include expected page chunks/assets) as mandatory before accepting Lighthouse deltas, and use a deterministic guest/auth seeding harness for comparable runs. Secondary finding from the same pass: replacing the default games contact sheet removed the prior ~`60KB` `contact-sheet-16x10.webp` transfer from `/games` traces.
