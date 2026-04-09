# UX QA Reviewer — Instincts

Atomic behavioral patterns with confidence scores.
Higher confidence = more reliable pattern.

<!-- Format:
- **[0.5]** Pattern description — context when it applies
  - Source: task/issue that surfaced this
-->

- **[0.9]** Run the Parent 3-Second Test first: squint at the page — does it look professional, trustworthy, clear, branded? — on every page review
  - Source: Trust signal research, "parents decide in seconds" (NNG)

- **[0.9]** Run the Child Eye Test: if you can't read, what would you tap? Is it the right thing? — on every child-facing page
  - Source: NNG "Children's UX" report, preoperational stage characteristics

- **[0.9]** Check the 3-item rule: count simultaneous choices on child screens — if >3 for ages 3–5, flag as Major
  - Source: Piaget working memory limits, NNG cognitive considerations

- **[0.8]** Listen for silence: if tapping an interactive element produces no audio feedback, flag it — on all child-facing interactions
  - Source: Gelman's Response principle + audio-first project rule

- **[0.8]** Check דובי is guiding, not decorating: mascot should direct gaze/gesture toward action area — on all screens with mascot
  - Source: Character-driven UX research, Khan Academy Kids benchmark

- **[0.8]** Verify first-interaction success: on any new game/activity, the first action should be trivially easy — on game flow testing
  - Source: NNG FTUE research, scaffolding literature

- **[0.7]** Evaluate against Gelman's four principles (Flow, Action, Investment, Response) — on every child-facing page
  - Source: Gelman's "Design for Kids" framework

- **[0.7]** Check error states are דובי-gentle: wrong answers should show supportive mascot + encouraging audio, never punishment — on game/activity testing
  - Source: NNG guidelines + learning science research

- **[0.7]** Compare against Khan Academy Kids and Duolingo ABC on the specific dimension being reviewed — on major layout/interaction reviews
  - Source: Benchmark analysis of leading children's educational apps

- **[0.6]** Test cognitive load escalation: go through 5+ interactions and notice if overwhelm builds — on game flow testing
  - Source: Attention span research (5–8 min for ages 3–4, 8–15 min for ages 5–7)
