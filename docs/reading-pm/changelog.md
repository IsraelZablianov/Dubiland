# Reading PM — Changelog

Record every completed reading spec, curriculum decision, or reading milestone in reverse chronological order.

## 2026-04-10 — Magic Letter Map MVP moved to shipped
- Synced `Magic Letter Map MVP (First Live Handbook)` after all execution lanes reached `done`:
  - [DUB-463](/DUB/issues/DUB-463) implementation
  - [DUB-464](/DUB/issues/DUB-464) Hebrew i18n/audio
  - [DUB-465](/DUB/issues/DUB-465) mechanics review
- Updated `docs/reading-pm/features.md`:
  - Feature status moved from In Progress to Shipped.
  - Lane annotations now reflect `done` for all three linked issues.
- Coverage note remains unchanged by design (operational handbook slice inside existing curriculum lane).
- Ran mandatory delegation audit: no specs marked "not yet handed off" and no new handoff issues required this heartbeat.

## 2026-04-10 — Magic Letter Map runtime lane entered execution
- Synced `Magic Letter Map MVP` runtime lane state in `docs/reading-pm/features.md`:
  - [DUB-463](/DUB/issues/DUB-463) moved from `todo` to `in_progress`.
  - [DUB-464](/DUB/issues/DUB-464) and [DUB-465](/DUB/issues/DUB-465) remain `done`.
- Feature status remains `In Progress`; no curriculum coverage table change required.
- Ran mandatory delegation audit: no specs marked "not yet handed off" and no new handoff issues required this heartbeat.

## 2026-04-10 — Live-state sync for shva and final-forms lanes
- Synced `Shva Sound Switch` to live lane state:
  - [DUB-412](/DUB/issues/DUB-412) remains `backlog` (implementation).
  - [DUB-413](/DUB/issues/DUB-413) is now `done` (Hebrew i18n/audio).
  - [DUB-414](/DUB/issues/DUB-414) remains `backlog` (mechanics review).
- Synced `Final Forms Video Pedagogy` content lane:
  - [DUB-415](/DUB/issues/DUB-415) remains `backlog`.
  - [DUB-416](/DUB/issues/DUB-416) moved from `in_progress` to `done`.
- Updated `docs/reading-pm/features.md`:
  - Promoted `Shva Sound Switch` from Planned to In Progress.
  - Updated coverage rows:
    - Nikud `1/0/2` -> `0/1/2`
    - Syllable Decoding `1/0/2` -> `0/1/2`
- Ran mandatory delegation audit: no specs marked "not yet handed off" and no new handoff issues required this heartbeat.

## 2026-04-10 — Live-state sync for video and handbook MVP lanes
- Synced `Final Forms Video Pedagogy` to live execution state:
  - [DUB-415](/DUB/issues/DUB-415) remains `backlog` (video composition).
  - [DUB-416](/DUB/issues/DUB-416) is now `in_progress` (Hebrew script/audio).
- Synced `Magic Letter Map MVP` support lanes to live state:
  - [DUB-463](/DUB/issues/DUB-463) remains `todo` (implementation).
  - [DUB-464](/DUB/issues/DUB-464) is `done` (Hebrew i18n/audio).
  - [DUB-465](/DUB/issues/DUB-465) is `done` (mechanics review).
- Updated `docs/reading-pm/features.md`:
  - Promoted both features from Planned to In Progress.
  - Updated Educational Videos curriculum coverage from `1/0/1` to `0/1/1` (planned/in progress/shipped).
- Ran mandatory delegation audit: no specs marked "not yet handed off" and no new handoff issues required this heartbeat.

## 2026-04-10 — Wave 2 reading progression validation locked for Books 4-10
- Completed Reading PM validation pass for:
  - `docs/games/handbooks/book-4-yoav-letter-map.md`
  - `docs/games/handbooks/book-5-naama-syllable-box.md`
  - `docs/games/handbooks/book-6-ori-bread-market.md`
  - `docs/games/handbooks/book-7-tamar-word-tower.md`
  - `docs/games/handbooks/book-8-sahar-secret-clock.md`
  - `docs/games/handbooks/book-9-guy-class-newspaper.md`
  - `docs/games/handbooks/book-10-alma-root-families.md`
- Added explicit `Reading PM Validation Updates (2026-04-10)` sections in each spec with:
  - Pointing policy locks per level cluster.
  - Sentence complexity caps for mandatory path.
  - Anti image-shortcut controls for decoding/comprehension checkpoints.
  - Book-to-book transition gates (Book 4 -> Book 10) with measurable thresholds.
- Synced review status text in all seven specs to mark Reading PM validation complete and unblock FED/content execution.
- Ran mandatory delegation audit in `docs/reading-pm/features.md`: no specs marked "not yet handed off" and no new handoff issues required this heartbeat.

## 2026-04-10 — Added and delegated Magic Letter Map MVP handbook scope
- Authored focused ship-cycle spec: `docs/games/handbooks/magic-letter-map-mvp.md` for first live handbook execution (`magicLetterMap`).
- Locked MVP boundaries to 10 pages with required checkpoints (`p02,p03,p05,p06,p07,p10`) and one optional checkpoint (`p08`).
- Made explicit age-band decision for launch:
  - `5-6` primary mastery band
  - `6-7` stretch support
  - `3-4` visible as listen/explore support mode (no decoding mastery expectation)
- Created direct delegation lanes:
  - [DUB-463](/DUB/issues/DUB-463) assigned to FED Engineer (implementation)
  - [DUB-464](/DUB/issues/DUB-464) assigned to Content Writer (Hebrew i18n/audio parity)
  - [DUB-465](/DUB/issues/DUB-465) assigned to Gaming Expert (mechanics calibration)
- Promoted all three lanes to `todo` for immediate cycle execution.
- Posted coordination comments on all three issues with cross-lane dependencies and closure criteria.
- Updated `docs/reading-pm/features.md` with delegated status for the new MVP scope item.

## 2026-04-10 — Confusable Letter Contrast moved to shipped
- Synced `Confusable Letter Contrast` after all execution lanes reached `done`:
  - [DUB-406](/DUB/issues/DUB-406) implementation
  - [DUB-407](/DUB/issues/DUB-407) Hebrew i18n/audio
  - [DUB-408](/DUB/issues/DUB-408) mechanics review
- Updated `docs/reading-pm/features.md`:
  - Feature status moved from In Progress to Shipped.
  - Letter Recognition coverage updated `1/1/3` -> `1/0/4` (planned/in progress/shipped).

## 2026-04-10 — Confusable lane execution advanced
- Synced live statuses for the `Confusable Letter Contrast` cluster in `docs/reading-pm/features.md`:
  - [DUB-406](/DUB/issues/DUB-406) `in_progress` (implementation)
  - [DUB-407](/DUB/issues/DUB-407) `done` (Hebrew i18n/audio)
  - [DUB-408](/DUB/issues/DUB-408) `done` (mechanics review)
- Feature remains In Progress until implementation lane [DUB-406](/DUB/issues/DUB-406) closes.

## 2026-04-10 — Confusable lane live-state sync
- Synced `docs/reading-pm/features.md` issue-state annotation after [DUB-408](/DUB/issues/DUB-408) moved from `todo` to `in_progress`.
- Current confusable cluster state:
  - [DUB-406](/DUB/issues/DUB-406) `todo`
  - [DUB-407](/DUB/issues/DUB-407) `todo`
  - [DUB-408](/DUB/issues/DUB-408) `in_progress`

## 2026-04-10 — Prioritized Confusable Letter Contrast into active queue
- Promoted the confusable-letter execution cluster from `backlog` to `todo`:
  - [DUB-406](/DUB/issues/DUB-406) implementation
  - [DUB-407](/DUB/issues/DUB-407) Hebrew i18n/audio
  - [DUB-408](/DUB/issues/DUB-408) mechanics review
- Added priority comments on each issue to align sequencing and cross-lane coordination.
- Updated `docs/reading-pm/features.md`:
  - `Confusable Letter Contrast` moved from Planned to In Progress.
  - Letter Recognition coverage updated `2/0/3` -> `1/1/3` (planned/in progress/shipped).

## 2026-04-10 — Added and delegated Final Forms Video Pedagogy
- Authored `docs/games/final-forms-video-pedagogy.md` for short-form direct instruction on Hebrew final forms with embedded checkpoints.
- Created direct delegation lanes:
  - [DUB-415](/DUB/issues/DUB-415) assigned to Media Expert (video composition / Remotion pacing).
  - [DUB-416](/DUB/issues/DUB-416) assigned to Content Writer (Hebrew script, i18n, and audio package).
- Added coordination comments linking the video lane to gameplay transfer lane [DUB-409](/DUB/issues/DUB-409).
- Updated `docs/reading-pm/features.md`:
  - Added `Final Forms Video Pedagogy` as delegated planned feature.
  - Updated Educational Videos coverage `0/0/1` -> `1/0/1`.

## 2026-04-10 — Added and delegated Shva Sound Switch
- Authored `docs/games/shva-sound-switch.md` to open a dedicated shva decoding bridge from nikud familiarity to controlled syllable decoding.
- Created direct delegation lanes:
  - [DUB-412](/DUB/issues/DUB-412) assigned to FED Engineer 3 (implementation).
  - [DUB-413](/DUB/issues/DUB-413) assigned to Content Writer (Hebrew i18n/audio package).
  - [DUB-414](/DUB/issues/DUB-414) assigned to Gaming Expert (mechanics and difficulty review).
- Added coordination comments on all three issues with cross-lane dependencies.
- Updated `docs/reading-pm/features.md`:
  - Added `Shva Sound Switch` as delegated planned feature.
  - Updated curriculum coverage:
    - Nikud `0/0/2` -> `1/0/2`
    - Syllable Decoding `0/0/2` -> `1/0/2`

## 2026-04-10 — Added and delegated Sofit Word-End Detective
- Authored `docs/games/sofit-word-end-detective.md` to address Hebrew final-form (sofit) decoding as explicit positional allograph training before broader phrase/story fluency.
- Created direct delegation lanes:
  - [DUB-409](/DUB/issues/DUB-409) assigned to FED Engineer 3 (implementation).
  - [DUB-410](/DUB/issues/DUB-410) assigned to Content Writer (Hebrew i18n/audio package).
  - [DUB-411](/DUB/issues/DUB-411) assigned to Gaming Expert (mechanics and difficulty review).
- Added coordination comments on all three issues with cross-lane dependencies.
- Updated `docs/reading-pm/features.md`:
  - Added `Sofit Word-End Detective` as delegated planned feature.
  - Updated curriculum coverage:
    - Letter Recognition `1/0/3` -> `2/0/3`
    - Word Reading `0/0/2` -> `1/0/2`

## 2026-04-10 — Handbook 10-book ladder moved to shipped
- Synced `Handbook Reading Ladder Expansion (10-Book Sequence)` after runtime lane [DUB-392](/DUB/issues/DUB-392) moved to `done` (content lane [DUB-393](/DUB/issues/DUB-393) was already `done`).
- Updated `docs/reading-pm/features.md`:
  - Feature status moved from in progress to shipped.
  - Multi-skill coverage rows moved from `0/1/1` to `0/0/2` for Nikud, Syllable Decoding, Word Reading, Phrase & Sentence Reading, Reading Comprehension, and Decodable Stories.

## 2026-04-10 — Added and delegated Confusable Letter Contrast
- Authored `docs/games/confusable-letter-contrast.md` to target explicit Hebrew confusable-letter discrimination before syllable decoding, with 3-level progression and pointed transfer rounds.
- Created direct delegation lanes:
  - [DUB-406](/DUB/issues/DUB-406) assigned to FED Engineer 2 (implementation).
  - [DUB-407](/DUB/issues/DUB-407) assigned to Content Writer (Hebrew i18n/audio package).
  - [DUB-408](/DUB/issues/DUB-408) assigned to Gaming Expert (mechanics and difficulty review).
- Added coordination comments on all three issues with cross-lane dependencies.
- Updated `docs/reading-pm/features.md`:
  - Added `Confusable Letter Contrast` as delegated planned feature.
  - Updated Letter Recognition curriculum coverage from `0/0/3` to `1/0/3` (planned/in progress/shipped).

## 2026-04-10 — Handbook 10-book ladder lane sync
- Updated `Handbook Reading Ladder Expansion (10-Book Sequence)` execution states in `docs/reading-pm/features.md`:
  - [DUB-392](/DUB/issues/DUB-392) is now `in_progress` (runtime gates).
  - [DUB-393](/DUB/issues/DUB-393) is now `done` (Hebrew decodable content + audio package).
- Feature remains in-progress until FED runtime lane [DUB-392](/DUB/issues/DUB-392) reaches closure.

## 2026-04-10 — Letter Sound Match fully shipped after QA closure
- Synced [DUB-103](/DUB/issues/DUB-103) to `done` and updated `Letter Sound Match` status to shipped in `docs/reading-pm/features.md`.
- Updated Letter Recognition coverage from `0/1/2` to `0/0/3` (planned/in progress/shipped).
- Mandatory delegation audit remains clean (all feature entries still delegated).

## 2026-04-10 — Added and delegated handbook 10-book reading ladder
- Authored `docs/games/handbooks/hebrew-reading-ladder-10-books.md` with:
  - a 10-book Hebrew reading-difficulty ladder across ages 3-7,
  - age-band decodable text and vocabulary progression,
  - first 3 prioritized launch books (one per age group) with explicit objective, nikud/phonics expectations, sentence complexity, and comprehension checks.
- Created direct execution lanes from Reading PM:
  - [DUB-392](/DUB/issues/DUB-392) assigned to FED Engineer 3 (runtime progression gates for Books 1/4/7).
  - [DUB-393](/DUB/issues/DUB-393) assigned to Content Writer (Hebrew decodable i18n/audio package for Books 1/4/7).
- Added coordination comments on both execution issues with cross-lane dependencies and reading guardrails.
- Updated `docs/reading-pm/features.md` with the new delegated feature entry and refreshed curriculum coverage counts for handbook expansion lanes.

## 2026-04-10 — Letter QA lane reactivated
- Posted Reading PM unblock ping on [DUB-103](/DUB/issues/DUB-103) after confirming adjacent maintenance lanes are closed ([DUB-127](/DUB/issues/DUB-127), [DUB-128](/DUB/issues/DUB-128) both `done`).
- `DUB-103` moved from `todo` to `in_progress`; tracker updated to reflect active QA execution on letter-sound validation.

## 2026-04-10 — Picture to Word Builder maintenance lane closed
- Synced `docs/reading-pm/features.md` after [DUB-127](/DUB/issues/DUB-127) moved to `done` under QA ownership.
- `Picture to Word Builder` now shows both implementation and maintenance lanes as complete (`DUB-32`, `DUB-127` done).
- Remaining open letter-track QA queue is [DUB-103](/DUB/issues/DUB-103) (`todo`).

## 2026-04-10 — QA unblock routing for maintenance closure
- Routed [DUB-127](/DUB/issues/DUB-127) from FED `in_review` to QA ownership and kicked off QA closure retest against [DUB-131](/DUB/issues/DUB-131) (`in_progress` after handoff).
- Synced maintenance-lane state updates in `docs/reading-pm/features.md`:
  - `Letter Tracing Trail` maintenance lane [DUB-128](/DUB/issues/DUB-128) is now `done`.
  - `Picture to Word Builder` maintenance lane [DUB-127](/DUB/issues/DUB-127) is now `in_progress` under QA ownership.
- Kept `Letter Sound Match` QA lane [DUB-103](/DUB/issues/DUB-103) as `todo` queue.
- Mandatory delegation audit still passes: all feature statuses remain delegated.

## 2026-04-10 — Maintenance lane status sync for letter/word games
- Synced `docs/reading-pm/features.md` issue-state annotations for active maintenance/QA lanes:
  - `Letter Sound Match`: [DUB-31](/DUB/issues/DUB-31) done; [DUB-103](/DUB/issues/DUB-103) now `todo` (QA validation queue).
  - `Letter Tracing Trail`: [DUB-30](/DUB/issues/DUB-30) done; [DUB-128](/DUB/issues/DUB-128) now `in_progress` (maintenance lane).
  - `Picture to Word Builder`: [DUB-32](/DUB/issues/DUB-32) done; [DUB-127](/DUB/issues/DUB-127) now `in_review` (maintenance lane).
- No new specs required this heartbeat; mandatory delegation audit passed (all feature entries remain delegated).

## 2026-04-10 — Sight Word Sprint moved to shipped
- Synced `Sight Word Sprint` in `docs/reading-pm/features.md` to live issue states after all execution lanes reached `done`:
  - [DUB-354](/DUB/issues/DUB-354) implementation
  - [DUB-356](/DUB/issues/DUB-356) Hebrew i18n/audio
  - [DUB-355](/DUB/issues/DUB-355) mechanics review
- Updated Sight Words / High Frequency curriculum coverage from `0/1/0` to `0/0/1` (planned/in progress/shipped).
- Completed mandatory delegation audit: all feature entries remain delegated.

## 2026-04-10 — Tracker sync: handbook, morphology, and decodable stories moved to shipped
- Synced `docs/reading-pm/features.md` to live Paperclip statuses for linked implementation lanes.
- Marked these features as shipped after all linked execution lanes reached `done`:
  - `Handbook Literacy Interaction Framework` ([DUB-327](/DUB/issues/DUB-327), [DUB-332](/DUB/issues/DUB-332), [DUB-329](/DUB/issues/DUB-329))
  - `Root Family Stickers` ([DUB-337](/DUB/issues/DUB-337), [DUB-338](/DUB/issues/DUB-338), [DUB-339](/DUB/issues/DUB-339))
  - `Decodable Micro Stories` ([DUB-347](/DUB/issues/DUB-347), [DUB-349](/DUB/issues/DUB-349), [DUB-348](/DUB/issues/DUB-348))
- Updated curriculum coverage counts:
  - Nikud, Syllable Decoding, Phrase & Sentence Reading, Reading Comprehension, Morphology (Light), and Decodable Stories moved from `in progress` to `shipped`.
- Kept `Sight Word Sprint` in progress with current live state ([DUB-354](/DUB/issues/DUB-354), [DUB-356](/DUB/issues/DUB-356)); mechanics review lane [DUB-355](/DUB/issues/DUB-355) is done.

## 2026-04-10 — Added and delegated Sight Word Sprint spec
- Wrote `docs/games/sight-word-sprint.md` to open a dedicated Sight Words / High Frequency lane focused on rapid recognition and sentence-frame transfer.
- Created direct execution lanes:
  - [DUB-354](/DUB/issues/DUB-354) assigned to FED Engineer 3 (implementation).
  - [DUB-356](/DUB/issues/DUB-356) assigned to Content Writer (Hebrew i18n + audio package).
  - [DUB-355](/DUB/issues/DUB-355) assigned to Gaming Expert (mechanics and difficulty review).
- Added assignment comments on all three issues with coordination dependencies and icon-first/action-triggered guardrails.
- Updated `docs/reading-pm/features.md`:
  - Added `Sight Word Sprint` with delegated status.
  - Updated Sight Words / High Frequency coverage from `0/0/0` to `0/1/0` (planned/in progress/shipped).

## 2026-04-10 — Added and delegated Decodable Micro Stories spec
- Wrote `docs/games/decodable-micro-stories.md` as the first dedicated Decodable Stories product lane (connected-text decoding with literal comprehension checkpoints).
- Created direct execution lanes:
  - [DUB-347](/DUB/issues/DUB-347) assigned to FED Engineer 2 (implementation).
  - [DUB-349](/DUB/issues/DUB-349) assigned to Content Writer (Hebrew i18n + audio package).
  - [DUB-348](/DUB/issues/DUB-348) assigned to Gaming Expert (mechanics and difficulty review).
- Added assignment comments on all three issues with explicit coordination dependencies and icon-first/action-triggered guardrails.
- Updated `docs/reading-pm/features.md`:
  - Added `Decodable Micro Stories` with delegated status.
  - Updated Decodable Stories coverage from `0/0/0` to `0/1/0` (planned/in progress/shipped).

## 2026-04-10 — Added and delegated morphology game spec: Root Family Stickers
- Wrote new reading game spec `docs/games/root-family-stickers.md` targeting Morphology (Light) for ages 6-7 with loop progression: root-family sorting -> word building -> pointed phrase transfer.
- Created direct execution lanes:
  - [DUB-337](/DUB/issues/DUB-337) assigned to FED Engineer 3 (implementation).
  - [DUB-338](/DUB/issues/DUB-338) assigned to Content Writer (Hebrew i18n + audio package).
  - [DUB-339](/DUB/issues/DUB-339) assigned to Gaming Expert (mechanics and difficulty review).
- Posted assignment comments on all three issues with coordination dependencies and icon-first/action-triggered gameplay guardrails.
- Updated `docs/reading-pm/features.md`:
  - Added `Root Family Stickers` with delegated status.
  - Updated Morphology (Light) coverage from `0/0/0` to `0/1/0` (planned/in progress/shipped).

## 2026-04-10 — Handbook literacy interaction framework added and delegated
- Authored `docs/games/handbook-literacy-interaction-framework.md` to define Hebrew reading pedagogy for handbook interactions (letter+nikud -> syllable -> word/phrase -> literal comprehension), including RTL and audio-first guardrails.
- Added the new handbook reading feature to `docs/reading-pm/features.md` with delegated implementation lanes:
  - [DUB-327](/DUB/issues/DUB-327) for literacy framework ownership.
  - [DUB-332](/DUB/issues/DUB-332) for Hebrew script, i18n, and narration package.
  - [DUB-329](/DUB/issues/DUB-329) for mechanics and difficulty scaling.
- Updated curriculum coverage to reflect active in-progress reading coverage for Nikud, Syllable Decoding, Phrase & Sentence Reading, and Reading Comprehension via the handbook framework.
- Ran mandatory delegation audit on `features.md`: all listed reading specs are now marked delegated.

## 2026-04-10 — Letter Sky Catcher moved to shipped in Reading PM tracker
- Synced `docs/reading-pm/features.md` to live Paperclip state after verifying all Letter Sky Catcher lanes are complete: [DUB-312](/DUB/issues/DUB-312), [DUB-321](/DUB/issues/DUB-321), [DUB-322](/DUB/issues/DUB-322) are all `done`.
- Updated curriculum coverage counts for Letter Recognition from `0/2/1` to `0/1/2` (planned/in progress/shipped).
- Ran mandatory delegation audit on `features.md`: no specs currently marked "not yet handed off" and no additional handoff tickets required.

## 2026-04-10 — Feature tracker backfill and Letter Sky Catcher handoff completion
- Reconciled Reading PM specs in `docs/games/` against canonical Paperclip lanes and backfilled `docs/reading-pm/features.md` with delegated/shipped statuses.
- Completed missing handoff lanes for `letter-sky-catcher`:
  - [DUB-321](/DUB/issues/DUB-321) assigned to Content Writer for Hebrew i18n + audio package.
  - [DUB-322](/DUB/issues/DUB-322) assigned to Gaming Expert for mechanics and difficulty signoff.
- [DUB-322](/DUB/issues/DUB-322) moved to `done` (mechanics review completed); implementation/content lanes remain active via [DUB-312](/DUB/issues/DUB-312) and [DUB-321](/DUB/issues/DUB-321).
- Updated curriculum coverage counts to reflect current letter-recognition, word-building, and educational-video coverage.

<!-- Format:
## YYYY-MM-DD — Title
What happened and why it matters.
-->
