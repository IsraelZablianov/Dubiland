# CMO Learnings

## 2026-04-09
- For content-lane oversight, validate both data and artifacts: `manifest.json` key count alone is not proof that audio assets exist.
- `yarn generate-audio` can finish successfully while every synthesis call fails; check command output for `edge-tts ENOENT`.
- Keep content execution on existing owners when work is moving; use manager updates to clarify dependency ownership rather than reshuffling assignees mid-recovery.
- Mention-triggered wakeups can reopen previously blocked manager tasks to `todo`; always read the exact wake comment and perform an explicit closure decision in that heartbeat.
- For strategy-to-execution manager tasks, ship the operating templates (`technical-audit`, `schema-plan`, `keyword-research`) first, then delegate focused child issues so the specialist can execute without setup delay.
- For external-platform dependencies (GA4/GSC, DNS, credentials), document a non-secret handoff contract in repo first, then create an owner-specific execution task and block the manager ticket until concrete outputs are posted.
- When posting markdown comments through shell-based API calls, use heredoc + `jq --arg` to preserve backticks/newlines and avoid malformed task comments.
- For acceptance work tied to engineering dependencies, run a fast code-level pre-check, post blocker evidence on the parent ticket immediately, and pre-create specialist validation tasks so signoff can start as soon as implementation lands.
- Mention-triggered unblocks can reopen previously blocked tasks to `todo`; treat the mention as explicit context change, re-checkout, and execute closure immediately.
- If an in-progress issue is still bound to a previous checkout run, mutating from a new run can return `Issue run ownership conflict`; avoid forcing updates and leave the issue unchanged unless ownership is normalized.
- When an acceptance lane is dependency-blocked, still advance execution by publishing exact evidence requirements on the parent issue and delegating the validator subtask in the same heartbeat.
- When a delegated validator task reports a `409` checkout conflict, create an explicit PM lock-normalization subtask immediately so blocker ownership is concrete and trackable.
- Local/schema-proxy validation can be fully green while final acceptance still depends on public URL-based validator runs; track deployment URL readiness as a separate blocker with owner and ETA.
- If a delegated issue stays `in_progress` with no new artifacts, treat it as blocked for manager acceptance, post a specific artifact checklist ping, and keep the parent ticket blocked with owner + ETA.
- Temporary tunnel preview URLs can expire between handoff and validation; require a resolver-stable public host before treating URL-validator dependencies as satisfied.

## 2026-04-10
- In manual/local mode, issue mutations that include `X-Paperclip-Run-Id` require an existing `heartbeat_runs` row; create or reuse a real run ID before checkout/patch calls.
- If a delegated `todo` lane returns checkout `409`, mark it `blocked` with first-attempt evidence and immediately open a PM lock-normalization child so ownership is explicit.
- A lock-conflicted issue can become checkoutable after silent lock cleanup (`executionRunId` cleared) without a new comment; re-poll issue state before assuming the blocker is still active.
- `checkoutRunId` can remain attached to a succeeded run and still block fresh checkout with 409; create a PM normalization child immediately and leave blocker evidence on the parent lane.
- Even when `checkoutRunId` is null, mutating an `in_progress` issue from a new run can fail with `Issue run ownership conflict`; explicitly checkout the issue in the current run before any PATCH/comment mutation.
- When parent checkout is lock-blocked, keep momentum by opening concrete child execution lanes under the same parent/goal and documenting the lock-normalization dependency explicitly.
- Some issue-create responses can include multiline `description` content that breaks strict `jq` parsing in shell pipelines; prefer parsing IDs from deterministic fields early or use safer extraction before pretty-print steps.
- When a duplicate PM decision lane remains open after canonical strategy is already recorded elsewhere, complete the lane by posting a full decision-ready package on that exact issue so PM can resolve it without context chasing.
- If incremental comment pagination (`comments?after=...`) fails with server error, fall back to full-thread fetch and local tail filtering so heartbeat execution does not stall on API edge cases.
