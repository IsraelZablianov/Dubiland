# Dubiland Q2 Content Architecture Backlog (Pillar + Cluster)

*Owner: SEO Expert | Reviewers: CMO, PM | Last updated: 2026-04-09*

## Goal

Translate Dubiland's Hebrew keyword strategy into a publishable parent-facing content backlog for Q2 execution and Q3 carry-over, aligned to current route/indexation architecture decisions.

Inputs used:
- `docs/seo/strategy.md`
- `docs/seo/keyword-research.md`
- `docs/architecture/2026-04-09-public-route-indexation-architecture.md`

## Pillar and Cluster Intent Map

### Pillar: Letters (`/letters`)

| Cluster intent | Primary Hebrew keyword | Planned URL | Q2/Q3 | Notes |
|---|---|---|---|---|
| Core letters learning | `לימוד אותיות` | `/letters` | Q2 | Pillar primary keyword target |
| Hebrew letters variant | `לימוד אותיות בעברית` | `/letters` | Q2 | Secondary variation on pillar page |
| Kindergarten readiness | `לימוד אותיות לגן חובה` | `/letters/kindergarten` | Q2 | Parent lifecycle intent |
| First grade prep | `לימוד אותיות לכיתה א` | `/letters/prep-first-grade` | Q2 | High-intent transition page |
| Letter tracing practice | `כתיבת אותיות לילדים` | `/letters/letter-writing` | Q2 | If game route is delayed, publish as guide page first |
| Letter games entry | `משחקי אותיות` | `/games/letters` | Q3 | Route expansion dependency |

### Pillar: Numbers (`/numbers`)

| Cluster intent | Primary Hebrew keyword | Planned URL | Q2/Q3 | Notes |
|---|---|---|---|---|
| Core numbers learning | `לימוד מספרים` | `/numbers` | Q2 | Pillar primary keyword target |
| Parent-friendly math framing | `חשבון לילדים` | `/numbers` | Q2 | Secondary variant on pillar page |
| Math drills | `תרגילי חשבון` | `/numbers/math-practice` | Q2 | High-demand cluster page |
| Number recognition | `זיהוי מספרים לילדים` | `/numbers/number-recognition` | Q2 | New page from gap list |
| Kindergarten addition practice | `תרגילי חיבור לגן` | `/numbers/addition-kindergarten` | Q2 | Child-level practice intent |
| Counting games | `משחקי ספירה לילדים` | `/games/numbers/counting-picnic` | Q3 | Depends on games route indexability |

### Pillar: Reading (`/reading`)

| Cluster intent | Primary Hebrew keyword | Planned URL | Q2/Q3 | Notes |
|---|---|---|---|---|
| Core reading learning | `לימוד קריאה` | `/reading` | Q2 | Pillar primary keyword target |
| Hebrew reading variant | `לימוד קריאה בעברית` | `/reading` | Q2 | Secondary variant on pillar page |
| First grade prep reading | `קריאה לכיתה א` | `/reading/prep-first-grade` | Q2 | High-intent transition page |
| Reading practice | `תרגול קריאה בעברית` | `/reading/practice` | Q2 | Practice cluster page |
| First words milestone | `מילים ראשונות לילדים` | `/reading/first-words` | Q2 | Milestone-driven cluster page |
| Reading difficulty support | `לימוד קריאה לילדים מתקשים` | `/parents/faq/reading-support` | Q3 | FAQ expansion dependency |

## Parent-Intent Support Surfaces

These pages support trust and conversion-adjacent parent intent beyond topic pillars.

| Page type | Primary intent | Planned URL | Primary keyword | Q2/Q3 | Owner dependency |
|---|---|---|---|---|---|
| Parent value hub | Product fit + trust | `/parents` | `אפליקציה חינוכית לילדים` | Q2 | PM (positioning), Content Writer |
| Kindergarten guide | Lifecycle readiness | `/parents/kindergarten-readiness` | `גן חובה` | Q2 | Content Writer, UX Designer |
| First grade guide | Lifecycle readiness | `/parents/first-grade-readiness` | `הכנה לכיתה א` | Q2 | Content Writer, UX Designer |
| Screen-time policy page | Trust + E-E-A-T | `/parents/screen-time` | `זמן מסך לילדים` | Q2 | PM (policy sign-off), Content Writer |
| Parent FAQ hub | Snippets + GEO extraction | `/parents/faq` | Parent question clusters | Q2 | FED Engineer (FAQ modules + schema) |
| Reading support FAQ leaf | Problem-solving intent | `/parents/faq/reading-support` | `לימוד קריאה לילדים מתקשים` | Q3 | Content Writer, FED Engineer |
| Home activities guide | Top-of-funnel discovery | `/parents/home-learning-activities` | `פעילויות לילדים בבית` | Q3 | Content Writer |
| Comparison page | Commercial intent | `/parents/compare-learning-apps` | `אפליקציה חינוכית לילדים` variants | Q3 | PM + CMO approval |
| Trust/legal pages | Safety and transparency | `/privacy`, `/terms` | Brand trust intent | Q2 | PM + Architect/FED |

## Internal Linking Blueprint

### Hub -> Cluster rules

1. Each pillar (`/letters`, `/numbers`, `/reading`) links to at least 4 cluster pages and 1 parent support page.
2. `/parents` links to all lifecycle guides plus one relevant cluster from each learning pillar.
3. Every cluster page links back to its pillar with descriptive Hebrew anchor text.

### Cross-pillar rules

1. Reading and letters pages cross-link on readiness intents (גן חובה, כיתה א).
2. Numbers pages cross-link to parent lifecycle guides where math-prep intent appears.
3. FAQ answers include one contextual link to a pillar and one link to `/parents`.

### Conversion and trust rules

1. Parent-intent pages place trust blocks (privacy, parental guidance, age band) above the fold.
2. All informational pages include a single parent CTA to continue inside Dubiland app flow (no child-private routes in indexable nav).
3. Keep app-private routes (`/home`, `/profiles`, `/parent`) out of crawl-oriented link components.

## Prioritized Execution Backlog

### Q2 Ship (priority order)

| Priority | Backlog item | Output | Dependency |
|---|---|---|---|
| P1 | Publish core pillar trio | `/letters`, `/numbers`, `/reading` with canonical metadata and FAQ-ready sections | Architect + FED (`DUB-16`, `DUB-17`) |
| P1 | Launch parent hub and lifecycle guides | `/parents`, `/parents/kindergarten-readiness`, `/parents/first-grade-readiness` | PM positioning + Content Writer |
| P1 | Ship high-demand math clusters | `/numbers/math-practice`, `/numbers/number-recognition`, `/numbers/addition-kindergarten` | FED route delivery + Content Writer |
| P1 | Ship reading clusters | `/reading/prep-first-grade`, `/reading/practice`, `/reading/first-words` | Content Writer + UX template |
| P1 | Launch parent trust pages | `/parents/screen-time`, `/privacy`, `/terms` | PM policy approval + FED |
| P1 | Implement internal-link modules | Reusable "related pages" blocks across pillars and parent pages | UX Designer + FED component work |
| P2 | Expand FAQ framework | `/parents/faq` with 8-12 Hebrew Q/A entries and FAQ schema | Content Writer + FED (`DUB-24`) |
| P2 | Metadata QA pass | Title/meta/H1/internal-link validation for all Q2 pages | SEO Expert + QA |

### Q3 Carry (planned)

| Priority | Backlog item | Output | Dependency |
|---|---|---|---|
| P2 | Games SEO surface expansion | `/games/letters`, `/games/numbers/*`, `/games/reading` indexable templates | PM + Architect route expansion decision |
| P2 | Additional parent evergreen guides | `/parents/home-learning-activities`, readiness and behavior guides | Content Writer bandwidth |
| P2 | Comparison and alternatives content | `/parents/compare-learning-apps` + trust comparison matrix | CMO + PM legal/product review |
| P3 | Blog long-tail program | `/blog/:slug` support for worksheets and seasonal parent queries | Route architecture + editorial ops |
| P3 | FAQ depth expansion | Problem-specific FAQ leaves (reading struggle, math anxiety, etc.) | Content Writer + schema QA |

## Ownership and Dependency Summary

| Team | Required decision or deliverable |
|---|---|
| PM | Confirm positioning claims, approve lifecycle/trust page scope, align Q2 release sequencing |
| CMO | Approve Q2 priority order and Q3 carry-over boundaries |
| Architect | Confirm route expansion sequencing and indexation policy for new public pages |
| FED Engineer | Implement route surfaces, metadata, and internal-link components per policy |
| UX Designer | Deliver reusable templates for pillar, cluster, and parent guide layouts |
| Content Writer | Produce Hebrew copy and corresponding audio scripts for every page module |
| SEO Expert | Validate keyword mapping, metadata quality, and cannibalization controls pre-launch |

## Acceptance Check (DUB-14)

- Pillar intent mapping coverage:
  - Letters: 6 cluster intents
  - Numbers: 6 cluster intents
  - Reading: 6 cluster intents
- Parent-intent support page backlog defined (FAQ/guides/comparison/trust pages).
- Q2 ship vs Q3 carry backlog split defined.
- Dependencies on PM, UX, and Content Writer are explicit.
