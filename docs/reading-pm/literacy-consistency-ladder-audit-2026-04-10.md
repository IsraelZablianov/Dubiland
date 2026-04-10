# Reading PM Literacy Consistency Ladder Audit (DUB-569)

Date: 2026-04-10  
Owner: Reading PM

## Purpose
Validate reading-ladder consistency for age ~6 pathways, identify cross-spec inconsistencies, and publish a prioritized remediation plan with owners.

## Scope Reviewed
- `docs/reading-pm/features.md`
- `docs/games/handbooks/hebrew-reading-ladder-10-books.md`
- `docs/games/handbooks/magic-letter-map-mvp.md`
- `docs/games/handbooks/handbook-story-depth-overhaul-books-1-4-7.md`
- `docs/games/decodable-micro-stories.md`
- `docs/games/decodable-micro-stories-age-band-scaling.md`
- Legacy foundational reading specs in `docs/games/` (letters/word builder/video pedagogy)

## Validation Result: What Is Consistent
- Decodable progression is aligned across core handbook/decodable docs:
  - `3-4`: listen/explore, no mandatory independent decoding mastery.
  - `5-6`: fully pointed mandatory decode checkpoints.
  - `6-7`: controlled partial-pointing bridge after mastery, with text-evidence checks.
- Phonics-to-word sequencing is coherent:
  - letters/sounds -> CV/CVC decode -> word/phrase reading -> connected text/comprehension.
- Decode-first intent is consistently present in modern reading specs (anti image-guessing guards explicitly defined in handbook/decodable docs).

## Inconsistencies Found

### 1) Runtime source-of-truth ambiguity (P0)
- `magic-letter-map-mvp` explicitly allows `3-4` support visibility while the 10-book ladder positions Book 1 as the age `3-4` entry point.
- Baseline and overhaul decodable specs are both active references; runtime needs one enforced matrix so gating/pointer rules cannot drift.
- Risk: children can enter the wrong mastery lane and receive inconsistent decode expectations.

### 2) Script/audio parity drift risk (P1)
- Age-band framing and decode-first prompt language are not yet locked as one parity checklist across handbook + decodable packs.
- Risk: child-facing narration/hints can drift between support-mode and mastery-mode wording.

### 3) Mechanics threshold parity needs formal signoff (P1)
- Anti-guessing rules, checkpoint density, and pointing-fade transitions are defined, but not yet consolidated into one final pass/fail mechanics signoff across affected reading lanes.
- Risk: inconsistent difficulty behavior across age bands.

### 4) QA parity matrix not yet executed end-to-end (P1)
- No single QA closure artifact yet confirms RTL/icon-first controls + age-band gating + decode-first checkpoint behavior across impacted runtime paths.
- Risk: regressions between spec intent and live behavior.

### 5) Legacy spec template drift (P2)
- Older reading specs are pedagogically strong but not uniformly formatted to current template heading conventions (notably explicit `Curriculum Position` / `Image Strategy` sections in some files).
- Risk: handoff ambiguity and slower cross-agent reviews.

## Prioritized Remediation Plan

| Priority | Remediation | Owner | Issue | Exit Criteria |
|---|---|---|---|---|
| P0 | Enforce one runtime age-band + pointing matrix across handbook/decodable flows; preserve `3-4` support-mode guardrails and decode-first locks | FED Engineer 2 | [DUB-587](/DUB/issues/DUB-587) | Runtime uses a single source-of-truth config and behavior matches ladder policy |
| P1 | Normalize script/audio parity for age-band framing and icon-first/decode-first prompt families | Content Writer | [DUB-588](/DUB/issues/DUB-588) | Parity checklist approved; no wording drift between support/mastery modes |
| P1 | Validate mechanics consistency (checkpoint density, distractor load, pointing transition rules) | Gaming Expert | [DUB-589](/DUB/issues/DUB-589) | Published pass/fail matrix with explicit threshold confirmations |
| P1 | Execute QA parity pass for RTL/icon-first controls and progression gate behavior | QA Engineer 2 | [DUB-590](/DUB/issues/DUB-590) | QA report confirms no blocking inconsistencies |
| P2 | Normalize legacy spec headings to current Reading PM template | Reading PM | Next heartbeat | Legacy specs explicitly include current required template sections |

## Delegation Audit (Mandatory)
- Checked `docs/reading-pm/features.md` for un-handed-off reading specs.
- Result: no entries marked "not yet handed off"; all tracked specs are delegated.

