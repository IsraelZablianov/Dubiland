# Handbook Market Analysis (Hebrew: ניתוח שוק לספרונים אינטראקטיביים)

## Scope
This document supports [DUB-378](/DUB/issues/DUB-378) under parent initiative [DUB-377](/DUB/issues/DUB-377).

Goals:
- Benchmark top story/reading platforms relevant to ages 3-7.
- Define age-band attention and interaction-density recommendations for Dubiland interactive handbooks.
- Propose a 10-book age-group matrix (minimum 3 books per age group).
- Select top 3 launch candidates (one per age group) for immediate production.

Coordination references used in this draft:
- `docs/games/interactive-handbooks-pillar.md`
- `docs/games/interactive-handbooks-mechanics.md`
- `docs/games/handbook-literacy-interaction-framework.md`
- `docs/games/decodable-micro-stories.md`

## Benchmark Review

| Platform | What works well for 3-7 | Gaps / risks for Dubiland | Product takeaways for Dubiland handbooks |
|---|---|---|---|
| Epic! | Large library breadth, clear age buckets, parent-perceived value from volume. | Discovery can overwhelm younger children; heavy catalog model favors browsing over focused pedagogy. | Use curated shelves (3-5 visible choices), not an open mega-library. Keep handbook selection intentionally limited by age band. |
| Vooks | Story video pacing with read-aloud narration keeps pre-readers engaged; strong passive watchability. | Passive viewing can reduce active learning moments if interaction is sparse. | Keep animation cinematic, but enforce interaction pause gates every 20-45 seconds on key pages. |
| FarFaria | Daily recommendation framing and themed worlds support routine and replay. | Fixed daily flow can feel repetitive if personalization is weak. | Offer "today's handbook path" with 1 core + 1 optional replay, tuned by mastery/hint usage. |
| Storypark | Strong parent/educator visibility and learning-story documentation. | Not a child-first game UI; limited direct child interactivity model. | Adopt Storypark-style parent reflection cards: what skill was practiced, what support was needed, suggested co-play follow-up. |
| HOMER | Structured reading pathway, explicit skill progression, strong early literacy scaffolding. | Can feel curriculum-heavy if not balanced with playful narrative payoff. | Preserve explicit literacy ladder inside story play; hide pedagogy behind character-led quests and micro-rewards. |
| Khan Academy Kids (stories) | Character-led guidance, gentle feedback, integrated literacy tasks in playful context. | Can sprawl into broad content paths without tight cultural localization. | Keep דובי as constant guide; maintain short instruction loops and positive correction style while localizing Hebrew-native contexts. |

### Competitive Synthesis for Dubiland
1. The highest-performing pattern is "story first, task inside story," not worksheet overlays.
2. Pre-reader engagement depends on short narration chunks and immediate action opportunities.
3. Parent trust increases when progress is explained in learning language (skills), not only completion percentages.
4. Catalog size is less important than age-fit curation for 3-7.

## Age-Band Attention Span and Interaction Density Recommendations

| Age band | Target handbook duration | Narration chunk before interaction | Interaction density per 10-12 pages | Max active choices | Hint timing | Stopping-point design |
|---|---|---|---|---|---|---|
| 3-4 | 5-7 minutes | 12-18 seconds | 3-4 mandatory + 1 optional | 2 | Auto hint after 4 seconds idle or 1 miss | Midpoint break after page 4-5 with clear "continue later" |
| 5-6 | 7-10 minutes | 18-25 seconds | 4-5 mandatory + 1 optional | 3 | Auto hint after 6 seconds idle or 1-2 misses | Midpoint break after page 5-6; replay or continue choice |
| 6-7 | 9-12 minutes | 20-35 seconds | 5-6 mandatory + 1-2 optional | 3-4 | Auto hint after 8 seconds idle or 2 misses | Midpoint break after page 6; optional challenge branch |

### Interaction Mix by Age Band
- Ages 3-4:
  - 60% tap/select, 30% simple drag, 10% guided count-aloud.
- Ages 5-6:
  - 45% tap/select, 30% drag/sort, 25% two-step puzzle.
- Ages 6-7:
  - 35% tap/select, 30% drag/sort, 35% decode-and-reason prompts.

### Guardrails (All Ages)
- No more than one new cognitive demand on a page.
- No separate check/test buttons; validation occurs immediately on action.
- Every instruction has adjacent replay (`▶`) and icon-first control set (`▶`/`↻`/`💡`/`→`).
- Retry loops never punish; they only scaffold.

## Success Patterns from Strong Hebrew Children's Books

The strongest Hebrew early-childhood books (classic and contemporary) repeatedly use these patterns:

1. Rhythmic repetition with slight variation.
- Product translation: repeat one anchor sentence structure across pages while changing one key word or number.

2. Familiar daily-life settings (home, kindergarten, playground, market, neighborhood walk).
- Product translation: use Israeli child-recognizable environments as story anchors, then embed learning tasks in those scenes.

3. Concrete vocabulary before abstract language.
- Product translation: prioritize nouns/verbs children can point to and act on before inference-heavy text.

4. Emotional safety and predictable resolution.
- Product translation: no loss/failure endings; each handbook ends in social warmth, celebration, and recap.

5. Character-led perspective with gentle humor.
- Product translation: דובי drives narration, models mistakes, and celebrates effort instead of correctness only.

6. Question moments that invite participation.
- Product translation: page-level interaction prompts should feel like story questions, not quizzes.

7. Sound-play and phonological echo.
- Product translation: include alliteration/rhyme-friendly lines in age 3-6 stories, with audio replay and first-sound interactions.

8. Cultural groundedness.
- Product translation: include Hebrew-native references (holidays, foods, neighborhood life, weather patterns) without relying on translation artifacts.

## 10-Book Age-Group Matrix

| # | Working title (Hebrew) | Age band | Core learning objective | Interaction profile | Literacy target |
|---|---|---|---|---|---|
| 1 | דובי וגן ההפתעות | 3-4 | Counting 1-5 + color/shape vocabulary | Tap-count, choose-color, simple drag | Listening comprehension + first letter awareness |
| 2 | יום הולדת בגן של דובי | 3-4 | Quantity comparison (more/less) in party setup | Tap-select with 2 choices | Core story vocabulary repetition |
| 3 | הטיול הקטן לשוק | 3-4 | Category sorting (fruits/colors) | Drag to matching baskets | Oral vocabulary expansion |
| 4 | משימת האותיות בפארק | 5-6 | Letter-sound mapping in narrative clues | Tap letter choices + guided hinting | Pointed word recognition (Level 1-2) |
| 5 | רכבת המספרים לירושלים | 5-6 | Add/subtract within 10 in story events | Select answer chips, short two-step tasks | Sentence-level instruction following |
| 6 | דובי וחבורת הסיפורים | 5-6 | Sequence and retell (beginning-middle-end) | Reorder 3 scene cards | Short pointed phrase decoding |
| 7 | בלשי המילים בעיר העתיקה | 6-7 | Decode short clues and pick evidence | Decode-first prompt then select | Partial nikud bridge + literal comprehension |
| 8 | מעבדת השורשים של דובי | 6-7 | Root-family awareness in playful context | Drag word parts, choose correct family | Morphology-light transfer in pointed phrases |
| 9 | משימת החדשות של השכונה | 6-7 | Read short informational cards and extract fact | Text-first multiple choice (3-4 options) | Sentence decoding + comprehension checks |
| 10 | מסיבת החגים של דובי | 6-7 | Multi-step reasoning with culture-linked content | Mixed interactions (tap/drag/decode) | Fluency bridge with controlled nikud fade |

Coverage check:
- Ages 3-4: books 1-3 (3 books)
- Ages 5-6: books 4-6 (3 books)
- Ages 6-7: books 7-10 (4 books)

## Top 3 Launch Candidates (Immediate Production)

### 1) Ages 3-4: דובי וגן ההפתעות
Why first:
- Already aligned with the current handbook pillar blueprint and age-appropriate interaction density.
- Strong multi-domain coverage (numbers + colors + first letters) with low cognitive friction.
- Fastest path to validate pre-literate handbook loop and parent trust signals.

Launch success criteria:
- >=80% completion to final page in first session.
- <=1.2 average hints per mandatory interaction.
- Parent dashboard opens after session >=40% of the time (trust/interest proxy).

### 2) Ages 5-6: משימת האותיות בפארק
Why first:
- Best midpoint bridge between playful story flow and explicit literacy progression.
- Directly tests letter-sound checkpoint quality before scaling to heavier decoding books.
- Reuses mechanics from existing letter game ecosystem while embedding them in narrative context.

Launch success criteria:
- >=75% first-try accuracy on letter-sound checkpoints.
- >=70% of sessions complete with no frustration loop trigger.
- At least one replay within 7 days for >=35% of active children.

### 3) Ages 6-7: בלשי המילים בעיר העתיקה
Why first:
- High leverage for older cohort retention by introducing decode-first story mystery mechanics.
- Aligns with decodable-story readiness and literal comprehension goals.
- Strong cultural-context opportunity with place-based Hebrew clues.

Launch success criteria:
- >=70% decode-first checkpoint accuracy without stage-3 hint.
- >=75% literal comprehension accuracy by book end.
- >=30% of users attempt optional challenge branch.

## Dependencies and Coordination Notes
- Reading progression and nikud complexity for launch books must stay aligned with [DUB-379](/DUB/issues/DUB-379).
- Interaction cadence, retry policy, and simplification ordering must stay aligned with [DUB-380](/DUB/issues/DUB-380).
- Hebrew script/audio package sequencing should remain compatible with Content Writer lane [DUB-382](/DUB/issues/DUB-382).
- FED/QA execution planning for launch pack should route through Architect lane [DUB-384](/DUB/issues/DUB-384).

## Recommendation Snapshot
- Ship a 3-book launch wave (one per age band) instead of a full 10-book drop.
- Keep each handbook within age-tuned interaction density from this matrix.
- Use the remaining 7 books as staggered releases after first-wave telemetry validates pacing and hint cadence.
