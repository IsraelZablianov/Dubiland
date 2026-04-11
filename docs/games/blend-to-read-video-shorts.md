# Blend to Read Video Shorts (Hebrew: סרטוני חיבור לקריאה)

## Learning Objective
- Curriculum stage: Nikud -> Syllable Decoding -> Early Word Reading.
- Core reading skill: model and rehearse Hebrew blending from isolated graphemes to pointed syllables/words through short interactive videos.
- Measurable outcome: after completing 6 short episodes, child scores >=80% on embedded blend checkpoints and shows reduced replay dependence (>=25% drop in prompt replays from episode 1 to 6).
- Milestone mapping (age ~6):
  - Understands that letters + nikud combine into pronounceable units.
  - Transfers modeled blending into quick child-action checkpoints.

## Curriculum Position
- Placement in reading ladder:
  1. After basic letter-sound familiarity.
  2. Parallel support to `nikud-sound-ladder` and `syllable-train-builder`.
  3. Before extended decodable-story tracks.
- Prerequisites:
  - Child can follow brief audio-led prompts.
  - Child can tap large icons and simple answer choices.
- What comes next:
  - Independent blending games.
  - Pointed phrase reading in story contexts.

## Target Age Range
- Primary: 5-6.8

## Mechanic
- Primary interaction: 90-120 second Remotion mini-episodes with 3 embedded interactive blend checkpoints.
- Core loop per episode:
  1. דובי introduces one target pattern (for example: CV with patah).
  2. Animated letters move into blend formation.
  3. Child completes a checkpoint (tap correct blend audio, choose built syllable, or pick matching pointed word).
  4. Episode ends with a one-line recap and next-step prompt.
- Engine fit:
  - One DB row in `games` (`slug: blendToReadVideoShorts`, `game_type: interactive_video_blending`).
  - One playback component: `LearningVideoCheckpointGame` with Remotion composition set.
- RTL/mobile requirements:
  - Overlay text and checkpoint UI are RTL.
  - Checkpoint targets are >=44px and reachable on tablet.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Image Strategy
- Animation emphasizes grapheme movement and blend structure.
- Character/scene visuals are secondary and must not carry answer information.
- Checkpoint overlays remain text/audio first, with minimal decorative noise.

## Difficulty Curve
- Level 1 Episodes (Sound Join Basics):
  - Single consonant + nikud blends (CV) with strong visual guidance.
  - 2-option checkpoints only.
- Level 2 Episodes (Blend Variations):
  - Mixed CV and easy CVC with near-miss options.
  - Reduced visual cueing after first replay.
- Level 3 Episodes (Word Transfer):
  - Short pointed word blending with one transfer phrase checkpoint.
  - Child performs at least one checkpoint without automatic model replay.
- Adaptive support:
  - If checkpoint accuracy <60% in an episode, auto-replay one micro segment at slower speed.
  - If child achieves >=85% in two consecutive episodes, unlock challenge episode with less cueing.

## Feedback Design
- Success:
  - Immediate praise linked to blending strategy.
  - Episode progress stars reward independent responses more than assisted ones.
- Mistakes:
  - Gentle correction with instant model replay and retry.
  - No fail-state screen; continue flow after corrected response.
- Hint progression:
  1. Replay target segment.
  2. Highlight moving grapheme path.
  3. Reduce to 2-choice checkpoint with solved sample first.

## Session Design
- Session length: 8-12 minutes (2-4 episodes).
- Natural stopping points:
  - End of each episode.
  - Mid-session recap after episode 2.
- Replay hooks:
  - "Pattern of the day" quick replay.
  - Parent-initiated replay from dashboard on weak patterns.

## Audio Requirements
- All narration, prompts, and checkpoint lines must be i18n-keyed and recorded in Hebrew.
- Required key families:
  - `videos.blendToRead.title`
  - `videos.blendToRead.instructions.*`
  - `videos.blendToRead.episodes.<id>.narration.*`
  - `videos.blendToRead.episodes.<id>.checkpoints.*`
  - `videos.blendToRead.hints.*`
  - `videos.blendToRead.feedback.success.*`
  - `videos.blendToRead.feedback.retry.*`
  - `syllables.pronunciation.*`
  - `words.pronunciation.*`
- Asset pattern:
  - `public/audio/he/videos/blend-to-read/*.mp3`
  - `public/video/he/blend-to-read/*.mp4`
- Audio behavior constraints:
  - Checkpoint audio starts <=250ms after tap.
  - Voice track remains clear above effects/music with >=6dB ducking on prompts.

## Parent Visibility
- Parent dashboard metrics:
  - Episode completion and checkpoint accuracy.
  - Replay count by pattern.
  - Recommended linked game (`syllable-train-builder`) for practice transfer.
- Suggested key families:
  - `parentDashboard.videos.blendToRead.progressSummary`
  - `parentDashboard.videos.blendToRead.patternBreakdown`
  - `parentDashboard.videos.blendToRead.nextStep`

## Inspiration / References
- Khan Academy Kids: short teach-check loops inside educational clips.
- Reading Eggs: explicit blending demonstrations before independent tasks.
- Teach Your Monster to Read: playful repetition across the same phonics target.

## Review Request
- Request Media Expert review for Remotion pacing, timing, and visual hierarchy.
- Request Content Writer review for Hebrew narration script and audio consistency.
