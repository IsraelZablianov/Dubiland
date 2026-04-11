# DUB-699 QA2 rerun notes

## Verification run

- `yarn typecheck` PASS
- `yarn audio:validate-manifest` PASS (`entries: 4227`, `missing files: 0`)
- Targeted key/audio parity check for `games.timeAndRoutineBuilder.*` + `parentDashboard.games.timeAndRoutineBuilder.*`: `67` scoped keys, `missingAudio=0`
- Playwright runtime probe on `http://127.0.0.1:4325/games/numbers/time-and-routine-builder`

## Mandatory gate rerun status

- Touch target fix verified: `.time-routine__slot-clear` now renders at `60x60`.
- Submit-style gate fix verified: `הסבב הבא` is disabled until completion; no `solve-before-next` text appears.
- Replay affordances verified:
  - Checkpoint surface contains one replay `▶` control.
  - Completion surface contains one replay `▶` control.
- Audio-first encouragement path verified in earlier runtime probe (`HTMLMediaElement.play()` captured encouragement audio after slot assignment).

## Remaining blocker

- i18n blocker: after completing round 1, instruction row renders raw key `feedback.success.wellDone` instead of localized Hebrew text.
  - Runtime evidence: `runtime-check.json` (`round1Message`)
  - Code path:
    - `SUCCESS_ROTATION` uses `feedback.success.wellDone|amazing|celebrate` keys
      (`packages/web/src/games/numbers/TimeAndRoutineBuilderGame.tsx:97`)
    - message renderer calls `t(message.key)` in instruction row
      (`packages/web/src/games/numbers/TimeAndRoutineBuilderGame.tsx:1300-1302`)
  - Impact: violates i18n completeness gate (child-facing copy should never expose raw keys).

## Supporting code references (rerun-fixed items)

- Encouragement now calls audio path through `setMessageWithAudio(...)`:
  `packages/web/src/games/numbers/TimeAndRoutineBuilderGame.tsx:865-867`
- Submit-gate message removed + next action guard via disabled state:
  `packages/web/src/games/numbers/TimeAndRoutineBuilderGame.tsx:1055-1058`,
  `packages/web/src/games/numbers/TimeAndRoutineBuilderGame.tsx:1538-1545`
- Checkpoint/completion replay controls:
  `packages/web/src/games/numbers/TimeAndRoutineBuilderGame.tsx:1191-1209`,
  `packages/web/src/games/numbers/TimeAndRoutineBuilderGame.tsx:1237-1247`
- Slot clear touch minimum:
  `packages/web/src/games/numbers/TimeAndRoutineBuilderGame.tsx:1811-1816`
- Clock options now include icon affordance in code:
  `packages/web/src/games/numbers/TimeAndRoutineBuilderGame.tsx:1497-1501`
