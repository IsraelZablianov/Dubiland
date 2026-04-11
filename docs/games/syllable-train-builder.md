# Syllable Train Builder (Hebrew: רכבת ההברות)

## Learning Objective
- Curriculum stage: Nikud -> Syllable Decoding -> Word Reading.
- Core reading skill: blend Hebrew graphemes into fluent CV and CVC syllables, then transfer to short pointed words without picture guessing.
- Measurable outcome: after 6 sessions, child reads Level 2 syllable trains with >=85% first-try accuracy and completes Level 3 pointed word transfer with >=80% independent success.
- Milestone mapping (age ~6):
  - Moves from letter-by-letter naming to true blending.
  - Recognizes open vs closed syllable shapes in beginner Hebrew words.

## Curriculum Position
- Placement in reading ladder:
  1. After foundational nikud mapping (`nikud-sound-ladder`).
  2. Before phrase-level reading and decodable micro-stories.
  3. In parallel with confusable and final-form spiral review.
- Prerequisites:
  - Child can identify core nikud in controlled contexts.
  - Child can match letter sounds with basic fluency.
- What comes next:
  - `shva-sound-switch` for advanced syllable nuance.
  - `decodable-micro-stories` and `decodable-story-missions` for connected text.

## Target Age Range
- Primary: 5.5-7
- Supported with scaffolding: advanced 5.0+

## Mechanic
- Primary interaction: drag grapheme tiles onto an RTL train rail, tap to hear segmented sounds, then blend and read aloud.
- Core loop:
  1. Child hears target syllable/word audio.
  2. Child taps candidate tiles to hear phoneme-level audio, then drags consonant and nikud tiles into correct RTL slots.
  3. Each drop validates immediately (correct snap/celebration or gentle bounce-back + hint), with no submit button.
  4. Child taps `▶` to play segmented audio then blended audio.
  5. Child completes one transfer item by selecting/read-building a matching pointed word.
- Engine fit:
  - One DB row in `games` (`slug: syllableTrainBuilder`, `game_type: blend_rail_builder`).
  - One runtime component: `SyllableTrainBuilderGame`.
- RTL/mobile requirements:
  - Rail starts on right edge and fills leftward.
  - Snap zones and tiles are >=44px with generous drag tolerance.
  - Avoid bottom-edge-only action hotspots on tablets; keep controls within thumb-safe center bands.
- Anti-random-tap guardrails:
  - First error is always low-friction retry; no penalties or fail states.
  - If 3 incorrect actions occur within 4 seconds, trigger "calm assist": pause input for 800ms, replay instruction audio, highlight the active slot, and temporarily reduce the tile bank.
  - Repeatedly dragging the same wrong tile into the same slot triggers immediate contrast audio + one-slot visual cue before next attempt.
  - Scoring tracks first-try accuracy only; unlimited retries remain available to keep play self-correcting.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), next/continue (`→`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays active prompt (`games.syllableTrainBuilder.instructions.*` or current prompt key). | Prompt pulse + rail focus ring on current target slot. |
| Retry round | `↻` | Encouragement cue (`games.syllableTrainBuilder.feedback.retry.*`) then prompt replay. | Soft reset to same concept with identical target difficulty. |
| Hint | `💡` | Tiered hint cue (`games.syllableTrainBuilder.hints.*`). | Shows one scaffold step (slot highlight or ghost tile). |
| Next / continue | `→` | Transition cue (`games.syllableTrainBuilder.feedback.success.*`) then next prompt audio. | Train moves to next station and next task enters. |

## Image Strategy
- Core decoding rounds are text+audio first.
- Light thematic train visuals provide motivation only.
- Transfer rounds may include small scene art after decoding is complete (never before).
- Fade plan:
  - Level 1: optional badge art for engagement.
  - Level 2+: no semantic picture cues during scored decoding.

## Difficulty Curve
- Level 1 (CV Builder):
  - Two-tile blends (consonant + nikud), 2-choice tile bank.
  - Segmented model plays automatically on first attempt.
  - Familiar consonants only.
- Level 2 (CVC Builder):
  - Add closing consonant to create CVC.
  - Introduce near-miss distractor tiles (same onset, different vowel/final consonant).
  - Auto-model fades after first successful streak.
- Level 3 (Word Transfer):
  - Build short pointed words (2-4 letters) from mixed tile banks.
  - Include one final-form target in every 4-5 items.
  - Require independent blend before acceptance.
- Promotion gates (mandatory):
  - Gate A (`CV -> CVC`): unlock Level 2 only after at least 10 CV items with >=85% first-try accuracy, coverage of >=4 nikud patterns, and <=2 hint uses in the last 6 items.
  - Gate B (`CVC -> Word Transfer`): unlock Level 3 only after at least 12 CVC items with >=80% first-try accuracy, >=75% success on near-miss distractors, and coverage of >=3 different closing consonants.
  - If a gate is not met, continue current level with reduced distractors and rotate exemplars; do not advance by time played alone.
- Regression safety:
  - If first-try accuracy drops below 60% over the last 6 scored items, step back one level for 3 scaffolded rounds.
  - If two rapid-tap alerts occur in one cluster, force one guided item before returning to normal independence.
- Adaptive scaffolding:
  - If 2 consecutive misses on same syllable shape, reduce tile bank size (4->2) for next 2 rounds.
  - If accuracy >=90% over last 12 items with low hints, skip auto-segmentation and increase independent turns.
  - If child over-relies on replay (`▶` >=4 in one round), trigger one guided mode item and then return to normal flow.

## Feedback Design
- Success:
  - Immediate praise linked to blending strategy ("חיברת צלילים מצוין!").
  - Visual train advances one station per mastered item.
- Mistakes:
  - No fail screens or negative sounds.
  - Wrong placement triggers soft bounce-back plus audio contrast.
  - Repeated miss triggers scaffolded solved step then immediate retry.
- Hint progression:
  1. Replay target sound and slow segmented model.
  2. Highlight next correct slot on rail.
  3. Ghost-place one tile and ask child to complete remaining blend.

## Session Design
- Session length: 6-9 minutes total, built from short loops.
- Session structure:
  - Loop A (2-3 minutes): warm-up CV rounds.
  - Loop B (2-3 minutes): core CV/CVC blending.
  - Loop C (2-3 minutes): transfer word rounds or guided recap.
- Natural stopping points:
  - End of each rail cluster (5 items).
  - Station checkpoint recap card.
- Replay hooks:
  - "Missed syllable station" appears at next session start.
  - Weekly mixed review includes previously mastered and currently weak shapes.

## Audio Requirements
- All child-visible strings must be i18n-keyed and accompanied by Hebrew audio.
- Required key families:
  - `games.syllableTrainBuilder.title`
  - `games.syllableTrainBuilder.instructions.*`
  - `games.syllableTrainBuilder.controls.*`
  - `games.syllableTrainBuilder.prompts.listen.*`
  - `games.syllableTrainBuilder.prompts.build.*`
  - `games.syllableTrainBuilder.prompts.transfer.*`
  - `games.syllableTrainBuilder.hints.*`
  - `games.syllableTrainBuilder.feedback.success.*`
  - `games.syllableTrainBuilder.feedback.retry.*`
  - `letters.pronunciation.*`
  - `nikud.pronunciation.*`
  - `syllables.pronunciation.*`
  - `words.pronunciation.*`
- Asset pattern:
  - `public/audio/he/games/syllable-train-builder/*.mp3`
  - `public/audio/he/syllables/*.mp3`
  - `public/audio/he/words/*.mp3`
- Audio behavior constraints:
  - Segmented-to-blended transition gap <=300ms.
  - Background music ducks by >=6dB during instructional audio.

## Parent Visibility
- Parent dashboard metrics:
  - CV vs CVC accuracy split.
  - Most-missed syllable patterns.
  - Hint reliance trend by level.
  - Transfer-read readiness for decodable stories.
- Suggested parent key families:
  - `parentDashboard.games.syllableTrainBuilder.progressSummary`
  - `parentDashboard.games.syllableTrainBuilder.patternBreakdown`
  - `parentDashboard.games.syllableTrainBuilder.nextStep`

## Inspiration / References
- Teach Your Monster to Read: playful blend-building loops.
- Reading Eggs: structured phonics progression with skill gates.
- Ji Alef-Bet: Hebrew decoding pacing and nikud sensitivity.

## Review Request
- Request FED review for rail interaction pacing, rapid-tap detection thresholds, and promotion-gate telemetry.
- Request Content Writer review for pointed word set sequencing, nikud coverage ordering, and icon-control audio script correctness.
