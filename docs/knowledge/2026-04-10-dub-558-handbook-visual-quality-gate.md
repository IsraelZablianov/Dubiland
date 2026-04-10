# DUB-558 — First Handbook Visual Quality Gate (2026-04-10)

## Scope
- First launch handbook visual pack: `packages/web/public/images/handbooks/magic-letter-map/` (cover + pages 01-10 + compact variants).
- Objective from [DUB-558](/DUB/issues/DUB-558): verify handbook readiness, list critical visual blockers, and define an unblock path independent from full-system replacement in [DUB-495](/DUB/issues/DUB-495).

## Evidence Reviewed
- Prior full image audit: `docs/knowledge/2026-04-10-dub-495-image-audit.md` (handbook family scored 2/10).
- Replacement mapping and prompts: 
  - `docs/knowledge/2026-04-10-dub-495-replacement-map.md`
  - `docs/knowledge/2026-04-10-dub-495-nano-banana-shotlist.md`
- In-repo visual spot-check of current assets:
  - `packages/web/public/images/handbooks/magic-letter-map/cover.png`
  - `packages/web/public/images/handbooks/magic-letter-map/page-01.png`
  - `packages/web/public/images/handbooks/magic-letter-map/page-10.png`
- Pipeline and budget check:
  - `yarn workspace @dubiland/web images:budgets`
  - Result: PASS, including handbook preload budget `32.5 KiB / 60 KiB`.

## Gate Decision
- **Technical packaging gate:** PASS
  - Full format coverage exists for first handbook pages (`png`, `webp`, `avif`, and compact `960` variants).
  - Image budgets and preload budget pass.
- **Visual quality gate:** FAIL
  - Current images are flat/placeholder-grade and far below the board quality bar in [DUB-493](/DUB/issues/DUB-493).
  - Scene-to-scene variation is minimal; pages feel near-duplicate with low narrative progression.
  - Art does not meet the "premium children storybook" standard targeted in current Media guidance.

## Critical Gaps Blocking Handbook Readiness
1. No high-fidelity Nano Banana replacement masters are in place for handbook-critical assets:
   - cover + pages 01-10 (`11` masters total at `1600x1000`).
2. The current visual language lacks depth/texture and does not support launch-grade story immersion for ages 5-6.
3. Existing blocker remains active: Gemini web UI sign-in is required before Nano Banana generation can run.

## Handbook-Only Unblock Path (Isolated from Full DUB-495 Stream)
1. **Auth unblock (board action):** sign in at `https://gemini.google.com` in the runtime browser context and confirm on [DUB-495](/DUB/issues/DUB-495).
2. **Handbook-critical generation lane only:** produce and replace the 11 `magic-letter-map` masters first (cover + page-01..10), then derive `webp/avif/960` via the existing pipeline.
3. **Quick handbook QA + ship gate:** run image budgets + visual smoke in handbook route; ship handbook pack even if non-handbook image families are still in-progress.
4. **Continue broader DUB-495 after handbook lock:** complete thumbnails/home/mascot/topic backlog in the full replacement lane.

## Owner + ETA + Blocker Matrix
| Workstream | Owner | ETA (after dependencies) | Blocking dependency | Evidence/links |
|---|---|---|---|---|
| Gemini auth in runtime browser | Board / PM | 5-10 min once attended | Board sign-in pending | [DUB-495](/DUB/issues/DUB-495) |
| Generate handbook master pack (11 scenes) | Media Expert | 45-60 min after auth | Gemini auth | `docs/knowledge/2026-04-10-dub-495-nano-banana-shotlist.md` |
| Derive optimized variants + budget validation | Media Expert | 10-15 min after masters | Master generation complete | `yarn workspace @dubiland/web images:budgets` |
| Handbook route visual smoke (RTL + readability) | Media Expert + FED | 15-20 min after derivation | Updated files in place | [DUB-558](/DUB/issues/DUB-558) |

## Risk Note
If auth remains blocked, handbook launch visuals remain below required quality despite technical pipeline readiness.
