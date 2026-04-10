# First Handbook — דובי והתרמיל האבוד

## Goal
Deliver a Hebrew-first storybook package for the first Dubiland interactive handbook with page narration, inline interaction copy, and integration-ready i18n/audio keys.

## Learning Objectives
- Numeracy: count concrete objects up to 5 (`countFish`, `choosePath`).
- Language/literacy: letter-sound recognition for ד, and early CVC-style word assembly (`chooseLetter`, `buildWord`).
- Thinking skills: color classification and simple additive reasoning (`chooseColor`, `solveMath`).

## Reading PM Alignment (DUB-327)
Applied the literacy progression exactly as requested in `docs/games/handbook-literacy-interaction-framework.md`.

| Level | Requirement | Implemented in first handbook keys |
|---|---|---|
| Level 1 | Fully pointed single-word decoding | `common.handbooks.firstAdventure.interactions.decodePointedWord.*` + `readingProgression.level1.*` |
| Level 2 | Fully pointed short-phrase decoding | `common.handbooks.firstAdventure.interactions.decodePointedPhrase.*` + `readingProgression.level2.*` |
| Level 3 | Partially pointed bridge text + literal comprehension | `common.handbooks.firstAdventure.interactions.decodeBridgePhrase.*`, `literalComprehension.*`, `readingProgression.level3.*` |

Guardrail applied: reading checkpoints are text-first; the comprehension prompt explicitly instructs solving from the sentence and not from the image.

## Age Progression Alignment (3–7)
| Age band | Interaction mode | Scaffolding |
|---|---|---|
| 3-4 | 2-choice taps, replay-heavy narration | Immediate hints after short delay, slower cadence |
| 4-5 | 3-choice taps, guided counting and color/letter prompts | Hint after first miss, repeat key phrase once |
| 5-6 | 3-4 choices with lighter hints | Prompt once, then strategic hint |
| 6-7 | Faster transitions, reduced hint frequency | Encourage independent solve before replay |

## Story Arc (10 Pages)
| Page | Story beat | Narration key | CTA key | Embedded interaction |
|---|---|---|---|---|
| 1 | Dubi starts a morning walk with a blue backpack | `common.handbooks.firstAdventure.pages.page01.narration` | `common.handbooks.firstAdventure.pages.page01.cta` | None |
| 2 | Wind blows the backpack near the pond | `...page02.narration` | `...page02.cta` | None |
| 3 | Goldfish hold the first clue | `...page03.narration` | `...page03.cta` | `countFish` |
| 4 | Colorful flower garden clue | `...page04.narration` | `...page04.cta` | `chooseColor` |
| 5 | Forest gate with big Hebrew letter | `...page05.narration` | `...page05.cta` | `chooseLetter` |
| 6 | Apple-tree mini equation | `...page06.narration` | `...page06.cta` | `solveMath` |
| 7 | Word chest in a small cave | `...page07.narration` | `...page07.cta` | `buildWord` |
| 8 | Glowing hill with path decision | `...page08.narration` | `...page08.cta` | `choosePath` |
| 9 | Backpack is spotted on a low branch | `...page09.narration` | `...page09.cta` | `retrieveBackpack` |
| 10 | Celebration + closure | `...page10.narration` | `...page10.cta` | Completion state |

## Interaction Script Pack
All interaction lines are now in `common.handbooks.firstAdventure.interactions.*`.

| Interaction | Prompt | Hint | Success | Retry |
|---|---|---|---|---|
| `countFish` | Count fish aloud and pick the number | Count together to 4 | Praise for correct count | Gentle retry |
| `chooseColor` | Pick the red flower | Focus on color only | Confirm color choice | Gentle retry |
| `chooseLetter` | Pick letter ד for "דובי" | Emphasize first sound | Gate opens feedback | Gentle retry |
| `solveMath` | Solve 3 + 2 | Count forward scaffold | Confirm result 5 | Gentle retry |
| `buildWord` | Build "דג" from letters | Order cue (`ד` then `ג`) | Word-build praise | Gentle retry |
| `choosePath` | Pick path with 3 stars | Count stars hint | Correct path feedback | Gentle retry |
| `retrieveBackpack` | Tap Dubi's backpack | Visual cue (blue backpack) | Recovery celebration | Gentle retry |
| `decodePointedWord` | Read fully pointed word (`דָּג`) | Sound-by-sound blend | Decoding praise | Gentle retry |
| `decodePointedPhrase` | Read fully pointed phrase (`דּוּבִי מָצָא דָּג`) | Word-by-word cue | Phrase-reading praise | Gentle retry |
| `decodeBridgePhrase` | Read partially pointed bridge phrase | Pointed-word anchor hint | Bridge-reading praise | Gentle retry |
| `literalComprehension` | Answer from read text ("מה דובי מצא בסוף?") | Explicit text-first hint | Text-based comprehension praise | Gentle retry |

## Reader Shell Keys
Reusable reader-shell copy is in:
- `common.handbooks.library.*`
- `common.handbooks.reader.controls.*`
- `common.handbooks.reader.status.*`

These keys cover handbook catalog labels, narration controls, and interaction-pause status text.

## Completion + Parent Summary Keys
- Child completion lines: `common.handbooks.firstAdventure.completion.*`
- Parent-facing summary lines: `common.parentDashboard.handbooks.firstAdventure.*` (including `readingSignal`, `confusionFocus`)

## Audio Coverage
- `yarn generate-audio` now generates handbook narration and interaction clips from `common.handbooks.*`.
- Output base for this package: `packages/web/public/audio/he/handbooks/`
- Manifest source of truth: `packages/web/public/audio/he/manifest.json`

## Tone and Curriculum Notes
- Voice is warm, short-sentence, and instruction-first for ages 3-7.
- Copy avoids formal register and keeps one action per sentence in interaction moments.
- Positive framing is used throughout (`ננסה שוב יחד`, `כל הכבוד`) to match Dubi's supportive persona.
