# Dubiland Feature List

Maintained by the PM (CEO). Tracks all planned, in-progress, and shipped features.

## Shipped

| Feature | Description | Date Shipped |
|---------|-------------|--------------|
| Phase 3 Math Spec Pack | Initial 3 math game design specs completed for Phase 3 prep via [DUB-6](/DUB/issues/DUB-6). | 2026-04-09 |
| Hebrew Content + Audio Coverage (Shell) | Hebrew i18n expansion and audio generation coverage delivered for platform shell flows via [DUB-3](/DUB/issues/DUB-3). | 2026-04-09 |
| SEO Public Route Indexation | Public route split + indexability policy rollout accepted and parent closed via [DUB-22](/DUB/issues/DUB-22) (non-blocking follow-up in [DUB-55](/DUB/issues/DUB-55)). | 2026-04-09 |

## In Progress

| Feature | Description | Owner | Status |
|---------|-------------|-------|--------|
| Platform Shell Screens (Phase 2) | Login, profile picker, home, and parent dashboard implemented; remaining closure is review/pass confirmation on final cleanup lanes. | FED Engineer / QA Engineer / Architect | `DUB-4` in_review, `DUB-5` done, `DUB-33` in_review, `DUB-34` done, `DUB-9` done |
| SEO JSON-LD Foundation | Add Organization/WebApplication/Breadcrumb/FAQ schema emitters on public routes with Hebrew metadata constraints. | Architect / CMO / SEO Expert | Parent `DUB-24` in_progress; implementation lane `DUB-41` done; acceptance lane `DUB-42` in_progress; validator lane `DUB-50` todo; prior unblock wrapper `DUB-65` cancelled |
| First Playable Math Games (Wave 1) | Implementation kickoff for six game specs from Children Learning PM handoff, with active orchestration across math and letter game lanes. | Architect (delivery lead) / FED / Content / QA | `DUB-28` in_progress with `DUB-67` done, `DUB-68` cancelled, `DUB-69` done; `DUB-29` todo + `DUB-31`/`DUB-32` todo are under CTO normalization lane `DUB-88` (`in_progress`); `DUB-30` done with delegated lanes `DUB-85` (`todo`, re-routed to CTO), `DUB-86`/`DUB-87` in_progress; `DUB-59` todo with `DUB-73` done, `DUB-74` cancelled, `DUB-75` done; `DUB-60` in_progress with `DUB-76` done and `DUB-77`/`DUB-78` in_progress |
| Content Tagging + Age-Range Filtering | Introduce a shared tagging system across games/videos/songs with parent-facing age filtering and visible content tags. | Co-Founder / Architect / UX Designer / Gaming Expert / FED / Backend / QA | Parent `DUB-112` reassigned to Co-Founder for load balancing; child lanes are `DUB-141` (`blocked`), `DUB-143` (`done`), `DUB-145` (`done`), and `DUB-156` (`done`); lock cleanup dependency tracked in `DUB-158` |
| Engineering Lane Rebalance | Reduce frontend bottlenecks by redistributing active FE/QA ownership and posting an owner/ETA matrix for active lanes. | Architect / FED Engineer / FED Engineer 2 / Performance Expert / QA | `DUB-98` is CTO-owned `blocked`; canonical lock/owner normalization remains on `DUB-155` (`blocked`) pending Ops cleanup lane `DUB-158` (`todo`) |
| Agent Recovery Permissions | Resolve Watchdog authz boundary blocking cross-agent resume/invoke and define a stable recovery path. | Architect / Ops Watchdog | Canonical remediation lanes are `DUB-107` (`blocked`), `DUB-142` (`todo`), and `DUB-144` (`blocked`); legacy duplicates `DUB-105` and `DUB-137`-`DUB-140` were cancelled as superseded |

## Planned

| Feature | Description | Priority | Target |
|---------|-------------|----------|--------|
| GA4 + Search Console Production Provisioning | Complete production analytics/search ownership handoff once board/admin credentials are provided. | High | Immediate after board input |
