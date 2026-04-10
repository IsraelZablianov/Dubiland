# Handbook Hebrew Script + Audio Template (Dubiland)

## Purpose
Reusable content template for every handbook spec so Hebrew copy, i18n keys, and audio production stay aligned from day one.

Use this file when drafting `docs/games/handbooks/book-{N}-{slug}.md` specs.

## Voice Standard (Dubi narrator)
- Character voice: warm, patient, playful, short sentences.
- Default TTS voice: `he-IL-AvriNeural` (single consistent narrator voice for Dubi).
- Pace baseline: natural, slightly slow for ages 3-5.
- Rule: one action per instruction sentence whenever possible.

## Required Spec Sections (Copy Structure)

### 1) Story Header
- Book title (Hebrew)
- Slug (English kebab-case)
- Target age band (`3-4`, `5-6`, `6-7`)
- Main character (not Dubi as primary in every book)
- Learning goals:
  - Language/literacy
  - Numeracy/thinking
  - Social-emotional

### 2) Page-by-Page Story Table
Use this table shape for every page:

| Page | Story beat | Narration (child-facing) | CTA line | Interaction (if any) | Learning target |
|---|---|---|---|---|---|
| 01 | ... | ... | ... | ... | ... |

Copy rules:
- Narration line: 1-2 short sentences.
- CTA line: imperative + clear next action.
- Avoid ambiguous references that are unclear in audio-only playback.

### 3) Interaction Script Pack
For every interaction ID, provide all four lines:
- `prompt`
- `hint`
- `success`
- `retry`

Template:

| Interaction ID | Prompt | Hint | Success | Retry |
|---|---|---|---|---|
| `countSeeds` | ... | ... | ... | ... |

### 4) Feedback Rotation Bank
Add reusable variants for runtime rotation:
- Success bank (at least 5)
- Encouragement bank (at least 5)
- Transition bank (at least 3)

## i18n Key Contract (Canonical)
Use `common.handbooks.<slug>` for handbook copy and `common.parentDashboard.handbooks.<slug>` for parent summaries.

Minimum key families per handbook:
- `common.handbooks.<slug>.meta.{title,subtitle,estimatedDuration}`
- `common.handbooks.<slug>.pages.page0X.{narration,cta}`
- `common.handbooks.<slug>.interactions.<interactionId>.{prompt,hint,success,retry}`
- `common.handbooks.<slug>.readingProgression.level{1,2,3}.*` (for reading-oriented books)
- `common.handbooks.<slug>.feedback.{success,encouragement,retry}.*`
- `common.handbooks.<slug>.transitions.*`
- `common.handbooks.<slug>.completion.*`
- `common.parentDashboard.handbooks.<slug>.{progressSummary,nextStep,readingSignal,confusionFocus}`

Reusable shell keys should stay shared:
- `common.handbooks.library.*`
- `common.handbooks.reader.controls.*`
- `common.handbooks.reader.status.*`

## Audio Script Template (TTS-Compatible)
Store plain text in locale JSON and keep optional speech direction in spec notes.
Do not force SSML XML into locale files.

Per-line audio note template:

| Key | Display text (he) | Spoken override needed? | Speech note |
|---|---|---|---|
| `common.handbooks.<slug>.interactions.<id>.prompt` | ... | `no/yes` | `slow`, `pause-500ms`, `emphasis` |

When spoken text should differ from display text:
- Add override in `packages/web/src/i18n/locales/he/audio-overrides.json`
- Keep key identical to locale key.

## SSML Direction Library (for generation scripts)
Use these labels in docs/specs as shorthand:
- `slow_word_intro`: slower pace for new word introduction.
- `step_pause`: pause ~500ms between instruction steps.
- `celebration_pitch`: slight pitch-up for praise.
- `counting_cadence`: short pauses between numbers.

Example instruction note:
- Text: `עכשיו נקשיב לצליל הראשון.`
- Speech note: `slow_word_intro + step_pause`

## Literacy Complexity Guardrails (Reading PM Alignment)
- Ages 3-4: concrete vocabulary, 2-choice max, no multi-clause instruction lines.
- Ages 5-6: short 2-step prompts, introduce pointed words and basic decoding cues.
- Ages 6-7: phrase-level decoding + literal comprehension prompts, reduced hint density.
- Reading checkpoints must be text-first and not solvable only from picture clues.

## Audio Parity Checklist (Definition of Done)
For each handbook pack before handoff:
1. All child-facing keys exist in `packages/web/src/i18n/locales/he/common.json`.
2. Placeholder-heavy spoken lines have explicit entries in `audio-overrides.json`.
3. `yarn generate-audio` completes successfully.
4. Every new key is present in `packages/web/public/audio/he/manifest.json`.
5. Every manifest path has an existing `.mp3` file.
6. Parent dashboard handbook keys are included and verified.

## Copy Quality Checklist
- Hebrew grammar correct.
- Child-friendly (ages 3-7), spoken register, not formal writing register.
- Positive framing (`what to do`, not `what not to do`).
- No hardcoded UI strings outside i18n keys.
- Every user-facing line has an audio plan.
