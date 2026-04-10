# Handbook Character Briefs + Illustration/Animation Standards

## Context

- Owner: Media Expert
- Source issue: [DUB-383](/DUB/issues/DUB-383)
- Parent initiative: [DUB-377](/DUB/issues/DUB-377)
- Related UX shell contract: `docs/architecture/2026-04-10-handbook-rtl-page-shell-ux-spec.md`

This document defines the media production standard for 10 interactive handbooks, including protagonist brief structure, visual style rules, animation and short-video guidance, and first-wave concept briefs.

## 1) Character Design-Brief Framework (Reusable)

Use this exact brief template for every new handbook protagonist.

### Required fields

| Field | What to define | Production rule |
|---|---|---|
| `characterId` | Stable slug (`hana-baker`) | Never rename after first asset export |
| `displayName` | Hebrew + transliteration | Keep to 1-3 words |
| `ageBand` | `3-4`, `5-6`, `6-7` | Match book target age |
| `coreLearningDomains` | Numbers / letters / reading / logic | Max 2 primary domains |
| `personalityTriad` | 3 adjectives | Must include one regulation trait (calm, patient, brave) |
| `signatureProp` | One object tied to interactions | Appears in cover + at least 3 pages |
| `silhouette` | Primary shape language | Must be readable at 96px |
| `palette` | 3 core colors + 1 accent | Reuse token-aligned colors; no neon-only palette |
| `expressionSet` | Idle, encourage, think, celebrate, retry-support | Minimum 5 reusable poses |
| `motionProfile` | Bounce level, movement amplitude, idle loop style | Keep motion calm for pre-readers |
| `rtlDirectionNotes` | Looking/pointing priorities in RTL | Character gaze should point to next actionable area |
| `dubiRole` | Intro cameo / hint / recap / none | דובי cannot be co-protagonist |

### Asset minimum per protagonist

1. `cover-pose` (static)
2. `idle-loop` (Lottie or sprite)
3. `guide-point-rtl`
4. `celebration-short`
5. `thinking-pause`
6. `retry-encourage`

## 2) 10-Protagonist Roster Framework

Each row is the default media brief baseline for one handbook lead.

| # | Protagonist (Hebrew / transliteration) | Age band | Core learning focus | Signature prop | Visual direction | דובי supporting role |
|---|---|---|---|---|---|---|
| 1 | ליה האופה / Liah HaOfa | 3-4 | Counting, size compare | Measuring cups | Round pastry shapes, warm bakery tones | Intro welcome + end celebration |
| 2 | יואב טייס העננים / Yoav Tayas HeAnanim | 3-4 | Colors, shapes | Kite compass | Soft sky gradients, big cloud silhouettes | Hint cameo when child is inactive |
| 3 | נועה חוקרת היער / Noa Hokeret HaYaar | 3-4 | Animal names, sorting | Magnifying leaf | Pastel forest, oversized friendly animals | Narration bumper only |
| 4 | מאיה קוסמת האותיות / Maya Kosemet HaOtiyot | 5-6 | Letter identification, first sounds | Spark wand | Stage lights + floating Hebrew glyph cards | One mid-book hint |
| 5 | איתן שומר המפה / Eitan Shomer HaMapa | 5-6 | Path logic, counting routes | Folded map | Treasure-map textures, directional icons | Appears as map helper icon |
| 6 | תמרית המנצחת / Tamarit HaMenatzechat | 5-6 | Rhythm counting, patterning | Baton | Musical arcs, note-like particles | Finale applause cameo |
| 7 | רוני בונת הרובוטים / Roni Bonat HaRobotim | 6-7 | Sequencing, problem solving | Tool belt | Modular geometric panels, clean tech shapes | Troubleshooting hint voice |
| 8 | אלון אסטרונאוט הקריאה / Alon Astronaut HaKriah | 6-7 | Word building, reading comprehension | Star scanner | Deep-space gradients, readable contrast stars | Intro mission briefing |
| 9 | יערה בלשית הזמן / Yaara Balashit HaZman | 6-7 | Sequence events, cause/effect | Time cards | Clock motifs, layered timeline scenes | End recap narrator |
| 10 | סער קפטן הנמל / Saar Captain HaNamal | 6-7 | Word problems, quantities | Harbor wheel | Sea blues + cargo color coding | Optional coaching bubble |

## 3) Illustration Style Guide (Handbook Lane)

### 3.1 Composition-safe layout contract (aligned with UX)

1. Respect shell slots from `docs/architecture/2026-04-10-handbook-rtl-page-shell-ux-spec.md` (`storyStage`, `narrationBar`, `interactionCard`, `mascotGuide`).
2. Keep critical art details inside central 76% width and top 70% of stage.
3. Reserve bottom 20% for interaction overlays and touch-safe controls.
4. Do not place important facial features near left-edge navigation affordances.

### 3.2 Visual language

- Storybook style: soft edge shapes, clear silhouettes, low-noise backgrounds.
- Line weight should remain readable at tablet distance (avoid micro-line details).
- One focal subject per scene; secondary props support, never compete.
- Avoid embedded readable text in art; use UI overlays for all words/letters.

### 3.3 Color system

- Use warm child-friendly palettes with controlled saturation spikes for teaching targets.
- Keep contrast high on interactive objects vs background.
- Reuse stable color families per protagonist so children build familiarity.
- Flashing/high-frequency color alternation is disallowed.

### 3.4 RTL art direction rules

- Primary gaze and gesture vectors should guide right-to-left reading flow.
- Directional props (arrows, trails, footprints) should support RTL progression.
- If mirroring an illustration, validate semantics (tool hand, pointer direction, map path).

## 4) Animation Movement Rules

### 4.1 Motion envelope by age band

| Age band | Preferred movement | Max intensity | Avoid |
|---|---|---|---|
| 3-4 | Gentle bob, soft fade, short spring entrances | Low | Rapid cuts, camera shake, object flicker |
| 5-6 | Moderate slide, simple parallax, clear cause/effect motion | Medium-low | Multi-axis chaos, dense simultaneous loops |
| 6-7 | Structured transitions, guided kinetic cues for logic tasks | Medium | Hyper-fast transitions, distracting background loops |

### 4.2 Timing rules

1. Intro hold before first action: 0.6-1.2s.
2. Interaction feedback celebration: 0.4-0.9s.
3. Page transitions: 18-30 frames (30fps baseline).
4. No more than one attention-grabbing animation at a time.

### 4.3 Mascot/protagonist behavior cadence

- `idle`: subtle loop only (breathing/blink/float).
- `prompt`: single clear gesture toward target.
- `success`: short burst, then immediate calm return.
- `retry`: supportive expression; no negative visual punishment.

## 5) Short Video Segment Standards

Use short embedded segments to anchor key teaching beats.

### Segment types

| Type | Typical length | Use case |
|---|---|---|
| `micro-intro` | 6-10s | Set scene and objective |
| `interaction-demo` | 4-8s | Show how to perform page action |
| `milestone-celebration` | 5-9s | Reinforce success after key checkpoint |

### Technical standards

- Default render: 1280x720, 30fps, H.264 MP4.
- Keep each segment under 12s for quick preload.
- Include a clean first frame and last frame (no abrupt cuts).
- Align durations to measured audio clips (never guessed frame counts).
- Maintain a soft transition vocabulary across all books.

## 6) דובי Usage Policy (Supporting Role Only)

To avoid protagonist overuse:

1. דובי appears as mentor/host, not central problem-solver.
2. Screen-time target per handbook: 10-20% total visible character time.
3. Max one proactive hint cameo per 2 pages (unless accessibility retry mode).
4. דובי should hand agency back to the protagonist and child quickly.
5. Celebration scenes can include דובי, but the protagonist remains foreground focal point.

## 7) First 3 Prioritized Books — Concrete Character + Scene Concept Briefs

These three are production-priority candidates (one per age group).

## Book A (Ages 3-4): ליה והעוגיות הסופרות

- Protagonist: ליה האופה (`liah-haofa`)
- Learning goals: count 1-5, compare big/small, identify warm colors.
- Signature prop: measuring cup set (sizes 1-5).
- דובי role: opening greeting + final clap celebration.

### Scene concepts (media brief)

| Scene | Visual concept | Animation notes | Interaction cue |
|---|---|---|---|
| Bakery Morning | Cozy counter, 5 bowls, sunlit window | Steam loop + gentle camera drift | Tap bowls in counting order |
| Sugar Trail | Flour path across floor tiles | Sparkle dots reveal sequence slowly | Pick the next tile by number |
| Oven Colors | Trays with different cookie colors | Tray glow pulses one at a time | Choose target color tray |
| Size Parade | Big/medium/small cookie characters | Bouncy entrance by size | Drag to correct size shelf |
| Sweet Finale | Table set with counted cookie stack | Confetti crumbs + clap burst | Count aloud recap |

## Book B (Ages 5-6): מאיה וקופסת האותיות הקסומה

- Protagonist: מאיה קוסמת האותיות (`maya-kosemet-haotiyot`)
- Learning goals: letter recognition, first-sound matching, early word chunks.
- Signature prop: spark wand that reveals Hebrew letter cards.
- דובי role: one assistive hint cameo at mid-book.

### Scene concepts (media brief)

| Scene | Visual concept | Animation notes | Interaction cue |
|---|---|---|---|
| Stage Reveal | Velvet curtain opens to floating אות cards | Curtain sweep + card hover loops | Tap the spoken target letter |
| Sound Lanterns | Lanterns light up per phoneme cue | Sequential glow synced to audio | Match sound to letter lantern |
| Spell Bridge | Letter tiles form stepping stones | Tiles appear via soft spring | Drag tiles to build short word |
| Mirror Choice | Two mirrored spell outcomes | One side shimmers correctly | Choose matching initial sound |
| Magic Recap | Wand draws trail around learned letters | Trail writes arc, not text glyphs | Replay and point to letter set |

## Book C (Ages 6-7): אלון ומשימת הקריאה בחלל

- Protagonist: אלון אסטרונאוט הקריאה (`alon-astronaut-hakriah`)
- Learning goals: word building, short comprehension, sequence reasoning.
- Signature prop: star scanner that highlights clue words.
- דובי role: mission intro briefing + ending recap narrator.

### Scene concepts (media brief)

| Scene | Visual concept | Animation notes | Interaction cue |
|---|---|---|---|
| Launch Deck | Spaceship cockpit with mission panel | Dashboard pulses + subtle parallax | Select first mission keyword |
| Orbit Clues | Planets carry word fragments | Planet orbit slows at prompt | Arrange fragments into target word |
| Signal Decode | Hologram sentence appears in chunks | Chunk-by-chunk fade-in | Answer literal comprehension prompt |
| Route Sequence | Three star routes with event icons | Route lines animate in order | Choose correct event sequence |
| Docking Celebration | Station lights unlock one by one | Controlled celebration burst | Final recap choice card |

## 8) Production Handoff Checklist

Before PM/FED implementation starts on any handbook:

1. Character brief filled with all required fields.
2. 5-pose minimum asset set approved.
3. Scene concept table complete for every page.
4. RTL composition and safe-zone pass complete.
5. At least one short video segment plan defined.
6. דובי usage checked against supporting-role policy.
7. Audio timing owner confirmed with Content Writer.

## 9) Open Coordination Notes

- Sync with UX Designer on slot-safe composition per scene before final art lock.
- Keep protagonist palettes distinct across the first 3 books to avoid character confusion.
- If a scene requires dense motion for comprehension, prefer sequential reveals instead of simultaneous effects.
