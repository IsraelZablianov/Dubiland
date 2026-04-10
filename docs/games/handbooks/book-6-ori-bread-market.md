# Book 6 — Ori at the Bread Market (Hebrew: אורי בשוק הלחם)

## Learning Objective
- Curriculum area: Reading + applied numeracy in story context.
- Measurable outcomes:
  - Child reads fully pointed high-frequency market words with >=82% accuracy.
  - Child correctly identifies final-form letters in word-final position in 4/5 prompts.
  - Child solves two text-linked quantity prompts (up to 10) without picture-only guessing.

## Target Age Range
- Primary: 5-6
- Stretch: 6-7 learners reinforcing final forms and automaticity.

## Mechanic
- Market mission where Ori reads signs to complete deliveries.
- Actions: tap decoded signs, sort words into stalls, choose quantity from read clue, text-evidence selection.
- Engine fit: data-configured handbook (`slug: oriBreadMarket`) in existing handbook component.
- RTL behavior: right-to-left stall labels, route progression and chips follow Hebrew scan order.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Difficulty Curve
- Level 1 (Pages 1-3):
  - Fully pointed single words, 2-choice checks.
  - Clear modeling of final letter position.
- Level 2 (Pages 4-7):
  - 3-choice checks + one distractor using incorrect final form.
  - Quantity prompts embedded in short pointed clauses.
- Level 3 (Pages 8-10):
  - Phrase decode -> literal action sequence.
  - Support mode after two misses reduces options and highlights target suffix.

## Feedback Design
- Success:
  - Stall icon animates and Ori thanks child in short line.
  - Reward emphasizes reading strategy ("שמת לב לאות בסוף המילה").
- Mistake handling:
  - Retry keeps same prompt, introduces one scaffold only.
  - No failure sounds; use calm supportive cue.
- Encouragement:
  - Inactivity replay at 6-7 seconds, hint icon pulses once.

## Session Design
- Duration: 9-11 minutes.
- Pages: 10 with 6 mandatory interactions and 1 optional bonus.
- Midpoint stop card after page 5.
- Replay rotates vocabulary sets (bakery words, market signs) without changing mechanics.

## Story Breakdown
| Page | Story Beat | Interaction ID | Learning Target |
|---|---|---|---|
| 01 | אורי מגיע לשוק הלחם עם רשימת משלוחים. | none | Context + vocabulary priming |
| 02 | שלט ראשון דורש זיהוי מילה מנוקדת. | `readSignWord` | Word decoding |
| 03 | עגלת לחמים מציגה מילים עם אותיות סופיות. | `spotFinalForm` | Final-form recognition |
| 04 | לקוחה מבקשת מספר כיכרות מתוך משפט קצר. | `textLinkedCount` | Decode + quantity mapping |
| 05 | אורי צריך למיין כרטיסי מילים לדוכנים נכונים. | `sortWordToStall` | Meaning-linked decoding |
| 06 | דובי נותן רמז קצר על אות סופית וחוזר לרקע. | `finalFormContrast` | Focused contrast practice |
| 07 | משפט חדש קובע סדר פעולות בדוכן. | `sequenceByPhrase` | Read then act in order |
| 08 | אתגר בונוס: לבחור תווית נכונה לתמונה ניטרלית. | `neutralImageDecode` | Text-first validation |
| 09 | אורי מסיים משלוח ושואל שאלה מילולית. | `literalQuestion` | Literal comprehension |
| 10 | סיכום יום שוק וחזרה על מילים נבחרות. | `recapChoice` | Retrieval and confidence |

## Interaction Design
| Interaction ID | Input | Prompt focus | Hint behavior | Success signal |
|---|---|---|---|---|
| `readSignWord` | Tap choice | Decode pointed market word | Slow syllable playback | Stall sign lights and opens |
| `spotFinalForm` | Tap letter ending | Identify correct final-form ending | Highlight final letter slot | Bread basket fills visually |
| `textLinkedCount` | Tap numeral chip | Pick quantity from decoded clause | Concrete loaf overlay appears | Delivery counter increments |
| `sortWordToStall` | Drag/tap-to-place | Match decoded word to stall | Color-coded stall pulse | Stall owner animation + praise |
| `sequenceByPhrase` | Tap ordered chips | Follow instruction sequence from text | Temporal marker highlight | Route line animates forward |

## Hebrew Narration Plan
- Spoken style: neighborhood market Hebrew, short and concrete lines.
- Reading checkpoints remain fully pointed.
- i18n families:
  - `common.handbooks.oriBreadMarket.pages.*`
  - `common.handbooks.oriBreadMarket.interactions.*`
  - `common.handbooks.oriBreadMarket.readingProgression.*`

## Illustration and Animation Brief
- Protagonist brief:
  - `characterId`: `ori-market-runner`
  - Personality triad: responsible, cheerful, persistent.
  - Signature prop: delivery satchel with labeled cards.
- Visual direction:
  - Israeli market references (bakery stand, fruit cart, neighborhood street signs).
  - Keep text-bearing props in high-contrast card areas.
- Animation notes:
  - Small ambient crowd loops; avoid high-motion clutter.
  - Final-form hints use subtle glow on word endings.

## Video Segment Notes
| Segment | Timing | Purpose | Production note |
|---|---|---|---|
| `micro-intro-market-opening` | 8s page 1 | Set scene and delivery mission | Keep signage readable as UI overlays, not baked into art |
| `interaction-demo-final-form` | 5s page 3 | Model how to inspect final letter | Zoom to final letter slot, then return quickly |

## Audio Requirements
- Required key families:
  - `common.handbooks.oriBreadMarket.meta.*`
  - `common.handbooks.oriBreadMarket.pages.page0X.{narration,cta}`
  - `common.handbooks.oriBreadMarket.interactions.<id>.{prompt,hint,success,retry}`
  - `common.handbooks.oriBreadMarket.feedback.*`
  - `common.parentDashboard.handbooks.oriBreadMarket.*`
- Audio behavior:
  - Market ambience must duck under voice by >=6dB.
  - Final-form prompts include clear articulation of terminal consonants.
  - Response clip max length 1.0s for momentum.

## Parent Visibility
- Parent dashboard shows:
  - Final-form accuracy trend.
  - Text-linked quantity prompt success.
  - Common confusion endings (for example ם/מ, ן/נ).
  - Readiness signal for Book 7 (`tamarWordTower`).

## Inspiration / References
- Khan Academy Kids: contextual literacy practice.
- TinyTap: object-to-word mapping interactions.
- Teach Your Monster to Read: focused contrast practice.

## Mechanics Calibration (Gaming Expert, 2026-04-10)
- Interaction density:
  - Isolate final-form decoding and text-linked quantity reasoning; do not introduce both as new demands in the same checkpoint.
  - Keep quantity prompts concrete-first (`textLinkedCount`) with object mapping before abstract numeral choice.
- Distractor load:
  - Level 1: 2 options, no orthographic foil.
  - Levels 2-3: max 3 options with one distractor using incorrect final form.
  - `textLinkedCount`: default quantity range 1-8; use 9-10 only in hard pages.
- Support mode trigger and simplification order:
  - Trigger support after 2 incorrect attempts or 6 seconds inactivity.
  - Step 1: replay clause + concrete loaf overlay.
  - Step 2: highlight final-letter slot or quantity token.
  - Step 3: remove one distractor.
  - Step 4: binary choice retry with narrated model.
- Exit support after 2 first-attempt checkpoints in sequence.

## Reading PM Validation Updates (2026-04-10)
- Pointing policy lock: all child-evaluated tokens stay fully pointed across Levels 1-3; final-form contrast prompts must not fade pointing in core path.
- Sentence complexity caps: `readSignWord` remains single-word, `textLinkedCount` clauses stay <=5 words, and sequence clauses stay <=6 words.
- Anti-image shortcut guardrails:
  - `textLinkedCount` visuals must never encode the quantity answer directly (count cue comes from text only).
  - `sortWordToStall` stall cards must be visually balanced so stall identity cannot be guessed from imagery alone.
  - `neutralImageDecode` keeps silhouette-style neutral art; text must carry disambiguation.
- Transition gate to Book 7 (`tamarWordTower`): promote when final-form accuracy >=80%, text-linked quantity accuracy >=75%, and child completes two consecutive phrase checkpoints with <=1 hint.

## Review Status
- PM spec draft complete.
- Reading PM progression validation complete (final-form transfer and image-neutral comprehension constraints locked).
- Gaming Expert calibration captured; ready for FED handoff once Content Writer package is attached.
