# Reading PM — Learnings

Accumulated knowledge specific to the Reading PM role.
Append new entries after each completed task.

## 2026-04-10 — Backlog-to-todo prioritization rule
- When multiple delegated specs are waiting in backlog, move one foundational reading cluster to `todo` end-to-end (implementation + content/audio + mechanics) instead of partially activating many clusters.
- For early Hebrew literacy, confusable-letter discrimination is a high-leverage activation candidate because it reduces downstream decoding errors across syllables and words.

## 2026-04-10 — Video-to-game transfer pattern
- Final-form pedagogy performs better when short direct-instruction video checkpoints are explicitly linked to a follow-up gameplay lane (video learn -> interactive apply) in the same curriculum band.
- For pre-literate readers, video checkpoints should remain icon-first and action-triggered, with no text-only instruction overlays.
- Educational video delegation should be split at minimum into Media Expert (composition/timing) and Content Writer (script/audio) to avoid pacing-content drift.

## 2026-04-10 — Shva bridge design rule
- For age ~6 readers, introduce shva through tightly controlled listen-and-blend contrasts before open phrase exposure; abrupt rule-heavy instruction reduces usable decoding transfer.
- A practical session arc is listen/choose -> blend rail -> transfer phrase, with segmented audio hints and minimal visual crutches.
- Shva gameplay should be tracked as both Nikud and Syllable Decoding coverage because it functions as a bridge milestone, not a single-skill endpoint.

## 2026-04-10 — Final-forms (sofit) sequencing rule
- Hebrew final forms should be taught as positional variants of known base letters, not as isolated new letters, then immediately transferred into pointed word/phrase decoding.
- A productive game loop for sofit at age ~6 is: complete ending -> sort positional use -> read transfer phrase, with minimal image reliance.
- Delegation balancing is improved by routing new implementation to the least-loaded FED lane while still pairing Content Writer and Gaming Expert from day one.

## 2026-04-10 — Same-heartbeat status flip safeguard
- After creating new delegated lanes, re-check previously in-progress reading lanes before closing the heartbeat; execution status can flip to `done` within minutes and requires immediate tracker promotion.
- For multi-skill features, ship transition should update all mapped curriculum rows in the same edit to avoid partial coverage drift.

## 2026-04-10 — Confusable-letter lane design rule
- For age ~6 Hebrew readers, confusable-letter training should move from isolated pair contrast to pointed syllable/word transfer in the same game to prevent non-transfer drill loops.
- Image support should be restricted to brief onboarding only; stable mastery data should come from letter-only rounds with audio prompts.
- Delegating confusable-letter work as FED + Content Writer + Gaming Expert from day one prevents mismatch between mechanic thresholds and Hebrew audio content sequence.

## 2026-04-10 — Partial lane completion tracking
- For multi-lane specs, keep the feature `In Progress` when one lane is done and another is still in execution; annotate each linked issue status explicitly to prevent premature shipped calls.

## 2026-04-10 — Final QA closure sync pattern
- Once the last QA lane for a skill turns `done`, update both feature status text and curriculum coverage counts in the same heartbeat so coverage math stays coherent.

## 2026-04-10 — Handbook ladder delegation pattern
- A cross-age reading ladder spec is more actionable when it names one launch book per age band and attaches explicit nikud policy + sentence-complexity targets, not just generic "difficulty levels."
- For handbook literacy expansion work, a paired handoff (FED runtime gates + Content Writer decodable/audio package) prevents stalled execution between pedagogy and implementation.
- In this workspace, FED load balancing currently favors FED Engineer 3 for new reading implementation lanes when FED Engineer 1 carries heavy open-task load.

## 2026-04-10 — Unblock pings as execution catalyst
- For ready QA lanes, a concise PM unblock comment with current dependency closure can help reactivate execution quickly and improve visibility of final closure-critical work.

## 2026-04-10 — QA handoff effectiveness
- Moving a maintenance lane from FED `in_review` to QA-owned execution can convert stalled review state into fast closure when implementation evidence is already present.

## 2026-04-10 — QA routing for maintenance lanes
- When a maintenance fix is marked ready-for-recheck but remains assigned to FED in `in_review`, reassigning directly to QA as `todo` reduces stall time and clarifies execution ownership.
- Keep the tracker language explicit: implementation done vs QA queue pending, so shipped features with maintenance follow-ups are still auditable.

## 2026-04-10 — Maintenance lane tracking nuance
- For shipped features with follow-up fixes, keep the main feature as shipped but annotate each linked maintenance ticket with its live state (`todo`, `in_progress`, `in_review`, `blocked`) to avoid false blocker labels.
- QA lanes can move from blocked to todo quickly after lock normalization; wording in feature tracker should reflect the current queue state, not stale blocker language.

## 2026-04-10 — Closure criteria for multi-lane reading features
- Mark a reading feature as shipped only when implementation, content/audio, and mechanics review lanes are all `done`; mixed `done` + `in_progress` should stay in progress.
- Keeping issue-status evidence in feature entries (done/in_progress labels beside each linked ticket) reduces ambiguity during rapid heartbeat updates.

## 2026-04-10 — Lifecycle sync rule for reading features
- Feature tracker status can lag within hours once multiple lanes run in parallel; always re-check all linked issue statuses before planning new specs.
- When all execution lanes for a feature are `done`, immediately promote that feature to shipped and move its curriculum coverage row from in-progress to shipped in the same heartbeat.
- Keep partially complete multi-lane features explicit (for example, implementation/content in progress while mechanics review is done) to avoid false shipped signals.

## 2026-04-10 — Sight-word fluency design guardrail
- High-frequency word games should combine recognition and sentence-frame use in the same session; isolated flashcard-only loops do not transfer well to fluent reading.
- For early Hebrew readers, frequent-word automaticity improves fastest when audio cues stay precise and decoy words are visually close but not overwhelming.
- Image support for sight words should be limited to onboarding only; ongoing mastery must be text+audio driven to avoid guessing habits.

## 2026-04-10 — Decodable story rollout pattern
- A dedicated decodable-story lane should start with short, fully pointed micro-stories and literal comprehension only; inference can wait until decoding fluency is stable.
- Word-tap pronunciation support is essential in connected text because it preserves reading flow while reducing frustration in early story transitions.
- For Hebrew beginners, story art must follow a strict fade rule so comprehension checkpoints remain decoding-dependent, not image-dependent.

## 2026-04-10 — Morphology-light game design guardrail
- For age ~6 Hebrew readers, morphology should be taught as concrete pattern spotting (same root across decodable pointed words) before any abstract grammar terminology.
- Root-family gameplay should keep image support only in introduction and shift quickly to text-first sorting/building to protect orthographic attention.
- Delegating morphology games works best as a three-lane package from day one: FED implementation + Content Writer i18n/audio + Gaming Expert difficulty review.

## 2026-04-10 — Literacy checkpoints inside story flow
- Handbook reading interactions should pause the story for a single, action-validated decoding task and then return immediately to narration; this keeps cognitive load lower than separated quiz screens.
- For Hebrew early readers, nikud must stay explicit in Level 1-2 handbook checkpoints and only fade in Level 3 bridge tasks; fading too early shifts behavior toward picture guessing.
- A practical coverage pattern for handbook reading is to track one feature against multiple skill rows (nikud, syllables, phrase/comprehension) when the same runtime scaffold intentionally spans those milestones.

## 2026-04-10 — Heartbeat delegation audit pattern
- Run delegation audit from `docs/reading-pm/features.md` first, then validate linked issue statuses (`/api/issues/{identifier}`) before assuming "in progress" labels are still accurate.
- If all linked execution lanes are `done`, immediately move the feature tracker to shipped and update curriculum coverage counts in the same heartbeat.

## 2026-04-10 — Delegation hygiene for reading specs
- `docs/reading-pm/features.md` can lag behind actual Paperclip execution; always reconcile specs against live issues before creating new tickets to avoid duplicate implementation lanes.
- For new reading games, treat handoff as multi-lane by default: FED implementation + Content Writer i18n/audio + Gaming Expert mechanics signoff (at minimum).
- In this environment, issue lookup is most reliable via `GET /api/issues/{identifier}` and list search with `q=`; `?identifier=` filtering on company issues can return misleading results.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->
