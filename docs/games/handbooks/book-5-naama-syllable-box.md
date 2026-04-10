# Book 5 — Naama and the Syllable Box (Hebrew: נעמה וקופסת ההברות)

## Learning Objective
- Curriculum area: Reading (קריאה), syllable blending and early decodable word fluency.
- Measurable outcomes:
  - Child blends CV/CVC syllables into target words at >=80% accuracy by end-of-session.
  - Child answers at least 3 of 4 literal "what did X find/do" checks after decoding text.
  - Child reduces hint reliance from first half to second half of the session.

## Target Age Range
- Primary: 5-6
- Stretch: 6-7 readers needing controlled fluency consolidation.

## Mechanic
- Narrative mission around a magical box that opens by syllable blends.
- Primary actions: drag syllable chips, tap decoded word, choose literal answer from text-first prompt.
- Engine fit: handbook runtime configuration only (`slug: naamaSyllableBox`), no new gameplay component.
- RTL-first layout: chips ordered right-to-left, drag rails mirror Hebrew reading direction.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Difficulty Curve
- Level 1 (Pages 1-3):
  - Two syllable chips, heavy narration modeling.
  - Fully pointed targets, two options max.
- Level 2 (Pages 4-7):
  - Three options with one confusable foil.
  - Child assembles words in context and confirms meaning.
- Level 3 (Pages 8-10):
  - Short pointed phrase decoding + literal question from sentence.
  - Hints become optional and delayed to preserve productive struggle.

## Feedback Design
- Success:
  - Box unlock animation + short praise line emphasizing blend strategy.
  - Story continues without mode switch.
- Mistakes:
  - "בואי נפרק לצלילים יחד" style prompt with segmented audio.
  - No punitive states; after 2 misses one option fades out.
- Encouragement:
  - Rotating encouragement bank (5+ variants) to avoid repetitive tone fatigue.

## Session Design
- Duration: 9-11 minutes.
- Pages: 10 with 6 required interactions.
- Stopping point: after page 6 (auto-save bookmark).
- Replay: syllable sets rotate while preserving the same lexical family objective.

## Story Breakdown
| Page | Story Beat | Interaction ID | Learning Target |
|---|---|---|---|
| 01 | נעמה מקבלת קופסה מסתורית עם מנעול קולי. | none | Goal framing and vocabulary setup |
| 02 | רמז ראשון: לבנות הברה פשוטה כדי להתחיל. | `buildCV` | CV blending |
| 03 | דלת קטנה נפתחת ומציגה שתי מילים מנוקדות. | `pickDecodedWord` | Word-level decoding |
| 04 | נעמה מוצאת כרטיסיות עם צלילים מתבלבלים. | `fixSyllableOrder` | Sequencing syllable order |
| 05 | דובי מופיע לרמז קצר וחוזר הצידה. | `confusableSyllable` | Controlled contrast check |
| 06 | פתק חדש דורש קריאת צירוף בן שתי מילים. | `readShortPhrase` | Phrase decoding |
| 07 | נעמה בוחרת חפץ בהתאם למה שקראה. | `textToObject` | Text-first comprehension |
| 08 | הקופסה מציעה אתגר בונוס של מילה חדשה דומה. | `transferBlend` | Near transfer |
| 09 | רמז הסיום: מה נעמה מצאה בסוף? | `literalQuestion` | Literal recall from text |
| 10 | חגיגת פתיחת הקופסה וסיכום מילים חדשות. | `recapChoice` | Retrieval + confidence |

## Interaction Design
| Interaction ID | Input | Prompt focus | Hint behavior | Success signal |
|---|---|---|---|---|
| `buildCV` | Drag/tap syllable chips | Build target CV sequence | Segmented audio + slot glow | Lock clicks and blend narration |
| `pickDecodedWord` | Tap one of 3 words | Choose decoded pointed word | Remove one foil after 2 misses | Key appears and box light increases |
| `fixSyllableOrder` | Reorder tiles | Correct syllable order in word | Numbered order overlay appears | Word animates on banner |
| `readShortPhrase` | Tap phrase strip then continue | Decode 2-4 word pointed phrase | Slow pacing playback | Path to next chamber opens |
| `literalQuestion` | Tap answer chip | Answer from decoded phrase only | Highlight relevant phrase fragment | Final lock opens with celebration |

## Hebrew Narration Plan
- Narration style: concise child-friendly spoken Hebrew, one actionable instruction per line.
- Reading lines remain fully pointed in child-evaluated checkpoints.
- Key families live under `common.handbooks.naamaSyllableBox.*` with scripted cue categories:
  - `scriptPackage.narration.*`
  - `scriptPackage.prompts.*`
  - `scriptPackage.hints.*`
  - `scriptPackage.praise.*`

## Illustration and Animation Brief
- Protagonist brief:
  - `characterId`: `naama-word-crafter`
  - Personality triad: inventive, focused, kind.
  - Signature prop: mosaic syllable box with glowing tiles.
- Scene direction:
  - Warm study room with tactile objects and clear interaction card space.
  - Syllable chips should be visually distinct but low-clutter.
- Motion:
  - Tile snap animation communicates correct ordering.
  - Success movement remains short and predictable.

## Video Segment Notes
| Segment | Timing | Purpose | Production note |
|---|---|---|---|
| `micro-intro-box-awakens` | 8s on page 1 | Story hook and mission setup | Show signature box clearly in center-safe zone |
| `milestone-box-open` | 7s on page 10 | End-of-book mastery payoff | Keep celebration gentle; avoid overstimulating flashes |

## Audio Requirements
- Required key families:
  - `common.handbooks.naamaSyllableBox.meta.*`
  - `common.handbooks.naamaSyllableBox.pages.page0X.{narration,cta}`
  - `common.handbooks.naamaSyllableBox.interactions.<id>.{prompt,hint,success,retry}`
  - `common.handbooks.naamaSyllableBox.readingProgression.level{1,2,3}.*`
  - `common.handbooks.naamaSyllableBox.feedback.*`
  - `common.parentDashboard.handbooks.naamaSyllableBox.*`
- Audio behavior:
  - Replay icon reuses identical prompt clip.
  - Syllable modeling uses slightly slower cadence than narration.
  - Encouragement clips remain <=1.1s for rhythm continuity.

## Parent Visibility
- Dashboard highlights:
  - Syllable blend accuracy by checkpoint type.
  - Most-confused syllable contrasts.
  - Retry count and support-mode frequency.
  - Readiness indicator for Book 6 (`oriBreadMarket`).

## Inspiration / References
- Teach Your Monster to Read: blend-first decoding progression.
- Reading Eggs: explicit decodable staircase.
- Khan Academy Kids: supportive retry voice.

## Mechanics Calibration (Gaming Expert, 2026-04-10)
- Interaction density:
  - Keep one new variable per page cluster; do not introduce transfer and literal recall as first-attempt demands in the same loop.
  - Preserve short active loops (2-5 minutes) inside the full handbook by limiting each checkpoint to one discrete action.
- Distractor load:
  - Level 1: 2 options only.
  - Level 2: 3 options only on `pickDecodedWord`; ordering tasks stay at 2 movable units until hard mode.
  - Level 3: max 3 options for comprehension prompts.
- Support mode trigger and simplification order:
  - Trigger support after 2 incorrect attempts or 7 seconds of inactivity.
  - Step 1: segmented blend replay.
  - Step 2: lock first syllable + fade one foil.
  - Step 3: restore full pointing + reduce to two options.
  - Step 4: guided tap-to-place retry on same word family.
- Exit support after 2 consecutive independent successes.

## Reading PM Validation Updates (2026-04-10)
- Pointing policy lock: child-evaluated text remains fully pointed on pages 1-8; pages 9-10 may include one familiar partially pointed token in stretch mode only.
- Sentence complexity caps: decoding prompts remain at 1-2 words in Levels 1-2; `readShortPhrase` stays capped at 2-4 words in Level 3.
- Anti-image shortcut guardrails:
  - `textToObject` requires the child to tap the supporting text fragment before object selection is enabled.
  - `textToObject` and `transferBlend` option cards must use matched visual salience (same semantic category, no unique hero image cue).
  - `literalQuestion` mandatory lane uses text-only answer chips for mastery scoring.
- Transition gate to Book 6 (`oriBreadMarket`): promote when blend accuracy >=80%, literal text-check accuracy >=75%, and hint usage trend declines from session half 1 to half 2.

## Review Status
- PM spec draft complete.
- Reading PM progression validation complete (decodability constraints and anti-shortcut guardrails applied).
- Gaming Expert calibration captured; Content Writer audio/i18n pass remains required before implementation handoff.
