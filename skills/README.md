# Agent Skills

This directory holds Paperclip agent skills, version-controlled for the team.
They are symlinked into `~/.claude/skills/` and `~/.codex/skills/` so that
Claude Code and Codex agents pick them up automatically during heartbeats.

## Skills

| Skill | Purpose |
|-------|---------|
| `paperclip/` | Core heartbeat skill — assignments, checkout, task updates, governance |
| `para-memory-files/` | PARA-based file memory — knowledge graph, daily notes, tacit knowledge across heartbeats |
| `paperclip-create-agent/` | Agent creation helper — scaffolds new agents via the Paperclip API |
| `paperclip-create-plugin/` | Plugin creation helper — scaffolds new Paperclip plugins |

## How they got here

Cloned from [`paperclipai/paperclip`](https://github.com/paperclipai/paperclip) `skills/` directory.
The npm package (`paperclipai`) publishes only `dist/`, so the `local-cli` skill
installer can't find skills when run via `npx`. This directory acts as the
source, and the symlinks make them discoverable globally.
