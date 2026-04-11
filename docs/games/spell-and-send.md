# Spell-and-Send (Hebrew: דואר מאייתים)

## Learning Objective
- Curriculum area: Reading/Writing bridge (קריאה וכתיבה)
- Core skill: encode heard Hebrew words into correct RTL letter order with gradual scaffold fade.
- Measurable outcome: After 5 sessions, child spells at least 80% of level-calibrated target words on first attempt, with improved first-error-position correction across retries.
- Milestone mapping:
  - Ages 6-7: transition from decoding/listening recognition to active spelling production.
  - Stretch target: apply spelling strategy to short phrase chunks.

## Target Age Range
- Primary: 6-7

## Mechanic
- Primary interaction: Drag-and-place letters into RTL slots, with tap-to-place fallback.
- Round loop:
  1. Audio-first prompt plays target word twice (normal pace + segmented replay option).
  2. Child drags letters into slots from a small candidate bank.
  3. Validation happens immediately when each slot is filled; no separate check button.
  4. Correct completion animates postcard send action and unlocks next round.
- Engine fit:
  - One DB row in `games` table (slug: `spellAndSend`, `game_type: drag_drop`).
  - One component: `SpellAndSendGame`.
- Mobile/RTL requirements:
  - Slot order is RTL and visually stable across rounds.
  - Letter bank remains 44px+ with spacing tuned for precise touch.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Difficulty Curve
- Level 1 (Guided 3-Letter Words):
  - Short pointed words with clear phoneme-letter mapping.
  - Choices: target letters + 1 distractor.
  - First letter can be pre-anchored for onboarding rounds.
- Level 2 (4-Letter Words, Reduced Scaffolds):
  - Slightly longer words, reduced visual supports, controlled distractors.
  - Pointing remains available via hint path only.
  - First-error-position highlight appears after incorrect full attempt.
- Level 3 (Phrase Chunk Transfer):
  - Child spells high-frequency two-word chunks or morphologically related variants.
  - Distractors include plausible confusable letters.
  - Segmented audio hint is optional and not auto-played.
- Adaptive rules:
  - 2 consecutive misses -> lock first correct letter and replay segmented audio.
  - 3 consecutive first-attempt successes -> increase one variable only (word length OR distractor similarity).
  - Promotion gate L1->L2: first-attempt success `>=75%` over last 8 rounds.
  - Promotion gate L2->L3: first-attempt success `>=80%` over last 10 rounds and hint usage `<=30%`.

## Feedback Design
- Success feedback:
  - Postcard send animation + celebration audio.
  - Reinforcement line names spelled word aloud.
- Mistake handling:
  - No punitive error sounds or red failure overlays.
  - Soft correction focuses on first wrong slot only.
  - Immediate retry with same objective and reduced distractors.
- Encouragement pattern:
  - Praise listening and persistence before correction.

## Session Design
- Expected play time: 6-8 minutes.
- Session shape: 6-9 spelling rounds.
- Natural stopping points:
  - Mid-session pause card after round 4.
  - End recap card with "words sent" and one next-focus hint.
- Replay value:
  - Rotating postcard themes (family, holiday, school day) while keeping literacy objective stable.

## Audio Requirements
- All user-facing strings must be i18n-keyed with paired Hebrew narration.
- Required key families:
  - `games.spellAndSend.title`
  - `games.spellAndSend.subtitle`
  - `games.spellAndSend.instructions.*`
  - `games.spellAndSend.prompts.level1.*`
  - `games.spellAndSend.prompts.level2.*`
  - `games.spellAndSend.prompts.level3.*`
  - `games.spellAndSend.hints.*`
  - `games.spellAndSend.recovery.*`
  - `letters.pronunciation.*`
  - `words.pronunciation.*`
  - `feedback.success.*`
  - `feedback.encouragement.*`
- Audio file pattern:
  - `public/audio/he/games/spell-and-send/*.mp3`
- Accessibility:
  - Replay/hint controls always visible; segmented replay available without leaving round context.

## Parent Visibility
- Parent dashboard metrics:
  - Accuracy by word-length band (`3-letter`, `4-letter`, `phrase`).
  - First-error-position trend (orthographic stability signal).
  - Hint usage and retry recovery rate.
- Parent summary keys:
  - `parentDashboard.games.spellAndSend.progressSummary`
  - `parentDashboard.games.spellAndSend.nextStep`

## Inspiration / References
- Duolingo ABC: short mastery loops and immediate retry.
- TinyTap: tactile letter arrangement patterns.
- Teach Your Monster to Read: strong decode-to-encode bridge through playful mission framing.

## Review Status
- Mechanics review requested from Gaming Expert (pending).
