# Project Conventions

Conventions that emerged during development. Updated by agents as the project evolves.

## i18n
- All Hebrew text uses i18n keys via `t('namespace.key')`
- Locale files: `packages/web/src/i18n/locales/he/*.json`
- Audio manifest mirrors i18n keys

## File Naming
- Game components: PascalCase (e.g. `CountingAnimals.tsx`)
- i18n keys: camelCase (e.g. `games.countingAnimals.name`)
- Audio files: kebab-case (e.g. `counting-animals/instruction.mp3`)

## Paperclip Infrastructure

### Local Instance
- **Config**: `~/.paperclip/instances/default/config.json`
- **API**: `http://127.0.0.1:3100` (local trusted mode, no auth needed for CLI/direct calls)
- **DB**: Embedded Postgres on port `54329`, data at `~/.paperclip/instances/default/db`
- **Logs**: `~/.paperclip/instances/default/logs`
- **UI**: Served at same port (`serveUi: true`)

### Company
- **Dubiland company ID**: `107038ed-546d-4c3f-afca-26feea951289`
- **Board approval required** for new agent hires (`requireBoardApprovalForNewAgents: true`)

### Agent Roster (Dubiland)

| Agent | ID | Role | Reports To |
|-------|----|------|------------|
| PM (CEO) | `9ba06101-670c-4da3-9d57-56fdc8d67b03` | ceo | — |
| Co-Founder | `83f9ecfd-1c49-4ad7-8378-1e7726e7c2a7` | ceo | — (peer to PM) |
| Architect (CTO) | `5f7a9323-368f-439d-b3a8-62cda910830b` | cto | PM |
| CMO | `99a6a12f-c2c1-4eec-a923-59567b339e18` | general | PM |
| SEO Expert | `d2023a23-bfe9-48c0-8f42-8ca274db45cb` | general | CMO |
| Children Learning PM | `d4223d85-1b35-4fc3-82e6-84eb71f8f194` | general | PM |
| Content Writer | `08c098d0-467b-42ba-aae4-95b6364a1aad` | general | PM |
| Gaming Expert | `adf651a0-5e71-4545-b2dc-72c529fa7c40` | researcher | PM |
| UX Designer | `d035382d-fe40-457e-a03d-845f4a795dd5` | designer | PM |
| Media Expert | `4ddeaf8b-4a91-42d0-9ac8-e1d464e1bec5` | general | PM |
| FED Engineer | `afb1aaf8-04b5-45f7-80d1-fd401ae14510` | engineer | Architect |
| FED Engineer 2 | `0dad1b67-3702-4a03-b08b-3342247d371b` | engineer | Architect |
| QA Engineer | `e11728f3-bb90-417d-842a-9a1bb633eed4` | qa | Architect |
| QA Engineer 2 | `bef56e46-8b5a-48fc-bbce-acb9ea364c8a` | qa | Architect |
| Performance Expert | `56affc7e-e580-4c71-b1e2-49ebbc03c84a` | engineer | Architect |
| Backend Engineer | `234deff3-03d1-4f9b-82d0-9abcdf74963a` | engineer | Architect |
| UX QA Reviewer | `04bcbf99-94ed-405c-a383-25710be61279` | qa | PM |
| Ops Watchdog | `57030338-c341-45ee-ad6b-60a28cc9852b` | devops | PM |

### Adapter Convention
- All Dubiland agents use `codex_local` adapter with `model: "gpt-5.3-codex"`
- Instructions use `instructionsBundleMode: "external"` pointing to `docs/agents/{name}/instructions/AGENTS.md`
- `dangerouslyBypassApprovalsAndSandbox: true` is set on all agents
- `env.AGENT_HOME` is set per agent to `/Users/israelz/Documents/dev/AI/Learning/docs/agents/{url-key}` so each agent's PARA memory (`life/`, `memory/`) lives in its own directory

### CLI Quick Reference

```bash
# List companies
npx paperclipai company list

# List agents
npx paperclipai agent list -C 107038ed-546d-4c3f-afca-26feea951289

# Get agent details
npx paperclipai agent get <agent-id>

# Approve a hire
npx paperclipai approval approve <approval-id> --decision-note "reason"

# List approvals
npx paperclipai approval list -C 107038ed-546d-4c3f-afca-26feea951289

# Run paperclip
yarn paperclip    # or: npx paperclipai run

# Trigger a specific agent heartbeat
yarn cascade      # or: npx paperclipai heartbeat run --agent-id <id>

# Get env vars
npx paperclipai env

# Create agent API key + install skills
npx paperclipai agent local-cli <agent-ref>
```

### API Quick Reference (direct HTTP, local trusted)

```bash
BASE="http://127.0.0.1:3100"
CID="107038ed-546d-4c3f-afca-26feea951289"

# List agents
curl -sS "$BASE/api/companies/$CID/agents"

# Agent configurations (with adapter details)
curl -sS "$BASE/api/companies/$CID/agent-configurations"

# Submit hire
curl -sS -X POST "$BASE/api/companies/$CID/agent-hires" \
  -H "Content-Type: application/json" -d '{...}'

# Available icons
curl -sS "$BASE/llms/agent-icons.txt"

# Adapter docs
curl -sS "$BASE/llms/agent-configuration.txt"
curl -sS "$BASE/llms/agent-configuration/codex_local.txt"
curl -sS "$BASE/llms/agent-configuration/cursor.txt"

# Set external instructions path (after hire approved)
curl -sS -X PATCH "$BASE/api/agents/<id>/instructions-path" \
  -H "Content-Type: application/json" \
  -d '{"path": "/Users/israelz/Documents/dev/AI/Learning/docs/agents/<name>/instructions/AGENTS.md"}'
```

### Hiring a New Agent (Full Checklist)

1. Check existing agents: `npx paperclipai agent list -C $CID`
2. Check icons: `curl -sS $BASE/llms/agent-icons.txt`
3. Check adapter docs: `curl -sS $BASE/llms/agent-configuration.txt`
4. Look at existing config for pattern: `curl -sS $BASE/api/companies/$CID/agent-configurations`
5. Create instruction files at `docs/agents/{name}/instructions/` (AGENTS.md, SOUL.md, HEARTBEAT.md, TOOLS.md)
6. Create memory files: `learnings.md`, `instincts.md`, `mistakes.md`
7. Submit hire via API (will go to `pending_approval`)
8. Approve: `npx paperclipai approval approve <id> --decision-note "..."`
9. Verify: `npx paperclipai agent get <id>` — should show `status: idle`
10. Update parent agent's AGENTS.md with new direct report
11. Update root AGENTS.md agent table

## Paperclip Coordination
- For blocked execution tasks, checkout first, then leave a blocker comment with linked dependency tickets and exact unblock criteria.
- If another role owns unblock/recovery, reassign the blocked ticket to that role with the unblock request in the same comment.
- When a new department head is approved (e.g., CMO), immediately create a `todo` child task that transfers ownership from CEO to that manager; avoid keeping new departmental work assigned directly to ICs.
- New child issues created via API default to `backlog`; after delegation, explicitly PATCH them to `todo` so assignees receive them in standard heartbeat assignment filters.
- Before applying blocked-task dedup and exiting a heartbeat, do a quick dependency status sweep: child tickets can flip state without new comments, which may unblock immediate coordinator actions.
- If a parent coordinator is checkoutable but its primary implementation child is still lock-pending (`todo` + stale `executionRunId`), create one fallback child lane on the alternate owner and state in the parent blocker that the first lane to reach `done` becomes canonical. This keeps QA moving and avoids duplicate-completion ambiguity.

## Game Pipeline Handoff

When a game spec is finalized in `docs/games/`:
1. **Children Learning PM** creates a Paperclip issue assigned to **CEO** titled "Implement game: {name}", linking to the spec
2. **Children Learning PM** updates `docs/children-learning-pm/features.md` status to "Handed off to CEO" to avoid duplicates
3. **CEO** decomposes into subtasks following the multi-agent task table:
   - Gaming Expert (mechanics review) → Architect (data model) → FED (implementation) → Content Writer (Hebrew + audio) → QA (review)
4. Each subtask uses `parentId` pointing to the CEO's parent issue
5. `features.md` status lifecycle: `Spec drafted` → `Handed off to CEO` → `In development` → `Shipped`

## Nano Banana (AI Image Generation)

**Available now.** The Media Expert can generate images using Nano Banana (Gemini's native image generation) via the Gemini web UI with enterprise PRO access.

### How to request images

Any agent needing visual assets (game backgrounds, mascot poses, letter cards, UI illustrations) should:

1. Create a Paperclip subtask assigned to the **Media Expert** (`4ddeaf8b-4a91-42d0-9ac8-e1d464e1bec5`)
2. Include in the task description:
   - **What** you need (e.g. "דובי waving hello", "picnic background for counting game")
   - **Where** to save it (e.g. `packages/web/public/images/mascot/dubi-waving.png`)
   - **Style notes** if any (default: children's book illustration, soft pastel colors, white background)
3. The Media Expert will generate it via Nano Banana and commit the asset

### Dubiland visual style defaults

- Children's book illustration style
- Soft pastel colors
- Clean white background (for assets) or soft watercolor (for backgrounds)
- דובי: warm brown teddy bear, rosy cheeks, big friendly eyes, blue backpack with Hebrew letters
- Age-appropriate for 3-7 year olds

### Limitations

- If browser auth expires, Media Expert will escalate to the board — just sign in at `gemini.google.com` in the Cursor browser and let the agent continue
- Use **Fast** mode only (Thinking mode times out)
- No API key available currently — web UI only

---

(Agents append entries below as conventions emerge)

- If `yarn generate-audio` reports `spawn edge-tts ENOENT`, treat content/audio tasks as blocked and reassign to execution recovery with an explicit request to install `edge-tts` (or provide approved replacement tooling).
- Runtime note: npm `edge-tts` package does not expose the `edge-tts` CLI used by `scripts/generate-audio.ts`; install Python `edge-tts` to provide the binary.

## PARA Memory Location

Each agent's `$AGENT_HOME` is set to `docs/agents/{agent-url-key}/` via `adapterConfig.env.AGENT_HOME` in Paperclip. The `para-memory-files` skill writes `life/` and `memory/` relative to `$AGENT_HOME`, so each agent's PARA data lives under its own `docs/agents/{name}/` directory. This was configured on 2026-04-09 for all 15 agents.
