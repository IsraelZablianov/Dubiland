# Root Family Stickers — i18n + Audio Map

Issue: [DUB-338](/DUB/issues/DUB-338)  
Coordination targets: [DUB-337](/DUB/issues/DUB-337), [DUB-339](/DUB/issues/DUB-339)

## Key Families

- `common.games.rootFamilyStickers.title`
- `common.games.rootFamilyStickers.subtitle`
- `common.games.rootFamilyStickers.instructions.*`
- `common.games.rootFamilyStickers.prompts.rootIntro.*`
- `common.games.rootFamilyStickers.prompts.sorting.*`
- `common.games.rootFamilyStickers.prompts.building.*`
- `common.games.rootFamilyStickers.prompts.phraseRead.*`
- `common.games.rootFamilyStickers.hints.*`
- `common.games.rootFamilyStickers.strategyPraise.*`
- `common.games.rootFamilyStickers.feedback.success.*`
- `common.games.rootFamilyStickers.feedback.retry.*`
- `common.games.rootFamilyStickers.feedback.encouragement.*`
- `common.roots.common.*`
- `common.words.pronunciation.*`
- `common.parentDashboard.games.rootFamilyStickers.progressSummary`
- `common.parentDashboard.games.rootFamilyStickers.confusions`
- `common.parentDashboard.games.rootFamilyStickers.nextStep`

## Runtime Audio Path Patterns

- Game loop lines: `public/audio/he/games/root-family-stickers/*.mp3`
- Root names: `public/audio/he/roots/common/*.mp3`
- Word pronunciation: `public/audio/he/words/pronunciation/*.mp3`
- Parent dashboard lines: `public/audio/he/parent-dashboard/games/root-family-stickers/*.mp3`

## Reading Transfer Targets (Nikud)

- `דּוֹבִי כּוֹתֵב.`
- `הַיֶּלֶד לוֹמֵד.`
- `הַיַּלְדָּה קוֹרֵאת.`
- `אֲנִי שׁוֹמֵר עַל הַתִּיק.`

## Pronunciation Risk Notes

- Prefix confusion risk: children may treat `מִ-` in `מִכְתָּב` / `מִקְרָא` as part of the root.
- Affix masking risk: ending-heavy words like `מִשְׁמֶרֶת` can hide the root if spoken too fast.
- Root contrast risk: `כ` / `ק` roots can blur in fast speech; keep first consonant crisp.
- Tense/form shift risk: `כָּתַב` vs `כּוֹתֵב`, `לָמַד` vs `לוֹמֵד` should be modeled as same-root, different form.

## TTS Delivery Guidance

- Root-name clips should use slower pacing and a short pause between root letters.
- In hint lines, emphasize `הַצְּלִיל הָרִאשׁוֹן` and `אוֹתִיּוֹת הַשֹּׁרֶשׁ`.
- In slow-mode lines, keep sentence length short and one action per sentence.
