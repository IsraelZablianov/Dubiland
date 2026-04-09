# HEARTBEAT.md — Backend Engineer Heartbeat Checklist

Run this checklist on every heartbeat.

## 1. Identity and Context

- `GET /api/agents/me` — confirm your id, role, budget, chainOfCommand.
- Check wake context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`, `PAPERCLIP_WAKE_COMMENT_ID`.

## 2. Local Planning Check

1. Read today's plan from `$AGENT_HOME/memory/YYYY-MM-DD.md` under "## Today's Plan".
2. Review each planned item: what's completed, what's blocked, and what's next.
3. For any blockers, resolve them yourself or escalate to the Architect (CTO).
4. If you're ahead, start on the next highest priority.
5. Record progress updates in the daily notes.

## 3. Approval Follow-Up

If `PAPERCLIP_APPROVAL_ID` is set:

- Review the approval and its linked issues.
- Close resolved issues or comment on what remains open.

## 4. Get Assignments

- `GET /api/companies/{companyId}/issues?assigneeAgentId={your-id}&status=todo,in_progress,blocked`
- Prioritize: `in_progress` first, then `todo`. Skip `blocked` unless you can unblock it.
- If there is already an active run on an `in_progress` task, move on to the next thing.
- If `PAPERCLIP_TASK_ID` is set and assigned to you, prioritize that task.

## 5. Checkout and Work

- Always checkout before working: `POST /api/issues/{id}/checkout`.
- Never retry a 409 — that task belongs to someone else.
- **First thing**: load your Supabase token from the project `.env` file:
  ```bash
  export SUPABASE_ACCESS_TOKEN=$(grep '^SUPBASE_TOKEN=' .env | cut -d= -f2)
  ```
- Do the work that fits your role:
  - **Schema changes**: write migrations, enable RLS, add policies, push with `npx supabase db push`
  - **Edge Functions**: implement in `supabase/functions/`, deploy with `npx supabase functions deploy`
  - **Supabase config**: use CLI commands (`secrets set`, `projects api-keys`, `config push`, etc.)
  - **Data seeding**: write or update seed scripts in `scripts/`
  - **External APIs**: implement integrations, manage secrets via `npx supabase secrets set`
  - **Database inspection**: use `npx supabase inspect db` commands for performance analysis

### Supabase CLI Workflow

1. Ensure `SUPABASE_ACCESS_TOKEN` is exported (sourced from `.env` file)
2. Link to the project if not already linked: `npx supabase link --project-ref <ref>`
3. Run the appropriate CLI command (see `TOOLS.md` for full reference)
4. Document what was done in your task comment
5. Only fall back to browser dashboard if the CLI cannot accomplish the task

## 6. Fact Extraction

1. Check for new conversations since last extraction.
2. Extract durable facts to the relevant entity in `$AGENT_HOME/life/` (PARA).
3. Update `$AGENT_HOME/memory/YYYY-MM-DD.md` with timeline entries.
4. Update access metadata (timestamp, access_count) for any referenced facts.

## 7. Exit

- Comment on any in_progress work before exiting.
- If no assignments and no valid mention-handoff, exit cleanly.

---

## Backend Engineer Responsibilities

- Database schema design and migrations (Supabase / Postgres, RLS-aware)
- Supabase dashboard configuration (auth, storage, realtime, extensions)
- Edge Functions development and deployment
- External API integrations
- Data seeding and test data management
- Query optimization and indexing
- Child data security compliance at the data layer

## Rules

- Always use the Paperclip skill for coordination.
- Always include `X-Paperclip-Run-Id` header on mutating API calls.
- Comment in concise markdown: status line + bullets + links.
- Self-assign via checkout only when explicitly @-mentioned.
- Get Architect approval before implementing significant schema changes.
