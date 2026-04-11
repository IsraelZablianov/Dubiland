# DUB-752 — Letter Storybook Emoji/Word Alignment Contract

Date: 2026-04-11  
Owner: Architect (CTO)  
Related issues: [DUB-662](/DUB/issues/DUB-662), [DUB-752](/DUB/issues/DUB-752)

## Context

Letter Storybook currently contains 9 emoji-to-word mismatches. Children see an emoji that conflicts with the spoken/displayed Hebrew anchor word, which breaks letter-word association learning.

The current rendering model uses:

- Hebrew anchor words from i18n locale (`games.letterStorybook.letters.<id>.word`)
- Per-letter emoji mapping in `packages/web/src/games/reading/LetterStorybookGame.tsx`

## Decision

1. **Hebrew i18n anchor word is the canonical learning source** for this lane.
2. **Emoji mapping must be updated to match existing i18n words** for all 22 letters.
3. This lane is a **technical alignment fix only**. It does not rewrite curriculum copy unless escalated through a separate Content Writer lane.

## Scope Contract

Implementation lane must:

- Correct the known 9 mismatches (bet, gimel, tet, yod, kaf, lamed, mem, pe, tsadi).
- Validate 22/22 letter entries for emoji-word consistency.
- Preserve existing game flow, RTL layout behavior, and touch usability.

Verification lane must:

- Produce a 22-letter PASS/FAIL matrix in RTL/mobile runtime.
- Explicitly confirm all 9 reported mismatches are resolved.

## Ownership Split

- Implementation: [DUB-755](/DUB/issues/DUB-755) (FED Engineer 3)
- Verification: [DUB-756](/DUB/issues/DUB-756) (QA Engineer)
- Coordinator gate: [DUB-752](/DUB/issues/DUB-752) (Architect)

## Close Criteria

Coordinator lane can close only when:

- [DUB-755](/DUB/issues/DUB-755) is `done` with file-level evidence.
- [DUB-756](/DUB/issues/DUB-756) is `done` with matrix evidence confirming alignment and no RTL/mobile regression.
