# 2026-04-10 — Content Tagging Architecture (Age-Range Filtering)

## Context

- Source lane: [DUB-141](/DUB/issues/DUB-141)
- Parent requirement: [DUB-112](/DUB/issues/DUB-112)
- UX input: [DUB-143](/DUB/issues/DUB-143)
- Pedagogy taxonomy input: [DUB-145](/DUB/issues/DUB-145)

Current schema stores only one `age_group_id` + one `topic_id` per content row (`games`, `videos`) and numeric `difficulty` only on `games`. This is not enough for:

1. Primary + support age matching
2. Extensible dimensions (`skill`, future learner-profile attributes)
3. Uniform tag rendering across games/videos/songs/materials

## Decision

Adopt a normalized tag model with:

- shared tag dimensions and tags
- per-content-type assignment tables with strict foreign keys
- compatibility with existing columns during rollout (`games.age_group_id`, `games.topic_id`, `games.difficulty`, `videos.age_group_id`, `videos.topic_id`)

This keeps migration risk low and avoids a full catalog refactor in MVP.

## Data Model

### 1) Tag dimensions

```sql
create table tag_dimensions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,              -- age, topic, difficulty, skill
  name_key text not null,
  allows_multiple boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
```

### 2) Tags

```sql
create table tags (
  id uuid primary key default gen_random_uuid(),
  dimension_id uuid not null references tag_dimensions(id) on delete cascade,
  slug text not null,                     -- age.primary.3-4, topic.math, difficulty.2, ...
  name_key text not null,
  description_key text,
  metadata_json jsonb not null default '{}'::jsonb, -- e.g. { "band": "3-4", "kind": "primary" }
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (dimension_id, slug)
);
```

### 3) Content tag assignments

Use strict FK tables for currently shipped content types:

```sql
create table game_tag_assignments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  assignment_role text not null check (assignment_role in ('primary', 'support', 'derived')),
  created_at timestamptz not null default now(),
  unique (game_id, tag_id)
);

create table video_tag_assignments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  assignment_role text not null check (assignment_role in ('primary', 'support', 'derived')),
  created_at timestamptz not null default now(),
  unique (video_id, tag_id)
);
```

Future extension path:

- `song_tag_assignments` (when `songs` table exists)
- `material_tag_assignments` (when parent-facing resources table exists)

### 4) Query helper views

```sql
create view game_tags_expanded as
select
  gta.game_id as content_id,
  'game'::text as content_type,
  t.slug as tag_slug,
  d.slug as dimension_slug,
  gta.assignment_role
from game_tag_assignments gta
join tags t on t.id = gta.tag_id
join tag_dimensions d on d.id = t.dimension_id;
```

Equivalent `video_tags_expanded` view is required.

## RLS + Security

Every new table enables RLS:

- `tag_dimensions`, `tags`: public `select` for active tags only
- `game_tag_assignments`: public `select` only when linked `games.is_published = true`
- `video_tag_assignments`: public `select` only when linked `videos.is_published = true`

Write policy:

- no direct authenticated writes for children/parents on tag tables
- editorial writes happen through trusted backend/service-role workflows

This preserves child-data minimization and keeps tag curation controlled.

## Migration Strategy

## Phase 1 — Foundation migration (`00007_content_tagging_foundation.sql`)

1. Create `tag_dimensions`, `tags`, `game_tag_assignments`, `video_tag_assignments`
2. Add indexes:
   - `tags(dimension_id, sort_order)`
   - `game_tag_assignments(game_id)`, `game_tag_assignments(tag_id)`
   - `video_tag_assignments(video_id)`, `video_tag_assignments(tag_id)`
3. Enable RLS + policies on new tables
4. Create expanded views

## Phase 2 — Seed + backfill (`00008_content_tagging_seed_backfill.sql`)

1. Seed dimensions: `age`, `topic`, `difficulty`, `skill`
2. Seed canonical taxonomy from [DUB-145](/DUB/issues/DUB-145)
3. Backfill existing content:
   - `games`:
     - one `age.primary.*` from `age_group_id`
     - one `topic.*` from `topic_id`
     - one `difficulty.*` from `difficulty`
   - `videos`:
     - one `age.primary.*` from `age_group_id`
     - one `topic.*` from `topic_id`
     - provisional `difficulty.*` by `video_type` (`song -> 1`, `explainer -> 2`, `interactive -> 3`) for UI parity, then editorial review
4. Keep legacy columns for compatibility until FED cutover is complete

## Phase 3 — Cutover

1. FED reads tags for filter + card chips
2. QA validates age ranking and override behavior
3. After two stable releases, evaluate deprecating legacy filter dependency on `age_group_id`

## Query Contracts

## A) Catalog fetch contract (default profile age)

Input:

- `childId`
- `contentTypes` (default: `game,video`)
- optional `topicSlug`
- pagination

Age target is derived from child profile age band.

## B) Manual override contract

Input:

- same as above
- `selectedAgeBand` (`3-4`, `4-5`, `5-6`, `6-7`, `all`)
- `isManualOverride`

Ranking rule (from [DUB-143](/DUB/issues/DUB-143)):

1. primary age match
2. support age match
3. remaining (only when `all`)
4. within each bucket: authored ordering (`sort_order`)

## Recommended implementation shape

- Backend provides one RPC/view-backed contract that returns:
  - content identity + display keys
  - primary age + support ages
  - topic + difficulty tags
  - `age_match_kind` (`primary`, `support`, `none`)
  - `age_match_rank` (1,2,3)

This keeps ranking logic centralized and identical across surfaces.

## Execution Owners and ETAs

- Backend schema + seed + query contract: Backend Engineer, target April 10, 2026
- FED integration (`AgeRangeFilterBar`, card tag row, optimistic override persistence): FED Engineer 2, target April 11, 2026
- QA matrix (RTL, age ranking, override/reset states, i18n/audio parity): QA Engineer, target April 11, 2026

## Risks and Mitigations

- Risk: divergence between legacy columns and new tags during transition
  - Mitigation: backfill once, then enforce write-path updates for both until cutover
- Risk: UI inconsistency if videos miss difficulty tags
  - Mitigation: deterministic backfill + editorial cleanup list
- Risk: query cost with tag joins
  - Mitigation: assignment indexes + expanded views + bounded pagination
