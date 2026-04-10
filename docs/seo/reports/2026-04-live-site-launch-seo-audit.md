# Dubiland Live-Site SEO Audit — Launch Check

*Owner: SEO Expert | Reviewer: CMO | Captured: 2026-04-10 18:54 IDT (15:54 UTC)*

## Scope

- Live URL audited: `https://israelzablianov.github.io/Dubiland/`
- Focus areas: crawlability, indexation, metadata, structured data signals, GEO readiness, and Core Web Vitals.
- Methods used:
  - HTTP probe (`curl`) for non-JS crawler behavior.
  - Headless browser probe (`puppeteer`) for rendered metadata.
  - Lighthouse CLI mobile/desktop runs on live URLs.

## Executive Summary

Launch SEO has immediate blockers on crawl/index reliability for public routes:

1. Public routes return `404` to non-JS requests (critical).
2. Canonical/hreflang URLs are path-incorrect for base-path deployment (high).
3. `robots.txt`/`sitemap.xml` point to unresolved `https://dubiland.co.il` (high).

Without these fixes, discoverability and indexation will lag even if on-page copy and schema are present.

## Prioritized Findings

| ID | Severity | Finding | Evidence | Owner | Linked issue |
|----|----------|---------|----------|-------|--------------|
| LIVE-001 | Critical | Indexable public routes return `404` for non-JS probes. | `curl -I` status checks show `404` for `/about`, `/letters`, `/numbers`, `/reading`, `/parents`, `/parents/faq`, `/terms`, `/privacy`, `/login`. | FED Engineer | [DUB-427](/DUB/issues/DUB-427) |
| LIVE-002 | High | Canonical + hreflang URLs point to wrong path (missing `/Dubiland`). | Example rendered on `/Dubiland/letters`: canonical/hreflang `https://israelzablianov.github.io/letters` instead of `/Dubiland/letters`. | FED Engineer 2 | [DUB-428](/DUB/issues/DUB-428) |
| LIVE-003 | High | Crawl assets point to unresolved production host. | `robots.txt` sitemap pointer and all sitemap `loc` entries use `https://dubiland.co.il/*`; DNS unresolved in audit runtime. | FED Engineer 2 | [DUB-429](/DUB/issues/DUB-429) |
| LIVE-004 | High | Mobile LCP misses target `<2.5s` on live public pages. | Lighthouse mobile: `/` 3.39s, `/letters` 3.56s, `/parents` 3.48s. | Performance Expert | [DUB-430](/DUB/issues/DUB-430) |
| LIVE-005 | High | OG metadata is incomplete for social/AI link previews. | `og:url` and `og:image` absent across sampled routes; OG title/description remains generic on all pages. | FED Engineer 2 | [DUB-428](/DUB/issues/DUB-428) |
| LIVE-006 | Medium | GEO context files and bot directives need refresh. | `llms.txt` route section still reflects auth-first baseline; robots bot list missing explicit `ChatGPT-User` and `anthropic-ai`. | FED Engineer 2 | [DUB-429](/DUB/issues/DUB-429) |
| LIVE-007 | Medium | Parent-intent top pages not yet drafted despite high Hebrew demand signals. | Keyword queue identifies high-demand parent lifecycle intents not yet drafted for publication. | Content Writer | [DUB-431](/DUB/issues/DUB-431) |

## Crawlability Evidence (HTTP Status)

| Route | `curl -I` status |
|-------|------------------|
| `/` | 200 |
| `/about` | 404 |
| `/letters` | 404 |
| `/numbers` | 404 |
| `/reading` | 404 |
| `/parents` | 404 |
| `/parents/faq` | 404 |
| `/terms` | 404 |
| `/privacy` | 404 |
| `/login` | 404 |

## Metadata Snapshot (Rendered)

Sampled rendered routes have route-specific `title`/`meta description` and a single `H1`, but canonical and hreflang are path-incorrect for the current live host.

Example (`/Dubiland/letters`):

- title: `אותיות בעברית לילדים | דובילנד`
- canonical: `https://israelzablianov.github.io/letters` (incorrect for current deployment path)
- hreflang he: `https://israelzablianov.github.io/letters` (same issue)
- og:url: missing
- og:image: missing

## Core Web Vitals Snapshot (Measured)

| Route | Lighthouse mobile performance | SEO score | LCP | CLS | INP |
|------|-------------------------------|-----------|-----|-----|-----|
| `/` | 86 | 91 | 3.39s | 0.015 | Lab N/A |
| `/letters` | 81 | 100 | 3.56s | 0.00004 | Lab N/A |
| `/parents` | 82 | 100 | 3.48s | 0.00004 | Lab N/A |

Notes:
- Lab INP is not provided in these runs without interaction traces.
- Performance diagnostics flagged unused JS on public pages, including `supabase` chunk overhead.

## Hebrew Keyword Rollout Priority (Execution Start)

Based on existing `docs/seo/keyword-research.md` demand signals, first parent-intent pages to ship:

1. `גן חובה` -> `/parents/kindergarten-readiness` (GT-IL score 408.79)
2. `הכנה לכיתה א` -> `/parents/first-grade-readiness` (GT-IL score 203.44)
3. `זמן מסך לילדים` -> `/parents/screen-time` (trust intent; GEO-friendly FAQ content)

Execution ownership: [DUB-431](/DUB/issues/DUB-431).

## Validation Constraints

- Google PageSpeed API returned quota exhaustion (`HTTP 429`) in this runtime; Lighthouse CLI used instead.
- URL-based Schema.org/Google validator endpoints are intermittently anti-abuse gated in this runtime, so structured data pass relied on rendered page checks + Lighthouse `structured-data` audit for this heartbeat.
- Manual Rich Results Test validation should be rerun after [DUB-427](/DUB/issues/DUB-427) and [DUB-429](/DUB/issues/DUB-429) are completed.

## Created Execution Tasks

- [DUB-427](/DUB/issues/DUB-427) — direct `HTTP 200` for indexable public routes (critical)
- [DUB-428](/DUB/issues/DUB-428) — canonical/hreflang + OG URL/image correction
- [DUB-429](/DUB/issues/DUB-429) — robots/sitemap/llms host + crawler policy alignment
- [DUB-430](/DUB/issues/DUB-430) — public-route mobile LCP optimization
- [DUB-431](/DUB/issues/DUB-431) — Hebrew parent-intent content drafts

