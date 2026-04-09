# דובילנד (Dubiland) — Design Spec

**Date:** 2026-04-09
**Status:** Approved
**Author:** Brainstorm session

---

## 1. Vision

דובילנד is a Hebrew learning platform for kids ages 3–7. A friendly teddy bear mascot (דובי) guides children through math, letters, and reading via games, videos, and songs. The platform is parent-guided — parents set things up, kids play independently.

**Mission:** Make learning fun, accessible, and fully Hebrew-native for Israeli preschool and early elementary kids.

**Core principles:**
- Gaming is the primary learning method
- Everything is listenable — kids don't read, they hear
- All content is Hebrew-first with i18n ready for future languages
- No restrictions — leveling is suggested, never enforced
- Agents continuously create and improve content

---

## 2. Target User

- **Children ages 3–7** — pre-readers through early readers
- **Parent-guided** — parent handles login, profile setup, navigation help; child plays the games
- **Multiple child profiles** per family — each child has their own name, avatar, age, and tracked progress
- **Device:** Web app (responsive), optimized for tablet touch interactions

---

## 3. Content Areas

| Topic | What kids learn | Example activities |
|---|---|---|
| **מספרים (Math/Numbers)** | Counting, number recognition, bigger/smaller, basic arithmetic | Count animals, pop number balloons, sort sequences |
| **אותיות (Letters)** | Hebrew alphabet, letter shapes, letter sounds | Trace letters, match letter to sound, letter bingo |
| **קריאה (Reading)** | Word building, syllables, early reading | Drag letters to build words, match words to pictures |

---

## 4. Visual Style & Themes

**Base style: warm storybook + playful cartoon energy.**

- Illustrated, hand-drawn textures with paper/parchment feel
- Bright, inviting colors — not minimal, not dark
- Rounded shapes, friendly cartoon characters
- Child-friendly: large tap targets, big text, clear visual hierarchy
- Full RTL Hebrew layout

### Theme System

The platform supports multiple visual themes. Kids choose a theme during profile setup (or switch anytime). The default is דובי (Bear). Each theme reskins the experience while game logic stays identical.

**A theme defines:**
- Mascot character (guide and encouragement)
- Color palette + background art
- Game asset skins (e.g. count footballs vs. count stars)
- Feedback phrases tailored to the theme
- Thumbnail/icon set

**Initial themes (expand over time):**

| Theme | Mascot | Feel |
|---|---|---|
| 🧸 דובי (Bear) | Teddy bear | Warm storybook — default |
| ⚽ כדורגל (Football) | Footballer character | Sporty, energetic, green |
| 🦄 קסם (Magic) | Unicorn | Sparkly, fantasy, purple |
| 🚀 חלל (Space) | Astronaut | Stars, rockets, dark blue |
| 🌊 ים (Ocean) | Fish/mermaid | Underwater, waves, teal |

**Architecture:** Theme is a config object (colors, mascot, asset paths, i18n overrides) stored on the child profile. Components read the current theme from context — no conditional logic inside games. UX Designer and PM own theme creation; Gemini generates theme art.

---

## 5. Project Structure

```
dubiland/
├── AGENTS.md                    # Single source of truth for all agents
├── CLAUDE.md                    # Points to AGENTS.md
├── .cursor/rules/               # Cursor-specific rules
├── package.json                 # Yarn workspace root
├── packages/
│   ├── web/                     # React + TypeScript app (Vite)
│   │   ├── src/
│   │   │   ├── components/      # Shared UI + design system
│   │   │   ├── games/           # Game engine + individual games
│   │   │   │   ├── engine/      # GameLoader, GameShell, hooks
│   │   │   │   ├── math/        # Math game components
│   │   │   │   ├── letters/     # Letter game components
│   │   │   │   └── reading/     # Reading game components
│   │   │   ├── pages/           # Routes
│   │   │   ├── hooks/           # Shared React hooks
│   │   │   ├── lib/             # Supabase client, audio player, utils
│   │   │   ├── styles/          # Storybook theme, global styles
│   │   │   └── i18n/            # i18n setup + locale files
│   │   │       ├── locales/
│   │   │       │   └── he/
│   │   │       │       ├── common.json
│   │   │       │       ├── games.json
│   │   │       │       ├── topics.json
│   │   │       │       ├── dubi.json
│   │   │       │       └── onboarding.json
│   │   │       ├── index.ts
│   │   │       └── types.ts
│   │   └── public/
│   │       └── audio/
│   │           └── he/          # Hebrew audio files, namespaced by locale
│   │               ├── feedback/
│   │               ├── games/
│   │               ├── letters/
│   │               ├── numbers/
│   │               ├── ui/
│   │               └── dubi/
│   ├── remotion/                # Video generation (build-time)
│   │   └── src/
│   │       ├── compositions/    # Video templates
│   │       └── assets/
│   └── shared/                  # Shared types + constants
│       └── src/
│           ├── types/
│           └── constants/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── scripts/
│   ├── generate-audio.ts        # Build-time TTS generation
│   └── seed-games.ts            # Seed game catalog
└── docs/
    ├── specs/                   # Design specs
    ├── games/                   # Game design documents (PM output)
    └── architecture/            # Architecture decisions
```

---

## 6. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | CSS/Tailwind (storybook theme) |
| **Routing** | React Router |
| **i18n** | i18next + react-i18next |
| **Backend** | Supabase (Auth, Postgres, Storage) |
| **Video** | Remotion (build-time generation) |
| **TTS** | gTTS (Google Translate TTS) — free, natural Hebrew voice |
| **Image Generation** | Nano Banana (Gemini) — game thumbnails, illustrations, backgrounds, storybook art |
| **Monorepo** | Yarn workspaces |
| **Orchestration** | Paperclip (AI agent management) |

---

## 7. Supabase Data Model

Initial schema. Owned by the Architect agent — evolves as features are added.

### families
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | text UNIQUE | |
| display_name | text | |
| created_at | timestamptz | |

### children
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| family_id | uuid FK → families | |
| name | text | |
| avatar | text | Avatar identifier |
| theme | text | Active theme slug (default: 'bear') |
| birth_date | date | Derives age group |
| created_at | timestamptz | |

### topics
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| slug | text UNIQUE | 'math', 'letters', 'reading' |
| name_he | text | i18n key (e.g. 'topics.math') |
| icon | text | |
| sort_order | int | |

### age_groups
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| label_he | text | i18n key (e.g. 'ageGroups.3to4') |
| min_age | int | |
| max_age | int | |

### games
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| topic_id | uuid FK → topics | |
| age_group_id | uuid FK → age_groups | |
| slug | text UNIQUE | |
| name_he | text | i18n key (e.g. 'games.countingAnimals.name') |
| description_he | text | i18n key (e.g. 'games.countingAnimals.desc') |
| game_type | text | 'drag_drop', 'tap', 'match', 'story', etc. |
| component_key | text | React component to load |
| difficulty | int | 1-5, suggested ordering |
| sort_order | int | Within topic + age group |
| thumbnail_url | text | |
| audio_url | text | Instruction audio |
| is_published | boolean | |
| created_at | timestamptz | |

### game_levels
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| game_id | uuid FK → games | |
| level_number | int | |
| config_json | jsonb | Level-specific params |
| sort_order | int | |

### progress
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| child_id | uuid FK → children | |
| game_id | uuid FK → games | |
| level_id | uuid FK → game_levels | Nullable |
| stars | int | 0-3 |
| score | int | |
| attempts | int | |
| completed | boolean | |
| last_played | timestamptz | |
| created_at | timestamptz | |

### videos
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| topic_id | uuid FK → topics | |
| age_group_id | uuid FK → age_groups | |
| name_he | text | |
| description_he | text | |
| video_type | text | 'explainer', 'song', 'interactive' |
| video_url | text | |
| thumbnail_url | text | |
| duration_sec | int | |
| sort_order | int | |
| is_published | boolean | |
| created_at | timestamptz | |

### video_progress
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| child_id | uuid FK → children | |
| video_id | uuid FK → videos | |
| watched | boolean | |
| watch_time_sec | int | |
| last_watched | timestamptz | |

**RLS policies:** Each family reads/writes only their own children's progress. Games, videos, topics are public read.

**Optimistic updates:** All writes (progress saves, star awards, profile changes) update the UI instantly and sync to Supabase in the background. If the sync fails, retry silently — the child's experience is never interrupted by network latency or errors.

---

## 8. Game Engine Architecture

**Core idea:** Adding a new game = one React component + one database row.

### Engine components

```
games/engine/
├── GameLoader.tsx       # Loads game by component_key, passes config
├── GameShell.tsx        # Wraps every game: audio controls, stars, exit
├── types.ts             # GameProps interface
├── useGameState.ts      # Hook: score, stars, attempts, save progress
├── useAudio.ts          # Hook: play instruction, play feedback sounds
└── useTimer.ts          # Hook: optional game timer
```

### GameProps interface

```typescript
interface GameProps {
  game: Game
  level: GameLevel
  child: Child
  onComplete: (result: GameResult) => void
  audio: AudioController
}
```

### GameShell provides
- Hebrew audio instruction button (plays `game.audio_url`)
- Star display
- Big exit/back button
- Automatic progress save on `onComplete`
- Audio instruction auto-plays on game enter

### Adding a new game (agent workflow)
1. PM writes game spec → `docs/games/{game-name}.md`
2. Gaming Expert reviews mechanics and difficulty
3. FED implements `games/{topic}/{GameName}.tsx` implementing `GameProps`
4. Content Writer provides Hebrew i18n keys + generates audio files
5. Migration or seed script inserts game row with `component_key`
6. QA reviews and play-tests
7. Game appears in the app

---

## 9. Audio & TTS Pipeline

### Generation
- **Tool:** gTTS (Google Translate TTS) — free, natural Hebrew voice
- **Process:** Build-time script (`scripts/generate-audio.py`) reads i18n JSON → generates `.mp3` files → saves to `public/audio/he/`
- **Ownership:** Content Writer agent writes text, runs generation script

### Audio categories
| Category | Path | Example |
|---|---|---|
| Game instructions | `/audio/he/games/{slug}/instruction.mp3` | "?כמה חיות יש כאן" |
| Feedback | `/audio/he/feedback/{type}.mp3` | "!כל הכבוד" |
| Letters | `/audio/he/letters/{letter}.mp3` | Aleph name + sound |
| Numbers | `/audio/he/numbers/{n}.mp3` | 1 through 100 |
| UI navigation | `/audio/he/ui/{action}.mp3` | "בחר נושא" |
| דובי mascot | `/audio/he/dubi/{phrase}.mp3` | Greetings, encouragement |

### Audio manifest
JSON file maps i18n keys to audio file paths. Games reference audio by key, not raw path. Locale-namespaced for future language support.

---

## 10. i18n Strategy

All text content in JSON locale files. Never hardcode Hebrew strings in components.

```
i18n/locales/he/
├── common.json       # UI strings, feedback, navigation
├── games.json        # Game names, descriptions, instructions
├── topics.json       # Topic names and descriptions
├── dubi.json         # Bear mascot dialogue
└── onboarding.json   # Login, profile setup
```

**Rules for agents:**
- Always use `t('key')` — never inline Hebrew
- Audio paths include locale prefix (`/audio/he/...`)
- Game `config_json` stores i18n keys, not raw text
- Adding a new language = new locale folder + new audio files, no component changes

---

## 11. Paperclip Agent Org Chart

```
You (Board of Directors)
  └── PM (CEO role)
       ├── Architect
       │     └── FED Engineer
       ├── UX Designer
       ├── Gaming Expert
       ├── Content Writer
       ├── Media Expert
       ├── QA Engineer
       └── Performance Expert
```

### Agent definitions

| Agent | Adapter | Reports to | Responsibility |
|---|---|---|---|
| **PM** | Claude Code | Board | Product roadmap, feature specs, game ideas, prioritization. Continuously invents new games and learning methods. |
| **Architect** | Claude Code | PM | System design, data models, game engine API, Supabase schema. Owns `docs/architecture/`. |
| **FED Engineer** | Claude Code | Architect | Builds UI, games, components, pages. Implements specs. |
| **UX Designer** | Claude Code | PM | Storybook visual system, child-friendly layouts, RTL Hebrew, design tokens. |
| **Gaming Expert** | Claude Code | PM | Game mechanics, difficulty balancing, engagement patterns for ages 3-7. |
| **Content Writer** | Claude Code | PM | All Hebrew text, game instructions, story scripts, song lyrics. Runs TTS generation. |
| **Media Expert** | Claude Code | PM | Remotion video compositions, song animations, interactive video segments. |
| **QA Engineer** | Claude Code | Architect | Code review, testing, accessibility, Hebrew RTL validation, play-testing. |
| **Performance Expert** | Claude Code | Architect | Bundle size, load times, animation performance, Lighthouse scores. |

### Heartbeat schedule

| Agent | Interval |
|---|---|
| PM | 20min |
| Architect | 30min |
| FED Engineer | 20min |
| UX Designer | 45min |
| Gaming Expert | 45min |
| Content Writer | 30min |
| Media Expert | 60min |
| QA Engineer | 20min |
| Performance Expert | 60min |

Heartbeat intervals configurable via Paperclip UI — no code changes needed.

### Agent Self-Improvement System

Agents learn from their work and accumulate knowledge over time. The system is self-evolving.

**Architecture: Instinct-based learning per agent + shared knowledge base.**

```
Agent does work (heartbeat/task)
      │
      │ After each task
      ▼
┌─────────────────────────────────────┐
│   Agent reflects on the task:       │
│   • What went well?                 │
│   • What was corrected by humans?   │
│   • What patterns emerged?          │
│   • What new knowledge was gained?  │
└─────────────────────────────────────┘
      │
      │ Writes to two places
      ▼
┌──────────────────┐    ┌──────────────────────────┐
│ Personal Memory  │    │ Shared Knowledge Base    │
│ (per agent)      │    │ (all agents read)        │
│                  │    │                          │
│ docs/agents/     │    │ docs/knowledge/          │
│   {agent}/       │    │   patterns.md            │
│   learnings.md   │    │   corrections.md         │
│   instincts.md   │    │   conventions.md         │
│   mistakes.md    │    │   hebrew-content.md      │
└──────────────────┘    │   game-design.md         │
                        │   ux-findings.md         │
                        └──────────────────────────┘
```

**Per-agent memory (`docs/agents/{agent-name}/`):**
- `learnings.md` — accumulated knowledge specific to their role
- `instincts.md` — atomic behaviors with confidence scores (0.3–0.9)
- `mistakes.md` — errors made and how they were resolved

**Shared knowledge base (`docs/knowledge/`):**
- `patterns.md` — reusable patterns any agent can use
- `corrections.md` — human corrections that all agents should learn from
- `conventions.md` — project conventions that emerged over time
- Domain files: `hebrew-content.md`, `game-design.md`, `ux-findings.md`

**How it works:**
1. After each task, the agent appends what they learned to their personal memory
2. If the learning is useful to other agents, they also write to the shared knowledge base
3. At heartbeat start, each agent reads their own memory + the shared knowledge base
4. Human corrections (board feedback, QA bugs, review comments) get high confidence scores
5. Confidence decays on instincts that stop being relevant

**Self-evolution:**
- PM reviews the shared knowledge base periodically and refactors it
- Patterns that reach high confidence become rules in `AGENTS.md`
- The Architect agent evolves the improvement system itself — updating how agents learn, what they track, and how knowledge is structured

**Bootstrap from Paperclip's built-in skills:**
- `skills/paperclip` — the core heartbeat skill. Teaches agents how to check assignments, checkout tasks, post updates, and follow governance. Every agent gets this automatically.
- `skills/para-memory-files` — Paperclip's PARA-based file memory system (Tiago Forte method). Three layers:
  - **Knowledge graph** (`$AGENT_HOME/life/`) — entity-based storage with `summary.md` + `items.yaml` per entity
  - **Daily notes** (`$AGENT_HOME/memory/YYYY-MM-DD.md`) — raw timeline of events per session
  - **Tacit knowledge** (`$AGENT_HOME/MEMORY.md`) — patterns and preferences about the project
- Agents use this to persist learnings across heartbeats. Facts are atomic YAML entries with confidence. Summaries rewritten weekly. Nothing deleted — only superseded.

**Additional skills from GitHub (via OctoCode):**
- Each agent role can be seeded with domain-specific skills from open source repos
- PM: product management frameworks, game design patterns
- FED: React/TypeScript best practices, animation libraries, accessibility
- UX: child UI patterns, RTL design, color theory for kids
- Content Writer: Hebrew language rules, educational content patterns
- Architect evolves the skill set over time — adding new skills as the project matures

---

## 12. UI & Navigation

### Screens
1. **Login** — Google or email auth (parent does this)
2. **Child picker** — "?מי משחק היום" — tap child avatar
3. **Home** — דובי greets child, topic cards (מספרים, אותיות, קריאה) with star progress
4. **Game list** — games within topic, showing difficulty, stars earned
5. **Game screen** — actual game with audio button, exit button, Hebrew instructions
6. **Parent dashboard** — stats (games played, stars, streak), progress bars per topic

### Navigation rules
- Child flow: Login → Pick child → Home → Topic → Game list → Play → Back
- Parent dashboard: accessible from child picker (behind tap-and-hold gate)
- Every screen has a big back/exit button
- Audio instruction auto-plays on game enter, replay button always visible

---

## 13. Phased Delivery

### Phase 1 — Infrastructure (Week 1)
- Yarn monorepo scaffold
- Vite + React + TS + RTL Hebrew
- Supabase project + initial schema
- Auth (Google + email)
- i18n setup
- `AGENTS.md`, `CLAUDE.md`, docs structure
- Paperclip company + agent onboarding
- Edge TTS script

### Phase 2 — Platform Shell (Week 2)
- Storybook design system
- Login, child picker, home, parent dashboard screens
- Base audio player hook
- Common audio generation (feedback, UI, דובי greetings)

### Phase 3 — Game Engine (Week 3)
- GameLoader, GameShell, GameProps, useGameState
- Game list screen with filtering
- Dynamic component loading
- Star rating + progress save
- First 3 game specs by PM

### Phase 4 — Math/Numbers Module (Weeks 4-5)
- 5-10 math games implemented
- Hebrew content + audio for all games
- Difficulty levels
- QA play-testing
- Performance audit

### Phase 5 — Letters & Reading Module (Weeks 6-7)
- Hebrew alphabet games
- Letter tracing, sounds, word building
- Reading exercises for ages 5-7
- QA play-testing

### Phase 6 — Video & Media (Week 8+)
- Remotion composition templates
- Animated explainer videos
- Hebrew educational songs
- Interactive video segments
- Video player + progress tracking

### Ongoing
- PM continuously drives new features, games, topics
- Gaming Expert invents new game mechanics
- Content Writer produces more Hebrew content + audio
- Media Expert creates more videos and songs
