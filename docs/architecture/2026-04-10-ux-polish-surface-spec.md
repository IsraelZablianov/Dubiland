# 2026-04-10 — UX Visual Polish Surface Spec (DUB-133)

## Context

- Source issue: [DUB-133](/DUB/issues/DUB-133)
- Parent issue: [DUB-113](/DUB/issues/DUB-113)
- Builds on token baseline from [DUB-114](/DUB/issues/DUB-114) (`tokens.css` motion + texture contracts)
- Primary consumers: FED implementation tasks and Media asset production
- Product constraints: ages 3-7, Hebrew RTL-first, touch/tablet-first, text is assistive (not primary)

## 1) Surface Inventory (Implementation Map)

| Surface | Route(s) | Code anchor(s) | Current gap | Required illustration deliverables |
|---|---|---|---|---|
| Landing | `/` | `pages/Landing.tsx` | Emoji-based hero/topic/how/trust visuals | Hero mascot scene, topic illustrations, how-step icons, trust icons |
| Home hub | `/home` | `pages/Home.tsx`, `design-system/TopicCard.tsx` | Emoji topic cards, no mascot guidance visual | Topic card illustrations, "next action" mascot, selected-topic reinforcement visual |
| Profiles | `/profiles` | `pages/ProfilePicker.tsx`, `design-system/Avatar.tsx` | Emoji-only profile avatars | Avatar frame set + child avatar art set (non-text dependent) |
| Game shells | `/games/*` | `pages/CountingPicnic.tsx`, `ColorGarden.tsx`, `LetterSoundMatch.tsx`, `LetterTracingTrail.tsx`, `PictureToWordBuilder.tsx` | No shared visual shell motifs | Shared header mascot states + per-game thumbnail assets |
| Parent dashboard | `/parent` | `pages/ParentDashboard.tsx` | Data cards have no supportive illustrations | Progress stat icon pack + calm mascot companion visual |
| Topic pillars | `/letters`, `/numbers`, `/reading` | `pages/TopicPillar.tsx` | Emoji hero/how/trust visuals | Topic hero illustration trio + how/trust icon set (shared with landing) |

## 2) Illustration Inventory by Surface

Use this directory structure:

```text
packages/web/public/images/
  illustrations/
    landing/
    home/
    profiles/
    game-shell/
    parent/
    topics/
  games/
    thumbnails/<slug>/
```

### Landing (`pages/Landing.tsx`)

- `illustrations/landing/dubi-hero-wave.svg`
- `illustrations/topics/topic-math.svg`
- `illustrations/topics/topic-letters.svg`
- `illustrations/topics/topic-reading.svg`
- `illustrations/landing/how-listen.svg`
- `illustrations/landing/how-try.svg`
- `illustrations/landing/how-play.svg`
- `illustrations/landing/trust-safe.svg`
- `illustrations/landing/trust-hebrew.svg`
- `illustrations/landing/trust-adaptive.svg`
- `illustrations/landing/trust-audio.svg`

### Home (`pages/Home.tsx`, `TopicCard.tsx`)

- `illustrations/home/dubi-point-next.svg`
- Reuse topic illustrations from `illustrations/topics/`
- Optional selected-state overlays:
  - `illustrations/home/topic-selected-glow-math.svg`
  - `illustrations/home/topic-selected-glow-letters.svg`
  - `illustrations/home/topic-selected-glow-reading.svg`

### Profiles (`pages/ProfilePicker.tsx`, `Avatar.tsx`)

- `illustrations/profiles/avatar-frame-default.svg`
- `illustrations/profiles/avatar-frame-selected.svg`
- Child avatar starter pack (minimum 8):
  - `illustrations/profiles/avatar-fox.svg`
  - `illustrations/profiles/avatar-tiger.svg`
  - `illustrations/profiles/avatar-panda.svg`
  - `illustrations/profiles/avatar-bear.svg`
  - `illustrations/profiles/avatar-rabbit.svg`
  - `illustrations/profiles/avatar-cat.svg`
  - `illustrations/profiles/avatar-lion.svg`
  - `illustrations/profiles/avatar-bird.svg`

### Game shells (all game pages)

- `illustrations/game-shell/dubi-success-cheer.svg`
- `illustrations/game-shell/dubi-hint-point.svg`
- `illustrations/game-shell/dubi-loading-breathe.svg`
- `illustrations/game-shell/dubi-hero-ready.svg`

### Parent dashboard (`pages/ParentDashboard.tsx`)

- `illustrations/parent/stat-games.svg`
- `illustrations/parent/stat-minutes.svg`
- `illustrations/parent/stat-streak.svg`
- `illustrations/parent/stat-activity.svg`
- `illustrations/parent/dubi-parent-summary.svg`

### Topic pillars (`pages/TopicPillar.tsx`)

- Reuse topic illustrations from `illustrations/topics/`
- Reuse landing how/trust icons for visual consistency

## 3) Dubi Integration Map (Pose -> Context)

| Pose key | File | Trigger | Placement rule | Duration rule |
|---|---|---|---|---|
| `hero` | `dubi-hero-wave.svg` | First paint of landing/topic/game intro | Top third of layout, never over CTA hit area | Entrance 300-500ms |
| `success` | `dubi-success-cheer.svg` | Round complete, goal complete | Near result summary card, not full-screen takeover | Celebration max 1000ms |
| `hint` | `dubi-hint-point.svg` | After wrong attempt or idle hint trigger | Place adjacent to target action with clear pointing direction | 1 pulse cycle, then static |
| `loading` | `dubi-loading-breathe.svg` | Route fallback, data sync | Centered non-blocking with optional text/audio cue | Gentle loop only |

Rules:

- RTL is default: directional limbs/eyes must point toward the current action in RTL.
- Use directional variants (`*-rtl.svg`, `*-ltr.svg`) when mirroring breaks anatomy.
- Never overlap active touch targets or bottom tablet wrist-rest zone.
- Theme-aware contract: hook mascot asset selection to theme context. Bear theme maps to Dubi assets; other themes get their own mapped mascot assets later (no bear hardcoding in game logic).

## 4) Motion Guidance and Implementation Decision

## Decision

For this scope, use **tokenized CSS motion as the default**. Do **not** introduce Framer Motion yet.

Rationale:

- Current interaction set is mostly entrances, tap feedback, success bursts, and loading loops already covered by `tokens.css`.
- `framer-motion` is not currently installed; adding it now increases bundle/runtime complexity without a must-have interaction gap.
- CSS token approach keeps reduced-motion behavior centralized and predictable.

## Framer Motion adoption gate (future)

Promote to Framer Motion only if a feature needs at least one of:

1. Shared-element transitions across route boundaries.
2. Interruptible multi-step choreography that CSS cannot model cleanly.
3. Physics-driven drag interactions tied to live game state.

## Motion token usage map

| Interaction | Token | Timing target |
|---|---|---|
| Screen entrance | `--motion-page-transition-in` | 300ms default |
| Card tap/hover feedback | `--motion-card-hover` | 150-300ms |
| Success micro-celebration | `--motion-success-burst` | <= 800ms |
| Mascot ambient idle | `--motion-gentle-float` | subtle, low amplitude |
| Loading feedback | `--motion-loading-pulse` | ~1200ms loop |

## Reduced motion requirements

- Respect `prefers-reduced-motion` token remaps already defined in `tokens.css`.
- Keep essential feedback via opacity, color, and glow (not movement-only signals).
- Avoid rapid flashing and large travel distances.
- Maintain parallel audio cues so non-reading children still get clear feedback.

## 5) Game Thumbnail Spec

## Canonical frame

- Aspect ratio: **16:10**
- Export sizes:
  - `512x320` (default)
  - `1024x640` (2x for high-density screens)
- Safe zones:
  - Top 12%: ambient/background only
  - Center 58%: primary subject
  - Bottom 30%: gameplay hint cues
  - Keep 10-12% side margins free of critical details

## Layer order

1. Theme gradient surface
2. Soft texture overlay
3. Environment/midground props
4. Primary playable subject
5. Optional success accent glow (for completed state)

## Per-slug art direction

| Game slug | Primary scene | Gameplay cue shown in thumbnail | Palette direction |
|---|---|---|---|
| `countingPicnic` | Picnic blanket + basket + countable snacks/fruits | Number-grouped objects (1-10 progression cue) | Warm honey + fruit accents |
| `colorGarden` | Garden beds + flowers/objects by color families | Color-to-basket mapping cue | Bright but controlled primaries |
| `letterSoundMatch` | Hebrew letter tiles with listening motif | "hear -> pick letter" cue via sound-wave iconography | Cool blue-violet with high contrast letters |
| `letterTracingTrail` | Large Hebrew letter path with dotted trace trail | Start dot + trace direction cue | Warm paper + marker stroke accents |
| `pictureToWordBuilder` | Picture card + Hebrew letter tiles arranged RTL | Tile-to-slot assembly cue | Soft neutral background + vivid tile accents |

Technical rules:

- No embedded text in thumbnails (locale-independent).
- Keep one focal subject only; secondary cues must be low-noise.
- Save to `public/images/games/thumbnails/<slug>/thumb-16x10.webp`.

## 6) FED + Media Handoff Checklist

## FED implementation checklist

- Replace emoji visuals on listed surfaces with illustration assets/components.
- Keep topic/game visuals token-driven (no hardcoded hex overrides).
- Ensure primary actions remain >=60px; secondary controls >=44px.
- Wire mascot pose states to explicit triggers (`hero`, `hint`, `success`, `loading`).
- Validate RTL directionality for pointing assets and layout placement.
- Validate reduced-motion behavior in browser simulation.

## Media production checklist

- Deliver SVG for UI illustrations and WEBP for thumbnails.
- Export directional variants when needed for RTL/LTR.
- Keep transparent backgrounds for mascot and icon assets.
- Use consistent stroke weight and rounded geometry matching DUB-114 style constraints.
- Provide asset manifest (file name -> intended usage surface/component).

## Acceptance criteria

- No target surface relies on emoji as its primary instructional visual.
- All five active game slugs have 16:10 thumbnail assets and usage notes.
- Mascot states are mapped to real interaction triggers (not decorative-only placement).
- Motion behavior remains understandable with `prefers-reduced-motion` enabled.

