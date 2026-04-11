# Letter Story v2 — Illustration Direction and Asset Pipeline

- Source issue: [DUB-759](/DUB/issues/DUB-759)
- Parent feature: [DUB-664](/DUB/issues/DUB-664)
- Related baseline: `docs/games/letter-storybook-image-generation-pipeline.md` ([DUB-655](/DUB/issues/DUB-655))
- Scope: production-ready visual direction + prompt/shot contract for the **22-letter continuous narrative** route

## 1) Delivery Scope (This Lane)

This lane delivers four integration artifacts:

1. Visual style guide aligned to one flowing story world (not isolated pages).
2. 22-scene shot list and prompt-pack inputs in `docs/games/letter-story-v2-illustration-manifest.csv`.
3. Deterministic asset naming/export contract aligned with `assets-src -> public/images` pipeline.
4. Risk register with mitigations for cross-scene consistency.

## 2) Narrative-Continuity Style Guide

### Story continuity rules

- The child should feel one journey through "שביל האותיות" from right-to-left across all 22 scenes.
- Every scene must include one carry-over element from the prior scene (`path`, `map fragment`, `light source`, `weather cue`, or `prop`) to prevent reset feeling.
- The anchor object for the target letter must be readable in under 1 second.
- No emoji placeholders, sticker-like composites, or mixed illustration engines inside one chapter.

### דובי identity contract

- Warm brown teddy, rounded muzzle, friendly eyes, small blue backpack.
- Role is guide/supporter; the letter-association object remains primary.
- דובי pose language should follow RTL flow (lead from right side, invite motion leftward).
- Keep visual proportions stable across all scenes: head/body ratio and backpack size should not drift.

### Art direction and quality bar

- Medium: premium children's-book watercolor + soft gouache texture.
- Lighting: warm, calm, optimistic; avoid harsh contrast spikes between adjacent scenes.
- Depth: foreground cue + clear midground anchor + soft background layer per shot.
- Text safety: no baked words, no letters, no numerals, no logos, no watermark overlays.

### Chapter palette progression

- Chapter A (`01-04`): gateway meadow palette (`honey`, `mint`, `sky`).
- Chapter B (`05-08`): hill trail palette (`sage`, `rose`, `sand`).
- Chapter C (`09-13`): village/weather palette (`teal`, `sun`, `linen`).
- Chapter D (`14-18`): twilight valley palette (`lavender dusk`, `peach light`, `olive`).
- Chapter E (`19-22`): finale palette (`gold`, `coral`, `leaf green`) with celebration energy but calm pacing.

## 3) Prompt Pack Contract

### 3.1 Global prompt prefix (prepend to every scene)

```text
Children's educational storybook illustration for ages 3-7, premium watercolor and soft gouache texture, warm cinematic light, one clear focal object, low clutter, clean silhouettes, Hebrew RTL-aware composition flow from right to left.
Character continuity: include Dubi as a warm brown teddy bear with a small blue backpack, friendly helper role only.
Output constraints: no text, no Hebrew letters, no numerals, no logos, no watermarks, no UI elements, no uncanny faces, gentle child-safe mood.
```

### 3.2 Per-scene template

```text
Create one 16:10 illustration for Letter Story v2 continuous narrative.
Scene order: {order}
Target letter: {letter}
Association word (Hebrew): {associationWordHe}
Association meaning (English): {associationWordEn}
Scene brief (Hebrew): {sceneBriefHe}
Scene brief (English): {sceneBriefEn}
Transition from previous scene: {transitionFromPrevHe}
Dubi role: {dubiRole}
Camera plan: {cameraPlan}
Style chapter: {chapter}
Output: static storybook scene for web runtime, high-detail source master.
```

### 3.3 22-scene story arc shot list (high-level)

| Seq | Letter | Association | Scene beat | Continuity hook |
|---|---|---|---|---|
| 01 | א | אריה | דובי arrives at trail gate, meets a friendly lion guide. | Establish glowing path + map fragment.
| 02 | ב | בלון | A balloon drifts from the lion gate toward the path. | Same path stones continue.
| 03 | ג | גזר | Balloon lands near a carrot garden station. | Balloon ribbon remains visible.
| 04 | ד | דג | Carrot basket tips by a pond where a fish jumps. | Same basket appears near shore.
| 05 | ה | הר | Fish splash points דובי toward a mountain climb. | Water stream continues to hillside.
| 06 | ו | ורד | On the mountain path, a rose patch marks the next clue. | Same hiking trail marker.
| 07 | ז | זברה | A zebra crossing appears beside rose trail turn. | Rose petals on ground.
| 08 | ח | חתול | Zebra path reaches a small window where a cat peeks out. | Striped crossing sign in background.
| 09 | ט | טווס | Cat leads to a clearing where a peacock opens feathers. | Window lantern reused as prop.
| 10 | י | ילד | A child waves to דובי near the peacock clearing gate. | Same feather motif on gate.
| 11 | כ | כובע | The child hangs a hat on a signpost showing next route. | Child scarf color carries over.
| 12 | ל | לימון | Signpost leads to lemon grove with one hero lemon branch. | Same signpost arrow appears.
| 13 | מ | מטרייה | Light drizzle starts; umbrella opens along grove trail. | Lemon crate remains nearby.
| 14 | נ | נר | Umbrella path enters cave lit by a soft candle. | Drizzle drops at cave entrance.
| 15 | ס | סוס | Candle glow reveals a horse waiting by the valley track. | Candle lantern hangs on saddle.
| 16 | ע | ענן | Horse reaches open field under one guiding cloud. | Same saddle lantern visible.
| 17 | פ | פרח | Cloud shadow moves to flower field checkpoint. | Cloud shape preserved in sky.
| 18 | צ | צב | A turtle carries a map tile through the flowers. | Same flower petals on map tile.
| 19 | ק | קוף | Turtle delivers tile to monkey at tree bridge. | Map tile now in monkey hand.
| 20 | ר | רכבת | Monkey points to a small train crossing bridge. | Tree bridge transitions to rail bridge.
| 21 | ש | שמש | Train exits into sunny valley with final arch glow. | Train smoke curls into sun rays.
| 22 | ת | תפוח | Celebration gate with apple reward closes the journey. | Final arch + collected map complete.

Detailed per-scene prompts and path bindings are stored in:
- `docs/games/letter-story-v2-illustration-manifest.csv`

## 4) Asset Naming + Export Contract

### 4.1 Source masters (board-generated assets)

- Directory: `packages/web/assets-src/images/storybooks/letter-story-v2/`
- Filename: `scene-{order}-{slug}.jpg`
- Example: `scene-01-alef.jpg`, `scene-22-tav.jpg`

### 4.2 Runtime outputs (generated by pipeline)

- Directory: `packages/web/public/images/storybooks/letter-story-v2/`
- Generated formats per source: `.png`, `.webp`, `.avif`
- Manifest: `packages/web/public/images-manifest.json`

### 4.3 Technical export constraints

- Aspect ratio: `16:10`
- Source target size: `2048x1280` (minimum)
- Color profile: `sRGB`
- No transparency required (JPEG source preferred)
- Keep files text-free for localization flexibility

### 4.4 Validation commands

```bash
yarn assets:pipeline
yarn workspace @dubiland/web images:budgets
```

Pass criteria:
- all 22 scene sources resolve to generated runtime formats,
- no budget violations,
- no missing entries in `images-manifest.json`.

## 5) Board Proxy Execution Format

When requesting generation from the board, use the required heading:

```md
## 🎨 Image Generation Request
```

Recommended batch cadence:
- Batch `B01`: scenes `01-04` (style calibration)
- Batch `B02`: scenes `05-09`
- Batch `B03`: scenes `10-14`
- Batch `B04`: scenes `15-18`
- Batch `B05`: scenes `19-22`

Do not reference scene files in runtime implementation until the board confirms files were saved at the exact target paths.

## 6) Risks and Mitigations

| Risk | Impact | Mitigation | Owner |
|---|---|---|---|
| Cross-scene character drift for דובי | Breaks brand continuity | Keep one locked identity clause in every prompt + reject drift in calibration batch | Media Expert |
| Narrative discontinuity between adjacent letters | Feels like disconnected cards | Enforce transition hook field per row in manifest; never generate isolated singletons | Media Expert |
| Word changes from Reading/Content lane | Rework risk | Keep filenames letter-based (`scene-XX-slug`), update copy only in manifest fields | Media Expert + Content Writer |
| Model inserts accidental text artifacts | Violates Hebrew UX contract | Include hard negative constraints in every prompt; regenerate immediately | Media Expert |
| Asset budget overrun | Runtime regression | Use JPEG masters + mandatory `yarn assets:pipeline` gate before handoff | Media Expert + FED |
| Board turnaround latency | Delivery slips | Use small deterministic batches with explicit file paths and prompt version tags | Media Expert + PM |

## 7) Integration Handoff

- FED lane consumes deterministic scene paths from this contract.
- Content Writer/Reading PM can revise Hebrew scene text in manifest without renaming files.
- PM can track completion by batch (`B01..B05`) and issue-comment evidence.
