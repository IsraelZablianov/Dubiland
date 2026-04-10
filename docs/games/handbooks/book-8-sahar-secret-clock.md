# Book 8 — Sahar and the Secret Clock (Hebrew: סהר והשעון הסודי)

## Learning Objective
- Curriculum area: Reading fluency bridge to partially pointed text + time-based comprehension.
- Measurable outcomes:
  - Child decodes mixed-pointing phrases at >=75% first/second-attempt accuracy.
  - Child solves 3/4 time-marker comprehension prompts based on text evidence.
  - Child uses hints strategically (manual hints <=35% of interactions).

## Target Age Range
- Primary: 6-7
- Support path for strong 5-6 readers with increased pointing and simplified choices.

## Mechanic
- Mystery narrative around a clock that reveals clues only after accurate reading.
- Primary actions: decode phrase, match event to time marker, choose cause/effect pair, tap sentence evidence.
- Engine fit: handbook content configuration (`slug: saharSecretClock`) on existing runtime.
- RTL requirements: timeline chips and clue flow ordered right-to-left.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Difficulty Curve
- Level 1 (Pages 1-4):
  - Mostly pointed text, 3 options, strong narration support.
- Level 2 (Pages 5-8):
  - Mixed-pointing tokens and one temporal marker per prompt ("לפני", "אחר כך").
- Level 3 (Pages 9-12):
  - Decode + cause/effect comprehension chain with reduced automatic hints.
  - If 2 misses occur, temporary support mode reverts to fully pointed prompt.

## Feedback Design
- Success:
  - Clock gear aligns and clue card unlocks.
  - Positive cue praises careful reading strategy.
- Mistakes:
  - Calm retry language plus optional temporal marker highlight.
  - No penalties, no reset to menu.
- Encouragement:
  - Inactivity triggers prompt replay and single target pulse.

## Session Design
- Duration: 10-12 minutes.
- Pages: 12 with 7 required interactions.
- Natural stop: after page 6 (midpoint card).
- Replay: rotates clue text sets and time-marker pairings.

## Story Breakdown
| Page | Story Beat | Interaction ID | Learning Target |
|---|---|---|---|
| 01 | סהר מגלה שעון עתיק במגדל העיר. | none | Setting and mission setup |
| 02 | רמז ראשון נחשף כשקוראים צירוף מנוקד. | `decodeClue` | Pointed phrase decoding |
| 03 | השעון מציג שתי אפשרויות זמן בטקסט. | `matchTimeMarker` | Temporal language mapping |
| 04 | סהר עוקב אחרי אירוע ראשון מתוך משפט. | `firstNextCheck` | Sequence comprehension |
| 05 | הרמז הבא חצי מנוקד ודורש דיוק. | `mixedPointingRead` | Bridge text decoding |
| 06 | דובי נותן דוגמת אסטרטגיה קצרה. | `strategyReplay` | Reread strategy support |
| 07 | צריך לבחור סיבה/תוצאה לפי הטקסט. | `causeEffectChoice` | Text-based reasoning |
| 08 | סהר מסדר שלושה אירועים לפי שעון הסיפור. | `timelineOrder` | Ordered comprehension |
| 09 | רמז מתקדם משלב שתי מילות זמן. | `dualTimePrompt` | Multi-marker interpretation |
| 10 | בחירת ראיה מתוך משפט פותחת תא סודי. | `tapEvidence` | Evidence extraction |
| 11 | חידת סיום: מה קרה ומתי? | `literalQuestion` | Consolidated comprehension |
| 12 | סיכום מסע ושעון זוהר עם מילות מפתח. | `recapChoice` | Retrieval and closure |

## Interaction Design
| Interaction ID | Input | Prompt focus | Hint behavior | Success signal |
|---|---|---|---|---|
| `decodeClue` | Tap phrase strip | Decode clue phrase | Syllable pacing replay | Gear rotates and reveals clue |
| `matchTimeMarker` | Tap choice | Link phrase to time marker | Highlight marker token | Clock hand moves to correct slot |
| `mixedPointingRead` | Tap/select | Decode partially pointed phrase | Temporarily restore pointing after misses | Secret compartment opens |
| `causeEffectChoice` | Tap answer chip | Choose cause/effect from text | Underline causal word | Route line illuminates |
| `tapEvidence` | Tap sentence fragment | Find supporting text evidence | Candidate fragments pulse in order | Final clue key appears |

## Hebrew Narration Plan
- Spoken style: calm mystery tone, still child-directed and clear.
- Time marker vocabulary repeated in multiple pages with mild variation.
- i18n families under `common.handbooks.saharSecretClock.*`.

## Illustration and Animation Brief
- Protagonist brief:
  - `characterId`: `sahar-clock-detective`
  - Personality triad: observant, patient, inventive.
  - Signature prop: pocket lens that projects clue text.
- Visual direction:
  - Old city clock textures with clear low-noise interaction zones.
  - Distinct visual token for time markers.
- Motion:
  - Clock-hand movement guides attention, never distracts.
  - Keep background animation subtle on text-heavy pages.

## Video Segment Notes
| Segment | Timing | Purpose | Production note |
|---|---|---|---|
| `micro-intro-clock-tower` | 8s page 1 | Atmosphere and quest hook | Reserve center for later interaction overlays |
| `interaction-demo-time-clue` | 5s page 3 | Teach time-marker mechanic | Focus camera on text + clock hand relation |

## Audio Requirements
- Required key families:
  - `common.handbooks.saharSecretClock.meta.*`
  - `common.handbooks.saharSecretClock.pages.page0X.{narration,cta}`
  - `common.handbooks.saharSecretClock.interactions.<id>.{prompt,hint,success,retry}`
  - `common.handbooks.saharSecretClock.readingProgression.level{1,2,3}.*`
  - `common.handbooks.saharSecretClock.feedback.*`
  - `common.parentDashboard.handbooks.saharSecretClock.*`
- Audio behavior:
  - Clear articulation for temporal markers.
  - Replay clip parity required.
  - Transition cues <1.0s.

## Parent Visibility
- Dashboard tracks:
  - Mixed-pointing decode success rate.
  - Time-marker comprehension accuracy.
  - Hint usage and support-mode episodes.
  - Readiness signal for Book 9 (`guyClassNewspaper`).

## Inspiration / References
- Khan Academy Kids: narrative puzzle pacing.
- HOMER: decode + comprehension coupling.
- Lingokids: themed world framing with short loops.

## Mechanics Calibration (Gaming Expert, 2026-04-10)
- Interaction density:
  - Introduce one new variable at a time: temporal-marker mapping first, mixed-pointing bridge second, cause/effect chain third.
  - `dualTimePrompt` unlocks only after one successful single-marker checkpoint in the same run.
- Distractor load:
  - Level 1: 3 options with strong narration support.
  - Level 2: 3 options, one temporal foil only.
  - Level 3: cause/effect prompts start at 2 options before scaling to 3.
- Support mode trigger and simplification order:
  - Trigger support after 2 misses or 7 seconds inactivity.
  - Step 1: replay with temporal marker highlight.
  - Step 2: temporarily restore full pointing on current phrase.
  - Step 3: remove one distractor.
  - Step 4: revert to single-marker prompt for the retry cycle.
- Exit support after 2 consecutive first-attempt successes.

## Reading PM Validation Updates (2026-04-10)
- Pointing policy lock: Levels 1-2 keep full pointing except for previously mastered high-frequency bridge tokens; support mode always restores full pointing on current prompt.
- Sentence complexity caps: Level 1 prompts stay <=5 words, Level 2 <=6 words, Level 3 <=7 words in mandatory path.
- Anti-image shortcut guardrails:
  - `matchTimeMarker` keeps clock-face visuals constant across options so "before/after" must be resolved from text.
  - `timelineOrder` uses neutral event thumbnails until the correct text-driven order is selected.
  - `causeEffectChoice` must avoid causal arrows/icons that reveal answer before decoding.
- Transition gate to Book 9 (`guyClassNewspaper`): promote when mixed-pointing accuracy >=75%, time-marker comprehension >=75%, and support-mode activations are <=30% in the final session segment.

## Review Status
- PM spec draft complete.
- Reading PM progression validation complete (mixed-pointing bridge constraints and anti-shortcut controls applied).
- Gaming Expert calibration captured; ready for Content Writer/FED execution sync.
