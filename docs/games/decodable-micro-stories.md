# Decodable Micro Stories (Hebrew: סיפורי קריאה מדורגים קצרים)

## Learning Objective
- Curriculum stage: Phrase & Sentence Reading -> Reading Comprehension -> Decodable Stories.
- Core reading skill: read short, controlled Hebrew stories where vocabulary and nikud match taught patterns.
- Measurable outcome: after 6 sessions, child reads Level 2 decodable pages with >=85% word-accuracy and answers literal comprehension prompts with >=80% accuracy.
- Milestone mapping (age ~6):
  - Moves from isolated word decoding to connected text.
  - Maintains decoding behavior (not picture guessing) across short story flow.

## Curriculum Position
- Placement in reading ladder:
  1. After letter foundations (`letter-tracing-trail`, `letter-sound-match`, `letter-sky-catcher`).
  2. After beginner word/phrase practice (`picture-to-word-builder`, handbook literacy checkpoints).
  3. Parallel with morphology-light reinforcement (`root-family-stickers`).
- Prerequisites:
  - Child can decode short pointed words and simple 2-4 word phrases.
  - Child can follow icon-first controls (`▶`, `↻`, `💡`, `→`) without text labels.
- What comes next:
  - Longer leveled decodable stories with partial nikud fade.
  - Expanded comprehension prompts (sequence + inference) after literal mastery.

## Target Age Range
- Primary: 5.5-7
- Support mode: advanced 5.0+

## Mechanic
- Primary interaction: tap-read story flow with inline decoding checkpoints.
- Core loop per story:
  1. Page narration plays once; each word is tappable for isolated pronunciation replay.
  2. Child reads a highlighted target phrase aloud with optional `▶` model replay.
  3. One checkpoint validates decoding/comprehension by child action (tap/select/reorder).
  4. Immediate feedback, then continue to next page.
- Engine fit:
  - One DB row in `games` (`slug: decodableMicroStories`, `game_type: story_decode`).
  - One runtime component family: `DecodableStoryReaderGame`.
- RTL/mobile requirements:
  - Word highlight and page progression are RTL-first.
  - Controls and tappable words respect 44px+ touch target minimum.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), next (`→`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction / model read | `▶` | Replays active instruction or phrase model (`games.decodableMicroStories.instructions.*`, `games.decodableMicroStories.pages.<page>.decodePrompt.*`) | Active word/phrase pulses and re-highlights in RTL order. |
| Retry checkpoint | `↻` | Encouragement cue (`feedback.encouragement.*`) then prompt replay | Same checkpoint resets with no penalty and same target word preserved. |
| Hint step | `💡` | Next hint stage (`games.decodableMicroStories.hints.*`) | Applies one scaffold step only (segment -> highlight -> reduced choices). |
| Next page / continue | `→` | Transition cue + next prompt narration | Smooth page transition with bookmark saved at page boundary. |

## Image Strategy
- Images support story meaning and motivation but do not reveal decoding answers.
- Fade plan:
  - Level 1: supportive scene art on each page.
  - Level 2: reduced cueing; answer options shown text-first.
  - Level 3: key checkpoints run on text-only cards before image reveal.
- Guardrail: no comprehension prompt may be solvable from image alone when decoding is the target.

## Anti-Guessing Safeguards (Implementation Gates)
- Text-first checkpoint lock: image tap targets stay disabled until the child taps/reads the target text token once.
- Reveal delay: when an image is part of a checkpoint, text appears first and image reveal is delayed by `1200-1800ms`.
- Decoy control: in core progression, keep visual decoys at `<=1` decoy per checkpoint and never introduce new decoy type in the same checkpoint as new nikud pattern.
- Rapid-tap guard: if `>=4` taps in `<2s` on non-target areas, pause input for `800ms`, play model read, and resume with reduced choices.
- Comprehension rule: at least `70%` of scored checkpoints in every story are decode-first (word/phrase action before comprehension response).

## Difficulty Curve
- Level 1 (Guided Decodable Pages):
  - Fully pointed text only.
  - 3-5 pages per story, 1 short sentence per page.
  - Decode checkpoint on every page (`3-5` checkpoints/story), with only one new variable per story (new pattern or new checkpoint mechanic, not both).
  - Frequent replay modeling and immediate hint after first miss.
- Level 2 (Independent Decodable Flow):
  - Fully pointed text with controlled high-frequency words.
  - 5-7 pages, up to 2 short sentences per page.
  - Decode checkpoint every page; literal comprehension checkpoint every 2 pages (`2-3` total/story).
  - New challenge variable is distractor complexity only; page length remains stable inside the same story.
- Level 3 (Bridge to Fluency):
  - Mix fully pointed target words with partially pointed support words.
  - 6-8 pages, short connected sentence pairs.
  - Comprehension after decoding with delayed hint ladder; nikud fade and comprehension complexity never increase in the same checkpoint block.
- Adaptive scaffolding:
  - If child misses `2` consecutive target words, auto-switch next page to fully pointed + slower narration and reduce options (4->2 max).
  - If child misses the same grapheme pattern twice, run deterministic recovery loop: isolated contrast -> anchor-word contrast -> near-transfer checkpoint.
  - If child completes `3` checkpoints without hints, reduce modeling prompts and increase independent read turns.
  - If child uses hint stage 3 on `>=2` checkpoints in one story, keep current level for next story (no auto-promotion).
  - If frustration signal fires twice in one story (rapid-tap guard + repeated miss), end story at next page boundary with a success recap and resume later.

## Mastery and Progression Gates
- Level advancement is based on independent decoding, not assisted success.
- Promote Level 1 -> Level 2 when two consecutive stories meet all:
  - first-attempt decode accuracy `>=85%`
  - hint stage 3 usage `<=1` per story
  - comprehension accuracy `>=75%`
- Promote Level 2 -> Level 3 when two consecutive stories meet all:
  - first-attempt decode accuracy `>=88%`
  - hint stage 3 usage `<=1` per story
  - comprehension accuracy `>=80%`
- Regression guard:
  - if below thresholds for two sessions, revert one level for one story set and re-test.

## Feedback Design
- Success:
  - Immediate supportive reinforcement tied to decoding effort ("קראת את המילה בדיוק!").
  - Story progress badge fills to sustain engagement.
  - Badge fill weights independent success higher than hint-assisted success.
- Mistakes:
  - No punitive sounds/screens.
  - First miss: replay model and segmented syllable cue.
  - Second miss: visual word chunk highlight + guided retry.
  - Third miss on same target: auto-model + forced reduced-choice retry (no free-advance).
- Hint progression:
  1. Replay whole phrase (`▶`).
  2. Syllable segmentation cue.
  3. Highlight target grapheme/nikud and retry.

## Session Design
- Session length: 10-15 minutes.
- Session shape:
  - 1-2 micro-stories per session; each micro-story loop is `3-5` minutes.
  - 6-10 total checkpoints per session (decode-first majority, level-dependent).
- Natural stopping points:
  - End of each story page cluster.
  - Resume bookmark at page-level.
- Fatigue handling:
  - If active attention drops (rapid taps + no response for 10s), trigger short mascot break card and offer `→` continue or stop-with-recap.
- Replay hooks:
  - Rotating story sets by taught pattern.
  - Spaced repetition of words frequently missed in prior sessions.

## Audio Requirements
- All child-visible strings are i18n-keyed with Hebrew audio.
- Required key families:
  - `games.decodableMicroStories.title`
  - `games.decodableMicroStories.instructions.*`
  - `games.decodableMicroStories.pages.<page>.narration.*`
  - `games.decodableMicroStories.pages.<page>.decodePrompt.*`
  - `games.decodableMicroStories.pages.<page>.comprehension.*`
  - `games.decodableMicroStories.hints.*`
  - `games.decodableMicroStories.feedback.success.*`
  - `games.decodableMicroStories.feedback.retry.*`
  - `words.pronunciation.*`
  - `phrases.pronunciation.*`
  - `feedback.encouragement.*`
- Audio asset pattern:
  - `public/audio/he/games/decodable-micro-stories/*.mp3`
  - `public/audio/he/words/*.mp3`
  - `public/audio/he/phrases/*.mp3`
- Audio behavior constraints:
  - Narration and replay must duck background audio by >=6dB.
  - Per-word tap audio should begin within <=250ms to maintain reading flow.

## Parent Visibility
- Parent dashboard metrics:
  - Word accuracy by story and pattern.
  - Most-missed words and nikud patterns.
  - Comprehension accuracy (literal level).
  - Hint usage trend and independent-read rate.
- Suggested parent i18n key families:
  - `parentDashboard.games.decodableMicroStories.progressSummary`
  - `parentDashboard.games.decodableMicroStories.wordAccuracy`
  - `parentDashboard.games.decodableMicroStories.nextStep`

## Inspiration / References
- Reading Eggs: leveled decodable books tied to explicit phonics sequence.
- HOMER: story-based engagement with scaffolded literacy checks.
- Khan Academy Kids ELA: mastery tracking across reading units.
- Ji Alef-Bet: Hebrew-appropriate pacing and nikud-sensitive reading practice.

## Review Status
- Reviewed by Gaming Expert on 2026-04-10 ([DUB-589](/DUB/issues/DUB-589)).
- Calibration status: PASS with no additional threshold edits required in this spec.
- Rationale: Checkpoint pacing, anti-guessing gates, and progression locks were already explicit and age-appropriate; cross-spec updates were needed in companion documents instead.
