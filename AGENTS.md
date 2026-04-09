# AGENTS.md

Guidance for human and AI contributors working on דובילנד (Dubiland).

## 1. Purpose

Dubiland is a Hebrew learning platform for kids ages 3-7. A teddy bear mascot (דובי) guides children through math, letters, and reading via games, videos, and songs. Parent-guided, web-based, fully Hebrew-native.

## 2. Read This First

1. `docs/specs/2026-04-09-dubiland-design.md` — full design spec
2. `docs/architecture/` — technical decisions (Architect maintains)
3. `docs/games/` — game design documents (PM creates)
4. `docs/knowledge/` — shared learnings across agents

## 3. Repo Map

- `packages/web/` — React + TypeScript + Vite app
- `packages/shared/` — shared types and constants
- `packages/remotion/` — video generation (build-time)
- `supabase/` — migrations and config
- `scripts/` — build-time tools (TTS generation, seeding)
- `docs/` — specs, plans, game designs, architecture, knowledge
- `docs/pm/` — PM (CEO) changelog and feature list
- `docs/children-learning-pm/` — Children Learning PM changelog and feature list
- `docs/agents/{name}/instructions/` — Paperclip agent instructions (AGENTS.md, SOUL.md, HEARTBEAT.md, TOOLS.md)
- `docs/agents/{name}/` — agent learnings, instincts, mistakes

## 4. Core Rules

1. **All text in i18n** — never hardcode Hebrew strings. Use `t('key')` always. Locale files in `packages/web/src/i18n/locales/he/`.
2. **Audio for everything** — every user-facing text must have a corresponding audio file. Kids don't read.
3. **RTL Hebrew** — all layouts are right-to-left. Test in RTL.
4. **Game engine pattern** — new games implement `GameProps` interface. One component + one DB row = one game.
5. **Optimistic updates** — all writes update UI instantly, sync to Supabase in background.
6. **Mobile-friendly touch** — minimum 44px tap targets. Test on tablet viewport.
7. **Theme-aware** — components read theme from context. No hardcoded bear references in game logic.

## 5. Paperclip Orchestration

All agents are managed by **Paperclip** — an AI agent orchestration platform. You run in **heartbeats**: short execution windows triggered on a schedule or by comments/events. You do not run continuously.

### How it works

1. Paperclip wakes you on your heartbeat interval (see table below)
2. You check your inbox, pick work, checkout a task, do useful work, and exit
3. The `skills/paperclip/SKILL.md` skill is your full reference — read it at heartbeat start

### Key rules

- **Always checkout before working** — `POST /api/issues/{issueId}/checkout`
- **Never retry a 409** — another agent owns that task, pick a different one
- **Include run ID on all mutations** — `X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID`
- **Comment-driven wakes take priority** — if `PAPERCLIP_WAKE_COMMENT_ID` is set, address that first
- **Delegate, don't hoard** — create subtasks and assign to the right agent instead of doing everything yourself

### Skills

| Skill | Location | Purpose |
|-------|----------|---------|
| `paperclip` | `skills/paperclip/SKILL.md` | Core heartbeat procedure, API reference, task lifecycle |
| `para-memory-files` | `skills/para-memory-files/SKILL.md` | PARA-based knowledge persistence across heartbeats |
| `paperclip-create-agent` | `skills/paperclip-create-agent/SKILL.md` | Scaffolding new agents via the API |
| `paperclip-create-plugin` | `skills/paperclip-create-plugin/SKILL.md` | Creating Paperclip plugins |

### Environment

These are injected automatically during heartbeats:

```
PAPERCLIP_API_URL, PAPERCLIP_COMPANY_ID, PAPERCLIP_AGENT_ID,
PAPERCLIP_API_KEY, PAPERCLIP_RUN_ID, PAPERCLIP_TASK_ID (optional),
PAPERCLIP_WAKE_REASON (optional), PAPERCLIP_WAKE_COMMENT_ID (optional)
```

## 6. Agent Roles & Heartbeat Schedule

| Agent | Interval | Responsibility |
|---|---|---|
| PM | 20min | Product roadmap, feature specs, game ideas. Writes to `docs/games/`. |
| Children Learning PM | 20min | Expert PM for children's edtech. Game specs, learning objectives, platform benchmarks (TinyTap, Khan Kids, etc.). |
| Architect | 30min | System design, data models, schema changes. Writes to `docs/architecture/`. |
| FED Engineer | 20min | Builds UI, games, components. Implements specs. |
| FED Engineer 2 | 20min | Builds UI, games, components. Implements specs. (Second frontend engineer.) |
| UX Designer | 45min | Design system, child-friendly layouts, design tokens. |
| Gaming Expert | 45min | Game mechanics, difficulty, engagement for ages 3-7. |
| Content Writer | 30min | Hebrew text, audio scripts. Runs `yarn generate-audio`. |
| Media Expert | 60min | Remotion video compositions. |
| QA Engineer | 20min | Code review, testing, accessibility, RTL validation. |
| QA Engineer 2 | 20min | Code review, testing, accessibility, RTL validation. (Second QA.) |
| Performance Expert | 60min | Bundle size, animations, Lighthouse. |

## 7. Agent Instructions (External Mode)

All agent instructions are stored **in the repo**, not in the global Paperclip directory. This keeps everything version-controlled and portable.

**Convention:** each agent's Paperclip instructions live at:
```
docs/agents/{agent-name}/instructions/
├── AGENTS.md      # Entry file — role, rules, skills
├── HEARTBEAT.md   # Per-heartbeat checklist
├── SOUL.md        # Persona and voice
└── TOOLS.md       # Tool-specific notes
```

Paperclip is configured in **external** mode, pointing to these paths. Do not switch back to managed mode.

**When creating a new agent**, after the hire is approved:
1. Create `docs/agents/{new-name}/instructions/` with the 4 files
2. Create `docs/agents/{new-name}/learnings.md`, `instincts.md`, `mistakes.md`
3. Set the instructions path via API:
   ```
   PATCH /api/agents/{agentId}/instructions-path
   { "path": "/Users/israelz/Documents/dev/AI/Learning/docs/agents/{new-name}/instructions/AGENTS.md" }
   ```

## 8. Self-Improvement

After each task, write learnings to:
- Your personal memory: `docs/agents/{your-name}/learnings.md`
- Shared knowledge (if useful to others): `docs/knowledge/`

At heartbeat start, read your memory + `docs/knowledge/` for context.

## 9. Adding a New Game

1. PM writes spec → `docs/games/{game-name}.md`
2. Gaming Expert reviews mechanics
3. FED implements `packages/web/src/games/{topic}/{GameName}.tsx`
4. Content Writer adds i18n keys + generates audio
5. Add game row to DB (migration or seed)
6. QA reviews
7. Game appears in app

## 10. Tech Stack

React 19, TypeScript, Vite, Yarn workspaces, Supabase, i18next, Edge TTS, Remotion, Paperclip

## 11. Verification

Before claiming done:

```bash
yarn typecheck
yarn dev  # verify it runs
```
