# Book 10 — Alma and the Root Families (Hebrew: עלמה ומשפחות השורש)

## Learning Objective
- Curriculum area: Morphology-light Hebrew transfer (root family awareness in decodable context).
- Measurable outcomes:
  - Child identifies shared root pattern across 3 related words in 4/5 checkpoints.
  - Child selects meaning-consistent family member from sentence context at >=75% accuracy.
  - Child completes final transfer prompt using a new but related word with one hint or less.

## Target Age Range
- Primary: 6-7
- Advanced extension for confident early readers transitioning to morphology awareness.

## Mechanic
- Story quest in Alma's word-lab where each station unlocks by root-family pattern spotting.
- Primary actions: sort words by root family, choose context-fit family word, tap evidence in sentence, complete transfer prompt.
- Engine fit: handbook config (`slug: almaRootFamilies`) in existing runtime.
- RTL constraints: root cards, sentence strips, and sort bins all arranged right-to-left.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Difficulty Curve
- Level 1 (Pages 1-4):
  - Fully pointed root-family examples with 2-3 choices.
  - Strong explicit modeling of repeated root letters.
- Level 2 (Pages 5-8):
  - Mixed pointing, 3-4 choices, one semantic distractor.
  - Sentence-context prompts require selecting best family member.
- Level 3 (Pages 9-12):
  - Transfer to less-familiar family member in decodable sentence.
  - Hint sequence: root highlight -> sentence reread -> reduced choices.

## Feedback Design
- Success:
  - Lab station lights up and Alma names the discovered pattern.
  - Reward language stresses pattern noticing, not speed.
- Mistakes:
  - Gentle correction and targeted root highlight.
  - No negative scoring or fail states.
- Encouragement:
  - Praise effort and strategy ("חיפשת את האותיות החוזרות").

## Session Design
- Duration: 11-13 minutes.
- Pages: 12 with 8 required interactions.
- Midpoint stop: page 6, resume bookmark stored.
- Replay value: alternate root families and sentence contexts while preserving structure.

## Story Breakdown
| Page | Story Beat | Interaction ID | Learning Target |
|---|---|---|---|
| 01 | עלמה פותחת מעבדת מילים עם תחנות שורש. | none | Mission setup |
| 02 | תחנה ראשונה: זיהוי אותיות שורש חוזרות. | `spotRootPattern` | Root pattern awareness |
| 03 | מיון מילים לשתי משפחות שורש. | `sortByRoot` | Classification by pattern |
| 04 | בחירת מילה מתאימה למשפט קצר. | `contextFamilyChoice` | Meaning in context |
| 05 | תחנה שנייה מוסיפה משפחה חדשה עם דמיון מטעה. | `contrastFamilies` | Controlled distractor handling |
| 06 | דובי מופיע לרמז קצר וחוזר לתפקיד מנחה. | `strategyHint` | Strategy reinforcement |
| 07 | עלמה בונה משפט עם מילה מאותה משפחה. | `buildSentenceWord` | Application in sentence |
| 08 | בדיקת הבנה מילולית מתוך משפט קרוא. | `literalQuestion` | Literal comprehension |
| 09 | תחנה מתקדמת: מילה חדשה אך שורש מוכר. | `transferWord` | Transfer skill |
| 10 | מציאת ראיה לשורש בתוך משפט ארוך יותר. | `tapEvidence` | Evidence-based reasoning |
| 11 | אתגר סיום עם שתי משפחות קרובות. | `finalFamilyDecision` | Discrimination and meaning |
| 12 | חגיגת מעבדה וסיכום משפחות שורש שלמדנו. | `recapChoice` | Retrieval and confidence |

## Interaction Design
| Interaction ID | Input | Prompt focus | Hint behavior | Success signal |
|---|---|---|---|---|
| `spotRootPattern` | Tap letter set | Identify repeated root letters | Highlight repeated triad after misses | Pattern ring animates |
| `sortByRoot` | Drag/tap-to-bin | Sort words into root families | Bin label color cue + root underline | Lab beaker fills |
| `contextFamilyChoice` | Tap answer chip | Choose context-appropriate family word | Replay sentence with slowed target slot | Correct sentence is narrated |
| `transferWord` | Tap select | Apply known root to unfamiliar word | Present one anchor family example | New station unlocks |
| `finalFamilyDecision` | Tap choice | Distinguish close families by meaning | Remove one semantic foil after retries | Final badge unlock |

## Hebrew Narration Plan
- Tone: empowering, discovery-oriented, child-safe.
- Narration keeps morphology language concrete ("אותיות חוזרות", "משפחה של מילים").
- Key contract: `common.handbooks.almaRootFamilies.*` and parent companion family.

## Illustration and Animation Brief
- Protagonist brief:
  - `characterId`: `alma-word-lab-lead`
  - Personality triad: thoughtful, inventive, warm.
  - Signature prop: root scanner bracelet.
- Visual direction:
  - Bright but low-noise lab spaces with clear sorting surfaces.
  - Word cards should remain high-contrast and legible.
- Motion:
  - Pattern highlights use line traces, not flashing effects.
  - Station unlock animations <=0.9s.

## Video Segment Notes
| Segment | Timing | Purpose | Production note |
|---|---|---|---|
| `micro-intro-word-lab` | 8s page 1 | Introduce root-family concept through story | Use visual motif of grouped word cards |
| `milestone-root-reveal` | 6s page 9 | Reward first successful transfer prompt | Sync with `transferWord.success` clip |

## Audio Requirements
- Required key families:
  - `common.handbooks.almaRootFamilies.meta.*`
  - `common.handbooks.almaRootFamilies.pages.page0X.{narration,cta}`
  - `common.handbooks.almaRootFamilies.interactions.<id>.{prompt,hint,success,retry}`
  - `common.handbooks.almaRootFamilies.readingProgression.level{1,2,3}.*`
  - `common.handbooks.almaRootFamilies.feedback.*`
  - `common.parentDashboard.handbooks.almaRootFamilies.*`
- Audio behavior:
  - Root letters pronounced clearly and consistently in prompts.
  - Replay parity required for all instruction lines.
  - Transition SFX limited to preserve listening focus.

## Parent Visibility
- Dashboard signals:
  - Root-family classification accuracy.
  - Context-fit word selection performance.
  - Transfer prompt success trend.
  - Suggested next practice path (root families or paragraph comprehension refresh).

## Inspiration / References
- Teach Your Monster to Read: structured skill transfer.
- HOMER: scaffolded language progression.
- Khan Academy Kids: positive strategy-based reinforcement.

## Mechanics Calibration (Gaming Expert, 2026-04-10)
- Interaction density:
  - Keep two root families active per run for core path; third family appears only as optional bonus.
  - Introduce one novelty axis per level: repeated-root spotting (L1), semantic contrast (L2), transfer to unfamiliar family member (L3).
- Distractor load:
  - Level 1: 2-3 options.
  - Level 2: max 3 options with one semantic foil.
  - Level 3: max 3 options for transfer prompts; avoid adding extra foil complexity on first transfer attempt.
- Support mode trigger and simplification order:
  - Trigger support after 2 misses or 7 seconds inactivity.
  - Step 1: highlight recurring root letters.
  - Step 2: remove semantic foil.
  - Step 3: replay sentence with slowed target slot.
  - Step 4: show one anchor family example + binary choice retry.
- Exit support after 2 consecutive successful independent selections.

## Reading PM Validation Updates (2026-04-10)
- Pointing policy lock: Level 1 root-family exemplars stay fully pointed; Level 2 mixed-pointing allowed only for previously mastered families; first exposure of transfer words stays fully pointed.
- Sentence complexity caps: context and transfer prompts in mandatory path stay <=7 words with one target slot at a time.
- Anti-image shortcut guardrails:
  - `sortByRoot` bins cannot be pre-color-coded by family; color/family confirmation reveals only after response.
  - `contextFamilyChoice` options use matched neutral scene art so sentence decoding remains the disambiguation source.
  - `transferWord` first attempt is text-only; optional icon support appears only after hint escalation.
- Post-book progression closure: mark Wave 2 reading progression complete when root classification >=75%, context-fit selection >=75%, and transfer >=70% with <=1 hint.

## Review Status
- PM spec draft complete.
- Reading PM progression validation complete (morphology-light transfer constraints and anti-shortcut controls locked).
- Gaming Expert calibration captured; ready for content production and FED execution.
