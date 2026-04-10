# DUB-586 SEO Execution Package — Brand Marketing Consistency

*Owner: SEO Expert | Requested by: CMO via [DUB-564](/DUB/issues/DUB-564) | Prepared: 2026-04-10*

## Scope

Required package for consistency enforcement across parent-facing SEO routes:

1. Route QA matrix for core public pages.
2. Metadata parity matrix (`title`, `H1`, `meta description`, canonical, hreflang, OG).
3. GEO parent answer block template.
4. Weekly SEO/GEO regression checklist.

Inputs used:
- `docs/seo/brand-marketing-consistency-standard.md`
- `docs/seo/reports/2026-04-live-site-launch-seo-audit.md`
- `docs/seo/reports/2026-04-dub-512-discoverability-benchmark.md`
- `packages/web/src/seo/routeMetadata.ts`
- `packages/web/src/seo/RouteMetadataManager.tsx`
- `packages/web/src/i18n/locales/he/seo.json`
- `packages/web/src/i18n/locales/he/public.json`
- `packages/web/src/i18n/locales/he/common.json`

## 1) Route QA Matrix (Core Public Pages)

Status legend: `PASS`, `PARTIAL`, `FAIL`  
Current live crawl evidence baseline is from launch audit capture on 2026-04-10 (LIVE-001/LIVE-002/LIVE-005).

| Route | Non-JS crawlability | Parent-intent message clarity | Trust framing on page | Parent CTA present | Canonical/hreflang/OG parity | QA status | Owner lane |
|---|---|---|---|---|---|---|---|
| `/` | `PASS` (`200`) | `PASS` | `PASS` (trust section) | `PASS` (`/login`, `/parents`) | `PARTIAL` (canonical/OG still needs DUB-428 verification) | `PARTIAL` | [DUB-428](/DUB/issues/DUB-428) |
| `/about` | `FAIL` (`404`) | `PARTIAL` (brand story clear, less explicit parent outcome) | `PARTIAL` | `FAIL` (no direct parent CTA) | `FAIL` (blocked by path/OG parity gap) | `FAIL` | [DUB-427](/DUB/issues/DUB-427), [DUB-428](/DUB/issues/DUB-428) |
| `/letters` | `FAIL` (`404`) | `PASS` (topic promise clear) | `PARTIAL` | `PASS` (`/login`, `/parents`) | `FAIL` (canonical path + OG gaps) | `FAIL` | [DUB-427](/DUB/issues/DUB-427), [DUB-428](/DUB/issues/DUB-428) |
| `/numbers` | `FAIL` (`404`) | `PASS` (topic promise clear) | `PARTIAL` | `PASS` (`/login`, `/parents`) | `FAIL` (canonical path + OG gaps) | `FAIL` | [DUB-427](/DUB/issues/DUB-427), [DUB-428](/DUB/issues/DUB-428) |
| `/reading` | `FAIL` (`404`) | `PASS` (topic promise clear) | `PARTIAL` | `PASS` (`/login`, `/parents`) | `FAIL` (canonical path + OG gaps) | `FAIL` | [DUB-427](/DUB/issues/DUB-427), [DUB-428](/DUB/issues/DUB-428) |
| `/parents` | `FAIL` (`404`) | `PASS` (parent guide framing) | `PASS` (safety section) | `PASS` (product CTA in flow) | `FAIL` (canonical path + OG gaps) | `FAIL` | [DUB-427](/DUB/issues/DUB-427), [DUB-428](/DUB/issues/DUB-428) |
| `/parents/faq` | `FAIL` (`404`) | `PASS` (explicit parent Q/A intent) | `PASS` (FAQ trust answers) | `PASS` (`/parents`, `/login`) | `FAIL` (canonical path + OG gaps) | `FAIL` | [DUB-427](/DUB/issues/DUB-427), [DUB-428](/DUB/issues/DUB-428) |
| `/terms` | `FAIL` (`404`) | `PASS` (legal intent clear) | `PASS` | `FAIL` (no parent CTA) | `FAIL` (canonical path + OG gaps) | `FAIL` | [DUB-427](/DUB/issues/DUB-427), [DUB-428](/DUB/issues/DUB-428) |
| `/privacy` | `FAIL` (`404`) | `PASS` (legal intent clear) | `PASS` | `FAIL` (no parent CTA) | `FAIL` (canonical path + OG gaps) | `FAIL` | [DUB-427](/DUB/issues/DUB-427), [DUB-428](/DUB/issues/DUB-428) |

## 2) Metadata Parity Matrix (Title/H1/Meta/Canonical/OG)

Canonical and hreflang expected URLs below assume current deployment base path: `https://israelzablianov.github.io/Dubiland`.

| Route | SEO title (`seo.json`) | On-page H1 | Meta description (`seo.json`) | Canonical + hreflang expected | OG expectation | Current live status (2026-04-10) | Fix lane |
|---|---|---|---|---|---|---|---|
| `/` | `דובילנד | לומדים עברית בכיף — משחקי אותיות, מספרים וקריאה לגילאי 3-7` | `לומדים עברית בכיף` | `דובילנד היא פלטפורמת למידה ישראלית...` | `https://israelzablianov.github.io/Dubiland/` | `og:title`, `og:description`, `og:url`, `og:image` required | `og:url`/`og:image` parity not fully closed | [DUB-428](/DUB/issues/DUB-428) |
| `/about` | `אודות דובילנד | הסיפור שלנו והגישה החינוכית` | `אודות דובילנד` | `הכירו את דובילנד — פלטפורמת למידה בעברית...` | `https://israelzablianov.github.io/Dubiland/about` | same OG policy | canonical/OG parity still at risk | [DUB-428](/DUB/issues/DUB-428) |
| `/letters` | `אותיות בעברית לילדים | דובילנד` | `אותיות` | `עמוד לימוד אותיות בעברית לילדים בגילאי 3-7...` | `https://israelzablianov.github.io/Dubiland/letters` | same OG policy | known canonical path mismatch + missing OG URL/image in audit sample | [DUB-428](/DUB/issues/DUB-428) |
| `/numbers` | `מספרים וחשבון לילדים | דובילנד` | `מספרים` | `עמוד לימוד מספרים וחשבון ראשוני לילדים...` | `https://israelzablianov.github.io/Dubiland/numbers` | same OG policy | parity at risk pending lane closeout | [DUB-428](/DUB/issues/DUB-428) |
| `/reading` | `קריאה ראשונה לילדים | דובילנד` | `קריאה` | `עמוד קריאה ראשונה בעברית לילדים...` | `https://israelzablianov.github.io/Dubiland/reading` | same OG policy | parity at risk pending lane closeout | [DUB-428](/DUB/issues/DUB-428) |
| `/parents` | `מדריך להורים | דובילנד — איך הילדים לומדים בכיף` | `מדריך להורים` | `כל מה שהורים צריכים לדעת על דובילנד...` | `https://israelzablianov.github.io/Dubiland/parents` | same OG policy | parity at risk pending lane closeout | [DUB-428](/DUB/issues/DUB-428) |
| `/parents/faq` | `שאלות נפוצות להורים | דובילנד` | `שאלות נפוצות` | `תשובות קצרות וברורות לשאלות הנפוצות של הורים...` | `https://israelzablianov.github.io/Dubiland/parents/faq` | same OG policy | parity at risk pending lane closeout | [DUB-428](/DUB/issues/DUB-428) |
| `/terms` | `תנאי שימוש | דובילנד` | `תנאי שימוש` | `תנאי השימוש של דובילנד...` | `https://israelzablianov.github.io/Dubiland/terms` | same OG policy | parity at risk pending lane closeout | [DUB-428](/DUB/issues/DUB-428) |
| `/privacy` | `מדיניות פרטיות | דובילנד` | `מדיניות פרטיות` | `מדיניות הפרטיות של דובילנד...` | `https://israelzablianov.github.io/Dubiland/privacy` | same OG policy | parity at risk pending lane closeout | [DUB-428](/DUB/issues/DUB-428) |

OG image baseline for all above routes:
- `https://israelzablianov.github.io/Dubiland/images/games/thumbnails/contact-sheet-16x10.webp`

## 3) GEO Parent Answer Block Template (Reusable)

Use this for `/parents/*` pages and FAQ leaves.  
Target: answer-first, 40-60 words, self-contained, citation-ready.

### Copy Template (Hebrew)

```md
## [שאלה הורית ממוקדת]

[תשובה של 40-60 מילים בעברית פשוטה, עם פעולה ברורה להורה, גיל יעד (3-7), ותועלת לימודית ספציפית].

מה עושים עכשיו:
- [צעד 1 קצר]
- [צעד 2 קצר]
- [צעד 3 קצר]

מקור/הוכחה:
- [נתון/הנחיה + מקור אמין + תאריך]

למידע נוסף:
- [קישור פנימי לעמוד הורה משלים]
- [קישור פנימי לעמוד נושא: /letters או /numbers או /reading]
```

### JSON-LD Mapping Contract (FAQPage-ready)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[שאלה הורית ממוקדת]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[אותו בלוק תשובה בן 40-60 מילים, ללא קיצורים לא ברורים]"
      }
    }
  ]
}
```

### Quality Gates

- One direct answer paragraph before any long explanation.
- Keep answer block self-contained so AI snippets can quote it without missing context.
- Include one concrete age/scope token (`גילאי 3-7`, `גן חובה`, `כיתה א׳`).
- Include one internal route link to pillar content (`/letters`, `/numbers`, `/reading`).
- If a statistic is used, include source + date in the same section.

## 4) Weekly Regression Checklist (SEO + GEO)

Run weekly after deploy and before closing any SEO lane.

### A. Crawlability and Indexation

1. Confirm non-JS `HTTP 200` for indexable public routes:
```bash
for route in / /about /letters /numbers /reading /parents /parents/faq /terms /privacy; do
  curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" "https://israelzablianov.github.io/Dubiland${route}"
done
```
Pass: all routes return `200`.

2. Confirm crawl assets are live and consistent:
```bash
curl -sSI https://israelzablianov.github.io/Dubiland/robots.txt | head -n 1
curl -sSI https://israelzablianov.github.io/Dubiland/sitemap.xml | head -n 1
curl -sSI https://israelzablianov.github.io/Dubiland/llms.txt | head -n 1
```
Pass: all return `200`.

3. Confirm robots bot allowlist coverage:
```bash
curl -s https://israelzablianov.github.io/Dubiland/robots.txt | rg "GPTBot|ChatGPT-User|PerplexityBot|ClaudeBot|anthropic-ai|Google-Extended"
```
Pass: all required bot tokens present.

### B. Metadata and Parity

1. For each public route, verify in rendered DOM:
- `document.title` matches `seo.json` route title.
- Exactly one visible `h1`.
- `<meta name="description">` matches route description.
- `<link rel="canonical">` equals expected absolute URL.
- `<link rel="alternate" hreflang="he">` equals canonical.
- `og:title`, `og:description`, `og:url`, `og:image` all present.

2. Failure policy:
- If any route fails canonical/hreflang/OG parity, reopen/continue [DUB-428](/DUB/issues/DUB-428).
- If any route returns non-200 on non-JS probe, reopen/continue [DUB-427](/DUB/issues/DUB-427).

### C. GEO Extractability

1. Verify `/parents` cluster pages contain at least one answer-first block (40-60 words).
2. Verify FAQ blocks are JSON-LD valid (`FAQPage` with `Question` + `Answer` text).
3. Verify `llms.txt` route list matches current indexable public routes exactly.

### D. Performance Guard

1. Run Lighthouse mobile on `/`, `/letters`, `/parents`.
2. Track thresholds:
- LCP `< 2.5s`
- CLS `< 0.1`
- INP `< 200ms` (field data where available)
3. If LCP fails target on any route, continue [DUB-430](/DUB/issues/DUB-430).

## Implementation Hand-off (No New Lane Required)

This package is documentation-ready for CMO/FED execution. Current active implementation dependencies remain:
- [DUB-427](/DUB/issues/DUB-427) — route crawlability `200` on public routes
- [DUB-428](/DUB/issues/DUB-428) — canonical/hreflang/OG parity closeout
- [DUB-429](/DUB/issues/DUB-429) — robots/sitemap/llms consistency
- [DUB-430](/DUB/issues/DUB-430) — mobile LCP improvements
