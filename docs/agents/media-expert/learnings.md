# Media Expert — Learnings

Accumulated knowledge specific to the Media Expert role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Nano Banana (Gemini Image Generation) Setup

Nano Banana is Google's native image generation built into Gemini. Successfully tested via the web UI with enterprise PRO access.

**What works:**
- Gemini web UI at `gemini.google.com` with `israelz@wix.com` enterprise account
- **Fast mode** generates images in ~15-25 seconds — use this, NOT Thinking mode
- Generated a Dubiland teddy bear mascot (דובי) with excellent quality: warm brown fur, blue backpack, children's book style, white background
- PRO enterprise access provides unlimited image generation

**What doesn't work (yet):**
- API keys from AI Studio return `limit: 0` (billing account is closed on the personal GCP project)
- `gcloud auth application-default login` fails — enterprise blocks `cloud-platform` scope consent
- Vertex AI access blocked by Wix org policy on personal projects

**Next steps to enable API access:**
1. Reactivate billing at `console.cloud.google.com/billing` on the personal GCP project, OR
2. Create a new API key from `aistudio.google.com/apikey` in a fresh project with active billing

**Installed in repo:**
- `@google/genai` npm package (v1.49.0) — ready for API use when key works
- `gcloud` CLI installed via Homebrew — authenticated as `israelz@wix.com`

**Prompt patterns that work well for Dubiland:**
- Always include: "children's book illustration style", "soft pastel colors", "clean white background"
- For mascot: "cute cartoon teddy bear, warm brown fur, big friendly smile, wearing a small blue backpack"
- For letters: "Large Hebrew letter [X] in playful 3D style, bright colors, child-friendly"

## 2026-04-10 — Remotion letters videos should derive runtime duration from TTS clips via metadata

For Dubiland letter videos, the most reliable setup is: keep episode copy in `common.json`, keep TTS mappings in the audio manifest, then let `calculateMetadata` measure clip durations (`@remotion/media-utils`) and return timeline props.

Why it matters:
- avoids hardcoded frame counts drifting from narration updates,
- keeps Hebrew script ownership in i18n while Remotion stays reusable,
- allows one component template to scale from a single letter to a series without timeline rewrites.

Operational note: exposing `packages/web/public/audio/he` into `packages/remotion/public/audio/he` (symlink) makes `staticFile('audio/he/...')` render-ready without duplicating audio assets.

## 2026-04-10 — P0 web illustration packs can be produced quickly with SVG + scripted WEBP exports

For broad visual delivery tickets (mascot states + topic icons + game thumbnails), a stable workflow is:

- author reusable UI illustrations as compact hand-tuned SVG files,
- generate sized WEBP backgrounds/thumbnails with Pillow scripts (primary + 2x variants),
- validate dimensions and syntax immediately (`PIL` size checks, `xmllint` for SVG).

Why it matters:
- keeps asset paths deterministic for FED wiring,
- avoids waiting on manual export tooling for every size variant,
- produces consistent, lightweight files suitable for web integration heartbeats.

## 2026-04-10 — Fast QA pass for mascot SVG tickets

For mascot-asset tasks, a quick and reliable completion gate is:

- verify all required file paths exist,
- run `xmllint --noout` on each SVG,
- ensure no `<text>` nodes or opaque background rectangles are present,
- confirm pose semantics (for RTL hint assets, pointing flow should favor right-to-left interaction cues).

Why it matters:
- catches invalid markup before FED integration,
- prevents hidden background fills that break layered UI usage,
- keeps delivery comments concise with a deterministic file checklist.

## 2026-04-10 — Topic icon QA should avoid literal Latin glyphs in Hebrew-first assets

For `topic-letters` style assets, avoid literal Latin characters (`A`, `B`, etc.) even when paths are vectorized. Use non-text writing motifs or neutral stroke forms so iconography stays locale-safe and avoids violating "no text baked into art."

Fast preview workflow for comment screenshots:
- generate PNG previews with macOS Quick Look (`qlmanage -t -s <size>`),
- keep source deliverables as SVG/WEBP unchanged,
- validate with `xmllint` + `<text>` scan + size checks before closing.

Why it matters:
- prevents culturally mismatched cues in Hebrew learning surfaces,
- keeps acceptance reviews smoother for PM/FED,
- provides reproducible visual proof in task comments without adding heavy tooling.

## 2026-04-10 — P0 thumbnail pack gate: text-free + RTL-flow + contact sheet

For game thumbnail packs, run a fast acceptance gate before closing:
- verify no baked glyphs/letters inside assets,
- verify directional visuals honor RTL learning flow where relevant,
- export a single contact sheet from the 1x set for PM/UX quick review.

Why it matters:
- prevents locale regressions in Hebrew-first surfaces,
- catches art-direction mismatch before FED integration,
- shortens review cycles with one preview artifact.

## 2026-04-10 — Handbook media planning should lock a manifest contract before rendering

For interactive handbook features, media delivery should start with a manifest-first plan:
- per-page video bed mapping,
- audio-key/timestamp pause points,
- preload tiers and byte budgets,
- fixed render profiles.

Why it matters:
- allows FED to wire a deterministic preload + interaction pause engine,
- lets Content Writer and Media run in parallel using stable key contracts,
- avoids re-render churn when only narration timing changes.

## 2026-04-10 — Handle stale `issue_assigned` wakes by trusting inbox state

If `PAPERCLIP_WAKE_REASON=issue_assigned` points to a task that is already `done` and not assigned to this agent, treat it as a stale wake signal:
- verify with `inbox-lite`,
- run one fallback assigned-issue query,
- if still empty, exit heartbeat without checkout.

Why it matters:
- avoids accidental takeovers,
- keeps heartbeats fast and deterministic.

## 2026-04-10 — Handbook protagonist pipeline works best with a fixed brief contract + דובי screen-time cap

For multi-book handbook planning, using a strict character brief template (ID, silhouette, palette, motion profile, RTL notes, and signature prop) prevents style drift across agents and keeps media implementation deterministic.

Operational guardrail that helped: treating דובי as a supporting guide with a 10-20% screen-time target per handbook avoids protagonist repetition while preserving brand continuity.

Why it matters:
- makes illustration and animation handoff to FED/UX easier,
- keeps first-wave books visually distinct,
- reduces late-stage revisions when PM asks for "more variety" in protagonists.

## 2026-04-10 — Magic-letter-map handbook asset pack should ship as full pages + card thumbnails in one pass

For handbook illustration tickets, the fastest production-ready delivery pattern is:
- generate a complete page set under `public/images/handbooks/<slug>/page-01..page-10.png`,
- generate one shared cover at the same location (`cover.png`),
- derive lightweight 16:10 card thumbnails (`512x320`, `1024x640`) under `public/images/games/thumbnails/<gameSlug>/` for Home usage.

Why it matters:
- keeps page art and catalog card assets consistent from one source image,
- avoids rework when FED wires or updates Home fallback thumbnails,
- gives PM/QA a deterministic file checklist for acceptance.

## 2026-04-10 — Wave-2 handbook support lane works best as one consolidated media contract doc

For multi-book implementation waves (books 4-10), media support should ship a single cross-book production brief that includes:
- unique protagonist package per book (pose set, expression set, signature prop),
- text-first composition + motion caps mapped to high-risk pages,
- segment-by-segment shot guidance keyed to each spec's planned video IDs.

Why it matters:
- gives FED/UX/Content one canonical reference instead of seven fragmented pull requests,
- reduces interpretation drift between book specs,
- speeds implementation handoff when multiple FED lanes execute in parallel.

## 2026-04-10 — If checkout reports run-bound snapshot conflict, switch to the snapshot issue

When checkout fails with `Checkout run context is bound to a different issue` and includes `snapshotIssueId`, treat that snapshot issue as the canonical lane for the current run context.

Why it matters:
- avoids wasting heartbeats retrying on lock-contaminated sibling tasks,
- restores mutation ability (comments/status) on the issue actually bound to the run,
- keeps Paperclip traceability aligned with the active execution run.

## 2026-04-10 — DUB-495 critical art replacement can be prepped fully before Gemini auth is restored

For large image-overhaul tasks, useful heartbeat output before generation is possible:
- complete filesystem audit (`path`, `dimensions`, `bytes`, quality score),
- prompt shotlist mapped directly to existing target paths,
- repo-stored blocker evidence screenshot when Gemini shows signed-out state.

Why it matters:
- PM can unblock quickly without re-discovery work,
- generation can resume immediately once auth is restored,
- avoids idle heartbeat cycles on the same blocked instruction.
