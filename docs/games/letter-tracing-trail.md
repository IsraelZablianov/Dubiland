# Letter Tracing Trail (Hebrew: מסלול עקיבת אותיות)

## Learning Objective
- Curriculum area: Letters (אותיות)
- Core skill: Hebrew letter-shape recognition and early handwriting motor patterning.
- Measurable outcome: After 4 sessions, child traces at least 10 target letters with 80% completion accuracy and reduced hint usage.
- Milestone mapping:
  - Ages 3-4: recognize and trace basic letter forms with full visual scaffolds.
  - Ages 5-6: trace with lighter scaffolds and link letter shape to spoken sound.

## Target Age Range
- Primary: 3-5
- Secondary stretch: early 6

## Mechanic
- Primary interaction: Finger tracing along guided letter paths.
- Round loop:
  1. דובי introduces one target letter with pronunciation audio.
  2. Child traces from animated start-point marker through directional path.
  3. Stroke validation checks path overlap and completion threshold.
  4. On completion, letter animates with a playful word association card.
- Engine fit:
  - One DB row in `games` table (slug: `letterTracingTrail`, `game_type: trace`).
  - One component: `LetterTracingTrailGame`.
- Mobile/RTL requirements:
  - Large writing canvas and controls (44px+ touch targets).
  - Instruction and progress UI aligned RTL.
  - Stroke direction cues presented right-to-left where script context requires it.

## Difficulty Curve
- Level 1 (Guided Trace):
  - 6 introductory letters.
  - Thick path, visible arrows, magnetic snap-to-path support.
  - Full audio guidance on each stroke.
- Level 2 (Light Guidance):
  - 12 letters including visually similar pairs.
  - Thinner path, start-point cue only, reduced snap support.
  - Audio prompt available on replay tap.
- Level 3 (Sound + Trace Link):
  - 18+ letters across sessions.
  - Child hears a letter sound, selects correct letter tile, then traces it with minimal guides.
  - Introduces gentle discrimination of similar forms.
- Adaptive rules:
  - 2 failed traces -> re-enable thicker path and stroke ghost animation.
  - 3 successful traces in a row -> advance to lighter scaffold.
  - Confusion pattern on similar letters -> inject contrast rounds with extra audio emphasis.

## Feedback Design
- Success path:
  - Letter comes alive with celebratory micro-animation and friendly praise.
  - Optional "word starts with this letter" audio tag for enrichment.
  - Progress stamps fill a session trail map.
- Mistake path:
  - No error buzzer or red X.
  - Gentle rewind of stroke with "let's try together" narration.
  - Visual ghost hand shows the next valid stroke segment.
- Encouragement pattern:
  - Praise effort and persistence before correction.
  - Keep retry loop immediate and emotionally safe.

## Session Design
- Expected play time: 6-9 minutes.
- Session shape: 8 trace rounds (adaptive letter mix).
- Natural stopping points:
  - After round 4 with optional pause.
  - End-of-session letter recap card for parent-child co-view.
- Replay value:
  - Letter order rotates by child mastery.
  - Theme skins vary visual context while preserving tracing objective.

## Audio Requirements
- All copy must use i18n keys and paired Hebrew narration audio.
- Required key families:
  - `games.letterTracingTrail.title`
  - `games.letterTracingTrail.subtitle`
  - `games.letterTracingTrail.instructions.*`
  - `games.letterTracingTrail.letterPrompt.*`
  - `games.letterTracingTrail.strokeHint.*`
  - `games.letterTracingTrail.completionPraise.*`
  - `letters.pronunciation.*` (per target letter)
  - `feedback.encouragement.*`
  - `feedback.success.*`
- Audio file pattern:
  - `public/audio/he/games/letter-tracing-trail/*.mp3`
  - `public/audio/he/letters/*.mp3` for per-letter pronunciation clips.
- Accessibility:
  - Replay button for instruction and letter sound always visible (44px+).

## Parent Visibility
- Parent dashboard metrics:
  - Letters attempted vs letters traced with no heavy hint.
  - Most-confused letter pairs (for targeted support).
  - Improvement trend in tracing completion quality.
- Parent summary keys:
  - `parentDashboard.games.letterTracingTrail.progressSummary`
  - `parentDashboard.games.letterTracingTrail.nextStep`

## Inspiration / References
- Montessori Preschool: guided discovery and non-punitive error handling.
- Endless Alphabet: letter-sound association with character animation.
- TinyTap: simple trace/tap mechanics suitable for early learners.

## Review Status
- Mechanics review requested from Gaming Expert before implementation handoff.
