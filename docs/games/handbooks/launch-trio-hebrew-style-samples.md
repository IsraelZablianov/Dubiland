# Handbook Launch Trio — Hebrew Narration Style Samples + Phrase Banks

## Scope
Draft content starter pack for first-production trio (one handbook per age band).

This is a content draft so PM can lock final titles after [DUB-378](/DUB/issues/DUB-378) and [DUB-379](/DUB/issues/DUB-379) complete their matrix decisions.

## Draft Trio (One Per Age Band)

| Age band | Draft handbook title | Draft slug | Main character | Core learning mix |
|---|---|---|---|---|
| 3-4 | נטע והבלון הקופץ | `bouncy-balloon` | נטע (חוקרת קטנה) | counting 1-5, colors, simple shape words |
| 5-6 | רועי הקוסם ומפת האותיות | `magic-letter-map` | רועי (קוסם צעיר) | first-sound matching, simple addition, short pointed words |
| 6-7 | מאיה האסטרונאוטית והמסר מהכוכב | `star-message` | מאיה (אסטרונאוטית) | phrase decoding, literal comprehension, story-based word problems |

## Sample Narration Style Per Book

### Ages 3-4 — נטע והבלון הקופץ
- Intro sample: `שלום חברים, נטע מצאה בלון צבעוני שקופץ בין העצים.`
- Prompt sample: `בואו נספור יחד כמה קפיצות הוא עשה.`
- Celebration sample: `איזה יופי! עזרתם לנטע מצוין.`

### Ages 5-6 — רועי הקוסם ומפת האותיות
- Intro sample: `רועי פתח מפה קסומה, ורק אות נכונה תדליק את השביל.`
- Prompt sample: `הקשיבו לצליל הראשון ובחרו את האות המתאימה.`
- Celebration sample: `כל הכבוד! הקסם עבד בזכותכם.`

### Ages 6-7 — מאיה האסטרונאוטית והמסר מהכוכב
- Intro sample: `מאיה קיבלה הודעה מהכוכב הירוק, וצריך לקרוא אותה נכון.`
- Prompt sample: `קראו את המשפט, ואז בחרו את התשובה מתוך מה שקראתם.`
- Celebration sample: `מעולה! קראתם במדויק ופתרתם את המשימה.`

## Phrase Banks (Reusable by Function)

### Instruction Bank
- `עכשיו נקשיב ונפעל יחד.`
- `נסו צעד אחד בכל פעם.`
- `חפשו את התשובה בתוך הטקסט.`
- `בואו נספור לאט ביחד.`
- `בחרו, ואז נמשיך בסיפור.`

### Hint Bank
- `רמז קטן: התחילו מהצליל הראשון.`
- `רמז קטן: הסתכלו שוב על המספרים.`
- `רמז קטן: קראו את המילה לאט.`
- `רמז קטן: השוו בין שתי האפשרויות.`
- `רמז קטן: מצאו את המילה המנוקדת.`

### Success Bank
- `יופי! הצלחתם במשימה.`
- `כל הכבוד, זה היה מדויק.`
- `מעולה, ממשיכים לעמוד הבא.`
- `איזה יופי, פתרתם נכון.`
- `אלופים, עזרתם לדמות להתקדם.`

### Gentle Retry Bank
- `כמעט, ננסה שוב יחד.`
- `לא נורא, בואו נבדוק עוד פעם.`
- `עוד ניסיון קטן ונצליח.`
- `אפשר שוב, צעד צעד.`
- `אני איתכם, ננסה שוב.`

### Transition Bank
- `מוכנים לעמוד הבא?`
- `מצוין, ממשיכים במסע.`
- `עוד משימה קטנה ואנחנו שם.`

## i18n Starter Keys (Per Draft Slug)
Use this exact family shape when each draft becomes a full spec.

### `common.handbooks.bouncyBalloon.*`
- `meta.{title,subtitle,estimatedDuration}`
- `pages.page01-08.{narration,cta}`
- `interactions.{countJumps,matchColor,findShape,chooseNumber}.{prompt,hint,success,retry}`
- `feedback.{success,encouragement,retry}.*`
- `transitions.*`
- `completion.*`

### `common.handbooks.magicLetterMap.*`
- `meta.{title,subtitle,estimatedDuration}`
- `pages.page01-10.{narration,cta}`
- `interactions.{firstSound,chooseLetter,simpleAdd,decodePointedWord,sortObjects}.{prompt,hint,success,retry}`
- `readingProgression.level{1,2}.*`
- `feedback.{success,encouragement,retry}.*`
- `transitions.*`
- `completion.*`

### `common.handbooks.starMessage.*`
- `meta.{title,subtitle,estimatedDuration}`
- `pages.page01-12.{narration,cta}`
- `interactions.{decodePointedPhrase,decodeBridgePhrase,literalComprehension,sequenceEvents,solveWordProblem}.{prompt,hint,success,retry}`
- `readingProgression.level{2,3}.*`
- `feedback.{success,encouragement,retry}.*`
- `transitions.*`
- `completion.*`

Parent dashboard companion families for each:
- `common.parentDashboard.handbooks.bouncyBalloon.*`
- `common.parentDashboard.handbooks.magicLetterMap.*`
- `common.parentDashboard.handbooks.starMessage.*`

## Audio Planning Notes
- Every listed key family above must produce a manifest entry and `.mp3` output before implementation handoff.
- Add entries in `audio-overrides.json` for placeholder-heavy parent lines (for example `progressSummary` and confusion highlights).
- Keep narration clips short and clear for young listeners:
  - Ages 3-4: 4-8 words per instruction line when possible.
  - Ages 5-6: 6-10 words per instruction line.
  - Ages 6-7: 8-14 words per instruction line, but still one action per sentence.

## TTS Direction Notes (for generation runbooks)
- `instruction`: use `step_pause` pacing.
- `new_word_intro`: use `slow_word_intro` pacing.
- `praise`: use `celebration_pitch` with brief duration.
- `counting`: use `counting_cadence` (short pauses between numbers).
