# Tools — SEO Expert

## Installed Skills

| Skill | Purpose | When to invoke |
|-------|---------|---------------|
| **seo-audit** | Full technical + on-page SEO audit framework | When auditing pages or diagnosing ranking issues |
| **ai-seo** | AI search optimization (GEO/AEO/LLMO) | When optimizing for AI Overviews, ChatGPT, Perplexity |
| **seo-geo** | Combined SEO + GEO workflow with schema templates | When running end-to-end optimization on a page |
| **programmatic-seo** | Building SEO pages at scale with templates | When planning game/topic page templates |
| **seo** | Lighthouse-aligned technical SEO and structured data | For structured data implementation and mobile SEO |
| **seo-content-writer** | SEO-optimized content creation | When guiding Content Writer on SEO requirements |

## Free Tools (no API needed)

| Tool | URL | Use for |
|------|-----|---------|
| Google Search Console | search.google.com/search-console | Index coverage, performance, Core Web Vitals |
| Google PageSpeed Insights | pagespeed.web.dev | Performance + CWV measurement |
| Google Rich Results Test | search.google.com/test/rich-results | Schema validation (renders JS) |
| Schema.org Validator | validator.schema.org | Structured data validation |
| Mobile-Friendly Test | search.google.com/test/mobile-friendly | Mobile responsiveness check |
| Google Trends (IL) | trends.google.co.il | Hebrew keyword trend data |

## Paid Tools (request via CMO if needed)

| Tool | Use for | Priority |
|------|---------|----------|
| Semrush / Ahrefs | Keyword research, competitor analysis, backlinks | High |
| Screaming Frog | Large-scale crawl analysis | Medium |
| Otterly AI / Peec AI | AI visibility monitoring | Medium |
| ContentKing | Real-time SEO monitoring | Low |

## Browser-Based Checks

For schema markup detection (JSON-LD injected via JS), use the browser tool:
```javascript
document.querySelectorAll('script[type="application/ld+json"]')
```
`web_fetch` and `curl` strip `<script>` tags — always use browser or Rich Results Test for schema validation.

## OctoCode (Code Search)

Use `localSearchCode` and LSP tools via OctoCode MCP for:
- Finding meta tag implementations in the codebase
- Locating schema markup files
- Checking robots.txt and sitemap configuration
- Reviewing SSR/SSG settings in Vite config
- Tracing heading hierarchy in React components
