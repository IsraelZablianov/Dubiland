# 2026-04-11 — DUB-678 UX Improvements Sprint Spec

## Context

- Source issue: [DUB-678](/DUB/issues/DUB-678)
- Trigger report: `artifacts/uxqa/dub-508-2026-04-10/report.md`
- Inputs already landed in sibling lanes:
  - Touch-floor shell fixes from [DUB-600](/DUB/issues/DUB-600)
  - Route-enter bounce mitigation from [DUB-601](/DUB/issues/DUB-601)
- Remaining low-score surfaces from DUB-508:
  - `/terms` (6)
  - `/privacy` (6)
  - `/parent` (6)
  - `/no-such-page` (6)

This spec defines the UX-level polish contract for those routes so FED can implement with consistent, measurable behavior.

## Scope

In scope:

- Route-level layout and hierarchy improvements for `/terms`, `/privacy`, `/parent`, `/no-such-page`
- Shared shell and token directives that keep tap targets child-safe while preserving parent trust
- Measurable acceptance criteria for UX QA scoring and FED validation

Out of scope:

- New feature flows or navigation IA changes
- Copywriting overhaul beyond microcopy needed for hierarchy clarity
- Backend/data-model work

## Non-Negotiable Design Constraints

- RTL-first composition only (no LTR-first designs with post-flip mirroring)
- Preschool-safe touch targets:
  - Primary actions: `>=60px` (preferred `72px`)
  - Secondary/shell actions: `>=44px` (preferred `48px+`)
- One primary next step per screen
- Child-visible actions always pair visual + audio feedback
- Parent trust pages maintain professional tone (no placeholder visuals, no noisy motion)

## 1) Token Contract Additions (Design System)

Add these semantic tokens in `tokens.css` before route implementation work:

| Token | Value | Purpose |
|---|---|---|
| `--surface-legal-max-width` | `960px` | Consistent legal page reading width |
| `--surface-legal-card-gap` | `var(--space-lg)` | Breathing room between legal cards |
| `--surface-legal-card-padding` | `clamp(20px, 2.4vw, 28px)` | Comfortable legal card density on tablet/mobile |
| `--surface-parent-max-width` | `1080px` | Parent dashboard content rhythm |
| `--surface-parent-section-gap` | `var(--space-lg)` | Parent section spacing consistency |
| `--surface-recovery-max-width` | `640px` | Not-found recovery surface width |
| `--surface-recovery-action-gap` | `var(--space-md)` | CTA separation in recovery state |
| `--shell-link-touch-min` | `max(48px, var(--touch-min-secondary))` | Stable floor for header/footer links |
| `--shell-logo-touch-min` | `max(60px, var(--touch-min-primary))` | Header/footer logo tap confidence |
| `--motion-route-enter-gentle` | `420ms var(--motion-ease-entrance)` | Consistent low-cognitive route entrance |

Usage rule: component code should consume semantic tokens above (not route-local literals) so QA fixes remain systemic.

## 2) Route Specs

### `/terms` and `/privacy` (Parent trust legal surfaces)

Objective: move from static legal blocks to guided, high-trust reading surfaces that still work for mixed parent/child entry.

Layout contract:

- Keep a single content column (`max-width: var(--surface-legal-max-width)`) with generous line length control.
- Hero keeps centered trust framing but adds one compact reassurance row (max 3 chips): safety, no-ads, parent controls.
- Card spacing/padding uses legal semantic tokens; no per-route pixel literals.
- Add one explicit primary exit action at bottom: return to parent context (`/parents`) with `>=60px` touch size.

Interaction contract:

- Each section card can expose optional "listen summary" affordance for audio reinforcement (for accessibility and mixed-age sessions).
- Hover-only affordances are not allowed; all states must be touch-discoverable.
- Keep motion subtle; no bounce effects on legal surfaces.

### `/parent` (Parent dashboard)

Objective: improve professional trust and scanning without losing Dubiland warmth.

Layout contract:

- Constrain container to `var(--surface-parent-max-width)`.
- Section rhythm uses `var(--surface-parent-section-gap)` to reduce dense stacking.
- Maintain one clear primary action lane (continue to child content) and demote secondary actions visually.
- Preserve mascot presence but keep it assistive (not dominant) in parent analytics regions.

Interaction contract:

- Parent shell action cluster remains horizontally stable at tablet widths (no overflow).
- Critical controls (`profile`, `parent area`, `sign out`) remain `>=48px` and keep clear spacing between tap targets (`>=12px`).
- Error/empty states must present immediate recovery CTA + concise context, never dead-end text.

### `/no-such-page` (Recovery route)

Objective: make recovery immediate and child-friendly while keeping parent confidence.

Layout contract:

- Recovery panel width capped by `var(--surface-recovery-max-width)`.
- Keep one dominant primary CTA and one secondary CTA only.
- Mascot gaze points to primary CTA; decorative elements cannot compete with CTA focus.

Interaction contract:

- Primary CTA: `>=60px`; secondary CTA: `>=48px`.
- Add short audio cue on entry (friendly guidance) so non-readers are not stranded.
- No delayed loaders; recovery options must be visible on first paint.

## 3) Shared Shell Guidance

Applies to `PublicHeader` and `PublicFooter` across marketing/legal/parent shells:

- Link and logo controls adopt semantic shell touch tokens:
  - `min-block-size: var(--shell-link-touch-min)` for nav/footer links
  - `min-block-size: var(--shell-logo-touch-min)` for logos
- Footer legal links must remain as tappable rows (not text-like inline links).
- Header action groups in authenticated routes must wrap without horizontal overflow on 820px and 834px tablet widths.
- Route entry transitions use block-axis, gentle motion only (`--motion-route-enter-gentle`) for reduced cognitive noise.

## 4) QA Acceptance Criteria (DUB-678 Exit)

1. All targeted routes (`/terms`, `/privacy`, `/parent`, `/no-such-page`) reach UX score `>=8` on the DUB-508 rubric dimensions.
2. No interactive shell control on those routes measures below `44px`; primary route CTA controls are `>=60px`.
3. Tablet and mobile runs show no horizontal overflow (`scrollWidth == viewport width`) on the target routes.
4. Recovery and legal pages expose one clear next step without competing equal-weight CTAs.
5. Route transitions on target pages avoid horizontal bounce and remain understandable with `prefers-reduced-motion: reduce`.

## 5) FED Handoff Map

| Area | Primary files to update |
|---|---|
| Shared shell touch semantics | `packages/web/src/components/layout/PublicHeader.tsx`, `packages/web/src/components/layout/PublicFooter.tsx`, `packages/web/src/components/design-system/tokens.css` |
| Legal route polish | `packages/web/src/pages/Terms.tsx`, `packages/web/src/pages/Privacy.tsx` |
| Parent route polish | `packages/web/src/pages/ParentDashboard.tsx` |
| Recovery route polish | `packages/web/src/pages/NotFound.tsx` |
| Route transition consistency | `packages/web/src/styles/global.css` |

## 6) Verification Loop

Before implementation lane closure:

```bash
yarn workspace @dubiland/web test:touch-shell
yarn typecheck
```

Then run UX QA browser pass on:

- `/terms`
- `/privacy`
- `/parent`
- `/no-such-page`

Capture fresh scorecard and compare against DUB-508 baseline.
