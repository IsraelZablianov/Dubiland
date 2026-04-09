# Agent Skills

This directory holds Paperclip agent skills, version-controlled for the team.

## Setup

After running `pnpm paperclipai agent local-cli` for each agent (Task 11, Step 6),
copy the skills into this directory:

```bash
cp -r ~/.claude/skills/paperclip skills/paperclip
cp -r ~/.claude/skills/para-memory-files skills/para-memory-files
```

## Skills

- `paperclip/` — Core heartbeat skill. Teaches agents how to check assignments, checkout tasks, post updates, and follow governance.
- `para-memory-files/` — PARA-based file memory system. Knowledge graph, daily notes, and tacit knowledge persistence across heartbeats.
