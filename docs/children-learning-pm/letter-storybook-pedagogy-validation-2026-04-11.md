# Letter Storybook Pedagogy Validation (DUB-652)

Validation target: [DUB-647](/DUB/issues/DUB-647) "Learn the Letters" storybook program, to guide the spec owner lane [DUB-651](/DUB/issues/DUB-651).

## Decision
- Pedagogy direction is viable for ages 3-7 if sequencing stays developmental (not pure alphabetical), confusion-pair load is delayed, and sentence complexity is age-banded.
- Status: approved with required constraints below.

## Must-Have Guidance (Required For Spec Sign-Off)

### 1) Letter sequence must follow developmental load, not strict א-ת page order
- Use staged release with spaced review:
  - Stage A (ages 3-4, first exposure): `מ, נ, ל, ס, פ, ר, ב, ג, ד, ז`
  - Stage B (ages 5-6, core expansion): `ש, ק, ח, צ, ט, ת, ה, י`
  - Stage C (ages 6-7, late/contrast-focused): `א, ע, כ, ו`
- Show all 22 letters in the full book, but gate interactivity by stage readiness.
- Keep the `60/30/10` session ratio in story loops:
  - `60%` known letters
  - `30%` recent review letters
  - `10%` truly new letters

### 2) Confusable letters must be a dedicated late layer
- Do not introduce confusable-pair evaluation in first-exposure pages.
- Confusable training starts only after both letters in a pair were already introduced in isolation.
- Use this pair order:
  1. `ד/ר`
  2. `ב/כ`
  3. `ו/ז`
  4. `י/ו`
  5. `ט/ת`
  6. `ק/כ`
  7. `א/ע`
- Required remediation loop for each pair:
  1. isolated A/B contrast
  2. anchor-word contrast
  3. transfer check with neutral decoy

### 3) Sentence complexity must be age-banded and measurable

| Age band | Story line target | Prompt target | Text rules |
|---|---|---|---|
| 3-4 | 2-4 words, one short clause | one action only | narration-led, no independent decoding requirement |
| 5-6 | 3-6 words, one clause | literal question from one decoded line | fully pointed target words in scored checks |
| 6-7 | 5-8 words with one connector (late pages can reach 7-10 words, max two short clauses) | literal + sequence/evidence prompt | decode-first flow before any picture-supported answer |

- Guardrail: never raise sentence complexity and confusable load in the same page cluster.

### 4) Final forms policy must stay contextual
- Final forms (`ך, ם, ן, ף, ץ`) should appear only as word-ending concept pages, not isolated symbol drill pages.
- Unlock final-form pages only after base letters (`כ, מ, נ, פ, צ`) have stable recognition.

### 5) Audio-first and pre-literate UX are non-negotiable
- Every child-facing line requires adjacent `▶` replay icon (44px+).
- Child controls stay icon-first (`▶`, `↻`, `💡`) with audio cues.
- Feedback must be action-triggered; no separate check/test buttons.
- All story and prompt copy must be i18n-keyed with audio pairings.

### 6) Parent visibility must report learning, not only completion
- Required metrics for dashboard:
  - accuracy by letter cluster
  - confusion-pair error trend
  - hint reliance trend
  - age-band sentence-comprehension success
- Next-step recommendation should point to follow-up games by detected gap (for example `letter-sound-match`, `confusable-letter-contrast`).

## Nice-To-Have Guidance (Add If Scope Allows)
- Narrative arc split into three mini-quests (one per stage) so children feel progress without overload.
- One recap spread after every 3 new letters ("stop and celebrate" beat).
- Optional co-play cards for parents ("Try this object hunt at home with today's letter").
- Cultural anchors per stage (Israeli daily life objects/places) to improve familiarity and transfer.
- Reward design: short sticker/collectible beats after mastery clusters, not after every tap.

## Reference Baseline Used
- `docs/games/hebrew-letters-video-pedagogy.md`
- `docs/games/confusable-letter-contrast.md`
- `docs/games/final-forms-video-pedagogy.md`
- `docs/games/handbooks/hebrew-reading-ladder-10-books.md`
- `docs/games/decodable-micro-stories-age-band-scaling.md`
