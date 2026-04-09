# Letter Sound Match (Hebrew: התאמת צליל לאות)

## Learning Objective
- Curriculum area: Letters (אותיות)
- Core skill: Hebrew phoneme-to-letter mapping (hearing a sound and identifying the matching grapheme).
- Measurable outcome: After 4 sessions, child identifies the correct target letter sound in at least 80% of Level 2 rounds with no more than one hint per round.
- Milestone mapping:
  - Ages 4-5: distinguish highly contrasted letter sounds.
  - Ages 5-6: handle visually/phonologically similar Hebrew letters with scaffolded support.

## Target Age Range
- Primary: 4-6
- Secondary stretch: early 7

## Mechanic
- Primary interaction: Tap-to-choose (default for all ages); optional drag appears only in late hard rounds with tap fallback always available.
- Round loop:
  1. דובי plays a target letter sound (audio-first prompt).
  2. Child taps one letter tile from right-to-left options.
  3. In advanced rounds, child maps the first sound in a spoken word to the matching letter tile (tap first, optional drag extension only after mastery).
  4. Immediate micro-feedback, then next sound challenge.
- Engine fit:
  - One DB row in `games` table (slug: `letterSoundMatch`, `game_type: match`).
  - One component: `LetterSoundMatchGame`.
- Mobile/RTL requirements:
  - Tile options are 44px+ and arranged RTL.
  - Prompt panel and replay controls are right-aligned.
  - Avoid bottom-edge critical controls on tablet layouts.

## Pre-Literate UX Baseline (Mandatory)
- Every instruction text shown to the child must include an adjacent `▶` play icon (minimum 44px) that replays the exact instruction audio.
- Child-facing controls are icon-first, not text-first. Use persistent icons for replay (`▶`), retry (`↻`), hint (`💡`), and next (`→`).
- Text labels may appear only as supporting parent/teacher UI; gameplay controls for children must remain understandable via icon + audio alone.
- Feedback and validation are action-based: the game responds immediately to taps, drags, traces, or spoken input and never requires a separate `check` or `test` button.
- Icon taps trigger short narrated cues from i18n/audio keys so pre-readers can learn each icon meaning by sound.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays active `games.letterSoundMatch.instructions.*` or current sound prompt | Prompt pulse + target-listening focus effect. |
| Retry round | `↻` | Plays `feedback.encouragement.*`, then repeats current sound prompt | Keeps same concept and reduces distractors if needed. |
| Hint | `💡` | Plays scaffold cue from `games.letterSoundMatch.hints.*` | Highlights articulatory cue or target-support visual. |
| Next / continue | `→` | Plays short cue from `feedback.success.*` | Advances to the next sound challenge. |

## Difficulty Curve
- Letter-sound release order (phoneme clarity first):
  - Easy set: phoneme-distinct letters only (example: מ, נ, ל, ס, ש, פ).
  - Medium set: add closer contrasts one at a time (example: ב vs פ, ד vs ר as visual distractor rounds).
  - Late hard set: same-phoneme grapheme families (example: ט/ת, ק/כ, ס/שׂ, א/ע) only with explicit word-context scaffolding, never as isolated-sound-only rounds.
- Level 1 (Clear Contrast):
  - 2 -> 3 letter choices per round.
  - High-contrast sounds only.
  - Unlimited replay of target sound.
  - No drag mechanic.
- Level 2 (Close Sounds):
  - 3 choices by default; 4 choices only after stable success.
  - Includes one commonly confused Hebrew pair per round block (never two new confusion pairs together).
  - Optional hint highlights articulatory cue icon.
- Level 3 (Sound-to-Meaning Bridge):
  - Structured sequence: letter-only rounds first, then picture-start-sound rounds.
  - Child matches first sound in spoken word to letter tile.
  - Reduced visual supports gradually; replay always available.
- Adaptive rules:
  - 2 consecutive misses -> reduce options by one, replay slower pronunciation, and keep the same target concept.
  - 3 consecutive successes -> increase one variable only (more options OR one new pair OR less visual support).
  - 3 errors on the same pair across 5 rounds -> inject targeted remediation mini-cycle for that pair before progression resumes.

## Confusion-Pair Remediation
- Remediation mini-cycle (single pair only):
  1. Isolated A/B listen-then-choose round (2 options).
  2. Anchor-word contrast round with clear starter words for each letter.
  3. Return round with one neutral distractor to confirm transfer.
- If the child still misses after the mini-cycle:
  - Mark pair as "high-support required" for this session.
  - Continue with easier phoneme-distinct set and retry the pair in the next session.

## Feedback Design
- Success path:
  - Positive animation and rotating encouragement line.
  - Brief reinforcement audio repeats correct letter sound.
  - Collectible stamp every 3 successful rounds.
- Mistake path:
  - No red X or negative buzzer.
  - "Let's listen again" narration with slower replay.
  - Retry on same concept with fewer distractors.
  - After third miss on the same prompt, briefly reveal correct tile + replay sound, then give one immediate near-transfer retry.
- Encouragement pattern:
  - Praise attentive listening first, then guide correction.
  - Keep emotional tone warm and non-judgmental.

## Session Design
- Expected play time: 3-5 minutes.
- Session shape: 6 adaptive rounds (+ up to 2 optional bonus rounds for ages 5-6).
- Natural stopping points:
  - Optional pause at round 3.
  - End recap card summarizes strongest sound family.
- Replay value:
  - Sound sets rotate by mastery.
  - Visual themes rotate without changing objective.

## Edge Cases and Failure Recovery
- Random tapping streak:
  - Detect 4 rapid incorrect taps -> temporarily lock to 2 options and force replay-before-next-tap for one round.
- Audio overlap:
  - Latest instruction audio interrupts praise audio to preserve prompt clarity.
- Inactivity:
  - If no interaction for 7 seconds, replay instruction and pulse one candidate.
- Ambiguous grapheme families:
  - When target sound maps to multiple letters in Modern Hebrew, require word-context prompt; do not score isolated-sound selection as incorrect without that context.

## Audio Requirements
- All user-facing text uses i18n keys with Hebrew audio pairings.
- Required key families:
  - `games.letterSoundMatch.title`
  - `games.letterSoundMatch.subtitle`
  - `games.letterSoundMatch.instructions.*`
  - `games.letterSoundMatch.prompts.listen.*`
  - `games.letterSoundMatch.hints.*`
  - `games.letterSoundMatch.success.*`
  - `letters.pronunciation.*` (target letter sounds)
  - `letters.sampleWords.*` (Level 3 bridge rounds)
  - `feedback.encouragement.*`
  - `feedback.success.*`
- Audio file pattern:
  - `public/audio/he/games/letter-sound-match/*.mp3`
  - `public/audio/he/letters/*.mp3`
- Accessibility:
  - Replay sound button must remain visible (44px+).
  - Optional slower replay mode for all target sounds.

## Parent Visibility
- Parent dashboard metrics:
  - Accuracy by letter sound family.
  - Most-confused sound pairs.
  - Trend from high-support to low-support rounds.
- Parent summary keys:
  - `parentDashboard.games.letterSoundMatch.progressSummary`
  - `parentDashboard.games.letterSoundMatch.nextStep`

## Inspiration / References
- Teach Your Monster to Read: phonics progression structure.
- Endless Alphabet: memorable sound-letter reinforcement through playful feedback.
- Khan Academy Kids: adaptive challenge and calm retry loops.

## Review Status
- Mechanics review finalized by Gaming Expert on 2026-04-10; ready for FED implementation and Content Writer audio alignment.
