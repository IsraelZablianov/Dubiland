# Handbook Quality Gate — Age Depth + Instruction Clarity ([DUB-551](/DUB/issues/DUB-551))

## Scope
- Applies to the first live handbook stream and linked remediation lanes:
  - bug lane [DUB-482](/DUB/issues/DUB-482)
  - UX lane [DUB-483](/DUB/issues/DUB-483)
  - audio/instruction cleanup lane [DUB-494](/DUB/issues/DUB-494)
- Quality focus: age-depth rigor (`3-4`, `5-6`, `6-7`) + child instruction clarity.

## Pass/Fail Criteria by Age Band
| Age band | Pass criteria | Fail triggers |
|---|---|---|
| `3-4` | Word-first reinforcement surface, no mandatory decoding gate, default child prompt is one action line and replayable (`▶`). | Child must decode sentence-level text to proceed, or action prompt is multi-step/verbose. |
| `5-6` | Fully pointed target words at mandatory checkpoints, one clear action per prompt, decode task tied to story progress. | Unpointed first-exposure target token in scored checkpoint, or prompt requires parsing long narration to act. |
| `6-7` | At least one text-evidence checkpoint (tap/select evidence from sentence), with mixed-pointing only on previously mastered tokens. | Checkpoint is solvable by image-only shortcut, or evidence prompt lacks explicit textual anchor. |

## Instruction Clarity Verification (2026-04-10)
- Ran handbook i18n audit against `packages/web/src/i18n/locales/he/common.json` for `games.interactiveHandbook.handbooks.*` prompt/cta/instruction keys.
- Result: `40` prompt/cta lines, longest line = `8` words (meets short action-oriented baseline for handbook prompts).
- Risk slice still open under [DUB-494](/DUB/issues/DUB-494): punctuation-heavy hint/narration lines that can degrade Hebrew TTS pacing. Highest-priority lines to normalize:
  - `games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.collectSeeds.hint`
  - `games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.solveAddition.hint`
  - `games.interactiveHandbook.handbooks.magicLetterMap.interactions.simpleAdd.hint`
  - `games.interactiveHandbook.handbooks.magicLetterMap.interactions.decodePointedWord.praiseVariants.v2`

## Reconciliation Status ([DUB-482](/DUB/issues/DUB-482) + [DUB-483](/DUB/issues/DUB-483))
- Rendering/question coherence implementation lane [DUB-485](/DUB/issues/DUB-485): `done`.
- Word-first hierarchy lane [DUB-491](/DUB/issues/DUB-491): `done`.
- QA consolidation lane [DUB-487](/DUB/issues/DUB-487): `blocked` pending regression fix issue [DUB-542](/DUB/issues/DUB-542).

## Owner + ETA + Blocker Map (as of 2026-04-10)
| Lane | Owner | Status | ETA | Blocker |
|---|---|---|---|---|
| [DUB-542](/DUB/issues/DUB-542) | FED Engineer 2 | `todo` | ETA not yet posted (required next checkpoint) | Regression script fails (`interactive-handbook-runtime-regression.test.mjs`). |
| [DUB-487](/DUB/issues/DUB-487) | QA Engineer 2 | `blocked` | Next QA rerun immediately after [DUB-542](/DUB/issues/DUB-542) lands | Cannot sign off until regression suite passes 100%. |
| [DUB-488](/DUB/issues/DUB-488) | Architect | `blocked` | Close after [DUB-487](/DUB/issues/DUB-487) pass matrix is posted | Parent closure depends on QA evidence. |
| [DUB-494](/DUB/issues/DUB-494) | Content Writer | `in_progress` | ETA not yet posted (required next checkpoint) | Handbook TTS punctuation normalization checkpoint not yet published. |

## Gate Decision
- Age-depth definition quality: **PASS** (criteria are explicit and measurable across `3-4`, `5-6`, `6-7`).
- Handbook prompt brevity: **PASS** (current prompt corpus within short-form threshold).
- Live readiness for handbook word-visibility/question-coherence stream: **CONDITIONAL FAIL** until [DUB-542](/DUB/issues/DUB-542) + [DUB-487](/DUB/issues/DUB-487) close and [DUB-494](/DUB/issues/DUB-494) posts handbook punctuation cleanup evidence.
