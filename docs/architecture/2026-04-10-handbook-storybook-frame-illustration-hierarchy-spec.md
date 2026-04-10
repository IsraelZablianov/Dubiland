# 2026-04-10 — Handbook Reader Storybook Frame + Illustration Hierarchy Spec (DUB-470)

## Context

- Source issue: [DUB-470](/DUB/issues/DUB-470)
- Parent delivery: [DUB-433](/DUB/issues/DUB-433)
- Runtime surfaces:
  - `packages/web/src/pages/InteractiveHandbook.tsx`
  - `packages/web/src/games/reading/InteractiveHandbookGame.tsx`
- Baseline contracts:
  - `docs/architecture/2026-04-10-handbook-page-layout-illustration-text-interaction-spec.md`
  - `docs/games/handbooks/ux-layout-system-interaction-zones.md`

## Problem Summary

Current handbook UI still reads like a game dashboard:

- "Card inside page" framing with marketing-style title/subtitle + mode toggles in core child flow.
- Text-first card layout with no dominant illustrated picture-book area.
- Duplicate titling between route shell and in-game shell.

For ages 3-7, this reduces delight, weakens parent trust polish, and breaks the one-focal-point rule.

## Target UX Outcome

Handbook should feel like a real children's storybook page before it feels like a game:

1. Editorial storybook frame (paper spread feeling, calm margins, visible spine on tablet landscape).
2. Illustration-first hierarchy per page.
3. Minimal child chrome (replay + next + optional hint), with parent-heavy controls tucked away.
4. Single visible title layer per screen.

## 1) Frame and Spread System

### 1.1 Device behavior

| Viewport | Reader frame mode | Spine/gutter |
|---|---|---|
| `>= 960px` landscape tablet | `two-page-spread` visual frame | visible center spine |
| `768-959px` portrait tablet | `single-page-book` | no hard spine, soft inner gutter |
| `< 768px` mobile fallback | `single-page-card` | no spine, preserve safe margins |

### 1.2 Spread geometry (landscape tablet)

- Outer storybook frame width: `min(1060px, 100%)`
- Frame corner radius: `28px`
- Center spine width: `20-24px`
- Page interior padding: `24px` inline, `20px` block
- Left/right page visual split: `1fr 1fr` with center spine divider

Implementation note:
- Keep one interactive page at a time (no dual-page interaction complexity).
- The non-active side remains decorative context art or continuation texture.

## 2) Illustration + Text Hierarchy

### 2.1 Active page vertical ratios

| Zone | Landscape tablet | Portrait tablet | Mobile |
|---|---|---|---|
| Illustration stage | `58-62%` | `52-58%` | `46-52%` |
| Story text strip | `18-22%` | `20-24%` | `22-26%` |
| Interaction + controls | `16-20%` | `18-24%` | `22-28%` |

Rules:

- Illustration zone must remain dominant and never go below `280px` height on tablet.
- Story text strip must remain `>= 120px`.
- Interaction controls must not push story text above illustration in visual priority.

### 2.2 Illustration composition rules

- One dominant focal illustration per page; supporting details remain low-noise.
- Keep interactive overlays inside center-safe area, not edge nav lanes.
- Use paper-edge clipping so art sits "on page", not floating on UI cards.
- On text-heavy checkpoints, reduce background motion/detail by about `25%`.

## 3) Typography Hierarchy (Hebrew RTL)

| Text role | Size | Weight | Line height | Notes |
|---|---|---|---|---|
| Story line (`narration`) | `22-26px` | `600` | `1.55-1.65` | high readability at arm's length |
| Prompt/action line | `24-30px` | `700` | `1.45-1.55` | one clear next action |
| Secondary status | `18-20px` | `500-600` | `1.5` | never compete with prompt |
| Parent microcopy/meta | `14-16px` | `500` | `1.45` | de-emphasized |

Rules:

- Avoid long paragraphs; cap visible story text to roughly 2 short lines before interaction.
- Keep prompt on its own line block.
- No italics.

## 4) Chrome Reduction Contract

### 4.1 Child-visible chrome (default)

- Keep visible:
  - replay (`▶`)
  - next/prev nav (RTL semantics)
  - progress dots
  - one optional hint entry point
- De-emphasize or tuck:
  - multi-mode toggles (`readToMe`, `readAndPlay`, `calmReplay`)
  - verbose status banners
  - duplicate metadata inside game shell

### 4.2 Parent-only / secondary chrome

- Mode switching moves to compact parent drawer or icon-triggered panel.
- Keep back action in page shell, but avoid repeating title/subtitle inside game body.
- Parent summary card stays after completion, outside active reading frame.

## 5) Moodboard Reference Set (3 shots to match)

Use these three reference frames as the visual quality anchor when implementing:

1. `MB-01` Khan Kids story read-along: large hero art, minimal HUD, calm warm frame.
2. `MB-02` Khan Kids text + narration strip: clear text lane with strong contrast and low background noise.
3. `MB-03` TinyTap book player: page materiality cues (paper edges/spine), oversized page-turn affordance, child-safe control density.

Review usage:
- Use as style direction only.
- Do not copy branded assets or layouts 1:1.

## 6) FED Token Handoff (New/Updated)

Add/consume these tokens from `tokens.css`:

| Token | Value | Purpose |
|---|---|---|
| `--handbook-spread-max-width` | `1060px` | max storybook frame width |
| `--handbook-spread-inline-padding` | `clamp(12px, 2.4vw, 24px)` | frame interior side padding |
| `--handbook-spine-width` | `clamp(18px, 2.2vw, 24px)` | visual book spine |
| `--handbook-page-inner-gutter` | `clamp(12px, 1.8vw, 20px)` | page edge breathing room |
| `--handbook-illustration-ratio-landscape` | `16 / 10` | art area ratio on tablet landscape |
| `--handbook-illustration-ratio-portrait` | `4 / 3` | art area ratio on portrait/mobile |
| `--handbook-story-font-size` | `clamp(1.375rem, 2.3vw, 1.625rem)` | narration hierarchy |
| `--handbook-prompt-font-size` | `clamp(1.5rem, 2.8vw, 1.875rem)` | action-line hierarchy |
| `--handbook-status-font-size` | `clamp(1.125rem, 1.9vw, 1.25rem)` | secondary status text |
| `--handbook-control-surface-opacity` | `0.92` | keep controls present but visually lighter |

## 7) Component-Level Handoff

### `InteractiveHandbook.tsx`

- Keep one page-level heading (route shell).
- Remove duplicate title/subtitle pressure from in-game body.

### `InteractiveHandbookGame.tsx`

- Replace current dashboard header cluster with storybook frame header:
  - progress rail + compact page chip only.
- Rebuild stage as:
  - `spreadFrame`
  - `activePage`
  - `illustrationStage`
  - `storyTextStrip`
  - `interactionTray`
  - `controlRail`
- Move mode switches to secondary parent panel.

## 8) Acceptance Criteria

- On first paint, user sees a storybook page with dominant illustration, not a utility card.
- Exactly one primary focal point is visible at a time.
- No duplicate title/subtitle between route and game shells.
- Child controls stay touch-safe (`>=44px`, primary `>=60px`).
- RTL nav semantics remain intact.
- Parent feedback confirms "book-like" quality and visual polish.
