# 2026-04-10 — First Handbook Storybook Interaction Polish Checklist (DUB-540)

## Context

- Source issue: [DUB-540](/DUB/issues/DUB-540)
- Parent issue: [DUB-432](/DUB/issues/DUB-432)
- Technical lane partner: [DUB-538](/DUB/issues/DUB-538)
- Runtime anchors:
  - `packages/web/src/pages/InteractiveHandbook.tsx`
  - `packages/web/src/games/reading/InteractiveHandbookGame.tsx`
  - `packages/web/src/components/design-system/tokens.css`

Scope for this lane: lightweight polish guidance for storybook feel (RTL Hebrew), page-flip affordance, and ages 3-7 readability/touch safety.

## 1) Current Runtime Snapshot (Code-Level Validation)

| Area | Current state | UX status |
|---|---|---|
| RTL swipe semantics | Swipe mapping is RTL-correct (`swipe left => next`, `swipe right => previous`) with horizontal gesture thresholds and reduced-motion fallback. | Pass |
| Page transition motion | Directional `forward/backward` animations exist for RTL/LTR and are disabled under `prefers-reduced-motion`. | Pass |
| Mandatory interaction lock | `next` is blocked until required interaction is solved. | Pass |
| Explicit nav affordance | Control rail exposes only `next`; no persistent `previous` button for pre-readers who miss swipe cues. | Gap |
| Child chrome load | Subtitle + 3-mode switch remain in active child view, adding decision load before/while reading. | Gap |
| Touch target sizing | Hotspots are strong (`--handbook-hotspot-min-size: 72px`), but icon controls (`52px`) and choices (`56px`) are below preferred primary target size. | Gap |
| Readability hierarchy | Narration size is good (`--handbook-text-size`), but interaction title/status text currently uses 16px tokens and competes with child readability goals. | Gap |
| Progress clarity | Progress rail exists, but visual dot size in runtime CSS is `8px`, lower than handbook token intent (`14px`). | Gap |

## 2) Storybook Polish Contract (Implementation)

### A. Layout rhythm and visual hierarchy

1. Keep one child focal stack in this order: `illustration stage -> text strip -> interaction card -> control rail`.
2. Keep illustration dominance across tablet viewports:
   - landscape (`1024x768`): illustration ~58-62%
   - portrait (`768x1024`): illustration ~52-58%
3. Demote parent chrome from active child lane:
   - move mode switch (`readToMe/readAndPlay/calmReplay`) into parent-only panel/drawer
   - keep child header to page chip + progress only
4. Use handbook token values as visual source of truth (`--handbook-*`); avoid local one-off sizing where token exists.

### B. Page-flip affordance (RTL)

1. Preserve current swipe thresholds and mapping (`56px` horizontal min, `64px` max vertical drift).
2. Add a persistent `previous` control beside `next` in child-visible control rail (icon-only is fine).
3. Keep page-turn disabled while required interaction is unsolved (both swipe and tap affordances).
4. On first page hide/disable `previous`; on last page replace `next` with completion CTA.

### C. Touch targets and spacing

1. Child-primary nav and answer controls: target `>= 60px`, preferred `72px`.
2. Keep minimum spacing between interactive targets at `12-16px`.
3. Do not place critical targets on the bottom-most tablet edge.
4. Keep hotspot ring and active halo states for discoverability, but ensure non-motion fallback remains clear.

### D. Readability (ages 3-7 Hebrew)

1. Child-facing prompt/status text in active interaction flow should not render below 20px equivalent.
2. Maintain Hebrew line-height between `1.5-1.7` in narration/prompt strips.
3. Keep one actionable prompt per page; avoid stacked instruction lines.
4. Preserve audio-first pattern: all visible child labels in controls and prompts must remain audio-backed.

## 3) CTO/FED Acceptance Checklist

- [ ] `InteractiveHandbookGame` exposes both `previous` and `next` affordances in RTL child flow.
- [ ] Required interaction state disables page turning via both swipe and controls.
- [ ] Child-primary controls and answer options meet `>= 60px` (targeting `72px` where possible).
- [ ] Header chrome in child flow is reduced to storybook essentials (no 3-mode decision row in primary lane).
- [ ] Illustration remains visually dominant on `1024x768` and `768x1024` without shrinking touch targets.
- [ ] Prompt/status typography in active gameplay reads at arm's length for ages 3-7.
- [ ] Progress indicators remain visible and legible without dominating the page.

## 4) QA Validation Checklist (Manual)

Test viewports: `1024x768`, `768x1024`, `390x844`.

1. Swipe and tap nav in RTL:
   - swipe left advances
   - swipe right goes back
   - previous disabled on page 1
   - completion CTA shown on final page
2. Mandatory interaction gate:
   - next/previous blocked while required interaction unsolved
   - after success, navigation re-enabled without reload
3. Touch safety:
   - primary controls and choices meet target size
   - no accidental edge conflicts between navigation and interaction zones
4. Readability:
   - narration/prompt/status text readable at tablet arm's-length
   - one clear next action visible at all times
5. Motion/accessibility:
   - reduced-motion mode removes page-slide/pulse animations but keeps clear feedback states

## 5) Done Gate for DUB-540

This UX lane is complete when the checklist above is accepted as implementation contract by [DUB-538](/DUB/issues/DUB-538) and used as QA pass criteria before handbook ship sign-off.
