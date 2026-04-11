# Sound Slide Blending (Hebrew: מגלשת צלילים)

## Learning Objective
- Curriculum stage: Letter Recognition -> Nikud (Vowel Diacritics) -> Syllable Decoding.
- Core reading skill: build automatic blending of pointed Hebrew CV/CVC syllables through rapid segmented-to-blended audio mapping.
- Measurable outcome: after 5 sessions, child reaches >=85% first-try accuracy on Level 2 CV rounds, >=75% accuracy on Level 3 CVC rounds, and <=1 stage-3 hint per 10-item block.
- Milestone mapping (age ~6):
  - Moves from naming separate sounds to reading one blended syllable.
  - Transfers nikud+consonant recognition into fluent syllable decoding before longer word/sentence demands.

## Curriculum Position
- Placement in reading ladder:
  1. After `letter-sound-match` and `nikud-sound-ladder` foundations.
  2. Before or in parallel with `syllable-train-builder` as a fluency accelerator.
  3. Before broad word-reading transfer lanes.
- Prerequisites:
  - Child can identify at least six foundational nikud symbols in controlled rounds.
  - Child understands icon-first controls (`▶`, `↻`, `💡`, `→`) with audio support.
- What comes next:
  - `syllable-train-builder` for heavier construction and word-transfer practice.
  - `decodable-micro-stories` after stable syllable fluency.

## Target Age Range
- Primary: 5.0-6.5
- Support mode: advanced 4.8+

## Mechanic
- Primary interaction: tap consonant, tap nikud, then swipe down a "slide" rail to trigger segmented-to-blended audio and choose the matching pointed syllable card.
- Core loop:
  1. דובי plays the target blend (`segmented -> blended`).
  2. Child assembles the blend with two taps (letter + nikud).
  3. Child swipes down the sound slide to hear the combined syllable.
  4. Child taps the matching pointed syllable from 2-4 options.
  5. Validation is immediate on tap/drag/swipe (no separate check button).
- Engine fit:
  - One DB row in `games` (`slug: soundSlideBlending`, `game_type: syllable_blend_slide`).
  - One runtime component: `SoundSlideBlendingGame`.
- RTL/mobile requirements:
  - Choice cards are laid out RTL and read right-to-left.
  - Interaction targets are >=44px, thumb-safe on tablet.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Icon Inventory (Mandatory)

| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays active prompt (`games.soundSlideBlending.instructions.*`) | Active blend rail pulses. |
| Retry round | `↻` | Encouragement + replay (`games.soundSlideBlending.feedback.retry.*`) | Same concept resets with lighter distractors when needed. |
| Hint | `💡` | Next hint stage (`games.soundSlideBlending.hints.*`) | One scaffold step (highlight / reduced options / modeled blend). |
| Continue | `→` | Transition cue (`games.soundSlideBlending.feedback.success.transition.*`) | Slide moves to next station. |

## Image Strategy
- Level 1 onboarding can show tiny picture mnemonics for vocabulary confirmation only.
- Level 2+ scored rounds are text+audio first; images fade to decorative background.
- Level 3 removes image cues from scored choices entirely.
- Guardrail: no correct answer can be inferred from image alone.

## Difficulty Curve
- Level 1 (Guided CV):
  - 2 options; consonant and nikud both use far-distance contrasts only.
  - Auto-plays segmented and blended model on first exposure.
  - No near-foil distractors and no same-sound grapheme pairs (`ַ/ָ`, `ֶ/ֵ`).
- Level 2A (Independent CV, far contrast):
  - 3 options; same-consonant/different-vowel distractors with far acoustic distance only.
  - Child triggers blend by swipe instead of automatic model.
  - Prompt replay available but not auto-triggered after every round.
- Level 2B (Independent CV, near contrast):
  - 3 options; unlock near-foil vowel contrasts only after Level 2A gate.
  - Same-sound grapheme pairs stay out of scored sound-only prompts and unlock only in named/anchored prompts.
- Level 3A (CVC Bridge):
  - 3 options; add closing consonant while keeping non-final letter forms only.
  - No transfer-word items during the first CVC block (one new variable rule).
- Level 3B (CVC + transfer):
  - 3-4 options; unlock one transfer item every 4 rounds only after Level 3A gate.
  - Introduce final-form exposures in dedicated mini-blocks, not in the same first-transfer cluster.
  - No image support on scored rounds.
- Promotion gates:
  - `L1 -> L2A`: >=8/10 correct in two consecutive blocks, <=2 hint-stage-2+ uses per block.
  - `L2A -> L2B`: >=7/10 first-try accuracy in one block and <=1 modeled round.
  - `L2B -> L3A`: >=16/20 correct across two blocks and >=75% success on near-foil vowel contrasts.
  - `L3A -> L3B`: >=4/5 correct in one CVC-only block with <=1 stage-2+ hint.
  - `L3 mastery`: >=12/15 correct with <=1 stage-3 hint and >=80% independent-pass rate.
- Supported-pass fairness:
  - A completed block below independent thresholds records as `supported-pass`, then repeats the same concept with lighter distractors (no hard fail animation).
  - Regress one sub-stage only after two consecutive weak blocks (`<60%` independent accuracy).
- Recovery logic:
  - Two consecutive misses on same vowel pattern trigger one guided model round.
  - Inactivity (`>=6s` no action) triggers hint stage 1 (replay) before counting a miss.
  - Anti-random-tap tier 1: `>=4` taps in `<1.5s` without valid selection -> rail pulse warning + prompt replay.
  - Anti-random-tap tier 2: `>=6` taps in `<2s` or `3` misses in `<20s` -> pause input for `1200ms`, play modeled blend, reduce options by one for next 2 rounds (never below 2 options).

## Feedback Design
- Success:
  - Behavior-specific praise tied to blending (for example: "חיברת ושמעת נכון!").
  - Visual progress rail fills one station per independent success.
- Mistakes:
  - First miss: replay segmented sound and highlight relevant nikud.
  - Second miss: dim one impossible option.
  - Third miss: show one modeled blend, then immediate retry.
- Hint progression:
  1. Replay target blend.
  2. Highlight correct letter/nikud pair.
  3. Reduce options and provide one solved exemplar.

## Session Design
- Session length: 4-6 minutes.
- Structure:
  - Warm-up (1-1.5 minutes): guided CV rounds.
  - Core loop (2-3 minutes): independent CV/CVC rounds.
  - Transfer recap (about 1 minute): short pointed word bridge.
- Natural stopping points:
  - Every 5-round station cluster.
  - End-of-session recap with next recommended lane.
- Replay hooks:
  - Next-day opener includes most-missed vowel/letter pair from prior session.
  - Weekly mixed review rotates mastered + weak patterns.

## Audio Requirements
- All child-facing copy must use i18n keys and synchronized Hebrew audio.
- Required key families:
  - `games.soundSlideBlending.title`
  - `games.soundSlideBlending.instructions.*`
  - `games.soundSlideBlending.prompts.*`
  - `games.soundSlideBlending.hints.*`
  - `games.soundSlideBlending.feedback.success.*`
  - `games.soundSlideBlending.feedback.retry.*`
  - `games.soundSlideBlending.controls.*`
  - `letters.pronunciation.*`
  - `nikud.pronunciation.*`
  - `syllables.pronunciation.*`
  - `words.pronunciation.*`
- Asset pattern:
  - `public/audio/he/games/sound-slide-blending/*.mp3`
  - `public/audio/he/syllables/*.mp3`
  - `public/audio/he/words/*.mp3`
- Audio constraints:
  - Segmented-to-blended timing gap <=300ms.
  - Prompt replay starts in <=250ms after icon tap.
  - Background audio ducks by >=6dB during instruction/prompt playback.

## Parent Visibility
- Parent dashboard metrics:
  - CV vs CVC blend accuracy.
  - Most-confused nikud contrasts.
  - Independent success rate vs hint-assisted success.
  - Recommended next step (`syllable-train-builder` or recovery loop).
- Suggested parent key families:
  - `parentDashboard.games.soundSlideBlending.progressSummary`
  - `parentDashboard.games.soundSlideBlending.confusions`
  - `parentDashboard.games.soundSlideBlending.nextStep`

## Inspiration / References
- Reading Eggs: explicit phonics sequencing and repetition with variation.
- Teach Your Monster to Read: playful blend mechanics with immediate correction loops.
- Ji Alef-Bet: Hebrew-first nikud-sensitive pacing.

## Review Request
- Request Gaming Expert review for distractor staircase and anti-random-tap thresholds.
- Request Content Writer review for syllable list control, nikud contrast ordering, and short-form audio lines.
