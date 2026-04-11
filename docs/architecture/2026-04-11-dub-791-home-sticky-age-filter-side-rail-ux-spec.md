# 2026-04-11 — Home Hub Sticky Age Filter + Side Rail UX Spec (DUB-791)

## Context

- Source issue: [DUB-791](/DUB/issues/DUB-791)
- Parent coordination: [DUB-765](/DUB/issues/DUB-765)
- Implementation lane: [DUB-792](/DUB/issues/DUB-792)
- QA lane: [DUB-793](/DUB/issues/DUB-793)
- Runtime surface: `packages/web/src/pages/Home.tsx`
- Existing filter primitive: `packages/web/src/components/design-system/AgeRangeFilterBar.tsx`

Problem: the current age filter lives mid-page and scrolls away, so children/parents lose age context while browsing deeper sections.

## UX Decision Summary

1. Age control must remain reachable without returning to top on all primary viewports.
2. Side rail is **tablet/desktop only**:
- **Tablet:** collapsible sticky rail at inline-end.
- **Desktop:** always-on sticky rail at inline-end.
3. Mobile keeps a sticky top shelf (no side rail) to protect content width and thumb reach.
4. All controls use RTL logical placement, touch targets >=44px (goal 52-60px), and explicit keyboard/focus states.

## Breakpoint Interaction Model

| Breakpoint | Layout model | Age control behavior | Section jump behavior |
|---|---|---|---|
| Mobile `<= 767px` | Single column | Sticky top shelf under route header | Horizontal mini jump chips in same sticky shelf |
| Tablet `768-1199px` | Content + inline-end utility rail | Collapsible sticky side rail (open/close toggle) | Vertical section jump stack inside rail |
| Desktop `>= 1200px` | Two-column with persistent utility rail | Always-on sticky side rail | Vertical section jump stack always visible |

Rationale:
- Mobile avoids narrow game cards caused by side rail.
- Tablet keeps persistent reachability while allowing collapse for portrait width.
- Desktop maximizes orientation by showing both age and section controls at once.

## Rail Composition (Tablet/Desktop)

Rail order (top to bottom):

1. Age band control (`AgeRangeFilterBar` compact mode).
2. Section jump group (`אותיות`, `קריאה`, `חשבון`, `ספרים`) with icon + short label.
3. Optional quick action: "חזרה לתחילת העמוד" (tokenized secondary action, not primary CTA).

Behavior rules:
- `position: sticky` with `inset-block-start` token (aligned to header spacing).
- Placement is `inset-inline-end` in RTL (no hardcoded `right`).
- Rail never overlaps cards; content column keeps dedicated inline gap.
- On tablet collapse, keep a visible sticky launcher button at inline-end.

## Mobile Sticky Shelf

For `<= 767px`:
- Keep age chips in sticky shelf directly below the greeting block.
- Keep section jumps to max 4 short chips (one per section), horizontally scrollable in RTL.
- Shelf remains visually lightweight to avoid stealing first-play attention.

## Section Jump Interaction Contract

Section jump item requirements:
- Touch target: >=44px minimum, 52px preferred.
- Label length: max 2 words, concise and pre-reader friendly.
- Icon + label together (never color-only distinction).
- Tap scrolls to target section card with smooth motion.
- Active section state updates while scrolling (IntersectionObserver).

Accessibility/focus:
- Use semantic `<button>` elements.
- `aria-current="true"` (or `aria-pressed`) on active section control.
- Visible focus ring (>=2px contrast-compliant outline).
- Keyboard:
  - `Tab` enters rail controls in DOM order.
  - `Enter`/`Space` activates selected control.
  - `ArrowUp`/`ArrowDown` optional enhancement for rail traversal.

Reduced-motion:
- With `prefers-reduced-motion`, disable smooth scroll animation and use instant jump while preserving audio confirmation.

## Age Filter Behavior (No Functional Changes)

Retain current state model from `AgeRangeFilterBar`:
- `default_profile_age`
- `manual_override`
- `reset_to_profile_age`
- `no_profile_age_fallback`
- `persisting_override`

New UX requirement:
- This control must remain visible via sticky shelf/rail per breakpoint above.

## RTL Requirements (Explicit)

- Rail sits on **inline-end**.
- Section content scroll target alignment respects RTL layout and sticky offset.
- Iconography direction follows RTL conventions where directional arrows appear.
- Use logical properties (`margin-inline`, `padding-inline`, `inset-inline-end`) only.

## FED Handoff (Implementation-Oriented)

Suggested structure inside `Home.tsx`:

1. Add section refs map keyed by `HomeSectionSlug`.
2. Add active section state derived from viewport intersection.
3. Add sticky utility wrapper component for:
- age filter block
- section jump controls
- tablet collapse trigger
4. Add breakpoint-driven render path:
- mobile sticky shelf
- tablet collapsible rail
- desktop persistent rail
5. Add `scrollMarginBlockStart` to section cards so jumps do not hide beneath sticky UI.

Suggested i18n keys (common namespace):
- `home.sideRail.title`
- `home.sideRail.jumpToSection`
- `home.sideRail.section.letters`
- `home.sideRail.section.reading`
- `home.sideRail.section.math`
- `home.sideRail.section.books`
- `home.sideRail.backToTop`
- `home.sideRail.expand`
- `home.sideRail.collapse`

Audio parity:
- Every key above needs matching audio.
- Section jump tap should play section label audio before/with scroll.

## Token Contract (Additions)

Use tokenized values instead of page-local literals:

- `--home-sticky-offset`
- `--home-rail-inline-size`
- `--home-rail-gap`
- `--home-rail-z-index`
- `--home-rail-toggle-size`
- `--home-section-jump-target-min`

Recommended values:
- Sticky offset: `clamp(10px, 2vh, 20px)`
- Rail width: `clamp(132px, 17vw, 188px)`
- Jump target min: `max(44px, var(--touch-min-secondary))`
- Toggle size: `max(52px, var(--touch-filter-chip))`

## QA Checklist (DUB-793 Input)

1. Age filter remains reachable without scrolling to top on mobile/tablet/desktop.
2. Tablet rail collapse/expand works in both portrait and landscape.
3. Desktop rail stays sticky and does not overlap content cards.
4. RTL verification: rail on inline-end, jump controls and spacing mirror correctly.
5. Touch verification: no interactive rail item under 44px.
6. Keyboard verification: focus order visible; Enter/Space activate jump/filter controls.
7. Reduced-motion verification: no forced smooth animation when reduced motion is enabled.
8. i18n/audio verification: no hardcoded Hebrew and all new labels have audio assets.

## Acceptance Mapping

1. "Child can change age band without scrolling back to top" -> satisfied by sticky shelf/rail on all primary breakpoints.
2. "Navigation labels concise and age-appropriate" -> satisfied by short section labels + icon pairing.
3. "Spec covers RTL and keyboard/focus states" -> explicit sections above define both.
