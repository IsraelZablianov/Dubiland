# Visual Redesign Plan — Nano Banana Asset System (DUB-83)

## Context

- Source issue: [DUB-83](/DUB/issues/DUB-83)
- Related UX spec: [DUB-133](/DUB/issues/DUB-133)
- Product constraints: ages 3-7, Hebrew RTL-first, tablet touch-first, low-friction navigation for pre-readers
- Goal: replace placeholder/emoji-heavy visuals with a coherent illustrated system that improves comprehension and delight without adding cognitive load

## 1) UX Audit Summary

## Current visual gaps

- Emoji placeholders are still primary visuals in key surfaces (`Landing`, `Home`, `TopicPillar`, `About`, `Parents`, `NotFound`, `PublicHeader`, `PublicFooter`, `AppHeader`, `ProfilePicker`).
- Game routes have strong mechanics but weak shell identity (minimal scene/background language).
- Mascot behavior is not state-driven (`hero`, `hint`, `success`, `loading` are not consistently mapped to triggers).
- Game thumbnails are mostly missing; discoverability relies on text/buttons.
- Parent-facing surfaces are informative but visually flat.

## UX direction

- Build one unified "storybook classroom" visual system:
  - Warm paper-like base surfaces
  - Clear topic worlds (numbers, letters, reading)
  - State-aware mascot guidance (never decorative-only)
  - One focal illustration per section to reduce overload
- Keep interface semantics in code and copy in i18n; visuals reinforce action, they do not replace interaction structure.

## 2) Visual System Rules

## Art direction

- Children's book style, rounded geometry, soft hand-drawn feel.
- Pastel-forward backgrounds with high-contrast focal elements for tappables.
- No embedded text inside illustrations.
- Use simple recognizable objects for ages 3-7.

## Mascot system (דובי)

- Required states: `hero`, `hint`, `success`, `loading`.
- Directional assets must support RTL pointing logic.
- Mascot never overlaps active tap zones.

## Technical contract

- UI illustrations: SVG
- Scene backgrounds + game thumbnails: WEBP
- Canonical thumbnail ratio: 16:10 (`512x320`, `1024x640`)
- Naming: semantic and surface-based (no generic `image1` style names)

## 3) Surface-by-Surface Asset Backlog

All paths are relative to repo root.

| Asset ID | Description | Surface/component | Target path | Size / ratio | Priority |
|---|---|---|---|---|---|
| `mascot-hero-rtl` | דובי waving toward primary CTA | Landing hero, topic hero | `packages/web/public/images/mascot/dubi-hero-wave-rtl.svg` | 512x512 | P0 |
| `mascot-hint-rtl` | דובי pointing to next tap target | Home/game hint states | `packages/web/public/images/mascot/dubi-hint-point-rtl.svg` | 512x512 | P0 |
| `mascot-success` | דובי celebration pose | Game completion cards | `packages/web/public/images/mascot/dubi-success-cheer.svg` | 512x512 | P0 |
| `mascot-loading` | Calm breathing/loading pose | Route fallback/loading states | `packages/web/public/images/mascot/dubi-loading-breathe.svg` | 512x512 | P0 |
| `mascot-hero-ltr` | LTR fallback hero variant | Future non-RTL contexts | `packages/web/public/images/mascot/dubi-hero-wave-ltr.svg` | 512x512 | P2 |
| `mascot-hint-ltr` | LTR fallback hint variant | Future non-RTL contexts | `packages/web/public/images/mascot/dubi-hint-point-ltr.svg` | 512x512 | P2 |
| `topic-numbers-icon` | Counting world icon (objects + numeral motif) | Topic card / landing topic | `packages/web/public/images/topics/topic-numbers.svg` | 256x256 | P0 |
| `topic-letters-icon` | Hebrew letter world icon | Topic card / landing topic | `packages/web/public/images/topics/topic-letters.svg` | 256x256 | P0 |
| `topic-reading-icon` | Reading world icon (book + tiles) | Topic card / landing topic | `packages/web/public/images/topics/topic-reading.svg` | 256x256 | P0 |
| `bg-home-storybook` | Main home scene background | Home route shell | `packages/web/public/images/backgrounds/home/home-storybook.webp` | 1600x1000 | P0 |
| `bg-profiles-cozy-room` | Cozy profile selection background | Profiles route shell | `packages/web/public/images/backgrounds/profiles/profiles-cozy-room.webp` | 1600x1000 | P1 |
| `bg-parent-calm` | Calm parent dashboard background | Parent dashboard shell | `packages/web/public/images/backgrounds/parent/parent-calm.webp` | 1600x1000 | P1 |
| `landing-how-listen` | Listening/ear-friendly step icon | Landing + topic pillar | `packages/web/public/images/illustrations/landing/how-listen.svg` | 192x192 | P1 |
| `landing-how-practice` | Practice/interaction step icon | Landing + topic pillar | `packages/web/public/images/illustrations/landing/how-practice.svg` | 192x192 | P1 |
| `landing-how-play` | Play/completion step icon | Landing + topic pillar | `packages/web/public/images/illustrations/landing/how-play.svg` | 192x192 | P1 |
| `landing-trust-safe` | Child-safe shield icon | Landing trust grid | `packages/web/public/images/illustrations/landing/trust-safe.svg` | 160x160 | P1 |
| `landing-trust-hebrew` | Hebrew-native language icon | Landing trust grid | `packages/web/public/images/illustrations/landing/trust-hebrew.svg` | 160x160 | P1 |
| `landing-trust-adaptive` | Adaptive progress icon | Landing trust grid | `packages/web/public/images/illustrations/landing/trust-adaptive.svg` | 160x160 | P1 |
| `landing-trust-audio` | Audio-first icon | Landing trust grid | `packages/web/public/images/illustrations/landing/trust-audio.svg` | 160x160 | P1 |
| `avatar-pack-01` | 8 starter child avatars (animal style) | Profile picker cards | `packages/web/public/images/avatars/pack-01/*.svg` | 192x192 each | P1 |
| `avatar-frame-default` | Neutral profile frame | Avatar component | `packages/web/public/images/avatars/frame-default.svg` | 256x256 | P1 |
| `avatar-frame-selected` | Selected profile frame with glow | Avatar selected state | `packages/web/public/images/avatars/frame-selected.svg` | 256x256 | P1 |
| `thumb-counting-picnic` | Picnic counting hero thumbnail | Game card/selection | `packages/web/public/images/games/thumbnails/countingPicnic/thumb-16x10.webp` | 512x320 | P0 |
| `thumb-color-garden` | Color sorting garden thumbnail | Game card/selection | `packages/web/public/images/games/thumbnails/colorGarden/thumb-16x10.webp` | 512x320 | P0 |
| `thumb-letter-sound-match` | Listen-and-match letter thumbnail | Game card/selection | `packages/web/public/images/games/thumbnails/letterSoundMatch/thumb-16x10.webp` | 512x320 | P0 |
| `thumb-letter-tracing-trail` | Trace-path letter thumbnail | Game card/selection | `packages/web/public/images/games/thumbnails/letterTracingTrail/thumb-16x10.webp` | 512x320 | P0 |
| `thumb-picture-word-builder` | Picture-to-word assembly thumbnail | Game card/selection | `packages/web/public/images/games/thumbnails/pictureToWordBuilder/thumb-16x10.webp` | 512x320 | P0 |
| `bg-counting-picnic` | Subtle picnic game shell background | Counting Picnic | `packages/web/public/images/backgrounds/games/counting-picnic-shell.webp` | 1600x1000 | P1 |
| `bg-color-garden` | Subtle garden shell background | Color Garden | `packages/web/public/images/backgrounds/games/color-garden-shell.webp` | 1600x1000 | P1 |
| `bg-letter-sound-match` | Subtle letter classroom shell background | Letter Sound Match | `packages/web/public/images/backgrounds/games/letter-sound-match-shell.webp` | 1600x1000 | P1 |
| `bg-letter-tracing-trail` | Subtle tracing board shell background | Letter Tracing Trail | `packages/web/public/images/backgrounds/games/letter-tracing-trail-shell.webp` | 1600x1000 | P1 |
| `bg-picture-word-builder` | Subtle word-building shell background | Picture to Word Builder | `packages/web/public/images/backgrounds/games/picture-word-builder-shell.webp` | 1600x1000 | P1 |
| `parent-stat-games` | Games played stat icon | Parent dashboard metric card | `packages/web/public/images/illustrations/parent/stat-games.svg` | 160x160 | P2 |
| `parent-stat-minutes` | Learning minutes stat icon | Parent dashboard metric card | `packages/web/public/images/illustrations/parent/stat-minutes.svg` | 160x160 | P2 |
| `parent-stat-streak` | Streak stat icon | Parent dashboard metric card | `packages/web/public/images/illustrations/parent/stat-streak.svg` | 160x160 | P2 |
| `parent-stat-activity` | Daily activity stat icon | Parent dashboard metric card | `packages/web/public/images/illustrations/parent/stat-activity.svg` | 160x160 | P2 |
| `empty-not-found` | Friendly lost-in-storybook illustration | 404 page | `packages/web/public/images/illustrations/empty/not-found.svg` | 512x512 | P2 |
| `empty-no-progress` | Encouraging empty progress state | Parent empty states | `packages/web/public/images/illustrations/empty/no-progress.svg` | 512x512 | P2 |
| `empty-no-games` | Encouraging no-games state | Home/game list fallback | `packages/web/public/images/illustrations/empty/no-games.svg` | 512x512 | P2 |

## 4) Implementation Priorities

## Phase P0 (ship first)

- Core mascot state pack (`hero/hint/success/loading`, RTL-first)
- Topic icon trio (numbers/letters/reading)
- Home background
- All five active game thumbnails (`countingPicnic`, `colorGarden`, `letterSoundMatch`, `letterTracingTrail`, `pictureToWordBuilder`)

Impact:

- Immediately removes highest-visibility placeholder visuals.
- Improves game discoverability and first-tap comprehension.
- Gives FED enough assets to wire stateful mascot guidance.

## Phase P1

- Landing + topic pillar support icons (how/trust)
- Profile avatar pack + profile background
- Per-game shell backgrounds

Impact:

- Strengthens continuity between marketing and in-app experience.
- Reduces repetition and visual fatigue in repeated sessions.

## Phase P2

- Parent dashboard iconography
- Empty-state illustration pack
- LTR fallback mascot variants for future locale expansion

Impact:

- Raises polish for parent-facing and edge-state UX without blocking core child flows.

## 5) FED Integration Requirements

- Replace emoji primary visuals with image assets behind typed props (fallback emoji allowed only while assets are missing).
- Keep all interactive dimensions at Dubiland standards (`>=60px` primary actions, `>=44px` minimum secondary).
- Preserve `prefers-reduced-motion` behavior and avoid motion-only feedback.
- Keep mascot asset selection theme-aware (no hardcoded bear conditionals in game logic).

## 6) Media Generation Prompt Template (Nano Banana)

Use this template per asset request:

```text
Create a children's book style illustration for ages 3-7.
Subject: <asset description>
Mood: warm, inviting, safe, playful
Character spec (if Dubi appears): warm brown teddy bear, rosy cheeks, big friendly eyes, blue backpack with Hebrew letters
Composition notes: RTL-aware direction, one clear focal point, no text
Output: <SVG or WEBP>, transparent background for SVG assets
Target size: <dimensions>
```

## 7) Coordination Plan

- UX Designer owns asset semantics, priorities, and placement rules.
- Media Expert owns generation/export + file delivery to target paths.
- FED Engineer/FED Engineer 2 own component wiring and runtime fallbacks.
- QA validates RTL directionality, touch targets, and reduced-motion accessibility.

