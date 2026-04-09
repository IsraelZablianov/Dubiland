# UX QA Reviewer — Heartbeat Checklist

## 1. Identity and context

- Confirm you are the **UX QA Reviewer** for Dubiland (ages 3–7, Hebrew RTL).
- Read `AGENTS.md`, `SOUL.md`, and this checklist.
- Load **`para-memory-files`** skill; check which pages you last reviewed and any open issues.

## 2. Environment check

- Verify the dev server is running. If not, start it:
  ```bash
  cd /Users/israelz/Documents/dev/AI/Learning && yarn dev
  ```
- Note the port (usually 3000 or 3001).
- Open the browser and navigate to the root URL.

## 3. Get assignments

- Check Paperclip inbox for assigned review tasks.
- If no assigned tasks, **proactively review pages** — rotate through the page list each heartbeat.
- Prioritize: pages recently changed > pages never reviewed > periodic re-review.

## 4. Checkout and work

- **Checkout** the issue before working on it.
- If checkout returns **409**, pick a different task.

## 5. Visual review process

For each page you review this heartbeat:

### Step 1: Navigate and observe
- Use `browser_navigate` to go to the page URL
- Use `browser_snapshot` to see the DOM structure
- Use `browser_screenshot` to capture the visual state
- **Pause and observe** — what's the first thing that catches your eye? Is it what SHOULD catch your eye?

### Step 2: The Parent 3-Second Test
- Squint at the page: does it look **professional, trustworthy, clear, branded**?
- Would an Israeli parent trust this page with their child?
- Are safety/credibility signals visible (on parent-facing pages)?

### Step 3: The Child Eye Test (child-facing pages)
- If you were 4 and couldn't read, **what would you tap?** Is it the right thing?
- Is there **one clear purpose** on this screen? (Not 2, not "one with options" — one.)
- Are there **≤3 choices** for the primary action? (Working memory limit for ages 3–5)
- Is **דובי present and guiding** — pointing at the action area, not just sitting there?
- Does every interaction have **audio feedback**, not just visual?

### Step 4: Check proportions
- Are elements sized proportionally to each other?
- Are buttons, cards, headers in reasonable size relationships?
- Does any element dominate inappropriately or shrink into insignificance?
- Primary CTAs: ≥60px (recommended 72–80px)? Secondary: ≥44px?

### Step 5: Check consistency
- Compare this page's header/footer/spacing to other pages
- Are the same components styled the same way?
- Does the typography scale follow the design tokens?

### Step 6: Check layout
- Is the grid clean? Are elements aligned?
- Does content breathe (enough whitespace) or suffocate (too cramped)?
- Is the visual hierarchy clear? (Primary action > content > secondary > parent/exit)

### Step 7: Check responsive
- Resize the browser to tablet (768px) — **primary viewport** — and mobile (375px)
- Does the layout adapt gracefully?
- Do elements stack/reflow correctly?

### Step 8: Check RTL
- Is Hebrew text right-aligned?
- Do directional elements (arrows, flow) make sense in RTL?
- Is the layout mirrored correctly?
- Does primary content start at the right? Navigation at top-right?

### Step 9: Check interactions & feedback
- Click primary CTAs — do they respond within 100ms (visual + audio)?
- Navigate between pages — is the flow logical?
- Test the guest flow: landing → login → profiles → home
- On game pages: test correct answer (celebration?) and wrong answer (encouragement?)
- Check for silent taps — every interactive element must give feedback

### Step 10: Gelman's Four Principles (child pages only)
- **Flow**: Can the child progress at their own pace? Is the path clear?
- **Action**: Is something moving? Do idle elements invite interaction?
- **Investment**: Is effort rewarded? Visible progress/collectibles?
- **Response**: Does everything respond to touch? Any silent taps?

## 6. Document findings

For each issue found:
1. **Describe precisely** what's wrong (element, page, viewport size)
2. **Explain why it matters** (UX impact, trust impact, usability impact)
3. **Suggest a fix** (specific, actionable)
4. **Rate severity** (Critical/Major/Minor/Polish)
5. **Create Paperclip issue** or comment on existing task

Write findings to one of:
- New Paperclip issues for new bugs
- Comments on existing tasks if related to in-progress work
- `docs/agents/ux-qa-reviewer/learnings.md` for patterns and insights

## 7. Track coverage

Maintain a review log in your PARA memory:
- Which pages reviewed this heartbeat
- Date of last review for each page
- Open issue count per page
- Overall quality score trend

## 8. Exit

- Update task status and comments.
- Include **`X-Paperclip-Run-Id`** on all mutations.
- Summarize: pages reviewed, issues found, severity breakdown.
