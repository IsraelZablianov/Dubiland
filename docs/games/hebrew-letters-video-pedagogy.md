# Hebrew Letters Video Pedagogy (Hebrew: פדגוגיית סרטוני אותיות)

## Learning Objective
- Curriculum area: Letters (אותיות) with bridge to early reading (קריאה).
- Core skill: Build reliable Hebrew letter-sound mapping through short audio-first video loops.
- Measurable outcome:
  - Ages 3-4: child recognizes and names/hears 8 core letters with support.
  - Ages 4-5: child recognizes at least 15 letters and can match spoken sound to letter in simple checks.
  - Ages 5-7: child handles full alphabet exposure, common confusion pairs, and final forms in word context.

## Scope and Delivery Target
- This brief defines the sequence and constraints for the new letters video category under [DUB-115](/DUB/issues/DUB-115).
- Deliverable is designed to be directly actionable for:
  - Content Writer scripting/audio lane [DUB-119](/DUB/issues/DUB-119)
  - Media Expert Remotion lane [DUB-120](/DUB/issues/DUB-120)

## Non-Negotiable Design Rules (Ages 3-7)
- One new variable per video (new letter OR new pair OR final-form concept, never stacked).
- Audio-first instruction on every step (kids can succeed without reading).
- One focal visual at a time; avoid split-attention layouts.
- Self-correcting moments only: reveal model answer, then immediate gentle retry.
- Micro-feedback every attempt; no punitive sounds, timers, or failure states.
- Short loops: 2-5 minute videos, with a clear midpoint pause beat.

## Per-Video Cognitive Load Limits

| Age band | Video length | New content cap | Choice set cap | Retrieval prompts per video |
|---|---:|---|---:|---:|
| 3-4 | 90-150 sec | 1 new letter | 2 options | 2 |
| 4-5 | 120-180 sec | 1 new + 1 review letter | 3 options | 3 |
| 5-6 | 150-210 sec | 1 new concept (pair/final form) | 3-4 options | 3 |
| 6-7 | 180-240 sec | 1 new decoding concept + known letters | 4 options | 3-4 |

### Internal segment pacing (default template)
1. Hook + goal (10-15s)
2. New letter model (20-30s)
3. Guided practice (30-45s)
4. Delayed retrieval check (20-30s)
5. Celebration + recap + preview (15-25s)

## Progression Strategy and Letter Grouping

### Stage 0 — Audio-phonological warm-up (Ages 3-4, 2-4 videos)
- Goal: listening readiness and turn-taking with דובי.
- No explicit alphabet load yet; use environmental sounds and rhyming play.
- Exit criterion: child responds to call-and-repeat pattern in 2 consecutive videos.

### Stage 1 — High-distinction core letters (Ages 3-4, 8-10 videos)
- Introduce one letter per video in this order:
  - מ, נ, ל, ס, פ, ר, ב, ג
- Rationale:
  - high frequency in child vocabulary
  - clearer early phoneme contrast
  - visually distinct enough for first exposures
- Reinforcement: each new letter appears again in the next 2 videos.

### Stage 2 — Core expansion without heavy confusables (Ages 4-5, 8-10 videos)
- Suggested order:
  - ד, ז, ש, ק, ח, צ, ט, ת
- Constraint: do not introduce same-sound alternatives in the same video block.
- Retrieval design: one immediate check + one delayed check near video end.

### Stage 3 — Confusion-pair focus (Ages 5-6, 8-12 videos)
- Dedicated pair blocks (one pair family at a time):
  - ט/ת
  - ק/כ
  - א/ע
  - ס/שׂ (only when dot marking is visually explicit)
- Required 3-step remediation loop per pair:
  1. isolated A/B contrast
  2. anchor-word contrast
  3. transfer check with neutral distractor

### Stage 4 — Final forms in meaningful context (Ages 5-7, 5-7 videos)
- Final forms only as word-ending concept, never isolated symbol drill:
  - ך, ם, ן, ף, ץ
- Each video introduces one final form against its base letter inside a familiar word.
- Gate: child must pass 2 contextual checks before introducing the next final form.

### Stage 5 — Letter-to-reading bridge (Ages 6-7, 8-12 videos)
- Introduce simple CV/CVC decoding with nikud support.
- Start with transparent short-vowel patterns and highly decodable words.
- Do not combine new nikud pattern and new confusion pair in one episode.

## Recommended Example-Word Policy

### Word selection criteria
- Concrete and imageable (household objects, body parts, animals, foods).
- Child-familiar spoken vocabulary before school-language vocabulary.
- Short phonological structure first (CV -> CVC -> longer forms).
- Initial sound must be unambiguous in Modern Hebrew child speech.
- Avoid proper nouns, abstract terms, and low-frequency adult words.

### Avoid in early stages
- Words where letter identity depends on advanced orthographic rules.
- Homograph-heavy items requiring mature context disambiguation.
- Pairs where both the target letter and word are novel in the same video.

### Starter word bank (examples)
| Letter | Strong early examples | Notes |
|---|---|---|
| מ | מים, מיטה | high familiarity, clear /m/ onset |
| נ | נר, נעל | concrete and visual |
| ל | לב, לימון | short and imageable |
| ס | סיר, ספר | common household vocabulary |
| פ | פרח, פה | clear /p/ onset |
| ר | רגל, רכב | known nouns in child context |
| ב | בית, בובה | frequent, easy visuals |
| ג | גן, גזר | high school-readiness relevance |
| ד | דג, דלת | simple visuals |
| ש | שמש, שוקו | salient audio cue |

## Reinforcement Mechanics

### In-video repetition cadence
- Use a fixed loop: `Hear -> See -> Say -> Choose`.
- Minimum 3 exposures per target letter in each video:
  - modeled exposure
  - guided repetition
  - delayed retrieval after 30-60 seconds

### Cross-video spacing
- Playlist mix target:
  - 60% known letters (confidence)
  - 30% recently introduced letters (retention)
  - 10% new content (progress)
- Every third video is recap-heavy and introduces no new letter.

### Celebration and motivation
- Micro-celebration on every correct attempt (300-900ms animation + short praise cue).
- Meso-celebration after 3 successful prompts (sticker/star burst).
- Keep celebration short and predictable; never interrupt next prompt flow longer than ~1.5s.

## Handoff Guidance — Content Writer

### Script format per video
1. `opening`: one-sentence mission from דובי.
2. `model`: target letter name/sound + 1 anchor word.
3. `practiceA`: guided repeat line.
4. `practiceB`: retrieval question with 2-4 options by age band.
5. `recap`: target letter + anchor word replay.
6. `closing`: encouragement and next-video preview.

### Script constraints
- 1 short sentence at a time (target 4-8 words per line).
- Every line must map to an i18n key and audio file.
- Include alternate "slow replay" lines for difficult sounds/pairs.
- For confusion-pair videos, include dedicated A/B contrast lines and transfer-check lines.

### Required key families (video lane)
- `videos.letters.common.*`
- `videos.letters.<letter>.title`
- `videos.letters.<letter>.model.*`
- `videos.letters.<letter>.practice.*`
- `videos.letters.<letter>.recap.*`
- `videos.letters.pairs.<pairKey>.*`
- `videos.letters.finalForms.<finalKey>.*`
- `feedback.encouragement.*`

## Handoff Guidance — Media Expert (Remotion)

### Visual composition rules
- One focal object at a time (letter or picture, not both competing equally).
- Letter glyph occupies ~30-45% of frame during model moments.
- Maintain RTL visual flow for prompts and pointer movement.
- Keep motion readable: 400-800ms transitions, no rapid camera moves.

### Interaction beats
- Add explicit "child response pause" windows (1.5-3s) after each prompt.
- During retries, show correct model first, then replay the same prompt.
- For final-form videos, animate word-ending position to make placement meaning clear.

### Audio-visual sync requirements
- Pronunciation onset must align with first visible glyph emphasis frame.
- Do not layer narration over competing SFX during target-letter moments.
- If background music is used, duck to low level under all instruction lines.

## Review Status
- Pedagogy brief completed by Gaming Expert on 2026-04-10 for task [DUB-118](/DUB/issues/DUB-118).
- Ready for PM review and direct execution by Content Writer and Media Expert lanes.
