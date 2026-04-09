# 2026-04-09 — Public Route Indexation Architecture and Canonical Policy

- Owner: Architect
- Related issues: [DUB-16](/DUB/issues/DUB-16), [DUB-11](/DUB/issues/DUB-11), [DUB-17](/DUB/issues/DUB-17)
- Scope: `packages/web/` route/indexation architecture for SEO + GEO readiness

## Decision Summary

1. Split routes into two classes:
- `public indexable` pages for parent-intent discovery.
- `app/auth` pages for signed-in usage and child flows.

2. App/auth routes are always `noindex`.

3. Public parent-facing pages are indexable and canonicalized to a single production host.

4. Rendering strategy in current Vite stack:
- Keep app routes as CSR SPA.
- Add build-time prerender (SSG-like) for public indexable routes.

## Route Inventory and Indexation Policy

| Route pattern | Route class | Current/target | Indexation decision | Canonical | Notes |
|---|---|---|---|---|---|
| `/login` | auth utility | current | `noindex,nofollow` | self-canonical | Auth entry only; never in sitemap. |
| `/profiles` | app private | current | `noindex,nofollow` | self-canonical | Child profile selector; never in sitemap. |
| `/home` | app private | current | `noindex,nofollow` | self-canonical | Learning shell route; never in sitemap. |
| `/parent` | app private | current | `noindex,nofollow` | self-canonical | Parent dashboard; never in sitemap. |
| `/` | public indexable | target | `index,follow` | canonical root URL | Replace current redirect-to-`/home` with public parent landing page. |
| `/letters` | public indexable | target | `index,follow` | absolute canonical | Topic pillar page (Hebrew letters learning intent). |
| `/numbers` | public indexable | target | `index,follow` | absolute canonical | Topic pillar page (math/number learning intent). |
| `/reading` | public indexable | target | `index,follow` | absolute canonical | Topic pillar page (reading intent). |
| `/parents` | public indexable | target | `index,follow` | absolute canonical | Parent intent hub (trust/safety/value). |
| `/parents/faq` | public indexable | target | `index,follow` | absolute canonical | FAQ page for snippet/AI extraction readiness. |
| `/blog/:slug` | public indexable | future | `index,follow` | absolute canonical | Index only after content quality + schema baseline are in place. |
| `/privacy` | trust/legal | future | `index,follow` | absolute canonical | Keep indexable for trust and compliance transparency. |
| `/terms` | trust/legal | future | `index,follow` | absolute canonical | Keep indexable for trust and compliance transparency. |
| `*` | fallback | target | `noindex,nofollow` | none | Serve a real 404 page (no redirect to app routes). |

## Canonical and Noindex Rules

1. Define one canonical origin in env: `VITE_SITE_URL` (example: `https://www.dubiland.example`).
2. Canonical URL format:
- absolute URL
- lowercase path
- no tracking query params (`utm_*`, `gclid`, `fbclid`) in canonical
- no trailing slash except `/`
3. Public pages: `<meta name="robots" content="index,follow">` + canonical tag.
4. App/auth pages: `<meta name="robots" content="noindex,nofollow">` + self canonical.
5. Routes not explicitly listed in policy default to `noindex,nofollow`.

## Robots and Sitemap Policy

1. `sitemap.xml` contains only routes marked `public indexable`.
2. `robots.txt` must disallow app/auth surfaces:
- `Disallow: /home`
- `Disallow: /profiles`
- `Disallow: /parent`
- `Disallow: /login`
3. Keep explicit allow for public routes and include sitemap pointer.
4. `llms.txt` should reference public parent-facing routes only.

## Rendering Strategy Recommendation (Vite)

### Chosen approach (Q2)
Hybrid CSR + prerender:
- Keep existing React Router app runtime for authenticated surfaces.
- Prerender public route set at build time to static HTML (SSG-like) so crawlers get complete HTML and metadata without client execution.

### Why this choice
- Lowest migration risk with current Vite + React stack.
- Delivers crawlable HTML for parent-facing SEO pages quickly.
- Avoids immediate full-framework migration for app routes.

### When to revisit
If public content grows into large, frequently changing dynamic collections (e.g. many blog pages), evaluate moving public web to a dedicated SSR/ISR surface (Vike/Next/Astro), while keeping app routes isolated.

## FED Handoff Requirements

1. Introduce a single route policy manifest (route -> indexation/canonical class).
2. Implement public pages for `/`, `/letters`, `/numbers`, `/reading`, `/parents`, `/parents/faq`.
3. Replace root redirect (`/ -> /home`) with public landing route.
4. Add real 404 page for unknown routes (no wildcard redirect to app shell).
5. Ensure every public text string is in i18n and has matching audio assets (project rule).
6. Wire route policy into metadata system from [DUB-17](/DUB/issues/DUB-17).
7. Update sitemap source list to use only `public indexable` routes.

## QA Handoff Requirements

1. Verify robots + canonical + noindex behavior on all current app routes.
2. Verify public routes render indexable metadata and are included in sitemap.
3. Validate 404 behavior does not redirect to app routes.
4. Re-run Lighthouse SEO checks on `/`, `/letters`, `/numbers`, `/reading`, `/parents`, `/parents/faq`.

## Security and Child Data Constraints

- Do not expose child-specific identifiers or progress data on any indexable URL.
- Keep all child learning state behind authenticated app routes (`/home`, `/profiles`, `/parent`).
- Public pages must be parent-focused informational surfaces only.
