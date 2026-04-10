# Sight Word Sprint (Hebrew: מרוץ מילות תדירות)

## Learning Objective
- Curriculum stage: Sight Words / High Frequency (with ongoing word/phrase decoding).
- Core skill: build fast, accurate recognition of high-frequency Hebrew words in pointed and partially pointed contexts.
- Measurable outcome: after 5 sessions, child recognizes target sight words in >=85% of Level 2 trials and reads Level 3 sentence frames with <=1 hint per round.
- Milestone mapping (age ~6):
  - Increases automaticity for common function words and frequent lexical items.
  - Reduces cognitive load in connected-text reading by quickly identifying known words.

## Curriculum Position
- Placement in reading ladder:
  1. After basic word decoding and beginner phrase reading.
  2. Parallel with decodable micro-stories to improve fluency on frequent words.
  3. Before longer sentence/story fluency blocks.
- Prerequisites:
  - Child can decode simple pointed words and short two-word chunks.
  - Child can use icon-first controls (`▶`, `↻`, `💡`) without text-only labels.
- What comes next:
  - Faster phrase reading with reduced pauses.
  - Expanded comprehension prompts in leveled stories.

## Target Age Range
- Primary: 5.5-7
- Support mode: advanced 5.0+

## Mechanic
- Primary interaction by stage:
  - Stage 1: tap-select only (recognition focus).
  - Stage 2+: drag-complete sentence frame after recognition mastery.
- Core loop:
  1. דובי introduces 3 target high-frequency words with audio modeling.
  2. Child taps the heard target word from a short row of word cards.
  3. After stage gate, child drags the correct sight word into a short pointed sentence frame.
  4. Child reads completed phrase/sentence with optional replay support.
- Engine fit:
  - One DB row in `games` (`slug: sightWordSprint`, `game_type: sight_word_fluency`).
  - One component: `SightWordSprintGame`.
- RTL/mobile requirements:
  - Word rows and sentence frames are RTL-first.
  - Tap/drag targets are >=44px on tablet/mobile.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays active prompt (`games.sightWordSprint.instructions.*`) | Prompt pulse on active target row/frame slot |
| Retry round | `↻` | Encouragement + prompt replay (`feedback.encouragement.*`) | Resets current micro-round with same concept, no penalty |
| Hint | `💡` | Context hint (`games.sightWordSprint.hints.*`) | Highlights first grapheme cluster or valid frame slot |
| Next / continue | `→` | Transition cue + next prompt (`games.sightWordSprint.instructions.*`) | Smooth transition to next round block |

## Image Strategy
- Images support meaning only in onboarding moments for unfamiliar vocabulary.
- Fade plan:
  - Level 1: optional icon cue near new word introduction.
  - Level 2: no image cues during selection rounds.
  - Level 3: sentence-frame completion is text-only.
- Guardrail: children must identify target words from text+audio, not from picture matching.

## Difficulty Curve
- Level 1 (Guided Recognition):
  - 3 target sight words per session block, fully pointed.
  - 2-option selection trials with immediate replay support.
  - Tap-select only; no drag introduced yet.
- Level 2 (Fluency Contrast):
  - 5-6 target sight words, mostly pointed with one familiar partially pointed carryover.
  - 3-option trials with one controlled decoy family.
  - Introduce drag-to-frame using already-mastered words (3-4 word frames).
- Level 3 (Context Transfer):
  - 7-8 target words; selected words appear in short connected sentence pairs.
  - Step 3A: partial nikud fade on already-mastered function words (no timer change).
  - Step 3B (unlock only after Step 3A mastery): soft-timer pacing cue, no score penalty for time.
- Adaptive support:
  - If child misses the same target twice, reduce choices by one and replay model sentence.
  - If child confuses the same pair twice in a block, run deterministic remediation sequence:
    1. A/B isolated contrast (2 options only, same pair).
    2. Anchor-word contrast (target vs pair in short phrase).
    3. Near-transfer round with one fresh non-pair decoy.
  - If child gets 4 correct without hints, increase challenge by only one variable (either one extra option or one additional decoy family, not both).

## Decoy and Anti-Guess Guardrails
- Core-path decoy density cap:
  - Level 1: no visual-similar decoys.
  - Level 2: max 1 visual/sound-near decoy per trial.
  - Level 3: max 1 near decoy family per block of 4 trials.
- Accuracy-gated rewards:
  - Cosmetic streak rewards unlock only when first-attempt accuracy in the block is >=80% and hints <=1.
  - Rapid random tapping trigger: if 3 taps occur in <1.5s with <=33% accuracy, pause round, replay model, and restart same concept with reduced options.

## Feedback Design
- Success:
  - Immediate spoken reinforcement tied to reading strategy ("קראת נכון ובדיוק!").
  - Progress meter fills toward mini-session badge.
- Mistakes:
  - No punitive sounds or failure states.
  - First miss: replay word audio + slow highlight sweep.
  - Second miss: hint glow on first grapheme cluster and guided retry.
- Hint progression:
  1. Replay target word audio.
  2. Replay full sentence with target emphasis.
  3. Visual cue on target card/frame slot.
- Frustration prevention:
  - After two failed rounds in a row, auto-shift to simpler configuration (one fewer option, no new decoy family) for one recovery block.
  - After recovery success (2/2 correct), resume prior level settings.

## Session Design
- Session model: 3-5 minute micro-loop (one mastery block) with optional second loop.
- Session structure:
  - 60-90s word-intro block.
  - 2-3 minutes recognition/frame rounds.
  - 45-60s recap and one transfer check.
- Natural stopping points:
  - End of each 3-word mastery block.
  - End-of-session recap card.
- Replay hooks:
  - Spaced repetition for words missed in prior sessions.
  - Daily shuffled sentence frames using same mastered word set.

## Audio Requirements
- All child-visible strings are i18n-keyed with paired Hebrew audio.
- Required key families:
  - `games.sightWordSprint.title`
  - `games.sightWordSprint.instructions.*`
  - `games.sightWordSprint.prompts.wordIntro.*`
  - `games.sightWordSprint.prompts.wordSelect.*`
  - `games.sightWordSprint.prompts.frameComplete.*`
  - `games.sightWordSprint.hints.*`
  - `games.sightWordSprint.hints.confusionContrast.*`
  - `games.sightWordSprint.hints.remediation.*`
  - `games.sightWordSprint.hints.precisionNudge.*`
  - `games.sightWordSprint.feedback.success.*`
  - `games.sightWordSprint.feedback.retry.*`
  - `words.highFrequency.*`
  - `phrases.pronunciation.*`
  - `feedback.encouragement.*`
- Audio asset pattern:
  - `public/audio/he/games/sight-word-sprint/*.mp3`
  - `public/audio/he/words/high-frequency/*.mp3`
  - `public/audio/he/phrases/*.mp3`
- Audio behavior constraints:
  - Prompt replay must duck background audio by >=6dB.
  - Tap response audio should start within <=250ms to maintain rhythm.

## Parent Visibility
- Parent dashboard metrics:
  - Accuracy by high-frequency word.
  - Response speed trend for mastered words.
  - Hint usage by level.
  - Sentence-frame completion success rate.
- Suggested parent i18n key families:
  - `parentDashboard.games.sightWordSprint.progressSummary`
  - `parentDashboard.games.sightWordSprint.highFrequencyMastery`
  - `parentDashboard.games.sightWordSprint.nextStep`

## Inspiration / References
- Reading Eggs: high-frequency word practice embedded into decodable progression.
- Khan Academy Kids ELA: repeated exposure with varied mechanics for mastery.
- Teach Your Monster to Read: quick recognition loops with positive reinforcement.
- Ji Alef-Bet: Hebrew-specific pacing and audio-first support.

## Review Request
- Request Gaming Expert review for decoy balance, timing pressure, and hint ladder quality before implementation freeze.
