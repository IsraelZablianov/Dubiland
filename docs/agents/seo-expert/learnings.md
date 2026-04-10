# SEO Expert Learnings

(Record durable learnings across heartbeats here.)

## 2026-04-09 — Q2 Technical Baseline Audit

- Lighthouse SEO can report `robots.txt` as malformed when the route falls back to app HTML (evidence: `<!DOCTYPE html>` line in robots audit details), so crawler assets must be explicit static files under `packages/web/public/`.
- For this app shell, the main SEO risk is not just metadata gaps; it is missing public indexable route architecture. Route/index policy needs Architect ownership before content expansion.
- Lab Lighthouse captured LCP risk clearly (`/home` 3.83s, `/profiles` 3.46s, `/parent` 3.35s), but INP remained unavailable in lab without interactions; production field monitoring must come from GA4 + Search Console provisioning.
- Baseline audit quality improves when each critical/high finding immediately gets a linked execution issue with file-level acceptance criteria.

## 2026-04-09 — Schema + GEO Handoff Pattern

- For schema planning tasks, acceptance is faster when `schema-plan.md` includes phase gates plus a per-type JSON-LD contract table (required fields + route eligibility), not just a list of schema types.
- GEO readiness should be documented as reusable templates (40-60 word answer-first block + FAQ pair) so Content and FED can implement consistently.
- Closing a strategy issue should include at least one concrete linked engineering task (for example [DUB-24](/DUB/issues/DUB-24)) and a parent-issue handoff comment in the same heartbeat.

## 2026-04-09 — Hebrew Keyword Demand Signal Mix

- For Hebrew edtech keyword mapping, exact long-tail phrases frequently collapse to `0` in Google Trends even when they are valid intents; treat `0` as below visibility threshold and pair with SERP competition data before deprioritizing.
- A two-signal approach worked for heartbeat-level planning quality: Google Trends normalized demand score (`today 12-m`, IL, anchor term) + Bing Hebrew result-count competition proxy.
- Parent lifecycle terms (`גן חובה`, `הכנה לכיתה א`) showed materially stronger demand than many app-category terms, so parent readiness pages should be part of P1 SEO execution, not just product feature pages.
- Numbers/game cluster should prioritize `משחקי חשבון` and `תרגילי חשבון` early; they outperformed many narrower children-learning variants in available demand data.

## 2026-04-09 — Pillar/Cluster Backlog Sequencing Pattern

- Content architecture planning quality improved by separating `topic intent coverage` from `route readiness`: keep keyword intent mapped even when target routes are deferred to Q3.
- For Dubiland Q2, prioritize indexable parent-facing pillar and lifecycle pages first, and treat `/games/*` SEO surfaces as route-expansion carry work unless architecture explicitly graduates them.
- Adding a fallback rule ("publish guide page first if gameplay route is delayed") preserves keyword momentum while reducing dependency risk on game-route rollout.

## 2026-04-09 — Analytics Provisioning Blocker Handling

- For GA4/GSC dependency tasks, validate against a fixed non-secret checklist before closing: production domain, GA4 measurement ID, GSC verification status, verification date, and owner/admin contact.
- When inputs are missing, post one explicit missing-fields comment on the provisioning issue and deep-link that exact comment from the blocked child issue to reduce duplicate blocker churn.
- Re-state the env-only FED contract (`VITE_GA4_MEASUREMENT_ID`) in blocker and completion comments to prevent credentials from leaking into repo or issue threads.

## 2026-04-09 — Route Policy Validation (DUB-43)

- Route rollout acceptance quality improved when validation explicitly compares three artifacts together: runtime route map (`App.tsx`), metadata policy map (`routeMetadata.ts` + `RouteMetadataManager.tsx`), and crawl artifacts (`robots.txt` + `sitemap.xml`).
- Unknown-route SEO policy needs a dedicated assertion: `robots=noindex,nofollow` alone is insufficient when architecture requires `canonical: none`; canonical/hreflang must be checked separately on `*` fallback.
- Route-policy drift can hide in legacy pages: `/about` remained indexable while missing from architecture route inventory and sitemap. A post-rollout “indexable route parity” check should assert every indexable metadata route has an explicit architecture row.
- Operationally, posting the same pass/fail matrix on both the acceptance lane and parent implementation issue reduced decision lag for managers and avoids split-thread ambiguity.

## 2026-04-10 — Schema Acceptance Validation Pattern (DUB-50)

- For pre-production schema acceptance, combine three evidence layers in one heartbeat: static contract verification (route-to-schema matrix), schema syntax validation (`Schema.org` parser), and Google-rule proxy checks to catch obvious markup regressions before release.
- When official URL-based validators are blocked by missing public preview, open a dedicated FED unblock issue immediately with explicit route URLs and `VITE_SITE_URL` requirements instead of leaving blocker ownership implicit.
- Keeping temporary artifacts under `/tmp/dubiland-schema/` is enough for heartbeat evidence, but permanent traceability should be mirrored into issue comments and `docs/seo/schema-plan.md` so future heartbeats do not depend on ephemeral files.

## 2026-04-10 — Transient Preview URL Failure Pattern (DUB-50/DUB-66)

- “Preview URL provided” is insufficient acceptance evidence for validator handoff; require resolver proof (`dig +short`) plus HTTP probes at handoff time.
- Cloudflare quick-tunnel hosts can expire before the next heartbeat. For validation-dependent lanes, ask FED to guarantee minimum URL uptime window in the task acceptance criteria.
- Official Schema.org validator API (`POST https://validator.schema.org/validate`) is useful as a machine-verifiable blocker signal: `fetchError: NOT_FOUND` with `numObjects: 0` confirms crawl-level failure without waiting for UI tooling.

## 2026-04-10 — Board-Dependent Provisioning Pattern (DUB-20)

- When board/admin explicitly confirms missing production-domain decisions, keep the issue blocked and restate the exact non-secret checklist in one canonical comment to prevent churn across dependent lanes.
- For GA4/GSC provisioning lanes, repeating the env-only FED contract (`VITE_GA4_MEASUREMENT_ID`) in each blocker update reduces accidental requests for credential leakage in comments/repo.

## 2026-04-10 — Blocked Dedup on Assignment Wake

- Assignment-triggered wakes can fire on issues that remain blocked without any new comments; apply blocked-thread dedup first to avoid redundant checkout/comment churn.
- If the latest comment is your own blocker update and no new external comment exists, skip mutation and move to the next assigned issue in the same heartbeat.

## 2026-04-10 — AI Visibility Capture Reliability Pattern (DUB-205)

- Direct HTTP automation against assistant UIs (ChatGPT/Perplexity) is brittle because anti-bot JS/cookie challenges frequently block reproducible capture in heartbeat environments.
- For GEO baseline continuity, keep a fixed scoring rubric and query set even when evidence capture is partial; this preserves month-over-month comparability.
- Treat "automation blocked" as a first-class measurement state in the report, and pair it with a manual-evidence follow-up checkpoint instead of skipping the baseline cycle.

## 2026-04-10 — Manual Evidence Pass Gate Pattern (DUB-209)

- A reproducible 10x4 assistant pass can still be completed under blocked conditions by pairing query-link probes (`manual-pass-2026-04-10.csv`) with explicit gate-state screenshots per platform.
- In this runtime, gate states were stable across all 10 Hebrew queries: ChatGPT Cloudflare verify-human, Perplexity Cloudflare security verification, Google reCAPTCHA unusual-traffic gate, and Copilot region block.
- Confidence must be split clearly: high confidence in access-gate diagnosis, low confidence in true market citation-share because answers never rendered.
- Keep the rubric and query set unchanged even when blocked so deltas remain comparable and “no change” is auditable rather than inferred.

## 2026-04-10 — Monthly KPI Checkpoint Handshake (DUB-229)

- For recurring GEO cadence tasks, include the required KPI table directly in both the monthly report and the parent-program comment so acceptance is visible without opening files.
- When no prior monthly artifact exists, mark MoM deltas explicitly as `N/A (first monthly checkpoint)` instead of forcing zero deltas; this avoids false trend signals.
- Treat hybrid-tooling gate status as a binary monthly decision block (Gate A/Gate B met or not met) to reduce ambiguity for CMO budget decisions.

## 2026-04-10 — Blocked-Lane Policy Acknowledgement Pattern (DUB-20)

- When board posts a dated policy decision (for example Option B defer-until-domain), immediately refresh the blocked issue with the exact absolute target date and unchanged acceptance checklist to prevent downstream teams from acting on stale assumptions.
- Even if technical work cannot proceed, add explicit post-unblock execution sequence links (`DUB-18` -> `DUB-20` -> `DUB-21`) so CMO/PM can resume in one heartbeat once inputs arrive.

## 2026-04-10 — Preview Tunnel Stability Guard (DUB-50)

- A “host is live” handoff comment is not sufficient for validator execution; always re-check DNS + HTTP reachability at execution start, even within the advertised uptime window.
- If preview host fails before promised window, immediately post the same evidence set on the validation issue and acceptance parent, and open a fresh FED follow-up with explicit DNS/HTTP proof requirements to avoid repeated ambiguous unblock cycles.

## 2026-04-10 — Schema Validator API Response Parsing Guard

- The Schema.org validator endpoint returns an XSSI prefix (`)]}'`) before JSON; parsers must strip it before `json.loads`, or they will produce false parse errors that obscure true `fetchError` signals.
- For unreachable/invalid preview hosts, `fetchError: NOT_FOUND` with `isRendered: false` and `numObjects: 0` is a reliable blocker signature to include in issue comments.

## 2026-04-10 — Validator Reachability vs Browser Reachability

- A preview host can return temporary browser `200` while still failing validator fetches (`Schema.org fetchError: NOT_FOUND`), so unblock criteria must include validator-bot reachability, not only browser route checks.
- In this heartbeat environment, Rich Results URL automation can be auth-gated (`Something went wrong — Log in and try again`) and HAR responses may show `RVtklb` payload `[null,3]`; treat this as tooling-access failure and preserve HAR/screenshot artifacts instead of marking schema pass/fail.
- Require start+end proofs across a fixed uptime window (for example 60 minutes) and keep the same host alive until SEO posts rerun outcomes.

## 2026-04-10 — UA Probe False Positive Pattern

- Matching HTTP `200` for validator-like user-agent strings is not sufficient to prove official validator backend fetchability; Schema.org can still return `fetchError: NOT_FOUND`.
- Keep the official validator API response itself as the acceptance gate (not only HTTP route probes), and include both signals in blocker comments to prevent repeated “green-but-still-failing” loops.

## 2026-04-10 — Contradictory Validator Claims Protocol

- When FED completion claims conflict with SEO runtime evidence, immediately request raw validator payload artifacts (full Schema.org API bodies with timestamps) instead of relying on summarized claims.
- Schema.org can impose `HTTP 429` after repeated heartbeat retries; treat temporary rate limiting as measurement noise, but keep the most recent non-throttled result as the gating signal until reproducible success is posted.

## 2026-04-10 — Fast 5xx Regression Guard

- Even after a reported stability window, quick-tunnel preview hosts can regress to edge `502` across all required routes within later heartbeats.
- Always include `/robots.txt` in regression probes alongside content routes to quickly distinguish host-level outage from route-level SEO implementation issues.

## 2026-04-10 — Reopen Without Fresh Host Context

- If a blocked validator issue is moved back to `todo` without a new host/comment payload, immediately rerun one compact probe and re-block with timestamped evidence; this prevents silent “status churn” from being mistaken for technical progress.

## 2026-04-10 — Healthy Host, Unhealthy Validator Path

- A fresh host can pass all direct route checks (`200` on `/`, `/letters`, `/parents/faq`, `/robots.txt`) while official validator endpoints remain blocked by anti-abuse/rate-limit responses from the runtime (`HTTP 429` or Google-sorry redirect).
- In this state, unblock criteria should require raw validator JSON success payloads captured from a known-clean runtime, not just route uptime proofs.

## 2026-04-10 — GitHub Pages Crawlability Gap on Path Routes (DUB-419)

- Even when browser rendering reaches route content through JS fallback, non-JS probes (`curl -I`) can still return `404` on intended indexable paths; this is a launch-critical crawlability signal and must be treated as a blocker.
- For SEO acceptance on static hosting, require direct `HTTP 200` on indexable paths before marking route rollout complete; JS-only recovery is insufficient.

## 2026-04-10 — Canonical Base-Path Loss Pattern

- Using `new URL(VITE_SITE_URL).origin` in metadata code drops deployment pathname segments (for example `/Dubiland`) and silently generates wrong canonical/hreflang URLs.
- Canonical builders for subpath deployments must preserve canonical base path, not only origin.

## 2026-04-10 — Crawl Asset Host Drift Detection

- `robots.txt`, `sitemap.xml`, canonical URLs, and `llms.txt` can drift independently if host values are static in multiple files.
- Keep crawl assets host-driven from a single deployment canonical source and verify all published URLs resolve in the same runtime heartbeat.
