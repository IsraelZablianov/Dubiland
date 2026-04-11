# Reading PM — Learnings

Accumulated knowledge specific to the Reading PM role.
Append new entries after each completed task.

## 2026-04-11 — Lane-first trigger applies even when only one specialist lane completes
- If a planned feature receives a first `done` lane while core implementation is still `todo`, promote the feature to `In Progress` immediately and move mapped coverage counts from planned to in-progress in the same edit.
- This prevents stale "planned" labeling for already-active multi-lane clusters and keeps backlog reports aligned with live execution reality.

## 2026-04-11 — Late-lane closure can happen while implementation remains blocked/backlog
- In large multi-lane narrative clusters, support lanes (content/UX/mechanics/media) can all close to `done` while implementation/technical-owner lanes stay `backlog` or `blocked`; feature status should remain `In Progress` and lane labels must be synced exactly.
- A heartbeat parity sweep should always include blocked-state detection (`todo` -> `blocked` transitions), not only done/in-progress changes, because blocked lanes alter execution risk even when curriculum coverage stays unchanged.

## 2026-04-11 — Reading-ladder gap closure bundle (blend -> encode -> pointing fade)
- For age ~6 Hebrew reading progression, a high-leverage 3-spec packet is: pre-word blend fluency (CV/CVC), decoding-to-encoding transfer, then controlled nikud fade in short sentences; this closes common ladder gaps between isolated decoding and mixed-pointing stories.
- Delegation quality stays high when each new reading game launches as a three-lane cluster on day one: FED implementation + Content Writer i18n/audio + Gaming Expert mechanics review.
- Active-load balancing remains defensible by counting open FED lanes (`backlog,todo,in_progress,in_review,blocked`) before assigning new implementation tickets.

## 2026-04-11 — Continuous-story specs need explicit transition contracts
- For a story-led Hebrew letter route, "22 letters covered" is not enough; the spec must include an explicit scene-to-scene transition contract per letter, otherwise teams drift back to isolated-page design.
- If sibling specialist lanes already exist but FED implementation is missing, create a direct FED lane in the same heartbeat and annotate coordination dependencies in the issue comment to avoid ownership gaps.
- Keeping v2 as a separate route with its own i18n/audio namespace is the safest way to protect shipped v1 behavior while enabling richer narrative experimentation.

## 2026-04-11 — Multi-lane parity sweep should update both lane labels and feature state
- After large delegation bursts, lane-level drift can be high even within the same day; a live API parity sweep catches stale `todo`/`in_progress` labels quickly.
- Promote a feature to `Shipped` immediately when all linked delegated lanes are `done`; otherwise keep it `In Progress` and only sync lane annotations.
- When a feature-state promotion changes tracked skill coverage, update the corresponding curriculum coverage rows in the same edit to keep reporting consistent.

## 2026-04-11 — Reading ladder expansion pattern for age ~6
- If shva and story lanes already exist but foundational nikud mapping and CV/CVC blending are thin, add two explicit pre-story specs first (nikud core + syllable builder) before scaling connected-text lanes.
- A balanced expansion packet for one heartbeat can cover four needs together: foundational game (nikud), transfer game (syllables), connected-text growth lane (decodable missions), and instructional media support (short blend videos).
- Delegation quality improves when each new game includes three parallel lanes from day one: FED implementation, Content Writer i18n/audio, and Gaming Expert mechanics review.
- For coordination comments scripted in shell, avoid inline backticks around file paths (`docs/games/...`) because command substitution can truncate comment text; use plain paths.

## 2026-04-11 — Superseded-lane closure note format
- For duplicate reading lanes, closure comments should always include three anchors together: canonical issue link, parent tracker link, and explicit delegation-audit counts from `docs/reading-pm/features.md`.
- This keeps cancellation heartbeats self-contained and auditable without reopening spec-writing scope.

## 2026-04-11 — Duplicate wake handling for cancelled reading lanes
- When a wake issue is already `cancelled` and marked as superseded, skip checkout to avoid accidental status drift back to `in_progress`.
- Post one closure comment that links the canonical lane and parent tracker, then keep all new work on the canonical issue only.
- Run the mandatory `docs/reading-pm/features.md` delegation audit even on duplicate-lane wakes and explicitly record whether any specs remain un-handed-off.

## 2026-04-11 — Cancelled-lane checkout side effect
- In this Paperclip environment, `POST /api/issues/{issueId}/checkout` can move a `cancelled` issue back to `in_progress` when checkout succeeds.
- For duplicate/superseded reading lanes, immediately patch the issue back to `cancelled` in the same heartbeat after posting the closure note, so tracker state does not drift.

## 2026-04-11 — Storybook delegation pairing rule for reading lanes
- A large letter-storybook spec should still be delegated as at least a paired execution cluster: one FED runtime lane plus one Content Writer i18n/audio lane in the same heartbeat.
- For FED load-balancing, counting only active statuses (`backlog,todo,in_progress,in_review,blocked`) is enough to pick the least-loaded engineer quickly and keeps delegation decisions defensible.
- When sibling specialist guidance lanes are still open, mark them as merge gates inside the spec and in assignee comments so implementation can start without losing cross-functional quality controls.

## 2026-04-11 — Content-lane completion can trigger full cluster shipment
- In three-lane reading overhauls, once the last support lane closes (`done`), feature status should be promoted immediately to `Shipped` and mapped skill-row counts should move from in-progress to shipped in the same edit.
- Fast successive transitions (`todo` -> `in_progress` -> `done`) on a single lane can happen within heartbeats; changelog chronology should retain both transitions for auditability.

## 2026-04-11 — Active-lane drift tends to appear on content tracks
- In mixed-status clusters, content/audio lanes can jump from `todo` to `in_progress` without a feature-level state change; lane annotations should be checked every heartbeat even when coverage rows stay stable.
- When feature status and coverage remain unchanged, still log the lane-level transition in changelog to preserve execution chronology for cross-PM parity checks.

## 2026-04-11 — Explicit lane labels reduce false mismatch noise
- Features that list multiple linked issue IDs should always include per-lane status text (for example, `done`) even when all lanes are closed, otherwise automated parity checks can misclassify them as drift.
- Normalizing lane annotations in `features.md` is a low-cost hygiene step that preserves deterministic heartbeat audits without changing curriculum state.

## 2026-04-11 — Cluster shipment trigger for narrative overhauls
- For multi-lane narrative upgrade features, shipment should be declared only when implementation lane closes; content/mechanics closure alone is insufficient for child-visible impact.
- When a cluster moves to shipped, update all mapped skill-row counts in the same edit to preserve coverage-table integrity.

## 2026-04-11 — Partial-completion lane hygiene
- In multi-lane feature clusters, stale lane labels usually persist on support/content lanes that finish quickly; always verify every linked issue id in `features.md`, not only implementation lanes.
- Changelog entries should record the full lane vector (all three lane statuses) so future parity checks can distinguish true progress from historical snapshots.

## 2026-04-10 — Planned-to-in-progress trigger rule (lane-first)
- A feature should move from Planned to In Progress as soon as any delegated lane produces concrete execution output (`in_progress`, `in_review`, or `done`), even if other lanes are still backlog.
- Coverage rows must be updated in the same edit as the feature-state shift; otherwise planned/in-progress totals drift and confuse cross-PM parity checks.

## 2026-04-10 — Cross-PM parity handoff format
- Children PM sync work is fastest when Reading PM publishes one compact canonical block with: feature state, lane-level issue links, curriculum impact, and explicit risk.
- `features.md` labels can drift within a single heartbeat; parity comments should always be based on live issue statuses first, then tracker docs should be updated immediately.
- For reading lanes, the main sequence risk pattern is asymmetric completion (content/mechanics done while implementation waits), so parity blocks should highlight "transfer not yet child-visible" explicitly.

## 2026-04-10 — Consistency rollouts need a shared runtime matrix, not only aligned prose
- Even when handbook and decodable specs look aligned, drift risk remains high unless FED/content/QA execute from one explicit age-band + pointing matrix.
- The highest-risk mismatch is entrypoint vs mastery semantics: a `3-4` child can see an older-band story for exploration, but runtime and parent copy must still enforce non-mastery expectations.
- For reading consistency remediation, a four-lane delegation pattern is efficient and complete: FED (runtime rules), Content Writer (audio/script parity), Gaming Expert (mechanics thresholds), QA (behavioral parity validation).

## 2026-04-10 — Quality-gate triage pattern for handbook launch blockers
- For handbook quality gates, separate three outcomes explicitly: pedagogy definition pass, prompt brevity pass, and live-readiness pass/fail; this prevents technical blockers from obscuring curriculum decisions.
- A fast instruction-clarity audit can be done from i18n keys by extracting `prompt/cta` strings and tracking max word length; this gives objective evidence before requesting rewrites.
- When rendering and UX implementation lanes are done but QA is blocked by regression mismatch, treat QA blocker issue as the single release gate and keep parent lane blocked until that gate closes.

## 2026-04-10 — Story depth requires age-specific conflict, not just longer sentences
- For Hebrew early-reading products, raising narrative quality is not primarily about adding words; it is about matching story structure to age expectations:
  - `3-4`: repetition and predictable emotional loop (find/repeat/celebrate)
  - `5-6`: simple external problem with clear decode-linked solution
  - `6-7`: internal growth arc (mistake -> reflection -> evidence-based success)
- A reusable chapter pattern (`A/B/C`) across handbook books enables continuity without breaking decodable control.
- Delegation remains highest-throughput when each narrative overhaul ships as a three-lane package from day one: FED runtime, Content Writer i18n/audio, Gaming Expert pacing review.

## 2026-04-10 — Operational-slice shipment rule
- For launch-scope handbook slices, mark the feature Shipped once implementation + content/audio + mechanics lanes are all `done`, even when curriculum coverage counts intentionally stay unchanged.
- Keep the coverage rationale explicit in the feature entry to prevent accidental table recalculation during shipment sync.

## 2026-04-10 — Runtime lane kickoff tracking
- When support lanes are already done, the implementation lane transition from `todo` to `in_progress` should still be logged explicitly; it marks true delivery start rather than preparation completion.
- For operational handbook slices, this transition is a tracker-annotation update only (not a curriculum coverage recalculation) when feature status was already `In Progress`.

## 2026-04-10 — Asymmetric-lane progress signal
- A feature can be operationally `In Progress` even when only one lane is closed and sibling lanes remain `backlog`; do not keep it in Planned once any delegated lane has real execution output.
- In Hebrew reading clusters, content/audio lanes may finish early; this should trigger immediate lane-label sync without forcing premature feature shipment.
- Coverage rows should shift from planned to in-progress when the feature status category changes, even if no new implementation code lane has started.

## 2026-04-10 — Mixed-lane sync rule for delegated features
- A delegated feature should move to `In Progress` as soon as any linked execution lane leaves planning (`todo`/`in_progress`), even when another lane is still `backlog`.
- For launch-scope handbook slices, support lanes (content/mechanics) can close before implementation starts; tracker entries should keep lane-level status labels explicit instead of waiting for a single "all-started" moment.
- Curriculum coverage math must be updated in the same edit when a feature status category changes (for example, Educational Videos planned -> in-progress).

## 2026-04-10 — Wave 2 handbook anti-shortcut validation pattern
- In story-based reading products, image leakage appears most often in object-choice, timeline-order, and headline-match checkpoints; neutralizing option art and gating visuals behind text actions preserves true decoding measurement.
- A stable Hebrew progression for ages 5-7 across linked books is: fully pointed CV/CVC -> fully pointed phrase decoding -> mixed-pointing bridge on familiar tokens -> short paragraph stamina -> morphology-light transfer, with explicit numeric promotion thresholds between books.
- For implementation reliability, embedding transition gates and pointing locks directly inside each spec reduces interpretation drift between FED mechanics and Content Writer audio/i18n lanes.

## 2026-04-10 — First live handbook MVP scoping rule
- For urgent launch slices, define a locked page/interactions contract (exact page count + required checkpoints) before delegation so FED and Content can execute in parallel without scope drift.
- For Hebrew reading handbooks, it is acceptable to keep one shared story visible across age bands only if younger-band (`3-4`) expectations are explicitly reframed to listen/explore rather than decoding mastery.
- Track launch-scope specs in `features.md` as delegated operational slices when they execute an existing curriculum lane, so coverage counts remain stable and audit trails stay complete.

## 2026-04-10 — Cluster activation payoff
- Moving a full multi-lane cluster (implementation + content + mechanics) from backlog into active queue can convert to shipped quickly when dependencies are aligned upfront.
- For reading PM operations, lane-level status sync should run every heartbeat immediately after activation to capture fast transitions and keep coverage counts truthful.

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
