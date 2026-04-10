# Decodable Micro Stories — Age-Band Scaling Overhaul (Hebrew: שדרוג סיפורי קריאה מדורגים לפי גיל)

## Learning Objective
- Curriculum stage: Decodable Stories -> Phrase & Sentence Reading -> Reading Comprehension.
- Core objective: split decodable micro-stories into explicit age-banded narrative tracks (`3-4`, `5-6`, `6-7`) so story depth and language complexity progress with child development.
- Measurable outcomes:
  - `3-4`: participates in listen-and-repeat story turns and identifies key repeated words with support.
  - `5-6`: decodes fully pointed micro-story sentences accurately (`>=85%` on first/second attempt).
  - `6-7`: reads connected scene pairs, answers sequence/evidence prompts, and maintains decoding under reduced pointing (`>=80%` comprehension + `>=88%` decode accuracy).

## Curriculum Position
- This is a revision layer for `docs/games/decodable-micro-stories.md`.
- It sits after baseline decodable engine implementation and before full leveled story-library expansion.
- Prerequisites:
  - Child can use icon-first controls (`▶/↻/💡`).
  - Child has completed age-appropriate handbook checkpoints.
- What comes next:
  - Larger serial decodable chapters and cross-story character arcs for `6-7`.

## Target Age Range
- Primary: `3-7` with mandatory differentiation by age band.

## Mechanic
- Same runtime component family (`DecodableStoryReaderGame`) with age-band content packs and gating rules.
- Story loop remains:
  1. Hear/read page line
  2. Decode target token/phrase
  3. Action-based check
  4. Immediate feedback and continue
- New requirement: each age band has dedicated story arc templates, not one shared text pack with minor simplification.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Image Strategy
- `3-4`: supportive full-scene art remains visible; checks are audio-led and lightly text-linked.
- `5-6`: text-first answer surfaces with art as context only.
- `6-7`: comprehension/evidence checks run on text cards before image reveal.
- Guardrail: decode-first rule applies to all scored checkpoints (`read/tap text` before answer selection).

## Difficulty Curve

### Band A — Ages `3-4` (Listen-Explore Decodable Prep)
- 3-4 pages per story.
- Repeated patterned lines with 1-2 anchor words.
- No mastery scoring on independent decoding; score oral participation + recognition.
- Comprehension: one literal who/what prompt with 2 options and full audio replay.

### Band B — Ages `5-6` (Core Fully Pointed Decodable)
- 5-6 pages per story.
- Fully pointed text in all target words.
- 1 decode checkpoint every page + 2 literal comprehension checks per story.
- Hint ladder: replay -> segmentation -> reduced choices.

### Band C — Ages `6-7` (Connected Narrative + Evidence)
- 6-8 pages per story.
- Mostly pointed opening pages, partial-pointing bridge on mastered words later.
- 1 decode checkpoint every page; sequence/evidence check every 2 pages.
- No simultaneous introduction of new pointing reduction and new comprehension format in same page block.

## Consistency Gates (Calibrated For QA)

| Band | Checkpoint density (per story) | Distractor load cap | Anti-guess guard | Transition lock |
|---|---|---|---|---|
| `3-4` | `1` scored check every `2` pages (`max 2` scored checks/story) | `2` options max, no near-decoy text foils | `>=3` non-target taps in `<2s` -> input pause `800ms` + prompt replay | No partial-pointing transition in scored child tasks; narrator-modeled text only |
| `5-6` | Decode check every page (`5-6`) + literal checks `2`/story (`max 8` scored checks/story) | `2` options for first 2 sessions, then `3` max with only `1` near decoy | `>=4` non-target taps in `<2s` -> pause `1000ms`, replay, then reduce options by `1` on retry | Keep fully pointed text in all scored checkpoints; comprehension stays literal during this band |
| `6-7` | Decode every page (`6-8`) + sequence/evidence every `2` pages (`max 3` sequence/evidence checks/story) | `3` options max; only `1` same-pattern foil per check | Trigger on `>=4` non-target taps in `<2s` OR `3` consecutive answers `<600ms`; inject one scaffold trial with forced full replay | When pointing density is reduced in a page cluster, keep comprehension format unchanged for next `2` pages (no simultaneous pointing fade + new format jump) |

### Transition Integrity Rule (`5-6` -> `6-7`)
- In the first two `6-7` stories, keep sequence/evidence format fixed while partial-pointing is introduced.
- Cap pointing reduction to `<=10` percentage points per chapter cluster.
- Allow new comprehension format only after one full cluster with stable decode accuracy `>=85%`.

## Feedback Design
- Success lines mention both reading effort and story progress.
- Mistake handling never interrupts with fail states; provide single actionable cue and quick retry.
- Frustration protocol:
  - after repeated misses, auto-model target line and continue with reduced options.

## Session Design
- Session length: 10-15 minutes.
- Recommended structure:
  - `3-4`: 2 short listen-read stories.
  - `5-6`: 1 full decodable story + optional replay.
  - `6-7`: 1 connected arc story with recap prompt.
- Stop points:
  - page cluster boundaries and chapter recaps.

## Audio Requirements
- Required key families:
  - `games.decodableMicroStories.ageBand.<band>.stories.<storyId>.pages.<pageId>.*`
  - `games.decodableMicroStories.ageBand.<band>.instructions.*`
  - `games.decodableMicroStories.ageBand.<band>.hints.*`
  - `games.decodableMicroStories.ageBand.<band>.feedback.*`
  - `parentDashboard.games.decodableMicroStories.ageBand.<band>.*`
- Audio pacing:
  - slower line pacing for `3-4`, explicit syllable chunking for `5-6`, and evidence-language clarity for `6-7`.

## Parent Visibility
- Show age-band-specific metrics:
  - `listenParticipation` (`3-4`)
  - `decodeAccuracy` (`5-6`, `6-7`)
  - `sequenceEvidenceScore` (`6-7`)
  - `hintDependenceTrend` (all bands)

## New Story Content Direction (Per Age Band)

### Ages `3-4` — Story Pack: "הצליל שנעלם"
- Story idea: Dubi cannot start the morning song because one sound is missing.
- Style: repetitive, rhythmic, concrete nouns and actions.
- Sample lines:
  - "דובי שומע טפ-טפ חלש."
  - "מיקה אומרת: בוא נמצא את הקול."
  - "יש! הקול חזר, והשיר התחיל."

### Ages `5-6` — Story Pack: "מפת הרמזים של יואב"
- Story idea: Yoav follows 3 clues to relight a dark lighthouse before evening.
- Style: fully pointed short clauses, clear stakes, simple problem-solution.
- Sample lines:
  - "יוֹאָב מָצָא רֶמֶז עַל הַשַּׁעַר."
  - "אִם נִקְרָא נָכוֹן, הַדֶּלֶת תִּפָּתַח."
  - "כְּשֶׁקָּרָא אֶת הָרֶמֶז הָאַחֲרוֹן, הָאוֹר חָזַר."

### Ages `6-7` — Story Pack: "תמר והקומה הנעולה"
- Story idea: Tamar initially guesses and fails, then learns to solve using evidence from text.
- Style: connected scenes, emotional change, sequence and justification language.
- Sample lines:
  - "תמר מיהרה לבחור תשובה, והדלת נשארה נעולה."
  - "דובי הזכיר: קודם קוראים, אחר כך מוכיחים."
  - "בסוף תמר מצאה את המשפט המדויק ופתחה את הקומה האחרונה."

## Coordination Notes
- Content Writer: deliver full Hebrew i18n/audio packs for all 3 age bands.
- FED: integrate age-band content routing and progression gates in decodable runtime.
- Gaming Expert: review distractor load, hint ladders, and anti-guessing safeguards by band.

## Review Status
- Reviewed by Gaming Expert on 2026-04-10 ([DUB-589](/DUB/issues/DUB-589)).
- Calibration status: Checkpoint density, distractor caps, anti-guess gates, and transition locks are now QA-testable by age band.
- Rationale: The prior draft had clear pedagogy but not enough numeric limits for consistent runtime gating and QA assertions.

## Inspiration / References
- Reading Rockets decodable guidance (explicit text-to-instruction alignment): https://www.readingrockets.org/classroom/classroom-strategies/decodable-text
- Reading Eggs (leveled decodable practice with progression): https://readingeggs.com/
- Hebrew morphology/orthography relevance for early reading development (background): https://www.cambridge.org/core/journals/applied-psycholinguistics/article/morphological-awareness-and-word-reading-skills-among-young-hebrew-language-readers/C0FA9A8B4364EF641A51D4174BBF21F9
