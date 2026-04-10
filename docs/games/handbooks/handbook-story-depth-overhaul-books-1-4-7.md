# Handbook Story Depth Overhaul — Books 1/4/7 (Hebrew: העמקת עלילה בספרוני הקריאה)

## Learning Objective
- Curriculum stage: Phrase & Sentence Reading -> Reading Comprehension -> Decodable Stories transfer.
- Core objective: replace flat, generic handbook narration with age-banded story arcs that still preserve decodable Hebrew progression and text-first reading behavior.
- Measurable outcomes:
  - Ages `3-4`: sustained listening attention for 8-page story loop with repeated language frames and successful literal recall (`>=80%` scaffolded checks).
  - Ages `5-6`: read fully pointed target words/phrases inside a true problem-solution story (`>=85%` decode accuracy in mandatory checkpoints).
  - Ages `6-7`: read connected short scenes with text-evidence responses and observable character-growth understanding (`>=80%` literal/sequence accuracy).

## Curriculum Position
- This feature upgrades handbook narrative quality after core ladder definitions in `docs/games/handbooks/hebrew-reading-ladder-10-books.md`.
- It is a content-quality and pedagogy layer over existing runtime books:
  - Book 1 (`mikaSoundGarden`) for age `3-4`
  - Book 4 (`yoavLetterMap`) for age `5-6`
  - Book 7 (`tamarWordTower`) for age `6-7`
- Prerequisites:
  - Existing handbook page/checkpoint runtime is live.
  - i18n/audio pipeline for `common.handbooks.<slug>.*` is active.
- What comes next:
  - Propagate the same narrative-depth pattern to Books 5/6/8/9/10.
  - Extend into age-banded decodable micro-story packs.

## Target Age Range
- Primary: `3-7` with explicit depth scaling by age band.

## Mechanic
- Primary interaction: interactive handbook page flow with embedded read-and-act checkpoints.
- Story mechanic contract:
  - Every 2-3 pages advances one plot beat (not isolated "activity cards").
  - Each checkpoint is motivated by the story problem (decode to unlock clue, read to choose next action, read to justify answer).
  - Ending resolves both story conflict and reading task.
- Runtime fit:
  - One component family (`InteractiveHandbookGame`) with upgraded content payloads.
  - One DB row per book remains unchanged; scope is narrative/i18n/audio overhaul, not engine replacement.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Image Strategy
- Images carry atmosphere and emotional context, not answer keys.
- Story-depth image policy by age:
  - `3-4`: rich visual storytelling, but reading checks remain audio/text-led.
  - `5-6`: images support setting and stakes; decoding checkpoints are text-first.
  - `6-7`: progressive fade of visual hints during evidence/sequence checks.
- Guardrail: no comprehension item is passable by image-only inference in scored checkpoints.

## Difficulty Curve
- Level 1 (`3-4`, Book 1):
  - Repetitive oral-language frames, predictable beats, high narrator support.
  - 1 scaffolded text-linked check every 2-3 pages.
- Level 2 (`5-6`, Book 4):
  - Fully pointed decoding integrated into simple adventure arc.
  - 1 decoding or literal check per page cluster; controlled distractors.
- Level 3 (`6-7`, Book 7):
  - Connected scenes, short tension-recovery cycles, text-evidence prompts.
  - Mixed pointing bridge appears only on mastered tokens; sequence/evidence checks increase.
- Scaffolding/fade plan:
  - Support mode: replay + narrowed options.
  - Core mode: full option set with hint ladder.
  - Stretch mode: reduced hint frequency and stronger text-evidence demand.

## Feedback Design
- Success:
  - Praise ties to reading action and story consequence ("קראת נכון ולכן הדמות פתרה את הבעיה").
- Mistakes:
  - Encourage retry with one actionable cue (target word, sentence fragment, or sequence marker).
- Hint progression:
  1. Replay full prompt (`▶`).
  2. Segment target phrase (word-by-word or syllable cue).
  3. Highlight textual evidence region.
- Never punish; always preserve narrative momentum after correction.

## Session Design
- 10-15 minutes per handbook session.
- Natural stop points:
  - chapter boundary (beginning/middle/end)
  - post-checkpoint recap moment
- Replay value:
  - alternate clue variants and sentence variants per chapter.
  - spaced repetition on previously missed words/patterns.

## Audio Requirements
- Full narration, prompt, hint, retry, celebration audio for all new keys.
- i18n key families required:
  - `common.handbooks.<slug>.storyArc.*`
  - `common.handbooks.<slug>.pages.pageXX.{narration,cta}`
  - `common.handbooks.<slug>.interactions.<id>.{prompt,hint,success,retry}`
  - `common.handbooks.<slug>.chapterRecap.*`
  - `common.parentDashboard.handbooks.<slug>.*`
- Audio behavior:
  - chapter intro lines paced slower for `3-4`; evidence cues clearer/slower for `6-7`.
  - instruction replay (`▶`) must always trigger the exact matching clip.

## Parent Visibility
- Add age-band-specific story quality indicators:
  - `storyEngagement`: completed chapters per session.
  - `decodeInStoryAccuracy`: decoding accuracy inside narrative checkpoints.
  - `evidenceReading`: text-evidence success rate (Book 7+).
  - `independenceTrend`: hint dependence trend over time.

## Story Audit Findings (Current State)
- Existing live lines in `common.json` are often functional but too generic and low-stakes (short isolated actions with weak tension).
- Books read like disconnected tasks rather than chaptered narratives.
- Character emotional progression is minimal, especially in `5-6` and `6-7` where motivation and consequence should drive reading.

## New Story Content Pack (Approved Direction)

### Book 1 (`mikaSoundGarden`, age `3-4`) — Simple, repetitive, picture-forward
**Arc title:** "מיקה ומצעד הצלילים"  
**Narrative pattern:** Find -> Repeat -> Celebrate.

| Chapter | Story beat | Reading action | Emotional beat |
|---|---|---|---|
| A | Morning in the garden: sounds are missing from the parade | Hear/repeat anchor words | Curiosity |
| B | Mika and Dubi collect 3 sound clues from friends | choose/listen checkpoints | Teamwork |
| C | Parade starts when all sounds are restored | simple recall + celebration line | Joy/confidence |

Sample Hebrew narration lines (to seed i18n rewrite):
- `chapterA.p01`: "מיקה באה לגן ושומעת שהמצעד שקט היום."
- `chapterB.p04`: "דובי לוחש: רק אם נקרא יחד את מילת הקול, נוכל להחזיר את התוף."
- `chapterC.p08`: "יש! כל הצלילים חזרו, ומיקה מובילה את המצעד."

### Book 4 (`yoavLetterMap`, age `5-6`) — Adventure with clear problem-solution
**Arc title:** "יואב והמפה שמכבה את האור"  
**Narrative pattern:** Problem -> clues -> resolution.

| Chapter | Story beat | Reading action | Emotional beat |
|---|---|---|---|
| A | Festival lighthouse goes dark; Yoav gets a letter map | decode pointed key words | Responsibility |
| B | Each clue requires reading before crossing gate | CV/CVC decode + literal checks | Determination |
| C | Final clue read aloud restores the light | phrase reading + recap | Mastery |

Sample Hebrew narration lines:
- `chapterA.p01`: "בערב החג האור במגדל כבה, ויואב קיבל מפה עם שלושה רמזים."
- `chapterB.p05`: "על השער כתוב: קראו נכון את המילה המנוקדת ורק אז תיפתח הדרך."
- `chapterC.p10`: "כשיואב קרא את הרמז האחרון, האור חזר להאיר את כל החוף."

### Book 7 (`tamarWordTower`, age `6-7`) — Real narrative with character growth
**Arc title:** "תמר לומדת לעצור ולקרוא ראיות"  
**Narrative pattern:** Mistake -> reflection -> strategic growth.

| Chapter | Story beat | Reading action | Emotional beat |
|---|---|---|---|
| A | Tamar rushes, guesses, and opens wrong tower door | decode phrase + sequence check | Frustration |
| B | Dubi coaches evidence-based reading | read and tap textual evidence | Self-regulation |
| C | Tamar leads final puzzle using careful reading | mixed-pointing bridge + explanation | Confidence/growth |

Sample Hebrew narration lines:
- `chapterA.p02`: "תמר מיהרה לנחש, והדלת ננעלה שוב."
- `chapterB.p07`: "דובי אמר: קודם נמצא ראיה במשפט, אחר כך נבחר תשובה."
- `chapterC.p12`: "תמר חייכה: כשקראתי לאט ומצאתי הוכחה, הכל הסתדר."

## Implementation Guardrails
- Keep all child text in i18n keys; no hardcoded narrative strings in components.
- Preserve existing RTL flow and icon-first controls.
- Enforce chapter continuity keys:
  - `storyArc.chapterA.*`
  - `storyArc.chapterB.*`
  - `storyArc.chapterC.*`
- Ensure checkpoint IDs remain action-triggered (no standalone check buttons).

## Inspiration / References
- Reading Eggs (leveled story+phonics sequencing): https://readingeggs.com/
- PJ Library Israel goals for building love of books through repeated family reading rituals: https://www.pjisrael.org/about/
- Kinneret-Zmora writing school content on turning idea -> plot -> structured story (narrative craft emphasis): https://www.hamegera.co.il/
- Example of successful multi-book Hebrew children narrative continuity (Cramel series): https://en.wikipedia.org/wiki/Cramel
