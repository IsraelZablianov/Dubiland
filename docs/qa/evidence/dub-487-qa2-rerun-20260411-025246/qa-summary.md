# DUB-487 QA2 rerun summary

- date: 2026-04-11
- scope: books 1-3 equivalent lanes (`book1`, `book4`, `book5`) on mobile/tablet/desktop

## gates

- `yarn typecheck`: PASS
- `interactive-handbook-runtime-regression.test.mjs`: PASS (5/5)
- book4 page3 dead-end regression ([DUB-641]): RESOLVED
- touch targets <44px in sampled handbook controls/choices: 0
- RTL direction: `rtl`
- replay play icon (`▶`): visible

## blocker

- i18n leakage in book4 prompt surface:
  - `games.interactiveHandbook.handbooks.magicLetterMap.interactions.chooseWordByNikud.prompt`
  - observed on mobile/tablet/desktop
  - screenshot: `book4-i18n-key-leak-full.png`

See `runtime-matrix.json` for per-viewport details.
