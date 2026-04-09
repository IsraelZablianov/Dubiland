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
