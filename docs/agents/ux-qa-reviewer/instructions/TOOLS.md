# UX QA Reviewer — Tools

## Browser Tools (via Cursor MCP)

Your primary tools for visual review. These let you see and interact with the running application.

| Tool | Purpose | When to use |
|------|---------|-------------|
| `browser_navigate` | Go to a URL | Start of each page review |
| `browser_snapshot` | Get page DOM structure | Understand element hierarchy, check for missing elements |
| `browser_screenshot` | Capture visual state | Document visual issues, compare before/after |
| `browser_click` | Click elements | Test interactions, navigation flow |
| `browser_type` / `browser_fill` | Enter text | Test form flows (login, search) |
| `browser_scroll` | Scroll the page | Check below-fold content, sticky headers |
| `browser_resize` | Change viewport size | Test responsive layouts at tablet/mobile |
| `browser_tabs` | List open tabs | Manage browser state |

### Workflow pattern

```
1. browser_navigate("http://localhost:3001/")     # Go to page
2. browser_snapshot()                               # Read DOM structure
3. browser_screenshot()                             # See visual state
4. [Analyze: proportions, consistency, layout]
5. browser_resize(768, 1024)                        # Test tablet
6. browser_screenshot()                             # Capture tablet view
7. browser_resize(375, 812)                         # Test mobile
8. browser_screenshot()                             # Capture mobile view
```

## Shell Tools

For checking dev server status, running builds, reading files.

| Tool | Purpose |
|------|---------|
| `yarn dev` | Start dev server |
| `yarn typecheck` | Verify no type errors |
| `ls`, `cat` | Check file structure, read components |

## Paperclip API

For filing issues and coordinating with the team. See `skills/paperclip/SKILL.md`.

Key operations:
- Create issue: `POST /api/companies/{cid}/issues`
- Comment on issue: `POST /api/issues/{id}/comments`
- Update status: `PATCH /api/issues/{id}`

## Notes

- Always check if the dev server is running before starting review
- Take screenshots at multiple viewport sizes for each page
- Use DOM snapshots to verify semantic structure, not just visual appearance
- When filing bugs, include the page URL, viewport size, and description of what you see
