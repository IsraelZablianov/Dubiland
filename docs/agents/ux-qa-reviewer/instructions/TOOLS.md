# UX QA Reviewer — Tools

## Browser Tools (via Playwright MCP)

Your primary tools for visual review. These let you see and interact with the running application.
The Playwright MCP server runs in **headless** mode — you won't see a browser window, but all tools work.

**How element interaction works:** Always call `browser_snapshot` first. The snapshot returns a structured accessibility tree where each element has a `ref` attribute (like `ref="e42"`). Use that `ref` value to target elements in `browser_click`, `browser_type`, etc.

| Tool | Purpose | When to use |
|------|---------|-------------|
| `browser_navigate` | Go to a URL (`url` param) | Start of each page review |
| `browser_snapshot` | Get page accessibility tree with `ref` attributes | **Always call before interacting** — understand element hierarchy |
| `browser_take_screenshot` | Capture visual state as image | Document visual issues, compare before/after |
| `browser_click` | Click an element (`ref` param from snapshot) | Test interactions, navigation flow |
| `browser_type` | Type text into an element (`ref` + `text` params) | Test form flows (login, search). Use `submit: true` to press Enter |
| `browser_fill_form` | Fill multiple form fields at once (`fields` param) | Fill entire forms efficiently |
| `browser_hover` | Hover over an element (`ref` param) | Check hover states, tooltips |
| `browser_press_key` | Press a keyboard key (`key` param) | Scroll with PageDown, navigate with arrows |
| `browser_resize` | Change viewport (`width` + `height` params) | Test responsive layouts at tablet/mobile |
| `browser_tabs` | List/close/select tabs (`action` param) | Manage browser state |
| `browser_wait_for` | Wait for time or text (`time` or `text` param) | Wait for animations, page loads |
| `browser_evaluate` | Run JavaScript on the page (`function` param) | Check computed styles, scroll position, custom checks |
| `browser_close` | Close the browser | Clean up when done |

### Deep-Dive Workflow Pattern

```
1. browser_navigate({ url: "http://localhost:3000/{page}" })
2. browser_snapshot()                                         # Read accessibility tree — get ref attributes
3. browser_take_screenshot()                                  # See visual state — write gut reaction
4. [Apply UX lens: analyze against this heartbeat's framework]
5. browser_click({ ref: "e42", element: "Start button" })     # Test interactive elements using ref from snapshot
6. [Check: did it produce audio + visual feedback?]
7. browser_resize({ width: 768, height: 1024 })               # Tablet — primary viewport
8. browser_take_screenshot()                                   # Analyze responsive quality
9. browser_resize({ width: 375, height: 812 })                # Mobile
10. browser_take_screenshot()                                  # Analyze mobile quality
11. [Compare: what would Khan Academy Kids do here?]
12. [Create improvement tasks in Paperclip]
13. browser_close()                                            # Clean up
```

### Scrolling

There is no dedicated scroll tool. Use one of these approaches:
- `browser_press_key({ key: "PageDown" })` — scroll down one viewport
- `browser_press_key({ key: "End" })` — scroll to bottom
- `browser_evaluate({ function: "() => window.scrollBy(0, 500)" })` — precise pixel scroll
- `browser_click` on an element below the fold — Playwright auto-scrolls to it

### Game Testing Pattern (for focus area 2)

```
1. Navigate to game page
2. browser_snapshot() → browser_take_screenshot() — evaluate visual hierarchy, דובי placement
3. Play through first round — verify guaranteed first success
4. Play 5+ rounds — observe difficulty progression
5. Deliberately fail 3 times — check scaffolding and encouragement
6. browser_wait_for({ time: 10 }) — does דובי nudge after idle?
7. browser_resize({ width: 768, height: 1024 }) — primary play device
8. browser_resize({ width: 375, height: 812 }) — secondary
9. Count all interactive elements from snapshot — test each for audio feedback
10. Score against Gelman's 4 principles (1–5 each)
11. browser_close()
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
