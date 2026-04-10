# Handbook UX Layout System + Interaction Zones

## Context

- Source task: [DUB-381](/DUB/issues/DUB-381)
- Parent program: [DUB-377](/DUB/issues/DUB-377)
- Supporting UX baseline: `docs/architecture/2026-04-10-handbook-rtl-page-shell-ux-spec.md`
- Mechanics alignment input: `docs/games/interactive-handbooks-mechanics.md`
- Literacy alignment input: `docs/games/handbook-literacy-interaction-framework.md`
- Child UX foundation: `docs/knowledge/children-ux-best-practices.md`

This document defines a reusable, RTL-first page layout system and interaction-zone rules for handbook pages, then maps those rules into wire-level recommendations for the first three launch-priority handbook slots (one per age band).

## 1) Reusable Page Layout System (RTL-First)

### 1.1 Viewport Contracts

| Device class | Reference viewport | Orientation priority | Notes |
|---|---|---|---|
| Tablet primary | `1024x768` | Landscape first | Main production target for age 3-7 hands and reach. |
| Tablet secondary | `768x1024` | Portrait | Same zone order, reduced stage height. |
| Mobile fallback | `390x844` | Portrait | Keep same behavior, collapse decorative density only. |

### 1.2 Fixed Zone Stack (Top -> Bottom)

All handbook pages use the same zone order so children do not re-learn controls page to page.

1. `topSystemBar`: parent gate (top-left), progress rail (RTL flow), optional page chip.
2. `storyStage`: main illustration and motion layer (single focal visual).
3. `instructionStrip`: replay + short spoken prompt anchor.
4. `interactionSurface`: appears only on interactive pages; hidden on pure story pages.
5. `mascotRail`: fixed Dubi safe area, bottom-left in RTL.
6. `navHotspots`: edge tap/swipe zones for previous/next, active only when interaction lock is off.

### 1.3 Zone Size Ratios

| Zone | Landscape tablet | Portrait tablet | Mobile fallback |
|---|---|---|---|
| `topSystemBar` | 10% height | 9% height | 8% height |
| `storyStage` | 46-52% height | 38-44% height | 34-40% height |
| `instructionStrip` | 10-12% height | 10-12% height | 10-12% height |
| `interactionSurface` | 22-28% height | 28-34% height | 32-38% height |
| `mascotRail` overlay | 15-20% viewport height | 14-18% | 12-16% |

Rules:

- Preserve interaction controls before preserving decorative art.
- On smaller viewports, shrink `storyStage` first, then motion embellishments, never target sizes.
- Maintain 12-16px separation between all tappable controls.

### 1.4 Page Template Library

| Template | When to use | Core zones | Child load target |
|---|---|---|---|
| `L0 Story Focus` | Narrative setup and transitions | top bar + story stage + instruction strip + nav + mascot | One action (tap next/replay). |
| `L1 Choice Prompt` | Tap/select challenges | all zones, compact interaction card | Max 2-3 choices (age dependent). |
| `L2 Manipulation` | Drag/sort/count with movement | all zones, expanded interaction card | Single task with clear start/end. |
| `L3 Reading Checkpoint` | Decoding + short comprehension | all zones, text-first interaction card | One prompt at a time, no side tasks. |

Template rules:

- A page may host only one primary interaction template.
- Never combine `L2` and `L3` on one page.
- Reward state is an overlay state on the same template, not a separate screen.

## 2) Interaction-Zone Placement Rules

### 2.1 Zone Map and Ownership

| Zone key | Placement (RTL) | Allowed interactions | Forbidden content |
|---|---|---|---|
| `Z1 parentGate` | Top-left corner | Parent hold action only | Child game controls |
| `Z2 progressRail` | Top-right toward left | Passive status + optional page dots | Animated distractions |
| `Z3 stagePrimary` | Upper center | Story hotspot taps, guided highlights | Dense UI controls |
| `Z4 instructionReplay` | Below stage, right-aligned cluster | replay (`▶`), pause, short cue | Large choice sets |
| `Z5 interactionCard` | Lower center | Choice chips, drag targets, hint/retry | Decorative mascot overlays |
| `Z6 mascotRail` | Bottom-left safe area | Dubi idle/feedback animation | Mandatory controls |
| `Z7 navPrev` | Right edge hotspot | `prevPage` when unlocked | Prompt choices |
| `Z8 navNext` | Left edge hotspot | `nextPage` when unlocked | Prompt choices |

### 2.2 Touch and Spacing Constraints

| Element class | Minimum | Recommended | Spacing |
|---|---|---|---|
| Primary answer targets | 60px | 72-80px | 16px |
| Story hotspots | 60px | 72px | 16px |
| Replay/hint/retry controls | 44px | 48-56px | 12px |
| Parent gate trigger | 44px | 48px + 1.2s hold | Isolated |

Mandatory behavior:

- Feedback within 100ms for every tap (visual + audio).
- No bottom-edge-only critical targets.
- No more than one high-saturation CTA per state.

### 2.3 Locking Rules (Prevent Accidental Navigation)

- When `interactionRequired=true`, disable `Z7` and `Z8`.
- During drag operations, suppress page-swipe until release.
- During success celebration, lock input for 700-1000ms max, then auto-return control.
- After two failed attempts, scaffold within `Z5` only; do not move controls.

## 3) Visual Direction by Age Band

| Attribute | Ages 3-4 | Ages 5-6 | Ages 6-7 |
|---|---|---|---|
| Max simultaneous choices | 2-3 | 3-4 | 4-5 |
| Primary label size | 24-28px | 22-26px | 20-24px |
| Body/caption size | 22-24px | 20-22px | 20px min |
| Interaction card density | Very low, large gaps | Medium | Medium-high with grouping |
| Motion tempo | 400-500ms entrances | 320-420ms | 280-360ms |
| Hint cadence | Auto hint after first miss or 4-5s idle | Auto hint after first miss or 6s idle | Auto hint after second miss or 8s idle |
| Contrast emphasis | Strong warm primaries | Balanced warm/cool | Slightly calmer palette for focus |

Readability rules:

- Hebrew sans only (`Heebo`, `Rubik`, `Assistant`), no italics.
- Line height 1.5-1.7 in prompt cards.
- Text never carries meaning alone; always pair icon + audio.

## 4) Wire-Level Recommendations for Launch Priority Books

Note: [DUB-378](/DUB/issues/DUB-378) has not yet published the final market-prioritized titles. To unblock production, these wire recommendations are mapped to launch slots by age band (`Launch-A`, `Launch-B`, `Launch-C`) and can be rebound to final book names without layout rework.

### 4.1 Launch-A (Age 3-4) Wire: Story + Counting/Color Basics

Recommended sequence (8 pages):

- `p1 L0`: character intro, no challenge.
- `p2 L1`: two-choice color prompt.
- `p3 L0`: short narrative bridge.
- `p4 L1`: count-to-3 choice.
- `p5 L0`: transition.
- `p6 L2`: simple tap-in-order (1-3).
- `p7 L0`: pre-finale.
- `p8 L1`: recap pick-one card.

Wire intent:

- Keep interaction card at 70-78% viewport width (large answer chips).
- Keep one dominant hotspot in `Z3`; avoid multi-object hunts.
- Dubi occupies `Z6` with stronger guidance animation on idle.

### 4.2 Launch-B (Age 5-6) Wire: Story + Letter/Math Mix

Recommended sequence (10 pages):

- `p1 L0`, `p2 L1`, `p3 L2`, `p4 L0`, `p5 L1`, `p6 L2`, `p7 L3`, `p8 L1`, `p9 L0`, `p10 L1`.

Wire intent:

- Interaction card at 62-70% viewport width to allow 3-option clusters.
- Use segmented prompt row: `replay` + icon cue + short text label (parent support only).
- Drag targets must stay inside central lower card bounds; no edge drops near nav hotspots.

### 4.3 Launch-C (Age 6-7) Wire: Reading + Comprehension Flow

Recommended sequence (12 pages):

- `p1 L0`, `p2 L1`, `p3 L3`, `p4 L0`, `p5 L2`, `p6 L3`, `p7 L1`, `p8 L3`, `p9 L0`, `p10 L2`, `p11 L3`, `p12 L1`.

Wire intent:

- Text-first checkpoint pages (`L3`) should reduce story-stage visual noise by ~25%.
- Keep decode targets in horizontal RTL scanning order (right-to-left chips/words).
- Comprehension card uses one question + max 4 choices, never stacked multi-question forms.

### 4.4 Shared Wire Frame (All Launch Slots)

```
+------------------------------------------------------+
| Z1 Parent Gate |      Z2 Progress Rail (RTL)        |
+------------------------------------------------------+
|                                                      |
|                Z3 Story Stage                        |
|            (single focal visual)                     |
|                                                      |
+------------------------------------------------------+
| Z4 Instruction / Replay Cluster                       |
+------------------------------------------------------+
|                Z5 Interaction Card                   |
|      (choices / drag / read checkpoint)              |
+------------------------------------------------------+
| Z6 Mascot Rail (bottom-left)   Z7/Z8 Edge Nav        |
+------------------------------------------------------+
```

## 5) Media + Mechanics Coordination Contracts

For [DUB-380](/DUB/issues/DUB-380) (Gaming Expert):

- Keep interaction input models mapped to templates (`L1`, `L2`, `L3`) without adding new shell zones.
- Any new mechanic must declare a zone footprint before approval.

For [DUB-383](/DUB/issues/DUB-383) (Media Expert):

- Character focal points must avoid `Z4` and `Z5` bounding boxes.
- Motion clips in `Z3` should preserve a clear non-animated patch for hint highlights.
- Dubi reaction states should remain inside `Z6` only.

## 6) FED Handoff Checklist

- Implement template switcher (`L0-L3`) without route-level layout branching.
- Enforce zone locks through reader state (`interactionRequired`, `successBurst`, `dragActive`).
- Keep all strings i18n-driven and map each child-facing label to audio.
- Validate touch targets and safe spacing on `1024x768`, `768x1024`, and `390x844`.

## 7) UX Acceptance Criteria

- One clear next action is always visible.
- No mandatory interaction control appears in bottom-edge wrist-conflict area.
- After wrong answers, retry path stays on the same page with supportive feedback.
- Launch slot wires can be rebound to final top-3 book titles without zone changes.
