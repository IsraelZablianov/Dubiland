# 2026-04-10 — Handbook RTL Page Shell UX + Interaction Spec (DUB-328)

## Context

- Source issue: [DUB-328](/DUB/issues/DUB-328)
- Parent feature: [DUB-325](/DUB/issues/DUB-325)
- Primary implementers: Architect + FED
- Audience: children ages 3-7 (pre-readers) with parent-guided setup
- Platform constraints: Hebrew RTL-first, tablet-primary, touch-only, audio-first, theme-aware

## 1) UX Outcome

The handbook reader must feel like a guided, interactive Hebrew story experience, not a static PDF:

1. Child always has one clear next action.
2. Story flow and interaction flow are separated, but visually unified.
3. Every page supports media + narration + optional inline challenge without layout jump.
4. Navigation remains predictable in RTL for both tap and swipe users.
5. Wrong answers are encouraging and recoverable within one tap.

## 2) Reader Route + Session Model

## Route contract (P0)

- Reader entry: `/handbooks/:handbookSlug`
- Optional resume: `/handbooks/:handbookSlug?page=:index`
- Source entry points:
  - Home/topic card launch
  - Resume card from progress surfaces

## Session rules

- Last completed page persists optimistically per child + handbook.
- Returning child lands on:
  - first unread page, or
  - explicit query `page` if provided and valid.
- Opening page always auto-plays narration once content is ready (unless parent paused narration globally).

## 3) RTL Navigation Model (Tap + Swipe)

## Page progression semantics

- Reading progression is right-to-left.
- `nextPage` advances the story toward the left.
- `prevPage` moves toward the right.

## Gesture and tap mapping

| Action | Gesture | Tap zone | Visible control | Motion direction |
|---|---|---|---|---|
| `nextPage` | swipe right -> left | left third of stage | left floating arrow | page exits left, next enters from right |
| `prevPage` | swipe left -> right | right third of stage | right floating arrow | page exits right, previous enters from left |
| `openPageList` (parent/optional) | none for child | top progress chip | page index sheet | no full-page transition |

Rules:

- Tap zones are active only when no inline interaction is open.
- During narration playback, page turn remains enabled except when page requires mandatory interaction.
- For ages 3-5, show only two high-emphasis nav affordances at once: `next/prev`.
- First page hides `prev`; last page replaces `next` with completion CTA.

## 4) Per-Page Layout Slot Contract

Each handbook page uses a fixed slot grid so media types can vary without re-learning the UI.

| Slot key | Purpose | Placement (RTL) | Recommended size | Notes |
|---|---|---|---|---|
| `progressRail` | page position + chapter status | top-right to top-left flow | 44-56px height | must stay visible in all states |
| `storyStage` | primary illustration | upper center | 40-52% viewport height | one focal visual only |
| `motionLayer` | Lottie/video overlay | anchored inside stage | max 35% of stage area | muted by default; no autoplay audio |
| `narrationBar` | replay/pause/next narration actions | below stage, full width | >=60px control row | persistent across pages |
| `interactionCard` | inline challenge surface | below narration bar | min 280px card, >=60px actions | appears only on interaction pages |
| `mascotGuide` | דובי guidance + emotional feedback | bottom-left safe area | 15-20% viewport height | never overlaps controls |
| `parentAccess` | parent-only controls | top-left corner | 44px trigger + hold gate | childproof entry |

Layout constraints:

- Maintain 12-16px safe spacing between all interactive targets.
- Keep bottom edge free of critical controls that compete with tablet wrist rest.
- In portrait tablets, `storyStage` shrinks before controls do.

## 5) State Model (Happy Path + Edge Cases)

| State | Trigger | UI behavior | Audio behavior | Exit condition |
|---|---|---|---|---|
| `preload` | handbook opened | show skeleton page + דובי loading | soft loading loop optional | required assets for current page resolved |
| `pageReady` | assets loaded | page rendered, controls enabled | narration auto-start queued | narration starts or parent pauses |
| `narrating` | narration active | progress rail animates per sentence chunk | primary narration track plays | narration complete, pause, or interaction gate |
| `interactionRequired` | page has mandatory challenge | page-turn controls dimmed, interaction card opens | spoken prompt + hint cue | success or manual retry loop |
| `interactionSuccess` | correct response | 700-1000ms celebration burst | success chime + short praise line | auto-advance to next page or resume story |
| `interactionRetry` | wrong response | gentle wobble + highlight hint | encouragement cue, no buzzer | child retries or hint escalates |
| `paused` | child/parent pauses | media freeze, clear resume affordance | narration stops, ambient optional | resume tap |
| `replayNarration` | replay button tap | text highlight resets to sentence 1 | narration restarts immediately | track ends or pause |
| `accessibilityPanelOpen` | parent hold action | overlay sheet, story dimmed | optional confirmation cue | close panel |
| `handoffEndPage` | last page completed | completion card + next destination CTA | completion jingle + farewell line | CTA tap |
| `assetError` | media load failure | fallback illustration + retry CTA | spoken reassurance + retry label | successful reload or skip by parent |

## 6) Interaction Pause + Feedback Rules

1. Mandatory interactions pause story progression until resolved.
2. After 2 failed attempts, scaffold down in this order:
   - visual glow hint
   - spoken hint
   - reduce answer choices
   - show micro-demo.
3. After success, return to story within 1 second (no long reward interstitial).
4. Retry never removes progress already earned on the page.
5. Wrong answers never use red full-screen error treatment.

## 7) Narration + Accessibility Controls

## Narration bar controls (child-safe)

- `replay` (always visible)
- `pause/resume`
- `next narration segment` (visible only if page has segmented narration)

All buttons:

- primary controls >=60px
- secondary controls >=44px
- tap feedback <100ms (visual + audio).

## Parent accessibility panel (hold-to-open)

- Hold trigger (top-left) for 1.2s to open.
- Controls in panel:
  - narration speed (`0.9x`, `1.0x`, `1.1x`)
  - SFX volume
  - captions toggle (parent-facing text only)
  - reduced motion override (in addition to system `prefers-reduced-motion`).

Reduced-motion behavior:

- Replace page-slide transitions with opacity + subtle scale.
- Keep success feedback via color glow + audio.
- Keep all interaction timing logic identical.

## 8) FED Component Contract (Implementation-Ready)

```ts
type HandbookReaderState =
  | 'preload'
  | 'pageReady'
  | 'narrating'
  | 'interactionRequired'
  | 'interactionSuccess'
  | 'interactionRetry'
  | 'paused'
  | 'accessibilityPanelOpen'
  | 'assetError'
  | 'handoffEndPage';

type HandbookMediaKind = 'illustration' | 'lottie' | 'video';
type HandbookInteractionKind = 'tap_choice' | 'drag_drop' | 'count_input' | 'letter_pick';

interface HandbookPageSlotContent {
  id: string;
  narrationKey: string;
  narrationAudioUrl: string;
  illustrationUrl: string;
  media?: {
    kind: HandbookMediaKind;
    url: string;
    posterUrl?: string;
    autoplayMuted?: boolean;
  };
  interaction?: {
    kind: HandbookInteractionKind;
    promptKey: string;
    promptAudioUrl: string;
    required: boolean;
    maxChoices?: number;
  };
}

interface HandbookReaderViewModel {
  handbookId: string;
  childId: string;
  pages: HandbookPageSlotContent[];
  currentPageIndex: number;
  visitedPageIndexes: number[];
  state: HandbookReaderState;
  narrationEnabled: boolean;
  reducedMotion: boolean;
}
```

Suggested file anchors:

- `packages/web/src/pages/HandbookReader.tsx`
- `packages/web/src/components/handbook/HandbookReaderShell.tsx`
- `packages/web/src/components/handbook/HandbookProgressRail.tsx`
- `packages/web/src/components/handbook/HandbookNarrationBar.tsx`
- `packages/web/src/components/handbook/HandbookInteractionCard.tsx`
- `packages/web/src/components/handbook/HandbookAccessibilityPanel.tsx`

## 9) i18n + Audio Contract

No hardcoded Hebrew in reader components.

Required key groups:

- `handbook.reader.nav.next`
- `handbook.reader.nav.previous`
- `handbook.reader.nav.replay`
- `handbook.reader.nav.pause`
- `handbook.reader.nav.resume`
- `handbook.reader.progress.pageXofY`
- `handbook.reader.feedback.success`
- `handbook.reader.feedback.tryAgain`
- `handbook.reader.feedback.loading`
- `handbook.reader.accessibility.title`
- `handbook.reader.accessibility.speed`
- `handbook.reader.accessibility.sfx`
- `handbook.reader.accessibility.captions`
- `handbook.reader.accessibility.reducedMotion`

Audio parity:

- Every visible label and every interaction prompt must have an MP3 mapping.
- Narration and prompt audio assets should be separated so replay never restarts unrelated page media.

## 10) Design Token + Touch Contract

Use existing tokens where possible:

- size: `--touch-min`, `--touch-primary-action`, `--touch-primary-action-prominent`
- motion: `--motion-page-transition-in`, `--motion-page-transition-out`, `--motion-success-burst`, `--motion-loading-pulse`
- color/surface: `--gradient-game-surface-warm`, `--color-bg-card`, `--color-text-primary`, `--color-text-secondary`

Handbook-specific additions recommended for FED/Architect lane:

- `--handbook-stage-min-height`
- `--handbook-progress-rail-height`
- `--handbook-nav-hotspot-width`
- `--handbook-interaction-card-max-width`
- `--handbook-caption-panel-z`

## 11) Acceptance Checklist

## UX behavior

- RTL next/previous mapping is consistent across tap + swipe.
- One clear primary action is visible at all times.
- Mandatory interactions pause progression and recover gracefully.
- Success/fail feedback returns to flow quickly (<1s celebration, immediate retry path).

## FED implementation readiness

- Slot layout contract can render illustration-only, media-rich, and interaction pages without shell changes.
- State model covers preload, narration, interaction, replay, and failure states.
- Accessibility panel is parent-gated and does not expose accidental child exits.

## QA validation

- Touch targets meet 44/60/72px contracts.
- `prefers-reduced-motion` path preserves comprehension.
- No hardcoded Hebrew strings in handbook components.
- Every reader-facing key has mapped audio coverage.

## 12) Delivery Note

This spec intentionally defines the shell and interaction contract only. Content sequencing and pedagogy specifics should be layered by [DUB-326](/DUB/issues/DUB-326) and [DUB-327](/DUB/issues/DUB-327), while schema/runtime integration follows [DUB-330](/DUB/issues/DUB-330).
