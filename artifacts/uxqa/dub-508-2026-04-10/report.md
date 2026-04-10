# DUB-508 UX Visual Inspection Report (2026-04-10)

## Coverage
- Environment: `http://localhost:3000`
- Auth mode: guest profile (for protected app routes)
- Viewports:
  - Desktop: `1440x1024`
  - iPad: `834x1194`
  - Phone: `390x844`
- Screenshots captured: **84** (`28 routes x 3 viewports`)
- Screenshot root: `artifacts/uxqa/dub-508-2026-04-10/{desktop,ipad,phone}/`

## Route Scores (1-10)

| Route | Visual | Layout | Consistency | Child-friendly | Professional | Notes |
|---|---:|---:|---:|---:|---:|---|
| `/` | 8 | 8 | 8 | 7 | 8 | Strong hero + mascot; footer hit-areas too small |
| `/about` | 7 | 7 | 8 | 7 | 8 | Strong trust copy; small footer/header logo targets |
| `/parents` | 7 | 7 | 8 | 7 | 8 | Professional structure; same shell touch-size issue |
| `/parents/faq` | 7 | 7 | 8 | 7 | 8 | Clear FAQ layout; same shell touch-size issue |
| `/letters` | 7 | 7 | 8 | 7 | 8 | Topic structure good; same shell touch-size issue |
| `/numbers` | 7 | 7 | 8 | 7 | 8 | Topic structure good; same shell touch-size issue |
| `/reading` | 7 | 7 | 8 | 7 | 8 | Topic structure good; same shell touch-size issue |
| `/terms` | 6 | 7 | 8 | 6 | 7 | Legal page readable but shell interactions remain small |
| `/privacy` | 6 | 7 | 8 | 6 | 7 | Legal page readable but shell interactions remain small |
| `/login` | 8 | 8 | 8 | 8 | 8 | Strong guest-first onboarding card |
| `/profiles` | 8 | 8 | 8 | 8 | 8 | Clear next action, adequate target sizes |
| `/games` | 8 | 8 | 8 | 8 | 8 | Good hub hierarchy and surface polish |
| `/parent` | 6 | 7 | 7 | 6 | 7 | Header logo target 34px in app shell |
| `/games/numbers/counting-picnic` | 8 | 7 | 8 | 8 | 7 | Polished game shell, good feedback loops |
| `/games/numbers/more-or-less-market` | 7 | 7 | 7 | 7 | 7 | Acceptable but less delight than top-tier games |
| `/games/numbers/shape-safari` | 7 | 7 | 7 | 7 | 7 | Adequate baseline polish |
| `/games/numbers/number-line-jumps` | 7 | 7 | 7 | 7 | 7 | Adequate baseline polish |
| `/games/colors/color-garden` | 8 | 8 | 8 | 8 | 8 | Strongest in-game visual consistency |
| `/games/letters/letter-sound-match` | 8 | 8 | 8 | 8 | 8 | High interaction clarity |
| `/games/letters/letter-tracing-trail` | 7 | 7 | 7 | 7 | 7 | Adequate baseline polish |
| `/games/letters/letter-sky-catcher` | 7 | 7 | 7 | 7 | 7 | Adequate baseline polish |
| `/games/reading/picture-to-word-builder` | 7 | 7 | 7 | 7 | 7 | Adequate baseline polish |
| `/games/reading/sight-word-sprint` | 7 | 7 | 7 | 7 | 7 | Adequate baseline polish |
| `/games/reading/decodable-micro-stories` | 7 | 7 | 7 | 7 | 7 | Adequate baseline polish |
| `/games/reading/interactive-handbook` | 8 | 7 | 8 | 8 | 7 | Storybook surface good, still polish gaps |
| `/games/reading/root-family-stickers` | 7 | 7 | 7 | 7 | 7 | Adequate baseline polish |
| `/games/reading/confusable-letter-contrast` | 7 | 7 | 7 | 7 | 7 | Adequate baseline polish |
| `/no-such-page` | 6 | 6 | 7 | 6 | 6 | Generic recovery path; low-context for in-app users |

## Objective UX Signals
- Public-shell touch targets measured at `30px` in multiple footer links across all marketing/legal routes (`44px` minimum violated).
- App parent shell logo target measured at `34px` on `/parent`.
- Primary actions in game/app surfaces mostly `48-52px` (better than shell links, still below ideal `60px` child-primary target).
- Transient route-enter overflow observed at ~250ms on several app routes due `.animated-page--shell-app` entering from negative X offset; settles by ~2s.

## Below-7 Routes and Fix Path
- `/terms`, `/privacy`, `/parent`, `/no-such-page`
- Improvements filed:
  - [DUB-600](/DUB/issues/DUB-600) — systemic touch-target floor for public/footer/app-shell primitives (Major)
  - [DUB-601](/DUB/issues/DUB-601) — remove transient horizontal bounce during route entry (Minor)
- Existing linked lane:
  - [DUB-425](/DUB/issues/DUB-425) — session-aware navigation & 404 recovery

## Benchmark Comparison Notes
- Khan Academy Kids reference page: https://apps.apple.com/us/app/khan-academy-kids/id1378467217
- Duolingo ABC reference page: https://apps.apple.com/ai/app/learn-to-read-duolingo-abc/id1440502568/
- Gap summary:
  - Benchmark apps keep navigation/secondary controls larger on mobile/tablet and avoid small legal/footer taps.
  - Benchmark transitions feel stable without horizontal bounce during route changes.

## Screenshot Mapping
`basename = route with '/' replaced by '__' (home route uses 'home')`
Examples:
- `/` -> `home.png`
- `/parents/faq` -> `parents__faq.png`
- `/games/reading/interactive-handbook` -> `games__reading__interactive-handbook.png`
- `/no-such-page` -> `no-such-page.png`

All mapped files exist in each viewport directory under `artifacts/uxqa/dub-508-2026-04-10/`.
