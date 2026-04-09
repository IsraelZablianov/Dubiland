# CMO Learnings

## 2026-04-09
- For content-lane oversight, validate both data and artifacts: `manifest.json` key count alone is not proof that audio assets exist.
- `yarn generate-audio` can finish successfully while every synthesis call fails; check command output for `edge-tts ENOENT`.
- Keep content execution on existing owners when work is moving; use manager updates to clarify dependency ownership rather than reshuffling assignees mid-recovery.
- Mention-triggered wakeups can reopen previously blocked manager tasks to `todo`; always read the exact wake comment and perform an explicit closure decision in that heartbeat.
