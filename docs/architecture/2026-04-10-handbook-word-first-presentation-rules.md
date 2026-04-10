# 2026-04-10 — Handbook Word-First Presentation Rules (DUB-489)

## Context

- Source issue: [DUB-489](/DUB/issues/DUB-489)
- Parent scope: [DUB-483](/DUB/issues/DUB-483)
- Implementation lane: [DUB-488](/DUB/issues/DUB-488)
- Content/audio lane: [DUB-490](/DUB/issues/DUB-490)
- Related UI baselines:
  - `docs/architecture/2026-04-10-handbook-page-layout-illustration-text-interaction-spec.md`
  - `docs/architecture/2026-04-10-handbook-storybook-frame-illustration-hierarchy-spec.md`
  - `docs/games/handbooks/ux-layout-system-interaction-zones.md`

This spec defines acceptance criteria for word-first reinforcement on interactive handbook pages for ages 3-7.

## 1) UX Goal

When the learning objective is a target word, children must see and hear that word as the primary element.

- Hero element: isolated target word (`wordText`)
- Secondary element: optional short support sentence (`supportText`)
- Tertiary elements: prompts, controls, metadata

Children should not need to parse long sentence text to understand what to tap or repeat.

## 2) Word-First Hierarchy Contract

On reinforcement pages, apply this fixed hierarchy:

1. `wordHero`: single target word in the highest visual priority slot.
2. `wordRepeatRail`: optional repeated word chips (same word only) for rhythm/repetition.
3. `supportSentence`: short context sentence, visually de-emphasized.
4. `interactionPrompt`: one action instruction, never competing with `wordHero`.

Rules:

- `wordHero` must remain visible during the entire interaction state.
- `wordHero` must not share line with sentence text.
- Sentence blocks longer than 7 words are never child-primary.
- If space is constrained, remove `supportSentence` first, not `wordHero`.

## 3) Sentence Visibility Rules (Secondary vs Hidden)

Use these rules to decide whether sentence text is shown, minimized, or hidden.

| Page intent | Ages 3-4 | Ages 5-6 | Ages 6-7 |
|---|---|---|---|
| Word introduction/reinforcement | Hidden by default | Secondary (1 short line) | Secondary (1 short line) |
| Tap/select target-word question | Hidden until answer resolves | Secondary muted line | Secondary muted line |
| Drag/sort around target word | Hidden | Secondary (optional) | Secondary (optional) |
| Decoding checkpoint (`L3`) | Secondary only after word focus appears | Secondary visible | Secondary visible |
| Literal comprehension checkpoint | Secondary visible | Secondary visible | Secondary visible |

Additional rules:

- Hidden sentence state can still be available through replay narration; do not force child reading of sentence text.
- On success, sentence may fade in for 1200-1800ms recap, then return to default state.
- Never present both long sentence copy and multi-option choices at the same visual weight.

## 4) Layout + Readability Rules

### 4.1 Word hero placement

- Place `wordHero` in the text lane directly below illustration, aligned RTL start.
- Reserve at least 60% of text-lane visual weight for `wordHero` on reinforcement pages.
- Keep minimum vertical separation of 12px between `wordHero` and any support sentence.

### 4.2 Typography targets

| Role | Tablet landscape | Tablet portrait | Mobile fallback |
|---|---|---|---|
| `wordHero` | 40-52px | 36-48px | 32-40px |
| `wordRepeatRail` chips | 28-36px | 26-32px | 24-30px |
| `supportSentence` | 20-24px | 20-22px | 18-20px |

Rules:

- Hebrew sans fonts only (`Rubik`, `Heebo`, `Assistant`).
- `wordHero` line-height: `1.15-1.25`; support sentence line-height: `1.5-1.65`.
- Support sentence max 2 lines and should not exceed 65% opacity contrast relative to `wordHero` emphasis.

## 5) Interaction + Audio Behavior

- Reinforcement narration default should speak the target word first.
- If support sentence exists, play it only after word audio or on explicit replay flow.
- Each tap on `wordHero` replays word audio and visual pulse within 100ms.
- Wrong answer feedback keeps `wordHero` fixed in place; never replace it with long corrective text.

## 6) RTL and Input Semantics

- `wordHero`, repeat chips, and support sentence must all align to RTL start.
- Any segmented word/chip sequence must render in right-to-left reading order.
- Next/prev navigation keeps existing handbook RTL semantics (next on left edge, previous on right edge).
- Do not mirror media controls (`play`, `pause`, `replay`) icons.

## 7) Validation Checklist (Required)

### 7.1 Child-facing hierarchy checks

- Target word is the first item seen in text lane on every reinforcement page.
- No sentence visually competes with `wordHero` (size, weight, color saturation).
- Ages 3-4 flows do not show sentence text by default on reinforcement pages.

### 7.2 Tablet/mobile layout checks

- Tested at `1024x768`, `768x1024`, `390x844`.
- `wordHero` remains fully visible and does not clip at any viewport.
- Primary interactions preserve `>=60px` targets (`>=72px` preferred), 16px spacing.

### 7.3 RTL checks

- All word-focused lanes align right and read right-to-left.
- Swipe and edge navigation semantics stay RTL-correct.
- No left-to-right fallback alignment appears in handbook word UI.

### 7.4 Audio checks

- Each child-facing target word has matching i18n + audio key coverage.
- Word replay latency remains <=250ms on tap.
- Sentence narration (if present) is secondary to word audio in playback order.

## 8) Implementation Boundary (Avoid Duplicate Tickets)

- This document is the UX acceptance contract for [DUB-488](/DUB/issues/DUB-488).
- Content/i18n/audio completeness stays in [DUB-490](/DUB/issues/DUB-490).
- Do not open parallel implementation tickets for the same word-first behavior unless scope expands beyond handbook surfaces.

## 9) Token Contract for FED

Use these handbook tokens as source of truth for word-first presentation:

- `--handbook-word-hero-font-size`
- `--handbook-word-hero-line-height`
- `--handbook-word-hero-letter-spacing`
- `--handbook-word-stack-gap`
- `--handbook-word-repeat-font-size`
- `--handbook-support-font-size`
- `--handbook-support-line-height`
- `--handbook-support-max-lines`
- `--handbook-support-emphasis-opacity`
