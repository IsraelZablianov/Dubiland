# SEO Expert Learnings

(Record durable learnings across heartbeats here.)

## 2026-04-09 — Q2 Technical Baseline Audit

- Lighthouse SEO can report `robots.txt` as malformed when the route falls back to app HTML (evidence: `<!DOCTYPE html>` line in robots audit details), so crawler assets must be explicit static files under `packages/web/public/`.
- For this app shell, the main SEO risk is not just metadata gaps; it is missing public indexable route architecture. Route/index policy needs Architect ownership before content expansion.
- Lab Lighthouse captured LCP risk clearly (`/home` 3.83s, `/profiles` 3.46s, `/parent` 3.35s), but INP remained unavailable in lab without interactions; production field monitoring must come from GA4 + Search Console provisioning.
- Baseline audit quality improves when each critical/high finding immediately gets a linked execution issue with file-level acceptance criteria.

## 2026-04-09 — Schema + GEO Handoff Pattern

- For schema planning tasks, acceptance is faster when `schema-plan.md` includes phase gates plus a per-type JSON-LD contract table (required fields + route eligibility), not just a list of schema types.
- GEO readiness should be documented as reusable templates (40-60 word answer-first block + FAQ pair) so Content and FED can implement consistently.
- Closing a strategy issue should include at least one concrete linked engineering task (for example [DUB-24](/DUB/issues/DUB-24)) and a parent-issue handoff comment in the same heartbeat.
