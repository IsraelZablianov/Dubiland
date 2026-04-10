# Handbook Literacy Interaction Framework (Hebrew: מסגרת אינטראקציות קריאה לספרונים)

## Learning Objective
- Curriculum area: Nikud -> syllable decoding -> word/phrase reading -> early comprehension.
- Core skills:
  - Identify Hebrew grapheme units accurately (letters + nikud as a single decoding target).
  - Blend CV/CVC syllables into pointed words without guessing from illustration context.
  - Read short pointed phrases in story flow and answer literal comprehension prompts.
  - Build early transfer to partially pointed text while preserving decoding accuracy.
- Measurable outcomes for age ~6 pathway:
  - Level 1 handbook set: >=85% correct on letter+nikud and syllable prompts with hint usage <=2 per interaction page.
  - Level 2 handbook set: >=80% correct on pointed word/phrase decoding with non-target selection rate <=20%.
  - Level 3 handbook set: >=75% correct on partially pointed phrase reading and literal comprehension in first attempt or one guided retry.

## Curriculum Position
- Placement in ladder:
  1. After core letter form + letter-sound foundations (`letter-tracing-trail`, `letter-sound-match`, `letter-sky-catcher`).
  2. Parallel to beginner word building (`picture-to-word-builder`) as contextual reading transfer.
  3. Before decodable story library scale-up; acts as bridge from isolated drills to connected text.
- Prerequisites:
  - Child can identify at least 12-15 high-frequency Hebrew letters in print script (דפוס).
  - Child can follow icon-first interaction controls (`▶`, `↻`, `💡`, `→`) with audio prompts.
  - Child has initial exposure to basic nikud signs (patah, kamatz, segol, hiriq).
- What comes next:
  - Decodable micro-stories with reduced visual support.
  - Expanded morphology-light prompts (prefix awareness and root family patterning).

## Target Age Range
- Primary: 5-7
- Early-entry support mode: advanced 4.5-5 with higher narration and hint scaffolding.

## Mechanic
- Core runtime pattern for handbook pages:
  1. Story narration plays on page load (RTL layout, auto-play with replay option).
  2. Literacy checkpoint card appears inline and pauses page advance.
  3. Child performs one action (tap, drag, reorder, syllable blend selection, or short read-aloud mimic choice).
  4. Validation is immediate on action; no separate `check/submit/test` control.
  5. Story continues with brief positive reinforcement and next page transition.
- Interaction taxonomy by literacy stage:

| Stage | Interaction Pattern | Example Prompt Type | Pass Rule |
|---|---|---|---|
| Letter + Nikud | Tap-to-choose correct grapheme | "בחר את בָּ" among confusables | 1 correct tap or hint-assisted retry |
| Syllable | Drag syllables to build CV/CVC | "סדר: מַ + לָ" | Correct order within 2 attempts |
| Word | Choose/read pointed word in context | "איזו מילה כתובה על השלט?" | Correct word selection from 3 options |
| Phrase | Read short pointed phrase | "קרא: דובי רָץ מהר" | Correct phrase decode signal + continue |
| Comprehension | Literal question from decoded sentence | "מה דובי מצא?" | Correct answer after reading cue |

- Engine fit:
  - One feature runtime component family: `HandbookPage` + `HandbookInteractionCard` variants.
  - One DB row per handbook item; literacy interaction definitions live per page payload.
  - Each interaction variant remains template-based so content can scale without bespoke code per page.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (minimum 44px) to replay the exact instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), continue (`→`), each with audio cues.
- No text-only action labels in child gameplay UI; icon semantics must be learnable by repeated sound cues.
- Feedback is action-triggered and immediate; do not design separate `check`/`test` buttons.
- Story progression controls must remain RTL-consistent and touch-safe on tablet/mobile.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay instruction | `▶` | Replays active `handbooks.<slug>.pages.<page>.interaction.instructions.*` | Instruction card pulse + focus ring on target units. |
| Retry interaction | `↻` | Encouragement cue (`feedback.encouragement.*`) + prompt replay | Resets same interaction without penalty language. |
| Hint | `💡` | Context hint (`handbooks.<slug>.pages.<page>.interaction.hints.*`) | Visual scaffold (highlight, segmentation dots, or drag ghost). |
| Continue story | `→` | Success transition cue (`feedback.success.*`) | Closes card and advances to next page animation. |

## Image Strategy
- Use illustrations to support meaning and story engagement, not to replace decoding.
- Fading plan:
  - Level 1: Image-supported decoding (picture may appear next to options).
  - Level 2: Reduced image clues; options rely more on grapheme/syllable inspection.
  - Level 3: Decoding checkpoints run without meaning-giving image cues, then image returns after completion.
- Guardrail:
  - At least 40% of reading checkpoints in each handbook must be "text-first" (no answer-revealing picture clue).
  - Confusable-letter drills should use neutral icons so children cannot solve by semantic shortcut.

## Difficulty Curve
- Level 1 (Beginner Handbook Reader):
  - Fully pointed text.
  - 2-option contrasts for letter+nikud and syllable prompts.
  - One literacy checkpoint every 2 pages, with mandatory modeled audio before child action.
  - Hint model: explicit (highlight correct grapheme after first miss).
- Level 2 (Developing Decoder):
  - Fully pointed words + short pointed phrases.
  - 3-option contrasts, include one confusable distractor pair per checkpoint max.
  - One literacy checkpoint every 1-2 pages.
  - Hint model: segmented audio (syllable-by-syllable) before visual cue.
- Level 3 (Bridge to Fluency):
  - Mix pointed and partially pointed phrases (target words may reduce nikud).
  - Multi-step checkpoints (decode phrase -> answer literal comprehension).
  - One literacy checkpoint per page cluster with faster response expectation.
  - Hint model: minimal verbal nudge first, then selective visual scaffold.
- Adaptive scaffolding:
  - Trigger support mode if child misses 2 consecutive reading checkpoints.
  - In support mode: revert next checkpoint to fully pointed + reduced options for one cycle.
  - Exit support mode after 2 consecutive successful checkpoints without hint tap.

## Feedback Design
- Success feedback:
  - Immediate positive narration tied to decoding strategy (for example, praise for sounding out, not guessing).
  - Micro-celebration visual + quick continuation into story.
- Mistake handling:
  - Gentle corrective language only; no negative sounds or failure screens.
  - First miss: replay prompt + optional hint pulse.
  - Second miss: scaffolded hint and simplified retry.
- Encouragement pattern:
  - Prioritize effort praise ("ניסית לקרוא את הצלילים יחד") before correction.
  - Auto-replay instructions after 6 seconds of inactivity.

## Session Design
- Session target: 10-15 minutes total per handbook run.
- Typical structure:
  - 8-14 pages per session slice.
  - 4-8 literacy checkpoints depending on level.
  - Natural stop points every 3-4 pages with resume bookmark.
- Replay value:
  - Rotation between checkpoint templates while keeping same reading target.
  - Spaced repetition returns previously missed grapheme/syllable targets in later pages.

## Audio Requirements
- All visible child-facing strings are i18n-keyed and have Hebrew audio assets.
- Required key families:
  - `handbooks.<slug>.title`
  - `handbooks.<slug>.pages.<page>.narration.*`
  - `handbooks.<slug>.pages.<page>.interaction.instructions.*`
  - `handbooks.<slug>.pages.<page>.interaction.prompts.*`
  - `handbooks.<slug>.pages.<page>.interaction.hints.*`
  - `handbooks.<slug>.pages.<page>.interaction.feedback.success.*`
  - `handbooks.<slug>.pages.<page>.interaction.feedback.retry.*`
  - `handbooks.<slug>.pages.<page>.interaction.feedback.encouragement.*`
  - `letters.pronunciation.*`
  - `nikud.pronunciation.*`
  - `syllables.pronunciation.*`
  - `words.pronunciation.*`
  - `feedback.success.*`
  - `feedback.encouragement.*`
- Audio behavior constraints:
  - Narration and instruction replay must duck background media by at least 6dB.
  - Per-checkpoint response audio should complete in <=900ms before next interaction state.
  - Hebrew phoneme pronunciation should use child-directed clear articulation (no over-fast TTS pacing).

## Parent Visibility
- Parent dashboard should expose:
  - Accuracy by literacy checkpoint type (letter+nikud, syllable, word, phrase, comprehension).
  - Most-confused letter or nikud contrasts.
  - Hint usage trend and support-mode frequency.
  - Last completed handbook level and readiness signal for next reading stage.
- Suggested parent-facing i18n key families:
  - `parentDashboard.handbooks.reading.progressSummary`
  - `parentDashboard.handbooks.reading.confusions`
  - `parentDashboard.handbooks.reading.nextStep`

## Literacy Guardrails for Content Writer and Gaming Expert
- Content Writer guardrails:
  - Keep beginner scripts fully pointed; reduce nikud only in approved Level 3 contexts.
  - Maintain decodable vocabulary aligned to taught grapheme-phoneme correspondences.
  - Avoid comprehension questions that can be solved from pictures alone when decoding is target skill.
- Gaming Expert guardrails:
  - Ensure each checkpoint evaluates decoding behavior, not reaction speed as primary signal.
  - Cap confusable pair load to one focused contrast per checkpoint.
  - Preserve positive-reinforcement loop and action-triggered validation.

## Inspiration / References
- Reading Eggs: decodable sequencing and explicit phonics progression in book-like flows.
- HOMER: story + interaction blending with strong audio-led guidance for pre-readers.
- Teach Your Monster to Read: explicit grapheme-phoneme practice with high replay value.
- Ji Alef-Bet: Hebrew-first conventions, letter/nikud relevance, and culturally aligned scaffolding.
