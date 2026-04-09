# Content Writer — Learnings

Accumulated knowledge specific to the Content Writer role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Locale-driven audio manifest and runtime dependency
Expanded Hebrew UI copy can be generated to a namespaced audio manifest directly from locale JSON keys, but this workspace currently lacks `edge-tts`, so generation updates `manifest.json` while mp3 files fail with `spawn edge-tts ENOENT`.
