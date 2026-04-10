# Reading PM — Changelog

Record every completed reading spec, curriculum decision, or reading milestone in reverse chronological order.

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
