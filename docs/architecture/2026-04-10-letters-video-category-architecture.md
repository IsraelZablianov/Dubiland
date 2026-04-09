# 2026-04-10 — Letters Video Category Model and Integration Points

- Owner: Architect
- Related issues: [DUB-117](/DUB/issues/DUB-117), [DUB-115](/DUB/issues/DUB-115), [DUB-120](/DUB/issues/DUB-120)
- Scope: Supabase content model (`topics`, `videos`) and app integration points for the Letters video series

## Context

We need the new Hebrew letters video series to be queryable and displayable through the same content model as other Dubiland topics, while preserving existing RLS and child-data boundaries.

Current state:
- `topics` already includes `letters` in the base migration.
- `videos` table exists and is linked to `topics` via `topic_id`.
- App-side video query/display flow is not implemented yet (`packages/web/src` has no `videos` repository layer).
- Remotion letters compositions exist in `packages/remotion`, but DB ingestion is not wired.

## Decision Summary

1. **Canonical content category for Letters is `topics.slug = 'letters'`.**
- No new top-level category table is needed.
- If any environment drift is discovered, use an idempotent backfill migration to guarantee the row exists.

2. **Video ingestion for letters uses the existing `videos.topic_id` foreign key to the `letters` topic row.**
- Initial rollout should use a migration/seed script that inserts published draft rows for the first letters episodes.
- Insert strategy must be idempotent (`WHERE NOT EXISTS` guard on stable keys such as `name_key` + `video_url`).

3. **App integration must introduce a typed video content access layer before UI wiring.**
- Add a `videos` repository in `packages/web/src/lib/` for Supabase reads.
- Query contract: by topic slug (`letters`), optional age range, `is_published = true`, ordered by `sort_order`.
- UI surfaces should consume this repository rather than hardcoded arrays.

4. **Keep route slugs and content slugs explicitly mapped.**
- Public route uses `/numbers`, while DB topic slug is currently `math`.
- Introduce a shared mapping (`numbers -> math`, `letters -> letters`, `reading -> reading`) so future topic/video queries remain deterministic.
- For this task, Letters is unaffected directly, but this mapping is a required guardrail for consistency in all topic-based content queries.

## Data Model Notes

No schema expansion is required to represent the Letters category itself. Existing model already supports it:
- `topics(slug)` includes `letters`.
- `videos(topic_id)` references `topics(id)`.

Recommended migration work in this lane:
- Add/confirm index for video listing path:
  - `(topic_id, is_published, sort_order)`
- Add idempotent seed migration for initial letters video rows.

All new migrations must:
- Live under `supabase/migrations/`
- Keep RLS enabled (already enabled on `videos`)
- Preserve public-read policy semantics (`videos_public_read` on published rows)

## Integration Points

1. **Backend Engineer**
- Implement migration(s) for letters video seed + read-path index.
- Ensure seed resolves `topic_id` via `topics.slug = 'letters'` and `age_group_id` deterministically.

2. **FED Engineer**
- Implement `videos` repository and topic slug mapping utility.
- Integrate video listing into topic surface (Letters first) with graceful empty/loading states.
- Use i18n keys from DB (`name_key`, `description_key`) and keep audio-first UX constraints.

3. **QA Engineer**
- Validate letters video rows are queryable only when published.
- Verify RTL rendering, touch targets, and that i18n/audio keys resolve for surfaced video metadata.
- Confirm no private child data appears on public content fetches.

## Risks and Mitigations

- Risk: duplicate seed rows across repeated runs.
  - Mitigation: idempotent insert guards and stable key checks.
- Risk: topic slug mismatch causes empty content lists.
  - Mitigation: single shared route-to-topic mapping utility.
- Risk: media assets ready before DB ingestion.
  - Mitigation: publish gate stays on `is_published`; ingest rows first, then flip publish flag.

## Exit Criteria for This Architecture Lane

- Architecture decision documented (this file).
- Child execution tasks created for Backend + FED + QA with explicit acceptance criteria.
- Parent tracking issue remains blocked until delegated implementation/validation tasks are complete.
