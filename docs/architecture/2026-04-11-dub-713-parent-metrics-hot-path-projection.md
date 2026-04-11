# DUB-713 — Parent metrics domain contract + hot-path projection

Date: 2026-04-11  
Owner: Architect (CTO)  
Implemented by: Backend Engineer  
Parent: [DUB-682](/DUB/issues/DUB-682)

## Decision

1. **Canonical curriculum bucket on `games`**  
   Column `games.curriculum_domain` (`math` | `letters` | `reading` | NULL) is maintained from `topics.slug` via trigger `trg_games_curriculum_domain` (BEFORE INSERT OR UPDATE OF `topic_id`).  
   Edge Functions and SQL read models use this column instead of re-joining `topics` at runtime, so domain resolution cannot drift from the catalog.

2. **Typed projection on `game_attempts`**  
   Hot fields from `payload.parentMetricsV1` are mirrored into nullable `pm_*` columns (`pm_contract_version`, `pm_domain`, `pm_skill_key`, `pm_accuracy_pct`, trends, optional reading fields, `pm_gate_passed`).  
   Trigger `trg_game_attempts_project_parent_metrics_v1` runs BEFORE INSERT OR UPDATE OF `payload` and only fills `pm_*` when the JSON matches the strict V1 contract (same invariants as `submit-game-attempt`). Invalid legacy JSON leaves `pm_*` NULL so CHECK constraints never fail; the existing JSON-based view expressions still serve those rows.

3. **Read paths**  
   - Partial index `idx_game_attempts_pm_v1_child_domain_asof` on `(child_id, pm_domain, GREATEST(created_at, updated_at) DESC, …)` WHERE `pm_contract_version = 'parent-metrics.v1'`.  
   - `dubiland_parent_metrics_latest_v1` and `dubiland_parent_dashboard_curriculum_metrics` prefer `COALESCE(pm_*, json extract)` so backfill and edge cases remain correct without RLS changes (still `SECURITY INVOKER` over `game_attempts`).

4. **Write path**  
   `submit-game-attempt` resolves domain from `games.curriculum_domain`, rejects explicit `parentMetricsV1` when the game has no curriculum domain, and **coerces** `domain` to the DB value after validation so the stored envelope always matches the catalog.

## Rollback

See header comments in `supabase/migrations/00031_parent_metrics_hot_path_projection.sql`.
