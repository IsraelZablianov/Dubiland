# Letter Story v2 — Hebrew Narrative + i18n/Audio Pack

Issue: [DUB-758](/DUB/issues/DUB-758)  
Parent feature: [DUB-664](/DUB/issues/DUB-664)  
Updated on: 2026-04-11

## 1) i18n key plan (runtime-safe, no hardcoded Hebrew)

Implemented/validated families:

- `common.games.letterStorybook.cover.*`
- `common.games.letterStorybook.instructions.*`
- `common.games.letterStorybook.controls.*`
- `common.games.letterStorybook.letters.<letterKey>.*` (22 letters, canonical keys: alef, bet, gimel, dalet, he, vav, zayin, het, tet, yod, kaf, lamed, mem, nun, samekh, ayin, pe, tsadi, qof, resh, shin, tav)
- `common.games.letterStorybook.checkpoints.{one,two,three}.*`
- `common.games.letterStorybook.finalForms.*`
- `common.games.letterStorybook.transitions.*`
- `common.games.letterStorybook.feedback.*`
- `common.games.letterStorybook.guards.*`
- `common.games.letterStorybook.completion.*`
- `common.parentDashboard.games.letterStorybook.*`

## 2) Narrative text per page/scene + transitions

| Page | Scene | Key | Hebrew line |
|---|---|---|---|
| p00 | cover | `games.letterStorybook.cover.welcome` | ברוכים הבאים לסיפור של האותיות. |
| p00 | cover | `games.letterStorybook.cover.goal` | בואו נאסוף יחד את כל תגי האותיות. |
| p01 | mission | `games.letterStorybook.instructions.intro` | דובי יוצא למסע בשביל האותיות. |
| p01 | mission | `games.letterStorybook.instructions.mission` | בכל עמוד נכיר אות אחת ומילת עוגן אחת. |
| p02 | letter-alef | `games.letterStorybook.letters.alef.story` | דובי פוגש את אריה בשביל האותיות. |
| p03 | letter-bet | `games.letterStorybook.letters.bet.story` | דובי פוגש את בלון בשביל האותיות. |
| p04 | letter-gimel | `games.letterStorybook.letters.gimel.story` | דובי פוגש את גזר בשביל האותיות. |
| p05 | letter-dalet | `games.letterStorybook.letters.dalet.story` | דובי פוגש את דג בשביל האותיות. |
| p06 | letter-he | `games.letterStorybook.letters.he.story` | דובי פוגש את הר בשביל האותיות. |
| p07 | letter-vav | `games.letterStorybook.letters.vav.story` | דובי פוגש את ורד בשביל האותיות. |
| p08 | letter-zayin | `games.letterStorybook.letters.zayin.story` | דובי פוגש את זברה בשביל האותיות. |
| p09 | letter-het | `games.letterStorybook.letters.het.story` | דובי פוגש את חתול בשביל האותיות. |
| p10 | letter-tet | `games.letterStorybook.letters.tet.story` | דובי פוגש את טווס בשביל האותיות. |
| p11 | letter-yod | `games.letterStorybook.letters.yod.story` | דובי פוגש את ילד בשביל האותיות. |
| p12 | letter-kaf | `games.letterStorybook.letters.kaf.story` | דובי פוגש את כובע בשביל האותיות. |
| p13 | letter-lamed | `games.letterStorybook.letters.lamed.story` | דובי פוגש את לימון בשביל האותיות. |
| p14 | letter-mem | `games.letterStorybook.letters.mem.story` | דובי פוגש את מטרייה בשביל האותיות. |
| p15 | letter-nun | `games.letterStorybook.letters.nun.story` | דובי פוגש את נר בשביל האותיות. |
| p16 | letter-samekh | `games.letterStorybook.letters.samekh.story` | דובי פוגש את סוס בשביל האותיות. |
| p17 | letter-ayin | `games.letterStorybook.letters.ayin.story` | דובי פוגש את ענן בשביל האותיות. |
| p18 | letter-pe | `games.letterStorybook.letters.pe.story` | דובי פוגש את פרח בשביל האותיות. |
| p19 | letter-tsadi | `games.letterStorybook.letters.tsadi.story` | דובי פוגש את צב בשביל האותיות. |
| p20 | letter-qof | `games.letterStorybook.letters.qof.story` | דובי פוגש את קוף בשביל האותיות. |
| p21 | letter-resh | `games.letterStorybook.letters.resh.story` | דובי פוגש את רכבת בשביל האותיות. |
| p22 | letter-shin | `games.letterStorybook.letters.shin.story` | דובי פוגש את שמש בשביל האותיות. |
| p23 | letter-tav | `games.letterStorybook.letters.tav.story` | דובי פוגש את תפוח בשביל האותיות. |
| p24 | checkpoint-one | `games.letterStorybook.checkpoints.one.intro` | עמוד בדיקה ראשון הגיע. |
| p24 | checkpoint-one | `games.letterStorybook.checkpoints.one.prompt` | איזו אות שמעתם? בחרו את האות הנכונה. |
| p25 | checkpoint-two | `games.letterStorybook.checkpoints.two.intro` | עמוד בדיקה שני הגיע. |
| p25 | checkpoint-two | `games.letterStorybook.checkpoints.two.prompt` | מקשיבים לצליל ובוחרים את האות המתאימה. |
| p26 | checkpoint-three | `games.letterStorybook.checkpoints.three.intro` | עמוד בדיקה שלישי הגיע. |
| p26 | checkpoint-three | `games.letterStorybook.checkpoints.three.prompt` | נקרא מילה קצרה ונזהה את האות המתאימה. |
| p27 | final-forms | `games.letterStorybook.finalForms.intro` | עכשיו גשר האותיות הסופיות. |
| p27 | final-forms | `games.letterStorybook.finalForms.rule` | אות סופית מופיעה רק בסוף מילה. |
| p27 | final-forms | `games.letterStorybook.finalForms.transferPrompt` | איזו אות סופית שומעים בסוף המילה? |
| p28 | celebration | `games.letterStorybook.completion.title` | סיימתם את הסיפור של האותיות! |
| p28 | celebration | `games.letterStorybook.completion.summary` | הכרתם את כל האותיות ואספתם תגים נוצצים. |
| p28 | celebration | `games.letterStorybook.completion.nextStep` | בפעם הבאה נתרגל זוגות אותיות דומות ונקרא מילים קצרות. |
| — | transition | `games.letterStorybook.transitions.nextLetter` | מצוין, ממשיכים לאות הבאה. |
| — | transition | `games.letterStorybook.transitions.checkpoint` | עכשיו עוצרים לעמוד בדיקה קצר. |
| — | transition | `games.letterStorybook.transitions.finalBridge` | נהדר, עוברים לגשר האותיות הסופיות. |
| — | transition | `games.letterStorybook.transitions.celebration` | יש! אספתם את כל האותיות. |

## 3) Audio script manifest (every user-facing line)

Generated manifest artifact:

- [letter-story-v2-audio-script-manifest.csv](/Users/israelz/Documents/dev/AI/Learning/docs/games/letter-story-v2-audio-script-manifest.csv)

Columns:

- `scene`
- `key`
- `display_text`
- `audio_path`
- `audio_file_exists`

Post-generation snapshot:

- Total lines in scope: 398
- Missing audio path mappings: 0
- Missing physical audio files: 0

## 4) TTS generation path + QA checks

Use this sequence after copy edits:

```bash
yarn generate-audio
yarn audio:validate-manifest
node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('packages/web/public/audio/he/manifest.json','utf8'));const c=JSON.parse(fs.readFileSync('packages/web/src/i18n/locales/he/common.json','utf8'));const walk=(o,p=[],a=[])=>{if(typeof o==='string'){a.push('common.'+[...p].join('.'));return a;}if(!o||typeof o!=='object')return a;for(const [k,v] of Object.entries(o))walk(v,[...p,k],a);return a;};const keys=[...walk(c.games.letterStorybook,['games','letterStorybook']),...walk(c.parentDashboard.games.letterStorybook,['parentDashboard','games','letterStorybook'])];const missing=keys.filter(k=>!m[k]);console.log('storybook keys',keys.length,'missing mappings',missing.length);if(missing.length)console.log(missing.slice(0,20));"
```

QA spot-check recommendations (minimum):

1. Play story flow lines for `letters.alef.story`, `letters.het.story`, `letters.nun.story`, `letters.qof.story`, `letters.tav.story` for continuity.
2. Verify checkpoint pacing on `checkpoints.one|two|three.{intro,prompt}`.
3. Verify bridge + closure voice consistency on `finalForms.intro` and `completion.summary`.
