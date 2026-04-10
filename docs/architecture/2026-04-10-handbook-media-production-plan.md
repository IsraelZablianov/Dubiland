# 2026-04-10 — Handbook Media Production Plan (First Sample)

- Owner: Media Expert
- Related issues: [DUB-331](/DUB/issues/DUB-331), [DUB-325](/DUB/issues/DUB-325)
- Scope: Reusable animation/video production strategy for interactive handbooks, first-book media map, and playback constraints

## Context

[DUB-325](/DUB/issues/DUB-325) introduces interactive handbooks (5-20 pages) with narration, animation, and inline learning pauses. This document defines the media lane so FED, Content Writer, and QA can implement with stable contracts.

## Decision Summary

1. Use one reusable Remotion composition template for handbook pages, parameterized by page metadata and measured audio duration.
2. Keep narration audio as separate MP3 clips (i18n/audio pipeline) and render visual motion beds as page-level MP4/WebM assets.
3. Standardize a per-book media manifest to drive preloading, scene timing, and interaction pause points.
4. Optimize for tablet web playback first: predictable transitions, moderate motion, and strict preload budgets.

## Reusable Media Template Strategy

### Remotion composition set

- `HandbookPageTemplate`: Single page animation bed (background, mascot layer, props, optional motion overlay).
- `HandbookTransitionSting`: 0.6-1.0s transition bumper between pages (soft fade/slide only).
- `HandbookCelebrationSting`: reusable reward cue after correct interactions.

### Input contract (implementation target)

```ts
export interface HandbookPageMediaSpec {
  pageId: string;
  narrationAudioSrc: string;
  interactionCueAudioSrc?: string;
  celebrationAudioSrc?: string;
  backgroundSrc: string;
  lottieSrc?: string;
  props: Array<{src: string; enter: 'fade' | 'slide' | 'spring'; exit?: 'fade'}>;
  pacing: {
    introHoldSec: number;
    interactionPauseAtSec?: number;
    celebrationHoldSec?: number;
  };
}
```

### Duration model

- `calculateMetadata` measures narration and optional cue clips with `getAudioDurationInSeconds()`.
- `durationInFrames` is computed from measured seconds + fixed intro/outro holds.
- No hardcoded frame totals in page compositions.

### Motion vocabulary for ages 3-7

- Entrances: gentle `spring()` with low stiffness.
- Reading beats: `interpolate()` fade/slide, no rapid camera movement.
- Segment changes: soft crossfade from `@remotion/transitions`.
- Mascot behavior: idle loop during narration, clap/celebrate only after interaction completion.

## Media Manifest Contract

Per-book manifest file target:

- `packages/web/public/handbooks/{bookSlug}/media/manifest.json`

Manifest responsibilities:

- page ordering and IDs
- mapping to rendered page video beds
- narration/cue audio keys and source paths
- interaction pause timestamps
- preload tiers (`critical`, `next`, `lazy`)

## First Handbook Sample — Page Media Map

Proposed pilot book slug: `dubi-rainbow-key` (8 pages).

### Page-by-page plan

| Page | Learning beat | Media intent | Audio keys (planned) | Interaction pause | Core assets |
|---|---|---|---|---|---|
| `p01-cover` | Intro to story goal | Slow parallax cover + waving mascot | `common.handbooks.dubiRainbowKey.pages.p01.narration` | No | Cover background, mascot wave Lottie |
| `p02-count-fish` | Counting 1-5 | Pond scene with fish bobbing | `...p02.narration`, `...p02.prompt` | Yes, after prompt | Pond bg, 5 fish sprites, mascot point pose |
| `p03-color-flower` | Color recognition | Garden scene, flower petals highlight | `...p03.narration`, `...p03.prompt` | Yes | Garden bg, flower variants, sparkle overlay |
| `p04-code-4-plus-4` | Basic addition | Treasure lock appears, numbers animate in | `...p04.narration`, `...p04.prompt` | Yes | Cave bg, lock UI plate, number tokens |
| `p05-letter-dalet` | Letter identification | Signboard reveal with target letter focus | `...p05.narration`, `...p05.prompt` | Yes | Path bg, signboard frame, letter card art |
| `p06-drag-letter` | Letter matching | Three floating letter tokens with cue glow | `...p06.narration`, `...p06.prompt` | Yes | Token sprites, drop zone highlight |
| `p07-recap` | Reinforcement | Quick recap montage with badges | `...p07.narration` | No | Badge icons, mascot clap Lottie |
| `p08-finale` | Celebration + closure | Rainbow key unlock + confetti | `...p08.narration`, `...p08.celebration` | No | Finale bg, key prop, confetti Lottie |

### Asset checklist for first sample

- Mascot states: `idle`, `wave`, `point-right`, `thinking`, `clap`, `celebrate`.
- Backgrounds: `cover`, `pond`, `garden`, `cave`, `path`, `finale`.
- Interaction props: fish set (1-5), flower color variants, lock plate, number tokens, letter cards.
- Effects: sparkle, soft confetti, success badge pop.
- Posters: one JPEG poster per page bed for fast first paint.

## Export, Format, and Performance Constraints

### Render profiles

- Primary: `1280x720`, `30fps`, H.264 MP4, AAC audio.
- Secondary fallback (if decode issues on target device): `960x540`, `24fps`, H.264 MP4.
- Optional modern variant: WebM VP9 for bandwidth optimization where supported.

### Size budgets

- Page animation bed target: <= 4 MB/page (hard cap 6 MB/page).
- First 3 pages (`critical preload`) combined target: <= 18 MB.
- Full 8-page media pack target: <= 40 MB excluding narration MP3.

### Preload policy

- On book open: preload page video + poster + narration for `p01-p03`.
- On page turn: always preload `current+1` in background.
- Keep Lottie JSON local (`staticFile`) for deterministic startup.

### Playback behavior

- Story pauses during interaction segments; narration resumes only after answer resolution.
- Keep transition duration between 18-30 frames.
- Avoid hard cuts and high-amplitude flashes.

### QA gates before publish

- No blank frame at scene boundaries.
- No desync > 120ms between narration and visual cue.
- RTL-safe layout for overlays and prompt anchors.
- Touch targets for interactive overlays >= 44px.

## Handoff Sequence

1. Content Writer defines final Hebrew script keys for `common.handbooks.dubiRainbowKey.pages.*` and generates MP3 clips.
2. Media Expert renders page beds and transition stings from the shared Remotion template.
3. FED integrates manifest-driven preload + interaction pause logic in handbook reader UI.
4. QA validates timing, RTL behavior, and low-end tablet playback.

## Current Delivery Status

- Planning artifacts complete in this document.
- Ready for implementation once script keys/audio clips are available.
