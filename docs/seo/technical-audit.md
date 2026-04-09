# Dubiland Technical SEO Audit (Q2 Baseline)

*Owner: SEO Expert | Reviewer: CMO | Last updated: 2026-04-09*

## Scope

- Website surface audited: `packages/web/` (current React + Vite routes)
- Baseline objective: first actionable crawl/index/performance/tracking assessment for Q2 2026
- Measurement timestamp: 2026-04-09 23:13 IDT (2026-04-09 20:13 UTC)

## Audit Status

| Area | Status | Notes |
|------|--------|-------|
| Crawlability | Completed | Critical blockers found (`robots.txt` invalid, no sitemap) |
| Indexation | Completed | Critical blocker found (no defined indexable public route architecture) |
| Core Web Vitals | Completed | LCP above target on all measured key routes |
| Metadata | Completed | High-priority gaps (missing meta descriptions, no canonical/hreflang framework) |
| Structured Data | Deferred | Covered in parallel workstream [DUB-12](/DUB/issues/DUB-12) |
| GEO Readiness | Partial | `llms.txt` missing; crawler directives not explicitly controlled |
| Tracking Setup (GA4 + GSC) | Completed | High-priority blocker: no production tracking/ownership config present |

## Crawl and Index Readiness

### Public Crawl Asset Check

| Asset | Current state | Evidence | Required action |
|------|---------------|----------|-----------------|
| `/robots.txt` | Invalid response | Lighthouse SEO on `/home` reports malformed robots with HTML `<!DOCTYPE html>` content | Implement static `robots.txt` and verify MIME/response behavior |
| `/sitemap.xml` | Missing | No sitemap asset in `packages/web/public/`; no sitemap reference exists | Publish sitemap with indexable public URLs only |
| `/llms.txt` | Missing | No `llms.txt` asset in `packages/web/public/` | Publish root `llms.txt` baseline for AI agents |

### Current Route Inventory and Indexation Intent

| Route | Current behavior | SEO recommendation |
|------|------------------|--------------------|
| `/login` | Public auth entry route | Mark `noindex` (utility/auth page) |
| `/home` | App home route (protected in configured-auth mode) | Treat as app page (`noindex`) unless converted to parent-facing public landing |
| `/profiles` | Child profile selector | `noindex` |
| `/parent` | Parent dashboard | `noindex` |
| `/` | Redirect to `/home` | Keep redirect, no direct index target |
| `*` | Redirect to `/home` | Keep redirect, no direct index target |

## Findings Backlog

| ID | Severity | Category | Finding | Recommended fix | Owner | Status | Linked issue |
|----|----------|----------|---------|-----------------|-------|--------|--------------|
| AUD-001 | critical | Crawlability | `robots.txt` resolves as HTML fallback and is invalid for crawlers. | Add explicit `robots.txt`, include sitemap pointer, verify text response in production. | FED Engineer 2 | Open | [DUB-15](/DUB/issues/DUB-15) |
| AUD-002 | critical | Indexation Architecture | No approved set of indexable public SEO pages; current routes are app/auth-oriented. | Define public route architecture + canonical/noindex policy before content scaling. | Architect | Open | [DUB-16](/DUB/issues/DUB-16) |
| AUD-003 | high | On-page Metadata | Missing meta descriptions and no route-level canonical/hreflang management. | Implement route metadata framework (`title`, `description`, canonical, `hreflang=he`). | FED Engineer | Open | [DUB-17](/DUB/issues/DUB-17) |
| AUD-004 | high | Measurement | GA4 + Search Console baseline is not provisioned (no IDs/verification ownership available). | Provision GA4 + GSC ownership and handoff tracking credentials for implementation. | CMO | Open | [DUB-18](/DUB/issues/DUB-18) |
| AUD-005 | high | Core Web Vitals | Mobile LCP exceeds target (<2.5s) on key routes. | Profile and optimize LCP contributors, then re-measure route-by-route. | Performance Expert | Open | [DUB-19](/DUB/issues/DUB-19) |
| AUD-006 | medium | GEO | `llms.txt` absent; AI extraction context not published at root. | Publish curated `llms.txt` with product/topic/trust context. | FED Engineer 2 | Open | [DUB-15](/DUB/issues/DUB-15) |
| AUD-007 | medium | International SEO | No `hreflang` strategy exposed for Hebrew targeting. | Add `hreflang=he` and canonical alignment in metadata framework. | FED Engineer | Open | [DUB-17](/DUB/issues/DUB-17) |
| AUD-008 | low | Security Headers | HSTS and edge-level security headers are not represented in repo-level web config. | Confirm deployment-layer header policy and document enforcement. | Architect | Open | Dependency on deployment platform configuration |

## Baseline Metrics (First Capture)

Source: Lighthouse CLI (mobile profile), production preview build served locally at `http://127.0.0.1:4173`.

| Metric | Value | Route/Page | Source | Captured at |
|--------|-------|------------|--------|-------------|
| Mobile LCP | 3.83s | `/home` | Lighthouse CLI | 2026-04-09 23:13 IDT |
| Mobile CLS | 0.0029 | `/home` | Lighthouse CLI | 2026-04-09 23:13 IDT |
| Mobile INP | Lab N/A | `/home` | Lighthouse CLI (no interaction in lab run) | 2026-04-09 23:13 IDT |
| Mobile LCP | 3.46s | `/profiles` | Lighthouse CLI | 2026-04-09 23:13 IDT |
| Mobile CLS | 0.0000 | `/profiles` | Lighthouse CLI | 2026-04-09 23:13 IDT |
| Mobile INP | Lab N/A | `/profiles` | Lighthouse CLI (no interaction in lab run) | 2026-04-09 23:13 IDT |
| Mobile LCP | 3.35s | `/parent` | Lighthouse CLI | 2026-04-09 23:13 IDT |
| Mobile CLS | 0.0000 | `/parent` | Lighthouse CLI | 2026-04-09 23:13 IDT |
| Mobile INP | Lab N/A | `/parent` | Lighthouse CLI (no interaction in lab run) | 2026-04-09 23:13 IDT |
| Indexed pages | Blocked baseline | Site-wide | Search Console not configured yet | 2026-04-09 23:13 IDT |

## Tracking Setup Requirements and Blockers

### Provisioning status snapshot (2026-04-09)

| Item | Current state | Required output | Owner |
|------|---------------|-----------------|-------|
| Production domain for analytics/indexing | Not confirmed in this workstream | Canonical production domain string used by GA4 + GSC | PM |
| GA4 property | Not provisioned | Measurement ID (`G-XXXXXXXXXX`) + property owner account | PM |
| Search Console property | Not verified | Domain property verification completed via DNS TXT (`sc-domain:<domain>`) | PM + DNS owner |
| Monthly KPI reporting workflow | Not documented | Standing owner flow for GA4 + GSC pulls into monthly SEO report | CMO + SEO Expert |

### Secure handoff path (implementation-ready for FED)

1. PM provisions GA4 and Search Console under the company-owned Google account for the production domain.
2. PM posts a non-secret implementation comment on [DUB-18](/DUB/issues/DUB-18) with:
   - production domain
   - GA4 measurement ID
   - Search Console property type (`Domain`) and verification method/date
   - primary owner contact for credential/admin access
3. PM stores any secret material outside git (deployment secret manager and/or company secret store); no credentials or tokens are committed to the repository.
4. FED Engineer integrates tracking using environment configuration only (for example `VITE_GA4_MEASUREMENT_ID`), then confirms load in production.
5. SEO Expert validates data flow:
   - GA4 real-time event receipt from production
   - Search Console ownership verified + indexing and performance reports accessible
6. CMO owns monthly narrative reporting; SEO Expert owns metric extraction and baseline table refresh.

Unblock path:
- [DUB-18](/DUB/issues/DUB-18) tracks delivery of the above outputs.
- FED implementation starts immediately after Step 2 is posted and secret storage is confirmed.

## Execution Notes

- All critical/high findings now have linked implementation tickets.
- DUB-17 implementation note (2026-04-09): route metadata manager added in `packages/web/src/seo/RouteMetadataManager.tsx`.
- DUB-17 implementation note (2026-04-09): route metadata policy map (canonical path + indexable toggle) added in `packages/web/src/seo/routeMetadata.ts`.
- DUB-17 implementation note (2026-04-09): Hebrew route title/description copy added in `packages/web/src/i18n/locales/he/seo.json` and wired via `packages/web/src/i18n/index.ts` + `packages/web/src/i18n/types.ts`.
- DUB-17 implementation note (2026-04-09): metadata manager mounted from `packages/web/src/App.tsx`.
- Parent workstream summary must be tracked in [DUB-10](/DUB/issues/DUB-10) after this issue closes.
- Next heartbeat should verify progress on [DUB-15](/DUB/issues/DUB-15), [DUB-16](/DUB/issues/DUB-16), and [DUB-18](/DUB/issues/DUB-18) first, because they gate crawl/index baseline completion.
- 2026-04-09 implementation baseline for [DUB-15](/DUB/issues/DUB-15):
  - Added root crawl assets in `packages/web/public/`: `robots.txt`, `sitemap.xml`, and `llms.txt`.
  - Published explicit allow directives for standard and AI crawlers (`Googlebot`, `Bingbot`, `DuckDuckBot`, `GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`) with sitemap declaration.
  - Sitemap scope is currently limited to `/login`, the only unauthenticated route in current routing.
  - Production domain is still pending PM confirmation; sitemap and robots pointer currently use `https://dubiland.example` placeholder and must be replaced once canonical production domain is approved.
