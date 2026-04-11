# Curriculum Benchmark and Cross-Topic Spec Shortlist (Ages 3-7)

Date: 2026-04-11  
Issue: [DUB-775](/DUB/issues/DUB-775)  
Parent: [DUB-673](/DUB/issues/DUB-673)

## Goal
Benchmark high-performing interaction patterns from Khan Academy Kids, TinyTap, and Duolingo ABC; map Dubiland coverage vs measurable objectives; publish a cross-topic shortlist with spec-ready next picks.

## Benchmark Matrix (What to borrow, not copy)

| Platform | Math patterns | Letters/Reading patterns | Colors/Visual concept patterns | Transfer guidance for Dubiland |
|---|---|---|---|---|
| Khan Academy Kids | Concrete manipulatives -> symbolic abstraction, mastery gates, calm remediation loops. | Short decodable loops, explicit scaffolding, repeated retrieval with variation. | Topic theming is consistent and tied to progression, not cosmetic only. | Keep concrete-to-symbolic bridges in every math depth lane; gate level jumps by mastery + hint-rate, not completion count alone. |
| TinyTap | Tap/drag micro-rounds with immediate result and simple mechanics for pre-readers. | Slide-level interaction density keeps children active every 20-40s. | Visual categories are introduced through direct touch sorting and matching. | Preserve one-action rounds, action-triggered feedback, and short-response cycles in all new specs. |
| Duolingo ABC | Fast mastery loops, corrective retry without shame, predictable progression structure. | Sound-first -> blend -> encode progression with short sessions and heavy audio reinforcement. | Uses lightweight playful visuals to maintain pace, not long passive sequences. | Strengthen decode-to-encode bridge and maintain short 3-6 minute sessions with immediate retry loops. |

## Coverage Map vs Learning Objectives

| Area | Current Dubiland strength | Highest-impact gap | Priority |
|---|---|---|---|
| Numbers (3-7) | Counting, quantity comparison, addition line, subtraction and build-10 specs already delegated. | Measurement language and real-world comparison transfer (length/weight/volume) are not yet covered by a dedicated game. | P1 |
| Letters (3-7) | Letter recognition, tracing, sound mapping, confusable contrast, storybook pipelines. | Pattern/rule-prediction logic transfer between letters and symbols is still shallow for ages 4-6. | P1 |
| Reading (5-7) | Decoding ladders and decodable-story lanes are expanding. | Encoding-from-audio (spelling production) remains under-covered as a standalone daily loop. | P1 |
| Colors (3-7) | Strong foundational recognition via Color Garden. | Cross-topic color use in logic/pattern rules is limited beyond basic identification. | P2 |

## Cross-Topic Shortlist (3-5 ideas)

1. **Pattern Train (Hebrew: רכבת הדפוסים)**  
   - Area: Early logic + pre-math + pre-reading rule detection (ages 4-6).  
   - Why: closes transition gap between simple matching and multi-step reasoning.
2. **Spell-and-Send (Hebrew: דואר מאייתים)**  
   - Area: Reading encoding bridge (ages 6-7).  
   - Why: converts listening/decoding gains into production-level literacy.
3. **Measure and Match (Hebrew: מודדים ומתאימים)**  
   - Area: Math measurement transfer (ages 6-7).  
   - Why: adds school-readiness concepts absent in current core math games.
4. **Money Market Mini (Hebrew: מיני-שוק הכסף)**  
   - Area: Numeracy + daily-life transfer (ages 6-7).  
   - Why: practical coin/value reasoning after base number bonds stabilize.
5. **Color Recipe Lab (Hebrew: מעבדת מתכוני צבע)**  
   - Area: Colors + prediction logic (ages 4-6).  
   - Why: expands color curriculum from naming to rule-based mixing prediction.

## Top Picks for Immediate Spec + Execution Routing

1. **Pattern Train** -> spec authored: `docs/games/pattern-train.md`
2. **Spell-and-Send** -> spec authored: `docs/games/spell-and-send.md`
3. **Measure and Match** -> spec authored: `docs/games/measure-and-match.md`

## Coherence with Parallel Lanes

- **Gaming Expert alignment:** Integrated the [DUB-774](/DUB/issues/DUB-774) shortlist checkpoint and preserved overlap boundaries (no duplicate tickets for already-delegated math depth lanes).  
- **Reading PM alignment:** [DUB-776](/DUB/issues/DUB-776) checkpoint is still pending at this timestamp; selected literacy pick (`Spell-and-Send`) remains compatible with current Hebrew reading ladder direction and should be reviewed against Reading PM final lane output before content lock.

## Execution Recommendation

- Route immediate implementation for the 3 top picks with load-balanced FED ownership and explicit coordination requirements:
  - Content Writer: Hebrew i18n + full audio prompt pack.
  - Gaming Expert: mechanic tuning and difficulty thresholds.
  - QA: misconception telemetry and adaptive-rule validation.
- Keep `Money Market Mini` and `Color Recipe Lab` in planned backlog until top-pick specs are in implementation and first telemetry returns.
