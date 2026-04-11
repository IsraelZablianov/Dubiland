# DUB-675 — Learning-Science Backed Game Concepts

Date: 2026-04-11
Owner: Gaming Expert

## Scope
This document audits current Dubiland gameplay coverage and proposes 5 new game concepts grounded in early-learning science for ages 3-7.

All concepts below assume the mandatory Dubiland mechanics baseline from `docs/games/game-design-guidelines.md`:
- Audio-first prompts + replay (`▶`)
- Icon-first controls (`▶` replay, `↻` retry, `💡` hint, `→` next)
- Action-triggered validation only (no `check/submit/test` button)
- Minimum 44px touch targets

## 1) Catalog Audit (Engagement + Difficulty + Session Fit)

| Area | Strong coverage now | Gap affecting learning outcomes | Recommendation |
|---|---|---|---|
| Counting and quantity | `counting-picnic`, `more-or-less-market` provide counting/comparison loops with immediate feedback. | No dedicated subitizing fluency game (rapid quantity recognition without counting one-by-one). | Add a subitizing-first game for ages 3-5 to improve number sense foundation. |
| Early arithmetic | `number-line-jumps` covers addition with a strong 6-7 track. | No dedicated subtraction strategy game; decomposition (`make 10`) is missing. | Add subtraction + number composition pair before higher arithmetic fluency. |
| Letters and phoneme mapping | Strong: tracing, sound-match, confusable contrast, letter storybook. | No explicit CV blending bridge game before heavier decoding tracks. | Add a short phoneme blending game for ages 4-6. |
| Reading transfer | Strong: `picture-to-word-builder`, `sight-word-sprint`, `decodable-micro-stories`. | Encoding (spelling from sound) is under-covered; children mainly decode, not encode. | Add decoding-to-encoding bridge game (`spell-and-send`). |
| Engagement loops | Most specs include adaptive hints and micro-rewards. | Some loops still risk long rounds for youngest players if task density increases. | Keep round loops 20-45s each and cap sessions at 2-5 minutes for game mode. |

## 2) Proposed New Game Concepts (Prioritized)

## Concept 1 (P0): Subitizing Firefly Jars (Hebrew: צנצנות גחליליות)

### Learning goal
- Domain: Numbers (ages 3-5)
- Outcome: Instantly recognize quantities 1-5, then 6-9 (without counting each object aloud).

### Core mechanic
- A jar of fireflies flashes for 1-2 seconds.
- Child taps the matching quantity card (dots first, numerals later).
- Feedback fires immediately on tap.

### Difficulty sketch
- Easy (3-4): canonical dot patterns 1-3, 2 options.
- Medium (4-5): 1-5 mixed layouts, 3 options.
- Hard (5+): 1-9 with brief exposure + numeral transfer.
- Adaptive rule: after 2 misses, reduce options and slow flash speed.

### Progression and fun loop
- Each correct round lights one star in a night sky.
- Every 5 stars unlocks a tiny mascot animation variation.
- Session target: 8-12 rounds, 2-4 minutes.

### Learning-science backing
- Supports "concrete -> symbolic" progression (dots before numerals).
- Builds early number sense through subitizing, a known predictor of later arithmetic fluency.
- Uses low cognitive load (one variable per round: quantity).

### Benchmark pattern to borrow
- TinyTap-style fast tap rounds with immediate correction.
- Khan Kids style visual quantity representations before symbolic abstraction.

### Hebrew content + audio needs
- Number prompts (`אחת`, `שתיים`, ...).
- Encouragement cues and hint lines for "count with me" fallback.
- i18n family: `games.subitizingFireflyJars.*` + `feedback.encouragement.*`.

### FED implementation note
- React + `framer-motion` is sufficient (tap/select + micro animations).
- Use `xstate` for clear round state transitions.

## Concept 2 (P0): Build-10 Workshop (Hebrew: מעבדת בונים עשר)

### Learning goal
- Domain: Numbers (ages 5-7)
- Outcome: Compose/decompose numbers to 10 and 20 (part-whole understanding).

### Core mechanic
- Child drags blocks into a ten-frame (and later double ten-frame).
- Prompt asks to "build 8" or "complete 10 when 6 is already there".
- Validation occurs on each drop.

### Difficulty sketch
- Easy (5-6): complete targets 1-10 with full visual frame.
- Medium (6): missing-part tasks (`6 + ? = 10`).
- Hard (6-7): bridge to 20 using two frames and timed transfer prompts.
- Adaptive rule: after 2 misses, highlight open cells and reduce distractors.

### Progression and fun loop
- Toy workshop theme: each solved frame adds one part to a "robot helper" build.
- Soft streaks celebrate consistency, no penalties for breaks.
- Session target: 6-10 rounds, 3-5 minutes.

### Learning-science backing
- Ten-frame representation supports mental number structure and efficient strategies.
- Aligns with ZPD scaffolding: visual support fades as mastery rises.
- Repeated part-whole retrieval improves transfer to addition/subtraction.

### Benchmark pattern to borrow
- Khan Kids structured progression paths and visual manipulatives.
- Duolingo ABC-style short mastery loops with clear completion feedback.

### Hebrew content + audio needs
- Prompts for build, complete, and compare tasks.
- Hint ladders that verbalize part-whole relation (for example: "יש שש, כמה חסר לעשר?").
- i18n family: `games.build10Workshop.*`.

### FED implementation note
- DOM drag/drop via `@use-gesture/react` + animated slots.
- `xstate` recommended to enforce adaptive transitions cleanly.

## Concept 3 (P0): Subtraction Street (Hebrew: רחוב החיסור)

### Learning goal
- Domain: Numbers (ages 6-7)
- Outcome: Understand subtraction as "take away" and "difference" within 10/20.

### Core mechanic
- Story prompt: "Help דובי give away 3 apples from 9".
- Child taps/removes concrete objects first; later chooses matching equation card.
- Feedback fires after each removal/selection.

### Difficulty sketch
- Easy (6): concrete take-away within 10, no symbolic distractors.
- Medium (6-7): take-away plus missing result card.
- Hard (6-7): mixed subtraction stories within 20 + inverse check (`? + 3 = 9`).
- Adaptive rule: after 2 misses, return to manipulatives and reduced choices.

### Progression and fun loop
- Neighborhood-delivery theme: each solved problem helps one character.
- End-of-session recap shows "families helped" instead of score pressure.
- Session target: 6-8 problems, 3-5 minutes.

### Learning-science backing
- Uses concrete-representational-symbolic (CRA) progression.
- Isolates one new variable per level (amount removed, then symbolic mapping).
- Encourages self-correction by showing the remaining set visually.

### Benchmark pattern to borrow
- TinyTap-style concrete object manipulation for arithmetic stories.
- Khan Kids narrative math prompts with immediate corrective support.

### Hebrew content + audio needs
- Story-based subtraction prompts and supportive error narration.
- Vocabulary consistency for subtraction language (`נשארו`, `פחות`, `הורדנו`).
- i18n family: `games.subtractionStreet.*`.

### FED implementation note
- React tap/remove + optional drag trays; no physics engine needed for v1.
- Keep controls icon-first and right-weighted for RTL layouts.

## Concept 4 (P1): Sound Slide Blending (Hebrew: מגלשת צלילים)

### Learning goal
- Domain: Letters/Phonics (ages 4-6)
- Outcome: Blend consonant + vowel into syllables before full word decoding.

### Core mechanic
- Child taps a consonant tile and a vowel (nikud) tile.
- A slider animation "blends" the sounds into one syllable.
- Child taps the matching picture/syllable card.

### Difficulty sketch
- Easy (4-5): CV blends with high-contrast sounds, 2 options.
- Medium (5-6): add confusable consonants and 3 options.
- Hard (6): short CVC or CV-CV sequences with reduced hints.
- Adaptive rule: after 2 misses, replay segmented sounds and reduce options.

### Progression and fun loop
- Playground theme: each successful blend moves דובי down a sound-slide track.
- Milestone rewards unlock new slide skins (theme-safe cosmetic only).
- Session target: 10-14 blends, 3-4 minutes.

### Learning-science backing
- Explicit phonological blending practice supports later decoding automaticity.
- Multisensory pairing (audio + visual + action) strengthens grapheme-phoneme binding.
- Keeps cognitive load low by introducing one phonics contrast at a time.

### Benchmark pattern to borrow
- Duolingo ABC phonics animation style (sound chunk -> blend -> apply).
- Khan Kids gentle correction + quick retry loops.

### Hebrew content + audio needs
- Isolated phoneme recordings + blended syllable recordings.
- Minimal-pair prompt sets to prevent pure guessing.
- i18n family: `games.soundSlideBlending.*`.

### FED implementation note
- React + `framer-motion` for blend animation; no heavy canvas required.
- Add precise audio timing hooks to avoid overlap artifacts.

## Concept 5 (P1): Spell-and-Send Post Office (Hebrew: דואר מאייתים)

### Learning goal
- Domain: Reading/Writing bridge (ages 6-7)
- Outcome: Convert heard words into correctly ordered Hebrew letter strings.

### Core mechanic
- Child hears a target word and drags letters into RTL slots on a postcard.
- When slots are filled, system validates automatically and "sends" the postcard.
- Immediate correction highlights only the first wrong position.

### Difficulty sketch
- Easy (6): 3-letter pointed words, limited distractors.
- Medium (6-7): 4-letter words, reduced pointing.
- Hard (6-7): short phrase chunks and morphological variants.
- Adaptive rule: after 2 misses, provide segmented audio and lock correct first letter.

### Progression and fun loop
- Collected postcards form a "Dubi delivery album" (intrinsic progress artifact).
- Variable micro-rewards (stickers/stamps) maintain novelty.
- Session target: 5-7 words, 3-5 minutes.

### Learning-science backing
- Encoding practice (spell from sound) improves orthographic mapping and reading transfer.
- Retrieval-based recall is stronger than recognition-only tasks.
- Error-first-position feedback supports self-correction without overload.

### Benchmark pattern to borrow
- TinyTap letter-arrangement interactions for short literacy loops.
- Duolingo ABC-style mastery progression with immediate retry.

### Hebrew content + audio needs
- Word lists by nikud level and morphology difficulty.
- Segmented syllable audio for hint mode.
- i18n family: `games.spellAndSend.*`.

### FED implementation note
- Start with DOM drag/drop (`@use-gesture/react`) and optional tap-to-place fallback.
- Use explicit state machine to manage hint escalation.

## 3) Improvements to Existing Games (Immediate High-Impact)

1. `counting-picnic.md`: Add a "flash quantity" mini-round every 3 rounds to introduce subitizing transfer (1-5).
2. `number-line-jumps.md`: Insert a pre-round concrete object bridge (dots/objects) for first 2 levels before pure number-line jumps.
3. `letter-sound-match.md`: Strengthen adaptive distractor logic so post-failure distractors are less confusable before escalating again.
4. `picture-to-word-builder.md`: Add first-error-position highlight and segmented replay after two misses to reduce random drag guessing.
5. `decodable-micro-stories.md`: Enforce one interaction checkpoint every 20-35 seconds to sustain active reading vs passive listening.
6. `letter-sky-catcher.md`: For 3.5-4.5 support mode, cap object velocity and reduce lane count after failure streaks.

## 4) Recommended Build Sequence for PM

1. Build `Subitizing Firefly Jars` and `Build-10 Workshop` first (foundational math gap closure with broad age impact).
2. Build `Subtraction Street` next (completes arithmetic triangle with current addition coverage).
3. Parallel-spec `Sound Slide Blending` and `Spell-and-Send Post Office` for reading transfer depth.

## 5) Learning-Science Sources Used in This Proposal

- Dubiland shared standards in `docs/knowledge/children-ux-best-practices.md` (ZPD scaffolding, cognitive load limits, immediate feedback, touch ergonomics).
- Dubiland game baseline in `docs/games/game-design-guidelines.md` (icon-first controls, action-triggered validation, audio-first rules).
- Applied evidence patterns from early numeracy and literacy research:
  - Subitizing and structured quantity representations as early number-sense predictors.
  - Concrete-representational-symbolic progression for arithmetic conceptual stability.
  - Explicit phonological blending and encoding practice for decoding/orthographic transfer.
