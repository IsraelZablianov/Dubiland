# 2026-04-11 — Letter Storybook RTL Page Layout + Navigation Model (DUB-653)

## Context

- Source issue: [DUB-653](/DUB/issues/DUB-653)
- Parent issue: [DUB-647](/DUB/issues/DUB-647)
- Story spec owner: [DUB-651](/DUB/issues/DUB-651)
- Baseline UX references:
  - `docs/architecture/2026-04-10-handbook-page-layout-illustration-text-interaction-spec.md`
  - `docs/architecture/2026-04-10-handbook-storybook-frame-illustration-hierarchy-spec.md`
  - `docs/games/handbooks/ux-layout-system-interaction-zones.md`

This document defines the production UX contract for the new Hebrew letter storybook shell (`"הסיפור של האותיות"`) with RTL-first page anatomy, swipe/tap navigation, progress pattern, audio replay affordances, and touch targets for tablet + mobile fallback.

## 1) UX Outcome

Each page should feel like one clear child action with zero reading dependency:

1. Child sees one focal visual (letter + association scene) immediately.
2. Child can always move forward/back using predictable RTL gestures and large tap zones.
3. Child always has one-tap audio replay for narration/instruction.
4. Child always sees progress without scanning dense UI.
5. All controls remain touch-safe for ages 3-7.

## 2) RTL Page Anatomy Contract

### 2.1 Fixed zone stack (top -> bottom)

1. `storybookHeader`: progress chip + compact progress rail.
2. `letterStage`: dominant letter + association illustration.
3. `narrationStrip`: short sentence + replayable text lane.
4. `interactionTray` (conditional): appears only on interactive pages.
5. `controlRail`: previous, replay, next/complete (icon-first, audio-backed).
6. `mascotRail`: דובי anchored bottom-left, never overlapping controls.
7. `edgeNavHotspots`: right edge = previous, left edge = next (when unlocked).

### 2.2 Zone ratios by viewport

| Viewport | `letterStage` | `narrationStrip` | `interactionTray + controlRail` |
|---|---|---|---|
| 1024x768 landscape tablet | 56-60% | 16-20% | 20-24% |
| 768x1024 portrait tablet | 50-56% | 18-22% | 22-28% |
| 390x844 mobile fallback | 44-50% | 20-24% | 26-32% |

Rules:

- Preserve touch-target sizes before preserving decorative padding.
- `letterStage` min height: `280px` tablet, `220px` mobile.
- `narrationStrip` min height: `112px` tablet, `96px` mobile.
- One purpose per page: never show more than one mandatory interaction card at once.

## 3) Navigation Model (RTL-First)

### 3.1 Gesture semantics

- Swipe **left** (`deltaX < 0`) -> `nextPage`.
- Swipe **right** (`deltaX > 0`) -> `previousPage`.
- Gesture thresholds:
  - horizontal travel >= `56px`
  - vertical drift <= `64px`
- While `interactionRequired=true`, block both swipe directions.

### 3.2 Tap navigation semantics

- `previous` affordance is on the **right** side (RTL back direction).
- `next` affordance is on the **left** side (RTL forward direction).
- First page: disable/hide `previous`.
- Last page: replace `next` with completion CTA.
- If locked by required interaction, keep controls visible but disabled (no layout jump).

### 3.3 Edge hotspot safety

- Edge hotspots are tall side lanes, not bottom corners.
- Do not place primary nav in bottom-most 10% of viewport (tablet wrist conflict).
- Nav lane overlap with interaction targets is forbidden.

## 4) Progress Pattern (Long Storybook Safe)

Because the letters storybook can exceed 22 pages, use dual progress:

1. **Primary progress chip** (always visible): `current / total` with current letter glyph.
2. **Windowed dot rail** (max 5 dots visible): local context around current page.

Dot states:

- `done`: filled accent
- `active`: larger dot + soft pulse
- `pending`: neutral fill

Rules:

- Never render 22+ tiny dots in one row.
- Dot rail is status only; paging remains swipe/tap-driven.
- Under `prefers-reduced-motion`, active pulse becomes static ring highlight.

## 5) Audio Replay Affordance Model

### 5.1 Persistent replay surfaces

- Global replay button in `controlRail` (child-primary size).
- Tappable narration line in `narrationStrip` (entire strip is replay target).
- On tap: replay starts within 100ms with visual state (`is-playing`) + audio.

### 5.2 Replay behavior contract

- If narration is already playing and replay tapped -> restart from sentence start.
- During replay, show clear play/pause icon state.
- If idle >= 6s on interactive page and no input, auto-surface replay affordance with a gentle glow (no modal).

### 5.3 Audio parity requirement

- Every child-visible sentence, prompt, button label, and progress phrase must map to i18n + audio key.
- No silent child-facing control states.

## 6) Touch Targets + Spacing Contract

| Control type | Minimum | Recommended | Spacing |
|---|---|---|---|
| Prev / Replay / Next primary controls | 60px | 72-80px | 12-16px |
| Edge nav hotspots | 72px width | 88-112px width | isolated lane |
| Choice cards / interactive chips | 60px | 72px | 16px |
| Secondary helper controls | 44px | 48-56px | 12px |

Mandatory feedback:

- Every tap responds within 100ms (visual + audio).
- Wrong answer feedback: gentle wobble + encouraging audio + immediate retry.
- Success feedback window: ~700-1000ms then return to next action.

## 7) Token Additions for FED

Existing `--handbook-*` tokens remain canonical. Add these for letter-storybook-specific behavior:

- `--storybook-progress-window-size: 5;`
- `--storybook-page-chip-min-inline-size: 9.25rem;`
- `--storybook-nav-lane-inline-size: clamp(72px, 11vw, 112px);`
- `--storybook-nav-lane-block-size: clamp(220px, 48vh, 360px);`
- `--storybook-replay-target-size: var(--touch-primary-action);`
- `--storybook-control-gap: clamp(12px, 1.8vw, 16px);`
- `--storybook-edge-safe-bottom: clamp(16px, 3.2vh, 36px);`
- `--storybook-progress-active-scale: 1.3;`

## 8) FED Component Contract

Implement this shell contract for the letter storybook runtime:

```ts
interface StorybookPageShellState {
  isRtl: boolean;
  pageIndex: number;
  totalPages: number;
  interactionRequired: boolean;
  interactionSolved: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  supportsCompletionCta: boolean;
  isNarrationPlaying: boolean;
}
```

Required behavior:

1. Keep nav semantics fully RTL-native in swipe, edge lane taps, and icon direction.
2. Keep progress chip + windowed dots visible across all pages (including interaction pages).
3. Keep replay reachable in one tap at all times.
4. Keep דובי in bottom-left rail without occluding active targets.

## 9) Acceptance Checklist (UX -> FED/QA)

- [ ] Tablet and mobile layouts preserve the zone hierarchy without shrinking child-primary targets below 60px.
- [ ] Swipe left/right and tap previous/next always map to RTL semantics.
- [ ] Required interactions lock page turns consistently for both swipe and taps.
- [ ] Progress chip + max-5-dot window remain legible on 22+ page flows.
- [ ] Replay is one tap from any page state and shows playing state clearly.
- [ ] All child-facing UI strings used by the shell are i18n-backed and audio-backed.
