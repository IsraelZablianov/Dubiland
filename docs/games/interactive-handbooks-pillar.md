# Interactive Handbooks Pillar (Hebrew: ספרונים אינטראקטיביים)

## Learning Objective
- Curriculum area: Cross-curriculum literacy + numeracy + world knowledge through story context.
- Core skills:
  - Listening comprehension in Hebrew (follow narrated story sequence and answer contextual prompts).
  - Early decoding readiness (letter/sound recognition and first-word assembly inside narrative moments).
  - Embedded math reasoning (counting, compare, and simple operations inside story events).
  - Self-regulation (pause/listen/act/continue loop without frustration spikes).
- Measurable outcome:
  - After 4 completed handbook sessions, children correctly solve at least 75% of inline interactions at their assigned age band while completing at least 80% of pages in one sitting.
  - Parent dashboard should show growth in both story completion and interaction accuracy, not screen time only.
- Milestone mapping:
  - Ages 3-4: listening + concrete counting and color/shape identification.
  - Ages 5-6: two-step prompts, beginning letter-sound and simple compare/addition.
  - Ages 6-7: stronger reading support fade, short word building, and story-linked reasoning prompts.

## Target Age Range
- Primary: 3-7 (single feature with age-band adaptive scaffolding).
- Initial content pack launch: ages 3-6 core; ages 6-7 stretch via advanced prompt variants.

## Mechanic
- Primary interaction model: page-turn story flow with inline action pauses.
- Child loop on each interactive page:
  1. Narration plays.
  2. Story pauses at a challenge beat.
  3. Child performs one action (tap, drag, sort, trace-lite, or numeric choice).
  4. Action is validated immediately.
  5. Story resumes with positive feedback and continuation animation.
- Engine fit:
  - One gameplay component: `InteractiveHandbookGame`.
  - One row in `games` table for the feature shell (`slug: interactiveHandbook`, `game_type: handbook_story`).
  - Each handbook instance is content-configured (page JSON + media references + interaction metadata) without creating additional gameplay components.
- RTL/mobile requirements:
  - Page progression and indicators render RTL-first.
  - Swipe direction and chevrons respect Hebrew reading direction.
  - All child controls are 44px+ touch targets (60px recommended on tablet).

## Modes
- `Read To Me` (default, ages 3-5):
  - Autoplay narration + auto-highlight of interactive hotspots.
  - Interaction prompt appears with stronger visual scaffolds.
- `Read & Play` (default, ages 5-7):
  - Narration per page + child-controlled progress.
  - Inline interactions appear naturally in story and can include 2-step tasks for older band.
- `Calm Replay` (all ages):
  - Replays completed handbook with lower interaction density (for bedtime or regulation).
  - Keeps core audio and key story vocabulary review.

## Product Flow
1. Child opens Handbook shelf from home.
2. Child picks a handbook cover card (theme-aware art, age badge, and audio preview).
3. Preload phase (first 3 pages assets + first interaction audio) with דובי transition animation.
4. Story page loop runs with optional interaction pauses.
5. Mid-book natural break card appears after page 6-8 (for healthy stop option).
6. End recap card summarizes effort, key words, and one suggested next activity.
7. Parent-facing summary updates in dashboard immediately.

## Session Design
- Expected session time: 6-10 minutes for one 12-page handbook.
- Session loop pacing:
  - Non-interactive pages: 15-25 seconds narration/play.
  - Interactive pages: 20-40 seconds including feedback.
  - Total interaction moments per handbook: 4-6 mandatory, 2 optional.
- Natural stopping points:
  - Mid-book pause card ("continue later") after page 6.
  - End-of-book recap with clear exit, replay, and next handbook choice.
- Healthy screen-time guardrail:
  - After finishing one handbook, show "choose one more activity" prompt instead of autoplaying another long session.

## Completion Logic
- Page completion:
  - A page is complete after narration started and either interaction resolved (if required) or child advanced.
- Handbook completion:
  - Required: all pages visited + all mandatory interactions completed at least once.
  - Optional interactions can be skipped without failure; skipped items are logged for adaptive replay suggestion.
- No failure states:
  - Incorrect attempts never block progress indefinitely.
  - After two missed attempts, auto-scaffold appears and lets child succeed with support.
- Replay logic:
  - On replay, interaction variants rotate while preserving the same learning objective.
  - Mastered pages can shorten narration with a child-selected "quick story" toggle (audio still available per page).

## Pre-Literate UX Baseline (Mandatory)
- Every child-facing instruction line includes an adjacent `▶` replay icon (minimum 44px) that replays identical instruction audio.
- Child gameplay controls are icon-first and persistent: replay (`▶`), retry (`↻`), hint (`💡`), next/continue (`→`).
- No text-only action labels in child gameplay UI.
- Feedback is action-triggered immediately from child input; do not design separate `check` or `test` buttons.
- Icon taps always play consistent narrated cues so pre-readers can learn control meaning by sound.

## Icon Inventory (Mandatory)
| Action | Icon | Audio on tap | Immediate feedback |
|---|---|---|---|
| Replay page instruction | `▶` | Replays active `games.interactiveHandbook.instructions.*` key | Narrated sentence restarts and current hotspot pulses. |
| Retry interaction | `↻` | `feedback.encouragement.*` then prompt replay | Resets same interaction state with no penalty. |
| Hint | `💡` | `games.interactiveHandbook.hints.*` | Highlights valid target or next step animation. |
| Next page / continue | `→` | `feedback.success.*` transition cue | Smooth page-turn animation to next beat. |

## Difficulty Curve
- Level 1: Story Starter (ages 3-4)
  - 2 options max per interaction.
  - Counting range 1-5.
  - Single-step actions only.
  - Full narration auto-plays; hints auto-trigger after 4 seconds inactivity.
- Level 2: Story Explorer (ages 5-6)
  - 3 options per interaction.
  - Counting/addition range up to 10 with visual supports.
  - Up to 2-step interactions (listen then drag/select).
  - Hints trigger after first incorrect action or 6 seconds inactivity.
- Level 3: Story Problem-Solver (ages 6-7)
  - 3-4 options with plausible distractors.
  - Math prompts include simple word-problem framing (up to 12).
  - Reading prompts include initial-letter and short CVC-like Hebrew pattern support.
  - Hints are available on demand; auto-hint delayed to 8 seconds to preserve productive struggle.
- Adaptation rules:
  - Two consecutive incorrect actions on same interaction -> reduce options by one and replay prompt slower.
  - Three consecutive successful interactions without hint -> raise complexity by one step within age band.
  - Never change more than one complexity variable at a time.

## Feedback Design
- Success path:
  - Immediate positive animation on the acted object plus supportive narration (for example: "מעולה, מצאת את התשובה!").
  - Story resumes without friction to preserve narrative flow.
- Mistake handling:
  - No red X, no error buzzers, no failure screen.
  - Gentle phrase + contextual hint (for example: "ננסה יחד עוד פעם") and optional `💡` highlight.
  - After two misses, auto-scaffold reduces options and replays prompt slowly.
- Encouragement cadence:
  - Celebrate effort before correction.
  - If child is inactive for 6+ seconds, auto-replay instruction and pulse the next valid action target.

## First Handbook Blueprint (12 Pages)
### דובי וגן ההפתעות (Dubi and the Garden of Surprises)

| Page | Story Intent | Learning Objective | Interaction Insertion Point |
|---|---|---|---|
| 1 | דובי נכנס לגן ומגלה מפה צבעונית. | Listening focus: identify setting words (`גן`, `מפה`). | No mandatory interaction. Tapable ambient objects only. |
| 2 | דובי שומע קול שמבקש לאסוף 3 זרעים זהובים. | Concrete counting setup (goal quantity = 3). | Mandatory tap-count challenge: tap 3 seeds. |
| 3 | הזרעים מפוזרים בין פרחים בצבעים שונים. | Color identification in context. | Mandatory choose-color challenge: select yellow flower bed. |
| 4 | שער קטן נסגר ודובי מוצא שלט עם אות פותחת. | Letter recognition in story context. | Mandatory letter pick: choose the displayed initial letter for `פרח`. |
| 5 | דובי משקה צמחים, חלקם גדלים וחלקם נובלים. | Compare quantities (`more/less`). | Mandatory compare challenge: pick side with more healthy plants. |
| 6 | דובי מגיע לבריכה עם דגים ומספרים על אבנים. | Number-symbol mapping 1-8. | Optional tap hotspot: tap number that matches fish count. |
| 7 | דובי צריך לפתוח תיבה עם חידה: 4 + 2. | Story-embedded addition. | Mandatory numeric response interaction. |
| 8 | נפתחת פינה מוזיקלית עם אותיות קופצות. | Phonological listening (first sound). | Mandatory sound-to-letter matching (tap one of 3 letters). |
| 9 | רוח מפזרת פירות, דובי מסדר אותם בסלים. | Categorization and drag precision. | Mandatory drag-and-sort (fruit to matching basket). |
| 10 | דובי מוצא מילה קצרה על אבן קסם. | Early reading support (assemble 2-3 letters). | Mandatory word builder (guided for younger ages). |
| 11 | כל החברים בגן מצטרפים לספירה חגיגית. | Counting fluency and sequence recall. | Optional count-aloud with tap progression 1-10. |
| 12 | דובי חוגג ומסכם מה למדנו בגן ההפתעות. | Retell and retention (what we learned today). | Mandatory recap choice: pick one learned concept card. |

### Age-Band Scaling for Blueprint Interactions
- Ages 3-4:
  - Max 2 choices, large visual cues, narration repeats automatically.
  - Word-builder page uses prefilled letters with one missing slot.
- Ages 5-6:
  - 3 choices, moderate distractors, mixed tap + drag interactions.
  - Word-builder page requires ordering 3 letters with one audio hint.
- Ages 6-7:
  - 3-4 choices, reduced visual scaffolds, two-step prompts on pages 7/10.
  - Word-builder page includes no prefilled slots and optional challenge card.

## Audio Requirements
- All child-facing text must be i18n-keyed and audio-paired (Hebrew native voice).
- Key families:
  - `games.interactiveHandbook.title`
  - `games.interactiveHandbook.instructions.*`
  - `games.interactiveHandbook.controls.*`
  - `games.interactiveHandbook.hints.*`
  - `games.interactiveHandbook.recap.*`
  - `games.interactiveHandbook.handbooks.gardenOfSurprises.cover.*`
  - `games.interactiveHandbook.handbooks.gardenOfSurprises.pages.p01-p12.*`
  - `games.interactiveHandbook.handbooks.gardenOfSurprises.interactions.*`
  - `feedback.encouragement.*`
  - `feedback.success.*`
- Audio asset path pattern:
  - `public/audio/he/games/interactive-handbook/{handbook-slug}/page-{n}-narration.mp3`
  - `public/audio/he/games/interactive-handbook/{handbook-slug}/interaction-{id}-prompt.mp3`
  - `public/audio/he/games/interactive-handbook/shared/controls/*.mp3`
- Audio behavior constraints:
  - Narration ducks background music by at least 6dB.
  - Interaction success/fallback cues complete within 900ms before story resume.
  - Replay icon uses same clip, not alternate text, to avoid mismatch.

## Parent Visibility
- Parent dashboard should expose:
  - Handbooks started/completed.
  - Interaction accuracy by learning area (letters, numbers, reading, colors).
  - Hint usage trend by age level.
  - Stopping-point behavior (mid-book exits vs completions) to monitor fatigue.
- Parent summary keys:
  - `parentDashboard.handbooks.progressSummary`
  - `parentDashboard.handbooks.learningSignals`
  - `parentDashboard.handbooks.nextRecommendedBook`

## Dependency and Handoff Map
- Product + learning spec owner: [DUB-326](/DUB/issues/DUB-326) (Children Learning PM).
- Literacy framework alignment: [DUB-327](/DUB/issues/DUB-327) (Reading PM).
- UX and RTL page shell: [DUB-328](/DUB/issues/DUB-328) (UX Designer).
- Mechanics calibration: [DUB-329](/DUB/issues/DUB-329) (Gaming Expert).
- Architecture and schema: [DUB-330](/DUB/issues/DUB-330) + [DUB-333](/DUB/issues/DUB-333) (Architect lane).
- Hebrew script + narration package: [DUB-332](/DUB/issues/DUB-332) (Content Writer).
- Media production planning: [DUB-331](/DUB/issues/DUB-331) (Media Expert).
- FED implementation handoff is created directly from this spec (see `docs/children-learning-pm/features.md` delegated status row).

## Inspiration / References
- Khan Academy Kids: character-led narration with mastery pacing and friendly corrective feedback.
- Lingokids: thematic world structure and parent progress visibility.
- TinyTap: inline interaction insertion inside slide/story progression.
- Teach Your Monster to Read: progression from playful mechanics to stronger decoding skills.
- Endless Alphabet: memorable audio-first letter/word reinforcement with positive tone.

## Review Status
- Children Learning PM draft completed on 2026-04-10.
- Mechanics thresholds and interaction pacing should be validated in [DUB-329](/DUB/issues/DUB-329) before FED closes implementation.
