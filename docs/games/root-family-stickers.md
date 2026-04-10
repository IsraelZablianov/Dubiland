# Root Family Stickers (Hebrew: מדבקות משפחת שורש)

## Learning Objective
- Curriculum stage: Morphology (Light) with continued word decoding.
- Core reading skill: identify a shared Hebrew root (שורש) across pointed words and decode simple root-family words with common prefixes/suffixes.
- Measurable outcome: after 5 sessions, child correctly groups root-family words in >=80% of Level 2 rounds and reads Level 3 phrase targets with <=1 hint per round.
- Milestone mapping (age ~6):
  - Notices repeated letter pattern in words (orthographic mapping support).
  - Connects meaning + sound across root families without guessing from picture alone.

## Curriculum Position
- Placement in reading ladder: after basic letter-sound fluency + beginner word reading (`letter-sound-match`, `picture-to-word-builder`, handbook Level 1/2 checkpoints).
- Prerequisites:
  - Child can decode short fully pointed CV/CVC words.
  - Child can use icon-first controls (`▶`, `↻`, `💡`) independently.
  - Child has initial exposure to 12+ frequent Hebrew words.
- What comes next:
  - Phrase-level reading with repeated root families.
  - Early decodable micro-stories with controlled morphology variation.

## Target Age Range
- Primary: 6-7
- Supported with stronger scaffolding: advanced 5.5+

## Mechanic
- Primary interaction: drag-and-drop sorting + word building.
- Core loop:
  1. דובי introduces a target root family with 2 anchor words (fully pointed).
  2. Child drags word cards into the correct "root basket" (action-triggered validation).
  3. Child builds one new family word using a root tile + simple prefix/suffix sticker.
  4. Child reads a short pointed phrase using one of the built words.
- Engine fit:
  - One DB row in `games` table (`slug: rootFamilyStickers`, `game_type: sort_build_read`).
  - One gameplay component: `RootFamilyStickersGame`.
- RTL/mobile requirements:
  - Word flow and drag direction are RTL-first.
  - All draggable controls and icons are >=44px touch targets.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays active instruction (`games.rootFamilyStickers.instructions.*`) | Active prompt pulses and root basket glow refreshes. |
| Retry round | `↻` | Encouragement (`feedback.encouragement.*`) then current prompt replay | Soft reset to same root set; no score loss. |
| Hint | `💡` | Context hint (`games.rootFamilyStickers.hints.*`) | Progressive scaffold (audio cue -> root-letter highlight -> solved example). |
| Next / continue | `→` | Transition cue (`games.rootFamilyStickers.feedback.success.*`) then next prompt | Smooth slide to next root-family cluster. |

## Image Strategy
- Images are used for meaning support in introduction rounds only (anchor vocabulary).
- Fade plan:
  - Level 1: anchor-word images visible.
  - Level 2: images removed during sorting; text + nikud only.
  - Level 3: no images on phrase reading prompts.
- Guardrail: at least 60% of interactions in each session are text-first to prevent picture-guessing.

## Difficulty Curve
- Level 1 (Root Discovery):
  - 2 root families, 4 words per round, all fully pointed.
  - Root letters highlighted with subtle color cue.
  - No decoys in first 2 rounds (isolate root-pattern concept first).
  - One incorrect drag triggers immediate gentle correction + replay.
- Level 2 (Family Sorting):
  - Phase 2A (first 2 rounds): keep 2 root families, remove root-color highlight, 6 words.
  - Phase 2B (after 2A mastery): keep same family count, add exactly 1 decoy word with same initial letter/different root.
  - Decoy density cap in core path: max 1 decoy per 6-7 cards (<=17%).
- Level 3 (Build + Read Transfer):
  - Build one word from root + affix sticker, then read a 2-3 word pointed phrase.
  - No new decoy complexity in this level; keep sorting set unchanged from mastered Level 2.
  - Optional partial nikud fade only after two successful phrase reads with <=1 hint.
  - Soft timer appears only as optional bonus mode, never in core completion path.
- Adaptive support:
  - If child makes 2 consecutive root-grouping errors, return to previous phase and replay 2 anchor examples.
  - If child makes 3 errors in 5 actions, activate "slow mode": play word audio fully before next drag becomes active.
  - Promote challenge only after 5 correct first-attempt actions with <=1 hint in the current phase.
  - Mastery extension only (not required for session win): permit 2 decoys max, with hard cap <=25% decoy density.

## Feedback Design
- Success:
  - Immediate positive audio tied to strategy ("שמעת? אותו שורש!").
  - Visual "family album" sticker unlock only when child completes round at >=75% first-try accuracy with <=1 hint.
  - Strategy micro-praise triggers on evidence actions (used replay, accepted hint, then corrected drag).
- Mistakes:
  - No penalty sounds or red-failure states.
  - Card returns to source with narrated nudge and optional `💡` highlight of shared letters.
  - Rapid random taps (2 incorrect drags under ~2 seconds each) trigger "pause + model" moment before next attempt.
- Hint progression:
  1. Audio cue to listen for repeated sound pattern.
  2. Visual highlight of shared root letters.
  3. Show one solved example, then retry same challenge.

## Session Design
- Session length: 10-12 minutes.
- Session structure:
  - Micro-loop A (2-3 min): warm-up + Level 1/2A.
  - Micro-loop B (2-3 min): Level 2B sorting with capped decoys.
  - Micro-loop C (2-3 min): Level 3 build + one required phrase transfer.
  - Recap (1-2 min): sticker summary + one optional bonus phrase.
- Natural stopping points:
  - After each root family cluster.
  - End recap card with "next family" suggestion.
- Replay hooks:
  - Daily rotating root families.
  - Spaced repetition prioritizes previously confused roots.
  - If total play reaches 8 minutes with fatigue signals (>=3 hints in last 2 rounds), allow graceful early finish with recap reward.

## Audio Requirements
- All child-visible strings must be i18n-keyed with paired Hebrew audio.
- Required key families:
  - `games.rootFamilyStickers.title`
  - `games.rootFamilyStickers.instructions.*`
  - `games.rootFamilyStickers.prompts.rootIntro.*`
  - `games.rootFamilyStickers.prompts.sorting.*`
  - `games.rootFamilyStickers.prompts.building.*`
  - `games.rootFamilyStickers.prompts.phraseRead.*`
  - `games.rootFamilyStickers.hints.*`
  - `games.rootFamilyStickers.feedback.success.*`
  - `games.rootFamilyStickers.feedback.retry.*`
  - `roots.common.*`
  - `words.pronunciation.*`
  - `feedback.encouragement.*`
- Audio asset pattern:
  - `public/audio/he/games/root-family-stickers/*.mp3`
  - `public/audio/he/roots/*.mp3`
  - `public/audio/he/words/*.mp3`
- Audio behavior constraints:
  - Instruction replay must duck background audio by >=6dB.
  - Word pronunciation clips should stay <=900ms where possible for fast turn-taking.

## Parent Visibility
- Parent dashboard metrics:
  - Root-family grouping accuracy by root.
  - Most-confused roots/decoy patterns.
  - Hint usage trend by level.
  - Phrase transfer success rate (Level 3).
- Suggested parent i18n key families:
  - `parentDashboard.games.rootFamilyStickers.progressSummary`
  - `parentDashboard.games.rootFamilyStickers.confusions`
  - `parentDashboard.games.rootFamilyStickers.nextStep`

## Inspiration / References
- Reading Eggs: systematic progression from decoding to pattern recognition.
- Teach Your Monster to Read: repeated-skill practice via varied mechanics.
- Ji Alef-Bet: Hebrew-first scaffolding and letter/nikud sensitivity.
- Hebrew reading research practice: introduce morphology concretely through repeated, decodable root families at age 6-7.

## Review Request
- Request Gaming Expert review for mechanic fairness (decoy density, adaptive thresholds) before implementation starts.
