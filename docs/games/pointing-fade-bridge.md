# Pointing Fade Bridge (Hebrew: גשר ניקוד)

## Learning Objective
- Curriculum stage: Word Reading -> Phrase & Sentence Reading -> Decodable Stories.
- Core reading skill: maintain accurate decoding while moving from fully pointed Hebrew text to controlled partially pointed and mostly unpointed text.
- Measurable outcome: after 7 sessions, child reaches >=85% decode accuracy on fully pointed Level 1 pages, >=80% on partially pointed Level 2 pages, and >=70% independent accuracy on Level 3 mostly unpointed bridge pages.
- Milestone mapping (age ~6):
  - Stops depending on full nikud for every token while preserving decode-first behavior.
  - Transfers decoding confidence from isolated words to short connected text with reduced visual support.

## Curriculum Position
- Placement in reading ladder:
  1. After `decodable-micro-stories` and `decodable-story-missions` baseline completion.
  2. After stable word decoding and basic sight-word automaticity.
  3. Before long-form handbook/story lanes that include mixed-pointing profiles.
- Prerequisites:
  - Child can decode short fully pointed sentences with moderate independence.
  - Child can use hint/replay icons without text labels.
- What comes next:
  - Longer mixed-pointing story tracks.
  - Sentence-level fluency plus simple comprehension expansion.

## Target Age Range
- Primary: 6.0-7.0
- Entry support: strong 5.9+

## Mechanic
- Primary interaction: child reads a short sentence card, then performs an action-validated decode task where mastered words lose nikud gradually across levels.
- Core loop:
  1. Narrator plays sentence (`▶` replay available).
  2. Child taps highlighted target word(s) in RTL order and confirms by action (tap-match, drag-order, or choose matching card).
  3. Next round reuses the same lexical family with reduced pointing on mastered words only.
  4. Immediate validation after each action; no separate submit/check control.
- Engine fit:
  - One DB row in `games` (`slug: pointingFadeBridge`, `game_type: mixed_pointing_sentence_bridge`).
  - One runtime component: `PointingFadeBridgeGame`.
- RTL/mobile requirements:
  - Sentence and token progression are RTL-native.
  - Word targets and control icons remain >=44px.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Icon Inventory (Mandatory)

| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction/sentence | `▶` | Replays active sentence + prompt (`games.pointingFadeBridge.instructions.*`) | Active word highlight restarts from rightmost token. |
| Retry round | `↻` | Retry encouragement (`games.pointingFadeBridge.feedback.retry.*`) | Same sentence concept resets with full pointing if needed. |
| Hint | `💡` | Hint stage cue (`games.pointingFadeBridge.hints.*`) | One-step scaffold (temporary nikud reveal / reduced options / modeled token). |
| Continue | `→` | Transition cue (`games.pointingFadeBridge.feedback.success.transition.*`) | Moves to next bridge card with configured pointing profile. |

## Image Strategy
- Sentence decoding rounds are text-first.
- Scene illustrations appear only after decode completion and are never used as answer evidence.
- In scored rounds, option cards remain text-only to prevent context guessing.
- Fade policy is lexical, not decorative: remove nikud only from already mastered words, never from newly introduced decoding targets.

## Difficulty Curve
- Level 1 (Fully Pointed Baseline):
  - Short fully pointed phrases/sentences (3-5 words).
  - One decode action per sentence, 2-choice response.
  - Full audio model available on each item.
- Level 2A (Controlled Partial Pointing):
  - Maintain sentence length, fade nikud only on mastered/high-frequency words.
  - 3-choice response with one near-foil.
  - Keep novel words fully pointed.
- Level 2B (Deeper Partial Pointing):
  - Same sentence length with one additional faded mastered token.
  - New/low-confidence words remain fully pointed.
- Level 3A (Mostly Unpointed Bridge):
  - 4-6 word sentences where only difficult/new words keep pointing.
  - Single action type per block (no mixed mechanic in same block).
- Level 3B (Mostly Unpointed + action mix):
  - Unlock mixed action types (word match, order, missing-word fill) only after Level 3A gate.
  - Optional tap-to-reveal nikud hint remains capped at one token per round.
- Fade eligibility policy (mandatory):
  - A token can lose nikud only after `>=2/3` first-try correct reads with `<=1` hint across its last 3 pointed exposures.
  - If a faded token is missed twice in a block, restore full pointing for its next 3 exposures.
  - Newly introduced tokens stay fully pointed for at least their first 2 scored exposures.
- Promotion gates:
  - `L1 -> L2A`: >=8/10 decode actions correct with <=2 hint-stage-2+ uses.
  - `L2A -> L2B`: >=7/10 correct with >=75% success on partially pointed targets.
  - `L2B -> L3A`: >=16/20 correct across two blocks and >=80% success on faded-token reads.
  - `L3A -> L3B`: >=4/5 correct with <=1 stage-2+ hint.
  - `L3 bridge pass`: >=12/15 correct and <=1 stage-3 hint per block.
- Decode-first guardrails:
  - Nikud-reveal hint unlocks only after the child makes one decode attempt on that token.
  - Reveal hint cannot be used on the same token twice in one round.
- Recovery logic:
  - Two consecutive misses on same token family restores full pointing for one recovery item.
  - If accuracy drops below 60% over 6 items, step back one level for 3 guided rounds.
  - Anti-random-tap tier 1: `>=4` taps in `<1.5s` without valid decode action -> pause `900ms` + replay.
  - Anti-random-tap tier 2: `>=6` taps in `<2.5s` or `3` misses in `<20s` -> pause `1200ms`, force modeled decode once, reduce options by one for next 2 items (never below 2 options).

## Feedback Design
- Success:
  - Praise tied to text attention (for example: "קראת את המילה גם בלי כל הניקוד!").
  - Bridge meter fills as child succeeds with less pointing support.
- Mistakes:
  - First miss: replay sentence and pulse target token.
  - Second miss: temporary nikud reveal on one token.
  - Third miss: modeled read + immediate retry on similar item.
- Hint progression:
  1. Replay target sentence slowly.
  2. Highlight token boundary and onset/nikud anchor.
  3. Temporarily reveal pointing on one critical token + reduce options.

## Session Design
- Session length: 4-6 minutes.
- Structure:
  - Baseline cluster (1-1.5 minutes).
  - Fade bridge cluster (2-3 minutes).
  - Transfer recap (about 1 minute) with parent-visible summary.
- Natural stopping points:
  - End of each 4-card bridge cluster.
  - End-of-session bridge report.
- Replay hooks:
  - Next-day warm-up restores full-pointing for yesterday's weakest tokens.
  - Weekly bridge review alternates partially pointed and mostly unpointed sets.

## Audio Requirements
- Every prompt, instruction, feedback line, and sentence narration must be i18n-keyed with Hebrew audio.
- Required key families:
  - `games.pointingFadeBridge.title`
  - `games.pointingFadeBridge.instructions.*`
  - `games.pointingFadeBridge.prompts.*`
  - `games.pointingFadeBridge.hints.*`
  - `games.pointingFadeBridge.feedback.success.*`
  - `games.pointingFadeBridge.feedback.retry.*`
  - `games.pointingFadeBridge.controls.*`
  - `words.pronunciation.*`
  - `phrases.pronunciation.*`
  - `sentences.pronunciation.*`
- Asset pattern:
  - `public/audio/he/games/pointing-fade-bridge/*.mp3`
  - `public/audio/he/phrases/*.mp3`
  - `public/audio/he/sentences/*.mp3`
- Audio constraints:
  - Narration replay starts <=250ms after tap.
  - Hint audio always ducks background by >=6dB.
  - Sentence pacing remains slow enough for age 6 decoding (<120 wpm equivalent).

## Parent Visibility
- Parent dashboard metrics:
  - Accuracy split by pointing profile (fully pointed / partially pointed / mostly unpointed).
  - Tokens requiring repeated nikud-reveal hints.
  - Independent decode rate under reduced-pointing conditions.
  - Next-step recommendation (repeat bridge vs advance to mixed-pointing stories).
- Suggested parent key families:
  - `parentDashboard.games.pointingFadeBridge.progressSummary`
  - `parentDashboard.games.pointingFadeBridge.pointingProfileBreakdown`
  - `parentDashboard.games.pointingFadeBridge.nextStep`

## Inspiration / References
- Reading Eggs decodable-to-fluency transition model.
- HOMER scaffolded progression from explicit support toward independence.
- Hebrew literacy progression practice in Ji Alef-Bet (nikud-aware transition pacing).

## Review Request
- Request Gaming Expert review for lexical fade policy and progression gate fairness.
- Request Content Writer review for pointing policy consistency and sentence-set/audio alignment.
