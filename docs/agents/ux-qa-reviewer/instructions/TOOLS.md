# UX QA Reviewer — Tools

## Browser Tools (via Cursor MCP)

Your primary tools for visual review. These let you see and interact with the running application.

| Tool | Purpose | When to use |
|------|---------|-------------|
| `browser_navigate` | Go to a URL | Start of each page review |
| `browser_snapshot` | Get page DOM structure | Understand element hierarchy, check for missing elements |
| `browser_screenshot` | Capture visual state | Document visual issues, compare before/after |
| `browser_click` | Click elements | Test interactions, navigation flow, audio feedback |
| `browser_type` / `browser_fill` | Enter text | Test form flows (login, search) |
| `browser_scroll` | Scroll the page | Check below-fold content, sticky headers |
| `browser_resize` | Change viewport size | Test responsive layouts at tablet/mobile |
| `browser_tabs` | List open tabs | Manage browser state |

### Deep-Dive Workflow Pattern

```
1. browser_navigate("http://localhost:3001/{page}")   # Go to focus area
2. browser_snapshot()                                   # Read DOM structure
3. browser_screenshot()                                 # See visual state — write gut reaction
4. [Apply UX lens: analyze against this heartbeat's framework]
5. browser_click({interactive elements})                # Test EVERY interactive element
6. [Check: did it produce audio + visual feedback?]
7. browser_resize(768, 1024)                            # Tablet — primary viewport
8. browser_screenshot()                                 # Analyze responsive quality
9. browser_resize(375, 812)                             # Mobile
10. browser_screenshot()                                # Analyze mobile quality
11. [Compare: what would Khan Academy Kids do here?]
12. [Create improvement tasks in Paperclip]
```

### Game Testing Pattern (for focus area 2)

```
1. Navigate to game page
2. Screenshot initial state — evaluate visual hierarchy, דובי placement
3. Play through first round — verify guaranteed first success
4. Play 5+ rounds — observe difficulty progression
5. Deliberately fail 3 times — check scaffolding and encouragement
6. Go idle for 10 seconds — does דובי nudge?
7. Test at tablet viewport (768px) — primary play device
8. Test at mobile viewport (375px) — secondary
9. Count all interactive elements — test each for audio feedback
10. Score against Gelman's 4 principles (1–5 each)
```

## Shell Tools

For checking dev server status and reading source files when needed.

| Tool | Purpose |
|------|---------|
| `yarn dev` | Start dev server |
| `yarn typecheck` | Verify no type errors |
| File reading tools | Check component source for understanding behavior |

## Paperclip API (Task Creation)

Your primary output is **improvement tasks** in Paperclip.

### Creating improvement tasks

```bash
POST /api/companies/{cid}/issues
{
  "title": "[UX Improvement] {Area} — {Description}",
  "description": "## What I observed\n...\n## Why it matters\n...\n## Recommended improvement\n...\n## Reference\n...\n## Severity\n...",
  "priority": "high|medium|low",
  "assigneeId": "{agent-id}"
}
```

### Task assignment guide

| Finding type | Assign to | Priority guide |
|-------------|-----------|---------------|
| CSS/layout/animation fix | FED Engineer | Based on severity |
| Design system gap | UX Designer | Usually high |
| Systemic pattern (audio system, touch framework) | Architect | Usually high |
| Missing audio/translations | Content Writer | Based on coverage |
| Game mechanic issue | Gaming Expert | Based on impact on learning |
| Product-level gap | PM | Based on benchmark gap |

### Commenting on existing tasks

```bash
POST /api/issues/{id}/comments
{
  "content": "UX review finding: {description with evidence and recommendation}"
}
```

### Updating task status

```bash
PATCH /api/issues/{id}
{
  "status": "done"
}
```

## PARA Memory (Review Tracking)

Use `para-memory-files` skill to persist your rotation state across heartbeats:

```yaml
last_focus_index: 3
last_focus_area: "Responsive & Touch"
last_review_date: "2026-04-10"
last_game_reviewed: "counting-picnic"
rotation_history:
  - { index: 0, date: "2026-04-08", issues: ["DUB-108", "DUB-109"] }
  - { index: 1, date: "2026-04-09", issues: ["DUB-133"] }
```

This ensures you never accidentally repeat the same focus area and can track quality improvement over time.

## Notes

- Always check if the dev server is running before starting review
- Take screenshots at multiple viewport sizes for responsive analysis
- Use DOM snapshots to verify semantic structure, not just visual appearance
- When filing tasks, include the page URL, viewport size, UX principle reference, and specific improvement recommendation
- Focus on creating 2–5 high-quality improvement tasks per heartbeat, not 20 shallow ones
