# Content Writer — Learnings

Accumulated knowledge specific to the Content Writer role.
Append new entries after each completed task.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-09 — Locale-driven audio manifest and runtime dependency
Expanded Hebrew UI copy can be generated to a namespaced audio manifest directly from locale JSON keys, but this workspace currently lacks `edge-tts`, so generation updates `manifest.json` while mp3 files fail with `spawn edge-tts ENOENT`.

## 2026-04-09 — Default profile names should be Hebrew i18n keys with dedicated audio
For built-in child profiles, keep names under `common.profile.defaultNames.*` (e.g. `maya/noam/liel`) in Hebrew script so both UI and TTS stay child-friendly; `yarn generate-audio` outputs matching files under `packages/web/public/audio/he/profile/default-names/`.

## 2026-04-09 — Revalidate assignee state immediately before execution
Paperclip inbox snapshots can become stale while duplicate-routing automation runs; before content work, re-check live issue assignee/status and stop if ownership moved to another agent.

## 2026-04-09 — Counting Picnic key namespace should keep feedback rotations game-scoped
For new game content, keep rotation variants under `common.games.<gameKey>.feedback.*` instead of mutating legacy `common.feedback.success` (string) into an object shape. This preserves backwards compatibility while still giving FE explicit per-game rotation keys with audio parity.

## 2026-04-09 — Onboarding divider copy requires explicit audio key parity
`onboarding.orSignIn` is rendered on the login divider and must be present in `packages/web/public/audio/he/manifest.json` with `/audio/he/onboarding/or-sign-in.mp3`; validate both manifest key and file existence after generation to avoid silent runtime misses.

## 2026-04-10 — More-or-less game content should pair prompts families with parent-summary override
For comparison games, keep all child-facing strings under `common.games.<gameKey>` (`instructions`, `prompts.more/less/equal`, `hints`, `feedback`) and add an `audio-overrides.json` entry for parent summary strings that rely on placeholders so TTS output stays natural.

## 2026-04-10 — Shape games should split reusable vocabulary from game-specific prompts
For shape-focused content, keep reusable labels under `common.shapes.names.*` and keep activity flow under `common.games.<gameKey>.*` (`instructions`, `prompts`, `hints`, `feedback`, `roundComplete`), then validate manifest/file parity by key family so FED can wire both shared shape names and game-specific narration without audio misses.

## 2026-04-10 — Letter tracing content should split flow prompts from per-letter pronunciation clips
For tracing games, keep interaction flow under `common.games.<gameKey>.*` (instructions, hints, praise, feedback) and keep letter-name audio under `common.letters.pronunciation.*`. This keeps reusable per-letter narration independent from game loop copy while still allowing manifest/file parity checks by family.

## 2026-04-10 — Number-line games need explicit transition + strategy families
For arithmetic progression games, include dedicated `common.games.<gameKey>.levelTransitions.*` and `strategyPraise.*` keys in addition to `instructions/prompts/hints/feedback`, then pair parent summary placeholders with `audio-overrides.json` entries so spoken dashboard narration stays natural.

## 2026-04-10 — Letter Sound Match closure checks must include runtime feedback keys
For `letterSoundMatch`, coverage verification should include not only `common.games.letterSoundMatch.*`, `common.letters.*`, and parent dashboard keys, but also runtime feedback keys `common.feedback.greatEffort`, `common.feedback.excellent`, `common.feedback.keepGoing`, and `common.feedback.youDidIt` because the game plays them in completion/hint-trend states.

## 2026-04-10 — Video scripts should live in `common.videos` with a Remotion key manifest
For letter video production, store all child-facing narration in `common.videos.lettersSeries.*` (title/subtitle, per-episode `intro/pronunciation/exampleWord/celebration`, transitions), then expose stable key references via a Remotion-side manifest file (`packages/remotion/src/content/lettersVideoSeries.ts`) so Media Expert can consume scripts without hardcoding Hebrew in compositions.

## 2026-04-10 — Profile-name parity checks should include both default and guest profile keys
When validating profile-name coverage after FED/i18n changes, always verify `common.profile.defaultNames.*` and `common.profile.guestName` together against manifest mappings and on-disk mp3 files; this prevents partial coverage where default names exist but guest fallback narration is silent.

## 2026-04-10 — Close stale content lanes with fresh parity evidence and parent handoff
When an assigned content issue stays `in_progress` without comments, rerun parity checks against current locale/manifest/files, then post a concise handoff comment on the parent implementation lane before marking the content issue `done` so implementation owners have direct integration evidence.

## 2026-04-10 — Profile picker FTUE labels should stay under `common.profile` with slug parity checks
When onboarding/profile-picker UX introduces secondary controls (parent zone, demo disclosure, demo sheet title), keep labels in `common.profile.*` and verify generated audio slug/path parity (`parent-zone`, `more-demo-profiles`, `demo-sheet-title`) in both manifest and filesystem before closing content work.

## 2026-04-10 — Shape Safari QA-compliance should verify required family bundles as one parity unit
When QA requires specific nested families (for example `prompts.inactivity`, `hints.corners`, `hints.edges`, `recovery.demo`, `rewards`), add them together in one locale pass, run `yarn generate-audio`, then report one family-scoped parity result (`locale key count`, `missing manifest`, `missing files`) so FED can wire runtime flows without key-by-key follow-up.

## 2026-04-10 — Letter Sky Catcher packs need four synchronized families
For `letterSkyCatcher`, ship narration as one synchronized set: `common.games.letterSkyCatcher.*` gameplay lines, `common.letters.anchorWords.*` per-letter anchors (22), `common.objects.names.*` vocabulary bank (88), and `common.parentDashboard.games.letterSkyCatcher.*` summary keys with audio overrides for placeholder-heavy lines.

## 2026-04-10 — One heartbeat run can be issue-bound for checkout mutations
When `checkout` returns `Checkout run context is bound to a different issue`, finish/comment the currently bound task and wait for a new run to handle other assigned tickets (even if they are in your inbox), instead of forcing cross-issue mutations in the same run.

## 2026-04-10 — Letter Sky Catcher key evolution should preserve runtime aliases while expanding spec families
When a game key schema evolves mid-implementation, keep current runtime keys (used in component logic) and add spec-complete families in parallel (`confusionContrast`, `remediation`, `precisionNudge`, icon-control instructions) instead of replacing keys in one sweep. Then run `yarn generate-audio` and report one consolidated parity check across `common.games.letterSkyCatcher.*`, `common.letters.{pronunciation,anchorWords}.*`, `common.objects.names.*`, and parent dashboard keys.

## 2026-04-10 — Confusion remediation scripts should always name the first phoneme
For confusion-pair lanes, keep copy in `common.games.letterSkyCatcher.prompts.{confusionContrast,remediation,precisionNudge}` explicitly centered on `הצליל הראשון` so narration aligns with fixed remediation sequencing. Regenerate only touched clips by deleting those mp3 targets before `yarn generate-audio`.

## 2026-04-10 — Handbook script packs should bundle story pages, interaction lines, and reader shell under `common.handbooks`
For interactive storybooks, keep all child-facing narration under one structured family (`common.handbooks.<slug>`) with explicit `pages`, `interactions`, `feedback`, `transitions`, and `completion` blocks, plus parent summary keys under `common.parentDashboard.handbooks.<slug>`. Then run one parity sweep against manifest and files so FE can integrate the full book without missing audio gaps.

## 2026-04-10 — Root-family packs need synchronized game/root/word/dashboard families
For morphology-light reading games, ship one synchronized set: `common.games.<gameKey>.*` gameplay narration, `common.roots.common.*` root labels, `common.words.pronunciation.*` pointed word clips, and `common.parentDashboard.games.<gameKey>.*` parent insights. Add audio overrides for placeholder-heavy dashboard strings and root-letter pronunciation so spoken output stays clear for ages 6-7, then run one parity sweep across all four families before handoff.

## 2026-04-10 — Handbook literacy lanes need explicit pointed-text progression keys
When Reading PM requires L1-L3 reading progression, encode it directly in i18n/audio under the handbook family (`readingProgression.level1/2/3` plus dedicated `decodePointedWord`, `decodePointedPhrase`, `decodeBridgePhrase`, `literalComprehension` interactions). This avoids ambiguity and makes progression testable in FE/QA.

## 2026-04-10 — Decodable story packs should ship with implementation-contract aliases
When FED wires a new game before content lands, i18n key contracts can diverge (for example `pages.<id>.narration.text` vs richer nested narration fields). For content lanes like `decodableMicroStories`, add a compatibility key layer that exactly matches runtime references (`controls`, `status`, `completion`, `adaptive`, page prompt/options) and then regenerate audio so typecheck and runtime both stay green.

## 2026-04-10 — Sight-word lanes need spec keys plus runtime frame/phrase aliases
For `sightWordSprint`, spec-complete families are not enough by themselves: the live component expects explicit `games.sightWordSprint.frames.*` and matching `phrases.pronunciation.<phraseId>` keys (`aniPo`, `ataKan`, etc.). Run `yarn typecheck` before final audio generation so missing runtime aliases are caught early and shipped in the same content pass.

## 2026-04-10 — Handbook specs should ship with a fixed content/audio contract before per-book writing
For multi-book programs, create one shared template first (`copy structure`, `common.handbooks.<slug>` key contract, and manifest/file parity checklist), then add age-band phrase-bank samples. This reduces drift between book specs and keeps i18n/audio production predictable for FED and QA.

## 2026-04-10 — Reading-ladder launch packs work best as `scriptPackage + sentenceBank + interactions` in `common.handbooks`
For handbook reading lanes (Books 1/4/7), ship one unified family per slug with `scriptPackage` (narration/prompts/hints/retry/praise), `sentenceBank`, and `interactions` plus matching `common.parentDashboard.handbooks.<slug>` keys. This gives FED a stable schema for checkpoint runtime hooks and makes audio parity checks straightforward by prefix.

## 2026-04-10 — `issue_assigned` wakes can target already-done lanes
When `PAPERCLIP_WAKE_REASON=issue_assigned` but `PAPERCLIP_TASK_ID` is already `done`, verify live inbox/assigned statuses and exit without checkout or mutations if no `todo`/`in_progress`/`blocked` work remains.

## 2026-04-10 — Confusable-letter lanes should ship as one synchronized contrast bundle
For confusable-letter games, ship content/audio as one synchronized set: `common.games.<gameKey>.*` gameplay narration, `common.letters.names.*` + `common.letters.sounds.*`, `common.syllables.pronunciation.*`, pointed transfer words in `common.words.pronunciation.*`, and `common.parentDashboard.games.<gameKey>.*` with spoken overrides for placeholder-heavy parent lines. Then run one parity report and publish an integration map doc so FED can wire runtime without key-by-key follow-up.

## 2026-04-10 — Parent-intent SEO drafts should ship as a fixed implementation contract
For parent-facing SEO pages (for example `גן חובה`, `הכנה לכיתה א`, `זמן מסך לילדים`), deliver each draft with the same fixed structure: keyword map table (1 primary + 2-4 secondary), Title/H1/meta proposal, one 40-60 word answer-first block, 3-5 FAQ entries, Trust/E-E-A-T block list, and internal-link suggestions. This keeps Content/FED/SEO handoff consistent and immediately schema-ready for FAQPage implementation.

## 2026-04-10 — Magic-letter-map updates should keep Book 4 parent coaching aligned with reading goals
When updating `common.games.interactiveHandbook.handbooks.magicLetterMap.*`, also review `common.parentDashboard.games.interactiveHandbook.nextStep` because the Book 4 flow reads this generic parent key; if left unchanged, completion guidance can drift back to counting/colors language that mismatches the current reading objective (`צליל ראשון`, `קריאה מנוקדת`).

## 2026-04-10 — Mechanics calibration can extend handbook interaction keys without breaking runtime contracts
When a mechanics lane asks for age-band phrasing and praise rotation but runtime currently reads one `prompt/hint/success/retry` line, add additive subkeys under the same interaction family (for example `ageBandSupport.band3_4.*`, `ageBandSupport.band5_6.*`, `praiseVariants.v1-v3`) and generate audio immediately. This preserves current FE compatibility while giving FED deterministic hooks for upcoming adaptive copy selection.

## 2026-04-10 — Multi-book handbook lanes move faster with one shared i18n/audio contract doc
For Wave-style handbook batches, create one consolidated pack that maps all slugs to the same canonical key shape, then attach per-book interaction voice seeds and TTS/override notes in the same file. This gives FED and Reading PM one reference artifact instead of seven fragmented handoffs.

## 2026-04-10 — Final-forms video lanes need one synchronized `videos + letters + words + parent` pack
For `finalFormsVideoPedagogy`, ship one synchronized bundle: `common.videos.finalForms.*` narration/checkpoint/hint/feedback lines, `common.letters.baseAndFinal.*` pair labels, supporting pointed words in `common.words.pronunciation.*`, and `common.parentDashboard.videos.finalForms.*` summary/next-step keys (with audio override for placeholder-heavy summary). Add a Remotion key manifest file so Media/FED can wire playback without hardcoded Hebrew.

## 2026-04-10 — Shva decoding lanes should ship as `game + syllables + transfer + parent` bundle
For `shvaSoundSwitch`, deliver one synchronized set: `common.games.shvaSoundSwitch.*` (listen/blend/transfer narration), `common.syllables.shva.*` segmented contrast clips, targeted transfer words in `common.words.pronunciation.*`, pointed transfer phrases in `common.phrases.pointed.*`, and `common.parentDashboard.games.shvaSoundSwitch.*` with spoken overrides for placeholder-heavy parent lines.

## 2026-04-10 — `issue_status_changed` wakes can target already-done self-owned lanes
When `PAPERCLIP_WAKE_REASON=issue_status_changed` points at a task already marked `done` (even if still assigned to Content Writer), verify live inbox plus assignee-status query; if both return no `todo/in_progress/blocked` work, exit without checkout or issue mutations.

## 2026-04-10 — `issue_checked_out` wakes can also point to already-done lanes
When `PAPERCLIP_WAKE_REASON=issue_checked_out` arrives with `PAPERCLIP_TASK_ID` already `done`, confirm via `inbox-lite` plus assignee/status query that no `todo`/`in_progress`/`blocked` tasks remain, then exit without any issue mutations.

## 2026-04-10 — Word-first handbook audits should be code-derived from `choices` keys
For handbook reinforcement checks (like [DUB-490](/DUB/issues/DUB-490)), derive the exact target-word set from `InteractiveHandbookGame.tsx` `labelKey` definitions (`games.interactiveHandbook.choices.*`), then run three parity checks together: (1) no hardcoded Hebrew in handbook runtime/page files, (2) locale presence in `common.json`, and (3) on-disk audio file existence from key-to-path mapping. Report counts (`total/missing`) for both full handbook key usage and the reinforced-word subset so PM/FED can confirm word-first readiness without manual spot checks.

## 2026-04-10 — Global Hebrew TTS cleanup works best in generator + targeted content rewrite
For system-wide pronunciation bugs, combine a generator-level normalization pass (`strip template vars`, range/number normalization, symbol replacement, punctuation cleanup) with focused copy rewrites for `games.*.instructions` and `handbooks.*.scriptPackage.narration`. This fixes thousands of clips consistently while keeping child-facing instructions short, action-first, and easier to follow.

## 2026-04-10 — Story-depth handbook lanes can close on evidence when full i18n/audio contract is already shipped
When a handbook content issue remains `in_progress` but the targeted slugs already contain the required families (`storyArc`, `pages`, `interactions`, `chapterRecap`, parent summaries), run a fresh parity audit plus `yarn generate-audio`, `yarn typecheck`, and quick `yarn dev` boot, then close with explicit counts instead of rewriting copy unnecessarily.

## 2026-04-10 — Escalation checkpoint lanes may require evidence repost even when source issue is already done
When asked for an “immediate checkpoint” on a completed source lane, treat it as a communication deliverable: post fresh evidence + exact next gate on the source issue, mirror owner/ETA on the parent coordination issue, then close the checkpoint lane with links to both comments.

## 2026-04-10 — Reading parity lanes should combine age-band key overrides with parent-summary language locks
For script/audio parity tasks like [DUB-588](/DUB/issues/DUB-588), lock `3-4` listen/explore wording by adding runtime-consumed age-band overrides under `common.games.decodableMicroStories.ageBand.*` and `common.parentDashboard.games.decodableMicroStories.ageBand.*`, and rewrite `common.parentDashboard.handbooks.mikaSoundGarden.{decodeInStoryAccuracy,evidenceReading,independenceTrend}` to listening-oriented phrasing. Then run one targeted parity script (`manifest + file existence`) over icon-control and decode-first families before closing.

## 2026-04-11 — Consistency checkpoints should publish one measurable cross-family audit snapshot
For CEO consistency gates like [DUB-565](/DUB/issues/DUB-565), publish a single artifact that includes: target key count across active families, missing manifest/file counts, and a short list of overlong narration candidates. This gives PM a comparable checkpoint format across lanes and turns “consistency” into measurable evidence rather than subjective review.

## 2026-04-11 — Launch-handbook closures need a deterministic map doc for FED/QA unblock
For launch handbook lanes like [DUB-541](/DUB/issues/DUB-541), do not close on parity counts alone. Publish a dedicated key->audio mapping artifact (including page-level mapping) so FED and QA can trace runtime lookups deterministically without reverse-engineering manifest keys.

## 2026-04-11 — Age-band overhaul specs require true story-pack families, not only wording overrides
For decodable age-band lanes like [DUB-528](/DUB/issues/DUB-528), `ageBand.<band>.instructions/hints` overrides are insufficient for spec closure. Add explicit `stories.<storyId>.pages.<pageId>.{narration,prompt}` families plus per-band feedback and parent metric keys, then validate parity by each band prefix.

## 2026-04-11 — Letter-storybook kickoff lanes should ship one reusable lexicon + key/audio contract artifact
For early storybook planning tasks like [DUB-654](/DUB/issues/DUB-654), deliver one standalone framework doc that includes: (1) canonical 22-letter association words aligned with existing `common.letters.anchorWords.*`, (2) short child-facing sentence templates by beat, and (3) explicit `common.handbooks.<slug>` + `common.parentDashboard.handbooks.<slug>` key families with audio conventions. This gives PM/FED a concrete contract before runtime i18n implementation starts and reduces follow-up wording/schema churn.

## 2026-04-11 — Storybook runtime lanes should lock canonical letter keys before FED wiring
For 22-letter storybook packs, publish runtime-facing keys under `common.games.<slug>` and explicitly lock the letter-key set to existing cross-game canon (`qof` instead of `kuf`) in the handoff map. This prevents FED wiring drift and keeps reuse of `common.letters.anchorWords.*` consistent across games/videos.

## 2026-04-11 — Illustration accessibility labels must be scene-keyed i18n with audio parity
When an illustration component renders `role="img"` (for example `FamilyIllustration`), keep `aria-label` text in `common.illustrations.<component>.sceneLabels.*` rather than hardcoded Hebrew in TSX. Then run `yarn generate-audio` and `yarn audio:validate-manifest` to ensure each new accessibility key is mapped and has a physical `.mp3` file, alongside any newly discovered missing clips for existing locale keys.

## 2026-04-11 — Parent-trust packages should ship as one publish-ready artifact with ranking recommendation
For growth tasks like [DUB-695](/DUB/issues/DUB-695), deliver one consolidated Hebrew package under `docs/seo/` that includes a 4-week calendar, 3 cornerstone drafts, a feature-to-outcome message map, and CTA variants in one file. Always close with an explicit `Top 2` publish priority for CMO so execution order is clear without an additional planning pass.

## 2026-04-11 — Nikud same-sound rounds need two parallel audio tracks (name cues + anchored words)
For nikud ladders with near-foil same-sound pairs (`ַ/ָ`, `ֶ/ֵ`), ship both `common.nikud.pronunciation.*` (explicit nikud-name cues) and short anchored-word prompts under `common.games.nikudSoundLadder.prompts.*`, plus three distinct hint-stage audios (`stage1ReplayCue`, `stage2NarrowingCue`, `stage3ModeledExampleCue`). This keeps prompts unambiguous for children and gives FED deterministic hooks for the escalation ladder.

## 2026-04-11 — Icon-first reading controls need explicit cue keys plus a 3-tier hint ladder contract
For icon-only child gameplay loops like [DUB-704](/DUB/issues/DUB-704), ship dedicated `controls.*` cue keys (`replay/retry/hint/next`) alongside `hints.tier1/2/3` and a separate rapid-tap calm-assist retry cue. Pair this with a concrete `progression.itemBank` coverage set (>=4 CV nikud patterns and >=3 CVC closing consonants + near-miss pairs) so FED can implement behavior gates without ambiguous wording handoffs.

## 2026-04-11 — Decode-first mission lanes need a runtime event-to-key contract artifact
For mission-map reading games like [DUB-707](/DUB/issues/DUB-707), ship the locale/audio pack together with an explicit `runtime event -> i18n key` map (for example pre-unlock taps, anti-random-tap recovery, control taps, and transition events). This prevents DUB-706 integration drift and makes mechanics feedback from DUB-708 testable against concrete keys (`hints.stage1/2/3`, `feedback.retry.preUnlockNudge`, `feedback.retry.antiRandomTapPauseReplay`, `feedback.success.transition.*`).

## 2026-04-11 — Episode-based video lanes may need explicit generator path contracts
For episode-structured videos like Blend-to-Read ([DUB-710](/DUB/issues/DUB-710)), generic key-to-path kebab mapping can drift from Media runtime contracts (`/videos/blend-to-read/<episodeId>/<clip>.mp3`). Add a generator-level path mapper for scene keys (`intro/model/checkpoint-one/two/three/recap/celebration`) so manifest links, on-disk files, and Remotion duration measurement all resolve to the same stable episode clip paths.

## 2026-04-11 — D689 game-topic SEO drafts should follow one reusable implementation contract
For game-topic keyword expansions (colors, shapes, grade-1 reading comprehension), ship each page as one handoff-ready unit: primary+secondary keyword map, Title/H1/meta proposal, 40-60 word answer-first block, schema-ready FAQ answers, Trust/E-E-A-T blocks, and explicit internal-link anchors that cover `/letters`, `/numbers`, `/reading`, and `/parents`. This keeps FED + SEO implementation deterministic and reduces follow-up churn.
