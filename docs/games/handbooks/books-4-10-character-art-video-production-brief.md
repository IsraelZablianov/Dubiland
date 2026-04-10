# Wave 2 Character, Art, and Video Production Brief (Books 4-10)

## Context

- Source issue: [DUB-440](/DUB/issues/DUB-440)
- Parent lane: [DUB-423](/DUB/issues/DUB-423)
- Spec sources:
  - `docs/games/handbooks/book-4-yoav-letter-map.md`
  - `docs/games/handbooks/book-5-naama-syllable-box.md`
  - `docs/games/handbooks/book-6-ori-bread-market.md`
  - `docs/games/handbooks/book-7-tamar-word-tower.md`
  - `docs/games/handbooks/book-8-sahar-secret-clock.md`
  - `docs/games/handbooks/book-9-guy-class-newspaper.md`
  - `docs/games/handbooks/book-10-alma-root-families.md`
- UX safety baseline: `docs/games/handbooks/books-4-10-rtl-ux-interaction-zone-review.md`

## Delivery Scope Covered

1. Unique protagonist package for each Wave 2 book:
   - pose set,
   - expression set,
   - signature prop lock.
2. Illustration-safe composition and motion limits for text-first pages.
3. Shot-list guidance for all planned micro-video segments in books 4-10.

## Cross-Book Production Contract

### Character and staging rules

- Keep each protagonist visually distinct from others in silhouette + prop profile.
- Keep DUBI as support character only; cameo target is one short hint beat per story arc.
- Never place characters over active interaction card space on required reading checkpoints.

### Text-first composition rules (mandatory)

- Treat text as UI overlay only; do not bake text into illustration textures.
- Reserve interaction-safe area (`Z5`) as the highest contrast and lowest noise region.
- Keep replay/hint/retry controls in `Z4` only, with no character overlap.
- On text-heavy checkpoints (`L3`), reduce ambient motion/detail by at least 25%.
- Keep all mandatory taps away from edge navigation zones (`Z7`, `Z8`).

### Motion rules (mandatory)

- Celebration bursts: max 0.9s.
- Success lock before next action: 0.7s to 1.0s.
- No repeated flashes or fast loop jitter on reading checkpoints.
- Camera movement should be minimal during decode tasks; prefer static framing + subtle parallax.

### Audio sync and timing hooks

- Each video segment must anchor cuts to narration/interaction audio cues from Content Writer keys.
- Keep intro segments to 7-8s and demo/milestone segments to 5-7s as defined in specs.
- Any transition SFX must stay short and avoid masking consonants in Hebrew prompts.

## Protagonist Package Matrix

| Book | characterId | Signature prop | Required pose set | Required expression set |
|---|---|---|---|---|
| 4 - Yoav | `yoav-map-runner` | Foldable glowing map | 1) map-open idle 2) crouch-and-trace 3) point-and-run 4) decode-focus tap 5) small victory jump | curious focus, surprised clue-find, determined read, calm retry, proud success |
| 5 - Naama | `naama-word-crafter` | Mosaic syllable box | 1) box-open present 2) tile-sort reach 3) chip-place tap 4) lean-in read 5) unlock cheer | inventive spark, focused blend, patient retry, delighted unlock, confident explain |
| 6 - Ori | `ori-market-runner` | Delivery satchel with labels | 1) satchel-carry walk 2) sign-read point 3) stall-sort place 4) count-and-check hold 5) delivery thumbs-up | cheerful greet, concentration on endings, gentle confusion, relieved solve, proud helper |
| 7 - Tamar | `tamar-word-architect` | Rotating word compass | 1) compass-check stance 2) tile-align gesture 3) tower-step climb 4) evidence tap lean 5) floor-unlock celebrate | analytical focus, connector-thinking, quick rethink, clear confirmation, triumphant unlock |
| 8 - Sahar | `sahar-clock-detective` | Pocket lens projector | 1) lens-scan idle 2) clock-hand track 3) clue-card inspect 4) timeline order cue 5) secret-door reveal | observant calm, mystery surprise, careful decode, strategic pause, satisfied discovery |
| 9 - Guy | `guy-junior-editor` | Headline stamp kit | 1) page-layout review 2) headline-stamp press 3) fact-highlight point 4) section-sort arrange 5) print-celebration wave | organized focus, newsroom curiosity, mild uncertainty, evidence confidence, proud publish |
| 10 - Alma | `alma-word-lab-lead` | Root scanner bracelet | 1) scanner-check pose 2) root-card compare 3) sort-bin place 4) sentence-slot point 5) lab-station unlock | thoughtful observe, pattern recognition joy, retry patience, transfer confidence, mastery glow |

## Book-by-Book Composition and Motion Limits

| Book | Text-first page focus | Composition constraints | Motion constraints |
|---|---|---|---|
| 4 - Yoav | Pages 7-9 (`readPhraseGate`, `sequenceFromText`, `finalDecode`) | Keep map glow behind text under 20% luminance delta; no foreground props crossing `Z5` | Map pulse max one cycle per prompt; freeze ambient path twinkle during active choices |
| 5 - Naama | Page 7 (`textToObject`) and page 8 (`transferBlend`) | Neutral object art for all options; equal visual salience across choices | No bounce loops on option cards during prompt; success pop <=0.8s |
| 6 - Ori | Pages 4 and 8 (`textLinkedCount`, `neutralImageDecode`) | Keep market stalls decorative outside `Z5`; quantity chips centered and evenly spaced | Crowd loops <=10% screen motion; pause stall animations during active reading |
| 7 - Tamar | Pages 8-11 (`tapEvidence` onward) | Reduce tower detail on `L3` pages; keep single high-contrast text card centered | Unlock effects one-shot only; no repeating floor glows while child reads |
| 8 - Sahar | Pages 9-10 (`dualTimePrompt`, `tapEvidence`) | Keep time markers and clue text isolated from decorative clock numerals | Freeze ambient clock-hand loop during evidence selection; transition fades >=180ms |
| 9 - Guy | Pages 2, 5, 9, 10 (paragraph checkpoints) | One-column reading card only; side columns decorative and low contrast | Print press motion disabled on active prompts; only trigger after confirmed success |
| 10 - Alma | Pages 4, 7, 10, 11 (context and evidence) | Root bins stay inside central card bounds; sentence strip gets clean background patch | Root highlight trace max 0.7s; no simultaneous lab pulsing on required taps |

## Shot List Guidance (All Planned Segments)

### Book 4 - Yoav

| Segment | Duration | Shot guidance |
|---|---|---|
| `micro-intro-map-awakens` | 7s | 1) Wide park establish (1.5s) 2) Push to Yoav + map glow (2.0s) 3) Map fold reveal close-up (2.0s) 4) Hold center-safe frame for UI handoff (1.5s) |
| `milestone-gate-open` | 6s | 1) Gate locked medium shot (1.5s) 2) Yoav reads phrase close-up (2.0s) 3) Gate unlock with soft light (1.5s) 4) Return to gameplay framing (1.0s) |

### Book 5 - Naama

| Segment | Duration | Shot guidance |
|---|---|---|
| `micro-intro-box-awakens` | 8s | 1) Room establish with box centered (2.0s) 2) Naama opens box medium (2.0s) 3) Tile glow close-up (2.0s) 4) Static handoff frame for first prompt (2.0s) |
| `milestone-box-open` | 7s | 1) Final lock close-up (1.5s) 2) Naama places last tile (2.0s) 3) Box open reveal (2.0s) 4) Calm celebration + fade to next page (1.5s) |

### Book 6 - Ori

| Segment | Duration | Shot guidance |
|---|---|---|
| `micro-intro-market-opening` | 8s | 1) Market establish wide (2.0s) 2) Ori enters with satchel (2.0s) 3) Signboard close-up with blank text area for overlay (2.0s) 4) Reset to reading-safe composition (2.0s) |
| `interaction-demo-final-form` | 5s | 1) Word card close-up (1.5s) 2) Zoom to final letter slot (1.5s) 3) Ori confirmation gesture (1.0s) 4) Pull back to interaction card (1.0s) |

### Book 7 - Tamar

| Segment | Duration | Shot guidance |
|---|---|---|
| `micro-intro-tower-climb` | 8s | 1) Tower base establish (2.0s) 2) Tamar checks compass and points upward (2.0s) 3) Directional climb cue in RTL flow (2.0s) 4) Hold on floor card entry frame (2.0s) |
| `milestone-floor-unlock` | 6s | 1) Locked floor glyph medium (1.5s) 2) Evidence tap close-up (1.5s) 3) Floor unlock light pass (1.5s) 4) Stable gameplay handoff (1.5s) |

### Book 8 - Sahar

| Segment | Duration | Shot guidance |
|---|---|---|
| `micro-intro-clock-tower` | 8s | 1) Tower silhouette establish (2.0s) 2) Sahar lens scan medium (2.0s) 3) Clock hand clue reveal close-up (2.0s) 4) Clear center-safe frame for overlay (2.0s) |
| `interaction-demo-time-clue` | 5s | 1) Time marker card close-up (1.5s) 2) Lens projection and clock-hand relation (1.5s) 3) Choice focus hold (1.0s) 4) Return to neutral prompt frame (1.0s) |

### Book 9 - Guy

| Segment | Duration | Shot guidance |
|---|---|---|
| `micro-intro-newsroom` | 7s | 1) Classroom newsroom wide (1.5s) 2) Guy arranges headline cards (2.0s) 3) Stamp kit close-up (1.5s) 4) One-column reading card handoff (2.0s) |
| `milestone-print-press` | 6s | 1) Final article board medium (1.5s) 2) Guy stamps headline (1.5s) 3) Print press reward motion (1.5s) 4) Calm settle to recap frame (1.5s) |

### Book 10 - Alma

| Segment | Duration | Shot guidance |
|---|---|---|
| `micro-intro-word-lab` | 8s | 1) Word lab establish (2.0s) 2) Alma scans root cards (2.0s) 3) Bracelet cue close-up (2.0s) 4) Center-safe sentence strip handoff (2.0s) |
| `milestone-root-reveal` | 6s | 1) Transfer prompt result medium (1.5s) 2) Root family highlight close-up (1.5s) 3) Station unlock reveal (1.5s) 4) Return to recap-ready frame (1.5s) |

## Handoff Notes

- FED lanes [DUB-445](/DUB/issues/DUB-445) through [DUB-451](/DUB/issues/DUB-451) should use this file as the media implementation contract for Wave 2 books.
- Content Writer lane [DUB-439](/DUB/issues/DUB-439) can align narration timing and cue grouping to the segment durations listed above.
- UX lane [DUB-438](/DUB/issues/DUB-438) remains source of truth for interaction zone enforcement; this file extends it with media-specific camera/motion constraints.
