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

## 2026-04-11 — Run-ownership conflict can block comments as well as status updates

When an issue is `in_progress` with `checkoutRunId=null`, comment mutations can fail with `Issue run ownership conflict` even for the same agent identity.

Practical workaround pattern:
- execute recovery communication in a separate assigned issue lane,
- mirror status to required parent/coordinator issues,
- record blocker owner + next action + ETA there until lock normalization happens.

## 2026-04-10 — When a media lane asks for a manifest, verify and publish mapping even if assets already exist

For follow-up illustration tasks that duplicate an earlier asset-delivery lane, the fastest compliant closure is:
- verify the full file set exists at runtime paths,
- validate key dimensions against expected contracts,
- publish a page-id to asset-path manifest in the active issue comment (with linked parent/source issues),
- close the lane as `done` once mapping + validation is posted.

Why it matters:
- avoids unnecessary regeneration churn,
- gives FED/QA deterministic wiring references in the current execution lane,
- preserves traceability when parent orchestration creates new handoff issues for already-shipped media.

## 2026-04-10 — Split handbook visual readiness into two gates: packaging pass vs art-quality pass

For handbook image lanes, run the quality gate as two explicit checks:
- technical packaging readiness (format coverage + preload budget + pipeline pass),
- visual storybook readiness (depth, variation, launch-grade art direction).

Why it matters:
- prevents false "ready" calls when file budgets pass but artwork is still placeholder quality,
- gives PM a clean unblock plan (auth + handbook-only replacement lane) without stalling on full-system art backlog.

## 2026-04-10 — Cross-surface media consistency work needs one shared Dubi contract before asset replacement

For consistency directives that span web images, mascot assets, and Remotion, define one explicit Dubi identity contract first (shape, palette, backpack signature, role policy, RTL gesture direction), then audit every surface against it.

Why it matters:
- reveals drift quickly (for example, inline Remotion mascot vs SVG mascot pack vs handbook scene mascot),
- keeps replacement work focused on a single visual target instead of parallel style experiments.

## 2026-04-11 — `issue_commented` wakes can rotate run ownership on the same ticket

When a new heartbeat wake (`PAPERCLIP_WAKE_REASON=issue_commented`) lands on the same issue, the ticket can keep `executionRunId` but lose `checkoutRunId`, and mutations fail with `Issue run ownership conflict` until checkout is repeated for the new run.

Why it matters:
- prevents false assumptions that "same issue" means checkout is still valid,
- keeps blocker/status updates reliable by forcing an explicit re-checkout per run context.

## 2026-04-11 — Playwright MCP `Transport closed` is a hard blocker for Nano Banana web-ui tasks

When `mcp__playwright__*` calls all fail with `Transport closed`, Gemini generation work cannot proceed at all, even if the board has already unblocked headless mode settings.

Practical handling:
- mark the active media execution lane `blocked` with exact failing calls,
- set blocker owner to infra/runtime (Architect) rather than content/auth owners,
- keep ETA anchored to "time after transport restore" for predictable resumption.

## 2026-04-11 — Gemini can accept prompts while signed out but still refuse image creation

In signed-out state, Gemini may still process prompt submission and return text, but image generation is blocked with a clear auth message (for example: cannot create images now + sign-in prompt).

Why it matters:
- prevents false positives where transport appears healthy but generation is still impossible,
- clarifies blocker ownership should shift from runtime infra to board auth completion once this message appears.

## 2026-04-11 — Board can switch media execution mode mid-stream; re-read AGENTS before acting

The board can change image-generation workflow in-flight (for example from Playwright-driven Gemini to proxy comments). When this happens, re-open `docs/agents/media-expert/instructions/AGENTS.md` immediately and pivot the active issue to the new contract.

Why it matters:
- avoids wasting heartbeats on superseded tooling assumptions,
- keeps issue comments aligned with the latest governance path (`## 🎨 Image Generation Request` format in proxy mode).

## 2026-04-11 — Proxy generation lane should stay blocked until board confirms saved file paths

After posting a `## 🎨 Image Generation Request`, do not keep the lane in `in_progress` without new board output. Re-checkout each heartbeat, verify for new board reply, then move the issue back to `blocked` with explicit unblock action and mirror the state on parent/coordinator issues.

Why it matters:
- keeps inbox state accurate for Ops and PM,
- prevents duplicate prompt spam,
- preserves clean unblock ownership (`local-board`) for board-proxy image delivery.

## 2026-04-11 — When board says "ask me in comments", send a smaller immediate batch instead of referencing older payloads

If board replies with a generic readiness note, post a fresh `## 🎨 Image Generation Request` with a compact batch (2-3 assets) and exact prompts/paths in that same heartbeat, then set status back to `blocked` with `blocker: board image generation`.

Why it matters:
- reduces ambiguity compared with pointing to older long requests,
- improves turnaround probability on the next board interaction,
- keeps the issue lifecycle aligned with proxy workflow rules.

## 2026-04-11 — Use git HEAD vs working-tree panel generation for fast before/after checkpoint evidence

When board-proxy image files land as uncommitted changes, generate `HEAD` vs current side-by-side panels with `ffmpeg hstack` and attach manifest paths in the parent checkpoint comment.

Why it matters:
- satisfies before/after evidence without browser capture,
- keeps proofs reproducible directly from repo state,
- speeds milestone reporting for PM/QA.

## 2026-04-11 — Include extension token in evidence panel filenames to avoid png/webp collisions

When generating before/after panels for assets that share basename across formats (for example `page-01.png` and `page-01.webp`), include extension markers in panel filenames. Otherwise panels overwrite each other and evidence becomes incomplete.

Why it matters:
- preserves one-to-one traceability per delivered file,
- prevents silent loss of comparison artifacts,
- keeps checkpoint manifests reliable for QA review.

## 2026-04-11 — Keep handbook generation in contiguous page batches to preserve narrative style consistency

For multi-page handbook art, request contiguous page ranges (for example 04-07, then 08-10) with one shared style block and explicit per-page prompts.

Why it matters:
- improves visual continuity across adjacent pages,
- makes board delivery and validation checkpoints easier to audit,
- reduces rework from style drift between isolated single-page requests.

## 2026-04-11 — Always hash-verify board-delivered files against HEAD before claiming completion

A board delivery comment can report success while repo files still match baseline byte-for-byte. Add a hash-based `Changed vs HEAD` check to the validation step and request per-file SHA-256 from board when deltas are missing.

Why it matters:
- prevents false-positive checkpoints,
- catches copy/save path mismatches early,
- keeps evidence claims auditable.

## 2026-04-11 — On process-lost retries, re-checkout even if issue appears in_progress

After interrupted runs (`process_lost_retry`), explicitly call checkout again before posting corrective comments; this rebinds run ownership and prevents stale mutation errors.

Why it matters:
- keeps run audit linkage correct,
- avoids silent ownership drift after transport failures,
- ensures blocker comments attach to the active run.

## 2026-04-11 — If run-ownership conflicts persist, verify JWT `run_id` against `PAPERCLIP_RUN_ID`

On some retries, `PAPERCLIP_RUN_ID` can differ from the run id embedded in `PAPERCLIP_API_KEY`. Ownership-guarded mutations may fail with 409 until checkout/mutations use the effective run id expected by the API.

Why it matters:
- explains seemingly random ownership conflicts,
- prevents repeated no-op retries,
- keeps blocked/disposition updates deliverable under heartbeat deadlines.

## 2026-04-11 — For letter-association art, lock filename slugs by letter, not by chosen word

For alphabet storybook lanes, image filenames should be stable letter-based IDs (`letter-01-alef`, etc.) and association words should live in a separate manifest. If PM/Content changes the pedagogy word later, path stability is preserved and FED wiring does not churn.

Why it matters:
- avoids renaming dozens of assets when copy changes,
- keeps image-cache and integration references stable across heartbeats,
- allows Media and Content Writer to iterate independently without breaking runtime paths.

## 2026-04-11 — Truncated SHA values in board comments can still be trusted after full local hash match

When board posts abbreviated hashes (prefix/suffix), verify full local SHA-256 values and ensure they align with the posted fragments plus changed-vs-HEAD checks before closing the lane.

Why it matters:
- allows fast closure without requesting redundant full-hash reposts,
- preserves verification rigor,
- reduces blocker churn once delta is proven.

## 2026-04-11 — For UX-QA continuation lanes, mixed compact batches unblock faster than thumbnail-only batches

When a single issue asks for "backgrounds + thumbnails + polish", the fastest board-proxy start is a compact mixed batch (route backgrounds + one mascot state + 1-2 game thumbnail masters) instead of only one asset type.

Why it matters:
- gives PM visible progress on low-score routes immediately,
- starts fallback-thumbnail replacement in parallel,
- reduces risk of another heartbeat spent only on re-scoping.

## 2026-04-11 — Cross-team assignment correction should happen immediately after checkout validation

If inbox assigns a non-media planning task to Media Expert, checkout first, validate scope against role, then reassign to PM/owner lane in the same heartbeat with a concise routing comment.

Why it matters:
- keeps Media heartbeats focused on production work,
- prevents orphaned tasks in the wrong functional queue,
- preserves traceability because reassignment is run-linked and documented.

## 2026-04-11 — Community distribution pilot tasks can be closed from media lane with source-backed channel mapping

For cross-functional growth tasks assigned into Media Expert (for example, parent distribution pilots), a reliable closure pattern is:
- checkout and close in the assigned lane instead of bouncing ownership,
- build a source-backed channel map with concrete links (FB/WA/creator/media),
- package execution-ready outputs in one comment (2-week cadence, post concepts, moderation, feedback tags, top-2 focus channels).

Why it matters:
- keeps heartbeat throughput high when routing is imperfect,
- gives CMO/PM immediately executable assets instead of abstract recommendations,
- preserves traceability by finishing in the active issue run.

## 2026-04-11 — Shared episode-ID contracts prevent media/content/runtime drift in interactive video lanes

For multi-lane video features (Media + Content + FED), publish one source-of-truth episode contract file early (IDs, key families, audio file paths, runtime slug) and have all lanes consume it.

Why it matters:
- keeps Remotion composition IDs, audio generation targets, and runtime payload mapping aligned,
- reduces late-stage renaming churn,
- makes checkpoint timing handoff deterministic (`timeline.checkpoints[]`).
