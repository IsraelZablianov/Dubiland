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

## 2026-04-11 — For rollout gates, TBT deltas can mislead when FCP shifts; track longest-task deltas too
On [DUB-593](/DUB/issues/DUB-593), before/after Lighthouse runs showed large TBT increases on several routes even where raw long-task maxima were flat or improved, because FCP moved earlier and changed the TBT measurement window. Durable gate pattern for consistency rollouts: use route-level `LCP delta`, `CLS delta`, and `longest main-thread task delta` together (plus bundle delta signals), then fail only routes that breach explicit thresholds. This isolated the true no-go route (`/`: `LCP +267ms`, longest task `+53ms`) while avoiding false positives on routes where interaction task length did not regress materially.

## 2026-04-11 — Parent metrics contract adds meaningful JSONB bytes but remains far below truncation thresholds
On [DUB-607](/DUB/issues/DUB-607), a linked-DB synthetic benchmark (`360` attempts across `math/letters/reading`) showed `parentMetricsV1` adds ~`383` bytes per attempt payload on average (`+94.2%` vs summary-only), while max payload chars remained `704` (`13,296` chars of headroom under the `14,000` truncation cap). In the same benchmark, existing parent dashboard RPC latency stayed flat (`legacy p50 +0.182ms`), and the new curriculum RPC added `3` rows / ~`975` response bytes with p50 around `58ms`; treat response-byte growth as the main UI/network tradeoff, not DB latency regression.

## 2026-04-11 — Task-session run binding can block cross-issue checkout in the same heartbeat
When a heartbeat is started from a specific issue context (`executionRunId` bound to one issue), checkout attempts for another assigned issue can fail with `Checkout run context is bound to a different issue`. In that case, keep progress/reporting on the bound issue (status + dependency comment + mirrors requested by leadership) and pick up execution-lane work in a subsequent heartbeat bound to that issue.

## 2026-04-11 — Homepage regressions can be reduced by simplifying lazy-route fallback and deferring below-fold sections
On [DUB-611](/DUB/issues/DUB-611), replacing the animated Suspense fallback (mascot + celebration) with a lightweight spinner/skeleton and applying `content-visibility: auto` to below-the-fold landing sections removed route-entry blocking work in repeated Lighthouse runs. In a controlled 3-run sample on `/`, performance moved from `78-80` to `83`, TBT dropped from `251-284ms` to `0ms`, and max long-task range tightened from `301-334ms` to `295-302ms` while keeping LCP stable/slightly better. For low-end tablets, treat fallback UI complexity and offscreen marketing-section layout as first-class long-task budget levers.

## 2026-04-11 — Route-internal lazy splitting can improve cacheability even when first-load vitals stay flat
On [DUB-461](/DUB/issues/DUB-461), splitting `InteractiveHandbook` into a lightweight route shell plus a lazy-loaded `InteractiveHandbookGame` module changed chunk topology from a single `122.71kB` route chunk to `30.95kB` + `92.61kB` chunks, while Lighthouse FCP/LCP on the handbook route stayed roughly flat in local runs due dominant shared startup script/auth pressure (`index` + `supabase`). Practical takeaway: route-internal splitting is still valuable for cache isolation and follow-up staged loading, but expect limited first-paint gains unless shared bootstrap bottlenecks are reduced in parallel.

## 2026-04-11 — Post-fix lane closure still requires clean-route validity, not just blocker resolution
After [DUB-610](/DUB/issues/DUB-610) cleared, the final [DUB-506](/DUB/issues/DUB-506) 5-route matrix still showed median LCP around `3989ms` with protected routes (`/games`, `/profiles`, `/parent`, handbook) requesting `Login-*` and `supabase-*` during first-load audits. Durable rule: clearing a known blocker does not by itself justify lane closure; close only when route budgets are met and route identity is clean (no auth/bootstrap contamination). When contamination persists, keep lane open and spin an explicit architecture follow-up (for this run: [DUB-634](/DUB/issues/DUB-634)).

## 2026-04-11 — SPA redirect validation needs an explicit browser probe, not Lighthouse `finalUrl` alone
On [DUB-637](/DUB/issues/DUB-637), anonymous protected-route Lighthouse runs reported `finalUrl` as the source route (`/games`, `/profiles`, etc.) even though a direct browser probe (cold profile, no guest/session hints) resolved all routes to `/login` after guard evaluation. Durable rule: for SPA auth guards, treat Lighthouse `finalUrl` as insufficient redirect evidence; record a companion browser-path probe and use that for anonymous-redirect gate checks.

## 2026-04-11 — Protected-route perf matrices need both contamination flags and credentialed profile coverage
For protected routes (`/games`, `/profiles`, `/parent`, handbook), deterministic Lighthouse runs must report contamination flags (`login_chunk_requested`, `supabase_chunk_requested`) and include an authenticated profile run; otherwise risk classification remains incomplete and parent lanes stay blocked. Missing perf credentials (`DUBILAND_PERF_EMAIL`, `DUBILAND_PERF_PASSWORD`) should be treated as a formal measurement blocker, not just an execution detail.

## 2026-04-11 — Legacy `public/images` assets can bypass optimize step and still break CI budgets
On [DUB-645](/DUB/issues/DUB-645), the image budget gate failed even though `images:optimize` ran cleanly because offending assets (`home-storybook.webp`, `thumb-16x10@2x.webp`, `contact-sheet-16x10.webp`) lived as pre-existing `public/images` artifacts, not `assets-src` inputs. Reliable recovery pattern: (1) re-encode oversized `@2x` thumbnails to a bounded retina profile (`960x600`, WebP quality `38`), (2) re-encode large background hero at same display size but lower quality (`1600x1000`, quality `40`), and (3) make contact-sheet generation deterministic with smaller tile geometry + lower quality (`340x212`, quality `52`, `smartSubsample`). In this run, failing assets moved from `124–264 KiB` down to `33–86 KiB`, class max thumbnail size dropped to `68.7 KiB`, and `yarn workspace @dubiland/web build` returned green with `images:budgets PASS`.

## 2026-04-11 — Credential-gated perf reruns need explicit owner + mirrored ETA updates
On [DUB-637](/DUB/issues/DUB-637), leadership requested a same-heartbeat credential confirmation and blocker mirror to parent lanes. Durable pattern: verify runtime env immediately (`DUBILAND_PERF_EMAIL`, `DUBILAND_PERF_PASSWORD`), then if still missing, post a blocker comment with named secret-provisioning owner and exact timestamp ETA, and mirror one-line status to linked tracking issues (for this run: [DUB-506](/DUB/issues/DUB-506), [DUB-510](/DUB/issues/DUB-510)). This keeps board unblock tracking synchronized without waiting for the next measurement rerun.
