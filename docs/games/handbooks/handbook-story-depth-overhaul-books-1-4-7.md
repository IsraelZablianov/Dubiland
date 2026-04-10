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

## Canonical Slug Decision (Book 4, Mandatory)
- Canonical slug for this overhaul is `yoavLetterMap`.
- Transitional compatibility:
  - Runtime may still route launch alias `magic-letter-map` through legacy `magicLetterMap`; story-depth content must resolve to `yoavLetterMap` before scored checks execute.
  - Do not create new story-depth i18n/audio keys under `magicLetterMap`.
- Alignment scope:
  - FED: align ladder/config mapping so Book 4 scored flow resolves to `yoavLetterMap` in runtime and DB config.
  - Content Writer: publish chapter and interaction key families only under `common.handbooks.yoavLetterMap.*`.
  - QA: fail validation if any new Book 4 story-depth keys/assets land under `magicLetterMap`.

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

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay current instruction | `▶` | Replays active `common.handbooks.<slug>.pages.pageXX.cta` or interaction prompt line | Active sentence/prompt pulses and stays focused. |
| Retry current checkpoint | `↻` | Plays retry cue `common.handbooks.<slug>.interactions.<id>.retry`, then prompt replay | Soft reset of same checkpoint; no score penalty. |
| Request scaffold hint | `💡` | Plays hint cue `common.handbooks.<slug>.interactions.<id>.hint` matched to hint rung | One scaffold appears (reduced options, segmentation, or evidence highlight). |
| Continue after success / recap | `→` | Plays short transition cue then next narration/prompt line | Chapter progression animation and next focal target reveal. |

## Image Strategy
- Images carry atmosphere and emotional context, not answer keys.
- Story-depth image policy by age:
  - `3-4`: rich visual storytelling, but reading checks remain audio/text-led.
  - `5-6`: images support setting and stakes; decoding checkpoints are text-first.
  - `6-7`: progressive fade of visual hints during evidence/sequence checks.
- Guardrail: no comprehension item is passable by image-only inference in scored checkpoints.

### Anti-Image Shortcut Gate Contract (Scored Checks)
- Every scored checkpoint payload must include:
  - `isScored: true`
  - `requiresTextActionBeforeChoice: true`
  - `allowImageBeforeAnswer: false`
  - `choiceLockUntilTextAction: true`
- Runtime rules:
  - Image/hotspot taps can never independently mark a scored checkpoint as passed.
  - Choice buttons remain disabled until required text action completes (read-tap, sentence tap, or decode action).
  - If a child taps image/hotspot first on a scored checkpoint, trigger gentle replay + redirect to text action target.
- QA assertions:
  - Random tapping on illustration/hotspots alone cannot produce checkpoint success.
  - Success state only triggers after text action + valid answer path.

## Difficulty Curve
- Level 1 (`3-4`, Book 1):
  - Repetitive oral-language frames, predictable beats, high narrator support.
  - Scored flow fixed to `p03`, `p05`, `p08` (one scaffolded check every 2-3 pages).
- Level 2 (`5-6`, Book 4):
  - Fully pointed decoding integrated into simple adventure arc.
  - Scored flow fixed to decode:literals ratio `6:2` by chapter map (below), with no non-reading scored tasks.
- Level 3 (`6-7`, Book 7):
  - Connected scenes, short tension-recovery cycles, text-evidence prompts.
  - Mixed-pointing bridge appears only on mastered tokens; sequence/evidence checks occur on fixed pages `p04`, `p08`, `p11`.
- Scaffolding/fade plan:
  - Support mode: replay + narrowed options.
  - Core mode: full option set with hint ladder.
  - Stretch mode: reduced hint frequency and stronger text-evidence demand.

## Checkpoint Page Map (Scored, Mandatory)

### Book 1 (`mikaSoundGarden`, age `3-4`)
| Page | Chapter | Checkpoint type | Scored goal |
|---|---|---|---|
| `p03` | A | Literal recall (heard phrase -> choose matching text/picture pair) | First scaffolded recall success. |
| `p05` | B | Listen-then-choose clue | Maintain 1:1 audio-to-choice mapping. |
| `p08` | C | End-of-arc recall + celebration line | Confirm story resolution comprehension. |

### Book 4 (`yoavLetterMap`, age `5-6`)
| Page | Chapter | Checkpoint type | Scored goal |
|---|---|---|---|
| `p02` | A | Decode (pointed word) | Read first clue word accurately. |
| `p03` | A | Decode (CV/CVC) | Confirm gate-opening decode behavior. |
| `p05` | B | Decode (pointed phrase) | Maintain text-first clue progression. |
| `p06` | B | Literal comprehension | Match clue meaning after decode. |
| `p07` | B | Decode (multi-word phrase) | Advance through second gate. |
| `p08` | C | Decode (final clue prep) | Prepare ending with read-before-act behavior. |
| `p09` | C | Literal comprehension | Verify clue meaning before final action. |
| `p10` | C | Decode + read-aloud closure | Complete resolution via text action. |

Book 4 scored ratio rule (must hold): Chapter A `2 decode / 0 literal`, Chapter B `2 decode / 1 literal`, Chapter C `2 decode / 1 literal`; overall `6 decode / 2 literal`.

### Book 7 (`tamarWordTower`, age `6-7`)
| Page | Chapter | Checkpoint type | Scored goal |
|---|---|---|---|
| `p02` | A | Decode (phrase) | Identify first mistaken strategy point. |
| `p03` | A | Decode (sentence fragment) | Stabilize careful reading cadence. |
| `p04` | A | Sequence check | Establish first text-order evidence moment. |
| `p05` | B | Decode (transition phrase) | Re-enter with coached strategy. |
| `p06` | B | Decode (target sentence) | Sustain accuracy before evidence task. |
| `p07` | B | Decode (clue phrase) | Build toward evidence reasoning. |
| `p08` | B | Evidence check | Choose answer using highlighted textual proof. |
| `p09` | C | Decode (bridge phrase) | Keep decode strength during fade. |
| `p10` | C | Decode (final puzzle prompt) | Prepare final evidence decision. |
| `p11` | C | Sequence + evidence check | Demonstrate end-state strategic reading. |

Book 7 growth rule (must hold): sequence/evidence checkpoints are fixed at `p04`, `p08`, `p11` so progression is measurable and not front-loaded.

## Mechanics Consistency Thresholds (Calibrated)

| Book / Age band | Checkpoint density | Distractor load cap | Anti-guess guard | Transition guard |
|---|---|---|---|---|
| Book 1 (`3-4`) | `8` pages with `max 3` scored checks (`~1` every `2-3` pages) | `2` options max; no near-decoy text foils | `>=3` rapid non-target taps `<2s` -> pause `800ms` + prompt replay | No pointing fade in scored child tasks |
| Book 4 (`5-6`) | `9-10` pages with `5-6` decode checks + `2` literal checks (`max 8` scored checks/story) | `2-3` options max; only `1` near decoy per check | `>=4` rapid non-target taps `<2s` -> pause `1000ms`, replay, reduce options by `1` for retry | Fully pointed text remains fixed in scored decode checks |
| Book 7 (`6-7`) | `10-12` pages with `6-7` decode checks + `max 3` sequence/evidence checks | `3` options max; only `1` same-pattern foil in evidence checks | Trigger on `>=4` rapid non-target taps `<2s` OR `3` consecutive answers `<600ms` -> one forced scaffold trial | When partial-pointing increases in a chapter cluster, keep comprehension format unchanged for next `2` pages |

### Book 7 Progression Lock (Pointing Fade vs Comprehension)
- Cap pointing reduction to `<=10` percentage points per chapter cluster.
- Do not introduce a new comprehension format in the same cluster as a pointing reduction step.
- If decode-in-story accuracy is `<85%` in a cluster, freeze further pointing fade for the next cluster.

## Feedback Design
- Success:
  - Praise ties to reading action and story consequence ("קראת נכון ולכן הדמות פתרה את הבעיה").
- Mistakes:
  - Encourage retry with one actionable cue (target word, sentence fragment, or sequence marker).
- Age-band hint ladders with trigger thresholds:
  - `3-4` (Book 1):
    1. Trigger on first miss or `8s` no-response: replay full prompt (`▶`) + visual pulse.
    2. Trigger on second miss: reduce choices to `2` and segment anchor phrase orally.
    3. Trigger on third miss: guided model ("דובי מראה ואז הילד מנסה שוב") with same concept.
    - Reduction policy: after `2` consecutive first-try successes, drop one hint rung.
  - `5-6` (Book 4):
    1. Trigger on first miss or `10s` no-response: replay prompt + syllable segmentation.
    2. Trigger on second miss: remove one decoy and spotlight relevant pointed word.
    3. Trigger on third miss or rapid-guess guard: model one analogous decode, then retry target.
    - Reduction policy: after `3` consecutive first-try successes, restore full option set.
  - `6-7` (Book 7):
    1. Trigger on first miss or `12s` no-response: replay prompt + "find evidence" verbal cue.
    2. Trigger on second miss: highlight exact evidence sentence and sequence marker.
    3. Trigger on third miss or fast-guess pattern (`3` answers under `600ms`): forced read-then-choose scaffold trial.
    - Reduction policy: require `>=85%` first-try accuracy across next `3` checkpoints before fading one rung.
- Never punish; always preserve narrative momentum after correction.

## Session Design
- Session pacing targets by band:
  - `3-4`: `6-8` minutes.
  - `5-6`: `8-10` minutes.
  - `6-7`: `10-12` minutes.
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
- Book 4 slug rule for this overhaul:
  - Required key/audio namespace is `common.handbooks.yoavLetterMap.*` and matching `audio/he/handbooks/yoav-letter-map/*`.
  - `magicLetterMap` is treated as legacy alias only; no new story-depth assets should be authored there.

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
- Add scored-checkpoint policy fields in runtime content contract:
  - `isScored`
  - `requiresTextActionBeforeChoice`
  - `allowImageBeforeAnswer`
  - `choiceLockUntilTextAction`
  - `hintTriggerByBand`
  - `maxChoicesByBand`

## Review Status
- Reviewed by Gaming Expert on 2026-04-10 ([DUB-589](/DUB/issues/DUB-589)).
- Calibration status: Checkpoint density, distractor caps, anti-guess guards, and Book 7 transition locks are implementation-ready.
- Rationale: The narrative overhaul was strong qualitatively, but quantified pacing and transition rules were needed so FED and QA can enforce consistent age-band behavior.

## Inspiration / References
- Reading Eggs (leveled story+phonics sequencing): https://readingeggs.com/
- PJ Library Israel goals for building love of books through repeated family reading rituals: https://www.pjisrael.org/about/
- Kinneret-Zmora writing school content on turning idea -> plot -> structured story (narrative craft emphasis): https://www.hamegera.co.il/
- Example of successful multi-book Hebrew children narrative continuity (Cramel series): https://en.wikipedia.org/wiki/Cramel
