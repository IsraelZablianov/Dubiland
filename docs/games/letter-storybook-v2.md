# Letter Story v2 — Continuous Narrative Route (Hebrew: מסע האותיות הרציף)

## Learning Objective
- Curriculum stage: Letter Recognition with controlled transfer to pointed words and short pointed phrases.
- Core skill target: build stable grapheme-sound mapping for all 22 Hebrew letters inside one connected story (not isolated pages).
- Measurable outcomes by age band:
  - `3-4` support mode: complete all scenes in listen/explore flow with replay use and at least 8 successful prompted letter taps.
  - `5-6` core mode: complete all 22 letter checkpoints with >=80% first-try accuracy and <=2 hint escalations per chapter.
  - `6-7` stretch mode: pass confusable transfer checks (`ד/ר`, `ב/כ`, `ט/ת`, `א/ע`) and read short pointed phrase prompts in chapter finals.

## Curriculum Position
- Placement: after `letter-tracing-trail` and `letter-sound-match`; before `confusable-letter-contrast`, `sofit-word-end-detective`, and broader syllable/word decoding routes.
- Prerequisites:
  - Child can follow icon-first controls (`▶`, `↻`, `💡`) with audio prompts.
  - Child has baseline exposure to at least 8 letters.
- Follow-up transfer:
  - Confusable-letter remediation.
  - Final-form positional transfer.
  - Decodable micro-story connected text.

## Target Age Range
- Primary mastery band: `5-7`
- Visible support mode: `3-4` (listen/explore, no mastery gating)

## Mechanic
- Primary interaction: storybook progression with action-validated letter tasks per scene.
- Core loop per scene:
  1. דובי narrates the current story beat and introduces one target letter.
  2. Child taps the target letter glyph after hearing name + sound.
  3. Child performs one linked action (drag token, pick sign, or tap path node) to unlock transition.
  4. Immediate feedback resolves the action and advances to the next scene.
- Engine fit:
  - One new DB row in `games` with separate slug/route from v1.
  - One new component implementing `GameProps` for the continuous route runtime.

## Separate Route Contract (Mandatory)
- v2 is a separate game/route and must not replace or regress shipped v1 storybook behavior.
- v2 owns its own i18n namespace (`games.letterStorybookV2.*`) and audio pack (`public/audio/he/games/letter-storybook-v2/*`).
- Child profile progress is tracked independently for v1 and v2.
- Shared letter metadata is allowed only via explicit read-only constants; no coupled runtime state.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`) with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Age-Band Decoding Goals
- `3-4` support:
  - Focus: attention, listening, and letter noticing in story context.
  - Gating: no failure lock; hints auto-escalate quickly.
- `5-6` core:
  - Focus: accurate letter-sound retrieval and guided confusable discrimination.
  - Gating: chapter checkpoint pass required with adaptive support.
- `6-7` stretch:
  - Focus: letter-to-pointed-word/phrase transfer with reduced image support.
  - Gating: final chapter includes phrase-level transfer checks.

## Narrative Continuity Rules
- Story world is single-threaded from opening to finale; each scene resolves into the next scene trigger.
- Each letter must appear as both:
  - visual grapheme target
  - spoken letter cue in the transition line
- Transition text must reference either:
  - a cause from the previous scene, or
  - a clue that predicts the next letter scene
- No scene may start with an unconnected "new letter appears" pattern.
- Chapter checkpoints summarize prior scenes before introducing next chapter goal.

## 22-Letter Sequence Contract With Transitions

| Seq | Letter | Anchor Word | Scene Beat | Transition Contract |
|---|---|---|---|---|
| 1 | א | אריה | דובי meets a gentle lion at the gate. | Lion points to a floating balloon (`ב`) to continue the path. |
| 2 | ב | בלון | Balloon pulls דובי over a stream. | Balloon string catches on a camel bell (`ג`). |
| 3 | ג | גמל | Camel carries דובי across warm sand. | Camel stops by a fish pond with a glowing `ד` marker. |
| 4 | ד | דג | Fish jumps and reveals a stone key. | Key opens a hill gate with letter `ה`. |
| 5 | ה | הר | דובי climbs a mountain trail. | At the summit, a rose vine shaped like `ו` appears. |
| 6 | ו | ורד | Rose garden gives a scent clue. | A zebra stripe path (`ז`) lights up ahead. |
| 7 | ז | זברה | Zebra guides the route through tall grass. | Lantern light reveals a curious cat (`ח`). |
| 8 | ח | חתול | Cat finds a hidden chapter badge. | Badge opens chapter checkpoint 1 and leads to lamb meadow (`ט`). |
| 9 | ט | טלה | Lamb escorts דובי to a quiet field. | Field wind points to a waving hand sign (`י`). |
| 10 | י | יד | Handprint puzzle unlocks a bridge. | Bridge drops a bouncing ball clue (`כ`). |
| 11 | כ | כדור | Ball rolls into a hoop gate. | Gate ribbon forms a heart kite (`ל`). |
| 12 | ל | לב | Heart kite lifts chapter marker. | Marker drops rain that becomes water fountain (`מ`). |
| 13 | מ | מים | Water rhythm reveals next path stones. | Last splash outlines a candle icon (`נ`). |
| 14 | נ | נר | Candle lights a dusk tunnel. | Tunnel shadows sketch a horse silhouette (`ס`). |
| 15 | ס | סוס | Horse carries דובי into chapter checkpoint 2. | Checkpoint banner points to a cloud bridge (`ע`). |
| 16 | ע | ענן | Cloud bridge drifts above the valley. | Wind lifts a butterfly wing clue (`פ`). |
| 17 | פ | פרפר | Butterfly opens a flower gate. | Gate petals release a bird feather (`צ`). |
| 18 | צ | ציפור | Bird delivers a map fragment. | Fragment marks a monkey lookout (`ק`). |
| 19 | ק | קוף | Monkey helps assemble the map. | Map points to a railway switch (`ר`). |
| 20 | ר | רכבת | Train carries דובי to final chapter zone. | Train whistle reveals a sun crest (`ש`). |
| 21 | ש | שמש | Sun crest charges the finish arch. | Arch drops a red apple key (`ת`). |
| 22 | ת | תפוח | Apple key opens the celebration gate. | Gate transitions to final checkpoint + parent summary. |

## Image Strategy
- Images support comprehension and narrative continuity, not letter guessing.
- Fade plan:
  - Level 1: full-scene art with highlighted grapheme.
  - Level 2: art remains but highlight fades after first success.
  - Level 3: checkpoint actions use text/letter-first prompts with minimal art cues.
- Guardrails:
  - No success condition may be satisfied by image tap alone.
  - Checkpoints score only letter/word actions.

## Difficulty Curve
- Level 1 (`letters 1-8`): guided discovery
  - one target letter, one clear action, full narration support.
- Level 2 (`letters 9-15`): guided retrieval
  - add one confusable decoy and adaptive hints.
- Level 3 (`letters 16-22`): transfer + contrast
  - reduced visual cues, confusable checks, short pointed phrase prompts.
- Adaptive logic:
  - 2 misses on same scene -> auto-hint step 2.
  - 3 first-try successes in a row -> reduce cue density by one step.
  - `3-4` mode never blocks progress.

## Feedback Design
- Success:
  - immediate action-confirmed animation + short praise audio.
  - replay of letter sound is always available.
- Mistake handling:
  - neutral tone; no negative language.
  - target pulses + prompt replay + narrowed options.
- Hint progression (`💡`):
  1. replay letter name/sound
  2. stroke/shape highlight
  3. solved micro-example then immediate retry

## Session Design
- Session length: `10-15` minutes.
- Chapter structure:
  - Chapter 1: letters 1-8 + checkpoint
  - Chapter 2: letters 9-15 + checkpoint
  - Chapter 3: letters 16-22 + final checkpoint
- Natural stopping points: after each chapter checkpoint.
- Replay hooks:
  - "3 known + 1 new" revisit mix.
  - Weekly confusable spotlight tied to chapter outcomes.

## Audio Requirements
- Every child-visible instruction must have mapped audio.
- i18n/audio key families:
  - `games.letterStorybookV2.title`
  - `games.letterStorybookV2.instructions.*`
  - `games.letterStorybookV2.controls.{replay,retry,hint,next}`
  - `games.letterStorybookV2.letters.<letterKey>.{intro,sound,prompt,success,hint1,hint2,hint3}`
  - `games.letterStorybookV2.transitions.<fromLetter>_to_<toLetter>`
  - `games.letterStorybookV2.checkpoints.{chapter1,chapter2,final}.*`
  - `parentDashboard.games.letterStorybookV2.*`
- Audio runtime constraints:
  - instruction prompts target `0.6-1.4s`
  - duck background music by >=6dB under spoken instructions
  - replay icon must be available for every prompt line

## Parent Visibility
- Dashboard shows:
  - letters introduced vs mastered (v2 separate from v1)
  - confusable pair error map
  - hint usage trend per chapter
  - chapter completion and recommended next game

## Acceptance Criteria
- Curriculum:
  - all 22 letters appear once in ordered sequence with explicit transition lines.
  - age-band goals (`3-4`, `5-6`, `6-7`) are represented in checkpoints.
- UX:
  - icon-first controls and replay button are present on every instruction action.
  - no text-only child controls; no explicit `check` button.
- Content:
  - 100% of child-facing copy is i18n-keyed.
  - 100% of child-facing copy has mapped Hebrew audio.
- Architecture:
  - v2 route is independently addressable and does not alter v1 route behavior.
  - one component + one DB row contract maintained.

## Hand-Off Checklist
- Content Writer: finalize Hebrew continuous narrative script + full i18n/audio key sheet.
- UX Designer: lock RTL page anatomy, tap-safe icon rail, and chapter transition visuals.
- Media Expert: deliver 22-scene illustration pack + transition assets in consistent style.
- Gaming Expert: validate engagement pacing, reward cadence, and adaptive threshold fairness.
- CTO/Architect lane: approve route separation/data contract and GameProps compatibility.
- FED Engineer lane: implement v2 runtime route, checkpoint logic, and non-regression guarantees.
- QA lane: verify RTL flow, i18n/audio coverage completeness, and v1/v2 route separation.

## Inspiration / References
- Reading Eggs: systematic grapheme progression with checkpoint retrieval.
- HOMER: narrative-led early literacy pacing.
- Teach Your Monster to Read: collectible progression and immediate action feedback.
- Ji Alef-Bet: Hebrew-specific orthography handling and age fit.
