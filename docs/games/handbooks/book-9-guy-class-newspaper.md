# Book 9 — Guy and the Class Newspaper (Hebrew: גיא ועיתון הכיתה)

## Learning Objective
- Curriculum area: Sentence stamina + short paragraph comprehension.
- Measurable outcomes:
  - Child reads short informational paragraphs (2-3 sentences) with >=75% literal accuracy.
  - Child answers at least 2 inference-lite prompts anchored in explicit text clues.
  - Child identifies headline-to-body alignment in 4/5 checks.

## Target Age Range
- Primary: 6-7
- Advanced 7-year-old readers can use challenge branch with lower hint density.

## Mechanic
- Story mission: Guy must finish the class newspaper by reading and sorting article clues.
- Actions: decode headline, select factual detail from paragraph, order article sections, choose text-anchored inference.
- Engine fit: configured handbook entry (`slug: guyClassNewspaper`) in existing story runtime.
- RTL behavior: article columns and sequence chips flow right-to-left.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Difficulty Curve
- Level 1 (Pages 1-4):
  - One-sentence prompts with mostly pointed support.
  - 3 options max.
- Level 2 (Pages 5-8):
  - 2-sentence informational snippets with reduced pointing.
  - Literal fact extraction + section ordering.
- Level 3 (Pages 9-12):
  - 2-3 sentence blocks, one inference-lite question anchored by explicit clue.
  - Support mode highlights clue sentence after misses.

## Feedback Design
- Success:
  - Newspaper panel fills and headline animation appears.
  - Praise tied to reading evidence ("מצאת את התשובה מתוך הטקסט").
- Mistakes:
  - Retry keeps same paragraph and asks for focused reread.
  - Simplifies by reducing options before adding extra hint text.
- Encouragement:
  - Gentle tone, no failure overlays, actionable next cue always visible.

## Session Design
- Duration: 11-13 minutes.
- Pages: 12 with 8 required interactions.
- Stop point: page 6 with "continue later" bookmark.
- Replay value: rotating short article topics and clue ordering.

## Story Breakdown
| Page | Story Beat | Interaction ID | Learning Target |
|---|---|---|---|
| 01 | גיא מקבל משימה להכין עיתון כיתה. | none | Mission setup |
| 02 | צריך לבחור כותרת שמתאימה לכתבה קצרה. | `headlineMatch` | Headline-text alignment |
| 03 | פסקה ראשונה כוללת פרט עובדתי מרכזי. | `findFact` | Literal extraction |
| 04 | סדר חלקי כתבה התבלבל וצריך תיקון. | `orderSections` | Structural sequencing |
| 05 | כתבה שנייה עם שני משפטים דורשת קריאה רציפה. | `twoSentenceRead` | Reading stamina |
| 06 | דובי נותן תזכורת "מחפשים ראיה בטקסט". | `strategyPrompt` | Evidence strategy |
| 07 | בחירת תשובה מילולית מתוך אפשרויות דומות. | `literalChoice` | Precision comprehension |
| 08 | סידור אירועים בכתבה לפי "מה קרה קודם". | `eventSequence` | Sequence from text |
| 09 | פסקה שלישית מוסיפה שאלה למה/איך פשוטה. | `anchoredInference` | Inference anchored in clue |
| 10 | גיא בוחר משפט שמוכיח את התשובה. | `tapEvidence` | Evidence identification |
| 11 | שלב סופי: בדיקת התאמה בין כותרת לתוכן. | `headlineCheckFinal` | Coherence check |
| 12 | העיתון מודפס וסיכום מילים חדשות. | `recapChoice` | Retrieval and confidence |

## Interaction Design
| Interaction ID | Input | Prompt focus | Hint behavior | Success signal |
|---|---|---|---|---|
| `headlineMatch` | Tap choice | Match headline to short text | Highlight key noun in paragraph | Headline locks into layout |
| `findFact` | Tap sentence chip | Identify explicit fact | Replay sentence with emphasis | Fact badge appears |
| `orderSections` | Drag/tap cards | Arrange intro-body-end | Numbered ghost slots | Article layout snaps correctly |
| `anchoredInference` | Tap answer chip | Choose inference linked to clue | Underline clue sentence | Editor stamp animation |
| `tapEvidence` | Tap text fragment | Point to textual proof | Pulse likely clue tokens | Final page goes to print |

## Hebrew Narration Plan
- Tone: newsroom-playful but clear and not rushed.
- Sentence length increases gradually across pages.
- All text and prompts via `common.handbooks.guyClassNewspaper.*` key family.

## Illustration and Animation Brief
- Protagonist brief:
  - `characterId`: `guy-junior-editor`
  - Personality triad: organized, curious, cooperative.
  - Signature prop: headline stamp kit.
- Visual direction:
  - Classroom newsroom with clear card hierarchy.
  - Avoid dense background details on paragraph pages.
- Motion:
  - Printing and stamping micro-animations as rewards.
  - Keep reading checkpoint pages mostly static for focus.

## Video Segment Notes
| Segment | Timing | Purpose | Production note |
|---|---|---|---|
| `micro-intro-newsroom` | 7s page 1 | Introduce class newspaper quest | Keep desk objects away from interaction card area |
| `milestone-print-press` | 6s page 12 | Final payoff after comprehension loop | Sync with completion audio cue |

## Audio Requirements
- Required key families:
  - `common.handbooks.guyClassNewspaper.meta.*`
  - `common.handbooks.guyClassNewspaper.pages.page0X.{narration,cta}`
  - `common.handbooks.guyClassNewspaper.interactions.<id>.{prompt,hint,success,retry}`
  - `common.handbooks.guyClassNewspaper.readingProgression.level{1,2,3}.*`
  - `common.handbooks.guyClassNewspaper.feedback.*`
  - `common.parentDashboard.handbooks.guyClassNewspaper.*`
- Audio behavior:
  - Paragraph replay supports sentence-by-sentence pacing.
  - Evidence prompts emphasize clue phrase with gentle stress.
  - Celebration clips remain short to avoid cognitive reset.

## Parent Visibility
- Dashboard metrics:
  - Literal vs inference-lite accuracy split.
  - Headline coherence success trend.
  - Reading stamina indicator (completed paragraph checkpoints).
  - Readiness signal for Book 10 (`almaRootFamilies`).

## Inspiration / References
- HOMER: text-based comprehension prompts.
- Khan Academy Kids: child-safe narrative framing.
- TinyTap: card sorting and sequencing patterns.

## Mechanics Calibration (Gaming Expert, 2026-04-10)
- Interaction density:
  - Keep sentence-stamina ramp incremental: 1 sentence (L1), 2 sentences (L2), and 2-sentence core in L3; 3-sentence text remains optional challenge only.
  - Separate headline alignment and inference demands so they do not debut together in one checkpoint.
- Distractor load:
  - Level 1: max 3 options.
  - Level 2: max 3 options with one structural foil.
  - Level 3: inference-lite remains one mandatory checkpoint with 2 choices and explicit text clue.
- Support mode trigger and simplification order:
  - Trigger support after 2 misses or 8 seconds inactivity.
  - Step 1: sentence-by-sentence replay.
  - Step 2: highlight clue sentence.
  - Step 3: remove one distractor.
  - Step 4: split paragraph into tappable sentence cards for retry.
- Exit support after 2 first-attempt literal checkpoints.

## Reading PM Validation Updates (2026-04-10)
- Pointing policy lock: Level 1 stays mostly fully pointed, Level 2 may reduce pointing only on already-mastered function words, and Level 3 keeps at least one fully pointed clue sentence per checkpoint.
- Sentence complexity caps: mandatory path uses 1 sentence (L1) then 2 sentences (L2-L3); 3-sentence paragraphs stay optional challenge only.
- Anti-image shortcut guardrails:
  - `headlineMatch` options must use the same template thumbnail to prevent topic guessing from image cues.
  - `anchoredInference` remains a 2-choice text-only checkpoint in mandatory progression.
  - `findFact` and `tapEvidence` require sentence selection before any visual confirmation animation.
- Transition gate to Book 10 (`almaRootFamilies`): promote when literal extraction >=75%, headline-body coherence >=80%, and anchored inference >=70% with explicit clue use.

## Review Status
- PM spec draft complete.
- Reading PM progression validation complete (paragraph load, pointing policy, and inference guardrails locked).
- Mechanics calibration captured; ready for Content Writer and FED implementation lanes.
