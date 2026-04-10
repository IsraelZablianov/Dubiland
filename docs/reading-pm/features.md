# Reading PM — Feature List

Track all reading games and features across their lifecycle.

## Curriculum Coverage

| Reading Skill Area | Games Planned | Games In Progress | Games Shipped |
|---|---|---|---|
| Letter Recognition | 0 | 1 | 4 |
| Nikud (Vowel Diacritics) | 0 | 1 | 2 |
| Syllable Decoding | 0 | 1 | 2 |
| Word Reading | 0 | 1 | 2 |
| Word Building | 0 | 0 | 1 |
| Sight Words / High Frequency | 0 | 0 | 1 |
| Phrase & Sentence Reading | 0 | 2 | 2 |
| Reading Comprehension | 0 | 2 | 2 |
| Morphology (Light) | 0 | 0 | 1 |
| Decodable Stories | 0 | 2 | 2 |
| Educational Videos | 0 | 1 | 1 |

## Features

### Letter Tracing Trail
- **Status:** Delegated to FED Engineer (Shipped)
- **Spec:** `docs/games/letter-tracing-trail.md`
- **Reading Skill:** Letter Recognition
- **Curriculum Position:** Early letter-form and motor-pattern stage, before fluent letter-sound discrimination.
- **Delegated Issue:** [DUB-30](/DUB/issues/DUB-30) (implementation, done); maintenance lane [DUB-128](/DUB/issues/DUB-128) (done)

### Letter Sound Match
- **Status:** Delegated to QA Engineer (Shipped)
- **Spec:** `docs/games/letter-sound-match.md`
- **Reading Skill:** Letter Recognition
- **Curriculum Position:** After letter-form familiarity (`letter-tracing-trail`), before syllable decoding.
- **Delegated Issue:** [DUB-31](/DUB/issues/DUB-31) (implementation, done); [DUB-103](/DUB/issues/DUB-103) (QA validation, done)

### Picture to Word Builder
- **Status:** Delegated to FED Engineer 2 (Shipped)
- **Spec:** `docs/games/picture-to-word-builder.md`
- **Reading Skill:** Word Reading, Word Building
- **Curriculum Position:** After core letter-sound mapping, before phrase-level fluency.
- **Delegated Issue:** [DUB-32](/DUB/issues/DUB-32) (implementation, done); maintenance lane [DUB-127](/DUB/issues/DUB-127) (done)

### Letter Sky Catcher
- **Status:** Delegated to FED Engineer 3 + Content Writer (Shipped)
- **Spec:** `docs/games/letter-sky-catcher.md`
- **Reading Skill:** Letter Recognition (fluency + confusable contrast practice)
- **Curriculum Position:** Spiral-review game after tracing + letter-sound match, before syllable decoding.
- **Delegated Issue:** [DUB-312](/DUB/issues/DUB-312) (implementation, done), [DUB-321](/DUB/issues/DUB-321) (content/audio, done), [DUB-322](/DUB/issues/DUB-322) (mechanics review, done)

### Confusable Letter Contrast
- **Status:** Delegated to FED Engineer 2 + Content Writer + Gaming Expert (Shipped)
- **Spec:** `docs/games/confusable-letter-contrast.md`
- **Reading Skill:** Letter Recognition (explicit confusable-letter discrimination + letter-sound binding transfer)
- **Curriculum Position:** After letter-form familiarity and letter-sound mapping, before syllable decoding and pointed word transfer.
- **Delegated Issue:** [DUB-406](/DUB/issues/DUB-406) (implementation, done), [DUB-407](/DUB/issues/DUB-407) (Hebrew i18n/audio, done), [DUB-408](/DUB/issues/DUB-408) (mechanics review, done)

### Sofit Word-End Detective
- **Status:** Delegated to FED Engineer 3 + Content Writer + Gaming Expert (In Progress)
- **Spec:** `docs/games/sofit-word-end-detective.md`
- **Reading Skill:** Letter Recognition (final forms), Word Reading transfer
- **Curriculum Position:** After basic letter-sound and early word decoding, before phrase/stories fluency where final forms appear at scale.
- **Delegated Issue:** [DUB-409](/DUB/issues/DUB-409) (implementation, backlog), [DUB-410](/DUB/issues/DUB-410) (Hebrew i18n/audio, backlog), [DUB-411](/DUB/issues/DUB-411) (mechanics review, done)

### Shva Sound Switch
- **Status:** Delegated to FED Engineer 3 + Content Writer + Gaming Expert (In Progress)
- **Spec:** `docs/games/shva-sound-switch.md`
- **Reading Skill:** Nikud, Syllable Decoding (guided shva bridge)
- **Curriculum Position:** After core nikud familiarity and early blending, before broader phrase/stories fluency with mixed shva exposure.
- **Delegated Issue:** [DUB-412](/DUB/issues/DUB-412) (implementation, backlog), [DUB-413](/DUB/issues/DUB-413) (Hebrew i18n/audio, done), [DUB-414](/DUB/issues/DUB-414) (mechanics review, done)

### Hebrew Letters Video Pedagogy
- **Status:** Delegated to Content Writer + Media Expert (Shipped)
- **Spec:** `docs/games/hebrew-letters-video-pedagogy.md`
- **Reading Skill:** Educational Videos (letter-sound mapping progression)
- **Curriculum Position:** Cross-track support for letters pathway (ages 3-7), before decodable stories track.
- **Delegated Issue:** [DUB-115](/DUB/issues/DUB-115), [DUB-119](/DUB/issues/DUB-119), [DUB-120](/DUB/issues/DUB-120)

### Final Forms Video Pedagogy
- **Status:** Delegated to Media Expert + Content Writer (In Progress)
- **Spec:** `docs/games/final-forms-video-pedagogy.md`
- **Reading Skill:** Educational Videos (final-forms bridge from letter recognition to word reading)
- **Curriculum Position:** After base letter familiarity and before large-scale phrase/story exposure to final forms.
- **Delegated Issue:** [DUB-415](/DUB/issues/DUB-415) (video composition, backlog), [DUB-416](/DUB/issues/DUB-416) (Hebrew script/audio, done)

### Handbook Literacy Interaction Framework
- **Status:** Delegated to Content Writer + Gaming Expert (Shipped)
- **Spec:** `docs/games/handbook-literacy-interaction-framework.md`
- **Reading Skill:** Nikud, Syllable Decoding, Phrase & Sentence Reading, Reading Comprehension
- **Curriculum Position:** Bridge layer after letter foundations and before scaled decodable stories; embeds systematic reading checkpoints inside handbook story flow.
- **Delegated Issue:** [DUB-327](/DUB/issues/DUB-327) (literacy framework, done), [DUB-332](/DUB/issues/DUB-332) (Hebrew script + narration package, done), [DUB-329](/DUB/issues/DUB-329) (mechanics + difficulty scaling, done)

### Handbook Reading Ladder Expansion (10-Book Sequence)
- **Status:** Delegated to FED Engineer 3 + Content Writer (Shipped)
- **Spec:** `docs/games/handbooks/hebrew-reading-ladder-10-books.md`
- **Reading Skill:** Nikud, Syllable Decoding, Word Reading, Phrase & Sentence Reading, Reading Comprehension, Decodable Stories
- **Curriculum Position:** Expands handbook reading from print awareness through partially pointed sentence reading across ages 3-7, after letter foundations and before full leveled handbook library rollout.
- **Delegated Issue:** [DUB-392](/DUB/issues/DUB-392) (runtime progression gates, done), [DUB-393](/DUB/issues/DUB-393) (Hebrew decodable content + audio package, done)

### Magic Letter Map MVP (First Live Handbook)
- **Status:** Delegated to FED Engineer + Content Writer + Gaming Expert (Shipped)
- **Spec:** `docs/games/handbooks/magic-letter-map-mvp.md`
- **Reading Skill:** Letter Recognition, Nikud, Word Reading, Reading Comprehension (live handbook execution slice)
- **Curriculum Position:** First live handbook launch slice for Book 4 (`5-6`) after letter foundations and before broader decodable-story scale.
- **Age-Band Visibility Decision:** Catalog-visible for `3-4` as listen/explore support mode, with decoding mastery expectations anchored to `5-6` core and `6-7` stretch.
- **Delegated Issue:** [DUB-463](/DUB/issues/DUB-463) (implementation, done), [DUB-464](/DUB/issues/DUB-464) (Hebrew i18n/audio, done), [DUB-465](/DUB/issues/DUB-465) (mechanics review, done)
- **Coverage Note:** Operational launch-scope item inside existing handbook track; curriculum coverage table counts remain unchanged.

### Root Family Stickers
- **Status:** Delegated to FED Engineer 3 + Content Writer + Gaming Expert (Shipped)
- **Spec:** `docs/games/root-family-stickers.md`
- **Reading Skill:** Morphology (Light), Word Reading transfer
- **Curriculum Position:** After beginner word decoding and before decodable micro-stories; introduces concrete root-family awareness with pointed words and short phrase transfer.
- **Delegated Issue:** [DUB-337](/DUB/issues/DUB-337) (implementation, done), [DUB-338](/DUB/issues/DUB-338) (Hebrew i18n/audio, done), [DUB-339](/DUB/issues/DUB-339) (mechanics review, done)

### Decodable Micro Stories
- **Status:** Delegated to FED Engineer 2 + Content Writer + Gaming Expert (Shipped)
- **Spec:** `docs/games/decodable-micro-stories.md`
- **Reading Skill:** Decodable Stories (connected-text decoding + literal comprehension)
- **Curriculum Position:** After phrase-level decoding foundations and handbook checkpoints; first dedicated decodable story lane before scaled leveled-story library.
- **Delegated Issue:** [DUB-347](/DUB/issues/DUB-347) (implementation, done), [DUB-349](/DUB/issues/DUB-349) (Hebrew i18n/audio, done), [DUB-348](/DUB/issues/DUB-348) (mechanics review, done)

### Sight Word Sprint
- **Status:** Delegated to FED Engineer 3 + Content Writer + Gaming Expert (Shipped)
- **Spec:** `docs/games/sight-word-sprint.md`
- **Reading Skill:** Sight Words / High Frequency (recognition automaticity + sentence-frame transfer)
- **Curriculum Position:** After beginner word decoding and in parallel with decodable stories to strengthen fluent recognition of frequent words.
- **Delegated Issue:** [DUB-354](/DUB/issues/DUB-354) (implementation, done), [DUB-356](/DUB/issues/DUB-356) (Hebrew i18n/audio, done), [DUB-355](/DUB/issues/DUB-355) (mechanics review, done)

### Handbook Story Depth Overhaul (Books 1/4/7)
- **Status:** Delegated to FED Engineer 2 + Content Writer + Gaming Expert (In Progress)
- **Spec:** `docs/games/handbooks/handbook-story-depth-overhaul-books-1-4-7.md`
- **Reading Skill:** Phrase & Sentence Reading, Reading Comprehension, Decodable Stories
- **Curriculum Position:** Narrative-depth upgrade layer for handbook Books 1/4/7 after baseline ladder implementation; strengthens chapter continuity, age-fit plot depth, and text-evidence reading behavior.
- **Delegated Issue:** [DUB-524](/DUB/issues/DUB-524) (implementation, in_progress), [DUB-525](/DUB/issues/DUB-525) (Hebrew i18n/audio, in_progress), [DUB-526](/DUB/issues/DUB-526) (mechanics review, done)

### Decodable Micro Stories Age-Band Scaling Overhaul
- **Status:** Delegated to FED Engineer 3 + Content Writer + Gaming Expert (In Progress)
- **Spec:** `docs/games/decodable-micro-stories-age-band-scaling.md`
- **Reading Skill:** Decodable Stories, Phrase & Sentence Reading, Reading Comprehension
- **Curriculum Position:** Revision layer over existing `decodable-micro-stories` runtime to split complexity by age band (`3-4`, `5-6`, `6-7`) before broader leveled-story library rollout.
- **Delegated Issue:** [DUB-527](/DUB/issues/DUB-527) (implementation, done), [DUB-528](/DUB/issues/DUB-528) (Hebrew i18n/audio, todo), [DUB-529](/DUB/issues/DUB-529) (mechanics review, done)
