# Wave 2 Books 4-10 — Hebrew i18n/audio production pack (draft)

## Scope
Draft production-ready Hebrew content pack for Wave 2 handbooks:
- `yoavLetterMap` (Book 4)
- `naamaSyllableBox` (Book 5)
- `oriBreadMarket` (Book 6)
- `tamarWordTower` (Book 7)
- `saharSecretClock` (Book 8)
- `guyClassNewspaper` (Book 9)
- `almaRootFamilies` (Book 10)

Sources:
- `docs/games/handbooks/book-4-yoav-letter-map.md`
- `docs/games/handbooks/book-5-naama-syllable-box.md`
- `docs/games/handbooks/book-6-ori-bread-market.md`
- `docs/games/handbooks/book-7-tamar-word-tower.md`
- `docs/games/handbooks/book-8-sahar-secret-clock.md`
- `docs/games/handbooks/book-9-guy-class-newspaper.md`
- `docs/games/handbooks/book-10-alma-root-families.md`

## Canonical key map per slug
Use this shape for every Wave 2 handbook slug:
- `common.handbooks.<slug>.meta.{title,subtitle,estimatedDuration}`
- `common.handbooks.<slug>.pages.page0X.{narration,cta}`
- `common.handbooks.<slug>.interactions.<id>.{prompt,hint,success,retry}`
- `common.handbooks.<slug>.readingProgression.level{1,2,3}.{title,teacherNote,sampleA,sampleB}`
- `common.handbooks.<slug>.feedback.success.{v1,v2,v3}`
- `common.handbooks.<slug>.feedback.retry.{v1,v2,v3}`
- `common.handbooks.<slug>.feedback.encouragement.{v1,v2,v3}`
- `common.parentDashboard.handbooks.<slug>.{progressSummary,nextStep,readingSignal,confusionFocus}`

## Book 4 — `yoavLetterMap`
### Draft narration seeds
- `intro`: "יואב פותח את מפת האותיות, ובכל תחנה מחכה רמז חדש."
- `transition`: "קוראים לאט, ממשיכים יחד, ומדליקים עוד שביל במפה."
- `outro`: "איזה יופי, יואב סיים את המסע וזכר את מילות המפתח."

### Interaction voice seeds
| Interaction ID | prompt | hint | success | retry |
|---|---|---|---|---|
| `pickFirstSoundLetter` | "איזו אות מתאימה לצליל הראשון?" | "נקשיב שוב לצליל הפותח ונחפש את האות שלו." | "מעולה! בחרתם את האות הנכונה." | "לא נורא, נקשיב שוב וננסה יחד." |
| `matchPointedSyllable` | "איזו הברה מנוקדת קראנו?" | "נקרא לאט: צליל אחרי צליל." | "יופי! זיהיתם נכון את ההברה." | "כמעט, נקרא שוב לאט ונבחר." |
| `orderSyllableTiles` | "נסדר את ההברות לפי הסדר הנכון." | "נתחיל מההברה הראשונה ששמענו." | "כל הכבוד! בניתם את המילה נכון." | "כמעט, נסדר שוב יחד." |
| `readPhraseGate` | "נקרא את המשפט הקצר כדי לפתוח את השער." | "נצביע על כל מילה ונקרא מימין לשמאל." | "נהדר! הקריאה פתחה את השער." | "לא נורא, נקרא שוב את המשפט." |
| `sequenceFromText` | "מה קרה קודם לפי הטקסט?" | "נחפש מילת זמן בתוך המשפט." | "מצוין! עניתם לפי מה שקראתם." | "כמעט, נחזור לטקסט וננסה שוב." |

## Book 5 — `naamaSyllableBox`
### Draft narration seeds
- `intro`: "נעמה מצאה קופסת הברות קסומה, וכל מנעול נפתח בקריאה נכונה."
- `transition`: "מקשיבים, מפרקים לצלילים, ואז בוחרים בביטחון."
- `outro`: "נעמה פתחה את הקופסה וזכרה מילים חדשות מעולות."

### Interaction voice seeds
| Interaction ID | prompt | hint | success | retry |
|---|---|---|---|---|
| `buildCV` | "נבנה הברה מהצלילים ששמענו." | "נאמר את הצליל הראשון, ואז את השני." | "מעולה! בניתם הברה מדויקת." | "כמעט, נבנה שוב לאט יחד." |
| `pickDecodedWord` | "איזו מילה מנוקדת קראנו?" | "נקרא את המילה בקצב איטי." | "יופי! בחרתם את המילה הנכונה." | "לא נורא, נקרא שוב ונבחר." |
| `fixSyllableOrder` | "נסדר את חלקי המילה לפי הסדר." | "נבדוק מה בא בתחילת המילה." | "כל הכבוד! סידרתם נכון את ההברות." | "כמעט, נסדר שוב שלב אחרי שלב." |
| `readShortPhrase` | "נקרא צירוף קצר ונמשיך." | "נצביע על כל מילה ונקרא יחד." | "נהדר! קראתם את הצירוף נכון." | "לא נורא, נקרא שוב לאט." |
| `literalQuestion` | "מה כתוב בטקסט שקראנו?" | "נחפש את התשובה בתוך המשפט." | "מצוין! עניתם מתוך הקריאה." | "כמעט, נחזור למשפט וננסה שוב." |

## Book 6 — `oriBreadMarket`
### Draft narration seeds
- `intro`: "אורי מגיע לשוק הלחם עם רשימת משלוחים ומילים חדשות."
- `transition`: "קוראים, סופרים, ובודקים את האות האחרונה במילה."
- `outro`: "איזה יופי, אורי סיים את כל המשלוחים בהצלחה."

### Interaction voice seeds
| Interaction ID | prompt | hint | success | retry |
|---|---|---|---|---|
| `readSignWord` | "איזו מילה כתובה על השלט?" | "נקרא את המילה לאט מהתחלה לסוף." | "מעולה! קראתם נכון את השלט." | "כמעט, נקרא שוב ונבחר." |
| `spotFinalForm` | "איזו אות סופית מופיעה בסוף המילה?" | "נסתכל על האות האחרונה במילה." | "כל הכבוד! זיהיתם נכון אות סופית." | "לא נורא, נבדוק שוב את סוף המילה." |
| `textLinkedCount` | "כמה כיכרות כתובות במשפט?" | "נקרא את המשפט ואז נספור." | "יופי! התאמתם מספר לטקסט." | "כמעט, נקרא שוב ונספור יחד." |
| `sortWordToStall` | "לאיזה דוכן מתאימה המילה?" | "נקרא קודם את המילה, ואז נבחר דוכן." | "נהדר! מיינתם למקום הנכון." | "לא נורא, נקרא שוב ונמיין." |
| `sequenceByPhrase` | "מה עושים קודם לפי המשפט?" | "נחפש מילת זמן שמסדרת את הפעולות." | "מצוין! עניתם לפי הסדר בטקסט." | "כמעט, נחזור למשפט וננסה שוב." |

## Book 7 — `tamarWordTower`
### Draft narration seeds
- `intro`: "תמר מטפסת במגדל המילים, וכל קומה נפתחת בקריאה מדויקת."
- `transition`: "קוראים משפט, מוצאים ראיה, ועולים עוד קומה."
- `outro`: "תמר הגיעה לראש המגדל עם קריאה בטוחה וברורה."

### Interaction voice seeds
| Interaction ID | prompt | hint | success | retry |
|---|---|---|---|---|
| `decodePhraseA` | "נקרא את הצירוף ונבחר תשובה." | "נפרק את הצירוף למילים קצרות." | "מעולה! קראתם נכון את הצירוף." | "כמעט, נקרא שוב לאט." |
| `orderEvents` | "מה קרה קודם ומה אחר כך?" | "נחפש מילת זמן במשפט." | "כל הכבוד! סידרתם נכון את האירועים." | "לא נורא, נקרא שוב וננסה." |
| `connectorMeaning` | "איזו תשובה מתאימה למילת הקישור?" | "נבדוק מה אומרת מילת הקישור במשפט." | "יופי! הבנתם נכון את הקשר במשפט." | "כמעט, נבדוק שוב את מילת הקישור." |
| `buildPhrase` | "נסדר את המילים למשפט נכון." | "נתחיל מהמילה הראשונה מימין." | "נהדר! בניתם משפט נכון." | "כמעט, נסדר שוב יחד." |
| `tapEvidence` | "איזה חלק בטקסט מוכיח את התשובה?" | "נחפש את המילים שנותנות הוכחה." | "מצוין! מצאתם ראיה מתוך הטקסט." | "לא נורא, נחפש שוב בתוך המשפט." |

## Book 8 — `saharSecretClock`
### Draft narration seeds
- `intro`: "סהר גילה שעון סודי, וכל רמז נפתח בקריאה מדויקת."
- `transition`: "קוראים את מילות הזמן ומבינים מה קרה ומתי."
- `outro`: "סהר פתר את חידת השעון וזכר את כל רמזי הזמן."

### Interaction voice seeds
| Interaction ID | prompt | hint | success | retry |
|---|---|---|---|---|
| `decodeClue` | "נקרא את רמז הזמן המנוקד." | "נקרא מילה מילה בקצב איטי." | "מעולה! פיענחתם נכון את הרמז." | "כמעט, נקרא שוב יחד." |
| `matchTimeMarker` | "איזו מילת זמן מתאימה למשפט?" | "נחפש מילים כמו לפני או אחר כך." | "יופי! בחרתם נכון את סימן הזמן." | "לא נורא, נקשיב וננסה שוב." |
| `mixedPointingRead` | "נקרא את המשפט גם עם מילים חצי מנוקדות." | "נתחיל מהמילים המנוקדות ואז נמשיך." | "נהדר! קראתם נכון גם משפט מתקדם." | "כמעט, נקרא שוב בקצב רגוע." |
| `causeEffectChoice` | "מה הסיבה ומה התוצאה לפי הטקסט?" | "נחפש מילים שמחברות בין שני חלקי המשפט." | "מצוין! הבנתם נכון את הקשר." | "כמעט, נחזור לטקסט ונבדוק שוב." |
| `tapEvidence` | "איזו מילה בטקסט נותנת את ההוכחה?" | "נסמן קודם את מילת הזמן המרכזית." | "כל הכבוד! מצאתם את הראיה הנכונה." | "לא נורא, נחפש שוב את הראיה." |

## Book 9 — `guyClassNewspaper`
### Draft narration seeds
- `intro`: "גיא מכין עיתון כיתה, וכל כתבה צריכה קריאה מדויקת."
- `transition`: "קוראים פסקה, בודקים עובדה, ובוחרים כותרת מתאימה."
- `outro`: "העיתון של גיא מוכן, ואתם קראתם כמו כתבים אמיתיים."

### Interaction voice seeds
| Interaction ID | prompt | hint | success | retry |
|---|---|---|---|---|
| `headlineMatch` | "איזו כותרת מתאימה לטקסט?" | "נחפש את המילה המרכזית בפסקה." | "מעולה! התאמתם כותרת נכונה." | "כמעט, נקרא שוב ונבדוק." |
| `findFact` | "איזה משפט מציג את העובדה המרכזית?" | "נאתר את המשפט שאומר מה קרה באמת." | "יופי! מצאתם את העובדה הנכונה." | "לא נורא, נקרא שוב לאט." |
| `orderSections` | "נסדר את חלקי הכתבה לפי הסדר." | "נבדוק מה מתאים להתחלה ומה לסוף." | "נהדר! סידרתם נכון את הכתבה." | "כמעט, נסדר שוב יחד." |
| `anchoredInference` | "מה התשובה הכי מתאימה לפי הרמז בטקסט?" | "נחפש קודם את המשפט שנותן רמז." | "מצוין! בחרתם תשובה שמבוססת על הטקסט." | "כמעט, נחזור לרמז וננסה שוב." |
| `tapEvidence` | "איזו ראיה בטקסט מוכיחה את התשובה?" | "נבחר את המילים שמסבירות למה." | "כל הכבוד! סימנתם ראיה מדויקת." | "לא נורא, נחפש ראיה נוספת בטקסט." |

## Book 10 — `almaRootFamilies`
### Draft narration seeds
- `intro`: "עלמה פותחת מעבדת מילים, ומחפשת משפחות שורש."
- `transition`: "קוראים מילים, מזהים אותיות חוזרות, ובוחרים משמעות מתאימה."
- `outro`: "עלמה סיימה את המעבדה, ואתם זיהיתם משפחות שורש נהדר."

### Interaction voice seeds
| Interaction ID | prompt | hint | success | retry |
|---|---|---|---|---|
| `spotRootPattern` | "איזה שורש חוזר במילים?" | "נחפש שלוש אותיות שחוזרות שוב." | "מעולה! זיהיתם נכון את השורש." | "כמעט, נבדוק שוב אילו אותיות חוזרות." |
| `sortByRoot` | "לאיזו משפחת שורש שייכת כל מילה?" | "נקרא את המילה ונבדוק את האותיות המרכזיות." | "יופי! מיינתם נכון לפי משפחות שורש." | "לא נורא, נמיין שוב יחד." |
| `contextFamilyChoice` | "איזו מילה מתאימה למשפט?" | "נחפש מילה מאותה משפחה שמתאימה למשמעות." | "נהדר! בחרתם מילה שמתאימה למשפט." | "כמעט, נקרא שוב את המשפט." |
| `transferWord` | "איזו מילה חדשה שייכת לאותה משפחה?" | "נשווה את האותיות החוזרות למילים שכבר הכרנו." | "מצוין! עשיתם העברה נכונה למילה חדשה." | "כמעט, ננסה שוב עם רמז קטן." |
| `finalFamilyDecision` | "איזו משפחה מתאימה כאן בסיום?" | "נבדוק גם שורש וגם משמעות במשפט." | "כל הכבוד! בחרתם נכון במשימת הסיום." | "לא נורא, נבדוק שוב לאט יחד." |

## Audio override notes (draft)
Use `packages/web/src/i18n/locales/he/audio-overrides.json` for lines where spoken clarity differs from display text.

Recommended override candidates:
- `common.parentDashboard.handbooks.<slug>.progressSummary`
- `common.parentDashboard.handbooks.<slug>.nextStep`
- `common.parentDashboard.handbooks.<slug>.readingSignal`
- `common.parentDashboard.handbooks.<slug>.confusionFocus`

Additional high-risk pronunciation keys by book:
- `yoavLetterMap`: confusable pairs and pointed CV examples in `readingProgression.level*.sample*`
- `naamaSyllableBox`: segmented blend prompts (`buildCV`, `fixSyllableOrder`)
- `oriBreadMarket`: final-form emphasis prompts (`spotFinalForm`, `finalFormContrast`)
- `tamarWordTower`: connector-heavy prompts (`connectorMeaning`, `sequencePrecision`)
- `saharSecretClock`: temporal markers (`לפני`, `אחר כך`) in `matchTimeMarker`/`dualTimePrompt`
- `guyClassNewspaper`: evidence and inference wording (`anchoredInference`, `tapEvidence`)
- `almaRootFamilies`: root-letter articulation in `spotRootPattern`, `sortByRoot`, `transferWord`

## TTS pacing directives (draft labels)
Use these labels in implementation notes to keep clips consistent across books.

- `slow_decode`: read pointed words at ~0.85x pace.
- `step_pause`: add ~400-500ms pause between instruction steps.
- `text_first_focus`: stress text token before any object/image mention.
- `connector_pause`: short pause before/after connector words (`ואז`, `כי`, `לפני`, `אחר כך`).
- `final_form_stress`: slight emphasis on terminal consonant for final-form letters.
- `root_triplet_stress`: equal stress on three root letters when modeling morphology.
- `gentle_retry`: warm tone, no failure framing.
- `celebration_short`: short praise burst, then immediate return to story flow.

## FED handoff checklist
Before runtime hookup, verify per slug:
- i18n keys exist for all required families above.
- Manifest entries exist for all shipped keys.
- Replay controls reference the exact same prompt clip per interaction.
- Parent dashboard placeholders are covered by spoken overrides where needed.
- Level 1-3 progression lines follow sentence-length and pointing locks from Reading PM validation sections.
