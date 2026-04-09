# 🧸 דובילנד — Dubiland

**A Hebrew learning platform for kids ages 3–7, built and maintained by a team of AI agents.**

> A friendly teddy bear named דובי (Dubi) guides children through math, letters, and reading
> via games, videos, and songs — all in Hebrew, all listenable, all fun.

---

## What is this?

Dubiland is an open-source edtech platform where **13 AI agents** collaborate autonomously to design, build, test, and improve a children's learning app. A human (the "board of directors") provides direction — the agents do the rest.

The entire product — from game design documents to React components to Hebrew audio files — is created and evolved by agents running on [Paperclip](https://paperclip.dev), an AI agent orchestration platform.

### Core principles

- **Gaming is the primary learning method** — no worksheets, no drills
- **Everything is listenable** — kids don't read, they hear (Edge TTS with Hebrew voice)
- **Hebrew-first** — full RTL, i18n-ready for future languages
- **No restrictions** — difficulty is suggested, never enforced
- **Agents continuously improve** — they learn from mistakes, accumulate knowledge, and get better over time

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · TypeScript · Vite |
| Styling | CSS with design tokens (storybook theme) |
| Routing | React Router |
| i18n | i18next + react-i18next |
| Backend | Supabase (Auth · Postgres · Storage · RLS) |
| Video | Remotion (build-time generation) |
| TTS | Edge TTS — `he-IL-HilaNeural` |
| Monorepo | Yarn 4 workspaces |
| AI Orchestration | Paperclip |

---

## Project Structure

```
dubiland/
├── packages/
│   ├── web/                  # React + TypeScript app (Vite)
│   │   └── src/
│   │       ├── components/   # Shared UI + design system
│   │       ├── games/        # Game engine + individual games
│   │       ├── pages/        # Route screens
│   │       ├── hooks/        # Shared React hooks
│   │       ├── lib/          # Supabase client, audio, utils
│   │       ├── styles/       # Theme + global styles
│   │       └── i18n/         # Locale files (he/)
│   ├── shared/               # Shared types + constants
│   └── remotion/             # Video generation (build-time)
├── supabase/                 # Migrations, seed data, config
├── scripts/                  # TTS generation, DB seeding
├── docs/
│   ├── specs/                # Design specifications
│   ├── games/                # Game design documents
│   ├── architecture/         # Technical decisions
│   ├── knowledge/            # Shared agent learnings
│   └── agents/               # Per-agent instructions + memory
└── skills/                   # Paperclip agent skills
```

---

## The AI Team

Dubiland is built by **13 specialized AI agents**, each with their own role, heartbeat schedule, personality, and accumulated knowledge. They coordinate through Paperclip — checking out tasks, posting updates, delegating work, and learning from feedback.

```
You (Board of Directors)
  └── PM
       ├── Children Learning PM
       ├── Architect
       │     ├── FED Engineer
       │     ├── FED Engineer 2
       │     ├── QA Engineer
       │     ├── QA Engineer 2
       │     └── Performance Expert
       ├── UX Designer
       ├── Gaming Expert
       ├── Content Writer
       ├── Media Expert
       └── CMO
```

| Agent | Heartbeat | What they do |
|---|---|---|
| **PM** | 20 min | Product roadmap, feature specs, game ideas, prioritization |
| **Children Learning PM** | 20 min | Edtech expertise — learning objectives, platform benchmarks |
| **Architect** | 30 min | System design, data models, schema, game engine API |
| **FED Engineer** (×2) | 20 min | Build UI, games, components, pages |
| **UX Designer** | 45 min | Design system, child-friendly layouts, RTL, design tokens |
| **Gaming Expert** | 45 min | Game mechanics, difficulty balancing, engagement for ages 3–7 |
| **Content Writer** | 30 min | Hebrew text, audio scripts, TTS generation |
| **Media Expert** | 60 min | Remotion video compositions, song animations |
| **QA Engineer** (×2) | 20 min | Code review, testing, accessibility, RTL validation |
| **Performance Expert** | 60 min | Bundle size, animations, Lighthouse scores |
| **CMO** | — | Marketing, growth, messaging |

### How agents learn

Each agent maintains personal memory and contributes to a shared knowledge base:

```
docs/agents/{name}/
  ├── learnings.md     # Accumulated role-specific knowledge
  ├── instincts.md     # Atomic behaviors with confidence scores
  └── mistakes.md      # Errors made and resolutions

docs/knowledge/        # Shared across all agents
  ├── patterns.md
  ├── conventions.md
  ├── corrections.md
  └── ...domain files
```

High-confidence patterns get promoted to project rules. The system is self-evolving.

---

## How Paperclip Works

[Paperclip](https://paperclip.dev) is the orchestration layer that manages the agent team.

**Heartbeat model:** Agents don't run continuously. Paperclip wakes each agent on a schedule (their heartbeat interval). During a heartbeat, the agent:

1. Reads their instructions + memory
2. Checks their inbox for assigned tasks
3. Checks out a task (locking it from other agents)
4. Does useful work — writes code, creates specs, reviews PRs, generates audio
5. Posts updates, delegates subtasks, and exits

**Key concepts:**
- **Tasks** — units of work with status, assignee, and comments
- **Checkout** — an agent locks a task before working on it (prevents conflicts)
- **Delegation** — agents create subtasks and assign them to the right specialist
- **External instructions** — all agent prompts live in the repo under `docs/agents/`, version-controlled alongside the code they produce

---

## Content Areas

| Topic | What kids learn | Example activities |
|---|---|---|
| **מספרים** (Math) | Counting, number recognition, bigger/smaller, basic arithmetic | Count animals, pop number balloons, sort sequences |
| **אותיות** (Letters) | Hebrew alphabet, letter shapes, letter sounds | Trace letters, match letter to sound, letter bingo |
| **קריאה** (Reading) | Word building, syllables, early reading | Drag letters to build words, match words to pictures |

---

## Game Engine

Adding a new game = **one React component + one database row**.

```typescript
interface GameProps {
  game: Game
  level: GameLevel
  child: Child
  onComplete: (result: GameResult) => void
  audio: AudioController
}
```

The `GameShell` wrapper provides audio controls, star display, exit button, and automatic progress saving. Games focus purely on their mechanic — the engine handles everything else.

**New game workflow:**
1. PM writes spec → `docs/games/{game-name}.md`
2. Gaming Expert reviews mechanics
3. FED implements the component
4. Content Writer adds Hebrew text + generates audio
5. DB row inserted → game appears in app

---

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn 4 (corepack)
- A Supabase project (for auth and data)

### Setup

```bash
# Clone
git clone https://github.com/IsraelZablianov/Dubiland.git
cd Dubiland

# Install
corepack enable
yarn install

# Environment
cp packages/web/.env.example packages/web/.env.local
# Fill in your Supabase URL and anon key

# Run
yarn dev
```

### Available scripts

| Command | Description |
|---|---|
| `yarn dev` | Start the web app in development mode |
| `yarn build` | Production build |
| `yarn typecheck` | TypeScript checking across all packages |
| `yarn generate-audio` | Generate Hebrew TTS audio from i18n files |

---

## Themes

Kids choose a visual theme that reskins the entire experience while game logic stays identical:

| Theme | Mascot | Feel |
|---|---|---|
| 🧸 דובי (Bear) | Teddy bear | Warm storybook — **default** |
| ⚽ כדורגל (Football) | Footballer | Sporty, energetic, green |
| 🦄 קסם (Magic) | Unicorn | Sparkly, fantasy, purple |
| 🚀 חלל (Space) | Astronaut | Stars, rockets, dark blue |
| 🌊 ים (Ocean) | Fish / mermaid | Underwater, waves, teal |

A theme is a config object — colors, mascot, asset paths, i18n overrides — stored on the child profile. Components read the current theme from context.

---

## Design Decisions

- **Audio-first UX** — every piece of text has a corresponding `.mp3` generated by Edge TTS. Audio auto-plays on screen entry.
- **Optimistic updates** — all writes update UI instantly, sync to Supabase in background. A child's experience is never interrupted by network latency.
- **RLS everywhere** — each family can only read/write their own children's progress. Games and videos are public read.
- **i18n from day one** — all strings in locale JSON files, never hardcoded. Adding a language = new folder + new audio.
- **44px minimum tap targets** — designed for small fingers on tablets.

---

## License

This project is open source. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <em>Built with ❤️ by a human director and 13 AI agents</em>
</p>
