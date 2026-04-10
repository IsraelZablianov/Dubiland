# Book 4 — Yoav and the Letter Map (Hebrew: יואב ומפת האותיות)

## Learning Objective
- Curriculum area: Reading (קריאה), letters + nikud decoding for ages 5-6.
- Measurable outcomes:
  - Child decodes fully pointed CV syllables (for example: בָּ, מִי, סֶפ) at >=80% accuracy within one hint-assisted retry.
  - Child identifies first sound to letter mapping in 4 of 5 interaction checkpoints.
  - Child completes one literal comprehension check from decoded text without picture-only guessing.

## Target Age Range
- Primary: 5-6
- Stretch: early 7 with reduced hint density and faster transitions.

## Mechanic
- Story-first handbook with inline reading checkpoints (`L0`/`L1`/`L2`/`L3` templates).
- Primary child actions: tap letter choice, drag syllable tiles, choose decoded word, tap text evidence.
- Runtime fit: single handbook runtime component + one handbook DB row (`slug: yoavLetterMap`) with page JSON.
- RTL constraints: page progression right-to-left, cue arrows and gesture affordances mirrored for Hebrew reading flow.

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` play icon (44px+) that replays the same instruction audio.
- Child gameplay controls are icon-first: replay (`▶`), retry (`↻`), hint (`💡`), with audio cues.
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered; do not design separate `check`/`test` buttons.

## Difficulty Curve
- Level 1 (Pages 1-3):
  - 2 choices, high-contrast letters, explicit narrator modeling.
  - Full pointing on all target tokens.
- Level 2 (Pages 4-7):
  - 3 choices, one confusable distractor pair per checkpoint.
  - Child blends CV/CVC tiles with guided segmentation audio.
- Level 3 (Pages 8-10):
  - Decode short pointed phrase, then answer one literal question from text.
  - Auto-hint delayed to 8 seconds; support mode activates after 2 misses.

## Feedback Design
- Success:
  - Immediate object animation + short praise cue focused on strategy ("קראת את הצלילים מצוין").
  - Story resumes within 900ms.
- Mistake handling:
  - Gentle retry language only; no negative buzzers or red-X states.
  - Simplification sequence: fewer options -> highlighted grapheme -> slower modeled audio.
- Encouragement:
  - Replay instruction on inactivity (6s), keep one clear next action visible.

## Session Design
- Duration: 8-10 minutes.
- Pages: 10 total, 5 required interaction pages + 1 optional replay checkpoint.
- Natural stop point: after page 5 (bookmark saved automatically).
- Replay value: rotates confusable letter sets while preserving same learning goals.

## Story Breakdown
| Page | Story Beat | Interaction ID | Learning Target |
|---|---|---|---|
| 01 | יואב מוצא מפה קסומה בפארק השכונתי. | none | Story context + vocabulary setup |
| 02 | המפה נדלקת רק כששומעים צליל פותח נכון. | `pickFirstSoundLetter` | First-sound to letter match |
| 03 | שביל אבנים מציג זוגות אות+ניקוד. | `matchPointedSyllable` | CV decoding |
| 04 | יואב מגיע לצומת עם שלושה שלטים. | `chooseDecodedSign` | Pointed word identification |
| 05 | המפה נשברת לחלקים שצריך לסדר. | `orderSyllableTiles` | Syllable blending sequence |
| 06 | דובי נותן רמז קולי קצר וחוזר לרקע. | `confusablePairCheck` | ב/כ or ד/ר contrast |
| 07 | יואב קורא הוראה קצרה כדי לפתוח שער. | `readPhraseGate` | Short pointed phrase reading |
| 08 | מופיע רמז זמן: "עכשיו", "אחר כך". | `sequenceFromText` | Text-based sequencing |
| 09 | האוצר בפארק נפתח עם מילה מנוקדת אחרונה. | `finalDecode` | Consolidated decoding |
| 10 | יואב חוגג ומסכם את מילות המפתח שלמדנו. | `recapChoice` | Retrieval + confidence closure |

## Interaction Design
| Interaction ID | Input | Prompt focus | Hint behavior | Success signal |
|---|---|---|---|---|
| `pickFirstSoundLetter` | Tap choice | Match heard first sound to grapheme | Replay phoneme slowly + pulse target group | Path glows and map fragment appears |
| `matchPointedSyllable` | Tap choice | Select correct pointed CV form | Remove one foil after 2 misses | Stone path animates forward |
| `orderSyllableTiles` | Drag or tap-to-place | Blend two syllables into decodable word | Ghost slot order overlay | Word card lights and narrated blend plays |
| `readPhraseGate` | Tap sentence then continue | Decode short phrase before gate opens | Syllable segmentation dots | Gate opens with concise celebration |
| `sequenceFromText` | Tap order chips | Determine what happened first/next from phrase | Highlight temporal marker in text | Timeline advances to next page |

## Hebrew Narration Plan
- Voice: warm, patient, conversational; one action sentence per instruction line.
- Narration rhythm:
  - Pages 1-3: short modeled reading lines with slower pace.
  - Pages 4-7: mixed narration + child action prompts.
  - Pages 8-10: text-evidence prompts with controlled pause before hints.
- Copy contract: all lines delivered through i18n keys under `common.handbooks.yoavLetterMap.*`.

## Illustration and Animation Brief
- Protagonist brief:
  - `characterId`: `yoav-map-runner`
  - Personality triad: curious, steady, brave.
  - Signature prop: foldable glowing map.
- Visual direction:
  - Urban park landmarks recognizable to Israeli children (playground, citrus trees, neighborhood path signs).
  - High-contrast letter cards in safe interaction zone (`Z5`).
- Animation:
  - Light parallax on map layers.
  - Success burst <=0.9s, then calm idle.
  - דובי cameo limited to one hint beat (page 6).

## Video Segment Notes
| Segment | Timing | Purpose | Production note |
|---|---|---|---|
| `micro-intro-map-awakens` | 7s on page 1 | Establish mission and emotional hook | Keep map glow centered; avoid text in art |
| `milestone-gate-open` | 6s on page 7 | Reward first full phrase decode | Sync gate opening with success audio key |

## Audio Requirements
- Required key families:
  - `common.handbooks.yoavLetterMap.meta.*`
  - `common.handbooks.yoavLetterMap.pages.page0X.{narration,cta}`
  - `common.handbooks.yoavLetterMap.interactions.<id>.{prompt,hint,success,retry}`
  - `common.handbooks.yoavLetterMap.readingProgression.level{1,2,3}.*`
  - `common.handbooks.yoavLetterMap.feedback.*`
  - `common.parentDashboard.handbooks.yoavLetterMap.*`
- Audio behavior:
  - `▶` always replays exact last prompt clip.
  - Narration ducks music by at least 6dB.
  - Interaction response clips <=900ms before story resume.

## Parent Visibility
- Dashboard signals:
  - CV decoding accuracy trend.
  - Confusable pair heatmap (for example ב/כ, ד/ר).
  - Hint-rate trend and support-mode triggers.
  - Ready/not-ready recommendation for Book 5 (`naamaSyllableBox`).

## Inspiration / References
- HOMER: story-integrated decoding checkpoints.
- Teach Your Monster to Read: explicit phonics progression and replay loops.
- Khan Academy Kids: gentle character-led correction style.

## Mechanics Calibration (Gaming Expert, 2026-04-10)
- Interaction density:
  - Keep one interaction checkpoint per page; avoid chaining decode and comprehension in the same action.
  - `readPhraseGate` phrase length cap: 2-3 words in Level 3.
- Distractor load:
  - Level 1: 2 options, no confusable foil.
  - Levels 2-3: max 3 options with one active confusable pair per checkpoint.
- Support mode trigger and simplification order:
  - Trigger support after 2 incorrect attempts or 6 seconds of inactivity after replay.
  - Step 1: replay prompt + pulse first grapheme.
  - Step 2: remove one foil.
  - Step 3: highlight grapheme sequence + slowed model audio.
  - Step 4: reduce to binary choice and retry same checkpoint.
- Exit support only after 2 consecutive first-attempt successes.

## Reading PM Validation Updates (2026-04-10)
- Pointing policy lock: child-evaluated tokens stay fully pointed on pages 1-9; page 10 may include one familiar partially pointed token only in optional stretch mode.
- Sentence complexity caps: Level 1 uses single words or 2-word strips, Level 2 uses max 2 words per prompt, and Level 3 `readPhraseGate` is capped at 2-3 words.
- Anti-image shortcut guardrails:
  - `chooseDecodedSign` and `sequenceFromText` must use same-category neutral visual cards so answer selection is text-dependent.
  - `finalDecode` mastery scoring must use text-only choice cards (no answer-disambiguating image support).
  - Any object animation reveal must play only after a correct text action is submitted.
- Transition gate to Book 5 (`naamaSyllableBox`): promote when CV/CVC decoding >=80%, confusable-pair accuracy >=75%, and support-mode trigger rate <=35% across the last three mandatory checkpoints.

## Review Status
- PM spec draft complete.
- Reading PM progression validation complete (pointing policy, image-shortcut controls, and transition gate locked).
- Mechanics calibration captured from Gaming Expert; ready for Content Writer sync and FED implementation.
