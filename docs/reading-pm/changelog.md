# Reading PM — Changelog

Record every completed reading spec, curriculum decision, or reading milestone in reverse chronological order.

## 2026-04-11 — Spell-and-Send and Pointing Fade clusters advanced to in progress
- Synced `Spell-and-Send Post Office` in `docs/reading-pm/features.md` after [DUB-789](/DUB/issues/DUB-789) moved `todo` -> `done`.
- Synced `Pointing Fade Bridge` after [DUB-790](/DUB/issues/DUB-790) advanced from `todo` to `done` within the same heartbeat.
- Updated both features from `Planned` to `In Progress` (lane-first trigger):
  - `Spell-and-Send Post Office` with [DUB-783](/DUB/issues/DUB-783) `todo`, [DUB-786](/DUB/issues/DUB-786) `todo`, [DUB-789](/DUB/issues/DUB-789) `done`
  - `Pointing Fade Bridge` with [DUB-784](/DUB/issues/DUB-784) `todo`, [DUB-787](/DUB/issues/DUB-787) `todo`, [DUB-790](/DUB/issues/DUB-790) `done`
- Updated curriculum coverage rows:
  - Word Reading `1/2/2` -> `0/3/2`
  - Word Building `1/0/1` -> `0/1/1`
  - Nikud (Vowel Diacritics) `1/1/3` -> `0/2/3`
  - Phrase & Sentence Reading `1/1/4` -> `0/2/4`
  - Decodable Stories `1/1/4` -> `0/2/4`
- Mandatory delegation audit on `docs/reading-pm/features.md`: no un-handed-off specs found (`non_delegated_status_lines=0`, `not_yet_handed_off=0`).

## 2026-04-11 — Lane parity sync for Sound Slide and Letter Story v2 clusters
- Synced delegated lane labels in `docs/reading-pm/features.md` to match live Paperclip issue states:
  - `Sound Slide Blending`: [DUB-788](/DUB/issues/DUB-788) `in_progress` -> `done` (with [DUB-782](/DUB/issues/DUB-782) `todo`, [DUB-785](/DUB/issues/DUB-785) `in_progress`)
  - `Letter Story v2 — Continuous Narrative Route`:
    - [DUB-758](/DUB/issues/DUB-758), [DUB-759](/DUB/issues/DUB-759), [DUB-760](/DUB/issues/DUB-760), [DUB-761](/DUB/issues/DUB-761) `in_progress` -> `done`
    - [DUB-762](/DUB/issues/DUB-762) `todo` -> `blocked`
    - [DUB-766](/DUB/issues/DUB-766) remains `backlog`
- Feature-level statuses and curriculum coverage rows were unchanged in this heartbeat.
- Mandatory delegation audit on `docs/reading-pm/features.md`: no un-handed-off specs found (`non_delegated_status_lines=0`, `not_yet_handed_off=0`).

## 2026-04-11 — DUB-776 reading-ladder concept packet authored and delegated
- Authored three new Hebrew-reading game specs:
  - `docs/games/sound-slide-blending.md`
  - `docs/games/spell-and-send-post-office.md`
  - `docs/games/pointing-fade-bridge.md`
- Delegated direct multi-lane execution under [DUB-776](/DUB/issues/DUB-776):
  - Sound Slide Blending: [DUB-782](/DUB/issues/DUB-782) (`todo`), [DUB-785](/DUB/issues/DUB-785) (`in_progress`), [DUB-788](/DUB/issues/DUB-788) (`in_progress`)
  - Spell-and-Send Post Office: [DUB-783](/DUB/issues/DUB-783), [DUB-786](/DUB/issues/DUB-786), [DUB-789](/DUB/issues/DUB-789)
  - Pointing Fade Bridge: [DUB-784](/DUB/issues/DUB-784), [DUB-787](/DUB/issues/DUB-787), [DUB-790](/DUB/issues/DUB-790)
- Updated `docs/reading-pm/features.md`:
  - Added all three specs with delegated status and lane-level links.
  - Synced `Sound Slide Blending` feature state to `In Progress` due immediate content/mechanics lane activation.
  - Updated curriculum coverage rows:
    - Nikud `0/1/3` -> `1/1/3`
    - Syllable Decoding `0/1/3` -> `0/2/3`
    - Word Reading `0/2/2` -> `1/2/2`
    - Word Building `0/0/1` -> `1/0/1`
    - Phrase & Sentence Reading `0/1/4` -> `1/1/4`
    - Decodable Stories `0/1/4` -> `1/1/4`
- Mandatory delegation audit on `docs/reading-pm/features.md`: no specs remain un-handed-off; all tracked specs now show delegated status.

## 2026-04-11 — Letter Story v2 curriculum+narrative contract authored and delegated
- Delivered canonical v2 spec package:
  - Added `docs/games/letter-storybook-v2.md` with explicit 22-letter sequence contract, transition continuity rules, age-band decoding goals, acceptance criteria, and lane handoff checklist (Content/UX/Media/Gaming/CTO/FED/QA).
  - Updated `docs/games/letter-storybook.md` with a canonical-pointer note so v1 remains documented while v2 stays separate.
- Created direct implementation lane for the un-handed-off FED gap under parent feature [DUB-664](/DUB/issues/DUB-664):
  - [DUB-766](/DUB/issues/DUB-766) assigned to FED Engineer 3 (lowest active load among FED lanes at delegation time).
  - Added explicit coordination comment on [DUB-766](/DUB/issues/DUB-766) covering Content Writer, Media Expert, UX Designer, Gaming Expert, and Architect dependencies.
- Updated `docs/reading-pm/features.md`:
  - Added `Letter Story v2 — Continuous Narrative Route` with delegated status and linked lanes [DUB-758](/DUB/issues/DUB-758), [DUB-759](/DUB/issues/DUB-759), [DUB-760](/DUB/issues/DUB-760), [DUB-761](/DUB/issues/DUB-761), [DUB-762](/DUB/issues/DUB-762), [DUB-766](/DUB/issues/DUB-766).
  - Updated Letter Recognition curriculum coverage row from `0/1/5` to `0/2/5` (planned/in progress/shipped).
- Mandatory delegation audit on `docs/reading-pm/features.md`: no specs remain un-handed-off (all tracked entries now explicitly delegated).

## 2026-04-11 — Delegated-lane status parity sync after DUB-677 rollout
- Reconciled `docs/reading-pm/features.md` against live Paperclip issue states for delegated lanes.
- Promoted feature status to `Shipped` where all linked lanes are `done`:
  - `Nikud Sound Ladder` via [DUB-700](/DUB/issues/DUB-700), [DUB-701](/DUB/issues/DUB-701), [DUB-702](/DUB/issues/DUB-702)
  - `Learn the Letters Storybook` via [DUB-657](/DUB/issues/DUB-657), [DUB-658](/DUB/issues/DUB-658)
- Synced partial-lane progress annotations without changing feature state:
  - `Syllable Train Builder`: [DUB-704](/DUB/issues/DUB-704), [DUB-705](/DUB/issues/DUB-705) moved to `done` (with [DUB-703](/DUB/issues/DUB-703) still `todo`)
  - `Decodable Story Missions`: [DUB-707](/DUB/issues/DUB-707), [DUB-708](/DUB/issues/DUB-708) moved to `done`; [DUB-706](/DUB/issues/DUB-706) is now `in_progress`
  - `Blend to Read Video Shorts`: [DUB-709](/DUB/issues/DUB-709), [DUB-710](/DUB/issues/DUB-710) moved to `done`; [DUB-711](/DUB/issues/DUB-711) is `in_progress`
- Updated curriculum coverage rows in `features.md`:
  - Letter Recognition `0/2/4` -> `0/1/5`
  - Nikud (Vowel Diacritics) `0/2/2` -> `0/1/3`
  - Syllable Decoding `0/2/2` -> `0/1/3`
- Mandatory delegation audit on `docs/reading-pm/features.md`: all tracked specs remain delegated; no un-handed-off specs found (`non_delegated_status_lines=0`, `not_yet_handed_off=0`).

## 2026-04-11 — DUB-677 curriculum expansion specs authored and delegated
- Authored four new reading specs:
  - `docs/games/nikud-sound-ladder.md`
  - `docs/games/syllable-train-builder.md`
  - `docs/games/decodable-story-missions.md`
  - `docs/games/blend-to-read-video-shorts.md`
- Delegated direct execution lanes under [DUB-677](/DUB/issues/DUB-677):
  - Nikud Sound Ladder: [DUB-700](/DUB/issues/DUB-700), [DUB-701](/DUB/issues/DUB-701), [DUB-702](/DUB/issues/DUB-702)
  - Syllable Train Builder: [DUB-703](/DUB/issues/DUB-703), [DUB-704](/DUB/issues/DUB-704), [DUB-705](/DUB/issues/DUB-705)
  - Decodable Story Missions: [DUB-706](/DUB/issues/DUB-706), [DUB-707](/DUB/issues/DUB-707), [DUB-708](/DUB/issues/DUB-708)
  - Blend to Read Video Shorts: [DUB-709](/DUB/issues/DUB-709), [DUB-710](/DUB/issues/DUB-710), [DUB-711](/DUB/issues/DUB-711)
- Updated `docs/reading-pm/features.md`:
  - Added four new delegated feature entries.
  - Refreshed curriculum coverage for Nikud, Syllable Decoding, Word Reading, Phrase/Sentence, Reading Comprehension, Decodable Stories, and Educational Videos.
- Mandatory delegation audit on `docs/reading-pm/features.md`: all tracked specs are delegated; no un-handed-off reading specs remain.

## 2026-04-11 — Duplicate storybook lane acknowledged (DUB-650 superseded)
- Confirmed duplicate execution lane [DUB-650](/DUB/issues/DUB-650) is superseded by canonical lane [DUB-651](/DUB/issues/DUB-651); no parallel spec work was created.
- Posted closure note on [DUB-650](/DUB/issues/DUB-650) and re-applied `cancelled` status after checkout reopened the lane to `in_progress`.
- Parent tracking remains on [DUB-647](/DUB/issues/DUB-647).
- Ran mandatory delegation audit on `docs/reading-pm/features.md`: `non_delegated=0`, `not_yet_handed_off=0`; no new handoff issues required.

## 2026-04-11 — Storybook execution cluster moved to in progress
- Synced live execution state for `Learn the Letters Storybook`:
  - [DUB-657](/DUB/issues/DUB-657) `in_progress` (implementation)
  - [DUB-658](/DUB/issues/DUB-658) `in_progress` (Hebrew i18n/audio)
- Updated `docs/reading-pm/features.md`:
  - Feature status moved from `Planned` to `In Progress`.
  - Letter Recognition coverage row updated `1/1/4` -> `0/2/4` (planned/in progress/shipped).
- Mandatory delegation audit on `docs/reading-pm/features.md`: all tracked reading specs remain delegated; no new handoff issues required.

## 2026-04-11 — Duplicate storybook lane acknowledged (DUB-648 superseded)
- Confirmed duplicate execution lane [DUB-648](/DUB/issues/DUB-648) is superseded by canonical lane [DUB-651](/DUB/issues/DUB-651); no parallel spec work was created.
- Re-validated canonical artifacts remain in place:
  - Spec: `docs/games/letter-storybook.md`
  - Delegated implementation/content lanes: [DUB-657](/DUB/issues/DUB-657), [DUB-658](/DUB/issues/DUB-658)
- Ran mandatory delegation audit on `docs/reading-pm/features.md`: all tracked reading specs already show delegated status; no new handoff issues required.

## 2026-04-11 — Learn the Letters storybook spec authored and delegated
- Authored full reading spec: `docs/games/letter-storybook.md` for the new storybook lane covering all `22` Hebrew letters plus integrated final-forms bridge.
- Locked curriculum placement: after letter tracing/sound matching, before confusable transfer and scaled decodable tracks.
- Created direct execution lanes under [DUB-651](/DUB/issues/DUB-651):
  - [DUB-657](/DUB/issues/DUB-657) — FED Engineer 2 implementation lane (`todo`)
  - [DUB-658](/DUB/issues/DUB-658) — Content Writer Hebrew i18n/audio lane (`todo`)
- Updated `docs/reading-pm/features.md`:
  - Added `Learn the Letters Storybook` with delegated status and issue links.
  - Updated curriculum coverage row: Letter Recognition `0/1/4` -> `1/1/4` (planned/in progress/shipped).
- Mandatory delegation audit on `docs/reading-pm/features.md`: no un-handed-off specs remain.

## 2026-04-11 — Decodable age-band scaling moved to shipped
- Synced `Decodable Micro Stories Age-Band Scaling Overhaul` after [DUB-528](/DUB/issues/DUB-528) moved to `done` (with [DUB-527](/DUB/issues/DUB-527) and [DUB-529](/DUB/issues/DUB-529) already `done`).
- Updated `docs/reading-pm/features.md`:
  - Feature status moved from In Progress to Shipped.
  - Lane annotation updated: [DUB-528](/DUB/issues/DUB-528) `in_progress` -> `done`.
  - Coverage rows updated:
    - Phrase & Sentence Reading `0/1/3` -> `0/0/4`
    - Reading Comprehension `0/1/3` -> `0/0/4`
    - Decodable Stories `0/1/3` -> `0/0/4`
- Mandatory delegation audit on `docs/reading-pm/features.md`: no un-handed-off specs found (`non_delegated=0`, `not_yet_handed_off=0`).

## 2026-04-11 — Decodable age-band content lane moved to in progress
- Synced live issue state for `Decodable Micro Stories Age-Band Scaling Overhaul` in `docs/reading-pm/features.md`:
  - [DUB-527](/DUB/issues/DUB-527) `done`
  - [DUB-528](/DUB/issues/DUB-528) `in_progress` (updated from `todo` in tracker)
  - [DUB-529](/DUB/issues/DUB-529) `done`
- Feature status remains `In Progress`; no curriculum coverage row changes were required.
- Mandatory delegation audit on `docs/reading-pm/features.md`: no un-handed-off specs found (`non_delegated=0`, `not_yet_handed_off=0`).

## 2026-04-11 — Hebrew letters video lane status normalization
- Updated `Hebrew Letters Video Pedagogy` delegated lane annotation in `docs/reading-pm/features.md` to include explicit status labels for:
  - [DUB-115](/DUB/issues/DUB-115) (category scope, done)
  - [DUB-119](/DUB/issues/DUB-119) (Hebrew script/TTS package, done)
  - [DUB-120](/DUB/issues/DUB-120) (Remotion composition, done)
- Mandatory delegation audit on `docs/reading-pm/features.md`: 17/17 status lines are delegated; no un-handed-off specs found.

## 2026-04-11 — Handbook Story Depth Overhaul moved to shipped
- Synced `Handbook Story Depth Overhaul (Books 1/4/7)` after [DUB-524](/DUB/issues/DUB-524) moved to `done` (with [DUB-525](/DUB/issues/DUB-525) and [DUB-526](/DUB/issues/DUB-526) already `done`).
- Updated `docs/reading-pm/features.md`:
  - Feature status moved from In Progress to Shipped.
  - Lane annotation updated: [DUB-524](/DUB/issues/DUB-524) `in_progress` -> `done`.
  - Coverage rows updated:
    - Phrase & Sentence Reading `0/2/2` -> `0/1/3`
    - Reading Comprehension `0/2/2` -> `0/1/3`
    - Decodable Stories `0/2/2` -> `0/1/3`
- Mandatory delegation audit on `docs/reading-pm/features.md`: no un-handed-off specs found (all entries remain delegated).

## 2026-04-11 — Parity lane status refresh (handbook + decodable overhauls)
- Synced live issue states for the two active parity clusters in `docs/reading-pm/features.md`:
  - `Handbook Story Depth Overhaul (Books 1/4/7)`: [DUB-524](/DUB/issues/DUB-524) `in_progress`, [DUB-525](/DUB/issues/DUB-525) `done`, [DUB-526](/DUB/issues/DUB-526) `done`.
  - `Decodable Micro Stories Age-Band Scaling Overhaul`: [DUB-527](/DUB/issues/DUB-527) `done`, [DUB-528](/DUB/issues/DUB-528) `todo`, [DUB-529](/DUB/issues/DUB-529) `done`.
- Updated one stale lane annotation in `features.md`: [DUB-525](/DUB/issues/DUB-525) `in_progress` -> `done`.
- Mandatory delegation audit on `docs/reading-pm/features.md`: no un-handed-off specs found (all entries remain delegated).

## 2026-04-10 — Sofit status sync to active execution
- Synced `Sofit Word-End Detective` to `In Progress` in `docs/reading-pm/features.md` after live lane check showed [DUB-411](/DUB/issues/DUB-411) `done` while [DUB-409](/DUB/issues/DUB-409) and [DUB-410](/DUB/issues/DUB-410) remain `backlog`.
- Updated curriculum coverage counts to match this state shift:
  - Letter Recognition `1/0/4` -> `0/1/4`
  - Word Reading `1/0/2` -> `0/1/2`
- Mandatory delegation audit on `docs/reading-pm/features.md`: no un-handed-off specs found (all entries remain delegated).

## 2026-04-10 — Children PM parity sync for active reading execution lanes (DUB-574)
- Ran live Paperclip status reconciliation for the five required parity lanes:
  - `Sofit Word-End Detective`
  - `Shva Sound Switch`
  - `Final Forms Video Pedagogy`
  - `Handbook Story Depth Overhaul (Books 1/4/7)`
  - `Decodable Micro Stories Age-Band Scaling`
- Synced `docs/reading-pm/features.md` to current issue truth:
  - `Sofit`: [DUB-411](/DUB/issues/DUB-411) now `done` (implementation/content lanes remain backlog).
  - `Shva`: [DUB-414](/DUB/issues/DUB-414) now `done` (implementation remains backlog).
  - `Final Forms Video`: [DUB-415](/DUB/issues/DUB-415) backlog + [DUB-416](/DUB/issues/DUB-416) done.
  - `Handbook Story Depth Overhaul`: feature moved to `In Progress`; [DUB-525](/DUB/issues/DUB-525) now `in_progress`, [DUB-526](/DUB/issues/DUB-526) `done`.
  - `Decodable Age-Band Scaling`: feature moved to `In Progress`; [DUB-527](/DUB/issues/DUB-527) now `in_review`, [DUB-529](/DUB/issues/DUB-529) `done`.
- Updated curriculum coverage rows to match active execution:
  - Phrase & Sentence Reading `2/0/2` -> `0/2/2`
  - Reading Comprehension `2/0/2` -> `0/2/2`
  - Decodable Stories `2/0/2` -> `0/2/2`
- Prepared a canonical parity summary block for Children Learning PM to mirror in `docs/children-learning-pm/features.md` without duplicating full tracker detail.
- Mandatory delegation audit on `docs/reading-pm/features.md`: no un-handed-off specs found (all entries remain delegated).

## 2026-04-10 — Literacy consistency ladder audit + remediation delegation (DUB-569)
- Published audit artifact: `docs/reading-pm/literacy-consistency-ladder-audit-2026-04-10.md`.
- Validation pass confirmed core progression consistency across handbook + decodable tracks:
  - `3-4` listen/explore support mode
  - `5-6` fully pointed decode checkpoints
  - `6-7` controlled partial-pointing bridge + text-evidence checks
- Flagged and prioritized inconsistency risks:
  - runtime source-of-truth ambiguity for age-band gating/pointer policy
  - script/audio parity drift risk between support/mastery wording
  - mechanics threshold parity pending final cross-lane signoff
  - QA parity matrix not yet closed end-to-end
- Delegated remediation lanes directly under [DUB-569](/DUB/issues/DUB-569):
  - [DUB-587](/DUB/issues/DUB-587) — FED Engineer 2 runtime parity implementation
  - [DUB-588](/DUB/issues/DUB-588) — Content Writer script/audio parity
  - [DUB-589](/DUB/issues/DUB-589) — Gaming Expert mechanics consistency review
  - [DUB-590](/DUB/issues/DUB-590) — QA Engineer 2 parity validation
- Mandatory delegation audit on `docs/reading-pm/features.md`: no "not yet handed off" reading specs found.

## 2026-04-10 — Handbook age-depth + instruction-clarity quality gate checkpoint (DUB-551)
- Published quality gate artifact: `docs/reading-pm/handbook-quality-gate-age-depth-instruction-clarity.md`.
- Locked explicit pass/fail criteria across age bands:
  - `3-4`: word-first exposure, no mandatory decoding, short replayable prompts
  - `5-6`: fully pointed mandatory decode checkpoints with one-action prompts
  - `6-7`: required text-evidence checkpoint with controlled mixed-pointing
- Verified handbook prompt brevity from live i18n corpus (`40` prompt/cta lines; longest `8` words).
- Identified remaining clarity/audio risk lane in [DUB-494](/DUB/issues/DUB-494): punctuation-heavy handbook hint lines requiring TTS-safe normalization.
- Reconciled [DUB-482](/DUB/issues/DUB-482) and [DUB-483](/DUB/issues/DUB-483) execution state:
  - [DUB-485](/DUB/issues/DUB-485) done
  - [DUB-491](/DUB/issues/DUB-491) done
  - [DUB-487](/DUB/issues/DUB-487) blocked on [DUB-542](/DUB/issues/DUB-542)
- Mandatory delegation audit on `docs/reading-pm/features.md`: all tracked reading specs remain delegated; no un-handed-off entries found.

## 2026-04-10 — Story depth overhaul specs shipped to delegation (Books 1/4/7 + decodable age scaling)
- Authored handbook narrative-depth spec: `docs/games/handbooks/handbook-story-depth-overhaul-books-1-4-7.md`
  - Locks age-banded chapter arcs for Books 1/4/7 (`3-4`, `5-6`, `6-7`) with stronger plot, conflict-resolution structure, and text-evidence guardrails.
- Authored decodable age-scaling spec: `docs/games/decodable-micro-stories-age-band-scaling.md`
  - Adds explicit story and complexity separation for `3-4` (listen-explore), `5-6` (fully pointed decode), and `6-7` (connected text + evidence).
- Created and assigned six implementation lanes under [DUB-501](/DUB/issues/DUB-501):
  - [DUB-524](/DUB/issues/DUB-524), [DUB-525](/DUB/issues/DUB-525), [DUB-526](/DUB/issues/DUB-526) for handbook story-depth overhaul
  - [DUB-527](/DUB/issues/DUB-527), [DUB-528](/DUB/issues/DUB-528), [DUB-529](/DUB/issues/DUB-529) for decodable age-band scaling
- Updated `docs/reading-pm/features.md`:
  - Added both specs as delegated planned features.
  - Updated curriculum coverage rows:
    - Phrase & Sentence Reading `0/0/2` -> `2/0/2`
    - Reading Comprehension `0/0/2` -> `2/0/2`
    - Decodable Stories `0/0/2` -> `2/0/2`
- Mandatory delegation audit complete: no remaining newly-authored reading specs are left un-handed-off.

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
