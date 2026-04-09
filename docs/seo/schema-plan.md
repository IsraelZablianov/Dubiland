# Dubiland Schema + GEO Plan (Q2 2026)

*Owner: SEO Expert | Reviewer: CMO | Last updated: 2026-04-10*

## Objective

Ship implementation-ready structured data and GEO extraction standards for Dubiland's parent-facing discovery surfaces, with explicit ownership, validation gates, and engineering handoff links.

## Scope and Dependencies

- Route eligibility and indexation policy must follow [DUB-16](/DUB/issues/DUB-16).
- Canonical and hreflang framework depends on [DUB-17](/DUB/issues/DUB-17).
- Root crawler assets (`robots.txt`, `sitemap.xml`, `llms.txt`) are tracked in [DUB-15](/DUB/issues/DUB-15).
- JSON-LD foundation implementation is tracked in [DUB-24](/DUB/issues/DUB-24).

## Phased Rollout

| Phase | Window | Deliverable | Owner | Status | Validation gate | Linked issue |
|------|--------|-------------|-------|--------|-----------------|--------------|
| Phase 0 | Q2 week 1 | Root crawl assets and initial `llms.txt` baseline | FED Engineer 2 | In progress | `curl` 200 + correct MIME + crawl file accessibility | [DUB-15](/DUB/issues/DUB-15) |
| Phase 1 | Q2 week 2 | Route policy + canonical/noindex readiness for public vs app routes | Architect + FED Engineer | In progress | Route policy matches metadata behavior in browser inspection | [DUB-16](/DUB/issues/DUB-16), [DUB-17](/DUB/issues/DUB-17) |
| Phase 2 | Q2 week 2-3 | P1 JSON-LD foundation: `Organization`, `WebApplication`, `BreadcrumbList`, `FAQPage` | FED Engineer | In progress | Rich Results + Schema Validator pass with no critical errors | [DUB-24](/DUB/issues/DUB-24) |
| Phase 3 | Q2 week 3-4 | P2 schema expansion: `Article/BlogPosting`, `LearningResource/Course`, optional `HowTo` | SEO Expert + FED Engineer | Planned | Syntax valid and page intent alignment confirmed | Follow-up under [DUB-12](/DUB/issues/DUB-12) |

## Schema Rollout Matrix

| Schema Type | Target pages | Priority | Owner | Status | Validation method | Linked engineering task |
|-------------|--------------|----------|-------|--------|-------------------|-------------------------|
| `Organization` | Global parent-facing surface | P1 | FED Engineer | In progress | Schema Validator + page-source JSON-LD check | [DUB-24](/DUB/issues/DUB-24) |
| `WebApplication` | Public product landing surfaces (`/`, topic pillars) | P1 | FED Engineer | In progress | Schema Validator + Rich Results smoke test | [DUB-24](/DUB/issues/DUB-24) |
| `BreadcrumbList` | Hierarchy pages (`/letters`, `/numbers`, `/reading`, `/parents`, `/parents/faq`) | P1 | FED Engineer | In progress | Schema Validator + URL breadcrumb correctness | [DUB-24](/DUB/issues/DUB-24) |
| `FAQPage` | `/parents/faq` and approved FAQ modules only | P1 | FED Engineer + Content Writer | In progress | Rich Results Test + FAQ content accuracy QA | [DUB-24](/DUB/issues/DUB-24) |
| `Article` / `BlogPosting` | Blog pages (`/blog/:slug`) | P2 | FED Engineer | Planned | Rich Results + publish/modified date validation | Follow-up under [DUB-12](/DUB/issues/DUB-12) |
| `LearningResource` / `Course` | Topic pillar and curriculum surfaces | P2 | SEO Expert + FED Engineer | Planned | Schema Validator + educational metadata completeness | Follow-up under [DUB-12](/DUB/issues/DUB-12) |

## JSON-LD Contract (Implementation Requirements)

| Type | Required properties | Route eligibility | Notes |
|------|---------------------|-------------------|-------|
| `Organization` | `@context`, `@type`, `name`, `url`, `logo`, `description`, `inLanguage` | All public indexable pages | Include both `Dubiland` and `דובילנד` identity in brand fields where appropriate. |
| `WebApplication` | `@context`, `@type`, `name`, `applicationCategory`, `operatingSystem`, `description`, `url`, `inLanguage` | Public product pages only | Use canonical absolute URL from `VITE_SITE_URL`; avoid app-private URLs. |
| `BreadcrumbList` | `@context`, `@type`, `itemListElement[]` with ordered `ListItem` entries | Public hierarchy routes only | Each item must include canonical URL and position index. |
| `FAQPage` | `@context`, `@type`, `mainEntity[]` with `Question.name` and `Answer.text` | FAQ route/components only | Answer copy must come from i18n keys, not inline literals in components. |
| P2 types | Type-specific required fields per Schema.org | As approved by route/content launch | Gate P2 rollout by live public route availability and content quality review. |

## Validation Checklist (Definition of Ready/Done)

1. Route gating:
- JSON-LD is emitted only on routes marked `public indexable` by [DUB-16](/DUB/issues/DUB-16).
- Auth/app routes (`/login`, `/home`, `/profiles`, `/parent`) do not emit FAQ or public discovery schema.
2. Syntax and rendering:
- JSON output parses cleanly in browser (`JSON.parse` smoke check).
- `<script type="application/ld+json">` appears once per intended schema block.
3. External validators:
- Google Rich Results Test passes on FAQ-enabled route(s).
- Schema.org Validator returns valid JSON-LD with no critical syntax issues.
4. Canonical/language consistency:
- All schema URLs are absolute canonical URLs.
- Language metadata is Hebrew (`he` or `he-IL`) and consistent with page-level language settings.
5. Regression and QA:
- No hydration/runtime errors introduced by schema emission.
- QA captures before/after evidence links in execution issue comments.

## llms.txt Content Spec (Draft v1 for CMO Review)

Status: `Ready for CMO review`

### Required sections

1. Product identity and short description.
2. Audience and age band (parents/caregivers, ages 3-7).
3. Topic map (letters, numbers, reading, songs/videos/games).
4. Public routes only (no private app routes in recommended citations once [DUB-16](/DUB/issues/DUB-16) pages launch).
5. Trust and safety framing for child learning context.
6. Preferred citation string (`Dubiland`, `דובילנד`, mascot `דובי`).

### Publication requirements for engineering

- File location: `packages/web/public/llms.txt`.
- Response requirements: HTTP 200, `text/plain`, no SPA HTML fallback.
- URL policy: use canonical production host once PM confirms domain (replace `dubiland.example` placeholder).
- Update cadence: refresh on public route launches and quarterly SEO report cycle.
- Change control: SEO Expert drafts, CMO approves, FED Engineer publishes.

### Draft structure template

```text
# Dubiland (דובילנד)
[1-2 sentence product summary]

## Audience
- [Primary audience line]

## Learning topics
- [Topic bullets]

## Public pages
- [Canonical URL list]

## Trust signals
- [Safety and parent-guided statements]

## Preferred citation
- Name: Dubiland (דובילנד)
- Description: [Atomic 1-sentence descriptor]
```

## GEO Content Extraction Templates

### Template A: Answer-first block (40-60 words)

```md
**מה זה דובילנד?**
דובילנד היא פלטפורמת למידה בעברית לילדים בגילאי 3-7, עם משחקים, שירים וסרטונים ללימוד אותיות, מספרים וקריאה. ההורה מוביל את התהליך והילד מתרגל דרך חוויות קצרות ומותאמות גיל.
```

Rules:
- First sentence answers the query directly.
- Keep one clear numeric fact (for example age range).
- Keep block self-contained so AI systems can quote it without extra context.

### Template B: FAQ pair for `FAQPage`

```md
Q: האם דובילנד מתאים לילדי גן?
A: כן. דובילנד מיועדת לילדים בגילאי 3-7 ומחלקת את הפעילויות לפי רמת קושי כדי לתמוך בלמידה מדורגת בבית ובגן.
```

Rules:
- Question phrasing matches parent search intent.
- Answer includes explicit age/benefit language.
- Source text must map to i18n keys and have matching audio assets per project policy.

## Execution Tracking

| Work item | Owner | Status | Link |
|-----------|-------|--------|------|
| Crawl assets + baseline `llms.txt` publication | FED Engineer 2 | In progress | [DUB-15](/DUB/issues/DUB-15) |
| Public route/indexation architecture | Architect | In progress | [DUB-16](/DUB/issues/DUB-16) |
| Canonical/hreflang metadata framework | FED Engineer | In progress | [DUB-17](/DUB/issues/DUB-17) |
| JSON-LD foundation implementation | FED Engineer | In progress | [DUB-24](/DUB/issues/DUB-24) |

### 2026-04-09 Execution Notes ([DUB-45](/DUB/issues/DUB-45))

- Implemented reusable JSON-LD builders and validation checks in `packages/web/src/seo/jsonLd.ts` for:
  - `Organization`
  - `WebApplication`
  - `BreadcrumbList`
  - `FAQPage`
- Wired JSON-LD emission into `packages/web/src/seo/RouteMetadataManager.tsx` with route-policy gating (emit only when route is `public indexable`) and managed `<script type="application/ld+json">` tags in `<head>`.
- Extended route policy and public route coverage in:
  - `packages/web/src/seo/routeMetadata.ts`
  - `packages/web/src/App.tsx`
- Current route coverage:
  - `Organization`: all indexable public routes (`/`, `/about`, `/parents`, `/parents/faq`, `/letters`, `/numbers`, `/reading`)
  - `WebApplication`: `/`, `/letters`, `/numbers`, `/reading`
  - `BreadcrumbList`: `/parents`, `/parents/faq`, `/letters`, `/numbers`, `/reading`
  - `FAQPage`: `/parents/faq` (questions/answers sourced from `public` i18n keys)

### 2026-04-10 Validation Notes ([DUB-50](/DUB/issues/DUB-50))

- Local validation completed against implementation from [DUB-45](/DUB/issues/DUB-45):
  - `yarn typecheck` passed.
  - Route/schema matrix passed for representative public and non-indexable routes (`/`, `/about`, `/parents`, `/parents/faq`, `/letters`, `/numbers`, `/reading`, `/login`, `/profiles`, `/home`, `/parent`, unknown route), with schema artifacts stored under `/tmp/dubiland-schema/`.
  - Schema syntax checks passed using `structured-data-testing-tool` (`Schema.org` checks) on generated route artifacts for `/`, `/letters`, `/parents/faq`.
  - Google structured-data preset checks (Rich Results proxy) passed with 0 warnings/0 failures for `/`, `/letters`, `/parents/faq`.
- Canonical + language contract check passed in implementation:
  - Canonical origin is derived from `VITE_SITE_URL` in `RouteMetadataManager`.
  - `Organization` and `WebApplication` payloads emit `inLanguage: he-IL`.
- External blocker for final URL-based validator run:
  - Official live URL checks (`search.google.com/test/rich-results`, `validator.schema.org`) require a publicly reachable preview URL not currently available in this heartbeat.
  - Follow-up task created: [DUB-66](/DUB/issues/DUB-66) (owner: FED Engineer) to provide public preview URL and route accessibility for final acceptance validation.

### 2026-04-10 FED Route-Coverage Checks ([DUB-24](/DUB/issues/DUB-24))

- Strengthened route-level JSON-LD smoke checks in `packages/web/src/seo/jsonLd.ts`:
  - Added expected schema-set assertions for `landing`, `about`, `letters`, `parentsFaq`, and non-indexable `login`.
  - Added indexability gating to `buildJsonLdScripts` (`indexable=false` or missing canonical path emits no schema).
  - Kept payload-level validation + JSON serialization checks for each emitted script.
- Wired explicit `indexable` input from `packages/web/src/seo/RouteMetadataManager.tsx` into JSON-LD builder options.

## Completion Criteria for DUB-12

- Schema plan and JSON-LD contract approved by CMO.
- `llms.txt` draft reviewed by CMO (or explicit blocker documented in issue comments).
- At least one linked engineering implementation issue exists for schema rollout ([DUB-24](/DUB/issues/DUB-24)).
