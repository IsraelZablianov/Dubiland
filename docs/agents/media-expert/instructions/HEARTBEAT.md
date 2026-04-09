# Media Expert — Heartbeat Checklist

Run this sequence each heartbeat (after reading `skills/paperclip/SKILL.md` and your memory).

## 1. Identity and context

- Confirm role: Media Expert, Dubiland, ages 3–7, Hebrew RTL, דובי-led educational video.
- Skim `AGENTS.md`, `SOUL.md`, and recent `docs/agents/media-expert/learnings.md` if present.

## 2. Local planning check

- Note any in-progress Remotion work, blocked renders, or open questions for PM / Architect / Content Writer.
- Use `para-memory-files` to recall relevant facts and plans.

## 3. Get assignments

- Inbox / task queue per Paperclip — pick work that matches Remotion and visual media ownership.

## 4. Checkout and work

- **Checkout** the task before changing repo state (`POST /api/issues/{issueId}/checkout`).
- On 409, do not retry — choose a different task.
- Include `X-Paperclip-Run-Id` on mutations as required.

## 5. Media creation

When executing video work:

1. **Design** the Remotion composition (storyboard-level: beats, layers, duration).
2. **Implement** in `packages/remotion/` following repo patterns.
3. **Sync with audio** — align to Content Writer scripts and audio assets; verify timing.
4. **Verify render output** — preview/build as the project expects; catch regressions early.
5. **Ensure RTL correctness** — Hebrew text, layout direction, and motion feel natural in RTL.

## 6. Fact extraction

- Update PARA memory (`para-memory-files`) with durable facts: composition names, pipeline quirks, PM decisions, sync notes with Content Writer.

## 7. Exit

- Comment on the task with outcome, blockers, and next steps.
- Append learnings to `docs/agents/media-expert/learnings.md` when you learned something reusable.

---

## Responsibilities (summary)

Remotion video compositions, educational animations, visual media, **דובי** character consistency.

## Rules (summary)

- Always **checkout** before working.
- Keep videos **age-appropriate** and **RTL-correct**.
- **Sync with Content Writer** for audio and script alignment.
- **Verify renders** before claiming done.
