create temporary table audit_results (
  metric text not null,
  value numeric,
  note text
);

create temporary table run_times (
  phase text not null,
  rpc text not null,
  ms numeric not null
);

create temporary table target_games (
  game_id uuid not null,
  domain text not null
);

insert into target_games (game_id, domain)
values
  ('c52ed764-c064-48ec-af8c-c34455fc61ec', 'math'),
  ('02fc2651-73e2-42d9-a03b-9d1bf62dd7a3', 'letters'),
  ('c31a02d7-97f1-4d5b-8618-28f9c7ee9aef', 'reading');

create temporary table target_sessions (
  session_id uuid not null,
  game_id uuid not null,
  domain text not null
);

insert into target_sessions (session_id, game_id, domain)
select gen_random_uuid(), tg.game_id, tg.domain
from target_games tg;

insert into public.game_sessions (id, child_id, game_id, started_at, client_session_id)
select
  ts.session_id,
  '5d73a6fc-7c8e-4233-b824-a3b5daa5b7e5'::uuid,
  ts.game_id,
  now() - interval '2 days',
  'perf-dub607-' || ts.domain || '-' || ts.session_id::text
from target_sessions ts;

insert into public.game_attempts (
  session_id,
  child_id,
  game_id,
  attempt_index,
  score,
  stars,
  duration_ms,
  payload,
  created_at,
  updated_at
)
select
  ts.session_id,
  '5d73a6fc-7c8e-4233-b824-a3b5daa5b7e5'::uuid,
  ts.game_id,
  g.n,
  65 + (g.n % 35),
  (g.n % 4)::int,
  11000 + (g.n * 8),
  jsonb_build_object(
    'source', 'perf-benchmark',
    'gameSlug', games.slug,
    'levelNumber', ((g.n % 5) + 1),
    'completed', true,
    'roundsCompleted', ((g.n % 7) + 3),
    'summaryMetrics', jsonb_build_object(
      'firstAttemptSuccessRate', (58 + (g.n % 43)),
      'hintTrend', case when g.n % 3 = 0 then 'improving' when g.n % 3 = 1 then 'steady' else 'needs_support' end,
      'highestStableRange', case when g.n % 3 = 0 then '1-3' when g.n % 3 = 1 then '1-5' else '1-10' end,
      'ageBand', '5-6',
      'gatePassed', (g.n % 2 = 0),
      'decodeAccuracy', (52 + (g.n % 48)),
      'sequenceEvidenceScore', (47 + (g.n % 53)),
      'listenParticipation', (44 + (g.n % 56))
    )
  ),
  now() - (g.n || ' hours')::interval,
  now() - (g.n || ' hours')::interval
from target_sessions ts
join public.games games on games.id = ts.game_id
cross join generate_series(1, 120) as g(n);

insert into audit_results (metric, value, note)
select 'benchmark_attempt_rows', count(*)::numeric, 'synthetic rows inserted for measurement'
from public.game_attempts
where session_id in (select session_id from target_sessions);

insert into audit_results (metric, value, note)
select 'before_payload_avg_bytes', round(avg(pg_column_size(payload))::numeric, 2), 'summaryMetrics-only payload'
from public.game_attempts
where session_id in (select session_id from target_sessions);

insert into audit_results (metric, value, note)
select 'before_payload_p95_bytes', percentile_cont(0.95) within group (order by pg_column_size(payload))::numeric, 'summaryMetrics-only payload'
from public.game_attempts
where session_id in (select session_id from target_sessions);

insert into audit_results (metric, value, note)
select 'before_payload_max_chars', max(length(payload::text))::numeric, 'MAX_ATTEMPT_PAYLOAD_CHARS budget check'
from public.game_attempts
where session_id in (select session_id from target_sessions);

select set_config('request.jwt.claim.sub', 'ba4f6d53-32e4-4dae-8ec0-6edf46164c84', false);
select set_config('request.jwt.claim.role', 'authenticated', false);

insert into audit_results (metric, value, note)
with rows as (
  select *
  from public.dubiland_parent_dashboard_metrics('Asia/Jerusalem')
)
select
  'before_legacy_rpc_rows',
  count(*)::numeric,
  'row count before parentMetricsV1 backfill'
from rows;

insert into audit_results (metric, value, note)
with rows as (
  select *
  from public.dubiland_parent_dashboard_metrics('Asia/Jerusalem')
)
select
  'before_legacy_rpc_response_bytes',
  pg_column_size(coalesce(jsonb_agg(to_jsonb(rows)), '[]'::jsonb))::numeric,
  'JSONB serialized response size before parentMetricsV1 backfill'
from rows;

insert into audit_results (metric, value, note)
with rows as (
  select *
  from public.dubiland_parent_dashboard_curriculum_metrics('Asia/Jerusalem')
)
select
  'before_curriculum_rpc_rows',
  count(*)::numeric,
  'row count before parentMetricsV1 backfill'
from rows;

insert into audit_results (metric, value, note)
with rows as (
  select *
  from public.dubiland_parent_dashboard_curriculum_metrics('Asia/Jerusalem')
)
select
  'before_curriculum_rpc_response_bytes',
  pg_column_size(coalesce(jsonb_agg(to_jsonb(rows)), '[]'::jsonb))::numeric,
  'JSONB serialized response size before parentMetricsV1 backfill'
from rows;

do $$
declare
  i int;
  t0 timestamptz;
  ms numeric;
begin
  perform set_config('request.jwt.claim.sub', 'ba4f6d53-32e4-4dae-8ec0-6edf46164c84', true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  for i in 1..12 loop
    t0 := clock_timestamp();
    perform * from public.dubiland_parent_dashboard_metrics('Asia/Jerusalem');
    ms := extract(epoch from (clock_timestamp() - t0)) * 1000;
    insert into run_times (phase, rpc, ms) values ('before', 'legacy', ms);

    t0 := clock_timestamp();
    perform * from public.dubiland_parent_dashboard_curriculum_metrics('Asia/Jerusalem');
    ms := extract(epoch from (clock_timestamp() - t0)) * 1000;
    insert into run_times (phase, rpc, ms) values ('before', 'curriculum', ms);
  end loop;
end
$$;

update public.game_attempts ga
set payload = ga.payload || jsonb_build_object(
  'parentMetricsV1',
  jsonb_strip_nulls(
    jsonb_build_object(
      'contractVersion', 'parent-metrics.v1',
      'domain', ts.domain,
      'skillKey', games.slug,
      'accuracyPct', greatest(0, least(100, coalesce((ga.payload->'summaryMetrics'->>'firstAttemptSuccessRate')::numeric, 0))),
      'hintTrend', coalesce(ga.payload->'summaryMetrics'->>'hintTrend', 'steady'),
      'independenceTrend', coalesce(ga.payload->'summaryMetrics'->>'hintTrend', 'steady'),
      'progressionBand', coalesce(ga.payload->'summaryMetrics'->>'highestStableRange', '1-5'),
      'ageBand', coalesce(ga.payload->'summaryMetrics'->>'ageBand', '5-6'),
      'gatePassed', coalesce((ga.payload->'summaryMetrics'->>'gatePassed')::boolean, false),
      'decodeAccuracyPct', case
        when (ga.payload->'summaryMetrics'->>'decodeAccuracy') ~ '^[0-9]+(\.[0-9]+)?$'
          then greatest(0, least(100, (ga.payload->'summaryMetrics'->>'decodeAccuracy')::numeric))
        else null
      end,
      'sequenceEvidenceScore', case
        when (ga.payload->'summaryMetrics'->>'sequenceEvidenceScore') ~ '^[0-9]+(\.[0-9]+)?$'
          then greatest(0, least(100, (ga.payload->'summaryMetrics'->>'sequenceEvidenceScore')::numeric))
        else null
      end,
      'listenParticipationPct', case
        when (ga.payload->'summaryMetrics'->>'listenParticipation') ~ '^[0-9]+(\.[0-9]+)?$'
          then greatest(0, least(100, (ga.payload->'summaryMetrics'->>'listenParticipation')::numeric))
        else null
      end
    )
  )
)
from target_sessions ts
join public.games games on games.id = ts.game_id
where ga.session_id = ts.session_id;

insert into audit_results (metric, value, note)
select 'after_payload_avg_bytes', round(avg(pg_column_size(payload))::numeric, 2), 'summaryMetrics + parentMetricsV1 payload'
from public.game_attempts
where session_id in (select session_id from target_sessions);

insert into audit_results (metric, value, note)
select 'after_payload_p95_bytes', percentile_cont(0.95) within group (order by pg_column_size(payload))::numeric, 'summaryMetrics + parentMetricsV1 payload'
from public.game_attempts
where session_id in (select session_id from target_sessions);

insert into audit_results (metric, value, note)
select 'after_payload_max_chars', max(length(payload::text))::numeric, 'MAX_ATTEMPT_PAYLOAD_CHARS budget check'
from public.game_attempts
where session_id in (select session_id from target_sessions);

insert into audit_results (metric, value, note)
select
  'parent_metrics_added_avg_bytes',
  round(avg(pg_column_size(payload) - pg_column_size(payload - 'parentMetricsV1'))::numeric, 2),
  'incremental payload bytes from parentMetricsV1'
from public.game_attempts
where session_id in (select session_id from target_sessions);

insert into audit_results (metric, value, note)
select
  'parent_metrics_added_p95_bytes',
  percentile_cont(0.95) within group (order by (pg_column_size(payload) - pg_column_size(payload - 'parentMetricsV1')))::numeric,
  'incremental payload bytes from parentMetricsV1'
from public.game_attempts
where session_id in (select session_id from target_sessions);

select set_config('request.jwt.claim.sub', 'ba4f6d53-32e4-4dae-8ec0-6edf46164c84', false);
select set_config('request.jwt.claim.role', 'authenticated', false);

insert into audit_results (metric, value, note)
with rows as (
  select *
  from public.dubiland_parent_dashboard_metrics('Asia/Jerusalem')
)
select
  'after_legacy_rpc_rows',
  count(*)::numeric,
  'row count after parentMetricsV1 backfill'
from rows;

insert into audit_results (metric, value, note)
with rows as (
  select *
  from public.dubiland_parent_dashboard_metrics('Asia/Jerusalem')
)
select
  'after_legacy_rpc_response_bytes',
  pg_column_size(coalesce(jsonb_agg(to_jsonb(rows)), '[]'::jsonb))::numeric,
  'JSONB serialized response size after parentMetricsV1 backfill'
from rows;

insert into audit_results (metric, value, note)
with rows as (
  select *
  from public.dubiland_parent_dashboard_curriculum_metrics('Asia/Jerusalem')
)
select
  'after_curriculum_rpc_rows',
  count(*)::numeric,
  'row count after parentMetricsV1 backfill'
from rows;

insert into audit_results (metric, value, note)
with rows as (
  select *
  from public.dubiland_parent_dashboard_curriculum_metrics('Asia/Jerusalem')
)
select
  'after_curriculum_rpc_response_bytes',
  pg_column_size(coalesce(jsonb_agg(to_jsonb(rows)), '[]'::jsonb))::numeric,
  'JSONB serialized response size after parentMetricsV1 backfill'
from rows;

do $$
declare
  i int;
  t0 timestamptz;
  ms numeric;
begin
  perform set_config('request.jwt.claim.sub', 'ba4f6d53-32e4-4dae-8ec0-6edf46164c84', true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  for i in 1..12 loop
    t0 := clock_timestamp();
    perform * from public.dubiland_parent_dashboard_metrics('Asia/Jerusalem');
    ms := extract(epoch from (clock_timestamp() - t0)) * 1000;
    insert into run_times (phase, rpc, ms) values ('after', 'legacy', ms);

    t0 := clock_timestamp();
    perform * from public.dubiland_parent_dashboard_curriculum_metrics('Asia/Jerusalem');
    ms := extract(epoch from (clock_timestamp() - t0)) * 1000;
    insert into run_times (phase, rpc, ms) values ('after', 'curriculum', ms);
  end loop;
end
$$;

insert into audit_results (metric, value, note)
select
  phase || '_' || rpc || '_rpc_p50_ms',
  round(percentile_cont(0.5) within group (order by ms)::numeric, 3),
  '12-run median (same connection, warm cache)'
from run_times
group by phase, rpc;

insert into audit_results (metric, value, note)
select
  phase || '_' || rpc || '_rpc_p90_ms',
  round(percentile_cont(0.9) within group (order by ms)::numeric, 3),
  '12-run p90 (same connection, warm cache)'
from run_times
group by phase, rpc;

insert into audit_results (metric, value, note)
select
  phase || '_' || rpc || '_rpc_avg_ms',
  round(avg(ms)::numeric, 3),
  '12-run mean (same connection, warm cache)'
from run_times
group by phase, rpc;

insert into audit_results (metric, value, note)
select
  'legacy_rpc_p50_delta_ms',
  round(
    (select value from audit_results where metric = 'after_legacy_rpc_p50_ms') -
    (select value from audit_results where metric = 'before_legacy_rpc_p50_ms'),
    3
  ),
  'after - before (impact on existing parent dashboard RPC)';

insert into audit_results (metric, value, note)
select
  'curriculum_rpc_p50_delta_ms',
  round(
    (select value from audit_results where metric = 'after_curriculum_rpc_p50_ms') -
    (select value from audit_results where metric = 'before_curriculum_rpc_p50_ms'),
    3
  ),
  'after - before (new curriculum RPC over synthetic dataset)';

insert into audit_results (metric, value, note)
select
  'payload_avg_delta_bytes',
  round(
    (select value from audit_results where metric = 'after_payload_avg_bytes') -
    (select value from audit_results where metric = 'before_payload_avg_bytes'),
    2
  ),
  'after - before average payload bytes';

insert into audit_results (metric, value, note)
select
  'payload_max_chars_headroom_to_14000',
  14000 - (select value from audit_results where metric = 'after_payload_max_chars'),
  'chars remaining before MAX_ATTEMPT_PAYLOAD_CHARS';

insert into audit_results (metric, value, note)
select
  'payload_avg_delta_pct',
  round(
    ((select value from audit_results where metric = 'payload_avg_delta_bytes') /
      nullif((select value from audit_results where metric = 'before_payload_avg_bytes'), 0)) * 100,
    3
  ),
  'average payload growth percent';

insert into audit_results (metric, value, note)
select
  'legacy_rpc_response_delta_bytes',
  (select value from audit_results where metric = 'after_legacy_rpc_response_bytes') -
  (select value from audit_results where metric = 'before_legacy_rpc_response_bytes'),
  'serialized response delta for existing dashboard RPC';

insert into audit_results (metric, value, note)
select
  'curriculum_rpc_response_delta_bytes',
  (select value from audit_results where metric = 'after_curriculum_rpc_response_bytes') -
  (select value from audit_results where metric = 'before_curriculum_rpc_response_bytes'),
  'serialized response delta for curriculum RPC';

-- cleanup benchmark rows
delete from public.game_attempts
where session_id in (select session_id from target_sessions);

delete from public.game_sessions
where id in (select session_id from target_sessions);

select metric, value, note
from audit_results
order by metric;
