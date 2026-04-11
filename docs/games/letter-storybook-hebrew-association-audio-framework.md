# Letter Storybook Hebrew Association + Audio Script Framework

Owner: Content Writer  
Issue: [DUB-654](/DUB/issues/DUB-654)  
Parent lane: [DUB-647](/DUB/issues/DUB-647)

## Purpose

Define one implementation-ready content contract for the upcoming "Learn the Letters" storybook so PM/FED/Media can ship with:

1. One canonical 22-letter association lexicon
2. Child-safe sentence style for narration and interaction prompts
3. Stable i18n key families and audio conventions

## Canonical 22-Letter Association Lexicon (v1)

Use these as the primary association words for storybook pages. They align with existing `common.letters.anchorWords.*` usage to avoid cross-game vocabulary drift.

| Letter | Key | Primary association | Backup (same letter) | Image direction |
|---|---|---|---|---|
| א | `alef` | אריה | אננס | Friendly lion waving to דובי |
| ב | `bet` | בלון | בננה | Bright balloon floating above the path |
| ג | `gimel` | גזר | גמל | Big carrot garden with one clear carrot |
| ד | `dalet` | דג | דלת | Colorful fish in a small pond |
| ה | `he` | הר | הליקופטר | Round mountain with smiling sun |
| ו | `vav` | ורד | וילון | Red rose close-up, simple background |
| ז | `zayin` | זברה | זית | Zebra with clear black-white stripes |
| ח | `het` | חתול | חלון | Cat peeking from a window |
| ט | `tet` | טווס | טלפון | Peacock with open tail |
| י | `yod` | ילד | יונה | Child waving hello to דובי |
| כ | `kaf` | כובע | כדור | Hat on a bench, single focal object |
| ל | `lamed` | לימון | לב | Lemon tree branch with one lemon |
| מ | `mem` | מטרייה | מנורה | Open umbrella in light rain |
| נ | `nun` | נר | נעל | Candle with safe soft glow |
| ס | `samekh` | סוס | ספר | Horse standing near a fence |
| ע | `ayin` | ענן | עוגה | Soft cloud over green field |
| פ | `pe` | פרח | פיל | One big flower with clear petals |
| צ | `tsadi` | צב | ציפור | Turtle walking slowly on grass |
| ק | `qof` | קוף | קטר | Monkey hanging from a branch |
| ר | `resh` | רכבת | רימון | Train with two simple wagons |
| ש | `shin` | שמש | שולחן | Smiling sun with few rays |
| ת | `tav` | תפוח | תוף | Red apple on a plate |

## Sentence Style Contract (Child-Facing)

### Global style rules

- One action per sentence
- 3-8 words per line
- Concrete verbs only (`נוגעים`, `אומרים`, `בוחרים`, `מקשיבים`)
- Positive framing only
- Repeat letter + anchor word at least twice per page

### Per-letter script beats

| Beat | Goal | Template |
|---|---|---|
| `intro` | Identify the letter | `זאת האות {{symbol}}.` |
| `association` | Bind symbol to known word | `{{symbol}} של {{word}}.` |
| `microStory` | Add one narrative hook | `{{word}} פוגש את דובי בדרך.` |
| `prompt` | Ask for one clear action | `איפה האות {{symbol}}? נוגעים בה יחד.` |
| `hint` | Gentle guidance | `נחפש את {{symbol}} בתחילת {{word}}.` |
| `success` | Immediate praise | `יופי! מצאנו את {{symbol}}.` |
| `retry` | Gentle retry | `ננסה שוב יחד. מחפשים את {{symbol}}.` |

### Praise rotation bank (recommended)

- `יופי!`
- `כל הכבוד!`
- `מעולה!`
- `נהדר!`
- `הצלחתם!`

## i18n Key Contract (Proposed)

Use slug `letterStorybook`.

### Storybook families

- `common.handbooks.letterStorybook.meta.{title,subtitle,estimatedDuration}`
- `common.handbooks.letterStorybook.intro.{welcome,howToPlay}`
- `common.handbooks.letterStorybook.letters.<letterKey>.{symbol,name,associationWord,imageAlt}`
- `common.handbooks.letterStorybook.letters.<letterKey>.narration.{intro,association,microStory}`
- `common.handbooks.letterStorybook.letters.<letterKey>.interaction.{prompt,hint,success,retry}`
- `common.handbooks.letterStorybook.transitions.{nextLetter,checkpoint,outro}`
- `common.handbooks.letterStorybook.feedback.{success.v1,success.v2,encouragement.v1,encouragement.v2}`
- `common.handbooks.letterStorybook.finalForms.<finalKey>.{intro,exampleWord,prompt,success,retry}` (optional phase)

### Parent dashboard families

- `common.parentDashboard.handbooks.letterStorybook.{progressSummary,nextStep,letterFocus,confusionFocus}`

## Audio Script Format and Conventions

### Source of truth

- Display text lives in `packages/web/src/i18n/locales/he/common.json`
- Spoken overrides (only when needed) live in `packages/web/src/i18n/locales/he/audio-overrides.json`
- Every key above must resolve to one `.mp3` path in `packages/web/public/audio/he/manifest.json`

### Line-format table for script handoff

| Field | Required | Notes |
|---|---|---|
| `key` | yes | Full i18n key |
| `displayText` | yes | Child-visible Hebrew text |
| `spokenOverride` | optional | Use when placeholders/reading rhythm need spoken rewrite |
| `speechNote` | optional | `slow_word_intro`, `step_pause`, `celebration_pitch`, `counting_cadence` |
| `voiceProfile` | optional | `dubi_default` |

### Audio path expectation (by current generator)

`common.handbooks.letterStorybook.letters.alef.narration.intro`  
-> `/audio/he/handbooks/letter-storybook/letters/alef/narration/intro.mp3`

`common.parentDashboard.handbooks.letterStorybook.nextStep`  
-> `/audio/he/parent-dashboard/handbooks/letter-storybook/next-step.mp3`

## Voice Profile Recommendation

- Character: דובי
- Preferred neural voice target (future SSML-capable pipeline): `he-IL-AvriNeural`
- Fallback: `he-IL-HilaNeural`
- Delivery: calm, warm, not rushed

Note: current repo generator (`scripts/generate-audio.py`) is plain-text gTTS flow. Keep SSML intent as `speechNote` metadata in specs until the TTS pipeline is upgraded.

## Production Checklist

1. Add all key families to `common.json` (no hardcoded runtime Hebrew)
2. Add `audio-overrides.json` entries only where spoken text should differ
3. Run `yarn generate-audio`
4. Verify `manifest.json` and audio files (`node scripts/validate-audio-manifest.mjs`)
5. QA spot-check first and last letters (`א`, `ת`) and one confusable pair (`א/ע` or `ט/ת`)

## Notes for PM Integration

- If PM wants simpler early pages (age 3-4), use only `intro + association + prompt + success` beats and postpone `microStory` to age 5+ mode.
- Keep the primary association words stable across storybook, video, and game lanes; use backup words only for repetition variation.
