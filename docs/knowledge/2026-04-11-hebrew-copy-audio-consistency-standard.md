# Dubiland Hebrew Copy + Audio Consistency Standard

*Owner: Content Writer | Last updated: 2026-04-11*

## Purpose

Define one enforceable Hebrew content/audio quality bar for Dubiland so children hear consistent guidance and parents see consistent coaching language across reading flows.

## Guardrails (Required)

1. **One דובי voice**: warm, short, encouraging, and action-first.
2. **No hardcoded Hebrew in runtime**: all user-facing text must come from i18n keys.
3. **Audio for every user-facing key**: key exists in locale, mapped in manifest, and `.mp3` exists on disk.
4. **Child phrasing first**: one action per sentence when possible; avoid long multi-step instructions.
5. **Positive framing**: tell the child what to do; avoid punitive language.

## Audit Scope (2026-04-11)

- Locale source: `packages/web/src/i18n/locales/he/common.json`
- Audio manifest: `packages/web/public/audio/he/manifest.json`
- Active reading/video families:
  - `common.games.interactiveHandbook.*`
  - `common.games.decodableMicroStories.*`
  - `common.games.sightWordSprint.*`
  - `common.games.shvaSoundSwitch.*`
  - `common.games.confusableLetterContrast.*`
  - `common.videos.finalForms.*`
  - Matching `common.parentDashboard.*` and launch-handbook families (`mikaSoundGarden`, `yoavLetterMap`, `tamarWordTower`)

## Measured Results

- Targeted keys audited: **1043**
- Missing manifest mappings: **0**
- Missing `.mp3` files: **0**
- Negative/harsh feedback phrases found in active families: **0**
- Overlong instruction/prompt/next-step candidates (>=12 words): **16**

## Highest-Impact Consistency Gaps

| Priority | Gap | Evidence | Owner lane | Target ETA |
|---|---|---|---|---|
| Critical | Launch handbook content/audio closure package still open | [DUB-541](/DUB/issues/DUB-541) is `todo`; integration/QA lanes are waiting in thread (`[DUB-579](/DUB/issues/DUB-579)`, `[DUB-578](/DUB/issues/DUB-578)`) | [DUB-541](/DUB/issues/DUB-541) | 2026-04-11 |
| High | Decodable age-band overhaul lane still open, risking drift vs current runtime contract | [DUB-528](/DUB/issues/DUB-528) is `todo` while age-band language is already live and sensitive to wording consistency | [DUB-528](/DUB/issues/DUB-528) | 2026-04-11 |
| High | Parent `nextStep` narration is inconsistent in brevity (12-18 words), reducing TTS clarity | 16 overlong candidates in active families; top examples listed below | [DUB-565](/DUB/issues/DUB-565) follow-up patch + regen | 2026-04-11 |
| Medium | No recurring automated Hebrew content consistency check in CI | Current checks are run ad hoc; no single reusable command/report for brevity + manifest/file parity | [DUB-565](/DUB/issues/DUB-565) follow-up checklist | 2026-04-12 |

## Keys Needing Brevity Normalization First

1. `common.parentDashboard.games.decodableMicroStories.nextStep`
2. `common.parentDashboard.games.decodableMicroStories.ageBand.3-4.nextStep`
3. `common.games.interactiveHandbook.handbooks.magicLetterMap.completion.nextStep`
4. `common.parentDashboard.games.interactiveHandbook.nextStep`
5. `common.parentDashboard.games.shvaSoundSwitch.nextStep`
6. `common.parentDashboard.games.confusableLetterContrast.nextStep`

## Remediation Plan (Owner + ETA)

1. Close [DUB-541](/DUB/issues/DUB-541) with final key->audio mapping artifact and parity evidence.
   - Owner: Content Writer
   - ETA: 2026-04-11
2. Close [DUB-528](/DUB/issues/DUB-528) with final age-band package confirmation (keys + audio + parent summary wording check).
   - Owner: Content Writer
   - ETA: 2026-04-11
3. Shorten the six high-impact `nextStep` lines above to parent-coaching lines that are clearer in TTS.
   - Owner: Content Writer
   - ETA: 2026-04-11
4. Publish a reusable heartbeat audit snippet (key count, missing manifest, missing files, overlong-line count) and run it before closing content lanes.
   - Owner: Content Writer
   - ETA: 2026-04-12
