# Sight Word Sprint — i18n + Audio Map

Issue: [DUB-356](/DUB/issues/DUB-356)  
Coordination targets: [DUB-354](/DUB/issues/DUB-354), [DUB-355](/DUB/issues/DUB-355)

## Key Families

- `common.games.sightWordSprint.title`
- `common.games.sightWordSprint.subtitle`
- `common.games.sightWordSprint.instructions.*`
- `common.games.sightWordSprint.prompts.wordIntro.*`
- `common.games.sightWordSprint.prompts.wordSelect.*`
- `common.games.sightWordSprint.prompts.frameComplete.*`
- `common.games.sightWordSprint.frames.*`
- `common.games.sightWordSprint.hints.*`
- `common.games.sightWordSprint.hints.confusionContrast.*`
- `common.games.sightWordSprint.hints.remediation.*`
- `common.games.sightWordSprint.hints.precisionNudge.*`
- `common.games.sightWordSprint.feedback.success.*`
- `common.games.sightWordSprint.feedback.retry.*`
- `common.games.sightWordSprint.feedback.encouragement.*`
- `common.words.highFrequency.*`
- `common.phrases.pronunciation.*`
- `common.parentDashboard.games.sightWordSprint.progressSummary`
- `common.parentDashboard.games.sightWordSprint.highFrequencyMastery`
- `common.parentDashboard.games.sightWordSprint.nextStep`

## Runtime Audio Path Patterns

- Game loop lines: `public/audio/he/games/sight-word-sprint/*.mp3`
- High-frequency words: `public/audio/he/words/high-frequency/*.mp3`
- Phrase transfer lines: `public/audio/he/phrases/pronunciation/*.mp3`
- Parent dashboard lines: `public/audio/he/parent-dashboard/games/sight-word-sprint/*.mp3`

## High-Frequency Inventory (Launch Pack)

Representative items in `common.words.highFrequency.*`:

- `אני`, `אתה`, `את`
- `הוא`, `היא`, `אנחנו`, `הם`, `הן`
- `זה`, `זאת`, `מה`, `מי`
- `יש`, `אין`, `גם`, `עם`
- `ב`, `על`, `אל`, `את`, `של`
- `פה`, `כאן`, `עכשיו`, `רק`, `עוד`, `כבר`, `כל`, `לא`, `כן`

## Sentence-Frame Transfer Pack

`common.phrases.pronunciation.*` adds short reading-transfer lines for Stage 2/3 frame completion, for example:

- `אֲנִי פֹּה.`
- `אַתָּה כָּאן.`
- `הִיא גַּם כָּאן.`
- `זֶה שֶׁל דּוֹבִי.`
- `מָה פֹּה?`

## Pronunciation Risk Notes (Visually Similar Frequent Words)

- `זה` / `זאת`: preserve clear ending distinction so the child hears singular-masc/fem contrast.
- `הוא` / `היא`: keep first syllable crisp (`הוּ` vs `הִ`) and avoid rushed delivery.
- Short function words (`ב`, `על`, `אל`, `את`): keep a tiny pause before/after in sentence modeling so each token is audible.
- Negation vs affirmation (`לא` / `כן`): use steady pace and clear pitch contrast to reduce fast-loop confusion.

## TTS Notes

- Keep prompt lines short (one action per sentence) to match icon-first gameplay.
- In remediation lines, emphasize `הַמִּלָּה` and `הַתְּחָלָה שֶׁל הַמִּלָּה` to reinforce first-grapheme strategy.
- Parent summary placeholders use overrides in `audio-overrides.json` for natural narration.
