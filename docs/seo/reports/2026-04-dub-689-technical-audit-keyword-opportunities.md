# DUB-689 SEO Improvements — Technical Audit + New Keyword Opportunities

*Owner: SEO Expert | Reviewer: CMO | Captured: 2026-04-11 14:40 IDT (11:40 UTC)*

## Scope

- Live surface audited: `https://israelzablianov.github.io/Dubiland/`
- Focus: crawlability, metadata/indexation, schema/GEO extractability, Core Web Vitals, and Hebrew keyword expansion for new game topics.
- Methods:
  - `curl` route + header probes
  - Playwright rendered metadata/schema checks
  - Lighthouse CLI (desktop + mobile)
  - Content extractability checks (answer-block length)
  - Hebrew keyword opportunity pull using Google Suggest + Bing SERP-size proxy

## Executive Summary

- Crawl asset and route availability blockers from prior launch audit are resolved (`200` for public routes, valid `robots.txt`/`sitemap.xml`/`llms.txt`).
- Three new high-priority technical gaps remain:
  1. Non-JS HTML parity is weak: all indexable routes return identical static HTML, so route-specific metadata is not available without JS rendering.
  2. Static `index.html` still ships a hardcoded `WebApplication` schema with `https://dubiland.co.il`, creating schema duplication and stale canonical identity.
  3. Mobile LCP remains above target (`3.46s-3.61s` vs target `<2.5s`) on sampled public routes.
- New Hebrew keyword opportunities were identified for color/shape/phonics/reading-comprehension game clusters with measurable demand proxies.

## Technical Findings (Prioritized)

| ID | Severity | Finding | Evidence | Implementation spec for FED/Perf |
|----|----------|---------|----------|-----------------------------------|
| D689-001 | High | **Static HTML parity gap for non-JS crawlers.** Public routes are reachable, but non-JS HTML is identical and generic across routes. | `/about`, `/letters`, `/numbers`, `/parents/faq` all return identical 3714-byte HTML and same SHA-256 hash (`35b746...a2b3`). Generic title in raw HTML: `דובילנד — לומדים עברית בכיף`. | 1) Replace current route HTML cloning with route-specific prerendered head tags per public route. 2) Ensure each static route file includes route-level `title`, `meta description`, canonical, `hreflang`, and robots tag. 3) Add CI check: fail if public route static heads are identical. |
| D689-002 | High | **Stale + duplicate schema emission.** Static HTML includes hardcoded `WebApplication` schema on `https://dubiland.co.il` while runtime injects route schema, producing duplicates. | `packages/web/index.html` includes static JSON-LD with `url: https://dubiland.co.il`; rendered routes show duplicate `WebApplication` types (example `/`: `WebApplication`, `Organization`, `WebApplication`). | 1) Remove hardcoded JSON-LD block from `index.html`. 2) Emit schema from one source only (route metadata layer/prerender pipeline). 3) Add schema smoke test asserting no duplicate `@type` per route unless explicitly allowed. |
| D689-003 | High | **Mobile LCP above target.** | Lighthouse mobile (`2026-04-11`): `/` `3458ms`, `/letters` `3611ms`, `/parents` `3460ms`, `/parents/faq` `3458ms`. | 1) Identify LCP element per route and preload highest-impact hero asset. 2) Delay non-critical JS on public routes (especially auth/app-only bundles). 3) Re-run Lighthouse mobile and keep gate `<2500ms` for all public indexables. |
| D689-004 | Medium | **GEO extractability depth is low on key pages.** Current answer blocks are too short for stable AI citation snippets. | First-paragraph samples: `/letters` 5 words, `/numbers` 5 words, `/reading` 5 words; FAQ JSON-LD answers are 7-14 words each (target 40-60 word atomic answers). | 1) Add answer-first 40-60 word block under H1 for each indexable public route. 2) Expand FAQ answers to citation-ready length with one concrete fact per answer. 3) Keep answers self-contained for model extraction. |

## What Passed (No Action Needed)

- Public SEO routes return direct `200` (`/about`, `/letters`, `/numbers`, `/reading`, `/parents`, `/parents/faq`, `/terms`, `/privacy`).
- Crawl assets are live and correctly typed:
  - `/robots.txt` `200 text/plain`
  - `/sitemap.xml` `200 application/xml`
  - `/llms.txt` `200 text/plain`
- Robots policy explicitly allows key AI crawlers (`GPTBot`, `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`, `anthropic-ai`, `Google-Extended`).
- Rendered route metadata is route-specific (title/description/canonical/hreflang/og fields present).

## Core Web Vitals Snapshot (Lighthouse)

### Mobile profile (`--only-categories=performance,seo`, 2026-04-11)

| Route | Perf | SEO | LCP | CLS |
|------|------|-----|-----|-----|
| `/` | 82 | 100 | 3.46s | 0.0329 |
| `/letters` | 82 | 100 | 3.61s | ~0.0000 |
| `/parents` | 82 | 100 | 3.46s | 0.0126 |
| `/parents/faq` | 82 | 100 | 3.46s | 0.0030 |

### Desktop profile (`--preset=desktop`, 2026-04-11)

| Route | Perf | SEO | LCP |
|------|------|-----|-----|
| `/` | 97 | 100 | 1.0s |
| `/letters` | 97 | 100 | 1.0s |
| `/parents` | 97 | 100 | 1.0s |
| `/parents/faq` | 97 | 100 | 1.0s |

## Hebrew Keyword Opportunities — New Game Topics

### Data method used in this heartbeat

- **Demand proxy A:** Google Suggest expansion count (Hebrew locale, exact query seed).
- **Demand/competition proxy B:** Bing SERP-size (`sb_count`) per query.
- Capture date: **2026-04-11**.
- Note: Google Trends API returned `429` in this runtime, so this list is a proxy-validated opportunity set and should be finalized with monthly-volume tooling once available.

### Opportunity table

| Priority | Keyword (Hebrew) | Bing SERP-size | Google Suggest signals | Suggested URL target | Topic cluster |
|----------|-------------------|----------------|------------------------|----------------------|---------------|
| P1 | `לימוד צבעים לילדים` | 33,700 | 8 suggestions | `/games/colors/color-garden` | Colors |
| P1 | `לימוד צורות לילדים` | 112,000 | 1 suggestion | `/games/numbers/shape-safari` (or `/games/shapes`) | Shapes |
| P1 | `הבנת הנקרא לכיתה א` | 84,000 | 8 suggestions | `/reading/reading-comprehension-grade-1` | Reading comprehension |
| P1 | `משחקי חריזה לילדים` | 162,000 | 1 suggestion | `/games/reading/rhyme-games` | Phonological awareness |
| P1 | `השוואת כמויות לילדים` | 10,800 | 0 suggestions | `/games/numbers/more-or-less-market` | Numeracy comparison |
| P2 | `קריאה מנוקדת לילדים` | 1,140,000 | 0 suggestions | `/reading/nikud-reading` | Nikud reading |
| P2 | `לימוד שורשים בעברית` | 3,010 | 1 suggestion | `/games/reading/root-family-stickers` | Hebrew morphology |
| P2 | `אותיות סופיות לילדים` | 55 | 1 suggestion | `/games/letters/final-forms` | Final letters |

### Keyword execution guidance (for Content Writer + FED)

1. One primary keyword per new page; keep related variants as secondary H2/body phrases.
2. Add an answer-first intro paragraph (40-60 words) under each H1.
3. Include one FAQ block for each page and map it to `FAQPage` schema when page is indexable.
4. Add internal links from `/letters`, `/numbers`, `/reading`, `/parents` to each new topic page.

## Recommended Execution Tickets From This Audit

1. FED: fix static non-JS metadata parity + remove stale static schema block.
2. Performance Expert: reduce public-route mobile LCP below `2.5s`.
3. Content Writer + FED: ship first 3 P1 game-topic keyword pages with answer-first blocks + FAQ schema.

