# Learn the Letters Storybook (Hebrew: הסיפור של האותיות)

## Learning Objective
- Curriculum stage: Letter Recognition with early bridge to pointed word and phrase reading.
- Core reading skill: Build stable grapheme-sound mapping for all 22 Hebrew letters, then transfer recognition to high-frequency association words and short decodable story lines.
- Measurable outcomes:
  - `3-4` support mode: child listens and identifies at least 8 target letters with image support and replay.
  - `5-6` core mode: child identifies all 22 letters in RTL sequence with >=80% first-try accuracy on checkpoint pages.
  - `6-7` stretch mode: child distinguishes core confusable pairs (`ד/ר`, `ב/כ`, `ט/ת`, `א/ע`) and reads short pointed letter-anchored phrases.

## Curriculum Position
- Placement in reading ladder: after `letter-tracing-trail` + `letter-sound-match`, before full syllable and word-decoding tracks.
- Prerequisites:
  - Child can operate icon-first controls (`▶`, `↻`, `💡`) and follow audio prompts.
  - Child has prior exposure to at least 8 high-distinction letters.
- What comes next:
  - `confusable-letter-contrast` for explicit pair remediation.
  - `sofit-word-end-detective` for final-form positional transfer.
  - Decodable handbook/story tracks for connected text.

## Target Age Range
- Primary: `5-7`
- Support mode visible in catalog for `3-4` as listen-explore (no mastery gating)

## Mechanic
- Primary interaction: audio-first storybook navigation with tap-to-listen, tap-to-choose, and collect-a-letter progression.
- Core loop per letter page:
  1. דובי narrates story beat and introduces one target letter.
  2. Child hears letter name + sound and taps the large glyph.
  3. Child taps or drags the association image token to the target letter slot.
  4. Immediate action feedback confirms and unlocks the next page token.
- Engine fit:
  - One DB row in `games` (`slug: letterStorybook`, `game_type: storybook_letters`).
  - One gameplay component: `LetterStorybookGame`.
- RTL/mobile requirements:
  - Right-to-left swipe progression and right-edge forward affordance.
  - 44px+ touch targets for all child controls and hotspot regions.

## Synthesis Inputs and Dependency Notes
- This draft synthesizes current validated Dubiland reading docs:
  - `docs/games/hebrew-letters-video-pedagogy.md`
  - `docs/games/letter-sound-match.md`
  - `docs/games/confusable-letter-contrast.md`
- Sibling workstreams under [DUB-647](/DUB/issues/DUB-647) are still open at draft time:
  - [DUB-652](/DUB/issues/DUB-652), [DUB-653](/DUB/issues/DUB-653), [DUB-654](/DUB/issues/DUB-654), [DUB-655](/DUB/issues/DUB-655), [DUB-656](/DUB/issues/DUB-656)
- Merge gate before implementation lock:
  - Apply any must-have deltas from those lanes into this spec revision before FED build starts.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Story Arc and Page Flow
- Narrative frame: דובי travels through "שביל האותיות" and collects one glowing letter badge per stop.
- Book structure (`29` pages total):
  - `p00-p01`: cover + mission setup
  - `p02-p23`: one page for each of 22 base letters
  - `p24-p26`: chapter checkpoints (letters 1-8, 9-15, 16-22)
  - `p27`: final-forms bridge page
  - `p28`: celebration + parent summary card
- Navigation model:
  - Swipe RTL to advance/back.
  - Persistent icon controls fixed in safe bottom zone: `▶`, `↻`, `💡`, `→`.
  - Progress beads shown RTL; earned beads animate into the collection ribbon.

## Page Anatomy (per letter page)
- `Zone A` (top-right): target letter glyph (large, high-contrast print script).
- `Zone B` (center): association illustration hotspot.
- `Zone C` (bottom): action tray with icon controls + one interaction target.
- `Zone D` (right rail): progress bead and chapter marker.
- Instruction model:
  - One short audio prompt per action.
  - Prompt replay always available through `▶`.

## Letter Inventory (22 Base Letters)

| Seq | Letter | Association Word (Hebrew) | English Gloss | Image Direction | Story Sentence Key | Audio Key Root |
|---|---|---|---|---|---|---|
| 1 | א | אריה | Lion | Friendly lion near trail gate | `games.letterStorybook.letters.alef.story` | `games.letterStorybook.letters.alef.*` |
| 2 | ב | בננה | Banana | Bright banana picnic basket | `games.letterStorybook.letters.bet.story` | `games.letterStorybook.letters.bet.*` |
| 3 | ג | גמל | Camel | Smiling camel carrying map | `games.letterStorybook.letters.gimel.story` | `games.letterStorybook.letters.gimel.*` |
| 4 | ד | דג | Fish | Colorful fish in clear pond | `games.letterStorybook.letters.dalet.story` | `games.letterStorybook.letters.dalet.*` |
| 5 | ה | הר | Mountain | Soft mountain hill with path sign | `games.letterStorybook.letters.he.story` | `games.letterStorybook.letters.he.*` |
| 6 | ו | ורד | Rose | Red rose patch by the trail | `games.letterStorybook.letters.vav.story` | `games.letterStorybook.letters.vav.*` |
| 7 | ז | זברה | Zebra | Striped zebra at watering stop | `games.letterStorybook.letters.zayin.story` | `games.letterStorybook.letters.zayin.*` |
| 8 | ח | חתול | Cat | Curious cat beside lantern | `games.letterStorybook.letters.het.story` | `games.letterStorybook.letters.het.*` |
| 9 | ט | טלה | Lamb | White lamb in meadow | `games.letterStorybook.letters.tet.story` | `games.letterStorybook.letters.tet.*` |
| 10 | י | יד | Hand | Child hand waving to דובי | `games.letterStorybook.letters.yod.story` | `games.letterStorybook.letters.yod.*` |
| 11 | כ | כדור | Ball | Bouncing ball into letter hoop | `games.letterStorybook.letters.kaf.story` | `games.letterStorybook.letters.kaf.*` |
| 12 | ל | לב | Heart | Heart-shaped kite in sky | `games.letterStorybook.letters.lamed.story` | `games.letterStorybook.letters.lamed.*` |
| 13 | מ | מים | Water | Splashing water fountain | `games.letterStorybook.letters.mem.story` | `games.letterStorybook.letters.mem.*` |
| 14 | נ | נר | Candle | Glowing candle in evening scene | `games.letterStorybook.letters.nun.story` | `games.letterStorybook.letters.nun.*` |
| 15 | ס | סוס | Horse | Small horse at stable fence | `games.letterStorybook.letters.samekh.story` | `games.letterStorybook.letters.samekh.*` |
| 16 | ע | ענן | Cloud | Soft cloud over hill | `games.letterStorybook.letters.ayin.story` | `games.letterStorybook.letters.ayin.*` |
| 17 | פ | פרפר | Butterfly | Butterfly above flowers | `games.letterStorybook.letters.pe.story` | `games.letterStorybook.letters.pe.*` |
| 18 | צ | ציפור | Bird | Little bird carrying ribbon | `games.letterStorybook.letters.tsadi.story` | `games.letterStorybook.letters.tsadi.*` |
| 19 | ק | קוף | Monkey | Monkey holding compass | `games.letterStorybook.letters.kuf.story` | `games.letterStorybook.letters.kuf.*` |
| 20 | ר | רכבת | Train | Train crossing bridge | `games.letterStorybook.letters.resh.story` | `games.letterStorybook.letters.resh.*` |
| 21 | ש | שמש | Sun | Bright sun token above valley | `games.letterStorybook.letters.shin.story` | `games.letterStorybook.letters.shin.*` |
| 22 | ת | תפוח | Apple | Red apple near finish gate | `games.letterStorybook.letters.tav.story` | `games.letterStorybook.letters.tav.*` |

## Final Forms Integration (Bonus Bridge)

| Final Form | Base Letter | Story Use | Integration Rule | Audio Key Root |
|---|---|---|---|---|
| ך | כ | Appears at word end on bridge sign | Show only in word-final position; contrast briefly with `כ` | `games.letterStorybook.finalForms.kafSofit.*` |
| ם | מ | Appears on completion badge word | Word-final only; no isolated drill | `games.letterStorybook.finalForms.memSofit.*` |
| ן | נ | Appears on map clue label | Word-final only; tie back to base `נ` page | `games.letterStorybook.finalForms.nunSofit.*` |
| ף | פ | Appears on treasure box label | Word-final only; include base/final side-by-side | `games.letterStorybook.finalForms.peSofit.*` |
| ץ | צ | Appears on finish arch title | Word-final only; one transfer check with spoken word | `games.letterStorybook.finalForms.tsadiSofit.*` |

## Image Strategy
- Purpose of images:
  - Support vocabulary meaning and story motivation in early pages.
  - Anchor letter identity to one concrete object/animal.
- Fade plan:
  - Level 1: full image + target letter simultaneously.
  - Level 2: image shrinks after first success, letter remains dominant.
  - Level 3: decoding checkpoints remove image and keep text-only stimulus.
- Guardrails:
  - Never accept an image tap without a letter-linked action.
  - Checkpoint pages must score only text/letter actions.

## Difficulty Curve
- Level 1: Guided Discovery (`pages p02-p10`)
  - One target letter, one association image, one action.
  - Full narration and unlimited replay.
  - 2-option retrieval at chapter checkpoint.
- Level 2: Guided Retrieval (`pages p11-p18`)
  - Add one confusable decoy in retrieval moments.
  - Image support fades after correct first attempt.
  - 3-option retrieval at checkpoint with adaptive hints.
- Level 3: Transfer and Contrast (`pages p19-p28`)
  - Include confusable-letter spot checks and final-form bridge.
  - Add pointed word/short phrase read-aloud on checkpoint pages.
  - Partial pointing allowed only in final checkpoint for `6-7` mode.
- Adaptive logic:
  - 2 consecutive misses on same letter => auto-trigger `💡` step 2 and keep same page concept.
  - 3 consecutive first-try successes => reduce visual cue density by one step.
  - For `3-4` mode: no forced progression lock on checkpoint failures.

## Feedback Design
- Success:
  - Immediate badge glow + short praise line (`feedback.success.*`).
  - Letter sound replayed once with optional repeat.
- Mistake handling:
  - No negative audio.
  - Target letter pulses, prompt is replayed, and one distractor is removed in recovery step.
- Hint progression (`💡`):
  1. Replay target sound + letter name.
  2. Highlight distinguishing stroke or starting glyph.
  3. Provide solved micro-example, then immediate retry.
- Anti-random tapping guardrail:
  - 3 wrong taps in 2 seconds => 1-second pause, narrated reset, reduced choices for one trial.

## Session Design
- Expected play time: `10-15` minutes.
- Session structure:
  - Warm-up recap (`1-2` min)
  - New letter pages (`7-9` min)
  - Checkpoint + celebration (`2-4` min)
- Natural stopping points:
  - End of each chapter checkpoint (`p24`, `p25`, `p26`).
  - Final forms bridge completion (`p27`) for stretch learners.
- Replay hooks:
  - Daily "3 known + 1 new" letter revisit mix.
  - Weekly confusable-pair spotlight card.

## Audio Requirements
- Audio is mandatory for every child-facing element and icon action.
- Required i18n/audio key families:
  - `games.letterStorybook.title`
  - `games.letterStorybook.subtitle`
  - `games.letterStorybook.instructions.*`
  - `games.letterStorybook.controls.{replay,retry,hint,next}`
  - `games.letterStorybook.letters.<letterKey>.{intro,sound,word,story,prompt,success,hint1,hint2,hint3}`
  - `games.letterStorybook.checkpoints.{one,two,three}.*`
  - `games.letterStorybook.finalForms.<finalKey>.*`
  - `feedback.encouragement.*`
  - `feedback.success.*`
- Audio file pattern:
  - `public/audio/he/games/letter-storybook/*.mp3`
  - `public/audio/he/letters/*.mp3`
- Per-page minimum audio contract:
  - narration line (`1`)
  - instruction line (`1`)
  - letter name + sound (`2`)
  - association word (`1`)
  - success + retry/hint cues (`2+`)
- Audio mixing constraints:
  - Duck music under instruction lines by >=6dB.
  - Keep prompt clips short (target `0.6-1.4s`) for responsive turn-taking.

## Parent Visibility
- Parent dashboard signals:
  - Letters introduced vs. letters mastered.
  - Confusable pair error heatmap.
  - Final-forms bridge completion.
  - Replay usage and hint trend over time.
- Parent key families:
  - `parentDashboard.games.letterStorybook.progressSummary`
  - `parentDashboard.games.letterStorybook.confusions`
  - `parentDashboard.games.letterStorybook.nextStep`

## Production Handoff and Coordination
- FED Engineer lane:
  - Build `LetterStorybookGame` runtime with page orchestration, checkpoints, and adaptive hint hooks.
- Content Writer lane:
  - Author Hebrew i18n scripts and full audio script sheet for all letter/final-form keys.
- Media Expert lane:
  - Produce association image set with consistent style and per-page prompt pack.
- UX Designer lane:
  - Finalize RTL page anatomy and control-safe zones for tablet.
- Gaming Expert lane:
  - Validate reward cadence and checkpoint difficulty thresholds.

## Inspiration / References
- Reading Eggs: systematic grapheme progression with controlled retrieval checkpoints.
- HOMER: story-led early literacy pacing with short-session structure.
- Teach Your Monster to Read: letter collection motivation loop and immediate feedback.
- Ji Alef-Bet: Hebrew-specific attention to nikud and orthographic distinctions.

## Review Status
- Reading PM draft authored on `2026-04-11` for [DUB-651](/DUB/issues/DUB-651).
- Mechanics and pacing review required from Gaming Expert lane ([DUB-656](/DUB/issues/DUB-656)) before implementation lock.
- UX/content/media constraints pending sibling lane convergence under [DUB-647](/DUB/issues/DUB-647).
