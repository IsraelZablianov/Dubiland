# Tools

## Supabase CLI (Primary Tool)

The Supabase CLI is your primary tool. It is available via `npx supabase`.

### Authentication

Your Supabase access token lives in the project `.env` file as `SUPBASE_TOKEN`. **Do NOT use browser login or `supabase login`** — source the token from `.env` instead.

At the start of every heartbeat, load it:

```bash
export SUPABASE_ACCESS_TOKEN=$(grep '^SUPBASE_TOKEN=' .env | cut -d= -f2)
```

After exporting, all `npx supabase` commands will authenticate automatically. Never hardcode the token value anywhere — always read it from `.env` at runtime.

### Project Linking

Before running remote commands (`db push`, `db pull`, `db dump`, `functions deploy`, etc.), you must link to the project:

```bash
npx supabase link --project-ref <project-ref>
```

You can find the project ref via:

```bash
npx supabase projects list
```

### Command Reference

#### Project Management

```bash
npx supabase projects list                    # List all projects
npx supabase projects create <name> --org-id <org> --region <region>  # Create project
npx supabase projects api-keys --project-ref <ref>  # Get API keys (anon, service_role)
npx supabase projects delete <ref>            # Delete project
```

#### Database & Migrations

```bash
npx supabase migration new <name>             # Create empty migration file
npx supabase migration list                   # Compare local vs remote migrations
npx supabase db push                          # Push local migrations to remote
npx supabase db push --dry-run                # Preview what will be pushed
npx supabase db pull                          # Pull remote schema as local migration
npx supabase db dump --data-only              # Dump data from remote
npx supabase db dump --role-only              # Dump roles from remote
npx supabase db diff                          # Diff local schema changes
npx supabase db diff --linked                 # Diff against remote database
npx supabase db lint                          # Lint for schema errors
npx supabase db lint --linked                 # Lint remote database
npx supabase db reset                         # Reset local DB to migrations
npx supabase migration repair <ver> --status applied|reverted  # Fix migration history
npx supabase migration squash                 # Squash migrations into one file
```

#### Edge Functions

```bash
npx supabase functions new <name>             # Create new function
npx supabase functions list                   # List deployed functions
npx supabase functions deploy <name>          # Deploy to remote
npx supabase functions deploy                 # Deploy all functions
npx supabase functions serve                  # Serve locally for testing
npx supabase functions delete <name>          # Delete remote function
npx supabase functions download <name>        # Download source from remote
```

#### Secrets Management

```bash
npx supabase secrets list                     # List all secrets
npx supabase secrets set KEY=VALUE ...        # Set secret(s)
npx supabase secrets set --env-file .env      # Set secrets from .env file
npx supabase secrets unset KEY ...            # Remove secret(s)
```

#### Database Inspection (Performance & Debugging)

```bash
npx supabase inspect db table-stats           # Table sizes and row counts
npx supabase inspect db index-stats           # Index usage and sizes
npx supabase inspect db bloat                 # Table/index bloat estimation
npx supabase inspect db vacuum-stats          # Vacuum activity per table
npx supabase inspect db outliers              # Slow queries by total exec time
npx supabase inspect db calls                 # Most frequently called queries
npx supabase inspect db long-running-queries  # Queries running > 5 minutes
npx supabase inspect db locks                 # Current exclusive locks
npx supabase inspect db blocking              # Lock contention details
npx supabase inspect db replication-slots     # Replication lag info
npx supabase inspect db db-stats              # Cache hit rates, WAL size
npx supabase inspect db traffic-profile       # Read/write ratios per table
npx supabase inspect report                   # CSV export of all inspect data
```

#### Storage

```bash
npx supabase storage ls [path]                # List objects
npx supabase storage cp <src> <dst>           # Copy objects
npx supabase storage mv <src> <dst>           # Move objects
npx supabase storage rm <path> ...            # Remove objects
```

#### Type Generation

```bash
npx supabase gen types typescript --linked    # Generate TS types from remote schema
npx supabase gen types typescript --local     # Generate TS types from local DB
```

#### Configuration

```bash
npx supabase config push                      # Push local config.toml to remote
npx supabase status                           # Show local container status
```

### Supabase Management API

For operations not covered by the CLI, use the Management API directly:

```bash
curl -s "https://api.supabase.com/v1/projects" \
  -H "Authorization: Bearer $SUPBASE_TOKEN"
```

Base URL: `https://api.supabase.com/v1/`

Key endpoints:
- `GET /projects` — list projects
- `POST /projects` — create project
- `GET /projects/{ref}/api-keys` — get API keys
- `PATCH /projects/{ref}` — update project
- `DELETE /projects/{ref}` — delete project

Rate limit: 120 requests/minute per user per project/organization.

## Perf matrix auth (DUB-637 / DUB-726)

Deterministic protected-route Lighthouse runs use `scripts/dub-637-protected-route-matrix.mjs` with an `authenticated` profile. That path requires **non-production** parent credentials and a matching project ref:

- `DUBILAND_PERF_EMAIL` / `DUBILAND_PERF_PASSWORD` — dedicated perf parent account (never production accounts).
- `SUPABASE_PROJECT_REF` — must match the Supabase project backing `VITE_SUPABASE_URL` so the `sb-<ref>-auth-token` localStorage key matches the app.

**Provision the Supabase user (once per environment):**

```bash
# Repo-root .env must include VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (script-only; never in Vite).
yarn perf:provision-auth-user
```

Copy the printed `DUBILAND_*` lines into the **same `.env` file** used by Paperclip heartbeats for this workspace (gitignored), then verify:

```bash
yarn perf:check-auth-env
```

Expected: JSON with `"ok": true` and all three presence flags true. Do not paste passwords into issue comments.

## Handbook QA auth (DUB-578 / DUB-749)

Authenticated handbook persistence reruns ([DUB-578](/DUB/issues/DUB-578)) use a **dedicated** non-production parent account (not the perf Lighthouse user), so QA logins do not contend with automated perf runs:

- `DUBILAND_HANDBOOK_QA_EMAIL` / `DUBILAND_HANDBOOK_QA_PASSWORD`
- `SUPABASE_PROJECT_REF` — same rule as perf: must match the Supabase project behind `VITE_SUPABASE_URL`.

**Provision / rotate (GoTrue admin API):**

```bash
yarn handbook:qa:provision-auth-user
```

Copy the printed `DUBILAND_HANDBOOK_QA_*` lines into the gitignored `.env` consumed by **QA2 / Paperclip** runs that exercise `/games/reading/interactive-handbook` with a real session, then verify:

```bash
yarn handbook:qa:check-auth-env
```

Expected: JSON with `"ok": true` and all three presence flags true. Never post passwords or child PII in issue threads.

## Browser Access (Fallback Only)

Use browser access only when the CLI/API cannot accomplish a task (e.g., enabling specific auth providers via UI toggles). Prefer CLI for everything else.

## Local Development

```bash
npx supabase start                            # Start local Supabase stack (Docker)
npx supabase stop                             # Stop local stack
npx supabase db reset                         # Reset local DB to migrations + seed
```

Local services after `supabase start`:
- API: `http://localhost:54321`
- Studio: `http://localhost:54323`
- DB: `postgresql://postgres:postgres@localhost:54322/postgres`

## Key Directories

- `supabase/migrations/` — Database migrations
- `supabase/functions/` — Edge Functions
- `supabase/config.toml` — Local Supabase configuration
- `supabase/seed.sql` — Seed data applied after migrations
- `scripts/` — Build-time tools, seeding scripts
- `packages/shared/` — Shared types and constants (data types go here)
