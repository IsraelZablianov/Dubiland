# 2026-04-10 — Handbook Launch Trio Performance Budgets + Route Profiling

- Owner: Performance Expert
- Source issue: [DUB-398](/DUB/issues/DUB-398)
- Parent lane: [DUB-384](/DUB/issues/DUB-384)
- Program: [DUB-377](/DUB/issues/DUB-377)

## 1) Measurement Setup (Baseline)

Measurement timestamp: `2026-04-10`.

### Commands used

- Build + chunk report: `yarn build`
- Lighthouse mobile perf: `npx lighthouse http://127.0.0.1:4173/games/reading/interactive-handbook --only-categories=performance --chrome-flags='--headless=new --no-sandbox'`
- Route startup/page-turn profile: Puppeteer scripted run on `/games/reading/interactive-handbook` with:
  - viewport `1024x1366`
  - network throttling `150ms latency`, `1.6Mbps down`, `0.75Mbps up`
  - CPU slowdown `4x`

### Baseline outputs (current route)

| Metric | Result | Target | Status |
|---|---:|---:|---|
| Lighthouse mobile performance score | `93` | `>=90` | Pass |
| Lighthouse mobile LCP | `2869ms` | `<2500ms` | **Fail** |
| Lighthouse mobile CLS | `0.0194` | `<0.1` | Pass |
| Lighthouse mobile TBT | `0ms` | `<200ms` | Pass |
| Throttled startup wall time (to interactive shell) | `5010ms` | `<4500ms` | **Fail** |
| Throttled page-turn p95 | `67.1ms` | `<120ms` | Pass |
| Max click event duration | `64ms` | `<200ms` | Pass |
| Max long task | `1768ms` | `<200ms` | **Fail** |

## 2) Launch Trio Preload Budgets (Actionable)

Budget tiers for each handbook slot:

- **Critical**: assets needed for first render + pages `1-3` (poster, narration, interaction cues, page beds).
- **Next**: assets for pages `4-5`, preloaded after initial stabilization.
- **Lazy**: remaining pack loaded on demand/background.

### Launch slot budgets

| Slot | Slug | Page count | Critical budget | Next budget | Lazy budget |
|---|---|---:|---|---|---|
| Ages `3-4` | `bouncy-balloon` | 8 | `<=12.5MB`, `<=12 requests` | `<=7.0MB`, `<=8 requests` | `<=16.0MB`, `<=18 requests` |
| Ages `5-6` | `magic-letter-map` | 10 | `<=14.5MB`, `<=14 requests` | `<=9.0MB`, `<=10 requests` | `<=22.0MB`, `<=24 requests` |
| Ages `6-7` | `star-message` | 12 | `<=16.5MB`, `<=16 requests` | `<=10.5MB`, `<=12 requests` | `<=28.0MB`, `<=30 requests` |

### Shared runtime startup budgets (all three slots)

- Route-start JavaScript transfer on first entry: `<=170KB` compressed.
- Route-start media transfer before first interaction: `<=70KB` (first narration + poster).
- Route-start long task cap: `<=200ms`.

## 3) Budget Pass/Fail Status for Launch Trio (Current)

| Slot | Manifest (`packages/web/public/handbooks/<slug>/media/manifest.json`) | Audio pack (`packages/web/public/audio/he/handbooks/<slug>/`) | Budget status |
|---|---|---|---|
| `bouncy-balloon` | Missing | Missing | **Fail (not measurable yet)** |
| `magic-letter-map` | Missing | Missing | **Fail (not measurable yet)** |
| `star-message` | Missing | Missing | **Fail (not measurable yet)** |

Interpretation: launch-slot budgets are now defined and enforceable, but all three slots are currently blocked on missing manifest/audio artifacts.

## 4) Current Route Bottlenecks (Measured)

1. Startup transfer is dominated by JS and immediate media fetch:
   - `/assets/index-CNCUJfKl.js` transfer `~96KB`
   - `/assets/supabase-k82gbVKr.js` transfer `~52KB`
   - first narration MP3 transfer `~51KB`
2. Lighthouse flags `unused-javascript` with `~450ms` opportunity.
3. Main-thread work is style/layout-heavy in startup profile (`~449ms`) with a long-task spike (`1768ms`).

## 5) Concrete Remediation Recommendations

1. **FED + Architect**: decouple handbook first paint from eager Supabase/auth client path so handbook shell can render before `supabase-*` chunk is needed.
2. **FED**: defer first narration autoplay until first paint settles (`~250-350ms` delay) to reduce startup contention on slow Wi-Fi.
3. **FED**: tighten route chunk budget (`<=170KB` compressed startup transfer) and split any non-critical handbook logic behind post-render imports.
4. **FED + Media + Content Writer**: produce trio manifests with explicit `critical/next/lazy` tiers and reject publish if any tier exceeds table budgets.
5. **QA**: add launch gate check using this table before setting `is_published=true` for any launch slot.

## 6) Bundle Snapshot (Current Build)

From `yarn build` on `2026-04-10`:

- `dist/assets/InteractiveHandbook-DfmMMFcF.js` = `36.39kB` (`7.36kB` gzip)
- Shared route startup-heavy chunks:
  - `dist/assets/index-CNCUJfKl.js` = `328.69kB` (`95.77kB` gzip)
  - `dist/assets/supabase-k82gbVKr.js` = `196.61kB` (`51.65kB` gzip)
  - `dist/assets/react-dz6IX6RK.js` = `49.00kB` (`17.09kB` gzip)
  - `dist/assets/i18n-CQO0ZaI5.js` = `49.39kB` (`15.37kB` gzip)

This snapshot is the baseline for next optimization pass.
