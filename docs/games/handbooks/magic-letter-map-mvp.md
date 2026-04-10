# Magic Letter Map MVP — First Live Handbook (Hebrew: מפת האותיות הקסומה)

## Goal
Ship one production-ready interactive handbook this cycle using the existing published slot `magicLetterMap` (migration `00020`) with a strict, implementation-first scope.

## Learning Objective
- Curriculum stage: Letter Recognition -> Nikud -> Early Word Reading -> Literal Comprehension.
- Target skill outcome (age ~6): child solves guided first-sound and pointed-word checkpoints across one 10-page story flow, with text-first comprehension at least once before completion.

## Curriculum Position
- Sits after letter foundations (`letter-tracing-trail`, `letter-sound-match`) and before longer decodable story lanes.
- This is the first live handbook execution slice, not a full new curriculum branch.

## Target Age Range
- Primary: `5-6`
- Support: `6-7` (reduced hints)
- Access policy for `3-4`:
  - **Recommend visible in catalog with “Listen & Explore” labeling, but no decoding mastery expectation.**
  - In `3-4`, run narration-first mode with simplified choices and no failure framing; reading checkpoints are exposure/modeling only.

## MVP Boundaries (Must Ship)
- Exactly `10` pages (no extra pages in this cycle).
- Exactly these interaction checkpoints:
  - `p02:firstSound` (required)
  - `p03:chooseLetter` (required)
  - `p05:simpleAdd` (required)
  - `p06:decodePointedWord` (required)
  - `p07:literalComprehension` (required)
  - `p08:sortObjects` (optional)
  - `p10:recapSkill` (required)
- Use existing i18n/audio namespace already wired in runtime:
  - `games.interactiveHandbook.handbooks.magicLetterMap.*`
  - `parentDashboard.games.interactiveHandbook.*`
- No new gameplay component; must run in current `InteractiveHandbookGame` shell.

## Out of Scope (This Cycle)
- New handbook routes/components.
- New schema work.
- New adaptive models beyond current level config + hint simplification.
- Expanding to >10 pages.

## Page Plan (Content Per Page)
| Page | Story Beat | Child Action | Content Contract |
|---|---|---|---|
| `p01` | Story hook: map appears | Listen only | Narration + prompt audio + cover visual context |
| `p02` | Hear target opening sound | Tap correct first-sound option | 3 choices (`2` for `3-4`), immediate feedback |
| `p03` | Pick matching Hebrew letter | Tap letter card | Confusable distractor allowed for `5-6/6-7` |
| `p04` | Transition story beat | Listen/advance | No mandatory interaction |
| `p05` | Simple in-story number task | Tap correct result | Keep arithmetic load low (`<=10`) |
| `p06` | Read pointed target word | Select decoded word | Fully pointed text only in MVP |
| `p07` | Literal comprehension from text | Choose answer from read line | Text-first cue; image cannot fully solve prompt |
| `p08` | Sort category objects | Tap/sort (optional) | Optional success path, never blocks completion |
| `p09` | Story resolution setup | Listen/advance | No mandatory interaction |
| `p10` | Recap learned skill | Choose recap card | Required completion checkpoint |

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction includes adjacent `▶` replay icon (44px+), replaying the exact same line.
- Child controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), continue (`→`) with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered immediately; no separate `check`/`test` button.

## Image Strategy
- Images support scene meaning and motivation.
- Decoding checkpoints (`p06`, `p07`) remain text-first; images cannot be the shortest path to correct answers.
- For `3-4`, images may scaffold engagement, but narrator still anchors attention to spoken/pointed tokens.

## Difficulty + Scaffolding
- Level A (`3-4` listen/explore): 2 choices max, auto replay, exposure-only reading.
- Level B (`5-6` core): 3 choices, one confusable distractor, fully pointed decoding checkpoint.
- Level C (`6-7` stretch): faster pacing, delayed hints, same page count.
- Simplification rule (all bands): after 2 misses, reduce options and replay slower prompt.

## Feedback Design
- Success: short praise + immediate story continuation.
- Mistakes: gentle retry language only; no punitive cues.
- Hints: progressive (`replay -> highlight -> reduced choices`).

## Session + Completion
- Session target: `8-10` minutes.
- Natural stop point: after `p05` (bookmark persists).
- Completion definition:
  - Pages `p01-p10` visited, and
  - All required checkpoints solved at least once (`p02,p03,p05,p06,p07,p10`).
  - `p08` optional checkpoint does not block completion.

## Audio + i18n Requirements
- All child-facing and parent-facing lines must be i18n keys with paired Hebrew audio.
- Required key families for MVP closure:
  - `games.interactiveHandbook.handbooks.magicLetterMap.cover.*`
  - `games.interactiveHandbook.handbooks.magicLetterMap.pages.p01-p10.{narration,prompt}`
  - `games.interactiveHandbook.handbooks.magicLetterMap.interactions.<id>.{prompt,hint,success,retry}`
  - `games.interactiveHandbook.handbooks.magicLetterMap.completion.*`
  - `parentDashboard.games.interactiveHandbook.{progressSummary,nextStep}`

## Parent Visibility (MVP)
- Show at least:
  - pages completed (`/10`)
  - first-attempt success trend
  - hint-use trend
  - next-step recommendation (replay current vs ready for next ladder book)

## Delegation Plan
- FED: implement the exact 10-page runtime scope, age-band behavior, and completion contract.
- Content Writer: verify/fill i18n/audio parity for all required keys and clips.
- Gaming Expert: quick mechanics + cognitive-load review for age-band simplification.

## References
- Teach Your Monster to Read: explicit phonics checkpoints with immediate feedback.
- HOMER: story flow plus scaffolded reading actions.
- Existing Dubiland launch-slot runtime + seed contract (`00020`).
