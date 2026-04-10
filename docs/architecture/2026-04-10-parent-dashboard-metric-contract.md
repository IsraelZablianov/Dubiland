# Parent Dashboard Metric Contract V1

Date: 2026-04-10  
Owner: Architect (CTO)  
Issue: [DUB-575](/DUB/issues/DUB-575)  
Source drift: [DUB-568](/DUB/issues/DUB-568) checkpoint C7 (cross-game parent metric comparability)

## Problem

Current game completion reporting is partially standardized (`firstAttemptSuccessRate`, `hintTrend`, `highestStableRange`) but still inconsistent across games and reading tracks. Parent-facing summaries are therefore hard to compare across math, letters, and reading.

## Current State (as of 2026-04-10)

- Parent dashboard top-line cards come from RPC `dubiland_parent_dashboard_metrics` (session minutes/streak/stars only).
- Game-specific progress insights are emitted per game route via `completion.summaryMetrics` and stored in `game_attempts.payload` through `submit-game-attempt`.
- `ParentSummaryMetrics` in `packages/web/src/games/engine/types.ts` supports shared fields plus optional reading-specific fields, but naming/semantics are not enforced uniformly.

## Decision

Adopt a canonical `parentMetricsV1` envelope for every gameplay attempt payload, with strict core fields and optional domain extensions.

- Canonical storage path: `game_attempts.payload.parentMetricsV1`
- Backward compatibility: if `parentMetricsV1` is missing, backend derives a best-effort mapping from legacy `payload.summaryMetrics`.
- Rollout strategy: additive migration (no breaking change to existing `summaryMetrics` consumers during V1 rollout).

## Canonical Envelope

```ts
export type MetricDomain = 'math' | 'letters' | 'reading';
export type TrendLabel = 'improving' | 'steady' | 'needs_support';
export type StableRange = '1-3' | '1-5' | '1-10';

export interface ParentMetricsV1 {
  contractVersion: 'parent-metrics.v1';
  domain: MetricDomain;
  skillKey: string; // e.g. counting, comparison, letter-sound, decoding

  // Comparable core metrics across all games
  accuracyPct: number; // 0..100 first-attempt accuracy
  hintTrend: TrendLabel; // hint reliance trend
  independenceTrend: TrendLabel; // independent performance trend
  progressionBand: StableRange;

  // Shared context
  ageBand?: '3-4' | '4-5' | '5-6' | '6-7';
  gatePassed?: boolean;

  // Optional domain extensions
  decodeAccuracyPct?: number; // reading
  sequenceEvidenceScore?: number; // reading comprehension evidence
  listenParticipationPct?: number; // pre-literacy listening participation
}
```

## Mapping Rules

### Required canonical mapping

- `accuracyPct` <- `summaryMetrics.firstAttemptSuccessRate`
- `hintTrend` <- `summaryMetrics.hintTrend`
- `progressionBand` <- `summaryMetrics.highestStableRange`
- `independenceTrend`:
  - reading games: explicit game signal when available
  - non-reading games: fallback to `hintTrend` until game-specific independence signal is implemented

### Optional mapping

- `decodeAccuracyPct` <- `summaryMetrics.decodeAccuracy` (reading only)
- `sequenceEvidenceScore` <- `summaryMetrics.sequenceEvidenceScore` (reading only)
- `listenParticipationPct` <- `summaryMetrics.listenParticipation` (when available)
- `gatePassed` <- `summaryMetrics.gatePassed` (or reading gate output)

## Data/Query Contract

Add a new curriculum comparability read path (alongside existing parent dashboard top-line RPC):

- SQL view: `dubiland_parent_metrics_latest_v1`
- RPC: `dubiland_parent_dashboard_curriculum_metrics(p_timezone text default 'Asia/Jerusalem')`

Expected return shape (per child and domain):

- `child_id`
- `domain`
- `avg_accuracy_pct_14d`
- `hint_trend_latest`
- `independence_trend_latest`
- `progression_band_latest`
- `last_skill_key`
- `updated_at`

Security and privacy:

- `SECURITY INVOKER`
- family ownership filter (`families.auth_user_id = auth.uid()`)
- no child PII beyond `child_id`

## Edge Function Contract

`submit-game-attempt` must enforce:

- if `payload.parentMetricsV1` exists:
  - validate enum/value ranges
  - reject malformed payload with 400
- if missing:
  - derive fallback from `payload.summaryMetrics`
  - write normalized `payload.parentMetricsV1`
- preserve idempotent upsert on `game_attempts.id`

## Frontend Contract

- Game routes keep existing `summaryMetrics` usage for local end-of-session UX.
- FED adds an adapter per game/domain to produce `parentMetricsV1` consistently.
- Parent dashboard reads new curriculum RPC for comparable cards/rows (domain-level, then game-level drilldown).

## Rollout Phases

1. **Schema/query phase (Backend)**
   - add view + RPC for curriculum comparability
   - add migration with RLS-safe query semantics
2. **Write-path phase (Backend + FED)**
   - edge validation/normalization in `submit-game-attempt`
   - game emitters write `parentMetricsV1`
3. **UI phase (FED)**
   - parent dashboard consumes curriculum RPC
4. **Verification phase (QA + Performance)**
   - cross-game comparability matrix + payload validation + response-size/perf guardrails

## Acceptance Criteria for DUB-575 Close

- architecture contract published (this document)
- child execution lanes created for Backend, FED, QA, and Performance with explicit owner scopes
- parent ticket updated with canonical dependency chain and unblock criteria
