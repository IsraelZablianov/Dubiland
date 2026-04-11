# Reading PM — Feature List

Track all reading games and features across their lifecycle.

## Curriculum Coverage

| Reading Skill Area | Games Planned | Games In Progress | Games Shipped |
|---|---|---|---|
| Letter Recognition | 0 | 2 | 5 |
| Nikud (Vowel Diacritics) | 0 | 2 | 3 |
| Syllable Decoding | 0 | 2 | 3 |
| Word Reading | 0 | 3 | 2 |
| Word Building | 0 | 1 | 1 |
| Sight Words / High Frequency | 0 | 0 | 1 |
| Phrase & Sentence Reading | 0 | 2 | 4 |
| Reading Comprehension | 0 | 1 | 4 |
| Morphology (Light) | 0 | 0 | 1 |
| Decodable Stories | 0 | 2 | 4 |
| Educational Videos | 0 | 2 | 1 |

## Features

### Sound Slide Blending
- **Status:** Delegated to FED Engineer 2 + Content Writer + Gaming Expert (In Progress)
- **Spec:** `docs/games/sound-slide-blending.md`
- **Reading Skill:** Syllable Decoding
- **Curriculum Position:** After core letter+nikud mapping and before/alongside heavier syllable-construction lanes to increase blend fluency.
- **Delegated Issue:** [DUB-782](/DUB/issues/DUB-782) (implementation, todo), [DUB-785](/DUB/issues/DUB-785) (Hebrew i18n/audio, in_progress), [DUB-788](/DUB/issues/DUB-788) (mechanics review, done)

### Spell-and-Send Post Office
- **Status:** Delegated to FED Engineer 3 + Content Writer + Gaming Expert (In Progress)
- **Spec:** `docs/games/spell-and-send-post-office.md`
- **Reading Skill:** Word Building, Word Reading transfer
- **Curriculum Position:** After stable syllable blending and early word decoding, before mixed-pointing sentence/stories transfer lanes.
- **Delegated Issue:** [DUB-783](/DUB/issues/DUB-783) (implementation, todo), [DUB-786](/DUB/issues/DUB-786) (Hebrew i18n/audio, todo), [DUB-789](/DUB/issues/DUB-789) (mechanics review, done)

### Pointing Fade Bridge
- **Status:** Delegated to FED Engineer 2 + Content Writer + Gaming Expert (In Progress)
- **Spec:** `docs/games/pointing-fade-bridge.md`
- **Reading Skill:** Nikud (Vowel Diacritics), Phrase & Sentence Reading, Decodable Stories
- **Curriculum Position:** After fully pointed decodable-story baseline and before long mixed-pointing story/handbook reading.
- **Delegated Issue:** [DUB-784](/DUB/issues/DUB-784) (implementation, todo), [DUB-787](/DUB/issues/DUB-787) (Hebrew i18n/audio, todo), [DUB-790](/DUB/issues/DUB-790) (mechanics review, done)

### Nikud Sound Ladder
- **Status:** Delegated to FED Engineer 2 + Content Writer + Gaming Expert (Shipped)
- **Spec:** `docs/games/nikud-sound-ladder.md`
- **Reading Skill:** Nikud (Vowel Diacritics), Early Syllable Decoding
- **Curriculum Position:** After letter-sound/confusable foundations and before shva-focused decoding and wider story transfer.
- **Delegated Issue:** [DUB-700](/DUB/issues/DUB-700) (implementation, done), [DUB-701](/DUB/issues/DUB-701) (Hebrew i18n/audio, done), [DUB-702](/DUB/issues/DUB-702) (mechanics review, done)

### Syllable Train Builder
- **Status:** Delegated to FED Engineer 3 + Content Writer + Gaming Expert (In Progress)
- **Spec:** `docs/games/syllable-train-builder.md`
- **Reading Skill:** Syllable Decoding, Word Reading transfer
- **Curriculum Position:** After foundational nikud mapping and before advanced shva work plus connected-text decodable lanes.
- **Delegated Issue:** [DUB-703](/DUB/issues/DUB-703) (implementation, todo), [DUB-704](/DUB/issues/DUB-704) (Hebrew i18n/audio, done), [DUB-705](/DUB/issues/DUB-705) (mechanics review, done)

### Decodable Story Missions
- **Status:** Delegated to FED Engineer 2 + Content Writer + Gaming Expert (In Progress)
- **Spec:** `docs/games/decodable-story-missions.md`
- **Reading Skill:** Decodable Stories, Phrase & Sentence Reading, Reading Comprehension
- **Curriculum Position:** After `decodable-micro-stories` baseline and before partially pointed long-form reading tracks.
- **Delegated Issue:** [DUB-706](/DUB/issues/DUB-706) (implementation, in_progress), [DUB-707](/DUB/issues/DUB-707) (Hebrew i18n/audio, done), [DUB-708](/DUB/issues/DUB-708) (mechanics review, done)

### Blend to Read Video Shorts
- **Status:** Delegated to FED Engineer + Media Expert + Content Writer (In Progress)
- **Spec:** `docs/games/blend-to-read-video-shorts.md`
- **Reading Skill:** Educational Videos (blending transfer), Syllable Decoding support
- **Curriculum Position:** Cross-track instructional support after letter-sound familiarity and before independent syllable/word decoding expectations.
- **Delegated Issue:** [DUB-711](/DUB/issues/DUB-711) (runtime integration, in_progress), [DUB-709](/DUB/issues/DUB-709) (video composition, done), [DUB-710](/DUB/issues/DUB-710) (Hebrew script/audio, done)

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

### Learn the Letters Storybook
- **Status:** Delegated to FED Engineer 2 + Content Writer (Shipped)
- **Spec:** `docs/games/letter-storybook.md`
- **Reading Skill:** Letter Recognition (full 22-letter coverage + final-forms bridge)
- **Curriculum Position:** After `letter-tracing-trail` + `letter-sound-match`, before confusable-transfer drills and broader decodable story tracks.
- **Delegated Issue:** [DUB-657](/DUB/issues/DUB-657) (implementation, done), [DUB-658](/DUB/issues/DUB-658) (Hebrew i18n/audio, done)

### Letter Story v2 — Continuous Narrative Route
- **Status:** Delegated to FED Engineer 3 + Content Writer + Media Expert + UX Designer + Gaming Expert + Architect (In Progress)
- **Spec:** `docs/games/letter-storybook-v2.md`
- **Reading Skill:** Letter Recognition (continuous 22-letter sequence + confusable bridge transfer)
- **Curriculum Position:** After foundational letter-form/sound readiness, before confusable-heavy remediation and broader syllable/word decoding tracks.
- **Delegated Issue:** [DUB-766](/DUB/issues/DUB-766) (implementation, backlog), [DUB-758](/DUB/issues/DUB-758) (Hebrew narrative + i18n/audio, done), [DUB-759](/DUB/issues/DUB-759) (illustration pipeline, done), [DUB-760](/DUB/issues/DUB-760) (UX layout, done), [DUB-761](/DUB/issues/DUB-761) (mechanics review, done), [DUB-762](/DUB/issues/DUB-762) (technical owner, blocked)

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
- **Delegated Issue:** [DUB-115](/DUB/issues/DUB-115) (category scope, done), [DUB-119](/DUB/issues/DUB-119) (Hebrew script/TTS package, done), [DUB-120](/DUB/issues/DUB-120) (Remotion composition, done)

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
- **Status:** Delegated to FED Engineer 2 + Content Writer + Gaming Expert (Shipped)
- **Spec:** `docs/games/handbooks/handbook-story-depth-overhaul-books-1-4-7.md`
- **Reading Skill:** Phrase & Sentence Reading, Reading Comprehension, Decodable Stories
- **Curriculum Position:** Narrative-depth upgrade layer for handbook Books 1/4/7 after baseline ladder implementation; strengthens chapter continuity, age-fit plot depth, and text-evidence reading behavior.
- **Delegated Issue:** [DUB-524](/DUB/issues/DUB-524) (implementation, done), [DUB-525](/DUB/issues/DUB-525) (Hebrew i18n/audio, done), [DUB-526](/DUB/issues/DUB-526) (mechanics review, done)

### Decodable Micro Stories Age-Band Scaling Overhaul
- **Status:** Delegated to FED Engineer 3 + Content Writer + Gaming Expert (Shipped)
- **Spec:** `docs/games/decodable-micro-stories-age-band-scaling.md`
- **Reading Skill:** Decodable Stories, Phrase & Sentence Reading, Reading Comprehension
- **Curriculum Position:** Revision layer over existing `decodable-micro-stories` runtime to split complexity by age band (`3-4`, `5-6`, `6-7`) before broader leveled-story library rollout.
- **Delegated Issue:** [DUB-527](/DUB/issues/DUB-527) (implementation, done), [DUB-528](/DUB/issues/DUB-528) (Hebrew i18n/audio, done), [DUB-529](/DUB/issues/DUB-529) (mechanics review, done)
