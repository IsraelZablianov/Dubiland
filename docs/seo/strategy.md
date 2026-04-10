# Dubiland SEO Strategy

*Owned by: CMO + SEO Expert | Last updated: 2026-04-10*

## Vision

Make Dubiland the top trusted Hebrew destination for parents searching educational screen-time solutions for ages 3-7, and a consistently cited source in AI-generated answers.

## Q2 2026 Outcome Targets

1. Technical SEO baseline completed and all critical blockers fixed.
2. Structured data and GEO foundation live on core parent-facing surfaces.
3. Hebrew keyword map (50 terms) tied to concrete page targets and content backlog.
4. Parent-intent content architecture approved and ready for implementation.
5. AI visibility baseline documented for monthly tracking.

## Operating Model

### Strategy lane (CMO)
- Define prioritization, sequencing, and success metrics.
- Approve deliverables from SEO Expert and escalate cross-team dependencies.
- Report progress and risks to PM.

### Execution lane (SEO Expert)
- Run audits, produce implementation specs, validate SEO/GEO outputs.
- Coordinate code-change requests through Architect/FED path when implementation is required.
- Keep `docs/seo/` operational docs current.

## Workstreams and Deliverables

### 1) Technical SEO Foundation
**Owner:** SEO Expert  
**Dependencies:** Architect, FED Engineer, Performance Expert  
**Deliverables:**
- `docs/seo/technical-audit.md` with prioritized findings (`critical/high/medium/low`).
- Robots policy draft (including GPTBot, PerplexityBot, ClaudeBot, Google-Extended rules).
- Sitemap scope and canonical URL rules.
- Core Web Vitals baseline for key app routes (`/home`, `/parent`, `/profiles`) and key public routes (`/`, `/letters`, `/numbers`, `/reading`, `/parents`).
**Acceptance criteria:**
- All critical crawl/index blockers have implementation tickets.
- Mobile targets tracked: LCP < 2.5s, CLS < 0.1.

### 2) Schema Markup + GEO Foundation
**Owner:** SEO Expert  
**Dependencies:** Architect, FED Engineer  
**Deliverables:**
- `docs/seo/schema-plan.md` covering Organization, WebApplication, BreadcrumbList, FAQPage rollout.
- GEO extraction guidelines (answer-first blocks, FAQ block pattern, citation-ready formatting).
- `llms.txt` draft content spec for root-level publication.
**Acceptance criteria:**
- Base schema spec validated in Rich Results Test before implementation close.
- GEO content template approved for parent-facing pages.

### 3) Hebrew Keyword Research + Mapping
**Owner:** SEO Expert  
**Dependencies:** Content Writer, CMO review  
**Deliverables:**
- `docs/seo/keyword-research.md` with top 50 Hebrew terms, intent, priority, and target URL mapping.
- Segment coverage across: brand, games, letters, numbers, reading, parent-intent.
- Cannibalization and gap notes.
**Acceptance criteria:**
- 50 terms mapped to either existing route or planned content page.
- Priority tiers defined: P1 (ship in Q2), P2 (Q3 pipeline).

### 4) Content Architecture (Pillar + Cluster)
**Owner:** CMO (strategy), SEO Expert (SEO constraints)  
**Dependencies:** PM, Content Writer, UX Designer  
**Deliverables:**
- `docs/seo/content-architecture-backlog.md` with Q2 ship list and Q3 carry-over.
- Topic hub architecture for math, letters, reading.
- Parent education cluster plan (FAQ, guidance, screen-time quality pages).
- Metadata and internal-linking rules for new content pages.
**Acceptance criteria:**
- Each pillar has at least 5 mapped cluster intents.
- Content backlog aligns with keyword priorities and PM roadmap.

### 5) Measurement + Reporting Cadence
**Owner:** CMO + SEO Expert  
**Dependencies:** PM visibility  
**Deliverables:**
- Q2 KPI dashboard definition (Search Console + GA4 + AI visibility sampling).
- Weekly execution snapshot in issue updates; monthly report in `docs/seo/reports/`.
**Acceptance criteria:**
- Baseline values captured for all Q2 KPIs.
- PM receives monthly narrative: wins, blockers, next actions.

## Q2 2026 Milestones

| Window | Milestone | Exit Condition |
|--------|-----------|----------------|
| Apr 9-Apr 20 | Baseline and audit phase | Technical audit + keyword research draft complete |
| Apr 21-May 12 | Implementation planning phase | Schema/GEO specs approved, code tasks queued through Architect |
| May 13-Jun 9 | Execution phase | Critical SEO fixes shipped, initial content clusters published/ready |
| Jun 10-Jun 30 | Stabilization and reporting phase | KPI baseline validated, Q3 carry-over priorities documented |

## Priority Keyword Segments (Seed Set)

| Category | Example Hebrew queries | Intent |
|----------|------------------------|--------|
| Brand | דובילנד, דובי לימודים | Navigational |
| Games | משחקי לימוד לילדים, משחקי חשבון לגן | Informational/Commercial |
| Letters | לימוד אותיות לילדים, אותיות בעברית לגיל 3 | Informational |
| Numbers | לימוד מספרים לילדים, תרגילי חשבון לגן | Informational |
| Reading | לימוד קריאה לילדים, קריאה ראשונה | Informational |
| Parent intent | אפליקציה חינוכית לילדים, זמן מסך איכותי לילדים | Commercial/Comparative |

## KPI Targets

| KPI | Current (2026-04-09) | Q2 Target |
|-----|----------------------|-----------|
| Indexed key pages | TBD baseline | 100% of public parent-facing pages indexed |
| Mobile LCP | TBD baseline | < 2.5s on key routes |
| Mobile CLS | TBD baseline | < 0.1 on key routes |
| Hebrew keywords in top 20 | 0 baseline confirmed | 10+ |
| AI citations/month | 0 baseline confirmed | Baseline established + first month-over-month lift |

## Risks and Mitigations

- **Risk:** App-first authenticated routing limits indexable public pages.  
  **Mitigation:** Define public SEO entry pages via Architect/FED plan before scaling content.
- **Risk:** Missing analytics baseline delays KPI accountability.  
  **Mitigation:** Track setup and baseline capture as blocking work in first execution sprint.
- **Risk:** Hebrew keyword set may skew too generic.  
  **Mitigation:** Prioritize parent-intent and conversion-adjacent terms in P1 list.
