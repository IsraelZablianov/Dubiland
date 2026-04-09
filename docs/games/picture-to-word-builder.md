# Picture to Word Builder (Hebrew: בונים מילה מתמונה)

## Learning Objective
- Curriculum area: Reading (קריאה)
- Core skill: Early decoding and blending by mapping spoken word sounds to ordered Hebrew letters.
- Measurable outcome: After 5 sessions, child builds target 3-4 letter words with at least 75% accuracy in Level 2 rounds with no more than one scaffold hint.
- Promotion gates:
  - Level 1 -> Level 2: 4/5 correct in one block with at most one replay hint.
  - Level 2 -> Level 3: 4/5 correct in one block with at most one scaffold escalation.
- Milestone mapping:
  - Ages 5-6: build simple familiar words from picture + audio cues.
  - Ages 6-7: reduce scaffolds and increase independence in word assembly.

## Target Age Range
- Primary: 5-7

## Mechanic
- Primary interaction: Drag-and-drop letter tiles into word slots.
- Round loop:
  1. Child sees a familiar picture and hears the target word.
  2. Child drags Hebrew letter tiles (RTL order) into slots beneath the image.
  3. Child taps replay to hear full word or segmented sounds.
  4. System validates letter order, gives immediate micro-feedback on each tile, and moves to next round.
- Engine fit:
  - One DB row in `games` table (slug: `pictureToWordBuilder`, `game_type: drag_drop`).
  - One component: `PictureToWordBuilderGame`.
- Mobile/RTL requirements:
  - Letter tiles and slots are 44px+ touch targets.
  - Word slots fill right-to-left.
  - Prompt and helper controls are right-aligned.

## Pre-Literate UX Baseline (Mandatory)
- Every instruction text shown to the child must include an adjacent `▶` play icon (minimum 44px) that replays the exact instruction audio.
- Child-facing controls are icon-first, not text-first. Use persistent icons for replay (`▶`), retry (`↻`), hint (`💡`), and next (`→`).
- Text labels may appear only as supporting parent/teacher UI; gameplay controls for children must remain understandable via icon + audio alone.
- Feedback and validation are action-based: the game responds immediately to taps, drags, traces, or spoken input and never requires a separate `check` or `test` button.
- Icon taps trigger short narrated cues from i18n/audio keys so pre-readers can learn each icon meaning by sound.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays active `games.pictureToWordBuilder.instructions.*` or current word prompt | Prompt pulse + current picture/slot emphasis. |
| Retry round | `↻` | Plays `feedback.encouragement.*`, then replays target word audio | Resets current word build with same concept scaffold. |
| Hint | `💡` | Plays segmented support from `games.pictureToWordBuilder.hints.segmented.*` | Highlights next slot or target-letter support cue. |
| Next / continue | `→` | Plays short transition cue from `feedback.success.*` | Advances to next word round after micro-celebration. |

## Difficulty Curve
- Level 1 (Guided Build):
  - 2-3 letter high-frequency words with mostly phoneme-unique letters.
  - First letter prefilled.
  - Max 1 distractor tile (non-confusable).
  - Full-word replay always visible.
- Level 2 (Core Build):
  - 3-4 letter words, no prefilled letters.
  - Max 2 distractor tiles.
  - Only one confusion dimension per round: visual similarity OR phonetic similarity (never both together).
  - Optional segmented-sound hint (slow syllable/phoneme chunking).
- Level 3 (Independent Build):
  - 4-5 letter words from known vocabulary set.
  - Reduced visual guides and max 3 distractor tiles.
  - Same-sound grapheme families are allowed only with anchor-word audio support.
  - "Choose the correct spelling" appears only as a dedicated checkpoint round (not mixed into a drag-build round).
- Adaptive rules:
  - Use a 3-step scaffold ladder: `S0` (base support), `S1` (+next-slot highlight), `S2` (+first-letter cue and reduced distractors).
  - 2 misses in a row -> move up exactly one scaffold step.
  - 3 clean rounds -> move down exactly one scaffold step.
  - Each transition changes one variable only (difficulty isolation).
  - Confusion on a specific letter pair triggers fixed remediation flow:
    1. A/B isolated contrast
    2. anchor-word contrast
    3. near-transfer round

## Distractor Policy
- Introduce distractors from easiest to hardest:
  1. non-confusable filler letters
  2. visually similar letters
  3. same-sound grapheme families
- Never introduce a new word length and a new distractor class in the same progression step.
- Keep at most one high-confusability pair active in any single round.

## Feedback Design
- Success path:
  - Word is read aloud after completion.
  - Positive reinforcement animation and rotating praise phrase.
  - Sticker reward every 3 successful builds.
- Mistake path:
  - No negative buzzer or red X.
  - Incorrect tile gently snaps back with a short "try again" cue and highlighted target slot.
  - Gentle prompt to listen again with optional segmented replay.
  - Child retries same word with light scaffold increase.
- Encouragement pattern:
  - Celebrate effort and listening strategy.
  - Keep retry loop short to avoid frustration.

## Session Design
- Expected play time: 5-8 minutes.
- Session shape: 6 core build rounds with adaptive progression + up to 2 optional bonus rounds for ages 6-7.
- Natural stopping points:
  - Midpoint pause after round 3.
  - End recap with 1-2 mastered words highlighted for parent co-play.
- Replay value:
  - Word bank rotates across household-relevant Hebrew vocabulary (food, animals, home objects).

## Implementation Notes
- Recommend an explicit state machine (`prompt -> build -> validate -> celebrate|retry -> adapt -> next`) to avoid impossible transitions during scaffold changes.
- Keep drag as the primary input mode for all levels. If tap-to-place is added as assist mode, it should activate only inside `S2`.

## Audio Requirements
- All visible strings must use i18n keys with Hebrew narration pairings.
- Required key families:
  - `games.pictureToWordBuilder.title`
  - `games.pictureToWordBuilder.subtitle`
  - `games.pictureToWordBuilder.instructions.*`
  - `games.pictureToWordBuilder.prompts.word.*`
  - `games.pictureToWordBuilder.hints.segmented.*`
  - `games.pictureToWordBuilder.feedback.*`
  - `letters.pronunciation.*` (tile tap replay)
  - `reading.wordAudio.*` (full-word pronunciation)
  - `feedback.encouragement.*`
  - `feedback.success.*`
- Audio file pattern:
  - `public/audio/he/games/picture-to-word-builder/*.mp3`
  - `public/audio/he/reading/*.mp3`
  - `public/audio/he/letters/*.mp3`
- Accessibility:
  - Replay controls (word and segmented modes) remain visible and 44px+.

## Parent Visibility
- Parent dashboard metrics:
  - Word-build accuracy by length (2-3, 3-4, 4-5 letters).
  - Hint reliance trend.
  - Most-confused letter substitutions.
- Parent summary keys:
  - `parentDashboard.games.pictureToWordBuilder.progressSummary`
  - `parentDashboard.games.pictureToWordBuilder.nextStep`

## Inspiration / References
- Teach Your Monster to Read: phonics-to-word-building progression.
- Khan Academy Kids: scaffold fade and adaptive support.
- Homer Learning: early literacy practice through image-word association.

## Review Status
- Mechanics tuned by Gaming Expert on 2026-04-10:
  - Progression adjusted to isolate one new variable at a time.
  - Distractor and remediation policy made explicit for implementation and QA.
