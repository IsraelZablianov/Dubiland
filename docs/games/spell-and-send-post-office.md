# Spell-and-Send Post Office (Hebrew: דואר מאייתים)

## Learning Objective
- Curriculum stage: Syllable Decoding -> Word Reading -> Word Building (Encoding).
- Core reading skill: encode heard Hebrew pointed words into correct RTL grapheme order, including final forms in word-final position.
- Measurable outcome: after 6 sessions, child spells Level 2 words with >=80% first-try slot accuracy and >=75% independent completion at Level 3.
- Milestone mapping (age ~6):
  - Converts speech/phonology into orthographic sequences (orthographic mapping support).
  - Strengthens decoding-to-encoding transfer before sentence-level fluency ramps.

## Curriculum Position
- Placement in reading ladder:
  1. After stable CV/CVC blending (`syllable-train-builder`, `sound-slide-blending`).
  2. After early word decoding lanes (`picture-to-word-builder`, `sight-word-sprint`).
  3. Before long connected-text fluency and morphology-heavy work.
- Prerequisites:
  - Child reads short pointed words with moderate independence.
  - Child can drag or tap letters into RTL slot targets.
- What comes next:
  - `pointing-fade-bridge` for partial/unpointed reading transfer.
  - Decodable story lanes with stronger independent word recognition.

## Target Age Range
- Primary: 6.0-7.0
- Entry support: strong 5.8+

## Mechanic
- Primary interaction: hear a word, then drag/tap letter tiles into RTL postcard slots; each placement validates immediately.
- Core loop:
  1. Child hears target word (`▶` replay available).
  2. Child fills RTL slots from a mixed tile bank.
  3. Each slot placement snaps if correct or bounces back with scaffold if incorrect.
  4. When all slots are filled correctly, דובי "sends" the postcard and unlocks the next word.
- Engine fit:
  - One DB row in `games` (`slug: spellAndSendPostOffice`, `game_type: rtl_word_encoding`).
  - One runtime component: `SpellAndSendPostOfficeGame`.
- RTL/mobile requirements:
  - Slot order, cursor motion, and animations are right-to-left.
  - Tiles/slots are >=44px with tap-to-place fallback for children who avoid drag.
  - Tap-to-place contract: child can tap a slot then tap a tile; on correct placement the next empty slot auto-focuses in RTL order.
  - Drag and tap paths share the same validation/hint logic so motor preference never changes scoring difficulty.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Icon Inventory (Mandatory)

| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay word/prompt | `▶` | Replays target word + short cue (`games.spellAndSendPostOffice.prompts.*`) | Active slots pulse in RTL order. |
| Retry word | `↻` | Encouragement retry line (`games.spellAndSendPostOffice.feedback.retry.*`) | Current word resets with same target. |
| Hint | `💡` | Tiered hint (`games.spellAndSendPostOffice.hints.*`) | Reveals one scaffold step (first phoneme, correct slot glow, reduced bank). |
| Continue | `→` | Send-transition cue (`games.spellAndSendPostOffice.feedback.success.transition.*`) | Postcard animates to mailbox and next word appears. |

## Image Strategy
- Onboarding only: small mailbox/theme icons for engagement.
- Scored spelling rounds are text+audio only; no semantic picture clues.
- Optional image appears after completion as reinforcement, never before/while solving.

## Difficulty Curve
- Level 1 (Guided 3-letter pointed words):
  - 3 slots; limited distractor bank (+1 decoy).
  - Auto-replay on first 2 seconds of inactivity.
  - First position can glow on first item of each session.
- Level 2A (4-letter pointed words):
  - 4 slots; distractors include confusable letters but no final-form contrasts yet.
  - Remove automatic first-slot cue after opening block.
  - Require independent first slot in >=70% of items.
- Level 2B (4-letter words with final-form focus):
  - Keep 4 slots and introduce one final-form family per block (for example כ/ך only).
  - Final-form target items stay between 25% and 35% of block volume (never back-to-back in first 3 items).
- Level 3A (5-letter single-word encoding):
  - 5 slots; still single-word only to isolate length increase.
  - Near-visual confusions unlock only after first 3 items in block.
- Level 3B (word-to-phrase bridge):
  - Short two-word micro chunk where child completes one missing target word.
  - Mixed pointing allowed on already mastered function words only.
- Promotion gates:
  - `L1 -> L2A`: >=8/10 words completed with <=2 stage-2+ hints.
  - `L2A -> L2B`: >=7/10 words with >=70% first-slot independent accuracy.
  - `L2B -> L3A`: >=16/20 correct slot placements first-try and >=75% correct on final-form position items.
  - `L3A -> L3B`: >=4/5 correct single-word items with <=1 stage-2+ hint.
  - `L3 mastery`: >=12/15 words/chunks with <=1 stage-3 hint in block.
- Supported-pass fairness:
  - Completed blocks below independent thresholds are recorded as `supported-pass` and repeat the same concept with lighter distractor load.
  - Regress one sub-stage only after two consecutive weak blocks (`<60%` independent completion).
- Recovery logic:
  - After two misses on one word, lock one correct letter and retry remaining slots.
  - Inactivity (`>=6s` no placement) triggers stage-1 replay before counting a miss.
  - Anti-guess tier 1: `>=4` incorrect placements in `<2s` -> pause `900ms`, replay whole word, keep same distractor set.
  - Anti-guess tier 2: `>=6` incorrect placements in `<3s` or `3` misses in `<20s` -> pause `1200ms`, replay segmented hint, remove one decoy tile for next 2 items (never below +1 decoy).

## Feedback Design
- Success:
  - Strategy praise tied to sequencing (for example: "שמעת, סידרת, ואייתת נכון!").
  - Mailbox progress map fills per independent completion.
- Mistakes:
  - First wrong tile: bounce-back + contrast cue.
  - Second wrong tile: highlight current target slot border.
  - Third miss: reveal one correct tile placement, then immediate child continuation.
- Hint progression:
  1. Replay whole word.
  2. Replay segmented syllables/phonemes.
  3. Reveal one correct position and reduce distractors.

## Session Design
- Session length: 4-6 minutes.
- Structure:
  - Warm-up (1-1.5 minutes): guided short words.
  - Core encoding block (2-3 minutes): target words by active sub-stage.
  - Wrap-up (about 1 minute): one transfer chunk and celebration recap.
- Natural stopping points:
  - Every 4 postcards sent.
  - End-of-route mailbox checkpoint.
- Replay hooks:
  - "Return-to-sender" list replays most-missed words next session.
  - Weekly spiral review includes final-form-heavy words.

## Audio Requirements
- All user-facing lines must be i18n-keyed and fully narrated in Hebrew.
- Required key families:
  - `games.spellAndSendPostOffice.title`
  - `games.spellAndSendPostOffice.instructions.*`
  - `games.spellAndSendPostOffice.prompts.*`
  - `games.spellAndSendPostOffice.hints.*`
  - `games.spellAndSendPostOffice.feedback.success.*`
  - `games.spellAndSendPostOffice.feedback.retry.*`
  - `games.spellAndSendPostOffice.controls.*`
  - `letters.pronunciation.*`
  - `words.pronunciation.*`
  - `syllables.pronunciation.*`
- Asset pattern:
  - `public/audio/he/games/spell-and-send-post-office/*.mp3`
  - `public/audio/he/words/*.mp3`
  - `public/audio/he/letters/*.mp3`
- Audio constraints:
  - Word replay latency <=250ms.
  - Segmented hint pacing uses <=350ms gaps between chunks.
  - Background bed ducks by >=6dB during prompt/hint audio.

## Parent Visibility
- Parent dashboard metrics:
  - Word encoding accuracy by length (3/4/5 letters).
  - Final-form position accuracy.
  - First-try slot accuracy vs assisted completion.
  - Recommended next step (`pointing-fade-bridge` or spelling recovery set).
- Suggested parent key families:
  - `parentDashboard.games.spellAndSendPostOffice.progressSummary`
  - `parentDashboard.games.spellAndSendPostOffice.finalFormAccuracy`
  - `parentDashboard.games.spellAndSendPostOffice.nextStep`

## Inspiration / References
- Teach Your Monster to Read: phonics practice with playful progression loops.
- Reading Eggs: explicit skill-gated literacy progressions.
- Ji Alef-Bet: Hebrew grapheme sensitivity and vowel-aware sequencing.

## Review Request
- Request Gaming Expert review for load management and anti-guessing thresholds in encoding rounds.
- Request Content Writer review for decodable word set curation, final-form distribution, and segmented audio scripts.
