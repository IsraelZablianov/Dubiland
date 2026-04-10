# Letter Sky Catcher (Hebrew: שומר האותיות)

## Learning Objective
- Curriculum area: Letters + early reading foundations (אותיות וראשית קריאה).
- Core skills:
  - Hebrew letter recognition under time pressure.
  - Initial-sound awareness (identify words that start with the target letter sound).
  - Inhibitory control (catch targets, avoid distractors).
- Measurable outcome: After 5 sessions, child correctly catches target-initial objects in at least 80% of Level 2 rounds while keeping non-target catches below 20%.
- Milestone mapping:
  - Ages 3-5: clear letter-object matching with high-contrast sounds and heavy audio scaffolding.
  - Ages 5-7: denser distractors, faster drop cadence, and closer phonological contrasts.

## Target Age Range
- Primary: 4-7
- Supported with extra scaffolding: advanced 3.5+

## Mechanic
- Primary interaction: Move דובי right/left and catch only objects that start with the active Hebrew letter.
- Round loop:
  1. A large target letter appears in the top-center HUD.
  2. Narration announces the target letter sound and one anchor example.
  3. Objects fall in lanes from top to bottom.
  4. Child moves דובי via on-screen arrow controls or horizontal swipe.
  5. Collision is validated immediately:
     - target-initial object -> success feedback + reward progress.
     - non-target object -> gentle corrective feedback + quick replay cue.
  6. Every 30 seconds, letter rotates with a visual transition and audio announcement.
- Engine fit:
  - One DB row in `games` table (slug: `letterSkyCatcher`, `game_type: runner_match`).
  - One component: `LetterSkyCatcherGame`.
- RTL/mobile requirements:
  - Target letter HUD, score, and controls must render RTL-first.
  - All child controls maintain 44px+ touch targets.

## Pre-Literate UX Baseline (Mandatory)
- Every instruction text shown to the child must include an adjacent `▶` play icon (minimum 44px) that replays the exact instruction audio.
- Child-facing controls are icon-first, not text-first. Use persistent icons for replay (`▶`), retry (`↻`), hint (`💡`), and next (`→`).
- Text labels may appear only as supporting parent/teacher UI; gameplay controls for children must remain understandable via icon + audio alone.
- Feedback and validation are action-based: the game responds immediately to movement/collision events and never requires a separate `check` or `test` button.
- Icon taps trigger short narrated cues from i18n/audio keys so pre-readers can learn each icon meaning by sound.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays active `games.letterSkyCatcher.instructions.*` clip | Target letter pulses + falling objects slow for 2 seconds. |
| Retry round | `↻` | Plays `feedback.encouragement.*`, then current letter prompt replay | Round resets to same target letter with reduced speed. |
| Hint | `💡` | Plays hint from `games.letterSkyCatcher.hints.*` | Highlights next valid target object with soft glow trail. |
| Next / continue | `→` | Plays short cue from `feedback.success.*` | Transitions to next letter block. |

## Difficulty Curve
- Letter rotation rule:
  - Default block duration: 30 seconds per letter.
  - Adaptive extension for support mode: up to 35 seconds when child has 3 misses in current block (single extension per block).
- Level 1 (Starter Catch, ages 3.5-5):
  - 1 target letter per block, 60% target objects / 40% distractors.
  - Slow fall speed (2.0-2.8 sec top-to-bottom).
  - Maximum 3 simultaneous falling objects.
  - Spawn cadence: 1100-1500ms between spawns, with same-lane cooldown >=500ms.
  - Distinct phoneme set only: מ, נ, ל, ש, פ, ק.
- Level 2 (Focused Sorting, ages 5-6):
  - 45% target / 55% distractors.
  - Medium speed (1.6-2.2 sec top-to-bottom).
  - Maximum 4 simultaneous falling objects.
  - Spawn cadence: 900-1300ms between spawns, with same-lane cooldown >=450ms.
  - Introduce one confusion-risk pair per session block (for example ב/פ or ט/ת).
- Level 3 (Fast Phonics, ages 6-7):
  - 35% target / 65% distractors.
  - Faster speed (1.2-1.8 sec top-to-bottom).
  - Maximum 5 simultaneous falling objects.
  - Spawn cadence: 700-1100ms between spawns, with same-lane cooldown >=400ms.
  - Add semantically similar distractors and occasional decoy objects with same category but wrong initial letter.
- Collision pacing guardrails:
  - First 6 seconds of every letter block must include at least 2 guaranteed targets for quick orientation.
  - Do not spawn more than 2 distractors in a row on Levels 1-2, or more than 3 in a row on Level 3.
  - Keep at least one visually clear lane (no overlapping silhouettes) for ages 3.5-5 in support mode.
- Confusion-pair sequencing contract:
  - Max one confusion pair family per 30-second letter block.
  - Confusable distractor exposure caps per block: Level 1: 0, Level 2: up to 2, Level 3: up to 3.
  - Keep at least 4 neutral spawns between two confusable exposures.
  - If the child makes 2 same-pair confusion errors in one block, trigger deterministic 3-step remediation:
    1. Isolated contrast mini-round (6s, only target letter and paired confusable letter, 80% targets).
    2. Anchor-word contrast mini-round (6s, slower speed, emphasized first phoneme narration).
    3. Near-transfer mini-round (8s, normal object mix but speed slowed by 15%).
  - After remediation, suppress that same confusion pair for the next 2 letter blocks.
- Adaptive logic (explicit thresholds):
  - Simplify trigger: 2 wrong catches in a rolling window of 8 collisions OR no successful catch for 6 seconds.
  - Simplify action order (apply one step per trigger, never two at once): reduce active objects by 1 (floor 2) -> slow fall speed by 15% -> widen target collision hitbox by 12% -> replay anchor prompt.
  - Escalate trigger: 3 correct catches with zero wrong catches in a rolling window of 6 collisions and no hint usage in last 10 seconds.
  - Escalate action order (one step only): restore normal hitbox -> restore speed baseline -> increase active objects by 1 (up to level cap).
  - Frustration rescue: 3 misses on same target letter in one session -> inject a 10-second remediation block (70% targets, Level 1 speed band, no confusable distractors).

## Object Vocabulary Bank (3-5 Objects per Hebrew Letter)
Use this as the approved starter lexicon for voice + image assets. Prefer words children in Israel recognize in preschool/kita alef contexts.

| Letter | Core Objects (at least 3) |
|---|---|
| א | אריה, אננס, אופניים, ארון |
| ב | בלון, בננה, ברווז, בית |
| ג | גזר, גיטרה, גמל, גרב |
| ד | דג, דלת, דוב, דובדבן |
| ה | הר, הליקופטר, היפופוטם, הדס |
| ו | ורד, וילון, וופל, וסט |
| ז | זברה, זחל, זית, זר |
| ח | חתול, חלון, חמור, חלה |
| ט | טווס, טלפון, טירה, טלה |
| י | ילד, יונה, ילקוט, ים |
| כ | כובע, כלב, כיסא, כדור |
| ל | לימון, לב, לחם, לוויתן |
| מ | מטרייה, מנורה, מלפפון, מברשת |
| נ | נר, נעל, נחש, נוצה |
| ס | סוס, ספר, סירה, סל |
| ע | ענן, עיפרון, עוגה, עץ |
| פ | פרח, פיל, פיצה, פעמון |
| צ | צב, ציפור, צלחת, צעצוע |
| ק | קוף, קערה, קטר, קשת |
| ר | רכבת, רימון, רופא, רגל |
| ש | שמש, שוקולד, שולחן, שעון |
| ת | תפוח, תוף, תרנגול, תיק |

Vocabulary curation rules:
- In early levels, avoid letter families with high child confusion in the same 30-second block (example: א/ע, ט/ת, ב/פ).
- Use Modern Hebrew pronunciations from approved audio set, with first-sound emphasis in each object clip.

## Scoring and Reward System
- Core score signals (no punitive deduction):
  - Correct catch: `+1` star + one bear customization fragment.
  - Missed target (not caught): no deduction, gentle reminder cue.
  - Wrong catch (non-target): combo pauses for 2 seconds, no point loss.
- Reward ladder per session (accuracy-gated to protect learning focus):
  - 3 correct catches + session precision >=60%: add wearable item (hat, glasses, scarf, cape).
  - 6 correct catches + session precision >=70%: unlock particle trail (stars/hearts/sun).
  - 9 correct catches + session precision >=75% and hints used <=3: bear color glow variant.
  - 12 correct catches + session precision >=80% and non-target catch rate <=20%: end-of-session celebration pose card.
  - If the child hits the catch count but misses precision threshold, keep progress-positive feedback and defer cosmetic unlock to next block (no penalty language).
- Anti-grind rule: maximum one cosmetic unlock per letter block, so target identification remains the primary objective.
- Child-facing feedback stays progress-positive; parent dashboard still records precision metrics.

## Feedback Design
- Success path:
  - Immediate sparkle burst on caught object + spoken reinforcement (`"כן, {object} מתחיל ב-{letter}"`).
  - Bear transformation updates in real time to visualize progress.
- Mistake path:
  - No red X, no buzzers, no sad failure screens.
  - Gentle narration (`"נבדוק שוב יחד"`) with quick replay option.
  - Next valid target object gets subtle hint glow if two mistakes occur in same letter block.
- Encouragement cadence:
  - Praise effort ("ראיתי איך התרכזת") before correction.
  - If child hesitates for 6+ seconds, auto-replay prompt and pulse target letter.

## Session Design
- Expected play time: 4-6 minutes (short arcade bursts).
- Session shape:
  - 6 letter blocks x 30 seconds each (~3 minutes active play).
  - Inter-block transitions + recap bring total to 4-6 minutes.
- Natural stopping points:
  - After every 2 letter blocks (soft pause card).
  - End-of-session recap after block 6.
- Replay value:
  - Rotating letter sets by mastery.
  - Rotating world skins (cloud day, sunset, star night) without changing learning target.

## Audio Requirements
- All child-facing copy must be i18n-keyed and paired with Hebrew audio.
- Required key families:
  - `games.letterSkyCatcher.title`
  - `games.letterSkyCatcher.subtitle`
  - `games.letterSkyCatcher.instructions.*`
  - `games.letterSkyCatcher.prompts.letterIntro.*`
  - `games.letterSkyCatcher.prompts.letterRotate.*`
  - `games.letterSkyCatcher.prompts.objectHit.*`
  - `games.letterSkyCatcher.prompts.confusionContrast.*`
  - `games.letterSkyCatcher.prompts.remediation.*`
  - `games.letterSkyCatcher.prompts.precisionNudge.*`
  - `games.letterSkyCatcher.hints.*`
  - `games.letterSkyCatcher.rewards.*`
  - `games.letterSkyCatcher.recap.*`
  - `letters.pronunciation.*`
  - `letters.anchorWords.*`
  - `objects.names.*`
  - `feedback.encouragement.*`
  - `feedback.success.*`
- Audio file pattern:
  - `public/audio/he/games/letter-sky-catcher/*.mp3`
  - `public/audio/he/letters/*.mp3`
  - `public/audio/he/objects/*.mp3`
- Audio behavior constraints:
  - Letter-rotation announcement must duck background music by at least 6dB.
  - Collision feedback must complete within 700ms so gameplay flow stays continuous.

## Visual Design Notes
- Scene composition:
  - Sky gradient playfield with 3-5 fall lanes.
  - דובי anchored in lower third; movement range constrained to keep him visible.
  - Large target letter chip at top center with strong contrast outline.
- Reward visualization:
  - Progressive character transformation should be cumulative and visible at all times.
  - Transform items must not block movement readability or object collision silhouette.
- Accessibility:
  - Avoid color-only differentiation for target vs distractor; use shape badge + letter badge overlays.
  - Keep moving object silhouette simple and high-contrast.

## Mobile/Touch Controls
- Primary controls (tablet/mobile):
  - Left move icon button (`⬅`) 60px+.
  - Right move icon button (`➡`) 60px+.
  - Swipe fallback: horizontal swipe across lower play zone.
- Desktop fallback:
  - Keyboard arrows supported as secondary input only.
- Motor support:
  - If rapid alternating taps detected with low precision, temporarily widen collision hitbox for 1 block.

## Parent Visibility
- Parent dashboard metrics:
  - Accuracy by letter.
  - Non-target catch rate by letter family.
  - Most-confused letter pairs.
  - Hint usage trend over time.
- Parent summary keys:
  - `parentDashboard.games.letterSkyCatcher.progressSummary`
  - `parentDashboard.games.letterSkyCatcher.letterConfusions`
  - `parentDashboard.games.letterSkyCatcher.nextStep`

## Curriculum Fit
- Fits Dubiland letter sequence as a bridge between:
  - `letter-tracing-trail` (visual letter form familiarity)
  - `letter-sound-match` (focused sound discrimination)
- Intended placement:
  - Mid letters track (after 6-8 letters introduced in tracing flow).
  - Reusable as spiral-review game for mastered letters.

## Inspiration / References
- Teach Your Monster to Read: phonics-to-gameplay integration with strong progression loops.
- Khan Academy Kids: adaptive support and warm corrective feedback.
- Endless Alphabet: memorable sound-word pairing through high-energy animation.
- TinyTap arcade templates: fast tap/sort loops adapted here to movement-and-catch interaction.

## Review Status
- Mechanics drafted by Children Learning PM on 2026-04-10.
- Gaming Expert review completed on 2026-04-10 with explicit pacing thresholds, confusion-pair remediation sequencing, and accuracy-gated reward cadence.

## FED + QA Mechanics Signoff Checklist
- Verify no block introduces more than one confusion pair family and Level 1 introduces none.
- Verify adaptive transitions apply one variable at a time and match the trigger windows above.
- Verify remediation sequence always follows the 3-step order and suppresses repeated pair reuse for 2 blocks.
- Verify reward unlocks honor precision/hint thresholds and never punish with score deductions.
- Verify child controls remain icon-first (`▶`, `↻`, `💡`, `→`) and all validation remains action-triggered (no check/submit/test buttons).
