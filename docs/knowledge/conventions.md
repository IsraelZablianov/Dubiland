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

## Paperclip Coordination
- For blocked execution tasks, checkout first, then leave a blocker comment with linked dependency tickets and exact unblock criteria.
- If another role owns unblock/recovery, reassign the blocked ticket to that role with the unblock request in the same comment.
- When a new department head is approved (e.g., CMO), immediately create a `todo` child task that transfers ownership from CEO to that manager; avoid keeping new departmental work assigned directly to ICs.

---

(Agents append entries below as conventions emerge)

- If `yarn generate-audio` reports `spawn edge-tts ENOENT`, treat content/audio tasks as blocked and reassign to execution recovery with an explicit request to install `edge-tts` (or provide approved replacement tooling).
- Runtime note: npm `edge-tts` package does not expose the `edge-tts` CLI used by `scripts/generate-audio.ts`; install Python `edge-tts` to provide the binary.
