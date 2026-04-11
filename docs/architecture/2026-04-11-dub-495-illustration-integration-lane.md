# DUB-495 Integration Lane: Illustration Replacement Contract

Date: 2026-04-11  
Owner: Architect (CTO)  
Related issues: [DUB-495](/DUB/issues/DUB-495), [DUB-623](/DUB/issues/DUB-623), [DUB-624](/DUB/issues/DUB-624)

## Decision

Illustration rollout for DUB-495 will use an **in-place replacement contract**:

- Keep existing public asset paths stable.
- Replace files at the same locations (no path renames, no component API changes).
- Preserve current `assetUrl()` flow so production base-path rewriting remains intact.

This minimizes integration risk and keeps FED work focused on validation + fallback coverage, not route rewiring.

## Asset Path Contract

The following path families are canonical and must remain stable:

1. Home and card imagery
- `/images/backgrounds/home/home-storybook.webp`
- `/images/games/thumbnails/*/thumb-16x10.webp`
- `/images/games/thumbnails/*/thumb-16x10@2x.webp`
- `/images/games/thumbnails/contact-sheet-16x10.webp`

2. Handbook imagery
- `/images/handbooks/<kebab-slug>/cover.(png|webp|avif)`
- `/images/handbooks/<kebab-slug>/page-<nn>.(png|webp|avif)`
- `/images/handbooks/<kebab-slug>/page-<nn>-960.(webp|avif)`

3. Mascot and topic imagery
- `/images/mascot/dubi-*.svg`
- `/images/topics/topic-*.svg`

## Consumer Integration Map

1. Home/game cards
- `packages/web/src/pages/Home.tsx` defines static game thumbnail paths.
- `packages/web/src/components/design-system/GameCard.tsx` renders thumbnail backgrounds and mascot fallback.
- `packages/web/src/seo/RouteMetadataManager.tsx` uses `contact-sheet-16x10.webp` for default OG image.

2. Mascot/topic shared components
- `packages/web/src/components/illustrations/MascotIllustration.tsx` maps mascot variants to `/images/mascot/*`.
- `packages/web/src/components/illustrations/TopicIllustration.tsx` maps topic slugs to `/images/topics/*`.
- Many pages/games consume these components indirectly; path stability here protects broad UI surfaces.

3. Handbook runtime and fallback
- `packages/web/src/games/reading/InteractiveHandbookGame.tsx` computes handbook fallback paths via:
  - `/images/handbooks/${kebabSlug}/page-${pageNumber}.png`
  - `/images/handbooks/${kebabSlug}/page-${pageNumber}.webp`
  - `/images/handbooks/${kebabSlug}/page-${pageNumber}-960.webp`
- `packages/web/src/pages/InteractiveHandbook.tsx` hydrates:
  - `handbooks.preload_manifest_json`
  - `handbook_media_assets.storage_path`
- Supabase seeds/migrations define these storage paths; replacements must not invalidate these references.

## Execution Sequence (Integration Lane)

1. Media lane lands P0 asset pack in-place:
- Home background
- Game thumbnails + contact sheet
- Magic Letter Map handbook cover/pages

2. FED validation lane (first pass):
- Verify all referenced paths resolve in UI (home, game cards, handbook, mascot/topic components).
- Add or confirm graceful fallbacks where `thumbnailUrl` can be null or missing.
- Ensure no hardcoded absolute-host URLs were introduced.

3. QA verification lane:
- Visual parity sweep in RTL and tablet viewports.
- Broken-image/network regression sweep (404/invalid MIME/case sensitivity checks).
- Handbook page-by-page render verification across active books.

4. P1 mascot/topic replacement validation:
- Confirm SVG replacements keep transparent backgrounds and expected viewbox behavior.

## Guardrails

1. Do not rename directories or files that are already consumed by code or DB rows.
2. If new variants are introduced, add them as additive files only; do not change existing keys.
3. Any path-model change requires a dedicated architecture follow-up (new issue + ADR update).
4. Keep replacements web-optimized to avoid performance regression on tablet networks.

## Acceptance Criteria

1. No image 404s on Home, Topic, Interactive Handbook, Login/Profile, and game entry surfaces.
2. Existing routes and game cards require zero code-path rewrites for new art.
3. `handbook_media_assets.storage_path` and preload manifests remain valid post-replacement.
4. QA confirms RTL/mobile visual integrity and reports linked evidence in child tickets.
