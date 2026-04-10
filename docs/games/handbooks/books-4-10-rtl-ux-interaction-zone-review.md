# Wave 2 RTL UX + Interaction-Zone QA (Books 4-10)

## Context

- Source issue: [DUB-438](/DUB/issues/DUB-438)
- Parent lane: [DUB-423](/DUB/issues/DUB-423)
- Baseline zone contract: `docs/games/handbooks/ux-layout-system-interaction-zones.md`
- Reviewed specs:
  - `docs/games/handbooks/book-4-yoav-letter-map.md`
  - `docs/games/handbooks/book-5-naama-syllable-box.md`
  - `docs/games/handbooks/book-6-ori-bread-market.md`
  - `docs/games/handbooks/book-7-tamar-word-tower.md`
  - `docs/games/handbooks/book-8-sahar-secret-clock.md`
  - `docs/games/handbooks/book-9-guy-class-newspaper.md`
  - `docs/games/handbooks/book-10-alma-root-families.md`

## Audit Checklist

1. Zone ownership safety (`Z1-Z8`) on interaction-heavy pages.
2. Touch targets and spacing (primary >=60px, recommended 72-80px; controls >=44px; 12-16px spacing).
3. Text-first checkpoint visual discipline (`L3` pages: one prompt, low noise, no edge conflicts).
4. RTL ordering and navigation-lock behavior (`interactionRequired`, drag lock, success lock).

## Outcome Snapshot

| Book | Zone safety | Touch target risk | Text-first conflicts | Result |
|---|---|---|---|---|
| Book 4 | Pass with adjustments | Low-Medium | Medium | Ready with wire adjustments |
| Book 5 | Pass with adjustments | Medium | Medium | Ready with wire adjustments |
| Book 6 | Pass with adjustments | Medium | Medium | Ready with wire adjustments |
| Book 7 | Pass with adjustments | Medium | Medium | Ready with wire adjustments |
| Book 8 | Pass with adjustments | Medium | Medium | Ready with wire adjustments |
| Book 9 | Pass with one corrected spec line + adjustments | Medium | High | Ready after listed constraints |
| Book 10 | Pass with adjustments | Medium | Medium | Ready with wire adjustments |

No hard blocker found. One direct spec contradiction was corrected in Book 9 interaction copy to keep "action-triggered feedback" compliant.

## Cross-Book Required Contracts (FED Runtime)

- Lock edge navigation zones `Z7` and `Z8` whenever `interactionRequired=true`.
- During any drag state, suppress swipe/page-turn gestures until release.
- Keep all mandatory interactive targets inside `Z5`; do not place required taps near left/right edge hotspots.
- Keep replay/hint/retry controls grouped in `Z4` only (right-aligned in RTL).
- Apply feedback within 100ms (visual pulse + audio), with success lock max 700-1000ms.
- On `L3` reading checkpoints, reduce motion/detail in `Z3` by roughly 25% and keep one text task only.
- For ages 5-6, cap visible choices to 3; for ages 6-7, cap to 4 (unless already-practiced pattern and clearly grouped).

## Cross-Book Media Constraints (DUB-440)

- Treat text as UI overlays, not baked into illustration textures, on all reading checkpoints.
- Keep Dubi strictly in `Z6`; no character overlap over `Z4` controls or `Z5` interaction card.
- Reserve a quiet, non-animated patch behind active text on `L3` pages.
- Keep celebratory motion short (<0.9s) and avoid repeating flashes during reading loops.

## Book-Level Findings + Wire Notes

### Book 4 - Yoav and the Letter Map

| Page(s) | Template | Finding | Required wire adjustment | Owner |
|---|---|---|---|---|
| 05 (`orderSyllableTiles`) | `L2` | Drag paths can drift toward edge nav hotspots. | Keep slots and draggable tiles fully inside central `Z5` card; add 80px side inset from both edges. | FED |
| 06 (Dubi hint cameo) | `L1` | Hint cameo can overlap interaction cluster if unconstrained. | Pin Dubi to `Z6` only and keep hint/retry controls exclusively in `Z4`. | FED + Media |
| 07-09 (`readPhraseGate`, `sequenceFromText`, `finalDecode`) | `L3` | Map glow/motion may compete with text decode focus. | Reduce stage animation intensity on these pages; enforce single question card and max 3 choices. | FED + Media |

### Book 5 - Naama and the Syllable Box

| Page(s) | Template | Finding | Required wire adjustment | Owner |
|---|---|---|---|---|
| 04 (`fixSyllableOrder`) | `L2` | Reorder rails may become too wide on tablet portrait. | Keep reorder rail within 62-70% viewport width and maintain 16px spacing between chips. | FED |
| 07 (`textToObject`) | `L3` | Object art can leak answer cue and defeat text-first intent. | Use neutralized object art and gate response via decoded prompt card in `Z5`. | FED + Media |
| 08 (`transferBlend`) | `L1` | New-word transfer can over-load with excessive options. | Start at 2 choices, then scale to 3 only after one success in-session. | Gaming + FED |

### Book 6 - Ori at the Bread Market

| Page(s) | Template | Finding | Required wire adjustment | Owner |
|---|---|---|---|---|
| 04 (`textLinkedCount`) | `L3` | Quantity choices can exceed age-band decision load. | Present 2-3 numeral chips max per state, never full 1-8 set at once. | Gaming + FED |
| 05 (`sortWordToStall`) | `L2` | Stall bins may be interpreted as stage-edge targets. | Render active bins inside `Z5` card only; stage stalls stay decorative. | FED + Media |
| 08 (`neutralImageDecode`) | `L3` | Rich market imagery can bias guessing without reading. | Keep image visually neutral and text-first; suppress decorative motion during prompt read. | FED + Media |

### Book 7 - Tamar and the Word Tower

| Page(s) | Template | Finding | Required wire adjustment | Owner |
|---|---|---|---|---|
| 07 (`buildPhrase`) | `L2` | Drag complexity can spike if too many movable tiles debut together. | Limit first attempt to max 3 movable tiles; keep tap-to-place fallback visible. | Gaming + FED |
| 08 (`tapEvidence`) | `L3` | Tower visuals can compete with evidence extraction. | Apply low-noise stage variant and keep evidence task as single focus in `Z5`. | FED + Media |
| 09-11 (`bridgePhrase` onward) | `L3` | Risk of combined novelty + comprehension in one screen cluster. | Keep decode and comprehension as separate pages, not mixed on one screen template. | Gaming + FED |

### Book 8 - Sahar and the Secret Clock

| Page(s) | Template | Finding | Required wire adjustment | Owner |
|---|---|---|---|---|
| 03 (`matchTimeMarker`) | `L1` | Time chips can drift toward edge navigation lanes in RTL. | Keep chips grouped centrally in `Z5`, with clear separation from `Z7/Z8`. | FED |
| 08 (`timelineOrder`) | `L2` | Timeline ordering can conflict with swipe gestures. | Lock page-swipe during drag/order states and restore after drop. | FED |
| 09 (`dualTimePrompt`) | `L3` | Two-marker prompt can inflate simultaneous choice load. | Keep visible answers to 2-3 chips and stage complexity ramp only after prior success. | Gaming + FED |
| 10 (`tapEvidence`) | `L3` | Clock motion can distract from text evidence target. | Freeze ambient clock motion while evidence card is active. | FED + Media |

### Book 9 - Guy and the Class Newspaper

| Page(s) | Template | Finding | Required wire adjustment | Owner |
|---|---|---|---|---|
| 02/05/09 paragraph checkpoints | `L3` | "Newspaper columns" framing can imply dense multi-column reading UI. | Keep one-column paragraph card in `Z5`; treat extra columns as decorative only. | FED + Media |
| 04 (`orderSections`) | `L2` | Section cards may become too many for first exposure. | Keep 3 cards max for baseline; unlock larger set only after success progression. | Gaming + FED |
| 09 (`anchoredInference`) | `L3` | Inference load can overtake literal readability if options are dense. | Keep mandatory inference prompt at 2 choices with explicit clue highlight. | Gaming + FED |
| 10 (`tapEvidence`) | `L3` | Spec wording previously implied a second "confirm" action. | Corrected to single-tap evidence selection with immediate feedback. | UX (done) + FED |

### Book 10 - Alma and the Root Families

| Page(s) | Template | Finding | Required wire adjustment | Owner |
|---|---|---|---|---|
| 03 (`sortByRoot`) | `L2` | Root-family bins can sprawl into unsafe side regions. | Keep bin grid inside centered `Z5` bounds; no edge-bin drops. | FED |
| 04/07 (`contextFamilyChoice`, `buildSentenceWord`) | `L3` | Sentence slot highlight may be overshadowed by lab set dressing. | Use low-noise lab variant on sentence pages and preserve high-contrast text strips. | FED + Media |
| 10 (`tapEvidence`) | `L3` | Longer sentence evidence hunt may exceed line-tracking comfort. | Chunk sentence into tappable phrase segments in RTL order. | FED |
| 11 (`finalFamilyDecision`) | `L1` | Close-family discrimination can become too foil-heavy. | Keep first attempt to 2 choices, expand to 3 only after success. | Gaming + FED |

## Handoff Notes for Wave 2 Implementation Lanes

- FED lanes ([DUB-445](/DUB/issues/DUB-445) through [DUB-451](/DUB/issues/DUB-451)) should treat this file as the zone-safe layout contract for pages listed above.
- Media lane ([DUB-440](/DUB/issues/DUB-440)) should apply the text-first composition constraints on all `L3` checkpoints listed in this review.
- Gaming lane follow-up should preserve the specified choice-count caps and progression gates where called out.
