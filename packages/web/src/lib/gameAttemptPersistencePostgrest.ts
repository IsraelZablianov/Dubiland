/**
 * Persists game attempts via PostgREST (RLS) instead of the submit-game-attempt Edge Function.
 * Some environments return 401 from Edge `auth.getUser()` even when the same JWT works for REST.
 */
import type { Database, Json } from '@dubiland/shared';
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { resolveParentMetricsDomainAndSkillKeyFromSlug, type ParentMetricsV1 } from '@/lib/parentMetricsAdapter';

const MAX_ATTEMPT_PAYLOAD_CHARS = 14_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const AGE_BANDS = new Set(['3-4', '4-5', '5-6', '6-7']);
const METRIC_DOMAINS = new Set(['math', 'letters', 'reading']);
const TREND_LABELS = new Set(['improving', 'steady', 'needs_support']);
const PROGRESSION_BANDS = new Set(['1-3', '1-5', '1-10']);

export type GameAttemptPostgrestResult =
  | { status: 'persisted'; sessionId: string; attemptId: string }
  | { status: 'failed'; errorMessage: string };

export interface PersistGameAttemptPostgrestArgs {
  childId: string;
  gameId: string;
  clientSessionId: string;
  levelId: string | null;
  startedAt: string;
  ageBand: string | null;
  attemptId: string;
  attemptIndex: number;
  score: number;
  stars: number;
  durationMs: number | null;
  gameSlug: string;
  levelNumber: number | null;
  completed: boolean;
  roundsCompleted: number | null;
  summaryMetrics: unknown;
  parentMetricsV1: ParentMetricsV1 | null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function formatPostgrestError(err: PostgrestError | null | undefined, fallback: string): string {
  if (!err) return fallback;
  const parts = [err.message, err.code && `code=${err.code}`, err.details && `details=${err.details}`, err.hint && `hint=${err.hint}`].filter(
    Boolean,
  ) as string[];
  return parts.length > 0 ? parts.join(' | ') : fallback;
}

/** Integers for DB INT columns + stars CHECK (0–3); avoids PostgREST 400 on bad client values. */
function sanitizeAttemptScalars(args: {
  score: number;
  stars: number;
  attemptIndex: number;
  durationMs: number | null;
}): { score: number; stars: number; attemptIndex: number; durationMs: number | null } {
  const score = Number.isFinite(args.score) ? Math.round(Math.max(0, args.score)) : 0;
  const starsRaw = Number.isFinite(args.stars) ? Math.round(args.stars) : 0;
  const stars = Math.min(3, Math.max(0, starsRaw));
  const attemptIndex = Number.isFinite(args.attemptIndex) ? Math.max(0, Math.floor(args.attemptIndex)) : 0;
  let durationMs: number | null = null;
  if (args.durationMs != null && Number.isFinite(args.durationMs)) {
    durationMs = Math.max(0, Math.round(args.durationMs));
  }
  return { score, stars, attemptIndex, durationMs };
}

/** Ensure payload is JSON-serializable (no undefined keys in nested objects from structuredClone gaps). */
function payloadAsJson(value: Record<string, unknown>): Json {
  try {
    const serialized = JSON.stringify(value, (_k, v) => {
      if (typeof v === 'number' && !Number.isFinite(v)) {
        return null;
      }
      return v;
    });
    return JSON.parse(serialized) as Json;
  } catch {
    return {
      dubilandPayloadSerializationFailed: true,
      gameSlug: typeof value.gameSlug === 'string' ? value.gameSlug : null,
    } as Json;
  }
}

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function roundMetric(n: number, places: number): number {
  const p = 10 ** places;
  return Math.round(n * p) / p;
}

function summarizePayloadForStorage(payload: Record<string, unknown>): Record<string, unknown> {
  const raw = JSON.stringify(payload);
  if (raw.length <= MAX_ATTEMPT_PAYLOAD_CHARS) return payload;
  const topLevelKeysSample = Object.keys(payload).slice(0, 40);
  const meta: Record<string, unknown> = {
    dubilandPayloadTruncated: true,
    approxOriginalChars: raw.length,
    topLevelKeysSample,
  };
  if (payload.dubilandAgeBand != null) {
    meta.dubilandAgeBand = payload.dubilandAgeBand;
  }
  if (payload.dubilandDifficultyProfileId != null) {
    meta.dubilandDifficultyProfileId = payload.dubilandDifficultyProfileId;
  }
  if (payload.parentMetricsV1 != null) {
    meta.parentMetricsV1 = payload.parentMetricsV1;
  }
  return meta;
}

type MetricDomain = 'math' | 'letters' | 'reading';

function validateAndNormalizeParentMetricsV1(
  raw: Record<string, unknown>,
): { ok: true; value: Record<string, unknown> } | { ok: false; message: string } {
  if (raw.contractVersion !== 'parent-metrics.v1') {
    return {
      ok: false,
      message: 'parentMetricsV1.contractVersion must be parent-metrics.v1',
    };
  }
  const domain = raw.domain;
  if (typeof domain !== 'string' || !METRIC_DOMAINS.has(domain)) {
    return { ok: false, message: 'parentMetricsV1.domain must be math, letters, or reading' };
  }
  const skillKey = typeof raw.skillKey === 'string' ? raw.skillKey.trim() : '';
  if (skillKey.length < 1 || skillKey.length > 96) {
    return {
      ok: false,
      message: 'parentMetricsV1.skillKey must be a non-empty string (max 96 chars)',
    };
  }

  const accRaw = raw.accuracyPct;
  const acc = typeof accRaw === 'number' ? accRaw : Number(accRaw);
  if (!Number.isFinite(acc)) {
    return { ok: false, message: 'parentMetricsV1.accuracyPct must be a number' };
  }
  if (acc < 0 || acc > 100) {
    return { ok: false, message: 'parentMetricsV1.accuracyPct must be between 0 and 100' };
  }

  const hintTrend = raw.hintTrend;
  if (typeof hintTrend !== 'string' || !TREND_LABELS.has(hintTrend)) {
    return {
      ok: false,
      message: 'parentMetricsV1.hintTrend must be improving, steady, or needs_support',
    };
  }
  const independenceTrend = raw.independenceTrend;
  if (typeof independenceTrend !== 'string' || !TREND_LABELS.has(independenceTrend)) {
    return {
      ok: false,
      message: 'parentMetricsV1.independenceTrend must be improving, steady, or needs_support',
    };
  }
  const progressionBand = raw.progressionBand;
  if (typeof progressionBand !== 'string' || !PROGRESSION_BANDS.has(progressionBand)) {
    return {
      ok: false,
      message: 'parentMetricsV1.progressionBand must be 1-3, 1-5, or 1-10',
    };
  }

  const out: Record<string, unknown> = {
    contractVersion: 'parent-metrics.v1',
    domain,
    skillKey,
    accuracyPct: roundMetric(clampPct(acc), 2),
    hintTrend,
    independenceTrend,
    progressionBand,
  };

  if (raw.ageBand !== undefined && raw.ageBand !== null) {
    if (typeof raw.ageBand !== 'string' || !AGE_BANDS.has(raw.ageBand)) {
      return { ok: false, message: 'parentMetricsV1.ageBand invalid when provided' };
    }
    out.ageBand = raw.ageBand;
  }
  if (raw.gatePassed !== undefined && raw.gatePassed !== null) {
    if (typeof raw.gatePassed !== 'boolean') {
      return { ok: false, message: 'parentMetricsV1.gatePassed must be a boolean when provided' };
    }
    out.gatePassed = raw.gatePassed;
  }

  const optPct = (
    key: string,
    outKey: string,
  ): { ok: false; message: string } | undefined => {
    const v = raw[key];
    if (v === undefined || v === null) return undefined;
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      return {
        ok: false,
        message: `parentMetricsV1.${key} must be a number between 0 and 100 when provided`,
      };
    }
    out[outKey] = roundMetric(clampPct(n), 2);
    return undefined;
  };

  const e1 = optPct('decodeAccuracyPct', 'decodeAccuracyPct');
  if (e1) return e1;
  const e2 = optPct('sequenceEvidenceScore', 'sequenceEvidenceScore');
  if (e2) return e2;
  const e3 = optPct('listenParticipationPct', 'listenParticipationPct');
  if (e3) return e3;

  return { ok: true, value: out };
}

function deriveParentMetricsV1FromSummary(args: {
  summary: Record<string, unknown>;
  domain: MetricDomain;
  skillKey: string;
}): Record<string, unknown> | null {
  const { summary, domain, skillKey } = args;
  const rateRaw = summary.firstAttemptSuccessRate;
  const rate = typeof rateRaw === 'number' ? rateRaw : Number(rateRaw);
  if (!Number.isFinite(rate)) return null;

  const htRaw = summary.hintTrend;
  const hintTrend = typeof htRaw === 'string' && TREND_LABELS.has(htRaw) ? htRaw : 'steady';

  const bandRaw = summary.highestStableRange;
  const progressionBand =
    typeof bandRaw === 'string' && PROGRESSION_BANDS.has(bandRaw) ? bandRaw : '1-5';

  const independenceTrend = hintTrend;

  const out: Record<string, unknown> = {
    contractVersion: 'parent-metrics.v1',
    domain,
    skillKey,
    accuracyPct: roundMetric(clampPct(rate), 2),
    hintTrend,
    independenceTrend,
    progressionBand,
  };

  const age = summary.ageBand;
  if (typeof age === 'string' && AGE_BANDS.has(age)) {
    out.ageBand = age;
  }
  if (typeof summary.gatePassed === 'boolean') {
    out.gatePassed = summary.gatePassed;
  }

  const decRaw = summary.decodeAccuracy;
  const dec = typeof decRaw === 'number' ? decRaw : Number(decRaw);
  if (Number.isFinite(dec)) {
    out.decodeAccuracyPct = roundMetric(clampPct(dec), 2);
  }
  const seqRaw = summary.sequenceEvidenceScore;
  const seq = typeof seqRaw === 'number' ? seqRaw : Number(seqRaw);
  if (Number.isFinite(seq)) {
    out.sequenceEvidenceScore = roundMetric(clampPct(seq), 2);
  }
  const listenRaw = summary.listenParticipation;
  const listen = typeof listenRaw === 'number' ? listenRaw : Number(listenRaw);
  if (Number.isFinite(listen)) {
    out.listenParticipationPct = roundMetric(clampPct(listen), 2);
  }

  return out;
}

export async function persistGameAttemptViaPostgrest(
  supabase: SupabaseClient<Database>,
  args: PersistGameAttemptPostgrestArgs,
): Promise<GameAttemptPostgrestResult> {
  const {
    childId,
    gameId,
    clientSessionId,
    levelId,
    startedAt,
    ageBand,
    attemptId,
    attemptIndex,
    score,
    stars,
    durationMs,
    gameSlug,
    levelNumber,
    completed,
    roundsCompleted,
    summaryMetrics,
    parentMetricsV1,
  } = args;

  const basePayload: Record<string, unknown> = {
    source: 'web-game-route',
    gameSlug,
    levelNumber,
    completed,
    roundsCompleted,
    summaryMetrics,
  };

  const trimmedAgeBand =
    ageBand != null && String(ageBand).trim() !== '' ? String(ageBand).trim() : null;
  if (trimmedAgeBand) {
    if (!AGE_BANDS.has(trimmedAgeBand)) {
      return { status: 'failed', errorMessage: 'ageBand must be one of 3-4, 4-5, 5-6, 6-7 when provided' };
    }
    basePayload.dubilandAgeBand = trimmedAgeBand;
  }

  if (parentMetricsV1 != null) {
    const validated = validateAndNormalizeParentMetricsV1(parentMetricsV1 as unknown as Record<string, unknown>);
    if (!validated.ok) {
      return { status: 'failed', errorMessage: validated.message };
    }
    // Domain/skillKey already validated; do not SELECT games.curriculum_domain (not on all DB revisions).
    basePayload.parentMetricsV1 = validated.value;
  } else if (isRecord(summaryMetrics as unknown)) {
    const mapped = resolveParentMetricsDomainAndSkillKeyFromSlug(gameSlug);
    if (mapped) {
      const derived = deriveParentMetricsV1FromSummary({
        summary: summaryMetrics as Record<string, unknown>,
        domain: mapped.domain,
        skillKey: mapped.skillKey,
      });
      if (derived) {
        basePayload.parentMetricsV1 = derived;
      }
    }
  }

  const payload = summarizePayloadForStorage(basePayload);

  let sessionId: string;
  let sessionStartedAtMs: number;
  let sessionEndedAtPrevMs: number | null;

  const trimmedClientSessionId = clientSessionId.trim();
  if (trimmedClientSessionId !== '') {
    const { data: existing, error: selErr } = await supabase
      .from('game_sessions')
      .select('id, game_id, started_at, ended_at')
      .eq('child_id', childId)
      .eq('client_session_id', trimmedClientSessionId)
      .maybeSingle();

    if (selErr) {
      return { status: 'failed', errorMessage: formatPostgrestError(selErr, 'Failed to load session') };
    }

    if (existing?.id) {
      if (existing.game_id !== gameId) {
        return { status: 'failed', errorMessage: 'clientSessionId belongs to a different game' };
      }
      sessionId = existing.id;
      sessionStartedAtMs = Date.parse(existing.started_at as string);
      sessionEndedAtPrevMs = existing.ended_at ? Date.parse(existing.ended_at as string) : null;
    } else {
      const ins = await supabase
        .from('game_sessions')
        .insert({
          child_id: childId,
          game_id: gameId,
          client_session_id: trimmedClientSessionId,
          started_at: startedAt,
        })
        .select('id, started_at, ended_at')
        .single();

      if (ins.error || !ins.data?.id) {
        return {
          status: 'failed',
          errorMessage: formatPostgrestError(ins.error, 'Failed to create session'),
        };
      }
      sessionId = ins.data.id;
      sessionStartedAtMs = Date.parse(ins.data.started_at as string);
      sessionEndedAtPrevMs = ins.data.ended_at ? Date.parse(ins.data.ended_at as string) : null;
    }
  } else {
    const ins = await supabase
      .from('game_sessions')
      .insert({
        child_id: childId,
        game_id: gameId,
        started_at: startedAt,
      })
      .select('id, started_at, ended_at')
      .single();

    if (ins.error || !ins.data?.id) {
      return {
        status: 'failed',
        errorMessage: formatPostgrestError(ins.error, 'Failed to create session'),
      };
    }
    sessionId = ins.data.id;
    sessionStartedAtMs = Date.parse(ins.data.started_at as string);
    sessionEndedAtPrevMs = ins.data.ended_at ? Date.parse(ins.data.ended_at as string) : null;
  }

  if (!Number.isFinite(sessionStartedAtMs)) {
    return { status: 'failed', errorMessage: 'Invalid session started_at' };
  }

  const { score: scoreDb, stars: starsDb, attemptIndex: attemptIndexDb, durationMs: durationMsDb } =
    sanitizeAttemptScalars({ score, stars, attemptIndex, durationMs });

  const levelIdForDb =
    levelId != null && String(levelId).trim() !== '' && UUID_RE.test(String(levelId).trim())
      ? String(levelId).trim()
      : null;

  const attemptRow = {
    session_id: sessionId,
    child_id: childId,
    game_id: gameId,
    level_id: levelIdForDb,
    starting_level_id: null as string | null,
    age_band: trimmedAgeBand,
    mastery_outcome: null as string | null,
    in_support_mode: false,
    support_flags: {} as Json,
    difficulty_profile_id: null as string | null,
    attempt_index: attemptIndexDb,
    score: scoreDb,
    stars: starsDb,
    duration_ms: durationMsDb,
    payload: payloadAsJson(payload),
    id: attemptId,
  };

  const att = await supabase
    .from('game_attempts')
    .upsert(attemptRow as Database['public']['Tables']['game_attempts']['Insert'], { onConflict: 'id' })
    .select('id, created_at, updated_at')
    .maybeSingle();

  let resolvedAttemptId = att.data?.id ?? null;
  if (!resolvedAttemptId) {
    const verify = await supabase.from('game_attempts').select('id').eq('id', attemptId).maybeSingle();
    resolvedAttemptId = verify.data?.id ?? null;
  }
  if (!resolvedAttemptId) {
    return {
      status: 'failed',
      errorMessage: formatPostgrestError(att.error, 'Failed to record attempt'),
    };
  }

  const nowMs = Date.now();
  const skewMs = 120_000;
  const explicitEnd = nowMs;
  const candidateMs = Number.isFinite(explicitEnd) ? explicitEnd : nowMs;
  const maxEndMs = nowMs + skewMs;
  let endMs = Math.min(candidateMs, maxEndMs);
  endMs = Math.max(endMs, sessionStartedAtMs);
  if (sessionEndedAtPrevMs != null && Number.isFinite(sessionEndedAtPrevMs)) {
    endMs = Math.max(endMs, sessionEndedAtPrevMs);
  }

  const endIso = new Date(endMs).toISOString();
  const sessUp = await supabase.from('game_sessions').update({ ended_at: endIso }).eq('id', sessionId);

  if (sessUp.error) {
    return {
      status: 'failed',
      errorMessage: formatPostgrestError(sessUp.error, 'Failed to finalize session'),
    };
  }

  return {
    status: 'persisted',
    sessionId,
    attemptId: resolvedAttemptId,
  };
}
