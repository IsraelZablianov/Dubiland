# 2026-04-10 — Quality Pipeline Architecture Review (Audio, Difficulty, Content, Images, Data Flow)

- Owner: Architect (CTO)
- Source issue: [DUB-503](/DUB/issues/DUB-503)
- Parent initiative: [DUB-493](/DUB/issues/DUB-493)

## 1) Scope

This review covers five quality-critical layers requested in [DUB-503](/DUB/issues/DUB-503):

1. Hebrew audio/TTS pipeline quality and provider strategy.
2. Difficulty scaling architecture by age band.
3. Content pipeline from authored content to runtime rendering.
4. Image asset pipeline quality, optimization, and delivery.
5. End-to-end data flow bottlenecks blocking quality.

## 2) Current-State Findings

## 2.1 Audio/TTS

Current implementation is `gTTS` (Google Translate API wrapper):

- `scripts/generate-audio.py` imports `gTTS`, sets `LANG = "iw"`, and writes static mp3 files.
- No provider abstraction, no voice catalog selection, no SSML, no per-key voice policy.
- No automated pronunciation QA pass (nikud/homograph-sensitive lexical checks).

Key risk:

- `gTTS` itself states it is an interface to Google Translate TTS, unaffiliated with Google Cloud, and subject to undocumented upstream changes.

## 2.2 Difficulty Architecture

Difficulty is mostly page-local and static today:

- Game routes define local constants (`const ..._GAME`, `const ..._LEVEL`) instead of fetching canonical runtime level/profile from DB.
- Most pages set fake sync states with timeout (`setSyncState('syncing')` -> `setTimeout` -> `'synced'`) rather than persisting attempts.
- Per-game difficulty logic exists inside each game component, but there is no shared age-band difficulty profile contract that can be managed centrally.

## 2.3 Content Pipeline (Handbook Red Flag)

The handbook runtime is only partially DB-driven:

- `InteractiveHandbook` hydrates `handbooks`, `handbook_pages`, `handbook_media_assets`, but `InteractiveHandbookGame` still builds large hardcoded base page/interaction definitions.
- Runtime DB content is merged on top of hardcoded defaults (`mergeRuntimePageDefinitions`), not treated as primary source of truth.
- Seeded handbook pages are mostly `blocks_json = []`, and `interactions_json` often only includes `id`/`required`, so frontend depends on hardcoded choice presets and copy wiring.

Result:

- Content authoring and DB seed changes can drift from actual runtime behavior.
- Handbook DB content is not yet a complete executable contract.

## 2.4 Image Asset Pipeline

Image delivery is static and mostly manual:

- Assets are served from `packages/web/public/images` without a codified optimization pipeline (no Sharp/Squoosh generation step in build scripts).
- Existing quality audit reports placeholder-grade art quality for key families.
- No central manifest for rendition policy (`@1x/@2x`, WebP/AVIF, byte budgets) and no CI budget enforcement.

## 2.5 End-to-End Data Flow

Append-only telemetry architecture exists in schema, but route integration is incomplete:

- `game_sessions` / `game_attempts` tables and `submit-game-attempt` edge function exist.
- Game routes do not invoke this edge function and generally do not write attempts.
- Parent metrics rely on session data, so dashboard quality signals can be stale or underreported.

## 3) TTS Provider Comparison (Hebrew)

## 3.1 Evidence Snapshot

- **gTTS**: interfaces with Google Translate TTS and explicitly warns about undocumented upstream behavior and no Google Cloud affiliation.
- **edge-tts**: uses Microsoft Edge online TTS service; exposes voice listing and rate/pitch/volume controls, but custom SSML is constrained by service-side restrictions.
- **Azure Speech**: official Hebrew voices include `he-IL-HilaNeural` and `he-IL-AvriNeural`.
- **Google Cloud Chirp 3 HD**: Hebrew `he-IL` is supported with many premium voices.
- **Google Gemini-TTS**: Hebrew `he-IL` currently listed as Preview.

## 3.2 Architecture Decision

1. **Deprecate gTTS for production audio generation**.
2. Introduce provider abstraction (`AudioSynthesisProvider`) with pluggable backends.
3. **Primary managed provider for production**: Azure Speech Neural (`he-IL-HilaNeural`, `he-IL-AvriNeural`) for stable official support and straightforward migration from current voice family.
4. **Secondary benchmark lane**: Google Chirp 3 HD Hebrew voices for periodic quality A/B tests.
5. Keep `edge-tts` as optional local/dev fallback only, not canonical production path.

## 3.3 Required TTS Pipeline Capabilities

1. Per-key voice policy (`narration`, `instruction`, `hint`, `parent summary`).
2. Deterministic cache key (`provider + voice + text hash + generation version`).
3. Manifest metadata: include `provider`, `voice`, `generatedAt`, `checksum`.
4. Audio QA corpus (nikud, homographs, common children’s vocabulary) with manual scoring checkpoints before provider switches.

## 4) Difficulty Architecture Decision

## 4.1 Target Model

Add explicit per-game age-band difficulty profiles as first-class data:

- New table: `game_difficulty_profiles`
- One game row remains canonical (`games` table unchanged contract).
- Multiple profiles per game by age band + version.

Proposed schema (Backend lane):

- `id uuid pk`
- `game_id uuid not null references games(id)`
- `age_band text check in ('3-4','4-5','5-6','6-7')`
- `profile_version int not null default 1`
- `config_json jsonb not null default '{}'`
- `is_published boolean not null default false`
- `sort_order int not null default 0`
- `created_at`, `updated_at`
- unique `(game_id, age_band, profile_version)`

RLS pattern:

- Public `SELECT` for published rows linked to published games.
- Writes restricted to trusted backend/service role.

## 4.2 Runtime Contract

1. Route resolves active child age band.
2. Fetches game + difficulty profile from DB (or fallback nearest support band).
3. Passes resolved profile config into game engine.
4. Game internals may still adapt in-session, but baseline scaffold derives from profile data instead of hardcoded page constants.

## 5) Content Pipeline Decision (Handbooks)

## 5.1 Source-of-Truth Rule

`handbook_pages.blocks_json` and `handbook_pages.interactions_json` become executable source of truth. Hardcoded fallback remains only as temporary migration guard.

## 5.2 Contract Tightening

Require each interaction payload to include:

- `id`, `required`
- `promptKey`, `hintKey`, `successKey`, `retryKey`
- `choices[]` with `id`, `labelKey`, `isCorrect`, optional `audioKey`

Require each page payload to include:

- `layout_kind`
- structured `blocks_json` (`illustration`, `text`, `hotspot`, `badge`)

## 5.3 Ingestion Validation

Add content-pack validator (CI + local):

1. JSON schema validation for pages/interactions.
2. i18n key existence checks.
3. audio-manifest coverage checks.
4. media-asset existence checks.

## 5.4 Media Resolution

Stop assuming raw `storage_path` is directly renderable URL.

- Introduce canonical media resolver that maps DB media record -> runtime URL.
- Support Supabase Storage public/signed URL strategy cleanly.

## 6) Image Pipeline Decision

## 6.1 Asset Processing

Introduce deterministic build-time image pipeline:

1. Source assets stored in authoring directory (`assets-src/`).
2. Build script generates renditions (`webp`, `avif`, optional png fallback) for defined breakpoints.
3. Emit `images-manifest.json` with dimensions, byte size, and hashes.

## 6.2 Delivery Rules

1. Above-fold visuals: eager/high-priority only.
2. Below-fold visuals: lazy with `srcset`/`sizes`.
3. Handbook pages: preload current + next page only; avoid broad eager preloads.
4. CI byte budgets by asset class (thumbnails, backgrounds, handbook pages).

## 6.3 Quality Governance

Adopt visual quality gate with UX + Media review checklist before publish flag on new packs.

## 7) End-to-End Data Flow Remediation

## 7.1 Telemetry Write Path

Standardize all games on a shared client writer that calls `submit-game-attempt` edge function on session/attempt boundaries.

- Remove fake sync timeout states in routes.
- Persist real session + attempt rows for dashboard integrity.

## 7.2 Offline-First Alignment

Implement missing offline foundations:

1. PWA shell (`vite-plugin-pwa`).
2. IndexedDB outbox (`dexie`) for attempt writes.
3. Retry policy with idempotent `clientSessionId`.

## 8) Delegated Execution Plan

1. **Backend Engineer**
- Design and migrate `game_difficulty_profiles` with RLS and indexes.
- Implement production TTS provider abstraction and Azure adapter for generation scripts.
- Add handbook content-pack validation tooling + CI entrypoint.
- Harden media URL resolver for `handbook_media_assets`.

2. **FED Engineer**
- Replace per-route local fake sync writes with shared attempt writer integration.
- Wire all game routes to canonical persisted telemetry flow.

3. **FED Engineer 2**
- Move handbook runtime fully to DB-first interactions/blocks contract.
- Remove hardcoded interaction-choice drift for migrated handbooks.

4. **FED Engineer 3**
- Integrate age-band difficulty profile fetch/selection in runtime game loaders.
- Remove local `GameLevel` constants where DB-backed profiles exist.

5. **Performance Expert**
- Implement image rendition + budget pipeline and reporting.
- Define handbook preload budget thresholds and enforce in CI.

6. **QA Engineer / QA Engineer 2**
- QA1: Audio quality matrix (Hebrew pronunciation corpus, replay/hint latency, parity checks).
- QA2: Difficulty/profile correctness + handbook DB-contract validation + RTL/touch regression sweep.

## 9) Risks and Mitigations

1. **Risk:** TTS provider migration introduces voice inconsistency across existing assets.
- **Mitigation:** Voice policy versioning + gradual pack regeneration + A/B acceptance samples.

2. **Risk:** DB-first handbook transition can break existing seed packs with sparse payloads.
- **Mitigation:** Keep fallback branch until each handbook passes validator and QA signoff.

3. **Risk:** Telemetry write integration adds network failure complexity.
- **Mitigation:** Outbox + idempotent session keys + explicit retry telemetry.

## 10) External References

1. gTTS PyPI project description and disclaimer: https://pypi.org/project/gTTS/
2. edge-tts README (service model, controls, SSML limitation): https://github.com/rany2/edge-tts
3. Azure Speech language/voice support (he-IL, Hila/Avri voices): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
4. Google Cloud TTS supported voices and Hebrew Chirp/WaveNet/Standard entries: https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types
5. Google Cloud Chirp 3 HD Hebrew language availability: https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd
6. Google Gemini-TTS language table (Hebrew currently preview): https://docs.cloud.google.com/text-to-speech/docs/gemini-tts
