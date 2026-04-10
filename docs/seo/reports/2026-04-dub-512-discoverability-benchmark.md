# DUB-512 Discoverability Benchmark Delta (SEO/GEO)

*Owner: SEO Expert | Captured: 2026-04-10 22:55 IDT (19:55 UTC)*

## Scope

Benchmark Dubiland discoverability standards for handbook/game routes against the competitor set requested in [DUB-512](/DUB/issues/DUB-512):

- TinyTap
- Khan Academy Kids
- Lingokids
- HOMER

## Inputs Used

1. Live crawl and metadata probes on competitor and Dubiland public endpoints (`curl`, HTML tag extraction, robots/sitemap checks).
2. Existing Dubiland launch audit baseline from `docs/seo/reports/2026-04-live-site-launch-seo-audit.md`.
3. Active SEO execution lanes:
   - [DUB-419](/DUB/issues/DUB-419)
   - [DUB-427](/DUB/issues/DUB-427)
   - [DUB-428](/DUB/issues/DUB-428)
   - [DUB-429](/DUB/issues/DUB-429)
   - [DUB-430](/DUB/issues/DUB-430)
   - [DUB-431](/DUB/issues/DUB-431)
   - [DUB-50](/DUB/issues/DUB-50)
   - [DUB-42](/DUB/issues/DUB-42)

## Competitive Discoverability Snapshot

| Product | Crawl/index signals | Metadata quality | Schema signal | Content depth signal |
|---|---|---|---|---|
| TinyTap | `robots.txt` and sitemap index are live; large crawl surface (73 sitemap index entries + multi-lang sitemap with 3777 URLs in sampled file). | Has title + long description + OG image. Canonical/`og:url` absent in sampled HTML. | No JSON-LD detected in sampled homepage HTML. | Very high scale via large sitemap footprint. |
| Khan Academy Kids | Bot-facing requests in this runtime return a client challenge page (`title: Client Challenge`) including `/kids` and `/robots.txt`. | Not measurable in this runtime due challenge gate. | Not measurable in this runtime due challenge gate. | Not measurable in this runtime due challenge gate. |
| Lingokids | `robots.txt` and sitemap index are live (16 sitemap index entries in sampled file). | Strong baseline: canonical, `og:url`, `og:image`, robots meta, hreflang present. | JSON-LD present (Organization/WebSite/BreadcrumbList stack observed in sampled HTML). | Scaled structured content with many sitemap segments. |
| HOMER | Homepage crawlable, but `/robots.txt` and `/sitemap.xml` return 404 in sampled probes. | Strong homepage metadata (canonical + OG set). | JSON-LD present (Organization/WebSite/ItemList observed). | Parent resource links present in schema item list; crawl-file inconsistency is a risk. |
| Dubiland (current launch baseline) | Root route returns 200; key handbook routes (`/letters`, `/numbers`, `/reading`, `/parents`, `/parents/faq`) still 404 to non-JS probes per launch audit. | RTL/lang baseline is correct (`lang=he`, `dir=rtl`), but canonical + `og:url` + `og:image` are incomplete/misaligned in live deployment. | JSON-LD foundation exists in codebase and local validation lanes, but official URL validator closeout remains blocked in [DUB-50](/DUB/issues/DUB-50). | Sitemap currently lists 8 URLs but points to unresolved host (`https://dubiland.co.il`). |

## Discoverability Delta for Dubiland Handbook/Game Routes

### Critical

1. **Crawlability parity gap (non-JS route access)**
- Competitor expectation: indexable learning pages return direct `HTTP 200` to crawler probes.
- Dubiland delta: handbook and parent routes still return `404` to non-JS probes in live launch baseline.
- Acceptance checks:
  - `curl -I` returns `200` for `/letters`, `/numbers`, `/reading`, `/parents`, `/parents/faq`, and approved `/games/*` routes.
  - Responses are HTML content routes, not SPA redirect stubs.
- Active lanes: [DUB-427](/DUB/issues/DUB-427), tracked from [DUB-419](/DUB/issues/DUB-419).

2. **Canonical host/path consistency gap**
- Competitor expectation: canonical and OG URLs resolve to exact deployed paths.
- Dubiland delta: canonical/hreflang path mismatch on base-path deployment and missing `og:url`/`og:image`.
- Acceptance checks:
  - For every indexable handbook/game route, `canonical`, `hreflang=he`, and `og:url` exactly match deployed URL.
  - `og:image` is absolute and fetchable (`HTTP 200`).
- Active lanes: [DUB-428](/DUB/issues/DUB-428), [DUB-42](/DUB/issues/DUB-42).

### High

3. **Schema production-proof gap**
- Competitor expectation: machine-readable entity and navigation schema on discoverability surfaces.
- Dubiland delta: implementation exists, but official URL validator proof remains blocked by unstable validation runtime conditions.
- Acceptance checks:
  - Handbook routes emit `Organization` + `WebApplication` + `BreadcrumbList`.
  - Parent FAQ route emits valid `FAQPage`.
  - Official URL-based validator artifacts posted for `/`, `/letters`, `/parents/faq`.
- Active lanes: [DUB-50](/DUB/issues/DUB-50), [DUB-42](/DUB/issues/DUB-42), base implementation [DUB-24](/DUB/issues/DUB-24).

4. **Crawl asset trust gap (`robots`/`sitemap`/`llms`)**
- Competitor expectation: crawl files resolve and reference live canonical host.
- Dubiland delta: AI bot allow-list exists, but sitemap host is unresolved (`dubiland.co.il`) for current live deployment.
- Acceptance checks:
  - `/robots.txt` + `/sitemap.xml` + `/llms.txt` all serve `HTTP 200` with same canonical host.
  - Sitemap entries for all indexable handbook and approved game routes.
  - AI crawler directives remain explicit (`GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`).
- Active lanes: [DUB-429](/DUB/issues/DUB-429), [DUB-419](/DUB/issues/DUB-419).

### Medium

5. **Content depth and internal-link density gap**
- Competitor expectation: deep indexable route inventories and clear hub-to-detail linking.
- Dubiland delta: currently shallow public route footprint and limited indexable depth for game discoverability.
- Acceptance checks:
  - Each handbook pillar links to at least 3 relevant child learning pages/game entries.
  - Each game page links back to pillar + at least 2 related games.
  - Sitemap expands beyond baseline 8 URL entries to include approved handbook/game clusters.
- Active lanes: [DUB-431](/DUB/issues/DUB-431) (content), plus architecture rollout lanes from [DUB-16](/DUB/issues/DUB-16).

## Top 3 Next Bets (for DUB-512 scorecard)

1. **Fix direct crawlability and canonical correctness on handbook routes first**  
Reason: highest leverage on indexation and all downstream SEO/GEO metrics.  
Dependencies: [DUB-427](/DUB/issues/DUB-427), [DUB-428](/DUB/issues/DUB-428), [DUB-429](/DUB/issues/DUB-429).

2. **Close official schema validator evidence lane and finalize SEO acceptance**  
Reason: converts local schema readiness into production trust signal for search and AI extraction.  
Dependencies: [DUB-50](/DUB/issues/DUB-50), [DUB-42](/DUB/issues/DUB-42).

3. **Expand handbook -> game internal linking + parent-intent content depth**  
Reason: needed to match competitor discoverability breadth and long-tail coverage.  
Dependencies: [DUB-431](/DUB/issues/DUB-431), [DUB-16](/DUB/issues/DUB-16).

## Confidence

- **Overall confidence: Medium.**
- **High confidence** on Dubiland gap findings tied to existing launch audit and live route probes.
- **Medium confidence** on competitor comparison due mixed runtime constraints:
  - Khan Academy Kids is challenge-gated from this runtime.
  - HOMER crawl-file endpoints (`robots`/`sitemap`) returned 404 in sampled probes and may use alternate endpoint conventions.
