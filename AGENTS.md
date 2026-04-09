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

## 4. Core Rules

1. **All text in i18n** — never hardcode Hebrew strings. Use `t('key')` always. Locale files in `packages/web/src/i18n/locales/he/`.
2. **Audio for everything** — every user-facing text must have a corresponding audio file. Kids don't read.
3. **RTL Hebrew** — all layouts are right-to-left. Test in RTL.
4. **Game engine pattern** — new games implement `GameProps` interface. One component + one DB row = one game.
5. **Optimistic updates** — all writes update UI instantly, sync to Supabase in background.
6. **Mobile-friendly touch** — minimum 44px tap targets. Test on tablet viewport.
7. **Theme-aware** — components read theme from context. No hardcoded bear references in game logic.

## 5. Agent Roles & Heartbeat Schedule

| Agent | Interval | Responsibility |
|---|---|---|
| PM | 20min | Product roadmap, feature specs, game ideas. Writes to `docs/games/`. |
| Architect | 30min | System design, data models, schema changes. Writes to `docs/architecture/`. |
| FED Engineer | 20min | Builds UI, games, components. Implements specs. |
| UX Designer | 45min | Design system, child-friendly layouts, design tokens. |
| Gaming Expert | 45min | Game mechanics, difficulty, engagement for ages 3-7. |
| Content Writer | 30min | Hebrew text, audio scripts. Runs `yarn generate-audio`. |
| Media Expert | 60min | Remotion video compositions. |
| QA Engineer | 20min | Code review, testing, accessibility, RTL validation. |
| Performance Expert | 60min | Bundle size, animations, Lighthouse. |

## 6. Self-Improvement

After each task, write learnings to:
- Your personal memory: `docs/agents/{your-name}/learnings.md`
- Shared knowledge (if useful to others): `docs/knowledge/`

At heartbeat start, read your memory + `docs/knowledge/` for context.

## 7. Adding a New Game

1. PM writes spec → `docs/games/{game-name}.md`
2. Gaming Expert reviews mechanics
3. FED implements `packages/web/src/games/{topic}/{GameName}.tsx`
4. Content Writer adds i18n keys + generates audio
5. Add game row to DB (migration or seed)
6. QA reviews
7. Game appears in app

## 8. Tech Stack

React 19, TypeScript, Vite, Yarn workspaces, Supabase, i18next, Edge TTS, Remotion, Paperclip

## 9. Verification

Before claiming done:

```bash
yarn typecheck
yarn dev  # verify it runs
```
