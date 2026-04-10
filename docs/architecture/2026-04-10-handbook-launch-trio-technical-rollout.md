# 2026-04-10 — Handbook Launch Trio Technical Rollout (CTO)

- Owner: Architect (CTO)
- Source issue: [DUB-384](/DUB/issues/DUB-384)
- Parent program: [DUB-377](/DUB/issues/DUB-377)
- Related baseline: [DUB-325](/DUB/issues/DUB-325), `docs/architecture/2026-04-10-handbook-architecture.md`

## 1) Decision Summary

1. **No new mandatory schema migration is required** to ship the first three handbook launch slots. Existing foundation in `supabase/migrations/00012_handbook_foundation_rls.sql` is sufficient for content, media inventory, and child progress.
2. **Launch as age-band slots** (3-4, 5-6, 6-7) with a reusable content-pack template so the remaining seven books can be added without code-path drift.
3. **Implementation must remain i18n/audio-first**: every child-facing text key ships with an audio asset; no hardcoded Hebrew in runtime components.
4. **Parent/child data boundaries remain unchanged**: child progress continues through `child_handbook_progress` with family-scoped RLS and minimal child PII.

## 2) Launch Trio Scope (Technical Slots)

The first production slots are one book per age band. Current draft candidates are sourced from handbook content/media drafts:

- `3-4` slot: `bouncy-balloon`
- `5-6` slot: `magic-letter-map`
- `6-7` slot: `star-message`

If final title wording changes, keep slug and key families stable once FED implementation starts.

## 3) Data Model and Storage Assessment

## Existing tables (already available)

- `handbooks`: catalog identity, age/topic binding, manifest container.
- `handbook_pages`: ordered page payloads (`blocks_json`, `interactions_json`, narration key).
- `handbook_media_assets`: deterministic media inventory for preload and integrity checks.
- `child_handbook_progress`: family-scoped per-child state (`furthest_page_number`, completion JSON).

## RLS and privacy posture

- Published content tables are read-only (`SELECT`) to clients.
- Child progress is family-owned via `auth.uid()` path through `families` and `children`.
- This preserves COPPA-aligned minimization: no additional child identifiers or behavioral ad profile fields are introduced.

## Optional later additions (not launch blockers)

- `child_handbook_sessions` append-only analytics table for funnel analysis.
- `handbook_tag_assignments` when handbook filtering is promoted into shared catalog RPCs.

## 4) Technical Template for Every Handbook (Scales to Remaining 7)

Each handbook implementation package must include:

1. **Spec source**
  - `docs/games/handbooks/book-{N}-{slug}.md` (story + interactions + pedagogy).
2. **Content keys and audio contract**
  - Key root: `common.handbooks.<slug>.*`
  - Parent summary: `common.parentDashboard.handbooks.<slug>.*`
  - Audio output path: `packages/web/public/audio/he/handbooks/<slug>/...`
3. **Database payload**
  - One `handbooks` row (published gate off until QA signoff).
  - 8-20 `handbook_pages` rows depending on age band.
  - `handbook_media_assets` rows for all referenced page/media assets.
  - `preload_manifest_json` with critical/next/lazy split.
4. **Runtime integration**
  - Reader route uses existing handbook shell; no per-book component forks.
  - Interaction behavior is data-driven from `interactions_json`.
  - Theme is resolved through `theme_slug` + existing theme context.
5. **QA matrix**
  - RTL layout, tap-target minimums (44px+), audio parity, progress persistence, replay/hint flow.
6. **Performance checks**
  - First 3-page critical preload within budget.
  - No regressions in handbook route startup and page-turn latency.

## 5) Sequencing and Ownership

1. **Backend**: prepare idempotent content-pack ingest/upsert path for 3 launch slugs; verify RLS-safe read/write.
2. **FED (three lanes in parallel)**: implement one launch slot per engineer (3-4 / 5-6 / 6-7).
3. **Performance**: enforce preload/asset budgets and route-level timing checks.
4. **QA (parallel lanes)**: validate each slot plus shared regression checks before publish flag.

## 6) Risks and Mitigations

- **Risk: title/character churn while FED starts**
  - Mitigation: lock slug + i18n namespace early; title text can change without key-family breakage.
- **Risk: audio generation lag blocks UI verification**
  - Mitigation: require manifest parity checkpoints before QA execution windows.
- **Risk: media payload bloat on tablet networks**
  - Mitigation: enforce per-page and critical-preload budgets before publish.
- **Risk: inconsistent interaction complexity across age bands**
  - Mitigation: gate against literacy/mechanics framework docs and QA age-band checklist.

## 7) Effort Estimate (Engineering Only)

- Backend content-pack pipeline and validation: **0.5-1.0 engineer day**
- FED slot implementation:
  - `3-4` slot: **1.5-2.0 days**
  - `5-6` slot: **2.0-2.5 days**
  - `6-7` slot: **2.5-3.0 days**
- Performance budget pass: **0.5 day**
- QA per slot and shared regressions: **1.0-1.5 days** (can overlap late FED work)

Total wall-clock with parallel lanes: **~3-5 days** from final content freeze for launch trio readiness.

