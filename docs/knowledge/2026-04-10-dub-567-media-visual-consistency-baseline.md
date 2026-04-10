# DUB-567 — Media Visual Asset + Mascot Consistency Baseline (2026-04-10)

## Scope
- Source issue: [DUB-567](/DUB/issues/DUB-567)
- Parent directive: [DUB-547](/DUB/issues/DUB-547)
- Coverage: web illustrations (`public/images/**`), mascot system (`public/images/mascot/**`), and Remotion compositions (`packages/remotion/**`).

## 1) Dubi + Visual Style Guardrails (Baseline Contract)

### A. Canonical Dubi identity (must match across all media)
1. **Body language:** warm brown teddy, rounded silhouette, friendly eyes, gentle smile.
2. **Signature prop:** small blue backpack always present in hero/hint/celebration states.
3. **Color anchors:** stable brown + blue family only (no per-surface random recoloring).
4. **Role policy:** דובי is guide/mentor, not the main problem-solver in book scenes.
5. **RTL behavior:** gaze/gesture should point toward next actionable RTL flow area.

### B. Illustration language (education visuals)
1. Primary style target: **premium children storybook** (soft watercolor/gouache texture, clean silhouettes, low clutter).
2. No text/letters embedded in artwork; language appears in UI/audio only.
3. One focal subject per frame with clear depth hierarchy.
4. Keep contrast high on interactive objects; avoid washed-out low-detail flat fills.
5. Scene-to-scene variation must communicate narrative progression (no near-duplicate page art).

### C. Motion/video language (Remotion)
1. Audio-first pacing remains mandatory (durations measured from real audio).
2. Transition vocabulary stays calm (`spring` + gentle fade; no rapid cuts/flicker).
3. Mascot rendering in video should use shared approved assets (SVG/Lottie), not ad-hoc inline geometry.
4. Use a single cross-surface art direction (palette, mascot proportions, background treatment).

### D. Production and QA constraints
1. All raster source files originate in `packages/web/assets-src/images/**`.
2. Generated outputs in `packages/web/public/images/**` must pass `yarn workspace @dubiland/web images:budgets`.
3. Any new media lane includes a visual QA note with: style match, RTL check, and mascot consistency check.

## 2) Current-State Audit (Style Drift + Quality Gaps)

| Surface | Current status | Drift / quality gap | Severity | Evidence |
|---|---|---|---|---|
| Home + game thumbnails (`1` background, `13` thumbs) | Uniform low-detail flat placeholders | Below CEO quality bar; limited depth and weak storybook feel | Critical | `packages/web/public/images/backgrounds/home/home-storybook.webp`, `packages/web/public/images/games/thumbnails/**` |
| Handbook art (`magic-letter-map`) | Technical packaging complete (`png/webp/avif/960`) | Visual quality fails launch bar: placeholder-grade style and low page-to-page variation | Critical | `docs/knowledge/2026-04-10-dub-558-handbook-visual-quality-gate.md`, [DUB-558](/DUB/issues/DUB-558) |
| Mascot SVG pack (`4` files) | Cleaner than other asset families; consistent backpack motif | Style still mismatched vs flat handbook/thumb art and Remotion inline mascot rendering | High | `packages/web/public/images/mascot/*.svg` |
| Topic icons (`3` SVG files) | Polished icon style with gradients | Not aligned with scene illustration style (iconic vs storybook surfaces) | Medium | `packages/web/public/images/topics/*.svg` |
| Remotion letters compositions (`template` + `6` episodes) | Audio timing pipeline is solid (`calculateMetadata` + measured durations) | Uses inline-drawn mascot and simple card visuals; no shared mascot asset pipeline; visual dialect differs from web mascot pack | High | `packages/remotion/src/compositions/letters/LettersLessonVideo.tsx`, `packages/remotion/src/compositions/letters/metadata.ts` |

## 3) Prioritized Replacement / Upgrade Plan

### P0 — Launch-critical visual credibility (do first)
1. Replace handbook `magic-letter-map` cover + pages `01-10` with premium storybook masters.
2. Replace home background + all game thumbnails to match same art direction.
3. Regenerate optimized derivatives and confirm budget pass.

Owner: Media Expert  
Dependency: Gemini auth unblock on [DUB-495](/DUB/issues/DUB-495)  
Target execution: first heartbeat immediately after auth confirmation

### P1 — Mascot unification across product + video
1. Define one canonical Dubi model spec (proportions/palette/expression set) and apply to:
   - web mascot SVG set,
   - handbook/thumbnail scene appearances,
   - Remotion mascot usage.
2. Replace inline Remotion mascot geometry with shared approved media assets.

Owner: Media Expert  
Dependency: P0 art direction lock  
Target execution: next heartbeat after P0 completion

### P2 — Ongoing consistency enforcement
1. Add a lightweight media QA checklist artifact for every visual lane (style match, RTL flow, mascot consistency).
2. Keep image budget checks as technical gate and pair with explicit visual quality gate in issue comments.

Owner: Media Expert  
Dependency: none (can start immediately for process, enforce after P0/P1 delivery)

## 4) Immediate Blocker
- Full P0 execution remains blocked until Gemini runtime authentication is restored (tracked in [DUB-495](/DUB/issues/DUB-495)).
