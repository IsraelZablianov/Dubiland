# Reading PM — Feature List

Track all reading games and features across their lifecycle.

## Curriculum Coverage

| Reading Skill Area | Games Planned | Games In Progress | Games Shipped |
|---|---|---|---|
| Letter Recognition | 0 | 1 | 2 |
| Nikud (Vowel Diacritics) | 0 | 0 | 1 |
| Syllable Decoding | 0 | 0 | 1 |
| Word Reading | 0 | 0 | 1 |
| Word Building | 0 | 0 | 1 |
| Sight Words / High Frequency | 0 | 0 | 1 |
| Phrase & Sentence Reading | 0 | 0 | 1 |
| Reading Comprehension | 0 | 0 | 1 |
| Morphology (Light) | 0 | 0 | 1 |
| Decodable Stories | 0 | 0 | 1 |
| Educational Videos | 0 | 0 | 1 |

## Features

### Letter Tracing Trail
- **Status:** Delegated to FED Engineer (Shipped)
- **Spec:** `docs/games/letter-tracing-trail.md`
- **Reading Skill:** Letter Recognition
- **Curriculum Position:** Early letter-form and motor-pattern stage, before fluent letter-sound discrimination.
- **Delegated Issue:** [DUB-30](/DUB/issues/DUB-30) (implementation, done); maintenance lane [DUB-128](/DUB/issues/DUB-128) (done)

### Letter Sound Match
- **Status:** Delegated to QA Engineer
- **Spec:** `docs/games/letter-sound-match.md`
- **Reading Skill:** Letter Recognition
- **Curriculum Position:** After letter-form familiarity (`letter-tracing-trail`), before syllable decoding.
- **Delegated Issue:** [DUB-31](/DUB/issues/DUB-31) (implementation, done); [DUB-103](/DUB/issues/DUB-103) (QA validation, in progress)

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

### Hebrew Letters Video Pedagogy
- **Status:** Delegated to Content Writer + Media Expert (Shipped)
- **Spec:** `docs/games/hebrew-letters-video-pedagogy.md`
- **Reading Skill:** Educational Videos (letter-sound mapping progression)
- **Curriculum Position:** Cross-track support for letters pathway (ages 3-7), before decodable stories track.
- **Delegated Issue:** [DUB-115](/DUB/issues/DUB-115), [DUB-119](/DUB/issues/DUB-119), [DUB-120](/DUB/issues/DUB-120)

### Handbook Literacy Interaction Framework
- **Status:** Delegated to Content Writer + Gaming Expert (Shipped)
- **Spec:** `docs/games/handbook-literacy-interaction-framework.md`
- **Reading Skill:** Nikud, Syllable Decoding, Phrase & Sentence Reading, Reading Comprehension
- **Curriculum Position:** Bridge layer after letter foundations and before scaled decodable stories; embeds systematic reading checkpoints inside handbook story flow.
- **Delegated Issue:** [DUB-327](/DUB/issues/DUB-327) (literacy framework, done), [DUB-332](/DUB/issues/DUB-332) (Hebrew script + narration package, done), [DUB-329](/DUB/issues/DUB-329) (mechanics + difficulty scaling, done)

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
