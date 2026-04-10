# DUB-495 Image Asset Quality Audit (2026-04-10)

## Scope
- Audited every file under packages/web/public/images.
- Total assets: 52.
- Resolution and byte-size inventory captured from filesystem metadata.

## Overall finding
Current visuals are mostly placeholder-grade and below the requested Nano Banana quality bar.

## Quality ratings by asset family
- home background: 2/10 (flat, low detail)
- Game thumbnails (all 1x and 2x): 2/10 (generic, low depth)
- Thumbnail contact sheet: 1/10 (composite of placeholder thumbs)
- Handbook pages and cover (all png, webp, 960 variants): 2/10 (same flat source style)
- Mascot SVG states: 4/10 (clean vector quality but not premium illustrated look)
- Topic SVG icons: 4/10 (usable UI iconography, not rich story art)

## Replacement priority
- P0: home background, all game thumbnails, full handbook page pack.
- P1: mascot and topic icons.

## Full asset inventory
Each file below inherits the quality score from its family above.

path\tbytes\tdimensions
packages/web/public/images/backgrounds/home/home-storybook.webp	64144	1600x1000
packages/web/public/images/games/thumbnails/colorGarden/thumb-16x10.webp	10626	512x320
packages/web/public/images/games/thumbnails/colorGarden/thumb-16x10@2x.webp	16620	1024x640
packages/web/public/images/games/thumbnails/contact-sheet-16x10.webp	59912	1632x716
packages/web/public/images/games/thumbnails/countingPicnic/thumb-16x10.webp	12186	512x320
packages/web/public/images/games/thumbnails/countingPicnic/thumb-16x10@2x.webp	16916	1024x640
packages/web/public/images/games/thumbnails/interactiveHandbook/thumb-16x10.webp	6850	512x320
packages/web/public/images/games/thumbnails/interactiveHandbook/thumb-16x10@2x.webp	15482	1024x640
packages/web/public/images/games/thumbnails/letterSoundMatch/thumb-16x10.webp	11696	512x320
packages/web/public/images/games/thumbnails/letterSoundMatch/thumb-16x10@2x.webp	25654	1024x640
packages/web/public/images/games/thumbnails/letterTracingTrail/thumb-16x10.webp	11310	512x320
packages/web/public/images/games/thumbnails/letterTracingTrail/thumb-16x10@2x.webp	17744	1024x640
packages/web/public/images/games/thumbnails/pictureToWordBuilder/thumb-16x10.webp	9038	512x320
packages/web/public/images/games/thumbnails/pictureToWordBuilder/thumb-16x10@2x.webp	18172	1024x640
packages/web/public/images/handbooks/magic-letter-map/cover.png	32474	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-01-960.webp	10278	960x600
packages/web/public/images/handbooks/magic-letter-map/page-01.png	35451	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-01.webp	22496	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-02-960.webp	11070	960x600
packages/web/public/images/handbooks/magic-letter-map/page-02.png	38182	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-02.webp	23610	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-03-960.webp	11474	960x600
packages/web/public/images/handbooks/magic-letter-map/page-03.png	38549	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-03.webp	25120	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-04-960.webp	11460	960x600
packages/web/public/images/handbooks/magic-letter-map/page-04.png	36425	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-04.webp	24408	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-05-960.webp	10268	960x600
packages/web/public/images/handbooks/magic-letter-map/page-05.png	37637	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-05.webp	22166	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-06-960.webp	10130	960x600
packages/web/public/images/handbooks/magic-letter-map/page-06.png	36568	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-06.webp	21682	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-07-960.webp	10718	960x600
packages/web/public/images/handbooks/magic-letter-map/page-07.png	38651	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-07.webp	23196	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-08-960.webp	11968	960x600
packages/web/public/images/handbooks/magic-letter-map/page-08.png	39659	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-08.webp	25810	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-09-960.webp	10326	960x600
packages/web/public/images/handbooks/magic-letter-map/page-09.png	35210	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-09.webp	22326	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-10-960.webp	11826	960x600
packages/web/public/images/handbooks/magic-letter-map/page-10.png	39917	1600x1000
packages/web/public/images/handbooks/magic-letter-map/page-10.webp	25762	1600x1000
packages/web/public/images/mascot/dubi-hero-wave-rtl.svg	3233	512x512
packages/web/public/images/mascot/dubi-hint-point-rtl.svg	2653	512x512
packages/web/public/images/mascot/dubi-loading-breathe.svg	2355	512x512
packages/web/public/images/mascot/dubi-success-cheer.svg	2861	512x512
packages/web/public/images/topics/topic-letters.svg	1506	256x256
packages/web/public/images/topics/topic-numbers.svg	1578	256x256
packages/web/public/images/topics/topic-reading.svg	1747	256x256
