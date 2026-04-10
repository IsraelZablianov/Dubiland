# Book 7 — Tamar and the Word Tower (Hebrew: תמר ומגדל המילים)

## Learning Objective
- Curriculum area: Reading fluency + sequence comprehension (ages 6-7).
- Measurable outcomes:
  - Child reads short pointed phrases (5-8 words) at >=78% first/second-attempt accuracy.
  - Child answers 3 of 4 literal/sequence questions from decoded text.
  - Child demonstrates reduced prompt replay frequency by final pages.

## Target Age Range
- Primary: 6-7
- Support mode available for late 5-6 readers transitioning into phrase-level text.

## Mechanic
- Story progression through a tower where each floor unlocks after phrase decoding.
- Primary actions: decode phrase strip, order events, pick connector-based meaning, tap supporting text fragment.
- Engine fit: existing handbook runtime with book config (`slug: tamarWordTower`).
- RTL alignment: phrase strips and response chips scan right-to-left.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Difficulty Curve
- Level 1 (Pages 1-4):
  - Mostly pointed phrases, 2-3 options, explicit model read.
- Level 2 (Pages 5-8):
  - 3-4 options, one connector ("ואז", "כי") per checkpoint.
  - Sequence prompts use text-first evidence.
- Level 3 (Pages 9-12):
  - Reduced hint frequency and mixed-pointing bridge tokens.
  - Decode -> comprehension chain appears on same page cluster.

## Feedback Design
- Success:
  - Tower floor lights and a confidence line from Tamar.
  - Keeps cognitive flow by returning control quickly.
- Mistakes:
  - Gentle cue + optional segmented reread.
  - No punishment state; one simplification variable at a time.
- Encouragement:
  - Effort-based praise and cue to "read from text again".

## Session Design
- Duration: 10-12 minutes.
- Pages: 12, 7 mandatory interactions, 1 optional challenge.
- Mid-session stop point: after page 6.
- Replay value: rotates phrase banks and event order scenarios while preserving target skills.

## Story Breakdown
| Page | Story Beat | Interaction ID | Learning Target |
|---|---|---|---|
| 01 | תמר מגיעה למגדל עם מפת קומות מילים. | none | Mission framing |
| 02 | קומה ראשונה נפתחת אחרי קריאת צירוף קצר. | `decodePhraseA` | Pointed phrase decoding |
| 03 | תמר מוצאת שני משפטים דומים וצריכה לבחור נכון. | `chooseExactPhrase` | Precision reading |
| 04 | סיפור קצר מציג מה קרה קודם ומה אחר כך. | `orderEvents` | Sequence from text |
| 05 | קומה שלישית מוסיפה מילת קישור במשפט. | `connectorMeaning` | Connector comprehension |
| 06 | דובי מספק רמז קצר ומפנה שוב לתמר. | `hintedReread` | Strategy reinforcement |
| 07 | תמר בונה משפט מכרטיסי מילים. | `buildPhrase` | Fluency and syntax |
| 08 | שאלה מילולית מבקשת ראיה מתוך משפט. | `tapEvidence` | Text evidence extraction |
| 09 | אתגר בונוס של משפט חצי מנוקד. | `bridgePhrase` | Mixed-pointing transition |
| 10 | שני אירועים דומים מחייבים דיוק קריאה. | `sequencePrecision` | Careful reread |
| 11 | מפתח הקומה האחרונה מופיע אחרי בחירה נכונה. | `literalQuestion` | Literal comprehension |
| 12 | סיום המגדל וסיכום מילים מובילות. | `recapChoice` | Retrieval and confidence |

## Interaction Design
| Interaction ID | Input | Prompt focus | Hint behavior | Success signal |
|---|---|---|---|---|
| `decodePhraseA` | Tap decoded strip | Read short pointed phrase | Slow reread + chunk highlight | Floor unlock animation |
| `orderEvents` | Drag/tap order cards | First/next from decoded line | Temporal marker highlight | Story timeline advances |
| `connectorMeaning` | Tap choice | Infer relation using connector | Highlight connector token in phrase | Correct route appears |
| `buildPhrase` | Drag/tap tiles | Assemble phrase in RTL order | First tile fixed after retries | Full phrase voice playback |
| `tapEvidence` | Tap text fragment then answer | Identify sentence evidence | Underline candidate fragment | Crystal key is awarded |

## Hebrew Narration Plan
- Tone: capable-reader framing with warm support.
- Sentence complexity: 5-8 words with controlled connector use.
- All copy via `common.handbooks.tamarWordTower.*`; no runtime hardcoded text.

## Illustration and Animation Brief
- Protagonist brief:
  - `characterId`: `tamar-word-architect`
  - Personality triad: analytical, confident, collaborative.
  - Signature prop: rotating word compass.
- Visual direction:
  - Tower floors each use one clear motif color.
  - Reduce background detail on `L3` text-checkpoint pages.
- Motion:
  - Unlock animations capped at 0.9s.
  - Evidence highlighting uses calm pulse, not flashing.

## Video Segment Notes
| Segment | Timing | Purpose | Production note |
|---|---|---|---|
| `micro-intro-tower-climb` | 8s page 1 | Establish challenge progression | Keep tower cues directional for RTL flow |
| `milestone-floor-unlock` | 6s page 8 | Reward text-evidence success | Sync with `tapEvidence.success` audio |

## Audio Requirements
- Required key families:
  - `common.handbooks.tamarWordTower.meta.*`
  - `common.handbooks.tamarWordTower.pages.page0X.{narration,cta}`
  - `common.handbooks.tamarWordTower.interactions.<id>.{prompt,hint,success,retry}`
  - `common.handbooks.tamarWordTower.readingProgression.level{1,2,3}.*`
  - `common.handbooks.tamarWordTower.feedback.*`
  - `common.parentDashboard.handbooks.tamarWordTower.*`
- Audio behavior:
  - Phrase prompts maintain clear pacing with slight pauses at connectors.
  - Replay uses exact source clip.
  - Success bursts stay short to preserve reading rhythm.

## Parent Visibility
- Dashboard metrics:
  - Phrase decode accuracy and retry trend.
  - Sequence question performance.
  - Text-evidence usage signals.
  - Recommendation for Book 8 (`saharSecretClock`).

## Inspiration / References
- HOMER: text-first comprehension in narrative context.
- Khan Academy Kids: gentle progress framing.
- Reading Eggs: fluency staircase design.

## Mechanics Calibration (Gaming Expert, 2026-04-10)
- Interaction density:
  - Cap mandatory chain complexity so each loop is one decode action followed by one comprehension action, never both as first-time novelty.
  - `orderEvents` uses max 3 cards in Level 2; 4-card ordering appears only after a successful Level 3 warm-up.
- Distractor load:
  - Level 1: 2-3 options with fully pointed support.
  - Level 2: 3 options with one connector variable per checkpoint.
  - Level 3: max 4 options only on already-practiced prompt type.
- Support mode trigger and simplification order:
  - Trigger support after 2 misses or 7 seconds of inactivity.
  - Step 1: chunked phrase replay.
  - Step 2: temporarily restore full pointing.
  - Step 3: remove one distractor.
  - Step 4: fix first card/tile position and retry.
- Exit support after 2 independent successful checkpoints.

## Reading PM Validation Updates (2026-04-10)
- Pointing policy lock: pages 1-8 remain fully pointed; pages 9-12 may use mixed-pointing only with one familiar unpointed token per phrase in core path.
- Sentence complexity caps: mandatory phrases stay at 4-6 words; 7+ word lines are optional challenge-only and excluded from mastery gating.
- Anti-image shortcut guardrails:
  - `orderEvents` and `connectorMeaning` cannot rely on directional art cues (arrows or scene chronology); sequence/connector evidence must be text-anchored.
  - `tapEvidence` requires text-fragment selection before any supporting animation or object reveal.
  - `bridgePhrase` mastery scoring uses text-first cards with neutral backgrounds.
- Transition gate to Book 8 (`saharSecretClock`): promote when phrase decoding >=78%, connector comprehension >=75%, and replay usage declines over the final three mandatory checkpoints.

## Review Status
- PM spec draft complete.
- Reading PM progression validation complete (phrase load, mixed-pointing guardrails, and transition criteria locked).
- Gaming Expert calibration captured; ready for UX/content sync and implementation.
