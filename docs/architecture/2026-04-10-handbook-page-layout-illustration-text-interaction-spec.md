# 2026-04-10 — Handbook Page Layout: Illustration + Text + Interaction Zones (DUB-453)

## Context

- Source issue: [DUB-453](/DUB/issues/DUB-453)
- Parent delivery: [DUB-433](/DUB/issues/DUB-433)
- Runtime target: `packages/web/src/games/reading/InteractiveHandbookGame.tsx`
- Audience: children ages 3-7 (Hebrew RTL, tablet-first, touch-only)

This spec defines a production-ready picture-book layout for handbook pages so FED can ship one live illustrated handbook immediately.

## 1) UX Outcome

Each page must feel like a real children's storybook page:

1. Illustration dominates the page (about top 60% of the playable frame).
2. Story text is large, readable Hebrew and lives directly below illustration.
3. Interaction hotspots are overlaid on illustration and always visibly responsive.
4. Navigation is RTL-native (next on the left, previous on the right).
5. Progress dots and warm frame styling are always present.

## 2) Page Layout Contract

### 2.1 Viewport ratio targets

| Viewport | Illustration zone | Text zone | Controls + progress |
|---|---|---|---|
| 1024x768 (landscape tablet) | 58-62% | 18-22% | 16-20% |
| 768x1024 (portrait tablet) | 52-58% | 20-24% | 18-24% |
| 390x844 (mobile fallback) | 46-52% | 22-26% | 22-28% |

Rules:

- Preserve touch target size before preserving decorative padding.
- Illustration zone should never drop below 280px on tablet.
- Text zone should never drop below 120px.

### 2.2 Fixed zone stack (top -> bottom)

1. `bookFrameHeader`: page chip + progress dots.
2. `illustrationStage`: image/media area, primary focal zone.
3. `textStrip`: narration + prompt (Hebrew, high contrast).
4. `interactionTray`: choices/drag targets when page has interaction.
5. `controlRail`: replay, pause, retry, hint, next.
6. `mascotRail`: דובי guide anchored bottom-left (never blocking controls).

## 3) Interaction Zone Rules

### 3.1 Overlay hotspots on illustration

Use page metadata to position hotspots in `illustrationStage`.

```ts
interface HandbookInteractionZone {
  id: string;
  xPct: number; // 0-100 from right edge in RTL coordinates
  yPct: number; // 0-100 from top
  widthPct: number;
  heightPct: number;
  required: boolean;
  ariaLabelKey: string;
}
```

Constraints:

- Minimum hotspot size: 72px (`>=60px` absolute floor).
- Minimum gap between hotspots: 16px.
- Never place mandatory hotspots in bottom 12% of stage.
- Every tap responds within 100ms (visual pulse + audio cue).

### 3.2 Interaction lock behavior

- If page interaction is mandatory and unsolved: disable `next` navigation.
- After 2 wrong attempts: scaffold down (highlight -> spoken hint -> fewer choices).
- Success celebration window: 700-1000ms, then return to page flow.

## 4) Navigation + Progress (RTL)

- `nextPage`: swipe right->left, left-edge arrow button.
- `prevPage`: swipe left->right, right-edge arrow button.
- On first page, hide previous button.
- On final page, replace next arrow with completion CTA.
- Progress dots represent all pages and should remain visible during interactions.

Progress dot states:

- `done`: filled warm accent.
- `active`: larger dot with gentle pulse (respect reduced motion).
- `pending`: neutral parchment tone.

## 5) Visual Direction: Warm Book Frame

Required style direction:

- Storybook frame with rounded corners, warm parchment interior, subtle paper texture.
- Saturated color reserved for active controls, success, and highlighted interaction targets.
- Illustration edges must clip cleanly to frame radius.
- Text contrast must remain >= 4.5:1.

## 6) Token Contract (for `tokens.css`)

Add and use these tokens as the handbook shell source of truth:

- `--handbook-frame-radius`
- `--handbook-frame-border`
- `--handbook-frame-shadow`
- `--handbook-illustration-min-height`
- `--handbook-text-min-height`
- `--handbook-control-min-height`
- `--handbook-progress-dot-size`
- `--handbook-progress-dot-gap`
- `--handbook-hotspot-min-size`
- `--handbook-hotspot-gap`
- `--handbook-nav-hotspot-size`
- `--handbook-nav-hotspot-offset`
- `--handbook-text-size`
- `--handbook-text-line-height`
- `--handbook-page-turn-duration`

## 7) CSS Starter Contract (FED handoff)

Use this as the base structure in `InteractiveHandbookGame` styles:

```css
.interactive-handbook__page-frame {
  border-radius: var(--handbook-frame-radius);
  border: var(--handbook-frame-border);
  box-shadow: var(--handbook-frame-shadow);
  background: var(--gradient-game-surface-warm);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto minmax(var(--handbook-illustration-min-height), 60fr) minmax(var(--handbook-text-min-height), 20fr) auto;
}

.interactive-handbook__illustration-stage {
  position: relative;
  min-height: var(--handbook-illustration-min-height);
}

.interactive-handbook__interaction-zone {
  position: absolute;
  min-inline-size: var(--handbook-hotspot-min-size);
  min-block-size: var(--handbook-hotspot-min-size);
}

.interactive-handbook__text-strip {
  min-height: var(--handbook-text-min-height);
  font-size: var(--handbook-text-size);
  line-height: var(--handbook-text-line-height);
}
```

## 8) FED Acceptance Checklist

- Illustration area is visually dominant and remains top-priority on tablet.
- Hebrew text in story strip is readable at arm's-length (20px+ equivalent).
- Next/previous gestures and arrows follow RTL semantics consistently.
- Mandatory interactions lock progression and recover on-page (no modal detours).
- Tap targets meet `44px` floor and `60-72px` for primary child actions.
- `prefers-reduced-motion` disables pulse/slide without removing feedback clarity.
- No child-facing strings are hardcoded; all remain i18n + audio-mapped.

