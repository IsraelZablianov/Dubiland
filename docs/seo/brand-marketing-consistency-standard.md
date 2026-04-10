# Dubiland Brand, Marketing, and SEO Consistency Standard

*Owner: CMO | Execution: SEO Expert + cross-functional owners | Last updated: 2026-04-10*

## Purpose

Set one enforceable consistency bar for parent-facing messaging and discovery surfaces so Dubiland feels trustworthy, clear, and conversion-ready across product, SEO, and marketing touchpoints.

## Parent-Facing Messaging Standard

### Voice and tone (required)

- Warm, expert, and practical for Hebrew-speaking parents.
- Clear promises, no hype words without evidence.
- Child benefit + parent control are always both present.

### Core message pillars (must appear consistently)

1. **Parent-guided learning:** parent sets up, child learns independently.
2. **Hebrew-native quality:** content is Hebrew-first and age-appropriate (3-7).
3. **Trust and safety:** privacy and parent-control framing are explicit.
4. **Learning outcomes:** page copy states what the child practices (letters, numbers, reading).

### Hard rules (do not violate)

- Do not mix app-private utility language (`/home`, `/profiles`, `/parent`) into public acquisition messaging.
- Do not publish parent-facing claims without matching route reality (crawlable page + valid canonical + accurate metadata).
- Use both brand forms consistently by context: `Dubiland` (Latin) and `דובילנד` (Hebrew), not random alternation inside one section.

## Channel Consistency Enforcement

| Surface | Required consistency checks | Owner |
|---|---|---|
| Public SEO routes (`/`, `/about`, `/letters`, `/numbers`, `/reading`, `/parents`, `/parents/faq`) | Canonical/hreflang/OG parity, trust block, parent-intent CTA, matching title/H1 promise | SEO Expert + FED Engineer 2 |
| Parent education pages | Clear outcome section, parent-control statement, non-hyped proof style | Content Writer + CMO review |
| Metadata/snippet layer | Title/description/OG align with on-page promise and route intent | SEO Expert |
| Cross-doc strategy artifacts | Route names and conversion narrative stay aligned with actual architecture | CMO |

## Highest-Impact Inconsistencies (2026-04-10)

| Priority | Gap | Trust/conversion risk | Evidence | Owner lane | CMO target ETA |
|---|---|---|---|---|---|
| Critical | Public routes return `404` to non-JS crawlers | Parent pages cannot reliably index; trust promise fails at discovery stage | `docs/seo/reports/2026-04-live-site-launch-seo-audit.md` (LIVE-001) | [DUB-427](/DUB/issues/DUB-427) (FED Engineer) | 2026-04-11 |
| High | Canonical/hreflang path mismatch + missing `og:url` / `og:image` | Shared links and search previews appear inconsistent or generic | Launch audit LIVE-002 and LIVE-005 | [DUB-428](/DUB/issues/DUB-428) (FED Engineer 2) | 2026-04-11 |
| High | Crawl files point to unresolved production host | Reliability and authority signals break for crawlers/AI systems | Launch audit LIVE-003 and LIVE-006 | [DUB-429](/DUB/issues/DUB-429) (FED Engineer 2) | 2026-04-11 |
| High | Route naming drift in strategy artifacts (`/parent-dashboard`) vs actual route model (`/parent` app route and `/parents` public route) | Team-level messaging and implementation handoffs diverge | `docs/seo/strategy.md` vs route inventory in `docs/seo/technical-audit.md` and launch audit route list | CMO normalization in strategy docs + SEO QA | 2026-04-11 |
| Medium | Parent-intent lifecycle pages remain shallow vs demand | Conversion capture is delayed for high-intent parent queries | Launch audit LIVE-007 + content backlog | [DUB-431](/DUB/issues/DUB-431) (Content Writer) | 2026-04-13 |

## Owner and ETA Plan (This Cycle)

1. **CMO (completed on 2026-04-10):**
   - Publish this standard and unify approval criteria for parent-facing messaging and SEO surfaces.
2. **SEO Expert (delegated child under [DUB-564](/DUB/issues/DUB-564)):**
   - Deliverables due **2026-04-11**:
     - Route-by-route messaging consistency QA for top public routes.
     - Metadata/OG copy alignment matrix (title/H1/meta/OG parity).
     - GEO-ready parent answer block template for `/parents` cluster pages.
     - Weekly regression checklist that can be reused by CMO/SEO.
   - Delivery artifact: `docs/seo/reports/2026-04-dub-586-seo-execution-package.md` (published 2026-04-10).
3. **Cross-team dependencies (tracked lanes):**
   - [DUB-427](/DUB/issues/DUB-427), [DUB-428](/DUB/issues/DUB-428), [DUB-429](/DUB/issues/DUB-429), [DUB-430](/DUB/issues/DUB-430), [DUB-431](/DUB/issues/DUB-431) remain the execution backbone for trust/conversion consistency.

## Approval Rule

No parent-facing growth surface is considered "consistent" until both are true:

1. Message consistency checks pass (voice + promise + trust framing).
2. Technical discoverability checks pass (crawlability + canonical/OG + crawl assets).
