# DUB-672 Batch A — Board Proxy Image Generation Request (2026-04-11)

## Scope
First compact batch to continue UX QA visual uplift for low-score routes and fallback-heavy game cards.

## Shared style contract (apply to every prompt)
- Children's book illustration style
- Soft pastel palette, warm light, calm mood
- Keep דובי model consistent: warm brown teddy bear, blue backpack, friendly expression
- Hebrew RTL context: composition flow should feel natural right-to-left
- No UI text, no letters, no numerals, no logos, no watermarks
- Commercial-safe original artwork

## Image requests

### 1) Legal routes shared background
- Target file path: `packages/web/public/images/backgrounds/legal/legal-storybook.webp`
- Prompt:
  - Cozy storybook landscape background for a children’s learning legal information page, soft watercolor hills and trees, warm sky gradient, gentle paper texture, subtle depth layers, open whitespace in center for overlaid cards, calm and trustworthy tone, Hebrew RTL composition flow (visual weight slightly to right side), no characters, no text.
- Style notes:
  - 1600x1000 canvas, optimized for hero headers and wide screens.
  - Keep contrast low enough for readable foreground text.

### 2) Parents page hero background
- Target file path: `packages/web/public/images/backgrounds/parents/parents-hero-storybook.webp`
- Prompt:
  - Storybook scene for a parent guidance page: a peaceful learning garden at sunset with soft paths, benches, plants, and playful educational props in the distance, family-safe and reassuring atmosphere, pastel colors, layered depth, clean center-right open area for headline overlay, Hebrew RTL-friendly visual direction, no people faces, no text.
- Style notes:
  - 1600x1000 canvas.
  - Slightly richer depth than legal background but still calm.

### 3) 404 / empty-state mascot pose
- Target file path: `packages/web/public/images/mascot/dubi-error-guide-rtl.webp`
- Prompt:
  - Full-body דובי teddy bear mascot in children’s book style, warm brown fur, blue backpack, gentle reassuring pose with one paw pointing to the right (RTL guidance), friendly smile, small lantern or star guide prop, transparent background, clean silhouette readable at small and medium sizes, no text.
- Style notes:
  - Output with transparent background.
  - Keep pose suitable for not-found and empty-state recovery screens.

### 4) Game thumbnail master — More or Less Market
- Target file path: `packages/web/public/images/games/thumbnails/moreOrLessMarket/thumb-16x10@2x.webp`
- Prompt:
  - Vibrant children’s market counting scene for a “more or less” comparison game, friendly stalls with baskets of fruits and toys, two clear grouped sets for quantity comparison, playful depth and warm pastel lighting, דובי guide in background cheering, no numbers, no text, RTL-friendly scene flow.
- Style notes:
  - 16:10 composition at high detail.
  - Keep focal objects large and readable in thumbnail crop.

### 5) Game thumbnail master — Shape Safari
- Target file path: `packages/web/public/images/games/thumbnails/shapeSafari/thumb-16x10@2x.webp`
- Prompt:
  - Child-friendly safari adventure scene focused on geometric shape discovery, rounded rocks, trees, and animal-friendly props arranged as circles, triangles, and squares in natural playful ways, דובי explorer with blue backpack discovering shapes, bright but soft pastel palette, no text, no explicit glyph labels, RTL-friendly composition.
- Style notes:
  - 16:10 composition at high detail.
  - Keep primary shape cues clear at small-card size.

## Post-delivery local processing plan
After board confirms files are saved, Media Expert will:
1. Derive 1x versions for thumbnail masters:
   - `packages/web/public/images/games/thumbnails/moreOrLessMarket/thumb-16x10.webp`
   - `packages/web/public/images/games/thumbnails/shapeSafari/thumb-16x10.webp`
2. Run thumbnail contact-sheet rebuild and image budget checks.
3. Wire new asset paths into Home/game card fallbacks in a follow-up patch.
