# 2026-04-10 — UX Illustration + Motion Token Spec (DUB-114)

## Context

- Source task: [DUB-114](/DUB/issues/DUB-114)
- Parent: [DUB-113](/DUB/issues/DUB-113)
- Primary implementation consumer: FED task [DUB-116](/DUB/issues/DUB-116)
- Product constraints: Ages 3-7, Hebrew RTL default, touch-first tablet UX

## 1) Illustration Style Guide

### Art direction

- Warm, rounded, storybook style with soft contrast edges.
- Use geometric base forms: circle/rounded-rect/teardrop before detail lines.
- Maintain emotional clarity at first glance (happy/supportive/focused) without text.
- Visual complexity target: readable at 48px icon size and still rich at hero size.

### Stroke and shape rules

- Corner radius language: mostly round, avoid sharp acute corners in character elements.
- Stroke weights by size:
  - 48px asset: 2px
  - 96px asset: 2.5px
  - 192px+ asset: 3px
- Favor closed shapes and large color regions over thin detail paths.

### Color usage

- Base palettes must map to design tokens in `tokens.css` (no hardcoded hex in components).
- Reserve highest saturation for:
  - Primary action callouts
  - Success moments
  - Mascot focus area (face/hands/gesture direction)
- Default card/background surfaces should use gradient + light texture (low contrast).

## 2) Mascot Pose Set (דובי)

| Pose key | Emotional intent | Typical placement | Direction rule |
|---|---|---|---|
| `dubi-wave` | Greeting, safe start | Home hero, first-step prompts | Hand wave toward current CTA |
| `dubi-cheer` | Success celebration | End-of-round, badge unlock | Centered, can scale + burst |
| `dubi-point-next` | Navigation guidance | Next button, tutorial hints | Finger points toward action target |
| `dubi-think` | Reflection/choice | Puzzle pause, difficulty choice | Eyes toward interactive choices |
| `dubi-sleep` | Cooldown/rest state | Empty states, quiet completion | Use in low-energy contexts only |

Rules:
- דובי never overlaps active tap zones.
- If mirrored in RTL, hand/eye direction must still point to intended action.
- Keep mascot bounding box outside bottom tablet wrist-rest area.

## 3) Topic Illustration Replacements (for emoji)

Replace emoji-only topic markers with SVG illustrations using these composition anchors:

- Numbers (`math`): counting objects + numeral badge (large central count shape).
- Letters (`letters`): Hebrew letter tile + phonetic cue object.
- Reading (`reading`): open book + word ribbon + supportive character element.

Token mapping for topic cards:
- Numbers: `var(--gradient-topic-numbers)`
- Letters: `var(--gradient-topic-letters)`
- Reading: `var(--gradient-topic-reading)`

## 4) Game Card Thumbnail Composition Template

Use a 16:10 frame with stable zones:

- 0-15% height: ambient background only (no critical information)
- 15-70% height: primary illustration subject
- 70-100% height: gameplay hint zone (target objects / subtle path)
- Keep a 12% safe margin on all sides for responsive crop tolerance.

Recommended layer order:
1. Gradient surface (`--gradient-game-surface-warm` or `--gradient-game-surface-cool`)
2. Soft texture overlay (`--texture-dots-soft`, `--texture-waves-soft`, or `--texture-stars-soft`)
3. Midground props
4. Foreground focal subject
5. Optional success glow highlight (`--shadow-success-glow`) for completed cards

## 5) Multi-size Asset Matrix

| Size | Use case | Detail level |
|---|---|---|
| 48x48 | Compact icon slots, chips | silhouette + 1 key detail |
| 96x96 | Topic card icon area | full shape + expression |
| 192x192 | Modal/hero support art | layered props allowed |
| 512x320 (16:10) | Game card thumbnail | full composition template |
| 1024x576 | Wide hero banners | large background storytelling |

## 6) Motion Tokens and Patterns

The design system now exposes these animation tokens in `tokens.css`:

- `--motion-entrance-bounce`
- `--motion-card-hover`
- `--motion-success-burst`
- `--motion-gentle-float`
- `--motion-page-transition-in`
- `--motion-page-transition-out`
- `--motion-loading-pulse`

Duration scale:
- quick: `--motion-duration-quick` (150ms)
- normal: `--motion-duration-normal` (300ms)
- slow: `--motion-duration-slow` (500ms)
- dramatic: `--motion-duration-dramatic` (800ms)

Reduced motion:
- `prefers-reduced-motion` remaps movement-heavy animations to reduced fade feedback.
- Essential state feedback remains visible (opacity change + color/glow), not motion-only.

## 7) SVG Component Template Contract (RTL-aware + bundle-optimized)

FED should use one shared base wrapper for all illustration components with this contract:

```ts
interface IllustrationProps {
  size?: number | string; // default 96
  decorative?: boolean;   // true => aria-hidden
  titleKey?: string;      // i18n key for accessible label if non-decorative
  mirroredInRtl?: boolean;
  className?: string;
}
```

Implementation requirements:
- Viewport convention: `viewBox="0 0 256 256"` for reusable scaling.
- Use `currentColor` or CSS variables for theme adaptation.
- Avoid embedding text in SVG; keep text in i18n-rendered HTML overlays.
- Path optimization target: minimize anchor points and duplicate groups.
- Use a single `<defs>` block per SVG file and remove editor metadata before commit.
- For RTL mirroring, mirror only directional groups (hands/arrows), not whole scene if it breaks semantics.

## 8) FED Handoff Checklist

- Replace emoji icons in `TopicCard` and no-thumbnail `GameCard` states with SVG components.
- Apply tokenized gradients/textures instead of hardcoded fills.
- Apply motion presets only on state changes (enter, success, loading), not perpetual loops by default.
- Verify on RTL tablet layout:
  - touch targets >=44px (`>=60px` for primary actions)
  - mascot never covers tap targets
  - reduced motion behavior is still understandable
