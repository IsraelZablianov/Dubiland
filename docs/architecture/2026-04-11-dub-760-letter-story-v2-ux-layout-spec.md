# 2026-04-11 — DUB-760 Letter Story v2 UX Layout Spec (Continuous Narrative Route)

## Context

- Source issue: [DUB-760](/DUB/issues/DUB-760)
- Parent feature: [DUB-664](/DUB/issues/DUB-664)
- Related lanes:
  - Reading progression + narrative structure: [DUB-757](/DUB/issues/DUB-757)
  - i18n/audio script pack: [DUB-758](/DUB/issues/DUB-758)
  - Illustration pipeline: [DUB-759](/DUB/issues/DUB-759)
  - Engagement mechanics: [DUB-761](/DUB/issues/DUB-761)
  - Technical route/game owner: [DUB-762](/DUB/issues/DUB-762)
- Baseline references:
  - `docs/architecture/2026-04-11-letter-storybook-rtl-layout-navigation-spec.md`
  - `docs/architecture/2026-04-10-handbook-rtl-page-shell-ux-spec.md`
  - `docs/games/letter-storybook.md`
  - `docs/knowledge/children-ux-best-practices.md`

This document defines the **v2 UX shell contract** for a new standalone, continuous letter-story route. It is a delta-forward handoff for FED/Architect and does not replace the existing `LetterStorybookGame` route.

## 1) UX Outcome

The v2 route must feel like a single flowing story with letter learning embedded inside it:

1. One clear next action per beat (no competing CTAs).
2. Strong RTL orientation across swipe, tap zones, icon direction, and progress.
3. Audio-first guidance (screen must remain usable for pre-readers with text ignored).
4. Immediate response on every tap (visual + audio), including wrong taps.
5. Predictable rhythm: short scene -> micro interaction -> short celebration -> continue.

## 2) Route Boundary and Reuse Rules

### 2.1 New route requirement

- Implement as a **separate route + runtime** from the current `letterStorybook` flow.
- Keep existing letter storybook behavior unchanged while v2 is built.
- Reuse shared shell primitives (header scaffolds, token system, audio manager) where they do not force old information architecture.

### 2.2 Suggested route and runtime naming

- Suggested page route: `/games/reading/letter-story-v2` (final slug owned by [DUB-762](/DUB/issues/DUB-762)).
- Suggested game slug: `letterStoryV2`.
- Suggested runtime component: `LetterStoryV2Game`.

## 3) RTL Layout Contract (Tablet-Primary, Mobile-Safe)

### 3.1 Fixed zone stack (top -> bottom)

1. `storyHeader`: progress chip (`current/total`) + compact dot window.
2. `sceneStage`: dominant illustration and active letter focal object.
3. `narrationStrip`: tappable sentence strip (full-strip replay target).
4. `interactionLane`: one active task only (tap/choose/drag-lite).
5. `controlRail`: `previous`, `replay`, `next/complete`.
6. `mascotRail`: דובי anchored bottom-left without overlap.
7. `edgeNavLanes`: right edge previous, left edge next.

### 3.2 Zone proportions

| Viewport | `sceneStage` | `narrationStrip` | `interactionLane + controlRail` |
|---|---|---|---|
| 1024x768 landscape | 54-60% | 16-20% | 22-28% |
| 768x1024 portrait | 48-54% | 18-22% | 24-30% |
| 390x844 mobile fallback | 42-48% | 20-24% | 28-34% |

Rules:

- Preserve touch target minima before preserving decorative spacing.
- `sceneStage` min height: `280px` tablet, `220px` mobile.
- `narrationStrip` min height: `96px` all breakpoints.
- Never show more than one mandatory interaction card simultaneously.

## 4) Interaction Model (Ages 3-7)

### 4.1 Target size and spacing

| Element | Minimum | Preferred | Gap |
|---|---|---|---|
| Primary child actions (`next`, core choice, replay) | 60px | 72-80px | 12-16px |
| Secondary actions (`hint`, `retry`) | 44px | 48-56px | 12px |
| Drag/drop objects | 60px | 72px | 16px |
| Edge nav lanes | 72px width | 88-112px width | dedicated lane |

### 4.2 Age-band clarity caps

| Age band | Max visible choices | Interaction complexity | Instruction style |
|---|---|---|---|
| 3-4 | 2-3 | Tap + simple swipe | Demo animation + spoken cue only |
| 5-6 | 3-4 | + simple drag | Spoken cue + icon label |
| 6-7 | 4-5 | + moderate drag/sort | Spoken cue + icon + short text |

### 4.3 Response timing contract

- Tap feedback visible within `<=100ms`.
- Correct-action reward starts within `<=500ms`.
- Celebration duration `700-1000ms`, then immediate return to next action.
- Wrong answer: gentle wobble + encouragement audio + retry on same concept.

## 5) RTL Navigation Semantics

### 5.1 Gesture semantics

- Swipe left (`deltaX < 0`) -> `nextPage`.
- Swipe right (`deltaX > 0`) -> `previousPage`.
- Trigger threshold: horizontal travel `>=56px`, vertical drift `<=64px`.
- If interaction is required and unsolved, both swipe directions are locked.

### 5.2 Tap semantics

- Right control = previous.
- Left control = next.
- First page hides/disables previous.
- Final page replaces next with completion CTA.
- Locked controls stay visible-but-disabled to avoid layout jumps.

### 5.3 Edge safety

- No critical nav controls in bottom-most 10% of viewport.
- Edge lanes cannot overlap active interaction hit areas.

## 6) Page Transition Guidance (Page-Turn + Parallax)

Both patterns are allowed if guardrails are honored.

### Option A: Page-turn transition

- Use for explicit story beat boundaries and checkpoint jumps.
- Duration: `360-460ms`, ease-out curve.
- Lock new input during transition.
- Keep narration continuity: do not cut active sentence mid-phoneme; finish current clip or fade <=120ms.

### Option B: Layered parallax scene shift

- Use inside chapter flow where scene continuity is important.
- Layer depth: max 3 planes (`back`, `mid`, `front`).
- Parallax offset cap: <=8% viewport width to reduce motion load.
- Keep one focal moving element; avoid multi-axis decorative drift.

### Shared guardrails

- Honor `prefers-reduced-motion`: swap to fade + subtle scale only.
- No rapid flashing or high-frequency oscillation.
- During required interactions, freeze page-turn/parallax navigation triggers.
- Transition never delays feedback for tap correctness.

## 7) Audio-First + i18n Contract

- No hardcoded Hebrew UI text in runtime components.
- Every child-visible label and prompt maps to i18n key + audio asset.
- Required families (proposed):
  - `games.letterStoryV2.header.*`
  - `games.letterStoryV2.controls.{previous,replay,next,complete,hint,retry}`
  - `games.letterStoryV2.story.*`
  - `games.letterStoryV2.prompts.*`
  - `games.letterStoryV2.feedback.*`
- Narration strip must be fully tappable and replayable (not icon-only).

## 8) Accessibility and Comprehension Rules

1. One purpose per screen and one active prompt at a time.
2. Color is never the only signal (pair with icon/shape/audio).
3. Hebrew readability:
   - body >=20px
   - button labels >=20px bold
   - line-height `1.5-1.7`
4. Contrast target: at least `4.5:1` for text surfaces.
5. Parent-only controls must be childproofed (hold-to-open or gated entry).
6. After 2 failures on the same prompt: scaffold down in this order:
   - glow hint
   - spoken hint
   - fewer options
   - micro demonstration

## 9) Token Contract (v2 Delta)

Existing `--handbook-*` and `--storybook-*` tokens remain the base system. Add only v2-specific tokens needed for the continuous narrative shell:

- `--storybook-v2-scene-min-block-size: clamp(220px, 44vh, 420px);`
- `--storybook-v2-text-strip-min-block-size: clamp(96px, 14vh, 140px);`
- `--storybook-v2-control-rail-min-block-size: clamp(88px, 13vh, 132px);`
- `--storybook-v2-parallax-shift-max: 8vw;`
- `--storybook-v2-page-turn-duration: 420ms;`
- `--storybook-v2-transition-lock-duration: 460ms;`
- `--storybook-v2-focus-ring-size: 3px;`
- `--storybook-v2-progress-chip-min-inline-size: 9.5rem;`

## 10) FED Handoff Contract

### 10.1 Runtime state shape (proposed)

```ts
type StoryV2TransitionMode = 'page_turn' | 'parallax' | 'reduced_motion';

interface LetterStoryV2ShellState {
  isRtl: boolean;
  pageIndex: number;
  totalPages: number;
  transitionMode: StoryV2TransitionMode;
  interactionRequired: boolean;
  interactionSolved: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isNarrationPlaying: boolean;
  ageBand: '3-4' | '5-6' | '6-7';
}
```

### 10.2 Implementation expectations

1. Keep route isolated from `LetterStorybookGame` runtime.
2. Keep progress chip + local dot window visible in all story states.
3. Keep replay reachable in one tap from any non-error state.
4. Keep דובי in consistent bottom-left rail without covering active targets.
5. Keep transition mode configurable per page (page-turn vs parallax) with reduced-motion fallback.

## 11) QA Acceptance Checklist

- [ ] Tablet and mobile preserve zone hierarchy without shrinking primary actions below 60px.
- [ ] Swipe/tap navigation is RTL-correct across all pages.
- [ ] Mandatory interactions lock progression consistently for swipe + tap.
- [ ] Transition modes respect motion guardrails and reduced-motion behavior.
- [ ] Narration strip replay works in one tap and exposes clear playing state.
- [ ] All child-facing labels/prompts are i18n-backed and audio-backed.
- [ ] Child lane never shows more choices than the active age-band cap.

## 12) Checkpoint Status (2026-04-11)

- Scope: this UX shell contract is complete for first checkpoint.
- ETA: ready for FED/Architect integration immediately after [DUB-762](/DUB/issues/DUB-762) confirms final route slug and runtime file map.
- Blockers: no hard blocker for shell build; final narrative beat count and asset pacing from [DUB-757](/DUB/issues/DUB-757), [DUB-758](/DUB/issues/DUB-758), and [DUB-759](/DUB/issues/DUB-759) will tune page-level ratios and transition density.
