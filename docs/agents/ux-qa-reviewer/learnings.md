# UX QA Reviewer — Learnings

Accumulated knowledge specific to the UX QA Reviewer role.
Append new entries after each completed review.

<!-- Format:
## YYYY-MM-DD — Topic
What was learned and why it matters.
-->

## 2026-04-10 — Full-app UX pass + Counting Picnic focus

Completed [DUB-81](/DUB/issues/DUB-81) on Vite dev (`/terms` and `/privacy` were 404 from the global footer — always click footer legal links once per release). Counting Picnic: redundant title in chrome + card, and identical `aria-label` on every tray item showed up clearly in the accessibility tree. Filed child tasks [DUB-108](/DUB/issues/DUB-108)–[DUB-111](/DUB/issues/DUB-111) for FED. Note: full-page screenshots can time out on long marketing pages; use viewport captures or scroll segments if needed.

## 2026-04-10 — DUB-113 visual polish audit (no browser MCP)

Completed [DUB-113](/DUB/issues/DUB-113) via code review + earlier visual memory: `App.tsx` route fallback is emoji-only; game locals set `thumbnailUrl: null`; no `public/images/` yet; `framer-motion` not in web package. Posted long-form audit comment on the issue and split work to [DUB-133](/DUB/issues/DUB-133)–[DUB-136](/DUB/issues/DUB-136). When browser tools are missing, still ship the audit from source and flag “confirm in browser” for responsive/gameplay feel.

## 2026-04-10 — Rotation 11: דובי effectiveness (deep dive, source-backed)

**Focus:** Area 11 — mascot as guide vs decoration (benchmark: Khan Kodi, Duo). Inbox empty → rotation only.

**Findings:** Illustrated `MascotIllustration` SVGs are strong on landing, public chrome, `Home`, celebrations in games, but **`Login` still uses emoji-only** header — breaks parent trust continuity (NNG two-user). Games mount mascot **`success` only**; no persistent **hint/coach** layer during rounds (**Gelman Action** gap). **Piaget / symbolic clarity:** `🧸` appears inside **countable object packs** in Counting Picnic (and similar toy lists elsewhere) while the same bear is the brand — role conflict.

**Tasks filed:** [DUB-185](/DUB/issues/DUB-185) (FED 2 — games coach + remove bear-as-prop), [DUB-186](/DUB/issues/DUB-186) (FED — login illustrated Dubi). Use JSON/Python for Paperclip bodies when descriptions include backticks — zsh mangles inline heredocs.

## 2026-04-10 — Rotation 5: Parent experience (Two-user / NNG trust, source)

**Focus:** `/parent`, `/parents`, `/parents/faq`, `/about`.

**Strong:** Public marketing parent surfaces deliver **safety** + **pedagogical** narrative with illustrations — supports **3-second parent trust** on credibility.

**Critical gap (in-app):** `ParentDashboard` **labels do not match computed data**: **פעילות היום** uses **lifetime** `learningMinutes` (not today); **התקדמות שבועית** has **no week scope**; **רצף ימים** is **distinct-day count**, not **consecutive streak**. **צפייה בדוחות** only scrolls; **הגדרות שמע** is placeholder; **`manageChildren`** exists in i18n/audio but **no UI**. Empty child list → four **0** tiles with no CTA. Filed systemic **[DUB-373](/DUB/issues/DUB-373)** (Paperclip routed assignee to **Backend Engineer** for honest aggregates; FED/PM/Content Writer named in ticket).

## 2026-04-10 — Rotation 4: Audio–visual coherence (Gelman Response, source)

**Strong:** `Home` **age band** chips use `useAudioManager` + `resolveCommonAudioPath` — matches **audio-first** for filter changes.

**Gap:** **Topic** selection, **Start learning**, and **`GameCard`** launch are **visual-only** on `/home`. **`ProfilePicker`** has **zero** audio hooks — profile pick + continue are **silent** for pre-readers. **Gelman Response** and internal **AGENTS.md** “audio for everything” imply **SFX or TTS** on these hub taps, not only in-game. Filed [DUB-366](/DUB/issues/DUB-366) (FED + Content Writer for `public/audio/he/ui/` assets).

## 2026-04-10 — Rotation 3: Responsive & touch (three surfaces, source)

**Landing `/`:** `@media (max-width: 768px)` stacks hero + shrinks mascot shell — adequate for tablet/phone fold. **PublicHeader:** hamburger + full-width column CTAs ≤768; **44px** touch floor on toggles/links — aligns with secondary minimum (primary still tied to [DUB-210](/DUB/issues/DUB-210)). **`AgeRangeFilterBar`:** `--touch-filter-chip: 44px` + horizontal scroll avoids cramming **5+** chips — good motor pattern.

**`/home` gap:** No responsive rules; **120px** Dubi beside headline at **375px** risks crowding; **daily goal** fill uses **`linear-gradient(90deg, …)`** on **RTL** `html` — direction semantics. Filed [DUB-313](/DUB/issues/DUB-313) → FED.

## 2026-04-10 — Rotation 2: Color Garden deep dive (Gelman lens, source)

**Scores (evidence-based):** **Flow** strong — adaptive `simplifyOneVariable`, midpoint break, `TOTAL_ROUNDS` pacing. **Investment** strong — `gardenCelebrate`, star pill, summary card. **Action** strong — floating `MascotIllustration` hint coach, panel miss/success motion, live progress dot. **Response** mostly strong — `registerMistake` pairs `triggerBoardFeedback('miss')` + `tryAgain` audio for wrong match/sort/rule taps; `completeRound` plays rotating success lines.

**Gaps filed:** duplicate tap on already-selected **rule** items exits silently ([DUB-294](/DUB/issues/DUB-294)); **▶ / →** on replay/next read **LTR** in RTL product. Wrong-tap path does **not** need a duplicate of older Picnic tickets.

## 2026-04-10 — Rotation 1: Onboarding flow (source)

**Gelman Flow / time-to-value:** `/login` now centers **guest-first** `Button` `lg` full-width, **Dubi hero + hint** (`FloatingElement`), divider, then Google/email — strong parent→play path. **ProtectedRoute** shows loading Dubi when Supabase + auth loading; guest short-circuits — good.

**Piaget / choice count:** `/profiles` renders **four** profile cards at once → **>3 simultaneous choices** for “who plays.” **NNG:** **הוספה** maps to `navigate('/parent')` while i18n implies adding a child — **label ≠ outcome**. Filed [DUB-263](/DUB/issues/DUB-263) → **UX Designer** (chunking + honest IA; FED implements after spec). **Note:** [DUB-186](/DUB/issues/DUB-186) (login illustrated Dubi) largely addressed in code — verify and close when convenient.

## 2026-04-10 — Rotation 7: Navigation & wayfinding (source)

**Focus:** global IA for authenticated vs marketing mode. **Inbox empty.**

**Findings:** `PublicHeader` logo + nav **דף הבית** always `to="/"` even when `showAppActions` — conflicts with `isMainNavActive` treating `/home` as “home”. No **`/home`** in app-actions while on `/parent`. **404** recovery always marketing + login.

**Tasks:** [DUB-425](/DUB/issues/DUB-425) FED (session-aware destinations + hub affordance + context 404), [DUB-426](/DUB/issues/DUB-426) FED (More Or Less Market `withAnimatedPage` parity).

## 2026-04-10 — DUB-387 parent dashboard polish (assigned)

Compared `ParentDashboard.tsx` to `Home.tsx` / public `Parents.tsx`: parent route lacks storybook background + gradient card chrome; weekly child rows use wrapping flex stats (weak scanability). Filed FED children [DUB-388](/DUB/issues/DUB-388)–[DUB-390](/DUB/issues/DUB-390). Flagged copy semantics: `parentDashboard.todayActivity` used for `rolling7dActiveDays`/7 in child rows — split i18n or relabel when FED touches layout.

## 2026-04-10 — DUB-462: Handbook “real storybook” audit (assigned, source)

Parent [DUB-433](/DUB/issues/DUB-433): board wanted browser screenshots — when MCP is missing, still deliver the **checklist** against `InteractiveHandbook` + `InteractiveHandbookGame` and flag **pixel confirmation**. Findings: **no illustration slot** in `interactive-handbook__story-card`, **instant** page changes, **duplicate title** (page header + in-card), **LTR `→`/`▶`** in RTL product. Filed [DUB-470](/DUB/issues/DUB-470) (UX spec) and [DUB-471](/DUB/issues/DUB-471) (FED). Did **not** advance rotation past index 7 — full RTL pass (area 8) still pending.

## 2026-04-10 — DUB-508: RTL wedge under critical visual audit (assigned)

**Focus:** Parent [DUB-508](/DUB/issues/DUB-508) required full-browser inspection; this heartbeat delivered the **RTL & Hebrew authenticity** slice via **static repo scan** (no browser MCP). **Major systemic pattern:** literal **`▶`/`→`** in many game shells + **`linear-gradient(90deg, …)`** on **`Home`**, **`GameCard`**, **`LetterSkyCatcherGame`**, **`MoreOrLessMarketGame`**. Filed consolidation [DUB-523](/DUB/issues/DUB-523); Paperclip **rejected `assigneeAgentId` to FED** from this agent — use **unassigned + comment** or PM assigns. Leave umbrella **in_progress** until screenshot pass completes.

## 2026-04-10 — Rotation 0: Landing & first impression (source)

**NNG 3-second parent test (inferred from structure):** Hero headline + subtitle + illustrated Dubi + dual CTA (try free vs parents) + trust band reads as **credible**; micro-motion (`FloatingElement`, card hover) supports **Gelman Action** on marketing. **Gap vs benchmarks:** `Button` `lg` = **56px**; header primary **נסו בחינם** uses **`sm`** = **44px** — under **60px** floor for primary taps on child-adjacent flows (Duolingo ABC / Khan Kids use larger primaries). Filed systemic task [DUB-210](/DUB/issues/DUB-210) to **Architect** (tokens + `Button` contract). Existing [DUB-111](/DUB/issues/DUB-111) still covers topic-card illustration; [DUB-108](/DUB/issues/DUB-108) legal 404 — not duplicated here.

## 2026-04-10 — DUB-555 + rotation 9: Cognitive load vs hub scaffolding

**Assigned:** [DUB-555](/DUB/issues/DUB-555) (CEO header/footer visual pass). [DUB-548](/DUB/issues/DUB-548) still **todo** → correctly **blocked** DUB-555; delivered **static** `App.tsx` shell map proving mismatch persists (`MarketingShell` vs `ChildPlayShell` vs `ParentShell`).

**Rotation 9:** `Home.tsx` `toConcurrentChoiceLimit` + featured slice already implement **Piaget-aligned hub density** (3-up for 3–6, 5 for 6–7). **In-game** choice cardinality is **not** coupled the same way — e.g. Shape Safari up to **5** tiles, Letter Sound Match **4** at higher levels, Number Line Jumps wide numeric palettes. Filed [DUB-570](/DUB/issues/DUB-570). **Correction for implementers:** `@dubiland/shared` `Child` has **no `ageBand`**; age band today flows via **session / profile** (`ProfilePicker`, catalog) — thread the same source games already use for difficulty, not the bare `Child` row alone.

**Paperclip:** `POST /api/issues/:id/release` on a **blocked** issue reset this run’s [DUB-555](/DUB/issues/DUB-555) to **`todo`** and cleared assignee — had to **PATCH** back to `blocked` + `blockedByIssueIds` + assignee. Prefer **not** calling `release` when the terminal state is blocked; exit the heartbeat with status as-is.

## 2026-04-10 — DUB-508 + rotation 10: Delight & micro-interactions

**Assigned** [DUB-508](/DUB/issues/DUB-508) (critical visual audit). Delivered **area 10** slice via **static** scan: `AnimatedPage` / `dubi-page-enter-inline` and `RouteFallback` are **above average** for a young-kids web app; **`SuccessCelebration`** is widely reused **except** `MoreOrLessMarketGame` and `NumberLineJumpsGame` (audio-only success feedback). Filed [DUB-592](/DUB/issues/DUB-592). **Paperclip:** `assigneeAgentId` on **create** returned **Assignee agent not found** for FED UUID from `docs/knowledge/conventions.md` — created **unassigned** + PATCH may work; PM should assign FED.

**Playwright:** AGENTS.md references Playwright MCP; this Cursor session had **no browser tool** — explicitly stated on DUB-508 comment so board does not assume screenshot matrix shipped.

## 2026-04-10 — DUB-508 + rotation 11: דובי effectiveness

**Area 11** via static grep: **9** `*Game.tsx` files import `MascotIllustration`; **5** do not — **MoreOrLessMarket**, **NumberLineJumps**, **LetterTracingTrail**, **DecodableStoryReader**, **InteractiveHandbook**. That is a clean **systemic** gap (Khan Kodi / Duo always on-screen during activities). Filed [DUB-597](/DUB/issues/DUB-597) under DUB-493; **dedup** with [DUB-185](/DUB/issues/DUB-185) called out in ticket body. **Paperclip FED UUID** from `GET /api/companies/:id/agents` matches `conventions.md` — “assignee not found” on create is likely **role ACL**, not stale docs.
