# DUB-743 — Metadata Sidecar Split (Step 2) Verification

## Scope
- Moved `RouteMetadataManager` mount from root `App.tsx` to public-route sidecar flow.
- Deferred metadata sidecar mount until after first public route commit.

## Artifact Paths
- Pre baseline: `docs/agents/fed-engineer-2/evidence/dub-743/20260411-185547-pre`
- Post implementation: `docs/agents/fed-engineer-2/evidence/dub-743/20260411-185746-post`

## Bundle Delta (pre -> post)

| Metric | Pre | Post | Delta |
|---|---:|---:|---:|
| `index` raw bytes | 206,558 | 206,317 | -241 |
| `index` gzip bytes | 66,029 | 65,956 | -73 |
| `react` raw bytes | 49,001 | 49,001 | 0 |
| `react` gzip bytes | 17,070 | 17,070 | 0 |
| `i18n` raw bytes | 49,391 | 49,391 | 0 |
| `i18n` gzip bytes | 15,333 | 15,333 | 0 |
| Total JS raw bytes | 1,936,076 | 1,936,134 | +58 |

Source files:
- `bundle-results.json` (pre/post)

## Lighthouse Delta (pre -> post)

| Route | Perf pre -> post | LCP ms pre -> post | LCP delta |
|---|---:|---:|---:|
| `/` | 94 -> 94 | 2623.538 -> 2686.586 | +63.048 |
| `/letters` | 94 -> 96 | 2763.146 -> 2576.706 | -186.440 |
| `/parents` | 94 -> 95 | 2610.157 -> 2610.207 | +0.050 |

Step-2 budget targets from architecture:
- `/ <= 3050ms`, `/letters <= 2800ms`, `/parents <= 2750ms`

Post results: all three routes remain within Step-2 LCP targets.

Source files:
- `lighthouse-results.json` (pre/post)
- `lighthouse-raw/*.json` (pre/post)

## SEO Metadata Smoke (required public routes)

Checked routes:
- `/`, `/letters`, `/numbers`, `/reading`, `/about`, `/parents`, `/parents/faq`, `/terms`, `/privacy`

Checks per route:
- `meta[name="robots"] === "index,follow"`
- canonical URL path matches route path
- `meta[property="og:url"]` path matches route path
- JSON-LD script(s) present and valid JSON

Result: pass on all 9 routes.

Source file:
- `metadata-smoke.json`

## Commands Run

```bash
yarn typecheck
NODE_ENV=production yarn workspace @dubiland/web vite build --mode production
node packages/web/scripts/check-ci-bundle-budgets.mjs --output <bundle-results.json>
node packages/web/scripts/run-ci-lighthouse-gate.mjs --base-url http://127.0.0.1:4173 --output <lighthouse-results.json> --reports-dir <lighthouse-raw>
# plus Puppeteer route-metadata smoke script (outputs metadata-smoke.json)
```
