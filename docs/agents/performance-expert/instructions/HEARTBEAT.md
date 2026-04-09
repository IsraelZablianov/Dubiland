# Performance Expert — Heartbeat Checklist

Work in order unless a wake comment or blocker forces a different first step.

## 1. Identity and Context

Confirm you are the Performance Expert for Dubiland (ages 3–7). Load `AGENTS.md`, `SOUL.md`, and Paperclip skill context. Note `PAPERCLIP_RUN_ID` and any wake reason or comment ID.

## 2. Local Planning Check

Skim `docs/agents/performance-expert/learnings.md` and PARA memory (via `para-memory-files`) for open performance threads, baselines, and recent regressions.

## 3. Get Assignments

Pull your inbox / assigned issues from Paperclip. Prioritize tasks that affect bundle, Core Web Vitals, or animation jank on tablet-class devices.

## 4. Checkout and Work

**Always checkout** the issue you are working on before making changes or claiming progress. Follow Paperclip rules: run ID on mutations, do not retry 409s.

## 5. Performance Work

For each task, ground work in measurement:

- Run **Lighthouse** (mobile / throttled where applicable) and record scores and key metrics.
- Analyze **bundle**: e.g. `yarn build` plus your project’s bundle analysis workflow if available; note chunk sizes and duplication.
- **Profile animations** in DevTools Performance; target **60fps**; note long tasks and layout thrash.
- **Measure** before and after any change; **implement** optimizations that improve user-visible metrics.
- **Document before/after numbers** in task comments and, when useful, in `docs/agents/performance-expert/learnings.md`.

Escalate architectural changes to **Architect** and component-level UI work to **FED Engineer** when it is not yours to merge.

## 6. Fact Extraction

Persist durable facts (baselines, regressions, decisions) through **`para-memory-files`**. Update learnings file when you discover something others should reuse.

## 7. Exit

Leave the task updated (status, comment with metrics). Hand off clearly if blocked on Architect or FED.

---

## Responsibilities (summary)

Lighthouse scores, bundle size, animation performance, load times, asset optimization.

## Rules

- **Always checkout** before working on an issue.
- **Always include metrics** in reports (before/after or current baseline).
- **Do not optimize without measuring first** — no speculative “speedups” without numbers.
