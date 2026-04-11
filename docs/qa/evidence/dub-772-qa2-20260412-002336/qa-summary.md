# DUB-772 QA2 Summary (2026-04-12)

## Scope
- Persistence + i18n/audio parity verification for Letter Story v2.
- v1 regression sanity check.

## Checks Run
1. `yarn workspace @dubiland/web typecheck` -> PASS
2. Deterministic key/audio parity script:
   - `docs/qa/evidence/dub-772-qa2-20260412-002336/v2-key-audio-parity.mjs`
   - output: `v2-key-audio-parity.json`
   - result: `totalKeys=267`, `missingLocale=0`, `missingAudioManifest=0`, `missingAudioFile=0`
3. Runtime v2 completion smoke on fresh local server `http://127.0.0.1:4315`
   - login via email flow
   - real child profile created from `/profiles` and selected (`Active child` became UUID `ba4a8fec-7136-45fd-a863-641d244b0880`)
   - automated step traversal reached completion summary (`26/26`, parent summary card visible)

## Runtime Verdict
- Optimistic completion UI appears (summary card renders immediately).
- Sync does not settle to success state; UI transitions to error state (`שגיאה כללית. נסו שוב.`) with retry button.
- Resource/network evidence from the same run shows only preflight game lookup:
  - `GET .../rest/v1/games?select=id&slug=eq.letterStorybookV2&is_published=eq.true -> 200`
- No `submit-game-attempt` invoke observed in captured runtime resource list.

## V1 Regression Sanity
- `/games/reading/letter-storybook` loads normally under same session/child profile.
- No raw i18n key leakage observed in initial render snapshot.

## Disposition
- FAIL for persistence acceptance in DUB-772 (write path not completing successfully in runtime).
- i18n/audio parity in scoped v2 keyset is PASS.
