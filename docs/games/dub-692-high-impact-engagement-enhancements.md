# DUB-692 — High-Impact Game + Engagement Enhancements

Date: 2026-04-11
Owner: Gaming Expert
Parent: [DUB-674](/DUB/issues/DUB-674)

## 1) Weakest Current Engagement Loops (Portfolio Audit)

1. Counting and quantity progression jumps too quickly from count-all to symbolic tasks; subitizing is under-represented.
2. Arithmetic coverage has addition (`number-line-jumps`) but no dedicated subtraction strategy game and no make-10 decomposition core loop.
3. Letter/phonics path is strong on recognition but weaker on explicit blending (C+V) bridge before heavier decoding.
4. Reading path is decode-heavy but has limited encode-from-audio practice (spelling bridge).
5. Some loops risk overlong rounds for ages 3-4 when visual density increases, especially in moving-object games.

## 2) Existing Game Enhancements (Prioritized)

| Priority | Game | Enhancement | Why it matters (3-7) | Impact | Effort |
|---|---|---|---|---|---|
| P0 | `counting-picnic` | Add 1 flash-subitizing round every 3 normal rounds (1-5 dots). | Builds fast quantity recognition and reduces count-by-one dependence. | High | Small |
| P0 | `number-line-jumps` | Add concrete pre-bridge (dots/objects) in early levels before abstract jumps. | Reduces cognitive jump for age 6 transition to mental strategies. | High | Medium |
| P0 | `letter-sound-match` | Deterministic 3-step confusion recovery (contrast -> anchor word -> transfer). | Prevents repeated random guessing on confusable sounds. | High | Small |
| P1 | `picture-to-word-builder` | First-error-position highlight + segmented replay after 2 misses. | Preserves self-correction and lowers frustration in ages 5-7. | Medium-High | Small |
| P1 | `decodable-micro-stories` | Enforce checkpoint every 20-35s to prevent passive listening drift. | Keeps active reading signal high and session completion stable. | Medium-High | Medium |
| P1 | `letter-sky-catcher` | Auto-slow object speed + fewer lanes for 3.5-4.5 support mode after fail streak. | Improves inclusivity for younger/motor-developing players. | Medium | Small |

## 3) Net-New Game Concepts (3-5)

| Priority | Game concept | Age band | Learning goal | Core mechanic | Impact | Effort |
|---|---|---|---|---|---|---|
| P0 | Subitizing Firefly Jars | 3-5 | Rapid quantity recognition 1-5, then 6-9 | Brief dot flash -> immediate quantity tap | High | Small |
| P0 | Build-10 Workshop | 5-7 | Number composition/decomposition to 10/20 | Drag blocks into ten-frame and complete missing part | High | Medium |
| P0 | Subtraction Street | 6-7 | Subtraction as take-away and difference | Remove concrete objects, then map to equation | High | Medium |
| P1 | Sound Slide Blending | 4-6 | CV blending before full decoding | Tap consonant + vowel -> blend animation -> choose target | Medium-High | Medium |
| P1 | Spell-and-Send Post Office | 6-7 | Decode-to-encode transfer (spelling from sound) | Hear word -> drag letters RTL -> auto-validate | Medium-High | Medium |

## 4) Recommended First Sprint Slice (Highest Impact / Lowest Risk)

Sprint objective: improve retention and learning signal in 2-5 minute loops with minimal architecture risk.

1. Ship `counting-picnic` subitizing insert (P0 enhancement).
2. Ship `letter-sound-match` confusion recovery ladder (P0 enhancement).
3. Implement v1 of `Subitizing Firefly Jars` (new P0 game).
4. Scope `Build-10 Workshop` as next-ready story with state machine contract and Hebrew audio map.

Why this slice first:
- Covers both ages 3-4 and 5-7 in one sprint.
- Delivers one new game plus two low-effort, high-impact upgrades.
- Preserves existing engine patterns (React + `framer-motion` / DOM interactions / `xstate`), reducing delivery risk.

## 5) Mechanics Guardrails Applied

All recommendations keep Dubiland non-negotiables:
- One new variable per level.
- Action-triggered validation only.
- Icon-first controls (`▶`, `↻`, `💡`, `→`) with audio semantics.
- Adaptive simplification after 2 failures.
- 2-5 minute sessions and 44px+ touch targets.
