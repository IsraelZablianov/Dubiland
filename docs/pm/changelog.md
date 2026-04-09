# Dubiland Changelog

Product changelog maintained by the PM (CEO). Record significant product decisions, shipped features, and milestone events in reverse chronological order.

## Format

```markdown
### YYYY-MM-DD — Title
- What changed and why
- Related task/issue ID if applicable
```

---

### 2026-04-10 — Lock-cleanup wave 2 opened; technical lane ownership normalized
- Created critical Ops Watchdog remediation lane [DUB-158](/DUB/issues/DUB-158) to clear stale execution-lock conflicts on PM-owned technical blockers and publish a before/after lock matrix.
- Reassigned canonical technical lanes back to [Architect](/DUB/agents/architect) and kept them `blocked` until [DUB-158](/DUB/issues/DUB-158) completes: [DUB-155](/DUB/issues/DUB-155), [DUB-152](/DUB/issues/DUB-152), [DUB-141](/DUB/issues/DUB-141), [DUB-85](/DUB/issues/DUB-85), [DUB-98](/DUB/issues/DUB-98).
- Closed noise lanes as superseded: [DUB-105](/DUB/issues/DUB-105), [DUB-137](/DUB/issues/DUB-137), [DUB-138](/DUB/issues/DUB-138), [DUB-139](/DUB/issues/DUB-139), [DUB-140](/DUB/issues/DUB-140).
- Load-balanced cross-functional parent [DUB-112](/DUB/issues/DUB-112) to [Co-Founder](/DUB/agents/co-founder) while PM retains [DUB-1](/DUB/issues/DUB-1) portfolio coordination.

### 2026-04-10 — Co-Founder tagging checkpoint closed; CTO lock-normalization gate still open
- Co-Founder coordination lane [DUB-156](/DUB/issues/DUB-156) is `done` with checkpoint comments posted on [DUB-141](/DUB/issues/DUB-141), [DUB-143](/DUB/issues/DUB-143), and parent [DUB-112](/DUB/issues/DUB-112).
- Tagging child-lane snapshot now stands at: [DUB-141](/DUB/issues/DUB-141) `todo`, [DUB-143](/DUB/issues/DUB-143) `in_progress`, [DUB-145](/DUB/issues/DUB-145) `done`.
- Decision: keep parent orchestration issue [DUB-1](/DUB/issues/DUB-1) in `in_progress` and hold closure until [DUB-155](/DUB/issues/DUB-155) posts the CTO owner/ETA lock-normalization matrix.

### 2026-04-10 — Lock-conflicted PM technical lanes escalated; tagging coordination load-balanced
- PM checkout attempts on [DUB-112](/DUB/issues/DUB-112), [DUB-98](/DUB/issues/DUB-98), [DUB-105](/DUB/issues/DUB-105), and [DUB-137](/DUB/issues/DUB-137)-[DUB-140](/DUB/issues/DUB-140) all returned first-attempt `409` execution-lock conflicts; no retries were performed.
- Created critical CTO remediation lane [DUB-155](/DUB/issues/DUB-155) to normalize stale execution locks and restore canonical ownership routing.
- Created Co-Founder coordination lane [DUB-156](/DUB/issues/DUB-156) to drive [DUB-141](/DUB/issues/DUB-141), [DUB-143](/DUB/issues/DUB-143), and [DUB-145](/DUB/issues/DUB-145) while parent [DUB-112](/DUB/issues/DUB-112) remains lock-conflicted.
- Updated parent coordination on [DUB-1](/DUB/issues/DUB-1) with the next gate: CTO owner/ETA and lock-normalization update on [DUB-155](/DUB/issues/DUB-155).

### 2026-04-10 — Tagging system requirement delegated into CTO/UX/Gaming lanes under lock conflict
- New parent requirement [DUB-112](/DUB/issues/DUB-112) was triaged as cross-functional with technical ownership led by [Architect](/DUB/agents/architect).
- Direct checkout on [DUB-112](/DUB/issues/DUB-112) and workload-rebalance lane [DUB-98](/DUB/issues/DUB-98) returned `409` stale execution-lock conflicts; no retry performed per heartbeat policy.
- Opened execution lanes under [DUB-112](/DUB/issues/DUB-112): CTO architecture/delivery routing [DUB-141](/DUB/issues/DUB-141), UX filter spec [DUB-143](/DUB/issues/DUB-143), and age-taxonomy rubric [DUB-145](/DUB/issues/DUB-145).
- Updated parent coordination on [DUB-1](/DUB/issues/DUB-1) with explicit next gate: CTO lock-normalization path + owner/ETA matrix for [DUB-98](/DUB/issues/DUB-98) and [DUB-112](/DUB/issues/DUB-112).

### 2026-04-10 — PM lock cleanup executed and CTO ownership restored
- Performed PM run-control release on [DUB-107](/DUB/issues/DUB-107), [DUB-105](/DUB/issues/DUB-105), [DUB-89](/DUB/issues/DUB-89), and [DUB-85](/DUB/issues/DUB-85) to clear stale ownership conflicts.
- Reassigned active technical lanes to [Architect](/DUB/agents/architect): [DUB-107](/DUB/issues/DUB-107), [DUB-89](/DUB/issues/DUB-89), and [DUB-85](/DUB/issues/DUB-85); kept [DUB-105](/DUB/issues/DUB-105) `blocked` as a legacy supersede/close candidate.
- Updated parent coordination on [DUB-1](/DUB/issues/DUB-1) with the next gate: CTO posts refreshed owner/ETA matrix after first checkout pass on [DUB-107](/DUB/issues/DUB-107).

### 2026-04-10 — Watchdog lock remediation re-routed after CTO conflict report
- CTO reported that both [DUB-105](/DUB/issues/DUB-105) and [DUB-89](/DUB/issues/DUB-89) were still uncheckoutable due stale execution locks and moved [DUB-105](/DUB/issues/DUB-105) to `blocked`.
- Opened fresh critical CTO lane [DUB-107](/DUB/issues/DUB-107) under [DUB-1](/DUB/issues/DUB-1) to normalize lock metadata and restore canonical ownership for the watchdog-authz remediation path.
- Confirmed product direction: keep the remediation architecture on the board-privileged automation endpoint path once lock normalization is complete.

### 2026-04-10 — Critical watchdog recovery remediation delegated to CTO
- Reconfirmed checkout conflict on [DUB-89](/DUB/issues/DUB-89) caused by stale execution lock metadata (`executionRunId` left on queued run), then avoided retry per policy.
- Created critical CTO unblock/remediation lane [DUB-105](/DUB/issues/DUB-105) under [DUB-1](/DUB/issues/DUB-1) to normalize lock state and deliver a watchdog permission-boundary fix proposal.
- Posted coordination update on [DUB-1](/DUB/issues/DUB-1#comment-74173a18-8e9a-4457-a8f1-457d815d3231) to keep parent strategy status accurate while execution remains delegated.

### 2026-04-10 — CTO lane added to rebalance FED load and protect QA throughput
- Added [DUB-98](/DUB/issues/DUB-98) under [DUB-1](/DUB/issues/DUB-1) and assigned it to [Architect](/DUB/agents/architect) to rebalance active FE/QA ownership after Watchdog bottleneck alert.
- Confirmed pending-game normalization coordinator [DUB-88](/DUB/issues/DUB-88) moved to `in_progress`, keeping CEO work at delegation/orchestration level.
- Checkout on critical ops alert [DUB-89](/DUB/issues/DUB-89) and legacy provisioning lane [DUB-20](/DUB/issues/DUB-20) hit execution-run conflicts; no retry performed per heartbeat policy.

### 2026-04-10 — Pending game parents re-routed to CTO coordination
- Checked out [DUB-1](/DUB/issues/DUB-1) and delegated unresolved pending game parents [DUB-29](/DUB/issues/DUB-29), [DUB-30](/DUB/issues/DUB-30), [DUB-31](/DUB/issues/DUB-31), and [DUB-32](/DUB/issues/DUB-32) through new CTO coordination lane [DUB-88](/DUB/issues/DUB-88).
- Preserved momentum on already-active implementation lanes [DUB-28](/DUB/issues/DUB-28), [DUB-59](/DUB/issues/DUB-59), and [DUB-60](/DUB/issues/DUB-60) to avoid duplicate delegation.
- Captured lock-drift risk on [DUB-31](/DUB/issues/DUB-31) (`executionRunId` present with no active run while assignee is Children Learning PM) and folded normalization into [DUB-88](/DUB/issues/DUB-88).

### 2026-04-10 — Letter Tracing Trail execution lanes delegated from CEO orchestration
- Wake context highlighted [DUB-30](/DUB/issues/DUB-30) as the next game kickoff, but checkout was blocked by run-ownership conflict while assignee remained [Children Learning PM](/DUB/agents/children-learning-pm).
- Delegated the full implementation pipeline under [DUB-30](/DUB/issues/DUB-30): CTO delivery [DUB-85](/DUB/issues/DUB-85), mechanics tuning [DUB-86](/DUB/issues/DUB-86), and Hebrew i18n/audio coverage [DUB-87](/DUB/issues/DUB-87).
- Decision: keep CEO at orchestration level and drive sequence through child lanes rather than taking direct IC ownership.

### 2026-04-10 — Color Garden recovered and delegated; residual lock wrappers escalated
- Recovered [DUB-60](/DUB/issues/DUB-60) checkout path after board lock-normalization verification and kept Co-Founder ownership at orchestration level.
- Opened Color Garden execution lanes: mechanics [DUB-76](/DUB/issues/DUB-76), CTO delivery [DUB-77](/DUB/issues/DUB-77), and Hebrew i18n/audio [DUB-78](/DUB/issues/DUB-78); all moved to `todo` for assignee pickup.
- Recovery wrapper lanes [DUB-63](/DUB/issues/DUB-63) and [DUB-64](/DUB/issues/DUB-64) still show run-ownership conflicts and were re-escalated to PM normalization task [DUB-72](/DUB/issues/DUB-72) with fresh evidence.

### 2026-04-10 — More or Less Market kickoff delegated into execution lanes
- Activated parent implementation issue [DUB-28](/DUB/issues/DUB-28) and kept it in `in_progress` as the coordination umbrella.
- Created cross-functional child lanes: mechanics review [DUB-67](/DUB/issues/DUB-67), CTO delivery [DUB-68](/DUB/issues/DUB-68), and Hebrew i18n/audio [DUB-69](/DUB/issues/DUB-69).
- Decision: keep CEO at orchestration level while CTO owns implementation + QA routing and Content Writer owns audio/text coverage.

### 2026-04-10 — Delegation flow recovered for new game and SEO lock-conflicted lanes
- Direct PM execution lanes [DUB-59](/DUB/issues/DUB-59), [DUB-60](/DUB/issues/DUB-60), and [DUB-61](/DUB/issues/DUB-61) hit checkout conflicts (`409`) and could not be worked in-place.
- Routed recovery ownership to CTO through fresh executable lanes: [DUB-63](/DUB/issues/DUB-63), [DUB-64](/DUB/issues/DUB-64), and [DUB-65](/DUB/issues/DUB-65).
- Kept parent coordination active on [DUB-1](/DUB/issues/DUB-1) and [DUB-24](/DUB/issues/DUB-24) with explicit next gates for ETA/owner matrix and SEO validation unblock confirmation.

### 2026-04-09 — SEO route rollout accepted and parent closed
- Closed [DUB-22](/DUB/issues/DUB-22) as accepted after final CMO PASS review.
- Captured non-blocking follow-up in [DUB-55](/DUB/issues/DUB-55) for canonical fallback alignment.
- Implementation and acceptance lanes completed: [DUB-38](/DUB/issues/DUB-38), [DUB-44](/DUB/issues/DUB-44), [DUB-39](/DUB/issues/DUB-39).

### 2026-04-09 — Execution-lock cleanup escalated to Ops Watchdog
- Replacement CTO lock-recovery lane [DUB-52](/DUB/issues/DUB-52) reproduced the same stale checkout-lock conflict pattern and moved to `blocked`.
- Delegated platform-level remediation to Ops Watchdog via [DUB-56](/DUB/issues/DUB-56) to clear stale execution-lock metadata and restore CTO checkout flow.
- Updated parent coordination on [DUB-1](/DUB/issues/DUB-1) with three active gates: QA closeout ([DUB-5](/DUB/issues/DUB-5)), SEO acceptance ([DUB-39](/DUB/issues/DUB-39)/[DUB-43](/DUB/issues/DUB-43)), and lock cleanup ([DUB-56](/DUB/issues/DUB-56)).

### 2026-04-09 — SEO rollout status normalized and lock recovery rerouted
- Closed CTO implementation lane [DUB-38](/DUB/issues/DUB-38) as delivered-by-delegation after [DUB-44](/DUB/issues/DUB-44) shipped route split/indexability implementation notes.
- Reopened CMO SEO-acceptance lane [DUB-39](/DUB/issues/DUB-39) to `todo` now that implementation dependency is complete.
- Superseded stuck lock-recovery coordinator [DUB-51](/DUB/issues/DUB-51) (self-lock conflict) with fresh executable CTO lane [DUB-52](/DUB/issues/DUB-52).

### 2026-04-09 — SEO implementation lanes delegated; lock recovery escalated
- Delegated public-route SEO implementation [DUB-22](/DUB/issues/DUB-22) to dual owners: CTO execution lane [DUB-38](/DUB/issues/DUB-38) and CMO SEO-acceptance lane [DUB-39](/DUB/issues/DUB-39).
- Delegated JSON-LD foundation implementation [DUB-24](/DUB/issues/DUB-24) to CTO/CMO lanes [DUB-41](/DUB/issues/DUB-41) and [DUB-42](/DUB/issues/DUB-42).
- Created CTO lock-normalization task [DUB-51](/DUB/issues/DUB-51) to recover stale execution-lock state and restore delegation flow on blocked/stuck tasks.

### 2026-04-09 — Phase 3 game implementation kickoff started
- Completed CEO kickoff delegation for Counting Picnic: [DUB-27](/DUB/issues/DUB-27) delegated to CTO execution lane [DUB-46](/DUB/issues/DUB-46).
- Identified stale execution-lock blockers preventing clean checkout/delegation on [DUB-28](/DUB/issues/DUB-28), [DUB-29](/DUB/issues/DUB-29), [DUB-30](/DUB/issues/DUB-30), [DUB-31](/DUB/issues/DUB-31), [DUB-32](/DUB/issues/DUB-32); included in [DUB-51](/DUB/issues/DUB-51) recovery scope.

### 2026-04-09 — CTO assigned final Phase 2 closeout loop
- Created CTO-owned closeout task [DUB-9](/DUB/issues/DUB-9) under [DUB-1](/DUB/issues/DUB-1) to own QA execution unblock/fix routing through completion.
- Decision: keep CEO at strategy/cross-functional coordination level while technical delivery risk remains managed by engineering leadership.
- Active critical path remains QA execution on [DUB-5](/DUB/issues/DUB-5), with CTO accountable for technical unblock if defects/blockers appear.

### 2026-04-09 — Phase 2 Platform Shell entered QA gate
- FED moved platform shell implementation to review on [DUB-4](/DUB/issues/DUB-4) with all core routes delivered (`/login`, `/profiles`, `/home`, `/parent`).
- QA handoff was activated on [DUB-5](/DUB/issues/DUB-5), making QA execution the only remaining critical path for Phase 2 closure.
- Technical recovery coordinator [DUB-7](/DUB/issues/DUB-7) was closed as `done` after dependency recovery completed.

### 2026-04-09 — Content lane ownership moved to CMO and completed
- Board-approved CMO hire (approval [cf61aeab](/DUB/approvals/cf61aeab-c06b-4b1e-9398-88fefefbaf7e)) enabled manager-level routing for content/marketing work.
- CMO-owned content stream [DUB-8](/DUB/issues/DUB-8) completed; dependency [DUB-3](/DUB/issues/DUB-3) is `done` with Hebrew i18n expansion and audio generation coverage delivered.

<!-- Add new entries above this line -->
