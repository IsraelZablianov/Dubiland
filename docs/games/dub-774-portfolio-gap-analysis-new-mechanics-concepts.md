# DUB-774 — Portfolio Gap Analysis + New Mechanics Concepts (Ages 3-7)

Date: 2026-04-11
Owner: Gaming Expert
Parent: [DUB-673](/DUB/issues/DUB-673)

## 1) Current Catalog Snapshot (Numbers, Letters, Colors)

| Domain | Live game count | Live route slugs | Coverage strength | Primary gap to close |
|---|---:|---|---|---|
| Numbers | 7 | `counting-picnic`, `more-or-less-market`, `shape-safari`, `number-line-jumps`, `build-10-workshop`, `subtraction-street`, `time-and-routine-builder` | Strong concrete -> symbolic path for ages 5-7. | No dedicated rapid subitizing loop (instant quantity recognition) for ages 3-5. |
| Letters | 3 | `letter-sound-match`, `letter-tracing-trail`, `letter-sky-catcher` | Strong recognition + tracing + attention game variety. | Missing explicit letter->syllable blending bridge before reading-lane decoding demand. |
| Colors | 1 | `color-garden` | Solid recognition/sorting baseline. | Color learning depends on one mechanic only; no color-mixing creation loop and no in-context color retrieval loop. |

Notes from audit:
- Session lengths in current specs often trend longer than ideal for youngest users (`5-10` minutes). Net-new concepts below are designed for `2-5` minute loops.
- `build-10-workshop` is already in the live catalog; it should be treated as an enhancement lane, not a net-new concept lane.

## 2) New Concept Proposals (5)

## Concept 1 (P0): Dot Flash Farm (Hebrew: חוות נקודות מהירות)

- Domain and age: Numbers, ages `3-5`
- Learning goal: Subitizing `1-5` (then `6-9`) before count-by-one dependence.
- Core mechanic:
  1. A dot card flashes for `0.8-1.5s`.
  2. Child taps the matching quantity card.
  3. Immediate feedback and next flash.
- Difficulty sketch:
  - Easy (`3-4`): quantities `1-3`, canonical dot patterns, 2 choices.
  - Medium (`4-5`): quantities `1-5`, mixed layouts, 3 choices.
  - Hard (`5+`): quantities `1-9`, brief flash, dot->numeral transfer.
  - Adaptive: after 2 misses, increase flash duration and reduce options by one.
- Hebrew content/audio needs:
  - `games.dotFlashFarm.instructions.*`
  - `games.dotFlashFarm.prompts.*`
  - `games.dotFlashFarm.hints.*`
  - `numbers.names.1-9`
- Competitor pattern adaptation:
  - Khan Kids: visual quantity-first representation.
  - Duolingo ABC: short high-frequency mastery loops.

## Concept 2 (P0): Color Mix Picnic (Hebrew: פיקניק ערבובי צבעים)

- Domain and age: Colors, ages `4-6`
- Learning goal: Build color understanding from recognition -> combination (`red+yellow=orange`) -> controlled shade handling.
- Core mechanic:
  1. Prompt asks for a target result color.
  2. Child drags 2 color drops into a bowl.
  3. Child taps one object matching the mixed result.
- Difficulty sketch:
  - Easy (`4-5`): primary colors only, 2 options.
  - Medium (`5-6`): primary->secondary mixing, 3 options.
  - Hard (`6`): one additional variable only (shade OR object rule, never both).
  - Adaptive: after 2 misses, show one-step guided mix preview and reduce distractors.
- Hebrew content/audio needs:
  - `games.colorMixPicnic.instructions.*`
  - `games.colorMixPicnic.prompts.mix.*`
  - `games.colorMixPicnic.hints.*`
  - `colors.names.*`
- Competitor pattern adaptation:
  - Khan Kids: concrete manipulative experimentation.
  - Duolingo ABC: immediate retry without punitive loss.

## Concept 3 (P1): Rainbow Rescue Camera (Hebrew: מצלמת חילוץ צבעים)

- Domain and age: Colors, ages `3-6`
- Learning goal: Transfer color recognition into cluttered real-scene attention tasks.
- Core mechanic:
  1. Child hears a color prompt.
  2. Child taps matching objects in a mini scene.
  3. Validation triggers per tap; round ends when all targets are found.
- Difficulty sketch:
  - Easy (`3-4`): 2 colors, high contrast, 2-3 targets.
  - Medium (`4-5`): 3-4 colors, one near-shade distractor.
  - Hard (`5-6`): color + category rule rounds only after stable success.
  - Adaptive: after 2 misses, reduce scene clutter and pulse one valid target.
- Hebrew content/audio needs:
  - `games.rainbowRescueCamera.instructions.*`
  - `games.rainbowRescueCamera.prompts.find.*`
  - `games.rainbowRescueCamera.hints.*`
  - `colors.names.*`, `objects.names.*`
- Competitor pattern adaptation:
  - Khan Kids: calm in-scene discovery framing.
  - Duolingo ABC: fast interaction cadence and replayable rounds.

## Concept 4 (P0): Sound Bridge Syllables (Hebrew: גשר הברות)

- Domain and age: Letters, ages `4-6`
- Learning goal: Bridge from isolated letters to CV blending before heavier decoding tasks.
- Core mechanic:
  1. Child taps consonant + nikud tile.
  2. Blend animation plays the combined syllable.
  3. Child selects matching syllable/picture target.
- Difficulty sketch:
  - Easy (`4-5`): high-contrast CV sets, 2 options.
  - Medium (`5-6`): one confusable pair family at a time, 3 options.
  - Hard (`6`): short CVC or CV-CV transfer with reduced support.
  - Adaptive: after 2 misses, segmented replay + option reduction.
- Hebrew content/audio needs:
  - `games.soundBridgeSyllables.instructions.*`
  - `games.soundBridgeSyllables.prompts.*`
  - `games.soundBridgeSyllables.hints.*`
  - `letters.pronunciation.*`, `nikud.names.*`, `reading.syllables.*`
- Competitor pattern adaptation:
  - Duolingo ABC: sound chunk -> blend -> apply sequence.
  - Khan Kids: one-new-variable scaffolding.

## Concept 5 (P1): Letter Post Run (Hebrew: דואר האות הפותחת)

- Domain and age: Letters, ages `5-7`
- Learning goal: Strengthen first-sound -> grapheme retrieval with low motor friction.
- Core mechanic:
  1. Child hears a spoken word.
  2. Child taps one mailbox labeled by letter icon.
  3. Correct choice sends postcard with immediate confirmation.
- Difficulty sketch:
  - Easy (`5-6`): 2 letter choices, high phoneme contrast.
  - Medium (`5-6`): 3 choices, one confusion family block only.
  - Hard (`6-7`): 4 choices with anchor-word contrast prompts for same-sound grapheme families.
  - Adaptive: after 2 misses, return to 2-choice anchor-word contrast before normal flow.
- Hebrew content/audio needs:
  - `games.letterPostRun.instructions.*`
  - `games.letterPostRun.prompts.wordStart.*`
  - `games.letterPostRun.hints.*`
  - `letters.pronunciation.*`, `letters.anchorWords.*`, `objects.names.*`
- Competitor pattern adaptation:
  - Khan Kids: clear prompt + calm correction.
  - Duolingo ABC: compact rounds with frequent micro-celebrations.

## 3) Recommendation Matrix (Top 3 to Spec First)

| Concept | Gap closed | Age reach | Learning impact | Build effort | Recommendation |
|---|---|---|---|---|---|
| Dot Flash Farm | Missing subitizing foundation in numbers | 3-5 | High | Small | Spec first (`#1`) |
| Color Mix Picnic | Colors lane has single-mechanic dependence | 4-6 | High | Medium | Spec second (`#2`) |
| Sound Bridge Syllables | Missing letters->decoding bridge | 4-6 | High | Medium | Spec third (`#3`) |
| Rainbow Rescue Camera | Color transfer in realistic scenes | 3-6 | Medium-High | Medium | Spec fourth |
| Letter Post Run | Low-friction retrieval strengthening | 5-7 | Medium-High | Small-Medium | Spec fifth |

Why this top-3 order:
1. `Dot Flash Farm` closes the biggest foundational math gap with low implementation risk and fast age-3/4 impact.
2. `Color Mix Picnic` diversifies the colors domain immediately (currently one live color mechanic).
3. `Sound Bridge Syllables` reduces transition friction from letter games into reading games.

## 4) Implementation Notes for PM/FED Handoff

- Keep all concepts on the Dubiland baseline template in `docs/games/game-design-guidelines.md`:
  - icon-first controls (`▶`, `↻`, `💡`, `→`)
  - action-triggered validation only
  - `44px+` targets
  - audio pair for every i18n key
- For v1 scope control:
  - Use React + DOM interactions for all five concepts.
  - Add `xstate` only where adaptive ladders exceed simple conditionals (`Sound Bridge Syllables`, `Letter Post Run`).
- Session target for all five: `2-5` minutes, with one interaction every `20-35s`.
