# 2026-04-10 — Interactive Handbooks (ספרונים) — Architecture & Execution Plan

## Context

- Epic: [DUB-325](/DUB/issues/DUB-325)
- Implementation lane: [DUB-330](/DUB/issues/DUB-330)

Goal: illustrated, audio-first “book” experiences with optional tap interactions, inline video/animation hooks, and child-specific reading progress — aligned with Dubiland patterns (RTL, i18n keys, audio for every string, catalog tags later).

## Design Principles

1. **Content vs progress** — Published handbook structure is public read (like `games` / `videos`). Child rows stay minimal; progress is family-scoped RLS identical to `progress` / `video_progress`.
2. **JSONB scenes** — Pages store `blocks_json` + `interactions_json` so FED can ship a runtime without constant migrations; `content_schema_version` on `handbooks` gates breaking changes.
3. **Audio-first** — Narration uses the same convention as the rest of the app: logical keys resolved to URLs under `public/audio/he/...` (Content Writer + `generate-audio`). DB stores keys, not spoken text.
4. **Media** — Binary assets live in Supabase Storage (or build artifacts); `handbook_media_assets` is the inventory for preload and CDN cache keys.
5. **Theming** — `handbooks.theme_slug` aligns with `children.theme` / design tokens; runtime merges handbook override → child preference → app default.
6. **Offline (MVP+)** — `preload_manifest_json` lists ordered assets for a service worker / cache layer; full offline is phased after read-path stability.

## Data Model (implemented in `00012_handbook_foundation_rls.sql`)

### `handbooks`

Catalog row (mirrors `games` placement: `topic_id`, `age_group_id`, `is_published`).

| Column | Purpose |
|--------|---------|
| `slug` | Stable URL key |
| `title_key` / `description_key` | i18n |
| `theme_slug` | Design binding |
| `cover_thumbnail_url` | Card / shelf |
| `content_schema_version` | Version for `blocks_json` / `interactions_json` |
| `preload_manifest_json` | Cache/preload lists (see below) |

### `handbook_pages`

| Column | Purpose |
|--------|---------|
| `page_number` | 1-based order, unique per handbook |
| `layout_kind` | `picture_book` \| `comic_strip` \| `freeform` |
| `blocks_json` | Scene graph: images, text refs, embedded video slots |
| `interactions_json` | Tap targets, simple quizzes, “read to me” control hooks |
| `narration_key` | Audio script key for the page |
| `estimated_read_sec` | UX / parent dashboard hints |

### `handbook_media_assets`

Deduped inventory per handbook (`storage_path` unique per handbook). Supports preload sizing and integrity (`checksum_sha256` optional).

### `child_handbook_progress`

One row per `(child_id, handbook_id)`: `furthest_page_number`, `completed`, `page_completion_json` (e.g. per-page completion timestamps), `last_opened_at`. Optimistic UI + background upsert, same trust model as existing progress tables.

### Tagging extension (later)

Add `handbook_tag_assignments` analogous to `game_tag_assignments` when handbooks enter `dubiland_catalog_for_child` / age filters — avoids blocking MVP on RPC changes.

### Append-only analytics (optional phase)

`child_handbook_sessions` (started/ended, device) + page view events — only if PM needs funnels; not in `00012`.

## Preload manifest shape (contract)

```json
{
  "version": 1,
  "critical": [{ "path": "audio/he/handbooks/…/page-1.mp3", "kind": "audio" }],
  "pages": {
    "1": { "assets": ["…"] }
  }
}
```

FED normalizes paths; Backend stores JSON only.

## Page runtime (FED)

1. Resolve handbook by `slug` → fetch pages ordered by `page_number`.
2. **Media orchestration** — Map `blocks_json` nodes to URLs (Storage or static); respect RTL layout from design system.
3. **Interaction engine** — Small reducer over `interactions_json` (tap → play audio, go to page, highlight block). Keep logic data-driven.
4. **Narration pipeline** — Queue `narration_key` clips; coordinate with global `useAudioManager` ducking rules.

## Media / Remotion (Media Expert)

- Authoring can remain Remotion- or Figma-exported stills + timeline JSON that compiles into `blocks_json`.
- Long-form video stays referenced by URL in `blocks_json`, not inlined in Postgres.

## Edge & security

- **MVP** — Reads/writes for `child_handbook_progress` via Supabase client + RLS (same as `video_progress`).
- **Hardening** — Optional Edge Function to validate monotonic `furthest_page_number`, rate-limit writes, or strip unknown JSON keys — follow `submit-game-attempt` pattern if abuse appears.

## RLS summary

| Table | anon + authenticated | Notes |
|-------|----------------------|-------|
| `handbooks` | `SELECT` if `is_published` | No client writes |
| `handbook_pages` | `SELECT` if parent handbook published | |
| `handbook_media_assets` | `SELECT` if parent handbook published | |
| `child_handbook_progress` | full CRUD for family’s children | Same subquery pattern as `progress` |

## Implementation lanes (sequencing)

| # | Owner | Task | Depends on |
|---|--------|------|------------|
| 1 | Architect | Approve schema + manifest contract for first title | — |
| 2 | Backend | Land `00012` + types + `db push` to linked project | 1 |
| 3 | UX Designer | Handbook page templates, touch targets, RTL spreads | 1 |
| 4 | FED | Route `/handbooks/:slug`, reader shell, preload hook, progress sync | 2, 3 |
| 5 | Content Writer | i18n keys + audio for pilot handbook | 2 |
| 6 | Media Expert | Asset pipeline / export → `blocks_json` sample | 2 |
| 7 | Gaming Expert | Interaction affordances (difficulty, child agency) review | 4 |
| 8 | QA | RLS matrix, RTL, offline preload smoke (when enabled) | 2, 4 |

## Rollback

See comments in `supabase/migrations/00012_handbook_foundation_rls.sql`.
