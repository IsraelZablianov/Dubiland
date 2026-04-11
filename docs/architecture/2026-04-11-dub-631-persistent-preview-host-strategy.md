# DUB-631: Persistent Preview Host Strategy for DUB-375 Stability Proof

Date: 2026-04-11  
Owner: Architect (CTO)  
Related issues: [DUB-631](/DUB/issues/DUB-631), [DUB-375](/DUB/issues/DUB-375), [DUB-50](/DUB/issues/DUB-50), [DUB-42](/DUB/issues/DUB-42)

## Decision

For the 60+ minute validator stability proof, Dubiland will use a **persistent preview host** that does not depend on a long-running local adapter process.

Primary route:

1. Publish a stable public preview URL from persistent infrastructure (not ephemeral `trycloudflare` host process lifetime).
2. Run probe window checks against the same host at start and after >=60 minutes.
3. Run Schema.org validation payload capture against that same host and store raw artifacts.

This replaces the prior short-lived tunnel approach that repeatedly expired before SEO validation handoff.

## Why

Previous runs proved two things:

1. Route and schema checks can pass from a clean runtime.
2. Local execution lifecycle can still kill preview/tunnel processes before end-of-window evidence is collected.

So the blocker is not schema implementation quality; it is host durability across the full proof window.

## Owner Split

1. Backend Engineer owns persistent host provisioning + runbook + health checks.
2. FED Engineer 2 owns [DUB-375](/DUB/issues/DUB-375) execution proof on the canonical host (start/end probes + validator artifacts).
3. Architect owns coordination, acceptance contract, and cross-ticket closeout sequencing.

## Proof Contract (Required Artifacts)

All artifacts must target one unchanged host URL and include UTC timestamps.

1. Host metadata:
- canonical preview URL
- deployment timestamp
- commit SHA or build identifier

2. Start-of-window probes:
- HTTP status for `/`, `/letters`, `/parents/faq`, `/robots.txt`
- validator-like UA route checks (`validator.schema.org`, `Googlebot/2.1`, `Google-InspectionTool/1.0`)

3. Schema.org validation payloads:
- raw response headers and raw response body for `/`, `/letters`, `/parents/faq`
- parsed summary table (`status`, `numObjects`, `totalNumErrors`, `totalNumWarnings`)

4. End-of-window probes (>=60 minutes after start):
- repeat route probe matrix for `/`, `/letters`, `/parents/faq`, `/robots.txt`
- same host, same path set, timestamped

5. Pass/fail table:
- row per required check
- clear pass/fail outcome with artifact path reference

## Acceptance Gate

`DUB-631` is proof-ready only when all conditions hold:

1. Same host used for both start and end checkpoints.
2. End checkpoint occurs >=60 minutes after start.
3. Required routes stay reachable (`HTTP 200`) at both checkpoints.
4. Schema.org payload evidence exists as raw artifacts for all 3 content routes.
5. Evidence is posted on [DUB-375](/DUB/issues/DUB-375) and linked back to [DUB-50](/DUB/issues/DUB-50).

## Risks and Fallback

1. If primary host rotates or expires before the end checkpoint, the run is invalid and must restart from a new start timestamp.
2. If Schema.org access becomes challenge-limited from one runtime, retry from a clean runtime but keep host unchanged.
3. If persistent host infrastructure is unavailable, escalate immediately with blocker owner and ETA; do not continue ephemeral host retries without a durability window.
