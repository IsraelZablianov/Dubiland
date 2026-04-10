# Dubiland AI Visibility Baseline — April 2026

*Owner: SEO Expert | Reviewer: CMO | Measurement windows: Baseline (2026-04-10 04:20-05:15 IDT) + Manual evidence pass (2026-04-10 04:27-04:31 IDT, [DUB-209](/DUB/issues/DUB-209))*

## Goal

Close the GEO baseline gap for [DUB-10](/DUB/issues/DUB-10) with:

1. A reproducible AI visibility scoring method.
2. A first-pass scorecard for 10 priority Hebrew parent queries.
3. A monthly citation tracker format.
4. Q2 GEO improvements mapped to active SEO artifacts and owners.

## Measurement Methodology (v1)

### Query set source

- Query list is pulled from P1 keywords in `docs/seo/keyword-research.md`.
- Language/market: Hebrew, Israel (`he-IL`), parent-intent educational queries.

### Platforms measured

- ChatGPT
- Perplexity
- Google AI Overviews (when triggered)
- Microsoft Copilot (backup assistant)

### Capture protocol

1. Use an incognito browser profile with locale `he-IL`.
2. Submit the exact Hebrew query (no extra prompt engineering).
3. Capture top answer and first visible citations.
4. Record:
   - Dubiland mention (`yes/no`)
   - Dubiland citation (`yes/no`, URL if present)
   - Competitor domains cited
5. Save evidence links/screenshots in the monthly tracker.

### Scoring rubric (per platform/query)

- `0`: no accessible answer capture or no Dubiland mention/citation.
- `1`: answer captured, Dubiland absent, competitor citations present.
- `2`: Dubiland mentioned but not cited as source.
- `3`: Dubiland cited with link but not in top-3 cited sources.
- `4`: Dubiland cited in top-3 sources and answer includes a correct Dubiland fact.

### Derived metrics

- `Query score` = sum of the 4 platform scores (max `16`).
- `Query citation share` = Dubiland citations / total captured citations for that query.
- `Monthly citation share` = total Dubiland citations across all scored queries / total captured citations across all scored queries.

## Access and Data-Collection Constraints (This Run)

### 2026-04-10 automation status

| Platform | Status | Evidence summary | Impact |
|----------|--------|------------------|--------|
| ChatGPT | Blocked for automated probe | Returned anti-bot challenge page requiring JS/cookies | Manual browser capture required |
| Perplexity | Blocked for automated probe | Returned anti-bot challenge page requiring JS/cookies | Manual browser capture required |
| Google AI Overviews | Not deterministically capturable via headless HTTP | AI Overview rendering is JS/session/eligibility dependent | Manual browser capture required |
| Copilot | No stable citation API endpoint in this run | Search proxy available, but not full assistant citation payload | Treat as manual capture lane |

This baseline was initially recorded conservatively at `0` while manual evidence was pending. The manual evidence pass is now attached below.

## Manual Evidence Pass Update ([DUB-209](/DUB/issues/DUB-209))

### Artifact bundle (2026-04-10)

- `docs/seo/reports/evidence/2026-04-10-ai-visibility/manual-pass-summary.md`
- `docs/seo/reports/evidence/2026-04-10-ai-visibility/manual-pass-2026-04-10.csv`
- `docs/seo/reports/evidence/2026-04-10-ai-visibility/queries.txt`
- `docs/seo/reports/evidence/2026-04-10-ai-visibility/chatgpt.png`
- `docs/seo/reports/evidence/2026-04-10-ai-visibility/perplexity.png`
- `docs/seo/reports/evidence/2026-04-10-ai-visibility/google.png`
- `docs/seo/reports/evidence/2026-04-10-ai-visibility/copilot.png`

### Platform-level validated state

| Platform | Gate/status marker | Evidence file | Interpretation |
|----------|--------------------|---------------|----------------|
| ChatGPT | `cloudflare_human_verification` | `chatgpt.png` | Access gate appears before assistant answer; citation capture unavailable |
| Perplexity | `cloudflare_security_verification` | `perplexity.png` | Access gate appears before assistant answer; citation capture unavailable |
| Google AI Overviews lane | `google_recaptcha_unusual_traffic` | `google.png` | Google search lane blocks with reCAPTCHA before AI Overview/answer capture |
| Copilot | `region_blocked` | `copilot.png` | Assistant indicates region unavailability from this runtime |

### Query-level confidence (10 baseline queries)

| # | Query (Hebrew) | Confidence | Reason |
|---|----------------|------------|--------|
| 1 | משחקי לימוד לילדים | Low | All 4 assistants blocked pre-answer in this runtime |
| 2 | משחקי חשבון לגן | Low | All 4 assistants blocked pre-answer in this runtime |
| 3 | לימוד אותיות לילדים | Low | All 4 assistants blocked pre-answer in this runtime |
| 4 | לימוד אותיות בעברית | Low | All 4 assistants blocked pre-answer in this runtime |
| 5 | לימוד מספרים לילדים | Low | All 4 assistants blocked pre-answer in this runtime |
| 6 | חשבון לילדים | Low | All 4 assistants blocked pre-answer in this runtime |
| 7 | לימוד קריאה לילדים | Low | All 4 assistants blocked pre-answer in this runtime |
| 8 | קריאה לכיתה א | Low | All 4 assistants blocked pre-answer in this runtime |
| 9 | אפליקציה חינוכית לילדים | Low | All 4 assistants blocked pre-answer in this runtime |
| 10 | זמן מסך איכותי לילדים | Low | All 4 assistants blocked pre-answer in this runtime |

### Validated before/after delta ([DUB-205](/DUB/issues/DUB-205) -> [DUB-209](/DUB/issues/DUB-209))

| Metric | Baseline (DUB-205) | Manual pass (DUB-209) | Delta |
|--------|---------------------|-----------------------|-------|
| Query-platform opportunities scored | 40 | 40 | 0 |
| Dubiland mentions/citations captured | 0 | 0 | 0 |
| Monthly citation share | 0% | 0% | 0 pp |
| Mean query score (0-16) | 0.0 | 0.0 | 0.0 |

## First-Pass Baseline Scorecard (10 Hebrew Queries)

| # | Query (Hebrew) | Cluster | ChatGPT | Perplexity | Google AIO | Copilot | Query score (0-16) | Dubiland citation share |
|---|----------------|---------|---------|------------|------------|---------|--------------------|-------------------------|
| 1 | משחקי לימוד לילדים | Games | 0 | 0 | 0 | 0 | 0 | 0% |
| 2 | משחקי חשבון לגן | Games | 0 | 0 | 0 | 0 | 0 | 0% |
| 3 | לימוד אותיות לילדים | Letters | 0 | 0 | 0 | 0 | 0 | 0% |
| 4 | לימוד אותיות בעברית | Letters | 0 | 0 | 0 | 0 | 0 | 0% |
| 5 | לימוד מספרים לילדים | Numbers | 0 | 0 | 0 | 0 | 0 | 0% |
| 6 | חשבון לילדים | Numbers | 0 | 0 | 0 | 0 | 0 | 0% |
| 7 | לימוד קריאה לילדים | Reading | 0 | 0 | 0 | 0 | 0 | 0% |
| 8 | קריאה לכיתה א | Reading | 0 | 0 | 0 | 0 | 0 | 0% |
| 9 | אפליקציה חינוכית לילדים | Parent intent | 0 | 0 | 0 | 0 | 0 | 0% |
| 10 | זמן מסך איכותי לילדים | Parent intent | 0 | 0 | 0 | 0 | 0 | 0% |

## Baseline Roll-up

- Total query-platform opportunities scored: `40`
- Dubiland mentions/citations captured: `0`
- Monthly citation share baseline: `0%`
- Interpretation: Manual evidence now confirms this runtime is blocked at platform access gates (Cloudflare/reCAPTCHA/region lock), so citation-share remains unmeasurable from this environment and should not be treated as final market truth.

## Monthly KPI Checkpoint (April 2026, [DUB-229](/DUB/issues/DUB-229))

| KPI | Formula | April 2026 value | MoM delta | Confidence / note |
|-----|---------|------------------|-----------|-------------------|
| Probe coverage | completed probes / planned probes | `40 / 40` (`100%`) | `N/A` (first monthly checkpoint) | High (full query x platform matrix completed) |
| Answer-render success rate | rendered answers / completed probes | `0 / 40` (`0%`) | `N/A` (first monthly checkpoint) | High for gate-state diagnosis; answer bodies unavailable |
| Dubiland mention rate | answers mentioning Dubiland / completed probes | `0 / 40` (`0%`) | `N/A` (first monthly checkpoint) | Low for market-truth visibility because no answers rendered |
| Dubiland citation-share (when answers render) | Dubiland citations / total citations from rendered answers | `N/A` (`0 / 0`) | `N/A` (first monthly checkpoint) | Not measurable in this cycle |
| Confidence index | qualitative (`high`/`medium`/`low`) | `Low` | `N/A` (first monthly checkpoint) | All 4 platforms blocked before answer render |

### Hybrid Uplift Gate Decision (Q2 policy from [DUB-226](/DUB/issues/DUB-226))

- Gate A (`>=50%` answer-render success for 2 consecutive runs): **not met** (`0%` in this run).
- Gate B (production domain + GA4/GSC ownership complete on [DUB-20](/DUB/issues/DUB-20)): **not met** (`DUB-20` still blocked).
- Decision: continue manual-first monthly cadence; do not activate paid tooling this cycle.

### Next-Run Plan and Explicit Blockers

- Next full monthly checkpoint target: **May 10, 2026** (same 10-query x 4-platform rubric + evidence bundle).
- Blocker 1: platform access gates prevent answer rendering (ChatGPT/Perplexity Cloudflare, Google reCAPTCHA, Copilot region lock).
- Blocker 2: production-domain + GA4/GSC ownership remains open on [DUB-20](/DUB/issues/DUB-20), so confidence cannot graduate above low even if isolated captures succeed.
- Contingency: if either hybrid gate condition is met before May checkpoint, open tooling recommendation note under this report and notify [DUB-10](/DUB/issues/DUB-10).

## Monthly Tracker Format (Repeatable)

Use this table every month in `docs/seo/reports/YYYY-MM-ai-visibility-baseline.md`:

| Capture date (IDT) | Platform | Query | Response language | Dubiland mentioned | Dubiland cited URL | Competitor cited domains (top 5) | Platform score (0-4) | Evidence link |
|--------------------|----------|-------|-------------------|--------------------|--------------------|-----------------------------------|----------------------|---------------|
| YYYY-MM-DD HH:mm | ChatGPT | ... | he / mixed | yes/no | URL or none | domain list | 0-4 | screenshot/link |

Minimum monthly run:

1. Re-run the same 10 baseline queries.
2. Add up to 10 expansion queries from new launched pages.
3. Compare month-over-month:
   - Query score deltas
   - Citation share delta
   - New competitor domains entering top citations

## Q2 GEO Improvements (Owner-Mapped)

### Critical

1. Finalize stable public preview URL and rerun official schema validators so FAQ/JSON-LD can be trusted as AI citation inputs.  
Owner: FED Engineer 2 + SEO Expert  
Links: [DUB-169](/DUB/issues/DUB-169), [DUB-50](/DUB/issues/DUB-50), [DUB-42](/DUB/issues/DUB-42)

2. Update `llms.txt` route section to match current approved public indexable surfaces (remove auth-only framing once route policy is finalized) and keep citation identity stable (`Dubiland`, `דובילנד`, `דובי`).  
Owner: SEO Expert draft, CMO approve, FED Engineer publish  
Links: `packages/web/public/llms.txt`, [DUB-15](/DUB/issues/DUB-15), [DUB-16](/DUB/issues/DUB-16)

3. Ship answer-first FAQ blocks for the 10 baseline queries using the template contract in `docs/seo/schema-plan.md` (40-60 word atomic answers) and map to schema-enabled routes.  
Owner: Content Writer + FED Engineer + SEO Expert QA  
Links: `docs/seo/schema-plan.md` (GEO templates), [DUB-24](/DUB/issues/DUB-24), [DUB-12](/DUB/issues/DUB-12)

### High

1. Add source-backed facts to parent-facing FAQ answers (numeric claims + source attribution) to improve citation-worthiness in AI answers.  
Owner: Content Writer (draft), SEO Expert (fact QA)

2. Add explicit "Last updated" and author expertise signals on parent pages used for AI extraction.  
Owner: FED Engineer + Content Writer  
Dependency: metadata framework from [DUB-17](/DUB/issues/DUB-17)

3. Start monthly manual AI capture cadence (same query set + evidence links) until a tooling subscription is approved.  
Owner: SEO Expert (execution), CMO (tool budget decision)

## Owner Checkpoint Plan (April 2026)

| Action | Owner | Target date |
|--------|-------|-------------|
| Attach first manual evidence batch for all 10 queries (4 platforms) | SEO Expert | Completed 2026-04-10 ([DUB-209](/DUB/issues/DUB-209)) |
| Confirm stable preview URL for final schema validator rerun | FED Engineer 2 | Next heartbeat after [DUB-169](/DUB/issues/DUB-169) unblock |
| Approve `llms.txt` revision scope and publication gate | CMO | 2026-04-13 |
| Queue FAQ content updates for top 10 queries | Content Writer + SEO Expert | 2026-04-14 |

## Notes

- This report now includes the first manual evidence bundle, and the same access blockers remain.
- The score model is still valid and should be reused unchanged in May for trend comparability.
