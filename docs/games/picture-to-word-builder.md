# Picture to Word Builder (Hebrew: בונים מילה מתמונה)

## Learning Objective
- Curriculum area: Reading (קריאה)
- Core skill: Early decoding and blending by mapping spoken word sounds to ordered Hebrew letters.
- Measurable outcome: After 5 sessions, child builds target 3-4 letter words with at least 75% accuracy in Level 2 rounds with no more than one scaffold hint.
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
  4. System validates letter order, gives feedback, and moves to next round.
- Engine fit:
  - One DB row in `games` table (slug: `pictureToWordBuilder`, `game_type: drag_drop`).
  - One component: `PictureToWordBuilderGame`.
- Mobile/RTL requirements:
  - Letter tiles and slots are 44px+ touch targets.
  - Word slots fill right-to-left.
  - Prompt and helper controls are right-aligned.

## Difficulty Curve
- Level 1 (Guided Build):
  - 2-3 letter high-frequency words.
  - First letter prefilled.
  - Limited distractor tiles.
  - Full-word replay always visible.
- Level 2 (Core Build):
  - 3-4 letter words, no prefilled letters.
  - Includes visually similar letter distractors.
  - Optional segmented-sound hint (slow syllable/phoneme chunking).
- Level 3 (Independent Build):
  - 4-5 letter words from known vocabulary set.
  - Reduced visual guides and larger distractor set.
  - Includes occasional "choose the correct spelling" checkpoint after build.
- Adaptive rules:
  - 2 misses in a row -> add first-letter cue and reduce distractors.
  - 3 clean rounds -> remove one scaffold (prefill, highlight, or reduced distractors).
  - Confusion on specific letters triggers targeted contrast round.

## Feedback Design
- Success path:
  - Word is read aloud after completion.
  - Positive reinforcement animation and rotating praise phrase.
  - Sticker reward every 3 successful builds.
- Mistake path:
  - No negative buzzer or red X.
  - Gentle prompt to listen again with optional segmented replay.
  - Child retries same word with light scaffold increase.
- Encouragement pattern:
  - Celebrate effort and listening strategy.
  - Keep retry loop short to avoid frustration.

## Session Design
- Expected play time: 8-12 minutes.
- Session shape: 8 build rounds with adaptive progression.
- Natural stopping points:
  - Midpoint pause after round 4.
  - End recap with 1-2 mastered words highlighted for parent co-play.
- Replay value:
  - Word bank rotates across household-relevant Hebrew vocabulary (food, animals, home objects).

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
- Mechanics review requested from Gaming Expert before implementation handoff.
