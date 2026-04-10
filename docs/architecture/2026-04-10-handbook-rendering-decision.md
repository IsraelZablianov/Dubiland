# 2026-04-10 — Handbook Rendering Decision for Live Reader

- Owner: Architect (CTO)
- Source issue: [DUB-434](/DUB/issues/DUB-434)
- Parent launch issue: [DUB-433](/DUB/issues/DUB-433)
- Related implementation lane: [DUB-441](/DUB/issues/DUB-441)

## Decision

Adopt **Option A**: a DB-driven handbook renderer that reads published content from `handbooks`, `handbook_pages`, and `handbook_media_assets`.

Keep a **temporary fallback path** for empty/legacy page payloads so the current i18n/audio story flow remains playable while content packs are upgraded.

## Why Option A

1. Handbook schema and RLS are already production-ready (`00012` through `00020`), and Option B would bypass this investment.
2. Content-at-scale requires data-driven pages; hardcoded i18n page structures force code deploys for every handbook revision.
3. Media pipeline (illustrations/audio inventory) is already modeled in DB and should be consumed by runtime, not duplicated in component code.
4. Option A keeps the project rule of optimistic writes plus Supabase background sync intact for progress state.

## Why Not Option B (polished hardcoded text reader)

1. Creates parallel source-of-truth drift between DB content and frontend constants.
2. Delays launch-readiness for the remaining handbook set by coupling content changes to engineering releases.
3. Makes UX/media scaling harder because there is no stable renderer contract for block-level visuals.

## Runtime Contract (v1)

## Data fetch

Load handbook payload by slug in one hydration sequence:

1. `handbooks` row (`is_published = true`)
2. `handbook_pages` ordered by `page_number`
3. `handbook_media_assets` ordered by `sort_order`

## Page rendering inputs

Each page is rendered from:

- `layout_kind`
- `blocks_json`
- `interactions_json`
- `narration_key`
- `estimated_read_sec`

## Renderer behavior

1. If `blocks_json` is populated, render visual/text/interaction nodes from DB contract.
2. If `blocks_json` is empty, render fallback page shell using existing narration/prompt/i18n path so child flow never breaks.
3. Narration and prompts remain **audio-first** (`narration_key` and interaction keys map to `/audio/he/...`).
4. Keep existing progress/quality-gate logic and `child_handbook_progress` upsert behavior.

## Initial block types for FED v1

- `illustration`: image asset reference + alt/i18n key
- `text`: i18n key + optional style token
- `hotspot`: target zone bound to interaction id
- `badge`: optional visual cue for hint/success state

Unknown block types must fail soft (skip node, keep page interactive).

## Schema and Security Impact

1. **No new migration required** for this decision.
2. Continue published-content read through existing RLS policies.
3. Continue child progress writes via `child_handbook_progress` with family-scoped ownership checks.
4. No additional child PII is introduced.

## Implementation Plan (Execution Split)

1. FED Engineer 2: add handbook runtime data adapter (query + normalization + fallback guards).
2. FED Engineer 3: build DB-driven page renderer primitives for `blocks_json` and media slot mapping.
3. FED Engineer: integrate renderer into `InteractiveHandbookGame` flow and fix `Home` age-band visibility gap (`3-4` slot).
4. QA Engineer 2: validate RTL/touch/audio parity, fallback behavior, and progress persistence after FED handoff.

## Acceptance Criteria

1. Handbook route renders published DB pages when available (not hardcoded-only).
2. Empty `blocks_json` pages still render playable fallback UI with correct audio.
3. Existing interactions and completion gates continue to function across age bands.
4. RTL layout and 44px+ touch targets verified.
5. No regression in optimistic progress sync to Supabase.

## Rollout Notes

1. Treat this as a progressive migration: runtime supports both enriched DB pages and fallback content until seed packs are fully populated.
2. Once launch content packs include non-empty `blocks_json`, remove legacy-only rendering branches in a follow-up cleanup issue.
