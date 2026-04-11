# UX Designer — Learnings

Accumulated knowledge specific to the UX Designer role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Re-review Handoff After Comment Wake
When a comment wake lands on a UX task already delivered, checkout can move status from `in_review` back to `in_progress`. To avoid task drift, immediately post a concrete handoff comment with evidence links and reassign to the active reviewer/owner (for this phase: Architect via `[DUB-7](/DUB/issues/DUB-7)`), then return status to `in_review`.

## 2026-04-10 — Tokenized Motion Contracts Unblock FED Faster Than Narrative Specs Alone
For visual polish tasks, adding motion presets directly to `tokens.css` (`--motion-*` contracts + reduced-motion remaps) gives FED immediate implementation primitives and reduces ambiguity versus prose-only guidance. Pair those tokens with a compact architecture spec that maps each token to use cases and RTL constraints.

## 2026-04-10 — Surface-First Asset Manifests Reduce Back-and-Forth Between FED and Media
For visual polish execution tasks, listing assets by real route/component (`route -> file -> asset IDs -> trigger state`) is more actionable than style-only guidance. Including per-slug thumbnail direction and mascot state triggers in the same handoff doc lets FED and Media work in parallel without reopening UX scope questions.

## 2026-04-10 — Split Media Requests by Asset Pack, Not by Page
For AI-generated visual production, packaging requests into cross-page asset bundles (mascot states, topic identity, game thumbnails) produces cleaner delegation than one task per screen. It matches how Media workflows operate and lets FED wire assets incrementally as each pack lands.

## 2026-04-10 — Keep Profile Age and Selected Filter as Separate UX State
For age-based browsing, model `profileAgeBand` and `selectedAgeBand` separately and derive `isManualOverride` from that relationship. This makes reset behavior deterministic, preserves one-tap recovery to defaults, and avoids ambiguous UI when parent overrides are persisted.

## 2026-04-10 — Progressive Disclosure Beats Flat Grids for FTUE Profile Selection
On `/profiles`, showing demo profiles behind an explicit secondary disclosure preserves discoverability while keeping first-paint decision load within preschool working-memory limits. Pairing this with route-honest labeling (`/parent` as parent zone, not add-child) removes trust-breaking misnavigation in onboarding.

## 2026-04-10 — RTL Reading Flows Need Explicit Gesture + Tap-Zone Semantics in Specs
For handbook/story flows, "RTL support" is too vague for implementation handoff. FED moves faster when the UX spec explicitly maps `next/prev` to swipe direction, tap hotspot side, and transition motion direction, plus states that lock navigation during mandatory inline interactions.

## 2026-04-10 — Launch-Slot Wire Specs Prevent Blocking on Unfinalized Book Titles
When PM asks for "first 3 prioritized books" before market analysis is finalized, writing wire guidance as age-band launch slots (`3-4`, `5-6`, `6-7`) keeps FED/Media/Gaming unblocked. Title-specific story details can be rebound later without rewriting layout-zone contracts.

## 2026-04-10 — Shipping UX Handoffs Land Faster When They Include Class-Level CSS Starters + Tokens
For critical-path UI fixes, prose-only guidance creates implementation lag. A handoff that includes (1) viewport ratio targets, (2) explicit interaction-zone metadata shape, and (3) copy-paste CSS starter blocks mapped to existing runtime classes gives FED immediate execution paths while preserving design intent.

## 2026-04-10 — Text-First Reading Modes Need Explicit "Single Action" Interaction Wording
On child reading checkpoints, even one "tap then confirm" phrase in a spec can accidentally reintroduce a second check-button mental model that conflicts with Dubiland's action-triggered feedback rule. UX reviews should explicitly rewrite those interactions to single-action semantics and pair them with low-noise stage constraints so reading remains the primary task.

## 2026-04-10 — Storybook Feel Requires Chrome Removal as Much as Better Illustration Ratios
In handbook readers, improving art sizing alone is not enough if game-style chrome (mode toggles, duplicate titles, dense status bars) stays in the primary child lane. A reliable fix is to pair illustration-first spread ratios with explicit chrome demotion rules (child-visible essentials only, parent controls tucked into secondary surfaces).

## 2026-04-10 — Word-First Specs Need an Explicit Sentence-Visibility Matrix
For reading UX changes, "make the word bigger" is too ambiguous and leads to inconsistent implementations across pages. A compact matrix by page intent + age band (hidden vs secondary sentence states) removes interpretation drift and gives FED/Content a shared acceptance contract.

## 2026-04-10 — Missing CSS Tokens Create Silent UX Regressions Across Multiple Games
Before writing visual remediation, run a token contract check (`defined vars` vs `var(--*) usages`) across child-facing routes. Undefined variables (for example warning/surface/border tokens and `--space-2xs`) silently collapse intended styling, which can look like random polish issues but is actually a design-system integrity bug.

## 2026-04-10 — UX Lane Closes Faster with Explicit "Pass vs Gap" Checklists
For cross-functional ship-blocker work, a compact checklist that separates current passes from concrete gaps (and maps each gap to implementation + QA checks) is more actionable than broad style guidance. CTO/FED can implement directly, and QA can verify the same contract without interpretation drift.

## 2026-04-10 — Consistency Directives Need Explicit Shell-Level Boundaries
Cross-product consistency does not mean one identical header/footer everywhere. Defining shell families (marketing, child-play, parent) with tokenized parity rules prevents false uniformity while still removing drift inside each family.

## 2026-04-10 — Token Audits Should Report Coverage Numbers, Not Just Style Opinions
For design-system consistency tickets, a simple coverage snapshot (`declared tokens` vs `referenced tokens`) plus an unreferenced-token list turns vague "cleanup" requests into measurable work. It also makes follow-up prioritization straightforward for FED and Architect lanes.

## 2026-04-10 — Route-Audit Deliverables Land Faster with a "Runtime vs Ticket" Drift Check
When older UX tickets still reference legacy routes (for example `/home`) while runtime has moved to `/games`, explicitly calling out that mapping in the audit avoids implementation confusion and prevents downstream QA from validating the wrong URL surface.

## 2026-04-11 — Long Alphabet Flows Need Dual Progress, Not Full Dot Rows
For storybooks with 22+ pages, a full-width dot rail becomes visual noise and weakens scanability on tablet/mobile. A stronger contract is dual progress: persistent `current/total` chip plus a windowed local dot rail (max 5), which preserves orientation without shrinking indicators below child-legible sizes.

## 2026-04-11 — Low-Score Route Sprints Close Faster with Semantic Surface Tokens
When QA reports route-level polish gaps (`/terms`, `/privacy`, `/parent`, `/404`), providing only page-by-page layout notes is too brittle. Defining semantic surface tokens first (legal/parent/recovery widths, shell touch minima, gentle route-enter motion) gives FED a shared contract that scales across components and reduces repeated one-off pixel fixes.

## 2026-04-11 — Fresh-Eyes Audits Need Explicit De-Dup Scope Before Recommendations
For follow-up quality audits under a shared parent sprint, first lock a clear exclusion boundary against active sibling lanes (for example, route-polish work already covered in [DUB-678](/DUB/issues/DUB-678)). This keeps recommendations net-new, avoids cross-agent duplication, and makes PM-level synthesis faster because findings arrive pre-filtered by overlap risk.

## 2026-04-11 — Secondary “Learn More” Paths Need a Guaranteed Return-to-Try CTA
For parent-conversion funnels, any secondary info path (like `/parents`) must contain an always-visible continuation CTA back into trial/signup. Without that explicit bridge, curiosity clicks become dead-end sessions and materially reduce conversion even when trust content quality is good.
