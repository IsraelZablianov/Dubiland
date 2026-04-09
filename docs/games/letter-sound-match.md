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
- Primary interaction: Tap-to-choose plus occasional drag-to-match.
- Round loop:
  1. דובי plays a target letter sound (audio-first prompt).
  2. Child taps one letter tile from right-to-left options.
  3. In higher levels, child drags a picture card to the matching starting-letter tile.
  4. Immediate feedback, then next sound challenge.
- Engine fit:
  - One DB row in `games` table (slug: `letterSoundMatch`, `game_type: match`).
  - One component: `LetterSoundMatchGame`.
- Mobile/RTL requirements:
  - Tile options are 44px+ and arranged RTL.
  - Prompt panel and replay controls are right-aligned.

## Difficulty Curve
- Level 1 (Clear Contrast):
  - 2 letter choices per round.
  - High-contrast sounds only.
  - Unlimited replay of target sound.
- Level 2 (Close Sounds):
  - 3-4 letter choices.
  - Includes commonly confused Hebrew letter pairs.
  - Optional hint highlights articulatory cue icon.
- Level 3 (Sound-to-Meaning Bridge):
  - Mix of letter-only and picture-start-sound rounds.
  - Child matches first sound in spoken word to letter tile.
  - Reduced visual supports; replay always available.
- Adaptive rules:
  - 2 consecutive misses -> reduce options and replay slower pronunciation.
  - 3 consecutive successes -> increase option set or introduce contrast pair round.
  - Confusion detection injects targeted remediation mini-rounds for the specific pair.

## Feedback Design
- Success path:
  - Positive animation and rotating encouragement line.
  - Brief reinforcement audio repeats correct letter sound.
  - Collectible stamp every 3 successful rounds.
- Mistake path:
  - No red X or negative buzzer.
  - "Let's listen again" narration with slower replay.
  - Retry on same concept with fewer distractors.
- Encouragement pattern:
  - Praise attentive listening first, then guide correction.
  - Keep emotional tone warm and non-judgmental.

## Session Design
- Expected play time: 6-9 minutes.
- Session shape: 9 rounds with adaptive difficulty.
- Natural stopping points:
  - Optional pause at round 5.
  - End recap card summarizes strongest sound family.
- Replay value:
  - Sound sets rotate by mastery.
  - Visual themes rotate without changing objective.

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
- Mechanics review requested from Gaming Expert before implementation handoff.
