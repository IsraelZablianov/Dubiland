# DUB-495 — Nano Banana Shotlist And Prompt Pack (2026-04-10)

## Purpose
- Replace all current low-detail illustrations in `packages/web/public/images/`.
- Keep output paths stable so frontend code does not need path rewrites.
- Maintain one consistent Dubiland visual language.

## Generation Preconditions
- Gemini web UI must be authenticated (current runtime is in signed-out state).
- Use Gemini `Fast` mode.
- Submit via send button, not Enter.

## Global style spec (prepend to every prompt)
Use case: illustration-story  
Asset type: children learning app illustration  
Style/medium: premium children book illustration, painterly watercolor and soft gouache blend, warm cinematic light, high detail texture, clean silhouettes for tablet readability  
Subject consistency: include דובי as a warm brown teddy bear with expressive eyes, soft fur texture, and a small blue backpack when relevant  
Composition/framing: RTL-aware flow, one clear focal point, no clutter, no in-image UI widgets  
Constraints: no text, no letters, no watermarks, no logos, no uncanny faces, age 3-7 safe and friendly

## Output targets
- Full scenes: generate at `1600x1000` master.
- Thumbnail masters: generate at `1024x640`, then derive `512x320`.
- Handbook responsive variants: derive `960x600` from each `1600x1000` page master.

## Shotlist

### Home background
1. Target paths:
- `packages/web/public/images/backgrounds/home/home-storybook.webp`
Prompt:
- Cozy dawn valley near a small Hebrew-learning village, soft rolling hills, storybook house, gentle trees, dreamy clouds, warm pastel sky, no characters centered, leave calm negative space for UI overlays.

### Game thumbnails
1. Counting Picnic  
Target paths:
- `packages/web/public/images/games/thumbnails/countingPicnic/thumb-16x10@2x.webp`
- `packages/web/public/images/games/thumbnails/countingPicnic/thumb-16x10.webp`
Prompt:
- דובי on a picnic blanket counting colorful fruits into a basket, joyful pose, clear object grouping for counting, bright but soft palette, playful depth, tablet-friendly readability.

2. Color Garden  
Target paths:
- `packages/web/public/images/games/thumbnails/colorGarden/thumb-16x10@2x.webp`
- `packages/web/public/images/games/thumbnails/colorGarden/thumb-16x10.webp`
Prompt:
- Magical garden with flower patches in distinct colors, דובי pointing to one color group, gentle sunlight, painterly petals and leaves, high contrast between color groups for quick selection.

3. Letter Sound Match  
Target paths:
- `packages/web/public/images/games/thumbnails/letterSoundMatch/thumb-16x10@2x.webp`
- `packages/web/public/images/games/thumbnails/letterSoundMatch/thumb-16x10.webp`
Prompt:
- Audio discovery scene with דובי listening through a playful shell-like sound portal and matching to illustrated cards, dynamic but calm composition, friendly learning vibe, no text symbols.

4. Letter Tracing Trail  
Target paths:
- `packages/web/public/images/games/thumbnails/letterTracingTrail/thumb-16x10@2x.webp`
- `packages/web/public/images/games/thumbnails/letterTracingTrail/thumb-16x10.webp`
Prompt:
- Curved glowing trail through sand and grass where דובי traces a path with a magic brush, sparkles following stroke direction, tactile texture, one dominant path shape, no letters drawn.

5. Picture To Word Builder  
Target paths:
- `packages/web/public/images/games/thumbnails/pictureToWordBuilder/thumb-16x10@2x.webp`
- `packages/web/public/images/games/thumbnails/pictureToWordBuilder/thumb-16x10.webp`
Prompt:
- Object card matching scene: vivid object cards, puzzle-like tiles sliding together, דובי guiding with encouraging gesture, warm classroom-meets-storybook environment, clean focal hierarchy.

6. Interactive Handbook  
Target paths:
- `packages/web/public/images/games/thumbnails/interactiveHandbook/thumb-16x10@2x.webp`
- `packages/web/public/images/games/thumbnails/interactiveHandbook/thumb-16x10.webp`
Prompt:
- Story map adventure tableau with דובי and a friendly guide opening a magical map, glowing pathway and stars, sense of narrative discovery, rich background depth, no text.

7. Contact sheet (derived artifact)
Target path:
- `packages/web/public/images/games/thumbnails/contact-sheet-16x10.webp`
Instruction:
- Rebuild after all thumbnail replacements using the same montage layout currently used by FED.

### Magic Letter Map handbook pages
1. Cover  
Target paths:
- `packages/web/public/images/handbooks/magic-letter-map/cover.png`
Prompt:
- Cover art: דובי and a friendly child wizard discovering a glowing map under a moonlit sky, clear story hook, premium storybook finish, strong center focal point.

2. Page 01 story hook  
Target paths:
- `packages/web/public/images/handbooks/magic-letter-map/page-01.png`
- `packages/web/public/images/handbooks/magic-letter-map/page-01.webp`
- `packages/web/public/images/handbooks/magic-letter-map/page-01-960.webp`
Prompt:
- Map appears for the first time, wonder expression, glowing path begins, calm scene setup with space for overlaid text strip.

3. Page 02 first-sound checkpoint  
Target paths:
- `packages/web/public/images/handbooks/magic-letter-map/page-02.png`
- `packages/web/public/images/handbooks/magic-letter-map/page-02.webp`
- `packages/web/public/images/handbooks/magic-letter-map/page-02-960.webp`
Prompt:
- Three clearly separated sound-choice artifacts in scene, guide character inviting listening action, visual cues support choice but do not reveal answer by text.

4. Page 03 choose-letter checkpoint  
Target paths:
- `packages/web/public/images/handbooks/magic-letter-map/page-03.png`
- `packages/web/public/images/handbooks/magic-letter-map/page-03.webp`
- `packages/web/public/images/handbooks/magic-letter-map/page-03-960.webp`
Prompt:
- Letter-card style magical tokens floating near map path, child selects one token, distinct token silhouettes without any written glyphs.

5. Page 04 transition beat  
Target paths:
- `packages/web/public/images/handbooks/magic-letter-map/page-04.png`
- `packages/web/public/images/handbooks/magic-letter-map/page-04.webp`
- `packages/web/public/images/handbooks/magic-letter-map/page-04-960.webp`
Prompt:
- Journey transition through glowing landscape, characters moving along map trail, anticipation mood, no puzzle overlays.

6. Page 05 simple-add checkpoint  
Target paths:
- `packages/web/public/images/handbooks/magic-letter-map/page-05.png`
- `packages/web/public/images/handbooks/magic-letter-map/page-05.webp`
- `packages/web/public/images/handbooks/magic-letter-map/page-05-960.webp`
Prompt:
- In-story counting moment using stars and objects in small groups, arithmetic cue scene for ages 5-6, visual clarity and warmth, no numerals displayed.

7. Page 06 decode pointed word checkpoint  
Target paths:
- `packages/web/public/images/handbooks/magic-letter-map/page-06.png`
- `packages/web/public/images/handbooks/magic-letter-map/page-06.webp`
- `packages/web/public/images/handbooks/magic-letter-map/page-06-960.webp`
Prompt:
- Decoding challenge atmosphere with glowing clue artifact and selectable symbol objects, scene supports focus and listening, answer cannot be inferred from image alone.

8. Page 07 literal comprehension checkpoint  
Target paths:
- `packages/web/public/images/handbooks/magic-letter-map/page-07.png`
- `packages/web/public/images/handbooks/magic-letter-map/page-07.webp`
- `packages/web/public/images/handbooks/magic-letter-map/page-07-960.webp`
Prompt:
- Text-first comprehension scene with characters observing clues, neutral visual support only, avoid explicit answer cues, emphasize thoughtful pause.

9. Page 08 sort objects optional checkpoint  
Target paths:
- `packages/web/public/images/handbooks/magic-letter-map/page-08.png`
- `packages/web/public/images/handbooks/magic-letter-map/page-08.webp`
- `packages/web/public/images/handbooks/magic-letter-map/page-08-960.webp`
Prompt:
- Sorting scene with clearly grouped magical objects and bins, playful movement hints, non-blocking challenge mood, vivid object differentiation.

10. Page 09 resolution setup  
Target paths:
- `packages/web/public/images/handbooks/magic-letter-map/page-09.png`
- `packages/web/public/images/handbooks/magic-letter-map/page-09.webp`
- `packages/web/public/images/handbooks/magic-letter-map/page-09-960.webp`
Prompt:
- Near-finale calm moment, map path converges toward destination, warm evening tones, emotional payoff preparation.

11. Page 10 recap and celebration  
Target paths:
- `packages/web/public/images/handbooks/magic-letter-map/page-10.png`
- `packages/web/public/images/handbooks/magic-letter-map/page-10.webp`
- `packages/web/public/images/handbooks/magic-letter-map/page-10-960.webp`
Prompt:
- Celebration finale with gentle confetti, star glow, proud דובי and guide characters, sense of mastery and closure, clean space for recap UI overlay.

### Mascot states (upgrade lane)
1. Hero wave  
Target path:
- `packages/web/public/images/mascot/dubi-hero-wave-rtl.svg`
Prompt:
- Full-body דובי waving in RTL direction, rich fur texture, friendly smile, balanced silhouette for hero sections, transparent background.

2. Hint point  
Target path:
- `packages/web/public/images/mascot/dubi-hint-point-rtl.svg`
Prompt:
- דובי pointing clearly toward RTL side with teaching gesture, focused expression, transparent background, maintain model consistency.

3. Success cheer  
Target path:
- `packages/web/public/images/mascot/dubi-success-cheer.svg`
Prompt:
- דובי celebrating with small star bursts, joyful but calm pose, transparent background, readable at small card sizes.

4. Loading breathe  
Target path:
- `packages/web/public/images/mascot/dubi-loading-breathe.svg`
Prompt:
- Neutral idle breathing pose, gentle expression, hands relaxed, transparent background, minimal motion-ready silhouette.

### Topic icons (upgrade lane)
1. Numbers  
Target path:
- `packages/web/public/images/topics/topic-numbers.svg`
Prompt:
- Numbers theme icon scene using counting objects and playful arrangement, no written numerals, rounded composition, transparent background.

2. Letters  
Target path:
- `packages/web/public/images/topics/topic-letters.svg`
Prompt:
- Letters theme icon scene with parchment cards and symbolic language motifs, no glyphs or text, transparent background.

3. Reading  
Target path:
- `packages/web/public/images/topics/topic-reading.svg`
Prompt:
- Reading theme icon with open storybook glow, cozy learning mood, no text, transparent background.

## Art-direction references for style calibration
- Oliver Jeffers: https://en.wikipedia.org/wiki/Oliver_Jeffers
- Jon Klassen: https://en.wikipedia.org/wiki/Jon_Klassen
- Eric Carle: https://en.wikipedia.org/wiki/Eric_Carle

## Post-generation checklist
- Replace target files in place with identical filenames.
- Verify all images render in Home and Interactive Handbook flows.
- Regenerate thumbnail contact sheet.
- Re-run quick visual QA in RTL layout.
