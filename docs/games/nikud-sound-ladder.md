# Nikud Sound Ladder (Hebrew: סולם צלילי ניקוד)

## Learning Objective
- Curriculum stage: Letter Recognition -> Nikud (Vowel Diacritics) -> Early Syllable Decoding.
- Core reading skill: bind six foundational nikud graphemes (ַ ָ ֶ ֵ ִ ֹ) to stable vowel sounds inside pointed Hebrew syllables.
- Measurable outcome: after 5 sessions, child identifies the correct nikud-sound match in >=85% of Level 2 rounds, reaches >=70% accuracy on near-foil pairs (`ַ/ָ`, `ֶ/ֵ`) once unlocked, and reads Level 3 pointed CV/CVC targets with <=1 hint per round.
- Milestone mapping (age ~6):
  - Stops treating nikud as visual decoration and reads it as part of the grapheme.
  - Transfers nikud recognition from isolated symbols to real syllables and simple words.

## Curriculum Position
- Placement in reading ladder:
  1. After letter form + sound familiarity (`letter-tracing-trail`, `letter-sound-match`, `confusable-letter-contrast`).
  2. Before `shva-sound-switch` and before broad phrase/story decoding.
  3. Parallel support for `picture-to-word-builder` when introducing pointed words.
- Prerequisites:
  - Child recognizes at least 15 core print letters in דפוס.
  - Child follows icon-first controls (`▶`, `↻`, `💡`) with audio prompts.
- What comes next:
  - `Syllable Train Builder` for fluent CV/CVC blending.
  - Controlled shva bridge (`shva-sound-switch`) after foundational vowel certainty.

## Target Age Range
- Primary: 5.0-6.3
- Support mode: advanced 4.8+

## Mechanic
- Primary interaction: tap-to-hear, then drag nikud to letter frame and read blended output.
- Core loop:
  1. דובי plays one target vowel sound.
  2. Child chooses the correct nikud mark from 2-4 options.
  3. Child drags the nikud to a highlighted consonant frame (RTL).
  4. Game plays blended syllable audio, then advances with action-triggered validation (no separate check/submit action).
- Solvability guardrail:
  - For same-sound grapheme pairs (`ַ/ָ`, `ֶ/ֵ`), prompts cannot use vowel sound alone.
  - These rounds must use nikud-name audio (`nikud.pronunciation.*`) or anchored pointed-word prompts to keep one unambiguous correct answer.
- Engine fit:
  - One DB row in `games` (`slug: nikudSoundLadder`, `game_type: nikud_match_blend`).
  - One runtime component: `NikudSoundLadderGame`.
- RTL/mobile requirements:
  - Consonant+nikud assembly and progression flow are RTL.
  - All interactive elements are >=44px touch targets.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction/prompt | `▶` | Replays active instruction/prompt (`games.nikudSoundLadder.instructions.*`, `games.nikudSoundLadder.prompts.*`) | Active target frame pulses. |
| Retry same concept | `↻` | Short encouragement (`games.nikudSoundLadder.feedback.retry.*`) then prompt replay | Soft reset to same target family with no penalty. |
| Hint ladder advance | `💡` | Next hint step (`games.nikudSoundLadder.hints.*`) | Visual scaffold for next valid move. |
| Next / continue | `→` | Round transition cue + next prompt | Smooth RTL transition to next round. |

## Image Strategy
- Level 1 includes small mnemonic illustrations for vowel memory anchors.
- Level 2 reduces image salience (grayscale/mini icon) so attention shifts to grapheme.
- Level 3 removes images from scored rounds; text+audio only.
- Guardrail: no scored item is answerable from image alone.

## Distractor Distance Rules (Lock-In)
- Distance classes:
  - `D3` (far): different vowel family and clearly different mark footprint/position.
  - `D2` (medium): different vowel family but closer visual density/placement.
  - `D1` (near): canonical confusion pairs `ַ/ָ` and `ֶ/ֵ`.
- Round composition:
  - Level 1: target + 1 foil (`D3` only).
  - Level 2: target + 2 foils (`D2` + `D3`); unlock `D1` only after mastery gate for that target family.
  - Level 3: target + 2-3 foils with exactly one `D1` foil maximum per round.
- Unlock rule for near foils (`D1`):
  - Child must reach >=80% accuracy in that nikud family across the last 10 attempts before `D1` appears.
- Safety rule:
  - Never present two same-sound graphemes in a sound-only prompt; use name/anchored prompts for those rounds.

## Difficulty Curve
- Level 1 (Guided Nikud Recognition):
  - 2-option choice, isolated nikud listening rounds.
  - Immediate model replay after every response.
  - First 6 scored rounds use `D3` foils only.
  - Only one new nikud introduced every 4-5 items.
- Level 2 (Nikud In Syllables):
  - 3-option choice plus drag-to-attach interaction.
  - CV targets first, then easy CVC targets with familiar consonants.
  - Introduce `D2` foils by default; `D1` only after family unlock.
  - Reduced cueing after first second of each round.
- Level 3 (Transfer To Words):
  - Short pointed words (2-4 letters) with one target nikud focus.
  - Mixed review of previously taught nikud in randomized order.
  - 3-4 options per round; at most one `D1` foil.
  - No image support in scored rounds.
- Progression thresholds (age ~6 default):
  - `Level 1 -> Level 2`: in two consecutive 10-item scored blocks, child gets `>=8/10` correct and `>=6/10` independent (hint stage 0-1).
  - `Level 2 -> Level 3`: across two consecutive 10-item blocks, child gets `>=17/20` overall, `>=70%` on `D1` near-foil rounds, and uses hint stage 3 no more than once per block.
  - `Level 3 mastery`: `>=12/15` correct on mixed CV/CVC/word targets with average hints `<=1` per round.
  - Support mode (advanced 4.8+): lower accuracy gates by 10 percentage points and cap options at 3.
- Regression and recovery:
  - If child misses 2 consecutive items in same nikud family, auto-return to isolated listening for 2 recovery items.
  - If block accuracy drops below 50% after first 6 scored items, step down one level band for 6 recovery rounds.
  - If frustration signal (rapid random taps) appears twice in one block, trigger short mascot reset and continue at lower option count.

## Feedback Design
- Success:
  - Immediate strategy praise tied to decoding behavior ("שמעת ובחרת נכון!").
  - Progress ladder fills one step per independently correct item.
- Mistakes:
  - No punitive feedback.
  - First miss: replay target sound + visual highlight on target zone.
  - Second miss: narrow candidate field (remove impossible options) and retry same target.
  - Third miss: show one solved model item, then retry at 2-option difficulty.
- Hint progression:
  1. Stage 1 (first miss or 4s inactivity): replay target sound (`▶`) + target frame pulse.
  2. Stage 2 (second miss or 8s inactivity): blink candidate nikud positions and dim impossible options.
  3. Stage 3 (third miss or 12s inactivity): show one solved example with same vowel before retry.
- Hint reset behavior:
  - One fully independent correct round lowers active hint stage by one.
  - Two consecutive independent rounds reset hint stage to zero.

## Session Design
- Session length: 6-10 minutes total, built from short 2-4 minute loops.
- Session structure:
  - Warm-up listening cluster (1-2 min).
  - Core choose+drag rounds (3-5 min).
  - Transfer mini-word recap (1-2 min).
- Natural stopping points:
  - End of each nikud cluster.
  - End-of-session recap card with next recommended game.
- Replay hooks:
  - Daily mixed review of most-missed nikud.
  - Spaced repetition schedules weak nikud families in next session opener.

## Audio Requirements
- All user-facing text is i18n-keyed and paired with Hebrew audio.
- Required key families:
  - `games.nikudSoundLadder.title`
  - `games.nikudSoundLadder.instructions.*`
  - `games.nikudSoundLadder.prompts.listen.*`
  - `games.nikudSoundLadder.prompts.match.*`
  - `games.nikudSoundLadder.prompts.transfer.*`
  - `games.nikudSoundLadder.hints.*`
  - `games.nikudSoundLadder.feedback.success.*`
  - `games.nikudSoundLadder.feedback.retry.*`
  - `nikud.pronunciation.*`
  - `syllables.pronunciation.*`
  - `words.pronunciation.*`
- Asset pattern:
  - `public/audio/he/games/nikud-sound-ladder/*.mp3`
  - `public/audio/he/nikud/*.mp3`
  - `public/audio/he/syllables/*.mp3`
- Audio behavior constraints:
  - Instruction audio starts in <=250ms after icon tap.
  - Prompt/hint audio ducks background by >=6dB.

## Parent Visibility
- Parent dashboard metrics:
  - Accuracy by nikud symbol.
  - Confusion pairs (example: segol vs tzere).
  - Independent vs hint-assisted success rate.
  - Recommended next step (`Syllable Train Builder` or `Shva Sound Switch`).
- Suggested parent key families:
  - `parentDashboard.games.nikudSoundLadder.progressSummary`
  - `parentDashboard.games.nikudSoundLadder.confusions`
  - `parentDashboard.games.nikudSoundLadder.nextStep`

## Inspiration / References
- Ji Alef-Bet: Hebrew-first nikud presentation for beginners.
- Reading Eggs: explicit phonics sequencing before connected text.
- Khan Academy Kids ELA: mastery-based progression with clear parent visibility.

## Review Request
- Request Gaming Expert review for distractor quality and adaptive threshold tuning.
- Request Content Writer review for nikud naming consistency and audio script brevity.
