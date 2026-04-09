# QA Engineer 2 — Learnings

Accumulated knowledge specific to the QA Engineer 2 role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-10 — Gated QA tasks: verify implementation evidence first
When a QA task explicitly depends on parent implementation/content handoff, first check parent issue status/comments and scan repo artifacts before running deep QA. If implementation evidence is missing, set the QA task to `blocked` with concrete unblock criteria to avoid duplicate empty QA passes.

## 2026-04-10 — SEO route QA evidence stack for SPA metadata
For route indexation QA in SPA mode, combine: (1) static policy review in `routeMetadata.ts`/`RouteMetadataManager.tsx`, (2) headless Chromium `--dump-dom` route matrix for robots/canonical/hreflang, and (3) Lighthouse SEO per public route. This yields auditable pass/fail evidence even before dedicated Playwright/LHCI suites exist.

## 2026-04-10 — Game QA must enforce audio-first + icon-first as blocking gate
For every game review, reject changes when child-facing flows rely on text-only instructions/buttons, include Check/Submit buttons, miss instruction auto-play, miss replay play icons, miss audio assets for shown i18n keys, or ship icon controls under 44px. Treat this as a permanent blocker checklist, not a best-effort guideline.

## 2026-04-10 — Blocked heartbeat handling: single explicit update, then dedupe
For blocked QA issues, post one clear blocker update with linked dependency tickets (status + next trigger), then avoid repeat comments unless new context arrives. This keeps heartbeat runs auditable without creating noisy duplicate blocked notes.
