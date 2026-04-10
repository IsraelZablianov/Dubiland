# 2026-04-10 UX Overhaul Spec (DUB-496)

Owner: UX Designer  
Status: Ready for FED implementation  
Scope: Home, game cards, game screens, handbook reader, login, navigation shell

## Benchmark Snapshot (Web Audit)

Reviewed references:

- TinyTap App Store page: https://apps.apple.com/us/app/tinytap-kids-learning-games/id493868874
- Khan Academy Kids App Store page: https://apps.apple.com/us/app/khan-academy-kids/id1378467217
- Lingokids App Store page: https://apps.apple.com/us/app/lingokids-play-and-learn/id1002043426
- HOMER App Store page: https://apps.apple.com/us/app/homer-fun-learning-for-kids/id601437586
- Endless Alphabet official page: https://www.originatorkids.com/endless-alphabet/

Patterns worth adopting:

1. Guided path with independent play: clear progression and low-friction play start.
2. No-stress learning loops: avoid high-pressure scoring and punitive failure states.
3. Large visual affordances: interaction first, text second.
4. Parent trust in-view: safety/ad-free/privacy and educational framing are visible early.
5. Character + motion as guidance: animation is instructional, not decorative.

## Audit Findings

## P0 Systemic Defects

1. Token contract is incomplete. Multiple variables used across games are undefined, causing silent CSS fallback and visual inconsistency.
2. Typography is too small for child-facing reading contexts (`12px`, `14px`, `16px` are common).
3. Action sizing is inconsistent (`44px`/`56px` buttons still appear in primary child flows).
4. App shell is mixed with marketing shell (`AppLayout` currently mounts `PublicHeader` + `PublicFooter`).

Undefined tokens currently referenced in production styles:

- `--color-accent-warning`
- `--color-warning`
- `--color-border`
- `--color-border-subtle`
- `--color-bg-surface`
- `--color-surface`
- `--color-surface-muted`
- `--font-size-base`
- `--motion-duration-fast`
- `--space-2xs`

## Per-Surface Remediation

| Surface | What is wrong now | Required change |
|---|---|---|
| Home (`Home.tsx`) | Too many concurrent decisions for ages 3–4: topic cards + age filter + game grid + start CTA on one screen. Progress indicators are thin and text-heavy. | Age-adaptive layout: show max 3 choices for ages 3–5, progressive reveal for more. Keep one dominant CTA at a time. Replace thin bars with chunked progress pills + audio cue on update. |
| Game Cards (`GameCard.tsx`) | Card is `div role="button"`, metadata density is high, tag chips are too small (`30px` height, `12px` text). | Use semantic `<button>` card, minimum interactive row `52px+`, reduce metadata to 2 badges max, make play affordance explicit (icon + pulse). |
| Game Screens (`*Game.tsx` pages + game components) | Back/navigation controls vary by page and size. Round progress dots are often tiny (10–14px) and low-meaning. Instruction pattern is not unified. | Introduce shared `GameTopBar` with consistent back, progress, and replay-instruction actions. Enforce pre-round demo on round 1. Standardize feedback cadence (visual + audio within 100ms). |
| Handbook Reader (`InteractiveHandbook.tsx`, `InteractiveHandbookGame.tsx`) | Bookshelf cards are dense for pre-readers, relies on hover lift, and uses undefined motion/color tokens. | Shift to cover-first selection with one featured book and limited adjacent options. Add explicit tap states, define missing tokens, and keep title/subtitle at child-readable sizes. |
| Login (`Login.tsx`) | Parent auth and child quick-start are mixed in one dense panel; small helper text and multiple secondary actions compete. | Split flow: primary child-safe quick start, secondary parent sign-in group. Add trust row (ad-free/privacy/parent controls). Raise helper text scale to parent-legible minimum. |
| Navigation (`AppLayout.tsx`, `PublicHeader.tsx`) | Marketing/navigation elements leak into child play shell; action cluster is dense and text-heavy for touch use. | Create separate shells: `MarketingShell`, `ChildPlayShell`, `ParentShell`. Child shell gets icon-first nav and protected parent exit. Remove public footer from child gameplay routes. |

## Design Tokens V2 (Spec)

Adopt these as the baseline for child-facing UI:

```css
/* Touch */
--touch-min: 52px;                  /* secondary */
--touch-primary-action: 72px;       /* default primary */
--touch-primary-action-prominent: 80px;
--touch-filter-chip: 52px;

/* Typography */
--font-size-xs: 1rem;               /* 16px - parent/support only */
--font-size-sm: 1.125rem;           /* 18px */
--font-size-md: 1.25rem;            /* 20px - minimum child body */
--font-size-lg: 1.5rem;             /* 24px */
--font-size-xl: 1.875rem;           /* 30px */
--font-size-2xl: 2.25rem;           /* 36px */
--line-height-normal: 1.6;
--line-height-relaxed: 1.7;

/* Missing tokens to define immediately */
--space-2xs: 0.375rem;              /* 6px */
--motion-duration-fast: 220ms;
--font-size-base: var(--font-size-md);
--color-accent-warning: #FFC857;
--color-warning: #FFB020;
--color-border: color-mix(in srgb, var(--color-text-primary) 22%, transparent);
--color-border-subtle: color-mix(in srgb, var(--color-text-primary) 12%, transparent);
--color-bg-surface: color-mix(in srgb, var(--color-bg-card) 92%, white 8%);
--color-surface: var(--color-bg-surface);
--color-surface-muted: color-mix(in srgb, var(--color-bg-secondary) 62%, var(--color-bg-card) 38%);
```

Topic color coding:

1. Numbers: warm yellow-orange family.
2. Letters: sky-blue family.
3. Reading: green-teal family.

Use highest saturation only for primary action and success moments.

## Component Pattern Specs (Implementation Contract)

1. `ChildPrimaryButton`
- Min block size `72px`, label `24px` bold, icon optional.
- States: idle, pressed, success, disabled.
- Always paired with tap audio and pressed visual in under `100ms`.

2. `GameTopBar`
- Elements: back, step progress, replay-instruction.
- Back target minimum `60px`; progress uses minimum `16px` nodes with clear done/current/upcoming distinction.
- Supports RTL order natively.

3. `GameCardV2`
- Entire card is one button.
- Top: illustration thumbnail.
- Middle: title + one supporting icon badge.
- Bottom: primary play cue and optional progress.
- No more than 2 supporting metadata chips.

4. `ChoiceTray`
- Enforces age-based max visible options:
  - ages `3–4`: `2–3`
  - ages `5–6`: `3–4`
  - ages `6–7`: `4–5`
- Additional options behind explicit “more” affordance.

5. `FeedbackBubble`
- Correct: sparkle + chime + positive phrase.
- Incorrect: gentle wobble + encouragement + immediate retry.
- Total feedback burst `~1s`, then return to interaction.

## FED Implementation Slicing

1. FED Engineer: child shell split (`AppLayout` separation), navigation patterns, home simplification.
2. FED Engineer 2: token contract completion, button/card sizing refactor, game card V2.
3. FED Engineer 3: game top bar unification across games, handbook bookshelf simplification.
4. QA (after merge): RTL layout, touch target sampling, reduced-motion behavior, tablet viewport pass.

## Acceptance Criteria

1. No undefined CSS variables remain in child-facing routes.
2. Child-facing body text is never below `20px`.
3. Primary child actions are at least `72px` tall.
4. Ages `3–5` never face more than 3 concurrent play choices.
5. Every primary interaction has visible + audio feedback in under `100ms`.
