# Final Forms Video Pedagogy (Hebrew: סרטון אותיות סופיות)

## Learning Objective
- Curriculum stage: Letter Recognition -> Word Reading transfer.
- Core reading skill: understand and recognize Hebrew final forms (ך, ם, ן, ף, ץ) as word-final variants of known base letters.
- Measurable outcome: after viewing + embedded checkpoints, child identifies correct final form in >=80% of guided prompts.
- Milestone mapping (age ~6):
  - Connects base letter to matching final form.
  - Applies final-form recognition in short pointed words.

## Curriculum Position
- Placement in reading ladder: after base letter familiarity and before extended phrase/story reading where final forms appear frequently.
- Prerequisites:
  - Child recognizes base letters כ/מ/נ/פ/צ.
  - Child can follow short audio-led instruction segments.
- What comes next:
  - `Sofit Word-End Detective` gameplay practice.
  - Decodable phrase reading with mixed final forms.

## Target Age Range
- Primary: 5.5-6.8

## Mechanic
- Primary interaction: short animated teaching video with embedded tap checkpoints.
- Core loop:
  1. דובי introduces one base/final pair with animation.
  2. Child taps correct final form in a mini-checkpoint.
  3. Video models one pointed word with that final form.
  4. Child completes quick 2-option review before next pair.
- Engine fit:
  - One DB row in `games` table (`slug: finalFormsVideoPedagogy`, `game_type: learning_video_checkpoint`).
  - One component: `LearningVideoCheckpointGame` with Remotion-backed clips.
- RTL/mobile requirements:
  - All overlays and checkpoint flows are RTL.
  - Tap hotspots and controls are >=44px.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Image Strategy
- Video is animation-first with letter-form focus.
- Use supportive visuals (objects/scene) only as background context, not as answer cues.
- Final-form checkpoints must remain letter-first with minimal visual distraction.

## Difficulty Curve
- Level 1 (Pair Introduction):
  - Introduce two base/final pairs with explicit side-by-side animation.
- Level 2 (Recognition Checkpoints):
  - Child chooses final form among base/final options in short embedded checks.
- Level 3 (Word Transfer):
  - Child identifies final form inside pointed words and short phrases.
- Adaptive support:
  - If checkpoint accuracy drops below 60%, replay micro-segment with slowed narration.
  - If accuracy >=85%, unlock next pair cluster.

## Feedback Design
- Success:
  - Immediate praise audio after each checkpoint.
  - Visual badge progress per mastered pair.
- Mistakes:
  - Gentle correction with immediate model replay.
  - No fail screens; always retry with hint available.
- Hint progression:
  1. Replay segment.
  2. Highlight final position in word.
  3. Show solved example, then retry.

## Session Design
- Session length: 8-10 minutes (video + checkpoints).
- Natural stopping points:
  - After each pair cluster.
  - End-of-video recap card.
- Replay hooks:
  - Daily “pair of the day” review clip.
  - Parent-triggered replay from dashboard.

## Audio Requirements
- All narration, prompts, and checkpoint cues must be i18n keyed and recorded.
- Required key families:
  - `videos.finalForms.title`
  - `videos.finalForms.instructions.*`
  - `videos.finalForms.narration.*`
  - `videos.finalForms.checkpoints.*`
  - `videos.finalForms.hints.*`
  - `videos.finalForms.feedback.success.*`
  - `videos.finalForms.feedback.retry.*`
  - `letters.baseAndFinal.*`
  - `words.pronunciation.*`
- Asset pattern:
  - `public/audio/he/videos/final-forms/*.mp3`
  - `public/video/he/final-forms/*.mp4`

## Parent Visibility
- Parent dashboard metrics:
  - Checkpoint accuracy by final-form pair.
  - Replay count and completion rate.
  - Recommended next game (`Sofit Word-End Detective`) when ready.
- Suggested key families:
  - `parentDashboard.videos.finalForms.progressSummary`
  - `parentDashboard.videos.finalForms.nextStep`

## Inspiration / References
- Khan Academy Kids: short direct-instruction clips with immediate child interaction.
- Reading Eggs: explicit grapheme focus before transfer practice.
- Ji Alef-Bet: Hebrew-specific letter teaching with audio reinforcement.

## Review Request
- Request Media Expert review for Remotion composition pacing and checkpoint timing.
- Request Content Writer review for Hebrew narration, nikud accuracy, and i18n/audio map.
